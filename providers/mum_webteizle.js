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
          ddizibox: {
            base: "https://ddizibox.com"
          },
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
          diziboxizle: {
            base: "https://diziboxizle.com"
          }
        },
        movies: {
          hdfilmcehennemi: {
            base: "https://www.hdfilmcehennemi.nl"
          },
          hdfilmdelisi: {
            base: "https://hdfilmdelisi.one"
          },
          hdfilmizle: {
            bases: [
              "https://www.hdfilmizle.ink",
              "https://www.hdfilmizle.vip"
            ]
          },
          setfilmizle: {
            base: "https://www.setfilmizle.ltd"
          },
          vidmody: {
            base: "https://ha.vixolity.com"
          },
          webteizle: {
            base: "https://webteizle.info"
          }
        },
        meta_resolvers: {
          vidlink: {
            api: "https://vidlink.pro/api/b",
            enc_dec: "https://enc-dec.app/api",
            base: "https://vidlink.pro"
          }
        }
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
      "full"
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
        return last.replace(/-film-izle.*$/i, "").replace(/-izle.*$/i, "").replace(/-dizi.*$/i, "").replace(/-turkce.*$/i, "").replace(/-/g, " ").trim();
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
      if (cNorm === tNorm || sNorm === tNorm) {
        var exactScore = 100;
        if (!isNaN(targetY) && !isNaN(candY) && targetY > 1900 && candY > 1900) {
          var yDiff = Math.abs(targetY - candY);
          if (yDiff === 0) exactScore += 25;
          else if (yDiff === 1) exactScore += 10;
        }
        return { matched: true, score: exactScore, reason: "exact_title_match" };
      }
      var tTokens = tokenize(targetTitle);
      if (tTokens.length === 0) tTokens = tNorm.split(/\s+/).filter(Boolean);
      var cTokensList = tokenize(candTitle).concat(tokenize(sClean));
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
      var candUniqueTokens = new Set(tokenize(candTitle));
      var extraTokens = 0;
      candUniqueTokens.forEach(function(tok) {
        if (tTokens.indexOf(tok) === -1) extraTokens++;
      });
      if (extraTokens > 0) {
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

// src/shared/unpacker.js
var require_unpacker = __commonJS({
  "src/shared/unpacker.js"(exports2, module2) {
    function unpackDeanEdwards(str) {
      if (!str || typeof str !== "string") return null;
      var match = str.match(/eval\(function\(p,a,c,k,e,[rd]\)\s*\{.+?\}\s*\(\s*([x\x27\x22].+?)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([x\x27\x22].+?)\.split\(\s*[\x27\x22]\|[\x27\x22]\s*\)/);
      if (!match) return null;
      var p = match[1];
      if (p.startsWith("'") && p.endsWith("'") || p.startsWith('"') && p.endsWith('"')) {
        p = p.slice(1, -1);
      }
      p = p.replace(/\\x27/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      var a = parseInt(match[2], 10);
      var c = parseInt(match[3], 10);
      var kStr = match[4];
      if (kStr.startsWith("'") && kStr.endsWith("'") || kStr.startsWith('"') && kStr.endsWith('"')) {
        kStr = kStr.slice(1, -1);
      }
      var k = kStr.split("|");
      function baseN(val2, radix) {
        if (radix === 10) return String(val2);
        var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var res = "";
        do {
          res = chars[val2 % radix] + res;
          val2 = Math.floor(val2 / radix);
        } while (val2 > 0);
        return res;
      }
      for (var i = c - 1; i >= 0; i--) {
        var key = baseN(i, a);
        var val = k[i] || key;
        if (val !== key) {
          var reg = new RegExp("\\b" + key + "\\b", "g");
          p = p.replace(reg, val);
        }
      }
      return p;
    }
    module2.exports = {
      unpackDeanEdwards
    };
  }
});

// src/shared/helpers.js
var require_helpers = __commonJS({
  "src/shared/helpers.js"(exports2, module2) {
    function asciiFold(str) {
      if (!str || typeof str !== "string") return "";
      return str.replace(/[çÇ]/g, "c").replace(/[ğĞ]/g, "g").replace(/[ıİ]/g, "i").replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[üÜ]/g, "u").replace(/[âÂ]/g, "a").replace(/[îÎ]/g, "i").replace(/[ûÛ]/g, "u");
    }
    function normalizeTurkish(str) {
      if (!str || typeof str !== "string") return "";
      return asciiFold(str).toLowerCase().trim();
    }
    function cleanTitle(str) {
      if (!str || typeof str !== "string") return "";
      return str.replace(/\s*\(\d{4}\)\s*$/, "").replace(/\s*(izle|hd izle|turkce dublaj|turkce altyazili)\s*$/gi, "").trim();
    }
    module2.exports = {
      asciiFold,
      normalizeTurkish,
      cleanTitle
    };
  }
});

// src/webteizle/index.js
var require_webteizle = __commonJS({
  "src/webteizle/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { fetchWithTimeout } = require_http();
    var { ProviderError } = require_errors();
    var { pickBestCandidate } = require_matching();
    var { unpack } = require_unpacker();
    var { asciiFold } = require_helpers();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.movies.webteizle.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          if (HEADERS) HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var BASE_URL = "https://webteizle.info";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    var TMDB_CACHE = /* @__PURE__ */ new Map();
    var PAGE_CACHE = /* @__PURE__ */ new Map();
    var CACHE_TTL_TMDB = 24 * 60 * 60 * 1e3;
    var CACHE_TTL_PAGE = 2 * 60 * 60 * 1e3;
    var SLOW_OR_BLOCKED_HOSTS = ["ok.ru", "okru", "netu", "dzen"];
    function fetchTmdbInfo(tmdbId, mediaType, signal) {
      return __async(this, null, function* () {
        var cleanId = String(tmdbId || "").trim();
        if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
        var cacheKey = "movie:" + cleanId;
        if (TMDB_CACHE.has(cacheKey)) {
          var cached = TMDB_CACHE.get(cacheKey);
          if (Date.now() - cached.time < CACHE_TTL_TMDB) {
            return cached.data;
          }
        }
        var isImdb = cleanId.startsWith("tt");
        var info = { titleTr: "", titleEn: "", year: "", imdbId: isImdb ? cleanId : "", numericId: "" };
        if (isImdb) {
          try {
            var fRes = yield fetchWithTimeout("https://api.themoviedb.org/3/find/" + cleanId + "?api_key=" + TMDB_API_KEY + "&external_source=imdb_id&language=tr-TR", { signal }, 4e3);
            if (fRes.ok) {
              var fData = yield fRes.json();
              var match = fData.movie_results && fData.movie_results[0] || fData.tv_results && fData.tv_results[0];
              if (match) {
                info.titleTr = match.title || match.name || "";
                info.titleEn = match.original_title || match.original_name || "";
                info.year = (match.release_date || match.first_air_date || "").slice(0, 4);
                info.numericId = match.id ? String(match.id) : "";
              }
            }
          } catch (_) {
          }
        }
        if (!info.titleTr && !info.titleEn) {
          var lookupId = info.numericId || cleanId;
          try {
            var res = yield fetchWithTimeout("https://api.themoviedb.org/3/movie/" + lookupId + "?api_key=" + TMDB_API_KEY + "&language=tr-TR", { signal }, 4e3);
            if (res.ok) {
              var d = yield res.json();
              info.titleTr = d.title || d.name || "";
              info.titleEn = d.original_title || d.original_name || "";
              info.year = (d.release_date || d.first_air_date || "").slice(0, 4);
              info.numericId = d.id ? String(d.id) : "";
              if (d.imdb_id) info.imdbId = d.imdb_id;
            }
          } catch (_) {
          }
        }
        if (info.titleTr || info.titleEn || info.imdbId) {
          TMDB_CACHE.set(cacheKey, { data: info, time: Date.now() });
        }
        return info;
      });
    }
    function titleToSlug(title) {
      if (!title) return "";
      return asciiFold(String(title)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    function searchWebteizle(query, signal) {
      return __async(this, null, function* () {
        if (!query) return null;
        try {
          var r = yield fetchWithTimeout(BASE_URL + "/ajax/arama.asp", {
            method: "POST",
            headers: Object.assign({}, HEADERS, {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Origin": BASE_URL
            }),
            body: "q=" + encodeURIComponent(query),
            signal
          }, 4e3);
          if (r.status === 403) {
            throw new ProviderError("HTTP_BLOCKED", "Webte\u0130zle Cloudflare Challenge", "network", 403);
          }
          if (!r.ok) return null;
          var data = yield r.json();
          if (data.status !== "success" || !data.results) return null;
          var rawItems = [];
          if (data.results.filmler && Array.isArray(data.results.filmler.results)) {
            rawItems = rawItems.concat(data.results.filmler.results);
          }
          return rawItems.length > 0 ? rawItems : null;
        } catch (e) {
          if (e && e.code === "HTTP_BLOCKED") throw e;
          return null;
        }
      });
    }
    function findFilmPageAndId(info, signal) {
      return __async(this, null, function* () {
        var cacheKey = "film_id:" + (info.imdbId || info.numericId || info.titleTr || info.titleEn);
        if (PAGE_CACHE.has(cacheKey)) {
          var cached = PAGE_CACHE.get(cacheKey);
          if (Date.now() - cached.time < CACHE_TTL_PAGE) {
            return cached.data;
          }
        }
        var candidateSlugs = [];
        var sTr = titleToSlug(info.titleTr);
        var sEn = titleToSlug(info.titleEn);
        if (sTr) candidateSlugs.push(sTr);
        if (sEn && !candidateSlugs.includes(sEn)) candidateSlugs.push(sEn);
        var hadBlock = false;
        if (candidateSlugs.length > 0) {
          var directTasks = candidateSlugs.map(function(slug) {
            return __async(this, null, function* () {
              var testUrls = [
                BASE_URL + "/izle/dublaj/" + slug,
                BASE_URL + "/izle/altyazi/" + slug
              ];
              for (var url of testUrls) {
                try {
                  var r = yield fetchWithTimeout(url, { headers: HEADERS, signal }, 3500);
                  if (r.status === 403) {
                    hadBlock = true;
                    return null;
                  }
                  if (r.ok) {
                    var html = yield r.text();
                    var m = html.match(/id=["']dilsec["'][^>]*data-id=["'](\d+)["']/) || html.match(/data-id="(\d+)"[^>]*id="wip"/) || html.match(/id="wip"[^>]*data-id="(\d+)"/) || html.match(/button[^>]+id="wip"[^>]+data-id="(\d+)"/) || html.match(/data-id="(\d+)"/) || html.match(/data-filmid="(\d+)"/) || html.match(/filmid\s*=\s*['"]?(\d+)['"]?/i);
                    if (m && m[1]) {
                      return { slug, filmId: m[1] };
                    }
                  }
                } catch (e) {
                  if (e && e.code === "HTTP_BLOCKED") hadBlock = true;
                }
              }
              return null;
            });
          });
          var directResults = yield Promise.all(directTasks);
          var directFound = directResults.find(Boolean);
          if (directFound) {
            PAGE_CACHE.set(cacheKey, { data: directFound, time: Date.now() });
            return directFound;
          }
          if (hadBlock) {
            throw new ProviderError("HTTP_BLOCKED", "Webte\u0130zle Cloudflare Challenge", "network", 403);
          }
        }
        var foundSlug = null;
        if (info.imdbId) {
          try {
            var imdbItems = yield searchWebteizle(info.imdbId, signal);
            if (imdbItems && imdbItems.length > 0 && imdbItems[0].url) {
              var itemUrl = imdbItems[0].url;
              foundSlug = itemUrl.replace("/hakkinda/", "").replace("/izle/dublaj/", "").replace("/izle/altyazi/", "").replace(/^\/+|\/+$/g, "");
            }
          } catch (e) {
            if (e && e.code === "HTTP_BLOCKED") throw e;
          }
        }
        if (!foundSlug) {
          var searchQueries = [info.titleTr, info.titleEn].filter(Boolean);
          for (var q of searchQueries) {
            try {
              var items = yield searchWebteizle(q, signal);
              if (items && items.length > 0) {
                var candidates = items.map(function(item) {
                  return {
                    title: item.title || item.baslik || "",
                    url: item.url || "",
                    slug: (item.url || "").replace("/hakkinda/", "").replace("/izle/dublaj/", "").replace("/izle/altyazi/", "").replace(/^\/+|\/+$/g, ""),
                    year: (item.yil || item.year || (item.title && item.title.match(/\((\d{4})\)/) ? item.title.match(/\((\d{4})\)/)[1] : "")).toString()
                  };
                }).filter(function(c) {
                  return Boolean(c.url);
                });
                var best = pickBestCandidate(candidates, q, info.year);
                if (best && best.slug) {
                  foundSlug = best.slug;
                  break;
                }
              }
            } catch (e) {
              if (e && e.code === "HTTP_BLOCKED") throw e;
            }
          }
        }
        if (foundSlug) {
          var testUrls2 = [
            BASE_URL + "/izle/dublaj/" + foundSlug,
            BASE_URL + "/izle/altyazi/" + foundSlug,
            BASE_URL + "/hakkinda/" + foundSlug
          ];
          for (var u of testUrls2) {
            try {
              var r2 = yield fetchWithTimeout(u, { headers: HEADERS, signal }, 3500);
              if (r2.status === 403) {
                throw new ProviderError("HTTP_BLOCKED", "Webte\u0130zle Cloudflare Challenge", "network", 403);
              }
              if (r2.ok) {
                var h2 = yield r2.text();
                var m2 = h2.match(/id=["']dilsec["'][^>]*data-id=["'](\d+)["']/) || h2.match(/data-id="(\d+)"[^>]*id="wip"/) || h2.match(/id="wip"[^>]*data-id="(\d+)"/) || h2.match(/button[^>]+id="wip"[^>]+data-id="(\d+)"/) || h2.match(/data-id="(\d+)"/) || h2.match(/data-filmid="(\d+)"/) || h2.match(/filmid\s*=\s*['"]?(\d+)['"]?/i);
                if (m2 && m2[1]) {
                  var resObj = { slug: foundSlug, filmId: m2[1] };
                  PAGE_CACHE.set(cacheKey, { data: resObj, time: Date.now() });
                  return resObj;
                }
              }
            } catch (e) {
              if (e && e.code === "HTTP_BLOCKED") throw e;
            }
          }
        }
        return null;
      });
    }
    function fetchAlternatifler(filmId, dil, signal) {
      return __async(this, null, function* () {
        var body = "filmid=" + filmId + "&dil=" + dil + "&s=&b=&bot=0";
        try {
          var r = yield fetchWithTimeout(BASE_URL + "/ajax/dataAlternatif3.asp", {
            method: "POST",
            headers: Object.assign({}, HEADERS, {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Origin": BASE_URL
            }),
            body,
            signal
          }, 4e3);
          if (r.status === 403) {
            throw new ProviderError("HTTP_BLOCKED", "Webte\u0130zle Cloudflare Challenge", "network", 403);
          }
          if (!r.ok) return [];
          var data = yield r.json();
          return data.status === "success" && Array.isArray(data.data) ? data.data : [];
        } catch (e) {
          if (e && e.code === "HTTP_BLOCKED") throw e;
          return [];
        }
      });
    }
    function fetchEmbedData(embedId, signal) {
      return __async(this, null, function* () {
        try {
          var r = yield fetchWithTimeout(BASE_URL + "/ajax/dataEmbed.asp", {
            method: "POST",
            headers: Object.assign({}, HEADERS, {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Origin": BASE_URL
            }),
            body: "id=" + embedId,
            signal
          }, 4e3);
          if (r.status === 403) {
            throw new ProviderError("HTTP_BLOCKED", "Webte\u0130zle Cloudflare Challenge", "network", 403);
          }
          if (!r.ok) return null;
          var html = yield r.text();
          var vm = html.match(/vidmoly\s*\(\s*['"]([^'"]+)['"]/i);
          if (vm && vm[1]) {
            return { provider: "vidmoly", id: vm[1] };
          }
          var px = html.match(/pixel\s*\(\s*['"]([^'"]+)['"]/i) || html.match(/\/player\/pixel\.asp\?v=([^"'\s&]+)/i) || html.match(/pixeldrain\.com\/(?:u|api\/file)\/([a-zA-Z0-9_-]+)/i);
          if (px && px[1]) {
            var pxId = px[1].split("|")[0].trim();
            return { provider: "pixel", id: pxId };
          }
          var fm = html.match(/filemoon\s*\(\s*['"]([^'"]+)['"]/i);
          if (fm && fm[1]) {
            return { provider: "filemoon", id: fm[1] };
          }
          var sib = html.match(/sibnet\s*\(\s*['"]([^'"]+)['"]/i);
          if (sib && sib[1]) {
            return { provider: "sibnet", url: "https://video.sibnet.ru/shell.php?videoid=" + sib[1] };
          }
          var ifr = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (ifr && ifr[1]) {
            var src = ifr[1];
            if (src.includes("pixeldrain.com")) {
              var pdM = src.match(/pixeldrain\.com\/(?:u|api\/file)\/([a-zA-Z0-9_-]+)/);
              if (pdM) return { provider: "pixel", id: pdM[1] };
            }
            if (src.includes("sibnet.ru")) {
              return { provider: "sibnet", url: src.startsWith("//") ? "https:" + src : src };
            }
            if (src.includes("vidmoly")) {
              var idM = src.match(/embed-([a-zA-Z0-9]+)/) || src.match(/v=([a-zA-Z0-9]+)/);
              if (idM) return { provider: "vidmoly", id: idM[1] };
            }
            if (src.includes("filemoon") || src.includes("byse")) {
              var fmM = src.match(/\/e\/([a-zA-Z0-9_-]+)/) || src.match(/v=([a-zA-Z0-9_-]+)/);
              if (fmM) return { provider: "filemoon", id: fmM[1] };
              return { provider: "filemoon", url: src.startsWith("//") ? "https:" + src : src };
            }
          }
          return null;
        } catch (e) {
          if (e && e.code === "HTTP_BLOCKED") throw e;
          return null;
        }
      });
    }
    function getPixeldrainStream(pixelId) {
      if (!pixelId) return null;
      var cleanId = pixelId.split("|")[0].trim();
      if (!cleanId) return null;
      var streamUrl = "https://pixeldrain.com/api/file/" + cleanId;
      return {
        url: streamUrl,
        type: "mp4",
        format: "mp4",
        headers: {
          "User-Agent": HEADERS["User-Agent"],
          "Referer": "https://pixeldrain.com/"
        }
      };
    }
    function fetchSibnetStream(iframeUrl, signal) {
      return __async(this, null, function* () {
        try {
          var fullUrl = iframeUrl.startsWith("//") ? "https:" + iframeUrl : iframeUrl;
          var r = yield fetchWithTimeout(fullUrl, {
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": "https://video.sibnet.ru/"
            },
            signal
          }, 3500);
          if (!r.ok) return null;
          var html = yield r.text();
          var m = html.match(/["'](\/shell\.php\?videoid=\d+)["']/i) || html.match(/player\.src\(\s*\[\s*\{\s*src:\s*["']([^"']+)["']/i) || html.match(/src:\s*["']([^"']+\.mp4[^"']*)["']/i);
          if (m) {
            var streamUrl = m[1].startsWith("http") ? m[1] : "https://video.sibnet.ru" + m[1];
            return { url: streamUrl, type: "mp4", referer: "https://video.sibnet.ru/" };
          }
          return null;
        } catch (_) {
          return null;
        }
      });
    }
    function fetchVidMolyStream(vidmolyId, signal) {
      return __async(this, null, function* () {
        if (!vidmolyId) return null;
        var targetUrls = [
          "https://vidmoly.net/embed-" + vidmolyId + ".html",
          "https://vidmoly.biz/embed-" + vidmolyId + ".html"
        ];
        for (var targetUrl of targetUrls) {
          try {
            var r = yield fetchWithTimeout(targetUrl, {
              headers: {
                "User-Agent": HEADERS["User-Agent"],
                "Referer": BASE_URL + "/"
              },
              signal
            }, 4e3);
            if (!r.ok) continue;
            var html = yield r.text();
            var m = html.match(/sources\s*:\s*\[\{\s*file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i) || html.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
            if (!m && typeof unpack === "function") {
              try {
                var unpacked = unpack(html);
                if (unpacked) {
                  m = unpacked.match(/sources\s*:\s*\[\{\s*file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i) || unpacked.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
                }
              } catch (_) {
              }
            }
            if (m && m[1]) {
              return {
                url: m[1],
                referer: "https://vidmoly.net/"
              };
            }
          } catch (_) {
          }
        }
        return null;
      });
    }
    function fetchFilemoonStream(filemoonIdOrUrl, signal) {
      return __async(this, null, function* () {
        if (!filemoonIdOrUrl) return null;
        var targetUrl = filemoonIdOrUrl.startsWith("http") ? filemoonIdOrUrl : "https://bysezoxexe.com/e/" + filemoonIdOrUrl;
        try {
          var r = yield fetchWithTimeout(targetUrl, {
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": BASE_URL + "/"
            },
            signal
          }, 4e3);
          if (!r.ok) return null;
          var html = yield r.text();
          var m = html.match(/sources\s*:\s*\[\{\s*file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)['"]/i) || html.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)['"]/i);
          if (!m && typeof unpack === "function") {
            try {
              var unpacked = unpack(html);
              if (unpacked) {
                m = unpacked.match(/sources\s*:\s*\[\{\s*file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)['"]/i) || unpacked.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)['"]/i);
              }
            } catch (_) {
            }
          }
          if (m && m[1]) {
            var isM3u8 = m[1].includes(".m3u8");
            return {
              url: m[1],
              type: isM3u8 ? "hls" : "mp4",
              referer: "https://bysezoxexe.com/"
            };
          }
          return null;
        } catch (_) {
          return null;
        }
      });
    }
    function getStreams(tmdbId, mediaType, season, episode, options) {
      return __async(this, null, function* () {
        const signal = options && options.signal;
        try {
          if (typeof tmdbId === "object" && tmdbId !== null) {
            mediaType = tmdbId.type || mediaType;
            season = tmdbId.season || season;
            episode = tmdbId.episode || episode;
            tmdbId = tmdbId.id;
          }
          if (typeof tmdbId === "string" && tmdbId.indexOf(":") !== -1 && !tmdbId.startsWith("webteizle:")) {
            tmdbId = tmdbId.split(":")[0];
          }
          var isTV = mediaType === "tv" || mediaType === "series";
          if (isTV) {
            return [];
          }
          var info = yield fetchTmdbInfo(tmdbId, mediaType, signal);
          var movieName = info.titleTr || info.titleEn;
          if (!movieName) return [];
          var pageData = yield findFilmPageAndId(info, signal);
          if (!pageData || !pageData.filmId) return [];
          var filmId = pageData.filmId;
          var [dublajAlts, altyaziAlts] = yield Promise.all([
            fetchAlternatifler(filmId, "0", signal),
            fetchAlternatifler(filmId, "1", signal)
          ]);
          var allAlts = [];
          (dublajAlts || []).forEach(function(a) {
            allAlts.push({ alt: a, dil: "TR Dublaj", flag: "\u{1F1F9}\u{1F1F7} " });
          });
          (altyaziAlts || []).forEach(function(a) {
            allAlts.push({ alt: a, dil: "TR Altyaz\u0131", flag: "\u{1F310} " });
          });
          if (allAlts.length === 0) return [];
          var validAlts = allAlts.filter(function(item) {
            var b = (item.alt.baslik || "").toLowerCase();
            return !SLOW_OR_BLOCKED_HOSTS.some(function(h) {
              return b.includes(h);
            });
          });
          validAlts.sort(function(a, b) {
            function getScore(item) {
              var name = (item.alt.baslik || "").toLowerCase();
              if (name.includes("pixel")) return 100;
              if (name.includes("sibnet")) return 90;
              if (name.includes("vidmoly")) return 80;
              if (name.includes("filemoon")) return 70;
              return 10;
            }
            return getScore(b) - getScore(a);
          });
          var targetAlts = validAlts.slice(0, 5);
          var resolveTasks = targetAlts.map(function(item) {
            return __async(this, null, function* () {
              try {
                var embed = yield fetchEmbedData(item.alt.id, signal);
                if (!embed) return null;
                var q = item.alt.kalitesi === 0 ? "4K" : item.alt.kalitesi === 1 ? "1080p" : "720p";
                if (embed.provider === "pixel") {
                  var px = getPixeldrainStream(embed.id);
                  if (px && px.url) {
                    var pxHeaders = {
                      "User-Agent": HEADERS["User-Agent"],
                      "Referer": "https://pixeldrain.com/"
                    };
                    return {
                      name: movieName,
                      title: "\u231C Webte\u0130zle \u231F | Pixel MP4 | " + item.flag + item.dil,
                      url: px.url,
                      quality: q,
                      format: "mp4",
                      type: "mp4",
                      headers: pxHeaders,
                      behaviorHints: {
                        notWebReady: true,
                        proxyHeaders: { request: pxHeaders }
                      },
                      provider: "webteizle"
                    };
                  }
                }
                if (embed.provider === "sibnet") {
                  var sib = yield fetchSibnetStream(embed.url, signal);
                  if (sib && sib.url) {
                    var sibHeaders = {
                      "User-Agent": HEADERS["User-Agent"],
                      "Referer": sib.referer,
                      "Origin": "https://video.sibnet.ru"
                    };
                    return {
                      name: movieName,
                      title: "\u231C Webte\u0130zle \u231F | Sibnet MP4 | " + item.flag + item.dil,
                      url: sib.url,
                      quality: q,
                      format: "mp4",
                      type: "mp4",
                      headers: sibHeaders,
                      behaviorHints: {
                        notWebReady: true,
                        proxyHeaders: { request: sibHeaders }
                      },
                      provider: "webteizle"
                    };
                  }
                }
                if (embed.provider === "vidmoly") {
                  var vmStream = yield fetchVidMolyStream(embed.id, signal);
                  if (vmStream && vmStream.url) {
                    var vmHeaders = {
                      "User-Agent": HEADERS["User-Agent"],
                      "Referer": vmStream.referer,
                      "Origin": vmStream.referer.replace(/\/+$/, "")
                    };
                    return {
                      name: movieName,
                      title: "\u231C Webte\u0130zle \u231F | VidMoly | " + item.flag + item.dil,
                      url: vmStream.url,
                      quality: q,
                      type: "hls",
                      headers: vmHeaders,
                      behaviorHints: {
                        notWebReady: true,
                        proxyHeaders: { request: vmHeaders }
                      },
                      provider: "webteizle"
                    };
                  }
                }
                if (embed.provider === "filemoon") {
                  var fmStream = yield fetchFilemoonStream(embed.id || embed.url, signal);
                  if (fmStream && fmStream.url) {
                    var fmHeaders = {
                      "User-Agent": HEADERS["User-Agent"],
                      "Referer": fmStream.referer,
                      "Origin": fmStream.referer.replace(/\/+$/, "")
                    };
                    return {
                      name: movieName,
                      title: "\u231C Webte\u0130zle \u231F | FileMoon | " + item.flag + item.dil,
                      url: fmStream.url,
                      quality: q,
                      format: fmStream.type,
                      type: fmStream.type,
                      headers: fmHeaders,
                      behaviorHints: {
                        notWebReady: true,
                        proxyHeaders: { request: fmHeaders }
                      },
                      provider: "webteizle"
                    };
                  }
                }
              } catch (_) {
              }
              return null;
            });
          });
          var results = yield Promise.all(resolveTasks);
          var streams = [];
          for (var s of results) {
            if (s && !streams.some(function(x) {
              return x.url === s.url;
            })) {
              streams.push(s);
            }
          }
          return streams;
        } catch (err) {
          if (err && err.code === "HTTP_BLOCKED") throw err;
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
      module2.exports = wrapAll({ getStreams }, cfgReady);
    } else {
      global.WebteIzleProvider = { getStreams };
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
var provider = require_webteizle();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "webteizle", "id": "mum_webteizle", "name": "Webte\u0130zle", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
