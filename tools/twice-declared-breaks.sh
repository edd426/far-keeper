#!/usr/bin/env bash
# tools/twice-declared-breaks.sh — break the twice-declared check, in a scratch tower.
#
#   ./tools/twice-declared-breaks.sh
#
# Day 64. `tools/twice-declared.js` asks whether any script a page loads
# declares one name twice in one scope. This suite plants each fault in a
# scratch clone and checks the tool names it, with the exit it keeps for it.
# The case list is Ember's, written before the tool was tested:
#
#   - the untouched tree first, and its domain asserted non-empty (Day 27);
#   - Day 61's own fault put back, by substitution and not by sha (a sha rots
#     when history is rewritten, and this one was on 2026-10-03);
#   - a name doubled only in a comment and a string must NOT be reported —
#     the whole reason for a parser over a regex — and the decoy is asserted
#     to be one a regex would fall for, or the case proves nothing;
#   - one name in two different functions must NOT be reported (scope);
#   - two scripts of one page share a global scope, in both of its forms;
#   - a parser that will not load is exit 2, never 0.
#
# Every sabotage asserts its bytes moved (Day 5), and the tool is called by
# its path written out so `doors.js` can see the call (Day 56).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT
T="$SCRATCH/t"
FAILS=0
ok()  { printf 'ok    %s\n' "$1"; }
bad() { printf 'FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

git clone -q --local "$ROOT" "$T" || { echo "FAIL  could not clone the tower"; exit 1; }
if [ ! -f "$T/reckoning/page.js" ] || [ ! -f "$T/index.html" ]; then
  echo "FAIL  the scratch tower was not built"; exit 1
fi

fresh() { git -C "$T" checkout -q -- . && git -C "$T" clean -qfdx; }

# expect <label> <want-exit> <needle...> — run the tool on the copy; every
# needle must appear in its report.
expect() {
  local label="$1" want="$2" out code n; shift 2
  out="$(node "$ROOT/tools/twice-declared.js" "$T" 2>&1)"; code=$?
  if [ "$code" != "$want" ]; then
    bad "$label — exit $code, wanted $want"; printf '%s\n' "$out" | sed 's/^/        /'
    return 1
  fi
  for n in "$@"; do
    if ! printf '%s' "$out" | grep -qF -- "$n"; then
      bad "$label — exit $want but the report does not say: $n"
      printf '%s\n' "$out" | sed 's/^/        /'
      return 1
    fi
  done
  ok "$label"
  LAST="$out"
}

# landed <file> — prove the copy's file differs from the real one.
landed() {
  if cmp -s "$ROOT/$1" "$T/$1"; then bad "sabotage did NOT land in $1"; return 1; fi
}

# 1. The untouched tree, and its domain.
fresh
LAST=""
expect "the untouched tower is CLEAR" 0 "CLEAR"
walked="$(printf '%s' "$LAST" | sed -n 's/.*walked \([0-9]*\) script.* \([0-9]*\) declarations.*/\1 \2/p')"
set -- $walked
if [ "${1:-0}" -ge 5 ] && [ "${2:-0}" -ge 100 ]; then
  ok "the clean run walked something (${1:-0} scripts, ${2:-0} declarations)"
else
  bad "the clean run walked almost nothing — '${walked}' — so CLEAR means nothing"
fi
if printf '%s' "$LAST" | grep -q "parser typescript [0-9]"; then
  ok "the parser's version is printed on the tool's face"
else
  bad "no parser version printed"
fi

# 2. Day 61, put back: the almanac's helper takes its old name again.
fresh
perl -0pi -e 's/\bminutesAsSignedSeconds\b/signedSeconds/g' "$T/reckoning/page.js"
if landed reckoning/page.js; then
  n="$(grep -cE '^[[:space:]]*function signedSeconds' "$T/reckoning/page.js")"
  if [ "$n" -ne 2 ]; then
    bad "the sabotage made $n declarations of signedSeconds, not 2"
  else
    expect "Day 61's signedSeconds, declared twice, is DOUBLED" 1 \
      "DOUBLED — reckoning/page.js: \`signedSeconds\` function at line" \
      "only the later one exists"
    lines="$(grep -nE '^[[:space:]]*function signedSeconds' "$T/reckoning/page.js" | cut -d: -f1 | tr '\n' ' ')"
    set -- $lines
    if printf '%s' "$LAST" | grep -q "line $1, function at line $2"; then
      ok "both lines are named ($1 and $2)"
    else
      bad "the report does not name lines $1 and $2"
    fi
  fi
fi

# 3. A name doubled in a comment and a string, declared once for real.
fresh
cat >> "$T/lintel.js" <<'EOF'
(function () {
  // function lintelDecoy() { return 1; }
  /* function lintelDecoy() { return 2; } */
  var said = "function lintelDecoy() { return 3; }";
  function lintelDecoy() { return said; }
  lintelDecoy();
})();
EOF
if landed lintel.js; then
  r="$(grep -cE 'function[[:space:]]+lintelDecoy' "$T/lintel.js")"
  if [ "$r" -ge 2 ]; then
    ok "the decoy is one a regex falls for ($r matches)"
    expect "a name doubled only in a comment and a string is not reported" 0 "CLEAR"
  else
    bad "the decoy has $r regex matches, so the case cannot tell a parser from a regex"
  fi
fi

# 4. One name in two different functions: shadowing, not doubling.
fresh
cat >> "$T/lintel.js" <<'EOF'
(function () {
  function one() { var tmp = 1; function helper() { return tmp; } return helper(); }
  function two() { var tmp = 2; function helper() { return tmp; } return helper(); }
  one(); two();
})();
EOF
landed lintel.js && expect "one name in two functions is not reported" 0 "CLEAR"

# 5. A function and a parameter of one name, and a var with a var.
fresh
cat >> "$T/lintel.js" <<'EOF'
(function () {
  function take(fold) { function fold() { return 0; } return fold(); }
  function count() { var n = 1; var n = 2; return n; }
  take(1); count();
})();
EOF
if landed lintel.js; then
  expect "a function over its own parameter is DOUBLED" 1 "\`fold\` param at line" "DOUBLED"
  if printf '%s' "$LAST" | grep -q "REDECLARED — lintel.js: \`n\` var"; then
    ok "var with var is REDECLARED, a different word"
  else
    bad "var with var was not called REDECLARED"
  fi
fi

# 6. var with var alone is not an alarm.
fresh
cat >> "$T/lintel.js" <<'EOF'
(function () { var m = 1; var m = 2; return m; })();
EOF
landed lintel.js && expect "var with var alone exits 0 and says so" 0 "REDECLARED" "CLEAR"

# 7. Two scripts of one page, one global scope: a function in each.
fresh
echo 'function crossDoubled() { return 1; }' >> "$T/lintel.js"
echo 'function crossDoubled() { return 2; }' >> "$T/skyline.js"
landed lintel.js && landed skyline.js && \
  expect "a top-level function in two scripts of one page is DOUBLED" 1 \
    "index.html shares one global scope: \`crossDoubled\` function in lintel.js"

# 8. ... and a const met again in a later script: the later one throws.
fresh
echo 'var DAY_ONE = "2026-08-04";' > "$T/build-sha.js"
expect "a var before letters.js's top-level const is DOUBLED, and says why" 1 \
  "letters/index.html shares one global scope: \`DAY_ONE\` var in build-sha.js" \
  "throws when it loads"

# 9. A parser that will not load.
fresh
out="$(FAR_KEEPER_TS_PATH=/nowhere/typescript node "$ROOT/tools/twice-declared.js" "$T" 2>&1)"; code=$?
if [ "$code" = 2 ] && printf '%s' "$out" | grep -q "UNCLEAR — no parser" && ! printf '%s' "$out" | grep -q 'twice-declared: CLEAR'; then
  ok "no parser is UNCLEAR, exit 2"
else
  bad "no parser gave exit $code"; printf '%s\n' "$out" | sed 's/^/        /'
fi

# 10. An inline script is not passed over.
fresh
perl -0pi -e 's#</body>#<script>var x = 1;</script></body>#' "$T/ember/index.html"
landed ember/index.html && expect "an inline script is UNCLEAR" 2 "inline <script>"

# 11. A tower with pages and no scripts at all.
mkdir -p "$SCRATCH/empty"
echo '<!doctype html><title>x</title>' > "$SCRATCH/empty/index.html"
out="$(node "$ROOT/tools/twice-declared.js" "$SCRATCH/empty" 2>&1)"; code=$?
if [ "$code" = 2 ] && printf '%s' "$out" | grep -q "nothing was walked"; then
  ok "nothing walked is UNCLEAR, not clean"
else
  bad "an empty tower gave exit $code"; printf '%s\n' "$out" | sed 's/^/        /'
fi

# 12. The surface.
out="$(node "$ROOT/tools/twice-declared.js" --nonsense 2>&1)"; code=$?
[ "$code" = 3 ] && ok "an unknown flag is exit 3" || bad "an unknown flag gave exit $code"
out="$(node "$ROOT/tools/twice-declared.js" --help 2>&1)"; code=$?
[ "$code" = 0 ] && printf '%s' "$out" | grep -q usage && ok "--help prints the surface" || bad "--help gave exit $code"

# The real tower was never touched.
if [ -n "$(git -C "$ROOT" status --porcelain -- reckoning/page.js lintel.js skyline.js ember/index.html)" ]; then
  bad "the real tower's page scripts moved during this run"
else
  ok "the real tower's page scripts did not move"
fi

if [ "$FAILS" -gt 0 ]; then
  echo "twice-declared-breaks: $FAILS FAILED"
  exit 1
fi
echo "twice-declared-breaks: all green"
