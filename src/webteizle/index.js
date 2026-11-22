const { sortStreamsByQuality } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
const { fetchWithTimeout } = require("../shared/http.js");
const { ProviderError } = require("../shared/errors.js");
const { pickBestCandidate } = require("../shared/matching.js");
const { unpack } = require("../shared/unpacker.js");
const { asciiFold } = require("../shared/helpers.js");

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
 * Anthology - Webteİzle Provider (High-Performance Sub-Second Resolver)
 * Webteizle.info üzerinden Türkçe dublaj ve Türkçe altyazılı
 * VidMoly, Sibnet ve FileMoon akışlarını optimize paralel resolver ile sunar.
 */

var PROVIDER_NAME = 'Webteİzle';
var BASE_URL     = 'https://webteizle.info';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

var HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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

  var cacheKey = 'movie:' + cleanId;
  if (TMDB_CACHE.has(cacheKey)) {
    var cached = TMDB_CACHE.get(cacheKey);
    if (Date.now() - cached.time < CACHE_TTL_TMDB) {
      return cached.data;
    }
  }

  var isImdb = cleanId.startsWith('tt');
  var info = { titleTr: '', titleEn: '', year: '', imdbId: isImdb ? cleanId : '', numericId: '' };

  if (isImdb) {
    try {
      var fRes = await fetchWithTimeout('https://api.themoviedb.org/3/find/' + cleanId + '?api_key=' + TMDB_API_KEY + '&external_source=imdb_id&language=tr-TR', { signal: signal }, 4000);
      if (fRes.ok) {
        var fData = await fRes.json();
        var match = (fData.movie_results && fData.movie_results[0]) || (fData.tv_results && fData.tv_results[0]);
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
      var res = await fetchWithTimeout('https://api.themoviedb.org/3/movie/' + lookupId + '?api_key=' + TMDB_API_KEY + '&language=tr-TR', { signal: signal }, 4000);
      if (res.ok) {
        var d = await res.json();
        info.titleTr = d.title || d.name || '';
        info.titleEn = d.original_title || d.original_name || '';
        info.year = (d.release_date || d.first_air_date || '').slice(0, 4);
        info.numericId = d.id ? String(d.id) : '';
        if (d.imdb_id) info.imdbId = d.imdb_id;
      }
    } catch (_) {}
  }

  if (info.titleTr || info.titleEn || info.imdbId) {
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

// ── Doğrudan Sitede Arama (q= parametresi ile IMDb veya Başlık) ─────────
async function searchWebteizle(query, signal) {
  if (!query) return null;
  try {
    var r = await fetchWithTimeout(BASE_URL + '/ajax/arama.asp', {
      method: 'POST',
      headers: Object.assign({}, HEADERS, {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': BASE_URL
      }),
      body: 'q=' + encodeURIComponent(query),
      signal: signal
    }, 4000);

    if (r.status === 403) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }
    if (!r.ok) return null;
    var data = await r.json();
    if (data.status !== 'success' || !data.results) return null;

    var rawItems = [];
    if (data.results.filmler && Array.isArray(data.results.filmler.results)) {
      rawItems = rawItems.concat(data.results.filmler.results);
    }
    return rawItems.length > 0 ? rawItems : null;
  } catch (e) {
    if (e && e.code === 'HTTP_BLOCKED') throw e;
    return null;
  }
}

// ── Fast-Path Sayfa ve Film ID Bulucu ──────────────────────────────────
async function findFilmPageAndId(info, signal) {
  var cacheKey = 'film_id:' + (info.imdbId || info.numericId || info.titleTr || info.titleEn);
  if (PAGE_CACHE.has(cacheKey)) {
    var cached = PAGE_CACHE.get(cacheKey);
    if (Date.now() - cached.time < CACHE_TTL_PAGE) {
      return cached.data;
    }
  }

  var candidateSlugs = [];
  var sTr = titleToSlug(info.titleTr);
  var sEn = titleToSlug(info.titleEn);
  if (sTr) candidateSlugs.push(sTr);
  if (sEn && !candidateSlugs.includes(sEn)) candidateSlugs.push(sEn);

  var hadBlock = false;

  // 1. Önce doğrudan slug kalıplarını eşzamanlı yokla
  if (candidateSlugs.length > 0) {
    var directTasks = candidateSlugs.map(async function (slug) {
      var testUrls = [
        BASE_URL + '/izle/dublaj/' + slug,
        BASE_URL + '/izle/altyazi/' + slug
      ];
      for (var url of testUrls) {
        try {
          var r = await fetchWithTimeout(url, { headers: HEADERS, signal: signal }, 3500);
          if (r.status === 403) {
            hadBlock = true;
            return null;
          }
          if (r.ok) {
            var html = await r.text();
            var m = html.match(/id=["']dilsec["'][^>]*data-id=["'](\d+)["']/)
                 || html.match(/data-id="(\d+)"[^>]*id="wip"/)
                 || html.match(/id="wip"[^>]*data-id="(\d+)"/)
                 || html.match(/button[^>]+id="wip"[^>]+data-id="(\d+)"/)
                 || html.match(/data-id="(\d+)"/)
                 || html.match(/data-filmid="(\d+)"/)
                 || html.match(/filmid\s*=\s*['"]?(\d+)['"]?/i);
            if (m && m[1]) {
              return { slug: slug, filmId: m[1] };
            }
          }
        } catch (e) {
          if (e && e.code === 'HTTP_BLOCKED') hadBlock = true;
        }
      }
      return null;
    });

    var directResults = await Promise.all(directTasks);
    if (hadBlock) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }
    var directFound = directResults.find(Boolean);
    if (directFound) {
      PAGE_CACHE.set(cacheKey, { data: directFound, time: Date.now() });
      return directFound;
    }
  }

  // 2. Doğrudan slug tutmazsa: IMDb ID ile arama (q=tt...)
  var foundSlug = null;
  if (info.imdbId) {
    try {
      var imdbItems = await searchWebteizle(info.imdbId, signal);
      if (imdbItems && imdbItems.length > 0 && imdbItems[0].url) {
        var itemUrl = imdbItems[0].url;
        foundSlug = itemUrl.replace('/hakkinda/', '').replace('/izle/dublaj/', '').replace('/izle/altyazi/', '').replace(/^\/+|\/+$/g, '');
      }
    } catch (e) {
      if (e && e.code === 'HTTP_BLOCKED') throw e;
    }
  }

  // 3. Başlık araması ile eşleştirme
  if (!foundSlug) {
    var searchQueries = [info.titleTr, info.titleEn].filter(Boolean);
    for (var q of searchQueries) {
      try {
        var items = await searchWebteizle(q, signal);
        if (items && items.length > 0) {
          var candidates = items.map(function (item) {
            return {
              title: item.title || item.baslik || '',
              url: item.url || '',
              slug: (item.url || '').replace('/hakkinda/', '').replace('/izle/dublaj/', '').replace('/izle/altyazi/', '').replace(/^\/+|\/+$/g, ''),
              year: (item.yil || item.year || (item.title && item.title.match(/\((\d{4})\)/) ? item.title.match(/\((\d{4})\)/)[1] : '')).toString()
            };
          }).filter(function (c) { return Boolean(c.url); });

          var best = pickBestCandidate(candidates, q, info.year);
          if (best && best.slug) {
            foundSlug = best.slug;
            break;
          }
        }
      } catch (e) {
        if (e && e.code === 'HTTP_BLOCKED') throw e;
      }
    }
  }

  if (foundSlug) {
    var testUrls2 = [
      BASE_URL + '/izle/dublaj/' + foundSlug,
      BASE_URL + '/izle/altyazi/' + foundSlug
    ];
    for (var u of testUrls2) {
      try {
        var r2 = await fetchWithTimeout(u, { headers: HEADERS, signal: signal }, 3500);
        if (r2.status === 403) {
          throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
        }
        if (r2.ok) {
          var h2 = await r2.text();
          var m2 = h2.match(/id=["']dilsec["'][^>]*data-id=["'](\d+)["']/)
                || h2.match(/data-id="(\d+)"[^>]*id="wip"/)
                || h2.match(/id="wip"[^>]*data-id="(\d+)"/)
                || h2.match(/button[^>]+id="wip"[^>]+data-id="(\d+)"/)
                || h2.match(/data-id="(\d+)"/)
                || h2.match(/data-filmid="(\d+)"/)
                || h2.match(/filmid\s*=\s*['"]?(\d+)['"]?/i);
          if (m2 && m2[1]) {
            var resObj = { slug: foundSlug, filmId: m2[1] };
            PAGE_CACHE.set(cacheKey, { data: resObj, time: Date.now() });
            return resObj;
          }
        }
      } catch (e) {
        if (e && e.code === 'HTTP_BLOCKED') throw e;
      }
    }
  }

  return null;
}

// ── Alternatifleri Getir (/ajax/dataAlternatif3.asp) ───────────────────
async function fetchAlternatifler(filmId, dil, signal) {
  var body = 'filmid=' + filmId + '&dil=' + dil + '&s=&b=&bot=0';
  try {
    var r = await fetchWithTimeout(BASE_URL + '/ajax/dataAlternatif3.asp', {
      method: 'POST',
      headers: Object.assign({}, HEADERS, { 
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 
        'X-Requested-With': 'XMLHttpRequest', 
        'Origin': BASE_URL 
      }),
      body: body,
      signal: signal
    }, 4000);

    if (r.status === 403) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }
    if (!r.ok) return [];
    var data = await r.json();
    return (data.status === 'success' && Array.isArray(data.data)) ? data.data : [];
  } catch (e) {
    if (e && e.code === 'HTTP_BLOCKED') throw e;
    return [];
  }
}

// ── Embed Çözücü (/ajax/dataEmbed.asp) ─────────────────────────────────
async function fetchEmbedData(embedId, signal) {
  try {
    var r = await fetchWithTimeout(BASE_URL + '/ajax/dataEmbed.asp', {
      method: 'POST',
      headers: Object.assign({}, HEADERS, { 
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 
        'X-Requested-With': 'XMLHttpRequest', 
        'Origin': BASE_URL 
      }),
      body: 'id=' + embedId,
      signal: signal
    }, 4000);

    if (r.status === 403) {
      throw new ProviderError('HTTP_BLOCKED', 'Webteİzle Cloudflare Challenge', 'network', 403);
    }
    if (!r.ok) return null;
    var html = await r.text();

    // 1. vidmoly('6nipillcfz3v', 'rv1')
    var vm = html.match(/vidmoly\s*\(\s*['"]([^'"]+)['"]/i);
    if (vm && vm[1]) {
      return { provider: 'vidmoly', id: vm[1] };
    }

    // 2. Standart iframe src (Sibnet, VidMoly, FileMoon)
    var ifr = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (ifr && ifr[1]) {
      var src = ifr[1];
      if (src.includes('sibnet.ru')) {
        return { provider: 'sibnet', url: src.startsWith('//') ? 'https:' + src : src };
      }
      if (src.includes('vidmoly')) {
        var idM = src.match(/embed-([a-zA-Z0-9]+)/) || src.match(/v=([a-zA-Z0-9]+)/);
        if (idM) return { provider: 'vidmoly', id: idM[1] };
      }
      if (src.includes('filemoon') || src.includes('byse')) {
        return { provider: 'filemoon', url: src.startsWith('//') ? 'https:' + src : src };
      }
    }

    // 3. sibnet('...')
    var sib = html.match(/sibnet\s*\(\s*['"]([^'"]+)['"]/i);
    if (sib && sib[1]) {
      return { provider: 'sibnet', url: 'https://video.sibnet.ru/shell.php?videoid=' + sib[1] };
    }

    return null;
  } catch (e) {
    if (e && e.code === 'HTTP_BLOCKED') throw e;
    return null;
  }
}

// ── Sibnet MP4 Çözücü ─────────────────────────────────────────────────
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

    if (!r.ok) return null;
    var html = await r.text();

    var m = html.match(/["'](\/shell\.php\?videoid=\d+)["']/i)
         || html.match(/player\.src\(\s*\[\s*\{\s*src:\s*["']([^"']+)["']/i)
         || html.match(/src:\s*["']([^"']+\.mp4[^"']*)["']/i);

    if (m) {
      var streamUrl = m[1].startsWith('http') ? m[1] : 'https://video.sibnet.ru' + m[1];
      return { url: streamUrl, type: 'mp4', referer: 'https://video.sibnet.ru/' };
    }
    return null;
  } catch (_) {
    return null;
  }
}

// ── VidMoly M3U8 Akış Çözücü (Net & Biz Fallback) ──────────────────────
async function fetchVidMolyStream(vidmolyId, signal) {
  if (!vidmolyId) return null;
  var targetUrls = [
    'https://vidmoly.net/embed-' + vidmolyId + '.html',
    'https://vidmoly.biz/embed-' + vidmolyId + '.html'
  ];

  for (var targetUrl of targetUrls) {
    try {
      var r = await fetchWithTimeout(targetUrl, { 
        headers: {
          'User-Agent': HEADERS['User-Agent'],
          'Referer': BASE_URL + '/'
        },
        signal: signal
      }, 4000);

      if (!r.ok) continue;
      var html = await r.text();

      // 1. Normal sources / file regex
      var m = html.match(/sources\s*:\s*\[\{\s*file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i)
           || html.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);

      // 2. Packed JS unpacker fallback
      if (!m && typeof unpack === 'function') {
        try {
          var unpacked = unpack(html);
          if (unpacked) {
            m = unpacked.match(/sources\s*:\s*\[\{\s*file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i)
             || unpacked.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
          }
        } catch (_) {}
      }

      if (m && m[1]) {
        return {
          url: m[1],
          referer: 'https://vidmoly.net/'
        };
      }
    } catch (_) {}
  }
  return null;
}

// ── Ana Akış Getirici (getStreams) ────────────────────────────────────
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

    // Webteİzle sitede TV dizilerini SezonlukDizi harici sitesine yönlendirmektedir.
    // Dizi isteklerinde takılmayı ve gecikmeyi önlemek için anında 0 ms'de boş dönülür.
    var isTV = (mediaType === 'tv' || mediaType === 'series');
    if (isTV) {
      return [];
    }

    var info = await fetchTmdbInfo(tmdbId, mediaType, signal);
    var movieName = info.titleTr || info.titleEn;
    if (!movieName) return [];

    var pageData = await findFilmPageAndId(info, signal);
    if (!pageData || !pageData.filmId) return [];

    var filmId = pageData.filmId;

    // Dublaj (dil=0) ve Altyazı (dil=1) alternatiflerini eşzamanlı çek
    var [dublajAlts, altyaziAlts] = await Promise.all([
      fetchAlternatifler(filmId, '0', signal),
      fetchAlternatifler(filmId, '1', signal)
    ]);

    var allAlts = [];
    (dublajAlts || []).forEach(function (a) { allAlts.push({ alt: a, dil: 'TR Dublaj', flag: '🇹🇷 ' }); });
    (altyaziAlts || []).forEach(function (a) { allAlts.push({ alt: a, dil: 'TR Altyazı', flag: '🌐 ' }); });

    if (allAlts.length === 0) return [];

    // Kilitli hostları filtrele
    var sortedAlts = allAlts.filter(function (item) {
      var b = (item.alt.baslik || '').toLowerCase();
      return !TURNSTILE_BLOCKED_HOSTS.some(function (h) { return b.includes(h); });
    });

    // En fazla ilk 4 alternatifi eşzamanlı çöz
    var targetAlts = sortedAlts.slice(0, 4);

    var resolveTasks = targetAlts.map(async function (item) {
      try {
        var embed = await fetchEmbedData(item.alt.id, signal);
        if (!embed) return null;

        // 1. VidMoly HLS Akışı
        if (embed.provider === 'vidmoly') {
          var stream = await fetchVidMolyStream(embed.id, signal);
          if (stream && stream.url) {
            var vmHeaders = {
              'User-Agent': HEADERS['User-Agent'],
              'Referer': stream.referer,
              'Origin': stream.referer.replace(/\/+$/, '')
            };
            var q = item.alt.kalitesi === 0 ? '4K' : (item.alt.kalitesi === 1 ? '1080p' : '720p');
            return {
              name: movieName,
              title: '⌜ Webteİzle ⌟ | VidMoly | ' + item.flag + item.dil,
              url: stream.url,
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

        // 2. Sibnet Doğrudan MP4 Akışı
        if (embed.provider === 'sibnet') {
          var sib = await fetchSibnetStream(embed.url, signal);
          if (sib && sib.url) {
            var sibHeaders = {
              'User-Agent': HEADERS['User-Agent'],
              'Referer': sib.referer,
              'Origin': 'https://video.sibnet.ru'
            };
            var qSib = item.alt.kalitesi === 0 ? '4K' : (item.alt.kalitesi === 1 ? '1080p' : '720p');
            return {
              name: movieName,
              title: '⌜ Webteİzle ⌟ | Sibnet | ' + item.flag + item.dil,
              url: sib.url,
              quality: qSib,
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
      } catch (_) {}
      return null;
    });

    var results = await Promise.all(resolveTasks);
    var streams = [];
    for (var s of results) {
      if (s && !streams.some(function (x) { return x.url === s.url; })) {
        streams.push(s);
      }
    }

    return streams;
  } catch (err) {
    if (err && err.code === 'HTTP_BLOCKED') throw err;
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
