// Groups for the answer board. Each prompt gets a grouping with a name, a group per answer and
// a display order. Where there is no good grouping, answers fall into alphabetical sections.

const CONTINENT = { AF: 'Africa', EU: 'Europe', AS: 'Asia', NA: 'North America', SA: 'South America', OC: 'Oceania' };
export const CONTINENT_ORDER = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'];

const US_REGION = {
  Northeast: 'Connecticut Maine Massachusetts New_Hampshire Rhode_Island Vermont New_Jersey New_York Pennsylvania',
  Midwest: 'Illinois Indiana Michigan Ohio Wisconsin Iowa Kansas Minnesota Missouri Nebraska North_Dakota South_Dakota',
  South: 'Delaware Florida Georgia Maryland North_Carolina South_Carolina Virginia West_Virginia Alabama Kentucky Mississippi Tennessee Arkansas Louisiana Oklahoma Texas',
  West: 'Arizona Colorado Idaho Montana Nevada New_Mexico Utah Wyoming Alaska California Hawaii Oregon Washington',
};
const regionOfState = (s) => Object.keys(US_REGION).find((r) => US_REGION[r].split(' ').includes(s.replace(/ /g, '_')));
// State capitals are listed in the same order as the states, A to Z.
const STATES_AZ = 'Alabama Alaska Arizona Arkansas California Colorado Connecticut Delaware Florida Georgia Hawaii Idaho Illinois Indiana Iowa Kansas Kentucky Louisiana Maine Maryland Massachusetts Michigan Minnesota Mississippi Missouri Montana Nebraska Nevada New_Hampshire New_Jersey New_Mexico New_York North_Carolina North_Dakota Ohio Oklahoma Oregon Pennsylvania Rhode_Island South_Carolina South_Dakota Tennessee Texas Utah Vermont Virginia Washington West_Virginia Wisconsin Wyoming'.split(' ');

const PRESIDENT_YEARS = [1789, 1797, 1801, 1809, 1817, 1825, 1829, 1837, 1841, 1841, 1845, 1849, 1850, 1853, 1857, 1861, 1865, 1869, 1877, 1881, 1881, 1885, 1889, 1897, 1901, 1909, 1913, 1921, 1923, 1929, 1933, 1945, 1953, 1961, 1963, 1969, 1974, 1977, 1981, 1989, 1993, 2001, 2009, 2017, 2021];

// Ranges over a list in its curated (chronological) order: [first label, group name].
const ORDERED = {
  'uk-prime-ministers': [['Robert Walpole', '1700s'], ['Henry Addington', '1800s'], ['Arthur Balfour', '1900s'], ['Gordon Brown', '2000s']],
  'roman-emperors': [['Augustus', 'Julio-Claudians'], ['Galba', 'Year of the Four Emperors and Flavians'], ['Nerva', 'Nerva to Commodus'], ['Pertinax', 'Severans and the crisis'], ['Diocletian', 'Tetrarchy and Constantine'], ['Valentinian I', 'The last emperors']],
  monarchs: [['Alfred the Great', 'Anglo-Saxon and Danish'], ['William I', 'Normans'], ['Henry II', 'Plantagenets'], ['Henry IV', 'Lancaster and York'], ['Henry VII', 'Tudors'], ['James I', 'Stuarts'], ['George I', 'Hanoverians'], ['Edward VII', 'Saxe-Coburg and Windsor']],
  pharaohs: [['Narmer', 'Early and Old Kingdom'], ['Mentuhotep II', 'Middle Kingdom'], ['Ahmose I', 'New Kingdom'], ['Smendes', 'Late Period'], ['Ptolemy I Soter', 'Ptolemaic'], ['Kamose', 'Second Intermediate Period']],
  'greek-letters': [['Alpha', 'Alpha to Theta'], ['Iota', 'Iota to Pi'], ['Rho', 'Rho to Omega']],
  'nato-alphabet': [['Alfa', 'A to I'], ['Juliett', 'J to R'], ['Sierra', 'S to Z']],
  'pokemon-gen1': [['Bulbasaur', 'No. 1 to 30'], ['Nidoqueen', 'No. 31 to 60'], ['Poliwhirl', 'No. 61 to 90'], ['Cloyster', 'No. 91 to 120'], ['Starmie', 'No. 121 to 151']],
  'chinese-dynasties': [['Xia', 'Ancient'], ['Qin', 'Early imperial'], ['Sui', 'Sui and Tang'], ['Later Liang', 'Five Dynasties'], ['Liao', 'Song, Liao and Jin'], ['Yuan', 'Yuan, Ming and Qing']],
};

const SHAKESPEARE = {
  Comedies: "All's Well That Ends Well|As You Like It|The Comedy of Errors|Love's Labour's Lost|Measure for Measure|The Merchant of Venice|The Merry Wives of Windsor|A Midsummer Night's Dream|Much Ado About Nothing|The Taming of the Shrew|Twelfth Night|The Two Gentlemen of Verona|Troilus and Cressida",
  Tragedies: 'Antony and Cleopatra|Coriolanus|Hamlet|Julius Caesar|King Lear|Macbeth|Othello|Romeo and Juliet|Timon of Athens|Titus Andronicus',
  Histories: 'Henry IV, Part 1|Henry IV, Part 2|Henry V|Henry VI, Part 1|Henry VI, Part 2|Henry VI, Part 3|Henry VIII|King John|Richard II|Richard III|Edward III',
  Romances: "Cymbeline|Pericles|The Tempest|The Winter's Tale|The Two Noble Kinsmen",
};
const BOND = {
  'Sean Connery': 'Dr. No|From Russia with Love|Goldfinger|Thunderball|You Only Live Twice|Diamonds Are Forever|Never Say Never Again',
  'George Lazenby': "On Her Majesty's Secret Service",
  'Roger Moore': 'Live and Let Die|The Man with the Golden Gun|The Spy Who Loved Me|Moonraker|For Your Eyes Only|Octopussy|A View to a Kill',
  'Timothy Dalton': 'The Living Daylights|Licence to Kill',
  'Pierce Brosnan': 'GoldenEye|Tomorrow Never Dies|The World Is Not Enough|Die Another Day',
  'Daniel Craig': 'Casino Royale|Quantum of Solace|Skyfall|Spectre|No Time to Die',
};
const PREMIER = {
  London: 'Arsenal|Brentford|Charlton Athletic|Chelsea|Crystal Palace|Fulham|Queens Park Rangers|Tottenham Hotspur|West Ham United|Wimbledon',
  'North West': 'Blackburn Rovers|Blackpool|Bolton Wanderers|Burnley|Everton|Liverpool|Manchester City|Manchester United|Oldham Athletic|Wigan Athletic',
  Midlands: 'Aston Villa|Birmingham City|Coventry City|Derby County|Leicester City|Nottingham Forest|Stoke City|West Bromwich Albion|Wolverhampton Wanderers',
  'North East and Yorkshire': 'Barnsley|Bradford City|Huddersfield Town|Hull City|Leeds United|Middlesbrough|Newcastle United|Sheffield United|Sheffield Wednesday|Sunderland',
  'South and East': 'AFC Bournemouth|Brighton & Hove Albion|Ipswich Town|Luton Town|Norwich City|Portsmouth|Reading|Southampton|Swindon Town|Watford',
  Wales: 'Cardiff City|Swansea City',
};
const NBA_EAST = 'Atlanta Hawks|Boston Celtics|Brooklyn Nets|Charlotte Hornets|Chicago Bulls|Cleveland Cavaliers|Detroit Pistons|Indiana Pacers|Miami Heat|Milwaukee Bucks|New York Knicks|Orlando Magic|Philadelphia 76ers|Toronto Raptors|Washington Wizards';
const NFL_AFC = 'Baltimore Ravens|Buffalo Bills|Cincinnati Bengals|Cleveland Browns|Denver Broncos|Houston Texans|Indianapolis Colts|Jacksonville Jaguars|Kansas City Chiefs|Las Vegas Raiders|Los Angeles Chargers|Miami Dolphins|New England Patriots|New York Jets|Pittsburgh Steelers|Tennessee Titans';
const MLB_AL = 'Baltimore Orioles|Boston Red Sox|Chicago White Sox|Cleveland Guardians|Detroit Tigers|Houston Astros|Kansas City Royals|Los Angeles Angels|Minnesota Twins|New York Yankees|Athletics|Seattle Mariners|Tampa Bay Rays|Texas Rangers|Toronto Blue Jays';
const NHL_EAST = 'Boston Bruins|Buffalo Sabres|Carolina Hurricanes|Columbus Blue Jackets|Detroit Red Wings|Florida Panthers|Montreal Canadiens|New Jersey Devils|New York Islanders|New York Rangers|Ottawa Senators|Philadelphia Flyers|Pittsburgh Penguins|Tampa Bay Lightning|Toronto Maple Leafs|Washington Capitals';
const F1_FIRST = { Farina: 1950, Fangio: 1951, Ascari: 1952, Hawthorn: 1958, Brabham: 1959, 'Phil Hill': 1961, 'Graham Hill': 1962, Clark: 1963, Surtees: 1964, Hulme: 1967, Stewart: 1969, Rindt: 1970, Fittipaldi: 1972, Lauda: 1975, Hunt: 1976, Andretti: 1978, Scheckter: 1979, 'Alan Jones': 1980, Piquet: 1981, 'Keke Rosberg': 1982, Prost: 1985, Senna: 1988, Mansell: 1992, Schumacher: 1994, 'Damon Hill': 1996, Villeneuve: 1997, Hakkinen: 1998, Alonso: 2005, Raikkonen: 2007, Hamilton: 2008, Button: 2009, Vettel: 2010, 'Nico Rosberg': 2016, Verstappen: 2021, Norris: 2025 };
const WINTER = 'Chamonix|St. Moritz|Lake Placid|Garmisch-Partenkirchen|Oslo|Cortina d\'Ampezzo|Squaw Valley|Innsbruck|Grenoble|Sapporo|Sarajevo|Calgary|Albertville|Lillehammer|Nagano|Salt Lake City|Turin|Vancouver|Sochi|Pyeongchang|Milan';
const BOTH = 'Beijing';

// Element categories by atomic number.
const ELEMENT_GROUPS = [
  ['Alkali metals', [3, 11, 19, 37, 55, 87]], ['Alkaline earth metals', [4, 12, 20, 38, 56, 88]],
  ['Noble gases', [2, 10, 18, 36, 54, 86, 118]], ['Halogens', [9, 17, 35, 53, 85, 117]],
  ['Other non-metals', [1, 6, 7, 8, 15, 16, 34]], ['Metalloids', [5, 14, 32, 33, 51, 52]],
  ['Lanthanides', range(57, 71)], ['Actinides', range(89, 103)],
  ['Post-transition metals', [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116]],
];
function range(a, b) { return Array.from({ length: b - a + 1 }, (_, i) => a + i); }
export function elementGroup(z) {
  for (const [name, list] of ELEMENT_GROUPS) if (list.includes(z)) return name;
  return 'Transition metals';
}

const inList = (map, label) => Object.keys(map).find((g) => map[g].split('|').includes(label));
const decade = (y) => (y === null || y === undefined || Number.isNaN(y) ? null : `${Math.floor(y / 10) * 10}s`);

export function alphaGroup(label) {
  const c = label.replace(/^(the|a|an)\s+/i, '').normalize('NFKD').replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase();
  if (!c || /\d/.test(c)) return '0 to 9';
  return ['A to C', 'D to F', 'G to I', 'J to L', 'M to O', 'P to R', 'S to U', 'V to Z'][Math.min(7, Math.floor(('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(c)) / 3))];
}
const ALPHA_ORDER = ['0 to 9', 'A to C', 'D to F', 'G to I', 'J to L', 'M to O', 'P to R', 'S to U', 'V to Z'];

// answers: [{ label, hint, from, continent, year, z }]. Returns { by, groups: [names in order], list: [group per answer] }.
export function groupAnswers(def, answers, countryOf) {
  const id = def.id;
  let by = null;
  let list = null;
  let order = null;
  const labels = answers.map((a) => a.label);
  if (def.countries) { by = 'Continent'; list = answers.map((a) => CONTINENT[countryOf(a.label)?.tags.find((t) => CONTINENT[t])]); order = CONTINENT_ORDER; }
  else if (def.capitals) { by = 'Continent'; list = answers.map((a) => CONTINENT[countryOf(a.hint)?.tags.find((t) => CONTINENT[t])]); order = CONTINENT_ORDER; }
  else if (id === 'us-states') { by = 'Region'; list = labels.map(regionOfState); order = Object.keys(US_REGION); }
  else if (id === 'us-state-capitals') { by = 'Region'; list = labels.map((_, i) => regionOfState(STATES_AZ[i].replace(/_/g, ' '))); order = Object.keys(US_REGION); }
  else if (id === 'us-presidents') { by = 'Century in office'; list = labels.map((_, i) => `${Math.floor(PRESIDENT_YEARS[i] / 100) * 100}s`); }
  else if (ORDERED[id]) {
    by = id === 'uk-prime-ministers' ? 'Century' : 'Era';
    const starts = ORDERED[id];
    let g = starts[0][1];
    list = labels.map((l) => { const hit = starts.find(([first]) => first === l); if (hit) g = hit[1]; return g; });
    order = starts.map((s) => s[1]);
  }
  else if (id === 'shakespeare') { by = 'Kind of play'; list = labels.map((l) => inList(SHAKESPEARE, l)); order = Object.keys(SHAKESPEARE); }
  else if (id === 'bond-films') { by = 'Bond actor'; list = labels.map((l) => inList(BOND, l)); order = Object.keys(BOND); }
  else if (id === 'premier-league') { by = 'Region'; list = labels.map((l) => inList(PREMIER, l)); order = Object.keys(PREMIER); }
  else if (id === 'nba-teams') { by = 'Conference'; list = labels.map((l) => (NBA_EAST.split('|').includes(l) ? 'Eastern' : 'Western')); order = ['Eastern', 'Western']; }
  else if (id === 'nfl-teams') { by = 'Conference'; list = labels.map((l) => (NFL_AFC.split('|').includes(l) ? 'AFC' : 'NFC')); order = ['AFC', 'NFC']; }
  else if (id === 'mlb-teams') { by = 'League'; list = labels.map((l) => (MLB_AL.split('|').includes(l) ? 'American League' : 'National League')); order = ['American League', 'National League']; }
  else if (id === 'nhl-teams') { by = 'Conference'; list = labels.map((l) => (NHL_EAST.split('|').includes(l) ? 'Eastern' : 'Western')); order = ['Eastern', 'Western']; }
  else if (id === 'f1-champions') { by = 'First title'; list = labels.map((l) => decade(Object.entries(F1_FIRST).find(([k]) => l.includes(k))?.[1])); }
  else if (id === 'olympic-hosts') { by = 'Games'; list = labels.map((l) => (BOTH.split('|').includes(l) ? 'Summer and winter' : WINTER.split('|').includes(l) ? 'Winter' : 'Summer')); order = ['Summer', 'Winter', 'Summer and winter']; }
  else if (['elements', 'metals'].includes(id)) { by = 'Element family'; list = answers.map((a) => (a.z ? elementGroup(a.z) : null)); }
  else if (id === 'element-symbols') { by = 'Element family'; list = answers.map((a) => (a.z ? elementGroup(a.z) : null)); }
  else if (def.union) { by = 'Kind of animal'; list = answers.map((a) => a.from); }
  else if (def.groupBy === 'continent') { by = 'Continent'; list = answers.map((a) => a.continent || null); order = CONTINENT_ORDER; }
  else if (def.groupBy === 'decade') { by = 'Decade'; list = answers.map((a) => decade(a.year)); }
  else if (def.groupBy === 'born') { by = 'Born'; list = answers.map((a) => (a.born === null || a.born === undefined ? null : a.born < 1500 ? 'Before 1500' : `Born in the ${Math.floor(a.born / 100) * 100}s`)); }

  // Enough coverage, or fall back to A to Z sections.
  const known = list ? list.filter(Boolean).length : 0;
  if (!list || known < answers.length * 0.7) {
    return { by: 'A to Z', fallback: true, groups: ALPHA_ORDER.filter((g) => labels.some((l) => alphaGroup(l) === g)), list: labels.map(alphaGroup) };
  }
  const filled = list.map((g) => g || 'Other');
  const present = [...new Set(filled)];
  const groups = order ? [...order.filter((g) => present.includes(g)), ...present.filter((g) => !order.includes(g)).sort()]
    : present.sort((a, b) => (a === 'Other') - (b === 'Other') || a.localeCompare(b, 'en', { numeric: true }));
  return { by, fallback: false, groups, list: filled };
}
