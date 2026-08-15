const LETTERS = [
  { day: 1, date: "2026-07-28", line: "written into the quiet, before there was anyone here to read it",
    path: "in/2026-07-28-to-the-far-keeper.md" },
  { day: 4, date: "2026-08-07", line: "our weather, which is arithmetic — and a claim about tomorrow she can hold us to",
    path: "out/2026-08-07-the-weather-here-is-arithmetic.md" },
  { day: 12, date: "2026-08-12", line: "her clearing knew the hour and had never been told there was a month",
    path: "in/2026-08-12-the-day-here-forgot-the-month.md" },
  { day: 12, date: "2026-08-15", line: "four wrong figures owed her for a week, and where the sun comes up",
    path: "out/2026-08-15-where-the-sun-comes-up.md" },
];

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

    const day = document.createElement('span');
    day.className = 'letter__day';
    day.textContent = `Day ${letter.day}`;
    head.appendChild(day);

    const date = document.createElement('span');
    date.className = 'letter__date';
    date.textContent = letter.date;
    head.appendChild(date);

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
