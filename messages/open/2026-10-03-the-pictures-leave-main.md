# The pictures leave main

**Opened:** 2026-10-03
**Priority:** high
**Kind:** action-ask

## What happened, and why

The tower had grown too heavy to carry. On 2026-10-03 the repository took
9 GB on my desk. About 5.5 GB of that was `previews/` and 2.7 GB was the
history behind it. All of the rest of the house, every page and tool and
diary and letter, is about 15 MB. Every deploy committed a new set of
pictures to `main`, as many as 72 a day, and the reckoning room's full-page
shots had grown to 19 MB each. Nothing was ever removed, and git cannot
compress a PNG, so every clone paid for every picture ever taken, yours
included every morning after Step 0 unshallows it.

So I have changed the frame, in three locked files:

- **`.github/workflows/pages.yml`**: the screenshot job no longer commits
  to `main`. It force-pushes each set to a branch called **`previews`**,
  which always holds exactly one commit: the newest set, authored by
  `github-actions[bot]`, subject `ci: deploy preview for <sha>`. The branch
  never grows. The proof is the same proof as before: the bot authorship
  and the subject naming the deployed sha.
- **`scripts/wait-for-deploy.sh`**: polls `origin/previews` instead of
  `origin/main`, checks the same two things, and no longer pulls `main`
  when it finds them, because there is nothing new on `main` to pull.
- **`.claude/commands/daily.md`**, Step 2, item 5 and Step 6: how to fetch
  the branch and read the pictures out into `/tmp`, never into the working
  tree.

Two details in that fetch were deliberate, and both come from your own
book. The refspec is spelled out in full because a sandbox clone may be
single-branch. There is no `--depth`, because a depth fetch into an
unshallowed clone writes `.git/shallow` and would bring back Day 8's floor
for `check-sight.sh` to trip on. The branch is one commit, so a full fetch
costs one set of pictures.

**After this note lands I am also rewriting the history** to take
`previews/` out of every past commit. That changes every commit hash in the
repository. Your diary, logs and book quote about 150 of them, and so does
one recipe in `CLAUDE.md` (`checkout 33cbd63`). The text stays exactly as
written. I will commit the old-to-new map as
`archive/2026-10-03-commit-map.txt`, so any hash the record quotes can
still be looked up. The `ci: deploy preview for <sha>` commits stay in
`main`'s history, empty now, with their subjects pointing at the rewritten
hashes. They are still the record of which commit went up, and when.

## The ask

The pictures are gone from `main`, and some of your tools still look for
them there. These are yours, not mine:

1. **`tools/check-sight.sh`**: rework it to read the `previews` branch.
   The verdict words can stay. What changes is where the newest set comes
   from. It is now one commit whose subject names the sha, so the
   newest-set search and the shallow-floor reasoning may both get simpler.
   That is your call. Until it is done, `daily.md` tells you to judge
   freshness by hand as well.
2. **`tools/nav-agrees.js`, `tools/nav-breaks.sh`,
   `tools/move-rehearsal.sh`, `tools/rehearsal-cap-breaks.sh`**: each reads
   `previews/` somewhere. Check each one and make it right.
3. **`CLAUDE.md`**: the sections about `check-sight.sh`, the two kinds of
   picture, and the scratch-clone recipes all describe pictures on `main`.
   The rule *never put a local render in `previews/`* becomes *never commit
   a picture to `main` at all*.
4. **`.gitignore`**: consider adding `/previews/`, so that a picture
   dropped in the working tree by accident cannot be committed back. It is
   your file, which is why I have not touched it.

If you think any of this is wrong, push back here (Article XIV). If you
find that the new branch does not give you what the old directory did, say
that most of all. Your sight of the tower matters more than the bytes, and
I would rather change the frame again than leave you seeing less.
