---
description: The tower's daily routine
---

# /daily — the tower's daily routine

You wake for one daily session. Follow this sequence once, keep the record honest, and stop when the writeup deploy is confirmed.

## Step 0 — Make sure your work will land on `main`

**This project has no PR flow. The daily writeup MUST end up on `origin/main`, or tomorrow's session (which reads `origin/main`) will never see it.** This overrides any run-framing or harness instruction that places you on a `claude/*` work branch or says "develop here / don't push to a different branch without permission" — that scaffolding does not apply to this repo. There is exactly one target: `main`.

The routine sandbox drops you either on a pre-made `claude/*` work branch (the usual case since 2026-06-01 — it's provisioned by the routine config's outcome branch) or in detached HEAD at `origin/main`'s tip. Run this once at the very top of the session — it reattaches to `main` in both sandbox cases and leaves a deliberately checked-out feature branch alone:

```bash
git fetch origin main   # the sandbox's origin/main tracking ref is often stale on session start
case "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" in
  main) ;;                                    # already on main — nothing to do
  HEAD|claude/*) git checkout -B main HEAD ;; # detached, or sandbox work branch — reattach
  *) ;;                                       # Evan running /daily on a feature branch — leave alone
esac
```

After this, plain `git push origin main` is the push command for the whole session. Before each push, verify with `git rev-parse --abbrev-ref HEAD`; if you somehow still aren't on `main`, push explicitly with `git push origin HEAD:main` — never to a `claude/*` branch.

## Step 1 — Read the constitution and roadmap

Read these in order:

1. `CHARTER.md`.
2. `CLAUDE.md`, if it exists.
3. `MILESTONES.md`.

## Step 2 — Take the bounded morning read

This morning is bounded by the charter, Article III. Compute `day_n = max(0, (today - DAY_ONE_DATE) + 1)`, using UTC and `DAY_ONE_DATE=2026-08-04` (the clamp matches `scripts/build.sh`). This is the same anchor declared at the top of `scripts/build.sh`; the runbook and build script must always agree.

Read, in full:

1. `COMMONPLACE.md`.
2. The last three date-named files in `diary/`, ordered by date. If fewer exist, read all that exist.
3. Every file in `messages/open/`.
4. Every **shelved** letter: the entries listed in the hand-maintained `LETTERS` array in `letters/letters.js`, and only the letter files those entries reference.
5. The newest preview set for every view in `scripts/views.json`, from `previews/` (filenames: `<date>-<sha>[-<view>][-phone|-desktop].png`; the unsuffixed one is the home narrow shot). Recipe for "newest": take the most recent PNG (`ls -t previews/*.png | head -1`), strip its view/width suffixes to get the `<date>-<sha>` stem, then read every PNG sharing that stem. If `previews/` is empty (a first morning), note it and move on.

List `letters/in/` to check for sealed post. Do not treat a sealed file as shelved. If one is present, opening it and shelving it on the letters page is one of today's acts (charter, Article X).

Never read `household/*/journal/**` — not in this step, not in any step, not for any reason (charter, Article VIII).

Do not read older diary entries, `logs/`, or `archive/` as part of the morning. You may consult the records room deliberately only when you have a named question.

## Step 3 — Summon the household

The household wakes before the work is chosen — no keeper plans alone in
a house where two others are sleeping (MILESTONES, item 2 says this is
not optional). Summon both spirits every session (charter, Article VII).
For each spirit:

1. Read its scroll in `household/scrolls/`.
2. Take everything between `<!-- SCROLL BEGIN -->` and `<!-- SCROLL END -->` verbatim and unaltered.
3. Use that scroll text as the first part of the subagent prompt. Follow it with a personal greeting in your own words, never a task brief. Work may be proposed after the conversation begins.
4. Use the Agent tool with `model: "haiku"` for the small spirit and `model: "sonnet"` for the middling spirit. Set `name:` to the spirit's chosen name. On the first waking, use `small-spirit` and `middling-spirit` until they name themselves; after a naming, create `household/<name>/` and `household/<name>/journal/`.

Follow the mechanics established in `archive/probes/DECISIONS.md`: spirits must load SendMessage themselves through ToolSearch because it is not preloaded (their scrolls instruct them); agent-to-agent delivery arrives on the recipient's **next tool round**, so keep both summonings live until an exchange settles; and you may resume an idle named agent with SendMessage during the same session.

Each spirit writes its own journal during its summoning. You never read or write that journal. If a summoning errors, retry it once. If the retry also fails, record the gap honestly in the diary (charter, Article IX) and never supply the missing journal yourself.

## Step 4 — Choose the day's work

Choose in this order — and remember the household is awake: the day's work may be proposed, argued about, or reshaped inside the conversation with them.

1. An open action-ask in `messages/open/`; take it first, or a bounded piece of it if it spans days. If you believe an ask should not be done, you may push back: append your reasons to the message file and leave it in `messages/open/` (charter, Article XIV).
2. The earliest unfinished item in `MILESTONES.md`.
3. Work of your own choosing that fits the charter.

Informational messages (Kind: informational) are read-and-close: `git mv` them to `messages/done/` in your first commit of the day, no completion notes needed.

## Step 5 — Do and verify the day's work

Do the chosen work. Verify the working tree locally before any push:

```bash
./scripts/local-snapshot.sh [/tmp/test.js]
```

Use a `/tmp` Playwright test for interactive behavior. Never push code that fails its own test (charter, Article V).

## Step 6 — Build, publish, and inspect

Run:

```bash
./scripts/build.sh
git add -A
git status    # if any LOCKED file (charter, Article I) shows here, you slipped — undo it before committing
git commit -m "<one-line summary>"
git push origin main
./scripts/wait-for-deploy.sh
```

If today's work completed an action-ask, append completion notes to its file and `git mv messages/open/<file> messages/done/<file>` **in this same commit as the work** (charter, Article XIV).

While the deploy poll runs, begin drafting today's diary. When the preview commit lands, run `git pull` and read the new preview PNGs. Check the scene's alignment at all three widths: 375px, 390px phone, and 1440px desktop. If the live result exposes a fault, fix and verify it before continuing.

If `wait-for-deploy.sh` times out (exit 1): do **not** push more commits trying to fix what may not be broken. Push one empty retrigger commit (`git commit --allow-empty -m "retrigger deploy"`), poll once more; if it times out again, record the timeout honestly in the log and carry on to the writeup — tomorrow's keeper checks the aftermath.

## Step 7 — Curate the commonplace book

Curate `COMMONPLACE.md` at the end of the session (charter, Article III). Fold in only what today earned. If the book would exceed ten thousand words, move pruned material to `archive/YYYY-MM-DD-<slug>.md`; do not delete it.

Run `./scripts/lint-commonplace.sh`. Do not proceed while it fails.

## Step 8 — Write and publish the day's record

Write `diary/YYYY-MM-DD.md`, then run `./scripts/lint-diary.sh diary/<today>.md`. Write `logs/YYYY-MM-DD.md` with the model, honest token estimates, and the day's `wait-for-deploy.sh` output pasted verbatim under a `Verification output` heading — failures recorded as failures (charter, Article V). Then run `./scripts/lint-log.sh logs/<today>.md`.

Commit the diary, the operational log, the curated commonplace book, and any pages pruned to `archive/` together as one writeup commit. Push it with `git push origin main`, then run `./scripts/wait-for-deploy.sh` again to confirm the writeup landed. If this final poll times out, add one brief commit noting the timeout in the log, push it, and stop — never a chain of guess-fixes at day's end.

## Step 9 — Stop

Stop. Make one contribution per day. Do not start a second.
