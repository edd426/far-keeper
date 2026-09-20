#!/usr/bin/env node
// Does a reader actually get the band hedge, and does it go quiet where
// it should? Day 48.
//
// `renderStepOutsideItsBand` exists because the page tells a reader to
// mark a tree and prints the step *along your skyline* — the reader's own
// horizon, in front of a flat-plain number — and the only measurement
// that ever married those two was swept at Paris. Outside about 57° it
// does not hold. So the page says so, on the mornings it applies.
//
// Three things this file is careful about, all of them paid for by this
// house before today.
//
// **The quiet case is a case.** A hedge that never goes quiet is a hedge
// a reader stops reading (Day 40), so the silence inside the band is
// asserted as hard as the speech outside it, and the fixture that makes
// it quiet is forged rather than waited for.
//
// **The domain is asserted before the branch is judged.** An empty domain
// always says yes, in the voice of a check that worked — eighth instance
// in this house and counting. So every sweep here first asserts it found
// the thing it is about to make a claim over.
//
// **It reads the sentence, not the section.** A case that sweeps the whole
// report cannot tell which verdict answered it (Day 35). The band hedge
// has its own mount, `#rising-band`, and every assertion here reads that
// mount alone — never the room, never `#rising-note` beside it.
'use strict';

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const BAND = '#rising-band';

let failures = 0;
function ok(what) { console.log('ok    ' + what); }
function bad(what, why) { failures += 1; console.log('FAIL  ' + what + (why ? ' — ' + why : '')); }
function check(cond, what, why) { if (cond) ok(what); else bad(what, why); }

// Forge STANDING on the wire, never on disk (the ledger-verdicts trick).
// The module is rewritten as it is served, so nothing in the tree moves.
async function withStanding(page, place, then) {
  let landed = false;
  await page.route('**/reckoning.js*', async (route) => {
    const res = await route.fetch();
    const before = await res.text();
    const body = before.replace(
      /var STANDING = \{\s*place: [A-Z_]+,/,
      'var STANDING = { place: ' + JSON.stringify(place) + ','
    );
    landed = body !== before;
    await route.fulfill({ response: res, body });
  });
  await page.goto(URL + '/reckoning/', { waitUntil: 'networkidle' });
  await then(landed);
  await page.unroute('**/reckoning.js*');
}

async function bandText(page) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    return { hidden: el.hidden, text: (el.textContent || '').trim() };
  }, BAND);
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.FAR_KEEPER_CHROMIUM_PATH });
  const page = await browser.newPage();

  // ---- 1. The mount exists at all ----
  await page.goto(URL + '/reckoning/', { waitUntil: 'networkidle' });
  const mountExists = await page.evaluate((sel) => !!document.querySelector(sel), BAND);
  check(mountExists, 'the band hedge has a mount on the page');
  if (!mountExists) {
    console.log('FAIL — nothing below can mean anything without it.');
    await browser.close();
    process.exit(1);
  }

  // ---- 2. As the tower stands, unforged ----
  //
  // Deliberately not asserted as "speaks" or "is quiet": which one is
  // right depends on where the tower is this week, and a case that pins
  // today's answer expires the Sunday after it is written (Day 17). What
  // is asserted is that the page and the witness agree about which.
  const live = await bandText(page);
  const band = await page.evaluate(() => ({
    edge: Reckoning.STEP_ROBUSTNESS_WITNESS.lastLatitudeUnderOneSunWidthDegrees,
    lat: Reckoning.STANDING.place.latitude,
    name: Reckoning.STANDING.place.name
  }));
  const outside = Math.abs(band.lat) > band.edge;
  check(
    outside ? (!live.hidden && live.text.length > 0) : (live.hidden || live.text.length === 0),
    'as the tower stands (' + band.name + ', ' + band.lat.toFixed(1) + '°, band edge ' +
      band.edge + '°) the hedge ' + (outside ? 'speaks' : 'is quiet'),
    'the page and the witness disagree about whether this place is inside the band'
  );

  // ---- 3. Forged well inside the band: it must go quiet ----
  await withStanding(page, { name: 'Testbed', latitude: 12, longitude: 0, zone: 'Etc/UTC' },
    async (landed) => {
      check(landed, 'the inside-the-band forgery landed in the served module');
      const b = await bandText(page);
      check(b !== null, 'and the mount is still there under the forgery');

      // The domain, asserted before the branch is judged — and this case
      // taught it to itself. With the `renderStepOutsideItsBand()` call
      // deleted the assertion below stayed **green**, because a page that
      // drew nothing is silent in exactly the way a page that correctly
      // chose silence is. An empty domain always says yes, in the voice of
      // a check that worked (ninth instance here, and the third inside a
      // file that quotes the rule in its own header). So the neighbouring
      // mount must have drawn before this silence means anything.
      const drew = await page.evaluate(() => {
        const el = document.querySelector('#rising-note');
        return !!el && (el.textContent || '').trim().length > 0;
      });
      check(drew, 'and the rising-point section itself drew, so the silence below is a choice',
        'nothing rendered at all — the quiet case cannot tell that from a correct silence');
      check(drew && b && (b.hidden || b.text.length === 0),
        'inside the band the hedge says nothing at all',
        'it spoke at 12° — the quiet branch is what keeps this from being an alarm a keeper stops reading');
    });

  // ---- 4. Forged outside the band: it must speak, and say the right things ----
  await withStanding(page, { name: 'Testbed', latitude: 75, longitude: 0, zone: 'Etc/UTC' },
    async (landed) => {
      check(landed, 'the outside-the-band forgery landed in the served module');
      const b = await bandText(page);
      check(b && !b.hidden && b.text.length > 0,
        'outside the band the hedge speaks');
      if (!b || !b.text) { bad('and nothing below has a sentence to read'); return; }

      check(/75/.test(b.text), 'and it names the standing latitude');
      check(new RegExp(String(band.edge)).test(b.text), 'and it names the band edge it is outside of');
      check(/Testbed/.test(b.text), 'and it names the place');

      // The whole distinction this hedge is built on. It is a verdict on
      // the evidence, never on the number, and the wording must not drift
      // toward "wrong" — Day 31's rule for `unwitnessed latitude`, which
      // this is the second instance of.
      check(/still correct|still the flat-plain step/.test(b.text),
        'and it says outright the printed figure is still correct',
        'without that this reads as an accusation against a number that is right');
      check(!/\bwrong\b|\bsuspicious\b|may be wrong|unreliable/i.test(b.text),
        'and it never calls the number wrong, suspicious or unreliable',
        'a flag that drifts toward a diagnosis manufactures an alarm the measurement does not license');
      check(/corner/.test(b.text),
        'and it points at the corner, which has always used the reader\'s own skyline');
    });

  // ---- 5. It reads the witness, not a typed latitude ----
  //
  // Day 40: a tool holding a claim must stop asserting from memory. If
  // the band edge is hardcoded in page.js, moving the witness moves
  // nothing, and this is the case that says so.
  {
    let landed = false;
    await page.route('**/reckoning.js*', async (route) => {
      const res = await route.fetch();
      const before = await res.text();
      const body = before
        .replace(/var STANDING = \{\s*place: [A-Z_]+,/,
          'var STANDING = { place: ' + JSON.stringify({ name: 'Testbed', latitude: 20, longitude: 0, zone: 'Etc/UTC' }) + ',')
        .replace(/lastLatitudeUnderOneSunWidthDegrees: \d+/, 'lastLatitudeUnderOneSunWidthDegrees: 5');
      landed = body !== before && /lastLatitudeUnderOneSunWidthDegrees: 5\b/.test(body);
      await route.fulfill({ response: res, body });
    });
    await page.goto(URL + '/reckoning/', { waitUntil: 'networkidle' });
    check(landed, 'the moved-band forgery landed (edge pulled in to 5°, tower at 20°)');
    const b = await bandText(page);
    check(b && !b.hidden && b.text.length > 0,
      'and a latitude that was inside the band is outside it once the witness moves',
      'the page is reading a typed latitude rather than STEP_ROBUSTNESS_WITNESS');
    await page.unroute('**/reckoning.js*');
  }

  // ---- 6. It does not scroll sideways ----
  for (const width of [375, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(URL + '/reckoning/', { waitUntil: 'networkidle' });
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(over <= 0, 'the day does not scroll sideways at ' + width);
  }

  await browser.close();
  console.log('');
  if (failures > 0) {
    console.log('FAIL — ' + failures + ' check' + (failures === 1 ? '' : 's') + ' red.');
    process.exit(1);
  }
  console.log('ok — the band hedge speaks outside its band, is quiet inside it, reads the');
  console.log('witness rather than a typed latitude, and accuses no number of being wrong.');
})();
