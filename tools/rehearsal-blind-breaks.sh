#!/usr/bin/env bash
# tools/rehearsal-blind-breaks.sh — the rehearsal's BLIND, split and broken on purpose.
#
#   ./tools/rehearsal-blind-breaks.sh
#
# Day 73. `tools/move-rehearsal.sh` gave BLIND to every suite red in its
# control copy, which covered two claims: *something about the copy turns
# this red* and *this is red on the tower as it stands*. Day 61's
# `second-drift.js` was the second, under the first's word. The rehearsal now
# runs such a suite once more on the tower itself and forks. The cases are
# Ember's, from its review of the plan before anything was built:
#
#   A  red everywhere, the tower too       -> RED HERE, and the run exits 4
#   B  red only in a dirty tree (both copies are dirtied by the STANDING
#      rewrite, the tower is clean — check-sight.sh's shape) -> BLIND
#   C  green everywhere                    -> ok, so the unbroken case would
#                                             fail a rule that wanted a red
#   D  red in the copies, stuck on the tower -> UNFINISHED, never green
#   E  a suite whose tower run writes into the tower -> the rehearsal stops
#
# The sabotage is written first: the third run cut, the old one-word line put
# back, asserted landed. A and B must then both read the old BLIND.
#
# The stubs are named only in the scratch tree (Day 45).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUBJECT="$ROOT/tools/move-rehearsal.sh"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT
FAILS=0
ok()  { printf 'ok    %s\n' "$1"; }
bad() { printf 'FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
CAP=8

# scratch_tower <dir> — a clone of HEAD with the battery taken out
scratch_tower() {
  git clone -q --local --no-checkout "$ROOT" "$1"
  git -C "$1" sparse-checkout set --no-cone '/*' '!/previews/'
  git -C "$1" checkout -q
  [ -e "$ROOT/node_modules" ] && ln -s "$(readlink -f "$ROOT/node_modules")" "$1/node_modules"
  for f in "$1"/tools/*.sh "$1"/tools/*.js; do
    case "$(basename "$f")" in
      way-in-page.js|way-in.js|move-rehearsal.sh) ;;
      *) git -C "$1" rm -q "tools/$(basename "$f")" ;;
    esac
  done
  # The subject is the working tree's, not HEAD's, so this morning's edit is
  # the one under test.
  cp "$SUBJECT" "$1/tools/move-rehearsal.sh"
}
stub() { printf '#!/usr/bin/env bash\n%s\n' "$3" > "$1/tools/$2"; chmod +x "$1/tools/$2"; }
commit() { git -C "$1" add -A; git -C "$1" -c user.email=scratch@scratch -c user.name=scratch commit -qm 'scratch tower'; }
clean_standing='git diff --quiet HEAD -- reckoning/reckoning.js'

T="$SCRATCH/tower"
scratch_tower "$T"
stub "$T" red-all.sh    'exit 1'
stub "$T" red-dirty.sh  "$clean_standing || exit 1"
stub "$T" green-all.sh  'exit 0'
stub "$T" stuck-tower.sh "$clean_standing && sleep $((CAP * 3)); exit 1"
commit "$T"

# Each fixture, asserted (Day 17): on the clean tower red-dirty is green and
# red-all is red; in a dirtied copy red-dirty is red.
(cd "$T" && ./tools/red-dirty.sh); g=$?
(cd "$T" && ./tools/red-all.sh); r=$?
D="$SCRATCH/dirty"; git clone -q --local "$T" "$D"; cp "$T/tools/"*.sh "$D/tools/"
echo '// dirtied' >> "$D/reckoning/reckoning.js"
(cd "$D" && ./tools/red-dirty.sh); d=$?
if [ "$g" -eq 0 ] && [ "$r" -ne 0 ] && [ "$d" -ne 0 ] && [ ! -e "$T/tools/banked-breaks.sh" ]; then
  ok "the fixture: four stubs; red-dirty green on the clean tower and red in a dirtied copy"
else
  bad "the fixture was not built (clean $g, all $r, dirty $d)"; exit 1
fi

rehearse() { OUT="$("$1" "$T" 2>&1)"; CODE=$?; }
line() { printf '%s\n' "$OUT" | grep -E "^[A-Za-z][A-Za-z ]* +$1" | head -1; }

# ---- the sabotage first: the third run cut ----
SAB="$SCRATCH/move-rehearsal.sh"
perl -pe 's/^    judge_red_control "\$suite" "\$ctl" (shell|browser)$/    blind "\$suite — red in the control copy too (exit \$ctl), so this rehearsal learned nothing about it"/' \
  "$SUBJECT" > "$SAB"
chmod +x "$SAB"
if cmp -s "$SUBJECT" "$SAB" || [ "$(grep -c 'judge_red_control "\$suite"' "$SAB")" -ne 0 ] \
   || [ "$(grep -c 'too (exit \$ctl), so this rehearsal learned nothing about it"$' "$SAB")" -ne 2 ]; then
  bad "the sabotage did not land in both halves"
else
  ok "the sabotage landed: the third run cut in both halves"
  MOVE_REHEARSAL_CAP=$CAP rehearse "$SAB"
  case "$(line red-all.sh)" in
    "BLIND red-all.sh — red in the control copy too"*) ok "sabotaged: red everywhere reads BLIND — the old word over a real red" ;;
    *) bad "sabotaged: wanted the old BLIND for red-all.sh, got: $(line red-all.sh)" ;;
  esac
  case "$(line red-dirty.sh)" in
    "BLIND red-dirty.sh — red in the control copy too"*) ok "sabotaged: red-in-a-dirty-tree reads the same BLIND — one word, two claims" ;;
    *) bad "sabotaged: wanted the old BLIND for red-dirty.sh, got: $(line red-dirty.sh)" ;;
  esac
  [ "$CODE" -eq 2 ] && ok "sabotaged: the run exits 2, a real red reported as could-not-conclude" \
    || bad "sabotaged: wanted exit 2, got $CODE"
fi

# ---- the subject ----
MOVE_REHEARSAL_CAP=$CAP rehearse "$SUBJECT"
case "$(line red-all.sh)" in
  "RED HERE red-all.sh — red on the tower as it stands too"*"(exit 1;"*"did not ask whether the move touches it") ok "A  red everywhere: RED HERE" ;;
  *) bad "A  red-all.sh: $(line red-all.sh)" ;;
esac
# Ash, reading the first draft: *nothing to do with the move* is a thing this
# run cannot know, since no moved copy was set against a green control for
# such a suite. Held from the comment, not the code (Day 68).
case "$(line red-all.sh)" in
  *"nothing to do with the move"*|*"not the move"*) bad "A' RED HERE claims to know the move is not involved: $(line red-all.sh)" ;;
  "RED HERE"*) ok "A' RED HERE does not claim the move is uninvolved" ;;
  *) bad "A' no RED HERE line to read" ;;
esac
case "$(line red-dirty.sh)" in
  "BLIND red-dirty.sh — red in the control copy (exit 1), green on the tower"*"something about the copy"*"Not an all-clear") ok "B  red only in a dirtied tree: BLIND, green on the tower, says *something about the copy*" ;;
  *) bad "B  red-dirty.sh: $(line red-dirty.sh)" ;;
esac
case "$(line green-all.sh)" in
  "ok    green-all.sh  ("*) ok "C  green everywhere: ok, no third run" ;;
  *) bad "C  green-all.sh: $(line green-all.sh)" ;;
esac
case "$(line stuck-tower.sh)" in
  "UNFINISHED stuck-tower.sh — red in the control copy (exit 1), and its run on the tower was stopped by the ${CAP}s cap, so whether it is red on the tower is unknown") ok "D  stuck on the tower: UNFINISHED, never green" ;;
  *) bad "D  stuck-tower.sh: $(line stuck-tower.sh)" ;;
esac
if [ "$CODE" -eq 4 ] && ! printf '%s\n' "$OUT" | grep -q '^FAIL'; then
  ok "the run exits 4 and no line says FAIL"
else
  bad "the run exited $CODE, or printed a FAIL"
fi
# The unfinished count is not pinned: the one browser suite kept (so the
# browser half is not empty) can outrun an 8 s cap on a slow desk, and that
# is the cap's business, proved in rehearsal-cap-breaks.sh, not this file's.
if printf '%s\n' "$OUT" | grep -qE "0 do not survive the move; 1 red on the tower itself; 1 blind; [0-9]+ did not finish inside the ${CAP}s cap"; then
  ok "the last sentence carries every count"
else
  bad "the last sentence: $(printf '%s\n' "$OUT" | grep '^move-rehearsal: no suite' )"
fi
if [ -z "$(git -C "$T" status --porcelain)" ]; then
  ok "the scratch tower was not written by its third runs"
else
  bad "the scratch tower changed: $(git -C "$T" status --porcelain | head -3)"
fi

# ---- E: a third run that writes into the tower ----
W="$SCRATCH/writer"
scratch_tower "$W"
stub "$W" writes-tower.sh "$clean_standing && echo scribble > scribble.txt; exit 1"
stub "$W" zz-after.sh 'exit 1'
commit "$W"
OUT="$(MOVE_REHEARSAL_CAP=$CAP "$SUBJECT" "$W" 2>&1)"; CODE=$?
if [ "$CODE" -eq 2 ] && [ -e "$W/scribble.txt" ] \
   && printf '%s\n' "$OUT" | grep -q "^FAIL  writes-tower.sh — its run on the tower itself changed the tower's working tree" \
   && ! printf '%s\n' "$OUT" | grep -q 'zz-after.sh'; then
  ok "E  a third run that writes stops the rehearsal before the next suite, exit 2"
else
  bad "E  writes-tower.sh: exit $CODE"; printf '%s\n' "$OUT" | grep -E '^(FAIL|RED|BLIND|ok)' | sed 's/^/        /'
fi

echo
if [ "$FAILS" -eq 0 ]; then echo "rehearsal-blind-breaks: ALL OK"; exit 0; fi
echo "rehearsal-blind-breaks: $FAILS failed"; exit 1
