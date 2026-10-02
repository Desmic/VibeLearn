This standalone study uses Three.js under the MIT license and the pinned MIT Summer Cycle source packet at `artifacts/opus-art-trial-input/summer-cycle`. `src/vendor/rng.ts` is a copied utility from that packet. The source packet's `LICENSE` is preserved at `src/vendor/LICENSE`. Architecture, path, pavilion, character, vegetation geometry, materials, and controls in this checkpoint are original to this experiment. The accepted Bellweather reference guides composition and is not embedded as a texture.

The 30 September optional `surface=illustrated` comparison reuses the original
route-paving kit with bounded parameters and the same PBR lights/material shader.
Its cloud forms are original instanced sphere geometry with vertex colors; they
replace the earlier cloud cards only in that option. No external model, generated
image, provider call or new dependency was used. The first repainted-card attempt
failed visual inspection and was replaced before the frozen candidate.

Subsequent reuse: `src/vendor/leafAtlas.ts` is adapted from Summer Cycle at
`8b977baad061e797c2f6c19cfcf07c1e79b23a67`; see
`src/vendor/LEAF-ATLAS-PROVENANCE.md` and the complete `SUMMER-CYCLE-LICENSE`.
The sandstone normal/roughness images retain their local material provenance.
The `?study=facade` conservatory uses those same resources and the existing
character/canopy. New `facade.ts` architecture and `graphic-material.ts` surface
shading are original repo-native code; rounded box and mesh merge facilities
come from the existing Three.js dependency. No reference image is rendered as
world geometry, a backdrop, or a game texture.

The optional `?study=facade&portal=crafted` entrance is original geometry authored
by `authoring/build_portal.py` in the locally installed Blender 5.2.2 LTS.
`authoring/sunward-portal.blend` retains the editable result. The exported GLB
contains five materials and one 512px ambient-occlusion image baked from that
geometry; it contains no reference artwork or externally downloaded mesh.
Live Three.js lights/shadows still illuminate the model. The companion manifest
records geometry-derived jamb bounds. Existing surrounding assets/licenses and
controllers are reused. Blender is an authoring tool, not a new runtime engine.

The optional `architecture=atelier` variant uses original adjacent architecture
authored through the user's live Blender MCP connection in Blender 5.2.2 LTS.
Reproduce in order: `authoring/build_atelier.py`, `refine_atelier.py`,
`deepen_atelier.py`, `export_atelier.py`, then `export_atelier_camera.py`. These scripts preserve the existing Blender scene and add
their own study; run build/refine once on a fresh study, not repeatedly over the
same objects. `authoring/sunward-atelier.blend` retains editable objects plus the
prior portal as reference. The architecture GLB excludes that portal. Export
applies modifiers to temporary copies, repairs normals, joins by material and
derives collision bounds from the low geometry. Existing textures, plants,
character, floor, controller and portal are reused. No external model, generated
image, paid provider or new library is introduced by this variant.
`sunward-atelier-camera.glb` retains separate unbeveled parts for invisible camera
queries; it does not replace the visible model. `check_atelier.py` uses Blender's
existing manifold/signed-volume facilities for the evaluated authored solids.

The depth refinement replaces the original opaque lower window volume with two
alpha-glazed bays and original modeled interior surfaces/botanical silhouettes.
It reuses the existing authoring functions; no texture, image backdrop, provider
or dependency was added. Runtime alpha glazing is an approximation without
refraction or screen-space transmission. The foreground bed uses curved leaf
surfaces in the same existing planter. Export triangulates temporary copies and
removes collapsed triangles; source geometry remains editable. The prior asset
is preserved in `artifacts/bellweather-arcade/live-blender-atelier-source.zip`.

The optional `finish=occlusion`/`finish=daylight` variants condition a copy of the
original atelier GLB with `authoring/condition_occlusion.py` in Blender 5.2.2.
The script welds coincident seams on a bake proxy only, repacks its UVs and bakes
a 1024px, 1.5m-radius local occlusion map, then transfers UVs onto the untouched
original geometry with Blender Data Transfer. It uses four CPU
threads and 24 samples. This is not a sunlight/global-illumination bake or generated
content. Runtime camera/collision assets stay the originals. Failed initial bakes
are retained outside `public` in `artifacts/bellweather-arcade/rejected-occlusion-bakes`.
The v4 conditioning receipt pins the source/output hashes and measured bake time.
The daylight variant also reuses the original `vista.ts` scenery and tree textures
at reduced background detail, without extending the playable footprint or adding
new asset sources. No Hugging Face account, provider, purchase or subscription was used.

The optional `form=swept` portal is derived from our original editable portal by
`authoring/sweep_portal.py` in Blender 5.2.2. Only vertices above 3m are deformed;
local AO is rebaked on preserved UVs. The separate `.blend`, `portal-swept.json`
and `sunward-portal-swept.glb` retain source/identity and unchanged low colliders.
The saved original portal concept informs the upper silhouette; no image is used
as a scene billboard and no external 3D generation was performed. This original
derivative retains the source asset's rights.

`form=swept-clean` selects a conditioned copy from
`authoring/repair_portal_export.py`. It triangulates before removing microscopic
collapsed edges, keeps UVs/AO and preserves the original source. Maximum measured
nearest-vertex displacement is under 0.01mm. Exported QA finds zero degenerate
triangles and 15 outward closed shells. This corrects export topology; it is not
a new visual design, texture generation or provider output.

`character=courier` is an original code-authored character study in
`src/zip-courier.ts`, derived from our existing robot's identity and the accepted
graphic-utopia art direction. It uses the installed Three.js rounded-box and
geometry-merge utilities; no external mesh, texture, model service or dependency
is added. The original character remains available. Material batching is for the
current static pose only; there is no rig, cloth simulation or new animation.

`look=sunlit` reuses these assets, textures and lights in one coordinated
comparison. An optional tree-generation profile changes branch/spray arrangement
and spatial colors; the default profile is preserved. No provider or new external
content is involved. Larger cutout cards are an art choice, not proof of lower GPU
cost. See `docs/experiments/20260929-sunlit-scene.md` for measured scope and limits.

`setting=city` reuses our existing `vista.ts` island/house/transit/cloud geometry
and `sky-art.ts` generated orbital sky. New side/reverse districts use lower
subdivisions; the playable boundary is unchanged. Rear architectural frames and
sun-screens are original additions assembled from existing primitives/materials,
with simple invisible camera proxies. No external art, provider or dependency
was introduced. See `docs/experiments/20260929-city-composition.md`.

`districts=terraces` extends that same kit with original stepped/low-gallery
profiles, a small curved roof surface and a slimmer tower profile. It reuses the
existing materials and pigment shader, and reframes the existing orbital group.
No downloaded assets, added texture source or provider was used. See
`docs/experiments/20260929-district-silhouettes.md` for the bounded comparison.
