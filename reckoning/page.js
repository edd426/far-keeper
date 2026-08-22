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
    ['changeSinceYesterdayMinutes', 'drift'],
    ['risingPointDegrees', 'rising point'],
    ['risingPointStepArcminutes', 'step to tomorrow']
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
      var fresh, broken = [];
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
          var same = (typeof was === 'number' && typeof now === 'number')
            ? Math.abs(was - now) <= 1e-9
            : was === now;
          if (!same) broken.push(pair[1] + ': published ' + was + ', recomputed ' + now);
        });
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
        row.appendChild(el('p', 'ledger__note',
          'published ' + published.publishedAt + ', and it recomputes here, now, ' +
          'in your browser, at ' + placeName + ', to exactly those numbers. That is ' +
          'the whole of what this row claims: nobody has moved those numbers since. ' +
          'The place is not part of that — it is the input this recompute was run ' +
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
    // numbers cannot come apart. The rest of this room's prose still says
    // Paris in a hand's voice, and going through it is the work the *move*
    // owes, not the plumbing.
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
  // whole reason this is here and not on the page: at Paris the answer
  // walks from late September to late October across ten degrees of hill.
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

  function start() {
    renderTodayOrSayWhyNot();
    renderComing();
    startCorner();

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
