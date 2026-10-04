#!/usr/bin/env bash
# tools/check-sight-breaks.sh — break check-sight.sh thirteen ways, in a scratch tower.
#
#   ./tools/check-sight-breaks.sh                 # the tool in this tree
#   ./tools/check-sight-breaks.sh <path-to-tool>  # any other copy of it
#
# Built Day 62, the morning the pictures had left main and check-sight.sh
# told the sixty-second morning "a first morning looks like this". Nothing
# had ever made that tool fail on purpose; this does, in a mktemp -d with its
# own bare "origin", so no case touches the real repository or the network.
#
# Every case builds its own fixture from scratch and asserts the fixture is
# in the state the case is named for before judging the tool (Day 17, Day 35:
# a test that watches its breaking and not its building watches one end of
# itself). Each verdict is judged by exit code AND the word, never one alone.
#
# Exit 0 all green, 1 a case red, 2 the suite could not build its fixtures.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOL="${1:-$ROOT/tools/check-sight.sh}"
[[ -r "$TOOL" ]] || { echo "check-sight-breaks: no tool at $TOOL"; exit 2; }

SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

BOT_NAME='github-actions[bot]'
BOT_MAIL='41898282+github-actions[bot]@users.noreply.github.com'
PNG=$'\x89PNG\r\n\x1a\n-not-really-a-picture'
FAILS=0
N=0

ok()  { echo "ok    $*"; }
bad() { echo "FAIL  $*"; FAILS=$((FAILS + 1)); }
die() { echo "check-sight-breaks: fixture not built — $*"; exit 2; }

g() { git -c push.negotiate=false -c init.defaultBranch=main -c user.name=keeper -c user.email=k@example.invalid "$@"; }
gbot() { git -c user.name="$BOT_NAME" -c user.email="$BOT_MAIL" "$@"; }

# A tower: a bare origin, a clone with one page and the tool committed, and
# a one-commit previews branch drawn of main's tip by the bot.
# Prints the work tree's path.
build() {
  local n="$1" t="$SCRATCH/$1"
  mkdir -p "$t" || return 1
  g init -q --bare "$t/origin.git" || return 1
  g init -q "$t/w" || return 1
  mkdir -p "$t/w/tools" || return 1
  cp "$TOOL" "$t/w/tools/check-sight.sh" && chmod +x "$t/w/tools/check-sight.sh"
  echo '<p>the room</p>' > "$t/w/index.html"
  g -C "$t/w" add -A && g -C "$t/w" commit -qm "the room" || return 1
  g -C "$t/w" remote add origin "$t/origin.git" || return 1
  g -C "$t/w" push -q origin main || return 1
  draw "$t" "$(g -C "$t/w" rev-parse --short HEAD)" || return 1
  g -C "$t/w" fetch -q origin '+refs/heads/previews:refs/remotes/origin/previews' || return 1
  echo "$t/w"
}

# Force-push a one-commit previews set to the tower's origin, without fetching.
# draw <tower> <sha> [author-name] [extra-file]
draw() {
  local t="$1" sha="$2" who="${3:-$BOT_NAME}" extra="${4:-}" d
  d="$(mktemp -d "$SCRATCH/draw.XXXX")"
  g init -q "$d" || return 1
  mkdir -p "$d/previews"
  if [[ "$sha" != "-" ]]; then
    printf '%s' "$PNG" > "$d/previews/2026-10-04-${sha}.png"
    printf '%s' "$PNG" > "$d/previews/2026-10-04-${sha}-phone.png"
  else
    echo "nothing" > "$d/previews/README"
    sha="$(g -C "$t/w" rev-parse --short HEAD)"
  fi
  [[ -n "$extra" ]] && printf '%s' "$PNG" > "$d/previews/$extra"
  g -C "$d" add -A || return 1
  git -C "$d" -c user.name="$who" -c user.email=x@example.invalid commit -qm "ci: deploy preview for ${sha}" || return 1
  g -C "$d" push -qf "$t/origin.git" HEAD:refs/heads/previews || return 1
}

# run <worktree> — the tool's output in $OUT and its exit in $CODE
run() {
  OUT="$(cd "$1" && ./tools/check-sight.sh 2>&1)"; CODE=$?
}

# expect <name> <exit> <word>
expect() {
  N=$((N + 1))
  if [[ "$CODE" -eq "$2" ]] && grep -q "check-sight: $3" <<<"$OUT"; then
    ok "$1  ($3, exit $2)"
  else
    bad "$1  — wanted $3 exit $2, got exit $CODE:"
    sed 's/^/        /' <<<"$OUT" | tail -6
  fi
}

# --- A. the plain morning ------------------------------------------------
W="$(build a)" || die "case A"
[[ -z "$(git -C "$W" status --porcelain)" ]] || die "A's tree is not clean"
run "$W"; expect "A  a fresh set of main's tip, remote agreeing" 0 TRUE

# --- B. no ref at all ----------------------------------------------------
W="$(build b)" || die "case B"
git -C "$W" update-ref -d refs/remotes/origin/previews
git -C "$W" rev-parse -q --verify refs/remotes/origin/previews >/dev/null && die "B's ref survived"
run "$W"; expect "B  no previews ref in this clone" 2 UNCLEAR
N=$((N + 1))
if grep -qi "first morning" <<<"$OUT"; then
  bad "B' a missing ref was explained as a first morning — Day 62's sentence"
else
  ok  "B' and it does not call that a first morning"
fi

# --- C. a branch with no pictures on it ----------------------------------
W="$(build c)" || die "case C"
draw "$SCRATCH/c" - || die "C's draw"
g -C "$W" fetch -q origin '+refs/heads/previews:refs/remotes/origin/previews' || die "C's fetch"
git -C "$W" ls-tree -r --name-only origin/previews | grep -q '\.png$' && die "C's branch still holds a picture"
run "$W"; expect "C  the branch exists and holds no pictures" 2 UNCLEAR

# --- D. the fetch failed: the remote holds a newer set -------------------
W="$(build d)" || die "case D"
OLD="$(git -C "$W" rev-parse origin/previews)"
echo '<p>the room, later</p>' > "$W/index.html"
g -C "$W" commit -qam "later" && g -C "$W" push -q origin main || die "D's push"
draw "$SCRATCH/d" "$(g -C "$W" rev-parse --short HEAD)" || die "D's draw"
[[ "$(git -C "$W" ls-remote origin refs/heads/previews | cut -f1)" != "$OLD" ]] || die "D's remote did not move"
git -C "$W" reset -q --hard HEAD~1
run "$W"; expect "D  our ref is yesterday's; the remote has moved on" 2 UNCLEAR

# --- E. the remote does not answer ---------------------------------------
W="$(build e)" || die "case E"
git -C "$W" remote set-url origin "$SCRATCH/e/nowhere.git"
git -C "$W" ls-remote origin >/dev/null 2>&1 && die "E's remote answered"
run "$W"; expect "E  everything else TRUE, but the remote was never asked" 2 UNCLEAR

# --- F. the tip is not the bot's -----------------------------------------
W="$(build f)" || die "case F"
draw "$SCRATCH/f" "$(g -C "$W" rev-parse --short HEAD)" "keeper" || die "F's draw"
g -C "$W" fetch -q origin '+refs/heads/previews:refs/remotes/origin/previews' || die "F's fetch"
[[ "$(git -C "$W" log -1 --format=%an origin/previews)" == keeper ]] || die "F's tip is not the keeper's"
run "$W"; expect "F  a previews tip committed by a keeper" 3 ROGUE

# --- G. a picture on the branch of some other sha ------------------------
W="$(build g)" || die "case G"
draw "$SCRATCH/g" "$(g -C "$W" rev-parse --short HEAD)" "$BOT_NAME" "2026-10-01-abc1234.png" || die "G's draw"
g -C "$W" fetch -q origin '+refs/heads/previews:refs/remotes/origin/previews' || die "G's fetch"
git -C "$W" ls-tree -r --name-only origin/previews | grep -q abc1234 || die "G's stray did not land"
run "$W"; expect "G  a stray picture of another sha on the bot's branch" 3 ROGUE

# --- H. a picture committed to main, past .gitignore ---------------------
W="$(build h)" || die "case H"
echo '/previews/' > "$W/.gitignore"
mkdir -p "$W/previews" && printf '%s' "$PNG" > "$W/previews/local-render.png"
g -C "$W" add .gitignore && g -C "$W" add -f previews/local-render.png && g -C "$W" commit -qm "oops" || die "H's commit"
git -C "$W" ls-files | grep -q 'previews/local-render.png' || die "H's picture is not tracked"
run "$W"; expect "H  a picture forced onto main" 3 ROGUE

# --- I. the page changed in a commit -------------------------------------
W="$(build i)" || die "case I"
echo '<p>a new room</p>' > "$W/index.html"; g -C "$W" commit -qam "page" || die "I's commit"
run "$W"; expect "I  a committed page change" 1 STALE

# --- J. a tool changed, the page did not ---------------------------------
W="$(build j)" || die "case J"
echo '# note' >> "$W/tools/check-sight.sh"; g -C "$W" commit -qam "tool" || die "J's commit"
run "$W"; expect "J  a committed tool change only" 1 BEHIND

# --- K. a tool committed AND the page edited, uncommitted ----------------
# The Day 62 shape exactly: Ash's two commits landed, and the move sat
# uncommitted in reckoning.js. Before Day 62 the dirty tree was only looked
# at when nothing had been committed, so this said BEHIND.
W="$(build k)" || die "case K"
echo '# note' >> "$W/tools/check-sight.sh"; g -C "$W" commit -qam "tool" || die "K's commit"
echo '<p>moved</p>' > "$W/index.html"
git -C "$W" status --porcelain | grep -q 'index.html' || die "K's page is not dirty"
run "$W"; expect "K  a tool commit, and an uncommitted page edit" 1 STALE

# --- L. .gitignore cannot change the page --------------------------------
W="$(build l)" || die "case L"
echo '/previews/' > "$W/.gitignore"; g -C "$W" add .gitignore && g -C "$W" commit -qm "ignore" || die "L's commit"
run "$W"; expect "L  a .gitignore-only commit" 1 BEHIND

# --- M. the pictures name a commit that is not behind HEAD ----------------
W="$(build m)" || die "case M"
g -C "$W" checkout -q -b elsewhere && echo x > "$W/side.txt" && g -C "$W" add side.txt && g -C "$W" commit -qm side || die "M's side"
SIDE="$(g -C "$W" rev-parse --short HEAD)"
g -C "$W" checkout -q main
draw "$SCRATCH/m" "$SIDE" || die "M's draw"
g -C "$W" fetch -q origin '+refs/heads/previews:refs/remotes/origin/previews' || die "M's fetch"
git -C "$W" merge-base --is-ancestor "$SIDE" HEAD && die "M's side is an ancestor after all"
run "$W"; expect "M  pictures of a commit main never had" 2 UNCLEAR

echo
if [[ $FAILS -eq 0 ]]; then
  echo "check-sight-breaks: all $N green against $TOOL"
  exit 0
fi
echo "check-sight-breaks: $FAILS of $N red against $TOOL"
exit 1
