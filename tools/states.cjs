// Screenshots of the answer box states on a phone: node tools/states.cjs outDir
const { chromium } = require('playwright');
const OUT = process.argv[2] || 'screenshots';
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.addInitScript(() => localStorage.setItem('summit:seen-help', 'true'));
  await page.goto('http://localhost:8123/index.html#test-countries-world');
  await page.waitForSelector('#ready:not([hidden])');
  await page.click('#start', { force: true });
  await page.waitForSelector('#guess:not([disabled])', { timeout: 6000 });
  const say = async (t) => { await page.fill('#guess', t); await page.press('#guess', 'Enter'); };
  for (const t of ['Kenya', 'Peru', 'Chad', 'Japan', 'France']) await say(t);
  await say('Mozambiqe');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/state-autocorrected.png` });
  await say('Kenya'); await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/state-duplicate.png` });
  await say('Austrlia'); await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/state-ambiguous.png` });
  await say('Narnia'); await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/state-wrong.png` });
  const focused = await page.evaluate(() => document.activeElement.id);
  console.log('focus stays on', focused, errs.length ? errs : 'no errors');
  await b.close();
})();
