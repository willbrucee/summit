// Looks up the Wikidata item behind every English Wikipedia title that build/lists.mjs uses
// as an answer: its id, sitelink count (how many Wikipedias and sister sites cover it),
// English description and first year (publication, founding or birth).
// Titles go to ids through Special:ItemByTitle, which follows redirects; the details then
// come from the query service in batches. Both are paced, because this host shares its
// address and Wikimedia rate limits it. Writes data/raw/wiki-items.json.
// Run: node build/fetch-wiki-items.mjs
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFile } from 'node:child_process';
import { LISTS } from './lists.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data/raw/wiki-items.json');
const UA = 'SummitGameBuild/0.3 (https://github.com/willbrucee/summit; quiz data build)';
const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const norm = (t) => { const s = t.replace(/_/g, ' ').trim(); return s[0].toUpperCase() + s.slice(1); };
const tmp = mkdtempSync(join(tmpdir(), 'wd-'));
const sleep = (s) => spawnSync('sleep', [String(s)]);
const busy = (text) => /too many requests|Wikimedia Error/i.test((text || '').slice(0, 600));

// Only answers need fame; the outside-the-list pools only need their names.
const titles = new Set();
for (const l of Object.values(LISTS)) for (const a of l.answers()) if (a.title) titles.add(norm(a.title));

// 1. Title to item id, four requests at a time.
const todo = [...titles].filter((t) => !(t in cache));
console.log(`${titles.size} titles, ${todo.length} without an item yet`);
const run = (args) => new Promise((resolve) => execFile('curl', args, { encoding: 'utf8' }, (err, stdout) => resolve(stdout || '')));
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
// A title that is not on Wikidata answers with an error page (often 429 rather than 404),
// so a few refusals in a row count as "no item". Redirects are followed by hand: the item
// page itself is large and only its address is needed.
async function itemFor(t) {
  let url = `https://www.wikidata.org/wiki/Special:ItemByTitle/enwiki/${encodeURIComponent(t.replace(/ /g, '_'))}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const [code, next] = (await run(['-s', '-o', '/dev/null', '-w', '%{http_code} %{redirect_url}', '-A', UA, url])).split(' ');
    const q = (next || '').match(/\/wiki\/(Q\d+)$/);
    if (q) return { q: q[1], sl: null, d: null, y: null };
    if (code === '301' && next) { url = next; continue; }
    if (code === '404' || attempt >= 2) return null;
    await wait(3);
  }
  return null;
}
let n = 0;
const queue = [...todo];
await Promise.all([0, 1, 2, 3].map(async () => {
  while (queue.length) {
    const t = queue.shift();
    cache[t] = await itemFor(t);
    if (++n % 100 === 0) { writeFileSync(OUT, JSON.stringify(cache)); process.stdout.write('.'); }
    await wait(0.2);
  }
}));
writeFileSync(OUT, JSON.stringify(cache));
console.log();

// 2. Details for every item still missing them.
function sparql(query) {
  const f = join(tmp, 'q.rq');
  writeFileSync(f, query);
  for (let attempt = 0; attempt < 40; attempt++) {
    const r = spawnSync('curl', ['-sS', '--max-time', '90', '-X', 'POST', 'https://query.wikidata.org/sparql', '--data-urlencode', `query@${f}`, '-H', 'Accept: application/sparql-results+json', '-A', UA], { encoding: 'utf8', maxBuffer: 1 << 28 });
    try { return JSON.parse(r.stdout).results.bindings; } catch { sleep(busy(r.stdout) ? 45 : 10); }
  }
  throw new Error('The query service kept refusing; run again later.');
}
const ids = [...new Set(Object.values(cache).filter((v) => v && v.sl === null).map((v) => v.q))];
console.log(`${ids.length} items need details`);
for (let i = 0; i < ids.length; i += 150) {
  const batch = ids.slice(i, i + 150);
  const rows = sparql(`SELECT ?item ?sl ?d (MIN(?yy) AS ?y) WHERE {
    VALUES ?item { ${batch.map((q) => 'wd:' + q).join(' ')} }
    ?item wikibase:sitelinks ?sl.
    OPTIONAL { ?item schema:description ?d. FILTER(LANG(?d) = "en") }
    OPTIONAL { ?item wdt:P577|wdt:P571|wdt:P569 ?date. BIND(YEAR(?date) AS ?yy) }
  } GROUP BY ?item ?sl ?d`);
  const info = new Map(rows.map((b) => [b.item.value.split('/').pop(), { sl: Number(b.sl.value), d: b.d ? b.d.value : null, y: b.y ? Number(b.y.value) : null, yChecked: true }]));
  for (const v of Object.values(cache)) if (v && info.has(v.q)) Object.assign(v, info.get(v.q));
  writeFileSync(OUT, JSON.stringify(cache));
  process.stdout.write('+');
  sleep(10);
}
// Older entries looked up without years get them now.
const noYear = [...new Set(Object.values(cache).filter((v) => v && v.sl !== null && v.y === null && !v.yChecked).map((v) => v.q))];
for (let i = 0; i < noYear.length; i += 200) {
  const batch = noYear.slice(i, i + 200);
  const rows = sparql(`SELECT ?item (MIN(?yy) AS ?y) WHERE { VALUES ?item { ${batch.map((q) => 'wd:' + q).join(' ')} } ?item wdt:P577|wdt:P571|wdt:P569 ?date. BIND(YEAR(?date) AS ?yy) } GROUP BY ?item`);
  const y = new Map(rows.map((b) => [b.item.value.split('/').pop(), Number(b.y.value)]));
  for (const v of Object.values(cache)) if (v && batch.includes(v.q)) { v.y = y.get(v.q) ?? null; v.yChecked = true; }
  writeFileSync(OUT, JSON.stringify(cache));
  sleep(10);
}
const vals = [...titles].map((t) => cache[t]);
console.log(`\ndone: ${vals.filter((v) => v && v.sl !== null).length} of ${titles.size} titles have an item with details`);
