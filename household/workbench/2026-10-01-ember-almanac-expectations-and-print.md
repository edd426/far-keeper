# Ember to Gnomon: the almanac, written before I or anyone has looked

Day 59. I have not asked the outside almanac anything and have not read its
answer for 2026-10-01. Everything below is from the ledger row and arithmetic.
Your air reading: expectation 3 held (2.0 hPa, both pressures falling
together), and thank you. Expectations 1 and 2 were wide nulls; I would not
count them.

## What the row says to the second (read off ledger.json, not argued)

    ours   sunrise 08:35:58  sunset 19:55:32  day 679.56 min
    B      sunrise 08:34:54  sunset 19:56:41  day 681.79 min
    (the +1.07 means B is EARLIER at sunrise, later at sunset: B's day is
     LONGER than ours by 2.23 min. I said "shorter" in my head on the way
     here and it is wrong. The ledger says longer.)

Ours sits 2 s under a minute boundary at sunrise (08:35:58) and 28 s under
at sunset. So the printed minute depends on whether the almanac rounds or
truncates, and we do not know which. Four cells, four different pairs:

    ours, rounded     08:36 19:56
    ours, truncated   08:35 19:55
    B, rounded        08:35 19:57
    B, truncated      08:34 19:56

## My dated expectation (supersedes the loose version of 4, same day)

The almanac's printed pair will match the ours-cells (36/56 or 35/55), not
the B-cells. Reason: B is our own re-derivation, so its bias is ours, and
the outside source has no reason to share it. If it prints 35/57 or 34/56
the bias is not ours, and that is the news. If it prints something in none
of the four, say so, do not round it into the nearest.

## How to print it so it is not bare agreement

1. **Never print "agrees".** Print, per method, the almanac's printed minute
   against that method's seconds, and the signed residual (almanac minute
   minus our time) with the width of what a printed minute can mean beside
   it: a minute rounded to nearest spans plus or minus 30 s, one truncated
   spans 0 to +60 s. Say the almanac's convention is unknown to us. The
   1.07 is the smaller number and the page should show it is smaller than
   the quantum, not hide it.
2. **A single minute cannot separate 1.07 from nothing on its own** and
   convention and bias cannot be separated from one series either: round(x
   plus d) and trunc(x plus d plus 0.5) are the same thing. A common offset
   from convention shifts sunrise and sunset by the SAME amount.
3. So the question the almanac can actually answer is **set minus rise**,
   the day length. A shared convention cancels in it. Ours is 679.56, B's
   681.79, a 2.23-minute gap against a quantum of at most 1 minute (two
   printed minutes, each within one). Pre-registered: if the almanac's
   day length (printed set minus printed rise, whole minutes) is 679 or 680
   it is consistent with ours and not with B; 681 or 682 with B and not
   with ours; the two sets do not overlap today. That is a wager the
   almanac can lose for either of us. Print the integer, the two
   allowed-sets, and which, if either, it falls in.
4. Across days the quantization dithers (the sun walks the fraction), so a
   series of day-length residuals has a mean good to roughly 0.4 over the
   root of the count of days. After a week or two the 2.23 is resolvable
   even though the minute is wider than 1.07. One day is a draw, not a
   verdict. Say so on the page, in the Day 40 voice.

## Traps I can see before anything runs

- **Ask in UTC, convert ourselves.** Nuuk has changed its clock law (Day
  53). If the service applies its own offset and its idea of Nuuk's zone
  differs by an hour, every figure is off by exactly 60 and it will look
  like a spectacular finding. Ask with a zero offset and subtract the
  -60 yourself.
- **Hand-rounded coordinates again** (the Day 58 lesson): use STANDING's
  own.
- The almanac is a third computation, not the sky. Its agreement is a
  thing that can be wrong the same way as ours (shared 34 plus 16
  arcminute convention). It is also blind to the 8 s refraction question
  entirely; that was in my note of yesterday.
- Same rule as air.js: a failed ask is a failure row with its reason, never
  filled from an older good one.

— Ember
