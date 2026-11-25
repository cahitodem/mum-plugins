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

var SITEMAP_CACHE_TTL_MS = 3600000;

function romanToDigitText(text) {
    return String(text || '')
        .replace(/\bII\b/gi, '2')
        .replace(/\bIII\b/gi, '3')
        .replace(/\bIV\b/gi, '4')
        .replace(/\bV\b/gi, '5');
}

function getSitemapCacheStore() {
    var g = typeof globalThis !== 'undefined' ? globalThis : {};
    if (!g.__MUM_BELGESELX_SITEMAP__) {
        g.__MUM_BELGESELX_SITEMAP__ = Object.create(null);
    }
    return g.__MUM_BELGESELX_SITEMAP__;
}

async function loadSitemapCandidates(baseUrl, signal) {
    var store = getSitemapCacheStore();
    var cached = store[baseUrl];
    if (cached && Date.now() < cached.expiresAt && Array.isArray(cached.candidates) && cached.candidates.length > 0) {
        return cached.candidates;
    }

    var sitemapUrl = baseUrl + '/sitemap.php';
    var res = await fetchWithTimeout(sitemapUrl, { headers: WORKING_HEADERS, signal: signal }, 6000);
    if (res.status === 403 || res.status === 429) {
        throw new ProviderError('HTTP_BLOCKED', 'Blocked fetching sitemap', 'search', res.status);
    }
    if (!res.ok) return [];

    var xml = await res.text();
    var candidates = [];
    var seen = Object.create(null);
    var locRegex = /<loc>\s*(https?:\/\/[^<]+?)\s*<\/loc>/gi;
    var m;
    while ((m = locRegex.exec(xml)) !== null) {
        var loc = m[1];
        if (loc.indexOf(baseUrl) !== 0) continue;
        var pathMatch = loc.match(/\/belgesel\/([^/?#<]+)/i);
        if (!pathMatch || !pathMatch[1]) continue;
        var pathSlug = pathMatch[1];
        if (pathSlug === 'belgesel' || pathSlug === 'belgeseldizi') continue;

        var targetUrl = baseUrl + '/belgesel/' + pathSlug;
        if (seen[targetUrl]) continue;
        seen[targetUrl] = true;

        var titleText = pathSlug.replace(/-/g, ' ');
        var ym = pathSlug.match(/\b(19\d\d|20\d\d)\b/);
        candidates.push({
            title: titleText,
            slug: pathSlug,
            href: targetUrl,
            year: ym ? ym[1] : ''
        });
    }

    if (candidates.length > 0) {
        store[baseUrl] = {
            expiresAt: Date.now() + SITEMAP_CACHE_TTL_MS,
            candidates: candidates
        };
    }

    return candidates;
}

/**
 * Belgesel alt başlıkları ve kısa başlık çakışmalarında aday eşleştirmesi yapar.
 */
function pickDocumentaryFallback(candidates, targetTitle, targetYear, seasonNum) {
    if (!targetTitle || !Array.isArray(candidates) || candidates.length === 0) return null;
    var tTokens = tokenize(targetTitle);
    if (tTokens.length === 0) return null;
    var tSlug = slugify(targetTitle);
    var targetHasSequel = /\b(2|3|4|5|ii|iii|iv)\b/i.test(targetTitle);

    var matchingCandidates = [];
    for (var i = 0; i < candidates.length; i++) {
        var c = candidates[i];
        var cSlug = c.slug || slugify(c.title);
        var cTokens = new Set(tokenize(c.title).concat(tokenize(cSlug)));

        if (!targetHasSequel && tTokens.length <= 2) {
            var candHasSequel = cTokens.has('2') || cTokens.has('3') || cTokens.has('4') ||
                cTokens.has('ii') || cTokens.has('iii') || cTokens.has('iv') ||
                /(?:^|-)([234]|ii|iii|iv)$/i.test(cSlug);
            if (candHasSequel) continue;
        }

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
 * BelgeselX belgeselx2.php?cid=... / belgeselx.php?cid=... adreslerini Referer göndermeden
 * 302 yönlendirmesiyle doğrudan oynatılabilir Google Photos / googlevideo MP4 akışına çözer.
 */
async function resolveBelgeselxCidStream(cidUrl, fallbackQuality, signal) {
    if (!cidUrl) return null;
    var currentUrl = cidUrl;
    var q = /belgeselx2\.php/i.test(cidUrl) ? '720p' : (fallbackQuality || '480p');

    try {
        for (var hop = 0; hop < 4; hop++) {
            var res = await fetchWithTimeout(currentUrl, {
                headers: { 'User-Agent': DEFAULT_UA },
                redirect: 'manual',
                signal: signal
            }, 5000);

            if (res.status >= 300 && res.status < 400) {
                var loc = res.headers && typeof res.headers.get === 'function' ? res.headers.get('location') : null;
                if (!loc) break;
                try { currentUrl = new URL(loc, currentUrl).href; } catch (_) { currentUrl = loc; }
                if (/googlevideo\.com/i.test(currentUrl)) {
                    return {
                        url: currentUrl,
                        type: 'mp4',
                        quality: q,
                        headers: { 'User-Agent': DEFAULT_UA }
                    };
                }
                continue;
            }

            if (res.url && res.url !== currentUrl && !/belgeselx\.com/i.test(res.url)) {
                currentUrl = res.url;
            }

            if (res.ok) {
                var ct = (res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-type') : '') || '';
                if (/video\/|octet-stream/i.test(ct) || /googlevideo\.com/i.test(currentUrl)) {
                    return {
                        url: currentUrl,
                        type: 'mp4',
                        quality: q,
                        headers: { 'User-Agent': DEFAULT_UA }
                    };
                }
            }
            break;
        }
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) {
            if (signal && signal.aborted) throw e;
            return null;
        }
    }

    if (/googlevideo\.com/i.test(currentUrl)) {
        return {
            url: currentUrl,
            type: 'mp4',
            quality: q,
            headers: { 'User-Agent': DEFAULT_UA }
        };
    }

    return null;
}

/**
 * Yandex.Disk (yadi.sk / disk.yandex.*) paylaşım linkini resmi public resources API üzerinden çözer.
 */
async function resolveYandexDiskStream(yadiUrl, fallbackQuality, signal) {
    if (!yadiUrl) return null;
    try {
        var apiUrl = 'https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=' + encodeURIComponent(yadiUrl);
        var res = await fetchWithTimeout(apiUrl, {
            headers: { 'User-Agent': DEFAULT_UA },
            signal: signal
        }, 5000);
        if (!res.ok) return null;
        var data = await res.json();
        if (data && typeof data.href === 'string' && /^https?:\/\//i.test(data.href)) {
            if (/theblacklist711tr\.mp4/i.test(data.href)) return null;
            return {
                url: data.href,
                type: 'mp4',
                quality: fallbackQuality || '720p',
                headers: { 'User-Agent': DEFAULT_UA }
            };
        }
        return null;
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) {
            if (signal && signal.aborted) throw e;
        }
        return null;
    }
}

/**
 * Dailymotion embed/video adresini player metadata API üzerinden HLS/MP4 akışına çözer.
 */
async function resolveDailymotionStream(dmUrl, fallbackQuality, signal) {
    var match = String(dmUrl || '').match(/(?:dailymotion\.com\/(?:embed\/)?video\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
    if (!match) return null;
    var videoId = match[1];

    try {
        var metaUrl = 'https://www.dailymotion.com/player/metadata/video/' + videoId;
        var res = await fetchWithTimeout(metaUrl, {
            headers: {
                'User-Agent': DEFAULT_UA,
                'Referer': 'https://www.dailymotion.com/'
            },
            signal: signal
        }, 5000);
        if (!res.ok) return null;
        var data = await res.json();
        if (!data || data.error || !data.qualities) return null;

        var dmHeaders = {
            'User-Agent': DEFAULT_UA,
            'Referer': 'https://www.dailymotion.com/'
        };

        var prefOrder = ['1080', '720', '480', '380', '240', 'auto'];
        for (var i = 0; i < prefOrder.length; i++) {
            var qKey = prefOrder[i];
            var list = data.qualities[qKey];
            if (!Array.isArray(list) || list.length === 0) continue;

            var mp4Entry = list.find(function (x) { return x && x.type === 'video/mp4' && x.url; });
            if (mp4Entry) {
                return {
                    url: mp4Entry.url,
                    type: 'mp4',
                    quality: /^\d+$/.test(qKey) ? (qKey + 'p') : (fallbackQuality || '720p'),
                    headers: dmHeaders
                };
            }
            var hlsEntry = list.find(function (x) { return x && /mpegurl/i.test(x.type || '') && x.url; });
            if (hlsEntry) {
                return {
                    url: hlsEntry.url,
                    type: 'hls',
                    quality: /^\d+$/.test(qKey) ? (qKey + 'p') : (fallbackQuality || '720p'),
                    headers: dmHeaders
                };
            }
        }
        return null;
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) {
            if (signal && signal.aborted) throw e;
        }
        return null;
    }
}

function normalizeCandidateUrl(rawSrc) {
    if (!rawSrc || typeof rawSrc !== 'string') return '';
    var u = rawSrc.trim();
    if (!u) return '';
    if (u.indexOf('//') === 0) u = 'https:' + u;
    var nestedMatch = u.match(/https?:\/\/[^/]+\/.*?(https?:\/\/.+)/i);
    if (nestedMatch && nestedMatch[1]) u = nestedMatch[1];
    return u;
}

/**
 * video/data/*.php sayfasından video kaynağını ayrıştırır ve direct stream linkini çözer.
 */
async function resolvePlayerStream(pHtml, playerUrl, docHtml, targetEpisode, docPageUrl, signal) {
    if (!pHtml || typeof pHtml !== 'string') return null;
    var $ = cheerio.load(pHtml);

    var has1080p = /1080p?/i.test(pHtml) ||
                   (targetEpisode && /1080p?/i.test(targetEpisode.title)) ||
                   (docHtml && /1080p?/i.test(docHtml));
    var fallbackQuality = has1080p ? '1080p' : '720p';

    // 1. Önce iframe kaynağını kontrol et
    var iframeSrc = normalizeCandidateUrl($('iframe[src]').attr('src'));
    if (iframeSrc && !/theblacklist711tr\.mp4|googleapis\.com|recaptcha/i.test(iframeSrc)) {
        if (/drive\.google\.com/i.test(iframeSrc)) {
            var driveStream = await resolveGoogleDriveStream(iframeSrc, signal);
            if (driveStream) return driveStream;
        }
        if (/odnoklassniki\.ru|ok\.ru/i.test(iframeSrc)) {
            var okStream = await resolveOkRuStream(iframeSrc, signal);
            if (okStream) return okStream;
        }
        if (/yadi\.sk|disk\.yandex\./i.test(iframeSrc)) {
            var yadiStream = await resolveYandexDiskStream(iframeSrc, fallbackQuality, signal);
            if (yadiStream) return yadiStream;
        }
        if (/dailymotion\.com|dai\.ly/i.test(iframeSrc)) {
            var dmStream = await resolveDailymotionStream(iframeSrc, fallbackQuality, signal);
            if (dmStream) return dmStream;
        }
        if (/\.(mp4|m3u8)(\?|$)/i.test(iframeSrc)) {
            return {
                url: iframeSrc,
                type: iframeSrc.indexOf('.m3u8') !== -1 ? 'hls' : 'mp4',
                quality: fallbackQuality,
                headers: {
                    'User-Agent': DEFAULT_UA,
                    'Referer': docPageUrl
                }
            };
        }
    }

    // 2. <script> içindeki JWPlayer kaynaklarını (new4.php belgeselx2.php?cid=... ve doğrudan m3u8/mp4) tara
    // Not: new4.php DOM'unda sahte <video src="...theblacklist711tr.mp4"> bulunduğu için script taraması <video>'dan önce çalışmalıdır.
    var scripts = $('script').map(function () { return $(this).html() || ''; }).get().join('\n');
    if (scripts) {
        var cidMatches = scripts.match(/https?:\/\/[^"'\s]*\/video\/belgeselx2?\.php\?cid=[^"'\s]+/gi) || [];
        if (cidMatches.length > 0) {
            cidMatches.sort(function (a, b) {
                var aIs720 = /belgeselx2\.php/i.test(a) ? 0 : 1;
                var bIs720 = /belgeselx2\.php/i.test(b) ? 0 : 1;
                return aIs720 - bIs720;
            });
            for (var cIdx = 0; cIdx < cidMatches.length; cIdx++) {
                var cidStream = await resolveBelgeselxCidStream(cidMatches[cIdx], fallbackQuality, signal);
                if (cidStream) return cidStream;
            }
        }

        var directMatch = scripts.match(/(?:file|source|src)\s*:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
        if (directMatch && directMatch[1]) {
            var scriptSrc = normalizeCandidateUrl(directMatch[1]);
            if (scriptSrc && !/theblacklist711tr\.mp4|googleapis\.com|recaptcha/i.test(scriptSrc)) {
                return {
                    url: scriptSrc,
                    type: scriptSrc.indexOf('.m3u8') !== -1 ? 'hls' : 'mp4',
                    quality: fallbackQuality,
                    headers: {
                        'User-Agent': DEFAULT_UA,
                        'Referer': docPageUrl
                    }
                };
            }
        }
    }

    // 3. Son olarak DOM <video> elementini kontrol et (ölü placeholder'ları atla)
    var videoSrc = normalizeCandidateUrl($('video source[src], video[src]').attr('src'));
    if (videoSrc && !/theblacklist711tr\.mp4|googleapis\.com|recaptcha/i.test(videoSrc)) {
        if (/\.(mp4|m3u8)(\?|$)/i.test(videoSrc)) {
            return {
                url: videoSrc,
                type: videoSrc.indexOf('.m3u8') !== -1 ? 'hls' : 'mp4',
                quality: fallbackQuality,
                headers: {
                    'User-Agent': DEFAULT_UA,
                    'Referer': docPageUrl
                }
            };
        }
    }

    return null;
}

/**
 * BelgeselX Sağlayıcı getStreams fonksiyonu
 */
async function getStreams(tmdbId, mediaType, seasonNum, episodeNum, options) {
    await cfgReady();
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
            if (seasonNum === null || seasonNum === undefined || seasonNum === '' ||
                episodeNum === null || episodeNum === undefined || episodeNum === '' ||
                !Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 ||
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
            throw new ProviderError('TMDB_ERROR', 'TMDB metadata unavailable', 'tmdb');
        }

        var targetDocUrl = null;
        var docHtml = null;
        var blockedStatus = 0;

        // ── 1. Doğrudan Slug Probu ─────────────────────────────────────────
        var candidateSlugs = [];
        var titlesToCheck = [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)].concat(info.altTitles || []).filter(Boolean);
        titlesToCheck.forEach(function (t) {
            var variants = [t, romanToDigitText(t)];
            variants.forEach(function (tv) {
                var s = slugify(tv);
                if (s && candidateSlugs.indexOf(s) === -1) candidateSlugs.push(s);
                if (tv.includes(':') || tv.includes('-')) {
                    var sPrefix = slugify(tv.split(/[:\-]/)[0]);
                    if (sPrefix && candidateSlugs.indexOf(sPrefix) === -1) candidateSlugs.push(sPrefix);
                }
            });
        });

        for (var sIdx = 0; sIdx < candidateSlugs.length; sIdx++) {
            var cSlug = candidateSlugs[sIdx];
            if (!cSlug || cSlug.length < 2) continue;
            var testUrl = BASE_URL + '/belgesel/' + cSlug;
            try {
                var probeRes = await fetchWithTimeout(testUrl, { headers: WORKING_HEADERS, signal: signal }, 4000);
                if (probeRes.status === 403 || probeRes.status === 429) {
                    blockedStatus = probeRes.status;
                    continue;
                }
                if (probeRes.ok) {
                    if (probeRes.url && probeRes.url.indexOf('/404') !== -1) continue;
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

        // ── 2. Sitemap İndeksi ve Arama Fallback'i ──────────────────────────
        if (!docHtml) {
            var bestCandidate = null;
            var allCandidateTitles = [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)]
                .concat(info.altTitles || [])
                .filter(Boolean);

            var sitemapCandidates = [];
            try {
                sitemapCandidates = await loadSitemapCandidates(BASE_URL, signal);
            } catch (smErr) {
                if (smErr && (smErr.name === 'AbortError' || smErr.message === 'TIMEOUT' || smErr.name === 'ProviderError')) {
                    throw smErr;
                }
            }

            if (sitemapCandidates.length > 0) {
                for (var stIdx = 0; stIdx < allCandidateTitles.length; stIdx++) {
                    var sTitle = allCandidateTitles[stIdx];
                    bestCandidate = pickBestCandidate(sitemapCandidates, sTitle, targetYear, {
                        minCoverage: 0.65,
                        minScore: 45,
                        preserveSlugNumbers: true
                    });
                    if (!bestCandidate && romanToDigitText(sTitle) !== sTitle) {
                        bestCandidate = pickBestCandidate(sitemapCandidates, romanToDigitText(sTitle), targetYear, {
                            minCoverage: 0.65,
                            minScore: 45,
                            preserveSlugNumbers: true
                        });
                    }
                    if (bestCandidate && bestCandidate.href) break;
                }
                if (!bestCandidate) {
                    bestCandidate = pickDocumentaryFallback(sitemapCandidates, trTitle || orgTitle, targetYear, seasonNum);
                }
                if (bestCandidate && bestCandidate.href) {
                    targetDocUrl = bestCandidate.href;
                }
            }

            // Sitemap boş dönerse (örn. yerel mock/özel ortam), ?s= HTML aday ayrıştırmasına düş
            if (!targetDocUrl && sitemapCandidates.length === 0) {
                var searchQueries = [];
                [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)].forEach(function (q) {
                    if (q && searchQueries.indexOf(q) === -1) searchQueries.push(q);
                });

                for (var qIdx = 0; qIdx < searchQueries.length; qIdx++) {
                    var q = searchQueries[qIdx];
                    if (!q) continue;
                    var searchUrl = BASE_URL + '/?s=' + encodeURIComponent(q);
                    var sRes = await fetchWithTimeout(searchUrl, { headers: WORKING_HEADERS, signal: signal }, 6000);
                    if (sRes.status === 403 || sRes.status === 429) {
                        blockedStatus = sRes.status;
                        continue;
                    }
                    if (!sRes.ok) continue;
                    var sHtml = await sRes.text();
                    var $search = cheerio.load(sHtml);

                    var candidates = parseSearchCandidates($search, BASE_URL);
                    if (candidates.length === 0) continue;

                    for (var tIdx = 0; tIdx < allCandidateTitles.length; tIdx++) {
                        var testTitle = allCandidateTitles[tIdx];
                        bestCandidate = pickBestCandidate(candidates, testTitle, targetYear, {
                            minCoverage: 0.5,
                            minScore: 40,
                            preserveSlugNumbers: true
                        });
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
            }

            if (targetDocUrl) {
                var docRes = await fetchWithTimeout(targetDocUrl, { headers: WORKING_HEADERS, signal: signal }, 6000);
                if (docRes.status === 403 || docRes.status === 429) {
                    throw new ProviderError('HTTP_BLOCKED', 'Blocked fetching documentary page', 'details', docRes.status);
                }
                if (docRes.ok) {
                    docHtml = await docRes.text();
                }
            }
        }

        if (!docHtml || docHtml.indexOf('diziGetir') === -1) {
            if (blockedStatus) {
                throw new ProviderError('HTTP_BLOCKED', 'Blocked by host', 'search', blockedStatus);
            }
            throw new ProviderError('NO_MATCH', 'No matching documentary found', 'matching');
        }

        // ── 3. Hedef Bölümün Ayrıştırılması ──────────────────────────────────
        var episodes = parseDiziGetirCalls(docHtml);
        if (!episodes || episodes.length === 0) {
            throw new ProviderError('PARSE_ERROR', 'No episodes found in diziGetir', 'details');
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
            throw new ProviderError('NO_MATCH', 'Requested episode not found', 'matching');
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
