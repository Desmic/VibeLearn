# Arcade composition: worker GUI review

29 September 2026. Informed root inspection, not a cold critic record or user
acceptance. Initial build `index-DIj9tSiw.js`; source checkpoint is preserved in
`artifacts/bellweather-arcade/initial-checkpoint.zip` by the builder.

## Initial observations

Opened the real loopback scene in the Codex browser. Pointer/semantic button
clicks initially produced no visible response. Escape opened the pause menu;
Return on its focused Continue button resumed. Return on the visible route
button started travel, and a later observation placed Zip at the pavilion.
Dragging changed the camera angle there. The first button-click failure is not
established as a game defect: the tool reported a 1102x828 DOM viewport but a
1042x828 screenshot, and keyboard activation works. Do not compensate by
changing game input semantics without reproduction.

![Pavilion after travel and camera orbit](../../artifacts/bellweather-arcade/root-pavilion-initial.png)

The black sky is visible. Source inspection finds a radius-900 sky sphere beyond
the camera's far plane of 650; no background color supplies a fallback. The
route destination also changes within the movement loop based on the current
position, creating a reversal risk near its threshold. Sol is reproducing and
repairing these functional defects before an art revision. Console warnings
about an undefined map and removed soft-shadow constant are also assigned.

## Art verdict at this checkpoint

Below target. Thick arcade bays and a continuous path are more recognizable
construction than the prior trial's detached blades, but the scene still reads
as a simple model. The vegetation has visible branching with little canopy;
the green ground slab flattens space; the overlook reveals vacant ground and
plain towers. Foreground construction is not enough to make this a convincing
inhabited world. Correcting the sky cannot by itself close those gaps.

The first proposed substantial visual repair should establish canopy volume,
landform/depth and a purposeful vista. Preserve the connected route and useful
architecture. Use existing licensed rendering/foliage facilities where they
help; do not substitute another list of props or a global filter. At most two
substantial visual repairs remain for this attempt. No repair started at the
time of this initial record.

## Evidence limits and next verification

Complete direct traversal, return stability, pointer input, portrait framing,
hidden/paused workload and runtime cost remain to be verified. Root visibly
paused the native scene before authorizing one short automated browser for
Sol's focused reproduction; it must close on completion. No simultaneous
unattended 3D browser workloads. Audio/motion-quality review remains parked.
The first checkpoint deliberately lacks Wake/Mira interactions and learning;
it must not be promoted as a complete opening.

System lesson: a build result proves compilation, not a rendered experience.
Keep worker claims explicitly separated into implemented, automatically checked
and observed in play. The existing early native review gate is catching this
before expansion. No new reviewer fleet or generator framework is needed.

## Functional recheck and first visual repair assignment

Root reloaded Sol's functional repair in the same native tab. Sky is now blue.
Activated the route with Return on its visible focused button, observed arrival
at the pavilion and the explicit completion announcement, activated Return to
arcade, and observed return completion. Escape visibly opened Pause afterwards.
This verifies the guided round trip; it is not a complete direct-input/collision
review. Sol's short browser assertions cover DOM clicks, manual movement,
destination stability, pause and hidden rendering, with their limits in the
[builder report](20260929-arcade-builder.md). Its initial script exited on a
missing favicon after those assertions passed; that resource was subsequently
fixed. Do not describe that entire initial script as a clean pass.

![Native functional round-trip completion](../../artifacts/bellweather-arcade/root-functional-return.png)

Visual repair 1 of 2 is assigned: replace the vacant ground beyond the overlook
with a shaped/layered landscape, establish organic canopy masses, and strengthen
futuristic architectural form and warm/cool material-light definition. Preserve
the local route and current gameplay scope. Reuse licensed leaf construction
where helpful and keep dense foliage out of per-frame camera collision queries.
One rendered worker smoke check precedes root's next GUI inspection. No additional
visual repair is automatically authorized by this assignment.

Evidence qualification after source inspection of the verification script:
the hidden-state assertion overrides `document.hidden` and dispatches a
`visibilitychange` event. It verifies that event handler under simulated state;
it does not establish real browser background-tab behavior or CPU/GPU utilization.
Window blur cancels movement/guide but is not proven here to stop rendering.
Retain those distinctions in later readiness and performance claims.

## User correction: root implements the visual work

The user judged repeated Sol art loops too costly and assigned visual execution
to root Astra. Root interrupted Sol, obtained a stopped-writer handoff, and
retained Sol's completed static batching: 3,427 to 724 arrival renderer calls in
the same reported browser sample. That is not a utilization or equal-quality
comparison with another engine. Sol no longer owns visual decisions or edits.

Root implemented the second substantial visual repair directly:

- `src/vista.ts`: off-axis floating terrace groups, an open conservatory around a
  flowering canopy, rounded stepped buildings, a transit span and atmospheric
  depth. The existing walkable destination remains local and unchanged.
- `src/world.ts`: layered alpha-tested leaf-spray cards with matching cutout
  shadows, corrected sky color output, and a raised pavilion roof clearing the view.
- `src/zip.ts`: original chisel-cut helmet/receiver silhouette, recessed face,
  joints, panels and a shaped scarf. Gameplay remains in the existing controller.
- `src/lighting.ts`: one-time filtered outdoor reflection source for material
  response, without a recurring reflection-camera pass. Water intensity is
  separately limited to keep its blue-green surface legible.
- Camera, exposure and light balance adjusted together to show more world and a
  more readable protagonist silhouette rather than foreground floor alone.

Root built/typechecked and inspected intermediate arrival and overlook through
native GUI. The new vista is visible and differentiated from the previous blank
towers; it is still a simplified scene below the accepted reference. No visual
acceptance is claimed. Current frozen visual build is `index-C1DqZjuq.js`, pending
Sol's bounded engineering verification and final root GUI recheck. Sol may test
and report/control cost; it may not redesign geometry, camera, materials or light.

The revision cap has not been reset by changing the implementer. This is repair
2 of 2 for this arcade attempt. Finish verification and record the outcome before
deciding on any subsequent production-method change. No new blind repair loop.

## Final root GUI checkpoint and engineering defect repair

Sol's bounded engineering verification passed route, manual movement, orbit,
pause and restart on `index-C1DqZjuq.js`, but its portrait capture exposed a
camera inside foreground foliage. Root repaired this specific usability defect
with a camera-near screen-space leaf dissolve (1.3–3.4 metres), preserving leaf
shadows and avoiding per-leaf collision queries. Root also raised the portrait
place label 18 px. This is a verification repair within revision 2, not another
art redesign. Build/typecheck passed on `index-DWK7qCVY.js`.

On that exact build, root activated the actual visible route control, observed
arrival at the overlook, orbited the camera, switched to 390×844, activated
return, and observed arrival back at the arcade. The phone arrival view keeps
Zip and controls visible. The exact earlier lightwell occlusion is undergoing
the bounded regression recheck; a readable arrival alone does not prove it fixed.
Viewport was restored and the scene visibly paused afterwards.

The subsequent bounded regression rerun passed on the same build (SHA-256
`478A2A3D0235F4507ED21379E529478F3604DB927A3856017DE156A84712EC08`).
The reproduced portrait view now exposes Zip, pavilion and tree structure;
`root-revision2-clearance-phone.png` preserves that evidence alongside the failed
prior capture. No application errors occurred. Other camera angles and actual
background-tab workload remain unassessed. The owned test browser was closed.

![Astra revision arrival, native GUI](../../artifacts/bellweather-arcade/astra-final-arrival-native.png)
![Astra revision overlook, native GUI](../../artifacts/bellweather-arcade/astra-final-overlook-native.png)

**Art outcome: below target.** Spatial depth, protagonist silhouette and landscape
identity improved, but the architecture remains repetitive, foliage is visibly
constructed from cards, and the distant world lacks believable activity and
reachable exploration. These are informed worker observations, not a cold
reviewer score or user acceptance. The scene does not yet deliver the chosen
graphic utopia, let alone the full opening and learning experience. Stop this
attempt at its checkpoint; do not start another unbounded repair loop.

The reusable workflow change is ownership by demonstrated task fit: Astra owns
visual conception **and implementation**, while Sol owns bounded engineering
tasks with observable completion criteria. Count total time and rework to an
acceptable result; a cheap draft is not successful delivery. Keep these scene
experiments outside shared production controllers until a useful boundary has
been proven in play.
