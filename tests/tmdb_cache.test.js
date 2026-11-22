const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    tmdb_cache,
    in_flight_tmdb,
    makeTmdbCacheKey,
    getCachedTmdb,
    setCachedTmdb,
    resolveTmdbMeta
} = require('../src/shared/http.js');

test('tmdb_cache: compound key formatting and property access', () => {
    const key = makeTmdbCacheKey('movie', 'tt0137523', 'tr-TR');
    assert.equal(key, 'movie:tt0137523:tr-tr');

    const sample = { title: 'Dövüş Kulübü', year: '1999', imdbId: 'tt0137523' };
    tmdb_cache.set(key, sample);

    // Both get method and property indexing work
    assert.deepEqual(tmdb_cache.get(key), sample);
    assert.deepEqual(tmdb_cache[key], sample);
    assert.equal(tmdb_cache.has(key), true);

    tmdb_cache.delete(key);
    assert.equal(tmdb_cache.has(key), false);
    assert.equal(tmdb_cache.get(key), undefined);
});

test('tmdb_cache: TTL expiration removes stale entries', async () => {
    const key = 'movie:test_ttl:tr-tr';
    // set with 15ms TTL
    tmdb_cache.set(key, { title: 'Expiring' }, 15);
    assert.equal(tmdb_cache.has(key), true);

    await new Promise(r => setTimeout(r, 25));
    assert.equal(tmdb_cache.has(key), false);
    assert.equal(tmdb_cache.get(key), undefined);
});

test('resolveTmdbMeta: in-flight promise deduplication merges concurrent requests', async () => {
    let networkCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
        networkCalls++;
        await new Promise(r => setTimeout(r, 40));
        return {
            ok: true,
            status: 200,
            json: async () => ({
                id: 99999,
                title: 'Concurrent Test',
                release_date: '2025-01-01',
                external_ids: { imdb_id: 'tt9999999' }
            })
        };
    };

    try {
        const testId = '99999';
        // Run 4 concurrent requests at the exact same millisecond
        const [res1, res2, res3, res4] = await Promise.all([
            resolveTmdbMeta(testId, 'movie', { language: 'tr-TR' }),
            resolveTmdbMeta(testId, 'movie', { language: 'tr-TR' }),
            resolveTmdbMeta(testId, 'movie', { language: 'tr-TR' }),
            resolveTmdbMeta(testId, 'movie', { language: 'tr-TR' })
        ]);

        assert.equal(res1.title, 'Concurrent Test');
        assert.equal(res2.title, 'Concurrent Test');
        assert.equal(res3.title, 'Concurrent Test');
        assert.equal(res4.title, 'Concurrent Test');

        // Only 1 network fetch should have been performed
        assert.equal(networkCalls, 1, 'Concurrent requests must be deduplicated into 1 network call');

        // Subsequent call must hit cache immediately with 0 additional network calls
        const resCached = await resolveTmdbMeta(testId, 'movie', { language: 'tr-TR' });
        assert.equal(resCached.title, 'Concurrent Test');
        assert.equal(networkCalls, 1, 'Cache hit must not produce network calls');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('resolveTmdbMeta: caller signal cancellation does not abort shared background fetch', async () => {
    let networkCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
        networkCalls++;
        await new Promise(r => setTimeout(r, 60));
        return {
            ok: true,
            status: 200,
            json: async () => ({
                id: 88888,
                title: 'Signal Isolation Test',
                release_date: '2024-05-10',
                external_ids: { imdb_id: 'tt8888888' }
            })
        };
    };

    try {
        const testId = '88888';
        const controllerA = new AbortController();
        const controllerB = new AbortController();

        // Caller A and Caller B call concurrently
        const promiseA = resolveTmdbMeta(testId, 'movie', { signal: controllerA.signal });
        const promiseB = resolveTmdbMeta(testId, 'movie', { signal: controllerB.signal });

        // Abort Caller A after 15ms (before fetch finishes at 60ms)
        setTimeout(() => {
            controllerA.abort(new Error('Caller A timed out'));
        }, 15);

        // Caller A must reject with AbortError
        await assert.rejects(promiseA, (err) => {
            return err && (err.name === 'AbortError' || err.message.includes('aborted'));
        });

        // Caller B must SUCCEED with data! Caller A's abort did not kill the underlying shared task
        const resB = await promiseB;
        assert.equal(resB.title, 'Signal Isolation Test');
        assert.equal(resB.imdbId, 'tt8888888');

        // Subsequent caller C also gets cached result
        const resC = await resolveTmdbMeta(testId, 'movie');
        assert.equal(resC.title, 'Signal Isolation Test');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('resolveTmdbMeta: signal-less caller remains active when concurrent signaled caller aborts', async () => {
    let networkCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
        networkCalls++;
        await new Promise(r => setTimeout(r, 60));
        return {
            ok: true,
            status: 200,
            json: async () => ({
                id: 77777,
                title: 'Signal-less Caller Test',
                release_date: '2024-01-01',
                external_ids: { imdb_id: 'tt7777777' }
            })
        };
    };

    try {
        const testId = '77777';
        const controllerSignaled = new AbortController();

        // Caller 1 has NO signal, Caller 2 HAS signal
        const promiseNoSignal = resolveTmdbMeta(testId, 'movie');
        const promiseWithSignal = resolveTmdbMeta(testId, 'movie', { signal: controllerSignaled.signal });

        // Abort Caller 2 after 15ms
        setTimeout(() => {
            controllerSignaled.abort(new Error('Caller 2 timed out'));
        }, 15);

        // Caller 2 must reject
        await assert.rejects(promiseWithSignal, (err) => {
            return err && (err.name === 'AbortError' || err.message.includes('aborted'));
        });

        // Caller 1 (WITHOUT signal) MUST SUCCEED! It must not be aborted by Caller 2
        const res1 = await promiseNoSignal;
        assert.equal(res1.title, 'Signal-less Caller Test');
        assert.equal(res1.imdbId, 'tt7777777');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('resolveTmdbMeta: transient network failure or empty response is NEVER cached', async () => {
    let networkCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
        networkCalls++;
        // Simulate a 500 error / failed network call
        return {
            ok: false,
            status: 500,
            json: async () => ({ status_message: 'Internal server error' })
        };
    };

    const failId = '66666';
    const cacheKey = makeTmdbCacheKey('movie', failId, 'tr-TR');

    try {
        const failedRes = await resolveTmdbMeta(failId, 'movie');
        assert.equal(failedRes.title, '');

        // Verify that the failed empty metadata is NOT in the cache
        assert.equal(tmdb_cache.has(cacheKey), false, 'Failed metadata must not enter the 1-hour cache');
        assert.equal(tmdb_cache.get(cacheKey), undefined);

        // A second call should retry the network (networkCalls becomes 2)
        await resolveTmdbMeta(failId, 'movie');
        assert.equal(networkCalls, 2, 'Subsequent call must retry network instead of returning cached failure');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('in_flight_tmdb and tmdb_cache are attached to globalThis', () => {
    assert.ok(globalThis.__MUM_TMDB_CACHE__, 'globalThis.__MUM_TMDB_CACHE__ must exist');
    assert.ok(globalThis.__MUM_TMDB_IN_FLIGHT__, 'globalThis.__MUM_TMDB_IN_FLIGHT__ must exist');
});
