// The Everest celebration: plays once, about 4.5 seconds, and can be skipped.
// With reduced motion the final frame shows still until the player continues.
import { formatMetres } from './scoring.js';

const PLAY_MS = 4800;

export function celebrate(altitude, { reducedMotion = false, announce = () => {} } = {}) {
  const el = document.getElementById('celebrate');
  const skip = document.getElementById('celebrate-skip');
  if (!el) return Promise.resolve();
  document.getElementById('celebrate-alt').textContent = formatMetres(altitude);
  skip.textContent = reducedMotion ? 'Continue' : 'Skip';
  // Portrait screens fill the width with the peak; wide screens show the whole range.
  el.querySelector('.celebrate-scene').setAttribute('preserveAspectRatio', window.innerWidth < window.innerHeight ? 'xMidYMax slice' : 'xMidYMax meet');
  el.hidden = false;
  el.classList.toggle('is-playing', !reducedMotion);
  const opener = document.activeElement;
  skip.focus();
  announce(`Summit! You are on top of Everest, ${formatMetres(altitude)}.`);
  return new Promise((resolve) => {
    let timer = null;
    const done = () => {
      clearTimeout(timer);
      el.classList.remove('is-playing');
      el.hidden = true;
      skip.removeEventListener('click', done);
      document.removeEventListener('keydown', onKey);
      if (opener && opener.focus) opener.focus();
      resolve();
    };
    const onKey = (e) => { if (e.key === 'Escape') done(); };
    skip.addEventListener('click', done);
    document.addEventListener('keydown', onKey);
    if (!reducedMotion) timer = setTimeout(done, PLAY_MS);
  });
}
