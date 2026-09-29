# Conservatory depth refinement — 29 September 2026

## Scope and observable target

Continue the same 18x22m graphics experiment. At ordinary play distance, the
lower glazing should show an actual room and parallax, and foreground planting
should have curved surfaces instead of flat spear silhouettes. Resolve the
known exported zero-area triangles and reduce unnecessary camera-query work.
Keep the previous source packet and evidence; no map, story or learning expansion.

Root owns Blender geometry, materials and native visual inspection. Sol owns
bounded export/camera engineering and verification. Neither is the independent
cold critic gate, and this experiment is not production acceptance.

## Changes

`deepen_atelier.py` reuses the original modeling helpers and replaces one opaque
volume with two clear panes, actual floor/back/side/ceiling surfaces, a display
bench and two compact botanical silhouettes. The low building footprint is
unchanged. Alpha glass uses the existing environment reflection with no added
reflection camera, refraction or transmission pass. Transparent panes do not
cast opaque shadows. The model remains physically lit by existing scene lights.

The same foreground planter now holds curved, folded broad leaves. Existing
portal, trees, floor, route, camera framing and character are retained. Both
visual repairs are frozen for this pass rather than expanding into more props.

Sol added a conservative world-bounds prefilter ahead of the existing exact
camera raycasts. It is valid for this static environment; moving obstructions
would require bounds updates. Export triangulates temporary copies and removes
collapsed triangles before GLB serialization; editable objects are preserved.

## Geometry evidence

The 89 source parts pass Blender's manifold/positive-volume check. An initial
export check exposed coincident attachment vertices between separate leaves
after material grouping. Staggering the attachment heights by 14mm resolved
the welded-shell ambiguity. The final exported model has 22,968 triangles,
zero classified degenerates and 89 outward closed shells under the existing
validator's tolerance. Final render GLB SHA256:
`FCFED0118BCC450C5AB0A825677F84B3A3F795A1DEEE413B16824E0775676910`.

## Worker visual assessment

The lower facade now reads as a room behind glass, and the foreground leaf
silhouette is softer. This is a local improvement; the upper opaque glazing,
blossom canopy, primitive character and overall composition still fall short of
the selected graphic-utopian reference. No claim of realistic optical glass,
dynamic physics or whole-scene art acceptance follows.

Native captures: `atelier-depth-final-arrival-native.png`,
`atelier-depth-window-native.png` and `atelier-depth-full-reverse-native.png` in
`artifacts/bellweather-arcade/`. The window view shows the room from an oblique
angle; the full reverse view retains the character's full body. Guided through/return traversal and camera
orbits supplement Sol's manual-key automated engineering checks; they are not
an independent critic score. Final bundle: `index-Bw0s9O-m.js`, SHA256
`E09AD041A4210C880A69D00FD6C82A69F74131A024FB6655C2A8F51F78A3143A`.
Build/typecheck and focused runtime regression checks pass, including the legacy
arcade affected by the shared camera function. The native preview is paused at
arrival. See [engineering evidence](20260929-atelier-depth-verification.md).

Sol's actual-proxy parity test compared 2,592 rays against full exact raycasting
and bounds-filtered raycasting: nearest valid hits match within 1e-6m, including
678 obstructed rays. This covers the new static proxy, not arbitrary moving
world objects or all gameplay camera behavior.

The same proxy/ray set, with two warm-up pairs and six alternating repetitions
in Node, took a median 29.24ms for full queries versus 16.50ms for bounded
queries. That is evidence of reduced CPU query work for these inputs, with
identical hit checksums. It is not a browser frame-time or utilization result.

Final browser near-wall median intervals are 48.6ms for the older facade and
55.5ms for this iteration in one short sample. Arrival render counts are
192/171,816 calls/triangles for the older facade and 178/196,292 for this one.
The added interior and curved foliage have a visible rendering cost. Prior
62.4ms measurements are from different content and a different session, so they
do not isolate the latest camera optimization. Smooth-play performance remains
an open gate; no CPU/GPU utilization or target-device guarantee is established.
