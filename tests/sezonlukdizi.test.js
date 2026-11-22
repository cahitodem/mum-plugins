// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
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
    crypto: crypto.webcrypto,
    require: name => {
      if (['cheerio', 'cheerio-without-node-native', 'react-native-cheerio'].includes(name)) return require('cheerio-without-node-native');
      if (name === 'crypto') return crypto;
      throw Error('Unavailable runtime module: ' + name);
    }
  });
  const scraper = manifest.scrapers.find(s => s.id === 'mum_sezonlukdizi');
  const code = fs.readFileSync(scraper.filename, 'utf8');
  vm.runInContext('(function(){\n' + code + '\n})();', context, { timeout: 2000 });
  return { context, reports, provider: context.module.exports };
}

test('SezonlukDizi: Highest quality filtering keeps only 1080p and filters out 720p and 480p', async () => {
  const fetchMock = async (url, options = {}) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/find/tt0903747') || u.includes('api.themoviedb.org/3/tv/1396')) {
      return {
        ok: true,
        json: async () => ({
          name: 'Breaking Bad',
          original_name: 'Breaking Bad',
          id: 1396,
          tv_results: [{ id: 1396, name: 'Breaking Bad', original_name: 'Breaking Bad' }]
        })
      };
    }
    if (u.includes('/ajax/arama.asp')) {
      return {
        ok: true,
        json: async () => ({
          status: 'success',
          results: {
            diziler: {
              results: [
                { did: '55', title: 'Breaking Bad', url: '/diziler/breaking-bad.html' }
              ]
            }
          }
        })
      };
    }
    if (u.includes('/breaking-bad/1-sezon-1-bolum.html')) {
      return {
        ok: true,
        text: async () => '<div id="topBarBtn" bid="7788"></div>'
      };
    }
    if (u.includes('/ajax/dataAlternatif22.asp')) {
      const body = String(options.body || '');
      if (body.includes('dil=1')) {
        // Subtitled: returns alternatives with 1080p (kalite 4), 720p (kalite 3), and 480p (kalite 2)
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            data: [
              { id: '101', baslik: 'FileMoon', kalite: 4 },
              { id: '102', baslik: 'Sibnet', kalite: 3 },
              { id: '103', baslik: 'AltPlayer', kalite: 2 }
            ]
          })
        };
      }
      return { ok: true, json: async () => ({ status: 'success', data: [] }) };
    }
    if (u.includes('/ajax/dataEmbed22.asp')) {
      const body = String(options.body || '');
      if (body.includes('id=101')) {
        return { ok: true, text: async () => '<iframe src="https://stream.server.com/play_1080p.m3u8"></iframe>' };
      }
      if (body.includes('id=102')) {
        return { ok: true, text: async () => '<iframe src="https://video.sibnet.ru/shell.php?videoid=202"></iframe>' };
      }
      if (body.includes('id=103')) {
        return { ok: true, text: async () => '<iframe src="https://vidmoly.biz/embed-303.html"></iframe>' };
      }
    }
    if (u.includes('video.sibnet.ru')) {
      return { ok: true, text: async () => 'src: "/v/202_720.mp4"' };
    }
    if (u.includes('vidmoly.biz/embed-303.html')) {
      return { ok: true, text: async () => 'file: "https://vidmoly.biz/live/480.m3u8"' };
    }
    if (u.includes('stream.server.com/play_1080p.m3u8')) {
      return { ok: true, text: async () => '#EXTM3U\n#EXTINF:10,\nsegment1.ts' };
    }
    throw Error('Unexpected url in test: ' + u);
  };

  const { provider } = loadBundle(fetchMock);
  const streams = await provider.getStreams('tt0903747', 'tv', 1, 1);

  assert.ok(streams.length > 0, 'Should return at least one stream');
  // All returned streams must be 1080p; 720p and 480p must be filtered out
  for (const s of streams) {
    assert.equal(s.quality, '1080p', 'Stream quality must be 1080p, lower qualities must be eliminated');
  }
  assert.equal(streams.length, 1, 'Only the highest quality stream should be listed');
  assert.equal(streams[0].name, 'Breaking Bad');
});

test('SezonlukDizi: Lower resolutions are filtered out per language group (preserving Dublaj and Altyazılı)', async () => {
  const fetchMock = async (url, options = {}) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org')) {
      return {
        ok: true,
        json: async () => ({
          name: 'Fixture Show',
          original_name: 'Fixture Show',
          id: 500,
          tv_results: [{ id: 500, name: 'Fixture Show', original_name: 'Fixture Show' }]
        })
      };
    }
    if (u.includes('/ajax/arama.asp')) {
      return {
        ok: true,
        json: async () => ({
          status: 'success',
          results: {
            diziler: {
              results: [{ did: '500', title: 'Fixture Show', url: '/diziler/fixture-show.html' }]
            }
          }
        })
      };
    }
    if (u.includes('/fixture-show/1-sezon-1-bolum.html')) {
      return {
        ok: true,
        text: async () => '<div id="topBarBtn" bid="9900"></div>'
      };
    }
    if (u.includes('/ajax/dataAlternatif22.asp')) {
      const body = String(options.body || '');
      if (body.includes('dil=1')) {
        // Altyazılı: 1080p and 720p
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            data: [
              { id: '1', baslik: 'FileMoon', kalite: 4 },
              { id: '2', baslik: 'Sibnet', kalite: 3 }
            ]
          })
        };
      }
      if (body.includes('dil=0')) {
        // Dublaj: 720p and 480p
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            data: [
              { id: '3', baslik: 'Sibnet', kalite: 3 },
              { id: '4', baslik: 'VidMoly', kalite: 2 }
            ]
          })
        };
      }
    }
    if (u.includes('/ajax/dataEmbed22.asp')) {
      const body = String(options.body || '');
      if (body.includes('id=1')) return { ok: true, text: async () => '<iframe src="https://host.com/sub_1080.m3u8"></iframe>' };
      if (body.includes('id=2')) return { ok: true, text: async () => '<iframe src="https://video.sibnet.ru/sub_720.mp4"></iframe>' };
      if (body.includes('id=3')) return { ok: true, text: async () => '<iframe src="https://video.sibnet.ru/dub_720.mp4"></iframe>' };
      if (body.includes('id=4')) return { ok: true, text: async () => '<iframe src="https://vidmoly.biz/dub_480.m3u8"></iframe>' };
    }
    if (u.includes('video.sibnet.ru/sub_720.mp4')) return { ok: true, text: async () => 'src: "/v/sub720.mp4"' };
    if (u.includes('video.sibnet.ru/dub_720.mp4')) return { ok: true, text: async () => 'src: "/v/dub720.mp4"' };
    if (u.includes('vidmoly.biz/dub_480.m3u8')) return { ok: true, text: async () => 'file: "https://vidmoly.biz/dub480.m3u8"' };
    throw Error('Unexpected url in test: ' + u);
  };

  const { provider } = loadBundle(fetchMock);
  const streams = await provider.getStreams('500', 'tv', 1, 1);

  assert.equal(streams.length, 2, 'Should keep exactly 2 streams: top Altyazılı and top Dublaj');
  const altyaziStream = streams.find(s => s.title.includes('Altyazılı'));
  const dublajStream = streams.find(s => s.title.includes('Dublaj'));

  assert.ok(altyaziStream, 'Altyazılı stream must be present');
  assert.equal(altyaziStream.quality, '1080p', 'Altyazılı must be 1080p (highest available for Altyazılı)');

  assert.ok(dublajStream, 'Dublaj stream must be present');
  assert.equal(dublajStream.quality, '720p', 'Dublaj must be 720p (highest available for Dublaj, 480p filtered out)');
});

test('SezonlukDizi: When only 720p and 480p exist, returns 720p and filters out 480p', async () => {
  const fetchMock = async (url, options = {}) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org')) {
      return {
        ok: true,
        json: async () => ({
          name: 'Old Series',
          original_name: 'Old Series',
          id: 600,
          tv_results: [{ id: 600, name: 'Old Series', original_name: 'Old Series' }]
        })
      };
    }
    if (u.includes('/ajax/arama.asp')) {
      return {
        ok: true,
        json: async () => ({
          status: 'success',
          results: {
            diziler: {
              results: [{ did: '600', title: 'Old Series', url: '/diziler/old-series.html' }]
            }
          }
        })
      };
    }
    if (u.includes('/old-series/1-sezon-1-bolum.html')) {
      return {
        ok: true,
        text: async () => '<div id="topBarBtn" bid="6000"></div>'
      };
    }
    if (u.includes('/ajax/dataAlternatif22.asp')) {
      return {
        ok: true,
        json: async () => ({
          status: 'success',
          data: [
            { id: '10', baslik: 'Sibnet', kalite: 3 },
            { id: '11', baslik: 'VidMoly', kalite: 2 }
          ]
        })
      };
    }
    if (u.includes('/ajax/dataEmbed22.asp')) {
      const body = String(options.body || '');
      if (body.includes('id=10')) return { ok: true, text: async () => '<iframe src="https://video.sibnet.ru/720.mp4"></iframe>' };
      if (body.includes('id=11')) return { ok: true, text: async () => '<iframe src="https://vidmoly.biz/480.m3u8"></iframe>' };
    }
    if (u.includes('video.sibnet.ru/720.mp4')) return { ok: true, text: async () => 'src: "/v/720.mp4"' };
    if (u.includes('vidmoly.biz/480.m3u8')) return { ok: true, text: async () => 'file: "https://vidmoly.biz/480.m3u8"' };
    throw Error('Unexpected url in test: ' + u);
  };

  const { provider } = loadBundle(fetchMock);
  const streams = await provider.getStreams('600', 'tv', 1, 1);

  assert.equal(streams.length, 1, 'Only 1 stream should be returned');
  assert.equal(streams[0].quality, '720p', 'Should be 720p as highest available');
});

test('SezonlukDizi: Pure Turkish domestic show (Karma tt38896081) is immediately skipped and returns empty', async () => {
  const requests = [];
  const fetchMock = async (url) => {
    const u = String(url);
    requests.push(u);
    if (u.includes('api.themoviedb.org/3/find/tt38896081')) {
      return {
        ok: true,
        json: async () => ({
          tv_results: [{
            id: 305062,
            name: 'Karma',
            original_name: 'Karma',
            origin_country: ['TR'],
            original_language: 'tr'
          }]
        })
      };
    }
    throw Error('Unexpected url in test: ' + u);
  };

  const { provider } = loadBundle(fetchMock);
  const streams = await provider.getStreams('tt38896081', 'tv', 1, 1);

  assert.equal(streams.length, 0, 'Pure Turkish domestic production must return 0 streams on foreign series scraper');
  assert.equal(requests.length, 1, 'Must abort immediately after TMDB resolve without querying foreign pirate site');
});
