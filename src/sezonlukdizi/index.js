// MUM modification 2026-11-21. GPL-3.0-only; see LICENSE and NOTICE.md.
const { sortStreamsByQuality } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
const { fetchWithTimeout } = require("../shared/http.js");
const { ProviderError } = require("../shared/errors.js");
var cheerio = require('cheerio-without-node-native');

var _cfgReady = null;
function cfgReady() {
    if (!_cfgReady) {
        _cfgReady = loadConfig().then(function () {
            var v = val('urls.series.sezonlukdizi.base');
            if (v) BASE_URL = String(v).replace(/\/+$/, '');
            if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + '/';
        });
    }
    return _cfgReady;
}

/**
 * MUM - SezonlukDizi Provider
 * SezonlukDizi (sezonlukdizi.cc) üzerinden yabancı dizi bölümleri,
 * Türkçe dublaj ve Türkçe altyazılı alternatif oynatıcı kaynaklarını sunar.
 */

var PROVIDER_NAME = 'SezonlukDizi';
var BASE_URL = 'https://sezonlukdizi.cc';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

var WORKING_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  'Referer': BASE_URL + '/'
};

function normalizeTitle(value) {
  return String(value || '').toLowerCase()
    .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

async function resolveTmdbInfo(id, mediaType, signal) {
  try {
    var cleanId = String(id || '').trim();
    if (cleanId.includes(':')) cleanId = cleanId.split(':')[0];

    var numericId = null;
    var title = '';
    var origTitle = '';

    if (cleanId.startsWith('tt')) {
      var findRes = await fetchWithTimeout(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`, { signal: signal }, 8000);
      if (findRes.ok) {
        var fData = await findRes.json();
        var item = fData.tv_results && fData.tv_results[0];
        if (item) {
          numericId = item.id;
          title = item.name || '';
          origTitle = item.original_name || '';
        }
      }
    } else {
      numericId = cleanId;
    }

    if (numericId && (!title || !origTitle)) {
      var tRes = await fetchWithTimeout(`https://api.themoviedb.org/3/tv/${numericId}?api_key=${TMDB_API_KEY}&language=tr-TR`, { signal: signal }, 8000);
      if (tRes.ok) {
        var tData = await tRes.json();
        title = tData.name || title;
        origTitle = tData.original_name || origTitle;
      }
    }

    return { title: title, origTitle: origTitle, numericId: numericId };
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
    return { title: '', origTitle: '', numericId: id };
  }
}

async function searchShow(titleTr, titleEn, signal) {
  var candidates = [titleTr, titleEn].map(normalizeTitle).filter(Boolean);
  if (!candidates.length) return null;

  var best = null;
  var bestScore = 0;

  for (var query of [titleTr, titleEn].filter(Boolean)) {
    try {
      var res = await fetchWithTimeout(BASE_URL + '/ajax/arama.asp', {
        method: 'POST',
        headers: Object.assign({}, WORKING_HEADERS, {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        }),
        body: 'q=' + encodeURIComponent(query),
        signal: signal
      }, 8000);
      if (!res.ok) continue;
      var data = await res.json();
      if (data.status !== 'success' || !data.results || !data.results.diziler || !Array.isArray(data.results.diziler.results)) {
        continue;
      }

      for (var item of data.results.diziler.results) {
        var itemTitle = normalizeTitle(item.title || '');
        var itemUrl = item.url || '';
        var slugMatch = itemUrl.match(/\/diziler\/([^/.]+)(?:\.html)?/i);
        if (!slugMatch) continue;
        var slug = slugMatch[1];
        var slugNorm = normalizeTitle(slug.replace(/-/g, ' '));

        var score = 0;
        candidates.forEach(function (target) {
          if (slugNorm === target || itemTitle === target) score = Math.max(score, 100);
          else if (itemTitle.indexOf(target) === 0 || slugNorm.indexOf(target) === 0) score = Math.max(score, 80);
          else if (target.indexOf(itemTitle) === 0 && itemTitle.length >= 4) score = Math.max(score, 70);
          else if (target.indexOf(slugNorm) === 0 && slugNorm.length >= 4) score = Math.max(score, 65);
        });

        if (score > bestScore) {
          bestScore = score;
          best = {
            did: item.did,
            slug: slug,
            title: item.title,
            url: itemUrl
          };
        }
      }
      if (bestScore >= 80) break;
    } catch (_) {}
  }

  return bestScore >= 60 ? best : null;
}

async function findEpisodeBid(slug, did, seasonNum, episodeNum, signal) {
  var targetHref = `${seasonNum}-sezon-${episodeNum}-bolum.html`;
  var directUrl = `${BASE_URL}/${slug}/${targetHref}`;

  try {
    var res = await fetchWithTimeout(directUrl, { headers: WORKING_HEADERS, signal: signal }, 8000);
    if (res.ok) {
      var html = await res.text();
      var $ = cheerio.load(html);
      var bid = $('#topBarBtn').attr('bid') || $('#dilsec').attr('data-id') || $('i[bid]').attr('bid');
      if (bid) {
        return { bid: String(bid).trim(), episodeUrl: directUrl };
      }
    }
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
  }

  if (did) {
    try {
      var bRes = await fetchWithTimeout(BASE_URL + '/ajax/dataIzleBolumler.asp', {
        method: 'POST',
        headers: Object.assign({}, WORKING_HEADERS, {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': directUrl
        }),
        body: `did=${encodeURIComponent(did)}&sno=${encodeURIComponent(seasonNum)}`,
        signal: signal
      }, 8000);
      if (bRes.ok) {
        var bHtml = await bRes.text();
        var $b = cheerio.load(bHtml);
        var foundBid = null;
        $b('a[href]').each(function () {
          var href = $b(this).attr('href') || '';
          if (href.indexOf(targetHref) !== -1 || href.indexOf(`/${targetHref}`) !== -1) {
            var itemContainer = $b(this).closest('.item');
            var bElem = itemContainer.find('[bid]').first();
            if (bElem.length) {
              foundBid = bElem.attr('bid');
              return false;
            }
          }
        });
        if (foundBid) {
          return { bid: String(foundBid).trim(), episodeUrl: directUrl };
        }
      }
    } catch (e) {
      if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
    }
  }

  return null;
}

async function fetchAlternatifler(bid, dil, episodeUrl, signal) {
  try {
    var res = await fetchWithTimeout(BASE_URL + '/ajax/dataAlternatif22.asp', {
      method: 'POST',
      headers: Object.assign({}, WORKING_HEADERS, {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': episodeUrl
      }),
      body: `bid=${encodeURIComponent(bid)}&dil=${encodeURIComponent(dil)}`,
      signal: signal
    }, 8000);
    if (!res.ok) return [];
    var data = await res.json();
    return (data.status === 'success' && Array.isArray(data.data)) ? data.data : [];
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
    return [];
  }
}

async function fetchEmbedIframe(embedId, episodeUrl, signal) {
  try {
    var res = await fetchWithTimeout(BASE_URL + '/ajax/dataEmbed22.asp', {
      method: 'POST',
      headers: Object.assign({}, WORKING_HEADERS, {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': episodeUrl
      }),
      body: `id=${encodeURIComponent(embedId)}`,
      signal: signal
    }, 8000);
    if (!res.ok) return null;
    var html = await res.text();
    if (html.indexOf('reCAPTCHADATA.asp') !== -1) return null;

    var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      var src = iframeMatch[1];
      if (src.startsWith('//')) src = 'https:' + src;
      return src;
    }
    return null;
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
    return null;
  }
}

async function fetchVidMolyStream(iframeUrl, signal) {
  var fullUrl = iframeUrl.startsWith('//') ? 'https:' + iframeUrl : iframeUrl;
  fullUrl = fullUrl.replace('vidmoly.to', 'vidmoly.biz').replace('vidmoly.net', 'vidmoly.biz');
  try {
    var r = await fetchWithTimeout(fullUrl, {
      headers: {
        'User-Agent': WORKING_HEADERS['User-Agent'],
        'Referer': BASE_URL + '/'
      },
      signal: signal
    }, 8000);
    if (!r.ok) return null;
    var html = await r.text();
    var m = html.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
    return m ? { url: m[1], type: 'hls', referer: 'https://vidmoly.biz/' } : null;
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
    return null;
  }
}

async function fetchSibnetStream(iframeUrl, signal) {
  try {
    var r = await fetchWithTimeout(iframeUrl, {
      headers: {
        'User-Agent': WORKING_HEADERS['User-Agent'],
        'Referer': 'https://video.sibnet.ru/'
      },
      signal: signal
    }, 8000);
    if (!r.ok) return null;
    var html = await r.text();
    var m = html.match(/src\s*:\s*["'](\/v\/[^"']+\.mp4)["']/i);
    if (m) {
      return { url: 'https://video.sibnet.ru' + m[1], type: 'mp4', referer: 'https://video.sibnet.ru/' };
    }
    return null;
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
    return null;
  }
}

// ── Filemoon / Byse Encrypted Stream Decryptor ────────────────────────
var decodeBase64ToBytes = function(e) {
  var t = e.replace(/-/g, "+").replace(/_/g, "/"),
      r = t.length % 4 === 0 ? 0 : 4 - t.length % 4,
      n = t + "=".repeat(r);
  var o;
  if (typeof atob === "function") o = atob(n);
  else if (typeof Buffer !== "undefined") o = Buffer.from(n, "base64").toString("binary");
  else return new Uint8Array(0);
  var a = new Uint8Array(o.length);
  for (var i = 0; i < o.length; i++) a[i] = o.charCodeAt(i);
  return a;
};

var getVersionPairs = function() {
  var e = {};
  for (var n = 1; n <= 20; n += 1) {
    var o = n ^ 0, a = (31 - n) ^ 0;
    e[String(n)] = [o, a];
  }
  return e;
};

var selectKeyIndices = function(e, t) {
  var r = typeof e === "string" ? e.trim() : "", o = getVersionPairs()[r];
  if (!o) return [];
  var a = o[0], i = o[1];
  return a < 1 || i < 1 || a > t || i > t ? [] : [a, i];
};

var extractKeyParts = function(e) {
  var t = Array.isArray(e.key_parts) ? e.key_parts : [],
      r = selectKeyIndices(e.version, t.length);
  if (r.length === 0) return t;
  var n = r.map(function(o) { return Number(o); })
           .filter(function(o) { return Number.isInteger(o) && o >= 1 && o <= t.length; })
           .map(function(o) { return t[o - 1]; })
           .filter(function(o) { return typeof o === "string" && o.length > 0; });
  return n.length > 0 ? n : t;
};

var assembleKey = function(e) {
  var t = e.filter(function(a) { return typeof a === "string" && a.length > 0; }).map(decodeBase64ToBytes),
      r = t.reduce(function(a, i) { return a + i.length; }, 0),
      n = new Uint8Array(r);
  var o = 0;
  for (var a of t) { n.set(a, o); o += a.length; }
  return n;
};

async function decryptBysePlayback(playback) {
  try {
    var c = typeof globalThis !== 'undefined' ? (globalThis.crypto || null) : null;
    if (!c && typeof require === 'function') {
      try { c = require('crypto').webcrypto; } catch (_) {}
    }
    if (!c || !c.subtle) return null;
    var keyData = assembleKey(extractKeyParts(playback));
    var iv = decodeBase64ToBytes(playback.iv);
    var payload = decodeBase64ToBytes(playback.payload);
    var key = await c.subtle.importKey("raw", keyData, "AES-GCM", false, ["decrypt"]);
    var decrypted = await c.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, payload);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (_) {
    return null;
  }
}

function parseMasterVariants(masterContent, masterUrl) {
  var lines = masterContent.split(/\r?\n/);
  var variants = [];
  var currentStreamInf = null;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line.indexOf('#EXT-X-STREAM-INF:') === 0) {
      currentStreamInf = line;
    } else if (line && line.indexOf('#') !== 0 && currentStreamInf) {
      var variantUrl = line;
      if (variantUrl.indexOf('http') !== 0) {
        try {
          variantUrl = new URL(variantUrl, masterUrl).toString();
        } catch (_) {}
      }

      var resMatch = currentStreamInf.match(/RESOLUTION=(\d+)x(\d+)/i);
      var width = resMatch ? parseInt(resMatch[1], 10) : 0;
      var height = resMatch ? parseInt(resMatch[2], 10) : 0;

      var bwMatch = currentStreamInf.match(/BANDWIDTH=(\d+)/i);
      var bandwidth = bwMatch ? parseInt(bwMatch[1], 10) : 0;

      var quality = '1080p';
      if (height >= 1080 || width >= 1920) quality = '1080p';
      else if (height >= 720 || width >= 1280) quality = '720p';
      else if (height >= 480 || width >= 800) quality = '480p';
      else if (height > 0) quality = height + 'p';

      variants.push({
        url: variantUrl,
        quality: quality,
        height: height,
        width: width,
        bandwidth: bandwidth
      });
      currentStreamInf = null;
    }
  }

  return variants;
}

async function fetchByseStream(iframeUrl, signal) {
  try {
    var m = iframeUrl.match(/\/e\/([a-zA-Z0-9]+)/i);
    if (!m) return null;
    var code = m[1];
    var origin = new URL(iframeUrl).origin;
    var apiRes = await fetchWithTimeout(`${origin}/api/videos/${code}`, {
      headers: {
        'User-Agent': WORKING_HEADERS['User-Agent'],
        'Referer': iframeUrl
      },
      signal: signal
    }, 8000);
    if (!apiRes.ok) return null;
    var data = await apiRes.json();
    if (!data || !data.playback) return null;
    var decrypted = await decryptBysePlayback(data.playback);
    if (!decrypted || !decrypted.sources || !decrypted.sources.length) return null;

    var results = [];
    var seenUrls = Object.create(null);

    for (var src of decrypted.sources) {
      var masterUrl = src.url;
      if (!masterUrl) continue;

      try {
        var mRes = await fetchWithTimeout(masterUrl, {
          headers: {
            'User-Agent': WORKING_HEADERS['User-Agent'],
            'Referer': origin + '/'
          },
          signal: signal
        }, 8000);
        if (mRes.ok) {
          var mText = await mRes.text();
          var variants = parseMasterVariants(mText, masterUrl);
          if (variants && variants.length > 0) {
            for (var v of variants) {
              if (seenUrls[v.url]) continue;
              seenUrls[v.url] = true;
              results.push({
                url: v.url,
                type: 'hls',
                referer: origin + '/',
                quality: v.quality,
                bandwidth: v.bandwidth
              });
            }
          }
        }
      } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
      }

      // Fallback: If no direct child variants extracted, provide masterUrl
      if (results.length === 0 && !seenUrls[masterUrl]) {
        seenUrls[masterUrl] = true;
        results.push({
          url: masterUrl,
          type: 'hls',
          referer: origin + '/',
          quality: src.label || (src.height ? `${src.height}p` : '1080p')
        });
      }
    }

    return results.length > 0 ? results : null;
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
    return null;
  }
}

async function getStreams(tmdbId, mediaType, seasonNum, episodeNum, options) {
  try {
    var signal = options && options.signal;
    if (typeof tmdbId === 'object' && tmdbId !== null) {
      mediaType = tmdbId.type || mediaType;
      seasonNum = tmdbId.season || seasonNum;
      episodeNum = tmdbId.episode || episodeNum;
      if (tmdbId.signal && !signal) signal = tmdbId.signal;
      tmdbId = tmdbId.id;
    }
    if (mediaType !== 'tv' && mediaType !== 'series') return [];
    if (!Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 || !Number.isInteger(Number(episodeNum)) || Number(episodeNum) < 1) {
      return [];
    }
    seasonNum = Number(seasonNum);
    episodeNum = Number(episodeNum);

    var info = await resolveTmdbInfo(tmdbId, mediaType, signal);
    var titleTr = (info.title || '').trim();
    var titleEn = (info.origTitle || '').trim();
    var displayTitle = titleTr || titleEn || 'Dizi';

    var show = await searchShow(titleTr, titleEn, signal);
    if (!show || !show.slug) return [];

    var epInfo = await findEpisodeBid(show.slug, show.did, seasonNum, episodeNum, signal);
    if (!epInfo || !epInfo.bid) return [];

    var dilConfigs = [
      { code: '1', label: 'Altyazılı', flag: '🌐 ' },
      { code: '0', label: 'Dublaj', flag: '🇹🇷 ' }
    ];

    // Parallel fetch both Subtitle and Dubbed alternatives
    var altsByDil = await Promise.all(
      dilConfigs.map(async function (dConf) {
        var alts = await fetchAlternatifler(epInfo.bid, dConf.code, epInfo.episodeUrl, signal);
        return { dConf: dConf, alts: alts };
      })
    );

    // Hosts that require Cloudflare Turnstile human challenge in /ajax/dataEmbed22.asp
    var TURNSTILE_BLOCKED_HOSTS = ['dzen', 'pixel', 'vidmoly', 'streamruby'];

    // Select viable alternatives to query:
    // If playable hosts (Filemoon, Sibnet, etc.) exist, skip Turnstile-locked hosts to prevent Cloudflare 1015 rate limit
    var tasks = [];
    for (var entry of altsByDil) {
      var dConf = entry.dConf;
      var alts = entry.alts || [];
      if (!alts.length) continue;

      var playableAlts = alts.filter(function (alt) {
        var b = (alt.baslik || '').toLowerCase();
        return !TURNSTILE_BLOCKED_HOSTS.some(function (h) { return b.includes(h); });
      });

      var chosenAlts = playableAlts.length > 0 ? playableAlts : alts.slice(0, 1);
      for (var alt of chosenAlts) {
        tasks.push({ alt: alt, dConf: dConf });
      }
    }

    // Concurrently resolve embed iframes and decrypt media streams
    var resolvedEntries = await Promise.all(
      tasks.map(async function (task) {
        try {
          var alt = task.alt;
          var dConf = task.dConf;
          var altTitle = (alt.baslik || '').trim();
          var quality = alt.kalite ? `${alt.kalite === 4 ? '1080p' : alt.kalite === 3 ? '720p' : '480p'}` : '1080p';

          var iframeSrc = await fetchEmbedIframe(alt.id, epInfo.episodeUrl, signal);
          if (!iframeSrc) return null;

          var resolvedStream = null;
          var pName = altTitle || 'Kaynak';

          if (iframeSrc.indexOf('vidmoly') !== -1) {
            pName = 'VidMoly';
            resolvedStream = await fetchVidMolyStream(iframeSrc, signal);
          } else if (iframeSrc.indexOf('sibnet') !== -1) {
            pName = 'Sibnet';
            resolvedStream = await fetchSibnetStream(iframeSrc, signal);
          } else if (iframeSrc.indexOf('bysejikuar') !== -1 || iframeSrc.indexOf('filemoon') !== -1) {
            pName = 'FileMoon';
            resolvedStream = await fetchByseStream(iframeSrc, signal);
          } else if (/\.(?:m3u8|mp4)(?:[?#]|$)/i.test(iframeSrc)) {
            var isHls = /\.m3u8(?:[?#]|$)/i.test(iframeSrc);
            resolvedStream = {
              url: iframeSrc,
              type: isHls ? 'hls' : 'mp4',
              referer: BASE_URL + '/'
            };
          }

          var streamList = Array.isArray(resolvedStream) ? resolvedStream : (resolvedStream ? [resolvedStream] : []);
          return streamList.filter(function(st) { return st && st.url && st.type !== 'embed'; }).map(function(st) {
            return {
              stream: st,
              pName: pName,
              dConf: dConf,
              quality: st.quality || quality
            };
          });
        } catch (errInner) {
          if (errInner && (errInner.name === 'AbortError' || errInner.message === 'TIMEOUT' || errInner.name === 'ProviderError')) throw errInner;
          return null;
        }
      })
    );

    var allStreams = [];
    var seenUrls = Object.create(null);

    var flattened = [];
    for (var res of resolvedEntries) {
      if (Array.isArray(res)) {
        for (var item of res) {
          if (item && item.stream && item.stream.url) flattened.push(item);
        }
      } else if (res && res.stream && res.stream.url) {
        flattened.push(res);
      }
    }

    for (var item of flattened) {
      if (!item || !item.stream || !item.stream.url || seenUrls[item.stream.url]) continue;
      seenUrls[item.stream.url] = true;

      var sHeaders = {
        'User-Agent': WORKING_HEADERS['User-Agent'],
        'Referer': item.stream.referer || (BASE_URL + '/')
      };

      allStreams.push({
        name: displayTitle,
        title: `⌜ ${PROVIDER_NAME} ⌟ | ${item.pName} | ${item.dConf.flag}${item.dConf.label} · ${seasonNum}. Sezon ${episodeNum}. Bölüm`,
        url: item.stream.url,
        quality: item.quality,
        type: item.stream.type || 'hls',
        headers: sHeaders,
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: { request: sHeaders }
        },
        provider: 'sezonlukdizi'
      });
    }

    return allStreams;
  } catch (err) {
    if (err && (err.name === 'ProviderError' || err.name === 'AbortError' || err.message === 'TIMEOUT')) {
      throw err;
    }
    return [];
  }
}

// ── Universal Quality Sorter ──────────────────────────────────────────
if (typeof getStreams === "function") {
    var _origGetStreams = getStreams;
    getStreams = async function() {
        var res = await _origGetStreams.apply(this, arguments);
        return sortStreamsByQuality(res);
    };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = wrapAll({ getStreams: getStreams }, cfgReady);
}
if (typeof globalThis !== 'undefined') {
  globalThis.getStreams = getStreams;
}
