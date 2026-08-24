// tools/day-line-page.js — what the second method says to a reader, once
// the tower is off the Greenwich band.
//
//     ./scripts/local-snapshot.sh tools/day-line-page.js
//
// Built Day 21, and it is the second of the two roads. `tools/day-line.sh`
// asks the question of the instrument on the keeper's desk. This one asks it
// of the copy that runs in a stranger's browser — the copy nobody here can
// reach once it has shipped, and the one a reader actually stands in.
//
// The fault, before it was repaired: `usno()` folded its answer into a
// single UTC day and `solarDay()` did not, and `reckon()` subtracted them
// anyway. Off the Greenwich band the difference was a whole day, and this
// page printed it, in the second-method section, as
//
//     they differ at sunrise by     86379.0 seconds
//
// directly beneath two times that agree to the minute. Nothing threw and
// nothing came back NaN. That is the shape of it: a number wrong by exactly
// 1440 minutes does not look wrong, it looks like a second method that has
// fallen over — and a reader's only reasonable conclusion is that the
// cross-check is broken, which is the opposite of what the cross-check is
// for.
//
// Both forgeries are on the wire (`page.route`), never on disk — Day 10's
// rule. Day 5's rule on both halves: assert the substitution landed, and
// write the pass rule so the *unbroken* case would fail it. That second half
// is why part one exists at all: a check that only ever looked at a moved
// tower could not tell "the fix works" from "this page never prints a
// difference anywhere".

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

// Far enough east that sunrise, in UTC, lands on the day before the date on
// the row — which is exactly the condition the old fold could not survive.
const FAR = { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, zone: 'Asia/Tokyo' };

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

// The second-method section, read the way a reader reads it: term by term.
async function secondMethod(page) {
  return page.$eval('#second-figures', (list) => {
    const out = {};
    Array.from(list.querySelectorAll('dt')).forEach((dt) => {
      const dd = dt.nextElementSibling;
      out[dt.textContent.trim()] = dd ? dd.textContent.trim() : null;
    });
    return out;
  });
}

// Every "N seconds" the section prints, as numbers.
function secondsIn(figures) {
  return Object.entries(figures)
    .filter(([term]) => /differ/.test(term))
    .map(([, value]) => {
      const m = /(-?[\d.]+)\s*seconds/.exec(value || '');
      return m ? Math.abs(Number(m[1])) : null;
    })
    .filter((n) => n !== null);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- Part one: the tower as it stands ------------------------------
  //
  // Paris has never been able to show this fault, and that is the point of
  // running it: it fixes what a working second-method section looks like,
  // so the moved case below is measured against something rather than
  // against nothing.
  const here = await browser.newPage();
  await here.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  const hereFigures = await secondMethod(here);
  const hereSeconds = secondsIn(hereFigures);
  check(hereSeconds.length === 2,
    `at Paris the section prints two differences (${hereSeconds.length})`);
  check(hereSeconds.every((s) => s < 300),
    `at Paris both differences are small (${hereSeconds.map((s) => s.toFixed(1)).join(', ')} s)`);
  await here.close();

  // ---- Part two: the tower standing east of the day ------------------
  const moved = await browser.newPage();
  let landed = false;

  await moved.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace('place: PARIS,', 'place: ' + JSON.stringify(FAR) + ',');
    landed = body !== before;
    await route.fulfill({ response, body });
  });

  await moved.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(landed, `the forgery landed: the instrument on the wire stands at ${FAR.name}`);

  if (landed) {
    const heading = (await moved.textContent('#today-heading')).trim();
    check(heading === `today over ${FAR.name}`,
      `the room's heading names the moved place ("${heading}")`);

    const figures = await secondMethod(moved);
    const seconds = secondsIn(figures);
    check(seconds.length === 2,
      `at ${FAR.name} the section prints two differences (${seconds.length})`);
    // `length === 2` is part of the pass rule and not a separate case,
    // because `[].every(...)` is true. Written the obvious way, this case
    // printed `ok  at Tokyo neither difference is a wrap ( s)` against a
    // page that had printed no difference at all — Day 20's fault, one room
    // along: a check meeting a kind of missing it had never been shown, and
    // reading it as fine. It was caught by running this file against a
    // broken instrument, which is the only thing that ever catches it.
    check(seconds.length === 2 && seconds.every((s) => s < 3600),
      `at ${FAR.name} neither difference is a wrap (${seconds.map((s) => s.toFixed(1)).join(', ') || 'nothing printed'})`);
    check(!Object.values(figures).some((v) => /8639\d|8640\d/.test(v || '')),
      'no figure in the section is a whole day in seconds');
  }
  await moved.close();

  // ---- Part three: two methods that have genuinely come apart --------
  //
  // The bound has to be shown firing, or it is a guard nobody has watched.
  // This forgery is deliberately a *different kind* from the one above: two
  // hours, nowhere near a day, so it cannot be passed by anything the
  // day-line repair does. Day 14's rule — two things that catch different
  // lies must be shown not to substitute for each other.
  const apart = await browser.newPage();
  let apartLanded = false;

  await apart.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(
      'var localMeanInItsOwnDay = ((localMean % 24) + 24) % 24;',
      'var localMeanInItsOwnDay = ((localMean % 24) + 24) % 24 + 2;'
    );
    apartLanded = body !== before;
    await route.fulfill({ response, body });
  });

  await apart.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(apartLanded, 'the second forgery landed: the two methods are two hours apart');

  if (apartLanded) {
    const figures = await secondMethod(apart);
    const text = JSON.stringify(figures);
    check(/more than 60 minutes/.test(text),
      'the room says the two methods are further apart than the bound');
    check(/publishes no figure/.test(text),
      'the room says it is publishing no figure for the disagreement');
    check(secondsIn(figures).length === 0,
      'the room prints no tidy difference in seconds');
    // The raw gap must still be shown. A refusal that hides the number is a
    // silence with a sentence in front of it.
    check(/-?1\d\d(\.\d+)? at sunrise/.test(text),
      `the room shows the raw gap anyway (${figures['they differ by'] || 'nothing'})`);
  }

  // ---- Part four: the fold, put back on the wire ---------------------
  //
  // The made-to-fail proof, running rather than described. This forgery
  // restores the exact line the repair replaced, at Tokyo — the tower as it
  // was at first light this morning.
  //
  // And the result is not what the first draft of this file's closing
  // comment asserted. That comment said the pre-fix page prints
  // `86379.0 seconds` here. It does not, and could not: with the bound in
  // place a gap of 1439 minutes is past it, so the page **refuses**. The
  // 86379 figure belongs to the page as it stood before *both* guards
  // existed, which is a third tree and not this one. My own expectation,
  // written into a comment an hour after I measured the thing it describes.
  //
  // What that shows is worth more than the case: the bound alone would have
  // caught the day-line fault, loudly, in front of a reader. So the two
  // guards overlap — and they still do not substitute, in either direction.
  // Part three proves the bound catches something the day-line repair never
  // touches (a real two-hour disagreement). This part proves the reverse:
  // with the bound as the only guard, a tower anywhere off the Greenwich
  // band loses its second method *entirely* — every date refused, no
  // cross-check published anywhere, and a page correctly announcing that
  // something is broken forever. Caught is not the same as working.
  const folded = await browser.newPage();
  let foldedLanded = false;

  await folded.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before
      .replace('place: PARIS,', 'place: ' + JSON.stringify(FAR) + ',')
      .replace(
        'return (localMeanInItsOwnDay - lngHour) * 60;',
        'return (((localMean - lngHour) % 24) + 24) % 24 * 60;'
      );
    foldedLanded = body !== before
      && /% 24 \* 60;/.test(body)
      && !/localMeanInItsOwnDay - lngHour/.test(body);
    await route.fulfill({ response, body });
  });

  await folded.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(foldedLanded, 'the third forgery landed: the fold is back, at Tokyo');

  if (foldedLanded) {
    const figures = await secondMethod(folded);
    const text = JSON.stringify(figures);
    check(/more than 60 minutes/.test(text),
      'with the fold back, the room refuses rather than printing a day');
    check(/-?14\d\d(\.\d+)? at sunrise/.test(text),
      `and shows the raw gap, which is a whole day (${figures['they differ by'] || 'nothing'})`);
    check(secondsIn(figures).length === 0,
      'with the fold back, no tidy difference is printed');
  }
  await folded.close();

  for (const width of [375, 390, 1440]) {
    await apart.setViewportSize({ width, height: 900 });
    const overflow = await apart.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `${width}px: the refusal does not make the page scroll sideways (${overflow})`);
  }
  await apart.close();

  await browser.close();

  console.log('');
  if (problems.length) {
    console.log(`day-line-page: ${problems.length} FAILED`);
    process.exit(1);
  }
  console.log('day-line-page: PASS');
})().catch((error) => {
  console.error('day-line-page: threw —', error && error.message);
  process.exit(1);
});

// ---------------------------------------------------------------------
// MADE TO FAIL
//
// Part four is the made-to-fail proof and it runs on every invocation rather
// than living down here, which is the point: a sabotage described in a
// comment is a sabotage nobody watches. Run against the folded instrument in
// the working tree, this file goes **five red** — the two Tokyo difference
// cases and all three refusal cases — while every Paris case in part one
// stays green. That asymmetry is the finding: the fault was never visible
// from where the tower has been standing.
//
// Two of those five only convict because of a repair made *after* the first
// run, and both were faults in the expectation rather than in the page:
//
//   `[].every(...)` is true, so `at Tokyo neither difference is a wrap`
//   printed `ok` about a section that had printed nothing at all. The length
//   is part of the pass rule now.
//
//   The old closing comment claimed the folded page prints 86379.0 s. It
//   does not — the bound catches the wrap first and the page refuses. That
//   figure belongs to a tower with neither guard, which is a third tree.
//
// Part three goes red if the bound is removed, or if the refusal is softened
// into a number, or if the raw gap is dropped from the sentence — three ways,
// because a refusal can fail by not firing, by lying, or by going quiet.
//
// What this file does NOT cover: whether the numbers are RIGHT off the
// Greenwich band. It shows the two methods are on one line and agree there.
// They could be wrong together and nothing here would notice — Day 3's
// standing condition, untouched by any fixture.
