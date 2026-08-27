#!/usr/bin/env bash
# tools/standing-clock.sh — the gate reads the calendar of the place the
# tower stands in, and not one particular city's.
#
#   ./tools/standing-clock.sh            check the working tree
#   ./tools/standing-clock.sh /some/tree check another copy of the tower
#
# Day 19. Until this morning `tools/reckon.js` computed "today" from
# `Europe/Paris` outright, and the note under it said the reckoning is over
# Paris so Paris's calendar governs. The first half was true. The second was
# a step it does not support: what governs is the calendar of the place the
# tower stands in, and Paris was that place. Once the tower can stand
# somewhere else, that line stops being a description and becomes a rule
# about a city the tower has left — refusing the new place's honest today,
# and demanding in its stead a date the new place has not yet reached.
#
# Three things are built into the shape of this file, all of them paid for
# on other mornings.
#
# **It never opens the real ledger** (Day 10). Every case runs in a
# `mktemp -d` copy of the tower, and the real ledger's bytes are checked at
# the end regardless.
#
# **It picks its second zone at the moment it runs** (Day 17). A hardcoded
# pair — Paris and New York, say — disagree about the calendar date for six
# hours out of twenty-four, so eighteen hours a day the case would compare
# two identical dates, assert nothing, and pass. Not an expiring case: a
# case that is green whether or not the tool works, for three quarters of
# every day, without ever once saying so. So the suite goes and finds a zone
# that genuinely disagrees with the standing place *now*, and refuses to
# draw any conclusion if it cannot find one.
#
# **It asserts its fixture was built** as hard as it asserts its sabotage
# landed (Day 17). A tower that failed to be rewritten to the far zone would
# make every case below pass for the wrong reason.
set -u

SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

REAL_LEDGER="$SRC/reckoning/ledger.json"
REAL_LEDGER_HASH="$(sha256sum "$REAL_LEDGER" | cut -d' ' -f1)"

fails=0
ok()  { echo "ok    $1"; }
bad() { echo "FAIL  $1"; fails=$((fails + 1)); }

# ---- find a zone whose today is not the standing place's today ----
#
# There is always one: the inhabited zones span UTC−12 to UTC+14, which is
# twenty-six hours, so at every instant the world is on at least two
# calendar dates. "Always" is an argument, though, and this file does not
# run on arguments — it looks, and it says what it found.
read -r NEAR_ZONE NEAR_TODAY FAR_ZONE FAR_TODAY <<EOF
$(node -e '
  const { STANDING, todayAt } = require(process.argv[1] + "/reckoning/reckoning.js");
  const near = todayAt(STANDING.place.zone);
  const candidates = [
    "Pacific/Kiritimati", "Pacific/Auckland", "Asia/Tokyo", "Asia/Kolkata",
    "Europe/London", "Atlantic/Reykjavik", "America/Sao_Paulo",
    "America/New_York", "America/Los_Angeles", "Pacific/Honolulu",
    "Pacific/Midway"
  ];
  for (const zone of candidates) {
    const there = todayAt(zone);
    if (there !== near) {
      console.log([STANDING.place.zone, near, zone, there].join(" "));
      process.exit(0);
    }
  }
  console.log([STANDING.place.zone, near, "NONE", "NONE"].join(" "));
' "$SRC")
EOF

if [ "$FAR_ZONE" = "NONE" ]; then
  bad "no zone on the list disagrees with $NEAR_ZONE about the date — nothing below was tested"
  echo
  echo "standing-clock: $fails failed"
  exit 1
fi

echo "standing-clock: $NEAR_ZONE says $NEAR_TODAY; $FAR_ZONE says $FAR_TODAY."
echo

# ---- build a tower standing in the far zone ----
mkdir -p "$WORK/tools" "$WORK/reckoning"
cp "$SRC/tools/reckon.js" "$WORK/tools/"
cp "$SRC/reckoning/reckoning.js" "$WORK/reckoning/"
echo '[]' > "$WORK/reckoning/ledger.json"

# The far place is a real place object, held to what `placeProblem()` asks
# of a ledger row: a name, a latitude and longitude on the earth, and a zone
# the clock has heard of. A fixture standing somewhere impossible would be
# testing the UNPLACED branch by accident.
#
# The rewrite goes through node with a plain string replace rather than a
# shell-interpolated regex. A zone name carries slashes, and the first
# version of this line handed `America/Sao_Paulo` to perl as a pattern; the
# fixture assertion below caught it on the first run, which is the entire
# reason that assertion is there.
FAR_NAME="Farside"
node -e '
  const fs = require("fs");
  const file = process.argv[1] + "/reckoning/reckoning.js";
  const before = fs.readFileSync(file, "utf8");
  // The needle is anchored to the STANDING literal and names no city
  // (Day 24). `place: PARIS,` was the old one, and the first morning this
  // tower stands anywhere else it stops matching — the fixture is then an
  // unmoved tower and every case below is meaningless. Rehearsed rather
  // than argued: `tools/move-rehearsal.sh` ran this file in a tower moved
  // to Ushuaia and it refused, correctly, with *the fixture tower was NOT
  // moved*. Honest, and it tests nothing on the day it says that.
  // Anchored at BOTH ends of the field — `place:` on one side and the key
  // after it on the other — so it matches whatever expression stands there:
  // an identifier, an inline object, anything. A needle that matches only an
  // identifier is the same mistake one draft later.
  const NEEDLE = /var STANDING = \{\s*place:[\s\S]*?since:/;
  const to = "var STANDING = {\n    place: { name: " + JSON.stringify(process.argv[2]) +
    ", latitude: 0, longitude: 0, zone: " + JSON.stringify(process.argv[3]) + " },\n    since:";
  if (!NEEDLE.test(before)) process.exit(1);
  fs.writeFileSync(file, before.replace(NEEDLE, to));
' "$WORK" "$FAR_NAME" "$FAR_ZONE" || true

if node -e '
  const { STANDING } = require(process.argv[1] + "/reckoning/reckoning.js");
  process.exit(STANDING.place.zone === process.argv[2] ? 0 : 1);
' "$WORK" "$FAR_ZONE"; then
  ok "the fixture tower stands at $FAR_ZONE"
else
  bad "the fixture tower was NOT moved — it still stands at $NEAR_ZONE. Nothing below means anything."
  echo
  echo "standing-clock: $fails failed"
  exit 1
fi

run() { (cd "$WORK" && node tools/reckon.js "$@" 2>&1); }
run_exit() { (cd "$WORK" && node tools/reckon.js "$@" >/dev/null 2>&1; echo $?); }

# ---- the gate asks the tower's calendar ----
#
# These two cases are the whole fault, and they are a matched pair: the same
# tool, the same instant, two dates, and before this morning it answered
# both of them the wrong way round.
out="$(run "$FAR_TODAY")"; code="$(run_exit "$FAR_TODAY")"
if [ "$code" = "0" ] && printf '%s' "$out" | grep -q "wrote $FAR_TODAY"; then
  ok "today at $FAR_NAME ($FAR_TODAY) is accepted and written"
else
  bad "today at $FAR_NAME ($FAR_TODAY) was refused — exit $code"
  printf '%s\n' "$out" | sed 's/^/      /'
fi

cp /dev/null "$WORK/reckoning/ledger.json"; echo '[]' > "$WORK/reckoning/ledger.json"
out="$(run "$NEAR_TODAY")"; code="$(run_exit "$NEAR_TODAY")"
if [ "$code" = "2" ] && printf '%s' "$out" | grep -q "NOT_TODAY"; then
  ok "today at $NEAR_ZONE ($NEAR_TODAY) is refused NOT_TODAY — it is not this tower's day"
else
  bad "a date that is not today where the tower stands was not refused — exit $code"
  printf '%s\n' "$out" | sed 's/^/      /'
fi

if printf '%s' "$out" | grep -q "today at $FAR_NAME is $FAR_TODAY"; then
  ok "the refusal names the place whose calendar it is reading"
else
  bad "the refusal does not name the standing place — a keeper cannot tell which calendar refused them"
  printf '%s\n' "$out" | sed 's/^/      /'
fi

if [ "$(cat "$WORK/reckoning/ledger.json")" = "[]" ]; then
  ok "the refused day wrote nothing"
else
  bad "the refused day wrote to the ledger"
fi

# ---- the row is written for the place the tower stands in ----
echo '[]' > "$WORK/reckoning/ledger.json"
run >/dev/null 2>&1
if node -e '
  const rows = require(process.argv[1] + "/reckoning/ledger.json");
  const row = rows[0];
  if (!row) { console.error("no row"); process.exit(1); }
  process.exit(row.place && row.place.zone === process.argv[2] && row.date === process.argv[3] ? 0 : 1);
' "$WORK" "$FAR_ZONE" "$FAR_TODAY"; then
  ok "the written row is dated $FAR_TODAY and placed at $FAR_NAME"
else
  bad "the written row does not carry the standing place and its date"
  node -e 'console.error(JSON.stringify(require(process.argv[1] + "/reckoning/ledger.json")[0] || null))' "$WORK"
fi

# ---- a day already spoken for from somewhere else ----
#
# The move that walks back onto a published day. The row in the ledger was
# published at one place; the tower now stands at another and its own today
# is that same date. Nothing is written — the ledger is cold — and the point
# of the case is that the tool must not hand the keeper the sentence written
# for someone who ran it twice before breakfast.
node -e '
  const fs = require("fs");
  const path = process.argv[1] + "/reckoning/ledger.json";
  const rows = JSON.parse(fs.readFileSync(path, "utf8"));
  rows[0].place = { name: "Elsewhere", latitude: 0, longitude: 0, zone: "UTC" };
  fs.writeFileSync(path, JSON.stringify(rows, null, 2) + "\n");
' "$WORK"

if node -e '
  const rows = require(process.argv[1] + "/reckoning/ledger.json");
  process.exit(rows[0].place.name === "Elsewhere" ? 0 : 1);
' "$WORK"; then
  ok "the fixture row was re-placed at Elsewhere"
else
  bad "the fixture row was NOT re-placed — the collision case below is not the case it is named for"
fi

before="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"
out="$(run)"
after="$(sha256sum "$WORK/reckoning/ledger.json" | cut -d' ' -f1)"

if printf '%s' "$out" | grep -q "ALREADY_PUBLISHED"; then
  ok "a day published from another place is ALREADY_PUBLISHED, not a repeated run"
else
  bad "the move-collision was not told apart from a keeper running the tool twice"
  printf '%s\n' "$out" | sed 's/^/      /'
fi

if printf '%s' "$out" | grep -q "published at Elsewhere"; then
  ok "it names the place that claimed the day"
else
  bad "it does not name the place the day was published at"
fi

if [ "$before" = "$after" ]; then
  ok "the collision wrote nothing"
else
  bad "the collision rewrote the ledger — the record is not cold"
fi

# The other half of the fork, and it has to be here or the case above is
# only half a test: standing where the row was published, the old sentence
# is still the right one and ALREADY_PUBLISHED must NOT appear.
node -e '
  const fs = require("fs");
  const { STANDING } = require(process.argv[1] + "/reckoning/reckoning.js");
  const path = process.argv[1] + "/reckoning/ledger.json";
  const rows = JSON.parse(fs.readFileSync(path, "utf8"));
  rows[0].place = JSON.parse(JSON.stringify(STANDING.place));
  fs.writeFileSync(path, JSON.stringify(rows, null, 2) + "\n");
' "$WORK"

out="$(run)"
if printf '%s' "$out" | grep -q "already in the ledger" && ! printf '%s' "$out" | grep -q "ALREADY_PUBLISHED"; then
  ok "standing where the row was published, it is a plain repeated run"
else
  bad "a repeated run at the same place was dressed as a move"
  printf '%s\n' "$out" | sed 's/^/      /'
fi

# ---- a tower that does not know where it is stands nowhere ----
#
# `todayAt()` throws on a zone the clock has never heard of, and the gate is
# the first thing in the tool that calls it. Unguarded, one mistyped letter
# in a zone name — the likeliest slip there is on a moving morning — comes
# back as a node stack. The word is its own: UNPLACED already means a *row*
# that could not be recomputed.
node -e '
  const fs = require("fs");
  const file = process.argv[1] + "/reckoning/reckoning.js";
  const text = fs.readFileSync(file, "utf8");
  const from = "zone: " + JSON.stringify(process.argv[2]);
  if (!text.includes(from)) process.exit(1);
  fs.writeFileSync(file, text.replace(from, "zone: \"Europe/Paaris\""));
' "$WORK" "$FAR_ZONE" || true

if grep -q "Europe/Paaris" "$WORK/reckoning/reckoning.js"; then
  ok "the fixture tower was given a zone the clock has never heard of"
  out="$(run)"; code="$(run_exit)"
  if [ "$code" = "2" ] && printf '%s' "$out" | grep -q "NOWHERE"; then
    ok "a tower standing in a zone that does not exist is refused NOWHERE, in words"
  else
    bad "a bad standing zone was not refused in words — exit $code"
    printf '%s\n' "$out" | sed 's/^/      /'
  fi
  if ! printf '%s' "$out" | grep -qi "RangeError\|at Object\|node:internal"; then
    ok "and the keeper gets a sentence rather than a stack"
  else
    bad "the keeper got a raw throw where a sentence was owed"
  fi
else
  bad "the bad-zone fixture was NOT built — the two cases under it are meaningless"
fi

# ---- the page and the desk ask one copy of the question ----
#
# `reckoning/page.js` held its own arithmetic for this until Day 19 and the
# keeper's tool held a third copy. The two that matter run on different
# desks, and a disagreement between them would show up in a stranger's
# browser as the page drawing a day the ledger does not hold. This does not
# check the page draws — `tools/ledger-place.js` does that in a browser —
# it checks the page has no second copy left to disagree with.
if grep -q "Reckoning.todayAt" "$SRC/reckoning/page.js" &&
   ! grep -q "function todayInZone" "$SRC/reckoning/page.js"; then
  ok "page.js asks the instrument rather than keeping its own copy"
else
  bad "page.js still holds its own answer to what day it is here"
fi

# ---- the real ledger was never opened (Day 10) ----
if [ "$(sha256sum "$REAL_LEDGER" | cut -d' ' -f1)" = "$REAL_LEDGER_HASH" ]; then
  ok "the tower's own ledger is byte-for-byte what it was"
else
  bad "THE REAL LEDGER MOVED. Check reckoning/ledger.json before committing anything."
fi

echo
if [ "$fails" -eq 0 ]; then
  echo "standing-clock: all cases passed"
  exit 0
fi
echo "standing-clock: $fails failed"
exit 1
