# Course generation produces playable teaching systems

Current authority — 9 September 2026. This amends the root CODEX-IMPLEMENTATION-PLAN.md for future Phase 3/4; it does not open those implementation phases. The checksummed design bundle remains untouched.

Read [COMMERCIAL-GAME-BAR.md](COMMERCIAL-GAME-BAR.md), [GAME-AS-COURSE.md](GAME-AS-COURSE.md), [GAME-ACCEPTANCE-9.md](GAME-ACCEPTANCE-9.md), [GAME-UX-SYSTEM.md](GAME-UX-SYSTEM.md) and [GAME-UX-REVIEW.md](GAME-UX-REVIEW.md).

## Contract continuity and precedence

The detailed pre-existing generation specification is preserved verbatim at [history/COURSE-GENERATION-before-game-as-course.md](history/COURSE-GENERATION-before-game-as-course.md). **Its detailed brief, bundle, schema, versioning, assistance, validation and repair requirements remain normative except where explicitly superseded here.** This is not a deletion or replacement of those contracts with a shorter vague plan.

Current changes supersede older thresholds/current-review status: use **>=9.0/10 unrounded**, no critical blocker, both younger-player and young-adult engagement lenses and final user acceptance. A critic pass is only a pre-gate; it can advance a candidate to `ready_for_user_review`, never `user_accepted`. The user's explicit rejection overrides every critic/agent/automated score. The Missing Delivery reference and optional Three.js probe are implemented candidates, not accepted templates. Historical scores do not approve them.

## The game is the course

Do not generate ordinary lesson pages, add XP and call the result a game. Generate an experience in which meaningful investigation, construction, manipulation, decisions and consequences exercise the intended skills. A required explanation or coding task is legitimate when it actually develops or demonstrates a promised capability; arbitrary forms are not a universal mechanic.

The learner-facing experience must meet the **commercial game bar** in `COMMERCIAL-GAME-BAR.md`: it should feel like a real game someone could credibly expect to install from the Play Store or Steam, not like a gamified website, dashboard, card stack, course page or quiz. This is a standard for onboarding, interaction, pacing, feedback, cohesion and polish; it does not require AAA production values, combat, free-roaming 3D, cinematics or any one genre.

The goal is the useful outcomes of the declared course, ideally better learning, but neither equivalence nor superiority is established by making that promise. A small guided reference slice is not a full-course replacement. Experience and learning outcomes are separate gates: neither may compensate for failure of the other.

## Required game-quality onboarding contract

Every generated chapter/campaign must explicitly generate an **opening comprehension contract** appropriate to the subject. Before specialist abstraction where faithful, the learner should understand:

- the world/context or situation;
- who/what the player is in relation to it;
- what changed, failed, appeared or became possible;
- what success looks like;
- why the situation matters or what is at stake;
- what first action the player can take.

The opening form should fit the domain: animated cold-open, interactive incident, short playable tutorial beat, dialogue scene, simulation event, mystery reveal, construction/scientific failure, professional emergency or another coherent form. **Do not force all courses into Pip, a valley, fantasy, storms, animation or a fixed 20-second cutscene.** The current Missing Delivery candidate uses an approximately 15–20 second skippable/replayable story sequence as a reference because the user's review found its premise otherwise unclear.

The opening must teach causality and motivation, not decorate a lesson. Skipping animation must preserve essential meaning in a concise static equivalent; reduced motion, sound-off, keyboard and touch must preserve the same required comprehension and actions. After onboarding, move quickly into meaningful play rather than another briefing wall.

### First-chapter world-model gate

The opening hook is not enough. **By the end of the first chapter, a generated game must have taught the player the minimum world model needed to reason about later missions.** For the chapter's important actors, objects, resources, states and signals, the generator must identify and present:

- what the thing is in plain language;
- what function it performs in the world/system;
- who uses or depends on it;
- what visible consequence changes when it succeeds, fails, disappears or is duplicated;
- why the player should care about that consequence;
- how it connects to the character/system that needs the player's help;
- which formal concept, if any, it later bridges into.

For the current reference, this means the player should understand Pip/courier, workshop, footbridge, bridge gear, ticket/job identity and reply/acknowledgement before later retry abstractions depend on them. A generated database, networking, history, physics, finance or language game needs its own subject-faithful object/actor inventory rather than copying those nouns.

Prefer a **causal presentation plan** for this inventory: short animation, interactive reveal, object inspection, before/after state, direct manipulation or a playable tutorial beat. A glossary/card wall is a fallback, not the default. The player should see an object perform its function or see the consequence of its absence when feasible. Keep a concise in-world reference/HUD key available after the tutorial if later decisions depend on the terminology.

The generated verification package must include explicit first-chapter comprehension assertions: the relevant object/function/stakes/character-need relationships are present in the rendered journey, not merely hidden in source metadata or optional long-form text. This is a presentation/coverage gate; automated presence checks do not claim human comprehension.

## Additional required generated contracts

The original CourseBrief and full package contracts remain. Extend them with:

- Audience assumptions, reading/prior-knowledge requirements, interaction constraints and permitted rendering capabilities.
- A **course-outcome coverage ledger** mapping outcome -> prerequisite -> mechanic -> decision -> feedback -> varied practice -> fresh transfer -> delayed retrieval -> evidence limits. Unsupported or unassessed outcomes must be explicit.
- A **world-model ledger for the first chapter** mapping important actor/object/state -> plain meaning -> function -> visible consequence -> stakes -> character/system need -> later formal concept -> presentation beat -> verification evidence.
- A **commercial-game experience contract** covering opening hook, primary playfield, HUD/menu/pause/save/resume behavior, input acknowledgement, consequence presentation, failure/recovery, progression, earned ending, replay variation and accessibility equivalents.
- A reason the player would voluntarily continue with XP hidden, initial hook/meaningful action, opportunities for discovery and consequential alternatives, failure/recovery rules, earned ending and a real reasoning-changing replay variation.
- A deliberate confidence curve and interface/vocabulary disclosure: every boss rule and interaction must have been taught or explicitly belong to a justified transfer challenge, not appear as an accidental new prerequisite.
- A renderer-neutral gameplay contract. 2D, semantic interfaces and 3D are presentation choices, not learning evidence. Select Three.js or another renderer only when it improves the learning action; do not force all subjects into a delivery story or spatial world.
- Renderer failure/recovery, stable input, keyboard/touch, reduced motion, load/performance budgets and equivalent required actions without fragile graphics. Scene animation never directly creates an assessment result.
- Exact candidate/version, executable fixtures, real rendered review evidence, raw scores/weights, reviewer method and limitations, open blockers and release status.

The original provenance, learning/assessment bindings, competency identity/migration, course-independent learner evidence, assistance distinctions, reward separation, immutable release, persistence/resume and learner isolation requirements remain intact.

## Generated progression must create agency

Generated progression is not merely a lesson list with locks. The player-facing loop should resemble:

`understand situation -> act -> observe causal consequence -> form/update hypothesis -> gain/use capability -> face harder variation -> recover/adjust -> earn resolution`

New tools/mechanics should increase what the player can do. Difficulty should rise through reasoning, uncertainty, reduced scaffolding, transfer and combination rather than through more reading, larger forms or unexplained UI. Bosses must recombine taught rules/interactions unless a new element is explicitly justified as transfer. Replays must change reasoning/strategy, not only names/colors.

Menus, pause/resume, save/load, help and settings are part of the game experience and should not throw the learner into implementation/admin vocabulary. Underlying evidence controls may remain rigorous and quiet. Authentication/recovery surfaces should also preserve the game's visual/narrative continuity rather than unnecessarily dropping the learner into generic SaaS chrome, while security/auth semantics remain conventional and clear.

## Validation and repair

Structural/learning, content/source grounding, assessment integrity and accessibility validators must pass independently of the game score. Review actual rendered interaction, not only package JSON. The game critic must assess both audience lenses and the complete loop with XP hidden, score the unchanged rubric and reject below 9.0 or with any critical blocker.

The critic must explicitly ask whether the candidate has crossed from **"gamified learning website"** to **"actual learning game"** at a credible commercial quality bar. Passing should require defensible first-minute comprehension, first-chapter world-model coverage, player agency, world/state consequences, responsive game feel, coherent progression and an earned resolution—not simply attractive styling or educational correctness.

Course completion cannot claim measured mastery without the ledger's appropriate evidence. Repeated guided feedback is not fresh independent assessment; delayed retrieval cannot be inferred from immediate clears. Comparator/course-effectiveness claims require suitable learner evaluation and must remain unvalidated until then.

Keep the original bounded repair budget. Failed candidates remain `draft_needs_review`; never quietly lower thresholds or relabel schema-valid output as a validated game. A critic >=9.0 may only produce `ready_for_user_review`. **Explicit user acceptance is required for `user_accepted`; explicit rejection overrides every critic score and reopens repair.** External testing and broader rollout require later user authorization after acceptance plus existing hosting/security gates.

## Current implementation boundary

The current reference is Phase 1 gameplay refinement, not an implemented adaptive course generator. No Phase 2+, new model integrations, public rollout or paid infrastructure is opened by this amendment. Preserve historical snapshots and the checksummed package.