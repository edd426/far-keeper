#!/usr/bin/env node
// tools/reckon.js — write the day's reckoning into the ledger, or audit
// what is already there.
//
//   node tools/reckon.js            reckon today, where the tower stands, and append
//   node tools/reckon.js 2026-08-20 name today, and be told if you are wrong
//   node tools/reckon.js --verify   recompute every entry, report any drift
//
// --verify recomputes each row at the place that row names, never at a
// place chosen here. It said `reckon(date, PARIS)` until Day 18. See the
// long note above `placeProblem` for what that cost and what the repair
// cannot do.
//   node tools/reckon.js --help     print that and write nothing
//
// The date argument may only ever be today's date *where the tower stands*
// — `Reckoning.STANDING`, which is Paris and has been since Day 1, but is a
// value rather than a constant read at a call site as of Day 19. Any other
// real day is refused with NOT_TODAY — see the long note above the gate for
// why that bound is *not-today* and not merely *not-future*, and the note
// above `standingToday` for why the calendar it asks is the tower's own and
// not one particular city's.
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
const { reckon, STANDING, todayAt, samePlace, METHOD, CLAIM_INTRODUCED, claimApplies } =
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
//
// ---- `never` is a claim, and on a dark day it is the only one ----
//
// Day 20. Every key below but the first is a number, and this list held
// only numbers until this morning. Above about 66 degrees the `acos` fold
// in `reckoning.js` fires and `reckon()` returns `{ never: 'risen' }` or
// `{ never: 'set' }` — no sunrise, no sunset, no day length, no drift, no
// rising point, no cross-check. Every numeric key is `undefined` on such a
// row.
//
// So every comparison below passed vacuously. `undefined` equals
// `undefined` seven times over and the auditor printed `unchanged`. Shown
// before it was fixed, in a scratch tower standing at Tromso: a published
// December row was forged from `never: 'risen'` to `never: 'set'` — polar
// night into midnight sun, on a cold record, the largest lie this ledger
// can tell about a day — and `--verify` answered
// `2026-12-21 unchanged at Tromso since it was published.`
//
// This is Day 15's shape (a claim the auditors were never taught to ask
// about) with the stakes inverted. There, the un-audited field was one of
// several and the rest of the row still convicted a forger. Here the
// un-audited field is the **whole** of what the row says, so a dark row was
// not lightly checked — it was not checked at all, and said so in the same
// green word a full row earns.
//
// It needs no CLAIM_INTRODUCED birthday, and the reason is worth stating
// rather than assuming: the exemption exists for a claim an old row could
// not have made *but the recompute still makes today*, which reads as a
// silence to be convicted of. Absence of `never` is not that. Every Paris
// row lacks the field and recomputes to lacking it, so absence meets
// absence and matches. Ember checked that against the twelve honest rows
// rather than take my word for it.
const CLAIMS = [
  'never',
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

// What a dark day says, in words, for a keeper's terminal. `page.js` has
// its own `neverWords` for a reader's page and the two are deliberately
// not shared: they address different people and one of them has to survive
// being read at a glance in a scrollback. This is not the Day 3 rule about
// the two solar methods — nothing here disagrees with anything; it is only
// that a sentence written for one room reads badly in the other.
function darkWords(never, placeName) {
  return never === 'set'
    ? `the sun did not set at ${placeName} that day`
    : `the sun did not rise at ${placeName} that day`;
}

// ---- A row is recomputed at the place the row names ----
//
// Day 18. Until this morning both auditors — this one, and the copy of it
// that runs in a stranger's browser — recomputed every published row at
// `PARIS`, and threw away the `place` the row carries. Every entry in the
// ledger has carried its own place since the first one, 2026-08-06: name,
// latitude, longitude, zone. Neither auditor had ever read it.
//
// Nothing was ever wrong, because Paris is the only place that has ever
// been in the book, so `entry.place` and `PARIS` have been the same object
// every morning for eighteen days. Ash refused my first name for that —
// I wanted Day 11's *a check that has only ever fired for one cause*, and
// it does not fit: that fault fires and misreads, and this one has never
// fired at all. Its name is an **untested assumption**. The code was asked
// whether it recomputes each row at the place the row names, it answered
// yes in its documentation, it did something else, and nobody ever fed it
// a row that could tell the two answers apart.
//
// What it costs on the first morning the tower stands anywhere else: an
// honest row — one this instrument wrote itself, standing in that place —
// is recomputed against Paris, disagrees on every figure, and is convicted.
// And being on the method running now, it is handed the Day 11 forgery
// sentence: *there is no method change to blame; either a published number
// was edited…* about a row no hand has touched. That is Day 15's shape for
// the third time: an honest row told a lie about itself by a check that
// never asked the right question. Demonstrated before it was fixed, with a
// Reykjavík row manufactured by `reckon()` itself and spliced into a scratch
// copy of the ledger; `tools/place-audit.sh` keeps that demonstration.
//
// **And the fix opens a hole underneath itself, which is the honest half of
// today.** Once the auditor recomputes at the place the row names, the row
// is steering its own audit: a hand that edits a row's latitude *and* its
// numbers together produces a row that recomputes perfectly and prints
// `unchanged`. Before today, editing the numbers alone was caught. It is not
// closeable here. **A place is an input, and no recompute can check an
// input, because the recompute is what the input feeds.** The commits are
// the only witness to a place, and both auditors now say so on their face
// and name the place they used, so that a wrong place is at least in front
// of an eye rather than swallowed. Naming it is not a check and is not
// offered as one.
//
// The narrow guard below is worth what an impossible-check is worth and no
// more (Day 4, Day 5): it owes no witness because it is about the shape of
// the thing — there is no latitude of 200 degrees and no zone the clock has
// never heard of. It catches a slip. It does not catch a forger, who would
// get all three right.
function placeProblem(place) {
  if (!place || typeof place !== 'object') return 'the row names no place at all';
  const { latitude, longitude, zone, name } = place;
  // Day 7: `NaN < min` is false and so is `NaN > max`, so a range check
  // assumes it was handed a number. Ask that first, of both.
  if (typeof latitude !== 'number' || !Number.isFinite(latitude)) {
    return `latitude is ${JSON.stringify(latitude)}, which is not a number`;
  }
  if (typeof longitude !== 'number' || !Number.isFinite(longitude)) {
    return `longitude is ${JSON.stringify(longitude)}, which is not a number`;
  }
  if (latitude < -90 || latitude > 90) return `latitude ${latitude} is off the earth`;
  if (longitude < -180 || longitude > 180) return `longitude ${longitude} is off the earth`;
  if (typeof zone !== 'string' || !zone) return 'the row names no zone';
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(new Date());
  } catch (error) {
    return `the clock has never heard of the zone ${JSON.stringify(zone)}`;
  }
  if (typeof name !== 'string' || !name) return 'the place has no name';
  return null;
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
  let unplaced = 0;
  let dark = 0;
  for (const entry of entries) {
    // The row is recomputed at the place the row names, never at PARIS.
    // See the long note above `placeProblem` — until Day 18 this line read
    // `reckon(entry.date, PARIS)` and the first row written anywhere else
    // would have been convicted of a forgery it did not commit.
    const problem = placeProblem(entry.place);
    if (problem) {
      // Not a drift and not a clean row: a row this tool cannot check at
      // all. It must not be counted among the quiet ones — `check-sight.sh`
      // learned this on Day 2 and it is the same rule. A tool that cannot
      // see must read as unable to see, never as finding nothing wrong.
      console.log(`reckon: ${entry.date} UNPLACED — ${problem}. Not checked.`);
      unplaced += 1;
      continue;
    }
    const where = entry.place;
    const fresh = reckon(entry.date, where);
    const diffs = differences(entry, fresh);
    if (diffs.length === 0) {
      // The place is inside the verdict rather than printed beside it,
      // because what was established is *unchanged given this place* and
      // the place is the one thing here no recompute can vouch for.
      //
      // Day 20 puts a second condition in the same sentence, for the same
      // reason Day 18 put the place there. A dark row carries one claim,
      // not eight, so `unchanged at Tromso` — the identical words a full
      // row earns — tells a scanning keeper that eight figures were held
      // against the arithmetic when one word was. The verdict is true
      // either way; what moves is how much it is worth, and Day 18's
      // repair was not a weaker word but a verdict that stops standing
      // alone.
      if (entry.never) {
        dark += 1;
        console.log(`reckon: ${entry.date} unchanged at ${where.name} — ${darkWords(entry.never, where.name)},`);
        console.log('reckon:   so the only claim on this row is that one word, and that one word is');
        console.log('reckon:   what was checked. There were no figures on it to hold.');
      } else {
        console.log(`reckon: ${entry.date} unchanged at ${where.name} since it was published.`);
      }
    } else {
      const entryMethod = entry.method || 1;
      const current = entryMethod === METHOD;
      if (current) sameMethod += 1; else methodMoved += 1;
      console.log(`reckon: ${entry.date} HAS DRIFTED, recomputed at ${where.name}` +
        (current
          ? ` — under method ${entryMethod}, which is the method running now`
          : ` — published under method ${entryMethod}; the tower now runs method ${METHOD}`));
      for (const line of diffs) console.log(`reckon:   ${line}`);
    }
  }
  const drifted = sameMethod + methodMoved;
  if (unplaced > 0) {
    console.log('');
    console.log(`reckon: ${unplaced} entr${unplaced === 1 ? 'y was' : 'ies were'} not checked at all.`);
    console.log('reckon: a row is recomputed at the place it names, so a row that names no');
    console.log('reckon: usable place cannot be recomputed. That is not a clean row and it is');
    console.log('reckon: not a drifted one. Go and look at the entry.');
  }
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
  console.log(`reckon: all ${entries.length} published entr${entries.length === 1 ? 'y is' : 'ies are'} unchanged since publication,`);
  console.log('reckon: each at the place its own row names.');
  if (dark > 0) {
    // Counted and said out loud, because the tally above is the sentence a
    // keeper actually reads and a dark row is not the same weight of
    // evidence as a full one. A sweep that reports twenty clean rows when
    // seven of them carried a single word has told the truth and left the
    // wrong impression.
    console.log(`reckon: ${dark} of them ${dark === 1 ? 'is a dark row' : 'are dark rows'} — the sun did not rise or did not set, so`);
    console.log(`reckon: ${dark === 1 ? 'it carries' : 'they carry'} one word and no figures. That word was checked. Nothing else`);
    console.log('reckon: was there to check, and a sweep that counts them alongside full rows');
    console.log('reckon: is counting two different weights of evidence in one number.');
  }
  console.log('reckon: that is a check on the record, not on the sky. And it is a check on');
  console.log('reckon: the numbers, not on the place: a place is an input, and no recompute');
  console.log('reckon: can check an input, because the recompute is what the input feeds. A');
  console.log('reckon: hand that moved a row\'s place and its numbers together would pass here.');
  console.log('reckon: the commits that touched reckoning/ledger.json are the only witness to');
  console.log('reckon: a place. This tool is the first part of that guard; a reader with the');
  console.log('reckon: history is the second.');
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

// "Today" where this tower stands, which is the only day this tool may
// write. It asks the system tz database, which is the same source
// `zoneOffsetMinutes` already asks for every entry — the gate adds no
// dependence the row did not already carry.
//
// Day 19. This function said `PARIS.zone` outright, and the note under it
// said the reckoning is over Paris so Paris's calendar governs. The first
// half of that was true and the second half was a step it does not support.
// What governs is the calendar of the place the tower stands in; Paris was
// that place, and the sentence read as though it were a rule about Paris.
//
// The cost, measured at 02:05 UTC on the morning this was repaired, before
// a line of it was changed: Paris said 2026-08-22 and New York said
// 2026-08-21. A tower standing in New York that morning has an honest row
// dated the 21st — and this gate would have refused it, and demanded in its
// place a date New York had not yet reached. Not a wrong number. A gate
// enforcing the calendar of a city the tower had left.
function standingToday() {
  return todayAt(STANDING.place.zone);
}

// ---- A row may only claim the morning it was written on ----
//
// Day 17. The reckoning page has said this in its own standing words since
// the ledger existed: *"Each day's reckoning is written down when it is made
// and never rewritten."* Every one of the fourteen published rows obeys it —
// each `publishedAt` falls on the same Paris day as the `date` it claims —
// and until now nothing enforced it but sixteen mornings of habit.
//
// The book called this hole "no future-date gate", and that name is too
// small. On Day 10 four rows went into the ledger that were not the tower's:
// 2024-02-29, 2026-01-15, 2026-08-13, 2026-12-31. Only ONE of them was in
// the future. A gate against forward dates catches that one and waves the
// other three through, and a keeper would write "closed" beside it. Day 12's
// fault exactly: the smallest box drawn round the fault, carefully checked
// inside, and nobody asking how big the box ought to be.
//
// So the bound is not *not-future*. It is *not-today*. Every figure in a
// row like that is correct arithmetic; what is false is the account of WHEN
// THIS TOWER SPOKE, which is the one thing the ledger exists to be a record
// of, and the one thing no recompute can ever catch — `--verify` would
// recompute a backdated row every morning after and report that it is
// unchanged, because it is.
//
// It forbids backfilling a morning the tower slept through, and that cost is
// real and is meant. Ash, asked whether the bound was too tight: *"A
// slept-through day is a gap. The honest record of a gap is a gap in the
// ledger. If you fill the gap later, you are no longer recording what
// happened; you are rewriting history to look tidier."*
//
// The word is Ash's too, and the reason for a second word is that `INVALID`
// would be a lie about what is wrong. A date refused here is real, correctly
// typed, and perfectly well formed. Nothing about the argument is malformed;
// what fails is the claim the row would make. Told `INVALID`, a keeper looks
// at what they typed for a typo that is not there.
function refuseNotToday(date, today) {
  console.error(`reckon: NOT_TODAY — ${date} is a real day, and today at ${STANDING.place.name} is ${today}.`);
  console.error('reckon: The ledger is the record of what this tower reckoned on the morning it');
  console.error('reckon: reckoned it. A row dated ' + date + ' written today would be correct');
  console.error('reckon: arithmetic and a false account of when this tower spoke — and no');
  console.error('reckon: recompute can ever catch that, because the numbers in it are right.');
  console.error('reckon: Run with no date at all to reckon today. A claim about another day');
  console.error('reckon: belongs on the page and in the diary; the ledger stays a record of');
  console.error('reckon: days the tower actually had.');
}

function printUsage() {
  console.log('usage: reckon.js [--verify | [YYYY-MM-DD] | -h | --help]');
  console.log('');
  console.log('  reckon.js              write today\'s reckoning to the ledger');
  console.log('  reckon.js YYYY-MM-DD   the same, but say which day you believe it is');
  console.log('                         (only today where the tower stands is accepted; any');
  console.log('                          other real day is refused NOT_TODAY, and nothing');
  console.log('                          is written)');
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

  // Before the gate can ask what day it is here, "here" has to be a place.
  //
  // Day 19, and it is Day 5's shape one room along. `todayAt()` asks the
  // system clock about a zone and *throws* if the clock has never heard of
  // it — deliberately, because a tower standing in a zone that does not
  // exist is not standing anywhere, and no date it computed would mean
  // anything. But a function that can throw makes every call site a new
  // join, and this call site is the first line of the tool's only action.
  // Unguarded, a keeper who mistypes one letter of a zone name while moving
  // the tower gets a raw RangeError with a node stack under it, at the exact
  // moment they most need a sentence.
  //
  // It is `placeProblem` — the same narrow guard the auditors use on a
  // ledger row, pointed at the tower itself. And it gets its own word.
  // `UNPLACED` is spoken for: that is a *row* that could not be recomputed,
  // and one word doing two jobs is this house's own oldest fault (Day 11,
  // and Day 18 when the third word was needed). This is the tower not
  // knowing where it is.
  const standingProblem = placeProblem(STANDING.place);
  if (standingProblem) {
    console.error(`reckon: NOWHERE — this tower does not know where it is standing: ${standingProblem}.`);
    console.error('reckon: Nothing is written. Every row in the ledger is a claim about the sun');
    console.error('reckon: over a place, and a day at a place that is not on the earth or keeps a');
    console.error('reckon: clock nobody has heard of is not a day. Fix Reckoning.STANDING.');
    process.exit(2);
  }

  // The gate stands here — before the ledger is even opened, at the earliest
  // point the date exists as a date. Ember's Day 4 rule: assert at the
  // earliest point the number exists, not at the point it does damage.
  const today = standingToday();
  if (dateArgs.length === 1 && dateArgs[0] !== today) {
    refuseNotToday(dateArgs[0], today);
    process.exit(2);
  }

  // Now route to the action.
  const entries = readLedger();

  if (hasVerify) {
    return verify(entries);
  }

  // Past the gate, a date argument can only be today, so the two branches
  // that used to differ here have become one. The argument is kept because
  // typing it is a keeper saying which day they believe it is, and the tool
  // now answers when they are wrong.
  const date = today;

  const existing = entries.find(e => e.date === date);
  if (existing) {
    // A second audit of a published row, and it obeys the same rule as
    // --verify: recompute at the place the row names.
    //
    // Day 19 split the headline sentence in two, because from this morning
    // on there are two wholly different reasons to be standing here and one
    // of them is new. Until now there was only ever one: a keeper ran the
    // tool twice before breakfast. Once the tower can move, a move *west*
    // lands its own today on a date the tower already spoke for from
    // somewhere else — the ledger is never rewritten, so that day gets no
    // second row, and that is not a mistake anyone made. Handed the
    // twice-before-breakfast sentence, a keeper who has just moved the tower
    // would go looking for the run they think they made. Day 11's rule,
    // caught before it could fire rather than after: a check that has only
    // ever spoken for one cause will explain the next cause as that cause.
    //
    // The word is Ash's — ALREADY_PUBLISHED, and deliberately not NOT_TODAY,
    // which is about a claim that would be false. Nothing here is false. The
    // day has simply been spoken for.
    const moved = !samePlace(existing.place, STANDING.place);
    if (moved) {
      console.log(`reckon: ALREADY_PUBLISHED — ${date} is in the ledger already, published at ${existing.place.name}.`);
      console.log(`reckon: This tower stands at ${STANDING.place.name} now, where today is ${date} — a day it`);
      console.log('reckon: already spoke for from somewhere else. Nothing is written and nothing is');
      console.log('reckon: wrong: the ledger is cold, so a move that walks back onto a published day');
      console.log('reckon: costs that day its row. One row is the honest record of that, not two.');
    } else {
      console.log(`reckon: ${date} is already in the ledger. Not rewriting it.`);
    }
    const problem = placeProblem(existing.place);
    if (problem) {
      console.log(`reckon: and it is UNPLACED — ${problem}. It could not be checked.`);
      return 1;
    }
    const fresh = reckon(date, existing.place);
    const diffs = differences(existing, fresh);
    if (diffs.length === 0) {
      console.log(`reckon: it still matches today's arithmetic at ${existing.place.name}.`);
      return 0;
    }
    console.log('reckon: and it no longer matches today\'s arithmetic:');
    for (const line of diffs) console.log(`reckon:   ${line}`);
    console.log('reckon: leaving the published entry exactly as it stands. That is the point of it.');
    return 1;
  }

  // The row is written for the place the tower stands in — not for PARIS,
  // which this line named until Day 19. Ember settled the order on Day 18
  // and it is why this could not have been done first: the auditors had to
  // learn to recompute a row at the place the row names before the write
  // was allowed to write a row from anywhere else, or every such row would
  // have been DRIFTED forever by construction.
  const entry = reckon(date, STANDING.place);
  entry.publishedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  entries.push(entry);
  writeLedger(entries);

  console.log(`reckon: wrote ${date} to the ledger.`);

  // ---- What this tool says on the morning the sun does not come up ----
  //
  // Day 20. These four lines assumed a row has figures on it, because for
  // twenty mornings at 48.86°N every row did. At a polar latitude
  // `reckon()` returns `{ never: 'risen' }` and nothing else, and the
  // announcement of the tower's first dark morning read, in full:
  //
  //     reckon:   sunrise undefined  sunset undefined  (Europe/Oslo)
  //     reckon:   day length undefined
  //     reckon:   longer than yesterday by NaN minutes
  //
  // The third line is the one that matters and it is not a cosmetic fault.
  // It is a *false sentence*: it says the day got longer, on the day the
  // day stopped existing. The guard on it was
  // `changeSinceYesterdayMinutes !== null`, and it was written for a real
  // case that still happens — the morning the sun returns, when there is
  // no yesterday to subtract from and the field is genuinely `null`. On a
  // dark row the field is not null, it is **absent**, and `undefined !==
  // null` is true. A guard written for one kind of missing, meeting the
  // other kind, and reading it as present.
  //
  // The repair is not to widen the guard to `!= null`, which would catch
  // both kinds of missing and print nothing — Day 4: delete-and-shrink is
  // the cowardly repair, and the true sentence is usually one line of
  // arithmetic behind the false one. It is to ask the row what shape it is
  // and say what a dark day actually says.
  if (entry.never) {
    console.log(`reckon:   ${darkWords(entry.never, entry.place.name)}  (${entry.place.zone})`);
    console.log('reckon:   no sunrise, no sunset, no day length, no drift, no rising point.');
    console.log('reckon:   that one word is the whole of this row, and it is the whole of what');
    console.log('reckon:   --verify will have to check on it.');
    return 0;
  }

  console.log(`reckon:   sunrise ${entry.sunrise}  sunset ${entry.sunset}  (${entry.place.zone})`);
  console.log(`reckon:   day length ${entry.dayLength}`);
  // Not widened to `!= null`. `null` here is the morning the sun returns:
  // yesterday was dark, so there is no day length to subtract and the
  // silence is the honest answer. `undefined` is a dark row, and that is
  // handled above and never reaches here.
  if (entry.changeSinceYesterdayMinutes !== null) {
    const change = entry.changeSinceYesterdayMinutes;
    console.log(`reckon:   ${change < 0 ? 'shorter' : 'longer'} than yesterday by ${Math.abs(change).toFixed(2)} minutes`);
  } else {
    console.log('reckon:   no drift — yesterday had no day length to subtract from.');
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
