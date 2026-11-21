const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const manifest=require('../manifest.json');
const sources=require('../sources.json').sources;
function load(scraper,fetch) {
 const reports=[];
 const context=vm.createContext({module:{exports:{}},console:{info:r=>reports.push(r)},fetch:fetch||(()=>{throw Error('Unexpected network');}),setTimeout,clearTimeout,URL,URLSearchParams,AbortController,AbortSignal,atob,btoa,TextEncoder,TextDecoder,require:name=>{
  if(['cheerio','cheerio-without-node-native','react-native-cheerio'].includes(name))return require('cheerio-without-node-native');
  throw Error('Unavailable runtime module');
 }});
 const code=fs.readFileSync(scraper.filename,'utf8');
 vm.runInContext('(function(){'+code+'\n})();',context,{timeout:2000});
 return {context,reports,provider:context.module.exports};
}
test('manifest exactly matches film/series allowlist and generated artifacts',()=>{
 assert.equal(manifest.name,'MUM Plugins');assert.equal(manifest.scrapers.length,11);
 assert.deepEqual(manifest.scrapers.map(s=>s.id),sources.map(s=>s.id));
 assert.equal(new Set(manifest.scrapers.map(s=>s.id)).size,11);
 assert.deepEqual(fs.readdirSync('providers').sort(),manifest.scrapers.map(s=>s.filename.split('/').pop()).sort());
 for(const s of manifest.scrapers){assert.ok(s.supportedTypes.every(t=>['movie','tv'].includes(t)));assert.ok(fs.existsSync(s.filename));}
 for(const dir of fs.readdirSync('src'))assert.ok(dir==='shared'||sources.some(s=>s.key===dir));
});
for(const scraper of manifest.scrapers)test(scraper.id+' loads without Node globals and rejects anime',async()=>{
 const {provider,context,reports}=load(scraper);
 assert.equal(typeof provider.getStreams,'function');assert.equal(provider.getStreams,context.getStreams);
 assert.equal((await provider.getStreams('1','anime')).length,0);assert.match(reports.at(-1),/unsupported-type/);
});
test('DiziYou fixture resolves title, episode, HLS and Referer without real network',async()=>{
 const requests=[];
 const scraper=manifest.scrapers.find(s=>s.id==='mum_diziyou');
 const {provider,reports}=load(scraper,async url=>{
  requests.push(url);
  if(url.includes('api.themoviedb.org'))return {ok:true,json:async()=>({name:'Fixture Show',original_name:'Fixture Show'})};
  if(url.includes('?s='))return {ok:true,text:async()=>'<div id="list-series"><a href="https://www.diziyou.one/fixture-show/">Fixture Show</a></div>'};
  if(url.includes('fixture-show-1-sezon-2-bolum'))return {ok:true,text:async()=>'<iframe id="diziyouPlayer" src="https://example.invalid/987.html"></iframe>turkceAltyazili'};
  throw Error('Unexpected fixture request');
 });
 const result=await provider.getStreams('123','tv',1,2);
 assert.equal(result.length,1);assert.match(result[0].url,/episodes\/987\/play.m3u8$/);assert.ok(result[0].headers.Referer);assert.equal(requests.length,3);assert.match(reports.at(-1),/sources-found/);
});
