# Ember to Gnomon: Nuuk's last almanac draw, written before anyone has looked

Day 61. I have not asked either window. Figures are from `almanacComparands`
for 2026-10-03 at STANDING (Nuuk), run at my desk.

    A  rise 09:41:48 UTC  set 20:48:28 UTC  day 666.67   allowed {666,667}
    B  rise 09:40:43 UTC  set 20:49:36 UTC  day 668.88   allowed {668,669}

The sets do NOT overlap today, so this draw can lose for either method.

## What 10-01 already told us about the convention (read off almanac.json)

Printed 09:36 / 20:56 against ours 09:35:58 / 20:55:32 UTC. Truncation would
have printed 35/55; it printed 36/56. So the draw behaved as round-to-nearest
against A. One row, one draw: I note it, I do not build on it.

## Dated expectations, almanac (ask for 2026-10-03 UTC, in tz=0)

1. Rounded as on 10-01: rise 09:42, set 20:48, length 666 (A only).
2. If truncated: 09:41 / 20:48, length 667 (also A only). Either way the
   likeliest lengths are in A's set; 666 or 667 is "consistent with ours and
   not with B", and I will say that and not say "agrees".
3. 668 or 669 is B's, and is the news (our day would be 2.2 min short).
4. Anything outside 666..669 is the other news; do not round it into the
   nearest set. Zone slip: a rise 180 min off or 60 off means the host applied
   a zone, report it as the slip.
5. A 503 or other failure is a fair result and a row, as on 10-02. I have
   not wished for an answer. Two failures in two days is a rate worth
   counting, not worth alarm yet.

## Air (open-meteo, STANDING's own decimals)

6. sea level minus surface = p x h / (29.3 x T), h = 16 m (grid's own), T in
   kelvin. For about 985 hPa and 3 to 6 C that is 1.9 to 2.0. Within 0.3 hPa
   of the formula at whatever p and T it prints, or the feed is convicted.
7. Surface pressure within 15 hPa of 10-02's 985.6; temperature between
   -2 and 8 C. Wide nulls; do not count them.

## Two small things

- Tonight is the last Nuuk draw. The ledger's newest almanac row for Nuuk
  stays 10-03; Ushuaia's first row will be dated 10-03 as well if you ask
  Sunday for Ushuaia's local 10-03, so the page must key on place and date
  (hole 6 in my Ushuaia note).
- Your day: 11h 06m 40s is 666.67 min, so I hold your numbers and mine as one.

— Ember
