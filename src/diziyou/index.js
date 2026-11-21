const { sortStreamsByQuality } = require("../shared/quality.js");
const { loadConfig, val, wrapAll } = require("../shared/config.js");
const { fetchWithTimeout } = require("../shared/http.js");
const { ProviderError } = require("../shared/errors.js");

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

const PROVIDER_NAME = 'DiziYou';
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
    let cleanId = String(id || '').trim();
    if (cleanId.includes(':')) cleanId = cleanId.split(':')[0];

    let numericId = null;
    let title = '';
    let origTitle = '';

    if (cleanId.startsWith('tt')) {
      const findRes = await fetchWithTimeout(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`, { signal: signal }, 8000);
      if (findRes.ok) {
        const fData = await findRes.json();
        const item = fData.tv_results && fData.tv_results[0];
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
      const tRes = await fetchWithTimeout(`https://api.themoviedb.org/3/tv/${numericId}?api_key=${TMDB_API_KEY}&language=tr-TR`, { signal: signal }, 8000);
      if (tRes.ok) {
        const tData = await tRes.json();
        title = tData.name || title;
        origTitle = tData.original_name || origTitle;
      }
    }

    return { title, origTitle, numericId };
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.message === 'TIMEOUT' || e.name === 'ProviderError')) throw e;
    return { title: '', origTitle: '', numericId: id };
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

function findShowHref($, candidates) {
  var wanted = candidates.map(normalizeTitle).filter(Boolean);
  var best = null, bestScore = 0;
  $('#content a[href], a[href]').each(function() {
    var href = $(this).attr('href') || '';
    if (!href || isEpisodeHref(href) || /\/(?:kategori|dizi-arsivi|tag|author)\//i.test(href)) return;
    var absolute;
    try { absolute = new URL(href, BASE_URL).href; } catch (e) { return; }
    if (absolute.indexOf(BASE_URL + '/') !== 0 || /[?#]/.test(absolute)) return;
    var pathSlug = absolute.split('/').filter(Boolean).pop() || '';
    var text = $(this).text().trim() || $(this).find('img').attr('alt') || '';
    var score = 0;
    wanted.forEach(function(title) {
      var slug = normalizeTitle(pathSlug.replace(/\d+$/, '').replace(/-/g, ' '));
      var label = normalizeTitle(text);
      if (slug === title || label === title) score = Math.max(score, 100);
      else if (slug.indexOf(title) === 0 || label.indexOf(title) === 0) score = Math.max(score, 75);
      else if (title.indexOf(slug) === 0 && slug.length >= 5) score = Math.max(score, 60);
    });
    if (score > bestScore) { best = absolute; bestScore = score; }
  });
  return bestScore >= 60 ? best : null;
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
    const trTitle = (info.title || '').trim();
    const orgTitle = (info.origTitle || '').trim();
    const displayTitle = trTitle || orgTitle || 'Dizi';

    const searchCandidates = [trTitle];
    if (orgTitle && orgTitle !== trTitle) searchCandidates.push(orgTitle);

    var episodeUrl = null;
    var showUrl = null;

    for (const q of searchCandidates) {
      if (!q) continue;
      const searchUrl = `${BASE_URL}/?s=` + encodeURIComponent(q);
      const res = await fetchWithTimeout(searchUrl, { headers: WORKING_HEADERS, signal: signal }, 8000);
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      episodeUrl = findEpisodeHref($, seasonNum, episodeNum);
      if (episodeUrl) break;
      showUrl = findShowHref($, [q, trTitle, orgTitle]);
      if (showUrl) break;
    }

    if (!episodeUrl && showUrl) {
      const showRes = await fetchWithTimeout(showUrl, { headers: WORKING_HEADERS, signal: signal }, 8000);
      if (showRes.ok) episodeUrl = findEpisodeHref(cheerio.load(await showRes.text()), seasonNum, episodeNum);
    }
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
          title: '⌜ DiziYou ⌟ | ' + displayTitle + labelPart + ' · ' + seasonNum + '. Sezon ' + episodeNum + '. Bölüm',
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
