#!/usr/bin/env node
'use strict';
//
// The sweep behind CROSS_CHECK_WITNESS, which until this morning nothing in
// this tower could reproduce.
//
// Day 31. `CROSS_CHECK_WITNESS` has carried a sample count, a latitude band
// and a largest-honest-gap since Day 21, and every one of those numbers was
// scratch work — a script written once, read off, and thrown away. That is
// Day 30's question asked of a *number* instead of a list: a single hand's
// memory of the truth, with nothing after the hand able to ask whether it is
// still so. A banked fact whose evidence cannot be re-run is not weaker than
// a law by a little. It is a law with a date on it and no way back.
//
// So this file is not a new instrument. It is the evidence for a sentence
// already published, made runnable, and its first run is the one that
// widened the band.
//
// **It reproduces the old witness exactly**, which is the only reason to
// believe the new half: restricted to |latitude| <= 66 it returns 57,572
// samples and a largest honest gap of 4.0704 minutes, the two figures the
// witness has carried since Day 21. A sweep that could not land on the old
// number would be a second sweep disagreeing with the first, not a wider
// one.
//
// The grid is the original's, extended in one axis only:
//   latitudes   -90 .. +90 every 6°   (was -66 .. +66)
//   longitudes -180 .. +180 every 10°
//   dates       every 11th day of 2026
//
// Three counts come out of it and they are three different things:
//   * a **gap** — both methods named a time, and this is how far apart.
//   * a **dark** sample — method A folded; there was no event to compare.
//   * a **silent** sample — method A named a time and method B returned
//     null. Not agreement and not disagreement: the cross-check is simply
//     absent, and the tower prints the row with nothing standing behind it.
//     Twenty of these turned up beyond ±72 on the first run. They are
//     counted here so that a later hand cannot read a clean sweep as a
//     fully witnessed one.
//
// No network, no browser, no git. Pure arithmetic over the shipped module,
// which is the only kind of witness this tower is able to gather.

const path = require('path');
const R = require(path.join(__dirname, '..', 'reckoning', 'reckoning.js'));

const LAT_STEP = 6;
const LAT_MAX = 90;
const LNG_STEP = 10;
const DAY_STEP = 11;
const OLD_BAND = 66;

function bandOf(lat) { return Math.floor(Math.abs(lat) / LAT_STEP) * LAT_STEP; }

function sweep() {
  const dates = [];
  for (let d = new Date(Date.UTC(2026, 0, 1)); d < new Date(Date.UTC(2027, 0, 1));
       d.setUTCDate(d.getUTCDate() + DAY_STEP)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const out = {
    samples: 0, dark: 0, silent: 0, beyondBound: 0,
    inside: { samples: 0, worst: 0 },
    outside: { samples: 0, worst: 0 },
    worst: { gap: 0, lat: null, lng: null, date: null, event: null },
    silentBands: new Set(),
    byBand: new Map()
  };

  for (let lat = -LAT_MAX; lat <= LAT_MAX; lat += LAT_STEP) {
    for (let lng = -180; lng <= 180; lng += LNG_STEP) {
      const place = { name: 'sweep', latitude: lat, longitude: lng, zone: 'UTC' };
      for (const date of dates) {
        const r = R.reckon(date, place);
        if (r.never) { out.dark += 1; continue; }
        const c = r.crossCheck;
        // Method B has its own acos and its own way of declining. A lit day
        // it will not speak about is not a day the two methods agreed on.
        if (!c) { out.silent += 1; out.silentBands.add(bandOf(lat)); continue; }
        for (const event of ['sunriseGapMinutes', 'sunsetGapMinutes']) {
          const g = c[event];
          if (g === null || g === undefined || Number.isNaN(g)) { out.silent += 1; continue; }
          const a = Math.abs(g);
          out.samples += 1;
          if (a > R.CROSS_CHECK_MAX_GAP_MINUTES) out.beyondBound += 1;
          const half = Math.abs(lat) <= OLD_BAND ? out.inside : out.outside;
          half.samples += 1;
          if (a > half.worst) half.worst = a;
          if (a > out.worst.gap) out.worst = { gap: a, lat, lng, date, event };
          const b = bandOf(lat);
          if (!out.byBand.has(b) || out.byBand.get(b) < a) out.byBand.set(b, a);
        }
      }
    }
  }
  return out;
}

function main() {
  const s = sweep();
  const w = R.CROSS_CHECK_WITNESS;

  console.log(`sweep: ${s.samples} gaps, ${s.dark} dark, ${s.silent} silent`);
  console.log(`sweep: latitudes -${LAT_MAX}..+${LAT_MAX} every ${LAT_STEP}°, longitudes every ${LNG_STEP}°, every ${DAY_STEP}th day of 2026`);
  console.log(`sweep: inside ±${OLD_BAND}° — ${s.inside.samples} gaps, largest ${s.inside.worst.toFixed(4)} min`);
  console.log(`sweep: outside ±${OLD_BAND}° — ${s.outside.samples} gaps, largest ${s.outside.worst.toFixed(4)} min`);
  console.log(`sweep: largest honest gap ${s.worst.gap.toFixed(4)} min at latitude ${s.worst.lat}, longitude ${s.worst.lng}, ${s.worst.date} (${s.worst.event})`);
  console.log(`sweep: past the ${R.CROSS_CHECK_MAX_GAP_MINUTES}-minute bound: ${s.beyondBound}`);
  console.log(`sweep: bound sits ${(R.CROSS_CHECK_MAX_GAP_MINUTES / s.worst.gap).toFixed(1)}× above the largest honest gap`);
  if (s.silentBands.size) {
    console.log(`sweep: lit days method B would not speak about, in |latitude| bands: ${[...s.silentBands].sort((a, b) => a - b).join(', ')}`);
  }
  console.log('sweep: largest gap by |latitude| band —');
  for (const b of [...s.byBand.keys()].sort((a, c) => a - c)) {
    console.log(`sweep:   ${String(b).padStart(2)}–${String(b + LAT_STEP).padEnd(2)}  ${s.byBand.get(b).toFixed(4).padStart(9)} min`);
  }

  // The point of running it: does the published witness still say what this
  // sweep says? A witness that cannot be checked against its own evidence is
  // the thing this file was written to end.
  const agreesSamples = w.samples === s.samples;
  const agreesGap = Math.abs(w.largestHonestGapMinutes - s.worst.gap) < 0.0001;
  const agreesBand = w.latitudeRange[0] === -LAT_MAX && w.latitudeRange[1] === LAT_MAX;
  if (agreesSamples && agreesGap && agreesBand) {
    console.log('sweep: AGREES — the published witness is what this sweep found.');
    process.exit(0);
  }
  console.log('sweep: DIFFERS — the published witness says ' +
    `${w.samples} samples, band ${w.latitudeRange[0]}..${w.latitudeRange[1]}, largest ${w.largestHonestGapMinutes}.`);
  console.log('sweep: that is not automatically a fault. Work out which moved, then write it down.');
  process.exit(1);
}

if (require.main === module) main();
module.exports = { sweep };
