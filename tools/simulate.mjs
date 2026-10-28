// Calibration: simulate casual, good and expert players on real scheduled days.
// Run: node tools/simulate.mjs
import { readFileSync } from 'node:fs';
import { EVEREST, MILESTONES, milestoneAt } from '../js/scoring.js';
import { seededRandom } from '../js/daily.js';

const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const schedule = JSON.parse(readFileSync(new URL('../data/schedule.json', import.meta.url), 'utf8'));
const byId = new Map(data.prompts.map((p) => [p.id, p]));
const days = schedule.days.map((d) => d.prompts.map((id) => byId.get(id)));

const GAMES = 5000;
const PLAYERS = {
  casual: { min: 0.35, max: 0.45 },
  good: { min: 0.65, max: 0.75 },
  expert: { min: 0.9, max: 1.0 },
};

// Altitude curves: share of a round's 1/5 of Everest for a found/target ratio r (capped at 1).
const CURVES = {
  'Spec: r^0.85': (r) => Math.pow(r, 0.85),
  'Power: r^1.15': (r) => Math.pow(r, 1.15),
  'S-curve: r^1.5 / (r^1.5 + (1-r)^1.5)': (r) => {
    const a = Math.pow(r, 1.5);
    return a / (a + Math.pow(1 - r, 1.5));
  },
};

function gaussian(rand) {
  return Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
}

function simulate(curve, player, seed) {
  const rand = seededRandom(seed);
  const results = [];
  for (let g = 0; g < GAMES; g++) {
    const day = days[Math.floor(rand() * days.length)];
    // Skill for the day, then round-to-round wobble because some prompts suit you better.
    const skill = player.min + rand() * (player.max - player.min);
    let altitude = 0;
    for (const p of day) {
      const ratio = Math.max(0, skill * (1 + 0.12 * gaussian(rand)));
      const found = Math.min(p.size, Math.round(ratio * p.target));
      altitude += (EVEREST / 5) * curve(Math.min(1, found / p.target));
    }
    results.push(altitude);
  }
  return results.sort((a, b) => a - b);
}

const pct = (arr, q) => arr[Math.floor(q * (arr.length - 1))];
const m = (x) => Math.round(x).toLocaleString('en-GB');

for (const [name, curve] of Object.entries(CURVES)) {
  console.log(`\n### ${name}\n`);
  console.log('| Player | 10th pct | Median | 90th pct | Most common mountain reached | Reach K2 | Reach Everest |');
  console.log('|---|---|---|---|---|---|---|');
  for (const [pname, player] of Object.entries(PLAYERS)) {
    const r = simulate(curve, player, name + pname);
    const counts = {};
    for (const a of r) { const n = milestoneAt(a).name; counts[n] = (counts[n] || 0) + 1; }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2)
      .map(([n, c]) => `${n} (${Math.round((100 * c) / GAMES)}%)`).join(', ');
    const k2 = r.filter((a) => a + 0.5 >= 8611).length / GAMES;
    const ev = r.filter((a) => a + 0.5 >= EVEREST).length / GAMES;
    console.log(`| ${pname} | ${m(pct(r, 0.1))} m | ${m(pct(r, 0.5))} m | ${m(pct(r, 0.9))} m | ${top} | ${(100 * k2).toFixed(1)}% | ${(100 * ev).toFixed(1)}% |`);
  }
}
// Share of games ending at each mountain (the highest one passed).
for (const [name, curve] of Object.entries(CURVES)) {
  console.log(`\n#### Where games end: ${name}\n`);
  console.log('| Highest mountain passed | ' + Object.keys(PLAYERS).join(' | ') + ' |');
  console.log('|---|' + Object.keys(PLAYERS).map(() => '---').join('|') + '|');
  const dist = Object.entries(PLAYERS).map(([pname, player]) => {
    const counts = {};
    for (const a of simulate(curve, player, name + pname)) { const n = milestoneAt(a).name; counts[n] = (counts[n] || 0) + 1; }
    return counts;
  });
  for (const ms of MILESTONES) {
    const cells = dist.map((c) => (c[ms.name] ? `${((100 * c[ms.name]) / GAMES).toFixed(1)}%` : ''));
    if (cells.some(Boolean)) console.log(`| ${ms.name} (${m(ms.height)} m) | ${cells.join(' | ')} |`);
  }
}
console.log('\nMilestones: ' + MILESTONES.map((x) => `${x.name} ${m(x.height)}`).join(', '));
