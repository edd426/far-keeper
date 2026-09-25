// tools/clock-law.js — does a row recomputed on a different clock law get
// the account it is owed, and only that row?
//
//     ./scripts/local-snapshot.sh tools/clock-law.js
//
// Built Day 53, from Ember's objection to the Nuuk pledge. Nuuk's clock was
// moved by law in 2023; a browser whose time-zone data predates that works
// out every Nuuk row with an offset an hour off. Until today the ledger then
// said DRIFTED and, the row being on the current method, gave it the
// forgery sentence: *the tower has no innocent account of this row*. It
// has one. `reckoning/page.js` now forks on evidence: the row carries the
// offset it was written with, the browser has just computed its own.
//
// Nothing here touches reckoning/ledger.json. The ledger is forged on the
// wire (Day 10, Day 11). A browser with old tz data cannot be conjured, so
// the forgery runs the other way round: the row is rewritten as though it
// had been published under a clock law one hour different from the one this
// browser holds. The two cases are symmetric in what the page can see.
//
// Three cases, and the sabotage was written before the needles (Day 43):
//
//   A. a row whose offset and clock times all moved by one hour together:
//      DRIFTED, the clock-law note, and NOT the forgery sentence.
//   B. a row with one sunrise edited by a minute and its offset untouched:
//      DRIFTED, the forgery sentence, and NOT the clock-law note. Case A's
//      fork must not become a door every edit walks through.
//   S. the fork sabotaged on the wire (`clockOffsetMoved(...)` → `false`):
//      case A must now get the forgery sentence, or this suite could not
//      tell the fork from its absence.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;
const LEDGER = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'reckoning', 'ledger.json'), 'utf8'));

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

const FORGERY = /no innocent account/;
const CLOCK_LAW = /a disagreement about a law, not about the sun/;

function shiftClock(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number);
  const t = ((h * 60 + m + minutes) % 1440 + 1440) % 1440;
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
}

function entriesOf(ledger) { return Array.isArray(ledger) ? ledger : ledger.entries; }

// The newest lit row on the current method: the only kind the forgery
// sentence is ever printed under.
function target(ledger) {
  const rows = entriesOf(ledger);
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (!r.never && typeof r.utcOffsetMinutes === 'number' && r.method) return i;
  }
  return -1;
}

function forged(mutate) {
  const copy = JSON.parse(JSON.stringify(LEDGER));
  const i = target(copy);
  mutate(entriesOf(copy)[i]);
  return { body: JSON.stringify(copy), date: entriesOf(copy)[i].date, row: entriesOf(copy)[i] };
}

async function rowFor(browser, ledgerBody, date, sabotage) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let landed = null;
  await page.route('**/ledger.json*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: ledgerBody }));
  if (sabotage) {
    await page.route('**/reckoning/page.js*', async (route) => {
      const res = await route.fetch();
      const before = await res.text();
      const after = before.replace('} else if (clockOffsetMoved(published, fresh)) {', '} else if (false) {');
      landed = after !== before;
      await route.fulfill({ response: res, body: after });
    });
  }
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ledger__entry');
  const row = await page.$$eval('.ledger__entry', (rows, d) => {
    const hit = rows.find((r) => (r.querySelector('.ledger__date')?.textContent || '').trim() === d);
    if (!hit) return null;
    return {
      word: (hit.querySelector('.ledger__verdict')?.textContent || '').trim().split(' ')[0],
      notes: Array.from(hit.querySelectorAll('.ledger__note')).map((n) => n.textContent.trim())
    };
  }, date);
  await page.close();
  return { row, landed };
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  const i = target(LEDGER);
  check(i >= 0, `a lit current-method row exists to forge (index ${i})`);

  // Case A: published under a clock one hour different.
  const a = forged((r) => {
    r.utcOffsetMinutes += 60;
    r.sunrise = shiftClock(r.sunrise, 60);
    r.sunset = shiftClock(r.sunset, 60);
    r.solarNoon = shiftClock(r.solarNoon, 60);
  });
  check(a.body !== JSON.stringify(LEDGER), `case A: the forged ledger differs from the real one (${a.date}, offset now ${a.row.utcOffsetMinutes})`);
  const ra = await rowFor(browser, a.body, a.date, false);
  check(!!ra.row, `case A: the forged row ${a.date} was drawn`);
  if (ra.row) {
    check(ra.row.word === 'DRIFTED', `case A: the row says DRIFTED (${ra.row.word})`);
    check(ra.row.notes.some((n) => CLOCK_LAW.test(n)), 'case A: the row is given the clock-law account');
    check(!ra.row.notes.some((n) => FORGERY.test(n)), 'case A: the row is NOT told it has no innocent account');
    const note = ra.row.notes.find((n) => CLOCK_LAW.test(n)) || '';
    const named = [...new Set(note.match(/UTC[+−]\d+(?:\.\d+)?/g) || [])];
    check(named.length === 2, `case A: the note names two different offsets (${named.join(' / ')})`);
  }

  // Case B: one edited sunrise, the clock untouched.
  const b = forged((r) => { r.sunrise = shiftClock(r.sunrise, 1); });
  const rb = await rowFor(browser, b.body, b.date, false);
  check(!!rb.row, `case B: the forged row ${b.date} was drawn`);
  if (rb.row) {
    check(rb.row.word === 'DRIFTED', `case B: the row says DRIFTED (${rb.row.word})`);
    check(rb.row.notes.some((n) => FORGERY.test(n)), 'case B: an edit with the clock untouched still gets the forgery sentence');
    check(!rb.row.notes.some((n) => CLOCK_LAW.test(n)), 'case B: and is NOT handed the clock-law account');
  }

  // Sabotage: the fork removed on the wire. Case A must now fall to the
  // forgery sentence, or the case A checks above could not tell the fork
  // from its absence.
  const rs = await rowFor(browser, a.body, a.date, true);
  check(rs.landed === true, 'sabotage: the fork was removed on the wire (the substitution landed)');
  if (rs.row) {
    check(rs.row.notes.some((n) => FORGERY.test(n)) && !rs.row.notes.some((n) => CLOCK_LAW.test(n)),
      'sabotage: without the fork, case A is given the forgery sentence, so case A above was measuring the fork');
  } else {
    check(false, 'sabotage: the row was drawn');
  }

  await browser.close();
  console.log('');
  if (problems.length) {
    console.log(`FAIL — ${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log('PASS — a row recomputed on a different clock law is told so, an edit is not, and the fork is what tells them apart.');
})().catch((error) => { console.error(error); process.exit(2); });
