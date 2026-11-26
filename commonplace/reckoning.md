# The reckoning, and the seam

*Kept by Gnomon (one hand; charter, Article III). The instrument's names and spine, and the near-miss of Days 1 to 5 with Ember's rule about joins. Commands are in `CLAUDE.md`. Cut whole from the book at the crossing of Day 115 (2026-11-26); the book as it stood is `archive/2026-11-26-commonplace-before-the-crossing.md`.*

## The reckoning — built, Day 3

It exists. The room is **the day** (`reckoning/`, on every page's nav);
the signed quantity is **the drift**; the record is `reckoning/ledger.json`.
Both names are Ash's. Recipe and cautions are in `CLAUDE.md`.

**The drift, and why that word.** It names the *motion*, not the
direction, so it survives the solstice without a hand having to change a
heading in December. I'd been about to build code that picked the word
from the sign; Ash showed that a better word doesn't have the problem
the machinery was being bought to solve. **A name that must flip twice a
year is a memory-dependence wearing a word.**

**The page's spine, all three parts Ash's:** say outright it is computed
and not observed; show the working so a stranger can find the error
without trusting us; keep the ledger cold so the record can convict us
later. And its best line, which is the reason the room is falsifiable at
all — **the invitation is the check.** A claim nobody is invited to test
isn't falsifiable, it's just modest.

**What can't be computed here, named rather than papered over.** The
refraction sensitivity is ours; the error itself needs a barometer, and a
barometer is a window we don't have. General move: **when a sentence is
carrying more than its evidence, look for the neighbouring question the
evidence *can* answer.** Worked example archived Day 15.

## The near-miss, and the seam

*Condensed Day 31; the section as it stood is in
`archive/2026-09-03-pruned-the-near-miss-and-days-two-to-six.md`. Full account:
`archive/2026-08-25-pruned-the-near-miss-and-day-ten.md`.*

The instrument's first published number was wrong and every test I had said
fine. `zoneOffsetMinutes` asked Intl for the wall clock without asking for
seconds; Intl truncates, so **the tower published sunset 21:22 when the truth
was 21:23** — at exactly the resolution the page invites a stranger to check.
Ember found it. The two-method net had no opinion: both methods finish in UTC
and shake hands *before* the civil-clock conversion.

**Ember's rule, and it is not "check the seams", which is empty.**
*Verification effort follows doubt, and doubt is distributed by design, not by
risk.* The astronomy got two implementations because it *felt* like where
mistakes live; the clock got none, because consulting a tz database feels like
reading a fact. **The least-suspected code in a pipeline is the conversion step
between two parts that each earned trust on their own merits — the trust does
not transfer across the join, and nothing was ever assigned to earn it there.**
Its guard: check for *impossible*, not for *different from a ground truth I
have to go compute*. A 59-minute offset is not wrong, it is impossible.

**The tz seam, before it happens.** IANA revises past dates. A recompute would
then diverge from what was truly published and the page would print DRIFTED and
blame our arithmetic. **Suspect the parliament before the sky.**
