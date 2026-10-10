#!/usr/bin/env bash
# tools/parses-breaks.sh — break the tower's parse check every way it can
# answer, in scratch trees, and prove each answer is the one it should be.
#
#   ./tools/parses-breaks.sh              check the working tree's parses.sh
#   ./tools/parses-breaks.sh <tool>       check another copy of the tool
#
# Built Day 68. It was owed since Day 37. `tools/parses.sh` has three
# verdicts and an UNBUILT note between them, and the only proof the book
# carried for any of them was a sentence: *BROKEN is proved against
# `6ed865d`*. That sha was rewritten on 2026-10-03 and is `19aa926` now, so
# the proof could be spent only by somebody who first went to the commit
# map. Day 51's rule: **a proof written as a sentence in a book is not a
# proof anybody can spend.** This one is spent every run.
#
# Every fault is planted by hand in a fresh clone, never by checking out an
# old sha, because a sha rots when history is rewritten and this house has
# rewritten its history once. Each plant is checked to have landed before
# its verdict is believed (Day 5), and each fixture is checked to have been
# built (Day 17).
#
# The scratch trees are clones of the commit you are on. Your uncommitted
# pages are not in them. The tool under test is the working tree's.
#
# Exit 0 all green, 1 a case red, 2 the run could not conclude.
set -u

SRC="$(cd "$(dirname "$0")/.." && pwd)"
TOOL="${1:-$SRC/tools/parses.sh}"
[ -f "$TOOL" ] || { echo "UNCLEAR no tool at $TOOL"; exit 2; }
ROOT="$(mktemp -d)"
trap 'rm -rf "$ROOT"' EXIT
fails=0
ok()  { echo "ok    $1"; }
bad() { echo "FAIL  $1"; [ -n "${2:-}" ] && printf '%s\n' "$2" | sed 's/^/        /'; fails=$((fails + 1)); }

clone() {  # clone <dir> : a fresh, unbuilt copy of the commit in front of us
  git clone -q --local "$SRC" "$1" 2>/dev/null || { echo "UNCLEAR could not clone $SRC"; exit 2; }
}

# run <tree> ; sets OUT and EXIT
run() { OUT="$(bash "$TOOL" "$@" 2>&1)"; EXIT=$?; }

echo "-- the fixture --"
C="$ROOT/clean"; clone "$C"
# UNBUILT has a domain only if a page loads a file the tree ignores and has
# not built. Asserted before anything is judged by it.
if grep -q 'src="../build-sha.js"' "$C/diary/index.html" 2>/dev/null \
   && [ ! -e "$C/build-sha.js" ] \
   && git -C "$C" check-ignore -q build-sha.js; then
  ok "a fresh clone loads build-sha.js, has not built it, and git ignores it"
else
  echo "UNCLEAR the fixture has no unbuilt, ignored script, so UNBUILT has nothing to answer"
  exit 2
fi

echo
echo "-- the good paths --"
run "$C"
CLEAN_COUNT="$(printf '%s\n' "$OUT" | sed -n 's/.*PARSES — \([0-9]*\) files.*/\1/p')"
[ "$EXIT" = 0 ] && [ -n "$CLEAN_COUNT" ] \
  && ok "a fresh clone PARSES, exit 0, $CLEAN_COUNT files" || bad "a fresh clone did not PARSE" "$OUT"
printf '%s\n' "$OUT" | grep -q 'UNBUILT — diary/index.html loads build-sha.js' \
  && ok "and build-sha.js is called UNBUILT, by the page that loads it" || bad "build-sha.js was not called UNBUILT" "$OUT"
printf '%s\n' "$OUT" | grep -q 'BROKEN' \
  && bad "an unbuilt file was called BROKEN" "$OUT" || ok "and nothing is called BROKEN"
printf '%s\n' "$OUT" | grep -q 'more were not looked at' \
  && ok "the skipped file is counted on the clean run's own face" || bad "the clean run hid what it skipped" "$OUT"
[ -z "$(git -C "$C" status --porcelain)" ] \
  && ok "and the tree is untouched: a read tool that writes is a different tool" || bad "the tool wrote into the tree" "$(git -C "$C" status --porcelain)"

B="$ROOT/built"; clone "$B"
echo 'window.BUILD_SHA = "0000000";' > "$B/build-sha.js"
[ -f "$B/build-sha.js" ] || { echo "UNCLEAR the built fixture was not built"; exit 2; }
run "$B"
BUILT_COUNT="$(printf '%s\n' "$OUT" | sed -n 's/.*PARSES — \([0-9]*\) files.*/\1/p')"
[ "$EXIT" = 0 ] && ! printf '%s\n' "$OUT" | grep -q UNBUILT \
  && ok "a built tree PARSES with nothing UNBUILT" || bad "a built tree still had something UNBUILT" "$OUT"
[ -n "$BUILT_COUNT" ] && [ -n "$CLEAN_COUNT" ] && [ "$BUILT_COUNT" -gt "$CLEAN_COUNT" ] \
  && ok "and checks more files than the unbuilt one ($BUILT_COUNT against $CLEAN_COUNT)" \
  || bad "building the tree did not widen what was checked ($BUILT_COUNT against $CLEAN_COUNT)" "$OUT"

echo
echo "-- BROKEN, the Day 37 way: a typographic quote in a page script --"
Q="$ROOT/quote"; clone "$Q"
cp "$Q/reckoning/page.js" "$ROOT/page.js.orig"
printf '\nvar dayThirtySeven = [’a’, ’b’];\n' >> "$Q/reckoning/page.js"
if cmp -s "$Q/reckoning/page.js" "$ROOT/page.js.orig" || node --check "$Q/reckoning/page.js" 2>/dev/null; then
  bad "the sabotage did not land: page.js still parses"
else
  run "$Q"
  [ "$EXIT" = 1 ] && ok "exit 1" || bad "a page script that does not parse got exit $EXIT" "$OUT"
  printf '%s\n' "$OUT" | grep -q 'BROKEN — reckoning/page.js does not parse, and reckoning/index.html loads it' \
    && ok "names the file and the page that loads it" || bad "did not name page.js and its page" "$OUT"
  printf '%s\n' "$OUT" | grep -q '^parses:     .*SyntaxError' \
    && ok "and prints node's own complaint" || bad "printed no SyntaxError" "$OUT"
fi

echo
echo "-- BROKEN: a page loads a tracked file that is not there --"
M="$ROOT/missing"; clone "$M"
GHOST="ghost-$$.js"
sed -i "s#</body>#<script src=\"$GHOST\"></script></body>#" "$M/index.html"
if ! grep -q "$GHOST" "$M/index.html"; then
  bad "the sabotage did not land: index.html loads no $GHOST"
else
  run "$M"
  [ "$EXIT" = 1 ] && printf '%s\n' "$OUT" | grep -q "BROKEN — index.html loads $GHOST, and there is no such file" \
    && ok "exit 1, and the missing file is named with its page" || bad "a missing, tracked script was not BROKEN" "$OUT"
  printf '%s\n' "$OUT" | grep -q "UNBUILT — index.html loads $GHOST" \
    && bad "a file git does not ignore was excused as UNBUILT" "$OUT" || ok "and it is not excused as UNBUILT"
fi

echo
echo "-- BROKEN: a tool, which no page loads --"
T="$ROOT/tool"; clone "$T"
TJS="zz-$$-unparsed.js"
printf 'const = ;\n' > "$T/tools/$TJS"
if node --check "$T/tools/$TJS" 2>/dev/null; then
  bad "the sabotage did not land: the planted tool parses"
else
  run "$T"
  [ "$EXIT" = 1 ] && printf '%s\n' "$OUT" | grep -q "BROKEN — tools/$TJS does not parse$" \
    && ok "exit 1, named, and no page is said to load it" || bad "an unparsable tool was not BROKEN on its own" "$OUT"
fi

echo
echo "-- UNCLEAR: no git to ask --"
N="$ROOT/nogit"; mkdir -p "$N"
(cd "$C" && tar -cf - --exclude=.git .) | (cd "$N" && tar -xf -)
if [ -e "$N/.git" ] || git -C "$N" rev-parse --git-dir >/dev/null 2>&1; then
  echo "UNCLEAR the no-git fixture can still reach a git"
  exit 2
fi
run "$N"
[ "$EXIT" = 2 ] && printf '%s\n' "$OUT" | grep -q 'UNCLEAR — diary/index.html loads build-sha.js, there is no such file, and there is no git here' \
  && ok "exit 2: with no git a missing file is neither excused nor convicted" || bad "a missing file with no git to ask was not UNCLEAR" "$OUT"
printf '%s\n' "$OUT" | grep -q 'UNCLEAR — [0-9]* files parse, and 1 could not be found or accounted for' \
  && ok "and the summary counts the one it could not account for" || bad "the UNCLEAR summary line is missing or miscounts" "$OUT"
printf '%s\n' "$OUT" | grep -q 'BROKEN\|UNBUILT' \
  && bad "with no git it still claimed BROKEN or UNBUILT" "$OUT" || ok "and claims neither BROKEN nor UNBUILT"

printf '\nvar dayThirtySeven = [’a’];\n' >> "$N/reckoning/page.js"
if node --check "$N/reckoning/page.js" 2>/dev/null; then
  bad "the sabotage did not land in the no-git tree"
else
  run "$N"
  [ "$EXIT" = 1 ] && ok "a real BROKEN outranks an UNCLEAR: exit 1" || bad "BROKEN with no git got exit $EXIT" "$OUT"
  printf '%s\n' "$OUT" | grep -q 'UNCLEAR — diary/index.html loads build-sha.js' \
    && ok "and the UNCLEAR file is still named under it" || bad "the BROKEN verdict swallowed the UNCLEAR line" "$OUT"
fi

echo
echo "-- a src in single quotes (Ember's, Day 68) --"
# The tool's comment said "quotes either way round" from Day 37, and the
# grep read double quotes only, so a page loading a script in single quotes
# had that script never opened and nothing printed about it.
SQ="$ROOT/single"; clone "$SQ"
SJS="sq-$$.js"
printf 'const = ;\n' > "$SQ/$SJS"
sed -i "s#</body>#<script src='$SJS'></script></body>#" "$SQ/index.html"
if ! grep -q "src='$SJS'" "$SQ/index.html" || node --check "$SQ/$SJS" 2>/dev/null; then
  bad "the sabotage did not land: no single-quoted src loading an unparsable file"
else
  run "$SQ"
  [ "$EXIT" = 1 ] && printf '%s\n' "$OUT" | grep -q "BROKEN — $SJS does not parse, and index.html loads it" \
    && ok "a script loaded in single quotes is opened, and its fault is BROKEN" || bad "a single-quoted src was never opened" "$OUT"
fi

echo
echo "-- a script two pages load is checked once --"
DU="$ROOT/dup"; clone "$DU"
grep -q 'src="reckoning/page.js"' "$DU/index.html" && { echo "UNCLEAR index.html already loads page.js"; exit 2; }
sed -i 's#</body>#<script src="reckoning/page.js"></script></body>#' "$DU/index.html"
if ! grep -q 'src="reckoning/page.js"' "$DU/index.html" || ! grep -rq --include=index.html 'src="page.js"' "$DU/reckoning"; then
  bad "the sabotage did not land: page.js is not loaded by two pages"
else
  run "$DU"
  DUP_COUNT="$(printf '%s\n' "$OUT" | sed -n 's/.*PARSES — \([0-9]*\) files.*/\1/p')"
  [ "$EXIT" = 0 ] && [ -n "$DUP_COUNT" ] && [ "$DUP_COUNT" = "$CLEAN_COUNT" ] \
    && ok "a second page loading page.js leaves the count at $CLEAN_COUNT" || bad "a script loaded twice was counted twice ($DUP_COUNT against $CLEAN_COUNT)" "$OUT"
fi

echo
echo "-- what it does not check --"
O="$ROOT/offsite"; clone "$O"
sed -i 's#</body>#<script src="https://example.invalid/x.js"></script></body>#' "$O/index.html"
if ! grep -q 'example.invalid' "$O/index.html"; then
  bad "the sabotage did not land: index.html loads nothing off the tower"
else
  run "$O"
  [ "$EXIT" = 0 ] && printf '%s\n' "$OUT" | grep -q 'loads https://example.invalid/x.js from off this tower — not checked' \
    && ok "a script from off the tower is named and not checked" || bad "an off-tower script was not named as unchecked" "$OUT"
fi

echo
echo "-- UNCLEAR: an empty domain --"
E="$ROOT/empty"; mkdir -p "$E/tools"
echo '<!doctype html><title>no script</title><p>nothing</p>' > "$E/index.html"
run "$E"
[ "$EXIT" = 2 ] && printf '%s\n' "$OUT" | grep -q 'no JavaScript at all' \
  && ok "pages and no JavaScript: exit 2, never PARSES" || bad "an empty domain was not UNCLEAR" "$OUT"
mkdir -p "$ROOT/nohtml"
run "$ROOT/nohtml"
[ "$EXIT" = 2 ] && printf '%s\n' "$OUT" | grep -q 'no HTML found' \
  && ok "no HTML at all: exit 2" || bad "a tree with no HTML was not UNCLEAR" "$OUT"
run "$ROOT/not-a-directory"
[ "$EXIT" = 2 ] && printf '%s\n' "$OUT" | grep -q 'is not a directory' \
  && ok "a path that is not a directory: exit 2" || bad "a missing directory was not UNCLEAR" "$OUT"

echo
echo "-- the argument list --"
run "$C" "$C"
[ "$EXIT" = 2 ] && printf '%s\n' "$OUT" | grep -q 'INVALID' \
  && ok "two arguments: INVALID, exit 2" || bad "two arguments were not refused" "$OUT"
run --help
[ "$EXIT" = 0 ] && printf '%s\n' "$OUT" | grep -q '^usage:' \
  && ok "--help: usage, exit 0" || bad "--help did not print usage and exit 0" "$OUT"

echo
if [ "$fails" -gt 0 ]; then echo "parses-breaks: $fails red"; exit 1; fi
echo "parses-breaks: all cases green"
