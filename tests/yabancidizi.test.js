// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const yabancidizi = require('../src/yabancidizi/index.js');
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
  const scraper = manifest.scrapers.find(s => s.id === 'mum_yabancidizi');
  const code = fs.readFileSync(scraper.filename, 'utf8');
  vm.runInContext('(function(){\n' + code + '\n})();', context, { timeout: 2000 });
  return { context, reports, provider: context.module.exports };
}

test('YabancıDizi: Highest quality filtering keeps only top resolution streams', async () => {
  const masterContent1 = [
    '#EXTM3U',
    '#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480',
    'https://vidmoly.biz/live/480p_sub/index.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720',
    'https://vidmoly.biz/live/720p_sub/index.m3u8'
  ].join('\n');

  const masterContent2 = [
    '#EXTM3U',
    '#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480',
    'https://vidmoly.biz/live/480p_dub/index.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720',
    'https://vidmoly.biz/live/720p_dub/index.m3u8'
  ].join('\n');

  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/tv/100')) {
      return {
        ok: true,
        json: async () => ({ name: 'Test Series', original_name: 'Test Series', first_air_date: '2022-01-01' })
      };
    }
    if (u.includes('/search?qr=')) {
      return {
        ok: true,
        json: async () => ({
          success: 1,
          data: {
            result: [
              { s_id: '1', s_type: '0', s_name: 'Test Series', s_link: 'test-series', s_year: '2022' }
            ]
          }
        })
      };
    }
    if (u.includes('/dizi/test-series/sezon-1/bolum-1')) {
      return {
        ok: true,
        text: async () => [
          '<a href="https://vidmoly.biz/dl/vid1">Türkçe Altyazılı İndir</a>',
          '<a href="https://vidmoly.biz/dl/vid2">Türkçe Dublaj İndir</a>'
        ].join('\n')
      };
    }
    if (u.includes('embed-vid1.html')) {
      return {
        ok: true,
        text: async () => 'var player = {file: "https://vidmoly.biz/master1.m3u8"};'
      };
    }
    if (u.includes('embed-vid2.html')) {
      return {
        ok: true,
        text: async () => 'var player = {file: "https://vidmoly.biz/master2.m3u8"};'
      };
    }
    if (u.includes('master1.m3u8')) {
      return {
        ok: true,
        text: async () => masterContent1
      };
    }
    if (u.includes('master2.m3u8')) {
      return {
        ok: true,
        text: async () => masterContent2
      };
    }
    throw Error('Unexpected url: ' + u);
  };

  const { provider } = loadBundle(fetchMock);
  const streams = await provider.getStreams('100', 'tv', 1, 1);

  assert.ok(streams.length > 0, 'Should find streams');
  // All returned streams must be 720p (the highest quality available), 480p must be filtered out
  for (const s of streams) {
    assert.equal(s.quality, '720p', 'Stream quality must be 720p, not lower');
  }
  assert.equal(streams.length, 2, 'Should keep both Altyazılı and Dublaj at 720p');
});

test('YabancıDizi: Movie request routes to /film/ and isolates against TV series', async () => {
  const requests = [];
  const fetchMock = async (url) => {
    const u = String(url);
    requests.push(u);
    if (u.includes('api.themoviedb.org/3/movie/200')) {
      return {
        ok: true,
        json: async () => ({ title: 'Sample Movie', original_title: 'Sample Movie', release_date: '2023-05-10' })
      };
    }
    if (u.includes('/search?qr=')) {
      return {
        ok: true,
        json: async () => ({
          success: 1,
          data: {
            result: [
              // s_type: '0' is a TV series with similar name
              { s_id: '50', s_type: '0', s_name: 'Sample Movie: The Series', s_link: 'sample-movie-series', s_year: '2023' },
              // s_type: '1' is the actual movie
              { s_id: '51', s_type: '1', s_name: 'Sample Movie', s_link: 'sample-movie', s_year: '2023' }
            ]
          }
        })
      };
    }
    if (u.includes('/film/sample-movie')) {
      return {
        ok: true,
        text: async () => '<a href="https://vidmoly.biz/dl/movievid">Türkçe Dublaj İndir</a>'
      };
    }
    if (u.includes('embed-movievid.html')) {
      return {
        ok: true,
        text: async () => 'var player = {file: "https://vidmoly.biz/moviemaster.m3u8"};'
      };
    }
    if (u.includes('moviemaster.m3u8')) {
      return {
        ok: true,
        text: async () => '#EXTM3U\n#EXT-X-STREAM-INF:RESOLUTION=1920x1080\nhttps://vidmoly.biz/1080p.m3u8\n'
      };
    }
    throw Error('Unexpected url: ' + u);
  };

  const { provider } = loadBundle(fetchMock);
  const streams = await provider.getStreams('200', 'movie');

  assert.ok(streams.length > 0, 'Movie stream should be resolved');
  assert.equal(streams[0].quality, '1080p');
  // Must verify that /film/sample-movie was called and NOT /dizi/sample-movie-series or /dizi/.../sezon-1/bolum-1
  assert.ok(requests.some(r => r.includes('/film/sample-movie')), 'Must query /film/ URL for movies');
  assert.ok(!requests.some(r => r.includes('/dizi/sample-movie-series')), 'Must not query TV series URL for movie');
});

test('YabancıDizi: Searching movie The Odyssey (2026) rejects Cosmos (2014) and returns empty', async () => {
  const requests = [];
  const fetchMock = async (url) => {
    const u = String(url);
    requests.push(u);
    if (u.includes('api.themoviedb.org/3/movie/1368337')) {
      return {
        ok: true,
        json: async () => ({ title: 'Odyssey', original_title: 'The Odyssey', release_date: '2026-07-15' })
      };
    }
    if (u.includes('/search?qr=')) {
      // Returns Cosmos (TV 2014) and The Odyssey (Film 2026, which has no streams)
      return {
        ok: true,
        json: async () => ({
          success: 1,
          data: {
            result: [
              { s_id: '207', s_type: '0', s_name: 'Cosmos: A Spacetime Odyssey', s_link: 'cosmos-a-spacetime-odyssey-izle-1', s_year: '2014' },
              { s_id: '12191', s_type: '1', s_name: 'The Odyssey', s_link: 'the-odyssey', s_year: '2026' }
            ]
          }
        })
      };
    }
    if (u.includes('/film/the-odyssey')) {
      // Unreleased movie has empty player
      return {
        ok: true,
        text: async () => '<div class="player">Yakında Eklenecektir</div>'
      };
    }
    throw Error('Unexpected url: ' + u);
  };

  const { provider } = loadBundle(fetchMock);
  const streams = await provider.getStreams('1368337', 'movie');

  assert.equal(streams.length, 0, 'Must return 0 streams instead of falsely playing Cosmos');
  assert.ok(!requests.some(r => r.includes('cosmos')), 'Must never query Cosmos URL');
});
