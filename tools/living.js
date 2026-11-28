#!/usr/bin/env node
// The record of living things near the standing place, asked once a month at
// most and written down. Day 117, built before the first ask, which the house
// set for the first morning at Kiruna (Day 101).
//
// Article IV, amended 2026-11-11, opened a fifth window: `api.gbif.org`, a
// public record of dated, located sightings of living things, made by other
// people. This tool asks it two counts about the standing place, for one
// month of the year: how many records of one kind of creature lie within
// RADIUS_KM of the place, and how many records of anything at all lie there.
// It appends what came back, or that nothing came back, to
// `reckoning/living.json`. Nothing reads that file yet; the room that shows it
// is named and not built.
//
// **The edges, from the charter, and where each lives here.**
// - *One host, read only, the standing place's own coordinates.* Three plain
//   GETs, no key. The place is `STANDING.place`, never an argument, and its
//   coordinates go into the ask exactly as the instrument holds them.
// - *"Records of", never a sighting.* Every row carries the source, the month
//   asked about and the instant asked. `describe` says *records of* and
//   never *observed*, *present* or *absent*.
// - *The watchers are part of the count.* The creature's count is never
//   asked alone: the same ask, without the creature, is made beside it, and
//   the row carries both and their share. If either ask fails the row is a
//   failure, so there is never a creature's count with nothing to read it by.
// - *Not a third vote, not in the cold ledger.* This file does not open
//   `reckoning/ledger.json`.
// - *An expectation before the ask.* `--wager` asks nothing and writes
//   nothing. It prints the place, the date and month and the creature the ask
//   would use, read off the same lines the ask reads them from, so a note
//   written from it cannot be about another month (the almanac's lesson of
//   Day 59). The expectation itself is the house's to write and commit.
// - *It fails loud.* A failed ask is a row with its reason, exit 1. Too few
//   records of anything is a row that says so and carries no share (TOO FEW),
//   exit 0: that is an answer, not a failure.
//
// **What this tool cannot check, said on every answer (Ash's ask, Day 117).**
// It cannot tell a record made this year from one made forty years ago (all
// years are counted together); it cannot tell who made a record or why; and
// it cannot tell a creature's season from its watchers' season. The
// share only divides those two counts; it does not take the watchers out.
//
// **One guard the host's word alone would not give.** A filter the host does
// not know may be ignored without complaint, and then the "near the place"
// count is the whole earth's. So each count is asked with `limit=1`, and the
// one record that comes back must lie within the radius by our own
// arithmetic, or the row fails.
//
//   node tools/living.js --taxon <key> --wager   ask nothing, write nothing
//   node tools/living.js --taxon <key>           ask, append, print
//   node tools/living.js --taxon <key> --print   ask and print; write nothing
//
// The taxon is GBIF's own numeric key for the creature, chosen by the house
// and named in the committed expectation; the row records the name the host
// gives for that key, so a mistyped key shows itself as the wrong name.
//
// The ask is REFUSED (exit 2, nothing asked) unless the last commit holds an
// expectation for this place, year-month and creature in
// `reckoning/living-expectations.json`: a list of
// `{ place, yearMonth, taxonKey, expect, writtenOn }`.
//
// Exit 0 an answer was written (or printed, or wagered), 1 the window did not
// give one (a failure row is still written), 2 a bad argument, no committed
// expectation, or a record file that is not a list.
//
// FAR_KEEPER_LIVING_URL replaces the host and FAR_KEEPER_LIVING_DATE the
// date, for the break suite (`tools/living-breaks.sh`), which has to force the
// failure branches without the real window. A forced date says so.

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const Reckoning = require(path.join(ROOT, 'reckoning', 'reckoning.js'));
const LIVING_FILE = path.join(ROOT, 'reckoning', 'living.json');
const SOURCE = 'api.gbif.org';
const BASE = process.env.FAR_KEEPER_LIVING_URL || 'https://api.gbif.org';
const TIMEOUT_MS = Number(process.env.FAR_KEEPER_LIVING_TIMEOUT_MS) || 30000;
// The window's birthday (Article IV, amended 2026-11-11). A row dated before
// it is not a row this window could have given.
const WINDOW_OPENED = '2026-11-11';
// Near the place. Chosen on Day 117 and named in every row, so a later change
// shows; a town and its edge, not a province.
const RADIUS_KM = 25;
// Below this many records of anything in the month, the page draws nothing
// and the row says TOO FEW. A floor, not a finding: chosen, and said so.
const TOO_FEW = 50;
// Born with this tool, Day 117 (2026-11-28); a change to it is a new line
// here with its own date, never an edit of this one.
const TOO_FEW_SINCE = '2026-11-28';
// A reading older than this is OLD, and whatever shows it must say so. The
// window is asked once a month at most, so a reading is expected to be up to
// a month old; past forty-five days a month was missed. Born 2026-11-28.
const OLD_AFTER_DAYS = 45;
// The expectation, committed before the ask (Ember's condition, Day 117). The
// ask reads this file as HEAD holds it, not as the working tree does, because
// only a commit dates an expectation to anyone else.
const EXPECT_PATH = 'reckoning/living-expectations.json';
const USAGE = 'usage: node tools/living.js --taxon <GBIF key> [--print | --wager] [--help]';

function parseArgs(argv) {
  let print = false;
  let wager = false;
  let taxon = null;
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') return { help: true };
    if (token === '--print' || token === '--wager') {
      const name = token.slice(2);
      if ((name === 'print' && print) || (name === 'wager' && wager)) return { error: `${token} was given twice` };
      if (name === 'print') print = true; else wager = true;
      if (print && wager) return { error: '--print asks the host and --wager asks nothing; give one' };
      continue;
    }
    if (token === '--taxon') {
      if (taxon !== null) return { error: '--taxon was given twice' };
      const v = argv[i + 1];
      i += 1;
      if (v === undefined || !/^[1-9][0-9]{0,9}$/.test(v)) {
        return { error: `--taxon wants GBIF's numeric key for the creature, not ${JSON.stringify(v)}` };
      }
      taxon = Number(v);
      continue;
    }
    return { error: `${JSON.stringify(token)} is not an argument this tool knows` };
  }
  if (taxon === null) return { error: 'no --taxon: one kind of creature, chosen by the house, is part of every ask' };
  return { print, wager, taxon };
}

// The date and month every ask and wager use, read off one line.
function askDay(place) {
  const forced = Boolean(process.env.FAR_KEEPER_LIVING_DATE);
  const dateISO = forced ? process.env.FAR_KEEPER_LIVING_DATE : Reckoning.todayAt(place.zone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) throw new Error(`${JSON.stringify(dateISO)} is not a date`);
  return { dateISO, month: Number(dateISO.slice(5, 7)), forced };
}

// Great-circle distance in km, for the guard. Mean earth radius.
function distanceKm(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r;
  const dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(a)));
}

async function getJSON(url) {
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
  if (!response.ok) return { failed: `answered ${response.status}` };
  return { body };
}

// One count: records within the radius, in the month, of the taxon or (taxon
// null) of anything. Returns { count } or { failed }.
async function countNear(place, month, taxon) {
  const q = [
    `geoDistance=${place.latitude},${place.longitude},${RADIUS_KM}km`,
    `month=${month}`,
    'occurrenceStatus=PRESENT',
    'hasCoordinate=true',
    'limit=1',
  ];
  if (taxon !== null) q.push(`taxonKey=${taxon}`);
  const got = await getJSON(`${BASE}/v1/occurrence/search?${q.join('&')}`);
  const what = taxon === null ? 'the count of all records' : 'the count of the creature';
  if (got.failed) return { failed: `${got.failed} (asking ${what})` };
  const b = got.body;
  if (!b || typeof b !== 'object') return { failed: `answered, but ${what} was not an object` };
  if (!Number.isInteger(b.count) || b.count < 0) return { failed: `answered, but ${what} carried no whole count` };
  if (!Array.isArray(b.results)) return { failed: `answered, but ${what} carried no results list` };
  if (b.count > 0) {
    const rec = b.results[0];
    if (!rec || !Number.isFinite(rec.decimalLatitude) || !Number.isFinite(rec.decimalLongitude)) {
      return { failed: `answered, but ${what} came with no record whose place could be checked` };
    }
    const d = distanceKm(place.latitude, place.longitude, rec.decimalLatitude, rec.decimalLongitude);
    if (d > RADIUS_KM + 0.5) {
      return { failed: `answered, but a record in ${what} lies ${Math.round(d)} km from ${place.name}: the "near" filter did not hold` };
    }
    if (rec.month !== undefined && rec.month !== month) {
      return { failed: `answered, but a record in ${what} is from month ${rec.month}, not ${month}: the month filter did not hold` };
    }
  }
  return { count: b.count };
}

async function ask(place, day, taxon) {
  const row = {
    date: day.dateISO,
    month: day.month,
    source: SOURCE,
    place: { name: place.name, latitude: place.latitude, longitude: place.longitude, zone: place.zone },
    radiusKm: RADIUS_KM,
    taxonKey: taxon,
    fetchedAt: new Date().toISOString(),
  };
  if (day.forced) row.dateForced = true;
  if (day.dateISO < WINDOW_OPENED) {
    return Object.assign(row, { failed: `${day.dateISO} is before the window opened on ${WINDOW_OPENED}` });
  }
  const sp = await getJSON(`${BASE}/v1/species/${taxon}`);
  if (sp.failed) return Object.assign(row, { failed: `${sp.failed} (asking the creature's name)` });
  if (!sp.body || sp.body.key !== taxon || typeof sp.body.scientificName !== 'string') {
    return Object.assign(row, { failed: 'answered, but not with the name of the creature asked about' });
  }
  row.taxon = { scientificName: sp.body.scientificName, rank: sp.body.rank || null };
  if (typeof sp.body.vernacularName === 'string') row.taxon.vernacularName = sp.body.vernacularName;
  const creature = await countNear(place, day.month, taxon);
  if (creature.failed) return Object.assign(row, { failed: creature.failed });
  const all = await countNear(place, day.month, null);
  if (all.failed) return Object.assign(row, { failed: all.failed });
  if (creature.count > all.count) {
    return Object.assign(row, { failed: `answered, but the creature's count (${creature.count}) is more than all records (${all.count})` });
  }
  Object.assign(row, { count: creature.count, allCount: all.count });
  if (all.count < TOO_FEW) {
    row.tooFew = `only ${all.count} records of anything within ${RADIUS_KM} km in month ${day.month}, under the floor of ${TOO_FEW}`;
  } else {
    row.share = Number((creature.count / all.count).toFixed(6));
  }
  return row;
}

// Is there a committed expectation for this place, this year-month and this
// creature? Returns null when there is, or the reason the ask is refused.
function expectationProblem(place, day, taxon) {
  let text;
  try {
    text = execFileSync('git', ['-C', ROOT, 'show', `HEAD:${EXPECT_PATH}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (err) {
    return `no ${EXPECT_PATH} in the last commit: write the expectation and commit it before the ask`;
  }
  let list;
  try {
    list = JSON.parse(text);
  } catch (err) {
    return `${EXPECT_PATH} in the last commit is not JSON`;
  }
  if (!Array.isArray(list)) return `${EXPECT_PATH} in the last commit is not a list`;
  const yearMonth = day.dateISO.slice(0, 7);
  const hit = list.find((e) => e && e.place === place.name && e.yearMonth === yearMonth &&
    e.taxonKey === taxon && typeof e.expect === 'string' && e.expect.trim() !== '');
  if (!hit) {
    return `the last commit holds no expectation for ${place.name}, ${yearMonth}, taxon key ${taxon}: ` +
      'write it from --wager and commit it before the ask';
  }
  return null;
}

// Whether a row is OLD at a given instant.
function isOld(row, now) {
  const age = (now.getTime() - Date.parse(row.fetchedAt)) / 86400000;
  return !(age <= OLD_AFTER_DAYS);
}

const CANNOT = 'cannot tell: which year a record was made, who made it or why, or a creature\'s season from its watchers\'';

function describe(row) {
  const head = `living: ${row.place.name} ${row.date}${row.dateForced ? ' (FORCED date)' : ''}, month ${row.month}, within ${row.radiusKm} km`;
  if (row.failed) return `${head} — FAILED at ${row.fetchedAt}: ${row.failed}`;
  const name = row.taxon.vernacularName ? `${row.taxon.scientificName} (${row.taxon.vernacularName})` : row.taxon.scientificName;
  const counts = `${row.allCount} records of anything, and among them ${row.count} records of ${name}, key ${row.taxonKey}`;
  const share = row.tooFew ? `TOO FEW — ${row.tooFew}; no share` : `share ${row.share}`;
  return `${head}, asked ${row.fetchedAt} of ${row.source}: ${counts}; ${share}. ` +
    `Records of, all years counted together, never a sighting; this tool ${CANNOT}.`;
}

function describeWager(place, day, taxon) {
  return `living wager: ${place.name} (${place.latitude}, ${place.longitude}, ${place.zone}) ` +
    `${day.dateISO}, ${day.forced ? 'FORCED by FAR_KEEPER_LIVING_DATE, not read off the clock' : `today in ${place.zone}`}: ` +
    `the ask would be about month ${day.month}, within ${RADIUS_KM} km, of taxon key ${taxon}, against all records ` +
    `(TOO FEW under ${TOO_FEW}). Nothing asked, nothing written; the expectation is the house's to write and commit.`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    process.stderr.write(`living: INVALID — ${args.error}\n${USAGE}\n`);
    return 2;
  }
  if (args.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  const place = Reckoning.STANDING.place;
  let day;
  try {
    day = askDay(place);
  } catch (err) {
    process.stderr.write(`living: INVALID — ${err.message}\n`);
    return 2;
  }
  if (args.wager) {
    process.stdout.write(`${describeWager(place, day, args.taxon)}\n`);
    return 0;
  }
  const refused = expectationProblem(place, day, args.taxon);
  if (refused) {
    process.stderr.write(`living: REFUSED — ${refused}\n`);
    return 2;
  }
  let rows = [];
  if (!args.print && fs.existsSync(LIVING_FILE)) {
    rows = JSON.parse(fs.readFileSync(LIVING_FILE, 'utf8'));
    if (!Array.isArray(rows)) {
      process.stderr.write('living: reckoning/living.json is not a list; refusing to write over it\n');
      return 2;
    }
  }
  const row = await ask(place, day, args.taxon);
  process.stdout.write(`${describe(row)}\n`);
  if (!args.print) {
    rows.push(row);
    fs.writeFileSync(LIVING_FILE, `${JSON.stringify(rows, null, 2)}\n`);
  }
  return row.failed ? 1 : 0;
}

if (require.main === module) {
  main().then((code) => process.exit(code));
}

module.exports = { parseArgs, distanceKm, isOld, RADIUS_KM, TOO_FEW, TOO_FEW_SINCE, OLD_AFTER_DAYS, WINDOW_OPENED };
