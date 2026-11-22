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
    module2.exports = {
      DEFAULT_UA,
      timeoutSignal,
      combineSignals,
      fetchWithTimeout
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

// src/roketdizi/index.js
var require_roketdizi = __commonJS({
  "src/roketdizi/index.js"(exports2, module2) {
    var _nodeCrypto = null;
    try {
      _nodeCrypto = require("crypto");
    } catch (_) {
    }
    function getCryptoJS() {
      if (typeof globalThis !== "undefined" && globalThis.CryptoJS) return globalThis.CryptoJS;
      if (typeof CryptoJS !== "undefined") return CryptoJS;
      try {
        return require("crypto-js");
      } catch (_) {
        return null;
      }
    }
    var cheerio = require("cheerio-without-node-native");
    var { sortStreamsByQuality, filterHighestQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { fetchWithTimeout } = require_http();
    var { ProviderError } = require_errors();
    var { pickBestCandidate } = require_matching();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v = val("urls.series.roketdizi.base") || val("urls.movies.roketdizi.base") || val("urls.roketdizi.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + "/";
        }).catch(function() {
        });
      }
      return _cfgReady;
    }
    var PROVIDER_NAME = "RoketDizi";
    var BASE_URL = "https://roketdizi.life";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var WORKING_HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    function resolveTmdbInfo(id, mediaType, signal) {
      return __async(this, null, function* () {
        try {
          var cleanId = String(id || "").trim();
          if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
          var numericId = null;
          var titleTr = "";
          var titleEn = "";
          var origTitle = "";
          var year = "";
          var originCountries = [];
          var origLanguage = "";
          var imdbId = cleanId.startsWith("tt") ? cleanId : null;
          if (cleanId.startsWith("tt")) {
            var findRes = yield fetchWithTimeout(
              "https://api.themoviedb.org/3/find/" + cleanId + "?api_key=" + TMDB_API_KEY + "&external_source=imdb_id",
              { signal },
              8e3
            );
            if (findRes.ok) {
              var fData = yield findRes.json();
              var item = mediaType === "movie" ? fData.movie_results && fData.movie_results[0] : fData.tv_results && fData.tv_results[0] || fData.movie_results && fData.movie_results[0];
              if (item) {
                numericId = item.id;
                titleEn = item.title || item.name || "";
                origTitle = item.original_title || item.original_name || "";
                var date = item.release_date || item.first_air_date || "";
                if (date) year = String(date).split("-")[0];
                if (Array.isArray(item.origin_country)) originCountries = item.origin_country;
                if (item.original_language) origLanguage = item.original_language;
              }
            }
          } else {
            numericId = cleanId;
          }
          if (numericId) {
            var endpoint = mediaType === "movie" ? "movie" : "tv";
            var tRes = yield fetchWithTimeout(
              "https://api.themoviedb.org/3/" + endpoint + "/" + numericId + "?api_key=" + TMDB_API_KEY + "&language=tr-TR",
              { signal },
              8e3
            );
            if (tRes.ok) {
              var tData = yield tRes.json();
              titleTr = tData.title || tData.name || "";
              origTitle = tData.original_title || tData.original_name || origTitle;
              var tDate = tData.release_date || tData.first_air_date || "";
              if (!year && tDate) year = String(tDate).split("-")[0];
              if (Array.isArray(tData.origin_country) && tData.origin_country.length > 0) {
                originCountries = tData.origin_country;
              } else if (Array.isArray(tData.production_countries) && tData.production_countries.length > 0) {
                originCountries = tData.production_countries.map(function(p) {
                  return p.iso_3166_1;
                }).filter(Boolean);
              }
              if (tData.original_language) origLanguage = tData.original_language;
              if (tData.external_ids && tData.external_ids.imdb_id) imdbId = tData.external_ids.imdb_id;
              else if (tData.imdb_id) imdbId = tData.imdb_id;
            }
            var enRes = yield fetchWithTimeout(
              "https://api.themoviedb.org/3/" + endpoint + "/" + numericId + "?api_key=" + TMDB_API_KEY + "&language=en-US",
              { signal },
              8e3
            );
            if (enRes.ok) {
              var enData = yield enRes.json();
              titleEn = enData.title || enData.name || titleEn;
              if (!origTitle) origTitle = enData.original_title || enData.original_name || "";
              var enDate = enData.release_date || enData.first_air_date || "";
              if (!year && enDate) year = String(enDate).split("-")[0];
              if (!origLanguage && enData.original_language) origLanguage = enData.original_language;
              if (!imdbId && enData.external_ids && enData.external_ids.imdb_id) imdbId = enData.external_ids.imdb_id;
            }
          }
          var title = titleTr || titleEn || origTitle;
          return {
            title,
            titleTr,
            titleEn,
            origTitle,
            numericId,
            year,
            originCountries,
            origLanguage,
            imdbId
          };
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
          return {
            title: "",
            titleTr: "",
            titleEn: "",
            origTitle: "",
            numericId: id,
            year: "",
            originCountries: [],
            origLanguage: "",
            imdbId: typeof id === "string" && id.startsWith("tt") ? id.split(":")[0] : null
          };
        }
      });
    }
    function parseSearchResults(html) {
      var $ = cheerio.load(html);
      var candidates = [];
      var seenHrefs = /* @__PURE__ */ Object.create(null);
      $("a[href]").each(function(i, el) {
        var href = $(el).attr("href");
        if (!href || seenHrefs[href]) return;
        if (href.startsWith("/dizi/") || href.startsWith("/film/")) {
          seenHrefs[href] = true;
          var aria = $(el).attr("aria-label") || "";
          var title = "";
          var year = "";
          if (aria) {
            var ariaMatch = aria.match(/^(.*?),\s*(\d{4})/);
            if (ariaMatch) {
              title = ariaMatch[1].trim();
              year = ariaMatch[2].trim();
            } else {
              var parts = aria.split(",").map(function(s) {
                return s.trim();
              });
              title = parts[0] || "";
              if (parts[1] && /^\d{4}$/.test(parts[1])) year = parts[1];
            }
          }
          if (!title) {
            title = $(el).text().trim() || href.replace("/izle", "").split("/").filter(Boolean).pop();
          }
          var slug = href.replace("/izle", "").split("/").filter(Boolean).pop();
          candidates.push({
            title,
            href,
            slug,
            year,
            type: href.startsWith("/film/") ? "movie" : "tv"
          });
        }
      });
      var scriptRegex = /"items":\s*(\[[^\]]+\])/g;
      var match;
      while ((match = scriptRegex.exec(html)) !== null) {
        try {
          var items = JSON.parse(match[1]);
          for (var j = 0; j < items.length; j++) {
            var item = items[j];
            var itemHref = item.href;
            if (!itemHref || seenHrefs[itemHref]) continue;
            seenHrefs[itemHref] = true;
            var itemSlug = itemHref.replace("/izle", "").split("/").filter(Boolean).pop();
            candidates.push({
              title: item.t || item.title || itemSlug,
              href: itemHref,
              slug: itemSlug,
              year: String(item.year || item._year || ""),
              type: item.kind === "film" || itemHref.startsWith("/film/") ? "movie" : "tv"
            });
          }
        } catch (_) {
        }
      }
      return candidates;
    }
    function searchRoketDizi(query, mediaType, signal) {
      return __async(this, null, function* () {
        var searchUrls = [];
        if (mediaType === "movie") {
          searchUrls.push(BASE_URL + "/film-izle?s=" + encodeURIComponent(query));
          searchUrls.push(BASE_URL + "/arama-yap?s=" + encodeURIComponent(query));
        } else {
          searchUrls.push(BASE_URL + "/arama-yap?s=" + encodeURIComponent(query));
          searchUrls.push(BASE_URL + "/film-izle?s=" + encodeURIComponent(query));
        }
        var candidates = [];
        var seen = /* @__PURE__ */ Object.create(null);
        for (var u of searchUrls) {
          try {
            var res = yield fetchWithTimeout(u, { headers: WORKING_HEADERS, signal }, 8e3);
            if (res.status === 403) {
              throw new ProviderError("HTTP_BLOCKED", "RoketDizi Cloudflare Challenge", "search", 403);
            }
            if (res.ok) {
              var html = yield res.text();
              var cands = parseSearchResults(html);
              for (var c of cands) {
                if (!seen[c.href]) {
                  seen[c.href] = true;
                  candidates.push(c);
                }
              }
              if (candidates.length > 0) break;
            }
          } catch (e) {
            if (e && e.code === "HTTP_BLOCKED") throw e;
          }
        }
        return candidates;
      });
    }
    function extractEncParams(html) {
      if (!html) return null;
      var encMatch = html.match(/\\"enc\\"\s*:\s*\{\\"ciphertext\\"\s*:\s*\\"([^"\\]+)\\",\\"iv\\"\s*:\s*\\"([0-9a-fA-F]+)\\",\\"salt\\"\s*:\s*\\"([0-9a-fA-F]+)\\"\}\s*,\s*\\"k\\"\s*:\s*\\"([^"\\]+)\\"/);
      if (encMatch) {
        return {
          ciphertext: encMatch[1],
          iv: encMatch[2],
          salt: encMatch[3],
          k: encMatch[4]
        };
      }
      var unescapedMatch = html.match(/"enc"\s*:\s*\{"ciphertext"\s*:\s*"([^"]+)","iv"\s*:\s*"([0-9a-fA-F]+)","salt"\s*:\s*"([0-9a-fA-F]+)"\}\s*,\s*"k"\s*:\s*"([^"]+)"/);
      if (unescapedMatch) {
        return {
          ciphertext: unescapedMatch[1],
          iv: unescapedMatch[2],
          salt: unescapedMatch[3],
          k: unescapedMatch[4]
        };
      }
      return null;
    }
    function decryptPlayer(enc) {
      if (!enc || !enc.ciphertext || !enc.iv || !enc.salt || !enc.k) return null;
      var CJS = getCryptoJS();
      if (CJS && CJS.PBKDF2 && CJS.AES && CJS.enc) {
        try {
          var saltWa = CJS.enc.Hex.parse(enc.salt);
          var ivWa = CJS.enc.Hex.parse(enc.iv);
          var hasher = CJS.algo && CJS.algo.SHA512 || "SHA512";
          var keyWa = CJS.PBKDF2(enc.k, saltWa, { keySize: 8, iterations: 999, hasher });
          var mode = CJS.mode && CJS.mode.CBC || "CBC";
          var padding = CJS.pad && CJS.pad.Pkcs7 || "Pkcs7";
          var decWa = CJS.AES.decrypt(enc.ciphertext, keyWa, { iv: ivWa, mode, padding });
          var result = decWa.toString(CJS.enc.Utf8);
          if (result) return result.trim();
        } catch (_) {
        }
      }
      if (_nodeCrypto && typeof Buffer !== "undefined") {
        try {
          var key = _nodeCrypto.pbkdf2Sync(Buffer.from(enc.k, "utf8"), Buffer.from(enc.salt, "hex"), 999, 32, "sha512");
          var decipher = _nodeCrypto.createDecipheriv("aes-256-cbc", key, Buffer.from(enc.iv, "hex"));
          var decrypted = Buffer.concat([
            decipher.update(Buffer.from(enc.ciphertext, "base64")),
            decipher.final()
          ]).toString("utf8");
          return decrypted.trim();
        } catch (_) {
        }
      }
      return null;
    }
    function solveNpGate(gate) {
      if (!gate || !gate.n) return null;
      var nonce = gate.n;
      var cmiy = String.fromCharCode(75, 83, 102, 76, 107, 83, 86, 73, 77, 84);
      var CJS = getCryptoJS();
      if (CJS && CJS.SHA256) {
        try {
          for (var i = 0; i <= 1e4; i++) {
            var hashWa = CJS.SHA256(i + "|" + cmiy + "|" + nonce);
            if (hashWa && hashWa.words && hashWa.words[5] >>> 20 === 0) {
              return String(i);
            }
          }
        } catch (_) {
        }
      }
      if (_nodeCrypto && typeof Buffer !== "undefined") {
        try {
          for (var j = 0; j <= 1e4; j++) {
            var hash = _nodeCrypto.createHash("sha256").update(j + "|" + cmiy + "|" + nonce).digest();
            if (hash.readUInt32BE(20) >>> 20 === 0) {
              return j.toString();
            }
          }
        } catch (_) {
        }
      }
      return null;
    }
    function parseNpGate(html) {
      if (!html) return null;
      var match = html.match(/(?:window\.)?NP_GATE\s*=\s*({[\s\S]*?});/i);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch (_) {
          try {
            var fixed = match[1].replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":').replace(/'/g, '"');
            return JSON.parse(fixed);
          } catch (_2) {
            try {
              return new Function("return " + match[1])();
            } catch (_3) {
            }
          }
        }
      }
      var nMatch = html.match(/(?:window\.)?NP_GATE[\s\S]*?["']?n["']?\s*:\s*["']?([a-zA-Z0-9_-]+)["']?/i);
      if (nMatch) {
        return { n: nMatch[1] };
      }
      return null;
    }
    function parseNpConfig(html) {
      if (!html) return null;
      var match = html.match(/(?:window\.)?NP_CONFIG\s*=\s*({[\s\S]*?});/i);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch (_) {
          try {
            var fixed = match[1].replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":').replace(/'/g, '"');
            return JSON.parse(fixed);
          } catch (_2) {
            try {
              return new Function("return " + match[1])();
            } catch (_3) {
            }
          }
        }
      }
      var fileMatch = html.match(/["']?file["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
      if (fileMatch) {
        return { file: fileMatch[1] };
      }
      return null;
    }
    function appendSolution(url, solution) {
      if (!url || !solution) return url;
      var sep = url.indexOf("?") >= 0 ? "&" : "?";
      return url + sep + "p=" + solution;
    }
    function toAbsoluteUrl(url, baseUrl) {
      if (!url) return "";
      if (/^https?:\/\//i.test(url)) return url;
      if (url.startsWith("//")) return "https:" + url;
      try {
        return new URL(url, baseUrl).href;
      } catch (_) {
        return url;
      }
    }
    function resolveIframe(iframeUrl, isDublaj, qualityLabel, displayName, seasonNum, episodeNum, mediaType, signal) {
      return __async(this, null, function* () {
        var normalizedIframeUrl = toAbsoluteUrl(iframeUrl, BASE_URL);
        if (!/^https?:\/\//i.test(normalizedIframeUrl)) return null;
        var langFlag = isDublaj ? "\u{1F1F9}\u{1F1F7} T\xFCrk\xE7e Dublaj" : "\u{1F310} T\xFCrk\xE7e Altyaz\u0131";
        var streamTitle = mediaType === "movie" ? "\u231C " + PROVIDER_NAME + " \u231F | RoketTV | " + langFlag : "\u231C " + PROVIDER_NAME + " \u231F | RoketTV | " + langFlag + " \xB7 " + seasonNum + ". Sezon " + episodeNum + ". B\xF6l\xFCm";
        var fallbackHeaders = {
          "User-Agent": WORKING_HEADERS["User-Agent"],
          "Referer": BASE_URL + "/"
        };
        function createFallbackStream() {
          return {
            name: displayName,
            title: streamTitle,
            url: normalizedIframeUrl,
            quality: qualityLabel || "1080p",
            type: "hls",
            headers: fallbackHeaders,
            behaviorHints: {
              notWebReady: true,
              proxyHeaders: { request: fallbackHeaders }
            },
            subtitles: [],
            provider: "roketdizi"
          };
        }
        if (/\.(?:m3u8|mp4)(?:[?#]|$)/i.test(normalizedIframeUrl)) {
          var isDirectMp4 = normalizedIframeUrl.includes(".mp4");
          var dHeaders = {
            "User-Agent": WORKING_HEADERS["User-Agent"],
            "Referer": BASE_URL + "/"
          };
          return {
            name: displayName,
            title: streamTitle,
            url: normalizedIframeUrl,
            quality: qualityLabel || "1080p",
            type: isDirectMp4 ? "mp4" : "hls",
            headers: dHeaders,
            behaviorHints: {
              notWebReady: true,
              proxyHeaders: { request: dHeaders }
            },
            subtitles: [],
            provider: "roketdizi"
          };
        }
        try {
          var res = yield fetchWithTimeout(normalizedIframeUrl, {
            headers: {
              "User-Agent": WORKING_HEADERS["User-Agent"],
              "Referer": BASE_URL + "/",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            },
            signal
          }, 7e3);
          if (!res.ok) {
            return createFallbackStream();
          }
          var iframeHtml = yield res.text();
          var gate = parseNpGate(iframeHtml);
          var solution = solveNpGate(gate);
          var config = parseNpConfig(iframeHtml);
          var streamUrl = "";
          var tracks = [];
          if (config) {
            if (typeof config.file === "string") {
              streamUrl = config.file;
            } else if (Array.isArray(config.sources) && config.sources.length > 0) {
              streamUrl = config.sources[0].file || config.sources[0].src || config.sources[0].url || "";
            } else if (typeof config.stream === "string") {
              streamUrl = config.stream;
            } else if (typeof config.url === "string") {
              streamUrl = config.url;
            }
            if (Array.isArray(config.tracks)) {
              tracks = config.tracks;
            } else if (Array.isArray(config.subtitles)) {
              tracks = config.subtitles;
            }
          }
          if (!streamUrl) {
            var m3u8Match = iframeHtml.match(/["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)["']/i);
            if (m3u8Match) streamUrl = m3u8Match[1];
          }
          if (!streamUrl) {
            return createFallbackStream();
          }
          streamUrl = toAbsoluteUrl(streamUrl, normalizedIframeUrl);
          if (!/^https?:\/\//i.test(streamUrl)) {
            return createFallbackStream();
          }
          var finalStreamUrl = appendSolution(streamUrl, solution);
          var subtitles = [];
          for (var i = 0; i < tracks.length; i++) {
            var t = tracks[i];
            var subFile = t.file || t.src || t.url;
            if (subFile) {
              var fullSubUrl = toAbsoluteUrl(subFile, normalizedIframeUrl);
              if (/^https?:\/\//i.test(fullSubUrl)) {
                subtitles.push({
                  url: appendSolution(fullSubUrl, solution),
                  language: t.srclang || t.language || t.label || "tr",
                  label: t.label || t.title || "T\xFCrk\xE7e"
                });
              }
            }
          }
          if (subtitles.length === 0) {
            var subMatches = iframeHtml.matchAll(/["'](https?:\/\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi);
            for (var sm of subMatches) {
              var sUrl = sm[1];
              if (!subtitles.some(function(x) {
                return x.url.startsWith(sUrl);
              })) {
                subtitles.push({
                  url: appendSolution(sUrl, solution),
                  language: "tr",
                  label: "T\xFCrk\xE7e"
                });
              }
            }
          }
          var sHeaders = {
            "User-Agent": WORKING_HEADERS["User-Agent"],
            "Referer": normalizedIframeUrl
          };
          var isMp4 = finalStreamUrl.includes(".mp4");
          return {
            name: displayName,
            title: streamTitle,
            url: finalStreamUrl,
            quality: qualityLabel || "1080p",
            type: isMp4 ? "mp4" : "hls",
            headers: sHeaders,
            behaviorHints: {
              notWebReady: true,
              proxyHeaders: { request: sHeaders }
            },
            subtitles,
            provider: "roketdizi"
          };
        } catch (err) {
          if (err && (err.name === "AbortError" || err.message === "TIMEOUT")) throw err;
          return createFallbackStream();
        }
      });
    }
    function getStreams(tmdbId, mediaType, seasonNum, episodeNum, options) {
      return __async(this, null, function* () {
        var signal = options && options.signal;
        try {
          mediaType = mediaType === "series" ? "tv" : mediaType;
          var info = yield resolveTmdbInfo(tmdbId, mediaType, signal);
          var isPureTurkishSeries = mediaType !== "movie" && info.origLanguage === "tr" && Array.isArray(info.originCountries) && info.originCountries.length === 1 && info.originCountries[0] === "TR";
          if (isPureTurkishSeries) {
            return [];
          }
          var searchQueries = [...new Set([info.titleTr, info.titleEn, info.origTitle, info.title].filter(Boolean))];
          if (searchQueries.length === 0) {
            return [];
          }
          var best = null;
          for (var q of searchQueries) {
            try {
              var candidates = yield searchRoketDizi(q, mediaType, signal);
              if (candidates && candidates.length > 0) {
                best = pickBestCandidate(candidates, q, info.year, { minCoverage: 0.75, minScore: 50 });
                if (best) break;
              }
            } catch (errSearch) {
              if (errSearch && errSearch.code === "HTTP_BLOCKED") throw errSearch;
            }
          }
          if (!best) {
            throw new ProviderError("NO_MATCH", "No matching title found on RoketDizi", "matching");
          }
          var displayName = info.title || info.origTitle || best.title;
          var pageUrl = "";
          if (mediaType === "movie") {
            var movieSlug = best.slug || best.href.replace("/izle", "").split("/").filter(Boolean).pop();
            pageUrl = BASE_URL + "/film/" + movieSlug + "/izle";
          } else {
            var tvSlug = best.slug || best.href.split("/").filter(Boolean).pop();
            pageUrl = BASE_URL + "/dizi/" + tvSlug + "/sezon-" + seasonNum + "/bolum-" + episodeNum;
          }
          var pageRes = yield fetchWithTimeout(pageUrl, { headers: WORKING_HEADERS, signal }, 8e3);
          if (pageRes.status === 403) {
            throw new ProviderError("HTTP_BLOCKED", "RoketDizi Cloudflare Challenge", "player", 403);
          }
          var pageHtml = "";
          if (pageRes.ok) {
            pageHtml = yield pageRes.text();
          }
          var targetImdb = info.imdbId || (typeof tmdbId === "string" && tmdbId.startsWith("tt") ? tmdbId.split(":")[0] : null);
          if (targetImdb && pageHtml) {
            var imdbMatch = pageHtml.match(/imdb\.com\/title\/(tt\d+)/i) || pageHtml.match(/"(?:mj)?imdb(?:href)?"\s*:\s*"[^"]*?(tt\d+)/i);
            var pageImdb = imdbMatch ? imdbMatch[1].toLowerCase() : null;
            if (pageImdb && pageImdb !== targetImdb.toLowerCase()) {
              return [];
            }
          }
          if (mediaType === "tv" && (!pageHtml || !pageHtml.includes("enc"))) {
            var seriesUrl = BASE_URL + "/dizi/" + tvSlug;
            var seriesRes = yield fetchWithTimeout(seriesUrl, { headers: WORKING_HEADERS, signal }, 8e3);
            if (seriesRes.ok) {
              var seriesHtml = yield seriesRes.text();
              var $s = cheerio.load(seriesHtml);
              var epPattern = new RegExp("/sezon-" + seasonNum + "/bolum-" + episodeNum + "(?:-[a-zA-Z0-9]+)?(?:[/?#]|$)", "i");
              var foundEpHref = null;
              $s("a[href]").each(function(i, el) {
                var h = $s(el).attr("href");
                if (h && epPattern.test(h)) {
                  foundEpHref = h;
                  return false;
                }
              });
              if (foundEpHref) {
                pageUrl = toAbsoluteUrl(foundEpHref, BASE_URL);
                var epRes = yield fetchWithTimeout(pageUrl, { headers: WORKING_HEADERS, signal }, 8e3);
                if (epRes.ok) {
                  pageHtml = yield epRes.text();
                }
              }
            }
          }
          if (!pageHtml) {
            return [];
          }
          var initialEnc = extractEncParams(pageHtml);
          if (!initialEnc) {
            return [];
          }
          var defaultIframe = decryptPlayer(initialEnc);
          if (!defaultIframe) {
            return [];
          }
          var sourcesMatch = pageHtml.match(/\\"sources\\":(\[[^\]]+\])/) || pageHtml.match(/"sources":(\[[^\]]+\])/);
          var sources = [];
          if (sourcesMatch) {
            try {
              var rawSourcesJson = sourcesMatch[1].replace(/\\"/g, '"');
              sources = JSON.parse(rawSourcesJson);
            } catch (_) {
            }
          }
          var isDefaultDub = /"dub":\s*true/i.test(pageHtml) || /Türkçe Dublaj/i.test(pageHtml);
          var playerTasks = [];
          playerTasks.push({
            iframeUrl: defaultIframe,
            isDub: isDefaultDub,
            quality: "1080p"
          });
          var altSource = null;
          for (var s = 0; s < sources.length; s++) {
            var src = sources[s];
            if (!src || !src.href || !src.href.includes("player=")) continue;
            var srcIsDub = src.dub === true || src.label && src.label.includes("Dublaj");
            if (srcIsDub !== isDefaultDub) {
              altSource = src;
              break;
            }
          }
          if (altSource && altSource.href) {
            var altUrl = toAbsoluteUrl(altSource.href, BASE_URL);
            try {
              var altRes = yield fetchWithTimeout(altUrl, { headers: WORKING_HEADERS, signal }, 6e3);
              if (altRes.ok) {
                var altHtml = yield altRes.text();
                var altEnc = extractEncParams(altHtml);
                if (altEnc) {
                  var altIframe = decryptPlayer(altEnc);
                  if (altIframe && altIframe !== defaultIframe) {
                    playerTasks.push({
                      iframeUrl: altIframe,
                      isDub: !isDefaultDub,
                      quality: altSource.quality ? altSource.quality.toLowerCase() : "1080p"
                    });
                  }
                }
              }
            } catch (_) {
            }
          }
          var streams = [];
          var resolvePromises = playerTasks.map(function(task) {
            return resolveIframe(
              task.iframeUrl,
              task.isDub,
              task.quality,
              displayName,
              seasonNum,
              episodeNum,
              mediaType,
              signal
            ).catch(function(err) {
              if (err && err.code === "HTTP_BLOCKED") throw err;
              return null;
            });
          });
          var resolvedResults = yield Promise.all(resolvePromises);
          var seenStreamUrls = /* @__PURE__ */ Object.create(null);
          for (var r = 0; r < resolvedResults.length; r++) {
            var st = resolvedResults[r];
            if (st && st.url && !seenStreamUrls[st.url]) {
              seenStreamUrls[st.url] = true;
              streams.push(st);
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
      module2.exports = wrapAll({
        getStreams,
        decryptPlayer,
        solveNpGate,
        getCryptoJS
      }, cfgReady);
      module2.exports._raw = {
        decryptPlayer,
        solveNpGate,
        getCryptoJS
      };
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
var provider = require_roketdizi();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "roketdizi", "id": "mum_roketdizi", "name": "RoketDizi", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
