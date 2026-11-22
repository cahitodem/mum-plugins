const { sortStreamsByQuality } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
const { fetchWithTimeout, combineSignals } = require("../shared/http.js");
const { ProviderError } = require("../shared/errors.js");
const { pickBestCandidate, normalizeText } = require("../shared/matching.js");
const { unpack } = require("../shared/unpacker.js");
const { asciiFold, normalizeTurkish } = require("../shared/helpers.js");

var _cfgReady = null;
function cfgReady() {
    if (!_cfgReady) {
        _cfgReady = loadConfig().then(function () {
            var v;
            v = val('urls.movies.webteizle.base'); if (v) BASE_URL = String(v).replace(/\/+$/, '');
            if (HEADERS) HEADERS.Referer = BASE_URL + '/';
        });
    }
    return _cfgReady;
}

/**
 * Anthology - Webteİzle Provider
 * Webteizle.info üzerinden Türkçe dublaj ve Türkçe altyazılı
 * VidMoly, Sibnet ve FileMoon akışlarını optimize paralel resolver ile sunar.
 */

var PROVIDER_NAME = 'Webteİzle';
var BASE_URL     = 'https://webteizle.info';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

var HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  'Referer': BASE_URL + '/'
};

// ── In-Memory TTL Cache ────────────────────────────────────────────────
var TMDB_CACHE = new Map();
var PAGE_CACHE = new Map();
var CACHE_TTL_TMDB = 24 * 60 * 60 * 1000; // 24 saat
var CACHE_TTL_PAGE = 2 * 60 * 60 * 1000;  // 2 saat

// ── Turnstile & Bot Korumalı Kilitli Hostlar ───────────────────────────
var TURNSTILE_BLOCKED_HOSTS = ['pixel', 'netu', 'dzen'];

// ── TMDB Verisi (In-Memory Cached) ────────────────────────────────────
async function fetchTmdbInfo(tmdbId, mediaType, signal) {
  var cleanId = String(tmdbId || '').trim();
  if (cleanId.includes(':')) cleanId = cleanId.split(':')[0];

  var isTV = (mediaType === 'tv' || mediaType === 'series');
  var cacheKey = (isTV ? 'tv:' : 'movie:') + cleanId;

  if (TMDB_CACHE.has(cacheKey)) {
    var cached = TMDB_CACHE.get(cacheKey);
    if (Date.now() - cached.time < CACHE_TTL_TMDB) {
      return cached.data;
    }
  }

  var endpoint = isTV ? 'tv' : 'movie';
  var isImdb = cleanId.startsWith('tt');
  var info = { titleTr: '', titleEn: '', year: '', numericId: '' };

  if (isImdb) {
    try {
      var fRes = await fetchWithTimeout('https://api.themoviedb.org/3/find/' + cleanId + '?api_key=' + TMDB_API_KEY + '&external_source=imdb_id&language=tr-TR', { signal: signal }, 5000);
      if (fRes.ok) {
        var fData = await fRes.json();
        var match = isTV ? (fData.tv_results && fData.tv_results[0]) : (fData.movie_results && fData.movie_results[0]);
        if (!match) match = (fData.movie_results && fData.movie_results[0]) || (fData.tv_results && fData.tv_results[0]);
        if (match) {
          info.titleTr = match.title || match.name || '';
          info.titleEn = match.original_title || match.original_name || '';
          info.year = (match.release_date || match.first_air_date || '').slice(0, 4);
          info.numericId = match.id ? String(match.id) : '';
        }
      }
    } catch (_) {}
  }

  if (!info.titleTr && !info.titleEn) {
    var lookupId = info.numericId || cleanId;
    try {
      var res = await fetchWithTimeout('https://api.themoviedb.org/3/' + endpoint + '/' + lookupId + '?api_key=' + TMDB_API_KEY + '&language=tr-TR', { signal: signal }, 5000);
      if (res.ok) {
        var d = await res.json();
        info.titleTr = d.title || d.name || '';
        info.titleEn = d.original_title || d.original_name || '';
        info.year = (d.release_date || d.first_air_date || '').slice(0, 4);
        info.numericId = d.id ? String(d.id) : '';
      }
    } catch (_) {}
  }

  if (info.titleTr || info.titleEn) {
    TMDB_CACHE.set(cacheKey, { data: info, time: Date.now() });
  }
  return info;
}

// ── Slug Dönüştürücü ──────────────────────────────────────────────────
function titleToSlug(title) {
  if (!title) return '';
  return asciiFold(String(title))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Doğrulamalı Arama (matching.js) ───────────────────────────────────
async function searchWithMatching(queryTitle, targetYear, isTV, signal) {
  if (!queryTitle) return null;
  try {
    var r = await fetchWithTimeout(BASE_URL + '/ajax/arama.asp', {
      method: 'POST',
      headers: Object.assign({}, HEADERS, {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': BASE_URL
      }),
      body: 'q=' + encodeURIComponent(queryTitle),
      signal: signal
    }, 4500);

    if (r.status === 403) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }
    if (!r.ok) return null;

    var data = await r.json();
    if (data.status !== 'success' || !data.results) return null;

    var rawItems = [];
    if (isTV) {
      if (data.results.diziler && Array.isArray(data.results.diziler.results)) {
        rawItems = data.results.diziler.results;
      }
    } else {
      if (data.results.filmler && Array.isArray(data.results.filmler.results)) {
        rawItems = data.results.filmler.results;
      }
    }

    if (!rawItems.length) {
      if (data.results.filmler && Array.isArray(data.results.filmler.results)) rawItems = rawItems.concat(data.results.filmler.results);
      if (data.results.diziler && Array.isArray(data.results.diziler.results)) rawItems = rawItems.concat(data.results.diziler.results);
    }

    if (!rawItems.length) return null;

    var candidates = rawItems.map(function (item) {
      var itemUrl = item.url ? (item.url.startsWith('http') ? item.url : BASE_URL + item.url) : '';
      var itemYear = (item.yil || item.year || '').toString();
      return {
        title: item.baslik || item.title || item.name || '',
        url: itemUrl,
        slug: item.url || '',
        year: itemYear
      };
    }).filter(function (c) { return Boolean(c.url); });

    var best = pickBestCandidate(candidates, queryTitle, targetYear);
    if (!best) return null;

    var pRes = await fetchWithTimeout(best.url, { headers: HEADERS, signal: signal }, 4500);
    if (pRes.status === 403) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }
    if (pRes.ok) {
      var html = await pRes.text();
      return { url: best.url, html: html };
    }
    return null;
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
      throw e;
    }
    return null;
  }
}

// ── Fast-Path Paralel Sayfa Bulucu (0-Saniye Fast-Fail Abort Destekli) ──
async function findFilmPage(info, isTV, signal) {
  var cacheKey = (isTV ? 'tv:' : 'movie:') + (info.numericId || info.titleTr || info.titleEn);
  if (PAGE_CACHE.has(cacheKey)) {
    var cached = PAGE_CACHE.get(cacheKey);
    if (Date.now() - cached.time < CACHE_TTL_PAGE) {
      return cached.data;
    }
  }

  var slugTr = titleToSlug(info.titleTr);
  var slugEn = titleToSlug(info.titleEn);

  var directUrls = [];
  if (slugTr) {
    if (isTV) {
      directUrls.push(BASE_URL + '/dizi/' + slugTr);
    } else {
      directUrls.push(BASE_URL + '/izle/dublaj/' + slugTr);
      directUrls.push(BASE_URL + '/izle/altyazi/' + slugTr);
    }
  }
  if (slugEn && slugEn !== slugTr) {
    if (isTV) {
      directUrls.push(BASE_URL + '/dizi/' + slugEn);
    } else {
      directUrls.push(BASE_URL + '/izle/dublaj/' + slugEn);
      directUrls.push(BASE_URL + '/izle/altyazi/' + slugEn);
    }
  }

  // 0-Saniye Fast-Fail Kontrolörü: İlk 403 alındığında diğer paralel istekleri derhal sonlandırır
  var earlyAbortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var effectiveSignal = signal;
  if (earlyAbortCtrl && typeof combineSignals === 'function') {
    effectiveSignal = signal ? combineSignals([signal, earlyAbortCtrl.signal]) : earlyAbortCtrl.signal;
  }

  var hadBlock = false;

  try {
    // 1. Doğrudan slug denemelerini eşzamanlı (paralel) yap
    var directResults = await Promise.all(directUrls.map(async function (url) {
      try {
        var r = await fetchWithTimeout(url, { headers: HEADERS, signal: effectiveSignal }, 3000);
        if (r.status === 403) {
          hadBlock = true;
          if (earlyAbortCtrl) {
            try { earlyAbortCtrl.abort(); } catch (_) {}
          }
          return null;
        }
        if (r.ok) {
          var html = await r.text();
          if (html.indexOf('data-id') !== -1 || html.indexOf('id="wip"') !== -1 || (isTV && html.indexOf('/dizi/') !== -1)) {
            return { url: url, html: html };
          }
        }
      } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) {
          if (hadBlock) return null;
          throw e;
        }
        if (e && e.code === 'HTTP_BLOCKED') {
          hadBlock = true;
          if (earlyAbortCtrl) {
            try { earlyAbortCtrl.abort(); } catch (_) {}
          }
        }
      }
      return null;
    }));

    if (hadBlock) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }

    var directRes = directResults.find(Boolean) || null;
    if (directRes) {
      PAGE_CACHE.set(cacheKey, { data: directRes, time: Date.now() });
      return directRes;
    }
  } catch (err) {
    if (hadBlock || (err && err.code === 'HTTP_BLOCKED')) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }
    if (err && (err.name === 'AbortError' || err.message === 'TIMEOUT' || (signal && signal.aborted))) {
      throw err;
    }
  }

  // 2. Arama motoru fallback
  var queries = [info.titleTr, info.titleEn].filter(Boolean);
  for (var q of queries) {
    try {
      var searchRes = await searchWithMatching(q, info.year, isTV, signal);
      if (searchRes) {
        PAGE_CACHE.set(cacheKey, { data: searchRes, time: Date.now() });
        return searchRes;
      }
    } catch (e) {
      if (e && e.code === 'HTTP_BLOCKED') {
        throw e;
      }
      if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) {
        throw e;
      }
    }
  }

  return null;
}

// ── HTML Parsers ──────────────────────────────────────────────────────
function parseFilmId(html) {
  var m = html.match(/data-id="(\d+)"[^>]*id="wip"/)
       || html.match(/id="wip"[^>]*data-id="(\d+)"/)
       || html.match(/button[^>]+id="wip"[^>]+data-id="(\d+)"/)
       || html.match(/data-id="(\d+)"/)
       || html.match(/data-filmid="(\d+)"/)
       || html.match(/filmid\s*=\s*['"]?(\d+)['"]?/i);
  return m ? m[1] : null;
}

function parseDilList(html, pageUrl) {
  var diller = [];
  if (html.indexOf('/izle/dublaj/') !== -1 || pageUrl.indexOf('/izle/dublaj/') !== -1) diller.push({ dil: '0', ad: 'TR Dublaj' });
  if (html.indexOf('/izle/altyazi/') !== -1 || pageUrl.indexOf('/izle/altyazi/') !== -1) diller.push({ dil: '1', ad: 'TR Altyazı' });
  if (diller.length === 0) {
    diller.push({ dil: '0', ad: 'TR Dublaj' });
    diller.push({ dil: '1', ad: 'TR Altyazı' });
  }
  return diller;
}

// ── Alternatifleri Getir ──────────────────────────────────────────────
async function fetchAlternatifler(filmId, dil, seasonNum, episodeNum, signal) {
  var body = 'filmid=' + filmId + '&dil=' + dil + '&s=' + (seasonNum || '') + '&b=' + (episodeNum || '') + '&bot=0';
  try {
    var r = await fetchWithTimeout(BASE_URL + '/ajax/dataAlternatif3.asp', {
      method: 'POST',
      headers: Object.assign({}, HEADERS, { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'X-Requested-With': 'XMLHttpRequest', 
        'Origin': BASE_URL 
      }),
      body: body,
      signal: signal
    }, 4500);

    if (r.status === 403) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }
    if (!r.ok) return [];
    var data = await r.json();
    return (data.status === 'success' && Array.isArray(data.data)) ? data.data : [];
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
      throw e;
    }
    return [];
  }
}

// ── Embed Iframe Çözücü ───────────────────────────────────────────────
async function fetchEmbedIframe(embedId, signal) {
  try {
    var r = await fetchWithTimeout(BASE_URL + '/ajax/dataEmbed.asp', {
      method: 'POST',
      headers: Object.assign({}, HEADERS, { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'X-Requested-With': 'XMLHttpRequest', 
        'Origin': BASE_URL 
      }),
      body: 'id=' + embedId,
      signal: signal
    }, 4500);

    if (r.status === 403) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }
    if (!r.ok) return null;

    var html = await r.text();
    var m = html.match(/<iframe[^>]+src="([^"]+)"/i);
    if (m) return m[1];

    var sm = html.match(/(vidmoly|okru|filemoon|dzen|sibnet)\s*\(\s*'([^']+)'/i);
    if (sm) {
      var p = sm[1].toLowerCase();
      var vid = sm[2];
      if (p === 'vidmoly') return 'https://vidmoly.biz/embed-' + vid + '.html';
      if (p === 'okru') return 'https://odnoklassniki.ru/videoembed/' + vid;
      if (p === 'filemoon') return 'https://filemoon.sx/e/' + vid;
      if (p === 'sibnet') return 'https://video.sibnet.ru/shell.php?videoid=' + vid;
    }
    return null;
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
      throw e;
    }
    return null;
  }
}

// ── Sibnet MP4 Çözücü (Blokaj Korumalı) ───────────────────────────────
async function fetchSibnetStream(iframeUrl, signal) {
  try {
    var fullUrl = iframeUrl.startsWith('//') ? 'https:' + iframeUrl : iframeUrl;
    var r = await fetchWithTimeout(fullUrl, {
      headers: {
        'User-Agent': HEADERS['User-Agent'],
        'Referer': 'https://video.sibnet.ru/'
      },
      signal: signal
    }, 3500);

    if (r.status === 403 || !r.ok) return null; // 403 durumunda sessizce elenir, oynatıcı kilitlenmez
    var html = await r.text();

    var m = html.match(/["'](\/shell\.php\?videoid=\d+)["']/i)
         || html.match(/player\.src\(\s*\[\s*\{\s*src:\s*["']([^"']+)["']/i)
         || html.match(/src:\s*["']([^"']+\.mp4[^"']*)["']/i);

    if (m) {
      var streamUrl = m[1].startsWith('http') ? m[1] : 'https://video.sibnet.ru' + m[1];
      return { url: streamUrl, type: 'mp4', referer: 'https://video.sibnet.ru/' };
    }
    return null;
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
      throw e;
    }
    return null;
  }
}

// ── VidMoly M3U8 Çözücü (Unpacker & Segment Proxy Başlıkları) ───────────
async function fetchVidMolyStream(iframeUrl, signal) {
  var fullUrl = iframeUrl.startsWith('//') ? 'https:' + iframeUrl : iframeUrl;
  fullUrl = fullUrl.replace('vidmoly.to', 'vidmoly.biz').replace('vidmoly.net', 'vidmoly.biz').replace('vidmoly.me', 'vidmoly.biz');
  try {
    var r = await fetchWithTimeout(fullUrl, { 
      headers: {
        'User-Agent': HEADERS['User-Agent'],
        'Referer': BASE_URL + '/'
      },
      signal: signal
    }, 4500);

    if (!r.ok) return null;
    var html = await r.text();

    var m = html.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
    if (!m && typeof unpack === 'function') {
      try {
        var unpacked = unpack(html);
        if (unpacked) {
          m = unpacked.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
        }
      } catch (_) {}
    }

    return m ? { url: m[1], type: 'hls', referer: 'https://vidmoly.biz/' } : null;
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
      throw e;
    }
    return null;
  }
}

// ── FileMoon / Byse Çözücü ────────────────────────────────────────────
async function fetchFilemoonStream(iframeUrl, signal) {
  try {
    var fullUrl = iframeUrl.startsWith('//') ? 'https:' + iframeUrl : iframeUrl;
    var r = await fetchWithTimeout(fullUrl, {
      headers: {
        'User-Agent': HEADERS['User-Agent'],
        'Referer': BASE_URL + '/'
      },
      signal: signal
    }, 4500);

    if (!r.ok) return null;
    var html = await r.text();

    var m = html.match(/(?:file|source|src)\s*:\s*['"](https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)['"]/i);
    if (!m && typeof unpack === 'function') {
      try {
        var unpacked = unpack(html);
        if (unpacked) {
          m = unpacked.match(/(?:file|source|src)\s*:\s*['"](https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)['"]/i);
        }
      } catch (_) {}
    }

    return m ? { url: m[1], type: m[1].includes('.mp4') ? 'mp4' : 'hls', referer: fullUrl } : null;
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
      throw e;
    }
    return null;
  }
}

// ── Embed İşleyici (Oynatıcı Segment Başlıkları ile) ───────────────────
async function processEmbed(embedData, dilAd, movieTitle, signal) {
  var baslik = (embedData.baslik || '').toLowerCase();
  if (TURNSTILE_BLOCKED_HOSTS.some(function (h) { return baslik.includes(h); })) return null;

  var src = await fetchEmbedIframe(embedData.id, signal);
  if (!src) return null;

  var flag = dilAd.includes('Dublaj') ? '🇹🇷 ' : '🌐 ';
  var pName = (embedData.baslik || 'Kaynak');
  var q = embedData.kalite || '1080p';

  // 1. VidMoly: HLS Master Stream (Segment Proxy Header Tanımlı)
  if (src.indexOf('vidmoly') !== -1) {
    pName = 'VidMoly';
    var vm = await fetchVidMolyStream(src, signal);
    if (vm) {
      var vmHeaders = {
        'User-Agent': HEADERS['User-Agent'],
        'Referer': 'https://vidmoly.biz/',
        'Origin': 'https://vidmoly.biz'
      };
      return {
        name: movieTitle,
        title: '⌜ Webteİzle ⌟ | ' + pName + ' | ' + flag + dilAd,
        url: vm.url,
        quality: q,
        type: 'hls',
        headers: vmHeaders,
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: { request: vmHeaders }
        },
        provider: 'webteizle'
      };
    }
  }

  // 2. Sibnet: Doğrudan MP4
  if (src.indexOf('sibnet') !== -1) {
    pName = 'Sibnet';
    var sib = await fetchSibnetStream(src, signal);
    if (sib) {
      var sibHeaders = {
        'User-Agent': HEADERS['User-Agent'],
        'Referer': 'https://video.sibnet.ru/',
        'Origin': 'https://video.sibnet.ru'
      };
      return {
        name: movieTitle,
        title: '⌜ Webteİzle ⌟ | ' + pName + ' | ' + flag + dilAd,
        url: sib.url,
        quality: q,
        format: 'mp4',
        type: 'mp4',
        headers: sibHeaders,
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: { request: sibHeaders }
        },
        provider: 'webteizle'
      };
    }
  }

  // 3. FileMoon
  if (src.indexOf('filemoon') !== -1 || src.indexOf('byse') !== -1) {
    pName = 'FileMoon';
    var fm = await fetchFilemoonStream(src, signal);
    if (fm) {
      var fmHeaders = {
        'User-Agent': HEADERS['User-Agent'],
        'Referer': fm.referer
      };
      return {
        name: movieTitle,
        title: '⌜ Webteİzle ⌟ | ' + pName + ' | ' + flag + dilAd,
        url: fm.url,
        quality: q,
        headers: fmHeaders,
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: { request: fmHeaders }
        },
        provider: 'webteizle'
      };
    }
  }

  return null;
}

// ── Ana Fonksiyon (getStreams) ────────────────────────────────────────
async function getStreams(tmdbId, mediaType, season, episode, options) {
  const signal = options && options.signal;
  try {
    if (typeof tmdbId === 'object' && tmdbId !== null) {
      mediaType = tmdbId.type || mediaType;
      season = tmdbId.season || season;
      episode = tmdbId.episode || episode;
      tmdbId = tmdbId.id;
    }
    if (typeof tmdbId === 'string' && tmdbId.indexOf(':') !== -1 && !tmdbId.startsWith('webteizle:')) {
      tmdbId = tmdbId.split(':')[0];
    }
    var isTV = (mediaType === 'tv' || mediaType === 'series');

    var info = await fetchTmdbInfo(tmdbId, mediaType, signal);
    var movieName = info.titleTr || info.titleEn;
    if (!movieName) return [];

    var pageResult = await findFilmPage(info, isTV, signal);
    if (!pageResult || !pageResult.html) return [];

    var filmId = parseFilmId(pageResult.html);
    if (!filmId) return [];

    var diller = parseDilList(pageResult.html, pageResult.url);
    var streams = [];

    // İki dilin alternatiflerini paralel çek
    var altResults = await Promise.all(diller.map(function (d) {
      return fetchAlternatifler(filmId, d.dil, season, episode, signal).then(function (embedList) {
        return { dil: d, embedList: embedList };
      });
    }));

    // Bounded Concurrency ile embedleri paralel çöz
    var tasks = [];
    for (var res of altResults) {
      var d = res.dil;
      var embedList = res.embedList || [];
      for (var e of embedList) {
        tasks.push(processEmbed(e, d.ad, movieName, signal));
      }
    }

    var resolvedStreams = await Promise.all(tasks);
    for (var s of resolvedStreams) {
      if (s && !streams.some(function (x) { return x.url === s.url; })) {
        streams.push(s);
      }
    }

    return streams;
  } catch (err) {
    if (err && (err.name === 'AbortError' || err.message === 'TIMEOUT' || err.name === 'ProviderError' || (signal && signal.aborted))) {
      throw err;
    }
    return [];
  }
}

// ── Universal Quality Sorter ──────────────────────────────────────────
if (typeof getStreams === "function") {
    var _origGetStreams = getStreams;
    getStreams = async function () {
        var res = await _origGetStreams.apply(this, arguments);
        return sortStreamsByQuality(res);
    };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = wrapAll({ getStreams: getStreams }, cfgReady);
} else {
  global.WebteIzleProvider = { getStreams: getStreams };
}
