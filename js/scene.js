// The mountain. One tall illustrated world drawn in SVG; a camera (a CSS transform)
// keeps the climber in view while the sky, far ranges and clouds move at their own pace.
import { EVEREST, MILESTONES, zoneAt, temperatureAt, pressureAt, formatMetres } from './scoring.js';
import { seededRandom } from './daily.js';

const M2PX = 0.44;          // world pixels per metre
const TOP = 560;            // sky above the summit
const LEFT = 900;           // world x origin offset (the sea lies at negative x)
const WIDTH = 4400;
const SX = 1750;            // summit x
const worldY = (a) => TOP + (EVEREST - a) * M2PX;
const HEIGHT = Math.round(worldY(-160) + 300);

// Palettes blend between these anchor heights.
const ANCHORS = [
  { zone: 'beach', at: 0 },
  { zone: 'coast', at: 1200 },
  { zone: 'meadow', at: 2500 },
  { zone: 'treeline', at: 3850 },
  { zone: 'snow', at: 5500 },
  { zone: 'death', at: 7600 },
  { zone: 'summit', at: EVEREST },
];
const OUTFITS = { beach: 'swim', coast: 'hike', meadow: 'hike', treeline: 'fleece', snow: 'jacket', death: 'down', summit: 'down' };

// ---------- geometry ----------

const t = (a) => Math.max(0, Math.min(1, a / EVEREST));
const jag = (a, k = 1) => (Math.sin(a / 210 + k) * 16 + Math.sin(a / 83 + 2 * k) * 7 + Math.sin(a / 37 + 3 * k) * 3) * (1 - Math.pow(t(a), 6));
const FOOT = 560;
const edgeBase = (a) => FOOT + (SX - FOOT) * Math.pow(t(a), 0.8);
export const edgeX = (a) => edgeBase(a) + jag(a);
const rightX = (a) => SX + (SX - edgeBase(a)) * 1.05 + jag(a, 4);
const ridgeX = (a) => SX + (rightX(a) - SX) * 0.22;
const tri = (u) => 1 - Math.abs(2 * (u - Math.floor(u)) - 1);

// The trail: switchbacks across the lit face, closing in on the summit.
export function pathX(a) {
  const room = (ridgeX(a) - edgeX(a)) * 0.78;
  const off = (60 + 190 * tri(a / 380 + 0.15)) * (1 - Math.pow(t(a), 3));
  return edgeX(a) + Math.min(off, room) + 10 * (1 - t(a));
}

function weights(a) {
  const w = Object.fromEntries(ANCHORS.map((x) => [x.zone, 0]));
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const lo = ANCHORS[i];
    const hi = ANCHORS[i + 1];
    if (a <= hi.at || i === ANCHORS.length - 2) {
      const f = Math.max(0, Math.min(1, (a - lo.at) / (hi.at - lo.at)));
      w[lo.zone] = 1 - f;
      w[hi.zone] = f;
      return { w, lower: lo.zone, upper: hi.zone, f };
    }
  }
  return { w, lower: 'beach', upper: 'coast', f: 0 };
}

// ---------- drawing ----------

const P = (x, y) => `${(x + LEFT).toFixed(1)},${y.toFixed(1)}`;

function faceSvg() {
  const lit = [];
  const shade = [];
  const rim = [];
  for (let a = 0; a <= EVEREST; a += 40) {
    lit.push(P(edgeX(a), worldY(a)));
    rim.push(P(edgeX(a) + 7, worldY(a) + 4));
  }
  for (let a = EVEREST; a >= 0; a -= 40) lit.push(P(ridgeX(a), worldY(a)));
  for (let a = 0; a <= EVEREST; a += 40) shade.push(P(ridgeX(a), worldY(a)));
  for (let a = EVEREST; a >= 0; a -= 40) shade.push(P(rightX(a), worldY(a)));
  // Continue below sea level so the mountain sits in the sand.
  const foot = worldY(-160);
  lit.unshift(P(edgeX(0) - 40, foot));
  lit.push(P(ridgeX(0), foot));
  shade.unshift(P(ridgeX(0), foot));
  shade.push(P(rightX(0) + 60, foot));
  const outline = [];
  for (let a = 0; a <= EVEREST; a += 40) outline.push(P(edgeX(a), worldY(a)));
  for (let a = EVEREST; a >= 0; a -= 40) outline.push(P(rightX(a), worldY(a)));
  return `
    <polygon points="${lit.join(' ')}" fill="url(#lit)"/>
    <polygon points="${shade.join(' ')}" fill="url(#shade)"/>
    <polyline points="${rim.join(' ')}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="6" stroke-linecap="round"/>
    <polyline points="${outline.join(' ')}" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round"/>`;
}

function gradients() {
  const stops = (shade) => [
    [0, 'sand'], [420, 'sand'], [720, 'jungle'], [1650, 'jungle'], [1950, 'meadow'], [3050, 'meadow'],
    [3350, 'rock'], [4350, 'rock'], [4650, 'snow'], [6350, 'snow'], [6650, 'ice'], [EVEREST, 'ice'],
  ].map(([a, c]) => `<stop offset="${(a / EVEREST).toFixed(4)}" style="stop-color:var(--m-${c}${shade ? '-shade' : ''})"/>`).join('');
  const g = (id, shade) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${worldY(0)}" x2="0" y2="${worldY(EVEREST)}">${stops(shade)}</linearGradient>`;
  return `<defs>${g('lit', false)}${g('shade', true)}
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--m-sea)"/><stop offset="1" style="stop-color:var(--m-sea-deep)"/></linearGradient></defs>`;
}

function seaAndBeach() {
  const y0 = worldY(0);
  const sandTop = [P(360, y0 + 12), P(400, y0 - 1), P(480, y0 - 5), P(edgeX(0) + 2, y0 - 1)];
  const sand = `<polygon points="${[...sandTop, P(WIDTH, y0 - 1), P(WIDTH, HEIGHT), P(330, HEIGHT)].join(' ')}" fill="var(--m-sand)"/>
    <polyline points="${sandTop.join(' ')}" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
  const sea = `<rect x="0" y="${y0 + 6}" width="${LEFT + 380}" height="${HEIGHT - y0}" fill="url(#sea)"/>
    <line x1="0" y1="${y0 + 6}" x2="${LEFT + 366}" y2="${y0 + 6}" stroke="var(--ink)" stroke-width="4"/>`;
  let waves = '<g class="waves">';
  for (let i = 0; i < 9; i++) {
    const x = LEFT - 300 + i * 72;
    const y = y0 + 26 + (i % 3) * 22;
    waves += `<path d="M${x} ${y} q9 -8 18 0 t18 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" style="animation-delay:-${i * 0.6}s"/>`;
  }
  waves += '</g>';
  return sea + waves + sand;
}

function palm(x, y, s, rand) {
  const lean = (rand() - 0.5) * 30;
  const tx = x + lean;
  const ty = y - 80 * s;
  const fronds = [-150, -110, -60, -20, 20].map((d) => {
    const r = (d * Math.PI) / 180;
    const ex = tx + Math.cos(r) * 42 * s;
    const ey = ty + Math.sin(r) * 42 * s + 18 * s;
    return `<path d="M${tx} ${ty} Q${(tx + ex) / 2} ${ty - 22 * s} ${ex} ${ey}" fill="none" stroke="var(--m-jungle-shade)" stroke-width="${9 * s}" stroke-linecap="round"/>`;
  }).join('');
  return `<g><path d="M${x} ${y} Q${x + lean * 0.2} ${y - 40 * s} ${tx} ${ty}" fill="none" stroke="var(--ink)" stroke-width="${10 * s}" stroke-linecap="round"/>
    <path d="M${x} ${y} Q${x + lean * 0.2} ${y - 40 * s} ${tx} ${ty}" fill="none" stroke="#b07a45" stroke-width="${6 * s}" stroke-linecap="round"/>${fronds}
    <circle cx="${tx + 3}" cy="${ty + 6}" r="${5 * s}" fill="#7a4b26" stroke="var(--ink)" stroke-width="2"/></g>`;
}

function decorations() {
  const rand = seededRandom('summit-scene');
  const out = [];
  const on = (a, u) => ({ x: edgeX(a) + 20 + u * (ridgeX(a) - edgeX(a) - 40), y: worldY(a) });
  const y0 = worldY(0);

  // Beach: palms, a parasol and a towel
  for (const [x, s] of [[405, 0.95], [545, 1.2]]) out.push(palm(x + LEFT, y0 - 3, s, rand));
  out.push(`<g transform="translate(${478 + LEFT} ${y0 - 4})"><line x1="0" y1="0" x2="6" y2="-64" stroke="var(--ink)" stroke-width="4"/>
    <path d="M-34 -52 Q6 -96 46 -64 Z" fill="var(--rope)" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>
    <path d="M6 -86 Q8 -70 4 -56" stroke="#fff" stroke-width="5" fill="none"/>
    <rect x="-56" y="-6" width="40" height="7" rx="2" fill="var(--signal)" stroke="var(--ink)" stroke-width="3"/></g>`);

  // Coastal grass and tropical trees
  for (let i = 0; i < 70; i++) {
    const a = 80 + rand() * 1720;
    const { x, y } = on(a, rand());
    if (a < 600) {
      out.push(`<path d="M${x + LEFT} ${y} l-5 -14 M${x + LEFT} ${y} l1 -18 M${x + LEFT} ${y} l7 -13" stroke="var(--m-jungle-shade)" stroke-width="3" stroke-linecap="round" fill="none"/>`);
    } else {
      const r = 14 + rand() * 14;
      const c = rand() > 0.5 ? 'var(--m-jungle)' : '#3c9a51';
      out.push(`<g><rect x="${x + LEFT - 3}" y="${y - r}" width="6" height="${r}" fill="#7a4b26" stroke="var(--ink)" stroke-width="2"/>
        <circle cx="${x + LEFT}" cy="${y - r * 1.4}" r="${r}" fill="${c}" stroke="var(--ink)" stroke-width="3"/>
        <circle cx="${x + LEFT - r * 0.35}" cy="${y - r * 1.7}" r="${r * 0.32}" fill="#fff" fill-opacity=".3"/></g>`);
    }
  }

  // Meadow: wildflowers and tufts
  const petals = ['#ff6f91', '#ffd23f', '#ffffff', '#a78bfa', '#ff9f1c'];
  for (let i = 0; i < 160; i++) {
    const a = 1850 + rand() * 1300;
    const { x, y } = on(a, rand());
    if (rand() < 0.3) {
      out.push(`<path d="M${x + LEFT} ${y} l-4 -11 M${x + LEFT} ${y} l1 -14 M${x + LEFT} ${y} l5 -10" stroke="var(--m-meadow-shade)" stroke-width="2.5" stroke-linecap="round" fill="none"/>`);
    } else {
      out.push(`<g><line x1="${x + LEFT}" y1="${y}" x2="${x + LEFT}" y2="${y - 9}" stroke="var(--m-meadow-shade)" stroke-width="2"/>
        <circle cx="${x + LEFT}" cy="${y - 11}" r="4" fill="${petals[i % petals.length]}" stroke="var(--ink)" stroke-width="1.5"/></g>`);
    }
  }

  // Treeline: pines thinning out with height, then boulders up into the snow
  for (let i = 0; i < 110; i++) {
    const a = 2900 + 1450 * Math.pow(rand(), 1.7);
    const { x, y } = on(a, rand() * 1.05);
    const h = 30 + rand() * 26 - (a - 2900) / 120;
    out.push(`<g><rect x="${x + LEFT - 3}" y="${y - 8}" width="6" height="8" fill="#6b4226"/>
      <path d="M${x + LEFT} ${y - h - 8} l${h * 0.36} ${h * 0.62} h-${h * 0.14} l${h * 0.22} ${h * 0.38} h-${h * 0.88} l${h * 0.22} -${h * 0.38} h-${h * 0.14} z" fill="#2f6b48" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/></g>`);
  }
  for (let i = 0; i < 60; i++) {
    const a = 3250 + rand() * 3300;
    const { x, y } = on(a, rand());
    const r = 8 + rand() * 14;
    out.push(`<path d="M${x + LEFT - r} ${y} q${r * 0.2} -${r * 1.1} ${r} -${r * 1.05} q${r * 0.9} 0 ${r} ${r * 1.05} z" fill="var(--m-rock-shade)" stroke="var(--ink)" stroke-width="2.5"/>
      <path d="M${x + LEFT - r * 0.4} ${y - r * 0.7} q${r * 0.3} -${r * 0.3} ${r * 0.6} -${r * 0.2}" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>`);
  }
  // Strata lines in the rock and ice
  for (let i = 0; i < 70; i++) {
    const a = 3300 + rand() * 5300;
    const { x, y } = on(a, rand());
    out.push(`<path d="M${x + LEFT} ${y} q22 -6 44 2" stroke="var(--ink)" stroke-opacity=".22" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);
  }
  // Snow drifts with blue shadows
  for (let i = 0; i < 40; i++) {
    const a = 4400 + rand() * 2100;
    const { x, y } = on(a, rand());
    const w = 30 + rand() * 40;
    out.push(`<path d="M${x + LEFT - w / 2} ${y} q${w / 2} -${w * 0.45} ${w} 0 z" fill="var(--m-snow)" stroke="var(--ink)" stroke-width="2"/>
      <path d="M${x + LEFT - w / 2 + 6} ${y - 2} q${w / 2 - 6} 6 ${w - 12} 0" stroke="var(--m-snow-shade)" stroke-width="4" fill="none"/>`);
  }
  // Seracs in the death zone
  for (let i = 0; i < 26; i++) {
    const a = 6500 + rand() * 2100;
    const { x, y } = on(a, rand());
    const h = 18 + rand() * 22;
    out.push(`<path d="M${x + LEFT - 10} ${y} l3 -${h} l9 -6 l8 ${h * 0.5} l4 ${h * 0.5 + 6} z" fill="var(--m-ice)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M${x + LEFT - 5} ${y - h + 4} l2 ${h * 0.6}" stroke="#fff" stroke-width="2.5"/>`);
  }
  // Summit cornice
  const sy = worldY(EVEREST);
  out.push(`<path d="M${SX + LEFT - 30} ${sy + 18} q30 -30 60 -4 q-20 4 -60 4 z" fill="#fff" stroke="var(--ink)" stroke-width="3"/>`);
  return out.join('');
}

function trailSvg() {
  const pts = [];
  for (let a = 0; a <= EVEREST; a += 12) pts.push(P(pathX(a), worldY(a)));
  const d = pts.join(' ');
  return `<polyline points="${d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
    <polyline points="${d}" fill="none" stroke="var(--ink)" stroke-width="3" stroke-dasharray="10 9" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function tentSvg(a, dir) {
  const x = pathX(a) + LEFT + 40 * dir;
  const y = worldY(a);
  return `<g class="camp">
    <path d="M${x - 24} ${y} L${x} ${y - 30} L${x + 24} ${y} Z" fill="var(--rope)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${x} ${y - 30} L${x - 6} ${y} L${x + 6} ${y} Z" fill="var(--ink)"/>
    <line x1="${x + 30}" y1="${y}" x2="${x + 30}" y2="${y - 46}" stroke="var(--ink)" stroke-width="3"/>
    <path d="M${x + 31} ${y - 45} l20 6 l-20 7 z" fill="var(--signal)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/></g>`;
}

function flagSvg(a) {
  const x = pathX(a) + LEFT + 18;
  const y = worldY(a);
  return `<g class="final-flag">
    <line x1="${x}" y1="${y + 2}" x2="${x}" y2="${y - 78}" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
    <path d="M${x + 2} ${y - 77} q18 -6 36 2 t34 -2 v30 q-16 6 -34 -2 t-36 2 z" fill="var(--signal)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${x + 16} ${y - 54} l9 -12 l7 8 l5 -5 l8 9 z" fill="var(--ink)"/></g>`;
}

const CLIMBER = `<svg class="climber-body" viewBox="0 0 56 72" aria-hidden="true">
  <ellipse cx="29" cy="69" rx="13" ry="3" fill="rgba(24,33,61,.28)"/>
  <rect x="12" y="25" width="13" height="22" rx="4" fill="var(--pack)" stroke="var(--ink)" stroke-width="2.5"/>
  <rect x="11" y="21" width="15" height="6" rx="3" fill="var(--signal)" stroke="var(--ink)" stroke-width="2"/>
  <g class="o o-swim">
    <rect x="24" y="47" width="5" height="17" rx="2" fill="var(--skin)" stroke="var(--ink)" stroke-width="2"/>
    <rect x="31" y="47" width="5" height="17" rx="2" fill="var(--skin)" stroke="var(--ink)" stroke-width="2"/>
    <rect x="22" y="64" width="8" height="3" rx="1.5" fill="var(--rope)" stroke="var(--ink)" stroke-width="1.5"/>
    <rect x="30" y="64" width="8" height="3" rx="1.5" fill="var(--rope)" stroke="var(--ink)" stroke-width="1.5"/>
    <rect x="21" y="27" width="17" height="21" rx="7" fill="var(--skin)" stroke="var(--ink)" stroke-width="2.5"/>
    <rect x="21" y="43" width="17" height="10" rx="3" fill="#12a3a0" stroke="var(--ink)" stroke-width="2.5"/>
    <path d="M24 44 v8 M28 44 v8" stroke="var(--signal)" stroke-width="2"/>
    <path d="M36 32 q6 6 5 13" fill="none" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
    <path d="M36 32 q6 6 5 13" fill="none" stroke="var(--skin)" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="o o-hike">
    <rect x="24" y="50" width="5" height="12" rx="2" fill="var(--skin)" stroke="var(--ink)" stroke-width="2"/>
    <rect x="31" y="50" width="5" height="12" rx="2" fill="var(--skin)" stroke="var(--ink)" stroke-width="2"/>
    <rect x="22" y="61" width="9" height="6" rx="2" fill="#6b4226" stroke="var(--ink)" stroke-width="2"/>
    <rect x="30" y="61" width="9" height="6" rx="2" fill="#6b4226" stroke="var(--ink)" stroke-width="2"/>
    <rect x="22" y="44" width="16" height="9" rx="2" fill="#c9a86a" stroke="var(--ink)" stroke-width="2.5"/>
    <rect x="21" y="27" width="17" height="19" rx="6" fill="var(--glacier)" stroke="var(--ink)" stroke-width="2.5"/>
    <line x1="42" y1="44" x2="47" y2="67" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M36 32 q6 6 6 12" fill="none" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
    <path d="M36 32 q6 6 6 12" fill="none" stroke="var(--glacier)" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="o o-fleece">
    <rect x="24" y="44" width="5" height="19" rx="2" fill="#4a5574" stroke="var(--ink)" stroke-width="2"/>
    <rect x="31" y="44" width="5" height="19" rx="2" fill="#4a5574" stroke="var(--ink)" stroke-width="2"/>
    <rect x="22" y="61" width="9" height="6" rx="2" fill="#6b4226" stroke="var(--ink)" stroke-width="2"/>
    <rect x="30" y="61" width="9" height="6" rx="2" fill="#6b4226" stroke="var(--ink)" stroke-width="2"/>
    <rect x="21" y="27" width="17" height="21" rx="6" fill="#d9573a" stroke="var(--ink)" stroke-width="2.5"/>
    <path d="M29.5 28 v19" stroke="var(--ink)" stroke-width="1.5"/>
    <line x1="42" y1="44" x2="47" y2="67" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M36 32 q6 6 6 12" fill="none" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
    <path d="M36 32 q6 6 6 12" fill="none" stroke="#d9573a" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="o o-jacket">
    <rect x="24" y="44" width="5" height="19" rx="2" fill="#2f3a5c" stroke="var(--ink)" stroke-width="2"/>
    <rect x="31" y="44" width="5" height="19" rx="2" fill="#2f3a5c" stroke="var(--ink)" stroke-width="2"/>
    <rect x="22" y="60" width="9" height="7" rx="2" fill="#18213d" stroke="var(--ink)" stroke-width="2"/>
    <rect x="30" y="60" width="9" height="7" rx="2" fill="#18213d" stroke="var(--ink)" stroke-width="2"/>
    <rect x="20" y="26" width="19" height="23" rx="7" fill="#1fa7a0" stroke="var(--ink)" stroke-width="2.5"/>
    <path d="M22 37 h15" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
    <line x1="42" y1="44" x2="47" y2="67" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M36 32 q6 6 6 12" fill="none" stroke="var(--ink)" stroke-width="7" stroke-linecap="round"/>
    <path d="M36 32 q6 6 6 12" fill="none" stroke="#1fa7a0" stroke-width="4" stroke-linecap="round"/>
    <circle cx="42" cy="44" r="3" fill="var(--signal)" stroke="var(--ink)" stroke-width="1.5"/>
  </g>
  <g class="o o-down">
    <rect x="23" y="44" width="7" height="19" rx="3" fill="#e4572e" stroke="var(--ink)" stroke-width="2"/>
    <rect x="30" y="44" width="7" height="19" rx="3" fill="#e4572e" stroke="var(--ink)" stroke-width="2"/>
    <rect x="21" y="60" width="10" height="8" rx="2" fill="var(--signal)" stroke="var(--ink)" stroke-width="2"/>
    <rect x="30" y="60" width="10" height="8" rx="2" fill="var(--signal)" stroke="var(--ink)" stroke-width="2"/>
    <rect x="18" y="25" width="23" height="25" rx="10" fill="#e4572e" stroke="var(--ink)" stroke-width="2.5"/>
    <path d="M20 33 q9.5 3 19 0 M20 40 q9.5 3 19 0" stroke="var(--ink)" stroke-width="1.5" fill="none"/>
    <path d="M42 40 l6 27" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
    <path d="M44 40 l-5 -3 h10 z" fill="var(--ink)"/>
    <path d="M37 32 q6 6 6 11" fill="none" stroke="var(--ink)" stroke-width="8" stroke-linecap="round"/>
    <path d="M37 32 q6 6 6 11" fill="none" stroke="#e4572e" stroke-width="5" stroke-linecap="round"/>
  </g>
  <circle cx="31" cy="17" r="8" fill="var(--skin)" stroke="var(--ink)" stroke-width="2.5"/>
  <circle cx="35" cy="16" r="1.3" fill="var(--ink)"/>
  <g class="o o-swim">
    <rect x="31" y="13" width="9" height="4" rx="2" fill="var(--ink)"/>
    <ellipse cx="30" cy="11" rx="14" ry="3" fill="var(--hat)" stroke="var(--ink)" stroke-width="2"/>
    <path d="M23 11 q7 -11 14 0 z" fill="var(--hat)" stroke="var(--ink)" stroke-width="2"/>
  </g>
  <g class="o o-hike"><path d="M23 13 q8 -11 16 0 z" fill="var(--rope)" stroke="var(--ink)" stroke-width="2"/><path d="M37 12 h8" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/></g>
  <g class="o o-fleece"><path d="M23 13 q8 -11 16 0 z" fill="#4a5574" stroke="var(--ink)" stroke-width="2"/><path d="M37 12 h8" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><path d="M24 25 q7 3 14 0" stroke="var(--signal)" stroke-width="4" fill="none" stroke-linecap="round"/></g>
  <g class="o o-jacket"><path d="M22.5 15 q8.5 -14 17 0 z" fill="var(--signal)" stroke="var(--ink)" stroke-width="2"/><circle cx="31" cy="5" r="3" fill="#fff" stroke="var(--ink)" stroke-width="1.5"/></g>
  <g class="o o-down">
    <path d="M21 20 q0 -15 10 -15 q11 0 11 15 q-3 -9 -11 -9 q-7 0 -10 9 z" fill="#e4572e" stroke="var(--ink)" stroke-width="2"/>
    <rect x="28" y="12" width="13" height="7" rx="3.5" fill="#7fd3f2" stroke="var(--ink)" stroke-width="2"/>
    <path d="M30 14 h4" stroke="#fff" stroke-width="1.5"/>
  </g>
</svg>`;

const FAR = `<svg viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 220 L90 150 L150 190 L240 90 L330 170 L420 120 L520 200 L610 80 L700 160 L800 110 L900 190 L990 100 L1080 170 L1200 130 V400 H0 Z" fill="#fff" fill-opacity=".38"/>
  <path d="M0 290 L110 210 L190 260 L300 170 L400 250 L470 220 L560 280 L660 190 L760 260 L850 230 L960 290 L1060 210 L1200 260 V400 H0 Z" fill="#18213d" fill-opacity=".16" stroke="#18213d" stroke-opacity=".35" stroke-width="3" stroke-linejoin="round"/>
</svg>`;

const CLOUDS = `<svg viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 140 q40 -50 90 -20 q30 -50 90 -16 q40 -40 90 0 q50 -46 110 -6 q40 -36 90 4 q60 -40 110 0 q40 -36 90 -2 q50 -40 110 2 q50 -30 90 10 q40 -26 90 0 q30 -20 60 0 V300 H0 Z" fill="#fff" stroke="#18213d" stroke-width="3" stroke-linejoin="round"/>
  <path d="M0 190 q60 -30 120 -6 q60 -30 130 0 q70 -28 140 2 q60 -24 130 0 q70 -26 140 0 q60 -22 120 2 q70 -24 140 0 q60 -20 120 0 q40 -14 60 0 V300 H0 Z" fill="#eef3f9"/>
</svg>`;

function fxLayers() {
  const rand = seededRandom('summit-fx');
  const pct = () => (rand() * 100).toFixed(1) + '%';
  const shimmer = Array.from({ length: 10 }, (_, i) => `<i style="left:${(1 + rand() * 16).toFixed(1)}%;top:${(68 + rand() * 28).toFixed(1)}%;animation-delay:-${(i * 0.37).toFixed(2)}s"></i>`).join('');
  const gulls = [0, 1, 2].map((i) => `<svg class="gull" viewBox="0 0 26 10" style="top:${12 + i * 9}%;animation-delay:-${i * 8}s;animation-duration:${24 + i * 6}s"><path d="M1 8 q6 -8 12 0 q6 -8 12 0"/></svg>`).join('');
  const clouds = [0, 1, 2].map((i) => `<svg class="cloud" viewBox="0 0 120 50" width="${140 - i * 25}" style="top:${8 + i * 12}%;animation-delay:-${i * 30}s"><path d="M10 40 q-8 -18 12 -20 q4 -16 22 -12 q10 -14 28 -2 q20 -6 24 12 q16 2 12 22 z" fill="#fff" stroke="#18213d" stroke-width="3" stroke-linejoin="round"/></svg>`).join('');
  const mist = [30, 55, 78].map((top, i) => `<i style="top:${top}%;animation-delay:-${i * 7}s;opacity:${0.5 + i * 0.15}"></i>`).join('');
  const flakes = Array.from({ length: 34 }, () => `<i class="flake" style="left:${pct()};animation-duration:${(5 + rand() * 6).toFixed(1)}s;animation-delay:-${(rand() * 10).toFixed(1)}s"></i>`).join('');
  const streaks = Array.from({ length: 9 }, () => `<i class="streak" style="top:${pct()};animation-duration:${(1.8 + rand() * 2).toFixed(1)}s;animation-delay:-${(rand() * 3).toFixed(1)}s"></i>`).join('');
  return {
    back: `<div class="fx" data-fx="aurora"><div class="aurora"></div></div>
      <div class="fx" data-fx="gulls">${gulls}</div>
      <div class="fx" data-fx="clouds">${clouds}</div>`,
    front: `<div class="fx fx-front shimmer" data-fx="shimmer">${shimmer}</div>
      <div class="fx fx-front mist" data-fx="mist">${mist}</div>
      <div class="fx fx-front" data-fx="snow">${flakes}</div>
      <div class="fx fx-front" data-fx="wind">${streaks}</div>`,
  };
}

// Small icons for the altitude facts, drawn in a 16 by 16 box.
const FACT_ICONS = {
  wave: '<path d="M1 10 q3.5 -4 7 0 t7 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M1 14 q3.5 -4 7 0 t7 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  columns: '<path d="M2 6 L8 2 L14 6 Z M3 7 v6 M6.5 7 v6 M9.5 7 v6 M13 7 v6 M2 14 h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  city: '<path d="M1 15 V8 h4 V4 h4 V9 h3 V6 h3 v9 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  plane: '<path d="M1 9 L15 4 L13 7 L8 9 L6 14 L5 10 Z" fill="currentColor"/>',
  train: '<rect x="3" y="2" width="10" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 7 h10 M5 15 l1.5 -3 M11 15 l-1.5 -3" stroke="currentColor" stroke-width="1.8"/>',
  house: '<path d="M2 8 L8 3 L14 8 M4 7 v7 h8 v-7 M7 14 v-4 h2 v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  tent: '<path d="M1 14 L8 3 L15 14 Z M8 3 V14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  spider: '<circle cx="8" cy="9" r="3" fill="currentColor"/><path d="M5 8 L1 5 M5 10 L1 12 M11 8 L15 5 M11 10 L15 12 M6 7 L4 2 M10 7 L12 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  bird: '<path d="M1 7 q3 -3 7 1 q4 -4 7 -1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  wind: '<path d="M1 5 h9 a2 2 0 1 0 -2 -2 M1 9 h12 a2 2 0 1 1 -2 2 M1 13 h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  bottle: '<rect x="5" y="4" width="6" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 4 V1.5 h2 V4" fill="none" stroke="currentColor" stroke-width="1.8"/>',
};

// ---------- the scene ----------

export function createScene(root) {
  const fx = fxLayers();
  root.innerHTML = `
    <div class="sky">${ANCHORS.map((z) => `<div class="sky-layer" data-zone="${z.zone}">${z.zone === 'beach' || z.zone === 'coast' ? '<div class="sun"></div>' : ''}${z.zone === 'summit' || z.zone === 'death' ? '<div class="stars"></div>' : ''}</div>`).join('')}</div>
    ${fx.back}
    <div class="far">${FAR}</div>
    <div class="world"><svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" aria-hidden="true">
      ${gradients()}${seaAndBeach()}${faceSvg()}${decorations()}${trailSvg()}<g class="camps"></g><g class="flags"></g></svg></div>
    <div class="clouds">${CLOUDS}</div>
    ${fx.front}
    <div class="ruler"><div class="ruler-track"></div><div class="here"><span class="here-text">0 m</span><svg width="14" height="22" viewBox="0 0 14 22"><path d="M2 1 L13 6 L2 11 Z" fill="var(--signal)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/><line x1="2" y1="1" x2="2" y2="21" stroke="var(--ink)" stroke-width="2.5"/></svg></div></div>
    <div class="climber" data-outfit="swim"><div class="climber-flip">${CLIMBER}</div></div>
    <div class="tags"></div>
    <div class="hud"><div class="hud-card"><div class="thermo"><div class="thermo-tube"><div class="thermo-fill"></div></div><div class="thermo-bulb"></div></div>
      <div><div class="hud-alt">0 m</div><div class="hud-sub"><span class="hud-temp">30 °C</span> <span class="hud-press"></span></div></div></div></div>
    <div class="note-toast" aria-hidden="true"></div>
    <div class="fact-strip" aria-hidden="true" hidden></div>`;

  const q = (s) => root.querySelector(s);
  const world = q('.world');
  const track = q('.ruler-track');
  const here = q('.here');
  const climber = q('.climber');
  const tags = q('.tags');
  const toast = q('.note-toast');
  const live = document.getElementById('scene-live');
  const layers = [...root.querySelectorAll('.sky-layer')];
  const fxEls = Object.fromEntries([...root.querySelectorAll('[data-fx]')].map((e) => [e.dataset.fx, e]));
  let view = { w: 0, h: 0, s: 1, ax: 0, ay: 0 };
  let altitude = 0;
  let toastTimer = null;
  let facts = [];

  function measure() {
    const r = root.getBoundingClientRect();
    const phone = r.width < 820 && window.innerWidth <= 820;
    const s = phone ? Math.max(0.5, Math.min(0.75, r.height / 420)) : Math.max(0.7, Math.min(1.2, r.height / 860));
    view = { w: r.width, h: r.height, s, ax: r.width * (phone ? 0.36 : 0.4), ay: r.height * (phone ? 0.66 : 0.62) };
    climber.style.left = view.ax + 'px';
    climber.style.top = view.ay + 'px';
    view.k = phone ? 0.72 : 1;
    climber.style.transformOrigin = '50% 100%';
    here.style.top = view.ay + 'px';
    buildRuler();
  }

  function buildRuler() {
    const s = view.s;
    let html = `<div class="ruler-line" style="top:${worldY(EVEREST) * s}px;height:${(worldY(0) - worldY(EVEREST)) * s}px"></div>`;
    for (let a = 0; a <= EVEREST; a += 500) html += `<div class="tick${a % 1000 === 0 ? ' major' : ''}" style="top:${worldY(a) * s - 1}px"></div>`;
    for (const m of MILESTONES) {
      html += `<div class="mark" data-h="${m.height}" style="top:${worldY(m.height) * s}px"><span><b>${m.name}</b>${formatMetres(m.height)}</span></div>`;
    }
    // Tags close in height are nudged apart so they never overlap.
    let prevY = Infinity;
    const order = [...facts.entries()].sort((x, y) => x[1].altitude - y[1].altitude);
    for (const [i, f] of order) {
      let y = worldY(Math.max(0, f.altitude)) * s;
      if (y > prevY - 40) y = prevY - 40;
      prevY = y;
      html += `<div class="fact${f.always ? ' is-on' : ''}" data-fact="${i}" style="top:${y}px"><svg viewBox="0 0 16 16" aria-hidden="true">${FACT_ICONS[f.icon] || ''}</svg><span>${f.text}</span></div>`;
    }
    track.innerHTML = html;
    markPassed();
  }

  function markPassed() {
    // Labels right beside the you-are-here flag step aside so they never collide.
    const gap = 26 / (M2PX * view.s);
    for (const m of track.querySelectorAll('.mark')) {
      const h = Number(m.dataset.h);
      m.classList.toggle('passed', altitude + 0.5 >= h);
      m.classList.toggle('near', Math.abs(h - altitude) < gap);
    }
    // Facts fade in as the climber passes them and stay. Phones show only the latest one.
    let latest = null;
    for (const el of track.querySelectorAll('.fact')) {
      const f = facts[Number(el.dataset.fact)];
      const passed = altitude + 0.5 >= f.altitude;
      el.classList.toggle('is-on', passed || !!f.always);
      if (passed && f.altitude > 0 && f.altitude < EVEREST + 1) latest = f;
    }
    const strip = q('.fact-strip');
    strip.hidden = !latest;
    if (latest && strip.dataset.alt !== String(latest.altitude)) { strip.dataset.alt = String(latest.altitude); strip.textContent = latest.text; }
  }

  function place(a, instant) {
    const s = view.s;
    const x = (pathX(a) + LEFT) * s;
    const y = worldY(a) * s;
    const lean = (1 - Math.min(1, a / 500)) * view.w * 0.2;
    const tx = view.ax + lean - x;
    const ty = view.ay - y;
    view.lean = lean;
    const set = () => {
      climber.style.transform = `translate3d(${lean.toFixed(1)}px, 0, 0) scale(${view.k})`;
      world.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${s})`;
      track.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
      const k = t(a);
      q('.far').style.transform = `translate3d(0, ${(k * 0.55 * view.h).toFixed(1)}px, 0)`;
      const high = Math.max(0, Math.min(1, (a - 6200) / (EVEREST - 6200)));
      q('.clouds').style.transform = `translate3d(0, ${((0.52 - 0.14 * high) * view.h).toFixed(1)}px, 0)`;
    };
    if (instant) {
      for (const el of [world, track, q('.far'), q('.clouds'), climber]) el.style.transition = 'none';
      set();
      void world.offsetWidth;
      for (const el of [world, track, q('.far'), q('.clouds'), climber]) el.style.transition = '';
    } else set();

    // Sky and weather
    const { w, lower, upper, f } = weights(a);
    layers.forEach((l) => { l.style.opacity = l.dataset.zone === lower ? '1' : l.dataset.zone === upper ? f.toFixed(3) : '0'; });
    const fxw = {
      shimmer: w.beach,
      gulls: w.beach + w.coast * 0.6,
      clouds: w.meadow + w.coast * 0.4 + w.treeline * 0.5,
      mist: w.treeline + w.snow * 0.3,
      snow: w.snow + w.death * 0.4,
      wind: w.death + w.summit * 0.4,
      aurora: w.death * 0.7 + w.summit * 0.35,
    };
    for (const [k, v] of Object.entries(fxw)) fxEls[k].style.opacity = Math.min(1, v).toFixed(2);
    q('.clouds').style.opacity = Math.max(0, Math.min(1, (a - 6000) / 1200)).toFixed(2);

    const zone = zoneAt(a).id;
    root.dataset.zone = zone;
    climber.dataset.outfit = OUTFITS[zone];
    climber.classList.toggle('facing-left', pathX(a + 6) < pathX(a));

    // Instruments
    const temp = temperatureAt(a);
    q('.hud-alt').textContent = formatMetres(a);
    q('.hud-temp').textContent = `${Math.round(temp)} °C`;
    q('.hud-press').textContent = `${Math.round(pressureAt(a))} hPa`;
    q('.thermo-fill').style.transform = `scaleY(${Math.max(0.06, Math.min(1, (temp + 32) / 64)).toFixed(3)})`;
    q('.thermo').classList.toggle('is-cold', temp < 0);
    q('.here-text').textContent = formatMetres(a);
    markPassed();
  }

  function setAltitude(a, instant = false) {
    altitude = Math.max(0, Math.min(EVEREST, a));
    place(altitude, instant);
  }

  function note(text) {
    toast.textContent = text;
    toast.classList.add('is-on');
    if (live) live.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3400);
  }

  function climb(from, to, gained) {
    setAltitude(to);
    climber.classList.remove('hop');
    void climber.offsetWidth;
    climber.classList.add('hop');
    if (gained > 0) {
      const tag = document.createElement('div');
      tag.className = 'plus';
      tag.textContent = `+${Math.round(gained)} m`;
      tag.style.left = view.ax + (view.lean || 0) + 'px';
      tag.style.top = view.ay - 96 + 'px';
      tags.append(tag);
      setTimeout(() => tag.remove(), 1200);
    }
    const passed = MILESTONES.filter((m) => m.height > 0 && from + 0.5 < m.height && to + 0.5 >= m.height);
    if (passed.length) {
      const m = passed[passed.length - 1];
      note(m.height === EVEREST ? `On top of Everest, ${formatMetres(m.height)}` : `Past ${m.name}, ${formatMetres(m.height)}`);
    }
  }

  function setCamps(list) {
    q('.camps').innerHTML = list.filter((a) => a > 1).map((a) => tentSvg(a, pathX(a + 6) < pathX(a) ? 1 : -1)).join('');
  }

  function plantFlag(a) {
    q('.flags').innerHTML = flagSvg(a);
  }

  // A fast run up the whole climb, then everything settles.
  function replay(target, onDone) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || target < 1) { setAltitude(target, true); plantFlag(target); onDone(); return () => {}; }
    q('.flags').innerHTML = '';
    for (const el of [world, track, q('.far'), q('.clouds')]) el.style.transition = 'none';
    setAltitude(0, true);
    const start = performance.now();
    const DURATION = 4000;
    let raf = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      for (const el of [world, track, q('.far'), q('.clouds')]) el.style.transition = '';
      setAltitude(target, true);
      plantFlag(target);
      onDone();
    };
    const frame = (now) => {
      const k = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - k, 2.2);
      place(target * eased, false);
      if (k < 1) raf = requestAnimationFrame(frame); else finish();
    };
    raf = requestAnimationFrame(frame);
    return finish;
  }

  new ResizeObserver(() => { measure(); place(altitude, true); }).observe(root);
  measure();
  setAltitude(0, true);
  function setFacts(list) {
    facts = list.map((f) => ({ ...f, always: f.altitude > EVEREST }));
    buildRuler();
  }

  return { setAltitude, climb, setCamps, plantFlag, replay, note, setFacts, get altitude() { return altitude; } };
}
