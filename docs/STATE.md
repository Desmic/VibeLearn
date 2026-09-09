# Current checkpoint — attention-first onboarding + progressive Signal 1

Updated 9 September 2026. **Status: `ready_for_user_review` after the internal pre-gate; not `user_accepted`.** The current user's explicit verdict remains authoritative and is still **5/10 game, 5/10 learning** until they personally review this changed build.

## Latest user direction

The user likes the newer Relay Rescue story/progression/UI direction, but explicitly rejected the absence of a real animated onboarding/tutorial experience. The product requirement is now:

> Capture attention first with creativity and beauty, then increase cognitive load progressively.

The first/tutorial chapter must make the world obvious even to a child or novice before technical reasoning begins. The player should understand the character, need, objects/resources and their functions, what already happened, what became uncertain, why the wrong action matters, what help is needed, and the first useful action. Use simple causal animation/direct interaction where possible. Formal terminology comes after concrete understanding.

This feedback changes product design and generation rules, so it is reflected in `AGENTS.md`, `GAME-AS-COURSE.md`, `GAME-UX-SYSTEM.md`, and `COURSE-GENERATION-GAME-SYSTEM.md`. Future agents must update relevant docs in the same implementation unit whenever user feedback changes a design/acceptance/generation principle.

## Current implementation target

Repository: `Desmic/VibeLearn`. Active hosted branch: **`deploy/render-supabase`**. Render serves this branch with manual deploys; auto-deploy is disabled.

The current candidate adds:

- a full-screen six-beat animated Relay Rescue opening on normal-motion devices;
- visual introduction of Pip, the broken footbridge, one required gear, workshop, already-sent `order-01`, lost reply, uncertainty and duplicate risk;
- a reduced-motion storyboard carrying the same causal meaning without auto-animation;
- replayable opening from the game menu;
- a Signal 1 tutorial that initially exposes only one obvious action: inspect the workshop;
- progressive disclosure: workshop -> ticket -> first decision -> visible duplicate failure/recovery -> success;
- child-readable in-world labels explaining Pip / Workshop / Gear / Ticket / Reply;
- a playfield-first Signal 1 presentation: the website-like side console, field journal and evidence disclosure are suppressed during the guided concrete interaction, then normal secondary systems return after the lesson resolves;
- a compact game action dock that reuses the real ticket and action controls only after the player has gathered the required clues, instead of showing a vertical stack of forms/panels from the start;
- tutorial progression derived from server-confirmed rescue state rather than optimistic click events, so saving/pending states cannot accidentally unlock a second move;
- a Signal 1 completion recap that names `idempotent retry` only after the player has experienced the concrete rule;
- dedicated rendered browser verification for normal-motion onboarding, reduced-motion equivalent, progressive interaction, visible wrong-action consequence and recovery.

The current first-minute design ladder is:

`beauty / curiosity -> character + concrete problem -> one obvious action -> visible consequence -> easy recovery/success -> name the concept -> variation -> combination -> transfer`

## Existing private-pilot capabilities retained

The hosted login/recovery UI uses Relay Rescue visual language. Password visibility remains inside the field on mobile. Cleared earlier signals can be reopened as read-only reviews without losing the latest active run. A confirmed **Reset all progress** operation removes learner-scoped campaign attempts/clears/XP/evidence/review state while preserving the account. The private test player alias `dank` exists for pilot testing with its explicitly configured trivial test password; this path is separate from normal Supabase Auth and is not a public-account mechanism.

## Product authority and acceptance

The current user is the sole real product reviewer. Their score/rejection overrides internal critic, automated review or historical scores. Never average them together.

Current acceptance flow:

`needs_revision -> machine/browser verification -> critic >=9 on game + learning/no blocker -> ready_for_user_review -> explicit user acceptance -> user_accepted`

The internal-tool-assisted frozen review of runtime candidate `416a463b07015b98fd8915f2c890c56f9e74900b` recorded **9.196/10 game experience** and **9.35/10 learning/real-world transfer for the bounded retry-safety slice**, with no frozen critical blocker. See `CURRENT-GAME-CRITIC.md`. This is a pre-gate only; it is not an independent agent or human playtest and does not change the user's 5/10 + 5/10 verdict.

A critic >=9 does not mean accepted. No external users/testers or broader rollout are authorized before the user's acceptance and later explicit authorization.

## First-chapter comprehension gate

Before Signal 1 is considered successful, a fresh player should be able to answer in plain language:

1. Who is Pip?
2. What does Pip need?
3. What does the workshop do?
4. What does the gear do and how many are needed?
5. What is `order-01`?
6. What did the storm destroy?
7. Why can a missing reply still mean the gear exists?
8. Why can a brand-new order be dangerous?
9. What should the player inspect first?

If the rendered game cannot answer these questions through visual causality/play with modest reading, the tutorial fails regardless of art quality or critic score.

## Scope / safety boundaries

This remains private Phase 1 refinement. No Phase 2/3 generation implementation, untrusted runner, new model integration, external testers, paid provisioning or public rollout is authorized. Hosted Auth, RLS, learner isolation and evidence-integrity boundaries remain in force. Reduced motion, keyboard/touch and mobile layout remain required.

## Verification status

Runtime candidate `416a463b07015b98fd8915f2c890c56f9e74900b` passed GitHub Actions run `34376435686`, including unit tests and the complete browser suite. Frozen evidence artifact: `game-review-evidence-416a463b07015b98fd8915f2c890c56f9e74900b`, SHA-256 `d34cc9978c93b3af5d6761ef60bde80a86bc26e862ca5c7a66607a5d68e6ba50`.

The later commits that add the critic report and this checkpoint are documentation-only. Run the final branch-head CI and then manually deploy Render because auto-deploy is disabled. Do not claim the new candidate is live until Render reports that deployment as `live`. Passing machine checks still do not replace the user's play review.
