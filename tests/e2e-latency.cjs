// Answer latency: time from the last keypress (or Enter) to the frame that shows the chip,
// with the CPU throttled 4x like a mid-range phone. Plays two big prompts in test mode.
// Needs a local server on 8123: node tests/e2e-latency.cjs [--json]
// Exits with an error if the 95th percentile for normal answers is 50 ms or more.
const { chromium } = require('playwright');
const crypto = require('crypto');

const BASE = process.env.BASE || 'http://localhost:8123/';
const LIMIT_MS = Number(process.env.LIMIT_MS || 50);
const keyOf = (id) => crypto.createHash('sha256').update('summit-prompt:' + id).digest('hex').slice(0, 12);
const PROMPTS = ['countries-world', 'best-selling-games'];

const pct = (arr, q) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(q * a.length))] : NaN; };

(async () => {
  const { buildIndex, canAutoAccept } = await import('../js/matcher.js');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const cdp = await page.context().newCDPSession(page);
  await page.addInitScript(() => { try { localStorage.setItem('summit:seen-help', 'true'); } catch { /* about:blank */ } });
  const normal = [];
  const typos = [];

  for (const id of PROMPTS) {
    const key = keyOf(id);
    const p = await (await page.request.get(`${BASE}data/p/${key}.json`)).json();
    const index = buildIndex(p.answers);
    // Normal answers: typed in full, nothing longer starts with them.
    const picks = p.answers.filter((a) => /^[\w ]+$/.test(a.label) && a.label.length <= 16 && canAutoAccept(index, a.label)).slice(0, 14);
    // Typos: a long answer with one letter dropped, sent with Enter.
    const typoPicks = p.answers.filter((a) => /^[A-Za-z ]+$/.test(a.label) && a.label.length >= 9 && !picks.includes(a)).slice(0, 6)
      .map((a) => a.label.slice(0, 3) + a.label.slice(4));

    // A fresh page per prompt, so nothing from the last round lingers.
    await page.goto('about:blank');
    await page.goto(`${BASE}index.html#test-${key}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#ready:not([hidden])');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.locator('#start').dispatchEvent('click');
    await page.waitForSelector('#guess:not([disabled])', { timeout: 15000 });
    await page.evaluate(() => {
      window.__lat = [];
      window.__lastKey = 0;
      document.addEventListener('keydown', () => { window.__lastKey = performance.now(); }, true);
      new MutationObserver((list) => {
        const now = performance.now();
        // Count to the frame that paints the chip, not just the DOM change.
        const from = window.__lastKey;
        for (const m of list) for (const n of m.addedNodes) if (n.nodeName === 'LI') requestAnimationFrame((t) => window.__lat.push(Math.max(now, t) - from));
      }).observe(document.getElementById('found-list'), { childList: true });
    });
    const chips = () => page.evaluate(() => document.querySelectorAll('#found-list li').length);
    for (const a of picks) {
      const before = await chips();
      await page.keyboard.type(a.label, { delay: 25 });
      try { await page.waitForFunction((n) => document.querySelectorAll('#found-list li').length > n, before, { timeout: 2500 }); } catch { console.log('  not accepted while typing:', a.label, '|', await page.textContent('#feedback'), '|', await page.inputValue('#guess')); await page.keyboard.press('Enter'); }
      // Paint, then read the time taken.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    }
    const got = await page.evaluate(() => window.__lat.splice(0));
    normal.push(...got);
    for (const t of typoPicks) {
      const before = await chips();
      await page.keyboard.type(t, { delay: 25 });
      await page.keyboard.press('Enter');
      try { await page.waitForFunction((n) => document.querySelectorAll('#found-list li').length > n, before, { timeout: 2500 }); } catch { console.log('  typo not accepted:', t); }
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    }
    typos.push(...(await page.evaluate(() => window.__lat.splice(0))));
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
  await browser.close();
  const f = (x) => `${x.toFixed(1)} ms`;
  const result = {
    normal: { n: normal.length, median: pct(normal, 0.5), p95: pct(normal, 0.95) },
    typo: { n: typos.length, median: pct(typos, 0.5), p95: pct(typos, 0.95) },
  };
  console.log(`Normal answers (${result.normal.n}): median ${f(result.normal.median)}, 95th percentile ${f(result.normal.p95)}`);
  console.log(`Typos with Enter (${result.typo.n}): median ${f(result.typo.median)}, 95th percentile ${f(result.typo.p95)}`);
  if (errors.length) console.log('Console errors: ' + errors.join('; '));
  const ok = result.normal.n >= 20 && result.normal.p95 < LIMIT_MS && !errors.length;
  console.log(ok ? `Latency target met (95th percentile under ${LIMIT_MS} ms)` : `Latency target NOT met (limit ${LIMIT_MS} ms)`);
  process.exit(ok ? 0 : 1);
})();
