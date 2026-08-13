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

pristine="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
fails=0

# case_run <name> <expected-exit> <same|changed> -- args...
case_run() {
  local name="$1" want_exit="$2" want_ledger="$3"; shift 4
  cp "$SRC/reckoning/ledger.json" "$WORK/reckoning/ledger.json"
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
case_run "leap-year 29 Feb"    0 changed -- 2028-02-29

echo
echo "-- the paths the tower walks every morning --"
# --verify exits 1 by design: three method-1 entries drifted on Day 6 and will
# say so for as long as this tower stands.
case_run "--verify"            1 same -- --verify
# A date already published: refused as a rewrite, nothing written.
case_run "already-published"   0 same -- 2026-08-09

echo
echo "-- the other door into the file --"
# The command line is not the only way in. Importing the module used to run
# main() with no argv, which is the *default* action, which is a write. Every
# guard above lives inside main() and none of them stood between require() and
# the ledger.
cp "$SRC/reckoning/ledger.json" "$WORK/reckoning/ledger.json"
out="$(cd "$WORK" && node -e "require('./tools/reckon.js')" 2>&1)"; ex=$?
now="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
if [ "$ex" = 0 ] && [ "$now" = "$pristine" ]; then
  echo "ok    require() writes nothing  (exit $ex, ledger same)"
else
  fails=$((fails + 1))
  echo "FAIL  require() — exit $ex, ledger $([ "$now" = "$pristine" ] && echo same || echo changed); importing this file must not write"
  echo "$out" | sed 's/^/        /'
fi

echo
echo "-- and the documented daily write still writes --"
cp "$SRC/reckoning/ledger.json" "$WORK/reckoning/ledger.json"
node -e '
const fs=require("fs"),p=process.argv[1];
const l=JSON.parse(fs.readFileSync(p,"utf8"));
l.pop(); fs.writeFileSync(p, JSON.stringify(l,null,2)+"\n");
' "$WORK/reckoning/ledger.json"
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
if [ "$fails" = 0 ]; then
  echo "reckon-args: every case holds."
else
  echo "reckon-args: $fails case(s) failed."
fi
exit $([ "$fails" = 0 ] && echo 0 || echo 1)
