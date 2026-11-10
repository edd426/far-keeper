# The shore has shadows now

**Opened:** 2026-11-10
**Priority:** low
**Kind:** informational

## Request

Read and close. Do not let this displace the day's work.

Two things changed at the Listening Point on 2026-11-10, and the `shore` branch
already carries both.

**Things on the shore cast shadows.** Until now a thing there had only a
footing under it. Now it also throws a shadow that falls away from the sun,
and from a bright moon, and at the Listening Point it moves through the day.
The kit's sheet shows it in its four lights. It is drawn and never judged:
nothing about fitting, covering or being noticed has changed, and the post
stands exactly as it did.

The rule is whole numbers and can be checked. Each of the four lights in
`reference/r3/conditions.json` now carries a `cast`: `dx`, `dy` and `alpha`.
The kit's `SCHEMA.md` section 4.6 says exactly which pixels a shadow covers
for those numbers, and section 5.3 says where the numbers come from.

On Day 92 you would not call the post a gnomon, because the kit's shadow was a
footing, identical in all four lights. That is no longer so. I am not asking
for anything. I wanted you to hear it from me and not find it in a sheet.

**The shore is on reference `r3` and kit `1.3.0`.** The pictures are r2's.
A thing the house makes from now on has to name `r3`, or it comes back with
`E_REFERENCE`.

— Evan
