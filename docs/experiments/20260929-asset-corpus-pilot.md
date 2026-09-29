# Asset corpus pilot — 29 September 2026

## Outcome

Implemented a small offline corpus boundary and an isolated native-browser asset
comparison. **No game art promotion.** The stock KayKit tree forms are not a fit
for Bellweather's accepted foreground/landmark direction. Acquisition is useful
system progress, not evidence that the game's graphics improved.

This follows v3 sections 5–7 and Priority 2: reuse first, style-family selection,
conditional Blender, and honest gaps. It does not implement a provider fleet,
universal generator or Terminal PM live orchestration.

## Actual assets and provenance

Downloaded the free **KayKit Forest Nature Pack 1.0** from the
[creator's official page](https://kaylousberg.itch.io/kaykit-forest), through its
free-download UI. Selected three trees, one shrub, grass and a rock; copied
original glTF/buffer files, shared atlas and included CC0 license unchanged.
The selected files total 130,068 bytes including the license, excluding the
additional provenance manifest. The original archive is 6,435,630 bytes.

`web/lab/asset-kit-assets/PROVENANCE.json` records source archive SHA256, each
original zip member, local hashes/bytes, triangle counts, material counts and
bounds. No Blender conversion, recoloring, inference or provider dispatch.
User is installing Blender independently; it remains optional.

## Reusable boundary

`tools/asset_resolver.py` and `tools/asset_catalog.json` select pinned local
candidates by semantic role, style family, importance and payload/triangle
budgets. Candidate use requires explicit opt-in; it never implies art approval.
Missing or inconsistent provenance/content must fail, not silently generate or
replace an asset. Existing robot, oak, birch and HDR entries reuse actual files.
The same request boundary is exercised for Bellweather and a distinct Harbor
profile; this is a narrow adapter proof, not proof of two complete games.

External glTF buffers and textures belong to the asset package. Selection must
verify those dependencies and include their bytes, rather than budgeting only
the tiny JSON entry file. Shared atlas bytes are counted per standalone asset
request; scene-wide deduplication and GPU memory estimation are future concerns.
Recorded triangle/texture counts are inventory measurements tied to pinned
content, not a claim that the resolver benchmarks rendering performance.

## Native comparison and art verdict

Root used the internal `web/lab/asset-kit-review.html` viewer with the existing
PlayCanvas backend. All six new candidates and the existing birch loaded.
Used front/side/back controls and warm/soft light; inspected each new mesh.
Also checked the viewer at 390 × 844 with a working side-view control.
The fixed canvas layout prevents intrinsic size from expanding the grid.
This is active GUI **asset inspection**, not gameplay or independent criticism.

- Branching tree: readable silhouette, but a solid rounded crown and rudimentary
  trunk; insufficient leaf/branch hierarchy for our foreground.
- Tall tree: block-like crown, especially incompatible with the organic reference.
- Clustered tree: better layered silhouette, but disk-like canopy and smooth
  saturated material still read as toy scenery. Softer light does not fix shape.
- Shrub: oversized inspection exposes a coarse solid mound. Not foreground-ready.
- Rock and grass: possible cheap dressing ingredients for another style or later
  conditioning. Neither accepted here; single-sided grass needs angle checks in
  its eventual placement.
- Existing birch: much richer leaf/branch structure, useful contrast. Does not
  establish the desired signature canopy or its overdraw/performance suitability.

KayKit models are normalized to equal height for shape inspection, so this is
not a scene-scale composition verdict. Birch retains its comparison scale.
Original materials are preserved. No physicality, audio or frame-rate claim.

Evidence: `artifacts/asset-kit-20260929/desktop-front.png`,
`clustered-soft-back.png`, `phone-side.png`. These are rejection/inspection
evidence, not the game's intended look. Owned review tab and server were closed;
temporary viewport override reset.

## Next production decision

**Subsequent user direction:** inspect actual Opus showcase source before choosing
the next production method. The [source study](20260929-opus-visual-source-study.md)
shows that richer procedural forms plus dedicated shading deserve a direct trial;
further asset shopping or a mandatory Blender pass is not the next gate.

Do not populate the world with this pack merely because it is licensed and cheap.
Keep it under its own candidate style family. The next art attempt should be one
signature canopy composition at the actual camera distance: visible branching,
layered pink/coral foliage with gaps for sky and light, cream/indigo architectural
support, and restrained ground dressing. Judge silhouette and spatial coherence
before details or broad integration. Use a suitable existing nature mesh as an
ingredient where possible; use Blender only for meaningful shaping/conditioning.
Keep source and derived assets separately traceable. A recolor alone is not the
required form change. Preserve the accepted reference as the target and run the
integrated play/critic gates only after an actual promising scene exists.
