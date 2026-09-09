# Current checkpoint — direction improved; still needs revision and user acceptance

Updated 9 September 2026. **Status: `needs_revision`. The user says the new story/progression/UI direction is "way better", but has not accepted the product or assigned a new passing score. The >=9.0 critic gate and explicit user acceptance remain unmet.**

## Latest user decision — authoritative

The user is currently the only real product user/reviewer. **Their judgment overrides every agent, critic, automated score and historical review for product acceptance.** Do not average reviews, use a higher critic score to overrule a rejection, or call a candidate accepted because tests/automation pass.

The prior explicit 5/10 game and 5/10 learning scores remain historical evidence for the rejected build. The newest feedback is a positive directional update, not acceptance:

- the new opening story, progression and UI direction is **"way better"** and should be continued;
- the login/recovery experience must now look and feel like part of the same game rather than a generic website/auth form;
- **Signal/Chapter 1 is a comprehension gate**: by its end, the player should understand the story and scenario, who Pip is and what help Pip needs, the important world objects (for example the workshop, footbridge, gear, ticket and reply), what each one does, why the outcome matters, and why a duplicate is harmful;
- prefer **simple causal animation and interaction** over explanatory text walls for teaching those relationships;
- keep the commercial bar: this should feel like a credible Play Store/Steam learning game, not a course page with game decoration.

Read **[COMMERCIAL-GAME-BAR.md](COMMERCIAL-GAME-BAR.md)** first for controlling acceptance semantics. The critic remains a pre-gate only: unrounded >=9.0/10, both audience lenses passing and no critical blocker can advance a candidate to `ready_for_user_review`; **only explicit user acceptance may set `user_accepted`.**

## External-user boundary

Do **not** open this product to other users yet. External testing, invitations or rollout require later explicit authorization after user acceptance. Other users must not be used to substitute for fixing a product the sole current user has not yet accepted.

## Current product work

The first-minute animated opening is now implemented on draft PR #4 and establishes Pip, the valley, the sent order, lost reply, duplicate risk, seven-signal goal and real-software bridge. The opening is skippable/replayable and reduced-motion has an equivalent causal presentation. The map copy now states the missing-reply problem directly.

The current iteration extends that direction in two places:

1. **Game-native hosted auth.** Sign-in/recovery is staged as entering or reconnecting to Relay Rescue, using the same valley, Pip, workshop, signals, colors and motion language. Authentication/security behavior remains unchanged underneath.
2. **Signal 1 world tutorial.** Before the first consequential retry decision, a short animated sequence teaches: Pip is the courier; the workshop makes repair parts; one gear repairs the footbridge; the job needs exactly one gear; `order-01` is the job identity; the workshop can finish the gear while the reply is lost; therefore no reply means uncertainty rather than failure; the player should inspect what happened before choosing Pip's move. A small persistent world key remains after the tutorial.

This is necessary but not sufficient. The full loop must remain playfield-first with responsive controls, visible consequences, meaningful alternatives, recoverable failure, growing agency/tools, fair difficulty, satisfying resolution and replay variation. Animation/3D/XP alone do not satisfy the commercial-game bar.

## Current implementation and verification history

Repository: `Desmic/VibeLearn`.

Active refinement branch: **`game/first-minute-story`**, draft **PR #4** into `game/expedition-nine-gate`. Do not merge or expose to new users merely because machine verification passes.

Run191 was the last fully green rendered candidate before the playfield-control refactor. Later run194 correctly failed a real pointer test because the Signal 3 journal and parcel inspection targets overlapped; the journal intercepted the parcel. That is treated as a product/input defect, not a flaky test. The current branch separates those hit targets and adds explicit real-pointer coverage for both.

The earlier internal 7.02/10 and older 8.8/9.1/other scores are historical only. The user’s newest positive directional feedback does not convert them into current acceptance or a >=9 result.

The current Missing Delivery / Relay Rescue reference remains a bounded retry-learning prototype with retained ticket identity, courier restart, payload mismatch, retention/reconciliation, unknown-state handling, policy construction and a fresh worker transfer. The optional Three.js valley remains an experiment, not the definition of the game.

## Product and learning promise

VibeLearn is **a game whose meaningful play delivers the intended course outcomes**. Experience and learning are separate gates. A delightful shallow game fails learning; a rigorous but website-like lesson fails the product.

A first chapter must do more than state an objective. Before expecting later reasoning, the learner should be able to answer, in plain language:

- Where am I / what system or world am I in?
- Who needs help, and what do they need?
- What are the important objects/actors and what does each do?
- What changed or went wrong?
- Why does the outcome matter?
- What can I do right now, and what consequence should I watch for?

The game should teach these through causal play, animation, scene changes and interaction where useful, with concise text as support. This requirement generalizes to generated courses; the exact Pip/gear/storm theme does not.

## Review method and boundaries

While a genuinely separate critic agent/model is unavailable, a deliberately separated frozen-rubric internal/tool-assisted review may guide iteration but must be labeled honestly. It cannot self-accept the product. The user remains final authority.

No Phase 2/3 implementation, public rollout, new external testers, paid resources, untrusted runner or new model integration is opened by this iteration. Preserve historical evidence, learner isolation, auth/RLS boundaries, immutable submissions and the checksummed design package.

## Next acceptance loop

1. Finish and verify game-native login plus Signal 1 comprehension/tutorial changes.
2. Repair any browser/input/accessibility regressions without weakening the tests.
3. Inspect actual rendered evidence across desktop/mobile/reduced-motion.
4. Continue improving the complete game journey; do not stop because one chapter is clearer.
5. Run the frozen critic only on a fully verified candidate; below 9.0 or any blocker => continue revision.
6. If critic >=9.0 with no blocker, mark only `ready_for_user_review`.
7. The user plays it. Rejection overrides the critic; only explicit acceptance closes this checkpoint.
