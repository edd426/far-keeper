#!/usr/bin/env bash
# tools/way-in-breaks.sh — break the reckoning room's way in, seven ways.
#
#   ./tools/way-in-breaks.sh
#
# Day 56. `tools/way-in.js` asks two things of the opening paragraph of
# `reckoning/index.html`: every room section is named there exactly once,
# and every link there lands on a room section. This suite breaks each half
# in a scratch copy and checks the tool says so, with the exit code it keeps
# for that. The sabotages were written before the tool was (Day 43: a needle
# written against a tool that is already failing is chosen against the
# failure, not against your guess of what should be true).
#
# Every sabotage asserts it landed (Day 5) and the untouched copy must pass
# first, so a case that could not break cannot print ok.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT
FAILS=0
ok()  { printf 'ok    %s\n' "$1"; }
bad() { printf 'FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

fresh() {
  rm -rf "$SCRATCH/t"; mkdir -p "$SCRATCH/t/reckoning"
  cp "$ROOT/reckoning/index.html" "$SCRATCH/t/reckoning/index.html"
}

# expect <label> <want-exit> <needle-or-empty> — run the tool on the copy.
expect() {
  local label="$1" want="$2" needle="$3" out code
  out="$(node "$ROOT/tools/way-in.js" "$SCRATCH/t" 2>&1)"; code=$?
  if [ "$code" != "$want" ]; then
    bad "$label — exit $code, wanted $want"; printf '%s\n' "$out" | sed 's/^/        /'
    return
  fi
  if [ -n "$needle" ] && ! printf '%s' "$out" | grep -qF -- "$needle"; then
    bad "$label — exit $want but the report does not say: $needle"
    printf '%s\n' "$out" | sed 's/^/        /'
    return
  fi
  ok "$label"
}

# sabotage <perl-expr> — edit the copy and prove the bytes moved.
sabotage() {
  perl -0pi -e "$1" "$SCRATCH/t/reckoning/index.html"
  if cmp -s "$ROOT/reckoning/index.html" "$SCRATCH/t/reckoning/index.html"; then
    bad "sabotage did NOT land: $1"; return 1
  fi
}

fresh
expect "the untouched room agrees" 0 "AGREES"

fresh
sabotage 's{<a href="#corner-heading">the corner</a>}{the corner}' &&
  expect "a section left out of the way in is named" 1 "corner-heading"

fresh
sabotage 's{(<section class="reckoning" aria-labelledby="ledger-heading">)}{<section class="reckoning" aria-labelledby="zz-new-heading">\n<h2 id="zz-new-heading">a new room</h2>\n</section>\n$1}' &&
  expect "a section added with no line in the way in is named" 1 "zz-new-heading"

fresh
sabotage 's{href="#drift-heading"}{href="#drift-heading-typo"}' &&
  expect "a link that lands on no section is named" 1 "drift-heading-typo"

fresh
sabotage 's{(<a href="#ledger-heading">the ledger</a>)}{$1 (<a href="#ledger-heading">again</a>)}' &&
  expect "a section named twice is named" 1 "ledger-heading"

# Day 45: a mention is not a call. A link inside an HTML comment is not a
# link a reader can follow, so commenting one out must count as removing it.
fresh
sabotage 's{(<a href="#mornings-heading">the mornings</a>)}{<!-- $1 -->}' &&
  expect "a link inside a comment does not count as a door" 1 "mornings-heading"

# The empty domain (Days 27, 35): with no way in at all there is nothing to
# hold the sections against, and that must not read as agreement.
fresh
sabotage 's{<p class="standing" id="way-in">.*?</p>}{}s' &&
  expect "no way in at all is a hole, not a pass" 2 "no way in"

fresh
out="$(node "$ROOT/tools/way-in.js" --nonsense 2>&1)"; code=$?
if [ "$code" = 3 ]; then ok "an unknown flag is refused, exit 3"; else bad "unknown flag exited $code"; fi

echo
if [ "$FAILS" -eq 0 ]; then
  echo "PASS — the way in names every room section once and sends nobody nowhere."
  exit 0
fi
echo "FAIL — $FAILS case(s)."
exit 1
