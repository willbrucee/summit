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
  return numbersToDigits(words).join(' ');
}

// Number words and Roman numerals become digits, on both sides, so "Fifa twenty three" meets
// "FIFA 23", and "Henry VIII" meets "Henry 8".
const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const JOINED = new RegExp(`^(${TENS.slice(2).join('|')})(${UNITS.slice(1, 10).join('|')})$`);
const ROMAN = { ii: 2, iii: 3, iv: 4, vi: 6, vii: 7, viii: 8, ix: 9, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20 };
function numbersToDigits(words) {
  const out = [];
  for (let k = 0; k < words.length; k++) {
    const w = words[k];
    const joined = w.match(JOINED);
    if (joined) { out.push(String(TENS.indexOf(joined[1]) * 10 + UNITS.indexOf(joined[2]))); continue; }
    const t = TENS.indexOf(w);
    if (t >= 2) {
      const u = UNITS.indexOf(words[k + 1]);
      if (u >= 1 && u <= 9) { out.push(String(t * 10 + u)); k++; } else out.push(String(t * 10));
      continue;
    }
    const u = UNITS.indexOf(w);
    if (u >= 0) { out.push(String(u)); continue; }
    if (ROMAN[w]) { out.push(String(ROMAN[w])); continue; }
    // A lone V, X or I after a name: Grand Theft Auto V, Malcolm X, Elizabeth I.
    if (k > 0 && k === words.length - 1 && (w === 'v' || w === 'x' || w === 'i')) { out.push(w === 'v' ? '5' : w === 'x' ? '10' : '1'); continue; }
    out.push(w);
  }
  return out;
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

// Keys next to each other on a QWERTY keyboard: hitting a neighbour costs half a typo.
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const NEAR = new Set();
ROWS.forEach((row, r) => [...row].forEach((ch, c) => {
  const around = [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c]];
  for (const [rr, cc] of around) if (ROWS[rr] && ROWS[rr][cc]) NEAR.add(ch + ROWS[rr][cc]);
}));

// Weighted edit cost between two keys, giving up above max. A swap of neighbouring letters,
// a wrong letter, a missing or extra letter cost 1; a neighbouring key, or a doubled letter
// typed single or a single letter typed double, cost 0.5.
let rowA = new Float64Array(64);
let rowB = new Float64Array(64);
let rowC = new Float64Array(64);
export function weightedDistance(a, b, max = Infinity) {
  if (a === b) return 0;
  const n = a.length;
  const m = b.length;
  if (Math.abs(n - m) * 0.5 > max) return max + 1;
  if (m + 1 > rowA.length) { rowA = new Float64Array(m + 1); rowB = new Float64Array(m + 1); rowC = new Float64Array(m + 1); }
  const del = (i) => (a[i - 1] === a[i - 2] || a[i - 1] === a[i] ? 0.5 : 1);
  const ins = (j) => (b[j - 1] === b[j - 2] || b[j - 1] === b[j] ? 0.5 : 1);
  let prev2 = rowA;
  let prev = rowB;
  let cur = rowC;
  prev[0] = 0;
  for (let j = 1; j <= m; j++) prev[j] = prev[j - 1] + ins(j);
  for (let i = 1; i <= n; i++) {
    const di = del(i);
    cur[0] = prev[0] + di;
    let rowMin = cur[0];
    const x = a[i - 1];
    for (let j = 1; j <= m; j++) {
      const y = b[j - 1];
      const sub = x === y ? 0 : NEAR.has(x + y) ? 0.5 : 1;
      let v = prev[j] + di;
      const vi = cur[j - 1] + ins(j);
      if (vi < v) v = vi;
      const vs = prev[j - 1] + sub;
      if (vs < v) v = vs;
      if (i > 1 && j > 1 && x === b[j - 2] && a[i - 2] === y && prev2[j - 2] + 1 < v) v = prev2[j - 2] + 1;
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    const t = prev2; prev2 = prev; prev = cur; cur = t;
  }
  return prev[m];
}

// The typo budget for an answer of this many letters. Three letters or fewer must be exact,
// except a single half-cost slip when nothing else is close.
export function allowedCost(length) {
  if (length <= 3) return 0;
  if (length <= 5) return 1;
  if (length <= 8) return 2;
  if (length <= 12) return 3;
  return 4;
}

// A rough sound-alike code: consonant skeleton after common spelling swaps, so Mbapey meets
// Mbappe, Christiano meets Cristiano and Ibrahimovich meets Ibrahimovic.
export function phonetic(text) {
  return normalise(text).split(' ').map((w) => {
    if (/^\d+$/.test(w)) return w;
    let x = w.replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/sch/g, 'sk').replace(/ch/g, 'k').replace(/gh/g, 'g')
      .replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k').replace(/q/g, 'k').replace(/x/g, 'ks').replace(/z/g, 's').replace(/dg/g, 'j');
    const first = /^[aeiouy]/.test(x) ? 'a' : '';
    x = x.replace(/[aeiouyhw]/g, '').replace(/(.)\1+/g, '$1');
    return first + x;
  }).join(' ');
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
// waits a moment. grams: letter pair -> entry numbers, for typo candidates. phon: sound-alike
// code -> answers. For people (options.people), a surname or other word only one answer has
// also counts ("Mbappe"), and a word several share ("Williams") is too close to call.
export function buildIndex(answers, options = {}) {
  const exact = new Map();
  const entries = [];
  const phon = new Map();
  const add = (key, i, words) => {
    if (!exact.has(key)) exact.set(key, []);
    const owners = exact.get(key);
    if (!owners.includes(i)) owners.push(i);
    entries.push({ key, i, digits: digitsOf(key), words });
  };
  const labels = new Set();
  answers.forEach((answer, i) => {
    labels.add(toKey(answer.label));
    const seen = new Set();
    for (const text of [answer.label, ...(answer.aliases || [])]) {
      const words = normalise(text).split(' ').filter(Boolean);
      const key = words.join('');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      add(key, i, words);
      const code = phonetic(text).replace(/ /g, '');
      if (code.length >= 4) {
        if (!phon.has(code)) phon.set(code, new Set());
        phon.get(code).add(i);
      }
    }
  });
  // Words several answers share ("Congo", "Korea", "Williams") are too close to call.
  // For people, a word only one answer has also counts as that answer ("Mbappe").
  const sharedWords = new Map();
  const owners = new Map();
  answers.forEach((answer, i) => {
    for (const w of new Set(normalise(answer.label).split(' '))) {
      if (w.length < 4 || /\d/.test(w)) continue;
      if (!owners.has(w)) owners.set(w, new Set());
      owners.get(w).add(i);
    }
  });
  for (const [w, set] of owners) {
    if (set.size > 1) sharedWords.set(w, [...set]);
    else if (options.people && !exact.has(w)) add(w, [...set][0], [w]);
  }
  // People with a surname of more than one word: the name without its first word counts too
  // ("Del Piero", "De Bruyne", "Van Dijk"), when only one person has it.
  if (options.people) {
    const tails = new Map();
    answers.forEach((answer, i) => {
      const words = normalise(answer.label).split(' ');
      if (words.length < 3) return;
      const tail = words.slice(1);
      const key = tail.join('');
      if (!tails.has(key)) tails.set(key, { i, words: tail, n: 0 });
      tails.get(key).n++;
    });
    for (const [key, t] of tails) if (t.n === 1 && !exact.has(key)) add(key, t.i, t.words);
  }
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
  // Short keys can share no letter pair with a typo ("rqt", "rat"), so they are always checked.
  const short = [];
  entries.forEach((e, n) => { if (e.key.length <= 6) short.push(n); });
  return { answers, exact, entries, longer, grams, phon, sharedWords, short, labels };
}

// Entries that share enough letter pairs, and are close enough in length, to be worth costing.
function candidates(index, key, scanAll = false) {
  if (scanAll) return index.entries;
  const typed = bigrams(key);
  const counts = new Map();
  for (const g of typed) {
    const list = index.grams.get(g);
    if (!list) continue;
    for (const n of list) counts.set(n, (counts.get(n) || 0) + 1);
  }
  // Any shared letter pair is enough: heavy typos can leave only one or two in common. The
  // length window and the cost check's early exit keep this cheap.
  const out = [];
  const seen = new Set();
  const ids = [...counts.keys()];
  if (key.length <= 7) ids.push(...index.short);
  for (const n of ids) {
    if (seen.has(n)) continue;
    seen.add(n);
    const e = index.entries[n];
    if (Math.abs(e.key.length - key.length) > 2 * allowedCost(Math.max(e.key.length, 4)) + 1) continue;
    // Each edit breaks at most three letter pairs and costs at least half, so pairs the
    // typed text has and the entry lacks give a floor on the cost. Too high a floor, skip.
    const missing = typed.size - (counts.get(n) || 0);
    if (missing / 6 > allowedCost(Math.max(e.key.length, key.length)) + 1) continue;
    out.push(e);
  }
  return out;
}

// Word by word, in any order: every word within its own budget. Returns the summed cost.
// A shortened word ("Mo" for Mohamed, "Man" for Manchester) costs half a typo, as long as some
// other word is matched in full.
function perWordCost(typed, words) {
  if (typed.length < 2 || typed.length !== words.length || typed.length > 4) return Infinity;
  let best = Infinity;
  const used = new Array(words.length).fill(false);
  const walk = (k, sum, full) => {
    if (sum >= best) return;
    if (k === typed.length) { if (full) best = sum; return; }
    for (let j = 0; j < words.length; j++) {
      if (used[j]) continue;
      const w = words[j];
      const t = typed[k];
      if (digitsOf(t) !== digitsOf(w)) continue;
      let c;
      let whole = true;
      if (t.length < w.length && w.startsWith(t) && !/\d/.test(t)) { c = 0.5; whole = false; }
      else {
        const limit = w.length <= 3 ? (w.length <= 2 ? 0 : 0.5) : allowedCost(w.length);
        c = weightedDistance(t, w, limit);
        if (c > limit) continue;
      }
      used[j] = true;
      walk(k + 1, sum + c, full || (whole && w.length >= 3));
      used[j] = false;
    }
  };
  walk(0, 0, false);
  return best;
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

// The cost of a typed text against one entry, and whether it is within budget.
// The budget comes from the shorter of the two, so a prefix ("Manchester") never becomes
// a longer answer ("Manchester City") by counting the missing word as typos.
// Beyond one typo, the guess must also start like the answer (same letter or same sound),
// which real typos nearly always do and unrelated words often do not ("Marrow", Madrid).
const startSound = (k) => {
  const x = k.replace(/^ph/, 'f').replace(/^c(?=[eiy])/, 's').replace(/^[cqk]/, 'k').replace(/^[zx]/, 's');
  return /^[aeiouy]/.test(x) ? 'a' : x[0];
};
const sameStart = (a, b) => a[0] === b[0] || startSound(a) === startSound(b);
function costOf(t, typedWords, e) {
  const short = e.key.length <= 3;
  const limit = short ? 0.5 : allowedCost(Math.min(e.key.length, t.length));
  const whole = weightedDistance(t, e.key, limit + 1);
  const words = perWordCost(typedWords, e.words);
  const cost = Math.min(whole, words);
  // Short answers keep their first letter unless the slip is a single half-cost one.
  const start = whole <= 0.5 || (e.key.length <= 5 ? t[0] === e.key[0] : whole <= 1 || sameStart(t, e.key));
  const ok = (whole <= limit && start) || words < Infinity;
  return { cost, ok, limit, short };
}

// found: Set of answer indexes already found.
// Returns { result: 'correct' | 'already' | 'wrong' | 'empty', index, corrected, ambiguous }
// Typos: the single closest answer wins if it is within its budget and clearly closer
// (by at least half a typo) than the next; otherwise it is too close to call.
// options.scanAll costs every alias instead of the letter-pair candidates (tests only).
export function match(index, input, found = new Set(), options = {}) {
  const key = toKey(input);
  if (!key) return { result: 'empty' };

  const owners = exactOwners(index, key);
  // An alias that is also a word several answers share ("Congo") is too close to call, unless
  // it is an answer's own name ("Guinea") or the alias is shared on purpose (Bush, Adams).
  const shared = index.sharedWords && index.sharedWords.get(key);
  if (owners && shared && !index.labels.has(key) && shared.some((i) => !owners.includes(i))) return { result: 'wrong', ambiguous: true };
  if (owners) {
    // A shared alias (two presidents called Adams) gives the next one not yet found.
    const i = pickOwner(owners, found);
    return { result: found.has(i) ? 'already' : 'correct', index: i, corrected: false };
  }
  // A surname several people share is never a guess.
  if (index.sharedWords && index.sharedWords.has(key)) return { result: 'wrong', ambiguous: true };

  const typedWords = normalise(input).split(' ').filter(Boolean);
  const best = new Map(); // answer -> { cost, ok, short }
  const consider = (i, r) => {
    const prev = best.get(i);
    if (!prev || r.cost < prev.cost || (r.cost === prev.cost && r.ok && !prev.ok)) best.set(i, r);
  };
  for (const t of [key, ...singulars(key)]) {
    const digits = digitsOf(t);
    for (const e of candidates(index, t, options.scanAll)) {
      if (e.digits !== digits) continue;
      const r = costOf(t, t === key ? typedWords : [t], e);
      // A plural form only counts exactly or within half a typo, never as a fuzzy guess.
      if (t !== key && r.cost > 0.5) continue;
      consider(e.i, r);
    }
  }
  // Sound-alike help: one answer with the same code may be a little further out.
  const code = phonetic(input).replace(/ /g, '');
  const sound = code.length >= 4 && index.phon ? index.phon.get(code) : null;
  if (sound && sound.size === 1) {
    const [i] = sound;
    for (const e of index.entries) {
      if (e.i !== i || e.digits !== digitsOf(key) || !sameStart(key, e.key)) continue;
      const r = costOf(key, typedWords, e);
      if (r.cost <= r.limit + 1) consider(i, { ...r, ok: true });
    }
  }
  const valid = [...best.entries()].filter(([, r]) => r.ok).sort((x, y) => x[1].cost - y[1].cost);
  if (!valid.length) return { result: 'wrong', ambiguous: false };
  const [i, top] = valid[0];
  if (valid.length > 1 && valid[1][1].cost - top.cost < 0.5) return { result: 'wrong', ambiguous: true };
  // The start of a different, longer answer ("Dominican") is not a typo of a shorter one.
  if (key.length >= 4 && index.entries.some((e) => e.i !== i && e.key.length > key.length && e.key.startsWith(key))) return { result: 'wrong', ambiguous: true };
  // Very short answers take a half-cost slip only when nothing else is in reach.
  if (top.short && (valid.length > 1 || top.cost > 0.5)) return { result: 'wrong', ambiguous: valid.length > 1 };
  return { result: found.has(i) ? 'already' : 'correct', index: i, corrected: true };
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
