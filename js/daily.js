// Daily prompt selection. Everyone with the same local date gets the same five prompts.

export const EPOCH = '2026-10-28'; // Day 1
export const PER_DAY = 5;
const NO_REPEAT_DAYS = 30;

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

// Easier first: by difficulty, then by how many answers a player can reach.
export function orderRounds(prompts) {
  return [...prompts].sort((a, b) => a.difficulty - b.difficulty || b.target - a.target || a.id.localeCompare(b.id));
}

// Deal prompts from a shuffled queue so every prompt comes round once per cycle
// (about a month), with five different categories each day. The first pass also wants
// at least one easy prompt and no more than two hard ones; later passes relax the rules.
function pickDay(queue, byId, recent) {
  const picked = [];
  const cats = new Set();
  for (let pass = 0; pass < 3 && picked.length < PER_DAY; pass++) {
    for (const id of queue) {
      if (picked.length === PER_DAY) break;
      const p = byId.get(id);
      if (!p || cats.has(p.category)) continue;
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
    if (queue.length < PER_DAY * 4) {
      cycle += 1;
      const inQueue = new Set(queue);
      queue = queue.concat(shuffle(prompts.map((p) => p.id).filter((id) => !inQueue.has(id)), seededRandom('cycle:' + cycle)));
    }
    const recent = new Set(days.slice(-NO_REPEAT_DAYS).flatMap((d) => d.prompts));
    const picked = orderRounds(pickDay(queue, byId, recent));
    const ids = picked.map((p) => p.id);
    queue = queue.filter((id) => !ids.includes(id));
    days.push({ date: key, prompts: ids });
  }
  return { epoch: EPOCH, cycle, queue, days };
}

// The five prompts for a date. Falls back to a seeded pick past the end of the schedule.
export function promptsForDate(key, schedule, prompts) {
  const byId = new Map(prompts.map((p) => [p.id, p]));
  const day = schedule && schedule.days.find((d) => d.date === key);
  let picked = day ? day.prompts.map((id) => byId.get(id)).filter(Boolean) : [];
  if (picked.length < PER_DAY) {
    const rand = seededRandom('fallback:' + key);
    const cats = new Set(picked.map((p) => p.category));
    for (const p of shuffle(prompts, rand)) {
      if (picked.length === PER_DAY) break;
      if (!cats.has(p.category)) { picked.push(p); cats.add(p.category); }
    }
  }
  return orderRounds(picked);
}

// A random set for practice, five categories, not tied to the date.
export function practicePrompts(prompts, rand = Math.random) {
  const picked = [];
  const cats = new Set();
  for (const p of shuffle(prompts, rand)) {
    if (picked.length === PER_DAY) break;
    if (!cats.has(p.category)) { picked.push(p); cats.add(p.category); }
  }
  return orderRounds(picked);
}
