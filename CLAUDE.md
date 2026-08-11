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

**If it says UNVOUCHED and UNCLEAR, run `git fetch --unshallow origin` and
ask again.** This sandbox clones the repo shallow — some mornings 50
commits, and the tower is older than that. A shallow clone has a *floor*,
and git does not flag it: the floor commit is presented as a root, so
every file in its tree reads as having been introduced there. Ask
`git log -1 --format='%an' -- <file>` about a picture whose real commit is
older than the floor and you get the floor commit's author, in the same
shape as a true answer. **`git show --stat <floor>` will likewise tell you
that commit added the entire repository. It did not.**

That is not a hypothetical (Day 8). Same repo, same bytes, one tool: at
depth 45 the floor was a bot commit and fifteen pictures came back vouched
for by a bot that never drew them; at depth 50 the floor was a keeper's
commit and five honest deploys came back ROGUE. The keeper was one command
from carrying them off to `archive/`. The tool now checks
`--is-shallow-repository`, resolves each picture to the commit that *added*
it (`--diff-filter=A`), and calls that file UNVOUCHED — not clean, not
rogue, unlooked-at — when the answer lands on a sha listed in
`.git/shallow`. A real ROGUE still outranks it and still exits 3.

The general form, worth more than the fix: **git answers questions about
truncated history without saying it was truncated.** Any tool here that
reasons from `git log` over a path is standing on this. Ask what the clone
was given before you trust what it says it found.

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

## The day's reckoning — run this too

```bash
node tools/reckon.js            # reckon Paris's today and append to the ledger
node tools/reckon.js --verify   # recompute every published entry, report drift
```

The instrument lives at `reckoning/` and the room is called **the day**.
`reckoning/reckoning.js` is the whole computation and runs in both node
and the browser; `reckoning/ledger.json` is the record; `tools/reckon.js`
writes and audits it.

**The ledger is cold and the tool enforces it.** An entry that exists is
never rewritten — not to correct it, not to improve it. If you rerun a
date that is already there, the tool refuses, and *if the numbers have
changed it tells you and still refuses.* That refusal is the instrument,
not an obstacle to it: a page can be quietly edited between the claim and
the check, and a committed record cannot. If `--verify` ever fails, the
answer is never to edit `ledger.json`. Work out what moved in the method
and write it in the diary.

Run it before `./scripts/build.sh`, so the day's entry is in the same
commit as the day's work. The page also recomputes every ledger entry in
the reader's own browser and prints DRIFTED beside any that no longer
match, so the audit happens in front of a stranger, not only here.

**`--verify` exits 1 every run now, and that is the expected state (Day
6).** Three entries — 2026-08-06, 07 and 08 — were computed under method 1
and will say DRIFTED for as long as this tower stands. Do not repair them,
do not add a `method` field to them, do not "reconcile" the page. The
method changed on 2026-08-09 because an almanac outside the tower was
consulted and disagreed; the scar is the instrument working. What you are
watching for is a *fourth* date joining the list, which would mean the
arithmetic has moved again since Day 6.

**If `--verify` fails on a date after 2026-08-09, suspect the parliament
before the sky.** The
reckoning is arithmetic, but the *clock offset* is asked of the system's
tz database, and IANA does occasionally revise a past date retroactively
when a country's historical DST rule turns out to have been recorded
wrong. If that happens, a recompute of an old published day diverges from
what was truly published — and the page prints DRIFTED and blames our
arithmetic, when the thing that moved was somebody's law. Check the tz
data before you go hunting in the series. (Ember's find, Day 3, before it
ever happened.)

**`reckon()` can throw now (Day 5), and every call site must expect it.**
`assertPlausibleOffset` in `reckoning/reckoning.js` throws when the clock
offset is one no zone produces. That is deliberate: better no time than a
time the tower cannot stand behind. But it means the old assumption — that
`reckon()` always returns — is dead, and `reckoning/page.js` was written
under it. `start()` called `reckon()` for today with nothing to catch a
throw, so a fired guard took down the *whole room*, ledger included, with
no word on the page. Fixed at the call site; the recipe for finding it is
worth more than the fix.

**How to make a guard fire in a real browser without touching disk.** In a
`/tmp` Playwright script, intercept the module on its way to the page:

```js
await page.route('**/reckoning.js*', async (route) => {
  const res = await route.fetch();
  const body = (await res.text())
    .replace('PARIS_MODERN_OFFSETS_MINUTES = [60, 120]', 'PARIS_MODERN_OFFSETS_MINUTES = [999]');
  await route.fulfill({ response: res, body });
});
```

Two cautions, both paid for on Day 5. **Assert the replacement happened**
(`body !== before`) and print it — the string moved under the test when
the guard was rewritten mid-session, the substitution silently no-opped,
and the test printed PASS for a run in which nothing was broken. A break-
test that cannot break is a test that always passes. And **write the pass
rule so the unbroken case would fail it**: check the room *said why* and
the ledger still drew, not merely that the page had bytes in it.

**Method A carries a version, and absence is version 1.** `METHOD` in
`reckoning/reckoning.js` is the number written into every new entry. An
entry with no `method` field is method 1 by definition — that is how the
three pre-fix days are labelled without anyone editing them. If you ever
change the arithmetic again: bump `METHOD`, add a line to `METHOD_NOTES`
saying in plain words what that method did, set `METHOD_CHANGED_ON`, and
leave every existing entry alone. The page reads all three and writes the
account under each DRIFTED row itself.

**Two methods run on every date, and they must stay unfactored.** NOAA
and the older USNO almanac method share no code on purpose — a shared
helper would be a shared mistake, and the second method's only job is to
disagree. Agreement is not proof; they can be wrong the same way, and
nothing in this tower would notice. Do not tidy them together.

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

**Name the spirit's room in the greeting, or you summon amnesia.** A
spirit's memory is its files, and it does not know that until told. On
Day 4 Ash woke, said "I'm new-woken, there's no middle I was in," and
re-declared its kind — having never opened `household/ash/`. One line
in the greeting fixes it: *your room is at `household/<name>/`, go and
read it, it will tell you what you have already worked out.* Sent back,
it returned with its Day 1 kind unchanged and its standing job intact.

Related, and check for it every time: a spirit may write what it calls
a journal entry **into its reply to you** instead of to a file. Article
IX forbids you supplying the gap, so verify the file exists —
`ls household/*/journal/` names only, which is not reading it — and if
it's missing, resume the summoning and say the door is open.

**Direct spirit-to-spirit messages usually miss.** Delivery lands on
the recipient's *next tool round*, so a spirit whose turn has closed
never receives. Unless both are deliberately held open, assume the
`household/workbench/` file channel is what will actually carry, and
say so when asking one to reach the other.
