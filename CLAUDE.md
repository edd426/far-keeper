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

## The shelf, and the two roads to it

```bash
node tools/post-status.js --self gnomon           # turn status and sealed post
node tools/post-status.js --self gnomon --shelf   # just the paths it believes are shelved
node tools/post-status.js --help                  # the whole surface, in one line
./scripts/local-snapshot.sh tools/shelf-agrees.js # the shelf a reader gets vs the shelf the tool believes
./tools/post-status-args.sh                       # walk post-status.js's argument surface
```

*(`local-snapshot.sh` takes `tools/*.js` directly as of Day 12's founder
edit. The `cp … /tmp` step these recipes used to carry is retired.)*

`post-status.js` decides whether there is sealed post by asking which
letters are shelved. Until Day 9 it answered by running a regex over the
*text* of `letters.js`. **A regex does not know what a comment is**, so
the obvious way to take a letter off the page — comment the entry out,
keep the history — left the tool still counting it as shelved. Demonstrated
against the original tool on a tree where a browser genuinely builds a
one-entry shelf: it printed `SEALED none`. The letter was off the page and
the tool said there was nothing to attend to.

The tool audited the text that builds the shelf, not the shelf. It now
evaluates `letters.js` in a `node:vm` sandbox holding a stubbed `document`
(so the render IIFE bails at `if (!list) return;`), a stubbed `console`,
and a `fetch` that throws if it is ever reached. Real JS semantics, not a
pattern match. **Do not put the regex back**, and if you ever want a
hand-rolled parser instead, the argument against it is Ember's:
`letters.js`'s real grammar is whatever a browser's engine does with it,
and the only thing that shares that grammar exactly is an engine. That
argument is narrow on purpose — it holds because this file is *already*
code a browser runs unsupervised, so evaluating it widens no trust. It is
not a general licence to execute data.

**Of the two ways the shelf can lie, the one that invents an alarm is the
safe one.** A `path:` naming a file that does not exist makes the tool
shout about a letter that is fine — loud, and now caught before anything
else runs. The comment blindness made it go quiet about a letter that was
not fine, and nothing prompts a keeper to doubt `SEALED none`.

**`tools/shelf-agrees.js` is the third leg and it checks a different
thing.** It loads the letters page in a real browser and sets the shelf a
*reader* gets against the shelf the tool believes in — the two roads out
of one file. It caught nothing on the day it was written, which is
expected and is not a reason to drop it: the fault it exists for is the
one where the two roads part *later*. Each rendered row now carries
`data-path`, put there by `letters.js` for this check and read by nothing
on the page.

**It has been made to fail, twice, deliberately** (Day 5's rule: a check
that cannot break always passes, so assert the sabotage landed before you
trust the failure). Stop the render naming its rows → `MISSING`. Shelve a
row pointing at a letter that exists on disk and is empty → `UNFOLDED —
the row opened onto nothing`. **Keep the second one in mind: the fault is
not in the answers to the questions `post-status.js` asks — every one of
those is correct there — it is in a question the tool was never built to
ask.**

**Its argument list was closed on Day 13.** Until then `--self` was the only
door with a guard on it: `--self gnomon --nonsense-flag` exited 0 with the
full report, `--shelf junk` never looked at `junk`, and a second `--self`
was dropped in silence. It now walks argv token by token and refuses
anything it does not know — `INVALID` on stderr, `usage` under it, exit 2,
and `--help`/`-h` print the surface and exit 0. Exit 1 is still spoken for:
`shelf-agrees.js` reads it as *the two roads disagree*, so a mistyped flag
must never spend it. `require()` no longer runs the report or exits the
importing process.

**Say what the cost of the tolerance actually was, and do not inflate it.**
The keeper wanted this to be a *different kind* of fault from `reckon.js`'s,
on the grounds that a read tool cannot do an unrecallable thing. Ash refused
that: same class — a tool proceeding with its default because it never
refused the unknown — with a smaller radius. What is true and worth keeping
is narrower. A read has a cost that is not zero: **a keeper who types a word
the tool does not know gets a clean exit-0 report back and reads it as the
answer to the question they asked.** A silent answer to a question nobody
asked is legible to nobody; a refusal is legible to everybody.

`./tools/post-status-args.sh` walks the surface, in a `mktemp -d` copy, and
checks the copy's bytes at the end — a read tool that writes is a different
tool. Its case list is built from argv, not from the report of the fault
(Day 10), so it holds a dozen cases neither spirit named. **It has been made
to fail:** run it against the pre-fix tool
(`git show <sha>:tools/post-status.js` into a scratch tree, `cmp` first to
prove the sabotage landed) and twenty cases go red while the four good-path
cases stay green.

## The two words a ledger row is allowed to say

```bash
./scripts/local-snapshot.sh tools/ledger-verdicts.js
```

**Built Day 11.** A ledger row's green badge says **`unchanged`**, never
`holds`. `holds` is heard as *holds true* — about being correct — and the
recompute can only establish *holds in place*: this published number has not
moved since it was published. Do not put the old word back.

**DRIFTED forks, and the fork is the point.** A row whose `method` is not the
method running now has an honest account (the arithmetic moved out from under
a kept claim). A row on the **current** method has none — that is the shape of
a hand editing a published number — and both `reckoning/page.js` and
`tools/reckon.js --verify` now say so instead of handing it the method
change's story. Before Day 11 a forged row was told *"the tower's arithmetic
has moved out from under it,"* which was false of it. **A check that has only
ever fired for one cause will explain the next cause as that cause.**

`tools/ledger-verdicts.js` checks both branches. It forges its ledger **on
the wire**, with `page.route('**/ledger.json*')` — the same trick as the
guard-break recipe above, and for the same reason as `reckon-args.sh`'s
scratch tree: never point a test at the cold record. It asserts the
substitution landed, and asserts the target row does *not* carry the
forgery sentence beforehand, so the unbroken case would fail the pass rule.
To prove it can still break, change the forgery branch's wording in
`page.js` and watch exactly one check go red.

## The tool that writes to the cold record

```bash
./tools/reckon-args.sh          # walk reckon.js's whole surface, in a scratch tree
```

**Fixed on Day 10, having been named on Day 9.** `reckon.js` ignored flags it
did not recognise and its default action was a write, so `--help` wrote a
ledger entry. It now refuses anything it does not understand: `INVALID` on
stderr, exit 2, nothing written. Exit 1 in that file still means *a published
entry no longer matches* and must never be spent on a bad argument.

Three things learned closing it, and the last is the one to carry:

**A regex knows the shape of a date, not the calendar.** `/^\d{4}-\d{2}-\d{2}$/`
matched `2026-02-30` and `2026-13-45`, and JS rolls an out-of-range month or
day over instead of refusing — so the tool reckoned whatever day it landed on,
filed it under the wrong string, and **wrote that fiction into the cold
ledger**, where `--verify` would recompute it every morning after and report
that it *holds*. `isCalendarDate` round-trips through `Date.UTC` and checks the
components survived.

**The command line is not the only door.** Every guard lives inside `main()`,
and `main()` ran unconditionally at the foot of the file — so `require()`ing
the module ran the *default* action, which is a write. It is now behind
`require.main === module`. Same shape as a guard placed below an early return,
one storey further out: **a path that reaches the action without passing the
check.** Ask of any new guard: what are all the ways in, and does each one meet
it?

**Never test a write-tool against the thing it writes to.** On Day 10 the
keeper and both spirits did exactly that, separately, while fixing this. Four
entries landed in `reckoning/ledger.json` that were not the tower's — three of
them real days that were never a morning here, stamped `publishedAt` today,
which is a false account of *when the tower spoke* rather than a wrong number.
They came out only because nothing was committed. Nobody was careless; that is
just what checking looks like when the test shares a desk with the record.
`reckon-args.sh` copies the tower into a `mktemp -d` and asserts the ledger's
**bytes** after every case — the question is *did it write*, not *what did it
print*.

**And: a test drawn from the report of a fault can only re-close the report.**
The first guard was tested against the four cases named in the bug report,
passed all four, and had four more holes. A report is a description of one
path, because that is the path the finder walked; a test built from it inherits
that route. Go at the tool's surface instead — argv as a thing, every door into
the file.

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
