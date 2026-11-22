/* MUM Plugins 0.1.2; modified 2026-11-21; derived from Anthology 1.8.39. GPL-3.0-only. */
// Suppress provider logs which may contain signed URLs.
var console = {log:function(){},info:function(){},warn:function(){},error:function(){},debug:function(){}};
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/shared/quality.js
var require_quality = __commonJS({
  "src/shared/quality.js"(exports2, module2) {
    function getQualityScore(s) {
      if (!s) return 0;
      if (!s.url) return 1;
      var q = ((s.quality || "") + " " + (s.title || "") + " " + (s.name || "")).toLowerCase();
      var score = 0;
      if (/\b(4k|2160p?|uhd)\b/.test(q)) score = 2160;
      else if (/\b(2k|1440p?|qhd)\b/.test(q)) score = 1440;
      else if (/\b(1080p?|fhd)\b/.test(q)) score = 1080;
      else if (/\b(720p?|hd)\b/.test(q)) score = 720;
      else if (/\b(540p?)\b/.test(q)) score = 540;
      else if (/\b(480p?|sd)\b/.test(q)) score = 480;
      else if (/\b(360p?)\b/.test(q)) score = 360;
      else if (/\b(240p?)\b/.test(q)) score = 240;
      if (score === 0 && s.title) {
        var text = s.title.toLowerCase();
        if (/\b(4k|2160p|uhd)\b/.test(text)) score = 2160;
        else if (/\b(2k|1440p|qhd)\b/.test(text)) score = 1440;
        else if (/\b(1080p|fhd)\b/.test(text)) score = 1080;
        else if (/\b(720p|hd)\b/.test(text)) score = 720;
        else if (/\b(480p|sd)\b/.test(text)) score = 480;
        else if (/\b(360p)\b/.test(text)) score = 360;
        else if (/\b(240p)\b/.test(text)) score = 240;
      }
      if (score === 0 && s.url) {
        var u = s.url.toLowerCase();
        if (/[\/_.-](2160p?|4k)[\/_.-]/.test(u)) score = 2160;
        else if (/[\/_.-](1440p?|2k)[\/_.-]/.test(u)) score = 1440;
        else if (/[\/_.-](1080p?|fhd)[\/_.-]/.test(u)) score = 1080;
        else if (/[\/_.-](720p?|hd)[\/_.-]/.test(u)) score = 720;
        else if (/[\/_.-](480p?|sd)[\/_.-]/.test(u)) score = 480;
        else if (/[\/_.-](360p?)[\/_.-]/.test(u)) score = 360;
      }
      var isDirectMp4 = s.format === "mp4" || s.type === "mp4" || !s.isHls && s.url && (s.url.endsWith(".mp4") || s.url.includes(".mp4?"));
      if (isDirectMp4 && score > 0) score += 1;
      return score;
    }
    function sortStreamsByQuality(streams) {
      if (!Array.isArray(streams) || streams.length === 0) return streams;
      return streams.slice().sort(function(a, b) {
        return getQualityScore(b) - getQualityScore(a);
      });
    }
    function getResolutionScore(s) {
      var score = getQualityScore(s);
      return score % 2 === 1 ? score - 1 : score;
    }
    function getLanguageGroup(s) {
      if (!s) return "default";
      var text = ((s.title || "") + " " + (s.name || "")).toLowerCase();
      if (text.includes("dublaj") || text.includes("\u{1F1F9}\u{1F1F7}")) return "dublaj";
      if (text.includes("altyaz\u0131") || text.includes("altyazi") || text.includes("sub") || text.includes("\u{1F310}")) return "altyazi";
      return "default";
    }
    function filterHighestQuality(streams) {
      if (!Array.isArray(streams) || streams.length <= 1) return streams;
      var groups = /* @__PURE__ */ Object.create(null);
      for (var i = 0; i < streams.length; i++) {
        var s = streams[i];
        var grp = getLanguageGroup(s);
        if (!groups[grp]) groups[grp] = [];
        groups[grp].push(s);
      }
      var result = [];
      var groupKeys = Object.keys(groups);
      for (var k = 0; k < groupKeys.length; k++) {
        var grpStreams = groups[groupKeys[k]];
        var maxRes = 0;
        for (var j = 0; j < grpStreams.length; j++) {
          var res = getResolutionScore(grpStreams[j]);
          if (res > maxRes) maxRes = res;
        }
        if (maxRes === 0) {
          result = result.concat(grpStreams);
        } else {
          for (var j = 0; j < grpStreams.length; j++) {
            if (getResolutionScore(grpStreams[j]) >= maxRes) {
              result.push(grpStreams[j]);
            }
          }
        }
      }
      return result;
    }
    module2.exports = {
      getQualityScore,
      getResolutionScore,
      filterHighestQuality,
      sortStreamsByQuality
    };
  }
});

// config.json
var require_config = __commonJS({
  "config.json"(exports2, module2) {
    module2.exports = {
      name: "MUM Plugins",
      version: "0.1.2",
      urls: {
        m3u: {
          film_base: "https://raw.githubusercontent.com/mooncrown04/m3ubirlestir/main/nuvio_parcalari/",
          dizi_base: "https://raw.githubusercontent.com/mooncrown04/m3ubirlestir/main/nuvio_dizi_parcalari/",
          film_full: "https://raw.githubusercontent.com/mooncrown04/m3ubirlestir/main/birlesik_sinema.m3u",
          dizi_full: "https://raw.githubusercontent.com/mooncrown04/m3ubirlestir/main/birlesik_diziler.m3u"
        },
        series: {
          diziyou: {
            base: "https://www.diziyou.love",
            storage: "https://storage.diziyou.love"
          },
          sezonlukdizi: {
            base: "https://sezonlukdizi.cc"
          },
          yabancidizi: {
            base: "https://yabancidizi.news"
          },
          belgeselx: {
            base: "https://belgeselx.com"
          }
        },
        movies: {
          hdfilmdelisi: {
            base: "https://hdfilmdelisi.one"
          },
          vidmody: {
            base: "https://ha.vixolity.com"
          }
        },
        meta_resolvers: {}
      }
    };
  }
});

// src/shared/config.js
var require_config2 = __commonJS({
  "src/shared/config.js"(exports2, module2) {
    var config = require_config();
    function loadConfig() {
      return Promise.resolve(config);
    }
    function val(key) {
      return key.split(".").reduce(function(v, k) {
        return v == null ? void 0 : v[k];
      }, config);
    }
    function wrapAll(obj, ready) {
      var out = {};
      Object.keys(obj).forEach(function(k) {
        out[k] = typeof obj[k] === "function" ? function() {
          var args = arguments, self = this;
          return Promise.resolve().then(function() {
            return ready ? ready() : null;
          }).then(function() {
            return obj[k].apply(self, args);
          });
        } : obj[k];
      });
      return out;
    }
    module2.exports = { loadConfig, val, wrapAll };
  }
});

// src/shared/http.js
var require_http = __commonJS({
  "src/shared/http.js"(exports2, module2) {
    var DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    function timeoutSignal(ms) {
      if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        return AbortSignal.timeout(ms);
      }
      var controller = new AbortController();
      setTimeout(function() {
        controller.abort(new Error("TIMEOUT"));
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
      for (var j = 0; j < valid.length; j++) {
        if (valid[j].aborted) {
          return valid[j];
        }
      }
      if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
        return AbortSignal.any(valid);
      }
      var controller = new AbortController();
      function onAbort() {
        controller.abort(this ? this.reason : void 0);
        for (var k = 0; k < valid.length; k++) {
          try {
            valid[k].removeEventListener("abort", onAbort);
          } catch (_) {
          }
        }
      }
      for (var m = 0; m < valid.length; m++) {
        valid[m].addEventListener("abort", onAbort, { once: true });
      }
      return controller.signal;
    }
    function fetchWithTimeout(url, options, ms) {
      ms = ms || 8e3;
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
      if (!options.headers["User-Agent"] && !options.headers["user-agent"]) {
        options.headers["User-Agent"] = DEFAULT_UA;
      }
      return fetch(url, options);
    }
    var MAX_CACHE_SIZE = 500;
    var DEFAULT_TTL_MS = 36e5;
    function createTmdbCache() {
      var store = /* @__PURE__ */ new Map();
      var cacheObj = {
        get: function(key) {
          if (!store.has(key)) return void 0;
          var entry = store.get(key);
          if (Date.now() > entry.expiresAt) {
            store.delete(key);
            return void 0;
          }
          store.delete(key);
          store.set(key, entry);
          return entry.value;
        },
        set: function(key, value, ttlMs) {
          if (store.size >= MAX_CACHE_SIZE && !store.has(key)) {
            var firstKey = store.keys().next().value;
            if (firstKey !== void 0) store.delete(firstKey);
          }
          var expiresAt = Date.now() + (typeof ttlMs === "number" && ttlMs > 0 ? ttlMs : DEFAULT_TTL_MS);
          if (store.has(key)) store.delete(key);
          store.set(key, { value, expiresAt });
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
      if (typeof Proxy !== "undefined") {
        return new Proxy(cacheObj, {
          get: function(target, prop) {
            if (typeof prop === "string" && prop in target) {
              var member = target[prop];
              if (typeof member === "function") return member.bind(target);
              return member;
            }
            if (typeof prop === "symbol") return target[prop];
            return target.get(prop);
          },
          set: function(target, prop, value) {
            if (typeof prop === "symbol" || prop in target) {
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
    var _g = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : exports2;
    if (!_g.__MUM_TMDB_CACHE__) {
      _g.__MUM_TMDB_CACHE__ = createTmdbCache();
    }
    var tmdb_cache = _g.__MUM_TMDB_CACHE__;
    if (!_g.__MUM_TMDB_IN_FLIGHT__) {
      _g.__MUM_TMDB_IN_FLIGHT__ = /* @__PURE__ */ new Map();
    }
    var in_flight_tmdb = _g.__MUM_TMDB_IN_FLIGHT__;
    function makeTmdbCacheKey(mediaType, cleanId, language) {
      var type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
      var id = String(cleanId || "").trim().replace(/^(?:movie|tv|series|tmdb|imdb):+/i, "");
      if (id.includes(":")) id = id.split(":")[0];
      var lang = String(language || "tr-TR").trim().toLowerCase();
      return type + ":" + id + ":" + lang;
    }
    function getCachedTmdb(mediaType, cleanId, language) {
      var key = makeTmdbCacheKey(mediaType, cleanId, language);
      return tmdb_cache.get(key);
    }
    function setCachedTmdb(mediaType, cleanId, data, language, ttlMs) {
      var key = makeTmdbCacheKey(mediaType, cleanId, language);
      tmdb_cache.set(key, data, ttlMs);
    }
    function resolveTmdbMeta(id, mediaType, options) {
      return __async(this, null, function* () {
        options = options || {};
        var rawId = typeof id === "object" && id && id.id ? id.id : id;
        if (typeof id === "object" && id) {
          if (!mediaType && id.type) mediaType = id.type;
          if (!options.signal && id.signal) options.signal = id.signal;
        }
        var cleanId = String(rawId || "").trim().replace(/^(?:movie|tv|series|tmdb|imdb):+/i, "");
        if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
        if (!cleanId) return null;
        var isTv = mediaType === "tv" || mediaType === "series";
        var type = isTv ? "tv" : "movie";
        var isImdb = cleanId.startsWith("tt");
        var lang = (options.language || "tr-TR").trim().toLowerCase();
        var apiKey = options.apiKey || "500330721680edb6d5f7f12ba7cd9023";
        var timeoutMs = options.timeoutMs || 8e3;
        var callerSignal = options.signal;
        if (callerSignal && callerSignal.aborted) {
          var errAbort = new Error("The operation was aborted");
          errAbort.name = "AbortError";
          throw errAbort;
        }
        var cacheKey = makeTmdbCacheKey(type, cleanId, lang);
        var cached = tmdb_cache.get(cacheKey);
        if (cached) {
          return cached;
        }
        var inFlightEntry = in_flight_tmdb.get(cacheKey);
        var subscriberToken = { signal: callerSignal };
        if (!inFlightEntry) {
          var abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
          var subscribers = /* @__PURE__ */ new Set();
          subscribers.add(subscriberToken);
          var sharedPromise = (function() {
            return __async(this, null, function* () {
              try {
                var title = "";
                var origTitle = "";
                var year = "";
                var imdbId = isImdb ? cleanId : "";
                var numericId = isImdb ? null : parseInt(cleanId, 10) || null;
                var originCountries = [];
                var origLanguage = "";
                var fetchSignal = abortController ? abortController.signal : null;
                if (isImdb) {
                  var findRes = yield fetchWithTimeout(
                    "https://api.themoviedb.org/3/find/" + cleanId + "?api_key=" + apiKey + "&external_source=imdb_id&language=" + lang,
                    { signal: fetchSignal },
                    timeoutMs
                  );
                  if (findRes.ok) {
                    var fData = yield findRes.json();
                    var match = isTv ? fData.tv_results && fData.tv_results[0] : fData.movie_results && fData.movie_results[0];
                    if (!match) match = fData.movie_results && fData.movie_results[0] || fData.tv_results && fData.tv_results[0] || (fData.title || fData.name) && fData;
                    if (match) {
                      numericId = match.id || null;
                      title = match.name || match.title || "";
                      origTitle = match.original_name || match.original_title || "";
                      var dStr = match.first_air_date || match.release_date || "";
                      if (dStr) year = dStr.slice(0, 4);
                      if (Array.isArray(match.origin_country)) originCountries = match.origin_country;
                      if (match.original_language) origLanguage = match.original_language;
                    }
                  }
                }
                var needsDetails = !title || !origTitle || isTv && originCountries.length === 0;
                if (numericId && needsDetails) {
                  var detailsRes = yield fetchWithTimeout(
                    "https://api.themoviedb.org/3/" + type + "/" + numericId + "?api_key=" + apiKey + "&language=" + lang + "&append_to_response=external_ids",
                    { signal: fetchSignal },
                    timeoutMs
                  );
                  if (detailsRes.ok) {
                    var dData = yield detailsRes.json();
                    title = dData.name || dData.title || title;
                    origTitle = dData.original_name || dData.original_title || origTitle;
                    var dStr2 = dData.first_air_date || dData.release_date || "";
                    if (dStr2 && !year) year = dStr2.slice(0, 4);
                    if (Array.isArray(dData.origin_country) && dData.origin_country.length > 0) {
                      originCountries = dData.origin_country;
                    } else if (Array.isArray(dData.production_countries) && dData.production_countries.length > 0) {
                      originCountries = dData.production_countries.map(function(p) {
                        return p.iso_3166_1;
                      }).filter(Boolean);
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
                  title,
                  origTitle,
                  titleTr: title,
                  titleEn: origTitle,
                  year,
                  imdbId: imdbId || (isImdb ? cleanId : ""),
                  numericId,
                  originCountries,
                  origLanguage
                };
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
            });
          })();
          inFlightEntry = {
            promise: sharedPromise,
            subscribers,
            abortController
          };
          in_flight_tmdb.set(cacheKey, inFlightEntry);
        } else {
          inFlightEntry.subscribers.add(subscriberToken);
        }
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
                inFlightEntry.abortController.abort(callerSignal.reason || new Error("The operation was aborted"));
              } catch (_) {
              }
            }
            var err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          };
          if (callerSignal.aborted) {
            return onAbort();
          }
          callerSignal.addEventListener("abort", onAbort, { once: true });
          inFlightEntry.promise.then(
            function(val) {
              try {
                callerSignal.removeEventListener("abort", onAbort);
              } catch (_) {
              }
              inFlightEntry.subscribers.delete(subscriberToken);
              resolve(val);
            },
            function(err) {
              try {
                callerSignal.removeEventListener("abort", onAbort);
              } catch (_) {
              }
              inFlightEntry.subscribers.delete(subscriberToken);
              reject(err);
            }
          );
        });
      });
    }
    module2.exports = {
      DEFAULT_UA,
      timeoutSignal,
      combineSignals,
      fetchWithTimeout,
      tmdb_cache,
      in_flight_tmdb,
      makeTmdbCacheKey,
      getCachedTmdb,
      setCachedTmdb,
      resolveTmdbMeta
    };
  }
});

// src/shared/errors.js
var require_errors = __commonJS({
  "src/shared/errors.js"(exports2, module2) {
    function ProviderError(code, message, stage, status) {
      var err = new Error(message || code);
      err.name = "ProviderError";
      err.code = code;
      err.stage = stage;
      err.status = status;
      Object.setPrototypeOf(err, ProviderError.prototype);
      return err;
    }
    ProviderError.prototype = Object.create(Error.prototype);
    ProviderError.prototype.constructor = ProviderError;
    module2.exports = {
      ProviderError
    };
  }
});

// src/shared/matching.js
var require_matching = __commonJS({
  "src/shared/matching.js"(exports2, module2) {
    var STOP_WORDS = /* @__PURE__ */ new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "bir",
      "ve",
      "ile",
      "icin",
      "de",
      "da",
      "izle",
      "dizi",
      "dizisi",
      "film",
      "filmi",
      "bolum",
      "sezon",
      "hd",
      "full",
      "dublaj",
      "altyazi",
      "altyazili",
      "turkce",
      "tr",
      "en"
    ]);
    function normalizeText(str) {
      if (!str) return "";
      return String(str).replace(/\b([a-zA-Z])\.(?=[a-zA-Z]\b|\.)/g, "$1").replace(/\.([a-zA-Z])\b/g, "$1").toLowerCase().replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[şŞ]/g, "s").replace(/[ıİ]/g, "i").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c").replace(/[âáàÂÁÀ]/g, "a").replace(/[îíÎÍ]/g, "i").replace(/[ûúÛÚ]/g, "u").replace(/[^a-z0-9]+/g, " ").trim();
    }
    function tokenize(str) {
      var norm = normalizeText(str);
      if (!norm) return [];
      return norm.split(/\s+/).filter(function(w) {
        return w.length > 1 && !STOP_WORDS.has(w);
      });
    }
    function cleanSlug(slug) {
      if (!slug) return "";
      try {
        var last = String(slug).split("/").filter(Boolean).pop() || "";
        return last.replace(/-film-izle.*$/i, "").replace(/-izle.*$/i, "").replace(/-dizi(?:si)?.*$/i, "").replace(/-turkce.*$/i, "").replace(/-dublaj.*$/i, "").replace(/-altyazi.*$/i, "").replace(/(\D+)\d+$/i, "$1").replace(/-/g, " ").trim();
      } catch (_) {
        return String(slug).replace(/-/g, " ");
      }
    }
    function calculateMatchScore(targetTitle, targetYear, candTitle, candSlug, candYear, options) {
      var opts = options || {};
      var minCoverage = opts.minCoverage !== void 0 ? opts.minCoverage : 0.75;
      var minScore = opts.minScore !== void 0 ? opts.minScore : 50;
      var tNorm = normalizeText(targetTitle);
      var cNorm = normalizeText(candTitle);
      var sClean = cleanSlug(candSlug);
      var sNorm = normalizeText(sClean);
      if (!tNorm || !cNorm && !sNorm) {
        return { matched: false, score: 0, reason: "empty_input" };
      }
      var targetY = parseInt(targetYear, 10);
      var candY = parseInt(candYear, 10);
      if (!isNaN(targetY) && !isNaN(candY) && targetY > 1900 && candY > 1900) {
        var diff = Math.abs(targetY - candY);
        if (diff > 1) {
          return { matched: false, score: 0, reason: "year_mismatch_" + targetY + "_vs_" + candY };
        }
      }
      var tTokens = tokenize(targetTitle);
      if (tTokens.length === 0) tTokens = tNorm.split(/\s+/).filter(Boolean);
      var sCleanTokens = tokenize(sClean);
      var extraSlugTokens = sCleanTokens.filter(function(tok) {
        if (tTokens.indexOf(tok) !== -1) return false;
        var baseTok = tok.replace(/\d+$/, "");
        if (baseTok && tTokens.indexOf(baseTok) !== -1) return false;
        if (tok.length > 2 && tok.endsWith("s") && tTokens.indexOf(tok.slice(0, -1)) !== -1) return false;
        return true;
      });
      var isExactTitleOrSlug = cNorm === tNorm || sNorm === tNorm;
      if (isExactTitleOrSlug) {
        if (candSlug && extraSlugTokens.length > 0 && (tTokens.length <= 2 || extraSlugTokens.length >= 2)) {
          return {
            matched: false,
            score: 0,
            reason: "slug_extra_tokens_" + extraSlugTokens.join("_")
          };
        }
        var exactScore = 100;
        if (!isNaN(targetY) && !isNaN(candY) && targetY > 1900 && candY > 1900) {
          var yDiff = Math.abs(targetY - candY);
          if (yDiff === 0) exactScore += 25;
          else if (yDiff === 1) exactScore += 10;
        }
        return { matched: true, score: exactScore, reason: "exact_title_match" };
      }
      var cTokensList = tokenize(candTitle).concat(sCleanTokens);
      var cTokens = new Set(cTokensList);
      var matchCount = 0;
      for (var i = 0; i < tTokens.length; i++) {
        if (cTokens.has(tTokens[i])) {
          matchCount++;
        }
      }
      var coverage = tTokens.length > 0 ? matchCount / tTokens.length : 0;
      if (coverage < minCoverage) {
        return {
          matched: false,
          score: 0,
          reason: "low_coverage_" + Math.round(coverage * 100) + "pct"
        };
      }
      var score = coverage * 70;
      var candUniqueTokens = new Set(tokenize(candTitle).concat(sCleanTokens));
      var extraTokens = 0;
      candUniqueTokens.forEach(function(tok) {
        if (tTokens.indexOf(tok) !== -1) return;
        var baseTok = tok.replace(/\d+$/, "");
        if (baseTok && tTokens.indexOf(baseTok) !== -1) return;
        extraTokens++;
      });
      if (extraTokens > 0) {
        if (tTokens.length <= 2 && extraTokens >= 1) {
          return {
            matched: false,
            score: 0,
            reason: "short_title_extra_token_rejection"
          };
        }
        var extraRatio = candUniqueTokens.size > 0 ? extraTokens / candUniqueTokens.size : 0;
        if (extraTokens >= 2 && (extraRatio >= 0.5 || extraTokens >= tTokens.length)) {
          score -= extraTokens * 8 + 10;
        } else {
          score -= extraTokens * 6;
        }
      }
      if (!isNaN(targetY) && !isNaN(candY) && targetY > 1900 && candY > 1900) {
        var yDiff2 = Math.abs(targetY - candY);
        if (yDiff2 === 0) score += 20;
        else if (yDiff2 === 1) score += 10;
      }
      if (score >= minScore) {
        return { matched: true, score, reason: "token_match" };
      }
      return { matched: false, score, reason: "score_below_threshold" };
    }
    function pickBestCandidate(candidates, targetTitle, targetYear, options) {
      if (!Array.isArray(candidates) || candidates.length === 0) return null;
      if (!targetTitle) return null;
      var best = null;
      var bestScore = -1;
      for (var i = 0; i < candidates.length; i++) {
        var cand = candidates[i];
        if (!cand) continue;
        var cTitle = cand.title || cand.name || cand.baslik || cand.orijinalBaslik || "";
        var cSlug = cand.slug || cand.url || cand.href || "";
        var cYear = cand.year || cand.yil || "";
        if (!cYear) {
          var ym = (String(cTitle) + " " + String(cSlug) + " " + String(cand.meta || "")).match(/\b(19\d\d|20\d\d)\b/);
          if (ym) cYear = ym[1];
        }
        var res = calculateMatchScore(targetTitle, targetYear, cTitle, cSlug, cYear, options);
        if (res.matched && res.score > bestScore) {
          bestScore = res.score;
          best = cand;
        }
      }
      return best;
    }
    module2.exports = {
      STOP_WORDS,
      normalizeText,
      tokenize,
      cleanSlug,
      calculateMatchScore,
      pickBestCandidate
    };
  }
});

// src/belgeselx/index.js
var require_belgeselx = __commonJS({
  "src/belgeselx/index.js"(exports2, module2) {
    var { sortStreamsByQuality, filterHighestQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { fetchWithTimeout, resolveTmdbMeta, DEFAULT_UA } = require_http();
    var { ProviderError } = require_errors();
    var { pickBestCandidate, normalizeText, tokenize } = require_matching();
    var cheerio = require("cheerio-without-node-native");
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v = val("urls.series.belgeselx.base") || val("urls.belgeselx.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var PROVIDER_NAME = "BELGX";
    var BASE_URL = "https://belgeselx.com";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var WORKING_HEADERS = {
      "User-Agent": DEFAULT_UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    var srcMap = {
      "0": "new5",
      "2": "new1",
      "5": "new4",
      "3": "new2",
      "4": "new3"
    };
    function slugify(text) {
      return String(text || "").toLowerCase().replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[şŞ]/g, "s").replace(/[ıİ]/g, "i").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    function cleanTitle(title) {
      return String(title || "").replace(/\b(belgeseli?|belgeselleri?|serisi?|dizisi?)\b/gi, "").replace(/[:\-–—]+/g, " ").replace(/\s+/g, " ").trim();
    }
    function resolveTmdbInfo(id, mediaType, signal) {
      return __async(this, null, function* () {
        try {
          var meta = yield resolveTmdbMeta(id, mediaType || "tv", { signal, apiKey: TMDB_API_KEY });
          var res = meta || { title: "", origTitle: "", numericId: id, year: "", originCountries: [], origLanguage: "" };
          res.altTitles = [];
          var numId = res.numericId || (typeof id === "number" || /^\d+$/.test(String(id).trim()) ? parseInt(id, 10) : null);
          if (numId) {
            try {
              var altUrl = "https://api.themoviedb.org/3/" + (mediaType === "movie" ? "movie" : "tv") + "/" + numId + "/alternative_titles?api_key=" + TMDB_API_KEY;
              var aRes = yield fetchWithTimeout(altUrl, { signal }, 3e3);
              if (aRes.ok) {
                var aData = yield aRes.json();
                var titles = (aData.results || aData.titles || []).map(function(x) {
                  return x.title;
                }).filter(Boolean);
                res.altTitles = titles;
              }
            } catch (_) {
            }
          }
          return res;
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return { title: "", origTitle: "", numericId: id, year: "", originCountries: [], origLanguage: "", altTitles: [] };
        }
      });
    }
    function pickDocumentaryFallback(candidates, targetTitle, targetYear, seasonNum) {
      if (!targetTitle || !Array.isArray(candidates) || candidates.length === 0) return null;
      var tTokens = tokenize(targetTitle);
      if (tTokens.length === 0) return null;
      var tSlug = slugify(targetTitle);
      var matchingCandidates = [];
      for (var i = 0; i < candidates.length; i++) {
        var c = candidates[i];
        var cSlug = c.slug || slugify(c.title);
        var cTokens = new Set(tokenize(c.title).concat(tokenize(cSlug)));
        var allTokensMatch = tTokens.every(function(tok) {
          return cTokens.has(tok);
        });
        var slugPrefixMatch = cSlug.indexOf(tSlug) === 0 || cSlug.indexOf("-" + tSlug) !== -1;
        if (allTokensMatch || slugPrefixMatch) {
          matchingCandidates.push(c);
        }
      }
      if (matchingCandidates.length === 0) return null;
      if (matchingCandidates.length === 1) return matchingCandidates[0];
      matchingCandidates.sort(function(a, b) {
        var aText = (a.title + " " + (a.slug || "")).toLowerCase();
        var bText = (b.title + " " + (b.slug || "")).toLowerCase();
        var aIsSeason2 = /yeni|dunyalar|season\s*2|sezon\s*2|\b2\b/i.test(aText);
        var bIsSeason2 = /yeni|dunyalar|season\s*2|sezon\s*2|\b2\b/i.test(bText);
        if (seasonNum === 2) {
          if (aIsSeason2 && !bIsSeason2) return -1;
          if (!aIsSeason2 && bIsSeason2) return 1;
        } else if (seasonNum === 1) {
          if (!aIsSeason2 && bIsSeason2) return -1;
          if (aIsSeason2 && !bIsSeason2) return 1;
        }
        if (targetYear) {
          var aHasYear = aText.indexOf(targetYear) !== -1;
          var bHasYear = bText.indexOf(targetYear) !== -1;
          if (aHasYear && !bHasYear) return -1;
          if (!aHasYear && bHasYear) return 1;
        }
        return (a.slug || a.title).length - (b.slug || b.title).length;
      });
      return matchingCandidates[0];
    }
    function parseDiziGetirCalls(html) {
      var episodes = [];
      var regex = /diziGetir\s*\(([^)]+)\)/g;
      var m;
      while ((m = regex.exec(html)) !== null) {
        var rawArgs = m[1];
        var args = [];
        var cur = "";
        var inQuote = null;
        for (var i = 0; i < rawArgs.length; i++) {
          var c = rawArgs[i];
          if (inQuote) {
            if (c === inQuote) {
              inQuote = null;
            } else if (c === "\\" && i + 1 < rawArgs.length) {
              cur += rawArgs[++i];
            } else {
              cur += c;
            }
          } else {
            if (c === "'" || c === '"') {
              inQuote = c;
            } else if (c === ",") {
              args.push(cur.trim());
              cur = "";
            } else {
              cur += c;
            }
          }
        }
        if (cur.trim()) args.push(cur.trim());
        var cleanArgs = args.map(function(a) {
          return a.replace(/^['"]|['"]$/g, "");
        });
        if (cleanArgs.length >= 11) {
          if (cleanArgs[0] === "id" || isNaN(parseInt(cleanArgs[0], 10))) continue;
          episodes.push({
            id: cleanArgs[0],
            ic1: cleanArgs[1],
            ic2: cleanArgs[2],
            ic3: cleanArgs[3],
            title: cleanArgs[4],
            hit: cleanArgs[5],
            date: cleanArgs[6],
            season: parseInt(cleanArgs[7], 10) || 1,
            episode: parseInt(cleanArgs[8], 10) || 1,
            diziId: cleanArgs[9],
            slug: cleanArgs[10]
          });
        }
      }
      return episodes;
    }
    function parseSearchCandidates($, baseUrl) {
      var candidates = [];
      var seen = /* @__PURE__ */ Object.create(null);
      $('.px-toplist-item, a[href*="/belgesel/"], a[href*="/belgeseldizi/"]').each(function() {
        var href = $(this).attr("href") || "";
        if (!href) return;
        var absolute;
        try {
          absolute = new URL(href, baseUrl).href;
        } catch (e) {
          return;
        }
        if (absolute.indexOf(baseUrl) !== 0) return;
        var pathParts = absolute.replace(baseUrl, "").split("/").filter(Boolean);
        if (pathParts.length < 2) return;
        var pathSlug = pathParts[1];
        if (!pathSlug || pathSlug === "belgesel" || pathSlug === "belgeseldizi") return;
        var targetDocUrl = baseUrl + "/belgesel/" + pathSlug;
        var imgAlt = $(this).find("img").attr("alt") || "";
        var toplistTitle = $(this).find(".px-toplist-title").text().trim();
        var linkTitle = $(this).attr("title") || $(this).text().trim().replace(/\s+/g, " ");
        var candidateTitle = toplistTitle || imgAlt || linkTitle || pathSlug.replace(/-/g, " ");
        var candYear = "";
        var yearMatch = (candidateTitle + " " + pathSlug).match(/\b(19\d\d|20\d\d)\b/);
        if (yearMatch) candYear = yearMatch[1];
        if (!seen[targetDocUrl]) {
          seen[targetDocUrl] = true;
          candidates.push({
            title: candidateTitle,
            slug: pathSlug,
            href: targetDocUrl,
            year: candYear
          });
        }
      });
      return candidates;
    }
    function resolveGoogleDriveStream(driveUrl, signal) {
      return __async(this, null, function* () {
        var match = driveUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i);
        if (!match) return null;
        var fileId = match[1];
        try {
          var dlUrl = "https://drive.usercontent.google.com/download?id=" + fileId + "&export=download";
          var res = yield fetchWithTimeout(dlUrl, {
            headers: { "User-Agent": DEFAULT_UA },
            signal
          }, 5e3);
          if (!res.ok) return null;
          var contentType = res.headers.get("content-type") || "";
          if (contentType.indexOf("octet-stream") !== -1 || contentType.indexOf("video/") !== -1) {
            return {
              url: dlUrl,
              type: "mp4",
              quality: "1080p",
              headers: { "User-Agent": DEFAULT_UA }
            };
          }
          var html = yield res.text();
          var $ = cheerio.load(html);
          var form = $('form#download-form, form[action*="download"]');
          if (form.length > 0) {
            var inputs = {};
            form.find("input").each(function() {
              var name = $(this).attr("name");
              if (name && name !== "undefined") {
                inputs[name] = $(this).attr("value") || "";
              }
            });
            var action = form.attr("action") || "https://drive.usercontent.google.com/download";
            var queryParts = [];
            Object.keys(inputs).forEach(function(k) {
              queryParts.push(encodeURIComponent(k) + "=" + encodeURIComponent(inputs[k]));
            });
            if (!inputs.confirm) queryParts.push("confirm=t");
            var finalUrl = action + (action.indexOf("?") !== -1 ? "&" : "?") + queryParts.join("&");
            return {
              url: finalUrl,
              type: "mp4",
              quality: "1080p",
              headers: { "User-Agent": DEFAULT_UA }
            };
          }
          return {
            url: "https://drive.usercontent.google.com/download?id=" + fileId + "&export=download&confirm=t",
            type: "mp4",
            quality: "1080p",
            headers: { "User-Agent": DEFAULT_UA }
          };
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || signal && signal.aborted)) throw e;
          return null;
        }
      });
    }
    function resolveOkRuStream(okUrl, signal) {
      return __async(this, null, function* () {
        var match = okUrl.match(/(?:odnoklassniki\.ru|ok\.ru)\/videoembed\/([0-9]+)/i);
        if (!match) return null;
        var videoId = match[1];
        try {
          var embedPageUrl = "https://odnoklassniki.ru/videoembed/" + videoId;
          var res = yield fetchWithTimeout(embedPageUrl, {
            headers: {
              "User-Agent": DEFAULT_UA,
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            },
            signal
          }, 5e3);
          if (!res.ok) return null;
          var html = yield res.text();
          if (html.indexOf("vp_video_stub") !== -1 || html.indexOf('data-module="OKVideo"') === -1) {
            return null;
          }
          var $ = cheerio.load(html);
          var dataOptions = $('div[data-module="OKVideo"]').attr("data-options");
          if (!dataOptions) return null;
          var parsed = JSON.parse(dataOptions);
          var metadata = parsed.flashvars && parsed.flashvars.metadata;
          if (typeof metadata === "string") {
            try {
              metadata = JSON.parse(metadata);
            } catch (_) {
            }
          }
          if (!metadata) return null;
          var okHeaders = {
            "User-Agent": DEFAULT_UA,
            "Referer": "https://odnoklassniki.ru/"
          };
          if (metadata.hlsMasterPlaylistUrl) {
            return {
              url: metadata.hlsMasterPlaylistUrl,
              type: "hls",
              quality: "1080p",
              headers: okHeaders
            };
          }
          var videos = Array.isArray(metadata.videos) ? metadata.videos : [];
          if (!videos.length) return null;
          var qualityRank = { "full": 1080, "hd": 720, "sd": 480, "low": 360, "lowest": 240, "mobile": 144 };
          videos.sort(function(a, b) {
            return (qualityRank[b.name] || 0) - (qualityRank[a.name] || 0);
          });
          var chosen = videos[0];
          var qStr = chosen.name === "full" || chosen.name === "1080" ? "1080p" : chosen.name === "hd" ? "720p" : "480p";
          return {
            url: chosen.url,
            type: "mp4",
            quality: qStr,
            headers: okHeaders
          };
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || signal && signal.aborted)) throw e;
          return null;
        }
      });
    }
    function resolvePlayerStream(pHtml, playerUrl, docHtml, targetEpisode, docPageUrl, signal) {
      return __async(this, null, function* () {
        if (!pHtml || typeof pHtml !== "string") return null;
        var $ = cheerio.load(pHtml);
        var rawSrc = $("iframe[src]").attr("src") || $("video source[src], video[src]").attr("src");
        if (!rawSrc) {
          var scripts = $("script").map(function() {
            return $(this).html() || "";
          }).get().join("\n");
          var directMatch = scripts.match(/(?:file|source|src)\s*:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (directMatch && directMatch[1]) rawSrc = directMatch[1];
        }
        if (!rawSrc) return null;
        if (rawSrc.indexOf("//") === 0) rawSrc = "https:" + rawSrc;
        var nestedMatch = rawSrc.match(/https?:\/\/[^/]+\/.*?(https?:\/\/.+)/i);
        if (nestedMatch && nestedMatch[1]) rawSrc = nestedMatch[1];
        if (/theblacklist711tr\.mp4|googleapis\.com|recaptcha/i.test(rawSrc)) {
          return null;
        }
        var has1080p = /1080p?/i.test(pHtml) || targetEpisode && /1080p?/i.test(targetEpisode.title) || docHtml && /1080p?/i.test(docHtml);
        var fallbackQuality = has1080p ? "1080p" : "720p";
        if (/drive\.google\.com/i.test(rawSrc)) {
          var driveStream = yield resolveGoogleDriveStream(rawSrc, signal);
          if (driveStream) return driveStream;
        }
        if (/odnoklassniki\.ru|ok\.ru/i.test(rawSrc)) {
          var okStream = yield resolveOkRuStream(rawSrc, signal);
          if (okStream) return okStream;
        }
        if (/\.(mp4|m3u8)(\?|$)/i.test(rawSrc)) {
          return {
            url: rawSrc,
            type: rawSrc.indexOf(".m3u8") !== -1 ? "hls" : "mp4",
            quality: fallbackQuality,
            headers: {
              "User-Agent": DEFAULT_UA,
              "Referer": docPageUrl
            }
          };
        }
        return null;
      });
    }
    function getStreams(tmdbId, mediaType, seasonNum, episodeNum, options) {
      return __async(this, null, function* () {
        try {
          var signal = options && options.signal;
          if (typeof tmdbId === "object" && tmdbId !== null) {
            mediaType = tmdbId.type || mediaType;
            seasonNum = tmdbId.season || seasonNum;
            episodeNum = tmdbId.episode || episodeNum;
            if (tmdbId.signal && !signal) signal = tmdbId.signal;
            tmdbId = tmdbId.id;
          }
          mediaType = mediaType === "series" ? "tv" : mediaType;
          if (mediaType !== "tv" && mediaType !== "movie") return [];
          if (mediaType === "tv") {
            if (!Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 || !Number.isInteger(Number(episodeNum)) || Number(episodeNum) < 1) {
              return [];
            }
            seasonNum = Number(seasonNum);
            episodeNum = Number(episodeNum);
          } else {
            seasonNum = 1;
            episodeNum = 1;
          }
          var info = yield resolveTmdbInfo(tmdbId, mediaType, signal);
          var trTitle = (info.title || "").trim();
          var orgTitle = (info.origTitle || "").trim();
          var targetYear = info.year || "";
          var displayTitle = trTitle || orgTitle || "Belgesel";
          if (!trTitle && !orgTitle) {
            return [];
          }
          var targetDocUrl = null;
          var docHtml = null;
          var candidateSlugs = [];
          var titlesToCheck = [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)].concat(info.altTitles || []).filter(Boolean);
          titlesToCheck.forEach(function(t) {
            var s = slugify(t);
            if (s && candidateSlugs.indexOf(s) === -1) candidateSlugs.push(s);
            if (t.includes(":") || t.includes("-")) {
              var sPrefix = slugify(t.split(/[:\-]/)[0]);
              if (sPrefix && candidateSlugs.indexOf(sPrefix) === -1) candidateSlugs.push(sPrefix);
            }
          });
          for (var sIdx = 0; sIdx < candidateSlugs.length; sIdx++) {
            var cSlug = candidateSlugs[sIdx];
            if (!cSlug || cSlug.length < 2) continue;
            var testUrl = BASE_URL + "/belgesel/" + cSlug;
            try {
              var probeRes = yield fetchWithTimeout(testUrl, { headers: WORKING_HEADERS, signal }, 4e3);
              if (probeRes.ok) {
                var probeText = yield probeRes.text();
                if (probeText.indexOf("diziGetir") !== -1) {
                  targetDocUrl = testUrl;
                  docHtml = probeText;
                  break;
                }
              }
            } catch (probeErr) {
              if (probeErr && (probeErr.name === "AbortError" || probeErr.message === "TIMEOUT" || probeErr.name === "ProviderError")) {
                throw probeErr;
              }
            }
          }
          if (!docHtml) {
            var searchQueries = [];
            [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)].forEach(function(q2) {
              if (q2 && searchQueries.indexOf(q2) === -1) searchQueries.push(q2);
            });
            var bestCandidate = null;
            var allCandidateTitles = [trTitle, cleanTitle(trTitle), orgTitle, cleanTitle(orgTitle)].concat(info.altTitles || []).filter(Boolean);
            for (var qIdx = 0; qIdx < searchQueries.length; qIdx++) {
              var q = searchQueries[qIdx];
              if (!q) continue;
              var searchUrl = BASE_URL + "/?s=" + encodeURIComponent(q);
              var sRes = yield fetchWithTimeout(searchUrl, { headers: WORKING_HEADERS, signal }, 6e3);
              if (!sRes.ok) continue;
              var sHtml = yield sRes.text();
              var $search = cheerio.load(sHtml);
              var candidates = parseSearchCandidates($search, BASE_URL);
              if (candidates.length === 0) continue;
              for (var tIdx = 0; tIdx < allCandidateTitles.length; tIdx++) {
                var testTitle = allCandidateTitles[tIdx];
                bestCandidate = pickBestCandidate(candidates, testTitle, targetYear, { minCoverage: 0.5, minScore: 40 });
                if (bestCandidate && bestCandidate.href) break;
              }
              if (!bestCandidate) {
                bestCandidate = pickDocumentaryFallback(candidates, trTitle || orgTitle, targetYear, seasonNum);
              }
              if (bestCandidate && bestCandidate.href) {
                targetDocUrl = bestCandidate.href;
                break;
              }
            }
            if (targetDocUrl) {
              var docRes = yield fetchWithTimeout(targetDocUrl, { headers: WORKING_HEADERS, signal }, 6e3);
              if (docRes.ok) {
                docHtml = yield docRes.text();
              }
            }
          }
          if (!docHtml || docHtml.indexOf("diziGetir") === -1) {
            return [];
          }
          var episodes = parseDiziGetirCalls(docHtml);
          if (!episodes || episodes.length === 0) {
            return [];
          }
          var targetEpisode = null;
          if (mediaType === "tv") {
            targetEpisode = episodes.find(function(e) {
              return e.season === seasonNum && e.episode === episodeNum;
            });
            if (!targetEpisode && seasonNum === 1) {
              targetEpisode = episodes.find(function(e) {
                return e.episode === episodeNum;
              });
            }
          } else {
            targetEpisode = episodes.find(function(e) {
              return e.season === 1 && e.episode === 1;
            }) || episodes[0];
          }
          if (!targetEpisode) {
            return [];
          }
          var slots = [
            { ic: targetEpisode.ic1, sira: 1 },
            { ic: targetEpisode.ic2, sira: 2 },
            { ic: targetEpisode.ic3, sira: 3 }
          ];
          var streams = [];
          var docPageUrl = targetDocUrl || BASE_URL + "/belgesel/" + targetEpisode.slug;
          for (var slotIdx = 0; slotIdx < slots.length; slotIdx++) {
            var slot = slots[slotIdx];
            var icVal = slot.ic;
            if (!icVal && icVal !== "0") continue;
            var scriptName = srcMap[String(icVal)];
            if (!scriptName) continue;
            var playerUrl = BASE_URL + "/video/data/" + scriptName + ".php?id=" + targetEpisode.id + "&sira=" + slot.sira;
            try {
              var pRes = yield fetchWithTimeout(playerUrl, {
                headers: Object.assign({}, WORKING_HEADERS, { "Referer": docPageUrl }),
                signal
              }, 4e3);
              if (!pRes.ok) continue;
              var pHtml = yield pRes.text();
              var resolved = yield resolvePlayerStream(pHtml, playerUrl, docHtml, targetEpisode, docPageUrl, signal);
              if (resolved && resolved.url) {
                var streamHeaders = resolved.headers || {
                  "User-Agent": WORKING_HEADERS["User-Agent"],
                  "Referer": docPageUrl
                };
                var epTitlePart = targetEpisode.title ? " \xB7 " + targetEpisode.title : "";
                var seasonEpPart = mediaType === "tv" ? " \xB7 " + seasonNum + ". Sezon " + episodeNum + ". B\xF6l\xFCm" : "";
                streams.push({
                  name: displayTitle,
                  title: "\u231C " + PROVIDER_NAME + " \u231F | " + displayTitle + epTitlePart + seasonEpPart + " [TR Dublaj]",
                  url: resolved.url,
                  quality: resolved.quality || "720p",
                  type: resolved.type || (resolved.url.indexOf(".m3u8") !== -1 ? "hls" : "mp4"),
                  provider: "belgeselx",
                  headers: streamHeaders,
                  behaviorHints: {
                    notWebReady: true,
                    proxyHeaders: {
                      request: streamHeaders
                    }
                  }
                });
                break;
              }
            } catch (errSlot) {
              if (errSlot && (errSlot.name === "AbortError" || errSlot.message === "TIMEOUT" || signal && signal.aborted)) {
                throw errSlot;
              }
              continue;
            }
          }
          return streams;
        } catch (err) {
          if (err && (err.name === "ProviderError" || err.name === "AbortError" || err.message === "TIMEOUT")) {
            throw err;
          }
          return [];
        }
      });
    }
    if (typeof getStreams === "function") {
      _origGetStreams = getStreams;
      getStreams = function() {
        return __async(this, arguments, function* () {
          var res = yield _origGetStreams.apply(this, arguments);
          var sorted = sortStreamsByQuality(res);
          return filterHighestQuality(sorted);
        });
      };
    }
    var _origGetStreams;
    if (typeof module2 !== "undefined" && module2.exports) {
      module2.exports = wrapAll({ getStreams }, cfgReady);
    }
    if (typeof globalThis !== "undefined") {
      globalThis.getStreams = getStreams;
    }
  }
});

// src/shared/adapter.js
var require_adapter = __commonJS({
  "src/shared/adapter.js"(exports2, module2) {
    var { combineSignals } = require_http();
    function normalizeStreams(raw) {
      if (!Array.isArray(raw)) throw new Error("INVALID_RESULT");
      var seen = /* @__PURE__ */ Object.create(null), invalid = 0;
      var streams = raw.reduce(function(out, item) {
        var url = item && (typeof item.url === "string" ? item.url : item.url && item.url.url);
        if (typeof url !== "string" || !/^https?:\/\/[^\s/]+(?:[/?#]|$)/i.test(url)) {
          invalid++;
          return out;
        }
        var headers = Object.assign({}, item.behaviorHints && item.behaviorHints.proxyHeaders && item.behaviorHints.proxyHeaders.request || {}, item.headers || {});
        var key = JSON.stringify([url, Object.keys(headers).sort().map(function(k) {
          return [k, headers[k]];
        })]);
        if (!seen[key]) {
          seen[key] = true;
          out.push(Object.assign({}, item, { url, headers }));
        }
        return out;
      }, []);
      return { streams, invalid };
    }
    function adapt2(provider2, source, emit, options) {
      if (!provider2 || typeof provider2.getStreams !== "function") throw new Error("MISSING_EXPORT");
      var defaultLimit = options && options.timeoutMs || source.timeoutMs || 12e3;
      return { getStreams: function(id, type, season, episode, callOptions) {
        return __async(this, null, function* () {
          var started = Date.now(), timer, timedOut = false;
          var activeLimit = callOptions && callOptions.timeoutMs || defaultLimit;
          var abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
          var externalSignal = callOptions && callOptions.signal;
          if (externalSignal && abortCtrl) {
            if (externalSignal.aborted) {
              try {
                abortCtrl.abort(externalSignal.reason);
              } catch (_) {
              }
            } else if (externalSignal.addEventListener) {
              externalSignal.addEventListener("abort", function() {
                try {
                  abortCtrl.abort(externalSignal.reason);
                } catch (_) {
                }
              }, { once: true });
            }
          }
          var record = { provider: source.id, status: "started", count: 0, rejected: 0, elapsedMs: 0, playback: "unverified" };
          function report() {
            record.elapsedMs = Date.now() - started;
            try {
              if (emit) emit(Object.assign({}, record));
            } catch (_) {
            }
          }
          report();
          try {
            type = type === "series" ? "tv" : type;
            if (source.supportedTypes.indexOf(type) < 0) {
              record.status = "unsupported-type";
              return [];
            }
            if (id == null || String(id).trim() === "" || type === "tv" && (!Number.isInteger(season) || season < 0 || !Number.isInteger(episode) || episode < 1)) {
              record.status = "invalid-input";
              return [];
            }
            var effectiveSignal = abortCtrl ? abortCtrl.signal : externalSignal;
            if (externalSignal && abortCtrl && typeof combineSignals === "function") {
              effectiveSignal = combineSignals([externalSignal, abortCtrl.signal]);
            }
            var callOpts = effectiveSignal ? { signal: effectiveSignal } : {};
            var result = yield Promise.race([
              Promise.resolve().then(function() {
                return provider2.getStreams(id, type, season, episode, callOpts);
              }),
              new Promise(function(_, reject) {
                timer = setTimeout(function() {
                  timedOut = true;
                  if (abortCtrl) {
                    try {
                      abortCtrl.abort(new Error("TIMEOUT"));
                    } catch (_2) {
                    }
                  }
                  reject(new Error("TIMEOUT"));
                }, activeLimit);
              })
            ]);
            var normalized = normalizeStreams(result);
            record.count = normalized.streams.length;
            record.rejected = normalized.invalid;
            record.status = record.count ? "sources-found" : normalized.invalid ? "invalid-results" : "empty";
            return normalized.streams;
          } catch (err) {
            if (abortCtrl && !abortCtrl.signal.aborted) {
              try {
                abortCtrl.abort();
              } catch (_) {
              }
            }
            if (timedOut || err && (err.name === "AbortError" || err.message === "TIMEOUT") || externalSignal && externalSignal.aborted) {
              record.status = "timeout";
            } else if (err && err.name === "ProviderError") {
              if (err.code === "HTTP_BLOCKED") record.status = "http-blocked";
              else if (err.code === "NO_MATCH") record.status = "no-match";
              else if (err.code === "PARSE_ERROR") record.status = "parse-error";
              else if (err.code === "TMDB_ERROR") record.status = "tmdb-error";
              else record.status = "error";
              if (err.stage) record.stage = err.stage;
              if (err.code) record.reason = String(err.code).toLowerCase();
            } else {
              record.status = "error";
            }
            return [];
          } finally {
            if (timer !== void 0) clearTimeout(timer);
            report();
          }
        });
      } };
    }
    module2.exports = { adapt: adapt2, normalizeStreams };
  }
});

// mum-entry.js
var provider = require_belgeselx();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "belgeselx", "id": "mum_belgeselx", "name": "BELGX", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
