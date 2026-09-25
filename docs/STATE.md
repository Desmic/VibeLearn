# Current state — LLM learning-game proof track

One authoritative status. Anything older lives in `docs/history/STATE-20260921-24.md` or
`docs/history/STATE-20260918-20.md`; those are narrative, not authority. "Automated checks
passed", "experience review passed" and "user accepted" are three different claims below and
are never merged into one.

## Candidate under review

- Branch `docs-readthrough-20260921`. Last measured candidate `05f3988f9c0c2248cee21f874dac9df1ff6f4feb`;
  machine-level harness work has landed since (`96f7d81`, `417a32e`), which changes no player-facing
  surface. Not merged to `main`, not pushed; that happens only on the user's word.
- **No candidate is reviewable right now.** The working tree carries another agent's uncommitted
  gameplay, test and fixture edits, so there is no SHA that equals the tree a playthrough would
  observe. The review gate requires `--candidate` on a clean tree for exactly this reason: freeze
  first, then play.
- Player-facing content since the user's last look at the game: the opening's story text is painted
  in the world band instead of living only in the screen-reader channel (`ec8789a`), and preferences
  (sound, music, effects, motion, XP) have one owner that also applies them, so an in-game toggle has
  force instead of only flipping its own icon (`05f3988`).
- Nothing in this candidate has been observed in play by a critic or by the user yet.

## Evidence status

| Claim | State |
| --- | --- |
| Automated checks on `05f3988` | Passed: 426 unit tests (7 skipped), full 23-state presentation scenario 0 violations with `prefDrift=0` and `announcedOnly=0` in every state, `first-words-opening` browser group passed |
| Automated checks on the dirty tree (25 Sep) | Passed: `manage.py build`, 433 unit tests (7 skipped) in 94 s. Not a candidate measurement — it includes uncommitted work |
| Automated checks not yet re-run | The five other active Level 1 browser groups (tutorial, controls, chapter, readability, lifecycle) were last run on `ec8789a`; they need the frozen SHA, not a rescheduled slot |
| Machine-level harness repair (25 Sep) | Passed, verified by measurement: `tools/play_session.py` now accounts for every chromium it opens even when the ledger predates it, refuses a second browser, and writes a review's screenshots inside its own evidence pack. One pre-repair orphan (1.76 GB, DevTools port 9342, driver dead) was reaped; afterwards no chrome process owns a loopback port |
| Experience review | **Not run.** Two attempts this cycle produced no report, both for process reasons (a slow agent-driven pass, an aborted relaunch). One cold playthrough, phone first then desktop, every lane scored in the same pass, motion and audio parked as unassessed |
| User acceptance | Not requested. The user's latest verdict on the game is a rejection and stands until they say otherwise |

## Confirmed blockers

None mechanical. The open question is not measurement but whether the whole journey works for
a new player, which no checker can answer.

## Next actions, in order

1. Land or hand off the in-flight working-tree edits so one SHA equals what gets played.
2. Cold playthrough completes in one pass, driven by batched step files rather than one action
   per turn → collect scores, confusion log and blockers. Nothing reaches the player until it
   has been seen in this step.
3. Design-intent comparison against those observations, not against the docs.
4. Repair only demonstrated blockers, each as its own bounded change, re-running only the
   checks that repair touches.
5. Re-run the five deferred browser groups on the frozen SHA, then present to the user.
