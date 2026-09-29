# One-asset authoring comparison — 29 September 2026

## Question and scope

Can a shaped, conditioned architectural asset improve the small conservatory
proof enough to justify extending this production method? The user authorizes
experimentation, asks us to reuse earlier work to reduce cost, and explicitly
puts quality first. This is a worker experiment, not a cold critic or acceptance
record. No map, story, learning, engine integration or deployment expansion.

The preserved comparison is `?study=facade`; the new variant is
`?study=facade&portal=crafted` in `experiments/bellweather-arcade`. Both share the
18x22m court, lights, character, camera, controls, foliage and material helpers.
The previous source freeze is recorded in [the facade proof](20260929-facade-proof.md).
This comparison changes the portal's geometry, material layering and baked local
occlusion together; it does not isolate any one of those contributions.

## Implementation and reuse

Root Astra wrote `authoring/build_portal.py`, using installed Blender 5.2.2 LTS
in background mode with four threads. Original asymmetric arch profiles have a
varying cross-section, segmented ceramic shell, indigo lining, brass reveals,
coral crown insert and feet. Solidify/bevel, mesh normals, UV projection and
Cycles ambient-occlusion baking reuse Blender facilities. The retained `.blend`
and exported GLB make the result inspectable and reproducible. This is scripted
authored geometry, not manual sculpting or evidence that changing tools alone
improves art.

The model has 34,108 triangles, five material primitives and one embedded 512px
PNG, and weighs 1,101,132 bytes. Directional lighting/shadows remain live. Floor
jamb collision bounds come from the authored geometry. The old portal remains
available. Existing movement, camera repairs, scene, atlas/material provenance
and verification patterns are reused. No paid provider or new downloaded asset.

## Decision criteria and initial observation

Keep the method only if silhouette, material separation and grounded contact
improve at gameplay distance, including ordinary arrival and reverse views,
without traversal/camera regressions. Record added rendering and asset cost;
extra polygons and successful export do not establish quality.

Root's native comparison uses the same arrival location and 80px upward camera
drag in both variants. Captures in `artifacts/bellweather-arcade`:
`portal-baseline-silhouette-native.png`, `portal-crafted-silhouette-native.png`,
and the unadjusted `portal-crafted-arrival-native.png`. The curved/tapered profile
and material depth are more distinctive. Surrounding boxlike masses, simplistic
character and overall art coherence remain limiting. Default framing also crops
the top; the low-angle capture must not conceal that limitation.

This supports a local authoring improvement, not a large scene-quality leap.
No reference-quality, realistic locomotion, dynamic-physics or full-world claim.
The reusable system lesson is to preserve matched baselines and asset provenance,
test an authoring method on one representative element, and judge its visible
return against cost before expanding it. A general generator should not encode
this arch shape or theme as its required output.

Engineering results and exact freeze: [verification](20260929-crafted-portal-verification.md).

Focused A/B checks pass after correcting a verifier pause/restart mistake (no
application change): jamb contact, aperture passage and return, wall-camera
clearance, pause/reset, material requests and narrow-screen layout. Arrival
render statistics rise from 180 calls/113,160 triangles to 188/170,304. The short
median frame sample is 27.9ms baseline versus 27.7ms candidate, which does not
prove performance parity or CPU/GPU utilization. The added detail is selective
hero-asset cost, not a policy to replace every primitive with a dense model.

Decision: retain this optional asset and reproducible authoring path, but do not
scale the method across the map yet. A worthwhile next visual test must address
the coherent shape/material relationships of the same small facade rather than
adding more detail to this arch. The current whole-scene result still falls
short; another local improvement alone cannot close the user's art feedback.

Root also completed the candidate's native GUI-guided outward and return walks,
orbited inside and saved `portal-crafted-reverse-native.png`. This directly
observes guided passage and viewpoint changes; sustained manual-key collision
coverage comes from the engineering pass. Preview is left paused at arrival.
These are informed worker observations, not fresh-context critic scores.
