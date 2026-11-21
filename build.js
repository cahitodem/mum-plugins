// MUM modification 2026-11-21. GPL-3.0-only; see LICENSE and NOTICE.md.
const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./sources.json');
async function main() {
  if (process.argv.length > 2) throw new Error('Build the complete sources.json set.');
  const entries = [];
  for (const source of config.sources) {
    if (!/^[a-z0-9_]+$/.test(source.key) || source.id !== 'mum_' + source.key) throw new Error('Invalid provider configuration');
    if (!source.supportedTypes.length || source.supportedTypes.some(t => !['movie','tv'].includes(t))) throw new Error('Out-of-scope type');
    const input = `src/${source.key}/index.js`;
    if (!fs.existsSync(input)) throw new Error('Missing provider');
    await esbuild.build({
      stdin: {contents: `const provider = require('./${input}'); const {adapt} = require('./src/shared/adapter'); module.exports = adapt(provider, ${JSON.stringify(source)}, function(record) { globalThis.console.info('[MUM] ' + JSON.stringify(record)); });`, resolveDir: __dirname, sourcefile: 'mum-entry.js'},
      bundle: true, outfile: `providers/${source.id}.js`, platform: 'neutral', format: 'cjs', target: 'es2016',
      external: ['cheerio-without-node-native','cheerio','react-native-cheerio','crypto-js'],
      banner: {js: `/* MUM Plugins ${config.version}; modified 2026-11-21; derived from Anthology ${config.upstreamVersion}. GPL-3.0-only. */\n// Suppress provider logs which may contain signed URLs.\nvar console = {log:function(){},info:function(){},warn:function(){},error:function(){},debug:function(){}};`},
      footer: {js: 'globalThis.getStreams = module.exports.getStreams;'}, logLevel:'warning'
    });
    entries.push({id:source.id,name:source.name,version:config.version,author:'Anthology contributors; MUM contributors',filename:`providers/${source.id}.js`,supportedTypes:source.supportedTypes,enabled:source.enabled});
  }
  const expected = new Set(entries.map(e=>path.basename(e.filename)));
  for(const file of fs.readdirSync('providers')) if(!expected.has(file)) throw new Error('Unexpected build artifact');
  fs.writeFileSync('manifest.json',JSON.stringify({name:config.name,version:config.version,author:'Anthology contributors; MUM contributors',description:'Film ve dizi sağlayıcıları. Kaynak bulunması oynatma doğrulaması değildir.',scrapers:entries},null,2)+'\n');
  console.log(`Built ${entries.length} providers and manifest.json`);
}
main().catch(() => { console.error('MUM build failed. Check configuration and build diagnostics.'); process.exitCode=1; });
