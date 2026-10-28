import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex, match, toKey } from '../js/matcher.js';
import { variants, shortenings, initialism, goodWikidataAlias, acceptAliases, expand } from '../build/aliases.mjs';

const ALIASES = JSON.parse(readFileSync(new URL('../data/aliases.json', import.meta.url), 'utf8')).global;
const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));

// Runs a small prompt through the same alias steps as the build.
function fixture(lines, { titles = false } = {}) {
  const answers = lines.map((l) => {
    const [label, ...rest] = l.split('|').map((s) => s.trim());
    const seen = new Set([toKey(label)]);
    const aliases = [];
    for (const t of rest) if (!seen.has(toKey(t))) { seen.add(toKey(t)); aliases.push({ text: t, src: 'c' }); }
    for (const t of [label, ...rest]) for (const v of variants(t)) if (!seen.has(toKey(v))) { seen.add(toKey(v)); aliases.push({ text: v, src: 'v' }); }
    return { label, aliases };
  });
  const extra = [];
  answers.forEach((a, i) => {
    for (const t of ALIASES[a.label] || []) extra.push({ answer: i, text: t, src: 'a' });
    if (titles) for (const t of shortenings(a.label)) extra.push({ answer: i, text: t, src: 'g' });
  });
  const { dropped } = acceptAliases(answers, expand(extra));
  const plain = answers.map((a) => ({ label: a.label, aliases: a.aliases.map((x) => x.text) }));
  return { index: buildIndex(plain), dropped, answers: plain };
}
const guess = (fx, text) => {
  const r = match(fx.index, text, new Set());
  return r.result === 'correct' ? fx.answers[r.index].label : r.result;
};

const games = fixture([
  "Tom Clancy's Rainbow Six Siege", 'Call of Duty', 'Call of Duty: Warzone | Warzone', 'Grand Theft Auto', 'Grand Theft Auto V',
  'World of Warcraft', 'League of Legends', 'Super Mario 64', 'Super Mario Bros.', 'Super Mario Odyssey', 'Rainbow Islands',
], { titles: true });

const cities = fixture(['New York City', 'Los Angeles', 'Las Vegas', 'Lagos']);
const clubs = fixture(['Manchester United', 'Manchester City', 'Tottenham Hotspur', 'FC Barcelona', 'West Bromwich Albion', 'Brighton & Hove Albion']);
const real = (id) => {
  const p = data.prompts.find((x) => x.id === id);
  return { index: buildIndex(p.answers), answers: p.answers };
};
const countries = real('countries-world');
const nba = real('nba-teams');

const cases = [
  [games, 'R6', "Tom Clancy's Rainbow Six Siege"],
  [games, 'r6', "Tom Clancy's Rainbow Six Siege"],
  [games, 'R6S', "Tom Clancy's Rainbow Six Siege"],
  [games, 'Siege', "Tom Clancy's Rainbow Six Siege"],
  [games, 'Rainbow Six', "Tom Clancy's Rainbow Six Siege"],
  [games, 'Rainbow Six Siege', "Tom Clancy's Rainbow Six Siege"],
  [games, 'Rainbow 6 Siege', "Tom Clancy's Rainbow Six Siege"],
  [games, 'rainbow 6', "Tom Clancy's Rainbow Six Siege"],
  [games, 'CoD', 'Call of Duty'],
  [games, 'cod', 'Call of Duty'],
  [games, 'Warzone', 'Call of Duty: Warzone'],
  [games, 'GTA', 'Grand Theft Auto'],
  [games, 'GTA5', 'Grand Theft Auto V'],
  [games, 'GTA V', 'Grand Theft Auto V'],
  [games, 'Grand Theft Auto 5', 'Grand Theft Auto V'],
  [games, 'Grand Theft Auto five', 'Grand Theft Auto V'],
  [games, 'WoW', 'World of Warcraft'],
  [games, 'LoL', 'League of Legends'],
  [games, 'Super Mario', 'wrong'], // the start of three games, so no shortening
  [games, 'Super Mario Bros', 'Super Mario Bros.'],
  [games, 'GTB', 'wrong'], // short names must be exact
  [games, 'WoV', 'wrong'],
  [games, 'R7', 'wrong'],
  [games, 'Rainbow', 'wrong'], // could be either Rainbow game
  [cities, 'NYC', 'New York City'],
  [cities, 'New York', 'New York City'],
  [cities, 'LA', 'Los Angeles'],
  [cities, 'L.A.', 'Los Angeles'],
  [cities, 'LV', 'wrong'],
  [clubs, 'Man U', 'Manchester United'],
  [clubs, 'Man Utd', 'Manchester United'],
  [clubs, 'man city', 'Manchester City'],
  [clubs, 'Spurs', 'Tottenham Hotspur'],
  [clubs, 'Barca', 'FC Barcelona'],
  [clubs, 'Barça', 'FC Barcelona'],
  [clubs, 'Albion', 'wrong'], // West Brom and Brighton both offered it
  [clubs, 'Manchester', 'wrong'],
  [countries, 'UK', 'United Kingdom'],
  [countries, 'U.K.', 'United Kingdom'],
  [countries, 'UAE', 'United Arab Emirates'],
  [countries, 'DRC', 'DR Congo'],
  [countries, 'USA', 'United States'],
  [countries, 'KE', 'wrong'], // no country codes
  [nba, 'Spurs', 'San Antonio Spurs'],
  [nba, 'Sixers', 'Philadelphia 76ers'],
  [nba, 'OKC', 'Oklahoma City Thunder'],
];

for (const [fx, text, expected] of cases) {
  test(`"${text}" -> ${expected}`, () => assert.equal(guess(fx, text), expected));
}

test('an abbreviation two answers could share is dropped and reported', () => {
  const albion = clubs.dropped.find((d) => toKey(d.text) === 'albion');
  assert.ok(albion);
  assert.deepEqual(albion.answers.sort(), ['Brighton & Hove Albion', 'West Bromwich Albion']);
});

test('number forms both ways, never for "one" or Xbox Series X', () => {
  assert.ok(variants('Rainbow Six Siege').includes('Rainbow 6 Siege'));
  assert.ok(variants("Ocean's 11").includes("Ocean's eleven"));
  assert.ok(variants('Henry VIII').includes('Henry 8'));
  assert.ok(variants('Frozen II').includes('Frozen 2'));
  assert.deepEqual(variants('One Direction'), []);
  assert.ok(!variants('Xbox Series X').some((v) => v.includes('10')));
});

test('shortenings drop a leading name and keep whole words only', () => {
  const s = shortenings("Tom Clancy's Rainbow Six Siege");
  assert.ok(s.includes('Rainbow Six Siege'));
  assert.ok(s.includes('Rainbow Six'));
  assert.ok(!shortenings('The Lord of the Rings').some((x) => /of$/.test(x)));
});

test('initialisms skip common words', () => {
  assert.ok(initialism('Call of Duty').includes('cod'));
  assert.ok(initialism('United Kingdom').includes('uk'));
  assert.equal(initialism('Cat Army Tribe'), null);
  assert.equal(initialism('Kenya'), null);
});

test('Wikidata aliases: no codes, no other scripts, no junk', () => {
  assert.equal(goodWikidataAlias('KEN', 'Kenya', false), false);
  assert.equal(goodWikidataAlias('Republic of Kenya', 'Kenya', false), true);
  assert.equal(goodWikidataAlias('ケニア', 'Kenya', false), false);
  assert.equal(goodWikidataAlias('CoD', 'Call of Duty', true), true);
  assert.equal(goodWikidataAlias('the', 'Them', true), false);
  assert.equal(goodWikidataAlias('Kenya (country)', 'Kenya', false), false);
  assert.equal(goodWikidataAlias('David Winter', 'Winston Churchill', false), false); // a pen name
  assert.equal(goodWikidataAlias('Kopie naar Anthony van Dyck', 'Anthony van Dyck', false), false);
  assert.equal(goodWikidataAlias('Rainer Mariyah Rilḳeh', 'Rainer Maria Rilke', false), false);
  assert.equal(goodWikidataAlias('Claudius 1', 'Claudius', false), false);
  assert.equal(goodWikidataAlias('Debussy', 'Claude Debussy', false), true);
  assert.equal(goodWikidataAlias('Republic of Turkey', 'Turkey', false), true);
});
