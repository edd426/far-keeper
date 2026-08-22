// tools/standing-page.js — does the room draw the day of the place the
// tower stands in?
//
//     ./scripts/local-snapshot.sh tools/standing-page.js
//
// Built Day 19, and it is the second of the two halves. `tools/standing-
// clock.sh` asks the question of the gate on the keeper's desk. This one
// asks it of the copy that runs in a stranger's browser — the copy nobody
// here can reach once it has shipped.
//
// The fault, before it was repaired: `reckoning/page.js` held its own
// arithmetic for "what day is it here", called it with
// `Reckoning.PARIS.zone` at two call sites, and `tools/reckon.js` held a
// third copy on the desk. Three copies of one question across two runtimes.
// Nothing was ever wrong by it, because all three copies were asking about
// the same city — and a disagreement between the two that matter would
// surface as this page drawing a day the ledger does not hold, in a
// browser, where nothing here would ever see it.
//
// The forgery is on the wire (`page.route`), never on disk — Day 10's rule:
// a test must not share a desk with the record it puts at risk. Day 5's
// rule on both halves: assert the substitution landed, and write the pass
// rule so the *unbroken* case would fail it. Here that means the far zone
// is chosen at the moment this runs, from a list, by asking which zones
// actually disagree with the standing place about today's date — because a
// hardcoded pair agrees for most of the day and would then be asserting
// that two identical strings are identical (Day 17).

const { chromium } = require('playwright');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;

const CANDIDATES = [
  { name: 'Kiritimati', latitude: 1.87, longitude: -157.43, zone: 'Pacific/Kiritimati' },
  { name: 'Auckland', latitude: -36.85, longitude: 174.76, zone: 'Pacific/Auckland' },
  { name: 'Tokyo', latitude: 35.68, longitude: 139.69, zone: 'Asia/Tokyo' },
  { name: 'Reykjavik', latitude: 64.15, longitude: -21.94, zone: 'Atlantic/Reykjavik' },
  { name: 'Sao Paulo', latitude: -23.55, longitude: -46.63, zone: 'America/Sao_Paulo' },
  { name: 'New York', latitude: 40.71, longitude: -74.01, zone: 'America/New_York' },
  { name: 'Honolulu', latitude: 21.31, longitude: -157.86, zone: 'Pacific/Honolulu' }
];

function todayIn(zone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date()).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

(async () => {
  const here = todayIn('Europe/Paris');
  const far = CANDIDATES.find((c) => todayIn(c.zone) !== here);

  if (!far) {
    console.error('FAIL — no candidate zone disagrees with the standing place about today.');
    console.error('Nothing below was tested. The world spans at least two calendar dates at');
    console.error('every instant, so this means the list is wrong, not the sky.');
    process.exit(1);
  }
  const farToday = todayIn(far.zone);
  console.log(`standing-page: Paris says ${here}; ${far.name} says ${farToday}.`);

  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  // ---- Part one: the tower as it stands --------------------------------
  const standing = await browser.newPage();
  await standing.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  const heading = (await standing.textContent('#today-heading')).trim();
  check(heading === 'today over Paris',
    `the room's heading names the place it stands in ("${heading}")`);

  const drawnDate = await standing.$eval('#today-figures', (list) => {
    const terms = Array.from(list.querySelectorAll('dt'));
    const at = terms.findIndex((t) => /date/i.test(t.textContent));
    return at === -1 ? null : terms[at].nextElementSibling.textContent.trim();
  });
  check(drawnDate === here, `the room draws Paris's today (${drawnDate})`);

  for (const width of [375, 390, 1440]) {
    await standing.setViewportSize({ width, height: 900 });
    const overflow = await standing.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `${width}px: the page does not scroll sideways (${overflow})`);
  }
  await standing.close();

  // ---- Part two: a tower standing somewhere else -----------------------
  //
  // The whole question, and it is a question with a wrong answer that looks
  // right: a page that kept Paris's calendar while standing in Auckland
  // would draw a full, plausible, correctly-formatted day. It would simply
  // be the wrong day, and no figure on it would say so.
  const moved = await browser.newPage();
  let landed = false;

  await moved.route('**/reckoning.js*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const from = 'place: PARIS,';
    const to = 'place: ' + JSON.stringify(far) + ',';
    const body = before.replace(from, to);
    landed = body !== before;
    await route.fulfill({ response, body });
  });

  await moved.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });

  check(landed, `the forgery landed: the instrument on the wire stands at ${far.name}`);

  if (landed) {
    const movedHeading = (await moved.textContent('#today-heading')).trim();
    check(movedHeading === `today over ${far.name}`,
      `the heading follows the tower to ${far.name} ("${movedHeading}")`);

    const movedDate = await moved.$eval('#today-figures', (list) => {
      const terms = Array.from(list.querySelectorAll('dt'));
      const at = terms.findIndex((t) => /date/i.test(t.textContent));
      return at === -1 ? null : terms[at].nextElementSibling.textContent.trim();
    });
    check(movedDate === farToday,
      `the room draws ${far.name}'s today (${movedDate}), not Paris's (${here})`);

    // The pass rule the unbroken case would fail: the two dates must
    // actually differ, or the case above is asserting that a string equals
    // itself. Guaranteed by the search at the top, and checked again here
    // where it is being relied on.
    check(movedDate !== here,
      `and that is a different day from Paris's — the case can tell them apart`);

    // The ledger below is untouched by any of this: every row carries its
    // own place and is recomputed there (Day 18). Moving the tower must not
    // move the record.
    const drifted = await moved.$$eval('.ledger__verdict', (nodes) =>
      nodes.filter((n) => /DRIFTED/.test(n.textContent)).length);
    check(drifted === 3,
      `the ledger still shows exactly the 3 method-1 scars (${drifted}) — moving the tower does not move the record`);

    // ---- no line this file writes may name a city the tower has left ----
    //
    // Ember's, and it is the half I would have left silent. The room's
    // *prose* still says Paris in a hand's voice, and going through it is
    // the work the move owes — that much is a fair deferral, because a hand
    // wrote those sentences and a hand will have to move them. But a line of
    // *running code* that says "the atmosphere over Paris" executes on every
    // render for whatever place the tower actually stands in. After a move
    // that is not stale copy; it is code asserting something false, printed
    // directly under a heading that correctly names the new city, with
    // nothing anywhere saying which of the two to believe.
    //
    // So the deferral is flagged rather than trusted: everything page.js
    // writes into the room is swept for the old city's name. What this does
    // NOT cover, and says so rather than implying otherwise, is the static
    // HTML — that is the move's work, and this check will not do it.
    const WRITTEN_BY_PAGE = [
      'today-figures', 'today-loading', 'scene-caption', 'working-list',
      'soft-number', 'epoch-note', 'second-figures', 'drift-figure',
      'rising-figures', 'rising-note', 'coming-figures', 'coming-note',
      'corner-figures', 'corner-verdict', 'steepest-figures', 'steepest-note',
      'today-heading'
    ];
    const strays = await moved.evaluate((ids) => ids.filter((id) => {
      const node = document.getElementById(id);
      return node && /Paris/.test(node.textContent);
    }), WRITTEN_BY_PAGE);
    check(strays.length === 0,
      strays.length === 0
        ? 'no line this page writes names a city the tower has left'
        : `these mounts still name Paris while the tower stands at ${far.name}: ${strays.join(', ')}`);
  }

  await moved.close();
  await browser.close();

  if (problems.length) {
    console.error(`\nFAIL — ${problems.length} of the day's claims did not hold.`);
    process.exit(1);
  }
  console.log('\nPASS — the room draws the day of the place the tower stands in, and the');
  console.log('cold record below it is unmoved by where the tower is standing.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
