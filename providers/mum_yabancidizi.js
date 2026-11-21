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

// src/yabancidizi/index.js
var require_yabancidizi = __commonJS({
  "src/yabancidizi/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.series.yabancidizi.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          if (HEADERS) HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var BASE_URL = "https://yabancidizi.news";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    function safeFetch(url, options) {
      options = options || {};
      if (typeof process !== "undefined" && process.versions && process.versions.node) {
        try {
          var https = require("https");
          var http = require("http");
          var u = new URL(url);
          var mod = u.protocol === "http:" ? http : https;
          return new Promise(function(resolve, reject) {
            var req = mod.request({
              hostname: u.hostname,
              port: u.port || (u.protocol === "http:" ? 80 : 443),
              path: u.pathname + u.search,
              method: options.method || "GET",
              headers: options.headers || {}
            }, function(res) {
              var data = "";
              res.on("data", function(chunk) {
                data += chunk;
              });
              res.on("end", function() {
                resolve({
                  ok: res.statusCode >= 200 && res.statusCode < 300,
                  status: res.statusCode,
                  headers: res.headers,
                  text: function() {
                    return __async(this, null, function* () {
                      return data;
                    });
                  },
                  json: function() {
                    return __async(this, null, function* () {
                      return JSON.parse(data);
                    });
                  }
                });
              });
            });
            req.on("error", reject);
            if (options.body) req.write(options.body);
            req.end();
          });
        } catch (e) {
        }
      }
      return fetch(url, options);
    }
    function ultraClean(str) {
      if (!str) return "";
      return str.toString().toLowerCase().replace(/[ıİ]/g, "i").replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g").replace(/[çÇ]/g, "c").replace(/[^a-z0-9]/g, "").trim();
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
            var findRes = yield safeFetch("https://api.themoviedb.org/3/find/" + cleanId + "?api_key=" + TMDB_API_KEY + "&external_source=imdb_id");
            if (findRes.ok) {
              var fData = yield findRes.json();
              var item = mediaType === "tv" || mediaType === "series" ? fData.tv_results && fData.tv_results[0] : fData.movie_results && fData.movie_results[0];
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
            var type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
            var tRes = yield safeFetch("https://api.themoviedb.org/3/" + type + "/" + numericId + "?api_key=" + TMDB_API_KEY + "&language=tr-TR");
            if (tRes.ok) {
              var tData = yield tRes.json();
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
    function searchYabanciDizi(query) {
      return __async(this, null, function* () {
        try {
          var searchUrl = BASE_URL + "/search?qr=" + encodeURIComponent(query);
          var res = yield safeFetch(searchUrl, {
            method: "POST",
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "X-Requested-With": "XMLHttpRequest",
              "Accept": "application/json, text/javascript, */*; q=0.01",
              "Referer": BASE_URL + "/"
            }
          });
          if (!res.ok) return [];
          var data = yield res.json();
          if (data && data.data && Array.isArray(data.data.result)) {
            return data.data.result;
          }
          return [];
        } catch (e) {
          return [];
        }
      });
    }
    function getCatalog(args) {
      return __async(this, null, function* () {
        try {
          var query = args && args.search || args && args.extra && args.extra.search || args && args.query || "";
          if (query) {
            var results = yield searchYabanciDizi(query);
            var metas = results.map(function(r) {
              var poster = r.s_image ? r.s_image.startsWith("http") ? r.s_image : BASE_URL + "/uploads/series/" + r.s_image : "";
              return {
                id: "yabancidizi:show:" + r.s_link,
                type: r.s_type === "1" ? "movie" : "tv",
                name: r.s_name,
                poster,
                background: poster,
                genres: ["Yabanc\u0131 Dizi", "Yabanc\u0131Dizi"],
                description: (r.s_name || "") + " (" + (r.s_year || "") + ") - Yabanc\u0131Dizi"
              };
            });
            return { metas };
          }
          var res = yield safeFetch(BASE_URL + "/", { headers: HEADERS });
          if (!res.ok) return { metas: [] };
          var html = yield res.text();
          var cardRegex = /<a[^>]+href=["'](?:https?:\/\/[^"'/]+)?\/?dizi\/([^"'/]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
          var metas = [];
          var seen = /* @__PURE__ */ new Set();
          var m;
          while ((m = cardRegex.exec(html)) !== null) {
            var slug = m[1];
            if (!slug || slug.startsWith("tur/") || seen.has(slug)) continue;
            seen.add(slug);
            var title = m[2].replace(/<[^>]+>/g, "").trim();
            if (!title) continue;
            metas.push({
              id: "yabancidizi:show:" + slug,
              type: "tv",
              name: title,
              poster: "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              background: "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png",
              genres: ["Yabanc\u0131 Dizi", "Yabanc\u0131Dizi"],
              description: title + " - Yabanc\u0131Dizi Ar\u015Fivi"
            });
          }
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
          if (!rawId) return { meta: null };
          if (rawId.startsWith("yabancidizi:show:")) {
            var showSlug = rawId.replace("yabancidizi:show:", "");
            var showUrl = BASE_URL + "/dizi/" + showSlug;
            var res = yield safeFetch(showUrl, { headers: HEADERS });
            if (!res.ok) return { meta: null };
            var html = yield res.text();
            var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "Yabanc\u0131Dizi";
            var ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
            var poster = ogImg ? ogImg[1] : "https://raw.githubusercontent.com/falsisdev/anthology/main/assets/logo_1_transparent.png";
            var epMatches = [...html.matchAll(/(?:dizi\/[^"'\s]*\/)?sezon-(\d+)\/bolum-(\d+)/gi)];
            var videos = [];
            var seen = /* @__PURE__ */ new Set();
            for (var ep of epMatches) {
              var sNum = parseInt(ep[1]);
              var eNum = parseInt(ep[2]);
              var key = sNum + "x" + eNum;
              if (seen.has(key)) continue;
              seen.add(key);
              videos.push({
                id: "yabancidizi:ep:" + showSlug + ":" + sNum + ":" + eNum,
                title: sNum + ". Sezon " + eNum + ". B\xF6l\xFCm",
                season: sNum,
                episode: eNum
              });
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
                description: title + " - Yabanc\u0131Dizi",
                genres: ["Yabanc\u0131 Dizi", "Yabanc\u0131Dizi"],
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
    function extractStreamsFromEpisodePage(epUrl) {
      return __async(this, null, function* () {
        try {
          var epRes = yield safeFetch(epUrl, {
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": BASE_URL + "/"
            }
          });
          if (!epRes.ok) return [];
          var html = yield epRes.text();
          var dlRegex = /<a[^>]+href=["'](https?:\/\/vidmoly\.[a-z0-9]+\/dl\/([a-zA-Z0-9_-]+))["'][^>]*>([\s\S]*?)<\/a>/gi;
          var vmRegex = /vidmoly\.[a-z0-9]+\/(?:dl\/|embed-)([a-zA-Z0-9_-]+)/gi;
          var streams = [];
          var seenUrls = /* @__PURE__ */ new Set();
          var seenIds = /* @__PURE__ */ new Set();
          var m;
          while ((m = dlRegex.exec(html)) !== null) {
            var vidId = m[2];
            var label = m[3].replace(/<[^>]+>/g, "").trim();
            if (seenIds.has(vidId)) continue;
            seenIds.add(vidId);
            var langText = "T\xFCrk\xE7e Altyaz\u0131l\u0131";
            if (/dublaj/i.test(label)) langText = "T\xFCrk\xE7e Dublaj";
            else if (/ingilizce/i.test(label)) langText = "\u0130ngilizce Altyaz\u0131l\u0131";
            var embedUrl = "https://vidmoly.biz/embed-" + vidId + ".html";
            try {
              var vmRes = yield safeFetch(embedUrl, {
                headers: {
                  "User-Agent": HEADERS["User-Agent"],
                  "Referer": BASE_URL + "/"
                }
              });
              if (vmRes.ok) {
                var vmHtml = yield vmRes.text();
                var m3u8Match = vmHtml.match(/file\s*:\s*['"](https?:\/\/[^'"<>]+\.m3u8[^'"<>]*)['"]/i);
                if (m3u8Match && !seenUrls.has(m3u8Match[1])) {
                  seenUrls.add(m3u8Match[1]);
                  var vmHeaders = {
                    "User-Agent": HEADERS["User-Agent"],
                    "Referer": "https://vidmoly.biz/"
                  };
                  streams.push({
                    name: "Yabanc\u0131Dizi",
                    title: "\u231C Yabanc\u0131Dizi \u231F | VidMoly (" + langText + " 1080p HLS)",
                    url: m3u8Match[1],
                    quality: "1080p",
                    format: "hls",
                    isHls: true,
                    provider: "yabancidizi",
                    headers: vmHeaders,
                    behaviorHints: {
                      notWebReady: true,
                      proxyHeaders: {
                        request: vmHeaders
                      }
                    }
                  });
                }
              }
            } catch (err) {
            }
          }
          while ((m = vmRegex.exec(html)) !== null) {
            var vidId2 = m[1];
            if (seenIds.has(vidId2)) continue;
            seenIds.add(vidId2);
            var embedUrl2 = "https://vidmoly.biz/embed-" + vidId2 + ".html";
            try {
              var vmRes2 = yield safeFetch(embedUrl2, {
                headers: {
                  "User-Agent": HEADERS["User-Agent"],
                  "Referer": BASE_URL + "/"
                }
              });
              if (vmRes2.ok) {
                var vmHtml2 = yield vmRes2.text();
                var m3u8Match2 = vmHtml2.match(/file\s*:\s*['"](https?:\/\/[^'"<>]+\.m3u8[^'"<>]*)['"]/i);
                if (m3u8Match2 && !seenUrls.has(m3u8Match2[1])) {
                  seenUrls.add(m3u8Match2[1]);
                  var vmHeaders2 = {
                    "User-Agent": HEADERS["User-Agent"],
                    "Referer": "https://vidmoly.biz/"
                  };
                  streams.push({
                    name: "Yabanc\u0131Dizi",
                    title: "\u231C Yabanc\u0131Dizi \u231F | VidMoly (1080p HLS)",
                    url: m3u8Match2[1],
                    quality: "1080p",
                    format: "hls",
                    isHls: true,
                    headers: vmHeaders2,
                    behaviorHints: {
                      notWebReady: true,
                      proxyHeaders: { request: vmHeaders2 }
                    },
                    provider: "yabancidizi"
                  });
                }
              }
            } catch (e) {
            }
          }
          return streams;
        } catch (e) {
          return [];
        }
      });
    }
    function getStreams(tmdbIdOrArgs, mediaType, seasonNum, episodeNum) {
      return __async(this, null, function* () {
        try {
          if (typeof tmdbIdOrArgs === "object" && tmdbIdOrArgs && tmdbIdOrArgs.id) {
            return getStreams(tmdbIdOrArgs.id, mediaType || tmdbIdOrArgs.type, seasonNum || tmdbIdOrArgs.season, episodeNum || tmdbIdOrArgs.episode);
          }
          if (typeof tmdbIdOrArgs === "string" && tmdbIdOrArgs.startsWith("yabancidizi:ep:")) {
            var parts = tmdbIdOrArgs.replace("yabancidizi:ep:", "").split(":");
            var sSlug = parts[0];
            var s = parts[1] || "1";
            var e = parts[2] || "1";
            var epUrl = BASE_URL + "/dizi/" + sSlug + "/sezon-" + s + "/bolum-" + e;
            return yield extractStreamsFromEpisodePage(epUrl);
          }
          if (typeof tmdbIdOrArgs === "string" && tmdbIdOrArgs.startsWith("yabancidizi:show:")) {
            var showMeta = yield getMeta(tmdbIdOrArgs);
            if (showMeta && showMeta.meta && Array.isArray(showMeta.meta.videos) && showMeta.meta.videos.length > 0) {
              return yield getStreams(showMeta.meta.videos[0].id);
            }
          }
          var season = parseInt(seasonNum) || 1;
          var episode = parseInt(episodeNum) || 1;
          var info = yield resolveTmdbInfo(tmdbIdOrArgs, mediaType);
          var searchTitles = [info.origTitle, info.title].filter(Boolean);
          if (searchTitles.length === 0) return [];
          for (var title of searchTitles) {
            var results = yield searchYabanciDizi(title);
            if (results.length === 0) {
              var cat = yield getCatalog({ query: title });
              if (cat && cat.metas && cat.metas.length > 0) {
                results = cat.metas.map(function(m) {
                  return {
                    s_name: m.name,
                    s_link: m.id.replace("yabancidizi:show:", "")
                  };
                });
              }
            }
            if (results.length === 0) continue;
            var cleanTarget = ultraClean(title);
            var matchedShow = null;
            for (var r of results) {
              var rTitle = ultraClean(r.s_name);
              if (rTitle === cleanTarget) {
                matchedShow = r;
                break;
              }
            }
            if (!matchedShow) {
              for (var r of results) {
                var rTitle = ultraClean(r.s_name);
                if (rTitle.includes(cleanTarget) || cleanTarget.includes(rTitle)) {
                  matchedShow = r;
                  break;
                }
              }
            }
            if (!matchedShow && results.length > 0) {
              matchedShow = results[0];
            }
            if (!matchedShow || !matchedShow.s_link) continue;
            var targetEpUrl = BASE_URL + "/dizi/" + matchedShow.s_link + "/sezon-" + season + "/bolum-" + episode;
            var streams = yield extractStreamsFromEpisodePage(targetEpUrl);
            if (streams.length > 0) return streams;
          }
          return [];
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
          var abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
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
            var callOpts = abortCtrl ? { signal: abortCtrl.signal } : {};
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
                }, limit);
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
            if (timedOut || err && (err.name === "AbortError" || err.message === "TIMEOUT")) {
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
var provider = require_yabancidizi();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "yabancidizi", "id": "mum_yabancidizi", "name": "Yabanc\u0131Dizi", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "unverified", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
