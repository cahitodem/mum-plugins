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

// src/dizimom/index.js
var require_dizimom = __commonJS({
  "src/dizimom/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.series.dizimom.base");
          if (v && String(v).indexOf("dizidad.com") === -1) BASE_URL = String(v).replace(/\/+$/, "");
          if (HEADERS) HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var cheerio = require("cheerio-without-node-native");
    var BASE_URL = "https://ddizimom.net";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://ddizimom.net/"
    };
    function resolveTmdbInfo(id, mediaType) {
      return __async(this, null, function* () {
        try {
          let cleanId = String(id || "").trim().replace(/^(?:movie|tv|series|tmdb|imdb):+/i, "");
          if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
          let numericId = null;
          let title = "";
          let origTitle = "";
          if (cleanId.startsWith("tt")) {
            const findRes = yield fetch(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
            if (findRes.ok) {
              const fData = yield findRes.json();
              const item = mediaType === "tv" || mediaType === "series" ? fData.tv_results && fData.tv_results[0] : fData.movie_results && fData.movie_results[0];
              if (item) {
                numericId = item.id;
                title = item.name || item.title || "";
                origTitle = item.original_name || item.original_title || "";
              }
            }
          } else {
            numericId = cleanId;
          }
          if (numericId && (!title || !origTitle)) {
            const type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
            const tRes = yield fetch(`https://api.themoviedb.org/3/${type}/${numericId}?api_key=${TMDB_API_KEY}&language=tr-TR`);
            if (tRes.ok) {
              const tData = yield tRes.json();
              title = tData.name || tData.title || title;
              origTitle = tData.original_name || tData.original_title || origTitle;
            }
          }
          return { title, origTitle, numericId };
        } catch (e) {
          return { title: "", origTitle: "", numericId: id };
        }
      });
    }
    function normalizeTitle(str) {
      if (!str) return "";
      return str.toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    }
    function resolvePilavyerStream(epUrl, titlePrefix) {
      return __async(this, null, function* () {
        try {
          var epRes = yield fetch(epUrl, { headers: HEADERS });
          if (!epRes.ok) return [];
          var epHtml = yield epRes.text();
          var pvMatch = epHtml.match(/data-pv=["']([^"']+)["']/i);
          if (!pvMatch) return [];
          var pv = pvMatch[1];
          var sPhpUrl = "https://pilavyerplay.top/assets/js/s.php?s=" + encodeURIComponent(pv);
          var pRes = yield fetch(sPhpUrl, {
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": "https://ddizimom.net/"
            }
          });
          if (!pRes.ok) return [];
          var pHtml = yield pRes.text();
          var playerMatch = pHtml.match(/window\.__PLAYER__\s*=\s*(\{[\s\S]*?\});/);
          if (!playerMatch) return [];
          var pData = JSON.parse(playerMatch[1]);
          if (!pData || !pData.stream) return [];
          var subs = [];
          if (Array.isArray(pData.subs)) {
            subs = pData.subs.map(function(s) {
              return {
                id: s.lang || "tr",
                lang: s.lang === "tr" ? "tur" : s.lang === "en" ? "eng" : s.lang || "tur",
                language: s.lang || "tr",
                label: s.label || (s.lang === "tr" ? "T\xFCrk\xE7e" : "\u0130ngilizce"),
                url: s.src,
                format: "vtt",
                type: "text/vtt",
                headers: {
                  "User-Agent": HEADERS["User-Agent"],
                  "Referer": "https://pilavyerplay.top/"
                }
              };
            });
          }
          var streamTitle = titlePrefix ? "\u231C DiziMom \u231F | " + titlePrefix + " (1080p HLS)" : "\u231C DiziMom \u231F | Pilavyer \u2022 [TR Altyaz\u0131l\u0131] (1080p HLS)";
          return [{
            name: "DiziMom",
            title: streamTitle,
            url: pData.stream,
            quality: "1080p",
            format: "hls",
            isHls: true,
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": "https://pilavyerplay.top/"
            },
            behaviorHints: {
              notWebReady: true,
              proxyHeaders: {
                request: {
                  "User-Agent": HEADERS["User-Agent"],
                  "Referer": "https://pilavyerplay.top/"
                }
              }
            },
            provider: "dizimom",
            subtitles: subs
          }];
        } catch (e) {
          return [];
        }
      });
    }
    function getStreams(tmdbId, mediaType, seasonNum, episodeNum) {
      return __async(this, null, function* () {
        try {
          if (typeof tmdbId === "object" && tmdbId !== null) {
            mediaType = tmdbId.type || mediaType;
            seasonNum = tmdbId.season || seasonNum;
            episodeNum = tmdbId.episode || episodeNum;
            tmdbId = tmdbId.id;
          }
          if (typeof tmdbId === "string" && tmdbId.indexOf(":") !== -1 && !tmdbId.startsWith("dizimom:")) {
            var parts = tmdbId.split(":");
            if (parts.length >= 3) {
              var s = parseInt(parts[parts.length - 2]);
              var e = parseInt(parts[parts.length - 1]);
              if (!isNaN(s)) seasonNum = s;
              if (!isNaN(e)) episodeNum = e;
              tmdbId = parts[0];
            }
          }
          if (!mediaType) {
            mediaType = seasonNum !== void 0 && episodeNum !== void 0 ? "tv" : "movie";
          }
          if (typeof tmdbId === "string" && tmdbId.startsWith("dizimom:ep:")) {
            var epSlug = tmdbId.replace("dizimom:ep:", "").replace(/^\//, "");
            var targetEpUrl = epSlug.startsWith("http") ? epSlug : `${BASE_URL}/` + (epSlug.startsWith("dizi/") || epSlug.startsWith("film/") ? "" : "dizi/") + epSlug;
            return yield resolvePilavyerStream(targetEpUrl);
          }
          if (typeof tmdbId === "string" && tmdbId.startsWith("dizimom:show:")) {
            var showSlug = tmdbId.replace("dizimom:show:", "").replace(/^\//, "");
            var sNum = parseInt(seasonNum) || 1;
            var eNum = parseInt(episodeNum) || 1;
            var directEpUrl = `${BASE_URL}/dizi/${showSlug}/sezon-${sNum}/bolum-${eNum}`;
            var directRes = yield resolvePilavyerStream(directEpUrl);
            if (directRes && directRes.length > 0) return directRes;
          }
          var info = yield resolveTmdbInfo(tmdbId, mediaType);
          var queries = [info.title, info.origTitle].filter(Boolean);
          if (queries.length === 0) return [];
          var season = parseInt(seasonNum) || 1;
          var episode = parseInt(episodeNum) || 1;
          var isMovie = mediaType === "movie";
          for (var q of queries) {
            var searchUrl = `${BASE_URL}/ara?q=${encodeURIComponent(q)}`;
            var sRes = yield fetch(searchUrl, { headers: HEADERS });
            if (!sRes.ok) continue;
            var sHtml = yield sRes.text();
            var $ = cheerio.load(sHtml);
            var normQ = normalizeTitle(q);
            var matchedItems = [];
            $("a").each((i, el) => {
              var href = $(el).attr("href") || "";
              var isDiziLink = href.includes("/dizi/") && !href.includes("/sezon-");
              var isFilmLink = href.includes("/film/");
              if (!isMovie && isDiziLink || isMovie && isFilmLink) {
                var rawText = $(el).text().trim().replace(/\s+/g, " ");
                var normText = normalizeTitle(rawText);
                if (normText.includes(normQ) || normQ.includes(normText)) {
                  matchedItems.push({ href, title: rawText });
                }
              }
            });
            for (var item of matchedItems.slice(0, 3)) {
              var targetPageUrl = "";
              if (isMovie) {
                targetPageUrl = item.href.startsWith("http") ? item.href : `${BASE_URL}${item.href.startsWith("/") ? "" : "/"}${item.href}`;
              } else {
                var slug = item.href.split("/dizi/")[1].replace(/\/$/, "");
                targetPageUrl = `${BASE_URL}/dizi/${slug}/sezon-${season}/bolum-${episode}`;
              }
              var label = item.title.replace(/^Dizi\s+HD\s+(\d+\.\d+\s+)?/i, "").replace(/^Film\s+HD\s+(\d+\.\d+\s+)?/i, "").trim();
              var streams = yield resolvePilavyerStream(targetPageUrl, label);
              if (streams && streams.length > 0) {
                return streams;
              }
            }
          }
          return [];
        } catch (err) {
          return [];
        }
      });
    }
    function getCatalog(args) {
      return __async(this, null, function* () {
        try {
          const query = args && args.search || args && args.extra && args.extra.search || args && args.query || "";
          const metas = [];
          const seen = /* @__PURE__ */ new Set();
          if (query) {
            const searchUrl = `${BASE_URL}/ara?q=${encodeURIComponent(query)}`;
            const sRes = yield fetch(searchUrl, { headers: HEADERS });
            if (!sRes.ok) return { metas: [] };
            const sHtml = yield sRes.text();
            const $2 = cheerio.load(sHtml);
            $2("a").each((i, el) => {
              const href = $2(el).attr("href") || "";
              if (href.includes("/dizi/") && !href.includes("/sezon-")) {
                const slug = href.split("/dizi/")[1].replace(/\/$/, "");
                if (!slug || seen.has(slug)) return;
                seen.add(slug);
                const rawTitle = $2(el).text().trim().replace(/\s+/g, " ");
                const title = rawTitle.replace(/^Dizi\s+HD\s+(\d+\.\d+\s+)?/i, "").replace(/\s+\d{4}$/, "").trim() || slug;
                const img = $2(el).find("img").attr("src") || $2(el).find("img").attr("data-src") || "";
                const poster = img.startsWith("http") ? img : "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png";
                metas.push({
                  id: `dizimom:show:${slug}`,
                  type: "tv",
                  name: title,
                  poster,
                  background: poster,
                  genres: ["Yabanc\u0131 Dizi", "DiziMom"],
                  description: `${title} - DiziMom Ar\u015Fivi`
                });
              }
            });
            return { metas };
          }
          const res = yield fetch(`${BASE_URL}/diziler`, { headers: HEADERS });
          if (!res.ok) return { metas: [] };
          const html = yield res.text();
          const $ = cheerio.load(html);
          $("a").each((i, el) => {
            const href = $(el).attr("href") || "";
            if (href.includes("/dizi/") && !href.includes("/sezon-")) {
              const slug = href.split("/dizi/")[1].replace(/\/$/, "");
              if (!slug || seen.has(slug)) return;
              seen.add(slug);
              const rawTitle = $(el).text().trim().replace(/\s+/g, " ");
              const title = rawTitle.replace(/^Dizi\s+HD\s+(\d+\.\d+\s+)?/i, "").replace(/\s+\d{4}$/, "").trim() || slug;
              const img = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
              const poster = img.startsWith("http") ? img : "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png";
              metas.push({
                id: `dizimom:show:${slug}`,
                type: "tv",
                name: title,
                poster,
                background: poster,
                genres: ["Yabanc\u0131 Dizi", "DiziMom"],
                description: `${title} - DiziMom Ar\u015Fivi`
              });
            }
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
          const rawId = typeof args === "string" ? args : args && args.id ? args.id : "";
          if (!rawId) return { meta: null };
          if (rawId.startsWith("dizimom:show:")) {
            const showSlug = rawId.replace("dizimom:show:", "");
            const showUrl = `${BASE_URL}/dizi/${showSlug}`;
            const res = yield fetch(showUrl, { headers: HEADERS });
            if (!res.ok) return { meta: null };
            const html = yield res.text();
            const $ = cheerio.load(html);
            const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
            const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : showSlug;
            const title = rawTitle.replace(/\s*izle\s*$/i, "").replace(/^Dizi\s+HD\s+(\d+\.\d+\s+)?/i, "").trim();
            const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
            const poster = ogImg ? ogImg[1] : "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png";
            const desc = $('meta[name="description"]').attr("content") || `${title} - DiziMom Ar\u015Fivi`;
            const videos = [];
            const seen = /* @__PURE__ */ new Set();
            $("a").each((i, el) => {
              const href = $(el).attr("href") || "";
              const m = href.match(/\/sezon-(\d+)\/bolum-(\d+)/);
              if (m) {
                const sNum = parseInt(m[1]);
                const eNum = parseInt(m[2]);
                const epKey = `${sNum}:${eNum}`;
                if (seen.has(epKey)) return;
                seen.add(epKey);
                const epText = $(el).text().trim().replace(/\s+/g, " ") || `${sNum}. Sezon ${eNum}. B\xF6l\xFCm`;
                videos.push({
                  id: `dizimom:ep:${showSlug}/sezon-${sNum}/bolum-${eNum}`,
                  title: epText,
                  season: sNum,
                  episode: eNum
                });
              }
            });
            videos.sort((a, b) => a.season - b.season || a.episode - b.episode);
            return {
              meta: {
                id: rawId,
                type: "tv",
                name: title,
                poster,
                background: poster,
                description: desc,
                genres: ["Yabanc\u0131 Dizi", "DiziMom"],
                videos
              }
            };
          }
          if (rawId.startsWith("dizimom:ep:")) {
            const epSlug = rawId.replace("dizimom:ep:", "").replace(/^\//, "");
            const epUrl = `${BASE_URL}/dizi/${epSlug}`;
            const res = yield fetch(epUrl, { headers: HEADERS });
            if (!res.ok) return { meta: null };
            const html = yield res.text();
            const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "DiziMom B\xF6l\xFCm";
            const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
            const poster = ogImg ? ogImg[1] : "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png";
            const sMatch = epSlug.match(/sezon-(\d+)/i);
            const eMatch = epSlug.match(/bolum-(\d+)/i);
            const sNum = sMatch ? parseInt(sMatch[1]) : 1;
            const eNum = eMatch ? parseInt(eMatch[1]) : 1;
            return {
              meta: {
                id: rawId,
                type: "tv",
                name: title,
                poster,
                background: poster,
                description: `${title} - DiziMom`,
                genres: ["Yabanc\u0131 Dizi", "DiziMom"],
                videos: [{
                  id: rawId,
                  title,
                  season: sNum,
                  episode: eNum
                }]
              }
            };
          }
          return { meta: null };
        } catch (e) {
          return { meta: null };
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
    if (typeof module2 !== "undefined") {
      module2.exports = wrapAll({ getStreams, getCatalog, getMeta }, cfgReady);
    }
    if (typeof globalThis !== "undefined") {
      globalThis.getStreams = getStreams;
      globalThis.getCatalog = getCatalog;
      globalThis.getMeta = getMeta;
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
var provider = require_dizimom();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "dizimom", "id": "mum_dizimom", "name": "DiziMom", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "unverified", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
