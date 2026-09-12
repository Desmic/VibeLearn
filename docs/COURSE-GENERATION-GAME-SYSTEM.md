# Course generation produces playable teaching systems

**Current authority — updated 12 September 2026.** Read root `CODEX-IMPLEMENTATION-PLAN.md`, `GAME-RUNTIME-ARCHITECTURE.md`, `STORY-GENERATION-AND-CRITIC.md`, `GAME-AS-COURSE.md`, `GAME-UX-SYSTEM.md`, `GAME-UX-REVIEW.md`, and `STATE.md`.

## North star

VibeLearn is a **general system for generating effective learning games/worlds from arbitrary concepts and subjects**.

The generator's job is not to write themed lessons or emit a fresh site/app shell per course. It must transform learning intent into a playable system whose mechanics, world behavior, progression and transfer tasks embody the target capability.

The durable pipeline is:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains authoritative and engine-independent.

Relay Rescue/Echo Forge is one authored reference, not the schema every generated game must resemble.

## Generated package model

### 1. LearningSpec

Canonical competency IDs, prerequisites, intended outcomes, source/provenance constraints, misconceptions, assessment criteria, transfer/retrieval requirements and allowed assistance.

LearningSpec is durable identity. It cannot depend on a story noun, art style, engine, renderer or asset package.

### 2. StoryWorldSpec

Premise, characters, locations, world rules, emotional arc, important objects/resources, stakes, chapter progression and mappings from world semantics to LearningSpec.

StoryWorldSpec is engine-agnostic.

### 3. GameDesignSpec

Core loop, player verbs, mechanics, challenge/mission graph, progression/difficulty curve, failure/recovery, rewards/payoff, tutorial/scaffolding policy, information schedule and mappings from mechanics to intended learning.

A lesson page plus graphics is not a valid GameDesignSpec.

### 4. WorldSpec

Engine-neutral executable world structure:

- scenes/zones;
- entities and stable semantic IDs;
- components/properties;
- transforms/hierarchy;
- visual/audio asset refs;
- colliders/physics intent;
- animation/state-machine intent;
- cameras/compositions;
- lights/environment;
- semantic interactions;
- triggers/conditions;
- pathing/navigation intent;
- effects;
- spawn/despawn rules;
- world variables;
- reusable prefab/archetype references.

WorldSpec says what exists and how it behaves, not which PlayCanvas/Unity/Unreal API constructs it.

### 5. RuntimeExperienceSpec

Cross-engine orchestration:

- game modes/state transitions;
- active world/scene;
- input/action mapping;
- HUD/UI slots and visibility schedule;
- pause/replay/save/resume;
- accessibility/reduced-motion policy;
- device/performance budget;
- authoritative state -> visible state mappings;
- analytics/evidence hooks that do not decide learning truth.

### 6. EngineTargetSpec

Declares target capabilities and constraints such as platform, 2D/3D, physics, animation, input, WebGPU, memory/startup budget and deployment cost.

The generator may adapt game realization to the selected engine profile rather than assuming every engine offers identical capabilities.

### 7. AssessmentEvidenceSpec

Observable actions/results that support learning claims, scoring boundaries, transfer/delayed-retrieval requirements, assistance/exposure semantics, evidence identity and what stays `unknown`.

Engine state does not establish mastery by itself.

## Authoring pipeline

`goal/course -> source research -> LearningSpec -> StoryWorldSpec -> story critic -> GameDesignSpec -> WorldSpec + RuntimeExperienceSpec -> capability/schema validation -> engine compilation -> runtime verification -> first-touch critic -> whole-game critic -> learning/transfer gate -> learner review -> publish`

The generator cannot self-certify a stage.

## Engine strategy

### PlayCanvas Engine first

PlayCanvas is the first strategic backend because current delivery is web/phone-first and generated games need real engine primitives: entities/components, animation, physics, input, audio, assets and modern WebGL/WebGPU rendering.

Use the PlayCanvas Engine programmatically. The editor may assist authoring/debugging but editor project state must not become canonical generated state.

### Three.js migration only

Three.js is no longer a strategic generated-world target. Current Story3D code may be used as a behavior/reference baseline while Echo Forge migrates.

Do not make future specs depend on Three.js APIs/classes or continue building a home-grown Three.js game engine.

### Future engines

Unity, Unreal, specialized 2D engines and simulation runtimes may later become backends when their quality/capabilities justify deployment cost.

Adding an engine must not require rewriting LearningSpec or AssessmentEvidenceSpec.

## Engine compiler contract

An engine backend consumes validated specs/assets and produces an `EngineArtifactBundle` / runtime binding.

Backend capability surface should include approximately:

- world load/unload;
- entity instantiate/destroy;
- state synchronization;
- animation/effects/audio;
- camera control;
- physics/collision;
- semantic interaction binding;
- HUD/UI binding;
- input mapping;
- pause/resume;
- presentation-state save/restore;
- performance/failure reporting;
- cleanup/disposal.

Backend code never owns canonical learning IDs, assessment rules or learner mastery.

## Reusable primitive/archetype library

Fast generation requires composition above raw engine APIs.

Build versioned engine-neutral primitives from real game needs, such as:

- interactable;
- resource/collectible;
- inventory;
- switch/control;
- movable/rotatable/attachable object;
- route/network;
- timer/cooldown;
- simulation meter/variable;
- dialogue/character response;
- NPC state machine;
- trigger zone;
- puzzle constraint;
- build/crafting slot;
- flow/projectile/message;
- camera/cinematic beat;
- mission objective;
- success/failure consequence;
- semantic HUD indicator.

Reusable archetypes may compose these into characters, machines, resource-flow systems, networks, puzzle boards, environment zones and dialogue NPCs.

The same semantic primitive can compile differently on different engines.

Do not speculatively create a universal engine. Expand from concrete learning-game requirements.

## Assets

WorldSpec references versioned portable `AssetRef`s rather than engine-native object identity.

Track:

- id/version/hash;
- semantic role;
- provenance/license;
- source format;
- derived engine variants;
- size/performance metadata.

Prefer portable interchange formats such as glTF where practical.

## Inputs: current vs future

Current generation uses course/subject intent, intended outcomes/prerequisites, source-grounded causal structure and explicitly known learner-level constraints.

Future explicit `StoryPreferenceProfile` may influence genre, fantasy/realism, tone, characters, visual style, humor/darkness, pace and exploration/action balance.

Preference changes may regenerate story/game/world specs but must not silently alter canonical learning/evidence meaning.

## Story generation gate

Generate one frozen story candidate at a time under `STORY-GENERATION-AND-CRITIC.md`.

Story critic must reach unrounded **>=9.0/10 with no blocker** before game realization.

A failed story is revised as story. Do not hide weak storytelling under rendering sophistication or curriculum correctness.

## First chapter contract

Chapter 1 must build the learner's world model with low initial cognitive load.

Default curve:

`hook/world -> character/world desire -> concrete need -> obvious action -> visible consequence -> easy recovery/success -> formal concept -> variation -> combination -> transfer`

Prefer action, environmental storytelling, direct manipulation and visible consequences over exposition cards.

First-run progression is user-paced by default. Back/Continue/Skip/Replay/progress are required where applicable; Pause/Resume while motion runs; reduced motion preserves meaning/navigation.

## Game generation and progression

Generate a campaign/progression graph, not a lesson list.

Difficulty increases through reasoning, transfer, uncertainty, trade-offs, interacting rules, reduced scaffolding and agency—not longer prompts or denser dashboards.

Use mechanics that embody subject thinking: manipulate, choose, arrange, simulate, compare, construct, trace, classify, debug, sequence, explore, negotiate or trade off when appropriate.

As complexity rises, preserve established world objects/system behavior where they still carry the concrete model.

## HUD / visibility generation

Every RuntimeExperienceSpec answers:

- what must be visible now;
- what is deferred;
- what appears after discovery/success;
- what is secondary/collapsible;
- what semantic action each control represents;
- how phone/safe-area/accessibility budgets are met.

Opening screens avoid dashboard density.

## Quality gates

### First-touch magic >=9

Judge fresh first 60–90 seconds for beauty/hook, curiosity, character/world attachment, causal clarity, low cognitive load, pacing/navigation control, obvious first action and story-to-play transition.

### Whole-game/chapter >=9

Judge story-to-play continuity, agency, progression, challenge, recovery, payoff, forward pull, commercial-game cohesion and learning integration.

Explicitly penalize reverting to course-site UI when reasoning becomes harder.

### Learning / transfer >=9

After game gates pass, verify that meaningful play actually teaches/assesses LearningSpec through purposeful practice, misconception handling, unassisted success, hint dependence, fresh transfer and delayed retrieval where claimed.

Critic scores never override direct user rejection.

## Evidence invariants

Generated games preserve:

- canonical competency identity independent of story/engine;
- pinned assessment/content versions;
- `unknown` distinct from failure;
- current assistance distinct from prior exposure;
- XP distinct from mastery;
- submitted evidence immutability;
- learner isolation;
- engine/story replacement without losing legitimate history.

## Phone-first target

Initial generated games optimize important first-touch/Chapter 1 flows for mainstream Android/iPhone portrait use, roughly **360–430 CSS px** wide with touch, safe areas, text enlargement and reduced motion.

EngineTargetSpec/RuntimeExperienceSpec must carry explicit performance and interaction budgets.

## Validation / repair loop

Keep validators separate:

1. schema/coverage;
2. source/grounding correctness;
3. story quality;
4. game-design coherence;
5. WorldSpec/runtime capability validity;
6. engine compilation/runtime integrity;
7. first-touch quality;
8. whole-game quality;
9. accessibility/device interaction;
10. assessment/evidence integrity;
11. learning/transfer.

Never lower a rubric or delete a failing test to advance.

## Portability acceptance

Once a second engine backend exists, require proof that:

- one engine-neutral WorldSpec compiles to both backends;
- LearningSpec/AssessmentEvidenceSpec remain unchanged;
- semantic action IDs remain stable;
- game state serializes independently of engine object identity;
- engine swap preserves legitimate learner history;
- backend code contains no course-specific learning rules.

## Security boundary

Generated specs/data do not authorize arbitrary generated code execution.

Prefer schema validation, allowlisted/versioned primitives, immutable artifacts, asset validation, capability validation, strict CSP/no eval and provenance linking exact specs to exact engine artifacts.

Custom engine code is an exceptional later extension path, not normal course generation output.

## Current implementation boundary

Current work remains private Phase 1 architecture/reference refinement.

Immediate work is to define the engine-neutral schemas/compiler boundary, establish PlayCanvas as the first backend, prove spec-driven generation with two small worlds, then port Echo Forge incrementally while preserving existing evidence/save/auth semantics.
