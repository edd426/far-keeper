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

  // ---- Method B: USNO Almanac for Computers, low-precision sunrise ----
  // Deliberately not refactored to share anything with method A. A shared
  // helper is a shared mistake.
  function usno(year, month, day, latitude, longitude, rising) {
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

    var cosHourAngle = (cos(HORIZON_ZENITH) - sinDec * sin(latitude)) / (cosDec * cos(latitude));
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
  // the same shape at a coarser grain: every IANA zone *today* sits on a
  // whole quarter-hour between UTC-12:00 (Baker Island) and UTC+14:00
  // (Kiritimati). That range also rejects a whole day (1440) passed off
  // as "24 quarter-hours" — the coarse break, and the likelier one: a
  // day is what falls apart when a *date* breaks, not when a clock does.
  // But this, too, is a claim about the world *now*, not eternal — it
  // would have rejected Paris's own 9 minutes exactly as wrongly, which
  // is why Europe/Paris is checked on its own witnessed terms instead of
  // falling into this general case.
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
  var PARIS_MODERN_DOMAIN_START = '1970-01-01'; // see the sampling above
  var GENERAL_OFFSET_RANGE_MINUTES = { min: -720, max: 840 };
  function assertPlausibleOffset(offsetMinutes, zone, dateISO) {
    if (zone === 'Europe/Paris') {
      if (dateISO < PARIS_MODERN_DOMAIN_START) {
        // Before the witnessed domain: this guard has nothing earned to
        // assert here (Paris Mean Time, the war years, and the unsampled
        // decades between are all real history it hasn't looked at), so
        // it says nothing rather than call a true offset impossible.
        return offsetMinutes;
      }
      if (PARIS_MODERN_OFFSETS_MINUTES.indexOf(offsetMinutes) === -1) {
        throw new Error(
          'reckoning: impossible UTC offset ' + offsetMinutes + 'min for Europe/Paris on ' +
          dateISO + ' — the modern era (' + PARIS_MODERN_DOMAIN_START + ' on) only ever runs ' +
          '60 or 120. Check the tz data before the arithmetic.'
        );
      }
      return offsetMinutes;
    }
    var ok = offsetMinutes % 15 === 0
      && offsetMinutes >= GENERAL_OFFSET_RANGE_MINUTES.min
      && offsetMinutes <= GENERAL_OFFSET_RANGE_MINUTES.max;
    if (!ok) {
      throw new Error(
        'reckoning: impossible UTC offset ' + offsetMinutes + 'min for ' + zone +
        ' — no zone reckons outside a quarter-hour between UTC-12:00 and UTC+14:00. ' +
        'Check the tz data before the arithmetic.'
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

  // The core call. Everything the page shows comes out of this one object,
  // so there is nowhere for a number to enter the tower unaccounted for.
  function reckon(dateISO, place) {
    place = place || PARIS;
    var year = Number(dateISO.slice(0, 4));
    var month = Number(dateISO.slice(5, 7));
    var day = Number(dateISO.slice(8, 10));

    var a = noaa(julianDay(year, month, day), place.latitude, place.longitude);
    if (a.never) {
      return { date: dateISO, place: place, working: a, never: a.never };
    }

    var offsetRise = zoneOffsetMinutes(dateISO, a.sunriseUTC, place.zone);
    var offsetSet = zoneOffsetMinutes(dateISO, a.sunsetUTC, place.zone);
    var offsetNoon = zoneOffsetMinutes(dateISO, a.solarNoonUTC, place.zone);

    var dayLength = a.sunsetUTC - a.sunriseUTC;

    // Yesterday, recomputed from scratch rather than read back from the
    // ledger — so that the change we publish is a claim this file makes
    // today, not a claim it is quoting.
    var yesterdayISO = shiftDate(dateISO, -1);
    var yb = noaa(julianDay(
      Number(yesterdayISO.slice(0, 4)), Number(yesterdayISO.slice(5, 7)), Number(yesterdayISO.slice(8, 10))
    ), place.latitude, place.longitude);
    var yesterdayLength = yb.never ? null : yb.sunsetUTC - yb.sunriseUTC;

    var bRise = usno(year, month, day, place.latitude, place.longitude, true);
    var bSet = usno(year, month, day, place.latitude, place.longitude, false);

    // How much does the softest constant matter? Re-run the same series
    // with the horizon moved one arcminute and see how far sunrise walks.
    // This is a sensitivity, and it is computed — it says how wrong the
    // published time would be *if* the refraction figure is off by that
    // much. It does not say how often it is off, or by how much, and this
    // tower has no way to find that out. Naming the second question and
    // refusing to answer it is the honest half of the answer.
    var nudged = noaa(julianDay(year, month, day), place.latitude, place.longitude, HORIZON_ZENITH + 1 / 60);
    var sensitivity = nudged.never ? null : (nudged.sunriseUTC - a.sunriseUTC) * 60;

    return {
      date: dateISO,
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
      working: {
        julianDay: a.julianDay,
        julianCentury: a.julianCentury,
        meanLongitudeDeg: a.meanLongitude,
        meanAnomalyDeg: a.meanAnomaly,
        eccentricity: a.eccentricity,
        equationOfCentreDeg: a.equationOfCentre,
        apparentLongitudeDeg: a.apparentLongitude,
        obliquityDeg: a.obliquity,
        declinationDeg: a.declination,
        equationOfTimeMinutes: a.equationOfTime,
        hourAngleDeg: a.hourAngle,
        horizonZenithDeg: HORIZON_ZENITH,
        horizonSensitivitySecondsPerArcminute: sensitivity,
        sunriseUTCMinutes: a.sunriseUTC,
        sunsetUTCMinutes: a.sunsetUTC
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
    PARIS: PARIS,
    julianDay: julianDay,
    shiftDate: shiftDate,
    durationWords: durationWords
  };

  root.Reckoning = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
