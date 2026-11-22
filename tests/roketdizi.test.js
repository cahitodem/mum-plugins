// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const roketdizi = require('../src/roketdizi/index.js');
const manifest = require('../manifest.json');

// ── Test Yardımcıları (Kripto ve Bundle Yükleyici) ─────────────────────

function createEncPayload(plaintext, password = 'testsecretkey123') {
  const salt = crypto.randomBytes(8).toString('hex');
  const iv = crypto.randomBytes(16).toString('hex');
  const key = crypto.pbkdf2Sync(Buffer.from(password, 'utf8'), Buffer.from(salt, 'hex'), 999, 32, 'sha512');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]).toString('base64');
  return { ciphertext, iv, salt, k: password };
}

function loadBundle(fetchMock) {
  const reports = [];
  const context = vm.createContext({
    module: { exports: {} },
    console: {
      info: r => reports.push(r),
      log: () => {},
      warn: () => {},
      error: () => {}
    },
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
    Buffer,
    crypto,
    require: name => {
      if (['cheerio', 'cheerio-without-node-native', 'react-native-cheerio'].includes(name)) {
        return require('cheerio-without-node-native');
      }
      if (name === 'crypto') return crypto;
      throw Error('Unavailable runtime module: ' + name);
    }
  });

  const scraper = manifest.scrapers.find(s => s.id === 'mum_roketdizi');
  assert.ok(scraper, 'mum_roketdizi must exist in manifest.json');
  const code = fs.readFileSync(scraper.filename, 'utf8');
  vm.runInContext('(function(){\n' + code + '\n})();', context, { timeout: 2000 });
  return { context, reports, provider: context.module.exports };
}

// ── 1. Kriptografik Vektör Testi (PBKDF2 SHA-512 + AES-256-CBC) ──────

test('RoketDizi: Cryptographic vector test (PBKDF2 SHA-512 + AES-256-CBC decryption)', async () => {
  const targetUrl = 'https://pichive.biz/embed/v_vector_xyz789';
  const enc = createEncPayload(targetUrl, 'superpassrokettv');

  // A. Doğru parametrelerle deşifreleme (özdeş PBKDF2 + AES-256-CBC algoritması)
  const key = crypto.pbkdf2Sync(Buffer.from(enc.k, 'utf8'), Buffer.from(enc.salt, 'hex'), 999, 32, 'sha512');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(enc.iv, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(enc.ciphertext, 'base64')), decipher.final()]).toString('utf8');
  assert.equal(decrypted.trim(), targetUrl);

  // B. Provider içindeki extractEncParams ve decryptPlayer regex akışının doğrulanması
  const escapedHtml = `
    <script>
      self.__next_f.push([1,"7:{\\"enc\\":{\\"ciphertext\\":\\"${enc.ciphertext}\\",\\"iv\\":\\"${enc.iv}\\",\\"salt\\":\\"${enc.salt}\\"},\\"k\\":\\"${enc.k}\\"}"]);
    </script>
  `;
  const encMatch = escapedHtml.match(/\\"enc\\":\{\\"ciphertext\\":\\"([^"\\]+)\\",\\"iv\\":\\"([0-9a-fA-F]+)\\",\\"salt\\":\\"([0-9a-fA-F]+)\\"\},\\"k\\":\\"([a-zA-Z0-9]+)\\"/);
  assert.ok(encMatch, 'Escaped JSON regex must match enc parameters');
  assert.equal(encMatch[1], enc.ciphertext);
  assert.equal(encMatch[2], enc.iv);
  assert.equal(encMatch[3], enc.salt);
  assert.equal(encMatch[4], enc.k);

  // C. Unescaped JSON ayrıştırması
  const unescapedHtml = `
    <div id="player-data">
      {"enc":{"ciphertext":"${enc.ciphertext}","iv":"${enc.iv}","salt":"${enc.salt}"},"k":"${enc.k}"}
    </div>
  `;
  const unescapedMatch = unescapedHtml.match(/"enc":\{"ciphertext":"([^"]+)","iv":"([0-9a-fA-F]+)","salt":"([0-9a-fA-F]+)"\},"k":"([a-zA-Z0-9]+)"/);
  assert.ok(unescapedMatch, 'Unescaped JSON regex must match enc parameters');
  assert.equal(unescapedMatch[1], enc.ciphertext);
  assert.equal(unescapedMatch[4], enc.k);

  // D. Bozuk ciphertext veya geçersiz anahtar durumu
  const badKey = crypto.pbkdf2Sync(Buffer.from('wrongkey', 'utf8'), Buffer.from(enc.salt, 'hex'), 999, 32, 'sha512');
  assert.throws(() => {
    const badDecipher = crypto.createDecipheriv('aes-256-cbc', badKey, Buffer.from(enc.iv, 'hex'));
    Buffer.concat([badDecipher.update(Buffer.from(enc.ciphertext, 'base64')), badDecipher.final()]);
  });
});

// ── 2. Pichive NP_GATE Proof-of-Work Solver Test (words[5] >>> 20 === 0) ──

test('RoketDizi: Pichive NP_GATE Proof-of-Work solver verifies (words[5] >>> 20 === 0)', async () => {
  const nonce = 'testnonce_7'; // i = 93'te çözüme ulaşır
  const cmiy = String.fromCharCode(75, 83, 102, 76, 107, 83, 86, 73, 77, 84); // "KSfLkSVIMT"
  
  // PoW çözümleyici simülasyonu
  let solution = null;
  for (let i = 0; i <= 10000; i++) {
    const hash = crypto.createHash('sha256').update(i + '|' + cmiy + '|' + nonce).digest();
    // 20. bayttaki 32-bit unsigned int (CryptoJS words[5])
    const word5 = hash.readUInt32BE(20);
    if ((word5 >>> 20) === 0) {
      solution = i.toString();
      break;
    }
  }

  assert.equal(solution, '93', 'Nonce testnonce_7 must be solved at iteration 93');

  // Çözümün URL'e eklenme kuralları (appendSolution)
  const testUrlWithoutParams = 'https://pichive.biz/hls/master.m3u8';
  const sep1 = testUrlWithoutParams.indexOf('?') >= 0 ? '&' : '?';
  const final1 = testUrlWithoutParams + sep1 + 'p=' + solution;
  assert.equal(final1, 'https://pichive.biz/hls/master.m3u8?p=93');

  const testUrlWithParams = 'https://pichive.biz/hls/master.m3u8?token=xyz123';
  const sep2 = testUrlWithParams.indexOf('?') >= 0 ? '&' : '?';
  const final2 = testUrlWithParams + sep2 + 'p=' + solution;
  assert.equal(final2, 'https://pichive.biz/hls/master.m3u8?token=xyz123&p=93');

  // HTML'den NP_GATE ve NP_CONFIG regex ayrıştırma testi
  const samplePlayerHtml = `
    <html>
      <head>
        <script>
          window.NP_GATE = { "n": "testnonce_7" };
          window.NP_CONFIG = {
            "file": "https://pichive.biz/hls/master.m3u8",
            "tracks": [
              { "file": "/subtitles/turkish.vtt", "label": "Türkçe", "srclang": "tr" }
            ]
          };
        </script>
      </head>
    </html>
  `;
  const gateMatch = samplePlayerHtml.match(/(?:window\.)?NP_GATE\s*=\s*({[\s\S]*?});/i);
  assert.ok(gateMatch, 'NP_GATE block must be found');
  const parsedGate = JSON.parse(gateMatch[1]);
  assert.equal(parsedGate.n, 'testnonce_7');

  const configMatch = samplePlayerHtml.match(/(?:window\.)?NP_CONFIG\s*=\s*({[\s\S]*?});/i);
  assert.ok(configMatch, 'NP_CONFIG block must be found');
  const parsedConfig = JSON.parse(configMatch[1]);
  assert.equal(parsedConfig.file, 'https://pichive.biz/hls/master.m3u8');
  assert.equal(parsedConfig.tracks[0].file, '/subtitles/turkish.vtt');
});

// ── 3. TV Dizisi Akış Çözümleme (Arama, Sezon/Bölüm, Dublaj & Altyazı, M3U8 & VTT) ─

test('RoketDizi: TV series stream resolution (multi-player dubbed & subtitled stream extraction)', async () => {
  const requestedUrls = [];
  const encDub = createEncPayload('https://pichive.biz/e/dub2002', 'keydub2002');
  const encSub = createEncPayload('https://pichive.biz/e/sub1001', 'keysub1001');

  const fetchMock = async (url) => {
    const u = String(url);
    requestedUrls.push(u);

    // TMDB Metadata
    if (u.includes('api.themoviedb.org/3/tv/9999')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          name: 'Severance',
          original_name: 'Severance',
          first_air_date: '2022-02-18'
        })
      };
    }

    // RoketDizi Arama
    if (u.includes('/arama-yap?s=')) {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <div class="search-results">
            <a href="/dizi/severance" aria-label="Severance, 2022">Severance</a>
          </div>
        `
      };
    }

    // Bölüm Sayfası (Varsayılan Türkçe Dublaj, Türkçe Altyazılı alternatifli)
    if (u === 'https://roketdizi.life/dizi/severance/sezon-1/bolum-1') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <body>
              <span id="playerType">Türkçe Dublaj</span>
              <script>
                self.__next_f.push([1,"{\\"sources\\":[{\\"dub\\":false,\\"label\\":\\"Türkçe Altyazı\\",\\"href\\":\\"/dizi/severance/sezon-1/bolum-1?player=altyazi\\",\\"quality\\":\\"1080p\\"}],\\"enc\\":{\\"ciphertext\\":\\"${encDub.ciphertext}\\",\\"iv\\":\\"${encDub.iv}\\",\\"salt\\":\\"${encDub.salt}\\"},\\"k\\":\\"${encDub.k}\\"}"]);
              </script>
            </body>
          </html>
        `
      };
    }

    // Altyazı Oyuncu Sayfası (?player=altyazi)
    if (u === 'https://roketdizi.life/dizi/severance/sezon-1/bolum-1?player=altyazi') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <body>
              <span id="playerType">Türkçe Altyazılı</span>
              <script>
                self.__next_f.push([1,"{\\"enc\\":{\\"ciphertext\\":\\"${encSub.ciphertext}\\",\\"iv\\":\\"${encSub.iv}\\",\\"salt\\":\\"${encSub.salt}\\"},\\"k\\":\\"${encSub.k}\\"}"]);
              </script>
            </body>
          </html>
        `
      };
    }

    // Dublaj Pichive Iframe Sayfası
    if (u === 'https://pichive.biz/e/dub2002') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <script>
              window.NP_GATE = { "n": "testnonce_7" };
              window.NP_CONFIG = {
                "file": "https://pichive.biz/hls/severance_s01e01_dub/master.m3u8"
              };
            </script>
          </html>
        `
      };
    }

    // Altyazılı Pichive Iframe Sayfası
    if (u === 'https://pichive.biz/e/sub1001') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <script>
              window.NP_GATE = { "n": "testnonce_7" };
              window.NP_CONFIG = {
                "file": "https://pichive.biz/hls/severance_s01e01_sub/master.m3u8",
                "tracks": [
                  { "file": "https://pichive.biz/vtt/severance_s01e01_tr.vtt", "label": "Türkçe", "srclang": "tr" }
                ]
              };
            </script>
          </html>
        `
      };
    }

    throw new Error('Unexpected URL fetched: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await roketdizi.getStreams('9999', 'tv', 1, 1);
    assert.equal(streams.length, 2, 'Hem Türkçe Dublaj hem Türkçe Altyazılı akış dönmelidir');

    // Dublaj ve Altyazı ayrımı
    const dubStream = streams.find(s => s.title.includes('Türkçe Dublaj'));
    const subStream = streams.find(s => s.title.includes('Türkçe Altyazı'));

    assert.ok(dubStream, 'Dublaj akışı mevcut olmalıdır');
    assert.ok(subStream, 'Altyazılı akış mevcut olmalıdır');

    // URL'lerde PoW parametresi (?p=93) doğrulaması
    assert.equal(dubStream.url, 'https://pichive.biz/hls/severance_s01e01_dub/master.m3u8?p=93');
    assert.equal(subStream.url, 'https://pichive.biz/hls/severance_s01e01_sub/master.m3u8?p=93');

    // Altyazı doğrulaması
    assert.equal(subStream.subtitles.length, 1);
    assert.equal(subStream.subtitles[0].url, 'https://pichive.biz/vtt/severance_s01e01_tr.vtt?p=93');
    assert.equal(subStream.subtitles[0].label, 'Türkçe');

    // Başlık ve meta veri doğrulaması
    assert.match(dubStream.title, /⌜ RoketDizi ⌟ \| RoketTV \| 🇹🇷 Türkçe Dublaj · 1\. Sezon 1\. Bölüm/);
    assert.match(subStream.title, /⌜ RoketDizi ⌟ \| RoketTV \| 🌐 Türkçe Altyazı · 1\. Sezon 1\. Bölüm/);
    assert.equal(dubStream.provider, 'roketdizi');
    assert.equal(subStream.provider, 'roketdizi');

    // Header ve behaviorHints
    assert.equal(dubStream.headers.Referer, 'https://pichive.biz/e/dub2002');
    assert.equal(subStream.headers.Referer, 'https://pichive.biz/e/sub1001');
    assert.equal(dubStream.headers.Origin, 'https://pichive.biz');
    assert.equal(subStream.headers.Origin, 'https://pichive.biz');
    assert.equal(dubStream.behaviorHints.notWebReady, true);
    assert.deepEqual(dubStream.behaviorHints.proxyHeaders.request, dubStream.headers);

    // format ve isHls alanları (Nuvio HLS demuxer seçimi için zorunlu)
    assert.equal(dubStream.format, 'hls', 'Dublaj akışı format alanı hls olmalıdır');
    assert.equal(dubStream.isHls, true, 'Dublaj akışı isHls true olmalıdır');
    assert.equal(subStream.format, 'hls', 'Altyazılı akışı format alanı hls olmalıdır');
    assert.equal(subStream.isHls, true, 'Altyazılı akışı isHls true olmalıdır');
  } finally {
    global.fetch = originalFetch;
  }
});

// ── 4. Film Akış Çözümleme (/film/<slug>/izle) ─────────────────────────

test('RoketDizi: Movie stream resolution (/film/<slug>/izle) routes properly', async () => {
  const requestedUrls = [];
  const encMovie = createEncPayload('https://pichive.biz/e/movie_oppenheimer', 'oppenkey123');

  const fetchMock = async (url) => {
    const u = String(url);
    requestedUrls.push(u);

    if (u.includes('api.themoviedb.org/3/movie/872585')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          title: 'Oppenheimer',
          original_title: 'Oppenheimer',
          release_date: '2023-07-21'
        })
      };
    }

    if (u.includes('/film-izle?s=')) {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <div class="movies">
            <a href="/film/oppenheimer/izle" aria-label="Oppenheimer, 2023">Oppenheimer</a>
          </div>
        `
      };
    }

    if (u === 'https://roketdizi.life/film/oppenheimer/izle') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <body>
              <span class="dub-badge">Türkçe Dublaj</span>
              <script>
                self.__next_f.push([1,"{\\"enc\\":{\\"ciphertext\\":\\"${encMovie.ciphertext}\\",\\"iv\\":\\"${encMovie.iv}\\",\\"salt\\":\\"${encMovie.salt}\\"},\\"k\\":\\"${encMovie.k}\\"}"]);
              </script>
            </body>
          </html>
        `
      };
    }

    if (u === 'https://pichive.biz/e/movie_oppenheimer') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <script>
            window.NP_GATE = { "n": "testnonce_7" };
            window.NP_CONFIG = { "file": "https://pichive.biz/hls/oppenheimer/master.m3u8" };
          </script>
        `
      };
    }

    throw new Error('Unexpected URL fetched: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await roketdizi.getStreams('872585', 'movie');
    assert.equal(streams.length, 1, 'Film akışı başarıyla çözümlenmelidir');
    assert.equal(streams[0].url, 'https://pichive.biz/hls/oppenheimer/master.m3u8?p=93');
    assert.match(streams[0].title, /⌜ RoketDizi ⌟ \| RoketTV \| 🇹🇷 Türkçe Dublaj$/);
    assert.ok(!streams[0].title.includes('Sezon'), 'Film başlığında sezon/bölüm ifadesi olmamalıdır');

    // format ve isHls alanları (Nuvio HLS demuxer seçimi için zorunlu)
    assert.equal(streams[0].format, 'hls', 'Film akışı format alanı hls olmalıdır');
    assert.equal(streams[0].isHls, true, 'Film akışı isHls true olmalıdır');

    // /film/ adresi çağrılmalı, asla /dizi/ çağrılmamalıdır
    assert.ok(requestedUrls.some(u => u.includes('/film/oppenheimer/izle')), '/film/oppenheimer/izle çağrılmış olmalıdır');
    assert.ok(!requestedUrls.some(u => u.includes('/dizi/')), 'Film sorgusunda /dizi/ çağrılmamalıdır');
  } finally {
    global.fetch = originalFetch;
  }
});

// ── 5. Doğrudan MP4 / M3U8 Akış Iframe Çözümlemesi ───────────────────

test('RoketDizi: Direct video stream (mp4 / m3u8) without secondary iframe HTML', async () => {
  const encDirect = createEncPayload('https://directcdn.life/storage/video_direct1080.mp4', 'directkey123');

  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/movie/111')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ title: 'Direct Film', original_title: 'Direct Film', release_date: '2024-01-01' })
      };
    }
    if (u.includes('/film-izle?s=')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<a href="/film/direct-film/izle" aria-label="Direct Film, 2024">Direct Film</a>'
      };
    }
    if (u === 'https://roketdizi.life/film/direct-film/izle') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <script>
            self.__next_f.push([1,"{\\"enc\\":{\\"ciphertext\\":\\"${encDirect.ciphertext}\\",\\"iv\\":\\"${encDirect.iv}\\",\\"salt\\":\\"${encDirect.salt}\\"},\\"k\\":\\"${encDirect.k}\\"}"]);
          </script>
        `
      };
    }
    throw new Error('Unexpected URL: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await roketdizi.getStreams('111', 'movie');
    assert.equal(streams.length, 1);
    assert.equal(streams[0].url, 'https://directcdn.life/storage/video_direct1080.mp4');
    assert.equal(streams[0].type, 'mp4');
    assert.equal(streams[0].quality, '1080p');
    assert.equal(streams[0].format, 'mp4', 'Doğrudan MP4 akışında format mp4 olmalıdır');
    assert.equal(streams[0].isHls, false, 'Doğrudan MP4 akışında isHls false olmalıdır');
  } finally {
    global.fetch = originalFetch;
  }
});

// ── 6. Dizi Ana Sayfasından Bölüm Bağlantısı Keşif Fallback'i ────────

test('RoketDizi: Fallback to series page link discovery when direct episode URL has no enc', async () => {
  const requestedUrls = [];
  const encFallback = createEncPayload('https://pichive.biz/e/discovered_ep', 'fallbackkey123');

  const fetchMock = async (url) => {
    const u = String(url);
    requestedUrls.push(u);

    if (u.includes('api.themoviedb.org/3/tv/222')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ name: 'Complex Series', original_name: 'Complex Series', first_air_date: '2023-01-01' })
      };
    }
    if (u.includes('/arama-yap?s=')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<a href="/dizi/complex-series" aria-label="Complex Series, 2023">Complex Series</a>'
      };
    }
    // Doğrudan tahmin edilen /sezon-1/bolum-1 adresi enc içermiyor (örnek: 404 veya boş sayfa)
    if (u === 'https://roketdizi.life/dizi/complex-series/sezon-1/bolum-1') {
      return { ok: true, status: 200, text: async () => '<html><body>Episode list required</body></html>' };
    }
    // Dizi ana sayfası taranıyor
    if (u === 'https://roketdizi.life/dizi/complex-series') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <div class="episodes">
            <a href="/dizi/complex-series/sezon-1/bolum-1-ozel">1. Sezon 1. Bölüm İzle</a>
          </div>
        `
      };
    }
    // Bulunan özel bölüm sayfası
    if (u === 'https://roketdizi.life/dizi/complex-series/sezon-1/bolum-1-ozel') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <script>
            self.__next_f.push([1,"{\\"enc\\":{\\"ciphertext\\":\\"${encFallback.ciphertext}\\",\\"iv\\":\\"${encFallback.iv}\\",\\"salt\\":\\"${encFallback.salt}\\"},\\"k\\":\\"${encFallback.k}\\"}"]);
          </script>
        `
      };
    }
    if (u === 'https://pichive.biz/e/discovered_ep') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <script>
            window.NP_GATE = { "n": "testnonce_7" };
            window.NP_CONFIG = { "file": "https://pichive.biz/hls/discovered/master.m3u8" };
          </script>
        `
      };
    }
    throw new Error('Unexpected URL: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const streams = await roketdizi.getStreams('222', 'tv', 1, 1);
    assert.equal(streams.length, 1);
    assert.equal(streams[0].url, 'https://pichive.biz/hls/discovered/master.m3u8?p=93');
    assert.ok(requestedUrls.includes('https://roketdizi.life/dizi/complex-series'), 'Dizi ana sayfası taranmış olmalıdır');
    assert.ok(requestedUrls.includes('https://roketdizi.life/dizi/complex-series/sezon-1/bolum-1-ozel'), 'Keşfedilen bölüm sayfası açılmış olmalıdır');
  } finally {
    global.fetch = originalFetch;
  }
});

// ── 7. Yıl Uyuşmazlığı ve Sahte Aday Reddi (False Candidate Rejection) ──

test('RoketDizi: Year mismatch and false candidate rejection returns empty streams and rejects cleanly', async () => {
  const requestedUrls = [];
  const fetchMock = async (url) => {
    const u = String(url);
    requestedUrls.push(u);

    // TMDB Mock: Orijinal Malcolm in the Middle (2000)
    if (u.includes('api.themoviedb.org/3/tv/2004')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          name: 'Malcolm in the Middle',
          original_name: 'Malcolm in the Middle',
          first_air_date: '2000-01-09'
        })
      };
    }

    // Sitede yalnızca 2026 yapımı yan yapım var
    if (u.includes('/arama-yap?s=') || u.includes('/film-izle?s=')) {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <div class="results">
            <a href="/dizi/malcolm-in-the-middle-lifes-still-unfair" aria-label="Malcolm in the Middle: Life's Still Unfair, 2026">
              Malcolm in the Middle: Life's Still Unfair
            </a>
          </div>
        `
      };
    }

    throw new Error('Unexpected fetch for false candidate: ' + u);
  };

  // A. Standalone Provider: pickBestCandidate null döner ve ProviderError('NO_MATCH') fırlatır
  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    await assert.rejects(async () => {
      await roketdizi.getStreams('2004', 'tv', 1, 1);
    }, (err) => {
      return err.name === 'ProviderError' && err.code === 'NO_MATCH';
    });
    assert.ok(!requestedUrls.some(u => u.includes('bolum-1')), 'Bölüm sayfası asla çağrılmamalıdır');
    assert.ok(!requestedUrls.some(u => u.includes('pichive')), 'Oynatıcı asla çağrılmamalıdır');
  } finally {
    global.fetch = originalFetch;
  }

  // B. Bundled Provider: Adapter NO_MATCH yakalayıp boş dizi döner ve no-match durumu raporlar
  const { provider, reports } = loadBundle(fetchMock);
  const bundledStreams = await provider.getStreams('2004', 'tv', 1, 1);
  assert.equal(bundledStreams.length, 0, 'Adapter üzerinden çağrıldığında boş dizi dönmelidir');
  const lastReport = reports.map(r => {
    try { return JSON.parse(r.replace(/^\[MUM\]\s*/, '')); } catch (_) { return null; }
  }).filter(Boolean).at(-1);
  assert.equal(lastReport.status, 'no-match');
});

// ── 8. İptal ve AbortSignal Yönetimi ───────────────────────────────────

test('RoketDizi: Pre-aborted signal cancels immediately and throws or returns empty', async () => {
  const abortCtrl = new AbortController();
  abortCtrl.abort();

  const fetchMock = async (url, options = {}) => {
    if (options && options.signal && options.signal.aborted) {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    }
    throw new Error('Fetch should not be executed when signal is pre-aborted');
  };

  // A. Standalone Provider testi: AbortError bekler
  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    await assert.rejects(async () => {
      await roketdizi.getStreams('9999', 'tv', 1, 1, { signal: abortCtrl.signal });
    }, (err) => {
      return err.name === 'AbortError' || err.name === 'ProviderError';
    });
  } finally {
    global.fetch = originalFetch;
  }

  // B. Bundled Provider testi: Adapter zaman aşımı/iptal yakalayıp boş dizi döner
  const { provider, reports } = loadBundle(fetchMock);
  const streams = await provider.getStreams('9999', 'tv', 1, 1, { signal: abortCtrl.signal });
  assert.equal(streams.length, 0);
  const lastReport = reports.map(r => {
    try { return JSON.parse(r.replace(/^\[MUM\]\s*/, '')); } catch (_) { return null; }
  }).filter(Boolean).at(-1);
  assert.equal(lastReport.status, 'timeout');
});

// ── 9. HTTP 403 Cloudflare Engeli Durumunda ProviderError Fırlatma ─────

test('RoketDizi: Cloudflare 403 challenge throws ProviderError with HTTP_BLOCKED', async () => {
  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ name: 'Blocked Show', original_name: 'Blocked Show', first_air_date: '2023-01-01' })
      };
    }
    if (u.includes('roketdizi.life')) {
      return {
        ok: false,
        status: 403,
        statusText: 'Forbidden (Cloudflare challenge)'
      };
    }
    throw new Error('Unexpected URL: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    await assert.rejects(async () => {
      await roketdizi.getStreams('12345', 'tv', 1, 1);
    }, (err) => {
      return err.name === 'ProviderError' && err.code === 'HTTP_BLOCKED';
    });
  } finally {
    global.fetch = originalFetch;
  }
});

// ── 10. manifest.json Üzerinden VM Ortamında Bundle Doğrulaması ───────

test('RoketDizi: Bundle VM execution test from manifest.json scraper', async () => {
  const encBundle = createEncPayload('https://pichive.biz/e/bundle_test_player', 'bundlekey123');

  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/tv/7777')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ name: 'VM Test Show', original_name: 'VM Test Show', first_air_date: '2023-01-01' })
      };
    }
    if (u.includes('/arama-yap?s=')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<a href="/dizi/vm-test-show" aria-label="VM Test Show, 2023">VM Test Show</a>'
      };
    }
    if (u === 'https://roketdizi.life/dizi/vm-test-show/sezon-1/bolum-1') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <script>
            self.__next_f.push([1,"{\\"enc\\":{\\"ciphertext\\":\\"${encBundle.ciphertext}\\",\\"iv\\":\\"${encBundle.iv}\\",\\"salt\\":\\"${encBundle.salt}\\"},\\"k\\":\\"${encBundle.k}\\"}"]);
          </script>
        `
      };
    }
    if (u === 'https://pichive.biz/e/bundle_test_player') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <script>
            window.NP_GATE = { "n": "testnonce_7" };
            window.NP_CONFIG = { "file": "https://pichive.biz/hls/vm_bundle/master.m3u8" };
          </script>
        `
      };
    }
    throw new Error('Unexpected URL in VM: ' + u);
  };

  const { provider, reports } = loadBundle(fetchMock);

  // 1. Dizi akışlarının VM içinde çözümlenmesi
  const streams = await provider.getStreams('7777', 'tv', 1, 1);
  assert.equal(streams.length, 1);
  assert.equal(streams[0].url, 'https://pichive.biz/hls/vm_bundle/master.m3u8?p=93');
  assert.equal(streams[0].quality, '1080p');
  assert.equal(streams[0].provider, 'roketdizi');
  assert.equal(streams[0].format, 'hls', 'Bundle VM akışında format hls olmalıdır');
  assert.equal(streams[0].isHls, true, 'Bundle VM akışında isHls true olmalıdır');

  // 2. Adapter log/rapor kontrolü (sources-found bildirimi)
  const parsedReports = reports.map(r => {
    try { return JSON.parse(r.replace(/^\[MUM\]\s*/, '')); } catch (_) { return null; }
  }).filter(Boolean);

  const lastReport = parsedReports.at(-1);
  assert.ok(lastReport, 'Adapter en az bir rapor üretmelidir');
  assert.equal(lastReport.provider, 'mum_roketdizi');
  assert.equal(lastReport.status, 'sources-found');
  assert.equal(lastReport.count, 1);

  // 3. Desteklenmeyen medya türü (anime) testi - doğrudan boş dönmeli
  const animeStreams = await provider.getStreams('7777', 'anime');
  assert.equal(animeStreams.length, 0, 'Desteklenmeyen türde boş dizi dönmelidir');
  const animeReport = reports.map(r => {
    try { return JSON.parse(r.replace(/^\[MUM\]\s*/, '')); } catch (_) { return null; }
  }).filter(Boolean).at(-1);
  assert.equal(animeReport.status, 'unsupported-type');
});

// ── 11. "A Friend, A Murderer" (TMDB 315755, Virgüllü Başlık, EN/TR Arama, Iframe Fallback ve Pichive) ──

test('RoketDizi: A Friend, A Murderer (TMDB 315755) resolves comma-title, EN/TR fallback, 403 iframe fallback, and PoW', async () => {
  const encEp1 = createEncPayload('https://four.pichive.online/iframe.php?v=friend_ep1', 'key_ep1_secret');
  const encEp2 = createEncPayload('https://four.pichive.online/iframe.php?v=friend_ep2', 'key_ep2_secret');
  const requestedUrls = [];

  const fetchMock = async (url) => {
    const u = String(url);
    requestedUrls.push(u);

    // 1. TMDB Çok Dilli Başlıklar
    if (u.includes('api.themoviedb.org/3/tv/315755')) {
      if (u.includes('language=tr-TR')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: 'Bir Arkadaş, Bir Katil',
            original_name: 'En ven, en morder',
            first_air_date: '2023-10-12'
          })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          name: 'A Friend, A Murderer',
          original_name: 'En ven, en morder',
          first_air_date: '2023-10-12'
        })
      };
    }

    // 2. RoketDizi Arama
    // İlk arama: Türkçe başlık (sitede bulunamaz)
    if (u.includes('s=Bir%20Arkada%C5%9F%2C%20Bir%20Katil') || u.includes('s=Bir Arkadaş, Bir Katil')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<div class="no-results">Sonuç bulunamadı</div>'
      };
    }

    // İkinci arama: İngilizce başlık ("A Friend, A Murderer") - virgüllü aria-label
    if (u.includes('s=A%20Friend%2C%20A%20Murderer') || u.includes('s=A Friend, A Murderer')) {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <div class="search-results">
            <a href="/dizi/a-friend-a-murderer" aria-label="A Friend, A Murderer, 2023">A Friend, A Murderer</a>
          </div>
        `
      };
    }

    // 3. Bölüm 1 Sayfası
    if (u === 'https://roketdizi.life/dizi/a-friend-a-murderer/sezon-1/bolum-1') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <body>
              <script>
                self.__next_f.push([1,"{\\"enc\\":{\\"ciphertext\\":\\"${encEp1.ciphertext}\\",\\"iv\\":\\"${encEp1.iv}\\",\\"salt\\":\\"${encEp1.salt}\\"},\\"k\\":\\"${encEp1.k}\\"}"]);
              </script>
            </body>
          </html>
        `
      };
    }

    // 4. Bölüm 2 Sayfası
    if (u === 'https://roketdizi.life/dizi/a-friend-a-murderer/sezon-1/bolum-2') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <body>
              <script>
                self.__next_f.push([1,"{\\"enc\\":{\\"ciphertext\\":\\"${encEp2.ciphertext}\\",\\"iv\\":\\"${encEp2.iv}\\",\\"salt\\":\\"${encEp2.salt}\\"},\\"k\\":\\"${encEp2.k}\\"}"]);
              </script>
            </body>
          </html>
        `
      };
    }

    // 5. Pichive Iframe: Bölüm 1 için gerçek Pichive HTML formatı (NP_CONFIG.gate + sources[0].master + subtitles)
    if (u === 'https://four.pichive.online/iframe.php?v=friend_ep1') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <script>
              window.NP_GATE = function(_kq, _uvu) {};
              window.NP_CONFIG = {
                "gate": { "n": "testnonce_7", "b": 12 },
                "sources": [
                  { "title": "Orijinal", "kind": "orig", "master": "https://four.pichive.online/nm.php?v=friend_ep1_master" }
                ],
                "subtitles": [
                  { "label": "Türkçe", "lang": "tr", "forced": false, "url": "https://four.pichive.online/nsub.php?v=sub_ep1" }
                ]
              };
            </script>
          </html>
        `
      };
    }

    // 6. Pichive Iframe: Bölüm 2 için 200 OK + legacy NP_GATE PoW & NP_CONFIG.file
    if (u === 'https://four.pichive.online/iframe.php?v=friend_ep2') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <script>
              window.NP_GATE = { "n": "testnonce_7" };
              window.NP_CONFIG = {
                "file": "https://four.pichive.online/hls/friend_ep2/master.m3u8",
                "tracks": [
                  { "file": "/sub/tr.vtt", "label": "Türkçe", "srclang": "tr" }
                ]
              };
            </script>
          </html>
        `
      };
    }

    throw new Error('Unexpected URL in Test 11: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;

  try {
    // A. Bölüm 1 Testi: Pichive NP_CONFIG.gate + sources[0].master çözümlenmeli ve p parametresi eklenmeli
    const streamsEp1 = await roketdizi.getStreams('315755', 'tv', 1, 1);
    assert.equal(streamsEp1.length, 1, 'Bölüm 1 için geçerli PoW çözümlü master HLS akışı dönmeli');
    assert.equal(streamsEp1[0].url, 'https://four.pichive.online/nm.php?v=friend_ep1_master&p=93');
    assert.equal(streamsEp1[0].type, 'hls');
    assert.equal(streamsEp1[0].format, 'hls', 'nm.php akışında format hls olmalıdır');
    assert.equal(streamsEp1[0].isHls, true, 'nm.php akışında isHls true olmalıdır');
    assert.equal(streamsEp1[0].provider, 'roketdizi');
    assert.equal(streamsEp1[0].headers.Referer, 'https://four.pichive.online/iframe.php?v=friend_ep1');
    assert.equal(streamsEp1[0].subtitles.length, 1);
    assert.equal(streamsEp1[0].subtitles[0].url, 'https://four.pichive.online/nsub.php?v=sub_ep1&p=93');
    assert.equal(streamsEp1[0].subtitles[0].language, 'tr');

    // B. Bölüm 2 Testi: Pichive 200 döndüğünde PoW çözülüp m3u8 adresi çözümlenmeli
    const streamsEp2 = await roketdizi.getStreams('315755', 'tv', 1, 2);
    assert.equal(streamsEp2.length, 1, '200 durumunda PoW çözülmüş m3u8 yayını dönmeli');
    assert.equal(streamsEp2[0].url, 'https://four.pichive.online/hls/friend_ep2/master.m3u8?p=93');
    assert.equal(streamsEp2[0].type, 'hls');
    assert.equal(streamsEp2[0].format, 'hls', 'Bölüm 2 akışında format hls olmalıdır');
    assert.equal(streamsEp2[0].isHls, true, 'Bölüm 2 akışında isHls true olmalıdır');
    assert.equal(streamsEp2[0].subtitles.length, 1);
    assert.equal(streamsEp2[0].subtitles[0].url, 'https://four.pichive.online/sub/tr.vtt?p=93');
  } finally {
    global.fetch = originalFetch;
  }

  // C. Bundled Adapter Testi: Bundle VM içinde master HLS akışının başarıyla sources-found üretmesi
  const { provider, reports } = loadBundle(fetchMock);
  const bundledStreams = await provider.getStreams('315755', 'tv', 1, 1);
  assert.equal(bundledStreams.length, 1);
  assert.equal(bundledStreams[0].url, 'https://four.pichive.online/nm.php?v=friend_ep1_master&p=93');
  assert.equal(bundledStreams[0].type, 'hls');
  assert.equal(bundledStreams[0].format, 'hls', 'Bundle adapter nm.php format hls olmalıdır');
  assert.equal(bundledStreams[0].isHls, true, 'Bundle adapter nm.php isHls true olmalıdır');
  const lastReport = reports.map(r => {
    try { return JSON.parse(r.replace(/^\[MUM\]\s*/, '')); } catch (_) { return null; }
  }).filter(Boolean).at(-1);
  assert.equal(lastReport.status, 'sources-found');
  assert.equal(lastReport.count, 1);
});

// ── 12. QuickJS / Nuvio Runtime Compatibility (Buffer ve Node crypto Olmadan) ──

test('RoketDizi: QuickJS / Nuvio runtime compatibility without Buffer and Node crypto (CryptoJS fallback for decryptPlayer, solveNpGate and full stream extraction)', async () => {
  // A. QuickJS CryptoJS Mock (Nuvio Masaüstü JNI Bridge / CryptoJS Polyfill Simülasyonu)
  function createQuickJsCryptoJSMock() {
    function wordArrayFromBytes(bytes) {
      const words = [];
      for (let i = 0; i < bytes.length; i++) {
        words[i >>> 2] |= (bytes[i] & 0xff) << (24 - (i % 4) * 8);
      }
      return {
        words,
        sigBytes: bytes.length,
        _bytes: bytes,
        toString(enc) {
          if (enc && enc._type === 'utf8') {
            return new TextDecoder('utf-8').decode(bytes);
          }
          return bytes.toString('hex');
        }
      };
    }

    function bytesFromWordArray(wa) {
      if (wa._bytes) return wa._bytes;
      const bytes = Buffer.alloc(wa.sigBytes);
      for (let i = 0; i < wa.sigBytes; i++) {
        bytes[i] = (wa.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      }
      return bytes;
    }

    return {
      enc: {
        Hex: {
          parse: (hex) => wordArrayFromBytes(Buffer.from(hex, 'hex')),
          stringify: (wa) => bytesFromWordArray(wa).toString('hex')
        },
        Utf8: {
          _type: 'utf8',
          parse: (str) => wordArrayFromBytes(Buffer.from(str, 'utf8')),
          stringify: (wa) => new TextDecoder('utf-8').decode(bytesFromWordArray(wa))
        }
      },
      mode: { CBC: 'CBC' },
      pad: { Pkcs7: 'Pkcs7' },
      algo: { SHA512: 'SHA512' },
      PBKDF2: (password, saltWa, options) => {
        const iter = options.iterations || 1000;
        const keyLenBytes = (options.keySize || 8) * 4;
        const saltBytes = bytesFromWordArray(saltWa);
        const passBytes = typeof password === 'string' ? Buffer.from(password, 'utf8') : bytesFromWordArray(password);
        const hasher = (options.hasher && options.hasher.name) || options.hasher || 'sha512';
        const key = crypto.pbkdf2Sync(passBytes, saltBytes, iter, keyLenBytes, hasher.toString().toLowerCase());
        return wordArrayFromBytes(key);
      },
      AES: {
        decrypt: (ciphertextBase64, keyWa, options) => {
          const keyBytes = bytesFromWordArray(keyWa);
          const ivBytes = bytesFromWordArray(options.iv);
          const cipherBytes = Buffer.from(ciphertextBase64, 'base64');
          const decipher = crypto.createDecipheriv('aes-256-cbc', keyBytes, ivBytes);
          const dec = Buffer.concat([decipher.update(cipherBytes), decipher.final()]);
          return wordArrayFromBytes(dec);
        }
      },
      SHA256: (message) => {
        const msgBytes = typeof message === 'string' ? Buffer.from(message, 'utf8') : bytesFromWordArray(message);
        const hash = crypto.createHash('sha256').update(msgBytes).digest();
        return wordArrayFromBytes(hash);
      }
    };
  }

  const quickJsCrypto = createQuickJsCryptoJSMock();
  const targetUrl = 'https://four.pichive.online/iframe.php?v=matrix_quickjs_603';
  const encPayload = createEncPayload(targetUrl, 'matrix_secret_key');

  // B. Doğrudan fonksiyon testleri (globalThis.CryptoJS üzerinden deşifreleme ve PoW)
  const origCryptoJS = globalThis.CryptoJS;
  globalThis.CryptoJS = quickJsCrypto;
  try {
    // 1. decryptPlayer doğrulaması
    const decryptedUrl = roketdizi._raw.decryptPlayer(encPayload);
    assert.equal(decryptedUrl, targetUrl, 'decryptPlayer CryptoJS ile başarıyla deşifrelemeli');

    // 2. solveNpGate PoW doğrulaması
    const powResult = roketdizi._raw.solveNpGate({ n: 'testnonce_7' });
    assert.equal(powResult, '93', 'solveNpGate CryptoJS.SHA256 ile testnonce_7 çözümünü (93) bulmalı');
  } finally {
    if (origCryptoJS !== undefined) {
      globalThis.CryptoJS = origCryptoJS;
    } else {
      delete globalThis.CryptoJS;
    }
  }

  // C. QuickJS Sandbox VM Ortamında Bundle Doğrulaması (Node Buffer ve crypto KESİNLİKLE YOK)
  const matrixEnc = createEncPayload('https://four.pichive.online/iframe.php?v=matrix_player_99', 'the_matrix_key');
  const quickJsFetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/movie/603') || u.includes('api.themoviedb.org/3/find/603')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 603,
          title: 'Matrix',
          original_title: 'The Matrix',
          release_date: '1999-03-30'
        })
      };
    }
    if (u.includes('s=Matrix') || u.includes('s=The%20Matrix')) {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <div class="search-results">
            <a href="/film/the-matrix/izle" aria-label="The Matrix, 1999">The Matrix</a>
          </div>
        `
      };
    }
    if (u === 'https://roketdizi.life/film/the-matrix/izle') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <body>
              <script>
                self.__next_f.push([1,"{\\"enc\\":{\\"ciphertext\\":\\"${matrixEnc.ciphertext}\\",\\"iv\\":\\"${matrixEnc.iv}\\",\\"salt\\":\\"${matrixEnc.salt}\\"},\\"k\\":\\"${matrixEnc.k}\\"}"]);
              </script>
            </body>
          </html>
        `
      };
    }
    if (u === 'https://four.pichive.online/iframe.php?v=matrix_player_99') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <script>
              window.NP_GATE = { "n": "testnonce_7" };
              window.NP_CONFIG = {
                "file": "https://four.pichive.online/hls/matrix/master.m3u8",
                "tracks": [
                  { "file": "/sub/tr.vtt", "label": "Türkçe", "srclang": "tr" }
                ]
              };
            </script>
          </html>
        `
      };
    }
    throw new Error('Unexpected URL in QuickJS sandbox: ' + u);
  };

  // Nuvio QuickJS simülasyonu: Buffer ve Node crypto YOK!
  const reports = [];
  const quickJsContext = vm.createContext({
    module: { exports: {} },
    console: {
      info: r => reports.push(r),
      log: () => {},
      warn: () => {},
      error: () => {}
    },
    fetch: quickJsFetchMock,
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
    CryptoJS: quickJsCrypto,
    require: name => {
      if (['cheerio', 'cheerio-without-node-native', 'react-native-cheerio'].includes(name)) {
        return require('cheerio-without-node-native');
      }
      if (name === 'crypto-js') return quickJsCrypto;
      if (name === 'crypto') throw Error("Module 'crypto' is not available in QuickJS");
      throw Error('Unavailable runtime module in QuickJS: ' + name);
    }
  });
  quickJsContext.globalThis = quickJsContext;

  const scraper = manifest.scrapers.find(s => s.id === 'mum_roketdizi');
  assert.ok(scraper, 'mum_roketdizi scraper bulunmalı');
  const bundleCode = fs.readFileSync(scraper.filename, 'utf8');
  vm.runInContext('(function(){\n' + bundleCode + '\n})();', quickJsContext, { timeout: 2000 });

  const quickJsProvider = quickJsContext.module.exports;
  const streams = await quickJsProvider.getStreams('603', 'movie');

  assert.ok(Array.isArray(streams), 'Streams bir dizi olmalı');
  assert.equal(streams.length, 1, 'Matrix için 1 adet HLS akışı bulunmalı');
  assert.equal(streams[0].url, 'https://four.pichive.online/hls/matrix/master.m3u8?p=93', 'PoW çözülmüş p=93 parametreli akış dönmeli');
  assert.equal(streams[0].type, 'hls');
  assert.equal(streams[0].format, 'hls', 'QuickJS akışında format hls olmalıdır');
  assert.equal(streams[0].isHls, true, 'QuickJS akışında isHls true olmalıdır');
  assert.equal(streams[0].provider, 'roketdizi');

  const lastReport = reports.map(r => {
    try { return JSON.parse(r.replace(/^\[MUM\]\s*/, '')); } catch (_) { return null; }
  }).filter(Boolean).at(-1);
  assert.ok(lastReport, 'Adapter en az bir rapor üretmelidir');
  assert.equal(lastReport.status, 'sources-found');
  assert.equal(lastReport.count, 1);
});

// ── 13. TV Dizisi Mother, May I Murder? (TMDB 231824) Pichive Master HLS Çözümlemesi ──

test('RoketDizi: TV series Mother, May I Murder? (TMDB 231824) resolves master HLS with PoW solution and subtitles', async () => {
  const encMother = createEncPayload('https://four.pichive.online/iframe.php?v=79f07771eb20efa14a7438814fe82b9c', 'mother_secret_key');

  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/tv/231824') || u.includes('api.themoviedb.org/3/find/231824')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 231824,
          name: 'Mother, May I Murder?',
          original_name: 'Mother, May I Murder?',
          first_air_date: '2023-07-31'
        })
      };
    }
    if (u.includes('/arama-yap?s=')) {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <div class="search-results">
            <a href="/dizi/mother-may-i-murder" aria-label="Mother, May I Murder?, 2023">Mother, May I Murder?</a>
          </div>
        `
      };
    }
    if (u === 'https://roketdizi.life/dizi/mother-may-i-murder/sezon-1/bolum-1') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <body>
              <script>
                self.__next_f.push([1,"{\\"sources\\":[{\\"label\\":\\"RoketTV · Türkçe Altyazı\\",\\"quality\\":\\"1080P\\",\\"href\\":\\"/dizi/mother-may-i-murder/sezon-1/bolum-1\\",\\"on\\":true,\\"dub\\":false}],\\"enc\\":{\\"ciphertext\\":\\"${encMother.ciphertext}\\",\\"iv\\":\\"${encMother.iv}\\",\\"salt\\":\\"${encMother.salt}\\"},\\"k\\":\\"${encMother.k}\\"}"]);
              </script>
            </body>
          </html>
        `
      };
    }
    if (u === 'https://four.pichive.online/iframe.php?v=79f07771eb20efa14a7438814fe82b9c') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <script>
              window.NP_GATE = function(_kq, _uvu) {};
              window.NP_CONFIG = {
                "gate": { "n": "testnonce_7", "b": 12 },
                "sources": [
                  { "title": "Orijinal", "kind": "orig", "master": "https://four.pichive.online/nm.php?v=mother_master_m3u8" }
                ],
                "subtitles": [
                  { "label": "Türkçe", "lang": "tr", "forced": false, "url": "https://four.pichive.online/nsub.php?v=sub_tr" },
                  { "label": "İngilizce", "lang": "en", "forced": false, "url": "https://four.pichive.online/nsub.php?v=sub_en" }
                ]
              };
            </script>
          </html>
        `
      };
    }
    throw new Error('Unexpected URL in Test 13: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;

  try {
    const streams = await roketdizi.getStreams('231824', 'tv', 1, 1);
    assert.ok(Array.isArray(streams));
    assert.equal(streams.length, 1);
    assert.equal(streams[0].url, 'https://four.pichive.online/nm.php?v=mother_master_m3u8&p=93');
    assert.equal(streams[0].type, 'hls');
    assert.equal(streams[0].format, 'hls', 'Mother nm.php format hls olmalıdır');
    assert.equal(streams[0].isHls, true, 'Mother nm.php isHls true olmalıdır');
    assert.equal(streams[0].subtitles.length, 2);
    assert.equal(streams[0].subtitles[0].language, 'tr');
    assert.equal(streams[0].subtitles[0].url, 'https://four.pichive.online/nsub.php?v=sub_tr&p=93');
    assert.equal(streams[0].subtitles[1].language, 'en');
    assert.equal(streams[0].subtitles[1].url, 'https://four.pichive.online/nsub.php?v=sub_en&p=93');
    assert.equal(streams[0].headers.Origin, 'https://four.pichive.online', 'Stream headers must contain Origin');
    assert.equal(streams[0].behaviorHints.proxyHeaders.request.Origin, 'https://four.pichive.online', 'Proxy headers must contain Origin');
    assert.equal(streams[0].subtitles[0].headers.Origin, 'https://four.pichive.online', 'Subtitle headers must contain Origin');
  } finally {
    global.fetch = originalFetch;
  }
});

// ── 14. Canlı Pichive Dinamik NP_GATE Fonksiyon Çözümü ve Origin Header Doğrulaması ──

test('RoketDizi: Live Pichive dynamic window.NP_GATE PoW execution and Origin header', async () => {
  const encLive = createEncPayload('https://four.pichive.online/iframe.php?v=live_pichive_test', 'live_secret');

  const liveHtml = `
    <html>
      <head>
        <script>
          window.NP_GATE = function(_ku,_nqi){var _wmmd=String.fromCharCode(45,116,72,55,82,88,103,87,73,55);for(var _xd=0;_xd<1e8;_xd++){var _eld=_xd.toString(10);if((_nqi(_ku+_wmmd+_eld+_wmmd)[0]&4095)===0)return _eld;}return "";};
          window.NP_CONFIG = {
            "gate": { "n": "eEuUmYcdkQWF", "b": 12 },
            "sources": [
              { "master": "https://four.pichive.online/nm.php?v=master_token_live" }
            ],
            "subtitles": [
              { "label": "Türkçe", "lang": "tr", "url": "https://four.pichive.online/nsub.php?v=sub_tr" }
            ]
          };
        </script>
      </head>
    </html>
  `;

  // solveNpGate doğrudan canlı HTML ile test
  const sol = roketdizi._raw.solveNpGate({ n: 'eEuUmYcdkQWF', b: 12 }, liveHtml);
  assert.equal(sol, '5024', 'Live Pichive dynamic NP_GATE function must resolve to 5024');

  const fetchMock = async (url) => {
    const u = String(url);
    if (u.includes('api.themoviedb.org/3/movie/12345')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          title: 'Live Test Movie',
          release_date: '2024-01-01'
        })
      };
    }
    if (u.includes('/film-izle?s=')) {
      return {
        ok: true,
        status: 200,
        text: async () => `<a href="/film/live-test/izle" aria-label="Live Test Movie, 2024">Live Test Movie</a>`
      };
    }
    if (u === 'https://roketdizi.life/film/live-test/izle') {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <script>
            self.__next_f.push([1,"{\\"enc\\":{\\"ciphertext\\":\\"${encLive.ciphertext}\\",\\"iv\\":\\"${encLive.iv}\\",\\"salt\\":\\"${encLive.salt}\\"},\\"k\\":\\"${encLive.k}\\"}"]);
          </script>
        `
      };
    }
    if (u === 'https://four.pichive.online/iframe.php?v=live_pichive_test') {
      return {
        ok: true,
        status: 200,
        text: async () => liveHtml
      };
    }
    throw new Error('Unexpected URL: ' + u);
  };

  const originalFetch = global.fetch;
  global.fetch = fetchMock;

  try {
    const streams = await roketdizi.getStreams('12345', 'movie');
    assert.equal(streams.length, 1);
    assert.equal(streams[0].url, 'https://four.pichive.online/nm.php?v=master_token_live&p=5024', 'Stream URL must include live solved p=5024');
    assert.equal(streams[0].format, 'hls');
    assert.equal(streams[0].isHls, true);
    assert.equal(streams[0].headers.Origin, 'https://four.pichive.online');
    assert.equal(streams[0].headers.Referer, 'https://four.pichive.online/iframe.php?v=live_pichive_test');
    assert.equal(streams[0].behaviorHints.proxyHeaders.request.Origin, 'https://four.pichive.online');
    assert.equal(streams[0].subtitles[0].url, 'https://four.pichive.online/nsub.php?v=sub_tr&p=5024');
    assert.equal(streams[0].subtitles[0].headers.Origin, 'https://four.pichive.online');
  } finally {
    global.fetch = originalFetch;
  }
});
