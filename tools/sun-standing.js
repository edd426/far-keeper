// tools/sun-standing.js — how high the sun stands, on a lit morning and a dark one.
//
//   ./scripts/local-snapshot.sh tools/sun-standing.js
//
// Day 37. `reckon()` folds early above the polar circles: the sun's centre
// never reaches the horizon zenith, so there is no sunrise and no sunset, and
// until this morning the whole civil-clock half of the row went over the side
// with them. A dark row carried six keys and exactly one — `never` — was a
// claim anybody could check. The one room whose entire design is that a
// stranger can convict us published, on the days it was most interesting,
// nothing to be convicted of.
//
// Two facts survive that fold and are now on every row, lit or dark: the sun's
// altitude at its two culminations, and the clock's offset at the instant of
// the first. Ember's name for what was wrong is the one this was built to —
// **two computable facts discarded at one fold, and nothing that was never
// there** — and the second clause is load-bearing. There is no sunrise on a
// polar night, and this suite asserts that none is invented.
//
// **The dark is forged on the wire, never on disk** (Day 11): `page.route`
// rewrites `STANDING` on its way into the browser, so the real tower is
// untouched and this file cannot touch it.
//
// **Why the fields are on a lit row too, and why a case here watches that.**
// A field that only exists on a dark row is a code path no published morning
// ever runs, which is the whole of what Day 20 found about `never` itself. So
// the lit branch carries them, the arithmetic is exercised every morning, and
// case 1 below is the thing that makes that true rather than intended.
//
// Made to fail — each asserted before it is believed:
//   * take `addCulminations` out of `renderToday` → the lit cases go red alone.
//   * take the dark figure block out of `renderTodayOrSayWhyNot` → the dark
//     cases go red and the lit ones stay green.
//   * drop `['sunHighestDegrees', …]` from page.js's CLAIMS → case 8 goes red.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const CHROMIUM = process.env.FAR_KEEPER_CHROMIUM_PATH;

let fails = 0;
const ok = (m) => console.log('ok    ' + m);
const bad = (m) => { console.log('FAIL  ' + m); fails += 1; };
const check = (cond, m) => (cond ? ok(m) : bad(m));

// Above the Arctic circle and dark for real in December. Not the tower's own
// place and never will be by accident: this is a fixture, and it names a
// latitude rather than a plan.
const TROMSO = { name: 'Tromso', latitude: 69.6492, longitude: 18.9553, zone: 'Europe/Oslo' };

// Read a `<dl class="figures">` back as a plain object of term to value.
async function readFigures(page, selector) {
  return page.$eval(selector, (list) => {
    const out = {};
    Array.from(list.querySelectorAll('dt')).forEach((t) => {
      out[t.textContent.trim()] = t.nextElementSibling
        ? t.nextElementSibling.textContent.trim() : null;
    });
    return out;
  });
}

(async () => {
  if (!URL) { console.log('FAIL  no FAR_KEEPER_URL in the environment'); process.exit(2); }
  const browser = await chromium.launch(
    CHROMIUM ? { executablePath: CHROMIUM } : {});

  // ---- 1. A lit morning carries both culminations ----
  //
  // The tower stands where it stands and nothing is forged. This is the case
  // that keeps the two fields out of the dark-only corner they would
  // otherwise live in.
  const lit = await browser.newPage();
  await lit.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  const litFigures = await readFigures(lit, '#today-figures');
  const highest = litFigures['the sun at its highest'];
  const lowest = litFigures['the sun at its lowest'];

  check(typeof highest === 'string' && /^-?\d+(\.\d+)?°$/.test(highest),
    `a lit morning prints the sun at its highest (${highest})`);
  check(typeof lowest === 'string' && /^-?\d+(\.\d+)?°$/.test(lowest),
    `a lit morning prints the sun at its lowest (${lowest})`);

  // The pass rule the broken case would fail. Two figures that are both
  // present prove nothing if they are the same number: the highest must
  // stand above the lowest, on every day, at every latitude on the earth.
  const highDeg = highest === undefined ? null : parseFloat(highest);
  const lowDeg = lowest === undefined ? null : parseFloat(lowest);
  check(highDeg !== null && lowDeg !== null && highDeg > lowDeg,
    `and the highest stands above the lowest (${highDeg} > ${lowDeg})`);

  // On a lit day the sun is above the horizon at noon by definition — it
  // rose. This is the one relation between the culminations and the rest of
  // the row that is not the same arithmetic asked twice, because the sunrise
  // it agrees with was reached by iterating an epoch and this was not.
  check(highDeg !== null && highDeg > 0,
    `and on a morning with a sunrise the sun's highest is above the horizon (${highDeg}°)`);

  // The caveat has to be on the lit page too. Refraction is a property of
  // these two figures and not of the dark, and a reader with a stick who is
  // not told will read an honest disagreement as an error.
  const litNote = (await lit.textContent('#today-dark-note') || '').trim();
  check(/refraction/i.test(litNote),
    'a lit morning says the figures are geometric and carry no refraction');
  check(/twelve hours after/i.test(litNote),
    'and says which lower transit it means, since that is a convention of ours');
  check(/not a check/i.test(litNote),
    'and refuses to sell the agreement with the sunrise line as a second opinion');

  await lit.close();

  // ---- 2. A dark morning, forged onto Tromso in December ----
  //
  // Both `STANDING.place` and the clock have to move: the room draws today,
  // and today at Tromso in September is an ordinary lit day. So the zone is
  // forged with `STANDING` and the browser's own clock is set to December.
  const dark = await browser.newPage();
  let landed = false;
  const NEEDLE = /(var STANDING = \{\s*place:\s*)([\s\S]*?)(,\s*\n\s*since:)/;
  await dark.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(NEEDLE, (m, head, _old, tail) =>
      head + JSON.stringify(TROMSO) + tail);
    landed = body !== before;
    await route.fulfill({ response, body });
  });
  // Day 5's rule and Day 17's together: assert the sabotage landed AND that
  // the fixture it needs got built. A clock that did not move leaves the
  // room lit, and every dark case below would then be asking its question of
  // a page that never entered the branch.
  await dark.clock.setFixedTime(new Date('2026-12-21T12:00:00Z'));
  await dark.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  check(landed, 'the forgery landed: the instrument on the wire stands at Tromso');

  const sentence = (await dark.textContent('#today-loading') || '').trim();
  check(/does not rise/.test(sentence),
    `the fixture was built: the room is in the dark branch ("${sentence.slice(0, 48)}…")`);

  if (landed && /does not rise/.test(sentence)) {
    const darkFigures = await readFigures(dark, '#today-figures');
    const keys = Object.keys(darkFigures);

    // The fault this whole day is about: before this morning the answer here
    // was zero figures.
    check(keys.length > 0,
      `a dark morning prints figures at all (${keys.length} of them)`);

    check(typeof darkFigures['solar noon'] === 'string' &&
      /^\d\d:\d\d$/.test(darkFigures['solar noon']),
      `a dark morning prints solar noon (${darkFigures['solar noon']})`);

    const dHigh = darkFigures['the sun at its highest'];
    const dLow = darkFigures['the sun at its lowest'];
    check(typeof dHigh === 'string' && /°$/.test(dHigh),
      `a dark morning prints the sun at its highest (${dHigh})`);
    check(typeof dLow === 'string' && /°$/.test(dLow),
      `a dark morning prints the sun at its lowest (${dLow})`);

    // The number that makes the field worth publishing rather than merely
    // present. On a polar night the sun's best moment is still below the
    // horizon, and *how far* below is the difference between a shallow dark
    // day and the depth of midwinter. A row that only said `never` could not
    // tell those two apart at all.
    const dHighDeg = dHigh === undefined ? null : parseFloat(dHigh);
    check(dHighDeg !== null && dHighDeg < 0,
      `and on a day with no sunrise the sun's highest is below the horizon (${dHighDeg}°)`);

    // Day 22's leftover, closed in the same commit because it is the same
    // early return. `survey.js` printed `+NaNh` for a dark row because the
    // offset was discarded at the line that discarded solar noon.
    const clock = darkFigures['clock'];
    check(typeof clock === 'string' && /UTC[+-]\d/.test(clock) && !/NaN/.test(clock),
      `a dark morning prints a clock offset, and not NaN (${clock})`);

    // ---- what is NOT there, asserted as hard as what is ----
    //
    // Ember's bound on the day's name, and the half a suite can actually
    // hold: a dark day discards nothing that was never there. A sunrise
    // manufactured for a day with no sunrise would be a worse fault than the
    // silence this replaces, and it would look like progress.
    check(darkFigures['sunrise'] === undefined && darkFigures['sunset'] === undefined,
      'and invents no sunrise and no sunset for a day that has neither');
    check(darkFigures['length of day'] === undefined,
      'and no length of day');

    const darkNote = (await dark.textContent('#today-dark-note') || '').trim();
    check(/no sunrise/.test(darkNote) && /not estimated|none of them are/.test(darkNote),
      'and says in words that those are absent rather than leaving a gap');
    // The second method is refused here on purpose: `usno()` will hand back a
    // time for a crossing method A says does not happen, and a lone number
    // with nothing to disagree with is not a cross-check whatever it is
    // labelled. This was written, committed and taken back out this morning.
    check(/cross-check/.test(darkNote),
      'and says why the second method is not printed either');
  }

  await dark.close();

  // ---- 3. The page's auditor was taught the new fields ----
  //
  // `tools/claims-audited.js` asks this properly, on both desks. This is the
  // browser half, and it is here because the two lists went four days short
  // of a month out of step once already (Day 36).
  //
  // **This case was written vacuous and caught in the act, which is why it
  // looks like this.** The first draft simply loaded the room and asserted
  // that no row's scope-sentence named `sunHighestDegrees` as held against
  // nothing. It passed. It also passed with both keys deleted from page.js's
  // CLAIMS — because *no published row carries the fields yet*. The birthday
  // is today's date in the tower's own calendar, the newest row in the cold
  // ledger is the morning before, and so the sentence had nothing to name in
  // either direction. An empty domain always says yes, in the voice of a
  // check that worked: sixth time in this house, and the second time inside a
  // file whose own header quotes the rule.
  //
  // So the domain is manufactured rather than waited for. A row is built by
  // the page's own `reckon()` for a date past the birthday and served on the
  // wire (`page.route`) — the real ledger is never touched — and the case
  // asserts the row was built and does carry the fields *before* it judges
  // what the page said about them. Day 17's rule, the right way round: a
  // suite that watches its own breaking and not its own building is watching
  // one end of itself.
  // The row is built here by the same `reckoning.js` the browser is about to
  // load — the instrument's own output, not a hand-typed fixture (Day 15) —
  // and spliced into the ledger on its way to the page.
  const Reckoning = require('../reckoning/reckoning.js');
  const born = Reckoning.CLAIM_INTRODUCED.sunHighestDegrees;
  const forged = Reckoning.reckon(born, Reckoning.STANDING.place);
  forged.publishedAt = born + 'T12:00:00Z';

  check(forged.sunHighestDegrees !== undefined && forged.sunLowestDegrees !== undefined,
    `the fixture was built: a row for ${forged.date} carries both culminations`);

  const auditor = await browser.newPage();
  let ledgerLanded = false;
  await auditor.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const rows = JSON.parse(await response.text());
    const body = JSON.stringify(rows.concat([forged]));
    ledgerLanded = true;
    await route.fulfill({ response, body });
  });
  await auditor.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  check(ledgerLanded, 'the forged ledger landed: the page read its record through us');

  // What the page's own scope sentence says about that row. It counts the
  // fields it held and names the ones it did not, off the row and the list at
  // render time — so if either key is missing from the page's CLAIMS, the row
  // says so itself, in the browser, in front of a reader.
  const rowText = await auditor.evaluate((date) => {
    const entries = Array.from(document.querySelectorAll('.ledger__entry'));
    const mine = entries.find((e) => (e.textContent || '').indexOf(date) !== -1);
    return mine ? mine.textContent : null;
  }, forged.date);

  check(rowText !== null,
    `the page drew the forged row for ${forged.date} — the domain is not empty`);
  check(rowText !== null && !/sunHighestDegrees|sunLowestDegrees/.test(rowText),
    'and does not name either culmination as a field held against nothing');
  check(rowText !== null && /DRIFTED/.test(rowText) === false,
    'and the row recomputes: a field this page audits is a field it can hold');
  await auditor.close();

  await browser.close();
  if (fails) { console.log(`\n${fails} check(s) failed.`); process.exit(1); }
  console.log('\nall checks passed.');
})().catch((error) => { console.log('FAIL  ' + error.message); process.exit(2); });
