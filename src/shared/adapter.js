// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.

function normalizeStreams(raw) {
  if (!Array.isArray(raw)) throw new Error('INVALID_RESULT');
  var seen = Object.create(null), invalid = 0;
  var streams = raw.reduce(function(out, item) {
    var url = item && (typeof item.url === 'string' ? item.url : item.url && item.url.url);
    if (typeof url !== 'string' || !/^https?:\/\/[^\s/]+(?:[/?#]|$)/i.test(url)) { invalid++; return out; }
    var headers = Object.assign({}, item.behaviorHints && item.behaviorHints.proxyHeaders && item.behaviorHints.proxyHeaders.request || {}, item.headers || {});
    var key = JSON.stringify([url, Object.keys(headers).sort().map(function(k){return [k,headers[k]];})]);
    if (!seen[key]) { seen[key]=true; out.push(Object.assign({},item,{url:url,headers:headers})); }
    return out;
  }, []);
  return {streams:streams,invalid:invalid};
}

function adapt(provider, source, emit, options) {
  if (!provider || typeof provider.getStreams !== 'function') throw new Error('MISSING_EXPORT');
  var limit = options && options.timeoutMs || source.timeoutMs || 12000;
  return {getStreams:async function(id,type,season,episode) {
    var started=Date.now(), timer, timedOut=false;
    var abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var record={provider:source.id,status:'started',count:0,rejected:0,elapsedMs:0,playback:'unverified'};
    function report() { record.elapsedMs=Date.now()-started; try { if(emit) emit(Object.assign({},record)); } catch (_) {} }
    report();
    try {
      type = type === 'series' ? 'tv' : type;
      if (source.supportedTypes.indexOf(type)<0) {record.status='unsupported-type';return [];}
      if (id == null || String(id).trim()==='' || (type==='tv' && (!Number.isInteger(season) || season<0 || !Number.isInteger(episode) || episode<1))) {record.status='invalid-input';return [];}
      var callOpts = abortCtrl ? { signal: abortCtrl.signal } : {};
      var result=await Promise.race([
        Promise.resolve().then(function(){return provider.getStreams(id,type,season,episode,callOpts);}),
        new Promise(function(_,reject){timer=setTimeout(function(){
          timedOut=true;
          if (abortCtrl) {
            try { abortCtrl.abort(new Error('TIMEOUT')); } catch (_) {}
          }
          reject(new Error('TIMEOUT'));
        },limit);})
      ]);
      var normalized=normalizeStreams(result);
      record.count=normalized.streams.length;record.rejected=normalized.invalid;
      record.status=record.count?'sources-found':normalized.invalid?'invalid-results':'empty';
      return normalized.streams;
    } catch (err) {
      if (abortCtrl && !abortCtrl.signal.aborted) {
        try { abortCtrl.abort(); } catch (_) {}
      }
      if (timedOut || (err && (err.name === 'AbortError' || err.message === 'TIMEOUT'))) {
        record.status = 'timeout';
      } else if (err && err.name === 'ProviderError') {
        if (err.code === 'HTTP_BLOCKED') record.status = 'http-blocked';
        else if (err.code === 'NO_MATCH') record.status = 'no-match';
        else if (err.code === 'PARSE_ERROR') record.status = 'parse-error';
        else if (err.code === 'TMDB_ERROR') record.status = 'tmdb-error';
        else record.status = 'error';
        if (err.stage) record.stage = err.stage;
        if (err.code) record.reason = String(err.code).toLowerCase();
      } else {
        record.status = 'error';
      }
      return [];
    }
    finally {if(timer!==undefined)clearTimeout(timer);report();}
  }};
}

module.exports={adapt:adapt,normalizeStreams:normalizeStreams};
