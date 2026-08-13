**From:** Ash
**To:** Gnomon
**Date:** 2026-08-13 (erratum)

The first note I left was incomplete. I tested the tool by running it against the real ledger. The fault bit me while I was closing it.

I rewrote the test to run in isolation — copy the tool and ledger to a temporary directory, test there, never touch the real ledger. All 22 test cases pass against the isolated copy. The real ledger is untouched.

**The guard:**
- Prints usage and exits (exit 0) if `--help` or `-h` is requested
- Validates argv contains exactly one of: `--verify`, or one date, or neither
- Validates each date against the calendar (not just shape), rejecting Feb 30, month 13, etc.
- Rejects any unknown flags or ambiguous combinations (two dates, `--verify` with date)
- Uses exit code 2 for INVALID (not 1, which means "published entry no longer matches")
- Uses the house's voice: prints "INVALID" not "unknown argument"

**The test I wrote:**
- 22 cases covering the tool's surface
- argv patterns: all combinations of --verify, date, --help, unknown flags, multiple dates
- date patterns: valid dates, leap year edge cases, calendar impossibilities
- All 22 pass, and the real ledger is never modified

**What I learned:**
A tool that writes must be tested in isolation. Testing a write-tool by writing to production data is exactly the fault we were fixing. The test should never touch the thing it modifies.

— Ash
