// WCAG AA check for every text colour pair, in every altitude zone. Reads css/game.css.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const pairs = [
  ['ink', 'paper', 4.5], ['ink-soft', 'paper', 4.5], ['ink', 'signal', 4.5], ['paper', 'ink', 4.5],
  ['glacier', 'paper', 4.5], ['ink', 'found-bg', 4.5], ['ink', 'already-bg', 4.5], ['ink', 'wrong-bg', 4.5], ['ink-soft', 'paper-2', 4.5],
];
// The Everest celebration and gold finish.
pairs.push(['ink', 'gold', 4.5], ['gold-ink', 'gold', 4.5], ['paper', 'night', 4.5], ['ink', 'dawn-glow', 4.5]);
for (const z of ['beach', 'coast', 'meadow', 'treeline', 'snow', 'death', 'summit']) {
  pairs.push([`z-${z}-label-ink`, `z-${z}-label`, 4.5]);
  pairs.push(['ink', `z-${z}-label`, 4.5]);
  pairs.push(['paper', 'ink', 4.5]); // passed milestone labels
  pairs.push(['ink', 'signal', 4.5]); // you-are-here flag
}
let fail = 0;
const seen = new Set();
for (const [fg, bg, min] of pairs) {
  const key = fg + bg;
  if (seen.has(key)) continue;
  seen.add(key);
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? 'pass' : 'FAIL'} ${r.toFixed(2)}:1  ${fg} on ${bg}`);
}
process.exit(fail ? 1 : 0);
