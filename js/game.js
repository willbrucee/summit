// The game: rounds, timer, guesses, saving and the finish.
import { CONFIG } from './config.js';
import { buildIndex, match, canAutoAccept } from './matcher.js';
import { dateKey, dayNumber, promptsForDate, practicePrompts } from './daily.js';
import { roundMetres, milestoneAt, nextMilestone, titleFor, formatMetres, temperatureAt, EVEREST } from './scoring.js';
import { load, save } from './store.js';
import { recordGame, currentStreak, getStats } from './stats.js';
import { shareText } from './share.js';

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
  document.body.dataset.screen = screen;
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
    const [index, schedule] = await Promise.all([getJSON('data/index.json'), getJSON('data/schedule.json')]);
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
      rounds: ids.map((id) => ({ id, status: 'ready', startedAt: null, found: [], wrong: [] })),
      done: false,
    };
    prompts = await Promise.all(ids.map((id) => getJSON(`data/p/${id}.json`)));
    indexes = prompts.map((p) => buildIndex(p.answers));
  } catch (err) {
    $('error-text').textContent = 'The map would not load. Check your connection and refresh. (' + err.message + ')';
    show('error');
    return;
  }
  $('mode-label').textContent = MODE === 'daily' ? `Day ${game.day}` : MODE === 'practice' ? 'Practice climb' : 'Test round';
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
  for (const id of [...r.found].reverse()) addChip(p.answers[id].label, false);
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

function addChip(label, fresh = true) {
  const li = document.createElement('li');
  li.textContent = label;
  if (fresh) li.className = 'is-new';
  $('found-list').prepend(li);
}

function setFeedback(text, kind) {
  const f = $('feedback');
  f.textContent = text;
  f.dataset.kind = kind || '';
  const input = $('guess');
  input.classList.remove('is-wrong', 'is-already');
  void input.offsetWidth; // restart the animation
  if (kind === 'wrong' || kind === 'already') input.classList.add('is-' + kind);
}

function submitGuess() {
  const r = current();
  if (!r || r.status !== 'playing' || $('guess').disabled) return;
  const text = $('guess').value;
  clearTimeout(clock && clock.auto);
  const p = currentPrompt();
  const before = altitude(game.current) + metresFor(game.current);
  const res = match(indexes[game.current], text, new Set(r.found));
  if (res.result === 'empty') return;
  if (res.result === 'correct') {
    r.found.push(res.index);
    const label = p.answers[res.index].label;
    addChip(label);
    updateCount();
    setFeedback(res.corrected ? label : '', res.corrected ? 'corrected' : 'correct');
    announce(`${label}. ${current().found.length} found.`);
    persist();
    const after = altitude(game.current) + metresFor(game.current);
    emit('climb', { from: before, to: after, gained: after - before, label });
  } else if (res.result === 'already') {
    setFeedback('Already got it', 'already');
    announce('Already got ' + p.answers[res.index].label);
  } else {
    if (r.wrong.length < 50) r.wrong.push(text.trim());
    setFeedback('', 'wrong');
  }
  $('guess').value = '';
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
  const missed = p.answers.filter((a) => !r.found.includes(a.id)).map((a) => a.label).sort((a, b) => a.localeCompare(b));
  $('missed-summary').textContent = `Answers you missed (${missed.length})`;
  $('missed-list').replaceChildren(...missed.map((m) => Object.assign(document.createElement('li'), { textContent: m })));
  $('report').href = reportUrl(p, r);
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
  $('finish-mountain').textContent = total + 0.5 >= EVEREST ? 'You stood on top of Everest.'
    : reached.height === 0 ? 'Still at sea level.' : `Higher than ${reached.name} (${formatMetres(reached.height)}).`;
  $('finish-next').textContent = upNext && total + 0.5 < EVEREST ? `${formatMetres(upNext.height - total)} short of ${upNext.name}.` : '';
  $('finish-title').textContent = titleFor(total);
  $('finish-temp').textContent = `${Math.round(temperatureAt(total))} °C up here`;
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
$('next').addEventListener('click', next);
$('copy-share').addEventListener('click', copyShare);
// Keep the box focused while playing, so the phone keyboard stays up.
$('play').addEventListener('pointerup', () => { if (!$('guess').disabled) $('guess').focus(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && game && current() && current().status === 'playing' && Date.now() >= current().startedAt + ROUND_MS) endRound();
});

const help = $('help');
$('help-open').addEventListener('click', () => help.showModal());
$('help-close').addEventListener('click', () => help.close());
if (!load('seen-help') && MODE === 'daily') {
  save('seen-help', true);
  help.showModal();
}

init();
