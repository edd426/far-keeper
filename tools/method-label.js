// tools/method-label.js — a ledger row's method label, read by the page
//
//     ./scripts/local-snapshot.sh tools/method-label.js
//
// Built Day 89, the browser half of tools/method-label.sh. Until then
// reckoning/page.js read `published.method || 1`, forked on *different from
// METHOD*, and filled the gap with `METHOD_NOTES[method] || 'an earlier
// method'`: a row labelled 5.23 or 99 was printed *computed under method 99:
// an earlier method* and then told the innocent story of 2026-08-09 (found
// Day 87). Both auditors now ask `Reckoning.methodStanding()`.
//
// The ledger is forged on the wire, never on disk (Day 10). Rows are chosen
// by property, not by index (Day 68): current-method rows, newest first, and
// the earned rows are whatever rows the instrument calls earned. Every
// forgery asserts it landed, and the second load breaks page.js on the wire
// and asserts the cases go red there (Day 5: a check that cannot break always
// passes).

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

// The labels, and what each row must say. `DELETE` takes the field off.
const LABELS = [99, 5.23, 0, -1, '2', null, 1, 'DELETE'];
const NEVER = /which this tower never ran/;
const STOPPED = /this tower had stopped running method 1 on/;
const NOT_BEGUN = /this tower had not begun running method 2/;
const EARNED_STORY = /it is the claim, kept/;
const FORGERY_STORY = /no innocent account/;

async function rowsOf(page) {
  return page.$$eval('.ledger__entry', (rows) => rows.map((row) => ({
    date: row.querySelector('.ledger__date')?.textContent?.trim() ?? null,
    method: row.querySelector('.ledger__method')?.textContent?.trim() ?? null,
    word: (row.querySelector('.ledger__verdict')?.textContent?.trim() ?? '').split(' ')[0],
    broken: Array.from(row.querySelectorAll('.ledger__broken li')).map((n) => n.textContent.trim()),
    notes: Array.from(row.querySelectorAll('.ledger__note')).map((n) => n.textContent.trim()).join(' ')
  })));
}

async function load(browser, { breakPage } = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const forged = {};
  let pageBroken = false;
  await page.route('**/ledger.json*', async (route) => {
    const res = await route.fetch();
    const rows = JSON.parse(await res.text());
    const current = rows.filter((r) => r.method === 2).reverse();
    LABELS.forEach((label, i) => {
      const r = current[i];
      if (label === 'DELETE') delete r.method; else r.method = label;
      forged[r.date] = label;
    });
    // Ember's graft: the current label on the oldest row with no method
    // field, a row older than the change.
    const old = rows.find((r) => r.method === undefined);
    old.method = 2;
    forged[old.date] = 'GRAFT';
    await route.fulfill({ response: res, body: JSON.stringify(rows) });
  });
  if (breakPage) {
    await page.route('**/page.js*', async (route) => {
      const res = await route.fetch();
      const before = await res.text();
      const body = before
        .replace("if (!unplaced && standing.kind === 'unknown') broken.push", 'if (false) broken.push')
        .replace("if (standing.kind === 'unknown') {", 'if (false) {');
      pageBroken = body !== before;
      await route.fulfill({ response: res, body });
    });
  }
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ledger__entry');
  const rows = await rowsOf(page);
  // The new lines print at the narrowest width the house checks (Day 87).
  await page.setViewportSize({ width: 320, height: 900 });
  const spill = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.close();
  return { rows, forged, pageBroken, spill };
}

// The cases, returned as [ok, message] so the sabotaged load can count reds.
function judge(rows, forged) {
  const out = [];
  const byDate = Object.fromEntries(rows.map((r) => [r.date, r]));
  const dates = Object.keys(forged);
  out.push([dates.length === LABELS.length + 1 && dates.every((d) => byDate[d]),
    `the forgery landed on ${dates.length} rows, and the page drew every one of them`]);
  for (const date of dates) {
    const label = forged[date];
    const row = byDate[date];
    if (!row) continue;
    const want = label === 'GRAFT' ? NOT_BEGUN
      : (label === 1 || label === 'DELETE') ? STOPPED : NEVER;
    out.push([row.word === 'DRIFTED' && want.test(row.notes) &&
      row.broken.some((b) => /^method: /.test(b)) &&
      !EARNED_STORY.test(row.notes) && !FORGERY_STORY.test(row.notes) &&
      !/an earlier method/.test(row.notes),
      `${date}, labelled ${label === 'DELETE' ? 'nothing' : label === 'GRAFT' ? '2 (grafted)' : JSON.stringify(label)}: DRIFTED, ` +
      `says ${want === STOPPED ? 'the tower had stopped running it' : want === NOT_BEGUN ? 'the tower had not begun it' : 'the tower never ran it'}, ` +
      'and is handed neither the method-change story nor the forgery sentence']);
  }
  return out;
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- The page as it stands, unforged: the controls ------------------
  const plain = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await plain.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await plain.waitForSelector('.ledger__entry');
  const real = await rowsOf(plain);
  const earned = await plain.evaluate(async () => {
    const res = await fetch('ledger.json');
    const rows = await res.json();
    return rows.filter((r) => window.Reckoning.methodStanding(r).kind === 'earned').map((r) => r.date);
  });
  await plain.close();
  check(earned.length > 0, `the instrument calls ${earned.length} real rows earned (the domain is not empty)`);
  for (const date of earned) {
    const row = real.find((r) => r.date === date);
    check(!!row && row.word === 'DRIFTED' && EARNED_STORY.test(row.notes) && !NEVER.test(row.notes),
      `${date}: a real earned row keeps the method-change story and is not called never-run`);
  }
  check(!real.some((r) => NEVER.test(r.notes) || STOPPED.test(r.notes)),
    'no real row is told its label names a method never run');

  // ---- The forged labels -----------------------------------------------
  const good = await load(browser);
  for (const [ok, message] of judge(good.rows, good.forged)) check(ok, message);
  check(good.spill <= 0, `with the forged rows drawn, the page does not scroll sideways at 320 px (${good.spill} px)`);

  // ---- The same forgery against a page.js broken on the wire ------------
  const broken = await load(browser, { breakPage: true });
  check(broken.pageBroken, 'sabotage: page.js was changed on the wire');
  const reds = judge(broken.rows, broken.forged).slice(1).filter(([ok]) => !ok).length;
  check(reds === LABELS.length + 1,
    `sabotage: with the page's question cut, ${reds} of ${LABELS.length + 1} forged rows go red`);

  await browser.close();
  console.log('');
  if (problems.length) {
    console.log(`method-label: ${problems.length} red`);
    process.exit(1);
  }
  console.log('method-label: all green');
})().catch((error) => { console.error(error); process.exit(2); });
