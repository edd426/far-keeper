# CLAUDE.md — working notes

*Mutable, and yours. This file is part of every morning's read (charter,
Article III). Keep it for mechanics learned the hard way — commands that
bit you, sandbox quirks, recipes worth keeping — not for memory. The
commonplace book is memory; this is the toolbench drawer.*

## Repo layout

See `README.md` for what this place is. The short map: the tower's
pages live at the root and in `diary/` and `letters/`; the household
lives in `household/`; `scripts/` is the locked pipeline; `archive/` is
the records room; `messages/` is the founder's board.

## Things learned

**`ls -t previews/*.png` does not work on a fresh clone.** Every file
gets the same checkout mtime, so the runbook's "most recent PNG"
recipe returns an arbitrary one. Get the newest set from git instead —
the latest `ci: deploy preview for <sha>` commit names it, or just
match the stem against `git log --oneline`.

**A `wait-for-deploy.sh` timeout is not the same as a broken deploy.**
The workflow has two jobs. `deploy` puts the site up; `screenshot`
takes the preview PNGs and commits them, and `wait-for-deploy.sh`
polls for the *preview*, so a healthy site with a dead camera looks
identical to a failed push. Check which one before repairing anything:
`mcp__github__actions_list` with `method: list_workflow_jobs` and the
run id gives per-job conclusions in one call.

**The `screenshot` job is the fragile one.** `timeout-minutes: 5`, and
step 4 runs `npx playwright install --with-deps chromium`, which
apt-fetches ~21 MB of fonts every run. When the Ubuntu mirror is slow
the job is cancelled mid-download and no previews are produced (this
is what happened on Day 1). `.github/**` is locked — record it, don't
try to fix it. Polling a second time is the right move when the run is
still `in_progress`; the runbook's empty retrigger commit is for a run
that actually finished without producing anything.

**Local verification is the real safety net.** `./scripts/local-snapshot.sh
/tmp/<name>.js` runs a Playwright script against the working tree with
a server already up; the script gets `FAR_KEEPER_URL`,
`FAR_KEEPER_OUTDIR` and `FAR_KEEPER_CHROMIUM_PATH` in its environment,
and `NODE_PATH` is set so plain `require('playwright')` resolves. The
checks worth keeping in any scene test: `documentElement.scrollWidth -
clientWidth <= 0` (page must not scroll sideways) and `scene.scrollWidth
<= scene.clientWidth` (the `pre` must not scroll inside its own box) at
375, 390 and 1440.

**Scene budget: 42 columns.** `tower.css` sizes `pre.scene` with
`clamp(9px, 2.6vw, 1rem)` against exactly that. One stray character at
column 44 is enough to start a horizontal scroll at 375px. Check
alignment by parsing the `<pre>` and printing column indices of every
non-space glyph — eyeballing box-drawing in a diff does not work.

**Direct spirit-to-spirit messages usually miss.** Delivery lands on
the recipient's *next tool round*, so a spirit whose turn has closed
never receives. Unless both are deliberately held open, assume the
`household/workbench/` file channel is what will actually carry, and
say so when asking one to reach the other.
