// Spell check: the source files, plus every prompt, note, label and alias in the built data.
// Words that are right but unusual (place names, alternate spellings) go in .codespell-ignore.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const lines = [];
for (const p of data.prompts) {
  lines.push(`[${p.id}] ${p.text}`, `[${p.id}] ${p.note}`);
  // Curated text only. Wikidata aliases include common misspellings on purpose, so players are accepted.
  for (const a of p.answers) {
    const src = (a.src || '').split(' ');
    lines.push(`[${p.id}] ${[a.label, ...a.aliases.filter((_, i) => !/^[wag]/.test(src[i] || ''))].join(' | ')}`);
  }
}
const dir = mkdtempSync(join(tmpdir(), 'summit-spell-'));
const file = join(dir, 'labels.txt');
writeFileSync(file, lines.join('\n'));

const run = (args) => spawnSync('codespell', args, { encoding: 'utf8' });
const src = run([]);
const labels = run(['--ignore-words', '.codespell-ignore', file]);
const out = (src.stdout + labels.stdout).trim();
if (out) {
  // Show the prompt each data hit belongs to rather than a temp line number.
  console.log(out.replace(new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':(\\d+):', 'g'), (_, n) => lines[n - 1].match(/^\[[^\]]+\]/)[0] + ' '));
  process.exit(1);
}
console.log(`Spelling clean: source files and ${lines.length.toLocaleString('en-GB')} data lines.`);
