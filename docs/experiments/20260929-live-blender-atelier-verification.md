# Live Blender atelier: bounded engineering verification

The optional `?study=facade&portal=crafted&architecture=atelier` study is an experimental visual checkpoint, not an accepted game or art gate. The root reviewer performed native outward/return and reverse-camera play; captures are `artifacts/bellweather-arcade/atelier-proxy-final-arrival-native.png` and `atelier-proxy-final-reverse-native.png`. This report covers the separate, sequential automated A/B and exported-geometry checks.

## Frozen identity and repair

- Initial candidate bundle: `index-B5jzuxXL.js`, SHA-256 `999210A30BA8F4EFDEA7EFD23E22A9DB8D5ACDC4BEC0E89D86391507C548C783`.
- Final camera-proxy bundle: `index-BCaFV6vI.js`, SHA-256 `58CB99C3DA466076902142AD2847DDA679D2E0EB9FC5B680782125FCC811F62D`; `npm run build` passed TypeScript and Vite. Loopback preview on port 8062 served this bundle.
- Visible atelier GLB SHA-256 `1374F8180C7DDC7FB9D4B9A53A0F6C970679885BD2E2BEF32B5363319A2EF464`; invisible camera GLB SHA-256 `CCD1AA97BA79F0727478D8F52E74384FBFDF3EAE482E964A6FD7DA86E9176A18`.
- `src/atelier.ts` now uses the 50 separate, unbeveled authored parts for explicit camera raycasts and leaves the five visible material meshes out of `cameraSolids`. The proxy is invisible and retains the original world transforms. Neither visible architecture nor player collision bounds changed.
- Exact source/asset packet, including Blender `.blend`, authoring/export/check scripts and license provenance: `artifacts/bellweather-arcade/live-blender-atelier-source.zip`, SHA-256 `81496A602DFD79AF1C6BBC4394961EC01C1F2FF12C82DA40C0CE0243E0FCD164` (50 files; excludes `node_modules`, `dist`, `.git` and `.blend1` backup).

## Matched browser result

`verify-atelier.mjs` visited the current crafted-portal facade and atelier variant sequentially in one owned Chrome process, each at 1102×828, DPR 1, on ANGLE Intel UHD Graphics / D3D11. It closed Chrome in `finally`. The same manual W/S, orbit, near-wall, crafted-jamb, aperture, return, pause/restart and 390×844 portrait steps passed. Camera distance at the wall remained approximately 5.96 m in both variants; arrival, approach and through positions differed by 0, 0.022 and 0.083 m. The test saw no page errors, shader errors, driver warnings or failed/HTTP-error resources. The two material images, crafted portal and both atelier GLBs/manifest loaded with HTTP 200. Phone controls stayed within the viewport without horizontal overflow. Full snapshots, assertions, device identity and captures: `artifacts/bellweather-arcade/atelier-ab-engineering.json` and `atelier-ab-{current,atelier}-*.png`.

| Variant in final bundle | Arrival calls | Arrival triangles | Idle median frame interval | Active W median | Near-wall orbit median |
| --- | ---: | ---: | ---: | ---: | ---: |
| Current crafted facade | 192 | 171,816 | 34.7 ms | 27.8 ms | 34.8 ms |
| Atelier | 168 | 181,764 | 34.6 ms | 28.0 ms | 62.4 ms |

Each pacing cell is one 1.25 s `requestAnimationFrame` sample. The initial candidate's near-wall medians were 48.6 ms current and 145.8 ms atelier; those original snapshots/captures remain under `artifacts/bellweather-arcade/atelier-preproxy/`. Final proxy draws/triangles at arrival equal the initial atelier values (168/181,764), so the proxy introduced no visible draw/triangle cost. Near-wall pacing improved substantially but remains slower than the matched current facade. These short headless-browser intervals are not a CPU/GPU utilization or device-wide performance claim, and they do not isolate camera raycasting from every other rendering cost. Final arrival, wall and phone captures show the authored architecture present without obvious clipping or disappearance; the browser checks do not establish visual acceptance.

## Geometry scope and open limits

The Blender `authoring/check_atelier.py` evaluation found all 50 original closed parts manifold, with positive signed volume; see `artifacts/bellweather-arcade/atelier-blender-geometry.json`. This checks authored parts before joining/export, not the final GLB topology. The separate Blender-independent exported-GLB check (`verify-atelier-mesh.mjs`, result `artifacts/bellweather-arcade/atelier-mesh-qa.json`) classified **544 of 17,288 exported triangles as zero-area** after vertex-position welding at `1e-5` units or cross-product squared below `1e-18`; it excluded those triangles and found 50 remaining closed, outward shells. Those degenerates are an unresolved export defect and modest geometry cost. The source-part manifold result does not erase the exported finding. Full physical simulation, sustained performance across machines and art/world-direction acceptance were not assessed here.
