// End-to-end: no prompt may leak before its timer starts, and it must appear within 50 ms of the start.
// Checks page text, title, the full HTML (attributes included), the accessibility tree, saved
// progress and network requests, on the intro screen and during the countdown, for two rounds.
// Needs a local server on 8123: node tests/e2e-no-preview.cjs
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:8123/';
const fail = [];
const check = (ok, what) => { if (!ok) fail.push(what); console.log(`${ok ? 'pass' : 'FAIL'}  ${what}`); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const requested = [];
  page.on('request', (r) => requested.push(r.url()));
  page.on('pageerror', (e) => fail.push('page error: ' + e.message));
  await page.addInitScript(() => localStorage.setItem('summit:seen-help', 'true'));
  const all = (await (await page.request.get(BASE + 'data/prompts.json')).json()).prompts;

  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#ready:not([hidden])');
  const index = (await (await page.request.get(BASE + 'data/index.json')).json()).prompts;
  check(index.every((p) => !('text' in p) && !('note' in p)), 'the index the game loads has no prompt text');

  // Everything a player or a screen reader could see or hear, plus storage and the URL.
  async function exposed() {
    const text = await page.evaluate(() => document.body.innerText);
    const html = await page.content();
    const aria = await page.locator('body').ariaSnapshot();
    const storage = await page.evaluate(() => JSON.stringify(Object.assign({}, localStorage)));
    const title = await page.title();
    return [text, html, aria, storage, title, page.url()].join('\n').toLowerCase();
  }
  const leaks = (blob, p) => [p.text, p.note].filter((s) => s && s.length > 8).some((s) => blob.includes(s.toLowerCase()))
    || blob.includes(p.id.toLowerCase().replace(/-/g, ' ')) || blob.includes(`"${p.id}"`);

  // Work out today's five keys the same way the game does.
  const { promptsForDate, dateKey } = await import('../js/daily.js');
  const schedule = await (await page.request.get(BASE + 'data/schedule.json')).json();
  const ids = promptsForDate(dateKey(), schedule, index).map((x) => x.id);
  // Today may use prompts retired from the bank since it was published; their files stay.
  for (const k of ids) if (!all.some((x) => x.key === k)) all.push(await (await page.request.get(BASE + `data/p/${k}.json`)).json());
  requested.length = 0;

  // The detector itself must notice a leak, or the passes below mean nothing.
  check(leaks(`intro <h1>${all[0].text}</h1>`.toLowerCase(), all[0]), 'leak detector spots a prompt placed in the page');

  for (let round = 0; round < 2; round++) {
    await page.waitForSelector('#ready:not([hidden])');
    const p = all.find((x) => x.key === ids[round]);
    check(!leaks(await exposed(), p), `round ${round + 1}: prompt not exposed on the intro screen`);
    check(!requested.some((u) => u.includes(p.key)), `round ${round + 1}: prompt file not downloaded before Start`);
    await page.locator('#start').dispatchEvent('click');

    // Watch for the prompt text appearing, in page time.
    await page.evaluate((text) => {
      window.__promptSeenAt = null;
      const mo = new MutationObserver(() => {
        if (window.__promptSeenAt === null && document.body.innerText.includes(text)) window.__promptSeenAt = performance.now();
      });
      mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    }, p.text);

    for (const at of [800, 1800]) {
      await page.waitForTimeout(at === 800 ? 800 : 1000);
      check(!leaks(await exposed(), p), `round ${round + 1}: prompt not exposed during the countdown (${at} ms)`);
    }
    await page.waitForFunction(() => window.__summitTimerStartedAt && window.__promptSeenAt !== null, null, { timeout: 8000 });
    const { started, seen } = await page.evaluate(() => ({ started: window.__summitTimerStartedAt, seen: window.__promptSeenAt }));
    const gap = seen - started;
    check(gap >= -1 && gap <= 50, `round ${round + 1}: prompt appears ${gap.toFixed(1)} ms after the timer starts (limit 50 ms)`);
    check((await page.textContent('#play-prompt')) === p.text, `round ${round + 1}: the prompt shown is the right one`);

    // Let the round run out, then check the camp screen does not show the next prompt.
    await page.waitForSelector('#result:not([hidden])', { timeout: 40000 });
    if (round === 0) {
      const next = all.find((x) => x.key === ids[1]);
      check(!leaks(await exposed(), next), 'camp screen after round 1: next prompt not exposed');
      await page.locator('#next').dispatchEvent('click');
    }
  }
  await browser.close();
  console.log(fail.length ? `\n${fail.length} failed` : '\nAll no-preview checks passed');
  process.exit(fail.length ? 1 : 0);
})();
