#!/usr/bin/env node
'use strict';
//
// The sweep behind DRIFT_TOLERANCE_WITNESS — the door that witness never had.
//
// Day 44. Day 31 said a banked fact owes three things: its date, its domain,
// and whether anything can still go and gather it again. `cross-check-sweep.js`
// wrote that third one down — *a banked fact whose evidence cannot be re-run
// is not weaker than a law by a little; it is a law with a date on it and no
// way back* — and eight mornings later this house banked a cross-engine
// measurement with no way back and wrote, directly above it, that it had one.
// Day 43 built `banked.js` to try every such door, and this is the one that
// would not open: UNGATHERED every morning since, by design, so it could not
// go quiet.
//
// ---- Why this is not a reconstruction, which is the whole shape of it ----
//
// Day 43 tried to rebuild the lost sweep from the witness's own `domain`
// field and got four of its five figures back exactly. Ash's cut on that is
// the reason this file is written the way it is: **the four that reproduced
// are properties of the instrument, not of the measurement.** Any sweep
// carrying every leaf and excluding the late-born paths returns them, so
// their agreeing is free and votes on nothing. The one figure with power to
// convict or acquit — the parting count — came out 46, 51, 42 and 42 over
// four date sets, two of them hitting the banked 42, one of those a set
// picked to be wrong. **A scope is not a recipe.** A `domain` says what was
// swept; it never says what was asked.
//
// So this file does not try to reproduce the tenth of September. It asks its
// own question, on its own domain, on its own date, and says so. **Nothing
// here confirms or refutes the banked figures of 2026-09-10, and a reader who
// subtracts one set from the other is subtracting two different
// measurements.** That sentence is printed on every run, not left to be
// inferred.
//
// ---- The question, written down, which is the thing that was missing ----
//
// `reckoning/ledger.json` is written by **node on this desk** and recomputed
// **in a stranger's browser**, which is a different engine. `sameNumber()`
// decides whether a published number has moved, with a bound of
// DRIFT_TOLERANCE_ABSOLUTE or DRIFT_TOLERANCE_ULPS. So:
//
//   *Do two engines produce the same doubles from this instrument, and is any
//   parting between them wide enough that `sameNumber()` would call it a
//   move?*
//
// A parting past that bound would make the page print DRIFTED at a stranger
// about a row no hand ever touched — the tower convicting itself of forgery
// on the strength of a floating-point unit.
//
// **Two stakes, and they are not one stake** (Ash, this morning). The leaves
// this walks are not all the same kind of thing:
//
//   * a leaf an auditor reads — under `horizon`, `working` or `crossCheck`,
//     the DEEP_CLAIMS fields, or one of the top-level CLAIMS. A parting past
//     the bound here is the DRIFTED-at-a-stranger fault above.
//   * a leaf an auditor never reads. It can still be wrong; it just cannot
//     produce that fault. `working.atSunrise.lastMoveSeconds` is a solver's
//     residual and appears on no page — and it was the worst parting the
//     tenth of September ever found.
//
// The counts are reported apart for that reason. A single number over both
// would be the same fusion this sweep found in the witness it replaces.
//
// **And the word `engine` covers two mechanisms, not one** (Ember's knife,
// this morning). A double that parts is arithmetic. But `zoneOffsetMinutes`
// asks **Intl**, and node and bun carry their own ICU builds and their own
// copies of the tz database — so a parting there would not be arithmetic at
// all, it would be two copies of somebody's law, and Day 6's rule applies:
// suspect the parliament before the sky. Those leaves are strings and dates
// rather than doubles, so they are walked and counted **separately**, and the
// run says outright when the count is zero rather than letting the silence be
// read as a numeric result.
//
// ---- How it asks ----
//
// Both engines are spawned on this same file with `--emit`, and neither is
// run in-process. The symmetry is the point: an in-process walk and a spawned
// walk differ in more than the engine (module cache, argv, stdio), and a
// difference the harness introduced would be banked as a difference the
// engines did. Each side **writes** one JSON object of `path -> tagged value`
// to a file this process names — never to stdout, for the reason below — and
// every double goes over the wire as its **raw 64-bit pattern** via
// `DataView`, so *differs* means *not bit-identical*.
//
// **That was shipped under a wider claim than it can carry, and its own breaks
// suite took the claim off it.** This comment said the bits could not be
// softened by either engine's shortest round-trip printer. Swap `bitsOf` for
// `String(v)` at both ends and the count is the **same 143** — JavaScript's
// number-to-string is shortest-round-trip by specification, so it cannot map
// two distinct doubles onto one string, and the bits buy no distinctness over
// decimal at all. What they do buy is narrower and still worth having: the
// comparison no longer rests on two engines implementing that printer alike,
// which is itself an engine behaviour and is the thing this file exists to
// doubt. Measured, on this domain, on this pair, today.
//
// The **kind tagging** is the half that is load-bearing, and that was measured
// too: a leaf that is a number on one engine and a string on the other parts
// only because `tag()` puts them on separate shelves before anything is
// compared. Flatten the tags and the disagreement vanishes.
//
// **A file and not a pipe, and that was measured rather than chosen.** The
// first draft had each engine write its JSON to stdout. Node's arrived whole;
// bun's came back truncated at 182,720 characters, because a large final
// `process.stdout.write` can be cut off when the process exits. Read as a
// result that would have been a parting of *shape* — leaves present on one
// engine and absent on the other — and the reading would have been about the
// pipe, not about JavaScriptCore. This is exactly what the symmetry above is
// for, arriving one line later than the argument for it: a difference the
// harness introduced, wearing the answer's clothes. Both sides write a file
// now, which neither engine truncates.
//
// No clock is read. Every date and place below is a constant in this file, so
// a committed run reproduces from any clone (Day 22's rule for `survey.js`).
// The tz database is the one input asked of the world and it is named here
// rather than promised away.
//
// ---- Exit codes ----
//
//   0  AGREES  — the published witness is what this sweep found.
//   1  DIFFERS — it is not. Not automatically a fault; work out which moved.
//   2  could not ask at all — the second engine is not on this desk. A hole,
//      never the alarm. `banked.js` renders this as UNASKABLE, which is the
//      right shelf; see the note at the foot of this file about the reason
//      being dropped on the way.
//   3  INVALID — a bad argument never spends a code a real finding lives on.

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MODULE = path.join(ROOT, 'reckoning', 'reckoning.js');
const R = require(MODULE);

const USAGE = 'usage: drift-tolerance-sweep.js [--help] [--emit <path>]';

// The domain, written down. Six places and eight dates, chosen to reach the
// branches rather than to be tidy: the standing place, the three this tower
// has stood in before it, one inside the polar fold, one far south. The dates
// carry both solstices, both equinoxes, the turn of the year (where the
// almanac's epoch restarts), this tower's first published row, and the
// morning this sweep was gathered.
const PLACES = [
  { name: 'Nairobi', latitude: -1.2921, longitude: 36.8219, zone: 'Africa/Nairobi' },
  { name: 'Paris', latitude: 48.8566, longitude: 2.3522, zone: 'Europe/Paris' },
  { name: 'Auckland', latitude: -36.8485, longitude: 174.7633, zone: 'Pacific/Auckland' },
  { name: 'Anchorage', latitude: 61.2181, longitude: -149.9003, zone: 'America/Anchorage' },
  { name: 'Longyearbyen', latitude: 78.2232, longitude: 15.6267, zone: 'Arctic/Longyearbyen' },
  { name: 'Ushuaia', latitude: -54.8019, longitude: -68.3030, zone: 'America/Argentina/Ushuaia' }
];

const DATES = [
  '2026-03-20', '2026-06-21', '2026-08-06', '2026-09-16',
  '2026-09-22', '2026-11-15', '2026-12-21', '2027-01-01'
];

// ---- The walk ----

// **Two doubles that are the same number and not the same bits** (Ember,
// this morning, by running it rather than reading it). A NaN has 2^52 legal
// bit patterns and nothing obliges two engines to pick the same one; and +0
// and -0 are different patterns for a value `sameNumber()` reads as
// unmoved. A raw-bits comparison would call either a parting — and for NaN
// it would go further and *convict*, because `Math.abs(NaN - NaN)` is NaN and
// `NaN <= tolerance` is false, so a false parting would spend exit 1, which is
// the alarm and is the one code nothing else may take. Today's domain holds
// neither, which is a fact about today's six places and eight dates and not a
// guarantee about the ninth date somebody adds. So both are folded to one
// pattern here, the same way `sameNumber()` folds them, and the folding is
// done at emit time so it cannot be forgotten by a later comparer.
function bitsOf(x) {
  if (Number.isNaN(x)) return 'NaN';
  if (x === 0) return 'zero';
  const d = new DataView(new ArrayBuffer(8));
  d.setFloat64(0, x);
  return d.getBigUint64(0).toString(16).padStart(16, '0');
}

// Tagged so the comparer can tell a double from a string without guessing,
// and so a leaf that changed *kind* between engines is visible as a parting
// rather than quietly compared as text.
function tag(v) {
  if (v === null) return '#null';
  if (v === undefined) return '#undefined';
  if (typeof v === 'number') return 'f' + bitsOf(v);
  if (typeof v === 'boolean') return 'b' + String(v);
  if (typeof v === 'string') return 's' + v;
  return '?' + typeof v;
}

function walk(out, prefix, v) {
  if (v === null || v === undefined || typeof v !== 'object') { out[prefix] = tag(v); return; }
  if (Array.isArray(v)) { v.forEach((e, i) => walk(out, prefix + '[' + i + ']', e)); return; }
  for (const k of Object.keys(v).sort()) walk(out, prefix + '.' + k, v[k]);
}

function emit(outPath) {
  const out = {};
  for (const place of PLACES) {
    for (const date of DATES) {
      const head = place.name + '|' + date;
      let row;
      try {
        row = R.reckon(date, place);
      } catch (e) {
        // A throw is an answer and both engines must give the same one.
        out[head + '|!throw'] = 's' + String(e && e.message);
        continue;
      }
      walk(out, head, row);
    }
  }
  fs.writeFileSync(outPath, JSON.stringify(out));
}

// ---- Which leaves an auditor actually reads ----
//
// The two stakes above. A path like `Paris|2026-06-21.working.atSunrise.x`
// is audited if its field — the first segment after the row head — is one of
// DEEP_CLAIMS or CLAIMS. Read off the instrument's own lists, never a list
// kept here, so a claim added tomorrow moves this count without a hand.
function auditedFields() {
  const set = new Set(R.DEEP_CLAIMS || []);
  for (const c of (R.CLAIMS || [])) set.add(c);
  return set;
}

function fieldOf(leafPath) {
  const dot = leafPath.indexOf('.');
  if (dot < 0) return null;
  const rest = leafPath.slice(dot + 1);
  const next = rest.search(/[.[]/);
  return next < 0 ? rest : rest.slice(0, next);
}

// ---- Asking the two engines ----

function bunPath() {
  const found = spawnSync('bun', ['--version'], { encoding: 'utf8' });
  if (found.error || found.status !== 0) return null;
  return String(found.stdout || '').trim();
}

function askEngine(cmd, args, outPath) {
  const run = spawnSync(cmd, args.concat([__filename, '--emit', outPath]),
    { cwd: ROOT, encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL' });
  if (run.error) return { error: cmd + ' would not run: ' + run.error.message };
  if (run.status !== 0) return { error: cmd + ' exited ' + run.status + ': ' + String(run.stderr || '').trim().slice(0, 300) };
  if (!fs.existsSync(outPath)) return { error: cmd + ' ran and wrote no leaves' };
  try {
    return { leaves: JSON.parse(fs.readFileSync(outPath, 'utf8')) };
  } catch (e) {
    return { error: cmd + ' did not write readable JSON: ' + e.message };
  }
}

function ulpsApart(a, b) {
  const step = Math.max(Math.abs(a), Math.abs(b)) * Number.EPSILON;
  if (!(step > 0)) return 0;
  return Math.abs(a - b) / step;
}

function fromBits(hex) {
  if (hex === 'NaN') return NaN;
  if (hex === 'zero') return 0;
  const d = new DataView(new ArrayBuffer(8));
  d.setBigUint64(0, BigInt('0x' + hex));
  return d.getFloat64(0);
}

function compare(left, right) {
  const audited = auditedFields();
  const out = {
    leaves: 0, numeric: 0, other: 0,
    differ: 0, differNumeric: 0, differOther: 0,
    differAudited: 0, differUnaudited: 0,
    onlyOneSide: 0, kindChanged: 0, convicted: 0, dark: 0, threw: 0, nan: 0, zero: 0,
    worstAbsolute: { gap: 0, path: null }, worstUlps: { ulps: 0, path: null },
    otherPartings: []
  };
  const keys = new Set(Object.keys(left).concat(Object.keys(right)));
  for (const k of keys) {
    const a = left[k], b = right[k];
    if (a === undefined || b === undefined) { out.onlyOneSide += 1; continue; }
    out.leaves += 1;
    const numeric = a[0] === 'f' && b[0] === 'f';
    if (numeric) out.numeric += 1; else out.other += 1;
    if (k.endsWith('|!throw')) out.threw += 1;
    if (a === 'fNaN' && b === 'fNaN') out.nan += 1;
    if (a === 'fzero' && b === 'fzero') out.zero += 1;
    // `never` is a *string* — 'set' or 'risen' — never a boolean. The first
    // draft of this line tested `a === 'btrue'` and so had no domain at all:
    // it printed `0 rows folded dark` over a sweep carrying Longyearbyen at
    // both solstices, which is two rows that certainly fold. A zero that is a
    // fact about the detector, wearing a measurement's face (Day 27, and this
    // house has counted eight of these). The guard below is why it was found
    // before it shipped rather than after.
    if (/\.never$/.test(k) && a[0] === 's') out.dark += 1;
    if (a === b) continue;
    out.differ += 1;
    if (a[0] !== b[0]) { out.kindChanged += 1; out.differOther += 1; out.otherPartings.push(k + ' — kind changed'); continue; }
    if (!numeric) {
      out.differOther += 1;
      out.otherPartings.push(k + ' — ' + a.slice(1) + ' vs ' + b.slice(1));
      continue;
    }
    out.differNumeric += 1;
    const field = fieldOf(k);
    if (field && audited.has(field)) out.differAudited += 1; else out.differUnaudited += 1;
    const x = fromBits(a.slice(1)), y = fromBits(b.slice(1));
    // The stake, asked directly: would the auditor call this a move?
    if (!R.sameNumber || typeof R.sameNumber !== 'function') {
      // sameNumber is not exported; ask its bound by hand, from the
      // instrument's own two constants rather than from a number typed here.
      const gap = Math.abs(x - y);
      const step = Math.max(Math.abs(x), Math.abs(y)) * Number.EPSILON;
      if (!(gap <= R.DRIFT_TOLERANCE_ABSOLUTE) && !(gap <= step * R.DRIFT_TOLERANCE_ULPS)) out.convicted += 1;
    } else if (!R.sameNumber(x, y)) {
      out.convicted += 1;
    }
    const gap = Math.abs(x - y);
    if (gap > out.worstAbsolute.gap) out.worstAbsolute = { gap, path: k };
    const u = ulpsApart(x, y);
    if (u > out.worstUlps.ulps) out.worstUlps = { ulps: u, path: k };
  }
  return out;
}

function say(line) { console.log('drift-tolerance: ' + line); }

// Walked token by token, and every token either is understood or is refused
// (Day 13). The draft that grew `--emit <path>` skipped the value token with
// `argv[argv.indexOf('--emit') + 1] === arg`, which is `argv[-1 + 1]` — that
// is `argv[0]` — whenever `--emit` is absent, so the *first* unknown flag was
// silently skipped and the sweep ran and exited 0. `--nonsense` got a clean
// report back, which is exactly the fault `post-status.js` was repaired for on
// Day 13, reintroduced here by the hand that had just read about it. Its own
// breaks suite caught it on the first run.
function main(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') { console.log(USAGE); return 0; }
    if (arg === '--emit') {
      const outPath = argv[i + 1];
      if (!outPath) { process.stderr.write('drift-tolerance: INVALID — --emit wants a path\n' + USAGE + '\n'); return 3; }
      emit(outPath);
      return 0;
    }
    process.stderr.write('drift-tolerance: INVALID — ' + arg + '\n' + USAGE + '\n');
    return 3;
  }

  const bunVersion = bunPath();
  if (!bunVersion) {
    // Not DIFFERS. Nothing was measured, so nothing can have moved, and the
    // alarm is not this file's to spend (Ember, Day 40).
    say('UNASKABLE — bun is not on this desk, so there is no second engine to ask.');
    say('  that is a hole and not a finding. No number moved; none was measured.');
    return 2;
  }

  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'drift-tolerance-'));
  const left = askEngine(process.execPath, [], path.join(tmp, 'v8.json'));
  const right = askEngine('bun', [], path.join(tmp, 'jsc.json'));
  for (const side of [left, right]) {
    if (side.error) { say('UNASKABLE — ' + side.error); return 2; }
  }

  const s = compare(left.leaves, right.leaves);
  const w = R.DRIFT_TOLERANCE_WITNESS;

  say(`engines: V8 (node ${process.versions.node}) and JavaScriptCore (bun ${bunVersion})`);
  say(`domain: ${PLACES.length} places, ${DATES.length} dates, ${s.leaves} leaves — ` +
    `${s.numeric} doubles, ${s.other} not (strings, booleans, absences)`);
  say(`  ${s.dark} rows folded dark; ${s.threw} refused outright by both engines alike`);
  say(`  ${s.nan} leaves are NaN and ${s.zero} are zero on both engines — folded to one pattern`);
  say('    each, the way sameNumber() folds them. A NaN has many legal bit patterns and');
  say('    would otherwise have spent exit 1 on a parting that is not one.');
  // The domain above is chosen to reach the fold. If it ever stops reaching
  // it, that is a fault in this file and not a clean sweep — an empty domain
  // always says yes, so it is asserted rather than reported.
  if (s.dark === 0) {
    say('  UNASKABLE — this domain carries a polar place at both solstices and no row folded.');
    say('    that is a fault in this sweep, not a reading of the engines.');
    return 2;
  }
  if (s.onlyOneSide > 0) say(`  ${s.onlyOneSide} leaves exist on one engine only — that is a parting of shape, counted apart`);
  say('');
  say(`leaves not bit-identical between the two engines: ${s.differ} of ${s.leaves}`);
  say(`  ${s.differNumeric} are doubles; ${s.differOther} are not`);
  say(`  of the doubles: ${s.differAudited} sit under a field an auditor reads, ${s.differUnaudited} under one it never does`);
  if (s.differOther === 0) {
    // Said outright rather than left as a silence. Day 27: an empty domain
    // always says yes, and a zero that is never printed cannot be read.
    say('  no string, boolean or absence parted. So nothing here is a tz-database');
    say('  disagreement between the two ICU builds — measured, not assumed.');
  } else {
    say('  and these are not arithmetic — suspect the parliament before the sky:');
    for (const p of s.otherPartings.slice(0, 10)) say('    ' + p);
  }
  say('');
  // Two winners, named apart. The witness this replaces carried a singular
  // `largestPartingPath` under an absolute figure belonging to a different
  // leaf — one name laid across two measurements (Day 42).
  say(`largest parting by absolute gap:  ${s.worstAbsolute.gap.toExponential(3)}  at ${s.worstAbsolute.path}`);
  say(`largest parting by ulps of value: ${s.worstUlps.ulps.toExponential(3)}  at ${s.worstUlps.path}`);
  if (s.worstAbsolute.path !== s.worstUlps.path) {
    say('  — two different leaves. They are two measurements and get two names.');
  }
  say('');
  say(`would sameNumber() call any of these a move? ${s.convicted} times`);
  say(`  (its bound: ${R.DRIFT_TOLERANCE_ABSOLUTE} absolute, or ${R.DRIFT_TOLERANCE_ULPS} ulps)`);
  say('');
  say('not measured, and said rather than implied: SpiderMonkey. A reader on');
  say('Firefox is outside this sweep, as they were outside the last one.');
  say('this is a measurement of 2026-09-16 on its own domain. It does not confirm');
  say('and does not refute the figures gathered on 2026-09-10, whose question was');
  say('never written down — a scope is not a recipe. Do not subtract one from the other.');
  say('');

  const agrees =
    w.leaves === s.leaves &&
    w.leavesThatDiffer === s.differ &&
    w.convicted === s.convicted &&
    w.largestPartingAbsolutePath === s.worstAbsolute.path &&
    w.largestPartingUlpsPath === s.worstUlps.path &&
    Math.abs(w.largestPartingAbsolute - s.worstAbsolute.gap) <= Math.abs(s.worstAbsolute.gap) * 0.005 &&
    Math.abs(w.largestPartingUlps - s.worstUlps.ulps) <= Math.abs(s.worstUlps.ulps) * 0.005;

  if (agrees) {
    say('AGREES — the published witness is what this sweep found.');
    return 0;
  }
  say('DIFFERS — the published witness says ' +
    `${w.leaves} leaves, ${w.leavesThatDiffer} parting, ${w.convicted} convicted, ` +
    `worst absolute at ${w.largestPartingAbsolutePath}, worst ulps at ${w.largestPartingUlpsPath}.`);
  say('that is not automatically a fault. Work out which moved, then write it down.');
  return 1;
}

// A note about `banked.js`, whose door this is. It runs a gatherer with node
// and reads the last line matching AGREES or DIFFERS. An exit 2 with neither
// word lands on UNASKABLE, which is the right shelf — both "no second engine"
// and "this script is broken" are holes and neither is the alarm. But they are
// not the same sentence, and the *reason* used to be dropped on the way, so a
// later hand without bun read "exited 2 and said neither AGREES nor DIFFERS"
// and would have gone debugging a script that was never wrong. Ember argued it
// should be widened today rather than named, and it was: `banked.js` now
// carries through the first `UNASKABLE` line a gatherer prints on a nonzero
// exit. That is why every refusal above is worded `UNASKABLE — <reason>`.

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { compare, PLACES, DATES };
