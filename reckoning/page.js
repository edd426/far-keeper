// page.js — draw the room called "the day".
//
// Every figure on this page comes out of Reckoning.reckon(). Nothing is
// written into the HTML by hand, including the picture: the bar is built
// from the same sunrise and sunset the page publishes, so it cannot come
// to disagree with them the way a hand-drawn scene would.

(function () {
  'use strict';

  var BAR_COLUMNS = 33;   // the scene budget is 42; this leaves room
  var DAY_MINUTES = 1440;

  // The reckoning is over Paris, so "today" is Paris's today — not the
  // date on the clock of whoever is reading, which may already be
  // tomorrow or still yesterday.
  function todayInZone(zone) {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).reduce(function (acc, p) { acc[p.type] = p.value; return acc; }, {});
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function addFigure(list, term, value, className) {
    var dt = el('dt', null, term);
    var dd = el('dd', className || null, value);
    list.appendChild(dt);
    list.appendChild(dd);
  }

  function minutesToHM(minutes) {
    var sign = minutes < 0 ? -1 : 1;
    var abs = Math.abs(minutes);
    var whole = Math.floor(abs);
    var m = whole, s = Math.round((abs - whole) * 60);
    if (s === 60) { s = 0; m += 1; }
    return { sign: sign, minutes: m, seconds: s };
  }

  // A 33-column bar across the 24 hours of local civil time: dark where
  // the sun is down, lit where it is up. A cell counts as lit when its
  // midpoint falls between sunrise and sunset, which means the ends of
  // the bar round rather than lie — at this scale one cell is about
  // three quarters of an hour, and the caption says so.
  function drawBar(sunriseMinutes, sunsetMinutes) {
    var ruler = '';
    var labels = '';
    for (var i = 0; i < BAR_COLUMNS; i++) {
      var isTick = (i % 8 === 0);
      ruler += isTick ? (i === 0 ? '├' : '┼') : '─';
    }
    ruler = ruler.slice(0, BAR_COLUMNS - 1) + '┤';

    var stops = ['00', '06', '12', '18'];
    for (var s = 0; s < stops.length; s++) {
      var at = s * 8;
      while (labels.length < at) labels += ' ';
      labels += stops[s];
    }
    while (labels.length < BAR_COLUMNS - 2) labels += ' ';
    labels += '24';

    var bar = '';
    for (var c = 0; c < BAR_COLUMNS; c++) {
      var midpoint = (c + 0.5) * (DAY_MINUTES / BAR_COLUMNS);
      bar += (midpoint >= sunriseMinutes && midpoint <= sunsetMinutes) ? '█' : '░';
    }

    return labels + '\n' + ruler + '\n' + bar;
  }

  function localMinutes(hhmm) {
    return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  }

  function round(value, places) {
    var factor = Math.pow(10, places);
    return String(Math.round(value * factor) / factor);
  }

  function renderToday(entry) {
    document.getElementById('today-loading').hidden = true;

    var figures = document.getElementById('today-figures');
    figures.hidden = false;
    addFigure(figures, 'date', entry.date);
    addFigure(figures, 'sunrise', entry.sunrise, 'big');
    addFigure(figures, 'sunset', entry.sunset, 'big');
    addFigure(figures, 'solar noon', entry.solarNoon);
    addFigure(figures, 'length of day', entry.dayLength, 'big');
    addFigure(figures, 'clock', entry.place.zone + ', UTC' +
      (entry.utcOffsetMinutes < 0 ? '' : '+') + (entry.utcOffsetMinutes / 60));
    addFigure(figures, 'place', entry.place.latitude.toFixed(4) + '°N, ' +
      entry.place.longitude.toFixed(4) + '°E');

    document.getElementById('scene-mount').textContent =
      drawBar(localMinutes(entry.sunrise), localMinutes(entry.sunset));
    document.getElementById('scene-caption').textContent =
      'Local civil time, midnight to midnight. One cell is about ' +
      Math.round(DAY_MINUTES / BAR_COLUMNS) + ' minutes, so the bar rounds where the ' +
      'figures above do not.';

    var drift = document.getElementById('drift-figure');
    if (entry.changeSinceYesterdayMinutes === null) {
      drift.textContent = 'no reckoning for yesterday, so no drift.';
    } else {
      var d = minutesToHM(entry.changeSinceYesterdayMinutes);
      drift.textContent = (d.sign < 0 ? '−' : '+') + d.minutes + 'm ' +
        (d.seconds < 10 ? '0' : '') + d.seconds + 's — today is ' +
        (d.sign < 0 ? 'shorter' : 'longer') + ' than yesterday.';
      drift.className = 'drift-figure ' + (d.sign < 0 ? 'drift--shorter' : 'drift--longer');
    }

    var working = document.getElementById('working-list');
    var w = entry.working;
    addFigure(working, 'Julian day (00:00 UTC)', round(w.julianDay, 1));
    addFigure(working, 'Julian centuries from J2000.0', round(w.julianCentury, 9));
    addFigure(working, 'sun’s mean longitude', round(w.meanLongitudeDeg, 5) + '°');
    addFigure(working, 'sun’s mean anomaly', round(w.meanAnomalyDeg, 5) + '°');
    addFigure(working, 'orbital eccentricity', round(w.eccentricity, 9));
    addFigure(working, 'equation of centre', round(w.equationOfCentreDeg, 6) + '°');
    addFigure(working, 'apparent longitude', round(w.apparentLongitudeDeg, 5) + '°');
    addFigure(working, 'obliquity of the ecliptic', round(w.obliquityDeg, 6) + '°');
    addFigure(working, 'solar declination', round(w.declinationDeg, 5) + '°');
    addFigure(working, 'equation of time', round(w.equationOfTimeMinutes, 4) + ' min');
    addFigure(working, 'hour angle at the horizon', round(w.hourAngleDeg, 5) + '°');
    addFigure(working, 'zenith taken as the horizon', w.horizonZenithDeg + '°');
    addFigure(working, 'sunrise shift per arcminute of that',
      w.horizonSensitivitySecondsPerArcminute === null ? '—'
        : round(Math.abs(w.horizonSensitivitySecondsPerArcminute), 1) + ' s');
    addFigure(working, 'sunrise, minutes after 00:00 UTC', round(w.sunriseUTCMinutes, 4));
    addFigure(working, 'sunset, minutes after 00:00 UTC', round(w.sunsetUTCMinutes, 4));

    document.getElementById('soft-number').textContent =
      'One of those is softer than the others. The horizon is taken to be ' +
      w.horizonZenithDeg + '° from the zenith: 34 arcminutes of atmospheric ' +
      'refraction plus 16 of the sun’s own radius. The 16 is geometry. The 34 ' +
      'is a fact about air — it is the refraction of a standard atmosphere, and ' +
      'the atmosphere over Paris this morning is not obliged to be standard. ' +
      'So the figure sits in the constants looking as solid as π, and it is not. ' +
      (w.horizonSensitivitySecondsPerArcminute === null ? '' :
        'What that is worth is computable, and computed above: moving the ' +
        'horizon by one arcminute walks sunrise by ' +
        round(Math.abs(w.horizonSensitivitySecondsPerArcminute), 1) + ' seconds today. ' +
        'What is not computable from inside this tower is how far off the 34 ' +
        'actually is on a given morning — that needs a barometer, and a barometer ' +
        'is a window we do not have. The sensitivity is ours; the error is not. ') +
      'Separately: the hour the clock shows is not arithmetic at all. Daylight ' +
      'saving is a fact about a parliament, and the offset above was asked of ' +
      'your machine’s timezone database, not derived here.';

    var second = document.getElementById('second-figures');
    if (!entry.crossCheck) {
      second.appendChild(el('dt', null, 'second method'));
      second.appendChild(el('dd', null, 'no result for this date.'));
      return;
    }
    addFigure(second, 'sunrise (USNO)', entry.crossCheck.sunrise);
    addFigure(second, 'sunset (USNO)', entry.crossCheck.sunset);
    addFigure(second, 'they differ at sunrise by',
      round(Math.abs(entry.crossCheck.sunriseDifferenceMinutes) * 60, 1) + ' seconds');
    addFigure(second, 'they differ at sunset by',
      round(Math.abs(entry.crossCheck.sunsetDifferenceMinutes) * 60, 1) + ' seconds');
  }

  var CLAIMS = [
    ['sunrise', 'sunrise'],
    ['sunset', 'sunset'],
    ['solarNoon', 'solar noon'],
    ['dayLengthMinutes', 'day length'],
    ['changeSinceYesterdayMinutes', 'drift']
  ];

  function renderLedger(entries) {
    var host = document.getElementById('ledger-list');
    host.replaceChildren();

    if (!entries.length) {
      host.appendChild(el('p', 'loading', 'the ledger is empty.'));
      return;
    }

    var sorted = entries.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });

    sorted.forEach(function (published) {
      var row = el('div', 'ledger__entry');
      var head = el('div', 'ledger__head');
      head.appendChild(el('span', 'ledger__date', published.date));
      head.appendChild(el('span', 'ledger__times',
        published.sunrise + ' → ' + published.sunset + '  (' + published.dayLength + ')'));

      var fresh, broken = [];
      try {
        fresh = window.Reckoning.reckon(published.date, window.Reckoning.PARIS);
        CLAIMS.forEach(function (pair) {
          var was = published[pair[0]], now = fresh[pair[0]];
          var same = (typeof was === 'number' && typeof now === 'number')
            ? Math.abs(was - now) <= 1e-9
            : was === now;
          if (!same) broken.push(pair[1] + ': published ' + was + ', recomputed ' + now);
        });
      } catch (error) {
        broken.push('could not recompute this entry: ' + error.message);
      }

      var verdict = el('span', 'ledger__verdict', broken.length ? 'DRIFTED' : 'holds');
      verdict.classList.add(broken.length ? 'ledger__verdict--bad' : 'ledger__verdict--good');
      head.appendChild(verdict);
      row.appendChild(head);

      if (broken.length) {
        var list = el('ul', 'ledger__broken');
        broken.forEach(function (line) { list.appendChild(el('li', null, line)); });
        row.appendChild(list);
        row.appendChild(el('p', 'ledger__note',
          'What was published on the day stands above, unedited. The tower’s ' +
          'arithmetic has moved out from under it. The record is not the thing ' +
          'to correct.'));
      } else if (published.publishedAt) {
        row.appendChild(el('p', 'ledger__note',
          'published ' + published.publishedAt + ', and it still recomputes to the same numbers.'));
      }

      host.appendChild(row);
    });
  }

  // Today's figures, or an honest account of why there are none.
  //
  // Until Day 5 this was one unguarded line. reckon() could not throw, so
  // nothing here caught anything. Day 5 put a guard inside the instrument
  // that throws when the clock offset is impossible — and the moment it
  // did, this call site became the place where a caught fault turns into
  // a dark room: the throw escaped start(), the fetch below never ran, and
  // the ledger — the tower's whole public self-audit — silently did not
  // draw. Verified in a browser with the guard forced to fire, not
  // reasoned about: the room lost 2300 characters and said nothing.
  //
  // That is the tower's signature failure and the guard had rebuilt it one
  // floor up. A check that protects a number by taking down the room it
  // was printed in has moved the silence, not removed it. So: the failure
  // is caught, and it is *said*, here where a reader is standing.
  function renderTodayOrSayWhyNot() {
    var today = todayInZone(window.Reckoning.PARIS.zone);
    try {
      renderToday(window.Reckoning.reckon(today, window.Reckoning.PARIS));
    } catch (error) {
      var loading = document.getElementById('today-loading');
      loading.hidden = false;
      loading.textContent = 'the reckoning stopped itself for ' + today + ' — ' +
        error.message + ' The ledger below is untouched by this: it is what was ' +
        'published on the days it was published, and it still recomputes or it ' +
        'says DRIFTED. This tower would rather print nothing than print a time ' +
        'it cannot stand behind.';
    }
  }

  function start() {
    renderTodayOrSayWhyNot();

    fetch('ledger.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then(renderLedger)
      .catch(function () {
        var host = document.getElementById('ledger-list');
        host.replaceChildren();
        host.appendChild(el('p', 'loading',
          'the ledger would not open — it remains at reckoning/ledger.json.'));
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
