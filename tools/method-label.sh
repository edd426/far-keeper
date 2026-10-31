#!/usr/bin/env bash
# tools/method-label.sh — a ledger row's method label, read by the desk auditor
#
#     ./tools/method-label.sh            # the cases, then two sabotages, in scratch trees
#
# Built Day 89, the leftover named on Day 87 and agreed by Ember. Until then
# `reckon.js --verify` read `entry.method || 1` and forked on *different from
# METHOD*: a row labelled 99 or 5.23 was told *published under method 99; the
# tower now runs method 2* and counted with the honest method-change rows, and
# a row labelled 0 was read as method 1. `methodStanding()` in
# reckoning/reckoning.js now answers current, earned or unknown, and the page
# and this desk both ask it.
#
# Every case runs `node tools/reckon.js --verify` in a mktemp -d copy of
# tools/reckon.js, reckoning/reckoning.js and a ledger forged from the real
# one. The real ledger's bytes are checked at the end (Day 10: never test a
# write-tool against the thing it writes to).
#
# The fixture rows are chosen by property, never typed (Day 68): the newest
# row, which is current-method, and the three rows with no method field.
# Each fixture asserts it was built before its verdict is read (Day 17), and
# the sabotages assert they landed (Day 5). Exit 0 all green, 1 any red.

set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LEDGER="$ROOT/reckoning/ledger.json"
BEFORE="$(sha256sum "$LEDGER" | cut -d' ' -f1)"
SCRATCH="$(mktemp -d)"
trap '[ -n "${KEEP_SCRATCH:-}" ] || rm -rf "$SCRATCH"' EXIT

FAILS=0
ok()  { echo "ok    $*"; }
bad() { echo "FAIL  $*"; FAILS=$((FAILS + 1)); }

# A scratch tower holding the instrument, the tool, and a ledger written by
# the node snippet given ($2), which receives the real ledger as `rows`.
build() {
  local dir="$SCRATCH/$1" forge="$2"
  mkdir -p "$dir/tools" "$dir/reckoning"
  cp "$ROOT/tools/reckon.js" "$dir/tools/"
  cp "$ROOT/reckoning/reckoning.js" "$dir/reckoning/"
  node -e "
    const fs = require('fs');
    const rows = JSON.parse(fs.readFileSync('$LEDGER', 'utf8'));
    const out = (function (rows) { $forge })(rows);
    fs.writeFileSync('$dir/reckoning/ledger.json', JSON.stringify(out, null, 2) + '\n');
  "
  echo "$dir"
}

verify() { (cd "$1" && node tools/reckon.js --verify 2>&1); }

# The newest row, current-method, alone in its own ledger, so no other row's
# summary lines can answer for it (Day 80: a case that sweeps a report is
# about the report, not the row).
newest_with() {  # $1 = a JS expression for the label, or the word DELETE
  if [ "$1" = DELETE ]; then
    echo "const r = Object.assign({}, rows[rows.length - 1]); delete r.method; return [r];"
  else
    echo "const r = Object.assign({}, rows[rows.length - 1]); r.method = $1; return [r];"
  fi
}

run_cases() {
  local label="$1"
  echo "== $label"

  # The fixture itself: the newest row must be current-method and dated after
  # the change, or every case below is asking about some other row.
  local probe
  probe="$(node -e "
    const R = require('$2/reckoning/reckoning.js');
    const rows = require('$LEDGER');
    const r = rows[rows.length - 1];
    console.log(R.methodStanding(r).kind, r.date > R.METHOD_CHANGED_ON ? 'after' : 'before');
  " 2>&1)"
  if [ "$probe" = "current after" ]; then ok "fixture: the newest row is current-method and dated after the change"
  else bad "fixture: the newest row is not what the cases assume ($probe)"; fi

  # Controls first: the unbroken book and a plain forgery keep their accounts.
  local d out
  d="$(build "$label-real" "return rows;")"; out="$(verify "$d")"
  if [ "$(grep -c 'published under method 1; the tower now runs method 2' <<<"$out")" -ge 1 ] &&
     grep -q 'of them were computed under a method the tower no longer runs' <<<"$out" &&
     ! grep -q 'never ran' <<<"$out"; then
    ok "control: the real book's method-1 rows keep the method-change account, and nothing says never ran"
  else bad "control: the real book's method-1 rows lost their account"; fi

  d="$(build "$label-forged" "const r = Object.assign({}, rows[rows.length - 1]); r.dayLengthMinutes = r.dayLengthMinutes + 1; return [r];")"
  out="$(verify "$d")"
  if grep -q 'there is no method change to blame' <<<"$out" && ! grep -q 'never ran' <<<"$out"; then
    ok "control: a current-method row with an edited number keeps the forgery sentence"
  else bad "control: the forgery sentence did not come back for an edited current row"; fi

  # The odd labels. Each must be DRIFTED, must name its own label, must get
  # the unknown summary, and must get neither of the other two accounts.
  local js name
  for js in 99 5.23 0 -1 '"2"' null; do
    name="method $js"
    d="$(build "$label-$RANDOM" "$(newest_with "$js")")"
    out="$(verify "$d")"
    if ! grep -q "\"method\": $js" "$d/reckoning/ledger.json"; then
      bad "$name: the fixture row was not built"; continue
    fi
    if grep -q 'HAS DRIFTED' <<<"$out" &&
       grep -q "labelled method $js, which this tower never ran" <<<"$out" &&
       grep -q 'carries a method label this tower never ran' <<<"$out" &&
       ! grep -q 'published under method' <<<"$out" &&
       ! grep -q 'no method change to blame' <<<"$out"; then
      ok "$name: DRIFTED, named as a method never run, and handed neither account"
    else
      bad "$name: not told it names a method this tower never ran"
      grep -E 'HAS DRIFTED|reckon: [0-9]' <<<"$out" | sed 's/^/        /'
    fi
  done

  # A row dated after the change, carrying method 1 or no method field at
  # all: a method the tower had stopped running by then.
  d="$(build "$label-one" "$(newest_with 1)")"; out="$(verify "$d")"
  if grep -q 'labelled method 1, and this tower had stopped running method 1' <<<"$out" &&
     ! grep -q 'published under method' <<<"$out"; then
    ok "method 1 on a row dated after the change: told the tower had stopped running it"
  else bad "method 1 on a row dated after the change was handed the method-change account"; fi

  d="$(build "$label-gone" "$(newest_with DELETE)")"; out="$(verify "$d")"
  # Asked of the row's own top-level keys: `"method"` also appears deeper in
  # a row, so a grep of the file answers for some other field.
  if [ "$(node -e "console.log('method' in require('$d/reckoning/ledger.json')[0])")" != false ]; then
    bad "deleted field: the fixture row still carries a method"
  elif grep -q 'carries no method field, which means method 1, and this tower had stopped' <<<"$out" &&
       ! grep -q 'published under method' <<<"$out"; then
    ok "method field taken off a row dated after the change: caught, not read as method 1"
  else bad "method field taken off a later row was read as an honest method-1 row"; fi

  # Ember's graft (Day 15's other half): the current label put on a row older
  # than the change. The row is the oldest earned one, chosen by property.
  d="$(build "$label-graft" "const R = require('$2/reckoning/reckoning.js');
    const r = Object.assign({}, rows.find((x) => R.methodStanding(x).kind === 'earned'));
    r.method = R.METHOD; return [r];")"
  out="$(verify "$d")"
  if [ "$(node -e "console.log(require('$d/reckoning/ledger.json')[0].method)")" != 2 ]; then
    bad "graft: the fixture row was not built"
  elif grep -q 'this tower had not begun running method 2' <<<"$out" &&
       ! grep -q 'no method change to blame' <<<"$out"; then
    ok "method 2 grafted onto a row older than the change: caught, not handed the forgery sentence"
  else bad "method 2 grafted onto an older row was read as current"; fi

  # The label is the only thing wrong: it must be the only line listed.
  d="$(build "$label-only" "$(newest_with 99)")"; out="$(verify "$d")"
  local listed
  listed="$(grep '^reckon:   ' <<<"$out")"
  if [ "$(grep -c . <<<"$listed")" = 1 ] && grep -q '^reckon:   method: labelled method 99' <<<"$listed"; then
    ok "a wrong label on figures that all recompute: the label is the one line listed"
  else bad "a wrong label alone listed something other than itself"; sed 's/^/        /' <<<"$listed"; fi

  # The label and a figure both wrong: both listed.
  d="$(build "$label-both" "const r = Object.assign({}, rows[rows.length - 1]);
    r.method = 99; r.dayLengthMinutes = r.dayLengthMinutes + 1; return [r];")"
  out="$(verify "$d")"
  if grep -q '^reckon:   method: labelled method 99' <<<"$out" &&
     grep -q '^reckon:   dayLengthMinutes' <<<"$out"; then
    ok "a wrong label on an edited figure: both are listed"
  else bad "a wrong label on an edited figure hid one of the two"; fi
}

run_cases "the tool as it stands" "$ROOT"
GREEN_FAILS=$FAILS

# ---- Sabotages: each must turn the cases red ---------------------------
sabotage() {  # $1 name, $2 perl substitution, $3 red at least, $4 file (default the instrument)
  local tree="$SCRATCH/sab-$1"
  mkdir -p "$tree/tools" "$tree/reckoning"
  cp "$ROOT/tools/reckon.js" "$tree/tools/"
  cp "$ROOT/reckoning/reckoning.js" "$tree/reckoning/"
  local file="${4:-reckoning/reckoning.js}"
  perl -0pi -e "$2" "$tree/$file"
  if cmp -s "$ROOT/$file" "$tree/$file"; then
    bad "sabotage $1 did NOT land"; return
  fi
  if ! node -e "require('$tree/reckoning/reckoning.js').methodStanding({})" >/dev/null 2>&1; then
    bad "sabotage $1 broke the instrument instead of the rule"; return
  fi
  local saved_root="$ROOT" before=$FAILS
  ROOT="$tree"; cp "$saved_root/reckoning/ledger.json" "$tree/reckoning/" 2>/dev/null
  run_cases "sabotage: $1" "$tree" > "$SCRATCH/sab-$1.out"
  ROOT="$saved_root"
  local red=$((FAILS - before)); FAILS=$before
  if [ "$red" -ge "$3" ]; then ok "sabotage $1 turns $red case(s) red (at least $3 expected)"
  else bad "sabotage $1 turned only $red case(s) red; expected at least $3"; cat "$SCRATCH/sab-$1.out"; fi
}

echo "== sabotages"
# Every odd label read as a method the tower ran: the six never-ran cases.
sabotage "never-ran-collapsed" 's/if \(!ran\) \{/if (false) {/' 6
# The date bound dropped: method 1, and the missing field, on a later row.
sabotage "date-bound-dropped" "s/!\(dated && row\.date < METHOD_CHANGED_ON\)/false/" 2
# The graft gate dropped: method 2 on an older row reads current again.
sabotage "graft-gate-dropped" "s/if \(dated && row\.date < METHOD_CHANGED_ON\) \{\n(\s*)return \{ kind: 'unknown'/if (false) {\n\$1return { kind: 'unknown'/" 1
# The tool never listing the label: every case that asks for the method
# line goes red (the six never-ran labels, the two later-row cases, the
# graft, and the two listing cases; the graft and the edited figure still
# drift on other grounds, so it is ten and not eleven).
sabotage "label-not-listed" "s/standing\\.kind === 'unknown' \\? \\[/false ? [/" 10 tools/reckon.js

AFTER="$(sha256sum "$LEDGER" | cut -d' ' -f1)"
if [ "$BEFORE" = "$AFTER" ]; then ok "the real ledger's bytes did not move"
else bad "the real ledger's bytes MOVED during this run"; fi

echo
if [ "$FAILS" -eq 0 ] && [ "$GREEN_FAILS" -eq 0 ]; then
  echo "method-label: all green"; exit 0
fi
echo "method-label: $FAILS red"; exit 1
