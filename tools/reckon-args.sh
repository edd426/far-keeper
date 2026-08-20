#!/usr/bin/env bash
# tools/reckon-args.sh — walk the whole surface `tools/reckon.js` meets, and
# after every case ask the only question that matters about a tool whose
# default action is a write to a cold record: *did it write, and was it
# asked to?*
#
#   ./tools/reckon-args.sh            check the working tree's reckon.js
#   ./tools/reckon-args.sh /some/tree check another copy of the tower
#
# Two rules are built into the shape of this file, and both were paid for on
# Day 10.
#
# **It never opens the real ledger.** Every case runs against a copy of the
# tower in a `mktemp -d`. On the morning this was written, three of us —
# keeper and both spirits — tested a write-tool by running it, with its
# default action, against the record it writes to. Four entries went into
# `reckoning/ledger.json` that were not the tower's, three of them real days
# that were never a morning here, stamped with today's hour. They came out
# again only because nothing had been committed yet. Nobody was careless.
# That is simply what checking looks like when the test shares a desk with the
# thing at risk, and the remedy is a different desk, not more care.
#
# **The case list comes from the tool's surface, not from a story about a
# fault.** The first guard written this morning was tested against the four
# cases named in the report of the bug, passed all four, and had four more
# holes in it. A test drawn from the report can only re-close the report: it
# inherits the route the finder happened to walk. So the sections below go at
# argv as a thing — words the tool doesn't know, actions combined, arguments
# repeated, dates that are only date-shaped — and at the doors into the file,
# of which the command line is one and `require()` is the other.
set -u

SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/tools" "$WORK/reckoning"
cp "$SRC/tools/reckon.js" "$WORK/tools/"
cp "$SRC/reckoning/reckoning.js" "$SRC/reckoning/ledger.json" "$WORK/reckoning/"

# Every case is seeded from SEED and compared against SEED_HASH. It is the
# real ledger for almost all of them — but two cases below are about writing
# TODAY's row, and the real ledger contains today's row from the moment the
# morning's routine runs `reckon.js`. Written at first light those two cases
# passed; run again an hour later, after the day's own entry landed, they went
# red — for a reason that has nothing to do with the tool. That is the fourth
# time in five days a red case here has been my expectation rather than the
# code's, and the same shape as Day 16's: a case whose precondition the day
# itself quietly changes underneath it. So they seed from a ledger with today
# taken out, and say so.
SEED="$SRC/reckoning/ledger.json"
SEED_HASH="$(sha256sum "$SEED" | cut -d' ' -f1)"
pristine="$SEED_HASH"
fails=0

# case_run <name> <expected-exit> <same|changed> -- args...
case_run() {
  local name="$1" want_exit="$2" want_ledger="$3"; shift 4
  pristine="$SEED_HASH"
  cp "$SEED" "$WORK/reckoning/ledger.json"
  local out; out="$(cd "$WORK" && node tools/reckon.js "$@" 2>&1)"; local got_exit=$?
  local now; now="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
  local got_ledger="same"; [ "$now" = "$pristine" ] || got_ledger="changed"

  local bad=""
  [ "$got_exit" = "$want_exit" ] || bad="exit $got_exit, wanted $want_exit"
  [ "$got_ledger" = "$want_ledger" ] || bad="${bad:+$bad; }ledger $got_ledger, wanted $want_ledger"

  if [ -n "$bad" ]; then
    fails=$((fails + 1))
    echo "FAIL  $name — $bad"
    echo "$out" | sed 's/^/        /'
  else
    echo "ok    $name  (exit $got_exit, ledger $got_ledger)"
  fi
}

echo "-- a word the tool does not know is not consent --"
case_run "unknown flag"        2 same -- --wibble
case_run "bare word"           2 same -- verify
case_run "empty string"        2 same -- ""
case_run "near-miss flag"      2 same -- --verifyy

echo
echo "-- --help is a question, not an instruction to write --"
case_run "--help"              0 same -- --help
case_run "-h"                  0 same -- -h

echo
echo "-- one action, one date, and nothing discarded in silence --"
case_run "two dates"           2 same -- 2026-08-06 2026-08-07
case_run "date with junk"      2 same -- 2026-08-06 --wibble
case_run "--verify plus junk"  2 same -- --verify --wibble
case_run "--verify plus date"  2 same -- --verify 2026-08-06

echo
echo "-- a date-shaped string is not a date --"
# The regex knew the shape of a date. It did not know what February is. A
# fiction written here never comes out, and --verify would recompute it every
# morning after and report that it holds.
case_run "31st of February"    2 same -- 2026-02-30
case_run "thirteenth month"    2 same -- 2026-13-45
case_run "month zero"          2 same -- 2026-00-10
case_run "day zero"            2 same -- 2026-08-00
case_run "32nd of August"      2 same -- 2026-08-32
case_run "non-leap 29 Feb"     2 same -- 2027-02-29
# 2028-02-29 IS a real day, so it clears isCalendarDate — and is refused one
# guard further along, by the gate below, for a different reason entirely.
# This case stood here as `0 changed` — asserting that a leap day eighteen
# months out MUST be written — green every morning from Day 10 to Day 17,
# in the same file whose header says the case list must come from the tool's
# surface and not from a story about a fault. It did come from the surface.
# What it had no opinion about was whether the surface was right.
case_run "leap-year 29 Feb"    2 same -- 2028-02-29

echo
echo "-- a real day that is not today is not this tool's to write --"
# Day 17. Every figure in such a row would be correct arithmetic; what is
# false is the account of when this tower spoke, and no recompute can catch
# that, because the numbers are right. Three of these four dates are the
# ones that actually went into the ledger on Day 10 — and note that only
# ONE of them is in the future. The book called this hole "no future-date
# gate", which would have caught that one and waved the rest through.
TODAY="$(node -e "process.stdout.write(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()))")"
case_run "far future"          2 same -- 2026-12-31
case_run "before the tower"    2 same -- 2024-02-29
case_run "a past real day"     2 same -- 2026-01-15
case_run "yesterday"           2 same -- "$(node -e "
  const d=new Date(Date.parse(process.argv[1]+'T12:00:00Z')-86400000);
  process.stdout.write(d.toISOString().slice(0,10));" "$TODAY")"
# And today, named out loud, is accepted: the gate refuses a claim, not the
# habit of saying which day you think it is. Seeded from a ledger with today
# removed — otherwise this case tests the never-rewrite branch instead, and
# does so without saying it changed the subject.
node -e '
const fs=require("fs");
const l=JSON.parse(fs.readFileSync(process.argv[1],"utf8")).filter(e=>e.date!==process.argv[2]);
fs.writeFileSync(process.argv[3], JSON.stringify(l,null,2)+"\n");
' "$SRC/reckoning/ledger.json" "$TODAY" "$WORK/no-today.json"
if node -e '
const l=require(process.argv[1]);
process.exit(l.some(e=>e.date===process.argv[2]) ? 1 : 0);
' "$WORK/no-today.json" "$TODAY"; then
  :
else
  fails=$((fails + 1))
  echo "FAIL  setup — could not build a ledger without today's row; the two cases below prove nothing"
fi
SEED="$WORK/no-today.json"
SEED_HASH="$(sha256sum "$SEED" | cut -d' ' -f1)"
case_run "today, named"        0 changed -- "$TODAY"
SEED="$SRC/reckoning/ledger.json"
SEED_HASH="$(sha256sum "$SEED" | cut -d' ' -f1)"

echo
echo "-- the paths the tower walks every morning --"
# --verify exits 1 by design: three method-1 entries drifted on Day 6 and will
# say so for as long as this tower stands.
case_run "--verify"            1 same -- --verify

echo
echo "-- the other door into the file --"
# The command line is not the only way in. Importing the module used to run
# main() with no argv, which is the *default* action, which is a write. Every
# guard above lives inside main() and none of them stood between require() and
# the ledger.
cp "$SRC/reckoning/ledger.json" "$WORK/reckoning/ledger.json"
before="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
out="$(cd "$WORK" && node -e "require('./tools/reckon.js')" 2>&1)"; ex=$?
now="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
if [ "$ex" = 0 ] && [ "$now" = "$before" ]; then
  echo "ok    require() writes nothing  (exit $ex, ledger same)"
else
  fails=$((fails + 1))
  echo "FAIL  require() — exit $ex, ledger $([ "$now" = "$before" ] && echo same || echo changed); importing this file must not write"
  echo "$out" | sed 's/^/        /'
fi

echo
echo "-- and the documented daily write still writes --"
# Seeded from a ledger with today taken out — a bare run's whole job is to
# write today, and it cannot do that against a book that already holds it.
cp "$WORK/no-today.json" "$WORK/reckoning/ledger.json"
short="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
out="$(cd "$WORK" && node tools/reckon.js 2>&1)"; ex=$?
now="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
if [ "$ex" = 0 ] && [ "$now" != "$short" ]; then
  echo "ok    bare run  (exit 0, ledger changed)"
else
  fails=$((fails + 1))
  echo "FAIL  bare run — exit $ex, ledger $([ "$now" = "$short" ] && echo same || echo changed)"
  echo "$out" | sed 's/^/        /'
fi

echo
echo "-- and a day already reckoned is never reckoned twice --"
# This used to be `case_run "already-published" 0 same -- 2026-08-09`: hand
# the tool a date the ledger already holds and watch it refuse to rewrite.
# The gate above closed that door — a past date never reaches the ledger now
# — and closing it would have taken the only test of the never-rewrite rule
# with it, silently, leaving a green suite over the very rule the ledger
# exists for. **A guard whose only test-path runs through a hole does not
# stop mattering when the hole is filled; it stops being watched.** So the
# same branch is reached the way a keeper reaches it: two bare runs in one
# morning, which is exactly what a re-run of the routine looks like.
cp "$WORK/no-today.json" "$WORK/reckoning/ledger.json"
seeded="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
(cd "$WORK" && node tools/reckon.js >/dev/null 2>&1)
once="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
if [ "$once" = "$seeded" ]; then
  fails=$((fails + 1))
  echo "FAIL  setup — the first bare run wrote nothing, so nothing below is a test of anything"
else
  out="$(cd "$WORK" && node tools/reckon.js 2>&1)"; ex=$?
  twice="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
  if [ "$ex" = 0 ] && [ "$twice" = "$once" ] && echo "$out" | grep -q 'Not rewriting it'; then
    echo "ok    second bare run  (exit $ex, ledger untouched, refused as a rewrite)"
  else
    fails=$((fails + 1))
    echo "FAIL  second bare run — exit $ex, ledger $([ "$twice" = "$once" ] && echo same || echo CHANGED)"
    echo "$out" | sed 's/^/        /'
  fi
fi

echo
if [ "$fails" = 0 ]; then
  echo "reckon-args: every case holds."
else
  echo "reckon-args: $fails case(s) failed."
fi
exit $([ "$fails" = 0 ] && echo 0 || echo 1)
