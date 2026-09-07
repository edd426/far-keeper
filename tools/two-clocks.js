// tools/two-clocks.js — the tower's two counts of what day it is
//
//     ./scripts/local-snapshot.sh tools/two-clocks.js
//
// Built Day 35, the second morning in Anchorage and the first on which the
// footer of every room in this house named a day the tower was not standing
// in.
//
// `the two clocks` on the reckoning page asks two questions of the ledger's
// own bytes, and they are not the same question.
//
// **Split** — did the tower's own calendar and UTC name different days at the
// instant a row was stamped? That is a reading, not a fault. It happens for
// |offset| hours out of every day in every place but the meridian, and it
// went unseen for thirty-one rows because the hour this tower is woken fell
// outside the band at Paris and at Auckland and falls inside it at Anchorage.
//
// **Unaccounted** — is a row's date the day it actually was, where the row
// was written, when the row was stamped? Day 17 built the write gate and
// wrote that a row claiming the wrong morning is the one thing *no recompute
// can ever catch, because the numbers in it are right*. That stood for
// eighteen days. It is wrong: the row carries an instant and a place, and the
// place's clock at that instant is a fact. Nothing here is recomputed — two
// fields that have been in every row since the first are read together.
//
// Every forgery is on the wire, with `page.route`. Day 10: a test must never
// share a desk with the record it puts at risk, and this one would otherwise
// be backdating rows in the cold ledger to prove it can catch a backdated row.
//
// **No case freezes a number the record can move.** Today there is one split
// and no unaccounted rows; tomorrow the split count grows by one every
// morning the tower stands west of UTC at the hour it is woken. A case that
// froze *one split* would be red tomorrow about a page that was right — Day
// 32's fault, pointed at the figure in this house most certain to move. What
// the unforged case asserts instead is that the section's counts agree with
// the rows it says it read, whatever those counts are.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

async function readReport(page) {
  await page.waitForFunction(
    () => {
      const host = document.getElementById('two-clocks-report');
      return host && !/reading the two clocks/.test(host.textContent);
    },
    null,
    { timeout: 15000 }
  ).catch(() => {});
  return page.$eval('#two-clocks-report', (host) => host.textContent.replace(/\s+/g, ' ').trim());
}

function parseHead(text) {
  const opened = text.match(/Of the (\d+) rows this reading can open/);
  const splitN = text.match(/can open, (\d+) (?:was|were) written at an instant/);
  const unaccN = text.match(/(\d+) rows? (?:is|are) unaccounted/);
  return {
    opened: opened ? Number(opened[1]) : null,
    split: splitN ? Number(splitN[1]) : null,
    unaccounted: /none unaccounted/.test(text) ? 0 : (unaccN ? Number(unaccN[1]) : null)
  };
}

// How many rows the page actually narrated, counted off its own sentences
// rather than off its own head-line. A head that says three and names one is
// the fault this pair exists to catch, and a suite that reads only the head
// would report it clean.
function countNarrated(text) {
  return {
    split: (text.match(/so the tower’s own day stood/g) || []).length,
    unaccounted: (text.match(/UNACCOUNTED\./g) || []).length
  };
}

function shift(dateISO, days) {
  return new Date(Date.parse(`${dateISO}T00:00:00Z`) + days * 86400000)
    .toISOString().slice(0, 10);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- One: the record as it stands -----------------------------------
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const plain = await readReport(page);
  const head = parseHead(plain);
  const told = countNarrated(plain);

  check(head.opened !== null && head.split !== null && head.unaccounted !== null,
    `the section reports rows opened, splits and unaccounted (${head.opened}, ${head.split}, ${head.unaccounted})`);
  check(head.opened > 3, `it opened ${head.opened} rows of the record`);
  check(told.split === head.split,
    `every split it counted is a split it named (${head.split} counted, ${told.split} named)`);
  check(told.unaccounted === head.unaccounted,
    `every unaccounted row it counted is one it named (${head.unaccounted} counted, ${told.unaccounted} named)`);

  // The zero branch, on the live record, which currently has no unaccounted
  // row. A check that speaks only when it has something to show is built for
  // one event and its silence reads as an all-clear it never earned.
  //
  // Written first as `head.unaccounted !== 0 || /none unaccounted/`, which is
  // green whenever the count cannot be read at all — so with the render call
  // site removed it was the one tick in this file still reporting ok about a
  // page that had drawn nothing. An empty domain always says yes, in the
  // voice of a check that worked (Day 34, fifth instance). The count is
  // required to be a number before its branch is judged.
  check(head.unaccounted !== null &&
    (head.unaccounted > 0 || /none unaccounted/.test(plain)),
    'with nothing unaccounted it says so out loud rather than falling silent');

  // The limit, printed rather than implied — and the domain asserted before
  // it is swept, because an empty domain always says yes (Day 34, in the file
  // whose own comment quotes the rule).
  check(/moves a row’s date and its stamp together/.test(plain),
    'it says on its own face what it cannot see: a hand that moves both fields');
  check(/time-zone database/.test(plain),
    'and that every offset it used was asked of a tz database that gets revised');

  const real = await page.evaluate(async () => {
    const response = await fetch('ledger.json', { cache: 'no-cache' });
    return response.json();
  });
  check(real.length > 3, `the ledger holds ${real.length} rows to forge against`);

  // The footer against the book, both read off things already published. The
  // numbers are not frozen; what is asserted is that the row-day the page
  // printed is the row-day its own stated anchor implies.
  const build = await page.evaluate(() => window.__towerBuild || null);
  const footer = plain.match(/says Day (\d+)\. That is (\d{4}-\d{2}-\d{2}), the UTC day this page was built, counted from (\d{4}-\d{2}-\d{2})\./);
  const bookDay = plain.match(/which is Day (\d+) by the very same count/);
  check(!!footer && !!bookDay, 'it sets the footer\'s day-count against the book\'s newest row');
  if (footer && bookDay && build) {
    check(Number(footer[1]) === build.dayN,
      `the day it quotes is the day the footer actually carries (${footer[1]} = ${build.dayN})`);
    const expectedAnchor = shift(build.builtAt.slice(0, 10), -(build.dayN - 1));
    check(footer[3] === expectedAnchor,
      `the first morning is reconstructed from the footer, not typed (${footer[3]})`);
    const newest = real[real.length - 1];
    const expectedRowDay =
      Math.round((Date.parse(`${newest.date}T00:00:00Z`) - Date.parse(`${expectedAnchor}T00:00:00Z`)) / 86400000) + 1;
    check(Number(bookDay[1]) === expectedRowDay,
      `the book's day is counted from the same first morning (${bookDay[1]} = ${expectedRowDay})`);
  }

  // The standing band, in minutes. Not asserted as a number — asserted as
  // present and as naming the standing place, so a tower on a :45 offset
  // cannot be reported in whole hours without this going red.
  const standing = await page.evaluate(() => window.Reckoning.STANDING.place);
  check(new RegExp(`The tower stands in ${standing.name}`).test(plain),
    `the band names where the tower stands (${standing.name})`);
  check(/out of every twenty-four/.test(plain),
    'and says how much of every day the two counts must differ');
  await page.close();

  // ---- Two: a row dated a day its own clock never said ------------------
  // The forgery is the exact fault the write gate exists to prevent, seen
  // from the far side: correct arithmetic filed under the wrong morning. It
  // moves ONLY the date, because a hand that moved the stamp too is the case
  // this check says on its own face it cannot see.
  const victim = real[Math.floor(real.length / 2)];
  const backdated = shift(victim.date, -1);
  check(head.unaccounted === 0,
    'before the forgery, nothing in the record is unaccounted (so the unbroken case would fail the pass rule)');

  const forged = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let landed = false;
  await forged.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    const row = entries.find((e) => e.date === victim.date);
    row.date = backdated;
    const body = JSON.stringify(entries, null, 2);
    landed = body !== before;
    await route.fulfill({ response, body });
  });
  await forged.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const forgedText = await readReport(forged);
  const forgedHead = parseHead(forgedText);

  check(landed, 'the backdated ledger actually reached the page (a substitution that no-ops is a test that cannot fail)');
  check(forgedHead.unaccounted === 1,
    `the backdated row is caught (${head.unaccounted} → ${forgedHead.unaccounted} unaccounted)`);

  // Everything below is read out of the UNACCOUNTED sentence alone, never out
  // of the whole report. Backdating a row by one day also splits it from UTC,
  // so the split sentence names the same date and stamp — and the first
  // draft of this case swept the whole report and stayed green under a
  // sabotage that never convicted anything, satisfied by the other verdict's
  // words. Day 11 reflected into its own test: one string doing two jobs.
  const verdict = (forgedText.split('UNACCOUNTED.')[1] || '').split('The row dated')[0] +
    (forgedText.split('UNACCOUNTED.')[1] || '');
  check(forgedText.includes('UNACCOUNTED.'),
    'there is an unaccounted sentence to read (the checks below are vacuous without one)');
  check(verdict.includes(`The row dated ${backdated} was stamped ${victim.publishedAt}`),
    `the unaccounted row is named with its date and its stamp (${backdated})`);
  check(new RegExp(`at ${victim.place.name} that instant was ${victim.date}`).test(verdict),
    'and with the day its own clock actually said');
  check(/no arithmetic in it is wrong/.test(verdict),
    'and it says the thing that makes this catchable by nothing else: the numbers are right');
  await forged.close();

  // ---- Three: split without unaccounted, which must stay two verdicts ----
  // A row stamped inside its own place's band is split from UTC and entirely
  // honest. If one word did both jobs this case would convict an innocent
  // row — Day 11, where DRIFTED was one word doing two jobs and supplied the
  // innocent account to the guilty.
  const east = real.find((e) => e.place.zone === 'Pacific/Auckland');
  if (!east) {
    check(false, 'the record holds an eastern row to stamp inside its own band');
  } else {
    const eveBefore = `${shift(east.date, -1)}T13:00:00Z`; // 01:00 next day at Auckland
    const honest = await browser.newPage({ viewport: { width: 390, height: 900 } });
    let stamped = false;
    await honest.route('**/ledger.json*', async (route) => {
      const response = await route.fetch();
      const before = await response.text();
      const entries = JSON.parse(before);
      entries.find((e) => e.date === east.date).publishedAt = eveBefore;
      const body = JSON.stringify(entries, null, 2);
      stamped = body !== before;
      await route.fulfill({ response, body });
    });
    await honest.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const honestText = await readReport(honest);
    const honestHead = parseHead(honestText);

    check(stamped, 'the re-stamped ledger actually reached the page');
    check(honestHead.split === head.split + 1,
      `the re-stamped row reads as one more split (${head.split} → ${honestHead.split})`);
    check(honestHead.unaccounted === 0,
      'and is NOT called unaccounted — split and unaccounted are two verdicts, not one word doing two jobs');
    check(/stood ahead of UTC when it wrote/.test(honestText),
      'the direction is named: a place east of the meridian stands ahead of it');
    await honest.close();
  }

  // ---- Four: no splits at all --------------------------------------------
  // The other zero branch. The live record has one, so it has to be forged
  // away to be seen — and a section that only prints a count when the count
  // is interesting is the fault this house has now met four times.
  const flat = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let flattened = false;
  await flat.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before).filter((e) => e.publishedAt.slice(0, 10) === e.date);
    const body = JSON.stringify(entries, null, 2);
    flattened = body !== before && entries.length > 0;
    await route.fulfill({ response, body });
  });
  await flat.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const flatText = await readReport(flat);
  check(flattened, 'the split-free ledger actually reached the page');
  check(/named different days — none\./.test(flatText),
    'with no split anywhere it prints the zero rather than going quiet');
  await flat.close();

  // ---- Five: the hours are read off the record, never remembered ---------
  // Day 33: a typed window — *every recorded morning has run between about
  // 02:15 and 02:35 UTC* — was false of fourteen of the thirty-one rows it
  // described, and sat one line under a comment promising nothing below it
  // was typed. This case is the lock. Stamp one row at an hour this routine
  // has never run and the printed window must move to hold it.
  const odd = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let oddLanded = false;
  await odd.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    entries[0].publishedAt = `${entries[0].date}T19:44:00Z`;
    const body = JSON.stringify(entries, null, 2);
    oddLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await odd.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const oddText = await readReport(odd);
  check(oddLanded, 'the oddly-stamped ledger actually reached the page');
  check(/stamped between \d\d:\d\d and 19:44 UTC/.test(oddText),
    'the window widens to hold an hour this routine has never run — it is read, not recalled');
  await odd.close();

  // ---- Six: rows this reading cannot open --------------------------------
  const blind = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let blinded = false;
  await blind.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    delete entries[1].place;                       // no place at all
    entries[2].place = Object.assign({}, entries[2].place, { zone: 'Mars/Olympus' });
    const body = JSON.stringify(entries, null, 2);
    blinded = body !== before;
    await route.fulfill({ response, body });
  });
  await blind.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const blindText = await readReport(blind);
  const blindHead = parseHead(blindText);
  check(blinded, 'the unopenable-row ledger actually reached the page');
  check(blindHead.opened === head.opened - 2,
    `the two rows it cannot open are left out of the counts (${head.opened} → ${blindHead.opened})`);
  check(/2 rows carry no date, no readable instant or no clock this page has heard of/.test(blindText),
    'and they are counted out loud rather than silently dropped — a count over a filtered list is a fact about the filter');
  check(blindHead.unaccounted === 0,
    'a zone this clock never heard of is set aside, never convicted');
  await blind.close();

  // ---- Seven: the ledger will not open -----------------------------------
  // Ember's Day 33 half: a computed figure cannot go stale but its wiring
  // can go quietly dead. This is the one place the wiring can be proved to
  // exist — if nothing walked it, the placeholder would still be standing.
  const dead = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await dead.route('**/ledger.json*', (route) => route.abort());
  await dead.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const deadText = await readReport(dead);
  check(/the ledger would not open/.test(deadText),
    'when the ledger will not open the section says so');
  check(!/reading the two clocks/.test(deadText),
    'and it does not leave "reading the two clocks…" standing for ever, which is a page pretending to still be working');
  await dead.close();

  // ---- Eight: the shape of the room --------------------------------------
  for (const width of [375, 390, 1440]) {
    const view = await browser.newPage({ viewport: { width, height: 900 } });
    await view.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    const overflow = await view.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `${width}px: the page does not scroll sideways (${overflow})`);
    await view.close();
  }

  await browser.close();

  console.log('');
  if (problems.length) {
    console.log(`FAIL — ${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
    problems.forEach((p) => console.log(`  - ${p}`));
    process.exit(1);
  }
  console.log('PASS — the two counts are held against each other, a row dated the wrong morning is caught, and split is not unaccounted.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
