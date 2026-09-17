#!/usr/bin/env node
'use strict';
//
// The doors — Day 45.
//
//   node tools/doors.js            the wiring, traced from the locked routine
//   node tools/doors.js --help     the whole surface, in one line
//
// **The question, and it is one question.** For every file in `tools/`, is
// there a path from the locked routine to it? The locked routine is
// `.claude/commands/daily.md` and `scripts/**` — locked by Article I, so
// they are the only wiring in this house a keeper cannot quietly drop on a
// morning he is busy. Everything else that says when a tool should run is
// prose: a line in `CLAUDE.md`, a standing caution in `COMMONPLACE.md`, a
// habit. This house has written down three times that **a door I hold in
// the morning read is still weaker than a step in the routine**, and has
// never once counted which tools have which.
//
// **The two locks, which are Ash's and are the reason this file is narrow.**
// An *appointment* is a sentence saying when a tool should be asked.
// *Reachable* is whether the wiring actually touches it. They are not one
// thing: `nav-agrees.js` has an appointment — built ahead of a room nobody
// has built yet, so that five of six edits cannot pass — and is reachable
// only through `nav-breaks.sh`, inside the Sunday rehearsal. Five days a
// week the appointment says ask and nothing asks. A door with two locks and
// only one of them working.
//
// **This file answers the second lock only, and says so on its face.** It
// does not read cadence. Cadence lives in prose, and Day 35's rule is that
// a sweep over prose cannot tell an assertion from a quotation of one being
// corrected — so a tool that tried to read *every morning* or *before every
// Friday's choice* off this house's own paragraphs would be reporting its
// own reading as a measurement. It names the carrier and stops there. A
// reader who sees thirty-odd files hanging off `move-rehearsal.sh` knows
// what Sunday means without this tool asserting a schedule it cannot check.
// Ember's pair, which is the same cut from the other side: an *appointment*
// is `ad punctum`, a fixed point; an *opportunity* is `ob portus`, a
// harbour you reach when the tide happens to be right. Nearly everything
// here runs on the harbour.
//
// **The edge that nearly made me publish a false alarm.** A plain text
// closure over `tools/` comes back with one orphan. It is very nearly
// right, and it is right by luck: **a text scan cannot see a call whose
// target is computed.** `banked.js` resolves its gatherers out of a
// witness's own field at run time; `move-rehearsal.sh` builds its case
// list by globbing `tools/` and asking each `.js` whether it reads
// `FAR_KEEPER_URL`. Grep either and it calls nothing at all. Believe the
// grep and thirty-odd files are orphans that are not — a manufactured
// diagnosis, which is the one thing Day 21 says a check must never do.
//
// So an edge is found two ways, and the two are kept apart in the report:
//
//   CALLED — a line of A's *code* invokes `tools/B`.
//   ASKED  — A was run with `--list` and told us, which is Day 43's rule
//            (ask the gatherer by running it, never read the field) turned
//            round to point at the wiring instead of at a number.
//
// **A mention is not a call, and the first version of this file did not
// know that.** It counted any `tools/B` anywhere in A's text, and its very
// first run reported `doors.js` as CARRIED BY `move-rehearsal.sh` — on the
// strength of a comment I had written in `move-rehearsal.sh` forty minutes
// earlier saying that this file asks it for a list. A paragraph about the
// wiring was read as the wiring. Three sections further down the same
// report said, correctly, that `doors.js` is reached by nothing; the tool
// contradicted itself inside one page and I would have shipped it if it had
// contradicted itself about any file but this one.
//
// That is Day 35's rule arriving in new clothes — **a text sweep cannot
// tell an assertion from a quotation of one** — and Day 11's cure is the
// one that applies: do not let one word do two jobs. A call and a mention
// are different things and the report forks them. A name found only on a
// comment line is **MENTIONED**, and a mention is not an edge; it is listed
// where a reader can see it and it carries nothing.
//
// **The fork errs toward inventing a hole rather than hiding one**, which
// is the direction Day 9 settled: of the two ways a checker can lie, the
// one that invents an alarm is the safe one. A missed call shows up as a
// tool with no door — loud, and checkable in a second by a keeper who
// knows better. A mention read as a call makes a hole vanish, and nothing
// prompts anybody to doubt a tool that says WIRED. So a code line must
// also carry an invoking token (`node`, `bash`, `sh`, `./`, `require`,
// `spawn`, `exec`) before its name counts, and the names that fall out are
// printed rather than dropped.
//
// **Which tools get asked is not a list kept in here.** A list kept here
// goes blind to the next tool that computes its calls and reports that
// blindness as clean — twice bitten already (Days 29, 30). The rule is
// `banked.js`'s own: a tool that resolves its calls at run time **says so
// on its own face**, by carrying its own name and `--list` on one line, in
// a usage line or a header recipe. The naming rule is the claim. It is
// smaller than a hand-kept list, not absent, and that is worth saying
// rather than pretending otherwise.
//
// A tool that is asked is run with its own name and `--list` and nothing
// else, under a hard kill. `spawnSync`'s `timeout` is no bound on its own,
// because SIGTERM can be trapped and ignored — Ember's find on Day 43,
// against this same shape of door.
//
// **The limit, printed and not implied.** A tool that computes a call and
// offers no `--list` is invisible here. Its callees come back with no edge
// — and an absence is not a finding. This file cannot tell you that such a
// tool does not exist; it can only tell you it saw none.
//
// **The exit codes, and one of them is deliberately unspent.**
//
//   0  every file in tools/ is reachable from the locked routine.
//   2  at least one is not — a standing hole, named rather than tolerated.
//   3  a bad flag, so a typo spends neither of the above.
//
// **1 is unspent and must stay so.** This file has no verdict that
// convicts. Whether a tool *ought* to have a door is a judgement it does
// not make: `check-sight.sh` is reachable and abstains every rehearsal run,
// which is correct; a break-suite reached only on Sundays may be exactly
// right. Ember's Day 40 caution decides it — an alarm that is on every
// morning is an alarm a keeper stops reading, and this file is nonzero on
// its first run. Evidence, not a verdict. If a later hand wires a
// judgement in, it may have 1, and `doors-breaks.sh` case 9 goes red the
// moment it does.
//
// **And this file's own door is printed rather than claimed.** The first
// draft of this header said it is reached by nothing. That was true for
// about an hour and then `doors-breaks.sh` was written, which runs it, and
// the Sunday rehearsal walks every shell suite — so this file now hangs off
// the same weekly door it reports thirty-odd others hanging off. The
// sentence was overtaken by the record while the ink was wet, in the one
// file whose whole subject is which tools anything reaches. So the report
// reads its own verdict off its own trace and prints that instead.
//
// What survives the correction is Ash's question, passed on rather than
// answered: a tool that finds tools with a five-day blind spell has one,
// and `daily.md` is locked to the founder, so cutting a daily door is not
// the keeper's act. That is a founder-facing report, not a shrug.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const USAGE = 'usage: doors.js [--help]';

// The locked set, as Article I draws it. `.github/**` is locked too and is
// deliberately not here: it runs the deploy and the camera, not the
// battery, and a workflow naming a tool would be a door of a different
// kind. Nothing there names one today; that is a fact about today and this
// file would show it moving.
const ROUTINE_FILES = ['.claude/commands/daily.md'];
const ROUTINE_DIRS = ['scripts'];

function listTools(root) {
  return fs
    .readdirSync(path.join(root, 'tools'))
    .filter((name) => /\.(js|sh)$/.test(name))
    .sort();
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (err) {
    return null;
  }
}

// Every `tools/<name>` a text mentions, whether or not such a file exists.
// The second half matters: the routine names `tools/test.js` inside a usage
// illustration, and a checker that quietly dropped the ones it could not
// resolve would never show that.
function namesInText(text) {
  const found = new Set();
  const re = /tools\/([A-Za-z0-9_.-]+\.(?:js|sh))/g;
  let m;
  while ((m = re.exec(text)) !== null) found.add(m[1]);
  return found;
}

const COMMENT = /^\s*(#|\/\/|\/\*|\*)/;
const INVOKES = /(\bnode\b|\bbash\b|\bsh\b|\.\/|\brequire\b|\bspawn|\bexec\b|\bsource\b)/;

// A line invokes a tool when it is not a comment AND it carries something
// that runs or loads a file. Both halves are needed and each was measured
// rather than guessed: without the comment test, `move-rehearsal.sh`'s new
// header paragraph about this very file became an edge; without the
// invoking token, a `usage:` string listing a sibling tool becomes one.
function splitNames(text) {
  const called = new Set();
  const mentioned = new Set();
  for (const line of text.split('\n')) {
    const names = namesInText(line);
    if (names.size === 0) continue;
    const isCall = !COMMENT.test(line) && INVOKES.test(line);
    for (const n of names) (isCall ? called : mentioned).add(n);
  }
  for (const n of called) mentioned.delete(n);
  return { called, mentioned };
}

// **The self-declaration rule.** A tool advertises `--list` by carrying its
// own basename and `--list` on one line — a usage line, or a recipe in its
// own header. That is what tells `banked.js`'s own usage line apart from
// `banked-breaks.sh`, which names `banked.js --list` all over itself while
// supporting no such flag and taking twenty seconds to say so.
function advertisesList(name, text) {
  return text
    .split('\n')
    .some((line) => line.includes(name) && line.includes('--list'));
}

function askForList(root, name) {
  const isShell = name.endsWith('.sh');
  const file = path.join(root, 'tools', name);
  const res = spawnSync(isShell ? 'bash' : 'node', [file, '--list'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
    killSignal: 'SIGKILL',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (res.error || res.status !== 0) {
    return { ok: false, why: res.error ? String(res.error.code || res.error.message) : 'exit ' + res.status };
  }
  return { ok: true, out: (res.stdout || '') + (res.stderr || '') };
}

// A tool's own answer names its callees either as `tools/<name>` or, where
// it is printing a case list, as bare basenames. Both are matched against
// the directory, so nothing in the prose around them can invent a tool.
function namesInAnswer(out, tools) {
  const found = new Set();
  for (const name of tools) {
    // The left boundary must let `/` through: a tool answering with
    // `tools/cross-check-sweep.js` is the commonest shape there is, and an
    // earlier draft excluded `/` on both sides, so `banked.js --list` named
    // its three gatherers and this file matched none of them — reporting
    // three carried files as orphans while the answer naming them sat in
    // the buffer. A boundary written to stop a partial match stopped the
    // whole match.
    const re = new RegExp('(^|[^A-Za-z0-9_.\\-])' + name.replace(/\./g, '\\.') + '($|[^A-Za-z0-9_.\\-])');
    if (re.test(out)) found.add(name);
  }
  return found;
}

function main(argv) {
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      return 0;
    }
    console.error("doors: INVALID — unknown argument '" + arg + "'");
    console.error(USAGE);
    return 3;
  }

  const root = path.resolve(__dirname, '..');
  const say = (s) => console.log(s === '' ? 'doors:' : 'doors: ' + s);

  const tools = listTools(root);
  const self = path.basename(__filename);

  // ---- the roots: what the locked routine names ----
  const routineSources = [];
  for (const f of ROUTINE_FILES) routineSources.push(f);
  for (const d of ROUTINE_DIRS) {
    let entries = [];
    try {
      entries = fs.readdirSync(path.join(root, d));
    } catch (err) {
      entries = [];
    }
    for (const e of entries.sort()) {
      const rel = path.join(d, e);
      if (fs.statSync(path.join(root, rel)).isFile()) routineSources.push(rel);
    }
  }

  const rootOf = new Map(); // tool -> the routine file that names it
  const namedButAbsent = new Map(); // name -> routine file
  const routineMentions = new Map(); // tool -> routine file, named but not invoked
  for (const rel of routineSources) {
    const text = readText(path.join(root, rel));
    if (text === null) continue;
    const { called, mentioned } = splitNames(text);
    for (const name of called) {
      if (tools.includes(name)) {
        if (!rootOf.has(name)) rootOf.set(name, rel);
      } else if (!namedButAbsent.has(name)) {
        namedButAbsent.set(name, rel);
      }
    }
    for (const name of mentioned) {
      if (tools.includes(name)) {
        if (!routineMentions.has(name)) routineMentions.set(name, rel);
      } else if (!namedButAbsent.has(name)) {
        namedButAbsent.set(name, rel);
      }
    }
  }

  if (rootOf.size === 0) {
    say('UNCLEAR — the locked routine names no tool at all. Either this is not');
    say('a tower or the routine moved; nothing below would mean anything.');
    return 2;
  }

  // ---- the edges ----
  const askedTools = [];
  const askFailed = [];
  const edges = new Map(); // tool -> Map(callee -> 'CALLED' | 'ASKED')
  const mentionsOnly = new Map(); // tool -> [names it names but does not call]

  for (const name of tools) {
    const text = readText(path.join(root, 'tools', name));
    if (text === null) continue;
    const out = new Map();
    const { called, mentioned } = splitNames(text);
    for (const callee of called) {
      if (callee !== name && tools.includes(callee)) out.set(callee, 'CALLED');
    }
    const bare = [...mentioned].filter((c) => c !== name && tools.includes(c) && !out.has(c));
    if (bare.length) mentionsOnly.set(name, bare.sort());
    if (advertisesList(name, text)) {
      const answer = askForList(root, name);
      if (answer.ok) {
        askedTools.push(name);
        for (const callee of namesInAnswer(answer.out, tools)) {
          if (callee !== name && !out.has(callee)) out.set(callee, 'ASKED');
        }
      } else {
        askFailed.push(name + ' (' + answer.why + ')');
      }
    }
    edges.set(name, out);
  }

  // ---- the trace ----
  const parent = new Map(); // tool -> the tool that carries it (null at a door)
  const how = new Map(); // tool -> 'WRITTEN' | 'ASKED' for the edge that reached it
  const queue = [];
  for (const name of [...rootOf.keys()].sort()) {
    parent.set(name, null);
    queue.push(name);
  }
  while (queue.length) {
    const here = queue.shift();
    for (const [callee, kind] of edges.get(here) || []) {
      if (parent.has(callee)) continue;
      parent.set(callee, here);
      how.set(callee, kind);
      queue.push(callee);
    }
  }

  const chainOf = (name) => {
    const chain = [name];
    let at = name;
    while (parent.get(at)) {
      at = parent.get(at);
      chain.push(at);
    }
    return chain;
  };

  const atDoor = tools.filter((t) => parent.has(t) && parent.get(t) === null);
  const carried = tools.filter((t) => parent.has(t) && parent.get(t) !== null);
  const noDoor = tools.filter((t) => !parent.has(t));

  // ---- the report ----
  say('the wiring of ' + root + ', traced ' + new Date().toISOString().slice(0, 10) + '.');
  say('');
  say('It asks one question of each file in tools/: can the LOCKED routine');
  say('reach it? Locked means Article I — .claude/commands/daily.md and');
  say('scripts/**, the wiring a keeper cannot quietly drop. A tool named only');
  say('in CLAUDE.md or in a standing caution is not reached by anything here;');
  say('it runs when somebody remembers, and that is what this counts.');
  say('');

  say('AT THE DOOR — the locked routine names these itself (' + atDoor.length + ')');
  for (const t of atDoor) say('  ' + t.padEnd(26) + rootOf.get(t));
  say('');

  say('CARRIED — reached only through another tool (' + carried.length + ')');
  for (const t of carried) {
    const chain = chainOf(t);
    say('  ' + t.padEnd(26) + chain.slice(1).join(' <- ') + '   [' + how.get(t) + ']');
  }
  say('');

  say('NO DOOR — nothing in the locked routine reaches these (' + noDoor.length + ')');
  if (noDoor.length === 0) {
    say('  none.');
  } else {
    for (const t of noDoor) say('  ' + t);
  }
  say('');

  // **The count is computed every run and never typed.** The sentence it
  // replaces is exactly the kind that goes stale while nobody looks — this
  // house has a name for that (the told book) and has caught it three
  // times. A measurement prints what it found and when; a told book claims
  // to be still true when nobody is looking.
  const load = new Map();
  for (const t of carried) {
    const first = chainOf(t).slice(-1)[0];
    load.set(first, (load.get(first) || 0) + 1);
  }
  say('WHAT CARRIES WHAT — every count below is counted on this run.');
  for (const [door, n] of [...load.entries()].sort((a, b) => b[1] - a[1])) {
    say('  ' + door.padEnd(26) + 'carries ' + n + ' of the ' + tools.length + ' files in tools/');
  }
  say('');

  const mentionRows = [];
  for (const [t, names] of [...mentionsOnly.entries()].sort()) {
    mentionRows.push('  ' + t.padEnd(26) + 'names ' + names.join(', '));
  }
  for (const [t, where] of [...routineMentions.entries()].sort()) {
    mentionRows.push('  ' + where.padEnd(26) + 'names ' + t);
  }
  say('NAMED BUT NOT CALLED — a mention is prose, and carries nothing (' + mentionRows.length + ')');
  if (mentionRows.length === 0) {
    say('  none. Nothing in this tree names a tool it does not invoke, which is');
    say('  an empty domain on this run and not a check that fired.');
  } else {
    for (const r of mentionRows) say(r);
    say('  These are comments and strings about the wiring, not the wiring. The');
    say('  first draft of this file counted them and reported itself as wired on');
    say('  the strength of a paragraph describing it.');
  }
  say('');

  say('HOW THE EDGES WERE FOUND');
  say('  asked (run with --list, and answered): ' + (askedTools.join(', ') || 'none'));
  const onlyAsked = carried.filter((t) => how.get(t) === 'ASKED');
  if (onlyAsked.length === 0) {
    say('  no tool is reached by an ASKED edge alone. That is an empty domain on');
    say('  this tree, said rather than left to read as a pass: the asking cost');
    say('  nothing and proved nothing here.');
  } else {
    say('  ' + onlyAsked.length + ' of the ' + carried.length + ' carried files are reached by an ASKED edge and by no');
    say('  written one. A text scan alone would call every one of them an orphan.');
  }
  if (askFailed.length) {
    say('  asked and could not answer: ' + askFailed.join(', '));
    say('  those are holes in this run, not clean bills for what they call.');
  }
  say('');

  if (namedButAbsent.size) {
    say('NAMED BY THE ROUTINE, NOT IN tools/');
    for (const [name, where] of namedButAbsent) say('  ' + name.padEnd(26) + where);
    say('  This run does not convict the routine for these. A name in prose may');
    say('  be a call or an illustration, and nothing here can tell those apart');
    say('  (Day 35). It is reported and it spends no exit code.');
    say('');
  }

  say('WHAT THIS CANNOT SEE');
  say('  A tool that computes a call and offers no --list is invisible here:');
  say('  its callees come back with no edge, and an absence is not a finding.');
  say('  This says it saw none, never that none exists.');
  say('  It reads reachability and not cadence. A tool AT THE DOOR may still');
  say('  be asked once a week; a tool CARRIED by the Sunday rehearsal has a');
  say('  five-day blind spell this file does not measure and does not claim to.');
  // **This line is read off the trace and never typed**, and the reason is
  // an hour old. The header of this file said, in its first draft, that
  // `doors.js` is reached by nothing — true when it was written and false
  // within the hour, because `doors-breaks.sh` runs it and the Sunday
  // rehearsal runs every shell suite. A sentence about the record, written
  // from the study, overtaken by the record while the ink was wet. The told
  // book, born in front of me, in the one file whose whole subject is which
  // tools anything reaches.
  const selfWhere = !parent.has(self)
    ? 'reached by nothing in the locked routine'
    : parent.get(self) === null
      ? 'named by ' + rootOf.get(self)
      : 'carried by ' + chainOf(self).slice(1).join(' <- ');
  say('  And ' + self + ' is ' + selfWhere + ' — its own verdict, taken');
  say('  off the trace above rather than typed here, because a file that');
  say('  says which tools are reached must not assert its own from memory.');
  say('');

  if (noDoor.length) {
    say('HOLES — ' + noDoor.length + ' file(s) in tools/ that the locked routine cannot reach.');
    say('Named, not tolerated. This is the expected state until a door is cut,');
    say('and daily.md is locked, so cutting one is the founder\'s act.');
    return 2;
  }
  say('WIRED — every file in tools/ is reachable from the locked routine.');
  return 0;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { main };
