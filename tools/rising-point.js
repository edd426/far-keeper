// tools/rising-point.js — is the where as honest as the whens?
//
//     ./scripts/local-snapshot.sh tools/rising-point.js
//
// Built Day 15, with the rising point itself.
//
// The page now publishes a *where* — how far round the compass the sun
// comes up — beside the *whens* it has published since Day 3. Three
// things about that could go wrong quietly, and each has its own part
// below.
//
//   1. The bearing could simply be a wrong number. Nothing outside this
//      tower will tell us. So part one recomputes it in the browser by a
//      **second formula** — from the hour angle rather than from the
//      zenith — using the same converged working the page prints. Two
//      roads out of one set of numbers. That is not proof (Day 3: two
//      methods can be wrong the same way), but a slip in one of them is
//      caught, and a slip is the likelier fault.
//
//   2. The bearing is horizon-hung, badly: five degrees of eastern
//      skyline moves it about six degrees at Paris, twelve days' worth of
//      the daily step. So the corner MUST answer with the reader's own
//      horizon, and part three breaks exactly that — a corner that
//      quietly returns the flat-plain bearing is the fault that would put
//      a reader's mark on the wrong tree, and it would look entirely
//      ordinary on the page.
//
//   3. The step is the claim the page stands on everywhere, and it is
//      published as a claim about *tomorrow*. Part four turns it round to
//      yesterday and checks the page is convicted of it.
//
// Day 5's rule governs the breaks: assert the sabotage landed, and write
// the pass rule so the unbroken case would fail it. Both sabotages here
// are injected on the wire with page.route — nothing on disk is opened
// for writing, and the ledger is never touched at all.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

// Read the rising-point section as a reader gets it: term -> value.
async function readFigures(page, id) {
  return page.$$eval(`#${id} > *`, (nodes) => {
    const out = {};
    let term = null;
    for (const node of nodes) {
      if (node.tagName === 'DT') term = node.textContent.trim();
      else if (node.tagName === 'DD' && term !== null) { out[term] = node.textContent.trim(); term = null; }
    }
    return out;
  });
}

function numberIn(text) {
  if (text === undefined || text === null) return null;
  const m = text.replace('−', '-').match(/-?\d+(\.\d+)?/);
  return m === null ? null : Number(m[0]);
}

// Load reckoning.js in the page's own context and answer both ways.
async function bothFormulas(page, date) {
  return page.evaluate((d) => {
    const RAD = Math.PI / 180, DEG = 180 / Math.PI;
    const r = window.Reckoning.reckon(d);
    const phi = r.place.latitude;
    // Azimuth from the hour angle, measured from south and turned to
    // north — a different identity from the one reckoning.js uses, which
    // goes through the zenith. Same converged declination, other road.
    function fromHourAngle(H, dec) {
      const a = Math.atan2(
        Math.sin(H * RAD),
        Math.cos(H * RAD) * Math.sin(phi * RAD) - Math.tan(dec * RAD) * Math.cos(phi * RAD)
      ) * DEG;
      return (a + 180 + 360) % 360;
    }
    const wr = r.working.atSunrise, ws = r.working.atSunset;
    return {
      risePublished: r.risingPointDegrees,
      riseOtherRoad: fromHourAngle(-wr.hourAngleDeg, wr.declinationDeg),
      setPublished: r.settingPointDegrees,
      setOtherRoad: fromHourAngle(+ws.hourAngleDeg, ws.declinationDeg),
      riseTomorrow: r.risingPointTomorrowDegrees,
      step: r.risingPointStepArcminutes,
      widths: r.risingPointStepSunWidths,
      sunWidth: window.Reckoning.SUN_DIAMETER_ARCMINUTES
    };
  }, date);
}

async function cornerWith(page, skylineDegrees) {
  await page.fill('#corner-skyline', String(skylineDegrees));
  await page.click('#corner-go');
  await page.waitForFunction(
    (want) => {
      const dts = Array.from(document.querySelectorAll('#corner-figures dt'));
      return dts.some((dt) => /where the sun comes up for you/.test(dt.textContent)) && want === want;
    },
    skylineDegrees
  );
  return readFigures(page, 'corner-figures');
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- Part one: the two roads to one bearing -------------------------
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#rising-figures dt');

  const today = await page.evaluate(() => document.querySelector('#today-figures dd').textContent.trim());
  const both = await bothFormulas(page, today);

  check(both.risePublished !== null, `the rising point exists for ${today} (${both.risePublished?.toFixed(3)}°)`);
  check(
    Math.abs(both.risePublished - both.riseOtherRoad) < 1e-6,
    `sunrise bearing agrees to a millionth of a degree by a second formula ` +
    `(${both.risePublished.toFixed(6)} vs ${both.riseOtherRoad.toFixed(6)})`
  );
  check(
    Math.abs(both.setPublished - both.setOtherRoad) < 1e-6,
    `sunset bearing agrees by the second formula ` +
    `(${both.setPublished.toFixed(6)} vs ${both.setOtherRoad.toFixed(6)})`
  );
  check(
    Math.abs(both.step - (both.riseTomorrow - both.risePublished) * 60) < 1e-9,
    `the step is exactly tomorrow's bearing less today's (${both.step.toFixed(4)}′)`
  );
  check(
    Math.abs(both.widths - both.step / both.sunWidth) < 1e-12,
    `the step in sun-widths is the step over ${both.sunWidth}′`
  );

  // ---- Part two: what a reader is actually shown ----------------------
  const figures = await readFigures(page, 'rising-figures');
  const terms = Object.keys(figures);

  check(
    terms.some((t) => /from this morning to tomorrow morning/.test(t)),
    'the step is on the page, and it is the step to tomorrow — a claim about a morning that has not happened'
  );
  check(
    terms.some((t) => /widths of the sun itself/.test(t)),
    'the step is also given in widths of the sun, which is the ruler a reader outside already owns'
  );
  // Day 14's repair, applied to horizons instead of calendars: every
  // bearing must say whose horizon it is for, on its own face, because a
  // bearing and a step printed side by side would otherwise read as one
  // fact about the reader's own sky.
  const bearingTerms = terms.filter((t) => /rising point|setting point/.test(t));
  check(bearingTerms.length >= 2, `${bearingTerms.length} bearings are printed on the page`);
  for (const t of bearingTerms) {
    check(/flat plain/.test(t), `"${t}" says on its own face which horizon it is for`);
  }

  const note = await page.textContent('#rising-note');
  check(/own width/.test(note ?? ''), 'the note says what the step is worth to an eye');

  const printedStep = numberIn(figures[bearingTerms.length ? terms.find((t) => /from this morning/.test(t)) : '']);
  check(
    printedStep !== null && Math.abs(Math.abs(printedStep) - Math.abs(both.step)) < 0.01,
    `the printed step matches the computed one (${printedStep}′ vs ${both.step.toFixed(2)}′)`
  );

  // ---- Part three: the corner must answer at the reader's own skyline --
  await page.waitForSelector('#corner-figures dt');
  const flatCorner = await cornerWith(page, 0);
  const hillCorner = await cornerWith(page, 5);

  const flatBearing = numberIn(flatCorner['where the sun comes up for you']);
  const hillBearing = numberIn(hillCorner['where the sun comes up for you']);
  check(flatBearing !== null && hillBearing !== null, 'the corner prints a rising point at both skylines');
  check(
    hillBearing - flatBearing > 4 && hillBearing - flatBearing < 8,
    `five degrees of skyline moves the corner's rising point by ${(hillBearing - flatBearing).toFixed(2)}° ` +
    `— degrees, not arcminutes, which is why this could not stay on the page above`
  );

  // ...and the step must NOT move much, because that is the claim the
  // page makes to everybody. Swept over 2026 the worst skyline shift in
  // the step is 5.4′ across ten degrees; five degrees on this date is
  // about one.
  const flatStep = numberIn(flatCorner['step to tomorrow, at your horizon']);
  const hillStep = numberIn(hillCorner['step to tomorrow, at your horizon']);
  check(
    Math.abs(hillStep - flatStep) < both.sunWidth / 6,
    `the same five degrees moves the step by only ${Math.abs(hillStep - flatStep).toFixed(2)}′, ` +
    `inside a sixth of the sun's width`
  );
  check(
    numberIn(hillCorner['step to tomorrow, on a flat plain']) !== null,
    'the corner prints the flat-plain step beside the reader\'s own, so the two can be compared rather than trusted'
  );
  await page.close();

  // ---- Part four: break it, twice, and prove the breaks landed --------
  //
  // Sabotage A — the corner ignores the skyline and hands back the
  // flat-plain bearing. This is the fault that puts a mark on the wrong
  // tree, and nothing else on the page would look wrong.
  async function sabotaged(find, replace) {
    const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
    let landed = false;
    await p.route('**/reckoning.js*', async (route) => {
      const res = await route.fetch();
      const before = await res.text();
      const body = before.replace(find, replace);
      landed = body !== before;
      await route.fulfill({ response: res, body });
    });
    await p.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    await p.waitForSelector('#rising-figures dt');
    return { page: p, landed };
  }

  const a = await sabotaged(
    'out.risingPointDegrees = mine.risingPointDegrees;',
    'out.risingPointDegrees = flat.risingPointDegrees;'
  );
  check(a.landed, 'sabotage A reached the page (a substitution that silently no-ops is a test that cannot fail)');
  await a.page.waitForSelector('#corner-figures dt');
  const brokenFlat = await cornerWith(a.page, 0);
  const brokenHill = await cornerWith(a.page, 5);
  const brokenShift = numberIn(brokenHill['where the sun comes up for you'])
    - numberIn(brokenFlat['where the sun comes up for you']);
  check(
    Math.abs(brokenShift) < 0.001,
    `under sabotage A the corner's rising point stops moving with the skyline (${brokenShift.toFixed(4)}°) ` +
    `— so the check in part three is a check that can fail`
  );
  await a.page.close();

  // Sabotage B — the step looks backwards to yesterday instead of
  // forwards to tomorrow. The number stays plausible; only its sign and
  // its relation to the printed bearings give it away.
  const b = await sabotaged(
    'var tomorrowISO = shiftDate(dateISO, 1);',
    'var tomorrowISO = shiftDate(dateISO, -1);'
  );
  check(b.landed, 'sabotage B reached the page');
  const brokenBoth = await bothFormulas(b.page, today);
  check(
    Math.abs(brokenBoth.step - (brokenBoth.riseTomorrow - brokenBoth.risePublished) * 60) < 1e-9,
    'under sabotage B the step is still self-consistent — which is why part one alone would not catch it'
  );
  check(
    Math.sign(brokenBoth.step) !== Math.sign(both.step),
    `under sabotage B the step turns round (${brokenBoth.step.toFixed(2)}′ against ${both.step.toFixed(2)}′), ` +
    `so a reader watching two mornings would convict us`
  );
  await b.page.close();

  // ---- Part five: the ledger's other auditor -------------------------
  //
  // `--verify` on this desk is not the only thing auditing the ledger:
  // the page recomputes every row in the reader's own browser, and that
  // is the copy we cannot reach. It has to know the same thing the tool
  // knows — that a row written before the tower published the rising
  // point could not have carried it — or twelve honest entries turn red
  // in front of every stranger. `tools/claim-birthdays.sh` proves the
  // tool's half in a scratch tree; this is the browser's half.
  const led = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await led.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await led.waitForSelector('.ledger__entry');
  const verdicts = await led.$$eval('.ledger__entry', (rows) => rows.map((row) => ({
    date: row.querySelector('.ledger__date')?.textContent?.trim() ?? null,
    verdict: row.querySelector('.ledger__verdict')?.textContent?.trim() ?? null,
    // The named disagreements are the <li>s; the prose beneath is the
    // account. This test wants the former — the sentence that says which
    // claim moved and how.
    notes: Array.from(row.querySelectorAll('.ledger__broken li, .ledger__note'))
      .map((n) => n.textContent.trim())
  })));
  const old = verdicts.filter((r) => r.date < '2026-08-18');
  const oldDrifted = old.filter((r) => r.verdict === 'DRIFTED');
  check(old.length > 0, `${old.length} ledger rows predate the rising point`);
  check(
    oldDrifted.length === 3,
    `still exactly 3 of them are DRIFTED — the Day 6 scars, not ${oldDrifted.length} rows ` +
    `convicted of a silence they had no way to break`
  );
  check(
    !verdicts.some((r) => r.notes.some((n) => /rising point: published/.test(n))),
    'no row is told its rising point moved, because no old row ever published one'
  );
  // Graft onto a row that is currently *clean*, not onto one of the three
  // Day 6 scars: a scar is already DRIFTED, so grafting there would prove
  // nothing about whether the graft was noticed. Same reason the Day 11
  // forgery test asserts its target carries no forgery sentence first.
  const graftTarget = old.find((r) => r.verdict === 'unchanged');
  check(!!graftTarget, `a clean pre-rising-point row exists to graft onto (${graftTarget?.date})`);
  check(
    !(graftTarget?.notes ?? []).some((n) => /predates/.test(n)),
    `${graftTarget?.date}: before the graft, this row carries no predates-sentence`
  );
  await led.close();

  const grafted = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let graftLanded = false;
  await grafted.route('**/ledger.json*', async (route) => {
    const res = await route.fetch();
    const before = await res.text();
    const entries = JSON.parse(before);
    entries.find((e) => e.date === graftTarget.date).risingPointDegrees = 68.84;
    const body = JSON.stringify(entries, null, 2);
    graftLanded = body !== before;
    await route.fulfill({ response: res, body });
  });
  await grafted.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await grafted.waitForSelector('.ledger__entry');
  check(graftLanded, 'the grafted ledger reached the page');
  const graftedRow = await grafted.$$eval('.ledger__entry', (rows, want) => {
    const row = rows.find((r) => r.querySelector('.ledger__date')?.textContent?.trim() === want);
    return row === undefined ? null : {
      verdict: row.querySelector('.ledger__verdict')?.textContent?.trim() ?? null,
      notes: Array.from(row.querySelectorAll('.ledger__broken li, .ledger__note'))
        .map((n) => n.textContent.trim())
    };
  }, graftTarget.date);
  check(graftedRow !== null && graftedRow.verdict === 'DRIFTED',
    `${graftTarget.date}: a rising point grafted onto a row too old to have one is caught`);
  check(
    (graftedRow?.notes ?? []).some((n) => /predates 2026-08-18/.test(n)),
    `${graftTarget.date}: and it is told why it cannot be there, rather than that its number moved`
  );
  await grafted.close();

  // ---- Part six: the page must not scroll sideways --------------------
  for (const width of [375, 390, 1440]) {
    const wide = await browser.newPage({ viewport: { width, height: 900 } });
    await wide.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const overflow = await wide.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `${width}px: the page does not scroll sideways (${overflow})`);
    await wide.close();
  }

  await browser.close();

  if (problems.length) {
    console.error(`\nFAIL — ${problems.length} of the day's claims did not hold.`);
    process.exit(1);
  }
  console.log('\nPASS — the bearing holds by a second road, it moves with the reader\'s skyline, and the step does not.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
