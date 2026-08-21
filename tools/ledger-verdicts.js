// tools/ledger-verdicts.js — does a ledger row say only what it checked?
//
//     cp tools/ledger-verdicts.js /tmp/ledger-verdicts.js
//     ./scripts/local-snapshot.sh /tmp/ledger-verdicts.js
//
// Built Day 11.
//
// Two questions about the ledger rows on the reckoning page:
//
//   1. Does a row that recomputes cleanly say what it actually checked,
//      rather than wearing a word that sounds like a verdict on the sun?
//   2. When a published number disagrees with a fresh computation under
//      the *same* method — the shape of a forgery, not of a method change
//      — does the page say so, or does it hand the row the innocent
//      account that belongs to the other case?
//
// Question 2 needs a forgery to answer, and Day 10's rule is that a test
// must not share a desk with the record it puts at risk. So nothing here
// touches reckoning/ledger.json. The forged ledger is injected on the wire
// with page.route, the way CLAUDE.md's guard-break recipe injects a
// changed module — the bytes on disk are never opened for writing.
//
// Day 5's rule applies to both halves: assert the sabotage landed, and
// write the pass rule so that the *unbroken* case fails it.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

async function readRows(page) {
  return page.$$eval('.ledger__entry', (rows) => rows.map((row) => ({
    date: row.querySelector('.ledger__date')?.textContent?.trim() ?? null,
    method: row.querySelector('.ledger__method')?.textContent?.trim() ?? null,
    verdict: row.querySelector('.ledger__verdict')?.textContent?.trim() ?? null,
    // Day 18: the verdict carries the place it was recomputed at —
    // `unchanged at Paris` — because the place is an input the recompute
    // cannot check and the badge must not read as though it had. The word
    // is the first token; this file's questions are about the word.
    word: (row.querySelector('.ledger__verdict')?.textContent?.trim() ?? '').split(' ')[0],
    notes: Array.from(row.querySelectorAll('.ledger__note')).map((n) => n.textContent.trim())
  })));
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- Part one: the tower as it stands -------------------------------
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ledger__entry');
  const rows = await readRows(page);

  check(rows.length > 0, `the ledger drew ${rows.length} rows`);

  const clean = rows.filter((r) => r.word === 'unchanged');
  const drifted = rows.filter((r) => r.word === 'DRIFTED');
  check(clean.length > 0, `${clean.length} rows say unchanged`);
  check(drifted.length === 3, `${drifted.length} rows say DRIFTED (three are expected, from the Day 6 method change)`);
  check(
    !rows.some((r) => /holds/.test(r.verdict ?? '')),
    'no row wears the old word "holds", which was heard as holds-true and only ever meant holds-in-place'
  );

  for (const row of clean) {
    check(
      row.notes.some((n) => /nobody has moved those numbers since/.test(n)),
      `${row.date}: the clean row names the size of its own claim`
    );
    check(
      row.notes.some((n) => /this page cannot answer it/.test(n)),
      `${row.date}: the clean row says out loud that it is not a check on the sun`
    );
  }

  for (const row of drifted) {
    check(
      row.notes.some((n) => /The method changed on/.test(n)),
      `${row.date}: the drifted row carries the method account`
    );
  }

  // The row we are about to forge must, right now, be clean and carry no
  // forgery account. If it already did, the forgery test below would pass
  // without the forgery — Day 5's fault exactly.
  const target = clean.find((r) => /method 2/.test(r.method ?? ''));
  check(!!target, `a clean row computed under the current method exists to forge (${target?.date})`);
  check(
    !target.notes.some((n) => /no method change to blame/.test(n)),
    `${target.date}: before the forgery, this row does NOT carry the no-innocent-account sentence`
  );
  await page.close();

  // ---- Part two: forge a number and see what the page says -----------
  const forged = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let substituted = false;
  await forged.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    const entry = entries.find((e) => e.date === target.date);
    // A forger moves the published claim and leaves everything else alone
    // — including `method`, which is the whole reason this case cannot be
    // told apart by the method branch.
    entry.sunrise = entry.sunrise === '06:00' ? '05:00' : '06:00';
    const body = JSON.stringify(entries, null, 2);
    substituted = body !== before;
    await route.fulfill({ response, body });
  });
  await forged.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await forged.waitForSelector('.ledger__entry');

  check(substituted, 'the forged ledger actually reached the page (a substitution that silently no-ops is a test that cannot fail)');

  const forgedRows = await readRows(forged);
  const forgedRow = forgedRows.find((r) => r.date === target.date);
  check(!!forgedRow, `${target.date} is still on the page after the forgery`);
  check(forgedRow.word === 'DRIFTED', `${target.date}: the forged row is caught — DRIFTED`);
  check(
    forgedRow.notes.some((n) => /no method change to blame/.test(n)),
    `${target.date}: the forged row is told it has no innocent account`
  );
  check(
    !forgedRow.notes.some((n) => /The method changed on/.test(n)),
    `${target.date}: the forged row is NOT handed the method change's account, which would be false of it`
  );
  check(
    !forgedRow.notes.some((n) => /arithmetic has moved out from under it/.test(n)),
    `${target.date}: the page does not claim the arithmetic moved, because it did not`
  );

  // The honest drifted rows must still get their own account through the
  // forged load — otherwise the fork has simply swapped one blindness for
  // another.
  const stillMethod = forgedRows.filter((r) => r.word === 'DRIFTED' && r.date !== target.date);
  check(stillMethod.length === 3, `the three honest scars are still DRIFTED alongside the forgery (${stillMethod.length})`);
  for (const row of stillMethod) {
    check(
      row.notes.some((n) => /The method changed on/.test(n)),
      `${row.date}: the honest scar keeps its method account under a forged load`
    );
  }
  await forged.close();

  // ---- Part three: the page must not scroll sideways -----------------
  for (const width of [375, 390, 1440]) {
    const wide = await browser.newPage({ viewport: { width, height: 900 } });
    await wide.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const overflow = await wide.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `${width}px: the page does not scroll sideways (${overflow})`);
    await wide.close();
  }

  await browser.close();

  if (problems.length) {
    console.error(`\nFAIL — ${problems.length} of the day's claims did not hold.`);
    process.exit(1);
  }
  console.log('\nPASS — the clean row names its own claim, and a forged number is told apart from a moved method.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
