#!/usr/bin/env node
// The air over the standing place, asked once and written down. Day 58.
//
// Article IV, amended 2026-09-29, opened a window onto the air:
// `api.open-meteo.com`. This tool asks it for the temperature and the two
// pressures over the place `STANDING` names, and appends what came back —
// or that nothing came back — to `reckoning/air.json`. The reckoning room
// prints the newest entry. Nothing here compares the air with anything.
//
// **Why the keeper asks and not the reader's browser.** Evan ruled on
// 2026-09-29 that a stranger's page must never ask for their device, for
// privacy. A fetch is not a camera, but a page that quietly sends every
// reader's address to a third party to show them a number they did not ask
// for is on the same side of that line. So the tower asks, once, from its own
// desk, and the page reads the tower's copy. It also means the reading is
// dated in the commits, where a later hand can hold it against an
// expectation written before it arrived.
//
// **The edges, from the charter, and where each lives here.**
// - *A reading is not a sighting.* Every entry carries the source and the
//   instant it was fetched, and the model's own time for the value. The
//   page says *model* and never *observed*.
// - *Fail loud and specific.* A host that does not answer, answers with an
//   error, or answers with something that is not the reading is written
//   down as a failure with its reason, and the page says so. It never falls
//   back to a standard atmosphere. Exit 1.
// - *Never in the ledger's write path.* This file does not open
//   `reckoning/ledger.json`, and `reckon.js` does not open this one.
// - *Only the standing place.* The place is `STANDING.place`, never an
//   argument.
//
// `air.json` is not the cold ledger and is not held to its rules: a row here
// is a record of what a window said, not a claim the tower made. But nothing
// in it is rewritten either — the tool only appends.
//
//   node tools/air.js           ask, append, print
//   node tools/air.js --print   ask and print; write nothing
//   node tools/air.js --help
//
// Exit 0 a reading was written (or printed), 1 the window did not give one
// (a failure row is still written), 2 a bad argument.
//
// FAR_KEEPER_AIR_URL replaces the host for the break suite, which has to be
// able to force the failure branches without the real window.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const Reckoning = require(path.join(ROOT, 'reckoning', 'reckoning.js'));
const AIR_FILE = path.join(ROOT, 'reckoning', 'air.json');
const SOURCE = 'api.open-meteo.com';
const BASE = process.env.FAR_KEEPER_AIR_URL || 'https://api.open-meteo.com';
// The first ask on Day 58 timed out at twenty seconds and the second answered
// at once. Thirty is a wait, not a promise; a longer silence is a failure row.
const TIMEOUT_MS = Number(process.env.FAR_KEEPER_AIR_TIMEOUT_MS) || 30000;
const FIELDS = ['temperature_2m', 'surface_pressure', 'pressure_msl'];
const USAGE = 'usage: node tools/air.js [--print] [--help]';

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

// Every field must be a finite number in its unit, or the answer is not the
// reading, whatever the status code said. NaN fails both of a pair of range
// tests (Day 7), so finiteness is asked first and on its own.
function readingProblem(body) {
  if (!body || typeof body !== 'object') return 'the answer was not an object';
  const cur = body.current;
  const units = body.current_units || {};
  if (!cur || typeof cur !== 'object') return 'the answer carried no current reading';
  if (typeof cur.time !== 'string') return 'the reading carried no time';
  for (const f of FIELDS) {
    if (typeof cur[f] !== 'number' || !Number.isFinite(cur[f])) return `${f} was not a number`;
  }
  if (units.temperature_2m !== '°C') return `temperature came in ${JSON.stringify(units.temperature_2m)}, not °C`;
  if (units.surface_pressure !== 'hPa' || units.pressure_msl !== 'hPa') return 'a pressure did not come in hPa';
  if (cur.temperature_2m < -90 || cur.temperature_2m > 60) return `temperature ${cur.temperature_2m} °C is not air on this earth`;
  for (const f of ['surface_pressure', 'pressure_msl']) {
    if (cur[f] < 500 || cur[f] > 1100) return `${f} ${cur[f]} hPa is not air at a town`;
  }
  for (const f of ['latitude', 'longitude', 'elevation']) {
    if (typeof body[f] !== 'number' || !Number.isFinite(body[f])) return `the grid cell's ${f} was not a number`;
  }
  return null;
}

async function ask(place) {
  const url = `${BASE}/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=${FIELDS.join(',')}&timezone=UTC`;
  const fetchedAt = new Date().toISOString();
  const row = {
    fetchedAt,
    source: SOURCE,
    place: { name: place.name, latitude: place.latitude, longitude: place.longitude },
  };
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    const why = err && err.name === 'TimeoutError'
      ? `no answer within ${TIMEOUT_MS / 1000} seconds`
      : `the host could not be reached (${(err && err.cause && err.cause.code) || (err && err.message) || 'unknown'})`;
    return Object.assign(row, { failed: why });
  }
  let body;
  try {
    body = await response.json();
  } catch (err) {
    return Object.assign(row, { failed: `answered ${response.status} with something that is not JSON` });
  }
  if (!response.ok) {
    const reason = body && typeof body.reason === 'string' ? `: ${body.reason}` : '';
    return Object.assign(row, { failed: `answered ${response.status}${reason}` });
  }
  const problem = readingProblem(body);
  if (problem) return Object.assign(row, { failed: `answered, but ${problem}` });
  const cur = body.current;
  return Object.assign(row, {
    modelTime: `${cur.time}Z`.replace(/ZZ$/, 'Z'),
    temperatureC: cur.temperature_2m,
    surfacePressureHPa: cur.surface_pressure,
    seaLevelPressureHPa: cur.pressure_msl,
    grid: { latitude: body.latitude, longitude: body.longitude, elevationM: body.elevation },
  });
}

function describe(row) {
  if (row.failed) return `air: FAILED at ${row.fetchedAt} over ${row.place.name} — ${row.failed}`;
  return `air: ${row.place.name}, model time ${row.modelTime}, fetched ${row.fetchedAt}: ` +
    `${row.temperatureC} °C, surface ${row.surfacePressureHPa} hPa, sea level ${row.seaLevelPressureHPa} hPa ` +
    `(grid cell ${row.grid.latitude.toFixed(3)}, ${row.grid.longitude.toFixed(3)}, ${row.grid.elevationM} m) — a model's value, not a sighting`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    process.stderr.write(`air: INVALID — ${args.error}\n${USAGE}\n`);
    return 2;
  }
  if (args.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  const place = Reckoning.STANDING.place;
  const row = await ask(place);
  process.stdout.write(`${describe(row)}\n`);
  if (!args.print) {
    let rows = [];
    if (fs.existsSync(AIR_FILE)) {
      rows = JSON.parse(fs.readFileSync(AIR_FILE, 'utf8'));
      if (!Array.isArray(rows)) {
        process.stderr.write('air: reckoning/air.json is not a list; refusing to write over it\n');
        return 2;
      }
    }
    rows.push(row);
    fs.writeFileSync(AIR_FILE, `${JSON.stringify(rows, null, 2)}\n`);
  }
  return row.failed ? 1 : 0;
}

if (require.main === module) {
  main().then((code) => process.exit(code));
}

module.exports = { parseArgs, readingProblem };
