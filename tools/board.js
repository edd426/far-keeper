#!/usr/bin/env node
// board.js -- read-only. For each note in messages/open/, say who spoke last
// without opening it. Reads headings and signature lines only; judges nothing
// about the content. A note is a set of "## " sections. Sections after
// "Acceptance criteria" with a non-blank body are candidate replies; who wrote
// one is its "-- Name" signature line (see author() below), the heading word
// only a fallback. Exit 0; 2 on a bad flag or a missing board.
'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'messages', 'open');
if (process.argv.length > 2) { console.error('usage: node tools/board.js'); process.exit(2); }
if (!fs.existsSync(dir)) { console.error('no messages/open/'); process.exit(2); }

// Who wrote a section is its signature line ("— Name", alone on a line, not
// in a blockquote), never its heading word. No signature: fall back on the
// heading ("Founder" means the founder). Evan's sections that come before any
// house reply are the ask carried on past "Acceptance criteria", not replies.
function author(s) {
  if (s.sig) return /^(evan|founder)$/i.test(s.sig) ? 'founder' : 'house';
  return /founder/i.test(s.head) ? 'founder' : 'house';
}

function read(file) {
  const lines = fs.readFileSync(path.join(dir, file), 'utf8').split('\n');
  const secs = []; let cur = null; const meta = {};
  for (const l of lines) {
    const m = /^\*\*(Opened|Priority|Kind):\*\*\s*(.+)$/.exec(l);
    if (m && !cur) meta[m[1].toLowerCase()] = m[2].trim();
    const h = /^## (.+)$/.exec(l);
    if (h) { cur = { head: h[1].trim(), body: 0, sig: null }; secs.push(cur); continue; }
    if (!cur) continue;
    const g = /^— ([A-Z][\w'-]*)\s*$/.exec(l);
    if (g) cur.sig = g[1];
    if (l.trim() && !/^<.*>$/.test(l.trim())) cur.body++;
  }
  const ac = secs.findIndex((s) => /^Acceptance criteria/i.test(s.head));
  const after = (ac < 0 ? [] : secs.slice(ac + 1)).filter((s) => s.body > 0);
  let houseSeen = false;
  const replies = [];
  for (const s of after) {
    const a = author(s);
    if (a === 'house') houseSeen = true;
    if (a === 'house' || houseSeen) replies.push({ s, a });
  }
  const last = replies[replies.length - 1];
  const state = !last ? 'UNANSWERED' : last.a === 'founder' ? 'FOUNDER LAST' : 'HOUSE LAST';
  return { file, meta, state, last: last ? last.s.head : '-', n: replies.length };
}

const rows = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map(read);
if (!rows.length) console.log('board empty');
for (const r of rows) {
  console.log(`${r.state.padEnd(12)} ${(r.meta.kind || '?').padEnd(13)} ${(r.meta.opened || '?')}  ${r.n} repl  last: ${r.last.slice(0, 40)}  ${r.file}`);
}
