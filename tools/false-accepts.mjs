// How often a real answer from another prompt is fuzzily accepted as something it is not.
// The price of lenient spelling, measured on 40 foreign answers per prompt.
// Run after a build: node tools/false-accepts.mjs
import { readFileSync } from 'node:fs';
import { buildIndex, match, toKey } from '../js/matcher.js';

const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));
let seed = 3;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
let n = 0;
const hits = [];
for (const p of data.prompts) {
  const index = buildIndex(p.answers, { people: p.people });
  const own = new Set(p.answers.flatMap((a) => [a.label, ...a.aliases].map(toKey)));
  for (let k = 0; k < 40; k++) {
    const q = data.prompts[Math.floor(rand() * data.prompts.length)];
    if (q.id === p.id) continue;
    const a = q.answers[Math.floor(rand() * q.answers.length)];
    if (own.has(toKey(a.label))) continue;
    n++;
    const r = match(index, a.label);
    if (r.result === 'correct' && r.corrected) hits.push(`${p.id}: "${a.label}" -> ${p.answers[r.index].label}`);
  }
}
console.log(`${n} foreign answers typed, ${hits.length} accepted as a typo (${((100 * hits.length) / n).toFixed(2)}%)`);
console.log(hits.slice(0, 40).join('\n'));
