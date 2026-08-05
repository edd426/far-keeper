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

## Run this before you look at the previews

```bash
./tools/check-sight.sh
```

**Do this every morning, before step 5 of the read, no matter how the
day looks.** It costs a second and it is the only thing standing between
you and describing a room that no longer exists.

Why: `previews/` is your only sight of the tower, and when the camera
job fails the old set simply stays — right names, right shape, nothing
wrong on the face of it. It looks exactly like a fresh set. That is the
whole fault: the pictures do not go missing, they go missing *quietly*.
This happened on Day 1 and the Day 2 keeper nearly walked into it.

The tool reads git only — no network, no browser — and prints the set
you should be reading, then one of five words:

- **TRUE** — the newest set shows the tip. These pictures are the room.
- **BEHIND** — work landed since, but none of it touched the page. Likely
  still a fair likeness. Likely is not proof.
- **STALE** — the page changed after these were drawn, either in a commit
  or as uncommitted change still sitting in the working tree. **Do not
  describe the tower from them.** If the diary must lean on them anyway,
  say in the diary that it did.
- **UNCLEAR** — it could not work out what it was looking at. Trust
  nothing in `previews/` until you know why.
- **ROGUE** — a picture in `previews/` that no deploy vouches for.

Exit codes match: `0` TRUE, `1` BEHIND or STALE, `2` UNCLEAR, `3` ROGUE.

It also replaces the old `ls -t previews/*.png` recipe, which is broken
on a fresh clone — every file gets the same checkout mtime, so `ls -t`
returns an arbitrary picture, not the newest. The tool names the set
from the `ci: deploy preview for <sha>` commit instead, which cannot
drift.

**The two kinds of picture, and why only one is proof.** A bot picture
in `previews/<date>-<sha>.png` proves *that commit stood up on the open
web* — `wait-for-deploy.sh` checks the author is `github-actions[bot]`,
and that check is the whole proof. `./scripts/local-snapshot.sh` draws
the working tree on this desk and writes to `/tmp`; that proves only
*the page draws here*. The two look identical and they come apart on
exactly the day it matters — the day the deploy dies and your desk still
looks fine. **Never put a local render in `previews/`,** however useful
it seems on a blind morning; `check-sight.sh` will call it ROGUE, and it
is right to. If you want a durable record of a local draw, the day's
`logs/` entry already is one — made of words, which say what they are on
their face in a way a picture never does.

## Things learned

**A `wait-for-deploy.sh` timeout is not the same as a broken deploy.**
The workflow has two jobs. `deploy` puts the site up; `screenshot`
takes the preview PNGs and commits them, and `wait-for-deploy.sh`
polls for the *preview*, so a healthy site with a dead camera looks
identical to a failed push. Check which one before repairing anything:
`mcp__github__actions_list` with `method: list_workflow_jobs` and the
run id gives per-job conclusions in one call.

**The `screenshot` job was the fragile one — Evan fixed it on Day 1.**
*(Founder edit, 2026-08-04, not the keeper's own note: your Day 1
diagnosis was right and acted on, so the note it produced is now stale
and would mislead you. The original read: `timeout-minutes: 5`, step 4
runs `npx playwright install --with-deps chromium`, which apt-fetches
~21 MB of fonts every run; slow mirror, cancelled job, no previews.)*

What is true now: `--with-deps` is gone, so the job no longer touches
apt at all. Chromium is cached across runs, and a launch check installs
system deps only on the run that actually needs them. The job ceiling
is `timeout-minutes: 10` and `wait-for-deploy.sh` now waits 600s, not
300 — the old 300 was thinner than a *healthy* run, which is why Day 1
read two normal polls as failures. Override with
`WAIT_FOR_DEPLOY_TIMEOUT` if you ever need to.

`.github/**` and `scripts/**` are still locked to you — this stays a
founder-facing report. Keep diagnosing these and writing them down;
that is exactly what got this fixed. Polling a second time is still the
right move when the run is still `in_progress`; the runbook's empty
retrigger commit is for a run that finished without producing anything.

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
