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
  //
  // **Anchored at BOTH ends as of Day 26, and the first anchoring was not
  // enough.** `([A-Za-z_$][\w$]*)` matches an *identifier*, so it moves a
  // tower whose place is the word `PARIS` and cannot move one whose place is
  // an inline object — which is precisely what `move-rehearsal.sh` writes
  // when it stands a copy of this tower somewhere else. So every case below
  // failed on `the forgery landed`, in both copies, and the rehearsal could
  // only report BLIND. Day 24 found and fixed exactly this in three shell
  // suites and never asked it here, because the browser half was not swept
  // then. A needle that matches an identifier is a needle that assumes a
  // hand wrote the place; the ends of the field are the thing that does not
  // move.
  const NEEDLE = /(var STANDING = \{\s*place:\s*)([\s\S]*?)(,\s*\n\s*since:)/;
  await moved.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(NEEDLE, (m, head, _old, tail) => head + JSON.stringify(far) + tail);
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
    // stated instead of the coverage. Two subtrees are lifted out, each by
    // name and each for a reason — never a list of the places worth looking.
    //
    // The **ledger**: every row carries the place it was reckoned at and is
    // recomputed there (Day 18), so a row reading `unchanged at Paris` is
    // the cold record doing exactly its job, and moving the tower must not
    // move it.
    //
    // The **pledge** (Day 27, and it took the real move to find). A pledge
    // names a place the tower gave its word about; that place is a separate
    // field from `place` and this suite's forgery does not touch it, so the
    // pledge sentence goes on naming its own city while the tower is forged
    // elsewhere — which is the page being right. It was invisible for two
    // days because `place` was Paris and the pledge was Auckland: two
    // different names, no collision. The morning the tower actually arrived,
    // `home.name` became Auckland and the sweep convicted the page of saying
    // the city it had *left* — while quoting a sentence about the city it
    // had reached. **A sweep for the name of the place you were assumes no
    // other lawful sentence can carry that name**, and a pledge kept is
    // exactly such a sentence.
    //
    // And the rehearsal could not have found this. `move-rehearsal.sh`
    // renames the moved copy's place to `Rehearsal`, a word that appears
    // nowhere in this house — so the sweep looks for a name that was never
    // there, finds nothing, and passes for free. It has passed for free
    // every run. Day 21's `[].every(...)`, one room along: **a fixture named
    // something the house never says makes a name-sweep vacuous, and vacuous
    // reads as green.**
    const strays = await moved.evaluate((city) => {
      const body = document.body.cloneNode(true);
      const ledger = body.querySelector('#ledger-list');
      if (ledger) ledger.remove();
      const pledge = body.querySelector('#pledge-section');
      if (pledge) pledge.remove();
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
    //
    // **It asks the ledger's own rows, and until Day 26 it asked the tower**
    // — `ledger.innerText.includes(home.name)`, which is true only while
    // every row in the book stands where the tower stands. That is
    // `place-audit.sh`'s was/were fault (Day 24) in a browser suite, and
    // the browser half of `move-rehearsal.sh` found it on the first morning
    // it could. It matters beyond the fixture: the morning after a move the
    // book is full of rows from the old city and holds none from the new
    // one until the day's own row lands, and this line would have convicted
    // a page that was right. The place a row was reckoned at is the row's
    // fact, never the tower's (Day 18) — so the question put here is
    // whether the rows still say where they were reckoned.
    const ledgerRowPlaces = await moved.evaluate(() =>
      fetch('ledger.json', { cache: 'no-cache' })
        .then((r) => r.json())
        .then((rows) => Array.from(new Set(rows.map((e) => e && e.place && e.place.name).filter(Boolean))))
        .catch(() => null));
    check(Array.isArray(ledgerRowPlaces) && ledgerRowPlaces.length > 0,
      `the ledger's rows carry places to check against (${(ledgerRowPlaces || []).join(', ')})`);

    if (Array.isArray(ledgerRowPlaces) && ledgerRowPlaces.length > 0) {
      const ledgerText = await moved.evaluate(() => {
        const ledger = document.querySelector('#ledger-list');
        return ledger ? (ledger.innerText || ledger.textContent || '') : '';
      });
      const unnamed = ledgerRowPlaces.filter((name) => !ledgerText.includes(name));
      check(unnamed.length === 0,
        unnamed.length === 0
          ? `the exemption is load-bearing: the ledger names every place its rows were reckoned at (${ledgerRowPlaces.join(', ')})`
          : `the ledger does not name ${unnamed.join(', ')}, so lifting it out of the sweep exempts nothing`);
    }

    // And the pledge exemption is held to the same standard, for the same
    // reason: a pledge section that had gone quiet would make the sweep
    // above green for a reason that has nothing to do with the prose. The
    // place asked for is the **pledge's own**, read off the instrument, not
    // the tower's — the two are only the same word on a morning like the one
    // this check was written on, and building to that would bake today's
    // collision in as the rule.
    const pledgedPlace = await moved.evaluate(() => {
      const s = window.Reckoning && window.Reckoning.STANDING;
      return s && s.pledge && s.pledge.place ? s.pledge.place.name : null;
    });
    if (pledgedPlace) {
      const pledgeText = await moved.evaluate(() => {
        const section = document.querySelector('#pledge-section');
        return section ? (section.innerText || section.textContent || '') : '';
      });
      check(pledgeText.includes(pledgedPlace),
        pledgeText.includes(pledgedPlace)
          ? `the exemption is load-bearing: the pledge names the place it promised (${pledgedPlace})`
          : `the pledge does not name ${pledgedPlace}, so lifting it out of the sweep exempts nothing`);
    }
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
    const body = before.replace(NEEDLE, (m, head, _old, tail) => head + JSON.stringify(far) + tail);
    doorLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await door.goto(URL, { waitUntil: 'networkidle' });
  check(doorLanded, `the forgery landed on the front door too`);

  if (doorLanded) {
    // The pledge line is lifted out for the same reason it is in the room
    // above: `#pledge-line` draws the pledge's own place, which this
    // forgery does not move, so it lawfully names a city the tower is not
    // standing in. Removing it from the *clone* and not from the page keeps
    // the sweep looking at everything else — the fault Day 23 found here was
    // a hand-kept list of what to look at, and an exemption is not that.
    const lintel = await door.evaluate(() => {
      const body = document.body.cloneNode(true);
      const pledge = body.querySelector('#pledge-line');
      if (pledge) pledge.remove();
      return body.innerText || body.textContent || '';
    });
    // The positive case first, because the negative one alone would go green
    // on a lintel that had stopped naming any city at all.
    check(lintel.includes(far.name),
      `the front door names ${far.name}, the city the tower now stands in`);
    check(!lintel.includes(home.name),
      `and no longer names ${home.name}, the one it has left`);
    // And the lifted line is held to its job, so the exemption cannot go
    // green by the pledge falling silent.
    const doorPledge = await door.evaluate(() => {
      const line = document.getElementById('pledge-line');
      return line ? (line.innerText || line.textContent || '') : '';
    });
    const doorPledged = await door.evaluate(() => {
      const s = window.Reckoning && window.Reckoning.STANDING;
      return s && s.pledge && s.pledge.place ? s.pledge.place.name : null;
    });
    if (doorPledged) {
      check(doorPledge.includes(doorPledged),
        doorPledge.includes(doorPledged)
          ? `the front door's pledge line still names ${doorPledged}, so lifting it out exempts something`
          : `the front door's pledge line does not name ${doorPledged} — the exemption exempts nothing`);
    }
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
    const body = before.replace(NEEDLE, (m, head, _old, tail) => head + JSON.stringify(NOWHERE) + tail);
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
    const body = before.replace(NEEDLE, (m, head, _old, tail) => head + JSON.stringify(far) + tail);
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
