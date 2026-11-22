// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const diziyou = require('../src/diziyou/index.js');
const manifest = require('../manifest.json');

function loadBundle(fetchMock) {
  const reports = [];
  const context = vm.createContext({
    module: { exports: {} },
    console: { info: r => reports.push(r), log: () => {}, warn: () => {}, error: () => {} },
    fetch: fetchMock || (() => { throw Error('Unexpected network call'); }),
    setTimeout,
    clearTimeout,
    URL,
    URLSearchParams,
    AbortController,
    AbortSignal,
    atob,
    btoa,
    TextEncoder,
    TextDecoder,
    require: name => {
      if (['cheerio', 'cheerio-without-node-native', 'react-native-cheerio'].includes(name)) return require('cheerio-without-node-native');
      throw Error('Unavailable runtime module: ' + name);
    }
  });
  const scraper = manifest.scrapers.find(s => s.id === 'mum_diziyou');
  const code = fs.readFileSync(scraper.filename, 'utf8');
  vm.runInContext('(function(){\n' + code + '\n})();', context, { timeout: 2000 });
  return { context, reports, provider: context.module.exports };
}

test('DiziYou: Malcolm in the Middle (2000) rejects Life\'s Still Unfair (2026) and returns empty streams', async () => {
  const requestedUrls = [];
  const fetchMock = async (url) => {
    const u = String(url);
    requestedUrls.push(u);

    // TMDB Mock
    if (u.includes('api.themoviedb.org/3/tv/2004')) {
      return {
        ok: true,
        json: async () => ({
          name: 'Malcolm in the Middle',
          original_name: 'Malcolm in the Middle',
          first_air_date: '2000-01-09'
        })
      };
    }

    // Diziyou Search Mock: Sitede sadece Life's Still Unfair var (altında da bölüm linki var)
    if (u.includes('?s=')) {
      return {
        ok: true,
        text: async () => `
          <main id="content">
            <div id="categorytitle">
              <a href="https://www.diziyou.love/malcolm-in-the-middle-lifes-still-unfair/">Malcolm in the Middle: Life's Still Unfair</a>
            </div>
            <div class="listepisodes">
              <!-- Eski kod buradaki bolum linkini koru korune yakaliyordu! -->
              <a href="https://www.diziyou.love/malcolm-in-the-middle-lifes-still-unfair-1-sezon-1-bolum/">1. Sezon 1. Bölüm</a>
            </div>
          </main>
        `
      };
    }

    // Dizi sayfası veya bölüm sayfası çağrılmamalıdır!
    throw new Error('Unexpected fetch for: ' + u);
  };

  // 1. Doğrudan src/diziyou üzerinden test
  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await diziyou.getStreams('2004', 'tv', 1, 1);
    assert.deepEqual(streams, [], 'Orijinal dizi yerine yan dizi veya bolum asla acilmamalidir');
    // Bolum veya player sayfasi asla fetch edilmemelidir
    assert.ok(!requestedUrls.some(u => u.includes('1-sezon-1-bolum')), 'Arama sayfasindaki yan bolum linki fetch edilmemelidir');
    assert.ok(!requestedUrls.some(u => u.includes('/player/')), 'Player sayfasi cagrilmamalidir');
  } finally {
    global.fetch = originalFetch;
  }
});

test('DiziYou: Correct match finds show page and extracts streams successfully', async () => {
  const requestedUrls = [];
  const fetchMock = async (url) => {
    const u = String(url);
    requestedUrls.push(u);

    // TMDB
    if (u.includes('api.themoviedb.org/3/tv/555')) {
      return {
        ok: true,
        json: async () => ({
          name: 'Severance',
          original_name: 'Severance',
          first_air_date: '2022-02-18'
        })
      };
    }

    // Search Page
    if (u.includes('?s=')) {
      return {
        ok: true,
        text: async () => `
          <main id="content">
            <div class="cat-img">
              <a href="https://www.diziyou.love/severance/" title="Severance">
                <img alt="Severance" src="severance.webp">
                <span id="dizi-ismi">Severance</span>
              </a>
            </div>
          </main>
        `
      };
    }

    // Show Detail Page
    if (u === 'https://www.diziyou.love/severance/') {
      return {
        ok: true,
        text: async () => `
          <main id="content">
            <div class="dizimeta">Yapım Yılı: 2022</div>
            <a href="https://www.diziyou.love/severance-1-sezon-1-bolum/">1. Sezon 1. Bölüm</a>
            <a href="https://www.diziyou.love/severance-1-sezon-2-bolum/">1. Sezon 2. Bölüm</a>
          </main>
        `
      };
    }

    // Episode Page
    if (u === 'https://www.diziyou.love/severance-1-sezon-1-bolum/') {
      return {
        ok: true,
        text: async () => `
          <div class="singlecontent">
            <span id="turkceDublaj" class="diziyouOption">Türkçe Dublaj</span>
            <iframe id="diziyouPlayer" src="https://www.diziyou.love/player/888.html"></iframe>
          </div>
        `
      };
    }

    // Sub Player Page
    if (u === 'https://www.diziyou.love/player/888.html') {
      return {
        ok: true,
        text: async () => `
          <video><source id="diziyouSource" src="https://storage.diziyou.love/episodes/888/play.m3u8"></video>
          <script>
            DYSubtitles.init(player, {
              trUrl: "https://storage.diziyou.love/subtitles/888/tr.vtt",
              enUrl: "https://storage.diziyou.love/subtitles/888/en.vtt"
            });
          </script>
        `
      };
    }

    // Dub Player Page
    if (u === 'https://www.diziyou.love/player/888_tr.html') {
      return {
        ok: true,
        text: async () => `
          <video><source id="diziyouSource" src="https://storage.diziyou.love/episodes/888_tr/play.m3u8"></video>
        `
      };
    }

    throw new Error('Unexpected fetch for: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await diziyou.getStreams('555', 'tv', 1, 1);
    assert.equal(streams.length, 2, 'Hem dublaj hem altyazili akis donmelidir');
    assert.equal(streams[0].url, 'https://storage.diziyou.love/episodes/888_tr/play.m3u8');
    assert.match(streams[0].title, /Türkçe Dublaj/);
    assert.equal(streams[1].url, 'https://storage.diziyou.love/episodes/888/play.m3u8');
    assert.match(streams[1].title, /TR Altyazılı/);
  } finally {
    global.fetch = originalFetch;
  }
});
