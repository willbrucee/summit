// Browser check: plays a full day at phone and desktop sizes, fails on console errors.
// Needs a local server: python3 -m http.server 8123   then: node tools/smoke.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:8123/';
const OUT = process.argv[2] || 'screenshots';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1366, height: 860 },
];

let lastProblems = [];
async function run(vp, reduced) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const problems = [];
  lastProblems = problems;
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url()));
  await page.clock.install();
  const tag = `${vp.name}${reduced ? '-reduced' : ''}`;
  const shot = (name) => page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`) });

  const index = await (await page.request.get(BASE + 'data/index.json')).json();
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#help[open]');
  await shot('01-help');
  await page.click('#help-close', { force: true });
  await page.waitForSelector('#ready:not([hidden])');
  await shot('02-ready');

  for (let round = 0; round < 5; round++) {
    await page.waitForSelector('#ready:not([hidden])');
    const text = await page.textContent('#ready-prompt');
    const meta = index.prompts.find((p) => p.text === text);
    const prompt = await (await page.request.get(BASE + `data/p/${meta.id}.json`)).json();
    await page.locator('#start').dispatchEvent('click');
    await page.clock.runFor(1200);
    if (round === 0) await shot('03-countdown');
    await page.clock.runFor(2000);
    // A mix: right answers, a typo, a repeat and a miss.
    const answers = prompt.answers.slice(0, 4 + round * 3).map((a) => a.label);
    for (const a of answers) { await page.fill('#guess', a); await page.press('#guess', 'Enter'); }
    await page.fill('#guess', answers[0]); await page.press('#guess', 'Enter');
    await page.fill('#guess', 'zzqqxx'); await page.press('#guess', 'Enter');
    if (round === 0) {
      await page.clock.runFor(26500);
      await shot('04-playing-low-time');
    }
    const found = await page.locator('#found-list li').count();
    if (found !== answers.length) problems.push(`round ${round + 1}: expected ${answers.length} chips, got ${found}`);
    await page.clock.runFor(31000);
    await page.waitForSelector('#result:not([hidden])');
    if (round === 0) {
      await page.click('#result-board .tile.is-missed', { force: true });
      await shot('05-result');
      // A refresh after a round has started must not allow a replay.
      await page.reload();
      await page.waitForSelector('#result:not([hidden])');
    }
    await page.locator('#next').dispatchEvent('click');
  }
  await page.waitForSelector('#finish:not([hidden])');
  await page.clock.runFor(6000);
  await shot('06-finish');
  const share = await page.inputValue('#share-text');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) problems.push('horizontal scroll');
  await browser.close();
  return { tag, problems, share };
}

(async () => {
  let failed = false;
  for (const vp of VIEWPORTS) {
    for (const reduced of [false, true]) {
      let r;
      try { r = await run(vp, reduced); } catch (e) { console.log(`${vp.name}${reduced ? '-reduced' : ''} crashed: ${e.message.split('\n')[0]} | ${lastProblems.join('; ')}`); failed = true; continue; }
      console.log(`${r.tag}: ${r.problems.length ? r.problems.join('\n  ') : 'no problems'}`);
      if (r.problems.length) failed = true;
      if (!reduced && vp.name === 'phone') console.log(r.share);
    }
  }
  process.exit(failed ? 1 : 0);
})();
