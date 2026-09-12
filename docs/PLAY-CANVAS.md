# Play Canvas — primary game-surface contract

**Status:** authoritative Phase 1 product/runtime contract · updated 12 September 2026  
**Read with:** root `CODEX-IMPLEMENTATION-PLAN.md`, `GAME-UX-SYSTEM.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `THREE-STORY-FRAMEWORK.md`, and `STATE.md`.

## Decision

VibeLearn has converged on a **Play Canvas** architecture.

The Play Canvas is the persistent game surface in which story, exploration, mission play, visible consequences, progression, chapter payoff, building and transfer are staged. The product must not behave like a course website that occasionally embeds a canvas.

Three.js is one rendering backend **inside** Play Canvas. The reusable Story3D runtime/host and world-package framework are renderer infrastructure, not the top-level UX architecture.

This distinction is essential to the general system: future generated stories/fantasies plug into the same Play Canvas rather than creating a new app shell.

## Product invariant

For an active learning game, the player should experience **one coherent play surface**.

A course may change camera, location, chapter, mechanic, HUD, interaction mode, world package, art direction or even rendering backend, but those transitions should happen inside the game surface unless there is a deliberate reason to leave it.

For Relay Rescue:

- opening story -> Signal 1 uses the same Play Canvas lifecycle;
- compatible world/runtime should persist through that transition;
- Signals 1-6 preserve valley/Echo Forge world presence while mechanics become more demanding;
- Signal 6 construction moves toward in-world operation rather than a web workbench;
- Signal 7 intentionally changes into a fresh transfer context but remains a Play Canvas game mode;
- login/account/recovery remain outside gameplay but retain game identity.

## Layering

1. **LearningSpec / AssessmentEvidenceSpec** — canonical learning/evidence, server-authoritative and independent of renderer/world identity.
2. **Play Canvas shell/orchestrator** — persistent stage lifecycle, active backend/world, mode transitions, HUD/action/debrief layers, phone/safe-area policy, pause/replay, reduced-motion coordination and renderer fallback coordination.
3. **Rendering backend** — Three.js where justified; 2D/2.5D remain first-class alternatives.
4. **World package** — replaceable story/fantasy-specific visual realization: scene/entities/assets, art direction, camera compositions, story/game visual states, interaction anchors and fallback metadata.
5. **Accessible action/evidence layer** — semantic DOM actions/status/fallback, server commands, save/retry and evidence.

## Responsibilities

The Play Canvas owns or coordinates:

- stable root surface for the active game;
- persistent stage host;
- active renderer backend/world package;
- `story`, `explore`, `mission`, `map`, `build`, `boss`, `transfer` and future game-mode transitions;
- stage/world attachment without unnecessary remounts;
- HUD/action/debrief overlay slots with progressive disclosure;
- phone viewport/safe-area/orientation policy;
- pause/replay/reduced-motion coordination;
- renderer failure/context-loss fallback;
- cleanup when leaving/replacing the game/world/backend.

The Play Canvas never decides:

- answer/action correctness;
- mastery;
- learner evidence semantics;
- XP-based learning truth;
- server revision/save authority;
- source/provenance validity.

## World-package integration

A future generated game should normally provide:

- StoryWorldSpec;
- GameExperienceSpec describing Play Canvas modes/mechanics;
- chosen renderer backend;
- versioned world package;
- semantic actions/fallback metadata;
- mappings from authoritative game state to visible state.

It should **not** need a new app shell, copied renderer loop or course-specific changes to Play Canvas core.

When Three.js is selected, Play Canvas mounts the world package through `story3d-world-host.js` / `story3d-runtime.js`.

### Data-first integration target

The preferred long-term integration is not arbitrary generated adapter code. Generated settings should increasingly be represented by a validated declarative `WorldPackageSpec` containing:

- package manifest/version/backend/capabilities;
- scene/entity graph and reusable primitive references;
- story/game visual states;
- portrait/landscape camera compositions;
- semantic interaction anchors;
- approved assets;
- semantic/2D fallback.

A custom world adapter remains an authored/reviewed escape hatch for capabilities that cannot yet be expressed safely/declaratively. It is not the default long-term generator output.

This lets the Play Canvas remain stable while stories/fantasies change freely.

## Persistent-world lifecycle

For compatible story/mission states:

1. Play Canvas mounts one stable stage host.
2. Chosen world/backend mounts once.
3. Story beats update the same instance.
4. Transition into mission changes mode/state/camera/HUD.
5. Later compatible missions update authoritative visual state without remounting merely because surrounding DOM changed.
6. Dispose only when leaving the game, swapping incompatible backend/world, or recovering from unrecoverable renderer failure.

Incremental migration may temporarily reattach the stable stage between legacy containers, but must not create new course-specific canvas lifecycles.

## DOM, HUD and accessibility

The product is canvas-first, **not canvas-only**.

- Required actions remain semantic and keyboard/touch operable.
- Essential meaning cannot exist only in pixels/color/motion/audio.
- Canvas interaction may mirror semantic actions; server commands remain authoritative.
- Reduced motion preserves causal state changes.
- Renderer failure/context loss leaves a meaning-equivalent playable fallback.
- HUD/coaching stay sparse and progressive.
- Technical evidence/debrief remains secondary/collapsed until useful.

## Phone-first contract

Current refinement targets mainstream Android/iPhone portrait use, roughly **360–430 CSS px** wide with common tall aspect ratios.

Play Canvas should:

- occupy the visual majority of the phone;
- keep focal character/action readable under overlays;
- keep primary actions thumb-sized and reachable;
- respect safe-area insets;
- avoid horizontal overflow;
- avoid device-specific forks unless evidence requires them;
- keep renderer performance/DPR bounded.

Desktop polish follows after phone quality is strong.

## Migration rule

From this point forward:

- do not add another bespoke story/mission canvas;
- do not add another page/card shell for a gameplay phase that belongs in Play Canvas;
- migrate existing story/mission/build/transfer states in bounded slices;
- keep server/evidence behavior unchanged during presentation migration;
- remove obsolete paths only after equivalent tests are green.

Current order:

1. opening + Signal 1 persistent stage/world;
2. Signals 2-6 same lifecycle;
3. Signal 6 builder/HUD into in-world Play Canvas interaction;
4. Signal 7 transfer inside Play Canvas shell;
5. remove duplicate legacy paths.

## Executable acceptance

Tests/evidence should prove:

- same Play Canvas root/stage/world/WebGL identity across compatible opening -> Signal 1;
- no duplicate renderer instance merely because mode changes;
- Back/Continue/Replay/Pause/reduced-motion semantics;
- direct first action and visible consequence/recovery;
- Signals 2-6 keep world presence;
- Signal 6 construction is game-surface interaction, not a generic web form;
- Signal 7 context change is intentional and still game-native;
- phone no-overflow/touch behavior;
- renderer context-loss/fallback remains operable;
- unrelated synthetic world mounts through the same Play Canvas + world-host boundary;
- replacing a world package cannot alter canonical competencies/evidence/history.

## Relationship to the Three.js framework

`THREE-STORY-FRAMEWORK.md` is subordinate to this contract but a required reusable subsystem when Three.js is chosen:

**Play Canvas = persistent game surface/orchestrator.**  
**Story3D runtime/host = generic Three.js engine services.**  
**World package = replaceable story/fantasy realization.**

Framework reuse earns no automatic game-quality points. It exists so future generated worlds are cheap/safe to integrate while the exact rendered experience is still judged on its own merits.
