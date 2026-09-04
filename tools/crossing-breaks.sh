#!/usr/bin/env bash
# tools/crossing-breaks.sh — make the season crossing fail, on purpose.
#
#     ./tools/crossing-breaks.sh
#
# Built Day 16, and built because the fault it guards actually happened
# here that morning. The first draft of findCrossing() looked for a sign
# change in the gap between the sun's longitude and the target. That gap
# runs from −180 to +180 across the year and then falls off the end back
# to −180, and the fall is a sign change too. So asked for the September
# equinox the instrument returned the March one, and asked for the
# December solstice it returned June. Right units, right shape, six
# months out, no error, no warning, no NaN. It was caught by printing all
# four crossings side by side and noticing two pairs were identical.
#
# Day 5's rule governs everything below: a check that cannot break always
# passes. Every case asserts its own sabotage landed — `cmp` the file
# before and after — and only then asks what the instrument says.
#
# Day 10's rule governs the rest: never test against the thing at risk.
# The tower is copied into a mktemp -d and the real reckoning/ledger.json
# is checked, byte for byte, at the end regardless of what happened.

set -u

here="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
ledger_before="$(cksum "$here/reckoning/ledger.json")"

cleanup() {
  rm -rf "$work"
  ledger_after="$(cksum "$here/reckoning/ledger.json")"
  if [ "$ledger_before" != "$ledger_after" ]; then
    echo "FAIL  the real ledger changed while this test ran — that must never happen"
    exit 1
  fi
}
trap cleanup EXIT

cp "$here/reckoning/reckoning.js" "$work/pristine.js"

fails=0
ok()   { echo "ok    $1"; }
bad()  { echo "FAIL  $1"; fails=$((fails + 1)); }

# Rewrite one string in a scratch copy and prove the rewrite landed before
# anything is concluded from what the copy does.
sabotage() {
  local from="$1" to="$2"
  cp "$work/pristine.js" "$work/broken.js"
  node -e '
    const fs = require("fs");
    const p = process.argv[1], from = process.argv[2], to = process.argv[3];
    const before = fs.readFileSync(p, "utf8");
    const after = before.split(from).join(to);
    if (after === before) { process.exit(9); }
    fs.writeFileSync(p, after);
  ' "$work/broken.js" "$from" "$to"
  local status=$?
  if [ $status -eq 9 ]; then
    bad "the sabotage never landed: \"$from\" is not in reckoning.js any more (a test that cannot break always passes)"
    return 1
  fi
  if ! cmp -s "$work/pristine.js" "$work/broken.js"; then
    return 0
  fi
  bad "the scratch copy is identical to the pristine one after sabotage"
  return 1
}

# Ask the broken copy for one crossing. Prints REFUSED:<message>, or
# RETURNED:<instant>.
ask() {
  node -e '
    const r = require(process.argv[1]);
    try {
      const x = r.seasonCrossing(Number(process.argv[3]), process.argv[2]);
      console.log("RETURNED:" + x.instantUTC);
    } catch (e) {
      console.log("REFUSED:" + e.message);
    }
  ' "$work/broken.js" "$1" "$2" 2>&1 | tail -1
}

echo "--- the tower as it stands"
cp "$work/pristine.js" "$work/broken.js"
for key in marchEquinox juneSolstice septemberEquinox decemberSolstice; do
  answer="$(ask "$key" 2026)"
  case "$answer" in
    RETURNED:*) ok "$key: ${answer#RETURNED:}" ;;
    *) bad "$key refused on an honest tree: $answer" ;;
  esac
done

# The four must be four. This is the assertion that would have caught the
# real fault on the morning it happened, and it needs no almanac: two
# crossings of one year cannot share an instant.
distinct="$(node -e '
  const r = require(process.argv[1]);
  const seen = new Set();
  for (const s of r.SEASON_CROSSINGS) seen.add(r.seasonCrossing(2026, s.key).instantUTC);
  console.log(seen.size);
' "$work/broken.js")"
if [ "$distinct" = "4" ]; then
  ok "the four crossings of 2026 are four different instants"
else
  bad "the four crossings of 2026 collapsed to $distinct distinct instants"
fi

echo
echo "--- case 1: disable the wrap guard, which is the fault that happened"
if sabotage 'var CROSSING_MAX_GAP_DEGREES = 90;' 'var CROSSING_MAX_GAP_DEGREES = 1000;'; then
  answer="$(ask septemberEquinox 2026)"
  case "$answer" in
    REFUSED:*not\ at\ longitude*) ok "September is refused rather than answered with March — $answer" ;;
    REFUSED:*) bad "refused, but not by the residual guard: $answer" ;;
    *) bad "the instrument answered anyway, which is the silent wrong answer: $answer" ;;
  esac
fi

echo
echo "--- case 2: aim the residual guard at a longitude the bisection did not solve"
if sabotage 'var residualA = angleGap(apparentLongitudeA(jdA), spec.longitude);' \
            'var residualA = angleGap(apparentLongitudeA(jdA), spec.longitude + 5);'; then
  answer="$(ask septemberEquinox 2026)"
  case "$answer" in
    REFUSED:*not\ at\ longitude*) ok "the residual guard fires when the root is not the root — $answer" ;;
    *) bad "the residual guard did not fire on a root five degrees off: $answer" ;;
  esac
fi

echo
echo "--- case 3: give the search a year with no crossing in it to find"
if sabotage 'return bisectCrossing(f, jd - 1, jd);' 'prev = here; continue;'; then
  answer="$(ask septemberEquinox 2026)"
  case "$answer" in
    REFUSED:*no\ crossing\ found*) ok "a search that finds nothing says so — $answer" ;;
    *) bad "a search that found nothing did not refuse: $answer" ;;
  esac
fi

echo
# Day 32. Three of the probes below called `reckon()` and `steepestLoss()`
# with no place, or with `undefined` for one, back when both fell through to
# PARIS. Ember closed that on Day 30 — *a required argument wearing an
# optional one's syntax* — and both throw now. So these three probes have
# been dying on their first line since the second of September, printing
# nothing, and the cases under them have reported the *claim* failing:
#
#   FAIL  the steepest day did not move with the skyline:
#
# — a true failure with a false account in it, with the real message on
# stderr where nothing was looking. Day 19's rule, which this house has now
# met from three sides: a suite must be able to tell its own fixture failing
# from its subject failing. `probe` below is that guard, and it is why the
# empty string is never read as an answer again.
#
# The place is named rather than defaulted, and PARIS is the right constant
# here for a reason that is not habit: these are claims about the *shape* of
# the arithmetic — that a plateau follows its curvature, that the steepest
# day moves with a skyline — first measured over Paris and quoted in the
# corner's own prose. Pinning the place is what makes the case reproducible
# after this tower has moved again, which it does every Sunday.
#
# It went four mornings unseen because nothing in the daily routine runs the
# shell suites; the only thing that walks them is `move-rehearsal.sh`, whose
# appointment is Sundays, and no Sunday fell between.
probe() {
  local label="$1" value="$2"
  if [ -z "$value" ]; then
    bad "$label — the probe printed nothing, so it did not run (see stderr)"
    return 1
  fi
  return 0
}

echo "--- case 4: method B's longitude, shared with its own sunrises"
# The extraction on Day 16 pulled method B's longitude series out of
# usno() so the crossing could ask it directly. If the two ever came
# apart, B would disagree with itself while still calling itself one
# method — so break the series and check the sunrises move too. That is
# the proof they are one copy and not two.
if sabotage 'return wrap360(meanAnomaly + 1.916 * sin(meanAnomaly)' \
            'return wrap360(meanAnomaly + 2.916 * sin(meanAnomaly)'; then
  moved="$(node -e '
    const a = require(process.argv[1]), b = require(process.argv[2]);
    const ca = a.seasonCrossing(2026, "septemberEquinox").instantUTCMethodB;
    const cb = b.seasonCrossing(2026, "septemberEquinox").instantUTCMethodB;
    const sa = a.reckon("2026-08-19", a.PARIS).crossCheck.sunrise;
    const sb = b.reckon("2026-08-19", b.PARIS).crossCheck.sunrise;
    console.log((ca !== cb ? "crossing-moved" : "crossing-stuck") + " " +
                (sa !== sb ? "sunrise-moved" : "sunrise-stuck"));
  ' "$work/pristine.js" "$work/broken.js")"
  if ! probe "method B's crossing and sunrises did not move together" "$moved"; then
    :
  elif [ "$moved" = "crossing-moved sunrise-moved" ]; then
    ok "breaking method B's longitude moves both its crossing and its sunrises — one copy, not two"
  else
    bad "method B's crossing and sunrises did not move together ($moved)"
  fi
fi

echo
echo "--- case 5: the plateau width must follow the curvature it is published with"
# Not a sabotage: a claim the page makes about its own two numbers. If
# these part company the peak is not the smooth quadratic the corner says
# it is, and the square-root rule printed beside it is decoration.
cp "$work/pristine.js" "$work/broken.js"
agreement="$(node -e '
  const r = require(process.argv[1]);
  for (const deg of [0, 2, 5, 10]) {
    const s = r.steepestLoss(2026, r.PARIS, { obstructionDegrees: deg });
    const off = Math.abs(s.plateauDays - s.plateauDaysPredicted);
    if (off > 1.5) { console.log("APART " + deg + "deg " + s.plateauDays + " vs " + s.plateauDaysPredicted.toFixed(1)); process.exit(0); }
  }
  console.log("AGREE");
' "$work/broken.js")"
if ! probe "the published rule does not generate the published width" "$agreement"; then
  :
elif [ "$agreement" = "AGREE" ]; then
  ok "measured and predicted plateau widths agree at 0, 2, 5 and 10 degrees of skyline"
else
  bad "the published rule does not generate the published width: $agreement"
fi

echo
echo "--- case 6: the steepest-losing day must actually move with the skyline"
# The whole reason this figure is in the corner and not on the page. If
# it did not move, it would belong upstairs and the section would be a
# lie about where things live.
spread="$(node -e '
  const r = require(process.argv[1]);
  const dates = [0, 2, 5, 10].map((d) => r.steepestLoss(2026, r.PARIS, { obstructionDegrees: d }).date);
  console.log(new Set(dates).size + " " + dates.join(" "));
' "$work/broken.js")"
if ! probe "the steepest day did not move with the skyline" "$spread"; then
  :
elif [ "${spread%% *}" = "4" ]; then
  ok "four skylines give four different steepest days — ${spread#* }"
else
  bad "the steepest day did not move with the skyline: $spread"
fi

echo
if [ "$fails" -gt 0 ]; then
  echo "FAIL — $fails of the day's claims did not hold."
  exit 1
fi
echo "PASS — the crossing refuses a root that is not a root, and the corner's figure is the corner's."
