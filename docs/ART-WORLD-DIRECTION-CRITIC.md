# Art and world-direction critic

**Active from 17 September 2026.** This is an independent product-review discipline for VibeLearn game candidates. It complements story, gameplay and learning critics; it does not replace them and it does not determine user acceptance.

The September 17 user review exposed failures that the previous critic pass missed: a congested play area, duplicate/ambiguous character presentation, a character intersecting a table, and attractive imagery that did not yet become a world someone wanted to play in. Those are not minor rendering bugs; they are art/world-direction failures.

## Purpose

Judge whether the rendered game world is intentionally composed, readable, inviting and spatially playable—not merely whether assets load and no object is technically offscreen.

## Required review dimensions

### 1. Spatial scale and breathing room

Ask whether the play space is large enough for the content. Inspect:

- overall footprint;
- negative space around the current interaction;
- distance between landmarks and props;
- path width and turn radius;
- how crowded the frame feels at default camera distance;
- whether increasing world scale without adding content would materially improve clarity.

A visually competent scene that feels cramped/congested fails this dimension.

### 2. Focal hierarchy

At every beat, identify the intended focal character/object before reading labels. The eye should not compete with three equally strong props, duplicate characters or decorative noise.

### 3. Character silhouette and identity

Characters must be visually distinguishable and correctly staged. Reject:

- duplicate/ambiguous protagonist-looking actors;
- similar models placed so the player cannot tell who matters;
- labels compensating for fundamentally unclear silhouettes/placement;
- accidental character duplication across cinematic and gameplay rigs.

### 4. Geometry and physical credibility

Sweep the authored and player-controlled cameras. Reject visible:

- character/prop intersections;
- feet/floors or bodies/tables clipping;
- floating props without clear intent;
- doors/gates traversing actors;
- obvious camera penetration;
- world pieces that only look correct from one hero screenshot.

### 5. Landmark readability and navigation

Important exits, doors, destinations and safe routes should read as world structure rather than only HUD instructions. The player should be able to form a spatial mental model.

### 6. Composition across camera motion

Review the full orbit/zoom range and key cinematic compositions. A scene is not accepted because one authored angle looks good.

### 7. Art cohesion

Evaluate palette, materials, shape language, lighting, prop style and animation language as one direction. Reused assets should look intentionally art-directed rather than assembled from unrelated kits.

### 8. Atmosphere and contrast

World-state changes should feel meaningfully different. For the current proof track, the proposed happy Bellweather -> violent interruption -> dark limbo -> lights-on prison reveal must communicate a strong emotional/spatial contrast without making interaction unreadable.

### 9. Density versus detail

More objects are not automatically richer. Prefer a few readable, meaningful props and larger spaces to dense decorative clutter. Generated worlds need configurable density and spacing budgets.

### 10. Device composition

Inspect desktop and 360/390/430 portrait. World quality is not allowed to collapse into a cropped diorama on phones. Character, current target and result must stay legible.

### 11. Reuse without sameness

When using reusable world kits, verify that layout, spacing, material, lighting and dressing choices create a coherent identity for this game rather than exposing the template.

### 12. Performance-aware direction

Do not solve art direction with effects/asset counts that destroy target-device performance. Visual ambition and runtime budgets are reviewed together.

## Review method

1. Freeze an exact candidate.
2. Review cold, without reading the intended story first when possible.
3. Capture default view plus meaningful alternate camera angles.
4. Orbit/zoom/walk through each important space.
5. Record clutter, dead space, clipping, repeated assets and focal confusion before ratings.
6. Compare scene density against a simpler/larger-space counterexample.
7. Inspect key world-state transitions, not only still frames.
8. Review phone and desktop separately.
9. Record concrete repairs and retest the same views.

## Hard blockers

Any of these blocks an internal ready recommendation:

- visible actor/prop clipping in ordinary play;
- ambiguous protagonist identity;
- critical path/door hidden by composition;
- a play area that is materially too congested for the mechanic;
- key world beats legible only from one fixed camera;
- decorative density that obscures action;
- major art-style incoherence that makes reused assets look accidental;
- story-state changes that are visually indistinguishable when the narrative depends on contrast;
- world composition that is attractive to look at but clearly unpleasant/confusing to inhabit and play.

## Relationship to other critics

- Story critic asks whether the scene communicates story/stakes.
- Art/world critic asks whether the place and staging visually support that story and play.
- Gameplay critic asks whether interaction is clear, fun and progressive.
- Learning critic asks whether play embodies the target capability.

One critic cannot compensate for another. “Beautiful but not playable” fails; “playable but visually incoherent” also fails.

## Current automation boundary

The existing JSON critic checker does not yet encode this independent gate. Until it is extended, this document is a manual/internal hard gate: any unresolved art/world-direction blocker means `needs_revision` even if the legacy checker returns `ready_for_user_review`.

Future critic agents may automate parts of this review (camera sweeps, intersection checks, density metrics, visual comparisons), but human/user judgment remains final.
