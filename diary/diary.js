// Renders diary/manifest.json newest first. The Markdown files remain canonical.
(async function () {
  const list = document.getElementById('diary-list');
  if (!list) return;

  let entries = [];
  try {
    const response = await fetch('manifest.json', { cache: 'no-cache' });
    if (response.ok) entries = await response.json();
  } catch (_) {
    // The visible empty state below is more useful than a console-only failure.
  }

  list.replaceChildren();
  if (!Array.isArray(entries) || entries.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'diary-list__empty';
    empty.textContent = 'no entries yet';
    list.appendChild(empty);
    return;
  }

  entries
    .filter((entry) => entry.kind === 'daily')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'diary-list__entry';

      const link = document.createElement('a');
      link.href = entry.path || '#';

      const day = document.createElement('span');
      day.className = 'entry__day';
      day.textContent = Number.isInteger(entry.day) ? `Day ${entry.day}` : entry.date;
      link.appendChild(day);

      const title = document.createElement('span');
      title.className = 'entry__title';
      title.textContent = entry.title || (entry.date === '0000-00-00' ? 'day zero' : entry.date);
      link.appendChild(title);

      item.appendChild(link);
      list.appendChild(item);
    });
})();
