#!/usr/bin/env bash
# tools/parses.sh — does the code this tower serves actually parse?
#
#   ./tools/parses.sh            check the working tree
#   ./tools/parses.sh /some/tree check another copy of the tower
#
# Day 37, and it was built because it was needed an hour earlier.
#
# `reckoning/page.js` was committed to `main` with every quote in one array
# turned into a typographic `’`. That is not a subtle fault. It is a
# `SyntaxError`, the file does not parse at all, and a browser loading the
# reckoning room would have drawn a heading and then nothing: no figures, no
# ledger, no self-audit, no verdicts — the whole public case for this tower
# being checkable, silently absent. It is the tower's signature failure, the
# one `page.js`'s own comments name twice: **a check that protects a number
# by taking down the room it was printed in has moved the silence, not
# removed it.** Here the room went down without even a number being
# protected.
#
# **What is worth more than the repair is what did not notice.** This house
# holds twenty-odd suites. `node tools/reckon.js --verify` was green — it
# never loads the page. `tools/shelf-when.js` was green. `check-sight.sh` was
# green, and correctly: the previews were honest pictures of yesterday's
# working page. Every browser suite would have caught it, and not one of them
# runs unless a keeper types it — `move-rehearsal.sh` walks them all and its
# appointment is Sunday, which is Day 32's finding exactly: **a tool's blind
# spell is the gap between its appointments.** So the fault would have
# travelled the whole way to `git push` behind a wall of green words, and the
# thing that stopped it was a keeper reading a diff.
#
# Nothing in this tower had ever asked whether the JavaScript it ships is
# JavaScript. That question costs about forty milliseconds and needs no
# browser, no port, no network and no Playwright, which is why it can run on
# a Wednesday.
#
# **The case list is the HTML, never a list kept here.** Every `<script
# src=…>` in every page is resolved and checked, so the next file somebody
# adds to a page is covered the morning it is added. A hand-kept list would
# go blind to exactly that file and report the blindness as clean — Day 29's
# sentence, which this house has now paid for four times: what makes a
# hand-kept list dangerous was never that a hand wrote it down, it is that
# nothing after the hand ever asks whether it is still true.
#
# It also checks every `tools/*.js`, which are a different kind of risk and
# a smaller one: those are run by node directly, so a syntax error in one
# announces itself the first time anybody runs it. The pages' scripts are the
# silent ones, and they are why this exists.
#
# **What it is not.** Parsing is the floor and not the ceiling. A file that
# parses can still be wrong in every way this house has ever been wrong, and
# nothing here looks at behaviour. It answers one question — *is this a file
# a browser can read at all* — and it answers it about every file, every run.
# Do not let it be quoted as though the page works.
#
# Verdicts: PARSES (exit 0), BROKEN (exit 1), UNCLEAR (exit 2).
set -u

usage() {
  echo "usage: tools/parses.sh [tree-to-check]" >&2
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
esac
if [ "$#" -gt 1 ]; then
  echo "parses: INVALID — one argument at most" >&2
  usage
  exit 2
fi

SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"

if [ ! -d "$SRC" ]; then
  echo "parses: UNCLEAR — $SRC is not a directory" >&2
  exit 2
fi
if ! command -v node >/dev/null 2>&1; then
  echo "parses: UNCLEAR — no node on this desk, so nothing can be parsed" >&2
  exit 2
fi

broken=0
checked=0
unbuilt=0
unclear=0

# Every page in the tower, and every script each page pulls in. The pages are
# found by walking the tree rather than by naming them: a page nobody listed
# is exactly the page whose script nobody checks.
PAGES="$(cd "$SRC" && find . -name '*.html' -not -path './node_modules/*' \
  -not -path './.git/*' | sort)"

if [ -z "$PAGES" ]; then
  echo "parses: UNCLEAR — no HTML found under $SRC" >&2
  exit 2
fi

check_one() {
  # $1 = path relative to $SRC, $2 = the page that asked for it (or '')
  local rel="$1" asked_by="$2" file="$SRC/$1"
  if [ ! -f "$file" ]; then
    if [ -n "$asked_by" ]; then
      # A missing script and an unbuilt tree are two different things, and
      # this tool convicted the second of being the first on its very first
      # run: `build-sha.js` is written by `scripts/build.sh` and ignored by
      # git, so a fresh clone genuinely has no such file and is perfectly
      # healthy. Day 8's rule, arriving inside the check written to obey it —
      # **a check that does not know its own sight limit will sometimes accuse
      # the innocent, and that looks exactly like being right.** And Day 11's:
      # BROKEN doing two jobs would hand a keeper the wrong account.
      #
      # The fork is decided by a witness and not by a list here either: git is
      # asked whether it ignores the path. A file the repository deliberately
      # does not track is a build artifact by the tree's own declaration, and
      # a tree that has not been built is not a tree that is broken. Where
      # there is no git to ask, nothing is claimed in either direction.
      if git -C "$SRC" check-ignore -q "$rel" 2>/dev/null; then
        echo "parses: UNBUILT — $asked_by loads $rel, which this tree does not" \
          "track and has not built. Not a fault; run scripts/build.sh to check it."
        unbuilt=$((unbuilt + 1))
      elif git -C "$SRC" rev-parse --git-dir >/dev/null 2>&1; then
        echo "parses: BROKEN — $asked_by loads $rel, and there is no such file"
        broken=$((broken + 1))
      else
        echo "parses: UNCLEAR — $asked_by loads $rel, there is no such file, and" \
          "there is no git here to say whether it was meant to be built"
        unclear=$((unclear + 1))
      fi
    fi
    return
  fi
  checked=$((checked + 1))
  local err
  if err="$(node --check "$file" 2>&1)"; then
    return
  fi
  # The first line of node's complaint carries the line number; the
  # SyntaxError line carries what it choked on. Both are printed, because a
  # verdict that says only "broken" sends a keeper hunting.
  echo "parses: BROKEN — $rel does not parse${asked_by:+, and $asked_by loads it}"
  echo "$err" | sed -n '1,4p' | sed 's/^/parses:     /'
  broken=$((broken + 1))
}

seen=" "
for page in $PAGES; do
  page_rel="${page#./}"
  page_dir="$(dirname "$page_rel")"
  # `<script src="...">`, one per line, quotes either way round. A src that
  # is a full URL is somebody else's file and not ours to parse; there are
  # none today and the tower has no network, but saying so beats silently
  # trying to open `https:` as a path.
  srcs="$(grep -o '<script[^>]*src="[^"]*"' "$SRC/$page_rel" 2>/dev/null \
    | sed 's/.*src="//; s/"$//' || true)"
  for src in $srcs; do
    case "$src" in
      http://*|https://*|//*)
        echo "parses: $page_rel loads $src from off this tower — not checked"
        continue ;;
    esac
    # Resolve relative to the page, then normalise the `../` away.
    if [ "$page_dir" = "." ]; then rel="$src"; else rel="$page_dir/$src"; fi
    rel="$(printf '%s\n' "$rel" | sed ':a; s#[^/][^/]*/\.\./##; ta; s#^\./##')"
    case "$seen" in *" $rel "*) continue ;; esac
    seen="$seen$rel "
    check_one "$rel" "$page_rel"
  done
done

for t in "$SRC"/tools/*.js; do
  [ -f "$t" ] || continue
  rel="tools/$(basename "$t")"
  case "$seen" in *" $rel "*) continue ;; esac
  seen="$seen$rel "
  check_one "$rel" ""
done

if [ "$checked" -eq 0 ]; then
  # Day 27, Day 34, Day 35: an empty domain always says yes, in the voice of
  # a check that worked. Nothing parsed is not everything parsing.
  echo "parses: UNCLEAR — found $(printf '%s\n' "$PAGES" | wc -l | tr -d ' ')" \
    "pages and no JavaScript at all. That is not a clean tower; it is a" \
    "question this run could not ask." >&2
  exit 2
fi

if [ "$broken" -gt 0 ]; then
  echo "parses: BROKEN — $broken of $checked files will not parse."
  echo "parses: a page whose script does not parse draws its headings and" \
    "nothing else, and says nothing about why."
  exit 1
fi

if [ "$unclear" -gt 0 ]; then
  echo "parses: UNCLEAR — $checked files parse, and $unclear could not be" \
    "found or accounted for." >&2
  exit 2
fi

# The count of what was skipped is printed on a clean run too, and not only
# when it is nought. A check that speaks about its own gaps only when it has
# something to report is a check whose silence reads as an all-clear it never
# earned (Day 34).
echo "parses: PARSES — $checked files, every one of them a file a browser can read."
if [ "$unbuilt" -gt 0 ]; then
  echo "parses: $unbuilt more were not looked at, because this tree has not" \
    "built them. That is a gap in this run, not a clean bill for those files."
fi
echo "parses: that is the floor and not the ceiling: nothing here ran, so" \
  "nothing here says the page works."
exit 0
