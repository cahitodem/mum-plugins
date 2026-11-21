// One provider per process. Output excludes URLs, headers, IDs and raw errors.
const sources = require('../sources.json').sources;
const [key,id,type,season,episode] = process.argv.slice(2);
const source = sources.find(s=>s.key===key);
if (!source || !id || !['movie','tv'].includes(type)) {
  console.error('Usage: npm run test:provider -- <provider-key> <tmdb-id> <movie|tv> [season] [episode]');
  process.exit(2);
}
const watchdog=setTimeout(()=>{console.info(JSON.stringify({provider:source.id,status:'process-timeout',playback:'unverified'}));process.exit(1);},55000);
try {
  const provider = require('../providers/'+source.id+'.js');
  provider.getStreams(id,type,season===undefined?undefined:Number(season),episode===undefined?undefined:Number(episode)).then(()=>{clearTimeout(watchdog);process.exit(0);},()=>{process.exit(1);});
} catch (_) {console.info(JSON.stringify({provider:source.id,status:'load-error',playback:'unverified'}));process.exit(1);}
