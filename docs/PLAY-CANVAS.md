# Legacy Play Canvas migration contract

**Status:** legacy/migration document · superseded strategically on 12 September 2026  
**Authoritative replacement:** `GAME-RUNTIME-ARCHITECTURE.md` and root `CODEX-IMPLEMENTATION-PLAN.md` 2.0.

## Important naming correction

The internal VibeLearn term **“Play Canvas”** is deprecated because it conflicts with the actual **PlayCanvas Engine** product that is now the first strategic engine backend.

Existing files such as `web/play-canvas.js`, `web/play-canvas.css` and `web/play-canvas-migrate.js` may remain temporarily to preserve the current Echo Forge reference during migration. Their names must not be treated as the long-term architecture.

New architecture/code should use unambiguous terms such as:

- `RuntimeExperienceSpec`;
- `GameRuntime`;
- `WorldRuntime`;
- `EngineCompiler`;
- `EngineTargetSpec`.

## What remains valuable from this work

The previous Play Canvas migration established useful product/runtime invariants that survive the engine pivot:

- active play should feel like one coherent game/world rather than course pages with occasional canvases;
- story, exploration, missions, building and transfer should preserve world/game identity where meaningful;
- compatible states should avoid unnecessary teardown/recreation;
- HUD and semantic controls should support the game instead of dominating it as dashboard UI;
- phone, touch, safe-area, reduced-motion and accessible fallback behavior remain required;
- client rendering never decides correctness/mastery/evidence.

These invariants now belong in `RuntimeExperienceSpec` and the engine-neutral runtime framework rather than a Three.js-specific or canvas-specific shell.

## Migration only

Current Echo Forge code may continue using the legacy Play Canvas layer only while the new PlayCanvas Engine backend is being established.

Do not:

- add new strategic features to the legacy Play Canvas controller;
- make generated WorldSpec depend on its DOM/classes/API;
- use it as the basis for future Unity/Unreal integrations;
- confuse it with PlayCanvas Engine.

Instead:

1. extract semantic runtime requirements into `RuntimeExperienceSpec`;
2. define engine-neutral world/game schemas;
3. implement the PlayCanvas Engine backend;
4. port Echo Forge opening + Signal 1;
5. migrate later signals after the new backend seam is proven;
6. remove obsolete legacy Play Canvas code when parity and quality gates are green.

## Preserved acceptance requirements

During migration, continue testing:

- coherent story -> play transition;
- stable semantic action IDs;
- save/reload and server-authoritative state;
- Back/Continue/Replay/Pause semantics;
- reduced-motion/accessibility behavior;
- phone no-overflow/touch behavior;
- deliberate failure/fallback behavior;
- no renderer/client event creating learning evidence;
- world/game identity through increasing challenge.

The strategic target is no longer “one Play Canvas.” It is **a portable engine-neutral game/runtime specification that can be compiled to PlayCanvas now and other engines later**.
