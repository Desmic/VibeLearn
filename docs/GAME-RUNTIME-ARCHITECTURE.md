# Game runtime architecture — engine-neutral game/world compiler

**Current implementation checkpoint — 19 September 2026:** PlayCanvas Engine is the active backend; Three.js and older 2D/2.5D paths are legacy/migration only. The reusable physicality/event/semantic-object/handoff/tutorial/mode contracts are exercised by frozen candidate `92a5ecbdc803362ee1554fca6ae811adb155bc26`. The thin Terminal PM adapter Phase 0 is merged, but its external orchestrator still reports `live_run_authorized=false`; no live orchestration run is authorized. The next product gate is independent criticism, not more runtime architecture.

**Active architecture — 17 September 2026.** Read `GAME-CREATION-PLATFORM.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `GAME-OPENING-PROGRESSION.md`, `REUSABLE-ASSETS.md`, `ART-WORLD-DIRECTION-CRITIC.md` and `STATE.md`.

## Decision

VibeLearn is a **platform for rapidly creating learning games**, not a PlayCanvas/Three.js application and not a single authored campaign.

The durable architecture sits above the renderer/engine:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec -> WorldSpec -> RuntimeExperienceSpec -> EngineTargetSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains a separate authority.

PlayCanvas Engine is the current browser/phone-first backend. Three.js is legacy/migration only. Future backends may include Unity, Unreal, specialized 2D engines or simulation runtimes without rewriting canonical learning/evidence identity.

## Why this architecture exists

Given a learning objective, sources and learner state, VibeLearn should be able to assemble a game from versioned specs, reusable mechanics/world kits and approved assets, then compile/run it on an appropriate engine.

If every new course requires fresh renderer loops, camera glue, input plumbing, save lifecycle or bespoke UI architecture, the platform has failed.

## Canonical specs

### LearningSpec

Owns competency IDs, prerequisites, sources/provenance, intended outcomes, misconceptions, transfer/retrieval requirements and assessment constraints. Engine/story/art independent.

### StoryWorldSpec

Owns premise, protagonist/cast, locations, world rules, causal events, stakes, progression and concept mappings.

**Required explicit field: player embodiment.** Declare who/what the player controls. Examples: direct protagonist, separate avatar, external guide/cursor, strategy controller. Do not infer a helper avatar from second-person story wording.

For the current proof track: direct robot protagonist control.

### GameDesignSpec

Owns core loop, verbs, mechanics, mission graph, progression/difficulty, failure/recovery, payoff, tutorial/scaffolding, information schedule and mappings to learning.

It explicitly declares:

- prologue/opening boundary;
- separate tutorial boundary when onboarding is required;
- guaranteed first success;
- Level 1/first-mission start;
- scaffolding fade;
- transfer/challenge structure;
- player embodiment mode.

### GameRulesSpec

Owns deterministic gameplay truth independently of rendering/assessment:

- typed game state/resources;
- semantic actions/preconditions;
- deterministic transitions/effects;
- objectives/invariants;
- game events;
- seeded randomness where needed;
- serialization/replay/versioning.

No arbitrary generated code is required for ordinary generated games.

### WorldSpec

Engine-neutral world description:

- scenes/zones;
- entities/stable semantic IDs;
- components/properties;
- transforms/hierarchy;
- asset references;
- colliders/physics intent;
- animation/state intent;
- cameras/compositions;
- lights/environment states;
- interactions/action IDs;
- triggers/conditions;
- navigation/pathing;
- effects;
- spawn/despawn;
- persistent world variables;
- prefabs/archetypes.

#### Spatial layout is first-class data

The September 17 review found the current world too congested. WorldSpec/layout tooling must support:

- playable footprint/scale;
- prop/actor density;
- negative-space budgets;
- landmark spacing;
- path width;
- zone/room dimensions;
- camera clearance/occlusion margins;
- focal-object limits;
- phone/desktop composition targets.

A world should be able to become larger/calmer without rewriting its game rules.

### RuntimeExperienceSpec

Owns cross-engine orchestration:

- mode/state transitions;
- active world/zone;
- input/action mapping;
- direct-control/NPC profiles;
- HUD/UI slots/visibility schedule;
- pause/replay/save/resume/reset/logout;
- accessibility/reduced-motion policy;
- performance/device budgets;
- authoritative state -> visible state mappings;
- analytics/evidence hooks that do not decide learning truth.

### EngineTargetSpec

Declares engine/platform capabilities/constraints: 2D/3D, physics, animation, input, touch/gamepad, audio, memory/startup/bundle budgets, deployment cost.

### AssessmentEvidenceSpec

Owns evidence semantics: observable evidence, assistance/exposure, transfer/retrieval claims, scoring limits and unknown state. Renderer/game completion does not establish mastery.

## EngineCompiler contract

Conceptually:

```text
compile({
  storyWorldSpec,
  gameDesignSpec,
  gameRulesSpec,
  worldSpec,
  runtimeExperienceSpec,
  engineTarget,
  assetManifest
}) -> EngineArtifactBundle
```

Backends expose common capabilities such as:

- load/unload world;
- instantiate/destroy entity;
- set/get visible world state;
- animation/effects/audio;
- camera transitions;
- physics/collision;
- semantic interaction binding;
- HUD/input binding;
- pause/replay;
- save/restore presentation state;
- performance/failure reporting;
- cleanup/disposal.

Backend code never owns canonical learning/mastery rules.

## Current backend: PlayCanvas Engine

PlayCanvas remains the first strategic backend because it is browser-native and provides real game primitives: entity/components, animation, physics, input, audio, glTF assets and WebGL/WebGPU.

Use the engine programmatically. Editor state is optional authoring/debugging, not canonical generated state.

No silent 2D gameplay fallback. Engine/module/context failure blocks gameplay and offers explicit recovery while preserving progression.

## Reusable primitive/archetype layer

Fast game creation needs composition above raw engine entities. Build only from real game needs.

Reusable primitives/archetypes may include:

- interactable;
- resource/collectible;
- repair/connection station;
- scanner/inspector;
- switch/control;
- route/network;
- door/gate/room;
- trigger zone;
- puzzle/build slot;
- dialogue/NPC response;
- character control profile;
- camera/cinematic beat;
- teleport/displacement transition;
- blackout/light-reveal state;
- weather/thunder effect;
- mission objective;
- success/failure consequence;
- semantic HUD indicator;
- tutorial/scaffolding step.

Archetypes are themed/laid out through data. Reuse should not force identical worlds.

## Assets

WorldSpec references versioned immutable AssetRefs with:

- id/version/hash;
- type/semantic role;
- provenance/license;
- source/derived formats;
- scale/bounds/normalization;
- animation aliases;
- performance metadata.

Art direction remains separate from asset validity. `ART-WORLD-DIRECTION-CRITIC.md` checks whether reused assets form a coherent, spacious, readable world.

## Cinematic/prologue support

The runtime should support reusable spec-driven cinematic states rather than one story controller per game:

- world baseline/establishing state;
- event/interruption;
- camera transition;
- lighting/environment transition;
- actor animation/reaction;
- timed/semantic cues;
- optional player interaction;
- persistent world-after patch;
- replay without progression mutation;
- reduced-motion equivalent;
- handoff into direct gameplay/tutorial.

The current proof track's happy-world -> disruption -> limbo -> prison reveal -> speech theft sequence should exercise these capabilities, but story nouns remain package data.

## Tutorial/progression support

Tutorial should be a reusable runtime/game-design stage separate from Level 1 when required:

- one obvious action at a time;
- movement/look/recenter introduction;
- interact/menu semantics;
- core mechanic practice;
- guaranteed success;
- assistance tracking;
- scaffolding fade;
- transition into first mission.

## Platform proof strategy

Do not build a speculative universal generator. Use the current LLM track to prove:

1. a compelling prologue;
2. reusable direct-control profile;
3. reusable spatial/layout parameters;
4. reusable cinematic transitions;
5. reusable tutorial/scaffolding;
6. Level 1 learning mechanic;
7. story/art/game/learning critic pipeline;
8. deployment/regression evidence.

Then demonstrate selected pieces in a materially different synthetic/second world before calling them general.

## Automation/orchestration integration

Longer term agents may own:

- source research;
- story/game ideation;
- art/world direction;
- learning design;
- world/spec construction;
- asset selection/generation;
- implementation/compiler work;
- story/art/game/learning critics;
- test generation;
- CI/CD/release orchestration;
- triage/repair proposals.

Agents exchange versioned specs/artifacts/evidence. Creator agents do not self-certify. Critic agents never establish user acceptance.

Phase 0 of the external-orchestrator boundary is now implemented and merged.
Live execution is still blocked by Terminal PM's own `live_run_authorized=false`
checkpoint. Preserve the boundary and do not add deeper coupling until that
policy changes or real integration evidence proves the thin contract insufficient.

## Portability acceptance

Once a second engine backend exists, prove:

- canonical learning/evidence specs unchanged across engine swap;
- one engine-neutral WorldSpec compiles to both backends;
- semantic action IDs stable;
- game state serializes independently of renderer identity;
- legitimate learner history survives world/engine replacement;
- backend core contains no course-specific competency rules.

## Security boundary

Generated specs/data do not authorize arbitrary generated code execution. Prefer validated schemas, allowlisted/versioned primitives, immutable artifacts, asset validation, CSP/no eval, capability checks and provenance.

## Quality invariant

Engine architecture earns zero product-quality points by itself. A generated game must independently pass:

- technical/accessibility;
- rendered story;
- art/world direction;
- first-touch/gameplay;
- whole-chapter/progression;
- learning/transfer;
- current-user review.

The current user review remains `needs_revision`; do not start Level 2 until the redesigned front-of-game candidate is accepted.

## Physicality contract

Collision belongs to WorldSpec entities/archetypes, not to a separate remembered
list on one player controller.

World entities may declare engine-neutral collider intent. The current first
implementation supports box colliders with player/camera blocking semantics.
Engine backends resolve colliders from the entity's live world transform and
enabled state.

Reusable props/architecture should carry their own physicality where appropriate.
A generated game should not need to remember that a visible station, wall or
closed gate also needs a second obstacle declaration.

Legacy player-profile obstacle lists may remain temporarily for migration, but
new generated content should prefer world-owned colliders.

## Major-event / cinematic-direction contract

StoryWorldSpec/GameDesignSpec should represent major events explicitly enough to
review/compile their direction, including:
- causal attribution;
- event importance;
- actor reactions;
- environment/light/atmosphere transition;
- VFX;
- audio/narration cue intent;
- camera/focus;
- persistent world-after state.

Not every engine backend must implement the same effect primitive, but every
compiled experience must preserve the semantic event intent.

## Semantic story-object contract

High-importance story/mechanic objects should carry semantic role plus a
readability strategy. Semantic IDs are not evidence that players understand an
object.

Reusable archetypes may encode visual/behavioral language for capabilities such
as power, communication, memory, access, damage or repair, but games remain free
to art-direct materially different representations.

## Experience-mode invariant

RuntimeExperienceSpec should model mutually exclusive experience modes such as:
`opening | handoff | tutorial | mission | result | paused/error`.

Each mode owns which HUD/story/action surfaces may be active. Cross-mode prompt
leakage is invalid runtime state.

Transitions should use a HandoffSpec-like contract containing:
- previous mode/event summary;
- player embodiment/control state;
- immediate objective;
- available verb/control;
- recommended next action;
- success signal;
- destination mode.

## Tutorial-step contract

Tutorials should compile from explicit steps rather than arbitrary copy.

Each step owns:
- id / taught verb;
- target/control;
- instruction;
- completion observation;
- feedback;
- next step;
- skip policy;
- evidence/assistance semantics.

The runtime should make the current target and completion observable so browser
tests and critics can verify the tutorial behavior without reading implementation
details.
