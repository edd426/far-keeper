#!/usr/bin/env bash
# tools/place-audit.sh — a row recomputed somewhere it was never reckoned
#
#   ./tools/place-audit.sh            check the working tree
#   ./tools/place-audit.sh /some/tree check another copy of the tower
#
# Built Day 18.
#
# Every entry in reckoning/ledger.json carries the `place` it was reckoned
# for — name, latitude, longitude, zone — and has since the first one, on
# 2026-08-06. Until this morning neither auditor read it. `--verify` here
# and the recompute in reckoning/page.js both said `reckon(date, PARIS)`
# and threw the row's own place on the floor.
#
# Nothing was ever wrong by it. Paris is the only place that has ever been
# in the book, so `entry.place` and `PARIS` have been the same object every
# morning for eighteen days. Ash refused the name I reached for — Day 11's
# *a check that has only ever fired for one cause* — because that fault
# fires and misreads, and this one has never fired at all. Its name is an
# **untested assumption**: the code was asked whether it recomputes a row
# at the place the row names, its documentation answered yes, it did
# something else, and no row was ever put in front of it that could tell
# the two answers apart.
#
# So this file puts one in front of it. The row is *manufactured by the
# instrument* — `reckon(date, ELSEWHERE)`, the same way Day 17 rebuilt
# claim-birthdays.sh's fixture, never hand-typed — because a hand-typed row
# could match or miss for reasons that have nothing to do with the fault.
# And the fixture is asserted to have been built before anything leans on
# it, which is the half of Day 17 that had gone unwatched: a test that
# guards its own breaking and not its own building is watching one end of
# itself.
#
# The sabotage is a one-line substitution putting the old hardcoded PARIS
# back, and it is asserted to have landed (Day 5) before its failure is
# believed. Under it the honest Reykjavík row must be convicted, and — being
# on the method running now — convicted through the *sameMethod* fork, the
# Day 11 forgery sentence, which tells a reader a published number was
# edited. Assert that exact fork rather than "some DRIFTED line appeared":
# an honest row convicted under the wrong fork is a second, quieter fault
# riding along with the first. That precision is Ember's.
#
# What this proves and what it does not (Ash's split, and it is the honest
# half): a scratch row proves the *fix is correct*. Only a morning on which
# this tower actually stands somewhere else, publishes a row there, and has
# it recomputed in a stranger's browser proves the *system works*. That
# second test cannot be manufactured. It has to happen in time.
#
# Nothing here opens the tower's own ledger. Everything runs in a
# `mktemp -d` copy and the real file's bytes are checked at the end anyway,
# because Day 10 was three of us being careful and writing to it regardless.
set -u

SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/tools" "$WORK/reckoning"
cp "$SRC/tools/reckon.js" "$WORK/tools/"
cp "$SRC/reckoning/reckoning.js" "$SRC/reckoning/ledger.json" "$WORK/reckoning/"

REAL_BEFORE="$(sha256sum "$SRC/reckoning/ledger.json" | cut -d' ' -f1)"
PRISTINE="$WORK/pristine.json"
cp "$SRC/reckoning/ledger.json" "$PRISTINE"

fails=0
note() { echo "ok    $1"; }
bad()  { fails=$((fails + 1)); echo "FAIL  $1"; [ -n "${2:-}" ] && echo "$2" | sed 's/^/        /'; }

# ---- the fixture ----------------------------------------------------------
#
# Reykjavík: far enough north and west of Paris that no figure on the row
# could agree by rounding. Not far enough north to reach the polar fold —
# that is a real piece of work and it is not today's, and letting it in here
# would have this file testing two things and proving neither.

ELSEWHERE_NAME="Reykjavik"
LAST_DATE="$(node -e '
const led = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
process.stdout.write(led[led.length - 1].date);
' "$PRISTINE")"

node -e '
const fs = require("fs"), path = require("path");
const [work, pristine, date] = process.argv.slice(1);
const { reckon } = require(path.join(work, "reckoning/reckoning.js"));
const ELSEWHERE = {
  name: "Reykjavik", latitude: 64.1466, longitude: -21.9426, zone: "Atlantic/Reykjavik"
};
const led = JSON.parse(fs.readFileSync(pristine, "utf8"));
const was = led[led.length - 1];
const row = reckon(date, ELSEWHERE);
row.publishedAt = was.publishedAt;
led[led.length - 1] = row;
fs.writeFileSync(path.join(work, "elsewhere.json"), JSON.stringify(led, null, 2) + "\n");
' "$WORK" "$PRISTINE" "$LAST_DATE"

# Assert the fixture got BUILT — not merely that a file exists, and not on
# the strength of a row that was already there. Day 17: the section of
# claim-birthdays.sh that printed `ok` for two days had a fixture identical
# to the pristine ledger and never noticed.
if [ ! -s "$WORK/elsewhere.json" ]; then
  bad "the fixture was not written at all"
elif cmp -s "$PRISTINE" "$WORK/elsewhere.json"; then
  bad "the fixture is byte-identical to the pristine ledger — nothing was spliced"
elif ! grep -q "$ELSEWHERE_NAME" "$WORK/elsewhere.json"; then
  bad "the fixture does not name $ELSEWHERE_NAME"
else
  note "the fixture was built by reckon() and names $ELSEWHERE_NAME on $LAST_DATE"
fi

# And assert the pristine ledger does NOT — so the unbroken case would fail
# this file's own pass rule if the splice ever silently stopped happening.
if grep -q "$ELSEWHERE_NAME" "$PRISTINE"; then
  bad "the real ledger already names $ELSEWHERE_NAME — this fixture proves nothing"
else
  note "the real ledger names no $ELSEWHERE_NAME, so the row under test is the spliced one"
fi

verify_on() { # verify_on <ledger-file> -> prints the tool's whole say
  cp "$1" "$WORK/reckoning/ledger.json"
  (cd "$WORK" && node tools/reckon.js --verify 2>&1)
}

# ---- the tool as it stands: the honest row must be acquitted --------------

OUT="$(verify_on "$WORK/elsewhere.json")"
if echo "$OUT" | grep -q "^reckon: $LAST_DATE unchanged at $ELSEWHERE_NAME"; then
  note "the row is recomputed at the place it names, and stands"
else
  bad "the $ELSEWHERE_NAME row was not reported unchanged at $ELSEWHERE_NAME" \
      "$(echo "$OUT" | grep "$LAST_DATE")"
fi

# The place is inside the verdict, not printed near it: `unchanged` alone
# would claim more than was checked, because the place is an input.
if echo "$OUT" | grep -qE "^reckon: [0-9-]+ unchanged\.$"; then
  bad "a verdict was printed with no place in it"
else
  note "no verdict stands without the place it was recomputed at"
fi

# The three Day 6 rows must still be convicted — the fix must not have made
# the auditor kinder to anything. If reading entry.place quietly acquitted a
# genuinely drifted row, that would be the fix eating the instrument.
D6="$(echo "$OUT" | grep -c 'HAS DRIFTED')"
if [ "$D6" -eq 3 ]; then
  note "the three method-1 rows are still convicted (3 DRIFTED, and no more)"
else
  bad "expected exactly the 3 known method-1 rows to drift, saw $D6"
fi

# ---- the tool as it was: the honest row must be convicted -----------------
#
# The old line, put back by substitution rather than fetched by sha, so this
# case cannot rot when a commit is rewritten or the history is truncated —
# which this sandbox has already done to us once (Day 8).
#
# Day 19 changed what it substitutes *in*. The fault being reproduced is
# "every row recomputed at one fixed place instead of at the place the row
# names", and until this morning the name of that one fixed place in this
# file was `PARIS`, imported straight into `reckon.js`. It no longer is:
# `reckon.js` asks `STANDING.place` now, and `PARIS` is not in its scope at
# all. The old sabotage kept landing in the text and produced a tool that
# would not start.
#
# Which cost this file nothing and taught it something. It asserted that the
# bytes changed — Day 5's rule, honestly kept — and had no way to tell a
# sabotaged tool from a broken one. Every case below it then failed with a
# message blaming the *fixture* while node was printing a module error into
# the same buffer. **A suite that proves its sabotage landed must also prove
# the thing it sabotaged still runs**, or its failures are unreadable exactly
# when they are loudest. So the check under the substitution is no longer
# "did the bytes move" alone; it is "did the bytes move, and does the tool it
# made still answer".

cp "$SRC/tools/reckon.js" "$WORK/tools/reckon.js"
BEFORE_SAB="$(sha256sum "$WORK/tools/reckon.js" | cut -d' ' -f1)"
perl -0pi -e 's/const fresh = reckon\(entry\.date, where\);/const fresh = reckon(entry.date, STANDING.place);/' \
  "$WORK/tools/reckon.js"
AFTER_SAB="$(sha256sum "$WORK/tools/reckon.js" | cut -d' ' -f1)"

SAB_RUNS=1
(cd "$WORK" && node tools/reckon.js --help >/dev/null 2>&1) || SAB_RUNS=0

if [ "$BEFORE_SAB" = "$AFTER_SAB" ]; then
  bad "the sabotage did NOT land — the line it rewrites has moved, and every case below is meaningless"
elif [ "$SAB_RUNS" = "0" ]; then
  bad "the sabotage landed but the tool it made will not run — every case below would blame the fixture" \
      "$(cd "$WORK" && node tools/reckon.js --help 2>&1 | head -4)"
else
  note "the sabotage landed, and the tool it made still runs: --verify recomputes at one fixed place again"

  SAB="$(verify_on "$WORK/elsewhere.json")"

  if echo "$SAB" | grep -q "^reckon: $LAST_DATE HAS DRIFTED"; then
    note "the old tool convicts the honest $ELSEWHERE_NAME row"
  else
    bad "the old tool did not convict the $ELSEWHERE_NAME row — the fixture is not biting"
  fi

  # The fork matters as much as the verdict. The row is on the method
  # running now, so it lands in the sameMethod branch and is told a hand
  # moved a number. That sentence is the cost of the fault, and it is what
  # a stranger would have read.
  # `was` was in this pattern until Day 24, and it is a row *count* wearing
  # a grammar. `reckon.js` writes "it was computed under method 2" for one
  # convicted row and "18 of them were computed under method 2" for many, so
  # the singular matched only while every row in the ledger stood where the
  # tower stands. Rehearsed: in a tower moved to Ushuaia the pinned auditor
  # convicts all 18 method-2 rows, the sentence pluralises, and this case
  # convicts a suite that is right. Day 16's caution, which I wrote: count
  # what the case is actually about, never the container it sits in.
  if echo "$SAB" | grep -qE "computed under method .*, which is the method running now"; then
    note "and hands it the forgery fork — 'there is no method change to blame'"
  else
    bad "the old tool convicted it through the wrong fork" \
        "$(echo "$SAB" | tail -6)"
  fi

  if echo "$SAB" | grep -q 'number was edited after the day'; then
    note "a stranger would have read: a published number was edited after the day"
  else
    bad "the forgery sentence did not appear under the old tool"
  fi
fi

# ---- a row that names no usable place is neither clean nor drifted --------

cp "$SRC/tools/reckon.js" "$WORK/tools/reckon.js"

unplaced_case() { # unplaced_case <label> <node-expression-on-`row`>
  node -e '
const fs = require("fs");
const [pristine, out, expr] = process.argv.slice(1);
const led = JSON.parse(fs.readFileSync(pristine, "utf8"));
const row = led[led.length - 1];
(new Function("row", expr))(row);
fs.writeFileSync(out, JSON.stringify(led, null, 2) + "\n");
' "$PRISTINE" "$WORK/unplaced.json" "$2"
  if cmp -s "$PRISTINE" "$WORK/unplaced.json"; then
    bad "$1: the case did not change the ledger it is named for"
    return
  fi
  local out
  out="$(verify_on "$WORK/unplaced.json")"
  if echo "$out" | grep -q "^reckon: $LAST_DATE UNPLACED"; then
    note "$1"
  else
    bad "$1 — not reported UNPLACED" "$(echo "$out" | grep "$LAST_DATE")"
  fi
}

unplaced_case "a row with no place at all is UNPLACED" 'delete row.place'
unplaced_case "a latitude off the earth is UNPLACED" 'row.place.latitude = 200'
# Day 7: `NaN < min` is false and so is `NaN > max`, so a range check that
# was never asked whether it holds a number is blindest where it looks safest.
unplaced_case "a latitude of NaN is UNPLACED" 'row.place.latitude = 0/0'
unplaced_case "a zone the clock never heard of is UNPLACED" 'row.place.zone = "Mars/Olympus"'

# An UNPLACED row must not be counted among the quiet ones. That is the whole
# rule check-sight.sh learned on Day 2: a tool that cannot see reads as unable
# to see, never as having found nothing wrong.
UNP="$(verify_on "$WORK/unplaced.json")"
if echo "$UNP" | grep -q 'not checked at all'; then
  note "and the summary says plainly that it was not checked at all"
else
  bad "an UNPLACED row was not accounted for in the summary" "$(echo "$UNP" | tail -8)"
fi
if [ "$(cd "$WORK" && node tools/reckon.js --verify >/dev/null 2>&1; echo $?)" = "0" ]; then
  bad "a ledger holding an UNPLACED row exited 0"
else
  note "a ledger holding an UNPLACED row does not exit 0"
fi

# ---- the real ledger's bytes ---------------------------------------------

REAL_AFTER="$(sha256sum "$SRC/reckoning/ledger.json" | cut -d' ' -f1)"
if [ "$REAL_BEFORE" = "$REAL_AFTER" ]; then
  note "the tower's own ledger was not touched"
else
  bad "THE TOWER'S OWN LEDGER CHANGED during this run"
fi

echo
if [ "$fails" -eq 0 ]; then
  echo "place-audit: all cases passed."
  echo "place-audit: this proves the fix is correct. It does not prove the system"
  echo "place-audit: works — only a morning when this tower really stands elsewhere"
  echo "place-audit: can do that, and that test cannot be manufactured."
  exit 0
fi
echo "place-audit: $fails case(s) failed."
exit 1
