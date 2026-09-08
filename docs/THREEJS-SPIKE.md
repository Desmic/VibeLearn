# Three.js valley interaction spike

9 September 2026. **Opt-in prototype, not a finished game or an accepted default.** Read GAME-AS-COURSE.md for the product and review-method amendment. No live deployment is included.

## Decision and purpose

Use a small authored isometric world to evaluate whether selecting and manipulating the actual subject-relevant objects improves play. Three.js supplies rendering/scene objects, not the full game engine. Game rules, input semantics, feedback, progression, persistence and assessment remain explicit project systems. This is not a justification for a larger abstract engine or a 3D rewrite of every course.

The current optional scene has Pip, the journal, send post, memory clock, order register, ticket press, workshop, gears and bridge. Pointer selection resolves a mesh and invokes the same legal action as the semantic button. Python replays the pinned action history and owns correctness/unlocks. World truth and courier knowledge remain separate.

## Local use and dependency control

Run `python manage.py vendor`, then normal build/test/serve commands. Open `/?world=3d` in the running local app. The default URL retains the illustrated experience. Nothing here changes the live Render build command; any later deployment of this option must first add/verify the vendor build step.

Pinned dependency: **Three.js 0.180.0 (r180)**, official upstream commit `0af9729d0c143a86a1d725d6e2c3ad83301f3f34`. This is a deliberately fixed tested version, not a claim to use the newest release. `tools/vendor_three.py` fetches the two minified modules and license from that immutable commit, checks their declared Git blob IDs and records SHA-256/size in `artifacts/three-vendor.json`. Verified cached copies work offline. Generated vendor files are ignored by Git and preserved in CI evidence.

Learner sessions request these assets from the application's own origin; there is no runtime CDN dependency, external asset pack, new API key or relaxed Content Security Policy. Both local and hosted transports use exact asset allowlists. Include the upstream MIT license with distributions.

## Rendering and fallback boundaries

The prototype uses a fixed orthographic camera, low-poly procedural geometry, limited lighting, pixel ratio capped at 1.5, and no expensive post-processing. It renders on state changes, resize/hover and finite action animations rather than maintaining an idle animation loop. Reduced motion suppresses action animation. Materials, geometry, resize/listeners and renderer resources are disposed on exit.

All required actions and essential state have semantic DOM equivalents. A module-load failure or lost WebGL context restores illustrated play instead of losing learner progress. A renderer cannot award XP/evidence, unlock missions or declare mastery. Do not let pointer actions mutate a pending command or bypass legal-state checks.

## Verification and known limitations

The new `tests/game_review_browser.py` uses a real temporary HTTP server/database and actual pointer coordinates/raycasting, not mocked successful commands. It checks send-post and journal selection, keyboard focus, ordered boss rules, unsaved choice preservation, the ending, actual WebGL context loss, module-load failure and same-origin requests. See the current STATE/review report for exact passed/failed runs; this specification does not itself claim a test passed.

Run 172 rendered the scene and sent an order, then exposed a pointer test aiming behind the sticky HUD after scrolling. The test now brings the canvas into view and verifies the hit element; scenery was also moved away from journal/register targets. Run 173 passed that journal interaction but read the boss legend list before its asynchronous render. Its final screenshot/trace shows the ordered boss actually present; the probe now waits for the real response/DOM instead of assuming a click finishes the command. Both failures remain part of the evidence history.

This prototype does **not** establish real-phone frame rates, battery cost, general device compatibility, audience enjoyment, better learning, or a 9/10 game. Headless Chromium can establish rendering/input/failure-path behavior, not those broader claims. Mobile 3D object legibility and physical-device performance need additional evaluation before promoting it as the main experience.

Current design limitations include a scroll-page shell around the world, small objects with weak discoverability, tightly authored choices, and a boss that is still largely a rule panel. The next game-design iteration should improve those mechanics rather than treat adding polygons as acceptance.

## Official references

- Rendering versus game systems: https://threejs.org/manual/en/game.html
- Picking objects through raycasting: https://threejs.org/manual/en/picking.html
- Responsive render sizing: https://threejs.org/manual/en/responsive.html
- Releasing renderer resources: https://threejs.org/manual/en/cleanup.html

These sources support implementation choices. The candidate's game quality must be judged from its own rendered experience and the unchanged 9/10 rubric.
