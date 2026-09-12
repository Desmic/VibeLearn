# Play Canvas — primary game-surface contract

**Status:** authoritative Phase 1 product/runtime contract · 12 September 2026  
**Read with:** root `CODEX-IMPLEMENTATION-PLAN.md`, `GAME-UX-SYSTEM.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `THREE-STORY-FRAMEWORK.md`, and `STATE.md`.

## Decision

VibeLearn has converged on a **Play Canvas** architecture.

The Play Canvas is the persistent game surface in which story, exploration, mission play, visible consequences, progression, chapter payoff and later game modes are staged. The product must not behave like a course website that occasionally embeds a Three.js canvas, and it must not keep spawning unrelated cinematic, mission and chapter pages that make the player mentally leave the game.

Three.js is one rendering backend **inside** the Play Canvas. `story3d-runtime.js` and `story3d-world-host.js` are therefore renderer/world-package infrastructure, not the top-level UX architecture.

This distinction is important for the general system: future generated stories/fantasies should plug into the same Play Canvas without requiring a new app shell.

## Product invariant

For an active learning game, the player should experience **one continuous play surface**.

A course may change camera, location, chapter, mechanic, HUD, interaction mode, art direction or even rendering backend, but those transitions should happen *inside the game surface* unless there is a deliberate product reason to leave it.

For the current Relay Rescue reference:

- opening story -> Signal 1 must use the same Play Canvas lifecycle;
- story-to-play should not destroy the world and open a different game page;
- Signals 1-6 should preserve Echo Forge/valley world presence while mechanics become progressively more demanding;
- Signal 7 intentionally changes into a fresh real-world transfer scenario, but it should still be presented by the Play Canvas shell rather than falling back to a normal website lesson;
- account/login/recovery remain outside gameplay but should retain the game's visual identity.

## Layering

Keep these concerns separate:

1. **LearningSpec / AssessmentEvidenceSpec** — canonical competencies, source grounding, assessment meaning, evidence, assistance, retrieval and transfer. Server-authoritative and independent of renderer/world identity.
2. **Play Canvas shell/orchestrator** — persistent game-surface lifecycle, active world/backend, game mode, stage layers, HUD/action layers, viewport/safe-area policy, pause/replay, reduced-motion coordination, transition ownership and renderer fallback coordination.
3. **Rendering backend** — Three.js today where justified; 2D/2.5D remain valid future backends. Rendering infrastructure should not know course correctness or mastery.
4. **World package/adapter** — story-specific visual world, assets/geometry, art direction, camera compositions, story states, interaction anchors and mapping from authoritative game state to visuals.
5. **Accessible action/evidence layer** — semantic DOM actions and status/fallback content, server commands, save/retry and evidence. DOM controls support the Play Canvas; they must not turn it back into a dashboard/site.

## Play Canvas responsibilities

The Play Canvas should own or coordinate:

- a stable root surface for the current game;
- a persistent stage host that can keep a compatible world/runtime alive across story -> mission -> later chapter transitions;
- `story`, `mission`, `map`, `build`, `transfer`, and future game-mode transitions;
- stage/world attachment without unnecessary renderer destruction/recreation;
- HUD/action/debrief overlay slots with progressive disclosure;
- phone viewport, safe-area and orientation-aware layout;
- pause/replay and reduced-motion coordination;
- fallback when a rendering backend is unavailable or loses context;
- lifecycle cleanup when the world package genuinely changes or the player leaves the game.

The Play Canvas must **not** decide:

- whether an answer/action is correct;
- whether a competency is mastered;
- learner evidence semantics;
- XP-based unlocking of learning truth;
- server save/revision authority;
- source/provenance validity.

## World-package integration

A future generated story/fantasy should normally integrate by providing:

- a `StoryWorldSpec`;
- a `GameExperienceSpec` describing game modes/mechanics and Play Canvas presentation;
- a versioned world package/adapter for the chosen rendering backend;
- semantic action/fallback metadata;
- mappings from authoritative game state to visible world state.

It should **not** need a new app shell, a copied renderer loop, bespoke authentication UI, or course-specific changes to Play Canvas core.

When Three.js is chosen, the world adapter consumes `story3d-runtime.js` / `story3d-world-host.js`. A genuinely new reusable capability should be generalized/versioned in that subsystem before a story consumes it.

Package identity is provenance. It never becomes competency/evidence identity.

## Persistent-world lifecycle

The migration target is stronger than “the two canvases look similar.”

When story and mission use the same compatible world package, the preferred lifecycle is:

1. Play Canvas mounts one stable stage host.
2. The world package mounts once.
3. Story beats update that instance.
4. Transition into mission changes the mode/state on the same world/runtime where practical.
5. Later compatible missions update authoritative visual state without remounting a fresh renderer merely because the DOM screen changed.
6. Dispose only when leaving the game, replacing the world/backend, or recovering from an unrecoverable renderer failure.

During incremental migration a temporary adapter may still reposition the stable stage host between legacy containers, but new work must move toward the persistent Play Canvas rather than adding more separate canvases.

## DOM, HUD and accessibility

The game is canvas-first, **not canvas-only**.

- Required actions remain semantic and keyboard/touch operable.
- Essential meaning cannot exist only in pixels, color, motion or audio.
- Canvas interaction may mirror/augment DOM actions, but server commands stay authoritative.
- Reduced-motion mode keeps the same causal state changes without requiring animation.
- Renderer failure/context loss leaves a meaning-equivalent playable fallback.
- HUD and coaching should be sparse and progressive; first touch must not expose a course dashboard.
- Longer explanations, evidence and technical debriefs stay secondary/collapsed until the player asks for them or the learning design requires them.

## Phone-first contract

Current refinement targets mainstream modern Android/iPhone portrait use (~360–430 CSS px wide, common tall aspect ratios).

The Play Canvas should:

- occupy the visual majority of the phone;
- keep the focal character/action readable under story/HUD overlays;
- keep primary actions thumb-sized and reachable;
- respect safe-area insets;
- avoid horizontal overflow;
- avoid a fixed device-specific fork unless evidence requires a breakpoint;
- keep renderer DPR/performance bounded through the rendering backend.

Desktop polish follows after phone quality is strong.

## Migration rule

From this point forward:

- **do not add another bespoke story/mission canvas**;
- **do not add another page/card shell for a gameplay phase that belongs inside the Play Canvas**;
- migrate existing story and mission rendering into the Play Canvas in bounded slices;
- keep server/evidence behavior unchanged while presentation migrates;
- preserve executable tests for save/reload, previous-chapter review, reset progress, learner isolation and accessibility.

Current migration order:

1. document Play Canvas as the top-level architecture;
2. introduce a reusable Play Canvas controller/stage host;
3. migrate Echo Forge opening + Signal 1 to one persistent world/runtime instance;
4. migrate Signals 2-6 to update the same Play Canvas/world lifecycle;
5. migrate Signal 6 builder/HUD so construction feels like in-world play rather than a web workbench;
6. keep Signal 7 as deliberate transfer, but render it through the Play Canvas shell;
7. remove obsolete duplicated story/mission mounting paths only after equivalent tests are green.

## Executable acceptance

The migration is not complete because a document says so. Tests/evidence should prove:

- the same Play Canvas root persists from the last opening beat into Signal 1;
- for a compatible Echo Forge transition, the same world/runtime/canvas instance persists rather than a second WebGL renderer appearing;
- Back/Continue/Replay/Pause and reduced-motion semantics still work;
- first mission direct actions still issue the same server-authoritative commands;
- visible mistake -> rewind -> safe recovery still works;
- Signals 2-6 retain the world through the same Play Canvas lifecycle;
- Signal 6 construction is presented inside the game surface;
- Signal 7 changes context intentionally without reverting to a generic course page;
- context-loss/fallback remains operable;
- an unrelated synthetic world can mount through the same Play Canvas + world-host boundary without Relay Rescue assumptions;
- replacing a world package does not alter canonical competencies or legitimate learner history.

## Relationship to the Three.js framework

`THREE-STORY-FRAMEWORK.md` remains valid but is subordinate to this contract:

**Play Canvas = persistent game surface/orchestrator.**  
**Story3D runtime/host = Three.js rendering subsystem.**  
**World adapter = replaceable fantasy-specific realization.**

This prevents us from mistaking renderer abstraction for product architecture and is the intended basis for future generated games/stories.