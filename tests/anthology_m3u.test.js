// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
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
      throw Error('Unavailable runtime module: ' + name);
    }
  });
  const scraper = manifest.scrapers.find(s => s.id === 'mum_anthology_m3u');
  const code = fs.readFileSync(scraper.filename, 'utf8');
  vm.runInContext('(function(){\n' + code + '\n})();', context, { timeout: 2000 });
  return { context, reports, provider: context.module.exports };
}

test('Anthology M3U: Rejects stream URL with mismatched IMDb ID (Karma tt38896081 vs tt29921070)', async () => {
  const m3uContent = [
    '#EXTM3U',
    '#EXTINF:-1 group-title="Diziler" group-author="powerboard",Karma S01E01',
    'https://ha.vixolity.com/vs/tt29921070/s1/e01'
  ].join('\n');

  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/find/tt38896081')) {
      return {
        ok: true,
        json: async () => ({
          tv_results: [{ id: 305062, name: 'Karma', original_name: 'Karma' }]
        })
      };
    }
    if (u.includes('api.themoviedb.org/3/tv/305062')) {
      return {
        ok: true,
        json: async () => ({
          id: 305062,
          name: 'Karma',
          original_name: 'Karma',
          external_ids: { imdb_id: 'tt38896081' }
        })
      };
    }
    if (u.includes('dizi_k_s1.m3u')) {
      return {
        ok: true,
        text: async () => m3uContent
      };
    }
    return { ok: false, status: 404, text: async () => '' };
  };

  const { provider } = loadBundle(fetchMock);
  const streams = await provider.getStreams('tt38896081', 'series', 1, 1);

  assert.equal(streams.length, 0, 'Must reject stream whose URL contains a conflicting IMDb ID (tt29921070)');
});

test('Anthology M3U: Accepts stream URL when embedded IMDb ID matches target (Karma tt38896081)', async () => {
  const m3uContent = [
    '#EXTM3U',
    '#EXTINF:-1 group-title="Diziler" group-author="powerboard",Karma S01E01',
    'https://ha.vixolity.com/vs/tt38896081/s1/e01'
  ].join('\n');

  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/find/tt38896081')) {
      return {
        ok: true,
        json: async () => ({
          tv_results: [{ id: 305062, name: 'Karma', original_name: 'Karma' }]
        })
      };
    }
    if (u.includes('api.themoviedb.org/3/tv/305062')) {
      return {
        ok: true,
        json: async () => ({
          id: 305062,
          name: 'Karma',
          original_name: 'Karma',
          external_ids: { imdb_id: 'tt38896081' }
        })
      };
    }
    if (u.includes('dizi_k_s1.m3u')) {
      return {
        ok: true,
        text: async () => m3uContent
      };
    }
    return { ok: false, status: 404, text: async () => '' };
  };

  const { provider } = loadBundle(fetchMock);
  const streams = await provider.getStreams('tt38896081', 'series', 1, 1);

  assert.equal(streams.length, 1, 'Must accept stream matching IMDb ID');
  assert.equal(streams[0].url, 'https://ha.vixolity.com/vs/tt38896081/s1/e01');
});
