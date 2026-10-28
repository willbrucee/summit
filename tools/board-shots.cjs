// Screenshots of the answer board after a test round: node tools/board-shots.cjs outDir [promptId]
const { chromium } = require('playwright');
const keyOf = (id) => require('crypto').createHash('sha256').update('summit-prompt:' + id).digest('hex').slice(0, 12);
const OUT = process.argv[2] || 'screenshots';
const ID = process.argv[3] || 'countries-africa';
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true }]) {
    const page = await b.newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.clock.install();
    await page.addInitScript(() => localStorage.setItem('summit:seen-help', 'true'));
    await page.goto(`http://localhost:8123/index.html#test-${keyOf(ID)}`);
    await page.waitForSelector('#ready:not([hidden])');
    await page.locator('#start').dispatchEvent('click');
    await page.clock.runFor(3500);
    for (const t of ['Kenya', 'Nigeria', 'Egypt', 'Ghana', 'Morocco', 'Mozambiqe', 'Chad', 'Mali', 'Senegal']) {
      await page.fill('#guess', t); await page.press('#guess', 'Enter'); await page.clock.runFor(1300);
    }
    await page.clock.runFor(31000);
    await page.waitForSelector('#result:not([hidden])');
    await page.locator('#result-board .tile.is-missed').nth(2).dispatchEvent('click');
    await page.screenshot({ path: `${OUT}/board-${vp.name}.png`, fullPage: false });
    await page.locator('#result-board .board-tab').nth(1).dispatchEvent('click');
    await page.screenshot({ path: `${OUT}/board-${vp.name}-easy.png` });
    await page.close();
  }
  console.log(errs.length ? errs : 'no errors');
  await b.close();
})();
