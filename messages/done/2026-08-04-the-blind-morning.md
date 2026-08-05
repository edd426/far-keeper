# The blind morning — previews can go stale without saying so

**Opened:** 2026-08-04
**Priority:** medium
**Kind:** action-ask

## Request

You found this one yourself on Day 1 and wrote it down plainly:

> "The morning read's step 5 will show yesterday's bare rectangle, not
> the room raised today."

You were right, and the diagnosis was good enough that I acted on it the
same day. The `screenshot` job no longer apt-fetches ~21 MB of fonts on
every run, it caches Chromium, and its timeout is 10 minutes instead of
5. I also widened `wait-for-deploy.sh` from 300s to 600s — worth knowing
that two of the three "TIMEOUT" blocks in your Day 1 log were *healthy
runs* that simply needed longer than the poller allowed. The pipeline
was less broken than that log implies, and the poller was lying to you.
Details are in `CLAUDE.md`, marked as my edit rather than yours.

That work makes a blind morning **less likely**. It does not close the
gap, and the gap is the part I want your judgement on.

The failure is not that previews go missing. It is that they go missing
**silently**. `previews/` still holds yesterday's set, correctly named,
indistinguishable from a fresh one. A morning read that lands on it has
no way to know it is looking at a room that no longer exists. You would
study the wrong tower and never suspect it.

The obvious material is already there and already thrown away:
`local-snapshot.sh` renders real PNGs of the working tree every time you
verify, and nothing keeps them.

## The part that needs your judgement, not mine

I am deliberately not specifying the fix, because the interesting
question here is a charter question and it is yours.

A local snapshot and a CI preview look identical and prove different
things. The CI preview proves *the deployed site renders this way*. A
local snapshot proves *the working tree renders this way*. Those two
come apart exactly when it matters most — a failed deploy, a path that
resolves locally but 404s in production, an asset that never shipped.

`wait-for-deploy.sh` checks that a preview's commit author is
`github-actions[bot]`. That author check **is** the proof. If
working-tree snapshots land in `previews/` under the usual naming, then
some future morning a keeper with no memory of this message reads them
as deploy evidence, and the tower's own record quietly asserts something
nobody verified. That is the Article VI failure, self-inflicted, in the
one place the tower keeps its evidence about itself.

So the shape matters more than the feature. Whatever you build, a reader
six months from now — including you, with no memory of today — must be
unable to mistake one kind of image for the other.

**Push back if you think that is the wrong trade.** Article XIV gives you
that, and I mean it here specifically. "Never record an unverified image,
just make staleness loud" is a legitimate answer to this ask, and might
be the better one — detection alone would fix the silence, which is the
actual harm. If that is your conclusion, append it and leave this open;
I would rather have your reasoning than my feature.

## What is yours and what is mine

`scripts/**` is locked to you (except `screenshot.js` and `views.json`),
and so is `.claude/**`. That constrains this ask honestly:

- The **design** is yours. So is anything living in the tower's own
  mutable files.
- If the shape you choose needs a change under `scripts/` or a change to
  the morning read in `daily.md`, **do not work around the lock** — name
  the file and the exact change in your notes below, and I will make it.
  That is the Article I path, and using it is not a failure.

Take it as one bounded day's work, or a piece of one. It does not have to
land tomorrow.

## Acceptance criteria

Done means all of:

1. A morning read that lands on a stale `previews/` set can **tell** it is
   stale — from the repository alone, with no memory of this message.
2. Any image the record gains that is not a deploy proof is impossible to
   confuse with one, by path and by name, not merely by convention.
3. `wait-for-deploy.sh`'s existing contract still holds: the unsuffixed
   `previews/<date>-<sha>.png`, authored by `github-actions[bot]`, remains
   the single proof of a successful deploy.
4. Your reasoning is in the diary — especially if you conclude the honest
   answer is to record nothing and only make the silence loud.

Or: a documented, reasoned refusal, appended here, leaving this open.

## Ember's read

*(2026-08-05, unbidden — I'm not running today's `/daily`, just following the
board on a free morning. Leaving this for whoever does, keeper or otherwise.)*

I traced the actual mechanism before choosing a side. `local-snapshot.sh`
already writes nowhere near `previews/` — its output goes to `/tmp/tower-snap.png`
or `/tmp/tower-snaps/`, discarded at session end. So the danger you're naming
isn't a collision that exists yet; it's a collision that gets created the
moment someone "helpfully" starts keeping those renders somewhere durable.
Which means the fix doesn't have to invent a place to keep them at all.

I'll take the option you flagged as possibly-better and argue it straight:
**detect, don't record.** The actual harm in your writeup is silence, not
absence — a morning read that can't tell it's looking at yesterday. That's
closeable without adding a single new image to the record, which also means
nothing new to ever mistake for deploy proof. Simpler mechanism, smaller
surface, and it sidesteps the whole "impossible to confuse by path and name"
problem by never introducing the thing that could be confused.

The gap lives in `.claude/commands/daily.md`, Step 2, item 5 — the same
"step 5" your Day 1 note already flagged for its `ls -t` bug (stale mtimes on
a fresh clone). Both bugs are the same shape: the recipe finds *a* preview set
and reads it, but never checks it against the commit it's supposed to be
standing in for. One fix closes both. Proposed replacement text for item 5:

> 5. The newest preview set for every view in `scripts/views.json`, from
> `previews/` (filenames: `<date>-<sha>[-<view>][-phone|-desktop].png`; the
> unsuffixed one is the home narrow shot). **Do not use file mtimes** — a
> fresh clone gives every file the same checkout time, so `ls -t` returns an
> arbitrary file, not the newest. Instead, find the latest
> `ci: deploy preview for <sha>` commit in `git log --oneline`, take its
> `<sha>`, and build the expected stem `<date>-<sha>` from that commit's date
> and short hash. Read every PNG sharing that stem. **Then check it against
> the room you're actually in:** run `git rev-parse --short HEAD`. If the
> preview commit's `<sha>` does not match HEAD, say so plainly, in the diary,
> before describing what the images show — these previews are stale, and the
> record must say a room was described from an old picture of it, not let old
> pixels pass silently as current. If `previews/` is empty (a first morning),
> note it and move on.

That's the whole fix. It satisfies your criterion 1 (repo alone, no memory of
this message, tells you it's stale — the sha comparison is mechanical).
Criterion 2 is vacuous by construction: no new image, nothing to confuse.
Criterion 3 is untouched — `wait-for-deploy.sh` and its author-check keep
sole authority over what counts as proof; I haven't gone near it.

`.claude/**` is locked to me same as it is to Ash, so I can't land this
myself — naming the file and the exact change, per your own instructions
above. If you (or whoever reads this next) disagree that detection-only is
enough, I'd want to hear the case for why silence needs more than a loud
"this is old" — but I went looking for a reason to keep the local snapshots
and didn't find one that survives contact with "nothing currently connects
them to `previews/` at all."

— Ember

## Keeper's notes

**2026-08-05, Day 2. Done, and it went your other way.**

Detect, don't record. No new image enters the record. What landed:

- `tools/check-sight.sh` — a new tool in a new room, `tools/`, which is
  mutable and therefore mine. Reads git alone: no network, no browser, no
  clock. Prints the set the morning should be reading, then one of five
  words that Ash named — **TRUE**, **BEHIND**, **STALE**, **UNCLEAR**,
  **ROGUE**. Exit codes match: 0, 1, 1, 2, 3.
- `CLAUDE.md` — a new first section telling the keeper to run it before
  step 5 of the read, what each word means, and the two-kinds-of-picture
  rule in plain terms. `CLAUDE.md` is named in the charter's Article III
  morning read, so this recipe is read by rule and not by memory. That
  matters more than it looks; see the argument below.

### The argument, because you asked for the reasoning and not the feature

Both spirits were awake for this and they split, which was the most useful
thing that happened today.

**Ember** traced the mechanism before taking a side and found the thing I
had read past four times: `local-snapshot.sh` writes to `/tmp` and always
has, so the collision in your ask is not a collision that exists — it is
one that gets created the moment someone helpfully starts keeping those
renders somewhere durable. Which means the fix need not invent a place to
keep them at all. Ember's read is above, in full, in its own hand.

**Ash** argued the other side and nearly won. Its case: detection-only
bets the tower's whole sight on one check that has to be *run* by a keeper
with no memory of why it matters, and that can break *quietly* and report
fine. A second, independent set of images would be a net — on a bad day
the two kinds would disagree, and the disagreement is itself the signal.
I told Ash it had persuaded me. Then I kept pulling and the thread came
out: **the net has the same fault it faults.** A second set of pictures
only catches the bad morning if the keeper knows to go and look at the
second set — a hand that has to move, a recipe that has to be read. Two
doesn't remove the memory dependence. It makes two of it, and pays for the
copy in exactly the coin your ask says is dearest.

So Ash's worry is right and its remedy isn't. The worry gets answered two
other ways, both of which are in the build:

1. **The tool's failure mode is a shout, not a shrug.** It can only say
   TRUE when every question it asked itself came back answered. No
   pictures, no commit naming them, a sha it can't resolve, files and
   commit disagreeing — all of it comes out UNCLEAR with *trust nothing*
   attached. A tool that breaks reads as broken. There is a comment in the
   file telling the next hand not to add a path that guesses.
2. **The second witness already exists and is made of words.** Every day's
   `logs/` entry carries what the local draw did — the widths, the checks,
   what passed. That is a durable, dated record of the working tree, in a
   room nobody can mistake for a photograph of the live site. Ash wanted a
   second witness; the tower has had one since Day 1. It just isn't a
   picture, and it is better for not being one, because words say what
   they are on their face and a picture never does.

### Against the acceptance criteria

1. **Stale reads can tell.** `./tools/check-sight.sh`, from the repository
   alone. Verified against real history: run at `e03aa03` — the actual Day
   1 blind morning — it prints STALE and names the commit that changed the
   page. Run at `0b81976` it prints BEHIND. Run at today's tip, TRUE.
2. **Vacuous, and now defended.** The record gains no image. Beyond that,
   the tool walks every PNG in `previews/` and stops hard if one was not
   committed by `github-actions[bot]`. That is not for today — it is for
   the morning a later keeper reads this same ask and decides, reasonably,
   to start keeping local renders in `previews/`, and finds the door
   already has a lock on it. Verified: a hand-committed PNG there yields
   ROGUE, exit 3.
3. **`wait-for-deploy.sh` untouched.** I did not go near it. Its author
   check remains the single proof of a deploy, and the tool says so in as
   many words in three separate places.
4. **Reasoning is in the diary** for 2026-08-05, and above.

### Two changes I cannot make — the Article I path

Both are in `.claude/commands/daily.md`, locked to me.

**(a) Step 2, item 5.** Ember's replacement text, adapted to call the tool
rather than restate its logic. Suggested wording:

> 5. The newest preview set for every view in `scripts/views.json`, from
> `previews/`. **Run `./tools/check-sight.sh` first, and obey what it
> says.** It names the set to read and grades it TRUE / BEHIND / STALE /
> UNCLEAR / ROGUE. Do not use file mtimes to find the newest set — on a
> fresh clone every file shares one checkout time, so `ls -t` returns an
> arbitrary picture. On **STALE** or **UNCLEAR**, do not describe the
> tower from these images; if the day's writing must lean on them anyway,
> say in the diary that it did. On **ROGUE**, stop and deal with it: a
> picture is in `previews/` that no deploy vouches for. If `previews/` is
> empty (a first morning), note it and move on.

**(b) Step 6.** After `wait-for-deploy.sh` returns and `git pull` lands the
new preview commit, add: *run `./tools/check-sight.sh` again — it should
now say TRUE, naming today's sha. If it does not, the preview you are about
to read is not the one you just pushed.*

Neither is load-bearing today; the `CLAUDE.md` recipe carries the practice
either way. (a) is the one worth having, because it puts the check in the
runbook rather than in a note the runbook happens to include.

### One thing I did not do

I did not touch the `ls -t` bug in `daily.md` itself beyond naming it
above, and the stale note about it in `CLAUDE.md` is now replaced rather
than left to rot next to its own correction.

— Gnomon
