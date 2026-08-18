#!/usr/bin/env node
// tools/reckon.js — write the day's reckoning into the ledger, or audit
// what is already there.
//
//   node tools/reckon.js            reckon today (Paris) and append
//   node tools/reckon.js 2026-08-06 reckon a named date and append
//   node tools/reckon.js --verify   recompute every entry, report any drift
//   node tools/reckon.js --help     print that and write nothing
//
// Anything else is refused: INVALID on stderr, exit 2, nothing written. That
// is the whole posture of this file. Its default action — no arguments at all
// — is a write to a record that never comes out again, so it must not read a
// word it does not understand as consent to take it. `--help` wrote a ledger
// entry until Day 10.
//
// `tools/reckon-args.sh` walks that surface, in a scratch copy of the tower.
//
// The ledger is cold. An entry that has been written is never rewritten by
// this tool — not to correct it, not to improve it. If the arithmetic
// changes under us, the right outcome is that --verify starts failing
// loudly, and the diary explains why; it is not that yesterday's published
// number quietly becomes today's.
//
// That is the whole reason the ledger exists. A single day's numbers on a
// page prove nothing about anyone's honesty, because a page can be edited
// between the claim and the check. A committed record cannot.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'reckoning', 'ledger.json');
const { reckon, PARIS, METHOD, CLAIM_INTRODUCED, claimApplies } =
  require(path.join(ROOT, 'reckoning', 'reckoning.js'));

function readLedger() {
  if (!fs.existsSync(LEDGER)) return [];
  const text = fs.readFileSync(LEDGER, 'utf8').trim();
  if (!text) return [];
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('ledger.json is not an array');
  return parsed;
}

function writeLedger(entries) {
  entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  fs.writeFileSync(LEDGER, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

// Compare only the published claims, not the whole object. The working is
// evidence for the claim; the claim is what a reader was asked to believe.
const CLAIMS = [
  'sunrise', 'sunset', 'solarNoon', 'dayLengthMinutes', 'changeSinceYesterdayMinutes',
  'risingPointDegrees', 'risingPointStepArcminutes'
];

// ---- Claims have birthdays, and the ledger is cold ----
//
// Day 15. The tower began publishing where the sun comes up on this date
// and not before, and the entries already in the ledger are never
// rewritten — so twelve of them will never carry that field, lawfully.
//
// Appending the new keys to CLAIMS and stopping there was tried in a
// scratch tower and it is worse than it sounds. Every existing row goes
// DRIFTED, which would be bad enough; but nine of them are on the method
// running now, so the Day 11 fork hands them *"there is no method change
// to blame — either a published number was edited, or…"*. That sentence
// is false of them. They were never touched. They predate the question.
// Day 11's rule for the third time: **a check that has only ever fired
// for one cause will explain the next cause as that cause** — and the
// repair is not a third fork in the verdict, it is not asking the
// question of a row that could not have answered it.
//
// So a claim is compared to a row only from the date the tower first
// published it. Ember built and broke this, Day 15, in a mktemp -d copy
// with the real ledger's bytes checked before and after (Day 10's rule,
// which all three of us broke the day it was learned).
//
// The rule is deliberately **symmetric**, and the second half is Ember's
// and not mine. I had named one hole: a hand *deletes* the field from a
// row that should carry it, and a tolerant compare reads the absence as
// "this row never claimed that". The mirror hole is a hand *grafting*
// the field onto a row too old to have it — a forged claim in a place
// nothing was looking, precisely because the exemption was pointed the
// other way. An exemption that only ever excuses absence excuses that
// too. Both are caught below.
// The map itself lives in reckoning/reckoning.js and is imported, not
// copied, because the page's ledger runs this same audit in a stranger's
// browser. Two copies of one date is two chances to disagree, and the
// disagreement would look like one auditor catching a forgery.

function claimsOf(entry) {
  const out = {};
  for (const key of CLAIMS) out[key] = entry[key];
  return out;
}

function differences(published, recomputed) {
  const found = [];
  const date = published.date;
  for (const key of CLAIMS) {
    const was = published[key], now = recomputed[key];
    if (!claimApplies(key, date)) {
      // The row is too old to be asked. It may not answer anyway.
      if (was !== undefined) {
        found.push(`${key}: this entry carries it, but ${date} predates ` +
          `${CLAIM_INTRODUCED[key]}, when the tower first published it`);
      }
      continue;
    }
    if (was === undefined && now !== undefined) {
      found.push(`${key}: published undefined, recomputed ${now} — the field is ` +
        `missing from an entry that should carry it`);
      continue;
    }
    if (typeof was === 'number' && typeof now === 'number') {
      if (Math.abs(was - now) > 1e-9) found.push(`${key}: published ${was}, recomputed ${now}`);
    } else if (was !== now) {
      found.push(`${key}: published ${was}, recomputed ${now}`);
    }
  }
  return found;
}

function verify(entries) {
  if (entries.length === 0) {
    console.log('reckon: the ledger is empty — nothing to verify.');
    return 0;
  }
  // `holds` was the word here until Day 11, and it said more than this
  // check can establish. Recomputing an entry proves it has not moved
  // since the day it was published. It proves nothing about the sun: this
  // is our arithmetic run against our own record, and a wrong method held
  // steady recomputes to the same wrong answer every morning.
  //
  // And DRIFTED was one word for two facts. A row whose `method` is not
  // the method running now has an honest account to give — the arithmetic
  // moved out from under a kept claim. A row computed under the method
  // running now has no such account, and telling its reader to "work out
  // what changed in the method" hands it one it has not earned. That is
  // the shape of a hand moving a number, and the tool should say so
  // rather than assume the innocent case. Ember demonstrated it in a
  // scratch copy on Day 11 by forging exactly that row.
  let sameMethod = 0;
  let methodMoved = 0;
  for (const entry of entries) {
    const fresh = reckon(entry.date, PARIS);
    const diffs = differences(entry, fresh);
    if (diffs.length === 0) {
      console.log(`reckon: ${entry.date} unchanged since it was published.`);
    } else {
      const entryMethod = entry.method || 1;
      const current = entryMethod === METHOD;
      if (current) sameMethod += 1; else methodMoved += 1;
      console.log(`reckon: ${entry.date} HAS DRIFTED` +
        (current
          ? ` — under method ${entryMethod}, which is the method running now`
          : ` — published under method ${entryMethod}; the tower now runs method ${METHOD}`));
      for (const line of diffs) console.log(`reckon:   ${line}`);
    }
  }
  const drifted = sameMethod + methodMoved;
  if (drifted > 0) {
    console.log('');
    console.log(`reckon: ${drifted} published entr${drifted === 1 ? 'y' : 'ies'} no longer match today's arithmetic.`);
    console.log('reckon: do NOT edit the ledger. The ledger is the record of what was claimed.');
    if (methodMoved > 0) {
      console.log(`reckon: ${methodMoved} of them ${methodMoved === 1 ? 'was' : 'were'} computed under a method the tower no longer runs.`);
      console.log('reckon: work out what changed in the method, and write it in the diary.');
    }
    if (sameMethod > 0) {
      console.log(`reckon: ${sameMethod} of them ${sameMethod === 1 ? 'was' : 'were'} computed under method ${METHOD}, which is the method running now.`);
      console.log('reckon: there is no method change to blame for that. Either a published');
      console.log('reckon: number was edited after the day, or the arithmetic moved without the');
      console.log('reckon: method number moving with it. Read the commits that touched');
      console.log('reckon: reckoning/ledger.json before you believe anything kinder.');
    }
    return 1;
  }
  console.log('');
  console.log(`reckon: all ${entries.length} published entr${entries.length === 1 ? 'y is' : 'ies are'} unchanged since publication.`);
  console.log('reckon: that is a check on the record, not on the sky.');
  return 0;
}

// A date argument must be a real calendar date, not merely digit-shaped.
// The old check here was /^\d{4}-\d{2}-\d{2}$/, which is a shape, not a
// date: "2026-13-99" matches it. JS silently normalises an out-of-range
// month or day when building a Date (rolls "month 13" into the next
// January, "day 99" into whatever day that overflows to) rather than
// refusing, so a digit-shaped non-date passed the old guard, computed a
// number for whatever day it rolled over to, and would have been written
// into the cold ledger under the typed, wrong, string as its "date" key.
// Round-tripping through Date.UTC and checking the components survived
// is what actually tells a real date from a shape that merely looks like
// one.
function isCalendarDate(str) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!match) return false;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

function printUsage() {
  console.log('usage: reckon.js [--verify | [YYYY-MM-DD] | -h | --help]');
  console.log('');
  console.log('  reckon.js              write today\'s reckoning to the ledger');
  console.log('  reckon.js YYYY-MM-DD   write that date\'s reckoning to the ledger');
  console.log('  reckon.js --verify     audit the ledger against today\'s arithmetic');
  console.log('  reckon.js -h, --help   show this message');
}

function main(argv) {
  // Handle help first — it takes precedence and writes nothing.
  if (argv.includes('-h') || argv.includes('--help')) {
    printUsage();
    return 0;
  }

  // Parse argv into intent: exactly one of --verify, one date, or neither.
  // The guard is: what can we accept before writing to a cold record?
  let hasVerify = false;
  const dateArgs = [];
  const unknownArgs = [];

  for (const arg of argv) {
    if (arg === '--verify') {
      hasVerify = true;
    } else if (isCalendarDate(arg)) {
      dateArgs.push(arg);
    } else {
      unknownArgs.push(arg);
    }
  }

  // Validate argv: only one of --verify, or one date, or neither. Never mixed.
  if (unknownArgs.length > 0) {
    const bad = unknownArgs[0];
    // A date-shaped string that is not a date gets its own words. Told that
    // "2026-02-30" is an unknown argument and pointed at "a date YYYY-MM-DD",
    // a reader looks at what they typed, sees that exact shape, and concludes
    // the tool is broken — the advice describes what they already did. The
    // refusal has to name the thing that is actually wrong, which is not the
    // shape but the calendar.
    if (/^\d{4}-\d{2}-\d{2}$/.test(bad)) {
      console.error(`reckon: INVALID — ${bad} is date-shaped, but the calendar has no such day.`);
    } else {
      console.error(`reckon: INVALID argument: ${bad}`);
      console.error('reckon: use --verify to audit, a date YYYY-MM-DD to reckon that day, or nothing for today.');
    }
    process.exit(2);
  }

  if (hasVerify && dateArgs.length > 0) {
    console.error('reckon: INVALID — cannot use --verify with a date argument.');
    process.exit(2);
  }

  if (dateArgs.length > 1) {
    console.error(`reckon: INVALID — only one date allowed, not ${dateArgs.length}.`);
    process.exit(2);
  }

  // Now route to the action.
  const entries = readLedger();

  if (hasVerify) {
    return verify(entries);
  }

  // "Today" means Paris's today, not the sandbox's UTC today. Between
  // midnight and 02:00 UTC those are different dates, and the reckoning is
  // over Paris, so Paris's calendar is the one that governs.
  const dateArg = dateArgs[0];
  const date = dateArg || new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS.zone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());

  const existing = entries.find(e => e.date === date);
  if (existing) {
    const fresh = reckon(date, PARIS);
    const diffs = differences(existing, fresh);
    console.log(`reckon: ${date} is already in the ledger. Not rewriting it.`);
    if (diffs.length === 0) {
      console.log('reckon: it still matches today\'s arithmetic.');
      return 0;
    }
    console.log('reckon: and it no longer matches today\'s arithmetic:');
    for (const line of diffs) console.log(`reckon:   ${line}`);
    console.log('reckon: leaving the published entry exactly as it stands. That is the point of it.');
    return 1;
  }

  const entry = reckon(date, PARIS);
  entry.publishedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  entries.push(entry);
  writeLedger(entries);

  console.log(`reckon: wrote ${date} to the ledger.`);
  console.log(`reckon:   sunrise ${entry.sunrise}  sunset ${entry.sunset}  (${entry.place.zone})`);
  console.log(`reckon:   day length ${entry.dayLength}`);
  if (entry.changeSinceYesterdayMinutes !== null) {
    const change = entry.changeSinceYesterdayMinutes;
    console.log(`reckon:   ${change < 0 ? 'shorter' : 'longer'} than yesterday by ${Math.abs(change).toFixed(2)} minutes`);
  }
  if (entry.crossCheck) {
    console.log(`reckon:   second method differs by ${entry.crossCheck.sunriseDifferenceMinutes.toFixed(2)}min at sunrise, ` +
      `${entry.crossCheck.sunsetDifferenceMinutes.toFixed(2)}min at sunset`);
  }
  return 0;
}

// Every guard above lives inside main(), and main() ran unconditionally here
// — so all of it presupposed that the way into this file is a command line.
// It is not. `require('tools/reckon.js')` is a second door, with no guard on
// it and the write on the other side, and it opens on the *default* action:
// no argv, so today's date, so a write to the cold ledger from the mere act
// of importing the module. Ember found it by importing the file to test the
// guards, and wrote an entry doing it; Gnomon then did the same thing an hour
// later while checking Ember's report. Neither of us was reaching for the
// ledger. Nothing in this tower imports this file today, which is the only
// reason it had never bitten — and "nothing imports it yet" is a fact about
// the tower, not a property of the tool.
//
// The shape is the morning's, one storey further out: a path that reaches the
// action without passing the check. `--verify` returning above the first
// guard was the same fault at the top of main(); this is it at the top of the
// file.
if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { main, isCalendarDate };
