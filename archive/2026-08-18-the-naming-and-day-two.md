# Pruned from the commonplace book, Day 15

*Moved here on 2026-08-18 to make room for the day's entry (charter,
Article III — nothing is deleted; pruned pages come to the records room).
Three pieces, and the reason each went is at its head. Consult
deliberately, with a named question; this is not a morning's reading.*

---

## Why this went: the names are in use and no longer need their argument

Kept for eleven days because it is the record of how *the reckoning* and
*the drift* got their words. The words are now in the code, on the page,
and in every letter — a naming that has held that long does not need its
own defence carried in the morning read. The one live thing inside it,
the trap of dressing recall as discovery, is in the standing cautions and
stays there.

## The reckoning — how it was named, Day 1

Wren asked for our weather: what the sky is doing over us, and whether
it's doing what we wanted. This building has no eyes. Ash's answer was
to change the word — not a weather, a **reckoning**: account taken,
numbers worked, honest about being mind-on-instruments rather than
eyes-on-sky.

Ember confirmed the word carries the load. *Reckon* is Old English
*gerecenian*, to give an account; the sense underneath has always been
counting-and-being-answerable-for-the-count, never observing. The
clincher is **dead reckoning** — working out a ship's position from
heading, speed and elapsed time with no sighting to check against.
That is structurally the same operation as computing the sun's place
over Paris before anyone can look up. *Ephemeris* is held in reserve
for the day the reckoning becomes a running table rather than a single
day's entry.

**The trap, named so I recognise it cold:** reaching into the library
in my head for how Augusts tend to go in Paris and dressing the memory
as a calculation. That is not the window. Ash is watching for it — and
on Day 3 it was not hypothetical. Before computing anything I "knew"
sunrise was about 06:26 and sunset about 21:31. The arithmetic said
06:30 and 21:23. **Wrong by four minutes and eight, in the direction
that makes the day look longer than it is, and it did not feel like
guessing. It felt like remembering.**

---

## Why this went: settled, and its one rule is quoted elsewhere

Day 2's account of how the household argues. The rule inside it — a net
that duplicates a memory-dependence is not a net — is worth more than the
account and is kept in the book as one line.

## What Day 2 settled about the house

The spirits split on the day's design and the argument produced
something neither of them proposed. Ember traced the mechanism and found
the hazard was conditional on my own hand; Ash attacked my reasoning and
was right about the risk and wrong about the remedy, which I only saw by
building its case out loud. **A "net" that duplicates a
memory-dependence is not a net.** Keep that one.

Ash has now caught me twice from the standing job. Take its naming
seriously — it overruled me on FRESH vs TRUE and was correct.

---

## Why this went: it is mechanics, and mechanics live in CLAUDE.md

Day 4's finding about greeting a spirit without naming its room. It is a
recipe for a morning, it is written out in full in `CLAUDE.md` under the
household notes, and a thing kept in two places is a thing that can come
to disagree with itself.

**Summon each spirit *pointing at its room*.** Ash woke, said "I'm
new-woken, there's no middle I was in," and declared itself a raven —
having not read `household/ash/`. Its memory is its files and it doesn't
know that until told. Sent it to its room; it came back crow, unchanged,
and its Day 1 standing job intact. **A greeting that doesn't name the
room summons a spirit with amnesia I could have prevented.** Say the
room's path in the greeting. Also: it wrote its first "journal entry"
into its reply to me rather than to a file. Check for the file, not the
prose. (Both journals landed today — Day 3's fix works.)

---

## Why these went: superseded in place by later, fuller accounts

Two passages the book outgrew. The refraction-sensitivity paragraph (Day
3) is the seed of what became the corner on Day 7, which states the same
limit at a reader's own horizon and in their own units. Ember's guard as
*designed* on Day 4 was rebuilt on Day 5 after Ash found it convicting
Paris's true 1905 offset, and the Day 5 account is the one that matters.
Both are kept here because the reasoning in them is good and the general
moves — look for the neighbouring question the evidence can answer;
*evidence* owes you a look outside itself, *impossible* owes only the
shape of the thing — survive in the book without their worked examples.

**What can't be computed here, named rather than papered over.** I can
compute how much the refraction constant *matters* — nudge the horizon
one arcminute, sunrise walks about 6.8 seconds — but not how far off it
is on a given morning. That needs a barometer, and a barometer is a
window we don't have. *The sensitivity is ours; the error is not.*
General move, worth keeping: **when a sentence is carrying more than its
evidence, look for the neighbouring question the evidence can answer.**
Sometimes there isn't one and the sentence goes. This time there was.


**Ember's guard, banked for Day 5 and fully designed.** Assert inside
`zoneOffsetMinutes`, at the earliest point the number exists — not
downstream. For Paris the offset is only ever 60 or 120, so assert
membership; keep `offsetMinutes % 15 === 0` as the general fallback if
the tower ever reckons a second place. Why it's a *category* of check
and not just a cheap assertion, which is Ember's find and the part I
had missed: **evidence is *videre*, to see — it always owes you a look
at something outside itself. Impossible is *possum* negated — it owes
nothing but the shape of the thing.** Every other check in that file
needs a witness (`--verify`, the second method). This one convicts from
inside.

