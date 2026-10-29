// Every prompt in the game. Lists live in build/curated; Wikidata results in data/raw.
import * as A from './curated/animals.mjs';
import * as N from './curated/nature.mjs';
import * as G from './curated/geography.mjs';
import * as S from './curated/science.mjs';
import * as F from './curated/food.mjs';
import * as M from './curated/music.mjs';
import * as FI from './curated/film.mjs';
import * as B from './curated/books.mjs';
import * as H from './curated/history.mjs';
import * as L from './curated/language.mjs';
import * as BO from './curated/body.mjs';
import * as T from './curated/tech.mjs';
import * as SPO from './curated/sport.mjs';

// Hidden topics. Round 1 is always a geography opener; rounds 2 to 5 come from four different others.
export const CATEGORIES = {
  geo: 'Geography',
  animals: 'Animals',
  food: 'Food and drink',
  screen: 'Film and TV',
  music: 'Music',
  games: 'Video games',
  sport: 'Sport',
  brands: 'Brands',
  science: 'Science and nature',
  history: 'History and people',
  words: 'Words and general knowledge',
};

const SOVEREIGN = 'UN members plus Vatican City and Palestine.';
const OR_CAPITALS = 'Countries or their capital cities, both count.';

// list: curated text. countries / capitals: the country table. wikidata: a cached query.
// wiki: a Wikipedia list from build/lists.mjs (aliasList adds curated spellings).
// parts: a union of the above, each part named for the answer board.
export const PROMPTS = [
  // Geography openers
  { id: 'countries-world', category: 'geo', text: 'Name countries', note: SOVEREIGN, difficulty: 1, finite: true, countries: () => true },
  { id: 'countries-africa', groupTitle: 'Kind', category: 'geo', text: 'Name countries or capitals in Africa', note: OR_CAPITALS, difficulty: 2, finite: true, parts: [{ from: 'Countries', countries: (c) => c.tags.includes('AF') }, { from: 'Capitals', capitals: (c) => c.tags.includes('AF') }] },
  { id: 'countries-europe', groupTitle: 'Kind', category: 'geo', text: 'Name countries or capitals in Europe', note: OR_CAPITALS + ' Russia and Turkey count.', difficulty: 1, finite: true, parts: [{ from: 'Countries', countries: (c) => c.tags.includes('EU') }, { from: 'Capitals', capitals: (c) => c.tags.includes('EU') }] },
  { id: 'countries-asia', groupTitle: 'Kind', category: 'geo', text: 'Name countries or capitals in Asia', note: OR_CAPITALS + ' Russia and Turkey count.', difficulty: 2, finite: true, parts: [{ from: 'Countries', countries: (c) => c.tags.includes('AS') }, { from: 'Capitals', capitals: (c) => c.tags.includes('AS') }] },
  { id: 'countries-americas', groupTitle: 'Kind', category: 'geo', text: 'Name countries or capitals in the Americas', note: OR_CAPITALS + ' North, Central and South America and the Caribbean.', difficulty: 2, finite: true, parts: [{ from: 'Countries', countries: (c) => c.tags.includes('NA') || c.tags.includes('SA') }, { from: 'Capitals', capitals: (c) => c.tags.includes('NA') || c.tags.includes('SA') }] },
  { id: 'capitals-world', category: 'geo', text: 'Name capital cities', note: 'National capitals of sovereign countries.', difficulty: 1, finite: true, capitals: () => true },
  { id: 'us-states', groupTitle: 'Kind', category: 'geo', text: 'Name US states or state capitals', note: 'The 50 states and their 50 capitals.', difficulty: 1, finite: true, parts: [{ from: 'States', wikidata: 'us_states' }, { from: 'Capitals', list: G.STATE_CAPITALS }] },
  { id: 'world-cities', category: 'geo', text: 'Name the biggest cities on Earth', note: 'Any of the {n} largest cities by urban population. UN estimates, 2025.', difficulty: 2, finite: true, wiki: 'world-cities' },
  { id: 'us-cities', category: 'geo', text: 'Name big American cities', note: 'Any of the {n} largest US cities by population. Census Bureau estimates, 2025.', difficulty: 1, finite: true, wiki: 'us-cities', outsideLine: "That's a real city, just outside the top 100" },
  { id: 'uk-cities', category: 'geo', text: 'Name cities in the UK', note: 'Any place in the UK with official city status, 2026.', difficulty: 1, finite: true, wiki: 'uk-cities' },
  { id: 'islands', groupBy: 'continent', category: 'geo', text: 'Name islands', difficulty: 1, finite: false, list: G.ISLANDS },
  { id: 'rivers', groupBy: 'continent', category: 'geo', text: 'Name rivers', note: 'Just the name is fine, no need for "River".', difficulty: 2, finite: false, list: G.RIVERS },
  { id: 'seas-oceans', groupBy: 'continent', category: 'geo', text: 'Name oceans, seas and gulfs', difficulty: 2, finite: false, list: G.SEAS },
  { id: 'mountains', groupBy: 'continent', category: 'geo', text: 'Name mountains', difficulty: 2, finite: false, list: N.MOUNTAINS },

  // Animals
  { id: 'animals', category: 'animals', text: 'Name animals', difficulty: 1, finite: false, union: [A.MAMMALS, A.BIRDS, A.REPTILES, A.FISH, A.INSECTS, A.SEA_CREATURES], unionNames: ['Mammals', 'Birds', 'Reptiles', 'Fish', 'Insects', 'Other sea creatures'] },
  { id: 'mammals', category: 'animals', text: 'Name mammals', difficulty: 1, finite: false, list: A.MAMMALS },
  { id: 'birds', category: 'animals', text: 'Name birds', difficulty: 1, finite: false, list: A.BIRDS },
  { id: 'dog-breeds', category: 'animals', text: 'Name dog breeds', note: "Any breed on Wikipedia's list of dog breeds, 2026.", difficulty: 1, finite: true, wiki: 'dog-breeds', aliasList: A.DOG_BREEDS },
  { id: 'insects', category: 'animals', text: 'Name insects', note: 'Six legs only, so no spiders.', difficulty: 2, finite: false, list: A.INSECTS },
  { id: 'reptiles', category: 'animals', text: 'Name reptiles', difficulty: 2, finite: false, list: A.REPTILES },
  { id: 'fish', category: 'animals', text: 'Name fish', difficulty: 1, finite: false, list: A.FISH },
  { id: 'sea-creatures', category: 'animals', text: 'Name sea creatures', note: 'Anything that lives in the sea, except seabirds.', difficulty: 1, finite: false, list: A.SEA_CREATURES },
  { id: 'dinosaurs', category: 'animals', text: 'Name dinosaurs and other prehistoric reptiles', difficulty: 2, finite: false, list: A.DINOSAURS },

  // Food and drink
  { id: 'fruits', category: 'food', text: 'Name fruits', difficulty: 1, finite: false, list: F.FRUITS },
  { id: 'vegetables', category: 'food', text: 'Name vegetables', difficulty: 1, finite: false, list: F.VEGETABLES },
  { id: 'herbs-spices', category: 'food', text: 'Name herbs and spices', difficulty: 1, finite: false, list: F.HERBS_SPICES },
  { id: 'cheeses', category: 'food', text: 'Name cheeses', difficulty: 2, finite: false, list: F.CHEESES },
  { id: 'desserts', category: 'food', text: 'Name desserts and puddings', difficulty: 1, finite: false, list: F.DESSERTS },
  { id: 'coffee', category: 'food', text: 'Name coffee drinks', difficulty: 2, finite: false, list: F.COFFEE },
  { id: 'sauces', category: 'food', text: 'Name sauces, dips and condiments', difficulty: 1, finite: false, list: F.SAUCES },

  // Film and TV
  { id: 'box-office', kind: 'media', groupBy: 'decade', category: 'screen', text: 'Name any film in an all-time box office top 100', note: 'The US and Canada top 100, the inflation-adjusted top 100, or the worldwide top 50. Box Office Mojo via Wikipedia, 2026.', difficulty: 1, finite: true, wiki: 'box-office', outsideLine: 'Real film, just outside the box office top 100s' },
  { id: 'animated-studios', kind: 'media', groupBy: 'from', groupTitle: 'Studio', category: 'screen', text: 'Name any Disney, Pixar or DreamWorks animated film up to 2026', note: 'Animated features released by Walt Disney Animation Studios, Pixar or DreamWorks Animation.', difficulty: 1, finite: true, wiki: 'animated-studios' },
  { id: 'best-picture', kind: 'media', groupBy: 'decade', category: 'screen', text: 'Name any Best Picture Oscar winner', note: 'Every winner of the Academy Award for Best Picture.', difficulty: 3, finite: true, wikidata: 'best_picture' },
  { id: 'simpsons', people: true, kind: 'media', category: 'screen', text: "Name any of the {n} characters on Wikipedia's list of Simpsons characters", note: "The main and recurring characters on Wikipedia's list of The Simpsons characters, 2026.", difficulty: 2, finite: true, wiki: 'simpsons-characters', aliasList: FI.SIMPSONS },
  { id: 'sitcoms', kind: 'media', groupBy: 'decade', category: 'screen', text: 'Name any show that won the Emmy for best comedy or drama series', note: 'Every winner of the Primetime Emmy for outstanding comedy series or drama series, 1949 to 2025.', difficulty: 2, finite: true, wiki: 'emmy-series' },
  { id: 'harry-potter', kind: 'media', category: 'screen', text: "Name any of the {n} Harry Potter characters on Wikipedia's list", note: "Every character on Wikipedia's list of Harry Potter characters, 2026. Surnames are fine.", difficulty: 1, finite: true, wiki: 'harry-potter-characters', aliasList: B.HARRY_POTTER, people: true },

  // Music
  { id: 'best-selling-artists', people: true, kind: 'people', category: 'music', text: 'Name any of the {n} best-selling music artists of all time', note: "Every act on Wikipedia's best-selling music artists list (75 million or more records claimed), 2026.", difficulty: 1, finite: true, wiki: 'best-selling-artists', outsideLine: 'Real star, just outside the best-seller list' },
  { id: 'spotify-songs', kind: 'media', groupBy: 'decade', category: 'music', text: 'Name any of the {n} most-streamed songs on Spotify', note: 'The most-streamed songs of all time on Spotify, 2026.', difficulty: 2, finite: true, wiki: 'spotify-songs', outsideLine: 'Real hit, just outside the Spotify top 100' },
  { id: 'best-selling-albums', kind: 'media', groupBy: 'decade', category: 'music', text: 'Name any of the {n} best-selling albums of all time', note: "Every album on Wikipedia's list with 20 million or more certified copies, 2026.", difficulty: 3, finite: true, wiki: 'best-selling-albums' },
  { id: 'instruments', category: 'music', text: 'Name musical instruments', difficulty: 1, finite: false, list: M.INSTRUMENTS },
  { id: 'genres', category: 'music', text: 'Name music genres', difficulty: 1, finite: false, list: M.GENRES },
  { id: 'bands', people: true, kind: 'people', category: 'music', text: 'Name any act inducted into the Rock and Roll Hall of Fame', note: 'Performers inducted from 1986 to 2025, bands or solo.', difficulty: 2, finite: true, wiki: 'rock-hall', aliasList: M.BANDS },
  { id: 'dances', category: 'music', text: 'Name dances', difficulty: 1, finite: false, list: M.DANCES },
  { id: 'beatles-songs', kind: 'media', groupBy: 'decade', category: 'music', text: 'Name any of the {n} songs The Beatles released', note: 'Songs released by The Beatles, including covers they recorded.', difficulty: 2, finite: true, list: M.BEATLES_SONGS },

  // Video games
  { id: 'best-selling-games', kind: 'games', groupBy: 'decade', category: 'games', text: 'Name any of the {n} best-selling video games ever', note: "Ranked by copies sold on Wikipedia's charts: the overall top 50, then each game's console and PC sales added up, 2026.", difficulty: 1, finite: true, wiki: 'best-selling-games', outsideLine: 'Real game, just outside the top {n}' },
  { id: 'classic-games', kind: 'games', groupBy: 'decade', category: 'games', text: "Name any of the {n} games on critics' all-time best lists", note: "Every game on Wikipedia's list of video games considered the best, 2026.", difficulty: 2, finite: true, wiki: 'classic-games' },

  // Sport
  { id: 'sports', category: 'sport', text: 'Name sports', difficulty: 1, finite: false, list: SPO.SPORTS },
  { id: 'olympic-sports', category: 'sport', text: 'Name Olympic sports', note: 'Past, present or confirmed for LA 2028.', difficulty: 2, finite: false, list: SPO.OLYMPIC_SPORTS },
  { id: 'us-teams', kind: 'brands', groupTitle: 'League', category: 'sport', text: 'Name any NBA, NFL, MLB or NHL team in 2026', note: 'The {n} current teams. The nickname is enough.', difficulty: 2, finite: true, parts: [{ from: 'NBA', list: SPO.NBA }, { from: 'NFL', list: SPO.NFL }, { from: 'MLB', list: SPO.MLB }, { from: 'NHL', list: SPO.NHL }] },
  { id: 'football-clubs', kind: 'brands', groupBy: 'from', groupTitle: 'League', category: 'sport', text: "Name any club in Europe's big five leagues in 2025-26", note: 'The {n} clubs in the Premier League, La Liga, Serie A, Bundesliga and Ligue 1.', difficulty: 2, finite: true, wiki: 'football-clubs' },
  { id: 'world-cup-nations', category: 'sport', text: 'Name countries that have played at a World Cup', note: "Any of the {n} nations to reach a men's FIFA World Cup, 1930 to 2026. West Germany counts as Germany, the Soviet Union as Russia.", difficulty: 1, finite: true, wiki: 'world-cup-nations' },
  { id: 'grand-slam-champions', people: true, kind: 'people', groupBy: 'from', groupTitle: 'Singles', category: 'sport', text: 'Name any Grand Slam singles champion', note: 'Anyone who has won a Grand Slam singles title, men or women, up to 2026. Surnames are fine.', difficulty: 2, finite: true, wiki: 'grand-slam-champions' },
  { id: 'f1-winners', people: true, kind: 'people', groupBy: 'born', category: 'sport', text: 'Name any Formula One race winner', note: 'Any of the {n} drivers who have won a Grand Prix, up to 2026. Surnames are fine.', difficulty: 3, finite: true, wiki: 'f1-winners' },
  { id: 'caps-100', people: true, kind: 'people', groupBy: 'born', category: 'sport', text: 'Name any man with 100 or more international football caps', note: "Any of the {n} men on Wikipedia's list of footballers with 100 or more caps, 2026. Surnames are fine.", difficulty: 1, finite: true, wiki: 'caps-100', outsideLine: 'Real player, just short of 100 caps' },
  { id: 'world-cup-winners', people: true, kind: 'people', groupBy: 'born', category: 'sport', text: 'Name any player from a World Cup winning squad', note: "Any of the {n} men in a winning squad at a men's FIFA World Cup, 1930 to 2026. Surnames are fine.", difficulty: 2, finite: true, wiki: 'world-cup-winners', outsideLine: 'Real player, but never in a World Cup winning squad' },
  { id: 'ballon-dor-podium', people: true, kind: 'people', groupBy: 'born', category: 'sport', text: "Name any player who finished in the Ballon d'Or top three", note: "Winners, runners-up and third places, 1956 to 2025. Surnames are fine.", difficulty: 2, finite: true, wiki: 'ballon-dor-podium', outsideLine: "Real player, but never in the Ballon d'Or top three" },
  { id: 'world-cup-scorers', people: true, kind: 'people', groupBy: 'born', category: 'sport', text: 'Name any player with 5 or more World Cup goals', note: "Men's FIFA World Cup finals goals, 1930 to 2026. Surnames are fine.", difficulty: 2, finite: true, wiki: 'world-cup-scorers', outsideLine: 'Real player, just short of 5 World Cup goals' },
  { id: 'nba-all-stars', people: true, kind: 'people', groupBy: 'born', category: 'sport', text: 'Name any NBA All-Star from 1951 to 2026', note: 'Every player picked for an NBA All-Star Game. Surnames are fine.', difficulty: 2, finite: true, wiki: 'nba-all-stars' },

  // Brands
  { id: 'car-brands', people: true, kind: 'brands', groupBy: 'from', groupTitle: 'Still making cars', category: 'brands', text: "Name any of the {n} car brands on Wikipedia's list", note: "Every make on Wikipedia's list of car brands, past or present, 2026.", difficulty: 1, finite: true, wiki: 'car-brands', aliasList: T.CAR_BRANDS },
  { id: 'fast-food', people: true, kind: 'brands', category: 'brands', text: "Name any of the {n} fast food chains on Wikipedia's list", note: "Every chain on Wikipedia's list of fast food restaurant chains, 2026.", difficulty: 1, finite: true, wiki: 'fast-food' },

  // Science and nature
  { id: 'elements', category: 'science', text: 'Name chemical elements', difficulty: 1, finite: true, wikidata: 'elements' },
  { id: 'metals', category: 'science', text: 'Name elements that are metals', note: 'Metalloids like silicon and arsenic do not count.', difficulty: 2, finite: true, wikidata: 'metals' },
  { id: 'units', category: 'science', text: 'Name units of measurement', difficulty: 1, finite: false, list: S.UNITS },
  { id: 'nobel', people: true, kind: 'people', groupBy: 'born', category: 'history', text: 'Name any Nobel Prize winner', note: 'Any of the {n} laureates in any category, people or organisations, 1901 to 2025. Surnames are fine.', difficulty: 2, finite: true, wiki: 'nobel' },
  { id: 'constellations', category: 'science', text: 'Name constellations', note: 'The 88 modern constellations.', difficulty: 3, finite: true, wikidata: 'constellations' },
  { id: 'trees', category: 'science', text: 'Name trees', difficulty: 1, finite: false, list: N.TREES },
  { id: 'flowers', category: 'science', text: 'Name flowers', difficulty: 1, finite: false, list: N.FLOWERS },
  { id: 'gemstones', category: 'science', text: 'Name gemstones and minerals', difficulty: 2, finite: false, list: N.GEMSTONES },
  { id: 'weather', category: 'science', text: 'Name kinds of weather', difficulty: 1, finite: false, list: N.WEATHER },
  { id: 'inventions', category: 'science', text: 'Name inventions', difficulty: 1, finite: false, list: T.INVENTIONS },
  { id: 'body-parts', category: 'science', text: 'Name parts of the body', difficulty: 1, finite: false, list: BO.BODY_PARTS },
  { id: 'organs', category: 'science', text: 'Name organs of the body', difficulty: 2, finite: false, list: BO.ORGANS },
  { id: 'bones', category: 'science', text: 'Name bones in the human body', difficulty: 2, finite: false, list: BO.BONES },
  { id: 'diseases', category: 'science', text: 'Name illnesses and diseases', difficulty: 1, finite: false, list: BO.DISEASES },

  // History and people
  { id: 'leaders', people: true, kind: 'people', groupTitle: 'Office', category: 'history', text: 'Name any US president or British prime minister since 1721', note: 'Surnames are fine. Type Bush or Adams twice to get both.', difficulty: 1, finite: true, parts: [{ from: 'US presidents', wikidata: 'us_presidents' }, { from: 'British prime ministers', wikidata: 'uk_prime_ministers' }] },
  { id: 'wars', category: 'history', text: 'Name wars', difficulty: 2, finite: false, list: H.WARS },
  { id: 'civilisations', category: 'history', text: 'Name ancient civilisations', difficulty: 2, finite: false, list: H.CIVILISATIONS },
  { id: 'empires', category: 'history', text: 'Name empires', difficulty: 2, finite: false, list: H.EMPIRES },
  { id: 'authors', people: true, kind: 'people', groupBy: 'born', category: 'history', text: 'Name any of the {n} best-selling fiction authors', note: "Every author on Wikipedia's list of best-selling fiction authors, 2026. Surnames are fine.", difficulty: 1, finite: true, wiki: 'best-selling-authors', aliasList: B.AUTHORS },

  // Words and general knowledge
  { id: 'colours', category: 'words', text: 'Name colours', difficulty: 1, finite: false, list: L.COLOURS },
  { id: 'languages', category: 'words', text: 'Name languages', difficulty: 1, finite: false, list: L.LANGUAGES },
  { id: 'synonyms-happy', category: 'words', text: 'Name words that mean happy', difficulty: 2, finite: false, list: L.HAPPY },
  { id: 'synonyms-big', category: 'words', text: 'Name words that mean big', difficulty: 2, finite: false, list: L.BIG },
  { id: 'rhymes-cat', category: 'words', text: 'Name words that rhyme with cat', difficulty: 1, finite: false, list: L.RHYMES_CAT },
];
