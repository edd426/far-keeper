#!/usr/bin/env node
//
// tools/shelf-agrees.js — does the shelf a reader sees match the shelf the
// tower believes in?
//
// Run it through the snapshot harness, which wants the script in /tmp:
//
//     cp tools/shelf-agrees.js /tmp/shelf-agrees.js
//     ./scripts/local-snapshot.sh /tmp/shelf-agrees.js
//
// Why this exists. `tools/post-status.js` decides whether there is sealed
// post by asking which letters are shelved, and it answers from `letters.js`.
// The letters page answers the same question, for a reader, from the same
// file — but by a different road: the browser evaluates the module and then
// fetches each letter and renders it. Two answers from one source is not one
// answer. Anything that parts them — a letter that will not fetch, an entry
// the render loop drops, a row that never reaches the page — leaves the tool
// confident about a shelf no reader has.
//
// So this asks both and sets them side by side. It is the only check here
// that looks at the shelf a stranger actually gets.
//
// It reports three things, and they are three different faults:
//   MISSING   — the tool believes a letter is shelved; the page has no row.
//   EXTRA     — the page shows a row the tool does not know about.
//   UNFOLDED  — the row is there and the letter would not open in it. The
//               page says so honestly to the reader; post-status.js does not
//               see it. Not because its answers are wrong — a path that
//               exists on disk answers every question that tool asks, and
//               answers it correctly — but because whether the letter has
//               anything in it is a question it was never built to ask.

const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const url = process.env.FAR_KEEPER_URL;
if (!url) {
  console.error('shelf-agrees: FAR_KEEPER_URL is unset — run this through scripts/local-snapshot.sh');
  process.exit(2);
}
// local-snapshot.sh's own contract (see its header) is to copy this script
// to /tmp before running it, so __dirname here is /tmp, not tools/ — using
// it to derive the repo root would silently point at the wrong tree. The
// harness does `cd "$REPO_ROOT"` before it ever runs the test script and
// never cds away, so process.cwd() is the one path this file can trust.
const repoRoot = process.cwd();

function believedShelf() {
  const out = execFileSync('node', ['tools/post-status.js', '--self', 'gnomon', '--shelf'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('shelf: '))
    .map((line) => line.slice('shelf: '.length));
}

(async () => {
  let believed;
  try {
    believed = believedShelf();
  } catch (error) {
    // post-status.js exits non-zero when it refuses to answer at all. That is
    // a real result, not a broken test: report it and fail.
    console.error('shelf-agrees: post-status.js would not name the shelf —');
    console.error(String(error.stdout || '').trim());
    console.error(String(error.stderr || '').trim());
    process.exit(1);
  }

  const browser = await chromium.launch({
    executablePath: process.env.FAR_KEEPER_CHROMIUM_PATH || undefined
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  await page.goto(new URL('letters/', url).href, { waitUntil: 'networkidle' });

  const rendered = await page.evaluate(() => {
    const list = document.getElementById('letters-list');
    if (!list) return null;
    return Array.from(list.querySelectorAll('.letters-list__letter')).map((item) => ({
      path: item.dataset.path || null,
      unfolded: !item.querySelector('.letter__note'),
      paragraphs: item.querySelectorAll('.letter__paper p').length
    }));
  });

  await browser.close();

  const problems = [];
  if (rendered === null) {
    problems.push('the letters page has no #letters-list at all');
  }
  const rows = rendered || [];
  const renderedPaths = rows.map((row) => row.path).filter(Boolean);

  for (const wanted of believed) {
    if (!renderedPaths.includes(wanted)) problems.push(`MISSING ${wanted} — believed shelved, no row on the page`);
  }
  for (const got of renderedPaths) {
    if (!believed.includes(got)) problems.push(`EXTRA ${got} — on the page, unknown to post-status.js`);
  }
  for (const row of rows) {
    if (!row.unfolded) problems.push(`UNFOLDED ${row.path} — the row is there and the letter would not open`);
    else if (row.path && row.paragraphs === 0) problems.push(`UNFOLDED ${row.path} — the row opened onto nothing`);
  }
  for (const error of consoleErrors) problems.push(`PAGE ERROR ${error}`);

  // A check that can pass on an empty shelf is a check that passes when the
  // page is broken flat. If the tower ever truly has no shelved letters this
  // line must be revisited by a hand, deliberately, and not before.
  if (believed.length === 0) problems.push('the tower believes nothing is shelved — that has never been true here');

  console.log(`shelf-agrees: post-status.js names ${believed.length}; the page renders ${renderedPaths.length}`);
  for (const wanted of believed) console.log(`shelf-agrees:   believed ${wanted}`);
  for (const row of rows) console.log(`shelf-agrees:   rendered ${row.path} (${row.paragraphs} paragraphs)`);

  if (problems.length) {
    for (const problem of problems) console.error(`shelf-agrees: ${problem}`);
    console.error('shelf-agrees: FAIL — the shelf the tower believes in is not the shelf a reader gets');
    process.exit(1);
  }
  console.log('shelf-agrees: PASS — same shelf, both roads, every letter opened');
})();
