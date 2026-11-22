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
      return String(str).toLowerCase().replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[şŞ]/g, "s").replace(/[ıİ]/g, "i").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c").replace(/[âáàÂÁÀ]/g, "a").replace(/[îíÎÍ]/g, "i").replace(/[ûúÛÚ]/g, "u").replace(/[^a-z0-9]+/g, " ").trim();
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

// src/hdfilmdelisi/index.js
var require_hdfilmdelisi = __commonJS({
  "src/hdfilmdelisi/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { pickBestCandidate } = require_matching();
    var { fetchWithTimeout, resolveTmdbMeta } = require_http();
    var { ProviderError } = require_errors();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.movies.hdfilmdelisi.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          if (HEADERS) HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var BASE_URL = "https://hdfilmdelisi.one";
    var DIRECT_PROBE_TIMEOUT_MS = 3e3;
    var HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    var VIDMODY_HEADERS = {
      "User-Agent": HEADERS["User-Agent"],
      "Referer": "https://pl.vixolity.com/",
      "Origin": "https://pl.vixolity.com"
    };
    var VIXOLITY_HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://pl.vixolity.com/",
      "Origin": "https://pl.vixolity.com",
      "Accept": "*/*"
    };
    function resolveTmdbInfo(id, mediaType, signal) {
      return __async(this, null, function* () {
        try {
          var meta = yield resolveTmdbMeta(id, mediaType, { signal });
          return meta || { title: "", origTitle: "", imdbId: "", year: "" };
        } catch (e) {
          if (e && (e.name === "ProviderError" || e.name === "AbortError" || e.message === "TIMEOUT" || signal && signal.aborted)) {
            throw e;
          }
          return { title: "", origTitle: "", imdbId: "", year: "" };
        }
      });
    }
    function apiSearch(query, signal) {
      return __async(this, null, function* () {
        try {
          var res = yield fetchWithTimeout(BASE_URL + "/api/search?q=" + encodeURIComponent(query), {
            headers: { "User-Agent": HEADERS["User-Agent"], "Referer": BASE_URL + "/" },
            signal
          }, 8e3);
          if (!res.ok) return [];
          var data = yield res.json();
          return data && (data.results || data.films) || [];
        } catch (e) {
          if (e && (e.name === "ProviderError" || e.name === "AbortError" || e.message === "TIMEOUT" || signal && signal.aborted)) {
            throw e;
          }
          return [];
        }
      });
    }
    function pickBest(results, title, year) {
      return pickBestCandidate(results, title, year, { minCoverage: 0.75, minScore: 50 });
    }
    function decodeBase64Safe(str) {
      if (typeof atob === "function") {
        return atob(str);
      }
      if (typeof Buffer !== "undefined") {
        return Buffer.from(str, "base64").toString("binary");
      }
      return "";
    }
    function vidmodyDecrypt(hex, key) {
      try {
        var sb = "";
        for (var i = 0; i < hex.length; i += 2) {
          sb += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        var rev = sb.split("").reverse().join("");
        var decoded = decodeBase64Safe(rev);
        if (!decoded) return "";
        var out = "";
        for (var b = 0; b < decoded.length; b++) {
          var byte = typeof decoded[b] === "number" ? decoded[b] : decoded.charCodeAt(b);
          out += String.fromCharCode((byte - key + 256) % 256);
        }
        return out.replace(/\\x([0-9a-fA-F]{2})/g, function(m, h) {
          return String.fromCharCode(parseInt(h, 16));
        });
      } catch (e) {
        return "";
      }
    }
    function vixolityPlayerDecrypt(hex, key) {
      try {
        var s1 = "";
        for (var i = 0; i < hex.length; i += 2) {
          s1 += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        var rev = s1.split("").reverse().join("");
        var s2 = decodeBase64Safe(rev);
        var s3 = "";
        for (var j = 0; j < s2.length; j++) {
          var b = typeof s2[j] === "number" ? s2[j] : s2.charCodeAt(j);
          s3 += String.fromCharCode((b - key + 256) % 256);
        }
        var s4 = decodeBase64Safe(s3);
        try {
          return decodeURIComponent(escape(s4));
        } catch (_) {
          return s4;
        }
      } catch (_) {
        return "";
      }
    }
    function extractVidmodyFile(pageUrl, signal) {
      return __async(this, null, function* () {
        try {
          var res = yield fetchWithTimeout(pageUrl, { headers: HEADERS, signal }, 8e3);
          if (!res.ok) return null;
          var html = yield res.text();
          var pageImdbMatch = html.match(/imdb\.com\/title\/(tt\d{7,10})/i) || html.match(/["']sameAs["']\s*:\s*["'][^"']*(tt\d{7,10})/i);
          if (pageImdbMatch && pageImdbMatch[1]) {
            var fastVixUrl = "https://ha.vixolity.com/vs/" + pageImdbMatch[1];
            try {
              var fvRes = yield fetchWithTimeout(fastVixUrl, { headers: VIXOLITY_HEADERS, signal }, DIRECT_PROBE_TIMEOUT_MS);
              if (fvRes.ok) {
                var fvTxt = yield fvRes.text();
                if (fvTxt.includes("#EXTM3U")) {
                  var fastSubs = parseVixolitySubtitles(fvTxt);
                  return { file: fastVixUrl, playerUrl: pageUrl, subtitles: fastSubs, isHls: true };
                }
              }
            } catch (_) {
            }
          }
          var vixPlayerUrl = null;
          var jsonLdMatch = html.match(/<script[^>]+id=["']jsonld-video["'][^>]*>([\s\S]*?)<\/script>/i);
          if (jsonLdMatch) {
            try {
              var jsonLdData = JSON.parse(jsonLdMatch[1]);
              if (jsonLdData && jsonLdData.embedUrl && jsonLdData.embedUrl.includes("vixolity.com")) {
                vixPlayerUrl = jsonLdData.embedUrl;
              }
            } catch (_) {
            }
          }
          if (!vixPlayerUrl) {
            var plMatch = html.match(/https?:[\\/]+pl\.vixolity\.com[\\/][a-zA-Z0-9=_\-\\\/]+/);
            if (plMatch) vixPlayerUrl = plMatch[0].split("\\").join("/");
          }
          if (vixPlayerUrl) {
            var pRes = yield fetchWithTimeout(vixPlayerUrl, {
              headers: { "User-Agent": HEADERS["User-Agent"], "Referer": pageUrl, "Origin": BASE_URL },
              signal
            }, 8e3);
            if (pRes.ok) {
              var pHtml = yield pRes.text();
              var dMatch = pHtml.match(/\((?:function\s*\([^)]*\)\s*\{[\s\S]*?\})\)\s*\(\s*['"]([0-9a-fA-F]+)['"]\s*,\s*(\d+)\s*\)/);
              if (dMatch) {
                var decrypted = vixolityPlayerDecrypt(dMatch[1], parseInt(dMatch[2], 10));
                var kaynakMatch = decrypted.match(/["']kaynak["']\s*:\s*["']([^"']+)["']/);
                if (kaynakMatch) {
                  var hlsUrl = kaynakMatch[1];
                  var subs = [];
                  try {
                    var hlsRes = yield fetchWithTimeout(hlsUrl, { headers: VIXOLITY_HEADERS, signal }, DIRECT_PROBE_TIMEOUT_MS);
                    if (hlsRes.ok) {
                      var hlsTxt = yield hlsRes.text();
                      if (hlsTxt.includes("#EXTM3U")) {
                        subs = parseVixolitySubtitles(hlsTxt);
                      }
                    }
                  } catch (_) {
                  }
                  return { file: hlsUrl, playerUrl: vixPlayerUrl, subtitles: subs, isHls: true };
                }
              }
            }
          }
          var vm = html.match(/https?:[\\/]+player\.vidmody\.com[\\/][a-zA-Z0-9=\\\/]+/);
          if (!vm) return null;
          var playerUrl = vm[0].split("\\").join("/");
          var pRes2 = yield fetchWithTimeout(playerUrl, {
            headers: { "User-Agent": HEADERS["User-Agent"], "Referer": pageUrl },
            signal
          }, 8e3);
          if (!pRes2.ok) return null;
          var pHtml2 = yield pRes2.text();
          var dMatch2 = pHtml2.match(/(?:decrypt|\))\s*\(\s*["']([0-9a-fA-F]+)["']\s*,\s*(\d+)\s*\)/);
          if (!dMatch2) return null;
          var block = vidmodyDecrypt(dMatch2[1], parseInt(dMatch2[2]));
          var fMatch = block.match(/file:\s*['"](https?:\/\/[^'"]+)['"]/);
          if (!fMatch) return null;
          var subs2 = [];
          var subRe = /https?:\/\/[^\s"'\\]+\.vtt/gi;
          var sm;
          var seen = /* @__PURE__ */ new Set();
          while ((sm = subRe.exec(pHtml2 + " " + block)) !== null) {
            if (seen.has(sm[0]) || /thumb/i.test(sm[0])) continue;
            seen.add(sm[0]);
            var lang = /tur/i.test(sm[0]) ? "tur" : "eng";
            subs2.push({ id: lang, lang, url: sm[0] });
          }
          return { file: fMatch[1], playerUrl, subtitles: subs2 };
        } catch (e) {
          if (e && (e.name === "ProviderError" || e.name === "AbortError" || e.message === "TIMEOUT" || signal && signal.aborted)) {
            throw e;
          }
          return null;
        }
      });
    }
    function parseVixolitySubtitles(playlistText) {
      var subs = [];
      var subRe = /#EXT-X-MEDIA:TYPE=SUBTITLES.*?NAME="([^"]+)".*?LANGUAGE="([^"]+)".*?URI="([^"]+)"/gi;
      var sm;
      var seen = /* @__PURE__ */ new Set();
      while ((sm = subRe.exec(playlistText)) !== null) {
        var name = sm[1];
        var lang = sm[2].toLowerCase();
        var uri = sm[3];
        if (seen.has(uri)) continue;
        seen.add(uri);
        subs.push({
          id: lang,
          lang: lang === "tr" ? "tur" : lang === "en" ? "eng" : lang,
          language: lang,
          label: name,
          name,
          title: name,
          url: uri,
          format: "vtt",
          type: "text/vtt",
          headers: VIXOLITY_HEADERS
        });
      }
      return subs;
    }
    function toVixolityStream(url, subtitles, isSeries, sNum, eNum) {
      var tag = isSeries ? "S" + (sNum || 1) + "E" + (eNum || 1) + " \u2022 [TR Dublaj & Altyaz\u0131l\u0131]" : "[TR Dublaj & Altyaz\u0131l\u0131]";
      return {
        name: "HDFM",
        title: "\u231C HDFM \u231F | Vixolity \u2022 " + tag + " (1080p HLS)",
        url,
        quality: "1080p",
        provider: "hdfilmdelisi",
        headers: VIXOLITY_HEADERS,
        format: "hls",
        isHls: true,
        behaviorHints: { notWebReady: true, proxyHeaders: { request: VIXOLITY_HEADERS } },
        subtitles: subtitles || []
      };
    }
    function toStream(file, subtitles) {
      var isHls = /\.m3u8/i.test(file) || file.includes("vixolity.com/vs/") || file.includes("vidmody.com/vs/");
      var headers = file.includes("vixolity.com") ? VIXOLITY_HEADERS : isHls && file.includes("vidmody.com") ? { "User-Agent": HEADERS["User-Agent"], "Referer": "https://vidmody.com/" } : { "User-Agent": HEADERS["User-Agent"], "Referer": "https://player.vidmody.com/" };
      var streamTitle = file.includes("vixolity.com") ? "\u231C HDFM \u231F | Vixolity \u2022 [TR Dublaj & Altyaz\u0131l\u0131] (1080p HLS)" : "\u231C HDFM \u231F | 1080p HLS";
      return {
        name: "HDFM",
        title: streamTitle,
        url: file,
        quality: "1080p",
        provider: "hdfilmdelisi",
        headers,
        format: "hls",
        isHls: true,
        behaviorHints: { notWebReady: true, proxyHeaders: { request: headers } },
        subtitles: subtitles || []
      };
    }
    function getCatalog(args) {
      return __async(this, null, function* () {
        try {
          var query = args && args.search || args && args.extra && args.extra.search || args && args.query || "";
          var url = query ? BASE_URL + "/api/search?q=" + encodeURIComponent(query) : BASE_URL + "/api/films?page=1&sort=newest&limit=20";
          var res = yield fetchWithTimeout(url, { headers: { "User-Agent": HEADERS["User-Agent"] } }, 15e3);
          if (!res.ok) return { metas: [] };
          var data = yield res.json();
          var items = data.results || data.films || [];
          var metas = items.slice(0, 30).map(function(f) {
            var title = f.baslik || f.title || "Film";
            return {
              id: "hdfilmdelisi:movie:" + (f.slug || f.id),
              type: "movie",
              name: title + (f.yayinYili ? " (" + f.yayinYili + ")" : ""),
              poster: f.afis || "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              background: f.afis || "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              genres: [f.kategoriler && f.kategoriler[0] && f.kategoriler[0].ad || "Film", "HDFilmDelisi"],
              description: (f.orijinalBaslik || title) + " - HDFilmDelisi"
            };
          });
          return { metas };
        } catch (e) {
          return { metas: [] };
        }
      });
    }
    function getMeta(args) {
      return __async(this, null, function* () {
        try {
          var rawId = typeof args === "string" ? args : args && args.id ? args.id : "";
          if (!rawId || !rawId.startsWith("hdfilmdelisi:")) return { meta: null };
          var slug = rawId.split(":").slice(2).join(":");
          var pageUrl = BASE_URL + "/film/" + slug;
          var res = yield fetchWithTimeout(pageUrl, { headers: HEADERS }, 15e3);
          if (!res.ok) return { meta: null };
          var html = yield res.text();
          var titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          var title = titleMatch ? titleMatch[1].split("|")[0].split("-")[0].trim() : "HDFilmDelisi";
          var ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
          var poster = ogImg ? ogImg[1] : "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png";
          return {
            meta: {
              id: rawId,
              type: "movie",
              name: title,
              poster,
              background: poster,
              description: title + " - HDFilmDelisi",
              genres: ["Film", "HDFilmDelisi"],
              videos: [{ id: rawId, title, released: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] }]
            }
          };
        } catch (e) {
          return { meta: null };
        }
      });
    }
    function getStreams(tmdbIdOrArgs, mediaType, seasonNum, episodeNum, options) {
      return __async(this, null, function* () {
        var signal = options && options.signal;
        try {
          var id = tmdbIdOrArgs;
          var isSeries = mediaType === "tv" || mediaType === "series";
          var s = seasonNum || 1;
          var e = episodeNum || 1;
          if (typeof tmdbIdOrArgs === "object" && tmdbIdOrArgs && tmdbIdOrArgs.id) {
            id = tmdbIdOrArgs.id;
            if (tmdbIdOrArgs.type) isSeries = tmdbIdOrArgs.type === "tv" || tmdbIdOrArgs.type === "series";
            if (tmdbIdOrArgs.season) s = tmdbIdOrArgs.season;
            if (tmdbIdOrArgs.episode) e = tmdbIdOrArgs.episode;
            options = tmdbIdOrArgs.options || options;
            signal = options && options.signal;
          }
          var cleanId = String(id || "").trim().replace(/^(?:movie|tv|series|tmdb|imdb):+/i, "");
          if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
          var streams = [];
          var seenUrls = /* @__PURE__ */ new Set();
          if (typeof id === "string" && id.startsWith("hdfilmdelisi:movie:")) {
            var slug = id.split(":").slice(2).join(":");
            var apiRes = yield fetchWithTimeout(BASE_URL + "/api/films/" + slug, { headers: HEADERS, signal }, 8e3);
            if (apiRes.ok) {
              var fData = yield apiRes.json();
              if (fData && fData.imdbId && fData.imdbId.startsWith("tt")) {
                var directVix = "https://ha.vixolity.com/vs/" + fData.imdbId;
                var vr = yield fetchWithTimeout(directVix, { headers: VIXOLITY_HEADERS, signal }, DIRECT_PROBE_TIMEOUT_MS);
                if (vr.ok) {
                  var vt = yield vr.text();
                  var subs = parseVixolitySubtitles(vt);
                  streams.push(toVixolityStream(directVix, subs, false));
                  seenUrls.add(directVix);
                }
              }
            }
            var found = yield extractVidmodyFile(BASE_URL + "/film/" + slug, signal);
            if (found && !seenUrls.has(found.file)) {
              streams.push(toStream(found.file, found.subtitles));
              seenUrls.add(found.file);
            }
            if (streams.length > 0) return streams;
          }
          var targetImdbId = cleanId.startsWith("tt") ? cleanId : null;
          if (targetImdbId) {
            var vixUrl = isSeries ? "https://ha.vixolity.com/vs/" + targetImdbId + "/s" + s + "/e" + (e < 10 ? "0" + e : e) : "https://ha.vixolity.com/vs/" + targetImdbId;
            try {
              var vRes = yield fetchWithTimeout(vixUrl, { headers: VIXOLITY_HEADERS, signal }, DIRECT_PROBE_TIMEOUT_MS);
              if (vRes.ok) {
                var vTxt = yield vRes.text();
                if (vTxt.includes("#EXTM3U")) {
                  var vSubs = parseVixolitySubtitles(vTxt);
                  streams.push(toVixolityStream(vixUrl, vSubs, isSeries, s, e));
                  seenUrls.add(vixUrl);
                  return streams;
                }
              }
            } catch (vErr) {
              if (signal && signal.aborted) throw vErr;
            }
          }
          var info = yield resolveTmdbInfo(cleanId, isSeries ? "tv" : "movie", signal);
          if (!targetImdbId && info && info.imdbId && info.imdbId.startsWith("tt")) {
            targetImdbId = info.imdbId;
            var vixUrl2 = isSeries ? "https://ha.vixolity.com/vs/" + targetImdbId + "/s" + s + "/e" + (e < 10 ? "0" + e : e) : "https://ha.vixolity.com/vs/" + targetImdbId;
            try {
              var vRes2 = yield fetchWithTimeout(vixUrl2, { headers: VIXOLITY_HEADERS, signal }, DIRECT_PROBE_TIMEOUT_MS);
              if (vRes2.ok) {
                var vTxt2 = yield vRes2.text();
                if (vTxt2.includes("#EXTM3U")) {
                  var vSubs2 = parseVixolitySubtitles(vTxt2);
                  streams.push(toVixolityStream(vixUrl2, vSubs2, isSeries, s, e));
                  seenUrls.add(vixUrl2);
                  return streams;
                }
              }
            } catch (vErr2) {
              if (signal && signal.aborted) throw vErr2;
            }
          }
          var searchTitles = [info.title, info.origTitle].filter(Boolean);
          var hadResults = false;
          for (var t = 0; t < searchTitles.length; t++) {
            var results = yield apiSearch(searchTitles[t], signal);
            if (!results || results.length === 0) continue;
            hadResults = true;
            var best = pickBest(results, searchTitles[t], info.year);
            if (!best || !best.slug) continue;
            if (best.imdbId && best.imdbId.startsWith("tt") && !seenUrls.has("https://ha.vixolity.com/vs/" + best.imdbId)) {
              var sUrl = "https://ha.vixolity.com/vs/" + best.imdbId;
              try {
                var sRes = yield fetchWithTimeout(sUrl, { headers: VIXOLITY_HEADERS, signal }, DIRECT_PROBE_TIMEOUT_MS);
                if (sRes.ok) {
                  var sTxt = yield sRes.text();
                  if (sTxt.includes("#EXTM3U")) {
                    var sSubs = parseVixolitySubtitles(sTxt);
                    streams.push(toVixolityStream(sUrl, sSubs, false));
                    seenUrls.add(sUrl);
                  }
                }
              } catch (_) {
              }
            }
            var vf = yield extractVidmodyFile(BASE_URL + "/film/" + best.slug, signal);
            if (vf && !seenUrls.has(vf.file)) {
              streams.push(toStream(vf.file, vf.subtitles));
              seenUrls.add(vf.file);
            }
            if (streams.length > 0) break;
          }
          if (streams.length === 0 && hadResults) {
            throw new ProviderError("NO_MATCH", "HDFilmDelisi e\u015Fle\u015Fen film bulamad\u0131", "matching");
          }
          return streams;
        } catch (e2) {
          if (e2 && (e2.name === "ProviderError" || e2.name === "AbortError" || e2.message === "TIMEOUT" || signal && signal.aborted)) {
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
          return sortStreamsByQuality(res);
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
var provider = require_hdfilmdelisi();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "hdfilmdelisi", "id": "mum_hdfilmdelisi", "name": "HDFM", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
