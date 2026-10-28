// Continent (P30, or through the country P17) and birth year (P569) for the chosen items of
// prompts that are grouped by them. Writes data/raw/wd-extra.json. Run after a build.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { PROMPTS } from './registry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const picked = JSON.parse(readFileSync(join(ROOT, 'data/raw/wd-picked.json'), 'utf8'));
const CONTINENTS = { Q15: 'Africa', Q48: 'Asia', Q46: 'Europe', Q49: 'North America', Q18: 'South America', Q538: 'Oceania', Q55643: 'Oceania', Q3960: 'Oceania', Q51: 'Antarctica' };
const qids = new Set();
for (const def of PROMPTS) if (['continent', 'born'].includes(def.groupBy)) for (const v of Object.values(picked[def.id] || {})) qids.add(v.q);
const list = [...qids];
console.log(list.length, 'items');
const out = {};
const tmp = mkdtempSync(join(tmpdir(), 'summit-wdx-'));
for (let i = 0; i < list.length; i += 300) {
  const values = list.slice(i, i + 300).map((q) => 'wd:' + q).join(' ');
  const q = `SELECT ?item (GROUP_CONCAT(DISTINCT STRAFTER(STR(?ct), "entity/"); separator=" ") AS ?cts) (MIN(?b) AS ?born) WHERE {
    VALUES ?item { ${values} }
    OPTIONAL { ?item wdt:P30 ?ct1 } OPTIONAL { ?item wdt:P17/wdt:P30 ?ct2 }
    BIND(COALESCE(?ct1, ?ct2) AS ?ct)
    OPTIONAL { ?item wdt:P569 ?b }
  } GROUP BY ?item`;
  const file = join(tmp, 'q.rq');
  writeFileSync(file, q);
  const r = spawnSync('curl', ['-sS', '-X', 'POST', 'https://query.wikidata.org/sparql', '--data-urlencode', `query@${file}`, '-H', 'Accept: application/sparql-results+json', '-H', 'User-Agent: SummitGameBuild/0.2', '--max-time', '120'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  for (const b of JSON.parse(r.stdout).results.bindings) {
    const ct = (b.cts?.value || '').split(' ').map((c) => CONTINENTS[c]).filter(Boolean);
    out[b.item.value.split('/').pop()] = {
      continent: ct[0] || null,
      born: b.born && /^-?\d{4}/.test(b.born.value) ? Number(b.born.value.slice(0, b.born.value.startsWith('-') ? 5 : 4)) : null,
    };
  }
  spawnSync('sleep', ['1']);
}
writeFileSync(join(ROOT, 'data/raw/wd-extra.json'), JSON.stringify(out));
console.log('wrote', Object.keys(out).length);
