# Game runtime architecture — engine-neutral world/game compiler

**Status:** authoritative strategic architecture · 12 September 2026  
**Read with:** root `CODEX-IMPLEMENTATION-PLAN.md`, `STATE.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `GAME-AS-COURSE.md`, and `GAME-UX-SYSTEM.md`.

## Decision

VibeLearn is not a Three.js application and must not evolve into a home-grown Three.js game engine.

The product objective is to **generate high-quality learning games/worlds on demand for arbitrary concepts and subjects**. Therefore the durable architecture must sit above any particular renderer or commercial/open-source game engine.

The strategic hierarchy is:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

The first strategic engine target is **PlayCanvas Engine** because VibeLearn is currently browser/phone-first and needs a real web game engine with entities/components, animation, physics, input, audio, assets and WebGL/WebGPU support.

Three.js is now a **legacy/migration backend only**. Do not invest further in turning the Story3D layer into a general game engine except where required to preserve the current reference experience during migration.

Future engines may include Unity, Unreal or other runtimes. Adding one must not require changing canonical learning, story, game-design or evidence identity.

## Why this architecture exists

The long-term task is not “render different fantasy scenes.” It is:

> Given a learning objective, sources and learner state, generate a game that teaches the target capability through meaningful play, then run that game safely on an appropriate engine/runtime.

That requires a reusable **world/game framework expressed as specs**, plus engine compilers/adapters.

If a generated game requires the model to repeatedly write renderer loops, physics glue, input plumbing, scene lifecycle code or engine-specific state management, the architecture has failed.

## Canonical pipeline

### 1. LearningSpec

Owns durable pedagogical identity:

- competencies and canonical IDs;
- prerequisites;
- source/provenance constraints;
- misconceptions;
- intended outcomes;
- transfer/retrieval requirements;
- assessment/evidence requirements.

It is engine-, story- and art-independent.

### 2. StoryWorldSpec

Owns semantic fiction/world meaning:

- premise and fantasy;
- characters/actors;
- locations;
- causal world rules;
- important resources/objects;
- stakes and progression;
- mappings from fictional/world behavior back to real concepts.

It contains **no PlayCanvas/Three.js/Unity/Unreal implementation objects**.

### 3. GameDesignSpec

Owns actual play:

- core loop;
- mechanics;
- mission/challenge graph;
- progression and difficulty curve;
- player verbs;
- failure/recovery;
- rewards/payoff;
- exploration/build/combat/simulation/puzzle modes where justified;
- tutorial/scaffolding policy;
- HUD/information schedule;
- mappings from mechanics to learning outcomes.

A lesson page with a renderer is not a valid GameDesignSpec.

### 4. WorldSpec

Engine-neutral executable world description.

It should describe reusable game primitives such as:

- scenes/zones;
- entities and stable semantic IDs;
- components/properties;
- transforms/hierarchy;
- visual/audio asset references;
- colliders and physics intent;
- animation/state-machine intent;
- cameras and compositions;
- lights/environment;
- interactions and semantic action IDs;
- triggers/conditions;
- navigation/pathing intent;
- effects;
- spawn/despawn rules;
- persistent world variables;
- authored/generated prefabs/archetypes.

WorldSpec states **what exists and how it behaves**, not how a particular engine API constructs it.

### 5. RuntimeExperienceSpec

Owns cross-engine runtime orchestration:

- mode/state transitions;
- active scene/world package;
- HUD and semantic UI slots;
- input/action mapping;
- pause/replay/save/resume;
- accessibility/reduced-motion policy;
- performance/device budget;
- authoritative-game-state -> visible-world-state mappings;
- analytics/evidence event hooks that do not decide learning truth.

This replaces the old architectural meaning of “Play Canvas.” Existing `play-canvas*.js` names are migration implementation details, not the long-term product abstraction.

### 6. AssessmentEvidenceSpec

Owns evidence semantics and remains outside engine truth:

- observable evidence;
- assistance/exposure semantics;
- transfer/retrieval claims;
- scoring limits;
- what remains unknown.

No engine animation, collision or client state alone establishes mastery.

## EngineCompiler contract

An engine backend consumes the engine-neutral specs and produces a runnable artifact/runtime binding.

Conceptually:

```text
compile({
  storyWorldSpec,
  gameDesignSpec,
  worldSpec,
  runtimeExperienceSpec,
  engineTarget,
  assetManifest
}) -> EngineArtifactBundle
```

Every backend must expose a common capability surface approximately like:

- load/unload world;
- instantiate/destroy entity;
- set/get world state;
- play animation/effect/audio;
- camera transition;
- physics/collision hooks;
- semantic interaction binding;
- HUD/UI binding;
- pause/resume;
- save/restore presentation state;
- performance stats;
- failure/fallback reporting;
- dispose/cleanup.

Engine adapters never own canonical learning IDs, assessment rules or learner mastery.

## Engine capability profiles

Not every generated game must target every engine.

`EngineTargetSpec` should advertise capabilities and constraints, for example:

```text
id: playcanvas-web
platforms: [web, mobile-browser, desktop-browser]
capabilities:
  2d: true
  3d: true
  physics3d: true
  skeletalAnimation: true
  audio3d: true
  webgpu: true
  touch: true
  gamepad: true
limits:
  bundleBudgetMb: ...
  memoryBudgetMb: ...
  startupBudgetMs: ...
```

The generator/compiler chooses mechanics and realization compatible with the target rather than assuming one engine can express every game equally well.

## Primary backend: PlayCanvas Engine

PlayCanvas becomes the first strategic engine backend.

Reasons:

- browser-native runtime;
- WebGL2 + WebGPU;
- entity/component game architecture;
- animation system;
- physics integration;
- mouse/touch/gamepad input;
- audio;
- asynchronous glTF-oriented asset system;
- JavaScript/TypeScript integration;
- open-source engine suitable for direct/runtime-driven generation;
- smaller web/runtime impedance than compiling a large native engine for every generated lesson-game.

VibeLearn should use the **PlayCanvas Engine programmatically**, with the Editor optional for authoring/debugging rather than making editor project state canonical.

## Three.js migration status

Current Echo Forge/Relay Rescue work uses:

- `story3d-runtime.js`;
- `story3d-world-host.js`;
- `rescue-story3d.js`;
- `play-canvas.js` and migration shims.

These remain valid reference/migration code but are no longer the desired framework foundation.

Rules from this point:

1. no new generic engine features should be built on Three.js unless needed for safe migration;
2. no future generated-world contract may depend on Three.js classes/API names;
3. extract useful semantic concepts into WorldSpec/RuntimeExperienceSpec;
4. implement equivalent PlayCanvas backend behavior;
5. move Echo Forge onto PlayCanvas incrementally;
6. delete/decommission Three.js runtime infrastructure after parity and critic verification.

## Fast world/game construction from specs

The framework should optimize for this workflow:

```text
learning goal
  -> LearningSpec
  -> story/world candidate
  -> GameDesignSpec
  -> WorldSpec + RuntimeExperienceSpec
  -> validate schemas/capabilities
  -> compile PlayCanvas artifact
  -> run automated mechanic/world checks
  -> run game critic
  -> run learning/transfer critic
  -> publish immutable version
```

A generated game should be mostly **data/spec + assets**, not generated engine glue.

### Reusable primitive library

Build a versioned library of engine-neutral game primitives only as real games demand them, e.g.:

- interactable;
- collectible/resource;
- inventory;
- switch/lever/control;
- movable/rotatable/attachable object;
- path/route/network;
- timer/cooldown;
- health/energy/pressure/temperature-style meters;
- dialogue/character response;
- NPC state machine;
- trigger zone;
- puzzle constraint;
- crafting/build slots;
- simulation variable;
- projectile/flow/message;
- camera focus/cinematic beat;
- quest/mission objective;
- success/failure consequence;
- semantic HUD indicator.

The same semantic primitive may compile differently on PlayCanvas, Unity or Unreal.

## Prefabs/archetypes

Generated worlds need composition above raw entities.

Define engine-neutral versioned archetypes such as:

```text
CharacterArchetype
InteractiveMachineArchetype
TransportNetworkArchetype
PuzzleBoardArchetype
ResourceFlowArchetype
EnvironmentZoneArchetype
DialogueNPCArchetype
```

Archetypes expand into WorldSpec primitives and can be themed through assets/properties without changing learning identity.

Do not create a speculative universal engine. Add primitives/archetypes from concrete learning-game needs and keep the spec versioned.

## Assets

Asset generation/acquisition is a separate pipeline from world semantics.

WorldSpec should reference immutable `AssetRef`s with:

- id/version/hash;
- type;
- provenance/license;
- engine-neutral semantic role;
- source format;
- derived engine variants;
- size/performance metadata;
- safety/moderation status where applicable.

Prefer portable interchange formats where practical (for example glTF for 3D) so assets are not permanently locked to one engine.

## Unity / Unreal later

The engine-neutral layer exists specifically so higher-end runtimes can be introduced when they provide enough value.

Possible future targets:

- Unity for richer native/mobile/desktop experiences, mature tooling and broad ecosystem;
- Unreal for high-fidelity worlds, advanced rendering and potentially streamed experiences;
- specialized 2D engines for lightweight concepts;
- simulation-specific runtimes.

Do not prematurely force feature parity across engines. Each backend declares capabilities and deployment costs. The generator selects or adapts a design accordingly.

Web/phone remains the current delivery priority, so PlayCanvas is the practical first engine.

## Portability acceptance tests

The architecture is not engine-neutral merely because interfaces exist.

Require tests proving:

1. canonical LearningSpec/AssessmentEvidenceSpec are unchanged when switching engine target;
2. one synthetic WorldSpec compiles to at least two backends once a second backend exists;
3. backend code contains no course-specific competency IDs/rules;
4. game state can be serialized independently of renderer object identity;
5. replacing engine/world package preserves legitimate learner history;
6. semantic action IDs remain stable across backends;
7. critic/evidence pipelines consume engine-neutral observations;
8. engine failure cannot silently create learning evidence.

## Security boundary

Generated specs/data are not permission to execute arbitrary generated code.

Prefer:

- validated schemas;
- allowlisted/versioned primitives/components;
- immutable artifacts;
- asset validation;
- capability validation;
- no eval/remote script injection;
- sandboxed extension points when custom behavior is eventually necessary;
- provenance linking generated specs to exact compiled artifacts.

Custom engine-specific code is an exceptional capability with stronger review/sandbox requirements, not normal course generation output.

## Immediate implementation order

1. freeze further Three.js framework expansion;
2. rename the architectural abstraction from internal “Play Canvas” to `RuntimeExperience` / game runtime surface in docs and new code;
3. define versioned schemas for `GameDesignSpec`, `WorldSpec`, `RuntimeExperienceSpec`, `EngineTargetSpec` and `AssetRef`;
4. define `EngineCompiler` / runtime adapter interfaces;
5. add PlayCanvas Engine as the first backend;
6. build a tiny generated/spec-driven PlayCanvas vertical slice proving entity, interaction, camera, HUD, state and save mappings;
7. compile a synthetic second world from the same schema without backend-core edits;
8. port Echo Forge opening + Signal 1 to the PlayCanvas backend;
9. compare experience/performance/authoring friction against the Three.js predecessor;
10. migrate later signals only after the backend/spec seam is proven;
11. remove Three.js dependencies after equivalent behavior, tests and critic quality are achieved.

## Quality invariant

Engine architecture is infrastructure, not product quality.

PlayCanvas, Unity or Unreal earns zero critic points by itself. The generated game still must independently pass story, first-touch, whole-game and learning/transfer gates, followed by the user's review.
