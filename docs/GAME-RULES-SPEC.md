# GameRulesSpec — portable deterministic gameplay semantics

**Status:** authoritative architecture contract · 12 September 2026  
**Read with:** `GAME-RUNTIME-ARCHITECTURE.md`, root `CODEX-IMPLEMENTATION-PLAN.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `GAME-AS-COURSE.md`, and `STATE.md`.

## Decision

VibeLearn cannot generate arbitrary learning games by generating a scene graph alone.

`WorldSpec` describes what exists in a world and how it can be presented. **GameRulesSpec** describes the portable gameplay state machine: what the player can do, when an action is valid, how authoritative game state changes, what invariants must hold, and what constitutes game success/failure.

The durable path is therefore:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec + WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains separate from gameplay and engine truth.

PlayCanvas is the Phase 1 engine backend. GameRulesSpec must not contain PlayCanvas, Three.js, Unity or Unreal API objects.

## Why this layer exists

Without GameRulesSpec, a generated game tends toward one of two bad outcomes:

1. **scene JSON plus bespoke code** — the model generates engine-specific JavaScript/C#/C++ for every game, making safety, testing, migration and reuse poor;
2. **renderer-driven truth** — collisions, animation callbacks or local UI state accidentally become the authoritative meaning of the game or learning evidence.

Neither supports VibeLearn's goal of quickly generating many high-quality learning games/worlds and eventually targeting multiple engines.

A portable rules layer gives us:

- deterministic simulation that can be tested without rendering;
- the same semantic actions across PlayCanvas/Unity/Unreal;
- stable save/replay identities independent of engine objects;
- reusable mechanics/archetypes;
- safe generation from validated data rather than arbitrary executable code;
- a clean mapping from game outcomes to assessment evidence without letting the renderer grade the learner.

## Responsibility split

### GameDesignSpec

Creative/system design intent:

- core loop;
- player verbs;
- challenge progression;
- difficulty curve;
- failure/recovery philosophy;
- rewards/payoff;
- tutorial/scaffolding policy;
- relationship between mechanics and learning outcomes.

It explains **why the game plays this way**.

### GameRulesSpec

Executable engine-neutral gameplay semantics:

- state variables;
- semantic actions;
- preconditions;
- deterministic transitions/effects;
- resources and inventories;
- timers/cooldowns where gameplay-significant;
- constraints/invariants;
- objectives;
- success/failure states;
- seeded randomness contracts;
- rule-emitted semantic events;
- serialization/versioning rules.

It explains **what happens when the player acts**.

### WorldSpec

Engine-neutral world realization:

- scenes/zones/entities;
- transforms/hierarchy;
- materials/assets;
- cameras/lights;
- collision/physics intent;
- animation/effect intent;
- interaction anchors;
- semantic object IDs;
- presentation states.

It explains **what exists and how game state can be represented spatially/visually**.

### RuntimeExperienceSpec

Cross-engine orchestration:

- active mode/world;
- input mapping;
- HUD slots;
- world-state -> presentation mapping;
- pause/replay;
- save/resume UX;
- device/performance/accessibility policy.

### AssessmentEvidenceSpec

Learning claims:

- which authoritative semantic actions/results can support which competency evidence;
- assistance/exposure semantics;
- fresh transfer/retrieval requirements;
- scoring limits;
- what remains unknown.

Game success does not automatically mean mastery.

## Version 1 shape

Phase 1 should start intentionally small. A conceptual package:

```yaml
schemaVersion: '1'
id: retry-safe-forge
version: '1'

state:
  ticket:
    type: enum
    values: [order-01, fresh]
    initial: order-01
  forgeEffects:
    type: integer
    initial: 1
    min: 0
  lookedAtForge:
    type: boolean
    initial: false
  lookedAtTicket:
    type: boolean
    initial: false
  failed:
    type: boolean
    initial: false

invariants:
  - id: no-negative-effects
    expression: forgeEffects >= 0

actions:
  inspect-forge:
    when: true
    effects:
      - set: lookedAtForge
        value: true
    emits: [forge-inspected]

  inspect-ticket:
    when: lookedAtForge
    effects:
      - set: lookedAtTicket
        value: true
    emits: [ticket-inspected]

  issue-fresh-ticket:
    when: lookedAtTicket && !failed
    effects:
      - set: ticket
        value: fresh
    emits: [identity-changed]

  retry:
    when: lookedAtTicket && !failed
    branches:
      - when: ticket == order-01
        effects: []
        emits: [safe-retry]
      - when: ticket == fresh
        effects:
          - add: forgeEffects
            value: 1
          - set: failed
            value: true
        emits: [duplicate-created]

objectives:
  clear:
    when: lookedAtForge && lookedAtTicket && ticket == order-01 && !failed
```

The exact syntax can evolve, but generated rules must compile into a small allowlisted interpreter rather than arbitrary code.

## State types

Version 1 should support only types demanded by real Phase 1 mechanics:

- boolean;
- bounded integer/number;
- enum;
- string identifier from an allowlisted domain;
- set/list of semantic IDs where order/uniqueness semantics are explicit;
- small records composed from supported types.

Do not introduce arbitrary objects/functions.

Every field has:

- stable semantic ID;
- declared type/domain;
- initial value;
- optional bounds;
- persistence policy (`attempt`, `mission`, `chapter`, etc.) where needed.

## Semantic actions

An action is a stable game verb, not a button ID or engine callback.

Examples:

- `inspect-forge`;
- `reuse-ticket`;
- `create-ticket`;
- `send-request`;
- `rewind-attempt`;
- `attach-route-node`;
- `test-policy`;
- `open-valve`;
- `rotate-vector`;
- `connect-circuit`.

An engine/backend can bind touch, pointer, keyboard, controller, raycast, collision or native input to the same semantic action.

Actions have:

- parameters with validated types;
- preconditions;
- deterministic effects or explicitly seeded branches;
- semantic events;
- optional presentation hints that do not determine truth.

The rules interpreter rejects invalid/impossible actions instead of silently coercing them.

## Expression language

Use a deliberately small expression DSL, not `eval`.

Initial operations can include:

- equality/inequality;
- numeric comparisons;
- boolean AND/OR/NOT;
- membership;
- bounded arithmetic;
- explicit field lookup;
- count/length for supported collections.

No arbitrary function invocation, network access, DOM access, reflection, filesystem access or dynamic code generation.

## Effects

Initial allowlisted effects:

- set value;
- bounded add/subtract;
- add/remove collection member;
- append to bounded ordered history;
- clear/reset declared field;
- emit semantic event;
- start/resolve a declared deterministic timer where required.

Each transition is validated against state type/bounds and invariants before commit.

## Determinism and randomness

Learning-critical gameplay must be reproducible for debugging, replay and evidence review.

Default: deterministic.

If randomness is part of a game mechanic:

- GameRulesSpec declares the random distribution/choice domain;
- the authoritative runtime supplies and records a seed;
- resulting choices are part of the immutable attempt/game event history;
- replay uses the exact recorded seed/events;
- the engine never invents unrecorded learning-critical randomness.

Purely cosmetic randomness may stay engine-local if it cannot change game/evidence meaning.

## Authoritative execution

For VibeLearn's current hosted architecture, learning-critical GameRulesSpec execution belongs at the server-authoritative game/service boundary.

The browser/engine may:

- predict a transition for responsiveness;
- animate anticipated state;
- show local hover/selection/physics presentation;

but committed state/evidence comes from the authoritative command result.

If prediction disagrees, presentation reconciles to authoritative state.

This preserves existing learner isolation, idempotent command semantics, immutable submitted evidence and recovery behavior.

## Game event log

GameRulesSpec transitions should produce semantic events such as:

```text
forge-inspected
identity-changed
safe-retry
request-effect-created
duplicate-created
route-tested
policy-counterexample-found
mission-cleared
```

Events carry stable IDs and validated payloads. They are independent of engine callbacks like `pointerdown`, `collisionstart` or animation names.

The event log can support:

- save/replay;
- debugging;
- critic instrumentation;
- state reconstruction where useful;
- AssessmentEvidenceSpec mapping.

It must not become an unrestricted analytics dump.

## World bindings

WorldSpec and RuntimeExperienceSpec map rule state/events to engine-neutral presentation intent.

Example:

```yaml
bindings:
  - whenEvent: duplicate-created
    worldPatch: forge.duplicate-visible
    camera: forge-consequence
    effect: ember-spent

  - whenState: failed == true
    hudSlot: recovery
    value: rewind-available
```

PlayCanvas compiles these to entities/components/cameras/effects. A future Unity backend may realize them differently while preserving semantic action/event identity.

## Physics boundary

Physics can be either presentation or gameplay-significant.

### Presentation physics

Examples: cloth flutter, debris, decorative particles. Engine-local; no evidence meaning.

### Gameplay-significant physics

Examples: trajectory puzzle, force/torque concept, spatial collision challenge.

Then GameRulesSpec/WorldSpec must declare the semantic quantities/outcomes that matter. The engine can simulate, but authoritative results must be normalized into stable semantic events/state with reproducible parameters/tolerances.

Do not let raw frame timing/collision callbacks directly establish learning evidence.

## Reusable mechanic packages

Frequently useful rule patterns should become versioned, parameterized mechanic packages rather than regenerated logic:

- inventory/resource economy;
- finite-memory cache/ledger;
- retry/idempotency;
- route/network construction;
- switch/circuit logic;
- timed sequencing;
- matching/classification;
- constrained optimization;
- hypothesis/test loop;
- dialogue/state investigation;
- crafting/composition;
- spatial transform/geometry;
- flow/queue/backpressure simulation.

A generated course composes packages and supplies parameters/story/world mappings. It does not fork interpreter code.

## Save and migration

Saved gameplay state identifies:

- GameRulesSpec id/version;
- canonical semantic state values;
- authoritative event/command history or checkpoint identity;
- engine-independent world/runtime version references.

Never serialize PlayCanvas entity objects, Unity GameObjects or Unreal Actors as canonical gameplay truth.

When a rules version changes, use explicit migrations/remapping. Existing legitimate assessment evidence remains pinned to the version that produced it.

## Validation and testing

Every generated GameRulesSpec must pass before engine compilation:

1. schema/type validation;
2. every referenced field/action/event exists;
3. every action preserves declared invariants for reachable tested paths;
4. no unbounded loops/recursion/custom code;
5. no impossible objective caused by obvious rule contradiction;
6. declared state is serializable;
7. deterministic replay produces identical semantic state/events from the same initial state + commands + seed;
8. invalid actions fail closed;
9. engine-independent unit tests exercise mechanics without rendering;
10. learning/evidence mappings refer to semantic events/results, never engine objects.

For important/generated games, add property/model tests over action sequences where tractable.

## Phase 1 requirement

Do not rewrite the mature Relay Rescue server model simply to satisfy a new abstraction.

Phase 1 migration should instead:

1. derive a minimal GameRulesSpec-shaped contract from the already-tested Relay Rescue semantics;
2. prove the spec/interpreter with a small vertical slice and synthetic unrelated mechanic;
3. map existing authoritative server results into the new semantic state/event contract;
4. migrate rules incrementally only where doing so preserves or improves existing tests/evidence boundaries;
5. never sacrifice correctness or persistence merely to make the new architecture look pure.

Echo Forge is the reference game used to extract the framework, not a template hard-coded into it.

## Portability gate

The gameplay architecture is not portable until we can demonstrate that:

- the same GameRulesSpec unit tests pass without an engine;
- PlayCanvas binds the semantic actions/state/events without owning rules;
- a second synthetic game with materially different mechanics uses the same interpreter/contract;
- later, a second engine backend can consume the same GameRulesSpec + WorldSpec without rewriting learning/evidence identity.

## Quality invariant

A perfect rules architecture earns zero story/game/learning critic points.

It exists to make high-quality game generation fast, safe, testable and portable. The rendered game still has to be fun, comprehensible and educational enough to pass the separate >=9 gates and the user's final review.
