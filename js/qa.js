// QA page: browse every prompt, its answers and the build's flags.
import { MILESTONES, formatMetres } from './scoring.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids.filter((k) => k !== null && k !== undefined));
  return n;
};

const [data, report] = await Promise.all([
  fetch('data/prompts.json').then((r) => r.json()),
  fetch('data/qa-report.json').then((r) => r.json()),
]);
const flags = new Map(report.prompts.map((p) => [p.id, p]));

const total = data.prompts.reduce((s, p) => s + p.size, 0);
$('qa-summary').textContent = `${data.prompts.length} prompts in ${Object.keys(data.categories).length} categories, ${total.toLocaleString('en-GB')} answers. Built ${data.built}.`;
$('qa-errors').replaceChildren(...report.errors.map((e) => el('li', { textContent: e, className: 'qa-error' })));

for (const [id, name] of Object.entries(data.categories)) {
  const n = data.prompts.filter((p) => p.category === id).length;
  $('qa-category').append(el('option', { value: id, textContent: `${name} (${n})` }));
}

function sample(list, n) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function flagCount(f) {
  return f.collisions.length + f.suspicious.length + f.log.filter((l) => !l.startsWith('override added')).length +
    (f.sourceCheck ? f.sourceCheck.wikidataOnly.length + f.sourceCheck.curatedOnly.length : 0);
}

function listBlock(title, items, cls = '') {
  if (!items.length) return null;
  return el('div', { className: 'qa-block ' + cls }, el('h4', { textContent: `${title} (${items.length})` }),
    el('ul', {}, ...items.map((t) => el('li', { textContent: t }))));
}

function renderPrompt(p) {
  const f = flags.get(p.id);
  const randomList = el('ul', { className: 'qa-sample' });
  const reroll = () => randomList.replaceChildren(...sample(p.answers, 15).map((a) =>
    el('li', {}, el('strong', { textContent: a.label }), a.aliases.length ? el('span', { textContent: ' ' + a.aliases.join(', ') }) : null)));
  reroll();

  const meta = el('dl', { className: 'qa-meta' },
    el('dt', { textContent: 'Size' }), el('dd', { textContent: `${p.size}${p.finite ? ' (closed set, count shown)' : ' (open set)'}` }),
    el('dt', { textContent: 'Target' }), el('dd', { textContent: String(p.target) }),
    el('dt', { textContent: 'Difficulty' }), el('dd', { textContent: String(p.difficulty) }),
    el('dt', { textContent: 'Source' }), el('dd', { textContent: p.source }),
    p.note ? el('dt', { textContent: 'Note' }) : null, p.note ? el('dd', { textContent: p.note }) : null);

  const all = el('details', { className: 'qa-all' }, el('summary', { textContent: `All ${p.size} answers` }),
    el('ol', {}, ...p.answers.map((a) => el('li', { textContent: a.label + (a.aliases.length ? ' | ' + a.aliases.join(' | ') : '') }))));

  const source = f.sourceCheck ? [
    ...f.sourceCheck.wikidataOnly.map((x) => `On Wikidata, not in the game: ${x}`),
    ...f.sourceCheck.curatedOnly.map((x) => `In the game, not matched on Wikidata: ${x}`),
  ] : [];

  const n = flagCount(f);
  return el('details', { className: 'qa-prompt', id: 'p-' + p.id, dataset: { category: p.category, flagged: n ? '1' : '' } },
    el('summary', {},
      el('span', { className: 'qa-name', textContent: p.text }),
      el('span', { className: 'qa-tag', textContent: data.categories[p.category] }),
      el('span', { className: 'qa-tag', textContent: `${p.size} answers` }),
      n ? el('span', { className: 'qa-tag qa-tag-flag', textContent: `${n} to check` }) : null),
    el('div', { className: 'qa-body' },
      meta,
      el('p', {}, el('a', { href: `index.html#test-${p.id}`, textContent: 'Play this prompt' }), ' ',
        el('button', { type: 'button', textContent: 'Another 15', onclick: reroll })),
      el('h4', { textContent: '15 random answers' }), randomList,
      listBlock('Shared aliases (the next unfound answer is given)', f.collisions.map((c) => `"${c.alias}": ${c.answers.join(', ')}`), 'qa-warn'),
      listBlock('Suspicious entries', f.suspicious, 'qa-warn'),
      listBlock('Source check against Wikidata', source, 'qa-warn'),
      listBlock('Build log', f.log),
      listBlock(`One typo apart (typo fixing stands aside for these${f.nearCount > f.near.length ? `, first ${f.near.length} of ${f.nearCount}` : ''})`, f.near),
      all));
}

const items = data.prompts.map(renderPrompt);
$('qa-list').replaceChildren(...items);

function filter() {
  const q = $('qa-search').value.trim().toLowerCase();
  const cat = $('qa-category').value;
  const flagged = $('qa-flagged').checked;
  data.prompts.forEach((p, i) => {
    const hit = !q || p.text.toLowerCase().includes(q) || p.answers.some((a) => a.label.toLowerCase().includes(q));
    items[i].hidden = !hit || (cat && p.category !== cat) || (flagged && !items[i].dataset.flagged);
  });
}
for (const id of ['qa-search', 'qa-category', 'qa-flagged']) $(id).addEventListener('input', filter);

$('qa-heights').tBodies[0].replaceChildren(...MILESTONES.map((m) => el('tr', {},
  el('td', { textContent: m.name }), el('td', { textContent: formatMetres(m.height) }),
  el('td', { textContent: m.wikidata === null ? '' : `${m.wikidata} m${Math.round(m.wikidata) !== m.height ? ' (differs)' : ''}` }))));

if (location.hash) document.querySelector(location.hash)?.setAttribute('open', '');
