# Level 1 quality gate — The First Words

**Updated:** 17 September 2026 IST  
**Branch:** `game/level1-quality-gate`  
**Verified behavioral candidate:** `6fea8287aa5f078a5836902478320699e54571a9`

Status: **automated/technical Level 1 gate passed; qualitative review and user acceptance pending.**

This gate exists to prevent the project from refining later content while the actual player entry, lifecycle or first learning loop is broken. `../CODEX.md`, `CRITIC-POLICY.md` and `GAME-OPENING-PROGRESSION.md` remain authoritative for execution/review method.

## User-requested live preview

The private Render service currently runs preview commit
`987e4773a231a9172634d8aa58e47f0b0996cb75`, deploy
`dep-dalcfum5vjqs73et1ir0`.

That preview was intentionally deployed before this quality gate was finished. It is not the current development candidate and does **not** contain all repairs below. Auto-deploy is off. A live preview, green CI or internal rating is never user acceptance.

## Latest user correction

The preview exposed two Level 1 blockers:

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
| first-words-opening | passed | opening beats, explicit Zip/Warden identity, pause/sound, skip/replay, reduced motion, tutorial handoff |
| first-words-controls | passed | keyboard/touch/camera controls after persisted action + reload |
| first-words-readability | passed | 200% text at 360/390/430 with usable world area |
| first-words-lifecycle | passed | hosted reset/restart and sign-out/auth boundary |
| first-words-chapter | passed | tutorial first win, mistake/recovery, completion/reload, 360/430 reduced-motion completion |

The opening and chapter browser reports have no page errors. Fresh exact-head screenshots were inspected in addition to DOM assertions.

## Observed presentation checkpoint

The current opening uses three causal beats rather than a lesson stack:

1. interact with the visibly labelled Zip as a friend;
2. see the visibly labelled Warden and voice theft;
3. see Zip labelled behind the gate, voiceless, and continue through one primary `Help Zip` action.

The tutorial then exposes one immediate action at a time and ends in `Zip is free.` before the tower challenge introduces a normal mistake.

The tower mistake state has one primary recovery action (`Check route signs`). The completed 390px state leaves the Star gate open and Zip visible in the world; the ending/reflection is optional rather than automatically covering the payoff.

This is an improvement over the reviewed preview, not a claim that a novice or the user has accepted it.

## Remaining quality gate

The remaining gate is qualitative rather than another feature pass:

1. review the full rendered experience under `CRITIC-POLICY.md`;
2. write concrete failures and likely abandonment points before assigning any internal criterion ratings;
3. keep subjective sound quality unassessed unless it is actually listened to;
4. keep physical-device and novice/young-player limitations explicit;
5. repair only observed Level 1 blockers and rerun affected gates;
6. present a bounded candidate to the current user, whose verdict remains final.

The internal >=9 aspiration still applies criterion-by-criterion; there is no weighted average and no automatic pass from CI. Missing subjective evidence remains unknown rather than being invented.

## Scope boundary

Do **not** implement Level 2 yet. Do not deploy the newer development candidate merely because the technical gate passed. No new model service, paid resource, public rollout or external tester is authorized by this checkpoint.

No new Supabase schema migration was required for the current Level 1 correction. Preserve hosted auth, learner isolation, immutable evidence and explicit assisted/unknown mastery semantics.

Detailed technical evidence is recorded in [FIRST-WORDS-CHUNK-REVIEW.md](FIRST-WORDS-CHUNK-REVIEW.md); current deployment/work status is in [STATE.md](STATE.md).
