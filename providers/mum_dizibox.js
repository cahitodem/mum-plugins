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

// src/dizibox/index.js
var require_dizibox = __commonJS({
  "src/dizibox/index.js"(exports2, module2) {
    var cheerio = require("cheerio-without-node-native");
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val } = require_config2();
    var { fetchWithTimeout, resolveTmdbMeta, DEFAULT_UA } = require_http();
    var { ProviderError } = require_errors();
    var { pickBestCandidate, normalizeText } = require_matching();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v = val("urls.series.dizibox.base") || val("urls.movies.dizibox.base") || val("urls.dizibox.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          var pv = val("urls.dizibox.player") || val("urls.pilavyer.base");
          if (pv) PLAYER_BASE = String(pv).replace(/\/+$/, "");
          if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + "/";
        }).catch(function() {
        });
      }
      return _cfgReady;
    }
    var PROVIDER_NAME = "DBOX";
    var BASE_URL = "https://ddizibox.click";
    var PLAYER_BASE = "https://pilavyerplay.top";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var WORKING_HEADERS = {
      "User-Agent": DEFAULT_UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    function resolveTmdbInfo(id, mediaType, signal) {
      return __async(this, null, function* () {
        try {
          var meta = yield resolveTmdbMeta(id, mediaType || "tv", { signal, apiKey: TMDB_API_KEY });
          if (meta) {
            return {
              title: meta.titleTr || meta.title || meta.origTitle || "",
              titleTr: meta.titleTr || meta.title || "",
              origTitle: meta.origTitle || meta.titleEn || "",
              numericId: meta.numericId,
              year: meta.year || "",
              originCountries: meta.originCountries || [],
              origLanguage: meta.origLanguage || ""
            };
          }
          return {
            title: "",
            titleTr: "",
            origTitle: "",
            numericId: id,
            year: "",
            originCountries: [],
            origLanguage: ""
          };
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return {
            title: "",
            titleTr: "",
            origTitle: "",
            numericId: id,
            year: "",
            originCountries: [],
            origLanguage: ""
          };
        }
      });
    }
    function parseSearchResults(html, mediaType, baseUrl) {
      var $2 = cheerio.load(html);
      var candidates = [];
      var seen = /* @__PURE__ */ Object.create(null);
      var targetPrefix = mediaType === "movie" ? "/film/" : "/dizi/";
      $2("a[href]").each(function() {
        var href = $2(this).attr("href") || "";
        if (!href.includes(targetPrefix)) return;
        if (mediaType === "tv" && (href.includes("/sezon-") || href.includes("/bolum-"))) return;
        var fullUrl = href.startsWith("http") ? href : baseUrl + (href.startsWith("/") ? "" : "/") + href;
        if (seen[fullUrl]) return;
        seen[fullUrl] = true;
        var text = $2(this).text().trim().replace(/\s+/g, " ");
        var h2 = $2(this).find("h2, h3, .title, .name").text().trim().replace(/\s+/g, " ");
        var title = h2 || text;
        var year = "";
        var ym = (text + " " + href).match(/\b(19\d\d|20\d\d)\b/);
        if (ym) year = ym[1];
        var slug = "";
        var sm = href.match(new RegExp(targetPrefix.replace(/\//g, "\\/") + "([^/?#]+)"));
        if (sm) slug = sm[1];
        candidates.push({
          title,
          slug,
          href: fullUrl,
          year
        });
      });
      return candidates;
    }
    function toSlugVariants(str) {
      if (!str) return [];
      var s1 = String(str).replace(/['’]s\b/gi, "s").replace(/['’]/g, "");
      var norm = normalizeText(s1).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      var res = [norm];
      var origNorm = normalizeText(str).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      if (!res.includes(origNorm)) res.push(origNorm);
      return res.filter(Boolean);
    }
    function buildSearchQueries(info) {
      var rawList = [info.titleTr || info.title, info.origTitle, info.titleEn].filter(Boolean);
      var queries = [];
      var seen = /* @__PURE__ */ Object.create(null);
      function add(q) {
        if (!q) return;
        var clean = String(q).trim().replace(/\s+/g, " ");
        if (clean.length < 2) return;
        var key = clean.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        queries.push(clean);
      }
      for (var i = 0; i < rawList.length; i++) {
        var t = rawList[i];
        add(t);
        if (/['’]/.test(t)) {
          add(t.replace(/['’]s\b/gi, "s").replace(/['’]/g, ""));
        }
        if (/\b[a-zA-Z]\.[a-zA-Z]\b/.test(t)) {
          add(t.replace(/\b([a-zA-Z])\.(?=[a-zA-Z]\b|\.)/g, "$1").replace(/\.([a-zA-Z])\b/g, "$1"));
        }
        if (/[:\-–—]/.test(t)) {
          add(t.replace(/[:\-–—]+/g, " "));
        }
      }
      return queries.slice(0, 3);
    }
    function getMatchTitles(info) {
      var raw = [info.title, info.titleTr, info.origTitle, info.titleEn].filter(Boolean);
      var list = [];
      var seen = /* @__PURE__ */ Object.create(null);
      function add(t) {
        if (!t) return;
        var s = String(t).trim();
        var k = s.toLowerCase();
        if (seen[k]) return;
        seen[k] = true;
        list.push(s);
      }
      for (var i = 0; i < raw.length; i++) {
        var item = raw[i];
        add(item);
        if (/['’]/.test(item)) {
          add(item.replace(/['’]s\b/gi, "s").replace(/['’]/g, ""));
        }
        if (/[:\-–—]/.test(item)) {
          add(item.replace(/[:\-–—]+/g, " "));
        }
        if (/\b[a-zA-Z]\.[a-zA-Z]\b/.test(item)) {
          add(item.replace(/\b([a-zA-Z])\.(?=[a-zA-Z]\b|\.)/g, "$1").replace(/\.([a-zA-Z])\b/g, "$1"));
        }
      }
      return list;
    }
    function findBestCandidate(candidates, matchTitles, year, opts) {
      if (!Array.isArray(candidates) || candidates.length === 0) return null;
      for (var m = 0; m < matchTitles.length; m++) {
        var cand = pickBestCandidate(candidates, matchTitles[m], year, opts);
        if (cand) return cand;
      }
      return null;
    }
    function extractPilavyerStream(pageHtml, pageUrl, signal) {
      return __async(this, null, function* () {
        var pvMatch = pageHtml.match(/data-pv="([^"]+)"/);
        if (!pvMatch || !pvMatch[1]) {
          return null;
        }
        var pvSlug = pvMatch[1];
        var detectedBases = [];
        var scriptMatches = pageHtml.match(/https?:\/\/[a-z0-9.-]*?pilavyer[a-z0-9.-]*(?:\.[a-z]{2,})/gi);
        if (scriptMatches) {
          for (var sm = 0; sm < scriptMatches.length; sm++) {
            var cleanSm = scriptMatches[sm].replace(/\/+$/, "");
            if (!detectedBases.includes(cleanSm)) detectedBases.push(cleanSm);
          }
        }
        var candidateBases = [];
        for (var d = 0; d < detectedBases.length; d++) {
          if (!candidateBases.includes(detectedBases[d])) candidateBases.push(detectedBases[d]);
        }
        var defaults = ["https://play2.pilavyerplay.top", "https://pilavyerplay.top", PLAYER_BASE].filter(Boolean);
        for (var f = 0; f < defaults.length; f++) {
          if (!candidateBases.includes(defaults[f])) candidateBases.push(defaults[f]);
        }
        var playerHtml = null;
        var usedPlayerBase = null;
        for (var b = 0; b < candidateBases.length; b++) {
          var pBase = candidateBases[b];
          var playerUrl = pBase + "/assets/js/s.php?s=" + encodeURIComponent(pvSlug);
          try {
            var playerRes = yield fetchWithTimeout(playerUrl, {
              headers: {
                "User-Agent": DEFAULT_UA,
                "Referer": BASE_URL + "/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
              },
              signal
            }, 8e3);
            if (playerRes.ok) {
              var text = yield playerRes.text();
              if (text.includes("window.__PLAYER__")) {
                playerHtml = text;
                usedPlayerBase = pBase;
                break;
              }
            }
          } catch (err) {
            if (err && (err.name === "AbortError" || err.message === "TIMEOUT" || signal && signal.aborted)) {
              throw err;
            }
          }
        }
        if (!playerHtml || !usedPlayerBase) {
          return null;
        }
        var configMatch = playerHtml.match(/window\.__PLAYER__\s*=\s*({[\s\S]*?});/);
        if (!configMatch || !configMatch[1]) {
          return null;
        }
        var config;
        try {
          config = JSON.parse(configMatch[1]);
        } catch (_) {
          return null;
        }
        if (!config || !config.stream) {
          return null;
        }
        var subtitles = [];
        if (Array.isArray(config.subs)) {
          for (var i = 0; i < config.subs.length; i++) {
            var s = config.subs[i];
            if (s && s.src) {
              var lang = s.lang === "tr" ? "tur" : s.lang === "en" ? "eng" : s.lang || "tur";
              var label = s.label || (lang === "tur" ? "T\xFCrk\xE7e Altyaz\u0131" : lang === "eng" ? "\u0130ngilizce Altyaz\u0131" : lang);
              subtitles.push({
                url: s.src,
                lang,
                label,
                default: !!s.default
              });
            }
          }
        }
        var audioLabel = "Orijinal";
        if (Array.isArray(config.audios) && config.audios.length > 0) {
          var defAudio = config.audios.find(function(a) {
            return a && a.default;
          }) || config.audios[0];
          if (defAudio && defAudio.label) {
            audioLabel = defAudio.label;
          }
        }
        return {
          streamUrl: config.stream,
          playerUrl: usedPlayerBase + "/assets/js/s.php?s=" + encodeURIComponent(pvSlug),
          audioLabel,
          title: config.title || "",
          subtitles
        };
      });
    }
    function getStreams(id, type, season, episode, options) {
      return __async(this, null, function* () {
        yield cfgReady();
        var signal = options && options.signal;
        type = type === "series" ? "tv" : type;
        var info = yield resolveTmdbInfo(id, type, signal);
        if (!info.title && !info.origTitle) {
          throw new ProviderError("TMDB_ERROR");
        }
        var pageHtml = null;
        var targetPageUrl = null;
        var predictiveSlugs = [];
        var slugSources = [info.origTitle, info.title, info.titleTr].filter(Boolean);
        for (var s = 0; s < slugSources.length; s++) {
          var variants = toSlugVariants(slugSources[s]);
          for (var v = 0; v < variants.length; v++) {
            if (!predictiveSlugs.includes(variants[v])) predictiveSlugs.push(variants[v]);
          }
        }
        for (var p = 0; p < Math.min(predictiveSlugs.length, 2); p++) {
          var pSlug = predictiveSlugs[p];
          var probeUrl = type === "tv" ? BASE_URL + "/dizi/" + pSlug + "/sezon-" + season + "/bolum-" + episode : BASE_URL + "/film/" + pSlug;
          try {
            var probeRes = yield fetchWithTimeout(probeUrl, {
              headers: WORKING_HEADERS,
              signal
            }, 3500);
            if (probeRes.ok) {
              var probeHtml = yield probeRes.text();
              if (probeHtml.includes("data-pv=")) {
                pageHtml = probeHtml;
                targetPageUrl = probeUrl;
                break;
              }
            }
          } catch (_) {
          }
        }
        if (!pageHtml) {
          var searchQueries = buildSearchQueries(info);
          var matchTitles = getMatchTitles(info);
          var bestCandidate = null;
          var candidates = [];
          var startTime = Date.now();
          for (var i = 0; i < searchQueries.length; i++) {
            if (Date.now() - startTime > 9e3) break;
            var q = searchQueries[i];
            if (!q) continue;
            try {
              var searchUrl = BASE_URL + "/ara?q=" + encodeURIComponent(q);
              var searchRes = yield fetchWithTimeout(searchUrl, {
                headers: WORKING_HEADERS,
                signal
              }, 8e3);
              if (searchRes.ok) {
                var searchHtml = yield searchRes.text();
                var found = parseSearchResults(searchHtml, type, BASE_URL);
                if (found.length > 0) {
                  candidates = candidates.concat(found);
                  bestCandidate = findBestCandidate(found, matchTitles, info.year, { minCoverage: 0.7, minScore: 50 });
                  if (bestCandidate) break;
                }
              }
            } catch (e) {
              if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || signal && signal.aborted)) throw e;
            }
          }
          if (!bestCandidate && candidates.length > 0) {
            bestCandidate = findBestCandidate(candidates, matchTitles, info.year, { minCoverage: 0.6, minScore: 40 });
          }
          if (!bestCandidate) {
            throw new ProviderError("NO_MATCH");
          }
          if (type === "tv") {
            var baseSlug = bestCandidate.slug || bestCandidate.href.split("/").filter(Boolean).pop();
            targetPageUrl = BASE_URL + "/dizi/" + baseSlug + "/sezon-" + season + "/bolum-" + episode;
          } else {
            targetPageUrl = bestCandidate.href;
          }
          var pageRes = yield fetchWithTimeout(targetPageUrl, {
            headers: WORKING_HEADERS,
            signal
          }, 8e3);
          if (!pageRes.ok && type === "tv") {
            try {
              var showRes = yield fetchWithTimeout(bestCandidate.href, {
                headers: WORKING_HEADERS,
                signal
              }, 8e3);
              if (showRes.ok) {
                var showHtml = yield showRes.text();
                var $show = cheerio.load(showHtml);
                var epPattern = new RegExp("sezon-" + season + "/bolum-" + episode + "(?:[/?#]|$)", "i");
                var foundEpHref = null;
                $show("a[href]").each(function() {
                  var h = $(this).attr("href") || "";
                  if (epPattern.test(h)) {
                    foundEpHref = h;
                    return false;
                  }
                });
                if (foundEpHref) {
                  var actualEpUrl = foundEpHref.startsWith("http") ? foundEpHref : BASE_URL + (foundEpHref.startsWith("/") ? "" : "/") + foundEpHref;
                  pageRes = yield fetchWithTimeout(actualEpUrl, {
                    headers: WORKING_HEADERS,
                    signal
                  }, 8e3);
                  targetPageUrl = actualEpUrl;
                }
              }
            } catch (_) {
            }
          }
          if (!pageRes || !pageRes.ok) {
            throw new ProviderError("NO_MATCH");
          }
          pageHtml = yield pageRes.text();
        }
        var extracted = yield extractPilavyerStream(pageHtml, targetPageUrl, signal);
        if (!extracted || !extracted.streamUrl) {
          return [];
        }
        var streamTitle = PROVIDER_NAME + " - " + extracted.audioLabel + " (HLS Multi)";
        var stream = {
          name: PROVIDER_NAME,
          title: streamTitle,
          url: extracted.streamUrl,
          quality: "1080p",
          headers: {
            "User-Agent": DEFAULT_UA,
            "Referer": extracted.playerUrl
          },
          subtitles: extracted.subtitles,
          behaviorHints: {
            proxyHeaders: {
              request: {
                "User-Agent": DEFAULT_UA,
                "Referer": extracted.playerUrl
              }
            }
          }
        };
        return sortStreamsByQuality([stream]);
      });
    }
    module2.exports = {
      getStreams,
      parseSearchResults,
      extractPilavyerStream,
      resolveTmdbInfo
    };
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
var provider = require_dizibox();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "dizibox", "id": "mum_dizibox", "name": "DBOX", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
