const { sortStreamsByQuality } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
const { pickBestCandidate } = require("../shared/matching.js");
const { fetchWithTimeout, resolveTmdbMeta } = require("../shared/http.js");
const { ProviderError } = require("../shared/errors.js");

var _cfgReady = null;
function cfgReady() {
    if (!_cfgReady) {
        _cfgReady = loadConfig().then(function () {
            var v;
            v = val('urls.movies.hdfilmdelisi.base'); if (v) BASE_URL = String(v).replace(/\/+$/, '');
            if (HEADERS) HEADERS.Referer = BASE_URL + '/';
        });
    }
    return _cfgReady;
}

/**
 * Anthology - HDFilmDelisi Provider
 * https://hdfilmdelisi.one
 * JSON API (api/films, api/search) + VidMody şifreli oynatıcı üzerinden HLS akışları.
 * Kaynak: Cloudstream HDFilmDelisi/VidMody mantığının Nuvio JS uyarlaması.
 */

var BASE_URL = 'https://hdfilmdelisi.one';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';
var DIRECT_PROBE_TIMEOUT_MS = 3000;

var HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    'Referer': BASE_URL + '/'
};

var VIDMODY_HEADERS = {
    'User-Agent': HEADERS['User-Agent'],
    'Referer': 'https://pl.vixolity.com/',
    'Origin': 'https://pl.vixolity.com'
};

var VIXOLITY_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': 'https://pl.vixolity.com/',
    'Origin': 'https://pl.vixolity.com',
    'Accept': '*/*'
};

function ultraClean(str) {
    if (!str) return '';
    return str.toString().toLowerCase()
        .replace(/[ıİ]/g, 'i').replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o')
        .replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g').replace(/[çÇ]/g, 'c')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

async function resolveTmdbInfo(id, mediaType, signal) {
    try {
        var meta = await resolveTmdbMeta(id, mediaType, { signal: signal });
        return meta || { title: '', origTitle: '', imdbId: '', year: '' };
    } catch (e) {
        if (e && (e.name === 'ProviderError' || e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) {
            throw e;
        }
        return { title: '', origTitle: '', imdbId: '', year: '' };
    }
}

async function apiSearch(query, signal) {
    try {
        var res = await fetchWithTimeout(BASE_URL + '/api/search?q=' + encodeURIComponent(query), {
            headers: { 'User-Agent': HEADERS['User-Agent'], 'Referer': BASE_URL + '/' },
            signal: signal
        }, 8000);
        if (!res.ok) return [];
        var data = await res.json();
        return (data && (data.results || data.films)) || [];
    } catch (e) {
        if (e && (e.name === 'ProviderError' || e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) {
            throw e;
        }
        return [];
    }
}

function pickBest(results, title, year) {
    return pickBestCandidate(results, title, year, { minCoverage: 0.75, minScore: 50 });
}

function decodeBase64Safe(str) {
    if (typeof atob === 'function') {
        return atob(str);
    }
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'base64').toString('binary');
    }
    return '';
}

/* VidMody şifre çözümü: hex->char, ters çevir, base64 çöz, bayt çıkar, \xNN kaçışları */
function vidmodyDecrypt(hex, key) {
    try {
        var sb = '';
        for (var i = 0; i < hex.length; i += 2) {
            sb += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        var rev = sb.split('').reverse().join('');
        var decoded = decodeBase64Safe(rev);
        if (!decoded) return '';
        var out = '';
        for (var b = 0; b < decoded.length; b++) {
            var byte = typeof decoded[b] === 'number' ? decoded[b] : decoded.charCodeAt(b);
            out += String.fromCharCode((byte - key + 256) % 256);
        }
        return out.replace(/\\x([0-9a-fA-F]{2})/g, function(m, h) {
            return String.fromCharCode(parseInt(h, 16));
        });
    } catch (e) {
        return '';
    }
}

/* Vixolity Player şifre çözümü: hex->char, ters çevir, b64 çöz, bayt çıkar, b64 çöz, decodeURIComponent */
function vixolityPlayerDecrypt(hex, key) {
    try {
        var s1 = '';
        for (var i = 0; i < hex.length; i += 2) {
            s1 += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        var rev = s1.split('').reverse().join('');
        var s2 = decodeBase64Safe(rev);
        var s3 = '';
        for (var j = 0; j < s2.length; j++) {
            var b = typeof s2[j] === 'number' ? s2[j] : s2.charCodeAt(j);
            s3 += String.fromCharCode((b - key + 256) % 256);
        }
        var s4 = decodeBase64Safe(s3);
        try {
            return decodeURIComponent(escape(s4));
        } catch (_) {
            return s4;
        }
    } catch (_) {
        return '';
    }
}

async function extractVidmodyFile(pageUrl, signal) {
    try {
        var res = await fetchWithTimeout(pageUrl, { headers: HEADERS, signal: signal }, 8000);
        if (!res.ok) return null;
        var html = await res.text();

        // 1. Fast Path: Film sayfasındaki JSON-LD veya meta etiketlerinde IMDb ID varsa doğrudan HLS dene
        var pageImdbMatch = html.match(/imdb\.com\/title\/(tt\d{7,10})/i) || html.match(/["']sameAs["']\s*:\s*["'][^"']*(tt\d{7,10})/i);
        if (pageImdbMatch && pageImdbMatch[1]) {
            var fastVixUrl = 'https://ha.vixolity.com/vs/' + pageImdbMatch[1];
            try {
                var fvRes = await fetchWithTimeout(fastVixUrl, { headers: VIXOLITY_HEADERS, signal: signal }, DIRECT_PROBE_TIMEOUT_MS);
                if (fvRes.ok) {
                    var fvTxt = await fvRes.text();
                    if (fvTxt.includes('#EXTM3U')) {
                        var fastSubs = parseVixolitySubtitles(fvTxt);
                        return { file: fastVixUrl, playerUrl: pageUrl, subtitles: fastSubs, isHls: true };
                    }
                }
            } catch (_) {}
        }

        // 2. Modern pl.vixolity.com iframe/embed ayrıştırma ve şifre çözümü
        var vixPlayerUrl = null;
        var jsonLdMatch = html.match(/<script[^>]+id=["']jsonld-video["'][^>]*>([\s\S]*?)<\/script>/i);
        if (jsonLdMatch) {
            try {
                var jsonLdData = JSON.parse(jsonLdMatch[1]);
                if (jsonLdData && jsonLdData.embedUrl && jsonLdData.embedUrl.includes('vixolity.com')) {
                    vixPlayerUrl = jsonLdData.embedUrl;
                }
            } catch (_) {}
        }
        if (!vixPlayerUrl) {
            var plMatch = html.match(/https?:[\\/]+pl\.vixolity\.com[\\/][a-zA-Z0-9=_\-\\\/]+/);
            if (plMatch) vixPlayerUrl = plMatch[0].split('\\').join('/');
        }

        if (vixPlayerUrl) {
            var pRes = await fetchWithTimeout(vixPlayerUrl, {
                headers: { 'User-Agent': HEADERS['User-Agent'], 'Referer': pageUrl, 'Origin': BASE_URL },
                signal: signal
            }, 8000);
            if (pRes.ok) {
                var pHtml = await pRes.text();
                var dMatch = pHtml.match(/\((?:function\s*\([^)]*\)\s*\{[\s\S]*?\})\)\s*\(\s*['"]([0-9a-fA-F]+)['"]\s*,\s*(\d+)\s*\)/);
                if (dMatch) {
                    var decrypted = vixolityPlayerDecrypt(dMatch[1], parseInt(dMatch[2], 10));
                    var kaynakMatch = decrypted.match(/["']kaynak["']\s*:\s*["']([^"']+)["']/);
                    if (kaynakMatch) {
                        var hlsUrl = kaynakMatch[1];
                        var subs = [];
                        try {
                            var hlsRes = await fetchWithTimeout(hlsUrl, { headers: VIXOLITY_HEADERS, signal: signal }, DIRECT_PROBE_TIMEOUT_MS);
                            if (hlsRes.ok) {
                                var hlsTxt = await hlsRes.text();
                                if (hlsTxt.includes('#EXTM3U')) {
                                    subs = parseVixolitySubtitles(hlsTxt);
                                }
                            }
                        } catch (_) {}
                        return { file: hlsUrl, playerUrl: vixPlayerUrl, subtitles: subs, isHls: true };
                    }
                }
            }
        }

        // 3. Klasik player.vidmody.com iframe ayrıştırma (Legacy Fallback)
        var vm = html.match(/https?:[\\/]+player\.vidmody\.com[\\/][a-zA-Z0-9=\\\/]+/);
        if (!vm) return null;
        var playerUrl = vm[0].split('\\').join('/');
        var pRes2 = await fetchWithTimeout(playerUrl, {
            headers: { 'User-Agent': HEADERS['User-Agent'], 'Referer': pageUrl },
            signal: signal
        }, 8000);
        if (!pRes2.ok) return null;
        var pHtml2 = await pRes2.text();
        var dMatch2 = pHtml2.match(/(?:decrypt|\))\s*\(\s*["']([0-9a-fA-F]+)["']\s*,\s*(\d+)\s*\)/);
        if (!dMatch2) return null;
        var block = vidmodyDecrypt(dMatch2[1], parseInt(dMatch2[2]));
        var fMatch = block.match(/file:\s*['"](https?:\/\/[^'"]+)['"]/);
        if (!fMatch) return null;
        var subs2 = [];
        var subRe = /https?:\/\/[^\s"'\\]+\.vtt/gi;
        var sm;
        var seen = new Set();
        while ((sm = subRe.exec(pHtml2 + ' ' + block)) !== null) {
            if (seen.has(sm[0]) || /thumb/i.test(sm[0])) continue;
            seen.add(sm[0]);
            var lang = /tur/i.test(sm[0]) ? 'tur' : 'eng';
            subs2.push({ id: lang, lang: lang, url: sm[0] });
        }
        return { file: fMatch[1], playerUrl: playerUrl, subtitles: subs2 };
    } catch (e) {
        if (e && (e.name === 'ProviderError' || e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) {
            throw e;
        }
        return null;
    }
}

function parseVixolitySubtitles(playlistText) {
    var subs = [];
    var subRe = /#EXT-X-MEDIA:TYPE=SUBTITLES.*?NAME="([^"]+)".*?LANGUAGE="([^"]+)".*?URI="([^"]+)"/gi;
    var sm;
    var seen = new Set();
    while ((sm = subRe.exec(playlistText)) !== null) {
        var name = sm[1];
        var lang = sm[2].toLowerCase();
        var uri = sm[3];
        if (seen.has(uri)) continue;
        seen.add(uri);
        subs.push({
            id: lang,
            lang: lang === 'tr' ? 'tur' : lang === 'en' ? 'eng' : lang,
            language: lang,
            label: name,
            name: name,
            title: name,
            url: uri,
            format: 'vtt',
            type: 'text/vtt',
            headers: VIXOLITY_HEADERS
        });
    }
    return subs;
}

function toVixolityStream(url, subtitles, isSeries, sNum, eNum) {
    var tag = isSeries ? ('S' + (sNum || 1) + 'E' + (eNum || 1) + ' • [TR Dublaj & Altyazılı]') : '[TR Dublaj & Altyazılı]';
    return {
        name: 'HDFM',
        title: '⌜ HDFM ⌟ | Vixolity • ' + tag + ' (1080p HLS)',
        url: url,
        quality: '1080p',
        provider: 'hdfilmdelisi',
        headers: VIXOLITY_HEADERS,
        format: 'hls',
        isHls: true,
        behaviorHints: { notWebReady: true, proxyHeaders: { request: VIXOLITY_HEADERS } },
        subtitles: subtitles || []
    };
}

function toStream(file, subtitles) {
    var isHls = /\.m3u8/i.test(file) || file.includes('vixolity.com/vs/') || file.includes('vidmody.com/vs/');
    var headers = file.includes('vixolity.com')
        ? VIXOLITY_HEADERS
        : (isHls && file.includes('vidmody.com')
            ? { 'User-Agent': HEADERS['User-Agent'], 'Referer': 'https://vidmody.com/' }
            : { 'User-Agent': HEADERS['User-Agent'], 'Referer': 'https://player.vidmody.com/' });
    var streamTitle = file.includes('vixolity.com')
        ? '⌜ HDFM ⌟ | Vixolity • [TR Dublaj & Altyazılı] (1080p HLS)'
        : '⌜ HDFM ⌟ | 1080p HLS';
    return {
        name: 'HDFM',
        title: streamTitle,
        url: file,
        quality: '1080p',
        provider: 'hdfilmdelisi',
        headers: headers,
        format: 'hls',
        isHls: true,
        behaviorHints: { notWebReady: true, proxyHeaders: { request: headers } },
        subtitles: subtitles || []
    };
}

async function getCatalog(args) {
    try {
        var query = (args && args.search) || (args && args.extra && args.extra.search) || (args && args.query) || '';
        var url = query
            ? (BASE_URL + '/api/search?q=' + encodeURIComponent(query))
            : (BASE_URL + '/api/films?page=1&sort=newest&limit=20');
        var res = await fetchWithTimeout(url, { headers: { 'User-Agent': HEADERS['User-Agent'] } }, 15000);
        if (!res.ok) return { metas: [] };
        var data = await res.json();
        var items = data.results || data.films || [];
        var metas = items.slice(0, 30).map(function(f) {
            var title = f.baslik || f.title || 'Film';
            return {
                id: 'hdfilmdelisi:movie:' + (f.slug || f.id),
                type: 'movie',
                name: title + (f.yayinYili ? ' (' + f.yayinYili + ')' : ''),
                poster: f.afis || 'https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png',
                background: f.afis || 'https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png',
                genres: [(f.kategoriler && f.kategoriler[0] && f.kategoriler[0].ad) || 'Film', 'HDFilmDelisi'],
                description: (f.orijinalBaslik || title) + ' - HDFilmDelisi'
            };
        });
        return { metas: metas };
    } catch (e) {
        return { metas: [] };
    }
}

async function getMeta(args) {
    try {
        var rawId = (typeof args === 'string') ? args : (args && args.id ? args.id : '');
        if (!rawId || !rawId.startsWith('hdfilmdelisi:')) return { meta: null };
        var slug = rawId.split(':').slice(2).join(':');
        var pageUrl = BASE_URL + '/film/' + slug;
        var res = await fetchWithTimeout(pageUrl, { headers: HEADERS }, 15000);
        if (!res.ok) return { meta: null };
        var html = await res.text();
        var titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        var title = titleMatch ? titleMatch[1].split('|')[0].split('-')[0].trim() : 'HDFilmDelisi';
        var ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        var poster = ogImg ? ogImg[1] : 'https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png';
        return {
            meta: {
                id: rawId, type: 'movie', name: title, poster: poster, background: poster,
                description: title + ' - HDFilmDelisi',
                genres: ['Film', 'HDFilmDelisi'],
                videos: [{ id: rawId, title: title, released: new Date().toISOString().split('T')[0] }]
            }
        };
    } catch (e) {
        return { meta: null };
    }
}

async function getStreams(tmdbIdOrArgs, mediaType, seasonNum, episodeNum, options) {
    var signal = options && options.signal;
    try {
        var id = tmdbIdOrArgs;
        var isSeries = mediaType === 'tv' || mediaType === 'series';
        var s = seasonNum || 1;
        var e = episodeNum || 1;

        if (typeof tmdbIdOrArgs === 'object' && tmdbIdOrArgs && tmdbIdOrArgs.id) {
            id = tmdbIdOrArgs.id;
            if (tmdbIdOrArgs.type) isSeries = tmdbIdOrArgs.type === 'tv' || tmdbIdOrArgs.type === 'series';
            if (tmdbIdOrArgs.season) s = tmdbIdOrArgs.season;
            if (tmdbIdOrArgs.episode) e = tmdbIdOrArgs.episode;
            options = tmdbIdOrArgs.options || options;
            signal = options && options.signal;
        }

        var cleanId = String(id || '').trim().replace(/^(?:movie|tv|series|tmdb|imdb):+/i, '');
        if (cleanId.includes(':')) cleanId = cleanId.split(':')[0];

        var streams = [];
        var seenUrls = new Set();

        // 1. Direct slug access
        if (typeof id === 'string' && id.startsWith('hdfilmdelisi:movie:')) {
            var slug = id.split(':').slice(2).join(':');
            var apiRes = await fetchWithTimeout(BASE_URL + '/api/films/' + slug, { headers: HEADERS, signal: signal }, 8000);
            if (apiRes.ok) {
                var fData = await apiRes.json();
                if (fData && fData.imdbId && fData.imdbId.startsWith('tt')) {
                    var directVix = 'https://ha.vixolity.com/vs/' + fData.imdbId;
                    var vr = await fetchWithTimeout(directVix, { headers: VIXOLITY_HEADERS, signal: signal }, DIRECT_PROBE_TIMEOUT_MS);
                    if (vr.ok) {
                        var vt = await vr.text();
                        var subs = parseVixolitySubtitles(vt);
                        streams.push(toVixolityStream(directVix, subs, false));
                        seenUrls.add(directVix);
                    }
                }
            }
            var found = await extractVidmodyFile(BASE_URL + '/film/' + slug, signal);
            if (found && !seenUrls.has(found.file)) {
                streams.push(toStream(found.file, found.subtitles));
                seenUrls.add(found.file);
            }
            if (streams.length > 0) return streams;
        }

        // 2. Direct HLS Probe First (If IMDb ID is known, probe Vixolity before TMDB)
        var targetImdbId = cleanId.startsWith('tt') ? cleanId : null;
        if (targetImdbId) {
            var vixUrl = isSeries
                ? 'https://ha.vixolity.com/vs/' + targetImdbId + '/s' + s + '/e' + (e < 10 ? '0' + e : e)
                : 'https://ha.vixolity.com/vs/' + targetImdbId;
            try {
                var vRes = await fetchWithTimeout(vixUrl, { headers: VIXOLITY_HEADERS, signal: signal }, DIRECT_PROBE_TIMEOUT_MS);
                if (vRes.ok) {
                    var vTxt = await vRes.text();
                    if (vTxt.includes('#EXTM3U')) {
                        var vSubs = parseVixolitySubtitles(vTxt);
                        streams.push(toVixolityStream(vixUrl, vSubs, isSeries, s, e));
                        seenUrls.add(vixUrl);
                        // Fast path: Direct Vixolity HLS found! Return immediately, bypassing 3 on-site HTTP steps
                        return streams;
                    }
                }
            } catch (vErr) {
                if (signal && signal.aborted) throw vErr;
                // If probe fails or times out, proceed to TMDB & fallback site-search
            }
        }

        // 3. Resolve TMDB Info (needed for fallback site search or if numeric TMDB ID was provided)
        var info = await resolveTmdbInfo(cleanId, isSeries ? 'tv' : 'movie', signal);

        // If we didn't have IMDb ID initially, but TMDB resolved an IMDb ID, probe Vixolity with remaining budget
        if (!targetImdbId && info && info.imdbId && info.imdbId.startsWith('tt')) {
            targetImdbId = info.imdbId;
            var vixUrl2 = isSeries
                ? 'https://ha.vixolity.com/vs/' + targetImdbId + '/s' + s + '/e' + (e < 10 ? '0' + e : e)
                : 'https://ha.vixolity.com/vs/' + targetImdbId;
            try {
                var vRes2 = await fetchWithTimeout(vixUrl2, { headers: VIXOLITY_HEADERS, signal: signal }, DIRECT_PROBE_TIMEOUT_MS);
                if (vRes2.ok) {
                    var vTxt2 = await vRes2.text();
                    if (vTxt2.includes('#EXTM3U')) {
                        var vSubs2 = parseVixolitySubtitles(vTxt2);
                        streams.push(toVixolityStream(vixUrl2, vSubs2, isSeries, s, e));
                        seenUrls.add(vixUrl2);
                        return streams;
                    }
                }
            } catch (vErr2) {
                if (signal && signal.aborted) throw vErr2;
            }
        }

        // 4. Fallback search on HDFilmDelisi API (retains remaining ~9s for site-search)
        var searchTitles = [info.title, info.origTitle].filter(Boolean);
        var hadResults = false;
        for (var t = 0; t < searchTitles.length; t++) {
            var results = await apiSearch(searchTitles[t], signal);
            if (!results || results.length === 0) continue;
            hadResults = true;
            var best = pickBest(results, searchTitles[t], info.year);
            if (!best || !best.slug) continue;

            if (best.imdbId && best.imdbId.startsWith('tt') && !seenUrls.has('https://ha.vixolity.com/vs/' + best.imdbId)) {
                var sUrl = 'https://ha.vixolity.com/vs/' + best.imdbId;
                try {
                    var sRes = await fetchWithTimeout(sUrl, { headers: VIXOLITY_HEADERS, signal: signal }, DIRECT_PROBE_TIMEOUT_MS);
                    if (sRes.ok) {
                        var sTxt = await sRes.text();
                        if (sTxt.includes('#EXTM3U')) {
                            var sSubs = parseVixolitySubtitles(sTxt);
                            streams.push(toVixolityStream(sUrl, sSubs, false));
                            seenUrls.add(sUrl);
                        }
                    }
                } catch (_) {}
            }

            var vf = await extractVidmodyFile(BASE_URL + '/film/' + best.slug, signal);
            if (vf && !seenUrls.has(vf.file)) {
                streams.push(toStream(vf.file, vf.subtitles));
                seenUrls.add(vf.file);
            }
            if (streams.length > 0) break;
        }

        if (streams.length === 0 && hadResults) {
            throw new ProviderError('NO_MATCH', 'HDFilmDelisi eşleşen film bulamadı', 'matching');
        }

        return streams;
    } catch (e) {
        if (e && (e.name === 'ProviderError' || e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) {
            throw e;
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
    module.exports = wrapAll({ getStreams, getMeta, getCatalog }, cfgReady);
}
if (typeof globalThis !== 'undefined') {
    globalThis.getStreams = getStreams;
    globalThis.getMeta = getMeta;
    globalThis.getCatalog = getCatalog;
}
