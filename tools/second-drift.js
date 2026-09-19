// tools/second-drift.js — the second method, asked for the drift at last.
//
//   ./scripts/local-snapshot.sh tools/second-drift.js
//
// Day 40. The drift is this room's signed quantity. Ash named it on Day 3,
// the page leads with it, and it is the figure on the front of every letter
// this tower has sent. Until this morning `crossCheck` carried a sunrise, a
// sunset and two gaps — two **levels** and nothing else. The drift is not a
// level; it is the difference between two days, and it had never once been
// put to the second method. The number the room is built on was single-method
// and nothing on the page or in either auditor said so.
//
// **The wrong version of this was built first and is worth more than the
// right one.** The morning's measurement set the level gap against the drift
// — 12.9 seconds of disagreement about sunrise at Nairobi against a drift of
// under 5 seconds a day — and read it as a check gone coarser than the number
// it is aimed at. That is a category error, and this tower had written the
// reason down in a letter on 2026-08-15: a steady bias mostly cancels when
// you subtract one day from the next. Asked properly, the two methods differ
// about the *drift* at Nairobi by 0.05 seconds across the whole of 2026 — the
// calmest of the four places this tower has stood or is going to, not the
// worst. Ember reproduced that independently and gave the mechanism: the
// sensitivity of sunrise to an error in declination runs with the tangent of
// the latitude, which at Nairobi is nearly nothing.
//
// Ash's word for the twin, which is what the section is really about: **the
// drift is opaque to a steady bias.** It does not show one — that is its
// robustness — and it cannot see through to one — that is its blindness — and
// they are one property. In August this page published a sunset a minute and
// a half late for six days and a drift out by about a second; the figure that
// looked soundest was the one the fault was best hidden in.
//
// **No fork, and that is deliberate.** Ember's caution, taken before the
// display was built rather than after: a verdict that reads UNRESOLVED on
// three mornings out of four, starting the week a city's name goes up, is an
// alarm a keeper stops reading. Day 31's rule about `unwitnessed latitude`
// with more force, because there the flag was rare. So the page prints two
// drifts and subtracts them where the reader can see it, and says in words
// that no bound is declared. Case 6 below is that caution turned into a check
// rather than left as an intention — and it asserts its own domain is not
// empty first, which is the eighth instance of that rule in this house.
//
// Made to fail — each sabotage asserted to have landed before its case is
// believed. Cases 4 and 5 forge on the wire, in this file. Two more were run
// by hand in scratch clones, and both results are written down as they came
// out rather than as they were predicted:
//
//   * delete the `renderSecondOnTheDrift(entry, second)` call in page.js →
//     **14 red**, the wiring proof. It also convicted this file: the dark
//     branch's NaN sweep was green over an empty string, because a sweep for
//     a bad word over nothing finds nothing. Guarded now, and the guard is
//     there because the sabotage was run and not because it was reasoned
//     about.
//   * point `crossCheck.changeSinceYesterdayMinutes` at method A's own drift
//     instead of `bChange` → **2 red**, and *not the ones expected*. I
//     thought the subtraction case would catch it. It does not, and cannot:
//     the page subtracts one number from itself and prints zero, which is a
//     correct subtraction. What catches it is the plainer case above —
//     a difference of exactly nothing is not two methods agreeing, it is one
//     method twice — and the turn-of-year figure, which stops moving with the
//     place because the difference it is made of is identically zero
//     everywhere. Two cases I had down as one strong and one weak turned out
//     to be the other way round.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const CHROMIUM = process.env.FAR_KEEPER_CHROMIUM_PATH;

let fails = 0;
const ok = (m) => console.log('ok    ' + m);
const bad = (m) => { console.log('FAIL  ' + m); fails += 1; };
const check = (cond, m) => (cond ? ok(m) : bad(m));

// Fixtures, and they name latitudes rather than plans. Quito is equatorial,
// so its turn-of-year seam is two orders smaller than Anchorage's; Tromso is
// dark on the first of January, so the second method has no drift there at
// all and the page must say so rather than print a blank.
const QUITO = { name: 'Quito', latitude: -0.1807, longitude: -78.4678, zone: 'America/Guayaquil' };
const TROMSO = { name: 'Tromso', latitude: 69.6492, longitude: 18.9553, zone: 'Europe/Oslo' };
// Day 47. A second lit place, so the *moves with the place* lock can be read
// between two forgeries rather than between a forgery and wherever the tower
// happens to be standing. It was read against the standing place until this
// morning, and that made the case a claim about a latitude nothing in it
// named: at Longyearbyen the first of January is polar night, there is no
// figure here at all, and the case went red about a page that was right.
const PARIS = { name: 'Paris', latitude: 48.8566, longitude: 2.3522, zone: 'Europe/Paris' };

const STANDING_NEEDLE = /(var STANDING = \{\s*place:\s*)([\s\S]*?)(,\s*\n\s*since:)/;

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

// Every paragraph the new section mounted, as one string.
async function readSection(page) {
  return (await page.textContent('#second-drift')) || '';
}

// Day 47. The sphere-wide half of this section has its own box now, because
// four place-specific refusals stand above `#second-drift` and each of them
// used to take the swept witnesses down with it. A case about a sentence
// that is true everywhere reads it here; a case about this place reads
// `#second-drift`. Keeping one reader for both boxes would put a
// place-independent sentence back inside a place-dependent domain, which is
// the fault of the morning wearing a helper's clothes.
async function readEverywhere(page) {
  return (await page.textContent('#second-everywhere')) || '';
}

(async () => {
  if (!URL) { console.log('FAIL  no FAR_KEEPER_URL in the environment'); process.exit(2); }
  const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});

  // ---- 1. The section drew at all, on the tower as it stands ----
  //
  // The domain check first, and it is not a formality. Day 38's own new
  // suite printed `ok` twice about a page that had rendered nothing, because
  // it was pointed at the wrong URL. Nothing below this line means anything
  // if the room did not draw.
  const live = await browser.newPage();
  await live.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  const liveFigures = await readFigures(live, '#second-figures');
  const sunriseGap = liveFigures['they differ at sunrise by'];
  check(typeof sunriseGap === 'string' && /seconds$/.test(sunriseGap),
    `setup: the second-method section drew its old lines (sunrise gap ${sunriseGap})`);

  const liveText = await readSection(live);
  check(liveText.trim().length > 200,
    `setup: the new section mounted prose (${liveText.trim().length} characters)`);

  // ---- 2. The three new figures are there and are numbers ----
  const bLength = liveFigures['day length (USNO)'];
  const bDrift = liveFigures['the drift (USNO)'];
  const apartText = liveFigures['they differ on the drift by'];

  check(typeof bLength === 'string' && /\d/.test(bLength) && !/NaN/.test(bLength),
    `the second method publishes its own day length (${bLength})`);
  check(typeof bDrift === 'string' && /\d/.test(bDrift) && !/NaN/.test(bDrift),
    `and its own drift (${bDrift})`);
  check(typeof apartText === 'string' && /seconds$/.test(apartText) && !/NaN/.test(apartText),
    `and the two drifts are subtracted in front of the reader (${apartText})`);

  // ---- 3. The second number is a second answer ----
  //
  // The pass rule the broken case would fail. Two figures that are both
  // present prove nothing if one is the other: wire method A's own drift in
  // by mistake and every check above still passes, with the difference
  // sitting at exactly zero. So the second drift must differ from the first,
  // and must not differ by more than two methods honestly can — a check that
  // only demanded difference would pass on a field filled with noise.
  const apart = apartText === undefined ? null : parseFloat(apartText);
  check(apart !== null && Number.isFinite(apart) && apart > 0,
    `the second method's drift is its own answer, not a copy of the first (${apart} s apart)`);
  check(apart !== null && apart < 60,
    `and the two are close enough that this is a check and not two strangers (${apart} s < 60 s)`);

  // The strongest case in the file, and the one that catches a second number
  // that is secretly the first. The page prints method A's drift in its own
  // unit at the head of the room (`−5m 40s`), method B's in seconds, and the
  // difference in seconds. Read all three off the page and hold the printed
  // subtraction against the two printed operands. Wire A's drift into B's
  // slot and the difference falls to zero while the operands stay unequal;
  // print a difference from anything but these two numbers and it parts from
  // them. Neither survives this.
  const aDriftText = (await live.textContent('#drift-figure') || '').trim();
  const aParts = aDriftText.match(/([−+-])(\d+)m\s*(\d+)s/);
  check(aParts !== null,
    `setup: method A's own drift is on the page to be read (${aDriftText.slice(0, 24)}…)`);
  if (aParts && apart !== null && typeof bDrift === 'string') {
    const aSeconds = (aParts[1] === '+' ? 1 : -1) *
      (Number(aParts[2]) * 60 + Number(aParts[3]));
    const bSeconds = parseFloat(String(bDrift).replace('−', '-'));
    const expected = Math.abs(aSeconds - bSeconds);
    // A's figure is printed to whole seconds, so the two can only be held
    // together to that resolution. A wire-up fault is a whole drift wide.
    check(Math.abs(expected - apart) <= 1,
      `and the printed difference is these two numbers subtracted (${aSeconds} − ${bSeconds} ≈ ${apart} s)`);
  }

  // ---- 4. The turn of the year is forecast, and the figure is computed ----
  //
  // Method B is an almanac and an almanac is written a year at a time, so its
  // drift swallows the epoch's restart in one step on the first of January.
  // The page says so before it happens. Day 33's lock: the figure must move
  // when the place moves, or it is a typed constant wearing a computation's
  // face.
  //
  // Day 47. What the *standing* place is owed here is one of two sentences,
  // and which one depends on its latitude: a figure if the second method has
  // a drift for the turn, and a plain refusal if it has not. Requiring the
  // figure made this a claim about a latitude the case never named — Day 24's
  // rule, one field over from a city — and it went red at Longyearbyen about
  // a page that was right. So the fork is asserted, and the branch is named
  // on the tick so a reader knows which one answered.
  const seamHere = liveText.match(/differ about the drift by ([\d.]+) seconds/);
  const refusedHere = /nothing to forecast about the turn of the year/.test(liveText) ||
    /no drift for/.test(liveText);
  check(seamHere !== null || refusedHere,
    `the turn of the year is either forecast or refused here, never blank (${
      seamHere ? seamHere[1] + ' s' : refusedHere ? 'refused — no drift at the turn here' : 'blank'})`);
  if (seamHere) {
    check(/almanac/.test(liveText) && /first of January/.test(liveText),
      'and it says which mechanism it is, rather than only that it is loud');
  }

  const quito = await browser.newPage();
  let quitoLanded = false;
  await quito.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(STANDING_NEEDLE, (m, head, _old, tail) =>
      head + JSON.stringify(QUITO) + tail);
    quitoLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await quito.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(quitoLanded, 'the forgery landed: the instrument on the wire stands at Quito');

  const quitoText = await readSection(quito);
  const seamThere = quitoText.match(/differ about the drift by ([\d.]+) seconds/);
  check(seamThere !== null, 'a tower at Quito also forecasts the turn of the year');
  check(/almanac/.test(quitoText) && /first of January/.test(quitoText),
    'and it says which mechanism it is, rather than only that it is loud');
  await quito.close();

  // The lock itself, between two forgeries. Day 33: the figure must move when
  // the place moves, or it is a typed constant wearing a computation's face.
  // Both ends are forged now, so the case cannot be made vacuous — or red —
  // by wherever this tower is standing on the morning it runs.
  const paris = await browser.newPage();
  let parisLanded = false;
  await paris.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(STANDING_NEEDLE, (m, head, _old, tail) =>
      head + JSON.stringify(PARIS) + tail);
    parisLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await paris.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(parisLanded, 'the forgery landed: the instrument on the wire stands at Paris');
  const parisText = await readSection(paris);
  const seamParis = parisText.match(/differ about the drift by ([\d.]+) seconds/);
  check(seamParis !== null, 'the fixture was built: a tower at Paris forecasts the turn too');
  if (seamParis && seamThere) {
    check(seamParis[1] !== seamThere[1],
      `and the figure is computed, not typed — it moves with the place (Paris ${seamParis[1]} s vs Quito ${seamThere[1]} s)`);
  }
  await paris.close();

  // ---- 5. A row the second method has no drift for says so ----
  //
  // Tromso on the first of January is a polar night: `reckon()` folds early,
  // there is no `crossCheck` at all, and `apart()` comes back null. The
  // branch must speak. A blank here would be the fault this house has found
  // in itself more than once — a missing thing and a zero thing wearing one
  // face.
  const dark = await browser.newPage();
  let darkLanded = false;
  await dark.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(STANDING_NEEDLE, (m, head, _old, tail) =>
      head + JSON.stringify(TROMSO) + tail);
    darkLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await dark.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(darkLanded, 'the forgery landed: the instrument on the wire stands at Tromso');

  const darkText = await readSection(dark);
  check(darkText.trim().length > 0,
    `the fixture was built: the section drew at Tromso (${darkText.trim().length} characters)`);
  check(/nothing to forecast about the turn of the year/.test(darkText) ||
        /no drift for/.test(darkText),
    'a place with no drift at the turn is told about in words, not by a blank');
  // The domain first, and this line was vacuous when it was written. Under
  // the wiring sabotage the section rendered nothing at all, `darkText` was
  // the empty string, and a sweep for NaN over nothing came back green — the
  // eighth instance in this house of an empty domain saying yes, and the
  // fourth inside a file that quotes the rule against it. Found only because
  // the sabotage was actually run.
  check(darkText.trim().length > 0 &&
        !/NaN/.test(darkText) && !/undefined/.test(darkText),
    'and the dark branch prints no NaN and no undefined');

  // Day 47, and this is the case the day was about. The swept band — the
  // pole-to-pole figures out of `DRIFT_GAP_WITNESS` — is not a claim about
  // the standing place. It is the Day 42 repair, and it exists *because* a
  // claim about one band had been read as a claim about the sphere. Until
  // this morning it was rendered at the foot of the place-specific function,
  // downstream of that function's two lawful refusals, so a dark place took
  // the sphere-wide paragraph down with its own. The two are separate
  // renders now and this holds them apart: the refusal above must be on the
  // page **and** the band with it.
  const darkBand = await dark.$('#epoch-restart-band');
  const darkBandText = darkBand ? (await darkBand.textContent() || '').trim() : '';
  check(/nothing to forecast about the turn of the year/.test(darkText) ||
        /no drift for/.test(darkText),
    'setup: the dark place really is refusing to forecast its own turn');
  check(darkBandText.length > 0,
    `and the sweep that is about the sphere is drawn anyway (${darkBandText.length} characters)`);
  check(darkBandText.length > 0 && /anywhere on the sphere/.test(darkBandText),
    'and it is the sweep, not some other paragraph wearing its box');
  await dark.close();

  // ---- 5b. A morning with no horizon crossing at all ----
  //
  // Day 47, Ember's finding, and it is the one the whole morning turned on.
  // Splitting `renderEpochRestart` in two was the first repair and it was
  // not enough: `renderTodayOrSayWhyNot` returns on `entry.never` before
  // `renderToday` is ever called, so on a dark morning **nothing** in the
  // second-method chain draws — and the swept witnesses, which are about
  // the sphere and not about the place, went down with it. Three more
  // refusals stand in that chain besides. So the sphere-wide box is mounted
  // from `start()` now and this is the case that holds it there.
  //
  // The fixture is a place that is genuinely dark today rather than a date
  // forged onto one — a latitude chosen so that the *tool* decides it is
  // dark, not the test. Its domain is asserted before its branch is read:
  // a place-specific box that is empty because the page drew nothing at all
  // would pass a sweep looking for emptiness, which is this house's oldest
  // way of being wrong.
  const POLE = { name: 'Northpole', latitude: 89.5, longitude: 0, zone: 'UTC' };
  const pole = await browser.newPage();
  let poleLanded = false;
  await pole.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(STANDING_NEEDLE, (m, head, _old, tail) =>
      head + JSON.stringify(POLE) + tail);
    poleLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await pole.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(poleLanded, 'the forgery landed: the instrument on the wire stands at latitude 89.5');

  const poleDark = await pole.evaluate(() => {
    const R = window.Reckoning;
    try {
      return !!R.reckon(R.todayAt(R.STANDING.place.zone), R.STANDING.place).never;
    } catch (e) { return false; }
  });
  check(poleDark,
    'the fixture is the case it is named for: the tower folds dark there this morning');
  const poleRoom = ((await pole.textContent('#today-loading')) || '').trim();
  check(poleRoom.length > 0,
    `and the room still says so in words (${poleRoom.length} characters)`);
  // The dark note is its own element, not the loading line. Reading the
  // wrong one made the first draft of the two checks below pass over a
  // string that was never in the box they were pointed at — a case whose
  // domain was not what its name said, which is the fault this house has
  // now caught in its own suites more times than in its pages.
  const poleNote = ((await pole.textContent('#today-dark-note')) || '').trim();
  check(poleNote.length > 0,
    `setup: the dark note itself drew (${poleNote.length} characters)`);
  const poleHere = (await readSection(pole)).trim();
  const poleEverywhere = (await readEverywhere(pole)).trim();
  check(poleHere.length === 0,
    `the place's own second-method box is lawfully empty on a dark morning (${poleHere.length} characters)`);
  check(poleEverywhere.length > 0,
    `and the swept witnesses, which are about the sphere, are drawn anyway (${poleEverywhere.length} characters)`);
  check(poleEverywhere.length > 0 && /anywhere on the sphere/.test(poleEverywhere),
    'and it is the sweep itself, not some other paragraph wearing its box');
  check(poleEverywhere.length > 0 &&
        !/NaN/.test(poleEverywhere) && !/undefined/.test(poleEverywhere),
    'and nothing in it went NaN or undefined where the place has no figures');

  // Day 47, second half, and Ember found it by loading the forged dark page
  // rather than reading the diff. The hoist made a sentence elsewhere false:
  // the dark note said flatly *the second method is not printed*, which was
  // true while the sweeps sat behind this place's refusal and stopped being
  // true the hour they were moved out from behind it. A reader was told
  // nothing of the second method appears and then scrolled into a paragraph
  // plainly about it. There was no case anywhere on that sentence's wording,
  // which is why it had room to go stale — the same shape as the fault the
  // hoist was repairing, one file along. Both halves are checked: the note
  // must not make the flat claim, and the empty local box must be named
  // where the reader meets it.
  check(poleNote.length > 0 && !/The second method is not printed/.test(poleNote),
    'the dark note does not claim the second method is absent when the sweeps are on the page');
  check(poleNote.length > 0 && /second method’s figures for this date/.test(poleNote),
    'and it narrows the claim to the figures for this date');
  check(poleEverywhere.length > 0 &&
        /no second-method figures for/.test(poleEverywhere),
    'and the empty local box is named where a reader meets it, not left as a gap');
  await pole.close();

  // ---- 6. Ember's caution, as a check rather than an intention ----
  //
  // The section reports a difference and declines to grade it. A verdict here
  // would read as an alarm on most mornings at an equatorial place, and an
  // alarm that fires most mornings stops being read. This asserts its own
  // domain is not empty before judging the branch — seven times this house
  // has found a case that said yes because it was asked about nothing.
  check(liveText.length > 0, 'setup: there is prose here to sweep at all');
  const alarms = ['unresolved', 'suspicious', 'may be wrong', 'unverified',
    'cannot be trusted', 'unreliable', 'failing'];
  const found = alarms.filter((word) => liveText.toLowerCase().includes(word));
  check(liveText.length > 0 && found.length === 0,
    `the section reports and does not accuse (${found.length ? found.join(', ') : 'no alarm words'})`);
  check(/no declared bound/.test(liveText),
    'and says outright that this difference has no bound yet');
  // Day 42 moved the target of this case and it is worth saying why rather
  // than editing the needle quietly. It used to read `/silent here/ && /not
  // the same as/`, matching the sentence *the sixty-minute sweep is silent
  // here, which is not the same as reassuring* — a refusal to borrow, and a
  // mood standing where a measurement could stand. The drift has a sweep of
  // its own now, so the refusal survives (the level sweep is still not a
  // witness to this question) and the mood is gone. The case asks for the
  // refusal alone; the measurement is `tools/drift-witness.js`'s question,
  // one tool per kind of question.
  const everywhereText = await readEverywhere(live);
  check(everywhereText.trim().length > 0,
    `setup: the sphere-wide box drew beside the place's own (${everywhereText.trim().length} characters)`);
  check(/lending its authority to a row it never checked/.test(everywhereText),
    'and refuses to borrow the sixty-minute sweep, which never asked this question');
  // And the figure in that refusal is read off the witness rather than typed
  // beside it — Ember found it hand-written while tracing the four gates.
  check(/\d/.test(everywhereText) &&
        everywhereText.includes(String(await live.evaluate(
          () => window.Reckoning.CROSS_CHECK_WITNESS.samples.toLocaleString()))),
    'and the sweep is sized off CROSS_CHECK_WITNESS, not from a number typed beside it');

  await live.close();
  await browser.close();

  console.log('');
  console.log('second-drift: the drift has a second method, the difference is shown');
  console.log('second-drift: rather than graded, and the almanac\'s epoch restart is named early.');
  process.exit(fails ? 1 : 0);
})();
