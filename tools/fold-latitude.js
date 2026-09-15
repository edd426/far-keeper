#!/usr/bin/env node
'use strict';
//
// The fold, solved — Day 43.
//
// `drift-gap-sweep.js` reported where `solarDay`'s `never` fold sits at
// the turn of the year as a **bracket**: samples reach 66°, none at 72°,
// because the grid steps in 6° and the fold itself has no reason to sit
// on a multiple of six. It said, on its own face, that the exact latitude
// was owed. `reckoning.js`'s `foldLatitudeDegrees` is that solve, taken
// straight out of the hour-angle equation with no grid anywhere in it —
// see the comment beside it for the derivation.
//
// This file is where "solved exactly" got measured rather than believed,
// and the first pass through it was wrong in the ordinary way: it said
// VERIFIED after checking only nine dates with a thousandth of a degree
// of slack, five of them near a solstice. `foldLatitudeDegrees` takes one
// declination at 00:00 UTC; `solarDay`'s own fold is settled per event by
// `converge()`, same as Day 6 and Day 15's caution about "the"
// declination for a day. The two match closely near a solstice, where
// declination barely moves — and NOT near an equinox, where an
// extreme-latitude event converges hours from UTC midnight while
// declination is moving at its fastest all year. Widening the search
// caught it: 0.05° of slack was not enough for 2026-05-01 or 2026-11-03,
// and finding out why turned up a **0.229° gap on 2026-09-28**.
//
// So this does two different things, and they answer two different
// questions:
//
//   1. SWEEP: bisect against `reckon()`'s own `never` flag, every 5 days
//      across 2026, and report the largest gap between the closed form
//      and the settled fold — a fact about where the closed form may be
//      trusted, not a pass/fail.
//
//   2. THE ACTUAL DEBT: the Jan-1 edge, set beside `DRIFT_GAP_WITNESS`'s
//      own 66°..72° bracket. This is the one case a grid-free fold was
//      owed for, it sits nine days past a solstice where the gap is
//      three thousandths of a degree, and it must land strictly inside
//      the swept bracket. This is the only hard assertion in the file.
//
// No network, no browser, no git. Pure arithmetic over the shipped module.

const path = require('path');
const R = require(path.join(__dirname, '..', 'reckoning', 'reckoning.js'));

function neverAt(dateISO, latitude, longitude) {
  const place = { name: 'probe', latitude: latitude, longitude: longitude || 0, zone: 'UTC' };
  return R.reckon(dateISO, place).never;
}

// Bisects for the settled fold latitude on the given sign's side (+1 north,
// -1 south), between lo and hi (unsigned magnitudes), assuming lo is lit
// and hi is dark. Sixty halvings is comfortably past double precision.
function bisectFold(dateISO, sign, lo, hi) {
  if (neverAt(dateISO, sign * lo)) return null;  // caller's lo was not lit
  if (!neverAt(dateISO, sign * hi)) return null;  // caller's hi was not dark
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (neverAt(dateISO, sign * mid)) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

function iso(dayOfYear) {
  const d = new Date(Date.UTC(2026, 0, 1));
  d.setUTCDate(d.getUTCDate() + dayOfYear - 1);
  return d.toISOString().slice(0, 10);
}

// One edge, predicted and (where reachable) measured. `edge` selects which
// of the two equations from the comment in reckoning.js — 'night' pairs
// with the hemisphere opposite the declination's sign, 'day' with the same
// one, per the derivation there.
function checkEdge(dateISO, edge, declinationDeg, predicted) {
  if (predicted === null || predicted >= 90 || predicted < 0) {
    return { edge: edge, predictedDeg: predicted, reached: false };
  }
  const sign = edge === 'day' ? (Math.sign(declinationDeg) || 1) : -(Math.sign(declinationDeg) || 1);
  // A generous bracket around the prediction — wide enough to have caught
  // the 0.05°, then 0.23°, gaps this file already found, and to keep
  // catching whatever the next one turns out to be.
  const measured = bisectFold(dateISO, sign, Math.max(0, predicted - 1), Math.min(89.999, predicted + 1));
  if (measured === null) return { edge: edge, predictedDeg: predicted, reached: false, note: 'search bracket missed it' };
  return { edge: edge, predictedDeg: predicted, reached: true, measuredDeg: measured, gapDeg: measured - predicted };
}

function sweep() {
  const rows = [];
  for (let doy = 1; doy <= 361; doy += 5) {
    const date = iso(doy);
    const dec = R.declinationDegrees(date);
    const fold = R.foldLatitudeDegrees(dec, R.HORIZON_ZENITH);
    rows.push({
      date: date,
      declinationDeg: dec,
      night: checkEdge(date, 'night', dec, fold.polarNightLatitudeDeg),
      day: checkEdge(date, 'day', dec, fold.polarDayLatitudeDeg)
    });
  }
  return rows;
}

function worst(rows) {
  let best = null;
  rows.forEach(function (r) {
    [r.night, r.day].forEach(function (e) {
      if (e.reached && (best === null || Math.abs(e.gapDeg) > Math.abs(best.gapDeg))) {
        best = { date: r.date, edge: e.edge, gapDeg: e.gapDeg, predictedDeg: e.predictedDeg, measuredDeg: e.measuredDeg };
      }
    });
  });
  return best;
}

function main() {
  const rows = sweep();
  const worstGap = worst(rows);

  console.log('SWEEP: closed-form fold vs. reckon()\'s settled fold, every 5 days of 2026');
  console.log('(gap = measured - predicted, in degrees of latitude)');
  console.log('');
  rows.forEach(function (r) {
    const parts = [r.date, 'dec=' + r.declinationDeg.toFixed(3).padStart(8)];
    [r.night, r.day].forEach(function (e) {
      if (!e.reached) { parts.push(e.edge + '=n/a'); return; }
      parts.push(e.edge + '=' + e.predictedDeg.toFixed(3) + (e.gapDeg >= 0 ? '+' : '') + e.gapDeg.toFixed(4));
    });
    console.log('  ' + parts.join('  '));
  });

  console.log('');
  console.log('Largest gap found: ' + worstGap.gapDeg.toFixed(4) + '° at ' + worstGap.date +
    ' (' + worstGap.edge + ' edge, predicted ' + worstGap.predictedDeg.toFixed(3) +
    '°, settled fold ' + worstGap.measuredDeg.toFixed(3) + '°).');
  console.log('Near a solstice the gap is thousandths of a degree; away from one it is not —');
  console.log('the closed form takes one declination and the settled fold does not.');

  // ---- The actual debt: the Jan-1 edge against DRIFT_GAP_WITNESS's bracket ----
  const janDec = R.declinationDegrees('2026-01-01');
  const janFold = R.foldLatitudeDegrees(janDec, R.HORIZON_ZENITH);
  const janLat = janFold.polarNightLatitudeDeg;
  const w = R.DRIFT_GAP_WITNESS;
  const sampledUpTo = w.turnOfYearSampledUpToLatitude;
  const firstEmpty = w.turnOfYearFirstEmptyLatitude;
  const insideBracket = janLat > sampledUpTo && janLat < firstEmpty;

  console.log('');
  console.log('THE DEBT: the turn-of-year fold, exact rather than bracketed.');
  console.log('2026-01-01 exact fold: ' + janLat.toFixed(4) + '°N (polar-night edge)');
  console.log('DRIFT_GAP_WITNESS bracket: ' + sampledUpTo + '°..' + firstEmpty + '°');
  console.log(insideBracket
    ? 'ok    the exact fold lands strictly inside the swept bracket'
    : 'FAIL  the exact fold is outside the bracket the sweep reported');

  const allOk = insideBracket;
  console.log('');
  console.log(allOk ? 'ALL OK' : 'FAILED');
  process.exit(allOk ? 0 : 1);
}

if (require.main === module) main();
module.exports = { sweep, checkEdge, bisectFold };
