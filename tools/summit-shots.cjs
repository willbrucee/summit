// The Everest celebration and the K2 note, at desktop and phone sizes, with and without motion.
// Seeds a finished day in storage, then checks: the sequence plays once and ends by itself in
// about 4.5 seconds, Skip works, reduced motion shows a still frame with Continue, a reload
// the same day does not replay it, the share text and image are gold, and K2 gets its note.
// Needs a local server on 8123: node tools/summit-shots.cjs outDir
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:8123/';
const OUT = process.argv[2] || 'screenshots';
const fail = [];
const check = (ok, what) => { if (!ok) fail.push(what); console.log(`${ok ? 'pass' : 'FAIL'}  ${what}`); };

async function seed(page, share) {
  // A finished day where every round found `share` of its target ('k2' lands just past K2).
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#ready:not([hidden]), #finish:not([hidden])');
  await page.evaluate(async (share) => {
    const { promptsForDate, dateKey, dayNumber } = await import('./js/daily.js');
    const index = await (await fetch('data/index.json')).json();
    const schedule = await (await fetch('data/schedule.json')).json();
    const today = dateKey();
    const chosen = promptsForDate(today, schedule, index.prompts);
    const { roundMetres } = await import('./js/scoring.js');
    const counts = chosen.map((m) => Math.ceil(m.target * share));
    if (share === 'k2') {
      // Four rounds a little past the target, then the last round picked to land between K2 and Everest.
      for (let i = 0; i < 4; i++) counts[i] = chosen[i].target + 1;
      const base = counts.slice(0, 4).reduce((s, n, i) => s + roundMetres(n, chosen[i].target), 0);
      counts[4] = [...Array(chosen[4].target + 1).keys()].find((n) => base + roundMetres(n, chosen[4].target) >= 8620) ?? chosen[4].target;
    }
    const rounds = await Promise.all(chosen.map(async (m, i) => {
      const p = await (await fetch(`data/p/${m.id}.json`)).json();
      const n = Math.min(p.size, counts[i]);
      return { id: m.id, status: 'done', startedAt: 1, found: [...Array(n).keys()], times: [...Array(n).keys()].map((k) => 1000 * k), fixed: 0, wrong: [] };
    }));
    localStorage.clear();
    localStorage.setItem('summit:seen-help', 'true');
    localStorage.setItem('summit:day:' + today, JSON.stringify({ mode: 'daily', date: today, day: dayNumber(today), ids: chosen.map((m) => m.id), current: 4, rounds, done: true }));
  }, share);
}

(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }]) {
    for (const reduced of [false, true]) {
      const tag = `${vp.name}${reduced ? '-reduced' : ''}`;
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

      await seed(page, 1.2);
      await page.reload();
      await page.waitForSelector('#celebrate:not([hidden])', { timeout: 5000 });
      const t0 = Date.now();
      check((await page.textContent('#celebrate-alt')) === '8,849 m', `${tag}: banner shows 8,849 m`);
      check((await page.textContent('#celebrate-skip')) === (reduced ? 'Continue' : 'Skip'), `${tag}: button says ${reduced ? 'Continue' : 'Skip'}`);
      check(await page.evaluate(() => document.activeElement.id === 'celebrate-skip'), `${tag}: focus moves to the button`);
      if (!reduced) {
        for (const ms of [400, 1400, 2400, 3300, 4300]) {
          await page.waitForTimeout(ms - (Date.now() - t0));
          await page.screenshot({ path: `${OUT}/summit-${tag}-${String(ms).padStart(4, '0')}ms.png` });
        }
        await page.waitForSelector('#celebrate', { state: 'hidden', timeout: 3000 });
        const took = (Date.now() - t0) / 1000;
        check(took >= 4 && took <= 5.6, `${tag}: plays for ${took.toFixed(1)} s and closes itself`);
      } else {
        await page.waitForTimeout(800);
        await page.screenshot({ path: `${OUT}/summit-${tag}-still.png` });
        const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.celebrate-badge')).animationName);
        check(anim === 'none', `${tag}: no animation with reduced motion`);
        check(await page.isVisible('#celebrate'), `${tag}: still frame waits for the player`);
        await page.locator('#celebrate-skip').click();
        check(await page.isHidden('#celebrate'), `${tag}: Continue closes it`);
      }
      check(await page.evaluate(() => document.getElementById('finish').classList.contains('is-gold')), `${tag}: gold finish`);
      check((await page.inputValue('#share-text')).includes('★ Summited Everest ★'), `${tag}: gold share text`);
      await page.screenshot({ path: `${OUT}/summit-${tag}-finish.png`, fullPage: false });

      await page.reload();
      await page.waitForSelector('#finish:not([hidden])');
      await page.waitForTimeout(600);
      check(await page.isHidden('#celebrate'), `${tag}: no replay on the same day`);

      if (vp.name === 'desktop' && !reduced) {
        // Skip, on a fresh day's first view.
        await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('summit:celebrated')) localStorage.removeItem(k); });
        await page.reload();
        await page.waitForSelector('#celebrate:not([hidden])');
        await page.waitForTimeout(700);
        await page.locator('#celebrate-skip').click();
        check(await page.isHidden('#celebrate'), `${tag}: Skip closes it early`);
        // The gold image.
        const png = await page.evaluate(async () => {
          const { drawCard } = await import('./js/card.js');
          return drawCard({ day: 1, altitude: 8849, rounds: [1, 2, 3, 4, 5].map(() => ({ metres: 1770 })), title: 'Everest summiteer' }).toDataURL('image/png');
        });
        require('fs').writeFileSync(`${OUT}/summit-card-gold.png`, Buffer.from(png.split(',')[1], 'base64'));
        check(png.length > 10000, 'gold share image draws');
      }

      // K2: past 8,611 m but short of the top.
      await seed(page, 'k2');
      await page.reload();
      await page.waitForSelector('#finish:not([hidden])');
      const alt = await page.textContent('#finish-altitude');
      const metres = Number(alt.replace(/[^0-9]/g, ''));
      if (metres >= 8611 && metres < 8849) {
        check(await page.isVisible('#finish-k2'), `${tag}: K2 note at ${alt}`);
        check(await page.isHidden('#celebrate'), `${tag}: no celebration below Everest`);
        await page.screenshot({ path: `${OUT}/summit-${tag}-k2.png` });
      } else {
        check(false, `${tag}: seeded K2 day landed at ${alt}, adjust the share`);
      }
      check(!errors.length, `${tag}: no console errors${errors.length ? ': ' + errors.join('; ') : ''}`);
      await ctx.close();
    }
  }
  await browser.close();
  console.log(fail.length ? `\n${fail.length} failed` : '\nAll summit checks passed');
  process.exit(fail.length ? 1 : 0);
})();
