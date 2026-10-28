// Builds data/prompts.json, data/qa-report.json and data/schedule.json.
// Run: node build/build.mjs   (use build/fetch-wikidata.sh first to refresh data/raw)
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPTS, CATEGORIES } from './registry.mjs';
import { parseCountries } from './curated/countries.mjs';
import { ELEMENT_ALIASES, NON_METALS } from './curated/science.mjs';
import { CONSTELLATIONS, CONSTELLATION_ALIASES } from './curated/space.mjs';
import { PRESIDENT_ALIASES, PM_ALIASES } from './curated/history.mjs';
import { toKey, editDistance, allowedTypos } from '../js/matcher.js';
import { targetFor } from '../js/scoring.js';
import { buildSchedule } from '../js/daily.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = (name) => JSON.parse(readFileSync(join(ROOT, 'data/raw', name + '.json'), 'utf8')).results.bindings;
const label = (b) => b.itemLabel.value;
const isQid = (s) => /^Q\d+$/.test(s);

// ---------- parsing ----------

function parseList(text) {
  return text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((line) => {
    const [first, ...rest] = line.split('|').map((s) => s.trim()).filter(Boolean);
    return { label: first, aliases: rest };
  });
}

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15 };
const SPELLINGS = [['colour', 'color'], ['grey', 'gray'], ['centre', 'center'], ['theatre', 'theater'], ['harbour', 'harbor'], ['armour', 'armor']];

// Spelling variants people type without thinking: Henry 8, gray, color.
function autoAliases(text) {
  const out = new Set();
  const words = text.split(' ');
  const roman = (w, i) => (i > 0 && words[i - 1] !== 'Series' ? ROMAN[w.replace(/[,.:]$/, '')] : undefined);
  if (words.some(roman)) out.add(words.map((w, i) => (roman(w, i) ? String(roman(w, i)) : w)).join(' '));
  for (const [a, b] of SPELLINGS) {
    const lower = text.toLowerCase();
    if (lower.includes(a)) out.add(lower.replaceAll(a, b));
    if (lower.includes(b)) out.add(lower.replaceAll(b, a));
  }
  // "Title: Subtitle" films and games can be named by the subtitle alone.
  if (/: /.test(text)) out.add(text.split(': ').slice(1).join(': '));
  return [...out];
}

// ---------- sources ----------

const countries = parseCountries();
const notes = {}; // source notes per prompt

function fromCountries(filter) {
  return countries.filter(filter).map((c) => ({ label: c.label, aliases: c.aliases }));
}
function fromCapitals(filter) {
  return countries.filter(filter).flatMap((c) => c.capitals.map((cap) => ({ label: cap.label, aliases: cap.aliases, hint: c.label })));
}

// People lists are curated, then checked against Wikidata so gaps and extras get flagged.
function crossCheck(id, curated, wikidataLabels) {
  const keys = new Map();
  curated.forEach((a, i) => [a.label, ...a.aliases].forEach((s) => keys.set(toKey(s), i)));
  const matched = new Set();
  const extra = [];
  for (const w of wikidataLabels) {
    if (isQid(w)) { extra.push(w + ' (no English label)'); continue; }
    const cands = [w, w.split(',')[0]];
    const hit = cands.map(toKey).find((k) => keys.has(k));
    if (hit) matched.add(keys.get(hit)); else extra.push(w);
  }
  const missing = curated.filter((_, i) => !matched.has(i)).map((a) => a.label);
  notes[id] = { wikidataOnly: extra, curatedOnly: missing };
}

function wikidataAnswers(kind, id) {
  switch (kind) {
    case 'elements':
    case 'metals':
    case 'element_symbols': {
      const rows = new Map();
      for (const b of raw('elements')) rows.set(Number(b.number.value), { name: label(b), symbol: b.symbol.value });
      const list = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
      const cap = (s) => s[0].toUpperCase() + s.slice(1);
      if (kind === 'element_symbols') return list.map((r) => ({ label: r.symbol, aliases: [], hint: cap(r.name) }));
      return list.filter((r) => kind === 'elements' || !NON_METALS.includes(r.symbol))
        .map((r) => ({ label: cap(r.name), aliases: ELEMENT_ALIASES[cap(r.name)] || [] }));
    }
    case 'us_states':
      return raw('us_states').map((b) => ({ label: label(b), aliases: label(b) === 'Washington' ? ['Washington State'] : [] }));
    case 'constellations': {
      const curated = CONSTELLATIONS.map((c) => ({ label: c, aliases: CONSTELLATION_ALIASES[c] || [] }));
      crossCheck(id, curated, raw('constellations').map(label));
      return curated;
    }
    case 'best_picture':
      return raw('best_picture').map((b) => {
        const l = label(b);
        return { label: l, aliases: l === 'Kramer vs. Kramer' ? ['Kramer versus Kramer'] : [] };
      });
    case 'us_presidents': {
      const curated = Object.entries(PRESIDENT_ALIASES).map(([l, a]) => ({ label: l, aliases: a }));
      crossCheck(id, curated, raw('us_presidents').map(label));
      return curated;
    }
    case 'uk_prime_ministers': {
      const curated = Object.entries(PM_ALIASES).map(([l, a]) => ({ label: l.split(', ')[0], aliases: [l, ...a].filter((x) => x !== l.split(', ')[0]) }));
      crossCheck(id, curated, raw('uk_prime_ministers').map(label));
      return curated;
    }
    default:
      throw new Error('Unknown Wikidata source ' + kind);
  }
}

// ---------- overrides ----------

const overridesPath = join(ROOT, 'data/overrides.json');
const overrides = existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, 'utf8')) : {};

function applyOverrides(id, answers, log) {
  const o = overrides[id];
  if (!o) return answers;
  let out = answers;
  for (const name of o.remove || []) {
    const k = toKey(name);
    const before = out.length;
    out = out.filter((a) => toKey(a.label) !== k);
    log.push(before === out.length ? `override remove: "${name}" not found` : `override removed "${name}"`);
  }
  for (const line of o.add || []) {
    const [first] = parseList(line);
    out.push(first);
    log.push(`override added "${first.label}"`);
  }
  for (const [name, aliases] of Object.entries(o.alias || {})) {
    const a = out.find((x) => toKey(x.label) === toKey(name));
    if (a) { a.aliases.push(...aliases); log.push(`override aliases for "${name}"`); } else log.push(`override alias: "${name}" not found`);
  }
  return out;
}

// ---------- build ----------

const slug = (s) => toKey(s).slice(0, 40) || 'x';
const errors = [];
const report = [];
const out = [];

for (const def of PROMPTS) {
  const log = [];
  let answers;
  let source;
  if (def.list) { answers = parseList(def.list); source = 'Curated list'; }
  else if (def.union) {
    answers = def.union.flatMap(parseList);
    source = 'Curated: union of the mammal, bird, reptile, fish, insect and sea creature lists';
  } else if (def.countries) { answers = fromCountries(def.countries); source = 'Curated country table (build/curated/countries.mjs)'; }
  else if (def.capitals) { answers = fromCapitals(def.capitals); source = 'Curated country table, capitals column'; }
  else { answers = wikidataAnswers(def.wikidata, def.id); source = `Wikidata (data/raw/${def.wikidata === 'metals' || def.wikidata === 'element_symbols' ? 'elements' : def.wikidata}.json)`; }

  answers = applyOverrides(def.id, answers.map((a) => ({ ...a, aliases: [...a.aliases] })), log);

  // Merge entries with the same label (the union list repeats animals on purpose).
  const byKey = new Map();
  const merged = [];
  for (const a of answers) {
    if (!a.label) { errors.push(`${def.id}: an answer has no label`); continue; }
    const k = toKey(a.label);
    if (byKey.has(k)) {
      const prev = byKey.get(k);
      prev.aliases.push(...a.aliases);
      if (!def.union) log.push(`duplicate merged: "${a.label}"`);
      continue;
    }
    const entry = { label: a.label, aliases: [...a.aliases], hint: a.hint };
    byKey.set(k, entry);
    merged.push(entry);
  }

  // Tidy aliases: add automatic variants, drop repeats of the label.
  for (const a of merged) {
    const base = [a.label, ...a.aliases];
    const all = [...base, ...base.flatMap(autoAliases)];
    const seen = new Set([toKey(a.label)]);
    a.aliases = all.slice(1).filter((s) => { const k = toKey(s); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  }

  // Collisions: one alias that belongs to two answers.
  const owners = new Map();
  merged.forEach((a, i) => [a.label, ...a.aliases].forEach((s) => {
    const k = toKey(s);
    if (!owners.has(k)) owners.set(k, new Set());
    owners.get(k).add(i);
  }));
  const collisions = [];
  for (const [k, set] of owners) if (set.size > 1) collisions.push({ alias: k, answers: [...set].map((i) => merged[i].label) });

  // Near misses: two different answers a single typo apart, so typo tolerance stands aside.
  const near = [];
  const flat = [];
  merged.forEach((a, i) => [a.label, ...a.aliases].forEach((s) => flat.push({ k: toKey(s), i })));
  for (let x = 0; x < flat.length; x++) {
    for (let y = x + 1; y < flat.length; y++) {
      const p = flat[x]; const q = flat[y];
      if (p.i === q.i) continue;
      const limit = allowedTypos(Math.min(p.k.length, q.k.length));
      if (limit === 0) continue;
      if (editDistance(p.k, q.k, limit) <= limit) near.push(`${merged[p.i].label} / ${merged[q.i].label}`);
    }
  }

  // Suspicious entries for a human to look at.
  const suspicious = [];
  for (const a of merged) {
    if (/[()\[\]]/.test(a.label)) suspicious.push(`${a.label}: has brackets`);
    if (a.label.length > 45) suspicious.push(`${a.label}: very long`);
    if (!toKey(a.label)) suspicious.push(`${a.label}: nothing left after normalising`);
    if (toKey(a.label).length <= 2 && def.wikidata !== 'element_symbols' && def.id !== 'file-extensions') suspicious.push(`${a.label}: very short`);
    if (def.id === 'palindromes') { const k = toKey(a.label); if (k !== [...k].reverse().join('')) suspicious.push(`${a.label}: not a palindrome`); }
  }

  // Validation rules.
  if (def.finite && merged.length < 20) errors.push(`${def.id}: finite set has only ${merged.length} answers (minimum 20)`);
  if (!def.finite && merged.length < 40) errors.push(`${def.id}: open set has only ${merged.length} answers (minimum 40)`);
  if (def.id === 'animals' && merged.length < 150) errors.push(`${def.id}: needs 150+ answers`);

  const prompt = {
    id: def.id,
    category: def.category,
    categoryName: CATEGORIES[def.category],
    text: def.text,
    note: def.note || '',
    difficulty: def.difficulty,
    finite: def.finite,
    size: merged.length,
    target: targetFor(merged.length, def.difficulty),
    source,
    answers: merged.map((a, i) => ({ id: i, label: a.label, aliases: a.aliases, ...(a.hint ? { hint: a.hint } : {}) })),
  };
  out.push(prompt);
  report.push({ id: def.id, collisions, near: near.slice(0, 60), nearCount: near.length, suspicious, log, sourceCheck: notes[def.id] || null });
}

// Category rules: at least 12 categories with 10 prompts each.
const perCat = {};
for (const p of out) perCat[p.category] = (perCat[p.category] || 0) + 1;
for (const [c, n] of Object.entries(perCat)) if (n < 10) errors.push(`category ${c} has only ${n} prompts (minimum 10)`);
const ids = new Set();
for (const p of out) { if (ids.has(p.id)) errors.push(`duplicate prompt id ${p.id}`); ids.add(p.id); }

writeFileSync(join(ROOT, 'data/prompts.json'), JSON.stringify({ version: 1, built: new Date().toISOString().slice(0, 10), categories: CATEGORIES, prompts: out }));
// The game loads a light index plus only the day's prompts.
rmSync(join(ROOT, 'data/p'), { recursive: true, force: true });
mkdirSync(join(ROOT, 'data/p'));
for (const p of out) writeFileSync(join(ROOT, 'data/p', p.id + '.json'), JSON.stringify(p));
const index = out.map(({ answers, source, ...meta }) => meta);
writeFileSync(join(ROOT, 'data/index.json'), JSON.stringify({ categories: CATEGORIES, prompts: index }));
writeFileSync(join(ROOT, 'data/qa-report.json'), JSON.stringify({ errors, prompts: report }, null, 1));

// Schedule: keep every day already published, append new days at the end.
const schedPath = join(ROOT, 'data/schedule.json');
const existing = existsSync(schedPath) ? JSON.parse(readFileSync(schedPath, 'utf8')) : null;
const schedule = buildSchedule(out, existing, 730);
writeFileSync(schedPath, JSON.stringify(schedule));

const total = out.reduce((s, p) => s + p.size, 0);
console.log(`${out.length} prompts, ${Object.keys(perCat).length} categories, ${total} answers, ${schedule.days.length} scheduled days`);
for (const [c, n] of Object.entries(perCat)) process.stdout.write(`${c}:${n} `);
console.log();
if (errors.length) { console.log('\nErrors:\n' + errors.join('\n')); process.exitCode = 1; }
