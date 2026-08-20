#!/usr/bin/env bash
# tools/claim-birthdays.sh — a claim the ledger is too old to have made
#
#   ./tools/claim-birthdays.sh            check the working tree
#   ./tools/claim-birthdays.sh /some/tree check another copy of the tower
#
# Built Day 15, with the rising point.
#
# The ledger is cold: an entry that exists is never rewritten. So when the
# tower starts publishing a new number, every entry already in the book
# lacks it — lawfully, permanently — and `--verify` has to know the
# difference between *this row does not answer* and *this row's answer has
# moved*. `CLAIM_INTRODUCED` in reckoning/reckoning.js is where that lives
# — in the instrument rather than in either auditor, because there are two
# auditors (this tool, and the ledger recomputing in a reader's browser)
# and a second copy of one date is a second chance to disagree.
#
# Four cases, and the first is the one that gives the other three their
# meaning: with the birthdays removed, the whole ledger must go red. A
# guard that cannot be seen to be holding anything up is not a guard, it
# is a decoration (Day 9 — a check that has never failed is a claim about
# the check).
#
# The exemption is symmetric and both halves are tested. Absence excused
# in an old row; absence *convicted* in a new one; and a forged field
# grafted onto an old row convicted too — that last is Ember's, and it is
# the hole an exemption pointed only at absence would open underneath
# itself.
#
# Nothing here opens the tower's own ledger. Every case runs in a
# `mktemp -d` copy, and the real file's bytes are checked at the end
# anyway, because Day 10 was three of us being careful and writing to it
# regardless.
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

# The date the rising point was first published, read out of the instrument
# rather than typed here — a test that hard-codes the thing it is checking
# agrees with itself for free.
BORN="$(node -e '
const s=require("fs").readFileSync(process.argv[1],"utf8");
const m=/risingPointDegrees:\s*.([0-9]{4}-[0-9]{2}-[0-9]{2})./.exec(s);
process.stdout.write(m?m[1]:"");
' "$WORK/reckoning/reckoning.js")"

fails=0
note() { echo "ok    $1"; }
bad()  { fails=$((fails + 1)); echo "FAIL  $1"; [ -n "${2:-}" ] && echo "$2" | sed 's/^/        /'; }

if [ -z "$BORN" ]; then
  bad "could not read the rising point's birthday out of reckoning/reckoning.js"
  echo; echo "claim-birthdays: $fails case(s) failed."; exit 1
fi
note "the rising point's birthday, read from the tool: $BORN"

# drifted <ledger-file> -> prints the number of DRIFTED rows, exit code aside
drifted() {
  cp "$1" "$WORK/reckoning/ledger.json"
  (cd "$WORK" && node tools/reckon.js --verify 2>&1) | grep -c 'HAS DRIFTED'
}
verify_out() {
  cp "$1" "$WORK/reckoning/ledger.json"
  (cd "$WORK" && node tools/reckon.js --verify 2>&1)
}

TOTAL="$(node -e 'process.stdout.write(String(require(process.argv[1]).length))' "$PRISTINE")"
SCARS=3   # 2026-08-06, 07, 08 — method 1, drifted since Day 6, never repaired

echo
echo "-- as it ships: only the Day 6 scars --"
got="$(drifted "$PRISTINE")"
if [ "$got" = "$SCARS" ]; then
  note "$TOTAL entries, $got DRIFTED — the three method-1 scars and nothing else"
else
  bad "$got rows DRIFTED, wanted $SCARS" "$(verify_out "$PRISTINE")"
fi

echo
echo "-- the sabotage that proves the guard is load-bearing --"
# Take the birthdays out. Every row *older than the claim* now gets asked a
# question it could not have answered, and every one of them should go red.
#
# Day 16 correction, and it is the standing caution landing on the very
# test written to hold a line: this case read "the whole book should go
# red" and counted every row in the ledger. That was true on the day it
# was written and stopped being true the same evening, when the day's own
# entry — born on the birthday, lawfully carrying the field — was
# appended. The tool was right and the expectation was stale, and it read
# as a failure of the guard. That is the third time in four days that a
# red case here was mine rather than the code's, and the shape is always
# the same: an expectation gets less scrutiny than anything else written,
# because it is the part doing the checking. Count the rows that predate
# the birthday; do not count the ledger.
sed -i "s/  risingPointDegrees: '$BORN',/  risingPointDegreesXX: '$BORN',/" "$WORK/reckoning/reckoning.js"
sed -i "s/  risingPointStepArcminutes: '$BORN'/  risingPointStepArcminutesXX: '$BORN'/" "$WORK/reckoning/reckoning.js"
if grep -q "risingPointDegreesXX" "$WORK/reckoning/reckoning.js"; then
  note "sabotage landed — the birthdays no longer match the claim names"
else
  bad "sabotage did NOT land; the rest of this section proves nothing (Day 5)"
fi
OLDER="$(node -e '
  const l = require(process.argv[1]);
  process.stdout.write(String(l.filter((e) => e.date < process.argv[2]).length));
' "$PRISTINE" "$BORN")"
got="$(drifted "$PRISTINE")"
if [ "$got" = "$OLDER" ]; then
  note "without birthdays all $got rows older than $BORN go DRIFTED (of $TOTAL in the book) — which is what the guard is holding up"
else
  bad "without birthdays $got rows drifted, wanted the $OLDER that predate $BORN"
fi
# And the part that makes it worse than a bare drift: the Day 11 fork tells
# the untouched method-2 rows they have no innocent account.
if verify_out "$PRISTINE" | grep -q 'no method change to blame'; then
  note "and they are handed the forgery account — false of every one of them"
else
  bad "expected the unguarded run to hand rows the no-innocent-account sentence"
fi
cp "$SRC/reckoning/reckoning.js" "$WORK/reckoning/reckoning.js"

echo
echo "-- a row born after the claim must carry it --"
# Build a fresh entry for the birthday itself, then take the field out of it
# by hand. A published row that should answer and does not is the deletion
# hole, and it must be caught.
#
# **This section did not do that for two days and still printed ok.** Until
# Day 17 the line here was:
#
#     cp "$PRISTINE" "$WORK/reckoning/ledger.json"
#     (cd "$WORK" && node tools/reckon.js "$BORN" >/dev/null 2>&1)
#     cp "$WORK/reckoning/ledger.json" "$WORK/fresh.json"
#
# $BORN is 2026-08-18, which is Day 15 — the morning this file was written.
# The day's own bare `reckon.js` had already published that row hours before
# this test first ran, so the call landed in the *already in the ledger, not
# rewriting* branch, wrote nothing, and had its refusal swallowed by the
# redirect. `fresh.json` was a byte copy of the pristine ledger. The
# assertion under it then passed on the strength of the real published row —
# true, and not a fact about anything this section had built. It was a no-op
# before its ink was dry, and green every morning since.
#
# The rule it broke is Day 5's, pointed at the end nobody points it at. This
# very file guards its *sabotage* rigorously — see the `grep -q
# risingPointDegreesXX … else bad "sabotage did NOT land"` above. It never
# once asked whether its **fixture** got built. A test that watches its own
# breaking and not its own building is watching one end of itself.
#
# So the row is manufactured from the instrument now, spliced into a copy of
# the array in place of whatever is there. Ember's reason for going through
# `reckon()` rather than the writing tool, and it is about a morning that has
# not happened: the next claim this tower introduces will have its birthday
# be **today**, and on that day there is no already-published row to lean on
# and the gated CLI refuses to make one. This is the form that still works
# then. And the splice keeps the two checks below fed by a row we built,
# which is what they were always supposed to be checking.
cp "$PRISTINE" "$WORK/reckoning/ledger.json"
if node -e '
const path=require("path");
const fs=require("fs");
const { reckon, PARIS } = require(path.resolve(process.argv[1], "reckoning/reckoning.js"));
const l = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const born = process.argv[3];
const fresh = reckon(born, PARIS);
if (typeof fresh.risingPointDegrees !== "number") {
  console.error("reckon() itself returned no rising point for " + born);
  process.exit(1);
}
const at = l.findIndex((x) => x.date === born);
if (at < 0) { console.error("no " + born + " row to replace"); process.exit(1); }
fresh.publishedAt = l[at].publishedAt;
l[at] = fresh;
fs.writeFileSync(process.argv[4], JSON.stringify(l, null, 2) + "\n");
// The fixture is only a fixture if it landed. Assert the row in the file we
// just wrote is the one we just computed, not the one that was already there.
const back = JSON.parse(fs.readFileSync(process.argv[4], "utf8")).find((x) => x.date === born);
process.exit(back && back.risingPointDegrees === fresh.risingPointDegrees ? 0 : 1);
' "$WORK" "$PRISTINE" "$BORN" "$WORK/fresh.json"; then
  note "a $BORN row built from reckon() carries a rising point, as a row of its age must"
else
  bad "the manufactured $BORN row was not built or carries no rising point — nothing below this line means anything"
fi
got="$(drifted "$WORK/fresh.json")"
if [ "$got" = "$SCARS" ]; then
  note "with the new row present and correct, still only the $SCARS scars"
else
  bad "$got rows DRIFTED with an honest new row, wanted $SCARS" "$(verify_out "$WORK/fresh.json")"
fi

node -e '
const fs=require("fs"),p=process.argv[1],d=process.argv[2];
const l=JSON.parse(fs.readFileSync(p,"utf8"));
delete l.find(x=>x.date===d).risingPointDegrees;
fs.writeFileSync(process.argv[3], JSON.stringify(l,null,2)+"\n");
' "$WORK/fresh.json" "$BORN" "$WORK/deleted.json"
out="$(verify_out "$WORK/deleted.json")"
if echo "$out" | grep -q 'missing from an entry that should carry it'; then
  note "a field deleted from a row of the right age is caught, and named as a deletion"
else
  bad "a deleted field escaped" "$out"
fi

echo
echo "-- and a claim grafted onto a row too old to have made it --"
# Ember's half. An exemption pointed only at absence waves this through.
OLD="$(node -e 'const l=require(process.argv[1]);process.stdout.write(l[0].date)' "$PRISTINE")"
node -e '
const fs=require("fs"),p=process.argv[1],d=process.argv[2];
const l=JSON.parse(fs.readFileSync(p,"utf8"));
l.find(x=>x.date===d).risingPointDegrees = 68.84;
fs.writeFileSync(process.argv[3], JSON.stringify(l,null,2)+"\n");
' "$PRISTINE" "$OLD" "$WORK/grafted.json"
out="$(verify_out "$WORK/grafted.json")"
if echo "$out" | grep -q "predates $BORN"; then
  note "a rising point grafted onto $OLD is caught, and told why it cannot be there"
else
  bad "a grafted claim escaped on $OLD" "$out"
fi

echo
REAL_AFTER="$(sha256sum "$SRC/reckoning/ledger.json" | cut -d' ' -f1)"
if [ "$REAL_BEFORE" = "$REAL_AFTER" ]; then
  note "the tower's own ledger was not opened for writing"
else
  bad "THE REAL LEDGER MOVED — $REAL_BEFORE -> $REAL_AFTER"
fi

echo
if [ "$fails" = 0 ]; then
  echo "claim-birthdays: every case holds."
else
  echo "claim-birthdays: $fails case(s) failed."
fi
exit $([ "$fails" = 0 ] && echo 0 || echo 1)
