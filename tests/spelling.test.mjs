// Lenient spelling: misspelt names that must be accepted, and near neighbours that must stay
// rejected or too close to call. Real prompt data where it exists, a fixed list of famous
// footballers for player names (so these tests do not move when football prompts change).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex, match } from '../js/matcher.js';

const data = JSON.parse(readFileSync(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const real = (id) => {
  const p = data.prompts.find((x) => x.id === id);
  if (!p) throw new Error('no prompt ' + id);
  return buildIndex(p.answers, { people: p.people });
};
const fixture = (labels, options) => buildIndex(labels.map((l, id) => { const [label, ...aliases] = l.split('|'); return { id, label, aliases }; }), options);

const players = fixture([
  'Cristiano Ronaldo', 'Lionel Messi', 'Kylian Mbappé', 'Zlatan Ibrahimović', 'Zinedine Zidane', 'Thierry Henry', 'Wayne Rooney',
  'Steven Gerrard', 'Frank Lampard', 'Neymar', 'Mohamed Salah', 'Harry Kane', 'Kevin De Bruyne', 'Erling Haaland', 'Robert Lewandowski',
  'Luka Modrić', 'Andrés Iniesta', 'Xavi', 'Sergio Ramos', 'Gianluigi Buffon', 'Pelé', 'Diego Maradona', 'Ronaldinho', 'Kaká',
  'Ronaldo Nazário|Ronaldo', 'Gary Neville', 'Phil Neville', 'Bobby Charlton', 'Jack Charlton', 'Thiago Silva', 'David Silva',
  'Yaya Touré', 'Kolo Touré', 'Paul Pogba', 'Antoine Griezmann', 'Didier Drogba', 'Samuel Eto\'o', 'Johan Cruyff', 'Franz Beckenbauer',
  'Paolo Maldini', 'Alessandro Del Piero', 'Michael Owen', 'David Beckham', 'Alan Shearer', 'Jude Bellingham', 'Vinícius Júnior|Vinicius Jr',
], { people: true });

const ACCEPT = [
  // Players: typos, doubled letters, missing letters, sound-alikes, word order, surnames
  [players, 'Cristiano Ronalldo', 'Cristiano Ronaldo'],
  [players, 'Christiano Ronaldo', 'Cristiano Ronaldo'],
  [players, 'Ronaldo Cristiano', 'Cristiano Ronaldo'],
  [players, 'Krisitano Ronaldo', 'Cristiano Ronaldo'],
  [players, 'Lionel Mesi', 'Lionel Messi'],
  [players, 'Leonel Messi', 'Lionel Messi'],
  [players, 'Messi Lionel', 'Lionel Messi'],
  [players, 'Messi', 'Lionel Messi'],
  [players, 'Mesi', 'Lionel Messi'],
  [players, 'Mbapey', 'Kylian Mbappé'],
  [players, 'mbappe', 'Kylian Mbappé'],
  [players, 'Kilian Mbappe', 'Kylian Mbappé'],
  [players, 'Zlatan Ibrahimovich', 'Zlatan Ibrahimović'],
  [players, 'Ibrahimovic', 'Zlatan Ibrahimović'],
  [players, 'Zlatan', 'Zlatan Ibrahimović'],
  [players, 'Zinedine Zidan', 'Zinedine Zidane'],
  [players, 'Zidan', 'Zinedine Zidane'],
  [players, 'Thierry Henri', 'Thierry Henry'],
  [players, 'Wayne Rooneyy', 'Wayne Rooney'],
  [players, 'Rooney', 'Wayne Rooney'],
  [players, 'Steven Gerard', 'Steven Gerrard'],
  [players, 'Stephen Gerrard', 'Steven Gerrard'],
  [players, 'Lampad', 'Frank Lampard'],
  [players, 'Neymer', 'Neymar'],
  [players, 'Mohammed Salah', 'Mohamed Salah'],
  [players, 'Mo Salah', 'Mohamed Salah'],
  [players, 'Harry Cane', 'Harry Kane'],
  [players, 'Kevin de Bruyn', 'Kevin De Bruyne'],
  [players, 'De Bruyne', 'Kevin De Bruyne'],
  [players, 'Erling Haland', 'Erling Haaland'],
  [players, 'Haaland', 'Erling Haaland'],
  [players, 'Robert Lewandowsky', 'Robert Lewandowski'],
  [players, 'Lewandoski', 'Robert Lewandowski'],
  [players, 'Luka Modrich', 'Luka Modrić'],
  [players, 'Andreas Iniesta', 'Andrés Iniesta'],
  [players, 'Sergio Ramoz', 'Sergio Ramos'],
  [players, 'Buffon', 'Gianluigi Buffon'],
  [players, 'pele', 'Pelé'],
  [players, 'Maradonna', 'Diego Maradona'],
  [players, 'Ronaldiho', 'Ronaldinho'],
  [players, 'Kaka', 'Kaká'],
  [players, 'Pogba', 'Paul Pogba'],
  [players, 'Griezman', 'Antoine Griezmann'],
  [players, 'Didier Drogbaa', 'Didier Drogba'],
  [players, 'Samuel Etoo', 'Samuel Eto\'o'],
  [players, 'Johann Cruyff', 'Johan Cruyff'],
  [players, 'Cruijff', 'Johan Cruyff'],
  [players, 'Beckenbaur', 'Franz Beckenbauer'],
  [players, 'Paolo Maldni', 'Paolo Maldini'],
  [players, 'Del Piero', 'Alessandro Del Piero'],
  [players, 'Micheal Owen', 'Michael Owen'],
  [players, 'David Beckam', 'David Beckham'],
  [players, 'Alan Shearrer', 'Alan Shearer'],
  [players, 'Jude Bellingam', 'Jude Bellingham'],
  [players, 'Vinicius Junior', 'Vinícius Júnior'],
  // Countries
  ['countries-world', 'Mozambiqe', 'Mozambique'],
  ['countries-world', 'Phillipines', 'Philippines'],
  ['countries-world', 'Columbia', 'Colombia'],
  ['countries-world', 'Argentinia', 'Argentina'],
  ['countries-world', 'Kazakstan', 'Kazakhstan'],
  ['countries-world', 'Afganistan', 'Afghanistan'],
  ['countries-world', 'Venezuala', 'Venezuela'],
  ['countries-world', 'Lichtenstein', 'Liechtenstein'],
  ['countries-world', 'Luxemburg', 'Luxembourg'],
  ['countries-world', 'Swizerland', 'Switzerland'],
  ['countries-world', 'Belgum', 'Belgium'],
  ['countries-world', 'Bangledesh', 'Bangladesh'],
  ['countries-world', 'Madagaskar', 'Madagascar'],
  ['countries-world', 'Zimbabwi', 'Zimbabwe'],
  ['countries-world', 'Ukrane', 'Ukraine'],
  ['countries-world', 'Egpyt', 'Egypt'],
  ['countries-world', 'Morroco', 'Morocco'],
  ['countries-world', 'Equador', 'Ecuador'],
  ['countries-world', 'Isreal', 'Israel'],
  ['countries-world', 'Malasia', 'Malaysia'],
  ['countries-world', 'New Zeland', 'New Zealand'],
  ['countries-world', 'Saudi Arabai', 'Saudi Arabia'],
  ['countries-world', 'Domincan Republic', 'Dominican Republic'],
  ['countries-world', 'Guinea Bisau', 'Guinea-Bissau'],
  ['countries-world', 'south sudan', 'South Sudan'],
  ['countries-world', 'Cote dIvoire', 'Ivory Coast'],
  // Films
  ['box-office', 'Avengers Endgaem', 'Avengers: Endgame'],
  ['box-office', 'Titantic', 'Titanic'],
  ['box-office', 'Jurrasic Park', 'Jurassic Park'],
  ['box-office', 'Jurassic World Dominon', 'Jurassic World Dominion'],
  ['box-office', 'The Lion Kng', 'The Lion King'],
  ['box-office', 'Frozzen 2', 'Frozen 2'],
  ['box-office', 'Black Panter', 'Black Panther'],
  ['box-office', 'Spiderman No Way Home', 'Spider-Man: No Way Home'],
  ['box-office', 'Avatar the way of watter', 'Avatar: The Way of Water'],
  ['animated-studios', 'Ratatouile', 'Ratatouille'],
  ['animated-studios', 'Finding Nimo', 'Finding Nemo'],
  ['animated-studios', 'Shrek two', 'Shrek 2'],
  // Food
  ['fruits', 'Pinapple', 'Pineapple'],
  ['fruits', 'Bananna', 'Banana'],
  ['fruits', 'Rasberry', 'Raspberry'],
  ['fruits', 'Strawbery', 'Strawberry'],
  ['fruits', 'Pommegranate', 'Pomegranate'],
  ['vegetables', 'Brocoli', 'Broccoli'],
  ['vegetables', 'Cauliflour', 'Cauliflower'],
  ['vegetables', 'Aubergene', 'Aubergine'],
  ['vegetables', 'Zuccini', 'Courgette'],
  ['desserts', 'Tiramissu', 'Tiramisu'],
  ['desserts', 'Cheescake', 'Cheesecake'],
  ['cheeses', 'Mozzarela', 'Mozzarella'],
  ['cheeses', 'Parmesean', 'Parmesan'],
  ['cheeses', 'Chedar', 'Cheddar'],
  ['herbs-spices', 'Cinamon', 'Cinnamon'],
  // Games
  ['best-selling-games', 'Minecrfat', 'Minecraft'],
  ['best-selling-games', 'Tetirs', 'Tetris'],
  ['best-selling-games', 'Stardew Vally', 'Stardew Valley'],
  ['best-selling-games', 'Animal Crosing New Horizons', 'Animal Crossing: New Horizons'],
  ['best-selling-games', 'Red Dead Redemtion 2', 'Red Dead Redemption 2'],
  ['best-selling-games', 'Red Dead Redemption two', 'Red Dead Redemption 2'],
  ['best-selling-games', 'Mario Kart Eight Deluxe', 'Mario Kart 8 Deluxe'],
  ['best-selling-games', 'Terarria', 'Terraria'],
  ['classic-games', 'Pac Man', 'Pac-Man'],
  ['classic-games', 'Super Mario Brothers', 'Super Mario Bros.'],
  // Shortenings, joined or split forms, numbers
  ['football-clubs', 'Man City', 'Manchester City'],
  ['football-clubs', 'ManCity', 'Manchester City'],
  ['football-clubs', 'Man. City', 'Manchester City'],
  ['football-clubs', 'Man Utd', 'Manchester United'],
  ['football-clubs', 'Spurs', 'Tottenham Hotspur'],
  ['football-clubs', 'PSG', 'Paris Saint-Germain'],
  ['football-clubs', 'Barca', 'Barcelona'],
  ['countries-world', 'St Lucia', 'Saint Lucia'],
];

// Must stay rejected ('wrong') or too close to call ('ambiguous'), never a wrong answer.
const REJECT = [
  ['countries-world', 'Nigera', 'ambiguous'],
  ['countries-world', 'Nigerr', 'Niger'],
  ['countries-world', 'Dominican', 'ambiguous'],
  ['countries-world', 'Congo', 'ambiguous'],
  ['countries-world', 'Korea', 'ambiguous'],
  ['countries-world', 'New Guinea', 'not-accepted'],
  ['countries-world', 'Guinee Bissau', 'Guinea-Bissau'],
  ['countries-world', 'Guinea', 'Guinea'],
  ['countries-world', 'Niger', 'Niger'],
  ['countries-world', 'Nigeria', 'Nigeria'],
  ['countries-world', 'Sudan', 'Sudan'],
  ['countries-world', 'Dominica', 'Dominica'],
  ['countries-world', 'Austrlia', 'ambiguous'],
  ['countries-world', 'Narnia', 'not-accepted'],
  ['countries-world', 'Wales', 'not-accepted'],
  [players, 'Neville', 'ambiguous'],
  [players, 'Charlton', 'ambiguous'],
  [players, 'Silva', 'ambiguous'],
  [players, 'Toure', 'ambiguous'],
  [players, 'Ronaldo', 'ambiguous'],
  [players, 'Smith', 'not-accepted'],
  ['football-clubs', 'Manchester', 'not-accepted'],
  ['best-selling-games', 'Super Mario', 'not-accepted'],
  ['box-office', 'Frozen 3', 'not-accepted'],
  ['box-office', 'Toy Story 9', 'not-accepted'],
];

const label = (index, r) => (r.result === 'correct' || r.result === 'already' ? index.answers[r.index].label : r.ambiguous ? 'ambiguous' : 'wrong');
const ix = (where) => (typeof where === 'string' ? real(where) : where);

for (const [where, typed, want] of ACCEPT) {
  const name = typeof where === 'string' ? where : 'players';
  test(`accept ${name}: "${typed}" -> ${want}`, () => {
    const index = ix(where);
    assert.equal(label(index, match(index, typed)), want);
  });
}
for (const [where, typed, want] of REJECT) {
  const name = typeof where === 'string' ? where : 'players';
  test(`hold ${name}: "${typed}" -> ${want}`, () => {
    const index = ix(where);
    const got = label(index, match(index, typed));
    if (want === 'not-accepted') assert.ok(got === 'wrong' || got === 'ambiguous', `got ${got}`);
    else assert.equal(got, want);
  });
}
test('there are at least 100 new spelling cases', () => {
  assert.ok(ACCEPT.length + REJECT.length >= 100);
});
