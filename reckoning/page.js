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

  // "Today" is the today of the place the tower stands in — not the date on
  // the clock of whoever is reading, which may already be tomorrow or still
  // yesterday.
  //
  // Day 19. This file held its own copy of that arithmetic, called it with
  // `Reckoning.PARIS.zone` at two separate call sites, and `tools/reckon.js`
  // held a third copy on the keeper's desk. Three copies of one question,
  // across two runtimes, and the two that matter run where the other cannot
  // be seen: if the page's answer and the gate's answer ever came apart, it
  // would show as the page drawing a day the ledger does not hold, in a
  // stranger's browser. So the arithmetic moved into the instrument as
  // `Reckoning.todayAt(zone)` and every reader asks the one copy.
  function towerToday() {
    return window.Reckoning.todayAt(window.Reckoning.STANDING.place.zone);
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

  function signedSeconds(seconds) {
    if (seconds === null || seconds === undefined) return '—';
    return (seconds < 0 ? '−' : '+') + round(Math.abs(seconds), 1) + ' s';
  }

  // One event's own instant, and the series as it stood there. Three of
  // these are printed because after Day 6 there is no single declination
  // for a day — sunrise, sunset and solar noon each get the sun where it
  // actually was, and the three numbers differ. Printing one and calling
  // it today's is exactly the mistake that put a wrong sunset on this
  // page for three days.
  function renderEpoch(mountId, w, hasHourAngle) {
    var list = document.getElementById(mountId);
    if (!list || !w) return;
    addFigure(list, 'Julian day at that instant', round(w.julianDay, 6));
    addFigure(list, 'sun’s mean longitude', round(w.meanLongitudeDeg, 5) + '°');
    addFigure(list, 'sun’s mean anomaly', round(w.meanAnomalyDeg, 5) + '°');
    addFigure(list, 'equation of centre', round(w.equationOfCentreDeg, 6) + '°');
    addFigure(list, 'apparent longitude', round(w.apparentLongitudeDeg, 5) + '°');
    addFigure(list, 'obliquity of the ecliptic', round(w.obliquityDeg, 6) + '°');
    addFigure(list, 'solar declination', round(w.declinationDeg, 5) + '°');
    addFigure(list, 'equation of time', round(w.equationOfTimeMinutes, 4) + ' min');
    if (hasHourAngle) {
      addFigure(list, 'hour angle at the horizon',
        w.hourAngleDeg === null ? '—' : round(w.hourAngleDeg, 5) + '°');
    } else {
      addFigure(list, 'solar noon, minutes after 00:00 UTC', round(w.solarNoonUTCMinutes, 4));
    }
    addFigure(list, 'passes before it stopped moving', String(w.passes));
    addFigure(list, 'how far it moved on the last pass',
      w.lastMoveSeconds === null ? '—' : round(w.lastMoveSeconds, 6) + ' s');
  }

  // Above the polar circles the sun does not always cross the horizon, and
  // the instrument has always said so plainly — `reckon()` returns a
  // `never` rather than a time. This page had no branch for it: it read a
  // sunrise that wasn't there and threw inside the picture-drawing, so the
  // one reader for whom the answer was most interesting got a raw type
  // error instead of the plain sentence they were owed. Unreachable from
  // Paris, reachable from the first northern corner. Ember's find, Day 7.
  function neverWords(never, placeName) {
    return never === 'set'
      ? 'At ' + placeName + ' on this date the sun does not set: it stays above the ' +
        'horizon all the way round. There is no sunrise or sunset to print, and the ' +
        'tower would rather say so than invent one.'
      : 'At ' + placeName + ' on this date the sun does not rise: it stays below the ' +
        'horizon all the way round. There is no sunrise or sunset to print, and the ' +
        'tower would rather say so than invent one.';
  }

  // The same fact, short, for the one line of a ledger row where a time
  // would otherwise stand. Not a second wording of a claim — the paragraph
  // above is for a reader meeting the dark for the first time, in the
  // room's own voice; this stands in a column beside a date and has to be
  // read at a glance. Day 20.
  function neverBrief(never, placeName) {
    return never === 'set'
      ? 'the sun did not set at ' + placeName
      : 'the sun did not rise at ' + placeName;
  }

  // Degrees round from north through east, printed with the quarter of
  // the compass named in words. A reader who does not carry a compass
  // still knows which way east is, and "68.8°, east and a little north"
  // is checkable by someone standing in a field; a bare bearing is not.
  function quarterWords(degrees) {
    var points = [
      [0, 'due north'], [45, 'north-east'], [90, 'due east'],
      [135, 'south-east'], [180, 'due south'], [225, 'south-west'],
      [270, 'due west'], [315, 'north-west'], [360, 'due north']
    ];
    var at = 0;
    for (var i = 1; i < points.length; i++) {
      if (Math.abs(degrees - points[i][0]) < Math.abs(degrees - points[at][0])) at = i;
    }
    var off = degrees - points[at][0];
    if (Math.abs(off) < 0.5) return points[at][1];
    // Named by the neighbour it leans toward, not by a turn of the hand.
    // "21° toward north-east" is a thing a person standing in a field can
    // do something with; "21° anticlockwise" asks them to hold a compass
    // rose the right way up first.
    var toward = points[off > 0 ? Math.min(at + 1, points.length - 1) : Math.max(at - 1, 0)][1];
    return points[at][1] + ', ' + round(Math.abs(off), 1) + '° toward ' + toward.replace('due ', '');
  }

  // The step is the standing claim and the bearings are horizon-hung, so
  // the step is printed first and big and the bearings are printed with
  // "on a flat plain" welded into the term. Day 14's fault was two
  // numbers side by side that a reader fused into one fact; the repair
  // there was to make each say whose calendar it was in on its own face,
  // and this is the same repair on whose horizon.
  function renderRisingPoint(entry) {
    var list = document.getElementById('rising-figures');
    var note = document.getElementById('rising-note');
    if (!list) return;

    if (entry.risingPointDegrees === null) {
      note.textContent = 'The sun does not clear the horizon here today, ' +
        'so there is no rising point to give.';
      return;
    }

    if (entry.risingPointStepArcminutes === null) {
      addFigure(list, 'step to tomorrow', '—');
    } else {
      var step = entry.risingPointStepArcminutes;
      addFigure(list, 'from this morning to tomorrow morning',
        (step < 0 ? '−' : '+') + round(Math.abs(step), 2) + '′ along your skyline', 'big');
      addFigure(list, 'that, in widths of the sun itself',
        round(Math.abs(entry.risingPointStepSunWidths), 3) + ' × 32′', 'big');
    }
    addFigure(list, 'rising point today, on a flat plain',
      round(entry.risingPointDegrees, 2) + '° — ' + quarterWords(entry.risingPointDegrees));
    addFigure(list, 'rising point tomorrow, on a flat plain',
      entry.risingPointTomorrowDegrees === null ? '—'
        : round(entry.risingPointTomorrowDegrees, 2) + '°');
    addFigure(list, 'setting point today, on a flat plain',
      entry.settingPointDegrees === null ? '—'
        : round(entry.settingPointDegrees, 2) + '° — ' + quarterWords(entry.settingPointDegrees));

    // Said as a fact about the reader's eye rather than about our
    // arithmetic, because that is the question they are actually asking:
    // is this a thing I could see happen.
    if (entry.risingPointStepSunWidths !== null) {
      var widths = Math.abs(entry.risingPointStepSunWidths);
      note.textContent = widths >= 0.25
        ? 'Tomorrow the sun clears your mark about ' + round(widths, 2) +
          ' of its own width further ' +
          (entry.risingPointStepArcminutes > 0 ? 'to the right' : 'to the left') +
          ' — an amount an eye can hold. Two mornings is enough.'
        : 'Tomorrow the sun clears your mark about ' + round(widths, 3) +
          ' of its own width along, which is too little to see. Near the ' +
          'solstices this quantity goes to nearly nothing, which is what ' +
          'the word solstice is about. Leave more mornings between looks.';
    }
  }

  // ---- How high the sun stands ----
  //
  // Day 37. The two culminations, drawn the same way on a lit morning and a
  // dark one, from the same two fields. One function and not two: a lit
  // reader and a dark reader are being told the same fact, and a second
  // copy would be a coin flip waiting for the next edit to land on either
  // half (Ember, Day 34).
  //
  // The highest is the figure a reader can actually go and check with the
  // cheapest instrument there is — a stick, a shadow, and the arithmetic
  // arctan(height ÷ shadow) at the solar noon printed two lines above. That
  // is the whole reason it is on the page rather than in the working: it is
  // the one number this tower publishes that does not need a clock accurate
  // to the second, a level horizon, or anybody's almanac.
  function addCulminations(list, entry) {
    if (entry.sunHighestDegrees === undefined || entry.sunLowestDegrees === undefined) return;
    addFigure(list, 'the sun at its highest', round(entry.sunHighestDegrees, 3) + '°');
    addFigure(list, 'the sun at its lowest', round(entry.sunLowestDegrees, 3) + '°');
  }

  // The sentence under those two figures, and it is doing three jobs that a
  // reader is owed and that no test can hold me to.
  //
  // It says the numbers are geometric and not observed — no refraction, so a
  // measured noon shadow will read a fraction of a degree higher than this,
  // and a reader who does not know that will think the tower is wrong when it
  // is being exact. It says which lower transit is meant, because "twelve
  // hours after this date's noon" is a convention and not a derivation: at
  // most longitudes it falls on the next UTC date, and a convention nobody
  // states is one nobody can check. And it says outright that the agreement
  // between these figures and the `never` above them is not a second opinion:
  // `cos H` outside [−1, 1] and *the highest stands below the horizon* are the
  // same trig in two shirts, so a check between them would be Day 21's echo
  // wearing a witness's coat. Ember was asked whether to build that check and
  // said state it instead.
  function culminationNote() {
    return 'Both are geometric: the angle the sun’s centre makes with a level ' +
      'horizon, with no refraction added. Air bends the light, so a shadow ' +
      'measured at the solar noon above will put the sun a fraction of a ' +
      'degree higher than this — most at the horizon, least overhead. The ' +
      'lowest is the transit twelve hours after that noon, which at most ' +
      'longitudes falls on the next UTC date; that is a convention of ours ' +
      'and not a fact of the sky. And these two agreeing with the line about ' +
      'sunrise above is not a check: whether the sun rises is the same ' +
      'arithmetic as how high it gets, asked once and read twice.';
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
    // The hemisphere is read off the sign rather than written into the
    // string. It said `°N, °E` outright until Day 18, which is correct for
    // Paris and for nowhere south or west of it — the same untested
    // assumption as the ledger auditor one storey down, and it would have
    // published "-33.8688°N" the first morning it was wrong.
    addFigure(figures, 'place',
      Math.abs(entry.place.latitude).toFixed(4) + '°' + (entry.place.latitude < 0 ? 'S' : 'N') + ', ' +
      Math.abs(entry.place.longitude).toFixed(4) + '°' + (entry.place.longitude < 0 ? 'W' : 'E'));

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

    addCulminations(figures, entry);
    // The same caveat on a lit morning as on a dark one. Refraction and the
    // twelve-hour convention are properties of the two figures, not of the
    // dark — printing the note only where the sun does not rise would make it
    // read as a fact about polar nights, and leave every ordinary morning's
    // reader thinking a measured shadow ought to match to the arcminute.
    var note = document.getElementById('today-dark-note');
    if (note) { note.hidden = false; note.textContent = culminationNote(); }

    renderRisingPoint(entry);

    var working = document.getElementById('working-list');
    var w = entry.working;
    addFigure(working, 'Julian day (00:00 UTC) — the first guess only', round(w.julianDay, 1));
    addFigure(working, 'Julian centuries from J2000.0 at 00:00 UTC', round(w.julianCentury, 9));
    addFigure(working, 'orbital eccentricity', round(w.eccentricity, 9));
    addFigure(working, 'zenith taken as the horizon', w.horizonZenithDeg + '°');
    addFigure(working, 'sunrise shift per arcminute of that',
      w.horizonSensitivitySecondsPerArcminute === null ? '—'
        : round(Math.abs(w.horizonSensitivitySecondsPerArcminute), 1) + ' s');
    addFigure(working, 'what settling the epoch is worth at sunrise',
      signedSeconds(w.epochCorrectionSecondsSunrise));
    addFigure(working, 'what settling the epoch is worth at sunset',
      signedSeconds(w.epochCorrectionSecondsSunset));
    addFigure(working, 'sunrise, minutes after 00:00 UTC', round(w.sunriseUTCMinutes, 4));
    addFigure(working, 'sunset, minutes after 00:00 UTC', round(w.sunsetUTCMinutes, 4));

    renderEpoch('working-sunrise', w.atSunrise, true);
    renderEpoch('working-sunset', w.atSunset, true);
    renderEpoch('working-noon', w.atSolarNoon, false);

    document.getElementById('soft-number').textContent =
      'One of those is softer than the others. The horizon is taken to be ' +
      w.horizonZenithDeg + '° from the zenith: 34 arcminutes of atmospheric ' +
      'refraction plus 16 of the sun’s own radius. The 16 is geometry. The 34 ' +
      'is a fact about air — it is the refraction of a standard atmosphere, and ' +
      // Day 19, Ember's find. This said "the atmosphere over Paris" outright,
      // in running code, executed on every render for whatever place the
      // tower actually stands in. The room's prose is deferred to the move;
      // a *live line* naming a city the tower has left is not stale copy, it
      // is code asserting something false, directly under a heading that
      // (correctly) names the new city.
      'the atmosphere over ' + entry.place.name + ' this morning is not obliged ' +
      'to be standard. ' +
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

    document.getElementById('epoch-note').textContent =
      'Three blocks, not one, because the sun does not wait for the arithmetic. ' +
      'The series is a function of an instant, and sunrise, solar noon and sunset ' +
      'are three different instants — about fifteen hours apart, end to end. Until ' +
      window.Reckoning.METHOD_CHANGED_ON + ' this page asked the series once, at ' +
      'midnight UTC, and used that one answer for both ends of the day. It was a ' +
      'little stale at sunrise and badly stale at sunset, and the sunset it ' +
      'published ran late by a minute and a half, every day, in the same ' +
      'direction. Nothing looked wrong. Now each event is iterated to its own ' +
      'instant until the time stops moving, and the size of that correction is ' +
      'printed above: today it is ' +
      signedSeconds(w.epochCorrectionSecondsSunrise) + ' at sunrise and ' +
      signedSeconds(w.epochCorrectionSecondsSunset) + ' at sunset. It is not the ' +
      'same size all year, and rather than say so in a nice font we ran it: at ' +
      'sunset it is about +11 s at the June solstice and +19 s at the December ' +
      'one, and swells to +68 s in March and −95 s in September. Largest at the ' +
      'equinoxes, near nothing at the solstices, changing sign as the ' +
      'declination turns — which is the shape it should have, because the error ' +
      'was only ever the declination going stale, and at a solstice it barely ' +
      'moves. That much is arithmetic and it is ours. What it does not show is ' +
      'that the corrected times are right: a wrong method can be internally ' +
      'consistent across a whole year. Only an almanac outside this tower can ' +
      'say that, and the one that was asked is why this changed.';

    var second = document.getElementById('second-figures');
    if (!entry.crossCheck) {
      second.appendChild(el('dt', null, 'second method'));
      second.appendChild(el('dd', null, 'no result for this date.'));
      return;
    }
    addFigure(second, 'sunrise (USNO)', entry.crossCheck.sunrise);
    addFigure(second, 'sunset (USNO)', entry.crossCheck.sunset);

    // Day 21. Until this morning these two lines subtracted a method-A
    // answer counted from 00:00 UTC of the civil date — free to be negative
    // or past a day — from a method-B answer folded into a single day. Off
    // the Greenwich band that difference was a whole day, and this page
    // printed it to a reader as `they differ at sunrise by 86379.0 seconds`,
    // directly under two times that agree to the minute. Both halves are on
    // one line now, and the difference is refused outright rather than
    // softened when it is past the bound. Explicit null, not truthiness: a
    // real gap of zero is falsy.
    if (entry.crossCheck.beyondBound) {
      second.appendChild(el('dt', null, 'they differ by'));
      second.appendChild(el('dd', 'soft-number',
        'more than ' + entry.crossCheck.maxGapMinutes + ' minutes — ' +
        round(entry.crossCheck.sunriseGapMinutes, 2) + ' at sunrise and ' +
        round(entry.crossCheck.sunsetGapMinutes, 2) + ' at sunset. That is not a ' +
        'disagreement this tower knows how to read, so it publishes no figure for it. ' +
        'The second method exists to be able to disagree; when it disagrees this far, ' +
        'the honest answer is that something is broken here, not a tidy number.'));
      return;
    }
    addFigure(second, 'they differ at sunrise by',
      round(Math.abs(entry.crossCheck.sunriseDifferenceMinutes) * 60, 1) + ' seconds');
    addFigure(second, 'they differ at sunset by',
      round(Math.abs(entry.crossCheck.sunsetDifferenceMinutes) * 60, 1) + ' seconds');
  }

  // Day 20. `never` leads this list because on a dark row it is the only
  // thing on it. Above about 66 degrees `reckon()` returns `{ never:
  // 'risen' }` or `{ never: 'set' }` and every numeric key below is
  // undefined — so every comparison passed vacuously and this page printed
  // the same green `unchanged` a full row earns. A published row forged
  // from polar night to midnight sun was waved through by both auditors.
  // The long note is in `tools/reckon.js`; the two lists must stay in step,
  // because a claim audited in one place and not the other is a claim whose
  // forgery is caught on the keeper's desk and not in the browser, or the
  // other way round, and neither of them can see the other.
  //
  // Day 36: for four days short of a month, nothing asked whether they were
  // in step. Proved rather than argued — `solarNoon` taken out of *this*
  // list alone left `--verify`, `ledger-dark.js`, `ledger-verdicts.js` and
  // `ledger-place.js` all green. `tools/claims-audited.js` asks now, and it
  // asks it as a behaviour rather than as two arrays: it forges every field
  // a real row carries, on both desks, and names any that only one of them
  // convicts. It also names the ones neither does.
  var CLAIMS = [
    ['never', 'whether the sun rose'],
    ['sunrise', 'sunrise'],
    ['sunset', 'sunset'],
    ['solarNoon', 'solar noon'],
    ['dayLengthMinutes', 'day length'],
    ['changeSinceYesterdayMinutes', 'drift'],
    ['utcOffsetMinutes', 'clock offset from UTC'],
    ['dayLength', 'day length in words'],
    ['risingPointDegrees', 'rising point'],
    ['settingPointDegrees', 'setting point'],
    ['risingPointTomorrowDegrees', 'tomorrow’s rising point'],
    ['risingPointStepArcminutes', 'step to tomorrow'],
    ['risingPointStepSunWidths', 'step in sun-widths'],
    ['sunHighestDegrees', 'the sun at its highest'],
    ['sunLowestDegrees', 'the sun at its lowest']
  ];

  // Fields that are on a row without being a claim the recompute can answer
  // for: the row's own name, the fork its verdict is chosen by, the input
  // the recompute is run from, and the instant it was written at — which is
  // read instead by the two-clocks section further down the page.
  var NOT_A_RECOMPUTED_CLAIM = ['date', 'method', 'place', 'publishedAt'];

  // What the green word above actually covers, counted rather than typed.
  //
  // Day 36. This sentence used to read *that is the whole of what this row
  // claims: nobody has moved those numbers since*, and it was false. The row
  // carried nineteen fields; eight were asked. Seven published numbers — the
  // clock offset, the setting point, tomorrow's rising point, the step in
  // sun-widths, the day length in words, and the whole of the working and
  // the cross-check — went unasked by this page and unasked on the keeper's
  // desk, wearing the same green word as the ones that were held. Five of
  // them are in CLAIMS now. The three that are objects are not, and this
  // sentence names them to the reader rather than letting the badge cover
  // them silently. Day 18's move for the third time: what changed was not
  // the badge's scope but its power, and the honest repair is to say the
  // scope out loud.
  //
  // It is counted off the row and the list at render time, so it cannot go
  // stale the way a typed figure does. Day 33: an aggregate wearing a
  // constant's syntax can never promise to have been true, only to stop
  // being.
  // Day 38. The three that were named to the reader as uncovered are covered
  // now, path by path, so this sentence has to move with them — a scope note
  // that goes on naming a hole after the hole is filled is the told book with
  // our own account as the book, which Day 36 said would happen to me next.
  // Both halves are still counted off the row at render time and neither is
  // typed.
  function scopeOfCheck(published, deepChecked) {
    var asked = CLAIMS.filter(function (pair) {
      return published[pair[0]] !== undefined &&
        window.Reckoning.claimApplies(pair[0], published.date);
    });
    var unasked = Object.keys(published).filter(function (key) {
      if (NOT_A_RECOMPUTED_CLAIM.indexOf(key) !== -1) return false;
      if (window.Reckoning.DEEP_CLAIMS.indexOf(key) !== -1) return false;
      return !CLAIMS.some(function (pair) { return pair[0] === key; });
    });
    var paths = window.Reckoning.deepPathCount(published);
    var line = 'That is ' + asked.length +
      (asked.length === 1 ? ' field' : ' fields') + ' of this row held against a ' +
      'fresh computation: nobody has moved them since.';

    if (paths && deepChecked) {
      line += ' Under them, ' + paths + ' more numbers — the horizon this was ' +
        'reckoned against, the whole showing of the working, and the second ' +
        'method’s own answer — were held the same way, one path at a time.';
    } else if (paths) {
      line += ' The ' + paths + ' numbers of its working are not among them: this ' +
        'row was computed under method ' + (published.method || 1) + ', whose ' +
        'arithmetic is no longer in this file, so nothing here or anywhere can ' +
        'recompute what it showed. That is not a claim it drifted. It is this ' +
        'page saying its working can never be checked by anyone.';
    }

    if (!unasked.length) {
      return line + ' Every other field on the row is the row’s own name, its ' +
        'method, its place or the instant it was written — none of them things ' +
        'a recompute can answer for.';
    }
    return line + ' It is not the whole row. ' + unasked.length +
      (unasked.length === 1 ? ' field is' : ' fields are') + ' published here and ' +
      'held against nothing — ' + unasked.join(', ') + ' — and the green word ' +
      'above does not cover ' + (unasked.length === 1 ? 'it' : 'them') + '.';
  }

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
      // A dark row has no times to arrow between. This line read
      // `undefined → undefined  (undefined)` for such a row until Day 20 —
      // the same fault as the write tool's NaN, in the room a stranger
      // actually stands in. The place name is the row's own, not the
      // tower's: this is a record of where the tower *was*.
      head.appendChild(el('span', 'ledger__times',
        published.never
          ? neverBrief(published.never,
              (published.place && published.place.name) ? published.place.name : 'that place')
          : published.sunrise + ' → ' + published.sunset + '  (' + published.dayLength + ')'));

      // Day 18. This line read `window.Reckoning.PARIS` until this morning,
      // and every published row has carried its own `place` since the first
      // one. The auditor threw it away. Nothing was ever wrong by it, because
      // Paris is the only place that has ever been in the book — which is the
      // whole of the fault: an assumption that was never once tested against
      // a row that could tell it from the truth. The first row this tower
      // ever writes standing anywhere else would have been recomputed against
      // Paris, disagreed on every figure, and — being on the method running
      // now — handed the forgery sentence below, about a row no hand touched.
      //
      // The place goes into the verdict rather than beside it, because what
      // this row establishes is *unchanged given this place*, and the place
      // is the one thing on it that no recompute can ever vouch for: a place
      // is an input, and the recompute is what the input feeds. See the
      // standing paragraph on the page, which says so to the reader.
      var where = published.place;
      var placeName = (where && where.name) ? where.name : null;
      // A row that cannot be recomputed is neither clean nor drifted, and
      // giving it DRIFTED would be one word doing two jobs again — Day 11's
      // fault, which this page has already had once. `tools/ledger-place.js`
      // caught the page having no third word on the morning it was written.
      var unplaced = placeName ? null :
        'this entry names no place, so there is nowhere to recompute it. That is ' +
        'not a claim that it drifted and not a claim that it stands — it is this ' +
        'page saying it could not check.';
      var fresh, broken = [], deepChecked = false;
      try {
        if (unplaced) throw new Error(unplaced);
        fresh = window.Reckoning.reckon(published.date, where);
        CLAIMS.forEach(function (pair) {
          var was = published[pair[0]], now = fresh[pair[0]];
          // A row written before the tower published this number could not
          // have carried it, and must not be convicted of the silence. The
          // map of birthdays is in reckoning.js so that this browser and
          // `tools/reckon.js --verify` cannot come to hold different ideas
          // of what a row was ever asked. The exemption runs both ways: a
          // row too old to have made the claim and carrying it anyway is
          // caught here, not waved through.
          if (!window.Reckoning.claimApplies(pair[0], published.date)) {
            if (was !== undefined) {
              broken.push(pair[1] + ': this entry carries it, but ' + published.date +
                ' predates ' + window.Reckoning.CLAIM_INTRODUCED[pair[0]] +
                ', when the tower first published it');
            }
            return;
          }
          if (was === undefined && now !== undefined) {
            broken.push(pair[1] + ': published nothing, recomputed ' + now +
              ' — the field is missing from an entry that should carry it');
            return;
          }
          // Day 38. One comparison for both auditors, and it lives in
          // reckoning.js for the reason the birthdays do: two copies of a
          // rule is two chances to disagree, and the disagreement would show
          // up as this browser calling a clean row DRIFTED where nobody here
          // could see it. The old bound was `Math.abs(was - now) <= 1e-9`
          // typed here and typed again on the desk.
          if (!window.Reckoning.sameNumber(was, now)) {
            broken.push(pair[1] + ': published ' + was + ', recomputed ' + now);
          }
        });
        // The working, the horizon and the cross-check, path by path. Null
        // means a row this browser cannot check at all — see `deepUnchecked`
        // below, which says so on the row rather than letting the green word
        // stretch over sixty numbers nothing held.
        var deepBroken = window.Reckoning.deepDifferences(published, fresh);
        deepChecked = deepBroken !== null;
        if (deepBroken) broken = broken.concat(deepBroken);
      } catch (error) {
        broken.push('could not recompute this entry: ' + error.message);
      }

      var method = published.method || 1;
      head.appendChild(el('span', 'ledger__method', 'method ' + method));

      // The green word was `holds` until Day 11, and `holds` was taking
      // credit for a check nobody ran. Ember found it: what the recompute
      // establishes is that this published number has not moved since the
      // day it was published — a fact about the record, not about the sun.
      // Ash named the trap in the word itself: `holds` is heard as *holds
      // true*, which is about being correct, when all it can mean here is
      // *holds in place*, which is about staying put. Ember's etymology
      // lands on the same seam from the other side — a ledger is a book
      // that *lies in place*, from Middle Dutch *legger*, and lying in
      // place is precisely the whole of what this row can vouch for.
      // `unchanged` is Ash's word and it needs no paragraph above it.
      var verdict = el('span', 'ledger__verdict',
        unplaced ? 'UNPLACED'
          : (broken.length ? 'DRIFTED' : 'unchanged') + ' at ' + placeName);
      verdict.classList.add(broken.length ? 'ledger__verdict--bad' : 'ledger__verdict--good');
      head.appendChild(verdict);
      row.appendChild(head);

      if (unplaced) {
        row.appendChild(el('p', 'ledger__note', unplaced));
        row.appendChild(el('p', 'ledger__note',
          'Every entry in this ledger names the place it was reckoned for, and ' +
          'has since the first one. A row that does not is a row something has ' +
          'happened to. Read the commits that touched reckoning/ledger.json.'));
      } else if (broken.length) {
        var list = el('ul', 'ledger__broken');
        broken.forEach(function (line) { list.appendChild(el('li', null, line)); });
        row.appendChild(list);
        // DRIFTED has always printed one sentence for two different facts,
        // and Ember caught it on Day 11 by forging one: in a scratch copy
        // of the tower it hand-edited a published sunrise on a row whose
        // method is the method running now, and the page answered
        // `DRIFTED — the tower's arithmetic has moved out from under it.`
        // The arithmetic had not moved. A hand had. The page supplied an
        // innocent account of a thing it had no reason to think innocent,
        // because it assumed every disagreement was a method question.
        //
        // The two cases genuinely have different accounts to give, so they
        // get different sentences. The forgery case is the one with no
        // honest story available, and saying that plainly is the story.
        row.appendChild(el('p', 'ledger__note',
          'What was published on the day stands above, unedited. The record ' +
          'is not the thing to correct.'));
        // A bare DRIFTED tells a stranger the tower disagrees with itself
        // and nothing about which side to believe. If the method it was
        // computed under is not the one running now, say so, and say what
        // changed — the verdict is the alarm, this is the account.
        if (method !== window.Reckoning.METHOD) {
          row.appendChild(el('p', 'ledger__note',
            'This entry was computed under method ' + method + ': ' +
            (window.Reckoning.METHOD_NOTES[method] || 'an earlier method') + '. ' +
            'The tower now runs method ' + window.Reckoning.METHOD + ': ' +
            window.Reckoning.METHOD_NOTES[window.Reckoning.METHOD] + '. ' +
            'The method changed on ' + window.Reckoning.METHOD_CHANGED_ON + ', after an ' +
            'almanac outside this tower was consulted and disagreed with the ' +
            'sunsets above; the day’s diary entry sets out what moved and why. ' +
            'So this row is not the record being wrong about what was claimed — ' +
            'it is the claim, kept, and the tower saying it no longer stands by it.'));
          // Day 38, and it belongs on this note rather than on the clean-row
          // sentence next door, because these rows will never be clean: they
          // are DRIFTED for as long as this tower stands (the method moved
          // under them and the ledger is cold), so a fact printed only on a
          // green row is a fact no reader of *these* rows will ever meet.
          // Found by a case that asserted the sentence and did not find it —
          // it was written for a branch these rows do not reach.
          var strandedPaths = window.Reckoning.deepPathCount(published);
          if (strandedPaths) {
            row.appendChild(el('p', 'ledger__note',
              'One thing more, which is not about drift. This row shows its working — ' +
              strandedPaths + ' numbers of it, the horizon it was reckoned against and ' +
              'the second method’s own answer among them — and that working can never ' +
              'be checked by anyone. Method ' + method + '’s arithmetic is not in this ' +
              'file any more, so there is nothing here, or in any browser, that could ' +
              'recompute what it showed. The figures above are still held against a ' +
              'fresh computation and still disagree with it. The working underneath ' +
              'them is simply out of reach, and this page would rather say so than ' +
              'let a count of what was checked quietly cover it.'));
          }
        } else {
          row.appendChild(el('p', 'ledger__note',
            'This entry was computed under method ' + method + ', which is the ' +
            'method running in your browser right now — so there is no method ' +
            'change to blame, and the tower has no innocent account of this row ' +
            'to give you. Something moved that should not have: either the ' +
            'published number was edited after the day, or the arithmetic was ' +
            'changed without the method number being changed with it. Both are ' +
            'ours, and neither is a fault in the record. Read the commit that ' +
            'touched reckoning/ledger.json and the day’s diary entry. If ' +
            'neither explains it, the tower has caught itself, and this row is ' +
            'the evidence.'));
        }
      } else if (published.publishedAt) {
        // The green row used to say only that it "still recomputes to the
        // same numbers", with a word beside it that sounded like a verdict
        // on the sun. Say the size of the claim on the row itself, so a
        // reader who never reaches the standing paragraph above still gets
        // it, and so the quiet row is not the one that looks best defended.
        // A dark row has no numbers, so the sentence below would be a
        // false account of what just happened in this browser — it would
        // promise a reader that eight figures were held against the
        // arithmetic when one word was. Day 18 put the place inside the
        // verdict because the badge's *power* had moved while its scope
        // stood still; this is the same move for the same reason, one row
        // further along. Day 20.
        row.appendChild(el('p', 'ledger__note', published.never
          // Day 37. This sentence said *that is the whole of what this row
          // claims* about a row carrying one word, and it was true when it
          // was written. The morning the fold stopped discarding solar noon,
          // the clock offset and the two culminations, it went on saying it
          // — Day 33's told book, and the same sentence in `tools/reckon.js`
          // went with it. So the count comes off the row and the list at
          // render time, exactly like the lit row's below: a figure counted
          // cannot go stale, and this one was typed.
          ? 'published ' + published.publishedAt + ', and it recomputes here, now, ' +
            'in your browser, at ' + placeName + '. On a day the sun does not clear ' +
            'the horizon there is no sunrise, no day length and no drift to hold ' +
            'anyone to, and none is invented. ' + scopeOfCheck(published, deepChecked) +
            ' It is a lighter row than the ones above it with times on them, and it ' +
            'wears the same green word, so the difference is said here rather than ' +
            'left for you to notice.'
          : 'published ' + published.publishedAt + ', and it recomputes here, now, ' +
          'in your browser, at ' + placeName + ', to exactly those numbers. ' +
          scopeOfCheck(published, deepChecked) +
          ' The place is not part of that — it is the input this recompute was run ' +
          'from, so nothing here can check it. Whether the numbers were right on ' +
          'the day is a different question again, and this page cannot answer it — ' +
          'the corner above is where you can.'));
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
    var today = null;
    // The heading sits directly over the figures and names the place they
    // are for. It was typed into the HTML as "today over Paris" — a hand's
    // claim about a place standing above a machine's claim about the sun,
    // with nothing tying the two together. Day 19: it comes off the same
    // value the figures below it were reckoned at, so the name and the
    // numbers cannot come apart. Day 23 finished the job this comment used
    // to defer: the rest of the room's prose came off the same value too —
    // see renderStandingProse() at the foot of this file.
    var heading = document.getElementById('today-heading');
    if (heading) heading.textContent = 'today over ' + window.Reckoning.STANDING.place.name;
    try {
      // `today` is computed inside the try as of Day 19, not above it.
      // `towerToday()` asks the clock about a zone and throws if the clock
      // has never heard of it — a thing it could not do before this morning,
      // so this call site was written when the call could not fail. Ember
      // found it sitting one line above the very guard built to stop a throw
      // taking down the room, in the file that paid for that lesson on Day 5.
      today = towerToday();
      var entry = window.Reckoning.reckon(today, window.Reckoning.STANDING.place);
      if (entry.never) {
        var mount = document.getElementById('today-loading');
        mount.hidden = false;
        mount.textContent = neverWords(entry.never, entry.place.name);
        // Day 37. Until this morning that sentence was the whole of a dark
        // morning's room: one paragraph, no figures, and a reader standing in
        // the one place on earth where this instrument is most interesting was
        // handed nothing to be right or wrong about. The fold discards the
        // horizon crossings, which genuinely are not there — and discarded
        // with them two facts that are.
        var darkFigures = document.getElementById('today-figures');
        darkFigures.hidden = false;
        addFigure(darkFigures, 'date', entry.date);
        addFigure(darkFigures, 'solar noon', entry.solarNoon, 'big');
        addCulminations(darkFigures, entry);
        addFigure(darkFigures, 'clock', entry.place.zone + ', UTC' +
          (entry.utcOffsetMinutes < 0 ? '' : '+') + (entry.utcOffsetMinutes / 60));
        addFigure(darkFigures, 'place',
          Math.abs(entry.place.latitude).toFixed(4) + '°' + (entry.place.latitude < 0 ? 'S' : 'N') + ', ' +
          Math.abs(entry.place.longitude).toFixed(4) + '°' + (entry.place.longitude < 0 ? 'W' : 'E'));
        var darkNote = document.getElementById('today-dark-note');
        if (darkNote) {
          darkNote.hidden = false;
          // What is missing is named, and named as missing rather than left
          // as a gap a reader has to notice. There is no sunrise here and
          // this tower will not invent one; method B is not printed either,
          // because it will hand back a time for a crossing method A says
          // does not happen, and a lone number with nothing to disagree with
          // is not a cross-check however it is labelled.
          darkNote.textContent = 'There is no sunrise, no sunset, no length of ' +
            'day and no rising point on this date, and none of them are ' +
            'estimated here: a day with no horizon crossing has no horizon ' +
            'crossing to be wrong about. The second method is not printed for ' +
            'the same reason — it will name a time for a crossing the first ' +
            'method says does not happen, and a number with nothing to ' +
            'disagree with is not a cross-check. ' + culminationNote();
        }
        return;
      }
      renderToday(entry);
    } catch (error) {
      var loading = document.getElementById('today-loading');
      loading.hidden = false;
      // `today` is null when the throw came from working out what day it is
      // — which is now one of the ways this can fail, and the reader is owed
      // a sentence that does not read "stopped itself for null".
      loading.textContent = 'the reckoning stopped itself for ' +
        (today === null ? 'this morning' : today) + ' — ' +
        error.message + ' The ledger below is untouched by this: it is what was ' +
        'published on the days it was published, and it still recomputes or it ' +
        'says DRIFTED. This tower would rather print nothing than print a time ' +
        'it cannot stand behind.';
    }
  }

  // ---- what is coming ----
  //
  // The one forward claim on this page. Guarded like everything else that
  // can throw: `nextSeasonCrossing` refuses rather than estimates if it
  // cannot bracket a crossing, and Day 5's rule is that every throw makes
  // its call site a new join. So the failure is caught and said here,
  // where a reader is standing, and it does not take the rest of the room
  // with it.
  function renderComing() {
    var list = document.getElementById('coming-figures');
    var note = document.getElementById('coming-note');
    if (!list) return;

    // Same move as in `renderTodayOrSayWhyNot`, and the same reason: as of
    // Day 19 working out what day it is here can itself throw, so it belongs
    // inside the guard rather than one line above it.
    var crossing;
    try {
      crossing = window.Reckoning.nextSeasonCrossing(towerToday());
    } catch (error) {
      note.textContent = 'The reckoning could not find the next crossing — ' +
        error.message + ' Nothing is printed here rather than an estimate.';
      return;
    }

    addFigure(list, 'the next crossing', crossing.name, 'big');
    addFigure(list, 'when, by method A', crossing.instantUTC.replace('.000Z', 'Z') + ' UTC', 'big');
    addFigure(list, 'how far off', round(crossing.daysAway, 3) + ' days');
    addFigure(list, 'the sun’s longitude at that instant',
      round(crossing.targetLongitude, 0) + '°');
    addFigure(list, 'when, by method B — the second opinion',
      crossing.instantUTCMethodB.replace('.000Z', 'Z') + ' UTC');
    addFigure(list, 'the two methods, apart by',
      round(crossing.methodDifferenceHours, 2) + ' hours');
    addFigure(list, 'method B’s longitude, behind method A’s by',
      round(Math.abs(crossing.methodBLongitudeErrorDegrees), 4) + '°');
    addFigure(list, 'and the sun’s longitude moves, per day',
      round(crossing.longitudeDegreesPerDay, 4) + '°');

    note.textContent =
      'Divide the last two and you have the one above them: ' +
      round(Math.abs(crossing.methodBLongitudeErrorDegrees), 4) + ' ÷ ' +
      round(crossing.longitudeDegreesPerDay, 4) + ' = ' +
      round(Math.abs(crossing.methodBLongitudeErrorDegrees) /
        crossing.longitudeDegreesPerDay, 4) + ' of a day, which is ' +
      round(Math.abs(crossing.methodBLongitudeErrorDegrees) /
        crossing.longitudeDegreesPerDay * 24, 2) + ' hours. That is the whole of ' +
      'the disagreement, accounted for, and it leaves nothing over.';
  }

  // ---- the corner ----
  //
  // The reader's own place, worked by the same instrument. Everything here
  // runs on their machine and nothing is sent anywhere; the page has no
  // way to learn what they saw, which is the point rather than a
  // limitation. The zone is read off their own clock — the same tz
  // database the Paris figures above are asked about, and just as much a
  // fact about a parliament rather than the sky.
  function readerZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
    catch (error) { return 'UTC'; }
  }

  function numberFrom(id, fallback) {
    var raw = document.getElementById(id).value;
    var value = Number(raw);
    return (raw === '' || !isFinite(value)) ? fallback : value;
  }

  // The reader's own steepest-losing day, and the width of the plateau it
  // sits on. Both are functions of the skyline they typed, which is the
  // whole reason this is here and not on the page: at Paris's latitude the
  // answer walked from late September to late October across ten degrees of
  // hill, and the two ends of that walk are computed for wherever the tower
  // stands by renderStandingProse().
  //
  // The plateau is printed beside the date rather than under it. A date
  // alone reads as an answer of the same kind as the equinox instant, and
  // it is not one — twenty days sit within a second a day of the flat
  // peak. Day 14's fault was two numbers a reader fuses into one fact;
  // this is one number a reader takes for a sharper thing than it is, and
  // the repair is the same: print what it actually is beside it.
  function renderSteepestLoss(place, horizon, year) {
    var list = document.getElementById('steepest-figures');
    var note = document.getElementById('steepest-note');
    if (!list) return;
    list.replaceChildren();
    note.textContent = '';

    var loss;
    try {
      loss = window.Reckoning.steepestLoss(year, place, horizon);
    } catch (error) {
      note.textContent = 'The reckoning stopped itself working your year — ' + error.message;
      return;
    }
    if (loss.never) {
      note.textContent = 'The sun does not cross your horizon on any day of ' + year +
        ', so no day of that year loses more daylight than another.';
      return;
    }

    addFigure(list, 'the day your ' + year + ' loses most daylight', loss.date, 'big');
    addFigure(list, 'how much it loses that day',
      round(Math.abs(loss.changeSecondsPerDay), 1) + ' s');
    addFigure(list, 'how fast that falls away either side — the shape of the peak',
      loss.curvatureSecondsPerDaySquared === null ? '—'
        : round(loss.curvatureSecondsPerDaySquared, 4) + ' s per day, per day', 'big');
    addFigure(list, 'so, days within ' + loss.plateauThresholdSeconds +
      ' s a day of the peak', String(loss.plateauDays));
    addFigure(list, 'which run from', loss.plateauFrom + ' to ' + loss.plateauTo);
    addFigure(list, 'and what the shape above predicts that width should be',
      loss.plateauDaysPredicted === null ? '—'
        : round(loss.plateauDaysPredicted, 1) + ' days');

    // The comparison used to read "a flat, open horizon at Paris puts it on
    // 2026-09-25" — a city and a date both typed in by hand, in running
    // code. Day 19: the city was one the tower could leave, and the date was
    // a fact about a year the reader is free to change. Both are one call
    // away, so both are computed. This is Day 4's rule in a new room: the
    // hand-written figure marks the exact spot where a cheap computation had
    // not been done.
    var here = window.Reckoning.STANDING.place;
    var flatHere = null;
    try {
      flatHere = window.Reckoning.steepestLoss(year, here, { obstructionDegrees: 0 });
    } catch (error) {
      flatHere = null;
    }

    note.textContent = 'You gave us ' + round(loss.horizon.obstructionDegrees, 1) +
      '° of skyline, and it puts your steepest day on ' + loss.date + '. ' +
      (flatHere === null || flatHere.never
        ? 'We could not work the same year on a flat, open horizon where this tower ' +
          'stands, so there is no comparison printed here rather than a stale one. '
        : 'A flat, open horizon at ' + here.name + ' puts it on ' + flatHere.date +
          ' — that is how far this one number moves for what you typed. ') +
      'Read the shape before you write the date down: the width is not a fact ' +
      'about your year, it is a fact about the one-second line we drew, and it ' +
      'grows as the square root of wherever you draw it — 2 × √(2 × threshold ÷ ' +
      'shape). Half a second would have given you about ' +
      (loss.curvatureSecondsPerDaySquared === null ? '—'
        : round(2 * Math.sqrt(1 / loss.curvatureSecondsPerDaySquared), 0)) +
      ' days and five seconds about ' +
      (loss.curvatureSecondsPerDaySquared === null ? '—'
        : round(2 * Math.sqrt(10 / loss.curvatureSecondsPerDaySquared), 0)) +
      ', with equal right. The shape is the part that does not move when we ' +
      'change our minds.';
  }

  function renderCorner() {
    var figures = document.getElementById('corner-figures');
    var verdict = document.getElementById('corner-verdict');
    figures.replaceChildren();
    verdict.textContent = '';

    var zone = readerZone();
    var latitude = numberFrom('corner-lat', 48.8566);
    var longitude = numberFrom('corner-lon', 2.3522);
    var skyline = Math.min(89, Math.max(0, numberFrom('corner-skyline', 0)));
    var height = Math.max(0, numberFrom('corner-height', 0));
    var date = document.getElementById('corner-date').value || window.Reckoning.todayAt(zone);

    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      verdict.textContent = 'A latitude runs from −90 to 90 and a longitude from −180 to 180. ' +
        'Nothing was reckoned.';
      return;
    }

    var place = { name: 'your corner', latitude: latitude, longitude: longitude, zone: zone };
    var result;
    try {
      result = window.Reckoning.corner(date, place, {
        obstructionDegrees: skyline, eyeHeightMetres: height
      });
    } catch (error) {
      // Same rule as the room above: a guard that fires is said out loud
      // where the reader is standing, not swallowed.
      verdict.textContent = 'The reckoning stopped itself for your corner — ' + error.message;
      return;
    }

    if (result.never) {
      // Two different silences, and they must not wear the same sentence.
      // Above the polar circles the sun really does stay under or over all
      // day. But a tall enough skyline produces the same `never` for a
      // wholly different reason — at Paris today it takes about 58 degrees
      // — and telling a reader in a deep valley that the sun does not rise
      // would be this tower confidently saying a false thing about the
      // sky. Ember's find, Day 7, running the corner out past where it
      // stops meaning what it says.
      if (skyline > 0 && !result.flat.never) {
        verdict.textContent = 'With a skyline that high the sun never clears it here on ' +
          'this date — it rises, but not above ' + round(skyline, 1) + ' degrees of your ' +
          'horizon. On the open horizon this place would see it at ' +
          result.flat.sunrise + ' and lose it at ' + result.flat.sunset + '. Nothing is ' +
          'wrong with the reckoning; you have asked it about a horizon the sun does not ' +
          'get over.';
        return;
      }
      verdict.textContent = neverWords(result.never, 'your corner') +
        ' That is not this page failing; it is what the arithmetic says about ' +
        'where you are on this date, and you can check it by staying up.';
      return;
    }

    var mine = result.mine;
    addFigure(figures, 'date', result.date);
    addFigure(figures, 'sunrise where you are', mine.sunrise, 'big');
    addFigure(figures, 'sunset where you are', mine.sunset, 'big');
    addFigure(figures, 'length of day', mine.dayLength);
    addFigure(figures, 'clock', zone + ', UTC' +
      (mine.utcOffsetMinutes < 0 ? '−' : '+') + round(Math.abs(mine.utcOffsetMinutes) / 60, 2));
    addFigure(figures, 'second method (USNO) says', mine.crossCheck
      ? mine.crossCheck.sunrise + ' and ' + mine.crossCheck.sunset : 'no result here');
    addFigure(figures, 'on a flat, open horizon it would be',
      result.flat.sunrise + ' and ' + result.flat.sunset);
    addFigure(figures, 'what your skyline and height are worth at sunrise',
      signedSeconds(result.shiftSecondsSunrise));
    addFigure(figures, 'what they are worth at sunset',
      signedSeconds(result.shiftSecondsSunset));
    addFigure(figures, 'your horizon dips by',
      round(result.horizon.dipDegrees * 60, 2) + ' arcminutes');
    addFigure(figures, 'one more degree of skyline would be worth',
      result.secondsPerDegreeOfHorizon === null ? '—'
        : round(result.secondsPerDegreeOfHorizon, 0) + ' s from where you are now');
    addFigure(figures, 'the sun takes this long to lift its own width',
      result.secondsToLiftItsOwnWidth === null ? '—'
        : round(result.secondsToLiftItsOwnWidth, 0) + ' s');

    // The clockless check, worked at the reader's own skyline. This is
    // the only thing in the corner that does not ask them what time it
    // is, and it is the figure most changed by what they typed — which
    // is exactly why it could not be left on the page above.
    if (result.risingPointDegrees !== null && result.risingPointDegrees !== undefined) {
      addFigure(figures, 'where the sun comes up for you',
        round(result.risingPointDegrees, 2) + '° — ' + quarterWords(result.risingPointDegrees), 'big');
      addFigure(figures, 'where it goes down for you',
        result.settingPointDegrees === null ? '—'
          : round(result.settingPointDegrees, 2) + '° — ' + quarterWords(result.settingPointDegrees));
      addFigure(figures, 'on a flat, open horizon it would come up at',
        round(result.risingPointFlatDegrees, 2) + '°');
      addFigure(figures, 'so your skyline and height move the rising point by',
        result.risingPointShiftArcminutes === null ? '—'
          : (result.risingPointShiftArcminutes < 0 ? '−' : '+') +
            round(Math.abs(result.risingPointShiftArcminutes), 1) + '′ — ' +
            round(Math.abs(result.risingPointShiftArcminutes) /
              window.Reckoning.SUN_DIAMETER_ARCMINUTES, 2) + ' sun-widths');
      addFigure(figures, 'step to tomorrow, at your horizon',
        result.risingPointStepArcminutes === null ? '—'
          : round(result.risingPointStepArcminutes, 2) + '′');
      addFigure(figures, 'step to tomorrow, on a flat plain',
        result.risingPointStepFlatArcminutes === null ? '—'
          : round(result.risingPointStepFlatArcminutes, 2) + '′');
    }

    renderSteepestLoss(place, { obstructionDegrees: skyline, eyeHeightMetres: height },
      Number(result.date.slice(0, 4)));

    // The number that keeps this honest. Said in full rather than left in
    // the figures, because an invitation that does not say what it cannot
    // catch is a claim about how open-handed we are, not about the sky.
    var arcmin = result.arcminutesPerMinuteOfError;
    verdict.textContent = arcmin === null ? '' :
      'What this can catch, and what it cannot. Where you are, on this date, one ' +
      'minute of error in our arithmetic is worth about ' + round(arcmin, 1) +
      ' arcminutes of horizon — and the sun itself is ' +
      window.Reckoning.SUN_DIAMETER_ARCMINUTES + ' arcminutes wide. So a minute of ' +
      'our error hides inside a stretch of skyline narrower than the sun you are ' +
      'watching, and you would have to know your own horizon better than that to ' +
      'convict us of it. This tower published a sunset that was wrong by about a ' +
      'minute and a half for three days running, and one reader standing outside ' +
      'could not have told. Five minutes is a different matter: that is about ' +
      round(5 * arcmin / 60, 1) + ' degrees, which anyone with a rooftop can rule ' +
      'out. So this corner is a real check against a gross error and no check at ' +
      'all against a fine one. Three things stand between our arithmetic and what ' +
      'you see, not two. Two of them belong to your place and pull opposite ways: ' +
      'something in the way can only ever make sunrise late, being up high only ' +
      'ever early, and both are worked above from what you typed. The third is ' +
      'yours and this page cannot take it from you — the sun is a disk, and one ' +
      'watcher calls it up when the first edge shows while another waits for the ' +
      'whole of it. Here today that is ' +
      (result.secondsToLiftItsOwnWidth === null ? 'some seconds'
        : round(result.secondsToLiftItsOwnWidth, 0) + ' seconds') +
      ' between two honest people looking at the same horizon, which is wider ' +
      'than the fault we published. We print the instant the sun’s upper edge ' +
      'first clears — that is what the 90.833° above means. After those three, ' +
      'what is left over is ours or the air’s. The air we cannot get at from ' +
      'here. Ours you can.';
  }

  function startCorner() {
    var form = document.getElementById('corner-form');
    if (!form) return;
    var zone = readerZone();
    document.getElementById('corner-zone').textContent = 'your clock: ' + zone;
    document.getElementById('corner-date').value = window.Reckoning.todayAt(zone);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      renderCorner();
    });
    renderCorner();
  }

  // ---- the room's own prose, which had said Paris in a hand's voice ----
  //
  // Day 23. For four days the note one screen up in this file read: *the
  // rest of this room's prose still says Paris in a hand's voice, and going
  // through it is the work the move owes, not the plumbing.* That deferral
  // was right about the line and wrong about the plan. "A hand moves them on
  // the morning the tower moves" is a promise to hand-write, on a rushed
  // Sunday, seven sentences a computation can carry — Day 4's rule with a
  // date on it.
  //
  // Ember cut the seven three ways rather than the two I brought it, and the
  // three want three different repairs:
  //
  //   * A claim *about the place this tower stands in* — "if you are in X,
  //     the sun is the experiment" — wants the name, because its whole work
  //     is telling a reader which city to go outside in. Those are the
  //     `[data-standing-place]` slots below.
  //   * A sentence that only borrowed the city as a stand-in for *anywhere*
  //     — the season crossing is "not a fact about X, or about any place" —
  //     wants the name gone, not computed. Computing it there would read
  //     backward: the sentence is about the absence of a place. Rewritten in
  //     the HTML, no mount, nothing here.
  //   * A hand-typed figure standing above a live one that already works the
  //     same thing out — "on a flat plain at Paris it falls in late
  //     September" — wants computing, not trimming. Deleting it would take
  //     the motivation out with the stale date: that sentence is what tells
  //     a reader the effect is *large* before they have typed a skyline in,
  //     and `#steepest-note` only speaks after they have.
  //
  // What the static HTML holds in a filled slot before this runs is *not* a
  // city. It is "the city this tower stands in" — true anywhere, replaced by
  // the name in milliseconds for any reader whose script runs at all. Ash on
  // why that is not the tidy answer wearing a coat: it is true until replaced
  // by truer, and a reader with no script is told that the requirement
  // exists — you must be in this tower's place — without being told a city
  // they might no longer be able to trust.
  function renderStandingProse() {
    // This runs first in start(), so it must not be the thing that takes the
    // room down — a malformed instrument is exactly the case
    // renderTodayOrSayWhyNot() below exists to *say*, and it cannot say it if
    // this threw on the way past. An unfilled slot is a true sentence.
    var standing = window.Reckoning.STANDING;
    if (!standing || !standing.place || !standing.place.name) return;
    var name = standing.place.name;
    var slots = document.querySelectorAll('[data-standing-place]');
    for (var i = 0; i < slots.length; i++) slots[i].textContent = name;

    var spread = document.getElementById('steepest-spread');
    if (!spread) return;

    // Every call here is a join that can fail, and the whole point of the
    // sentence is that it is true of *wherever we are* — including a place
    // where the sun does not clear the horizon at all, where `steepestLoss`
    // has no answer and is right not to have one (Day 20). On any of those
    // the static sentence stands: it names no city and no date, so it is
    // never the wrong one. Day 5, one room along — a check that protects a
    // number by taking down the room it was printed in has moved the
    // silence, not removed it.
    var here = window.Reckoning.STANDING.place;
    var flat, ridge, year;
    try {
      year = Number(window.Reckoning.todayAt(here.zone).slice(0, 4));
      flat = window.Reckoning.steepestLoss(year, here, { obstructionDegrees: 0 });
      ridge = window.Reckoning.steepestLoss(year, here, { obstructionDegrees: 10 });
    } catch (error) {
      return;
    }
    if (!flat || !ridge || flat.never || ridge.never) return;

    spread.textContent = 'On a flat plain at ' + here.name + ' it falls on ' +
      flat.date + '; behind ten degrees of hill, on ' + ridge.date + '.';
  }

  // ---- the pledge ----
  //
  // Day 25. Everything else on this page is a claim about the sun, and the
  // whole design of this room is that a stranger with a watch can convict it.
  // This one cannot be convicted that way and the section says so on its own
  // face: `reckon()` is pure arithmetic on the date handed it, so the figures
  // below are computable today and will agree with themselves on the morning
  // — Day 16's tautology, which is why no forward row goes in the cold
  // ledger. They are printed anyway, and for a reason that is not the wager:
  // a reader is owed what this tower expects to be saying from there, so that
  // the first morning at the new place is a *continuation* of a published
  // sentence rather than a fresh start nobody can line up against anything.
  //
  // What is genuinely failable here is the pledge itself, and it fails only
  // by our act. So BROKEN is not a rendering of an error; it is the page
  // accusing the house, unprompted, on every load, in a browser we cannot
  // reach. Guarded like the rest of the room (Day 5): a throw here must not
  // take down the figures below it.
  function renderPledge() {
    var section = document.getElementById('pledge-section');
    if (!section) return;
    var standing = window.Reckoning.STANDING;
    var verdict;
    try {
      verdict = window.Reckoning.pledgeStanding(
        standing, window.Reckoning.todayAt(standing.place.zone));
    } catch (error) {
      return;
    }
    if (!verdict || verdict.state === 'NONE') return;

    var pledge = verdict.pledge;
    var to = pledge.place.name;
    var said = document.getElementById('pledge-said');
    var note = document.getElementById('pledge-note');
    var figures = document.getElementById('pledge-figures');

    if (verdict.state === 'PLEDGED') {
      said.innerHTML = 'On <strong>' + pledge.on + '</strong> this tower ' +
        'stands in <strong>' + to + '</strong>. It is standing in ' +
        standing.place.name + ' as you read this, and it said so on ' +
        pledge.announced + ' — before going, so that the going can be wrong.';
    } else if (verdict.state === 'KEPT') {
      said.innerHTML = 'It said on ' + pledge.announced + ' that it would ' +
        'stand in <strong>' + to + '</strong> from ' + pledge.on +
        '. It does, and has since ' + standing.since + '.';
    } else {
      section.className += ' reckoning--broken';
      said.innerHTML = '<strong>BROKEN.</strong> This tower said on ' +
        pledge.announced + ' that it would stand in ' + to + ' on ' +
        pledge.on + '. It is ' + verdict.today + ' here and it stands in ' +
        standing.place.name + '. It did not keep its word. Nothing is ' +
        'broken in the arithmetic; this sentence is about the keeper, and ' +
        'it will stay here until a hand goes and mends what it names.';
    }

    // The figures are the destination's, not this place's, and they are
    // labelled with the place they belong to for the reason Day 18 made the
    // ledger say `unchanged at Paris`: a number and the place it is about
    // must arrive in a reader's eye together or the reader supplies the
    // wrong one.
    var entry;
    try {
      entry = window.Reckoning.reckon(pledge.on, pledge.place);
    } catch (error) {
      note.textContent = 'The instrument will not reckon ' + to + ' on ' +
        pledge.on + ' — ' + error.message + ' The pledge above stands ' +
        'regardless: it is a promise about where this tower will be, not ' +
        'about what it will be able to compute there.';
      section.hidden = false;
      return;
    }

    if (entry.never) {
      addFigure(figures, 'first morning there', pledge.on);
      note.textContent = 'At ' + to + ' on ' + pledge.on + ' the sun ' +
        neverWords(entry.never, to).toLowerCase() + ' — so there are no ' +
        'times to print, and that is a true thing about the place rather ' +
        'than a fault.';
      section.hidden = false;
      return;
    }

    addFigure(figures, 'first morning there', pledge.on);
    addFigure(figures, 'sunrise at ' + to, entry.sunrise, 'big');
    addFigure(figures, 'sunset at ' + to, entry.sunset, 'big');
    addFigure(figures, 'length of day', entry.dayLength, 'big');
    if (entry.changeSinceYesterdayMinutes !== null &&
        entry.changeSinceYesterdayMinutes !== undefined) {
      var d = minutesToHM(entry.changeSinceYesterdayMinutes);
      addFigure(figures, 'the drift there',
        (d.sign < 0 ? '−' : '+') + d.minutes + 'm ' +
        (d.seconds < 10 ? '0' : '') + d.seconds + 's — ' +
        (d.sign < 0 ? 'shorter' : 'longer') + ' than the day before', 'big');
    }

    // Why this place and not another, in the tower's own terms. Both halves
    // are read off the entry rather than typed, so a hand changing the
    // destination cannot leave a stale reason standing under a new city.
    var reasons = [];
    if (entry.changeSinceYesterdayMinutes > 0) {
      reasons.push('the drift there runs the other way — this tower has ' +
        'published twenty-five days of shortening, and every sentence it ' +
        'has written about the drift quietly assumed that sign');
    }
    // The same test `tools/survey.js` prints in its day-line column, and it
    // is read off `working` rather than invented: method A counts minutes
    // from 00:00 UTC of the civil date and is free to run outside [0, 1440)
    // when an event falls on the far side of a UTC midnight (Day 21). The
    // first draft of this clause asked `entry.working.dayLineShift`, which
    // does not exist and never has — a condition that is `undefined` is
    // falsy, so the reason would simply never have printed and nothing would
    // have said why.
    var w = entry.working;
    if (w && (w.sunriseUTCMinutes < 0 || w.sunriseUTCMinutes >= 1440 ||
              w.sunsetUTCMinutes < 0 || w.sunsetUTCMinutes >= 1440)) {
      reasons.push('its events fall on the far side of a UTC midnight, so ' +
        'the join between the two methods is load-bearing there rather ' +
        'than merely exercised');
    }
    note.textContent = reasons.length
      ? 'Why there: ' + reasons.join('; ') + '.'
      : '';

    renderCollision(pledge, standing);
    section.hidden = false;
  }

  // Day 32. A second forward claim, and a different kind from the pledge
  // above it. The pledge says where this tower will be; this says what its
  // own machinery will do when it gets there, and it is failable in the one
  // way the figures are not — `reckon()` is pure on the date handed it, so a
  // destination's sunrise computed today is guaranteed to agree with itself
  // on the day (Day 16's tautology). This is not that. It is a claim about an
  // *instant*, and whether it comes true depends on an hour nobody here
  // controls.
  //
  // Day 33 — three things in this paragraph were wrong on the eve of the
  // move it was written about, and the comment that stood here was one of
  // them. It read: *both halves are computed, nothing below is typed, so a
  // hand moving the pledge cannot leave a stale window standing under a new
  // city.* The stale window was not the city's. It was the clock's, it was
  // typed, and it was typed one line under the promise that nothing below
  // was — Day 8, exactly: the part of a check that gets no scrutiny is the
  // part offered as the reason to trust it.
  //
  // 1. **The mark it told a reader to look for does not exist.** It said the
  //    record would carry *a gap with a different place on either side of
  //    it*, and invited a reader to go and read the ledger after the date.
  //    The ledger is filed by date, and a westward crossing loses a morning
  //    without losing a day: the row for `on` is written the morning after,
  //    from the new place, and the dates run straight through. Worse, the
  //    two outcomes offered are indistinguishable by the dates — a Sunday
  //    that did *not* collide also leaves a row dated `on` from the new
  //    place. The witness is `publishedAt`, and the paragraph never named
  //    it. A reader doing exactly as told would have found a dense book and
  //    concluded the collision did not happen.
  //
  // 2. **The rule behind that sentence had never once described this
  //    tower.** `CLAUDE.md` has said since Day 19 that a move-gap is
  //    readable off the cold record — two rows either side of a hole naming
  //    different places. This tower has made one move, Paris to Auckland on
  //    2026-08-30, and the book runs 08-29 Paris → 08-30 Auckland with no
  //    hole at all. Thirty-one rows, one move, not a single gap in any of
  //    it. The rule was reasoned out and written down as a *reading of the
  //    record* by a hand that never opened the record.
  //
  // 3. **The hour window was a memory of a list the page already holds.**
  //    *About 02:15 to 02:35 UTC* was false of 14 of the 31 rows; the true
  //    span is 02:03 to 02:40. It is read off `publishedAt` now, by
  //    `fillCollisionHours` below, from the same fetch that draws the
  //    ledger. Day 4: the hand-written figure marks the spot where a cheap
  //    computation was not done.
  //
  // What is typed here now: nothing but prose. Every date, place, hour and
  // span comes from the instrument or from the ledger's own bytes.
  function renderCollision(pledge, standing) {
    var host = document.getElementById('pledge-collision');
    if (!host) return;
    host.textContent = '';
    var here, there;
    try {
      here = window.Reckoning.civilDayStartUTCMinutes(pledge.on, standing.place.zone);
      there = window.Reckoning.civilDayStartUTCMinutes(pledge.on, pledge.place.zone);
    } catch (error) {
      return;
    }
    // Moving east, or to a zone that starts its day no later than this one,
    // cannot collide: the arriving morning is a day the ledger has not
    // reached. Say nothing rather than manufacture a claim — a check with an
    // empty domain that speaks anyway is worse than one that is silent
    // (Day 21, Day 27, Day 31).
    if (!(there > here)) return;

    var gapHours = (there - here) / 60;
    var opens = clockFromUTCMinutes(there);
    var closes = clockFromUTCMinutes(here + 1440);
    var morningAfter = window.Reckoning.shiftDate(pledge.on, 1);

    host.innerHTML =
      'And one more thing that can fail, of a different kind from the ' +
      'figures. The clock in <strong>' + pledge.place.name + '</strong> ' +
      'runs ' + gapHours.toFixed(0) + ' hours behind the clock here, so ' +
      pledge.on + ' begins there at <strong>' + opens + ' UTC</strong> and ' +
      'had already begun here at ' + clockFromUTCMinutes(here) + ' UTC the ' +
      'day before. In the hours between, the two places disagree about what ' +
      'day it is. This tower writes one row a morning and refuses to rewrite ' +
      'a published one, so if the keeper\'s morning lands in that stretch, ' +
      'the tower arrives, asks what day it is where it now stands, and is ' +
      'handed a date its own ledger already holds — written from ' +
      standing.place.name + '. It will publish <strong>nothing that ' +
      'morning</strong>. The two agree again from ' + opens + ' to ' +
      closes + ' UTC; a morning there writes a row as usual.' +
      '<br><br>' +
      '<strong>And the record will not show that where you would look for ' +
      'it.</strong> This ledger is filed by date, and a morning lost this ' +
      'way costs no date: the row for ' + pledge.on + ' is simply written ' +
      'the morning after, from ' + pledge.place.name + ', and the dates run ' +
      'straight through with no hole in them. What goes missing is a ' +
      'morning, not a day — and a Sunday that did <em>not</em> collide ' +
      'leaves a row dated ' + pledge.on + ' from ' + pledge.place.name + ' ' +
      'too, so the dates cannot tell the two apart at all. The field that ' +
      'keeps the difference is <code>publishedAt</code>: if the collision ' +
      'happens, no row below will carry a <code>publishedAt</code> on ' +
      pledge.on + ' UTC, and the row dated ' + pledge.on + ' will show it ' +
      'was written on ' + morningAfter + '. Read that field after ' +
      pledge.on + ', not the dates. ' +
      '<span id="collision-hours"></span>' +
      'We do not know which yet, and we have said so before finding out.';
  }

  // The hour this tower's morning has actually fallen at, read off the
  // ledger's own `publishedAt` rather than remembered. It is the whole of
  // whether the collision above lands: the two zones agree for four hours a
  // day, and every morning on record has missed that window.
  //
  // Filled from the ledger fetch, so it is absent when the ledger will not
  // open — the sentence lives entirely inside its own span for that reason,
  // and the paragraph reads without it. A page that cannot open its record
  // should say less, not guess (Day 19: a guard that takes down the room it
  // was protecting has moved the silence, not removed it).
  function fillCollisionHours(entries) {
    var host = document.getElementById('collision-hours');
    if (!host) return;
    var stamps = entries
      .map(function (entry) { return entry.publishedAt; })
      .filter(function (stamp) { return typeof stamp === 'string' && stamp.length >= 16; })
      .map(function (stamp) { return stamp.slice(11, 16); })
      .sort();
    if (!stamps.length) return;
    host.textContent = 'Every one of the ' + stamps.length + ' mornings in ' +
      'the ledger below was written between ' + stamps[0] + ' and ' +
      stamps[stamps.length - 1] + ' UTC, which is outside that window. ';
  }

  // Day 34. The ledger read the other way round.
  //
  // Everywhere else on this page a row is a claim about a *date*. Here it is
  // a receipt for a *morning*: `publishedAt` is the UTC day this tower woke
  // and spoke, and it is the only field in the record that can show a lost
  // morning, because the dates cannot. That was Day 33's finding — a westward
  // crossing costs a morning and no date, so the two outcomes a reader was
  // invited to tell apart leave identical date sequences.
  //
  // **Why this is a section and not a sentence in the pledge.**
  // `renderCollision` above draws only while the pledged zone runs behind the
  // standing one; the moment the move lands those are one zone and the whole
  // instruction — *read `publishedAt`, not the dates* — goes silent, about an
  // hour before the reader it was written for could act on it. Ash's cut is
  // why this is not a report on that paragraph: a narrator's domain is one
  // event and empties when the event is old; this asks a question of the
  // whole record and has an answer on every morning there has ever been one.
  // The pledge that occasioned it is superseded weekly; this is not.
  //
  // **It never says why**, and that is load-bearing rather than modest. A UTC
  // day with nothing written in it is exactly as consistent with the crossing
  // as with a morning nobody woke the tower for. Day 19 claimed the two were
  // separable by the places either side of the hole and Day 33 found that
  // paragraph had never once described this record — the told book. So the
  // neighbouring places are printed as what they are, two facts standing
  // beside a gap, and the tool draws no line between them.
  //
  // **It reports zero.** A check that only speaks when it has something to
  // show is built for one event wearing an instrument's face, and its silence
  // reads as an all-clear it never earned (Day 21, Day 27, Day 31 — an empty
  // domain always says yes). So the count of mornings written goes out on
  // every load, and *none missing* is a published claim that can be wrong.
  function renderMornings(entries) {
    var host = document.getElementById('mornings-report');
    if (!host) return;
    host.replaceChildren();

    // A row with no usable stamp is not a morning we can date. Say how many
    // were set aside rather than quietly shrinking the span they would have
    // widened — a count taken over a filtered list is a fact about the
    // filter until the filter is printed too.
    var dated = [];
    var undatable = 0;
    (entries || []).forEach(function (entry) {
      var stamp = entry && entry.publishedAt;
      if (typeof stamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(stamp)) {
        undatable += 1;
        return;
      }
      dated.push({
        morning: stamp.slice(0, 10),
        date: entry.date,
        place: (entry.place && entry.place.name) || 'an unnamed place'
      });
    });

    if (!dated.length) {
      host.appendChild(el('p', 'loading',
        'no row in the ledger carries a morning this page can read, so ' +
        'there is nothing here to count. That is a statement about the ' +
        'record, not about the tower.'));
      return;
    }

    dated.sort(function (a, b) { return a.morning < b.morning ? -1 : a.morning > b.morning ? 1 : 0; });
    var spoken = Object.create(null);
    dated.forEach(function (row) {
      if (!spoken[row.morning]) spoken[row.morning] = row;
    });

    var first = dated[0].morning;
    var last = dated[dated.length - 1].morning;
    var span = Math.round(
      (Date.parse(last + 'T00:00:00Z') - Date.parse(first + 'T00:00:00Z')) / 86400000) + 1;
    if (!isFinite(span) || span < 1 || span > 40000) {
      host.appendChild(el('p', 'loading',
        'the mornings in this record run from ' + first + ' to ' + last +
        ', which is not a span this page is willing to walk. Nothing is ' +
        'counted rather than counted wrongly.'));
      return;
    }

    var lost = [];
    for (var i = 0; i < span; i += 1) {
      var day = window.Reckoning.shiftDate(first, i);
      if (!spoken[day]) lost.push(day);
    }

    var written = Object.keys(spoken).length;
    var head = 'From ' + first + ' to ' + last + ' is ' + span +
      ' UTC days, and this tower spoke on ' + written + ' of them';
    head += lost.length
      ? '. ' + lost.length + (lost.length === 1 ? ' morning is' : ' mornings are') + ' missing.'
      : ' — none missing.';
    host.appendChild(el('p', 'standing', head));
    // The sight limit, said in the same breath as the count. The span stops
    // at the most recent row, so a morning lost *since* that row cannot be
    // inside it — the loss becomes visible only when the next row lands and
    // stretches the span over it. Ember's, on the morning this was built: a
    // clean report here can be true and not yet finished being true, and a
    // reader who takes it as final is reading a check past its own edge.
    host.appendChild(el('p', 'standing note',
      'This looks between ' + first + ' and ' + last + ' and no further. A ' +
      'morning lost after ' + last + ' is not inside the span yet and cannot ' +
      'be counted here; it appears when the next row lands and carries the ' +
      'span over it. A clean reading is a reading up to ' + last + '.'));
    if (dated.length !== written) {
      host.appendChild(el('p', 'standing note',
        dated.length + ' rows carry those ' + written + ' mornings, so at ' +
        'least one morning wrote more than one row.'));
    }
    if (undatable) {
      host.appendChild(el('p', 'standing note',
        undatable + (undatable === 1 ? ' row carries' : ' rows carry') +
        ' no readable morning and is left out of the count above.'));
    }

    lost.forEach(function (day) {
      var beforeDay = null;
      var afterDay = null;
      Object.keys(spoken).forEach(function (had) {
        if (had < day && (beforeDay === null || had > beforeDay)) beforeDay = had;
        if (had > day && (afterDay === null || had < afterDay)) afterDay = had;
      });
      var before = beforeDay && spoken[beforeDay];
      var after = afterDay && spoken[afterDay];
      var line = 'Nothing was written on ' + day + '.';
      if (before) {
        line += ' The morning before it, ' + beforeDay + ', wrote the row ' +
          'dated ' + before.date + ' at ' + before.place + '.';
      }
      if (after) {
        line += ' The morning after it, ' + afterDay + ', wrote the row ' +
          'dated ' + after.date + ' at ' + after.place + '.';
      }
      line += ' Why is not in the record.';
      host.appendChild(el('p', 'standing note', line));
    });
  }

  // ---- the two clocks ----
  //
  // This tower keeps two counts of what day it is and until Day 35 nothing
  // had ever held them against each other. `scripts/build.sh` stamps
  // `Day N` from `date -u` — a UTC count, frozen into a static file at
  // deploy time and identical in every reader's browser until the next one.
  // `tools/reckon.js` dates its row from `standingToday()`, which is Day 19's
  // finding: what governs is the calendar of the place the tower stands in.
  //
  // Those are two different questions and they part for |offset| hours of
  // every day, everywhere but on the meridian. They agreed on the first
  // thirty-one rows of this record for a reason that is a fact about a
  // routine and not about a calendar: at the hour this tower is woken, Paris
  // and Auckland were both past midnight on the same date as UTC, and
  // Anchorage is not. So the run hour is read off the record's own stamps
  // here rather than remembered — Day 33, where a typed window was false of
  // fourteen of the rows it claimed to describe.
  //
  // **The second question is the one worth having.** Day 17 closed the write
  // gate and said, of a row claiming a morning that was not its own, that
  // *no recompute can ever catch that, because the numbers in it are right*.
  // That has stood as a permanent blind spot for eighteen days. It is not
  // one. A row carries an instant (`publishedAt`, UTC) and a place, and the
  // place's clock at that instant is a fact — so the row's own date can be
  // held against the day it actually was where the row was written. Nothing
  // is recomputed; two fields that have been in every row since the first
  // are read together for the first time. Day 18's shape exactly.
  //
  // Its limit is Day 18's limit too, and it is printed rather than implied:
  // a hand that moves the date *and* the stamp together produces a row that
  // accounts for itself perfectly. The commits are the only witness to that.
  function renderTwoClocks(entries) {
    var host = document.getElementById('two-clocks-report');
    if (!host) return;
    host.replaceChildren();

    var readable = [];
    var unreadable = 0;
    (entries || []).forEach(function (entry) {
      var stamp = entry && entry.publishedAt;
      var date = entry && entry.date;
      var zone = entry && entry.place && entry.place.zone;
      if (typeof stamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(stamp) ||
          typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          typeof zone !== 'string' || !zone) {
        unreadable += 1;
        return;
      }
      var here;
      try {
        here = window.Reckoning.civilDateAt(new Date(stamp), zone);
      } catch (err) {
        // A zone this clock has never heard of is not a place the row can be
        // checked at. It is set aside and counted, never quietly passed.
        unreadable += 1;
        return;
      }
      readable.push({
        date: date,
        stamp: stamp,
        utcDay: stamp.slice(0, 10),
        here: here,
        place: (entry.place && entry.place.name) || 'an unnamed place'
      });
    });

    if (!readable.length) {
      host.appendChild(el('p', 'loading',
        'no row in this record carries the date, the instant and the place ' +
        'that this reading needs, so there is nothing here to hold against ' +
        'anything. That is a statement about the record, not about the tower.'));
      return;
    }

    var split = readable.filter(function (r) { return r.utcDay !== r.date; });
    var unaccounted = readable.filter(function (r) { return r.here !== r.date; });

    // Both counts go out on every load, zero included. A check that speaks
    // only when it has something to show is built for one event, and its
    // silence reads as an all-clear it never earned.
    host.appendChild(el('p', 'standing',
      'Of the ' + readable.length + ' rows this reading can open, ' +
      split.length + ' ' + (split.length === 1 ? 'was' : 'were') +
      ' written at an instant when the tower’s own calendar and UTC ' +
      'named different days' +
      (split.length ? '.' : ' — none.') +
      ' ' + (unaccounted.length
        ? unaccounted.length + (unaccounted.length === 1 ? ' row is' : ' rows are') +
          ' unaccounted: its date is not what its own clock said when it was stamped.'
        : 'Every one of them is dated the day it was where it was written — none unaccounted.')));

    if (unreadable) {
      host.appendChild(el('p', 'standing note',
        unreadable + (unreadable === 1 ? ' row carries' : ' rows carry') +
        ' no date, no readable instant or no clock this page has heard of, ' +
        'and is left out of both counts above.'));
    }

    split.forEach(function (row) {
      var behind = row.date < row.utcDay;
      host.appendChild(el('p', 'standing note',
        'The row dated ' + row.date + ' was stamped ' + row.stamp + ', which ' +
        'is ' + row.utcDay + ' in UTC. At ' + row.place + ' that instant was ' +
        row.here + ', so the tower’s own day stood ' +
        (behind ? 'behind' : 'ahead of') + ' UTC when it wrote.'));
    });

    unaccounted.forEach(function (row) {
      host.appendChild(el('p', 'standing note',
        'UNACCOUNTED. The row dated ' + row.date + ' was stamped ' + row.stamp +
        ', and at ' + row.place + ' that instant was ' + row.here + '. A row ' +
        'is supposed to be dated the day it was where it was written. This ' +
        'one is not, and no arithmetic in it is wrong.'));
    });

    // The hours the tower is actually woken, read off the record rather than
    // recalled. Day 33: a typed window was false of fourteen of the thirty-one
    // rows it described, and sat one line under a comment promising nothing
    // below it was typed.
    var minutes = readable.map(function (r) {
      return Number(r.stamp.slice(11, 13)) * 60 + Number(r.stamp.slice(14, 16));
    }).filter(function (m) { return isFinite(m); });
    if (minutes.length) {
      var lo = Math.min.apply(null, minutes);
      var hi = Math.max.apply(null, minutes);
      host.appendChild(el('p', 'standing note',
        'Every row in this record was stamped between ' +
        clockFromUTCMinutes(lo) + ' and ' + clockFromUTCMinutes(hi) +
        ' UTC. That window is the whole reason the two counts have agreed as ' +
        'often as they have, and it is a fact about when this tower is woken ' +
        'rather than about any calendar.'));
    }

    renderStandingBand(host);
    renderFooterAgainstBook(host, readable);

    host.appendChild(el('p', 'standing note',
      'What this cannot see: a hand that moves a row’s date and its ' +
      'stamp together leaves a row that accounts for itself perfectly. Every ' +
      'clock offset above is asked of this machine’s own time-zone ' +
      'database, which is revised from time to time by the countries that ' +
      'set the clocks — so a row can become unaccounted years later ' +
      'without anybody here touching it.'));
  }

  // The standing claim: how much of every day the two counts must differ,
  // given where the tower stands. In minutes rather than hours, because not
  // every zone's offset is a whole hour — Kathmandu is +5:45, Chatham +12:45
  // — and a band truncated to hours would be wrong on both edges the first
  // morning this tower stood in one of them. Ember's, before it could bite.
  function renderStandingBand(host) {
    var standing = window.Reckoning.STANDING;
    var place = standing && standing.place;
    if (!place || !place.zone) return;
    var here, offset;
    try {
      here = window.Reckoning.todayAt(place.zone);
      offset = -window.Reckoning.civilDayStartUTCMinutes(here, place.zone);
    } catch (err) {
      host.appendChild(el('p', 'standing note',
        'This tower could not work out its own clock’s distance from ' +
        'UTC, so the band below is not drawn. Better no figure than one the ' +
        'tower cannot stand behind.'));
      return;
    }
    var mins = Math.abs(offset);
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var width = h + (h === 1 ? ' hour' : ' hours') +
      (m ? ' and ' + m + (m === 1 ? ' minute' : ' minutes') : '');
    host.appendChild(el('p', 'standing',
      'The tower stands in ' + place.name + ', whose clock is ' + width +
      ' ' + (offset < 0 ? 'behind' : 'ahead of') + ' UTC. So its calendar and ' +
      'UTC name different days for ' + width + ' out of every twenty-four: ' +
      (offset < 0
        ? 'from midnight UTC until ' + clockFromUTCMinutes(mins) + ' UTC, it is still yesterday here.'
        : 'from ' + clockFromUTCMinutes(1440 - mins) + ' UTC until midnight, it is already tomorrow here.') +
      ' That band is the offset itself, so the only place it closes is the ' +
      'meridian, and this tower has never stood there.'));
  }

  // The one thing on this page a reader can check without leaving it: the
  // footer's number against the book's newest row. Both are published, both
  // are counted from the same first morning, and today they are one apart.
  //
  // The footer's number is entrenched — `build.sh` works it out once from
  // `date -u` at deploy time and freezes it into a file every reader gets
  // the same bytes of. So this says which moment each figure is *of*,
  // rather than pretending the two were asked at once. Ember's word, and
  // its caution: a comparison between two freezes must name them both.
  function renderFooterAgainstBook(host, readable) {
    var build = window.__towerBuild;
    if (!build || typeof build.dayN !== 'number' || build.dayN < 1 ||
        typeof build.builtAt !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T/.test(build.builtAt)) {
      host.appendChild(el('p', 'standing note',
        'This page could not read its own footer’s day-count, so it is ' +
        'not set against the book here.'));
      return;
    }
    // The first morning is not typed here. It is reconstructed from the two
    // figures the footer already publishes, so this cannot drift from the
    // anchor `build.sh` actually used.
    var builtOn = build.builtAt.slice(0, 10);
    var dayOne = window.Reckoning.shiftDate(builtOn, -(build.dayN - 1));
    var newest = readable[readable.length - 1];
    var rowDay = Math.round(
      (Date.parse(newest.date + 'T00:00:00Z') - Date.parse(dayOne + 'T00:00:00Z')) / 86400000) + 1;
    if (!isFinite(rowDay)) return;

    var line = 'The footer of this page says Day ' + build.dayN + '. That is ' +
      builtOn + ', the UTC day this page was built, counted from ' + dayOne +
      '. The newest row in the book below is dated ' + newest.date + ', at ' +
      newest.place + ', which is Day ' + rowDay + ' by the very same count.';
    line += (rowDay === build.dayN)
      ? ' Today they are the same number, and that is the ordinary case rather than the guaranteed one.'
      : ' They are ' + (Math.abs(build.dayN - rowDay) === 1
        ? 'a day'
        : Math.abs(build.dayN - rowDay) + ' days') +
        ' apart, and neither is wrong: they are answers to two questions.';
    host.appendChild(el('p', 'standing', line));
  }

  function clockFromUTCMinutes(minutes) {
    var m = ((Math.round(minutes) % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60);
    return (h < 10 ? '0' : '') + h + ':' + (m % 60 < 10 ? '0' : '') + (m % 60);
  }

  function start() {
    renderStandingProse();
    renderPledge();
    renderTodayOrSayWhyNot();
    renderComing();
    startCorner();

    fetch('ledger.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then(function (entries) {
        renderLedger(entries);
        fillCollisionHours(entries);
        renderMornings(entries);
        renderTwoClocks(entries);
      })
      .catch(function () {
        var host = document.getElementById('ledger-list');
        host.replaceChildren();
        host.appendChild(el('p', 'loading',
          'the ledger would not open — it remains at reckoning/ledger.json.'));
        // The mornings are a reading of that same file, so they cannot be
        // read either. Say so where the count would have been rather than
        // leaving `counting the mornings…` standing for ever — a placeholder
        // that never resolves is a page pretending to still be working.
        var mornings = document.getElementById('mornings-report');
        if (mornings) {
          mornings.replaceChildren();
          mornings.appendChild(el('p', 'loading',
            'the ledger would not open, so the mornings cannot be counted ' +
            'either.'));
        }
        // Same file, same reason. A placeholder that never resolves is a
        // page pretending to still be working.
        var clocks = document.getElementById('two-clocks-report');
        if (clocks) {
          clocks.replaceChildren();
          clocks.appendChild(el('p', 'loading',
            'the ledger would not open, so the two clocks cannot be held ' +
            'against each other either.'));
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
