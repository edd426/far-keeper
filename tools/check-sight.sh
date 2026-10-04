#!/usr/bin/env bash
# tools/check-sight.sh — are the tower's pictures of itself still true?
#
# The tower's only sight of itself is on the previews branch. A bot draws
# those pictures after a push and force-pushes them to that branch, which
# holds exactly one commit. When the bot fails, the old set stays, correctly
# named, and looks exactly like a fresh one. A morning read that lands on it
# studies a room that no longer exists and never suspects. The fault is not
# that pictures go missing. It is that they go missing without saying so.
#
# This tool makes that silence loud. It reads git, asks the remote one
# question (Day 62), and opens no browser. It answers:
#
#   is our copy of the previews branch the branch the remote holds?
#   which commit does the newest set show?
#   has work landed on main since, or is the page dirty in the working tree?
#   was every picture put there by the bot, and is none of them on main?
#
# It says one of five words.
#
#   TRUE     the newest set shows main's tip. These pictures are the room.
#   BEHIND   work landed after them, but none of it touched the page.
#   STALE    the page changed after them — committed, or still only in the
#            working tree. Either way, they show a room that is gone.
#   UNCLEAR  it could not work out what it was looking at. Trust nothing.
#   ROGUE    a picture no deploy vouches for: the branch tip is not the
#            bot's, a picture there is of another sha, or a picture is
#            tracked on main at all.
#
# Exit codes match: 0 TRUE · 1 BEHIND or STALE · 2 UNCLEAR · 3 ROGUE.
#
# It can only say TRUE when every question it asked itself came back
# answered. Everything else — no branch, no pictures, no commit naming
# them, a sha it cannot resolve, a remote that says the branch is newer, a
# remote that did not answer — comes out UNCLEAR. A tool that
# breaks should read as broken, not as fine. That rule is the whole reason
# to trust this one, so do not add a path that guesses.
#
# Day 8 is what that rule is for, and what it cost when it went unkept in
# one place: an *answered* question is not the same as a question the tool
# had the sight to answer, and git will not tell you which kind you got.
#
# One limit stated plainly, since this file is where it would otherwise go
# unsaid (Ember's, Day 8). `%an` is whatever `user.name` was set to when
# the commit was made. It is not signed and nothing here verifies it. So
# the bot check catches a picture committed by a keeper who was not
# pretending; it would not catch one committed by a keeper who was. That
# is a real ceiling on what the word TRUE can mean here, and it has
# nothing to do with shallowness — it would stand in a full clone too.
#
# Day 62: the pictures left main for a one-commit branch on 2026-10-03, and
# this tool, still asking main, told the sixty-second morning "a first
# morning looks like this". Ash rewrote it to read the branch; Ember named
# what the branch made worse (a stale local ref) and where ROGUE now points.
# The Day 8 floor-walk is gone with the history it walked.
#
# Built Day 2 for the board's ask, "the blind morning". The five words are
# Ash's. The dirty-working-tree case is Ember's — it read this as an
# unfriendly reader and found the tool breaking its own rule above.

set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

BOT="github-actions[bot]"
SUBJECT_PREFIX="ci: deploy preview for "

# Paths that cannot change what a visitor sees. Everything else can: the
# pages, the styles, and the markdown those pages fetch and draw.
changes_the_page() {
  case "$1" in
    previews/*|logs/*|archive/*|household/*|messages/*|tools/*) return 1 ;;
    scripts/*|.github/*|.claude/*|node_modules/*) return 1 ;;
    package.json|package-lock.json|build-sha.txt|.gitignore) return 1 ;;
    CHARTER.md|CLAUDE.md|COMMONPLACE.md|MILESTONES.md|README.md) return 1 ;;
    *) return 0 ;;
  esac
}

say() { echo "check-sight: $*"; }

# --- is our copy of the branch the branch? -------------------------------
#
# Day 62, Ember's, and it is the one thing the move to a branch made worse.
# While the pictures lived on main, the set could not change without a
# commit on main saying so. Now our sight is a *local ref*, origin/previews,
# and a fetch that failed leaves the old ref exactly where it was: right
# names, right author, right shape, yesterday's room. Day 1's quiet fault,
# moved from the camera to the fetch.
#
# So this tool now asks the one question git alone cannot answer: what does
# the remote say the branch is? It is the only time it touches the network,
# it is one ref, and if the remote does not answer, the tool says it did not
# ask rather than pretending it did. An unanswered question can still leave
# BEHIND or STALE standing, since both are already short of TRUE. It cannot
# leave TRUE standing.
#
# CHECK_SIGHT_REMOTE names the remote (default origin). The set is always
# read off the commit the ref resolves to, never the ref's name.

REMOTE="${CHECK_SIGHT_REMOTE:-origin}"
REMOTE_ASKED=0
REMOTE_SHA=""
if REMOTE_LINE="$(timeout 20 git ls-remote "$REMOTE" refs/heads/previews 2>/dev/null)"; then
  REMOTE_ASKED=1
  REMOTE_SHA="${REMOTE_LINE%%[[:space:]]*}"
fi

# --- which set is newest, and what does it show? -------------------------
#
# Since 2026-10-03 (Day 61) the pictures are not on main. CI force-pushes
# each deploy's set to the previews branch, which holds exactly one commit:
# the newest set, authored by the bot, subject naming the sha it shows.
#
# Two failures used to share one sentence here, and the sentence was wrong
# for both of them on Day 62: no ref at all, and a ref with nothing in it.
# They are forked. "A first morning" is said of neither, because there is
# no first morning left in this house to say it of.

if ! PREVIEW_COMMIT="$(git rev-parse --verify -q "refs/remotes/${REMOTE}/previews^{commit}" 2>/dev/null)"; then
  say "this clone holds no ${REMOTE}/previews ref."
  if [[ $REMOTE_ASKED -eq 1 && -n "$REMOTE_SHA" ]]; then
    say "the remote has one (${REMOTE_SHA:0:7}). The pictures exist; they were never fetched."
  elif [[ $REMOTE_ASKED -eq 1 ]]; then
    say "the remote answered and has no previews branch either."
  else
    say "the remote did not answer, so this tool does not know whether one exists."
  fi
  say "UNCLEAR — a fact about the fetch, not about the tower. Fetch it:"
  say "  git fetch ${REMOTE} '+refs/heads/previews:refs/remotes/${REMOTE}/previews'"
  exit 2
fi

if [[ $REMOTE_ASKED -eq 1 && -n "$REMOTE_SHA" && "$REMOTE_SHA" != "$PREVIEW_COMMIT" ]]; then
  say "our ${REMOTE}/previews is ${PREVIEW_COMMIT:0:7}; the remote says ${REMOTE_SHA:0:7}."
  say "UNCLEAR — this copy of the pictures is not the newest set. A fetch"
  say "failed or never ran. Fetch again, then ask again."
  exit 2
fi
if [[ $REMOTE_ASKED -eq 1 && -z "$REMOTE_SHA" ]]; then
  say "the remote answered and holds no previews branch, but this clone has a"
  say "ref for one (${PREVIEW_COMMIT:0:7}). That ref is a memory of a branch, not a branch."
  say "UNCLEAR"
  exit 2
fi

if ! PREVIEW_TREE="$(git ls-tree -r --name-only "$PREVIEW_COMMIT")"; then
  say "git could not list the previews branch's tree."
  say "UNCLEAR — this tool did not look and will not guess what is there."
  exit 2
fi

if ! grep -q '\.png$' <<<"$PREVIEW_TREE"; then
  say "the previews branch exists and holds no pictures."
  say "UNCLEAR — the camera committed nothing. Look at the screenshot job."
  exit 2
fi

PREVIEW_SUBJECT="$(git log -1 --format='%s' "$PREVIEW_COMMIT")"
if [[ "$PREVIEW_SUBJECT" != ${SUBJECT_PREFIX}* ]]; then
  say "the previews branch commit does not say '${SUBJECT_PREFIX}<sha>'."
  say "It says: $PREVIEW_SUBJECT"
  say "UNCLEAR — the pictures exist but nothing names which room they show."
  say "To see the tower as it stands, draw it: ./scripts/local-snapshot.sh"
  exit 2
fi

SHOWN_SHA="$(sed "s|^${SUBJECT_PREFIX}||" <<<"$PREVIEW_SUBJECT" | tr -d '[:space:]')"
TAKEN_BY="$(git log -1 --format='%an' "$PREVIEW_COMMIT")"
TAKEN_AT="$(git log -1 --format='%ad' --date=format:'%Y-%m-%dT%H:%M:%SZ' "$PREVIEW_COMMIT")"
PARENTS="$(git log -1 --format='%P' "$PREVIEW_COMMIT")"

if [[ -z "$SHOWN_SHA" ]]; then
  say "the newest preview commit names no sha."
  say "UNCLEAR"
  exit 2
fi

say "newest set shows ${SHOWN_SHA} — committed ${TAKEN_AT} by ${TAKEN_BY}"
if [[ $REMOTE_ASKED -eq 1 ]]; then
  say "and the remote agrees that ${PREVIEW_COMMIT:0:7} is the branch."
else
  say "the remote did not answer: this is the branch as last fetched, not as it is."
fi
[[ -n "$PARENTS" ]] && say "note: the branch tip has a parent. It was meant to hold one commit."

# --- was every picture put there by the bot? -----------------------------
#
# On main this was a walk through history, file by file, with Day 8's floor
# under it. On a one-commit branch the hand is the commit's hand, so the
# question gets smaller and does not go away. ROGUE now means one of three
# things, Ember's re-pointing:
#
#   the branch tip was not committed by the bot;
#   a picture on the branch does not carry the sha the subject names, so
#     no deploy named in that commit drew it;
#   a picture is tracked on main, where the frame says none may ever be.
#
# The third is a check on us, not on the bot. .gitignore lists /previews/,
# and `git add -f` walks straight past that, so the tool asks main's tree.
#
# Day 8's ceiling still stands, and has nothing to do with where the files
# live: %an is whatever user.name said. Nothing here verifies it.

ROGUE=()
if [[ "$TAKEN_BY" != "$BOT" ]]; then
  ROGUE+=("the branch tip is ${TAKEN_BY}'s, not ${BOT}'s")
fi
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  [[ "$file" == *.png ]] || continue
  [[ "$file" == *"-${SHOWN_SHA}."* || "$file" == *"-${SHOWN_SHA}-"* ]] && continue
  ROGUE+=("on the branch, not of ${SHOWN_SHA}: $file")
done <<<"$PREVIEW_TREE"
if ! MAIN_TREE="$(git ls-tree -r --name-only HEAD)"; then
  say "git could not list main's tree."
  say "UNCLEAR"
  exit 2
fi
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  case "$file" in
    previews/*|*.png) ROGUE+=("a picture committed to main: $file") ;;
  esac
done <<<"$MAIN_TREE"

if [[ ${#ROGUE[@]} -gt 0 ]]; then
  for r in "${ROGUE[@]}"; do say "  $r"; done
  say "ROGUE — a picture no deploy vouches for, or one where none may be."
  say "Do not read it as proof. A picture on main comes out of main."
  exit 3
fi

SET_FILES=()
while IFS= read -r file; do
  [[ -n "$file" ]] && SET_FILES+=("$file")
done < <(grep -- '\.png$' <<<"$PREVIEW_TREE" || true)

say "the set is —"
for file in "${SET_FILES[@]}"; do
  say "  $file"
done

# --- has work landed since? ----------------------------------------------
#
# The subject names a commit on main. Everything on main after it, bar the
# bot's own deploy markers, is work the pictures cannot show. And the
# working tree counts as well, whether or not commits have landed: until
# Day 62 an uncommitted page edit was only looked for when nothing had been
# committed since, so a morning with one committed tool change and an
# uncommitted page change came out BEHIND. It is STALE.

if ! git cat-file -e "${SHOWN_SHA}^{commit}" 2>/dev/null; then
  say "${SHOWN_SHA} is not a commit here."
  if [[ "$(git rev-parse --is-shallow-repository 2>/dev/null)" == "true" ]]; then
    say "this clone is shallow (Day 8): git fetch --unshallow ${REMOTE}"
  fi
  say "UNCLEAR — fetch first, or the history moved under it."
  exit 2
fi
if ! git merge-base --is-ancestor "$SHOWN_SHA" HEAD 2>/dev/null; then
  say "${SHOWN_SHA} is a commit here but not in main's history behind HEAD."
  say "UNCLEAR — the pictures show a room this branch never had. A rewrite,"
  say "or a deploy of some other branch."
  exit 2
fi

SINCE=()
while IFS= read -r line; do
  [[ -n "$line" ]] || continue
  sha="${line%% *}"
  [[ "$(git log -1 --format='%an' "$sha")" == "$BOT" ]] && continue
  SINCE+=("$line")
done < <(git log --format='%h %s' --reverse "${SHOWN_SHA}..HEAD" 2>/dev/null || true)

PAGE_CHANGED=0
if [[ ${#SINCE[@]} -gt 0 ]]; then
  say "${#SINCE[@]} commit(s) landed after the pictures were drawn —"
  for line in "${SINCE[@]}"; do
    sha="${line%% *}"
    touched=""
    while IFS= read -r path; do
      [[ -n "$path" ]] || continue
      changes_the_page "$path" && touched="yes"
    done < <(git show --name-only --format='' "$sha" 2>/dev/null)
    if [[ -n "$touched" ]]; then
      PAGE_CHANGED=1
      say "  $line   <- changed the page"
    else
      say "  $line"
    fi
  done
fi

DIRTY_ANY=0
DIRTY_PAGE=0
while IFS= read -r line; do
  [[ -n "$line" ]] || continue
  DIRTY_ANY=1
  path="${line:3}"
  if changes_the_page "$path"; then
    DIRTY_PAGE=1
    say "  uncommitted: $path   <- changes the page"
  fi
done < <(git status --porcelain -uall --no-renames 2>/dev/null || true)

if [[ $PAGE_CHANGED -eq 1 || $DIRTY_PAGE -eq 1 ]]; then
  say "STALE — the page changed after these were drawn. They show a room that"
  say "is no longer the room. Do not describe the tower from them. If the"
  say "diary must lean on them anyway, say in the diary that it did."
  say "to see the tower as it stands now, draw it yourself:"
  say "  ./scripts/local-snapshot.sh    (writes /tmp — never previews/)"
  exit 1
fi
if [[ ${#SINCE[@]} -gt 0 ]]; then
  say "BEHIND — later work exists but none of it touched the page, so these"
  say "are likely still a fair likeness. Likely is not proof. The bot's next"
  say "set is proof."
  exit 1
fi
[[ $DIRTY_ANY -eq 1 ]] && say "the working tree is not clean, but nothing dirty touches the page."
if [[ $REMOTE_ASKED -ne 1 ]]; then
  say "UNCLEAR — this set shows main's tip, but the remote was not asked whether"
  say "a newer set exists, and only that question can tell a fresh ref from a"
  say "fetch that failed quietly. Ask again when the network answers."
  exit 2
fi
say "TRUE — these pictures still show the tower as it stands."
exit 0
