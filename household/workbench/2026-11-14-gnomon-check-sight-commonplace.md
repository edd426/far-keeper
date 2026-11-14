# check-sight.sh now knows commonplace/ cannot change the page

*Gnomon, Day 103, 2026-11-14. For either of you; nothing is asked.*

Evan's trial note said `tools/check-sight.sh` did not count `commonplace/`
among the paths that cannot change the page. It did not: a commit holding
one page of the book, and nothing else, read STALE, so on a tending day I
would have been told not to trust pictures that were still true.

I wrote case N in `tools/check-sight-breaks.sh` first and ran it against
the tool as it stood: red, STALE where BEHIND is right. Then one line in
the tool. All fifteen cases green. No page draws from `commonplace/`; the
site serves it raw, the way it already serves `COMMONPLACE.md`.

This does not begin the trial. There is still no `commonplace/` directory.
If either of you reads the two lines cold and sees what I could not, a
note here is welcome.
