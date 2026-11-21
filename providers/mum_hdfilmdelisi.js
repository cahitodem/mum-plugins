/* MUM Plugins 0.1.1; modified 2026-11-21; derived from Anthology 1.8.39. GPL-3.0-only. */
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
            base: "https://www.diziyou.love",
            storage: "https://storage.diziyou.love"
          },
          sezonlukdizi: {
            base: "https://sezonlukdizi.cc"
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

// src/hdfilmdelisi/index.js
var require_hdfilmdelisi = __commonJS({
  "src/hdfilmdelisi/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
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
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
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
    function ultraClean(str) {
      if (!str) return "";
      return str.toString().toLowerCase().replace(/[ıİ]/g, "i").replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g").replace(/[çÇ]/g, "c").replace(/[^a-z0-9]/g, "").trim();
    }
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
    function resolveTmdbInfo(id, mediaType) {
      return __async(this, null, function* () {
        try {
          var cleanId = String(id || "").trim().replace(/^(?:movie|tv|series|tmdb|imdb):+/i, "");
          if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
          var title = "";
          var origTitle = "";
          var imdbId = "";
          if (cleanId.startsWith("tt")) {
            imdbId = cleanId;
            var findRes = yield fetchWithTimeout("https://api.themoviedb.org/3/find/" + cleanId + "?api_key=" + TMDB_API_KEY + "&external_source=imdb_id", {}, 1e4);
            if (findRes.ok) {
              var fd = yield findRes.json();
              var match = mediaType === "tv" || mediaType === "series" ? fd.tv_results && fd.tv_results[0] : fd.movie_results && fd.movie_results[0];
              if (!match) match = fd.movie_results && fd.movie_results[0] || fd.tv_results && fd.tv_results[0];
              if (match) {
                title = match.name || match.title || "";
                origTitle = match.original_name || match.original_title || "";
              }
            }
          } else {
            var type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
            var tRes = yield fetchWithTimeout("https://api.themoviedb.org/3/" + type + "/" + cleanId + "?api_key=" + TMDB_API_KEY + "&language=tr-TR", {}, 1e4);
            if (tRes.ok) {
              var td = yield tRes.json();
              title = td.name || td.title || "";
              origTitle = td.original_name || td.original_title || "";
              if (td.imdb_id) imdbId = td.imdb_id;
            }
            if (!imdbId && (mediaType === "tv" || mediaType === "series")) {
              var extRes = yield fetchWithTimeout("https://api.themoviedb.org/3/tv/" + cleanId + "/external_ids?api_key=" + TMDB_API_KEY, {}, 6e3);
              if (extRes.ok) {
                var extData = yield extRes.json();
                if (extData && extData.imdb_id) imdbId = extData.imdb_id;
              }
            }
          }
          return { title, origTitle, imdbId };
        } catch (e) {
          return { title: "", origTitle: "", imdbId: "" };
        }
      });
    }
    function apiSearch(query) {
      return __async(this, null, function* () {
        try {
          var res = yield fetchWithTimeout(BASE_URL + "/api/search?q=" + encodeURIComponent(query), {
            headers: { "User-Agent": HEADERS["User-Agent"], "Referer": BASE_URL + "/" }
          }, 15e3);
          if (!res.ok) return [];
          var data = yield res.json();
          return data && (data.results || data.films) || [];
        } catch (e) {
          return [];
        }
      });
    }
    function pickBest(results, title) {
      if (!results || results.length === 0) return null;
      var cleanTarget = ultraClean(title);
      var nameOf = function(r) {
        return r.baslik || r.orijinalBaslik || r.title || "";
      };
      for (var i = 0; i < results.length; i++) {
        if (ultraClean(nameOf(results[i])) === cleanTarget) return results[i];
      }
      for (var j = 0; j < results.length; j++) {
        var c = ultraClean(nameOf(results[j]));
        if (c.includes(cleanTarget) || cleanTarget.includes(c)) return results[j];
      }
      return results[0];
    }
    function vidmodyDecrypt(hex, key) {
      try {
        var sb = "";
        for (var i = 0; i < hex.length; i += 2) {
          sb += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        var rev = sb.split("").reverse().join("");
        var decoded;
        if (typeof Buffer !== "undefined") {
          decoded = Buffer.from(rev, "base64");
        } else if (typeof atob === "function") {
          var bin = atob(rev);
          decoded = [];
          for (var k = 0; k < bin.length; k++) decoded.push(bin.charCodeAt(k));
        } else {
          return "";
        }
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
    function extractVidmodyFile(pageUrl) {
      return __async(this, null, function* () {
        try {
          var res = yield fetchWithTimeout(pageUrl, { headers: HEADERS }, 15e3);
          if (!res.ok) return null;
          var html = yield res.text();
          var vm = html.match(/https?:[\\/]+player\.vidmody\.com[\\/][a-zA-Z0-9=\\/]+/);
          if (!vm) return null;
          var playerUrl = vm[0].split("\\").join("/");
          var pRes = yield fetchWithTimeout(playerUrl, {
            headers: { "User-Agent": HEADERS["User-Agent"], "Referer": pageUrl }
          }, 15e3);
          if (!pRes.ok) return null;
          var pHtml = yield pRes.text();
          var dMatch = pHtml.match(/(?:decrypt|\))\s*\(\s*["']([0-9a-fA-F]+)["']\s*,\s*(\d+)\s*\)/);
          if (!dMatch) return null;
          var block = vidmodyDecrypt(dMatch[1], parseInt(dMatch[2]));
          var fMatch = block.match(/file:\s*['"](https?:\/\/[^'"]+)['"]/);
          if (!fMatch) return null;
          var subs = [];
          var subRe = /https?:\/\/[^\s"'\\]+\.vtt/gi;
          var sm;
          var seen = /* @__PURE__ */ new Set();
          while ((sm = subRe.exec(pHtml + " " + block)) !== null) {
            if (seen.has(sm[0]) || /thumb/i.test(sm[0])) continue;
            seen.add(sm[0]);
            var lang = /tur/i.test(sm[0]) ? "tur" : "eng";
            subs.push({ id: lang, lang, url: sm[0] });
          }
          return { file: fMatch[1], playerUrl, subtitles: subs };
        } catch (e) {
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
        name: "HDFilmDelisi",
        title: "\u231C HDFilmDelisi \u231F | Vixolity \u2022 " + tag + " (1080p HLS)",
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
      return {
        name: "HDFilmDelisi",
        title: "\u231C HDFilmDelisi \u231F | 1080p HLS",
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
    function getStreams(tmdbIdOrArgs, mediaType, seasonNum, episodeNum) {
      return __async(this, null, function* () {
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
          }
          var streams = [];
          var seenUrls = /* @__PURE__ */ new Set();
          if (typeof id === "string" && id.startsWith("hdfilmdelisi:movie:")) {
            var slug = id.split(":").slice(2).join(":");
            var apiRes = yield fetchWithTimeout(BASE_URL + "/api/films/" + slug, { headers: HEADERS }, 1e4);
            if (apiRes.ok) {
              var fData = yield apiRes.json();
              if (fData && fData.imdbId && fData.imdbId.startsWith("tt")) {
                var directVix = "https://ha.vixolity.com/vs/" + fData.imdbId;
                var vr = yield fetchWithTimeout(directVix, { headers: VIXOLITY_HEADERS }, 8e3);
                if (vr.ok) {
                  var vt = yield vr.text();
                  var subs = parseVixolitySubtitles(vt);
                  streams.push(toVixolityStream(directVix, subs, false));
                  seenUrls.add(directVix);
                }
              }
            }
            var found = yield extractVidmodyFile(BASE_URL + "/film/" + slug);
            if (found && !seenUrls.has(found.file)) {
              streams.push(toStream(found.file, found.subtitles));
              seenUrls.add(found.file);
            }
            if (streams.length > 0) return streams;
          }
          var info = yield resolveTmdbInfo(id, isSeries ? "tv" : "movie");
          if (info && info.imdbId && info.imdbId.startsWith("tt")) {
            var vixUrl = isSeries ? "https://ha.vixolity.com/vs/" + info.imdbId + "/s" + s + "/e" + (e < 10 ? "0" + e : e) : "https://ha.vixolity.com/vs/" + info.imdbId;
            var vRes = yield fetchWithTimeout(vixUrl, { headers: VIXOLITY_HEADERS }, 8e3);
            if (vRes.ok) {
              var vTxt = yield vRes.text();
              if (vTxt.includes("#EXTM3U")) {
                var vSubs = parseVixolitySubtitles(vTxt);
                streams.push(toVixolityStream(vixUrl, vSubs, isSeries, s, e));
                seenUrls.add(vixUrl);
              }
            }
          }
          var searchTitles = [info.title, info.origTitle].filter(Boolean);
          for (var t = 0; t < searchTitles.length; t++) {
            var results = yield apiSearch(searchTitles[t]);
            if (!results || results.length === 0) continue;
            var best = pickBest(results, searchTitles[t]);
            if (!best || !best.slug) continue;
            if (best.imdbId && best.imdbId.startsWith("tt") && !seenUrls.has("https://ha.vixolity.com/vs/" + best.imdbId)) {
              var sUrl = "https://ha.vixolity.com/vs/" + best.imdbId;
              var sRes = yield fetchWithTimeout(sUrl, { headers: VIXOLITY_HEADERS }, 8e3);
              if (sRes.ok) {
                var sTxt = yield sRes.text();
                if (sTxt.includes("#EXTM3U")) {
                  var sSubs = parseVixolitySubtitles(sTxt);
                  streams.push(toVixolityStream(sUrl, sSubs, false));
                  seenUrls.add(sUrl);
                }
              }
            }
            var vf = yield extractVidmodyFile(BASE_URL + "/film/" + best.slug);
            if (vf && !seenUrls.has(vf.file)) {
              streams.push(toStream(vf.file, vf.subtitles));
              seenUrls.add(vf.file);
            }
            if (streams.length > 0) break;
          }
          return streams;
        } catch (e2) {
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
var provider = require_hdfilmdelisi();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "hdfilmdelisi", "id": "mum_hdfilmdelisi", "name": "HDFilmDelisi", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
