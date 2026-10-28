// Every prompt in the game. Lists live in build/curated; Wikidata results in data/raw.
import * as A from './curated/animals.mjs';
import * as N from './curated/nature.mjs';
import * as G from './curated/geography.mjs';
import * as S from './curated/science.mjs';
import * as SP from './curated/space.mjs';
import * as F from './curated/food.mjs';
import * as M from './curated/music.mjs';
import * as FI from './curated/film.mjs';
import * as B from './curated/books.mjs';
import * as H from './curated/history.mjs';
import * as L from './curated/language.mjs';
import * as BO from './curated/body.mjs';
import * as T from './curated/tech.mjs';
import * as MY from './curated/myth.mjs';
import * as SPO from './curated/sport.mjs';

export const CATEGORIES = {
  geography: 'Geography',
  animals: 'Animals',
  nature: 'Plants and nature',
  science: 'Science',
  space: 'Space',
  food: 'Food and drink',
  music: 'Music',
  film: 'Film and TV',
  books: 'Books and art',
  history: 'History',
  language: 'Language and words',
  body: 'The human body',
  tech: 'Technology',
  myth: 'Myths and legends',
  sport: 'Sport',
};

const SOVEREIGN = 'UN members plus Vatican City and Palestine.';

// list: curated text. countries: filter on the country table. wikidata: a cached query.
export const PROMPTS = [
  // Geography
  { id: 'countries-africa', category: 'geography', text: 'Name countries in Africa', note: SOVEREIGN, difficulty: 1, finite: true, countries: (c) => c.tags.includes('AF') },
  { id: 'countries-europe', category: 'geography', text: 'Name countries in Europe', note: 'Countries that span Europe and Asia count, like Turkey and Georgia.', difficulty: 1, finite: true, countries: (c) => c.tags.includes('EU') },
  { id: 'countries-asia', category: 'geography', text: 'Name countries in Asia', note: 'Countries that span Europe and Asia count, like Russia and Turkey.', difficulty: 1, finite: true, countries: (c) => c.tags.includes('AS') },
  { id: 'countries-americas', category: 'geography', text: 'Name countries in the Americas', note: 'North, Central and South America and the Caribbean.', difficulty: 1, finite: true, countries: (c) => c.tags.includes('NA') || c.tags.includes('SA') },
  { id: 'countries-world', category: 'geography', text: 'Name countries', note: SOVEREIGN, difficulty: 1, finite: true, countries: () => true },
  { id: 'countries-landlocked', category: 'geography', text: 'Name landlocked countries', note: 'No coast on the open sea. Caspian coasts still count as landlocked.', difficulty: 3, finite: true, countries: (c) => c.tags.includes('LL') },
  { id: 'countries-mediterranean', category: 'geography', text: 'Name countries with a Mediterranean coast', difficulty: 2, finite: true, countries: (c) => c.tags.includes('MED') },
  { id: 'countries-eu', category: 'geography', text: 'Name members of the European Union', difficulty: 2, finite: true, countries: (c) => c.tags.includes('EUU') },
  { id: 'capitals-world', category: 'geography', text: 'Name capital cities', note: 'National capitals of sovereign countries.', difficulty: 2, finite: true, capitals: () => true },
  { id: 'capitals-europe', category: 'geography', text: 'Name capital cities in Europe', difficulty: 2, finite: true, capitals: (c) => c.tags.includes('EU') },
  { id: 'capitals-asia', category: 'geography', text: 'Name capital cities in Asia', difficulty: 3, finite: true, capitals: (c) => c.tags.includes('AS') },
  { id: 'capitals-africa', category: 'geography', text: 'Name capital cities in Africa', difficulty: 3, finite: true, capitals: (c) => c.tags.includes('AF') },
  { id: 'us-states', category: 'geography', text: 'Name US states', difficulty: 1, finite: true, wikidata: 'us_states' },
  { id: 'us-state-capitals', category: 'geography', text: 'Name US state capitals', difficulty: 3, finite: true, list: G.STATE_CAPITALS },
  { id: 'australian-cities', category: 'geography', text: 'Name cities and towns in Australia', difficulty: 2, finite: false, list: G.AUS_CITIES },
  { id: 'rivers', category: 'geography', text: 'Name rivers', note: 'Just the name is fine, no need for "River".', difficulty: 2, finite: false, list: G.RIVERS },
  { id: 'seas-oceans', category: 'geography', text: 'Name oceans, seas and gulfs', difficulty: 2, finite: false, list: G.SEAS },
  { id: 'islands', category: 'geography', text: 'Name islands', difficulty: 1, finite: false, list: G.ISLANDS },

  // Animals
  { id: 'animals', category: 'animals', text: 'Name animals', difficulty: 1, finite: false, union: [A.MAMMALS, A.BIRDS, A.REPTILES, A.FISH, A.INSECTS, A.SEA_CREATURES] },
  { id: 'mammals', category: 'animals', text: 'Name mammals', difficulty: 1, finite: false, list: A.MAMMALS },
  { id: 'ocean-mammals', category: 'animals', text: 'Name mammals that live in the ocean', note: 'Whales, dolphins, seals and friends. Species count separately.', difficulty: 2, finite: false, list: A.OCEAN_MAMMALS },
  { id: 'birds', category: 'animals', text: 'Name birds', difficulty: 1, finite: false, list: A.BIRDS },
  { id: 'dog-breeds', category: 'animals', text: 'Name dog breeds', note: 'Popular crossbreeds like the labradoodle count.', difficulty: 2, finite: false, list: A.DOG_BREEDS },
  { id: 'cat-breeds', category: 'animals', text: 'Name cat breeds', difficulty: 3, finite: false, list: A.CAT_BREEDS },
  { id: 'insects', category: 'animals', text: 'Name insects', note: 'Six legs only, so no spiders.', difficulty: 2, finite: false, list: A.INSECTS },
  { id: 'reptiles', category: 'animals', text: 'Name reptiles', difficulty: 2, finite: false, list: A.REPTILES },
  { id: 'fish', category: 'animals', text: 'Name fish', difficulty: 1, finite: false, list: A.FISH },
  { id: 'sea-creatures', category: 'animals', text: 'Name sea creatures', note: 'Anything that lives in the sea, except seabirds.', difficulty: 1, finite: false, list: A.SEA_CREATURES },
  { id: 'dinosaurs', category: 'animals', text: 'Name dinosaurs and other prehistoric reptiles', difficulty: 2, finite: false, list: A.DINOSAURS },
  { id: 'horse-breeds', category: 'animals', text: 'Name horse and pony breeds', difficulty: 3, finite: false, list: A.HORSE_BREEDS },

  // Plants and nature
  { id: 'trees', category: 'nature', text: 'Name trees', difficulty: 1, finite: false, list: N.TREES },
  { id: 'flowers', category: 'nature', text: 'Name flowers', difficulty: 1, finite: false, list: N.FLOWERS },
  { id: 'houseplants', category: 'nature', text: 'Name houseplants', difficulty: 2, finite: false, list: N.HOUSEPLANTS },
  { id: 'gemstones', category: 'nature', text: 'Name gemstones and minerals', difficulty: 2, finite: false, list: N.GEMSTONES },
  { id: 'rocks', category: 'nature', text: 'Name types of rock', difficulty: 3, finite: false, list: N.ROCKS },
  { id: 'weather', category: 'nature', text: 'Name kinds of weather', difficulty: 1, finite: false, list: N.WEATHER },
  { id: 'disasters', category: 'nature', text: 'Name natural disasters', difficulty: 2, finite: false, list: N.DISASTERS },
  { id: 'volcanoes', category: 'nature', text: 'Name volcanoes', difficulty: 3, finite: false, list: N.VOLCANOES },
  { id: 'deserts', category: 'nature', text: 'Name deserts', difficulty: 3, finite: false, list: N.DESERTS },
  { id: 'mountains', category: 'nature', text: 'Name mountains', difficulty: 2, finite: false, list: N.MOUNTAINS },

  // Science
  { id: 'elements', category: 'science', text: 'Name chemical elements', difficulty: 1, finite: true, wikidata: 'elements' },
  { id: 'metals', category: 'science', text: 'Name elements that are metals', note: 'Metalloids like silicon and arsenic do not count.', difficulty: 2, finite: true, wikidata: 'metals' },
  { id: 'element-symbols', category: 'science', text: 'Name chemical symbols', note: 'Type the symbol, like Fe or Au.', difficulty: 3, finite: true, wikidata: 'element_symbols' },
  { id: 'units', category: 'science', text: 'Name units of measurement', difficulty: 1, finite: false, list: S.UNITS },
  { id: 'scientists', category: 'science', text: 'Name famous scientists', note: 'Surnames are fine.', difficulty: 2, finite: false, list: S.SCIENTISTS },
  { id: 'particles', category: 'science', text: 'Name subatomic particles', note: 'Quasiparticles and hypothetical particles count.', difficulty: 3, finite: false, list: S.PARTICLES },
  { id: 'shapes', category: 'science', text: 'Name shapes', note: 'Flat or solid.', difficulty: 1, finite: false, list: S.SHAPES },
  { id: 'lab-equipment', category: 'science', text: 'Name things in a science lab', difficulty: 2, finite: false, list: S.LAB_EQUIPMENT },
  { id: 'quantities', category: 'science', text: 'Name things physicists measure', note: 'Quantities like mass or velocity, not units.', difficulty: 3, finite: false, list: S.QUANTITIES },
  { id: 'compounds', category: 'science', text: 'Name chemical compounds', note: 'Common names are fine, like salt or rust.', difficulty: 2, finite: false, list: S.COMPOUNDS },

  // Space
  { id: 'moons', category: 'space', text: 'Name moons in our solar system', difficulty: 3, finite: false, list: SP.MOONS },
  { id: 'constellations', category: 'space', text: 'Name constellations', note: 'The 88 modern constellations.', difficulty: 2, finite: true, wikidata: 'constellations' },
  { id: 'astronauts', category: 'space', text: 'Name astronauts and cosmonauts', note: 'Surnames are fine.', difficulty: 2, finite: false, list: SP.ASTRONAUTS },
  { id: 'missions', category: 'space', text: 'Name spacecraft and space missions', difficulty: 2, finite: false, list: SP.MISSIONS },
  { id: 'stars', category: 'space', text: 'Name stars', difficulty: 3, finite: false, list: SP.STARS },
  { id: 'galaxies', category: 'space', text: 'Name galaxies', difficulty: 3, finite: false, list: SP.GALAXIES },
  { id: 'space-agencies', category: 'space', text: 'Name space agencies and spaceflight companies', difficulty: 3, finite: false, list: SP.SPACE_AGENCIES },
  { id: 'rockets', category: 'space', text: 'Name rockets', difficulty: 3, finite: false, list: SP.ROCKETS },
  { id: 'solar-system', category: 'space', text: 'Name things in our solar system', note: 'Planets, moons, comets, asteroids and named features.', difficulty: 1, finite: false, list: SP.SOLAR_SYSTEM },
  { id: 'space-words', category: 'space', text: 'Name space words', note: 'Objects, events and ideas, like nebula or eclipse.', difficulty: 1, finite: false, list: SP.SPACE_WORDS },

  // Food and drink
  { id: 'fruits', category: 'food', text: 'Name fruits', difficulty: 1, finite: false, list: F.FRUITS },
  { id: 'vegetables', category: 'food', text: 'Name vegetables', difficulty: 1, finite: false, list: F.VEGETABLES },
  { id: 'herbs-spices', category: 'food', text: 'Name herbs and spices', difficulty: 1, finite: false, list: F.HERBS_SPICES },
  { id: 'cheeses', category: 'food', text: 'Name cheeses', difficulty: 2, finite: false, list: F.CHEESES },
  { id: 'pasta', category: 'food', text: 'Name pasta shapes', difficulty: 2, finite: false, list: F.PASTA },
  { id: 'cocktails', category: 'food', text: 'Name cocktails', difficulty: 2, finite: false, list: F.COCKTAILS },
  { id: 'breads', category: 'food', text: 'Name breads', difficulty: 2, finite: false, list: F.BREADS },
  { id: 'desserts', category: 'food', text: 'Name desserts and puddings', difficulty: 1, finite: false, list: F.DESSERTS },
  { id: 'nuts', category: 'food', text: 'Name nuts and edible seeds', note: 'Culinary nuts count, like peanuts.', difficulty: 2, finite: false, list: F.NUTS },
  { id: 'coffee', category: 'food', text: 'Name coffee drinks', difficulty: 2, finite: false, list: F.COFFEE },
  { id: 'indian-dishes', category: 'food', text: 'Name Indian dishes', difficulty: 2, finite: false, list: F.INDIAN_DISHES },
  { id: 'teas', category: 'food', text: 'Name teas and infusions', difficulty: 2, finite: false, list: F.TEAS },
  { id: 'sauces', category: 'food', text: 'Name sauces, dips and condiments', difficulty: 1, finite: false, list: F.SAUCES },

  // Music
  { id: 'instruments', category: 'music', text: 'Name musical instruments', difficulty: 1, finite: false, list: M.INSTRUMENTS },
  { id: 'genres', category: 'music', text: 'Name music genres', difficulty: 1, finite: false, list: M.GENRES },
  { id: 'composers', category: 'music', text: 'Name composers', note: 'Surnames are fine.', difficulty: 2, finite: false, list: M.COMPOSERS },
  { id: 'bands', category: 'music', text: 'Name bands', difficulty: 1, finite: false, list: M.BANDS },
  { id: 'musical-terms', category: 'music', text: 'Name musical terms', difficulty: 2, finite: false, list: M.MUSICAL_TERMS },
  { id: 'beatles-songs', category: 'music', text: 'Name songs by The Beatles', difficulty: 2, finite: true, list: M.BEATLES_SONGS },
  { id: 'percussion', category: 'music', text: 'Name percussion instruments', difficulty: 2, finite: false, list: M.PERCUSSION },
  { id: 'string-instruments', category: 'music', text: 'Name string instruments', difficulty: 2, finite: false, list: M.STRINGS },
  { id: 'one-name-musicians', category: 'music', text: 'Name musicians known by one name', note: 'Single-word stage names, like Adele or Drake.', difficulty: 2, finite: false, list: M.ONE_NAME_SINGERS },
  { id: 'musicals', category: 'music', text: 'Name stage musicals', difficulty: 2, finite: false, list: M.MUSICALS },
  { id: 'dances', category: 'music', text: 'Name dances', difficulty: 1, finite: false, list: M.DANCES },

  // Film and TV
  { id: 'pixar', category: 'film', text: 'Name Pixar films', note: 'Feature films only.', difficulty: 1, finite: true, list: FI.PIXAR },
  { id: 'disney-animated', category: 'film', text: 'Name Disney animated films', note: 'Walt Disney Animation Studios features, not Pixar.', difficulty: 2, finite: true, list: FI.DISNEY },
  { id: 'best-picture', category: 'film', text: 'Name Best Picture Oscar winners', difficulty: 3, finite: true, wikidata: 'best_picture' },
  { id: 'mcu-films', category: 'film', text: 'Name Marvel Cinematic Universe films', difficulty: 2, finite: true, list: FI.MCU },
  { id: 'ghibli', category: 'film', text: 'Name Studio Ghibli films', difficulty: 3, finite: true, list: FI.GHIBLI },
  { id: 'bond-films', category: 'film', text: 'Name James Bond films', difficulty: 2, finite: true, list: FI.BOND },
  { id: 'pokemon-gen1', category: 'film', text: 'Name the original 151 Pokémon', difficulty: 2, finite: true, list: FI.POKEMON },
  { id: 'star-wars', category: 'film', text: 'Name Star Wars characters', difficulty: 2, finite: false, list: FI.STAR_WARS },
  { id: 'simpsons', category: 'film', text: 'Name characters from The Simpsons', difficulty: 2, finite: false, list: FI.SIMPSONS },
  { id: 'sitcoms', category: 'film', text: 'Name TV sitcoms', difficulty: 1, finite: false, list: FI.SITCOMS },
  { id: 'superheroes', category: 'film', text: 'Name superheroes', difficulty: 1, finite: false, list: FI.SUPERHEROES },

  // Books and art
  { id: 'shakespeare', category: 'books', text: 'Name plays by Shakespeare', difficulty: 2, finite: true, list: B.SHAKESPEARE },
  { id: 'roald-dahl', category: 'books', text: 'Name books by Roald Dahl', difficulty: 2, finite: true, list: B.DAHL },
  { id: 'harry-potter', category: 'books', text: 'Name Harry Potter characters', difficulty: 1, finite: false, list: B.HARRY_POTTER },
  { id: 'art-movements', category: 'books', text: 'Name art movements', difficulty: 3, finite: false, list: B.ART_MOVEMENTS },
  { id: 'painters', category: 'books', text: 'Name painters', note: 'Surnames are fine.', difficulty: 2, finite: false, list: B.PAINTERS },
  { id: 'paintings', category: 'books', text: 'Name famous paintings', difficulty: 3, finite: false, list: B.PAINTINGS },
  { id: 'authors', category: 'books', text: 'Name novelists and authors', note: 'Surnames are fine.', difficulty: 1, finite: false, list: B.AUTHORS },
  { id: 'lotr', category: 'books', text: 'Name characters from Tolkien', note: 'The Hobbit, The Lord of the Rings and The Silmarillion.', difficulty: 2, finite: false, list: B.LOTR },
  { id: 'poets', category: 'books', text: 'Name poets', note: 'Surnames are fine.', difficulty: 2, finite: false, list: B.POETS },
  { id: 'literary-genres', category: 'books', text: 'Name genres of writing', difficulty: 2, finite: false, list: B.GENRES_LIT },
  { id: 'dickens', category: 'books', text: 'Name characters from Dickens', difficulty: 3, finite: false, list: B.DICKENS },

  // History
  { id: 'us-presidents', category: 'history', text: 'Name US presidents', note: 'Surnames are fine. Type Bush or Adams twice to get both.', difficulty: 1, finite: true, wikidata: 'us_presidents' },
  { id: 'uk-prime-ministers', category: 'history', text: 'Name British prime ministers', note: 'Surnames or titles are fine.', difficulty: 2, finite: true, wikidata: 'uk_prime_ministers' },
  { id: 'roman-emperors', category: 'history', text: 'Name Roman emperors', note: 'Up to the fall of the Western Empire in 476.', difficulty: 3, finite: true, list: H.ROMAN_EMPERORS },
  { id: 'pharaohs', category: 'history', text: 'Name pharaohs of Egypt', difficulty: 3, finite: false, list: H.PHARAOHS },
  { id: 'monarchs', category: 'history', text: 'Name English and British monarchs', note: 'Numbers matter: Henry VIII or Henry 8.', difficulty: 2, finite: true, list: H.MONARCHS },
  { id: 'wars', category: 'history', text: 'Name wars', difficulty: 2, finite: false, list: H.WARS },
  { id: 'explorers', category: 'history', text: 'Name explorers', note: 'Surnames are fine.', difficulty: 2, finite: false, list: H.EXPLORERS },
  { id: 'chinese-dynasties', category: 'history', text: 'Name Chinese dynasties', difficulty: 3, finite: true, list: H.DYNASTIES },
  { id: 'civilisations', category: 'history', text: 'Name ancient civilisations', difficulty: 2, finite: false, list: H.CIVILISATIONS },
  { id: 'empires', category: 'history', text: 'Name empires', difficulty: 2, finite: false, list: H.EMPIRES },
  { id: 'ships', category: 'history', text: 'Name famous ships', note: 'Real or fictional.', difficulty: 3, finite: false, list: H.SHIPS },

  // Language and words
  { id: 'greek-letters', category: 'language', text: 'Name letters of the Greek alphabet', difficulty: 2, finite: true, list: L.GREEK_LETTERS },
  { id: 'nato-alphabet', category: 'language', text: 'Name words in the NATO phonetic alphabet', difficulty: 1, finite: true, list: L.NATO },
  { id: 'colours', category: 'language', text: 'Name colours', difficulty: 1, finite: false, list: L.COLOURS },
  { id: 'languages', category: 'language', text: 'Name languages', difficulty: 1, finite: false, list: L.LANGUAGES },
  { id: 'palindromes', category: 'language', text: 'Name palindromes', note: 'Single words that read the same backwards.', difficulty: 3, finite: false, list: L.PALINDROMES },
  { id: 'punctuation', category: 'language', text: 'Name punctuation marks and symbols', difficulty: 3, finite: false, list: L.PUNCTUATION },
  { id: 'synonyms-happy', category: 'language', text: 'Name words that mean happy', difficulty: 2, finite: false, list: L.HAPPY },
  { id: 'synonyms-big', category: 'language', text: 'Name words that mean big', difficulty: 2, finite: false, list: L.BIG },
  { id: 'baby-animals', category: 'language', text: 'Name words for baby animals', note: 'Like kitten or joey.', difficulty: 2, finite: false, list: L.BABY_ANIMALS },
  { id: 'shades-of-blue', category: 'language', text: 'Name shades of blue', difficulty: 2, finite: false, list: L.BLUES },
  { id: 'rhymes-cat', category: 'language', text: 'Name words that rhyme with cat', difficulty: 1, finite: false, list: L.RHYMES_CAT },
  { id: 'ology-words', category: 'language', text: 'Name words ending in "ology"', difficulty: 2, finite: false, list: S.OLOGIES },

  // The human body
  { id: 'bones', category: 'body', text: 'Name bones in the human body', difficulty: 2, finite: false, list: BO.BONES },
  { id: 'muscles', category: 'body', text: 'Name muscles', difficulty: 3, finite: false, list: BO.MUSCLES },
  { id: 'organs', category: 'body', text: 'Name organs of the body', difficulty: 2, finite: false, list: BO.ORGANS },
  { id: 'body-parts', category: 'body', text: 'Name parts of the body', difficulty: 1, finite: false, list: BO.BODY_PARTS },
  { id: 'diseases', category: 'body', text: 'Name illnesses and diseases', difficulty: 1, finite: false, list: BO.DISEASES },
  { id: 'hormones', category: 'body', text: 'Name hormones', difficulty: 3, finite: false, list: BO.HORMONES },
  { id: 'eye-parts', category: 'body', text: 'Name parts of the eye', difficulty: 3, finite: false, list: BO.EYE_PARTS },
  { id: 'brain-parts', category: 'body', text: 'Name parts of the brain', difficulty: 3, finite: false, list: BO.BRAIN_PARTS },
  { id: 'vitamins', category: 'body', text: 'Name vitamins and dietary minerals', difficulty: 2, finite: true, list: BO.VITAMINS },
  { id: 'specialties', category: 'body', text: 'Name medical specialties', difficulty: 3, finite: false, list: BO.SPECIALTIES },
  { id: 'face', category: 'body', text: 'Name parts of the face', difficulty: 1, finite: false, list: BO.FACE },

  // Technology
  { id: 'programming-languages', category: 'tech', text: 'Name programming languages', difficulty: 2, finite: false, list: T.PROGRAMMING },
  { id: 'car-brands', category: 'tech', text: 'Name car brands', note: 'Past or present.', difficulty: 1, finite: false, list: T.CAR_BRANDS },
  { id: 'computer-parts', category: 'tech', text: 'Name computer parts and peripherals', difficulty: 2, finite: false, list: T.COMPUTER_PARTS },
  { id: 'file-extensions', category: 'tech', text: 'Name file extensions', note: 'With or without the dot.', difficulty: 2, finite: false, list: T.FILE_EXTENSIONS },
  { id: 'tech-companies', category: 'tech', text: 'Name tech companies', difficulty: 1, finite: false, list: T.TECH_COMPANIES },
  { id: 'consoles', category: 'tech', text: 'Name games consoles', note: 'Home and handheld, past or present.', difficulty: 2, finite: false, list: T.CONSOLES },
  { id: 'inventions', category: 'tech', text: 'Name inventions', difficulty: 1, finite: false, list: T.INVENTIONS },
  { id: 'browsers', category: 'tech', text: 'Name web browsers', difficulty: 3, finite: false, list: T.BROWSERS },
  { id: 'operating-systems', category: 'tech', text: 'Name operating systems', note: 'Versions like Windows 95 count separately.', difficulty: 3, finite: false, list: T.OPERATING_SYSTEMS },
  { id: 'video-games', category: 'tech', text: 'Name video games', difficulty: 1, finite: false, list: T.VIDEO_GAMES },
  { id: 'keyboard-keys', category: 'tech', text: 'Name keys on a computer keyboard', difficulty: 2, finite: false, list: T.KEYBOARD_KEYS },

  // Myths and legends
  { id: 'greek-gods', category: 'myth', text: 'Name Greek gods and goddesses', note: 'Titans, Muses and other immortals count.', difficulty: 2, finite: false, list: MY.GREEK_GODS },
  { id: 'roman-gods', category: 'myth', text: 'Name Roman gods and goddesses', difficulty: 2, finite: false, list: MY.ROMAN_GODS },
  { id: 'norse', category: 'myth', text: 'Name figures and places from Norse myth', difficulty: 3, finite: false, list: MY.NORSE },
  { id: 'egyptian-gods', category: 'myth', text: 'Name Egyptian gods and goddesses', difficulty: 3, finite: false, list: MY.EGYPTIAN },
  { id: 'mythical-creatures', category: 'myth', text: 'Name mythical creatures', difficulty: 1, finite: false, list: MY.CREATURES },
  { id: 'arthurian', category: 'myth', text: 'Name people, places and things from Arthurian legend', difficulty: 3, finite: false, list: MY.ARTHURIAN },
  { id: 'fairy-tales', category: 'myth', text: 'Name fairy tales and fables', difficulty: 1, finite: false, list: MY.FAIRY_TALES },
  { id: 'hindu-gods', category: 'myth', text: 'Name Hindu gods and goddesses', difficulty: 3, finite: false, list: MY.HINDU },
  { id: 'greek-heroes', category: 'myth', text: 'Name heroes and mortals from Greek and Roman myth', difficulty: 2, finite: false, list: MY.GREEK_HEROES },
  { id: 'trojan-war', category: 'myth', text: 'Name characters from the Trojan War', note: 'Gods who took part count too.', difficulty: 3, finite: false, list: MY.TROJAN },

  // Sport
  { id: 'sports', category: 'sport', text: 'Name sports', difficulty: 1, finite: false, list: SPO.SPORTS },
  { id: 'olympic-sports', category: 'sport', text: 'Name Olympic sports', note: 'Past, present or confirmed for LA 2028.', difficulty: 2, finite: false, list: SPO.OLYMPIC_SPORTS },
  { id: 'premier-league', category: 'sport', text: 'Name clubs that have played in the Premier League', difficulty: 2, finite: true, list: SPO.PREMIER_LEAGUE },
  { id: 'nba-teams', category: 'sport', text: 'Name NBA teams', note: 'The nickname is enough.', difficulty: 2, finite: true, list: SPO.NBA },
  { id: 'nfl-teams', category: 'sport', text: 'Name NFL teams', note: 'The nickname is enough.', difficulty: 2, finite: true, list: SPO.NFL },
  { id: 'mlb-teams', category: 'sport', text: 'Name Major League Baseball teams', note: 'The nickname is enough.', difficulty: 2, finite: true, list: SPO.MLB },
  { id: 'nhl-teams', category: 'sport', text: 'Name NHL teams', note: 'The nickname is enough.', difficulty: 3, finite: true, list: SPO.NHL },
  { id: 'f1-champions', category: 'sport', text: 'Name Formula One world champions', note: 'Drivers. Surnames are fine.', difficulty: 3, finite: true, list: SPO.F1_CHAMPIONS },
  { id: 'martial-arts', category: 'sport', text: 'Name martial arts and combat sports', difficulty: 2, finite: false, list: SPO.MARTIAL_ARTS },
  { id: 'olympic-hosts', category: 'sport', text: 'Name cities that have hosted the Olympics', note: 'Summer or winter Games already held.', difficulty: 3, finite: true, list: SPO.OLYMPIC_HOSTS },
  { id: 'footballers', category: 'sport', text: 'Name footballers', note: 'Soccer players, past or present. Surnames are fine.', difficulty: 1, finite: false, list: SPO.FOOTBALLERS },
];
