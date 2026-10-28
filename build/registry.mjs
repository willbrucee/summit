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
  { id: 'box-office', groupBy: 'decade', category: 'screen', text: 'Name box office smash hits', note: 'Any film in the all-time top 100 in the US and Canada, or the worldwide top 50. Box Office Mojo via Wikipedia, 2026.', difficulty: 1, finite: true, wiki: 'box-office', outsideLine: "That's a real film, just outside the box office list" },
  { id: 'animated-studios', groupBy: 'from', groupTitle: 'Studio', category: 'screen', text: 'Name Disney, Pixar or DreamWorks films', note: 'Animated features released by Walt Disney Animation Studios, Pixar or DreamWorks Animation, up to 2026.', difficulty: 1, finite: true, wiki: 'animated-studios' },
  { id: 'best-picture', groupBy: 'decade', category: 'screen', text: 'Name Best Picture Oscar winners', difficulty: 3, finite: true, wikidata: 'best_picture' },
  { id: 'star-wars', category: 'screen', text: 'Name Star Wars characters', difficulty: 2, finite: false, list: FI.STAR_WARS },
  { id: 'simpsons', category: 'screen', text: 'Name characters from The Simpsons', difficulty: 2, finite: false, list: FI.SIMPSONS },
  { id: 'sitcoms', groupBy: 'decade', category: 'screen', text: 'Name TV sitcoms', difficulty: 1, finite: false, list: FI.SITCOMS },
  { id: 'superheroes', category: 'screen', text: 'Name superheroes', difficulty: 1, finite: false, list: FI.SUPERHEROES },
  { id: 'harry-potter', category: 'screen', text: 'Name Harry Potter characters', difficulty: 1, finite: false, list: B.HARRY_POTTER },
  { id: 'lotr', category: 'screen', text: 'Name characters from Tolkien', note: 'The Hobbit, The Lord of the Rings and The Silmarillion.', difficulty: 2, finite: false, list: B.LOTR },

  // Music
  { id: 'best-selling-artists', people: true, category: 'music', text: 'Name best-selling music artists', note: "Any of the {n} acts on Wikipedia's best-selling music artists list (75 million or more records claimed), 2026.", difficulty: 1, finite: true, wiki: 'best-selling-artists', outsideLine: "That's a real star, just outside the best-seller list" },
  { id: 'spotify-songs', groupBy: 'decade', category: 'music', text: 'Name the most-streamed songs on Spotify', note: 'Any of the {n} most-streamed songs of all time on Spotify, 2026.', difficulty: 2, finite: true, wiki: 'spotify-songs', outsideLine: "That's a real hit, just outside the Spotify top 100" },
  { id: 'best-selling-albums', groupBy: 'decade', category: 'music', text: 'Name the best-selling albums ever', note: "Any of the {n} albums on Wikipedia's list with 20 million or more certified copies, 2026.", difficulty: 3, finite: true, wiki: 'best-selling-albums' },
  { id: 'instruments', category: 'music', text: 'Name musical instruments', difficulty: 1, finite: false, list: M.INSTRUMENTS },
  { id: 'genres', category: 'music', text: 'Name music genres', difficulty: 1, finite: false, list: M.GENRES },
  { id: 'bands', groupBy: 'decade', category: 'music', text: 'Name bands', difficulty: 1, finite: false, list: M.BANDS },
  { id: 'one-name-musicians', people: true, groupBy: 'born', category: 'music', text: 'Name musicians known by one name', note: 'Single-word stage names, like Adele or Drake.', difficulty: 2, finite: false, list: M.ONE_NAME_SINGERS },
  { id: 'musicals', groupBy: 'decade', category: 'music', text: 'Name stage musicals', difficulty: 2, finite: false, list: M.MUSICALS },
  { id: 'dances', category: 'music', text: 'Name dances', difficulty: 1, finite: false, list: M.DANCES },
  { id: 'composers', people: true, groupBy: 'born', category: 'music', text: 'Name composers', note: 'Surnames are fine.', difficulty: 3, finite: false, list: M.COMPOSERS },
  { id: 'beatles-songs', groupBy: 'decade', category: 'music', text: 'Name songs by The Beatles', difficulty: 2, finite: true, list: M.BEATLES_SONGS },

  // Video games
  { id: 'best-selling-games', groupBy: 'decade', category: 'games', text: 'Name best-selling video games', note: "Any game on Wikipedia's best-selling lists: the all-time top 50, or the charts for PlayStation, Xbox, Nintendo consoles and PC, 2026.", difficulty: 1, finite: true, wiki: 'best-selling-games', outsideLine: "That's a real game, just not on the best-seller charts" },
  { id: 'classic-games', groupBy: 'decade', category: 'games', text: 'Name all-time great video games', note: "Any of the {n} games on Wikipedia's list of video games considered the best, 2026.", difficulty: 2, finite: true, wiki: 'classic-games' },

  // Sport
  { id: 'sports', category: 'sport', text: 'Name sports', difficulty: 1, finite: false, list: SPO.SPORTS },
  { id: 'olympic-sports', category: 'sport', text: 'Name Olympic sports', note: 'Past, present or confirmed for LA 2028.', difficulty: 2, finite: false, list: SPO.OLYMPIC_SPORTS },
  { id: 'us-teams', groupTitle: 'League', category: 'sport', text: 'Name NBA, NFL, MLB or NHL teams', note: 'The {n} current teams. The nickname is enough.', difficulty: 2, finite: true, parts: [{ from: 'NBA', list: SPO.NBA }, { from: 'NFL', list: SPO.NFL }, { from: 'MLB', list: SPO.MLB }, { from: 'NHL', list: SPO.NHL }] },
  { id: 'football-clubs', groupBy: 'from', groupTitle: 'League', category: 'sport', text: "Name clubs in Europe's big five leagues", note: 'The {n} clubs in the 2025-26 Premier League, La Liga, Serie A, Bundesliga and Ligue 1.', difficulty: 2, finite: true, wiki: 'football-clubs' },
  { id: 'world-cup-nations', category: 'sport', text: 'Name countries that have played at a World Cup', note: "Any of the {n} nations to reach a men's FIFA World Cup, 1930 to 2026. West Germany counts as Germany, the Soviet Union as Russia.", difficulty: 1, finite: true, wiki: 'world-cup-nations' },
  { id: 'grand-slam-champions', people: true, groupBy: 'from', groupTitle: 'Singles', category: 'sport', text: 'Name Grand Slam tennis champions', note: 'Anyone who has won a Grand Slam singles title, men or women, up to 2026. Surnames are fine.', difficulty: 2, finite: true, wiki: 'grand-slam-champions' },
  { id: 'f1-winners', people: true, groupBy: 'born', category: 'sport', text: 'Name Formula One race winners', note: 'Any of the {n} drivers who have won a Grand Prix, up to 2026. Surnames are fine.', difficulty: 3, finite: true, wiki: 'f1-winners' },
  { id: 'footballers', people: true, groupBy: 'born', category: 'sport', text: 'Name footballers', note: 'Soccer players, past or present. Surnames are fine.', difficulty: 1, finite: false, list: SPO.FOOTBALLERS },

  // Brands
  { id: 'car-brands', category: 'brands', text: 'Name car brands', note: 'Past or present.', difficulty: 1, finite: false, list: T.CAR_BRANDS },
  { id: 'tech-companies', category: 'brands', text: 'Name tech companies', difficulty: 1, finite: false, list: T.TECH_COMPANIES },
  { id: 'fast-food', category: 'brands', text: 'Name fast food chains', note: "Any chain on Wikipedia's list of fast food restaurant chains, 2026.", difficulty: 1, finite: true, wiki: 'fast-food' },

  // Science and nature
  { id: 'elements', category: 'science', text: 'Name chemical elements', difficulty: 1, finite: true, wikidata: 'elements' },
  { id: 'metals', category: 'science', text: 'Name elements that are metals', note: 'Metalloids like silicon and arsenic do not count.', difficulty: 2, finite: true, wikidata: 'metals' },
  { id: 'units', category: 'science', text: 'Name units of measurement', difficulty: 1, finite: false, list: S.UNITS },
  { id: 'scientists', people: true, groupBy: 'born', category: 'science', text: 'Name famous scientists', note: 'Surnames are fine.', difficulty: 2, finite: false, list: S.SCIENTISTS },
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
  { id: 'leaders', people: true, groupTitle: 'Office', category: 'history', text: 'Name US presidents or British prime ministers', note: 'Surnames are fine. Type Bush or Adams twice to get both.', difficulty: 1, finite: true, parts: [{ from: 'US presidents', wikidata: 'us_presidents' }, { from: 'British prime ministers', wikidata: 'uk_prime_ministers' }] },
  { id: 'wars', category: 'history', text: 'Name wars', difficulty: 2, finite: false, list: H.WARS },
  { id: 'explorers', people: true, groupBy: 'born', category: 'history', text: 'Name explorers', note: 'Surnames are fine.', difficulty: 2, finite: false, list: H.EXPLORERS },
  { id: 'civilisations', category: 'history', text: 'Name ancient civilisations', difficulty: 2, finite: false, list: H.CIVILISATIONS },
  { id: 'empires', category: 'history', text: 'Name empires', difficulty: 2, finite: false, list: H.EMPIRES },
  { id: 'painters', people: true, groupBy: 'born', category: 'history', text: 'Name painters', note: 'Surnames are fine.', difficulty: 2, finite: false, list: B.PAINTERS },
  { id: 'paintings', category: 'history', text: 'Name famous paintings', difficulty: 3, finite: false, list: B.PAINTINGS },
  { id: 'authors', people: true, groupBy: 'born', category: 'history', text: 'Name novelists and authors', note: 'Surnames are fine.', difficulty: 1, finite: false, list: B.AUTHORS },

  // Words and general knowledge
  { id: 'colours', category: 'words', text: 'Name colours', difficulty: 1, finite: false, list: L.COLOURS },
  { id: 'languages', category: 'words', text: 'Name languages', difficulty: 1, finite: false, list: L.LANGUAGES },
  { id: 'synonyms-happy', category: 'words', text: 'Name words that mean happy', difficulty: 2, finite: false, list: L.HAPPY },
  { id: 'synonyms-big', category: 'words', text: 'Name words that mean big', difficulty: 2, finite: false, list: L.BIG },
  { id: 'rhymes-cat', category: 'words', text: 'Name words that rhyme with cat', difficulty: 1, finite: false, list: L.RHYMES_CAT },
];
