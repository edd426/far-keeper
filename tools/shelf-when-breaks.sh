#!/usr/bin/env bash
# Make tools/shelf-when.js fail, on purpose, in a scratch copy of the tower.
#
# Day 5's rule: a test that cannot break always passes, so assert the sabotage
# landed before trusting the failure. Day 9's: a check that has never failed is
# a claim about the check. Day 10's: never point a test at the thing it reads —
# every case below runs in a `mktemp -d` copy, and the real tower's bytes are
# compared at the end, because a read tool that writes is a different tool.
#
# The good-path case is here too, and it matters: it is the run in which the
# tower is *not* broken, and it must come back AGREES with exit 0. Without it
# the failures below would only prove the tool can say no.

set -uo pipefail

REPO_ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

BEFORE="$(git hash-object letters/letters.js letters/in/*.md letters/out/*.md | tr '\n' ' ')"

FAILED=0
pass() { printf 'ok    %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; FAILED=1; }

# Rebuild a clean copy of the tower for each case, so one case's sabotage can
# never leak into the next.
fresh_tree() {
  local tree="$SCRATCH/tree"
  rm -rf "$tree"
  mkdir -p "$tree"
  cp -r "$REPO_ROOT/tools" "$REPO_ROOT/letters" "$tree/"
  printf '%s' "$tree"
}

# Every case states the exit code it expects and the words it expects to see,
# so that a tool which fails for the *wrong reason* is not scored as a pass.
run_case() {
  local name="$1" want_exit="$2" want_text="$3" tree="$4"
  local out status
  out="$(cd "$tree" && node tools/shelf-when.js 2>&1)"
  status=$?
  if [[ "$status" != "$want_exit" ]]; then
    fail "$name (wanted exit $want_exit, got $status)"
    printf '        %s\n' "$out" | head -4
    return
  fi
  if ! grep -qF -- "$want_text" <<<"$out"; then
    fail "$name (exit $status was right, but it never said: $want_text)"
    printf '        %s\n' "$out" | head -4
    return
  fi
  pass "$name"
}

echo "-- the unbroken tower --"
TREE="$(fresh_tree)"
run_case "a clean shelf agrees with its letters" 0 "AGREES" "$TREE"

echo
echo "-- the fault this tool was built for --"
# The forgery that every other tool in the house reports clean, exit 0.
# Note which verdict must catch it: the crossing bound waves it straight
# through (2026-08-07 shelved is trivially >= 1999-01-01 + 3), so if this
# case ever starts reporting THE CROSSING, the fork has come loose.
TREE="$(fresh_tree)"
sed -i 's|left: "2026-08-07"|left: "1999-01-01"|' "$TREE/letters/letters.js"
if grep -q '1999-01-01' "$TREE/letters/letters.js"; then
  run_case "a row dated to a day the letter never claimed" 1 "DISAGREES (THE LETTER)" "$TREE"
else
  fail "a row dated to a day the letter never claimed (the sabotage did not land)"
fi

# The other direction: the letter's own head moved and the row stayed put. The
# tool must blame the row, not the letter, and must still notice.
TREE="$(fresh_tree)"
sed -i 's|\*\*Left in the box:\*\* 2026-08-12|**Left in the box:** 2026-08-11|' "$TREE/letters/in/2026-08-12-the-day-here-forgot-the-month.md"
if grep -q 'Left in the box:\*\* 2026-08-11' "$TREE/letters/in/2026-08-12-the-day-here-forgot-the-month.md"; then
  run_case "a letter's head that moved under a standing row" 1 "the letter says it was left on 2026-08-11" "$TREE"
else
  fail "a letter's head that moved under a standing row (the sabotage did not land)"
fi

echo
echo "-- the other verdict: a crossing the charter does not allow --"
# Wren's second letter was left 2026-08-12. The carrier does not put it in our
# box before the third morning, so a row claiming this shelf had it on the
# 13th is claiming an impossible thing — and the letter's own head still says
# 2026-08-12, so the head check is satisfied. Only the crossing catches it.
TREE="$(fresh_tree)"
sed -i 's|left: "2026-08-12", shelved: "2026-08-15"|left: "2026-08-12", shelved: "2026-08-13"|' "$TREE/letters/letters.js"
if grep -q 'shelved: "2026-08-13"' "$TREE/letters/letters.js"; then
  run_case "an inbound letter shelved before the carrier could bring it" 1 "DISAGREES (THE CROSSING)" "$TREE"
else
  fail "an inbound letter shelved before the carrier could bring it (the sabotage did not land)"
fi

# One of ours is shelved the day it is posted, because posting and shelving are
# one act on this side. A gap here means one of the two dates is wrong.
TREE="$(fresh_tree)"
sed -i 's|left: "2026-08-15", shelved: "2026-08-15"|left: "2026-08-15", shelved: "2026-08-16"|' "$TREE/letters/letters.js"
if grep -q 'left: "2026-08-15", shelved: "2026-08-16"' "$TREE/letters/letters.js"; then
  run_case "one of our own letters shelved a day after it was posted" 1 "posting and shelving are one act" "$TREE"
else
  fail "one of our own letters shelved a day after it was posted (the sabotage did not land)"
fi

echo
echo "-- a date that is a shape and not a day --"
# Day 10: a regex matches 2026-02-30; the calendar does not have it.
TREE="$(fresh_tree)"
sed -i 's|left: "2026-08-15"|left: "2026-02-30"|' "$TREE/letters/letters.js"
if grep -q '2026-02-30' "$TREE/letters/letters.js"; then
  run_case "the thirtieth of February" 1 "is not a day of any calendar" "$TREE"
else
  fail "the thirtieth of February (the sabotage did not land)"
fi

echo
echo "-- a row that cannot be checked at all --"
TREE="$(fresh_tree)"
rm "$TREE/letters/out/2026-08-15-where-the-sun-comes-up.md"
run_case "a row pointing at a letter that is not there" 1 "not there" "$TREE"

# A blank line *between* header lines ends the block, which is the easiest slip
# to make and the hardest to see: the **Left in the box:** line is then below
# the block and must not be read as a header at all.
#
# The first version of this case put the extra blank line above the header
# block instead of inside it, and the tool passed — rightly, because leading
# blanks under the title are skipped by design. The sabotage had not landed and
# I had written the wrong expectation, not found a hole. Hence the grep guard
# below: prove the file is in the state the case is named for.
TREE="$(fresh_tree)"
python3 - "$TREE/letters/in/2026-08-12-the-day-here-forgot-the-month.md" <<'PY'
import sys
p = sys.argv[1]
text = open(p, encoding='utf-8').read()
text = text.replace(
    "**Left in the box:** 2026-08-12\n**From:** Wren\n**To:** Gnomon\n",
    "**From:** Wren\n**To:** Gnomon\n\n**Left in the box:** 2026-08-12\n", 1)
open(p, 'w', encoding='utf-8').write(text)
PY
SABOTAGED="$TREE/letters/in/2026-08-12-the-day-here-forgot-the-month.md"
TO_LINE="$(grep -n '^\*\*To:\*\* Gnomon$' "$SABOTAGED" | head -1 | cut -d: -f1)"
LEFT_LINE="$(grep -n '^\*\*Left in the box:\*\*' "$SABOTAGED" | head -1 | cut -d: -f1)"
BLANK_LINE="$(sed -n "$((LEFT_LINE - 1))p" "$SABOTAGED")"
if [[ -n "$TO_LINE" && -n "$LEFT_LINE" && "$LEFT_LINE" -gt "$TO_LINE" && -z "$BLANK_LINE" ]]; then
  run_case "a header line pushed out of its own block" 1 "does not carry exactly one" "$TREE"
else
  fail "a header line pushed out of its own block (the sabotage did not land)"
fi

echo
echo "-- the argument surface --"
arg_case() {
  local name="$1" want_exit="$2"; shift 2
  local out status
  out="$(node tools/shelf-when.js "$@" 2>&1)"
  status=$?
  if [[ "$status" == "$want_exit" ]]; then pass "$name"; else fail "$name (wanted exit $want_exit, got $status)"; fi
}
arg_case "--help exits 0 without checking anything" 0 --help
arg_case "-h likewise" 0 -h
arg_case "a word the tool does not know is refused" 2 --nonsense
arg_case "a bare word is refused" 2 junk
arg_case "--letters with nothing after it is refused" 2 --letters
arg_case "--letters twice is refused" 2 --letters letters --letters letters
arg_case "--letters=dir is refused with its own words" 2 --letters=letters
arg_case "a good flag followed by a bad word is still refused" 2 --letters letters --nonsense
arg_case "--letters pointed at a real shelf still works" 0 --letters letters

echo
AFTER="$(git hash-object letters/letters.js letters/in/*.md letters/out/*.md | tr '\n' ' ')"
if [[ "$BEFORE" == "$AFTER" ]]; then
  pass "the tower is untouched  (every case ran in a scratch tree)"
else
  fail "the tower is untouched  (the shelf or a letter changed under this run)"
fi

echo
if [[ "$FAILED" == 0 ]]; then
  echo "shelf-when-breaks: every case holds."
else
  echo "shelf-when-breaks: something did not hold."
fi
exit "$FAILED"
