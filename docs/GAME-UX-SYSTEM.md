# VibeLearn game UX system — the game is the course

Active user amendment, 9 September 2026: read [COMMERCIAL-GAME-BAR.md](COMMERCIAL-GAME-BAR.md) first, then [GAME-AS-COURSE.md](GAME-AS-COURSE.md). The earlier detailed game/story direction remains historical input where it does not conflict.

## Product authority and quality standard

The user is currently the only real product user/reviewer. **Their latest judgment overrides all critic/agent/automated scores for acceptance.** A critic >=9.0 with no blockers can only make a build `ready_for_user_review`; only explicit user acceptance makes it accepted. Do not open to other users before that acceptance and a later explicit authorization for broader testing.

Build a game whose subject-relevant actions develop the intended course capabilities. The experience must feel like **a real commercial game experience someone could plausibly encounter on the Play Store or Steam**, not like a polished educational website with game labels, XP, maps or a renderer added. This does not imply AAA art, combat, free-roam 3D or any single genre; it does imply coherent onboarding, playfield-first interaction, responsiveness, feedback, progression, recovery, menus and polish.

## Experience and learning are separate gates

The game must be enjoyable enough to choose voluntarily, and its declared learning outcomes must have defensible coverage/evidence. Do not average these requirements. A delightful but shallow game fails the course promise; a correct but tedious or website-like lesson fails the experience.

For each outcome, design the prerequisite, mechanic, meaningful decision, causal feedback, varied practice, fresh transfer challenge, delayed retrieval and limits of what is assessed. Authentic code/design work belongs in the game when it is part of the promised capability.

## First-minute / opening comprehension invariant

Before specialist jargon where faithful, establish:

- world/context;
- player identity or role;
- what changed/went wrong/appeared;
- success condition and stakes;
- the first meaningful action.

The current Missing Delivery reference failed this in user review. The active fix is an approximately **15–20 second skippable/replayable opening story sequence** that visually establishes Pip, the valley/workshop, the already-sent bridge-gear order, the storm-lost reply, duplicate-delivery risk and the player's role in discovering what happened/restoring signals. The same causal meaning must exist under reduced motion and when the animation is skipped. Afterward, move into meaningful play quickly; do not stack another large briefing page after the intro.

Generated courses inherit the opening-comprehension requirement, not the exact Pip/storm story, art style, animation duration or fantasy framing. Choose the opening form that best fits the subject: animated cold-open, playable incident, simulation failure, dialogue, mystery, construction/scientific event, professional scenario or another coherent device.

## Game design invariants

**Narrative before jargon, where faithful.** Establish who wants what, what changed and why the player's action matters. Story carries motivation, clues and causality rather than decorating another reading panel. Formal concepts name a model the player has begun to understand.

**Playfield before page.** The main screen should be experienced primarily as the game world/playfield. HUD and contextual controls support play. Website-like cards, giant headers, tables, forms and persistent admin/navigation chrome should not dominate the primary experience.

**Subject thinking inside play.** Investigate, manipulate, compare, arrange, construct, diagnose and test when those actions embody the skill. Decisions produce distinct, legible world consequences. Dialogue/reference text appears when it helps a decision. Neither forms nor combat nor free walking is a universal definition of a game.

**Agency must grow.** New missions should unlock new tools, capabilities, interactions or strategic possibilities, not merely more text, more answer choices or larger forms. A progression system that changes only numbers/labels is insufficient.

**Confidence before complexity.** Teach -> easy success -> variation -> combine -> boss/transfer -> earned resolution -> new possibility. New tools increase what the player can do. Every required boss rule and interface operation needs preparation; a surprise unintroduced prerequisite is not fair difficulty.

**Curiosity without coercion.** Safe experiments and informative failures should suggest a new hypothesis. The reason to play survives hiding XP. Replays change reasoning, not merely colors or wording. Do not use shame, streak pressure, fake urgency or grinding to compensate for a weak core loop.

**Commercial game feel is continuous.** A cinematic intro cannot rescue a weak underlying loop. Inputs need acknowledgement; state changes need visible consequences; mistakes need understandable recovery; success needs a satisfying earned payoff; menus, pause/resume, save/load and settings should feel like parts of the game, not implementation/admin surfaces.

## Current reference and renderer experiment

The Missing Delivery reference remains a bounded retry-learning expedition. Pip needs one bridge gear, the workshop's reply can be lost, a courier restart can change the wrong identity, and retry memory can expire. The player investigates, manipulates time/state, constructs policy and faces variation.

The optional Three.js valley at `?world=3d` remains a presentation/input prototype, not proof that the game is good and not a new evidence engine. A renderer cannot substitute for gameplay. Picking a visual object must invoke the same legal game command as keyboard/touch equivalents. Renderer failure must preserve the required operation and saved work.

## HUD, input, feedback and menus

Keep the main action and important consequence together. The HUD carries the immediate goal, meaningful game state, relevant tools and persistence without becoming a dashboard. Repeated headings, giant briefings, dense sidebars, postmortem tables and permanent utility chrome should not push play below the fold.

Every input receives acknowledgement, and state-changing actions receive meaningful causal feedback. Preserve keyboard focus across redraws. Do not move precise click/tap targets while they are being selected. Pending saves prevent accidental duplicate commands.

Menus should use player language. Pause/resume, replay intro, controls, accessibility, save state and help belong in a coherent game menu. Avoid exposing terms like implementation revision, draft state, backend mode or evidence schema to ordinary players unless genuinely necessary and explained.

Required information survives reduced motion, sound off, narrow screens and actual text enlargement. Semantic equivalents accompany visual controls. Measure input latency, frame timing, load/recovery and device behavior before claiming performance.

## Learning integrity and continuity

World truth and what the player/actor knows remain distinct. Missing acknowledgement is uncertainty, not proof of failure. Retained identity has a finite window. Reconciliation capabilities must be explicitly introduced, not silently assumed. Rehearsal rewind does not imply real-world reversibility.

Commands resolve learner, command ID and expected revision. Server validation owns progression. Saved move history and evidence retain the existing immutability/isolation rules. XP never decides correctness, mastery or evidence strength.

Observed simulation feedback is guided assistance, not a fresh independent prediction. Unknown declaration, current help and prior exposure stay separate. Missing evidence is not failure.

## Generation and scope

[COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md) carries the generation contract. Generated content must include the commercial-game opening/comprehension contract, playfield/interaction contract, progression/agency, feedback/recovery, coherent game menus, accessibility and the existing learning/evidence/provenance requirements. A schema-valid manifest cannot certify its own rendered game.

This remains private Phase 1 refinement only. No new model integration, untrusted runner, Phase 2/3 implementation, external testers, paid provisioning or public rollout is authorized. User acceptance and existing hosted isolation/operational gates still control release.