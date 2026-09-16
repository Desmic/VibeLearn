# Current state — The First Words Level 1

## Active checkpoint — 17 September 2026 IST

Status: **Level 1 technical gate passed; qualitative/user review still pending.**

Active development branch: `game/level1-quality-gate` (draft PR #11).
Verified behavioral candidate: `64c4334b8a4ab3937031704140086560a9d27b04`.
GitHub Actions run: `35137170056` (`Verify hosted pilot`, run 802).

All six active Level 1 gates passed on that exact commit:

- `foundation`: build passed, the full application suite ran **152 tests successfully**, and the Level 1 entry/no-2D-fallback browser gate passed;
- `first-words-opening`: fresh opening, skip, replay, reduced-motion and tutorial handoff passed;
- `first-words-controls`: movement/camera controls remained usable after a persisted action and reload;
- `first-words-readability`: 200% text kept a usable 3D world band at 360/390/430 CSS-pixel widths;
- `first-words-lifecycle`: hosted sign-in -> reset -> opening restart and sign-out -> auth were exercised in a real browser and passed;
- `first-words-chapter`: guided first success, changed-context mistake/recovery, completion/reload, and fresh 360/430 reduced-motion completions passed with no page errors.

This establishes the current **technical behavior**, not audience enjoyment, mastery, novice comprehension or user acceptance.

## User direction that controls the current revision

The last Render preview exposed two blockers:

1. logout and game reset had regressed from the active Bellweather UI;
2. Level 1 was too convoluted and unclear before the player had learned how to play.

The binding design rule is **easy to play, hard to master**. Level 1 teaches the interaction loop, gives a clean success, then introduces normal failure/recovery. Future How-LLMs-Work episodes should gain difficulty through deeper reasoning, ambiguity, competing context and reduced scaffolding — not through extra UI friction or prerequisite camera skill.

Implemented current flow:

`opening -> connect Zip's power -> scan obvious Moon context -> generate word-by-word -> free Zip -> changed-context tower challenge -> recoverable wrong route -> correct current context -> open Star route -> Level 1 complete`

Important simplifications now protected by tests:

- new runs cannot intentionally fail before the first rescue;
- the optional engine inspector is hidden during the tutorial and appears only after the first win;
- the old required `Predict the next input` quiz is removed from new runs; input growth is learned by watching generated words join the next input;
- `Check route signs` is the guaranteed Level 1 context-selection path; physical boards remain optional world interactions rather than a camera-hunting requirement;
- `Reset game progress` and `Sign out` are first-class in-game lifecycle controls again.

See [FIRST-WORDS-BUILD.md](FIRST-WORDS-BUILD.md), [LEVEL1-QUALITY-GATE-20260916.md](LEVEL1-QUALITY-GATE-20260916.md), [FIRST-WORDS-CHUNK-REVIEW.md](FIRST-WORDS-CHUNK-REVIEW.md), [GAME-OPENING-PROGRESSION.md](GAME-OPENING-PROGRESSION.md) and [CRITIC-POLICY.md](CRITIC-POLICY.md).

## Deployment state

The current development candidate above is **not deployed**.

The live private Render preview remains:

- commit `987e4773a231a9172634d8aa58e47f0b0996cb75`;
- deploy `dep-dalcfum5vjqs73et1ir0`;
- service `srv-daf7dhuq1p3s73c122cg`;
- auto-deploy is off.

That live preview predates the lifecycle/tutorial simplification and must not be confused with the verified development candidate. Do not deploy the newer candidate merely because CI is green; deployment/user review remain explicit checkpoints.

No new Supabase schema migration was required for this revision. Preserve the existing hosted auth/data boundary, learner isolation and immutable evidence behavior.

## Evidence and limits

Fresh exact-head screenshots/reports show:

- a three-beat 3D opening ending on one primary `Help Zip` action;
- a compact first-success state with Zip free and one `Continue with Zip` action;
- a recoverable tower mistake whose primary action is `Check route signs`;
- an in-world completion state with Zip present and the Star gate open before any optional ending dialog;
- functional 200% text at phone widths without turning the experience into a full-screen reading surface.

Still **unverified / not claimed**:

- subjective audio mix and musical appeal by listening;
- physical-device feel and performance;
- novice/young-player engagement or comprehension;
- delayed learning/retention;
- user acceptance of this newer candidate.

The user's most recent product verdict applies to the earlier preview and remains `needs_revision` until they review a newer candidate. Green CI does not change that verdict.

## Next gate

Do not start Level 2.

Next work is the qualitative whole-Level-1 review under [CRITIC-POLICY.md](CRITIC-POLICY.md): inspect the exact rendered opening/tutorial/challenge/payoff, record concrete remaining clarity or engagement blockers before scores, keep sound/physical-device limitations explicit, repair only observed Level 1 problems, then present a bounded candidate for the user's review. The user remains the final product critic.

Historical September 14 state is preserved under `docs/history/`; older local-worktree/deployment checkpoints are historical and no longer current instructions.
