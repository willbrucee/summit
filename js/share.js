// Share text. Shows the climb, never the answers.
import { EVEREST, ROUNDS, formatMetres, milestoneAt } from './scoring.js';

const BLOCKS = 5;

export function roundBar(metres) {
  const filled = Math.round((metres / (EVEREST / ROUNDS)) * BLOCKS);
  return '▲'.repeat(filled) + '△'.repeat(BLOCKS - filled);
}

export function shareText({ day, altitude, rounds, url }) {
  const m = milestoneAt(altitude);
  const where = altitude + 0.5 >= EVEREST ? 'Summited Everest' : m.height === 0 ? 'Still on the beach' : `Past ${m.name}`;
  const lines = [
    `Summit #${day}: ${formatMetres(altitude)}`,
    where,
    '',
    ...rounds.map((r, i) => `${i + 1} ${roundBar(r.metres)} ${formatMetres(r.metres)}`),
  ];
  if (url) lines.push('', url);
  return lines.join('\n');
}
