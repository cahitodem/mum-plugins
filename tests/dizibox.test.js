// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const dizibox = require('../src/dizibox/index.js');

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
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf8'));
  const scraper = manifest.scrapers.find(s => s.id === 'mum_dizibox');
  assert.ok(scraper, 'mum_dizibox scraper must exist in manifest.json');
  const code = fs.readFileSync(path.join(__dirname, '..', scraper.filename), 'utf8');
  vm.runInContext('(function(){\n' + code + '\n})();', context, { timeout: 2000 });
  return { context, reports, provider: context.module.exports };
}

test('DiziBox: Successful TV episode stream extraction with HLS, subs and proxyHeaders', async () => {
  const requestedUrls = [];
  const fetchMock = async (url, options) => {
    const u = String(url);
    requestedUrls.push(u);

    // 1. TMDB TV Mock
    if (u.includes('api.themoviedb.org/3/tv/1396')) {
      return {
        ok: true,
        json: async () => ({
          name: 'Breaking Bad',
          original_name: 'Breaking Bad',
          first_air_date: '2008-01-20'
        })
      };
    }

    // 2. DiziBox Search
    if (u.includes('/ara?q=')) {
      return {
        ok: true,
        text: async () => `
          <html>
            <body>
              <a href="https://ddizibox.click/film/breaking-the-ice">
                <h2>Breaking the ICE</h2>
                <span>Film HD 2026</span>
              </a>
              <a href="https://ddizibox.click/dizi/breaking-bad">
                <h2>Breaking Bad</h2>
                <span>Dizi HD 9.0 Breaking Bad 2008</span>
              </a>
            </body>
          </html>
        `
      };
    }

    // 3. DiziBox Episode Page
    if (u === 'https://ddizibox.click/dizi/breaking-bad/sezon-1/bolum-1') {
      return {
        ok: true,
        text: async () => `
          <html>
            <body>
              <template data-tbx-defer>
                <div data-pv="test-pv-slug-123" class="absolute inset-0"></div>
                <script src="https://pilavyerplay.top/assets/js/core.js" async></script>
              </template>
            </body>
          </html>
        `
      };
    }

    // 4. Pilavyer s.php Player Config
    if (u.includes('pilavyerplay.top/assets/js/s.php?s=test-pv-slug-123')) {
      // Verify Referer header
      const headers = options && options.headers || {};
      const referer = headers.Referer || headers.referer;
      assert.ok(referer && referer.includes('ddizibox.click'), 'Pilavyer s.php must receive ddizibox.click Referer');

      return {
        ok: true,
        text: async () => `
          <!doctype html>
          <html>
            <head>
              <script>
                window.__PLAYER__ = {
                  "v": "testvideo123",
                  "stream": "https://pilavyerplay.top/api/stream.php?v=testvideo123&token=mocktoken456",
                  "title": "Breaking Bad 1. Sezon 1. Bölüm",
                  "subs": [
                    { "sid": "s1", "lang": "tr", "label": "Türkçe Altyazı", "src": "https://pilavyerplay.top/api/sub.php?v=123&sid=s1", "default": 1 },
                    { "sid": "s2", "lang": "en", "label": "İngilizce Altyazı", "src": "https://pilavyerplay.top/api/sub.php?v=123&sid=s2", "default": 0 }
                  ],
                  "audios": [
                    { "name": "a0", "label": "Türkçe Dublaj", "default": 1 }
                  ]
                };
              </script>
            </head>
          </html>
        `
      };
    }

    if (u.includes('pilavyerplay.top/api/stream.php')) {
      return {
        ok: true,
        text: async () => [
          '#EXTM3U',
          '#EXT-X-VERSION:3',
          '#EXT-X-STREAM-INF:BANDWIDTH=3220800,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"',
          'stream.php?v=testvideo123&p=stream_v720%2Findex.m3u8'
        ].join('\n')
      };
    }

    throw new Error('Unexpected fetch for: ' + u);
  };

  // Test direct module
  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await dizibox.getStreams('1396', 'tv', 1, 1);
    assert.ok(Array.isArray(streams), 'Streams must be an array');
    assert.equal(streams.length, 1, 'Should return exactly 1 stream');

    const s = streams[0];
    assert.equal(s.name, 'DBOX');
    assert.ok(s.title.includes('Türkçe Dublaj'), 'Title should reflect audio label');
    assert.equal(s.url, 'https://pilavyerplay.top/api/stream.php?v=testvideo123&token=mocktoken456');
    assert.equal(s.quality, '720p', 'Quality must be parsed from master playlist RESOLUTION');
    assert.equal(s.type, 'hls');
    assert.equal(s.provider, 'dizibox');
    assert.equal(s.behaviorHints.notWebReady, true);
    assert.ok(s.behaviorHints.proxyHeaders.request.Referer.includes('pilavyerplay.top'), 'Proxy headers must contain player Referer');

    // Subtitles validation (Nuvio PluginSubtitleResult contract: url, language, name, headers)
    assert.equal(s.subtitles.length, 2, 'Should extract 2 subtitles');
    assert.equal(s.subtitles[0].language, 'tur');
    assert.equal(s.subtitles[0].name, 'Türkçe Altyazı');
    assert.ok(s.subtitles[0].headers.Referer.includes('pilavyerplay.top'));
    assert.equal(s.subtitles[1].language, 'eng');
    assert.equal(s.subtitles[1].name, 'İngilizce Altyazı');
  } finally {
    global.fetch = originalFetch;
  }

  // Test compiled VM bundle
  const { provider, reports } = loadBundle(fetchMock);
  const bundleStreams = await provider.getStreams('1396', 'tv', 1, 1);
  assert.equal(bundleStreams.length, 1, 'Compiled bundle should return 1 stream');
  assert.equal(bundleStreams[0].name, 'DBOX');
  assert.equal(bundleStreams[0].type, 'hls');
  assert.equal(bundleStreams[0].quality, '720p');
  assert.equal(bundleStreams[0].subtitles[0].language, 'tur');
  assert.equal(bundleStreams[0].subtitles[0].name, 'Türkçe Altyazı');
  assert.ok(reports.some(r => r.includes('sources-found')), 'Bundle must report sources-found status');
});

test('DiziBox: Rejects unrelated title and throws NO_MATCH', async () => {
  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/tv/99999')) {
      return {
        ok: true,
        json: async () => ({
          name: 'Completely Unique Sci-Fi Show',
          original_name: 'Completely Unique Sci-Fi Show',
          first_air_date: '2024-01-01'
        })
      };
    }

    if (u.includes('/ara?q=')) {
      return {
        ok: true,
        text: async () => `
          <html>
            <body>
              <a href="https://ddizibox.click/dizi/other-random-show">
                <h2>Other Random Show</h2>
                <span>Dizi HD 2012</span>
              </a>
            </body>
          </html>
        `
      };
    }

    throw new Error('Unexpected fetch for: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    await assert.rejects(async () => {
      await dizibox.getStreams('99999', 'tv', 1, 1);
    }, (err) => {
      return err.name === 'ProviderError' && err.code === 'NO_MATCH';
    }, 'Mismatched show must throw NO_MATCH');
  } finally {
    global.fetch = originalFetch;
  }
});

test('DiziBox: Handles 404 Video Bulunamadi from Pilavyer gracefully returning empty streams', async () => {
  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/tv/100')) {
      return {
        ok: true,
        json: async () => ({
          name: 'The 100',
          original_name: 'The 100',
          first_air_date: '2014-03-19'
        })
      };
    }

    if (u.includes('/ara?q=')) {
      return {
        ok: true,
        text: async () => `
          <html>
            <body>
              <a href="https://ddizibox.click/dizi/the-100">
                <h2>The 100</h2>
                <span>Dizi HD 2014</span>
              </a>
            </body>
          </html>
        `
      };
    }

    if (u.includes('/dizi/the-100/sezon-1/bolum-1')) {
      return {
        ok: true,
        text: async () => `
          <template data-tbx-defer>
            <div data-pv="deleted-video-slug"></div>
          </template>
        `
      };
    }

    if (u.includes('pilavyerplay.top/assets/js/s.php?s=deleted-video-slug')) {
      return {
        ok: false,
        status: 404,
        text: async () => `<!doctype html><html><title>Video bulunamadı</title></html>`
      };
    }

    throw new Error('Unexpected fetch for: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await dizibox.getStreams('100', 'tv', 1, 1);
    assert.deepEqual(streams, [], 'Should return empty array when video is 404');
  } finally {
    global.fetch = originalFetch;
  }
});

test('DiziBox: Successful Movie stream extraction', async () => {
  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/movie/872585')) {
      return {
        ok: true,
        json: async () => ({
          title: 'Oppenheimer',
          original_title: 'Oppenheimer',
          release_date: '2023-07-19'
        })
      };
    }

    if (u.includes('/ara?q=')) {
      return {
        ok: true,
        text: async () => `
          <html>
            <body>
              <a href="https://ddizibox.click/film/oppenheimer">
                <h2>Oppenheimer</h2>
                <span>Film HD 8.0 Oppenheimer 2023</span>
              </a>
            </body>
          </html>
        `
      };
    }

    if (u === 'https://ddizibox.click/film/oppenheimer') {
      return {
        ok: true,
        text: async () => `
          <template data-tbx-defer>
            <div data-pv="oppenheimer-pv-slug"></div>
          </template>
        `
      };
    }

    if (u.includes('pilavyerplay.top/assets/js/s.php?s=oppenheimer-pv-slug')) {
      return {
        ok: true,
        text: async () => `
          <script>
            window.__PLAYER__ = {
              "stream": "https://pilavyerplay.top/api/stream.php?v=oppen&token=xyz",
              "title": "Oppenheimer",
              "subs": [
                { "lang": "tr", "label": "Türkçe Altyazı", "src": "https://pilavyerplay.top/api/sub.php?v=oppen&sid=1" }
              ],
              "audios": [
                { "label": "Orijinal", "default": 1 }
              ]
            };
          </script>
        `
      };
    }

    throw new Error('Unexpected fetch for: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await dizibox.getStreams('872585', 'movie');
    assert.equal(streams.length, 1);
    assert.equal(streams[0].name, 'DBOX');
    assert.equal(streams[0].quality, '1080p');
    assert.equal(streams[0].subtitles.length, 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test('DiziBox: Dynamic Pilavyer domain extraction handles play2.pilavyerplay.top and fallbacks', async () => {
  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/tv/94997')) {
      return {
        ok: true,
        json: async () => ({
          name: 'House of the Dragon',
          original_name: 'House of the Dragon',
          first_air_date: '2022-08-21'
        })
      };
    }

    if (u === 'https://ddizibox.click/dizi/house-of-the-dragon/sezon-1/bolum-1') {
      return {
        ok: true,
        text: async () => `
          <html>
            <body>
              <template data-tbx-defer>
                <div data-pv="hotd-slug-xyz"></div>
                <script src="https://play2.pilavyerplay.top/assets/js/core.js"></script>
              </template>
            </body>
          </html>
        `
      };
    }

    if (u.includes('play2.pilavyerplay.top/assets/js/s.php?s=hotd-slug-xyz')) {
      return {
        ok: true,
        text: async () => `
          <script>
            window.__PLAYER__ = {
              "stream": "https://play2.pilavyerplay.top/api/stream.php?v=hotd123",
              "title": "House of the Dragon 1. Sezon 1. Bölüm",
              "subs": [
                { "lang": "tr", "label": "Türkçe", "src": "https://play2.pilavyerplay.top/sub.vtt" }
              ],
              "audios": [
                { "label": "Orijinal", "default": 1 }
              ]
            };
          </script>
        `
      };
    }

    throw new Error('Unexpected fetch for: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await dizibox.getStreams('94997', 'tv', 1, 1);
    assert.equal(streams.length, 1);
    assert.equal(streams[0].name, 'DBOX');
    assert.ok(streams[0].url.includes('play2.pilavyerplay.top'));
    assert.equal(streams[0].headers.Referer, 'https://play2.pilavyerplay.top/assets/js/s.php?s=hotd-slug-xyz');
  } finally {
    global.fetch = originalFetch;
  }
});

test("DiziBox: Matches titles with apostrophes (Marvel's The Punisher) and acronyms (House, M.D.)", async () => {
  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/tv/67178')) {
      return {
        ok: true,
        json: async () => ({
          name: "Marvel's The Punisher",
          original_name: "Marvel's The Punisher",
          first_air_date: '2017-11-17'
        })
      };
    }

    if (u === 'https://ddizibox.click/dizi/marvels-the-punisher/sezon-1/bolum-1') {
      return {
        ok: true,
        text: async () => `
          <template data-tbx-defer>
            <div data-pv="punisher-pv"></div>
            <script src="https://pilavyerplay.top/assets/js/core.js"></script>
          </template>
        `
      };
    }

    if (u.includes('pilavyerplay.top/assets/js/s.php?s=punisher-pv')) {
      return {
        ok: true,
        text: async () => `
          <script>
            window.__PLAYER__ = {
              "stream": "https://pilavyerplay.top/api/stream.php?v=punisher",
              "subs": []
            };
          </script>
        `
      };
    }

    if (u.includes('pilavyerplay.top/api/stream.php')) {
      return {
        ok: true,
        text: async () => '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=3840x2160\nstream_v2160/index.m3u8'
      };
    }

    throw new Error('Unexpected fetch for: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await dizibox.getStreams('67178', 'tv', 1, 1);
    assert.equal(streams.length, 1);
    assert.equal(streams[0].url, 'https://pilavyerplay.top/api/stream.php?v=punisher');
    assert.equal(streams[0].quality, '2160p');
  } finally {
    global.fetch = originalFetch;
  }
});

test('DiziBox: HTTP 403 block throws HTTP_BLOCKED and compiled bundle reports http-blocked', async () => {
  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/tv/67179')) {
      return {
        ok: true,
        json: async () => ({
          name: 'Blocked DiziBox Show',
          original_name: 'Blocked DiziBox Show',
          first_air_date: '2024-01-01'
        })
      };
    }
    return { ok: false, status: 403, text: async () => 'Forbidden' };
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    await assert.rejects(async () => {
      await dizibox.getStreams('67179', 'tv', 1, 1);
    }, err => err.name === 'ProviderError' && err.code === 'HTTP_BLOCKED');
  } finally {
    global.fetch = originalFetch;
  }

  const { provider, reports } = loadBundle(fetchMock);
  const out = await provider.getStreams('67179', 'tv', 1, 1);
  assert.equal(out.length, 0);
  assert.ok(reports.some(r => r.includes('http-blocked')), 'Bundle must report http-blocked');
});
