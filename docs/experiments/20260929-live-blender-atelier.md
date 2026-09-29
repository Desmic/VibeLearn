# Live Blender architectural iteration — 29 September 2026

## Scope

User installed Blender MCP and authorized using it to continue. Root inspected
the live connection (Blender 5.2.2 LTS, matching protocol 11, default scene) and
preserved that scene in a separate Blender scene. This is the same 18x22m
conservatory experiment, not map expansion, story/learning work or promotion.

Candidate: `http://127.0.0.1:8062/?study=facade&portal=crafted&architecture=atelier`.
Comparison: `?study=facade&portal=crafted`. Original portal and facade variants
remain available. Root owns visual implementation; Sol owns bounded engineering
verification. Worker observations do not qualify as fresh-context critic scores.

## Visible change and reuse

The adjacent left/right buildings now share the portal's ceramic/indigo/brass
materials, rounded contours, deeper glazing reveals and layered roof edges.
The left wing has a long gallery, repeated ceramic fins and a rising crown; the
right coral chamber is quieter. The ground, canopy behind the portal, plants,
character, lighting, walking route and prior authored portal are reused.

The shared facade camera widens from 48 to 56 degrees and aims .5m higher while
retaining its .20 pitch/6m physical orbit. Both new A/B variants use that framing.
A temporary 8.2m camera exposed the finite court edge. A lower camera improved
arrival but hid the character's body behind the low wall in a reverse view.
Both were rejected; those low-camera captures are retained as
`atelier-low-camera-arrival-native.png` and `atelier-low-camera-reverse-native.png`.
The physical camera height is restored. The legacy arcade camera is unchanged.
Existing historical captures with the old camera are not matched A/B evidence.

## Inspection found a production defect

The first model looked plausible in Blender's solid viewport but its game
surfaces showed stippled shading. Inspection found inward-facing polygon
normals on the authored volumes (face normal dot outward direction was negative
on a convex chamber). Root corrected mesh construction and added outward-normal
recalculation on evaluated export meshes. This is repaired geometry, not a
stronger light or reduced shadow setting concealing the fault.

The first exporter guard also assumed Blender's RNA enum listing would contain
GLB. That dynamic list was empty. Reading the installed official exporter exposed
its `get_format_items` callback, now used by the exporter. The failed export
created no shipping model; its temporary copies were removed before retrying.

One visual refinement recessed the glazing, raised the roof profile and added
a broad ceramic ribbon. Its upper structural enclosure was extended to meet
the new roof, fixing a gap seen in the live viewport. Solid viewport inspection
and actual game lighting are separate checks.

## Reusable boundary

The editable `.blend`, build/refine/export scripts, versioned GLB, original-asset
provenance and derived collision manifest stay together. Export evaluates
modifiers on temporary copies and groups geometry by material. The model is
17,288 triangles, five material surfaces and 885,720 bytes. The portal is a
separate reused asset. These numbers do not establish runtime performance.

For future generated worlds, verify geometry orientation and exported material
behavior in the target engine before tuning lighting. Preserve a comparison and
gameplay evidence. Keep custom high-importance forms deliberate and reuse
commodity components. This experiment does not build a universal generator or
make this building shape a platform constraint.

## Assessment and evidence

Root sees clearer material edges and a more consistent facade, especially after
the normal correction. The stylized opaque glazing, primitive character,
foliage silhouette and overall reference gap remain. This is not realistic
glass transmission, locomotion/physics proof, or accepted art direction.
The matched baseline retains richer small window recesses; the new broad glazing
is simpler and still reads too flat. This is a mixed architectural experiment,
not an unqualified whole-scene upgrade. Keep both versions for user comparison.

`artifacts/bellweather-arcade/atelier-initial-arrival-native.png` preserves the
first faulty game view. `atelier-final-arrival-native.png` shows corrected
shading and the final default framing. Focused engineering verification follows
in [the verification report](20260929-live-blender-atelier-verification.md).
Root completed guided outward/return play and the final reverse-camera orbit.
`atelier-final-reverse-native.png` shows the repaired full-body visibility;
`atelier-baseline-matched-native.png` uses the same final camera as the candidate.
These actions cover guided traversal and viewpoint changes, while sustained
manual-key collision coverage belongs to Sol's engineering pass.

## Camera-query performance repair

The first controlled browser comparison passed controls but found a near-wall
orbit sample of 145.8ms median on the new facade versus 48.6ms on the preserved
one. Render material batching had also grouped the camera's raycast targets into
five broad meshes, increasing query work. This was treated as a regression.

Root exported a separate invisible camera model from the 50 original parts,
without their tiny edge bevels: 4,952 triangles / 220,760 bytes with small part
bounds. Sol repaired the loader and repeated the measurement. The visible model,
materials, lights and shadows remain unchanged. A reduced draw count alone is
not sufficient evidence of lower total cost. See the verification report for
final measurements; the initial slow result remains under `atelier-preproxy/`.

Final bundle `index-BCaFV6vI.js` passes the focused engineering checks. The
near-wall median is 62.4ms versus the matched older facade's 34.8ms. The repair
substantially reduces the measured regression but does not establish acceptable
performance or parity. Arrival render counts remain 168 calls / 181,764 triangles
before and after the proxy, and the visible GLB hash is unchanged. These short
device-specific frame samples are not CPU/GPU utilization measurements.

Root rechecked the final bundle through native browser controls: guided entrance
traversal, reverse orbit with the full character visible, and guided return.
`atelier-proxy-final-arrival-native.png` and
`atelier-proxy-final-reverse-native.png` capture this final loader version.
The visual assessment remains mixed. This checkpoint proves the live authoring
and verification path; it does not qualify the facade for production promotion.

Sol's exported-mesh inspection also identified 544 zero-area triangles out of
17,288. The 50 evaluated source parts passed Blender's manifold/signed-volume
check, but that does not overrule a defect in the triangulated export. Preserve
this as an unresolved export-cost issue; details and numerical tolerances belong
to the engineering report. Do not describe geometry QA as an unconditional pass.
