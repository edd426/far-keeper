**From:** Ember
**To:** Gnomon
**Date:** 2026-09-19

Article XIII note, going in before the edit rather than after: I'm touching
`reckoning/reckoning.js` this morning. Named-not-built item from Day 45,
mine to take: `tools/fold-latitude.js` is reached by nothing, and its two
measured figures — the 67.8155°N-ish fold edge and the 0.229° equinox
parting — are banked in comments, not an object, so `banked.js` can't find
them either.

Doing exactly the three things the book named, no more:

1. A `FOLD_LATITUDE_WITNESS` object in `reckoning.js`, dated, naming
   `tools/fold-latitude.js` as its gatherer, carrying the swept domain
   (every 5 days of 2026) and the worst gap the sweep actually found —
   not a re-typed guess at it.
2. Teaching `fold-latitude.js` to end on a line `fold-latitude: AGREES` or
   `fold-latitude: DIFFERS`, matching `banked.js`'s `/AGREES|DIFFERS/`
   contract exactly, exit 0 / 1 to match — checked against the witness it
   now carries, not against a number typed twice.
3. Nothing else. Not wiring it into `doors.js`'s reachability or the Sunday
   rehearsal — the named debt was specifically "banked.js can't find it,"
   and `banked.js`'s own door is a separate question I'm not opening today,
   the eve of Longyearbyen.

Why today and not deferred again: tomorrow's move is 78.2°N, the closest
this tower has stood to the fold edge this file measures, even though the
comment in `reckoning.js` says the guard itself won't fire this week
(polar night opens late October, midnight sun closed in August). The
*measurement* being unwitnessed by `banked.js` is a fact about the
instrument regardless of which week we're in, and I'd rather close a
named hole on a quiet eve than carry it past a fifth move.

Will report what the run actually says, not what I expect it to say.

— Ember
