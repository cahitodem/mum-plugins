const { fetchWithTimeout } = require('./src/shared/http.js');

async function inspectManifests() {
  const masterUrl = 'https://fastplay.mom/manifests/YzsmPb03iMjx/master.txt?verify=1795284000-rL12IYusW89UEaMDgWbBrYnQ2gkXHcckQLZjiiNs3SI%3D';
  console.log('Fetching master manifest...');
  const t0 = Date.now();
  const res = await fetchWithTimeout(masterUrl, {
    headers: {
      'User-Agent': 'ExoPlayerLib/2.19.1',
      'Referer': 'https://fastplay.mom/'
    }
  }, 10000);
  const text = await res.text();
  console.log(`Master fetched in ${Date.now() - t0}ms, status: ${res.status}`);
  console.log(text);

  // Extract all URIs
  const uris = [...text.matchAll(/URI="([^"]+)"/g)].map(m => m[1]);
  const streamUri = text.split('\n').find(l => l.startsWith('http'));
  if (streamUri) uris.push(streamUri);

  console.log('\n--- Fetching Child Manifests ---');
  for (const u of uris) {
    const tStart = Date.now();
    try {
      const cRes = await fetchWithTimeout(u, {
        headers: {
          'User-Agent': 'ExoPlayerLib/2.19.1',
          'Referer': 'https://fastplay.mom/'
        }
      }, 10000);
      const cText = await cRes.text();
      console.log(`Child [${u.split('/').pop().split('?')[0]}]: ${cRes.status} in ${Date.now() - tStart}ms, length: ${cText.length}`);
      const firstLines = cText.split('\n').slice(0, 10).join('\n');
      console.log('First lines:\n' + firstLines + '\n');
    } catch (e) {
      console.log(`Child [${u}] Error: ${e.message} in ${Date.now() - tStart}ms`);
    }
  }
}
inspectManifests().catch(console.error);
