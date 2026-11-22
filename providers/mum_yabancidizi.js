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

// src/yabancidizi/index.js
var require_yabancidizi = __commonJS({
  "src/yabancidizi/index.js"(exports2, module2) {
    var { sortStreamsByQuality, getQualityScore, filterHighestQuality, getResolutionScore } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { fetchWithTimeout, resolveTmdbMeta } = require_http();
    var { ProviderError } = require_errors();
    var { pickBestCandidate } = require_matching();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.series.yabancidizi.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          if (HEADERS) HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var BASE_URL = "https://yabancidizi.news";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    function safeFetch(url, options) {
      return __async(this, null, function* () {
        options = options || {};
        var res = yield fetchWithTimeout(url, options, 8e3);
        if (res.status === 403) {
          throw new ProviderError("HTTP_BLOCKED", "Yabanc\u0131Dizi Cloudflare 403 Forbidden", "network", 403);
        }
        return res;
      });
    }
    function resolveTmdbInfo(id, mediaType, signal) {
      return __async(this, null, function* () {
        try {
          var meta = yield resolveTmdbMeta(id, mediaType, { signal, apiKey: TMDB_API_KEY });
          return meta || { title: "", origTitle: "", numericId: id, year: "", originCountries: [], origLanguage: "" };
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return { title: "", origTitle: "", numericId: id, year: "", originCountries: [], origLanguage: "" };
        }
      });
    }
    function searchYabanciDizi(query, signal) {
      return __async(this, null, function* () {
        try {
          var searchUrl = BASE_URL + "/search?qr=" + encodeURIComponent(query);
          var res = yield safeFetch(searchUrl, {
            method: "POST",
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "X-Requested-With": "XMLHttpRequest",
              "Accept": "application/json, text/javascript, */*; q=0.01",
              "Referer": BASE_URL + "/"
            },
            signal
          });
          if (!res.ok) return [];
          var data = yield res.json();
          if (data && data.data && Array.isArray(data.data.result)) {
            return data.data.result;
          }
          return [];
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return [];
        }
      });
    }
    function getCatalog(args, signal) {
      return __async(this, null, function* () {
        try {
          var query = args && args.search || args && args.extra && args.extra.search || args && args.query || "";
          if (query) {
            var results = yield searchYabanciDizi(query, signal);
            var metas = results.map(function(r) {
              var poster = r.s_image ? r.s_image.startsWith("http") ? r.s_image : BASE_URL + "/uploads/series/" + r.s_image : "";
              return {
                id: "yabancidizi:show:" + r.s_link,
                type: r.s_type === "1" ? "movie" : "tv",
                name: r.s_name,
                poster,
                background: poster,
                genres: ["Yabanc\u0131 Dizi", "Yabanc\u0131Dizi"],
                description: (r.s_name || "") + " (" + (r.s_year || "") + ") - Yabanc\u0131Dizi"
              };
            });
            return { metas };
          }
          var res = yield safeFetch(BASE_URL + "/", { headers: HEADERS, signal });
          if (!res.ok) return { metas: [] };
          var html = yield res.text();
          var cardRegex = /<a[^>]+href=["'](?:https?:\/\/[^"'/]+)?\/?dizi\/([^"'/]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
          var metas = [];
          var seen = /* @__PURE__ */ new Set();
          var m;
          while ((m = cardRegex.exec(html)) !== null) {
            var slug = m[1];
            if (!slug || slug.startsWith("tur/") || seen.has(slug)) continue;
            seen.add(slug);
            var title = m[2].replace(/<[^>]+>/g, "").trim();
            if (!title) continue;
            metas.push({
              id: "yabancidizi:show:" + slug,
              type: "tv",
              name: title,
              poster: "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              background: "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              genres: ["Yabanc\u0131 Dizi", "Yabanc\u0131Dizi"],
              description: title + " - Yabanc\u0131Dizi Ar\u015Fivi"
            });
          }
          return { metas };
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return { metas: [] };
        }
      });
    }
    function getMeta(args, signal) {
      return __async(this, null, function* () {
        try {
          var rawId = typeof args === "string" ? args : args && args.id ? args.id : "";
          if (!rawId) return { meta: null };
          if (rawId.startsWith("yabancidizi:show:")) {
            var showSlug = rawId.replace("yabancidizi:show:", "");
            var showUrl = BASE_URL + "/dizi/" + showSlug;
            var res = yield safeFetch(showUrl, { headers: HEADERS, signal });
            if (!res.ok) return { meta: null };
            var html = yield res.text();
            var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "Yabanc\u0131Dizi";
            var ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
            var poster = ogImg ? ogImg[1] : "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png";
            var epMatches = [...html.matchAll(/(?:dizi\/[^"'\s]*\/)?sezon-(\d+)\/bolum-(\d+)/gi)];
            var videos = [];
            var seen = /* @__PURE__ */ new Set();
            for (var ep of epMatches) {
              var sNum = parseInt(ep[1]);
              var eNum = parseInt(ep[2]);
              var key = sNum + "x" + eNum;
              if (seen.has(key)) continue;
              seen.add(key);
              videos.push({
                id: "yabancidizi:ep:" + showSlug + ":" + sNum + ":" + eNum,
                title: sNum + ". Sezon " + eNum + ". B\xF6l\xFCm",
                season: sNum,
                episode: eNum
              });
            }
            videos.sort(function(a, b) {
              return a.season - b.season || a.episode - b.episode;
            });
            return {
              meta: {
                id: rawId,
                type: "tv",
                name: title,
                poster,
                background: poster,
                description: title + " - Yabanc\u0131Dizi",
                genres: ["Yabanc\u0131 Dizi", "Yabanc\u0131Dizi"],
                videos
              }
            };
          }
          return { meta: null };
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return { meta: null };
        }
      });
    }
    function parseMasterVariants(masterContent, masterUrl) {
      var lines = masterContent.split(/\r?\n/);
      var variants = [];
      var currentStreamInf = null;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.indexOf("#EXT-X-STREAM-INF:") === 0) {
          currentStreamInf = line;
        } else if (line && line.indexOf("#") !== 0 && currentStreamInf) {
          var variantUrl = line;
          if (variantUrl.indexOf("http") !== 0) {
            try {
              variantUrl = new URL(variantUrl, masterUrl).toString();
            } catch (_) {
            }
          }
          var resMatch = currentStreamInf.match(/RESOLUTION=(\d+)x(\d+)/i);
          var width = resMatch ? parseInt(resMatch[1], 10) : 0;
          var height = resMatch ? parseInt(resMatch[2], 10) : 0;
          var bwMatch = currentStreamInf.match(/BANDWIDTH=(\d+)/i);
          var bandwidth = bwMatch ? parseInt(bwMatch[1], 10) : 0;
          var quality = "1080p";
          if (height >= 1080 || width >= 1920) quality = "1080p";
          else if (height >= 720 || width >= 1280) quality = "720p";
          else if (height >= 480 || width >= 800) quality = "480p";
          else if (height > 0) quality = height + "p";
          variants.push({
            url: variantUrl,
            quality,
            height,
            width,
            bandwidth
          });
          currentStreamInf = null;
        }
      }
      return variants;
    }
    function resolveVidmolyStreams(m3u8Url, langText, seenUrls, signal) {
      return __async(this, null, function* () {
        var vmHeaders = {
          "User-Agent": HEADERS["User-Agent"],
          "Referer": "https://vidmoly.biz/"
        };
        var streams = [];
        var variants = [];
        try {
          var mRes = yield safeFetch(m3u8Url, {
            headers: vmHeaders,
            signal
          });
          if (mRes.ok) {
            var mText = yield mRes.text();
            variants = parseMasterVariants(mText, m3u8Url);
          }
        } catch (_) {
        }
        var langLabel = langText ? " (" + langText + ")" : "";
        if (variants && variants.length > 0) {
          for (var v of variants) {
            if (seenUrls.has(v.url)) continue;
            seenUrls.add(v.url);
            var qLabel = v.quality || "1080p";
            var fastHint = qLabel === "720p" || qLabel === "480p" ? " \u26A1 H\u0131zl\u0131" : "";
            streams.push({
              name: "YDZ",
              title: "\u231C YDZ \u231F | VidMoly [" + qLabel + fastHint + "]" + langLabel,
              url: v.url,
              quality: qLabel,
              format: "hls",
              isHls: true,
              provider: "yabancidizi",
              headers: vmHeaders,
              behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                  request: vmHeaders
                }
              }
            });
          }
        }
        if (streams.length === 0 && !seenUrls.has(m3u8Url)) {
          seenUrls.add(m3u8Url);
          streams.push({
            name: "YDZ",
            title: "\u231C YDZ \u231F | VidMoly [1080p]" + langLabel,
            url: m3u8Url,
            quality: "1080p",
            format: "hls",
            isHls: true,
            provider: "yabancidizi",
            headers: vmHeaders,
            behaviorHints: {
              notWebReady: true,
              proxyHeaders: {
                request: vmHeaders
              }
            }
          });
        }
        return streams;
      });
    }
    function extractStreamsFromPage(pageUrl, signal) {
      return __async(this, null, function* () {
        try {
          var pageRes = yield safeFetch(pageUrl, {
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": BASE_URL + "/"
            },
            signal
          });
          if (!pageRes.ok) return [];
          var html = yield pageRes.text();
          var dlRegex = /<a[^>]+href=["'](https?:\/\/vidmoly\.[a-z0-9]+\/dl\/([a-zA-Z0-9_-]+))["'][^>]*>([\s\S]*?)<\/a>/gi;
          var vmRegex = /vidmoly\.[a-z0-9]+\/(?:dl\/|embed-)([a-zA-Z0-9_-]+)/gi;
          var streams = [];
          var seenUrls = /* @__PURE__ */ new Set();
          var seenIds = /* @__PURE__ */ new Set();
          var m;
          while ((m = dlRegex.exec(html)) !== null) {
            var vidId = m[2];
            var label = m[3].replace(/<[^>]+>/g, "").trim();
            if (seenIds.has(vidId)) continue;
            seenIds.add(vidId);
            var langText = "T\xFCrk\xE7e Altyaz\u0131l\u0131";
            if (/dublaj/i.test(label)) langText = "T\xFCrk\xE7e Dublaj";
            else if (/ingilizce/i.test(label)) langText = "\u0130ngilizce Altyaz\u0131l\u0131";
            var embedUrl = "https://vidmoly.biz/embed-" + vidId + ".html";
            try {
              var vmRes = yield safeFetch(embedUrl, {
                headers: {
                  "User-Agent": HEADERS["User-Agent"],
                  "Referer": BASE_URL + "/"
                },
                signal
              });
              if (vmRes.ok) {
                var vmHtml = yield vmRes.text();
                var m3u8Match = vmHtml.match(/file\s*:\s*['"](https?:\/\/[^'"<>]+\.m3u8[^'"<>]*)['"]/i);
                if (m3u8Match) {
                  var resolved = yield resolveVidmolyStreams(m3u8Match[1], langText, seenUrls, signal);
                  for (var rs of resolved) streams.push(rs);
                }
              }
            } catch (err) {
              if (err && (err.name === "AbortError" || err.message === "TIMEOUT" || err.name === "ProviderError" || signal && signal.aborted)) {
                throw err;
              }
            }
          }
          while ((m = vmRegex.exec(html)) !== null) {
            var vidId2 = m[1];
            if (seenIds.has(vidId2)) continue;
            seenIds.add(vidId2);
            var embedUrl2 = "https://vidmoly.biz/embed-" + vidId2 + ".html";
            try {
              var vmRes2 = yield safeFetch(embedUrl2, {
                headers: {
                  "User-Agent": HEADERS["User-Agent"],
                  "Referer": BASE_URL + "/"
                },
                signal
              });
              if (vmRes2.ok) {
                var vmHtml2 = yield vmRes2.text();
                var m3u8Match2 = vmHtml2.match(/file\s*:\s*['"](https?:\/\/[^'"<>]+\.m3u8[^'"<>]*)['"]/i);
                if (m3u8Match2) {
                  var resolved2 = yield resolveVidmolyStreams(m3u8Match2[1], "", seenUrls, signal);
                  for (var rs2 of resolved2) streams.push(rs2);
                }
              }
            } catch (e) {
              if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
                throw e;
              }
            }
          }
          return streams;
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return [];
        }
      });
    }
    var extractStreamsFromEpisodePage = extractStreamsFromPage;
    function getStreams(tmdbIdOrArgs, mediaType, seasonNum, episodeNum, options) {
      return __async(this, null, function* () {
        const signal = options && options.signal;
        try {
          if (typeof tmdbIdOrArgs === "object" && tmdbIdOrArgs && tmdbIdOrArgs.id) {
            return getStreams(tmdbIdOrArgs.id, mediaType || tmdbIdOrArgs.type, seasonNum || tmdbIdOrArgs.season, episodeNum || tmdbIdOrArgs.episode, options);
          }
          if (typeof tmdbIdOrArgs === "string" && tmdbIdOrArgs.startsWith("yabancidizi:ep:")) {
            var parts = tmdbIdOrArgs.replace("yabancidizi:ep:", "").split(":");
            var sSlug = parts[0];
            var s = parts[1] || "1";
            var e = parts[2] || "1";
            var epUrl = BASE_URL + "/dizi/" + sSlug + "/sezon-" + s + "/bolum-" + e;
            return yield extractStreamsFromEpisodePage(epUrl, signal);
          }
          if (typeof tmdbIdOrArgs === "string" && tmdbIdOrArgs.startsWith("yabancidizi:show:")) {
            var showMeta = yield getMeta(tmdbIdOrArgs, signal);
            if (showMeta && showMeta.meta && Array.isArray(showMeta.meta.videos) && showMeta.meta.videos.length > 0) {
              return yield getStreams(showMeta.meta.videos[0].id, mediaType, seasonNum, episodeNum, options);
            }
          }
          var isMovie = mediaType === "movie";
          var season = isMovie ? 1 : parseInt(seasonNum) || 1;
          var episode = isMovie ? 1 : parseInt(episodeNum) || 1;
          var info = yield resolveTmdbInfo(tmdbIdOrArgs, mediaType, signal);
          var isPureTurkish = info.origLanguage === "tr" && Array.isArray(info.originCountries) && info.originCountries.length === 1 && info.originCountries[0] === "TR";
          if (isPureTurkish) {
            return [];
          }
          var searchTitles = [info.origTitle, info.title].filter(Boolean);
          if (searchTitles.length === 0) return [];
          for (var title of searchTitles) {
            var results = yield searchYabanciDizi(title, signal);
            if (results.length === 0) {
              var cat = yield getCatalog({ query: title }, signal);
              if (cat && cat.metas && cat.metas.length > 0) {
                results = cat.metas.map(function(m) {
                  return {
                    s_name: m.name,
                    s_link: m.id.replace("yabancidizi:show:", ""),
                    s_type: m.type === "movie" ? "1" : "0"
                  };
                });
              }
            }
            if (results.length === 0) continue;
            var filteredResults = results.filter(function(r) {
              if (isMovie) return r.s_type === "1";
              return r.s_type === "0" || !r.s_type;
            });
            if (filteredResults.length === 0) continue;
            var candidates = filteredResults.map(function(r) {
              return {
                title: r.s_name,
                year: r.s_year || "",
                slug: r.s_link,
                href: isMovie ? "/film/" + r.s_link : "/dizi/" + r.s_link,
                raw: r
              };
            });
            var matched = pickBestCandidate(candidates, title, info.year, { minCoverage: 0.75, minScore: 50 });
            if (!matched || !matched.raw) continue;
            var matchedShow = matched.raw;
            var targetUrl = isMovie || matchedShow.s_type === "1" ? BASE_URL + "/film/" + matchedShow.s_link : BASE_URL + "/dizi/" + matchedShow.s_link + "/sezon-" + season + "/bolum-" + episode;
            var streams = yield extractStreamsFromPage(targetUrl, signal);
            if (streams.length > 0) return streams;
          }
          return [];
        } catch (e2) {
          if (e2 && (e2.name === "AbortError" || e2.message === "TIMEOUT" || e2.name === "ProviderError" || signal && signal.aborted)) {
            throw e2;
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
      module2.exports = wrapAll({ getStreams, getMeta, getCatalog }, cfgReady);
    }
    if (typeof globalThis !== "undefined") {
      globalThis.getStreams = getStreams;
      globalThis.getMeta = getMeta;
      globalThis.getCatalog = getCatalog;
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
var provider = require_yabancidizi();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "yabancidizi", "id": "mum_yabancidizi", "name": "YDZ", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "unverified", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
