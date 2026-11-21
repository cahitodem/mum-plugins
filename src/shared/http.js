/**
 * Common HTTP utilities for Nuvio Providers
 * Handles timeout signals, signal combination, browser User-Agents, and safe fetches.
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

module.exports = {
    DEFAULT_UA: DEFAULT_UA,
    timeoutSignal: timeoutSignal,
    combineSignals: combineSignals,
    fetchWithTimeout: fetchWithTimeout
};
