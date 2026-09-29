# Ceramic material comparison: bounded engineering verification

The frozen `index-B6gI-lo7.js` bundle has SHA-256 `81201B7382688407A80D49498CEF1310D112E0D4C4626FE9D6F3EBA16AE55D1B`. This check compared the existing daylight atelier URL with the same URL plus `&palette=ceramic`. Both variants used the same v4 conditioned GLB, camera proxy, collision footprint and authored route. The study remains an experimental visual candidate; the root reviewer owns its art judgment.

`verify-relighting-ab.mjs` now accepts an optional safe output prefix and derives the expected atelier asset from each URL's `finish` parameter. The previous default prefix and evidence remain intact. With the `ceramic-ab` prefix, it visited both variants sequentially in one owned headless Chrome process at 1102×828, DPR 1, ANGLE Intel UHD Graphics / D3D11, then closed the browser. Held keyboard movement, orbit, crafted-jamb contact, aperture passage and return, near-wall camera distance (~5.9566 m), pause/restart and 390×844 control bounds passed. Arrival and passage positions matched; the timed approach positions differed by 0.070 m. Both variants loaded the v4 GLB, camera proxy, crafted portal, material images and embedded AO image with HTTP 200. No page, shader, console or failed-resource errors were recorded. Full snapshots and captures: `artifacts/bellweather-arcade/ceramic-ab-engineering.json` and `ceramic-ab-{baseline,candidate}-*.png`.

| Daylight variant | Arrival calls | Arrival triangles | Idle median interval | Active W median | Near-wall median |
| --- | ---: | ---: | ---: | ---: | ---: |
| Control | 146 | 169,762 | 27.7 ms | 27.8 ms | 48.6 ms |
| Ceramic palette | 146 | 169,762 | 20.9 ms | 27.8 ms | 48.6 ms |

Each interval is one 1.25 s browser sample. Identical draw and triangle counts support that this palette comparison did not change rendered geometry at arrival. The shorter candidate idle sample is not evidence of sustained speed improvement; near-wall pacing remains below the desired smooth-play cadence. These measurements do not establish CPU/GPU utilization, visual acceptance or every possible camera angle. The sampled arrival, wall and phone captures show the full character and loaded architecture without an obvious disappearance or camera collapse.
