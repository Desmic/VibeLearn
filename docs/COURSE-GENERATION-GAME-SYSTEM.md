# Course generation produces playable teaching systems

Current authority — updated 9 September 2026. This amends the root implementation plan for future Phase 3/4; it does not open those phases. Read [GAME-AS-COURSE.md](GAME-AS-COURSE.md), [GAME-UX-SYSTEM.md](GAME-UX-SYSTEM.md), [GAME-ACCEPTANCE-9.md](GAME-ACCEPTANCE-9.md), and [STATE.md](STATE.md).

## Contract continuity and precedence

The detailed pre-existing generation specification remains preserved at [history/COURSE-GENERATION-before-game-as-course.md](history/COURSE-GENERATION-before-game-as-course.md). Its brief, package, schema, versioning, assistance, validation and repair requirements remain normative except where explicitly superseded here.

Current thresholds: unrounded **>=9.0/10** for game experience and learning/real-world transfer, no critical blocker, then explicit user acceptance. The current user's product verdict overrides machine/critic scores. Internal/tool-assisted review may be used during supervised refinement when a separate critic is unavailable, but future unattended generation does not gain unrestricted self-certification.

## The game is the course

Do not generate an ordinary lesson page, add XP, and call it a game. Generate an experience in which meaningful investigation, manipulation, construction, decisions and consequences exercise the intended capability. Explanations and coding tasks are legitimate when they develop or demonstrate the promised skill; arbitrary forms are not a universal mechanic.

## Attention-first onboarding contract

Generated courses now inherit a mandatory onboarding progression:

`beauty / curiosity -> character or concrete system -> immediate need -> one obvious action -> visible consequence -> easy success/recovery -> formal concept -> variation -> combination -> transfer`

The first playable minute should minimize unnecessary reading and terminology. It should create interest through visual composition, motion, sound-optional feedback, mystery, character, simulation, transformation, or another subject-appropriate hook. **Creativity and beauty earn attention first; cognitive load rises only after the player knows what the world is asking of them.**

This does not require every course to use Pip, a valley, a cinematic, or 3D. It does require an authored/generated opening that makes the scenario causally understandable. Suitable forms include short animation, playable incident, dialogue scene, simulation failure, visual construction, mystery, scientific event, professional scenario, or another interaction faithful to the topic.

Animation must teach causality or object/function relationships, not merely decorate the screen. Required meaning must survive reduced-motion mode.

## First-chapter world-model gate

Before the first/tutorial chapter completes, a fresh novice should be able to answer in plain language:

1. Who or what needs help?
2. What do they want to happen?
3. What are the important objects/resources/actors?
4. What does each important thing do?
5. What already happened before the player arrived?
6. What changed or became uncertain?
7. Why does the wrong action matter?
8. What is the player's first useful action?

The generator must explicitly represent those answers in its course brief/package and demonstrate them through play/visuals with modest reading demand. A glossary does not satisfy the gate. A long briefing does not satisfy the gate. A visually impressive scene that still leaves these questions unclear does not satisfy the gate.

For technical subjects, delay formal names until the learner has a concrete mental model when possible. Example pattern: first show “same order, same ticket, missing reply,” then name `idempotent retry`. Formal terminology should compress an understood model rather than create the model from scratch.

## Progressive cognitive-load contract

Difficulty growth must increase reasoning and agency, not just text length. Generated progression should usually follow:

- **Orient:** one obvious action, low vocabulary, highly legible consequence.
- **Confirm:** one easy success or recoverable error that teaches the local rule.
- **Vary:** change one dimension while preserving the interaction grammar.
- **Combine:** require two or more previously learned rules together.
- **Transfer:** move to a meaningfully different context with reduced scaffolding.
- **Retrieve later:** revisit the capability after delay where retention is claimed.

Every boss rule and UI operation must be taught or intentionally reserved for a justified transfer challenge. Do not accidentally increase load by introducing new controls, new vocabulary, and new domain rules at the same time.

## Additional required generated contracts

The original CourseBrief/full-package contracts remain. Extend them with:

- audience assumptions, reading/prior-knowledge requirements, interaction constraints and permitted rendering capabilities;
- a course-outcome coverage ledger mapping `outcome -> prerequisite -> mechanic -> decision -> feedback -> varied practice -> fresh transfer -> delayed retrieval -> evidence limits`;
- the opening hook and reason a player would voluntarily continue with XP hidden;
- a first-chapter world-model description containing actors, objects/resources, function, stakes, causal event and first action;
- cognitive-load stages and explicit vocabulary/tool disclosure points;
- meaningful alternatives, failure/recovery rules, earned ending and a reasoning-changing replay variation;
- renderer-neutral gameplay contracts and accessibility/fallback behavior;
- exact candidate/version, executable fixtures, rendered review evidence, raw scores, reviewer method, limitations and open blockers.

The original provenance, learning/assessment bindings, competency identity/migration, course-independent evidence, assistance distinctions, reward separation, immutable release, persistence/resume and learner-isolation requirements remain intact.

## Validation and repair

Structural/learning, source-grounding, assessment-integrity and accessibility validators pass independently of the game score. Review actual rendered interaction, not only package JSON.

The rendered critic must explicitly test the first minute and first chapter. It should be able to answer the eight world-model questions above and judge whether the opening feels like a credible game rather than a gamified website. If the reviewer must infer core story/object function from docs instead of the rendered experience, the candidate fails.

Keep the bounded repair budget. Failed candidates remain `draft_needs_review`; never lower thresholds or relabel schema-valid output as a validated game. The user retains final product judgment.

## Documentation feedback loop

If user feedback changes a design principle, onboarding/progression rule, UI direction, acceptance rule, or generation requirement, the responsible agent must update the affected repository docs in the same implementation unit. Future generation must inherit the latest accepted product direction rather than stale historical assumptions.

## Current implementation boundary

The current reference is private Phase 1 gameplay refinement, not an implemented adaptive course generator. No Phase 2+, new model integrations, public rollout or paid infrastructure is opened by this amendment.
