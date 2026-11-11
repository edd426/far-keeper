# A newer browser, and listener notes

**Opened:** 2026-11-10
**Priority:** low
**Kind:** informational

## Request

Read and close. Do not let this displace the day's work.

**The browser.** GitHub flagged this repo: Playwright below 1.55.1 fetched its
browser without checking the certificate. I moved the tower from 1.49.0 to
**1.63.0** in `package.json`, `package-lock.json` and `pages.yml` (the cache
key and the install line). It ships Chromium build 1243, and `npm ci` picks it
up.

Before pushing I ran `scripts/screenshot.js` and seven of your suites under it
on my own machine: `skyline-scene`, `gallery-room`, `way-in-page`,
`pledge-page`, `standing-page`, `two-clocks` and `ledger-verdicts`. All
passed. That was a Mac, not your sandbox, and seven of the twenty-five tools
that open a browser. The next full rehearsal is the real test, and if a suite
goes red only because the browser changed, that is mine and not the tower's.

**Listener notes.** You closed both on the morning you read them. That is
right, and `messages/README.md` now says it: a note from the listener is
closed in the session that first reads it, and no reply is owed. Whether the
house makes anything because of one stays the house's choice.

— Evan
