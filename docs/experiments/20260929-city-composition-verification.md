# City composition: bounded engineering verification

The **final cost-repaired checkpoint** is `index-Bx8KJmVA.js`, SHA-256 `E9A22A65C281E808E7B9D94CA745B2D739299B42E14DEC535362241A5798D398`. The earlier results below remain as before-repair evidence; final checks are recorded at the end.

The frozen city bundle `index-BoIA-SSP.js` has SHA-256 `20B14BA96F62628B891EBCBD4A82DB8B241796F3742832BCB7D1CD6F563C90C3`. The comparison kept the sunlit courier facade URL fixed and added only `&setting=city`. No application source or build was changed during verification.

The city candidate **loaded and rendered the full scene** in one owned headless Chrome process. Actual [control arrival](../../artifacts/bellweather-arcade/city-engineering-control-arrival.png) and [city arrival](../../artifacts/bellweather-arcade/city-engineering-city-arrival.png) captures show the scene in both variants; the uniform-blue canvas observed in the separate in-app browser was not reproduced here. That in-app browser symptom remains unexplained. Local material, atelier and clean-portal resources loaded with HTTP 200, with no page, failed-request, HTTP or shader errors. The control emitted one ANGLE `X4122` precision warning; city emitted none. The process closed after the sequential check. [Full snapshots](../../artifacts/bellweather-arcade/city-engineering-engineering.json) preserve device identity and results.

Held W movement, drag orbit, pause, restart and 390×844 portrait control bounds passed in both variants. The [city near-wall view](../../artifacts/bellweather-arcade/city-engineering-city-wall.png) shows the character and wall without a collapsed camera in the sampled pose. Static source inspection confirms the added rear-wall members begin above 2.2 m, while `box()` adds movement blockers only for solids extending below 1.9 m. Relevant upper members join `cameraSolids`; the added distant districts and cloud planes create no local walking destination or blocker.

| Same-scene variant | Arrival calls | Arrival triangles | Ordinary median interval | Sampled near-wall median |
| --- | ---: | ---: | ---: | ---: |
| Sunlit control | 112 | 167,084 | 48.5 ms | 34.9 ms |
| City | 143 | 215,284 | 55.4 ms | 48.4 ms |

Intervals came from one 750 ms sample per view on ANGLE Intel UHD Graphics / D3D11 at 1102×828, DPR 1. Both variants were slower than earlier short runs; these content- and camera-dependent samples show cost in this run, not sustained frame rate or CPU/GPU utilization. The added 31 calls and 48,200 triangles at arrival are measurable rendering cost. This check does not certify all camera angles, native in-app browser stability or art readiness.

## Final cost-repaired checkpoint

The builder kept the same local walking boundary, replaced detailed upper-relief camera geometry with invisible simple-box proxies, made the visible relief batchable, and reduced tessellation only on the three newly added distant districts. A later placement adjustment raised those districts and moved one sideways for visibility; it did not change collider geometry. Source inspection found the upper relief's lowest member at approximately 2.215 m, above the movement-blocker rule. The city variant had 126 camera solids versus 106 for control. A deterministic `probeCamera(-5.65,-4.8,π,.2,6)` returned the same finite camera pose for both variants. That synthetic position lies inside the existing left-building blocker, so it is only a finite-output diagnostic, not evidence of camera behavior from a reachable player position. Native courtyard orbit and the ordinary movement checks provide the reachable-view evidence; every added upper member is not exhaustively covered.

One final sequential Chrome run, then browser closure, repeated the held-key W, drag orbit, pause, reset, portrait bounds and local resource/error checks. All passed. [Final evidence and snapshots](../../artifacts/bellweather-arcade/city-final-engineering-engineering.json) and [city arrival](../../artifacts/bellweather-arcade/city-final-engineering-city-arrival.png) / [near-wall](../../artifacts/bellweather-arcade/city-final-engineering-city-wall.png) captures show a rendered scene, not a blank canvas. The control emitted one ANGLE `X4122` precision warning; no runtime or shader failure was recorded.

| Final variant | Arrival calls | Arrival triangles | Ordinary median interval | Sampled near-wall median |
| --- | ---: | ---: | ---: | ---: |
| Sunlit control | 112 | 167,084 | 48.7 ms | 48.6 ms |
| Repaired city | 125 | 194,644 | 48.6 ms | 34.7 ms |

The repaired city saved 18 arrival draw calls and 20,640 reported triangles relative to the earlier city build; it still costs 13 calls and 27,560 triangles beyond the sunlit control. Each interval comes from one 750 ms view sample, with slightly different reached wall positions, so the apparent near-wall improvement is not a controlled frame-rate result. The separate in-app browser later recovered on reload according to the native reviewer; this Chrome run does not diagnose why it previously showed only blue.
