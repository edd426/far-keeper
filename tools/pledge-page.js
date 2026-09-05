// pledge-page.js — what a reader actually gets about the tower's word.
//
// Day 25. The tower announced, before going, where it stands on Sunday. The
// announcement's whole worth is that it is *on the page* rather than in a
// diary and a commonplace book, which is three of us in a room — so what this
// suite checks is the thing a browser renders, not the value the instrument
// holds. Those are two roads out of one file and they can part (Day 9).
//
// Four states, and the third is the one the apparatus exists for:
//
//   PLEDGED  the morning has not come; the page says where the tower goes
//   KEPT     the tower stands where it said
//   BROKEN   the morning came and went and the tower is somewhere else
//   NONE     no promise is outstanding; the page must say nothing at all
//
// BROKEN is forged **on the wire** with `page.route`, never on disk — the
// same rule as `ledger-verdicts.js` and for the same reason: a test that
// edits the thing it is testing has already stopped testing it. And every
// substitution is asserted to have landed before anything is concluded from
// it (Day 5: a test that cannot break always passes).
//
// What this suite does NOT establish, said here rather than left for a reader
// to assume: that the tower will actually move. Nothing here can. `reckon()`
// is pure on the date handed it, so the figures for Auckland on the thirtieth
// are computable today and will agree with themselves on the day — Day 16's
// tautology, which is why no forward row goes in the cold ledger. The only
// thing that can convict the pledge is the thirtieth arriving with this tower
// standing somewhere else, and that test cannot be manufactured; it has to
// happen in time (Ash's split, Day 18).
'use strict';

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH;

let failures = 0;
let checks = 0;

function ok(label, extra) {
  checks++;
  console.log('ok    ' + label + (extra ? '  (' + extra + ')' : ''));
}

function bad(label, detail) {
  checks++;
  failures++;
  console.log('FAIL  ' + label + (detail ? '  — ' + detail : ''));
}

function check(label, condition, detail) {
  if (condition) ok(label); else bad(label, detail);
}

// Rewrite STANDING on the wire. `before` is asserted present first, so a
// substitution that silently no-ops cannot be read as a passing case — that
// is the whole of Day 5's rule and it has earned itself here twice already
// (the anchored form below is the second draft; the first matched an
// identifier and could not move a tower already moved to an inline object).
async function forgeStanding(page, replacement) {
  let landed = false;
  await page.route('**/reckoning.js*', async (route) => {
    const res = await route.fetch();
    const body = await res.text();
    const next = body.replace(
      /var STANDING = \{[\s\S]*?\n  \};/,
      'var STANDING = ' + replacement + ';');
    landed = next !== body;
    await route.fulfill({ response: res, body: next });
  });
  return () => landed;
}

const AUCKLAND =
  "{ name: 'Auckland', latitude: -36.8485, longitude: 174.7633, zone: 'Pacific/Auckland' }";
// Day 32. A place east of everywhere: Kiritimati keeps UTC+14, so its civil
// day opens before any other on earth. It is on the survey's shortlist and is
// used here only as a fixture — a destination a westward collision cannot
// happen to.
const KIRITIMATI =
  "{ name: 'Kiritimati', latitude: 1.8721, longitude: -157.4278, zone: 'Pacific/Kiritimati' }";
const PLEDGE_TO_AUCKLAND =
  "{ place: " + AUCKLAND + ", on: '2026-08-30', announced: '2026-08-28' }";

async function run() {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- 1. PLEDGED, as the tower stands right now, unforged ----
  {
    const page = await browser.newPage();
    await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });

    const hidden = await page.locator('#pledge-section').isHidden();
    check('the pledge section is shown at all', !hidden,
      'it is hidden — a promise nobody walks past is the fault this was built against');

    // Where the tower stands is *asked*, never typed. This line read
    // `/Paris/` until Day 26, when the browser half of `move-rehearsal.sh`
    // ran for the first time and this suite — written on Day 25, the morning
    // after Day 24 found four suites that thought they lived in Paris —
    // went red in a moved copy about a page that was right. It is the file
    // whose whole subject is the promise to leave Paris.
    const standingName = await page.evaluate(() => {
      const s = window.Reckoning && window.Reckoning.STANDING;
      return s && s.place ? s.place.name : null;
    });
    check('the instrument hands back a standing place to check against',
      typeof standingName === 'string' && standingName.length > 0, String(standingName));

    // Day 32. Everything below used to be typed: `/Auckland/`, `2026-08-30`,
    // `2026-08-28`, `06:45`, `11h 13m 26s`, `+2m 12s`. All six were true of
    // the pledge that was live the morning this file was written, and all six
    // went red the first morning a different pledge stood — about a page that
    // was correct. Day 31 saw it coming and named it: *case 1 is labelled
    // "as the tower stands right now, unforged", and the label is now false.*
    //
    // The repair was already in this file, two lines up, and had been since
    // Day 26: `standingName` is **asked of the instrument** rather than typed,
    // because a suite that names where you are carries an expiry with no date
    // on it (Day 24). That lesson was applied to `place` and never once to
    // `pledge` — the same file, the same case, the same fault, four fields
    // along. So the live pledge and the destination's own figures are asked
    // for here, and the page is held against what the instrument says rather
    // than against what was true in August.
    //
    // Guarded, because a forge that came back empty would make every regex
    // below match nothing and pass vacuously — Day 21's `[].every(...)`, and
    // Day 17's rule that a suite must watch its own *building* as hard as its
    // own breaking.
    const live = await page.evaluate(() => {
      const R = window.Reckoning;
      const p = R && R.STANDING && R.STANDING.pledge;
      if (!p) return null;
      const e = R.reckon(p.on, p.place);
      return {
        to: p.place.name, on: p.on, announced: p.announced,
        sunrise: e.sunrise, sunset: e.sunset, dayLength: e.dayLength,
        drift: e.changeSinceYesterdayMinutes,
        crossesDayLine: !!(e.working && (
          e.working.sunriseUTCMinutes < 0 || e.working.sunriseUTCMinutes >= 1440 ||
          e.working.sunsetUTCMinutes < 0 || e.working.sunsetUTCMinutes >= 1440)),
      };
    });
    check('the instrument hands back a live pledge to check the page against',
      !!(live && live.to && live.on && live.announced && live.sunrise && live.dayLength),
      JSON.stringify(live));
    // Day 19's rule, one room along: a suite must be able to tell its own
    // fixture failing from its subject failing. Without this the lines below
    // would throw a bare TypeError out of `run()` and print a message about
    // reading a property of null, which blames nothing legible.
    if (!live) {
      await page.close();
      await browser.close();
      throw new Error('the instrument returned no live pledge — nothing under ' +
        'case 1 can mean anything, so it is not being read');
    }

    const said = (await page.locator('#pledge-said').textContent()) || '';
    check('the page names the place the tower goes to',
      said.includes(live.to), said.slice(0, 90));
    check('the page names the morning it goes',
      said.includes(live.on), said.slice(0, 90));
    check('the page says when the promise was made',
      said.includes(live.announced), said.slice(0, 90));
    check('the page says where the tower is meanwhile',
      said.includes(standingName), said.slice(0, 90));
    check('an unbroken pledge does not say BROKEN', !/BROKEN/.test(said), said.slice(0, 90));

    // The figures are the destination's. A page that printed the *current*
    // place's numbers under a heading naming the destination would be Day
    // 18's fault one room along: a number and its place must arrive
    // together.
    const figures = (await page.locator('#pledge-figures').textContent()) || '';
    check('the figures name the destination',
      figures.includes(live.to), figures.slice(0, 120));
    check('the figures are the destination\'s sunrise, not this place\'s',
      figures.includes(live.sunrise), figures.slice(0, 200));
    check('the figures carry the day length there',
      figures.includes(live.dayLength), figures.slice(0, 200));

    // The sign of the drift is not asserted, it is *matched*. Auckland's ran
    // the other way and that was the day's news; Anchorage's does not, and a
    // case asserting `longer` would be convicting the page of being right
    // about a different city. What must hold at every destination is that the
    // word and the number agree.
    check('the drift there is published with the sign the instrument gives it',
      /(longer|shorter) than the day before/.test(figures) &&
      (live.drift > 0) === /longer than the day before/.test(figures),
      'instrument says ' + live.drift + ' — ' + figures.slice(0, 260));

    const note = (await page.locator('#pledge-note').textContent()) || '';
    check('the page says why there — the drift reason iff the drift has reversed',
      (live.drift > 0) === /drift there runs the other way/.test(note),
      'instrument says ' + live.drift + ' — ' + note.slice(0, 160));
    check('the page says why there — the day-line reason iff the events cross it',
      live.crossesDayLine === /far side of a UTC midnight/.test(note),
      'instrument says ' + live.crossesDayLine + ' — ' + note.slice(0, 200));

    // Day 32 — the collision paragraph. A forward claim of a different kind
    // from the figures: those are pure arithmetic on a date and are
    // guaranteed to agree with themselves on the day (Day 16), where this
    // one turns on an hour nobody here controls. Held against the instrument
    // both ways, so the case convicts a page that stays silent when the
    // clocks *do* collide as readily as one that invents a collision where
    // there is none — an empty domain always says yes (Day 21, 27, 31), and
    // a one-directional check is how it stays empty unnoticed.
    const clocks = await page.evaluate(() => {
      const R = window.Reckoning;
      const s = R.STANDING;
      return {
        here: R.civilDayStartUTCMinutes(s.pledge.on, s.place.zone),
        there: R.civilDayStartUTCMinutes(s.pledge.on, s.pledge.place.zone),
      };
    });
    const collides = clocks.there > clocks.here;
    let collision = (await page.locator('#pledge-collision').textContent()) || '';
    check('the collision paragraph appears iff the destination starts its day later',
      collides === (collision.length > 0),
      'here ' + clocks.here + ', there ' + clocks.there + ' — ' + collision.slice(0, 120));
    if (collides) {
      const gapHours = ((clocks.there - clocks.here) / 60).toFixed(0);
      check('it names the gap the instrument computes, not one that was typed',
        collision.includes(gapHours + ' hours behind'),
        'instrument says ' + gapHours + ' — ' + collision.slice(0, 200));
      check('it says the tower will publish nothing that morning',
        /publish/.test(collision) && /nothing that\s+morning/.test(collision),
        collision.slice(0, 400));
      check('it says outright that we do not yet know which happened',
        /do not know which yet/.test(collision), collision.slice(0, 400));

      // Day 33 — the three below are the eve's repair, and each one convicts
      // the paragraph as it stood on the morning of the move it describes.
      //
      // The first is a negative and I would normally distrust one: a check
      // that a string is absent goes green the moment somebody rewords the
      // thing it was pointed at (Day 31, where a grep for a flag's name
      // convicted the sentence *about* the flag). It is paired with a
      // positive naming the true witness for exactly that reason — the pair
      // is the case, and the negative alone is not.
      check('it does not promise a hole in the dates, because there will not be one',
        !/gap with a different place/.test(collision) &&
        !/carry a gap/.test(collision),
        collision.slice(0, 400));
      // The morning after is asked of the instrument, never computed here:
      // a second implementation of date arithmetic in a test is a second
      // thing that can be wrong, and it would agree with the page for the
      // wrong reason on every day that is not a month boundary.
      const morningAfter = await page.evaluate(
        (on) => window.Reckoning.shiftDate(on, 1), live.on);
      check('the instrument hands back the morning after, for the case to use',
        /^\d{4}-\d{2}-\d{2}$/.test(morningAfter || ''), String(morningAfter));
      check('it names publishedAt as the witness and the morning the row lands',
        /publishedAt/.test(collision) && collision.includes(morningAfter),
        'expected the morning after ' + live.on + ' — ' + collision.slice(-400));

      // The hour span the paragraph prints must be the ledger's own, not a
      // figure typed beside it. `about 02:15 to 02:35 UTC` stood there for a
      // day and was false of 14 of the 31 rows — and false from the second
      // row this tower ever wrote, four weeks before it was typed. So the
      // case recomputes from the fetched bytes rather than holding the page
      // against a constant, which would only freeze a new one (Day 32).
      // The span is filled from the ledger *fetch*, not from `start()`, so
      // reading the paragraph the instant the page settles is a race — and
      // it is a race this suite lost on its first run and won on the next
      // two, which is the worst way for a case to behave. Wait for the span
      // to carry something, and let the wait time out into a real failure
      // rather than a silent empty string that every regex below would then
      // pass over vacuously (Day 21).
      let hoursFilled = true;
      try {
        await page.waitForFunction(() => {
          const span = document.getElementById('collision-hours');
          return !!(span && span.textContent.trim().length);
        }, null, { timeout: 5000 });
      } catch (error) {
        hoursFilled = false;
      }
      check('the hour span is filled from the ledger fetch, within the wait',
        hoursFilled, 'span still empty after 5s');
      collision = (await page.locator('#pledge-collision').textContent()) || '';

      const ledger = await page.evaluate(
        () => fetch('ledger.json', { cache: 'no-cache' }).then((r) => r.json()));
      check('the ledger opens, so the span has bytes to be read off',
        Array.isArray(ledger) && ledger.length > 0,
        Array.isArray(ledger) ? String(ledger.length) : String(ledger));
      const stamps = (ledger || [])
        .map((entry) => entry.publishedAt)
        .filter((s) => typeof s === 'string' && s.length >= 16)
        .map((s) => s.slice(11, 16))
        .sort();
      check('every row carries publishedAt, so the span is of all the mornings',
        stamps.length === (ledger || []).length,
        stamps.length + ' of ' + (ledger || []).length);
      check('the hour span is the ledger\'s own, recomputed here from its bytes',
        stamps.length > 0 &&
        collision.includes(stamps[0] + ' and ' + stamps[stamps.length - 1] + ' UTC'),
        'ledger says ' + stamps[0] + '..' + stamps[stamps.length - 1] +
        ' — ' + collision.slice(-300));
      check('and it counts the mornings rather than naming a remembered number',
        collision.includes('the ' + stamps.length + ' mornings'),
        'ledger holds ' + stamps.length + ' rows — ' + collision.slice(-300));
    }

    await page.close();
  }

  // ---- 1b. a move that cannot collide, forged ----
  //
  // Written the same hour as the check above and for the hole in it. The live
  // pledge collides, so the *other* half of that `iff` — no paragraph when
  // the clocks do not disagree — has nothing to exercise it and would pass
  // vacuously whatever the guard did. That is the fault this file's own
  // comment two screens up warns about, sitting inside the check written to
  // warn about it, which is Day 28's shape exactly. So the tower is forged
  // eastward: Kiritimati keeps UTC+14 and starts its day two hours *before*
  // Auckland does, and a promise to go there cannot land on a published day.
  {
    const page = await browser.newPage();
    const landed = await forgeStanding(page,
      "{ place: " + AUCKLAND + ", since: '2026-08-30', pledge: { place: " +
      KIRITIMATI + ", on: '2026-09-06', announced: '2026-09-04' } }");
    await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
    check('eastward fixture: the substitution landed', landed(),
      'STANDING was not rewritten — the case below proves nothing');

    const clocks = await page.evaluate(() => {
      const R = window.Reckoning;
      const s = R.STANDING;
      return {
        here: R.civilDayStartUTCMinutes(s.pledge.on, s.place.zone),
        there: R.civilDayStartUTCMinutes(s.pledge.on, s.pledge.place.zone),
      };
    });
    check('the fixture really is a move that cannot collide',
      clocks.there < clocks.here,
      'here ' + clocks.here + ', there ' + clocks.there);

    const said = (await page.locator('#pledge-said').textContent()) || '';
    check('the eastward pledge is still announced', /Kiritimati/.test(said),
      said.slice(0, 120));
    check('and no collision is invented where the clocks agree',
      ((await page.locator('#pledge-collision').textContent()) || '') === '',
      await page.locator('#pledge-collision').textContent());
    await page.close();
  }

  // ---- 2. KEPT — the tower stands where it said ----
  {
    const page = await browser.newPage();
    const landed = await forgeStanding(page,
      "{ place: " + AUCKLAND + ", since: '2026-08-30', pledge: " + PLEDGE_TO_AUCKLAND + " }");
    await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
    check('KEPT fixture: the substitution landed', landed(),
      'STANDING was not rewritten — every case below would be about the real tower');

    const said = (await page.locator('#pledge-said').textContent()) || '';
    check('a kept promise says it is kept', /It does/.test(said), said.slice(0, 140));
    check('a kept promise does not say BROKEN', !/BROKEN/.test(said), said.slice(0, 140));
    check('a kept promise still names the place and the morning',
      /Auckland/.test(said) && /2026-08-30/.test(said), said.slice(0, 140));
    await page.close();
  }

  // ---- 2a. KEPT is reachable — the fault this case is named for ----
  //
  // Ember's find, and it was in the prose before it was in the code. The
  // field was called `next`, which means *the one after this* — so the
  // obvious way to write Sunday's move is to clear it in the same edit that
  // flips `place`, and `pledgeStanding` answers NONE before it ever reaches
  // the branch that vouches. KEPT would have been dead code, and my own KEPT
  // fixture left the field standing, so the code and its test agreed with
  // each other while both disagreed with the sentence I had written
  // describing them. The field is `pledge` now — a thing you keep, not a
  // thing you get past — but the name is a fence and this is the lock: a
  // pledge that has been kept must still say so.
  {
    const page = await browser.newPage();
    const landed = await forgeStanding(page,
      "{ place: " + AUCKLAND + ", since: '2026-08-30', pledge: null }");
    await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
    check('cleared-on-arrival fixture: the substitution landed', landed(),
      'STANDING was not rewritten — the case below proves nothing');
    check('clearing the pledge on arrival is what silences KEPT',
      await page.locator('#pledge-section').isHidden(),
      'the section still speaks with the pledge cleared — then this case has ' +
      'stopped describing the fault it is named for, and the comment above is stale');
    await page.close();
  }

  // ---- 2b. An early arrival reads KEPT, not PLEDGED ----
  //
  // Also Ember's, and named by it as unlikely under one-place-a-week. Fixed
  // anyway: an unlikely branch is the one nobody is watching when it fires,
  // and the wrong answer here is self-contradicting rather than merely
  // absent — a tower already standing in Auckland telling a reader *it is
  // standing in Paris as you read this*.
  {
    const page = await browser.newPage();
    const landed = await forgeStanding(page,
      "{ place: " + AUCKLAND + ", since: '2026-08-29', pledge: " + PLEDGE_TO_AUCKLAND + " }");
    await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
    check('early-arrival fixture: the substitution landed', landed(),
      'STANDING was not rewritten — the case below proves nothing');

    const said = (await page.locator('#pledge-said').textContent()) || '';
    check('arriving a day early still reads as kept', /It does/.test(said), said.slice(0, 160));
    check('an early arrival does not claim to be somewhere else',
      !/standing in Paris as you read this/.test(said), said.slice(0, 160));
    await page.close();
  }

  // ---- 3. BROKEN — the morning came and the tower is still here ----
  //
  // Forged by moving the pledge's date into the past rather than by moving
  // the clock, because the clock is a window this tower does not get to
  // adjust (Article IV) and a test that fakes one is testing a different
  // tower. A pledge dated in the past with the tower still in Paris is
  // exactly the state a broken word leaves behind.
  {
    const page = await browser.newPage();
    const landed = await forgeStanding(page,
      "{ place: PARIS, since: '2026-08-04', pledge: { place: " + AUCKLAND +
      ", on: '2026-08-10', announced: '2026-08-08' } }");
    await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
    check('BROKEN fixture: the substitution landed', landed(),
      'STANDING was not rewritten — the case below proves nothing');

    const said = (await page.locator('#pledge-said').textContent()) || '';
    check('a broken promise says BROKEN', /BROKEN/.test(said), said.slice(0, 200));
    check('it names the place it failed to reach', /Auckland/.test(said), said.slice(0, 200));
    check('it names where the tower actually is', /Paris/.test(said), said.slice(0, 200));
    check('it says plainly that the word was not kept',
      /did not keep its word/.test(said), said.slice(0, 200));
    // The sentence must not read as a fault in the instrument. Day 21: a
    // check that manufactures a diagnosis puts a wrong answer in a reader's
    // mouth, and here the arithmetic is entirely innocent.
    check('it says the arithmetic is not what is broken',
      /Nothing is broken in the arithmetic/.test(said), said.slice(0, 260));

    const cls = await page.locator('#pledge-section').getAttribute('class');
    check('the broken section is marked for the eye',
      /reckoning--broken/.test(cls || ''), String(cls));

    // The rest of the room must survive it. Day 5, one storey along: a
    // sentence that convicts the house by taking the house down has moved
    // the silence, not removed it.
    const today = (await page.locator('#today-figures').textContent()) || '';
    check('the day\'s own figures still draw under a broken promise',
      today.length > 40, 'today-figures is ' + today.length + ' characters');
    await page.close();
  }

  // ---- 4. NONE — no promise outstanding, and the page says nothing ----
  //
  // The quiet case, and it is not a formality. A section that appears when
  // there is nothing to announce would have to invent a sentence, and there
  // is no true sentence about a pledge that does not exist. Day 9: of the two
  // ways a shelf can lie, the one that invents an alarm is the safe one — so
  // check the alarm is not invented.
  {
    const page = await browser.newPage();
    const landed = await forgeStanding(page,
      "{ place: PARIS, since: '2026-08-04', pledge: null }");
    await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
    check('NONE fixture: the substitution landed', landed(),
      'STANDING was not rewritten — the case below proves nothing');

    check('with no promise outstanding the section stays away',
      await page.locator('#pledge-section').isHidden(),
      'the section is shown with nothing to announce');
    await page.close();
  }

  // ---- 5. The front door carries it too, in every state ----
  //
  // The first draft of this suite checked the front door's PLEDGED sentence
  // and stopped. That is Day 23's fault exactly — a sweep that looks only
  // where nothing is wrong and reports the gap as cleanliness. The front door
  // is a second renderer of the same value, written in a different file, and
  // the state that matters most is the one it had never been asked for.
  {
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    // Asked, not typed — same repair as case 1, and for the same reason: this
    // is the *live* pledge, so any literal here expires the next time a hand
    // announces a move.
    const doorPledge = await page.evaluate(() => {
      const p = window.Reckoning && window.Reckoning.STANDING &&
        window.Reckoning.STANDING.pledge;
      return p ? { to: p.place.name, on: p.on } : null;
    });
    check('the front door has a live pledge to be held against',
      !!(doorPledge && doorPledge.to && doorPledge.on), JSON.stringify(doorPledge));
    const line = (await page.locator('#pledge-line').textContent()) || '';
    check('the front door announces the move',
      !!doorPledge && line.includes(doorPledge.to), line.slice(0, 140));
    check('the front door names the morning',
      !!doorPledge && line.includes(doorPledge.on), line.slice(0, 140));
    check('the front door does not cry BROKEN over a live promise',
      !/BROKEN/.test(line), line.slice(0, 140));
    await page.close();
  }

  {
    const page = await browser.newPage();
    const landed = await forgeStanding(page,
      "{ place: PARIS, since: '2026-08-04', pledge: { place: " + AUCKLAND +
      ", on: '2026-08-10', announced: '2026-08-08' } }");
    await page.goto(URL, { waitUntil: 'networkidle' });
    check('front-door BROKEN fixture: the substitution landed', landed(),
      'STANDING was not rewritten — the cases below prove nothing');

    const line = (await page.locator('#pledge-line').textContent()) || '';
    check('the front door says BROKEN when the word was not kept',
      /BROKEN/.test(line), line.slice(0, 200));
    check('the front door names both places',
      /Auckland/.test(line) && /Paris/.test(line), line.slice(0, 200));

    const cls = await page.locator('#pledge-line').getAttribute('class');
    check('the broken lintel line is marked for the eye',
      /lintel-line--broken/.test(cls || ''), String(cls));

    // The scene and the nav must survive it — the front door is the plainest
    // page in the tower and an accusation must not be the thing that empties
    // it.
    const scene = (await page.locator('#scene-mount').textContent()) || '';
    check('the tower still draws under a broken promise',
      scene.length > 100, 'scene is ' + scene.length + ' characters');
    await page.close();
  }

  {
    const page = await browser.newPage();
    const landed = await forgeStanding(page,
      "{ place: PARIS, since: '2026-08-04', pledge: null }");
    await page.goto(URL, { waitUntil: 'networkidle' });
    check('front-door NONE fixture: the substitution landed', landed(),
      'STANDING was not rewritten — the case below proves nothing');
    check('the front door stays quiet with no promise outstanding',
      await page.locator('#pledge-line').isHidden(),
      'the lintel announces something with nothing to announce');
    await page.close();
  }

  // ---- 6. The room must not scroll sideways at any width ----
  for (const width of [375, 390, 1440]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check('the day does not scroll sideways at ' + width, over <= 0, 'overflow ' + over);
    await page.close();
  }

  await browser.close();

  console.log('');
  console.log(failures
    ? 'FAILED — ' + failures + ' of ' + checks + ' checks'
    : 'ok — all ' + checks + ' checks, four pledge states and three widths');
  process.exit(failures ? 1 : 0);
}

run().catch((error) => {
  console.error('pledge-page: ' + error.message);
  process.exit(2);
});
