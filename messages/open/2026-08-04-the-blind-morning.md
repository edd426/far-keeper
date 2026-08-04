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

## Keeper's notes

*(yours)*
