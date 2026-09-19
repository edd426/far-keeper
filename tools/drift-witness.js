// tools/drift-witness.js — the drift's own sweep, on the page, and not used.
//
//   ./scripts/local-snapshot.sh tools/drift-witness.js
//
// Day 42. `DRIFT_GAP_WITNESS` was gathered this morning: the difference
// between the two methods' *drifts*, swept on the level sweep's grid, pole
// to pole, with the turn of the year counted apart. It closes a thing the
// page had promised on Day 40 — *when a bound arrives it will arrive with
// its own witness and its own date* — and it closes Ember's condition on
// gathering it at all: a witness nothing quotes is a checker wired to no
// door wearing a witness's coat.
//
// **This file asks a different kind of question from `second-drift.js`, and
// that is why it is a different file** (Ash, Day 30: one tool per kind of
// question). That one asks whether the drift has a second method and
// whether the page shows the subtraction. This one asks whether the swept
// number reached the page unchanged, whether the sweep's *absences* reached
// it too, and — the case the whole file exists for — whether the number is
// being used as a bound behind the page's back.
//
// ---------------------------------------------------------------------
// CASE 4 IS ASH'S AND IT IS THE ONE THAT MATTERS.
//
// Ash asked, before any of this was built, what a bound is doing on a page
// if nothing ever fires on it — honest scope-marking, or a decoration
// wearing an instrument's face. Its answer was to build the thing that
// notices the moment the bound gets read as a judgement. A text sweep
// cannot do that. A behaviour can: put a row on the page that sits far past
// the published worst and assert the page says the same kind of thing it
// says about an ordinary row — no refusal, no null, no alarm word, no new
// sentence about the bound.
//
// **The obvious way to build that fixture does not work, and finding out
// cost ten seconds and would have cost a month.** The first draft forged
// the tower onto latitude 84, longitude 100 — where the sweep found its
// worst, 22.57 minutes — and its comment said *a row past the swept worst*.
// The sweep found that gap on 2026-09-11. The page reckons **today**, and
// the same place today is 1.62 minutes. Swept over the whole sphere at one
// degree, the largest gap available on this date anywhere is 14.48 minutes,
// which is under the published worst — so on this date **no place on earth
// can put the tower past its own witness**, and a case claiming to do it
// was going to say yes for free, for ever, about a row that was never past
// anything. Day 39, in one line: *a fixture that does not model the thing
// it names tests the other thing and reports the name.*
//
// So the forgery is pointed at the **witness** instead of at the place,
// which is also the truer model of the fault: the hand this case is
// watching for is a later hand reading `largestInYearGapMinutes` as a
// threshold, and shrinking that number puts an ordinary morning past it
// wherever the tower happens to stand. The far-north row is kept as well,
// under a name it can hold — three orders of magnitude louder than the
// standing place, and still not graded — and it now asserts that it is
// actually louder rather than assuming the latitude did its job.
//
// That is Day 29's rule pointed at a *refusal to judge* instead of at a
// list: an exemption carries a test that its own reason still holds. If a
// later hand wires the witness into a verdict — reasonably, in good faith,
// because a bound is a thing with a far side — this case goes red and names
// what changed, rather than the change going in quietly and a keeper
// reading UNRESOLVED three mornings in four until they stop reading it
// (Ember, Day 40).
//
// The forgery is on the wire, never on disk, and it is asserted to have
// landed before anything under it is believed (Day 5).
//
// ---------------------------------------------------------------------
// WHAT THE DOMAIN GUARDS ARE FOR, since this house has been caught nine
// times by a case that said yes because it was asked about nothing: every
// case below that sweeps text asserts the text is there first, and every
// case that parses a number out of the page asserts the parse succeeded
// before judging its branch.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const CHROMIUM = process.env.FAR_KEEPER_CHROMIUM_PATH;

let fails = 0;
const ok = (m) => console.log('ok    ' + m);
const bad = (m) => { console.log('FAIL  ' + m); fails += 1; };
const check = (cond, m) => (cond ? ok(m) : bad(m));

// The witness as the module ships it, read off the page's own copy rather
// than retyped here. A fixture that types the numbers it is checking is
// checking a keeper's transcription (Day 37's fixture rule, other way up).
async function witnessFromPage(page) {
  return page.evaluate(() => window.Reckoning.DRIFT_GAP_WITNESS || null);
}

// Words a verdict would have to reach for. Kept in one place so cases 4a
// and 4b cannot drift apart, and so a later hand adding a verdict has one
// list to be caught by.
const ALARMS = ['unresolved', 'suspicious', 'may be wrong', 'unverified',
  'beyond the witness', 'past the bound', 'outside the sweep',
  'unwitnessed', 'cannot be trusted', 'unreliable', 'refused'];

async function readSection(page) {
  return (await page.textContent('#second-drift')) || '';
}

// One paragraph group, and never the section it sits in. Day 41: a check
// about one sentence has no honest edge but that sentence's end. Written
// after sabotage 1 left four of this file's cases green over text that
// three other paragraphs also carry.
async function readMount(page, id) {
  return (await page.textContent('#' + id).catch(() => null)) || '';
}

(async () => {
  if (!URL) { console.log('FAIL  no FAR_KEEPER_URL in the environment'); process.exit(2); }
  const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});

  // ---- 1. The witness exists and the section drew ----
  const live = await browser.newPage();
  await live.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  const w = await witnessFromPage(live);
  check(w !== null && typeof w === 'object',
    'setup: the instrument on this page carries DRIFT_GAP_WITNESS');
  const text = await readSection(live);
  check(text.trim().length > 200,
    `setup: the second-method section mounted prose (${text.trim().length} characters)`);
  // The two boxes cases 2, 3 and 6 are actually about.
  const witnessText = await readMount(live, 'drift-witness');
  const bandText = await readMount(live, 'epoch-restart-band');
  check(witnessText.trim().length > 0,
    `setup: the witness paragraphs mounted in their own box (${witnessText.trim().length} characters)`);
  check(bandText.trim().length > 0,
    `setup: the swept band paragraph mounted in its own box (${bandText.trim().length} characters)`);
  if (w === null || text.trim().length === 0) {
    console.log('FAIL  nothing below this line can be asked. Stopping.');
    await browser.close();
    process.exit(1);
  }

  // ---- 2. The swept figures reached the page, and were not retyped ----
  //
  // Day 33's lock. A figure that agrees with the witness *and* would move if
  // the witness moved is computed; one that only agrees may be a constant
  // that happens to match today. The second half is case 5.
  check(witnessText.includes(w.sweptOn),
    `the page names the date the sweep was gathered (${w.sweptOn})`);
  check(witnessText.includes(w.tool),
    `and names the tool that can re-run it (${w.tool})`);
  check(witnessText.includes(w.inYearSamples.toLocaleString()),
    `and the sample count it rests on (${w.inYearSamples.toLocaleString()})`);

  const worstSeconds = (w.largestInYearGapMinutes * 60).toFixed(1);
  check(witnessText.includes(worstSeconds),
    `and the largest in-year disagreement it found (${worstSeconds} s)`);
  check(witnessText.includes(String(w.largestInYearAt.latitude)),
    `and the latitude it found it at (${w.largestInYearAt.latitude})`);

  // ---- 3. The four absences are four numbers, not one word ----
  //
  // A drift is made from two days and two methods, so it can be missing at
  // four corners, and until this morning one word covered all of them. The
  // sweep counts them independently — they overlap by 101 — and the page
  // prints the overlap rather than a tally that adds up. If a later hand
  // folds them back into a single figure this goes red.
  const absences = [
    ['our own drift absent', w.oursMissingSamples],
    ['their drift absent in total', w.theirsMissingSamples],
    ['the almanac silent about the date', w.theirsNoTimeTodaySamples],
    ['the almanac silent about the day before', w.theirsNoYesterdaySamples],
    ['absent at both ends at once', w.bothMissingSamples]
  ];
  const distinct = new Set(absences.map((a) => a[1]));
  check(distinct.size === absences.length,
    `setup: the five counts are five different numbers, so a page printing ` +
    `one of them cannot pass for printing all (${[...distinct].join(', ')})`);
  absences.forEach(([name, count]) => {
    check(witnessText.includes(String(count)), `the page publishes ${name} (${count})`);
  });
  check(/overlap/.test(witnessText),
    'and says the counts overlap, rather than leaving a reader to add them up');

  // ---- 4. THE BOUND IS NOT BORROWED. Ash's case. ----
  //
  // Two fixtures, because one of them cannot be built on this date. See the
  // header. Both are on the wire, never on disk, and both are asserted to
  // have landed *and* to have produced the state the case is named for
  // before anything under them is believed.

  const STANDING_NEEDLE = /(var STANDING = \{\s*place:\s*)([\s\S]*?)(,\s*\n\s*since:)/;

  async function driftGapSeconds(page) {
    const figures = await page.$eval('#second-figures', (list) => {
      const out = {};
      Array.from(list.querySelectorAll('dt')).forEach((t) => {
        out[t.textContent.trim()] = t.nextElementSibling
          ? t.nextElementSibling.textContent.trim() : null;
      });
      return out;
    }).catch(() => ({}));
    const raw = figures['they differ on the drift by'];
    return typeof raw === 'string' ? parseFloat(raw) : null;
  }

  const hereGap = await driftGapSeconds(live);

  // Day 47. This used to read `farGap > hereGap * 100`, and *here* is
  // wherever the tower happens to be standing on the morning it runs. The
  // threshold was chosen in Nairobi, whose drift gap is the quietest figure
  // this tower has ever published, so a hundredfold was free; at
  // Longyearbyen the standing gap is 2.8 seconds and the same fixture is
  // only eight times louder, and the case went red about a page that was
  // right. A ratio taken against a quantity that moves with the tower is a
  // fact about where the tower is (Day 15's rule, one room along), and this
  // case is named for the *fixture* being loud. So both ends are forged now
  // and the lock cannot move under it. `hereGap` is still read and still
  // printed — it is worth knowing on the tick — but nothing is asserted of
  // it, because at a place whose row folds dark there is honestly no gap
  // here to have.
  const QUIET = { name: 'Nearline', latitude: 0, longitude: 0, zone: 'UTC' };
  const quiet = await browser.newPage();
  let quietLanded = false;
  await quiet.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(STANDING_NEEDLE, (m, head, _old, tail) =>
      head + JSON.stringify(QUIET) + tail);
    quietLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await quiet.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(quietLanded, 'the forgery landed: the instrument on the wire stands on the equator');
  const quietGap = await driftGapSeconds(quiet);
  check(quietGap !== null && Number.isFinite(quietGap),
    `the fixture was built: the quiet end has a drift gap to compare against (${quietGap} s, and here it is ${hereGap} s)`);
  await quiet.close();

  // 4a — a genuinely loud row, named for what it is rather than for what
  // would have been convenient.
  const FAR = { name: 'Farnorth', latitude: 84, longitude: 100, zone: 'UTC' };
  const far = await browser.newPage();
  let farLanded = false;
  await far.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(STANDING_NEEDLE, (m, head, _old, tail) =>
      head + JSON.stringify(FAR) + tail);
    farLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await far.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(farLanded, 'the forgery landed: the instrument on the wire stands at latitude 84');

  const farText = await readSection(far);
  const farGap = await driftGapSeconds(far);
  check(farText.trim().length > 0,
    `the fixture was built: the section drew at latitude 84 (${farText.trim().length} characters)`);
  check(farGap !== null && quietGap !== null && farGap > quietGap * 100,
    `and the fixture is the case it is named for: the gap at latitude 84 is far ` +
    `louder than the quiet end (${farGap} s against ${quietGap} s)`);

  if (farText.trim().length > 0) {
    const found = ALARMS.filter((word) => farText.toLowerCase().includes(word));
    check(found.length === 0,
      `a row three orders louder than the standing place is reported and not graded ` +
      `(${found.length ? found.join(', ') : 'no alarm words'})`);
    check(/no declared bound/.test(farText),
      'and the page still says outright that this difference has no bound');
    check(!/NaN/.test(farText) && !/undefined/.test(farText),
      'and nothing there went NaN or undefined');
  }
  await far.close();

  // 4b — the fault this case actually exists for. Shrink the published worst
  // until the standing place's ordinary morning sits far past it. If any
  // hand has wired the witness into a comparison, this is where it fires.
  const tiny = await browser.newPage();
  let tinyLanded = false;
  await tiny.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(/largestInYearGapMinutes: [0-9.]+/,
      'largestInYearGapMinutes: 0.0000001');
    tinyLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await tiny.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(tinyLanded, 'the forgery landed: the published worst on the wire is a millionth of a minute');

  const tinyText = await readSection(tiny);
  const tinyGap = await driftGapSeconds(tiny);
  check(tinyText.trim().length > 0,
    `the fixture was built: the section drew under the shrunken witness ` +
    `(${tinyText.trim().length} characters)`);
  check(tinyGap !== null && tinyGap > 0.000006,
    `and the fixture is the case it is named for: this morning's gap now sits ` +
    `past the published worst (${tinyGap} s against 0.000006 s)`);
  if (tinyText.trim().length > 0) {
    const found = ALARMS.filter((word) => tinyText.toLowerCase().includes(word));
    check(found.length === 0,
      `a row past the published worst is still reported and not graded ` +
      `(${found.length ? found.join(', ') : 'no alarm words'})`);
    check(/no declared bound/.test(tinyText),
      'and the page still says outright that this difference has no bound');
  }
  await tiny.close();

  // ---- 5. The witness is read, not remembered ----
  //
  // Forge the witness itself on the wire and the page's sentences must move
  // with it. This is what separates *the page cites the sweep* from *the
  // page has the sweep's numbers typed into it* — the fault this section's
  // own comment was, for two days, in prose.
  const forged = await browser.newPage();
  let forgedLanded = false;
  await forged.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before
      .replace(/turnOfYearSampledUpToLatitude: 66/, 'turnOfYearSampledUpToLatitude: 42')
      .replace(/turnOfYearFirstEmptyLatitude: 72/, 'turnOfYearFirstEmptyLatitude: 48');
    forgedLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await forged.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(forgedLanded, 'the forgery landed: the witness on the wire says 42 and 48');

  const forgedText = await readMount(forged, 'epoch-restart-band');
  check(forgedText.trim().length > 0,
    `the fixture was built: the swept band paragraph drew under the forged witness ` +
    `(${forgedText.trim().length} characters)`);
  if (forgedText.trim().length > 0) {
    check(/between latitude 42 and latitude 48/.test(forgedText),
      'the bracket on the page is read off the witness, not typed beside it');
    check(!/between latitude 66 and latitude 72/.test(forgedText),
      'and the real bracket is gone from the forged page, so the match above was not a coincidence');
  }
  await forged.close();

  // ---- 6. The bracket is two numbers, on the honest page ----
  //
  // Ember's, and it went in before anything was published. The grid steps
  // six degrees, so all the sweep can say is that samples reach 66 and there
  // are none at 72; the fold is a continuous latitude with no reason to sit
  // on a multiple of six. A page printing one number would be quietly more
  // confident than the grid earns.
  check(new RegExp('between latitude ' + w.turnOfYearSampledUpToLatitude +
    ' and latitude ' + w.turnOfYearFirstEmptyLatitude).test(bandText),
    `the turn-of-year evidence stops as a bracket, not an edge ` +
    `(${w.turnOfYearSampledUpToLatitude}–${w.turnOfYearFirstEmptyLatitude})`);
  check(w.turnOfYearFirstEmptyLatitude > w.turnOfYearSampledUpToLatitude,
    'and the bracket is the right way round');

  await live.close();
  await browser.close();

  console.log('');
  console.log('drift-witness: the drift\'s sweep is on the page, its absences with it,');
  console.log('drift-witness: read off the instrument rather than typed, and not used as a bound.');
  process.exit(fails ? 1 : 0);
})();
