// The game: rounds, timer, guesses, saving and the finish.
import { CONFIG } from './config.js';
import { buildIndex, canAutoAccept } from './matcher.js';
import { dateKey, dayNumber, promptsForDate, practicePrompts } from './daily.js';
import { roundMetres, milestoneAt, nextMilestone, titleFor, formatMetres, temperatureAt, EVEREST } from './scoring.js';
import { load, save } from './store.js';
import { recordGame, currentStreak, getStats } from './stats.js';
import { shareText } from './share.js';
import { createScene } from './scene.js';
import { renderBoard, renderRounds } from './board.js';
import { classifyGuess, diffMarks, nextCombo, bestBurst, unmatchedWorthReporting, WRONG_LINES, COMBO_MAX } from './feedback.js';

const $ = (id) => document.getElementById(id);
// Modes come from the hash: #practice, or #test-<prompt id> from the QA page.
const HASH = location.hash.slice(1);
const TEST_ID = HASH.startsWith('test-') ? HASH.slice(5) : null;
const MODE = TEST_ID ? 'test' : HASH === 'practice' ? 'practice' : 'daily';
window.addEventListener('hashchange', () => location.reload());
const ROUND_MS = CONFIG.roundSeconds * 1000;
const COUNT_MS = CONFIG.countdownSeconds * 1000;

let game;
let prompts = [];
let indexes = [];
let clock = null;
let FACTS = [];
const scene = createScene($('scene'));
window.summitScene = scene; // for screenshots and the QA page

// Altitudes where the climber camped: the end of each finished round.
function camps() {
  const out = [];
  let total = 0;
  game.rounds.forEach((r, i) => { if (r.status === 'done') { total += metresFor(i); out.push(total); } });
  return out;
}

document.addEventListener('summit:ready', (e) => { scene.setAltitude(e.detail.altitude, true); scene.setCamps(camps()); });
document.addEventListener('summit:climb', (e) => scene.climb(e.detail.from, e.detail.to, e.detail.gained));
document.addEventListener('summit:round-end', () => scene.setCamps(camps()));
document.addEventListener('summit:finish', (e) => { scene.setCamps(camps().slice(0, -1)); scene.setAltitude(e.detail.altitude, true); scene.plantFlag(e.detail.altitude); });

// ---------- helpers ----------

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent('summit:' + name, { detail }));
}

function announce(text) {
  const live = $('live');
  live.textContent = '';
  // A fresh text node makes screen readers read repeats too.
  requestAnimationFrame(() => { live.textContent = text; });
}

function show(screen) {
  for (const id of ['ready', 'play', 'result', 'finish', 'loading', 'error']) $(id).hidden = id !== screen;
  $('guess-bar').hidden = screen !== 'play';
  document.body.dataset.screen = screen;
  document.querySelector('.panel-body').scrollTop = 0;
}

function persist() {
  if (MODE === 'daily') save('day:' + game.date, game);
}

const current = () => game.rounds[game.current];
const currentPrompt = () => prompts[game.current];
const metresFor = (i) => roundMetres(game.rounds[i].found.length, prompts[i].target);

function altitude(upTo = game.rounds.length) {
  let total = 0;
  for (let i = 0; i < upTo; i++) total += metresFor(i);
  return total;
}

async function getJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

// ---------- setup ----------

async function init() {
  show('loading');
  try {
    const [index, schedule, factData] = await Promise.all([getJSON('data/index.json'), getJSON('data/schedule.json'), getJSON('data/altitude-facts.json').catch(() => ({ facts: [] }))]);
    FACTS = factData.facts;
    scene.setFacts(FACTS);
    const today = dateKey();
    let chosen;
    if (MODE === 'test') {
      chosen = index.prompts.filter((p) => p.id === TEST_ID);
      if (!chosen.length) throw new Error('No prompt called ' + TEST_ID);
    } else if (MODE === 'practice') {
      chosen = practicePrompts(index.prompts);
    } else {
      chosen = promptsForDate(today, schedule, index.prompts);
    }
    const ids = chosen.map((p) => p.id);
    const saved = MODE === 'daily' ? load('day:' + today) : null;
    game = saved && saved.ids && saved.ids.join() === ids.join() ? saved : {
      mode: MODE,
      date: today,
      day: dayNumber(today),
      ids,
      current: 0,
      rounds: ids.map((id) => ({ id, status: 'ready', startedAt: null, found: [], times: [], fixed: 0, wrong: [] })),
      done: false,
    };
    prompts = await Promise.all(ids.map((id) => getJSON(`data/p/${id}.json`)));
    indexes = prompts.map((p) => buildIndex(p.answers));
  } catch (err) {
    $('error-text').textContent = 'The map would not load. Check your connection and refresh. (' + err.message + ')';
    show('error');
    return;
  }
  $('mode-label').textContent = MODE === 'daily' ? `Day ${game.day}` : MODE === 'practice' ? 'Practice' : 'Test round';
  if (MODE !== 'daily') { $('mode-switch').textContent = "Today's climb"; $('mode-switch').href = '#daily'; }
  emit('ready', { altitude: altitude(game.current), mode: MODE });
  resume();
}

// Pick up wherever the player left off.
function resume() {
  if (game.done) return finish();
  const r = current();
  if (r.status === 'ready') return showReady();
  if (r.status === 'playing') {
    const left = r.startedAt + ROUND_MS - Date.now();
    if (left <= 0) return endRound();
    return runRound();
  }
  return showResult();
}

// ---------- ready ----------

function showReady() {
  const p = currentPrompt();
  $('ready-round').textContent = `Round ${game.current + 1} of ${prompts.length}`;
  $('ready-category').textContent = p.categoryName;
  $('ready-prompt').textContent = p.text;
  $('ready-note').textContent = p.note;
  $('ready-note').hidden = !p.note;
  $('ready-size').textContent = p.finite ? `${p.size} to find. Aim for ${p.target}.` : `Aim for ${p.target}.`;
  $('route').replaceChildren(...prompts.map((q, i) => {
    const li = document.createElement('li');
    const state = i < game.current ? 'done' : i === game.current ? 'now' : 'ahead';
    li.className = 'is-' + state;
    li.append(Object.assign(document.createElement('span'), { textContent: q.categoryName }));
    li.append(Object.assign(document.createElement('span'), { className: 'metres', textContent: state === 'done' ? '+' + formatMetres(metresFor(i)) : state === 'now' ? 'Up next' : '' }));
    return li;
  }));
  show('ready');
  $('start').focus();
}

function startRound() {
  const r = current();
  if (r.status !== 'ready') return;
  r.status = 'playing';
  r.startedAt = Date.now() + COUNT_MS;
  persist();
  runRound();
}

// ---------- playing ----------

function runRound() {
  const p = currentPrompt();
  const r = current();
  $('play-prompt').textContent = p.text;
  $('play-note').textContent = p.note;
  $('play-note').hidden = !p.note;
  $('found-list').replaceChildren();
  for (const id of [...r.found].reverse()) addChip(p.answers[id].label, id);
  combo = { level: 0, lastAt: null };
  showCombo();
  updateCount();
  $('feedback').textContent = '';
  show('play');

  const input = $('guess');
  input.value = '';
  // Translate the saved wall-clock start into this page's monotonic clock.
  const startPerf = performance.now() + (r.startedAt - Date.now());
  const endPerf = startPerf + ROUND_MS;
  let lastSecond = null;
  let started = false;
  const spoken = new Set();

  input.disabled = true;
  $('countdown').hidden = false;
  emit('round-start', { index: game.current, altitude: altitude(game.current) });

  const tick = () => {
    const now = performance.now();
    if (now < startPerf) {
      const n = Math.ceil((startPerf - now) / 1000);
      if ($('countdown').textContent !== String(n)) {
        $('countdown').textContent = String(n);
        announce(String(n));
      }
      return;
    }
    if (!started) {
      started = true;
      $('countdown').hidden = true;
      input.disabled = false;
      input.focus();
      announce('Go');
    }
    const left = Math.max(0, endPerf - now);
    $('timer-fill').style.transform = `scaleX(${left / ROUND_MS})`;
    const sec = Math.ceil(left / 1000);
    if (sec !== lastSecond) {
      lastSecond = sec;
      $('timer-number').textContent = String(sec);
      $('timer').classList.toggle('is-low', sec <= 5 && sec > 0);
      if ([20, 10, 5].includes(sec) && !spoken.has(sec)) {
        spoken.add(sec);
        $('timer-live').textContent = `${sec} seconds left`;
      }
    }
    if (left <= 0) endRound();
  };

  stopClock();
  // requestAnimationFrame for smooth drawing, an interval so a hidden tab still ends on time.
  const frame = () => { tick(); if (clock) clock.raf = requestAnimationFrame(frame); };
  clock = { raf: requestAnimationFrame(frame), interval: setInterval(tick, 250) };
  tick();
}

function stopClock() {
  if (!clock) return;
  cancelAnimationFrame(clock.raf);
  clearInterval(clock.interval);
  clearTimeout(clock.auto);
  clock = null;
}

function updateCount() {
  const p = currentPrompt();
  const n = current().found.length;
  $('found-count').textContent = p.finite ? `${n} of ${p.size}` : `${n} found`;
}

// Settings kept on this device.
const settings = Object.assign({ vibrate: true }, load('settings', {}));
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let combo = { level: 0, lastAt: null };

function addChip(label, id, from) {
  const li = document.createElement('li');
  li.textContent = label;
  li.dataset.id = String(id);
  $('found-list').prepend(li);
  // The typed word flies from the rope into the list.
  if (from && !reducedMotion() && li.animate) {
    const to = li.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    li.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(0.9)`, opacity: 0.4 },
      { transform: 'translate(0, -6px) scale(1.04)', opacity: 1, offset: 0.75 },
      { transform: 'none', opacity: 1 },
    ], { duration: 420, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }
  return li;
}

function setFeedback(kind, parts = []) {
  const f = $('feedback');
  f.dataset.kind = kind;
  f.replaceChildren(...parts);
  const field = $('rope-field');
  field.classList.remove('is-wrong', 'is-already', 'is-clip');
  void field.offsetWidth; // restart the animation
  if (kind === 'wrong' || kind === 'ambiguous') field.classList.add('is-wrong');
  if (kind === 'already') field.classList.add('is-already');
  if (kind === 'accepted' || kind === 'autocorrected') field.classList.add('is-clip');
}

const span = (text, className) => Object.assign(document.createElement('span'), { textContent: text, className: className || '' });

function showCombo() {
  const level = Math.min(COMBO_MAX, combo.level);
  $('combo').dataset.level = String(level);
  $('combo-label').textContent = level >= COMBO_MAX ? 'On a roll' : level >= 3 ? 'Good rhythm' : '';
  // A hot streak quickens the climber's step. Looks only, the metres are the same.
  document.documentElement.style.setProperty('--climb-dur', `${(0.7 - level * 0.05).toFixed(2)}s`);
}

function buzz() {
  if (settings.vibrate && !reducedMotion() && navigator.vibrate) {
    try { navigator.vibrate(12); } catch { /* not supported */ }
  }
}

function submitGuess() {
  const r = current();
  if (!r || r.status !== 'playing' || $('guess').disabled) return;
  const input = $('guess');
  const text = input.value;
  clearTimeout(clock && clock.auto);
  const p = currentPrompt();
  const before = altitude(game.current) + metresFor(game.current);
  const g = classifyGuess(indexes[game.current], text, new Set(r.found));
  if (g.state === 'empty') return;
  const now = Date.now();
  combo.level = nextCombo(combo.level, g.state, now, combo.lastAt);
  if (g.state === 'accepted' || g.state === 'autocorrected') {
    const from = input.getBoundingClientRect();
    r.found.push(g.index);
    if (!r.times) r.times = [];
    r.times.push(Math.max(0, now - r.startedAt));
    if (g.state === 'autocorrected') r.fixed = (r.fixed || 0) + 1;
    combo.lastAt = now;
    const label = p.answers[g.index].label;
    addChip(label, g.index, { left: from.left + 36, top: from.top + 8 });
    updateCount();
    if (g.state === 'autocorrected') {
      const word = span('', 'fixed-word');
      word.append(...diffMarks(text, label).map((run) => (run.changed ? Object.assign(document.createElement('mark'), { textContent: run.text }) : document.createTextNode(run.text))));
      setFeedback('autocorrected', [span('Autocorrected', 'pill'), word]);
      announce(`Autocorrected to ${label}. ${r.found.length} found.`);
    } else {
      setFeedback('accepted', []);
      announce(`${label}. ${r.found.length} found.`);
    }
    buzz();
    persist();
    const after = altitude(game.current) + metresFor(game.current);
    emit('climb', { from: before, to: after, gained: after - before, label });
  } else if (g.state === 'duplicate') {
    setFeedback('already', [span('Already clipped in')]);
    const chip = $('found-list').querySelector(`li[data-id="${g.index}"]`);
    if (chip) { chip.classList.remove('is-pulse'); void chip.offsetWidth; chip.classList.add('is-pulse'); }
    announce('Already clipped in: ' + p.answers[g.index].label);
  } else if (g.state === 'ambiguous') {
    if (r.wrong.length < 50) r.wrong.push(text.trim());
    setFeedback('ambiguous', [span('Too close to call, be more specific')]);
    announce('Too close to call, be more specific');
  } else {
    if (r.wrong.length < 50) r.wrong.push(text.trim());
    setFeedback('wrong', [span(WRONG_LINES[Math.floor(Math.random() * WRONG_LINES.length)])]);
  }
  showCombo();
  input.value = '';
  input.focus();
}

function onInput() {
  if (!clock) return;
  clearTimeout(clock.auto);
  const value = $('guess').value;
  if (canAutoAccept(indexes[game.current], value)) {
    clock.auto = setTimeout(() => { if ($('guess').value === value) submitGuess(); }, CONFIG.autoAcceptMs);
  }
}

function endRound() {
  stopClock();
  const r = current();
  if (r.status === 'done') return showResult();
  r.status = 'done';
  persist();
  $('guess').disabled = true;
  $('timer-live').textContent = 'Time is up';
  emit('round-end', { index: game.current, altitude: altitude(game.current + 1) });
  showResult();
}

// ---------- round result ----------

function showResult() {
  const i = game.current;
  const p = prompts[i];
  const r = game.rounds[i];
  const metres = metresFor(i);
  $('result-prompt').textContent = p.text;
  $('result-found').textContent = p.finite ? `You found ${r.found.length} of ${p.size}.` : `You found ${r.found.length}.`;
  $('result-metres').textContent = `+${formatMetres(metres)} this round. ${formatMetres(altitude(i + 1))} so far.`;
  const recap = [];
  if (r.fixed) recap.push(`Autocorrect saved ${r.fixed} answer${r.fixed === 1 ? '' : 's'}`);
  const burst = bestBurst(r.times || []);
  if (burst.count >= 3) recap.push(`Fastest burst: ${burst.count} in ${burst.seconds} seconds`);
  $('result-recap').replaceChildren(...recap.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  $('result-recap').hidden = !recap.length;
  renderBoard($('result-board'), p, r);
  $('report').href = reportUrl(p, r);
  const typed = unmatchedWorthReporting(r.wrong || []).slice(0, 25);
  $('unmatched').hidden = !typed.length;
  $('unmatched-list').replaceChildren(...typed.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  $('unmatched-report').href = missingReportUrl(p, typed);
  const last = i === prompts.length - 1;
  $('next').textContent = last ? (MODE === 'test' ? 'Play it again' : 'See your summit') : 'Next round';
  show('result');
  $('next').focus();
}

function reportUrl(p, r) {
  const title = `Answer report: ${p.text}`;
  const body = [
    `Prompt: ${p.text} (${p.id})`,
    '',
    'Missing or wrong answer:',
    '',
    'Why it should change (a link helps):',
    '',
    r.wrong.length ? `My guesses that were not accepted: ${r.wrong.slice(0, 20).join(', ')}` : '',
  ].join('\n');
  return `https://github.com/${CONFIG.repo}/issues/new?labels=answers&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

// A prefilled issue with the prompt id and the typed words only. Nothing personal is sent.
function missingReportUrl(p, typed) {
  const title = `Possible missing answers: ${p.text}`;
  const body = [`Prompt: ${p.text}`, `Prompt id: ${p.id}`, '', 'Typed but not accepted:', ...typed.map((t) => `- ${t}`), '', 'Which of these should count, and why:'].join('\n');
  return `https://github.com/${CONFIG.repo}/issues/new?labels=missing-answer&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

function next() {
  if (MODE === 'test') { location.reload(); return; }
  if (game.current < prompts.length - 1) {
    game.current += 1;
    persist();
    emit('camp', { altitude: altitude(game.current) });
    showReady();
  } else {
    game.done = true;
    persist();
    finish();
  }
}

// ---------- finish ----------

function finish() {
  stopClock();
  const total = altitude();
  const reached = milestoneAt(total);
  const upNext = nextMilestone(total);
  const isDaily = MODE === 'daily';
  const stats = isDaily ? recordGame(game.date, total) : getStats();
  $('finish-altitude').textContent = formatMetres(total);
  $('finish-day').textContent = MODE === 'daily' ? `Day ${game.day}` : 'Practice';
  renderRounds($('finish-board'), prompts, game.rounds);
  $('finish-mountain').textContent = total + 0.5 >= EVEREST ? 'You stood on top of Everest.'
    : reached.height === 0 ? 'Still at sea level.' : `Higher than ${reached.name} (${formatMetres(reached.height)}).`;
  $('finish-next').textContent = upNext && total + 0.5 < EVEREST ? `${formatMetres(upNext.height - total)} short of ${upNext.name}.` : '';
  $('finish-title').textContent = titleFor(total);
  const highlights = FACTS.filter((f) => f.past && total + 0.5 >= f.altitude).sort((a, b) => b.altitude - a.altitude).slice(0, 3);
  $('finish-highlights').replaceChildren(...highlights.map((f) => Object.assign(document.createElement('li'), { textContent: `You climbed past ${f.past}.` })));
  $('finish-highlights').hidden = !highlights.length;
  $('finish-temp').textContent = `It is ${Math.round(temperatureAt(total))} °C up here.`;
  const rows = prompts.map((p, i) => {
    const tr = document.createElement('tr');
    const cells = [p.text, p.finite ? `${game.rounds[i].found.length} of ${p.size}` : String(game.rounds[i].found.length), '+' + formatMetres(metresFor(i))];
    for (const c of cells) tr.append(Object.assign(document.createElement('td'), { textContent: c }));
    return tr;
  });
  $('finish-rows').replaceChildren(...rows);
  $('finish-stats').hidden = !isDaily;
  $('share-box').hidden = !isDaily;
  if (isDaily) {
    $('stat-streak').textContent = String(currentStreak(game.date));
    $('stat-best').textContent = formatMetres(stats.best);
    $('stat-played').textContent = String(stats.played);
    $('share-text').value = shareText({
      day: game.day,
      altitude: total,
      rounds: prompts.map((_, i) => ({ metres: metresFor(i) })),
      url: location.origin + location.pathname,
    });
  }
  show('finish');
  emit('finish', { altitude: total, rounds: prompts.map((_, i) => metresFor(i)) });
  startNextCountdown();
}

function startNextCountdown() {
  const el = $('next-puzzle');
  const update = () => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const s = Math.max(0, Math.floor((midnight - now) / 1000));
    const pad = (n) => String(n).padStart(2, '0');
    el.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    if (s === 0 && MODE === 'daily') location.reload();
  };
  update();
  setInterval(update, 1000);
}

async function copyShare() {
  const text = $('share-text').value;
  try {
    await navigator.clipboard.writeText(text);
    $('share-status').textContent = 'Copied. No answers included.';
  } catch {
    $('share-text').select();
    $('share-status').textContent = 'Select the text and copy it.';
  }
}

// ---------- wiring ----------

$('start').addEventListener('click', startRound);
$('guess-form').addEventListener('submit', (e) => { e.preventDefault(); submitGuess(); });
$('guess').addEventListener('input', onInput);
// The Add button must not take focus from the box, or the phone keyboard drops.
$('guess-send').addEventListener('pointerdown', (e) => e.preventDefault());
$('next').addEventListener('click', next);
$('copy-share').addEventListener('click', copyShare);
$('share').addEventListener('click', copyShare);
$('save-card').hidden = true;
// Keep the box focused while playing, so the phone keyboard stays up.
$('play').addEventListener('pointerup', () => { if (!$('guess').disabled) $('guess').focus(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && game && current() && current().status === 'playing' && Date.now() >= current().startedAt + ROUND_MS) endRound();
});

// Fit the app to the visible area, so an open phone keyboard never covers the climber or the box.
function fitViewport() {
  const vv = window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${Math.round(h)}px`);
  if (vv && vv.offsetTop) window.scrollTo(0, 0);
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', fitViewport);
  window.visualViewport.addEventListener('scroll', fitViewport);
}
fitViewport();

$('setting-vibrate').checked = settings.vibrate;
$('setting-vibrate').addEventListener('change', (e) => { settings.vibrate = e.target.checked; save('settings', settings); });

const help = $('help');
$('help-open').addEventListener('click', () => help.showModal());
$('help-close').addEventListener('click', () => help.close());
if (!load('seen-help') && MODE === 'daily') {
  save('seen-help', true);
  help.showModal();
}

init();
