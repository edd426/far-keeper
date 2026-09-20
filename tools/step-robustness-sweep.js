#!/usr/bin/env node
// The gatherer behind the rising-point step's horizon-robustness claim.
//
// Day 48, the first morning at 78.2°N. `corner()`'s own comment in
// `reckoning.js` says the step "across nought to ten degrees of skyline
// shifts by at most 5.4 arcminutes, a sixth of the sun's own width, and
// that is the worst day of 2026 (22 January), swept." That sentence is
// the whole reason the **step** is printed on the page while the
// **bearing** is kept in the corner: the bearing is horizon-hung and the
// step, it says, is not. So the page prints the step big, labels it
// *along your skyline*, and tells a reader to go and mark a tree.
//
// The sweep behind that sentence was never a file. It was a sentence.
// And it was never asked at any latitude but Paris's own 48.9°N — the
// bearing half of the same comment says "at Paris" on its face and the
// step half says nothing, so it reads as a claim about the sphere. Day
// 31, third time: a margin quoted from inside one band is a fact about
// the band.
//
// Built by Ember inside its Day 48 summoning. The two-domain fork below,
// and the figures banked in `STEP_ROBUSTNESS_WITNESS`, are the keeper's,
// after the keeper's own sweep disagreed with the first run of this one.
// Node only, no browser, no port.
//
// ---- The two domains, and why they must be forked ----
//
// Sweeping skyline from 0° to 10° at a high latitude walks some days into
// the fold: at 7° of eastern hill the sun does not clear it at all, so
// there is no rising point and no step. There are two honest things to do
// with such a day, they are different questions, and the first draft of
// this file did one in its main sweep and the other in its band-edge
// section without noticing.
//
//   WHOLE-BAND — drop the date entirely unless a step exists at every
//   skyline from 0 to 10. Asks: over days usable by a reader anywhere in
//   the band, how much does skyline move the step?
//
//   ANY-STEP — keep every (date, skyline) pair on which a step exists and
//   compare it against that date's flat-plain step. Asks: over days and
//   horizons on which a reader has a sunrise at all, how much does
//   skyline move the step?
//
// ANY-STEP is the wider and the conservative one, and it is the one the
// page's sentence is answerable to: a reader in a valley who *can* see
// the sun is owed a true number, and the fact that a reader in a deeper
// valley sees nothing does not excuse us. Both are reported, because the
// gap between them is itself a reading — at Longyearbyen the whole-band
// rule silently discards fifty-four dates and comes back a third quieter.
//
// **At Paris the two are the same number, to every digit**, because no
// day of 2026 folds anywhere across 0–10° of skyline there: zero dates
// dropped. So the choice of domain was invisible at the only latitude it
// was ever made at — Day 26's shape, where a suite ran green for eleven
// days because at Paris the wrong city's answer is the same number. A
// choice nobody can see themselves making is not a choice.
'use strict';

var R = require('../reckoning/reckoning.js');
var W = R.STEP_ROBUSTNESS_WITNESS;

var YEAR = 2026;
var OBSTRUCTION_MAX = 10;
var OBSTRUCTION_MESH = 0.25;

// How close a recompute must land to the banked figure before this file
// says the world still agrees. Not slack on the sky — the sweep is pure
// arithmetic and reproduces to the bit on an unchanged instrument — but
// on the instrument: a hair, so a harmless refactor of the convergence
// loop does not cry DIFFERS. Anything that really moves these numbers
// moves them by tens of arcminutes, not hundredths.
var AGREEMENT_ARCMINUTES = 0.01;

function daysInYear(year) {
  var out = [];
  var d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCFullYear() === year) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// One place, one year, both domains in a single pass — so the two answers
// cannot come apart by being gathered through different code.
function sweep(place, days) {
  var whole = { shift: -1, date: null, at: null };
  var any = { shift: -1, date: null, at: null };
  var dropped = 0;
  var usable = 0;

  for (var i = 0; i < days.length; i += 1) {
    var date = days[i];
    var flat = R.reckon(date, place, { obstructionDegrees: 0 });
    if (flat.never || flat.risingPointStepArcminutes === null) { dropped += 1; continue; }
    var flatStep = flat.risingPointStepArcminutes;

    var complete = true;
    var best = -1;
    var bestAt = 0;
    for (var h = 0; h <= OBSTRUCTION_MAX + 1e-9; h += OBSTRUCTION_MESH) {
      var row = R.reckon(date, place, { obstructionDegrees: h });
      if (row.never || row.risingPointStepArcminutes === null) { complete = false; continue; }
      var shift = Math.abs(row.risingPointStepArcminutes - flatStep);
      if (shift > best) { best = shift; bestAt = h; }
    }
    if (best < 0) { dropped += 1; continue; }

    usable += 1;
    if (best > any.shift) any = { shift: best, date: date, at: bestAt };
    if (complete) {
      if (best > whole.shift) whole = { shift: best, date: date, at: bestAt };
    } else {
      dropped += 1;
    }
  }

  return {
    place: place.name,
    latitude: place.latitude,
    anyStep: any,
    wholeBand: whole,
    datesDroppedByWholeBand: dropped,
    datesWithAStep: usable
  };
}

// Longitude and zone do not enter the step's own arithmetic — it is a
// function of declination and latitude — but reckon() still needs a real
// zone for the civil-clock half of the row, so Etc/UTC stands in rather
// than inventing a place that does not exist.
function grid(latitude) {
  return { name: 'lat ' + latitude + '°', latitude: latitude, longitude: 0, zone: 'Etc/UTC' };
}

function sw(arcminutes) { return arcminutes / R.SUN_DIAMETER_ARCMINUTES; }
function fmt(n, d) { return (n === null || n === undefined) ? '—' : Number(n).toFixed(d); }
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
function say(line) { console.log('step-robustness-sweep: ' + line); }

function main() {
  if (!W) {
    say('UNASKABLE — reckoning.js exports no STEP_ROBUSTNESS_WITNESS to check against.');
    return 2;
  }

  var days = daysInYear(YEAR);
  var disagreed = [];

  // ---- 1. The reproduction, inside the band the figure was banked in ----
  //
  // Day 31's rule, and it is the only reason to believe the widened half:
  // if an old slice of a new sweep does not return the old number, the new
  // sweep is measuring something else and the disagreement is ours.
  say('reproducing the banked Paris figure first (Day 31 — an old slice must return the old number)');
  var paris = sweep(R.PARIS, days);
  say('  Paris, ' + YEAR + ': worst shift ' + fmt(paris.anyStep.shift, 3) + '′ = ' +
    fmt(sw(paris.anyStep.shift), 3) + 'sw on ' + paris.anyStep.date +
    ' (at ' + fmt(paris.anyStep.at, 2) + '° of skyline)');
  say('  ' + paris.datesDroppedByWholeBand + ' dates dropped by the whole-band rule, so the two ' +
    'domains ' + (paris.datesDroppedByWholeBand === 0 ? 'cannot differ here' : 'differ here'));

  var reproduced = paris.anyStep.date === W.parisWorstOn &&
    Math.abs(paris.anyStep.shift - W.parisWorstArcminutes) < AGREEMENT_ARCMINUTES;
  if (!reproduced) {
    say('  DID NOT REPRODUCE — banked ' + fmt(W.parisWorstArcminutes, 3) + '′ on ' +
      W.parisWorstOn + ', found ' + fmt(paris.anyStep.shift, 3) + '′ on ' + paris.anyStep.date);
    disagreed.push('the Paris reproduction');
  } else {
    say('  REPRODUCED — this sweep measures what the banked sentence measured.');
  }

  // ---- 2. Whether the figure is a fact about the sphere ----
  say('');
  say('across latitude, every day of ' + YEAR + ', nought to ten degrees of skyline at ' +
    OBSTRUCTION_MESH + '° mesh');
  say('');
  say('  ' + pad('place', 16) + pad('lat', 9) + pad('ANY-STEP', 22) + pad('WHOLE-BAND', 22) + 'dropped');

  var places = [R.NAIROBI, R.AUCKLAND, R.PARIS, R.ANCHORAGE, R.LONGYEARBYEN];
  var rows = places.map(function (p) { return p === R.PARIS ? paris : sweep(p, days); });
  rows.forEach(function (r) {
    say('  ' + pad(r.place, 16) + pad(fmt(r.latitude, 1) + '°', 9) +
      pad(fmt(r.anyStep.shift, 2) + '′ = ' + fmt(sw(r.anyStep.shift), 2) + 'sw', 22) +
      pad(fmt(r.wholeBand.shift, 2) + '′ = ' + fmt(sw(r.wholeBand.shift), 2) + 'sw', 22) +
      r.datesDroppedByWholeBand);
  });

  var here = null;
  rows.forEach(function (r) { if (r.place === R.STANDING.place.name) here = r; });

  // ---- 3. Where the band turns ----
  //
  // The skyline mesh stays at 0.25° here. A coarser mesh understates the
  // worst case, which is the one direction this cannot afford to be wrong
  // in; the latitude list is what gets thinned instead.
  say('');
  say('where the band turns (same mesh, same year, ANY-STEP)');
  say('');
  var lastUnderOneWidth = null;
  var firstOverOneWidth = null;
  [45, 50, 52, 54, 55, 56, 57, 58, 60].forEach(function (lat) {
    var r = sweep(grid(lat), days);
    say('  ' + pad(fmt(lat, 0) + '°', 7) + pad(fmt(r.anyStep.shift, 2) + '′', 11) +
      '= ' + pad(fmt(sw(r.anyStep.shift), 2) + 'sw', 10) + 'on ' + r.anyStep.date);
    if (sw(r.anyStep.shift) <= 1) lastUnderOneWidth = lat;
    else if (firstOverOneWidth === null) firstOverOneWidth = lat;
  });
  say('');
  say('  last latitude swept whose worst shift stays under one sun\'s width: ' +
    (lastUnderOneWidth === null ? 'none in the list' : fmt(lastUnderOneWidth, 0) + '°') +
    '; first over: ' + (firstOverOneWidth === null ? 'none in the list' : fmt(firstOverOneWidth, 0) + '°'));
  say('  banked: ' + W.lastLatitudeUnderOneSunWidthDegrees + '° and ' +
    W.firstLatitudeOverOneSunWidthDegrees + '°');
  // This pair was typed by hand into the witness and one half was typed
  // wrong within the hour. Printing the measured figure beside the banked
  // one is not a check; the comparison is.
  if (lastUnderOneWidth !== W.lastLatitudeUnderOneSunWidthDegrees ||
      firstOverOneWidth !== W.firstLatitudeOverOneSunWidthDegrees) {
    disagreed.push('the band edge');
  }

  // ---- 4. What we banked, against what the world says now ----
  say('');
  if (here) {
    say('the standing place, ' + R.STANDING.place.name + ', ' + fmt(here.latitude, 1) + '°:');
    say('  worst shift ' + fmt(here.anyStep.shift, 2) + '′ = ' + fmt(sw(here.anyStep.shift), 2) +
      ' sun-widths, on ' + here.anyStep.date);
    say('  banked: ' + fmt(W.standingWorstArcminutes, 2) + '′ on ' + W.standingWorstOn +
      ' at ' + W.standingPlace);
    var holds = here.place === W.standingPlace &&
      here.anyStep.date === W.standingWorstOn &&
      Math.abs(here.anyStep.shift - W.standingWorstArcminutes) < AGREEMENT_ARCMINUTES;
    if (!holds) disagreed.push('the standing place\'s worst shift');
  } else {
    // Not a fault and not an all-clear. The tower moves weekly; on the day
    // it stands somewhere this sweep's place list does not name, the banked
    // standing figure is about a place it has left. Say so rather than let
    // the check pass by having nothing to compare — an empty domain always
    // says yes (Day 27).
    say('the tower stands at ' + R.STANDING.place.name + ', which this sweep\'s place list does');
    say('  not name, so the banked standing figure is about a place it has left. That is a');
    say('  hole in the witness, not a disagreement with the world.');
    disagreed.push('nothing was compared at the standing place');
  }

  say('');
  say('  quoted in sun-widths, never as a share of the step: the step itself goes to nearly');
  say('  nothing near a solstice, and a ratio taken against a vanishing quantity reports its');
  say('  own denominator (Day 15). The sun\'s width is the ruler a reader already owns.');

  say('');
  if (disagreed.length > 0) {
    say('DIFFERS — the world no longer says what we banked: ' + disagreed.join('; ') + '.');
    return 1;
  }
  say('AGREES — the Paris figure reproduces and the standing place\'s worst shift is what ' +
    'was banked. The 5.4′ bound is still a fact about one band of latitude.');
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { sweep: sweep, daysInYear: daysInYear };
