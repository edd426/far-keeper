// tools/gallery-room.js — the gallery shows what the front page would, for
// every city the ledger names, in the order the ledger names them.
//
//     ./scripts/local-snapshot.sh tools/gallery-room.js
//
// Built Day 54 with `gallery/`. The room is a picture room and measures
// nothing, so this suite follows `skyline-scene.js`'s line: **assert the
// mechanism, never judge the art.** The mechanism has three claims, and each
// is a second copy of something that lives elsewhere, which is exactly where
// this house's faults have lived:
//
//   1. **The list is the ledger's.** The cities, their order and their dates
//      come from `reckoning/ledger.json`, never a hand-kept itinerary. This
//      file reads the ledger in node and holds the room against it.
//   2. **Each picture is the front page's.** Forge the front page onto a city
//      on the wire and its scene must be byte-identical to that city's
//      picture here. Not *similar*: the gallery is not allowed a copy of the
//      tower art or its own way of laying a silhouette behind it.
//   3. **Every drawing is shown.** Every key in `Skyline.SKYLINES` appears as a
//      drawn picture — a silhouette kept and never seen is what the room was
//      asked for to end.
//
// And two forks the room has and nothing in the live data reaches today:
//   - the standing place with no ledger row yet (the morning of a move, before
//     `reckon.js` runs) — forged by taking the standing place's rows off the
//     ledger on the wire;
//   - the front page that cannot be fetched — the room must draw nothing and
//     say so, never fall back to a copy.
//
// **Made to fail, sabotage written before the needles (Day 43).** Each in a
// scratch tree, asserting the sabotage landed first:
//
//   W=$(mktemp -d)/pre; git clone -q --local . "$W"
//   tar -cf - --exclude=.git --exclude=node_modules --exclude=previews . \
//     | (cd "$W" && tar -xf -)
//   ln -s "$PWD/node_modules" "$W/node_modules"
//   # (a) hand the room an order of its own:
//   perl -0pi -e 's/return a\.date < b\.date \? -1 : a\.date > b\.date \? 1 : 0;/return a.place.name < b.place.name ? -1 : 1;/' "$W/gallery/gallery.js"
//   # (b) stop laying the silhouette behind the tower:
//   perl -0pi -e 's/var composed = drawn \? sky\.compose\(scene\.art, drawn\) : null;/var composed = drawn ? drawn.slice() : null;/' "$W/gallery/gallery.js"
//   # (c) forget the standing place the ledger has not reached:
//   perl -0pi -e 's/if \(standing && standing\.place && !byName/if (false && standing && standing.place && !byName/' "$W/gallery/gallery.js"
//   # (d) fall back to a blank art when the front page will not come:
//   perl -0pi -e "s/if \(!r\.ok\) throw new Error\('front page ' \+ r\.status\);//" "$W/gallery/gallery.js"
//   cmp -s gallery/gallery.js "$W/gallery/gallery.js" && echo "SABOTAGE DID NOT LAND"
//   cd "$W" && ./scripts/local-snapshot.sh tools/gallery-room.js

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;
const ROOT = path.resolve(__dirname, '..');
const GALLERY = URL.replace(/\/?$/, '/') + 'gallery/';

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

// The same needle as skyline-scene.js, and for the same reason: anchored at
// both ends of the field and naming no city.
const NEEDLE = /(var STANDING = \{\s*place:\s*)([\s\S]*?)(,\s*\n\s*since:)/;

function forgeStanding(page, place, onLanded) {
  return page.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const body = before.replace(NEEDLE, (m, head, _old, tail) => head + JSON.stringify(place) + tail);
    // Landed means the slot now holds this place — not that the bytes moved.
    // Forged onto the place a copy already stands in (the rehearsal's control),
    // the bytes do not move and the forgery has still landed (Day 54).
    const slot = body.match(NEEDLE);
    onLanded(!!slot && slot[2] === JSON.stringify(place));
    await route.fulfill({ response, body });
  });
}

async function roomOf(page) {
  await page.goto(GALLERY, { waitUntil: 'networkidle' });
  return page.evaluate(() => ({
    items: [...document.querySelectorAll('.gallery-item')].map((li) => {
      const pre = li.querySelector('pre.scene');
      return {
        name: li.querySelector('h2').textContent,
        city: pre && pre.getAttribute('data-city'),
        drawn: pre && pre.getAttribute('data-skyline'),
        text: pre && pre.textContent,
        label: pre && pre.getAttribute('aria-label'),
        dates: [...li.querySelectorAll('.gallery-dates')].map((p) => p.textContent).join(' ')
      };
    }),
    scenes: document.querySelectorAll('pre.scene').length,
    said: (document.getElementById('gallery-list') || {}).textContent || ''
  }));
}

(async () => {
  // ---- What the room is held against, read here and not in the page -----
  const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'reckoning/ledger.json'), 'utf8'));
  const order = [];
  const span = {};
  const placeOf = {};
  [...ledger].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).forEach((row) => {
    const n = row.place.name;
    if (!span[n]) { span[n] = { first: row.date, last: row.date, rows: 0 }; order.push(n); placeOf[n] = row.place; }
    span[n].last = row.date;
    span[n].rows += 1;
  });
  check(order.length >= 5,
    `the ledger names ${order.length} places (${order.join(', ')}) — the domain this room is held against is not empty`);

  const Reckoning = require(path.join(ROOT, 'reckoning/reckoning.js'));
  const standing = Reckoning.STANDING.place.name;
  const expected = order.includes(standing) ? order : order.concat([standing]);

  const browser = await chromium.launch({ executablePath: EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const room = await roomOf(page);
  const drawnCities = await page.evaluate(() => Object.keys(window.Skyline.SKYLINES));

  // ---- 1. The list is the ledger's ----------------------------------------
  const shown = room.items.map((i) => i.name);
  check(JSON.stringify(shown) === JSON.stringify(expected),
    `the room lists ${shown.join(' → ')}, the ledger's own order`);
  for (const name of order) {
    const item = room.items.find((i) => i.name === name);
    const s = span[name];
    const wanted = s.first === s.last ? [s.first] : [s.first, s.last, `(${s.rows})`];
    check(!!item && wanted.every((w) => item.dates.includes(w)),
      `${name}: the dates are the ledger's first and last rows there (${wanted.join(' … ')})`);
  }
  const standingItem = room.items.find((i) => i.name === standing);
  check(!!standingItem && /Standing here now/.test(standingItem.dates),
    `${standing}, where the tower stands, is marked as standing here now`);
  check(room.items.filter((i) => /Standing here now/.test(i.dates)).length === 1,
    'and exactly one city is');

  // ---- 3. Every drawing is shown -------------------------------------------
  for (const name of drawnCities) {
    const item = room.items.find((i) => i.name === name);
    check(!!item && item.drawn === name,
      `${name}'s drawing is shown (data-skyline="${item ? item.drawn : 'absent'}")`);
  }

  // Labels: decoration's voice, and the memory said where a reader meets it.
  for (const item of room.items) {
    check(item.label && !/\d/.test(item.label),
      `${item.name}: the picture's label carries no digits`);
    if (item.drawn === item.name) {
      check(/drawn from memory, not from sight/.test(item.label),
        `${item.name}: the label says the city is drawn from memory, not from sight`);
    }
  }
  await page.close();

  // ---- 2. Each picture is the front page's, byte for byte ------------------
  //
  // Forge the front page onto each drawn city the ledger has stood in, using
  // the place exactly as the ledger recorded it.
  for (const name of drawnCities.filter((n) => placeOf[n])) {
    const front = await browser.newPage({ viewport: { width: 390, height: 900 } });
    let landed = false;
    await forgeStanding(front, placeOf[name], (ok) => { landed = ok; });
    await front.goto(URL, { waitUntil: 'networkidle' });
    const scene = await front.$eval('#scene-mount', (pre) => ({
      text: pre.textContent, drawn: pre.getAttribute('data-skyline')
    }));
    const item = room.items.find((i) => i.name === name);
    check(landed && scene.drawn === name,
      `the front page, forged onto ${name}, draws ${name} (the forgery landed: ${landed})`);
    check(!!item && item.text === scene.text,
      `and the gallery's ${name} is that same picture, byte for byte`);
    await front.close();
  }

  // ---- The morning of a move: a standing place with no row yet -------------
  const early = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let rowsDropped = 0;
  await early.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const rows = await response.json();
    const kept = rows.filter((r) => r.place.name !== standing);
    rowsDropped = rows.length - kept.length;
    await route.fulfill({ response, body: JSON.stringify(kept) });
  });
  const beforeRow = await roomOf(early);
  check(rowsDropped > 0, `the forgery landed: ${rowsDropped} ${standing} rows taken off the ledger on the wire`);
  const last = beforeRow.items[beforeRow.items.length - 1];
  check(!!last && last.name === standing && /no row from here yet/.test(last.dates) &&
        last.dates.includes(Reckoning.STANDING.since),
    `with no ${standing} row yet, ${standing} still comes last, dated from STANDING.since and saying the ledger has no row`);
  await early.close();

  // ---- A front page that will not come: draw nothing, say so --------------
  const blind = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let refused = false;
  await blind.route(/\/index\.html$/, async (route) => {
    refused = true;
    await route.fulfill({ status: 404, body: 'gone' });
  });
  const dark = await roomOf(blind);
  check(refused, 'the forgery landed: the front page was refused to the gallery');
  check(dark.scenes === 0 && /nothing is shown/.test(dark.said),
    `with no front page to read the tower from, the room draws nothing and says so (${dark.scenes} pictures)`);
  await blind.close();

  // ---- The scene budget, at all three widths --------------------------------
  const widths = await browser.newPage();
  await widths.goto(GALLERY, { waitUntil: 'networkidle' });
  for (const width of [375, 390, 1440]) {
    await widths.setViewportSize({ width, height: 900 });
    const m = await widths.evaluate(() => ({
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scenes: [...document.querySelectorAll('pre.scene')].map((s) => s.scrollWidth - s.clientWidth),
      count: document.querySelectorAll('pre.scene').length
    }));
    check(m.count > 0, `${width}px: there are pictures to measure (${m.count})`);
    check(m.page <= 0, `${width}px: the page does not scroll sideways (${m.page})`);
    check(m.scenes.every((d) => d <= 0), `${width}px: no picture scrolls inside its own box (${m.scenes.join(', ')})`);
  }
  await widths.close();
  await browser.close();

  if (problems.length) {
    console.error(`\nFAIL — ${problems.length} of the room's claims did not hold.`);
    process.exit(1);
  }
  console.log('\nPASS — the gallery lists the ledger\'s places in the ledger\'s order, each');
  console.log('picture is the front page\'s own, and every drawing is shown.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
