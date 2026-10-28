// Builds data/prompts.json, data/qa-report.json and data/schedule.json.
// Run: node build/build.mjs   (use build/fetch-wikidata.sh first to refresh data/raw)
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
import { variants, shortenings, initialism, goodWikidataAlias, acceptAliases, expand } from './aliases.mjs';
import { matchWikidata } from './wikidata-match.mjs';
import { groupAnswers } from './groups.mjs';
import { NOUNS } from './nouns.mjs';

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
      for (const b of raw('elements')) rows.set(Number(b.number.value), { name: label(b), symbol: b.symbol.value, z: Number(b.number.value) });
      const list = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
      const cap = (s) => s[0].toUpperCase() + s.slice(1);
      if (kind === 'element_symbols') return list.map((r) => ({ label: r.symbol, aliases: [], hint: cap(r.name), z: r.z }));
      return list.filter((r) => kind === 'elements' || !NON_METALS.includes(r.symbol))
        .map((r) => ({ label: cap(r.name), aliases: ELEMENT_ALIASES[cap(r.name)] || [], z: r.z }));
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
const fallbackGroups = [];
const EXTRA = existsSync(join(ROOT, 'data/raw/wd-extra.json')) ? JSON.parse(readFileSync(join(ROOT, 'data/raw/wd-extra.json'), 'utf8')) : {};
const ALIASES = existsSync(join(ROOT, 'data/aliases.json')) ? JSON.parse(readFileSync(join(ROOT, 'data/aliases.json'), 'utf8')) : {};
const WD = existsSync(join(ROOT, 'data/raw/wd-labels.json')) ? JSON.parse(readFileSync(join(ROOT, 'data/raw/wd-labels.json'), 'utf8')) : null;
// The chosen item per answer, saved so builds work without the large lookup cache.
const PICKED_PATH = join(ROOT, 'data/raw/wd-picked.json');
const PICKED = !WD && existsSync(PICKED_PATH) ? JSON.parse(readFileSync(PICKED_PATH, 'utf8')) : {};
const picked = {};
// Short Wikidata aliases (3 letters or fewer) only where abbreviations are normal, never country codes.
const SHORT_OK = new Set(['tech', 'film', 'sport', 'music']);
// Titles that can be named by their first words when that is unambiguous.
const TITLE_PROMPTS = new Set(['film', 'tech', 'video-games', 'beatles-songs', 'musicals', 'paintings', 'roald-dahl', 'shakespeare', 'missions']);
const errors = [];
const report = [];
const out = [];

for (const def of PROMPTS) {
  const log = [];
  let answers;
  let source;
  if (def.list) { answers = parseList(def.list); source = 'Curated list'; }
  else if (def.union) {
    answers = def.union.flatMap((list, i) => parseList(list).map((a) => ({ ...a, from: def.unionNames[i] })));
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
    const entry = { label: a.label, aliases: [...a.aliases], hint: a.hint, z: a.z, from: a.from };
    byKey.set(k, entry);
    merged.push(entry);
  }

  // Aliases, in order: curated, curated variants, data/aliases.json, Wikidata, generated.
  for (const a of merged) {
    const seen = new Set([toKey(a.label)]);
    const list = [];
    const add = (text, src) => { const k = toKey(text); if (k && !seen.has(k)) { seen.add(k); list.push({ text, src }); } };
    for (const t of a.aliases) add(t, 'c');
    for (const t of [a.label, ...a.aliases]) for (const v of variants(t)) add(v, 'v');
    a.aliases = list;
  }
  const extra = [];
  const userAliases = { ...(ALIASES.global || {}), ...((ALIASES.prompts || {})[def.id] || {}) };
  merged.forEach((a, i) => { for (const t of userAliases[a.label] || []) extra.push({ answer: i, text: t, src: 'a' }); });
  const wd = WD ? matchWikidata(merged, WD, def.id) : merged.map((a) => (PICKED[def.id] || {})[a.label] || null);
  picked[def.id] = {};
  merged.forEach((a, i) => { if (wd[i]) picked[def.id][a.label] = { ...wd[i], c: undefined }; });
  const allowShort = SHORT_OK.has(def.category) || SHORT_OK.has(def.id);
  merged.forEach((a, i) => {
    const item = wd[i];
    if (item) {
      a.wd = item;
      for (const t of [...item.s, ...item.a]) if (goodWikidataAlias(t, a.label, allowShort)) extra.push({ answer: i, text: t, src: 'w' });
    }
    if (TITLE_PROMPTS.has(def.category) || TITLE_PROMPTS.has(def.id)) for (const t of shortenings(a.label)) extra.push({ answer: i, text: t, src: 'g' });
  });
  const accepted = acceptAliases(merged, expand(extra));
  // Initialisms are only suggested. They count when Wikidata or the curated list already has them.
  const suggestions = [];
  merged.forEach((a) => {
    const ini = initialism(a.label);
    if (!ini) return;
    for (const x of a.aliases) if (ini.includes(toKey(x.text)) && x.src !== 'c') x.src += 'g';
    if (!a.aliases.some((x) => ini.includes(toKey(x.text)))) suggestions.push(`${a.label}: ${ini[ini.length - 1].toUpperCase()}`);
  });
  const aliasCollisions = accepted.dropped.filter((d) => d.src !== 'g');
  const aliasSources = merged.map((a) => a.aliases.map((x) => x.src));
  // Board groups, using Wikidata dates and continents where the prompt groups by them.
  for (const a of merged) {
    const x = a.wd ? EXTRA[a.wd.q] : null;
    a.year = a.wd ? a.wd.y : null;
    a.continent = x ? x.continent : null;
    a.born = x ? x.born : null;
  }
  const grouping = groupAnswers(def, merged, (name) => countries.find((c) => c.label === name));
  if (grouping.fallback) fallbackGroups.push(def.id);
  for (const a of merged) a.aliases = a.aliases.map((x) => x.text);

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
    groupBy: grouping.by,
    groups: grouping.groups,
    answers: merged.map((a, i) => ({
      id: i, label: a.label, aliases: a.aliases, src: aliasSources[i].join(' '), group: grouping.list[i],
      ...(a.hint ? { hint: a.hint } : {}),
      ...(a.wd ? { qid: a.wd.q, fame: a.wd.sl, year: a.wd.y ?? undefined } : {}),
      desc: (a.wd && a.wd.d) || (a.hint && def.wikidata === 'element_symbols' ? `Symbol for ${a.hint.toLowerCase()}` : NOUNS[def.id]),
      ...(a.wd && a.wd.d ? {} : { descGeneric: true }),
    })),
  };
  out.push(prompt);
  report.push({ id: def.id, groupBy: grouping.by, groupFallback: grouping.fallback, descriptions: merged.filter((a) => a.wd && a.wd.d).length, aliasCollisions, suggestions: suggestions.slice(0, 80), wikidataMatched: wd.filter(Boolean).length, collisions, near: near.slice(0, 60), nearCount: near.length, suspicious, log, sourceCheck: notes[def.id] || null });
}

// Category rules: at least 12 categories with 10 prompts each.
const perCat = {};
for (const p of out) perCat[p.category] = (perCat[p.category] || 0) + 1;
for (const [c, n] of Object.entries(perCat)) if (n < 10) errors.push(`category ${c} has only ${n} prompts (minimum 10)`);
const ids = new Set();
for (const p of out) { if (ids.has(p.id)) errors.push(`duplicate prompt id ${p.id}`); ids.add(p.id); if (!NOUNS[p.id]) errors.push(`${p.id}: no fallback description in build/nouns.mjs`); }

// The game must not learn a prompt before its timer starts, so each prompt is filed under an opaque key.
const keyOf = (id) => createHash('sha256').update('summit-prompt:' + id).digest('hex').slice(0, 12);
for (const p of out) p.key = keyOf(p.id);
console.log(`A to Z fallback groups: ${fallbackGroups.length} prompts`);
if (WD) writeFileSync(PICKED_PATH, JSON.stringify(picked));
writeFileSync(join(ROOT, 'data/prompts.json'), JSON.stringify({ version: 1, built: new Date().toISOString().slice(0, 10), categories: CATEGORIES, prompts: out }));
// The game must not learn a prompt before its timer starts. Each prompt file gets an opaque key,
// and the index the game loads holds only keys, a hidden topic number, difficulty and target.
const TOPICS = Object.keys(CATEGORIES);
rmSync(join(ROOT, 'data/p'), { recursive: true, force: true });
mkdirSync(join(ROOT, 'data/p'));
for (const p of out) writeFileSync(join(ROOT, 'data/p', p.key + '.json'), JSON.stringify(p));
const index = out.map((p) => ({ id: p.key, category: `t${TOPICS.indexOf(p.category)}`, difficulty: p.difficulty, target: p.target }));
writeFileSync(join(ROOT, 'data/index.json'), JSON.stringify({ prompts: index }));
writeFileSync(join(ROOT, 'data/qa-report.json'), JSON.stringify({ errors, prompts: report }, null, 1));

// Schedule: keep every day already published, append new days at the end.
const schedPath = join(ROOT, 'data/schedule.json');
const existing = existsSync(schedPath) ? JSON.parse(readFileSync(schedPath, 'utf8')) : null;
// Older schedules used readable ids; published days keep their prompts under the new keys.
const toKeyId = (x) => { const p = out.find((q) => q.id === x); return p ? p.key : x; };
if (existing) {
  for (const d of existing.days) d.prompts = d.prompts.map(toKeyId);
  existing.queue = existing.queue.map(toKeyId);
}
const schedule = buildSchedule(index, existing, 730);
writeFileSync(schedPath, JSON.stringify(schedule));

const total = out.reduce((s, p) => s + p.size, 0);
console.log(`${out.length} prompts, ${Object.keys(perCat).length} categories, ${total} answers, ${schedule.days.length} scheduled days`);
for (const [c, n] of Object.entries(perCat)) process.stdout.write(`${c}:${n} `);
console.log();
if (errors.length) { console.log('\nErrors:\n' + errors.join('\n')); process.exitCode = 1; }
