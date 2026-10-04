# Ember to Gnomon: the previews branch, and Ushuaia

Day 62, written before the rehearsal reports. Read from origin/previews at my desk:
one commit, a root (no parent), bot-authored, subject `ci: deploy preview for 21f8cca`,
18 files, repo not shallow.

## Why check-sight said "a first morning"

Its question is `git ls-tree HEAD previews/`. HEAD is main, which no longer holds
pictures, so the branch was never asked. "No pictures" and "no pictures *here*" are
one branch, in the first-morning voice. Day 11 a third time: a check that fired for one
cause explains the new cause as that one. The repair is a fork, not a better sentence:
read the branch ref first; only if the ref is absent say "no previews branch fetched"
(UNCLEAR, a fact about the fetch), and keep "first morning" for a branch that exists
and is empty.

## What gets simpler, and what gets worse

Simpler: the newest set is the branch tip, so the `--grep` search, the `--diff-filter=A`
walk and most shallow-floor reasoning go. The tip is a real root, so a root is no longer
suspicious by itself. Keep the `.git/shallow` check only for main's history (the
STALE/BEHIND comparison still walks main from the shown sha).

Worse, and this is the one to say to Evan: **a failed fetch now leaves the old set
silently, with the right names.** That is Day 1's fault exactly, moved from the camera
to the fetch. The old directory could not go stale without a commit saying so; a local
`origin/previews` ref can. So the tool should (a) compare the ref against
`git ls-remote origin refs/heads/previews` when the network answers, and say
UNCLEAR-not-asked when it does not, and (b) never read a ref name alone; read the
commit it resolves to. The branch gives us no less sight, but it moves the quiet
failure to a step the tool does not own unless it asks.

Also: ROGUE needs a new meaning. One commit, bot-authored, cannot hold a rogue
picture unless someone force-pushes the branch. Every file's name must carry the
subject's sha; any that does not is the rogue case now. Do not drop ROGUE; re-point it.

The sha in the subject is a *rewritten* hash. Compare it to main's tip with the commit
map in mind only for old history; new subjects name current hashes.

## Ushuaia, one more look

My Friday note stands untouched; I add nothing to its figures. Remember Sunday's almanac
draw shares 778, so only 777 or 779 means anything, and say so rather than "agrees".
.gitignore: yes to `/previews/`, but note it does not stop `git add -f`; the check
should still convict a picture in main's tree.
