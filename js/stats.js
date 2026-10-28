// Streak and personal best, kept on this device.
import { load, save } from './store.js';
import { addDays } from './daily.js';

const KEY = 'stats';

export function getStats() {
  return load(KEY, { played: 0, streak: 0, maxStreak: 0, best: 0, lastDate: null, history: {} });
}

// Call once when a daily game is finished.
export function recordGame(date, altitude) {
  const s = getStats();
  if (s.history[date] !== undefined) return s;
  s.history[date] = Math.round(altitude);
  s.played += 1;
  s.streak = s.lastDate === addDays(date, -1) ? s.streak + 1 : 1;
  s.maxStreak = Math.max(s.maxStreak, s.streak);
  s.best = Math.max(s.best, Math.round(altitude));
  s.lastDate = date;
  save(KEY, s);
  return s;
}

// A streak only counts if yesterday or today was played.
export function currentStreak(today) {
  const s = getStats();
  if (s.lastDate === today || s.lastDate === addDays(today, -1)) return s.streak;
  return 0;
}
