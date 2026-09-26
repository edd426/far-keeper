// gallery.js — every city the tower has stood in, drawn, in the order stood.
//
// Day 54, from the board: `messages/open/2026-09-23-the-skyline-answered-a-
// gallery-and-the-day-made-readable.md`, Evan's second ask. The front page
// can only ever show the silhouette of the city the tower stands in today, so
// every other drawing in `skyline.js` was kept and never seen. This room shows
// them together. It is a picture room and measures nothing (Article V, as
// amended 2026-08-30); the same line as `skyline.js` holds here — the shape
// may come from the library, the label may not.
//
// Three things are deliberately NOT kept here, because a second copy of each
// is a second place for it to go wrong (Day 19, Day 29):
//
//   - **the tower art.** It is read off the front page itself, the same way
//     `skyline.js` reads it off its own mount. If the front page cannot be
//     fetched, the room says so and draws nothing; it does not fall back to a
//     copy that would quietly stop matching.
//   - **the silhouettes.** `skyline.js` is loaded and `compose()` lays each one
//     behind the tower exactly as the front page does, so a silhouette the
//     front page would refuse (a clipped glyph) is refused here too.
//   - **the list of places and their dates.** No hand-kept itinerary. The
//     order and the dates are read from `reckoning/ledger.json`, the cold
//     record, and the room says outright that that is what they are: the first
//     and last day the tower wrote down in each city, which is not quite the
//     same as the days it stood there: Anchorage's first morning published
//     nothing (Day 34), and the ledger's first row is Day 3's. A date on this
//     page claims only what the ledger holds.
//
// The one place the ledger cannot know yet is the one the tower arrived in
// this morning, before its first row is written. `STANDING` knows it, so a
// standing place with no row is added at the end under `since`, and said so.
//
// `data-city` and `data-skyline` on each picture are read by
// `tools/gallery-room.js` and by nothing on the page.
(function () {
  'use strict';

  var list = document.getElementById('gallery-list');
  if (!list) return;

  function say(text) {
    list.innerHTML = '';
    var li = document.createElement('li');
    li.className = 'gallery-list__loading';
    li.textContent = text;
    list.appendChild(li);
  }

  var sky = window.Skyline;
  var reckoning = window.Reckoning;
  if (!sky || !reckoning) {
    say('The drawings could not be loaded, so there is nothing to show.');
    return;
  }

  function stoodIn(rows) {
    var places = [];
    var byName = {};
    rows.slice().sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    }).forEach(function (row) {
      var name = row && row.place && row.place.name;
      if (!name) return;
      if (!byName[name]) {
        byName[name] = { name: name, first: row.date, last: row.date, rows: 0 };
        places.push(byName[name]);
      }
      byName[name].last = row.date;
      byName[name].rows += 1;
    });
    var standing = reckoning.STANDING;
    if (standing && standing.place && !byName[standing.place.name]) {
      places.push({ name: standing.place.name, since: standing.since, rows: 0 });
    }
    return places;
  }

  function sceneOf(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var mount = doc.getElementById('scene-mount');
    if (!mount) return null;
    return {
      art: mount.textContent.replace(/\n$/, '').split('\n'),
      label: (mount.getAttribute('aria-label') || '').replace(/\.$/, '')
    };
  }

  function datesLine(place, standingName) {
    var here = place.name === standingName;
    if (!place.rows) {
      return 'arrived ' + place.since + '. Standing here now; the ledger has ' +
        'no row from here yet.';
    }
    var span = place.first === place.last
      ? 'one ledger row, ' + place.first
      : 'ledger rows from ' + place.first + ' to ' + place.last +
        ' (' + place.rows + ')';
    return span + (here ? '. Standing here now.' : '.');
  }

  function figure(place, scene, standingName) {
    var li = document.createElement('li');
    li.className = 'gallery-item';

    var h = document.createElement('h2');
    h.textContent = place.name;
    li.appendChild(h);

    var drawn = Object.prototype.hasOwnProperty.call(sky.SKYLINES, place.name)
      ? sky.SKYLINES[place.name] : null;
    var composed = drawn ? sky.compose(scene.art, drawn) : null;

    var pre = document.createElement('pre');
    pre.className = 'scene';
    pre.setAttribute('role', 'img');
    pre.setAttribute('data-city', place.name);
    if (composed) {
      pre.textContent = composed.join('\n') + '\n';
      pre.setAttribute('data-skyline', place.name);
      pre.setAttribute('aria-label', scene.label +
        ', with the low silhouette of ' + place.name + ' behind it. The city ' +
        'is drawn from memory, not from sight.');
    } else {
      pre.textContent = scene.art.join('\n') + '\n';
      pre.setAttribute('data-skyline', drawn ? 'clipped' : 'none');
      pre.setAttribute('aria-label', scene.label + '. No skyline has been ' +
        'drawn for ' + place.name + ' yet.');
    }
    li.appendChild(pre);

    var p = document.createElement('p');
    p.className = 'gallery-dates';
    p.textContent = datesLine(place, standingName);
    li.appendChild(p);

    if (!composed) {
      var gap = document.createElement('p');
      gap.className = 'gallery-dates';
      gap.textContent = drawn
        ? 'Its drawing does not fit behind the tower, so it is not shown.'
        : 'Not drawn yet. A city is drawn the morning after the tower arrives.';
      li.appendChild(gap);
    }
    return li;
  }

  Promise.all([
    fetch('../index.html', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('front page ' + r.status);
      return r.text();
    }),
    fetch('../reckoning/ledger.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('ledger ' + r.status);
      return r.json();
    })
  ]).then(function (got) {
    var scene = sceneOf(got[0]);
    if (!scene) {
      say('The tower could not be found on the front page, so nothing is drawn.');
      return;
    }
    var rows = Array.isArray(got[1]) ? got[1] : [];
    var places = stoodIn(rows);
    if (!places.length) {
      say('The ledger names no places, so there is nothing to show.');
      return;
    }
    var standingName = reckoning.STANDING && reckoning.STANDING.place &&
      reckoning.STANDING.place.name;
    list.innerHTML = '';
    places.forEach(function (place) {
      list.appendChild(figure(place, scene, standingName));
    });
  }).catch(function (error) {
    say('The pictures could not be laid out (' + error.message + '), so ' +
      'nothing is shown rather than something partial.');
  });
})();
