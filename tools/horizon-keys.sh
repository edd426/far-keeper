#!/usr/bin/env bash
# tools/horizon-keys.sh [root] — does reckon()'s horizon refuse a key it
# does not read?
#
# Built Day 79. Until then `horizonZenith` read obstructionDegrees and
# eyeHeightMetres and ignored anything else, so `{ degrees: 5 }` returned
# the flat-plain answer with no word. On Day 78 two hands typed a wrong key
# in one morning, and one of them read the flat answer as proof that the
# step does not depend on the skyline at 64°N. Day 13's fault inside the
# instrument.
#
# The good-path cases come first, and they are not idle. A guard that
# refused everything would pass every refusal case below. So the suite also
# asserts that a horizon given with the right key still moves the sunrise,
# which is the check CLAUDE.md asked a keeper to make by hand.
#
# Two cases came from the household the morning it was built. Ember: a
# Date or a Map has no own keys, so it passed as an empty horizon. Ash: the
# first comment said a value that is not a number reads as no obstruction,
# and it did not. A string obstruction was coerced, and a string eye height
# gave an 84-degree dip and no sunrise.
#
# With no argument it tests this tree. Give it another root, a scratch copy
# holding an older reckoning/reckoning.js, to prove the cases can go red.
# Its own sabotage runs last: the instrument with the guard cut out, written
# into a mktemp -d, must turn every refusal case red and leave the good path
# green.
#
# Exit 0 all ok, 1 a case failed, 2 the suite could not run.

set -u
ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
INSTRUMENT="$ROOT/reckoning/reckoning.js"
[ -f "$INSTRUMENT" ] || { echo "horizon-keys: no instrument at $INSTRUMENT" >&2; exit 2; }

OUT="$(INSTRUMENT="$INSTRUMENT" node -e '
const R = require(process.env.INSTRUMENT);
const place = R.STANDING.place;
const date = "2026-10-21";
let fails = 0;
const ok = (name) => console.log("ok    " + name);
const bad = (name, why) => { fails++; console.log("FAIL  " + name + " — " + why); };

// Good path. Each must answer, and the obstruction must move the sunrise.
const flat = R.reckon(date, place);
for (const [name, h] of [["no horizon", undefined], ["a null horizon", null], ["an empty horizon", {}],
                         ["a horizon with no prototype", Object.create(null)]]) {
  try {
    const r = R.reckon(date, place, h);
    r.sunrise === flat.sunrise ? ok(name + " is the flat plain") : bad(name, "sunrise " + r.sunrise + " is not the flat " + flat.sunrise);
  } catch (e) { bad(name, "refused: " + e.message); }
}
try {
  const r = R.reckon(date, place, { obstructionDegrees: 5, eyeHeightMetres: 2 });
  r.sunrise !== flat.sunrise ? ok("both known keys answer, and five degrees moves the sunrise")
    : bad("both known keys", "five degrees of skyline left the sunrise at " + r.sunrise);
} catch (e) { bad("both known keys", "refused: " + e.message); }

// Refusals. Each must throw, and the message must name what was wrong.
const cases = [
  ["a misspelled key", { degrees: 5 }, /"degrees"/],
  ["a known key beside an unknown one", { obstructionDegrees: 5, extra: 1 }, /"extra"/],
  ["a case slip", { ObstructionDegrees: 5 }, /"ObstructionDegrees"/],
  ["a bare number", 5, /not number/],
  ["a string", "5", /not string/],
  ["an array", [5], /not an array/],
  // From Ember: an object that is not a plain one has no own keys to refuse.
  ["a Date", new Date(), /not a Date/],
  ["a Map holding a key", new Map([["degrees", 5]]), /not a Map/],
  // From Ash: the first draft said a non-number reads as no obstruction. It
  // did not. These are the values it was wrong about, and two more.
  ["a string obstruction", { obstructionDegrees: "5" }, /obstructionDegrees must be a finite number, not string/],
  ["a string eye height", { eyeHeightMetres: "2" }, /eyeHeightMetres must be a finite number, not string/],
  ["a NaN obstruction", { obstructionDegrees: NaN }, /not NaN/],
  ["an endless eye height", { eyeHeightMetres: Infinity }, /not Infinity/],
];
for (const [name, h, needle] of cases) {
  for (const [fn, call] of [
    ["reckon", () => R.reckon(date, place, h)],
    ["steepestLoss", () => R.steepestLoss(2026, place, h)],
    ["corner", () => R.corner(date, place, h)],
  ]) {
    try { call(); bad(fn + ": " + name, "answered without a word"); }
    catch (e) { needle.test(e.message) ? ok(fn + " refuses " + name) : bad(fn + ": " + name, "refused, but said: " + e.message); }
  }
}
process.exit(fails ? 1 : 0);
' 2>&1)"
STATUS=$?
printf '%s\n' "$OUT"
case "$OUT" in *ok*|*FAIL*) ;; *) echo "horizon-keys: the cases never ran" >&2; exit 2 ;; esac

# The sabotage, only when testing this tree: the pre-guard instrument.
if [ -z "${1:-}" ]; then
  SCRATCH="$(mktemp -d)"; trap 'rm -rf "$SCRATCH"' EXIT
  mkdir -p "$SCRATCH/reckoning"
  perl -0pe 's/  function horizonZenith\(horizon\) \{\n    if \(horizon !== undefined && horizon !== null\) \{.*?\n    \}\n    var obstruction/  function horizonZenith(horizon) {\n    var obstruction/s' \
    "$INSTRUMENT" > "$SCRATCH/reckoning/reckoning.js"
  if cmp -s "$INSTRUMENT" "$SCRATCH/reckoning/reckoning.js"; then
    echo "FAIL  sabotage did NOT land: the guard is still in the scratch instrument"; exit 1
  fi
  node --check "$SCRATCH/reckoning/reckoning.js" || { echo "FAIL  the sabotaged instrument does not parse"; exit 1; }
  SAB="$("$SELF" "$SCRATCH" 2>&1)"; SAB_STATUS=$?
  # The count is read off the good run above, never typed: a typed count
  # beside a list this file keeps adding to expires (Day 47).
  WANT=$(printf '%s\n' "$OUT" | grep -c '^ok    .* refuses ')
  GOOD=$(printf '%s\n' "$OUT" | grep -cE '^ok    (no horizon|a null|an empty|a horizon with|both known)')
  RED=$(printf '%s\n' "$SAB" | grep -c '^FAIL')
  GOOD_RED=$(printf '%s\n' "$SAB" | grep -E '^FAIL  (no horizon|a null|an empty|a horizon with|both known)' | wc -l)
  if [ "$WANT" -gt 0 ] && [ "$GOOD" -eq 5 ] && [ "$SAB_STATUS" -eq 1 ] && [ "$RED" -eq "$WANT" ] && [ "$GOOD_RED" -eq 0 ]; then
    echo "ok    without the guard, all $WANT refusal cases go red and the $GOOD good-path cases stay green"
  else
    echo "FAIL  the sabotage read exit $SAB_STATUS, $RED red of $WANT, $GOOD_RED of them good-path (wanted 1, $WANT, 0)"
    printf '%s\n' "$SAB" | sed 's/^/      /'
    STATUS=1
  fi
fi
exit $STATUS
