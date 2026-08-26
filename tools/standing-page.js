// tools/standing-page.js — does the room draw the day of the place the
// tower stands in?
//
//     ./scripts/local-snapshot.sh tools/standing-page.js
//
// Built Day 19, and it is the second of the two halves. `tools/standing-
// clock.sh` asks the question of the gate on the keeper's desk. This one
// asks it of the copy that runs in a stranger's browser — the copy nobody
// here can reach once it has shipped.
//
// The fault, before it was repaired: `reckoning/page.js` held its own
// arithmetic for "what day is it here", called it with
// `Reckoning.PARIS.zone` at two call sites, and `tools/reckon.js` held a
// third copy on the desk. Three copies of one question across two runtimes.
// Nothing was ever wrong by it, because all three copies were asking about
// the same city — and a disagreement between the two that matter would
// surface as this page drawing a day the ledger does not hold, in a
// browser, where nothing here would ever see it.
//
// The forgery is on the wire (`page.route`), never on disk — Day 10's rule:
// a test must not share a desk with the record it puts at risk. Day 5's
// rule on both halves: assert the substitution landed, and write the pass
// rule so the *unbroken* case would fail it. Here that means the far zone
// is chosen at the moment this runs, from a list, by asking which zones
// actually disagree with the standing place about today's date — because a
// hardcoded pair agrees for most of the day and would then be asserting
// that two identical strings are identical (Day 17).
//
// Day 23 widened it three ways, and the first is a fault this file had by
// being the file it is: it *named Paris* at six lines. A suite built to
// catch a hand-typed city held six of them, and would have gone red on the
// first honest morning after a move, about a tower that was right. The
// standing place is asked of the instrument on the wire now, and no city is
// typed anywhere below.
//
// The other two: the sweep for the old city's name is the whole rendered
// room rather than a hand-kept list of mounts (that list could not see a
// mount nobody added to it, and reported the gap as clean), and it reaches
// the front door, which this suite had never opened. What it deliberately
// does not sweep is the ledger — a row naming the place it was reckoned at
// is the cold record doing its job (Day 18) — and that exemption is checked
// rather than trusted, because a check that passes because the thing it
// exempts went quiet has passed for the wrong reason.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

const CANDIDATES = [
  { name: 'Kiritimati', latitude: 1.87, longitude: -157.43, zone: 'Pacific/Kiritimati' },
  { name: 'Auckland', latitude: -36.85, longitude: 174.76, zone: 'Pacific/Auckland' },
  { name: 'Tokyo', latitude: 35.68, longitude: 139.69, zone: 'Asia/Tokyo' },
  { name: 'Reykjavik', latitude: 64.15, longitude: -21.94, zone: 'Atlantic/Reykjavik' },
  { name: 'Sao Paulo', latitude: -23.55, longitude: -46.63, zone: 'America/Sao_Paulo' },
  { name: 'New York', latitude: 40.71, longitude: -74.01, zone: 'America/New_York' },
  { name: 'Honolulu', latitude: 21.31, longitude: -157.86, zone: 'Pacific/Honolulu' }
];

function todayIn(zone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date()).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- Part one: the tower as it stands --------------------------------
  const standing = await browser.newPage();
  await standing.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  // Day 23: where the tower stands is *asked*, not typed. This file used to
  // hold `Europe/Paris` and the string `Paris` at six lines, which is the
  // same fault it was built to catch, one storey out — the suite would go
  // red on the first honest morning after a move, about a tower that was
  // right. The instrument on the wire is the only thing that knows.
  const home = await standing.evaluate(() => {
    const s = window.Reckoning && window.Reckoning.STANDING;
    return s && s.place ? s.place : null;
  });
  if (!home || !home.zone || !home.name) {
    console.error('FAIL — the page did not hand back a standing place. Nothing below ran.');
    await browser.close();
    process.exit(1);
  }

  const here = todayIn(home.zone);
  const far = CANDIDATES.find((c) => c.zone !== home.zone && todayIn(c.zone) !== here);

  if (!far) {
    console.error('FAIL — no candidate zone disagrees with the standing place about today.');
    console.error('Nothing below was tested. The world spans at least two calendar dates at');
    console.error('every instant, so this means the list is wrong, not the sky.');
    await browser.close();
    process.exit(1);
  }
  const farToday = todayIn(far.zone);
  console.log(`standing-page: ${home.name} says ${here}; ${far.name} says ${farToday}.`);

  const heading = (await standing.textContent('#today-heading')).trim();
  check(heading === `today over ${home.name}`,
    `the room's heading names the place it stands in ("${heading}")`);

  const drawnDate = await standing.$eval('#today-figures', (list) => {
    const terms = Array.from(list.querySelectorAll('dt'));
    const at = terms.findIndex((t) => /date/i.test(t.textContent));
    return at === -1 ? null : terms[at].nextElementSibling.textContent.trim();
  });
  check(drawnDate === here, `the room draws ${home.name}'s today (${drawnDate})`);

  for (const width of [375, 390, 1440]) {
    await standing.setViewportSize({ width, height: 900 });
    const overflow = await standing.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `${width}px: the page does not scroll sideways (${overflow})`);
  }
  await standing.close();

  // ---- Part two: a tower standing somewhere else -----------------------
  //
  // The whole question, and it is a question with a wrong answer that looks
  // right: a page that kept Paris's calendar while standing in Auckland
  // would draw a full, plausible, correctly-formatted day. It would simply
  // be the wrong day, and no figure on it would say so.
  const moved = await browser.newPage();
  let landed = false;

  // The substitution is anchored to the STANDING literal and names no city.
  // `place: PARIS,` was the old needle, and it would stop matching on the
  // first morning this tower stands somewhere else — the forgery would
  // silently fail to land and every case under it would blame the fixture
  // (Day 19: a suite must prove the tool its sabotage made still runs, and
  // a needle that rots is the same fault arriving by a different road).
  const NEEDLE = /(var STANDING = \{\s*place:\s*)([A-Za-z_$][\w$]*)/;
  await moved.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(NEEDLE, (m, head) => head + JSON.stringify(far));
    landed = body !== before;
    await route.fulfill({ response, body });
  });

  await moved.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  check(landed, `the forgery landed: the instrument on the wire stands at ${far.name}`);

  if (landed) {
    const movedHeading = (await moved.textContent('#today-heading')).trim();
    check(movedHeading === `today over ${far.name}`,
      `the heading follows the tower to ${far.name} ("${movedHeading}")`);

    const movedDate = await moved.$eval('#today-figures', (list) => {
      const terms = Array.from(list.querySelectorAll('dt'));
      const at = terms.findIndex((t) => /date/i.test(t.textContent));
      return at === -1 ? null : terms[at].nextElementSibling.textContent.trim();
    });
    check(movedDate === farToday,
      `the room draws ${far.name}'s today (${movedDate}), not ${home.name}'s (${here})`);

    // The pass rule the unbroken case would fail: the two dates must
    // actually differ, or the case above is asserting that a string equals
    // itself. Guaranteed by the search at the top, and checked again here
    // where it is being relied on.
    check(movedDate !== here,
      `and that is a different day from ${home.name}'s — the case can tell them apart`);

    // The ledger below is untouched by any of this: every row carries its
    // own place and is recomputed there (Day 18). Moving the tower must not
    // move the record.
    const drifted = await moved.$$eval('.ledger__verdict', (nodes) =>
      nodes.filter((n) => /DRIFTED/.test(n.textContent)).length);
    check(drifted === 3,
      `the ledger still shows exactly the 3 method-1 scars (${drifted}) — moving the tower does not move the record`);

    // ---- no word on this page may name a city the tower has left ----
    //
    // Ember's, and it is the half I would have left silent. A line of
    // *running code* that says "the atmosphere over Paris" executes on every
    // render for whatever place the tower actually stands in. After a move
    // that is not stale copy; it is code asserting something false, printed
    // directly under a heading that correctly names the new city, with
    // nothing anywhere saying which of the two to believe.
    //
    // Until Day 23 this swept a **list of the mounts page.js writes into**,
    // and said on its own face that it did NOT cover the static HTML —
    // that being the move's work. Two things were wrong with the list, and
    // only one of them is the disclaimer. A hand-kept list of mounts is a
    // list a new mount does not join: `renderStandingProse` writes into
    // `[data-standing-place]` and `#steepest-spread`, and neither would ever
    // have appeared here. **A sweep that enumerates what to look at cannot
    // see what it was not told about, and reports that as clean.**
    //
    // So the sweep is the whole rendered room now, and the exemption is
    // stated instead of the coverage. The one place the old city may
    // lawfully still appear is the **ledger**: every row carries the place
    // it was reckoned at and is recomputed there (Day 18), so a row reading
    // `unchanged at Paris` is the cold record doing exactly its job, and
    // moving the tower must not move it. That is the single subtree lifted
    // out, by name, for a reason — not a list of the places worth looking.
    const strays = await moved.evaluate((city) => {
      const body = document.body.cloneNode(true);
      const ledger = body.querySelector('#ledger-list');
      if (ledger) ledger.remove();
      const text = body.innerText || body.textContent || '';
      if (!text.includes(city)) return null;
      const at = text.indexOf(city);
      return text.slice(Math.max(0, at - 70), at + 70).replace(/\s+/g, ' ').trim();
    }, home.name);
    check(strays === null,
      strays === null
        ? `no word on this page outside the ledger names ${home.name}, the city the tower has left`
        : `the page still says ${home.name} while standing at ${far.name}: "…${strays}…"`);

    // And the exemption is not taken on trust either. If the ledger stopped
    // naming the place its rows were reckoned at, the sweep above would go
    // green for a reason that has nothing to do with the prose — the check
    // would pass because the thing it exempts had gone quiet. Day 5, in the
    // shape it keeps arriving in: write the pass rule so that a broken world
    // fails it.
    const ledgerNamesHome = await moved.evaluate((city) => {
      const ledger = document.querySelector('#ledger-list');
      return !!ledger && (ledger.innerText || ledger.textContent || '').includes(city);
    }, home.name);
    check(ledgerNamesHome,
      `the exemption is load-bearing: the ledger below still names ${home.name} on its rows`);
  }

  await moved.close();

  // ---- The front door, which had no instrument on it at all -------------
  //
  // Day 23. `index.html` said "A tower in Paris" on a page whose only script
  // was the build sha. It is the same claim as the room's, in the same hand,
  // and it was the one sentence that could not be reached from here — this
  // suite has only ever opened the reckoning room.
  const door = await browser.newPage();
  let doorLanded = false;
  await door.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(NEEDLE, (m, head) => head + JSON.stringify(far));
    doorLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await door.goto(URL, { waitUntil: 'networkidle' });
  check(doorLanded, `the forgery landed on the front door too`);

  if (doorLanded) {
    const lintel = await door.evaluate(() => document.body.innerText || '');
    // The positive case first, because the negative one alone would go green
    // on a lintel that had stopped naming any city at all.
    check(lintel.includes(far.name),
      `the front door names ${far.name}, the city the tower now stands in`);
    check(!lintel.includes(home.name),
      `and no longer names ${home.name}, the one it has left`);
  }
  await door.close();

  // ---- A room that cannot draw its day still knows where it stands ------
  //
  // Ember's addition, and it is the one I would not have written: the cases
  // above all run on a healthy instrument. `renderStandingProse` is first in
  // start(), *before* the guard that catches a reckoning which cannot run —
  // so the question is whether the name survives the failure of everything
  // under it, or goes down with it. Day 5's fault is exactly a guard that
  // protects a number by taking the room down around it.
  const NOWHERE = {
    name: 'A place the clock has never heard of',
    latitude: 0, longitude: 0, zone: 'Not/AZone'
  };
  const broken = await browser.newPage();
  let brokenLanded = false;
  await broken.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(NEEDLE, (m, head) => head + JSON.stringify(NOWHERE));
    brokenLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await broken.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(brokenLanded, 'the forgery landed: a tower standing in a zone no clock knows');

  if (brokenLanded) {
    const said = (await broken.textContent('#today-loading') || '').trim();
    check(said.length > 0 && !/^reckoning…?$/.test(said),
      `the room says why it could not draw the day ("${said.slice(0, 60)}…")`);

    const named = await broken.evaluate(() => Array.from(
      document.querySelectorAll('[data-standing-place]'), (n) => n.textContent));
    check(named.length > 0 && named.every((t) => t === NOWHERE.name),
      `and the prose still names the place, all ${named.length} slots, with the figures gone`);
  }
  await broken.close();

  // ---- Part three: the same room with Day 22's prose put back ----------
  //
  // The sweep above went green the first time it ever ran, which is a claim
  // about the sweep and not about the page (Day 9). So it is broken here, in
  // the suite, on the wire — because a sabotage described in a comment is a
  // sabotage nobody watches (Day 21), and because a test must never be
  // pointed at the thing it puts at risk (Day 10).
  //
  // The forgery is the *exact* page of four days ago: one `[data-standing-
  // place]` slot replaced by the bare word, so there is no mount for
  // `renderStandingProse` to fill and the static hand's-voice city stands
  // where it stood. Both substitutions are asserted to have landed before
  // the case under them means anything (Day 17: this file used to guard its
  // sabotage and never once ask whether its fixture got built).
  const sabotaged = await browser.newPage();
  let instrumentBack = false;
  let proseBack = false;

  await sabotaged.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(NEEDLE, (m, head) => head + JSON.stringify(far));
    instrumentBack = body !== before;
    await route.fulfill({ response, body });
  });
  await sabotaged.route('**/reckoning/', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(/<span data-standing-place>[^<]*<\/span>/, home.name);
    proseBack = body !== before;
    await route.fulfill({ response, body });
  });

  await sabotaged.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  check(instrumentBack && proseBack,
    `the sabotage landed: a room standing at ${far.name} with "${home.name}" typed back into its prose`);

  if (instrumentBack && proseBack) {
    const caught = await sabotaged.evaluate((city) => {
      const body = document.body.cloneNode(true);
      const ledger = body.querySelector('#ledger-list');
      if (ledger) ledger.remove();
      return (body.innerText || body.textContent || '').includes(city);
    }, home.name);
    check(caught,
      `and the sweep catches it — the check above can fail, so its passing means something`);
  }

  await sabotaged.close();
  await browser.close();

  if (problems.length) {
    console.error(`\nFAIL — ${problems.length} of the day's claims did not hold.`);
    process.exit(1);
  }
  console.log('\nPASS — the room and the front door both draw the day, and say the name, of');
  console.log('the place the tower stands in; no word outside the ledger names the one it');
  console.log('has left; and the cold record is unmoved by where the tower is standing.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
