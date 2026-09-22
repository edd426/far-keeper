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
    // The place is asked of the instrument, not left to the default.
    // `reckon(dateISO, place)` falls back to `PARIS` when no place is
    // handed to it, and this line said `reckon(d)` — so it computed Paris's
    // rising point and set it against a page that draws wherever the tower
    // stands. In Paris the two are the same number and the case was green
    // for eleven days. Day 26's browser rehearsal stood the suite in a copy
    // of the tower moved elsewhere and it printed `21.26′ vs 33.11′`.
    //
    // **Nothing in this line ever named a city** — that is the whole reason
    // it survived Day 23's hunt for typed place-names and Day 24's grep. It
    // is `place-audit.sh`'s was/were one room along: an assumption about
    // where you are does not have to name the place, and only standing
    // somewhere else finds it.
    const r = window.Reckoning.reckon(d, window.Reckoning.STANDING.place);
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

// **It typed the skyline and never the ground, until Day 50.**
//
// The latitude box is left at whatever the page offers, so every corner this
// file has ever driven stood wherever the page's default stood — and that
// default is a hand-typed Paris. The window asserted under it (four to eight
// degrees) is Paris's figure. So a Paris bound was being asserted against a
// Paris fixture, and the pair is locked: the check cannot go red however far
// the tower moves, because neither end of it moves. Green by construction,
// and green by construction reads exactly like green.
//
// The ground is an argument now, and every caller names it. Nothing here may
// fall back to the page's default: a fixture that inherits its ground is a
// fixture that cannot say what ground it is on.
async function cornerWith(page, skylineDegrees, ground) {
  await page.fill('#corner-lat', String(ground.latitude));
  await page.fill('#corner-lon', String(ground.longitude));
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
  //
  // Every corner below names the ground it stands on. Two grounds are
  // driven, on purpose, because the two questions asked here have
  // different domains and until Day 50 both were asked of whichever
  // ground the page happened to offer.
  await page.waitForSelector('#corner-figures dt');
  const HERE = await page.evaluate(() => ({
    latitude: Reckoning.STANDING.place.latitude,
    longitude: Reckoning.STANDING.place.longitude,
    name: Reckoning.STANDING.place.name
  }));

  // The ground the four-to-eight window was measured on, typed here rather
  // than inherited, and asserted only here. Swept across 2026 the shift at
  // five degrees of skyline runs 5.71° to 7.58° at Paris — and 24.04° to
  // 47.31° at Longyearbyen, 9.09° to 20.83° at Anchorage, and *negative*
  // at Auckland and Nairobi, where the hemisphere turns it round. So the
  // window is Paris's and nowhere else's, and the only honest place to
  // assert it is Paris.
  const PARIS_GROUND = { name: 'Paris', latitude: 48.8566, longitude: 2.3522 };

  // Read before anything below fills them: the ground the page offers a
  // reader who has told us nothing. It was Paris through four moves and
  // nothing ever asked, because nothing had ever looked at these two boxes
  // — this file drove the corner for thirty-five days and only ever typed
  // into the skyline one. The assertion is against `STANDING` and not
  // against a typed pair, so the day the tower moves it moves with it.
  const offered = await page.evaluate(() => ({
    lat: document.getElementById('corner-lat').value,
    lon: document.getElementById('corner-lon').value
  }));
  check(
    Number(offered.lat) === HERE.latitude && Number(offered.lon) === HERE.longitude,
    `the corner offers a reader the ground the tower stands on — ${HERE.name}, ` +
    `${offered.lat}, ${offered.lon} — rather than a city it has left`
  );

  const flatParis = await cornerWith(page, 0, PARIS_GROUND);
  const hillParis = await cornerWith(page, 5, PARIS_GROUND);
  const flatBearing = numberIn(flatParis['where the sun comes up for you']);
  const hillBearing = numberIn(hillParis['where the sun comes up for you']);
  check(flatBearing !== null && hillBearing !== null,
    'the corner prints a rising point at both skylines');
  check(
    hillBearing - flatBearing > 4 && hillBearing - flatBearing < 8,
    `at Paris — the ground this window was measured on, and typed here rather than ` +
    `inherited — five degrees of skyline moves the corner's rising point by ` +
    `${(hillBearing - flatBearing).toFixed(2)}° — degrees, not arcminutes, which is why ` +
    `this could not stay on the page above`
  );

  // Now the same question asked where the tower actually stands, and the
  // only thing asserted is the thing that is true everywhere: the corner
  // answers at the reader's own skyline rather than handing back the flat
  // plain. **No magnitude is claimed here and that is deliberate.** The
  // size of the shift is a fact about a latitude — six arcminutes at
  // Nairobi against twenty-four degrees here — so any window written for
  // it would be somebody's Paris again, which is the whole of what this
  // morning was about.
  const flatHereCorner = await cornerWith(page, 0, HERE);
  const hillHereCorner = await cornerWith(page, 5, HERE);
  const flatHereBearing = numberIn(flatHereCorner['where the sun comes up for you']);
  const hillHereBearing = numberIn(hillHereCorner['where the sun comes up for you']);
  const hereShift = hillHereBearing - flatHereBearing;
  check(
    flatHereBearing !== null && hillHereBearing !== null && Number.isFinite(hereShift)
      && Math.abs(hereShift) > 0,
    `at ${HERE.name} (${HERE.latitude.toFixed(1)}°) the corner moves with the skyline too ` +
    `(${hereShift.toFixed(2)}°) — no size is asserted, because the size is a fact about the latitude`
  );

  // ...and inside its band the step must NOT move much, because that is
  // the claim the page makes to everybody.
  //
  // **This assertion was a Paris bound with no place on it until Day 48.**
  // It read `< sunWidth / 6`, justified by a comment saying the worst
  // skyline shift across 2026 is 5.4′ — a figure swept at Paris and only
  // at Paris, asserted at whatever latitude the tower is standing. It was
  // green here on the morning it was found, at 3.64′ against a 5.33′
  // bound. Of the 94 days in 2026 on which Longyearbyen has a step at all
  // at five degrees of skyline, **82 would have turned it red**, about a
  // page that is perfectly right. It arrived inside the twelve-day window
  // where the old bound still holds; it would have gone red by Tuesday.
  //
  // Day 47's class for the third file and the second Sunday running: a
  // fixture written for a latitude it never names. The repair is not a
  // looser number — a bound wide enough for 78°N asserts nothing at 48°.
  // It is to ask the witness where the claim holds and to assert the
  // claim only there, saying on its own face which case this run is.
  // **Day 50, and this is the half that stings.** The fork below is Day
  // 48's repair: it asks the witness where the claim holds and says on its
  // face which case the run is. It forked on the right latitude — and read
  // its figure off a corner standing at the page's hand-typed **Paris**,
  // because `cornerWith` never touched the latitude box. So on Sunday it
  // printed *"Longyearbyen is outside the witnessed band, where five
  // degrees of skyline moved the step by 0.20′"*. Paris's step moves 0.20′
  // here; Longyearbyen's moves **7.33′**, thirty-six times more, and over
  // the sixth-of-a-sun bound the inside-band branch asserts. Had the tower
  // been inside the band that morning, the check would have gone green on
  // a city we left on the thirtieth of August.
  //
  // A repair that names its band and measures the wrong ground is not half
  // a repair. It reads, from outside, exactly like the whole one — the
  // sentence names the right place and the number under it is a stranger's.
  const flatCorner = await cornerWith(page, 0, HERE);
  const hillCorner = await cornerWith(page, 5, HERE);
  const flatStep = numberIn(flatCorner['step to tomorrow, at your horizon']);
  const hillStep = numberIn(hillCorner['step to tomorrow, at your horizon']);
  const moved = Math.abs(hillStep - flatStep);
  // The fixture must actually have moved off Paris, or every figure under
  // it is Paris's wearing this place's name — which is the fault this
  // block was rewritten for. Skipped only when the tower really is at
  // Paris, where the two grounds are one and nothing could tell them apart.
  const grounds = Math.abs(HERE.latitude - PARIS_GROUND.latitude) > 0.01;
  if (grounds) {
    check(
      Math.abs(hillStep - numberIn(hillParis['step to tomorrow, at your horizon'])) > 0.01,
      `the corner below stands on ${HERE.name}'s ground and not Paris's ` +
      `(${hillStep.toFixed(2)}′ against Paris's ` +
      `${numberIn(hillParis['step to tomorrow, at your horizon']).toFixed(2)}′)`
    );
  }
  const witness = await page.evaluate(() => ({
    edge: Reckoning.STEP_ROBUSTNESS_WITNESS.lastLatitudeUnderOneSunWidthDegrees,
    parisWorst: Reckoning.STEP_ROBUSTNESS_WITNESS.parisWorstArcminutes,
    lat: Reckoning.STANDING.place.latitude,
    name: Reckoning.STANDING.place.name
  }));
  const insideBand = Math.abs(witness.lat) <= witness.edge;
  if (insideBand) {
    check(
      moved < both.sunWidth / 6,
      `${witness.name} is inside the witnessed band (${Math.abs(witness.lat).toFixed(1)}° ` +
      `against ${witness.edge}°), so five degrees of skyline moves the step by only ` +
      `${moved.toFixed(2)}′, inside a sixth of the sun's width`
    );
  } else {
    // Not a weaker check — a different one. Outside the band the step's
    // smallness is not a fact to assert, so what is asserted instead is
    // the thing that replaces it: the page owns up. `tools/step-band.js`
    // holds the hedge's own wording; this only insists it is there, so
    // that nobody can quietly drop both the claim and its retraction.
    const hedged = await page.evaluate(() => {
      const el = document.querySelector('#rising-band');
      return !!el && !el.hidden && (el.textContent || '').trim().length > 0;
    });
    check(
      hedged,
      `${witness.name} is outside the witnessed band (${Math.abs(witness.lat).toFixed(1)}° ` +
      `against ${witness.edge}°), where five degrees of skyline moved the step by ` +
      `${moved.toFixed(2)}′ — so the page must carry the band hedge, and does`,
      'the step is being printed as skyline-proof from a latitude where nothing has shown that it is'
    );
  }
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
  // On this tower's own ground, like the case it is the break-test for.
  // Driven at the page's default it would have been proving the corner
  // stops moving at Paris, which is not where the check it guards stands.
  const brokenFlat = await cornerWith(a.page, 0, HERE);
  const brokenHill = await cornerWith(a.page, 5, HERE);
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
  const oldDrifted = old.filter((r) => /^DRIFTED/.test(r.verdict ?? ''));
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
  const graftTarget = old.find((r) => /^unchanged/.test(r.verdict ?? ''));
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
  check(graftedRow !== null && /^DRIFTED/.test(graftedRow.verdict ?? ''),
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
  // The old sentence ended "...and the step does not", which was the
  // Paris claim stated as a result. It is false outside the band, and a
  // suite's last line is the one a keeper reads.
  console.log('\nPASS — the bearing holds by a second road, it moves with the reader\'s skyline,\n' +
    'and the step either stays put or the page says where that stopped being shown.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
