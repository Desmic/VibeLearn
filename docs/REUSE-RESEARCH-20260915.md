# GitHub research and reuse decision — 15 September 2026

Research completed before starting Episode 1 implementation. These are relevant parts, not an existing replacement for VibeLearn's game, assessment and learner-history system. README/source inspection is not an end-to-end test of those projects. No third-party code has been copied into this increment.

| Repository | Inspected / useful pattern | Decision |
|---|---|---|
| [poloclub/transformer-explainer](https://github.com/poloclub/transformer-explainer) — MIT | README, package.json and src/routes/+page.svelte. Separate tokens, attention, embedding and output-distribution views; optional textbook; model loading is distinct from presentation. The page loads a chunked ONNX GPT-2 model and handles mobile differently. | Learn from progressive inspection and visible context/output. Do not import its Svelte/ONNX stack or heavy browser model for our first phone game. |
| [bbycroft/llm-viz](https://github.com/bbycroft/llm-viz) — MIT | README, src/llm/GptModel.ts and SavedState.ts. Actual small-model computations and 3D representation are separate; walkthrough phase/time/camera can be restored. | Keep authoritative toy computation separate from scene state; support step/rewind and spatial continuity. Study the computation display for later attention/training episodes. Do not copy its custom graphics engine. |
| [karpathy/minbpe](https://github.com/karpathy/minbpe) — MIT | README and minbpe/basic.py. Training builds merge rules; encoding applies fixed learned merges; decoding reconstructs bytes. | Best reference for Episode 2's tokenizer. Keep train/encode/decode distinct; not every tokenizer or model uses this exact algorithm. No tokenizer library needed in Episode 1's explicit whole-word toy. |
| [karpathy/micrograd](https://github.com/karpathy/micrograd) — MIT | README and micrograd/engine.py. Small computation nodes store values/gradients; backward traverses dependencies. | Good basis for understanding Episode 3's training visualization. Do not add autodiff to the context lesson. |
| [inkle/ink](https://github.com/inkle/ink) — MIT | README and integration example: compiled story data drives a runtime and choices independently of the game UI. | Preserve the content/runtime split. No branching-story dependency is justified for a short physical opening; evaluate again if authored branching becomes substantial. |
| [playcanvas/engine](https://github.com/playcanvas/engine) — MIT | README/license and our pinned 2.22.1 integration. | Continue using the existing engine; no replacement renderer. |

Source file identities from GitHub connector: Transformer Explainer +page.svelte blob 813fee435a620e26891249de87171798dde4d4a5; package.json blob d680935c0838131586b17329d652a16f7cf536cd; llm-viz GptModel.ts blob d4119547022ccf0f4cbfbce0aea33e8b129899ea; SavedState.ts blob 16d261acad6cfcefd06af558ee811b9302f579d1. These are file blobs, not repository commit hashes. Repository licenses do not automatically cover every external model, font or dataset. Retain attribution/license and pin an exact revision if code/assets are imported later.

## Our existing reusable inventory

| Item | Proven implementation | Origin / limitation |
|---|---|---|
| Persistent world | web/game-runtime.js: same world instance survives compatible story/play changes | Ours; package adapter still needed |
| Scene data and rendering | web/world-spec.js + playcanvas-backend.js: validated primitives/assets/materials, named states, authored portrait cameras, semantic picking | Ours on PlayCanvas; not an arbitrary generated-world service |
| Player/navigation | web/player-controls.js, game-character-spec.js | Our procedural hooded character, keyboard/touch movement, orbit/zoom/recenter; controls must remain operable after saves |
| Robot and blacksmith | web/assets/quaternius-*.glb, corresponding license notices; tools/vendor_game_assets.py | Imported Quaternius models, not artwork created by us; pinned hashes and transform/animation aliases |
| Learning-critical rules | app/game_rules.py | Existing allowlisted deterministic interpreter; reuse for legal episode actions |
| Saved learning work | app/service.py, storage.py, assessment.py | Existing resolved session, command receipt, revision, immutable snapshot/checkpoint/evidence mechanisms; add a new content type without renaming retry evidence |
| Opening and HUD | game-opening.js, game-screen.js, status/recovery helpers | Existing shell contains the criticized caption-stack presentation. Reuse underlying stage/input/recovery; replace that composition for the new package. |

The September 15 previous turn created review documents, a record validator and tests; it created no new raster/3D art. The Episode 1 increment will add reusable procedural workshop/pedestal/token-track props and a scene-package adapter. Report their actual use after implementation, not merely their existence.
