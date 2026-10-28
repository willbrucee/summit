// Picks the Wikidata item that each answer refers to, from the label lookups cached by
// fetch-wikidata-labels.mjs. A label like "Orange" has many items; the right one shares
// classes with the rest of the prompt (fruit, food), so classes common to the prompt win.

// Classes that say nothing about the topic.
const IGNORE = new Set(['Q4167410', 'Q13406463', 'Q11266439', 'Q4167836', 'Q101352', 'Q202444', 'Q12308941', 'Q11879590',
  'Q3409032', 'Q21286738', 'Q17442446', 'Q15184295', 'Q14204246', 'Q22808320', 'Q17633526']);

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export function matchWikidata(answers, cache) {
  if (!cache) return answers.map(() => null);
  const cands = answers.map((a) => {
    const names = [a.label, lowerFirst(a.label), ...a.aliases.slice(0, 2).map((x) => (typeof x === 'string' ? x : x.text))];
    const seen = new Map();
    for (const n of names) for (const c of cache[n] || []) if (!seen.has(c.q) && !c.c.some((k) => k === 'Q4167410')) seen.set(c.q, c);
    return [...seen.values()];
  });
  // How many answers have a candidate in each class.
  const freq = new Map();
  for (const list of cands) {
    const classes = new Set(list.flatMap((c) => c.c).filter((k) => !IGNORE.has(k)));
    for (const k of classes) freq.set(k, (freq.get(k) || 0) + 1);
  }
  const n = answers.length;
  const strong = (k) => (freq.get(k) || 0) >= Math.max(3, n * 0.08);
  return cands.map((list) => {
    let best = null;
    let bestScore = 0;
    for (const c of list) {
      const score = c.c.filter((k) => !IGNORE.has(k) && strong(k)).reduce((s, k) => s + freq.get(k) / n, 0);
      if (score > bestScore || (score === bestScore && best && c.sl > best.sl)) { best = c; bestScore = score; }
    }
    return best && bestScore > 0 ? best : null;
  });
}
