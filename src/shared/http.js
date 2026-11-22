/**
 * Common HTTP utilities for Nuvio Providers
 * Handles timeout signals, signal combination, browser User-Agents, safe fetches,
 * shared in-memory TMDB cache (LRU + TTL), and signal-isolated in-flight request deduplication.
 */

var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function timeoutSignal(ms) {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(ms);
    }
    var controller = new AbortController();
    setTimeout(function () {
        controller.abort(new Error('TIMEOUT'));
    }, ms);
    return controller.signal;
}

function combineSignals(signals) {
    var valid = [];
    for (var i = 0; i < (signals || []).length; i++) {
        if (signals[i]) valid.push(signals[i]);
    }
    if (valid.length === 0) return null;
    if (valid.length === 1) return valid[0];

    // Check if any signal is already aborted
    for (var j = 0; j < valid.length; j++) {
        if (valid[j].aborted) {
            return valid[j];
        }
    }

    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
        return AbortSignal.any(valid);
    }

    var controller = new AbortController();
    function onAbort() {
        controller.abort(this ? this.reason : undefined);
        for (var k = 0; k < valid.length; k++) {
            try { valid[k].removeEventListener('abort', onAbort); } catch (_) {}
        }
    }

    for (var m = 0; m < valid.length; m++) {
        valid[m].addEventListener('abort', onAbort, { once: true });
    }

    return controller.signal;
}

function fetchWithTimeout(url, options, ms) {
    ms = ms || 8000;
    options = options || {};
    var timeoutSig = timeoutSignal(ms);
    if (options.signal) {
        options.signal = combineSignals([options.signal, timeoutSig]);
    } else {
        options.signal = timeoutSig;
    }
    if (!options.headers) {
        options.headers = {};
    }
    if (!options.headers['User-Agent'] && !options.headers['user-agent']) {
        options.headers['User-Agent'] = DEFAULT_UA;
    }
    return fetch(url, options);
}

// ── Shared TMDB In-Memory Cache & In-Flight Registry ──────────────────

var MAX_CACHE_SIZE = 500;
var DEFAULT_TTL_MS = 3600000; // 1 hour TTL

function createTmdbCache() {
    var store = new Map();

    var cacheObj = {
        get: function(key) {
            if (!store.has(key)) return undefined;
            var entry = store.get(key);
            if (Date.now() > entry.expiresAt) {
                store.delete(key);
                return undefined;
            }
            // LRU: re-insert
            store.delete(key);
            store.set(key, entry);
            return entry.value;
        },
        set: function(key, value, ttlMs) {
            if (store.size >= MAX_CACHE_SIZE && !store.has(key)) {
                var firstKey = store.keys().next().value;
                if (firstKey !== undefined) store.delete(firstKey);
            }
            var expiresAt = Date.now() + (typeof ttlMs === 'number' && ttlMs > 0 ? ttlMs : DEFAULT_TTL_MS);
            if (store.has(key)) store.delete(key);
            store.set(key, { value: value, expiresAt: expiresAt });
            return this;
        },
        has: function(key) {
            if (!store.has(key)) return false;
            var entry = store.get(key);
            if (Date.now() > entry.expiresAt) {
                store.delete(key);
                return false;
            }
            return true;
        },
        delete: function(key) {
            return store.delete(key);
        },
        clear: function() {
            store.clear();
        },
        get size() {
            return store.size;
        }
    };

    if (typeof Proxy !== 'undefined') {
        return new Proxy(cacheObj, {
            get: function(target, prop) {
                if (typeof prop === 'string' && prop in target) {
                    var member = target[prop];
                    if (typeof member === 'function') return member.bind(target);
                    return member;
                }
                if (typeof prop === 'symbol') return target[prop];
                return target.get(prop);
            },
            set: function(target, prop, value) {
                if (typeof prop === 'symbol' || prop in target) {
                    target[prop] = value;
                    return true;
                }
                target.set(prop, value);
                return true;
            }
        });
    }
    return cacheObj;
}

var _g = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this));
if (!_g.__MUM_TMDB_CACHE__) {
    _g.__MUM_TMDB_CACHE__ = createTmdbCache();
}
var tmdb_cache = _g.__MUM_TMDB_CACHE__;

if (!_g.__MUM_TMDB_IN_FLIGHT__) {
    _g.__MUM_TMDB_IN_FLIGHT__ = new Map();
}
var in_flight_tmdb = _g.__MUM_TMDB_IN_FLIGHT__;

function makeTmdbCacheKey(mediaType, cleanId, language) {
    var type = (mediaType === 'tv' || mediaType === 'series') ? 'tv' : 'movie';
    var id = String(cleanId || '').trim().replace(/^(?:movie|tv|series|tmdb|imdb):+/i, '');
    if (id.includes(':')) id = id.split(':')[0];
    var lang = String(language || 'tr-TR').trim().toLowerCase();
    return type + ':' + id + ':' + lang;
}

function getCachedTmdb(mediaType, cleanId, language) {
    var key = makeTmdbCacheKey(mediaType, cleanId, language);
    return tmdb_cache.get(key);
}

function setCachedTmdb(mediaType, cleanId, data, language, ttlMs) {
    var key = makeTmdbCacheKey(mediaType, cleanId, language);
    tmdb_cache.set(key, data, ttlMs);
}

async function resolveTmdbMeta(id, mediaType, options) {
    options = options || {};
    var rawId = (typeof id === 'object' && id && id.id) ? id.id : id;
    if (typeof id === 'object' && id) {
        if (!mediaType && id.type) mediaType = id.type;
        if (!options.signal && id.signal) options.signal = id.signal;
    }
    var cleanId = String(rawId || '').trim().replace(/^(?:movie|tv|series|tmdb|imdb):+/i, '');
    if (cleanId.includes(':')) cleanId = cleanId.split(':')[0];
    if (!cleanId) return null;

    var isTv = (mediaType === 'tv' || mediaType === 'series');
    var type = isTv ? 'tv' : 'movie';
    var isImdb = cleanId.startsWith('tt');
    var lang = (options.language || 'tr-TR').trim().toLowerCase();
    var apiKey = options.apiKey || '500330721680edb6d5f7f12ba7cd9023';
    var timeoutMs = options.timeoutMs || 8000;
    var callerSignal = options.signal;

    if (callerSignal && callerSignal.aborted) {
        var errAbort = new Error('The operation was aborted');
        errAbort.name = 'AbortError';
        throw errAbort;
    }

    var cacheKey = makeTmdbCacheKey(type, cleanId, lang);

    // 1. In-memory Cache check
    var cached = tmdb_cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // 2. Check in-flight table with signal isolation & reference counting
    var inFlightEntry = in_flight_tmdb.get(cacheKey);
    var subscriberToken = { signal: callerSignal };

    if (!inFlightEntry) {
        var abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var subscribers = new Set();
        subscribers.add(subscriberToken);

        var sharedPromise = (async function() {
            try {
                var title = '';
                var origTitle = '';
                var year = '';
                var imdbId = isImdb ? cleanId : '';
                var numericId = isImdb ? null : (parseInt(cleanId, 10) || null);
                var originCountries = [];
                var origLanguage = '';

                var fetchSignal = abortController ? abortController.signal : null;

                if (isImdb) {
                    var findRes = await fetchWithTimeout(
                        'https://api.themoviedb.org/3/find/' + cleanId + '?api_key=' + apiKey + '&external_source=imdb_id&language=' + lang,
                        { signal: fetchSignal },
                        timeoutMs
                    );
                    if (findRes.ok) {
                        var fData = await findRes.json();
                        var match = isTv
                            ? (fData.tv_results && fData.tv_results[0])
                            : (fData.movie_results && fData.movie_results[0]);
                        if (!match) match = (fData.movie_results && fData.movie_results[0]) || (fData.tv_results && fData.tv_results[0]) || ((fData.title || fData.name) && fData);
                        if (match) {
                            numericId = match.id || null;
                            title = match.name || match.title || '';
                            origTitle = match.original_name || match.original_title || '';
                            var dStr = match.first_air_date || match.release_date || '';
                            if (dStr) year = dStr.slice(0, 4);
                            if (Array.isArray(match.origin_country)) originCountries = match.origin_country;
                            if (match.original_language) origLanguage = match.original_language;
                        }
                    }
                }

                var needsDetails = !title || !origTitle || (isTv && originCountries.length === 0);
                if (numericId && needsDetails) {
                    var detailsRes = await fetchWithTimeout(
                        'https://api.themoviedb.org/3/' + type + '/' + numericId + '?api_key=' + apiKey + '&language=' + lang + '&append_to_response=external_ids',
                        { signal: fetchSignal },
                        timeoutMs
                    );
                    if (detailsRes.ok) {
                        var dData = await detailsRes.json();
                        title = dData.name || dData.title || title;
                        origTitle = dData.original_name || dData.original_title || origTitle;
                        var dStr2 = dData.first_air_date || dData.release_date || '';
                        if (dStr2 && !year) year = dStr2.slice(0, 4);
                        if (Array.isArray(dData.origin_country) && dData.origin_country.length > 0) {
                            originCountries = dData.origin_country;
                        } else if (Array.isArray(dData.production_countries) && dData.production_countries.length > 0) {
                            originCountries = dData.production_countries.map(function(p) { return p.iso_3166_1; }).filter(Boolean);
                        }
                        if (dData.original_language) origLanguage = dData.original_language;
                        if (!imdbId && dData.external_ids && dData.external_ids.imdb_id) {
                            imdbId = dData.external_ids.imdb_id;
                        } else if (!imdbId && dData.imdb_id) {
                            imdbId = dData.imdb_id;
                        }
                    }
                }

                var result = {
                    title: title,
                    origTitle: origTitle,
                    titleTr: title,
                    titleEn: origTitle,
                    year: year,
                    imdbId: imdbId || (isImdb ? cleanId : ''),
                    numericId: numericId,
                    originCountries: originCountries,
                    origLanguage: origLanguage
                };

                // DO NOT cache failed or empty responses. Only cache when valid title metadata was resolved!
                var isValidMeta = Boolean(result.title || result.origTitle);
                if (isValidMeta) {
                    tmdb_cache.set(cacheKey, result);
                    if (numericId) {
                        var numKey = makeTmdbCacheKey(type, numericId, lang);
                        if (numKey !== cacheKey) tmdb_cache.set(numKey, result);
                    }
                    if (imdbId) {
                        var imdbKey = makeTmdbCacheKey(type, imdbId, lang);
                        if (imdbKey !== cacheKey) tmdb_cache.set(imdbKey, result);
                    }
                }

                return result;
            } finally {
                in_flight_tmdb.delete(cacheKey);
            }
        })();

        inFlightEntry = {
            promise: sharedPromise,
            subscribers: subscribers,
            abortController: abortController
        };
        in_flight_tmdb.set(cacheKey, inFlightEntry);
    } else {
        inFlightEntry.subscribers.add(subscriberToken);
    }

    // 3. Connect caller signal with reference-counted abort isolation
    if (!callerSignal) {
        return inFlightEntry.promise.finally(function() {
            inFlightEntry.subscribers.delete(subscriberToken);
        });
    }

    return new Promise(function(resolve, reject) {
        var onAbort = function() {
            inFlightEntry.subscribers.delete(subscriberToken);
            if (inFlightEntry.subscribers.size === 0 && inFlightEntry.abortController) {
                try {
                    inFlightEntry.abortController.abort(callerSignal.reason || new Error('The operation was aborted'));
                } catch (_) {}
            }
            var err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
        };

        if (callerSignal.aborted) {
            return onAbort();
        }

        callerSignal.addEventListener('abort', onAbort, { once: true });
        inFlightEntry.promise.then(
            function(val) {
                try { callerSignal.removeEventListener('abort', onAbort); } catch (_) {}
                inFlightEntry.subscribers.delete(subscriberToken);
                resolve(val);
            },
            function(err) {
                try { callerSignal.removeEventListener('abort', onAbort); } catch (_) {}
                inFlightEntry.subscribers.delete(subscriberToken);
                reject(err);
            }
        );
    });
}

module.exports = {
    DEFAULT_UA: DEFAULT_UA,
    timeoutSignal: timeoutSignal,
    combineSignals: combineSignals,
    fetchWithTimeout: fetchWithTimeout,
    tmdb_cache: tmdb_cache,
    in_flight_tmdb: in_flight_tmdb,
    makeTmdbCacheKey: makeTmdbCacheKey,
    getCachedTmdb: getCachedTmdb,
    setCachedTmdb: setCachedTmdb,
    resolveTmdbMeta: resolveTmdbMeta
};
