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
            base: "https://filmmodu.icu",
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

// src/hdfilmizle/index.js
var require_hdfilmizle = __commonJS({
  "src/hdfilmizle/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { pickBestCandidate } = require_matching();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v = val("urls.movies.hdfilmizle.bases");
          if (v && Object.prototype.toString.call(v) === "[object Array]" && v.length) {
            BASES = v.map(function(s) {
              return String(s).replace(/\/+$/, "");
            });
          }
        });
      }
      return _cfgReady;
    }
    var BASES = ["https://www.hdfilmizle.vip", "https://www.hdfilmizle.ink"];
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function fetchWithTimeout(url, options, ms) {
      var opts = options || {};
      try {
        if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
          opts.signal = AbortSignal.timeout(ms || 15e3);
        }
      } catch (e) {
      }
      return fetch(url, opts);
    }
    function headersFor(base) {
      return {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
        "Referer": base + "/"
      };
    }
    function base64Decode(str) {
      try {
        if (typeof atob === "function") return atob(str);
        if (typeof Buffer !== "undefined") return Buffer.from(str, "base64").toString("binary");
      } catch (e) {
      }
      return "";
    }
    function rot13(str) {
      return str.replace(/[a-zA-Z]/g, function(c) {
        var code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCharCode((code - 65 + 13) % 26 + 65);
        if (code >= 97 && code <= 122) return String.fromCharCode((code - 97 + 13) % 26 + 97);
        return c;
      });
    }
    function decodeVidmoxy(encoded) {
      try {
        var b64 = base64Decode(encoded);
        if (!b64) return null;
        var reversed = b64.split("").reverse().join("");
        return rot13(reversed);
      } catch (e) {
        return null;
      }
    }
    function decodeVidrameXor(d, k) {
      try {
        var o = "";
        for (var i = 0; i < d.length; i++) {
          o += String.fromCharCode(d[i] ^ k.charCodeAt(i % k.length) ^ i * 17 + 13 & 255);
        }
        return o;
      } catch (e) {
        return null;
      }
    }
    function resolveTmdbInfo(id) {
      return __async(this, null, function* () {
        try {
          var cleanId = String(id || "").trim();
          if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
          var title = "";
          var origTitle = "";
          var year = null;
          if (cleanId.startsWith("tt")) {
            var findRes = yield fetchWithTimeout("https://api.themoviedb.org/3/find/" + cleanId + "?api_key=" + TMDB_API_KEY + "&external_source=imdb_id", {}, 1e4);
            if (findRes.ok) {
              var fd = yield findRes.json();
              var match = fd.movie_results && fd.movie_results[0] || fd.tv_results && fd.tv_results[0];
              if (match) {
                title = match.title || match.name || "";
                origTitle = match.original_title || match.original_name || "";
                var rDate = match.release_date || match.first_air_date || "";
                if (rDate) year = parseInt(rDate.split("-")[0], 10);
              }
            }
          } else {
            var tRes = yield fetchWithTimeout("https://api.themoviedb.org/3/movie/" + cleanId + "?api_key=" + TMDB_API_KEY + "&language=tr-TR", {}, 1e4);
            if (tRes.ok) {
              var td = yield tRes.json();
              title = td.title || "";
              origTitle = td.original_title || "";
              var rd = td.release_date || "";
              if (rd) year = parseInt(rd.split("-")[0], 10);
            }
          }
          return { title, origTitle, year };
        } catch (e) {
          return { title: "", origTitle: "", year: null };
        }
      });
    }
    function parseCards(html, base) {
      var out = [];
      var seen = /* @__PURE__ */ new Set();
      var vipRe = /<a[^>]+href="(\/[^"\/]+\/)"[^>]+title="([^"]+)"[^>]+class="[^"]*poster[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      var vm;
      while ((vm = vipRe.exec(html)) !== null) {
        var href = base + vm[1];
        if (seen.has(href)) continue;
        var title = vm[2].trim();
        var imgM = vm[3].match(/data-src="([^"]+)"/i) || vm[3].match(/data-srcset="([^",\s]+)/i) || vm[3].match(/src="([^"]+)"/i);
        var poster = imgM ? imgM[1].startsWith("http") ? imgM[1] : base + imgM[1] : "";
        seen.add(href);
        out.push({ title, href, poster, base });
      }
      var re = /<article[^>]+class="[^"]*\bitem\b[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      var m;
      while ((m = re.exec(html)) !== null) {
        var inner = m[1];
        var hrefMatch = inner.match(/<div[^>]+class="[^"]*poster[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"/i) || inner.match(/<a[^>]+href="([^"]+\/film\/[^"]+)"[^>]*>/i);
        if (!hrefMatch) continue;
        var href = hrefMatch[1];
        if (href.startsWith("/")) href = base + href;
        if (!href.startsWith("http") || seen.has(href)) continue;
        var titleMatch = inner.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
        var imgMatch = inner.match(/<img[^>]+data-src="([^"]+)"/i) || inner.match(/<img[^>]+src="(https?:[^"]+)"/i);
        var altMatch = inner.match(/<img[^>]+alt="([^"]*)"/i);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : altMatch ? altMatch[1].trim() : "";
        if (!title) continue;
        seen.add(href);
        out.push({ title, href, poster: imgMatch ? imgMatch[1] : "", base });
      }
      return out;
    }
    function searchVip(query) {
      return __async(this, null, function* () {
        try {
          var base = BASES && BASES[0] || "https://www.hdfilmizle.vip";
          var form = new URLSearchParams();
          form.append("query", query);
          var res = yield fetchWithTimeout(base + "/search/", {
            method: "POST",
            headers: {
              "User-Agent": UA,
              "Content-Type": "application/x-www-form-urlencoded",
              "Referer": base + "/"
            },
            body: form.toString()
          }, 15e3);
          if (!res.ok) return [];
          var items = yield res.json();
          if (!Array.isArray(items)) return [];
          var out = [];
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item || !item.slug) continue;
            var href = base + "/" + item.slug.replace(/^\/+|\/+$/g, "") + "/";
            var poster = item.thumb_url ? item.thumb_url.startsWith("http") ? item.thumb_url : base + item.thumb_url : "";
            out.push({
              title: item.name || "",
              href,
              poster,
              base,
              year: item.year ? parseInt(item.year, 10) : null
            });
          }
          return out;
        } catch (e) {
          return [];
        }
      });
    }
    function searchAll(query) {
      return __async(this, null, function* () {
        var vipCards = yield searchVip(query);
        if (vipCards && vipCards.length > 0) return vipCards;
        var all = [];
        for (var i = 0; i < BASES.length; i++) {
          try {
            var base = BASES[i];
            var res = yield fetchWithTimeout(base + "/?s=" + encodeURIComponent(query), { headers: headersFor(base) }, 15e3);
            if (!res.ok) continue;
            var cards = parseCards(yield res.text(), base);
            for (var j = 0; j < cards.length; j++) all.push(cards[j]);
            if (all.length > 0) break;
          } catch (e) {
          }
        }
        return all;
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
    function resolveVidrame(vidrameUrl, ref) {
      return __async(this, null, function* () {
        try {
          var vRes = yield fetchWithTimeout(vidrameUrl, {
            headers: { "User-Agent": UA, "Referer": ref || (BASES && BASES[0] || "https://www.hdfilmizle.vip") + "/" }
          }, 15e3);
          if (!vRes.ok) return null;
          var vHtml = yield vRes.text();
          var streamUrl = "";
          var srcMatch = vHtml.match(/sources\s*:\s*\[\{\s*file\s*:\s*\(function[\s\S]*?\)\((\[[^\]]+\])\s*,\s*["']([^"']+)["']\)/i);
          if (srcMatch) {
            try {
              var d = JSON.parse(srcMatch[1]);
              var k = srcMatch[2];
              streamUrl = decodeVidrameXor(d, k);
            } catch (e) {
            }
          }
          if (!streamUrl) {
            var anySrc = vHtml.match(/\(\s*(\[[0-9,\s]+\])\s*,\s*["']([a-zA-Z0-9]+)["']\s*\)/);
            if (anySrc) {
              try {
                streamUrl = decodeVidrameXor(JSON.parse(anySrc[1]), anySrc[2]);
              } catch (e) {
              }
            }
          }
          if (!streamUrl || !streamUrl.startsWith("http")) return null;
          var subs = [];
          var trMatch = vHtml.match(/configs\.tracks\s*=\s*(\[[\s\S]*?\]);/);
          if (trMatch) {
            try {
              var trList = JSON.parse(trMatch[1]);
              for (var ti = 0; ti < trList.length; ti++) {
                var t = trList[ti];
                if (t && t.fx && t.fx.d && t.fx.k) {
                  var sUrl = decodeVidrameXor(t.fx.d, t.fx.k);
                  if (sUrl && sUrl.startsWith("http")) {
                    var lCode = t.language === "tur" ? "tr" : t.language === "eng" ? "en" : t.language || "tr";
                    subs.push({
                      id: t.language || "sub_" + ti,
                      url: sUrl,
                      file: sUrl,
                      link: sUrl,
                      lang: t.language || "tur",
                      language: lCode,
                      label: t.label || (lCode === "tr" ? "T\xFCrk\xE7e" : "English"),
                      name: t.label || (lCode === "tr" ? "T\xFCrk\xE7e" : "English"),
                      title: t.label || (lCode === "tr" ? "T\xFCrk\xE7e" : "English"),
                      format: "vtt",
                      type: "text/vtt",
                      mimeType: "text/vtt"
                    });
                  }
                }
              }
            } catch (e) {
            }
          }
          return { streamUrl, subtitles: subs };
        } catch (e) {
          return null;
        }
      });
    }
    function resolveVidmoxy(vidmoxyUrl, ref) {
      return __async(this, null, function* () {
        try {
          var mRes = yield fetchWithTimeout(vidmoxyUrl, {
            headers: { "User-Agent": UA, "Referer": ref || (BASES && BASES[0] || "https://www.hdfilmizle.vip") + "/" }
          }, 15e3);
          if (!mRes.ok) return null;
          var mHtml = yield mRes.text();
          var streamUrl = "";
          var eeMatch = mHtml.match(/EE\.dd\s*\(\s*["']([^"']+)["']\s*\)/i);
          if (eeMatch) {
            streamUrl = decodeVidmoxy(eeMatch[1]);
          }
          if (!streamUrl || !streamUrl.startsWith("http")) return null;
          var subs = [];
          var trMatch = mHtml.match(/tracks\s*:\s*(\[[\s\S]*?\])/);
          if (trMatch) {
            try {
              var trList = JSON.parse(trMatch[1]);
              for (var ti = 0; ti < trList.length; ti++) {
                var t = trList[ti];
                if (t && t.file && typeof t.file === "string" && t.file.indexOf(".vtt") !== -1) {
                  var sUrl = t.file.startsWith("http") ? t.file : "https://vidmoxy.net" + (t.file.startsWith("/") ? "" : "/") + t.file;
                  var lCode = t.language === "tur" ? "tr" : t.language === "eng" ? "en" : t.language || "tr";
                  subs.push({
                    id: t.language || "sub_" + ti,
                    url: sUrl,
                    file: sUrl,
                    link: sUrl,
                    lang: t.language || "tur",
                    language: lCode,
                    label: t.label || (lCode === "tr" ? "T\xFCrk\xE7e" : "English"),
                    name: t.label || (lCode === "tr" ? "T\xFCrk\xE7e" : "English"),
                    title: t.label || (lCode === "tr" ? "T\xFCrk\xE7e" : "English"),
                    format: "vtt",
                    type: "text/vtt",
                    mimeType: "text/vtt"
                  });
                }
              }
            } catch (e) {
            }
          }
          return { streamUrl, subtitles: subs };
        } catch (e) {
          return null;
        }
      });
    }
    function resolveFastplay(fastplayUrl, fastplayRef) {
      return __async(this, null, function* () {
        try {
          var fpRes = yield fetchWithTimeout(fastplayUrl, {
            headers: { "User-Agent": UA, "Referer": fastplayRef }
          }, 15e3);
          if (!fpRes.ok) return null;
          var fpHtml = yield fpRes.text();
          var manMatch = fpHtml.match(/(?:src|stream)\s*:\s*"(\/manifests\/[^"]+)"/);
          if (!manMatch) return null;
          var fpOrigin = fastplayUrl.match(/^(https?:\/\/[^/]+)/)[1];
          var manifestUrl = fpOrigin + manMatch[1].replace(/&amp;/g, "&");
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
          return { manifestUrl, subtitles: subs, referer: fpRes.url || fastplayUrl };
        } catch (e) {
          return null;
        }
      });
    }
    function extractStreamsFromFilmPage(pageUrl, base) {
      return __async(this, null, function* () {
        var streams = [];
        try {
          var res = yield fetchWithTimeout(pageUrl, { headers: headersFor(base) }, 15e3);
          if (!res.ok) return [];
          var html = yield res.text();
          var partsMatch = html.match(/let\s+parts\s*=\s*(\[[\s\S]*?\]);/);
          if (partsMatch) {
            try {
              var parts = JSON.parse(partsMatch[1]);
              if (Array.isArray(parts) && parts.length > 0) {
                for (var pi = 0; pi < parts.length; pi++) {
                  var part = parts[pi];
                  if (!part || !part.data) continue;
                  var ifm = part.data.match(/src=["']([^"']+)["']/i);
                  if (!ifm) continue;
                  var iframeUrl = ifm[1].replace(/\\\//g, "/");
                  var pLang = part.lang === "tr" ? "TR Dublaj" : part.lang === "dual" ? "Dual (TR/EN)" : "TR Altyaz\u0131";
                  if (iframeUrl.indexOf("vidrame.") !== -1) {
                    var vr = yield resolveVidrame(iframeUrl, pageUrl);
                    if (vr && vr.streamUrl) {
                      var vrHeaders = { "User-Agent": "ExoPlayerLib/2.19.1", "Referer": "https://vidrame.pro/" };
                      streams.push({
                        name: "HDFilmIzle",
                        title: "\u231C HDFilmIzle \u231F | Vidrame (" + pLang + " - 1080p HLS)",
                        url: vr.streamUrl + (vr.streamUrl.indexOf(".m3u8") !== -1 ? "" : "#.m3u8"),
                        quality: "1080p",
                        provider: "hdfilmizle",
                        headers: vrHeaders,
                        type: "hls",
                        format: "hls",
                        isHls: true,
                        behaviorHints: { notWebReady: true, proxyHeaders: { request: vrHeaders } },
                        subtitles: vr.subtitles || []
                      });
                    }
                  } else if (iframeUrl.indexOf("vidmoxy.") !== -1) {
                    var vm = yield resolveVidmoxy(iframeUrl, pageUrl);
                    if (vm && vm.streamUrl) {
                      var vmHeaders = { "User-Agent": "ExoPlayerLib/2.19.1", "Referer": "https://vidmoxy.net/" };
                      streams.push({
                        name: "HDFilmIzle",
                        title: "\u231C HDFilmIzle \u231F | Vidmoxy (" + pLang + " - 1080p HLS)",
                        url: vm.streamUrl + (vm.streamUrl.indexOf(".m3u8") !== -1 ? "" : "#.m3u8"),
                        quality: "1080p",
                        provider: "hdfilmizle",
                        headers: vmHeaders,
                        type: "hls",
                        format: "hls",
                        isHls: true,
                        behaviorHints: { notWebReady: true, proxyHeaders: { request: vmHeaders } },
                        subtitles: vm.subtitles || []
                      });
                    }
                  } else if (iframeUrl.indexOf("fastplay.") !== -1 || iframeUrl.indexOf("setplay.") !== -1) {
                    var fastUrl = iframeUrl;
                    if (iframeUrl.indexOf("setplay.") !== -1) {
                      var spRes = yield fetchWithTimeout(iframeUrl, { headers: { "User-Agent": UA, "Referer": pageUrl } }, 15e3);
                      if (spRes.ok) {
                        var spHtml = yield spRes.text();
                        var cerMatch = spHtml.match(/SPG\.cerceve\(\s*"[^"]*"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/);
                        fastUrl = cerMatch ? spgDecode(cerMatch[1], cerMatch[2]) : null;
                      }
                    }
                    if (fastUrl) {
                      var fp = yield resolveFastplay(fastUrl, pageUrl);
                      if (fp && fp.manifestUrl) {
                        var sHeaders = { "User-Agent": "ExoPlayerLib/2.19.1", "Referer": fp.referer };
                        streams.push({
                          name: "HDFilmIzle",
                          title: "\u231C HDFilmIzle \u231F | FastPlay (" + pLang + " - 1080p HLS)",
                          url: fp.manifestUrl + "#.m3u8",
                          quality: "1080p",
                          provider: "hdfilmizle",
                          headers: sHeaders,
                          type: "hls",
                          format: "hls",
                          isHls: true,
                          behaviorHints: { notWebReady: true, proxyHeaders: { request: sHeaders } },
                          subtitles: fp.subtitles || []
                        });
                      }
                    }
                  }
                }
              }
            } catch (e) {
            }
          }
          if (streams.length > 0) return streams;
          var ajaxMatch = html.match(/["'](https?:[^"']*wp-admin\/admin-ajax\.php)["']/);
          var ajaxUrl = ajaxMatch ? ajaxMatch[1].replace(/\\\//g, "/") : base + "/wp-admin/admin-ajax.php";
          var nonceMatches = [...html.matchAll(/data-nonce="([a-z0-9]+)"/gi)].map(function(m) {
            return m[1];
          });
          var ajaxVideoNonce = (html.match(/window\.STF_AJAX[\s\S]*?video\s*:\s*"([a-z0-9]+)"/) || [])[1] || "";
          var nonces = [];
          if (ajaxVideoNonce) nonces.push(ajaxVideoNonce);
          for (var _ni = 0; _ni < nonceMatches.length; _ni++) if (nonces.indexOf(nonceMatches[_ni]) === -1) nonces.push(nonceMatches[_ni]);
          if (nonces.length === 0) return [];
          var players = [];
          var seenP = /* @__PURE__ */ new Set();
          var postIds = [];
          var piRe = /data-post-id="([^"]+)"/gi;
          var pim;
          while ((pim = piRe.exec(html)) !== null) {
            if (pim[1] && pim[1].indexOf("event") === -1 && pim[1].indexOf("$") === -1 && postIds.indexOf(pim[1]) === -1) postIds.push(pim[1]);
          }
          var btnRe = /data-player-name="([^"]+)"[^>]*data-part-key="([^"]*)"/gi;
          var bm;
          var btns = [];
          while ((bm = btnRe.exec(html)) !== null) {
            if (bm[1].indexOf("$") !== -1) continue;
            btns.push({ name: bm[1], key: bm[2] || "" });
          }
          postIds.forEach(function(pid) {
            btns.forEach(function(b) {
              var k = pid + "|" + b.name + "|" + b.key;
              if (!seenP.has(k)) {
                seenP.add(k);
                players.push({ id: pid, name: b.name, key: b.key });
              }
            });
          });
          if (players.length === 0) return [];
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
                    "User-Agent": UA,
                    "Referer": pageUrl,
                    "Origin": base,
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
                  headers: { "User-Agent": UA, "Referer": pageUrl }
                }, 15e3);
                if (!spRes.ok) continue;
                var spHtml = yield spRes.text();
                var cerMatch = spHtml.match(/SPG\.cerceve\(\s*"[^"]*"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/);
                var fastplayUrl = cerMatch ? spgDecode(cerMatch[1], cerMatch[2]) : null;
                if (!fastplayUrl) {
                  var fMatch = spHtml.match(/https?:\/\/fastplay\.[a-z]+\/stfplay\.php\?[^"'<>\s\\]+/i);
                  if (fMatch) fastplayUrl = fMatch[0].replace(/\\+/g, "");
                }
                if (!fastplayUrl || !fastplayUrl.startsWith("http")) continue;
                var fp = yield resolveFastplay(fastplayUrl, spRes.url || setplayUrl);
                if (!fp || !fp.manifestUrl) continue;
                var sHeaders = { "User-Agent": "ExoPlayerLib/2.19.1", "Referer": fp.referer };
                streams.push({
                  name: "HDFilmIzle",
                  title: "\u231C HDFilmIzle \u231F | FastPlay (1080p HLS)",
                  url: fp.manifestUrl + "#.m3u8",
                  quality: "1080p",
                  provider: "hdfilmizle",
                  headers: sHeaders,
                  type: "hls",
                  format: "hls",
                  isHls: true,
                  behaviorHints: { notWebReady: true, proxyHeaders: { request: sHeaders } },
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
          var cards = [];
          if (query) {
            cards = yield searchAll(query);
          } else {
            var base = BASES[0];
            var url = base.indexOf("vip") !== -1 ? base + "/" : base + "/film/";
            var res = yield fetchWithTimeout(url, { headers: headersFor(base) }, 15e3);
            if (res.ok) {
              cards = parseCards(yield res.text(), base);
            }
            if (cards.length === 0 && BASES[1]) {
              var b2 = BASES[1];
              var u2 = b2.indexOf("vip") !== -1 ? b2 + "/" : b2 + "/film/";
              var r2 = yield fetchWithTimeout(u2, { headers: headersFor(b2) }, 15e3);
              if (r2.ok) cards = parseCards(yield r2.text(), b2);
            }
          }
          var metas = cards.slice(0, 30).map(function(c) {
            return {
              id: "hdfilmizle:movie:" + encodeURIComponent(c.href),
              type: "movie",
              name: c.title,
              poster: c.poster || "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              background: c.poster || "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              genres: ["Film", "HDFilmIzle"],
              description: c.title + " - HDFilmIzle"
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
          if (!rawId || !rawId.startsWith("hdfilmizle:")) return { meta: null };
          var href = decodeURIComponent(rawId.split(":").slice(2).join(":"));
          var base = BASES[0];
          for (var i = 0; i < BASES.length; i++) {
            if (href.indexOf(BASES[i]) === 0) {
              base = BASES[i];
              break;
            }
          }
          var res = yield fetchWithTimeout(href, { headers: headersFor(base) }, 15e3);
          if (!res.ok) return { meta: null };
          var html = yield res.text();
          var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "HDFilmIzle";
          var ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
          var poster = ogImg ? ogImg[1] : "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png";
          return {
            meta: {
              id: rawId,
              type: "movie",
              name: title,
              poster,
              background: poster,
              description: title + " - HDFilmIzle",
              genres: ["Film", "HDFilmIzle"],
              videos: [{ id: rawId, title, released: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] }]
            }
          };
        } catch (e) {
          return { meta: null };
        }
      });
    }
    function getStreams(tmdbIdOrArgs, mediaType) {
      return __async(this, null, function* () {
        try {
          if (typeof tmdbIdOrArgs === "object" && tmdbIdOrArgs && tmdbIdOrArgs.id) {
            return getStreams(tmdbIdOrArgs.id, mediaType);
          }
          if (typeof tmdbIdOrArgs === "string" && tmdbIdOrArgs.startsWith("hdfilmizle:movie:")) {
            var href = decodeURIComponent(tmdbIdOrArgs.split(":").slice(2).join(":"));
            var b = BASES[0];
            for (var i = 0; i < BASES.length; i++) {
              if (href.indexOf(BASES[i]) === 0) {
                b = BASES[i];
                break;
              }
            }
            return yield extractStreamsFromFilmPage(href, b);
          }
          var info = yield resolveTmdbInfo(tmdbIdOrArgs);
          var searchTitles = [info.title, info.origTitle].filter(Boolean);
          if (searchTitles.length === 0) return [];
          for (var t = 0; t < searchTitles.length; t++) {
            var cards = yield searchAll(searchTitles[t]);
            if (!cards || cards.length === 0) continue;
            var best = pickBest(cards, searchTitles[t], info.year);
            if (!best) continue;
            var streams = yield extractStreamsFromFilmPage(best.href, best.base);
            if (streams.length > 0) return streams;
          }
          return [];
        } catch (e) {
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
      var limit = options && options.timeoutMs || source.timeoutMs || 12e3;
      return { getStreams: function(id, type, season, episode) {
        return __async(this, null, function* () {
          var started = Date.now(), timer, timedOut = false;
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
            var result = yield Promise.race([
              Promise.resolve().then(function() {
                return provider2.getStreams(id, type, season, episode);
              }),
              new Promise(function(_, reject) {
                timer = setTimeout(function() {
                  timedOut = true;
                  reject(new Error("TIMEOUT"));
                }, limit);
              })
            ]);
            var normalized = normalizeStreams(result);
            record.count = normalized.streams.length;
            record.rejected = normalized.invalid;
            record.status = record.count ? "sources-found" : normalized.invalid ? "invalid-results" : "empty";
            return normalized.streams;
          } catch (_) {
            record.status = timedOut ? "timeout" : "error";
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
var provider = require_hdfilmizle();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "hdfilmizle", "id": "mum_hdfilmizle", "name": "HDFilmIzle", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
