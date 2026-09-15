# Reusable pieces used by Episode 1

15 September 2026. These are implemented files, not a claim that an on-demand course generator exists.

## Existing framework actually used

| Piece | Use in the new episode |
|---|---|
| `web/game-runtime.js` | One persistent PlayCanvas world from opening into both deliveries; saved commands do not recreate it. Opening replay uses an isolated presentation runtime. |
| `web/game-opening.js` | The courier arrival and machine wake action use the existing validated opening package/controller, including skip, pause and replay. Completed action markers can now disappear. |
| `web/world-spec.js`, `playcanvas-backend.js` | Compile the courtyard, machines, characters, materials and asset references; semantic picking and scene patches. No new renderer. |
| `web/player-controls.js` | Keyboard/touch movement, orbit, zoom and recenter. Optional validated portrait distance now survives recenter. |
| `web/game-character-spec.js` | Our existing procedural hooded player and movement profile. |
| `app/game_rules.py` | Executes the new episode's legal actions and deterministic replay. |
| `app/service.py`, storage and assessment | Existing session, receipts, revisions, snapshots, assisted-practice checkpoints and immutable evidence. New AI identities; retry evidence is unchanged. |

## New reusable assets and code

| File | What was made / reuse evidence |
|---|---|
| `web/workshop-props.js` | Procedural token track, message machine, pavilion, tree and flower/book parcel components. Pavilions appear twice; trees four times; the parcel component is used by both courier and recipient with the two content variants. These are code-generated 3D primitives, not new downloaded artwork. |
| `web/spec-game-world.js` | Small WorldSpec-to-GameRuntime package adapter: state presentation, timed movement, pause/reduced motion, readiness and cleanup. Automated real-browser proof also mounts a materially different orchard scene through it. |
| `web/word-machine-world.js` | The authored courtyard composition and opening data. Its context/delivery presentation mapping is episode-specific. |
| `app/word_machine.py` | Episode-specific authored prediction toy and GameRulesSpec. This is not a trained model or a reusable general LLM implementation. |
| `web/word-machine-boot.js` | Actionable recovery if an entry-module/engine import fails under the existing Content Security Policy. |
| `tools/check_critic_review.py` | Review record validator from the previous increment. It checks evidence references and strict criteria; it does not watch the game, create ratings or grant user acceptance. |

## Imported assets already present

The courier is the existing Quaternius animated robot, provisioned by `tools/vendor_game_assets.py` with pinned hashes and its license notice. The existing Quaternius blacksmith remains available for Relay Rescue; this episode does not use it. Neither model was made by us. PlayCanvas is the existing pinned 2.22.1 engine. No new third-party source, model weights or raster artwork was imported in this increment.

See [REUSE-RESEARCH-20260915.md](REUSE-RESEARCH-20260915.md) for the six public repositories inspected before implementation. The useful patterns informed the work; their Svelte/ONNX/custom-renderer stacks were not added.
