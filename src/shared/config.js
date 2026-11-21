// MUM modification 2026-11-21: use the reviewed, bundled configuration.
// No runtime dependency on upstream config or Node filesystem APIs.
var config = require('../../config.json');
function loadConfig() { return Promise.resolve(config); }
function val(key) { return key.split('.').reduce(function(v,k) { return v == null ? undefined : v[k]; }, config); }
function wrapAll(obj, ready) {
 var out = {};
 Object.keys(obj).forEach(function(k) {
  out[k] = typeof obj[k] === 'function' ? function() {
   var args = arguments, self = this;
   return Promise.resolve().then(function() { return ready ? ready() : null; }).then(function() { return obj[k].apply(self,args); });
  } : obj[k];
 });
 return out;
}
module.exports = {loadConfig:loadConfig,val:val,wrapAll:wrapAll};
