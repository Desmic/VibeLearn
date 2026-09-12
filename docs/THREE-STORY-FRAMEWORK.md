# Three.js story-world framework — reusable Phase 1 rendering contract

**Status:** active Phase 1 rendering subsystem · 12 September 2026  
**Authority:** read with root `CODEX-IMPLEMENTATION-PLAN.md`, `PLAY-CANVAS.md`, `STORY-GENERATION-AND-CRITIC.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `GAME-UX-SYSTEM.md`, and `STATE.md`.

## Relationship to Play Canvas

VibeLearn has converged on **Play Canvas** as the higher-level game architecture.

This document describes the reusable **Three.js rendering/world-package subsystem inside Play Canvas**. It is not the overall game shell and it must not cause story, mission, builder and transfer states to become separate canvas/page experiences.

The intended hierarchy is:

`Play Canvas -> rendering backend (Story3D when chosen) -> replaceable world adapter/package`

When the same world package is compatible across story and mission states, Play Canvas should keep the world/runtime alive and change its state/mode rather than destroying one renderer and creating another. See `PLAY-CANVAS.md` for the persistent lifecycle contract.

## Why this exists

VibeLearn must be able to realize many different generated stories/fantasies without rebuilding WebGL infrastructure for every course. The Echo Forge is the first adapter proving that boundary; it is not the framework itself.

The framework should make a future world package easy to integrate while keeping **LearningSpec and learner evidence independent of Three.js, Pip, gears, or any visual asset**. Three.js remains one rendering choice alongside 2D and 2.5D, not a mandatory engine assumption.

“Reusable” means more than sharing `new WebGLRenderer(...)`. Generated worlds should primarily author the things that are genuinely creative/story-specific: assets/geometry, art direction, camera **compositions**, beat states, interactions, and mappings from authoritative game state to visible state. Renderer lifecycle, device policy, camera interpolation, aspect-aware shot selection, reduced motion, context recovery, and cleanup belong to shared infrastructure.

## Layering

Keep these layers separate:

1. **StoryWorldSpec** — renderer-agnostic narrative/world semantics: premise, actors, places, objects/resources, causal rules, stakes, beats, chapter arc, and mappings to learning concepts.
2. **GameExperienceSpec / Play Canvas** — mechanics, player actions, mission/state graph, persistent game-surface/mode transitions, progressive disclosure, device/accessibility contract, and the chosen realization medium.
3. **`story3d-runtime.js`** — generic Three.js lifecycle and presentation infrastructure: renderer/canvas policy, scene/camera shell, resource tracking/disposal, resize, frame scheduling, reduced motion, pause, context-loss recovery, runtime stats, and reusable camera-shot interpolation/aspect selection.
4. **World adapter module** — story-specific geometry/assets, lighting/art direction, camera compositions, beat states, interaction anchors, and mapping from game state to visual state. `rescue-story3d.js` is the current example.
5. **DOM/action/evidence layer** — accessible controls, authoritative game commands, save/retry behavior, and assessment/evidence. Renderer state never decides correctness, progression, mastery, or evidence.

A generated 3D story should normally replace layer 4 and data feeding it, **not fork layer 3 or Play Canvas**.

## Runtime contract

`createThreeStoryRuntime(host, options)` returns a small reusable runtime with:

- `scene`, `camera`, `renderer`, and `canvas`;
- tracked `material`, `emissive`, `mesh`, `group`, geometry/material registration helpers;
- `setDraw(fn)` and `requestDraw()` for state-driven rendering;
- `setPaused(bool)` and reduced-motion-aware animation scheduling;
- viewport/aspect handling through `ResizeObserver`;
- bounded device pixel ratio for phone performance;
- `webglcontextlost` / `webglcontextrestored` hooks;
- `createCameraRig(initialShot, options)` for reusable aspect-aware camera composition selection and interpolation;
- `stats()` including runtime version and renderer state;
- idempotent `dispose()` that owns renderer/resource cleanup.

The runtime must remain free of course names, story characters, competencies, assessment rules, mission IDs, learner state semantics, and Play Canvas product-flow decisions.

### Camera-shot contract

World adapters define **camera compositions**, not camera-loop boilerplate. A shot is either:

```js
{ p: [x, y, z], t: [lookX, lookY, lookZ] }
```

or an aspect-aware pair:

```js
{
  landscape: { p: [...], t: [...] },
  portrait:  { p: [...], t: [...] }
}
```

The shared camera rig owns current/target vectors, portrait-vs-landscape selection, interpolation, snapping for reduced motion/state changes, and applying `camera.lookAt`. A world adapter may choose the compositions and transition intent, but should not reimplement vector lerp loops merely because its fantasy is different.

This is deliberately small. It is not a cinematic timeline editor and it does not decide story pacing. Story pacing remains player-owned; Play Canvas and the active story/game state decide which beat/shot is active.

## World-adapter contract

The story host supports the legacy story/mission modes and a Play Canvas-compatible mount mode. A world adapter exposes the relevant behavior:

```js
createStoryWorld(host, { reducedMotion, mode }) -> {
  available,
  setMode?(storyOrMission),
  setBeat(index),
  setMissionState(state),
  setPaused(value),
  replay(),
  stats(),
  dispose()
}
```

`story` and `mission` remain compatible during migration. `play` is the persistent Play Canvas mount capability for adapters that explicitly support it. During migration, Play Canvas may also keep an older adapter mounted once through a compatible mode when that adapter already exposes both `setBeat` and `setMissionState`; new adapters should prefer the explicit Play Canvas capability.

The adapter may interpret beat/game state into cameras and object states, but it must never commit actions or mutate learning evidence.

Future generated packages may add versioned optional capabilities (for example named interaction anchors, asset manifests, camera presets, or environment transitions), but compatibility must be negotiated explicitly rather than by probing arbitrary globals.

## Future generated-world package shape

When Phase 3 generation chooses Three.js, the generator should emit/version a package conceptually like:

```text
world-package/
  manifest.json          # package id/version, adapter entry, asset list, capabilities
  world-adapter.js       # implements the VibeLearn story-world adapter contract
  assets/...             # same-origin approved models/textures/audio where applicable
  fallback/...           # semantic/2D fallback data or assets
```

The package ID/version belongs to `StoryWorldSpec` / `GameExperienceSpec` provenance. It **must not become a canonical competency ID or evidence ID**. Re-generating the fantasy can therefore swap world packages while legitimate learner history remains mapped to the same LearningSpec.

Current Phase 1 does not implement the full arbitrary package loader or generation pipeline. It establishes the Play Canvas + runtime/adapter seam first; broad package loading belongs behind the later generator/security boundary.

## Integration rules for a new story/fantasy

A new 3D setting should require roughly this work:

1. freeze and pass its `StoryWorldSpec` story critic;
2. choose Three.js in `GameExperienceSpec` for a justified reason;
3. implement a world adapter using `story3d-runtime.js` rather than creating its own renderer lifecycle or camera interpolation loop;
4. author landscape/portrait camera compositions and map story beats plus authoritative game state to visible scene states;
5. mount it through Play Canvas rather than creating a new application shell;
6. expose accessible DOM-owned interactions instead of relying on canvas-only meaning/input;
7. provide reduced-motion and renderer-failure meaning-equivalent behavior;
8. run phone/rendering/critic evidence on the exact build.

If integrating a new setting requires copying renderer setup, resize loops, disposal, context-loss logic, mobile pixel-ratio policy, current/target camera vectors, generic camera lerp code, or creating a new course-specific game shell, the framework boundary has failed and should be improved before adding more worlds.

### Easy-integration acceptance rule

The design target is stronger than “a second adapter can be made to work.” Future story/fantasy generation should normally be able to add or replace a world by changing a **versioned world package** plus story/game data, while Play Canvas, runtime and host stay untouched.

A candidate world integration fails this rule when it needs story-specific changes in `story3d-runtime.js`, `story3d-world-host.js`, or Play Canvas core. If a genuinely new engine capability is required, implement it as a small generic/versioned capability with compatibility tests first, then consume it from the adapter. Do not smuggle one story's assumptions into shared infrastructure because doing so makes the next generated fantasy harder.

A world package should be independently replaceable: uninstalling/replacing it must not change canonical competencies, learner evidence, assessment rules, save semantics or historical progress. Its manifest/version is provenance, not learning identity.

The current test-only Star Orchard adapter proves the mechanical Story3D seam. A later milestone must prove the **authoring seam** with a materially different real generated/authored story: it should integrate without modifying Play Canvas/runtime/host infrastructure, use the same phone/reduced-motion/fallback policies, and still achieve its own story/game critic gates.

## Mobile, accessibility, and performance defaults

The runtime is deliberately conservative for the current phone-first target:

- self-hosted pinned Three.js;
- same-origin assets/runtime;
- bounded pixel ratio rather than blindly rendering at physical device DPR;
- resize-aware camera/aspect behavior;
- shared portrait/landscape shot selection and camera interpolation;
- pause and reduced-motion support;
- WebGL context-loss fallback hooks;
- semantic DOM controls remain operable if 3D fails.

A world adapter can choose its own art direction and performance budget within the GameExperienceSpec, but it cannot weaken these minimums without explicit evidence/review.

## Security / hosting boundary

Do not turn “easy world integration” into arbitrary client code execution. Current hosted static files remain explicitly allowlisted and CSP stays strict. Later generated-world packages need a deliberate immutable publishing/asset-validation boundary before arbitrary package paths are served.

No runtime CDN dependency, inline-script exception, remote model execution, or learner-supplied JavaScript is authorized by this framework.

## Phase 1 executable proof

The Phase 1 seam must prove at least:

- the Echo Forge adapter imports the shared runtime and does **not** instantiate its own `WebGLRenderer` or `ResizeObserver`;
- the Echo Forge adapter does not own generic `currentCam` / `currentLook` interpolation state; camera motion comes through the shared camera rig;
- opening story and Signal 1 use the **same Play Canvas stage and same compatible world/runtime/canvas instance** instead of spawning separate renderers;
- the Play Canvas can reattach that world through later compatible Signals 2-6;
- both cinematic and mission states identify the same runtime contract version;
- a deliberately unrelated **synthetic world adapter** (currently the test-only “Star Orchard”) mounts through shared infrastructure without importing Relay Rescue/Pip-specific code;
- incompatible adapter versions, unsupported modes, and incomplete returned instances fail closed, with partial instances disposed;
- generic Play Canvas/runtime/host source contains no assumptions about Pip, Echo Forge, `order-01`, bridge gears, or rescue mission IDs;
- context loss/fallback, reduced motion, pause, resize, camera composition switching and disposal still work;
- 360–430px phone first-touch and Chapter 1 behavior remain green;
- story/game critics judge the rendered result, not framework existence.

The synthetic adapter is **verification only**, not a second product course and not an authorization to build Phase 2/3. It exists to make “reusable” executable instead of architectural prose.

Framework extraction is engineering infrastructure. It earns **zero automatic story/game critic points**.
