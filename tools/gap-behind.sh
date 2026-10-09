#!/usr/bin/env bash
# tools/gap-behind.sh — make reckon.js's GAP_BEHIND gate fail, in a scratch
# tree, and prove each case can tell the gate from its absence.
#
#   ./tools/gap-behind.sh             check the working tree's reckon.js
#   ./tools/gap-behind.sh /some/tree  check another copy of the tower
#
# Built Day 67. A row that would leave a date unclaimed behind it is refused
# unless `--leave-gap` is given. The case list is Ember's, written before the
# gate was, and its first section is the sabotage: with the gate cut out the
# gap cases must WRITE, and that is asserted before any red from them is
# believed (Day 5, Day 17 — watch both the breaking and the building).
#
# It never opens the real ledger for writing. Fixtures are cut from a copy of
# it at run time, relative to the standing place's today as the scratch tree's
# own instrument answers it — never a typed date, because a typed date has an
# expiry nobody dates (Day 16). If the standing day turns over while the suite
# runs, the run says so and refuses to conclude (exit 2).
#
# Exit 0 all green, 1 a case red, 2 the run could not conclude.
set -u

SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
REAL="$SRC/reckoning/ledger.json"
REAL_HASH="$(sha256sum "$REAL" | cut -d' ' -f1)"
ROOT="$(mktemp -d)"
trap 'rm -rf "$ROOT"' EXIT
fails=0

build() {  # build <dir> <reckon.js source>
  mkdir -p "$1/tools" "$1/reckoning"
  cp "$2" "$1/tools/reckon.js"
  cp "$SRC/reckoning/reckoning.js" "$1/reckoning/"
}

W="$ROOT/w";   build "$W" "$SRC/tools/reckon.js"
S="$ROOT/sab"; build "$S" "$SRC/tools/reckon.js"

today() { (cd "$W" && node -e "const R=require('./reckoning/reckoning.js');process.stdout.write(R.todayAt(R.STANDING.place.zone))"); }
T0="$(today)"
[ -n "$T0" ] || { echo "UNCLEAR could not ask the scratch tower what day it is"; exit 2; }

# fixture <out> <k> <same|other|shuffle|empty|ahead|today>
#   k: the newest date kept is today - (k + 1), so k dates lie between it and today.
fixture() {
  (cd "$W" && node -e "
    const R=require('./reckoning/reckoning.js');
    const fs=require('fs');
    const [out,k,mode]=process.argv.slice(1);
    const today=R.todayAt(R.STANDING.place.zone);
    let rows=JSON.parse(fs.readFileSync('$REAL','utf8')).filter(r=>r.date!==today && r.date<today);
    if (mode==='empty') rows=[];
    else if (mode==='today') rows=JSON.parse(fs.readFileSync('$REAL','utf8')).filter(r=>r.date<today)
      .concat([Object.assign(R.reckon(today,R.STANDING.place),{publishedAt:new Date().toISOString()})]);
    else if (mode==='ahead') rows=rows.concat([Object.assign(R.reckon(R.shiftDate(today,1),R.STANDING.place),{publishedAt:new Date().toISOString()})]);
    else {
      const cut=R.shiftDate(today,-(Number(k)+1));
      rows=rows.filter(r=>r.date<=cut);
      if (mode==='other') {
        const i=rows.findIndex(r=>r.date===cut);
        rows[i]=Object.assign({},rows[i],{place:{name:'Elsewhere',latitude:10,longitude:10,zone:'Africa/Lagos'}});
      }
      if (mode==='shuffle') rows=rows.slice().reverse();
      if (!rows.length || rows.reduce((m,r)=>r.date>m?r.date:m,'')!==cut) { console.error('fixture newest is not '+cut); process.exit(3); }
    }
    fs.writeFileSync(out, JSON.stringify(rows,null,2)+'\n');
  " "$1" "$2" "$3") || { echo "UNCLEAR fixture $3/$2 was not built"; exit 2; }
  [ -s "$1" ] || { echo "UNCLEAR fixture $3/$2 is empty on disk"; exit 2; }
}

# run <tree> <fixture> args... ; sets OUT, EXIT, MOVED (yes|no)
run() {
  local tree="$1" fix="$2"; shift 2
  cp "$fix" "$tree/reckoning/ledger.json"
  local before; before="$(sha256sum "$tree/reckoning/ledger.json" | cut -d' ' -f1)"
  OUT="$(cd "$tree" && node tools/reckon.js "$@" 2>&1)"; EXIT=$?
  local after; after="$(sha256sum "$tree/reckoning/ledger.json" | cut -d' ' -f1)"
  MOVED=no; [ "$before" = "$after" ] || MOVED=yes
}

ok()  { echo "ok    $1"; }
bad() { fails=$((fails+1)); echo "FAIL  $1"; [ -n "${2:-}" ] && echo "$2" | sed 's/^/        /'; }

F="$ROOT/f"; mkdir -p "$F"
fixture "$F/other1.json"  1 other
fixture "$F/same1.json"   1 same
fixture "$F/other3.json"  3 other
fixture "$F/shuf1.json"   1 shuffle
fixture "$F/contig.json"  0 same
fixture "$F/empty.json"   0 empty
fixture "$F/today.json"   0 today
fixture "$F/ahead.json"   0 ahead

echo "-- the sabotage first: the gate cut out, and the gap cases must write --"
perl -0pi -e 's/if \(behind\.dates\.length > 0 && !leaveGap\)/if (false)/' "$S/tools/reckon.js"
if cmp -s "$SRC/tools/reckon.js" "$S/tools/reckon.js"; then
  bad "sabotage did NOT land"
else
  (cd "$S" && node tools/reckon.js --help >/dev/null 2>&1) && ok "the sabotaged tool still answers" || bad "the sabotaged tool does not run"
  run "$S" "$F/other1.json"; [ "$MOVED" = yes ] && [ "$EXIT" = 0 ] && ok "without the gate a one-day gap from elsewhere is written (exit $EXIT)" || bad "without the gate the gap case did not write — the cases below would prove nothing" "$OUT"
  run "$S" "$F/same1.json";  [ "$MOVED" = yes ] && ok "without the gate a slept-through gap is written" || bad "without the gate the slept-through case did not write" "$OUT"
fi

echo
echo "-- a move: a gap behind a row from another place --"
run "$W" "$F/other1.json"
[ "$EXIT" = 2 ] && [ "$MOVED" = no ] && ok "refused, exit 2, nothing written" || bad "a one-day gap after a move was not refused (exit $EXIT, moved $MOVED)" "$OUT"
D1="$(cd "$W" && node -e "const R=require('./reckoning/reckoning.js');process.stdout.write(R.shiftDate('$T0',-1))")"
echo "$OUT" | grep -q "^reckon: GAP_BEHIND — .*unclaimed behind it: $D1\.$" && ok "names the one date, $D1" || bad "the refusal does not name $D1" "$OUT"
echo "$OUT" | grep -q "put the move back, reckon there, then move again" && ok "says how to claim it: put the move back" || bad "no move remedy" "$OUT"
echo "$OUT" | grep -q "morning nobody woke" && bad "a move was told the slept-through story" "$OUT" || ok "a move is not told the slept-through story"
last="$(echo "$OUT" | tail -1)"; echo "$last" | grep -q -- "--leave-gap" && ok "the bypass is named last" || bad "the bypass is not the last line" "$OUT"
[ "$(echo "$OUT" | grep -c -- '--leave-gap')" = 1 ] && ok "and only once" || bad "the bypass is named more than once" "$OUT"

echo
echo "-- a slept-through morning: same place, different word --"
run "$W" "$F/same1.json"
[ "$EXIT" = 2 ] && [ "$MOVED" = no ] && ok "refused, exit 2, nothing written" || bad "a slept-through gap was not refused" "$OUT"
echo "$OUT" | grep -q "morning nobody woke" && ok "told the slept-through story" || bad "not told the slept-through story" "$OUT"
echo "$OUT" | grep -q "put the move back" && bad "a slept-through morning was told the move story" "$OUT" || ok "not told the move story"

echo
echo "-- three dates, and the max date even when it is not the last row --"
run "$W" "$F/other3.json"
n="$(echo "$OUT" | grep '^reckon: GAP_BEHIND' | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}' | wc -l)"
# the GAP line carries the written date plus each unclaimed one
[ "$EXIT" = 2 ] && [ "$n" = 4 ] && echo "$OUT" | grep -q "3 dates unclaimed" && ok "names all three dates" || bad "a three-day gap was not named whole (exit $EXIT, $n dates on the line)" "$OUT"
run "$W" "$F/shuf1.json"
[ "$EXIT" = 2 ] && echo "$OUT" | grep -q "unclaimed behind it: $D1\.$" && ok "rows reversed: newest is the greatest date, not the last element" || bad "reversed rows fooled the gate" "$OUT"

echo
echo "-- no gap: the old behaviour is untouched --"
run "$W" "$F/contig.json"; [ "$EXIT" = 0 ] && [ "$MOVED" = yes ] && ok "contiguous ledger: written" || bad "contiguous ledger not written (exit $EXIT)" "$OUT"
run "$W" "$F/empty.json";  [ "$EXIT" = 0 ] && [ "$MOVED" = yes ] && ok "empty ledger, first row ever: written" || bad "empty ledger not written (exit $EXIT)" "$OUT"
run "$W" "$F/today.json";  [ "$MOVED" = no ] && echo "$OUT" | grep -q "already in the ledger" && ! echo "$OUT" | grep -q GAP_BEHIND && ok "today already held: the old word, not GAP_BEHIND" || bad "today already held got the wrong word" "$OUT"
run "$W" "$F/ahead.json";  [ "$EXIT" = 0 ] && [ "$MOVED" = yes ] && ! echo "$OUT" | grep -q GAP_BEHIND && ok "a row dated after today (the far side of a westward crossing): no gap, written" || bad "a newest row after today tripped the gate" "$OUT"

echo
echo "-- --leave-gap --"
run "$W" "$F/other1.json" --leave-gap; [ "$EXIT" = 0 ] && [ "$MOVED" = yes ] && ok "with a gap: written, exit 0" || bad "--leave-gap did not write" "$OUT"
run "$W" "$F/contig.json" --leave-gap; [ "$EXIT" = 0 ] && [ "$MOVED" = yes ] && ok "with no gap: written as usual (pinned: it is a permission, not a demand)" || bad "--leave-gap with no gap misbehaved" "$OUT"
run "$W" "$F/other1.json" --leave-gap --leave-gap; [ "$EXIT" = 2 ] && [ "$MOVED" = no ] && ok "twice: INVALID, exit 2" || bad "--leave-gap twice was not refused" "$OUT"
run "$W" "$F/other1.json" --leave-gap --wibble;   [ "$EXIT" = 2 ] && [ "$MOVED" = no ] && ok "with junk: INVALID, exit 2" || bad "--leave-gap with junk was not refused" "$OUT"
run "$W" "$F/other1.json" --leave-gap --verify;   [ "$EXIT" = 2 ] && [ "$MOVED" = no ] && ok "with --verify: INVALID, exit 2" || bad "--leave-gap with --verify was not refused" "$OUT"
run "$W" "$F/other1.json" --leave-gap "$T0";      [ "$EXIT" = 0 ] && [ "$MOVED" = yes ] && ok "with today named: written" || bad "--leave-gap with today's date failed" "$OUT"

echo
echo "-- the calendar's edges, asked of the function itself --"
(cd "$W" && node -e "
  const { unclaimedBehind } = require('./tools/reckon.js');
  const c = (n, d, want) => { const got = unclaimedBehind([{date:n}], d).dates.join(','); console.log((got===want?'ok    ':'FAIL  ')+n+' -> '+d+': ['+got+']'+(got===want?'':' wanted ['+want+']')); };
  c('2026-10-31','2026-11-02','2026-11-01');
  c('2026-12-31','2027-01-02','2027-01-01');
  c('2028-02-28','2028-03-01','2028-02-29');
  c('2027-02-28','2027-03-02','2027-03-01');
  c('2026-10-09','2026-10-10','');
  c('2026-10-10','2026-10-10','');
") > "$ROOT/edges.txt" 2>&1
cat "$ROOT/edges.txt"
fails=$((fails + $(grep -c '^FAIL' "$ROOT/edges.txt")))
[ "$(grep -c '^ok' "$ROOT/edges.txt")" = 6 ] || { fails=$((fails+1)); echo "FAIL  the edge cases did not all run"; }

echo
grep -rq 'return 1\|exit(1)' <(grep -n 'GAP_BEHIND\|leaveGap\|unclaimedBehind' "$SRC/tools/reckon.js") && bad "the gate spends exit 1" || ok "the gate never spends exit 1"
[ "$(sha256sum "$REAL" | cut -d' ' -f1)" = "$REAL_HASH" ] && ok "the real ledger's bytes did not move" || bad "the REAL ledger changed during the run"
T1="$(today)"
if [ "$T0" != "$T1" ]; then echo "UNCLEAR the standing day turned over during the run ($T0 -> $T1); nothing is concluded"; exit 2; fi

echo
if [ "$fails" -gt 0 ]; then echo "gap-behind: $fails red"; exit 1; fi
echo "gap-behind: all cases green"
