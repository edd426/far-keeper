// tools/ledger-place.js — is a row recomputed where the row says it was?
//
//     ./scripts/local-snapshot.sh tools/ledger-place.js
//
// Built Day 18, and it is the second of the two auditors.
//
// `tools/place-audit.sh` asks this question of the auditor on this desk.
// This one asks it of the copy that runs in a stranger's browser, which is
// the copy we cannot reach once it has shipped. Two copies of one rule is
// two chances to disagree, and the disagreement would look like one of them
// catching a forgery.
//
// The fault: `reckoning/page.js` recomputed every published row at
// `window.Reckoning.PARIS` and threw away the `place` on the row — which
// every entry has carried since 2026-08-06. It has never been wrong,
// because Paris is the only place ever written down. An untested
// assumption, in Ash's words: the code was asked whether it recomputes at
// the place the row names, its documentation said yes, and no row was ever
// put in front of it that could tell the two answers apart.
//
// So this puts one in front of it, on the wire — `page.route`, never the
// bytes on disk (Day 10: a test must not share a desk with the record it
// puts at risk). Day 5's rule on both halves: assert the substitution
// landed, and write the pass rule so the *unbroken* case would fail it.
//
// What it proves is bounded, and the bound is Ash's: a manufactured row
// proves the fix is correct. Only a morning on which this tower really
// stands somewhere else proves the system works, and that test has to
// happen in time rather than in a fixture.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

// The places the ledger actually names, read off the cold record rather
// than typed (Day 24). This file said `Paris` at four of its own lines
// until this morning, which is Day 23's finding in a second suite: on the
// first honest morning after a move, the first non-Paris row lands and
// every one of them goes red about a tower that is right — in the file
// whose entire subject is *the place a row is recomputed at*. It fails
// precisely on the morning it was built for.
const fs = require('fs');
const path = require('path');
const LEDGER = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'reckoning', 'ledger.json'), 'utf8')
);
const NAMED = [...new Set(LEDGER.map((e) => e.place && e.place.name).filter(Boolean))];
const AT_A_NAMED_PLACE = new RegExp(
  ' at (' + NAMED.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')$'
);

// Far enough from the ledger's places in both latitude and longitude that no
// figure on the row could agree by rounding. Deliberately short of the polar
// fold: that is a live branch nobody has exercised yet and it is not today's.
//
// Chosen at run time as the first candidate the ledger does not already
// name, for the same reason `standing-clock.sh` searches for its far zone
// at run time: a hardcoded Reykjavik is a fixture that silently stops
// biting on the morning this tower stands in Reykjavik — and Reykjavik is
// on the candidate list in `survey/`.
const ELSEWHERE_CANDIDATES = [
  { name: 'Reykjavik', latitude: 64.1466, longitude: -21.9426, zone: 'Atlantic/Reykjavik' },
  { name: 'Quito', latitude: -0.1807, longitude: -78.4678, zone: 'America/Guayaquil' },
  { name: 'Nairobi', latitude: -1.2921, longitude: 36.8219, zone: 'Africa/Nairobi' }
];
const ELSEWHERE = ELSEWHERE_CANDIDATES.find((p) => !NAMED.includes(p.name));

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

async function readRows(page) {
  return page.$$eval('.ledger__entry', (rows) => rows.map((row) => ({
    date: row.querySelector('.ledger__date')?.textContent?.trim() ?? null,
    verdict: row.querySelector('.ledger__verdict')?.textContent?.trim() ?? null,
    notes: Array.from(row.querySelectorAll('.ledger__note')).map((n) => n.textContent.trim())
  })));
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- Part one: the tower as it stands -------------------------------
  //
  // Every verdict must name the place its own row was reckoned at, and the
  // set of those is read from the ledger, not typed. This is also the half
  // that makes the forged case mean something: if the page already said
  // ELSEWHERE anywhere, part two would pass without the substitution.
  if (!ELSEWHERE) {
    check(false, 'no candidate place is absent from the ledger — nothing below is a test of anything');
    await browser.close();
    process.exit(1);
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ledger__entry');
  const rows = await readRows(page);

  check(rows.length > 0, `the ledger drew ${rows.length} rows`);
  check(
    rows.every((r) => AT_A_NAMED_PLACE.test(r.verdict ?? '')),
    `every verdict on the real ledger names the place its row was reckoned at (${NAMED.join(', ')})`
  );
  check(
    !rows.some((r) => new RegExp(ELSEWHERE.name).test(r.verdict ?? '')),
    `no row on the real ledger names ${ELSEWHERE.name} — so part two cannot pass without the substitution`
  );
  // A bare verdict is the thing Day 18 took away: `unchanged` alone claims
  // the row is unchanged, and the place on it was never checked.
  check(
    !rows.some((r) => r.verdict === 'unchanged' || r.verdict === 'DRIFTED'),
    'no verdict stands bare, without the place it is conditional on'
  );

  const target = rows.find((r) => /^unchanged/.test(r.verdict ?? ''));
  check(!!target, `a clean row exists to move (${target?.date})`);
  await page.close();

  // ---- Part two: move the row's place and watch the verdict follow ----
  //
  // The row's numbers are left exactly as published and only its `place` is
  // changed. Under the old page that row recomputes at Paris, disagrees on
  // every figure, and — being on the method running now — is handed the
  // forgery sentence. Under the fixed page it recomputes at Reykjavik, and
  // so it must *drift*, because these numbers were never Reykjavik's. What
  // proves the fix is not the verdict but the place inside it: the page
  // must say it went to Reykjavik to check.
  const moved = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let substituted = false;
  await moved.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    const entry = entries.find((e) => e.date === target.date);
    entry.place = ELSEWHERE;
    const body = JSON.stringify(entries, null, 2);
    substituted = body !== before;
    await route.fulfill({ response, body });
  });
  await moved.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await moved.waitForSelector('.ledger__entry');

  check(substituted, 'the moved ledger actually reached the page (a substitution that silently no-ops is a test that cannot fail)');

  const movedRows = await readRows(moved);
  const movedRow = movedRows.find((r) => r.date === target.date);
  check(!!movedRow, `${target.date} is still on the page after the move`);
  check(
    new RegExp(ELSEWHERE.name).test(movedRow?.verdict ?? ''),
    `${target.date}: the page recomputed it at the place the row names, not at the tower's own`
  );
  check(
    /^DRIFTED/.test(movedRow?.verdict ?? ''),
    `${target.date}: its published numbers under a ${ELSEWHERE.name} place drift, which is the page reading the place and not ignoring it`
  );
  check(
    movedRows.filter((r) => r.date !== target.date).every((r) => AT_A_NAMED_PLACE.test(r.verdict ?? '')),
    'every other row is still recomputed at the place it names — the place is read per row, not once for the page'
  );
  await moved.close();

  // ---- Part three: a row that names no place at all -------------------
  //
  // Not clean and not drifted: a row the page cannot check. It must not be
  // able to pass for a quiet one — check-sight.sh's rule from Day 2, one
  // room along.
  const bare = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let stripped = false;
  await bare.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    const entry = entries.find((e) => e.date === target.date);
    delete entry.place;
    const body = JSON.stringify(entries, null, 2);
    stripped = body !== before;
    await route.fulfill({ response, body });
  });
  await bare.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await bare.waitForSelector('.ledger__entry');

  check(stripped, 'the placeless ledger actually reached the page');

  const bareRows = await readRows(bare);
  const bareRow = bareRows.find((r) => r.date === target.date);
  check(
    !/^unchanged/.test(bareRow?.verdict ?? ''),
    `${target.date}: a row naming no place does not pass for a clean one`
  );
  check(
    /^UNPLACED$/.test(bareRow?.verdict ?? ""),
    `${target.date}: it gets its own word — UNPLACED — and not DRIFTED, which would be one word doing two jobs`
  );
  check(
    bareRow?.notes.some((n) => /names no place/.test(n)) ?? false,
    `${target.date}: and the page says why it could not be recomputed`
  );
  await bare.close();

  // ---- Part four: the page still says what it cannot check ------------
  const standing = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await standing.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const text = await standing.evaluate(() => document.body.innerText);
  check(
    /a place is an .?input/i.test(text),
    'the page tells a reader that a place is an input, which no recompute can check'
  );
  check(
    /commits/i.test(text) && /only witness/i.test(text),
    'and that the commits are the only witness a place has'
  );

  for (const width of [375, 390, 1440]) {
    await standing.setViewportSize({ width, height: 900 });
    const overflow = await standing.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `${width}px: the page does not scroll sideways (${overflow})`);
  }
  await standing.close();

  await browser.close();

  if (problems.length) {
    console.error(`\nFAIL — ${problems.length} of the day's claims did not hold.`);
    process.exit(1);
  }
  console.log('\nPASS — the browser auditor recomputes each row where the row says it stood,');
  console.log('and says on its face that the place itself is the thing it cannot check.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
