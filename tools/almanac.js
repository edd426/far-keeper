#!/usr/bin/env node
// The outside almanac, asked once a morning and written down. Day 59.
//
// Article IV, amended 2026-09-29, opened a window onto someone else's
// arithmetic: `aa.usno.navy.mil`, sunrise and sunset for the standing place.
// This tool asks it for today at the place `STANDING` names and appends what
// came back — or that nothing came back — to `reckoning/almanac.json`. The
// reckoning room prints the newest entry beside both of our methods.
//
// **The wager is written before the ask (Ember's, Day 59).** The almanac
// prints whole minutes, and the two methods part by about a minute at each
// end, so one printed time cannot tell them apart. What it can tell apart is
// the day's length — printed set minus printed rise — because a convention
// the almanac shares between its two ends (rounding or cutting off the
// seconds) cancels in the difference. For a method whose day is x minutes
// long the printed length can only be a whole number strictly inside
// (x − 1, x + 1). So before the request goes out, the tool computes that set
// for method A and for method B and puts both in the row. The answer is
// added after. The order is the code's, not a witness's: a commit is still
// the only thing that dates the row to anyone else.
//
// **The edges, from the charter, and where each lives here.**
// - *Neither is a third vote.* Nothing here decides which method is right.
//   The row holds the printed minutes; the page prints them beside each
//   method's seconds and never says *agrees*.
// - *A reading is not a sighting.* This is another institution's
//   computation. Every row carries the source and the instant it was asked.
// - *Fail loud and specific.* No answer, an error, an answer that is not
//   the almanac's shape, or one for another day, place or clock is a
//   failure row with its reason. Exit 1.
// - *Never in the ledger's write path.* This file reads `reckon()` and never
//   opens `reckoning/ledger.json`; `reckon.js` never opens this one.
// - *Only the standing place.* The place is `STANDING.place`, never an
//   argument, and asked with its own decimals (Day 58: a hand-rounded
//   question is a different place).
//
// **Asked in UTC, converted here (Ember's trap).** Nuuk changed its clock law
// in 2023. If the host applied its own idea of the zone and that idea were an
// hour out, every figure would be off by exactly sixty minutes and look like
// a finding. So the ask carries `tz=0` and the answer must say `tz` 0.
//
// **A UTC day is not the standing place's day (Day 60, Ember's question).**
// Asked in UTC, the almanac answers about one UTC day. Where the standing
// place's sunrise falls on the UTC day before (Tokyo, Singapore) or its
// sunset on the day after (Kiritimati), one ask holds only one end of the
// day we mean, and the Rise it prints for that UTC day belongs to the next
// local morning. The first version asked once and took both: at Tokyo the
// page would have set a printed sunrise a whole day from ours and called the
// negative length *something neither of our methods says*. Day 21's 1440,
// reached through the new window. So each end is asked of the UTC day method
// A puts it on (one ask, or two), the row records which UTC date each printed
// time belongs to (`utcDates`), and a printed time more than half a day from
// ours is refused as the wrong event. That half-day is not a bound on
// disagreement. It tells a different day from the same day, and any width
// from minutes to most of a day would do the same.
//
//   node tools/almanac.js           ask, append, print
//   node tools/almanac.js --print   ask and print; write nothing
//   node tools/almanac.js --help
//
// Exit 0 a reading was written (or printed), 1 the window did not give one
// (a failure row is still written), 2 a bad argument.
//
// FAR_KEEPER_ALMANAC_URL replaces the host and FAR_KEEPER_ALMANAC_DATE the
// date, for the break suite, which has to force every branch without the
// real window and on any day.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const Reckoning = require(path.join(ROOT, 'reckoning', 'reckoning.js'));
const ALMANAC_FILE = path.join(ROOT, 'reckoning', 'almanac.json');
const SOURCE = 'aa.usno.navy.mil';
const BASE = process.env.FAR_KEEPER_ALMANAC_URL || 'https://aa.usno.navy.mil';
const TIMEOUT_MS = Number(process.env.FAR_KEEPER_ALMANAC_TIMEOUT_MS) || 30000;
const USAGE = 'usage: node tools/almanac.js [--print] [--help]';
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseArgs(argv) {
  let print = false;
  for (const token of argv) {
    if (token === '--help' || token === '-h') return { help: true };
    if (token === '--print') {
      if (print) return { error: '--print was given twice' };
      print = true;
      continue;
    }
    return { error: `${JSON.stringify(token)} is not an argument this tool knows` };
  }
  return { print };
}

// The comparands and the allowed lengths are the instrument's
// (`almanacComparands`, `printedLengthsFor` in reckoning.js), so this tool and
// the page that recomputes the wager ask one function and cannot part.
const allowedLengths = Reckoning.printedLengthsFor;
const ourTimes = Reckoning.almanacComparands;

function wagerFor(dateISO, place) {
  const ours = ourTimes(dateISO, place);
  const computedAt = new Date().toISOString();
  if (!ours) return { computedAt, none: 'the sun does not both rise and set here on this date by our methods' };
  return {
    computedAt,
    method: Reckoning.METHOD,
    A: { dayLengthMinutes: ours.A.dayLengthMinutes, allowed: allowedLengths(ours.A.dayLengthMinutes) },
    B: { dayLengthMinutes: ours.B.dayLengthMinutes, allowed: allowedLengths(ours.B.dayLengthMinutes) },
  };
}

// The answer must be the almanac's answer to the question asked: this day,
// this point, this clock. Anything else is a failure, whatever the status.
function answerProblem(body, dateISO, place) {
  if (!body || typeof body !== 'object') return 'the answer was not an object';
  if (body.error) return `the almanac said: ${String(body.error)}`;
  const coords = body.geometry && body.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return 'the answer carried no coordinates';
  if (Math.abs(coords[0] - place.longitude) > 1e-6 || Math.abs(coords[1] - place.latitude) > 1e-6) {
    return `the answer is for ${coords[1]}, ${coords[0]}, not the point asked`;
  }
  const data = body.properties && body.properties.data;
  if (!data || typeof data !== 'object') return 'the answer carried no data';
  if (data.tz !== 0) return `the answer is on clock offset ${JSON.stringify(data.tz)}, not the 0 asked`;
  // `dateISO` here is the UTC date asked, which is the row's date except on
  // the side of a day that crosses midnight UTC.
  const [y, m, d] = dateISO.split('-').map(Number);
  if (data.year !== y || data.month !== m || data.day !== d) {
    return `the answer is for ${data.year}-${data.month}-${data.day}, not ${dateISO}`;
  }
  if (!Array.isArray(data.sundata)) return 'the answer carried no sun data';
  for (const e of data.sundata) {
    if (!e || typeof e.phen !== 'string') return 'a sun entry carried no name';
    if (e.time !== null && e.time !== undefined && !HHMM.test(e.time)) {
      return `${e.phen} came as ${JSON.stringify(e.time)}, not a clock time`;
    }
  }
  return null;
}

function phen(data, name) {
  const e = data.sundata.find((x) => x.phen === name);
  return e && typeof e.time === 'string' ? e.time : null;
}

// The UTC date `offset` days from a date, as YYYY-MM-DD.
function shiftDate(dateISO, offset) {
  const t = Date.parse(`${dateISO}T00:00:00Z`) + offset * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

// Which UTC day each end of the standing place's day falls on, by method A:
// −1, 0 or +1 from the row's date. Null when our methods have no rise and set.
function endDays(dateISO, place) {
  const ours = ourTimes(dateISO, place);
  if (!ours) return null;
  return {
    ours,
    rise: Math.floor(ours.A.riseUTC / 1440),
    set: Math.floor(ours.A.setUTC / 1440),
  };
}

// One ask of one UTC day. Returns { data } or { failed }.
async function askDay(place, utcDate) {
  const url = `${BASE}/api/rstt/oneday?date=${utcDate}&coords=${place.latitude},${place.longitude}&tz=0`;
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    const why = err && err.name === 'TimeoutError'
      ? `no answer within ${TIMEOUT_MS / 1000} seconds`
      : `the host could not be reached (${(err && err.cause && err.cause.code) || (err && err.message) || 'unknown'})`;
    return { failed: why };
  }
  let body;
  try {
    body = await response.json();
  } catch (err) {
    return { failed: `answered ${response.status} with something that is not JSON` };
  }
  if (!response.ok) {
    const reason = body && typeof body.error === 'string' ? `: ${body.error}` : '';
    return { failed: `answered ${response.status}${reason}` };
  }
  const problem = answerProblem(body, utcDate, place);
  if (problem) return { failed: `answered, but ${problem}` };
  return { data: body.properties.data };
}

const HALF_A_DAY = 720;

async function ask(place, dateISO) {
  const row = {
    date: dateISO,
    source: SOURCE,
    place: { name: place.name, latitude: place.latitude, longitude: place.longitude, zone: place.zone },
    wager: wagerFor(dateISO, place),
  };
  // With no rise and set of ours there is no end to place on a UTC day; ask
  // the row's own date and let the answer say what it prints.
  const ends = endDays(dateISO, place);
  const riseOffset = ends ? ends.rise : 0;
  const setOffset = ends ? ends.set : 0;
  const utcDates = { rise: shiftDate(dateISO, riseOffset), set: shiftDate(dateISO, setOffset) };
  row.fetchedAt = new Date().toISOString();
  const answers = {};
  for (const day of [...new Set([utcDates.rise, utcDates.set])]) {
    const got = await askDay(place, day);
    if (got.failed) {
      const which = utcDates.rise === utcDates.set ? '' : ` (asked about UTC ${day})`;
      return Object.assign(row, { failed: `${got.failed}${which}` });
    }
    answers[day] = got.data;
  }
  const printed = {
    rise: phen(answers[utcDates.rise], 'Rise'),
    transit: phen(answers[utcDates.rise], 'Upper Transit'),
    set: phen(answers[utcDates.set], 'Set'),
  };
  if (!printed.rise || !printed.set) {
    Object.assign(row, { tz: 0, printedUTC: printed, utcDates });
    row.noRiseSet = answers[utcDates.rise].sundata.map((e) => e.phen).join('; ');
    return row;
  }
  // The wrong-day guard. Minutes after 00:00 UTC of the row's date.
  if (ends) {
    for (const [name, offset] of [['rise', riseOffset], ['set', setOffset]]) {
      const t = printed[name];
      const m = Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) + 1440 * offset;
      const a = ends.ours.A[`${name}UTC`];
      if (Math.abs(m - a) > HALF_A_DAY) {
        return Object.assign(row, {
          failed: `answered, but its ${name} on UTC ${utcDates[name]} is ${t}, ` +
            `${Math.round(Math.abs(m - a))} minutes from ours: not the ${name} of the day asked about`,
        });
      }
    }
  }
  Object.assign(row, { tz: 0, printedUTC: printed, utcDates });
  return row;
}

function describe(row) {
  if (row.failed) return `almanac: FAILED at ${row.fetchedAt} for ${row.place.name} on ${row.date} — ${row.failed}`;
  if (row.noRiseSet) return `almanac: ${row.place.name} ${row.date} — no rise or set printed (${row.noRiseSet})`;
  const w = row.wager;
  const wager = w.none ? `no wager: ${w.none}` :
    `wager A {${w.A.allowed.join(', ')}}  B {${w.B.allowed.join(', ')}}`;
  const p = row.printedUTC;
  const on = (name) => (row.utcDates && row.utcDates[name] !== row.date ? ` on ${row.utcDates[name]}` : '');
  return `almanac: ${row.place.name} ${row.date}, asked ${row.fetchedAt}: rise ${p.rise}${on('rise')}, set ${p.set}${on('set')} UTC` +
    ` — another institution's computation, not a sighting; ${wager}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    process.stderr.write(`almanac: INVALID — ${args.error}\n${USAGE}\n`);
    return 2;
  }
  if (args.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  const place = Reckoning.STANDING.place;
  const dateISO = process.env.FAR_KEEPER_ALMANAC_DATE || Reckoning.todayAt(place.zone);
  const row = await ask(place, dateISO);
  process.stdout.write(`${describe(row)}\n`);
  if (!args.print) {
    let rows = [];
    if (fs.existsSync(ALMANAC_FILE)) {
      rows = JSON.parse(fs.readFileSync(ALMANAC_FILE, 'utf8'));
      if (!Array.isArray(rows)) {
        process.stderr.write('almanac: reckoning/almanac.json is not a list; refusing to write over it\n');
        return 2;
      }
    }
    rows.push(row);
    fs.writeFileSync(ALMANAC_FILE, `${JSON.stringify(rows, null, 2)}\n`);
  }
  return row.failed ? 1 : 0;
}

if (require.main === module) {
  main().then((code) => process.exit(code));
}

module.exports = { parseArgs, allowedLengths, answerProblem, ourTimes, endDays, shiftDate };
