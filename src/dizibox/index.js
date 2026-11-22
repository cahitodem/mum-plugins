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

// ── Pilavyer Player Ayrıştırıcı ──────────────────────────────────────
async function extractPilavyerStream(pageHtml, pageUrl, signal) {
    // 1. data-pv anahtarını bul
    var pvMatch = pageHtml.match(/data-pv="([^"]+)"/);
    if (!pvMatch || !pvMatch[1]) {
        return null;
    }
    var pvSlug = pvMatch[1];

    // 2. Pilavyer s.php isteği at
    var playerUrl = PLAYER_BASE + '/assets/js/s.php?s=' + encodeURIComponent(pvSlug);
    var playerRes = await fetchWithTimeout(playerUrl, {
        headers: {
            'User-Agent': DEFAULT_UA,
            'Referer': BASE_URL + '/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: signal
    }, 5000);

    if (!playerRes.ok) {
        return null;
    }

    var playerHtml = await playerRes.text();

    // 3. window.__PLAYER__ nesnesini parse et
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

    // 4. Altyazıları Nuvio standart formatına dönüştür
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

    // 5. Ses kanalı ve başlık etiketlemesi
    var audioLabel = 'Orijinal';
    if (Array.isArray(config.audios) && config.audios.length > 0) {
        var defAudio = config.audios.find(function (a) { return a && a.default; }) || config.audios[0];
        if (defAudio && defAudio.label) {
            audioLabel = defAudio.label;
        }
    }

    return {
        streamUrl: config.stream,
        playerUrl: playerUrl,
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

    // 2. Arama sorgu alternatiflerini oluştur
    var searchQueries = [];
    if (info.title) searchQueries.push(info.title);
    if (info.origTitle && normalizeText(info.origTitle) !== normalizeText(info.title)) {
        searchQueries.push(info.origTitle);
    }
    // Başlıkta ":" veya "-" varsa temizle
    if (info.title && /[:\-–—]/.test(info.title)) {
        var clean = info.title.replace(/[:\-–—]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (clean && !searchQueries.includes(clean)) searchQueries.push(clean);
    }

    var bestCandidate = null;
    var candidates = [];

    // 3. Arama uç noktasını çağır
    for (var i = 0; i < searchQueries.length; i++) {
        var q = searchQueries[i];
        if (!q) continue;

        try {
            var searchUrl = BASE_URL + '/ara?q=' + encodeURIComponent(q);
            var searchRes = await fetchWithTimeout(searchUrl, {
                headers: WORKING_HEADERS,
                signal: signal
            }, 5000);

            if (searchRes.ok) {
                var searchHtml = await searchRes.text();
                var found = parseSearchResults(searchHtml, type, BASE_URL);
                if (found.length > 0) {
                    candidates = candidates.concat(found);
                    bestCandidate = pickBestCandidate(found, info.title, info.year, { minCoverage: 0.75, minScore: 50 });
                    if (!bestCandidate && info.origTitle) {
                        bestCandidate = pickBestCandidate(found, info.origTitle, info.year, { minCoverage: 0.75, minScore: 50 });
                    }
                    if (bestCandidate) break;
                }
            }
        } catch (e) {
            if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || (signal && signal.aborted))) throw e;
        }
    }

    if (!bestCandidate && candidates.length > 0) {
        bestCandidate = pickBestCandidate(candidates, info.title, info.year, { minCoverage: 0.65, minScore: 40 }) ||
                        (info.origTitle ? pickBestCandidate(candidates, info.origTitle, info.year, { minCoverage: 0.65, minScore: 40 }) : null);
    }

    if (!bestCandidate) {
        throw new ProviderError('NO_MATCH');
    }

    // 4. Hedef sayfa URL'sini belirle
    var targetPageUrl;
    if (type === 'tv') {
        var baseSlug = bestCandidate.slug || bestCandidate.href.split('/').filter(Boolean).pop();
        targetPageUrl = BASE_URL + '/dizi/' + baseSlug + '/sezon-' + season + '/bolum-' + episode;
    } else {
        targetPageUrl = bestCandidate.href;
    }

    // 5. Hedef sayfayı çek
    var pageRes = await fetchWithTimeout(targetPageUrl, {
        headers: WORKING_HEADERS,
        signal: signal
    }, 5000);

    // Eğer prediktif TV bölüm URL'si 404 döndüyse dizi ana sayfasından bölüm bağlantısını ara
    if (!pageRes.ok && type === 'tv') {
        try {
            var showRes = await fetchWithTimeout(bestCandidate.href, {
                headers: WORKING_HEADERS,
                signal: signal
            }, 5000);
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
                    }, 5000);
                    targetPageUrl = actualEpUrl;
                }
            }
        } catch (_) {}
    }

    if (!pageRes || !pageRes.ok) {
        throw new ProviderError('NO_MATCH');
    }

    var pageHtml = await pageRes.text();

    // 6. Pilavyer akışını ayrıştır
    var extracted = await extractPilavyerStream(pageHtml, targetPageUrl, signal);
    if (!extracted || !extracted.streamUrl) {
        return [];
    }

    // 7. Akış nesnesini oluştur
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
