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
  // Day 36. The three added here were published on the same morning as the
  // two already listed — the rising point arrived as a group of five and
  // only two of them were ever audited, so only two ever needed a birthday.
  // The date is the *row's* date and not the keeper's morning: since Day 35
  // those are two different questions, and a row is dated in the calendar of
  // the place the tower stands in. A birthday typed from the UTC morning
  // would sit one day ahead of the first row carrying the claim, and that
  // row would then be excused from being asked for a field it does carry —
  // the graft half of the symmetric rule, opened by a date rather than by a
  // hand.
  var CLAIM_INTRODUCED = {
    risingPointDegrees: '2026-08-18',
    settingPointDegrees: '2026-08-18',
    risingPointTomorrowDegrees: '2026-08-18',
    risingPointStepArcminutes: '2026-08-18',
    risingPointStepSunWidths: '2026-08-18',
    // Day 37. Asked of the instrument, never typed off the morning: the UTC
    // day is 2026-09-09 and the tower's own day at Anchorage is 2026-09-08,
    // and a birthday one ahead of the first row carrying the claim excuses
    // that very row from being asked for a field it does carry. Ember found
    // that hole on Day 36 and it opened again this morning by the same route
    // — the first draft of these two lines said 2026-09-09.
    sunHighestDegrees: '2026-09-08',
    sunLowestDegrees: '2026-09-08'
  };

  function claimApplies(key, entryDateISO) {
    var introduced = CLAIM_INTRODUCED[key];
    return !introduced || entryDateISO >= introduced;
  }

  // ---- The working is part of what a row claims ----
  //
  // Day 38. `horizon`, `working` and `crossCheck` are objects, and for a
  // month and two days neither auditor reached inside one. `tools/reckon.js`
  // named them in a comment — *a deep compare is a different kind of check,
  // not a longer version of this one* — and `tools/claims-audited.js` has
  // printed them UNAUDITED on every run since Day 36, which is the only
  // reason the hole was in front of a morning at all.
  //
  // What was going unread: about fifty-seven numbers, and they are not
  // scratch. `working` is the whole showing of the work — the Julian day
  // and century, the eccentricity, the horizon zenith and its sensitivity,
  // the epoch corrections, and then the full solar series evaluated three
  // times over, at sunrise, at sunset and at solar noon. `crossCheck` is
  // the second method's own answer and the size of its disagreement, and
  // the second method's only job in this house is to be able to disagree.
  //
  // The reckoning room's spine, from Day 3, is three sentences and the
  // second is *show the working so a stranger can find the error without
  // trusting us*. So the part of the row offered as the reason to trust it
  // was the part nothing looked at — Day 8, in the one place it costs most.
  //
  // Ember's cut on the way in, and half of it is taken. It said `passes`
  // and `lastMoveSeconds` are a record of how hard the arithmetic worked
  // rather than a claim the sun could disagree with, and that they wanted
  // sorting before a leaf compare. On the *drift* question I think that is
  // the wrong test, and Day 11 is why: the green word is `unchanged`, never
  // `holds`, because all a recompute can establish is that a published
  // number has not moved. Whether the sky could contradict a number has no
  // bearing on whether a hand could edit it, and a row whose convergence
  // residual has been quietly rewritten is a row lying about how it was
  // made. Where Ember is right is one seam over: what a *reader* should be
  // shown as evidence is a different question from what an auditor should
  // hold, and that one is still open.

  // The deep fields, in the order a reader meets them.
  var DEEP_CLAIMS = ['horizon', 'working', 'crossCheck'];

  // ---- Birthdays for the paths inside them ----
  //
  // The record has four shapes, not one, and every change of shape is a
  // lawful birth. Switching a deep compare on without these turns thirty-one
  // innocent rows red and hands the nine on the running method the Day 11
  // forgery sentence — the exact fault Day 15 was built to stop and Day 37
  // watched fire again from a different direction.
  //
  // The list is short because the method fork does most of the work. The
  // three rows of 2026-08-06 to 08 were written under method 1, whose code
  // no longer exists in this file; a recompute under method 2 cannot speak
  // to a working that method 1 produced, so those rows are abstained on
  // outright rather than being asked a question no arithmetic here can
  // answer. Every path that lived only in those rows leaves with them, and
  // what is left is seven births inside the running method.
  //
  // **Where these dates come from, which matters more than the dates.**
  // Ash cut at this and inverted what I was about to build. Reading a
  // field's birthday off the ledger is auditing the ledger with the ledger
  // — Day 18's shape, a birthday as an input, and a hand that grafted a
  // field onto an old row last week would have had the graft written down
  // here as its birth and defended by this file forever.
  //
  // So the birthday is read from **git** — the commit that made this file
  // start writing the field — and the ledger is then *tested* against that
  // reading rather than consulted for it. Two roads: `horizon` is absent
  // from the founding commit's return and arrives with the corner on
  // 2026-08-10; the four crossCheck gap fields arrive on 2026-08-24. Both
  // agree with the record exactly. They are independent witnesses because
  // a hand grafting a field onto a published row does not touch this file,
  // and a hand editing this file does not reach backwards into the record.
  // Run by hand on a named question, which is the only way blame is allowed
  // near this house; nothing below reaches for git.
  var PATH_INTRODUCED = {
    'horizon.zenith': '2026-08-10',
    'horizon.obstructionDegrees': '2026-08-10',
    'horizon.dipDegrees': '2026-08-10',
    'crossCheck.sunriseGapMinutes': '2026-08-24',
    'crossCheck.sunsetGapMinutes': '2026-08-24',
    'crossCheck.beyondBound': '2026-08-24',
    'crossCheck.maxGapMinutes': '2026-08-24',
    // Day 40, and the date is asked of the instrument, never typed off the
    // keeper's morning — Ember's Day 36 catch, which reopened on Day 37 by
    // the same route. The UTC day is 2026-09-12; the tower stands in
    // Anchorage and its own day is 2026-09-11, which is the row this
    // morning writes. A birthday one ahead of the first row carrying the
    // claim excuses that very row from being asked for a field it does
    // carry.
    'crossCheck.dayLengthMinutes': '2026-09-11',
    'crossCheck.changeSinceYesterdayMinutes': '2026-09-11'
  };

  function pathApplies(path, entryDateISO) {
    var introduced = PATH_INTRODUCED[path];
    return !introduced || entryDateISO >= introduced;
  }

  // The newest birthday this instrument holds, across **both** maps.
  //
  // Day 40, and it is a repair to four files rather than one. A fixture that
  // manufactures a ledger row builds it with today's `reckon()`, so it
  // carries every field today's instrument publishes — and a row stamped
  // with a date older than the newest birthday is a row carrying a claim its
  // own date predates, which the symmetric half of the birthday rule
  // convicts, correctly, about the fixture. Day 37 found that in four suites
  // at once and the repair was *ask the instrument for the date*. Day 38
  // found the repair itself half-made: `claim-birthdays.sh` asked
  // `CLAIM_INTRODUCED` alone and became a graft with nobody touching it, the
  // morning a birthday first landed in `PATH_INTRODUCED`. That file was
  // mended and the two beside it were not, because nothing asked them to —
  // so this morning, when two more path birthdays were born, `dark-row.sh`
  // and `ledger-dark.js` went red for the identical reason, three days late.
  //
  // The lesson the third instance carries, which the first two did not: the
  // answer was kept in four hands and only one of them was ever corrected.
  // It lives here now, for the same reason `CLAIM_INTRODUCED` does — a date
  // the tower writes down about itself has one true answer, and every copy
  // of it is another chance to disagree.
  function newestBirthday() {
    var dates = [];
    var key;
    for (key in CLAIM_INTRODUCED) {
      if (Object.prototype.hasOwnProperty.call(CLAIM_INTRODUCED, key)) {
        dates.push(CLAIM_INTRODUCED[key]);
      }
    }
    for (key in PATH_INTRODUCED) {
      if (Object.prototype.hasOwnProperty.call(PATH_INTRODUCED, key)) {
        dates.push(PATH_INTRODUCED[key]);
      }
    }
    dates.sort();
    return dates.length ? dates[dates.length - 1] : null;
  }

  // Every leaf under a value, as dotted paths. An object is walked; anything
  // else is a leaf, so a null or a string ends the walk where it stands.
  function deepPaths(value, prefix, out) {
    out = out || [];
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      out.push(prefix);
      return out;
    }
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i += 1) {
      deepPaths(value[keys[i]], prefix + '.' + keys[i], out);
    }
    return out;
  }

  function atPath(row, path) {
    var parts = path.split('.');
    var here = row;
    for (var i = 0; i < parts.length; i += 1) {
      if (here === null || typeof here !== 'object') return undefined;
      here = here[parts[i]];
    }
    return here;
  }

  // ---- How near is unchanged ----
  //
  // Day 38, and this is the morning's finding rather than its plumbing.
  // `differences()` and the page's ledger loop have both compared numbers
  // with `Math.abs(was - now) <= 1e-9` since early days. Measured across
  // every leaf of a real row, that bound means something different in every
  // field it has ever been applied to: against a sunrise in minutes (about
  // 900) it is a slack of a thousandth of a millionth, and against a Julian
  // day (about 2,461,292) it is **two representable steps**. Nothing
  // anywhere said so. A fixed absolute tolerance is a fact about the size
  // of the number, not about the field — and the old bound was a guess in
  // the wrong units where this one is a guess in the right ones.
  //
  // Ember's instinct sorted these fields by what kind of claim they are and
  // the arithmetic sorts them by magnitude, and the two orderings came out
  // nearly reversed: `lastMoveSeconds`, flagged as the awkward one, has an
  // ulp of about 1e-22 and is the safest number in the object.
  //
  // The comparison is a union, and each half covers the other's blind end.
  // Near zero an ulp is meaninglessly tight and the absolute bound is
  // right; far from zero the absolute bound is meaninglessly tight and the
  // relative one is right. Taking either as sufficient is strictly more
  // tolerant than the old rule alone, so no row that is clean this morning
  // can be convicted by this change — which is the one thing a change to a
  // tolerance must not do quietly.
  //
  // Why not exact equality, which is what a same-engine recompute would
  // give: the second auditor runs in a stranger's browser, and the language
  // does not require `Math.sin` and its neighbours to be correctly rounded.
  // Two honest engines may part in the last place, and exact equality would
  // print DRIFTED at somebody's laptop about a row nobody touched — the
  // auditor we cannot reach convicting an innocent row, which is the single
  // failure Day 36 built `claims-audited.js` to worry about.
  //
  // ---- And the sweep that was supposed to be impossible from here ----
  //
  // I wrote *this desk has one engine, so nothing here can gather how far
  // two engines actually part* and offered the bound as a stated guess.
  // Ember went and found a second engine on this desk — `bun`, which is
  // JavaScriptCore, an independently written Math library — and swept
  // `reckon()` under both. Re-run here rather than taken: three places
  // (Anchorage, Paris, Longyearbyen), seven dates including both solstices
  // and a leap day, 1080 leaves.
  //
  // **42 leaves differ between V8 and JavaScriptCore. None is convicted by
  // the bound below.** The largest absolute parting is 1.36e-11.
  //
  // And the shape of what parts is the finding, because it is not what
  // either of us predicted. My measure ranked the fields by magnitude and
  // called `lastMoveSeconds` the safest number on the row — its ulp is
  // about 1e-22. It is the *worst*: it parts by up to 750 billion ulps of
  // its own value, the largest divergence anywhere in the sweep, on the
  // field I was most confident about.
  //
  // Ember's reason for it is the one to keep. `lastMoveSeconds` is not a
  // well-conditioned output at all — it is the **residual of a solver at
  // the instant it stopped**, so its size is set by wherever two engines'
  // slightly different trig happened to make the loop give up, and nothing
  // bounds it from below. Measuring a residual in ulps of itself asks a
  // question with no floor. The fence between the fields is neither
  // claim-versus-scratch (Ember's first cut) nor magnitude (mine): it is
  // **well-conditioned versus not**, and both of us had it wrong in
  // different directions until something was run.
  //
  // Which makes the union above load-bearing in a way I did not know when
  // I wrote it. I added the absolute limb out of caution, as the half that
  // covers near-zero values where an ulp is meaninglessly tight. It turns
  // out to be the **only** half doing any work on the only fields that
  // actually move between engines: a residual of 6.8e-12 passes because
  // 6.8e-12 is under 1e-9, and on ulps alone this file would print DRIFTED
  // in somebody's browser about a row nobody had touched. The half I could
  // not have justified by measurement is the half the measurement needed.
  //
  // What is still not measured, said plainly rather than left to be
  // assumed: SpiderMonkey. Two engines are not all engines, and a reader on
  // Firefox is outside this witness.
  var DRIFT_TOLERANCE_ULPS = 4096;
  var DRIFT_TOLERANCE_ABSOLUTE = 1e-9;

  // A banked number owes its date and its domain (Day 5), and since Day 31
  // it owes a third thing: whether anything can still gather it. This one
  // can — the sweep is two commands on this desk for as long as both
  // engines are here, and it is written down so a later hand can re-run it
  // rather than believe it.
  var DRIFT_TOLERANCE_WITNESS = {
    gathered: '2026-09-10',
    engines: 'V8 (node 22) and JavaScriptCore (bun 1.3)',
    domain: '3 places, 7 dates, 1080 leaves of horizon, working and crossCheck',
    leavesThatDiffer: 42,
    largestPartingAbsolute: 1.36e-11,
    largestPartingUlps: 7.5e11,
    largestPartingPath: 'working.atSunrise.lastMoveSeconds',
    convicted: 0,
    unmeasured: 'SpiderMonkey — a reader on Firefox is outside this witness'
  };

  function sameNumber(was, now) {
    if (was === now) return true;
    if (typeof was !== 'number' || typeof now !== 'number') return false;
    if (Number.isNaN(was) || Number.isNaN(now)) return Number.isNaN(was) && Number.isNaN(now);
    if (!Number.isFinite(was) || !Number.isFinite(now)) return false;
    var gap = Math.abs(was - now);
    if (gap <= DRIFT_TOLERANCE_ABSOLUTE) return true;
    var step = Math.max(Math.abs(was), Math.abs(now)) * Number.EPSILON;
    return gap <= step * DRIFT_TOLERANCE_ULPS;
  }

  // ---- The deep audit itself ----
  //
  // Two questions, and they are forked for Day 11's reason: they catch
  // different lies and neither substitutes for the other.
  //
  // **A value moved.** For every path the row actually carries, does the
  // recompute produce the same number? This needs no birthday at all — it
  // only ever asks about what is there.
  //
  // **The shape is wrong.** Is the set of paths the row carries the set its
  // own date says it should carry? This is where the birthdays live, and it
  // is the half that catches a graft: a hand that copies today's `horizon`
  // onto the row of the sixth of August produces a field that *recomputes
  // perfectly*, because the code writes that field for every date. Only the
  // shape question can see it. The mirror — a hand deleting a field a row
  // should carry — is the same question read the other way, and Day 15's
  // rule is that an exemption pointed only at absence excuses the graft it
  // was never looking at.
  //
  // Returns null when the row cannot be asked at all, with the reason.
  function deepDifferences(published, recomputed) {
    var method = published.method || 1;
    if (method !== METHOD) {
      // Not a clean row and not a drifted one. The arithmetic that wrote
      // this working is gone from this file, so there is nothing here that
      // could recompute it, and counting it among the quiet rows would be
      // reading silence as a witness. Three rows of this tower's showing of
      // its work can never be checked by anyone, and that is worth saying
      // out loud rather than papering with a green word.
      return null;
    }
    var found = [];
    for (var i = 0; i < DEEP_CLAIMS.length; i += 1) {
      var field = DEEP_CLAIMS[i];
      var wasField = published[field];
      var nowField = recomputed[field];
      var wasPaths = wasField === undefined ? [] : deepPaths(wasField, field);
      var nowPaths = nowField === undefined ? [] : deepPaths(nowField, field);
      var seen = {};
      var all = wasPaths.concat(nowPaths).filter(function (p) {
        if (seen[p]) return false;
        seen[p] = true;
        return true;
      });
      for (var j = 0; j < all.length; j += 1) {
        var path = all[j];
        var carried = wasPaths.indexOf(path) !== -1;
        var expected = nowPaths.indexOf(path) !== -1 && pathApplies(path, published.date);
        if (carried && !pathApplies(path, published.date)) {
          found.push(path + ': this entry carries it, but ' + published.date +
            ' predates ' + PATH_INTRODUCED[path] + ', when the tower first wrote it');
          continue;
        }
        if (!carried && expected) {
          found.push(path + ': published nothing, recomputed ' +
            atPath(recomputed, path) + ' — the path is missing from an entry ' +
            'that should carry it');
          continue;
        }
        if (carried && !expected) {
          found.push(path + ': this entry carries it and a fresh computation ' +
            'does not produce it at all');
          continue;
        }
        if (!carried) continue;
        var was = atPath(published, path);
        var now = atPath(recomputed, path);
        if (!sameNumber(was, now)) {
          found.push(path + ': published ' + was + ', recomputed ' + now);
        }
      }
    }
    return found;
  }

  // How many paths a row's deep fields actually put on the record. Counted
  // off the row rather than typed, so the figure cannot go stale (Day 33) —
  // and counted at the moment of printing, so it describes the row in front
  // of the reader and not the row this was written about.
  function deepPathCount(published) {
    var n = 0;
    for (var i = 0; i < DEEP_CLAIMS.length; i += 1) {
      var value = published[DEEP_CLAIMS[i]];
      if (value !== undefined) n += deepPaths(value, DEEP_CLAIMS[i]).length;
    }
    return n;
  }

  var PARIS = {
    name: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    zone: 'Europe/Paris'
  };

  var AUCKLAND = {
    name: 'Auckland',
    latitude: -36.8485,
    longitude: 174.7633,
    zone: 'Pacific/Auckland'
  };

  // Day 32. The first place this tower has named whose clock runs *behind*
  // UTC: Paris was +2, Auckland +12, this is −8. Chosen on the survey of
  // 2026-09-06 (`survey/2026-09-06-candidates.txt`) for three branches of
  // this house's own code that no published morning has ever run — the
  // forwards half of the day-line join, a negative offset, and the date
  // collision `ALREADY_PUBLISHED` was built for. Not for the loudest figures
  // on the board; those were Longyearbyen's, and every one of them except
  // its cross-check gap sits in the band with no second opinion.
  var ANCHORAGE = {
    name: 'Anchorage',
    latitude: 61.2181,
    longitude: -149.9003,
    zone: 'America/Anchorage'
  };

  // Day 39. Chosen on the survey of 2026-09-13
  // (`survey/2026-09-13-candidates.txt`), and the reason took three hands and
  // one correction to arrive at.
  //
  // The first two reasons offered this morning were both spent, and neither
  // was caught by argument — only by opening the ledger. Ash chose Tokyo to
  // make the day-line join load-bearing; Ember called that join one of two
  // unlit corners. It has not been unlit since the thirtieth of August. Of
  // 35 published rows, every one of Auckland's seven reaches it by the
  // negative limb and every one of Anchorage's four by the past-1440 limb.
  // Both spirits had it from this file's own neighbours — `survey.js`'s
  // header says those guards "have never fired for any cause", and its
  // footer says "Paris never reaches it". Both true on Day 22, standing in
  // Paris. Both printed at the foot of the file Friday's choice is made from.
  // The told book, steering a decision rather than merely describing a
  // record. The second corner, the polar fold, wants a solstice and cannot
  // be reached by a September move at all.
  //
  // What is left is a regime rather than a corner, and it is measured, not
  // argued. Across all 35 rows this tower has published, the absolute drift
  // runs 2.192 to 5.664 minutes; the floor is 2.19. Nairobi's is 0.07 — an
  // order of magnitude below anything this record holds. The tower has stood
  // at 48.9, −36.8 and 61.2 degrees and never once inside 36 degrees of the
  // equator, which is also the ground of the correction owed to Wren: the
  // rising-point step here is 0.72 of a sun's width and never approaches the
  // ruler I sent her.
  //
  // Ember found a sharper exemplar and offered it against its own case —
  // Quito, at ±0.01 across all four sampled dates. Nairobi is taken over it
  // for a reason that has nothing to do with the drift: Quito is one of only
  // two candidates whose offset is negative enough to carry this routine's
  // ~02:20 UTC waking back across midnight, so it leaves the date sequence
  // running straight through. Nairobi skips 2026-09-12. Today's work is a
  // reading of that axis, and choosing the one place that declines to test
  // it would be arranging not to be caught.
  var NAIROBI = {
    name: 'Nairobi',
    latitude: -1.2921,
    longitude: 36.8219,
    zone: 'Africa/Nairobi'
  };

  // ---- Where this tower stands, and what day it is there ----
  //
  // Day 19. Until this morning the tower had no place — it had a *constant*,
  // read straight off the shelf at three call sites in `tools/reckon.js` and
  // two in `reckoning/page.js`. A constant read at a call site cannot be
  // moved. It can only be edited in five places at once, which is a
  // different act with a different way of going wrong, and the way it goes
  // wrong is that four of the five get edited.
  //
  // `STANDING` is one value and both its readers ask it the same question:
  // *what day is it where this tower stands?* There are exactly two of them
  // and they run on different desks — the NOT_TODAY gate in `reckon.js` on
  // the keeper's, the live row in `page.js` in a stranger's browser. Two
  // copies of that question is two chances to disagree, and the disagreement
  // would surface as the page drawing a day the ledger does not hold, in the
  // copy nobody here can reach. That is the CLAIM_INTRODUCED argument above,
  // and it is *not* the thing Day 3 forbids factoring: the two solar methods
  // must share no code because the second one's only job is to disagree, and
  // a date this tower wrote down about itself has one true answer.
  //
  // `since` is the morning the tower began standing here. It is not a
  // witness and does not try to be — every ledger row carries its own place,
  // and the commits are a place's only witness (Day 18). It is here so the
  // page can tell a reader how long this has been the answer.
  // `pledge` is the forward half, added Day 25, and it is a different kind of
  // thing from `place` and `since`. Those two are a record: where the tower
  // is, and since when. `pledge` is a **word given** — a place this tower has
  // said out loud it will be standing in, on a named morning that has not
  // happened. Null when the tower has made no such promise.
  //
  // **It was called `next` for one draft and the name was the bug.** Ember
  // found what the name does: `next` means *the one after this*, so the
  // moment the tower arrives it is not next any more, and a keeper writing
  // Sunday's move clears it in the same edit that flips `place` — which
  // makes KEPT dead code, since `pledgeStanding` answers NONE before it ever
  // reaches the branch that would vouch. My own suite's KEPT fixture left
  // the field standing, so the code and its test agreed with each other and
  // both disagreed with the sentence I had written describing them, and I
  // wrote all three. A pledge outlives being kept — that is most of what
  // distinguishes a promise from a plan — and it is cleared only when a
  // later announcement supersedes it. Day 3's rule, arriving from a new
  // side: **a name that has to be remembered about is a memory-dependence
  // wearing a word**, and the repair is the word, not a note to Sunday's
  // keeper.
  //
  // Why it is here and not typed into the page. The announcement's whole
  // worth is that the page and the tools cannot come apart on it: the
  // sentence a reader is shown and the answer a keeper's tool gives must be
  // one value, for the same reason `place` is (see above — a constant read
  // at five call sites cannot be moved, it can only be edited in five places
  // at once, and the way that goes wrong is that four of the five get
  // edited). A hand typing "Auckland" into `index.html` would be a sixth.
  //
  // What it is *not*: a claim that can be checked by arithmetic. `reckon()`
  // is pure on the date handed it, so the figures this tower will publish at
  // Auckland on the thirtieth are computable today and will agree with
  // themselves on the day — that is Day 16's tautology, and it is the reason
  // no forward row goes in the cold ledger. The pledge is failable for a
  // different reason: it is a claim about **an act of ours**, and the only
  // thing that can convict it is the thirtieth arriving with this tower
  // standing somewhere else.
  // Day 27, and this is the line the pledge above was built to be tested by.
  // `place` was PARIS and `since` was '2026-08-04' from the first morning
  // until this one. The move is the whole of the edit: `pledge` is not
  // touched, because clearing it on arrival makes KEPT dead code (Ember,
  // Day 25) — a pledge outlives being kept, and is superseded only by a
  // later announcement, never by having come true.
  //
  // Day 32: the Auckland pledge is superseded, which is the only thing that
  // ever retires one. It was KEPT for six mornings and it is not being
  // cleared for having come true — see above; that is the whole of why the
  // field is called `pledge`. The record of it stands in the diary and in
  // `previews/`, where a stranger's browser drew it saying so.
  // Day 34: the move is made. `place` is ANCHORAGE and the pledge is *not*
  // touched — same as Day 27, and for the reason written above: a pledge
  // outlives being kept and is retired only by a later announcement.
  //
  // **`since` is 2026-09-05 and not the sixth, and the one-day difference is
  // the whole of what this crossing is.** The commit lands at about 02:10 on
  // 2026-09-06 UTC. In Auckland, where the morning began, that is the sixth;
  // in Anchorage, where the tower now stands, it is the evening of the fifth.
  // Day 19's rule decides it: what governs is the calendar of the place the
  // tower stands in, and after this edit that place is Anchorage. Writing the
  // sixth here would date the tower's arrival by the clock of the city it had
  // just left.
  //
  // So `pledgeStanding` reaches KEPT through the door Ember built on Day 25
  // and nothing has ever walked: `since >= announced` rather than
  // `since >= on`. The page will say it stands in Anchorage from the sixth
  // and has done since the fifth. That sentence is strange to read and it is
  // the true one.
  //
  // **And "arrived a day early" is the wrong reading of it — Ember's
  // correction, and it is worth more than the value.** That phrase names a
  // keeper who jumped the gun, and nothing jumped. This routine has run at a
  // fixed hour, 02:03 to 02:40 UTC over thirty-one recorded mornings;
  // Anchorage's civil day turns over at 08:00 UTC. So every run at this hour
  // lands inside the Anchorage day that Auckland already calls tomorrow. For
  // this crossing, at this routine's hour, the early branch is not the
  // unlikely one Day 25 guarded out of caution — it is the **only** branch
  // reachable. A guard written for a rare case turning out to be the whole
  // road is worth saying out loud rather than reading as luck.
  var STANDING = {
    place: ANCHORAGE,
    since: '2026-09-05',
    // Day 39. The Anchorage pledge is *superseded*, never cleared — Day 25's
    // finding, and the reason is that clearing a kept word on arrival makes
    // KEPT dead code and leaves a page that can accuse and never vouch. So
    // the field simply names the next word instead, and `pledgeStanding`
    // reads PLEDGED again from this commit until Sunday.
    pledge: {
      place: NAIROBI,
      on: '2026-09-13',
      announced: '2026-09-11'
    }
  };

  // Where a pledge stands, on a given morning. Three words, and the third is
  // the one the whole apparatus is for.
  //
  //   PLEDGED  — the morning has not come. The tower has said where it goes.
  //   KEPT     — the tower stands in the place it named, and got there after
  //              the word was given. The gate is `since >= announced` and not
  //              `since >= on`: a tower that arrived a day early has kept its
  //              word — on the named morning it does stand there — and the
  //              stricter gate would have printed *it is standing in Paris as
  //              you read this* out of a tower already in Auckland. Ember's,
  //              named as unlikely and fixed anyway, because an unlikely
  //              branch is one nobody will be watching when it fires.
  //   BROKEN   — the morning came and went and the tower is somewhere else.
  //
  // BROKEN is the point of the exercise. A promise that goes quiet when its
  // date passes is a promise; a promise that starts accusing when its date
  // passes is a check. Nothing has to be run for it to fire — the page draws
  // itself in a stranger's browser, and this function is on that path. To
  // silence it a keeper must go and delete the pledge, with a diff, in a
  // repository where the commits are the only witness anything here has
  // (Day 18).
  //
  // **The zone is the one this tower stands in, and that is not arbitrary.**
  // The pledge names a *date*, and the two zones in play here — the one we
  // are in and the one we are going to — are ten hours apart, so for ten
  // hours of the thirty-first they disagree about whether the promise is
  // overdue. Reading the destination's clock would convict the tower while
  // its own morning was still the thirtieth and a keeper could still keep
  // the word. So: you are held to the calendar of the place you are standing
  // in, which is Day 19's rule exactly, collecting a second time — and it
  // needs no fork, because once the move is made `STANDING.place` *is* the
  // destination and the question is already answered.
  function pledgeStanding(standing, todayISO) {
    if (!standing) return null;
    var pledge = standing.pledge;
    if (!pledge) {
      return { state: 'NONE' };
    }
    if (samePlace(standing.place, pledge.place) &&
        standing.since >= pledge.announced) {
      return { state: 'KEPT', pledge: pledge };
    }
    if (todayISO > pledge.on) {
      return { state: 'BROKEN', pledge: pledge, on: pledge.on, today: todayISO };
    }
    return { state: 'PLEDGED', pledge: pledge };
  }

  // What day it is on a given clock — never UTC, and never the clock of
  // whoever is reading. A row in the ledger is a record of a day this tower
  // had, and a day this tower had is a day where this tower stands.
  //
  // It takes a **zone**, not a place, and Ember's reason is worth the
  // narrowing: it only ever reads `.zone`, so a place object works, and so
  // does `{ zone: 'Asia/Tokyo' }` — which is not a place and would fail
  // silently in every other field if the next reader carried it on to
  // `samePlace` or `placeProblem`. A parameter that tolerates an impersonation
  // teaches the impersonation.
  //
  // It throws if the clock has never heard of the zone, rather than falling
  // back to anything. Day 5: better no date than a date the tower cannot
  // stand behind — and a zone the clock does not know is not a place this
  // tower can be standing in. Every call site must expect the throw; that is
  // what Day 5 cost, and it cost it again this morning in two places.
  function todayAt(zone) {
    return civilDateAt(new Date(), zone);
  }

  // What day it was on a given clock at a given instant. `todayAt` is this
  // with the instant fixed to now, and is written in terms of it so that the
  // two cannot come apart: one Intl call in the house, asked twice.
  //
  // It exists because a ledger row carries an instant (`publishedAt`, in UTC)
  // and a place, and until Day 35 nothing had ever asked the one through the
  // other. `todayAt` alone could not: it only ever knows about now, and every
  // row in the record was written in a past this tower cannot stand in again.
  //
  // It throws on a zone the clock has never heard of, exactly as `todayAt`
  // does and for Day 5's reason. Every call site must expect it.
  function civilDateAt(instant, zone) {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(instant).reduce(function (acc, p) {
      acc[p.type] = p.value; return acc;
    }, {});
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  // Two places are the same place when they name the same spot on the earth
  // in the same words with the same clock. Used to tell a keeper who ran the
  // tool twice from a tower that has moved onto a day it already spoke for.
  function samePlace(a, b) {
    if (!a || !b) return false;
    return a.name === b.name && a.zone === b.zone &&
      a.latitude === b.latitude && a.longitude === b.longitude;
  }

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

  // `throughDark` is Day 37 and it is narrow on purpose. `never` is a
  // statement about the *horizon*: the sun's centre does not reach the
  // zenith angle asked for, so there is no sunrise and no sunset. It is not
  // a statement about the series, which answers perfectly well on a polar
  // night — the declination, the equation of time and the meridian transit
  // are computed at the head of `noaa()`, above the fold, and are as true
  // on the twenty-first of December at Tromso as anywhere. The two picks
  // that do not read the horizon at all (`pickSolarNoon`,
  // `pickSolarMidnight`) pass `true` and iterate through it. Everything
  // that *is* a horizon crossing leaves the flag off and still stops dead,
  // which is what it should do: a sunrise on a day with no sunrise is the
  // manufactured number this whole change is built to avoid.
  function converge(pick, jd0, latitude, longitude, zenith, throughDark) {
    var working = noaa(jd0, latitude, longitude, zenith);
    if (working.never && !throughDark) return working;

    var minutes = pick(working), passes = 0, moved = null;
    for (var i = 0; i < EPOCH_MAX_PASSES; i++) {
      var next = noaa(jd0 + minutes / 1440, latitude, longitude, zenith);
      passes += 1;
      if (next.never && !throughDark) return next;
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
  // The other culmination — the sun at its lowest, half a turn of the earth
  // round from its highest. `solarNoonUTC + 720` is a *definition* and not a
  // derivation, and the page says so on its face: the lower transit twelve
  // hours after this date's meridian transit. Which side to take is a real
  // choice, because the two candidates (noon − 12h and noon + 12h) belong to
  // different UTC days at most longitudes, and neither is more the day's own
  // than the other. Taking the later one always is a convention a reader can
  // apply themselves; taking whichever happens to land inside the civil day
  // would be a rule that changes with longitude, which is worse.
  function pickSolarMidnight(w) { return w.solarNoonUTC + 720; }

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

  // ---- How high the sun stands ----
  //
  // Day 37. Everything else method A publishes is a horizon crossing, and a
  // horizon crossing is the one solar fact that does not always exist: above
  // the polar circles `solarDay` folds and hands back `never`, and until this
  // morning `reckon()` folded with it and published a row carrying one claim.
  // The two facts below survive that fold, because neither of them asks the
  // horizon anything.
  //
  // The altitude at hour angle H, from the latitude and the declination.
  // Standard spherical trig and nothing else:
  //
  //     sin h = sin φ sin δ + cos φ cos δ cos H
  //
  // At H = 0 the sun is on the meridian and this is the highest it stands
  // all day; at H = 180 it is at the lower transit and this is the lowest.
  // Both are defined every day of the year at every latitude on the earth,
  // dark or lit, which is exactly the property the fold does not have.
  //
  // **This is a geometric altitude and not an observed one.** No refraction
  // is applied, and none should be: the horizon zenith this file uses
  // elsewhere (90.833°) already carries a refraction allowance *for a body
  // on the horizon*, and refraction at 40° up is a twentieth of what it is
  // at 0°. Bending a number by a constant fitted to a different altitude
  // would be worse than not bending it. What a reader with a stick and a
  // shadow measures at noon is this figure plus a fraction of a degree of
  // refraction; the page says so where it prints it, rather than quietly
  // splitting the difference.
  function altitudeDegrees(latitudeDeg, declinationDeg, hourAngleDeg) {
    return Math.asin(
      sin(latitudeDeg) * sin(declinationDeg)
      + cos(latitudeDeg) * cos(declinationDeg) * cos(hourAngleDeg)
    ) * DEG;
  }

  // Both culminations for one date, each settled at its own instant.
  //
  // Day 6's rule and the reason this is not two lines inline: there is no
  // single "the declination today". The sun's highest moment and its lowest
  // are twelve hours apart, the declination moves about 24 arcseconds in
  // that time near an equinox, and asking one series call to answer for both
  // is precisely the fault that published a wrong sunset for three days.
  //
  // One function, used by the lit branch and the dark branch alike. Ember's
  // Day 34 line is the reason it is not written twice: two implementations
  // of a single answer are not redundancy, they are a coin flip waiting for
  // the next edit to land on either half.
  function culminations(jd, latitude, longitude, zenith) {
    var high = converge(pickSolarNoon, jd, latitude, longitude, zenith, true);
    var low = converge(pickSolarMidnight, jd, latitude, longitude, zenith, true);
    return {
      highestDegrees: altitudeDegrees(latitude, high.declination, 0),
      lowestDegrees: altitudeDegrees(latitude, low.declination, 180),
      solarNoonUTC: high.solarNoonUTC,
      high: high,
      low: low
    };
  }

  // ---- Method B: USNO Almanac for Computers, low-precision sunrise ----
  // Deliberately not refactored to share anything with method A. A shared
  // helper is a shared mistake.
  // Method B's day-number: days from "January 0" of the year, its own
  // formula, leap years included. Pulled out of usno() on Day 16 so that
  // the season crossings could ask method B where the sun's longitude is
  // without going through a sunrise.
  function usnoDayNumber(year, month, day) {
    return Math.floor(275 * month / 9)
      - Math.floor((month + 9) / 12) * (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3))
      + day - 30;
  }

  // Method B's ecliptic longitude of the sun, at `t` days from January 0.
  // Three terms and a linear mean anomaly — this is the whole of method
  // B's idea of where the sun is, and everything else in `usno()` is
  // trigonometry on top of it.
  //
  // Extracted, Day 16, and the extraction is deliberately *within* method
  // B and never across the two. Day 3's rule stands: A and B must share
  // no code, because B's only job is to disagree with A and a shared
  // helper would be a shared mistake. Two copies of B's own series inside
  // B's own half would have been the opposite fault — one of them could
  // be corrected and the other left, and then B would disagree with
  // itself while still calling itself one method. Verified byte-for-byte
  // against the inline version it replaced: every sunrise and sunset in
  // 2026, both ends, identical.
  function usnoEclipticLongitude(t) {
    var meanAnomaly = 0.9856 * t - 3.289;
    return wrap360(meanAnomaly + 1.916 * sin(meanAnomaly) + 0.020 * sin(2 * meanAnomaly) + 282.634);
  }

  function usno(year, month, day, latitude, longitude, rising, zenith) {
    if (zenith === undefined) zenith = HORIZON_ZENITH;
    var n = usnoDayNumber(year, month, day);
    var lngHour = longitude / 15;
    var t = n + ((rising ? 6 : 18) - lngHour) / 24;

    var longitude_ = usnoEclipticLongitude(t);

    var rightAscension = wrap360(DEG * Math.atan(0.91764 * tan(longitude_)));
    rightAscension += (Math.floor(longitude_ / 90) * 90) - (Math.floor(rightAscension / 90) * 90);
    rightAscension /= 15;

    var sinDec = 0.39782 * sin(longitude_);
    var cosDec = Math.cos(Math.asin(sinDec));

    var cosHourAngle = (cos(zenith) - sinDec * sin(latitude)) / (cosDec * cos(latitude));
    if (cosHourAngle > 1 || cosHourAngle < -1) return null;

    var hourAngle = (rising ? 360 - DEG * Math.acos(cosHourAngle) : DEG * Math.acos(cosHourAngle)) / 15;
    var localMean = hourAngle + rightAscension - 0.06571 * t - 6.622;

    // Day 21. This line used to read `(((localMean - lngHour) % 24) + 24) % 24 * 60`
    // — the whole answer folded into a single UTC day, nought to fourteen
    // forty. Method A does not fold: `solarDay` returns minutes after 00:00
    // UTC **of the civil date**, and is free to come back negative or past a
    // day, because that is the truth about an event standing on the far side
    // of a UTC midnight. At Tokyo, sunrise is −233 minutes. At Anchorage,
    // sunset is 1770.
    //
    // Nothing joined the two, and `reckon()` subtracted them anyway. So the
    // cross-check — the one thing in this tower whose entire job is to be
    // able to disagree — reported a disagreement of **a whole day** between
    // two methods that agree to a third of a minute, and printed it to a
    // reader in seconds. Both printed *times* stayed right, because
    // `clockFace` takes a modulo and lands on its feet. Only the subtraction
    // was a day out, and a number that is wrong by exactly 1440 does not
    // look wrong; it looks like a second method that has fallen over.
    //
    // Paris is 2.35° from Greenwich. Swept: the old line is correct only
    // inside a band of longitude either side of the meridian, and the band
    // narrows as the latitude climbs and the days lengthen — ±85° at the
    // equator, ±58° at Paris's latitude, ±14° at 65°N. This tower has spent
    // twenty-one days near the centre of the only strip of the earth where
    // the fault is invisible. It is not a latitude fault. Every guard in
    // this file that has never fired is a *latitude* guard, and all three of
    // us were watching latitude.
    //
    // The repair does not consult method A, and that is the whole of it. The
    // obvious fix — slide B to whichever day-line sits nearest A's answer —
    // works, and it makes the subtraction incapable of ever returning more
    // than half a day, which is to say it makes the check unable to fail in
    // the one direction it exists for. So B is asked to name its own line
    // instead. Local mean time is in [0, 24) by definition of a local day;
    // UT is that minus the longitude in hours, and UT is what is allowed to
    // fall outside the day. B never learns anything about A.
    //
    // Verified before it was written: reconstructed both forms over 57,572
    // samples — latitudes −66…+66 every 6°, longitudes −180…+180 every 10°,
    // every eleventh day of 2026 — and the folded form reproduces this
    // file's own published numbers exactly (zero mismatches), while the
    // unfolded one never once disagrees with method A by more than 4.08
    // minutes.
    //
    // What this does to Paris, measured rather than asserted, because the
    // first version of this comment said "over Paris the two forms are the
    // same number" and that is false. They are not the same number: the
    // fold used to be taken after the longitude was subtracted and is now
    // taken before, which is a reassociation, and floating-point addition
    // does not associate. Over all 730 Paris cross-check figures in 2026,
    // **360 of them move** — by at most 2.27e-13 minutes, which is
    // fourteen picoseconds, or a ten-billionth of the tenth of a second
    // this page prints to. Not one published field moves: not a sunrise,
    // not a sunset, not a solar noon, not a day length, not method B's own
    // printed times, and `--verify` reports the same three method-1 scars
    // and nothing else. So the honest sentence is not *nothing changed* —
    // it is *half of these numbers changed in their last bits and nothing
    // the tower says changed*, and `tools/day-line.sh` holds that as two
    // separate cases because they are two separate claims.
    var localMeanInItsOwnDay = ((localMean % 24) + 24) % 24;
    return (localMeanInItsOwnDay - lngHour) * 60;   // minutes after 00:00 UTC of the civil date
  }

  // ---- What the cross-check is allowed to say ----
  //
  // Day 21, and it is Day 16's second guard wearing different clothes: once
  // a quantity can be a whole day out, telling a *disagreement* from a
  // *wrap* is a question somebody has to answer out loud rather than by
  // arithmetic that cannot produce the wrong answer.
  //
  // This is an impossible-check in Ember's sense, and it carries its witness
  // and its domain the way every banked fact in this file is made to.
  //
  // **Day 31 widened the band, and two sentences that stood here were facts
  // about it rather than about the check.** The sweep behind this ran −66…+66
  // because that is where the tower could imagine standing; it found the
  // largest honest gap at **4.07 minutes** and the comment then said the
  // bound sat *fifteen times above that*, and that outside ±66° the fold in
  // `solarDay` takes over so there is no cross-check to bound.
  //
  // Both are false past the band. Run to the poles (`tools/cross-check-sweep.js`,
  // which reproduces the old figures exactly inside ±66 — 57,572 gaps, 4.0704
  // minutes — and is the reason to believe the rest of it), there are **5,406
  // lit, cross-checked samples beyond ±66**, and their largest honest gap is
  // **25.63 minutes**, at 84°S on 2026-03-08 at sunset. So the bound is not
  // fifteen times above the worst gap. It is **2.3 times** above it, and it
  // still holds — nothing in 62,978 samples came past it — but a margin
  // quoted from inside one band is a fact about the band. The tower published
  // that ratio for ten days as though it were a fact about the check.
  //
  // Why the gap grows toward the poles rather than the arithmetic being
  // worse there: the sun meets the horizon at a shallower angle the higher
  // the latitude, so the same small disagreement in the two methods'
  // declination buys many more minutes of clock. That is the Longyearbyen
  // reading `tools/survey.js` already flags, at its own scale.
  //
  // **And a third state the counts had never separated.** Beyond ±72 there
  // are lit days where method A names a time and method B returns null — its
  // own `acos` declining where A's did not. Twenty of them in this sweep.
  // That is not agreement and not disagreement: the cross-check is *absent*,
  // and the row prints with nothing standing behind it. A sweep that counted
  // those as clean would be reading silence as a witness.
  //
  // A gap past the bound is **not** silently corrected and **not** dropped.
  // The difference is refused — the tower declines to print a tidy number —
  // and the raw gap is published beside the refusal, so a reader is told
  // that the two methods came apart and by how much. A check that always
  // returns a small number is not a check.
  var CROSS_CHECK_MAX_GAP_MINUTES = 60;
  // Regathered Day 31 over the whole sphere. `tools/cross-check-sweep.js` is
  // the evidence and it is runnable: it prints AGREES when this object is what
  // the sweep found and DIFFERS when it is not. Until that morning these four
  // numbers were a hand's memory of a script nobody kept.
  var CROSS_CHECK_WITNESS = {
    sweptOn: '2026-09-03',
    samples: 62978,
    latitudeRange: [-90, 90],
    largestHonestGapMinutes: 25.628,
    // Where that worst gap was found, so a later hand can go straight to it
    // rather than re-derive the sweep to ask one question.
    largestAt: { latitude: -84, longitude: 150, date: '2026-03-08', event: 'sunset' },
    // The old band, kept rather than overwritten: the new sweep lands on
    // these exactly, which is what makes the widened half believable.
    withinSixtySix: { samples: 57572, largestHonestGapMinutes: 4.0704 },
    // Lit days on which method B returned nothing at all. Not a gap of zero.
    silentSamples: 20,
    tool: 'tools/cross-check-sweep.js'
  };

  // The gap between the two methods at one event, and whether the tower is
  // willing to stand behind it. `differenceMinutes` is null exactly when the
  // gap is past the bound; `gapMinutes` is always the raw truth.
  function crossCheckGap(methodAMinutes, methodBMinutes) {
    var gap = methodAMinutes - methodBMinutes;
    var within = Math.abs(gap) <= CROSS_CHECK_MAX_GAP_MINUTES;
    return {
      gapMinutes: gap,
      differenceMinutes: within ? gap : null,
      beyondBound: !within
    };
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

  // Day 32. When does a place's civil date begin, in UTC? Returned as minutes
  // from 00:00 UTC of that same date, so it is negative for a zone ahead of
  // Greenwich and positive for one behind: Auckland's 2026-09-06 begins at
  // −720, Anchorage's at +480, and the twenty hours between them are the
  // hours in which those two places disagree about what day it is.
  //
  // That gap is the arithmetic under the date collision. A tower that moves
  // west across it arrives on a morning its own cold ledger has already
  // claimed from where it stood yesterday, and the write gate refuses —
  // `ALREADY_PUBLISHED`, Ash's word, Day 19. Until now nothing but a fixture
  // had ever said it.
  //
  // The offset is asked at the date's UTC midnight and then re-asked at the
  // instant that first answer implies, which settles it for any zone not
  // changing its clock inside that window. A zone whose daylight-saving
  // transition falls in those hours could return a figure off by the
  // transition. That is named rather than guarded: the tower's known seam is
  // the parliament and not the sky (Day 3, Day 6).
  function civilDayStartUTCMinutes(dateISO, zone) {
    var first = zoneOffsetMinutes(dateISO, 0, zone);
    return -zoneOffsetMinutes(dateISO, -first, zone);
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
    // Day 26: this was `place = place || PARIS`, a required argument
    // wearing an optional one's syntax. Every call in this tower already
    // names a place explicitly — the ledger's own, STANDING's, a reader's
    // corner — so the fallback was never load-bearing for anyone honest,
    // only a trap for the next caller who forgets, silently reckoning
    // Paris under a heading that names somewhere else. Refuse instead.
    if (!place) { throw new Error('reckon: place is required'); }
    var h = horizonZenith(horizon);
    var zenith = h.zenith;
    var year = Number(dateISO.slice(0, 4));
    var month = Number(dateISO.slice(5, 7));
    var day = Number(dateISO.slice(8, 10));

    var a = solarDay(year, month, day, place.latitude, place.longitude, zenith);

    // Both culminations, computed above the fold and published on every row.
    //
    // Day 37. They are deliberately not a dark-day special case. A field that
    // exists only on a dark row is a code path no published morning has ever
    // run — which is the whole of what Day 20 found about `never` itself, and
    // writing the repair as another such path would be that same fault one
    // storey up. The lit branch carries them too, so the arithmetic is
    // exercised every morning rather than only on the day it is needed.
    var culm = culminations(julianDay(year, month, day),
      place.latitude, place.longitude, zenith);

    if (a.never) {
      // What is still true when the sun does not cross the horizon.
      //
      // Until Day 37 this branch returned six keys, of which exactly one —
      // `never` — was a claim anybody could check. The rest are the row's own
      // name, its method, its place, its horizon, and a raw midnight snapshot
      // of the series that no auditor reads. A dark row published nothing a
      // stranger could go and be right about, in the one room whose whole
      // design is that a stranger can convict us.
      //
      // Ember's name for what was wrong is the one built to: **two computable
      // facts are discarded at one fold, and nothing that was never there.**
      // The two are the sun's own standing at its culminations and the clock's
      // offset at that instant — the latter named on Day 22, when `survey.js`
      // printed `+NaNh` for a dark row, and left waiting under its own heading
      // ever since because nobody saw it was the same early return.
      //
      // What is *not* here matters as much. There is no sunrise, no sunset, no
      // day length, no drift and no rising point, and none of them are
      // invented: a polar night has no sunrise to be wrong about, and
      // manufacturing one would be a worse fault than the silence. Method B is
      // not asked either. `usno()` will hand back a time for a horizon
      // crossing that method A says does not happen, and publishing that under
      // the word *cross-check* would be a manufactured number wearing the face
      // of a second opinion — checking nothing, since there is no method A
      // figure for it to disagree with.
      //
      // The offset is taken at solar noon because that is the only instant this
      // row names. On a lit row `utcOffsetMinutes` is the offset at sunrise; on
      // a dark row there is no sunrise, so it is the same field asked at the
      // only moment each row has. The two can differ across a clock change,
      // which is a fact about the parliament and not about the sun.
      var offsetDark = zoneOffsetMinutes(dateISO, culm.solarNoonUTC, place.zone);
      return {
        date: dateISO,
        method: METHOD,
        working: a.working,
        // Normalised to the four fields a lit row carries, so that both
        // auditors meet the same shape whichever branch wrote the row. This
        // used to be `place` verbatim, which would carry into the cold ledger
        // whatever extra fields a caller's object happened to hold.
        place: {
          name: place.name, latitude: place.latitude,
          longitude: place.longitude, zone: place.zone
        },
        horizon: h,
        never: a.never,
        solarNoon: clockFace(culm.solarNoonUTC, offsetDark).hhmm,
        utcOffsetMinutes: offsetDark,
        sunHighestDegrees: culm.highestDegrees,
        sunLowestDegrees: culm.lowestDegrees
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
    var riseGap = bRise === null ? null : crossCheckGap(a.sunriseUTC, bRise);
    var setGap = bSet === null ? null : crossCheckGap(a.sunsetUTC, bSet);

    // Day 40. The drift is this room's signed quantity — Ash named it on Day
    // 3 — and until this morning the second method had never been asked for
    // it. `crossCheck` carried a sunrise, a sunset and two gaps: two levels
    // and nothing else. The drift is a *difference* of two days, derived from
    // method A alone, and it has been on the front of every letter this tower
    // has sent. It sat in the single-method band and nothing on the page or
    // in either auditor said so.
    //
    // So method B is asked for yesterday too, and gives its own day length
    // and its own drift. Nothing is factored together — Day 3's rule stands,
    // the two methods still share no code, and this asks B for one more of
    // B's own numbers rather than lending it any of A's.
    var byRise = usno(
      Number(yesterdayISO.slice(0, 4)), Number(yesterdayISO.slice(5, 7)), Number(yesterdayISO.slice(8, 10)),
      place.latitude, place.longitude, true, zenith);
    var bySet = usno(
      Number(yesterdayISO.slice(0, 4)), Number(yesterdayISO.slice(5, 7)), Number(yesterdayISO.slice(8, 10)),
      place.latitude, place.longitude, false, zenith);
    var bDayLength = (bRise === null || bSet === null) ? null : bSet - bRise;
    var bYesterdayLength = (byRise === null || bySet === null) ? null : bySet - byRise;
    var bChange = (bDayLength === null || bYesterdayLength === null)
      ? null : bDayLength - bYesterdayLength;

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
      // How high the sun stands at its two culminations. Published on a lit
      // row and a dark row alike — see the note above the fold. On a lit day
      // the highest is the number a reader can check with a stick and a
      // shadow, which is the cheapest instrument anybody owns; on a dark day
      // it is the number that tells a deep polar night from a shallow one,
      // and the lowest is what tells deep midnight sun from shallow. Neither
      // is corrected for refraction: see `altitudeDegrees`.
      sunHighestDegrees: culm.highestDegrees,
      sunLowestDegrees: culm.lowestDegrees,
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
        // Both methods now name minutes after 00:00 UTC of the same civil
        // date, so this subtraction has two things on one line for the first
        // time. Null means the tower refused: the gap is past the declared
        // bound and the raw gap is beside it, unsoftened.
        sunriseDifferenceMinutes: riseGap.differenceMinutes,
        sunsetDifferenceMinutes: setGap.differenceMinutes,
        sunriseGapMinutes: riseGap.gapMinutes,
        sunsetGapMinutes: setGap.gapMinutes,
        beyondBound: riseGap.beyondBound || setGap.beyondBound,
        maxGapMinutes: CROSS_CHECK_MAX_GAP_MINUTES,
        // Day 40. B's own day length and B's own drift, so the page can set
        // them against A's. No gap field and no bound: `maxGapMinutes` above
        // is a bound on a **level**, and a bound on a level says nothing
        // whatever about a difference of two levels. Declaring one here
        // without a sweep behind it would be Day 21's bound-only fault —
        // a diagnosis manufactured out of a number nobody gathered. The
        // page subtracts these two in front of the reader instead, and says
        // on its own face that the difference has no bound yet.
        dayLengthMinutes: bDayLength,
        changeSinceYesterdayMinutes: bChange
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

  // ---- What is coming ----
  //
  // Day 16. Everything this instrument published for its first fifteen
  // days was a claim about *today*: the day's numbers, the day's rising
  // point, the drift measured back to yesterday. Nobody can be surprised
  // by any of it. The one forward sentence this tower ever wrote was a
  // line in a letter about the eighth of August, and it was wrong, and it
  // was also the only claim in that envelope anybody ever went and
  // checked — the four figures standing next to it carried the identical
  // fault and sat unlooked-at for six days, because a record does not
  // look like a claim.
  //
  // So: a claim about an instant that has not happened yet.
  //
  // A season crossing is the moment the sun's apparent ecliptic longitude
  // reaches a right angle — 0 for the March equinox, 90 for the June
  // solstice, 180 for September, 270 for December. It is not a fact about
  // a place. No skyline moves it, no latitude moves it, it is the same
  // instant for Paris and for a clearing on the other side of the world,
  // and that is exactly why it belongs on the page rather than in the
  // corner: the page is for the things that live everywhere (Ash, Day
  // 15). The thing that *does* live where somebody is standing —
  // `steepestLoss` below — is in the corner.
  var SEASON_CROSSINGS = [
    { key: 'marchEquinox', longitude: 0, name: 'the March equinox' },
    { key: 'juneSolstice', longitude: 90, name: 'the June solstice' },
    { key: 'septemberEquinox', longitude: 180, name: 'the September equinox' },
    { key: 'decemberSolstice', longitude: 270, name: 'the December solstice' }
  ];

  // Signed angular distance from b to a, in (−180, 180]. Written out
  // because a crossing at longitude 0 has the series wrapping under the
  // root-finder's feet, and a plain subtraction there finds a sign change
  // that is the wrap and not the crossing.
  function angleGap(a, b) { return ((a - b + 540) % 360) - 180; }

  // Julian Day (UT, this file's own convention) to a UTC instant. The
  // inverse of julianDay() plus a time of day; 2440587.5 is 1970-01-01
  // at 00:00 UTC, which is where JS counts from.
  var JD_UNIX_EPOCH = 2440587.5;
  function julianDayToISO(jd) {
    return new Date(Math.round((jd - JD_UNIX_EPOCH) * 86400000)).toISOString();
  }

  // Method A's apparent longitude at an instant. Read off `noaa()`'s own
  // published working rather than reimplemented, so there is exactly one
  // copy of method A's series in this file and the crossing cannot drift
  // away from the sunrises. The latitude and longitude passed in do not
  // reach the longitude series at all — they only decide an hour angle
  // this function never looks at.
  function apparentLongitudeA(jd) {
    return noaa(jd, PARIS.latitude, PARIS.longitude).apparentLongitude;
  }

  // Bisection, not iteration-to-a-fixed-point: the sun's longitude climbs
  // about a degree a day and never turns back, so the crossing is bracketed
  // by a single day somewhere in the year and halving that day sixty times
  // lands well under a microsecond. A cap and a refusal rather than a
  // silent spin, same as converge().
  var CROSSING_BISECTIONS = 60;

  function bisectCrossing(f, lo, hi) {
    var flo = f(lo);
    for (var i = 0; i < CROSSING_BISECTIONS; i++) {
      var mid = (lo + hi) / 2, fmid = f(mid);
      if ((flo < 0) === (fmid < 0)) { lo = mid; flo = fmid; } else { hi = mid; }
    }
    return (lo + hi) / 2;
  }

  // Walk the year a day at a time looking for the sign change, then halve
  // it down. Throws rather than guesses if the year does not contain one —
  // a crossing the tower cannot find is not a crossing it may estimate.
  // Like assertPlausibleOffset, this means a call site can now be handed a
  // throw where it used to be handed a number; Day 5 says every one of
  // them is a new join, and the page guards this one.
  // The sign change alone is not enough, and finding that out cost the
  // first draft of this function two wrong answers that looked exactly
  // like right ones: asked for the September equinox it returned March,
  // and for the December solstice it returned June — the same shape as a
  // real answer, in the same units, off by half a year.
  //
  // The gap runs from −180 to +180 across the year and then falls off the
  // end back to −180. That fall is a sign change too, and it is not a
  // crossing; it is the coordinate wrapping. A real crossing has the gap
  // passing through zero, so both sides of it are small. The wrap has
  // both sides near 180. Requiring smallness on both sides tells them
  // apart, and the margin is enormous: the sun moves about a degree a
  // day, so a true crossing is bracketed with |gap| under 1 and the wrap
  // sits at 179-and-something.
  var CROSSING_MAX_GAP_DEGREES = 90;

  // Sixty halvings of one day is far under a microsecond, so a residual
  // anywhere near this is not rounding — it is the wrong crossing.
  var CROSSING_RESIDUAL_DEGREES = 1e-6;

  function findCrossing(f, jdStart, days) {
    var prev = f(jdStart);
    for (var d = 1; d <= days; d++) {
      var jd = jdStart + d, here = f(jd);
      if ((prev < 0) !== (here < 0)
        && Math.abs(prev) < CROSSING_MAX_GAP_DEGREES
        && Math.abs(here) < CROSSING_MAX_GAP_DEGREES) {
        return bisectCrossing(f, jd - 1, jd);
      }
      prev = here;
    }
    throw new Error('no crossing found in ' + days + ' days from JD ' + jdStart);
  }

  // One crossing, by both methods, with the gap between them stated.
  //
  // The gap is large — hours, where the two methods differ by well under
  // a minute on a sunrise — and it is published rather than swallowed,
  // because the reason for it is the day's whole finding. Method B's
  // longitude sits a third of a degree behind method A's. At sunrise that
  // third of a degree buys about half a minute, because the question is
  // "when does the sun cross an altitude", and the sun crosses altitudes
  // quickly. Here the question is "when does the sun cross a longitude",
  // and the sun crosses a degree of longitude in a *day*. Same slack in
  // the same method, read against a shallower question, comes out eight
  // and a half hours wide.
  //
  // Which means the cross-check has no power over this number. It is not
  // a second opinion; it is the same opinion with a magnifying glass held
  // to it. One method stands behind the crossing instant, and that fact
  // is printed next to the instant rather than left for a reader to work
  // out.
  function seasonCrossing(year, key) {
    var spec = null;
    for (var i = 0; i < SEASON_CROSSINGS.length; i++) {
      if (SEASON_CROSSINGS[i].key === key) spec = SEASON_CROSSINGS[i];
    }
    if (!spec) throw new Error('unknown season crossing: ' + key);

    var jdYearStart = julianDay(year, 1, 1);
    var jdA = findCrossing(function (jd) {
      return angleGap(apparentLongitudeA(jd), spec.longitude);
    }, jdYearStart, 370);

    // Method B counts in days from its own January 0, so its answer comes
    // back in that scale and is converted once, here, at the edge.
    var tB = findCrossing(function (t) {
      return angleGap(usnoEclipticLongitude(t), spec.longitude);
    }, 0, 370);
    var jdB = jdYearStart + tB - 1;

    // Check the root is a root. This is not belt-and-braces: the first
    // draft of findCrossing() answered the September equinox with the
    // March one and the December solstice with June — a wrong answer in
    // the right units, in the right shape, six months out, and nothing
    // anywhere said a word. Both wrong answers were *real crossings*, so
    // no check on plausibility would have caught them; what was false was
    // that they were the crossing that had been asked for.
    //
    // The definition is the check. Whatever instant comes back, the sun's
    // longitude there must be the longitude we asked about. It is the same
    // shape as the guard on the clock offset, one room along: refuse
    // rather than return a number the tower cannot stand behind.
    var residualA = angleGap(apparentLongitudeA(jdA), spec.longitude);
    var residualB = angleGap(usnoEclipticLongitude(tB), spec.longitude);
    if (Math.abs(residualA) > CROSSING_RESIDUAL_DEGREES
      || Math.abs(residualB) > CROSSING_RESIDUAL_DEGREES) {
      throw new Error('the crossing found for ' + spec.key + ' in ' + year +
        ' is not at longitude ' + spec.longitude + ' — off by ' +
        residualA.toFixed(6) + '° by method A and ' + residualB.toFixed(6) +
        '° by method B');
    }

    return {
      key: spec.key,
      name: spec.name,
      targetLongitude: spec.longitude,
      year: year,
      julianDayA: jdA,
      instantUTC: julianDayToISO(jdA),
      julianDayB: jdB,
      instantUTCMethodB: julianDayToISO(jdB),
      methodDifferenceHours: (jdB - jdA) * 24,
      // Why the difference is the size it is, as two numbers rather than
      // a sentence: how far behind method B's longitude runs at method
      // A's own instant, and how fast the longitude moves. Divide one by
      // the other and you have the hours above, which is the check that
      // the explanation is the explanation.
      methodBLongitudeErrorDegrees:
        angleGap(usnoEclipticLongitude(jdA - jdYearStart + 1), spec.longitude),
      longitudeDegreesPerDay:
        angleGap(apparentLongitudeA(jdA + 0.5), apparentLongitudeA(jdA - 0.5))
    };
  }

  // The next crossing strictly after 00:00 UTC of the given date.
  function nextSeasonCrossing(dateISO) {
    var year = Number(dateISO.slice(0, 4));
    var jdNow = julianDay(year, Number(dateISO.slice(5, 7)), Number(dateISO.slice(8, 10)));
    var best = null;
    for (var y = year; y <= year + 1 && !best; y++) {
      for (var i = 0; i < SEASON_CROSSINGS.length; i++) {
        var c = seasonCrossing(y, SEASON_CROSSINGS[i].key);
        if (c.julianDayA > jdNow && (!best || c.julianDayA < best.julianDayA)) best = c;
      }
    }
    if (!best) throw new Error('no season crossing after ' + dateISO);
    best.daysAway = best.julianDayA - jdNow;
    return best;
  }

  // ---- The neighbouring question, which is not the same question ----
  //
  // "Which day of the year loses the most daylight" sounds like it has an
  // answer of the same kind as the equinox instant. It has not, in two
  // ways, and both are measured here rather than argued.
  //
  // It is *flat*. On a flat plain at Paris the steepest loss in 2026 is
  // 25 September, and twenty days — 16 September to 5 October — sit
  // within one second a day of it. A peak nobody could resolve with any
  // instrument is not a date; it is a season.
  //
  // And it is *horizon-hung*, hard: two degrees of skyline moves it to 3
  // October, five degrees to 12 October, ten degrees to 24 October.
  // Nearly a month of swing, where the equinox instant does not move at
  // all. That is why this is computed in the corner, against the reader's
  // own skyline, and the page carries no answer to it: the answer is not
  // the tower's to give.
  //
  // The plateau is reported with its threshold attached, and the
  // threshold-free fact is reported beside it. Ember caught this on the
  // day it was built, and the catch is worth more than the number it
  // replaced.
  //
  // "Twenty days sit within a second a day of the peak" was going to be
  // the published claim. It is true, and it is not a fact about the year:
  // the width scales as the square root of whatever threshold you pick.
  // Measured across two decades of it — 6 days at 0.1s, 14 at 0.5s, 20 at
  // 1s, 27 at 2s, 43 at 5s — every ratio lands where a smooth quadratic
  // peak says it should. So a keeper who had chosen half a second would
  // have published fourteen with exactly as much right, and the reader
  // would have had no way to tell that the number they were handed was a
  // reading off a continuous family rather than a property of the sky.
  //
  // What *is* a property of the sky is the curvature — how fast the daily
  // loss falls away either side of the peak. That number does not move
  // when the threshold moves, and the width follows from it:
  //
  //     width = 2 × sqrt(2 × threshold / curvature)
  //
  // which is published too, so the relation can be checked rather than
  // believed. Print the one that doesn't move, and print the rule that
  // generates the other from it.
  //
  // The rule, and Ember cut it down to size the same hour it was written:
  // **a number that moves when you move a threshold you never declared is
  // a fact about the threshold.** The first draft said "an arbitrary
  // choice" instead of "a threshold", and that is too wide by exactly the
  // width that matters — the corner's own figures all move when the
  // reader changes what they typed, and those are facts about a real
  // skyline, not about a choice. The reader's horizon is not arbitrary;
  // it is theirs.
  //
  // Nor is this yesterday's rule again. That one was a ratio whose
  // denominator ran to zero and so reported its own denominator. Here
  // nothing shrinks: the curvature stays between 0.02 and 0.06 across
  // every horizon tried. The two rhyme and are not the same, and a
  // sentence broad enough to cover both would hand the next case whichever
  // diagnosis it happened to fit — Day 11's fault, in a rule instead of a
  // verdict.
  var PLATEAU_THRESHOLD_SECONDS = 1;

  // Half-window, in days either side of the peak, that the curvature is
  // fitted over. Wide enough to be a fit rather than one noisy second
  // difference, narrow enough that the quadratic still describes the
  // curve there.
  var CURVATURE_FIT_HALF_WINDOW_DAYS = 10;

  function steepestLoss(year, place, horizon) {
    // Same repair, same day, same reason as reckon() above.
    if (!place) { throw new Error('steepestLoss: place is required'); }
    var zenith = horizonZenith(horizon).zenith;
    var days = [], lengths = [], iso = year + '-01-01';

    // Day-lengths first, then the differences, so each day's length is
    // computed exactly once instead of twice.
    for (var d = 0; d < 366; d++) {
      var when = shiftDate(iso, d);
      if (Number(when.slice(0, 4)) !== year) break;
      var s = solarDay(Number(when.slice(0, 4)), Number(when.slice(5, 7)), Number(when.slice(8, 10)),
        place.latitude, place.longitude, zenith);
      days.push(when);
      lengths.push(s.never ? null : s.sunsetUTC - s.sunriseUTC);
    }

    var changes = [], best = null;
    for (var i = 1; i < days.length; i++) {
      if (lengths[i] === null || lengths[i - 1] === null) { changes.push(null); continue; }
      var change = lengths[i] - lengths[i - 1];
      changes.push(change);
      if (best === null || change < changes[best]) best = i - 1;
    }
    if (best === null) return { year: year, place: place, never: true };

    var peak = changes[best], first = null, last = null;
    for (var j = 0; j < changes.length; j++) {
      if (changes[j] === null) continue;
      if ((changes[j] - peak) * 60 <= PLATEAU_THRESHOLD_SECONDS) {
        if (first === null) first = j;
        last = j;
      }
    }

    // The curvature, by least squares on the second difference over a
    // window either side of the peak. In seconds per day per day: how
    // much less the year loses each day, for each day you step away from
    // its steepest one.
    var sum = 0, terms = 0;
    for (var k = best - CURVATURE_FIT_HALF_WINDOW_DAYS;
         k <= best + CURVATURE_FIT_HALF_WINDOW_DAYS; k++) {
      if (k < 1 || k >= changes.length - 1) continue;
      if (changes[k] === null || changes[k - 1] === null || changes[k + 1] === null) continue;
      sum += (changes[k + 1] - 2 * changes[k] + changes[k - 1]) * 60;
      terms += 1;
    }
    var curvature = terms === 0 ? null : sum / terms;

    return {
      year: year,
      place: { name: place.name, latitude: place.latitude, longitude: place.longitude },
      horizon: horizonZenith(horizon),
      date: days[best + 1],
      changeSecondsPerDay: peak * 60,
      // The threshold-free fact. Seconds per day, per day away from the
      // peak, squared — the shape of the top of the curve.
      curvatureSecondsPerDaySquared: curvature,
      plateauThresholdSeconds: PLATEAU_THRESHOLD_SECONDS,
      plateauFrom: days[first + 1],
      plateauTo: days[last + 1],
      plateauDays: last - first + 1,
      // What the curvature says the measured width should be. Printed so
      // the relation between the two can be checked by the reader instead
      // of asserted by us; if these two part company, the peak is not the
      // smooth quadratic this claims it is.
      plateauDaysPredicted: curvature === null || curvature <= 0 ? null
        : 2 * Math.sqrt(2 * PLATEAU_THRESHOLD_SECONDS / curvature)
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
    corner: corner,
    horizonDipDegrees: horizonDipDegrees,
    HORIZON_ZENITH: HORIZON_ZENITH,
    SUN_DIAMETER_ARCMINUTES: SUN_DIAMETER_ARCMINUTES,
    PARIS: PARIS,
    AUCKLAND: AUCKLAND,
    ANCHORAGE: ANCHORAGE,
    NAIROBI: NAIROBI,
    civilDayStartUTCMinutes: civilDayStartUTCMinutes,
    STANDING: STANDING,
    pledgeStanding: pledgeStanding,
    todayAt: todayAt,
    civilDateAt: civilDateAt,
    samePlace: samePlace,
    METHOD: METHOD,
    METHOD_NOTES: METHOD_NOTES,
    METHOD_CHANGED_ON: METHOD_CHANGED_ON,
    CROSS_CHECK_MAX_GAP_MINUTES: CROSS_CHECK_MAX_GAP_MINUTES,
    CROSS_CHECK_WITNESS: CROSS_CHECK_WITNESS,
    CLAIM_INTRODUCED: CLAIM_INTRODUCED,
    claimApplies: claimApplies,
    DEEP_CLAIMS: DEEP_CLAIMS,
    PATH_INTRODUCED: PATH_INTRODUCED,
    pathApplies: pathApplies,
    newestBirthday: newestBirthday,
    deepPaths: deepPaths,
    deepPathCount: deepPathCount,
    deepDifferences: deepDifferences,
    sameNumber: sameNumber,
    DRIFT_TOLERANCE_ULPS: DRIFT_TOLERANCE_ULPS,
    DRIFT_TOLERANCE_ABSOLUTE: DRIFT_TOLERANCE_ABSOLUTE,
    DRIFT_TOLERANCE_WITNESS: DRIFT_TOLERANCE_WITNESS,
    SEASON_CROSSINGS: SEASON_CROSSINGS,
    seasonCrossing: seasonCrossing,
    nextSeasonCrossing: nextSeasonCrossing,
    steepestLoss: steepestLoss,
    julianDay: julianDay,
    shiftDate: shiftDate,
    durationWords: durationWords
  };

  root.Reckoning = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
