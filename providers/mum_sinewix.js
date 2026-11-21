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
          dizimom: {
            base: "https://ddizimom.net"
          },
          yabancidizi: {
            base: "https://yabancidizi.news"
          },
          diziboxizle: {
            base: "https://diziboxizle.com"
          }
        },
        movies: {
          filmmodu: {
            base: "https://yabancidizifilmizle.click",
            live: "https://yabancidizifilmizle.click",
            player: "https://pilavyerplay.top"
          },
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
          },
          sinemacx: {
            base: "https://sinemacc.com",
            player: "https://player.filmizle.in"
          },
          sinewix: {
            api_base: "https://ydfvfdizipanel.ru/public/api",
            panel_base: "https://ydfvfdizipanel.ru"
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

// src/sinewix/index.js
var require_sinewix = __commonJS({
  "src/sinewix/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { timeoutSignal, fetchWithTimeout } = require_http();
    var { calculateMatchScore } = require_matching();
    var { ProviderError } = require_errors();
    var API_BASE = "https://ydfvfdizipanel.ru/public/api";
    var PANEL_BASE = "https://ydfvfdizipanel.ru";
    var API_KEY = "9iQNC5HQwPlaFuJDkhncJ5XTJ8feGXOJatAA";
    var API_HEADERS = {
      "hash256": "711bff4afeb47f07ab08a0b07e85d3835e739295e8a6361db77eebd93d96306b",
      "signature": "3082058830820370a00302010202145bbfbba9791db758ad12295636e094ab4b07dc24300d06092a864886f70d01010b05003074310b3009060355040613025553311330110603550408130a43616c69666f726e6961311630140603550407130d4d6f756e7461696e205669657731143012060355040a130b476f6f676c6520496e632e3110300e060355040b1307416e64726f69643110300e06035504031307416e64726f69643020170d3231313231353232303433335a180f32303531313231353232303433335a3074310b3009060355040613025553311330110603550408130a43616c69666f726e6961311630140603550407130d4d6f756e7461696e205669657731143012060355040a130b476f6f676c6520496e632e3110300e060355040b1307416e64726f69643110300e06035504031307416e64726f696430820222300d06092a864886f70d01010105000382020f003082020a0282020100a5106a24bb3f9c0aaf3a2b228f794b5eaf1757ba758b19736a39d1bdc73fc983a7237b8d5ca5156cfa999c1dab3418bbc2be0920e0ee001c8aa4812d1dae75d080f09e91e0abda83ff9a76e8384a4429f4849248069a59505b12ac2c14ba2e4d1a13afcdaf54e508697ff928a9f738e6f4a6fc27409c55329eb149b5ff89c5a2d7c06bf9e62086f955cad17d7be2623ee9d5ec56068eadc23cb0965a13ff97d49fe10ef41afc6eeca36b4ace9582097faff89f590bc831cdb3a69eec5d15b67c3f2cad49e37ed053733e3d2d400c47755b932bdbe15d749fd6ad1dce30ba5e66094dfb6ee6f64cafb807e11b19a990c5d078c6d6701cda0bdeb21e99404ff166074f4c89b04c418f4e7940db5c78647c475bcfb85d4c4e836ee7d7c1d53e9e736b5d96d4b4d8b98209064b729ac6a682d55a6a930e518d849898bb28329ca0aaa133b5e5270a9d5940cac6af4802a57fd971efda91abb602882dd6aa6ce2b236b57b52ee2481498f0cacbcc2c36c238bc84becad7eaaf1125b9a1ca9ded6c79f3f283a52050377809b2a9995d66e1636b0ed426fdd8685c47cb18e82077f4aefcc07887e1dc58b4d64be1632f0e7b4625da6f40c65a8512a6454a4b96963e7f876136e6c0069a519a79ad632078ed965aa12482458060c030ed50db706d854f88cb004630b49285d8af8b471ff8f6070687826412287b50049bcb7d1b6b62ef90203010001a310300e300c0603551d13040530030101ff300d06092a864886f70d01010b0500038202010051c0b7bd793181dc29ca777d3773f928a366c8469ecf2fa3cfb076e8831970d19bb2b96e44e8ccc647cf0696bb824ac61c23d958525d283cab26037b04d58aa79bf92192db843adf5c26a980f081d2f0e14f759fc5ff4c5bb3dce0860299bfe7b349a8155a2efaf731ba25ce796a80c1442c7bf80f8c1a7912ff0b6f6592264315337251a846460194fa594f81f38f9e5233a63201e931ad9cab5bf119f24025613f307194eaa6eb39a83f3c05a49ba34455b1aff7c6839bbb657d9392ffdf397432af6e56ba9534a8b07d7060fe09691c6cf07cb5324f67b3cc0871a8c621d81fe71d71085c55206a4f57e25f774fd4b979b299e8bb076b50fca42fa57da2d519fd35a4a7c0137babaed4345f8031b63b6a71f5e8268f709d658ccd7c2a58849379d25bfa598c3f4a2c3d9b7d89285fefeb7f0ec65137d38b08ce432a15688b624a179e6a4a505ebc3bcdfbc4d4330508ee2d8d0f016924dcec21a6838ef7d834c6f43bde4a5201ed0b3bb4e9bd377b470e36bcf5bc3d56169dbd8e39567aa7dce4d1a8a8a54a5e1aa6fb1a8aab0062669a966f96e15ccce6fe12ea5e6a8b8c8823bdc94988ca39759fd1cc8fd8ae5c3d74db50b174cf7d77655016c075c91d439ed01cc0a9f695c99fad3b5495fb6cb1e01a5fa020cc6022a85c07ec55f9eba89719f86e49d34ab5bd208c5f70cced2b7b7963c014f8404432979b506de29e",
      "User-Agent": "EasyPlex (Android 14; SM-A546B; Samsung Galaxy A54 5G; tr)",
      "Accept": "application/json"
    };
    var STREAM_HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": PANEL_BASE + "/",
      "Origin": PANEL_BASE
    };
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.movies.sinewix.api_base");
          if (v) API_BASE = String(v).replace(/\/+$/, "");
          v = val("urls.movies.sinewix.panel_base");
          if (v) PANEL_BASE = String(v).replace(/\/+$/, "");
          if (STREAM_HEADERS) {
            STREAM_HEADERS.Referer = PANEL_BASE + "/";
            STREAM_HEADERS.Origin = PANEL_BASE;
          }
        });
      }
      return _cfgReady;
    }
    function resolveMediaFireLink(link) {
      return fetch(link, { signal: timeoutSignal(8e3) }).then(function(res) {
        return res.text();
      }).then(function(html) {
        var match = html.match(/href="(https:\/\/download\d+\.mediafire\.com[^"]+)"/);
        return match ? match[1] : link;
      }).catch(function() {
        return link;
      });
    }
    function buildStreams(videos) {
      if (!Array.isArray(videos)) return Promise.resolve([]);
      return Promise.all(
        videos.map(function(v) {
          var link = v.link;
          var serverName = v.server || "Sunucu";
          var isMF = link && link.includes("mediafire.com");
          var isDual = v.lang && /dual/i.test(v.lang) || link && /dual/i.test(link);
          var langStr = isDual ? "DUAL (TR/EN)" : v.lang || "T\xFCrk\xE7e";
          var displayTitle = "\u231C S\u0130NEW\u0130X \u231F | " + (isMF ? "MED\u0130AF\u0130RE" : serverName.toUpperCase()) + " (" + langStr + " - 1080p MKV)";
          if (isMF) {
            return resolveMediaFireLink(link).then(function(finalUrl) {
              return {
                name: "SineWix",
                title: displayTitle,
                url: finalUrl,
                quality: "1080p",
                format: "mkv",
                isHls: false,
                headers: STREAM_HEADERS,
                behaviorHints: {
                  notWebReady: true,
                  proxyHeaders: { request: STREAM_HEADERS }
                },
                provider: "sinewix"
              };
            });
          }
          return Promise.resolve({
            name: "SineWix",
            title: displayTitle,
            url: link,
            quality: "1080p",
            format: "mkv",
            isHls: false,
            headers: STREAM_HEADERS,
            behaviorHints: {
              notWebReady: true,
              proxyHeaders: { request: STREAM_HEADERS }
            },
            provider: "sinewix"
          });
        })
      );
    }
    function searchAndFetch(title, originalTitle, targetImdb, mediaType, seasonNum, episodeNum, targetYear, targetTmdbId, signal) {
      return __async(this, null, function* () {
        try {
          var query = originalTitle || title || "";
          if (!query) return [];
          var res = yield fetchWithTimeout(API_BASE + "/search/" + encodeURIComponent(query) + "/" + API_KEY, { headers: API_HEADERS, signal }, 8e3);
          var data = yield res.json().catch(function() {
            return {};
          });
          var results = data.search || [];
          if (results.length === 0 && title && title.toLowerCase() !== query.toLowerCase()) {
            var fRes = yield fetchWithTimeout(API_BASE + "/search/" + encodeURIComponent(title) + "/" + API_KEY, { headers: API_HEADERS, signal }, 8e3);
            var fData = yield fRes.json().catch(function() {
              return {};
            });
            results = fData.search || [];
          }
          if (!results || results.length === 0) return [];
          for (var k = 0; k < results.length; k++) {
            var it = results[k];
            var candTitle = it.title || it.name || "";
            var candYear = (it.release_date || it.first_air_date || "").split("-")[0];
            var s1 = calculateMatchScore(originalTitle || title, targetYear, candTitle, "", candYear);
            var s2 = title ? calculateMatchScore(title, targetYear, candTitle, "", candYear) : { matched: false, score: 0 };
            it._score = Math.max(s1.score || 0, s2.score || 0);
            it._matched = s1.matched || s2.matched;
          }
          var validCandidates = results.filter(function(r) {
            return r._matched && r._score >= 50;
          }).sort(function(a, b) {
            return b._score - a._score;
          });
          if (validCandidates.length === 0) {
            throw new ProviderError("NO_MATCH", "SineWix aday e\u015Fle\u015Fmesi bulunamad\u0131", "matching");
          }
          var topCandidates = validCandidates.slice(0, 2);
          var path = mediaType === "movie" ? "media/detail" : "series/show";
          var detailedItems = yield Promise.all(topCandidates.map(function(item) {
            return fetchWithTimeout(API_BASE + "/" + path + "/" + item.id + "/" + API_KEY, { headers: API_HEADERS, signal }, 8e3).then(function(r) {
              return r.json();
            }).catch(function() {
              return null;
            });
          }));
          var cleanTmdb = targetTmdbId ? String(targetTmdbId) : null;
          var bestMatch = detailedItems.find(function(item) {
            if (!item) return false;
            if (cleanTmdb && item.tmdb_id && String(item.tmdb_id) === cleanTmdb) return true;
            if (targetImdb && item.imdb_external_id && item.imdb_external_id === targetImdb) return true;
            var itemYear = (item.release_date || item.first_air_date || "").split("-")[0];
            var itemTitle = (item.title || item.name || "").toLowerCase().trim();
            var origMatch = originalTitle && itemTitle === originalTitle.toLowerCase().trim();
            var titleMatch = title && itemTitle === title.toLowerCase().trim();
            return (origMatch || titleMatch) && (!targetYear || !itemYear || itemYear === targetYear);
          });
          if (!bestMatch && detailedItems.length > 0) {
            bestMatch = detailedItems.find(function(item) {
              if (!item) return false;
              var itemTitle = (item.title || item.name || "").toLowerCase().trim();
              return originalTitle && itemTitle.includes(originalTitle.toLowerCase().trim()) || title && itemTitle.includes(title.toLowerCase().trim());
            });
          }
          if (!bestMatch) {
            throw new ProviderError("NO_MATCH", "SineWix detay e\u015Fle\u015Fmesi bulunamad\u0131", "matching");
          }
          var vList = [];
          if (mediaType === "movie") {
            vList = bestMatch.videos || [];
          } else {
            var s = (bestMatch.seasons || []).find(function(sea) {
              return parseInt(sea.season_number) === parseInt(seasonNum);
            });
            if (s && s.episodes) {
              var e = s.episodes.find(function(ep) {
                return parseInt(ep.episode_number) === parseInt(episodeNum);
              });
              if (e) vList = e.videos || [];
            }
          }
          return yield buildStreams(vList);
        } catch (e2) {
          if (e2 && (e2.name === "ProviderError" || e2.name === "AbortError" || e2.message === "TIMEOUT")) {
            throw e2;
          }
          return [];
        }
      });
    }
    function resolveTmdbInfo(rawId, mediaType, signal) {
      return __async(this, null, function* () {
        var TMDB_KEY = "4ef0d7355d9ffb5151e987764708ce96";
        var cleanId = String(rawId).replace(/^tmdb:/, "").split(":")[0].trim();
        var isImdb = cleanId.startsWith("tt");
        var isTV = mediaType === "tv" || mediaType === "series";
        try {
          if (isImdb) {
            var r = yield fetchWithTimeout("https://api.themoviedb.org/3/find/" + cleanId + "?api_key=" + TMDB_KEY + "&external_source=imdb_id", { signal }, 8e3);
            var d = yield r.json();
            var item = isTV ? d.tv_results && d.tv_results[0] : d.movie_results && d.movie_results[0];
            if (!item) return null;
            return {
              id: item.id,
              tmdb_id: item.id,
              title: item.title || item.name,
              original_title: item.original_title || item.original_name,
              release_date: item.release_date || item.first_air_date || "",
              imdb_id: cleanId
            };
          }
          var tmdbType = isTV ? "tv" : "movie";
          var res = yield fetchWithTimeout("https://api.themoviedb.org/3/" + tmdbType + "/" + cleanId + "?api_key=" + TMDB_KEY + "&language=tr-TR&append_to_response=external_ids", { signal }, 8e3);
          var data = yield res.json();
          if (!data || !data.title && !data.name) return null;
          data.tmdb_id = data.id;
          return data;
        } catch (e) {
          if (e && (e.name === "ProviderError" || e.name === "AbortError" || e.message === "TIMEOUT" || signal && signal.aborted)) {
            throw e;
          }
          return null;
        }
      });
    }
    function getCatalog(args) {
      return __async(this, null, function* () {
        try {
          var query = args && args.search || args && args.extra && args.extra.search || args && args.query || "";
          var isMovie = args && (args.type === "movie" || args.id === "anthology_sinewix_movies");
          if (query) {
            var sRes = yield fetch(API_BASE + "/search/" + encodeURIComponent(query) + "/" + API_KEY, { headers: API_HEADERS, signal: timeoutSignal(8e3) });
            var sData = yield sRes.json();
            var items = (sData.search || []).map(function(it) {
              var mType = it.type === "movie" || it.title ? "movie" : "series";
              return {
                id: (mType === "movie" ? "sinewix:movie:" : "sinewix:series:") + it.id,
                type: mType === "movie" ? "movie" : "tv",
                name: it.title || it.name,
                poster: (it.poster_path || "").replace("http://", "https://"),
                background: (it.backdrop_path || "").replace("http://", "https://"),
                description: it.overview || "",
                genres: ["SineWix"]
              };
            });
            return { metas: items };
          }
          if (isMovie) {
            var mRes = yield fetch(API_BASE + "/search/film/" + API_KEY, { headers: API_HEADERS, signal: timeoutSignal(8e3) });
            var mData = yield mRes.json();
            var mItems = (mData.search || []).map(function(it) {
              return {
                id: "sinewix:movie:" + it.id,
                type: "movie",
                name: it.title || it.name,
                poster: (it.poster_path || "").replace("http://", "https://"),
                background: (it.backdrop_path || "").replace("http://", "https://"),
                description: it.overview || "",
                genres: ["SineWix", "Film"]
              };
            });
            return { metas: mItems };
          }
          var serRes = yield fetch(API_BASE + "/series/popular/" + API_KEY, { headers: API_HEADERS, signal: timeoutSignal(8e3) });
          var serData = yield serRes.json();
          var sItems = (serData.popularSeries || []).map(function(it) {
            return {
              id: "sinewix:series:" + it.id,
              type: "tv",
              name: it.name,
              poster: (it.poster_path || "").replace("http://", "https://"),
              background: (it.backdrop_path || "").replace("http://", "https://"),
              description: it.overview || "",
              genres: ["SineWix", "Pop\xFCler Dizi"]
            };
          });
          return { metas: sItems };
        } catch (e) {
          return { metas: [] };
        }
      });
    }
    function getMeta(args) {
      return __async(this, null, function* () {
        try {
          var rawId = typeof args === "string" ? args : args && args.id ? args.id : "";
          if (!rawId) return { meta: null };
          if (rawId.startsWith("sinewix:movie:")) {
            var mId = rawId.replace("sinewix:movie:", "");
            var res = yield fetch(API_BASE + "/media/detail/" + mId + "/" + API_KEY, { headers: API_HEADERS, signal: timeoutSignal(8e3) });
            var it = yield res.json();
            return {
              meta: {
                id: rawId,
                type: "movie",
                name: it.title || it.name,
                poster: (it.poster_path || "").replace("http://", "https://"),
                background: (it.backdrop_path || "").replace("http://", "https://"),
                description: it.overview || "",
                genres: ["SineWix", "Film"],
                videos: [{ id: rawId, title: it.title || it.name }]
              }
            };
          }
          if (rawId.startsWith("sinewix:series:")) {
            var sId = rawId.replace("sinewix:series:", "");
            var sRes = yield fetch(API_BASE + "/series/show/" + sId + "/" + API_KEY, { headers: API_HEADERS, signal: timeoutSignal(8e3) });
            var sIt = yield sRes.json();
            var videos = [];
            (sIt.seasons || []).forEach(function(sea) {
              var sNum = sea.season_number !== void 0 && sea.season_number !== null && !isNaN(parseInt(sea.season_number)) ? parseInt(sea.season_number) : 1;
              (sea.episodes || []).forEach(function(ep) {
                var eNum = ep.episode_number !== void 0 && ep.episode_number !== null && !isNaN(parseInt(ep.episode_number)) ? parseInt(ep.episode_number) : 1;
                videos.push({
                  id: "sinewix:ep:" + sId + ":" + sNum + ":" + eNum,
                  title: ep.name || sNum + ". Sezon " + eNum + ". B\xF6l\xFCm",
                  season: sNum,
                  episode: eNum
                });
              });
            });
            return {
              meta: {
                id: rawId,
                type: "tv",
                name: sIt.name,
                poster: (sIt.poster_path || "").replace("http://", "https://"),
                background: (sIt.backdrop_path || "").replace("http://", "https://"),
                description: sIt.overview || "",
                genres: ["SineWix", "Pop\xFCler Dizi"],
                videos
              }
            };
          }
          return { meta: null };
        } catch (e) {
          return { meta: null };
        }
      });
    }
    function getStreams(id, mediaType, seasonNum, episodeNum, options) {
      return __async(this, null, function* () {
        var signal = options && options.signal;
        try {
          if (typeof id === "object" && id) {
            seasonNum = id.season || seasonNum;
            episodeNum = id.episode || episodeNum;
            mediaType = id.type || mediaType;
            id = id.id || id.tmdb_id;
          }
          if (typeof id === "string" && !id.startsWith("sinewix:")) {
            var cleanId = id.trim();
            if (cleanId.includes(":")) {
              var p = cleanId.split(":");
              id = p[0];
              if (p[1]) seasonNum = p[1];
              if (p[2]) episodeNum = p[2];
              if (seasonNum) mediaType = "tv";
            }
          }
          if (!mediaType) {
            mediaType = seasonNum || episodeNum ? "tv" : "movie";
          }
          if (typeof id === "string" && id.startsWith("sinewix:movie:")) {
            var mId = id.replace("sinewix:movie:", "");
            var mRes = yield fetchWithTimeout(API_BASE + "/media/detail/" + mId + "/" + API_KEY, { headers: API_HEADERS, signal }, 8e3);
            var mData = yield mRes.json();
            return yield buildStreams(mData.videos || []);
          }
          if (typeof id === "string" && id.startsWith("sinewix:series:")) {
            var showMeta = yield getMeta(id);
            if (showMeta && showMeta.meta && Array.isArray(showMeta.meta.videos) && showMeta.meta.videos.length > 0) {
              return yield getStreams(showMeta.meta.videos[0].id, mediaType, seasonNum, episodeNum, options);
            }
          }
          if (typeof id === "string" && id.startsWith("sinewix:ep:")) {
            var parts = id.replace("sinewix:ep:", "").split(":");
            var showId = parts[0];
            var targetSeason = parseInt(parts[1]) || 1;
            var targetEpisode = parseInt(parts[2]) || 1;
            var sRes = yield fetchWithTimeout(API_BASE + "/series/show/" + showId + "/" + API_KEY, { headers: API_HEADERS, signal }, 8e3);
            var sData = yield sRes.json();
            var targetSeasonObj = (sData.seasons || []).find(function(s) {
              return parseInt(s.season_number) === targetSeason;
            });
            if (targetSeasonObj && targetSeasonObj.episodes) {
              var targetEpObj = targetSeasonObj.episodes.find(function(e) {
                return parseInt(e.episode_number) === targetEpisode;
              });
              if (targetEpObj && targetEpObj.videos) {
                return yield buildStreams(targetEpObj.videos);
              }
            }
            return [];
          }
          var data = yield resolveTmdbInfo(id, mediaType, signal);
          if (!data) {
            throw new ProviderError("TMDB_ERROR", "SineWix TMDB bilgisi \xE7\xF6z\xFClemedi", "tmdb");
          }
          var ot = data.original_title || data.original_name || data.title || data.name;
          var releaseDate = data.release_date || data.first_air_date || "";
          var year = releaseDate ? releaseDate.split("-")[0] : "";
          var targetImdb = data.imdb_id || data.external_ids && data.external_ids.imdb_id;
          var targetTmdbId = data.tmdb_id || data.id;
          var streams = yield searchAndFetch(data.title || data.name, ot, targetImdb, mediaType, seasonNum || 1, episodeNum || 1, year, targetTmdbId, signal);
          return streams || [];
        } catch (e) {
          if (e && (e.name === "ProviderError" || e.name === "AbortError" || e.message === "TIMEOUT" || signal && signal.aborted)) {
            throw e;
          }
          return [];
        }
      });
    }
    var _origGetStreams = getStreams;
    getStreams = function() {
      return __async(this, arguments, function* () {
        var res = yield _origGetStreams.apply(this, arguments);
        return sortStreamsByQuality(res);
      });
    };
    if (typeof module2 !== "undefined") module2.exports = wrapAll({ getStreams, getMeta, getCatalog }, cfgReady);
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
var provider = require_sinewix();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "sinewix", "id": "mum_sinewix", "name": "SineWix", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "unverified", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
