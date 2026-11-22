// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const cheerio = require('cheerio-without-node-native');
const { sortStreamsByQuality } = require('../shared/quality.js');
const { loadConfig, val } = require('../shared/config.js');
const { fetchWithTimeout, resolveTmdbMeta, DEFAULT_UA } = require('../shared/http.js');
const { ProviderError } = require('../shared/errors.js');
const { pickBestCandidate, normalizeText } = require('../shared/matching.js');

var _cfgReady = null;
function cfgReady() {
    if (!_cfgReady) {
        _cfgReady = loadConfig().then(function () {
            var v = val('urls.series.dizibox.base') || val('urls.movies.dizibox.base') || val('urls.dizibox.base');
            if (v) BASE_URL = String(v).replace(/\/+$/, '');
            var pv = val('urls.dizibox.player') || val('urls.pilavyer.base');
            if (pv) PLAYER_BASE = String(pv).replace(/\/+$/, '');
            if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + '/';
        }).catch(function () {});
    }
    return _cfgReady;
}

/**
 * MUM - DiziBox Provider
 * https://ddizibox.click platformu üzerinden dizi ve filmleri,
 * Pilavyer player API'si (pilavyerplay.top) ile HLS Master Playlist (m3u8),
 * WebVTT altyazıları ve ses kanalı desteğiyle sunar.
 */

var PROVIDER_NAME = 'DBOX';
var BASE_URL = 'https://ddizibox.click';
var PLAYER_BASE = 'https://pilavyerplay.top';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

var WORKING_HEADERS = {
    'User-Agent': DEFAULT_UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    'Referer': BASE_URL + '/'
};

// ── TMDB Metadata Çözümleme ──────────────────────────────────────────
async function resolveTmdbInfo(id, mediaType, signal) {
    try {
        var meta = await resolveTmdbMeta(id, mediaType || 'tv', { signal: signal, apiKey: TMDB_API_KEY });
        if (meta) {
            return {
                title: meta.titleTr || meta.title || meta.origTitle || '',
                titleTr: meta.titleTr || meta.title || '',
                origTitle: meta.origTitle || meta.titleEn || '',
                numericId: meta.numericId,
                year: meta.year || '',
                originCountries: meta.originCountries || [],
                origLanguage: meta.origLanguage || ''
            };
        }
        return {
            title: '',
            titleTr: '',
            origTitle: '',
            numericId: id,
            year: '',
            originCountries: [],
            origLanguage: ''
        };
    } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) {
            throw e;
        }
        return {
            title: '',
            titleTr: '',
            origTitle: '',
            numericId: id,
            year: '',
            originCountries: [],
            origLanguage: ''
        };
    }
}

// ── Arama ve Aday Çıkarma ──────────────────────────────────────────
function parseSearchResults(html, mediaType, baseUrl) {
    var $ = cheerio.load(html);
    var candidates = [];
    var seen = Object.create(null);
    var targetPrefix = mediaType === 'movie' ? '/film/' : '/dizi/';

    $('a[href]').each(function () {
        var href = $(this).attr('href') || '';
        if (!href.includes(targetPrefix)) return;
        if (mediaType === 'tv' && (href.includes('/sezon-') || href.includes('/bolum-'))) return;

        var fullUrl = href.startsWith('http') ? href : baseUrl + (href.startsWith('/') ? '' : '/') + href;
        if (seen[fullUrl]) return;
        seen[fullUrl] = true;

        var text = $(this).text().trim().replace(/\s+/g, ' ');
        var h2 = $(this).find('h2, h3, .title, .name').text().trim().replace(/\s+/g, ' ');
        var title = h2 || text;

        // Yılı çıkar
        var year = '';
        var ym = (text + ' ' + href).match(/\b(19\d\d|20\d\d)\b/);
        if (ym) year = ym[1];

        // Slug çıkar
        var slug = '';
        var sm = href.match(new RegExp(targetPrefix.replace(/\//g, '\\/') + '([^/?#]+)'));
        if (sm) slug = sm[1];

        candidates.push({
            title: title,
            slug: slug,
            href: fullUrl,
            year: year
        });
    });

    return candidates;
}

// ── Arama Sorguları ve Başlık Çeşitlendirme ────────────────────────────
function toSlugVariants(str) {
    if (!str) return [];
    var s1 = String(str).replace(/['’]s\b/gi, 's').replace(/['’]/g, '');
    var norm = normalizeText(s1).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    var res = [norm];
    var origNorm = normalizeText(str).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!res.includes(origNorm)) res.push(origNorm);
    return res.filter(Boolean);
}

function buildSearchQueries(info) {
    var rawList = [info.titleTr || info.title, info.origTitle, info.titleEn].filter(Boolean);
    var queries = [];
    var seen = Object.create(null);

    function add(q) {
        if (!q) return;
        var clean = String(q).trim().replace(/\s+/g, ' ');
        if (clean.length < 2) return;
        var key = clean.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        queries.push(clean);
    }

    for (var i = 0; i < rawList.length; i++) {
        var t = rawList[i];
        add(t);
        // Kesme işareti sadeleştirmesi (Marvel's -> Marvels)
        if (/['’]/.test(t)) {
            add(t.replace(/['’]s\b/gi, 's').replace(/['’]/g, ''));
        }
        // Kısaltma noktalarını birleştirme (M.D. -> MD)
        if (/\b[a-zA-Z]\.[a-zA-Z]\b/.test(t)) {
            add(t.replace(/\b([a-zA-Z])\.(?=[a-zA-Z]\b|\.)/g, '$1').replace(/\.([a-zA-Z])\b/g, '$1'));
        }
        // İki nokta veya tire ayrıştırması
        if (/[:\-–—]/.test(t)) {
            add(t.replace(/[:\-–—]+/g, ' '));
        }
    }

    return queries.slice(0, 3);
}

function getMatchTitles(info) {
    var raw = [info.title, info.titleTr, info.origTitle, info.titleEn].filter(Boolean);
    var list = [];
    var seen = Object.create(null);
    function add(t) {
        if (!t) return;
        var s = String(t).trim();
        var k = s.toLowerCase();
        if (seen[k]) return;
        seen[k] = true;
        list.push(s);
    }
    for (var i = 0; i < raw.length; i++) {
        var item = raw[i];
        add(item);
        if (/['’]/.test(item)) {
            add(item.replace(/['’]s\b/gi, 's').replace(/['’]/g, ''));
        }
        if (/[:\-–—]/.test(item)) {
            add(item.replace(/[:\-–—]+/g, ' '));
        }
        if (/\b[a-zA-Z]\.[a-zA-Z]\b/.test(item)) {
            add(item.replace(/\b([a-zA-Z])\.(?=[a-zA-Z]\b|\.)/g, '$1').replace(/\.([a-zA-Z])\b/g, '$1'));
        }
    }
    return list;
}

function findBestCandidate(candidates, matchTitles, year, opts) {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;
    for (var m = 0; m < matchTitles.length; m++) {
        var cand = pickBestCandidate(candidates, matchTitles[m], year, opts);
        if (cand) return cand;
    }
    return null;
}

// ── Pilavyer Player Ayrıştırıcı ──────────────────────────────────────
async function extractPilavyerStream(pageHtml, pageUrl, signal) {
    // 1. data-pv anahtarını bul
    var pvMatch = pageHtml.match(/data-pv="([^"]+)"/);
    if (!pvMatch || !pvMatch[1]) {
        return null;
    }
    var pvSlug = pvMatch[1];

    // 2. Sayfada kullanılan Pilavyer alan adını dinamik olarak tespit et
    var detectedBases = [];
    var scriptMatches = pageHtml.match(/https?:\/\/[a-z0-9.-]*?pilavyer[a-z0-9.-]*(?:\.[a-z]{2,})/gi);
    if (scriptMatches) {
        for (var sm = 0; sm < scriptMatches.length; sm++) {
            var cleanSm = scriptMatches[sm].replace(/\/+$/, '');
            if (!detectedBases.includes(cleanSm)) detectedBases.push(cleanSm);
        }
    }

    var candidateBases = [];
    for (var d = 0; d < detectedBases.length; d++) {
        if (!candidateBases.includes(detectedBases[d])) candidateBases.push(detectedBases[d]);
    }
    var defaults = ['https://play2.pilavyerplay.top', 'https://pilavyerplay.top', PLAYER_BASE].filter(Boolean);
    for (var f = 0; f < defaults.length; f++) {
        if (!candidateBases.includes(defaults[f])) candidateBases.push(defaults[f]);
    }

    // 3. Sırayla aday alan adlarından s.php isteği at
    var playerHtml = null;
    var usedPlayerBase = null;
    for (var b = 0; b < candidateBases.length; b++) {
        var pBase = candidateBases[b];
        var playerUrl = pBase + '/assets/js/s.php?s=' + encodeURIComponent(pvSlug);
        try {
            var playerRes = await fetchWithTimeout(playerUrl, {
                headers: {
                    'User-Agent': DEFAULT_UA,
                    'Referer': BASE_URL + '/',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                signal: signal
            }, 8000);

            if (playerRes.ok) {
                var text = await playerRes.text();
                if (text.includes('window.__PLAYER__')) {
                    playerHtml = text;
                    usedPlayerBase = pBase;
                    break;
                }
            }
        } catch (err) {
            if (err && (err.name === 'AbortError' || err.message === 'TIMEOUT' || (signal && signal.aborted))) {
                throw err;
            }
        }
    }

    if (!playerHtml || !usedPlayerBase) {
        return null;
    }

    // 4. window.__PLAYER__ nesnesini parse et
    var configMatch = playerHtml.match(/window\.__PLAYER__\s*=\s*({[\s\S]*?});/);
    if (!configMatch || !configMatch[1]) {
        return null;
    }

    var config;
    try {
        config = JSON.parse(configMatch[1]);
    } catch (_) {
        return null;
    }

    if (!config || !config.stream) {
        return null;
    }

    // 5. Altyazıları Nuvio standart formatına dönüştür
    var subtitles = [];
    if (Array.isArray(config.subs)) {
        for (var i = 0; i < config.subs.length; i++) {
            var s = config.subs[i];
            if (s && s.src) {
                var lang = s.lang === 'tr' ? 'tur' : s.lang === 'en' ? 'eng' : (s.lang || 'tur');
                var label = s.label || (lang === 'tur' ? 'Türkçe Altyazı' : lang === 'eng' ? 'İngilizce Altyazı' : lang);
                subtitles.push({
                    url: s.src,
                    lang: lang,
                    label: label,
                    default: !!s.default
                });
            }
        }
    }

    // 6. Ses kanalı ve başlık etiketlemesi
    var audioLabel = 'Orijinal';
    if (Array.isArray(config.audios) && config.audios.length > 0) {
        var defAudio = config.audios.find(function (a) { return a && a.default; }) || config.audios[0];
        if (defAudio && defAudio.label) {
            audioLabel = defAudio.label;
        }
    }

    return {
        streamUrl: config.stream,
        playerUrl: usedPlayerBase + '/assets/js/s.php?s=' + encodeURIComponent(pvSlug),
        audioLabel: audioLabel,
        title: config.title || '',
        subtitles: subtitles
    };
}

// ── Ana getStreams Sağlayıcı Fonksiyonu ───────────────────────────────
async function getStreams(id, type, season, episode, options) {
    await cfgReady();
    var signal = options && options.signal;
    type = type === 'series' ? 'tv' : type;

    // 1. TMDb meta verilerini çöz
    var info = await resolveTmdbInfo(id, type, signal);
    if (!info.title && !info.origTitle) {
        throw new ProviderError('TMDB_ERROR');
    }

    var pageHtml = null;
    var targetPageUrl = null;

    // 2. Öncelikli Hızlı Yol: Prediktif Slug Yoklaması (Predictive Slug Probe)
    // DiziBox URL şablonu standarttır:
    // TV: /dizi/{slug}/sezon-{s}/bolum-{e}
    // Film: /film/{slug}
    // İçeriklerin büyük bölümü doğrudan bu adreste önbelleklenmiş olarak <1-2s içinde yanıt verir.
    var predictiveSlugs = [];
    var slugSources = [info.origTitle, info.title, info.titleTr].filter(Boolean);
    for (var s = 0; s < slugSources.length; s++) {
        var variants = toSlugVariants(slugSources[s]);
        for (var v = 0; v < variants.length; v++) {
            if (!predictiveSlugs.includes(variants[v])) predictiveSlugs.push(variants[v]);
        }
    }

    for (var p = 0; p < Math.min(predictiveSlugs.length, 2); p++) {
        var pSlug = predictiveSlugs[p];
        var probeUrl = type === 'tv'
            ? BASE_URL + '/dizi/' + pSlug + '/sezon-' + season + '/bolum-' + episode
            : BASE_URL + '/film/' + pSlug;

        try {
            var probeRes = await fetchWithTimeout(probeUrl, {
                headers: WORKING_HEADERS,
                signal: signal
            }, 3500);

            if (probeRes.ok) {
                var probeHtml = await probeRes.text();
                if (probeHtml.includes('data-pv=')) {
                    pageHtml = probeHtml;
                    targetPageUrl = probeUrl;
                    break;
                }
            }
        } catch (_) {}
    }

    // 3. Eğer prediktif yoklama sonuç vermediyse /ara?q= arama mekanizmasıyla devam et
    if (!pageHtml) {
        var searchQueries = buildSearchQueries(info);
        var matchTitles = getMatchTitles(info);

        var bestCandidate = null;
        var candidates = [];
        var startTime = Date.now();

        for (var i = 0; i < searchQueries.length; i++) {
            if (Date.now() - startTime > 9000) break;
            var q = searchQueries[i];
            if (!q) continue;

            try {
                var searchUrl = BASE_URL + '/ara?q=' + encodeURIComponent(q);
                var searchRes = await fetchWithTimeout(searchUrl, {
                    headers: WORKING_HEADERS,
                    signal: signal
                }, 8000);

                if (searchRes.ok) {
                    var searchHtml = await searchRes.text();
                    var found = parseSearchResults(searchHtml, type, BASE_URL);
                    if (found.length > 0) {
                        candidates = candidates.concat(found);
                        bestCandidate = findBestCandidate(found, matchTitles, info.year, { minCoverage: 0.70, minScore: 50 });
                        if (bestCandidate) break;
                    }
                }
            } catch (e) {
                if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) throw e;
            }
        }

        if (!bestCandidate && candidates.length > 0) {
            bestCandidate = findBestCandidate(candidates, matchTitles, info.year, { minCoverage: 0.60, minScore: 40 });
        }

        if (!bestCandidate) {
            throw new ProviderError('NO_MATCH');
        }

        if (type === 'tv') {
            var baseSlug = bestCandidate.slug || bestCandidate.href.split('/').filter(Boolean).pop();
            targetPageUrl = BASE_URL + '/dizi/' + baseSlug + '/sezon-' + season + '/bolum-' + episode;
        } else {
            targetPageUrl = bestCandidate.href;
        }

        var pageRes = await fetchWithTimeout(targetPageUrl, {
            headers: WORKING_HEADERS,
            signal: signal
        }, 8000);

        // Eğer prediktif TV bölüm URL'si 404 döndüyse dizi ana sayfasından bölüm bağlantısını ara
        if (!pageRes.ok && type === 'tv') {
            try {
                var showRes = await fetchWithTimeout(bestCandidate.href, {
                    headers: WORKING_HEADERS,
                    signal: signal
                }, 8000);
                if (showRes.ok) {
                    var showHtml = await showRes.text();
                    var $show = cheerio.load(showHtml);
                    var epPattern = new RegExp('sezon-' + season + '/bolum-' + episode + '(?:[/?#]|$)', 'i');
                    var foundEpHref = null;
                    $show('a[href]').each(function () {
                        var h = $(this).attr('href') || '';
                        if (epPattern.test(h)) {
                            foundEpHref = h;
                            return false;
                        }
                    });
                    if (foundEpHref) {
                        var actualEpUrl = foundEpHref.startsWith('http') ? foundEpHref : BASE_URL + (foundEpHref.startsWith('/') ? '' : '/') + foundEpHref;
                        pageRes = await fetchWithTimeout(actualEpUrl, {
                            headers: WORKING_HEADERS,
                            signal: signal
                        }, 8000);
                        targetPageUrl = actualEpUrl;
                    }
                }
            } catch (_) {}
        }

        if (!pageRes || !pageRes.ok) {
            throw new ProviderError('NO_MATCH');
        }

        pageHtml = await pageRes.text();
    }

    // 4. Pilavyer akışını ayrıştır
    var extracted = await extractPilavyerStream(pageHtml, targetPageUrl, signal);
    if (!extracted || !extracted.streamUrl) {
        return [];
    }

    // 5. Akış nesnesini oluştur
    var streamTitle = PROVIDER_NAME + ' - ' + extracted.audioLabel + ' (HLS Multi)';
    var stream = {
        name: PROVIDER_NAME,
        title: streamTitle,
        url: extracted.streamUrl,
        quality: '1080p',
        headers: {
            'User-Agent': DEFAULT_UA,
            'Referer': extracted.playerUrl
        },
        subtitles: extracted.subtitles,
        behaviorHints: {
            proxyHeaders: {
                request: {
                    'User-Agent': DEFAULT_UA,
                    'Referer': extracted.playerUrl
                }
            }
        }
    };

    return sortStreamsByQuality([stream]);
}

module.exports = {
    getStreams: getStreams,
    parseSearchResults: parseSearchResults,
    extractPilavyerStream: extractPilavyerStream,
    resolveTmdbInfo: resolveTmdbInfo
};
