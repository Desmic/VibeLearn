# Arcade revision 2 — bounded engineering verification

29 September 2026. Root owns this visual revision. I did not edit its geometry, camera, lighting, palette, or materials. I added only `experiments/bellweather-arcade/verify-root-revision2.mjs` for a single owned headless Chrome verification workflow. It closed the browser in `finally`; the existing loopback preview continues at `http://127.0.0.1:8062/`, PID `49220`.

`npm run build` passed typecheck and Vite production build. Exact bundled JS: `experiments/bellweather-arcade/dist/assets/index-C1DqZjuq.js`, SHA-256 `E5EF88B70CB355BD735956CFD1B8AD5BB8804D99934FB477443FE44EE916C2B5`. Checksummed source and verifier checkpoint: `artifacts/bellweather-arcade/root-revision2-source.zip`, SHA-256 `8FC51C6ED91DFACF83BD39F802E721030B9E531F58221C7A87757FEE5C8648C4`. Captures: `root-revision2-arrival.png`, `root-revision2-overlook.png`, `root-revision2-phone.png`; measurements and assertions: `root-revision2-engineering.json` in the same artifact directory. Prior first and repair-1 artifacts remain unchanged.

Headless Chrome 153 on **Intel UHD Graphics, Direct3D 11**, at 1102×828, DPR 1, observed keyboard W advance, camera drag changing the camera, Escape pause freezing position and frame count, resumed guided travel to route parameter `.9467`, reverse travel starting toward the arcade, and restart resetting to the arrival. At 390×844, pause, route, place, and controls stayed inside the viewport with no horizontal overflow. The place pill (bottom 748 px) and controls container (top 743 px) overlap in their bounding boxes by 5 px; the screenshot is needed to judge actual legibility. No page errors or application console errors occurred. One Direct3D shader compiler precision warning (`X4122`) was recorded separately; the first verifier run treated it as a failure, then the exact check was rerun filtering only that warning. No application code was changed in response.

The **390×844 screenshot shows a material visual/controls blocker**: after orbiting at the overlook, beginning the return route, and resizing, large foreground foliage covers most of the world and leaves Zip barely visible. The route still moves and the controls fit, but this camera view is not usable. Root was notified and retains visual implementation ownership. This script did not attempt an art or camera repair.

Renderer samples on that Intel UHD browser:

| State | Renderer calls | Triangles | 1.25 s app frames | Median / p95 `requestAnimationFrame` interval |
| --- | ---: | ---: | ---: | ---: |
| Arrival, 1102×828 | 737 | 604,930 | 73 | 14.1 / 20.9 ms |
| Overlook, 1102×828 | 509 | 561,347 | 83 | 13.9 / 20.9 ms |
| Return route, 390×844 | 448 | 543,379 | 136 | 7.0 / 14.0 ms |

Repair 1 had 724 calls and 332,987 triangles at arrival, and 579 calls and 316,946 triangles at the overlook in its own 1102×828 smoke. Revision 2 substantially changes the rendered content, so these figures show the current cost profile rather than a same-content optimization benchmark. They do not establish RTX 3060, phone-device, CPU/GPU utilization, or broad performance readiness. Camera raycast currently checks 133 selected solids.

A second tab was brought to the front to seek actual background-tab evidence, but this headless browser still reported the game document visible. Real hidden-tab behavior remains unassessed; no simulated `document.hidden` override was used in this run. Root native GUI review remains necessary for the exact visual revision and the phone occlusion.

## Targeted clearance rerun

Root changed only the visual/camera presentation after this report: nearby foliage uses a 1.3–3.4 m shader dither clearance and the portrait place label sits 18 px higher. Exact built JS `index-DWK7qCVY.js` has SHA-256 `478A2A3D0235F4507ED21379E529478F3604DB927A3856017DE156A84712EC08`. I changed only the verifier's artifact prefix and reran the same orbit → outward route → return → 390×844 resize sequence. Captures and JSON use `artifacts/bellweather-arcade/root-revision2-clearance-*`, preserving the prior evidence.

The former phone blocker **cleared in this exact reproduction**: Zip, the pavilion, tree structure, and route context are visible in `root-revision2-clearance-phone.png`; the previous capture was almost entirely covered by one green leaf. The route, manual movement, pause, restart, camera orbit, and phone bounding checks passed again. No application console/page errors appeared; the same isolated Direct3D shader precision warning `X4122` was recorded. Calls/triangles were unchanged in the sampled arrival (737/604,930), overlook (509/561,347), and narrow return (448/543,379) states. This Intel UHD headless check does not establish real phone performance or the entire range of camera/tree angles. The test browser closed, and actual background-tab visibility remains unassessed.
