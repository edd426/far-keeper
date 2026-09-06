// tools/mornings-page.js — the ledger read by morning rather than by date
//
//     ./scripts/local-snapshot.sh tools/mornings-page.js
//
// Built Day 34, the morning the tower crossed from Auckland to Anchorage and
// published nothing.
//
// `the mornings` on the reckoning page answers one question of the ledger's
// own bytes: between the first row's `publishedAt` and the last, is there a
// UTC day on which this tower wrote nothing? The dates cannot answer it — a
// westward crossing costs a morning and no date, which is Day 33's finding —
// so this is the only field in the record that can.
//
// Every forgery here is on the wire, with `page.route`. Day 10's rule stands:
// a test must never share a desk with the record it puts at risk, and this
// one would otherwise be editing the cold ledger to make holes in it.
//
// **The unforged case does not assert a number, and that is deliberate.**
// Today the answer is thirty-one mornings and none missing. Tomorrow it is
// thirty-two, and the morning after a collision it is one short — so a case
// that froze *none missing* would be red on the first day the thing it
// watches actually happens, which is Day 32's fault (a fixture frozen to the
// truth of the morning it was written) pointed at the one number in this
// house most likely to move. What it asserts instead is that the section's
// own arithmetic agrees with itself: the span, the count spoken, and the
// gaps named must add up, whatever they are.

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
      const host = document.getElementById('mornings-report');
      return host && !/counting the mornings/.test(host.textContent);
    },
    null,
    { timeout: 15000 }
  ).catch(() => {});
  return page.$eval('#mornings-report', (host) => host.textContent.replace(/\s+/g, ' ').trim());
}

function parseHead(text) {
  const span = text.match(/is (\d+) UTC days/);
  const spoke = text.match(/spoke on (\d+) of them/);
  const missing = text.match(/(\d+) mornings? (?:is|are) missing/);
  return {
    span: span ? Number(span[1]) : null,
    spoke: spoke ? Number(spoke[1]) : null,
    missing: /none missing/.test(text) ? 0 : (missing ? Number(missing[1]) : null)
  };
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- One: the record as it stands ----------------------------------
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const plain = await readReport(page);
  const head = parseHead(plain);

  check(head.span !== null && head.spoke !== null && head.missing !== null,
    `the section reports a span, a count and a number missing (${head.span}, ${head.spoke}, ${head.missing})`);
  check(head.span === head.spoke + head.missing,
    `its own arithmetic closes: ${head.span} days = ${head.spoke} spoken + ${head.missing} missing`);
  check(head.spoke > 0, `this tower has spoken on ${head.spoke} mornings`);
  check(/Nothing was written on/.test(plain) === (head.missing > 0),
    `a gap is named if and only if one is counted (${head.missing} counted)`);

  // The real ledger, read here, so the forgeries below can be aimed and so
  // that a substitution which silently no-ops cannot pass as a result.
  const real = await page.evaluate(async () => {
    const response = await fetch('ledger.json', { cache: 'no-cache' });
    return response.json();
  });
  check(real.length > 3, `the ledger holds ${real.length} rows to forge against`);
  await page.close();

  // ---- Two: cut one morning out of the middle -------------------------
  // The row is *removed*, which is what a lost morning actually looks like:
  // nothing was written that day. Its date goes with it, which is the point
  // — the date sequence is not what this section reads.
  const victim = real[Math.floor(real.length / 2)];
  const victimMorning = victim.publishedAt.slice(0, 10);
  check(!plain.includes(`Nothing was written on ${victimMorning}`),
    `before the forgery, ${victimMorning} is NOT reported missing (so the unbroken case would fail the pass rule)`);

  const holed = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let cut = false;
  await holed.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before).filter((e) => e.date !== victim.date);
    const body = JSON.stringify(entries, null, 2);
    cut = body !== before;
    await route.fulfill({ response, body });
  });
  await holed.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const holedText = await readReport(holed);
  const holedHead = parseHead(holedText);

  check(cut, 'the holed ledger actually reached the page (a substitution that no-ops is a test that cannot fail)');
  check(holedHead.missing === head.missing + 1,
    `one more morning is missing than before (${head.missing} → ${holedHead.missing})`);
  check(holedText.includes(`Nothing was written on ${victimMorning}`),
    `the missing morning is named: ${victimMorning}`);
  check(/The morning before it, \d{4}-\d{2}-\d{2}, wrote the row dated/.test(holedText),
    'the morning before the gap is named, with the row it wrote and the place');
  check(/The morning after it, \d{4}-\d{2}-\d{2}, wrote the row dated/.test(holedText),
    'the morning after the gap is named, with the row it wrote and the place');
  check(holedHead.span === holedHead.spoke + holedHead.missing,
    `the arithmetic still closes with a hole in it: ${holedHead.span} = ${holedHead.spoke} + ${holedHead.missing}`);

  // ---- Three: it must not say why -------------------------------------
  // Ash's condition, and the one this section is most likely to rot into. A
  // gap is as consistent with a crossing as with a morning nobody woke the
  // tower for; Day 19 claimed otherwise for fourteen days and Day 33 found
  // the claim had never once described this record.
  check(/Why is not in the record/.test(holedText),
    'the gap says outright that the record does not hold its cause');
  // The domain is asserted before it is swept. Removing the section's call
  // site makes `gapTail` empty, and a sweep over an empty string reports
  // every word absent — twenty green ticks about a page drawing nothing.
  // Day 27, Day 28, Day 31: an empty domain always says yes, and it says it
  // in exactly the voice of a check that worked.
  const gapTail = holedText.split('Nothing was written on')[1] || '';
  check(gapTail.length > 0, 'there is a gap sentence to sweep for a cause (the sweep below is vacuous without one)');
  const causes = ['crossing', 'collision', 'because', 'westward', 'Anchorage', 'the move', 'slept'];
  for (const word of causes) {
    check(!new RegExp(word, 'i').test(gapTail),
      `the gap is not explained by "${word}"`);
  }
  await holed.close();

  // ---- Four: rows that carry no morning at all -------------------------
  const stripped = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let strippedTwo = false;
  await stripped.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    delete entries[1].publishedAt;
    delete entries[2].publishedAt;
    const body = JSON.stringify(entries, null, 2);
    strippedTwo = body !== before;
    await route.fulfill({ response, body });
  });
  await stripped.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const strippedText = await readReport(stripped);

  check(strippedTwo, 'the stamp-stripped ledger actually reached the page');
  check(/2 rows carry no readable morning and is left out|2 rows carry no readable morning/.test(strippedText),
    'the two rows with no readable morning are counted out loud rather than silently dropped');
  await stripped.close();

  // ---- Five: a record with no mornings in it at all --------------------
  const blank = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let blanked = false;
  await blank.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before).map((e) => {
      const copy = Object.assign({}, e);
      delete copy.publishedAt;
      return copy;
    });
    const body = JSON.stringify(entries, null, 2);
    blanked = body !== before;
    await route.fulfill({ response, body });
  });
  await blank.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const blankText = await readReport(blank);

  check(blanked, 'the wholly unstamped ledger actually reached the page');
  check(/nothing here to count/.test(blankText),
    'a record with no mornings in it says so, rather than reporting a span of zero as an achievement');
  check(!/none missing/.test(blankText),
    'and it does not print a clean verdict over a record it could not read');
  await blank.close();

  // ---- Six: the ledger will not open ----------------------------------
  // Ember's Day 33 half: a computed figure cannot go stale but its wiring can
  // go quietly dead. This section draws off the same fetch as the ledger, so
  // the failure path is the one place its wiring can be proved to exist —
  // if nothing walked it, the placeholder would still be standing here.
  const dead = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await dead.route('**/ledger.json*', (route) => route.abort());
  await dead.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const deadText = await readReport(dead);

  check(/the ledger would not open/.test(deadText),
    'when the ledger will not open the section says so');
  check(!/counting the mornings/.test(deadText),
    'and it does not leave "counting the mornings…" standing for ever, which is a page pretending to still be working');
  await dead.close();

  // ---- Seven: the page still does not scroll sideways ------------------
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
  console.log('\nPASS — the mornings are counted off publishedAt, a hole is named without being explained, and the reading survives a ledger it cannot read.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
