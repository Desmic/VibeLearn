# Broader art/world direction and enforcement — 20 September 2026

## Active scope

Motion-quality and audio review are temporarily deferred by explicit user direction.
Trust in engine/code is provisional, not perceptual review evidence. Continue actual
GUI play, spatial/camera readability and visual direction. Deferred criteria stay
unassessed in full readiness records; this scoped work is not release acceptance.
No new media provider, paid dispatch, Level 2 or deployment promotion is authorized.

## System change

One shared, game-independent rubric now drives art assignment requirements, result
validation and a separate schema-v2 readiness gate. Six dimensions cover the existing
13 non-motion art requirements: spatial composition, focal identity, landmark
navigation, visual cohesion, environmental storytelling and device composition.
Assignments include the rubric in their content hash. Reports must address every
dimension with observations, supplied evidence and explicit uncertainty; assessed
dimensions need cold-observer and interactive evidence, and a pass needs a concrete
counterexample attempt. A failure cannot be averaged away. Normalized reports retain
dimension findings. Older reports remain history, not silently upgraded proof.

This enforces completeness and provenance, not beauty. A validator cannot recognize
a generic, mistaken or dishonest visual judgment. One fresh Astra reviewer still
plays the actual candidate, observes before intent, and reports separate critic
lanes. The user remains final authority. A bare cold report plus trace does not prove
every device/scene was inspected: the reviewer must mark missing scope unassessed.

## Art improvement order

The current game is evidence for reusable design boundaries, not the platform's
hard-coded template. Prioritize the opening attention/understanding gate, then the
tutorial and Level 1 using the same rubric.

1. **World meaning before captions.** Give the opening a visible place function,
   purposeful social grouping and a readable relationship. A previously implemented
   flower-delivery beat was not perceived by the cold reviewer; adding another prop
   or routine is not evidence that the problem is solved. Retest what a cold viewer
   actually describes with captions ignored. Motion aesthetics remain deferred.
2. **Character and action hierarchy.** Separate character silhouettes from dark
   backgrounds through authored value/material/lighting contrast. Keep the current
   interaction visually primary without making every panel, marker and landmark
   equally bright. Retest default and alternate player-camera views.
3. **A place to inhabit.** Compose traversable paths and a few functional landmarks
   with negative space, depth and distinct local identity. Avoid a dense toy stage
   or an indiscriminate scale increase. Retest walking, approach direction and a
   simpler/lower-density counterexample.
4. **Phone composition.** Reserve usable world space around HUD and dialogue; check
   the protagonist, target and consequence together at 360/390/430, alternate camera
   views and enlarged text. A target marker pointing outside the visible world does
   not by itself establish readable navigation.

For each affected scene, record a short authored brief: intended cold takeaway,
primary subject, functional landmark, navigable space, palette/value hierarchy,
prop/spacing budget, default and alternate camera framing, and phone constraints.
Keep scene intent and art choices in world/story specs; put only reusable layout,
lighting, control and HUD behavior in shared runtime components. Do not build a
universal generator or add cosmetic detail before verifying these boundaries.

## Evidence and next gate

The existing fresh top-level Astra reviewer completed an intent-comparison pass on
supplied runtime `323c95e`, disposable port 8068: 22 GUI inputs, opening scenes 1–3,
repair tutorial completion, Level 1 entry, route menu and alternate camera views,
desktop 1280x720 and phone 390x844. Its unchanged report is retained at
`artifacts/readiness-20260920/art-world-native-followup.md`; screenshot capture titles
refer to evidence in source task `01a0bf3a-deed-7be1-8506-cb7172269bdc`, turn
`01a0bf63-9fc1-7d32-8e3a-430f3e87e63d`, not exported image files.

Findings: route boards are not jointly discoverable/readable from Level 1 entry;
a modest orbit hides the protagonist behind a doorway post; relationships depend
on captions; dark character/interactable contours merge into backgrounds; phone
opening framing favors a large tower over the social group. Warm-to-dark contrast,
cohesive materials/palette, gate symbols and connecting path work. These are scoped
reviewer observations to reproduce, not independently established universal defects.

Next repair: reproduce and improve opening social staging and phone focal hierarchy,
then recheck caption-blind interpretation. Preserve the mission landmark/occlusion
findings as subsequent required repairs; do not forget them after improving entry.
No broad art-ready verdict: 360/430, enlarged text, full chapter, all camera angles
and performance were not covered by this pass. Motion/audio remain deferred.

Validation: `python manage.py build` passed; `python manage.py test` passed 369 tests
with seven skips. Targeted art/readiness/release tests passed (38 tests), including
missing dimensions, false passes over uncertainty, foreign evidence and low art
scores hidden by other high scores. Standalone checker CLI remains callable.
Test log: `artifacts/readiness-20260920/art-world-enforcement-tests.log`.
Runtime code is unchanged; actual GUI review supplies active browser coverage for
this bounded enforcement change, not a replacement for the full readiness matrix.
