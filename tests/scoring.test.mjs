import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVEREST, ROUNDS, targetFor, roundMetres, totalMetres, OVERFLOW_CAP } from '../js/scoring.js';
import { verdict } from '../js/board.js';

const share = EVEREST / ROUNDS;

test('targets sit 30% below the old top-player reach', () => {
  assert.equal(targetFor(200, 1), 15); // was 22
  assert.equal(targetFor(200, 3), 11); // was 15
  assert.equal(targetFor(5, 1), 4);
});
test('the curve is generous below the target and exact at it', () => {
  assert.equal(roundMetres(0, 10), 0);
  assert.ok(roundMetres(5, 10) > share * 0.5);
  assert.equal(roundMetres(10, 10), share);
});
test('answers past the target add a small, capped bonus', () => {
  assert.ok(roundMetres(12, 10) > share);
  assert.ok(Math.abs(roundMetres(100, 10) - share * (1 + OVERFLOW_CAP)) < 1e-9);
});
test('the climb never goes past Everest', () => {
  assert.equal(totalMetres([share * 1.15, share * 1.15, share * 1.15, share * 1.15, share * 1.15]), EVEREST);
  assert.equal(totalMetres([100, 200]), 300);
});
test('verdicts are words, so colour is never the only signal', () => {
  assert.equal(verdict(9, 10), 'Strong');
  assert.equal(verdict(5, 10), 'Steady');
  assert.equal(verdict(2, 10), 'Slow start');
});
