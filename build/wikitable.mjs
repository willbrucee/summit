// A small reader for wikitext: tables, rows, cells and the links inside them, plus bullet lists.
// Enough for Wikipedia's ranked list pages; not a full wikitext parser.

// Split on a separator only where it is not inside [[ ]] or {{ }}.
function splitTop(s, sep) {
  const out = [];
  let depthL = 0;
  let depthT = 0;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s.startsWith('[[', i)) { depthL++; cur += '[['; i++; continue; }
    if (s.startsWith(']]', i)) { depthL = Math.max(0, depthL - 1); cur += ']]'; i++; continue; }
    if (s.startsWith('{{', i)) { depthT++; cur += '{{'; i++; continue; }
    if (s.startsWith('}}', i)) { depthT = Math.max(0, depthT - 1); cur += '}}'; i++; continue; }
    if (!depthL && !depthT && s.startsWith(sep, i)) { out.push(cur); cur = ''; i += sep.length - 1; continue; }
    cur += s[i];
  }
  out.push(cur);
  return out;
}

// Remove a leading attribute block: 'style="x" | content' -> 'content'.
function cellContent(raw) {
  const parts = splitTop(raw, '|');
  // Also catches a broken style with no attribute name, like 'border-left:2px solid grey" | 58'.
  const attrs = /=|^\s*(scope|style|rowspan|colspan|class|align|data-sort-value)|^\s*[\w-]+:[^|]*"\s*$/i;
  if (parts.length > 1 && attrs.test(parts[0]) && !/\[\[|\{\{/.test(parts[0])) return parts.slice(1).join('|');
  return raw;
}

export function stripRefs(s) {
  return s.replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '').replace(/<!--[\s\S]*?-->/g, '');
}

// Tables: [{ caption, headers: [text], rows: [[{ raw, header }]] }]
export function parseTables(text) {
  const src = stripRefs(text);
  const tables = [];
  const re = /^\{\|.*$/gm;
  let m;
  while ((m = re.exec(src))) {
    // Find the matching |} allowing nested tables.
    let depth = 0;
    let end = m.index;
    const lines = src.slice(m.index).split('\n');
    let len = 0;
    for (const line of lines) {
      len += line.length + 1;
      if (/^\s*\{\|/.test(line)) depth++;
      if (/^\s*\|\}/.test(line)) { depth--; if (depth === 0) break; }
    }
    end = m.index + len;
    const body = src.slice(m.index, end);
    re.lastIndex = end;
    const t = { caption: '', headers: [], rows: [], cls: m[0] };
    const rowsRaw = body.split(/\n\|-[^\n]*/);
    rowsRaw.forEach((chunk, ri) => {
      const cells = [];
      for (const line of chunk.split('\n')) {
        if (/^\s*\{\|/.test(line) || /^\s*\|\}/.test(line)) continue;
        if (/^\s*\|\+/.test(line)) { t.caption = line.replace(/^\s*\|\+/, ''); continue; }
        if (/^\s*[!|]/.test(line)) {
          const header = /^\s*!/.test(line);
          const rest = line.replace(/^\s*[!|]/, '');
          for (const c of splitTop(rest, header ? '!!' : '||')) cells.push({ raw: cellContent(c).trim(), header });
        } else if (cells.length) {
          cells[cells.length - 1].raw += '\n' + line;
        }
      }
      if (!cells.length) return;
      if (ri <= 1 && cells.every((c) => c.header)) t.headers = cells.map((c) => plain(c.raw));
      else t.rows.push(cells);
    });
    tables.push(t);
  }
  return tables;
}

// The first proper link in a piece of wikitext: { title, text }.
export function firstLink(raw) {
  const s = raw.replace(/\{\{(?:flagicon|flagdeco|flag icon|nowrap|nobreak|small|sort|dts|ntsh|efn|refn|abbr|anchor)(?=[|}])[^{}]*\}\}/gi, (t) => (/^\{\{(nowrap|nobreak|small|sort)\|/i.test(t) ? t.replace(/^\{\{\w+\|(?:[^|}]*\|)?/, '').replace(/\}\}$/, '') : ''));
  const sortname = s.match(/\{\{sortname\|([^|}]+)\|([^|}]+)(?:\|([^|}]+))?[^}]*\}\}/i);
  const link = s.match(/\[\[(?!File:|Image:|Category:|w:|wikt:)([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/);
  if (sortname && (!link || s.indexOf(sortname[0]) < s.indexOf(link[0]))) {
    const name = `${sortname[1]} ${sortname[2]}`.trim();
    return { title: (sortname[3] || name).trim(), text: name };
  }
  if (!link) return null;
  const title = link[1].replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  return { title, text: plain(link[2] || link[1]).trim() };
}

// Readable text from wikitext.
export function plain(raw) {
  return stripRefs(raw)
    .replace(/\{\{sortname\|([^|}]+)\|([^|}]+)[^}]*\}\}/gi, '$1 $2')
    .replace(/\{\{(?:nowrap|nobreak|small|sort)\|(?:[^|}]*\|)?([^}]*)\}\}/gi, '$1')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/[†‡*§¶]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Bullet lists: the first link on each "* " line.
export function bulletLinks(text) {
  return stripRefs(text).split('\n').filter((l) => /^\*+\s/.test(l)).map((l) => firstLink(l)).filter(Boolean);
}
