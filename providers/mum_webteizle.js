/* MUM Plugins 0.1.0; modified 2026-11-21; derived from Anthology 1.8.39. GPL-3.0-only. */
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
      version: "0.1.0",
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
            base: "https://www.diziyou.one",
            storage: "https://storage.diziyou.one"
          }
        },
        movies: {
          filmmodu: {
            base: "https://www.filmmodu.one",
            live: "https://filmmodu.live",
            player: "https://play2.pilavyerplay.top"
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

// src/webteizle/index.js
var require_webteizle = __commonJS({
  "src/webteizle/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/137.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    function fetchTmdbInfo(tmdbId, mediaType) {
      return __async(this, null, function* () {
        var cleanId = String(tmdbId || "").trim();
        if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
        var isTV = mediaType === "tv" || mediaType === "series";
        var endpoint = isTV ? "tv" : "movie";
        var isImdb = cleanId.startsWith("tt");
        if (isImdb) {
          var fRes = yield fetch("https://api.themoviedb.org/3/find/" + cleanId + "?api_key=" + TMDB_API_KEY + "&external_source=imdb_id");
          if (fRes.ok) {
            var fData = yield fRes.json();
            var match = isTV ? fData.tv_results && fData.tv_results[0] : fData.movie_results && fData.movie_results[0];
            if (match) {
              return {
                titleTr: match.title || match.name || "",
                titleEn: match.original_title || match.original_name || "",
                year: (match.release_date || match.first_air_date || "").slice(0, 4)
              };
            }
          }
        }
        var res = yield fetch("https://api.themoviedb.org/3/" + endpoint + "/" + cleanId + "?api_key=" + TMDB_API_KEY + "&language=tr-TR");
        if (!res.ok) return { titleTr: "", titleEn: "", year: "" };
        var d = yield res.json();
        return {
          titleTr: d.title || d.name || "",
          titleEn: d.original_title || d.original_name || "",
          year: (d.release_date || d.first_air_date || "").slice(0, 4)
        };
      });
    }
    function titleToSlug(title) {
      return (title || "").toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/İ/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    function findFilmPage(titleTr, titleEn) {
      return __async(this, null, function* () {
        var slugTr = titleToSlug(titleTr);
        var slugEn = titleToSlug(titleEn);
        var candidates = [];
        if (slugTr) {
          candidates.push(BASE_URL + "/izle/dublaj/" + slugTr);
          candidates.push(BASE_URL + "/izle/altyazi/" + slugTr);
        }
        if (slugEn && slugEn !== slugTr) {
          candidates.push(BASE_URL + "/izle/dublaj/" + slugEn);
          candidates.push(BASE_URL + "/izle/altyazi/" + slugEn);
        }
        for (var url of candidates) {
          try {
            var r = yield fetch(url, { headers: HEADERS });
            if (r.ok) {
              var html = yield r.text();
              if (html.indexOf("data-id") !== -1 && html.indexOf('id="wip"') !== -1) {
                return { url, html };
              }
            }
          } catch (e) {
          }
        }
        return yield searchFallback(titleTr, titleEn);
      });
    }
    function searchFallback(titleTr, titleEn) {
      return __async(this, null, function* () {
        var queries = [titleTr, titleEn].filter(Boolean);
        for (var query of queries) {
          try {
            var r = yield fetch(BASE_URL + "/ajax/arama.asp", {
              method: "POST",
              headers: Object.assign({}, HEADERS, {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
              }),
              body: "q=" + encodeURIComponent(query)
            });
            if (!r.ok) continue;
            var data = yield r.json();
            if (data.status === "success" && data.results && data.results.filmler && Array.isArray(data.results.filmler.results)) {
              var items = data.results.filmler.results;
              if (items.length > 0) {
                var best = items[0];
                var pageUrl = best.url.startsWith("http") ? best.url : BASE_URL + best.url;
                var pRes = yield fetch(pageUrl, { headers: HEADERS });
                if (pRes.ok) {
                  var html = yield pRes.text();
                  return { url: pageUrl, html };
                }
              }
            }
          } catch (e) {
          }
        }
        return null;
      });
    }
    function parseFilmId(html) {
      var m = html.match(/data-id="(\d+)"[^>]*id="wip"/) || html.match(/id="wip"[^>]*data-id="(\d+)"/) || html.match(/button[^>]+id="wip"[^>]+data-id="(\d+)"/) || html.match(/data-id="(\d+)"/);
      return m ? m[1] : null;
    }
    function parseDilList(html, pageUrl) {
      var diller = [];
      if (html.indexOf("/izle/dublaj/") !== -1 || pageUrl.indexOf("/izle/dublaj/") !== -1) diller.push({ dil: "0", ad: "TR Dublaj" });
      if (html.indexOf("/izle/altyazi/") !== -1 || pageUrl.indexOf("/izle/altyazi/") !== -1) diller.push({ dil: "1", ad: "TR Altyaz\u0131" });
      if (diller.length === 0) {
        diller.push({ dil: "0", ad: "TR Dublaj" });
        diller.push({ dil: "1", ad: "TR Altyaz\u0131" });
      }
      return diller;
    }
    function fetchAlternatifler(filmId, dil, seasonNum, episodeNum) {
      return __async(this, null, function* () {
        var body = "filmid=" + filmId + "&dil=" + dil + "&s=" + (seasonNum || "") + "&b=" + (episodeNum || "") + "&bot=0";
        try {
          var r = yield fetch(BASE_URL + "/ajax/dataAlternatif3.asp", {
            method: "POST",
            headers: Object.assign({}, HEADERS, {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-Requested-With": "XMLHttpRequest",
              "Origin": BASE_URL
            }),
            body
          });
          if (!r.ok) return [];
          var data = yield r.json();
          return data.status === "success" && Array.isArray(data.data) ? data.data : [];
        } catch (e) {
          return [];
        }
      });
    }
    function fetchEmbedIframe(embedId) {
      return __async(this, null, function* () {
        try {
          var r = yield fetch(BASE_URL + "/ajax/dataEmbed.asp", {
            method: "POST",
            headers: Object.assign({}, HEADERS, {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-Requested-With": "XMLHttpRequest",
              "Origin": BASE_URL
            }),
            body: "id=" + embedId
          });
          if (!r.ok) return null;
          var html = yield r.text();
          var m = html.match(/<iframe[^>]+src="([^"]+)"/i);
          if (m) return m[1];
          var sm = html.match(/(vidmoly|okru|filemoon|dzen)\s*\(\s*'([^']+)'/i);
          if (sm) {
            var p = sm[1].toLowerCase();
            var vid = sm[2];
            if (p === "vidmoly") return "https://vidmoly.biz/embed-" + vid + ".html";
            if (p === "okru") return "https://odnoklassniki.ru/videoembed/" + vid;
            if (p === "filemoon") return "https://filemoon.sx/e/" + vid;
            if (p === "dzen") return "https://dzen.ru/video/watch/" + vid;
          }
          return null;
        } catch (e) {
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
              "User-Agent": HEADERS["User-Agent"],
              "Referer": BASE_URL + "/"
            }
          });
          if (!r.ok) return null;
          var html = yield r.text();
          var m = html.match(/file\s*:\s*['"](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)['"]/i);
          return m ? { url: m[1], type: "hls", referer: "https://vidmoly.biz/" } : null;
        } catch (e) {
          return null;
        }
      });
    }
    function processEmbed(embedData, dilAd, movieTitle) {
      return __async(this, null, function* () {
        var baslik = (embedData.baslik || "").toLowerCase();
        if (baslik === "pixel" || baslik === "netu") return null;
        var src = yield fetchEmbedIframe(embedData.id);
        if (!src) return null;
        var flag = dilAd.includes("Dublaj") ? "\u{1F1F9}\u{1F1F7} " : "\u{1F310} ";
        var pName = embedData.baslik || "Kaynak";
        if (src.indexOf("vidmoly") !== -1) pName = "VidMoly";
        else if (src.indexOf("sibnet") !== -1) pName = "Sibnet";
        else if (src.indexOf("filemoon") !== -1) pName = "FileMoon";
        var q = embedData.kalite || "1080p";
        if (src.indexOf("vidmoly") !== -1) {
          var s = yield fetchVidMolyStream(src);
          if (s) {
            var sHeaders = {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": s.referer
            };
            return {
              name: movieTitle,
              title: "\u231C Webte\u0130zle \u231F | " + pName + " | " + flag + dilAd,
              url: s.url,
              quality: q,
              headers: sHeaders,
              behaviorHints: {
                notWebReady: true,
                proxyHeaders: { request: sHeaders }
              },
              provider: "webteizle"
            };
          }
        }
        return null;
      });
    }
    function getStreams(tmdbId, mediaType, season, episode) {
      return __async(this, null, function* () {
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
          var info = yield fetchTmdbInfo(tmdbId, mediaType);
          var movieName = info.titleTr || info.titleEn;
          if (!movieName) return [];
          var pageResult = yield findFilmPage(info.titleTr, info.titleEn);
          if (!pageResult || !pageResult.html) return [];
          var filmId = parseFilmId(pageResult.html);
          if (!filmId) return [];
          var diller = parseDilList(pageResult.html, pageResult.url);
          var streams = [];
          for (var d of diller) {
            var embedList = yield fetchAlternatifler(filmId, d.dil, season, episode);
            for (var e of embedList) {
              var s = yield processEmbed(e, d.ad, movieName);
              if (s && !streams.some((x) => x.url === s.url)) {
                streams.push(s);
              }
            }
          }
          return streams;
        } catch (err) {
          console.error("[Webte\u0130zle] Hata:", err.message);
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
      var limit = options && options.timeoutMs || 45e3;
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
var provider = require_webteizle();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "webteizle", "id": "mum_webteizle", "name": "Webte\u0130zle", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
