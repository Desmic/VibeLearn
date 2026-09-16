# Level 1 quality gate — The First Words

**Updated:** 17 September 2026 IST  
**Branch:** `game/level1-quality-gate`  
**Verified behavioral candidate:** `6fea8287aa5f078a5836902478320699e54571a9`

Status: **internal Level 1 gate passed; user final review pending.**

This gate exists to prevent the project from refining later content while the actual player entry, lifecycle or first learning loop is broken. `../CODEX.md`, `CRITIC-POLICY.md` and `GAME-OPENING-PROGRESSION.md` remain authoritative for execution/review method.

## User correction that controlled this revision

The earlier preview exposed two Level 1 blockers:

- logout and game reset had disappeared from the active Bellweather UI;
- the game was too convoluted/unclear before a new player had learned how to play or experienced success.

The binding product rule is **easy to play, hard to master**. Teach the basic interaction loop through a tutorial and immediate success. Add difficulty later through deeper reasoning, competing context, transfer, uncertainty and fading help — not more controls, quizzes or camera friction.

## Current repaired player path

`opening -> power Zip -> scan obvious Moon clue -> generate word by word -> free Zip -> tower context challenge -> recoverable wrong route -> current five-point clue -> Star route -> completion`

Key constraints now enforced:

- Zip and the Warden are explicitly identified on their world characters during the opening; identity clarity is solved spatially rather than by another explanation card;
- no intentional round-0 failure for fresh Level 1 runs;
- optional model inspection stays out of the tutorial and appears after the first rescue;
- the former required second input-growth prediction is removed from new runs;
- input growth is demonstrated by the mechanic itself;
- `Check route signs` is the guaranteed simple path into tower context selection;
- physical route boards remain optional world interactions;
- movement/camera skill is not a prerequisite for Level 1 concept comprehension;
- reset and logout are visible in-game lifecycle controls, not merely backend endpoints;
- completion remains visible in the 3D world before any optional reflection dialog;
- no 2D gameplay fallback is permitted.

## Technical gate result

GitHub Actions run `35138788244` passed every active Level 1 job on the exact behavioral candidate:

| Gate | Result | What it protects |
|---|---|---|
| foundation | passed | build, full application suite, entry, historical-draft continuity, no 2D fallback |
| application tests | **152 passed** | rules, storage, PostgreSQL behavior, auth/session, evidence/isolation contracts |
| first-words-opening | passed | opening beats, explicit Zip/Warden identity, pause/sound lifecycle, skip/replay, reduced motion, tutorial handoff |
| first-words-controls | passed | keyboard/touch/camera controls after persisted action + reload |
| first-words-readability | passed | 200% text at 360/390/430 with usable world area |
| first-words-lifecycle | passed | hosted reset/restart and sign-out/auth boundary |
| first-words-chapter | passed | tutorial first win, mistake/recovery, completion/reload, 360/430 reduced-motion completion |

The opening and chapter browser reports have no page errors. Fresh exact-head screenshots were inspected in addition to DOM assertions.

## Internal qualitative critic result

The exact candidate was then reviewed under `CRITIC-POLICY.md` with concrete failures/abandonment risks written before scores and a counterexample attempt recorded for every 9+ criterion.

The executable review record is:

`docs/reviews/2026-09-17-level1-6fea828.json`

Running the repository checker against candidate `6fea8287aa5f078a5836902478320699e54571a9` returns:

- status: `ready_for_user_review`;
- rendered story minimum: **9**;
- first touch minimum: **9**;
- whole chapter minimum: **9**;
- learning minimum: **9**;
- unassessed criteria: none;
- unobserved required coverage: none;
- blockers: none.

Detailed observations and counterexample attempts are in `LEVEL1-FINAL-CRITIC-20260917.md`.

This internal result **does not determine user acceptance**.

## Live review deployment

The private Render review service now runs commit `6de1f0ccb234507c1db2dccbe007c7cabfaf397e`, deploy `dep-daleugf40ujc73dphuo0`, at:

`https://vibelearn-4xws.onrender.com/`

That deployment contains the exact verified `6fea828...` runtime plus review/documentation commits only. Render reports the deploy as `live`; startup/health requests returned HTTP 200 and there were no post-deploy error/critical logs when checked.

Auto-deploy remains off. This is a bounded user-review deployment, not acceptance or public rollout.

## Human-review limits that remain explicit

The internal environment cannot replace the user's judgment on:

- subjective music/effects mix and musical appeal by actual listening;
- physical-phone feel/performance and ergonomics;
- genuine newcomer/young-player engagement and comprehension;
- delayed learning/retention;
- overall product taste and willingness to continue playing.

Audio lifecycle/scheduling/phase/mute behavior was verified, but subjective mix quality was not invented. Chromium touch/phone emulation is not a physical-device study.

## Scope boundary

**Do not implement Level 2 yet.**

The next checkpoint is the current user's final Level 1 review and feedback. Any user-reported Level 1 blocker should be repaired and retested before progression work resumes.

No new Supabase schema migration was required for this final Level 1 revision. Preserve hosted auth, learner isolation, immutable evidence and explicit assisted/unknown mastery semantics.

Detailed technical evidence is recorded in [FIRST-WORDS-CHUNK-REVIEW.md](FIRST-WORDS-CHUNK-REVIEW.md); current deployment/work status is in [STATE.md](STATE.md).
