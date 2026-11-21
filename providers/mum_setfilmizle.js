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
    module2.exports = {
      getQualityScore,
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
        score -= Math.min(20, extraTokens * 5);
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

// src/setfilmizle/index.js
var require_setfilmizle = __commonJS({
  "src/setfilmizle/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { pickBestCandidate } = require_matching();
    var { fetchWithTimeout } = require_http();
    var { ProviderError } = require_errors();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.movies.setfilmizle.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          if (HEADERS) HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var BASE_URL = "https://www.setfilmizle.ltd";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
          var title = "";
          var origTitle = "";
          var year = "";
          if (cleanId.startsWith("tt")) {
            var findRes = yield fetchWithTimeout("https://api.themoviedb.org/3/find/" + cleanId + "?api_key=" + TMDB_API_KEY + "&external_source=imdb_id&language=tr-TR", { signal }, 8e3);
            if (findRes.ok) {
              var fd = yield findRes.json();
              var match = mediaType === "tv" || mediaType === "series" ? fd.tv_results && fd.tv_results[0] : fd.movie_results && fd.movie_results[0];
              if (!match) match = fd.movie_results && fd.movie_results[0] || fd.tv_results && fd.tv_results[0];
              if (match) {
                title = match.name || match.title || "";
                origTitle = match.original_name || match.original_title || "";
                numericId = match.id;
                var rd0 = match.release_date || match.first_air_date || "";
                if (rd0) year = rd0.split("-")[0];
              }
            }
          } else {
            numericId = cleanId;
            var type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
            var tRes = yield fetchWithTimeout("https://api.themoviedb.org/3/" + type + "/" + numericId + "?api_key=" + TMDB_API_KEY + "&language=tr-TR", { signal }, 8e3);
            if (tRes.ok) {
              var td = yield tRes.json();
              title = td.name || td.title || "";
              origTitle = td.original_name || td.original_title || "";
              var rd1 = td.release_date || td.first_air_date || "";
              if (rd1) year = rd1.split("-")[0];
            }
          }
          return { title, origTitle, numericId, year };
        } catch (e) {
          return { title: "", origTitle: "", numericId: id, year: "" };
        }
      });
    }
    function absUrl(href) {
      if (!href) return null;
      if (href.startsWith("http")) return href;
      if (href.startsWith("//")) return "https:" + href;
      if (href.startsWith("/")) return BASE_URL + href;
      return BASE_URL + "/" + href;
    }
    function parseCards(html) {
      var out = [];
      var seen = /* @__PURE__ */ new Set();
      var re = /<a[^>]+class="[^"]*card-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      var m;
      while ((m = re.exec(html)) !== null) {
        var href = absUrl(m[1]);
        var inner = m[2];
        if (!href || seen.has(href)) continue;
        var titleMatch = inner.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
        var imgMatch = inner.match(/<img[^>]+(?:alt="([^"]*)")?[^>]*>/i);
        var srcMatch = inner.match(/<img[^>]+(?:src|data-src)="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : imgMatch && imgMatch[1] ? imgMatch[1].trim() : "";
        if (!title) continue;
        var yearMatch = inner.match(/<p[^>]*class="[^"]*meta[^"]*"[^>]*>(\d{4})/i) || inner.match(/<dt>Yıl<\/dt>\s*<dd>(\d{4})<\/dd>/i) || href.match(/-(20\d\d|19\d\d)\/?$/);
        var year = yearMatch ? yearMatch[1] : "";
        seen.add(href);
        out.push({
          title,
          href,
          year,
          poster: srcMatch ? absUrl(srcMatch[1]) : "",
          isTv: href.includes("/dizi/")
        });
      }
      return out;
    }
    function searchSite(query, signal) {
      return __async(this, null, function* () {
        try {
          var res = yield fetchWithTimeout(BASE_URL + "/?s=" + encodeURIComponent(query), { headers: HEADERS, signal }, 8e3);
          if (!res.ok) {
            if (res.status === 403) throw new ProviderError("HTTP_BLOCKED", "SetFilmIzle 403 Forbidden", "search", 403);
            return [];
          }
          var html = yield res.text();
          return parseCards(html);
        } catch (e) {
          if (e && e.name === "ProviderError") throw e;
          return [];
        }
      });
    }
    function pickBest(cards, title, year) {
      return pickBestCandidate(cards, title, year, { minCoverage: 0.75, minScore: 50 });
    }
    function spgDecode(n, o) {
      try {
        var a, b;
        if (typeof Buffer !== "undefined") {
          a = Buffer.from(n, "base64").toString("binary");
          b = Buffer.from(o, "base64").toString("binary");
        } else if (typeof atob === "function") {
          a = atob(n);
          b = atob(o);
        } else {
          return null;
        }
        var s = "";
        for (var i = 0; i < a.length; i++) {
          s += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i % b.length));
        }
        return s.split("|")[0];
      } catch (e) {
        return null;
      }
    }
    function resolveFastplay(fastplayUrl, fastplayRef) {
      return __async(this, null, function* () {
        try {
          var fpRes = yield fetchWithTimeout(fastplayUrl, {
            headers: { "User-Agent": HEADERS["User-Agent"], "Referer": fastplayRef || BASE_URL + "/" }
          }, 15e3);
          if (!fpRes.ok) return null;
          var fpHtml = yield fpRes.text();
          var spMatch = fpHtml.match(/"sp"\s*:\s*"([^"]+)"/);
          var spTMatch = fpHtml.match(/"spT"\s*:\s*(\d+)/);
          var manMatch = fpHtml.match(/(?:src|stream)\s*:\s*"(\/manifests\/[^"]+)"/);
          if (!manMatch) return null;
          var sp = spMatch ? spMatch[1] : "";
          var spT = spTMatch ? spTMatch[1] : 0;
          var manPath = manMatch[1].replace(/&amp;/g, "&");
          var fpOrigin = fastplayUrl.match(/^(https?:\/\/[^/]+)/)[1];
          var manifestUrl = manPath.startsWith("http") ? manPath : fpOrigin + manPath;
          var subs = [];
          var subMatch = fpHtml.match(/subtitles\s*:\s*(\[[\s\S]*?\])/);
          if (subMatch) {
            try {
              var arr = JSON.parse(subMatch[1]);
              for (var si = 0; si < arr.length; si++) {
                var item = arr[si];
                if (item && item.file && item.file.indexOf(".vtt") !== -1) {
                  var lCode = item.lang === "tur" ? "tr" : item.lang === "eng" ? "en" : item.lang || "tr";
                  subs.push({
                    id: item.lang || "sub_" + si,
                    url: item.file,
                    file: item.file,
                    link: item.file,
                    lang: item.lang || "tur",
                    language: lCode,
                    label: item.label || (lCode === "tr" ? "T\xFCrk\xE7e" : "English"),
                    name: item.label || (lCode === "tr" ? "T\xFCrk\xE7e" : "English"),
                    title: item.label || (lCode === "tr" ? "T\xFCrk\xE7e" : "English"),
                    format: "vtt",
                    type: "text/vtt",
                    mimeType: "text/vtt"
                  });
                }
              }
            } catch (e) {
            }
          }
          if (subs.length === 0) {
            var subRe = /"file"\s*:\s*"(https?:[^"]+\.vtt)"\s*,\s*"label"\s*:\s*"([^"]+)"\s*,\s*"lang"\s*:\s*"([^"]+)"/gi;
            var sm;
            while ((sm = subRe.exec(fpHtml)) !== null) {
              var langCode = sm[3] === "tur" ? "tr" : sm[3] === "eng" ? "en" : sm[3];
              subs.push({
                id: sm[3],
                url: sm[1].replace(/\\\//g, "/"),
                file: sm[1].replace(/\\\//g, "/"),
                link: sm[1].replace(/\\\//g, "/"),
                lang: sm[3],
                language: langCode,
                label: sm[2],
                name: sm[2],
                title: sm[2],
                format: "vtt",
                type: "text/vtt",
                mimeType: "text/vtt"
              });
            }
          }
          return { manifestUrl, sp, spT, subtitles: subs, referer: fpRes.url || fastplayUrl };
        } catch (e) {
          return null;
        }
      });
    }
    function extractStreamsFromContentPage(pageUrl) {
      return __async(this, null, function* () {
        var streams = [];
        try {
          let addPlayer2 = function(pid, pname, pkey) {
            if (!pid || !pname || pid.includes("event")) return;
            var k = pid + "|" + pname + "|" + (pkey || "");
            if (seenP.has(k)) return;
            seenP.add(k);
            players.push({ id: pid, name: pname, key: pkey || "" });
          };
          var addPlayer = addPlayer2;
          var res = yield fetchWithTimeout(pageUrl, { headers: HEADERS }, 15e3);
          if (!res.ok) return [];
          var html = yield res.text();
          var ajaxMatch = html.match(/(?:window\.)?STF_AJAX\s*=\s*\{[\s\S]*?url\s*:\s*"([^"]+)"[\s\S]*?video\s*:\s*"([^"]+)"/i);
          var ajaxUrl = ajaxMatch ? ajaxMatch[1] : BASE_URL + "/wp-admin/admin-ajax.php";
          var videoNonce = ajaxMatch ? ajaxMatch[2] : "";
          var players = [];
          var seenP = /* @__PURE__ */ new Set();
          var playerRe = /data-post-id="([^"]+)"[^>]*data-player-name="([^"]+)"[^>]*data-part-key="([^"]*)"/gi;
          var pm;
          while ((pm = playerRe.exec(html)) !== null) {
            addPlayer2(pm[1], pm[2], pm[3]);
          }
          if (players.length === 0) {
            var postIds = [];
            var piRe = /data-post-id="([^"]+)"/gi;
            var pim;
            while ((pim = piRe.exec(html)) !== null) {
              if (pim[1] && !pim[1].includes("event") && postIds.indexOf(pim[1]) === -1) postIds.push(pim[1]);
            }
            var btnRe = /data-player-name="([^"]+)"[^>]*data-part-key="([^"]*)"/gi;
            var bm;
            var btns = [];
            while ((bm = btnRe.exec(html)) !== null) {
              btns.push({ name: bm[1], key: bm[2] || "" });
            }
            if (btns.length === 0) {
              var nameOnly = /data-player-name="([^"]+)"/gi;
              var nm;
              while ((nm = nameOnly.exec(html)) !== null) {
                btns.push({ name: nm[1], key: "" });
              }
            }
            postIds.forEach(function(pid) {
              btns.forEach(function(b) {
                addPlayer2(pid, b.name, b.key);
              });
            });
          }
          if (players.length === 0) return [];
          var nonces = [];
          if (videoNonce) nonces.push(videoNonce);
          var nonceMatches = [...html.matchAll(/data-nonce="([a-z0-9]+)"/gi)].map(function(m) {
            return m[1];
          });
          for (var ni = 0; ni < nonceMatches.length; ni++) {
            if (nonces.indexOf(nonceMatches[ni]) === -1) nonces.push(nonceMatches[ni]);
          }
          if (nonces.length === 0) return [];
          var seenUrls = /* @__PURE__ */ new Set();
          for (var i = 0; i < Math.min(players.length, 4); i++) {
            var gotStreamForPlayer = false;
            for (var nIdx = 0; nIdx < nonces.length && !gotStreamForPlayer; nIdx++) {
              try {
                var pl = players[i];
                var form = new URLSearchParams();
                form.append("action", "get_video_url");
                form.append("nonce", nonces[nIdx]);
                form.append("post_id", pl.id);
                form.append("player_name", pl.name);
                form.append("part_key", pl.key);
                var aRes = yield fetchWithTimeout(ajaxUrl, {
                  method: "POST",
                  headers: {
                    "User-Agent": HEADERS["User-Agent"],
                    "Referer": pageUrl,
                    "Origin": BASE_URL,
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded"
                  },
                  body: form.toString()
                }, 15e3);
                if (!aRes.ok) continue;
                var aj = yield aRes.json();
                if (!aj || aj.success === false) continue;
                var setplayUrl = aj && aj.data && (aj.data.stream && aj.data.stream.url || aj.data.url);
                if (!setplayUrl) continue;
                setplayUrl = setplayUrl.replace(/\\\//g, "/");
                if (seenUrls.has(setplayUrl)) {
                  gotStreamForPlayer = true;
                  continue;
                }
                seenUrls.add(setplayUrl);
                var spRes = yield fetchWithTimeout(setplayUrl, {
                  headers: { "User-Agent": HEADERS["User-Agent"], "Referer": pageUrl }
                }, 15e3);
                if (!spRes.ok) continue;
                var spHtml = yield spRes.text();
                var cerMatch = spHtml.match(/SPG\.cerceve\(\s*"[^"]*"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/) || spHtml.match(/SPG\.cerceve\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/);
                var fastplayUrl = null;
                if (cerMatch && cerMatch[1] && cerMatch[2]) {
                  fastplayUrl = spgDecode(cerMatch[1], cerMatch[2]);
                }
                if (!fastplayUrl) {
                  var fMatch = spHtml.match(/https?:\/\/fastplay\.[a-z]+\/stfplay\.php\?[^"'<>\s\\]+/i);
                  if (fMatch) fastplayUrl = fMatch[0].replace(/\\+/g, "");
                }
                if (!fastplayUrl || !fastplayUrl.startsWith("http")) continue;
                var fp = yield resolveFastplay(fastplayUrl, spRes.url || setplayUrl);
                if (!fp || !fp.manifestUrl) continue;
                var sHeaders = {
                  "User-Agent": "ExoPlayerLib/2.19.1",
                  "Referer": "https://fastplay.mom/"
                };
                streams.push({
                  name: "SetFilmIzle",
                  title: "\u231C SetFilmIzle \u231F | FastPlay (1080p HLS)",
                  url: fp.manifestUrl + "#.m3u8",
                  quality: "1080p",
                  provider: "setfilmizle",
                  headers: sHeaders,
                  type: "hls",
                  format: "hls",
                  isHls: true,
                  behaviorHints: {
                    notWebReady: true,
                    proxyHeaders: { request: sHeaders }
                  },
                  subtitles: fp.subtitles || []
                });
                gotStreamForPlayer = true;
                if (streams.length > 0) break;
              } catch (e) {
              }
            }
          }
        } catch (e) {
        }
        return streams;
      });
    }
    function getCatalog(args) {
      return __async(this, null, function* () {
        try {
          var query = args && args.search || args && args.extra && args.extra.search || args && args.query || "";
          var catalogId = args && args.id || "";
          var catalogType = args && args.type || "";
          var wantSeries = catalogId.includes("series") || catalogType === "tv" || catalogType === "series";
          var wantMovies = catalogId.includes("movie") || catalogType === "movie";
          var url = query ? BASE_URL + "/?s=" + encodeURIComponent(query) : wantSeries ? BASE_URL + "/dizi/" : BASE_URL + "/tur/aksiyon/";
          var res = yield fetchWithTimeout(url, { headers: HEADERS }, 15e3);
          if (!res.ok) return { metas: [] };
          var html = yield res.text();
          var cards = parseCards(html);
          if (wantSeries && !wantMovies) {
            var filteredSeries = cards.filter(function(c) {
              return c.isTv;
            });
            if (filteredSeries.length > 0 || !query) cards = filteredSeries;
          } else if (wantMovies && !wantSeries && query) {
            var filteredMovies = cards.filter(function(c) {
              return !c.isTv;
            });
            if (filteredMovies.length > 0) cards = filteredMovies;
          }
          var metas = cards.slice(0, 30).map(function(c) {
            return {
              id: "setfilmizle:" + (c.isTv ? "show:" : "movie:") + encodeURIComponent(c.href),
              type: c.isTv ? "tv" : "movie",
              name: c.title,
              poster: c.poster || "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              background: c.poster || "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              genres: [c.isTv ? "Yabanc\u0131 Dizi" : "Film", "SetFilmIzle"],
              description: c.title + " - SetFilmIzle"
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
          if (!rawId || !rawId.startsWith("setfilmizle:")) return { meta: null };
          var href = decodeURIComponent(rawId.split(":").slice(2).join(":"));
          var res = yield fetchWithTimeout(href, { headers: HEADERS }, 15e3);
          if (!res.ok) return { meta: null };
          var html = yield res.text();
          var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/\s*\(20\d\d\)\s*/g, "").trim() : "SetFilmIzle";
          var ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
          var poster = ogImg ? ogImg[1] : "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png";
          if (href.includes("/dizi/")) {
            var videos = [];
            var seen = /* @__PURE__ */ new Set();
            var panelRe = /<div[^>]+class="[^"]*season-panel[^"]*"[^>]*data-season="(\d+)"[^>]*>([\s\S]*?)(?=<div[^>]+class="[^"]*season-panel[^"]*"|$)/gi;
            var pmm;
            while ((pmm = panelRe.exec(html)) !== null) {
              var sN = parseInt(pmm[1]) || 1;
              var panelHtml = pmm[2];
              var fepRe = /<a[^>]+class="[^"]*fep[^"]*"[^>]*href="([^"]+)"[^>]*>/gi;
              var fm;
              var eIdx = 0;
              while ((fm = fepRe.exec(panelHtml)) !== null) {
                var fepHref = absUrl(fm[1]);
                if (!fepHref || seen.has(fepHref)) continue;
                eIdx++;
                var slugM = fepHref.match(/-(\d+)-sezon-(\d+)-bolum/);
                var eN = slugM ? parseInt(slugM[2]) : eIdx;
                var sN2 = slugM ? parseInt(slugM[1]) : sN;
                seen.add(fepHref);
                videos.push({
                  id: "setfilmizle:ep:" + encodeURIComponent(fepHref),
                  title: sN2 + ". Sezon " + eN + ". B\xF6l\xFCm",
                  season: sN2,
                  episode: eN
                });
              }
            }
            if (videos.length === 0) {
              var epRe = /<a[^>]+href="([^"]+)"[^>]*>([^<]*\d+\.\s*Sezon[^<]*\d+\.\s*Bölüm[^<]*)<\/a>/gi;
              var em;
              while ((em = epRe.exec(html)) !== null) {
                var epHref = absUrl(em[1]);
                if (!epHref || seen.has(epHref)) continue;
                var epTxt = em[2].replace(/\s+/g, " ").trim();
                var seMatch = epTxt.match(/(\d+)\.\s*Sezon[^\d]*(\d+)\.\s*Bölüm/);
                var sN3 = seMatch ? parseInt(seMatch[1]) : 1;
                var eN3 = seMatch ? parseInt(seMatch[2]) : 1;
                seen.add(epHref);
                videos.push({
                  id: "setfilmizle:ep:" + encodeURIComponent(epHref),
                  title: epTxt || sN3 + ". Sezon " + eN3 + ". B\xF6l\xFCm",
                  season: sN3,
                  episode: eN3
                });
              }
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
                description: title + " - SetFilmIzle",
                genres: ["Yabanc\u0131 Dizi", "SetFilmIzle"],
                videos
              }
            };
          }
          return {
            meta: {
              id: rawId,
              type: "movie",
              name: title,
              poster,
              background: poster,
              description: title + " - SetFilmIzle",
              genres: ["Film", "SetFilmIzle"],
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
          if (typeof tmdbIdOrArgs === "object" && tmdbIdOrArgs !== null) {
            mediaType = tmdbIdOrArgs.type || mediaType;
            seasonNum = tmdbIdOrArgs.season || seasonNum;
            episodeNum = tmdbIdOrArgs.episode || episodeNum;
            options = tmdbIdOrArgs.options || options;
            signal = options && options.signal;
            tmdbIdOrArgs = tmdbIdOrArgs.id;
          }
          if (typeof tmdbIdOrArgs === "string" && tmdbIdOrArgs.indexOf(":") !== -1 && !tmdbIdOrArgs.startsWith("setfilmizle:")) {
            var parts = tmdbIdOrArgs.split(":");
            if (parts.length >= 3) {
              var s = parseInt(parts[parts.length - 2]);
              var e = parseInt(parts[parts.length - 1]);
              if (!isNaN(s)) seasonNum = s;
              if (!isNaN(e)) episodeNum = e;
              mediaType = "tv";
              tmdbIdOrArgs = parts[0];
            }
          }
          if (typeof tmdbIdOrArgs === "string" && tmdbIdOrArgs.startsWith("setfilmizle:ep:")) {
            var epHref = decodeURIComponent(tmdbIdOrArgs.replace("setfilmizle:ep:", ""));
            return yield extractStreamsFromContentPage(epHref);
          }
          if (typeof tmdbIdOrArgs === "string" && (tmdbIdOrArgs.startsWith("setfilmizle:show:") || tmdbIdOrArgs.startsWith("setfilmizle:movie:"))) {
            var href2 = decodeURIComponent(tmdbIdOrArgs.split(":").slice(2).join(":"));
            if (tmdbIdOrArgs.startsWith("setfilmizle:show:")) {
              var meta = yield getMeta(tmdbIdOrArgs);
              var vids = meta && meta.meta && meta.meta.videos || [];
              var target = vids.find(function(v) {
                return v.season === (parseInt(seasonNum) || 1) && v.episode === (parseInt(episodeNum) || 1);
              }) || vids[0];
              if (target) return yield getStreams(target.id, mediaType, seasonNum, episodeNum, options);
              return yield extractStreamsFromContentPage(href2);
            }
            return yield extractStreamsFromContentPage(href2);
          }
          var season = parseInt(seasonNum) || 1;
          var episode = parseInt(episodeNum) || 1;
          var info = yield resolveTmdbInfo(tmdbIdOrArgs, mediaType, signal);
          var searchTitles = [info.title, info.origTitle].filter(Boolean);
          if (searchTitles.length === 0) {
            throw new ProviderError("TMDB_ERROR", "TMDB arama bilgisi al\u0131namad\u0131", "tmdb");
          }
          var hadCards = false;
          for (var t = 0; t < searchTitles.length; t++) {
            var cards = yield searchSite(searchTitles[t], signal);
            if (!cards || cards.length === 0) continue;
            hadCards = true;
            var wantTv = mediaType === "tv" || mediaType === "series";
            var filtered = cards.filter(function(c) {
              return wantTv ? c.isTv : !c.isTv;
            });
            var best = pickBest(filtered.length > 0 ? filtered : cards, searchTitles[t], info.year);
            if (!best) continue;
            if (best.isTv) {
              var streams = yield extractStreamsFromContentPage(best.href);
              if (streams.length > 0) {
                if (season === 1 && episode === 1) return streams;
              }
              var showMeta = yield getMeta("setfilmizle:show:" + encodeURIComponent(best.href));
              var vids2 = showMeta && showMeta.meta && showMeta.meta.videos || [];
              var tgt = vids2.find(function(v) {
                return v.season === season && v.episode === episode;
              });
              if (tgt) {
                var epStreams = yield getStreams(tgt.id, mediaType, season, episode, options);
                if (epStreams.length > 0) return epStreams;
              }
              if (streams.length > 0) return streams;
            } else {
              var mStreams = yield extractStreamsFromContentPage(best.href);
              if (mStreams.length > 0) return mStreams;
            }
          }
          if (hadCards) {
            throw new ProviderError("NO_MATCH", "SetFilmIzle e\u015Fle\u015Fen aday bulamad\u0131", "matching");
          }
          return [];
        } catch (e2) {
          if (e2 && (e2.name === "ProviderError" || e2.name === "AbortError" || e2.message === "TIMEOUT")) {
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
var provider = require_setfilmizle();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "setfilmizle", "id": "mum_setfilmizle", "name": "SetFilmIzle", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
