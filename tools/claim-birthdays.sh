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
# Take the birthdays out. Every row now gets asked a question it could not
# have answered, and the whole book should go red.
sed -i "s/  risingPointDegrees: '$BORN',/  risingPointDegreesXX: '$BORN',/" "$WORK/reckoning/reckoning.js"
sed -i "s/  risingPointStepArcminutes: '$BORN'/  risingPointStepArcminutesXX: '$BORN'/" "$WORK/reckoning/reckoning.js"
if grep -q "risingPointDegreesXX" "$WORK/reckoning/reckoning.js"; then
  note "sabotage landed — the birthdays no longer match the claim names"
else
  bad "sabotage did NOT land; the rest of this section proves nothing (Day 5)"
fi
got="$(drifted "$PRISTINE")"
if [ "$got" = "$TOTAL" ]; then
  note "without birthdays all $got of $TOTAL rows go DRIFTED — which is what the guard is holding up"
else
  bad "without birthdays $got of $TOTAL rows drifted, wanted all $TOTAL"
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
# Write a fresh entry in the scratch tower for the birthday itself, then
# take the field out of it by hand. A published row that should answer and
# does not is the deletion hole, and it must be caught.
cp "$PRISTINE" "$WORK/reckoning/ledger.json"
(cd "$WORK" && node tools/reckon.js "$BORN" >/dev/null 2>&1)
cp "$WORK/reckoning/ledger.json" "$WORK/fresh.json"
if node -e '
const fs=require("fs"),p=process.argv[1],d=process.argv[2];
const l=JSON.parse(fs.readFileSync(p,"utf8"));
const e=l.find(x=>x.date===d);
process.exit(e && typeof e.risingPointDegrees === "number" ? 0 : 1);
' "$WORK/fresh.json" "$BORN"; then
  note "the fresh $BORN entry carries a rising point, as a row of its age must"
else
  bad "the fresh entry has no rising point — nothing below this line means anything"
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
