// tools/skyline-scene.js — the picture that ships is the picture that was drawn.
//
//     ./scripts/local-snapshot.sh tools/skyline-scene.js
//
// Built Day 28, beside `skyline.js`, and the hard part was working out what a
// check on a decoration is even allowed to be. The scene measures nothing on
// purpose (Article V, as amended 2026-08-30), so there is no number to verify
// and no prediction to fail. A suite that asserted the drawing was *good*
// would be an opinion wearing a test's face, which is the same disguise the
// picture itself is forbidden.
//
// Ember drew the line and it is the one this file holds to: **assert the
// mechanism, never judge the art.** Four things are mechanism here.
//
//   1. The scene keys off `STANDING.place.name`. Forge the tower onto
//      another city and a different silhouette must come back — the whole
//      of what Evan asked for was *a skyline that changes when the tower
//      moves*, and a picture that stays put while the tower moves is the
//      exact fault the board message is about.
//   2. A city with no silhouette draws nothing, says so, and cannot pass
//      for a drawn one. Ember's point, and it is `UNPLACED` / `NOWHERE` /
//      `ALREADY_PUBLISHED` again: a state with no word of its own gets
//      described by the nearest word that has one, and that word is wrong.
//      Under one place a week the tower reaches an undrawn city soon.
//   3. Every shipped silhouette lands whole. `compose()` refuses a
//      composition in which any glyph would be eaten by the tower or by a
//      star, so this asserts that no silhouette in the file is being
//      refused — a picture silently falling back to no picture is a thing
//      nobody would ever notice.
//   4. The label stays in decoration's voice. No digits: a number in the
//      aria-label is the first inch of an instrument's face.
//
// What it deliberately does NOT check: whether the silhouette resembles the
// city. Nothing in this tower can check that. Article IV gives two windows,
// the clock and mathematics, and a skyline comes through neither — the
// shapes are drawn from a memory of cities this tower has never seen, which
// is said outright in `skyline.js` and in the scene's own aria-label. Ash's
// second half stands as a thing a reader may hold us to and no suite can:
// resemblance is not a claim, but its total absence would be its own kind
// of shrug.
//
// **Made to fail.** Four ways, each landing on a different case; run each in
// a scratch tree and assert the sabotage landed first (Day 5).
//
//   W=$(mktemp -d)/pre; git clone -q --local . "$W"
//   tar -cf - --exclude=.git --exclude=node_modules --exclude=previews . \
//     | (cd "$W" && tar -xf -)
//   ln -s "$PWD/node_modules" "$W/node_modules"
//   # (a) make the undrawn city borrow a drawn one's silhouette:
//   perl -0pi -e "s/\? SKYLINES\[name\] : null/? SKYLINES[name] : SKYLINES.Paris/" "$W/skyline.js"
//   # (b) stop the scene keying off the standing place:
//   perl -0pi -e "s/var name = standing\.place\.name;/var name = 'Auckland';/" "$W/skyline.js"
//   # (c) let a clipped silhouette ship anyway. THIS ONE DID NOT BITE at
//   #     first: with the guard gone nothing is refused, and with it there
//   #     nothing is refused either, because both shipped silhouettes fit.
//   #     The case that catches it now is the manufactured collider below,
//   #     added because this recipe failed to make the suite fail.
//   perl -0pi -e "s/if \(there !== ' ' && here !== ' '\) return null;//" "$W/skyline.js"
//   # (d) put a number in the label:
//   perl -0pi -e "s/behind it\./behind it, 42 columns wide./" "$W/skyline.js"
//   cmp -s skyline.js "$W/skyline.js" && echo "SABOTAGE DID NOT LAND"
//   cd "$W" && ./scripts/local-snapshot.sh tools/skyline-scene.js

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

// Anchored at both ends of the field, and naming no city. Day 26: a needle
// matching an *identifier* cannot move a tower whose place is already an
// inline object, which is what `move-rehearsal.sh` writes — so the forgery
// would silently fail to land and every case under it would blame the
// fixture.
const NEEDLE = /(var STANDING = \{\s*place:\s*)([\s\S]*?)(,\s*\n\s*since:)/;

function forge(page, place, onLanded) {
  return page.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(NEEDLE, (m, head, _old, tail) => head + JSON.stringify(place) + tail);
    onLanded(body !== before);
    await route.fulfill({ response, body });
  });
}

async function sceneOf(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#scene-mount');
  return page.$eval('#scene-mount', (pre) => ({
    text: pre.textContent,
    drawn: pre.getAttribute('data-skyline'),
    label: pre.getAttribute('aria-label')
  }));
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // The art a reader with no script gets, read off the wire rather than kept
  // here — a second copy of the tower art in this file would be a fixture
  // that rots the first time somebody adds a star.
  const raw = await (await fetch(URL)).text();
  const STATIC_ART = raw.match(/<pre class="scene"[^>]*aria-label="[^"]*">\n([\s\S]*?)<\/pre>/)[1];
  check(STATIC_ART.trim().length > 0, 'the static scene art was found in index.html');

  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });

  // ---- Part one: the tower as it stands, unforged ---------------------
  const here = await sceneOf(page, URL);
  const home = await page.evaluate(() => window.Reckoning.STANDING.place.name);
  const drawnCities = await page.evaluate(() => Object.keys(window.Skyline.SKYLINES));
  check(drawnCities.length >= 2,
    `at least two cities have silhouettes (${drawnCities.join(', ')}) — with one, "it changes when the tower moves" cannot be shown with real data`);

  const homeIsDrawn = drawnCities.includes(home);
  check(here.drawn === (homeIsDrawn ? home : 'none'),
    `the scene says which branch ran: data-skyline="${here.drawn}" for a tower standing in ${home}`);

  if (homeIsDrawn) {
    check(here.text !== STATIC_ART,
      `something was actually drawn behind the tower — the composed scene is not the static art`);
    check(here.label.includes(home) && /drawn from memory, not from sight/.test(here.label),
      `the label names ${home} and says the city is drawn from memory, not from sight`);
  } else {
    check(here.text === STATIC_ART,
      `${home} has no silhouette, so the scene is the static art untouched`);
    check(new RegExp(`No skyline has been drawn for ${home}`).test(here.label),
      `and the label says so rather than letting the bare ground pass for a drawing`);
  }

  // A number in the label is the first inch of an instrument's face. The
  // picture is allowed to measure nothing; it is not allowed to look as
  // though it measured something.
  check(!/\d/.test(here.label),
    'the scene label carries no digits — a decoration must not wear an instrument\'s face');

  // Every silhouette in the file composes. `compose()` returns null rather
  // than shipping a picture with a hole in it, so a refused silhouette is
  // otherwise perfectly silent.
  const refused = await page.evaluate((art) => {
    const lines = art.replace(/\n$/, '').split('\n');
    return Object.keys(window.Skyline.SKYLINES)
      .filter((name) => window.Skyline.compose(lines, window.Skyline.SKYLINES[name]) === null);
  }, STATIC_ART);
  check(refused.length === 0,
    `every shipped silhouette lands whole behind the tower${refused.length ? ` — refused: ${refused.join(', ')}` : ''}`);

  // And the case above needs this one under it, which the sabotage recipe
  // found rather than the design. Removing the clipping guard from
  // `compose()` does not make the case above fail: with the guard gone
  // nothing is refused, and with the guard there nothing is refused either,
  // because both shipped silhouettes happen to fit. The case asks whether
  // the art fits — a real question — and has no way to ask whether the
  // refusal still works. **A check with an empty domain always says yes**
  // (Day 27), and this is the third time this house has met it.
  //
  // So the guard gets a live domain: a silhouette manufactured on purpose to
  // collide, handed to the shipped `compose()`. Day 17's rule the right way
  // round — go through the instrument rather than lean on whatever happens
  // to be lying about.
  const clipping = await page.evaluate((art) => {
    const lines = art.replace(/\n$/, '').split('\n');
    const wide = '█'.repeat(42);
    const fixture = [wide, wide];
    // The fixture must actually collide, or the assertion under it is as
    // vacuous as the one it was written to shore up.
    const ground = window.Skyline.lastDrawnRow(lines);
    const collides = [ground - 2, ground - 1].some((r) => (lines[r] || '').trim() !== '');
    return { collides, composed: window.Skyline.compose(lines, fixture) };
  }, STATIC_ART);
  check(clipping.collides,
    'the clipping fixture really does overlap the tower art (or the case below proves nothing)');
  check(clipping.composed === null,
    'a silhouette that would be clipped is refused whole, rather than shipped with a hole in it');
  await page.close();

  // ---- Part two: move the tower, and the picture must move with it ----
  //
  // Forged onto the other drawn city. This is the case the whole thread is
  // about: on Day 27 the tower moved to Auckland and the front page went on
  // showing the scene it had shown in Paris.
  const other = drawnCities.find((name) => name !== home);
  const otherPlace = await (async () => {
    const p = await browser.newPage();
    await p.goto(URL, { waitUntil: 'networkidle' });
    const found = await p.evaluate((name) => {
      const r = window.Reckoning;
      for (const key of Object.keys(r)) {
        const v = r[key];
        if (v && typeof v === 'object' && v.name === name && v.zone) return v;
      }
      return null;
    }, other);
    await p.close();
    return found;
  })();
  check(!!otherPlace, `the instrument knows a place called ${other} to forge the tower onto`);

  if (otherPlace) {
    const moved = await browser.newPage({ viewport: { width: 390, height: 900 } });
    let landed = false;
    await forge(moved, otherPlace, (ok) => { landed = ok; });
    const there = await sceneOf(moved, URL);
    check(landed, `the forgery landed: the instrument on the wire stands at ${other}`);
    check(there.drawn === other,
      `standing in ${other}, the scene draws ${other} (data-skyline="${there.drawn}")`);
    check(there.text !== here.text,
      `and it is a different picture from the one ${home} gets — the scene keys off where the tower stands`);
    check(there.label.includes(other) && !there.label.includes(home),
      `the label follows too: it names ${other} and not ${home}`);
    await moved.close();
  }

  // ---- Part three: a city nobody has drawn -----------------------------
  //
  // Moves are Sundays, one place a week, no city twice, so this is not a
  // hypothetical: it is what next Sunday looks like unless a silhouette is
  // drawn first. It must draw nothing, say nothing false, and — the load-
  // bearing half — must not come back byte-identical to a city that *is*
  // drawn, which is what a plausible fallback would do.
  const UNDRAWN_CANDIDATES = [
    { name: 'Reykjavik', latitude: 64.1466, longitude: -21.9426, zone: 'Atlantic/Reykjavik' },
    { name: 'Quito', latitude: -0.1807, longitude: -78.4678, zone: 'America/Guayaquil' },
    { name: 'Nairobi', latitude: -1.2921, longitude: 36.8219, zone: 'Africa/Nairobi' }
  ];
  const undrawn = UNDRAWN_CANDIDATES.find((p) => !drawnCities.includes(p.name));
  check(!!undrawn,
    'a candidate city exists that has no silhouette — without one this part tests nothing');

  if (undrawn) {
    const blank = await browser.newPage({ viewport: { width: 390, height: 900 } });
    let landed = false;
    await forge(blank, undrawn, (ok) => { landed = ok; });
    const nothing = await sceneOf(blank, URL);
    check(landed, `the forgery landed: the instrument on the wire stands at ${undrawn.name}`);
    check(nothing.drawn === 'none',
      `${undrawn.name} has no silhouette and the scene says so (data-skyline="${nothing.drawn}")`);
    check(nothing.text === STATIC_ART,
      `the scene falls back to the bare tower, which asserts nothing about any city`);
    // The load-bearing one. A fallback that borrowed a drawn city's shape
    // would satisfy every other case in this part — it draws *something*,
    // the page does not break, nothing looks wrong. It would simply be
    // another city's horizon with this city's name over it.
    const wouldBe = await blank.evaluate((art) => {
      const lines = art.replace(/\n$/, '').split('\n');
      return Object.keys(window.Skyline.SKYLINES).map((name) => {
        const composed = window.Skyline.compose(lines, window.Skyline.SKYLINES[name]);
        return composed ? composed.join('\n') + '\n' : null;
      }).filter(Boolean);
    }, STATIC_ART);
    check(wouldBe.length === drawnCities.length,
      `all ${drawnCities.length} drawn silhouettes composed, to be compared against`);
    check(!wouldBe.includes(nothing.text),
      `and it is not some other city's picture wearing ${undrawn.name}'s name`);
    check(new RegExp(`No skyline has been drawn for ${undrawn.name}`).test(nothing.label),
      `the label names the gap instead of leaving the flat ground to speak for it`);
    check(!drawnCities.some((name) => nothing.label.includes(name)),
      `and names no city that does have one`);
    await blank.close();
  }

  // ---- Part four: the scene budget, at all three widths ----------------
  const widths = await browser.newPage();
  await widths.goto(URL, { waitUntil: 'networkidle' });
  for (const width of [375, 390, 1440]) {
    await widths.setViewportSize({ width, height: 900 });
    const measured = await widths.evaluate(() => ({
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scene: (() => {
        const s = document.getElementById('scene-mount');
        return s.scrollWidth - s.clientWidth;
      })()
    }));
    check(measured.page <= 0, `${width}px: the page does not scroll sideways (${measured.page})`);
    check(measured.scene <= 0, `${width}px: the scene does not scroll inside its own box (${measured.scene})`);
  }
  const widest = await widths.evaluate(() =>
    Math.max(...document.getElementById('scene-mount').textContent.split('\n').map((l) => l.length)));
  check(widest <= 42, `the composed scene stays inside the 42-column budget (${widest})`);
  await widths.close();

  await browser.close();

  if (problems.length) {
    console.error(`\nFAIL — ${problems.length} of the day's claims did not hold.`);
    process.exit(1);
  }
  console.log('\nPASS — the picture changes when the tower moves, an undrawn city draws');
  console.log('nothing and says so, and every silhouette that ships lands whole.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
