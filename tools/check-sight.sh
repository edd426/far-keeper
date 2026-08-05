#!/usr/bin/env bash
# tools/check-sight.sh — are the tower's pictures of itself still true?
#
# The tower's only sight of itself is previews/. A bot draws those pictures
# after a push and commits them. When the bot fails, the old set stays put,
# correctly named, and looks exactly like a fresh one. A morning read that
# lands on it studies a room that no longer exists and never suspects. The
# fault is not that pictures go missing. It is that they go missing without
# saying so.
#
# This tool makes that silence loud. It reads git alone — no network, no
# browser, no clock — and answers three questions:
#
#   which set is the newest, and which commit does it show?
#   has work landed since, and did that work change the page?
#   was every picture in previews/ put there by the bot?
#
# It says one of five words.
#
#   TRUE     the newest set shows the tip. These pictures are the room.
#   BEHIND   work landed after them, but none of it touched the page.
#   STALE    the page changed after them — committed, or still only in the
#            working tree. Either way, they show a room that is gone.
#   UNCLEAR  it could not work out what it was looking at. Trust nothing.
#   ROGUE    a picture in previews/ that no deploy vouches for.
#
# Exit codes match: 0 TRUE · 1 BEHIND or STALE · 2 UNCLEAR · 3 ROGUE.
#
# It can only say TRUE when every question it asked itself came back
# answered. Everything else — no pictures, no commit naming them, a sha it
# cannot resolve, files and commit disagreeing — comes out UNCLEAR. A tool
# that breaks should read as broken, not as fine. That rule is the whole
# reason to trust this one, so do not add a path that guesses.
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
    package.json|package-lock.json|build-sha.txt) return 1 ;;
    CHARTER.md|CLAUDE.md|COMMONPLACE.md|MILESTONES.md|README.md) return 1 ;;
    *) return 0 ;;
  esac
}

say() { echo "check-sight: $*"; }

# --- which set is newest, and what does it show? -------------------------

if ! git ls-tree --name-only HEAD previews/ | grep -q '\.png$'; then
  say "previews/ holds no pictures at all."
  say "UNCLEAR — nothing to date. A first morning looks like this."
  exit 2
fi

PREVIEW_COMMIT="$(git log -1 --format='%H' --grep="^${SUBJECT_PREFIX}" 2>/dev/null)"
if [[ -z "$PREVIEW_COMMIT" ]]; then
  say "no commit here says '${SUBJECT_PREFIX}<sha>'."
  say "UNCLEAR — the pictures exist but nothing says which room they show."
  say "do not read them as proof. To see the tower as it stands, draw it:"
  say "  ./scripts/local-snapshot.sh"
  exit 2
fi

SHOWN_SHA="$(git log -1 --format='%s' "$PREVIEW_COMMIT" | sed "s|^${SUBJECT_PREFIX}||" | tr -d '[:space:]')"
TAKEN_BY="$(git log -1 --format='%an' "$PREVIEW_COMMIT")"
TAKEN_AT="$(git log -1 --format='%ad' --date=format:'%Y-%m-%dT%H:%M:%SZ' "$PREVIEW_COMMIT")"

if [[ -z "$SHOWN_SHA" ]]; then
  say "the newest preview commit names no sha."
  say "UNCLEAR"
  exit 2
fi

say "newest set shows ${SHOWN_SHA} — committed ${TAKEN_AT} by ${TAKEN_BY}"
if [[ "$TAKEN_BY" != "$BOT" ]]; then
  say "ROGUE — that commit is not the bot's. Only a ${BOT} commit"
  say "proves the live site drew this way. Read these as nobody's word."
  exit 3
fi

SET_FILES=()
while IFS= read -r file; do
  [[ -n "$file" ]] && SET_FILES+=("$file")
done < <(git ls-tree --name-only HEAD previews/ | grep -- "-${SHOWN_SHA}[-.]" || true)

if [[ ${#SET_FILES[@]} -eq 0 ]]; then
  say "no file in previews/ carries that sha."
  say "UNCLEAR — the newest commit and the files on disk disagree."
  exit 2
fi

say "the set is —"
for file in "${SET_FILES[@]}"; do
  say "  $file"
done

# --- was every picture put there by the bot? -----------------------------
#
# Nothing today puts a picture in previews/ but the bot. This walk is for
# the morning some later keeper reads the same ask and decides, reasonably,
# to start keeping local renders here. A local render proves the page draws
# on this desk. A bot render proves the page is up where a visitor stands.
# They look identical and they come apart on exactly the day it matters.

ROGUE_FOUND=0
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  author="$(git log -1 --format='%an' HEAD -- "$file")"
  if [[ "$author" != "$BOT" ]]; then
    say "ROGUE — $file (committed by ${author})"
    ROGUE_FOUND=1
  fi
done < <(git ls-tree --name-only HEAD previews/ | grep '\.png$' || true)

if [[ $ROGUE_FOUND -eq 1 ]]; then
  say "previews/ holds a picture no deploy vouches for. That breaks the one"
  say "thing this room is for. Move it out — it is not proof, and in here it"
  say "will be read as proof by someone who was not there when it was made."
  exit 3
fi

# --- has work landed since? ----------------------------------------------

if ! git cat-file -e "${SHOWN_SHA}^{commit}" 2>/dev/null; then
  say "${SHOWN_SHA} is not a commit here — fetch first, or the history moved."
  say "UNCLEAR"
  exit 2
fi

SINCE=()
while IFS= read -r line; do
  [[ -n "$line" ]] || continue
  sha="${line%% *}"
  [[ "$(git log -1 --format='%an' "$sha")" == "$BOT" ]] && continue
  SINCE+=("$line")
done < <(git log --format='%h %s' --reverse "${SHOWN_SHA}..HEAD" 2>/dev/null || true)

DIRTY="$(git status --porcelain -uall 2>/dev/null || true)"

if [[ ${#SINCE[@]} -eq 0 ]]; then
  if [[ -n "$DIRTY" ]]; then
    DIRTY_PAGE=0
    while IFS= read -r line; do
      [[ -n "$line" ]] || continue
      path="${line:3}"
      changes_the_page "$path" && DIRTY_PAGE=1
    done < <(git status --porcelain -uall --no-renames 2>/dev/null || true)
    if [[ $DIRTY_PAGE -eq 1 ]]; then
      say "no committed work has landed since — but the working tree has"
      say "uncommitted change to a page file, and no picture here shows it."
      say "STALE — do not describe the tower from these. Commit, or draw the"
      say "desk yourself: ./scripts/local-snapshot.sh"
      exit 1
    fi
    say "no work has landed since — the working tree is not clean, but"
    say "nothing dirty touches the page. These pictures still hold."
  fi
  say "TRUE — these pictures still show the tower as it stands."
  exit 0
fi

say "${#SINCE[@]} commit(s) landed after the pictures were drawn —"
PAGE_CHANGED=0
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

if [[ $PAGE_CHANGED -eq 1 ]]; then
  say "STALE — the page changed after these were drawn. They show a room that"
  say "is no longer the room. Do not describe the tower from them. If the"
  say "diary must lean on them anyway, say in the diary that it did."
else
  say "BEHIND — later work exists but none of it touched the page, so these"
  say "are likely still a fair likeness. Likely is not proof. The bot's next"
  say "set is proof."
fi
say "to see the tower as it stands now, draw it yourself:"
say "  ./scripts/local-snapshot.sh    (writes /tmp — never previews/)"
exit 1
