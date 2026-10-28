// Daily prompt selection. Everyone with the same local date gets the same five prompts.

export const EPOCH = '2026-10-28'; // Day 1
export const PER_DAY = 5;
// Round 1 is always an easy geography opener (hidden topic t0); rounds 2 to 5 come from
// four different other topics.
export const OPENER_TOPIC = 't0';
const isOpener = (p) => p.category === OPENER_TOPIC && p.difficulty <= 2;
// A prompt sits out for as long as the bank allows: openers cycle on their own, the rest
// four a day.
const restDays = (count, perDay) => Math.max(1, Math.floor((count / perDay) * 0.8));

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function keyToUTC(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function dayNumber(key) {
  return Math.round((keyToUTC(key) - keyToUTC(EPOCH)) / 86400000) + 1;
}

export function addDays(key, n) {
  const t = new Date(keyToUTC(key) + n * 86400000);
  return t.toISOString().slice(0, 10);
}

// Small seeded random number generator (mulberry32) keyed by a string.
export function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The geography opener first, then easier first: by difficulty, then by how many answers a player can reach.
export function orderRounds(prompts) {
  const rank = (p) => (isOpener(p) ? 0 : 1);
  return [...prompts].sort((a, b) => rank(a) - rank(b) || a.difficulty - b.difficulty || b.target - a.target || a.id.localeCompare(b.id));
}

// Deal prompts from a shuffled queue so every prompt comes round once per cycle. Each day
// takes the first opener in the queue, then four prompts from four other topics. The first
// pass also wants at least one easy prompt and no more than two hard ones; later passes relax.
function pickDay(queue, byId, recent, recentOpeners) {
  const picked = [];
  const cats = new Set();
  for (let pass = 0; pass < 2 && !picked.length; pass++) {
    const id = queue.find((x) => byId.get(x) && isOpener(byId.get(x)) && (pass === 1 || !recentOpeners.has(x)));
    if (id) { picked.push(byId.get(id)); cats.add(OPENER_TOPIC); }
  }
  for (let pass = 0; pass < 3 && picked.length < PER_DAY; pass++) {
    for (const id of queue) {
      if (picked.length === PER_DAY) break;
      const p = byId.get(id);
      if (!p || cats.has(p.category) || picked.includes(p)) continue;
      if (pass < 2 && recent.has(id)) continue;
      if (pass === 0) {
        const trial = [...picked, p];
        if (trial.filter((x) => x.difficulty === 3).length > 2) continue;
        if (trial.length === PER_DAY && !trial.some((x) => x.difficulty === 1)) continue;
      }
      picked.push(p);
      cats.add(p.category);
    }
  }
  return picked;
}

// existing: a previous schedule, kept as it is so published days never change.
export function buildSchedule(prompts, existing, totalDays) {
  const byId = new Map(prompts.map((p) => [p.id, p]));
  const days = existing ? existing.days.slice() : [];
  let queue = existing ? existing.queue.filter((id) => byId.has(id)) : [];
  let cycle = existing ? existing.cycle : 0;

  // New prompts join the queue at seeded positions.
  const known = new Set([...queue, ...days.flatMap((d) => d.prompts)]);
  const fresh = prompts.map((p) => p.id).filter((id) => !known.has(id));
  if (fresh.length) {
    const rand = seededRandom('fresh:' + fresh.join(','));
    for (const id of fresh) queue.splice(Math.floor(rand() * (queue.length + 1)), 0, id);
  }

  while (days.length < totalDays) {
    const key = days.length ? addDays(days[days.length - 1].date, 1) : EPOCH;
    if (queue.length < PER_DAY * 4 || queue.filter((id) => byId.get(id) && isOpener(byId.get(id))).length < 2) {
      cycle += 1;
      const inQueue = new Set(queue);
      queue = queue.concat(shuffle(prompts.map((p) => p.id).filter((id) => !inQueue.has(id)), seededRandom('cycle:' + cycle)));
    }
    const recent = new Set(days.slice(-restDays(prompts.filter((p) => !isOpener(p)).length, PER_DAY - 1)).flatMap((d) => d.prompts));
    const recentOpeners = new Set(days.slice(-restDays(prompts.filter(isOpener).length, 1)).flatMap((d) => d.prompts));
    const picked = orderRounds(pickDay(queue, byId, recent, recentOpeners));
    const ids = picked.map((p) => p.id);
    queue = queue.filter((id) => !ids.includes(id));
    days.push({ date: key, prompts: ids });
  }
  return { epoch: EPOCH, cycle, queue, days };
}

// Five prompts without a schedule: an opener, then four other topics, seeded or random.
function freshSet(prompts, rand, picked = []) {
  const cats = new Set(picked.map((p) => p.category));
  const pool = shuffle(prompts.filter((p) => !p.retired), rand);
  if (!picked.some(isOpener)) {
    const opener = pool.find(isOpener);
    if (opener) { picked.push(opener); cats.add(OPENER_TOPIC); }
  }
  for (const p of pool) {
    if (picked.length === PER_DAY) break;
    if (!cats.has(p.category)) { picked.push(p); cats.add(p.category); }
  }
  return orderRounds(picked);
}

// The five prompts for a date. Falls back to a seeded pick past the end of the schedule.
export function promptsForDate(key, schedule, prompts) {
  const byId = new Map(prompts.map((p) => [p.id, p]));
  const day = schedule && schedule.days.find((d) => d.date === key);
  const picked = day ? day.prompts.map((id) => byId.get(id)).filter(Boolean) : [];
  if (picked.length < PER_DAY) return freshSet(prompts, seededRandom('fallback:' + key), picked);
  return orderRounds(picked);
}

// A random set for practice, not tied to the date.
export function practicePrompts(prompts, rand = Math.random) {
  return freshSet(prompts, rand);
}
