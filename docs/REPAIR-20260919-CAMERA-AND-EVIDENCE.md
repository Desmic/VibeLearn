# Camera, hint and review-evidence repair — 19 September 2026

## Why implementation reopened

The independent learning/physicality reviews of `471de882...` were unresolved
because their packets lacked necessary observations. While preparing those
observations, informed browser play reproduced two actual defects: the follow
camera shortened into the protagonist near a side wall, and requesting a hint
saved assistance use without displaying assistance. This is diagnostic review
with prior knowledge, not a cold or independent product pass.

## Bounded changes

- Shared follow-camera resolution preserves horizontal bearing, probes collision
  along the viewing ray and raises the viewing angle when the shortened ray
  cannot preserve useful clearance. Clearance uses body and camera profiles,
  including authored portrait framing; no game IDs enter the shared controller.
- Collider bounds are snapshotted once per draw and refreshed on the next draw,
  including moved/hidden objects. Alternate layouts, mirrored walls, corners,
  enclosures, scaled geometry and portrait framing have focused coverage.
- The existing saved hint now displays contextual help before prediction and
  survives reload. The mobile layout keeps the prediction button full width.
  Assessment rules and historical learner evidence are unchanged.
- Chapter evidence now includes the pinned learning contract, actual HTTP command
  results, intermediate word generation, controlled prediction/hint comparisons,
  and final server assessment. Mastery remains unknown; completion is not proof
  of explanation, delayed recall or transfer.
- Physicality evidence uses real keyboard/mouse input, authored bounds, 100 ms
  player/camera samples and a continuous video with matching labels/timestamps.
  Physicality assignments may now include motion video. Setup never teleports.

## Observed browser behavior

At 1280×800, walking to the right boundary and orbiting toward the wall previously
filled the view with inside-character geometry. The repaired camera retains
clearance. At 390×844, the first repair still made the head dominate the view;
using the portrait framing profile corrected this. Moving away restores the
requested pitch and preserves camera-relative movement bearing.

Near the wall, the resulting view can be steeply overhead. This is an explicit
visual tradeoff for independent motion/art review, not an aesthetic acceptance.
The hint was observed on the running phone-size game before and after reload.

Local diagnostic images: `artifacts/camera-wall-before-1280.png`,
`camera-wall-after-1280.png`, `camera-wall-after-390.png`, and
`camera-wall-away-390.png`. Automated evidence:
`physicality-interaction-trace.json`, `physicality-motion-1280.webm`, and
`level1-authoritative-replay.json`. These local files are not sealed CI evidence.

## Verification and limits

Build and 268 application tests passed (seven skips); 13 focused framework/camera
tests passed after the portrait follow-up. Dedicated and integrated physicality
checks passed. The integrated browser run passed foundation, opening, tutorial
and controls, then failed in the chapter fresh-entry check waiting for
`#rgi-intro`. Readability and lifecycle were not reached. This failure remains
unresolved; do not treat this working tree as a fully verified candidate.

The first physicality harness attempts exposed timing assumptions: fixed-duration
movement was too short under load, and contact thresholds ignored one maximum
movement step. Travel now waits for observed positions, retains bounded waits,
and requires sustained blocked input. Assertions were not replaced with visual
assumptions. Closed-gate and wall probes explicitly disclose that walkable-surface
boundaries also restrict movement; they are not collider-only causality proofs.

The recording covers two prop faces and one side boundary, not every geometry
combination. No audio-quality, cold-observer or independent motion verdict is
claimed. A new exact-SHA CI bundle and fresh independent reviews are required
before promotion. Render/Supabase remain unchanged. Level 2 and live Terminal PM
integration remain deferred; the existing typed adapter boundary remains intact.
