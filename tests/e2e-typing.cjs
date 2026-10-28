// Typing behaviour in the real page: instant accepts, the short wait when a longer answer is
// possible, absorbing the rest of a name just accepted, and never losing typed letters.
// Needs a local server on 8123: node tests/e2e-typing.cjs
const { chromium } = require('playwright');
const crypto = require('crypto');

const BASE = process.env.BASE || 'http://localhost:8123/';
const keyOf = (id) => crypto.createHash('sha256').update('summit-prompt:' + id).digest('hex').slice(0, 12);
const fail = [];
const check = (ok, what) => { if (!ok) fail.push(what); console.log(`${ok ? 'pass' : 'FAIL'}  ${what}`); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => { try { localStorage.setItem('summit:seen-help', 'true'); } catch { /* blank page */ } });
  const chips = () => page.$$eval('#found-list li', (els) => els.map((e) => e.textContent));
  async function open(id) {
    await page.goto('about:blank');
    await page.goto(`${BASE}index.html#test-${keyOf(id)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#ready:not([hidden])');
    await page.locator('#start').dispatchEvent('click');
    await page.waitForSelector('#guess:not([disabled])', { timeout: 15000 });
  }

  await open('countries-world');
  await page.keyboard.type('Kenya', { delay: 40 });
  check((await chips())[0] === 'Kenya' && (await page.inputValue('#guess')) === '', 'an exact answer is taken on the last keystroke');
  await page.keyboard.type('Niger', { delay: 40 });
  check(!(await chips()).includes('Niger'), 'Niger waits, because Nigeria is still possible');
  await page.waitForTimeout(400);
  check((await chips())[0] === 'Niger', 'Niger is taken after a short pause');
  await page.keyboard.type('Nigeria', { delay: 40 });
  check((await chips())[0] === 'Nigeria', 'typing straight on gives Nigeria');
  await page.keyboard.type('Mozambiqe', { delay: 40 });
  await page.waitForTimeout(450);
  check((await chips())[0] === 'Mozambique', 'a typo is corrected after a pause');
  await page.keyboard.type('Austrlia', { delay: 40 });
  await page.waitForTimeout(450);
  check((await page.inputValue('#guess')) === 'Austrlia', 'a pause never rejects; an unclear typo waits for Enter');
  await page.keyboard.press('Enter');
  check((await page.inputValue('#guess')) === '' && /Too close/.test(await page.textContent('#feedback')), 'Enter on an unclear typo says it is too close to call');
  check(await page.evaluate(() => document.activeElement.id === 'guess'), 'the box keeps focus');

  await open('best-selling-games');
  await page.keyboard.type('Stardew Valley', { delay: 30 });
  await page.waitForTimeout(400);
  let c = await chips();
  check(c.length === 1 && c[0] === 'Stardew Valley' && (await page.inputValue('#guess')) === '', 'typing a full name fast gives one chip and an empty box');
  await page.keyboard.type('Stardew', { delay: 30 });
  await page.waitForTimeout(400);
  check((await page.inputValue('#guess')) === '' && /Already/.test(await page.textContent('#feedback')), 'a short form after a pause is taken (here, already found)');
  await page.keyboard.type('Minecraft', { delay: 30 });
  await page.waitForTimeout(300);
  await page.keyboard.type('Terraria', { delay: 30 });
  await page.waitForTimeout(400);
  c = await chips();
  check(c.includes('Minecraft') && c.includes('Terraria'), 'a different answer straight after is never swallowed');

  check(!errors.length, `no console errors${errors.length ? ': ' + errors.join('; ') : ''}`);
  await browser.close();
  console.log(fail.length ? `\n${fail.length} failed` : '\nAll typing checks passed');
  process.exit(fail.length ? 1 : 0);
})();
