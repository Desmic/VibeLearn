# VibeLearn game UX system — the game is the course

Active user direction, updated 9 September 2026. Read with [GAME-AS-COURSE.md](GAME-AS-COURSE.md), [STATE.md](STATE.md), [GAME-UX-REVIEW.md](GAME-UX-REVIEW.md), and [COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md).

## Product and review standard

Build a game whose subject-relevant actions develop the intended course capabilities. The experience must earn voluntary play from a curious younger non-specialist and an older teen/young adult. Do not mistake a game-themed website, a beautiful scene, easy quizzes, XP accumulation, or a 3D renderer for that product.

The current user is the sole real product reviewer during private refinement. Their explicit verdict overrides critic/agent/automation scores. The target remains unrounded **>=9.0/10** for game experience and learning/real-world transfer, no critical blocker, then explicit user acceptance. Internal/tool-assisted review may be used while a genuinely separate critic is unavailable, but must be labeled honestly.

## Attention first, cognition second

The opening contract is now explicit: **great games capture attention with creativity and beauty before asking the player to think hard**. Early visual appeal is not decoration; it earns attention so the player is willing to learn the world. Cognitive load then rises deliberately rather than arriving as a briefing wall.

Default early-load ladder:

`beauty / curiosity -> character -> concrete need -> one obvious action -> visible consequence -> easy recovery/success -> name the concept -> variation -> combination -> boss/transfer`

For the first/tutorial chapter:

- introduce the character and immediate need before terminology;
- make important objects visually distinct and show what each object does through animation or direct manipulation where possible;
- show the inciting event causally: what happened first, what changed, what information was lost, and what remains true in the world;
- give the player **one obvious action at a time** until they understand the interaction grammar;
- use a **tutorial focus mode**: the playfield is dominant and nonessential evidence panels, journals, analytics, settings, helper drawers, repeated briefings and secondary controls are deferred until they become useful;
- progressively reintroduce HUD/system information as the player earns enough context to use it, rather than showing the full application chrome on mission one;
- keep the real underlying controls/state semantics when presenting a focused HUD; do not create decorative duplicates that diverge from save, accessibility, or evidence behavior;
- use informative failure to show why a wrong action matters, then make recovery easy;
- only after concrete success attach formal language such as `idempotent retry`, `intent identity`, `retention`, etc.;
- keep essential meaning available with reduced motion and without sound.

The first chapter fails if a fresh novice cannot answer in plain language by its end: Who needs help? What do they want? What are the important objects? What does each object do? What already happened? What is uncertain? Why can the wrong action hurt? What should I inspect or try first?

Animation must communicate **causality, function, state change, or consequence**. Decorative movement does not satisfy the onboarding requirement. The same rule applies to Three.js: renderer sophistication is not a substitute for comprehension.

## Experience and learning are separate gates

The game must be enjoyable enough to choose voluntarily, and its declared learning outcomes must have defensible coverage/evidence. Do not average these requirements. A delightful but shallow game fails the course promise; a correct but tedious lesson fails the experience.

For each outcome, design the prerequisite, mechanic, meaningful decision, causal feedback, varied practice, fresh transfer challenge, delayed retrieval and limits of what is assessed. Authentic code/design work belongs in the game when it is part of the promised capability.

## Game design invariants

**Narrative before jargon, where faithful.** Establish who wants what, what changed and why the player's action matters. Story carries motivation, clues and causality rather than decorating another reading panel. Formal concepts name a model the player has already begun to understand.

**Subject thinking inside play.** Investigate, manipulate, compare, arrange, construct, diagnose and test when those actions embody the skill. Decisions produce distinct, legible world consequences. Dialogue/reference text appears when it helps a decision.

**Confidence before complexity.** Teach -> easy success -> variation -> combine -> boss/transfer -> earned resolution -> a new possibility. New tools increase what the player can do. Every required boss rule and interface operation needs preparation; a surprise unintroduced prerequisite is not fair difficulty.

**Curiosity without coercion.** Safe experiments and informative failures should suggest a new hypothesis. The reason to play survives hiding XP. Replays change reasoning, not merely colors or wording. Do not use shame, streak pressure, fake urgency or grinding to compensate for a weak core loop.

## Current Relay Rescue reference

Relay Rescue teaches missing-reply/retry safety through Pip, a valley courier, a workshop, bridge gears, tickets and signals. The current opening target is a short animated story establishing Pip, the bridge, exactly one required gear, the already-sent `order-01`, the workshop possibly completing the gear, the storm swallowing the reply, duplicate-delivery risk, and the player's role.

Signal 1 is the tutorial/world-model chapter. It should not expose the entire systems problem at once. The player first inspects the workshop, then the ticket, then chooses a move. Wrong identity should visibly create a duplicate and lead to an easy rewind. Only after the player restores Signal 1 should the UI name the formal concept and connect it to software retries.

The reference implementation uses tutorial focus mode deliberately: the first interaction is scene + coach only; the compact action dock appears only after the player has gathered the necessary clues; website-like console/journal/evidence surfaces remain out of the way during concrete play. Those secondary systems still capture state/evidence underneath and can return after the interaction grammar is understood. This is a design rule, not a Relay-Rescue-specific skin.

Progression after Signal 1 may raise cognitive load: restart identity, changed payload, retention/expiry, unknown vs absent, route construction, and novel transfer. Each step must reuse prior understanding while adding one meaningful new burden.

## HUD, input and feedback

Keep the main action and important consequence together. The HUD carries the immediate plain goal, relevant world/knowledge state, useful contextual tools and save status. Repeated titles, giant briefings, persistent tool rails and postmortem tables must not push play below the fold.

Treat **visible UI complexity as a budget**. Onboarding should expose only the information/actions required for the current mental model. Evidence capture, telemetry, learning metadata and save integrity may remain fully active in the system without all of their controls or explanations occupying the primary play surface. Reintroduce secondary surfaces when they help a decision, recovery, reflection, or player-requested inspection.

Every input receives acknowledgement, and state-changing actions receive meaningful causal feedback. Do not move precise click/tap targets while selected. Preserve keyboard focus across redraws. Pending saves prevent accidental duplicate actions. Ordinary map navigation must not silently discard work.

Required information survives reduced motion, sound off, narrow screens and text enlargement. Semantic equivalents accompany visual controls. Headless CI is not a phone enjoyment/performance benchmark.

## Learning integrity and continuity

World truth and what the courier knows remain distinct. Missing acknowledgement is uncertainty, not proof of failure. Retained identity has a finite window. Committed, authoritatively absent with no in-flight request, and unavailable states require different behaviors. Rehearsal rewind does not imply real-world rollback.

Commands resolve learner, command ID and expected revision. The server replays pinned rules and validates progression. Submissions/checkpoints/evidence remain immutable except for an explicit learner-scoped full reset operation authorized by the player. XP never decides correctness, mastery or evidence strength.

Observed simulation feedback is guided assistance, not a fresh independent prediction. Unknown declaration, current help and prior exposure stay separate; missing evidence is not failure.

## Documentation continuity

User feedback that changes onboarding, progression, interaction grammar, visual hierarchy, acceptance or course-generation behavior must be reflected in the relevant docs in the same implementation unit. A code-only change with stale design docs is incomplete. `AGENTS.md` records this as an agent process invariant.

## Generation and scope

[COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md) carries the generation contract. Generated content must be a coherent playable learning system with outcome coverage, interaction/progression, provenance, assistance, persistence, accessibility and critic evidence. A schema-valid manifest cannot certify its own rendered game.

This is private Phase 1 refinement only. No new model integration, untrusted runner, Phase 2/3 implementation, external testers, paid provisioning or public rollout is authorized without explicit user approval.
