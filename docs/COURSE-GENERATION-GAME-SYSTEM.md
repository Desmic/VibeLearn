# Course generation produces playable teaching systems

**Active platform direction — 17 September 2026.** Read `GAME-CREATION-PLATFORM.md`, `GAME-OPENING-PROGRESSION.md`, `ART-WORLD-DIRECTION-CRITIC.md`, `CRITIC-POLICY.md` and `STATE.md`. This document defines how future generated games should be created; the current How-LLMs-Work track is the proof case, not the final product shape.

## North star

VibeLearn is a **general platform for rapidly creating high-quality learning games/worlds from arbitrary concepts and subjects**.

The generator's job is not to emit themed lesson pages or a fresh app shell per course. It must transform learning intent into a playable system whose story, world behavior, mechanics, progression and transfer tasks embody the target capability.

The durable pipeline is:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec -> WorldSpec -> RuntimeExperienceSpec -> EngineTargetSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains authoritative and engine-independent.

## Current proof-track strategy

Do **not** build the full generic generator/agent platform before the current proof track is excellent. Use the track to discover and validate reusable pieces, then extract them.

After each accepted chunk ask:

1. What remains authored story data?
2. What mechanic/runtime capability is reusable?
3. What asset/archetype/layout primitive can be parameterized?
4. What critic/test becomes a future invariant?
5. Can the reused piece produce a materially different game without copying this track's nouns, map or look?

## Generated package model

### 1. LearningSpec

Canonical competency IDs, prerequisites, intended outcomes, source/provenance constraints, misconceptions, assessment criteria, transfer/retrieval requirements and allowed assistance.

LearningSpec is durable identity. It cannot depend on story nouns, art style, engine or asset package.

### 2. StoryWorldSpec

Premise, characters, locations, world rules, emotional arc, important objects/resources, stakes, chapter progression and mappings from world semantics to LearningSpec.

It must also declare:

- **player embodiment**: who/what the player controls in the fiction;
- protagonist/cast roles;
- normal-world baseline before disruption where relevant;
- inciting event and causal chain;
- cultural/reference inspirations as optional design inputs, never required knowledge.

StoryWorldSpec is engine-agnostic.

### 3. GameDesignSpec

Core loop, player verbs, mechanics, challenge/mission graph, progression/difficulty curve, failure/recovery, rewards/payoff, tutorial/scaffolding policy, information schedule and mappings from mechanics to intended learning.

Required explicit fields include:

- player embodiment mode;
- prologue/opening boundary;
- separate tutorial boundary where onboarding is required;
- first guaranteed success;
- Level 1 / first-mission start condition;
- scaffolding-fade schedule;
- changed-context/transfer strategy.

A lesson page plus graphics is not a valid GameDesignSpec.

### 4. GameRulesSpec

Deterministic gameplay truth independently of rendering/assessment:

- typed game state/resources;
- semantic actions/preconditions;
- deterministic transitions/effects;
- invariants/objectives;
- game events;
- seeded randomness contracts;
- serialization/replay/versioning.

### 5. WorldSpec

Engine-neutral executable world structure:

- scenes/zones;
- entities and stable semantic IDs;
- components/properties;
- transforms/hierarchy;
- visual/audio asset refs;
- colliders/physics intent;
- animation/state-machine intent;
- cameras/compositions;
- lights/environment states;
- semantic interactions;
- triggers/conditions;
- pathing/navigation intent;
- effects;
- spawn/despawn rules;
- world variables;
- reusable prefab/archetype references.

**Spatial direction is part of WorldSpec**, not an afterthought. Include configurable:

- playable footprint/scale;
- prop/actor density;
- negative-space budgets;
- landmark spacing;
- path width;
- focal-object limits;
- camera/occlusion margins;
- phone/desktop composition targets.

A generated world should be able to get larger/calmer without rewriting its mechanics.

### 6. RuntimeExperienceSpec

Cross-engine orchestration:

- mode/state transitions;
- active scene/world;
- input/action mapping;
- protagonist/control profile;
- HUD/UI slots and visibility schedule;
- pause/replay/save/resume;
- accessibility/reduced-motion policy;
- device/performance budget;
- authoritative state -> visible state mappings;
- analytics/evidence hooks that do not decide learning truth.

### 7. EngineTargetSpec

Target capabilities/constraints: platform, 2D/3D, physics, animation, input, WebGPU, memory/startup budget and deployment cost.

### 8. AssessmentEvidenceSpec

Observable actions/results supporting learning claims, scoring boundaries, transfer/delayed-retrieval requirements, assistance/exposure semantics, evidence identity and what stays `unknown`.

Engine/game state never establishes mastery by itself.

## Reusable game-construction library

Fast generation requires composition above raw engine APIs.

Build versioned engine-neutral primitives only as real games demand them:

- interactable;
- collectible/resource;
- repair/connection point;
- scanner/inspector;
- switch/control;
- movable/attachable object;
- route/network;
- timer/cooldown;
- dialogue/character response;
- NPC state machine;
- trigger zone;
- puzzle constraint;
- build/crafting slot;
- flow/message;
- camera/cinematic beat;
- teleport/displacement transition;
- lighting/environment reveal;
- door/gate/room traversal;
- mission objective;
- success/failure consequence;
- semantic HUD indicator.

Reusable archetypes should include configurable characters, rooms, gates, environment zones, cinematic states, tutorial steps and interaction stations.

Reuse must support different scale/layout/material/lighting/story. Avoid template sameness.

## Asset strategy

WorldSpec references versioned portable `AssetRef`s with id/version/hash, semantic role, provenance/license, source/derived formats and performance metadata.

Prefer portable formats such as glTF where practical.

Asset reuse needs **art direction**, not merely availability. A pile of valid reused assets can still create a bad world.

## Story/cultural inspiration pipeline

Before freezing a story, research a small varied set of games, films, animation, literature, mythology and cultural works. Extract techniques:

- protagonist hook;
- naming rhythm;
- silhouettes/archetypes;
- inciting events;
- pacing/reversals;
- humor;
- environmental storytelling;
- payoff structure.

Then produce original characters, names, art, dialogue and music. Pop-culture-inspired wordplay/references may be explored but must be optional and non-essential to comprehension. Avoid confusingly derivative shipped characters/assets.

## Authoring pipeline

Current target pipeline:

`goal/course -> source research -> LearningSpec -> story/cultural research -> StoryWorldSpec candidates -> story critic -> art/world direction -> GameDesignSpec -> WorldSpec + RuntimeExperienceSpec -> capability/schema validation -> engine compilation -> mechanic/world tests -> rendered story critic -> art/world critic -> gameplay critics -> learning/transfer gate -> user review -> publish`

No stage self-certifies.

## Art/world-direction gate

Every generated game needs an art/world-direction review independent of gameplay/story scoring. It checks:

- spatial scale/negative space;
- density and focal hierarchy;
- character identity/silhouette;
- clipping/intersections from alternate cameras;
- landmarks/navigation readability;
- palette/material/lighting cohesion;
- atmosphere/state contrast;
- reusable-asset composition;
- phone/desktop framing;
- performance-aware visual ambition.

See `ART-WORLD-DIRECTION-CRITIC.md`.

## Opening/tutorial/progression default

For games that need onboarding:

`hook/normal world -> disruption/need -> player embodiment becomes clear -> prologue handoff -> separate tutorial -> guaranteed practice success -> Level 1/first mission -> recoverable challenge -> variation -> transfer`

Tutorial teaches reusable play grammar. Do not make Level 1 carry basic onboarding by default.

Difficulty rises through reasoning, uncertainty, trade-offs, interacting rules and reduced scaffolding—not longer prompts, denser dashboards or unexplained controls.

## Phone-first and spacious-world target

Current generated games optimize important first-touch flows for mainstream Android/iPhone portrait around 360–430 CSS px while remaining coherent on desktop.

Phone-first does **not** mean world-small. The world can be physically/spatially large while the camera/HUD remain readable. Generated layout should preserve breathing room and navigation clarity.

## Engine strategy

PlayCanvas Engine is the first strategic backend for web/phone-first delivery. Three.js remains legacy/migration only. Future Unity/Unreal/2D/simulation runtimes may become backends when justified.

Adding a backend must not rewrite LearningSpec, StoryWorldSpec or AssessmentEvidenceSpec.

## Quality gates

A candidate must independently pass:

1. technical/runtime/accessibility;
2. rendered story;
3. art/world direction;
4. first-touch/gameplay;
5. whole-chapter/progression;
6. learning/transfer;
7. current-user review.

Explicitly separate **visual attraction** from **willingness to play/continue**.

## Future agent system

The platform should eventually support agents for:

- research/source gathering;
- story/game ideation;
- art/world direction;
- learning design;
- game/world creation;
- asset selection/generation;
- story/art/game/learning critics;
- test generation;
- CI/CD/release orchestration;
- regression triage/repair.

Agents communicate through versioned specs/artifacts/evidence. Creator agents do not self-certify. Critic agents are internal, not user acceptance.

**This is future work.** Preserve agent-friendly boundaries now, but prioritize proving this pipeline manually/tool-assisted on the current excellent track before building the orchestration layer.

## Security/evidence invariants

Generated specs/data do not authorize arbitrary code execution. Prefer validated schemas, allowlisted/versioned primitives, immutable artifacts, asset validation, strict CSP/no eval and provenance.

Preserve canonical competency identity, pinned assessment/content versions, unknown distinct from failure, assistance/prior exposure semantics, XP distinct from mastery, immutable submitted evidence and learner isolation.

## Current implementation boundary

Private proof-track refinement. Build the revised prologue/tutorial/Level 1 in coherent chunks; do not start Level 2 or the full multi-agent generator until the current user accepts the proof direction.
