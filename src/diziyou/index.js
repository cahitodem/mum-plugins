const { sortStreamsByQuality } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
const { fetchWithTimeout, resolveTmdbMeta } = require("../shared/http.js");
const { ProviderError } = require("../shared/errors.js");
const { pickBestCandidate, calculateMatchScore } = require("../shared/matching.js");

var _cfgReady = null;
function cfgReady() {
    if (!_cfgReady) {
        _cfgReady = loadConfig().then(function () {
            var v;
            v = val('urls.series.diziyou.base'); if (v) BASE_URL = String(v).replace(/\/+$/, '');
            v = val('urls.series.diziyou.storage'); if (v) STORAGE_URL = String(v).replace(/\/+$/, '');
            if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + '/';
        });
    }
    return _cfgReady;
}

/**
 * Anthology - DiziYou Provider
 * diziyou.love arşivi ve storage.diziyou.love üzerinden
 * doğrudan play.m3u8 HLS akışları ve Türkçe VTT altyazıları sunar.
 */

var cheerio = require('cheerio-without-node-native');

const PROVIDER_NAME = 'DYOU';
var BASE_URL = 'https://www.diziyou.love'; 
var STORAGE_URL = 'https://storage.diziyou.love';
const TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

const WORKING_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': BASE_URL + '/',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
};

async function resolveTmdbInfo(id, mediaType, signal) {
  try {
    const meta = await resolveTmdbMeta(id, mediaType || 'tv', { signal: signal, apiKey: TMDB_API_KEY });
    return meta || { title: '', origTitle: '', numericId: id, year: '', originCountries: [], origLanguage: '' };
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError' || (signal && signal.aborted))) throw e;
    return { title: '', origTitle: '', numericId: id, year: '', originCountries: [], origLanguage: '' };
  }
}

function normalizeTitle(value) {
  return String(value || '').toLowerCase()
    .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

function isEpisodeHref(href) {
  return /-\d+-sezon-\d+-bolum(?:\/|$)/i.test(String(href || ''));
}

function findEpisodeHref($, seasonNum, episodeNum) {
  var exact = new RegExp('-' + seasonNum + '-sezon-' + episodeNum + '-bolum(?:[/?#]|$)', 'i');
  var result = null;
  $('a[href]').each(function() {
    var href = $(this).attr('href') || '';
    if (exact.test(href)) { result = href; return false; }
  });
  return result;
}

/**
 * Arama sonuçları sayfasındaki tüm potansiyel dizi kartlarını ve linklerini toplar.
 * Bölüm bağlantılarını (isEpisodeHref) kesinlikle filtreler.
 */
function parseShowCandidates($, baseUrl) {
  var candidates = [];
  var seen = Object.create(null);

  $('#content a[href], a[href]').each(function() {
    var href = $(this).attr('href') || '';
    if (!href || isEpisodeHref(href) || /\/(?:kategori|dizi-arsivi|tag|author|uye-ol|hakkimizda|iletisim|dmca|gizlilik|wp-login|son-eklenenler)\b/i.test(href)) return;

    var absolute;
    try { absolute = new URL(href, baseUrl).href; } catch (e) { return; }
    if (absolute.indexOf(baseUrl + '/') !== 0 || /[?#]/.test(absolute)) return;

    var pathSlug = absolute.split('/').filter(Boolean).pop() || '';
    if (!pathSlug || pathSlug === 'www.diziyou.love' || pathSlug === 'diziyou.love') return;

    var text = $(this).attr('title') || $(this).find('#dizi-ismi, .dizi-ismi').text().trim() || $(this).text().trim() || $(this).find('img').attr('alt') || '';
    // Yalnızca anlamlı metin veya slug içeren linkleri aday al
    if (!text && !pathSlug) return;

    var candYear = '';
    var yearMatch = (text + ' ' + pathSlug).match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) candYear = yearMatch[1];

    if (!seen[absolute]) {
      seen[absolute] = true;
      candidates.push({
        title: text || pathSlug.replace(/\d+$/, '').replace(/-/g, ' '),
        slug: pathSlug,
        href: absolute,
        year: candYear
      });
    }
  });

  return candidates;
}

function parsePlayerPage(playerHtml, playerUrl) {
  var $ = cheerio.load(playerHtml);
  var source = $('#diziyouSource').attr('src') || $('video source[src]').first().attr('src');
  if (!source) return null;
  try { source = new URL(source, playerUrl).href; } catch (e) { return null; }
  if (!/^https?:\/\//i.test(source)) return null;

  var subtitles = [];
  var scriptText = $('script').map(function() { return $(this).html() || ''; }).get().join('\n');
  var trMatch = scriptText.match(/trUrl\s*:\s*['"]([^'"]+)['"]/i);
  var enMatch = scriptText.match(/enUrl\s*:\s*['"]([^'"]+)['"]/i);
  [[trMatch, 'Türkçe'], [enMatch, 'English']].forEach(function(entry) {
    if (!entry[0]) return;
    try { subtitles.push({ url: new URL(entry[0][1], playerUrl).href, language: entry[1], label: entry[1] }); } catch (e) {}
  });
  return { url: source, subtitles: subtitles };
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
    if (!Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 || !Number.isInteger(Number(episodeNum)) || Number(episodeNum) < 1) return [];
    seasonNum = Number(seasonNum);
    episodeNum = Number(episodeNum);
    const info = await resolveTmdbInfo(tmdbId, mediaType, signal);

    // Yerli TR yapım izolasyonu:
    // DiziYou platformu yalnızca yabancı dizileri içerir.
    const isPureTurkish = (
      info.origLanguage === 'tr' &&
      Array.isArray(info.originCountries) &&
      info.originCountries.length === 1 &&
      info.originCountries[0] === 'TR'
    );
    if (isPureTurkish) {
      return [];
    }

    const trTitle = (info.title || '').trim();
    const orgTitle = (info.origTitle || '').trim();
    const targetYear = info.year || '';
    const displayTitle = trTitle || orgTitle || 'Dizi';

    const searchCandidates = [trTitle];
    if (orgTitle && orgTitle !== trTitle) searchCandidates.push(orgTitle);

    var bestCandidate = null;

    // Arama sayfasından dizi adaylarını topla ve pickBestCandidate ile doğrula
    for (const q of searchCandidates) {
      if (!q) continue;
      const searchUrl = `${BASE_URL}/?s=` + encodeURIComponent(q);
      const res = await fetchWithTimeout(searchUrl, { headers: WORKING_HEADERS, signal: signal }, 8000);
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      const candidates = parseShowCandidates($, BASE_URL);
      if (!candidates || candidates.length === 0) continue;

      bestCandidate = pickBestCandidate(candidates, trTitle, targetYear, { minCoverage: 0.75, minScore: 50 });
      if (!bestCandidate && orgTitle) {
        bestCandidate = pickBestCandidate(candidates, orgTitle, targetYear, { minCoverage: 0.75, minScore: 50 });
      }
      if (bestCandidate) break;
    }

    // Eşleşen dizi bulunamadıysa (ör. sitede dizi yoksa) güvenli şekilde sonlandır
    if (!bestCandidate || !bestCandidate.href) return [];

    var showUrl = bestCandidate.href;
    const showRes = await fetchWithTimeout(showUrl, { headers: WORKING_HEADERS, signal: signal }, 8000);
    if (!showRes.ok) return [];
    const showHtml = await showRes.text();
    const $show = cheerio.load(showHtml);

    // Çift Emniyet Kilidi: Dizi detay sayfasından Yapım Yılı kontrolü
    if (targetYear) {
      var metaText = $show('.dizimeta, .dizibilgi').text() || '';
      var yMatch = metaText.match(/Yapım Yılı:\s*(\d{4})/i) || metaText.match(/\b(19\d\d|20\d\d)\b/);
      if (yMatch) {
        var pageYear = parseInt(yMatch[1], 10);
        var tYear = parseInt(targetYear, 10);
        if (!isNaN(pageYear) && !isNaN(tYear) && Math.abs(pageYear - tYear) > 1) {
          // Yıl uyuşmazlığı tespit edildi (örn. 2000 vs 2026), yanlış dizi!
          return [];
        }
      }
    }

    // Hedef bölümü yalnızca doğrulanmış dizi sayfası içerisinden ara
    var episodeUrl = findEpisodeHref($show, seasonNum, episodeNum);
    if (!episodeUrl) return [];

    try { episodeUrl = new URL(episodeUrl, BASE_URL).href; } catch (e) { return []; }
    if (episodeUrl.indexOf(BASE_URL + '/') !== 0) return [];

    const epRes = await fetchWithTimeout(episodeUrl, { headers: WORKING_HEADERS, signal: signal }, 8000);
    if (!epRes.ok) return [];
    const epHtml = await epRes.text();
    const $episode = cheerio.load(epHtml);
    var playerUrl = $episode('#diziyouPlayer').attr('src');
    if (!playerUrl) return [];
    try { playerUrl = new URL(playerUrl, episodeUrl).href; } catch (e) { return []; }
    if (playerUrl.indexOf(BASE_URL + '/player/') !== 0) return [];

    // Dublaj varlık denetimi: #turkceDublaj butonu veya sayfa içi bilgi etiketleri
    var hasDublaj = $episode('#turkceDublaj').length > 0 ||
                    /türkçe dublaj|turkce dublaj/i.test($episode('.diziyouOption, .infoelem, .bolumcontent').text());

    var playerTasks = [
      {
        langType: 'sub',
        url: playerUrl,
        label: hasDublaj ? '🌐 TR Altyazılı' : ''
      }
    ];

    if (hasDublaj) {
      var dubPlayerUrl = playerUrl.replace(/\.html(?=[?#]|$)/i, '_tr.html');
      if (dubPlayerUrl !== playerUrl) {
        playerTasks.unshift({
          langType: 'dub',
          url: dubPlayerUrl,
          label: '🇹🇷 Türkçe Dublaj'
        });
      }
    }

    var streams = [];
    for (const task of playerTasks) {
      try {
        const playerRes = await fetchWithTimeout(task.url, { headers: Object.assign({}, WORKING_HEADERS, { Referer: episodeUrl }), signal: signal }, 8000);
        if (!playerRes.ok) continue;
        const parsed = parsePlayerPage(await playerRes.text(), task.url);
        if (!parsed) continue;
        const dyHeaders = { Referer: task.url };
        const labelPart = task.label ? ' · ' + task.label : '';
        streams.push({
          name: displayTitle,
          title: '⌜ DYOU ⌟ | ' + displayTitle + labelPart + ' · ' + seasonNum + '. Sezon ' + episodeNum + '. Bölüm',
          url: parsed.url,
          quality: 'HLS',
          type: 'hls',
          provider: 'diziyou',
          headers: dyHeaders,
          behaviorHints: { notWebReady: true, proxyHeaders: { request: dyHeaders } },
          subtitles: parsed.subtitles
        });
      } catch (errTask) {
        if (errTask && (errTask.name === 'AbortError' || errTask.message === 'TIMEOUT' || errTask.name === 'ProviderError')) throw errTask;
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
