// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
var _nodeCrypto = null;
try {
  _nodeCrypto = require('crypto');
} catch (_) {}

function getCryptoJS() {
  if (typeof globalThis !== 'undefined' && globalThis.CryptoJS) return globalThis.CryptoJS;
  if (typeof CryptoJS !== 'undefined') return CryptoJS;
  try {
    return require('crypto-js');
  } catch (_) {
    return null;
  }
}
const cheerio = require('cheerio-without-node-native');
const { sortStreamsByQuality, filterHighestQuality } = require('../shared/quality.js');
const { loadConfig, val, wrapAll } = require('../shared/config.js');
const { fetchWithTimeout } = require('../shared/http.js');
const { ProviderError } = require('../shared/errors.js');
const { pickBestCandidate } = require('../shared/matching.js');

var _cfgReady = null;
function cfgReady() {
  if (!_cfgReady) {
    _cfgReady = loadConfig().then(function() {
      var v = val('urls.series.roketdizi.base') || val('urls.movies.roketdizi.base') || val('urls.roketdizi.base');
      if (v) BASE_URL = String(v).replace(/\/+$/, '');
      if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + '/';
    }).catch(function() {});
  }
  return _cfgReady;
}

/**
 * MUM - RoketDizi Provider
 * roketdizi.life arşivi üzerinden dizi ve filmler için
 * PBKDF2/AES-256-CBC deşifreleme ve Pichive NP_GATE PoW çözümlemeli
 * Türkçe Dublaj ve Türkçe Altyazılı HLS akışları sunar.
 */

var PROVIDER_NAME = 'RoketDizi';
var BASE_URL = 'https://roketdizi.life';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

var WORKING_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  'Referer': BASE_URL + '/'
};

// ── TMDB Metadata Çözümleme ──────────────────────────────────────────
async function resolveTmdbInfo(id, mediaType, signal) {
  try {
    var cleanId = String(id || '').trim();
    if (cleanId.includes(':')) cleanId = cleanId.split(':')[0];

    var numericId = null;
    var titleTr = '';
    var titleEn = '';
    var origTitle = '';
    var year = '';
    var originCountries = [];
    var origLanguage = '';
    var imdbId = cleanId.startsWith('tt') ? cleanId : null;

    if (cleanId.startsWith('tt')) {
      var findRes = await fetchWithTimeout(
        'https://api.themoviedb.org/3/find/' + cleanId + '?api_key=' + TMDB_API_KEY + '&external_source=imdb_id',
        { signal: signal },
        8000
      );
      if (findRes.ok) {
        var fData = await findRes.json();
        var item = (mediaType === 'movie')
          ? (fData.movie_results && fData.movie_results[0])
          : ((fData.tv_results && fData.tv_results[0]) || (fData.movie_results && fData.movie_results[0]));
        if (item) {
          numericId = item.id;
          titleEn = item.title || item.name || '';
          origTitle = item.original_title || item.original_name || '';
          var date = item.release_date || item.first_air_date || '';
          if (date) year = String(date).split('-')[0];
          if (Array.isArray(item.origin_country)) originCountries = item.origin_country;
          if (item.original_language) origLanguage = item.original_language;
        }
      }
    } else {
      numericId = cleanId;
    }

    if (numericId) {
      var endpoint = (mediaType === 'movie') ? 'movie' : 'tv';
      // 1. Türkçe başlık çekme
      var tRes = await fetchWithTimeout(
        'https://api.themoviedb.org/3/' + endpoint + '/' + numericId + '?api_key=' + TMDB_API_KEY + '&language=tr-TR',
        { signal: signal },
        8000
      );
      if (tRes.ok) {
        var tData = await tRes.json();
        titleTr = tData.title || tData.name || '';
        origTitle = tData.original_title || tData.original_name || origTitle;
        var tDate = tData.release_date || tData.first_air_date || '';
        if (!year && tDate) year = String(tDate).split('-')[0];
        if (Array.isArray(tData.origin_country) && tData.origin_country.length > 0) {
          originCountries = tData.origin_country;
        } else if (Array.isArray(tData.production_countries) && tData.production_countries.length > 0) {
          originCountries = tData.production_countries.map(function(p) { return p.iso_3166_1; }).filter(Boolean);
        }
        if (tData.original_language) origLanguage = tData.original_language;
        if (tData.external_ids && tData.external_ids.imdb_id) imdbId = tData.external_ids.imdb_id;
        else if (tData.imdb_id) imdbId = tData.imdb_id;
      }

      // 2. İngilizce / Uluslararası başlık çekme
      var enRes = await fetchWithTimeout(
        'https://api.themoviedb.org/3/' + endpoint + '/' + numericId + '?api_key=' + TMDB_API_KEY + '&language=en-US',
        { signal: signal },
        8000
      );
      if (enRes.ok) {
        var enData = await enRes.json();
        titleEn = enData.title || enData.name || titleEn;
        if (!origTitle) origTitle = enData.original_title || enData.original_name || '';
        var enDate = enData.release_date || enData.first_air_date || '';
        if (!year && enDate) year = String(enDate).split('-')[0];
        if (!origLanguage && enData.original_language) origLanguage = enData.original_language;
        if (!imdbId && enData.external_ids && enData.external_ids.imdb_id) imdbId = enData.external_ids.imdb_id;
      }
    }

    var title = titleTr || titleEn || origTitle;
    return {
      title: title,
      titleTr: titleTr,
      titleEn: titleEn,
      origTitle: origTitle,
      numericId: numericId,
      year: year,
      originCountries: originCountries,
      origLanguage: origLanguage,
      imdbId: imdbId
    };
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
    return {
      title: '',
      titleTr: '',
      titleEn: '',
      origTitle: '',
      numericId: id,
      year: '',
      originCountries: [],
      origLanguage: '',
      imdbId: (typeof id === 'string' && id.startsWith('tt')) ? id.split(':')[0] : null
    };
  }
}

// ── Arama ve Aday Ayrıştırma ──────────────────────────────────────────
function parseSearchResults(html) {
  var $ = cheerio.load(html);
  var candidates = [];
  var seenHrefs = Object.create(null);

  // 1. HTML <a> etiketlerinden aday çıkarma
  $('a[href]').each(function(i, el) {
    var href = $(el).attr('href');
    if (!href || seenHrefs[href]) return;
    if (href.startsWith('/dizi/') || href.startsWith('/film/')) {
      seenHrefs[href] = true;
      var aria = $(el).attr('aria-label') || '';
      var title = '';
      var year = '';
      if (aria) {
        var ariaMatch = aria.match(/^(.*?),\s*(\d{4})/);
        if (ariaMatch) {
          title = ariaMatch[1].trim();
          year = ariaMatch[2].trim();
        } else {
          var parts = aria.split(',').map(function(s) { return s.trim(); });
          title = parts[0] || '';
          if (parts[1] && /^\d{4}$/.test(parts[1])) year = parts[1];
        }
      }
      if (!title) {
        title = $(el).text().trim() || href.replace('/izle', '').split('/').filter(Boolean).pop();
      }
      var slug = href.replace('/izle', '').split('/').filter(Boolean).pop();
      candidates.push({
        title: title,
        href: href,
        slug: slug,
        year: year,
        type: href.startsWith('/film/') ? 'movie' : 'tv'
      });
    }
  });

  // 2. Next.js hydration scriptlerinden (self.__next_f) aday çıkarma
  var scriptRegex = /"items":\s*(\[[^\]]+\])/g;
  var match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      var items = JSON.parse(match[1]);
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var itemHref = item.href;
        if (!itemHref || seenHrefs[itemHref]) continue;
        seenHrefs[itemHref] = true;
        var itemSlug = itemHref.replace('/izle', '').split('/').filter(Boolean).pop();
        candidates.push({
          title: item.t || item.title || itemSlug,
          href: itemHref,
          slug: itemSlug,
          year: String(item.year || item._year || ''),
          type: (item.kind === 'film' || itemHref.startsWith('/film/')) ? 'movie' : 'tv'
        });
      }
    } catch (_) {}
  }

  return candidates;
}

function toSlug(text) {
  return String(text || '').toLowerCase()
    .replace(/[ğĞ]/g, 'g').replace(/[üÜ]/g, 'u').replace(/[şŞ]/g, 's')
    .replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function searchRoketDizi(query, mediaType, signal) {
  var searchUrls = [];
  if (mediaType === 'movie') {
    searchUrls.push(BASE_URL + '/film-izle?s=' + encodeURIComponent(query));
    searchUrls.push(BASE_URL + '/arama-yap?s=' + encodeURIComponent(query));
  } else {
    searchUrls.push(BASE_URL + '/arama-yap?s=' + encodeURIComponent(query));
    searchUrls.push(BASE_URL + '/film-izle?s=' + encodeURIComponent(query));
  }

  var candidates = [];
  var seen = Object.create(null);

  for (var u of searchUrls) {
    try {
      var res = await fetchWithTimeout(u, { headers: WORKING_HEADERS, signal: signal }, 8000);
      if (res.status === 403) {
        throw new ProviderError('HTTP_BLOCKED', 'RoketDizi Cloudflare Challenge', 'search', 403);
      }
      if (res.ok) {
        var html = await res.text();
        var cands = parseSearchResults(html);
        for (var c of cands) {
          if (!seen[c.href]) {
            seen[c.href] = true;
            candidates.push(c);
          }
        }
        if (candidates.length > 0) break;
      }
    } catch (e) {
      if (e && e.code === 'HTTP_BLOCKED') throw e;
    }
  }

  return candidates;
}

// ── AES-256-CBC Deşifreleme ───────────────────────────────────────────
function extractEncParams(html) {
  if (!html) return null;
  var encMatch = html.match(/\\"enc\\"\s*:\s*\{\\"ciphertext\\"\s*:\s*\\"([^"\\]+)\\",\\"iv\\"\s*:\s*\\"([0-9a-fA-F]+)\\",\\"salt\\"\s*:\s*\\"([0-9a-fA-F]+)\\"\}\s*,\s*\\"k\\"\s*:\s*\\"([^"\\]+)\\"/);
  if (encMatch) {
    return {
      ciphertext: encMatch[1],
      iv: encMatch[2],
      salt: encMatch[3],
      k: encMatch[4]
    };
  }
  var unescapedMatch = html.match(/"enc"\s*:\s*\{"ciphertext"\s*:\s*"([^"]+)","iv"\s*:\s*"([0-9a-fA-F]+)","salt"\s*:\s*"([0-9a-fA-F]+)"\}\s*,\s*"k"\s*:\s*"([^"]+)"/);
  if (unescapedMatch) {
    return {
      ciphertext: unescapedMatch[1],
      iv: unescapedMatch[2],
      salt: unescapedMatch[3],
      k: unescapedMatch[4]
    };
  }
  return null;
}

function decryptPlayer(enc) {
  if (!enc || !enc.ciphertext || !enc.iv || !enc.salt || !enc.k) return null;

  // 1. Nuvio QuickJS / Browser ortamı: CryptoJS ile PBKDF2 SHA-512 + AES-256-CBC
  var CJS = getCryptoJS();
  if (CJS && CJS.PBKDF2 && CJS.AES && CJS.enc) {
    try {
      var saltWa = CJS.enc.Hex.parse(enc.salt);
      var ivWa = CJS.enc.Hex.parse(enc.iv);
      var hasher = (CJS.algo && CJS.algo.SHA512) || 'SHA512';
      var keyWa = CJS.PBKDF2(enc.k, saltWa, { keySize: 8, iterations: 999, hasher: hasher });
      var mode = (CJS.mode && CJS.mode.CBC) || 'CBC';
      var padding = (CJS.pad && CJS.pad.Pkcs7) || 'Pkcs7';
      var decWa = CJS.AES.decrypt(enc.ciphertext, keyWa, { iv: ivWa, mode: mode, padding: padding });
      var result = decWa.toString(CJS.enc.Utf8);
      if (result) return result.trim();
    } catch (_) {}
  }

  // 2. Node.js ortamı: crypto modülü ile fallback
  if (_nodeCrypto && typeof Buffer !== 'undefined') {
    try {
      var key = _nodeCrypto.pbkdf2Sync(Buffer.from(enc.k, 'utf8'), Buffer.from(enc.salt, 'hex'), 999, 32, 'sha512');
      var decipher = _nodeCrypto.createDecipheriv('aes-256-cbc', key, Buffer.from(enc.iv, 'hex'));
      var decrypted = Buffer.concat([
        decipher.update(Buffer.from(enc.ciphertext, 'base64')),
        decipher.final()
      ]).toString('utf8');
      return decrypted.trim();
    } catch (_) {}
  }

  return null;
}

// ── Pichive NP_GATE PoW Çözücü ve NP_CONFIG Ayrıştırıcı ───────────────
function solveNpGate(gate) {
  if (!gate || !gate.n) return null;
  var nonce = gate.n;
  var cmiy = String.fromCharCode(75, 83, 102, 76, 107, 83, 86, 73, 77, 84); // "KSfLkSVIMT"

  // 1. Nuvio QuickJS / Browser ortamı: CryptoJS.SHA256
  var CJS = getCryptoJS();
  if (CJS && CJS.SHA256) {
    try {
      for (var i = 0; i <= 100000; i++) {
        var hashWa = CJS.SHA256(i + '|' + cmiy + '|' + nonce);
        if (hashWa && hashWa.words && (hashWa.words[5] >>> 20) === 0) {
          return String(i);
        }
      }
    } catch (_) {}
  }

  // 2. Node.js ortamı: crypto.createHash
  if (_nodeCrypto && typeof Buffer !== 'undefined') {
    try {
      for (var j = 0; j <= 100000; j++) {
        var hash = _nodeCrypto.createHash('sha256').update(j + '|' + cmiy + '|' + nonce).digest();
        if ((hash.readUInt32BE(20) >>> 20) === 0) {
          return j.toString();
        }
      }
    } catch (_) {}
  }

  return null;
}

function parseNpGate(html, config) {
  if (config && config.gate && config.gate.n) {
    return config.gate;
  }
  if (!html) return null;
  var gateMatch = html.match(/"gate"\s*:\s*\{\s*"n"\s*:\s*"([a-zA-Z0-9_-]+)"/i);
  if (gateMatch) {
    return { n: gateMatch[1] };
  }
  var match = html.match(/(?:window\.)?NP_GATE\s*=\s*({[\s\S]*?});/i);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (_) {
      try {
        var fixed = match[1].replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":').replace(/'/g, '"');
        return JSON.parse(fixed);
      } catch (_) {
        try { return new Function('return ' + match[1])(); } catch (_) {}
      }
    }
  }
  var nMatch = html.match(/(?:window\.)?NP_GATE[\s\S]*?["']?n["']?\s*:\s*["']?([a-zA-Z0-9_-]+)["']?/i) ||
               html.match(/["']?n["']?\s*:\s*["']([a-zA-Z0-9_-]+)["']/i);
  if (nMatch) {
    return { n: nMatch[1] };
  }
  return null;
}

function parseNpConfig(html) {
  if (!html) return null;
  var match = html.match(/(?:window\.)?NP_CONFIG\s*=\s*(\{[\s\S]*?\});(?:\s*window|\s*<|\s*$)/i) ||
              html.match(/(?:window\.)?NP_CONFIG\s*=\s*(\{[\s\S]*?\});/i);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (_) {
      try {
        var fixed = match[1].replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":').replace(/'/g, '"');
        return JSON.parse(fixed);
      } catch (_) {
        try { return new Function('return ' + match[1])(); } catch (_) {}
      }
    }
  }
  var fileMatch = html.match(/["']?file["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
  if (fileMatch) {
    return { file: fileMatch[1] };
  }
  return null;
}

function appendSolution(url, solution) {
  if (!url || !solution) return url;
  if (/[?&]p=/.test(url)) return url;
  var sep = url.indexOf('?') >= 0 ? '&' : '?';
  return url + sep + 'p=' + solution;
}

function toAbsoluteUrl(url, baseUrl) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return 'https:' + url;
  try {
    return new URL(url, baseUrl).href;
  } catch (_) {
    return url;
  }
}

// ── Iframe Çözümleyici ────────────────────────────────────────────────
async function resolveIframe(iframeUrl, isDublaj, qualityLabel, displayName, seasonNum, episodeNum, mediaType, signal) {
  var normalizedIframeUrl = toAbsoluteUrl(iframeUrl, BASE_URL);
  if (!/^https?:\/\//i.test(normalizedIframeUrl)) return null;

  var langFlag = isDublaj ? '🇹🇷 Türkçe Dublaj' : '🌐 Türkçe Altyazı';
  var streamTitle = (mediaType === 'movie')
    ? '⌜ ' + PROVIDER_NAME + ' ⌟ | RoketTV | ' + langFlag
    : '⌜ ' + PROVIDER_NAME + ' ⌟ | RoketTV | ' + langFlag + ' · ' + seasonNum + '. Sezon ' + episodeNum + '. Bölüm';

  // Doğrudan video akışı verilmişse doğrudan nesneyi oluştur
  if (/\.(?:m3u8|mp4)(?:[?#]|$)/i.test(normalizedIframeUrl)) {
    var isDirectMp4 = normalizedIframeUrl.includes('.mp4');
    var dHeaders = {
      'User-Agent': WORKING_HEADERS['User-Agent'],
      'Referer': BASE_URL + '/'
    };

    return {
      name: displayName,
      title: streamTitle,
      url: normalizedIframeUrl,
      quality: qualityLabel || '1080p',
      type: isDirectMp4 ? 'mp4' : 'hls',
      headers: dHeaders,
      behaviorHints: {
        notWebReady: true,
        proxyHeaders: { request: dHeaders }
      },
      subtitles: [],
      provider: 'roketdizi'
    };
  }

  try {
    // Iframe sayfasını çek
    var res = await fetchWithTimeout(normalizedIframeUrl, {
      headers: {
        'User-Agent': WORKING_HEADERS['User-Agent'],
        'Referer': BASE_URL + '/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: signal
    }, 7000);

    if (!res.ok) {
      return null;
    }

    var iframeHtml = await res.text();

    // NP_CONFIG ayrıştır
    var config = parseNpConfig(iframeHtml);

    // NP_GATE PoW çözümle
    var gate = parseNpGate(iframeHtml, config);
    var solution = solveNpGate(gate);

    var streamUrl = '';
    var tracks = [];

    if (config) {
      if (typeof config.file === 'string') {
        streamUrl = config.file;
      } else if (Array.isArray(config.sources) && config.sources.length > 0) {
        for (var s = 0; s < config.sources.length; s++) {
          var srcObj = config.sources[s];
          if (srcObj) {
            var candidateUrl = srcObj.master || srcObj.file || srcObj.src || srcObj.url || '';
            if (candidateUrl) {
              streamUrl = candidateUrl;
              break;
            }
          }
        }
      } else if (typeof config.stream === 'string') {
        streamUrl = config.stream;
      } else if (typeof config.url === 'string') {
        streamUrl = config.url;
      }
      if (Array.isArray(config.subtitles)) {
        tracks = config.subtitles;
      } else if (Array.isArray(config.tracks)) {
        tracks = config.tracks;
      }
    }

    // Fallback: Regex ile streamUrl ara
    if (!streamUrl) {
      var m3u8Match = iframeHtml.match(/["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)["']/i) ||
                      iframeHtml.match(/["'](https?:\/\/[^"'\s]+\/nm\.php\?v=[^"'\s]*)["']/i);
      if (m3u8Match) streamUrl = m3u8Match[1];
    }

    if (!streamUrl) {
      return null;
    }

    streamUrl = toAbsoluteUrl(streamUrl, normalizedIframeUrl);
    if (!/^https?:\/\//i.test(streamUrl)) {
      return null;
    }

    // PoW çözümünü akış URL'sine ekle
    var finalStreamUrl = appendSolution(streamUrl, solution);

    // Altyazıları biçimlendir
    var subtitles = [];
    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      var subFile = t.file || t.src || t.url;
      if (subFile) {
        var fullSubUrl = toAbsoluteUrl(subFile, normalizedIframeUrl);
        if (/^https?:\/\//i.test(fullSubUrl)) {
          subtitles.push({
            url: appendSolution(fullSubUrl, solution),
            language: t.srclang || t.language || t.lang || t.label || 'tr',
            label: t.label || t.title || 'Türkçe'
          });
        }
      }
    }

    // Eğer tracks bulunamadıysa HTML içindeki VTT/SRT linklerini topla
    if (subtitles.length === 0) {
      var subMatches = iframeHtml.matchAll(/["'](https?:\/\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi);
      for (var sm of subMatches) {
        var sUrl = sm[1];
        if (!subtitles.some(function(x) { return x.url.startsWith(sUrl); })) {
          subtitles.push({
            url: appendSolution(sUrl, solution),
            language: 'tr',
            label: 'Türkçe'
          });
        }
      }
    }

    var sHeaders = {
      'User-Agent': WORKING_HEADERS['User-Agent'],
      'Referer': normalizedIframeUrl
    };

    var isMp4 = finalStreamUrl.includes('.mp4');

    return {
      name: displayName,
      title: streamTitle,
      url: finalStreamUrl,
      quality: qualityLabel || '1080p',
      type: isMp4 ? 'mp4' : 'hls',
      headers: sHeaders,
      behaviorHints: {
        notWebReady: true,
        proxyHeaders: { request: sHeaders }
      },
      subtitles: subtitles,
      provider: 'roketdizi'
    };
  } catch (err) {
    if (err && (err.name === 'AbortError' || err.message === 'TIMEOUT')) throw err;
    return null;
  }
}

// ── Ana Akış Getirici (getStreams) ────────────────────────────────────
async function getStreams(tmdbId, mediaType, seasonNum, episodeNum, options) {
  var signal = options && options.signal;
  try {
    mediaType = mediaType === 'series' ? 'tv' : mediaType;

    // 1. TMDB Meta Verisi
    var info = await resolveTmdbInfo(tmdbId, mediaType, signal);

    // Yerli TR yapım izolasyonu:
    // RoketDizi yabancı dizi ve Kore/Asya dizileri sitesidir; yerli Türk dizilerini içermez.
    // Orijinal dili Türkçe ve menşei sadece Türkiye olan yerli dizilerde (Exxen, BluTV, Gain vb.)
    // yabancı dizi sitelerinde arama yapmak yanlış homonim akışlara (örn. Karma vs Akyeon) yol açar.
    var isPureTurkishSeries = (
      mediaType !== 'movie' &&
      info.origLanguage === 'tr' &&
      Array.isArray(info.originCountries) &&
      info.originCountries.length === 1 &&
      info.originCountries[0] === 'TR'
    );
    if (isPureTurkishSeries) {
      return [];
    }

    var searchQueries = [...new Set([info.titleTr, info.titleEn, info.origTitle, info.title].filter(Boolean))];
    if (searchQueries.length === 0) {
      return [];
    }

    // 2. RoketDizi üzerinde arama ve eşleştirme
    var best = null;
    for (var q of searchQueries) {
      try {
        var candidates = await searchRoketDizi(q, mediaType, signal);
        if (candidates && candidates.length > 0) {
          best = pickBestCandidate(candidates, q, info.year, { minCoverage: 0.75, minScore: 50 });
          if (best) break;
        }
      } catch (errSearch) {
        if (errSearch && errSearch.code === 'HTTP_BLOCKED') throw errSearch;
      }
    }

    if (!best) {
      throw new ProviderError('NO_MATCH', 'No matching title found on RoketDizi', 'matching');
    }

    var displayName = info.title || info.origTitle || best.title;

    // 3. Bölüm / Film sayfasının tespiti
    var pageUrl = '';
    if (mediaType === 'movie') {
      var movieSlug = best.slug || best.href.replace('/izle', '').split('/').filter(Boolean).pop();
      pageUrl = BASE_URL + '/film/' + movieSlug + '/izle';
    } else {
      var tvSlug = best.slug || best.href.split('/').filter(Boolean).pop();
      // Önce doğrudan tahmin edilen bölüm URL'sini dene
      pageUrl = BASE_URL + '/dizi/' + tvSlug + '/sezon-' + seasonNum + '/bolum-' + episodeNum;
    }

    var pageRes = await fetchWithTimeout(pageUrl, { headers: WORKING_HEADERS, signal: signal }, 8000);
    if (pageRes.status === 403) {
      throw new ProviderError('HTTP_BLOCKED', 'RoketDizi Cloudflare Challenge', 'player', 403);
    }

    var pageHtml = '';
    if (pageRes.ok) {
      pageHtml = await pageRes.text();
    }

    var targetImdb = info.imdbId || (typeof tmdbId === 'string' && tmdbId.startsWith('tt') ? tmdbId.split(':')[0] : null);
    if (targetImdb && pageHtml) {
      var imdbMatch = pageHtml.match(/imdb\.com\/title\/(tt\d+)/i) || pageHtml.match(/"(?:mj)?imdb(?:href)?"\s*:\s*"[^"]*?(tt\d+)/i);
      var pageImdb = imdbMatch ? imdbMatch[1].toLowerCase() : null;
      if (pageImdb && pageImdb !== targetImdb.toLowerCase()) {
        return [];
      }
    }

    // Dizi için doğrudan URL bulunamadıysa veya enc içermiyorsa ana dizi sayfasından bölüm bağlantısını tara
    if (mediaType === 'tv' && (!pageHtml || !pageHtml.includes('enc'))) {
      var seriesUrl = BASE_URL + '/dizi/' + tvSlug;
      var seriesRes = await fetchWithTimeout(seriesUrl, { headers: WORKING_HEADERS, signal: signal }, 8000);
      if (seriesRes.ok) {
        var seriesHtml = await seriesRes.text();
        var $s = cheerio.load(seriesHtml);
        var epPattern = new RegExp('/sezon-' + seasonNum + '/bolum-' + episodeNum + '(?:-[a-zA-Z0-9]+)?(?:[/?#]|$)', 'i');
        var foundEpHref = null;
        $s('a[href]').each(function(i, el) {
          var h = $s(el).attr('href');
          if (h && epPattern.test(h)) {
            foundEpHref = h;
            return false;
          }
        });
        if (foundEpHref) {
          pageUrl = toAbsoluteUrl(foundEpHref, BASE_URL);
          var epRes = await fetchWithTimeout(pageUrl, { headers: WORKING_HEADERS, signal: signal }, 8000);
          if (epRes.ok) {
            pageHtml = await epRes.text();
          }
        }
      }
    }

    if (!pageHtml) {
      return [];
    }

    // 4. Şifreli oynatıcı parametrelerini ve oynatıcı kaynaklarını çıkar
    var initialEnc = extractEncParams(pageHtml);
    if (!initialEnc) {
      return [];
    }

    var defaultIframe = decryptPlayer(initialEnc);
    if (!defaultIframe) {
      return [];
    }

    // Sayfa üzerindeki oynatıcı kaynak listesini tara (Türkçe Dublaj / Altyazılı varyantlar)
    var sourcesMatch = pageHtml.match(/\\"sources\\":(\[[^\]]+\])/) || pageHtml.match(/"sources":(\[[^\]]+\])/);
    var sources = [];
    if (sourcesMatch) {
      try {
        var rawSourcesJson = sourcesMatch[1].replace(/\\"/g, '"');
        sources = JSON.parse(rawSourcesJson);
      } catch (_) {}
    }

    // Varsayılan sayfanın dilini tespit et
    var isDefaultDub = /"dub":\s*true/i.test(pageHtml) || /Türkçe Dublaj/i.test(pageHtml);

    // Oynatıcı görevlerini hazırla (Varsayılan + Alternatif Dil Varyantı)
    var playerTasks = [];

    // Görev 1: Varsayılan oynatıcı
    playerTasks.push({
      iframeUrl: defaultIframe,
      isDub: isDefaultDub,
      quality: '1080p'
    });

    // Görev 2: Eğer varsa ters dil seçeneği (?player=... parametreli)
    var altSource = null;
    for (var s = 0; s < sources.length; s++) {
      var src = sources[s];
      if (!src || !src.href || !src.href.includes('player=')) continue;
      var srcIsDub = (src.dub === true) || (src.label && src.label.includes('Dublaj'));
      if (srcIsDub !== isDefaultDub) {
        altSource = src;
        break;
      }
    }

    if (altSource && altSource.href) {
      var altUrl = toAbsoluteUrl(altSource.href, BASE_URL);
      try {
        var altRes = await fetchWithTimeout(altUrl, { headers: WORKING_HEADERS, signal: signal }, 6000);
        if (altRes.ok) {
          var altHtml = await altRes.text();
          var altEnc = extractEncParams(altHtml);
          if (altEnc) {
            var altIframe = decryptPlayer(altEnc);
            if (altIframe && altIframe !== defaultIframe) {
              playerTasks.push({
                iframeUrl: altIframe,
                isDub: !isDefaultDub,
                quality: altSource.quality ? altSource.quality.toLowerCase() : '1080p'
              });
            }
          }
        }
      } catch (_) {}
    }

    // 5. Oynatıcı iframe'lerini çöz ve akışları biçimlendir
    var streams = [];
    var resolvePromises = playerTasks.map(function(task) {
      return resolveIframe(
        task.iframeUrl,
        task.isDub,
        task.quality,
        displayName,
        seasonNum,
        episodeNum,
        mediaType,
        signal
      ).catch(function(err) {
        if (err && err.code === 'HTTP_BLOCKED') throw err;
        return null;
      });
    });

    var resolvedResults = await Promise.all(resolvePromises);
    var seenStreamUrls = Object.create(null);

    for (var r = 0; r < resolvedResults.length; r++) {
      var st = resolvedResults[r];
      if (st && st.url && !seenStreamUrls[st.url]) {
        seenStreamUrls[st.url] = true;
        streams.push(st);
      }
    }

    return streams;
  } catch (err) {
    if (err && (err.name === 'ProviderError' || err.name === 'AbortError' || err.message === 'TIMEOUT')) {
      throw err;
    }
    return [];
  }
}

// ── Universal Quality Sorter & Highest Quality Filter ─────────────────
if (typeof getStreams === 'function') {
  var _origGetStreams = getStreams;
  getStreams = async function() {
    var res = await _origGetStreams.apply(this, arguments);
    var sorted = sortStreamsByQuality(res);
    return filterHighestQuality(sorted);
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = wrapAll({
    getStreams: getStreams,
    decryptPlayer: decryptPlayer,
    solveNpGate: solveNpGate,
    getCryptoJS: getCryptoJS
  }, cfgReady);
  module.exports._raw = {
    decryptPlayer: decryptPlayer,
    solveNpGate: solveNpGate,
    getCryptoJS: getCryptoJS
  };
}
if (typeof globalThis !== 'undefined') {
  globalThis.getStreams = getStreams;
}
