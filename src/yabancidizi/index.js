const { sortStreamsByQuality, getQualityScore } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
const { fetchWithTimeout } = require("../shared/http.js");
const { ProviderError } = require("../shared/errors.js");
const { pickBestCandidate } = require("../shared/matching.js");

function getResolutionScore(s) {
    var score = getQualityScore(s);
    return (score % 2 === 1) ? score - 1 : score;
}

function filterHighestQuality(streams) {
    if (!Array.isArray(streams) || streams.length <= 1) return streams;
    var maxRes = 0;
    for (var i = 0; i < streams.length; i++) {
        var res = getResolutionScore(streams[i]);
        if (res > maxRes) maxRes = res;
    }
    if (maxRes === 0) return streams;
    return streams.filter(function(s) {
        return getResolutionScore(s) >= maxRes;
    });
}

var _cfgReady = null;
function cfgReady() {
    if (!_cfgReady) {
        _cfgReady = loadConfig().then(function () {
            var v;
            v = val('urls.series.yabancidizi.base'); if (v) BASE_URL = String(v).replace(/\/+$/, '');
            if (HEADERS) HEADERS.Referer = BASE_URL + '/';
        });
    }
    return _cfgReady;
}

/**
 * Anthology - YabancıDizi Provider
 * https://yabancidizi.news/
 * Yabancı diziler kataloğu ve doğrudan 1080p HLS master.m3u8 (VidMoly) akışları.
 */

var BASE_URL = 'https://yabancidizi.news';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

var HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    'Referer': BASE_URL + '/'
};

async function safeFetch(url, options) {
    options = options || {};
    var res = await fetchWithTimeout(url, options, 8000);
    if (res.status === 403) {
        throw new ProviderError('HTTP_BLOCKED', 'YabancıDizi Cloudflare 403 Forbidden', 'network', 403);
    }
    return res;
}

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
        var cleanId = String(id || '').trim();
        if (cleanId.includes(':')) cleanId = cleanId.split(':')[0];

        var numericId = null;
        var title = '';
        var origTitle = '';
        var year = '';

        if (cleanId.startsWith('tt')) {
            var findRes = await safeFetch('https://api.themoviedb.org/3/find/' + cleanId + '?api_key=' + TMDB_API_KEY + '&external_source=imdb_id&language=tr-TR', { signal });
            if (findRes.ok) {
                var fData = await findRes.json();
                var isTv = (mediaType === 'tv' || mediaType === 'series');
                var item = isTv
                    ? (fData.tv_results && fData.tv_results[0])
                    : (fData.movie_results && fData.movie_results[0]);
                if (item) {
                    numericId = item.id;
                    title = item.name || item.title || '';
                    origTitle = item.original_name || item.original_title || '';
                    var dateStr = item.first_air_date || item.release_date || '';
                    if (dateStr) year = dateStr.slice(0, 4);
                }
            }
        } else {
            numericId = cleanId;
        }

        if (numericId && (!title || !origTitle || !year)) {
            var isTvType = (mediaType === 'tv' || mediaType === 'series');
            var type = isTvType ? 'tv' : 'movie';
            var tRes = await safeFetch('https://api.themoviedb.org/3/' + type + '/' + numericId + '?api_key=' + TMDB_API_KEY + '&language=tr-TR', { signal });
            if (tRes.ok) {
                var tData = await tRes.json();
                title = tData.name || tData.title || title;
                origTitle = tData.original_name || tData.original_title || origTitle;
                var dateStr2 = tData.first_air_date || tData.release_date || '';
                if (dateStr2) year = dateStr2.slice(0, 4);
            }
        }

        return { title: title, origTitle: origTitle, numericId: numericId, year: year };
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
            throw e;
        }
        return { title: '', origTitle: '', numericId: id, year: '' };
    }
}

async function searchYabanciDizi(query, signal) {
    try {
        var searchUrl = BASE_URL + '/search?qr=' + encodeURIComponent(query);
        var res = await safeFetch(searchUrl, {
            method: 'POST',
            headers: {
                'User-Agent': HEADERS['User-Agent'],
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': BASE_URL + '/'
            },
            signal: signal
        });
        if (!res.ok) return [];
        var data = await res.json();
        if (data && data.data && Array.isArray(data.data.result)) {
            return data.data.result;
        }
        return [];
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
            throw e;
        }
        return [];
    }
}

async function getCatalog(args, signal) {
    try {
        var query = (args && args.search) || (args && args.extra && args.extra.search) || (args && args.query) || '';
        
        if (query) {
            var results = await searchYabanciDizi(query, signal);
            var metas = results.map(function(r) {
                var poster = r.s_image ? (r.s_image.startsWith('http') ? r.s_image : BASE_URL + '/uploads/series/' + r.s_image) : '';
                return {
                    id: 'yabancidizi:show:' + r.s_link,
                    type: r.s_type === '1' ? 'movie' : 'tv',
                    name: r.s_name,
                    poster: poster,
                    background: poster,
                    genres: ['Yabancı Dizi', 'YabancıDizi'],
                    description: (r.s_name || '') + ' (' + (r.s_year || '') + ') - YabancıDizi'
                };
            });
            return { metas: metas };
        }

        // Homepage popular series
        var res = await safeFetch(BASE_URL + '/', { headers: HEADERS, signal });
        if (!res.ok) return { metas: [] };
        var html = await res.text();

        var cardRegex = /<a[^>]+href=["'](?:https?:\/\/[^"'/]+)?\/?dizi\/([^"'/]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var metas = [];
        var seen = new Set();
        var m;

        while ((m = cardRegex.exec(html)) !== null) {
            var slug = m[1];
            if (!slug || slug.startsWith('tur/') || seen.has(slug)) continue;
            seen.add(slug);

            var title = m[2].replace(/<[^>]+>/g, '').trim();
            if (!title) continue;

            metas.push({
                id: 'yabancidizi:show:' + slug,
                type: 'tv',
                name: title,
                poster: 'https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png',
                background: 'https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png',
                genres: ['Yabancı Dizi', 'YabancıDizi'],
                description: title + ' - YabancıDizi Arşivi'
            });
        }

        return { metas: metas };
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
            throw e;
        }
        return { metas: [] };
    }
}

async function getMeta(args, signal) {
    try {
        var rawId = (typeof args === 'string') ? args : (args && args.id ? args.id : '');
        if (!rawId) return { meta: null };

        if (rawId.startsWith('yabancidizi:show:')) {
            var showSlug = rawId.replace('yabancidizi:show:', '');
            var showUrl = BASE_URL + '/dizi/' + showSlug;
            var res = await safeFetch(showUrl, { headers: HEADERS, signal });
            if (!res.ok) return { meta: null };
            var html = await res.text();

            var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'YabancıDizi';

            var ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
            var poster = ogImg ? ogImg[1] : 'https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png';

            var epMatches = [...html.matchAll(/(?:dizi\/[^"'\s]*\/)?sezon-(\d+)\/bolum-(\d+)/gi)];
            var videos = [];
            var seen = new Set();

            for (var ep of epMatches) {
                var sNum = parseInt(ep[1]);
                var eNum = parseInt(ep[2]);
                var key = sNum + 'x' + eNum;
                if (seen.has(key)) continue;
                seen.add(key);

                videos.push({
                    id: 'yabancidizi:ep:' + showSlug + ':' + sNum + ':' + eNum,
                    title: sNum + '. Sezon ' + eNum + '. Bölüm',
                    season: sNum,
                    episode: eNum
                });
            }

            videos.sort(function(a, b) { return (a.season - b.season) || (a.episode - b.episode); });

            return {
                meta: {
                    id: rawId,
                    type: 'tv',
                    name: title,
                    poster: poster,
                    background: poster,
                    description: title + ' - YabancıDizi',
                    genres: ['Yabancı Dizi', 'YabancıDizi'],
                    videos: videos
                }
            };
        }

        return { meta: null };
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
            throw e;
        }
        return { meta: null };
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

async function resolveVidmolyStreams(m3u8Url, langText, seenUrls, signal) {
    var vmHeaders = {
        'User-Agent': HEADERS['User-Agent'],
        'Referer': 'https://vidmoly.biz/'
    };
    var streams = [];
    var variants = [];

    try {
        var mRes = await safeFetch(m3u8Url, {
            headers: vmHeaders,
            signal: signal
        });
        if (mRes.ok) {
            var mText = await mRes.text();
            variants = parseMasterVariants(mText, m3u8Url);
        }
    } catch (_) {}

    var langLabel = langText ? ' (' + langText + ')' : '';

    if (variants && variants.length > 0) {
        for (var v of variants) {
            if (seenUrls.has(v.url)) continue;
            seenUrls.add(v.url);

            var qLabel = v.quality || '1080p';
            var fastHint = (qLabel === '720p' || qLabel === '480p') ? ' ⚡ Hızlı' : '';

            streams.push({
                name: 'YabancıDizi',
                title: '⌜ YabancıDizi ⌟ | VidMoly [' + qLabel + fastHint + ']' + langLabel,
                url: v.url,
                quality: qLabel,
                format: 'hls',
                isHls: true,
                provider: 'yabancidizi',
                headers: vmHeaders,
                behaviorHints: {
                    notWebReady: true,
                    proxyHeaders: {
                        request: vmHeaders
                    }
                }
            });
        }
    }

    if (streams.length === 0 && !seenUrls.has(m3u8Url)) {
        seenUrls.add(m3u8Url);
        streams.push({
            name: 'YabancıDizi',
            title: '⌜ YabancıDizi ⌟ | VidMoly [1080p]' + langLabel,
            url: m3u8Url,
            quality: '1080p',
            format: 'hls',
            isHls: true,
            provider: 'yabancidizi',
            headers: vmHeaders,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: vmHeaders
                }
            }
        });
    }

    return streams;
}

async function extractStreamsFromPage(pageUrl, signal) {
    try {
        var pageRes = await safeFetch(pageUrl, {
            headers: {
                'User-Agent': HEADERS['User-Agent'],
                'Referer': BASE_URL + '/'
            },
            signal: signal
        });
        if (!pageRes.ok) return [];
        var html = await pageRes.text();

        // 1. VidMoly download & embed links directly in page HTML
        var dlRegex = /<a[^>]+href=["'](https?:\/\/vidmoly\.[a-z0-9]+\/dl\/([a-zA-Z0-9_-]+))["'][^>]*>([\s\S]*?)<\/a>/gi;
        var vmRegex = /vidmoly\.[a-z0-9]+\/(?:dl\/|embed-)([a-zA-Z0-9_-]+)/gi;
        var streams = [];
        var seenUrls = new Set();
        var seenIds = new Set();
        var m;

        while ((m = dlRegex.exec(html)) !== null) {
            var vidId = m[2];
            var label = m[3].replace(/<[^>]+>/g, '').trim();

            if (seenIds.has(vidId)) continue;
            seenIds.add(vidId);

            var langText = 'Türkçe Altyazılı';
            if (/dublaj/i.test(label)) langText = 'Türkçe Dublaj';
            else if (/ingilizce/i.test(label)) langText = 'İngilizce Altyazılı';

            var embedUrl = 'https://vidmoly.biz/embed-' + vidId + '.html';
            try {
                var vmRes = await safeFetch(embedUrl, {
                    headers: {
                        'User-Agent': HEADERS['User-Agent'],
                        'Referer': BASE_URL + '/'
                    },
                    signal: signal
                });
                if (vmRes.ok) {
                    var vmHtml = await vmRes.text();
                    var m3u8Match = vmHtml.match(/file\s*:\s*['"](https?:\/\/[^'"<>]+\.m3u8[^'"<>]*)['"]/i);
                    if (m3u8Match) {
                        var resolved = await resolveVidmolyStreams(m3u8Match[1], langText, seenUrls, signal);
                        for (var rs of resolved) streams.push(rs);
                    }
                }
            } catch (err) {
                if (err && (err.name === 'AbortError' || err.message === 'TIMEOUT' || err.name === 'ProviderError' || (signal && signal.aborted))) {
                    throw err;
                }
            }
        }

        while ((m = vmRegex.exec(html)) !== null) {
            var vidId2 = m[1];
            if (seenIds.has(vidId2)) continue;
            seenIds.add(vidId2);
            var embedUrl2 = 'https://vidmoly.biz/embed-' + vidId2 + '.html';
            try {
                var vmRes2 = await safeFetch(embedUrl2, {
                    headers: {
                        'User-Agent': HEADERS['User-Agent'],
                        'Referer': BASE_URL + '/'
                    },
                    signal: signal
                });
                if (vmRes2.ok) {
                    var vmHtml2 = await vmRes2.text();
                    var m3u8Match2 = vmHtml2.match(/file\s*:\s*['"](https?:\/\/[^'"<>]+\.m3u8[^'"<>]*)['"]/i);
                    if (m3u8Match2) {
                        var resolved2 = await resolveVidmolyStreams(m3u8Match2[1], '', seenUrls, signal);
                        for (var rs2 of resolved2) streams.push(rs2);
                    }
                }
            } catch (e) {
                if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
                    throw e;
                }
            }
        }

        return streams;
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
            throw e;
        }
        return [];
    }
}

var extractStreamsFromEpisodePage = extractStreamsFromPage;
var extractStreamsFromMoviePage = extractStreamsFromPage;

async function getStreams(tmdbIdOrArgs, mediaType, seasonNum, episodeNum, options) {
    const signal = options && options.signal;
    try {
        if (typeof tmdbIdOrArgs === 'object' && tmdbIdOrArgs && tmdbIdOrArgs.id) {
            return getStreams(tmdbIdOrArgs.id, mediaType || tmdbIdOrArgs.type, seasonNum || tmdbIdOrArgs.season, episodeNum || tmdbIdOrArgs.episode, options);
        }

        if (typeof tmdbIdOrArgs === 'string' && tmdbIdOrArgs.startsWith('yabancidizi:ep:')) {
            var parts = tmdbIdOrArgs.replace('yabancidizi:ep:', '').split(':');
            var sSlug = parts[0];
            var s = parts[1] || '1';
            var e = parts[2] || '1';
            var epUrl = BASE_URL + '/dizi/' + sSlug + '/sezon-' + s + '/bolum-' + e;
            return await extractStreamsFromEpisodePage(epUrl, signal);
        }

        if (typeof tmdbIdOrArgs === 'string' && tmdbIdOrArgs.startsWith('yabancidizi:show:')) {
            var showMeta = await getMeta(tmdbIdOrArgs, signal);
            if (showMeta && showMeta.meta && Array.isArray(showMeta.meta.videos) && showMeta.meta.videos.length > 0) {
                return await getStreams(showMeta.meta.videos[0].id, mediaType, seasonNum, episodeNum, options);
            }
        }

        var isMovie = (mediaType === 'movie');
        var season = isMovie ? 1 : (parseInt(seasonNum) || 1);
        var episode = isMovie ? 1 : (parseInt(episodeNum) || 1);

        var info = await resolveTmdbInfo(tmdbIdOrArgs, mediaType, signal);
        var searchTitles = [info.origTitle, info.title].filter(Boolean);
        if (searchTitles.length === 0) return [];

        for (var title of searchTitles) {
            var results = await searchYabanciDizi(title, signal);
            if (results.length === 0) {
                var cat = await getCatalog({ query: title }, signal);
                if (cat && cat.metas && cat.metas.length > 0) {
                    results = cat.metas.map(function(m) {
                        return {
                            s_name: m.name,
                            s_link: m.id.replace('yabancidizi:show:', ''),
                            s_type: m.type === 'movie' ? '1' : '0'
                        };
                    });
                }
            }
            if (results.length === 0) continue;

            // Content Type Isolation:
            // If movie requested: only match s_type === '1' (movies)
            // If tv requested: only match s_type === '0' or undefined (series)
            var filteredResults = results.filter(function(r) {
                if (isMovie) return r.s_type === '1';
                return r.s_type === '0' || !r.s_type;
            });
            if (filteredResults.length === 0) continue;

            var candidates = filteredResults.map(function(r) {
                return {
                    title: r.s_name,
                    year: r.s_year || '',
                    slug: r.s_link,
                    href: isMovie ? ('/film/' + r.s_link) : ('/dizi/' + r.s_link),
                    raw: r
                };
            });

            var matched = pickBestCandidate(candidates, title, info.year, { minCoverage: 0.75, minScore: 50 });
            if (!matched || !matched.raw) continue;

            var matchedShow = matched.raw;
            var targetUrl = (isMovie || matchedShow.s_type === '1')
                ? (BASE_URL + '/film/' + matchedShow.s_link)
                : (BASE_URL + '/dizi/' + matchedShow.s_link + '/sezon-' + season + '/bolum-' + episode);

            var streams = await extractStreamsFromPage(targetUrl, signal);
            if (streams.length > 0) return streams;
        }

        return [];
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
            throw e;
        }
        return [];
    }
}

// ── Universal Quality Sorter & Highest Quality Filter ─────────────────
if (typeof getStreams === "function") {
    var _origGetStreams = getStreams;
    getStreams = async function() {
        var res = await _origGetStreams.apply(this, arguments);
        var sorted = sortStreamsByQuality(res);
        return filterHighestQuality(sorted);
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = wrapAll({ getStreams: getStreams, getMeta: getMeta, getCatalog: getCatalog }, cfgReady);
}
if (typeof globalThis !== 'undefined') {
    globalThis.getStreams = getStreams;
    globalThis.getMeta = getMeta;
    globalThis.getCatalog = getCatalog;
}
