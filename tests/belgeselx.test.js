// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const belgeselx = require('../src/belgeselx/index.js');
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
        Headers: global.Headers,
        require: name => {
            if (['cheerio', 'cheerio-without-node-native', 'react-native-cheerio'].includes(name)) {
                return require('cheerio-without-node-native');
            }
            throw Error('Unavailable runtime module: ' + name);
        }
    });
    const scraper = manifest.scrapers.find(s => s.id === 'mum_belgeselx');
    assert.ok(scraper, 'mum_belgeselx must exist in manifest.json');
    const bundlePath = path.resolve(__dirname, '..', scraper.filename);
    const code = fs.readFileSync(bundlePath, 'utf8');
    vm.runInContext('(function(){\n' + code + '\n})();', context, { timeout: 2000 });
    return { context, reports, provider: context.module.exports };
}

test('BelgeselX: TV series documentary resolves Cosmos S1E1 to direct Google Drive MP4 stream', async () => {
    const requestedUrls = [];
    const fetchMock = async (url, options = {}) => {
        const u = String(url);
        requestedUrls.push({ url: u, headers: options.headers });

        // 1. TMDB TV Mock
        if (u.includes('api.themoviedb.org/3/tv/58474')) {
            return {
                ok: true,
                json: async () => ({
                    name: 'Cosmos: Bir Uzay Serüveni',
                    original_name: 'Cosmos: A Spacetime Odyssey',
                    first_air_date: '2014-03-09'
                })
            };
        }

        // 2. Direct Slug Probe
        if (u === 'https://belgeselx.com/belgesel/cosmos-bir-uzay-seruveni') {
            return {
                ok: true,
                text: async () => `
                    <html><body>
                    <script>
                    diziGetir('998','0','5','4','Samanyoluna Bir Bakış','29118','Mart 2015','1','1','329','cosmos-bir-uzay-seruveni','0','','0','1');
                    function diziGetir(id, ic1, ic2, ic3, baslik, hit, tarih, sezon, bolum, diziid, sefurl) {}
                    </script>
                    </body></html>
                `
            };
        }

        // 3. Player Slot 1 ('0' -> new5.php) with Google Drive Preview
        if (u.includes('video/data/new5.php?id=998&sira=1')) {
            return {
                ok: true,
                text: async () => `
                    <body style="margin:0px;">
                    <iframe allowfullscreen="true" style="width:100%;height:100%;border:0px;" src="https://drive.google.com/file/d/13RG7FMRrQP_Oo6uPd9WiCOqa7e9oT2mV/preview"></iframe>
                    </body>
                `
            };
        }

        // 4. Google Drive direct download resolution
        if (u.includes('drive.usercontent.google.com/download')) {
            return {
                ok: true,
                headers: new Headers({ 'content-type': 'application/octet-stream' }),
                text: async () => ''
            };
        }

        throw new Error('Unexpected fetch for: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        const streams = await belgeselx.getStreams('58474', 'tv', 1, 1);
        assert.equal(streams.length, 1, 'Doğrudan oynatılabilir 1 akış dönmelidir');
        assert.ok(streams[0].url.includes('drive.usercontent.google.com/download'), 'Google Drive direct stream linki olmalıdır');
        assert.equal(streams[0].type, 'mp4');
        assert.equal(streams[0].provider, 'belgeselx');
        assert.match(streams[0].title, /BELGX/);
        assert.match(streams[0].title, /TR Dublaj/);
        assert.match(streams[0].title, /1\. Sezon 1\. Bölüm/);
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: Movie format documentary resolves S1E1 to direct Google Drive stream with virus scan confirm', async () => {
    const fetchMock = async (url) => {
        const u = String(url);

        if (u.includes('api.themoviedb.org/3/movie/6844')) {
            return {
                ok: true,
                json: async () => ({
                    title: 'Dünya Gezegeni',
                    original_title: 'Planet Earth',
                    release_date: '2006-03-05'
                })
            };
        }

        if (u === 'https://belgeselx.com/belgesel/dunya-gezegeni') {
            return {
                ok: true,
                text: async () => `
                    <html><body>
                    <div class="px-quality">1080p</div>
                    <script>
                    diziGetir('748','0','','4','Bir Kutuptan Diğerine','14251','Mart 2015','1','1','264','dunya-gezegeni','0','','0','1');
                    function diziGetir(id, ic1, ic2, ic3, baslik, hit, tarih, sezon, bolum, diziid, sefurl) {}
                    </script>
                    </body></html>
                `
            };
        }

        if (u.includes('video/data/new5.php?id=748&sira=1')) {
            return {
                ok: true,
                text: async () => `
                    <iframe src="https://drive.google.com/file/d/1C04av1k07C33YMR_rwg_iKAEGA47PCwh/preview"></iframe>
                `
            };
        }

        // Virus scan warning HTML with confirm form
        if (u.includes('drive.usercontent.google.com/download')) {
            return {
                ok: true,
                headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
                text: async () => `
                    <form id="download-form" action="https://drive.usercontent.google.com/download" method="get">
                        <input type="hidden" name="id" value="1C04av1k07C33YMR_rwg_iKAEGA47PCwh">
                        <input type="hidden" name="export" value="download">
                        <input type="hidden" name="confirm" value="t">
                        <input type="hidden" name="uuid" value="mock-uuid-12345">
                    </form>
                `
            };
        }

        throw new Error('Unexpected fetch for: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        const streams = await belgeselx.getStreams('6844', 'movie');
        assert.equal(streams.length, 1);
        assert.ok(streams[0].url.includes('confirm=t'));
        assert.ok(streams[0].url.includes('uuid=mock-uuid-12345'));
        assert.equal(streams[0].quality, '1080p');
        assert.equal(streams[0].type, 'mp4');
        assert.match(streams[0].title, /Bir Kutuptan Diğerine/);
        assert.match(streams[0].title, /TR Dublaj/);
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: 3-slot fallback skips dead placeholder slot 1 and resolves working slot 2 MP4', async () => {
    const attemptedSlots = [];
    const fetchMock = async (url) => {
        const u = String(url);

        if (u.includes('api.themoviedb.org/3/tv/946')) {
            return {
                ok: true,
                json: async () => ({
                    name: 'Sular Çekilince',
                    original_name: 'Drain the Oceans',
                    first_air_date: '2018-05-28'
                })
            };
        }

        if (u === 'https://belgeselx.com/belgesel/sular-cekilince') {
            return {
                ok: true,
                text: async () => `
                    <html><body>
                    <script>
                    diziGetir('16038','0','5','4','Akdenizin Kayıp Diyarları','11479','Kasım 2020','1','1','946','sular-cekilince','0','','0','1');
                    function diziGetir(id, ic1, ic2, ic3, baslik, hit, tarih, sezon, bolum, diziid, sefurl) {}
                    </script>
                    </body></html>
                `
            };
        }

        // Slot 1: Ölü placeholder
        if (u.includes('video/data/new5.php?id=16038&sira=1')) {
            attemptedSlots.push(1);
            return {
                ok: true,
                text: async () => `
                    <video><source src="https://downloader.disk.yandex.ru/disk/sample/theblacklist711tr.mp4"></video>
                `
            };
        }

        // Slot 2: Doğrudan çalışan MP4 akışı
        if (u.includes('video/data/new4.php?id=16038&sira=2')) {
            attemptedSlots.push(2);
            return {
                ok: true,
                text: async () => `
                    <video><source src="https://storage.belgeselx.com/sample_doc.mp4"></video>
                `
            };
        }

        throw new Error('Unexpected fetch for: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        const streams = await belgeselx.getStreams('946', 'tv', 1, 1);
        assert.deepEqual(attemptedSlots, [1, 2], 'Slot 1 ölü placeholder olduğunda Slot 2 denenmelidir');
        assert.equal(streams.length, 1);
        assert.equal(streams[0].url, 'https://storage.belgeselx.com/sample_doc.mp4');
        assert.equal(streams[0].type, 'mp4');
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: Resolves OK.ru embed into raw direct video stream from metadata.videos', async () => {
    const fetchMock = async (url) => {
        const u = String(url);

        if (u.includes('api.themoviedb.org/3/tv/742')) {
            return {
                ok: true,
                json: async () => ({
                    name: 'Ateşten Doğan',
                    original_name: 'Forged in Fire'
                })
            };
        }

        if (u === 'https://belgeselx.com/belgesel/atesten-dogan') {
            return {
                ok: true,
                text: async () => `
                    <script>
                    diziGetir('13149','4','','','Pandat Kılıcı','17495','Ekim 2017','1','1','742','atesten-dogan','0','','0','1');
                    function diziGetir(id, ic1, ic2, ic3, baslik, hit, tarih, sezon, bolum, diziid, sefurl) {}
                    </script>
                `
            };
        }

        // ic='4' -> new3.php returning OK.ru embed
        if (u.includes('video/data/new3.php?id=13149&sira=1')) {
            return {
                ok: true,
                text: async () => `
                    <iframe src="https://odnoklassniki.ru/videoembed/1692779809518"></iframe>
                `
            };
        }

        // OK.ru page with OKVideo data-options
        if (u.includes('odnoklassniki.ru/videoembed/1692779809518')) {
            return {
                ok: true,
                text: async () => `
                    <div data-module="OKVideo" data-options='{"flashvars":{"metadata":"{\\"videos\\":[{\\"name\\":\\"hd\\",\\"url\\":\\"https://vd1.okcdn.ru/video_720.mp4\\"},{\\"name\\":\\"sd\\",\\"url\\":\\"https://vd1.okcdn.ru/video_480.mp4\\"}]}"}}'></div>
                `
            };
        }

        throw new Error('Unexpected fetch for: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        const streams = await belgeselx.getStreams('742', 'tv', 1, 1);
        assert.equal(streams.length, 1);
        assert.equal(streams[0].url, 'https://vd1.okcdn.ru/video_720.mp4', 'OK.ru doğrudan MP4 video linkine çözümlenmelidir');
        assert.equal(streams[0].type, 'mp4');
        assert.equal(streams[0].quality, '720p');
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: Search fallback matches documentary when direct slug probe does not match', async () => {
    const fetchMock = async (url) => {
        const u = String(url);

        if (u.includes('api.themoviedb.org/3/tv/75')) {
            return {
                ok: true,
                json: async () => ({
                    name: 'Antik Uzaylılar Belgesel Serisi',
                    original_name: 'Ancient Aliens',
                    first_air_date: '2010-04-20'
                })
            };
        }

        if (u.includes('/belgesel/antik-uzaylilar-belgesel-serisi') || u.includes('/belgesel/ancient-aliens')) {
            return { ok: false, status: 404, text: async () => '404 Not Found' };
        }

        if (u.includes('?s=')) {
            return {
                ok: true,
                text: async () => `
                    <div class="px-toplist">
                        <a class="px-toplist-item" href="https://belgeselx.com/belgesel/antik-uzaylilar">
                            <img alt="ANTİK UZAYLILAR" src="img.jpg">
                            <div class="px-toplist-title">ANTİK UZAYLILAR</div>
                        </a>
                    </div>
                `
            };
        }

        if (u === 'https://belgeselx.com/belgesel/antik-uzaylilar') {
            return {
                ok: true,
                text: async () => `
                    <script>
                    diziGetir('1598','0','','','Uzaylılar ve Kutsal Mekanlar','44255','Mart 2015','1','1','75','antik-uzaylilar','0','','0','1');
                    function diziGetir(id, ic1, ic2, ic3, baslik, hit, tarih, sezon, bolum, diziid, sefurl) {}
                    </script>
                `
            };
        }

        if (u.includes('video/data/new5.php?id=1598&sira=1')) {
            return {
                ok: true,
                text: async () => `<iframe src="https://drive.google.com/file/d/ancient_aliens_drive/preview"></iframe>`
            };
        }

        if (u.includes('drive.usercontent.google.com/download')) {
            return {
                ok: true,
                headers: new Headers({ 'content-type': 'application/octet-stream' }),
                text: async () => ''
            };
        }

        throw new Error('Unexpected fetch for: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        const streams = await belgeselx.getStreams('75', 'tv', 1, 1);
        assert.equal(streams.length, 1);
        assert.ok(streams[0].url.includes('drive.usercontent.google.com/download'));
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: Completely missing documentary returns empty gracefully without crashing', async () => {
    const fetchMock = async (url) => {
        const u = String(url);
        if (u.includes('api.themoviedb.org')) {
            return {
                ok: true,
                json: async () => ({
                    name: 'Nonexistent Unknown Documentary 99999',
                    original_name: 'Nonexistent Unknown Documentary 99999'
                })
            };
        }
        if (u.includes('/belgesel/')) {
            return { ok: false, status: 404, text: async () => '404' };
        }
        if (u.includes('?s=')) {
            return { ok: true, text: async () => '<div class="px-toplist"></div>' };
        }
        throw new Error('Unexpected fetch: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        const streams = await belgeselx.getStreams('9999999', 'movie');
        assert.deepEqual(streams, []);
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: Bundle VM execution test from manifest.json scraper', async () => {
    const { provider, reports } = loadBundle(async (url) => {
        const u = String(url);
        if (u.includes('api.themoviedb.org')) {
            return {
                ok: true,
                json: async () => ({
                    name: 'Cosmos: Bir Uzay Serüveni',
                    original_name: 'Cosmos: A Spacetime Odyssey'
                })
            };
        }
        if (u === 'https://belgeselx.com/belgesel/cosmos-bir-uzay-seruveni') {
            return {
                ok: true,
                text: async () => `
                    <script>
                    diziGetir('998','0','','','Samanyoluna Bir Bakış','29118','Mart 2015','1','1','329','cosmos-bir-uzay-seruveni','0','','0','1');
                    function diziGetir(id, ic1, ic2, ic3, baslik, hit, tarih, sezon, bolum, diziid, sefurl) {}
                    </script>
                `
            };
        }
        if (u.includes('video/data/new5.php?id=998&sira=1')) {
            return {
                ok: true,
                text: async () => `<iframe src="https://drive.google.com/file/d/cosmos_vm_drive/preview"></iframe>`
            };
        }
        if (u.includes('drive.usercontent.google.com/download')) {
            return {
                ok: true,
                headers: new Headers({ 'content-type': 'application/octet-stream' }),
                text: async () => ''
            };
        }
        throw new Error('Unexpected fetch in VM: ' + u);
    });

    const streams = await provider.getStreams('58474', 'tv', 1, 1);
    assert.equal(streams.length, 1);
    assert.ok(streams[0].url.includes('drive.usercontent.google.com/download'));
    assert.match(reports.at(-1), /sources-found/);
});
