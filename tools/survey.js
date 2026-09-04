#!/usr/bin/env node

// survey — what does this tower's own method say at a place we might stand?
//
// Built Day 22, three mornings before the first move. Evan's argument for
// moving at all is that three guards in `reckoning/reckoning.js` — the `acos`
// fold, the general non-Paris offset branch, the rising-point arc — have never
// fired for any cause, because one latitude has ever reached them. A tower that
// stays put cannot find a latitude-dependent error, in the exact way Wren's
// clearing could not find its missing month from inside itself.
//
// So the next place has to be chosen, and the house's rule for choosing things
// is to ask the instrument rather than ask which city sounds well. Ember drew
// the line this tool is built to: it is theatre if the question is *which place
// has good light*, because that is map knowledge already in hand dressed up as
// computation. It is not theatre if the question is *what does this tower's own
// method say here* — the rising point in sun-widths, the `never` fold, the gap
// between two methods that share no code are artifacts of this codebase and
// exist nowhere else.
//
// ---- What this tool can and cannot vouch for ----
//
// The report is printed in two bands, and the split is the honest half of it.
//
//   CROSS-CHECKED. The two solar methods share no code on purpose, so their
//   gap at each event is a real check: not against the sky, but against a
//   second computation built to be able to disagree. Same standing as every
//   ledger row.
//
//   SINGLE-METHOD. The rising point, its daily step, the `never` word and the
//   day-line reach all come out of method A alone. There is no second number
//   to set them against. These are checkable against themselves and not
//   against the world, and that is the truth about them rather than a failure
//   to dress up. Day 18's sentence, one room along: a place is an input, and
//   no recompute can check an input, because the recompute is what the input
//   feeds.
//
// What is available underneath both bands is reproducibility, which is the
// floor and not the whole answer. `reckon()` is pure — `(date, place, horizon)`
// in, numbers out, no clock and no ledger read — and **this tool reads no
// date from the clock**, by design: every date below is a constant. So anyone
// with the clone can rerun it and get the same page back, which is what makes
// Friday's choice rest on a run rather than on the keeper's account of a run.
// The one input from outside is the tz database, asked for each place's clock
// offset. That is the tower's known seam (Day 3, Day 6): IANA revises past
// rules, and if it ever revises one of these zones this page moves under us.
// It is named here rather than promised away.
//
// ---- The witness band ----
//
// `CROSS_CHECK_WITNESS` in `reckoning.js` said, until Day 31, that the tower's
// 60-minute bound was swept over latitudes −66…+66, 57,572 events, largest
// honest gap 4.07 minutes. It is now the whole sphere — 62,978 events, largest
// honest gap **25.63 minutes** — and the paragraph below is kept in its old
// tense because the reasoning it records is what the widening was for.
// It carries its date and its range on its face, which is what Day 5 asked of
// a banked fact — and the range is what earns it. Half of this list stands
// outside that band, and a candidate there can produce a gap larger than
// anything the sweep ever saw while sitting comfortably under the bound. So
// the report says `outside the witness` in those rows rather than printing the
// figure flat. That is not a repair and does not pretend to be one; it is the
// tool declining to print a number as though a sweep had covered it.
//
// ---- Its appointment ----
//
// The plan is one place a week, so this is a recurring door and not a one-time
// decision. A kept tool that nothing ever calls again is `shelf-when.js`, which
// is built, tested, broken six ways on purpose, and wired to nothing. I cannot
// wire this one either: `daily.md` and `scripts/**` are locked to the keeper.
// The strongest door I hold is `CLAUDE.md` and `COMMONPLACE.md`, both in the
// charter's mandatory morning read. The appointment is written in both, and
// a line on the morning's path is weaker than a step in the routine. Said
// plainly here so nobody has to discover it.
//
// Exit codes: 0 the survey ran; 1 at least one candidate produced a figure the
// tower would refuse to stand behind (a cross-check past the bound); 2 the tool
// could not do its job.

const Reckoning = require('../reckoning/reckoning.js');

// The move this survey is for. A constant, so the committed run reproduces.
const MOVE_DATE = '2026-09-06';

// Hand-kept. Nothing computes this list; it is the keeper's shortlist, and it
// is meant to be edited each week. `zone` must be a name the clock has heard
// of — `placeProblem` in `reckon.js` is the guard for that, and a survey of a
// place the tower could not stand in is worth nothing.
//
// Day 32: Auckland comes off, having been stood in. No city twice is the rule,
// and the honest place to keep it is here — a name removed from the shortlist
// cannot be chosen by accident, where a name left on it and remembered about
// is Day 3's memory-dependence wearing a list. Paris was never on this list.
// Nothing in the tool enforces the rule; it is one hand's edit, which is
// exactly the kind of thing Day 30 asked *what is a single hand's memory of
// the truth, with nobody asking it?* about. Named here and not built.
const CANDIDATES = [
  { name: 'Reykjavik',    latitude:  64.1466, longitude:  -21.9426, zone: 'Atlantic/Reykjavik' },
  { name: 'Nuuk',         latitude:  64.1835, longitude:  -51.7216, zone: 'America/Nuuk' },
  { name: 'Tromso',       latitude:  69.6492, longitude:   18.9553, zone: 'Europe/Oslo' },
  { name: 'Longyearbyen', latitude:  78.2232, longitude:   15.6267, zone: 'Arctic/Longyearbyen' },
  { name: 'Anchorage',    latitude:  61.2181, longitude: -149.9003, zone: 'America/Anchorage' },
  { name: 'Tokyo',        latitude:  35.6762, longitude:  139.6503, zone: 'Asia/Tokyo' },
  { name: 'Ushuaia',      latitude: -54.8019, longitude:  -68.3030, zone: 'America/Argentina/Ushuaia' },
  { name: 'Nairobi',      latitude:  -1.2921, longitude:   36.8219, zone: 'Africa/Nairobi' },
  { name: 'Quito',        latitude:  -0.1807, longitude:  -78.4678, zone: 'America/Guayaquil' },
  { name: 'Kiritimati',   latitude:   1.8721, longitude: -157.4278, zone: 'Pacific/Kiritimati' },
  { name: 'Singapore',    latitude:   1.3521, longitude:  103.8198, zone: 'Asia/Singapore' },
];

// Ember's answer to whether a solstice column is honest or decorative, and it
// turns on what the column is *of*. `reckon()` is pure arithmetic on the date
// handed to it, so a solstice figure is a claim about that place's geometry —
// not a claim that this tower will be standing there in December, which under
// a one-place-a-week plan it will not be. The forbidden thing is a forward date
// written into the *cold ledger* (Day 16), and this is neither cold nor a
// record. The frame is labelled rather than the numbers hedged.
const DATES = [
  { iso: MOVE_DATE,    label: 'the move' },
  { iso: '2026-09-23', label: 'the equinox' },
  { iso: '2026-12-21', label: 'December solstice' },
  { iso: '2026-06-21', label: 'June solstice' },
];

const USAGE = 'usage: node tools/survey.js [--help]';

// Day 13's rule from the first line rather than bolted on later: walk argv
// token by token and refuse what is not recognised. A read tool that answers a
// question nobody asked hands a keeper a clean exit 0 and lets them read it as
// the answer to the question they did ask.
function parseArgs(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') return { help: true };
    return { problem: `unknown argument: ${token}` };
  }
  return {};
}

function pad(value, width) {
  const text = String(value);
  return text.length >= width ? text : text + ' '.repeat(width - text.length);
}

function padLeft(value, width) {
  const text = String(value);
  return text.length >= width ? text : ' '.repeat(width - text.length) + text;
}

function signed(value, digits) {
  const text = Math.abs(value).toFixed(digits);
  return (value < 0 ? '-' : '+') + text;
}

// Does this place stand outside the sweep the tower's bound was built on, and
// does this gap stand outside the largest one that sweep ever saw? Two separate
// questions with one answer each; a row can fail either alone.
//
// Day 31: the sweep was widened to the whole sphere, so `outsideBand` is now
// false for every place on earth — the flag has not stopped finding things,
// it has stopped being able to. Day 21's `[].every(...)` and Day 27's
// rehearsal that swept for a name nobody says: **an empty domain always says
// yes, and vacuous reads as green.** The flag is kept rather than deleted
// because the band is a published value that a later sweep could narrow, and
// a flag that comes back when its reason does is worth more than one somebody
// has to remember to re-add. So the report says outright when the domain is
// empty, and a reader is never left taking silence for evidence.
function witnessStanding(place, gapMinutes) {
  const witness = Reckoning.CROSS_CHECK_WITNESS;
  const [low, high] = witness.latitudeRange;
  const outsideBand = place.latitude < low || place.latitude > high;
  const overGap = Math.abs(gapMinutes) > witness.largestHonestGapMinutes;
  return { outsideBand, overGap, witness };
}

// How far method A's own answer falls outside the UTC day of the row's date.
// Day 21: method A counts minutes from 00:00 UTC of the civil date and is free
// to run negative or past 1440, because that is the truth about an event on the
// far side of a UTC midnight. Method B folds into a local day. Nothing joined
// them for twenty-one days, and the join is invisible in a band either side of
// the meridian that Paris sits near the centre of. So this column says outright
// whether a candidate reaches the join at all.
function dayLineReach(working) {
  const out = [];
  if (working.sunriseUTCMinutes < 0 || working.sunriseUTCMinutes >= 1440) {
    out.push(`sunrise ${working.sunriseUTCMinutes.toFixed(0)}`);
  }
  if (working.sunsetUTCMinutes < 0 || working.sunsetUTCMinutes >= 1440) {
    out.push(`sunset ${working.sunsetUTCMinutes.toFixed(0)}`);
  }
  return out;
}

function surveyOne(place, dateISO) {
  let r;
  try {
    r = Reckoning.reckon(dateISO, place);
  } catch (error) {
    return { threw: error.message };
  }
  if (r.never) return { never: r.never };
  return {
    row: r,
    reach: dayLineReach(r.working),
    riseStanding: witnessStanding(place, r.crossCheck.sunriseGapMinutes),
    setStanding: witnessStanding(place, r.crossCheck.sunsetGapMinutes),
  };
}

function report(lines) {
  const witness = Reckoning.CROSS_CHECK_WITNESS;
  let refused = false;

  lines.push('survey — the tower\'s own method at each place it might stand');
  lines.push('');
  lines.push(`move: ${MOVE_DATE}   candidates: ${CANDIDATES.length}   dates: ${DATES.length}`);
  lines.push(`bound: ${Reckoning.CROSS_CHECK_MAX_GAP_MINUTES} min   witness: ${witness.samples} events, latitudes ` +
    `${witness.latitudeRange[0]}…${witness.latitudeRange[1]}, largest honest gap ` +
    `${witness.largestHonestGapMinutes} min, swept ${witness.sweptOn}`);
  if (witness.latitudeRange[0] <= -90 && witness.latitudeRange[1] >= 90) {
    lines.push('The witness now spans the whole sphere, so no row below can be flagged');
    lines.push('`unwitnessed latitude` — that flag has an empty domain and is silent by');
    lines.push('construction, not by finding nothing. The gap ceiling still bites.');
  }
  lines.push('');
  lines.push('No date below is read from the clock. Every one is a constant in this file,');
  lines.push('so this page reproduces from any clone — the tz database aside, which is the');
  lines.push('one input asked of the world and the tower\'s known seam.');
  lines.push('');
  lines.push('A column dated past today describes that place\'s geometry. It is not a claim');
  lines.push('that this tower will be reckoning there on that date; under one place a week');
  lines.push('it will not be.');

  for (const date of DATES) {
    lines.push('');
    lines.push(`=== ${date.iso} — ${date.label} ===`);
    lines.push('');
    lines.push('CROSS-CHECKED — two methods that share no code, so the gap can convict.');
    lines.push('');
    lines.push('  ' + pad('place', 13) + padLeft('rise', 6) + padLeft('set', 7) +
      padLeft('gap rise', 10) + padLeft('gap set', 9) + '  standing');
    for (const place of CANDIDATES) {
      const s = surveyOne(place, date.iso);
      if (s.threw) { lines.push('  ' + pad(place.name, 13) + '  threw: ' + s.threw); continue; }
      if (s.never) { lines.push('  ' + pad(place.name, 13) + `  the sun never ${s.never} — no events to check`); continue; }
      const cc = s.row.crossCheck;
      const notes = [];
      if (cc.beyondBound) { notes.push('PAST THE BOUND — the tower refuses'); refused = true; }
      // Ember's caution on the wording, and it is the whole of why this flag
      // is not yesterday's bound-only fault. The flag is a verdict on the
      // *evidence*, never on the number: it must not drift toward *suspicious*
      // or *may be wrong*. It does not know whether the gap is honest — near a
      // pole the sun climbs at a shallow angle, so the same small disagreement
      // in the trig becomes many more minutes, and 6.51 may be exactly right
      // and unremarkable. It says only what it can see: the sweep did not
      // reach here, so the bound is not evidence about this row.
      if (s.riseStanding.outsideBand) notes.push('unwitnessed latitude — the sweep did not reach here');
      if (s.riseStanding.overGap || s.setStanding.overGap) notes.push('gap larger than any the sweep saw');
      lines.push('  ' + pad(place.name, 13) + padLeft(s.row.sunrise, 6) + padLeft(s.row.sunset, 7) +
        padLeft(signed(cc.sunriseGapMinutes, 2), 10) + padLeft(signed(cc.sunsetGapMinutes, 2), 9) +
        '  ' + (notes.length ? notes.join('; ') : 'inside the witness'));
    }
    lines.push('');
    lines.push('SINGLE-METHOD — method A alone. Checkable against itself, not against the world.');
    lines.push('');
    lines.push('  ' + pad('place', 13) + padLeft('day', 8) + padLeft('drift', 9) +
      padLeft('rising pt', 11) + padLeft('step', 9) + '  the day-line join');
    for (const place of CANDIDATES) {
      const s = surveyOne(place, date.iso);
      if (s.threw) { lines.push('  ' + pad(place.name, 13) + '  threw: ' + s.threw); continue; }
      if (s.never) {
        // The first draft of this line printed the row's clock offset beside
        // the word, and printed `+NaNh`. A dark row carries no
        // `utcOffsetMinutes`: the fold returns before the civil-clock step, so
        // the field is absent, not zero and not wrong. I reached for it
        // without asking whether the row had it — Day 20's own fault, in a file
        // written with Day 20's diary in that morning's read. What the tool
        // says now is what it has. That the offset is a real and computable
        // fact about a dark day, thrown away with the rest before the fold, is
        // named here and not built: it belongs beside Ember's solar-noon
        // altitude, which is the same discard from the same line.
        lines.push('  ' + pad(place.name, 13) + `  never ${s.never} — the fold returns before the clock, so no offset is published`);
        continue;
      }
      const r = s.row;
      const drift = r.changeSinceYesterdayMinutes === null
        ? 'none' : signed(r.changeSinceYesterdayMinutes, 2);
      lines.push('  ' + pad(place.name, 13) +
        padLeft((r.dayLengthMinutes / 60).toFixed(2) + 'h', 8) +
        padLeft(drift, 9) +
        padLeft(r.risingPointDegrees.toFixed(1) + '°', 11) +
        padLeft(r.risingPointStepSunWidths.toFixed(2) + 'sw', 9) +
        '  ' + (s.reach.length ? 'reached: ' + s.reach.join(', ') : 'not reached'));
    }
  }

  lines.push('');
  lines.push('The day-line column says whether method A\'s own answer falls outside the UTC');
  lines.push('day of the row\'s date — the join the two methods went twenty-one days without.');
  lines.push('Paris never reaches it. A place that does is a place where yesterday\'s repair');
  lines.push('is load-bearing rather than exercised.');
  return refused;
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.problem) {
    process.stderr.write('INVALID — ' + args.problem + '\n' + USAGE + '\n');
    return 2;
  }
  if (args.help) {
    process.stdout.write(USAGE + '\n');
    return 0;
  }
  const lines = [];
  const refused = report(lines);
  process.stdout.write(lines.join('\n') + '\n');
  return refused ? 1 : 0;
}

// The command line is not the only door (Day 10). This one only reads, but a
// `require()` that printed a page and exited the importing process is still a
// tool doing something nobody asked for.
if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { CANDIDATES, DATES, MOVE_DATE, surveyOne, witnessStanding, dayLineReach, main };
