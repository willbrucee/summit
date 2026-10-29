import { test } from 'node:test';
import assert from 'node:assert/strict';
import { namesItsList } from '../build/lint.mjs';

test('headlines that name their list pass', () => {
  for (const h of ['Name any of the 200 best-selling video games ever', 'Name any Ballon d\'Or winner', 'Name any player from a World Cup winning squad',
    'Name any man with 100 or more international football caps', 'Name any NBA All-Star from 1951 to 2026', 'Name any Best Picture Oscar winner',
    'Name any act inducted into the Rock and Roll Hall of Fame', 'Name any musical nominated for the Tony for Best Musical',
    "Name any club in Europe's big five leagues in 2025-26", 'Name any of the 129 best-selling music artists of all time']) assert.ok(namesItsList(h), h);
});
test('open-ended headlines fail', () => {
  for (const h of ['Name footballers', 'Name Premier League players', 'Name bands', 'Name TV sitcoms', 'Name superheroes', 'Name painters',
    'Name car brands', 'Name tech companies', 'Name best-selling video games', 'Name stage musicals', 'Name famous scientists', 'Name all-time great video games']) assert.ok(!namesItsList(h), h);
});
