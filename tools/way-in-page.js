// tools/way-in-page.js — the reckoning room's way in, in a real browser.
//
//   ./scripts/local-snapshot.sh tools/way-in-page.js
//
// Day 56. `tools/way-in.js` reads the file and asks whether the opening's
// links name every room section once. What it cannot see is the morning: the
// pledge section is hidden when no word is outstanding, and a visible link to
// a hidden heading is a door onto nothing. `page.js`'s `matchWayInToPledge`
// hides the clause with the section. This suite checks it both ways, at three
// widths, and forges "no pledge" by setting `STANDING.pledge = null` on the
// wire after the module loads, so no needle here names a city (Day 24: a
// fixture that names where you are carries an expiry with no date on it).
//
// Made to fail on the morning it was written: strip the
// `matchWayInToPledge()` call from page.js on the wire and six cases go red,
// the pledge clause and the link count at each width.
const { chromium } = require('playwright');
const URL = process.env.FAR_KEEPER_URL;
let fails = 0; const ok=(c,m)=>{console.log((c?'ok    ':'FAIL  ')+m); if(!c) fails++;};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.FAR_KEEPER_CHROMIUM_PATH });
  // 1. As the tower stands (KEPT): clause shows, every link lands on a visible heading.
  for (const w of [375, 390, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(URL + 'reckoning/'); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const way = document.getElementById('way-in');
      const clause = document.getElementById('way-in-pledge');
      const links = [...way.querySelectorAll('a')].filter(a => a.offsetParent !== null);
      const dead = links.filter(a => { const t = document.getElementById(a.getAttribute('href').slice(1)); return !t || t.offsetParent === null; }).map(a => a.getAttribute('href'));
      const top = way.getBoundingClientRect().top + scrollY;
      return { visibleLinks: links.length, dead, clauseHidden: clause.hidden,
        scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth, top };
    });
    ok(r.visibleLinks === 12, w + 'px: 12 visible links in the way in (' + r.visibleLinks + ')');
    ok(r.dead.length === 0, w + 'px: every visible link lands on a visible heading (' + r.dead.join(',') + ')');
    ok(r.clauseHidden === false, w + 'px: the pledge clause shows while the pledge section does');
    ok(r.scroll <= 0, w + 'px: no sideways scroll (' + r.scroll + ')');
    ok(r.top < 900 * 2, w + 'px: the way in is within the first two screens (top ' + Math.round(r.top) + ')');
    if (w === 390) await p.screenshot({ path: process.env.FAR_KEEPER_OUTDIR + '/way-in-390.png' });
    await p.close();
  }
  // 2. Forged: no pledge outstanding. The section hides; the clause must too.
  const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  let landed = false;
  await p.route('**/reckoning.js*', async (route) => {
    const res = await route.fetch(); const before = await res.text();
    const body = before + '\n;window.Reckoning.STANDING.pledge = null;\n';
    landed = body !== before; await route.fulfill({ response: res, body });
  });
  await p.goto(URL + 'reckoning/'); await p.waitForTimeout(1500);
  ok(landed && await p.evaluate(() => window.Reckoning.STANDING.pledge === null), 'forgery landed: the pledge is null in the page');
  const r = await p.evaluate(() => ({ sec: document.getElementById('pledge-section').hidden,
    clause: document.getElementById('way-in-pledge').hidden,
    dead: [...document.querySelectorAll('#way-in a')].filter(a => a.offsetParent !== null)
      .filter(a => { const t = document.getElementById(a.getAttribute('href').slice(1)); return !t || t.offsetParent === null; }).length }));
  ok(r.sec === true, 'with no pledge the section is hidden (the forgery took)');
  ok(r.clause === true, 'with no pledge the way-in clause is hidden too');
  ok(r.dead === 0, 'and no visible link in the way in lands on a hidden heading');
  await b.close();
  console.log(fails ? 'FAIL — ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
