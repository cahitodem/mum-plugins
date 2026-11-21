const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const manifest = require('../manifest.json');
const sources = require('../sources.json').sources;

function load(scraper, customFetch) {
  const reports = [];
  const context = vm.createContext({
    module: { exports: {} },
    console: {
      info: r => {
        reports.push(r);
      },
      log: () => {},
      warn: () => {},
      error: () => {}
    },
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
      throw Error('Unavailable runtime module: ' + name);
    }
  });
  const code = fs.readFileSync(scraper.filename, 'utf8');
  vm.runInContext('(function(){' + code + '\n})();', context, { timeout: 2000 });
  return { context, reports, provider: context.module.exports };
}

for (const scraper of manifest.scrapers) {
  const source = sources.find(s => s.id === scraper.id);

  test(`${scraper.id} cancels in-flight fetch and reports timeout on adapter timeout`, async () => {
    const interceptedSignals = [];
    let fetchAbortedCount = 0;

    const mockFetch = (url, options = {}) => {
      const sig = options && options.signal;
      if (sig) {
        interceptedSignals.push(sig);
        if (sig.aborted) {
          fetchAbortedCount++;
        } else if (sig.addEventListener) {
          sig.addEventListener('abort', () => {
            fetchAbortedCount++;
          }, { once: true });
        }
      }

      // Simulate a network delay that exceeds the adapter's timeout (50ms vs 20ms timeout)
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: async () => ({ results: [], tv_results: [], movie_results: [] }),
            text: async () => ''
          });
        }, 100);

        if (sig && sig.addEventListener) {
          sig.addEventListener('abort', () => {
            clearTimeout(timer);
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          }, { once: true });
        }
      });
    };

    const { provider, reports } = load(scraper, mockFetch);

    // Call the adapted provider with timeoutMs: 25
    const mediaType = (source && source.supportedTypes && !source.supportedTypes.includes('movie')) ? 'tv' : (source.key === 'diziyou' ? 'tv' : 'movie');
    const season = mediaType === 'tv' ? 1 : undefined;
    const episode = mediaType === 'tv' ? 1 : undefined;

    const result = await provider.getStreams('12345', mediaType, season, episode, { timeoutMs: 25 });

    assert.equal(result.length, 0, `${scraper.id} must return empty array on timeout`);
    assert.ok(interceptedSignals.length > 0, `${scraper.id} should make at least one fetch with signal`);
    
    // Give event loop a tick for abort handlers to execute
    await new Promise(r => setTimeout(r, 10));

    assert.ok(interceptedSignals.every(s => s.aborted), `All intercepted signals in ${scraper.id} must be aborted`);
    assert.ok(fetchAbortedCount > 0, `Underlying fetch abort listener in ${scraper.id} must fire`);

    const parsedReports = reports.map(r => {
      try { return JSON.parse(r.replace(/^\[MUM\]\s*/, '')); } catch (_) { return null; }
    }).filter(Boolean);

    const lastReport = parsedReports.at(-1);
    assert.ok(lastReport, `${scraper.id} must emit at least one adapter report`);
    assert.equal(lastReport.status, 'timeout', `Expected status timeout but got ${lastReport.status}`);
  });
}
