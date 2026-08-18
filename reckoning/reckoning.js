// reckoning.js — the tower's first instrument.
//
// Given a date and a place, work out where the sun stands: when it clears
// the horizon, when it goes under, how long the day is, and how much of
// the day has been lost or gained since yesterday.
//
// Nothing here observes anything. Every number below is arithmetic on a
// date — dead reckoning, in the nautical sense: a position computed from
// known quantities with no sighting available to check it against. The
// check has to come from outside this file, which is the whole point.
//
// Two methods are run on every date, on purpose. Method A is the NOAA
// solar-position series; method B is the older USNO almanac method. They
// are different series with different constants and a different shape, so
// when they agree the agreement means something, and when they part the
// page says by how much. Agreement is not proof — they can be wrong the
// same way — but disagreement is proof of trouble, and that asymmetry is
// worth the second computation.
//
// Day 6 correction, and the reason the method carries a version now.
// Until 2026-08-09 method A evaluated its whole series once, at 00:00 UTC
// of the date, and used that single declination for both ends of the day.
// The sun does not wait: over Paris in August sunrise falls about 4.5
// hours after that instant and sunset about 19.3, and the declination is
// a little stale at one end and badly stale at the other. Sunset ran late
// by one to two minutes, every day, in the same direction. Three days had
// been published that way before an almanac outside this tower was asked
// and disagreed.
//
// The series below is untouched. What changed is the *instant it is asked
// about*: each event is now iterated to its own epoch until the answer
// stops moving. See EPOCH_MAX_PASSES.
//
// Runs in a browser (defines window.Reckoning) and in node (exports).

(function (root) {
  'use strict';

  var RAD = Math.PI / 180, DEG = 180 / Math.PI;
  function sin(d) { return Math.sin(d * RAD); }
  function cos(d) { return Math.cos(d * RAD); }
  function tan(d) { return Math.tan(d * RAD); }
  function wrap360(d) { return ((d % 360) + 360) % 360; }

  // The sun's centre is 50 arcminutes below the true horizon at the moment
  // its upper limb appears: 34' of atmospheric refraction, 16' of solar
  // radius. 90 + 50/60 = 90.833. This is the one number here that is a
  // fact about air rather than about geometry.
  var HORIZON_ZENITH = 90.833;

  // Twice the 16 arcminutes above. Kept as its own name because the
  // corner sets a reader's horizon against it: it is the plainest ruler
  // anybody standing outside already owns.
  var SUN_DIAMETER_ARCMINUTES = 32;

  // The method's own version, written into every entry from Day 6 on.
  // A ledger entry with no `method` on it was computed under method 1 —
  // the whole series evaluated once at 00:00 UTC — and there are exactly
  // three of those: 2026-08-06, 07 and 08. They are not edited and never
  // will be. The number exists so that a stranger reading a DRIFTED
  // verdict is told *which* arithmetic moved, rather than left to guess
  // whether the tower was wrong then or is cheating now.
  var METHOD = 2;
  var METHOD_NOTES = {
    1: 'series evaluated once at 00:00 UTC, one declination for both ends of the day',
    2: 'series evaluated at each event’s own instant, iterated until settled'
  };
  var METHOD_CHANGED_ON = '2026-08-09';

  // ---- When each claim was born ----
  //
  // Day 15. The ledger is cold, so an entry written before the tower
  // published a number will never carry that number — lawfully, and for
  // as long as this tower stands. An auditor that asks every row for
  // every claim convicts twelve honest entries of a silence they had no
  // way to break.
  //
  // This lives here, and not in the auditor, because there are **two**
  // auditors: `tools/reckon.js --verify` on this desk, and the ledger on
  // the page, which recomputes every row in a stranger's own browser. If
  // they held separate copies of this list they would eventually disagree
  // about what a row was ever asked, and the disagreement would show up
  // as one of them calling a clean row DRIFTED — the worst available
  // outcome, since the whole point of the second auditor is that it runs
  // where we cannot reach it.
  //
  // That is not the thing Day 3 forbids factoring together. Method A and
  // method B must share no code because the second one's only job is to
  // disagree with the first, and a shared helper would be a shared
  // mistake. This is not a computation at all. It is a date the tower
  // wrote down about itself, and there is only one true answer to it.
  //
  // A key absent from this map is a claim the tower has always published.
  var CLAIM_INTRODUCED = {
    risingPointDegrees: '2026-08-18',
    risingPointStepArcminutes: '2026-08-18'
  };

  function claimApplies(key, entryDateISO) {
    var introduced = CLAIM_INTRODUCED[key];
    return !introduced || entryDateISO >= introduced;
  }

  var PARIS = {
    name: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    zone: 'Europe/Paris'
  };

  // Julian Day at 00:00 UTC of the given civil date (Fliegel–Van Flandern,
  // Gregorian). The whole apparatus hangs off this one conversion, so it
  // is written out rather than borrowed from a date library.
  function julianDay(year, month, day) {
    var y = year, m = month;
    if (m <= 2) { y -= 1; m += 12; }
    var a = Math.floor(y / 100);
    var b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  }

  // ---- Method A: NOAA general solar position ----
  function noaa(jd, latitude, longitude, zenith) {
    if (zenith === undefined) zenith = HORIZON_ZENITH;
    var t = (jd - 2451545.0) / 36525.0;             // Julian centuries from J2000.0

    var meanLongitude = wrap360(280.46646 + t * (36000.76983 + 0.0003032 * t));
    var meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    var eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

    var centre = sin(meanAnomaly) * (1.914602 - t * (0.004817 + 0.000014 * t))
      + sin(2 * meanAnomaly) * (0.019993 - 0.000101 * t)
      + sin(3 * meanAnomaly) * 0.000289;

    var trueLongitude = meanLongitude + centre;
    var omega = 125.04 - 1934.136 * t;              // lunar node, for nutation
    var apparentLongitude = trueLongitude - 0.00569 - 0.00478 * sin(omega);

    var meanObliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    var obliquity = meanObliquity + 0.00256 * cos(omega);

    var declination = Math.asin(sin(obliquity) * sin(apparentLongitude)) * DEG;

    var y = Math.pow(tan(obliquity / 2), 2);
    var equationOfTime = 4 * DEG * (
      y * sin(2 * meanLongitude)
      - 2 * eccentricity * sin(meanAnomaly)
      + 4 * eccentricity * y * sin(meanAnomaly) * cos(2 * meanLongitude)
      - 0.5 * y * y * sin(4 * meanLongitude)
      - 1.25 * eccentricity * eccentricity * sin(2 * meanAnomaly)
    );

    var solarNoon = 720 - 4 * longitude - equationOfTime;   // minutes after 00:00 UTC

    var cosHourAngle = cos(zenith) / (cos(latitude) * cos(declination))
      - tan(latitude) * tan(declination);

    var working = {
      julianDay: jd,
      julianCentury: t,
      meanLongitude: meanLongitude,
      meanAnomaly: wrap360(meanAnomaly),
      eccentricity: eccentricity,
      equationOfCentre: centre,
      apparentLongitude: wrap360(apparentLongitude),
      obliquity: obliquity,
      declination: declination,
      equationOfTime: equationOfTime,
      solarNoonUTC: solarNoon
    };

    // At this latitude it never happens, but a formula that quietly returns
    // NaN above the Arctic circle is a formula that lies about its limits.
    if (cosHourAngle > 1) { working.never = 'risen'; return working; }
    if (cosHourAngle < -1) { working.never = 'set'; return working; }

    var hourAngle = Math.acos(cosHourAngle) * DEG;
    working.hourAngle = hourAngle;
    working.sunriseUTC = solarNoon - 4 * hourAngle;
    working.sunsetUTC = solarNoon + 4 * hourAngle;
    return working;
  }

  // ---- The epoch, and why the series is asked more than once ----
  //
  // `noaa()` above answers one question: where does the sun stand at the
  // instant you hand it? Sunrise and sunset are the instants where the
  // answer crosses the horizon — so the epoch you want is the answer you
  // are looking for, and the way out of that circle is to go round it.
  // Start at 00:00 UTC, get a first guess at the event, ask the series
  // again *at that guess*, and repeat until the time stops moving.
  //
  // Over Paris it settles in three passes and never needs more than four.
  // The cap is a cap, not a schedule: a formula that silently spins is
  // worse than one that stops and says how far it got, so the last move
  // is published in the working and a reader can see it is a fraction of
  // a second rather than take that on trust.
  //
  // The cheaper shape — evaluate once at local solar noon, as NOAA's own
  // spreadsheet does — was tried and rejected on the day this was fixed.
  // Ember measured it: noon-evaluation still misses the settled answer by
  // 25 to 30 seconds at *both* ends, symmetrically, because solar noon is
  // the day's rough midpoint and not either event's own instant. Against
  // the almanac it misses one figure of nine by a whole minute where
  // iterating misses none. It is an approximation of this, not a variant
  // of it.
  var EPOCH_MAX_PASSES = 8;
  var EPOCH_SETTLE_MINUTES = 1e-7;   // about six microseconds

  function converge(pick, jd0, latitude, longitude, zenith) {
    var working = noaa(jd0, latitude, longitude, zenith);
    if (working.never) return working;

    var minutes = pick(working), passes = 0, moved = null;
    for (var i = 0; i < EPOCH_MAX_PASSES; i++) {
      var next = noaa(jd0 + minutes / 1440, latitude, longitude, zenith);
      passes += 1;
      if (next.never) return next;
      var settled = pick(next);
      moved = Math.abs(settled - minutes);
      minutes = settled;
      working = next;
      if (moved < EPOCH_SETTLE_MINUTES) break;
    }

    working.epochJulianDay = jd0 + minutes / 1440;
    working.epochPasses = passes;
    working.epochLastMoveSeconds = moved === null ? null : moved * 60;
    return working;
  }

  function pickSunrise(w) { return w.sunriseUTC; }
  function pickSunset(w) { return w.sunsetUTC; }
  function pickSolarNoon(w) { return w.solarNoonUTC; }

  // Everything method A has to say about one date, each event settled at
  // its own epoch. Returns a `never` object unchanged if the sun does not
  // cross the horizon there that day.
  function solarDay(year, month, day, latitude, longitude, zenith) {
    var jd = julianDay(year, month, day);
    var atMidnight = noaa(jd, latitude, longitude, zenith);
    if (atMidnight.never) return { never: atMidnight.never, working: atMidnight };

    var rise = converge(pickSunrise, jd, latitude, longitude, zenith);
    var set = converge(pickSunset, jd, latitude, longitude, zenith);
    var noon = converge(pickSolarNoon, jd, latitude, longitude, zenith);
    if (rise.never || set.never || noon.never) {
      return { never: (rise.never || set.never || noon.never), working: atMidnight };
    }

    return {
      julianDayMidnight: jd,
      atMidnight: atMidnight,
      rise: rise,
      set: set,
      noon: noon,
      sunriseUTC: rise.sunriseUTC,
      sunsetUTC: set.sunsetUTC,
      solarNoonUTC: noon.solarNoonUTC
    };
  }

  // ---- Method B: USNO Almanac for Computers, low-precision sunrise ----
  // Deliberately not refactored to share anything with method A. A shared
  // helper is a shared mistake.
  function usno(year, month, day, latitude, longitude, rising, zenith) {
    if (zenith === undefined) zenith = HORIZON_ZENITH;
    var n = Math.floor(275 * month / 9)
      - Math.floor((month + 9) / 12) * (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3))
      + day - 30;
    var lngHour = longitude / 15;
    var t = n + ((rising ? 6 : 18) - lngHour) / 24;

    var meanAnomaly = 0.9856 * t - 3.289;
    var longitude_ = wrap360(meanAnomaly + 1.916 * sin(meanAnomaly) + 0.020 * sin(2 * meanAnomaly) + 282.634);

    var rightAscension = wrap360(DEG * Math.atan(0.91764 * tan(longitude_)));
    rightAscension += (Math.floor(longitude_ / 90) * 90) - (Math.floor(rightAscension / 90) * 90);
    rightAscension /= 15;

    var sinDec = 0.39782 * sin(longitude_);
    var cosDec = Math.cos(Math.asin(sinDec));

    var cosHourAngle = (cos(zenith) - sinDec * sin(latitude)) / (cosDec * cos(latitude));
    if (cosHourAngle > 1 || cosHourAngle < -1) return null;

    var hourAngle = (rising ? 360 - DEG * Math.acos(cosHourAngle) : DEG * Math.acos(cosHourAngle)) / 15;
    var localMean = hourAngle + rightAscension - 0.06571 * t - 6.622;
    return (((localMean - lngHour) % 24) + 24) % 24 * 60;   // minutes after 00:00 UTC
  }

  // Ember's guard, banked Day 4, built Day 5, corrected twice more the
  // same day. A check on offsets this file has actually gone and looked
  // up, not a number carried in from the world and left unattributed —
  // that is the standard it is held to, after Ash read the first draft
  // as a sentence and asked whether anyone had earned it.
  //
  // Nobody had, quite. The first draft claimed Europe/Paris "only ever
  // produces 60 or 120" as if that were a fact about the shape of a UTC
  // offset. It is not. It is a fact about French law since a date this
  // comment can name, and it is false outside that date. Gnomon walked
  // the zone at six-hour steps across its whole recorded tz history
  // (2026-08-08) and found exactly:
  //   1970–2035: {60, 120}      — the modern set; 120 first appears 1976-03-28
  //   1940–1945: {0, 60, 120}   — the war years, occupied-zone time included
  //   1891–1911: {0, 9}         — Paris Mean Time, +00:09:21 rounded to 9,
  //                                the city's own noon, in force to 1911-03-11
  //
  // So {60, 120} is a witnessed claim with a domain, not a law. It holds,
  // confirmed, from PARIS_MODERN_DOMAIN_START on — earlier than that
  // (the war years, Paris Mean Time, and the unsampled decades between
  // 1911 and 1970) this guard has not looked and does not assert. A
  // 9-minute offset before 1911-03-11 is not impossible; it is real, it
  // is what the sun over that city's own meridian actually said, and a
  // guard that called it impossible would be false in the tower's own
  // manner — confident, and wrong, about a thing it never checked.
  //
  // The general fallback, for any zone other than Europe/Paris, keeps
  // the same shape at a coarser grain: a whole quarter-hour, inside a
  // range. That range also rejects a whole day (1440) passed off as "24
  // quarter-hours" — the coarse break, and the likelier one: a day is
  // what falls apart when a *date* breaks, not when a clock does.
  //
  // Day 7: this branch had the exact fault Ash caught in the Paris branch
  // on Day 5, left standing because only Paris ever reached the guard.
  // The quarter-hour claim had no domain on it — so it read as a law
  // about clocks, and it is not. Ember swept every zone node knows over
  // 1900–2030 and found 289 offsets it would have called impossible,
  // among them Africa/Monrovia at −44 minutes, still true local mean time
  // in January 1970. A guard that convicts Monrovia of an impossible
  // clock is this tower being confident and wrong about a thing it never
  // looked at, one floor along from where it last did it.
  //
  // So the fine claim now carries its witness. Gnomon walked all 418
  // zones on 2026-08-10 — every 5 days from 1996-01-01 to 2036-01-01
  // (1,221,396 samples), and every 3 days from 1980-01-01 back-to-back
  // with it — and found every offset on a whole quarter-hour, none
  // outside −720…+840. Below 1980 the sweep found real offsets that are
  // not quarter-hours (Monrovia's −44, Kiritimati's −640, in force until
  // 1979) and the guard asserts nothing fine there. Above 2036 it has not
  // looked: the tz database is extrapolating its own rules by then, and
  // an extrapolation is not a sighting.
  //
  // Outside the swept years only the range is asserted, and that one is
  // not a sampling result: no place on a round earth keeps a local mean
  // time more than twelve hours from Greenwich, and the +14 end is the
  // widest line any parliament has drawn. A whole day still cannot pass.
  //
  // "Evidence" is Latin *videre*, to see: it owes a look at something
  // outside itself, fetched fresh, every time it is asked — the almanac
  // cross-check and `--verify` both pay that cost on every run.
  // "Impossible" is *possum* negated: a value can be ruled out from its
  // own shape with no sighting required *at the moment it is checked* —
  // but the shape itself still had to be gathered from the world once,
  // by looking, and banked. The saving is real: one lookup standing in
  // for a lookup on every call. The debt is real too: a banked witness
  // that doesn't declare when it looked and over what range reads as a
  // fact nobody earned, wearing evidence's flat voice without having
  // paid evidence's cost — which is the exact failure this file exists
  // to catch, now aimed at itself.
  var PARIS_MODERN_OFFSETS_MINUTES = [60, 120];
  // Both edges, not just the near one. The Day 5 sampling ran 1970–2035;
  // a date in 2050 was being convicted on a set nobody had checked there,
  // which is the same debt in the other direction.
  var PARIS_MODERN_DOMAIN = { start: '1970-01-01', end: '2036-01-01' };
  var GENERAL_QUARTER_HOUR_DOMAIN = { start: '1980-01-01', end: '2036-01-01' };
  var GENERAL_OFFSET_RANGE_MINUTES = { min: -720, max: 840 };

  function inDomain(dateISO, domain) {
    return dateISO >= domain.start && dateISO < domain.end;
  }

  function assertPlausibleOffset(offsetMinutes, zone, dateISO) {
    // NaN first, and it has to be first. Ember found this on Day 7 and it
    // is the sharpest thing anyone has found in this file: `NaN < min` and
    // `NaN > max` are both false, so a NaN offset satisfies a range check
    // by failing both halves of it. Inside a witnessed domain a later
    // branch catches it by luck — `NaN % 15 !== 0` is true, `indexOf(NaN)`
    // is always −1 — but outside both domains nothing runs after the
    // range, which is to say the guard was blindest in exactly the years
    // it already admits it cannot vouch for. Reproduced, not argued:
    // a garbled clock put `NaN:NaN` on the page for 1950 and for 2050.
    //
    // The comparison below is the one that is true for every number there
    // is and false only for this. A guard whose first act is a range test
    // has assumed it was handed a number; this one checks.
    if (offsetMinutes !== offsetMinutes || !isFinite(offsetMinutes)) {
      throw new Error(
        'reckoning: the clock offset for ' + zone + ' on ' + dateISO + ' came back ' +
        'as ' + offsetMinutes + ', which is not a number of minutes at all. ' +
        'Check the tz data before the arithmetic.'
      );
    }
    // The range holds everywhere and always, and it is the only claim
    // that does. It is geometry plus the widest line any parliament has
    // drawn, not a sampling result — so it is asserted first, for every
    // zone and every date, before anything finer is even considered.
    if (offsetMinutes < GENERAL_OFFSET_RANGE_MINUTES.min
      || offsetMinutes > GENERAL_OFFSET_RANGE_MINUTES.max) {
      throw new Error(
        'reckoning: impossible UTC offset ' + offsetMinutes + 'min for ' + zone + ' on ' +
        dateISO + ' — no clock anywhere has ever stood outside UTC−12:00…UTC+14:00. ' +
        'Check the tz data before the arithmetic.'
      );
    }

    if (zone === 'Europe/Paris') {
      // Outside the witnessed years this guard has nothing earned to
      // assert (Paris Mean Time, the war years, the unsampled decades
      // between, and every year past the sampling's far edge), so it says
      // nothing rather than call a true offset impossible.
      if (!inDomain(dateISO, PARIS_MODERN_DOMAIN)) return offsetMinutes;
      if (PARIS_MODERN_OFFSETS_MINUTES.indexOf(offsetMinutes) === -1) {
        throw new Error(
          'reckoning: impossible UTC offset ' + offsetMinutes + 'min for Europe/Paris on ' +
          dateISO + ' — over the years this was checked (' + PARIS_MODERN_DOMAIN.start +
          ' to ' + PARIS_MODERN_DOMAIN.end + ') it only ever runs 60 or 120. ' +
          'Check the tz data before the arithmetic.'
        );
      }
      return offsetMinutes;
    }

    if (!inDomain(dateISO, GENERAL_QUARTER_HOUR_DOMAIN)) return offsetMinutes;
    if (offsetMinutes % 15 !== 0) {
      throw new Error(
        'reckoning: impossible UTC offset ' + offsetMinutes + 'min for ' + zone + ' on ' +
        dateISO + ' — over the years this was checked (' + GENERAL_QUARTER_HOUR_DOMAIN.start +
        ' to ' + GENERAL_QUARTER_HOUR_DOMAIN.end + ') every zone on earth sat on a whole ' +
        'quarter-hour. Check the tz data before the arithmetic.'
      );
    }
    return offsetMinutes;
  }

  // What the zone was doing at that instant. This is the true clock
  // talking, not arithmetic: the daylight-saving rule is a fact about a
  // parliament, not about the sky, and it belongs to the tz database
  // rather than to this file. Said plainly because the page says so too.
  function zoneOffsetMinutes(dateISO, minutesUTC, zone) {
    var midnight = Date.UTC(
      Number(dateISO.slice(0, 4)), Number(dateISO.slice(5, 7)) - 1, Number(dateISO.slice(8, 10))
    );
    var instant = new Date(midnight + minutesUTC * 60000);
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(instant).reduce(function (acc, part) {
      acc[part.type] = part.value; return acc;
    }, {});
    // Seconds are asked for and used deliberately. Intl truncates the
    // fields it is given rather than rounding, so leaving seconds out does
    // not mean "ignore them" — it means the sub-minute part of the instant
    // silently vanishes from one side of the subtraction below, and the
    // offset comes back a minute short whenever that part is over thirty
    // seconds. Sunrise almost never falls on a whole minute, so this was
    // wrong on close to half of all days, by exactly one minute, with
    // nothing about the answer looking wrong. Found by Ember, Day 3.
    // 24:00 is a legal formatToParts answer for midnight in some engines.
    var hour = Number(parts.hour) % 24;
    var asIfUTC = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      hour, Number(parts.minute), Number(parts.second)
    );
    return assertPlausibleOffset(Math.round((asIfUTC - instant.getTime()) / 60000), zone, dateISO);
  }

  function shiftDate(dateISO, days) {
    var d = new Date(Date.UTC(
      Number(dateISO.slice(0, 4)), Number(dateISO.slice(5, 7)) - 1, Number(dateISO.slice(8, 10))
    ) + days * 86400000);
    return d.toISOString().slice(0, 10);
  }

  // Published to the nearest minute, not truncated to it. A clock truncates
  // because it is telling you what time it is now; an almanac is naming the
  // instant of an event, and 21:21:40 is nearer to 21:22 than to 21:21. The
  // unrounded value is kept in the working, so the rounding is visible
  // rather than merely done.
  function clockFace(minutesUTC, offsetMinutes) {
    var local = minutesUTC + offsetMinutes;
    var wrapped = ((local % 1440) + 1440) % 1440;
    var nearest = Math.round(wrapped) % 1440;
    var h = Math.floor(nearest / 60), m = nearest - h * 60;
    return { hhmm: pad(h) + ':' + pad(m) };
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // ---- The rising point ----
  //
  // Where on the skyline the sun comes up, measured in degrees round from
  // north through east. Everything else this file publishes is a *when*,
  // and a when needs a clock to check. This is a *where*, and it needs a
  // fixed mark and two mornings. Day 15: it had been sent to a
  // correspondent in a letter and never once computed here.
  //
  // Two cautions live in this function and neither is decoration.
  //
  // The declination must be the one at the event's own settled instant,
  // and this takes it as an argument rather than fetching one, so that
  // every call site has to pass the converged working. That is Day 6's
  // discipline. It is *not* Day 6's fault waiting to happen, and the
  // difference was measured rather than assumed: Ember ran the staleness
  // through, Day 15, at the badly-stale end (August sunset, 88 seconds of
  // epoch correction) and the bearing moves about **2 arcseconds** —
  // against a sun 1920 arcseconds wide and a daily step of 1800. Right on
  // principle, invisible in fact. Saying which of those it is, is the
  // whole of the honesty here.
  //
  // And it is the azimuth of the sun's *centre* at the moment that centre
  // stands at `zenithDeg`. A watcher sees an edge, not a centre, and the
  // sun climbs at a slant at this latitude, so it looked as though the
  // first glint would sit off this bearing by some fraction of a width.
  // It does not, and the reason is geometry rather than smallness: the
  // point where a disk first touches a level line is directly under the
  // disk's centre, whatever direction the disk is travelling. The slant
  // governs how *long* the sun takes to lift its own width — which is
  // `secondsToLiftItsOwnWidth` in the corner — and not where it touches.
  // Ember went looking for the correction on Day 15 and came back with a
  // proof that there isn't one, which is the more useful errand.
  function risingPointDegrees(declinationDeg, zenithDeg, latitudeDeg) {
    // Day 7: a range check assumes it was handed a number, and NaN
    // satisfies one by failing both halves of it. Ask first.
    if (declinationDeg !== declinationDeg || zenithDeg !== zenithDeg
      || latitudeDeg !== latitudeDeg) return null;
    var c = (sin(declinationDeg) - sin(latitudeDeg) * cos(zenithDeg))
      / (cos(latitudeDeg) * sin(zenithDeg));
    // Outside [-1, 1] the sun's centre never stands at that zenith there
    // that day. `never` upstream catches this over Paris; the arithmetic
    // still refuses rather than clamping, because a clamped bearing is a
    // wrong answer wearing the shape of a right one.
    if (c > 1 || c < -1) return null;
    return Math.acos(c) * DEG;
  }

  // ---- The reader's own horizon ----
  //
  // HORIZON_ZENITH is the horizon of a reader standing at sea level on a
  // flat plain with nothing in the way. Almost nobody is. Two things move
  // a real horizon, they move it in opposite directions, and both are
  // arithmetic — which means the tower can hand them to a reader instead
  // of waving at them.
  //
  // A hill, a treeline or a wall to the east makes the sun climb further
  // before it clears: sunrise late. Height above the surrounding ground
  // tips the true horizon down below level — the dip — and the sun clears
  // it sooner: sunrise early. The dip is plain geometry, the tangent from
  // an eye h metres up to a sphere of radius R.
  //
  // What this does NOT include, said here rather than left to be
  // discovered: a ray grazing the horizon downward is bent by air just as
  // the rising sun's is, which makes the true dip somewhat smaller than
  // the geometric one. That correction is a fact about the air over the
  // reader's head this morning, and this tower has no barometer — the
  // same wall the 34 arcminutes of refraction runs into. So the dip below
  // is geometry, stated as geometry, and it is an overstatement of the
  // real one by a fraction the tower cannot pin down.
  var EARTH_RADIUS_METRES = 6371000;

  function horizonDipDegrees(eyeHeightMetres) {
    if (!eyeHeightMetres || eyeHeightMetres <= 0) return 0;
    var r = EARTH_RADIUS_METRES;
    return Math.acos(r / (r + eyeHeightMetres)) * DEG;
  }

  // Where the sun's centre must stand for a reader with that horizon.
  // Obstruction lifts the horizon, so the sun must be higher, so the
  // zenith angle at the event is smaller. The dip does the reverse.
  function horizonZenith(horizon) {
    var obstruction = horizon && horizon.obstructionDegrees || 0;
    var dip = horizonDipDegrees(horizon && horizon.eyeHeightMetres);
    return {
      zenith: HORIZON_ZENITH - obstruction + dip,
      obstructionDegrees: obstruction,
      dipDegrees: dip
    };
  }

  // The core call. Everything the page shows comes out of this one object,
  // so there is nowhere for a number to enter the tower unaccounted for.
  //
  // `horizon` is optional and the ledger never passes it: called with two
  // arguments this function is exactly what it was before the corner was
  // built, so a published entry recomputes against the same arithmetic it
  // was written under. Pass a horizon and the whole reckoning — both
  // methods, the sensitivity, the epoch iteration — is done against that
  // reader's horizon instead of the flat-plain one.
  function reckon(dateISO, place, horizon) {
    place = place || PARIS;
    var h = horizonZenith(horizon);
    var zenith = h.zenith;
    var year = Number(dateISO.slice(0, 4));
    var month = Number(dateISO.slice(5, 7));
    var day = Number(dateISO.slice(8, 10));

    var a = solarDay(year, month, day, place.latitude, place.longitude, zenith);
    if (a.never) {
      return {
        date: dateISO, method: METHOD, working: a.working, place: place,
        horizon: h, never: a.never
      };
    }

    var offsetRise = zoneOffsetMinutes(dateISO, a.sunriseUTC, place.zone);
    var offsetSet = zoneOffsetMinutes(dateISO, a.sunsetUTC, place.zone);
    var offsetNoon = zoneOffsetMinutes(dateISO, a.solarNoonUTC, place.zone);

    var dayLength = a.sunsetUTC - a.sunriseUTC;

    // Yesterday, recomputed from scratch rather than read back from the
    // ledger — so that the change we publish is a claim this file makes
    // today, not a claim it is quoting.
    var yesterdayISO = shiftDate(dateISO, -1);
    var yb = solarDay(
      Number(yesterdayISO.slice(0, 4)), Number(yesterdayISO.slice(5, 7)), Number(yesterdayISO.slice(8, 10)),
      place.latitude, place.longitude, zenith
    );
    var yesterdayLength = yb.never ? null : yb.sunsetUTC - yb.sunriseUTC;

    // The rising point, and tomorrow's, so the step can be published.
    //
    // The drift looks *back* — it is about the day the reader is standing
    // in. The step looks *forward*, because it is not a description, it is
    // an instruction: put a mark on your skyline, look tomorrow, see
    // whether the sun clears it where this page says it will. That makes
    // it a claim about a morning that has not happened, which is the only
    // kind of claim this tower can be caught on without anyone's help.
    var tomorrowISO = shiftDate(dateISO, 1);
    var tb = solarDay(
      Number(tomorrowISO.slice(0, 4)), Number(tomorrowISO.slice(5, 7)), Number(tomorrowISO.slice(8, 10)),
      place.latitude, place.longitude, zenith
    );

    var risingPoint = risingPointDegrees(a.rise.declination, zenith, place.latitude);
    var settingPointArc = risingPointDegrees(a.set.declination, zenith, place.latitude);
    var risingPointTomorrow = tb.never ? null
      : risingPointDegrees(tb.rise.declination, zenith, place.latitude);
    var stepArcminutes = (risingPoint === null || risingPointTomorrow === null)
      ? null : (risingPointTomorrow - risingPoint) * 60;

    var bRise = usno(year, month, day, place.latitude, place.longitude, true, zenith);
    var bSet = usno(year, month, day, place.latitude, place.longitude, false, zenith);

    // How much does the softest constant matter? Re-run the same series
    // with the horizon moved one arcminute and see how far sunrise walks.
    // This is a sensitivity, and it is computed — it says how wrong the
    // published time would be *if* the refraction figure is off by that
    // much. It does not say how often it is off, or by how much, and this
    // tower has no way to find that out. Naming the second question and
    // refusing to answer it is the honest half of the answer.
    var nudged = converge(pickSunrise, a.julianDayMidnight,
      place.latitude, place.longitude, zenith + 1 / 60);
    var sensitivity = nudged.never ? null : (nudged.sunriseUTC - a.sunriseUTC) * 60;

    return {
      date: dateISO,
      method: METHOD,
      place: {
        name: place.name, latitude: place.latitude, longitude: place.longitude, zone: place.zone
      },
      sunrise: clockFace(a.sunriseUTC, offsetRise).hhmm,
      sunset: clockFace(a.sunsetUTC, offsetSet).hhmm,
      solarNoon: clockFace(a.solarNoonUTC, offsetNoon).hhmm,
      utcOffsetMinutes: offsetRise,
      dayLengthMinutes: dayLength,
      dayLength: durationWords(dayLength),
      changeSinceYesterdayMinutes: yesterdayLength === null ? null : dayLength - yesterdayLength,
      // Degrees round from north through east. The setting point is the
      // same arc measured the other way round the compass, which is why
      // it is 360 minus and not a second computation.
      risingPointDegrees: risingPoint,
      settingPointDegrees: settingPointArc === null ? null : 360 - settingPointArc,
      risingPointTomorrowDegrees: risingPointTomorrow,
      risingPointStepArcminutes: stepArcminutes,
      // The step in the only unit a reader outside owns without buying
      // anything. Ash, Day 15: the page is for the things that live
      // everywhere, and a sun-width is a ruler everybody is already
      // holding. Quoting this robustness as a *percentage* was the thing
      // that lied — see the note in the corner.
      risingPointStepSunWidths: stepArcminutes === null
        ? null : stepArcminutes / SUN_DIAMETER_ARCMINUTES,
      horizon: h,
      working: {
        julianDay: a.julianDayMidnight,
        julianCentury: a.atMidnight.julianCentury,
        eccentricity: a.atMidnight.eccentricity,
        horizonZenithDeg: zenith,
        horizonSensitivitySecondsPerArcminute: sensitivity,
        // What the epoch is worth, today, in seconds: the settled answer
        // set against the same series asked only at 00:00 UTC — which is
        // what this file published until 2026-08-09. Not a leftover: it
        // is the size of the correction, computed fresh every day, and it
        // should shrink toward the solstices and grow toward the
        // equinoxes. If it does not behave that way, the diagnosis was
        // wrong and this number is where it shows.
        epochCorrectionSecondsSunrise: (a.sunriseUTC - a.atMidnight.sunriseUTC) * 60,
        epochCorrectionSecondsSunset: (a.sunsetUTC - a.atMidnight.sunsetUTC) * 60,
        sunriseUTCMinutes: a.sunriseUTC,
        sunsetUTCMinutes: a.sunsetUTC,
        atSunrise: epochWorking(a.rise),
        atSunset: epochWorking(a.set),
        atSolarNoon: epochWorking(a.noon)
      },
      crossCheck: bRise === null || bSet === null ? null : {
        method: 'USNO Almanac for Computers',
        sunrise: clockFace(bRise, offsetRise).hhmm,
        sunset: clockFace(bSet, offsetSet).hhmm,
        sunriseDifferenceMinutes: a.sunriseUTC - bRise,
        sunsetDifferenceMinutes: a.sunsetUTC - bSet
      }
    };
  }

  // The series as it stood at one event's own instant. Published per event
  // because after Day 6 there is no single "the declination today" — there
  // are three, and pretending otherwise is the shape of the bug that was
  // just taken out.
  function epochWorking(w) {
    return {
      julianDay: w.epochJulianDay,
      julianCentury: w.julianCentury,
      meanLongitudeDeg: w.meanLongitude,
      meanAnomalyDeg: w.meanAnomaly,
      equationOfCentreDeg: w.equationOfCentre,
      apparentLongitudeDeg: w.apparentLongitude,
      obliquityDeg: w.obliquity,
      declinationDeg: w.declination,
      equationOfTimeMinutes: w.equationOfTime,
      hourAngleDeg: w.hourAngle === undefined ? null : w.hourAngle,
      solarNoonUTCMinutes: w.solarNoonUTC,
      passes: w.epochPasses,
      lastMoveSeconds: w.epochLastMoveSeconds
    };
  }

  // ---- The corner ----
  //
  // Ash's word, Day 7. Every reader with a clear east and west is one
  // corner of the check; no corner holds weight alone, and the tower has
  // exactly as many as choose to stand in one.
  //
  // The same date and place, worked twice: once against the flat-plain
  // horizon every almanac uses, once against the reader's own. The gap is
  // what their eye will add before they ever get to whether we were right
  // — and the last figure here is the one that keeps the invitation
  // honest, because it says what the check cannot catch.
  function corner(dateISO, place, horizon) {
    var flat = reckon(dateISO, place);
    var mine = reckon(dateISO, place, horizon);
    var out = { date: dateISO, place: mine.place, horizon: mine.horizon, flat: flat, mine: mine };
    if (flat.never || mine.never) {
      out.never = mine.never || flat.never;
      return out;
    }
    // Taken at the reader's own horizon, not at the flat one, and that
    // is the whole of the difference. The shift is not a straight line:
    // read off the flat horizon and extended, this rate overstates the
    // true delay by 2.3% at five degrees and 6.7% at twenty, so a reader
    // in a valley would be handed a number their own (correct) printed
    // time did not agree with. Read at their own horizon it is a local
    // slope and it is honest where it is quoted — measured against the
    // true next degree at Paris today: 0.5% at the flat horizon, 0.2% at
    // ten degrees, 0.0% at twenty, −1.2% at forty-five. The times
    // themselves are never computed from this rate; they are iterated at
    // the zenith the reader's horizon implies. Ember found the far end of
    // this, Day 7, by running the corner out past where it means what it
    // says.
    var perArcminute = mine.working.horizonSensitivitySecondsPerArcminute;
    out.shiftSecondsSunrise =
      (mine.working.sunriseUTCMinutes - flat.working.sunriseUTCMinutes) * 60;
    out.shiftSecondsSunset =
      (mine.working.sunsetUTCMinutes - flat.working.sunsetUTCMinutes) * 60;
    out.secondsPerDegreeOfHorizon = perArcminute === null ? null : Math.abs(perArcminute) * 60;
    // Turned round: how much horizon it takes to hide one minute of our
    // error. Set that against the sun's own width and the reader can see
    // for themselves what their eye is able to convict us of.
    out.arcminutesPerMinuteOfError = perArcminute === null || perArcminute === 0
      ? null : 60 / Math.abs(perArcminute);
    out.sunDiameterArcminutes = SUN_DIAMETER_ARCMINUTES;
    // The third thing that moves, and it is neither ours nor the reader's
    // place: it is what they decide "risen" means. Ash's find, Day 7 —
    // the page had accounted for two and then claimed everything else was
    // ours or the air's. The sun is a disk, and one watcher calls it up
    // when the first edge shows while another waits for the whole of it,
    // so how long it takes to lift its own width past the horizon *is*
    // the spread between two honest readers. That is arithmetic, so it is
    // computed here rather than waved at.
    out.secondsToLiftItsOwnWidth = perArcminute === null
      ? null : Math.abs(perArcminute) * SUN_DIAMETER_ARCMINUTES;

    // ---- The rising point, and the one check here that needs no clock ----
    //
    // Day 15. Every other invitation on this page asks a reader to know
    // what time it is: look at the sun, look at a watch, tell us whether
    // they agree. This one does not. Put a mark on the skyline, look on
    // two mornings, and see whether the sun clears it where we said. A
    // reader with no clock at all can convict us of that.
    //
    // Which is why both legs are published rather than one. The bearing
    // is *horizon-hung* and hard: five degrees of skyline to the east
    // moves the rising point about six degrees at Paris — roughly twelve
    // days' worth of the daily step — so a reader handed the flat-plain
    // bearing and standing in a valley would mark the wrong tree. The
    // step barely moves: across nought to ten degrees of skyline it
    // shifts by at most 5.4 arcminutes, a sixth of the sun's own width,
    // and that is the worst day of 2026 (22 January), swept.
    //
    // Stated in sun-widths on purpose. Written as a percentage of the
    // step it reads as 4% in August and 34% at the solstice, which looks
    // like the claim collapsing and is not: the step itself falls to
    // 0.038 arcminutes on 21 December, so a third of it is a third of
    // nothing, in a week when nobody could see any movement at all. A
    // ratio taken against a quantity that goes to zero reports its own
    // denominator. The sun's width is the ruler the reader already owns.
    out.risingPointFlatDegrees = flat.risingPointDegrees;
    out.risingPointDegrees = mine.risingPointDegrees;
    out.settingPointFlatDegrees = flat.settingPointDegrees;
    out.settingPointDegrees = mine.settingPointDegrees;
    out.risingPointShiftArcminutes =
      (flat.risingPointDegrees === null || mine.risingPointDegrees === null)
        ? null : (mine.risingPointDegrees - flat.risingPointDegrees) * 60;
    out.risingPointStepArcminutes = mine.risingPointStepArcminutes;
    out.risingPointStepSunWidths = mine.risingPointStepSunWidths;
    out.risingPointStepFlatArcminutes = flat.risingPointStepArcminutes;
    return out;
  }

  function durationWords(minutes) {
    var whole = Math.floor(minutes);
    var h = Math.floor(whole / 60), m = whole - h * 60;
    var s = Math.round((minutes - whole) * 60);
    if (s === 60) { s = 0; m += 1; }
    if (m === 60) { m = 0; h += 1; }
    return h + 'h ' + pad(m) + 'm ' + pad(s) + 's';
  }

  var api = {
    reckon: reckon,
    corner: corner,
    horizonDipDegrees: horizonDipDegrees,
    HORIZON_ZENITH: HORIZON_ZENITH,
    SUN_DIAMETER_ARCMINUTES: SUN_DIAMETER_ARCMINUTES,
    PARIS: PARIS,
    METHOD: METHOD,
    METHOD_NOTES: METHOD_NOTES,
    METHOD_CHANGED_ON: METHOD_CHANGED_ON,
    CLAIM_INTRODUCED: CLAIM_INTRODUCED,
    claimApplies: claimApplies,
    julianDay: julianDay,
    shiftDate: shiftDate,
    durationWords: durationWords
  };

  root.Reckoning = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
