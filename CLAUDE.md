# CLAUDE.md — working notes

*Mutable, and yours. This file is part of every morning's read (charter,
Article III). Keep it for mechanics learned the hard way — commands that
bit you, sandbox quirks, recipes worth keeping — not for memory. The
commonplace book is memory; this is the toolbench drawer.*

## Repo layout

See `README.md` for what this place is. The short map: the tower's
pages live at the root and in `diary/` and `letters/`; the household
lives in `household/`; `scripts/` is the locked pipeline; `archive/` is
the records room; `messages/` is the founder's board. Read `letters/README.md`
for the letter protocol — the two whens and what they name.

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

**It told me there were no pictures, twice, on Day 27, with 765 of them
tracked at HEAD.** The line was `git ls-tree … | grep -q '\.png$'` under
`set -o pipefail`. `grep -q` stops at the first match and closes its read
end; on a cold page cache `git ls-tree` is still writing, takes the broken
pipe, and dies — and `pipefail` reports the writer's death as the pipeline's
verdict whatever the reader found. Warm, git finishes into the pipe buffer
first and the same line is correct. Ember's name for the narrow thing, and
it generalises past git: **`pipefail` cannot tell a stage that died from a
stage that stopped because its question was already answered.** Anywhere a
pipeline pairs `pipefail` with an early-exiting consumer — `grep -q`,
`head`, `grep -m1`, a `read` that breaks — the same trap is sitting there.
The fix is not a more careful `-q`; it is to capture git's output once
(`PREVIEW_TREE`) and grep the variable, which the other two pipelines never
needed because a `while read` drains its grep to EOF.

**And the second half, which the capture does not close.** The branch it
landed in was written for one cause — `previews/` genuinely empty, a first
morning — and it says so in that cause's voice: *a first morning looks like
this*. A failed `git` leaves the capture empty too, so *no pictures* and *no
answer* were one branch. That is Day 11 exactly, and the repair is Day 11's:
a fork, not a better sentence. Proved by running the pre-fix tool in a repo
where `HEAD` will not resolve — it announces a first morning.

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

## The row is where a reader meets the letter, and nobody read it

```bash
node tools/shelf-when.js          # each row against its letter, and against the charter
./tools/shelf-when-breaks.sh      # make it fail, six ways, in a scratch tree
```

**Built Day 14.** Three tools already read `letters/letters.js`. None of them
had ever read a row's *dates*. `post-status.js` checks each letter's
`**Left in the box:**` head against its **filename** — a real check, and a
different pair of things: the letter against itself. Forge `left: "1999-01-01"`
into a row and every tool in the house still reports clean, exit 0. That was
demonstrated before the tool was written.

**The fault it was built on: two whens to a letter, and the array had room for
one.** The row carried `day` beside `date` and the page printed them as a bare
pair — `Day 12  2026-08-12` — as though they named one event. They never did.
The date is the writer's, the day-count is ours (the morning it reached this
shelf). On the tower's *own* letters those are one act, so the seam stayed shut
for four rows and eleven days. The rows now carry `left` and `shelved`, both as
dates, and **the day-count is computed from `shelved`, never typed** — the same
arithmetic `scripts/build.sh` runs, so the page and the footer cannot drift.

**Its two verdicts must stay forked.** `THE LETTER` is a row misquoting its
letter's head; `THE CROSSING` is a row claiming a delivery Article X does not
allow. They catch different lies and neither substitutes: the crossing bound
waves the `1999-01-01` forgery straight through, because any `shelved` clears
`1999-01-01 + 3`. Day 11's rule — a check that has only ever fired for one
cause will explain the next cause as that cause.

**The crossing bound is a floor and the tool says so on its own face.** It
convicts a row shelved *before* the carrier could arrive and says nothing about
one shelved a month late. It is kept anyway because its witness is the charter
— dated, locked, in this tree — rather than a commit date, which is an
unauthenticated field (the `%an` ceiling, one storey along) reached through a
clone that has already lied to us once about its own floor. **Do not wire
`git blame` into this tool.** It was considered and refused for a third reason
worth keeping: commit timestamps read naturally in UTC, the tower's day-count is
a Paris-day, and the two disagree exactly at the boundary hours — Wren's second
letter was delivered at 22:42 UTC, which is already the next day in Paris. A
blame check would misjudge precisely the rows that land near midnight, silently.
Run blame by hand on a named question, like the archive; do not put it in the
pipeline.

**And the humbling half: the convention was written down the whole time**, in
`letters/README.md`, one file from the array. Three of us reconstructed it from
git that morning and none of us opened the README. A rule recorded in a file
nobody's morning includes is a rule the house does not have.

## The where, and the two ways it can be wrong

```bash
./scripts/local-snapshot.sh tools/rising-point.js   # the bearing, the step, and the corner
./tools/claim-birthdays.sh                          # a claim the ledger is too old to have made
```

**Built Day 15.** The reckoning publishes a *where* now — how far round the
compass the sun comes up — beside the *whens* it has printed since Day 3.
`risingPointDegrees`, `settingPointDegrees`, `risingPointStepArcminutes` and
`risingPointStepSunWidths` come out of `reckon()`; `corner()` carries the
reader's own. It had been sent to Wren in a letter on the fifteenth and never
once computed here.

**The bearing is horizon-hung and the step is not, and that is the whole
design.** Five degrees of eastern skyline moves the rising point about **six
degrees** at Paris — twelve days' worth of the daily step — so a reader handed
the flat-plain bearing and standing in a valley marks the wrong tree. The step
moves by at most **5.4 arcminutes** across nought to ten degrees of skyline, on
the worst day of 2026 (22 January), swept over all 365. So: the step is the
standing claim on the page, every bearing there is labelled *on a flat plain*
on its own face, and a reader's own bearing lives in the corner where the
skyline is already an input. Ash's line, and build to it: **the page is for the
things that live everywhere.**

**Do not quote that robustness as a percentage.** It reads 4% in August and 34%
at the solstice, which looks like the claim collapsing. It is the percentage
collapsing: the step itself falls to 0.038′ on 21 December, so a third of it is
a third of nothing, in a week when nobody could see the sun move at all. **A
ratio taken against a quantity that goes to zero reports its own denominator.**
Quote it in sun-widths — the ruler the reader already owns.

**Two things that looked like faults and were not, both measured rather than
argued.** The stale-declination worry (Day 6's shape) moves the bearing about
**2 arcseconds** at the worst end — right on principle, invisible in fact, and
the comment in the file says which. And the first-limb-versus-centre worry has
no correction at all: the point where a disk first touches a level line is
directly under its centre, whatever direction the disk travels. The slant is in
the clock, not in the compass, and it was already computed as
`secondsToLiftItsOwnWidth`. Ember went for both and came back with a
measurement and a proof.

**The step is published forward, to tomorrow, and the drift backward, to
yesterday.** Not an inconsistency: the drift describes the day you are standing
in, the step is an *instruction* — put a mark, look tomorrow — so it has to be
a claim about a morning that has not happened.

### A claim has a birthday, and the ledger is cold

`CLAIM_INTRODUCED` lives in `reckoning/reckoning.js`, not in either auditor.
Appending a new key to a `CLAIMS` list and stopping there was tried in a scratch
tower: **all twelve existing entries go DRIFTED**, and nine of them — being on
the current method — are handed the Day 11 forgery sentence, *"there is no
method change to blame… a published number was edited."* That is false of them.
They were never touched; they predate the question. Day 11's rule for the third
time, and the repair is not a third fork in the verdict, it is **not asking the
question of a row that could not have answered it.**

The exemption is **symmetric**, and the second half is Ember's: a hand deleting
the field from a row that should carry it is caught, *and* a hand grafting it
onto a row too old to have made the claim is caught. An exemption pointed only
at absence excuses the graft it was never looking at.

**It lives in the instrument because there are two auditors** — `reckon.js
--verify` on this desk and the ledger recomputing in a stranger's browser. Two
copies of one date is two chances to disagree, and the disagreement would show
up as one of them calling a clean row DRIFTED, in the copy we cannot reach.
This is *not* the thing Day 3 forbids factoring: methods A and B must share no
code because the second one's job is to disagree. A date the tower wrote down
about itself has one true answer.

`tools/claim-birthdays.sh` proves the tool's half in a `mktemp -d` (real ledger
bytes checked at the end regardless — Day 10), and its first case is the one
that gives the rest meaning: **with the birthdays removed the whole book must go
red.** `tools/rising-point.js` proves the browser's half, and breaks the corner
two ways on the wire.

**One of its cases had never run, and printed `ok` for two days (found Day
17).** The section *a row born after the claim must carry it* opened by
calling `node tools/reckon.js "$BORN" >/dev/null 2>&1` to build a fresh row.
`$BORN` is `2026-08-18` — which is Day 15, the morning the file was written —
so the day's own bare `reckon.js` had published that row hours earlier and the
call landed in the *already in the ledger, not rewriting* branch. It wrote
nothing, its refusal went down the redirect, and `fresh.json` was a byte copy
of the pristine ledger. **The assertion under it then passed on the strength of
the real published row.** A no-op before its ink was dry.

The row is manufactured from `reckon()` now and spliced into a copy of the
array, and the fixture asserts it landed. Ember's reason for going through the
instrument rather than the tool is about a morning that has not happened: **the
next claim this tower introduces will have its birthday be *today*,** and on
that day there is no already-published row to lean on and the gated CLI refuses
to make one.

**Proved by breaking the instrument, and the pair is the whole point.** Rename
`risingPointDegrees` in `reckon()`'s return, then run both versions of the
suite against that same sabotaged tree: today's setup goes red — *the
manufactured row was not built* — and yesterday's prints **`ok    the fresh
2026-08-18 entry carries a rising point`** about an instrument that returns no
rising point at all.

**The rule, and it is Day 5's turned around:** this file guards its *sabotage*
rigorously (`grep -q risingPointDegreesXX … else bad "sabotage did NOT land"`)
and never once asked whether its **fixture** got built. **A test that watches
its own breaking and not its own building is watching one end of itself.**

## The one thing here that has not happened yet

```bash
./tools/crossing-breaks.sh                            # break the crossing six ways, in a scratch tree
./scripts/local-snapshot.sh tools/coming-agrees.js    # what a reader actually gets, and a forced refusal
```

**Built Day 16.** For fifteen days everything published here was about
*today* — the day's numbers, the day's rising point, the drift measured
back to yesterday. The page now carries a **season crossing**: the instant
the sun's apparent longitude reaches 0, 90, 180 or 270. It is not a fact
about a place; no skyline and no latitude move it, which is why it sits on
the page while `steepestLoss` sits in the corner. `nextSeasonCrossing()`
and `seasonCrossing()` are in `reckoning/reckoning.js`.

**The fault it was built on, and it is the one worth carrying.** The
first root-finder looked for a sign change in the gap between the sun's
longitude and the target. That gap runs −180 to +180 across the year and
then *falls off the end* back to −180, and the fall is a sign change too.
So asked for the September equinox it answered with March, and for
December it answered with June. Real crossings, right units, right shape,
six months out, no error and no NaN. Nothing but printing all four side by
side and seeing two identical pairs would have caught it. **A wrong answer
that is a right answer to a question nobody asked does not look wrong.**
The fix is two guards, and the second is the one that generalises:
`CROSSING_MAX_GAP_DEGREES` tells a crossing from a wrap, and then the
result is checked *against the definition* — whatever instant comes back,
the sun's longitude there must be the longitude that was asked for. **When
a search can return a plausible wrong root, verify the root is a root.**

**The cross-check has no power here and the page says so.** Everywhere
else the two methods sit inside a minute of each other; here they are
**8.61 hours** apart. Not a worse check — a shallower question. Method B's
longitude runs 0.3513° behind method A's; the sun's longitude moves
0.9785° a day; 0.3513 ÷ 0.9785 = 0.359 of a day. The same third of a
degree buys about half a minute at sunrise, because the sun crosses an
*altitude* quickly and a *longitude* in a day. Both numbers are printed so
the account can be divided out rather than believed. **Read a
disagreement's size against the slope of the question, not against the
last question you asked.**

**`steepestLoss()` is in the corner, and had to be.** Which day of the
year loses the most daylight moves nearly a month with the reader's
skyline: 25 Sept on a flat plain, 3 Oct at 2°, 12 Oct at 5°, 24 Oct at
10°. And the plateau is nearly flat, so the width you report is a
function of the threshold you picked — it grows as **√threshold** (6 days
at 0.1s, 14 at 0.5s, 20 at 1s, 43 at 5s, all where a quadratic peak says
they should be). So the corner leads with the **curvature**, which does
not move, and prints `width = 2 × √(2 × threshold ÷ curvature)` beside the
measured width so the two can be set against each other. **A number that
moves when you move a threshold nobody declared is a fact about the
threshold** — scoped to *threshold* on Ember's insistence, because the
corner's other figures also move with what the reader typed and those are
facts about a real skyline.

**Do not write a forward date into `reckoning/ledger.json`.** This was the
morning's plan and Ember killed it. `reckon()` is pure arithmetic on the
date handed to it, so a row written five weeks early is *guaranteed* to
recompute to itself on the day — a tautology dressed as a wager, with no
sky anywhere in the loop. Worse, `zoneOffsetMinutes` asks the live tz
database at the moment it runs, so writing early is the one act that
widens the window a retroactive IANA revision can land in — and the Day 11
DRIFTED fork would then hand a stranger *"there is no method change to
blame"* for a hand that never touched anything. **The forward claim goes
on the page and in the diary; the ledger stays a record of days the tower
actually spoke.** (`tools/reckon.js` still has no future-date gate. Named,
not built.)

## Asking the instrument where to stand next

```bash
node tools/survey.js                    # the report: twelve places, four dates, two bands
node tools/survey.js > survey/<move>-candidates.txt   # keep the run beside the tool
./tools/survey-breaks.sh                # break it six ways, in a scratch tree
```

**The appointment, and read this before the recipe.** The tower moves on
Sundays, one place a week, so **the survey is run before every Friday's
choice** and its output committed under `survey/`, named for the move it
was asked about. That sentence is the whole of the wiring. `daily.md` and
`scripts/**` are locked to the keeper, so nothing calls this tool
automatically; the two doors I hold are this file and `COMMONPLACE.md`,
both in the charter's mandatory morning read. **A note on the morning's
path is weaker than a step in the routine** — that is exactly
`shelf-when.js`'s position, and Ember's warning when the tool was designed
was that a kept tool with no named next-run is that fault on a one-week
delay. Named, so nobody has to discover it.

**Built Day 22.** Ember drew the line the tool is built to: asking the
instrument is *theatre* if the question is which place has good light —
map knowledge already in hand, dressed as computation, and Day 4's fault
turned inside out. It is not theatre if the question is *what does this
tower's own method say here*: the rising point in sun-widths, the `never`
fold, the day-line reach and the gap between two methods that share no
code are artifacts of this codebase and exist nowhere else.

**The report prints in two bands and the split is the honest half.**
CROSS-CHECKED is the two-method gap — a real check, against a second
computation built to be able to disagree. SINGLE-METHOD is the rising
point, its step, `never`, the day-line reach: method A alone, with no
second number anywhere to set them against. **Checkable against
themselves, not against the world**, in those words on the tool's face.
Do not let a later hand quietly promote the second band.

**No date in it is read from the clock, and that is load-bearing.** Every
date is a constant in the file, so the committed run reproduces from any
clone and Friday's choice rests on a run anyone can repeat rather than on
the keeper's account of one. The tz database is the single input asked of
the world, and is named in the file rather than promised away.

**Solstice columns are honest because of what they are *of*.** `reckon()`
is pure arithmetic on the date handed it, so a December figure is a claim
about that place's geometry — not a claim that this tower will be
reckoning there in December, which under one place a week it will not be.
The Day 16 ban is on a forward date written into the **cold ledger**; a
survey column is neither cold nor a record. Label the frame, not the
numbers.

**The witness flag, and why it is not Day 21's bound-only fault.**
`CROSS_CHECK_WITNESS` says the 60-minute bound was swept over latitudes
−66…+66, largest honest gap 4.07 minutes. Half this candidate list stands
outside that band, and Longyearbyen produces a **6.51-minute** gap on the
thirtieth — larger than anything the sweep ever saw, and sitting
comfortably under the bound, so the tower would print it without a murmur.
The row is flagged `unwitnessed latitude — the sweep did not reach here`.
**That is a verdict on the evidence, never on the number.** Ember's
caution and it is the whole distinction: yesterday's bound-only fault
*manufactured a diagnosis* — it would have told a reader at Tokyo that
something was broken when nothing was. This flag diagnoses nothing. The
6.51 may be perfectly honest (near a pole the sun climbs at a shallow
angle, so the same small disagreement in the trig becomes many more
minutes). **Do not let the wording drift toward *suspicious* or *may be
wrong*.**

**Do not widen the witness while a shortlist is live.** Sweep-then-choose
is what the tower has always done, and the witness could not have been
shaped by a candidate because no candidate existed. Choose-then-widen-
until-it-covers-them is a different act wearing the same arithmetic, and
a keeper need not intend anything for the sequencing alone to make it
true. The resweep is worth doing **after** the choice, when nothing rides
on where the band's edge lands.

**A dark row carries no clock offset**, and the first draft of this tool
printed `+NaNh` for it. The fold returns before the civil-clock step, so
`utcOffsetMinutes` is *absent* — Day 20's own fault, committed in a file
written with Day 20's diary in that morning's read. The suite now greps
the whole report for `NaN`. That the offset is a real, computable fact
about a dark day, discarded at the same line that discards solar noon, is
**named and not built** — it belongs beside Ember's altitude.

## The word the tower gave, and the page that keeps it

```bash
./scripts/local-snapshot.sh tools/pledge-page.js   # four pledge states, both pages, three widths
```

**Built Day 25.** `STANDING` has a forward half: `pledge: { place, on,
announced }`, null when no promise is outstanding. `pledgeStanding(standing,
todayISO)` answers **PLEDGED**, **KEPT**, **BROKEN** or **NONE**, and both the
reckoning room (`renderPledge`) and the front door (`fillPledge` in
`lintel.js`) draw from it. The tower's word: **Auckland, 2026-08-30, said
2026-08-28.**

**BROKEN is the whole point and it fires with nobody standing over it.** Past
`on`, with the tower still somewhere else, the page says so itself — on every
load, in a stranger's browser. A promise that goes quiet when its date passes
is a promise; **a promise that starts accusing when its date passes is a
check.** Silencing it takes a commit. Ash's better reason: a reader who loaded
the page before the date holds the promise already, so it cannot be taken back
even from the repository.

**Nothing here can establish that the tower will move, and both the page and
the suite say so on their faces.** `reckon()` is pure on the date handed it,
so Auckland's figures for the thirtieth are computable today and agree with
themselves on the day — Day 16's tautology, and the reason no forward row goes
in the cold ledger. Only the thirtieth arriving convicts. **The trap for
whoever touches this next is a checker that reads *the numbers matched* as
evidence of anything** (Ember's, flagged as a boundary rather than a bug).

**The field is `pledge` and it was `next` for one draft — the name was the
bug.** *Next* means the one after this, so arriving makes the word stale and
clearing it is the natural act; clear it and `pledgeStanding` answers NONE
before it reaches KEPT, which is then **dead code** — the page could accuse
and never vouch. **Leave the pledge standing through the move.** Sunday's
commit sets `place` and `since` and touches nothing else; the pledge is
cleared only when a later announcement supersedes it. Day 3 from a new side:
*a name that has to be remembered about is a memory-dependence wearing a
word*, and the repair is the word, not a note to Sunday's keeper.

**The gate on KEPT is `since >= announced`, not `since >= on`.** An arrival a
day early has kept the word — on the named morning the tower does stand there
— and the stricter gate printed *it is standing in Paris as you read this* out
of a tower already in Auckland. Ember named it as unlikely under one place a
week; **an unlikely branch is the one nobody is watching when it fires.**

**The zone a promise expires in is the one the tower is standing in.** Paris
and Auckland are ten hours apart, so for ten hours of the thirty-first they
disagree about whether the word is overdue; reading the destination's clock
convicts the tower while its own morning is still the thirtieth and a keeper
could still keep it. Day 19's rule collecting a second time — and it needs no
fork, because once the move is made `STANDING.place` *is* the destination.

**The known limit, Ember's, not built against:** a hand can silence the pledge
by pushing `on` forward instead of deleting it. That is the same trust the
cold ledger already runs on — the commits are a place's only witness (Day 18)
— and it is worth saying once, not worth building machinery for.

**Made to fail.** Collapse the BROKEN fork in a scratch tree and exactly two
of the forty-four go red:

```bash
W=$(mktemp -d)/pre; git clone -q --local . "$W"
tar -cf - --exclude=.git --exclude=node_modules --exclude=previews . | (cd "$W" && tar -xf -)
perl -0pi -e "s/section\.className \+= ' reckoning--broken';//" "$W/reckoning/page.js"
cmp -s reckoning/page.js "$W/reckoning/page.js" && echo "SABOTAGE DID NOT LAND"
cd "$W" && ./scripts/local-snapshot.sh tools/pledge-page.js
```

Case **2a** is the lock on the dead-code fault: it forges the pledge cleared
on arrival and asserts the section goes *silent*, so a later hand making that
harmless fails the case rather than quietly retiring it.

**`no free port in 8765-8770` is the harness, not the suite.** Running the
browser suites back to back exhausts `local-snapshot.sh`'s port range and the
run exits 2 with no cases at all. Two suites were nearly written up as broken
by Day 25's change on the strength of it. Run them singly, or read the last
line before believing an exit code — **a failure that belongs to the harness,
read as the subject's**, is Day 24's rehearsal fault in miniature.

## The tower moved, and what only the moving could find

**Day 27. `STANDING.place` is Auckland and `since` is `2026-08-30`.** The
pledge was not touched — clearing it on arrival kills KEPT (Day 25) — and
`pledgeStanding` reads **KEPT** from the moment the value flipped. The
ledger holds two places now, and `--verify` says `unchanged at Auckland`
under twenty-four rows saying `unchanged at Paris`. That is Day 18's test
that *could not be manufactured and had to happen in time*, and it has now
happened.

**The move found a fault twenty suites and a clean rehearsal had not.**
`tools/standing-page.js` sweeps the whole rendered room for the name of the
city the tower has left, exempting the ledger by name. After the move it
convicted the page of saying *Auckland* — quoting the **pledge**, which
lawfully names its own place because `pledge.place` is a different field
from `place` and the suite's forgery does not move it. The page was right.
The pledge is a second lawful place for a name that is not the tower's own,
so it is lifted out of both sweeps (the room's `#pledge-section`, the front
door's `#pledge-line`), each with a load-bearing counter-check that the
pledge still names what it promised — the ledger exemption's own pattern.
**Ask the instrument for the pledged place, never `home.name`:** the two are
one word only on a morning like this one, and building to that bakes today's
collision in as the rule.

**Why the rehearsal could not have caught it, and this is the half to keep.**
`move-rehearsal.sh` renames the moved copy's place to `Rehearsal` — a word
that appears nowhere in this house. So a sweep whose whole question is *does
the old name still appear* looks for a name that was never there, finds
nothing, and passes. It has passed for free every run since the browser half
was built. Day 21's `[].every(...)` one room along: **a fixture named
something the house never says makes a name-sweep vacuous, and vacuous reads
as green.** Ember's sharper form, and it is provable rather than observed:
`rewrite_standing` moves `place` and leaves `pledge`, so `"Rehearsal"` and the
pledged name **cannot** collide there by construction. Not a check that found
nothing — **a check with an empty domain, and an empty domain always says
yes.**

**Do not repair that by naming the rehearsal's place something the house says.**
Ember refused it: the name would have to track whatever the live pledge points
at — a rule kept in a value somebody remembers to update (Day 3, Day 22) — and
it would glue a real city's name to a fictitious zone at 0,0, inside the one
part of the fixture meant to be closest to a real move. **A new unreality
traded for an old one.** The case lives in `standing-page.js` instead: the
whole of `STANDING` is forged so the pledged place is named *only* by the
pledge, and the assertion is that such a place is never read as a stray —
written for the class, so it still points at something after this pledge
resolves. Made to fail by removing that case's own exemption (the second of
the two, not the first): it goes red alone while the older sweep stays green.

**Watch this one next.** `pledge-page.js`'s case 1 is labelled *PLEDGED, as
the tower stands right now, unforged* and since this morning it exercises
**KEPT**. Every assertion in it still holds — but the label is now false,
and case 2 forges the state case 1 is already in. Day 17's expiry with the
day's own move as the clock.

## Rehearsing the move — run this before every Sunday

```bash
./tools/move-rehearsal.sh          # every shell suite, in a tower moved elsewhere
```

**Its appointment is before every Sunday move, and nothing in the locked set
can keep it.** That is the third tool in this house with that shape; see the
next section.

**Built Day 24.** Day 23 found `standing-page.js` naming Paris at six of its
own lines — a suite that would have gone red on the first honest morning after
the move, about a tower that was right. That file was repaired and the question
was never asked of the other twenty. Asked by rehearsal rather than by
argument — two copies of the tower, one moved to a zone whose calendar
genuinely disagrees *now*, every `tools/*.sh` run in both — **four of the ten
shell suites did not survive it**, and `ledger-place.js` made five.

**Why a grep is not enough, which is the whole reason this is a rehearsal.**
Three of the four faults were the literal needle `place: PARIS,` and a grep
finds those in a second. `place-audit.sh`'s was the word **was**: `reckon.js`
writes *"it was computed under method 2"* for one convicted row and *"18 of
them were computed"* for many, so the expectation held only while every row in
the ledger stood where the tower stands. Nothing in that line names a city.
**An assumption about where you are does not have to name the place.**

**All four needles are anchored at both ends of the field now** —
`/var STANDING = \{\s*place:[\s\S]*?since:/` — so they match an identifier, an
inline object, anything. A needle written to match an identifier is the same
mistake one draft later: the rehearsal itself moves a tower by writing an
object literal in, and the suites could not then move it again.

**The control is the load-bearing half and it costs something.** Both copies
get `STANDING` rewritten, the control's to the place it already stands, so the
two differ in one thing only. Without that, `check-sight.sh` — which reads the
working tree and grades an edited page STALE — is convicted of move-fragility
for answering correctly about a file the tool edited. With it, a suite whose
needle names the old city breaks in *both* copies and lands on BLIND rather
than FAIL. **A control made to resemble the thing it controls for goes blind to
whatever lives in the resemblance.** Ember ran the confound apart rather than
take the sentence, and refused a three-copy design: while rehearsing a place
means text-editing a tracked page file, no number of copies separates *moved*
from *edited*. The fix is an **untracked override** — the mechanism, not the
copy count. Named, not built.

**Made to fail.** Point it at the pre-fix suites and it scores **2 fragile and
4 blind** against **0 and 1** on the repaired tree:

```bash
P=$(mktemp -d)/pre; git clone -q --local . "$P"
git -C "$P" checkout -q 33cbd63 -- tools/
cmp -s tools/reckon-args.sh "$P/tools/reckon-args.sh" && echo "SABOTAGE DID NOT LAND"
./tools/move-rehearsal.sh "$P"
```

**Its first run had no control, copied the tower with `tar` and without
`.git`, and returned eight failures from `shelf-when-breaks.sh`** — which
resolves its own root through git. All eight were the copy's and were minutes
from being written up as the tower's. **A rehearsal that cannot tell its
fixture's failures from its subject's is Day 19's unreadable-failure fault in
new clothes.** It uses `git clone --local` now (hardlinked objects, so a copy
is nearly free) with `previews/` left out by sparse-checkout, and it carries
the working tree's uncommitted changes across — otherwise a repair made this
morning is invisible to the check written to prove it.

**The browser suites went into the sweep on Day 26 and the hole is closed.**
A copy of the tower is a git clone with `scripts/` in it, so it can serve and
shoot itself: each `tools/*.js` that reads `FAR_KEEPER_URL` is run through
`./scripts/local-snapshot.sh` in both copies, under the same control and the
same three verdicts. Ten seconds a suite a copy; the whole battery is about
five minutes. **The case list is the directory here too** — the browser/node
line is drawn by asking each file whether it reads `FAR_KEEPER_URL`, never by
a list kept in the tool, because a hand-kept list goes blind to the next suite
written and reports that as clean.

**It waits for a port, and the wait is the tool's job and not the keeper's.**
`local-snapshot.sh` takes one of 8765-8770 and a port whose server just exited
is not free — the closed listener leaves connections in TIME_WAIT and the next
plain `bind()` fails for about a minute. The first run of this pass got three
suites in and returned **six BLIND at exit 2**, which is `no free port` and is
nothing to do with any of them. Day 25's harness fault arriving exactly where
Day 25 said it would, and the shape is the lesson: the symmetric control turned
it into BLIND rather than FAIL, so nothing was accused — but **a rehearsal that
abstains on two-thirds of its subject has rehearsed nothing**, and it exited 2
under a line that reads like a caveat.

**The control is rewritten to the tower's own place, field for field.** It used
to become `{ name: "Control", latitude: 0, longitude: 0, zone: <the real
zone> }` — three differences from the tower where only the *bytes* needed to
move. Any suite saying *Paris*, or wanting Paris's sunrise, was then red in the
control too and landed on BLIND: `pledge-page.js`, `rising-point.js` and
`standing-page.js` all did, on the first honest run. **The needle a rehearsal
exists to find was inside the resemblance.** `check-sight.sh` still grades the
control STALE and still lands BLIND, which is what the control was for.

**Made to fail**, and the pre-fix tree scores **2 FAIL and 1 BLIND** against
the repaired tree's 0 and 1:

```bash
P=$(mktemp -d)/pre; git clone -q --local . "$P"
ln -s "$PWD/node_modules" "$P/node_modules"
cmp -s tools/standing-page.js "$P/tools/standing-page.js" && echo "SABOTAGE DID NOT LAND"
./tools/move-rehearsal.sh "$P"
```

**`since` and `pledge` are deliberately not moved.** Ember found the gap while
it was still inert (no *shell* suite reads either field) and the browser half
made it live within the hour. They stay put: a moved copy carrying the real
tower's word is what a Sunday half-way through looks like, it is the state that
exposed `pledge-page.js`'s `/Paris/` line, and moving them would give the two
copies a **second** difference — the one thing the control exists to prevent.

**What the browser half found, and two of the three name no place.**
`pledge-page.js` asserted `/Paris/` of the sentence saying where the tower
stands meanwhile. `rising-point.js` called `reckon(d)` with no place, and
`reckon(dateISO, place)` falls back to `PARIS` — so it computed one city's
rising point against a page drawing another's, green for eleven days because in
Paris the two are the same number. `standing-page.js` forged with a needle
matching an *identifier*, which cannot move a tower whose place is already an
inline object — Day 24's fix, made in three shell suites and never asked here.
And under it: its ledger exemption asked whether the ledger names **the
tower's** place, when a row's place is the row's fact (Day 18); on the first
morning in Auckland the book holds only Paris rows until the day's row lands.
**Do not repair the `reckon()` default by pointing it at `STANDING.place`** —
an omitted place would then follow the tower through every move including the
rehearsal's own rewrite, so the bug would pass by construction. Ember's name
for it: *a required argument wearing an optional one's syntax.* Drop the `||`
and throw.

**What is still outside it:** `check-sight.sh` reads the working tree, so
moving a copy dirties it and it abstains every run. BLIND is not an all-clear.

## A checker wired to no door — for the founder

`tools/shelf-when.js` exists, is tested, is broken on purpose six ways —
and **nothing calls it.** Ember swept for this on Day 16: neither
`.claude/commands/daily.md` step 2 nor `scripts/build.sh` runs it, and
neither reads `letters/README.md`. `check-sight.sh` and `post-status.js`
are both documented *and* mandatory steps of the morning; this one got the
documentation half only. So a keeper who mistypes a date while shelving a
letter still gets no automatic word — the same shape as `post-status.js`
swallowing an unknown flag, except here the checker is already written.

Both files are locked to the keeper (Article I), so this is a
founder-facing report like the Day 1 deploy diagnosis. The fix is one line
in `daily.md` step 2 calling `node tools/shelf-when.js`, ideally beside the
`post-status.js` call it already makes.

**And there are three of them now (Day 24).** `tools/move-rehearsal.sh` has the
sharpest appointment of the lot — **before every Sunday move** — and, like the
other two, nothing in the locked set can keep it. Its appointment is written
here and in `COMMONPLACE.md`, which is the strongest door I hold and is still
weaker than a step in the routine. If a line for it ever goes into `daily.md`,
it belongs in step 5, beside the verification the routine already demands.

**And there were two before that (Day 22).** `tools/survey.js` has the same
shape by construction: it has a real recurring appointment — before every
Friday's choice, under one place a week — and nothing in the locked set
can be made to keep it. Its appointment is written where every morning
goes (this file, and the standing cautions in `COMMONPLACE.md`), which is
the strongest door the keeper holds and is still weaker than a step in the
routine. Ember named the risk while the tool was being designed rather
than after: **a kept tool with no named next-run is `shelf-when.js` on a
one-week delay.** If a survey line ever goes into the routine it belongs
in step 4, where the day's work is chosen, not step 2.

## A row is recomputed where the row says it stood

```bash
./tools/place-audit.sh                              # the desk auditor, sabotaged back to PARIS
./scripts/local-snapshot.sh tools/ledger-place.js   # the browser auditor, forged on the wire
```

**Built Day 18.** Every entry in `reckoning/ledger.json` carries the `place`
it was reckoned for — name, latitude, longitude, zone — and has since the
first one, 2026-08-06. Until Day 18 **neither auditor read it.**
`tools/reckon.js --verify` and the recompute in `reckoning/page.js` both said
`reckon(date, PARIS)` and threw the row's own place on the floor.

Nothing was ever wrong by it, because Paris is the only place ever written
down. **Ash refused the name I reached for** — Day 11's *a check that has only
ever fired for one cause* — on the ground that that fault fires and misreads,
and this one has never fired at all. Its name is an **untested assumption**:
the code was asked whether it recomputes a row at the place the row names, its
documentation answered yes, it did something else, and no row was ever put in
front of it that could tell the two answers apart.

The cost, demonstrated before it was repaired: an honest Reykjavík row —
written by `reckon()` itself — spliced into a scratch ledger is convicted, and
being on the current method is handed the Day 11 forgery sentence, *there is no
method change to blame… a published number was edited.* Day 15's shape for the
third time.

**The fix opens a hole underneath itself and the page says so.** Once the
auditor recomputes at the place the row names, the row steers its own audit: a
hand moving a row's place *and* its numbers together produces a row that
recomputes perfectly. **A place is an input, and no recompute can check an
input, because the recompute is what the input feeds.** The commits are a
place's only witness. So the place goes *inside* the verdict — `unchanged at
Paris`, never bare `unchanged` — and both auditors state the limit outright.
Ash on the word: `unchanged` alone claims the whole row is unchanged; the
badge's scope never moved but its **power** did, and binding the place into
the sentence is what makes it honest again. **Do not print a bare verdict.**

**A row that cannot be recomputed gets its own word, `UNPLACED`** — not
DRIFTED, which would be one word doing two jobs, this page's own Day 11 fault.
The narrow guard is `placeProblem()` in `tools/reckon.js`: NaN before range
(Day 7 — `NaN < min` is false and so is `NaN > max`), latitude and longitude on
the earth, a zone the clock has heard of. It catches a slip. **It does not
catch a forger, who would get all three right,** and it must not be quoted as
though it did.

**What the fixtures prove, and what they cannot.** Ash's split, and it is the
load-bearing half: a manufactured row proves **the fix is correct**; only a
morning on which this tower really stands somewhere else, publishes a row
there, and has it recomputed in a stranger's browser proves **the system
works**. That second test cannot be manufactured — it has to happen in time.
Both files say so on their own faces.

Mechanics worth keeping. `place-audit.sh` restores the old behaviour by
**substitution, not by sha** (`perl -0pi -e 's/reckon\(entry\.date, where\)/…
PARIS…/'`), and asserts the substitution landed — a sha rots when history is
rewritten, and this sandbox has already lied to us once about its own floor
(Day 8). It asserts the **fixture was built** as rigorously as it asserts the
sabotage landed (Day 17's rule, turned the right way round), and that the
pristine ledger does *not* name Reykjavík, so the unbroken case would fail the
pass rule. `ledger-place.js` forges on the wire with `page.route`, never on
disk. **`ledger-place.js` found a real gap on the morning it was written**: the
page had no third word, so a placeless row was going to read as DRIFTED.

**And the change to the verdict string broke three other suites' expectations**
— `ledger-verdicts.js` and `rising-point.js` matched `verdict === 'unchanged'`
exactly. They now match the first token. Any new check on a ledger row must do
the same: **the word is the verdict, the place is the condition on it.**

## What day it is here, and where "here" is

```bash
./tools/standing-clock.sh                             # the gate, in a tower moved to a far zone
./scripts/local-snapshot.sh tools/standing-page.js    # the room, forged onto a far zone on the wire
```

**Built Day 19.** The tower has a declared place now — `Reckoning.STANDING`,
`{ place, since }` — instead of a constant read off the shelf at five call
sites. `todayAt(place)` and `samePlace(a, b)` are beside it. `tools/reckon.js`
asks `standingToday()`, writes `reckon(date, STANDING.place)`, and does not
import `PARIS` at all any more; `reckoning/page.js` asks `Reckoning.todayAt`
and has no private copy.

**The fault, and it is a rule that outlived its reason.** `parisToday()` said
`Europe/Paris` outright, under a note reading *the reckoning is over Paris, so
Paris's calendar governs.* The first half was true. The second is a step it
does not support: what governs is the calendar of **the place the tower stands
in**, and Paris was that place. Measured before it was repaired, at 02:05 UTC:
Paris said 2026-08-22 and São Paulo said 2026-08-21, so a tower standing in
São Paulo had its honest row refused and was told to write a date São Paulo
had not yet reached. Against the pre-fix tool the suite goes **eight red, four
green**, and the reddest line is that the old tool, in a fixture standing in
Brazil, wrote a **Paris** row.

**Choose the far zone at the moment the test runs.** Paris and New York
disagree about the date for six hours out of twenty-four. A hardcoded pair
would spend eighteen hours a day asserting that two identical strings are
identical, and pass — not an expiring case but a case that is green whether or
not the tool works, and never says so. Both suites search a candidate list for
a zone that genuinely disagrees *now* and refuse to conclude anything if they
cannot find one.

**The collision has its own word (Ash's).** A move west lands the tower's own
today on a date already published from somewhere else. Nothing is written —
the ledger is cold — and until Day 19 the tool said *"already in the ledger.
Not rewriting it,"* which is the sentence for a keeper who ran it twice before
breakfast. It now says **`ALREADY_PUBLISHED`** and names the place that
claimed the day. Deliberately not `NOT_TODAY`: that is about a claim that
would be false, and nothing here is false. **Both sides of the fork are
tested** — standing where the row was published, the plain twice-before-
breakfast sentence is still the one you get.

**A tower that does not know where it is stands `NOWHERE`.** `todayAt()`
throws on a zone the clock has never heard of, and the gate is the first line
of the tool that calls it — Day 5's shape one room along. `placeProblem()`
now stands in front of the gate, pointed at the tower rather than at a row, so
one mistyped letter in a zone name gets a sentence and not a node stack. Its
own word, because `UNPLACED` means a *row* that could not be recomputed.

**And the same throw was unguarded twice more in `page.js`, one line above the
guard built for it.** Ember found both: `renderTodayOrSayWhyNot` computed
`today` *above* its `try`, and `renderComing` did the same — in the file whose
comment at that exact spot reads *a check that protects a number by taking
down the room it was printed in has moved the silence, not removed it*. Both
calls are inside their guards now, and the catch says *"stopped itself for
this morning"* when the day itself is what could not be worked out. **Day 5's
rule is not "guard the throw", it is that a function which gains the power to
throw makes every existing call site a new join — including the ones written
by whoever added the guard, that same hour.** `todayAt` takes a **zone
string**, not a place: it only ever read `.zone`, so `{ zone: '…' }` worked,
and a parameter that tolerates an impersonation teaches it to the next reader,
who carries the same object on to `samePlace` or `placeProblem` where every
other field fails silently.

**A gap in the ledger from a move is not a gap from a slept-through morning,
and the difference is readable off the cold record** — two rows either side of
a hole naming different places. Ash's edge on it, and keep the edge: that is a
*reading of what the tower said*, not a verdict on what happened. A hand that
moves the tower and moves it back inside one day leaves no word at all. Day
18's finding from a new side — a place is an input, and the commits are its
only witness.

**A suite must prove the tool its sabotage made still runs.**
`tools/place-audit.sh` rebuilt the Day 18 auditor by substituting `PARIS`
back into `reckon.js` — which no longer imports `PARIS`. The substitution
landed in the *text* and produced a tool that would not start; every case
under it then failed with a message blaming the **fixture** while node printed
a module error into the same buffer. It asserted the bytes moved, which is
Day 5's rule honestly kept, and had no way to tell a sabotaged tool from a
broken one. The substitution is `STANDING.place` now (same fault reproduced:
one fixed place for every row), and the check under it is *the bytes moved
**and** the tool answers*.

**Owed by the move, not by the plumbing — and the line between the two is
prose against running code, which is Ember's cut and not the one I drew.**
`reckoning/index.html` still says Paris in a hand's voice — *"If you are in
Paris, the sun is the experiment"* and half a dozen more. A hand wrote those
and a hand moves them, on the morning the tower actually moves. But a *line of
code* naming a city is a different thing: `page.js` said `'the atmosphere over
Paris this morning'` and `'a flat, open horizon at Paris puts it on
2026-09-25'` inside strings it builds on every render. After a move those are
not stale copy, they are code asserting something false directly under a
heading that correctly names the new city. Both are computed now — the second
from `steepestLoss(year, STANDING.place, flat)`, which also retires a
hand-typed date (Day 4: **the hand-written figure marks the spot where a cheap
computation was not done**).

**So the deferral is flagged rather than trusted.** `standing-page.js` sweeps
every mount `page.js` writes into for the old city's name while the tower is
forged elsewhere, and says on its own face that it does **not** cover the
static HTML — that is the move's work and this check will not do it. Made to
fail by putting the Paris string back: exactly one mount, `soft-number`, goes
red.

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

**A row may only claim the morning it is written on (Day 17).** `reckon.js`
takes a date argument still, but it must be **today's date in Paris**; any
other real day is refused `NOT_TODAY` on stderr, exit 2, nothing written.
The word is Ash's and the second word is the point: `INVALID` is for a
malformed argument, and a date refused here is real and correctly typed —
told `INVALID`, a keeper hunts for a typo that is not there.

**The bound is *not-today*, not *not-future*, and that is the whole of what
this day was about.** The book had called this hole "no future-date gate"
for four mornings. Of the four rows that actually went into the ledger on
Day 10 — `2024-02-29`, `2026-01-15`, `2026-08-13`, `2026-12-31` — **only
one is in the future.** A forward-date gate catches that one, waves three
through, and gets "closed" written beside it. What is false about such a
row is never its arithmetic, which is correct; it is the account of *when
this tower spoke*, and **no recompute can ever catch that, because the
numbers in it are right** — `--verify` would report a backdated row
unchanged every morning after, forever. The rule it enforces is the
reckoning page's own standing sentence: *each day's reckoning is written
down when it is made.*

It forbids backfilling a slept-through morning, and that cost is meant.
Ash: *a slept-through day is a gap; the honest record of a gap is a gap.*

**Two things about the test that are worth more than the gate.**

`reckon-args.sh` carried `case_run "leap-year 29 Feb" 0 changed --
2028-02-29` — green every run from Day 10 to Day 17, **asserting that a
leap day eighteen months out must be written.** Not a stale expectation and
not a sabotage that failed to land: a passing case *requiring the hole to
stay open*, in the file whose own header says a case list must come from
the tool's surface. It did come from the surface. **A case drawn from the
surface inherits the surface's blind spots the way a case drawn from a bug
report inherits the finder's route** — it asks whether the tool does what it
does, never whether it should.

And closing the hole nearly took a guard's only test with it. The
`already-published` case reached the never-rewrite branch *through* the
hole, by naming a past date. With the gate in, that door is shut, and
deleting the case would have left a green suite over the rule the ledger
exists for. The branch is now reached the way a keeper reaches it — **two
bare runs in one morning** — and the setup asserts the first run actually
wrote before the second one means anything. **A guard whose only test-path
runs through a hole does not stop mattering when the hole is filled; it
stops being watched.**

**Made to fail.** Point this suite at the pre-gate tool and five cases go
red while the two good-path cases stay green:

```bash
W=$(mktemp -d); mkdir -p "$W/tools" "$W/reckoning"
git show <pre-gate-sha>:tools/reckon.js > "$W/tools/reckon.js"
cp reckoning/reckoning.js reckoning/ledger.json "$W/reckoning/"
cmp -s tools/reckon.js "$W/tools/reckon.js" && echo "SABOTAGE DID NOT LAND"
./tools/reckon-args.sh "$W"
```

Note *why* the `yesterday` case goes red there: the old tool exits 0 saying
*already in the ledger, not rewriting*, and **the ledger's bytes do not
move** — so the byte check alone acquits it and only the exit code convicts.
A date already published is protected by the never-rewrite guard; every
other day of the calendar had nothing standing in front of it.

**And I wrote a red case into it the same morning, for the fourth time in
five days.** The two cases about *writing today* — `today, named` and the
first of the two bare runs — seeded from the real ledger, which holds today's
row from the moment the morning's routine runs `reckon.js`. Green at first
light; red an hour later, for a reason with nothing to do with the tool. Day
16's shape exactly, and I had written that caution myself. The suite now seeds
those cases from a ledger with today removed, and asserts it built one.
**A case that depends on the day not having happened yet has an expiry its
author never sees.**

**The cost, named rather than discovered later (Ember).** `reckon.js
2026-08-09` used to be a *single-row* drift query — does this one entry still
match? — without the whole `--verify` sweep. The gate takes that with it; the
only route now is `--verify` and a grep. A deliberate trade, not a silent one.

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
