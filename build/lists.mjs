// Ranked and reference lists read from Wikipedia pages saved in data/raw/wiki (build/fetch-wiki.mjs).
// Each list names its pages and returns answers as { label, title, aliases? } in list order.
// `outside` lists real things of the same kind that are not on the list, for the
// "real, just not on this list" message.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTables, firstLink, plain, stripRefs } from './wikitable.mjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../data/raw/wiki');
// Older downloads used the URL-encoded title for the file name.
const fileFor = (title) => {
  const plainName = join(DIR, title.replace(/[^A-Za-z0-9_-]/g, '_') + '.wiki');
  const encoded = join(DIR, encodeURIComponent(title.replace(/ /g, '_')).replace(/'/g, '%27').replace(/[^A-Za-z0-9_-]/g, '_') + '.wiki');
  return existsSync(plainName) || !existsSync(encoded) ? plainName : encoded;
};
const page = (title) => {
  const f = fileFor(title);
  if (!existsSync(f)) throw new Error(`Missing ${f}: run node build/fetch-wiki.mjs`);
  return readFileSync(f, 'utf8');
};
const tables = (title) => parseTables(page(title));

// Labels for the board: the link text, without disambiguation in brackets.
const tidy = (s) => s.replace(/\s*\((?:film|video game|album|song|band|musician|singer|rapper|franchise|restaurant|company|chain|fast food|restaurant chain|dog|cocktail|drink|footballer|tennis|racing driver|tennis player|confectionery|chocolate bar|candy|candy bar|brand|game|series|soundtrack|EP|[0-9]{4}(?: film| video game)?)\)$/i, '').replace(/\s+/g, ' ').trim();
const entry = (l, extra = {}) => (l ? { label: tidy(l.text), title: l.title, ...extra } : null);

// The cell under a header, allowing for leading cells taken by a rowspan above.
function cellAt(row, headers, col) {
  const shift = Math.max(0, headers.length - row.length);
  return row[col - shift] || null;
}
function column(t, col, { link = true } = {}) {
  return t.rows.map((r) => {
    const c = cellAt(r, t.headers, col);
    if (!c) return null;
    if (link) return entry(firstLink(c.raw));
    const text = plain(c.raw);
    return text ? { label: text, title: null } : null;
  }).filter(Boolean);
}
const colIndex = (t, re) => t.headers.findIndex((h) => re.test(h));
const rowHeaders = (t) => t.rows.map((r) => r.find((c) => c.header)).filter(Boolean).map((c) => entry(firstLink(c.raw))).filter(Boolean);

function uniq(list) {
  const seen = new Set();
  return list.filter((a) => {
    const k = a.label.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Platform charts for the "outside the list" pool and the platform rule.
const PLATFORM_PAGES = [
  'List of best-selling PlayStation 4 video games', 'List of best-selling Nintendo Switch video games', 'List of best-selling PC games',
  'List of best-selling PlayStation 2 video games', 'List of best-selling Xbox 360 video games', 'List of best-selling Wii video games',
  'List of best-selling Nintendo DS video games', 'List of best-selling PlayStation video games', 'List of best-selling Nintendo Entertainment System video games',
  'List of best-selling Game Boy video games', 'List of best-selling PlayStation 3 video games', 'List of best-selling Xbox One video games',
  'List of best-selling PlayStation 5 video games', 'List of best-selling Nintendo 3DS video games', 'List of best-selling Game Boy Advance video games',
];
// Copies sold in a sales cell: "{{nts|29.52}} million", "{{sort|410|41 million}}", "45,900,000",
// or a plain number under a "(millions)" header.
function salesOf(raw, millionsHeader) {
  const text = raw.replace(/\{\{sort\|[^|}]*\|([^}]*)\}\}/gi, '$1').replace(/\{\{nts\|([^}|]*)[^}]*\}\}/gi, '$1')
    .replace(/\{\{val\|([^}|]*)\|u=million\}\}/gi, '$1 million').replace(/\{\{nbsp\}\}/gi, ' ');
  const m = plain(text).match(/([\d][\d,]*(?:\.\d+)?)\s*(million)?/i);
  if (!m) return 0;
  const n = Number(m[1].replace(/,/g, ''));
  return m[2] || millionsHeader || n < 1000 ? n * 1e6 : n;
}

function platformGames(title) {
  const t = tables(title).find((x) => /^(Game|Title)$/.test(x.headers[0] || ''));
  if (!t) return [];
  // Rows drop cells at either end, so the sales cell is the first one after the title that reads as sales.
  const looksLikeSales = (raw) => /\{\{(nts|val|sort)\||million|\d{1,3}(,\d{3}){2}/i.test(raw);
  // Indented rows ({{in5}}) are parts of the game above (the Generation I Pokémon games), not extra sales.
  return t.rows.filter((r) => !/\{\{in5\}\}/.test(r[0].raw)).map((r) => {
    const titleAt = Math.max(0, r.findIndex((c) => c.header));
    const e = entry(firstLink(r[titleAt].raw));
    const cell = r.slice(titleAt + 1).find((c) => looksLikeSales(c.raw));
    return e ? { ...e, sales: cell ? salesOf(cell.raw, false) : 0 } : null;
  }).filter(Boolean);
}

// The overall chart: the title is the row header, copies sold (millions) the next cell.
function topSellers() {
  const t = tables('List of best-selling video games')[0];
  return t.rows.map((r) => {
    const h = r.findIndex((c) => c.header);
    const e = h >= 0 ? entry(firstLink(r[h].raw)) : null;
    return e ? { ...e, total: salesOf(r[h + 1] ? r[h + 1].raw : '', true) } : null;
  }).filter(Boolean);
}

// FIFA codes on the World Cup appearances table. Former teams count for the successor FIFA names.
const FIFA = {
  BRA: 'Brazil', GER: 'Germany|West Germany', ARG: 'Argentina', ITA: 'Italy', MEX: 'Mexico', ESP: 'Spain', ENG: 'England', FRA: 'France', BEL: 'Belgium',
  URU: 'Uruguay', SUI: 'Switzerland', SWE: 'Sweden', SRB: 'Serbia|Yugoslavia', KOR: 'South Korea|Korea Republic', USA: 'United States|USA|USMNT',
  NED: 'Netherlands|Holland', RUS: 'Russia|Soviet Union|USSR', CZE: 'Czech Republic|Czechia|Czechoslovakia', POR: 'Portugal', SCO: 'Scotland',
  PAR: 'Paraguay', HUN: 'Hungary', POL: 'Poland', SVK: 'Slovakia', CHI: 'Chile', JPN: 'Japan', CMR: 'Cameroon', AUT: 'Austria', AUS: 'Australia',
  CRO: 'Croatia', IRN: 'Iran', KSA: 'Saudi Arabia', BUL: 'Bulgaria', MAR: 'Morocco', TUN: 'Tunisia', COL: 'Colombia', ROU: 'Romania',
  CRC: 'Costa Rica', NGA: 'Nigeria', DEN: 'Denmark', GHA: 'Ghana', ECU: 'Ecuador', ALG: 'Algeria', PER: 'Peru', SEN: 'Senegal',
  CIV: 'Ivory Coast|Cote d\'Ivoire', NOR: 'Norway', RSA: 'South Africa', EGY: 'Egypt', CAN: 'Canada', NIR: 'Northern Ireland', HON: 'Honduras',
  IRL: 'Republic of Ireland|Ireland', GRE: 'Greece', TUR: 'Turkey|Turkiye', NZL: 'New Zealand', BOL: 'Bolivia', QAT: 'Qatar',
  COD: 'DR Congo|Democratic Republic of the Congo|Zaire', BIH: 'Bosnia and Herzegovina|Bosnia', HAI: 'Haiti', IRQ: 'Iraq', PAN: 'Panama',
  WAL: 'Wales', PRK: 'North Korea|Korea DPR', SLV: 'El Salvador', SVN: 'Slovenia', CPV: 'Cape Verde|Cabo Verde', CUW: 'Curacao', JOR: 'Jordan',
  UZB: 'Uzbekistan', CUB: 'Cuba', IDN: 'Indonesia|Dutch East Indies', ISR: 'Israel', GDR: 'East Germany', KUW: 'Kuwait', UAE: 'United Arab Emirates|UAE',
  JAM: 'Jamaica', CHN: 'China', ANG: 'Angola', TOG: 'Togo', TRI: 'Trinidad and Tobago|Trinidad', UKR: 'Ukraine', ISL: 'Iceland',
};

function leagueClubs(title) {
  const ts = tables(title);
  // The coaches table names every club once, in plain text; the stadium table has the links.
  const coaches = ts.find((t) => /^(Team|Club)$/.test(t.headers[0] || '') && /^(Manager|Head coach|Coach)/.test(t.headers[1] || ''));
  const grounds = ts.find((t) => /^(Team|Club)$/.test(t.headers[0] || '') && /^Location/.test(t.headers[1] || ''));
  // First link wins: a stadium table can also link the city of the same name (Barcelona).
  const links = new Map();
  for (const l of grounds.rows.map((r) => firstLink(r[0].raw)).filter(Boolean)) if (!links.has(l.text)) links.set(l.text, l);
  const names = coaches ? coaches.rows.filter((r) => !r[0].header).map((r) => plain(r[0].raw)).filter(Boolean) : [...links.keys()];
  return names.map((n) => entry(links.get(n) || { text: n, title: n }));
}

// Ranked by the 2025 estimate, as the table is.
const usCities = () => tables('List of United States cities by population')[1].rows.filter((r) => !r[0].header).map((r) => entry(firstLink(r[0].raw))).filter(Boolean);


// "Black, Sirius" (a list's surname-first text) becomes "Sirius Black".
const firstLast = (t) => (/^[^,]+, [^,]+$/.test(t) ? t.split(', ').reverse().join(' ') : t);
// Every person link in a cell, for cells that hold several names.
function linksIn(raw) {
  const out = [];
  const re = /\{\{sortname\|([^|}]+)\|([^|}]+)(?:\|([^|}]+))?[^}]*\}\}|\[\[(?!File:|Image:|Category:)([^\]|#]+)(?:\|([^\]]+))?\]\]/g;
  let m;
  while ((m = re.exec(raw))) {
    // {{sortname|Tenzin|Gyatso (The 14th Dalai Lama)|14th Dalai Lama}}: the name without its note.
    if (m[1]) out.push({ label: `${m[1]} ${m[2].replace(/\s*\([^)]*\)/, '')}`.trim(), title: (m[3] || `${m[1]} ${m[2]}`).trim() });
    else out.push({ label: tidy(plain(m[5] || m[4])), title: m[4].trim() });
  }
  return out;
}
// Every footballer on any football list: real players for the "just not on this list" line.
const footballers = () => ['caps-100', 'world-cup-winners', 'ballon-dor-podium', 'world-cup-scorers'].flatMap((id) => LISTS[id].answers());
const notYear = (e) => e && !/^\d{4}( |$)|Award|Prize|Games|Cup|Olympics|^List of/.test(e.title);

export const LISTS = {
  'caps-100': {
    pages: ["List of men's footballers with 100 or more international caps"],
    year: 2026,
    outside: footballers,
    answers() {
      const t = tables("List of men's footballers with 100 or more international caps")[1];
      const col = colIndex(t, /^Player/);
      return uniq(t.rows.map((r) => entry(firstLink((cellAt(r, t.headers, col) || r[0]).raw))).filter(notYear));
    },
  },
  'world-cup-winners': {
    pages: ['List of FIFA World Cup winning players'],
    year: 2026,
    outside: footballers,
    answers() {
      return uniq(rowHeaders(tables('List of FIFA World Cup winning players')[0]));
    },
  },
  'ballon-dor-podium': {
    pages: ["Ballon d'Or"],
    year: 2025,
    outside: footballers,
    answers() {
      // Each year's table rows: rank (1st, 2nd, 3rd), then the player.
      const out = [];
      for (const t of tables("Ballon d'Or").slice(0, 3)) {
        for (const r of t.rows) {
          const k = r.findIndex((c) => /^(1st|2nd|3rd)\b/.test(plain(c.raw)));
          if (k >= 0 && r[k + 1]) out.push(entry(firstLink(r[k + 1].raw)));
        }
      }
      return uniq(out.filter(notYear));
    },
  },
  'world-cup-scorers': {
    pages: ['List of FIFA World Cup top goalscorers'],
    year: 2026,
    outside: footballers,
    answers() {
      // Tied ranks share a cell, so the player is the first cell with a link that is not a flag.
      const t = tables('List of FIFA World Cup top goalscorers')[2];
      return uniq(t.rows.map((r) => {
        const c = r.find((x) => !/^\{\{fb\|/.test(x.raw) && firstLink(x.raw));
        return c ? entry(firstLink(c.raw)) : null;
      }).filter(notYear));
    },
    // The smallest goal count on the table, for the rules line.
    minGoals() {
      const t = tables('List of FIFA World Cup top goalscorers')[2];
      // Goals sit in the first header cell of each row ("!22").
      return Math.min(...t.rows.map((r) => Number(plain((r.find((c) => c.header) || { raw: '' }).raw))).filter((n) => n > 0));
    },
  },
  'nba-all-stars': {
    pages: ['List of NBA All-Stars'],
    year: 2026,
    answers() {
      return uniq(column(tables('List of NBA All-Stars')[1], 0));
    },
  },
  'rock-hall': {
    pages: ['List of Rock and Roll Hall of Fame inductees'],
    year: 2025,
    answers() {
      // Performers: the name is the cell after the photo, or the first linked cell that is not a year.
      const t = tables('List of Rock and Roll Hall of Fame inductees')[0];
      return uniq(t.rows.map((r) => {
        const pic = r.findIndex((c) => /^\[\[File:/.test(c.raw));
        const cell = pic >= 0 ? r[pic + 1] : r.find((c) => !/^\d{4}$/.test(plain(c.raw)) && firstLink(c.raw));
        return cell ? entry(firstLink(cell.raw)) : null;
      }).filter(notYear));
    },
  },
  'emmy-series': {
    pages: ['List of Primetime Emmy Award winners'],
    year: 2025,
    answers() {
      // The comedy and drama series columns; one row per year.
      const t = tables('List of Primetime Emmy Award winners')[0];
      const out = [];
      for (const r of t.rows) {
        const h = r.findIndex((c) => c.header);
        for (const c of [r[h + 1], r[h + 2]]) {
          if (!c) continue;
          const m = c.raw.match(/''\[\[([^\]|]+)(?:\|([^\]]+))?\]\]''/);
          if (m) out.push({ label: tidy(plain(m[2] || m[1])), title: m[1] });
        }
      }
      return uniq(out);
    },
  },
  'best-selling-authors': {
    pages: ['List of best-selling fiction authors'],
    year: 2026,
    answers() {
      return uniq(column(tables('List of best-selling fiction authors')[0], 0));
    },
  },
  nobel: {
    pages: ['List of Nobel laureates'],
    year: 2025,
    answers() {
      const t = tables('List of Nobel laureates')[0];
      const out = [];
      // A full row lines up with the headers, so each name knows its prize.
      const prize = (k) => (t.headers[k] || '').replace(/Physiologyor Medicine/, 'Physiology or Medicine').replace(/Economic.*/, 'Economics');
      for (const r of t.rows) r.forEach((c, k) => { if (!c.header) out.push(...linksIn(c.raw).map((e) => ({ ...e, from: r.length === t.headers.length ? prize(k) : undefined }))); });
      return uniq(out.filter(notYear).filter((e) => !/^(None|Not awarded)/i.test(e.label)));
    },
  },
  'car-brands': {
    pages: ['List of car brands'],
    year: 2026,
    answers() {
      // Bullets under each country's Active and Former headings.
      const text = stripRefs(page('List of car brands'));
      const body = text.slice(0, text.search(/==\s*See also/));
      let status = '';
      const out = [];
      for (const l of body.split('\n')) {
        const h = l.match(/^===\s*(Active|Former)/);
        if (h) { status = h[1]; continue; }
        if (/^==[^=]/.test(l)) status = '';
        if (status && /^\*\s*\[\[/.test(l)) { const e = entry(firstLink(l)); if (e) out.push({ ...e, from: status }); }
      }
      return uniq(out);
    },
  },
  'simpsons-characters': {
    pages: ['List of The Simpsons characters'],
    year: 2026,
    answers() {
      return uniq(column(tables('List of The Simpsons characters')[0], 0));
    },
  },
  'harry-potter-characters': {
    pages: ['List of Harry Potter characters'],
    year: 2026,
    answers() {
      // "* {{va|Hannah Abbott|text=Abbott, Hannah}} – ..." or "* [[Sirius Black|Black, Sirius]] – ...".
      const text = stripRefs(page('List of Harry Potter characters'));
      const body = text.slice(text.indexOf('==Characters by surname'), text.search(/==\s*See also/));
      const out = [];
      for (const l of body.split('\n')) {
        if (!/^\*\s/.test(l)) continue;
        const va = l.match(/^\*\s*\{\{va\|([^|}]+)/);
        if (va) { out.push({ label: va[1].trim(), title: null }); continue; }
        const link = firstLink(l.split(' – ')[0]);
        if (link) out.push({ label: firstLast(link.text), title: link.title });
      }
      return uniq(out);
    },
  },

  'best-selling-games': {
    pages: ['List of best-selling video games', ...PLATFORM_PAGES, 'List of video games considered the best'],
    year: 2026,
    // Every chart entry with its sales; the build adds platforms up per game and keeps the top.
    rank: { by: 'sales', top: 200 },
    answers() {
      return [...topSellers(), ...PLATFORM_PAGES.flatMap(platformGames)];
    },
    outside() {
      return LISTS['classic-games'].answers();
    },
  },
  'classic-games': {
    pages: ['List of video games considered the best'],
    year: 2026,
    answers() {
      // A year header spans several rows; the game is the first ordinary cell of each row.
      const t = tables('List of video games considered the best')[0];
      return uniq(t.rows.map((r) => r.find((c) => !c.header)).filter(Boolean).map((c) => entry(firstLink(c.raw))).filter(Boolean));
    },
  },
  'box-office': {
    pages: ['List of highest-grossing films', 'List of highest-grossing films in the United States and Canada'],
    year: 2026,
    answers() {
      const world = rowHeaders(tables('List of highest-grossing films')[0]);
      const us = tables('List of highest-grossing films in the United States and Canada');
      return uniq([...world, ...column(us[0], colIndex(us[0], /^Title/)), ...column(us[1], colIndex(us[1], /^Title/))]);
    },
    outside() {
      const yearly = tables('List of highest-grossing films')[2];
      return [...column(yearly, colIndex(yearly, /^Title/)), ...LISTS['animated-studios'].answers()];
    },
  },
  'animated-studios': {
    pages: ['List of Walt Disney Animation Studios films', 'List of Pixar films', 'List of DreamWorks Animation productions'],
    year: 2026,
    answers() {
      const disney = rowHeaders(tables('List of Walt Disney Animation Studios films')[1]).map((a) => ({ ...a, from: 'Disney' }));
      const pixar = rowHeaders(tables('List of Pixar films')[0]).map((a) => ({ ...a, from: 'Pixar' }));
      const dw = rowHeaders(tables('List of DreamWorks Animation productions')[0]).map((a) => ({ ...a, from: 'DreamWorks' }));
      return uniq([...disney, ...pixar, ...dw]);
    },
  },
  'best-selling-artists': {
    pages: ['List of best-selling music artists', 'List of most-streamed artists on Spotify'],
    year: 2026,
    answers() {
      return uniq(tables('List of best-selling music artists').filter((t) => /^Artist/.test(t.headers[0] || '')).flatMap(rowHeaders));
    },
    outside() {
      return [...tables('List of most-streamed artists on Spotify').slice(4).flatMap((t) => column(t, colIndex(t, /^Artist/)))];
    },
  },
  'spotify-songs': {
    pages: ['List of Spotify streaming records'],
    year: 2026,
    answers() {
      const t = tables('List of Spotify streaming records')[0];
      // The table capitalises every word ("Shape Of You"); short joining words go back to lower case.
      const small = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
      const fix = (label) => label.split(' ').map((w, i) => (i > 0 && small.has(w.toLowerCase()) ? w.toLowerCase() : w)).join(' ');
      return uniq(rowHeaders(t).map((a) => ({ ...a, label: fix(a.label) }))).slice(0, 100);
    },
    outside() {
      const t = tables('List of Spotify streaming records')[4];
      return rowHeaders(t);
    },
  },
  'best-selling-albums': {
    pages: ['List of best-selling albums'],
    year: 2026,
    answers() {
      const ts = tables('List of best-selling albums').filter((t) => t.rows.length > 5 && t.rows.some((r) => r.length >= 5));
      const out = [];
      for (const t of ts.slice(0, 3)) {
        for (const r of t.rows) {
          // Artist then album; a rowspan on the artist leaves the album first.
          const cells = r.filter((c) => !c.header || firstLink(c.raw));
          const albumCell = cells.find((c) => /''\[\[/.test(c.raw));
          if (albumCell) out.push(entry(firstLink(albumCell.raw)));
        }
      }
      return uniq(out.filter(Boolean));
    },
  },
  'world-cup-nations': {
    pages: ['National team appearances in the FIFA World Cup'],
    year: 2026,
    answers() {
      const t = tables('National team appearances in the FIFA World Cup')[0];
      return t.rows.map((r) => {
        const code = (r[0].raw.match(/\{\{fb\|([A-Z]{3})/) || [])[1];
        if (!FIFA[code]) throw new Error('Unknown FIFA code ' + code);
        const [label, ...aliases] = FIFA[code].split('|');
        // Fame comes from the country's own article.
        const title = { 'DR Congo': 'Democratic Republic of the Congo', Curacao: 'Curaçao' }[label] || label;
        return { label, title, aliases };
      });
    },
  },
  'grand-slam-champions': {
    pages: ["List of Grand Slam men's singles champions", "List of Grand Slam women's singles champions"],
    year: 2026,
    answers() {
      const out = [];
      for (const [title, from] of [["List of Grand Slam men's singles champions", 'Men'], ["List of Grand Slam women's singles champions", 'Women']]) {
        const t = tables(title)[1];
        for (const r of t.rows) for (const c of r.slice(1)) {
          const l = firstLink(c.raw.replace(/\{\{#invoke:flag[^}]*\}\}/g, ''));
          if (l && !/^\d{4}|Open|Championships|Wimbledon/.test(l.title)) out.push(entry(l, { from }));
        }
      }
      return uniq(out);
    },
  },
  'f1-winners': {
    pages: ['List of Formula One Grand Prix winners'],
    year: 2026,
    answers() {
      const t = tables('List of Formula One Grand Prix winners')[1];
      return t.rows.map((r) => entry(firstLink((r.find((c) => c.header) || r[2]).raw))).filter(Boolean);
    },
  },
  'football-clubs': {
    pages: ['2025–26 Premier League', '2025–26 La Liga', '2025–26 Serie A', '2025–26 Bundesliga', '2025–26 Ligue 1'],
    year: 2026,
    answers() {
      return [['2025–26 Premier League', 'Premier League'], ['2025–26 La Liga', 'La Liga'], ['2025–26 Serie A', 'Serie A'], ['2025–26 Bundesliga', 'Bundesliga'], ['2025–26 Ligue 1', 'Ligue 1']]
        .flatMap(([t, from]) => leagueClubs(t).map((a) => ({ ...a, from })));
    },
  },
  'world-cities': {
    pages: ['List of largest cities'],
    year: 2025,
    answers() {
      return rowHeaders(tables('List of largest cities')[0]).filter((a) => a.label !== 'Definition');
    },
  },
  'us-cities': {
    pages: ['List of United States cities by population'],
    year: 2025,
    answers() {
      return usCities().slice(0, 100);
    },
    outside() {
      return usCities().slice(100);
    },
  },
  'uk-cities': {
    pages: ['List of cities in the United Kingdom'],
    year: 2026,
    answers() {
      return uniq(column(tables('List of cities in the United Kingdom')[0], 0));
    },
  },
  'fast-food': {
    pages: ['List of fast food restaurant chains'],
    year: 2026,
    answers() {
      const text = stripRefs(page('List of fast food restaurant chains'));
      return uniq(text.slice(0, text.search(/==\s*(See also|Parent companies)/)).split('\n').filter((l) => /^\*\s*\[\[/.test(l)).map((l) => entry(firstLink(l))).filter(Boolean));
    },
  },
  'dog-breeds': {
    pages: ['List of dog breeds'],
    year: 2026,
    answers() {
      const text = stripRefs(page('List of dog breeds'));
      const body = text.slice(text.indexOf('== Extant'), text.indexOf('== Extinct'));
      return uniq(body.split('\n').filter((l) => /^\*\s*\[\[/.test(l)).map((l) => entry(firstLink(l))).filter(Boolean));
    },
  },
};
