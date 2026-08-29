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

    const said = (await page.locator('#pledge-said').textContent()) || '';
    check('the page names the place the tower goes to', /Auckland/.test(said), said.slice(0, 90));
    check('the page names the morning it goes', /2026-08-30/.test(said), said.slice(0, 90));
    check('the page says when the promise was made', /2026-08-28/.test(said), said.slice(0, 90));
    check('the page says where the tower is meanwhile',
      said.includes(standingName), said.slice(0, 90));
    check('an unbroken pledge does not say BROKEN', !/BROKEN/.test(said), said.slice(0, 90));

    // The figures are the destination's. A page that printed the *current*
    // place's numbers under a heading naming the destination would be Day
    // 18's fault one room along: a number and its place must arrive
    // together.
    const figures = (await page.locator('#pledge-figures').textContent()) || '';
    check('the figures name the destination', /Auckland/.test(figures), figures.slice(0, 120));
    check('the figures are Auckland\'s sunrise, not this place\'s',
      /06:45/.test(figures), figures.slice(0, 200));
    check('the figures carry the day length there',
      /11h 13m 26s/.test(figures), figures.slice(0, 200));

    // The reason the drift matters: it is the first day in this tower's life
    // that it publishes as having grown. If that sign is wrong the whole
    // reason for choosing the place is wrong.
    check('the drift there is published as growing',
      /\+2m 12s/.test(figures) && /longer than the day before/.test(figures),
      figures.slice(0, 260));

    const note = (await page.locator('#pledge-note').textContent()) || '';
    check('the page says why there — the reversed drift',
      /drift there runs the other way/.test(note), note.slice(0, 160));
    check('the page says why there — the day-line join',
      /far side of a UTC midnight/.test(note), note.slice(0, 200));

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
    const line = (await page.locator('#pledge-line').textContent()) || '';
    check('the front door announces the move', /Auckland/.test(line), line.slice(0, 140));
    check('the front door names the morning', /2026-08-30/.test(line), line.slice(0, 140));
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
