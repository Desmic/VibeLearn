# Current checkpoint — Play Canvas + reusable Three.js world framework

Updated 12 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit verdict is authoritative and supersedes every agent/critic/automation score for acceptance.

## Latest user direction

The user has reaffirmed two architectural requirements:

1. **Play Canvas remains the top-level game architecture**: one persistent game surface for story, mission play, progression, building and transfer.
2. **Three.js must be developed as a reusable framework under Play Canvas** so future story/fantasy settings can be integrated easily instead of rebuilding renderer/camera/lifecycle code per course.

This is not a request to make Three.js the product shell. The intended hierarchy is:

`LearningSpec / StoryWorldSpec / GameExperienceSpec -> Play Canvas -> rendering backend -> Story3D runtime/host -> replaceable world package`

The root `CODEX-IMPLEMENTATION-PLAN.md` **1.9** is authoritative. Read it with `docs/PLAY-CANVAS.md` and `docs/THREE-STORY-FRAMEWORK.md`.

## Current user verdict

The newest explicit first-touch/story score remains **3/10** until the user reviews a materially changed verified/deployed candidate.

The rejected predecessor opening lacked good Back navigation, moved too quickly, told the story lazily, left causality/stakes unclear and did not create the creative/beautiful first impression expected from a game that could capture kids, teens and young adults.

Older 5/10 game / 5/10 learning and historical internal 9+ critic results are not acceptance evidence.

## Product north star

VibeLearn is a **general system for generating effective learning games/stories across subjects and courses**. Relay Rescue is the current authored reference, not the product schema.

The durable package boundary is:

`LearningSpec -> StoryWorldSpec -> GameExperienceSpec -> AssessmentEvidenceSpec`

Canonical competencies/evidence remain independent of story, character, renderer, world-package version and Play Canvas implementation.

### Story inputs now vs later

**Current:** story generation is driven by topic/course intent, source-grounded outcomes, their causal learning structure and a broad kid-through-young-adult quality target.

**Future:** an explicit learner-controlled `StoryPreferenceProfile` may influence genre, fantasy/realism, tone, characters, visual style, humor/darkness, pace, exploration/action balance and narrative density. Preference state is separate from mastery/evidence.

## Quality pipeline

`course/outcomes -> source grounding -> LearningSpec -> StoryWorldSpec -> story critic >=9 -> GameExperienceSpec/Play Canvas realization -> first-touch magic >=9 -> whole-chapter game experience >=9 -> learning/transfer >=9 -> current user review -> acceptance`

A weak first touch cannot be averaged into a passing chapter. A beautiful game cannot compensate for shallow learning. The current user's explicit verdict overrides every critic.

## Play Canvas architecture

`docs/PLAY-CANVAS.md` is the authoritative game-surface contract.

- Play Canvas is the persistent game surface/orchestrator.
- Rendering backends such as Three.js live inside it.
- World packages are replaceable story/fantasy realizations.
- Accessible DOM actions/fallback remain required but support the game surface rather than becoming a dashboard-first architecture.
- Compatible story/mission states should reuse the same stage/world/runtime instead of spawning a new renderer.
- No new bespoke course-specific canvases/page shells should be added during migration.

Current migration order remains opening + Signal 1 -> Signals 2-6 -> Signal 6 builder/HUD -> Signal 7 transfer shell -> removal of obsolete duplicate mounting paths after equivalent tests are green.

## Three.js framework direction

`docs/THREE-STORY-FRAMEWORK.md` is the authoritative rendering/world-package subsystem contract.

Current reusable layers include:

- `web/story3d-runtime.js` — renderer/canvas lifecycle, bounded DPR, resize, frame scheduling, pause/reduced motion, context loss/recovery, cleanup, runtime stats and camera rig;
- `web/story3d-world-host.js` — adapter/version/capability validation;
- `web/play-canvas.js` — persistent game-surface/world lifecycle above the renderer;
- `web/rescue-story3d.js` — current Echo Forge-specific world realization;
- synthetic unrelated-world coverage (Star Orchard) proving that shared infrastructure is not Relay Rescue-specific.

### New explicit authoring target

The framework must make **future generated settings easy to integrate**, not merely make multiple hand-written adapters technically possible.

The long-term target is a versioned, data-first `WorldPackageSpec` interpreted by trusted shared runtime code. A generated 3D world should primarily provide:

- manifest/backend/capabilities/assets;
- scene/entity graph and reusable primitive references;
- story/game visual states and transitions;
- portrait/landscape camera compositions;
- semantic interaction anchors;
- approved same-origin assets;
- semantic/2D fallback data.

A custom JavaScript adapter should be exceptional/reviewed, not the default generated output. This keeps easy integration compatible with CSP/security instead of turning the generator into arbitrary client-code execution.

Current Phase 1 may keep authored adapter code while extracting the reusable authoring seam. The full generated-package loader remains deferred until a later immutable publishing/asset-validation/security boundary.

If a new fantasy requires story-specific changes to `play-canvas.js`, `story3d-runtime.js` or `story3d-world-host.js`, either the capability must first be generalized/versioned with tests, or the package boundary has failed.

## Current Echo Forge reference

Repository: `Desmic/VibeLearn`.

Working/hosted branch: **`deploy/render-supabase`**. Render serves this branch; auto-deploy is disabled.

At the time of this checkpoint the branch is in ongoing Play Canvas/framework migration. Do not infer green CI or live deployment from a source commit alone; exact-build verification and served-revision checks remain required before user review.

The latest frozen realized-game critic before the current migration remains a warning signal:

- Echo Forge story treatment: **9.37/10 PASS** (`internal_tool_assisted`, story only);
- first-touch magic: **8.86/10 FAIL**;
- whole-chapter game: **8.71/10 FAIL**;
- learning/transfer critic: not run because game gates did not pass.

Main critic failures were limited visual/character presence in first touch and loss of game/world identity in later construction/transfer screens. Framework extraction itself earns zero critic points.

## Current execution order

1. keep docs/plan aligned with user feedback;
2. get the exact Play Canvas/framework migration head fully green;
3. prove story -> Signal 1 instance continuity on phone;
4. migrate Signals 2-6 / Signal 6 construction into the same Play Canvas lifecycle;
5. continue extracting shared Story3D runtime/host/camera/interaction capabilities from Echo Forge-specific code;
6. prove a data-first/easy-authoring world-package seam without opening an unsafe arbitrary package loader;
7. preserve historical review, reset progress, save/reload, learner isolation and evidence semantics;
8. inspect exact 360/390/430 rendered evidence;
9. run first-touch critic and repair until >=9/no blocker;
10. run whole-chapter critic and repair until >=9/no blocker;
11. run bounded learning/transfer gate;
12. deploy the exact verified candidate to Render;
13. verify served revision;
14. ask the current user for final review.

## Acceptance authority and rollout

Only explicit user acceptance produces `user_accepted`. Critic >=9 only permits the next gate or user review.

No external testers/public rollout, paid infrastructure expansion, untrusted execution, new model integration or broad Phase 2+ work is authorized during current private Phase 1 refinement.

Hosted auth, learner isolation, server-authoritative progression/evidence, immutable submitted evidence, assistance/exposure semantics, reset-progress confirmation and read-only historical review remain in force.
