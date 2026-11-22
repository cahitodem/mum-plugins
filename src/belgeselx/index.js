// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { sortStreamsByQuality, filterHighestQuality } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
const { fetchWithTimeout, resolveTmdbMeta, DEFAULT_UA } = require("../shared/http.js");
const { ProviderError } = require("../shared/errors.js");
const { pickBestCandidate, normalizeText, tokenize } = require("../shared/matching.js");
var cheerio = require('cheerio-without-node-native');

var _cfgReady = null;
function cfgReady() {
    if (!_cfgReady) {
        _cfgReady = loadConfig().then(function () {
            var v = val('urls.series.belgeselx.base') || val('urls.belgeselx.base');
            if (v) BASE_URL = String(v).replace(/\/+$/, '');
            if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + '/';
        });
    }
    return _cfgReady;
}

/**
 * MUM - BelgeselX Provider
 * https://belgeselx.com platformundan belgesel film ve dizilerini,
 * diziGetir slot mimarisi ve video/data/*.php üzerinden doğrudan oynatılabilir
 * Google Drive / OK.ru / HLS / MP4 ham video akışlarına dönüştürerek sunar.
 */

var PROVIDER_NAME = 'BELGX';
var BASE_URL = 'https://belgeselx.com';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

var WORKING_HEADERS = {
    'User-Agent': DEFAULT_UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    'Referer': BASE_URL + '/'
};

var srcMap = {
    '0': 'new5',
    '2': 'new1',
    '5': 'new4',
    '3': 'new2',
    '4': 'new3'
};

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[ğĞ]/g, 'g').replace(/[üÜ]/g, 'u').replace(/[şŞ]/g, 's')
        .replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function cleanTitle(title) {
    return String(title || '')
        .replace(/\b(belgeseli?|belgeselleri?|serisi?|dizisi?)\b/gi, '')
        .replace(/[:\-–—]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function resolveTmdbInfo(id, mediaType, signal) {
    try {
        var meta = await resolveTmdbMeta(id, mediaType || 'tv', { signal: signal, apiKey: TMDB_API_KEY });
        var res = meta || { title: '', origTitle: '', numericId: id, year: '', originCountries: [], origLanguage: '' };
        res.altTitles = [];

        var numId = res.numericId || (typeof id === 'number' || /^\d+$/.test(String(id).trim()) ? parseInt(id, 10) : null);
        if (numId) {
            try {
                var altUrl = 'https://api.themoviedb.org/3/' + (mediaType === 'movie' ? 'movie' : 'tv') + '/' + numId + '/alternative_titles?api_key=' + TMDB_API_KEY;
                var aRes = await fetchWithTimeout(altUrl, { signal: signal }, 3000);
                if (aRes.ok) {
                    var aData = await aRes.json();
                    var titles = (aData.results || aData.titles || []).map(function (x) { return x.title; }).filter(Boolean);
                    res.altTitles = titles;
                }
            } catch (_) {}
        }
        return res;
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
            throw e;
        }
        return { title: '', origTitle: '', numericId: id, year: '', originCountries: [], origLanguage: '', altTitles: [] };
    }
}

/**
 * Belgesel alt başlıkları ve kısa başlık çakışmalarında aday eşleştirmesi yapar.
 */
function pickDocumentaryFallback(candidates, targetTitle, targetYear, seasonNum) {
    if (!targetTitle || !Array.isArray(candidates) || candidates.length === 0) return null;
    var tTokens = tokenize(targetTitle);
    if (tTokens.length === 0) return null;
    var tSlug = slugify(targetTitle);

    var matchingCandidates = [];
    for (var i = 0; i < candidates.length; i++) {
        var c = candidates[i];
        var cSlug = c.slug || slugify(c.title);
        var cTokens = new Set(tokenize(c.title).concat(tokenize(cSlug)));
        
        var allTokensMatch = tTokens.every(function (tok) { return cTokens.has(tok); });
        var slugPrefixMatch = cSlug.indexOf(tSlug) === 0 || cSlug.indexOf('-' + tSlug) !== -1;
        
        if (allTokensMatch || slugPrefixMatch) {
            matchingCandidates.push(c);
        }
    }

    if (matchingCandidates.length === 0) return null;
    if (matchingCandidates.length === 1) return matchingCandidates[0];

    matchingCandidates.sort(function (a, b) {
        var aText = (a.title + ' ' + (a.slug || '')).toLowerCase();
        var bText = (b.title + ' ' + (b.slug || '')).toLowerCase();
        
        var aIsSeason2 = /yeni|dunyalar|season\s*2|sezon\s*2|\b2\b/i.test(aText);
        var bIsSeason2 = /yeni|dunyalar|season\s*2|sezon\s*2|\b2\b/i.test(bText);

        if (seasonNum === 2) {
            if (aIsSeason2 && !bIsSeason2) return -1;
            if (!aIsSeason2 && bIsSeason2) return 1;
        } else if (seasonNum === 1) {
            if (!aIsSeason2 && bIsSeason2) return -1;
            if (aIsSeason2 && !bIsSeason2) return 1;
        }

        if (targetYear) {
            var aHasYear = aText.indexOf(targetYear) !== -1;
            var bHasYear = bText.indexOf(targetYear) !== -1;
            if (aHasYear && !bHasYear) return -1;
            if (!aHasYear && bHasYear) return 1;
        }

        return (a.slug || a.title).length - (b.slug || b.title).length;
    });

    return matchingCandidates[0];
}

/**
 * HTML içindeki diziGetir(...) fonksiyon çağrılarını ayrıştırır.
 */
function parseDiziGetirCalls(html) {
    var episodes = [];
    var regex = /diziGetir\s*\(([^)]+)\)/g;
    var m;
    while ((m = regex.exec(html)) !== null) {
        var rawArgs = m[1];
        var args = [];
        var cur = '';
        var inQuote = null;
        for (var i = 0; i < rawArgs.length; i++) {
            var c = rawArgs[i];
            if (inQuote) {
                if (c === inQuote) {
                    inQuote = null;
                } else if (c === '\\' && i + 1 < rawArgs.length) {
                    cur += rawArgs[++i];
                } else {
                    cur += c;
                }
            } else {
                if (c === "'" || c === '"') {
                    inQuote = c;
                } else if (c === ',') {
                    args.push(cur.trim());
                    cur = '';
                } else {
                    cur += c;
                }
            }
        }
        if (cur.trim()) args.push(cur.trim());

        var cleanArgs = args.map(function (a) { return a.replace(/^['"]|['"]$/g, ''); });
        if (cleanArgs.length >= 11) {
            if (cleanArgs[0] === 'id' || isNaN(parseInt(cleanArgs[0], 10))) continue;
            episodes.push({
                id: cleanArgs[0],
                ic1: cleanArgs[1],
                ic2: cleanArgs[2],
                ic3: cleanArgs[3],
                title: cleanArgs[4],
                hit: cleanArgs[5],
                date: cleanArgs[6],
                season: parseInt(cleanArgs[7], 10) || 1,
                episode: parseInt(cleanArgs[8], 10) || 1,
                diziId: cleanArgs[9],
                slug: cleanArgs[10]
            });
        }
    }
    return episodes;
}

/**
 * Arama sayfası HTML'inden aday belgesel linklerini ve kartlarını toplar.
 */
function parseSearchCandidates($, baseUrl) {
    var candidates = [];
    var seen = Object.create(null);

    $('.px-toplist-item, a[href*="/belgesel/"], a[href*="/belgeseldizi/"]').each(function () {
        var href = $(this).attr('href') || '';
        if (!href) return;

        var absolute;
        try { absolute = new URL(href, baseUrl).href; } catch (e) { return; }
        if (absolute.indexOf(baseUrl) !== 0) return;

        var pathParts = absolute.replace(baseUrl, '').split('/').filter(Boolean);
        if (pathParts.length < 2) return;
        var pathSlug = pathParts[1];
        if (!pathSlug || pathSlug === 'belgesel' || pathSlug === 'belgeseldizi') return;

        var targetDocUrl = baseUrl + '/belgesel/' + pathSlug;

        var imgAlt = $(this).find('img').attr('alt') || '';
        var toplistTitle = $(this).find('.px-toplist-title').text().trim();
        var linkTitle = $(this).attr('title') || $(this).text().trim().replace(/\s+/g, ' ');
        var candidateTitle = toplistTitle || imgAlt || linkTitle || pathSlug.replace(/-/g, ' ');

        var candYear = '';
        var yearMatch = (candidateTitle + ' ' + pathSlug).match(/\b(19\d\d|20\d\d)\b/);
        if (yearMatch) candYear = yearMatch[1];

        if (!seen[targetDocUrl]) {
            seen[targetDocUrl] = true;
            candidates.push({
                title: candidateTitle,
                slug: pathSlug,
                href: targetDocUrl,
                year: candYear
            });
        }
    });

    return candidates;
}

/**
 * Google Drive preview embed adresini doğrudan oynatılabilir raw MP4 akış linkine dönüştürür.
 */
async function resolveGoogleDriveStream(driveUrl, signal) {
    var match = driveUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i);
    if (!match) return null;
    var fileId = match[1];

    try {
        var dlUrl = 'https://drive.usercontent.google.com/download?id=' + fileId + '&export=download';
        var res = await fetchWithTimeout(dlUrl, {
            headers: { 'User-Agent': DEFAULT_UA },
            signal: signal
        }, 5000);

        if (!res.ok) return null;

        var contentType = res.headers.get('content-type') || '';
        if (contentType.indexOf('octet-stream') !== -1 || contentType.indexOf('video/') !== -1) {
            return {
                url: dlUrl,
                type: 'mp4',
                quality: '1080p',
                headers: { 'User-Agent': DEFAULT_UA }
            };
        }

        var html = await res.text();
        var $ = cheerio.load(html);
        var form = $('form#download-form, form[action*="download"]');
        if (form.length > 0) {
            var inputs = {};
            form.find('input').each(function () {
                var name = $(this).attr('name');
                if (name && name !== 'undefined') {
                    inputs[name] = $(this).attr('value') || '';
                }
            });
            var action = form.attr('action') || 'https://drive.usercontent.google.com/download';
            var queryParts = [];
            Object.keys(inputs).forEach(function (k) {
                queryParts.push(encodeURIComponent(k) + '=' + encodeURIComponent(inputs[k]));
            });
            if (!inputs.confirm) queryParts.push('confirm=t');
            var finalUrl = action + (action.indexOf('?') !== -1 ? '&' : '?') + queryParts.join('&');
            return {
                url: finalUrl,
                type: 'mp4',
                quality: '1080p',
                headers: { 'User-Agent': DEFAULT_UA }
            };
        }

        return {
            url: 'https://drive.usercontent.google.com/download?id=' + fileId + '&export=download&confirm=t',
            type: 'mp4',
            quality: '1080p',
            headers: { 'User-Agent': DEFAULT_UA }
        };
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) throw e;
        return null;
    }
}

/**
 * OK.ru (Odnoklassniki) embed adresini doğrudan oynatılabilir raw MP4 / HLS akışına dönüştürür.
 */
async function resolveOkRuStream(okUrl, signal) {
    var match = okUrl.match(/(?:odnoklassniki\.ru|ok\.ru)\/videoembed\/([0-9]+)/i);
    if (!match) return null;
    var videoId = match[1];

    try {
        var embedPageUrl = 'https://odnoklassniki.ru/videoembed/' + videoId;
        var res = await fetchWithTimeout(embedPageUrl, {
            headers: {
                'User-Agent': DEFAULT_UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            signal: signal
        }, 5000);

        if (!res.ok) return null;
        var html = await res.text();
        if (html.indexOf('vp_video_stub') !== -1 || html.indexOf('data-module="OKVideo"') === -1) {
            return null;
        }

        var $ = cheerio.load(html);
        var dataOptions = $('div[data-module="OKVideo"]').attr('data-options');
        if (!dataOptions) return null;

        var parsed = JSON.parse(dataOptions);
        var metadata = parsed.flashvars && parsed.flashvars.metadata;
        if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch (_) {}
        }
        if (!metadata) return null;

        var okHeaders = {
            'User-Agent': DEFAULT_UA,
            'Referer': 'https://odnoklassniki.ru/'
        };

        if (metadata.hlsMasterPlaylistUrl) {
            return {
                url: metadata.hlsMasterPlaylistUrl,
                type: 'hls',
                quality: '1080p',
                headers: okHeaders
            };
        }

        var videos = Array.isArray(metadata.videos) ? metadata.videos : [];
        if (!videos.length) return null;

        var qualityRank = { 'full': 1080, 'hd': 720, 'sd': 480, 'low': 360, 'lowest': 240, 'mobile': 144 };
        videos.sort(function (a, b) {
            return (qualityRank[b.name] || 0) - (qualityRank[a.name] || 0);
        });

        var chosen = videos[0];
        var qStr = (chosen.name === 'full' || chosen.name === '1080') ? '1080p' : (chosen.name === 'hd' ? '720p' : '480p');

        return {
            url: chosen.url,
            type: 'mp4',
            quality: qStr,
            headers: okHeaders
        };
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) throw e;
        return null;
    }
}

/**
 * video/data/*.php sayfasından video kaynağını ayrıştırır ve direct stream linkini çözer.
 */
async function resolvePlayerStream(pHtml, playerUrl, docHtml, targetEpisode, docPageUrl, signal) {
    if (!pHtml || typeof pHtml !== 'string') return null;
    var $ = cheerio.load(pHtml);

    var rawSrc = $('iframe[src]').attr('src') || $('video source[src], video[src]').attr('src');
    if (!rawSrc) {
        var scripts = $('script').map(function () { return $(this).html() || ''; }).get().join('\n');
        var directMatch = scripts.match(/(?:file|source|src)\s*:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
        if (directMatch && directMatch[1]) rawSrc = directMatch[1];
    }
    if (!rawSrc) return null;

    if (rawSrc.indexOf('//') === 0) rawSrc = 'https:' + rawSrc;
    var nestedMatch = rawSrc.match(/https?:\/\/[^/]+\/.*?(https?:\/\/.+)/i);
    if (nestedMatch && nestedMatch[1]) rawSrc = nestedMatch[1];

    // Ölü ve placeholder linkleri filtrele
    if (/theblacklist711tr\.mp4|googleapis\.com|recaptcha/i.test(rawSrc)) {
        return null;
    }

    var has1080p = /1080p?/i.test(pHtml) ||
                   (targetEpisode && /1080p?/i.test(targetEpisode.title)) ||
                   (docHtml && /1080p?/i.test(docHtml));
    var fallbackQuality = has1080p ? '1080p' : '720p';

    // 1. Google Drive Embed Çözümleme
    if (/drive\.google\.com/i.test(rawSrc)) {
        var driveStream = await resolveGoogleDriveStream(rawSrc, signal);
        if (driveStream) return driveStream;
    }

    // 2. OK.ru Embed Çözümleme
    if (/odnoklassniki\.ru|ok\.ru/i.test(rawSrc)) {
        var okStream = await resolveOkRuStream(rawSrc, signal);
        if (okStream) return okStream;
    }

    // 3. Doğrudan MP4 / HLS bağlantısı
    if (/\.(mp4|m3u8)(\?|$)/i.test(rawSrc)) {
        return {
            url: rawSrc,
            type: rawSrc.indexOf('.m3u8') !== -1 ? 'hls' : 'mp4',
            quality: fallbackQuality,
            headers: {
                'User-Agent': DEFAULT_UA,
                'Referer': docPageUrl
            }
        };
    }

    return null;
}

/**
 * BelgeselX Sağlayıcı getStreams fonksiyonu
 */
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

        mediaType = mediaType === 'series' ? 'tv' : mediaType;
        if (mediaType !== 'tv' && mediaType !== 'movie') return [];

        if (mediaType === 'tv') {
            if (!Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 ||
                !Number.isInteger(Number(episodeNum)) || Number(episodeNum) < 1) {
                return [];
            }
            seasonNum = Number(seasonNum);
            episodeNum = Number(episodeNum);
        } else {
            seasonNum = 1;
            episodeNum = 1;
        }

        var info = await resolveTmdbInfo(tmdbId, mediaType, signal);
        var trTitle = (info.title || '').trim();
        var orgTitle = (info.origTitle || '').trim();
        var targetYear = info.year || '';
        var displayTitle = trTitle || orgTitle || 'Belgesel';

        if (!trTitle && !orgTitle) {
            return [];
        }

        var targetDocUrl = null;
        var docHtml = null;

        // ── 1. Doğrudan Slug Probu ─────────────────────────────────────────
        var candidateSlugs = [];
        var titlesToCheck = [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)].concat(info.altTitles || []).filter(Boolean);
        titlesToCheck.forEach(function (t) {
            var s = slugify(t);
            if (s && candidateSlugs.indexOf(s) === -1) candidateSlugs.push(s);
            if (t.includes(':') || t.includes('-')) {
                var sPrefix = slugify(t.split(/[:\-]/)[0]);
                if (sPrefix && candidateSlugs.indexOf(sPrefix) === -1) candidateSlugs.push(sPrefix);
            }
        });

        for (var sIdx = 0; sIdx < candidateSlugs.length; sIdx++) {
            var cSlug = candidateSlugs[sIdx];
            if (!cSlug || cSlug.length < 2) continue;
            var testUrl = BASE_URL + '/belgesel/' + cSlug;
            try {
                var probeRes = await fetchWithTimeout(testUrl, { headers: WORKING_HEADERS, signal: signal }, 4000);
                if (probeRes.ok) {
                    var probeText = await probeRes.text();
                    if (probeText.indexOf('diziGetir') !== -1) {
                        targetDocUrl = testUrl;
                        docHtml = probeText;
                        break;
                    }
                }
            } catch (probeErr) {
                if (probeErr && (probeErr.name === 'AbortError' || probeErr.message === 'TIMEOUT' || probeErr.name === 'ProviderError')) {
                    throw probeErr;
                }
            }
        }

        // ── 2. Arama ve Kart Ayrıştırma Fallback'i ────────────────────────────
        if (!docHtml) {
            var searchQueries = [];
            [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)].forEach(function (q) {
                if (q && searchQueries.indexOf(q) === -1) searchQueries.push(q);
            });

            var bestCandidate = null;
            var allCandidateTitles = [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)].concat(info.altTitles || []).filter(Boolean);

            for (var qIdx = 0; qIdx < searchQueries.length; qIdx++) {
                var q = searchQueries[qIdx];
                if (!q) continue;
                var searchUrl = BASE_URL + '/?s=' + encodeURIComponent(q);
                var sRes = await fetchWithTimeout(searchUrl, { headers: WORKING_HEADERS, signal: signal }, 6000);
                if (!sRes.ok) continue;
                var sHtml = await sRes.text();
                var $search = cheerio.load(sHtml);

                var candidates = parseSearchCandidates($search, BASE_URL);
                if (candidates.length === 0) continue;

                for (var tIdx = 0; tIdx < allCandidateTitles.length; tIdx++) {
                    var testTitle = allCandidateTitles[tIdx];
                    bestCandidate = pickBestCandidate(candidates, testTitle, targetYear, { minCoverage: 0.5, minScore: 40 });
                    if (bestCandidate && bestCandidate.href) break;
                }

                if (!bestCandidate) {
                    bestCandidate = pickDocumentaryFallback(candidates, trTitle || orgTitle, targetYear, seasonNum);
                }

                if (bestCandidate && bestCandidate.href) {
                    targetDocUrl = bestCandidate.href;
                    break;
                }
            }

            if (targetDocUrl) {
                var docRes = await fetchWithTimeout(targetDocUrl, { headers: WORKING_HEADERS, signal: signal }, 6000);
                if (docRes.ok) {
                    docHtml = await docRes.text();
                }
            }
        }

        if (!docHtml || docHtml.indexOf('diziGetir') === -1) {
            return [];
        }

        // ── 3. Hedef Bölümün Ayrıştırılması ──────────────────────────────────
        var episodes = parseDiziGetirCalls(docHtml);
        if (!episodes || episodes.length === 0) {
            return [];
        }

        var targetEpisode = null;
        if (mediaType === 'tv') {
            targetEpisode = episodes.find(function (e) {
                return e.season === seasonNum && e.episode === episodeNum;
            });
            if (!targetEpisode && seasonNum === 1) {
                targetEpisode = episodes.find(function (e) { return e.episode === episodeNum; });
            }
        } else {
            targetEpisode = episodes.find(function (e) { return e.season === 1 && e.episode === 1; }) || episodes[0];
        }

        if (!targetEpisode) {
            return [];
        }

        // ── 4. Alternatifli Slot Çözümleme (ic1 -> ic2 -> ic3) ───────────────
        var slots = [
            { ic: targetEpisode.ic1, sira: 1 },
            { ic: targetEpisode.ic2, sira: 2 },
            { ic: targetEpisode.ic3, sira: 3 }
        ];

        var streams = [];
        var docPageUrl = targetDocUrl || (BASE_URL + '/belgesel/' + targetEpisode.slug);

        for (var slotIdx = 0; slotIdx < slots.length; slotIdx++) {
            var slot = slots[slotIdx];
            var icVal = slot.ic;
            if (!icVal && icVal !== '0') continue;

            var scriptName = srcMap[String(icVal)];
            if (!scriptName) continue;

            var playerUrl = BASE_URL + '/video/data/' + scriptName + '.php?id=' + targetEpisode.id + '&sira=' + slot.sira;
            try {
                var pRes = await fetchWithTimeout(playerUrl, {
                    headers: Object.assign({}, WORKING_HEADERS, { 'Referer': docPageUrl }),
                    signal: signal
                }, 4000);
                if (!pRes.ok) continue;

                var pHtml = await pRes.text();
                var resolved = await resolvePlayerStream(pHtml, playerUrl, docHtml, targetEpisode, docPageUrl, signal);
                if (resolved && resolved.url) {
                    var streamHeaders = resolved.headers || {
                        'User-Agent': WORKING_HEADERS['User-Agent'],
                        'Referer': docPageUrl
                    };

                    var epTitlePart = targetEpisode.title ? ' · ' + targetEpisode.title : '';
                    var seasonEpPart = mediaType === 'tv' ? (' · ' + seasonNum + '. Sezon ' + episodeNum + '. Bölüm') : '';

                    streams.push({
                        name: displayTitle,
                        title: '⌜ ' + PROVIDER_NAME + ' ⌟ | ' + displayTitle + epTitlePart + seasonEpPart + ' [TR Dublaj]',
                        url: resolved.url,
                        quality: resolved.quality || '720p',
                        type: resolved.type || (resolved.url.indexOf('.m3u8') !== -1 ? 'hls' : 'mp4'),
                        provider: 'belgeselx',
                        headers: streamHeaders,
                        behaviorHints: {
                            notWebReady: true,
                            proxyHeaders: {
                                request: streamHeaders
                            }
                        }
                    });

                    // İlk çalışan ve doğrudan oynatılabilir video akışı alındığında yeterlidir
                    break;
                }
            } catch (errSlot) {
                if (errSlot && (errSlot.name === 'AbortError' || errSlot.message === 'TIMEOUT' || (signal && signal.aborted))) {
                    throw errSlot;
                }
                continue;
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
if (typeof getStreams === "function") {
    var _origGetStreams = getStreams;
    getStreams = async function () {
        var res = await _origGetStreams.apply(this, arguments);
        var sorted = sortStreamsByQuality(res);
        return filterHighestQuality(sorted);
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = wrapAll({ getStreams: getStreams }, cfgReady);
}
if (typeof globalThis !== 'undefined') {
    globalThis.getStreams = getStreams;
}
