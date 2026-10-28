import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex } from '../js/matcher.js';
import { classifyGuess, diffMarks, nextCombo, bestBurst, unmatchedWorthReporting, COMBO_GAP_MS } from '../js/feedback.js';

const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const prompt = (id) => data.prompts.find((p) => p.id === id);
const countries = prompt('countries-world');
const index = buildIndex(countries.answers);
const idOf = (label) => countries.answers.findIndex((a) => a.label === label);

test('accepted: an exact answer', () => {
  assert.deepEqual(classifyGuess(index, 'Kenya', new Set()), { state: 'accepted', index: idOf('Kenya') });
});
test('autocorrected: a typo with one answer in reach', () => {
  assert.deepEqual(classifyGuess(index, 'Mozambiqe', new Set()), { state: 'autocorrected', index: idOf('Mozambique') });
});
test('duplicate: already found, typed exactly or with a typo', () => {
  const found = new Set([idOf('Mozambique')]);
  assert.equal(classifyGuess(index, 'Mozambique', found).state, 'duplicate');
  assert.equal(classifyGuess(index, 'Mozambiqe', found).state, 'duplicate');
});
test('ambiguous: one typo from two answers, no hint which', () => {
  const g = classifyGuess(index, 'Austrlia', new Set());
  assert.deepEqual(g, { state: 'ambiguous' });
});
test('wrong: nothing close', () => {
  assert.deepEqual(classifyGuess(index, 'Atlantis', new Set()), { state: 'wrong' });
});
test('empty: blank input does nothing', () => {
  assert.deepEqual(classifyGuess(index, '   ', new Set()), { state: 'empty' });
});

test('diffMarks highlights only the letters the autocorrect changed', () => {
  const runs = diffMarks('Mozambiqe', 'Mozambique');
  assert.equal(runs.map((r) => r.text).join(''), 'Mozambique');
  assert.deepEqual(runs.filter((r) => r.changed).map((r) => r.text), ['u']);
  assert.deepEqual(diffMarks('swizerland', 'Switzerland').filter((r) => r.changed).map((r) => r.text), ['t']);
  assert.deepEqual(diffMarks('Kenya', 'Kenya').filter((r) => r.changed), []);
});

test('combo grows with quick right answers and drops on a miss', () => {
  assert.equal(nextCombo(0, 'accepted', 1000, null), 1);
  assert.equal(nextCombo(1, 'autocorrected', 3000, 1000), 2);
  assert.equal(nextCombo(2, 'accepted', 3000 + COMBO_GAP_MS + 1, 3000), 1);
  assert.equal(nextCombo(4, 'wrong', 5000, 4000), 0);
  assert.equal(nextCombo(4, 'ambiguous', 5000, 4000), 0);
  assert.equal(nextCombo(4, 'duplicate', 5000, 4000), 4);
});

test('bestBurst finds the most answers in a 10 second window', () => {
  assert.deepEqual(bestBurst([]), { count: 0, seconds: 0 });
  assert.deepEqual(bestBurst([1000, 2000, 3500, 4000, 5200, 8800, 20000]), { count: 6, seconds: 8 });
  assert.deepEqual(bestBurst([0, 15000, 29000]), { count: 1, seconds: 1 });
});

test('typed-but-not-accepted keeps repeats and longer words only', () => {
  assert.deepEqual(unmatchedWorthReporting(['Narnia', 'narnia ', 'xy', 'xy', 'q', 'Wakanda']), ['Narnia', 'xy', 'Wakanda']);
});
