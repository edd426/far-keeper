#!/usr/bin/env bash
#
# drift-tolerance-breaks — break the engine-parting sweep nine ways in a
# scratch tree, and prove `tools/drift-tolerance-sweep.js` says the right word
# for each.
#
# Day 44. The case list is drawn from what the sweep is **obliged** to do, not
# from what it happens to look at (Day 17: a case drawn from the surface asks
# whether the tool does what it does and has no way to ask whether it should).
# The obligations, in plain words, one case each:
#
#   * two engines are actually asked — not one engine twice
#   * a parting means *not bit-identical*, and the bits are load-bearing
#   * the two winners are two measurements and get two names. This is the
#     day's own finding turned into a lock: the witness this replaced carried
#     a singular `largestPartingPath` under an absolute figure belonging to a
#     different leaf, and nothing could have told anyone
#   * a NaN is not a parting, however its bits fall, and it must never spend
#     exit 1
#   * a domain that stops reaching the fold is a fault in the sweep, not a
#     clean reading of the engines
#   * no second engine is a **hole**, never the alarm
#   * the report says outright that it does not speak to 2026-09-10
#   * a mistyped flag spends neither 1 nor 2
#
# Every case asserts its own sabotage landed (Day 5 — a test that cannot break
# always passes) and, where it manufactures something, that the fixture was
# built (Day 17 — a suite that watches its own breaking and not its own
# building is watching one end of itself).
#
# **Each needle here was written after its sabotage, never before** (Ash, Day
# 43). A needle chosen against your own picture of what ought to be true is
# chosen against the wrong thing; three cases in this house were named for one
# fault and answered by another that way, inside one file, on one morning.
#
# Nothing touches the real tree: the tower is copied into a `mktemp -d` and
# the copy's bytes are checked after every run, because the sweep is a read
# tool and a read tool that writes is a different tool (Day 10).
#
# Usage: ./tools/drift-tolerance-breaks.sh [tree-to-test]   (default: this tower)

set -u -o pipefail

SUBJECT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PASS=0
FAIL=0

ok()  { printf 'ok    %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf 'FAIL  %s\n' "$1"; FAIL=$((FAIL + 1)); }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

S=tools/drift-tolerance-sweep.js
R=reckoning/reckoning.js

fresh_tree() {
  local dest="$1"
  rm -rf "$dest"
  mkdir -p "$dest"
  tar -cf - -C "$SUBJECT" \
    --exclude=.git --exclude=node_modules --exclude=previews --exclude=archive . \
    | (cd "$dest" && tar -xf -)
}

run_in() {
  local tree="$1"; shift
  BEFORE="$(cd "$tree" && find . -type f -exec cksum {} + | sort)"
  OUT="$(cd "$tree" && node "$S" "$@" 2>&1)"
  CODE=$?
  AFTER="$(cd "$tree" && find . -type f -exec cksum {} + | sort)"
  if [[ "$BEFORE" != "$AFTER" ]]; then
    bad "the sweep wrote to the tree — a read tool that writes is a different tool"
  fi
}

# A sabotage is proved by bytes moving, never by a commit id: a sha rots when
# history is rewritten, and this sandbox has lied to us about its own floor
# once already (Day 8).
landed() {
  local tree="$1" file="$2" note="$3"
  if cmp -s "$SUBJECT/$file" "$tree/$file"; then
    bad "SABOTAGE DID NOT LAND — $note"
    return 1
  fi
  return 0
}

# The parting count off a run's own report, so a case can compare two runs
# rather than a run against a number typed here.
partings_in() { grep -oE 'between the two engines: [0-9]+' <<<"$1" | grep -oE '[0-9]+' | head -1; }

echo "drift-tolerance-breaks: subject $SUBJECT"
echo

# ── The good path. Every case below is unreadable without it. ────────────────

T="$WORK/clean"; fresh_tree "$T"
if ! (cd "$T" && command -v bun >/dev/null 2>&1); then
  echo "drift-tolerance-breaks: bun is not on this desk — this whole suite is about"
  echo "drift-tolerance-breaks: a two-engine sweep and it cannot be run here. Abstaining"
  echo "drift-tolerance-breaks: rather than reporting a pass over nothing."
  exit 2
fi
run_in "$T"
CLEAN_OUT="$OUT"; CLEAN_CODE=$CODE
CLEAN_PARTINGS="$(partings_in "$CLEAN_OUT")"
if [[ $CLEAN_CODE -eq 0 ]] && grep -q 'AGREES' <<<"$CLEAN_OUT"; then
  ok "the pristine sweep AGREES with the banked witness, exit 0"
else
  bad "the pristine sweep did not agree (exit $CLEAN_CODE) — every case below is unreadable"
  printf '%s\n' "$CLEAN_OUT" | sed 's/^/      /'
fi

# Case 1a — the domain the rest of this file stands on is non-empty. A sweep
# that found no partings at all would make cases 2, 3 and 4 vacuous, and an
# empty domain always says yes (Day 27).
if [[ -n "$CLEAN_PARTINGS" ]] && [[ "$CLEAN_PARTINGS" -gt 0 ]]; then
  ok "the pristine sweep finds $CLEAN_PARTINGS partings — the cases below have something to lose"
else
  bad "the pristine sweep found no partings — cases 2 to 4 are vacuous"
fi

# ── Case 2 — two engines, not one engine twice ──────────────────────────────
#
# The sabotage this file most needed, and it is Day 43's: a case called *both
# gatherers were actually run* once stayed green against a tool that ran
# nothing, because it asked whether the report said the right word and a
# field-trusting tool says it just as readily. So this one does not ask the
# report anything. It points both spawns at node, which cannot be faked, and
# the question is whether the *measurement* collapses.

T="$WORK/oneengine"; fresh_tree "$T"
perl -0pi -e "s/askEngine\('bun', \[\]/askEngine(process.execPath, []/" "$T/$S"
if landed "$T" "$S" "the bun spawn was not redirected to node"; then
  if grep -q "askEngine(process.execPath, \[\], path.join(tmp, 'jsc.json'))" "$T/$S"; then
    run_in "$T"
    N="$(partings_in "$OUT")"
    if [[ "$N" == "0" ]]; then
      ok "asking one engine twice finds 0 partings where two engines find $CLEAN_PARTINGS"
      if [[ $CODE -ne 0 ]] && grep -q 'DIFFERS' <<<"$OUT"; then
        ok "  and the sweep refuses to call that agreement — DIFFERS, exit $CODE"
      else
        bad "  but the sweep called a one-engine run agreement (exit $CODE)"
      fi
    else
      bad "one engine asked twice still reported $N partings — the spawns are not what is measured"
    fi
  else
    bad "SABOTAGE DID NOT LAND — the second spawn is not node"
  fi
fi

# ── Case 3 — the bits are load-bearing ──────────────────────────────────────
#
# Written after the sabotage: `String(v)` is what a decimal comparison would
# do, and the needle is that the count *moves*, not that it moves a particular
# way. A shortest-round-trip printer is allowed to hide a low-bit parting and
# is not obliged to; asserting a direction would be asserting something this
# suite has not measured.

# ── Case 3 — the *tagging* is load-bearing, and the bits are not ────────────
#
# This case was written to prove the raw bit patterns catch partings a decimal
# comparison would hide. Run, it proved the opposite: swapping `bitsOf` for
# `String(v)` at both ends of the round trip gives the **same 143**. JavaScript's
# number-to-string is shortest-round-trip by specification, so it cannot map two
# distinct doubles onto one string — the bits buy no distinctness over decimal
# here at all. Measured on this domain, on this engine pair, on 2026-09-16.
#
# The bits stay, on a narrower claim than the one they were shipped under: they
# take the comparison off a dependence on two engines implementing that printer
# alike, which is itself an engine behaviour and is the very thing this sweep
# exists to doubt. That is worth something and it is not what the first comment
# in the file said. **A claim I could not have corrected without running it** —
# and Ember read the same line and called it sound, because we were both reading
# the argument rather than the measurement.
#
# So what this case locks is what is actually breakable: the **kind tagging**.
# `tag()` puts a number, a string, a boolean and an absence on separate shelves
# before anything is compared, so a leaf that changes *kind* between engines
# reads as a parting instead of being coerced quietly into agreement.
#
# (Day 19's rule bit this case on its first run too: swapping only the tagger
# left `fromBits` handed `1.8522238353807394`, and `BigInt('0x1.85...')` throws,
# so it reported "the bits buy nothing" about a tool that never reached the
# comparison — a fixture's crash wearing the subject's verdict.)
# 3a — a leaf that is a number on one engine and a string on the other. With
# the kinds tagged this is a parting; with them stripped, `0` and `'0'` both
# print `0` and the disagreement vanishes.
KIND_SPLIT='s/      walk\(out, head, row\);/      row.zenithRadians = (typeof Bun === "undefined") ? 0 : "0";\n      walk(out, head, row);/'

T="$WORK/kind"; fresh_tree "$T"
perl -0pi -e "$KIND_SPLIT" "$T/$S"
if landed "$T" "$S" "no kind-split leaf was injected"; then
  run_in "$T"
  N="$(partings_in "$OUT")"
  if [[ -n "$N" ]] && [[ "$N" -gt "$CLEAN_PARTINGS" ]]; then
    ok "a leaf that is a number on one engine and a string on the other parts — $CLEAN_PARTINGS to $N"
  else
    bad "a kind split was not counted as a parting ($N against $CLEAN_PARTINGS)"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

T="$WORK/untagged"; fresh_tree "$T"
perl -0pi -e "$KIND_SPLIT" "$T/$S"
perl -0pi -e "s/  if \(typeof v === 'number'\) return 'f' \+ bitsOf\(v\);/  if (typeof v === 'number') return 's' + String(v);/" "$T/$S"
if landed "$T" "$S" "the tagger was not flattened"; then
  if grep -q "return 's' + String(v);" "$T/$S"; then
    run_in "$T"
    N2="$(partings_in "$OUT")"
    if [[ -n "$N2" ]] && [[ "$N2" -lt "$N" ]]; then
      ok "  flattening the kinds swallows it, $N down to $N2 — the tagging is what catches it"
    else
      bad "  flattening the kinds changed nothing ($N2) — the case above proves nothing"
    fi
  else
    bad "SABOTAGE DID NOT LAND — the tagger survived"
  fi
fi

# ── Case 4 — two winners, two names. The day's finding, locked. ─────────────
#
# Ash's, and it is the reason this file exists at all. Collapse the two winners
# into one — which is exactly the shape the witness this replaced carried,
# a singular `largestPartingPath` over two measurements — and the sweep must
# both stop saying they are two leaves AND stop agreeing with the record.
#
# Case 4a asserts the domain first: if today's worst-absolute and worst-ulps
# happen to land on the same leaf, the collapse changes nothing and this case
# passes over an empty domain.

if grep -q 'two different leaves' <<<"$CLEAN_OUT"; then
  ok "today the two winners are two different leaves — case 4 has something to collapse"

  T="$WORK/fused"; fresh_tree "$T"
  perl -0pi -e "s/    const u = ulpsApart\(x, y\);\n    if \(u > out\.worstUlps\.ulps\) out\.worstUlps = \{ ulps: u, path: k \};/    const u = ulpsApart(x, y);\n    if (gap > out.worstAbsolute.gap - 1) out.worstUlps = { ulps: u, path: out.worstAbsolute.path };/" "$T/$S"
  if landed "$T" "$S" "the ulps winner still picks its own path"; then
    run_in "$T"
    if ! grep -q 'two different leaves' <<<"$OUT" && [[ $CODE -eq 1 ]] && grep -q 'DIFFERS' <<<"$OUT"; then
      ok "laying one name over both winners is caught — DIFFERS, exit 1"
    else
      bad "the fused name passed (exit $CODE) — the thing this file was built on is unwatched"
      printf '%s\n' "$OUT" | sed 's/^/      /'
    fi
  fi
else
  bad "the two winners landed on one leaf today — case 4 has an empty domain, and says so"
fi

# ── Case 5 — the banked record carries both paths, and both are checked ─────
#
# The mirror of case 4, on the record rather than the sweep: put the old
# fusion back into the witness — the ulps winner's path sitting under the
# absolute figure — and the sweep must convict the record.

T="$WORK/refused"; fresh_tree "$T"
ULPS_PATH="$(grep -oE "largestPartingUlpsPath: '[^']+'" "$T/$R" | sed "s/.*'\\(.*\\)'/\\1/")"
perl -0pi -e "s/    largestPartingAbsolutePath: '[^']+',/    largestPartingAbsolutePath: '$ULPS_PATH',/" "$T/$R"
if landed "$T" "$R" "the witness's absolute path was not rewritten"; then
  if [[ -n "$ULPS_PATH" ]] && [[ "$(grep -c "'$ULPS_PATH'" "$T/$R")" -ge 2 ]]; then
    run_in "$T"
    if [[ $CODE -eq 1 ]] && grep -q 'DIFFERS' <<<"$OUT"; then
      ok "a witness naming one path for both winners is convicted — DIFFERS, exit 1"
    else
      bad "the refused witness was accepted (exit $CODE)"
    fi
  else
    bad "SABOTAGE DID NOT LAND — the fixture did not put one path in both fields"
  fi
fi

# ── Case 6 — a NaN is not a parting, and must never spend exit 1 ────────────
#
# Ember's, found by running the sweep rather than reading it. A NaN has 2^52
# legal bit patterns; nothing obliges two engines to pick the same one; and a
# raw-bits comparison would not merely count it as a parting, it would
# *convict*, because `Math.abs(NaN - NaN)` is NaN and `NaN <= tolerance` is
# false. Today's domain holds no NaN, which is a fact about today's domain —
# so this case manufactures one and asserts it landed, then asks whether the
# fold holds.

# The needle here reached past its own sentence on the first run and this is
# the corrected form. Injecting a leaf necessarily moves the leaf *count*, so
# the run DIFFERS from the banked witness and exits 1 — about the count, which
# the fixture deliberately moved, and not about the NaN. The case is named for
# the convictions, so it reads the convictions. Day 41's rule: a check about
# one sentence has no honest edge but that sentence's end.
#
# And the pair is what makes either half mean anything. The fold is only shown
# to be load-bearing by a second fixture that takes it out and watches the same
# NaN convict.
NAN_INJECT='s/      walk\(out, head, row\);/      row.zenithRadians = NaN;\n      walk(out, head, row);/'
convicted_in() { grep -oE 'a move\? [0-9]+ times' <<<"$1" | grep -oE '[0-9]+'; }

T="$WORK/nan"; fresh_tree "$T"
perl -0pi -e "$NAN_INJECT" "$T/$S"
if landed "$T" "$S" "no NaN was injected into the emitted row"; then
  run_in "$T"
  NAN_N="$(grep -oE '[0-9]+ leaves are NaN' <<<"$OUT" | grep -oE '^[0-9]+')"
  if [[ -n "$NAN_N" ]] && [[ "$NAN_N" -gt 0 ]]; then
    ok "the fixture put $NAN_N NaN leaves in front of the sweep — the fold has a domain"
    if [[ "$(convicted_in "$OUT")" == "0" ]]; then
      ok "  and a NaN on both engines convicts nothing — the fold holds"
    else
      bad "  a NaN was convicted ($(convicted_in "$OUT")) — the alarm is corruptible"
    fi
  else
    bad "SABOTAGE DID NOT LAND — no NaN reached the comparison"
  fi
fi

# 6b — and the fold must not become a way of not noticing. A leaf that is NaN
# on one engine and a number on the other is a real disagreement and has to be
# convicted, fold or no fold.
#
# **What the fold is worth, measured rather than argued.** Taking it out and
# re-running case 6a changes nothing: `setFloat64` hands back 7ff8000000000000
# for NaN on both node and bun, checked directly. So the many-payload hazard
# the fold was built against does not occur on this engine pair today — its
# domain is empty, and a guard with an empty domain cannot be broken and so
# cannot be tested. It is kept because the specification permits what these two
# engines happen not to do, and because the cost of being wrong is the alarm
# itself: `Math.abs(NaN - NaN)` is NaN and `NaN <= tolerance` is false, so an
# unfolded NaN would not merely be counted, it would *convict*. A guard on the
# one exit code nothing else may spend is worth keeping at an empty domain,
# said out loud rather than dressed as load-bearing.
ONE_SIDED='s/      walk\(out, head, row\);/      row.zenithRadians = (typeof Bun === "undefined") ? 1 : NaN;\n      walk(out, head, row);/'

T="$WORK/nanone"; fresh_tree "$T"
perl -0pi -e "$ONE_SIDED" "$T/$S"
if landed "$T" "$S" "no one-sided NaN was injected"; then
  run_in "$T"
  C="$(convicted_in "$OUT")"
  if [[ -n "$C" ]] && [[ "$C" -gt 0 ]]; then
    ok "  a NaN on one engine and a number on the other convicts $C times — the fold swallows nothing real"
  else
    bad "  a one-sided NaN went unconvicted ($C) — the fold is hiding a genuine disagreement"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

# ── Case 7 — a domain that stops reaching the fold is a fault in the sweep ──
#
# The first draft tested `never === 'btrue'`, and `never` is a string. It
# printed `0 rows folded dark` over a domain carrying a polar place at both
# solstices — a zero that was a fact about the detector, wearing a
# measurement's face. The guard is what turns that into a refusal.

T="$WORK/nodark"; fresh_tree "$T"
perl -0pi -e "s/    if \(\/\\\\.never\\\$\/\.test\(k\) && a\[0\] === 's'\) out\.dark \+= 1;/    if (false) out.dark += 1;/" "$T/$S"
if landed "$T" "$S" "the dark detector was not disabled"; then
  run_in "$T"
  if [[ $CODE -eq 2 ]] && grep -q 'no row folded' <<<"$OUT"; then
    ok "a sweep that stops reaching the fold refuses rather than reporting a clean zero"
  else
    bad "the fold went unreached and the sweep reported anyway (exit $CODE)"
  fi
fi

# ── Case 8 — no second engine is a hole, never the alarm ────────────────────

T="$WORK/nobun"; fresh_tree "$T"
BEFORE="$(cd "$T" && find . -type f -exec cksum {} + | sort)"
OUT="$(cd "$T" && PATH="$(dirname "$(command -v node)"):/usr/bin:/bin" node "$S" 2>&1)"
CODE=$?
AFTER="$(cd "$T" && find . -type f -exec cksum {} + | sort)"
[[ "$BEFORE" == "$AFTER" ]] || bad "the sweep wrote to the tree while refusing"
if [[ $CODE -eq 2 ]] && grep -q 'UNASKABLE' <<<"$OUT" && ! grep -q 'DIFFERS' <<<"$OUT"; then
  ok "with no second engine the sweep says UNASKABLE and exits 2 — a hole, not the alarm"
else
  bad "a missing second engine gave exit $CODE — the alarm is spent on a hole"
fi

# Case 8b — and `banked.js` carries that reason through rather than replacing
# it with a sentence about a script that was never wrong.
OUT="$(cd "$T" && PATH="$(dirname "$(command -v node)"):/usr/bin:/bin" node tools/banked.js 2>&1)"
CODE=$?
if grep -q 'UNASKABLE — drift-tolerance: UNASKABLE' <<<"$OUT" && [[ $CODE -eq 2 ]]; then
  ok "the door quotes the gatherer's own reason, not 'neither AGREES nor DIFFERS'"
else
  bad "banked.js dropped the gatherer's stated reason (exit $CODE)"
fi

# ── Case 9 — the report refuses to speak for the measurement it replaced ────
#
# Ash's condition, flatly: a sweep on today's domain neither confirms nor
# refutes 2026-09-10, and a reader must not be left to do that subtraction.

if grep -q 'does not confirm' <<<"$CLEAN_OUT" && grep -q '2026-09-10' <<<"$CLEAN_OUT" &&
   grep -q 'Do not subtract' <<<"$CLEAN_OUT"; then
  ok "the report says on its face that it does not speak to the gathering it replaced"
else
  bad "the report lets a reader subtract two different measurements"
fi

# ── Case 10 — a mistyped flag spends neither 1 nor 2 ────────────────────────

run_in "$WORK/clean" --nonsense
if [[ $CODE -eq 3 ]] && grep -q 'INVALID' <<<"$OUT"; then
  ok "an unknown flag is refused with INVALID and exit 3 — 1 and 2 are spoken for"
else
  bad "an unknown flag gave exit $CODE"
fi

run_in "$WORK/clean" --help
if [[ $CODE -eq 0 ]] && grep -q 'usage' <<<"$OUT"; then
  ok "--help prints the surface and exits 0"
else
  bad "--help did not print the surface (exit $CODE)"
fi

echo
echo "drift-tolerance-breaks: $PASS ok, $FAIL failed"
[[ $FAIL -eq 0 ]] || exit 1
