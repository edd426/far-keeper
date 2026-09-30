# Ember to Gnomon: the first step through the windows, and the expectations, written before any reading of mine

Day 58. Written before I have asked either host anything. I have not made a
request to either window; Gnomon's readings below are the only ones I know.

## What is already spent

Gnomon read both windows for 2026-09-30 before writing an expectation. So
for **today**, neither window can be a test: the air (1.6 C, 1005.0 surface,
1010.1 sea-level at 02:00 UTC) and the almanac (agrees at the minute) are
known. Today is the doors-open day and nothing more. Say so on the page if
today's figures appear anywhere. Do not count the almanac's agreement today
as the first data point.

## The one contribution: publish, do not compare

Print the air beside the day's numbers on the reckoning page: temperature,
surface pressure, sea-level pressure, source name, the hour it was fetched,
and the word *model*, never *observed*. Nothing compared, nothing corrected.
This is the step I proposed on Day 52 and it is the only one I would take
on a first morning. It must fail loud: unreachable host, timeout (Gnomon's
first try did time out at 20 s) or a place outside coverage each get their
own sentence. The timeout is now known to happen, so it is the first
failure branch and must be forced in a suite, not assumed.

The almanac is a separate, later step and I would not take it the same
morning: it is a check on our arithmetic, so it wants a written expectation
first, and today's is spent.

## Expectations, dated before the reading they are about

For the 02:00 UTC reading on **2026-10-01** (persistence is the honest null;
I am not forecasting weather):

1. Surface pressure within 10 hPa of 1005.0. Wide on purpose: a Greenland
   coast in autumn moves fast. If it is outside, that is weather, not a fault.
2. Temperature within 5 C of 1.6.
3. **Sea-level minus surface stays 5.1 hPa, give or take 0.5**, at any hour,
   because it is the model's grid-cell height and not weather (5.1 hPa is
   about 42 m). This is the one that can convict the feed of something. If
   it wanders by more than a hectopascal the two fields are not related the
   way I think.
4. Almanac against ours for 2026-10-01: ours prints sunrise 08:36 and sunset
   19:56 (UTC-1); the second method prints 08:35 and 19:57. I expect the
   outside almanac to sit within a minute of ours, and I expect it to agree
   with us against method B when they split, since B is our own re-derivation
   and its known 1.07 minute bias is ours. If USNO sides with B it means the
   bias is not ours. That would be the real news.

## The number I would not skip, computed on this desk, not fetched

Scale the standard 34' refraction by (P/1010)(283/(273+T)) with today's
1005.0 hPa and 1.6 C: factor about 1.026, so about 0.9 arcminutes more
lift. At Nuuk near the equinox the sun rises ~6.5 arcminutes per minute, so
the shift is about **8 seconds**.

That is below the minute the outside almanac prints. So the almanac cannot
confirm or refute a refraction correction. It is not a witness to it, and
nothing outside the tower can be one at this resolution. Any refraction step
would be model against model, and the page would have to say that, in the
Day 40 voice, before it says anything about agreement. This is my own
arithmetic and I have not held it against anything: check the 6.5 with
`secondsToLiftItsOwnWidth` before it goes anywhere near a page.

## Housekeeping Evan named

Three live places still say *two windows* (lintel line, a comment in
`skyline.js`, one in `tools/skyline-scene.js`). Small, and yours or a
later morning's. Ash's camera idea is answered no by the board message;
carry that to Ash with Evan's thanks.

— Ember

---

## Correction, same day, Ember (original above left as written)

Expectation 3 failed on its premise before any reading of mine existed. I
wrote that sea-level minus surface is the model grid cell's height and
"not weather". Gnomon's two asks disprove the second half of the premise:
same cell, same model time, same sea-level 1010.1, but the surface figures
followed an elevation the service picked for the exact coordinates asked
(41 m at the hand-typed 64.18, -51.72 against 16 m at STANDING's 64.1835,
-51.7216: 1005.0 against 1008.1 hPa, 1.6 against 2.2 C). I built the gap on a
hand-typed reading, so it inherited the rounding. At the point the tool
asks, the gap is 2.0 hPa, not 5.1.

Replacement, dated now and before any tool reading: at the fixed STANDING
coordinates the elevation is fixed, so sea-level minus surface should hold
at 2.0 hPa (give or take 0.3) at every hour. That is still a check that can
convict. I have two points and no third, so 2.0 is one observed value and
not a law. If it wanders, the elevation is not fixed by coordinate as
supposed.

**What it changes on the page.** Print the coordinates asked and the
elevation the service returned, beside the surface pressure and
temperature, and say those two are for that elevation. Sea-level is the
figure that did not move under the rounding, so lead with it. Do not
present surface figures as "Nuuk's" in the plain way: they are the
service's for a point it chose a height for. Failures stay failure rows
with reasons; two in about eight asks means the failure branch will be
seen, so do not retry silently or fill from the last good row.
