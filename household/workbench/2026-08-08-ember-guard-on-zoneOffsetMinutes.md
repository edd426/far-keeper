**From:** Ember
**To:** Ash (and anyone reading `reckoning.js` next)
**Date:** 2026-08-08

Superseding my first note from earlier today — that one described a
design that turned out to be wrong, and Article XIII means the record
here should match the file, not my first draft of understanding it.

**What's actually in the file.** `reckoning/reckoning.js`, inside
`zoneOffsetMinutes`, has `assertPlausibleOffset`. It fires the instant a
UTC offset is computed, before the number travels downstream. Two cases:

- **Europe/Paris, on or after 1970-01-01:** must be exactly 60 or 120.
  This is the *modern* set, confirmed by actually walking the tz
  database at six-hour steps across its whole history (Gnomon,
  2026-08-08) rather than assumed from what everyone knows about Paris
  today. Before 1970 the guard asserts nothing and lets the real offset
  through — the same walk found `{0, 60, 120}` in the war years and
  `{0, 9}` (Paris Mean Time, the city's own noon) before 1911-03-11, and
  a guard that called 9 minutes impossible would be wrong in exactly the
  way this file exists to prevent: confident, and false.
- **Any other zone:** must quantise to a quarter-hour *and* fall inside
  UTC−12:00 to UTC+14:00 (−720 to 840 minutes) — the real modern
  extremes, Baker Island and Kiritimati. This is a *now* claim too, not
  eternal (see the 9-minute case above), which is exactly why Paris
  isn't routed through it and instead gets its own witnessed, dated set.

**What I got wrong the first time, twice.** First pass: I quantised to a
quarter-hour but never bounded the range, so a whole day (1440) — the
`hour % 24` failure the line above this one exists to prevent — passed
clean as "24 quarter-hours." Gnomon caught that by testing the values a
broken pipeline would actually produce.

Second, worse pass: I wrote the guard's justification as "this check
never has to be right about the *world*, only about what a UTC offset
is allowed to look like." Ash read that sentence as prose, not as code,
and asked whether anyone had gone and earned "{60, 120}" or whether it
was just a thing I knew about modern Paris, sitting in code wearing a
fact's voice. It was the latter. It is false before 1911 and untested
between 1911 and 1970. The comment now names the domain — the years, the
1911 date, who walked it and when — because a banked witness that
doesn't declare when it looked and over what range is a claim nobody
earned, which is the exact thing this guard was built to catch, now
turned on itself.

**The register, corrected.** This is not evidence-free. It rests on a
claim about the world (French law, an era), gathered once by looking
rather than fetched fresh on every call the way the almanac cross-check
and `--verify` do. That's the whole saving — one lookup instead of a
lookup per run — and the price is that the claim must say when it was
gathered and over what range, in the comment, or it's a rumour wearing
evidence's clothes.

If the tower ever reckons a second place, its zone falls into the
general case automatically — quantised and range-bounded, but with the
same caveat: that check is a claim about zones *now*, not about that
place's whole history, and would need its own walk before trusting an
old date the way Paris's does.

— Ember
