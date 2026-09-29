# Existing-asset conditioning and lighting comparison

29 September 2026. The user defers Hugging Face subscription work and asks us to
continue with available capabilities. This is a bounded isolated visual study,
not an accepted game, engine migration or full critic review.

## Hypothesis and scope

Improve the existing architecture's recess/contact readability with offline
conditioning and live lighting, then frame the entrance using existing distant
scenery. Keep the 18x22m playable footprint, character, route, collisions and camera
proxy. No new story, learning, NPC activity or map. Root owns visual production;
Sol verifies geometry and runtime behavior against the unchanged baseline URL.

- Baseline: `http://127.0.0.1:8062/?study=facade&portal=crafted&architecture=atelier`
- Conditioning only: append `&finish=occlusion`.
- Visual comparison: append `&finish=daylight`.

## Actual changes and useful boundary

`authoring/condition_occlusion.py` applies Blender's existing import, seam welding,
UV packing and baker to a copy of an untextured static GLB. The original mesh and live
authoring scene remain preserved. The first bake wasted nearly all its UV atlas
on disconnected triangle islands; the second also exposed glTF's cross-scene
selection export default. A v3 export then lost thin triangles during seam welding;
Sol's independent mesh check rejected it before runtime acceptance. The corrected
v4 uses welding only on a bake proxy and transfers UVs to untouched originals with
Blender's Data Transfer modifier. It obtains 65.3% bake-proxy UV coverage and
explicitly exports only its active scene. Failed artifacts are retained outside
the served asset directory.

The final bake uses one 1024px texture, 1.5m occlusion radius, 24 samples and four
CPU threads; the final conditioning/UV-transfer/export portion took 39.9 seconds. This
excludes debugging, setup and visual review. The conditioned GLB is 2,046,188 bytes
versus the original's 1,386,884 bytes. Its receipt records source/output hashes.
This is local occlusion, not global illumination or baked direct sunlight; dynamic
shadows still come from the engine. Independent shape/normal parity is a separate
verification obligation after conditioning, not inferred from a successful export.

The daylight variant rebalances the existing lights and removes procedural grain
from the conditioned mineral materials while retaining their shade-family logic.
It refreshes the shadow map when the only moving caster, Zip, changes position or
heading. Future moving objects/lights must explicitly invalidate this cache;
it is not a general animation-safe shadow policy. Camera orbit alone need not
re-render a light-space map. The active frame loop still renders the main scene.

The first lighting-only inspection showed a modest local improvement, insufficient
for the whole frame. The second visual revision reuses the existing vista kit,
removing distant structural detail and fine tree branches and disabling background
shadow passes. This replaces the blank aperture with depth and a flowering focal
point. It adds distant render geometry; it does not make those islands playable.
The building silhouettes and composition remain stylized and below the selected
reference. No further detail pass is justified merely by this local improvement.

System value is conditional asset processing and a cheaper existing scenery
variant, with source/runtime semantics preserved. This is a reusable procedure
tested on one asset, not a validated universal conditioner or a completed platform
integration. Generated assets will need the same kind of inspection later.
The pilot explicitly rejects textured and rigged/animated inputs: repacking an
existing texture's UVs would invalidate it. Such assets need preserved UVs plus
a separate AO channel, or explicit texture reprojection. Do not apply this script
blindly to a future Hunyuan PBR output.

## Native observations

Root inspected arrival, used the visible walking control through the entrance,
orbited to the reverse view and used the return control. Keyboard taps through the
available native interface did not establish sustained manual locomotion; the
engineering run checks held keyboard inputs separately. These are worker GUI
observations, not a fresh-context reviewer or a motion/physics certification.

Evidence under `artifacts/bellweather-arcade/`:

- `relighting-v4-arrival-native.png`
- `relighting-v4-courtyard-native.png`
- `relighting-v4-reverse-native.png`

The earlier `relighting-final-*` captures show the superseded v3 conditioned
geometry and must not qualify the final candidate. v4 native observations use
`index-Dow4yO3h.js`, SHA256
`CCA80D3552EB8333BA8A5FE65588F09D016015984C63FAE0C440FA2894D5A5A6`.
Sol's independent v4 check retains 22,968 valid triangles and 89 closed outward
shells, with exact position, normal, position-normal-pair and position-defined
triangle sets matching the original, and all ten material-role triangle counts
matching. This establishes shape preservation, not appearance or performance.

Integrated application tests/presentation/all-lane cold criticism remain required
before production integration. Focused build, exported-mesh and matched browser
checks apply to this isolated comparison. The [completed engineering report](20260929-existing-asset-lighting-verification.md)
records passing build/typecheck, geometry parity, movement, collision, camera,
pause/reset, portrait and asset checks against the final bundle. Matched short
samples show essentially unchanged frame timing; near-wall movement remains
about 49ms per frame. Lower reported draw counts do not establish a CPU/GPU
utilization improvement. The owned test browser was closed and the native preview
left paused. The report also identifies the archived source/asset packet and hash.

## Prepared input for the deferred generation comparison

The built-in image tool produced one isolated original portal reference with
the accepted scene as style guidance: [image and exact prompt](../references/sunward-portal-concept-20260929.md).
It establishes a concrete candidate silhouette/material treatment for a later
asset trial; it is not inserted as a billboard or substituted for game geometry.
The image is preserved in the repository. No HF subscription or inference was used.
