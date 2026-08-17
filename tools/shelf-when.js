#!/usr/bin/env node

// shelf-when — does each row on the letters page say the same *when* as the
// letter it points at?
//
// Built Day 14, after a morning read turned up a thing nobody here had ever
// checked. `letters/letters.js` holds the shelf as a hand-kept array, and each
// row carries a date the page prints beside the letter's own line. Three tools
// already read that file. None of them had ever read that field.
//
// `post-status.js` looks at each *letter* and checks the `**Left in the box:**`
// line in its head against its *filename*. That is a real check and it holds.
// But it is a different pair of things: the letter against itself. The row is
// where a reader actually meets the letter, and the row was the one part of
// the arrangement with nothing pointed at it. Forge `date: "1999-01-01"` into
// a row in a scratch copy of the tower and every tool in the house reports
// clean, exit 0. That was demonstrated before this file was written.
//
// So this tool joins the third pair: the row against the letter. It reads the
// shelf through `post-status.js`'s own evaluator rather than a second one of
// its own — one idea of what the shelf is, because two would be the Day 9
// fault rebuilt in a new file — and then opens each letter and compares.
//
// It needs no network, no browser and no git. That last is deliberate. The
// witness for a row's date is the letter itself, which is in the tree; asking
// git when a row was committed would drag the shallow-clone floor back into a
// room that is clean of it (Day 8), and a commit date is an unauthenticated
// field besides.
//
// Exit codes: 0 the shelf and the letters agree; 1 they disagree; 2 the tool
// could not do its job (bad argument, unreadable shelf). 1 means *disagreement*
// and nothing else, the same way it does in `shelf-agrees.js` — a mistyped flag
// must never spend it.

const fs = require('node:fs');
const path = require('node:path');

const { loadShelf } = require('./post-status.js');

const USAGE = 'usage: node tools/shelf-when.js [--letters <dir>]';

// Day 13's rule, applied from the first line rather than bolted on later: walk
// argv token by token and refuse what is not recognised. A tool that answers a
// question nobody asked is legible to nobody.
function parseArgs(argv) {
  let letters = null;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--help' || token === '-h') {
      help = true;
      continue;
    }

    if (token === '--letters') {
      if (letters !== null) return { error: '--letters was given twice; one shelf to a run' };
      const value = argv[index + 1];
      if (value === undefined) return { error: '--letters needs a directory after it' };
      letters = value;
      index += 1;
      continue;
    }

    if (token.startsWith('--letters=')) {
      return { error: '--letters takes its directory as the next word, not after an equals sign' };
    }

    return { error: `${JSON.stringify(token)} is not an argument this tool knows` };
  }

  if (help) return { help: true };
  return { letters: letters ?? path.join(process.cwd(), 'letters') };
}

// A regex knows the shape of a date, not the calendar (Day 10). `2026-02-30`
// matches /^\d{4}-\d{2}-\d{2}$/ and JS rolls it over into March rather than
// refusing, so the only honest test is to build the date and check that every
// component survived the round trip.
function isCalendarDate(text) {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [year, month, day] = text.split('-').map(Number);
  const built = new Date(Date.UTC(year, month - 1, day));
  return built.getUTCFullYear() === year
    && built.getUTCMonth() === month - 1
    && built.getUTCDate() === day;
}

// --- The two verdicts, kept apart -----------------------------------------
// A row can lie about `left` or about `shelved`, and the two lies are not the
// same lie. The forgery that prompted this tool — a row dated to a day its
// letter never claimed — is caught only by the head check; the crossing bound
// waves it straight through, because a `shelved` of 2026-08-15 clears
// `1999-01-01 + 3` trivially. Ember demonstrated that against this tool's own
// first draft, and it is the reason the two checks are reported separately and
// never folded into one pass. Day 11's rule: a check that has only ever fired
// for one cause will explain the next cause as that cause.

const DAY_ONE = '2026-08-04';

// Charter, Article X: "A letter left on day D is carried by an automated post
// and waits in the other box on the third morning, D+3." So an incoming letter
// cannot have reached this shelf before D+3 — a row claiming otherwise is not
// merely wrong, it is impossible. This is a floor and only a floor: it says
// nothing about a row shelved far too late, and it is not offered as though it
// did. What makes it worth having anyway is that its witness is the charter —
// dated, locked, and in this tree — rather than a commit date, which is an
// unauthenticated field reached through a clone that has already lied to us
// once about its own floor (Day 8).
const CROSSING_DAYS = 3;

function daysBetween(from, to) {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
}

function towerDay(date) {
  return Math.max(0, daysBetween(DAY_ONE, date) + 1);
}

// The letter's own account of when it was left. This reads the same header
// block `post-status.js` reads, and deliberately reads it the same way: the
// unbroken run of **Label:** lines under the title, so that prose quoting a
// header line further down cannot be mistaken for one.
function letterLeftOn(lettersRoot, relative) {
  const full = path.join(lettersRoot, relative);
  if (!fs.existsSync(full)) return { error: 'the row points at a letter that is not there' };

  const text = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');

  let index = 1;
  while (index < lines.length && lines[index].trim() === '') index += 1;
  const block = [];
  while (index < lines.length && /^\*\*[^*]+:\*\*/.test(lines[index])) block.push(lines[index++]);

  const hits = block
    .filter((line) => line.startsWith('**Left in the box:**'))
    .map((line) => line.slice('**Left in the box:**'.length).trim())
    .filter(Boolean);

  if (hits.length !== 1) {
    return { error: 'its head does not carry exactly one **Left in the box:** line' };
  }
  return { date: hits[0] };
}

function check(lettersRoot) {
  let shelf;
  try {
    shelf = loadShelf(lettersRoot);
  } catch (error) {
    console.error(`shelf-when: INVALID — ${error.message}`);
    return 2;
  }

  if (shelf.length === 0) {
    console.log('shelf-when: the shelf is empty — nothing to hold against anything');
    return 0;
  }

  const complaints = [];

  for (const entry of shelf) {
    const where = entry && typeof entry.path === 'string' ? entry.path : '(a row with no path)';

    if (!entry || typeof entry.path !== 'string') {
      complaints.push([where, 'the row names no letter, so there is nothing to check it against']);
      continue;
    }

    if (!isCalendarDate(entry.left)) {
      complaints.push(['THE LETTER', where, `the row's left ${JSON.stringify(entry.left ?? null)} is not a day of any calendar`]);
      continue;
    }

    if (!isCalendarDate(entry.shelved)) {
      complaints.push(['THE CROSSING', where, `the row's shelved ${JSON.stringify(entry.shelved ?? null)} is not a day of any calendar`]);
      continue;
    }

    const said = letterLeftOn(lettersRoot, entry.path);
    if (said.error) {
      complaints.push(['THE LETTER', where, said.error]);
      continue;
    }

    if (said.date !== entry.left) {
      complaints.push(['THE LETTER', where, `the row says it was left ${entry.left}; the letter says it was left on ${said.date}`]);
      continue;
    }

    // Which box a letter sits in is which hand wrote it, and the crossing
    // rule differs by hand: one of ours is shelved the day it is posted,
    // because posting and shelving are one act on this side.
    const incoming = entry.path.startsWith('in/');
    const gap = daysBetween(entry.left, entry.shelved);

    if (incoming && gap < CROSSING_DAYS) {
      complaints.push(['THE CROSSING', where,
        `it was left ${entry.left} and claims this shelf on ${entry.shelved}, ${gap} day(s) later — the carrier does not arrive before D+${CROSSING_DAYS}`]);
      continue;
    }

    if (!incoming && gap !== 0) {
      complaints.push(['THE CROSSING', where,
        `it is our own letter, left ${entry.left} and claiming this shelf on ${entry.shelved} — posting and shelving are one act on this side`]);
      continue;
    }

    console.log(`shelf-when:   ${where} — left ${said.date}, shelved Day ${towerDay(entry.shelved)}, and the row says both`);
  }

  if (complaints.length) {
    // The account is forked by cause. A row that misquotes its letter and a
    // row that claims an impossible crossing are two different failures, and
    // handing one of them the other's story is the Day 11 fault.
    for (const [cause, where, why] of complaints) console.log(`shelf-when: DISAGREES (${cause}) ${where} — ${why}`);

    const letters = complaints.filter(([cause]) => cause === 'THE LETTER').length;
    const crossings = complaints.filter(([cause]) => cause === 'THE CROSSING').length;
    console.log(`shelf-when: ${complaints.length} of ${shelf.length} rows do not hold.`);
    if (letters) {
      console.log(`shelf-when:   ${letters} misquote the letter's own head. The letter is the writer's hand and outranks the shelf — mend the row, never the letter.`);
    }
    if (crossings) {
      console.log(`shelf-when:   ${crossings} claim a crossing the charter does not allow (Article X, D+${CROSSING_DAYS}). Nothing here says a row shelved too *late* is wrong; this bound is a floor only.`);
    }
    return 1;
  }

  console.log(`shelf-when: AGREES — all ${shelf.length} rows quote their letter's own head, and every crossing clears the charter.`);
  return 0;
}

function main(argv) {
  const parsed = parseArgs(argv);

  if (parsed.error) {
    console.error(`shelf-when: INVALID — ${parsed.error}`);
    console.error(USAGE);
    return 2;
  }

  if (parsed.help) {
    console.log(USAGE);
    console.log('  --letters <dir>   the letters directory to read (default: ./letters)');
    console.log('  --help, -h        this');
    console.log('exit 0 the rows agree with their letters; 1 they disagree; 2 the tool could not look.');
    return 0;
  }

  return check(parsed.letters);
}

// The command line is not the only door (Day 10).
if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { parseArgs, isCalendarDate, main };
