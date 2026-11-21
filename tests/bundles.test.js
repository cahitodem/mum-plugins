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
test('DiziYou current .love selectors follow the actual show episode and player iframe',async()=>{
 const requests=[];
 const scraper=manifest.scrapers.find(s=>s.id==='mum_diziyou');
 const {provider,reports}=load(scraper,async url=>{
  requests.push(url);
  if(url.includes('api.themoviedb.org'))return {ok:true,json:async()=>({name:'Fixture Show',original_name:'Fixture Show'})};
  if(url.includes('?s='))return {ok:true,text:async()=>'<main id="content"><div class="cat-img"><a href="https://www.diziyou.love/fixture-show2/"><img alt="Fixture Show"><span id="dizi-ismi">Fixture Show</span></a></div></main>'};
  if(url==='https://www.diziyou.love/fixture-show2/')return {ok:true,text:async()=>'<main id="content"><a href="https://www.diziyou.love/fixture-show-1-sezon-2-bolum/">1. Sezon 2. Bölüm</a><a href="/fixture-show-10-sezon-2-bolum/">wrong season</a></main>'};
  if(url==='https://www.diziyou.love/fixture-show-1-sezon-2-bolum/')return {ok:true,text:async()=>'<iframe id="diziyouPlayer" src="https://www.diziyou.love/player/987.html"></iframe>'};
  if(url==='https://www.diziyou.love/player/987.html')return {ok:true,text:async()=>'<video><source id="diziyouSource" src="https://storage.diziyou.love/episodes/987/play.m3u8"></video><script>DYSubtitles.init(player,{trUrl:"https://storage.diziyou.love/subtitles/987/tr.vtt",enUrl:"https://storage.diziyou.love/subtitles/987/en.vtt"});</script>'};
  throw Error('Unexpected fixture request');
 });
 const result=await provider.getStreams('123','tv',1,2);
 assert.equal(result.length,1);assert.equal(result[0].url,'https://storage.diziyou.love/episodes/987/play.m3u8');assert.equal(result[0].subtitles.length,2);assert.ok(result[0].headers.Referer.includes('/player/987.html'));assert.equal(requests.length,5);assert.match(reports.at(-1),/sources-found/);
});
test('FilmModu resolves TV metadata, exact season episode, and page-selected player host',async()=>{
 const requests=[];
 const scraper=manifest.scrapers.find(s=>s.id==='mum_filmmodu');
 const {provider,reports}=load(scraper,async(url,options={})=>{
  requests.push(String(url));
  if(String(url).includes('/3/tv/1399?'))return {ok:true,json:async()=>({name:'Game of Thrones',original_name:'Game of Thrones',first_air_date:'2011-04-17'})};
  if(String(url).includes('yabancidizifilmizle.click/ara?q='))return {ok:true,text:async()=>'<main><section><h2 class="section-title">Diziler</h2><a href="/dizi/game-of-thrones"><img alt="Game of Thrones"></a></section></main>'};
  if(String(url)==='https://yabancidizifilmizle.click/dizi/game-of-thrones?sezon=5')return {ok:true,text:async()=>'<a href="/dizi/game-of-thrones/sezon-5/bolum-1">5. Sezon 1. Bölüm</a><a href="/dizi/game-of-thrones/sezon-5/bolum-6">5. Sezon 6. Bölüm</a>'};
  if(String(url)==='https://yabancidizifilmizle.click/dizi/game-of-thrones/sezon-5/bolum-6')return {ok:true,text:async()=>'<div data-pv="fixture-marker"></div><script src="https://play2.pilavyerplay.top/assets/js/core.js"></script>'};
  if(String(url).startsWith('https://play2.pilavyerplay.top/assets/js/s.php?s='))return {ok:true,text:async()=>'<script>window.__PLAYER__ = {"stream":"https://play2.pilavyerplay.top/api/stream.php?sig=fixture","audios":[{"label":"Türkçe"}],"subs":[]};</script>'};
  throw Error('Unexpected fixture request');
 });
 const result=await provider.getStreams('1399','tv',5,6);
 assert.equal(result.length,1);assert.match(result[0].url,/play2\.pilavyerplay\.top\/api\/stream\.php/);assert.equal(result[0].title,'Türkçe • 1080p FHD');assert.ok(result[0].headers.Referer.includes('/assets/js/s.php?'));assert.equal(requests.length,5);assert.match(reports.at(-1),/sources-found/);
});
