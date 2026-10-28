// Scene screenshots at set altitudes: node tools/shots.cjs outDir
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8123/';
const OUT = process.argv[2] || 'screenshots';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const problems = [];
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`${vp.name}: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`${vp.name}: ${e.message}`));
    await page.addInitScript(() => { try { localStorage.setItem('summit:seen-help', 'true'); } catch {} });
    await page.goto(BASE + 'index.html');
    await page.waitForSelector('#ready:not([hidden])');
    await page.evaluate(() => document.fonts.ready);
    for (const alt of (process.env.ALTS || "0,4500,8849").split(",").map(Number)) {
      await page.evaluate((a) => window.summitScene.setAltitude(a, true), alt);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, `scene-${vp.name}-${alt}.png`) });
    }
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) problems.push(vp.name + ': horizontal scroll');
    await ctx.close();
  }
  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'no console problems');
})();
