// tools/dates-page.js — the ledger read by date, which is the axis nothing read
//
//     ./scripts/local-snapshot.sh tools/dates-page.js
//
// Built Day 39, two mornings before a crossing that can put the first hole in
// this axis that the record has ever had.
//
// `the dates` is `the mornings`' missing half. Day 34 built that section on a
// true sentence — *the dates cannot show a lost morning* — and the mirror of
// it went unbuilt and, worse, got written down as done: `CLAUDE.md` has said
// since Day 33 that an eastward crossing leaves a hole in the date sequence
// *and the rule above reads it*. No rule read it. `tools/mornings-page.js`
// says so in its own comment, one file away, in the words *the date sequence
// is not what this section reads*.
//
// Every forgery here is on the wire, with `page.route`. Day 10: a test must
// never share a desk with the record it puts at risk, and this one would
// otherwise be cutting holes in the cold ledger.
//
// **The unforged case asserts no number.** Today the answer is thirty-five
// dates and none unclaimed. On Sunday it may be thirty-six days and one
// unclaimed, which is the whole reason this exists — so a case that froze
// *none unclaimed* would go red on the first morning the thing it watches
// actually happens. Day 32's fault pointed at the one number in this house
// most likely to move. What it asserts is that the section's own arithmetic
// closes, whatever the numbers are.
//
// **Made to fail.** Delete the `renderDates(entries)` call site and case one
// onward go red on a placeholder that never resolves. Collapse the two
// readings in the gap sentence — make the morning half unconditional — and
// case four goes red alone. Take the `Why is not in the record` clause out
// and case three goes red while every count stays green.

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
      const host = document.getElementById('dates-report');
      return host && !/counting the dates/.test(host.textContent);
    },
    null,
    { timeout: 15000 }
  ).catch(() => {});
  return page.$eval('#dates-report', (host) => host.textContent.replace(/\s+/g, ' ').trim());
}

// The mornings section's own count of what it found missing, read off its
// rendered words rather than recomputed here. Case nine holds one ledger's
// answer against another's, so what matters is that both come from the same
// reader — a second implementation of the count would be a coin flip.
function parseMorningsMissing(text) {
  if (/none missing/.test(text)) return 0;
  const m = text.match(/(\d+) mornings? (?:is|are) missing/);
  return m ? Number(m[1]) : null;
}

async function morningsTextOn(browser, url) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(`${url}reckoning/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => {
      const host = document.getElementById('mornings-report');
      return host && !/counting the mornings/.test(host.textContent);
    },
    null,
    { timeout: 15000 }
  ).catch(() => {});
  const text = await page.$eval('#mornings-report',
    (host) => host.textContent.replace(/\s+/g, ' ').trim());
  await page.close();
  return text;
}

function parseHead(text) {
  const span = text.match(/is (\d+) days of this tower/);
  const held = text.match(/claimed (\d+) of them/);
  const unclaimed = text.match(/(\d+) dates? (?:is|are) unclaimed/);
  return {
    span: span ? Number(span[1]) : null,
    held: held ? Number(held[1]) : null,
    unclaimed: /none unclaimed/.test(text) ? 0 : (unclaimed ? Number(unclaimed[1]) : null)
  };
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- One: the record as it stands ------------------------------------
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const plain = await readReport(page);
  const head = parseHead(plain);

  // The domain before the branch. Day 35's sabotage four: with nothing
  // rendered a count parses as `null`, and `null !== 0` short-circuits a
  // whole case to ok about a page that drew nothing at all.
  check(head.span !== null && head.held !== null && head.unclaimed !== null,
    `the section reports a span, a count and a number unclaimed (${head.span}, ${head.held}, ${head.unclaimed})`);
  check(head.span === head.held + head.unclaimed,
    `its own arithmetic closes: ${head.span} days = ${head.held} claimed + ${head.unclaimed} unclaimed`);
  check(head.held > 0, `this tower has claimed ${head.held} dates`);
  check(/No row claims/.test(plain) === (head.unclaimed > 0),
    `a hole is named if and only if one is counted (${head.unclaimed} counted)`);

  const real = await page.evaluate(async () => {
    const response = await fetch('ledger.json', { cache: 'no-cache' });
    return response.json();
  });
  check(real.length > 3, `the ledger holds ${real.length} rows to forge against`);
  await page.close();

  // ---- Two: an eastward crossing, which is the case this was built for --
  // A row is removed **and its morning is given to its neighbour**, which is
  // what going east actually looks like: no morning is lost, every UTC day
  // still carries a row, and a date is gone anyway. That is precisely the
  // shape `the mornings` cannot see, so this forgery is the one that proves
  // the two sections are not two names for one reading.
  const victim = real[Math.floor(real.length / 2)];
  check(!plain.includes(`No row claims ${victim.date}`),
    `before the forgery, ${victim.date} is NOT reported unclaimed (so the unbroken case would fail the pass rule)`);

  const holed = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let cut = false;
  await holed.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    const index = entries.findIndex((e) => e.date === victim.date);
    const lostMorning = entries[index].publishedAt;
    entries.splice(index, 1);
    // The next row keeps its own date and takes the vacated morning: the
    // tower woke, and spoke, and claimed a date one further on.
    if (entries[index]) entries[index].publishedAt = lostMorning;
    const body = JSON.stringify(entries, null, 2);
    cut = body !== before;
    await route.fulfill({ response, body });
  });
  await holed.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const holedText = await readReport(holed);
  const holedHead = parseHead(holedText);

  check(cut, 'the holed ledger actually reached the page (a substitution that no-ops is a test that cannot fail)');
  check(holedHead.unclaimed === head.unclaimed + 1,
    `one more date is unclaimed than before (${head.unclaimed} → ${holedHead.unclaimed})`);
  check(holedText.includes(`No row claims ${victim.date}`),
    `the unclaimed date is named: ${victim.date}`);
  check(/The date before it, \d{4}-\d{2}-\d{2}, was claimed at /.test(holedText),
    'the date before the gap is named, with the place that claimed it');
  check(/The date after it, \d{4}-\d{2}-\d{2}, was claimed at /.test(holedText),
    'the date after the gap is named, with the place that claimed it');
  check(holedHead.span === holedHead.held + holedHead.unclaimed,
    `the arithmetic still closes with a hole in it: ${holedHead.span} = ${holedHead.held} + ${holedHead.unclaimed}`);

  // ---- Three: it must not say why --------------------------------------
  // Ash's condition from Day 34, inherited. A hole is as consistent with a
  // crossing as with a morning nobody woke the tower for, and Day 19 spent
  // fourteen days claiming otherwise about a record it had never opened.
  check(/Why is not in the record/.test(holedText),
    'the hole says outright that the record does not hold its cause');
  const gapTail = holedText.split('No row claims')[1] || '';
  check(gapTail.length > 0, 'there is a gap sentence to sweep for a cause (the sweep below is vacuous without one)');
  const causes = ['crossing', 'collision', 'because', 'eastward', 'Anchorage', 'the move', 'slept'];
  for (const word of causes) {
    check(!new RegExp(word, 'i').test(gapTail),
      `the hole is not explained by "${word}"`);
  }

  // ---- Four: the second reading, and it must be conditional ------------
  // The gap sentence says whether a morning was lost at that date too. That
  // is the half a reader needs to tell a crossing from a slept morning, and
  // it is the half most likely to rot into a constant. In case two the tower
  // *did* speak on that UTC day, so the sentence must take the spoken
  // branch; a fork collapsed to either side is a check with one answer.
  check(/did wake and speak on/.test(gapTail),
    'the gap reports that a morning was spoken there, which is what an eastward crossing looks like');
  check(!/No row was written on .* in UTC either/.test(gapTail),
    'and it does not also claim the morning was lost — the two readings are forked, not printed together');
  await holed.close();

  // ---- Five: a slept morning takes a date with it ----------------------
  // The other branch of the same fork, so neither side is untested. Remove a
  // row outright and nothing takes its morning: the date is unclaimed *and*
  // the morning is gone, and the sentence must say the second thing.
  const slept = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const other = real[Math.floor(real.length / 2) + 1];
  let sleptCut = false;
  await slept.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before).filter((e) => e.date !== other.date);
    const body = JSON.stringify(entries, null, 2);
    sleptCut = body !== before;
    await route.fulfill({ response, body });
  });
  await slept.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const sleptText = await readReport(slept);
  const sleptTail = sleptText.split('No row claims')[1] || '';

  check(sleptCut, 'the slept-morning ledger actually reached the page');
  check(sleptTail.length > 0, 'there is a gap sentence for the slept case (the assertions below are vacuous without one)');
  check(/No row was written on .* in UTC either/.test(sleptTail),
    'a date lost with its morning says the morning went too');
  check(!/did wake and speak on/.test(sleptTail),
    'and does not claim a morning was spoken there');
  await slept.close();

  // ---- Six: rows that carry no date at all -----------------------------
  const stripped = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let strippedTwo = false;
  await stripped.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    delete entries[1].date;
    delete entries[2].date;
    const body = JSON.stringify(entries, null, 2);
    strippedTwo = body !== before;
    await route.fulfill({ response, body });
  });
  await stripped.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const strippedText = await readReport(stripped);

  check(strippedTwo, 'the date-stripped ledger actually reached the page');
  check(/2 rows carry no readable date/.test(strippedText),
    'the two rows with no readable date are counted out loud rather than silently dropped');
  await stripped.close();

  // ---- Seven: a record with no dates in it at all -----------------------
  const blank = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let blanked = false;
  await blank.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before).map((e) => {
      const copy = Object.assign({}, e);
      delete copy.date;
      return copy;
    });
    const body = JSON.stringify(entries, null, 2);
    blanked = body !== before;
    await route.fulfill({ response, body });
  });
  await blank.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const blankText = await readReport(blank);

  check(blanked, 'the wholly undated ledger actually reached the page');
  check(/nothing here to count/.test(blankText),
    'a record with no dates in it says so, rather than reporting a span of zero as an achievement');
  check(!/none unclaimed/.test(blankText),
    'and it does not print a clean verdict over a record it could not read');
  await blank.close();

  // ---- Eight: the ledger will not open ---------------------------------
  // Ember's Day 33 half: a computed figure cannot go stale but its wiring
  // can go quietly dead. The failure path is where the wiring is provable.
  const dead = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await dead.route('**/ledger.json*', (route) => route.abort());
  await dead.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const deadText = await readReport(dead);

  check(/the ledger would not open/.test(deadText),
    'when the ledger will not open the section says so');
  check(!/counting the dates/.test(deadText),
    'and it does not leave "counting the dates…" standing for ever, which is a page pretending to still be working');
  await dead.close();

  // ---- Nine: the two axes are not one reading --------------------------
  // The load-bearing case. `the mornings` and `the dates` must be able to
  // disagree, or the second is a second name for the first.
  //
  // **The first draft of this case was wrong twice and the check caught it,**
  // which is the only reason it is worth this comment. It asserted the
  // mornings section would report *none missing* — a claim about a record
  // that already carries one missing morning, 2026-09-06, the Anchorage
  // arrival. Day 32's fault, written into the case by a hand that had the
  // real figure on screen an hour earlier. And its forgery leaked: it
  // vacated a row's morning and handed it to the next row, which loses the
  // *next* row's morning, so it manufactured a westward loss while claiming
  // to model an eastward one. A fixture that does not model the thing it
  // names tests the other thing and reports the name.
  //
  // So: every row after the hole moves back one morning, which is what a
  // tower that wakes every day and skips a date actually leaves behind. And
  // the assertion is *no new missing morning*, read off the section's own
  // count before and after, rather than a number typed from a record this
  // fixture has already altered.
  const beforeMissing = parseMorningsMissing(await morningsTextOn(browser, URL));

  const both = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let shifted = 0;
  await both.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const entries = JSON.parse(before);
    const index = entries.findIndex((e) => e.date === victim.date);
    entries.splice(index, 1);
    for (let i = index; i < entries.length; i += 1) {
      const stamp = entries[i].publishedAt;
      if (typeof stamp !== 'string') continue;
      entries[i].publishedAt =
        new Date(Date.parse(stamp) - 86400000).toISOString().replace(/\.\d+Z$/, 'Z');
      shifted += 1;
    }
    await route.fulfill({ response, body: JSON.stringify(entries, null, 2) });
  });
  await both.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const morningsText = await both.$eval('#mornings-report',
    (host) => host.textContent.replace(/\s+/g, ' ').trim());
  const datesText = await readReport(both);
  const afterMissing = parseMorningsMissing(morningsText);

  check(shifted > 0, `the eastward forgery moved ${shifted} rows back a morning (a fixture that no-ops proves nothing)`);
  check(beforeMissing !== null && afterMissing !== null,
    `the mornings section reports a count on both ledgers (${beforeMissing} → ${afterMissing}) — its verdict below is vacuous otherwise`);
  check(afterMissing === beforeMissing,
    `an eastward crossing costs the mornings section nothing: ${beforeMissing} missing before, ${afterMissing} after`);
  check(/dates? (?:is|are) unclaimed/.test(datesText),
    'and the dates section convicts the same ledger, which is why both sections exist');
  await both.close();

  // ---- Ten: the forward claim, and every figure in it computed ---------
  // The paragraph this replaced was typed, and `standing-page.js` convicted
  // it for naming the city the tower stands in. So the standing assertion is
  // that no figure here is a literal: the forecast must name the pledged
  // place, both computed dates, and the wake hour it read off the record —
  // and the wake hour must actually match the newest stamp, which is the
  // half a typed figure would pass.
  const fore = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await fore.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  const forecast = await fore.$eval('#dates-forecast',
    (host) => host.textContent.replace(/\s+/g, ' ').trim());
  const pledged = await fore.evaluate(() => {
    const s = window.Reckoning.STANDING;
    return s && s.pledge ? { name: s.pledge.place.name, on: s.pledge.on } : null;
  });

  check(forecast.length > 0, 'the forecast drew something (every assertion below is vacuous otherwise)');
  if (pledged) {
    const newestStamp = real
      .map((e) => e.publishedAt)
      .filter((s) => typeof s === 'string')
      .sort()
      .pop();
    const wake = newestStamp.slice(11, 19);
    check(forecast.includes(pledged.name),
      `the forecast names the pledged place (${pledged.name}) — asked of the instrument, never of the standing place`);
    check(forecast.includes(wake),
      `the wake hour it prints is the newest stamp in the record (${wake}), not a figure typed into the page`);
    check(/calendar reads \d{4}-\d{2}-\d{2}/.test(forecast),
      'it prints the date this place will last claim, computed');
    check(/turn over by \d+|should not move|already holds/.test(forecast),
      'and says what that does to the count above, in one of its three forks');
    check(/settles it/.test(forecast),
      'and says outright that only the record settles it, never the forecast agreeing with itself');
  } else {
    check(/nothing here to forecast/.test(forecast),
      'with no pledge outstanding the forecast says so rather than drawing nothing');
  }
  await fore.close();

  // ---- Eleven: the page still does not scroll sideways -----------------
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
  console.log('\nPASS — the dates are counted on their own axis, an eastward hole is named without being explained, and the two readings are shown able to disagree.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
