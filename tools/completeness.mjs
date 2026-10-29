// Completeness audit: well-known answers that belong on each list, checked against our data.
// Each miss is sorted by cause: not on the source page at all (missing upstream, or my sample
// was wrong), on the source page but not read into the answers (a parsing gap), or in the
// answers but not matched as typed (a spelling or alias gap).
// Run after a build: node tools/completeness.mjs [--fail]
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, match, toKey } from '../js/matcher.js';
import { LISTS } from '../build/lists.mjs';
import { PROMPTS } from '../build/registry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(ROOT, 'data/prompts.json'), 'utf8'));

// Players and answers that should be on each list, written from general knowledge and checked
// against the stated source.
export const SAMPLES = {
  'caps-100': ['Cristiano Ronaldo', 'Lionel Messi', 'Sergio Ramos', 'Luka Modric', 'Gianluigi Buffon', 'Iker Casillas', 'Wayne Rooney', 'David Beckham',
    'Steven Gerrard', 'Frank Lampard', 'Ashley Cole', 'Peter Shilton', 'Bobby Moore', 'Bobby Charlton', 'Harry Kane', 'Thierry Henry', 'Lilian Thuram',
    'Hugo Lloris', 'Antoine Griezmann', 'Olivier Giroud', 'Zinedine Zidane', 'Miroslav Klose', 'Lothar Matthaus', 'Philipp Lahm', 'Bastian Schweinsteiger',
    'Thomas Muller', 'Manuel Neuer', 'Xavi', 'Andres Iniesta', 'Cafu', 'Roberto Carlos', 'Neymar', 'Dani Alves', 'Javier Mascherano', 'Javier Zanetti',
    'Robbie Keane', 'Gareth Bale', 'Zlatan Ibrahimovic', 'Paolo Maldini', 'Andrea Pirlo'],
  'world-cup-winners': ['Pele', 'Garrincha', 'Cafu', 'Ronaldo', 'Ronaldinho', 'Rivaldo', 'Roberto Carlos', 'Romario', 'Bebeto', 'Dunga', 'Diego Maradona',
    'Mario Kempes', 'Lionel Messi', 'Angel Di Maria', 'Emiliano Martinez', 'Julian Alvarez', 'Enzo Fernandez', 'Franz Beckenbauer', 'Gerd Muller',
    'Lothar Matthaus', 'Jurgen Klinsmann', 'Rudi Voller', 'Miroslav Klose', 'Philipp Lahm', 'Thomas Muller', 'Manuel Neuer', 'Mario Gotze',
    'Zinedine Zidane', 'Thierry Henry', 'Didier Deschamps', 'Kylian Mbappe', 'Antoine Griezmann', 'Paul Pogba', 'Bobby Moore', 'Geoff Hurst',
    'Bobby Charlton', 'Gordon Banks', 'Dino Zoff', 'Fabio Cannavaro', 'Andres Iniesta'],
  'ballon-dor-podium': ['Lionel Messi', 'Cristiano Ronaldo', 'Michel Platini', 'Johan Cruyff', 'Marco van Basten', 'Zinedine Zidane', 'Ronaldinho', 'Kaka',
    'Luka Modric', 'Karim Benzema', 'Rodri', 'Ousmane Dembele', 'Lev Yashin', 'George Best', 'Bobby Charlton', 'Denis Law', 'Eusebio', 'Gerd Muller',
    'Franz Beckenbauer', 'Kevin Keegan', 'Karl-Heinz Rummenigge', 'Paolo Rossi', 'Lothar Matthaus', 'Jean-Pierre Papin', 'Roberto Baggio',
    'Hristo Stoichkov', 'George Weah', 'Matthias Sammer', 'Rivaldo', 'Luis Figo', 'Michael Owen', 'Pavel Nedved', 'Andriy Shevchenko', 'Fabio Cannavaro',
    'Xavi', 'Andres Iniesta', 'Neymar', 'Kylian Mbappe', 'Thierry Henry', 'Virgil van Dijk'],
  'world-cup-scorers': ['Miroslav Klose', 'Ronaldo', 'Gerd Muller', 'Just Fontaine', 'Lionel Messi', 'Kylian Mbappe', 'Pele', 'Jurgen Klinsmann',
    'Sandor Kocsis', 'Gary Lineker', 'Thomas Muller', 'Gabriel Batistuta', 'Teofilo Cubillas', 'Grzegorz Lato', 'Helmut Rahn', 'Eusebio', 'Jairzinho',
    'Christian Vieri', 'Paolo Rossi', 'Roberto Baggio', 'David Villa', 'Vava', 'Uwe Seeler', 'Karl-Heinz Rummenigge', 'Rivaldo', 'Diego Maradona',
    'Harry Kane', 'Cristiano Ronaldo', 'Rudi Voller', 'Davor Suker', 'Oleg Salenko', 'Thierry Henry', 'Neymar', 'Robert Lewandowski', 'Mario Kempes',
    'Geoff Hurst', 'Bebeto', 'Romario', 'Zinedine Zidane', 'Wesley Sneijder'],
  'nba-all-stars': ['LeBron James', 'Michael Jordan', 'Kobe Bryant', 'Shaquille O\'Neal', 'Magic Johnson', 'Larry Bird', 'Stephen Curry', 'Kevin Durant',
    'Tim Duncan', 'Dirk Nowitzki', 'Kareem Abdul-Jabbar', 'Wilt Chamberlain', 'Bill Russell', 'Hakeem Olajuwon', 'Allen Iverson', 'Dwyane Wade',
    'Giannis Antetokounmpo', 'Nikola Jokic', 'Luka Doncic', 'Yao Ming'],
  'grand-slam-champions': ['Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Andy Murray', 'Pete Sampras', 'Andre Agassi', 'Bjorn Borg', 'John McEnroe',
    'Serena Williams', 'Venus Williams', 'Steffi Graf', 'Martina Navratilova', 'Chris Evert', 'Maria Sharapova', 'Emma Raducanu', 'Carlos Alcaraz',
    'Jannik Sinner', 'Naomi Osaka', 'Boris Becker', 'Billie Jean King'],
  'f1-winners': ['Lewis Hamilton', 'Michael Schumacher', 'Max Verstappen', 'Sebastian Vettel', 'Ayrton Senna', 'Alain Prost', 'Fernando Alonso',
    'Nigel Mansell', 'Jackie Stewart', 'Niki Lauda', 'Jenson Button', 'Kimi Raikkonen', 'Damon Hill', 'Mika Hakkinen', 'Nico Rosberg', 'Lando Norris',
    'Charles Leclerc', 'Daniel Ricciardo', 'Jim Clark', 'Juan Manuel Fangio'],
  nobel: ['Albert Einstein', 'Marie Curie', 'Nelson Mandela', 'Martin Luther King Jr.', 'Barack Obama', 'Malala Yousafzai', 'Mother Teresa', 'Ernest Hemingway',
    'Bob Dylan', 'Winston Churchill', 'Niels Bohr', 'Richard Feynman', 'Alexander Fleming', 'Kazuo Ishiguro', 'Dalai Lama', 'Toni Morrison',
    'Aung San Suu Kyi', 'Max Planck', 'Linus Pauling', 'Peter Higgs'],
  leaders: ['George Washington', 'Abraham Lincoln', 'Barack Obama', 'Donald Trump', 'Joe Biden', 'Ronald Reagan', 'John F. Kennedy', 'Richard Nixon',
    'Winston Churchill', 'Margaret Thatcher', 'Tony Blair', 'Boris Johnson', 'Keir Starmer', 'David Cameron', 'Theresa May', 'Robert Walpole',
    'Franklin D. Roosevelt', 'Theodore Roosevelt', 'Gordon Brown', 'Rishi Sunak'],
  authors: ['William Shakespeare', 'Agatha Christie', 'J. K. Rowling', 'Stephen King', 'Danielle Steel', 'Dr. Seuss', 'Leo Tolstoy', 'Enid Blyton',
    'Roald Dahl', 'J. R. R. Tolkien', 'Dan Brown', 'John Grisham', 'Paulo Coelho', 'Jackie Collins', 'Ian Fleming', 'Charles Dickens', 'Sidney Sheldon',
    'Terry Pratchett', 'R. L. Stine', 'Jules Verne'],
  'best-selling-artists': ['The Beatles', 'Michael Jackson', 'Elvis Presley', 'Madonna', 'Elton John', 'Queen', 'Rihanna', 'Taylor Swift', 'Eminem',
    'Mariah Carey', 'Whitney Houston', 'Celine Dion', 'Drake', 'Coldplay', 'Ed Sheeran', 'ABBA', 'Pink Floyd', 'Led Zeppelin', 'U2', 'Bruno Mars'],
  bands: ['The Beatles', 'The Rolling Stones', 'Queen', 'Led Zeppelin', 'Pink Floyd', 'Nirvana', 'ABBA', 'U2', 'The Who', 'Elvis Presley', 'Aretha Franklin',
    'Bob Dylan', 'David Bowie', 'Prince', 'Madonna', 'Metallica', 'Red Hot Chili Peppers', 'Fleetwood Mac', 'Michael Jackson', 'Bruce Springsteen'],
  'box-office': ['Avatar', 'Titanic', 'Avengers: Endgame', 'Star Wars', 'Jurassic Park', 'The Lion King', 'Frozen', 'Barbie', 'The Dark Knight',
    'E.T. the Extra-Terrestrial', 'Gone with the Wind', 'The Sound of Music', 'Jaws', 'Toy Story 4', 'Black Panther', 'Spider-Man: No Way Home',
    'Top Gun: Maverick', 'Inside Out 2', 'Finding Nemo', 'Harry Potter and the Deathly Hallows – Part 2'],
  'animated-studios': ['Snow White and the Seven Dwarfs', 'The Lion King', 'Frozen', 'Toy Story', 'Shrek', 'Moana', 'Aladdin', 'Beauty and the Beast',
    'Finding Nemo', 'Up', 'WALL-E', 'Coco', 'Kung Fu Panda', 'How to Train Your Dragon', 'Madagascar', 'Encanto', 'Zootopia', 'Ratatouille',
    'Inside Out', 'The Incredibles'],
  'best-picture': ['Titanic', 'The Godfather', 'Casablanca', 'Gladiator', 'Forrest Gump', 'The Silence of the Lambs', 'Schindler\'s List', 'Oppenheimer',
    'Parasite', 'Gone with the Wind', 'Ben-Hur', 'The Sound of Music', 'Rocky', 'Braveheart', 'The Departed', 'Slumdog Millionaire', 'The King\'s Speech',
    'Everything Everywhere All at Once', 'Moonlight', 'Chicago'],
  sitcoms: ['Friends', 'Seinfeld', 'Frasier', 'Cheers', 'Modern Family', 'The Office', 'Ted Lasso', 'Breaking Bad', 'Game of Thrones', 'The West Wing',
    'Mad Men', 'The Sopranos', 'Succession', 'Veep', '30 Rock', 'Schitt\'s Creek', 'The Crown', 'Everybody Loves Raymond', 'M*A*S*H', 'Hacks'],
  'spotify-songs': ['Blinding Lights', 'Shape of You', 'Someone You Loved', 'As It Was', 'Bohemian Rhapsody', 'Believer', 'Perfect', 'Starboy', 'One Dance',
    'Dance Monkey', 'Sunflower', 'Stay', 'Heat Waves', 'Closer', 'Thinking Out Loud', 'Mr. Brightside', 'Lose Yourself', 'Billie Jean', 'Wonderwall',
    'Uptown Funk'],
  'best-selling-albums': ['Thriller', 'Back in Black', 'The Dark Side of the Moon', 'The Bodyguard', 'Rumours', 'Hotel California', 'Bat Out of Hell',
    'Saturday Night Fever', 'Come On Over', 'Jagged Little Pill', 'Falling into You', 'Dirty Dancing', '21', 'Nevermind', 'Appetite for Destruction',
    'Abbey Road', 'Sgt. Pepper\'s Lonely Hearts Club Band', 'Purple Rain', 'Back to Black', 'The Wall'],
  'beatles-songs': ['Hey Jude', 'Let It Be', 'Yesterday', 'Help!', 'Come Together', 'Something', 'Here Comes the Sun', 'Yellow Submarine', 'Eleanor Rigby',
    'Penny Lane', 'Strawberry Fields Forever', 'All You Need Is Love', 'Twist and Shout', 'She Loves You', 'I Want to Hold Your Hand', 'Love Me Do',
    'A Hard Day\'s Night', 'Day Tripper', 'Get Back', 'Blackbird'],
  simpsons: ['Homer Simpson', 'Marge Simpson', 'Bart Simpson', 'Lisa Simpson', 'Maggie Simpson', 'Ned Flanders', 'Mr. Burns', 'Waylon Smithers', 'Moe Szyslak',
    'Barney Gumble', 'Apu Nahasapeemapetilon', 'Krusty the Clown', 'Sideshow Bob', 'Milhouse Van Houten', 'Nelson Muntz', 'Ralph Wiggum', 'Chief Wiggum',
    'Principal Skinner', 'Edna Krabappel', 'Groundskeeper Willie'],
  'harry-potter': ['Harry Potter', 'Hermione Granger', 'Ron Weasley', 'Albus Dumbledore', 'Severus Snape', 'Lord Voldemort', 'Rubeus Hagrid', 'Draco Malfoy',
    'Sirius Black', 'Minerva McGonagall', 'Neville Longbottom', 'Luna Lovegood', 'Ginny Weasley', 'Dobby', 'Bellatrix Lestrange', 'Remus Lupin',
    'Cedric Diggory', 'Dolores Umbridge', 'Gilderoy Lockhart', 'Peter Pettigrew'],
  'best-selling-games': ['Tetris', 'Minecraft', 'Grand Theft Auto V', 'Wii Sports', 'Mario Kart 8 Deluxe', 'Red Dead Redemption 2', 'Pokemon Red',
    'Super Mario Bros.', 'The Elder Scrolls V: Skyrim', 'The Witcher 3: Wild Hunt', 'Terraria', 'Animal Crossing: New Horizons', 'Super Smash Bros. Ultimate',
    'Call of Duty: Modern Warfare', 'Overwatch', 'Diablo III', 'Stardew Valley', 'Human: Fall Flat', 'The Legend of Zelda: Breath of the Wild', 'Elden Ring'],
  'classic-games': ['Tetris', 'Pac-Man', 'Super Mario Bros.', 'The Legend of Zelda: Ocarina of Time', 'Half-Life', 'Doom', 'Minecraft', 'Portal 2',
    'Grand Theft Auto V', 'The Last of Us', 'Red Dead Redemption 2', 'Super Mario 64', 'Street Fighter II', 'Space Invaders', 'Final Fantasy VII',
    'Metal Gear Solid', 'GoldenEye 007', 'Halo: Combat Evolved', 'Elden Ring', 'The Witcher 3: Wild Hunt'],
  'car-brands': ['Ford', 'Toyota', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Ferrari', 'Lamborghini', 'Porsche', 'Tesla', 'Honda', 'Nissan',
    'Hyundai', 'Kia', 'Volvo', 'Jaguar', 'Land Rover', 'Rolls-Royce', 'Aston Martin', 'Skoda'],
  'fast-food': ['McDonald\'s', 'KFC', 'Burger King', 'Subway', 'Pizza Hut', 'Domino\'s', 'Taco Bell', 'Wendy\'s', 'Five Guys', 'Nando\'s', 'Greggs',
    'Popeyes', 'Chick-fil-A', 'Dunkin\'', 'Tim Hortons', 'Chipotle', 'Papa John\'s', 'Arby\'s', 'Dairy Queen', 'Jollibee'],
  'football-clubs': ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham Hotspur', 'Real Madrid', 'Barcelona',
    'Atletico Madrid', 'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma', 'Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen',
    'Paris Saint-Germain', 'Marseille', 'Lyon'],
  'us-teams': ['Los Angeles Lakers', 'Boston Celtics', 'Chicago Bulls', 'Golden State Warriors', 'New York Yankees', 'Boston Red Sox', 'Los Angeles Dodgers',
    'Chicago Cubs', 'Dallas Cowboys', 'New England Patriots', 'Kansas City Chiefs', 'Green Bay Packers', 'Pittsburgh Steelers', 'New York Rangers',
    'Toronto Maple Leafs', 'Montreal Canadiens', 'Chicago Blackhawks', 'Miami Heat', 'San Francisco 49ers', 'Detroit Red Wings'],
};

const pageText = new Map();
function sourceKeys(id) {
  const def = PROMPTS.find((p) => p.id === id);
  if (!def || !def.wiki) return null;
  if (!pageText.has(id)) {
    let text = '';
    for (const title of LISTS[def.wiki].pages) {
      const f = join(ROOT, 'data/raw/wiki', title.replace(/[^A-Za-z0-9_-]/g, '_') + '.wiki');
      const g = join(ROOT, 'data/raw/wiki', encodeURIComponent(title.replace(/ /g, '_')).replace(/'/g, '%27').replace(/[^A-Za-z0-9_-]/g, '_') + '.wiki');
      if (existsSync(f)) text += readFileSync(f, 'utf8');
      else if (existsSync(g)) text += readFileSync(g, 'utf8');
    }
    pageText.set(id, toKey(text));
  }
  return pageText.get(id);
}

const rows = [];
const misses = [];
for (const [id, sample] of Object.entries(SAMPLES)) {
  const p = data.prompts.find((x) => x.id === id);
  if (!p) { rows.push({ id, text: '(no such prompt)', n: sample.length, miss: sample.length }); continue; }
  const index = buildIndex(p.answers, { people: p.people });
  const keys = new Set(p.answers.flatMap((a) => [a.label, ...a.aliases].map(toKey)));
  const source = sourceKeys(id);
  let miss = 0;
  for (const name of sample) {
    const r = match(index, name);
    if (r.result === 'correct') continue;
    miss++;
    const k = toKey(name);
    const why = keys.has(k) ? 'in answers, not matched' : source && !source.includes(k) ? 'not on the source page' : source ? 'on the source page, not read in' : 'not in the curated list';
    misses.push({ id, name, why, result: r.ambiguous ? 'too close to call' : 'rejected' });
  }
  rows.push({ id, text: p.text, n: sample.length, miss });
}
const total = rows.reduce((s, r) => s + r.n, 0);
const missed = rows.reduce((s, r) => s + r.miss, 0);
console.log('| Prompt | Sample | Missed | Miss rate |');
console.log('|---|---|---|---|');
for (const r of rows) console.log(`| ${r.text} | ${r.n} | ${r.miss} | ${((100 * r.miss) / r.n).toFixed(0)}% |`);
console.log(`\nOverall: ${missed} of ${total} missed (${((100 * missed) / total).toFixed(1)}%)\n`);
for (const m of misses) console.log(`- ${m.id}: ${m.name} (${m.result}; ${m.why})`);
if (process.argv.includes('--fail') && missed) process.exit(1);
