# Character silhouette comparison — 29 September 2026

Root Astra art implementation; Sol bounded engineering verification. An optional
study within the same small facade scene, not a production character replacement.

## Hypothesis and scope

The existing character's broad flat helmet, short legs and box hands read as a
placeholder beside the improved entrance. Test a compact curved helmet, longer
legs, separated armor/joints and a warm asymmetric scarf at normal play distance.
Use the accepted graphic-utopia reference for form/material relationships, not an
exact character copy. Same world, lighting, camera, controls and collision rules.
No map, story, learning, rig, gait or cloth simulation expansion.

`src/zip-courier.ts` uses existing Three.js primitives, rounded boxes and the
standard geometry merge utility. Parts remain separately authored in source;
the current **static** pose is merged by material at construction. A future rig
must retain articulated boundaries; this merge is not an animation solution.
There are no new textures, lights or postprocessing passes. Existing `buildZip`
remains the default. Add `&character=courier` to the clean swept/ceramic URL:

<http://127.0.0.1:8062/?study=facade&portal=crafted&architecture=atelier&finish=daylight&palette=ceramic&form=swept-clean&character=courier>

## Frozen candidate and observed result

Final cleanup bundle `index-BvtasEde.js`, SHA-256
`63021FEDE7386302EFA150CEFC91D4DFF679EC8FE97F3D1994CEAC032B0B80A1`.
Build/typecheck pass; the existing large bundle warning remains.

The initial build was `index-D4KsaSzb.js`. Engineering found 320 microscopic
collapsed primitive triangles. The final build excludes faces with squared
cross-product magnitude at or below `1e-18`; retained position/normal/UV data are
unchanged. It does not weld or retopologize the character. See verification for
final counts and runtime checks.

Initial-build root native browser inspection at 1280×720: arrival, side and frontal orbit,
direct forward walking using visible controls, guided travel through the entrance,
and reverse courtyard orbit. Body/feet stayed visible in those sampled views;
this is not exhaustive contact, camera or physicality certification. Captures:

- `artifacts/bellweather-arcade/courier-arrival-native.png`
- `artifacts/bellweather-arcade/courier-front-native.png`
- `artifacts/bellweather-arcade/courier-courtyard-native.png`
- `artifacts/bellweather-arcade/courier-reverse-native.png`

Final-build native recheck repeated direct approach input and guided courtyard
travel/return. `courier-final-arrival-native.png`,
`courier-final-courtyard-native.png` and `courier-final-return-native.png`
preserve the post-cleanup views. Preview left paused and viewport override reset. The same
shape and material judgment holds after cleanup. Final engineering checks pass:
12,128 character triangles, zero near-zero faces, unchanged bounds/grounding;
scene arrival 112 calls / 176,164 triangles versus 146 / 167,312 for the original.
This trades fewer submissions for more geometry; no FPS/GPU improvement is claimed.

Worker judgment: slimmer, more balanced figure; curved helmet highlights and the
scarf mass read at playing distance. The front torso is still plain, the rear
helmet insert looks mechanical, and the static pose remains stiff. This is a
local improvement candidate, **not** the reference-quality target or an approved
character. Foliage, distant forms and the plain reverse architecture still limit
the scene. Do not mistake polishing this character for resolving world direction.

The earlier `character-control-native.png` shows the old character facing the
camera after return travel, while new arrival faces away: it is contextual
evidence, not a matched pixel comparison. Engineering comparison uses fresh
arrivals. Focused validation is recorded separately in
[courier verification](20260929-courier-verification.md).

## Reusable lesson

Judge protagonist silhouette/material separation in the actual player camera,
from both sides and the rear, with target lighting. Track character/world scale,
ground contact, collision-body fit and runtime cost alongside art judgment.
Static visual batching must not silently erase future joint/animation boundaries.
These are asset-review requirements for different game styles, not a requirement
that generated games share this robot, palette or renderer. No production
integration, fresh-context critic acceptance or learning claim is made here.
