// Downloads the raw wikitext of the Wikipedia list pages that ranked prompts are built from,
// into data/raw/wiki/<title>.wiki. Follows #REDIRECT, retries politely when rate limited.
// Run: node build/fetch-wiki.mjs [title ...]   (no titles: every page in build/lists.mjs that is missing)
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { LISTS } from './lists.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'data/raw/wiki');
mkdirSync(DIR, { recursive: true });
const UA = 'SummitGameBuild/0.3 (https://github.com/willbrucee/summit; quiz data build)';
export const fileFor = (title) => join(DIR, title.replace(/[^A-Za-z0-9_-]/g, '_') + '.wiki');

function get(title) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = spawnSync('curl', ['-s', '-A', UA, '-w', '\n%{http_code}', `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`], { encoding: 'utf8', maxBuffer: 1 << 27 });
    const body = r.stdout.slice(0, r.stdout.lastIndexOf('\n'));
    const code = r.stdout.slice(r.stdout.lastIndexOf('\n') + 1);
    if (code === '200' && !body.startsWith('<!DOCTYPE')) return body;
    if (code === '404') return null;
    spawnSync('sleep', [String(4 * (attempt + 1))]);
  }
  return null;
}

const titles = process.argv.slice(2).length ? process.argv.slice(2)
  : [...new Set(Object.values(LISTS).flatMap((l) => l.pages || []))].filter((t) => !existsSync(fileFor(t)));
for (const t of titles) {
  let title = t;
  let text = get(title);
  for (let hop = 0; text && hop < 3; hop++) {
    const m = text.match(/^#REDIRECT\s*\[\[([^\]#|]+)/i);
    if (!m) break;
    title = m[1].trim();
    spawnSync('sleep', ['1.5']);
    text = get(title);
  }
  if (!text) { console.log(`FAILED ${t}`); continue; }
  writeFileSync(fileFor(t), text);
  console.log(`${String(text.length).padStart(7)} ${t}${title !== t ? ` -> ${title}` : ''}`);
  spawnSync('sleep', ['2']);
}
