// The outside almanac section of the reckoning room, in a real browser. Day 59.
//
//   ./scripts/local-snapshot.sh tools/almanac-page.js
//
// `almanac.json` is forged on the wire (page.route), never on disk. Every
// forged answer is built from what `almanacComparands` says for the standing
// place, so the suite moves with the tower (Day 24) and needs no typed time.
//
//   A  the real file             a reading: both ends, the wager, the series,
//                                and never the word for bare agreement
//   B  printed length in A only  the wager names A
//   C  printed length in B only  the wager names B
//   D  sets that overlap         says the minute cannot separate them, no side
//   E  printed length in neither says so and does not move it to the nearest
//   F  newest ask failed         NOT READ and the reason; older answer absent
//   G  only another place        not yet asked here; the other answer absent
//   H  the file will not open    says so
//   I  the stored wager differs  DRIFTED
//   J  an answer 5 days old      OLD
//   K  Tokyo, asked two UTC days the printed length is set less rise across
//                                the two days, and lands in A's set (Day 60)
//   L  Tokyo, asked one UTC day  NOT COMPARED: the rise is the next morning's
//                                (Day 59's single ask, as it would have been)
//
// K and L stand the tower at Tokyo on the wire, where the sunrise falls on
// the UTC day before; both assert the forgery landed and that the place
// really straddles, or they would have an empty domain (Ember, Day 60).
//
// Ember's caution, kept as a check: D needs a date whose two sets really
// overlap and B/C a date whose sets do not. Both are searched for over the
// coming year at the standing place, and the suite asserts it found each
// (an empty domain always says yes). Then three sabotages on the wire,
// written before the needles: the section never started, the wager's fork
// collapsed to always-A, and the sets typed instead of computed. Each asserts
// it landed and that the page still ran.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;
const ROOT = path.join(__dirname, '..');
const R = require(path.join(ROOT, 'reckoning', 'reckoning.js'));
const HERE = R.STANDING.place;
const REAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'reckoning', 'almanac.json'), 'utf8'));
// The institution's own name carries *Observatory*, and naming the source is
// owed (Article IV). What is forbidden is the claim, so the needle is the
// verb and its noun, not the root.
const FORBIDDEN = /\bagree|\bobserved\b|\bobservation/i;

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

function hhmm(minutes) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

function shift(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// A date at the standing place whose two sets do / do not share a value.
function findDate(wantOverlap) {
  const start = R.todayAt(HERE.zone);
  for (let i = 0; i < 400; i++) {
    const date = shift(start, i);
    const c = R.almanacComparands(date, HERE);
    if (!c) continue;
    const a = R.printedLengthsFor(c.A.dayLengthMinutes), b = R.printedLengthsFor(c.B.dayLengthMinutes);
    const overlap = a.some((k) => b.includes(k));
    if (overlap === wantOverlap) return { date, c, a, b };
  }
  return null;
}

// An answer whose printed length is `length`, rise at A's rounded minute.
function answer(date, c, length, over) {
  const rise = Math.round(c.A.riseUTC);
  const a = R.printedLengthsFor(c.A.dayLengthMinutes), b = R.printedLengthsFor(c.B.dayLengthMinutes);
  return Object.assign({
    date, source: 'aa.usno.navy.mil',
    place: { name: HERE.name, latitude: HERE.latitude, longitude: HERE.longitude, zone: HERE.zone },
    wager: { computedAt: new Date(Date.now() - 3600000).toISOString(), method: R.METHOD,
      A: { dayLengthMinutes: c.A.dayLengthMinutes, allowed: a },
      B: { dayLengthMinutes: c.B.dayLengthMinutes, allowed: b } },
    fetchedAt: new Date(Date.now() - 3600000).toISOString(),
    tz: 0,
    printedUTC: { rise: hhmm(rise), transit: null, set: hhmm(rise + length) },
  }, over);
}

async function section(browser, { body, status, sabotage, standAt }) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  let landed = null;
  if (body !== undefined || status !== undefined) {
    await page.route('**/reckoning/almanac.json*', (route) => route.fulfill({
      status: status || 200, contentType: 'application/json', body: body === undefined ? '' : body,
    }));
  }
  let stood = null;
  if (standAt) {
    await page.route('**/reckoning/reckoning.js*', async (route) => {
      const res = await route.fetch();
      const before = await res.text();
      const after = before.replace(/var STANDING = \{\s*place:[\s\S]*?since:/,
        'var STANDING = { place: ' + JSON.stringify(standAt) + ', since:');
      stood = after !== before;
      await route.fulfill({ response: res, body: after });
    });
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
    const s = document.getElementById('almanac-heading')?.closest('section');
    const report = document.getElementById('almanac-report');
    const wager = document.getElementById('almanac-wager');
    return {
      text: s ? s.innerText : '',
      report: report ? report.innerText : '',
      wager: wager ? wager.innerText : '',
      wagerClass: wager ? wager.className : '',
      series: document.getElementById('almanac-series')?.innerText || '',
      ends: document.getElementById('almanac-ends')?.innerText || '',
      ran: !!document.querySelector('#today-figures:not([hidden])'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  got.landed = landed;
  got.stood = stood;
  got.errors = errors;
  await page.close();
  return got;
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  const apart = findDate(false);
  const together = findDate(true);
  check(!!apart, `domain: a date at ${HERE.name} whose two sets do not overlap (${apart && apart.date})`);
  check(!!together, `domain: a date at ${HERE.name} whose two sets overlap (${together && together.date})`);
  if (!apart || !together) {
    await browser.close();
    console.log(`\nFAIL — ${problems.length} problem(s); the cases below need both kinds of day.`);
    process.exit(1);
  }

  // A — the real file.
  const mine = REAL.filter((r) => r.place && r.place.name === HERE.name &&
    r.place.latitude === HERE.latitude && r.place.longitude === HERE.longitude);
  console.log(`      the real almanac.json holds ${mine.length} row(s) for ${HERE.name}`);
  const newest = mine[mine.length - 1];
  const a = await section(browser, {});
  check(a.errors.length === 0, `A: no page errors (${a.errors.join('; ') || 'none'})`);
  if (newest && !newest.failed && newest.printedUTC) {
    check(a.ends.includes(newest.printedUTC.rise + ' UTC') && a.ends.includes(newest.printedUTC.set + ' UTC'),
      'A: both printed minutes appear, labelled UTC');
    check(/Method A says \d\d:\d\d:\d\d UTC and method B \d\d:\d\d:\d\d UTC/.test(a.ends), 'A: each method to the second');
    check(/rounds to the nearest minute/.test(a.ends) && /cuts the seconds off/.test(a.ends), 'A: both rules a printed minute might mean');
    check(a.wager.length > 0, 'A: the wager is printed');
    check(/Across the record: \d+ day/.test(a.series), 'A: the series line is printed');
    check(/aa\.usno\.navy\.mil/.test(a.report) && /asked at/.test(a.report), 'A: names the source and when it was asked');
  } else if (newest) {
    check(/NOT READ/.test(a.report), 'A: the real newest row is a failure and the page says NOT READ');
  } else {
    check(new RegExp(`not yet\\s+been asked about ${HERE.name}`).test(a.report), 'A: not asked here yet, and the page says so');
  }
  check(!FORBIDDEN.test(a.text), 'A: the section never says agree or observed');
  check(!/NaN|undefined/.test(a.text), 'A: no NaN or undefined in the section');
  check(a.overflow <= 0, `A: no sideways scroll at 390 (${a.overflow})`);

  // B and C — each side of a disjoint wager.
  const bBody = JSON.stringify([answer(apart.date, apart.c, apart.a[0])]);
  const b = await section(browser, { body: bBody });
  check(/is in A’s set and not in B’s/.test(b.wager) && /almanac-A/.test(b.wagerClass),
    `B: a printed ${apart.a[0]} on ${apart.date} names A`);
  const cBody = JSON.stringify([answer(apart.date, apart.c, apart.b[apart.b.length - 1])]);
  const c = await section(browser, { body: cBody });
  check(/is in B’s set and not in A’s/.test(c.wager) && /almanac-B/.test(c.wagerClass),
    `C: a printed ${apart.b[apart.b.length - 1]} on ${apart.date} names B`);

  // D — overlapping sets.
  const shared = together.a.find((k) => together.b.includes(k));
  const d = await section(browser, { body: JSON.stringify([answer(together.date, together.c, shared)]) });
  check(/cannot separate the methods today/.test(d.wager) && /almanac-both/.test(d.wagerClass),
    `D: on ${together.date} a shared ${shared} cannot separate them`);
  check(!/is in A’s set|is in B’s set/.test(d.wager), 'D: and names no side');

  // E — in neither set.
  const far = Math.max(...apart.a, ...apart.b) + 3;
  const e = await section(browser, { body: JSON.stringify([answer(apart.date, apart.c, far)]) });
  check(new RegExp(`${far} is in neither set`).test(e.wager) && /almanac-neither/.test(e.wagerClass), `E: a printed ${far} is in neither set`);
  check(e.wager.includes(`almanac’s day is ${far} minutes`), 'E: printed as it came');

  // F — newest ask failed; an older answer with a minute nobody else prints.
  const older = answer(apart.date, apart.c, apart.a[0], { printedUTC: { rise: '00:07', transit: null, set: '00:08' } });
  const fBody = JSON.stringify([older, { date: apart.date, source: 'aa.usno.navy.mil',
    place: older.place, wager: older.wager, fetchedAt: new Date().toISOString(),
    failed: 'no answer within 30 seconds' }]);
  check(fBody.includes('00:07') && fBody.includes('"failed"'), 'F: the forgery holds an older answer and a newer failure');
  const f = await section(browser, { body: fBody });
  check(/NOT READ/.test(f.report) && f.report.includes('no answer within 30 seconds'), 'F: NOT READ, with the reason');
  check(!f.ends && !f.wager, 'F: no ends and no wager drawn');

  // G — only another place.
  const g = await section(browser, { body: JSON.stringify([answer(apart.date, apart.c, apart.a[0],
    { place: { name: 'Elsewhere', latitude: 0, longitude: 0, zone: 'UTC' } })]) });
  check(new RegExp(`not yet\\s+been asked about ${HERE.name}`).test(g.report), 'G: not yet asked here, naming the standing city');
  check(!g.wager, 'G: the other place’s answer is not drawn');

  // H — the file will not open.
  const h = await section(browser, { status: 404, body: 'nope' });
  check(/would\s+not open/.test(h.report) && !/reading the almanac…/.test(h.report), 'H: a 404 says the record would not open');

  // I — the stored wager differs from the recomputed one.
  const iRow = answer(apart.date, apart.c, apart.a[0]);
  iRow.wager.A.allowed = [1, 2];
  const i = await section(browser, { body: JSON.stringify([iRow]) });
  check(/DRIFTED\./.test(i.report) && i.report.includes('as A {1, 2}'), 'I: a stored wager that differs says DRIFTED and quotes it');
  check(!/DRIFTED/.test(b.report), 'I: and an honest stored wager does not');

  // J — five days old.
  const j = await section(browser, { body: JSON.stringify([answer(apart.date, apart.c, apart.a[0],
    { fetchedAt: new Date(Date.now() - 5 * 86400000).toISOString() })]) });
  check(/OLD\. The almanac was last asked 5 days ago/.test(j.report), 'J: five days old says OLD');
  check(!/OLD\./.test(b.report), 'J: a fresh answer does not');

  // K and L — a place whose day straddles midnight UTC (Day 60).
  const TOKYO = { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, zone: 'Asia/Tokyo' };
  const kDate = '2026-10-04';
  const kc = R.almanacComparands(kDate, TOKYO);
  check(!!kc && kc.A.riseUTC < 0 && kc.A.setUTC >= 0 && kc.A.setUTC < 1440,
    `K: domain — at Tokyo on ${kDate} the sunrise falls on the UTC day before (${kc && kc.A.riseUTC.toFixed(1)} min)`);
  const kAllowA = R.printedLengthsFor(kc.A.dayLengthMinutes), kAllowB = R.printedLengthsFor(kc.B.dayLengthMinutes);
  const kOnlyA = kAllowA.find((k) => !kAllowB.includes(k));
  const kRise = Math.round(kc.A.riseUTC);
  function tokyoRow(over) {
    return Object.assign({
      date: kDate, source: 'aa.usno.navy.mil', place: TOKYO,
      wager: { computedAt: new Date(Date.now() - 3600000).toISOString(), method: R.METHOD,
        A: { dayLengthMinutes: kc.A.dayLengthMinutes, allowed: kAllowA },
        B: { dayLengthMinutes: kc.B.dayLengthMinutes, allowed: kAllowB } },
      fetchedAt: new Date(Date.now() - 3600000).toISOString(), tz: 0,
      printedUTC: { rise: hhmm(kRise), transit: null, set: hhmm(kRise + kOnlyA) },
      utcDates: { rise: shift(kDate, -1), set: kDate },
    }, over);
  }
  check(kOnlyA !== undefined, `K: domain — a length in A's set and not B's at Tokyo (${kOnlyA})`);
  const kBody = JSON.stringify([tokyoRow()]);
  const k = await section(browser, { body: kBody, standAt: TOKYO });
  check(k.stood === true, 'K: the tower was stood at Tokyo on the wire');
  check(k.errors.length === 0, `K: no page errors (${k.errors.join('; ') || 'none'})`);
  check(new RegExp(`almanac’s day is ${kOnlyA} minutes`).test(k.wager) && /almanac-A/.test(k.wagerClass),
    `K: set less rise across two UTC days is ${kOnlyA}, in A's set`);
  check(k.ends.includes(`UTC on ${shift(kDate, -1)}`), 'K: the sunrise is labelled with the UTC day it was printed for');
  check(!/NOT COMPARED/.test(k.report), 'K: and is compared');
  // L — the same place asked once, as the Day 59 tool did: that UTC day's Rise
  // is the next local morning's.
  const lc = R.almanacComparands(shift(kDate, 1), TOKYO);
  const lBody = JSON.stringify([tokyoRow({ printedUTC: { rise: hhmm(lc.A.riseUTC + 1440), transit: null,
    set: hhmm(kc.A.setUTC) }, utcDates: undefined })]);
  check(!lBody.includes('utcDates'), 'L: the forged row has no utcDates, so it reads as one ask of its own date');
  const l = await section(browser, { body: lBody, standAt: TOKYO });
  check(l.stood === true, 'L: the tower was stood at Tokyo on the wire');
  check(/NOT COMPARED\./.test(l.report) && /sunrise this row holds/.test(l.report), 'L: the next morning\'s sunrise is NOT COMPARED');
  check(!l.wager && !/in neither set/.test(l.report), 'L: and no wager is drawn, so no finding is manufactured');

  // Sabotage 1 — the section is never started.
  const s1 = await section(browser, { body: bBody, sabotage: (t) => t.replace('    startAlmanac();\n', '\n') });
  check(s1.landed === true, 'sabotage 1: the startAlmanac() call was removed on the wire');
  check(s1.ran, 'sabotage 1: the rest of the page still ran');
  check(!/is in A’s set/.test(s1.report), 'sabotage 1: case B’s sentence is gone, so case B was measuring the section');

  // Sabotage 2 — the fork collapsed: every printed length names A.
  const s2 = await section(browser, { body: cBody,
    sabotage: (t) => t.replace("if (inB && !inA) return 'B';", "if (inB && !inA) return 'A';") });
  check(s2.landed === true, 'sabotage 2: the B branch was collapsed on the wire');
  check(s2.ran, 'sabotage 2: the rest of the page still ran');
  check(!/is in B’s set and not in A’s/.test(s2.wager), 'sabotage 2: case C no longer names B, so case C was measuring the fork');

  // Sabotage 3 — the sets typed rather than computed from the methods.
  const s3 = await section(browser, { body: JSON.stringify([answer(together.date, together.c, shared)]),
    sabotage: (t) => t.replace('var allowA = R.printedLengthsFor(ours.A.dayLengthMinutes);', 'var allowA = [679, 680];')
      .replace('var allowB = R.printedLengthsFor(ours.B.dayLengthMinutes);', 'var allowB = [681, 682];') });
  check(s3.landed === true, 'sabotage 3: the sets were typed on the wire');
  check(s3.ran, 'sabotage 3: the rest of the page still ran');
  check(!/cannot separate the methods today/.test(s3.wager), 'sabotage 3: with typed sets case D goes wrong, so case D was measuring the computation');

  // Sabotage 4 — the page ignores which UTC day a printed time belongs to.
  const s4 = await section(browser, { body: kBody, standAt: TOKYO,
    sabotage: (t) => t.replace('var day = row.utcDates && row.utcDates[name];', 'var day = null;') });
  check(s4.landed === true && s4.stood === true, 'sabotage 4: utcDates ignored, and the tower at Tokyo, both on the wire');
  check(s4.ran, 'sabotage 4: the rest of the page still ran');
  check(!/almanac-A/.test(s4.wagerClass), 'sabotage 4: case K no longer lands in A, so case K was measuring the day offset');

  // Sabotage 5 — the wrong-day guard removed.
  const s5 = await section(browser, { body: lBody, standAt: TOKYO,
    sabotage: (t) => t.replace('var wrongEnd = wrongDayEnd(row, ours);', 'var wrongEnd = null;') });
  check(s5.landed === true && s5.stood === true, 'sabotage 5: the wrong-day guard removed, the tower at Tokyo');
  check(s5.ran, 'sabotage 5: the rest of the page still ran');
  check(/in neither set/.test(s5.wager), 'sabotage 5: without the guard case L manufactures a finding, so case L was measuring the guard');

  await browser.close();
  console.log('');
  if (problems.length) {
    console.log(`FAIL — ${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log('PASS — the almanac is printed beside both methods, the wager is computed and forked four ways, a day across midnight UTC is joined or refused, and nothing says agree.');
})().catch((error) => { console.error(error); process.exit(2); });
