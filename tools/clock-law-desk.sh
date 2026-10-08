#!/usr/bin/env bash
# tools/clock-law-desk.sh — the desk auditor, under a changed clock law
#
#   ./tools/clock-law-desk.sh            check the working tree
#   ./tools/clock-law-desk.sh /some/tree check another copy of the tower
#
# Built Day 66. `tools/clock-law.js` proves the page's Day 53 fork in a
# browser. `reckon.js --verify` never had it: a current-method row whose
# offset this desk's tz data no longer gives was handed *read the commits
# before you believe anything kinder*, while the page told a stranger the
# same row's gap was a law. This suite proves the desk's fork.
#
# The law change is forced where a real one would land, at the end of
# `zoneOffsetMinutes` in a scratch copy of reckoning.js, never by editing a
# row's `utcOffsetMinutes` (Ember's: that is the forger's move, and it gets
# its own case, because the fork cannot tell the two apart and must say so).
# Each substitution is asserted to have landed (Day 5) and every fixture
# asserted built (Day 17). Nothing here opens the tower's own ledger, and its
# bytes are checked at the end anyway (Day 10).
set -u

SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

REAL_BEFORE="$(sha256sum "$SRC/reckoning/ledger.json" | cut -d' ' -f1)"

fails=0
note() { echo "ok    $1"; }
bad()  { fails=$((fails + 1)); echo "FAIL  $1"; [ -n "${2:-}" ] && echo "$2" | sed 's/^/        /'; }

# A fresh tower in $WORK/<name>, with the law for one zone moved by +60.
# With no zone, the law is left alone.
tower() {
  local name="$1" zone="${2:-}"
  local T="$WORK/$name"
  mkdir -p "$T/tools" "$T/reckoning"
  cp "$SRC/tools/reckon.js" "$T/tools/"
  cp "$SRC/reckoning/reckoning.js" "$SRC/reckoning/ledger.json" "$T/reckoning/"
  if [ -n "$zone" ]; then
    ZONE="$zone" perl -0pi -e 's/return assertPlausibleOffset\(Math\.round\(\(asIfUTC - instant\.getTime\(\)\) \/ 60000\), zone, dateISO\);/return assertPlausibleOffset(Math.round((asIfUTC - instant.getTime()) \/ 60000) + (zone === "$ENV{ZONE}" ? 60 : 0), zone, dateISO);/' "$T/reckoning/reckoning.js"
    if cmp -s "$SRC/reckoning/reckoning.js" "$T/reckoning/reckoning.js"; then
      echo "$name" >> "$WORK/unlanded"
    fi
  fi
  echo "$T"
}

verify_in() { (cd "$1" && node tools/reckon.js --verify 2>&1); }

# Which rows does a zone own, by date? Read off the ledger, never typed.
dates_at() {
  node -e "
    const l = require('$1/reckoning/ledger.json');
    console.log(l.filter(r => r.place && r.place.zone === '$2' && (r.method || 1) === require('$1/reckoning/reckoning.js').METHOD)
      .map(r => r.date).join(' '));"
}

USHUAIA="America/Argentina/Ushuaia"

# ---- 0. the unbroken tower says nothing of a clock law -----------------------
T0="$(tower pristine)"
OUT0="$(verify_in "$T0")"
if printf '%s\n' "$OUT0" | grep -q 'CLOCK LAW'; then
  bad "0: the pristine tower already prints CLOCK LAW, so nothing below can mean anything" "$OUT0"
else
  note "0: the pristine tower prints no CLOCK LAW"
fi

# ---- 1. a law revision at Ushuaia ---------------------------------------------
T1="$(tower law "$USHUAIA")"
DATES="$(dates_at "$T1" "$USHUAIA")"
N="$(echo "$DATES" | wc -w)"
if [ "$N" -lt 1 ]; then
  bad "1: the ledger holds no current-method Ushuaia row; the case has an empty domain"
else
  note "1: $N current-method Ushuaia rows to judge"
fi
OUT1="$(verify_in "$T1")"; CODE1=$?
missing=""
for d in $DATES; do
  block="$(printf '%s\n' "$OUT1" | awk -v d="$d" '$0 ~ "reckon: "d" " {on=1; print; next} on && /^reckon: [0-9]{4}-/ {on=0} on {print}')"
  printf '%s\n' "$block" | grep -q 'CLOCK LAW' || missing="$missing $d"
  printf '%s\n' "$block" | grep -q 'and for nothing else' || missing="$missing $d(rest)"
done
[ -z "$missing" ] && note "1: every Ushuaia row is read as a clock law, accounted for whole" \
  || bad "1: rows not read as a clock law:$missing" "$OUT1"
if printf '%s\n' "$OUT1" | grep -q 'crossCheck.sunrise: published'; then
  # Only the lines between CLOCK LAW and the next verdict, never the whole
  # block: on its first run this case read `grep -A12 'CLOCK LAW'` and was
  # answered by the *does NOT account* list under a sabotage that sorted the
  # field wrong. Day 35's fault: a case that sweeps the block cannot tell
  # which verdict answered it.
  ACCOUNTED="$(printf '%s\n' "$OUT1" | awk '/CLOCK LAW/ {on=1; next} /and for nothing else|does NOT account/ {on=0} on')"
  [ -n "$ACCOUNTED" ] || bad "1: no accounted-for lines were found at all" "$OUT1"
  printf '%s\n' "$ACCOUNTED" | grep -q 'crossCheck.sunrise' \
    && note "1: crossCheck.sunrise, a clock time deep in the row, is among what the gap accounts for" \
    || bad "1: crossCheck.sunrise moved and was not accounted for by the gap" "$OUT1"
else
  bad "1: crossCheck.sunrise never moved under the law change; the deep field was not exercised" "$OUT1"
fi
printf '%s\n' "$OUT1" | grep -q 'no method change to blame' \
  && bad "1: an honest law change still drew the forgery sentence" "$OUT1" \
  || note "1: no forgery sentence for a law change"
printf '%s\n' "$OUT1" | grep -q "^reckon: $N of them w.* written under a clock offset" \
  && note "1: the summary counts $N clock-law rows" \
  || bad "1: the summary does not count $N clock-law rows" "$(printf '%s\n' "$OUT1" | tail -14)"
[ "$CODE1" -eq 1 ] && note "1: exit 1 — the fork clears nothing" || bad "1: exit $CODE1, wanted 1"

# ---- 2. the forger: offset and clock times moved together by hand --------------
T2="$(tower forger)"
LAST="$(node -e "const l=require('$T2/reckoning/ledger.json'); console.log(l[l.length-1].date)")"
node -e "
  const fs = require('fs'), f = '$T2/reckoning/ledger.json';
  const l = JSON.parse(fs.readFileSync(f, 'utf8')); const r = l[l.length - 1];
  const sh = (t) => { const m = (Number(t.slice(0,2))*60 + Number(t.slice(3,5)) + 60) % 1440;
    return String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0'); };
  r.utcOffsetMinutes += 60;
  for (const k of ['sunrise','sunset','solarNoon']) r[k] = sh(r[k]);
  for (const k of ['sunrise','sunset']) r.crossCheck[k] = sh(r.crossCheck[k]);
  fs.writeFileSync(f, JSON.stringify(l, null, 2) + '\n');"
cmp -s "$SRC/reckoning/ledger.json" "$T2/reckoning/ledger.json" && bad "2: the forged row did NOT land"
OUT2="$(verify_in "$T2")"; CODE2=$?
printf '%s\n' "$OUT2" | grep -A3 "reckon: $LAST HAS DRIFTED" | grep -q 'CLOCK LAW' \
  && note "2: a hand moving the offset and the clock times together reads as a clock law (the limit)" \
  || bad "2: the forged row was not read as a clock law" "$OUT2"
printf '%s\n' "$OUT2" | grep -q 'a hand that moved it and the clock times together' \
  && note "2: and the tool says outright that a hand would read the same" \
  || bad "2: the limit is not printed" "$OUT2"
[ "$CODE2" -eq 1 ] && note "2: exit 1" || bad "2: exit $CODE2, wanted 1"

# ---- 3. a law change with an edit on top of it --------------------------------
T3="$(tower lawplus "$USHUAIA")"
node -e "
  const fs = require('fs'), f = '$T3/reckoning/ledger.json';
  const l = JSON.parse(fs.readFileSync(f, 'utf8')); l[l.length - 1].dayLengthMinutes += 1;
  fs.writeFileSync(f, JSON.stringify(l, null, 2) + '\n');"
OUT3="$(verify_in "$T3")"
blk3="$(printf '%s\n' "$OUT3" | grep -A20 "reckon: $LAST HAS DRIFTED" | awk 'NR>1 && /^reckon: [0-9]{4}-/ {exit} {print}')"
printf '%s\n' "$blk3" | grep -q 'CLOCK LAW' && printf '%s\n' "$blk3" | grep -A3 'does NOT account' | grep -q 'dayLengthMinutes' \
  && note "3: the edit under the law change is printed as what the gap does not account for" \
  || bad "3: the edited day length was not set apart" "$blk3"
printf '%s\n' "$OUT3" | grep -q 'no method change to blame' \
  && note "3: and the edit keeps the forgery sentence" \
  || bad "3: the edit under a law change lost the forgery sentence" "$(printf '%s\n' "$OUT3" | tail -16)"

# ---- 4. no law change, a number edited ----------------------------------------
T4="$(tower edit)"
node -e "
  const fs = require('fs'), f = '$T4/reckoning/ledger.json';
  const l = JSON.parse(fs.readFileSync(f, 'utf8')); l[l.length - 1].sunset = '23:59';
  fs.writeFileSync(f, JSON.stringify(l, null, 2) + '\n');"
OUT4="$(verify_in "$T4")"
if printf '%s\n' "$OUT4" | grep -q "reckon: $LAST HAS DRIFTED"; then
  printf '%s\n' "$OUT4" | grep -q 'CLOCK LAW' && bad "4: an edit with no law change was read as a clock law" "$OUT4" \
    || note "4: an edit with no law change gets no clock-law words"
  printf '%s\n' "$OUT4" | grep -q 'no method change to blame' && note "4: and gets the forgery sentence" \
    || bad "4: the edit did not draw the forgery sentence" "$OUT4"
else
  bad "4: the edited row did not drift at all; the fixture did not land" "$OUT4"
fi

# ---- 5. a dark row takes the fork too (Ember: it carries an offset since Day 20)
LYB="Arctic/Longyearbyen"
T5="$(tower dark "$LYB")"
node -e "
  const fs = require('fs'), f = '$T5/reckoning/ledger.json';
  const R = require('$SRC/reckoning/reckoning.js');
  const row = R.reckon('2026-12-01', R.LONGYEARBYEN);
  row.publishedAt = '2026-12-01T02:00:00Z';
  const l = JSON.parse(fs.readFileSync(f, 'utf8')); l.push(row);
  fs.writeFileSync(f, JSON.stringify(l, null, 2) + '\n');"
DARK="$(node -e "const l=require('$T5/reckoning/ledger.json'); const r=l[l.length-1]; console.log(r.date, !!r.never, typeof r.utcOffsetMinutes)")"
[ "$DARK" = "2026-12-01 true number" ] && note "5: a dark row with an offset was built" \
  || bad "5: the dark fixture was not built as a dark row with an offset: $DARK"
OUT5="$(verify_in "$T5")"
blk5="$(printf '%s\n' "$OUT5" | grep -A8 'reckon: 2026-12-01 HAS DRIFTED')"
printf '%s\n' "$blk5" | grep -q 'CLOCK LAW' && printf '%s\n' "$blk5" | grep -q 'solarNoon' \
  && note "5: the dark row is read as a clock law, its solar noon accounted for" \
  || bad "5: the dark row did not take the fork" "$blk5"

# ---- every law change landed ------------------------------------------------
# tower() runs inside $(...), so it cannot count a failure itself; it leaves
# the name of any tower whose substitution did not land.
if [ -s "$WORK/unlanded" ]; then
  bad "the law change did NOT land in: $(tr '\n' ' ' < "$WORK/unlanded")"
else
  note "every law change landed in its scratch reckoning.js"
fi

# ---- the real ledger ----------------------------------------------------------
REAL_AFTER="$(sha256sum "$SRC/reckoning/ledger.json" | cut -d' ' -f1)"
[ "$REAL_BEFORE" = "$REAL_AFTER" ] && note "the real ledger's bytes did not move" \
  || bad "the REAL ledger changed during this run"

echo
if [ "$fails" -eq 0 ]; then echo "clock-law-desk: all green"; exit 0; fi
echo "clock-law-desk: $fails red"; exit 1
