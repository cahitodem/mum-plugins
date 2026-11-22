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
          diziyou: {
            base: "https://www.diziyou.love",
            storage: "https://storage.diziyou.love"
          },
          sezonlukdizi: {
            base: "https://sezonlukdizi.cc"
          },
          yabancidizi: {
            base: "https://yabancidizi.news"
          }
        },
        movies: {
          hdfilmdelisi: {
            base: "https://hdfilmdelisi.one"
          },
          vidmody: {
            base: "https://ha.vixolity.com"
          }
        },
        meta_resolvers: {}
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

// src/anthology_m3u/index.js
var require_anthology_m3u = __commonJS({
  "src/anthology_m3u/index.js"(exports2, module2) {
    var { sortStreamsByQuality } = require_quality();
    var { loadConfig, val, wrapAll } = require_config2();
    var { timeoutSignal, fetchWithTimeout } = require_http();
    var _cfgReady = null;
    function cfgReady() {
      if (!_cfgReady) {
        _cfgReady = loadConfig().then(function() {
          var v;
          v = val("urls.m3u.film_base");
          if (v) FILM_BASE_URL = v;
          v = val("urls.m3u.dizi_base");
          if (v) DIZI_BASE_URL = v;
          v = val("urls.m3u.film_full");
          if (v) FILM_FULL_URL = v;
          v = val("urls.m3u.dizi_full");
          if (v) DIZI_FULL_URL = v;
        });
      }
      return _cfgReady;
    }
    var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
    var FILM_BASE_URL = "https://raw.githubusercontent.com/mooncrown04/m3ubirlestir/main/nuvio_parcalari/";
    var DIZI_BASE_URL = "https://raw.githubusercontent.com/mooncrown04/m3ubirlestir/main/nuvio_dizi_parcalari/";
    var FILM_FULL_URL = "https://raw.githubusercontent.com/mooncrown04/m3ubirlestir/main/birlesik_sinema.m3u";
    var DIZI_FULL_URL = "https://raw.githubusercontent.com/mooncrown04/m3ubirlestir/main/birlesik_diziler.m3u";
    var cache = {};
    var cacheTime = {};
    function ultraClean(s) {
      if (!s) return "";
      return s.toString().toLowerCase().replace(/[ıİ]/g, "i").replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g").replace(/[çÇ]/g, "c").replace(/[âÂ]/g, "a").replace(/[îÎ]/g, "i").replace(/[ûÛ]/g, "u").replace(/[^a-z0-9]/g, "").trim();
    }
    function cleanTitleTokens(s) {
      if (!s) return [];
      const junk = /* @__PURE__ */ new Set([
        "the",
        "a",
        "an",
        "bir",
        "film",
        "filmi",
        "dizi",
        "dizisi",
        "izle",
        "dublaj",
        "altyazi",
        "altyazili",
        "turkce",
        "hd",
        "fhd",
        "uhd",
        "webrip",
        "bluray",
        "extended",
        "cut",
        "edition",
        "unrated",
        "remastered"
      ]);
      const romanMap = {
        "ii": "2",
        "iii": "3",
        "iv": "4",
        "v": "5",
        "vi": "6",
        "vii": "7",
        "viii": "8",
        "ix": "9",
        "x": "10"
      };
      const folded = String(s).toLowerCase().replace(/[ıİ]/g, "i").replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g").replace(/[çÇ]/g, "c").replace(/[âÂ]/g, "a").replace(/[îÎ]/g, "i").replace(/[ûÛ]/g, "u");
      return folded.split(/[^a-z0-9]+/).map((t) => t.replace(/[^a-z0-9]/g, "")).filter((t) => t.length > 0 && !junk.has(t)).map((t) => romanMap[t] || t);
    }
    function getLetterGroups(title) {
      const groups = /* @__PURE__ */ new Set();
      const clean = ultraClean(title);
      if (!clean) return ["diger"];
      const firstChar = clean.charAt(0);
      if (/[0-9]/.test(firstChar)) groups.add("0_9_rakam");
      else if (/[a-z]/.test(firstChar)) groups.add(firstChar);
      else groups.add("diger");
      const stripped = clean.replace(/^(the|a|an|bir)/, "");
      if (stripped && stripped.length > 0) {
        const nextChar = stripped.charAt(0);
        if (/[0-9]/.test(nextChar)) groups.add("0_9_rakam");
        else if (/[a-z]/.test(nextChar)) groups.add(nextChar);
      }
      return Array.from(groups);
    }
    function matchesMovieTitle(m3uTitle, m3uYear, targetTitle, targetYear) {
      if (!m3uTitle || !targetTitle) return false;
      if (m3uYear && targetYear) {
        const yM3u = parseInt(m3uYear, 10);
        const yTgt = parseInt(targetYear, 10);
        if (!isNaN(yM3u) && !isNaN(yTgt) && Math.abs(yM3u - yTgt) > 1) {
          return false;
        }
      }
      const strippedGenre = m3uTitle.replace(/ (?:Aksiyon|Korku|Dram|Gerilim|Komedi|Macera|Polisiye|Biyografi|Müzik|Muzik|Gizem|Bilim-Kurgu|Romantik|Belgesel|Western|Animasyon|Aile|Suç|Suc)--.*/i, "").replace(/\s*--.*$/, "").replace(/\([^)]*\)/g, "").trim();
      const parts = [strippedGenre];
      if (strippedGenre.indexOf("/") !== -1) {
        strippedGenre.split("/").forEach(function(p) {
          if (p && p.trim()) parts.push(p.trim());
        });
      }
      const dashLead = strippedGenre.split("-")[0].trim();
      if (dashLead && parts.indexOf(dashLead) === -1) parts.push(dashLead);
      let tTokens = cleanTitleTokens(targetTitle);
      if (!tTokens.length) return false;
      const tgtJoined = tTokens.join("");
      for (let pi = 0; pi < parts.length; pi++) {
        let mTokens = cleanTitleTokens(parts[pi]);
        if (!mTokens.length) continue;
        if (mTokens.length === tTokens.length + 1 && mTokens[mTokens.length - 1] === "1") {
          const hasTgtNum = tTokens.some((t) => /^\d+$/.test(t));
          if (!hasTgtNum) {
            mTokens.pop();
          }
        }
        if (mTokens.join("") === tgtJoined) return true;
      }
      return false;
    }
    function matchesShowTitle(rawName, targetName) {
      if (!rawName || !targetName) return false;
      const nameWithoutYear = rawName.replace(/\([^)]*\)/g, "").split("-")[0].trim();
      const nameTokens = cleanTitleTokens(nameWithoutYear);
      const targetTokens = cleanTitleTokens(targetName);
      if (!nameTokens.length || !targetTokens.length) return false;
      return nameTokens.join("") === targetTokens.join("");
    }
    var EP_REGEX = /(?:s\d+[\s._-]*e0*(\d+)|(?:b[oö]l[uü]m|episode|ep)[\s._-]*0*(\d+)|\b0*(\d+)\.[\s._-]*b[oö]l[uü]m|\b\d+x0*(\d+)\b)/i;
    var S_REGEX = /(?:s0*(\d+)[\s._-]*e|\b0*(\d+)x\d+\b)/i;
    function resolveTmdbMovie(rawId, signal) {
      return __async(this, null, function* () {
        let cleanId = String(rawId).replace(/^tmdb:/, "").split(":")[0].trim();
        const isImdb = cleanId.startsWith("tt");
        try {
          let movieId = cleanId;
          if (isImdb) {
            const res2 = yield fetchWithTimeout(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`, { signal }, 8e3);
            const data2 = yield res2.json();
            const found = data2.movie_results && data2.movie_results[0] ? data2.movie_results[0] : null;
            if (!found || !found.id) return null;
            movieId = String(found.id);
          }
          const res = yield fetchWithTimeout(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=external_ids`, { signal }, 8e3);
          const data = yield res.json();
          if (!data || !data.title && !data.original_title) return null;
          if (isImdb && !data.imdb_id) data.imdb_id = cleanId;
          return data;
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return null;
        }
      });
    }
    function resolveTmdbShow(rawId, signal) {
      return __async(this, null, function* () {
        let cleanId = String(rawId).replace(/^tmdb:/, "").split(":")[0].trim();
        const isImdb = cleanId.startsWith("tt");
        try {
          let showId = cleanId;
          if (isImdb) {
            const res2 = yield fetchWithTimeout(`https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`, { signal }, 8e3);
            const data2 = yield res2.json();
            const found = data2.tv_results && data2.tv_results[0] ? data2.tv_results[0] : null;
            if (!found || !found.id) return null;
            showId = String(found.id);
          }
          const res = yield fetchWithTimeout(`https://api.themoviedb.org/3/tv/${showId}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=external_ids`, { signal }, 8e3);
          const data = yield res.json();
          if (!data || !data.name && !data.original_name) return null;
          if (isImdb && !data.imdb_id) data.imdb_id = cleanId;
          if (data.external_ids && data.external_ids.imdb_id && !data.imdb_id) data.imdb_id = data.external_ids.imdb_id;
          return data;
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return null;
        }
      });
    }
    function fetchM3U(url, signal) {
      return __async(this, null, function* () {
        const now = Date.now();
        if (cache[url] && now - (cacheTime[url] || 0) < 3e5) {
          return cache[url];
        }
        try {
          const res = yield fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal }, 8e3);
          if (!res.ok) return null;
          const text = yield res.text();
          cache[url] = text;
          cacheTime[url] = now;
          return text;
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return null;
        }
      });
    }
    var BLOCKED_DOMAINS = [
      "imagebin.pics",
      "imagehub.pics",
      "imagesbox.cloud",
      "photogrids.site",
      "picturebox.cloud",
      "pixtureup.org",
      "pixypost.art",
      "pixtures.art",
      "imglink.info",
      "imglink.pro",
      "picogallery.org",
      "rapidimages.pro",
      "imagescdns.pics",
      "seeshare.pics",
      "imgmania.org",
      "imageshub.pro",
      "photomag.biz",
      "photostack.net",
      "photofunny.org",
      "photoflax.org",
      "photour.org",
      "pictureflix.org",
      "photoflick.org",
      "photoflix.org",
      ".buzz/"
    ];
    function isBlockedStream(url) {
      if (!url) return true;
      for (let i = 0; i < BLOCKED_DOMAINS.length; i++) {
        if (url.includes(BLOCKED_DOMAINS[i])) return true;
      }
      return false;
    }
    var VIXOLITY_HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://pl.vixolity.com/",
      "Origin": "https://pl.vixolity.com",
      "Accept": "*/*"
    };
    function buildStreamObject(streamName, sourceTag, streamUrl, score) {
      const isVixolity = /vixolity\.com/i.test(streamUrl);
      const isHlsStream = streamUrl.includes(".m3u8") || isVixolity;
      const obj = {
        name: streamName,
        title: `\u231C Anthology M3U \u231F | ${sourceTag} [HD]`,
        url: streamUrl,
        quality: sourceTag || "HD",
        format: isHlsStream ? "hls" : "mp4",
        isHls: isHlsStream
      };
      if (typeof score === "number") obj.score = score;
      if (isVixolity) {
        obj.headers = VIXOLITY_HEADERS;
        obj.behaviorHints = { proxyHeaders: { request: VIXOLITY_HEADERS } };
      }
      return obj;
    }
    function scanFilmM3UContent(content, d, targetImdb, targetYear, seenUrls, results) {
      if (!content) return;
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith("#EXTINF")) continue;
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : "";
        if (!nextLine.startsWith("http")) continue;
        if (isBlockedStream(nextLine)) continue;
        if (seenUrls.has(nextLine)) continue;
        const grpTitleMatch = line.match(/group-title="([^"]+)"/);
        const grpTitle = grpTitleMatch ? grpTitleMatch[1].toUpperCase() : "";
        if (d.original_language !== "tr" && (grpTitle.includes("YERLI") || grpTitle.includes("TURK"))) {
          continue;
        }
        const urlImdbMatch = nextLine.match(/\b(tt\d+)\b/i);
        const lineImdb = urlImdbMatch ? urlImdbMatch[1].toLowerCase() : null;
        if (targetImdb && lineImdb && lineImdb !== targetImdb.toLowerCase()) {
          continue;
        }
        const authorMatch = line.match(/group-author="([^"]+)"/);
        const sourceTag = authorMatch ? authorMatch[1].replace(/[\[\]]/g, "").trim() : "M3U";
        const parts = line.split(",");
        const rawName = parts[parts.length - 1].trim();
        const yearMatch = line.match(/year="(\d{4})"/);
        const m3uYear = yearMatch ? yearMatch[1] : rawName.match(/\d{4}/) ? rawName.match(/\d{4}/)[0] : "";
        let isMatch = false;
        let score = 0;
        if (targetImdb && nextLine.includes(targetImdb)) {
          isMatch = true;
          score = 120;
        } else if (matchesMovieTitle(rawName, m3uYear, d.title, targetYear) || matchesMovieTitle(rawName, m3uYear, d.original_title, targetYear)) {
          isMatch = true;
          score = m3uYear && targetYear && Math.abs(parseInt(m3uYear, 10) - parseInt(targetYear, 10)) <= 1 ? 100 : 90;
        }
        if (isMatch) {
          seenUrls.add(nextLine);
          results.push(buildStreamObject(`${d.title || d.original_title} (${m3uYear || targetYear})`, sourceTag, nextLine, score));
        }
      }
    }
    function searchFilmStreams(tmdbId, opts) {
      return __async(this, null, function* () {
        var signal = opts && opts.signal;
        try {
          const d = yield resolveTmdbMovie(tmdbId, signal);
          if (!d || !d.title && !d.original_title) return [];
          const targetImdb = d.imdb_id || (d.external_ids ? d.external_ids.imdb_id : null);
          const targetYear = (d.release_date || "").slice(0, 4);
          const primaryGroups = /* @__PURE__ */ new Set([
            ...getLetterGroups(d.title),
            ...getLetterGroups(d.original_title)
          ]);
          const results = [];
          const seenUrls = /* @__PURE__ */ new Set();
          const pArr = Array.from(primaryGroups);
          const pContents = yield Promise.all(pArr.map(function(grp) {
            return fetchM3U(`${FILM_BASE_URL}nuvio_${grp}.m3u`, signal);
          }));
          for (var i = 0; i < pContents.length; i++) {
            scanFilmM3UContent(pContents[i], d, targetImdb, targetYear, seenUrls, results);
          }
          if (results.length === 0) {
            const fallbackGroups = ["0_9_rakam", "diger"].filter(function(g) {
              return !primaryGroups.has(g);
            });
            const fbContents = yield Promise.all(fallbackGroups.map(function(grp) {
              return fetchM3U(`${FILM_BASE_URL}nuvio_${grp}.m3u`, signal);
            }));
            for (var j = 0; j < fbContents.length; j++) {
              scanFilmM3UContent(fbContents[j], d, targetImdb, targetYear, seenUrls, results);
            }
          }
          if (results.length === 0 && FILM_FULL_URL && (!signal || !signal.aborted)) {
            const fullContent = yield fetchM3U(FILM_FULL_URL, signal);
            scanFilmM3UContent(fullContent, d, targetImdb, targetYear, seenUrls, results);
          }
          return results.sort((a, b) => b.score - a.score);
        } catch (e) {
          if (e && (e.name === "AbortError" || e.message === "TIMEOUT" || e.name === "ProviderError" || signal && signal.aborted)) {
            throw e;
          }
          return [];
        }
      });
    }
    function scanDiziM3UContent(content, d, targetImdb, finalSeason, finalEpisode, sPad, ePad, seenUrls, results) {
      if (!content) return;
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith("#EXTINF")) continue;
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : "";
        if (!nextLine.startsWith("http")) continue;
        if (isBlockedStream(nextLine)) continue;
        if (seenUrls.has(nextLine)) continue;
        const urlImdbMatch = nextLine.match(/\b(tt\d+)\b/i);
        const lineImdb = urlImdbMatch ? urlImdbMatch[1].toLowerCase() : null;
        if (targetImdb && lineImdb && lineImdb !== targetImdb.toLowerCase()) {
          continue;
        }
        const tvgIdMatch = line.match(/tvg-id="(\d+)"/);
        const lineTvgId = tvgIdMatch ? tvgIdMatch[1] : null;
        let showMatches = false;
        if (lineTvgId && d.id) {
          if (lineTvgId === String(d.id)) {
            showMatches = true;
          }
        }
        if (!showMatches && !lineTvgId) {
          const grpMatch = line.match(/group-title="([^"]+)"/);
          const grpTitle = grpMatch ? grpMatch[1] : "";
          const parts2 = line.split(",");
          const diziname2 = parts2[parts2.length - 1].trim();
          const dizinameWithoutEp = diziname2.replace(/(?:s\d+[\s._-]*e\d+|b[oö]l[uü]m[\s._-]*\d+|\d+\.[\s._-]*b[oö]l[uü]m|\b\d+x\d+).*/i, "").trim();
          if (matchesShowTitle(grpTitle, d.name) || matchesShowTitle(grpTitle, d.original_name) || matchesShowTitle(dizinameWithoutEp, d.name) || matchesShowTitle(dizinameWithoutEp, d.original_name)) {
            showMatches = true;
          }
        }
        if (!showMatches) continue;
        const parts = line.split(",");
        const diziname = parts[parts.length - 1].trim();
        const sMatch = diziname.match(S_REGEX);
        if (sMatch) {
          const lineSeason = parseInt(sMatch[1] || sMatch[2], 10);
          if (lineSeason !== finalSeason) continue;
        }
        const epMatch = diziname.match(EP_REGEX);
        if (!epMatch) continue;
        const epNum = parseInt(epMatch[1] || epMatch[2] || epMatch[3] || epMatch[4], 10);
        if (epNum !== finalEpisode) continue;
        const authorMatch = line.match(/group-author="([^"]+)"/);
        const sourceTag = authorMatch ? authorMatch[1].replace(/[\[\]]/g, "").trim() : "M3U";
        seenUrls.add(nextLine);
        results.push(buildStreamObject(`${d.name || d.original_name} S${sPad}E${ePad}`, sourceTag, nextLine));
      }
    }
    function searchDiziStreams(rawId, seasonInput, episodeInput, opts) {
      return __async(this, null, function* () {
        var signal = opts && opts.signal;
        let finalSeason = parseInt(seasonInput, 10) || 1;
        let finalEpisode = parseInt(episodeInput, 10) || 1;
        if (typeof rawId === "string" && rawId.includes(":")) {
          const parts = rawId.split(":");
          if (parts.length >= 3) {
            finalSeason = parseInt(parts[1], 10) || finalSeason;
            finalEpisode = parseInt(parts[2], 10) || finalEpisode;
          }
        }
        try {
          const d = yield resolveTmdbShow(rawId, signal);
          if (!d || !d.name && !d.original_name) return [];
          const targetImdb = d && d.imdb_id || d && d.external_ids && d.external_ids.imdb_id || (typeof rawId === "string" && rawId.startsWith("tt") ? rawId.split(":")[0] : null);
          const sPad = finalSeason.toString().padStart(2, "0");
          const ePad = finalEpisode.toString().padStart(2, "0");
          const primaryGroups = /* @__PURE__ */ new Set([
            ...getLetterGroups(d.name),
            ...getLetterGroups(d.original_name)
          ]);
          const results = [];
          const seenUrls = /* @__PURE__ */ new Set();
          const pArr = Array.from(primaryGroups);
          const pContents = yield Promise.all(pArr.map(function(grp) {
            const fileName = `dizi_${grp}_s${finalSeason}.m3u`;
            return fetchM3U(`${DIZI_BASE_URL}${fileName}`, signal);
          }));
          for (var i = 0; i < pContents.length; i++) {
            scanDiziM3UContent(pContents[i], d, targetImdb, finalSeason, finalEpisode, sPad, ePad, seenUrls, results);
          }
          if (results.length === 0) {
            const fallbackGroups = ["0_9_rakam", "diger"].filter(function(g) {
              return !primaryGroups.has(g);
            });
            const fbContents = yield Promise.all(fallbackGroups.map(function(grp) {
              const fileName = `dizi_${grp}_s${finalSeason}.m3u`;
              return fetchM3U(`${DIZI_BASE_URL}${fileName}`, signal);
            }));
            for (var j = 0; j < fbContents.length; j++) {
              scanDiziM3UContent(fbContents[j], d, targetImdb, finalSeason, finalEpisode, sPad, ePad, seenUrls, results);
            }
          }
          if (results.length === 0 && DIZI_FULL_URL && (!signal || !signal.aborted)) {
            const fullContent = yield fetchM3U(DIZI_FULL_URL, signal);
            scanDiziM3UContent(fullContent, d, targetImdb, finalSeason, finalEpisode, sPad, ePad, seenUrls, results);
          }
          return results;
        } catch (err) {
          if (err && (err.name === "AbortError" || err.message === "TIMEOUT" || err.name === "ProviderError" || signal && signal.aborted)) {
            throw err;
          }
          return [];
        }
      });
    }
    function getStreams(id, mediaType, season, episode, options) {
      return __async(this, null, function* () {
        let finalId = id;
        let finalType = mediaType;
        let finalSeason = season;
        let finalEpisode = episode;
        let finalOpts = options || {};
        if (id && typeof id === "object") {
          finalType = id.type || id.mediaType || mediaType;
          finalSeason = id.season || season;
          finalEpisode = id.episode || episode;
          finalOpts = id.options || options || {};
          finalId = id.id || id.tmdbId || id.imdbId;
        }
        if (typeof finalId === "string" && finalId.includes(":")) {
          const parts = finalId.split(":");
          if (parts.length >= 3) {
            finalSeason = parts[1];
            finalEpisode = parts[2];
            finalId = parts[0];
            if (!finalType || finalType === "movie") finalType = "series";
          }
        }
        const isSeries = finalType === "tv" || finalType === "series" || finalSeason !== void 0 && finalEpisode !== void 0 && finalSeason !== null;
        let streams = [];
        if (isSeries) {
          streams = yield searchDiziStreams(finalId, finalSeason, finalEpisode, finalOpts);
        } else {
          streams = yield searchFilmStreams(finalId, finalOpts);
        }
        return sortStreamsByQuality(streams);
      });
    }
    if (typeof module2 !== "undefined") {
      module2.exports = wrapAll({
        getStreams,
        searchFilmStreams,
        searchDiziStreams,
        sortStreamsByQuality
      }, cfgReady);
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
var provider = require_anthology_m3u();
var { adapt } = require_adapter();
module.exports = adapt(provider, { "key": "anthology_m3u", "id": "mum_anthology_m3u", "name": "Anthology M3U", "supportedTypes": ["movie", "tv"], "enabled": true, "observation": "sources-found", "playback": "unverified" }, function(record) {
  globalThis.console.info("[MUM] " + JSON.stringify(record));
});
globalThis.getStreams = module.exports.getStreams;
