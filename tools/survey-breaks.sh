#!/usr/bin/env bash
# survey-breaks — make `tools/survey.js` fail, in a scratch tree.
#
# Built Day 22, beside the tool. The house rule it exists for is Day 5's: a
# check that cannot break always passes, so the sabotage must be proved to have
# landed before its failure means anything — and Day 17's turn of the same
# rule, which is the one that gets forgotten: a suite that watches its own
# breaking and not its own building is watching one end of itself. Every case
# below asserts the fixture was built as hard as it asserts the sabotage landed.
#
# And Day 19's: a suite must prove the tool its sabotage made still *runs*. A
# substitution can land in the text and produce a file node will not load, and
# then every case under it fails with a message blaming the fixture while node
# prints a module error into the same buffer — failures unreadable at exactly
# the moment they are loudest. So each sabotage is followed by an answers-check
# before any expectation is read.
#
# Nothing here touches the real tree. `survey.js` only reads, but Day 10's
# lesson was learned by three of us at once and applies to the shape and not
# only to writers: never point a test at the thing it is a test of. The scratch
# tree's bytes are checked at the end regardless.

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
W="$(mktemp -d)"
trap 'rm -rf "$W"' EXIT

mkdir -p "$W/tools" "$W/reckoning"
cp "$ROOT/tools/survey.js" "$W/tools/"
cp "$ROOT/reckoning/reckoning.js" "$W/reckoning/"

FAILED=0
ok()  { printf 'ok    %s\n' "$1"; }
bad() { printf 'FAIL  %s\n' "$1"; FAILED=1; }

# The scratch tree as it stands now, so a case can restore it.
PRISTINE="$(mktemp -d)"
cp -r "$W/." "$PRISTINE/"
restore() { rm -rf "$W/tools" "$W/reckoning"; cp -r "$PRISTINE/." "$W/"; }

# Does the tool answer at all? Not "did the bytes move" — Day 19.
answers() {
  node "$W/tools/survey.js" >/dev/null 2>&1
  local code=$?
  [ "$code" -le 1 ]
}

run() { node "$W/tools/survey.js" "$@" 2>"$W/stderr.txt"; }

# ---- the good path, which is what gives the sabotages their meaning ----

OUT="$(run)"; CODE=$?
[ "$CODE" -eq 0 ] && ok "the unbroken tool exits 0" || bad "the unbroken tool exits 0 (got $CODE)"
grep -q 'Longyearbyen.*unwitnessed latitude' <<<"$OUT" \
  && ok "Longyearbyen is named as standing outside the sweep" \
  || bad "Longyearbyen is named as standing outside the sweep"
grep -q 'Tromso.*unwitnessed latitude' <<<"$OUT" \
  && ok "Tromso is named as standing outside the sweep" \
  || bad "Tromso is named as standing outside the sweep"
grep -q 'Longyearbyen.*gap larger than any the sweep saw' <<<"$OUT" \
  && ok "Longyearbyen's 6.51 is named as past the largest gap swept" \
  || bad "Longyearbyen's 6.51 is named as past the largest gap swept"
grep -q 'Kiritimati.*reached: sunset' <<<"$OUT" \
  && ok "Kiritimati reaches the day-line join" \
  || bad "Kiritimati reaches the day-line join"
grep -q 'Reykjavik.*not reached' <<<"$OUT" \
  && ok "Reykjavik does not reach it" \
  || bad "Reykjavik does not reach it"
grep -q 'never risen' <<<"$OUT" \
  && ok "a dark candidate says so" || bad "a dark candidate says so"
grep -q 'NaN' <<<"$OUT" \
  && bad "no NaN anywhere in the report" || ok "no NaN anywhere in the report"
# The pass rule below must be one the unbroken tool fails, or it is not a rule.
grep -q 'PAST THE BOUND' <<<"$OUT" \
  && bad "the unbroken tool refuses nobody" || ok "the unbroken tool refuses nobody"

# ---- 1. widen the witness band to the poles ----
#
# The flag is about the *evidence*, so widening the evidence must silence it —
# and must silence it without changing a single figure, because the witness is
# not an input to any arithmetic.

restore
BEFORE="$(cat "$W/reckoning/reckoning.js")"
perl -0pi -e 's/latitudeRange: \[-66, 66\]/latitudeRange: [-90, 90]/' "$W/reckoning/reckoning.js"
if [ "$BEFORE" = "$(cat "$W/reckoning/reckoning.js")" ]; then
  bad "sabotage 1 did NOT land — the witness band was not widened"
elif ! answers; then
  bad "sabotage 1 landed but the tool no longer runs"
else
  ok "sabotage 1 landed and the tool still answers"
  WIDE="$(run)"
  grep -q 'unwitnessed latitude' <<<"$WIDE" \
    && bad "a witness covering the poles silences the band flag" \
    || ok "a witness covering the poles silences the band flag"
  grep -q 'Longyearbyen   19.39h' <<<"$WIDE" \
    && ok "and moves no figure — Longyearbyen's day is unchanged" \
    || bad "and moves no figure — Longyearbyen's day is unchanged"
fi

# ---- 2. shrink the largest honest gap ----

restore
BEFORE="$(cat "$W/reckoning/reckoning.js")"
perl -0pi -e 's/largestHonestGapMinutes: 4\.07/largestHonestGapMinutes: 0.001/' "$W/reckoning/reckoning.js"
if [ "$BEFORE" = "$(cat "$W/reckoning/reckoning.js")" ]; then
  bad "sabotage 2 did NOT land — the largest gap was not shrunk"
elif ! answers; then
  bad "sabotage 2 landed but the tool no longer runs"
else
  ok "sabotage 2 landed and the tool still answers"
  N="$(run | grep -c 'gap larger than any the sweep saw')"
  [ "$N" -gt 20 ] \
    && ok "a witness that saw nothing flags nearly every row ($N)" \
    || bad "a witness that saw nothing flags nearly every row (got $N)"
fi

# ---- 3. drop the bound under the honest gaps ----
#
# Exit 1 is spoken for: at least one candidate produced a figure the tower would
# refuse to stand behind. A mistyped flag must never spend it (Day 13).

restore
BEFORE="$(cat "$W/reckoning/reckoning.js")"
perl -0pi -e 's/CROSS_CHECK_MAX_GAP_MINUTES = 60/CROSS_CHECK_MAX_GAP_MINUTES = 1/' "$W/reckoning/reckoning.js"
if [ "$BEFORE" = "$(cat "$W/reckoning/reckoning.js")" ]; then
  bad "sabotage 3 did NOT land — the bound was not lowered"
elif ! answers; then
  bad "sabotage 3 landed but the tool no longer runs"
else
  ok "sabotage 3 landed and the tool still answers"
  OUT3="$(run)"; CODE3=$?
  grep -q 'PAST THE BOUND' <<<"$OUT3" \
    && ok "a bound under the honest gaps produces a refusal" \
    || bad "a bound under the honest gaps produces a refusal"
  [ "$CODE3" -eq 1 ] \
    && ok "and the tool exits 1" || bad "and the tool exits 1 (got $CODE3)"
fi

# ---- 4. the argument surface ----

restore
run --nonsense >"$W/out.txt"; CODE=$?
[ "$CODE" -eq 2 ] && ok "an unknown flag exits 2" || bad "an unknown flag exits 2 (got $CODE)"
grep -q '^INVALID' "$W/stderr.txt" && ok "and says INVALID on stderr" || bad "and says INVALID on stderr"
[ ! -s "$W/out.txt" ] && ok "and prints no report" || bad "and prints no report"

run --help >"$W/out.txt"; CODE=$?
[ "$CODE" -eq 0 ] && ok "--help exits 0" || bad "--help exits 0 (got $CODE)"
grep -q '^usage' "$W/out.txt" && ok "and prints the usage line only" || bad "and prints the usage line only"

# ---- 5. the other door (Day 10) ----

REQ="$(node -e "const m=require('$W/tools/survey.js'); process.stdout.write('candidates='+m.CANDIDATES.length)" 2>&1)"
[ "$REQ" = "candidates=12" ] \
  && ok "require() neither prints a report nor exits" \
  || bad "require() neither prints a report nor exits (got: $REQ)"

# ---- 6. a read tool that writes is a different tool (Day 10) ----

restore
rm -f "$W/out.txt" "$W/stderr.txt"
SUM_BEFORE="$(find "$W" -type f -exec md5sum {} + | sed "s|$W||" | sort)"
run >/dev/null 2>&1
rm -f "$W/stderr.txt"
SUM_AFTER="$(find "$W" -type f -exec md5sum {} + | sed "s|$W||" | sort)"
[ "$SUM_BEFORE" = "$SUM_AFTER" ] \
  && ok "the survey wrote nothing to the tree" \
  || bad "the survey wrote nothing to the tree"

rm -rf "$PRISTINE"
[ "$FAILED" -eq 0 ] && printf '\nsurvey-breaks: all cases green\n' || printf '\nsurvey-breaks: RED\n'
exit "$FAILED"
