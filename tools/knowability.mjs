// Prints the knowability audit: every prompt, its size, how many answers are widely known,
// and whether it passes (60+ answers, 40+ widely known). Run after a build:
// node tools/knowability.mjs
import { readFileSync } from 'node:fs';

const report = JSON.parse(readFileSync(new URL('../data/qa-report.json', import.meta.url), 'utf8'));
const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const byId = new Map(data.prompts.map((p) => [p.id, p]));
console.log('| Topic | Prompt | Rules line | Answers | Widely known | Pass |');
console.log('|---|---|---|---|---|---|');
const rows = report.prompts.slice().sort((a, b) => Object.keys(data.categories).indexOf(a.topic) - Object.keys(data.categories).indexOf(b.topic));
for (const r of rows) {
  const p = byId.get(r.id);
  const pass = r.size >= 60 && r.known >= 40;
  console.log(`| ${data.categories[r.topic]} | ${r.text} | ${p.note || ''} | ${r.size} | ${r.known} | ${pass ? 'yes' : 'NO'} |`);
}
