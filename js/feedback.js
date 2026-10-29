// What a guess means for the player, kept separate from the DOM so it can be tested.
import { match, toKey } from './matcher.js';

export const WRONG_LINES = [
  'Not on this mountain',
  'Slipped on that one',
  'No foothold there',
  'Off the map, try another',
  'Not on today’s trail',
];

// accepted | autocorrected | duplicate | ambiguous | outside | wrong | empty
// outside: a real thing of the right kind that is not on this list (a game outside the
// charts). It costs nothing; the player just hears why it did not count.
export function classifyGuess(index, text, found, outsideIndex = null) {
  const r = match(index, text, found);
  if (r.result === 'empty') return { state: 'empty' };
  if (r.result === 'already') return { state: 'duplicate', index: r.index };
  // A real answer typed exactly but just off the list (Pelé, not Pepe) beats a typo correction.
  if (r.result === 'correct' && r.corrected && outsideIndex) {
    const owners = outsideIndex.exact.get(toKey(text));
    if (owners) return { state: 'outside', label: outsideIndex.answers[owners[0]].label };
  }
  if (r.result === 'correct') return { state: r.corrected ? 'autocorrected' : 'accepted', index: r.index };
  if (outsideIndex && !r.ambiguous) {
    const o = match(outsideIndex, text, new Set());
    if (o.result === 'correct') return { state: 'outside', label: outsideIndex.answers[o.index].label };
  }
  return { state: r.ambiguous ? 'ambiguous' : 'wrong' };
}

// The line for a real answer that is not on the list.
export function outsideLine(prompt) {
  return prompt.outsideLine || 'That one is real, just not on this list';
}

// Which letters of the corrected label differ from what was typed (case and accents ignored).
// Returns [{ text, changed }] runs covering the whole label.
export function diffMarks(typed, label) {
  const fold = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const a = fold(typed.trim());
  const b = fold(label);
  const n = a.length;
  const m = b.length;
  const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  // Walk back to find which label characters were matched as they were typed.
  const changed = new Array(m).fill(true);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1] && d[i][j] === d[i - 1][j - 1]) { changed[j - 1] = false; i--; j--; }
    else if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && d[i][j] === d[i - 2][j - 2] + 1) { i -= 2; j -= 2; }
    else if (d[i][j] === d[i - 1][j - 1] + 1) { i--; j--; }
    else if (d[i][j] === d[i][j - 1] + 1) { j--; }
    else { i--; }
  }
  // Spaces and punctuation are never shown as changes.
  [...label].forEach((c, k) => { if (!/[a-z0-9]/i.test(fold(c))) changed[k] = false; });
  const runs = [];
  [...label].forEach((c, k) => {
    const last = runs[runs.length - 1];
    if (last && last.changed === changed[k]) last.text += c; else runs.push({ text: c, changed: changed[k] });
  });
  return runs;
}

// Combo: consecutive correct answers, each within this many ms of the last.
export const COMBO_GAP_MS = 7000;
export const COMBO_MAX = 6;

export function nextCombo(combo, state, now, lastAt) {
  if (state === 'accepted' || state === 'autocorrected') {
    return lastAt !== null && now - lastAt <= COMBO_GAP_MS ? combo + 1 : 1;
  }
  if (state === 'wrong' || state === 'ambiguous') return 0;
  return combo; // duplicates and empty presses leave the rope as it is
}

// The best burst: the most answers found inside any 10 second window, and how long it took.
export function bestBurst(times, windowMs = 10000) {
  const t = [...times].sort((x, y) => x - y);
  let best = { count: 0, seconds: 0 };
  let lo = 0;
  for (let hi = 0; hi < t.length; hi++) {
    while (t[hi] - t[lo] > windowMs) lo++;
    const count = hi - lo + 1;
    const seconds = Math.max(1, Math.ceil((t[hi] - t[lo]) / 1000));
    if (count > best.count || (count === best.count && seconds < best.seconds)) best = { count, seconds };
  }
  return best;
}

// Words typed that never matched, worth reporting as possible missing answers.
export function unmatchedWorthReporting(wrong) {
  const counts = new Map();
  const shown = new Map();
  for (const w of wrong) {
    const k = toKey(w);
    if (!k) continue;
    counts.set(k, (counts.get(k) || 0) + 1);
    if (!shown.has(k)) shown.set(k, w.trim());
  }
  return [...shown.entries()].filter(([k]) => counts.get(k) >= 2 || k.length > 2).map(([, w]) => w);
}
