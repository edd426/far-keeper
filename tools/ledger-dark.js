// tools/ledger-dark.js — a dark row in a stranger's browser.
//
//   ./scripts/local-snapshot.sh tools/ledger-dark.js
//
// Day 20. The other half of `tools/dark-row.sh`. That one holds the keeper's
// desk; this one holds the copy of the auditor that runs where we cannot
// reach it, and the two are not the same check — Day 19's rule about two
// copies of one question running on different desks. A claim audited on this
// desk and not in the browser is a forgery caught here and waved through
// there, and nobody in this tower would ever see it happen.
//
// The row is forged **on the wire** with `page.route`, never on disk (Day 11:
// never point a test at the cold record). The real ledger is not touched and
// this file cannot touch it.
//
// What it checks, and each is a thing the page got wrong before today:
//
//   1. A dark row's head printed `undefined → undefined  (undefined)`.
//   2. `CLAIMS` held no `never`, so a row forged from polar night to
//      midnight sun printed the green `unchanged`.
//   3. The green note under a clean row promised the reader that the row's
//      *numbers* had just been recomputed in their browser. On a dark row
//      there are none, so that sentence was a false account of what had
//      just happened on their own screen.
//
// Made to fail: drop `['never', …]` from CLAIMS in page.js and case 2 goes
// red on its own. Put the old `published.sunrise + ' → ' + …` line back and
// case 1 goes red. Each sabotage is asserted below before its failure is
// believed.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const CHROMIUM = process.env.FAR_KEEPER_CHROMIUM_PATH;

let fails = 0;
const ok = (m) => console.log('ok    ' + m);
const bad = (m) => { console.log('FAIL  ' + m); fails += 1; };

// A Tromso place and two rows built from it. The dark row is manufactured
// by `reckon()` itself in the page's own copy of the instrument, not typed
// here — Day 15's rule: a fixture typed by hand is a fixture that can be
// wrong in the same direction as the thing it is testing.
const TROMSO = { name: 'Tromso', latitude: 69.6492, longitude: 18.9553, zone: 'Europe/Oslo' };
const DARK_DATE = '2026-12-21';

async function buildRows(page) {
  return page.evaluate(({ place, dark }) => {
    const R = window.Reckoning;
    const PARIS = { name: 'Paris', latitude: 48.8566, longitude: 2.3522, zone: 'Europe/Paris' };
    const light = R.reckon('2026-08-30', PARIS);
    light.publishedAt = '2026-08-30T05:00:00Z';
    const night = R.reckon(dark, place);
    night.publishedAt = dark + 'T09:00:00Z';
    return [light, night];
  }, { place: TROMSO, dark: DARK_DATE });
}

// Serve a forged ledger and read back what the page made of it.
async function render(browser, rows, label) {
  const page = await browser.newPage();
  const body = JSON.stringify(rows);
  let served = false;
  await page.route('**/ledger.json*', async (route) => {
    served = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });
  await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.ledger__entry', { timeout: 10000 }).catch(() => {});
  // Day 5's rule, and Day 17's: assert the fixture was BUILT before
  // believing anything the page says about it. A route that never fired
  // means the page read the real ledger and every check below is about the
  // wrong document.
  if (!served) bad(`${label}: the forged ledger was never served — the page read something else`);
  const rowsOut = await page.$$eval('.ledger__entry', (nodes) => nodes.map((n) => ({
    date: n.querySelector('.ledger__date').textContent,
    times: n.querySelector('.ledger__times').textContent,
    verdict: n.querySelector('.ledger__verdict').textContent,
    note: Array.from(n.querySelectorAll('.ledger__note')).map((p) => p.textContent).join(' '),
    broken: Array.from(n.querySelectorAll('.ledger__broken li')).map((li) => li.textContent)
  })));
  await page.close();
  return { rowsOut, served };
}

(async () => {
  if (!URL) { console.log('FAIL  no FAR_KEEPER_URL'); process.exit(1); }
  const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});

  // One page just to borrow the page's own instrument for building rows.
  const seed = await browser.newPage();
  await seed.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
  const rows = await buildRows(seed);
  await seed.close();

  if (!rows || rows.length !== 2) {
    bad('the fixture rows were not built at all');
  } else if (rows[1].never !== 'risen') {
    bad(`the dark fixture row is not dark: never is ${JSON.stringify(rows[1].never)}`);
  } else if (rows[1].sunrise !== undefined) {
    bad('the dark fixture row has a sunrise on it, so it is not the row this file is about');
  } else {
    ok(`the fixture was built: an honest ${DARK_DATE} Tromso row with never="risen" and no times`);
  }

  // ---- 1. An honest dark row ----
  {
    const { rowsOut } = await render(browser, rows, 'honest');
    const dark = rowsOut.find((r) => r.date === DARK_DATE);
    const light = rowsOut.find((r) => r.date === '2026-08-30');
    if (!dark) {
      bad('honest: the dark row did not render at all');
    } else {
      /undefined/.test(dark.times)
        ? bad(`honest: the head still reads "${dark.times}"`)
        : ok('honest: no "undefined" in the dark row\'s head');
      /the sun did not rise at Tromso/.test(dark.times)
        ? ok('honest: the head says the sun did not rise at Tromso')
        : bad(`honest: the head says "${dark.times}" instead`);
      /^unchanged at Tromso/.test(dark.verdict)
        ? ok('honest: the verdict is unchanged at Tromso')
        : bad(`honest: the verdict is "${dark.verdict}"`);
      // The badge's power moved while its scope stood still — Day 18's
      // argument. The note is where that is said, so a scanning reader who
      // meets the same green word on a one-word row is told the difference.
      /the same one word/.test(dark.note)
        ? ok('honest: the note says only one word was checked')
        : bad('honest: the note still promises the reader a recompute of numbers');
      /to exactly those numbers/.test(dark.note)
        ? bad('honest: the dark row claims its numbers were recomputed, and it has none')
        : ok('honest: the dark row makes no claim about numbers');
    }
    // The unbroken case must fail the dark case's pass rule, or the checks
    // above are checking nothing (Day 5).
    if (!light) {
      bad('honest: the ordinary Paris row did not render');
    } else {
      /→/.test(light.times)
        ? ok('honest: the ordinary row still prints sunrise → sunset')
        : bad(`honest: the ordinary row's head is "${light.times}"`);
      /to exactly those numbers/.test(light.note)
        ? ok('honest: the ordinary row still claims its numbers were recomputed')
        : bad('honest: the ordinary row lost its recompute sentence');
    }
  }

  // ---- 2. The forgery: polar night into midnight sun ----
  {
    const forged = JSON.parse(JSON.stringify(rows));
    forged[1].never = 'set';
    if (forged[1].never === rows[1].never) {
      bad('forgery: the sabotage did not land — the row still says the same word');
    } else {
      ok('forgery: the sabotage landed — never forged from "risen" to "set"');
      const { rowsOut } = await render(browser, forged, 'forgery');
      const dark = rowsOut.find((r) => r.date === DARK_DATE);
      if (!dark) {
        bad('forgery: the row did not render');
      } else {
        /^DRIFTED/.test(dark.verdict)
          ? ok('forgery: the page convicts it — DRIFTED')
          : bad(`forgery: the page says "${dark.verdict}" about a night forged into a day`);
        dark.broken.some((b) => /whether the sun rose/.test(b))
          ? ok('forgery: the page names the claim that moved')
          : bad(`forgery: the page never named it — ${JSON.stringify(dark.broken)}`);
        // A row on the method running now has no innocent account, and the
        // page must not hand it the method-change story (Day 11).
        /no method change to blame/.test(dark.note)
          ? ok('forgery: it is told there is no method change to blame')
          : bad('forgery: it was handed an account it has not earned');
      }
    }
  }

  // ---- 3. A hand deleting the word, and a hand grafting it on ----
  // The exemption is symmetric or it is a hole (Ember, Day 15).
  {
    const stripped = JSON.parse(JSON.stringify(rows));
    delete stripped[1].never;
    'never' in stripped[1]
      ? bad('deletion: the sabotage did not land')
      : ok('deletion: the sabotage landed — never removed from the dark row');
    const { rowsOut } = await render(browser, stripped, 'deletion');
    const dark = rowsOut.find((r) => r.date === DARK_DATE);
    dark && /^DRIFTED/.test(dark.verdict)
      ? ok('deletion: the page convicts a dark row with its one word cut out')
      : bad(`deletion: the page says "${dark ? dark.verdict : 'nothing'}"`);
  }
  {
    const grafted = JSON.parse(JSON.stringify(rows));
    grafted[0].never = 'risen';
    grafted[0].never === 'risen'
      ? ok('graft: the sabotage landed — never grafted onto an ordinary Paris row')
      : bad('graft: the sabotage did not land');
    const { rowsOut } = await render(browser, grafted, 'graft');
    const light = rowsOut.find((r) => r.date === '2026-08-30');
    light && /^DRIFTED/.test(light.verdict)
      ? ok('graft: the page convicts a sunny day dressed as a dark one')
      : bad(`graft: the page says "${light ? light.verdict : 'nothing'}"`);
  }

  // ---- 4. The room must still stand up ----
  // A dark row in the ledger must not take the page down with it — Day 5,
  // and Day 19 when the same throw was found unguarded twice more. The
  // checks above all read one row; this one asks whether the rest of the
  // room drew.
  {
    const page = await browser.newPage();
    await page.route('**/ledger.json*', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(rows)
    }));
    await page.goto(URL + 'reckoning/', { waitUntil: 'networkidle' });
    for (const width of [375, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const sideways = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      sideways <= 0
        ? ok(`room: no sideways scroll at ${width}px with a dark row on the page`)
        : bad(`room: ${sideways}px of sideways scroll at ${width}px`);
    }
    const chars = await page.evaluate(() => document.body.innerText.length);
    chars > 3000
      ? ok(`room: the room still drew (${chars} characters)`)
      : bad(`room: the room went dark — only ${chars} characters`);
    await page.close();
  }

  await browser.close();
  console.log('');
  console.log(fails === 0 ? 'ledger-dark: PASS' : `ledger-dark: ${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.log('FAIL  ' + e.message); process.exit(1); });
