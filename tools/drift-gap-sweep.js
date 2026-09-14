#!/usr/bin/env node
'use strict';
//
// The sweep behind DRIFT_GAP_WITNESS.
//
// Day 42. On Day 40 the drift — this room's signed quantity, the number
// every letter this tower has sent leads with — was put to the second
// method for the first time. The page prints both drifts and subtracts them
// in front of the reader, and it says on its own face that the difference
// has **no declared bound**, because the sixty minutes above it is a bound
// on a *level* and a bound on a level says nothing whatever about a
// difference of two levels. That refusal was right, and it ended on a
// promise: *when a bound arrives it will arrive with its own witness and
// its own date.*
//
// This file is that witness's evidence, and it is runnable for the reason
// `cross-check-sweep.js` is runnable (Day 31): a banked fact whose evidence
// cannot be re-run is not weaker than a law by a little, it is a law with a
// date on it and no way back.
//
// **The grid is the level sweep's, deliberately unchanged** —
//   latitudes   -90 .. +90 every 6°
//   longitudes -180 .. +180 every 10°
//   dates       every 11th day of 2026
// — so the two witnesses can be read against each other. Ember checked
// before this was written whether a drift can honestly ride a grid built
// for levels, and the answer is that `reckon()` already computes yesterday
// internally for every date; both drifts are fields on the same row the
// level sweep already asks for. The grid's dates are places to stand, and
// the fact that the answer is about yesterday is `reckon()`'s business.
//
// ---------------------------------------------------------------------
// THE TURN OF THE YEAR IS COUNTED APART.
//
// An almanac is written a year at a time, so method B's drift swallows the
// epoch's restart in one step on the first of January. Averaged in with the
// rest that would produce a bound which is mostly one day of the year.
//
// ---------------------------------------------------------------------
// THE ABSENCES ARE COUNTED INDEPENDENTLY, AND THAT IS THE TOOL'S SHAPE.
//
// A drift is made from two days and two methods, so there are four ways for
// it to be missing, and they are four different facts:
//
//   * **dark** — method A folded today. There is no day length to take a
//     difference of, and nothing else below applies.
//   * **A had no yesterday** — method A named today's day length and not
//     yesterday's, so our own drift is absent. Nothing to do with the
//     almanac.
//   * **B had no time today** — `crossCheck` is null, because the almanac
//     declined about this date.
//   * **B had no yesterday** — and this one is Ember's, named before the
//     tool existed rather than found by running it. `crossCheck` is gated
//     on *today's* `bRise`/`bSet`; `changeSinceYesterdayMinutes` is gated
//     separately on *yesterday's*. So a sample can carry a full crossCheck
//     object, with real sunrise and sunset gaps, and a null drift inside it
//     because the almanac declined about the day before. The day itself was
//     witnessed at both ends and only its neighbour was not.
//
// The first draft asked these as an `else if` chain, which is what the
// level sweep does, and the counts that came out were 115 and 4. Asked
// independently they are 115 and 105. **Neither set is wrong and that is
// the point:** the absences overlap heavily — 101 samples are missing at
// both ends at once — and a chain hands every overlap to whichever question
// was asked first, so each later count is a residue rather than a fact. A
// residue changes when a hand reorders three lines that look like they
// commute. So every absence here is asked of every lit sample, the overlap
// is published as its own number, and the arithmetic closes in the open:
// 115 + 105 − 101 = 119 incomplete, and 31,509 − 119 = 31,390 pairs.
//
// Ash's word for the class, out of the same morning: **a name that fuses
// two things is how a false claim gets written.** *Silent* was one word
// over four absences.
//
// ---------------------------------------------------------------------
// WHAT THE FIRST RUN FOUND, WHICH WAS ABOUT THE CHECK AND NOT THE SKY.
//
// The comment this witness replaces said the January disagreement is "about
// seven times the worst disagreement anywhere inside the year, and that
// ratio is the same at every latitude — which is what makes it the
// almanac's own seam rather than anything about a place." Measured at four
// cities, every one of them inside ±66. Swept pole to pole there are three
// regimes, not one: the ratio runs 6.11 to 6.79 for twelve bands, is 52 in
// the 66 band, and past 72 **there is no turn-of-year sample at all** —
// those latitudes are dark or the almanac declines on the first of January,
// so there is nothing for a ratio to be of. Inside the band the restart is
// seven times the year; outside it the worst in-year gap is 22.57 minutes
// against a loudest restart anywhere of 8.999. Day 31, on a claim four days
// younger than the rule: **a ratio quoted from inside one band is a fact
// about the band.**
//
// So the tool prints the whole band table every run and the witness carries
// numbers rather than a sentence about them. Ash's rule for the repair, and
// it is why there is no correction paragraph anywhere in the shipped code:
// **name the repair, not the mistake.** The mistake is in the diary, which
// is what the diary is for.
//
// No network, no browser, no git. Pure arithmetic over the shipped module.

const path = require('path');
const R = require(path.join(__dirname, '..', 'reckoning', 'reckoning.js'));

const LAT_STEP = 6;
const LAT_MAX = 90;
const LNG_STEP = 10;
const DAY_STEP = 11;
const YEAR = 2026;

function bandOf(lat) { return Math.floor(Math.abs(lat) / LAT_STEP) * LAT_STEP; }

function missing(value) {
  return value === null || value === undefined || Number.isNaN(value);
}

function sweep() {
  const dates = [];
  for (let d = new Date(Date.UTC(YEAR, 0, 1)); d < new Date(Date.UTC(YEAR + 1, 0, 1));
       d.setUTCDate(d.getUTCDate() + DAY_STEP)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const out = {
    dates: dates.length,
    lit: 0,
    dark: 0,
    // Each asked of every lit sample, never as a chain. See the header.
    oursMissing: 0,
    theirsMissing: 0,
    theirsNoTimeToday: 0,
    theirsNoYesterday: 0,
    bothMissing: 0,
    inYear: { samples: 0, worst: 0, at: null },
    turn: { samples: 0, worst: 0, at: null },
    // Two maps rather than one holding a pair: the turn-of-year map is
    // meant to have *missing* bands, and a shape that always held both
    // would have to invent a zero for them. A zero is a measurement.
    inYearByBand: new Map(),
    turnByBand: new Map()
  };

  for (let lat = -LAT_MAX; lat <= LAT_MAX; lat += LAT_STEP) {
    for (let lng = -180; lng <= 180; lng += LNG_STEP) {
      const place = { name: 'sweep', latitude: lat, longitude: lng, zone: 'UTC' };
      for (const date of dates) {
        const r = R.reckon(date, place);
        if (r.never) { out.dark += 1; continue; }
        out.lit += 1;

        const ours = r.changeSinceYesterdayMinutes;
        const cross = r.crossCheck;
        const theirs = cross ? cross.changeSinceYesterdayMinutes : null;
        const oursGone = missing(ours);
        const theirsGone = missing(theirs);

        if (oursGone) out.oursMissing += 1;
        if (theirsGone) out.theirsMissing += 1;
        if (!cross) out.theirsNoTimeToday += 1;
        else if (theirsGone) out.theirsNoYesterday += 1;
        if (oursGone && theirsGone) out.bothMissing += 1;
        if (oursGone || theirsGone) continue;

        const gap = Math.abs(ours - theirs);
        const turnOfYear = date.slice(5) === '01-01';
        const side = turnOfYear ? out.turn : out.inYear;
        const byBand = turnOfYear ? out.turnByBand : out.inYearByBand;
        side.samples += 1;
        if (gap > side.worst) { side.worst = gap; side.at = { latitude: lat, longitude: lng, date }; }
        const band = bandOf(lat);
        if (!byBand.has(band) || byBand.get(band) < gap) byBand.set(band, gap);
      }
    }
  }
  return out;
}

// Where the turn-of-year evidence stops, as a **bracket** and not an edge.
// Ember's, and it went in before anything was published: the grid steps in
// 6°, so the highest band with a sample is the near side of a gap, and the
// true fold — where `cosHourAngle` reaches ±1 on that date at this zenith —
// is a continuous latitude that has no reason to land on a multiple of six.
// Reporting the near side alone would quietly promote it into the whole
// answer, and a finer grid would then "move" a fold that never moved. So
// both sides are named, and the pair says what the grid is entitled to
// claim: somewhere strictly between them.
//
// Named and not built, Ember's and owed: the fold latitude can be solved
// directly out of the hour-angle equation, with no grid in it at all, and
// set beside this bracket the way a chosen bound sits beside a gathered
// one. Today ships the bracket.
function turnOfYearBracket(s) {
  let sampled = null;
  for (const band of s.turnByBand.keys()) {
    if (sampled === null || band > sampled) sampled = band;
  }
  if (sampled === null) return { sampledUpTo: null, firstEmpty: null };
  return { sampledUpTo: sampled, firstEmpty: sampled + LAT_STEP };
}

function main() {
  const s = sweep();
  const w = R.DRIFT_GAP_WITNESS;
  const bracket = turnOfYearBracket(s);

  console.log(`drift-sweep: ${s.inYear.samples} in-year gaps, ${s.turn.samples} turn-of-year gaps`);
  console.log(`drift-sweep: latitudes -${LAT_MAX}..+${LAT_MAX} every ${LAT_STEP}°, ` +
    `longitudes every ${LNG_STEP}°, every ${DAY_STEP}th day of ${YEAR} (${s.dates} dates)`);
  console.log(`drift-sweep: ${s.dark} dark, ${s.lit} lit`);
  console.log('drift-sweep: the four absences, each asked of every lit sample, never as a chain —');
  console.log(`drift-sweep:   our own drift missing (A had today and not yesterday):  ${s.oursMissing}`);
  console.log(`drift-sweep:   their drift missing, in total:                          ${s.theirsMissing}`);
  console.log(`drift-sweep:     of which B had no time for today at all:              ${s.theirsNoTimeToday}`);
  console.log(`drift-sweep:     of which B had today and declined about yesterday:    ${s.theirsNoYesterday}`);
  console.log(`drift-sweep:   missing at both ends at once:                           ${s.bothMissing}`);
  const incomplete = s.oursMissing + s.theirsMissing - s.bothMissing;
  console.log(`drift-sweep:   so ${s.oursMissing} + ${s.theirsMissing} - ${s.bothMissing} = ${incomplete} incomplete, ` +
    `and ${s.lit} - ${incomplete} = ${s.lit - incomplete} pairs`);
  console.log(`drift-sweep: largest in-year gap ${s.inYear.worst.toFixed(4)} min at ` +
    `latitude ${s.inYear.at.latitude}, longitude ${s.inYear.at.longitude}, ${s.inYear.at.date}`);
  console.log(`drift-sweep: largest turn-of-year gap ${s.turn.worst.toFixed(4)} min at ` +
    `latitude ${s.turn.at.latitude}, longitude ${s.turn.at.longitude}, ${s.turn.at.date}`);
  console.log(`drift-sweep: turn-of-year samples reach |latitude| ${bracket.sampledUpTo}° and stop ` +
    `before ${bracket.firstEmpty}° — the fold is between the two, not at either`);

  console.log('drift-sweep: worst gap by |latitude| band — a dash is an absence, not a zero —');
  console.log('drift-sweep:   band      in-year   turn-of-year        ratio');
  for (let band = 0; band <= LAT_MAX; band += LAT_STEP) {
    const i = s.inYearByBand.get(band);
    const t = s.turnByBand.get(band);
    const ratio = (i !== undefined && t !== undefined && i > 0) ? (t / i).toFixed(2) : '—';
    console.log('drift-sweep:   ' + String(band).padStart(3) + '  ' +
      (i === undefined ? '—' : i.toFixed(4)).padStart(11) + '  ' +
      (t === undefined ? '—' : t.toFixed(4)).padStart(13) + '  ' +
      ratio.padStart(11));
  }

  // The point of running it, and the same question `cross-check-sweep.js`
  // asks: does the published witness still say what this sweep says?
  const agrees =
    w.inYearSamples === s.inYear.samples &&
    w.turnOfYearSamples === s.turn.samples &&
    Math.abs(w.largestInYearGapMinutes - s.inYear.worst) < 0.0001 &&
    Math.abs(w.largestTurnOfYearGapMinutes - s.turn.worst) < 0.0001 &&
    w.oursMissingSamples === s.oursMissing &&
    w.theirsMissingSamples === s.theirsMissing &&
    w.theirsNoTimeTodaySamples === s.theirsNoTimeToday &&
    w.theirsNoYesterdaySamples === s.theirsNoYesterday &&
    w.bothMissingSamples === s.bothMissing &&
    w.turnOfYearSampledUpToLatitude === bracket.sampledUpTo &&
    w.turnOfYearFirstEmptyLatitude === bracket.firstEmpty &&
    w.latitudeRange[0] === -LAT_MAX && w.latitudeRange[1] === LAT_MAX;

  if (agrees) {
    console.log('drift-sweep: AGREES — the published witness is what this sweep found.');
    process.exit(0);
  }
  console.log('drift-sweep: DIFFERS — the published witness says ' +
    `${w.inYearSamples} in-year / ${w.turnOfYearSamples} turn-of-year samples, ` +
    `largest ${w.largestInYearGapMinutes} / ${w.largestTurnOfYearGapMinutes} min, ` +
    `absences ${w.oursMissingSamples}/${w.theirsMissingSamples}` +
    `(${w.theirsNoTimeTodaySamples}+${w.theirsNoYesterdaySamples})/${w.bothMissingSamples}, ` +
    `turn-of-year bracket ${w.turnOfYearSampledUpToLatitude}..${w.turnOfYearFirstEmptyLatitude}°.`);
  console.log('drift-sweep: that is not automatically a fault. Work out which moved, then write it down.');
  process.exit(1);
}

if (require.main === module) main();
module.exports = { sweep, turnOfYearBracket };
