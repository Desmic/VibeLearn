# Canopy and surface checkpoint — 29 September 2026

User requests continued work after the graphics-only checkpoint. Keep story,
companions and interactions parked. Astra owns visual edits; Sol audits geometry
cost and later verifies the frozen result. No production changes or new providers.

Observed problem: random plane normals/lightness and coarse leaf silhouettes
make tree crowns read as crumpled shards. Broad green ground and repeated full-
width paving seams read as flat placeholders. This pass targets those specific
rendered defects, preserving layout, route, character and interaction scope.

Change leaf/blossom silhouettes and use canopy-oriented lighting normals; retain
actual 3D branches, cutout shadows and camera-near clearance. Improve paving
surface scale and planting-ground variation without adding screen-space filters,
new environmental features or huge geometry density. Reuse current engine and
material resources. Audit tube tessellation before spending more triangles.

Observe normal arrival, closer vegetation, changed camera, overlook and portrait.
Keep source/build evidence and focused asset/control/rendering checks. Compare
the same views with `art-focus-fixed` evidence; do not claim a quality or speed
win from source changes alone. Stop at one reviewed checkpoint, recording any
remaining reference gap rather than claiming art acceptance.

## Implementation and reuse

Root implemented `canopy.ts`: the reviewed MIT Summer Cycle painted small-leaf
atlas supplies green foliage; an original rounded five-petal spray supplies
blossoms. The atlas's red paint channel is decoded explicitly, rather than
treating its packed data channels as RGB. Per-instance normals follow the crown,
including both card faces, to remove random plane-lighting facets. Alpha-tested
shadows and camera-near clearance retain the silhouette/control protections.
Attribution and complete license are retained under `src/vendor`.

`paving.ts` adds staggered low-profile slabs, local colour variation and bevelled
edges along the existing path. `surfaces.ts` adds planted-ground colour/texture
variation. No new route, props, character, interaction or story state is added.

Sol's read-only audit identified oversampled twig/vine tubes. Root reduced only
thin world tubes to 6–8 longitudinal / 5 radial segments and short narrow vista
bands from 48 to 16 segments; trunks, major branches, rings and transit curves
retain their former sampling. These are silhouette-sensitive simplifications
that need visible review and measured counts, not an assumed speed win.

Build/typecheck passed on `index-C_cO_-VJ.js`. Native arrival inspection before
the final slab-colour adjustment showed visibly softer blossom/leaf silhouettes
and planted-ground variation. Root paused that scene before authorizing one
focused Sol browser check; final native replay and exact-build evidence follow.

The old preview process was no longer listening on port 8062. Root restarted
the same loopback preview (PID 28336, execution session 28376); HTTP returns 200.
The old browser tab was stuck on its failed-connection page, so a fresh tab in
the same in-app browser opened successfully. No firewall/security change or
additional permanent service was needed.

## Frozen verification and native observation

Final bundle: `index-C_cO_-VJ.js`, SHA-256
`2DCA92435542EFED56089C906D99469609326A559E058CAD07661444A6AACB9A`.
Source snapshot: `artifacts/bellweather-arcade/canopy-surface-source.zip`, SHA-256
`6AE680FFCEB12F8AF346A12501E4865B3AA0AB3338E6B4F927A98C24857A41B9`.
Root independently checked both hashes. Sol's [focused report](20260929-canopy-surface-verification.md)
records controls, shader/asset checks and the exact source archive with licenses.

Root reloaded the final build in native browser use, activated outward travel,
observed arrival at the overlook, dragged the camera to a side/front view,
changed to 390x844, activated return, and observed the garden arrival. The
observed views preserve character/control visibility, cast foliage shadows,
slab contact and distinct blossom silhouettes. The foreground green crown
looks less faceted; ground has tonal variation. These are informed worker
observations, not independent critic scores or art acceptance. Root captures:
`artifacts/bellweather-arcade/canopy-surface-{arrival,overlook,orbit,phone}-native.png`.
Desktop captures use 1280x720; they are not a pixel-matched comparison to earlier
captures. The temporary viewport was reset and the preview left visibly paused.

The engineering sample submitted 536,272 triangles at arrival versus about
875,000 previously (about 39% fewer). However arrival frame median/p95 was
32.8/41.1 ms, slower than the earlier sample. Content and Chrome version changed
(154 versus 153), and host conditions were not controlled. No CPU/GPU efficiency
or speed improvement is established; no cause is established either. A controlled
same-browser A/B is needed before calling this an optimization. Real background
tab behavior and physical-phone performance remain unassessed.

Art is still below the accepted reference. Distant islands/architecture remain
schematic, lighting lacks depth, and the scene does not yet achieve the chosen
graphic visual language. Keep the next work on coherent form, materials and
lighting, not encounters or added story/world features. This pass establishes
specific local improvements, not completion of the graphics gate.

Reusable system lesson: crown-normal lighting, parameterized route paving and
licensed painted atlases are separable rendering techniques. Preserve their
provenance and measured cost with the experiment; do not promote this game's
palette/layout or an unaccepted renderer into a universal platform contract.
