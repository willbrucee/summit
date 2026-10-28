// The answer board: what you found, what got away, grouped and ranked by fame.
// Fame is the number of Wikipedia language editions an answer has (Wikidata sitelinks).

const SMALL_SET = 80;
const PAGE = 40;
const TAB_SIZE = 24;
const ROUND_MS = 30000;

const h = (tag, props = {}, ...kids) => {
  const { dataset, ...rest } = props;
  const n = Object.assign(document.createElement(tag), rest);
  if (dataset) Object.assign(n.dataset, dataset);
  n.append(...kids.filter((k) => k !== null && k !== undefined && k !== false));
  return n;
};

function ring(found, total) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const share = total ? Math.min(1, found / total) : 0;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('class', 'board-ring');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--paper-2)" stroke-width="9"/>
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--glacier)" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${(share * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 32 32)"/>
    <circle cx="32" cy="32" r="${r + 5}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>
    <circle cx="32" cy="32" r="${r - 5}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>`;
  return svg;
}

function timeline(times) {
  if (!times || !times.length) return null;
  const bar = h('div', { className: 'board-timeline', role: 'img', ariaLabel: `Answers found over the 30 seconds: ${times.length}` });
  for (let s = 0; s <= 30; s += 10) bar.append(h('span', { className: 'tl-tick', textContent: `${s}s`, style: `left:${(s / 30) * 100}%` }));
  for (const t of times) bar.append(h('i', { className: 'tl-dot', style: `left:${Math.min(100, (t / ROUND_MS) * 100).toFixed(2)}%` }));
  return bar;
}

export function renderBoard(root, prompt, round, { title } = {}) {
  const found = new Set(round.found);
  const answers = prompt.answers;
  const total = answers.length;
  const missed = answers.filter((a) => !found.has(a.id));
  const byFame = missed.filter((a) => typeof a.fame === 'number').sort((a, b) => b.fame - a.fame || a.label.localeCompare(b.label));
  const note = h('p', { className: 'board-hint', textContent: 'Tap any answer to learn what it is.' });

  const tile = (a) => {
    const isFound = found.has(a.id);
    const b = h('button', { type: 'button', className: `tile ${isFound ? 'is-found' : 'is-missed'}`, ariaExpanded: 'false' }, h('span', { className: 'tile-name', textContent: a.label }));
    b.addEventListener('click', () => {
      const open = b.classList.contains('is-open');
      for (const t of root.querySelectorAll('.tile.is-open')) { t.classList.remove('is-open'); t.setAttribute('aria-expanded', 'false'); t.querySelector('.tile-desc')?.remove(); }
      if (open) return;
      b.classList.add('is-open');
      b.setAttribute('aria-expanded', 'true');
      const what = a.desc ? a.desc.charAt(0).toUpperCase() + a.desc.slice(1) : 'No note for this one yet';
      b.append(h('span', { className: 'tile-desc', textContent: `${isFound ? 'You got this one. ' : ''}${what}.` }));
    });
    return b;
  };
  const grid = (list) => h('div', { className: 'tile-grid' }, ...list.map(tile));

  const views = {
    all() {
      const out = [];
      const groups = prompt.groups && prompt.groups.length ? prompt.groups : ['All'];
      const inGroup = (g) => answers.filter((a) => (a.group || 'All') === g);
      if (total <= SMALL_SET) {
        for (const g of groups) {
          const list = inGroup(g).sort((a, b) => a.label.localeCompare(b.label));
          if (!list.length) continue;
          const n = list.filter((a) => found.has(a.id)).length;
          out.push(h('section', { className: 'board-group' }, h('h3', {}, g, h('span', { textContent: `found ${n} of ${list.length}` })), grid(list)));
        }
        return out;
      }
      // Big sets: counts per group, then what you found and the best-known misses.
      out.push(h('ul', { className: 'group-bars' }, ...groups.map((g) => {
        const list = inGroup(g);
        const n = list.filter((a) => found.has(a.id)).length;
        return h('li', {}, h('span', { className: 'gb-name', textContent: g }), h('span', { className: 'gb-bar' }, h('i', { style: `width:${list.length ? (100 * n) / list.length : 0}%` })), h('span', { className: 'gb-count', textContent: `${n} of ${list.length}` }));
      })));
      const mine = answers.filter((a) => found.has(a.id));
      if (mine.length) out.push(h('section', { className: 'board-group' }, h('h3', {}, 'You found', h('span', { textContent: String(mine.length) })), grid(mine)));
      const rest = [...byFame, ...missed.filter((a) => typeof a.fame !== 'number')];
      let shown = PAGE;
      const g = grid(rest.slice(0, shown));
      const more = h('button', { type: 'button', className: 'btn btn-quiet', textContent: 'Show more' });
      more.hidden = rest.length <= shown;
      more.addEventListener('click', () => {
        const next = rest.slice(shown, shown + PAGE);
        shown += PAGE;
        g.append(...next.map(tile));
        more.hidden = rest.length <= shown;
      });
      out.push(h('section', { className: 'board-group' }, h('h3', {}, 'The ones that got away', h('span', { textContent: 'best known first' })), g, more));
      return out;
    },
    easy() {
      const list = byFame.slice(0, TAB_SIZE);
      return list.length ? [h('p', { className: 'board-hint', textContent: 'The best-known answers you missed.' }), grid(list)] : [h('p', { className: 'board-hint', textContent: 'You found every well-known one.' })];
    },
    deep() {
      const list = byFame.slice(-TAB_SIZE).reverse();
      return list.length ? [h('p', { className: 'board-hint', textContent: 'The least-known answers on the list. Nobody expects these.' }), grid(list)] : [h('p', { className: 'board-hint', textContent: 'No deep cuts left.' })];
    },
  };

  const body = h('div', { className: 'board-body' });
  const tabs = h('div', { className: 'board-tabs', role: 'tablist', ariaLabel: 'Show answers' });
  const names = [['all', 'All'], ['easy', 'Easy ones you missed'], ['deep', 'Deep cuts']];
  const show = (key) => {
    for (const b of tabs.children) b.setAttribute('aria-selected', String(b.dataset.key === key));
    body.replaceChildren(...views[key]());
  };
  for (const [key, label] of names) {
    const b = h('button', { type: 'button', role: 'tab', className: 'board-tab', textContent: label, dataset: { key } });
    b.addEventListener('click', () => show(key));
    tabs.append(b);
  }

  const n = found.size;
  const head = h('div', { className: 'board-head' }, ring(n, total),
    h('div', {}, h('p', { className: 'board-score', textContent: prompt.finite ? `You found ${n} of ${total}` : `You found ${n}` }),
      h('p', { className: 'board-sub', textContent: prompt.finite ? (title || prompt.text) : `${title || prompt.text}. ${total} on our list.` })));
  root.replaceChildren(head, timeline(round.times) || '', tabs, note, body);
  show('all');
}

// The summit screen: one tab per round, each with its own board.
export function renderRounds(root, prompts, rounds) {
  const tabs = h('div', { className: 'board-tabs round-tabs', role: 'tablist', ariaLabel: 'Rounds' });
  const holder = h('div', { className: 'board' });
  const show = (i) => {
    for (const b of tabs.children) b.setAttribute('aria-selected', String(Number(b.dataset.i) === i));
    renderBoard(holder, prompts[i], rounds[i]);
  };
  prompts.forEach((p, i) => {
    const b = h('button', { type: 'button', role: 'tab', className: 'board-tab', textContent: `Round ${i + 1}`, dataset: { i: String(i) } });
    b.addEventListener('click', () => show(i));
    tabs.append(b);
  });
  root.replaceChildren(tabs, holder);
  show(0);
}
