// Answer matching ("autotune"). Shared by the game, the QA page, the build and the tests.

const SPECIAL = { 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'ø': 'o', 'ł': 'l', 'đ': 'd', 'ð': 'd', 'þ': 'th', 'ı': 'i' };
const WORD_SUBS = { st: 'saint', mt: 'mount', ste: 'sainte' };

// Lower case, no accents, no punctuation, single spaces, no leading "the".
export function normalise(text) {
  let s = String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/[ßæœøłđðþı]/g, (c) => SPECIAL[c]);
  s = s.replace(/&/g, ' and ').replace(/\+/g, ' plus ').replace(/#/g, ' sharp ');
  s = s.replace(/['’‘`´]/g, '');
  s = s.replace(/[^a-z0-9]+/g, ' ').trim();
  let words = s.split(' ').filter(Boolean);
  if (words.length > 1 && words[0] === 'the') words = words.slice(1);
  words = words.map((w) => WORD_SUBS[w] || w);
  return words.join(' ');
}

// The comparison key: the normalised text with spaces removed, so "Fire fox" meets "Firefox".
export function toKey(text) {
  return normalise(text).replace(/ /g, '');
}

// Singular forms to try when the typed text is a plural and the answers are not.
export function singulars(key) {
  const out = [];
  if (key.length > 4 && key.endsWith('ies')) out.push(key.slice(0, -3) + 'y');
  if (key.length > 4 && key.endsWith('ves')) out.push(key.slice(0, -3) + 'f', key.slice(0, -3) + 'fe');
  if (key.length > 4 && key.endsWith('es')) out.push(key.slice(0, -2));
  if (key.length > 3 && key.endsWith('s') && !key.endsWith('ss')) out.push(key.slice(0, -1));
  return out;
}

// Damerau-Levenshtein (optimal string alignment) distance, giving up above max.
export function editDistance(a, b, max = Infinity) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = a.length;
  const m = b.length;
  let prev2 = null;
  let prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[m];
}

// Numbers are never typos: Apollo 18 is not Apollo 13.
function digitsOf(key) {
  return key.replace(/[^0-9]/g, '');
}

// How many typos a word of this length may carry.
export function allowedTypos(length) {
  if (length <= 4) return 0;
  if (length <= 7) return 1;
  return 2;
}

// Letter pairs of a key, used to find typo candidates without scanning every answer.
function bigrams(key) {
  const out = new Set();
  for (let i = 0; i < key.length - 1; i++) out.add(key.slice(i, i + 2));
  if (key.length === 1) out.add(key);
  return out;
}

// Build a lookup for one prompt, once, when the round's data arrives. answers: [{ id, label, aliases: [] }]
// exact: key -> answer indexes. longer: keys that a longer key starts with, so typing them
// waits a moment. grams: letter pair -> entry numbers, for typo candidates.
export function buildIndex(answers) {
  const exact = new Map();
  const entries = [];
  answers.forEach((answer, i) => {
    const keys = new Set([answer.label, ...(answer.aliases || [])].map(toKey).filter(Boolean));
    for (const key of keys) {
      if (!exact.has(key)) exact.set(key, []);
      const owners = exact.get(key);
      if (!owners.includes(i)) owners.push(i);
      entries.push({ key, i, digits: digitsOf(key) });
    }
  });
  // Sorted keys put every key just before the keys it is a prefix of.
  const sorted = [...exact.keys()].sort();
  const longer = new Set();
  for (let k = 0; k < sorted.length; k++) {
    const key = sorted[k];
    // Any longer key counts, even the same answer's full name ("Stardew" then "Stardew Valley"),
    // so a short form waits a moment instead of cutting the player off mid-word.
    if (k + 1 < sorted.length && sorted[k + 1].startsWith(key)) longer.add(key);
  }
  const grams = new Map();
  entries.forEach((e, n) => {
    for (const g of bigrams(e.key)) {
      if (!grams.has(g)) grams.set(g, []);
      grams.get(g).push(n);
    }
  });
  return { answers, exact, entries, longer, grams };
}

// Entries close enough in length and letters to be worth a full typo check.
function candidates(index, key, maxEdits) {
  const counts = new Map();
  for (const g of bigrams(key)) {
    const list = index.grams.get(g);
    if (!list) continue;
    for (const n of list) counts.set(n, (counts.get(n) || 0) + 1);
  }
  const out = [];
  for (const [n, shared] of counts) {
    const e = index.entries[n];
    if (Math.abs(e.key.length - key.length) > maxEdits) continue;
    // Each edit can break at most three letter pairs.
    if (shared < Math.min(key.length, e.key.length) - 1 - 3 * maxEdits) continue;
    out.push(e);
  }
  return out;
}

function pickOwner(owners, found) {
  const open = owners.filter((i) => !found.has(i));
  return open.length ? open[0] : owners[0];
}

function exactOwners(index, key) {
  if (index.exact.has(key)) return index.exact.get(key);
  for (const s of singulars(key)) if (index.exact.has(s)) return index.exact.get(s);
  return null;
}

// found: Set of answer indexes already found.
// Returns { result: 'correct' | 'already' | 'wrong' | 'empty', index, corrected }
export function match(index, input, found = new Set()) {
  const key = toKey(input);
  if (!key) return { result: 'empty' };

  const owners = exactOwners(index, key);
  if (owners) {
    // A shared alias (two presidents called Adams) gives the next one not yet found.
    const i = pickOwner(owners, found);
    return { result: found.has(i) ? 'already' : 'correct', index: i, corrected: false };
  }

  // Typo tolerance: exactly one answer may be within reach.
  const tries = [key, ...singulars(key)];
  const near = new Map();
  for (const t of tries) {
    const digits = digitsOf(t);
    for (const { key: alias, i, digits: d2 } of candidates(index, t, 2)) {
      const limit = allowedTypos(Math.min(t.length, alias.length));
      if (limit === 0 || digits !== d2) continue;
      const d = editDistance(t, alias, limit);
      if (d <= limit && (!near.has(i) || d < near.get(i))) near.set(i, d);
    }
  }
  if (near.size === 1) {
    const [i] = near.keys();
    return { result: found.has(i) ? 'already' : 'correct', index: i, corrected: true };
  }
  return { result: 'wrong', ambiguous: near.size > 1 };
}

// What typing so far means, checked on every keystroke in constant time:
// 'now' an exact answer nothing longer starts with, so accept at once;
// 'wait' an exact answer that a longer answer also starts with (Niger, Nigeria);
// 'none' not an exact answer yet.
export function typedState(index, input) {
  const key = toKey(input);
  if (!key || !index.exact.has(key)) return 'none';
  return index.longer.has(key) ? 'wait' : 'now';
}

// True when the typed text is an exact answer and no longer answer begins with it.
export function canAutoAccept(index, input) {
  return typedState(index, input) === 'now';
}

// True when key could still grow into one of this answer's keys (the rest of "Stardew Valley").
export function continues(index, answer, key) {
  return !!key && index.entries.some((e) => e.i === answer && e.key.length > key.length && e.key.startsWith(key));
}
