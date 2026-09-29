# Atelier depth iteration: engineering verification

This is a bounded check of the optional `?study=facade&portal=crafted&architecture=atelier` study against the current crafted facade, plus a default-arcade smoke check. It does not certify art quality or finished gameplay. The root reviewer separately played the final candidate natively and saved `artifacts/bellweather-arcade/atelier-depth-final-arrival-native.png` and `atelier-depth-full-reverse-native.png`.

## Frozen identity

- Served final bundle: `index-Bw0s9O-m.js`, SHA-256 `E09AD041A4210C880A69D00FD6C82A69F74131A024FB6655C2A8F51F78A3143A`.
- Visible atelier GLB: SHA-256 `FCFED0118BCC450C5AB0A825677F84B3A3F795A1DEEE413B16824E0775676910`; 22,968 triangles and 10 materials. Camera proxy GLB: SHA-256 `799738C13CADD6D31F7AF5284415256D2EA58993CCC95932F2FE53B6AE1A4292`; 89 separate parts and 8,372 triangles. Both loaded from local paths.
- Editable Blender source `.blend`: SHA-256 `C8172EA8E4580AD0189651E56EB2D630FF9C6BD2B67CA91BCCC9156CDC86F869`.
- Exact source, authoring scripts, model assets, test scripts and provenance packet: `artifacts/bellweather-arcade/atelier-depth-source.zip`, SHA-256 `13AFE6C2940AA8B847FA7F68B34ABA6A3F183A99C791ACBFE1EA72129936B448` (52 files; excludes `node_modules`, `dist`, `.git` and Blender backup files). Prior source packet and A/B evidence remain unchanged.

## Export and camera query

`authoring/export_atelier.py` now triangulates temporary joined export copies and removes collapsed triangles before GLB export; it leaves the editable authored parts intact. Blender's evaluated-source check found 89 manifold closed parts with positive signed volume (`artifacts/bellweather-arcade/atelier-blender-geometry.json`). The independent final exported-GLB check found **22,968 valid triangles, zero classified degenerates and 89 outward closed shells** (`atelier-depth2-mesh-qa.json`). Its degenerate classification welds positions to `1e-5` units and rejects cross-product squared below `1e-18`. The earlier export's 544 classified degenerates are resolved in this final asset. An intermediate export failed the welded-shell check where separately authored leaves shared an attachment point; the author staggered those attachments before the final export.

`src/main.ts` now caches conservative world-space bounds of the static camera solids, then passes only solids whose bounds intersect each camera ray segment to the same exact Three.js raycast. This changes query work, not camera framing or the hit calculation. On the actual 89-part camera GLB, 2,592 camera-like rays from nine approach, wall and interior pivots produced identical nearest hit distances with and without the filter (within `1e-6` m). The filter passed a median of 0, 95th percentile of 3 and maximum of 11 parts per ray; 678 rays hit. In a Node wall-clock comparison using two warm-up pairs and six alternating repetitions over the same ray set, median full query time was **29.24 ms** versus **16.50 ms** filtered (`atelier-depth2-camera-bounds-qa.json`). That isolated query measurement is neither browser frame time nor CPU/GPU utilization. Cached bounds assume static obstacles; moving camera solids would need bounds refresh.

## Browser checks and limits

`verify-atelier-depth.mjs` ran the current crafted facade and atelier sequentially in one owned headless Chrome process at 1102×828, DPR 1, ANGLE Intel UHD Graphics / D3D11, then closed it. Matched W/S movement, orbit, crafted-jamb contact, aperture passage/return, near-wall camera distance (~5.9566 m), pause/restart and 390×844 controls bounds passed. The baseline and atelier positions differed by 0 m at arrival, 0.002 m after approach and 0.066 m after passage. All local material/model assets loaded with HTTP 200; no page, shader, console or resource errors were recorded. A third context checked default arcade W movement, orbit, pause and resume after the shared `main.ts` change. Full snapshots and screenshots are in `artifacts/bellweather-arcade/atelier-depth-ab-engineering.json` and `atelier-depth-ab-*.png`.

| Final-bundle variant | Arrival calls | Arrival triangles | Idle median interval | Active W median | Near-wall median |
| --- | ---: | ---: | ---: | ---: | ---: |
| Current crafted facade | 192 | 171,816 | 27.7 ms | 27.8 ms | 48.6 ms |
| Atelier depth | 178 | 196,292 | 34.6 ms | 34.6 ms | 55.5 ms |

Each pacing value is one 1.25 s browser sample. The atelier's near-wall sample remains slower than the current facade, and ~55.5 ms is below the desired smooth-play cadence. This content differs from the earlier proxy candidate, so its timing cannot isolate the camera change or establish a cross-build speedup. The captured arrival, near-wall and phone views show the authored architecture and readable full character without an obvious geometry disappearance or camera collapse at those sampled states. Other orbits, sustained performance and art/world-direction acceptance remain unassessed here.
