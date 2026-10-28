// Looks up every answer label on Wikidata and caches what comes back in data/raw/wd-labels.json:
// candidate items with their classes, English aliases, short names (P1813), description,
// sitelink count and a date. The build picks the right candidate per prompt offline.
// Run: node build/fetch-wikidata-labels.mjs   (resumable; only missing labels are fetched)
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'data/raw/wd-labels.json');
const BATCH = 100;

const data = JSON.parse(readFileSync(join(ROOT, 'data/prompts.json'), 'utf8'));
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};

const strings = new Set();
for (const p of data.prompts) {
  for (const a of p.answers) {
    for (const s of [a.label, ...a.aliases.slice(0, 2)]) {
      if (!s || s.length < 2 || s.length > 80 || /["\\]/.test(s)) continue;
      strings.add(s);
      const lower = s.charAt(0).toLowerCase() + s.slice(1);
      if (lower !== s) strings.add(lower);
    }
  }
}
const todo = [...strings].filter((s) => !(s in cache));
console.log(`${strings.size} label strings, ${todo.length} to fetch`);

const tmp = mkdtempSync(join(tmpdir(), 'summit-wd-'));
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

function query(batch) {
  const values = batch.map((s) => `"${esc(s)}"@en`).join(' ');
  const q = `SELECT ?label ?item ?sl ?desc
    (GROUP_CONCAT(DISTINCT STRAFTER(STR(?c), "entity/"); separator=" ") AS ?cls)
    (GROUP_CONCAT(DISTINCT ?alt; separator="|") AS ?alts)
    (GROUP_CONCAT(DISTINCT ?short; separator="|") AS ?shorts)
    (MIN(?d) AS ?date) WHERE {
    VALUES ?label { ${values} }
    ?item rdfs:label ?label; wikibase:sitelinks ?sl.
    OPTIONAL { ?item wdt:P31|wdt:P279 ?c }
    OPTIONAL { ?item schema:description ?desc FILTER(LANG(?desc) = "en") }
    OPTIONAL { ?item skos:altLabel ?alt FILTER(LANG(?alt) = "en") }
    OPTIONAL { ?item wdt:P1813 ?short FILTER(LANG(?short) = "en") }
    OPTIONAL { ?item wdt:P577|wdt:P571 ?d }
  } GROUP BY ?label ?item ?sl ?desc`;
  const file = join(tmp, 'q.rq');
  writeFileSync(file, q);
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = spawnSync('curl', ['-sS', '-X', 'POST', 'https://query.wikidata.org/sparql', '--data-urlencode', `query@${file}`,
      '-H', 'Accept: application/sparql-results+json', '-H', 'User-Agent: SummitGameBuild/0.2 (static quiz game data build)', '--max-time', '90'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    try {
      return JSON.parse(r.stdout).results.bindings;
    } catch {
      spawnSync('sleep', [String(5 * (attempt + 1))]);
    }
  }
  return null;
}

let done = 0;
for (let i = 0; i < todo.length; i += BATCH) {
  const batch = todo.slice(i, i + BATCH);
  const rows = query(batch);
  if (!rows) { console.log(`batch at ${i} failed, will retry next run`); continue; }
  for (const s of batch) cache[s] = [];
  for (const b of rows) {
    const s = b.label.value;
    (cache[s] = cache[s] || []).push({
      q: b.item.value.split('/').pop(),
      sl: Number(b.sl.value),
      d: b.desc ? b.desc.value : '',
      c: b.cls?.value ? b.cls.value.split(' ') : [],
      a: b.alts?.value ? b.alts.value.split('|') : [],
      s: b.shorts?.value ? b.shorts.value.split('|') : [],
      y: b.date && /^-?\d{4}/.test(b.date.value) ? Number(b.date.value.slice(0, b.date.value.startsWith('-') ? 5 : 4)) : null,
    });
  }
  done += batch.length;
  if ((i / BATCH) % 10 === 0) { writeFileSync(CACHE, JSON.stringify(cache)); console.log(`${done}/${todo.length}`); }
  spawnSync('sleep', ['1']);
}
writeFileSync(CACHE, JSON.stringify(cache));
console.log('done', Object.keys(cache).length);
