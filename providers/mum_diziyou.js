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

// src/diziyou/index.js
var require_diziyou = __commonJS({
  "src/diziyou/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { fetchWithTimeout } = require_http();
    var { ProviderError } = require_errors();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.series.diziyou.base");
          if (v) BASE_URL = String(v).replace(/\/+$/, "");
          v = val("urls.series.diziyou.storage");
          if (v) STORAGE_URL = String(v).replace(/\/+$/, "");
          if (WORKING_HEADERS) WORKING_HEADERS.Referer = BASE_URL + "/";
        });
      }
      return _cfgReady;
    }
    var cheerio = require("cheerio-without-node-native");
    var BASE_URL = "https://www.diziyou.love";
    var STORAGE_URL = "https://storage.diziyou.love";
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var WORKING_HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": BASE_URL + "/",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    };
    function resolveTmdbInfo(id, mediaType, signal) {
      return __async(this, null, function* () {
        try {
          let cleanId = String(id || "").trim();
          if (cleanId.includes(":")) cleanId = cleanId.split(":")[0];
          let numericId = null;
          let title = "";
          let origTitle = "";
          if (cleanId.startsWith("tt")) {
            const findRes = yield fetchWithTimeout(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`, { signal }, 8e3);
            if (findRes.ok) {
              const fData = yield findRes.json();
              const item = fData.tv_results && fData.tv_results[0];
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
            const tRes = yield fetchWithTimeout(`https://api.themoviedb.org/3/tv/${numericId}?api_key=${TMDB_API_KEY}&language=tr-TR`, { signal }, 8e3);
            if (tRes.ok) {
              const tData = yield tRes.json();
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
    function normalizeTitle(value) {
      return String(value || "").toLowerCase().replace(/[ıİ]/g, "i").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c").replace(/[^a-z0-9]+/g, " ").trim();
    }
    function isEpisodeHref(href) {
      return /-\d+-sezon-\d+-bolum(?:\/|$)/i.test(String(href || ""));
    }
    function findEpisodeHref($, seasonNum, episodeNum) {
      var exact = new RegExp("-" + seasonNum + "-sezon-" + episodeNum + "-bolum(?:[/?#]|$)", "i");
      var result = null;
      $("a[href]").each(function() {
        var href = $(this).attr("href") || "";
        if (exact.test(href)) {
          result = href;
          return false;
        }
      });
      return result;
    }
    function findShowHref($, candidates) {
      var wanted = candidates.map(normalizeTitle).filter(Boolean);
      var best = null, bestScore = 0;
      $("#content a[href], a[href]").each(function() {
        var href = $(this).attr("href") || "";
        if (!href || isEpisodeHref(href) || /\/(?:kategori|dizi-arsivi|tag|author)\//i.test(href)) return;
        var absolute;
        try {
          absolute = new URL(href, BASE_URL).href;
        } catch (e) {
          return;
        }
        if (absolute.indexOf(BASE_URL + "/") !== 0 || /[?#]/.test(absolute)) return;
        var pathSlug = absolute.split("/").filter(Boolean).pop() || "";
        var text = $(this).text().trim() || $(this).find("img").attr("alt") || "";
        var score = 0;
        wanted.forEach(function(title) {
          var slug = normalizeTitle(pathSlug.replace(/\d+$/, "").replace(/-/g, " "));
          var label = normalizeTitle(text);
          if (slug === title || label === title) score = Math.max(score, 100);
          else if (slug.indexOf(title) === 0 || label.indexOf(title) === 0) score = Math.max(score, 75);
          else if (title.indexOf(slug) === 0 && slug.length >= 5) score = Math.max(score, 60);
        });
        if (score > bestScore) {
          best = absolute;
          bestScore = score;
        }
      });
      return bestScore >= 60 ? best : null;
    }
    function parsePlayerPage(playerHtml, playerUrl) {
      var $ = cheerio.load(playerHtml);
      var source = $("#diziyouSource").attr("src") || $("video source[src]").first().attr("src");
      if (!source) return null;
      try {
        source = new URL(source, playerUrl).href;
      } catch (e) {
        return null;
      }
      if (!/^https?:\/\//i.test(source)) return null;
      var subtitles = [];
      var scriptText = $("script").map(function() {
        return $(this).html() || "";
      }).get().join("\n");
      var trMatch = scriptText.match(/trUrl\s*:\s*['"]([^'"]+)['"]/i);
      var enMatch = scriptText.match(/enUrl\s*:\s*['"]([^'"]+)['"]/i);
      [[trMatch, "T\xFCrk\xE7e"], [enMatch, "English"]].forEach(function(entry) {
        if (!entry[0]) return;
        try {
          subtitles.push({ url: new URL(entry[0][1], playerUrl).href, language: entry[1], label: entry[1] });
        } catch (e) {
        }
      });
      return { url: source, subtitles };
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
          if (!Number.isInteger(Number(seasonNum)) || Number(seasonNum) < 0 || !Number.isInteger(Number(episodeNum)) || Number(episodeNum) < 1) return [];
          seasonNum = Number(seasonNum);
          episodeNum = Number(episodeNum);
          const info = yield resolveTmdbInfo(tmdbId, mediaType, signal);
          const trTitle = (info.title || "").trim();
          const orgTitle = (info.origTitle || "").trim();
          const displayTitle = trTitle || orgTitle || "Dizi";
          const searchCandidates = [trTitle];
          if (orgTitle && orgTitle !== trTitle) searchCandidates.push(orgTitle);
          var episodeUrl = null;
          var showUrl = null;
          for (const q of searchCandidates) {
            if (!q) continue;
            const searchUrl = `${BASE_URL}/?s=` + encodeURIComponent(q);
            const res = yield fetchWithTimeout(searchUrl, { headers: WORKING_HEADERS, signal }, 8e3);
            if (!res.ok) continue;
            const html = yield res.text();
            const $ = cheerio.load(html);
            episodeUrl = findEpisodeHref($, seasonNum, episodeNum);
            if (episodeUrl) break;
            showUrl = findShowHref($, [q, trTitle, orgTitle]);
            if (showUrl) break;
          }
          if (!episodeUrl && showUrl) {
            const showRes = yield fetchWithTimeout(showUrl, { headers: WORKING_HEADERS, signal }, 8e3);
            if (showRes.ok) episodeUrl = findEpisodeHref(cheerio.load(yield showRes.text()), seasonNum, episodeNum);
          }
          if (!episodeUrl) return [];
          try {
            episodeUrl = new URL(episodeUrl, BASE_URL).href;
          } catch (e) {
            return [];
          }
          if (episodeUrl.indexOf(BASE_URL + "/") !== 0) return [];
          const epRes = yield fetchWithTimeout(episodeUrl, { headers: WORKING_HEADERS, signal }, 8e3);
          if (!epRes.ok) return [];
          const epHtml = yield epRes.text();
          const $episode = cheerio.load(epHtml);
          var playerUrl = $episode("#diziyouPlayer").attr("src");
          if (!playerUrl) return [];
          try {
            playerUrl = new URL(playerUrl, episodeUrl).href;
          } catch (e) {
            return [];
          }
          if (playerUrl.indexOf(BASE_URL + "/player/") !== 0) return [];
          var hasDublaj = $episode("#turkceDublaj").length > 0 || /türkçe dublaj|turkce dublaj/i.test($episode(".diziyouOption, .infoelem, .bolumcontent").text());
          var playerTasks = [
            {
              langType: "sub",
              url: playerUrl,
              label: hasDublaj ? "\u{1F310} TR Altyaz\u0131l\u0131" : ""
            }
          ];
          if (hasDublaj) {
            var dubPlayerUrl = playerUrl.replace(/\.html(?=[?#]|$)/i, "_tr.html");
            if (dubPlayerUrl !== playerUrl) {
              playerTasks.unshift({
                langType: "dub",
                url: dubPlayerUrl,
                label: "\u{1F1F9}\u{1F1F7} T\xFCrk\xE7e Dublaj"
              });
            }
          }
          var streams = [];
          for (const task of playerTasks) {
            try {
              const playerRes = yield fetchWithTimeout(task.url, { headers: Object.assign({}, WORKING_HEADERS, { Referer: episodeUrl }), signal }, 8e3);
              if (!playerRes.ok) continue;
              const parsed = parsePlayerPage(yield playerRes.text(), task.url);
              if (!parsed) continue;
              const dyHeaders = { Referer: task.url };
              const labelPart = task.label ? " \xB7 " + task.label : "";
              streams.push({
                name: displayTitle,
                title: "\u231C DiziYou \u231F | " + displayTitle + labelPart + " \xB7 " + seasonNum + ". Sezon " + episodeNum + ". B\xF6l\xFCm",
                url: parsed.url,
                quality: "HLS",
                type: "hls",
                provider: "diziyou",
                headers: dyHeaders,
                behaviorHints: { notWebReady: true, proxyHeaders: { request: dyHeaders } },
                subtitles: parsed.subtitles
              });
            } catch (errTask) {
              if (errTask && (errTask.name === "AbortError" || errTask.message === "TIMEOUT" || errTask.name === "ProviderError")) throw errTask;
            }
          }
          return streams;
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
var provider = require_diziyou();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "diziyou", "id": "mum_diziyou", "name": "DiziYou", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "empty", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
