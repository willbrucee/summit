// Round cards, the summary callout, stat tiles and the coloured answer board, at 1440x900 and
// 390x844, from a seeded finished day with mixed rounds. Also checks the phone layout never
// scrolls sideways and every card says its verdict in words.
// Needs a local server on 8123: node tools/cards-shots.cjs outDir
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:8123/';
const OUT = process.argv[2] || 'screenshots';
const fail = [];
const check = (ok, what) => { if (!ok) fail.push(what); console.log(`${ok ? 'pass' : 'FAIL'}  ${what}`); };
const SHARES = [1.1, 0.6, 0.3, 0.9, 0.5];

(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + 'index.html');
    await page.waitForSelector('#ready:not([hidden])');
    await page.evaluate(async (shares) => {
      const { promptsForDate, dateKey, dayNumber } = await import('./js/daily.js');
      const index = await (await fetch('data/index.json')).json();
      const schedule = await (await fetch('data/schedule.json')).json();
      const today = dateKey();
      const chosen = promptsForDate(today, schedule, index.prompts);
      const rounds = await Promise.all(chosen.map(async (m, i) => {
        const p = await (await fetch(`data/p/${m.id}.json`)).json();
        const n = Math.min(p.size, Math.round(m.target * shares[i]));
        return { id: m.id, status: 'done', startedAt: 1, found: [...Array(n).keys()], times: [...Array(n).keys()].map((k) => 2500 * k), fixed: 0, wrong: [] };
      }));
      localStorage.clear();
      localStorage.setItem('summit:seen-help', 'true');
      localStorage.setItem('summit:day:' + today, JSON.stringify({ mode: 'daily', date: today, day: dayNumber(today), ids: chosen.map((m) => m.id), current: 4, rounds, done: true }));
    }, SHARES);
    await page.reload();
    await page.waitForSelector('#finish:not([hidden])');
    await page.waitForTimeout(500);

    const cards = await page.$$eval('#finish-rows .round-card', (els) => els.map((e) => ({ round: e.dataset.round, verdict: e.querySelector('.rc-verdict').textContent, found: e.querySelector('.rc-found').textContent })));
    check(cards.length === 5, `${vp.name}: five round cards`);
    check(cards.every((c) => ['Strong', 'Steady', 'Slow start'].includes(c.verdict)), `${vp.name}: every card names its verdict (${cards.map((c) => c.verdict).join(', ')})`);
    check(new Set(cards.map((c) => c.round)).size === 5, `${vp.name}: each round has its own colour`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(!overflow, `${vp.name}: no sideways scroll`);
    const tiles = await page.$$eval('#finish-stats .stat', (els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height })));
    check(tiles.length === 3 && tiles.every((t) => t.w > 90), `${vp.name}: stat tiles fit (${tiles.map((t) => Math.round(t.w)).join(', ')} px wide)`);

    const shot = async (sel, name) => {
      // Scroll the panel, as a player would; the page itself never scrolls.
      await page.evaluate((s) => {
        const el = document.querySelector(s);
        const body = el.closest('.panel-body');
        body.scrollTop += el.getBoundingClientRect().top - body.getBoundingClientRect().top - 8;
      }, sel);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${OUT}/cards-${vp.name}-${name}.png` });
    };
    await shot('#finish-callout', 'summary');
    await shot('#finish-rows', 'rounds');
    await shot('#finish-stats', 'stats');
    await shot('#finish-board', 'board');
    check(!errors.length, `${vp.name}: no console errors${errors.length ? ': ' + errors.join('; ') : ''}`);
    await page.close();
  }
  await browser.close();
  console.log(fail.length ? `\n${fail.length} failed` : '\nAll card checks passed');
  process.exit(fail.length ? 1 : 0);
})();
