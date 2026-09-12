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
  const seamHere = liveText.match(/differ about the drift by ([\d.]+) seconds/);
  check(seamHere !== null,
    `the turn of the year is forecast with a figure (${seamHere ? seamHere[1] + ' s' : 'no figure'})`);
  check(/almanac/.test(liveText) && /first of January/.test(liveText),
    'and it says which mechanism it is, rather than only that it is loud');

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
  if (seamHere && seamThere) {
    check(seamHere[1] !== seamThere[1],
      `and the figure is computed, not typed — it moves with the place (${seamHere[1]} s vs ${seamThere[1]} s)`);
  }
  await quito.close();

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
  await dark.close();

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
  check(/silent here/.test(liveText) && /not the same as/.test(liveText),
    'and refuses to borrow the sixty-minute sweep, which never asked this question');

  await live.close();
  await browser.close();

  console.log('');
  console.log('second-drift: the drift has a second method, the difference is shown');
  console.log('second-drift: rather than graded, and the almanac\'s year seam is named early.');
  process.exit(fails ? 1 : 0);
})();
