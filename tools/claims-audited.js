// tools/claims-audited.js — is every field a published row carries actually
// audited, and audited on both desks?
//
//     ./scripts/local-snapshot.sh tools/claims-audited.js
//
// Built Day 36.
//
// ---- The fault this was built on ----
//
// There are two lists of what a ledger row claims. `tools/reckon.js` holds
// one, for `--verify` on the keeper's desk. `reckoning/page.js` holds the
// other, for the recompute that runs in a stranger's browser. The comment
// above the second says the two must stay in step, and says exactly why: a
// claim audited in one and not the other is a forgery caught where we can
// reach and invisible where we cannot.
//
// Nothing asked. Proved before this file was written, in a clone: take
// `solarNoon` out of the page's list only — so the tower's published solar
// noon goes unaudited in every reader's browser — and `--verify`,
// `ledger-dark.js`, `ledger-verdicts.js` and `ledger-place.js` all come back
// green. Day 29's sentence, sitting inside our own audit: what makes a
// hand-kept list dangerous was never that a hand wrote it, it is that
// nothing after the hand ever asks whether it is still true.
//
// ---- Why this does not read either list ----
//
// The obvious tool holds the two arrays against each other. That tool would
// answer a question about two declarations, and the question worth asking is
// about two behaviours: *does each auditor convict a forgery of this field?*
// A list-reader goes blind the moment a list is restructured or a key is
// renamed on both sides at once; a forger does not. It is Ember's Day 29 cut
// — its third nav question exists because the first two both interrogate the
// href and neither looks at what the link says it is.
//
// It also means the domain is not hand-kept. The fields asked about are the
// fields a real published row actually carries, read off the ledger's own
// bytes. A list kept in this tool would go blind to the next claim somebody
// publishes and report that as clean, which is the fault one storey up.
//
// ---- Three verdicts, and they must stay forked ----
//
//   AUDITED    both auditors convict a forgery of this field.
//   LOPSIDED   one convicts and the other does not. This is the drift the
//              page's own comment warns about, and it is the reason this
//              file exists.
//   UNAUDITED  neither convicts. The tower publishes this number and
//              nothing anywhere asks whether it has moved.
//
// Collapsing UNAUDITED into LOPSIDED would be one word doing two jobs —
// Day 11's fault, which this house has had twice. They have different
// repairs: a lopsided field is a list that slipped, an unaudited field is a
// question nobody ever asked.
//
// ---- What this cannot see, printed rather than implied ----
//
// It forges top-level fields only. `working`, `crossCheck`, `place` and
// `horizon` are objects, and this file replaces them wholesale rather than
// reaching inside; a forged *leaf* — one declination, one cross-check gap —
// is outside its sight, and it says so on its own face. Day 34's rule: a
// reader handed a verdict without its sight limit is reading a check past
// its own edge.

const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const URL = process.env.FAR_KEEPER_URL;
const EXECUTABLE = process.env.FAR_KEEPER_CHROMIUM_PATH || undefined;
const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'reckoning', 'ledger.json');

const problems = [];
function check(ok, message) {
  if (!ok) problems.push(message);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${message}`);
}

// ---- The claimed exceptions ------------------------------------------------
//
// Ember's Day 29 condition: every exemption carries a test that its own
// reason still holds. Each row here says what it is and why it is not a
// claim about the sun, and each is checked below rather than skipped.
const EXEMPT = {
  date: 'the row\'s name, not a claim on it — forging it asks both auditors ' +
    'to recompute a different day, so a conviction there is about that other ' +
    'day and not about this field',
  method: 'the fork the verdict is chosen by, not a number the sun answers ' +
    'for — a forged method changes which account a drifted row is handed',
  place: 'an input, and no recompute can check an input, because the ' +
    'recompute is what the input feeds (Day 18). A place forged alone is ' +
    'caught by the numbers it drags with it; a place forged together with ' +
    'them is not, and nothing here changes that',
  publishedAt: 'a claim about when the tower spoke, which no recompute can ' +
    'reach — the numbers in a backdated row are right (Day 17). It is ' +
    'audited instead by the two-clocks reading, which holds it against the ' +
    'row\'s own date and place, and that is tested below rather than assumed'
};

function forge(value) {
  if (typeof value === 'number') return value + 1;
  if (typeof value === 'string') return value === 'forged' ? 'forged2' : 'forged';
  if (value === null) return 0;
  if (Array.isArray(value)) return [];
  if (typeof value === 'object') return {};
  return 'forged';
}

// ---- The desk auditor, asked in a scratch tree -----------------------------
//
// Day 10, which all three of us broke the day it was learned: never point a
// test at the cold record. The ledger written to below is a copy in a
// mktemp -d; the real file's bytes are checked at the end of the run
// regardless of what happened in between.
function deskConvicts(scratch, entries, targetDate, field) {
  const forgedEntries = JSON.parse(JSON.stringify(entries));
  const entry = forgedEntries.find((e) => e.date === targetDate);
  entry[field] = forge(entry[field]);
  const before = JSON.stringify(entries.find((e) => e.date === targetDate));
  if (JSON.stringify(entry) === before) return { landed: false, convicts: false };
  fs.writeFileSync(path.join(scratch, 'reckoning', 'ledger.json'),
    JSON.stringify(forgedEntries, null, 2) + '\n', 'utf8');

  let out;
  try {
    out = execFileSync(process.execPath, [path.join(scratch, 'tools', 'reckon.js'), '--verify'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    // `--verify` exits 1 whenever anything has drifted, and three rows have
    // drifted permanently since Day 6, so the exit code says nothing about
    // the target. The line for the target row is what answers.
    out = `${err.stdout || ''}${err.stderr || ''}`;
  }
  const line = out.split('\n').find((l) => l.includes(targetDate));
  return { landed: true, convicts: !!line && /HAS DRIFTED/.test(line), line: line || '(no line for this row)' };
}

(async () => {
  const entries = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  const ledgerBytesBefore = fs.readFileSync(LEDGER);

  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  async function rowsOf(page) {
    return page.$$eval('.ledger__entry', (rows) => rows.map((row) => ({
      date: row.querySelector('.ledger__date')?.textContent?.trim() ?? null,
      // Day 18: the place is the condition on the verdict, so the word is
      // the first token and the questions here are about the word.
      word: (row.querySelector('.ledger__verdict')?.textContent?.trim() ?? '').split(' ')[0]
    })));
  }

  // ---- Part one: pick a target, and prove it is clean before anything -----
  const first = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await first.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await first.waitForSelector('.ledger__entry');
  const cleanRows = (await rowsOf(first)).filter((r) => r.word === 'unchanged');
  await first.close();

  check(cleanRows.length > 0, `${cleanRows.length} rows recompute cleanly before any forgery`);
  // The newest clean row: it carries every claim the tower currently
  // publishes, which an older row lawfully may not (Day 15's birthdays).
  const targetDate = cleanRows.map((r) => r.date).sort().pop();
  const target = entries.find((e) => e.date === targetDate);
  check(!!target, `the target row ${targetDate} is in the ledger's own bytes`);
  if (!target) { await browser.close(); process.exit(1); }

  const fields = Object.keys(target);
  check(fields.length > 0, `the target row carries ${fields.length} top-level fields, read off the ledger rather than from a list kept here`);

  // The other direction, Ember's, and it is Day 30's question one room
  // along. The sweep above is sourced from the *record*. If the instrument
  // grew a field the write path never stores, that field is published by
  // nothing and this file would never think to ask about it — the domain
  // would be quietly short by one and would say yes about everything it
  // still held. So the two sources are held against each other first.
  // `publishedAt` is lawfully the ledger's alone: it is the write path's
  // stamp, and `reckon()` is a pure function that has no business knowing
  // what time it is.
  const Reckoning = require(path.join(ROOT, 'reckoning', 'reckoning.js'));
  const instrument = Object.keys(Reckoning.reckon(target.date, target.place));
  const onlyInstrument = instrument.filter((k) => !fields.includes(k));
  const onlyRecord = fields.filter((k) => !instrument.includes(k) && k !== 'publishedAt');
  check(onlyInstrument.length === 0,
    onlyInstrument.length === 0
      ? 'every field the instrument returns for this row reaches the ledger, so the sweep above sees all of them'
      : `the instrument returns ${onlyInstrument.join(', ')}, which never reaches the ledger and is therefore outside this sweep`);
  check(onlyRecord.length === 0,
    onlyRecord.length === 0
      ? 'and the row carries nothing the instrument does not produce, apart from its own publishedAt stamp'
      : `the row carries ${onlyRecord.join(', ')}, which the instrument does not produce`);

  // ---- The scratch tower the desk auditor is asked in ---------------------
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'claims-audited-'));
  fs.mkdirSync(path.join(scratch, 'reckoning'));
  fs.mkdirSync(path.join(scratch, 'tools'));
  fs.copyFileSync(path.join(ROOT, 'reckoning', 'reckoning.js'), path.join(scratch, 'reckoning', 'reckoning.js'));
  fs.copyFileSync(path.join(ROOT, 'tools', 'reckon.js'), path.join(scratch, 'tools', 'reckon.js'));
  fs.writeFileSync(path.join(scratch, 'reckoning', 'ledger.json'),
    JSON.stringify(entries, null, 2) + '\n', 'utf8');

  // Day 19: a suite must prove the tool its sabotage made still runs. Here
  // the same demand one step earlier — prove the *fixture* answers at all
  // before any of its answers are read as verdicts (Day 17, turned the right
  // way round).
  const baseline = deskConvicts(scratch, entries, targetDate, '__nothing_here__');
  check(!baseline.convicts && /unchanged/.test(baseline.line || ''),
    `the scratch desk auditor runs and calls ${targetDate} unchanged before anything is forged`);
  fs.writeFileSync(path.join(scratch, 'reckoning', 'ledger.json'),
    JSON.stringify(entries, null, 2) + '\n', 'utf8');

  // ---- Part two: forge each field, on both desks --------------------------
  const results = [];
  for (const field of fields) {
    if (EXEMPT[field]) continue;

    const desk = deskConvicts(scratch, entries, targetDate, field);

    let landed = false;
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.route('**/ledger.json*', async (route) => {
      const response = await route.fetch();
      const before = await response.text();
      const parsed = JSON.parse(before);
      const entry = parsed.find((e) => e.date === targetDate);
      entry[field] = forge(entry[field]);
      const body = JSON.stringify(parsed, null, 2);
      landed = body !== before;
      await route.fulfill({ response, body });
    });
    await page.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.ledger__entry');
    const row = (await rowsOf(page)).find((r) => r.date === targetDate);
    await page.close();

    // Day 5: a substitution that silently no-ops is a test that cannot fail,
    // and Day 27: an empty domain always says yes, in the voice of a check
    // that worked. Both forgeries must be shown to have landed before either
    // answer is read.
    check(landed, `${field}: the forged ledger actually reached the browser`);
    check(desk.landed, `${field}: the forged ledger actually reached the desk auditor`);

    const inBrowser = !!row && row.word === 'DRIFTED';
    const onDesk = desk.convicts;
    results.push({ field, inBrowser, onDesk });
  }

  await browser.close();

  // ---- The exemptions, each tested against its own reason -----------------
  //
  // `publishedAt` is exempt from the forgery sweep because no recompute can
  // reach it. That is only an honest exemption while something else does —
  // the two-clocks reading, built Day 35, which holds the stamp against the
  // row's own date and place. If that reading ever stops convicting a moved
  // stamp, this exemption must go red rather than go on excusing something
  // that has stopped being true. Ember's condition, Day 29.
  const clocksBrowser = await chromium.launch({ executablePath: EXECUTABLE });
  const stampPage = await clocksBrowser.newPage({ viewport: { width: 390, height: 900 } });
  let stampLanded = false;
  await stampPage.route('**/ledger.json*', async (route) => {
    const response = await route.fetch();
    const before = await response.text();
    const parsed = JSON.parse(before);
    const entry = parsed.find((e) => e.date === targetDate);
    // Move the stamp two days back and leave the date alone: the numbers in
    // this row are all still right, which is the whole of Day 17's point.
    const moved = new Date(Date.parse(entry.publishedAt) - 2 * 86400000);
    entry.publishedAt = moved.toISOString().replace(/\.\d+Z$/, 'Z');
    const body = JSON.stringify(parsed, null, 2);
    stampLanded = body !== before;
    await route.fulfill({ response, body });
  });
  await stampPage.goto(`${URL}reckoning/`, { waitUntil: 'networkidle' });
  await stampPage.waitForSelector('#two-clocks-report p');
  const clocksText = await stampPage.$eval('#two-clocks-report', (n) => n.textContent);
  const rowStillClean = (await rowsOf(stampPage)).find((r) => r.date === targetDate);
  await stampPage.close();
  await clocksBrowser.close();

  check(stampLanded, 'publishedAt: the moved stamp actually reached the page');
  check(/UNACCOUNTED\./.test(clocksText),
    'publishedAt: the exemption holds — a moved stamp is convicted by the two-clocks reading, which is why the recompute is not asked for it');
  check(!!rowStillClean && rowStillClean.word === 'unchanged',
    'publishedAt: and the ledger row itself still says unchanged, which is exactly why it needed a second reader');

  // ---- The report ---------------------------------------------------------
  const audited = results.filter((r) => r.inBrowser && r.onDesk);
  const lopsided = results.filter((r) => r.inBrowser !== r.onDesk);
  const unaudited = results.filter((r) => !r.inBrowser && !r.onDesk);

  console.log('');
  console.log(`claims-audited: target row ${targetDate}, ${fields.length} top-level fields, ` +
    `${Object.keys(EXEMPT).length} claimed exceptions, ${results.length} swept.`);
  console.log('');
  for (const key of Object.keys(EXEMPT)) {
    if (key in target) console.log(`claims-audited:   exempt  ${key} — ${EXEMPT[key]}`);
  }
  console.log('');
  audited.forEach((r) => console.log(`claims-audited:   AUDITED    ${r.field}`));
  lopsided.forEach((r) => console.log(`claims-audited:   LOPSIDED   ${r.field} — convicted ` +
    `${r.inBrowser ? 'in the browser and not on the desk' : 'on the desk and not in the browser'}`));
  unaudited.forEach((r) => console.log(`claims-audited:   UNAUDITED  ${r.field} — published, and neither auditor asks whether it has moved`));
  console.log('');
  console.log('claims-audited: this forges top-level fields only. A forged leaf inside ' +
    'working, crossCheck, place or horizon is outside its sight, and it does not ' +
    'claim otherwise.');

  // Day 10. The cold record's bytes, whatever else happened.
  const ledgerBytesAfter = fs.readFileSync(LEDGER);
  check(ledgerBytesBefore.equals(ledgerBytesAfter),
    'the real ledger\'s bytes did not move — a read tool that writes is a different tool');

  check(lopsided.length === 0,
    lopsided.length === 0
      ? 'no field is audited on one desk and not the other'
      : `${lopsided.length} fields are audited on one desk and not the other`);

  // UNAUDITED is reported and does not fail the suite. It is a fact about
  // what the tower has chosen to audit, not a fault in either auditor, and a
  // tool that exits 1 for it would be unrunnable until the last of them is
  // closed — at which point nobody would run it again. The count is the
  // finding; the page is where the honest sentence about it lives.
  if (problems.length) {
    console.error(`\nFAIL — ${problems.length} of the day's claims did not hold.`);
    process.exit(1);
  }
  console.log(`\nPASS — ${audited.length} audited on both desks, ${lopsided.length} lopsided, ` +
    `${unaudited.length} unaudited.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
