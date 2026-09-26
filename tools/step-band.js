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
//
// Day 54: the needle is anchored at both ends of the field and names no
// identifier. It was `/var STANDING = \{\s*place: [A-Z_]+,/`, which matches
// `place: LONGYEARBYEN,` and nothing else — so in a tower whose place is an
// inline object (which is what move-rehearsal.sh writes into both copies)
// the forgery never landed and the suite went red in both, reading BLIND.
// Day 24's fault, fixed in three shell suites then and in standing-page.js
// on Day 26, and written again here on Day 48.
const STANDING_NEEDLE = /(var STANDING = \{\s*place:\s*)([\s\S]*?)(,\s*\n\s*since:)/;
async function withStanding(page, place, then) {
  let landed = false;
  await page.route('**/reckoning.js*', async (route) => {
    const res = await route.fetch();
    const before = await res.text();
    const body = before.replace(STANDING_NEEDLE,
      (m, head, _old, tail) => head + JSON.stringify(place) + tail);
    // Landed means the slot now holds this place — not that the bytes moved.
    // Forged onto the place a copy already stands in (the rehearsal's control),
    // the bytes do not move and the forgery has still landed (Day 54).
    const slot = body.match(STANDING_NEEDLE);
    landed = !!slot && slot[2] === JSON.stringify(place);
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

      // Day 54. The witness banks a standing figure for one place only
      // (`standingPlace`), and until today this sentence printed it under
      // any name: the first morning at Nuuk it would have read *Swept here*
      // over Longyearbyen's number. Testbed is not where it was swept.
      const banked = await page.evaluate(() => {
        const w = Reckoning.STEP_ROBUSTNESS_WITNESS;
        return { place: w.standingPlace, widths: (Math.round(w.standingWorstArcminutes / 32 * 10) / 10).toString() };
      });
      check(!/Swept here/.test(b.text) && !b.text.includes(banked.widths + ' widths'),
        'and it does not print ' + banked.place + '\'s banked figure (' + banked.widths +
          ' widths) under a place that was never swept',
        'a figure measured at one place, printed under another place\'s name');
      check(/sweep was not run at Testbed/.test(b.text),
        'and it says the sweep was not run here');
    });

  // ---- 4b. Forged onto the place the witness was swept at: the figure is its own ----
  //
  // The other half of the fork, so a page that simply never prints the
  // figure cannot pass case 4 for free.
  {
    const own = await page.evaluate(() => {
      const w = Reckoning.STEP_ROBUSTNESS_WITNESS;
      for (const key of Object.keys(Reckoning)) {
        const v = Reckoning[key];
        if (v && typeof v === 'object' && v.name === w.standingPlace && v.zone) {
          return { place: v, widths: (Math.round(w.standingWorstArcminutes / 32 * 10) / 10).toString() };
        }
      }
      return null;
    });
    check(!!own, 'the instrument knows the place its witness was swept at');
    if (own) {
      await withStanding(page, own.place, async (landed) => {
        check(landed, 'the forgery onto ' + own.place.name + ' landed in the served module');
        const b = await bandText(page);
        check(b && !b.hidden && /Swept here/.test(b.text) && b.text.includes(own.widths + ' widths'),
          'standing at ' + own.place.name + ', the hedge prints the figure swept there (' + own.widths + ' widths)',
          'the place the witness measured is told nothing about its own measurement');
      });
    }
  }

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
      const testbed = { name: 'Testbed', latitude: 20, longitude: 0, zone: 'Etc/UTC' };
      const moved = before.replace(STANDING_NEEDLE,
        (m, head, _old, tail) => head + JSON.stringify(testbed) + tail);
      const body = moved
        .replace(/lastLatitudeUnderOneSunWidthDegrees: \d+/, 'lastLatitudeUnderOneSunWidthDegrees: 5');
      // Both halves must land, each on its own: before Day 54 this asked only
      // whether the body changed, and the witness edit alone satisfies that.
      landed = moved !== before && body !== moved && /lastLatitudeUnderOneSunWidthDegrees: 5\b/.test(body);
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
