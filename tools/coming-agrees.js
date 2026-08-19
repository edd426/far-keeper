// tools/coming-agrees.js — does the forward claim survive a reader?
//
//     ./scripts/local-snapshot.sh tools/coming-agrees.js
//
// Built Day 16, alongside `tools/crossing-breaks.sh`. That one breaks the
// instrument in node; this one asks what a person loading the page
// actually gets, which is a different question and has caught different
// things (Day 9's third leg, and the argument for keeping it).
//
// Three claims are checked here and each is checked against something
// rather than merely looked at:
//
//   1. The page's account of why the two methods are hours apart must be
//      arithmetic the page's own printed numbers support. It prints a
//      longitude error and a daily rate and says the gap is one divided
//      by the other. So divide them and see.
//   2. A throw inside the new section must not take the room with it.
//      That is this tower's signature failure — Day 5, when a guard
//      firing inside reckon() silently killed the ledger — and every new
//      thing that can throw rebuilds the fault one floor up unless the
//      call site is guarded. Forced on the wire, not reasoned about.
//   3. The corner's steepest-losing day must move when the reader's
//      skyline moves. That is the entire reason it is in the corner and
//      not on the page above; if it did not move, the section would be a
//      false statement about where things live.
//
// Day 5's rule throughout: assert the sabotage landed, and write the pass
// rule so the unbroken case would fail it.

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

// The figures render as a <dl>: term, value, term, value. Read it back as
// the reader sees it rather than from the module that produced it.
async function figures(page, id) {
  return page.$$eval(`#${id} > *`, (nodes) => {
    const out = {};
    let term = null;
    for (const node of nodes) {
      if (node.tagName === 'DT') term = node.textContent.trim();
      else if (term !== null) { out[term] = node.textContent.trim(); term = null; }
    }
    return out;
  });
}

function numberIn(text) {
  const m = /-?\d+(\.\d+)?/.exec(String(text).replace('−', '-'));
  return m === null ? null : Number(m[0]);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- one: the page's account of its own disagreement ----------------
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#coming-figures dd');

  const coming = await figures(page, 'coming-figures');
  const keys = Object.keys(coming);
  check(keys.length >= 8, `the crossing section drew ${keys.length} figures`);

  const nameRow = keys.find((k) => /next crossing/.test(k));
  check(!!nameRow, `the section names which crossing is next (${coming[nameRow]})`);

  const whenA = keys.find((k) => /method A/.test(k));
  const whenB = keys.find((k) => /method B/.test(k));
  const gapRow = keys.find((k) => /apart by/.test(k));
  const errRow = keys.find((k) => /behind method A/.test(k));
  const rateRow = keys.find((k) => /moves, per day/.test(k));
  check(!!whenA && !!whenB && !!gapRow && !!errRow && !!rateRow,
    'the section prints both methods, their gap, the longitude error and the daily rate');

  // The forward half of the claim: this instant has not happened yet.
  const instant = Date.parse(coming[whenA].replace(' UTC', ''));
  check(Number.isFinite(instant), `method A's instant parses as a date (${coming[whenA]})`);
  check(instant > Date.now(),
    'the crossing is in the future — which is the only thing on this page that is');

  // The two methods must actually disagree by what the page says, and
  // the account must divide out. A page that printed a gap and an
  // explanation that did not generate it would be worse than one that
  // printed no explanation at all.
  const gap = numberIn(coming[gapRow]);
  const err = Math.abs(numberIn(coming[errRow]));
  const rate = numberIn(coming[rateRow]);
  const generated = err / rate * 24;
  check(Math.abs(generated - gap) < 0.05,
    `the account generates the gap it explains: ${err} ÷ ${rate} × 24 = ` +
    `${generated.toFixed(3)} h against the ${gap} h printed`);

  const gapFromInstants = (Date.parse(coming[whenB].replace(' UTC', '')) - instant) / 3600000;
  check(Math.abs(gapFromInstants - gap) < 0.05,
    `the printed gap is the gap between the two printed instants ` +
    `(${gapFromInstants.toFixed(3)} h against ${gap} h)`);

  // And the warning label. The whole section rests on saying out loud
  // that one method stands behind the instant; a page that quietly
  // printed two numbers and let a reader assume they corroborated would
  // be the Day 6 fault with better manners.
  const prose = await page.$eval('#coming-heading', (h) =>
    h.closest('section').textContent.replace(/\s+/g, ' '));
  check(/One method stands behind that instant/.test(prose),
    'the section says out loud that the second method cannot corroborate this one');
  check(/recomputes that instant every time it is loaded/.test(prose),
    'the section says this page is not the record of the claim');
  await page.close();

  // ---- two: a throw here must not take the room with it ---------------
  const broken = await browser.newPage({ viewport: { width: 390, height: 900 } });
  let substituted = false;
  await broken.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    // Force the residual guard to fire: aim it at a longitude the
    // bisection did not solve for. A real refusal by the real guard,
    // rather than a thrown string of the test's own invention.
    const body = before.replace(
      'var residualA = angleGap(apparentLongitudeA(jdA), spec.longitude);',
      'var residualA = angleGap(apparentLongitudeA(jdA), spec.longitude + 5);'
    );
    substituted = body !== before;
    await route.fulfill({ response, body });
  });
  await broken.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  check(substituted,
    'the sabotage reached the page (a substitution that silently no-ops is a test that cannot fail)');

  const note = await broken.$eval('#coming-note', (n) => n.textContent.trim());
  check(/could not find the next crossing/.test(note),
    `the room says why it has no crossing rather than going quiet — "${note.slice(0, 60)}…"`);
  check(/not at longitude/.test(note),
    'the reader is given the instrument\'s own reason, not a generic apology');
  check((await broken.$$('#coming-figures dd')).length === 0,
    'no crossing is printed when the guard refuses — better nothing than a number the tower cannot stand behind');

  // The point of the whole case: everything else still drew.
  await broken.waitForSelector('.ledger__entry');
  const rowsUnderSabotage = (await broken.$$('.ledger__entry')).length;
  check(rowsUnderSabotage > 0,
    `the ledger still drew ${rowsUnderSabotage} rows while the crossing was refusing`);
  const todayFigures = (await broken.$$('#today-figures dd')).length;
  check(todayFigures > 0,
    `today's figures still drew (${todayFigures}) while the crossing was refusing`);
  const cornerFigures = (await broken.$$('#corner-figures dd')).length;
  check(cornerFigures > 0,
    `the corner still drew (${cornerFigures}) while the crossing was refusing`);
  await broken.close();

  // ---- three: the corner's figure has to be the corner's ---------------
  const mine = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await mine.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await mine.waitForSelector('#steepest-figures dd');

  const flat = await figures(mine, 'steepest-figures');
  const flatKey = Object.keys(flat).find((k) => /loses most daylight/.test(k));
  check(!!flatKey, `the corner names a steepest-losing day on a flat horizon (${flat[flatKey]})`);

  await mine.fill('#corner-skyline', '10');
  await mine.click('#corner-go');
  await mine.waitForFunction(
    (was) => {
      const dd = document.querySelector('#steepest-figures dd');
      return dd && dd.textContent.trim() !== was;
    },
    flat[flatKey],
    { timeout: 5000 }
  ).catch(() => {});

  const hilly = await figures(mine, 'steepest-figures');
  const hillyKey = Object.keys(hilly).find((k) => /loses most daylight/.test(k));
  check(hilly[hillyKey] !== flat[flatKey],
    `ten degrees of skyline moves the steepest day (${flat[flatKey]} → ${hilly[hillyKey]}) — ` +
    'which is why it is in the corner and not on the page');

  // The published rule must generate the published width, on the reader's
  // own numbers and not only on ours.
  const measured = numberIn(hilly[Object.keys(hilly).find((k) => /days within/.test(k))]);
  const predicted = numberIn(hilly[Object.keys(hilly).find((k) => /predicts that width/.test(k))]);
  check(measured !== null && predicted !== null && Math.abs(measured - predicted) <= 1.5,
    `at the reader's own skyline the curvature predicts the width it is printed with ` +
    `(${measured} measured, ${predicted} predicted)`);
  await mine.close();

  // ---- four: the page must not scroll sideways ------------------------
  for (const width of [375, 390, 1440]) {
    const wide = await browser.newPage({ viewport: { width, height: 900 } });
    await wide.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    await wide.waitForSelector('#coming-figures dd');
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
  console.log('\nPASS — the forward claim carries its own account, refuses without taking the room, ' +
    'and the corner\'s day is the corner\'s.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
