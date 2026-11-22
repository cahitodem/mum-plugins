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

// src/sezonlukdizi/index.js
var require_sezonlukdizi = __commonJS({
  "src/sezonlukdizi/index.js"(exports2, module2) {
    var { sortStreamsByQuality, filterHighestQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { fetchWithTimeout } = require_http();
    var { ProviderError } = require_errors();
    var cheerio = require("cheerio-without-node-native");
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v = val("urls.series.sezonlukdizi.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var PROVIDER_NAME = "SezonlukDizi";
    var BASE_URL = "https://sezonlukdizi.cc";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var WORKING_HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    function normalizeTitle(value) {
      return String(value || "").toLowerCase().replace(/[ıİ]/g, "i").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c").replace(/[^a-z0-9]+/g, " ").trim();
    }
    function resolveTmdbInfo(id, mediaType, signal) {
      return __async(this, null, function* () {
        try {
          var cleanId = String(id || "").trim();
          if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
          var numericId = null;
          var title = "";
          var origTitle = "";
          if (cleanId.startsWith("tt")) {
            var findRes = yield fetchWithTimeout(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`, { signal }, 8e3);
            if (findRes.ok) {
              var fData = yield findRes.json();
              var item = fData.tv_results && fData.tv_results[0];
              if (item) {
                numericId = item.id;
                title = item.name || "";
                origTitle = item.original_name || "";
              }
            }
          } else {
            numericId = cleanId;
          }
          if (numericId && (!title || !origTitle)) {
            var tRes = yield fetchWithTimeout(`https://api.themoviedb.org/3/tv/${numericId}?api_key=${TMDB_API_KEY}&language=tr-TR`, { signal }, 8e3);
            if (tRes.ok) {
              var tData = yield tRes.json();
              title = tData.name || title;
              origTitle = tData.original_name || origTitle;
            }
          }
          return { title, origTitle, numericId };
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
          return { title: "", origTitle: "", numericId: id };
        }
      });
    }
    function searchShow(titleTr, titleEn, signal) {
      return __async(this, null, function* () {
        var candidates = [titleTr, titleEn].map(normalizeTitle).filter(Boolean);
        if (!candidates.length) return null;
        var best = null;
        var bestScore = 0;
        for (var query of [titleTr, titleEn].filter(Boolean)) {
          try {
            var res = yield fetchWithTimeout(BASE_URL + "/ajax/arama.asp", {
              method: "POST",
              headers: Object.assign({}, WORKING_HEADERS, {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
              }),
              body: "q=" + encodeURIComponent(query),
              signal
            }, 8e3);
            if (!res.ok) continue;
            var data = yield res.json();
            if (data.status !== "success" || !data.results || !data.results.diziler || !Array.isArray(data.results.diziler.results)) {
              continue;
            }
            for (var item of data.results.diziler.results) {
              var itemTitle = normalizeTitle(item.title || "");
              var itemUrl = item.url || "";
              var slugMatch = itemUrl.match(/\/diziler\/([^/.]+)(?:\.html)?/i);
              if (!slugMatch) continue;
              var slug = slugMatch[1];
              var slugNorm = normalizeTitle(slug.replace(/-/g, " "));
              var score = 0;
              candidates.forEach(function(target) {
                if (slugNorm === target || itemTitle === target) score = Math.max(score, 100);
                else if (itemTitle.indexOf(target) === 0 || slugNorm.indexOf(target) === 0) score = Math.max(score, 80);
                else if (target.indexOf(itemTitle) === 0 && itemTitle.length >= 4) score = Math.max(score, 70);
                else if (target.indexOf(slugNorm) === 0 && slugNorm.length >= 4) score = Math.max(score, 65);
              });
              if (score > bestScore) {
                bestScore = score;
                best = {
                  did: item.did,
                  slug,
                  title: item.title,
                  url: itemUrl
                };
              }
            }
            if (bestScore >= 80) break;
          } catch (_) {
          }
        }
        return bestScore >= 60 ? best : null;
      });
    }
    function findEpisodeBid(slug, did, seasonNum, episodeNum, signal) {
      return __async(this, null, function* () {
        var targetHref = `${seasonNum}-sezon-${episodeNum}-bolum.html`;
        var directUrl = `${BASE_URL}/${slug}/${targetHref}`;
        try {
          var res = yield fetchWithTimeout(directUrl, { headers: WORKING_HEADERS, signal }, 8e3);
          if (res.ok) {
            var html = yield res.text();
            var $ = cheerio.load(html);
            var bid = $("#topBarBtn").attr("bid") || $("#dilsec").attr("data-id") || $("i[bid]").attr("bid");
            if (bid) {
              return { bid: String(bid).trim(), episodeUrl: directUrl };
            }
          }
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
        }
        if (did) {
          try {
            var bRes = yield fetchWithTimeout(BASE_URL + "/ajax/dataIzleBolumler.asp", {
              method: "POST",
              headers: Object.assign({}, WORKING_HEADERS, {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": directUrl
              }),
              body: `did=${encodeURIComponent(did)}&sno=${encodeURIComponent(seasonNum)}`,
              signal
            }, 8e3);
            if (bRes.ok) {
              var bHtml = yield bRes.text();
              var $b = cheerio.load(bHtml);
              var foundBid = null;
              $b("a[href]").each(function() {
                var href = $b(this).attr("href") || "";
                if (href.indexOf(targetHref) !== -1 || href.indexOf(`/${targetHref}`) !== -1) {
                  var itemContainer = $b(this).closest(".item");
                  var bElem = itemContainer.find("[bid]").first();
                  if (bElem.length) {
                    foundBid = bElem.attr("bid");
                    return false;
                  }
                }
              });
              if (foundBid) {
                return { bid: String(foundBid).trim(), episodeUrl: directUrl };
              }
            }
          } catch (e) {
            if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
          }
        }
        return null;
      });
    }
    function fetchAlternatifler(bid, dil, episodeUrl, signal) {
      return __async(this, null, function* () {
        try {
          var res = yield fetchWithTimeout(BASE_URL + "/ajax/dataAlternatif22.asp", {
            method: "POST",
            headers: Object.assign({}, WORKING_HEADERS, {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Referer": episodeUrl
            }),
            body: `bid=${encodeURIComponent(bid)}&dil=${encodeURIComponent(dil)}`,
            signal
          }, 8e3);
          if (!res.ok) return [];
          var data = yield res.json();
          return data.status === "success" && Array.isArray(data.data) ? data.data : [];
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
          return [];
        }
      });
    }
    function fetchEmbedIframe(embedId, episodeUrl, signal) {
      return __async(this, null, function* () {
        try {
          var res = yield fetchWithTimeout(BASE_URL + "/ajax/dataEmbed22.asp", {
            method: "POST",
            headers: Object.assign({}, WORKING_HEADERS, {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Referer": episodeUrl
            }),
            body: `id=${encodeURIComponent(embedId)}`,
            signal
          }, 8e3);
          if (!res.ok) return null;
          var html = yield res.text();
          if (html.indexOf("reCAPTCHADATA.asp") !== -1) return null;
          var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch) {
            var src = iframeMatch[1];
            if (src.startsWith("//")) src = "https:" + src;
            return src;
          }
          return null;
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
          return null;
        }
      });
    }
    function fetchVidMolyStream(iframeUrl, signal) {
      return __async(this, null, function* () {
        var fullUrl = iframeUrl.startsWith("//") ? "https:" + iframeUrl : iframeUrl;
        fullUrl = fullUrl.replace("vidmoly.to", "vidmoly.biz").replace("vidmoly.net", "vidmoly.biz");
        try {
          var r = yield fetchWithTimeout(fullUrl, {
            headers: {
              "User-Agent": WORKING_HEADERS["User-Agent"],
              "Referer": BASE_URL + "/"
            },
            signal
          }, 8e3);
          if (!r.ok) return null;
          var html = yield r.text();
          var m = html.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
          return m ? { url: m[1], type: "hls", referer: "https://vidmoly.biz/" } : null;
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
          return null;
        }
      });
    }
    function fetchSibnetStream(iframeUrl, signal) {
      return __async(this, null, function* () {
        try {
          var r = yield fetchWithTimeout(iframeUrl, {
            headers: {
              "User-Agent": WORKING_HEADERS["User-Agent"],
              "Referer": "https://video.sibnet.ru/"
            },
            signal
          }, 8e3);
          if (!r.ok) return null;
          var html = yield r.text();
          var m = html.match(/src\s*:\s*["'](\/v\/[^"']+\.mp4)["']/i);
          if (m) {
            return { url: "https://video.sibnet.ru" + m[1], type: "mp4", referer: "https://video.sibnet.ru/" };
          }
          return null;
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
          return null;
        }
      });
    }
    var decodeBase64ToBytes = function(e) {
      var t = e.replace(/-/g, "+").replace(/_/g, "/"), r = t.length % 4 === 0 ? 0 : 4 - t.length % 4, n = t + "=".repeat(r);
      var o;
      if (typeof atob === "function") o = atob(n);
      else if (typeof Buffer !== "undefined") o = Buffer.from(n, "base64").toString("binary");
      else return new Uint8Array(0);
      var a = new Uint8Array(o.length);
      for (var i = 0; i < o.length; i++) a[i] = o.charCodeAt(i);
      return a;
    };
    var getVersionPairs = function() {
      var e = {};
      for (var n = 1; n <= 20; n += 1) {
        var o = n ^ 0, a = 31 - n ^ 0;
        e[String(n)] = [o, a];
      }
      return e;
    };
    var selectKeyIndices = function(e, t) {
      var r = typeof e === "string" ? e.trim() : "", o = getVersionPairs()[r];
      if (!o) return [];
      var a = o[0], i = o[1];
      return a < 1 || i < 1 || a > t || i > t ? [] : [a, i];
    };
    var extractKeyParts = function(e) {
      var t = Array.isArray(e.key_parts) ? e.key_parts : [], r = selectKeyIndices(e.version, t.length);
      if (r.length === 0) return t;
      var n = r.map(function(o) {
        return Number(o);
      }).filter(function(o) {
        return Number.isInteger(o) && o >= 1 && o <= t.length;
      }).map(function(o) {
        return t[o - 1];
      }).filter(function(o) {
        return typeof o === "string" && o.length > 0;
      });
      return n.length > 0 ? n : t;
    };
    var assembleKey = function(e) {
      var t = e.filter(function(a2) {
        return typeof a2 === "string" && a2.length > 0;
      }).map(decodeBase64ToBytes), r = t.reduce(function(a2, i) {
        return a2 + i.length;
      }, 0), n = new Uint8Array(r);
      var o = 0;
      for (var a of t) {
        n.set(a, o);
        o += a.length;
      }
      return n;
    };
    function decryptBysePlayback(playback) {
      return __async(this, null, function* () {
        try {
          var c = typeof globalThis !== "undefined" ? globalThis.crypto || null : null;
          if (!c && typeof require === "function") {
            try {
              c = require("crypto").webcrypto;
            } catch (_) {
            }
          }
          if (!c || !c.subtle) return null;
          var keyData = assembleKey(extractKeyParts(playback));
          var iv = decodeBase64ToBytes(playback.iv);
          var payload = decodeBase64ToBytes(playback.payload);
          var key = yield c.subtle.importKey("raw", keyData, "AES-GCM", false, ["decrypt"]);
          var decrypted = yield c.subtle.decrypt({ name: "AES-GCM", iv }, key, payload);
          return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (_) {
          return null;
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
    function fetchByseStream(iframeUrl, signal) {
      return __async(this, null, function* () {
        try {
          var m = iframeUrl.match(/\/e\/([a-zA-Z0-9]+)/i);
          if (!m) return null;
          var code = m[1];
          var origin = new URL(iframeUrl).origin;
          var apiRes = yield fetchWithTimeout(`${origin}/api/videos/${code}`, {
            headers: {
              "User-Agent": WORKING_HEADERS["User-Agent"],
              "Referer": iframeUrl
            },
            signal
          }, 8e3);
          if (!apiRes.ok) return null;
          var data = yield apiRes.json();
          if (!data || !data.playback) return null;
          var decrypted = yield decryptBysePlayback(data.playback);
          if (!decrypted || !decrypted.sources || !decrypted.sources.length) return null;
          var results = [];
          var seenUrls = /* @__PURE__ */ Object.create(null);
          for (var src of decrypted.sources) {
            var masterUrl = src.url;
            if (!masterUrl) continue;
            try {
              var mRes = yield fetchWithTimeout(masterUrl, {
                headers: {
                  "User-Agent": WORKING_HEADERS["User-Agent"],
                  "Referer": origin + "/"
                },
                signal
              }, 8e3);
              if (mRes.ok) {
                var mText = yield mRes.text();
                var variants = parseMasterVariants(mText, masterUrl);
                if (variants && variants.length > 0) {
                  variants.sort(function(a, b) {
                    return (b.height || 0) - (a.height || 0) || (b.bandwidth || 0) - (a.bandwidth || 0);
                  });
                  var maxVariantHeight = variants[0].height || 0;
                  var topVariants = maxVariantHeight > 0 ? variants.filter(function(v2) {
                    return (v2.height || 0) >= maxVariantHeight;
                  }) : variants.slice(0, 1);
                  for (var v of topVariants) {
                    if (seenUrls[v.url]) continue;
                    seenUrls[v.url] = true;
                    results.push({
                      url: v.url,
                      type: "hls",
                      referer: origin + "/",
                      quality: v.quality,
                      bandwidth: v.bandwidth
                    });
                  }
                }
              }
            } catch (e) {
              if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
            }
            if (results.length === 0 && !seenUrls[masterUrl]) {
              seenUrls[masterUrl] = true;
              results.push({
                url: masterUrl,
                type: "hls",
                referer: origin + "/",
                quality: src.label || (src.height ? `${src.height}p` : "1080p")
              });
            }
          }
          return results.length > 0 ? results : null;
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError")) throw e;
          return null;
        }
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
          if (mediaType !== "tv" && mediaType !== "series") return [];
          if (!Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 || !Number.isInteger(Number(episodeNum)) || Number(episodeNum) < 1) {
            return [];
          }
          seasonNum = Number(seasonNum);
          episodeNum = Number(episodeNum);
          var info = yield resolveTmdbInfo(tmdbId, mediaType, signal);
          var titleTr = (info.title || "").trim();
          var titleEn = (info.origTitle || "").trim();
          var displayTitle = titleTr || titleEn || "Dizi";
          var show = yield searchShow(titleTr, titleEn, signal);
          if (!show || !show.slug) return [];
          var epInfo = yield findEpisodeBid(show.slug, show.did, seasonNum, episodeNum, signal);
          if (!epInfo || !epInfo.bid) return [];
          var dilConfigs = [
            { code: "1", label: "Altyaz\u0131l\u0131", flag: "\u{1F310} " },
            { code: "0", label: "Dublaj", flag: "\u{1F1F9}\u{1F1F7} " }
          ];
          var altsByDil = yield Promise.all(
            dilConfigs.map(function(dConf2) {
              return __async(this, null, function* () {
                var alts2 = yield fetchAlternatifler(epInfo.bid, dConf2.code, epInfo.episodeUrl, signal);
                return { dConf: dConf2, alts: alts2 };
              });
            })
          );
          var TURNSTILE_BLOCKED_HOSTS = ["dzen", "pixel", "vidmoly", "streamruby"];
          var tasks = [];
          for (var entry of altsByDil) {
            var dConf = entry.dConf;
            var alts = entry.alts || [];
            if (!alts.length) continue;
            var playableAlts = alts.filter(function(alt2) {
              var b = (alt2.baslik || "").toLowerCase();
              return !TURNSTILE_BLOCKED_HOSTS.some(function(h) {
                return b.includes(h);
              });
            });
            var chosenAlts = playableAlts.length > 0 ? playableAlts : alts.slice(0, 1);
            for (var alt of chosenAlts) {
              tasks.push({ alt, dConf });
            }
          }
          var resolvedEntries = yield Promise.all(
            tasks.map(function(task) {
              return __async(this, null, function* () {
                try {
                  var alt2 = task.alt;
                  var dConf2 = task.dConf;
                  var altTitle = (alt2.baslik || "").trim();
                  var quality = alt2.kalite ? `${alt2.kalite === 4 ? "1080p" : alt2.kalite === 3 ? "720p" : "480p"}` : "1080p";
                  var iframeSrc = yield fetchEmbedIframe(alt2.id, epInfo.episodeUrl, signal);
                  if (!iframeSrc) return null;
                  var resolvedStream = null;
                  var pName = altTitle || "Kaynak";
                  if (iframeSrc.indexOf("vidmoly") !== -1) {
                    pName = "VidMoly";
                    resolvedStream = yield fetchVidMolyStream(iframeSrc, signal);
                  } else if (iframeSrc.indexOf("sibnet") !== -1) {
                    pName = "Sibnet";
                    resolvedStream = yield fetchSibnetStream(iframeSrc, signal);
                  } else if (iframeSrc.indexOf("bysejikuar") !== -1 || iframeSrc.indexOf("filemoon") !== -1) {
                    pName = "FileMoon";
                    resolvedStream = yield fetchByseStream(iframeSrc, signal);
                  } else if (/\.(?:m3u8|mp4)(?:[?#]|$)/i.test(iframeSrc)) {
                    var isHls = /\.m3u8(?:[?#]|$)/i.test(iframeSrc);
                    resolvedStream = {
                      url: iframeSrc,
                      type: isHls ? "hls" : "mp4",
                      referer: BASE_URL + "/"
                    };
                  }
                  var streamList = Array.isArray(resolvedStream) ? resolvedStream : resolvedStream ? [resolvedStream] : [];
                  return streamList.filter(function(st) {
                    return st && st.url && st.type !== "embed";
                  }).map(function(st) {
                    return {
                      stream: st,
                      pName,
                      dConf: dConf2,
                      quality: st.quality || quality
                    };
                  });
                } catch (errInner) {
                  if (errInner && (errInner.name === "AbortError" || errInner.message === "TIMEOUT" || errInner.name === "ProviderError")) throw errInner;
                  return null;
                }
              });
            })
          );
          var allStreams = [];
          var seenUrls = /* @__PURE__ */ Object.create(null);
          var flattened = [];
          for (var res of resolvedEntries) {
            if (Array.isArray(res)) {
              for (var item of res) {
                if (item && item.stream && item.stream.url) flattened.push(item);
              }
            } else if (res && res.stream && res.stream.url) {
              flattened.push(res);
            }
          }
          for (var item of flattened) {
            if (!item || !item.stream || !item.stream.url || seenUrls[item.stream.url]) continue;
            seenUrls[item.stream.url] = true;
            var sHeaders = {
              "User-Agent": WORKING_HEADERS["User-Agent"],
              "Referer": item.stream.referer || BASE_URL + "/"
            };
            allStreams.push({
              name: displayTitle,
              title: `\u231C ${PROVIDER_NAME} \u231F | ${item.pName} | ${item.dConf.flag}${item.dConf.label} \xB7 ${seasonNum}. Sezon ${episodeNum}. B\xF6l\xFCm`,
              url: item.stream.url,
              quality: item.quality,
              type: item.stream.type || "hls",
              headers: sHeaders,
              behaviorHints: {
                notWebReady: true,
                proxyHeaders: { request: sHeaders }
              },
              provider: "sezonlukdizi"
            });
          }
          return allStreams;
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
var provider = require_sezonlukdizi();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "sezonlukdizi", "id": "mum_sezonlukdizi", "name": "SezonlukDizi", "supportedTypes": ["tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
