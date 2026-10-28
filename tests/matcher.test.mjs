import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalise, toKey, editDistance, buildIndex, match, canAutoAccept, allowedTypos } from '../js/matcher.js';

const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const indexes = new Map(data.prompts.map((p) => [p.id, buildIndex(p.answers)]));
const ix = (id) => indexes.get(id);

// Label of the answer a guess lands on, or the result type when it misses.
function guess(id, text, found = []) {
  const index = ix(id);
  const set = new Set(found.map((label) => index.answers.findIndex((a) => a.label === label)));
  const r = match(index, text, set);
  if (r.result === 'correct' || r.result === 'already') return r.result === 'already' ? `already:${index.answers[r.index].label}` : index.answers[r.index].label;
  return r.result;
}
const corrected = (id, text) => match(ix(id), text, new Set()).corrected;

const cases = [
  // Collisions and prefixes in country names
  ['countries-world', 'Niger', 'Niger'],
  ['countries-world', 'Nigeria', 'Nigeria'],
  ['countries-world', 'Guinea', 'Guinea'],
  ['countries-world', 'Guinea-Bissau', 'Guinea-Bissau'],
  ['countries-world', 'guinea bissau', 'Guinea-Bissau'],
  ['countries-world', 'GuineaBissau', 'Guinea-Bissau'],
  ['countries-world', 'Papua New Guinea', 'Papua New Guinea'],
  ['countries-world', 'PNG', 'Papua New Guinea'],
  ['countries-world', 'Equatorial Guinea', 'Equatorial Guinea'],
  ['countries-world', 'Sudan', 'Sudan'],
  ['countries-world', 'South Sudan', 'South Sudan'],
  ['countries-world', 'Dominica', 'Dominica'],
  ['countries-world', 'Dominican Republic', 'Dominican Republic'],
  ['countries-world', 'Dominca', 'Dominica'],
  ['countries-world', 'Congo', 'Republic of the Congo'],
  ['countries-world', 'Congo', 'DR Congo', ['Republic of the Congo']],
  ['countries-world', 'Congo', 'already:Republic of the Congo', ['Republic of the Congo', 'DR Congo']],
  ['countries-world', 'DRC', 'DR Congo'],
  ['countries-world', 'Zaire', 'DR Congo'],
  ['countries-world', 'Congo-Brazzaville', 'Republic of the Congo'],
  ['countries-world', 'Korea', 'South Korea', ['North Korea']],
  ['countries-world', 'Gambia', 'Gambia'],
  ['countries-world', 'The Gambia', 'Gambia'],
  ['countries-world', 'Zambia', 'Zambia'],
  // Synonyms count once
  ['countries-world', 'USA', 'United States'],
  ['countries-world', 'America', 'United States'],
  ['countries-world', 'U.S.A.', 'United States'],
  ['countries-world', 'the United Kingdom', 'United Kingdom'],
  ['countries-world', 'Great Britain', 'United Kingdom'],
  ['countries-world', 'USA', 'already:United States', ['United States']],
  // Accents, ampersands, Saint and St
  ['countries-world', "Côte d'Ivoire", 'Ivory Coast'],
  ['countries-world', 'cote divoire', 'Ivory Coast'],
  ['countries-world', 'St Lucia', 'Saint Lucia'],
  ['countries-world', 'St. Lucia', 'Saint Lucia'],
  ['countries-world', 'Trinidad & Tobago', 'Trinidad and Tobago'],
  ['countries-world', 'Bosnia & Herzegovina', 'Bosnia and Herzegovina'],
  ['countries-world', 'São Tomé and Príncipe', 'Sao Tome and Principe'],
  ['countries-world', 'Turkiye', 'Turkey'],
  // Typos
  ['countries-world', 'Mozambiqe', 'Mozambique'],
  ['countries-world', 'Mozmabique', 'Mozambique'],
  ['countries-world', 'Nigeira', 'Nigeria'],
  ['countries-world', 'Swizerland', 'Switzerland'],
  ['countries-world', 'Phillipines', 'Philippines'],
  ['countries-world', 'Kazakstan', 'Kazakhstan'],
  ['countries-world', 'Malli', 'wrong'], // Mali has four letters, so it must be exact
  ['countries-world', 'Malawii', 'Malawi'],
  ['countries-world', 'Irak', 'wrong'], // four letters must be exact
  ['countries-world', 'Austrlia', 'wrong'], // one step from both Australia and Austria
  ['countries-world', 'Nigeri', 'wrong'], // one step from both Niger and Nigeria
  ['countries-world', 'Mozambiqe', 'already:Mozambique', ['Mozambique']],
  ['countries-world', 'Narnia', 'wrong'],
  ['countries-world', '   ', 'empty'],
  // Thresholds by length
  ['nato-alphabet', 'Gulf', 'wrong'],
  ['nato-alphabet', 'Bravvo', 'Bravo'],
  ['nato-alphabet', 'Brvvoo', 'wrong'],
  ['nato-alphabet', 'Novembre', 'November'],
  ['nato-alphabet', 'Nvembar', 'wrong'],
  ['nato-alphabet', 'xray', 'X-ray'],
  ['nato-alphabet', 'X ray', 'X-ray'],
  // Plurals when answers are singular
  ['mammals', 'Lions', 'Lion'],
  ['mammals', 'foxes', 'Fox'],
  ['mammals', 'Ponies', 'Pony'],
  ['mammals', 'wolves', 'Wolf'],
  ['mammals', 'mice', 'Mouse'],
  ['mammals', 'Hippopotamuses', 'Hippopotamus'],
  ['mammals', 'Buffalo', 'Water buffalo'],
  ['mammals', 'Buffalo', 'African buffalo', ['Water buffalo']],
  // Hyphens, spaces and leading "the"
  ['superheroes', 'Spider Man', 'Spider-Man'],
  ['superheroes', 'spiderman', 'Spider-Man'],
  ['bands', 'Beatles', 'The Beatles'],
  ['bands', 'the beatles', 'The Beatles'],
  ['mountains', 'Mt Fuji', 'Mount Fuji'],
  // Numbers never count as typos, Roman numerals have digit spellings
  ['missions', 'Apollo 13', 'Apollo 13'],
  ['missions', 'Apollo 18', 'wrong'],
  ['pixar', 'Toy Story 6', 'wrong'],
  ['monarchs', 'Henry 8', 'Henry VIII'],
  ['monarchs', 'henry viii', 'Henry VIII'],
  // Shared surnames hand out the next one
  ['us-presidents', 'Bush', 'George H. W. Bush'],
  ['us-presidents', 'Bush', 'George W. Bush', ['George H. W. Bush']],
  ['us-presidents', 'Adams', 'John Quincy Adams', ['John Adams']],
  ['us-presidents', 'JFK', 'John F. Kennedy'],
  // Spellings
  ['elements', 'Aluminum', 'Aluminium'],
  ['elements', 'sulphur', 'Sulfur'],
  ['colours', 'gray', 'Grey'],
  ['element-symbols', 'fe', 'Fe'],
  ['programming-languages', 'C#', 'C#'],
  ['programming-languages', 'C', 'C'],
  ['programming-languages', 'c++', 'C++'],
  ['capitals-world', 'Washington DC', 'Washington, D.C.'],
  ['capitals-world', 'Kingstown', 'Kingstown'],
  ['capitals-world', 'Kingston', 'Kingston'],
];

for (const [id, text, expected, found = []] of cases) {
  test(`${id}: "${text}"${found.length ? ' after ' + found.join(', ') : ''} -> ${expected}`, () => {
    assert.equal(guess(id, text, found), expected);
  });
}

test('auto-accept waits while a longer answer is still possible', () => {
  assert.equal(canAutoAccept(ix('countries-world'), 'Niger'), false);
  assert.equal(canAutoAccept(ix('countries-world'), 'Nigeria'), true);
  assert.equal(canAutoAccept(ix('countries-world'), 'Guinea'), false);
  assert.equal(canAutoAccept(ix('countries-world'), 'Dominica'), false);
  assert.equal(canAutoAccept(ix('countries-world'), 'Sudan'), true);
  assert.equal(canAutoAccept(ix('countries-world'), 'Chad'), true);
  assert.equal(canAutoAccept(ix('countries-world'), 'Mozambiqe'), false);
});

test('typo corrections are flagged so the game can show the spelling', () => {
  assert.equal(corrected('countries-world', 'Mozambiqe'), true);
  assert.equal(corrected('countries-world', 'Mozambique'), false);
});

test('normalise strips accents, punctuation, spacing and a leading "the"', () => {
  assert.equal(normalise('  The   Côte-d’Ivoire '), 'cote divoire');
  assert.equal(normalise('St. Kitts & Nevis'), 'saint kitts and nevis');
  assert.equal(toKey('Guinea-Bissau'), 'guineabissau');
  assert.equal(normalise('The'), 'the');
});

test('Damerau-Levenshtein distance counts a swap as one step', () => {
  assert.equal(editDistance('ca', 'ac'), 1);
  assert.equal(editDistance('kitten', 'sitting'), 3);
  assert.equal(editDistance('abc', 'abc'), 0);
  assert.equal(allowedTypos(4), 0);
  assert.equal(allowedTypos(7), 1);
  assert.equal(allowedTypos(8), 2);
});
