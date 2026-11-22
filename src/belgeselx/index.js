// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { sortStreamsByQuality, filterHighestQuality } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
const { fetchWithTimeout, resolveTmdbMeta, DEFAULT_UA } = require("../shared/http.js");
const { ProviderError } = require("../shared/errors.js");
const { pickBestCandidate, normalizeText } = require("../shared/matching.js");
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
 * diziGetir slot mimarisi ve video/data/*.php üzerinden Türkçe Dublaj akışları sunar.
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
        return meta || { title: '', origTitle: '', numericId: id, year: '', originCountries: [], origLanguage: '' };
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
            throw e;
        }
        return { title: '', origTitle: '', numericId: id, year: '', originCountries: [], origLanguage: '' };
    }
}

/**
 * HTML içindeki diziGetir(...) fonksiyon çağrılarını ayrıştırır.
 * Script içindeki 'function diziGetir' deklarasyonunu (cleanArgs[0] === 'id') filtreler.
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

        // URL'i daima /belgesel/{slug} formatına normalize et
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
 * video/data/*.php sayfasından iframe, video veya doğrudan mp4/hls akış adresini çıkarır.
 */
function extractStreamFromPlayerHtml(html, playerUrl, docHtml, targetEpisode) {
    if (!html || typeof html !== 'string') return null;
    var $ = cheerio.load(html);

    var has1080p = /1080p?/i.test(html) ||
                   (targetEpisode && /1080p?/i.test(targetEpisode.title)) ||
                   (docHtml && /1080p?/i.test(docHtml));
    var quality = has1080p ? '1080p' : '720p';

    // 1. Doğrudan iframe src
    var iframes = $('iframe[src]').map(function () { return $(this).attr('src'); }).get();
    for (var i = 0; i < iframes.length; i++) {
        var src = iframes[i];
        if (!src) continue;
        if (src.indexOf('//') === 0) src = 'https:' + src;

        // İç içe URL sarımlarını çöz (örn: dailymotion.com/embed/video/https://drive.google.com/...)
        var nestedMatch = src.match(/https?:\/\/[^/]+\/.*?(https?:\/\/.+)/i);
        if (nestedMatch && nestedMatch[1]) {
            src = nestedMatch[1];
        }

        // Ölü linkleri ve captcha'ları filtrele
        if (/googleapis\.com|recaptcha|google\.com\/recaptcha/i.test(src)) continue;
        if (/^https?:\/\//i.test(src)) {
            return {
                url: src,
                type: 'embed',
                quality: quality
            };
        }
    }

    // 2. Doğrudan video kaynağı (<source> veya <video>)
    var videoSrc = $('video source[src]').first().attr('src') || $('video[src]').first().attr('src');
    if (videoSrc) {
        if (videoSrc.indexOf('//') === 0) videoSrc = 'https:' + videoSrc;
        if (/^https?:\/\//i.test(videoSrc)) {
            var isHls = videoSrc.indexOf('.m3u8') !== -1;
            return {
                url: videoSrc,
                type: isHls ? 'hls' : 'mp4',
                quality: quality
            };
        }
    }

    // 3. Script blokları içindeki media URL'leri
    var scripts = $('script').map(function () { return $(this).html() || ''; }).get().join('\n');
    var directMatch = scripts.match(/(?:file|source|src)\s*:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (directMatch && directMatch[1]) {
        var mediaUrl = directMatch[1];
        var isHlsMedia = mediaUrl.indexOf('.m3u8') !== -1;
        return {
            url: mediaUrl,
            type: isHlsMedia ? 'hls' : 'mp4',
            quality: quality
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
            // Film / tekil belgesel isteklerinde 1. sezon 1. bölüm varsayılır
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

        // ── 1. Doğrudan Slug Probu (Hızlı Doğrudan Erişim < 500ms) ─────────────
        var candidateSlugs = [];
        var titlesToCheck = [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)].filter(Boolean);
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
                    // Gerçek belgesel sayfası olup olmadığını diziGetir varlığıyla doğrula (404 sayfaları 200 dönebilir)
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

                var cleanTr = cleanTitle(trTitle);
                var cleanOrg = cleanTitle(orgTitle);
                bestCandidate = pickBestCandidate(candidates, trTitle, targetYear, { minCoverage: 0.5, minScore: 40 }) ||
                                (cleanTr ? pickBestCandidate(candidates, cleanTr, targetYear, { minCoverage: 0.5, minScore: 40 }) : null);
                if (!bestCandidate && orgTitle) {
                    bestCandidate = pickBestCandidate(candidates, orgTitle, targetYear, { minCoverage: 0.5, minScore: 40 }) ||
                                    (cleanOrg ? pickBestCandidate(candidates, cleanOrg, targetYear, { minCoverage: 0.5, minScore: 40 }) : null);
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
            // Tek sezonluk belgesel serilerinde sezon numarası uyuşmazlığı varsa bölüme göre ara
            if (!targetEpisode && seasonNum === 1) {
                targetEpisode = episodes.find(function (e) { return e.episode === episodeNum; });
            }
        } else {
            // Film formatında 1. sezon 1. bölüm veya mevcut ilk bölüm alınır
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
                var extracted = extractStreamFromPlayerHtml(pHtml, playerUrl, docHtml, targetEpisode);
                if (extracted && extracted.url) {
                    var streamHeaders = {
                        'User-Agent': WORKING_HEADERS['User-Agent'],
                        'Referer': docPageUrl
                    };

                    var epTitlePart = targetEpisode.title ? ' · ' + targetEpisode.title : '';
                    var seasonEpPart = mediaType === 'tv' ? (' · ' + seasonNum + '. Sezon ' + episodeNum + '. Bölüm') : '';

                    streams.push({
                        name: displayTitle,
                        title: '⌜ ' + PROVIDER_NAME + ' ⌟ | ' + displayTitle + epTitlePart + seasonEpPart + ' [TR Dublaj]',
                        url: extracted.url,
                        quality: extracted.quality || '720p',
                        type: extracted.type || (extracted.url.indexOf('.m3u8') !== -1 ? 'hls' : 'mp4'),
                        provider: 'belgeselx',
                        headers: streamHeaders,
                        behaviorHints: {
                            notWebReady: true,
                            proxyHeaders: {
                                request: streamHeaders
                            }
                        }
                    });

                    // Başarılı bir akış çıkarıldığında yeterlidir (aşırı gecikmeyi önlemek için ilk çalışan slot alınır)
                    break;
                }
            } catch (errSlot) {
                if (errSlot && (errSlot.name === 'AbortError' || errSlot.message === 'TIMEOUT' || (signal && signal.aborted))) {
                    throw errSlot;
                }
                // Sıradaki slotu dene
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
