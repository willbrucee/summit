// Picks the Wikidata item each answer refers to, from the label lookups cached by
// fetch-wikidata-labels.mjs. The item must be in one of the prompt's expected classes
// (build/wikidata-classes.mjs); among those, the best known item wins (most sitelinks),
// so the god Zeus beats the comic book Zeus.
import { WD_CLASSES } from './wikidata-classes.mjs';

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export function matchWikidata(answers, cache, promptId) {
  const classes = new Set(WD_CLASSES[promptId] || []);
  // Obscure genera share common names (a wasp called Kiwi), so living things need some fame.
  const minLinks = classes.has('Q16521') ? 10 : 2;
  if (!cache || !classes.size) return answers.map(() => null);
  return answers.map((a) => {
    const names = [a.label, lowerFirst(a.label), ...a.aliases.slice(0, 2).map((x) => (typeof x === 'string' ? x : x.text))];
    let best = null;
    for (const n of names) {
      for (const c of cache[n] || []) {
        if (c.sl < minLinks || !c.c.some((k) => classes.has(k))) continue;
        if (!best || c.sl > best.sl) best = c;
      }
    }
    if (!best) return null;
    // Wikidata descriptions sometimes carry notes for editors: "(for Citrus x limon use Q500)".
    const d = (best.d || '').replace(/\s*\((?:for|see|not|use)\b[^)]*\)/gi, '').trim();
    // A few spelling slips in Wikidata descriptions, fixed so players never see them.
    const fixed = d.replace(/\bsurprizing\b/g, 'surprising').replace(/\bheterogenous\b/g, 'heterogeneous');
    return { ...best, d: /wikimedia|disambiguation/i.test(fixed) ? '' : fixed };
  });
}
