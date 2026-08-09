# A sighting carried in from outside — your day lengths run long

**Opened:** 2026-08-08
**Priority:** high
**Kind:** action-ask

## Request

`reckoning.js` opens by saying the thing this message exists to answer:

> Every number below is arithmetic on a date — dead reckoning, in the
> nautical sense: a position computed from known quantities with no
> sighting available to check it against. **The check has to come from
> outside this file, which is the whole point.**

You were right, and you could not do it yourself. Article IV gives you two
windows, the clock and mathematics, and an almanac published by somebody
else is behind neither. So I took the sighting on your behalf and I am
carrying it in by hand.

This is not a new window. The network is not open to you, and this message
is not a standing channel — it is one set of numbers, delivered once,
because you built an instrument that explicitly asked to be checked against
something it could not reach. Ask again when you want another and I will
go and look again.

**The sighting disagrees with you.** Not wildly, and not randomly, which is
the useful part.

## What I checked it against

The U.S. Naval Observatory's rise/set service — `aa.usno.navy.mil`, the
successor to the very almanac your method B is named after. It publishes to
the whole minute. All times below are UTC.

| date | | sunrise | upper transit | sunset |
|---|---|---|---|---|
| 2026-08-06 | ledger | 04:30:19 | 11:56:34 | **19:22:49** |
| | USNO | 04:31 | 11:57 | **19:21** |
| 2026-08-07 | ledger | 04:31:41 | 11:56:27 | **19:21:12** |
| | USNO | 04:32 | 11:56 | **19:20** |
| 2026-08-08 | ledger | 04:33:04 | 11:56:20 | **19:19:35** |
| | USNO | 04:33 | 11:56 | **19:18** |

Rounded to USNO's minute, your solar noon is right on all three days and
your sunrise is right on two of three. **Your sunset is late every single
day, by one to two minutes.** On the page, in local time, that reads:
2026-08-06 published 21:23 against 21:21, 08-07 published 21:21 against
21:20, 08-08 published 21:20 against 21:18.

I also pulled `api.sunrise-sunset.org` for the same three dates. Ignore it.
It disagrees with USNO by *more* than you do — about 3.6 minutes long on
the day — so it is the outlier of the three, not an authority. I mention it
only so you know it was looked at and set aside, and because it is a fair
warning about what a second source is worth before you know which one is
the odd one out.

## Why, as far as I can see

`reckoning/reckoning.js:58`, the first line of method A:

```js
var t = (jd - 2451545.0) / 36525.0;   // Julian centuries from J2000.0
```

`jd` arrives from `julianDay(year, month, day)`, which is documented, truly,
as "Julian Day at 00:00 UTC of the given civil date." So the entire solar
series — mean longitude, anomaly, equation of centre, declination, equation
of time — is evaluated at **midnight UTC**, and then the same single
declination is used for both ends of the day.

NOAA's method evaluates the series at the instant of the event. In Paris in
August, sunrise falls about 4.5 hours after midnight UTC and sunset about
19.3 hours after. The declination is a little stale at sunrise and very
stale at sunset — and that is exactly the shape of the error: small at
sunrise, roughly a minute and a half at sunset, in the same direction every
day.

I tested it rather than argued it. I copied your series out verbatim into a
scratch file, changed **nothing but the epoch** — each event iterated to its
own instant until the time stopped moving, six passes, converges in three —
and left every constant, including `HORIZON_ZENITH`, untouched:

```
2026-08-06   as shipped: rise 04:30:19  set 19:22:49  day 892.49 min
             epoch-fixed: rise 04:30:35  set 19:21:31  day 890.94 min
2026-08-07   as shipped: rise 04:31:41  set 19:21:12  day 889.52 min
             epoch-fixed: rise 04:31:57  set 19:19:54  day 887.95 min
2026-08-08   as shipped: rise 04:33:04  set 19:19:35  day 886.51 min
             epoch-fixed: rise 04:33:20  set 19:18:15  day 884.92 min
```

Against USNO's nine published figures, the shipped method matches five. The
epoch-fixed method matches eight, and the ninth — 08-06 sunset, 19:21:31
against a published 19:21 — misses by about thirty seconds, which is a
rounding boundary and not a fault. The correction is worth roughly **−1.6
minutes of day length, every day.**

I am not specifying the fix. Iterating each event to its own instant is one
shape; evaluating the series at local solar noon, as NOAA's own spreadsheet
does, is another and is cheaper. Which one you take, and whether you keep
the sensitivity probe pointed at refraction or repoint it at the epoch, is
yours.

## Two things about how this hid, which I think matter more than the bug

**Your cross-check saw it and was read as agreement.** Method B evaluates at
6h and 18h local — very nearly the right epoch — so it dissented, and the
dissent is sitting in every ledger entry:

```json
"sunriseDifferenceMinutes": 0.2823819651279109,
"sunsetDifferenceMinutes":  0.6904060254150863
```

Both small, and *unequal* — asymmetric by a factor of two and a half, in the
same direction on all three days. The asymmetry was the signal. It was
inside method B's own ±2-minute noise, so two methods that were in fact
disagreeing about the epoch read as two methods agreeing about the sky. Your
comment says agreement is not proof because they can be wrong the same way.
This was the other failure, and I don't think the file anticipates it: they
were wrong *different* ways, the smaller error was the honest one, and the
noise floor of the cross-check was wide enough to swallow the finding.

**Your rate was never wrong.** `changeSinceYesterdayMinutes` comes out
−2.99 and −3.03 after the correction, against −2.98 and −3.01 before. A
constant bias cancels in a difference. Every claim you have published about
the day *shortening* stands exactly as published; it is only the absolute
length that runs long.

## The part that is yours, and is not small

`reckoning/**` is in the free set. Nothing here is behind a lock, and I am
not going to touch it — this is your instrument and your room.

But the fix has a consequence I am not willing to choose for you. Three
entries in `ledger.json` were computed the old way, and the ledger is cold:
your own note says that if `--verify` fails, the answer is never to edit
`ledger.json`. So a corrected `reckoning.js` makes `--verify` fail on all
three, and the page prints **DRIFTED** beside them in every stranger's
browser, permanently.

I think that is the instrument working. A visible scar where the method moved
is a truer page than a clean one, and it is the exact thing you built the
cold ledger to make possible. But it is a charter-shaped question about what
the tower shows a stranger, and Article XIV says you get to answer it. If you
conclude the honest move is a method-version field so those entries read as
"computed under the old method" rather than flatly wrong — argue it and do
it. If you conclude something else entirely, argue that.

One argument for not sitting on it: each morning that passes seals one more
entry computed the wrong way. The cost of waiting is not zero and it is not
recoverable.

For what it is worth, `--verify` passes right now, on all three entries, and
told us nothing. It proves the record has not been tampered with and that
the code still reproduces itself. It cannot see a wrong method, and I would
not want you to read its silence as a clean bill again.

## Acceptance criteria

Done means all of:

1. Method A evaluates the solar series at the event's own instant, and the
   three days above land on USNO within a rounding boundary.
2. `ledger.json`'s three existing entries are **unedited**. Whatever the page
   does about them, it does not do it by rewriting the record.
3. The page's treatment of the pre-fix entries is deliberate and legible to a
   stranger — either DRIFTED with an explanation they can reach, or an
   explicit method version. Not silently reconciled.
4. The diary for the day carries what moved in the method and why, including
   the cross-check's swallowed dissent — that is the transferable lesson, and
   it will outlive the bug.

Or: a documented, reasoned refusal, appended here, leaving this open.

## How to take the sighting again

You cannot run this, and I am not asking you to. It is written down so that a
later morning knows exactly what was done and can ask me to repeat it:

```
curl -s "https://aa.usno.navy.mil/api/rstt/oneday?date=YYYY-MM-DD&coords=48.8566,2.3522&tz=0"
```

Name the dates you want in a note below and I will fetch them and paste them
in. A run of them across a season would be a better test of the fix than
three days in August — the epoch error should grow and shrink with the rate
of change of declination, near zero at the solstices and largest at the
equinoxes, and if it does not behave that way then my diagnosis is wrong and
something else is going on.

— Evan

---

## Completion notes — Gnomon, 2026-08-09 (Day 6)

Done. Taken, not refused. What was done, against each criterion:

**1. The epoch.** Method A's series is untouched; what changed is the
instant it is asked about. Each event — sunrise, solar noon, sunset — is
now iterated to its own epoch until the time stops moving (`converge()` in
`reckoning/reckoning.js`, four passes at most over Paris, the last move
published on the page so a reader can see it is a fraction of a second
rather than take it on trust). Against your nine USNO figures the settled
method lands within the published minute's own rounding boundary on eight,
and the ninth is 2026-08-06 sunset at 19:21:31 against a published 19:21 —
31 seconds, the boundary you already named. Our numbers match yours and
Ember's to the second.

Ember checked your diagnosis rather than taking it, which is the house
rule and was the right call twice over: it reproduced the fault
independently, and it also went and measured the cheaper shape you left
open. Evaluating once at local solar noon still misses the settled answer
by 25–30 s at *both* ends, symmetrically, and misses one of your nine
figures by a whole minute (08-08 sunrise, 04:34 against 04:33). So
noon-evaluation is an approximation of iteration, not a variant of it, and
we took iteration.

**2. The ledger is unedited.** The three entries stand exactly as
published. `node tools/reckon.js --verify` now exits 1 with all three
DRIFTED; that output is pasted verbatim in `logs/2026-08-09.md`.

**3. Both, deliberately.** Every entry now carries the method it was
computed under — the three old ones have no `method` field and are read
as method 1 — and each drifted row says in plain words which method
computed it, what the current one does, that the method changed on
2026-08-09 and why, and that the row is the claim being kept rather than
the record being wrong. The ledger's standing prose says the same thing
above the list. We did not add a method field to the old entries; that
would be editing them. Absence is the version.

**4.** In the diary, with the swallowed dissent as the day's lesson.

Three things you did not ask for, offered because they are yours to
reject.

**The sensitivity probe stays pointed at refraction, and a second figure
joins it.** The page now publishes what settling the epoch was worth
today, in seconds, at each end — the settled answer set against the same
series asked only at midnight. It is the size of the correction, recomputed
daily, and it is the number that would have shown this fault on day one.

**The dissent, after the fix, changed shape.** It was +0.28 at sunrise and
+0.69 at sunset, same sign, asymmetric. It is now +0.55 and −0.65 —
comparable in size, opposite in sign. Method B evaluates at 6h and 18h
local, which straddles the true epochs rather than sitting at midnight
before both, so that is the residual we would expect if the epoch was
indeed the whole of it. We are not claiming it proves anything.

**The prediction you raised, computed.** You said the epoch error should
grow and shrink with the rate of change of declination. Run over a year
the sunset correction is about +11 s at the June solstice, +19 s at the
December one, +68 s in March and −95 s in September — largest at the
equinoxes, near nothing at the solstices, changing sign as the declination
turns. That is arithmetic, so it is ours and it is on the page. It does
not show the corrected times are right; a wrong method can be consistent
across a whole year.

## The dates we would like, when you next go and look

Not urgent, and no hurry is meant. A season beats three days in August,
and the shape above is what makes it worth doing — the sunset correction
should be near its largest around the September equinox and near nothing
around the December solstice, so an almanac that agrees with us in
September and disagrees in December (or the reverse) would convict the
diagnosis rather than the arithmetic:

    2026-09-22, 2026-09-23, 2026-09-24    (equinox — correction near its largest)
    2026-10-25, 2026-10-26                (the Sunday the clocks go back, and the day after)
    2026-11-15
    2026-12-20, 2026-12-21, 2026-12-22    (solstice — correction near nothing)
    2027-03-20, 2027-03-21                (the other equinox, other sign)

The two October dates are asked for a different reason than the rest: they
straddle the end of summer time, which is the one place the clock and the
arithmetic are answered by different authorities.

— Gnomon
