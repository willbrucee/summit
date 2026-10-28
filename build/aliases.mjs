// Alias rules. Every alias carries its source:
//   c  curated list (build/curated), v  spelling or number variant of a curated name,
//   a  data/aliases.json,  w  Wikidata (English alias or short name P1813),  g  generated shortening.
// Only curated names may be shared by two answers (two presidents called Adams).
// Any other alias that could mean two answers in one prompt is dropped and flagged.
import { toKey } from '../js/matcher.js';

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15 };
const SPELLINGS = [['colour', 'color'], ['grey', 'gray'], ['centre', 'center'], ['theatre', 'theater'], ['harbour', 'harbor'], ['armour', 'armor']];
const STOP_END = new Set(['of', 'the', 'and', 'a', 'an', 'in', 'on', 'for', 'to', 'with', 'at', 'by', 'from', 'vs', 'vs.', 'or', '&']);

// Short words that must never be produced as an initialism.
export const COMMON_WORDS = new Set(('a an as at be by do go he if in is it me my no of oh ok on or so to up us we am ah ' +
  'and are art bad bag bat bed big bit box boy bus but can cap car cat cow cry cup cut day did dog dry ear eat egg end eye fan ' +
  'far fat few fig fit fly for fox fun gap gas get god got gun guy had has hat her hey him hip his hit hot how ice ill ink its ' +
  'jam jar jet job joy key kid kit lab lap law lay leg let lid lie lip lit log lot low mad man map mat may men mix mob mom mud ' +
  'mug nap net new nor not now nut oak odd off oil old one our out owl own pan pat paw pay pen pet pie pig pin pit pop pot put ' +
  'ran rap rat raw red rid rim rip rob rod row rub rug run sad sat saw say sea see set sew she shy sin sip sir sit six sky sly ' +
  'son spy sun tab tag tan tap tar tax tea ten the tie tin tip toe ton too top toy try tub two use van vet via war was wax way ' +
  'web wet who why win wit won yes yet you zip zoo also back ball band bank base bath bear beat bell best bike bird blue boat ' +
  'body bone book boot born both bowl burn bush busy cake call calm came camp card care cart case cash cast cave chip city clay ' +
  'club coat code cold come cook cool cope copy core cost crew crop dark data date dawn days dead deal dear deep deer desk dial ' +
  'dice died diet dish does done door down draw drop drum duck dust duty each earn ease east easy edge else even ever exit face ' +
  'fact fail fair fall farm fast fear feed feel feet fell felt file fill film find fine fire firm fish five flag flat flow folk ' +
  'food foot form fort four free from fuel full fund gain game gate gave gear gift girl give glad goal goes gold golf gone good ' +
  'grab gray grew grey grow hair half hall hand hang hard harm hate have head hear heat held hell help here hero hide high hill ' +
  'hire hold hole holy home hope horn host hour huge hung hunt hurt idea inch into iron item jail join joke jump jury just keen ' +
  'keep kept kick kill kind king knee knew know lack lady laid lake lamp land lane last late lead leaf left lend less life lift ' +
  'like line link list live load loan lock long look lord lose loss lost loud love luck made mail main make male mall many mark ' +
  'mass meal mean meat meet menu mere mile milk mind mine miss mode mood moon more most move much must name navy near neck need ' +
  'news next nice nine none nose note once only onto open oven over pace pack page paid pain pair pale palm park part pass past ' +
  'path peak pick pile pine pink pipe plan play plot plus poem poet pole poll pool poor port pose post pour pull pure push race ' +
  'rail rain rank rare rate read real rear rely rent rest rice rich ride ring rise risk road rock role roll roof room root rope ' +
  'rose rule rush safe said sail sale salt same sand save seal seat seed seek seem seen self sell send sent ship shoe shop shot ' +
  'show shut sick side sign silk sing sink site size skin slip slow snow soft soil sold sole some song soon sort soul spot star ' +
  'stay step stop such suit sure swim tail take tale talk tall tank tape task team tear tell tend term test text than that them ' +
  'then they thin this thus tide tile till time tiny tone took tool tour town tree trip true tube tune turn twin type unit upon ' +
  'used user vary vast very view vote wage wait wake walk wall want warm wash wave weak wear week well went were west what when ' +
  'whom wide wife wild will wind wine wing wire wise wish with wolf wood word wore work yard yeah year your zero zone').split(' '));


// Spelling, Roman numeral and number-word variants of a curated name.
export function variants(text) {
  const out = new Set();
  const words = text.split(' ');
  const roman = (w, i) => (i > 0 && words[i - 1] !== 'Series' ? ROMAN[w.replace(/[,.:]$/, '')] : undefined);
  if (words.some(roman)) out.add(words.map((w, i) => (roman(w, i) ? String(roman(w, i)) : w)).join(' '));
  const lower = text.toLowerCase();
  for (const [a, b] of SPELLINGS) {
    if (lower.includes(a)) out.add(lower.replaceAll(a, b));
    if (lower.includes(b)) out.add(lower.replaceAll(b, a));
  }
  // Number words and digits, both ways: Rainbow Six and Rainbow 6.
  const lw = words.map((w) => w.toLowerCase().replace(/[,.:]$/, ''));
  if (lw.some((w) => NUMBER_WORDS.includes(w) && w !== 'one' && w !== 'zero')) {
    out.add(words.map((w, i) => (NUMBER_WORDS.includes(lw[i]) && lw[i] !== 'one' && lw[i] !== 'zero' ? String(NUMBER_WORDS.indexOf(lw[i])) : w)).join(' '));
  }
  if (words.some((w) => /^\d{1,2}$/.test(w) && Number(w) >= 2 && Number(w) <= 20)) {
    out.add(words.map((w) => (/^\d{1,2}$/.test(w) && Number(w) >= 2 && Number(w) <= 20 ? NUMBER_WORDS[Number(w)] : w)).join(' '));
  }
  if (/: /.test(text)) out.add(text.split(': ').slice(1).join(': '));
  // One more pass so Roman numerals also reach the number word: V -> 5 -> five.
  for (const v of [...out]) {
    const vw = v.split(' ');
    if (vw.some((w) => /^\d{1,2}$/.test(w) && Number(w) >= 2 && Number(w) <= 20)) {
      out.add(vw.map((w) => (/^\d{1,2}$/.test(w) && Number(w) >= 2 && Number(w) <= 20 ? NUMBER_WORDS[Number(w)] : w)).join(' '));
    }
  }
  out.delete(text);
  return [...out];
}

// Candidates plus their own variants, keeping the source of the original.
export function expand(extra) {
  return extra.flatMap((e) => [e, ...variants(e.text).map((text) => ({ ...e, text }))]);
}

// Shorter forms of titles: without a leading "Tom Clancy's", and the first words of a long title.
// They are only candidates; acceptAliases keeps them when no other answer could be meant.
export function shortenings(label) {
  const out = new Set();
  const base = label.replace(/^(?:[A-Z][\w.]*\s){0,2}[A-Z][\w.]*['’]s\s+(?=\S)/, '');
  if (base !== label) out.add(base);
  for (const t of new Set([label, base])) {
    const words = t.replace(/[:,].*$/, '').split(' ');
    for (let k = 2; k < words.length; k++) {
      const cand = words.slice(0, k);
      if (STOP_END.has(cand[k - 1].toLowerCase())) continue;
      const s = cand.join(' ');
      if (toKey(s).length >= 6) out.add(s);
    }
  }
  out.delete(label);
  return [...out];
}

// First letters of a multi-word name: Call of Duty -> COD.
export function initialism(label) {
  const words = label.replace(/['’]s\b/g, '').split(/[\s-]+/).filter((w) => /^[A-Za-z]/.test(w));
  if (words.length < 2) return null;
  const strict = words.map((w) => w[0]).join('');
  const sig = words.filter((w) => !STOP_END.has(w.toLowerCase())).map((w) => w[0]).join('');
  const out = [strict.toLowerCase(), sig.toLowerCase()].filter((x) => x.length >= 2 && !COMMON_WORDS.has(x));
  return out.length ? [...new Set(out)] : null;
}

// Letter pairs shared by two keys, from 0 to 1.
function similarity(a, b) {
  const pairs = (s) => { const out = new Map(); for (let i = 0; i < s.length - 1; i++) { const p = s.slice(i, i + 2); out.set(p, (out.get(p) || 0) + 1); } return out; };
  const pa = pairs(a);
  const pb = pairs(b);
  let common = 0;
  for (const [p, n] of pa) common += Math.min(n, pb.get(p) || 0);
  return (2 * common) / Math.max(1, a.length - 1 + b.length - 1);
}

// Only plain letters and the accents found in Western European names.
const PLAIN = /^[A-Za-z0-9\u00C0-\u00FF\s'’.&+:!?\-/]+$/;

// Is this Wikidata alias worth offering? Junk, codes, pen names, other scripts and catalogue
// notes are filtered out. An alias must look like the name, contain it, or be its initialism.
export function goodWikidataAlias(alias, label, allowShort) {
  const s = alias.trim();
  const k = toKey(s);
  const lk = toKey(label);
  if (!k || k === lk) return false;
  if (!PLAIN.test(s) || s.length > 50 || /[(),;[\]{}"]/.test(s)) return false;
  if (/\b(kopie|copy|after|naar|nach|workshop|attributed|circle of|school of)\b/i.test(s)) return false;
  if (/\d/.test(s) && !/\d/.test(label)) return false;
  if (s.split(/\s+/).length > label.split(/\s+/).length + 2) return false;
  const ini = initialism(label) || [];
  if (!(k.includes(lk) || lk.includes(k) || ini.includes(k) || similarity(k, lk) >= 0.45)) return false;
  if (/^\d+$/.test(k) || /^q\d+$/i.test(s)) return false;
  if (k.length <= 3 && !allowShort) return false; // ISO-style codes would make some prompts trivial
  if (k.length <= 2 && !/[A-Z]/.test(s)) return false;
  if (k.length <= 4 && COMMON_WORDS.has(k)) return false;
  return true;
}

// answers: [{ label, aliases: [{ text, src }] }] with curated (c, v) aliases already in place.
// extra: [{ answer: i, text, src }] candidates from aliases.json, Wikidata and generation.
// Returns { answers, dropped: [{ text, src, answers: [labels] }] }.
export function acceptAliases(answers, extra) {
  const owners = new Map();
  const own = (key, i) => { if (!owners.has(key)) owners.set(key, new Set()); owners.get(key).add(i); };
  answers.forEach((a, i) => { own(toKey(a.label), i); a.aliases.forEach((x) => own(toKey(x.text), i)); });
  // Count every candidate first, so two answers offering the same alias both lose it.
  const want = new Map();
  for (const e of extra) {
    const k = toKey(e.text);
    if (!k) continue;
    if (!want.has(k)) want.set(k, new Set());
    want.get(k).add(e.answer);
  }
  const dropped = [];
  const seenDrop = new Set();
  for (const e of extra) {
    const k = toKey(e.text);
    if (!k) continue;
    const all = new Set([...(owners.get(k) || []), ...want.get(k)]);
    // A shortening must not be the start of another answer either: "Super Mario" could be many games.
    if (e.src === 'g' && [...owners.keys()].some((other) => other !== k && other.startsWith(k) && [...owners.get(other)].some((i) => i !== e.answer))) continue;
    if (e.src === 'g' && all.size > 1) continue;
    if (all.size > 1) {
      if (!seenDrop.has(k + e.src)) {
        seenDrop.add(k + e.src);
        dropped.push({ text: e.text, src: e.src, answers: [...all].map((i) => answers[i].label) });
      }
      continue;
    }
    const a = answers[e.answer];
    if (toKey(a.label) === k || a.aliases.some((x) => toKey(x.text) === k)) continue;
    a.aliases.push({ text: e.text, src: e.src });
    own(k, e.answer);
  }
  return { answers, dropped };
}
