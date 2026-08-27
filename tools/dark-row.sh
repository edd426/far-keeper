#!/usr/bin/env bash
# tools/dark-row.sh — what the tower says on a day the sun does not come up.
#
# Day 20. Above about 66 degrees the `acos` fold in reckoning.js fires and
# `reckon()` returns `{ never: 'risen' }` or `{ never: 'set' }`: no sunrise,
# no sunset, no day length, no drift, no rising point, no cross-check. The
# fold has worked since it was written. Nothing downstream of it had ever
# been handed its output, because one latitude has ever reached it.
#
# Two faults, both demonstrated against the pre-fix tool before anything was
# repaired (see MADE TO FAIL at the foot of this file):
#
#   1. The write path announced the tower's first dark morning as
#      `sunrise undefined … longer than yesterday by NaN minutes` — a false
#      sentence, not merely an ugly one, saying the day grew on the day the
#      day stopped existing.
#
#   2. `CLAIMS` held seven keys and every one of them is a number. On a dark
#      row all seven are undefined, so every comparison passed vacuously and
#      `--verify` printed the same green `unchanged` a full row earns. A
#      published row forged from polar night to midnight sun — the largest
#      lie this ledger can tell about a day — was waved through.
#
# Everything below runs in a `mktemp -d` copy of the tower and the real
# ledger's bytes are checked at the end regardless of how the run goes
# (Day 10: never test a write-tool against the thing it writes to; all three
# of us broke that rule the morning we learned it).
#
# Two rules from the last three days are kept here on purpose:
#
#   Day 17 — a test that watches its own breaking and not its own building
#   is watching one end of itself. Every fixture below asserts it was
#   actually built, as hard as it asserts its sabotage landed.
#
#   Day 19 — a suite must prove the tool its sabotage made still RUNS. The
#   write cases move `STANDING.place` and pin `standingToday()`, which is a
#   text substitution into a live file; a substitution can land in the bytes
#   and produce a tool that will not start, and then every case under it
#   fails blaming the fixture while node prints a module error into the same
#   buffer.
#
# The verify cases do NOT go through the gated CLI to build their rows. They
# manufacture them from `reckon()` and splice them into a scratch ledger —
# Ember's reason, Day 17: a fixture that leans on a row the day's own
# routine already published is a fixture that quietly stops running.
#
# usage: ./tools/dark-row.sh [tower]
#
# `tower` is the tree the tool under test is taken from — used only to point
# this suite at an older `reckon.js`, as under MADE TO FAIL below. The real
# ledger's bytes are always checked against the real repository, whatever
# tree is being tested, because that check is not about the tool.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOWER="${1:-$ROOT}"
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
  if [ "$fails" -eq 0 ]; then echo "dark-row: PASS"; else echo "dark-row: $fails FAILED"; fi
  exit $(( fails == 0 ? 0 : 1 ))
}
trap finish EXIT

# Tromso, 69.65N. Polar night 2026-11-28 to 2027-01-15; the sun returns on
# 2027-01-16 with a null drift. Midnight sun in July.
TROMSO="{ name: 'Tromso', latitude: 69.6492, longitude: 18.9553, zone: 'Europe/Oslo' }"
DARK_DATE="2026-12-21"      # deep in the polar night
RETURN_DATE="2027-01-16"    # the sun's first morning back: drift is null
LIGHT_DATE="2026-08-30"     # an ordinary Tromso day, sun up and down

# ---- Build a scratch tower standing at Tromso, on a pinned morning ----
build() {
  local pinned="$1" work
  work="$(mktemp -d)"
  mkdir -p "$work/tools" "$work/reckoning"
  cp "$TOWER/tools/reckon.js" "$work/tools/"
  cp "$TOWER/reckoning/reckoning.js" "$work/reckoning/"
  echo '[]' > "$work/reckoning/ledger.json"

  # Move the tower. By substitution and not by sha: a sha rots when history
  # is rewritten, and this sandbox has already lied to us once about its own
  # floor (Day 8).
  # `|` and not `/`, because the zone name has a slash in it. The first
  # version of this line used `/` and produced a perl syntax error, no
  # substitution, and an unmoved tower — caught immediately, and only
  # because the assertion below asks whether the fixture was BUILT and not
  # merely whether perl was called (Day 17).
  #
  # The needle is anchored to the STANDING literal and names no city
  # (Day 24). `place: PARIS,` was the old one, and it stops matching on the
  # first morning this tower stands anywhere else: the substitution silently
  # fails, the fixture is an unmoved tower, and every case below blames the
  # fixture for it. Rehearsed rather than argued — `tools/move-rehearsal.sh`
  # ran this file in a tower standing at Ushuaia and got three FAILs reading
  # *the tower was NOT moved to Tromso*, about a suite that was right.
  # `standing-page.js` was given this repair on Day 23 and the other three
  # needles in the house were never asked the same question.
  # The needle is anchored at BOTH ends of the field — `place:` on one side
  # and the key after it on the other — so it matches whatever expression a
  # keeper has put there: an identifier, an inline object, anything. A
  # needle written to match an identifier is a third draft of the same
  # mistake: `tools/move-rehearsal.sh` moves a tower by writing an object
  # literal in, and this suite could not then move it again.
  #
  # No capture group and no `$` inside a character class. `${1}{` reads as a
  # hash subscript to perl, and `[A-Za-z_$]` interpolates `$]` — perl's own
  # version number — which is an unmatched-bracket error, no substitution,
  # and an unmoved tower. Both were written here this morning and both were
  # caught on the first run by the assertion below, which is now the third
  # time in the life of this one line that that assertion has earned itself.
  perl -0pi -e "s|var STANDING = \{\s*place:.*?since:|var STANDING = { place: $TROMSO, since:|s" \
    "$work/reckoning/reckoning.js"
  # Pin the morning. The gate only ever writes today, correctly (Day 17), so
  # a fixture about a December morning has to be standing on one.
  perl -0pi -e "s|  return todayAt\(STANDING\.place\.zone\);|  return '$pinned';|" "$work/tools/reckon.js"
  echo "$work"
}

assert_built() {
  local work="$1" pinned="$2" label="$3" out
  if ! grep -q "name: 'Tromso'" "$work/reckoning/reckoning.js"; then
    bad "$label: the tower was NOT moved to Tromso"; return 1
  fi
  if ! grep -q "return '$pinned';" "$work/tools/reckon.js"; then
    bad "$label: the morning was NOT pinned to $pinned"; return 1
  fi
  # Day 19. The bytes moving is not the same as a tool that runs. Ask it a
  # question that touches nothing and needs no ledger.
  out="$(node "$work/tools/reckon.js" --help 2>&1)"
  if [ $? -ne 0 ] || ! printf '%s' "$out" | grep -q 'usage: reckon.js'; then
    bad "$label: the sabotaged tool does not RUN — $(printf '%s' "$out" | head -1)"; return 1
  fi
  return 0
}

echo "--- the write path, on a morning the sun does not rise"

W="$(build "$DARK_DATE")"
if assert_built "$W" "$DARK_DATE" "dark write"; then
  OUT="$(node "$W/tools/reckon.js" 2>&1)"; CODE=$?
  [ "$CODE" -eq 0 ] && ok "dark write: exits 0" || bad "dark write: exit $CODE"
  printf '%s' "$OUT" | grep -q "wrote $DARK_DATE to the ledger" \
    && ok "dark write: says it wrote the row" \
    || bad "dark write: never said it wrote the row"
  # The two faults, named directly. `undefined` and `NaN` are the exact
  # strings the pre-fix tool printed.
  printf '%s' "$OUT" | grep -q 'undefined' \
    && bad "dark write: the announcement still contains 'undefined'" \
    || ok "dark write: no 'undefined' anywhere in the announcement"
  printf '%s' "$OUT" | grep -q 'NaN' \
    && bad "dark write: the announcement still contains 'NaN'" \
    || ok "dark write: no 'NaN' anywhere in the announcement"
  # And the fault that matters is not the ugly token, it is the false
  # sentence. Convict that on its own, so a repair that merely silenced the
  # line would still be caught by the case below it.
  printf '%s' "$OUT" | grep -qE '(longer|shorter) than yesterday' \
    && bad "dark write: still claims the day got longer or shorter" \
    || ok "dark write: makes no claim about the day's length changing"
  printf '%s' "$OUT" | grep -q 'the sun did not rise at Tromso' \
    && ok "dark write: says plainly that the sun did not rise" \
    || bad "dark write: never says what actually happened"
  # A repair that printed the sentence and wrote nothing would pass every
  # check above. The row has to be in the book.
  node -e "
    const l = require('$W/reckoning/ledger.json');
    const r = l.find(e => e.date === '$DARK_DATE');
    if (!r) { console.error('no row'); process.exit(1); }
    if (r.never !== 'risen') { console.error('never is ' + r.never); process.exit(1); }
    if (r.place.name !== 'Tromso') { console.error('place is ' + r.place.name); process.exit(1); }
  " 2>/dev/null \
    && ok "dark write: the row is in the ledger, dark, at Tromso" \
    || bad "dark write: the row is missing or is not the row named"
fi
rm -rf "$W"

echo ""
echo "--- the write path, on the morning the sun comes back"

W="$(build "$RETURN_DATE")"
if assert_built "$W" "$RETURN_DATE" "return write"; then
  OUT="$(node "$W/tools/reckon.js" 2>&1)"
  # This is the case the old `!== null` guard was written FOR, and it must
  # survive the repair. Yesterday was dark, so there is no day length to
  # subtract and `changeSinceYesterdayMinutes` is genuinely null. Widening
  # the guard to `!= null` would have made both kinds of missing silent;
  # this case and the dark one above only both pass if the two are told
  # apart.
  # The shape of a time, not a particular time. This case is about the
  # returning morning still printing its figures, and it went red at first
  # writing because I typed `sunrise 10:` from memory when the arithmetic
  # says 11:17 — my expectation and not the tool, for the fifth time in
  # seven days. Pinning the exact minute here would also make this case a
  # claim about the *method*, which is not what it is named for, and the
  # next method bump would turn a correct tool red in a file about
  # something else entirely.
  printf '%s' "$OUT" | grep -qE 'sunrise [0-9]{2}:[0-9]{2}  sunset [0-9]{2}:[0-9]{2}' \
    && ok "return write: prints a real sunrise and sunset" \
    || bad "return write: no sunrise/sunset printed"
  printf '%s' "$OUT" | grep -qE '(longer|shorter) than yesterday' \
    && bad "return write: claims a drift on a day that has none" \
    || ok "return write: claims no drift"
  printf '%s' "$OUT" | grep -q 'no drift — yesterday had no day length' \
    && ok "return write: says WHY there is no drift" \
    || bad "return write: silent about the missing drift"
  printf '%s' "$OUT" | grep -q 'NaN' \
    && bad "return write: 'NaN' in the announcement" \
    || ok "return write: no 'NaN'"
fi
rm -rf "$W"

echo ""
echo "--- the write path, on an ordinary Tromso day"

W="$(build "$LIGHT_DATE")"
if assert_built "$W" "$LIGHT_DATE" "light write"; then
  OUT="$(node "$W/tools/reckon.js" 2>&1)"
  # The unbroken case must still fail the dark case's pass rule (Day 5), or
  # the dark checks above are checking nothing.
  printf '%s' "$OUT" | grep -q 'the sun did not rise' \
    && bad "light write: calls an ordinary day dark" \
    || ok "light write: does not call an ordinary day dark"
  printf '%s' "$OUT" | grep -qE 'shorter than yesterday by [0-9]' \
    && ok "light write: still reports the day's drift" \
    || bad "light write: lost the drift line"
  printf '%s' "$OUT" | grep -q 'day length 1[0-9]h' \
    && ok "light write: still reports a day length" \
    || bad "light write: lost the day length"
fi
rm -rf "$W"

echo ""
echo "--- the auditor, against a forged dark row"

# These build their rows from `reckon()` and splice them in — no gated CLI,
# no pinned morning, nothing that can quietly become a no-op (Day 17).
verify_case() {
  local label="$1" mutate="$2" want_code="$3" want_text="$4" work out code
  work="$(mktemp -d)"
  mkdir -p "$work/tools" "$work/reckoning"
  cp "$TOWER/tools/reckon.js" "$work/tools/"
  cp "$TOWER/reckoning/reckoning.js" "$work/reckoning/"

  node -e "
    const fs = require('fs');
    const R = require('$work/reckoning/reckoning.js');
    const TROMSO = $TROMSO;
    const PARIS = { name: 'Paris', latitude: 48.8566, longitude: 2.3522, zone: 'Europe/Paris' };
    const dark = R.reckon('$DARK_DATE', TROMSO);
    dark.publishedAt = '${DARK_DATE}T09:00:00Z';
    const light = R.reckon('2026-08-30', PARIS);
    light.publishedAt = '2026-08-30T05:00:00Z';
    const rows = [light, dark];
    ($mutate)(rows);
    fs.writeFileSync('$work/reckoning/ledger.json', JSON.stringify(rows, null, 2) + '\n');
  " || { bad "$label: the fixture ledger was NOT built"; rm -rf "$work"; return; }

  # Day 17, turned the right way round: assert the fixture is in the state
  # the case is named for before believing anything the tool says about it.
  if ! node -e "
    const l = require('$work/reckoning/ledger.json');
    if (l.length !== 2) process.exit(1);
    if (l[1].date !== '$DARK_DATE') process.exit(1);
  " 2>/dev/null; then
    bad "$label: the fixture ledger is not the shape this case is named for"
    rm -rf "$work"; return
  fi

  out="$(node "$work/tools/reckon.js" --verify 2>&1)"; code=$?
  if [ "$code" -ne "$want_code" ]; then
    bad "$label: exit $code, wanted $want_code"
  else
    ok "$label: exit $want_code"
  fi
  if printf '%s' "$out" | grep -q "$want_text"; then
    ok "$label: says \"$want_text\""
  else
    bad "$label: never said \"$want_text\""
    printf '%s\n' "$out" | sed 's/^/        /' | head -8
  fi
  rm -rf "$work"
}

# The honest dark row. It passes — and the verdict has to say what kind of
# pass it is, because `unchanged at Tromso` on its own is the sentence a
# row with eight figures on it earns. Day 18's argument, one row along.
verify_case "honest dark row" "rows => rows" 0 "the sun did not rise at Tromso"

# The forgery this whole file exists for. Polar night into midnight sun, on
# a cold record. The pre-fix auditor answered `unchanged`.
verify_case "forged risen→set" "rows => { rows[1].never = 'set'; }" 1 "HAS DRIFTED"

# A hand deleting the word. Absence must not read as "this row never made
# that claim" — that is the hole CLAIM_INTRODUCED opens, and `never` has no
# birthday, so the recompute answers and the deletion is caught.
verify_case "deleted never" "rows => { delete rows[1].never; }" 1 "HAS DRIFTED"

# And the mirror, which is Ember's half of the Day 15 rule: a hand grafting
# the dark onto a day that had a sun.
verify_case "grafted never onto a light row" "rows => { rows[0].never = 'risen'; }" 1 "HAS DRIFTED"

# The unbroken pair must pass, or none of the three above means anything.
verify_case "no forgery at all" "rows => rows" 0 "unchanged at Paris"

cat <<'MADE'

--- MADE TO FAIL
    Twelve of these cases go red against the pre-fix tool, and the ones that
    stay green are the point: all three ordinary-Tromso-day cases, and
    "no forgery at all". The unbroken case fails the dark case's pass rule,
    which is what makes a pass here worth anything (Day 5).

      W=$(mktemp -d); mkdir -p "$W/tools" "$W/reckoning"
      git show <pre-fix-sha>:tools/reckon.js > "$W/tools/reckon.js"
      cp reckoning/reckoning.js reckoning/ledger.json "$W/reckoning/"
      cmp -s tools/reckon.js "$W/tools/reckon.js" && echo "SABOTAGE DID NOT LAND"
      ./tools/dark-row.sh "$W"

    What it prints there, verbatim, on the morning the tower goes dark:

      reckon:   sunrise undefined  sunset undefined  (Europe/Oslo)
      reckon:   day length undefined
      reckon:   longer than yesterday by NaN minutes

    and, about a published row forged from polar night to midnight sun:

      reckon: 2026-12-21 unchanged at Tromso since it was published.
MADE
