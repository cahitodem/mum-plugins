const {test}=require('node:test');
const assert=require('node:assert/strict');
const {adapt,normalizeStreams}=require('../src/shared/adapter');
const source={id:'mum_fixture',supportedTypes:['movie','tv']};
async function run(fn,args=['123','movie'],options){const reports=[];const out=await adapt({getStreams:fn},source,r=>reports.push(r),options).getStreams(...args);return {out,reports,last:reports.at(-1)};}
test('positional contract normalizes series, keeps season zero',async()=>{
 let args;await run((...a)=>{args=a;return [];},['123','series',0,1]);assert.deepEqual(args,['123','tv',0,1]);
});
test('sources are not playback proof; signed URLs and headers never enter reports',async()=>{
 const url='https://example.invalid/video?token=SECRET';
 const {out,reports,last}=await run(()=>[{url,headers:{Authorization:'Bearer SECRET'}}]);
 assert.equal(out[0].url,url);assert.equal(last.status,'sources-found');assert.equal(last.playback,'unverified');assert.doesNotMatch(JSON.stringify(reports),/SECRET|Authorization|example/);
});
test('empty, invalid schema and exception remain separate',async()=>{
 assert.equal((await run(()=>[])).last.status,'empty');
 assert.equal((await run(()=>({streams:[]}))).last.status,'error');
 const result=await run(()=>{throw Error('https://example.invalid/SECRET');});assert.equal(result.last.status,'error');assert.doesNotMatch(JSON.stringify(result.reports),/SECRET/);
});
test('unsupported types never invoke provider',async()=>{
 for(const type of ['anime','live','music'])assert.equal((await run(()=>{assert.fail('called');},['1',type])).last.status,'unsupported-type');
});
test('missing episode is invalid input',async()=>{assert.equal((await run(()=>{assert.fail('called');},['1','tv'])).last.status,'invalid-input');});
test('about:error and unsafe schemes never reach player',async()=>{
 const r=await run(()=>[{url:'about:error'},{url:'javascript:alert(1)'},{url:'file:///test'}]);assert.equal(r.last.status,'invalid-results');assert.equal(r.last.rejected,3);assert.equal(r.out.length,0);
});
test('timeout completes with safe report',async()=>{const r=await run(()=>new Promise(()=>{}),undefined,{timeoutMs:10});assert.equal(r.last.status,'timeout');});
test('dedup retains different header requirements and merges proxy hints',()=>{
 const raw={url:{url:'https://example.invalid/a'},behaviorHints:{proxyHeaders:{request:{Referer:'https://example.invalid/'}}},subtitles:[{url:'https://example.invalid/s.vtt',language:'tr'}]};
 const r=normalizeStreams([raw,raw,{...raw,headers:{Referer:'https://other.invalid/'}}]);assert.equal(r.streams.length,2);assert.equal(r.streams[0].headers.Referer,'https://example.invalid/');assert.equal(r.streams[0].subtitles[0].language,'tr');
});
test('report sink failure cannot break returned streams',async()=>{assert.equal((await adapt({getStreams:()=>[{url:'https://example.invalid/a'}]},source,()=>{throw Error();}).getStreams('1','movie')).length,1);});
