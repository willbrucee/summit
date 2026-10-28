// The share image: a 1080 by 1350 card of the day's climb, never the answers.
// Everest days get the gold card.
import { EVEREST, ROUNDS, formatMetres, milestoneAt } from './scoring.js';

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function drawCard({ day, altitude, rounds, title }) {
  const W = 1080;
  const H = 1350;
  const gold = altitude + 0.5 >= EVEREST;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const ink = css('--ink');
  const font = (w, px) => `${w} ${px}px ${css('--font-display') || 'sans-serif'}`;

  g.fillStyle = gold ? css('--gold') : css('--paper');
  g.fillRect(0, 0, W, H);
  // Gold days get sunrise rays behind the peak.
  if (gold) {
    g.fillStyle = css('--dawn-glow');
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(540, 600);
      g.arc(540, 600, 760, a, a + Math.PI / 18);
      g.closePath();
      g.fill();
    }
  }
  // The mountain, bold outline and flat colour.
  g.lineJoin = 'round';
  g.lineWidth = 14;
  g.strokeStyle = ink;
  g.fillStyle = gold ? css('--paper') : css('--m-snow-shade');
  g.beginPath();
  g.moveTo(120, 1250); g.lineTo(540, 560); g.lineTo(960, 1250); g.closePath();
  g.fill(); g.stroke();
  // Climbed share, as a band from the base.
  const share = Math.min(1, altitude / EVEREST);
  g.save();
  g.beginPath(); g.moveTo(120, 1250); g.lineTo(540, 560); g.lineTo(960, 1250); g.closePath(); g.clip();
  g.fillStyle = gold ? css('--gold-deep') : css('--glacier');
  g.fillRect(0, 1250 - 690 * share, W, 690 * share + 20);
  g.restore();
  // A snow cap, always.
  g.fillStyle = css('--m-snow');
  g.beginPath(); g.moveTo(540, 560); g.lineTo(662, 760); g.lineTo(610, 730); g.lineTo(560, 780); g.lineTo(510, 728); g.lineTo(460, 770); g.lineTo(418, 760); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(120, 1250); g.lineTo(540, 560); g.lineTo(960, 1250); g.closePath(); g.stroke();
  // Flag at the top on Everest days.
  if (gold) {
    g.beginPath(); g.moveTo(540, 560); g.lineTo(540, 430); g.stroke();
    g.fillStyle = css('--rope');
    g.beginPath(); g.moveTo(546, 436); g.lineTo(660, 466); g.lineTo(546, 500); g.closePath(); g.fill(); g.stroke();
  }

  g.fillStyle = ink;
  g.textAlign = 'left';
  g.font = font(800, 56);
  g.fillText(`Summit #${day}`, 80, 120);
  g.font = font(800, 150);
  g.fillText(formatMetres(altitude), 80, 270);
  g.font = font(700, 54);
  const m = milestoneAt(altitude);
  g.fillText(gold ? 'Top of Everest' : m.height === 0 ? 'Still on the beach' : `Past ${m.name}`, 80, 350);
  if (title) { g.font = font(600, 44); g.fillText(title, 80, 410); }

  // Five round bars.
  rounds.forEach((r, i) => {
    const x = 80 + i * 190;
    const y = 1278;
    const fill = Math.min(1, r.metres / (EVEREST / ROUNDS));
    g.lineWidth = 8;
    g.fillStyle = gold ? css('--paper') : css('--paper-2');
    g.fillRect(x, y, 160, 40);
    g.fillStyle = gold ? css('--gold-deep') : css('--glacier');
    g.fillRect(x, y, 160 * fill, 40);
    g.strokeRect(x, y, 160, 40);
  });
  return c;
}

export function cardBlob(opts) {
  return new Promise((resolve) => drawCard(opts).toBlob(resolve, 'image/png'));
}
