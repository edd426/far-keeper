// The air section of the reckoning room, in a real browser. Day 58.
//
//   ./scripts/local-snapshot.sh tools/air-page.js
//
// `air.json` is forged on the wire (page.route), never on disk, into each of
// the section's four states, and each state is held to its own sentence:
//
//   A  the real file            a reading: sea level first, no forbidden word
//   B  newest ask failed        NOT READ, the reason, and the older good row
//                               nowhere on the page
//   C  rows for another place   no reading here yet, the other city's air absent
//   D  the file will not open   says so, puts nothing in the gap
//   E  a reading 5 days old     OLD, and a fresh one never says OLD
//
// Then two sabotages on the wire, written before the needles (Day 43's
// habit): take out the call that starts the section, and collapse the failed
// branch into the reading branch. Each asserts its substitution landed and
// that the page still ran (Day 56: a sabotage that never ran prints no FAIL).
//
// The standing place is asked of the instrument, never typed, so this suite
// moves with the tower (Day 24).

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;
const ROOT = path.join(__dirname, '..');
const Reckoning = require(path.join(ROOT, 'reckoning', 'reckoning.js'));
const HERE = Reckoning.STANDING.place;
const REAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'reckoning', 'air.json'), 'utf8'));
const FORBIDDEN = /observ/i;

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

function row(over) {
  return Object.assign({
    fetchedAt: new Date(Date.now() - 3600000).toISOString(),
    source: 'api.open-meteo.com',
    place: { name: HERE.name, latitude: HERE.latitude, longitude: HERE.longitude },
    modelTime: new Date(Date.now() - 3600000).toISOString().slice(0, 16) + 'Z',
    temperatureC: 3.3,
    surfacePressureHPa: 1001.2,
    seaLevelPressureHPa: 1003.4,
    grid: { latitude: HERE.latitude, longitude: HERE.longitude, elevationM: 16 },
  }, over);
}

async function section(browser, { body, status, sabotage }) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  let landed = null;
  if (body !== undefined || status !== undefined) {
    await page.route('**/reckoning/air.json*', (route) => route.fulfill({
      status: status || 200, contentType: 'application/json', body: body === undefined ? '' : body,
    }));
  }
  if (sabotage) {
    await page.route('**/reckoning/page.js*', async (route) => {
      const res = await route.fetch();
      const before = await res.text();
      const after = sabotage(before);
      landed = after !== before;
      await route.fulfill({ response: res, body: after });
    });
  }
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const got = await page.evaluate(() => {
    const s = document.getElementById('air-heading')?.closest('section');
    const report = document.getElementById('air-report');
    return {
      text: s ? s.innerText : '',
      report: report ? report.innerText : '',
      terms: Array.from(document.querySelectorAll('#air-figures dt')).map((d) => d.textContent.trim()),
      ran: !!document.querySelector('#today-figures:not([hidden])'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  got.landed = landed;
  got.errors = errors;
  await page.close();
  return got;
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // A — the real file.
  // The real file may hold no row for the standing place — the first
  // minutes after a move, or the rehearsal's moved copy — and then the
  // honest page is case C's sentence, not a failure of this suite (Day 55).
  const mine = REAL.filter((r) => r.place && r.place.name === HERE.name &&
    r.place.latitude === HERE.latitude && r.place.longitude === HERE.longitude);
  console.log(`      the real air.json holds ${mine.length} row(s) for ${HERE.name}`);
  const newest = mine[mine.length - 1];
  const a = await section(browser, {});
  check(a.errors.length === 0, `A: no page errors (${a.errors.join('; ') || 'none'})`);
  check(a.text.length > 0, 'A: the air section exists');
  if (newest && !newest.failed) {
    check(a.terms[0] === 'pressure at sea level', `A: sea level leads (${a.terms[0]})`);
    check(a.report.includes(newest.seaLevelPressureHPa.toFixed(1) + ' hPa'), `A: prints the real sea-level figure ${newest.seaLevelPressureHPa}`);
    check(a.report.includes(newest.grid.elevationM + ' m'), 'A: prints the ground height the model used');
    check(a.terms.includes('coordinates asked'), 'A: prints the coordinates asked');
    check(a.terms.includes('asked at') && a.terms.includes('the model’s time'), 'A: prints when it was asked and the model’s own time');
    check(/api\.open-meteo\.com/.test(a.report), 'A: names the source');
  } else if (newest) {
    check(/NOT READ/.test(a.report), 'A: the real newest row is a failure and the page says NOT READ');
  } else {
    check(new RegExp(`No reading of the air over ${HERE.name}`).test(a.report), 'A: no row here yet, and the page says so');
  }
  check(!FORBIDDEN.test(a.text), 'A: the section never says observed (or any word from its root)');
  check(!/NaN|undefined/.test(a.text), 'A: no NaN or undefined in the section');
  check(a.overflow <= 0, `A: no sideways scroll at 390 (${a.overflow})`);

  // B — the newest ask failed; an older good row with a figure nobody else prints.
  const bBody = JSON.stringify([
    row({ fetchedAt: new Date(Date.now() - 26 * 3600000).toISOString(), seaLevelPressureHPa: 987.6 }),
    { fetchedAt: new Date(Date.now() - 600000).toISOString(), source: 'api.open-meteo.com',
      place: { name: HERE.name, latitude: HERE.latitude, longitude: HERE.longitude },
      failed: 'no answer within 30 seconds' },
  ]);
  check(bBody.includes('987.6') && bBody.includes('"failed"'), 'B: the forgery holds an older good row and a newer failure');
  const b = await section(browser, { body: bBody });
  check(/NOT READ/.test(b.report), 'B: the page says NOT READ');
  check(b.report.includes('no answer within 30 seconds'), 'B: and gives the reason');
  check(!b.report.includes('987.6'), 'B: the older good reading is not printed in the gap');
  check(b.terms.length === 0, `B: no figures are drawn (${b.terms.length})`);
  check(!FORBIDDEN.test(b.text), 'B: no forbidden word');

  // C — only another place's air.
  const cBody = JSON.stringify([row({ place: { name: 'Elsewhere', latitude: 0, longitude: 0 }, seaLevelPressureHPa: 976.5 })]);
  const c = await section(browser, { body: cBody });
  check(new RegExp(`No reading of the air over ${HERE.name}`).test(c.report), 'C: says no reading here yet, naming the standing city');
  check(!c.report.includes('976.5'), 'C: the other place’s air is not printed');

  // D — the file will not open, two ways.
  const d1 = await section(browser, { status: 404, body: 'nope' });
  check(/would not\s+open/.test(d1.report), 'D: a 404 says the record would not open');
  const d2 = await section(browser, { body: '{not json' });
  check(/would not\s+open/.test(d2.report), 'D: a body that is not JSON says the same');
  check(!/reading the air…/.test(d1.report + d2.report), 'D: the placeholder does not stand for ever');

  // E — a reading five days old.
  const e = await section(browser, { body: JSON.stringify([row({ fetchedAt: new Date(Date.now() - 5 * 86400000).toISOString() })]) });
  check(/OLD\. This reading was asked for 5 days ago/.test(e.report), 'E: a five-day-old reading says OLD and how old');
  const fresh = await section(browser, { body: JSON.stringify([row({})]) });
  check(fresh.terms.length > 0 && !/OLD\./.test(fresh.report), 'E: a fresh reading draws figures and does not say OLD');

  // Sabotage 1 — the section is never started.
  const s1 = await section(browser, { body: bBody, sabotage: (t) => t.replace('    startAir();\n', '\n') });
  check(s1.landed === true, 'sabotage 1: the startAir() call was removed on the wire');
  check(s1.ran, 'sabotage 1: the rest of the page still ran');
  check(!/NOT READ/.test(s1.report), 'sabotage 1: with the call gone, case B’s sentence is absent, so case B was measuring the section');

  // Sabotage 2 — a failed row drawn as though it were a reading.
  const s2 = await section(browser, { body: bBody, sabotage: (t) => t.replace('if (row.failed) {', 'if (false) {') });
  check(s2.landed === true, 'sabotage 2: the failed branch was collapsed on the wire');
  check(s2.ran, 'sabotage 2: the rest of the page still ran');
  check(!/NOT READ/.test(s2.report), 'sabotage 2: without the branch there is no NOT READ, so case B was measuring the branch');

  await browser.close();
  console.log('');
  if (problems.length) {
    console.log(`FAIL — ${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log('PASS — the air prints what came, says so when nothing came, and never borrows another reading or another city.');
})().catch((error) => { console.error(error); process.exit(2); });
