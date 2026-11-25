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

test('BelgeselX: Search fallback matches documentary via ?s= when sitemap is unavailable', async () => {
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

        if (u.includes('/sitemap.php')) {
            return { ok: false, status: 404, text: async () => 'Not Found' };
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
        if (globalThis.__MUM_BELGESELX_SITEMAP__) delete globalThis.__MUM_BELGESELX_SITEMAP__['https://belgeselx.com'];
        const streams = await belgeselx.getStreams('75', 'tv', 1, 1);
        assert.equal(streams.length, 1);
        assert.ok(streams[0].url.includes('drive.usercontent.google.com/download'));
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: Sitemap search matches documentary and rejects sequel slug mismatch (Planet Earth vs planet-earth-2)', async () => {
    const fetchMock = async (url) => {
        const u = String(url);
        if (u.includes('api.themoviedb.org/3/tv/1044/alternative_titles')) {
            return { ok: true, json: async () => ({ results: [{ iso_3166_1: 'TR', title: 'Sadece Yeryüzü' }] }) };
        }
        if (u.includes('api.themoviedb.org/3/tv/1044')) {
            return {
                ok: true,
                json: async () => ({
                    name: 'Yeryüzü',
                    original_name: 'Planet Earth',
                    first_air_date: '2006-03-05'
                })
            };
        }
        if (u.includes('/belgesel/yeryuzu') || u.includes('/belgesel/planet-earth') || u.includes('/belgesel/sadece-yeryuzu')) {
            return { ok: false, status: 404, text: async () => '404' };
        }
        if (u === 'https://belgeselx.com/sitemap.php') {
            return {
                ok: true,
                text: async () => `<?xml version="1.0" encoding="UTF-8"?>
                <urlset>
                    <url><loc>https://belgeselx.com/belgesel/planet-earth-2</loc></url>
                    <url><loc>https://belgeselx.com/belgeseldizi/planet-earth-2</loc></url>
                </urlset>`
            };
        }
        throw new Error('Unexpected fetch: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        if (globalThis.__MUM_BELGESELX_SITEMAP__) delete globalThis.__MUM_BELGESELX_SITEMAP__['https://belgeselx.com'];
        await assert.rejects(async () => {
            await belgeselx.getStreams('1044', 'tv', 1, 1);
        }, err => err.name === 'ProviderError' && err.code === 'NO_MATCH');
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: new4.php skips dummy theblacklist711tr.mp4 video tag and resolves belgeselx2.php?cid= without Referer', async () => {
    const cidHeadersSeen = [];
    const fetchMock = async (url, opts = {}) => {
        const u = String(url);
        if (u.includes('api.themoviedb.org/3/tv/88801')) {
            return {
                ok: true,
                json: async () => ({
                    name: 'Yeni Dünyalar',
                    original_name: 'New Worlds'
                })
            };
        }
        if (u === 'https://belgeselx.com/belgesel/yeni-dunyalar') {
            return {
                ok: true,
                text: async () => `
                    <script>
                    diziGetir('20001','5','1','','Yeni Dünyalar Bölümü','500','Ocak 2024','1','1','88801','yeni-dunyalar','0','','0','1');
                    function diziGetir(id, ic1, ic2, ic3, baslik, hit, tarih, sezon, bolum, diziid, sefurl) {}
                    </script>
                `
            };
        }
        if (u.includes('video/data/new4.php?id=20001&sira=1')) {
            return {
                ok: true,
                text: async () => `
                    <html><head><meta name="referrer" content="no-referrer"></head>
                    <body>
                        <div class="jw-media"><video src="https://downloader.disk.yandex.ru/disk/sample?filename=theblacklist711tr.mp4"></video></div>
                        <script>
                        var player = jwplayer("vplayer").setup({
                            sources: [
                                { file: "https://belgeselx.com/video/belgeselx2.php?cid=pw/TEST_CID", label: "720p", type: "video/mp4" },
                                { file: "https://belgeselx.com/video/belgeselx.php?cid=pw/TEST_CID", label: "480p", type: "video/mp4" }
                            ]
                        });
                        </script>
                    </body></html>
                `
            };
        }
        if (u === 'https://belgeselx.com/video/belgeselx2.php?cid=pw/TEST_CID') {
            cidHeadersSeen.push(opts.headers || {});
            return {
                ok: false,
                status: 302,
                headers: new Headers({ location: 'https://3.bp.blogspot.com/pw/TEST_CID=m22' }),
                text: async () => ''
            };
        }
        if (u === 'https://3.bp.blogspot.com/pw/TEST_CID=m22') {
            cidHeadersSeen.push(opts.headers || {});
            return {
                ok: false,
                status: 302,
                headers: new Headers({ location: 'https://rr2---sn-test.googlevideo.com/videoplayback?id=abc' }),
                text: async () => ''
            };
        }
        throw new Error('Unexpected fetch: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        const streams = await belgeselx.getStreams('88801', 'tv', 1, 1);
        assert.equal(streams.length, 1);
        assert.equal(streams[0].url, 'https://rr2---sn-test.googlevideo.com/videoplayback?id=abc');
        assert.equal(streams[0].quality, '720p');
        assert.equal(streams[0].type, 'mp4');
        assert.equal(streams[0].headers.Referer, undefined, 'googlevideo URL must NOT carry Referer header');
        assert.equal(cidHeadersSeen.length, 2);
        assert.equal(cidHeadersSeen[0].Referer, undefined);
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: Resolves Yandex.Disk (new2) and Dailymotion (new1) slots when primary slots fail', async () => {
    const fetchMock = async (url) => {
        const u = String(url);
        if (u.includes('api.themoviedb.org/3/tv/88802')) {
            return { ok: true, json: async () => ({ name: 'Yandex Belgesel', original_name: 'Yandex Doc' }) };
        }
        if (u === 'https://belgeselx.com/belgesel/yandex-belgesel') {
            return {
                ok: true,
                text: async () => `<script>diziGetir('20002','3','2','','Bölüm 1','10','2024','1','1','88802','yandex-belgesel','0','','0','1');</script>`
            };
        }
        if (u.includes('video/data/new2.php?id=20002&sira=1')) {
            return { ok: true, text: async () => `<iframe src="https://yadi.sk/d/TEST_KEY"></iframe>` };
        }
        if (u.includes('cloud-api.yandex.net/v1/disk/public/resources/download')) {
            return { ok: true, json: async () => ({ href: 'https://downloader.disk.yandex.ru/disk/real_doc.mp4' }) };
        }
        if (u.includes('api.themoviedb.org/3/tv/88803')) {
            return { ok: true, json: async () => ({ name: 'Dailymotion Belgesel', original_name: 'DM Doc' }) };
        }
        if (u === 'https://belgeselx.com/belgesel/dailymotion-belgesel') {
            return {
                ok: true,
                text: async () => `<script>diziGetir('20003','2','','','Bölüm 1','10','2024','1','1','88803','dailymotion-belgesel','0','','0','1');</script>`
            };
        }
        if (u.includes('video/data/new1.php?id=20003&sira=1')) {
            return { ok: true, text: async () => `<iframe src="https://www.dailymotion.com/embed/video/x8abcde"></iframe>` };
        }
        if (u.includes('dailymotion.com/player/metadata/video/x8abcde')) {
            return {
                ok: true,
                json: async () => ({
                    qualities: {
                        '720': [{ type: 'application/x-mpegURL', url: 'https://www.dailymotion.com/cdn/manifest/video/x8abcde.m3u8' }]
                    }
                })
            };
        }
        throw new Error('Unexpected fetch: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        const yStreams = await belgeselx.getStreams('88802', 'tv', 1, 1);
        assert.equal(yStreams.length, 1);
        assert.equal(yStreams[0].url, 'https://downloader.disk.yandex.ru/disk/real_doc.mp4');
        assert.equal(yStreams[0].type, 'mp4');

        const dStreams = await belgeselx.getStreams('88803', 'tv', 1, 1);
        assert.equal(dStreams.length, 1);
        assert.equal(dStreams[0].url, 'https://www.dailymotion.com/cdn/manifest/video/x8abcde.m3u8');
        assert.equal(dStreams[0].type, 'hls');
        assert.equal(dStreams[0].quality, '720p');
    } finally {
        global.fetch = originalFetch;
    }
});

test('BelgeselX: Completely missing documentary throws NO_MATCH and compiled bundle reports no-match', async () => {
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
        if (u.includes('/sitemap.php')) {
            return { ok: true, text: async () => '<urlset></urlset>' };
        }
        if (u.includes('?s=')) {
            return { ok: true, text: async () => '<div class="px-toplist"></div>' };
        }
        throw new Error('Unexpected fetch: ' + u);
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        await assert.rejects(async () => {
            await belgeselx.getStreams('9999999', 'movie');
        }, err => err.name === 'ProviderError' && err.code === 'NO_MATCH');
    } finally {
        global.fetch = originalFetch;
    }

    const { provider, reports } = loadBundle(fetchMock);
    const out = await provider.getStreams('9999999', 'movie');
    assert.equal(out.length, 0);
    assert.match(reports.at(-1), /no-match/);
});

test('BelgeselX: HTTP 403 block throws HTTP_BLOCKED and compiled bundle reports http-blocked', async () => {
    const fetchMock = async (url) => {
        const u = String(url);
        if (u.includes('api.themoviedb.org')) {
            return {
                ok: true,
                json: async () => ({
                    name: 'Blocked Documentary',
                    original_name: 'Blocked Documentary'
                })
            };
        }
        return { ok: false, status: 403, text: async () => 'Forbidden' };
    };

    const originalFetch = global.fetch;
    global.fetch = fetchMock;
    try {
        await assert.rejects(async () => {
            await belgeselx.getStreams('9999998', 'movie');
        }, err => err.name === 'ProviderError' && err.code === 'HTTP_BLOCKED');
    } finally {
        global.fetch = originalFetch;
    }

    const { provider, reports } = loadBundle(fetchMock);
    const out = await provider.getStreams('9999998', 'movie');
    assert.equal(out.length, 0);
    assert.match(reports.at(-1), /http-blocked/);
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
