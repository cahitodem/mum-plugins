// MUM modification 2026-11-21. GPL-3.0-only; see LICENSE and NOTICE.md.
const { sortStreamsByQuality } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
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

async function resolveTmdbInfo(id, mediaType) {
  try {
    var cleanId = String(id || '').trim();
    if (cleanId.includes(':')) cleanId = cleanId.split(':')[0];

    var numericId = null;
    var title = '';
    var origTitle = '';

    if (cleanId.startsWith('tt')) {
      var findRes = await fetch(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
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
      var tRes = await fetch(`https://api.themoviedb.org/3/tv/${numericId}?api_key=${TMDB_API_KEY}&language=tr-TR`);
      if (tRes.ok) {
        var tData = await tRes.json();
        title = tData.name || title;
        origTitle = tData.original_name || origTitle;
      }
    }

    return { title: title, origTitle: origTitle, numericId: numericId };
  } catch (e) {
    return { title: '', origTitle: '', numericId: id };
  }
}

async function searchShow(titleTr, titleEn) {
  var candidates = [titleTr, titleEn].map(normalizeTitle).filter(Boolean);
  if (!candidates.length) return null;

  var best = null;
  var bestScore = 0;

  for (var query of [titleTr, titleEn].filter(Boolean)) {
    try {
      var res = await fetch(BASE_URL + '/ajax/arama.asp', {
        method: 'POST',
        headers: Object.assign({}, WORKING_HEADERS, {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        }),
        body: 'q=' + encodeURIComponent(query)
      });
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

async function findEpisodeBid(slug, did, seasonNum, episodeNum) {
  var targetHref = `${seasonNum}-sezon-${episodeNum}-bolum.html`;
  var directUrl = `${BASE_URL}/${slug}/${targetHref}`;

  try {
    var res = await fetch(directUrl, { headers: WORKING_HEADERS });
    if (res.ok) {
      var html = await res.text();
      var $ = cheerio.load(html);
      var bid = $('#topBarBtn').attr('bid') || $('#dilsec').attr('data-id') || $('i[bid]').attr('bid');
      if (bid) {
        return { bid: String(bid).trim(), episodeUrl: directUrl };
      }
    }
  } catch (_) {}

  if (did) {
    try {
      var bRes = await fetch(BASE_URL + '/ajax/dataIzleBolumler.asp', {
        method: 'POST',
        headers: Object.assign({}, WORKING_HEADERS, {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': directUrl
        }),
        body: `did=${encodeURIComponent(did)}&sno=${encodeURIComponent(seasonNum)}`
      });
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
    } catch (_) {}
  }

  return null;
}

async function fetchAlternatifler(bid, dil, episodeUrl) {
  try {
    var res = await fetch(BASE_URL + '/ajax/dataAlternatif22.asp', {
      method: 'POST',
      headers: Object.assign({}, WORKING_HEADERS, {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': episodeUrl
      }),
      body: `bid=${encodeURIComponent(bid)}&dil=${encodeURIComponent(dil)}`
    });
    if (!res.ok) return [];
    var data = await res.json();
    return (data.status === 'success' && Array.isArray(data.data)) ? data.data : [];
  } catch (_) {
    return [];
  }
}

async function fetchEmbedIframe(embedId, episodeUrl) {
  try {
    var res = await fetch(BASE_URL + '/ajax/dataEmbed22.asp', {
      method: 'POST',
      headers: Object.assign({}, WORKING_HEADERS, {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': episodeUrl
      }),
      body: `id=${encodeURIComponent(embedId)}`
    });
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
  } catch (_) {
    return null;
  }
}

async function fetchVidMolyStream(iframeUrl) {
  var fullUrl = iframeUrl.startsWith('//') ? 'https:' + iframeUrl : iframeUrl;
  fullUrl = fullUrl.replace('vidmoly.to', 'vidmoly.biz').replace('vidmoly.net', 'vidmoly.biz');
  try {
    var r = await fetch(fullUrl, {
      headers: {
        'User-Agent': WORKING_HEADERS['User-Agent'],
        'Referer': BASE_URL + '/'
      }
    });
    if (!r.ok) return null;
    var html = await r.text();
    var m = html.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
    return m ? { url: m[1], type: 'hls', referer: 'https://vidmoly.biz/' } : null;
  } catch (_) {
    return null;
  }
}

async function fetchSibnetStream(iframeUrl) {
  try {
    var r = await fetch(iframeUrl, {
      headers: {
        'User-Agent': WORKING_HEADERS['User-Agent'],
        'Referer': 'https://video.sibnet.ru/'
      }
    });
    if (!r.ok) return null;
    var html = await r.text();
    var m = html.match(/src\s*:\s*["'](\/v\/[^"']+\.mp4)["']/i);
    if (m) {
      return { url: 'https://video.sibnet.ru' + m[1], type: 'mp4', referer: 'https://video.sibnet.ru/' };
    }
    return null;
  } catch (_) {
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

async function fetchByseStream(iframeUrl) {
  try {
    var m = iframeUrl.match(/\/e\/([a-zA-Z0-9]+)/i);
    if (!m) return null;
    var code = m[1];
    var origin = new URL(iframeUrl).origin;
    var apiRes = await fetch(`${origin}/api/videos/${code}`, {
      headers: {
        'User-Agent': WORKING_HEADERS['User-Agent'],
        'Referer': iframeUrl
      }
    });
    if (!apiRes.ok) return null;
    var data = await apiRes.json();
    if (!data || !data.playback) return null;
    var decrypted = await decryptBysePlayback(data.playback);
    if (!decrypted || !decrypted.sources || !decrypted.sources.length) return null;

    // Pick highest quality source (1080p -> 720p -> last available)
    var primary = decrypted.sources.find(function(s) { return s.label === '1080p' || s.height >= 1080; })
      || decrypted.sources.find(function(s) { return s.label === '720p' || s.height >= 720; })
      || decrypted.sources[decrypted.sources.length - 1];

    return {
      url: primary.url,
      type: 'hls',
      referer: origin + '/',
      quality: primary.label || (primary.height ? `${primary.height}p` : '1080p')
    };
  } catch (_) {
    return null;
  }
}

async function getStreams(tmdbId, mediaType, seasonNum, episodeNum) {
  try {
    if (mediaType !== 'tv' && mediaType !== 'series') return [];
    if (!Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 || !Number.isInteger(Number(episodeNum)) || Number(episodeNum) < 1) {
      return [];
    }
    seasonNum = Number(seasonNum);
    episodeNum = Number(episodeNum);

    var info = await resolveTmdbInfo(tmdbId, mediaType);
    var titleTr = (info.title || '').trim();
    var titleEn = (info.origTitle || '').trim();
    var displayTitle = titleTr || titleEn || 'Dizi';

    var show = await searchShow(titleTr, titleEn);
    if (!show || !show.slug) return [];

    var epInfo = await findEpisodeBid(show.slug, show.did, seasonNum, episodeNum);
    if (!epInfo || !epInfo.bid) return [];

    var dilConfigs = [
      { code: '1', label: 'Altyazılı', flag: '🌐 ' },
      { code: '0', label: 'Dublaj', flag: '🇹🇷 ' }
    ];

    // Parallel fetch both Subtitle and Dubbed alternatives
    var altsByDil = await Promise.all(
      dilConfigs.map(async function (dConf) {
        var alts = await fetchAlternatifler(epInfo.bid, dConf.code, epInfo.episodeUrl);
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

          var iframeSrc = await fetchEmbedIframe(alt.id, epInfo.episodeUrl);
          if (!iframeSrc) return null;

          var resolvedStream = null;
          var pName = altTitle || 'Kaynak';

          if (iframeSrc.indexOf('vidmoly') !== -1) {
            pName = 'VidMoly';
            resolvedStream = await fetchVidMolyStream(iframeSrc);
          } else if (iframeSrc.indexOf('sibnet') !== -1) {
            pName = 'Sibnet';
            resolvedStream = await fetchSibnetStream(iframeSrc);
          } else if (iframeSrc.indexOf('bysejikuar') !== -1 || iframeSrc.indexOf('filemoon') !== -1) {
            pName = 'FileMoon';
            resolvedStream = await fetchByseStream(iframeSrc);
          } else if (/\.(?:m3u8|mp4)(?:[?#]|$)/i.test(iframeSrc)) {
            var isHls = /\.m3u8(?:[?#]|$)/i.test(iframeSrc);
            resolvedStream = {
              url: iframeSrc,
              type: isHls ? 'hls' : 'mp4',
              referer: BASE_URL + '/'
            };
          }

          if (resolvedStream && resolvedStream.url && resolvedStream.type !== 'embed') {
            return {
              stream: resolvedStream,
              pName: pName,
              dConf: dConf,
              quality: resolvedStream.quality || quality
            };
          }
          return null;
        } catch (_) {
          return null;
        }
      })
    );

    var allStreams = [];
    var seenUrls = Object.create(null);

    for (var item of resolvedEntries) {
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
  } catch (_) {
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
