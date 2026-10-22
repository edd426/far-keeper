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
# believed. Under it the honest elsewhere-row must be convicted, and — being
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
# The elsewhere-place is ASKED, never typed (Day 80). Until this morning it
# was Reykjavík, typed here on Day 18 as a place "far enough north and west
# of Paris that no figure on the row could agree by rounding". On 2026-10-18
# the tower moved to Reykjavik. From that morning the fixture was a row at
# the place the tower stands, so the sabotage — recompute every row where the
# tower stands — recomputed it at its own place and could not convict it, and
# the real ledger began to name the fixture's city. Three cases went red
# about the fixture, not the auditor, and nothing daily runs this file. A
# place typed beside a tower that moves every Sunday is next week's weather.
#
# So the place is read off the cold record, which only gains rows: the oldest
# place the ledger names that is not where the tower stands now, and that is
# lit on the date the row claims (a dark row is a different test — the polar
# fold — and letting it in here would have this file testing two things and
# proving neither). Under "no city twice" that is Paris for as long as the
# tower stands anywhere but Paris, because the ledger's oldest row is Paris
# and the ledger is never rewritten. If no such place exists the first case
# says so and the cases that lean on the splice go red with it: loud, rather
# than quietly testing the tower against itself.
#
# And the property the old fixture lost is now asserted, not assumed: the
# elsewhere-place is not the standing place. By its logic it would have gone
# red on the eighteenth, about the right thing (reasoned, not run on that
# date; the Paris-moved scratch run on Day 80 is what was run).

LAST_DATE="$(node -e '
const path = require("path");
const R = require(path.join(process.argv[1], "reckoning/reckoning.js"));
process.stdout.write(R.todayAt(R.STANDING.place.zone));
' "$WORK")"
PRISTINE_LAST_DATE="$(node -e '
const led = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
process.stdout.write(led[led.length - 1].date);
' "$PRISTINE")"

ELSEWHERE_NAME="$(node -e '
const fs = require("fs"), path = require("path");
const [work, pristine, date] = process.argv.slice(1);
const R = require(path.join(work, "reckoning/reckoning.js"));
const led = JSON.parse(fs.readFileSync(pristine, "utf8"));
for (const row of led) {
  const p = row.place;
  if (!p || R.samePlace(p, R.STANDING.place)) continue;
  let lit = false;
  try { lit = typeof R.reckon(date, p).sunrise === "string"; } catch (e) { lit = false; }
  if (!lit) continue;
  const was = led[led.length - 1];
  const fresh = R.reckon(date, p);
  fresh.publishedAt = was.publishedAt;
  led[led.length - 1] = fresh;
  fs.writeFileSync(path.join(work, "elsewhere.json"), JSON.stringify(led, null, 2) + "\n");
  // The sabotage run reads a book holding this one row and nothing else, so
  // the summary under it can only be about this row (see below).
  fs.writeFileSync(path.join(work, "elsewhere-alone.json"), JSON.stringify([fresh], null, 2) + "\n");
  process.stdout.write(p.name);
  process.exit(0);
}
' "$WORK" "$PRISTINE" "$LAST_DATE")"

STANDING_NAME="$(node -e '
const R = require(require("path").join(process.argv[1], "reckoning/reckoning.js"));
process.stdout.write(R.STANDING.place.name);
' "$WORK")"

# Assert the fixture got BUILT — not merely that a file exists, and not on
# the strength of a row that was already there. Day 17: the section of
# claim-birthdays.sh that printed `ok` for two days had a fixture identical
# to the pristine ledger and never noticed.
if [ -z "$ELSEWHERE_NAME" ]; then
  bad "the ledger names no lit place but where the tower stands — there is nothing to splice, and every case below is void"
elif [ ! -s "$WORK/elsewhere.json" ]; then
  bad "the fixture was not written at all"
elif cmp -s "$PRISTINE" "$WORK/elsewhere.json"; then
  bad "the fixture is byte-identical to the pristine ledger — nothing was spliced"
else
  note "the fixture was built by reckon() at $ELSEWHERE_NAME, asked of the ledger, on $LAST_DATE"
fi

# The property the typed fixture lost on 2026-10-18. If the row under test
# stands where the tower stands, recomputing it "at one fixed place" is
# recomputing it at its own place, and the sabotage below cannot bite.
if [ -n "$ELSEWHERE_NAME" ] && [ "$ELSEWHERE_NAME" != "$STANDING_NAME" ]; then
  note "$ELSEWHERE_NAME is not where the tower stands ($STANDING_NAME), so a sabotage pinned there has something to convict"
else
  bad "the elsewhere-place is the standing place ($STANDING_NAME) — this fixture proves nothing"
fi

# And the slot the row is spliced into did not already stand there, so the
# unbroken case would fail this file's own pass rule if the splice ever
# silently stopped happening. (Until Day 80 this asked that the whole real
# ledger never name the fixture's city, which a ledger at nine cities and
# counting cannot promise; the slot is what the cases below actually read.)
PRISTINE_LAST_PLACE="$(node -e '
const led = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
process.stdout.write(led[led.length - 1].place.name);
' "$PRISTINE")"
if [ "$PRISTINE_LAST_PLACE" != "$ELSEWHERE_NAME" ]; then
  note "the real newest row stands at $PRISTINE_LAST_PLACE, so the row under test is the spliced one"
else
  bad "the real newest row already stands at $ELSEWHERE_NAME — the splice cannot be told from the record"
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

  # A book holding the spliced row alone. Under the sabotage the full book's
  # other rows drift too (73 of them on Day 80), and the summary sentences
  # are about all of them, so against the full book the fork and forgery
  # cases below were answered by other rows: run on Day 80 against the tree
  # as Day 79 left it, they stayed green while the row they are named for
  # went unconvicted. Day 35's rule — a case that sweeps the whole report
  # cannot tell which row answered it. With one row in the book, all three
  # cases below, the summary sentence included, can only be about it.
  SAB="$(verify_on "$WORK/elsewhere-alone.json")"
  ROWLINE="$(echo "$SAB" | grep "^reckon: $LAST_DATE ")"

  if echo "$ROWLINE" | grep -q "^reckon: $LAST_DATE HAS DRIFTED"; then
    note "the old tool convicts the honest $ELSEWHERE_NAME row"
  else
    bad "the old tool did not convict the $ELSEWHERE_NAME row — the fixture is not biting" "$ROWLINE"
  fi

  # The fork matters as much as the verdict. The row is on the method
  # running now, so it lands in the sameMethod branch and is told a hand
  # moved a number. That sentence is the cost of the fault, and it is what
  # a stranger would have read. It is read off the row's own line.
  if echo "$ROWLINE" | grep -qE "under method [0-9]+, which is the method running now"; then
    note "and hands it the forgery fork — 'which is the method running now'"
  else
    bad "the old tool convicted it through the wrong fork" "$ROWLINE"
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
  if echo "$out" | grep -q "^reckon: $PRISTINE_LAST_DATE UNPLACED"; then
    note "$1"
  else
    bad "$1 — not reported UNPLACED" "$(echo "$out" | grep "$PRISTINE_LAST_DATE")"
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
