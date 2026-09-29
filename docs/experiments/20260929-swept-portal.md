# Swept entrance silhouette — 29 September 2026

The user asks to continue and use pauses for reflection. This pass tests one
specific remaining gap from the ceramic study: a conventional arch silhouette
inside an otherwise simple architectural composition. It uses the saved original
portal concept for the asymmetric sweep, without claiming to reproduce its asset
quality or completing the deferred generated-asset comparison.

## Change and boundaries

`authoring/sweep_portal.py` appends a copy of the existing original portal into a
separate Blender scene. A smooth deformation above 3m broadens and raises the left
shoulder and moves it slightly forward. The lower vertices remain fixed; all
original topology, material roles and UVs are retained. Local AO is rebaked on the
changed shape at 512px, 24 samples, four CPU threads. Camera queries use the actual
new mesh; the low collision footprint remains the original. A separate editable
`.blend`, GLB and manifest preserve the result. Prior assets/scenes are retained.

The upper shoulder meets the adjacent left building intentionally; this is an
architectural join, not an added low obstruction. No map, foliage, character,
controller, camera algorithm, learning content or provider changes. The study
adds an asset variant, not a universal deformation/generation system. HF remains
deferred. This is reuse of an original authored mesh, not generated 3D.

Control: ceramic daylight URL without `form`.
Candidate: `http://127.0.0.1:8062/?study=facade&portal=crafted&architecture=atelier&finish=daylight&palette=ceramic&form=swept`.

Bundle `index-lyZdIzAB.js`, SHA256
`3162D38578D98A39C2C5FCD237E66AAF6E5D143D6EE12C23973C5A28E6EECDD2`.
New GLB SHA256
`1c0d16007e16ca3c29466a2fccdfa803c1af9752761bbafa40d10836f330f24e`,
1,106,020 bytes versus 1,101,132 bytes for the original. Blender reports 34,108
triangles, unchanged; independent exported checks are recorded separately.
Build/typecheck pass with the existing large-bundle warning.

## Worker observation and judgment

Root inspected the isolated Blender asset, then the actual running arrival at
1280×720, activated the visible walk-through control, observed courtyard arrival,
orbited to side/reverse views and activated return. The UI confirmed return.
The preview was paused and temporary viewport override reset. Original Blender
scene was restored. Native captures are in `artifacts/bellweather-arcade/`:

- `swept-arrival-native.png`
- `swept-oblique-native.png`
- `swept-reverse-native.png`

The upper sweep is more distinctive and the open garden view remains legible.
The asset/building join is visible from the side; no obstruction appeared on the
observed route. This is a modest local improvement, not reference-quality world
acceptance. Broad plain walls, the simple protagonist, sparse distant forms and
the composition as a whole remain unresolved. Do not infer expressive animation,
physics certification, inhabited-world appeal or learning value from this pass.

Focused engineering results: [verification](20260929-swept-portal-verification.md).
Held-key movement, jamb contact, aperture/return, orbit, camera, pause/reset,
portrait and resource checks pass; the owned test browser was closed. Arrival
draws/triangles match at 146/169,762. Single 1.25-second near-wall samples are
48.6ms control versus 55.5ms swept, an unresolved possible regression. Idle and
active movement medians are similar. No sustained frame or CPU/GPU claim follows;
keep this an optional visual candidate rather than promote it on appearance alone.
The independent export comparison finds all 9,706 triangles wholly below 3m
unchanged by position. Smoothing normals are not an invariant: 87 low
position/normal records differ near the deformation boundary. A strict closed-
shell checker fails on both the original and the derivative; 18 and 16 tiny
degenerate triangles respectively are classified. This is not a clean watertight
asset certification. Keep the original diagnostic alongside the candidate result
instead of silently treating a shared defect as a pass.
A triangle-winding versus stored-normal screen flags 32 opposing triangles in
the original and 33 in the derivative. This is a diagnostic, not proof of a new
inward fold or a substitute for a correct per-surface topology check.
Full integration still requires application/presentation checks and the one
fresh-context Astra play/review across all critic lanes. Audio/motion-quality
reviews remain deferred. No commit, deployment or production promotion follows.

## System lesson

A reference can identify a specific silhouette relationship that is inexpensive
to test on an existing asset. Declare which geometry may change and which must
remain invariant; check the exported result, not only the authoring scene. A
shape change needs updated normals/shading and camera geometry even when ground
collision stays unchanged. Compare the asset in its neighbouring composition,
not just an attractive isolated model. This pass is one example, not proof that
deformation is the right production method for every asset or style.
