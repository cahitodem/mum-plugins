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

// src/filmmodu/index.js
var require_filmmodu = __commonJS({
  "src/filmmodu/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.movies.filmmodu.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          v = val("urls.movies.filmmodu.live");
          if (v) LIVE_URL = String(v).replace(/\/+$/, "");
          v = val("urls.movies.filmmodu.player");
          if (v) PLAYER_HOST = String(v).replace(/\/+$/, "");
          if (HEADERS) HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var BASE_URL = "https://www.filmmodu.one";
    var LIVE_URL = "https://filmmodu.live";
    var PLAYER_HOST = "https://play2.pilavyerplay.top";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": BASE_URL + "/"
    };
    var cheerio = (function() {
      try {
        if (typeof require !== "undefined") return require("cheerio-without-node-native");
      } catch (e) {
      }
      try {
        if (typeof require !== "undefined") return require("cheerio");
      } catch (e2) {
      }
      return null;
    })();
    function timeoutSignal(ms) {
      if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        try {
          return AbortSignal.timeout(ms);
        } catch (e) {
        }
      }
      if (typeof AbortController !== "undefined") {
        var c = new AbortController();
        setTimeout(function() {
          try {
            c.abort();
          } catch (e) {
          }
        }, ms);
        return c.signal;
      }
      return null;
    }
    function fetchTmdbInfo(tmdbId, mediaType) {
      return __async(this, null, function* () {
        let cleanId = String(tmdbId || "").trim();
        if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
        const isTv = mediaType === "tv" || mediaType === "series";
        let numericId = cleanId;
        if (cleanId.startsWith("tt")) {
          try {
            const fRes = yield fetch(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
            if (fRes.ok) {
              const fData = yield fRes.json();
              const matches = isTv ? fData.tv_results : fData.movie_results;
              if (matches && matches.length > 0) numericId = matches[0].id;
            }
          } catch (e) {
          }
        }
        var url = "https://api.themoviedb.org/3/" + (isTv ? "tv/" : "movie/") + numericId + "?api_key=" + TMDB_API_KEY + "&language=tr-TR";
        const r = yield fetch(url);
        if (!r.ok) throw new Error("TMDB yan\u0131t vermedi: " + r.status);
        const data = yield r.json();
        return {
          titleTr: isTv ? data.name || "" : data.title || "",
          titleEn: isTv ? data.original_name || "" : data.original_title || "",
          year: (isTv ? data.first_air_date : data.release_date) ? (isTv ? data.first_air_date : data.release_date).slice(0, 4) : ""
        };
      });
    }
    function cleanTitle(str) {
      if (!str) return "";
      return str.replace(/[:"'\-_/\\,.]/g, " ").replace(/\s+/g, " ").trim();
    }
    function normalizeForUrl(str) {
      if (!str) return "";
      return str.toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â|á|à/g, "a").replace(/î|í/g, "i").replace(/û|ú/g, "u").replace(/[^a-z0-9]/g, "");
    }
    function slugFromHref(href) {
      try {
        var last = href.split("/").filter(Boolean).pop() || "";
        return last.replace(/-film-izle.*$/i, "").replace(/-izle.*$/i, "").trim();
      } catch (e) {
        return href;
      }
    }
    function findBestMatch(results, searchTitle, year) {
      var normalizedSearch = normalizeForUrl(searchTitle);
      var slugSearch = normalizeForUrl(slugFromHref(searchTitle));
      for (var s = 0; s < results.length; s++) {
        var slugNorm = normalizeForUrl(slugFromHref(results[s].href));
        if (slugNorm === normalizedSearch || slugNorm === slugSearch) {
          console.log("[FilmModu] Slug tam e\u015Fle\u015Fti: " + results[s].href);
          return results[s].href;
        }
      }
      if (year) {
        for (var i = 0; i < results.length; i++) {
          var normalizedHref = normalizeForUrl(results[i].href);
          if (normalizedHref.indexOf(normalizedSearch) !== -1 && results[i].href.indexOf(year) !== -1) {
            console.log("[FilmModu] Ba\u015Fl\u0131k+y\u0131l e\u015Fle\u015Fti: " + results[i].href);
            return results[i].href;
          }
        }
      }
      var best = null;
      var bestLen = Infinity;
      for (var j = 0; j < results.length; j++) {
        var normalizedHref2 = normalizeForUrl(results[j].href);
        if (normalizedHref2.indexOf(normalizedSearch) !== -1) {
          var len = normalizedHref2.length;
          if (len < bestLen) {
            best = results[j].href;
            bestLen = len;
          }
        }
      }
      if (best) {
        console.log("[FilmModu] Ba\u015Fl\u0131k e\u015Fle\u015Fti (en k\u0131sa): " + best);
        return best;
      }
      if (year) {
        for (var k = 0; k < results.length; k++) {
          if (results[k].href.indexOf(year) !== -1) {
            console.log("[FilmModu] Y\u0131l e\u015Fle\u015Fti: " + results[k].href);
            return results[k].href;
          }
        }
      }
      console.log("[FilmModu] G\xFCvenilir e\u015Fle\u015Fme bulunamad\u0131, atlan\u0131yor");
      return null;
    }
    function searchFilmModu(rawTitle, year) {
      var title = cleanTitle(rawTitle);
      if (!title) return Promise.resolve(null);
      var searchUrl = BASE_URL + "/film-ara?term=" + encodeURIComponent(title);
      console.log("[FilmModu] Aran\u0131yor: " + searchUrl);
      return fetch(searchUrl, { headers: HEADERS, redirect: "manual" }).then(function(r) {
        if (r.status === 301 || r.status === 302) {
          var loc = r.headers.get("location");
          if (loc && loc.indexOf("/film-ara") === -1) {
            return fetch(loc, { headers: HEADERS }).then(function(locRes) {
              if (locRes.ok) return { redirectUrl: loc, html: null };
              return { redirectUrl: null, html: null };
            }).catch(function() {
              return { redirectUrl: null, html: null };
            });
          }
        }
        if (!r.ok && r.status !== 301 && r.status !== 302) {
          return { redirectUrl: null, html: null };
        }
        return r.text().then(function(html) {
          return { redirectUrl: null, html };
        });
      }).then(function(result) {
        if (!result) return null;
        if (result.redirectUrl) return result.redirectUrl;
        if (!result.html) return null;
        var $ = cheerio.load(result.html);
        if ($("div.alternates").length > 0) {
          var canonical = $('link[rel="canonical"]').attr("href") || "";
          if (canonical) {
            console.log("[FilmModu] Sayfa film sayfas\u0131, canonical: " + canonical);
            return canonical;
          }
          return searchUrl;
        }
        var results = [];
        $("div.movie").each(function() {
          var a = $(this).find("a").first();
          var href = a.attr("href") || "";
          var text = a.text().trim();
          if (href) results.push({ href, text });
        });
        console.log("[FilmModu] Bulunan sonu\xE7 say\u0131s\u0131: " + results.length);
        if (results.length === 0) return null;
        return findBestMatch(results, title, year);
      }).catch(function(err) {
        console.log("[FilmModu] Arama hatas\u0131: " + err.message);
        return null;
      });
    }
    function fetchAlternateLinks(filmUrl) {
      console.log("[FilmModu] Film sayfas\u0131: " + filmUrl);
      return fetch(filmUrl, { headers: HEADERS }).then(function(r) {
        if (!r.ok) throw new Error("Film sayfas\u0131 y\xFCklenemedi: " + r.status);
        return r.text();
      }).then(function(html) {
        var $ = cheerio.load(html);
        var links = [];
        $("div.alternates a").each(function() {
          var href = $(this).attr("href") || "";
          var name = $(this).text().trim();
          if (name && !name.toLowerCase().includes("fragman") && href) {
            if (!links.some(function(l) {
              return l.href === href;
            })) {
              links.push({ href, name });
            }
          }
        });
        if (links.length === 0) {
          links.push({ href: filmUrl, name: "Ana Kaynak" });
        }
        console.log("[FilmModu] Kaynak linki say\u0131s\u0131: " + links.length);
        return links;
      });
    }
    function verifySegmentPlayable(m3u8Url, headers) {
      var sig = timeoutSignal(3500);
      var opts = { headers };
      if (sig) opts.signal = sig;
      return fetch(m3u8Url, opts).then(function(res) {
        if (!res.ok) return false;
        return res.text().then(function(text) {
          var lines = text.split("\n");
          var firstSeg = null;
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line && line.indexOf("#") !== 0 && line.indexOf("http") === 0) {
              firstSeg = line;
              break;
            }
          }
          if (!firstSeg) return false;
          var segSig = timeoutSignal(3500);
          var segHdrs = Object.assign({}, headers, { "Range": "bytes=0-1024" });
          var segOpts = { method: "GET", headers: segHdrs };
          if (segSig) segOpts.signal = segSig;
          return fetch(firstSeg, segOpts).then(function(segRes) {
            var ok = segRes.ok || segRes.status === 206;
            if (!ok) {
              console.log("[FilmModu] Segment oynat\u0131lamaz (HTTP " + segRes.status + "): " + firstSeg.slice(0, 60));
            }
            return ok;
          }).catch(function() {
            return false;
          });
        });
      }).catch(function() {
        return false;
      });
    }
    function fetchStreamsFromAlt(altLink, filmUrl) {
      var altHeaders = Object.assign({}, HEADERS, { "Referer": filmUrl });
      return fetch(altLink.href, { headers: altHeaders }).then(function(r) {
        if (!r.ok) return [];
        return r.text();
      }).then(function(altHtml) {
        var videoIdMatch = altHtml.match(/var videoId\s*=\s*'([^']+)'/);
        var videoTypeMatch = altHtml.match(/var videoType\s*=\s*'([^']*)'/);
        if (!videoIdMatch) {
          console.log("[FilmModu] videoId bulunamad\u0131: " + altLink.href);
          return [];
        }
        var videoId = videoIdMatch[1];
        var videoType = videoTypeMatch && videoTypeMatch[1] || "";
        var sourceUrl = BASE_URL + "/get-source?movie_id=" + videoId + "&type=" + videoType;
        console.log("[FilmModu] get-source iste\u011Fi: " + sourceUrl);
        var sourceHeaders = Object.assign({}, HEADERS, {
          "Referer": altLink.href,
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json, text/javascript, */*"
        });
        return fetch(sourceUrl, { headers: sourceHeaders }).then(function(r) {
          if (!r.ok) return [];
          return r.json();
        }).then(function(data) {
          if (!data || !data.sources || data.sources.length === 0) {
            console.log("[FilmModu] Kaynak bulunamad\u0131: " + altLink.name);
            return [];
          }
          var subtitleUrl = null;
          if (data.subtitle) {
            subtitleUrl = data.subtitle.startsWith("http") ? data.subtitle : BASE_URL + data.subtitle;
          }
          var fmHeaders = {
            "Referer": BASE_URL + "/",
            "User-Agent": HEADERS["User-Agent"]
          };
          var probeSrc = data.sources[0].src;
          if (probeSrc.indexOf(".m3u8") === -1) probeSrc = probeSrc + ".m3u8";
          return verifySegmentPlayable(probeSrc, fmHeaders).then(function(isPlayable) {
            if (!isPlayable) {
              console.log("[FilmModu] \u274C \xD6l\xFC CDN depolama filtresi: " + altLink.name + " ak\u0131\u015Flar\u0131 elendi.");
              return [];
            }
            var streams = [];
            data.sources.forEach(function(source) {
              if (!source.src) return;
              var qualityLabel = source.label || source.res ? source.res + "p" : "HD";
              var srcUrl = source.src;
              if (srcUrl.indexOf(".m3u8") === -1) srcUrl = srcUrl + ".m3u8";
              var streamObj = {
                name: "FilmModu",
                title: altLink.name + " \u2022 " + qualityLabel,
                url: srcUrl,
                quality: qualityLabel,
                type: "hls",
                format: "hls",
                isHls: true,
                headers: fmHeaders,
                behaviorHints: {
                  notWebReady: true,
                  proxyHeaders: {
                    request: fmHeaders
                  }
                }
              };
              if (subtitleUrl) {
                streamObj.subtitles = [{
                  url: subtitleUrl,
                  language: "T\xFCrk\xE7e",
                  label: "T\xFCrk\xE7e",
                  format: "vtt",
                  type: "text/vtt"
                }];
              }
              streams.push(streamObj);
            });
            return streams;
          });
        }).catch(function(err) {
          console.error("[FilmModu] get-source hatas\u0131 (" + altLink.name + "): " + err.message);
          return [];
        });
      }).catch(function(err) {
        console.error("[FilmModu] Alt link hatas\u0131 (" + altLink.href + "): " + err.message);
        return [];
      });
    }
    function fetchStreamsFromLive(rawTitle, year, mediaType, seasonNum, episodeNum) {
      var q = cleanTitle(rawTitle);
      if (!q) return Promise.resolve([]);
      var isTv = mediaType === "tv" || mediaType === "series";
      var contentPath = isTv ? "/dizi/" : "/film/";
      var searchUrl = LIVE_URL + "/ara?q=" + encodeURIComponent(q);
      console.log("[FilmModu.live] Aran\u0131yor: " + searchUrl);
      var liveHeaders = {
        "User-Agent": HEADERS["User-Agent"],
        "Referer": LIVE_URL + "/"
      };
      var sig = timeoutSignal(12e3);
      var opts = { headers: liveHeaders };
      if (sig) opts.signal = sig;
      return fetch(searchUrl, opts).catch(function() {
        var sigRetry = timeoutSignal(12e3);
        var optsRetry = { headers: liveHeaders };
        if (sigRetry) optsRetry.signal = sigRetry;
        return fetch(searchUrl, optsRetry);
      }).then(function(r) {
        return r.ok ? r.text() : "";
      }).then(function(html) {
        if (!html) return [];
        var $ = cheerio.load(html);
        var filmHref = null;
        var normQ = normalizeForUrl(q);
        var filmSection = null;
        $("section").each(function() {
          var sectionTitle = $(this).find("h2.section-title").text().toLowerCase();
          if (isTv ? /diziler|series/.test(sectionTitle) : /filmler|films/.test(sectionTitle)) {
            filmSection = $(this);
          }
        });
        var container = filmSection || $("main");
        var candidates = [];
        container.find('a[href*="' + contentPath + '"]').each(function() {
          var href = $(this).attr("href") || "";
          try {
            href = new URL(href, LIVE_URL).href;
          } catch (_) {
            return;
          }
          var candTitle = $(this).find("h3, h4").first().text().trim() || $(this).find("img").attr("alt") || $(this).text().trim();
          var candYear = $(this).find("p").text().trim() || "";
          if (!candidates.some(function(c) {
            return c.href === href;
          })) {
            candidates.push({ href, title: candTitle, year: candYear });
          }
        });
        var stopWords = ["the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by", "bir", "ve", "ile", "icin", "de", "da"];
        var meaningfulWords = q.toLowerCase().split(/\s+/).filter(function(w) {
          return w.length > 2 && stopWords.indexOf(w) === -1;
        });
        var words = meaningfulWords.length > 0 ? meaningfulWords : q.toLowerCase().split(/\s+/).filter(function(w) {
          return w.length > 2;
        });
        var bestScore = -1;
        for (var i = 0; i < candidates.length; i++) {
          var cand = candidates[i];
          var normH = normalizeForUrl(cand.href);
          var normT = normalizeForUrl(cand.title);
          var score = 0;
          var fullMatch = normH.indexOf(normQ) !== -1 || normT.indexOf(normQ) !== -1;
          if (fullMatch) {
            score += 10;
          }
          var matchedWords = words.filter(function(w) {
            var nw = normalizeForUrl(w);
            return normH.indexOf(nw) !== -1 || normT.indexOf(nw) !== -1;
          });
          if (!fullMatch && matchedWords.length === 0) {
            continue;
          }
          if (year && cand.year && cand.year === year) {
            score += 8;
          } else if (year && cand.href.indexOf(year) !== -1) {
            score += 5;
          }
          score += matchedWords.length * 3;
          if (score > bestScore && score >= 3) {
            bestScore = score;
            filmHref = cand.href;
          }
        }
        if (!filmHref) return [];
        console.log("[FilmModu.live] Film bulundu: " + filmHref);
        var sigPage = timeoutSignal(12e3);
        var pageOpts = { headers: liveHeaders };
        if (sigPage) pageOpts.signal = sigPage;
        var contentLookupUrl = filmHref;
        if (isTv) {
          var seasonUrl = new URL(filmHref);
          seasonUrl.searchParams.set("sezon", String(Number(seasonNum)));
          contentLookupUrl = seasonUrl.href;
        }
        return fetch(contentLookupUrl, pageOpts).then(function(pr) {
          return pr.ok ? pr.text() : "";
        }).then(function(pHtml) {
          if (!pHtml) return [];
          var contentPageUrl = filmHref;
          if (isTv) {
            var expectedEpisode = new RegExp("/sezon-" + Number(seasonNum) + "/bolum-" + Number(episodeNum) + "/?$", "i");
            var episodeHref = null;
            var $show = cheerio.load(pHtml);
            $show('a[href*="/dizi/"]').each(function() {
              var href = $(this).attr("href") || "";
              var absolute;
              try {
                absolute = new URL(href, LIVE_URL).href;
              } catch (_) {
                return;
              }
              if (expectedEpisode.test(new URL(absolute).pathname)) {
                episodeHref = absolute;
                return false;
              }
            });
            if (!episodeHref) return [];
            contentPageUrl = episodeHref;
            var episodeOpts = { headers: liveHeaders };
            var sigEpisode = timeoutSignal(12e3);
            if (sigEpisode) episodeOpts.signal = sigEpisode;
            return fetch(episodeHref, episodeOpts).then(function(er) {
              return er.ok ? er.text() : "";
            }).then(function(episodeHtml) {
              if (!episodeHtml) return [];
              return resolveLivePage(episodeHtml, contentPageUrl);
            });
          }
          return resolveLivePage(pHtml, contentPageUrl);
        });
        function resolveLivePage(pHtml, contentPageUrl) {
          var pvMatch = pHtml.match(/data-pv="([^"]+)"/);
          if (!pvMatch) return [];
          var pv = pvMatch[1];
          var coreMatch = pHtml.match(/<script\b[^>]*src=["'](?:https?:)?\/\/([^/"']+\.pilavyerplay\.top)\/assets\/js\/core\.js/i);
          var playerHost = PLAYER_HOST;
          if (coreMatch && /^[a-z0-9.-]+\.pilavyerplay\.top$/i.test(coreMatch[1])) playerHost = "https://" + coreMatch[1];
          var playerEmbedUrl = playerHost + "/assets/js/s.php?s=" + encodeURIComponent(pv);
          var sigEmb = timeoutSignal(12e3);
          var embOpts = { headers: { "Referer": contentPageUrl, "User-Agent": HEADERS["User-Agent"] } };
          if (sigEmb) embOpts.signal = sigEmb;
          return fetch(playerEmbedUrl, embOpts).then(function(er) {
            return er.ok ? er.text() : "";
          }).then(function(eHtml) {
            if (!eHtml) return [];
            var jsonMatch = eHtml.match(/window\.__PLAYER__\s*=\s*(\{[\s\S]*?\});<\/script>/) || eHtml.match(/window\.__PLAYER__\s*=\s*(\{.*?\});/);
            if (!jsonMatch) return [];
            var pData = null;
            try {
              pData = JSON.parse(jsonMatch[1]);
            } catch (e) {
              return [];
            }
            if (!pData || !pData.stream) return [];
            var subtitles = [];
            if (Array.isArray(pData.subs)) {
              pData.subs.forEach(function(sub) {
                if (sub && sub.src) {
                  subtitles.push({
                    id: sub.sid || "tr",
                    url: sub.src,
                    file: sub.src,
                    lang: sub.lang === "tr" ? "tur" : "eng",
                    language: sub.lang || "tr",
                    label: sub.label || "T\xFCrk\xE7e",
                    title: sub.label || "T\xFCrk\xE7e",
                    format: "vtt",
                    type: "text/vtt"
                  });
                }
              });
            }
            var liveStreams = [];
            var streamHeaders = {
              "Referer": playerEmbedUrl,
              "User-Agent": HEADERS["User-Agent"]
            };
            var audios = Array.isArray(pData.audios) && pData.audios.length > 0 ? pData.audios : [{ label: "T\xFCrk\xE7e Dublaj" }];
            audios.forEach(function(aud) {
              var sObj = {
                name: "FilmModu",
                title: (aud.label || "T\xFCrk\xE7e Dublaj") + " \u2022 1080p FHD",
                url: pData.stream,
                quality: "1080p",
                type: "hls",
                format: "hls",
                isHls: true,
                headers: streamHeaders,
                behaviorHints: {
                  notWebReady: true,
                  proxyHeaders: { request: streamHeaders }
                }
              };
              if (subtitles.length > 0) {
                sObj.subtitles = subtitles;
              }
              liveStreams.push(sObj);
            });
            console.log("[FilmModu.live] \xC7\xF6z\xFClen ak\u0131\u015F say\u0131s\u0131: " + liveStreams.length);
            return liveStreams;
          });
        }
      }).catch(function(err) {
        console.log("[FilmModu.live] Arama hatas\u0131: " + err.message);
        return [];
      });
    }
    function getStreams(tmdbId, mediaType, seasonNum, episodeNum) {
      if (typeof tmdbId === "object" && tmdbId && tmdbId.id) {
        return getStreams(tmdbId.id, mediaType || "movie", seasonNum, episodeNum);
      }
      var requestedType = mediaType === "series" ? "tv" : mediaType;
      if (typeof tmdbId === "string" && tmdbId.startsWith("filmmodu:")) {
        var slug = tmdbId.replace("filmmodu:", "");
        var filmUrl = BASE_URL + "/" + slug;
        return fetchAlternateLinks(filmUrl).then(function(altLinks) {
          return Promise.all(altLinks.map(function(alt) {
            return fetchStreamsFromAlt(alt, filmUrl);
          })).then(function(results) {
            var allStreams = [];
            var seen = /* @__PURE__ */ new Set();
            results.forEach(function(arr) {
              if (arr) {
                arr.forEach(function(s) {
                  if (s && s.url && !seen.has(s.url)) {
                    seen.add(s.url);
                    allStreams.push(s);
                  }
                });
              }
            });
            return allStreams;
          });
        });
      }
      console.log("[FilmModu] === Ba\u015Fl\u0131yor | TMDB ID: " + tmdbId + " ===");
      return fetchTmdbInfo(tmdbId, requestedType).then(function(info) {
        if (!info.titleEn && !info.titleTr) {
          console.log("[FilmModu] TMDB ba\u015Fl\u0131k bulunamad\u0131");
          return [];
        }
        console.log("[FilmModu] Film: " + info.titleEn + " / " + info.titleTr + " (" + info.year + ")");
        if (requestedType === "tv") {
          if (!Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 || !Number.isInteger(Number(episodeNum)) || Number(episodeNum) < 1) return [];
          return fetchStreamsFromLive(info.titleEn || info.titleTr, info.year, "tv", Number(seasonNum), Number(episodeNum)).then(function(streams) {
            if (streams.length || !info.titleTr || info.titleTr === info.titleEn) return streams;
            return fetchStreamsFromLive(info.titleTr, info.year, "tv", Number(seasonNum), Number(episodeNum));
          });
        }
        return searchFilmModu(info.titleEn, info.year).then(function(filmUrl2) {
          if (!filmUrl2 && info.titleTr && info.titleTr !== info.titleEn) {
            console.log("[FilmModu] Orijinal ba\u015Fl\u0131kla bulunamad\u0131, T\xFCrk\xE7e deneniyor: " + info.titleTr);
            return searchFilmModu(info.titleTr, info.year);
          }
          return filmUrl2;
        }).then(function(filmUrl2) {
          if (!filmUrl2) {
            console.log("[FilmModu] filmmodu.one \xFCzerinde bulunamad\u0131, filmmodu.live deneniyor...");
            return fetchStreamsFromLive(info.titleEn, info.year).then(function(lStreams) {
              if (lStreams && lStreams.length > 0) return lStreams;
              if (info.titleTr && info.titleTr !== info.titleEn) {
                return fetchStreamsFromLive(info.titleTr, info.year);
              }
              return [];
            });
          }
          return fetchAlternateLinks(filmUrl2).then(function(altLinks) {
            if (altLinks.length === 0) return [];
            return Promise.all(altLinks.map(function(alt) {
              return fetchStreamsFromAlt(alt, filmUrl2);
            })).then(function(results) {
              var allStreams = [];
              var seen = /* @__PURE__ */ new Set();
              results.forEach(function(arr) {
                if (arr && arr.length > 0) {
                  arr.forEach(function(s) {
                    if (s && s.url && !seen.has(s.url)) {
                      seen.add(s.url);
                      allStreams.push(s);
                    }
                  });
                }
              });
              return allStreams;
            });
          }).then(function(validStreams) {
            if (validStreams && validStreams.length > 0) {
              console.log("[FilmModu] Toplam do\u011Frulanm\u0131\u015F canl\u0131 stream: " + validStreams.length);
              return validStreams;
            }
            console.log("[FilmModu] filmmodu.one \xFCzerinde canl\u0131 stream bulunamad\u0131, filmmodu.live deneniyor...");
            return fetchStreamsFromLive(info.titleEn, info.year).then(function(lStreams) {
              if (lStreams && lStreams.length > 0) return lStreams;
              if (info.titleTr && info.titleTr !== info.titleEn) {
                return fetchStreamsFromLive(info.titleTr, info.year);
              }
              return [];
            });
          });
        });
      }).catch(function(err) {
        console.error("[FilmModu] Genel hata: " + err.message);
        return [];
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
      module2.exports = { getStreams };
    } else if (typeof globalThis !== "undefined") {
      globalThis.getStreams = getStreams;
    }
    function getCatalog(args) {
      var query = args && args.search || args && args.extra && args.extra.search || args && args.query || "";
      var targetUrl = query ? BASE_URL + "/film-ara?term=" + encodeURIComponent(query) : BASE_URL + "/";
      return fetch(targetUrl, { headers: HEADERS }).then(function(res) {
        return res.text();
      }).then(function(html) {
        var $ = cheerio.load(html);
        var metas = [];
        var seen = /* @__PURE__ */ new Set();
        $("div.movie").each(function() {
          var a = $(this).find("a").first();
          var img = $(this).find("img").first();
          var href = a.attr("href") || "";
          var title = a.text().trim() || img.attr("alt") || "";
          var poster = img.attr("data-src") || img.attr("src") || "";
          var slug = href.replace(BASE_URL, "").replace(/^\//, "").replace(/\/$/, "");
          if (slug && !seen.has(slug) && title) {
            seen.add(slug);
            metas.push({
              id: "filmmodu:" + slug,
              type: "movie",
              name: title,
              poster,
              background: poster,
              genres: ["FilmModu", "Film"],
              description: title + " - FilmModu HD Film"
            });
          }
        });
        return { metas };
      }).catch(function() {
        return { metas: [] };
      });
    }
    function getMeta(args) {
      var rawId = typeof args === "string" ? args : args && args.id ? args.id : "";
      if (!rawId || !rawId.startsWith("filmmodu:")) return Promise.resolve({ meta: null });
      var slug = rawId.replace("filmmodu:", "");
      var filmUrl = BASE_URL + "/" + slug;
      return fetch(filmUrl, { headers: HEADERS }).then(function(res) {
        return res.text();
      }).then(function(html) {
        var $ = cheerio.load(html);
        var title = $("h1").first().text().trim() || $("title").first().text().replace(/film izle.*/i, "").trim();
        var poster = $('img[itemprop="image"]').attr("src") || $('img[itemprop="image"]').attr("data-src") || $("picture source").attr("data-srcset") || $("div.poster img").first().attr("src") || $("div.poster img").first().attr("data-src") || $('meta[property="og:image"]').attr("content") || "";
        if (poster && poster.startsWith("data:")) {
          poster = $('meta[property="og:image"]').attr("content") || "";
        }
        var backdrop = $('meta[property="og:image"]').attr("content") || poster;
        var desc = $("div.description, div.summary, p").first().text().trim();
        return {
          meta: {
            id: rawId,
            type: "movie",
            name: title,
            poster,
            background: backdrop,
            description: desc,
            genres: ["FilmModu", "Film"],
            videos: [{ id: rawId, title }]
          }
        };
      }).catch(function() {
        return { meta: null };
      });
    }
    if (typeof module2 !== "undefined" && module2.exports) {
      module2.exports = wrapAll({ getStreams, getCatalog, getMeta }, cfgReady);
    } else if (typeof globalThis !== "undefined") {
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
var provider = require_filmmodu();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "filmmodu", "id": "mum_filmmodu", "name": "FilmModu", "supportedTypes": ["movie", "tv"], "enabled": true, "timeoutMs": 15e3, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
