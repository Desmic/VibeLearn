# Current checkpoint — user rejected at 5/10; commercial game bar now authoritative

Updated 9 September 2026. **Status: `user_rejected` / `needs_revision`. The >=9.0 critic gate and user acceptance are not met.**

## Latest user decision — authoritative

The user is currently the only real product user/reviewer. **Their latest judgment overrides every agent, critic, automated score and historical review for product acceptance.** Do not average reviews, use a higher critic score to overrule a rejection, or call a candidate accepted because tests/automation pass.

Latest explicit user review of the current experience:

- **game experience: 5/10**;
- **learning experience: 5/10**;
- primary failure: the player does not immediately understand what the game is about, who Pip is, what happened, why duplicate delivery is dangerous, or what the player is supposed to accomplish;
- required direction: explain this with a simple, compelling opening animation/story sequence and then get the player into meaningful play quickly;
- product bar: the learner-facing experience must feel like a **real game someone could credibly expect from the Play Store or Steam**, not a gamified website/course page.

Read **[COMMERCIAL-GAME-BAR.md](COMMERCIAL-GAME-BAR.md)** first for the controlling acceptance semantics and onboarding requirement. It amends GAME-AS-COURSE.md, GAME-ACCEPTANCE-9.md, GAME-UX-SYSTEM.md, GAME-UX-REVIEW.md, COURSE-GENERATION-GAME-SYSTEM.md and AGENTS.md wherever older wording conflicts.

The critic remains a pre-gate only: unrounded >=9.0/10, both audience lenses passing and no critical blocker can advance a candidate to `ready_for_user_review`; **only explicit user acceptance may set `user_accepted`.** User rejection always returns the candidate to revision regardless of critic score.

## External-user boundary

Do **not** open this product to other users yet. The current user wants VibeLearn brought to an acceptable state before any broader learner testing. External testing, invitations or rollout require a later explicit authorization after user acceptance; other users must not be used to substitute for fixing a product the sole current user has rejected.

## Current required product fix

The first-minute experience is now a hard acceptance item. For the Missing Delivery reference, add an approximately **15–20 second skippable/replayable story sequence** that makes these points visually clear before normal play:

1. Pip is the valley courier and the workshop supplies needed parts.
2. Pip already sent one order for a bridge gear.
3. The storm swallowed the reply, so the outcome is uncertain.
4. Blindly sending again can create a duplicate delivery when only one gear was wanted.
5. The player's role is to help Pip discover what happened, restore the signals/network and learn how one intent can safely lead to one result.
6. Bridge the intuitive situation into the equivalent real-software retry problem at the appropriate moment.

Reduced-motion mode must preserve the same causal sequence. Skipping the animation must still show a concise static equivalent, and the intro must be replayable. After the intro, do not present another exposition wall; move rapidly into a meaningful action.

This opening is necessary but not sufficient. The full loop must also cross the commercial-game bar: playfield-first hierarchy, responsive controls, visible consequences, meaningful alternatives, recoverable failure, growing agency/tools, fair difficulty, satisfying resolution, coherent menus/save/pause/settings and replay variation. Three.js/animation/XP alone do not satisfy this.

## Current implementation and verification history

Repository: `Desmic/VibeLearn`. Working branch: **`game/expedition-nine-gate`**. **Draft PR #2** into `deploy/render-supabase`. Do not merge or expose to new users merely because machine verification passes.

The previously frozen candidate `620036808c6c558a4a0811e7be2cf9e0a8e74043` passed run174 with the 76-test suite and browser/3D probes. That verification remains useful engineering evidence, but the later user 5/10 review supersedes the internal 7.02/10 and all older 8.8/9.1/other scores for product acceptance. See GAME-REVIEW-20260909.md for the historical internal review; it is not the current verdict.

The five-stop Missing Delivery reference remains a bounded retry-learning prototype with retained ticket, courier restart, finite memory/reconciliation, policy construction and replay/detour behavior. The optional Three.js valley remains a renderer/input experiment. Neither is accepted as the finished product direction simply because it exists or passes tests.

## Product and learning promise

VibeLearn is **a game whose meaningful play delivers the intended course outcomes**. Experience and learning are separate gates: a delightful shallow game fails the learning promise; a rigorous but website-like lesson fails the product. The target is not merely to outperform the previous build or educational web apps aesthetically; the learner-facing experience should meet credible commercial-game expectations for onboarding, interaction, pacing, feedback, cohesion and polish.

Future course generation must inherit this standard. Generated courses need an audience-appropriate game-quality onboarding contract establishing world/context, player role, meaningful objective, stakes/change and first actionable problem before abstraction where faithful. The exact Pip/storm animation is a reference implementation, not a universal theme.

## Review method and boundaries

While a genuinely separate critic agent/model is unavailable, a deliberately separated frozen-rubric internal/tool-assisted review may still guide iteration, but must be labeled honestly. It cannot self-accept the product. The user remains final authority.

No Phase 2/3 implementation, public rollout, new external testers, paid resources, untrusted runner or new model integration is opened by this update. Preserve historical evidence, learner isolation, auth/RLS boundaries, immutable submissions and the checksummed design package.

## Next acceptance loop

1. Fix first-minute story/comprehension and commercial-game presentation.
2. Verify the actual rendered build and adverse paths.
3. Run the frozen critic; below 9.0 or any blocker => continue revision.
4. If critic >=9.0 with no blocker, mark only `ready_for_user_review`.
5. The user plays it. Rejection overrides the critic and restarts revision; only explicit acceptance closes this checkpoint.
