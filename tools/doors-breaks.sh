#!/usr/bin/env bash
# tools/doors-breaks.sh — break the door-tracing twelve ways, in a scratch tree.
#
#   ./tools/doors-breaks.sh [tree-to-test]   (default: this tower)
#
# **Every needle here was written after its sabotage, not before it.** That
# is Ash's repair from Day 43, taken as a habit because the rule it replaces
# did not hold: *count what the case is about, never the container* had been
# in the book five days and was broken three times in one morning by the
# hand that had read it. A needle chosen before anything is broken is chosen
# against your own picture of what ought to be true; a needle chosen against
# a tool that is already failing is chosen against the failure.
#
# **The good path's domain is behaviour, never today's weather.** Case 0 does
# not assert that exactly two files have no door, or that `fold-latitude.js`
# is one of them. Both are true this morning and both are the sort of thing a
# repair makes false — Day 44 watched six cases in `banked-breaks.sh` go red
# the moment the hole they were written against was filled, because their
# domain was the standing hole rather than the tool's behaviour. So case 0
# asks only what must hold on any tree: every file accounted for exactly
# once, the counts summing, the limits printed.
#
# **Nothing here touches the real tree**, and its bytes are checked at the
# end regardless (Day 10 — a read tool that writes is a different tool, and
# `doors.js` runs other tools, so it has more ways to write than most).
set -u

SELF="$(basename "$0")"
SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"

fails=0
ok()  { echo "ok    $1"; }
bad() { echo "FAIL  $1"; fails=$((fails + 1)); }
die() { echo "FAIL  $1"; echo; echo "$SELF: could not conclude."; exit 2; }

# **The fixture's name is never spelled beside `tools/` in this file, and
# that cost four red cases to learn.** The subject reads source text. This
# suite lives in `tools/` too, so the copy it plants a fixture into contains
# *this file* — and every `node tools/$ORPHAN` written here as a
# sabotage was, to `doors.js`, an ordinary code line in an ordinary shell
# suite calling that tool. The suite gave its own orphan a door, through
# itself, and then failed the cases asking why the orphan had one. So the
# name is held in a variable and every use is `tools/$ORPHAN`, which the
# subject's path pattern cannot match. **A break-suite that plants a fixture
# into a subject that reads sources must not spell the fixture's name in its
# own source.**
ORPHAN='zz-orphan.js'

REAL_HASH="$(cd "$SRC" && find tools .claude -type f -exec sha256sum {} \; | sort | sha256sum)"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# A fresh copy per case, so no case stands in the wreckage of the one before.
n=0
fresh() {
  n=$((n + 1))
  T="$WORK/t$n"
  mkdir -p "$T"
  (cd "$SRC" && tar -cf - --exclude=.git --exclude=node_modules --exclude=previews .) \
    | (cd "$T" && tar -xf -)
  [ -f "$T/tools/doors.js" ] || die "the fixture was not built — no tools/doors.js in the copy"
  [ -f "$T/.claude/commands/daily.md" ] || die "the fixture was not built — no routine in the copy"
}

# Run the tool in a tree; leaves $OUT and $CODE.
run() {
  OUT="$(cd "$1" && node tools/doors.js 2>&1)"
  CODE=$?
}

# The three verdict blocks, as lists of bare tool names.
block() { printf '%s\n' "$OUT" | sed -n "/^doors: $1/,/^doors:\$/p" | sed -n 's/^doors:   \([a-z0-9][A-Za-z0-9_.-]*\.\(js\|sh\)\).*/\1/p'; }

echo "$SELF: twelve cases, each in its own copy of the tower."
echo

# ── Case 0 — the good path, on behaviour and not on this morning ─────────────
fresh
run "$T"
[ -n "$OUT" ] || die "the good path printed nothing; nothing below would mean anything"

tools_n=$(ls "$T"/tools | grep -cE '\.(js|sh)$')
door_n=$(block 'AT THE DOOR' | wc -l)
carr_n=$(block 'CARRIED' | wc -l)
hole_n=$(block 'NO DOOR' | wc -l)
seen_n=$((door_n + carr_n + hole_n))

if [ "$seen_n" -eq "$tools_n" ]; then
  ok "0a  every file in tools/ is placed exactly once ($tools_n of them)"
else
  bad "0a  $tools_n files in tools/, $seen_n placed — something is counted twice or not at all"
fi

dupes=$( { block 'AT THE DOOR'; block 'CARRIED'; block 'NO DOOR'; } | sort | uniq -d | wc -l)
[ "$dupes" -eq 0 ] \
  && ok "0b  no file appears under two verdicts" \
  || bad "0b  $dupes file(s) appear under more than one verdict"

# The limit is the part of this tool a reader is invited to trust, so it is
# the part that must not be quietly droppable (Day 8: the part of a check
# that gets no scrutiny is the part offered as the reason to trust it).
printf '%s\n' "$OUT" | grep -q 'reachability and not cadence' \
  && ok "0c  the report says on its face that it does not read cadence" \
  || bad "0c  the cadence limit is not printed"

printf '%s\n' "$OUT" | grep -q 'an absence is not a finding' \
  && ok "0d  the report says what it cannot see" \
  || bad "0d  the blind-spot paragraph is not printed"

printf '%s\n' "$OUT" | grep -q "$T" \
  && ok "0e  the report names the tree it traced" \
  || bad "0e  the report does not say which tree it traced"

# ── the orphan fixture, used by cases 1 to 5 and 11 ──────────────────────────
# **The orphan must be a file the rehearsal does not glob, and the first
# draft of this suite got that wrong.** It planted `zz-orphan.sh`, and
# `move-rehearsal.sh` walks every `tools/*.sh` — so the fixture was carried
# by the Sunday door the moment it was written, and four cases went red
# about a tool that was right. Day 39's rule, paid again: **a fixture that
# does not model the thing it names tests the other thing and reports the
# name.** A genuine orphan here is a `.js` that reads no `FAR_KEEPER_URL`:
# not a shell suite, not a browser suite, named by nobody.
plant_orphan() {
  printf '#!/usr/bin/env node\nconsole.log("orphan");\n' > "$1/tools/$ORPHAN"
  [ -f "$1/tools/$ORPHAN" ] || die "the fixture was not built — zz-orphan.js did not land"
  ( cd "$1" && ./tools/move-rehearsal.sh --list ) | grep -q 'zz-orphan' \
    && die "the fixture does not model an orphan — the rehearsal globs it, so it has a door by construction"
  return 0
}

# ── Case 1 — a tool nothing reaches is a hole ────────────────────────────────
fresh
base_holes=$(run "$T"; block 'NO DOOR' | wc -l)
plant_orphan "$T"
run "$T"
now_holes=$(block 'NO DOOR' | wc -l)
if [ "$now_holes" -eq "$((base_holes + 1))" ] && block 'NO DOOR' | grep -qx 'zz-orphan.js'; then
  ok "1   a tool nothing reaches lands under NO DOOR, and the count moves by exactly one"
else
  bad "1   planting an orphan took holes from $base_holes to $now_holes and it is $(block 'NO DOOR' | grep -qx 'zz-orphan.js' && echo named || echo unnamed)"
fi
[ "$CODE" -eq 2 ] \
  && ok "1b  a standing hole exits 2" \
  || bad "1b  a tree with a known orphan exited $CODE, not 2"

# ── Case 2 — the locked routine calling it makes it a door ───────────────────
fresh
plant_orphan "$T"
printf '\n```bash\nnode tools/%s\n```\n' "$ORPHAN" >> "$T/.claude/commands/daily.md"
grep -q "node tools/$ORPHAN" "$T/.claude/commands/daily.md" \
  || die "the fixture was not built — the routine was not edited"
run "$T"
block 'AT THE DOOR' | grep -qx 'zz-orphan.js' \
  && ok "2   a tool the locked routine invokes is AT THE DOOR" \
  || bad "2   the routine invokes zz-orphan.js and it is not at the door"

# ── Case 3 — a mention in the routine is not a call ──────────────────────────
# The fault this file's subject had at nine this morning, pointed at the
# routine rather than at a tool: prose naming a tool is prose.
fresh
plant_orphan "$T"
printf '\nThe old `tools/%s` was retired and is named here only as history.\n' "$ORPHAN" \
  >> "$T/.claude/commands/daily.md"
grep -q "tools/$ORPHAN" "$T/.claude/commands/daily.md" \
  || die "the fixture was not built — the routine mention was not written"
run "$T"
if block 'NO DOOR' | grep -qx 'zz-orphan.js'; then
  ok "3a  a tool the routine merely names is still NO DOOR"
else
  bad "3a  a bare mention in the routine was read as a door"
fi
printf '%s\n' "$OUT" | grep -q 'NAMED BUT NOT CALLED' \
  && ok "3b  the mention is reported rather than dropped" \
  || bad "3b  the mention vanished instead of being listed"

# ── Case 4 — a comment inside a tool is not an edge ──────────────────────────
fresh
plant_orphan "$T"
printf '\n# See tools/%s for the older shape of this.\n' "$ORPHAN" >> "$T/tools/parses.sh"
grep -q "tools/$ORPHAN" "$T/tools/parses.sh" \
  || die "the fixture was not built — the comment was not written"
run "$T"
block 'NO DOOR' | grep -qx 'zz-orphan.js' \
  && ok "4   a comment naming a tool carries nothing" \
  || bad "4   a comment was read as wiring — the Day 45 fault, back"

# ── Case 5 — a code line calling it is an edge, and the chain is named ───────
fresh
plant_orphan "$T"
printf '\nnode tools/%s >/dev/null 2>&1 || true\n' "$ORPHAN" >> "$T/tools/parses.sh"
grep -q "node tools/$ORPHAN" "$T/tools/parses.sh" \
  || die "the fixture was not built — the call was not written"
run "$T"
line="$(printf '%s\n' "$OUT" | grep '  zz-orphan.js ')"
if printf '%s' "$line" | grep -q 'parses.sh'; then
  ok "5   a tool called from code is CARRIED, and the chain names its carrier"
else
  bad "5   zz-orphan.js is called from parses.sh and the chain does not say so: '$line'"
fi

# ── Case 6 — the asking is load-bearing, and its domain is not empty ─────────
# `move-rehearsal.sh` globs its case list, so nothing in its text names a
# suite. Stop this file asking and those suites must go dark. The domain is
# asserted non-empty first: a case that would pass over nothing is the fault
# this house has now met eight times.
fresh
run "$T"
asked_before=$(block 'NO DOOR' | wc -l)
printf '%s\n' "$OUT" | grep -q 'reached by an ASKED edge and by no' \
  || die "the domain is empty — no file is reached by asking alone, so case 6 would pass for free"
perl -0pi -e 's/function advertisesList\(name, text\) \{/function advertisesList(name, text) { return false;/' "$T/tools/doors.js"
grep -q 'return false;' "$T/tools/doors.js" \
  || die "the sabotage did NOT land — advertisesList was not collapsed"
run "$T"
asked_after=$(block 'NO DOOR' | wc -l)
if [ "$asked_after" -gt "$((asked_before + 20))" ]; then
  ok "6   with the asking removed, holes go $asked_before -> $asked_after: the run-time edges are the wiring"
else
  bad "6   removing the asking moved holes only $asked_before -> $asked_after; the ASKED edges are not doing the work this file claims"
fi

# ── Case 7 — the self-declaration rule is the claim ──────────────────────────
# Narrower than case 6 on purpose: take `--list` off `banked.js`'s own usage
# line only, and exactly its three gatherers should fall out, while the
# thirty-odd the rehearsal carries stay put.
fresh
run "$T"
block 'NO DOOR' | grep -qx 'cross-check-sweep.js' \
  && die "the fixture is wrong — cross-check-sweep.js is already a hole before the sabotage"
perl -0pi -e "s/usage: banked\.js \[--help\] \[--list\]/usage: banked.js [--help]/" "$T/tools/banked.js"
grep -q "usage: banked.js \[--help\]'" "$T/tools/banked.js" \
  || die "the sabotage did NOT land — banked.js still advertises --list"
run "$T"
gone=0
for g in cross-check-sweep.js drift-gap-sweep.js drift-tolerance-sweep.js; do
  block 'NO DOOR' | grep -qx "$g" && gone=$((gone + 1))
done
[ "$gone" -eq 3 ] \
  && ok "7   a tool that stops advertising --list stops being asked, and its three gatherers go dark" \
  || bad "7   banked.js stopped advertising --list and only $gone of its 3 gatherers fell out"

# ── Case 8 — a tool that advertises --list and cannot answer is a named hole ─
fresh
plant_orphan "$T"
cat > "$T/tools/$ORPHAN" <<'EOS'
#!/usr/bin/env bash
# usage: zz-orphan.js [--list]
echo "zz-orphan: no." >&2
exit 1
EOS
chmod +x "$T/tools/$ORPHAN"
printf '\nnode tools/%s >/dev/null 2>&1 || true\n' "$ORPHAN" >> "$T/tools/parses.sh"
grep -q -- '--list' "$T/tools/$ORPHAN" \
  || die "the fixture was not built — the orphan does not advertise --list"
run "$T"
printf '%s\n' "$OUT" | grep -q 'asked and could not answer' \
  && ok "8   a tool that offers --list and refuses is reported, not silently treated as edgeless" \
  || bad "8   a broken --list went by without a word"

# ── Case 9 — exit 1 stays unspent ────────────────────────────────────────────
# The lock on the one code nothing here may take. A later hand wiring a
# judgement in reddens this case rather than quietly taking the alarm.
fresh
if grep -qE '(return|process\.exit\()\s*1\s*[;)]' "$T/tools/doors.js"; then
  bad "9   doors.js can now exit 1 — that code is for a verdict this file does not make"
else
  ok "9   exit 1 is unspent: this file reports the wiring and convicts nobody"
fi

# ── Case 10 — an unknown flag is refused, and spends neither verdict code ────
fresh
out10="$( (cd "$T" && node tools/doors.js --nonsense) 2>&1 )"; code10=$?
if [ "$code10" -eq 3 ] && printf '%s' "$out10" | grep -q 'INVALID'; then
  ok "10a unknown flag: INVALID, exit 3"
else
  bad "10a unknown flag exited $code10 saying '$(printf '%s' "$out10" | head -1)'"
fi
printf '%s' "$out10" | grep -q 'AT THE DOOR' \
  && bad "10b a refused flag still printed the report" \
  || ok "10b a refused flag prints no report"

# ── Case 11 — it does not write ──────────────────────────────────────────────
fresh
before="$(cd "$T" && find . -type f -newer "$T/tools/doors.js" 2>/dev/null | wc -l)"
hash_before="$(cd "$T" && find tools .claude -type f -exec sha256sum {} \; | sort | sha256sum)"
run "$T"
hash_after="$(cd "$T" && find tools .claude -type f -exec sha256sum {} \; | sort | sha256sum)"
[ "$hash_before" = "$hash_after" ] \
  && ok "11  the copy's bytes did not move: a read tool that writes is a different tool" \
  || bad "11  doors.js changed the tree it was reading"

echo
if [ "$REAL_HASH" = "$(cd "$SRC" && find tools .claude -type f -exec sha256sum {} \; | sort | sha256sum)" ]; then
  ok "    the real tower's tools/ and routine were not touched"
else
  bad "    the REAL tree moved — this file must only ever work in a copy"
fi

echo
if [ "$fails" -gt 0 ]; then
  echo "$SELF: $fails case(s) red."
  exit 1
fi
echo "$SELF: every case green."
