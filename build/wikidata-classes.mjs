// The Wikidata classes an answer's item must belong to (instance or subclass), per prompt.
// Prompts that are not listed get no Wikidata data, because a wrong description or alias
// is worse than none. Classes were chosen from the most common classes among each
// prompt's label matches, then checked by hand.
const CITY = ['Q5119', 'Q1549591', 'Q515', 'Q486972', 'Q1637706', 'Q200250', 'Q15284'];
const TAXON = ['Q16521', 'Q55983715'];
const HUMAN = ['Q5'];
const ANATOMY = ['Q112826905', 'Q112826975', 'Q103812529', 'Q1620186', 'Q25513701'];

export const WD_CLASSES = {
  'countries-africa': ['Q6256', 'Q3624078'], 'countries-europe': ['Q6256', 'Q3624078'], 'countries-asia': ['Q6256', 'Q3624078'],
  'countries-americas': ['Q6256', 'Q3624078'], 'countries-world': ['Q6256', 'Q3624078'], 'countries-landlocked': ['Q6256', 'Q3624078'],
  'countries-mediterranean': ['Q6256', 'Q3624078'], 'countries-eu': ['Q6256', 'Q3624078'],
  'capitals-world': CITY, 'capitals-europe': CITY, 'capitals-asia': CITY, 'capitals-africa': CITY, 'olympic-hosts': CITY,
  'us-states': ['Q35657'], 'us-state-capitals': ['Q1093829', 'Q62049', 'Q515', 'Q1549591'], 'australian-cities': ['Q515', 'Q3957', 'Q1549591'],
  rivers: ['Q4022'], 'seas-oceans': ['Q165', 'Q204894', 'Q39594', 'Q9430', 'Q1322134', 'Q23397'], islands: ['Q23442', 'Q33837'],
  animals: TAXON, mammals: TAXON, 'ocean-mammals': TAXON, birds: TAXON, insects: TAXON, reptiles: TAXON, fish: TAXON, 'sea-creatures': TAXON,
  dinosaurs: ['Q23038290', 'Q16521'], 'dog-breeds': ['Q39367'], 'cat-breeds': ['Q43577'], 'horse-breeds': ['Q1160573'],
  trees: TAXON, flowers: TAXON, houseplants: TAXON, gemstones: ['Q12089225', 'Q429795'],
  volcanoes: ['Q8072', 'Q169358', 'Q8502'], deserts: ['Q8514'], mountains: ['Q8502', 'Q54050', 'Q207326'],
  elements: ['Q11344'], metals: ['Q11344'], vitamins: ['Q11344'], constellations: ['Q8928'],
  scientists: HUMAN, astronauts: HUMAN, composers: HUMAN, painters: HUMAN, authors: HUMAN, poets: HUMAN, explorers: HUMAN,
  footballers: HUMAN, 'us-presidents': HUMAN, 'uk-prime-ministers': HUMAN, 'roman-emperors': HUMAN, pharaohs: HUMAN, monarchs: HUMAN,
  'f1-champions': HUMAN, 'one-name-musicians': HUMAN,
  particles: ['Q22675015', 'Q43116'], 'lab-equipment': ['Q834028'], compounds: ['Q113145171', 'Q18707678'], quantities: ['Q107715'],
  units: ['Q82047057'], stars: ['Q523', 'Q67206785', 'Q71798788'], galaxies: ['Q318', 'Q2488', 'Q67206691', 'Q190438', 'Q644507', 'Q213930'],
  'space-agencies': ['Q17505024', 'Q4830453', 'Q891723', 'Q6881511'], rockets: ['Q15078724', 'Q110055303', 'Q109542585'], moons: ['Q1086783', 'Q2537'],
  fruits: ['Q3314483'], vegetables: ['Q11004'], 'herbs-spices': ['Q42527', 'Q25403900', 'Q207123'], cheeses: ['Q3088299', 'Q2223649', 'Q210112'],
  pasta: ['Q178', 'Q2625877'], cocktails: ['Q134768', 'Q2536409'], breads: ['Q7802', 'Q666242'], desserts: ['Q182940'], nuts: ['Q3320037', 'Q40763'],
  coffee: ['Q37756327', 'Q8486'], 'indian-dishes': ['Q746549', 'Q28099834'], teas: ['Q6097', 'Q484083'], sauces: ['Q178359', 'Q2596997'],
  instruments: ['Q110295396', 'Q34379'], percussion: ['Q110295396', 'Q34379'], 'string-instruments': ['Q110295396', 'Q34379'],
  genres: ['Q188451'], bands: ['Q215380', 'Q5741069'], 'beatles-songs': ['Q55850593', 'Q105543609'], musicals: ['Q58483083'], dances: ['Q107357104'],
  pixar: ['Q202866', 'Q11424'], 'disney-animated': ['Q202866', 'Q11424'], 'best-picture': ['Q11424'], 'mcu-films': ['Q11424'],
  ghibli: ['Q20650540', 'Q202866'], 'bond-films': ['Q11424'], 'pokemon-gen1': ['Q1569167'],
  'star-wars': ['Q33125444', 'Q15773347', 'Q15632617', 'Q1114461', 'Q3658341'], simpsons: ['Q15632617', 'Q15711870', 'Q15773317'],
  sitcoms: ['Q5398426'], superheroes: ['Q1114461', 'Q15632617', 'Q15773347', 'Q15711870'],
  shakespeare: ['Q116476516', 'Q7725634'], 'roald-dahl': ['Q7725634', 'Q47461344'], 'harry-potter': ['Q3658341', 'Q15298259', 'Q15773347'],
  'art-movements': ['Q968159'], paintings: ['Q3305213'], lotr: ['Q15773347', 'Q3658341', 'Q79007', 'Q1621322', 'Q203904'],
  dickens: ['Q15632617', 'Q3658341', 'Q63975020'], 'literary-genres': ['Q223393'],
  wars: ['Q198', 'Q8465', 'Q104212151'], civilisations: ['Q3024240', 'Q4204501'], empires: ['Q3024240', 'Q48349'], ships: ['Q11446', 'Q852190'],
  colours: ['Q1075'], 'shades-of-blue': ['Q1075', 'Q1088'], languages: ['Q1288568', 'Q33742', 'Q34770'], punctuation: ['Q10617810'],
  'ology-words': ['Q11862829', 'Q1047113', 'Q930752'], specialties: ['Q930752', 'Q11862829'],
  bones: ANATOMY, muscles: ANATOMY, organs: ANATOMY, 'body-parts': ANATOMY, 'eye-parts': ANATOMY, 'brain-parts': ANATOMY, face: ANATOMY,
  diseases: ['Q112193867', 'Q112965645'], hormones: ['Q8054', 'Q66590056', 'Q417841', 'Q416997'],
  'programming-languages': ['Q9143'], 'car-brands': ['Q786820', 'Q10429667', 'Q431289'], 'tech-companies': ['Q4830453', 'Q891723', 'Q6881511', 'Q431289'],
  'computer-parts': ['Q43305660'], consoles: ['Q8076', 'Q17589470', 'Q10929058', 'Q941818', 'Q62008942'], browsers: ['Q6368'],
  'operating-systems': ['Q9135', 'Q14656', 'Q920890', 'Q218616'], 'video-games': ['Q7889', 'Q7058673'],
  'greek-gods': ['Q22989102'], 'roman-gods': ['Q11688446'], norse: ['Q16513881'], 'egyptian-gods': ['Q146083'], 'hindu-gods': ['Q979507'],
  'greek-heroes': ['Q22988604'], 'trojan-war': ['Q22988604', 'Q22989102'], arthurian: ['Q15632617', 'Q3658341', 'Q13002315'],
  'fairy-tales': ['Q7725634', 'Q1980247'], 'mythical-creatures': ['Q107765406', 'Q2239243'],
  sports: ['Q31629', 'Q212434'], 'olympic-sports': ['Q31629', 'Q212434'], 'martial-arts': ['Q11417', 'Q31629', 'Q7128792'],
  'nba-teams': ['Q13393265'], 'nfl-teams': ['Q17156793'], 'mlb-teams': ['Q13027888'], 'nhl-teams': ['Q4498974'], 'premier-league': ['Q476028', 'Q27971968'],
};
