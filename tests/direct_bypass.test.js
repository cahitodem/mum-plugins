const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const manifest = require('../manifest.json');

function loadScraper(scraperId, customFetch) {
    const scraper = manifest.scrapers.find(s => s.id === scraperId);
    if (!scraper) throw new Error('Scraper not found: ' + scraperId);
    const reports = [];
    const context = vm.createContext({
        module: { exports: {} },
        console: { info: r => reports.push(r), log: () => {}, warn: () => {}, error: () => {} },
        fetch: customFetch,
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
            if (['cheerio', 'cheerio-without-node-native', 'react-native-cheerio'].includes(name)) {
                return require('cheerio-without-node-native');
            }
            if (name === 'crypto-js') return require('crypto-js');
            throw Error('Unavailable runtime module: ' + name);
        }
    });
    const code = fs.readFileSync(scraper.filename, 'utf8');
    vm.runInContext('(function(){' + code + '\n})();', context, { timeout: 2000 });
    return { context, reports, provider: context.module.exports };
}

test('HDFilmDelisi direct bypass: when Vixolity HLS succeeds, skips 3 sequential on-site HTTP steps', async () => {
    const requestedUrls = [];
    const customFetch = async (url) => {
        const u = String(url);
        requestedUrls.push(u);
        if (u.includes('vixolity.com/vs/tt1234567')) {
            return {
                ok: true,
                status: 200,
                text: async () => '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\nindex.m3u8'
            };
        }
        if (u.includes('hdfilmdelisi.one/api/search') || u.includes('/film/')) {
            assert.fail('On-site search should be completely bypassed when Vixolity HLS succeeds: ' + u);
        }
        throw new Error('Unexpected URL: ' + u);
    };

    const hdModule = require('../src/hdfilmdelisi/index.js');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = customFetch;
    try {
        const streams = await hdModule.getStreams('tt1234567', 'movie');
        assert.ok(Array.isArray(streams));
        assert.equal(streams.length, 1);
        assert.equal(streams[0].provider, 'hdfilmdelisi');
        assert.match(streams[0].url, /vixolity\.com\/vs\/tt1234567/);
        // Assert only Vixolity was called (0 TMDB calls, 0 site search calls)
        assert.equal(requestedUrls.length, 1);
        assert.equal(requestedUrls[0], 'https://ha.vixolity.com/vs/tt1234567');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('HDFilmDelisi player decryption: extracts and resolves Vixolity HLS from pl.vixolity.com encrypted payload', async () => {
    const requestedUrls = [];
    const testHex = '45526b66574255554b5a314f75746b563734325357645457364d566768707a553742554f67786e63507432642f6c5461374d4864727848544f6857662f416e56426d305472647a62304256505142496176786a587339326530426c504a70315675425658594657544d4246674e523361';
    const testKey = 7;
    const customFetch = async (url) => {
        const u = String(url);
        requestedUrls.push(u);
        if (u.includes('vixolity.com/vs/tt5555555')) {
            return { ok: false, status: 404, text: async () => 'Not Found' };
        }
        if (u.includes('vixolity.com/vs/tt8888888')) {
            return {
                ok: true,
                status: 200,
                text: async () => '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=5000000\nindex.m3u8'
            };
        }
        if (u.includes('api.themoviedb.org')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    movie_results: [{ id: 8888, title: 'Encrypted Player Film', original_title: 'Encrypted Player Film', release_date: '2024-01-01' }]
                })
            };
        }
        if (u.includes('hdfilmdelisi.one/api/search')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    results: [{ id: 88, slug: 'encrypted-film', baslik: 'Encrypted Player Film', yayinYili: '2024' }]
                })
            };
        }
        if (u.includes('hdfilmdelisi.one/film/encrypted-film')) {
            return {
                ok: true,
                status: 200,
                text: async () => '<html><script id="jsonld-video" type="application/ld+json">{"embedUrl":"https://pl.vixolity.com/encToken123"}</script></html>'
            };
        }
        if (u.includes('pl.vixolity.com/encToken123')) {
            return {
                ok: true,
                status: 200,
                text: async () => `<script>(function(){})("${testHex}", ${testKey});</script>`
            };
        }
        throw new Error('Unexpected URL: ' + u);
    };

    const hdModule = require('../src/hdfilmdelisi/index.js');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = customFetch;
    try {
        const streams = await hdModule.getStreams('tt5555555', 'movie');
        assert.equal(streams.length, 1);
        assert.equal(streams[0].provider, 'hdfilmdelisi');
        assert.match(streams[0].url, /vixolity\.com\/vs\/tt8888888/);
        assert.ok(requestedUrls.some(u => u.includes('pl.vixolity.com/encToken123')));
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('HDFilmDelisi safe fallback: when direct Vixolity HLS returns 404, site search fallback activates and finds stream', async () => {
    const requestedUrls = [];
    const customFetch = async (url) => {
        const u = String(url);
        requestedUrls.push(u);
        if (u.includes('vixolity.com/vs/tt9999999')) {
            return {
                ok: true,
                status: 200,
                text: async () => '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=5000000\nindex.m3u8'
            };
        }
        if (u.includes('vixolity.com/vs/tt7654321')) {
            return {
                ok: false,
                status: 404,
                text: async () => 'Not Found'
            };
        }
        if (u.includes('api.themoviedb.org')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    movie_results: [{
                        id: 7777,
                        title: 'Fallback Film',
                        original_title: 'Fallback Film',
                        release_date: '2023-01-01'
                    }]
                })
            };
        }
        if (u.includes('hdfilmdelisi.one/api/search')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    results: [{ id: 55, slug: 'fallback-film', baslik: 'Fallback Film', yayinYili: '2023' }]
                })
            };
        }
        if (u.includes('hdfilmdelisi.one/film/fallback-film')) {
            return {
                ok: true,
                status: 200,
                text: async () => '<html><script id="jsonld-movie" type="application/ld+json">{"sameAs":"https://www.imdb.com/title/tt9999999/"}</script></html>'
            };
        }
        throw new Error('Unexpected URL: ' + u);
    };

    const hdModule = require('../src/hdfilmdelisi/index.js');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = customFetch;
    try {
        const streams = await hdModule.getStreams('tt7654321', 'movie');
        // Vixolity direct probe was attempted first
        assert.ok(requestedUrls.some(u => u.includes('vixolity.com/vs/tt7654321')));
        // When Vixolity direct returned 404, TMDB and site search fallback executed
        assert.ok(requestedUrls.some(u => u.includes('api.themoviedb.org')));
        assert.ok(requestedUrls.some(u => u.includes('hdfilmdelisi.one/api/search')));
        // And fallback successfully found the alternative stream!
        assert.equal(streams.length, 1);
        assert.equal(streams[0].provider, 'hdfilmdelisi');
        assert.match(streams[0].url, /vixolity\.com\/vs\/tt9999999/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('VidMody direct bypass: when called with IMDb ID, bypasses redundant TMDB find network request', async () => {
    const requestedUrls = [];
    const customFetch = async (url) => {
        const u = String(url);
        requestedUrls.push(u);
        if (u.includes('vixolity.com/vs/tt1234567')) {
            return {
                ok: true,
                status: 200,
                text: async () => '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=5000000\nindex.m3u8'
            };
        }
        if (u.includes('api.themoviedb.org/3/find')) {
            assert.fail('Redundant TMDB find call should be bypassed for IMDb ID');
        }
        return { ok: true, status: 200, json: async () => ({}) };
    };

    const vidmodyModule = require('../src/vidmody/index.js');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = customFetch;
    try {
        const streams = await vidmodyModule.getStreams('tt1234567', 'movie');
        assert.equal(streams.length, 1);
        assert.equal(streams[0].provider, 'vidmody');
        assert.equal(requestedUrls.length, 1);
        assert.equal(requestedUrls[0], 'https://ha.vixolity.com/vs/tt1234567');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('HDFilmDelisi player decryption: extracts and resolves Vixolity HLS from pl.vixolity.com encrypted payload', async () => {
    const requestedUrls = [];
    const testHex = '45526b66574255554b5a314f75746b563734325357645457364d566768707a553742554f67786e63507432642f6c5461374d4864727848544f6857662f416e56426d305472647a62304256505142496176786a587339326530426c504a70315675425658594657544d4246674e523361';
    const testKey = 7;
    const customFetch = async (url) => {
        const u = String(url);
        requestedUrls.push(u);
        if (u.includes('vixolity.com/vs/tt5555555')) {
            return { ok: false, status: 404, text: async () => 'Not Found' };
        }
        if (u.includes('vixolity.com/vs/tt8888888')) {
            return {
                ok: true,
                status: 200,
                text: async () => '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=5000000\nindex.m3u8'
            };
        }
        if (u.includes('api.themoviedb.org')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    movie_results: [{ id: 8888, title: 'Encrypted Player Film', original_title: 'Encrypted Player Film', release_date: '2024-01-01' }]
                })
            };
        }
        if (u.includes('hdfilmdelisi.one/api/search')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    results: [{ id: 88, slug: 'encrypted-film', baslik: 'Encrypted Player Film', yayinYili: '2024' }]
                })
            };
        }
        if (u.includes('hdfilmdelisi.one/film/encrypted-film')) {
            return {
                ok: true,
                status: 200,
                text: async () => '<html><script id="jsonld-video" type="application/ld+json">{"embedUrl":"https://pl.vixolity.com/encToken123"}</script></html>'
            };
        }
        if (u.includes('pl.vixolity.com/encToken123')) {
            return {
                ok: true,
                status: 200,
                text: async () => `<script>(function(){})("${testHex}", ${testKey});</script>`
            };
        }
        throw new Error('Unexpected URL: ' + u);
    };

    const hdModule = require('../src/hdfilmdelisi/index.js');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = customFetch;
    try {
        const streams = await hdModule.getStreams('tt5555555', 'movie');
        assert.equal(streams.length, 1);
        assert.equal(streams[0].provider, 'hdfilmdelisi');
        assert.match(streams[0].url, /vixolity\.com\/vs\/tt8888888/);
        assert.ok(requestedUrls.some(u => u.includes('pl.vixolity.com/encToken123')));
    } finally {
        globalThis.fetch = originalFetch;
    }
});
