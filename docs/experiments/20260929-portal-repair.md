# Portal export and camera-cost repair — 29 September 2026

The user asks to continue after the swept-portal comparison exposed shared mesh
QA failures and a possible near-wall cost regression. This checkpoint repairs and
investigates those issues before another visual pass. It does not expand the map,
change learning content or advance the art/production gate.

## Export repair

The editable Blender mesh has no boundary or nonmanifold edges. Triangulating its
n-gons produces collapsed triangles; the source being closed therefore did not
establish a clean game export. `authoring/repair_portal_export.py` conditions a
copy: triangulate, weld within 10 micrometres, dissolve collapsed edges,
triangulate/recalculate normals, then export only that scene's selected object.
It preserves existing loop UVs and local AO because the cleanup is microscopic;
this is not a new bake or permission to repack textured assets' UVs.

Bidirectional nearest-vertex displacement is at most 0.009983mm. This measures
vertex displacement, not a mathematical surface-distance proof. The independent
exported-GLB checker passes all 31,658 triangles, zero classified degenerates,
15 closed outward shells and all five material roles. The previous 34,108-triangle
swept file remains preserved. The new asset is optional via `form=swept-clean`.

Files: `public/crafted-portal/sunward-portal-swept-clean.glb`,
`portal-swept-clean.json`, `authoring/sunward-portal-swept-clean.blend`.
GLB SHA256: `C50E6EDF945EC0FED99B3687BB59DD5F5315322D4229DB25A024A4BB0439EA0E`.
Independent geometry evidence: `artifacts/bellweather-arcade/portal-clean-mesh-qa.json`.
The declared collider footprint and placement are inherited from the swept source;
microscopic cleanup is not claimed to preserve triangle-by-triangle topology.

The exporter exposes its format list through a dynamic callback rather than RNA
enum items in this installed Blender version. Both authoring scripts now handle
that lookup; a failed initial export stopped before writing its GLB. Original
live scenes and source files were preserved. Root inspected the conditioned model
in Blender and restored the prior scene afterward.

## Camera cost and final runtime checks

See [engineering verification](20260929-portal-repair-verification.md) for measured
camera-query work, any implementation changes, final bundle identity, repeated
frame samples and behavioral parity. Camera CPU work, overall frame pacing and
GPU utilization are separate claims; faster JavaScript alone is not smooth play.
Final native inspection and results are recorded below.

The measured wall profile found repeated static orbit searches. The repair caches
the selected orbit using player position, yaw, pitch, zoom and geometry revision;
it retains the current-camera safety ray. Geometry mutation must refresh bounds
and invalidate this static-scene cache. Six deterministic poses/orbits agree with
the uncached solver within 1e-6, and invalidation forces a fresh search.
In the repeated stationary wall samples, queries fell from 5–11 to one per update
and camera JavaScript time from about 10.5–23.6ms to 2.0–2.35ms. Overall frame
medians remain noisy and do not establish an improvement. Slightly different wall
positions limit frame-rate comparison; no GPU utilization claim is made. The
unchanged raycast path and reduced query count identify reduced CPU work, not
offloading to a GPU. This cache does not promise a speedup while the player or
camera inputs continuously change, or support moving geometry without invalidation.

Final build/typecheck passed: `index-BtbqVomh.js`, SHA256
`1ABF384508BA7EB0995C6D8A7BFEA87F0C42346506F77BAF8CD6FA0BE96EA4F1`.
The existing large-bundle warning remains. Independent exported surface comparison
finds equal bounds/declared colliders and a largest per-material area change of
0.001755m² on the roughly 110.068m² porcelain role. This corroborates the small
cleanup without implying identical topology or shading normals.

Root inspected this final build through native browser control at 1280×720.
Short presses held via small drags on the visible directional buttons established
direct walking; root approached the left wall, attempted forward movement at the
boundary, orbited while beside it, then used the visible route control to reach
the courtyard and inspected the reverse view. No clipping or obvious silhouette
change was observed in these states. This is worker verification, not a cold
all-lane review or a claim that every camera state is safe.
Captures: `portal-clean-arrival-native.png`, `portal-clean-wall-native.png`,
`portal-clean-reverse-native.png` under `artifacts/bellweather-arcade/`.
The broader art/composition gate remains open. No new visual style pass is claimed.
The return control completed back at the approach; root then paused and recentered
the preview and reset the temporary viewport override. The engineering browser is
closed. No provider dispatch, commit or deployment was performed.

## System consequence

Validate the exported triangles as well as the editable source. Conditioning must
declare tolerance, preserve texture mapping, record the changed geometry and
check the resulting asset independently. Closed-source topology and unchanged
triangle count are inadequate substitutes. Keep both control and repaired asset
until in-engine form/contact and cost are checked. This is a bounded conditioning
procedure, not universal repair for arbitrary meshes or a production rollout.
