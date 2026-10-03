#!/usr/bin/env bash
# tools/rehearsal-cap-breaks.sh — the rehearsal's stopwatch, broken on purpose.
#
#   ./tools/rehearsal-cap-breaks.sh
#
# Day 61. `tools/move-rehearsal.sh` runs every suite under a cap, and until
# this morning a suite the cap stopped was given the verdict of a suite that
# went red: BLIND when the control was stopped, FAIL — *green where the tower
# stands, red where it does not* — when only the moved copy was. Found the
# Saturday before the Ushuaia move, with `banked-breaks.sh` green at 633 s
# against a cap of 600. The cases are Ember's, written before the repair was
# tested against them:
#
#   A  a suite stopped in both copies is UNFINISHED, not BLIND
#   B  a suite stopped in the moved copy alone is UNFINISHED, never FAIL
#   C  a suite that exits 124 on its own, well inside the cap, is not UNFINISHED
#   D  a suite that fits is ok, and its line says how long it took
#   E  a rehearsal stopped from outside says it is no verdict
#   F  a cap that is not a number is refused, exit 3
#
# It rehearses a scratch tower whose tools/ holds three stub suites and
# nothing else of weight, so one run takes about a minute rather than an
# hour. The stubs are named only in the scratch tree (Day 45: a break-suite
# that spells its fixture into a subject reading tools/ gives it a door).
# Then it runs a copy of the rehearsal with the cap's fork cut out, asserts
# the cut landed, and requires A and B to come back as the old words.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUBJECT="$ROOT/tools/move-rehearsal.sh"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT
FAILS=0
ok()  { printf 'ok    %s\n' "$1"; }
bad() { printf 'FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
CAP=8

# ---- the scratch tower ----
T="$SCRATCH/tower"
git clone -q --local --no-checkout "$ROOT" "$T"
git -C "$T" sparse-checkout set --no-cone '/*' '!/previews/'
git -C "$T" checkout -q
[ -e "$ROOT/node_modules" ] && ln -s "$(readlink -f "$ROOT/node_modules")" "$T/node_modules"
for f in "$T"/tools/*.sh "$T"/tools/*.js; do
  case "$(basename "$f")" in
    parses.sh|way-in-page.js|way-in.js|move-rehearsal.sh) ;;
    *) git -C "$T" rm -q "tools/$(basename "$f")" ;;
  esac
done
# The zone the control stands in is the scratch tower's own, and the moved
# copy's is not; the stub tells them apart by asking its own copy. Asked of
# the scratch tower and never of $ROOT: a clone carries the commits and not
# the working tree, so inside a moved copy $ROOT stands somewhere its clone
# does not, and the first draft's stub slept in both copies there (found by
# the rehearsal on the day this file was written).
HOME_ZONE="$(node -e 'console.log(require(process.argv[1]).STANDING.place.zone)' "$T/reckoning/reckoning.js")"
stub() { printf '#!/usr/bin/env bash\n%s\n' "$2" > "$T/tools/$1"; chmod +x "$T/tools/$1"; }
here_zone='z="$(node -e '"'"'console.log(require("./reckoning/reckoning.js").STANDING.place.zone)'"'"')"'
stub sleeps-both.sh  "sleep $((CAP * 3))"
stub sleeps-moved.sh "$here_zone"$'\n'"[ \"\$z\" = \"$HOME_ZONE\" ] || sleep $((CAP * 3))"
stub own-124.sh      'exit 124'
git -C "$T" add -A
git -C "$T" -c user.email=scratch@scratch -c user.name=scratch commit -qm 'scratch tower'

if [ -x "$T/tools/sleeps-moved.sh" ] && [ ! -e "$T/tools/banked-breaks.sh" ]; then
  ok "the fixture: a scratch tower with three stubs, the battery taken out"
else
  bad "the fixture was not built"; exit 1
fi

# rehearse <script> <cap> -> sets OUT and CODE
rehearse() { OUT="$(MOVE_REHEARSAL_CAP="$2" "$1" "$T" 2>&1)"; CODE=$?; }
line() { printf '%s\n' "$OUT" | grep -E "^[A-Za-z]+ +$1" | head -1; }

# ---- the sabotage first: the fork cut out ----
SAB="$SCRATCH/move-rehearsal.sh"
perl -0pe 's/  if \[ "\$ctl_cap" -eq 1 \] \|\| \[ "\$mov_cap" -eq 1 \]; then\n    unfin [^\n]*\n  elif/  if false; then :\n  elif/g' \
  "$SUBJECT" > "$SAB"
chmod +x "$SAB"
if cmp -s "$SUBJECT" "$SAB" || [ "$(grep -c 'if false; then :' "$SAB")" -ne 2 ]; then
  bad "the sabotage did not land in both halves"
else
  ok "the sabotage landed: both forks cut"
  rehearse "$SAB" "$CAP"
  case "$(line sleeps-both.sh)" in
    BLIND*124*) ok "sabotaged: a stub stopped in both copies reads BLIND, exit 124 — the old word" ;;
    *) bad "sabotaged: wanted BLIND for sleeps-both.sh, got: $(line sleeps-both.sh)" ;;
  esac
  case "$(line sleeps-moved.sh)" in
    FAIL*124*) ok "sabotaged: a stub stopped in the moved copy alone reads FAIL — the clock accusing the move" ;;
    *) bad "sabotaged: wanted FAIL for sleeps-moved.sh, got: $(line sleeps-moved.sh)" ;;
  esac
fi

# ---- the subject ----
rehearse "$SUBJECT" "$CAP"
case "$(line sleeps-both.sh)" in
  "UNFINISHED sleeps-both.sh — stopped by the ${CAP}s cap in both copies"*) ok "A  stopped in both copies: UNFINISHED" ;;
  *) bad "A  sleeps-both.sh: $(line sleeps-both.sh)" ;;
esac
case "$(line sleeps-moved.sh)" in
  "UNFINISHED sleeps-moved.sh — stopped by the ${CAP}s cap in the moved copy"*) ok "B  stopped in the moved copy alone: UNFINISHED, and it says which copy" ;;
  *) bad "B  sleeps-moved.sh: $(line sleeps-moved.sh)" ;;
esac
case "$(line own-124.sh)" in
  BLIND*own-124.sh*"exit 124"*) ok "C  a suite exiting 124 on its own is not called stopped: BLIND, exit 124" ;;
  *) bad "C  own-124.sh: $(line own-124.sh)" ;;
esac
case "$(line parses.sh)" in
  "ok    parses.sh  ("*"s, "*"s of ${CAP}s)") ok "D  a suite that fits is ok and its line carries its seconds" ;;
  *) bad "D  parses.sh: $(line parses.sh)" ;;
esac
if [ "$CODE" -eq 2 ] && ! printf '%s\n' "$OUT" | grep -q '^FAIL'; then
  ok "the run abstains, exit 2, and no line says FAIL"
else
  bad "the run exited $CODE, or printed a FAIL"; printf '%s\n' "$OUT" | grep -E '^(FAIL|UNFINISHED|BLIND)' | sed 's/^/        /'
fi
if printf '%s\n' "$OUT" | grep -q 'did not finish inside the '"${CAP}"'s cap'; then
  ok "the last sentence names the cap"
else
  bad "the last sentence does not name the cap"
fi

# ---- E: stopped from outside ----
EOUT="$SCRATCH/killed.txt"
MOVE_REHEARSAL_CAP=60 setsid "$SUBJECT" "$T" > "$EOUT" 2>&1 &
PID=$!
for _ in $(seq 1 60); do grep -q '^ok    parses.sh' "$EOUT" && break; sleep 1; done
kill -TERM -- "-$PID" 2>/dev/null
wait "$PID"; ECODE=$?
if [ "$ECODE" -eq 2 ] && grep -q '^UNFINISHED the rehearsal itself' "$EOUT" && grep -q 'no verdict' "$EOUT"; then
  ok "E  a rehearsal stopped from outside says it is no verdict, exit 2"
else
  bad "E  stopped from outside: exit $ECODE"; tail -4 "$EOUT" | sed 's/^/        /'
fi

# ---- F: a cap that is not a number ----
MOVE_REHEARSAL_CAP=soon "$SUBJECT" "$T" >/dev/null 2>"$SCRATCH/f.txt"; FCODE=$?
if [ "$FCODE" -eq 3 ] && grep -q 'INVALID' "$SCRATCH/f.txt"; then
  ok "F  a cap that is not a number is refused, exit 3"
else
  bad "F  MOVE_REHEARSAL_CAP=soon exited $FCODE"
fi

echo
if [ "$FAILS" -eq 0 ]; then echo "rehearsal-cap-breaks: ALL OK"; exit 0; fi
echo "rehearsal-cap-breaks: $FAILS failed"; exit 1
