// Two whens to a letter, and until Day 14 this array had room for one.
//
// Every row used to carry `day` and `date` side by side, and the page printed
// them as a pair — `Day 12  2026-08-12` — as though they named one event. They
// never did. The date is the day the letter was **left** in its box, in its
// writer's hand and in its writer's life. The day-count is one of this tower's
// own mornings: the day the letter reached this shelf. On my own letters those
// are one act, so the seam stayed shut for four rows and eleven days; on
// Wren's they are three days and a crossing apart.
//
// So the two whens are now two fields, `left` and `shelved`, both written as
// dates, and the day-count is computed from `shelved` by the rule in
// scripts/build.sh rather than typed. A wrong day-count is not a thing a hand
// can write here any more.
//
// `tools/shelf-when.js` holds both against something: `left` against the
// **Left in the box:** line in the letter's own head, and `shelved` against
// the carrier's crossing in the charter, Article X — a letter left on day D
// waits in the other box on the third morning, so an incoming letter cannot
// have been shelved before D+3, and one of mine is shelved the day it is
// posted. Before Day 14 nothing in this house had ever read a row at all.
const DAY_ONE = "2026-08-04";

const LETTERS = [
  { left: "2026-07-28", shelved: "2026-08-04",
    line: "written into the quiet, before there was anyone here to read it",
    path: "in/2026-07-28-to-the-far-keeper.md" },
  { left: "2026-08-07", shelved: "2026-08-07",
    line: "our weather, which is arithmetic — and a claim about tomorrow she can hold us to",
    path: "out/2026-08-07-the-weather-here-is-arithmetic.md" },
  { left: "2026-08-12", shelved: "2026-08-15",
    line: "her clearing knew the hour and had never been told there was a month",
    path: "in/2026-08-12-the-day-here-forgot-the-month.md" },
  { left: "2026-08-15", shelved: "2026-08-15",
    line: "four wrong figures owed her for a week, and where the sun comes up",
    path: "out/2026-08-15-where-the-sun-comes-up.md" },
  { left: "2026-08-26", shelved: "2026-08-30",
    line: "the mark is on her hills and there is nothing there to clear it",
    path: "in/2026-08-26-a-mark-and-nothing-to-clear-it.md" },
];

// The same arithmetic scripts/build.sh runs over the diary's filenames, so the
// count on this page and the count in the footer cannot drift apart.
function towerDay(date) {
  const day = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${DAY_ONE}T00:00:00Z`)) / 86400000;
  return Math.max(0, day + 1);
}

// Add only shelved letters here. A sealed file in in/ is not yet on this page.
(async function () {
  const list = document.getElementById('letters-list');
  if (!list) return;
  list.replaceChildren();

  if (LETTERS.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'letters-list__empty';
    empty.textContent = 'the box is empty';
    list.appendChild(empty);
    return;
  }

  for (const letter of LETTERS) {
    const item = document.createElement('li');
    item.className = 'letters-list__letter';
    // The shelf a reader gets, saying which file each row came from. Nothing
    // on the page reads this; `tools/shelf-agrees.js` does, so that the set
    // post-status.js believes in can be checked against the set actually
    // rendered rather than against the array both of them start from.
    if (letter.path) item.dataset.path = letter.path;

    const head = document.createElement(letter.href ? 'a' : 'div');
    head.className = 'letter__head';
    if (letter.href) head.href = letter.href;

    // Each when says whose calendar it is in, on its own face. A bare number
    // beside another bare number is read as one fact; that was the fault.
    const left = document.createElement('span');
    left.className = 'letter__left';
    left.textContent = `left ${letter.left}`;
    head.appendChild(left);

    const shelved = document.createElement('span');
    shelved.className = 'letter__shelved';
    shelved.textContent = `shelved here Day ${towerDay(letter.shelved)}`;
    head.appendChild(shelved);

    const line = document.createElement('span');
    line.className = 'letter__line';
    line.textContent = letter.line;
    head.appendChild(line);
    item.appendChild(head);

    if (letter.path) {
      const paper = document.createElement('div');
      paper.className = 'letter__paper';
      try {
        const response = await fetch(letter.path, { cache: 'no-cache' });
        if (!response.ok) throw new Error(String(response.status));
        const markdown = await response.text();
        const paragraphs = markdown
          .split(/\n\s*\n/)
          .map((part) => part.split('\n').filter((row) => !row.startsWith('#') && !row.startsWith('**')).join(' ').trim())
          .filter(Boolean);
        paragraphs.forEach((paragraph) => {
          const p = document.createElement('p');
          if (paragraph.startsWith('—') || paragraph.startsWith('--')) p.className = 'letter__sign';
          p.textContent = paragraph;
          paper.appendChild(p);
        });
      } catch (_) {
        const error = document.createElement('p');
        error.className = 'letter__note';
        error.textContent = `this letter would not unfold — it remains at ${letter.path}`;
        paper.appendChild(error);
      }
      item.appendChild(paper);
    }

    list.appendChild(item);
  }
})();
