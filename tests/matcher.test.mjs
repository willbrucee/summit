import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalise, toKey, editDistance, buildIndex, match, canAutoAccept, allowedTypos } from '../js/matcher.js';
import { variants } from '../build/aliases.mjs';

const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const indexes = new Map(data.prompts.map((p) => [p.id, buildIndex(p.answers)]));
// Small fixed lists for matcher behaviour that no longer has a prompt of its own.
const fixed = (labels) => buildIndex(labels.map((l, id) => { const [label, ...aliases] = l.split('|'); return { id, label, aliases }; }));
indexes.set('nato-alphabet', fixed(['Alfa|Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett|Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu']));
indexes.set('element-symbols', fixed(['H', 'He', 'Fe', 'Au', 'Ag', 'F', 'Pb']));
// Monarch numbers, with the same number variants the build generates.
indexes.set('monarchs', fixed(['Henry VII', 'Henry VIII', 'Elizabeth I', 'Elizabeth II', 'George III'].map((l) => [l, ...variants(l)].join('|'))));
indexes.set('programming-languages', fixed(['C', 'C#', 'C++', 'F#', 'Python', 'Java', 'JavaScript']));
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
  ['animated-studios', 'Toy Story 4', 'Toy Story 4'],
  ['animated-studios', 'Toy Story 6', 'wrong'],
  ['box-office', 'Frozen 3', 'wrong'],
  ['monarchs', 'Henry 8', 'Henry VIII'],
  ['monarchs', 'henry viii', 'Henry VIII'],
  // Shared surnames hand out the next one
  ['leaders', 'Bush', 'George H. W. Bush'],
  ['leaders', 'Bush', 'George W. Bush', ['George H. W. Bush']],
  ['leaders', 'Adams', 'John Quincy Adams', ['John Adams']],
  ['leaders', 'JFK', 'John F. Kennedy'],
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

// The candidate index must never change an answer: compare with a scan over every alias.
test('indexed typo lookup gives the same results as a full scan', () => {
  const brute = (index, text, found) => {
    const key = toKey(text);
    if (index.exact.has(key)) return 'exact';
    const near = new Set();
    for (const { key: alias, i } of index.entries) {
      const limit = allowedTypos(Math.min(key.length, alias.length));
      if (limit === 0 || key.replace(/\D/g, '') !== alias.replace(/\D/g, '')) continue;
      if (editDistance(key, alias, limit) <= limit) near.add(i);
    }
    return near.size === 1 ? [...near][0] : near.size > 1 ? 'ambiguous' : 'wrong';
  };
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let checked = 0;
  for (const p of data.prompts.slice(0, 40)) {
    const index = ix(p.id);
    for (const a of p.answers.slice(0, 12)) {
      const s = a.label;
      const k = Math.floor(rand() * s.length);
      const typo = rand() < 0.5 ? s.slice(0, k) + s.slice(k + 1) : s.slice(0, k) + 'x' + s.slice(k);
      const r = match(index, typo, new Set());
      const fast = r.result === 'correct' ? (r.corrected ? r.index : 'exact') : r.ambiguous ? 'ambiguous' : 'wrong';
      const slow = brute(index, typo);
      if (fast === 'exact' || slow === 'exact') continue;
      assert.equal(fast, slow, `${p.id}: "${typo}"`);
      checked++;
    }
  }
  assert.ok(checked > 300);
});
