#!/usr/bin/env bash
# tools/day-line.sh — the two methods, on one line, anywhere on the earth.
#
# Day 21. `usno()` folded its answer into a single UTC day, nought to
# fourteen forty. `solarDay()` does not fold: it returns minutes after 00:00
# UTC **of the civil date** and is free to come back negative or past a day,
# because that is the truth about an event standing on the far side of a UTC
# midnight. Nothing joined the two, and `reckon()` subtracted them anyway.
#
# So the cross-check — the one thing in this tower whose entire job is to be
# able to disagree — reported a whole day of disagreement between two methods
# that agree to a third of a minute, and the page printed it to a reader as
# `they differ at sunrise by 86379.0 seconds`, directly under two times that
# agree to the minute. Nothing crashed. Nothing came back NaN. Both printed
# times stayed right, because `clockFace` takes a modulo and lands on its
# feet.
#
#   Tokyo,     2026-08-24:  A sunrise −233.03 min UTC.  Reported gap −1439.65
#   Anchorage, 2026-08-24:  A sunset  1770.16 min UTC.  Reported gap +1438.74
#   Paris,     2026-08-24:  A 295.86 and 1129.11.       Reported gap +0.56, −0.73
#
# It is not a latitude fault. Every guard in `reckoning.js` that has never
# fired is a latitude guard, and all three of us have been watching latitude.
# This one is **longitude**, and the band in which it is invisible narrows as
# the latitude climbs: ±85° at the equator, ±58° at Paris's latitude, ±14° at
# 65°N. Paris is 2.35° from Greenwich. The tower has spent twenty-one days
# near the centre of the only strip of the earth where the subtraction is
# right, and would have published nonsense on its first morning anywhere else.
#
# The repair does not consult method A. Sliding B to whichever day-line sits
# nearest A's answer works, and makes the subtraction incapable of returning
# more than half a day — which is to say it makes the check unable to fail in
# the one direction it exists for, and this house has now written that rule
# down three times. So B names its own line: local mean time is in [0, 24) by
# definition of a local day, UT is that minus the longitude in hours, and UT
# is what is allowed to fall outside the day.
#
# On top of that sits a bound, which is Day 16's second guard in different
# clothes: once a quantity can be a whole day out, telling a *disagreement*
# from a *wrap* is a question somebody has to answer out loud. Past the bound
# the tower refuses — no tidy number, the raw gap published beside the
# refusal.
#
# Everything below runs in a `mktemp -d` copy and the real ledger's bytes are
# checked at the end regardless of how the run goes (Day 10). Every fixture
# asserts it was BUILT as hard as it asserts its sabotage landed (Day 17),
# and every sabotage is proved to have made a tool that still RUNS (Day 19).
#
# usage: ./tools/day-line.sh
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LEDGER="$ROOT/reckoning/ledger.json"
LEDGER_BEFORE="$(shasum "$LEDGER" | cut -d' ' -f1)"

fails=0
ok()  { echo "ok    $1"; }
bad() { echo "FAIL  $1"; fails=$((fails + 1)); }

finish() {
  local after
  after="$(shasum "$LEDGER" | cut -d' ' -f1)"
  if [ "$after" != "$LEDGER_BEFORE" ]; then
    echo "FAIL  the real ledger's bytes MOVED during this run"
    fails=$((fails + 1))
  else
    ok "the real ledger's bytes are untouched"
  fi
  echo ""
  if [ "$fails" -eq 0 ]; then echo "day-line: PASS"; else echo "day-line: $fails FAILED"; fi
  exit $(( fails == 0 ? 0 : 1 ))
}
trap finish EXIT

DATE="2026-08-24"

# Three places off the Greenwich band, one on it. Tokyo's *sunrise* falls
# before the UTC day begins; Anchorage's *sunset* falls after it ends;
# Wellington is past the date line. Paris is the control, and its job is to
# fail nothing — the fix must not move a number this tower has published.
TOKYO="{ name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, zone: 'Asia/Tokyo' }"
ANCHORAGE="{ name: 'Anchorage', latitude: 61.2181, longitude: -149.9003, zone: 'America/Anchorage' }"
WELLINGTON="{ name: 'Wellington', latitude: -41.2866, longitude: 174.7756, zone: 'Pacific/Auckland' }"
PARIS="{ name: 'Paris', latitude: 48.8566, longitude: 2.3522, zone: 'Europe/Paris' }"

# ---- scratch trees ----------------------------------------------------
#
# `build <sabotage>` copies the instrument and the write tool into a fresh
# tree and applies one named sabotage to the copy. `none` copies it clean.

build() {
  local kind="$1" work
  work="$(mktemp -d)"
  mkdir -p "$work/tools" "$work/reckoning"
  cp "$ROOT/reckoning/reckoning.js" "$work/reckoning/"
  cp "$ROOT/tools/reckon.js" "$work/tools/"
  echo '[]' > "$work/reckoning/ledger.json"

  case "$kind" in
    none) ;;
    # Put the fold back — method B answering in a day of its own again.
    # By substitution and not by sha: a sha rots when history is rewritten,
    # and this sandbox has already lied to us once about its own floor
    # (Day 8).
    fold)
      perl -0pi -e 's|return \(localMeanInItsOwnDay - lngHour\) \* 60;|return (((localMean - lngHour) % 24) + 24) % 24 * 60;|' \
        "$work/reckoning/reckoning.js" ;;
    # Make the two methods genuinely come apart, by two hours, with no wrap
    # anywhere near it. This is the fixture the bound exists for, and it has
    # to be a real disagreement rather than a day-line artefact — otherwise
    # the bound would only ever have been tested against the thing the
    # day-line fix already removes.
    apart)
      perl -0pi -e 's|var localMeanInItsOwnDay = \(\(localMean % 24\) \+ 24\) % 24;|var localMeanInItsOwnDay = ((localMean % 24) + 24) % 24 + 2;|' \
        "$work/reckoning/reckoning.js" ;;
    *) echo "build: unknown sabotage '$kind'" >&2; exit 2 ;;
  esac
  echo "$work"
}

# The bytes moved AND the module still answers. Day 19: a substitution can
# land in the text and produce a file that will not load, and then every case
# under it fails blaming the fixture while node prints a module error into
# the same buffer.
assert_built() {
  local work="$1" kind="$2" label="$3" out
  case "$kind" in
    none)
      grep -q 'return (localMeanInItsOwnDay - lngHour) \* 60;' "$work/reckoning/reckoning.js" \
        || { bad "$label: the clean copy is NOT the repaired instrument"; return 1; } ;;
    fold)
      grep -q 'return (((localMean - lngHour) % 24) + 24) % 24 \* 60;' "$work/reckoning/reckoning.js" \
        || { bad "$label: the fold sabotage did NOT land"; return 1; }
      grep -q 'return (localMeanInItsOwnDay - lngHour) \* 60;' "$work/reckoning/reckoning.js" \
        && { bad "$label: the repaired line is still there — sabotage did not replace it"; return 1; } ;;
    apart)
      grep -q '% 24 + 2;' "$work/reckoning/reckoning.js" \
        || { bad "$label: the two-hour sabotage did NOT land"; return 1; } ;;
  esac
  out="$(node -e "require('$work/reckoning/reckoning.js').reckon('$DATE', $PARIS)" 2>&1)"
  if [ $? -ne 0 ]; then
    bad "$label: the instrument does not RUN — $(printf '%s' "$out" | head -1)"; return 1
  fi
  return 0
}

# Print the gap the tool believes in, for one place, out of one tree.
gap() {
  local work="$1" place="$2" which="$3"
  node -e "
    const R = require('$work/reckoning/reckoning.js');
    const c = R.reckon('$DATE', $place).crossCheck;
    process.stdout.write(String(c['${which}GapMinutes'] !== undefined
      ? c['${which}GapMinutes']
      : c['${which}DifferenceMinutes']));
  " 2>/dev/null
}

# ---------------------------------------------------------------------
echo "--- the repaired instrument, off the Greenwich band"

CLEAN="$(build none)"
if assert_built "$CLEAN" none "clean"; then
  for pair in "Tokyo:$TOKYO:sunrise" "Anchorage:$ANCHORAGE:sunset" "Wellington:$WELLINGTON:sunrise"; do
    NAME="${pair%%:*}"; REST="${pair#*:}"; PLACE="${REST%:*}"; WHICH="${REST##*:}"
    G="$(gap "$CLEAN" "$PLACE" "$WHICH")"
    node -e "process.exit(Math.abs($G) <= 60 ? 0 : 1)" \
      && ok "clean: $NAME $WHICH gap is $G min — inside the bound" \
      || bad "clean: $NAME $WHICH gap is $G min — outside the bound"
  done
  # The refusal must NOT fire on an honest day. Day 5: write the pass rule so
  # the unbroken case would fail it, and then check the unbroken case does not.
  node -e "
    const R = require('$CLEAN/reckoning/reckoning.js');
    for (const p of [$TOKYO, $ANCHORAGE, $WELLINGTON, $PARIS]) {
      const c = R.reckon('$DATE', p).crossCheck;
      if (c.beyondBound) { console.error(p.name + ' refused'); process.exit(1); }
      if (c.sunriseDifferenceMinutes === null || c.sunsetDifferenceMinutes === null) {
        console.error(p.name + ' published no difference'); process.exit(1);
      }
    }
  " 2>/dev/null \
    && ok "clean: no honest place is refused, and every one publishes a difference" \
    || bad "clean: an honest place was refused or published no difference"
fi

echo ""
echo "--- the same four places, with the fold put back"
#
# This is the MADE TO FAIL half, and it is the whole reason the cases above
# mean anything. Against the pre-fix instrument the three off-meridian cases
# must go red — and Paris, the control, must stay green, because the fault
# was never visible from here.

FOLD="$(build fold)"
if assert_built "$FOLD" fold "folded"; then
  for pair in "Tokyo:$TOKYO:sunrise" "Anchorage:$ANCHORAGE:sunset" "Wellington:$WELLINGTON:sunrise"; do
    NAME="${pair%%:*}"; REST="${pair#*:}"; PLACE="${REST%:*}"; WHICH="${REST##*:}"
    G="$(gap "$FOLD" "$PLACE" "$WHICH")"
    node -e "process.exit(Math.abs(Math.abs($G) - 1440) < 5 ? 0 : 1)" \
      && ok "folded: $NAME $WHICH is a whole day out ($G min) — the fault reproduces" \
      || bad "folded: $NAME $WHICH came back $G min — expected about 1440"
  done
  # Paris, and this is the load-bearing block in the file. It is two cases
  # and not one, because the first version of it was a single string
  # comparison asserting the two forms give *the same number*, and that is
  # false — it went red on the first run and it was right to. The fold used
  # to be taken after the longitude was subtracted and is now taken before;
  # that is a reassociation, and floating-point addition does not associate.
  # Half the year's Paris figures move in their last bits.
  #
  # So the two claims are held apart. What must be exactly true is that
  # nothing the tower publishes moves. What must be true only to a stated
  # tolerance is the raw difference, and the tolerance carries its witness
  # rather than being a number picked to make a case go green.
  node -e "
    const NEW = require('$CLEAN/reckoning/reckoning.js');
    const OLD = require('$FOLD/reckoning/reckoning.js');
    const P = $PARIS;
    let moved = 0;
    for (let d = 1; d <= 365; d++) {
      const date = new Date(Date.UTC(2026, 0, d)).toISOString().slice(0, 10);
      const a = NEW.reckon(date, P), b = OLD.reckon(date, P);
      for (const k of ['sunrise', 'sunset', 'solarNoon', 'dayLength']) {
        if (a[k] !== b[k]) { console.error(date + ' ' + k + ': ' + b[k] + ' -> ' + a[k]); moved++; }
      }
      if (a.crossCheck.sunrise !== b.crossCheck.sunrise) { console.error(date + ' B sunrise moved'); moved++; }
      if (a.crossCheck.sunset !== b.crossCheck.sunset) { console.error(date + ' B sunset moved'); moved++; }
    }
    process.exit(moved === 0 ? 0 : 1);
  " 2>/dev/null \
    && ok "Paris: not one published field moves across all of 2026" \
    || bad "Paris: the repair MOVED a field this tower publishes"

  # And the raw figures, which do move. Measured on 2026-08-24: 360 of the
  # year's 730 Paris cross-check numbers differ, the worst by 2.27e-13
  # minutes — fourteen picoseconds, a ten-billionth of the tenth of a second
  # the page prints to. The bound here is 1e-9 minutes, four orders above
  # the observed worst and eight below anything a reader could see. A case
  # that merely asserted "close enough" would pass over a real repair going
  # wrong by a second; this one would not.
  node -e "
    const NEW = require('$CLEAN/reckoning/reckoning.js');
    const OLD = require('$FOLD/reckoning/reckoning.js');
    const P = $PARIS;
    let worst = 0, differing = 0;
    for (let d = 1; d <= 365; d++) {
      const date = new Date(Date.UTC(2026, 0, d)).toISOString().slice(0, 10);
      const a = NEW.reckon(date, P).crossCheck, b = OLD.reckon(date, P).crossCheck;
      for (const k of ['sunriseDifferenceMinutes', 'sunsetDifferenceMinutes']) {
        const gap = Math.abs(a[k] - b[k]);
        if (gap > 0) differing++;
        worst = Math.max(worst, gap);
      }
    }
    process.stderr.write(differing + ' of 730 differ, worst ' + worst.toExponential(2) + ' min');
    process.exit(worst < 1e-9 ? 0 : 1);
  " 2>/tmp/day-line-paris.$$ \
    && ok "Paris raw figures: $(cat /tmp/day-line-paris.$$) — reassociation only" \
    || bad "Paris raw figures: $(cat /tmp/day-line-paris.$$) — more than reassociation"
  rm -f /tmp/day-line-paris.$$
fi
rm -rf "$FOLD"

echo ""
echo "--- the bound, on two methods that have genuinely come apart"

APART="$(build apart)"
if assert_built "$APART" apart "apart"; then
  # Two hours is a real disagreement, not a day-line artefact: it is nowhere
  # near 1440, so this case cannot be passed by anything the day-line fix
  # does. Day 14's rule — two verdicts that catch different lies must be
  # shown not to substitute for each other.
  G="$(gap "$APART" "$PARIS" sunrise)"
  node -e "process.exit(Math.abs(Math.abs($G) - 120) < 5 ? 0 : 1)" \
    && ok "apart: the raw gap is $G min — a real two-hour disagreement, not a wrap" \
    || bad "apart: the raw gap is $G min — the fixture is not the disagreement it is named for"
  node -e "
    const R = require('$APART/reckoning/reckoning.js');
    const c = R.reckon('$DATE', $PARIS).crossCheck;
    if (!c.beyondBound) { console.error('not refused'); process.exit(1); }
    if (c.sunriseDifferenceMinutes !== null) { console.error('still published a difference'); process.exit(1); }
    if (typeof c.sunriseGapMinutes !== 'number') { console.error('no raw gap published'); process.exit(1); }
  " 2>/dev/null \
    && ok "apart: the tower refuses, publishes no difference, and shows the raw gap" \
    || bad "apart: the tower did not refuse, or softened the number, or hid the gap"

  # And the write tool has to SAY it, not merely hold it. A refusal a keeper
  # never reads is the Day 13 fault: a clean exit-0 report read as the answer
  # to the question that was asked.
  perl -0pi -e "s|  return todayAt\(STANDING\.place\.zone\);|  return '$DATE';|" "$APART/tools/reckon.js"
  grep -q "return '$DATE';" "$APART/tools/reckon.js" \
    && ok "apart: the morning was pinned to $DATE" \
    || bad "apart: the morning was NOT pinned"
  OUT="$(node "$APART/tools/reckon.js" 2>&1)"
  printf '%s' "$OUT" | grep -q 'SECOND METHOD REFUSED' \
    && ok "apart: the write tool says the second method was refused" \
    || bad "apart: the write tool said nothing about the refusal"
  printf '%s' "$OUT" | grep -q 'second method differs by' \
    && bad "apart: the write tool still printed a tidy difference" \
    || ok "apart: the write tool printed no tidy difference"
fi
rm -rf "$APART"

echo ""
echo "--- the witness, re-earned"
#
# The bound is a banked fact and this file will not let it read as a law
# (Day 5: a banked fact with no date on it reads as a law). The sweep is
# coarse here — the full one behind the comment in `reckoning.js` is 57,572
# samples — but it is run fresh every time this suite runs, and it asserts
# both halves: that no honest place anywhere on the ring exceeds the bound,
# and that the folded instrument does.

node -e "
  const R = require('$CLEAN/reckoning/reckoning.js');
  let worst = 0, n = 0;
  for (let lat = -60; lat <= 60; lat += 15) {
    for (let lon = -180; lon <= 180; lon += 20) {
      for (const d of ['2026-01-01','2026-03-20','2026-06-21','2026-09-23','2026-12-21']) {
        const c = R.reckon(d, { name: 'x', latitude: lat, longitude: lon, zone: 'UTC' }).crossCheck;
        if (!c) continue;
        n++;
        worst = Math.max(worst, Math.abs(c.sunriseGapMinutes), Math.abs(c.sunsetGapMinutes));
      }
    }
  }
  process.stderr.write(n + ' samples, worst honest gap ' + worst.toFixed(2) + ' min\n');
  process.exit(worst <= 60 ? 0 : 1);
" 2>/tmp/day-line-sweep.$$ \
  && ok "swept: $(cat /tmp/day-line-sweep.$$ | tr -d '\n') — all inside the bound" \
  || bad "swept: $(cat /tmp/day-line-sweep.$$ | tr -d '\n') — something is outside the bound"
rm -f /tmp/day-line-sweep.$$
rm -rf "$CLEAN"

# ---------------------------------------------------------------------
# MADE TO FAIL
#
# The `--- the same four places, with the fold put back` block above IS the
# made-to-fail proof, and it runs on every invocation rather than living in a
# comment: three cases that go red the moment the repair is undone, beside a
# Paris case that stays green either way and says on its own face why.
#
# The fourth block is the second sabotage, and it is deliberately a different
# *kind*. The fold is a day-line artefact; the two-hour shift is a real
# disagreement. If the bound had only ever been tested against the fold, it
# would be a guard whose only test-path runs through a hole the day-line fix
# already closed — Day 17's rule, met before it could bite.
#
# What this suite does NOT prove: that the repaired numbers are RIGHT off the
# Greenwich band. It proves the two methods are now on one line and that they
# agree there. Both of them could be wrong the same way and nothing in this
# tower would notice — that is Day 3's standing condition and no fixture here
# touches it. Only an almanac outside this tower, asked about a city this
# tower actually stands in, can say more. Ash's split, Day 18: a manufactured
# fixture proves the fix is correct; only a morning that really happens
# proves the system works.
