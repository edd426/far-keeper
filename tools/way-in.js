#!/usr/bin/env node
// tools/way-in.js — does the reckoning room's way in name every room in it?
//
//   node tools/way-in.js              check the working tree
//   node tools/way-in.js /some/tree   check another copy of the tower
//   node tools/way-in.js --help       this surface, in one line
//
// Day 56. Evan's third ask of 2026-09-23 was the reckoning room made readable:
// twelve sections and a page 27,618 pixels tall on a desktop, and a stranger
// who cannot tell what it is for until far down. The first piece is not a
// reorder. Ash's cut: a new section explaining the page is the page narrating
// itself, so the opening paragraph itself now says what a visitor came for
// and links to where it is — `<p id="way-in">`.
//
// That paragraph is a second hand-kept list of the room's sections, and the
// way it goes wrong is the day a thirteenth section is added and the way in
// is not told. So, Ember's shape and Day 29's before it: two directions.
//
//   1. Every room section is named in the way in exactly once.
//   2. Every link in the way in lands on a room section.
//
// **A room section is a `<section aria-labelledby="X">` whose `<h2 id="X">`
// is inside it** — Ember's narrowing. Not every h2 in the file: that would
// give this tool an opinion about some later h2 that is not a room, the same
// fault as counting the container instead of what the case is about.
//
// It reads the file, not a rendered page, because which sections exist is a
// fact about the file. Whether the pledge section is *showing* is a fact about
// the morning, and `page.js` handles that one by hiding the clause that links
// to it whenever the section is hidden (`matchWayInToPledge`). Comments are
// stripped first: a link inside `<!-- -->` is not a door (Day 45).
//
// Not asked, deliberately: whether a link's words match its heading's words.
// Ember offered it. The way in speaks to a visitor ("today's times") and the
// headings speak as rooms ("today over the city this tower stands in"); they
// differ on purpose, and a check that went red on that would be read past.
//
// Exit: 0 agrees; 1 a section is unnamed, named twice, or a link lands on
// nothing; 2 nothing to check (no way in, or no sections — an empty domain
// always says yes, so it may not say yes here); 3 a bad argument.
'use strict';
const fs = require('fs');
const path = require('path');

function usage() {
  return 'usage: node tools/way-in.js [tower-root]   (--help for this line)';
}

function parseArgs(argv) {
  let root = null;
  for (const a of argv) {
    if (a === '--help' || a === '-h') return { help: true };
    if (a.startsWith('-')) return { error: 'unknown flag ' + a };
    if (root !== null) return { error: 'more than one tower root given' };
    root = a;
  }
  return { root: root || path.join(__dirname, '..') };
}

function check(html) {
  const text = html.replace(/<!--[\s\S]*?-->/g, '');

  const sections = [];
  const secRe = /<section\b[^>]*\baria-labelledby="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
  let m;
  while ((m = secRe.exec(text))) {
    const id = m[1];
    const h2 = new RegExp('<h2\\b[^>]*\\bid="' + id.replace(/[-]/g, '\\-') + '"');
    if (h2.test(m[2])) sections.push(id);
  }

  const wayMatch = text.match(/<p\b[^>]*\bid="way-in"[^>]*>([\s\S]*?)<\/p>/);
  if (!wayMatch) return { hole: 'no way in: there is no <p id="way-in"> to hold the sections against' };
  if (sections.length === 0) return { hole: 'no room sections found, so there is nothing for the way in to name' };

  const links = [];
  const aRe = /<a\b[^>]*\bhref="#([^"]+)"/g;
  while ((m = aRe.exec(wayMatch[1]))) links.push(m[1]);
  if (links.length === 0) return { hole: 'no way in: the paragraph is there and links to nothing' };

  const problems = [];
  for (const id of sections) {
    const n = links.filter((l) => l === id).length;
    if (n === 0) problems.push('UNNAMED  #' + id + ' is a room section and the way in never names it');
    if (n > 1) problems.push('TWICE    #' + id + ' is named ' + n + ' times in the way in');
  }
  for (const l of links) {
    if (!sections.includes(l)) problems.push('NOWHERE  #' + l + ' is linked from the way in and is no room section');
  }
  return { sections, links, problems };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(usage()); return 0; }
  if (args.error) { console.error('way-in: INVALID — ' + args.error); console.error(usage()); return 3; }

  const file = path.join(args.root, 'reckoning', 'index.html');
  let html;
  try { html = fs.readFileSync(file, 'utf8'); } catch (e) {
    console.error('way-in: UNCLEAR — cannot read ' + file + ': ' + e.message);
    return 2;
  }
  const r = check(html);
  if (r.hole) { console.log('way-in: UNCLEAR — ' + r.hole + '.'); return 2; }
  for (const p of r.problems) console.log('way-in: ' + p);
  if (r.problems.length) {
    console.log('way-in: DISAGREES — ' + r.problems.length + ' problem(s) across ' +
      r.sections.length + ' room sections and ' + r.links.length + ' links.');
    return 1;
  }
  console.log('way-in: AGREES — all ' + r.sections.length + ' room sections are named once, ' +
    'and all ' + r.links.length + ' links land on one.');
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { check };
