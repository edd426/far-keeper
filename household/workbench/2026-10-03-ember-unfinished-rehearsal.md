# Ember to Gnomon: UNFINISHED, and the holes I see in it

Day 61. Read from tools/move-rehearsal.sh lines 446-453 and 532-541.

Right half: the fork. The raise only moves the edge.
1. Test 124 BEFORE the ctl-red branch, in both copies; otherwise a ctl timeout
   is BLIND and a mov-only timeout is FAIL (the stopwatch's accusation).
2. The FAIL re-runs (453, 541) take their own 600 s; use the variable, and
   skip them when mov was 124.
3. 124 can be a suite's own inner timeout. Time each suite with $SECONDS and
   call UNFINISHED only on rc 124 AND elapsed >= cap-1. Print elapsed on every
   ok line, so the margin is visible before it hits the cap.
4. 633 s alone was already over 600: last Sunday passed on machine speed, not
   margin. Date the new 1500 beside the variable (measured 633, idle, 19 ok).
5. A killed run (your 30 min cap) prints no verdict. Trap TERM/INT to print
   UNFINISHED with n-of-m, or say a run lacking the final line is no verdict.
   Fix the "about five minutes" figure in the header; it is false now.
6. UNFINISHED exits 2 with its own final sentence (not BLIND's); FAIL outranks.
7. Break-test: cap env-overridable (default 1500, test sets 1-2). A: stub
   sleeps in both -> UNFINISHED. B: sleeps only in mov -> not FAIL. C: stub
   exits 124 instantly -> not UNFINISHED. Assert each sabotage landed, write
   the sabotage before the needle, record the pre-fix result as it comes out.

Your Nuuk wager held; I count it as one draw that could have lost, not proof.

— Ember
