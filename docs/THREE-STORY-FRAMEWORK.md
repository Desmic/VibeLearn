# Three.js story-world framework — reusable rendering and world-authoring contract

**Status:** active Phase 1 rendering subsystem · updated 12 September 2026  
**Authority:** read with root `CODEX-IMPLEMENTATION-PLAN.md`, `PLAY-CANVAS.md`, `STORY-GENERATION-AND-CRITIC.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `GAME-UX-SYSTEM.md`, and `STATE.md`.

## Relationship to Play Canvas

VibeLearn has converged on **Play Canvas** as the higher-level game architecture.

This document defines the reusable **Three.js runtime + world-package framework inside Play Canvas**. It is not the overall game shell and must not cause story, mission, builder and transfer states to become separate course pages/canvases.

Hierarchy:

`Play Canvas -> rendering backend -> Story3D runtime/host -> replaceable world package`

When compatible story/mission states use the same world package, Play Canvas should keep the world/runtime alive and update state/mode/camera/HUD instead of destroying one renderer and creating another.

## Why this framework exists

VibeLearn is intended to generate many different stories/fantasy settings across many subjects. A new world must not require rebuilding WebGL infrastructure or modifying course-wide app structure.

The Echo Forge is the first authored world proving the boundary. It is **not** the framework itself.

A reusable framework means a future setting primarily authors:

- its world entities/assets and art direction;
- character/environment compositions;
- story beat states;
- authoritative game-state visual mappings;
- interaction anchors;
- camera compositions;
- semantic fallback metadata.

It should **not** copy renderer setup, DPR policy, resize loops, animation loops, camera interpolation, context-recovery logic, disposal or Play Canvas lifecycle.

LearningSpec and learner evidence remain independent of Three.js and of every world-package identity.

## Framework layering

1. **StoryWorldSpec** — renderer-agnostic narrative/world semantics: actors, places, meaningful objects/resources, causal rules, stakes, story beats/chapter arc and mappings to learning concepts.
2. **GameExperienceSpec / Play Canvas** — mechanics, player actions, game modes, progression, persistent game-surface lifecycle, HUD/visibility schedule, device/accessibility contract and selected renderer backend.
3. **`story3d-runtime.js`** — generic Three.js lifecycle/presentation infrastructure.
4. **`story3d-world-host.js`** — world-package/adapter validation, capability negotiation and mount boundary.
5. **World package** — story-specific scene data/assets/compositions/states/anchors and minimal adapter glue where still necessary.
6. **Semantic action/evidence layer** — accessible actions, authoritative server commands, save/retry, assessment and evidence. Rendering never decides learning truth.

A generated 3D story should normally replace layer 5 and its data, **not fork layers 3–4 or Play Canvas**.

## Runtime contract

`createThreeStoryRuntime(host, options)` should remain generic and expose a small stable surface including:

- scene, camera, renderer and canvas;
- resource/material/geometry tracking helpers;
- state-driven `setDraw(fn)` / `requestDraw()`;
- reduced-motion-aware scheduling and `setPaused(bool)`;
- resize/aspect handling with bounded phone DPR;
- WebGL context loss/restoration hooks;
- reusable camera rig with portrait/landscape composition selection;
- runtime stats/version;
- idempotent cleanup/disposal.

The runtime must remain free of course names, story nouns, learner semantics, mission IDs, assessment rules and Play Canvas product-flow decisions.

## Camera composition contract

World packages declare compositions; the runtime owns generic interpolation and aspect handling.

A composition may be a direct shot:

```js
{ p: [x, y, z], t: [lookX, lookY, lookZ] }
```

or aspect-aware:

```js
{
  landscape: { p: [...], t: [...] },
  portrait:  { p: [...], t: [...] }
}
```

The shared camera rig owns current/target vectors, portrait/landscape selection, interpolation, reduced-motion snapping and `lookAt` application. World packages choose shots and transition intent, not generic vector-loop boilerplate.

## Current adapter contract

During Phase 1 migration an authored world adapter may expose:

```js
createStoryWorld(host, { reducedMotion, mode }) -> {
  available,
  setMode?(mode),
  setBeat?(index),
  setMissionState?(state),
  setPaused?(value),
  replay?(),
  stats?(),
  dispose()
}
```

`play` is the persistent Play Canvas capability. Legacy `story`/`mission` modes remain compatible only while migration is incomplete.

Adapters interpret story/game state into visuals. They never commit gameplay actions, decide correctness, unlock progression or mutate evidence.

## Long-term world-authoring target: data first

The user's requirement is not merely “share the renderer.” Future generated stories/fantasies should be **easy to integrate**.

The long-term target is a versioned, declarative **`WorldPackageSpec`** interpreted by trusted shared engine/runtime code. Conceptually:

```text
world-package/
  manifest.json          # package id/version/backend/capabilities/assets
  world.json             # scene/entity graph + reusable primitive references
  states.json            # story beat and game visual states/transitions
  cameras.json           # named portrait/landscape compositions
  interactions.json      # semantic action anchors/hit metadata
  effects.json?          # reusable effect compositions, if needed
  assets/...             # approved same-origin models/textures/audio
  fallback/...           # semantic/2D fallback data/assets
  adapter.js?            # exceptional reviewed extension, not default generation
```

### Why declarative packages matter

A data-first package gives us:

- easier generation and regeneration of many fantasy settings;
- stable validation/schema checks before publishing;
- less course-specific engine code;
- safer CSP/static serving than arbitrary generated JavaScript;
- easier versioning/provenance and replacement;
- clearer tests that a world package does not contaminate learning/evidence identity.

Current Phase 1 does **not** implement the full arbitrary package loader. It defines and proves the authoring seam first.

## Shared primitive/capability direction

Only generalize a primitive after there is evidence it is useful beyond one story. Candidate reusable capabilities include:

- environment/lighting presets as composable primitives rather than fixed themes;
- actor/entity registration and named anchors;
- prop/resource visibility/state transitions;
- emissive/highlight/focus effects;
- path/message/projectile transitions;
- camera composition library and transition policies;
- semantic interaction-anchor projection between world and DOM;
- named environment-state transitions;
- generic particle/effect hooks with bounded mobile budgets;
- asset manifest loading/validation once the publishing boundary exists.

Do **not** create a huge generic game engine speculatively. The framework should grow through real story requirements, but each new reusable capability must be story-neutral and versioned.

## World-package integration rule

A new setting should normally require:

1. freeze/pass StoryWorldSpec story critic;
2. select Three.js in GameExperienceSpec for a justified reason;
3. author/compile a versioned world package against the shared contract;
4. define portrait/landscape camera compositions;
5. map story beats and authoritative game state to visible world states;
6. expose semantic interaction anchors/fallback;
7. mount through Play Canvas;
8. run phone, fallback, reduced-motion, context-loss and critic evidence.

If integrating a new setting requires story-specific changes to `play-canvas.js`, `story3d-runtime.js` or `story3d-world-host.js`, either:

- the new capability is genuinely generic and should first become a versioned shared capability with compatibility tests; or
- the world package is violating the framework boundary.

## Easy-integration acceptance rule

“Reusable” is not satisfied by one Echo Forge adapter.

Phase 1 minimum proof:

- Echo Forge uses shared runtime/host rather than its own renderer lifecycle;
- opening and Signal 1 retain the same Play Canvas/world/runtime where compatible;
- an unrelated synthetic **Star Orchard** world mounts through shared infrastructure without Relay Rescue assumptions;
- incompatible versions/capabilities fail closed;
- context loss, reduced motion, resize, camera aspect switching and cleanup remain green.

Before the future generator is considered mature, require a stronger **authoring proof**:

- a materially different real generated/authored story integrates by adding/replacing its world package and story/game data;
- no story-specific changes are needed in Play Canvas/runtime/host core;
- the same phone/reduced-motion/fallback contracts work;
- package replacement leaves canonical competencies/evidence/history unchanged;
- the new story/game still passes its own critics.

The synthetic adapter is verification only, not a second product course or authorization for Phase 2/3.

## Package provenance vs learning identity

World package ID/version belongs to StoryWorldSpec/GameExperienceSpec provenance. It must never become a canonical competency or evidence ID.

A learner may later replay the same LearningSpec in a different world. Legitimate learner history stays attached to the learning identity, with story/package exposure tracked separately when it matters.

## Phone/accessibility/performance defaults

The shared runtime minimums are:

- pinned/self-hosted Three.js;
- same-origin runtime/assets;
- bounded DPR;
- resize/aspect-aware compositions;
- pause and reduced-motion support;
- WebGL context-loss/fallback hooks;
- semantic DOM controls/fallback operable if 3D fails;
- touch-friendly interaction anchors;
- no required meaning through color, motion or audio alone.

A world may choose its own art direction/performance budget inside GameExperienceSpec, but cannot silently weaken these minimums.

## Security/publishing boundary

Easy integration must **not** become arbitrary learner/generated code execution.

Current hosted static files remain explicitly allowlisted and CSP stays strict. The future generated-world loader needs:

- immutable package/version identity;
- schema/capability validation;
- asset MIME/size/origin validation;
- approved asset transforms/limits;
- no inline/eval/remote-script escape hatch;
- safe rollback/version pinning;
- provenance linking StoryWorldSpec/GameExperienceSpec to the exact package.

No runtime CDN dependency, learner-supplied JavaScript or relaxed CSP is authorized by this framework.

## Critic relationship

Framework quality is an engineering prerequisite, not a game-quality score. A perfectly reusable renderer earns **zero automatic story/game critic points**.

Critics judge the exact rendered result: beauty, attachment, clarity, agency, game identity, progression, payoff, learning integration and phone/accessibility quality.
