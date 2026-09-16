#!/usr/bin/env node
'use strict';
//
// The door the banked numbers never had.
//
// Day 43. A banked number is a measurement taken once and written into
// `reckoning/reckoning.js` as a constant — a fact about the world that this
// tower gathered on a named morning and has carried ever since. Day 5 said
// such a number owes its **date** and its **domain**, because a banked fact
// with no date on it reads as a law. Day 31 added a third thing it owes:
// **whether anything can still go and gather it again.** `cross-check-sweep.js`
// put it best, and that file is where this one starts:
//
//   *A banked fact whose evidence cannot be re-run is not weaker than a law
//   by a little. It is a law with a date on it and no way back.*
//
// That was written eight mornings before this file. In between, this house
// banked another number and gave it no way back — and wrote, in the comment
// directly above it, that it had one. The sentence read: *the sweep is two
// commands on this desk for as long as both engines are here, and it is
// written down so a later hand can re-run it rather than believe it.* The
// two commands are not written down anywhere in this tree. The day's log
// kept the sweep's **output** and did not keep the sweep.
//
// So the third obligation was being discharged by a sentence saying it had
// been discharged, and nothing had ever tried the door. That is the fault
// this file exists for, and it is not fixed by making the sentence true. It
// is fixed by something that **tries**.
//
// ---- What it asks, and of what ----
//
// It finds the witnesses off the module's own **export surface** — every
// export whose name ends `_WITNESS` — rather than from a list kept here. A
// list kept here would go blind to the next number somebody banks, and
// report that blindness as a clean run (Day 29, Day 30). The naming rule is
// the claim: an object called `*_WITNESS` is asserting it is evidence for a
// published figure, and this file holds it to that.
//
// Of each one it asks three questions, and they are forked because they
// catch different things:
//
//   * **Is it dated?** A witness with no `gathered` or `sweptOn` is a law.
//   * **Can it still be asked?** Does it name a gatherer, does that file
//     exist, does it run, and does it still say AGREES. Asked by running it,
//     never by reading a field.
//   * **Has the instrument outgrown it?** Only of a witness that declares
//     `domainIsInstrument` — see below. This is the question Ash pulled out
//     of the morning and it is the one that fires again on its own.
//
// ---- The growth question, and why it needs no reconstruction ----
//
// Two of the three witnesses here are swept over a grid of latitudes,
// longitudes and dates — a domain **outside** this house, which does not
// move when we work. `DRIFT_TOLERANCE_WITNESS` is not. Its domain is the
// instrument's own leaves: every number a row carries, compared between two
// engines. So every morning that adds a field to a row silently widens the
// thing that witness claims to cover, while the witness goes on carrying the
// old count beside the old date, looking exactly as sound as the day it was
// true. It does not go stale because a hand touched it. It goes stale
// because the thing it is a witness to grew.
//
// A witness declares that about itself with `domainIsInstrument: true`, and
// then this file answers the question out of `PATH_INTRODUCED` alone: which
// paths were born after the day the witness was gathered? That costs no
// reconstruction, no places, no dates and no second engine — and it is exact,
// because the birthdays are what the instrument writes about itself.
//
// ---- What it does not see, said on its own face ----
//
// It sees a banked number that was **given an object and a name**. The
// quarter-hour clock guard's witness is four sentences of comment around
// line 1286 — 418 zones walked on 2026-08-10, 1,221,396 samples — with a
// date and a domain and no object, so nothing here can find it. A text sweep
// would not repair that: Day 35 found that a sweep over prose cannot tell an
// assertion from a quotation of one being corrected. Named, not built.
//
// ---- The exit codes, and why three ----
//
//   0  every witness is dated, still gatherable, still agreeing, not outgrown
//   1  DIFFERS — a gatherer ran and the world no longer says what we banked.
//      This is the alarm. Nothing else may ever spend it.
//   2  a standing hole: a witness that cannot be asked at all, or one the
//      instrument has outgrown. Today's expected state, and it is expected
//      for a named reason rather than tolerated.
//   3  INVALID — a bad argument. Day 13: a mistyped flag must never spend
//      the exit code a real finding lives on.
//
// The fork between 1 and 2 is Ember's Day 40 caution taken seriously. A
// single nonzero verdict here would read 2 every morning for as long as one
// witness stays ungathered, and an alarm that is on every morning is an
// alarm a keeper stops reading. So *something moved* and *something was
// never wired* are different words and different codes.

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const R = require(path.join(ROOT, 'reckoning', 'reckoning.js'));

const USAGE = 'usage: banked.js [--help] [--list]';

function say(line) { console.log('banked: ' + line); }

// Off the export surface, never a list kept here.
function witnesses() {
  return Object.keys(R)
    .filter((k) => /_WITNESS$/.test(k))
    .sort()
    .map((k) => ({ name: k, value: R[k] }));
}

function dateOf(w) {
  return w.value.gathered || w.value.sweptOn || null;
}

// The second unfriendly-reader question: is discovery-by-suffix just a
// hand-kept list wearing a convention's clothes? Answer: not the same
// fault, but not a clean escape from it either. A hand-kept list of names
// goes blind when this *tool* is not told about a new witness. A naming
// convention goes blind when the person banking a new fact does not spell
// its name by the rule — a smaller failure (it is caught the moment a
// second banker reads the one export next to it) but not a zero one, and
// nothing before this made it visible.
//
// So this reads `reckoning.js`'s own source for the shape a banked number
// actually has — `gathered:` or `sweptOn:` inside a top-level `var NAME =
// {...}` — and flags any NAME that does not end `_WITNESS`. Not a prose
// sweep in Day 35's sense: it is not asking whether a sentence asserts
// something, it is asking whether an object with dated evidence's own two
// field names sits behind the name this file's discovery rule requires.
// A brace-depth scan, not a regex over the whole file, because a witness
// object runs many lines and a naming rule that only checked the `var`
// line itself would have no way to know what fields live inside it.
function sourceScanMismatches() {
  const src = fs.readFileSync(path.join(ROOT, 'reckoning', 'reckoning.js'), 'utf8');
  const lines = src.split('\n');
  const mismatches = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^\s*var ([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{\s*$/);
    if (!open) continue;
    const name = open[1];
    let depth = 1, hasDate = false, j = i + 1;
    for (; j < lines.length && depth > 0; j++) {
      const opens = (lines[j].match(/\{/g) || []).length;
      const closes = (lines[j].match(/\}/g) || []).length;
      depth += opens - closes;
      if (/^\s*(gathered|sweptOn):\s*'/.test(lines[j])) hasDate = true;
    }
    if (hasDate && !/_WITNESS$/.test(name)) {
      mismatches.push({ name: name, line: i + 1 });
    }
  }
  return mismatches;
}

// Paths this instrument has gained since a witness was gathered. Read off
// PATH_INTRODUCED, which is the instrument's own record of its own births,
// so the count is never typed and cannot go stale the way a sentence does.
function bornAfter(dateISO) {
  const born = R.PATH_INTRODUCED || {};
  return Object.keys(born).filter((p) => born[p] > dateISO).sort();
}

// Day 43, found asking this file the unfriendly-reader question Gnomon
// put to it: what happens if a gatherer hangs? `spawnSync`'s `timeout`
// alone does not answer that. Its default `killSignal` is SIGTERM, which
// a gatherer can trap and ignore — proved on a scratch script that does
// exactly that — and `spawnSync` will not return until the child actually
// exits, so an ignored SIGTERM makes the *timeout* a number in a comment
// and not a bound: this whole tool hangs forever, silently, spending none
// of the three exit codes the fork above exists to keep separate. SIGKILL
// cannot be trapped, so it is the kill signal here instead. Measured, not
// assumed: the same scratch script that hung indefinitely under SIGTERM
// returns within the timeout under SIGKILL, correctly reporting BROKEN.
//
// The timeout is a real one and it is still five minutes, because a slow
// sweep should get to finish; `BANKED_GATHERER_TIMEOUT_MS` overrides it,
// the way `WAIT_FOR_DEPLOY_TIMEOUT` overrides the deploy wait, so a test
// can prove the hang is bounded without waiting five minutes to see it.
const GATHERER_TIMEOUT_MS = Number(process.env.BANKED_GATHERER_TIMEOUT_MS) || 300000;

// Ask the gatherer by running it. A field naming a file is a claim; the
// answer is what the file says when it is asked.
function askGatherer(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return { state: 'MISSING', line: rel + ' is named and is not in this tree' };
  const run = spawnSync(process.execPath, [abs],
    { cwd: ROOT, encoding: 'utf8', timeout: GATHERER_TIMEOUT_MS, killSignal: 'SIGKILL' });
  if (run.error) return { state: 'BROKEN', line: rel + ' would not run: ' + run.error.message };
  const out = String(run.stdout || '') + String(run.stderr || '');
  const verdict = out.split('\n').filter((l) => /AGREES|DIFFERS/.test(l)).pop() || '';
  if (run.status === 0 && /AGREES/.test(verdict)) return { state: 'AGREES', line: verdict.trim() };
  if (run.status === 1 && /DIFFERS/.test(verdict)) return { state: 'DIFFERS', line: verdict.trim() };
  // Day 44, Ember's. Both shelves below are UNASKABLE and that is right — a
  // gatherer that cannot ask and a gatherer that is broken are both holes and
  // neither is the alarm. But they are not the same *sentence*, and until now
  // only one was ever printed. A later hand on a desk without the second
  // engine got `exited 2 and said neither AGREES nor DIFFERS`, which reads as
  // a bug in a script that was never wrong, and would cost them a morning. So
  // a gatherer's own stated reason is carried through when it gives one.
  // Recognised only on a nonzero exit, because a tool that exits 0 has claimed
  // it did its job and does not get to also say it could not.
  const said = out.split('\n').filter((l) => /^\S+:\s+UNASKABLE\b/.test(l)).shift() || '';
  if (run.status !== 0 && said) return { state: 'BROKEN', line: said.trim() };
  return {
    state: 'BROKEN',
    line: rel + ' exited ' + run.status + ' and said ' +
      (verdict ? '"' + verdict.trim() + '"' : 'neither AGREES nor DIFFERS')
  };
}

function report(listOnly) {
  const found = witnesses();
  if (found.length === 0) {
    // Not "all clear". Day 27: an empty domain always says yes, so this
    // fork exists rather than letting a zero-length loop print a clean bill.
    say('NO WITNESSES — nothing exported from reckoning.js ends in _WITNESS.');
    say('that is not a clean run. Either the naming rule moved or the module did not load.');
    return 2;
  }

  let differed = 0;
  let unasked = 0;
  let outgrown = 0;

  for (const w of found) {
    const when = dateOf(w);
    say('');
    say(w.name + (when ? ' — gathered ' + when : ''));

    if (!when) {
      // Day 5: a banked fact with no date on it reads as a law.
      say('  UNDATED — it carries no gathered/sweptOn. A banked fact with no date reads as a law.');
      unasked += 1;
    }

    const tool = w.value.tool;
    if (!tool) {
      say('  UNGATHERED — it names no gatherer, so nothing here can ask the world again.');
      say('    and what is missing is the question, not the scope. A `domain` says what was');
      say('    swept; it does not say what was asked — which leaves count, what counts as a');
      say('    parting, ulps or absolute. A later hand can rebuild the scope and cannot know');
      say('    they rebuilt the question.');
      unasked += 1;
    } else if (listOnly) {
      say('  names ' + tool + ' — not run (--list).');
    } else {
      const answer = askGatherer(tool);
      if (answer.state === 'AGREES') {
        say('  GATHERED — ' + tool + ' ran, and: ' + answer.line);
      } else if (answer.state === 'DIFFERS') {
        say('  DIFFERS — ' + tool + ' ran, and: ' + answer.line);
        say('    that is not automatically a fault. Work out which moved, then write it down.');
        differed += 1;
      } else {
        say('  UNASKABLE — ' + answer.line);
        unasked += 1;
      }
    }

    if (w.value.domainIsInstrument) {
      const late = when ? bornAfter(when) : [];
      if (late.length === 0) {
        say('  its domain is this instrument, and no path has been born since it was gathered.');
      } else {
        say('  OUTGROWN — its domain is this instrument, and ' + late.length +
          ' path' + (late.length === 1 ? ' has' : 's have') + ' been born since:');
        for (const p of late) say('    ' + p + ' (born ' + R.PATH_INTRODUCED[p] + ')');
        say('    the witness did not move. The thing it is a witness to grew around it.');
        outgrown += 1;
      }
    }
  }

  // The naming-convention check: an object with a witness's own dated
  // shape, banked under a name the discovery rule above will never read.
  // This is not one of "the" witnesses — it is a witness the tool cannot
  // even count as found, so it is reported apart from the per-witness loop
  // rather than folded into `found.length`.
  const misnamed = sourceScanMismatches();
  say('');
  say(found.length + ' banked witness' + (found.length === 1 ? '' : 'es') + ' asked.');
  say('it sees a banked number that was given an object and a name ending _WITNESS.');
  say('one banked here was never given either — the quarter-hour clock guard\'s walk of');
  say('418 zones on 2026-08-10 lives in a comment, and nothing can find it from here.');
  if (misnamed.length > 0) {
    say('');
    say('MISNAMED — ' + misnamed.length + ' object' + (misnamed.length === 1 ? '' : 's') +
      ' in reckoning.js carr' + (misnamed.length === 1 ? 'ies' : 'y') +
      ' a witness\'s own dated shape (gathered/sweptOn) under a name this file\'s');
    say('discovery rule will never read, because it does not end _WITNESS:');
    for (const m of misnamed) say('    ' + m.name + ' (reckoning.js:' + m.line + ')');
    say('    the naming convention is not a hand-kept list, but it is not exempt from going');
    say('    blind the same way one does — this is that blindness, caught rather than assumed away.');
  }

  if (differed > 0) {
    say('DIFFERS — ' + differed + ' banked number is no longer what the world says. Go now.');
    return 1;
  }
  if (unasked > 0 || outgrown > 0 || misnamed.length > 0) {
    say('HOLES — ' + unasked + ' witness cannot be asked, ' + outgrown + ' has been outgrown, ' +
      misnamed.length + ' misnamed and unseen.');
    say('no banked number moved. This is a standing state and it is named, not an alarm.');
    return 2;
  }
  say('ASKED — every banked number was put back to the world, and the world still agrees.');
  return 0;
}

function main(argv) {
  let listOnly = false;
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') { console.log(USAGE); return 0; }
    else if (arg === '--list') listOnly = true;
    else {
      process.stderr.write('banked: INVALID — ' + arg + '\n' + USAGE + '\n');
      return 3;
    }
  }
  return report(listOnly);
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { witnesses, bornAfter, dateOf };
