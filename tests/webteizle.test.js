// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const manifest = require('../manifest.json');

function loadWebteizle(fetchMock) {
  const reports = [];
  const context = vm.createContext({
    module: { exports: {} },
    console: { info: r => reports.push(r) },
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
  const scraper = manifest.scrapers.find(s => s.id === 'mum_webteizle');
  assert.ok(scraper, 'mum_webteizle must exist in manifest');
  const code = fs.readFileSync(scraper.filename, 'utf8');
  vm.runInContext('(function(){\n' + code + '\n})();', context, { timeout: 2000 });
  return { context, reports, provider: context.module.exports };
}

test('Webteİzle: Fast-path direct slug ile film sayfasını bulur ve Sibnet MP4 akışını çözer', async () => {
  const requests = [];
  const { provider, reports } = loadWebteizle(async (url, opts) => {
    requests.push({ url, method: opts && opts.method || 'GET', body: opts && opts.body });

    // 1. TMDB Find / Movie
    if (url.includes('api.themoviedb.org')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ title: 'Dune: Çöl Gezegeni', original_title: 'Dune', release_date: '2021-10-22' })
      };
    }

    // 2. Direct Slug
    if (url.includes('/izle/dublaj/dune')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<div id="wip" data-id="12345">Dune İzle</div>'
      };
    }
    if (url.includes('/izle/')) {
      return { ok: false, status: 404, text: async () => 'Not found' };
    }

    // 3. Alternatifler
    if (url.includes('/ajax/dataAlternatif3.asp')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          data: [
            { id: 'emb1', baslik: 'Sibnet', kalite: '1080p' }
          ]
        })
      };
    }

    // 4. dataEmbed
    if (url.includes('/ajax/dataEmbed.asp')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<iframe src="https://video.sibnet.ru/shell.php?videoid=998877"></iframe>'
      };
    }

    // 5. Sibnet Page
    if (url.includes('video.sibnet.ru/shell.php?videoid=998877')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<script>player.src([{src: "/v/998877.mp4", type: "video/mp4"}]);</script>'
      };
    }

    throw Error('Unexpected url: ' + url);
  });

  const streams = await provider.getStreams('1234', 'movie');
  assert.ok(Array.isArray(streams));
  assert.equal(streams.length, 1);
  assert.equal(streams[0].url, 'https://video.sibnet.ru/v/998877.mp4');
  assert.equal(streams[0].type, 'mp4');
  assert.match(streams[0].title, /Sibnet/);
  assert.match(reports.at(-1), /sources-found/);
});

test('Webteİzle: VidMoly unpacker şifreli scriptten M3U8 master akışını çözer', async () => {
  const { provider, reports } = loadWebteizle(async (url) => {
    if (url.includes('api.themoviedb.org')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ title: 'Matrix', original_title: 'The Matrix', release_date: '1999-03-31' })
      };
    }
    if (url.includes('/izle/dublaj/matrix')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<div id="wip" data-id="555">Matrix</div>'
      };
    }
    if (url.includes('/izle/')) {
      return { ok: false, status: 404, text: async () => '404' };
    }
    if (url.includes('/ajax/dataAlternatif3.asp')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          data: [{ id: 'vm_emb', baslik: 'VidMoly', kalite: '1080p' }]
        })
      };
    }
    if (url.includes('/ajax/dataEmbed.asp')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<iframe src="https://vidmoly.biz/embed-abc123xyz.html"></iframe>'
      };
    }
    if (url.includes('vidmoly.biz/embed-abc123xyz.html')) {
      const packedJs = 'eval(function(p,a,c,k,e,d){return p}(\'file:"https://vidmoly.biz/hls/matrix/master.m3u8"\',2,2,\'file|master\'.split(\'|\'),0,{}))';
      return {
        ok: true,
        status: 200,
        text: async () => '<html><head><script>' + packedJs + '</script></head></html>'
      };
    }
    throw Error('Unexpected url: ' + url);
  });

  const streams = await provider.getStreams('603', 'movie');
  assert.equal(streams.length, 1);
  assert.equal(streams[0].url, 'https://vidmoly.biz/hls/matrix/master.m3u8');
  assert.match(streams[0].title, /VidMoly/);
  assert.match(reports.at(-1), /sources-found/);
});

test('Webteİzle: Cloudflare 403 Turnstile Challenge alındığında http-blocked raporlar', async () => {
  const { provider, reports } = loadWebteizle(async (url) => {
    if (url.includes('api.themoviedb.org')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ title: 'Dune', original_title: 'Dune', release_date: '2021-10-22' })
      };
    }
    return {
      ok: false,
      status: 403,
      headers: new Headers({ 'cf-mitigated': 'challenge' }),
      text: async () => '<title>Just a moment...</title>'
    };
  });

  const streams = await provider.getStreams('1234', 'movie');
  assert.equal(streams.length, 0);
  assert.match(reports.at(-1), /http-blocked/);
});

test('Webteİzle: Arama fallback matching.js kullanarak yanlış yılı eler', async () => {
  const { provider, reports } = loadWebteizle(async (url, opts) => {
    if (url.includes('api.themoviedb.org')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ title: 'The Odyssey', original_title: 'The Odyssey', release_date: '2026-05-01' })
      };
    }
    if (url.includes('/izle/')) {
      return { ok: false, status: 404, text: async () => 'Not found' };
    }
    if (url.includes('/ajax/arama.asp')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          results: {
            filmler: {
              results: [
                { baslik: 'Cosmos: A Spacetime Odyssey', url: '/izle/dublaj/cosmos-odyssey', yil: '2014' }
              ]
            }
          }
        })
      };
    }
    throw Error('Unexpected url: ' + url);
  });

  const streams = await provider.getStreams('9999', 'movie');
  assert.equal(streams.length, 0);
  assert.match(reports.at(-1), /empty/);
});
