// Calibration: simulate players on real scheduled days and report where their climbs end.
// Skill is the share of each round's target a player finds (with round-to-round wobble);
// the list-assisted typist instead enters about 20 answers every round.
// Run: node tools/simulate.mjs
import { readFileSync } from 'node:fs';
import { EVEREST, MILESTONES, milestoneAt, roundMetres, totalMetres } from '../js/scoring.js';
import { seededRandom } from '../js/daily.js';

const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const schedule = JSON.parse(readFileSync(new URL('../data/schedule.json', import.meta.url), 'utf8'));
const byKey = new Map(data.prompts.map((p) => [p.key, p]));
// Days from tomorrow onwards use the current bank.
const days = schedule.days.map((d) => d.prompts.map((k) => byKey.get(k))).filter((d) => d.every(Boolean));

const GAMES = 5000;
export const PLAYERS = {
  'casual (35%)': { skill: 0.35 },
  'good (65%)': { skill: 0.65 },
  'expert (90%)': { skill: 0.9 },
  'typist (20 a round)': { perRound: 20 },
};
const exponent = Number(process.env.EXP || 0) || undefined;

function gaussian(rand) {
  return Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
}

function simulate(player, seed) {
  const rand = seededRandom(seed);
  const results = [];
  for (let g = 0; g < GAMES; g++) {
    const day = days[Math.floor(rand() * days.length)];
    // Some days suit you, and some prompts suit you better than others.
    const dayForm = 1 + 0.1 * gaussian(rand);
    const metres = day.map((p) => {
      const wobble = dayForm * (1 + 0.15 * gaussian(rand));
      const want = player.perRound ? player.perRound * (1 + 0.15 * gaussian(rand)) : player.skill * p.target * wobble;
      const found = Math.max(0, Math.min(p.size, Math.round(want)));
      return roundMetres(found, p.target, exponent);
    });
    results.push(totalMetres(metres));
  }
  return results.sort((a, b) => a - b);
}

const pct = (arr, q) => arr[Math.floor(q * (arr.length - 1))];
const m = (x) => Math.round(x).toLocaleString('en-GB');
const runs = Object.fromEntries(Object.entries(PLAYERS).map(([name, p]) => [name, simulate(p, 'sim:' + name)]));

console.log(`${days.length} scheduled days, ${GAMES} games per player${exponent ? `, exponent ${exponent}` : ''}\n`);
console.log('| Player | 10th pct | Median | 90th pct | Pass K2 | Reach Everest |');
console.log('|---|---|---|---|---|---|');
for (const [name, r] of Object.entries(runs)) {
  const k2 = r.filter((a) => a + 0.5 >= 8611).length / GAMES;
  const ev = r.filter((a) => a + 0.5 >= EVEREST).length / GAMES;
  console.log(`| ${name} | ${m(pct(r, 0.1))} m | ${m(pct(r, 0.5))} m | ${m(pct(r, 0.9))} m | ${(100 * k2).toFixed(1)}% | ${(100 * ev).toFixed(1)}% |`);
}
console.log('\n| Highest mountain passed | ' + Object.keys(runs).join(' | ') + ' |');
console.log('|---|' + Object.keys(runs).map(() => '---').join('|') + '|');
const dist = Object.values(runs).map((r) => {
  const counts = {};
  for (const a of r) { const n = milestoneAt(a).name; counts[n] = (counts[n] || 0) + 1; }
  return counts;
});
for (const ms of MILESTONES) {
  const cells = dist.map((c) => (c[ms.name] ? `${((100 * c[ms.name]) / GAMES).toFixed(1)}%` : '-'));
  if (dist.some((c) => c[ms.name])) console.log(`| ${ms.name} (${m(ms.height)} m) | ${cells.join(' | ')} |`);
}
