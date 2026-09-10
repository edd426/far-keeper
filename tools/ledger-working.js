// tools/ledger-working.js — the browser half of the deep audit, forged on the wire.
//
// Day 38. `horizon`, `working` and `crossCheck` are objects, and until this
// morning neither auditor reached inside one. About sixty numbers a row —
// the whole showing of the work, the horizon it was reckoned against, and
// the second method's own answer — sat under a green word that had never
// been asked about any of them.
//
// This is the second leg. `tools/reckon.js --verify` audits on this desk;
// this file asks whether the recompute that runs in a *stranger's browser*
// convicts the same forgeries. Day 36's whole finding is that those two can
// come apart silently, and the one we cannot reach is the one that matters.
//
// It forges on the wire with `page.route`, never on disk: never point a test
// at the cold record (Day 10, learned by all three of us in one morning).
// Every case asserts its substitution landed before it believes a failure
// (Day 5: a break-test that cannot break is a test that always passes), and
// asserts its own fixture was built (Day 17, turned the right way round).
//
// Run: ./scripts/local-snapshot.sh tools/ledger-working.js

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
if (!URL) {
  console.error('ledger-working: no FAR_KEEPER_URL — run me through scripts/local-snapshot.sh');
  process.exit(2);
}

let failures = 0;
function ok(label) { console.log(`ok    ${label}`); }
function bad(label, detail) {
  failures += 1;
  console.log(`FAIL  ${label}`);
  if (detail) console.log(`      ${detail}`);
}

// Forge the ledger on the wire. `edit` is run in node over the parsed array;
// the result is asserted to differ from the original before the page ever
// loads it, so a substitution that quietly no-ops cannot pass as a clean run.
async function withForgedLedger(page, edit) {
  const original = JSON.stringify(require('../reckoning/ledger.json'));
  const rows = JSON.parse(original);
  edit(rows);
  const forged = JSON.stringify(rows);
  if (forged === original) throw new Error('the forgery did not land — the ledger is unchanged');
  await page.route('**/ledger.json*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: forged }));
  return forged;
}

// Every rendered ledger row, as { date, verdict, text }.
async function rowsOnPage(page) {
  return page.$$eval('#ledger-list > *', (nodes) => nodes.map((n) => ({
    verdict: (n.querySelector('.ledger__verdict') || {}).textContent || '',
    text: n.textContent || ''
  })));
}

function rowFor(rows, date) {
  return rows.find((r) => r.text.indexOf(date) !== -1);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.FAR_KEEPER_CHROMIUM_PATH || undefined
  });

  const ledger = require('../reckoning/ledger.json');
  const newest = ledger[ledger.length - 1];
  const oldestOnMethod2 = ledger.find((e) => (e.method || 1) === 2);
  const method1 = ledger.find((e) => (e.method || 1) === 1);

  // ---- Case 0. The unforged page, so the pass rule can fail on a clean run.
  //
  // Day 5's rule and Day 18's fixture half together: if the honest page
  // already said what a forged page is supposed to say, none of the cases
  // below would mean anything.
  {
    const page = await browser.newPage();
    await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const rows = await rowsOnPage(page);
    if (!rows.length) bad('case 0 setup: the ledger drew rows', 'no rows rendered at all');
    else ok(`case 0 setup: the ledger drew ${rows.length} rows`);

    const row = rowFor(rows, newest.date);
    if (!row) bad('case 0 setup: the newest row is on the page');
    else if (row.verdict.indexOf('unchanged') !== 0) {
      bad('case 0: the newest row is unchanged on an unforged page', `verdict was ${row.verdict}`);
    } else ok('case 0: the newest row is unchanged on an unforged page');

    // The scope sentence must now claim the working, and must say a number.
    //
    // Written the long way round on purpose. The first draft of these two
    // checks read `if (row && …) bad(…) else ok(…)`, and on the run that
    // found the wrong URL there was no row at all — so the domain was empty,
    // the guard short-circuited, and both printed `ok` about a page that had
    // rendered nothing. Seventh instance in this house and the third inside a
    // file whose own header quotes the rule. **Assert the domain is non-empty
    // before judging the branch**, every time, including here.
    if (!row) {
      bad('case 0: the scope sentence names the working it now covers',
        'no row to read it off — the domain is empty, so this case says nothing');
      bad('case 0: the scope sentence counts the deep paths',
        'no row to read it off — the domain is empty, so this case says nothing');
    } else {
      if (row.text.indexOf('showing of the working') === -1) {
        bad('case 0: the scope sentence names the working it now covers', row.text.slice(0, 400));
      } else ok('case 0: the scope sentence names the working it now covers');

      const paths = row.text.match(/Under them, (\d+) more numbers/);
      if (!paths) bad('case 0: the scope sentence counts the deep paths', row.text.slice(0, 400));
      else if (Number(paths[1]) < 50) {
        bad('case 0: the deep path count is a real count', `it said ${paths[1]}`);
      } else ok(`case 0: the scope sentence counts the deep paths — ${paths[1]} of them`);
    }

    await page.close();
  }

  // ---- Case 1. A value inside `working` moved.
  //
  // The plainest lie the deep audit exists for: a number in the showing of
  // the work, edited after publication. Before Day 38 this row came back
  // `unchanged` in every browser on earth.
  {
    const page = await browser.newPage();
    await withForgedLedger(page, (rows) => {
      const r = rows.find((e) => e.date === newest.date);
      r.working.atSunrise.declinationDeg += 0.001;
    });
    await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const row = rowFor(await rowsOnPage(page), newest.date);
    if (!row) bad('case 1 setup: the forged row is on the page');
    else if (row.verdict.indexOf('DRIFTED') !== 0) {
      bad('case 1: an edited declination in the working is convicted', `verdict was ${row.verdict}`);
    } else if (row.text.indexOf('working.atSunrise.declinationDeg') === -1) {
      bad('case 1: the verdict names the path that moved', row.text.slice(0, 400));
    } else ok('case 1: an edited declination in the working is convicted, by path');
    await page.close();
  }

  // ---- Case 2. The cross-check's disagreement edited away.
  //
  // The second method's only job in this house is to be able to disagree.
  // A hand that flattens the gap makes the row look better checked than it
  // is, which is the one forgery that would flatter us.
  {
    const page = await browser.newPage();
    await withForgedLedger(page, (rows) => {
      const r = rows.find((e) => e.date === newest.date);
      r.crossCheck.sunsetGapMinutes = 0;
      r.crossCheck.sunsetDifferenceMinutes = 0;
    });
    await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const row = rowFor(await rowsOnPage(page), newest.date);
    if (!row) bad('case 2 setup: the forged row is on the page');
    else if (row.verdict.indexOf('DRIFTED') !== 0) {
      bad('case 2: a flattened cross-check gap is convicted', `verdict was ${row.verdict}`);
    } else ok('case 2: a flattened cross-check gap is convicted');
    await page.close();
  }

  // ---- Case 3. The graft, which only the shape question can see.
  //
  // Day 15's symmetric rule, in the place it now has to hold. A hand copying
  // today's `horizon` onto a row that predates `horizon` produces a field
  // which **recomputes perfectly** — the code writes it for every date — so
  // the value question waves it straight through and only the birthday
  // catches it. An exemption pointed only at absence excuses the graft it
  // was never looking at.
  {
    const target = ledger.find((e) => (e.method || 1) === 2 && e.horizon === undefined);
    if (!target) {
      bad('case 3 setup: a method-2 row that predates horizon exists',
        'no such row — the fixture this case needs is not in the ledger');
    } else {
      ok(`case 3 setup: ${target.date} is on the running method and predates horizon`);
      const page = await browser.newPage();
      await withForgedLedger(page, (rows) => {
        const r = rows.find((e) => e.date === target.date);
        r.horizon = JSON.parse(JSON.stringify(newest.horizon));
      });
      await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
      const row = rowFor(await rowsOnPage(page), target.date);
      if (!row) bad('case 3 setup: the forged row is on the page');
      else if (row.verdict.indexOf('DRIFTED') !== 0) {
        bad('case 3: a horizon grafted onto a row too old to carry it is convicted',
          `verdict was ${row.verdict} — the graft half of the symmetric rule is open`);
      } else if (row.text.indexOf('predates') === -1) {
        bad('case 3: the verdict says the row predates the field', row.text.slice(0, 400));
      } else ok('case 3: a horizon grafted onto a row too old to carry it is convicted');
      await page.close();
    }
  }

  // ---- Case 4. A path deleted from a row that should carry it.
  {
    const page = await browser.newPage();
    await withForgedLedger(page, (rows) => {
      const r = rows.find((e) => e.date === newest.date);
      delete r.working.atSolarNoon.hourAngleDeg;
    });
    await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const row = rowFor(await rowsOnPage(page), newest.date);
    if (!row) bad('case 4 setup: the forged row is on the page');
    else if (row.verdict.indexOf('DRIFTED') !== 0) {
      bad('case 4: a deleted path is convicted', `verdict was ${row.verdict}`);
    } else ok('case 4: a path deleted from the working is convicted');
    await page.close();
  }

  // ---- Case 5. A row on the retired method is not called clean.
  //
  // The three rows of 2026-08-06 to 08 were computed by arithmetic that is
  // gone from `reckoning.js`. Nothing here or anywhere can recompute what
  // they showed. That must read as *this page could not check*, never as a
  // green word stretched over sixty numbers nobody held — a tool that cannot
  // see must read as unable to see (Day 2), and counting the silence would be
  // reading silence as a witness (Day 31).
  {
    const page = await browser.newPage();
    await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const row = rowFor(await rowsOnPage(page), method1.date);
    if (!row) bad('case 5 setup: the method-1 row is on the page');
    else if (row.text.indexOf('can never be checked by anyone') === -1) {
      bad('case 5: a method-1 row says its working can never be checked', row.text.slice(0, 500));
    } else ok('case 5: a method-1 row says outright that its working can never be checked');
    await page.close();
  }

  // ---- Case 6. The bound tolerates what two honest engines actually do.
  //
  // Measured rather than argued (Ember, Day 38, re-run on this desk): V8 and
  // JavaScriptCore part on 42 leaves of a 1080-leaf sweep, the largest by
  // 1.36e-11, and the worst offender by far is `lastMoveSeconds` — the
  // residual of a solver at the instant it stopped, which has no floor and
  // parted by 750 billion ulps of its own value.
  //
  // So this case is the one that protects an innocent row in a browser we
  // cannot reach: a wobble the size of a real engine difference must NOT be
  // convicted. It is the mirror of every case above and the only one whose
  // pass is a silence.
  {
    const page = await browser.newPage();
    await withForgedLedger(page, (rows) => {
      const r = rows.find((e) => e.date === newest.date);
      r.working.atSunrise.lastMoveSeconds += 1.36e-11;
      r.working.atSunset.hourAngleDeg += 1e-13;
    });
    await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const row = rowFor(await rowsOnPage(page), newest.date);
    if (!row) bad('case 6 setup: the forged row is on the page');
    else if (row.verdict.indexOf('unchanged') !== 0) {
      bad('case 6: a wobble the size of a real engine difference is NOT convicted',
        `verdict was ${row.verdict} — this page would print DRIFTED at a stranger's laptop ` +
        'about a row nobody touched');
    } else ok('case 6: a wobble the size of a real engine difference is not convicted');
    await page.close();
  }

  // ---- Case 7. A forgery just above the bound still is.
  //
  // Case 6 alone is passed by a tool that has stopped checking at all. This
  // is its floor: the same field, moved by something a hand would move it by.
  // Day 27's empty domain, refused in advance — a silence is only evidence
  // when the noise beside it can still speak.
  {
    const page = await browser.newPage();
    await withForgedLedger(page, (rows) => {
      const r = rows.find((e) => e.date === newest.date);
      r.working.atSunrise.lastMoveSeconds *= 2;
    });
    await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const row = rowFor(await rowsOnPage(page), newest.date);
    if (!row) bad('case 7 setup: the forged row is on the page');
    else if (row.verdict.indexOf('DRIFTED') !== 0) {
      bad('case 7: a doubled residual is still convicted',
        `verdict was ${row.verdict} — case 6 is passing on a tool that checks nothing`);
    } else ok('case 7: a doubled residual is still convicted, so case 6’s silence means something');
    await page.close();
  }

  // ---- Case 8. The two auditors agree about this row.
  //
  // Day 36's finding is that the desk and the browser can come apart without
  // either saying a word. `claims-audited.js` asks that of the flat fields;
  // this asks it of the deep ones, on the one row both can reach today.
  {
    const R = require('../reckoning/reckoning.js');
    const fresh = R.reckon(newest.date, newest.place);
    const deskSaysClean = R.deepDifferences(newest, fresh).length === 0;
    const page = await browser.newPage();
    await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const row = rowFor(await rowsOnPage(page), newest.date);
    const browserSaysClean = row && row.verdict.indexOf('unchanged') === 0;
    if (deskSaysClean !== browserSaysClean) {
      bad('case 8: the desk and the browser agree about the newest row',
        `desk clean=${deskSaysClean}, browser clean=${browserSaysClean}`);
    } else ok('case 8: the desk and the browser agree about the newest row');
    await page.close();
  }

  await browser.close();

  console.log('');
  if (failures) {
    console.log(`ledger-working: ${failures} check${failures === 1 ? '' : 's'} failed.`);
    process.exit(1);
  }
  console.log('ledger-working: the working, the horizon and the cross-check are held path by path,');
  console.log('ledger-working: in a browser, and the bound lets two honest engines through.');
  process.exit(0);
})().catch((error) => {
  console.error('ledger-working: ' + error.stack);
  process.exit(2);
});
