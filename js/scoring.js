// Altitude, milestones, titles and the air up there.

export const EVEREST = 8849;
export const ROUNDS = 5;
// Curve chosen by tools/simulate.mjs: ^0.8 puts the median casual, good and expert climbs in
// the target bands (3,000 to 4,000 m, 5,500 to 7,000 m, 7,500 to 8,800 m); ^0.7 overshot casual.
export const EXPONENT = 0.8;
const TARGET_CAP = 22;
const DIFFICULTY_FACTOR = { 1: 1, 2: 0.85, 3: 0.7 };
// Targets sit 30% below what a top player could reach, so a full share is within reach.
export const TARGET_SCALE = 0.7;
// Every answer past the target adds a little more, up to a small cap per round.
export const OVERFLOW_PER_ANSWER = 0.03;
export const OVERFLOW_CAP = 0.15;
const ROUND_SHARE = EVEREST / ROUNDS;

// The number of answers that earns a round's full share of Everest.
export function targetFor(size, difficulty) {
  const base = Math.min(TARGET_CAP, Math.round(size * 0.6));
  return Math.max(4, Math.round(base * (DIFFICULTY_FACTOR[difficulty] || 1) * TARGET_SCALE));
}

// Metres for one round: a generous curve up to the target, then a small overflow bonus.
export function roundMetres(found, target, exponent = EXPONENT) {
  if (!found || !target) return 0;
  const climb = ROUND_SHARE * Math.pow(Math.min(1, found / target), exponent);
  const extra = ROUND_SHARE * Math.min(OVERFLOW_CAP, Math.max(0, found - target) * OVERFLOW_PER_ANSWER);
  return climb + extra;
}

// The whole climb, which never goes past the top of Everest.
export function totalMetres(rounds) {
  return Math.min(EVEREST, rounds.reduce((sum, m) => sum + m, 0));
}

// Heights are the current official figures. Wikidata (P2044) values are kept for the QA page.
export const MILESTONES = [
  { name: 'Sea level', height: 0, wikidata: null, title: 'Beach walker' },
  { name: "Arthur's Seat", height: 251, wikidata: 251, title: 'Hill walker' },
  { name: 'Uluru', height: 863, wikidata: 863, title: 'Rambler' },
  { name: 'Table Mountain', height: 1085, wikidata: 1085, title: 'Rambler' },
  { name: 'Ben Nevis', height: 1345, wikidata: 1344.527, title: 'Fell walker' },
  { name: 'Mount Kosciuszko', height: 2228, wikidata: 2228, title: 'Foothills scrambler' },
  { name: 'Mount Olympus', height: 2918, wikidata: 2917.727, title: 'Meadow trekker' },
  { name: 'Mount Fuji', height: 3776, wikidata: 3777.24, title: 'Treeline trekker' },
  { name: 'Matterhorn', height: 4478, wikidata: 4477.54, title: 'Ridge climber' },
  { name: 'Mont Blanc', height: 4806, wikidata: 4805.59, title: 'Alpinist' },
  { name: 'Mount Kenya', height: 5199, wikidata: 5199, title: 'Snowline climber' },
  { name: 'Kilimanjaro', height: 5895, wikidata: 5895, title: 'Snowline climber' },
  { name: 'Denali', height: 6190, wikidata: 6190, title: 'High camp climber' },
  { name: 'Aconcagua', height: 6961, wikidata: 6962, title: 'Summit pusher' },
  { name: 'Cho Oyu', height: 8188, wikidata: 8188, title: 'Death zone climber' },
  { name: 'K2', height: 8611, wikidata: 8611, title: 'K2 conqueror' },
  { name: 'Mount Everest', height: EVEREST, wikidata: 8848.86, title: 'Everest summiteer' },
];

// The highest milestone at or below this altitude (allowing for rounding).
export function milestoneAt(altitude) {
  let best = MILESTONES[0];
  for (const m of MILESTONES) if (altitude + 0.5 >= m.height) best = m;
  return best;
}

export function nextMilestone(altitude) {
  return MILESTONES.find((m) => m.height > altitude + 0.5) || null;
}

export function titleFor(altitude) {
  return milestoneAt(altitude).title;
}

// Standard lapse rate from a warm beach: 30 °C at sea level, minus 6.5 °C per 1,000 m.
export function temperatureAt(altitude) {
  return 30 - (6.5 * altitude) / 1000;
}

// Barometric formula, in hectopascals.
export function pressureAt(altitude) {
  return 1013.25 * Math.pow(1 - 2.25577e-5 * altitude, 5.25588);
}

export const ZONES = [
  { id: 'beach', name: 'Beach', from: 0 },
  { id: 'coast', name: 'Coastal hills', from: 600 },
  { id: 'meadow', name: 'Meadows', from: 1800 },
  { id: 'treeline', name: 'Treeline', from: 3200 },
  { id: 'snow', name: 'Snowline', from: 4500 },
  { id: 'death', name: 'Death zone', from: 6500 },
  { id: 'summit', name: 'Summit', from: EVEREST - 0.5 },
];

export function zoneAt(altitude) {
  let z = ZONES[0];
  for (const zone of ZONES) if (altitude >= zone.from) z = zone;
  return z;
}

export function formatMetres(m) {
  return Math.round(m).toLocaleString('en-GB') + ' m';
}
