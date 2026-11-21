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

// src/sezonlukdizi/index.js
var require_sezonlukdizi = __commonJS({
  "src/sezonlukdizi/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
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
    function resolveTmdbInfo(id, mediaType) {
      return __async(this, null, function* () {
        try {
          var cleanId = String(id || "").trim();
          if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
          var numericId = null;
          var title = "";
          var origTitle = "";
          if (cleanId.startsWith("tt")) {
            var findRes = yield fetch(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
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
            var tRes = yield fetch(`https://api.themoviedb.org/3/tv/${numericId}?api_key=${TMDB_API_KEY}&language=tr-TR`);
            if (tRes.ok) {
              var tData = yield tRes.json();
              title = tData.name || title;
              origTitle = tData.original_name || origTitle;
            }
          }
          return { title, origTitle, numericId };
        } catch (e) {
          return { title: "", origTitle: "", numericId: id };
        }
      });
    }
    function searchShow(titleTr, titleEn) {
      return __async(this, null, function* () {
        var candidates = [titleTr, titleEn].map(normalizeTitle).filter(Boolean);
        if (!candidates.length) return null;
        var best = null;
        var bestScore = 0;
        for (var query of [titleTr, titleEn].filter(Boolean)) {
          try {
            var res = yield fetch(BASE_URL + "/ajax/arama.asp", {
              method: "POST",
              headers: Object.assign({}, WORKING_HEADERS, {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
              }),
              body: "q=" + encodeURIComponent(query)
            });
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
    function findEpisodeBid(slug, did, seasonNum, episodeNum) {
      return __async(this, null, function* () {
        var targetHref = `${seasonNum}-sezon-${episodeNum}-bolum.html`;
        var directUrl = `${BASE_URL}/${slug}/${targetHref}`;
        try {
          var res = yield fetch(directUrl, { headers: WORKING_HEADERS });
          if (res.ok) {
            var html = yield res.text();
            var $ = cheerio.load(html);
            var bid = $("#topBarBtn").attr("bid") || $("#dilsec").attr("data-id") || $("i[bid]").attr("bid");
            if (bid) {
              return { bid: String(bid).trim(), episodeUrl: directUrl };
            }
          }
        } catch (_) {
        }
        if (did) {
          try {
            var bRes = yield fetch(BASE_URL + "/ajax/dataIzleBolumler.asp", {
              method: "POST",
              headers: Object.assign({}, WORKING_HEADERS, {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": directUrl
              }),
              body: `did=${encodeURIComponent(did)}&sno=${encodeURIComponent(seasonNum)}`
            });
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
          } catch (_) {
          }
        }
        return null;
      });
    }
    function fetchAlternatifler(bid, dil, episodeUrl) {
      return __async(this, null, function* () {
        try {
          var res = yield fetch(BASE_URL + "/ajax/dataAlternatif22.asp", {
            method: "POST",
            headers: Object.assign({}, WORKING_HEADERS, {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Referer": episodeUrl
            }),
            body: `bid=${encodeURIComponent(bid)}&dil=${encodeURIComponent(dil)}`
          });
          if (!res.ok) return [];
          var data = yield res.json();
          return data.status === "success" && Array.isArray(data.data) ? data.data : [];
        } catch (_) {
          return [];
        }
      });
    }
    function fetchEmbedIframe(embedId, episodeUrl) {
      return __async(this, null, function* () {
        try {
          var res = yield fetch(BASE_URL + "/ajax/dataEmbed22.asp", {
            method: "POST",
            headers: Object.assign({}, WORKING_HEADERS, {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Referer": episodeUrl
            }),
            body: `id=${encodeURIComponent(embedId)}`
          });
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
        } catch (_) {
          return null;
        }
      });
    }
    function fetchVidMolyStream(iframeUrl) {
      return __async(this, null, function* () {
        var fullUrl = iframeUrl.startsWith("//") ? "https:" + iframeUrl : iframeUrl;
        fullUrl = fullUrl.replace("vidmoly.to", "vidmoly.biz").replace("vidmoly.net", "vidmoly.biz");
        try {
          var r = yield fetch(fullUrl, {
            headers: {
              "User-Agent": WORKING_HEADERS["User-Agent"],
              "Referer": BASE_URL + "/"
            }
          });
          if (!r.ok) return null;
          var html = yield r.text();
          var m = html.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
          return m ? { url: m[1], type: "hls", referer: "https://vidmoly.biz/" } : null;
        } catch (_) {
          return null;
        }
      });
    }
    function fetchSibnetStream(iframeUrl) {
      return __async(this, null, function* () {
        try {
          var r = yield fetch(iframeUrl, {
            headers: {
              "User-Agent": WORKING_HEADERS["User-Agent"],
              "Referer": "https://video.sibnet.ru/"
            }
          });
          if (!r.ok) return null;
          var html = yield r.text();
          var m = html.match(/src\s*:\s*["'](\/v\/[^"']+\.mp4)["']/i);
          if (m) {
            return { url: "https://video.sibnet.ru" + m[1], type: "mp4", referer: "https://video.sibnet.ru/" };
          }
          return null;
        } catch (_) {
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
    function fetchByseStream(iframeUrl) {
      return __async(this, null, function* () {
        try {
          var m = iframeUrl.match(/\/e\/([a-zA-Z0-9]+)/i);
          if (!m) return null;
          var code = m[1];
          var origin = new URL(iframeUrl).origin;
          var apiRes = yield fetch(`${origin}/api/videos/${code}`, {
            headers: {
              "User-Agent": WORKING_HEADERS["User-Agent"],
              "Referer": iframeUrl
            }
          });
          if (!apiRes.ok) return null;
          var data = yield apiRes.json();
          if (!data || !data.playback) return null;
          var decrypted = yield decryptBysePlayback(data.playback);
          if (!decrypted || !decrypted.sources || !decrypted.sources.length) return null;
          var primary = decrypted.sources.find(function(s) {
            return s.label === "1080p" || s.height >= 1080;
          }) || decrypted.sources.find(function(s) {
            return s.label === "720p" || s.height >= 720;
          }) || decrypted.sources[decrypted.sources.length - 1];
          return {
            url: primary.url,
            type: "hls",
            referer: origin + "/",
            quality: primary.label || (primary.height ? `${primary.height}p` : "1080p")
          };
        } catch (_) {
          return null;
        }
      });
    }
    function getStreams(tmdbId, mediaType, seasonNum, episodeNum) {
      return __async(this, null, function* () {
        try {
          if (mediaType !== "tv" && mediaType !== "series") return [];
          if (!Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 || !Number.isInteger(Number(episodeNum)) || Number(episodeNum) < 1) {
            return [];
          }
          seasonNum = Number(seasonNum);
          episodeNum = Number(episodeNum);
          var info = yield resolveTmdbInfo(tmdbId, mediaType);
          var titleTr = (info.title || "").trim();
          var titleEn = (info.origTitle || "").trim();
          var displayTitle = titleTr || titleEn || "Dizi";
          var show = yield searchShow(titleTr, titleEn);
          if (!show || !show.slug) return [];
          var epInfo = yield findEpisodeBid(show.slug, show.did, seasonNum, episodeNum);
          if (!epInfo || !epInfo.bid) return [];
          var dilConfigs = [
            { code: "1", label: "Altyaz\u0131l\u0131", flag: "\u{1F310} " },
            { code: "0", label: "Dublaj", flag: "\u{1F1F9}\u{1F1F7} " }
          ];
          var altsByDil = yield Promise.all(
            dilConfigs.map(function(dConf2) {
              return __async(this, null, function* () {
                var alts2 = yield fetchAlternatifler(epInfo.bid, dConf2.code, epInfo.episodeUrl);
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
                  var iframeSrc = yield fetchEmbedIframe(alt2.id, epInfo.episodeUrl);
                  if (!iframeSrc) return null;
                  var resolvedStream = null;
                  var pName = altTitle || "Kaynak";
                  if (iframeSrc.indexOf("vidmoly") !== -1) {
                    pName = "VidMoly";
                    resolvedStream = yield fetchVidMolyStream(iframeSrc);
                  } else if (iframeSrc.indexOf("sibnet") !== -1) {
                    pName = "Sibnet";
                    resolvedStream = yield fetchSibnetStream(iframeSrc);
                  } else if (iframeSrc.indexOf("bysejikuar") !== -1 || iframeSrc.indexOf("filemoon") !== -1) {
                    pName = "FileMoon";
                    resolvedStream = yield fetchByseStream(iframeSrc);
                  } else if (/\.(?:m3u8|mp4)(?:[?#]|$)/i.test(iframeSrc)) {
                    var isHls = /\.m3u8(?:[?#]|$)/i.test(iframeSrc);
                    resolvedStream = {
                      url: iframeSrc,
                      type: isHls ? "hls" : "mp4",
                      referer: BASE_URL + "/"
                    };
                  }
                  if (resolvedStream && resolvedStream.url && resolvedStream.type !== "embed") {
                    return {
                      stream: resolvedStream,
                      pName,
                      dConf: dConf2,
                      quality: resolvedStream.quality || quality
                    };
                  }
                  return null;
                } catch (_) {
                  return null;
                }
              });
            })
          );
          var allStreams = [];
          var seenUrls = /* @__PURE__ */ Object.create(null);
          for (var item of resolvedEntries) {
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
        } catch (_) {
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
    }
    if (typeof globalThis !== "undefined") {
      globalThis.getStreams = getStreams;
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
var provider = require_sezonlukdizi();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "sezonlukdizi", "id": "mum_sezonlukdizi", "name": "SezonlukDizi", "supportedTypes": ["tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
