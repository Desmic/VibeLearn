# World/art production retrospective — 29 September 2026

**Latest follow-through audit:** The user asks what root missed despite receiving
the relevant information. See [the later audit below](#follow-through-audit-after-the-cloud-asset-discussion).
The earlier diagnosis was substantially present; carrying it into production
decisions failed. The next unresolved comparison is asset production, not another
broad detail pass or a claim that Hunyuan will solve the scene.

**Subsequent user decision:** "ok, let's continue" authorizes the bounded
source-based trial proposed below, including its isolated Three.js exception.
The proposed reachable scene is undergoing the existing independent design gate
in `design/experiments/bellweather-world-trial.json`. Active runtime/canonical
design and deployment remain unchanged. The proposal text below records the
decision as originally presented; it is not an acceptance report.

**Decision proposal, not an approved redesign or renderer migration.** The user
asked root to reconsider the accumulated work, research and repeated visual
misses before deciding next steps. The accepted graphic techno-fantasy utopia
reference remains the target. Current opening v8 design and integrated candidate
remain unchanged; this report grants no new acceptance.

## Finding

Root's art direction and production choices have not delivered the intended
world. We repeatedly improved local pieces while preserving a weak overall
composition and a thin experience. Sol's implementation and verification did
not choose that direction; the user supplied adequate direction. Neither a
PlayCanvas ceiling nor a model capability ranking has been demonstrated.

Side-by-side evidence:

- [Accepted reference](../references/bellweather-graphic-utopia.png): a readable
  character silhouette, architecture at several scales, curved connected routes,
  everyday activity, cool shadow against warm light, and an inviting destination.
- [Latest integrated companion view](../../artifacts/companion-art-20260928/after-desktop.png):
  characters arranged across a stage, oversized decorative forms and a largely
  exposed floor. Better joints/gestures did not change that composition.
- [Rejected larger trial](../../artifacts/visual-benchmark-20260929/desktop-final.png):
  imported foliage, textured ground and more space still yield a sparse corridor
  with inconsistent forms and surface treatment. The failure was recorded, not promoted.

The recurring mistakes were:

1. **Literal ingredients replaced visual relationships.** Robots, pink trees,
   rings and a planet reproduce nouns in the reference. Camera, proportion,
   architectural function, negative space, depth and value hierarchy make it work.
2. **Reuse was allowed to determine identity.** An available robot/tree is useful
   only if its form fits. Hero silhouettes deserve more attention than commodity
   dressing; v3's importance tiers already support that distinction.
3. **Renderer convenience constrained art prematurely.** Our primitive-oriented
   adapter made incremental geometry easy. We treated its vocabulary as the
   creative boundary. That is an implementation limitation, not an engine verdict.
4. **Discovery became a presentation action.** The v8 plan explicitly makes the
   signal routes non-walkable. Inspecting an unreachable destination and reading
   an affectionate line cannot establish the freedom or attachment requested.
   A small actual journey can fit the opening without adding a later level.
5. **Useful engineering activity displaced proof of desire.** State, control,
   presentation and regression work have value, but neither their volume nor
   passing tests establishes that someone wants to play. Existing cold criticism
   already identified weak world appeal and attachment. The response was too local.

## Additional live evidence

Root opened [Summer Cycle's public build](https://starknightt.github.io/summer-cycle/?fs=0)
through native browser control: started the ride, pressed F and observed the
completed dismount, orbited the view, changed time of day with T, and paused/resumed.
A brief walking input was issued; sustained walking/collision behavior was not
established. No autoplay URL, scripted state injection or source-based play substitute.
The owned tab was closed afterward.

![Observed Summer Cycle scene](../../artifacts/world-retrospective-20260929/summer-cycle-live.png)

The scene remains coherent after changing viewpoint: road, fields, shop frontage,
vegetation, reflections and distant layers describe one place. Its character is
still visibly simple up close. This is a short reference observation, not a full
game, audio, motion-quality, phone or performance review. The deployed build's
commit was not independently established; the separate [pinned source audit](20260929-summer-cycle-source-audit.md)
retains its own scope. The source is a candidate for reuse, not evidence that its
style or device requirements are suitable unchanged for VibeLearn.

## Recommended next decision

Replace further incremental dressing with **one bounded, source-based world
prototype**. First reproduce the inspected MIT Summer Cycle rendering baseline
locally without visual edits; establish the actual device behavior and preserve
a control capture. Then adapt a small scene toward our accepted art direction,
reusing useful material/vegetation/light code with attribution rather than
reimplementing all of it from descriptions.

This proposes a narrow **isolated Three.js research exception** to the current
PlayCanvas-only production policy. It is not yet approved and does not change
the active game. Its purpose is to test production speed and art realization
with a working baseline. Different content would prevent a causal engine speed
comparison. A better trial would justify a separate integration decision, not
automatically justify a full renderer migration. If reproducing the baseline
already fails or is unsuitable, record that outcome before adaptation.

The proposed original scene is one small connected place: a sheltered arrival,
a curving garden path and a reachable overlook with Mira. City life should have
visible destinations and routines; a local signal interaction should cause a
physical/world response the player can approach and inspect. The initial camera
should invite travel into the scene. This requires an explicit opening-design
revision and its existing review before changing the canonical story flow.
It does not authorize a whole city, planet travel or Level 2.

The working art decisions come first: character/environment proportion, connected
space, a small coherent material family, purposeful light/shadow, and a limited
set of original silhouettes. Three camera checks are useful evidence, but the
existing "three views" rule is not a new solution by itself. The substantive
changes are a working code baseline, stronger direction and actual reachable play.

Use the existing two-substantial-repair limit. Root owns the scene and its visual
verdict; Sol owns a bounded source/license/build/performance and later integration
assignment. Do not add a review fleet. Measure frame pacing and CPU/GPU cost with
renderer/device identity, then check a reduced configuration; desktop success
does not establish phone support. Run focused checks during the isolated trial;
all existing application, presentation and one fresh Astra play/critic gates
apply before any integration claim.

If this still misses the chosen direction, change the builder or asset-production
method before another round of the same work. A controlled comparison with a
different art implementation model is an option requiring its own available
access/budget, not an authorized live-provider dispatch or a claim that a public
showcase proves model superiority.

## System consequence

Preserve the learning/evidence/save and interaction boundaries already built.
Earn the visual reuse boundary through a successful place: versioned style kits
should couple geometry, material/light treatment, placement/scale rules, traversable
space and reference evidence. Procedural variation should operate inside those
rules, instead of decorating unconstrained primitive layouts. Extract that kit
after it works and exercise a different scene/style before calling it general.

This follows v3's reuse-first, style-family, conditional-Blender and replaceable
renderer principles. No further asset shopping, general renderer framework or
new validator is the immediate deliverable. The next deliverable should let the
user inhabit an appreciably better place. Their judgment remains final.

## Follow-through audit after the cloud-asset discussion

29 September 2026. Reviewed the user feedback register, accepted reference and
latest arrival capture, v3 architecture, ten-game study, Sky Reach/source studies,
asset-corpus and specialist-model research, learning-core audit, graphics-stack
review, and subsequent experiment records. This is a decision audit, not a new
runtime test, asset trial, critic score or accepted redesign.

### What was missed or insufficiently acted on

| Information already available | Our shortfall | Required correction |
| --- | --- | --- |
| v3's reuse-first resolver, style families, importance tiers and conditional Blender | We implemented a useful narrow resolver and inspected a small asset sample, but continued custom construction without the proposed generated-asset comparison. Six unsuitable KayKit candidates do not settle what the broader market or specialist models can supply. | Choose production method per asset and art requirement. Compare one consequential missing asset before broad custom work; preserve compatible existing work. |
| Free/cloud compute and specialist shape/paint models | Local 6GB hardware and shipping constraints received attention while a hosted quality experiment remained undone. Feasibility research did not establish endpoint availability, export success or accepted-asset cost. | Try the existing hosted route before building a notebook/service or recommending a subscription as a production solution. Keep experimental feasibility, account access, budget and distribution clearance distinct. |
| Approved image generation and existing accurate geometry | Image generation mainly established aspiration; it was not carried through an object-reference/3D/material comparison. The paint stage can also be tested on an existing mesh. | Use original object references to constrain silhouette/materials. Retain precise authored openings and joins when useful; test painting separately where geometry is already good. Do not convert a whole scene image into one gameplay mesh. |
| Graphic techno-fantasy with credible lighting and physics | Reproducing pink trees, rings and cream/teal surfaces did not reproduce the reference's visual relationships. The latest scene still has a broad plain floor, sparse depth and simple character/environment treatment. | Judge the ensemble at actual player height: silhouette, scale, foreground/middle/distant layers, material hierarchy, directional light and contact. A stronger mesh alone cannot establish the target. |
| The user accepts a small commitment, with quality first | The small playable footprint too easily became a small visual ambition. | Preserve the footprint, but allow purposeful height, framed vistas and economical non-playable distant layers. This does not authorize map, NPC or story expansion; a reachable local route must still fulfill the immediate invitation. |
| Sky Reach, Sakura/Summer Cycle and other inspected references | We extracted and sometimes reused real techniques, but model attribution and lists of effects did not reliably translate into a stronger place. Sky Reach itself combines procedural scenery and an imported character. | Apply hybrid production and coherent form/material/light choices. Neither procedural-only nor generated-only is the answer. Compare the usable result, not creator/model prestige or an unverified build-time claim. |
| The previous retrospective and two-repair limit | Successive named subproblems kept activity moving while the whole scene remained below reference. Some changes genuinely changed method, but the scene-level failure was not consistently the deciding signal. | Do not restart the repair allowance merely by renaming a subpass. After a failed bounded trial, require a materially different hypothesis and an explicit comparison before more work on the same scene. |
| Rendering-cost concerns and weaker-device measurements | Geometry/export/camera fixes were useful, yet the latest short matched frame-time sample regressed. Lower draw calls were not lower total render cost. | Report the actual device/resolution and comparable active views. Include texture, shadow, transparency and frame-pacing cost; distinguish CPU query timing from GPU or whole-frame performance. |
| General-system and learner-facing product goals | A growing set of reports, validators and isolated artifacts can resemble platform progress without demonstrating a good generated experience. | Preserve working contracts, but extract a reusable style/asset capability only after it works visually. Test its boundary on a different fixture before claiming generality. No new framework is required for this comparison. |

The latest arrival evidence is
`artifacts/bellweather-arcade/atelier-depth-final-arrival-native.png`; the chosen
reference remains `docs/references/bellweather-graphic-utopia.png`. The reference
is direction, not approval to copy its exact character, UI or layout. The user's
"does look better" acknowledges improvement; it does not close the art gap.

### Broader lessons that must survive this correction

- The ten-game research gives concrete experience obligations: Zelda's consistent
  reusable verbs and spatial guidance; Portal's distinction between understanding
  and passive success; RDR2/Witcher's purposeful places and relationships;
  Expedition 33's coherent visual premise; Outer Wilds' actionable curiosity.
  Decorative resemblance or a good screenshot cannot establish these qualities.
- The earlier progression/HUD failure was the same kind of problem: design
  requirements existed but implementation and checks did not guarantee that the
  player experienced them. The learning-core audit still leaves novice learning,
  transfer and retention unproven. Preserve the required entry -> prologue ->
  separate tutorial -> Level 1 sequence and evidence integrity while art remains
  the user's current priority. Do not switch back to curriculum work now.
- Native inspection, controls/collision tests, cold experience criticism and human
  acceptance have different jobs. Recent guided route/orbit inspections support
  their reported geometry/framing claims; they do not substitute for the eventual
  fresh-context Astra playthrough across all lanes. Audio/motion-quality review
  remains parked, not passed.
- Root owns art decisions and actual visual production, including acquisition,
  specialist generation, kitbashing and lighting. That ownership is not a mandate
  to hand-author everything. Sol retains bounded engineering work; repeated weak
  art briefs or routine supervision loops do not become efficient through cheaper
  individual calls. Root's choices, not missing user direction, caused this drift.

### Immediate decision

Keep the current scene and source assets as the control. Before another broad
hand-modeling or scene-detail pass, complete the already proposed comparison for
one prominent static asset, using a suitable existing/authored baseline and one
cloud-generated candidate. Test full shape/PBR or existing-shape painting according
to the actual deficiency. A provider preview or export alone is not success:
condition it only as needed, compare in the same player views, and count retries,
hands-on cleanup, style fit, package cost and runtime frame cost. No paid purchase,
cloud dispatch or inference has occurred as part of this audit.

Then return the winning method to the same small composition. This second check
answers whether it improves the world; the first only answers whether the asset
route is useful. If the scene remains weak, change the specific failed assumption
(for example composition, dominant silhouette or light/material treatment) rather
than adding detail or presuming another subscription will solve it. No automatic
engine migration, universal asset service, future level or deployment follows.

Hunyuan is an untested candidate here, not a proven rescue. Its source review and
cloud/Blender proposal are in [the existing comparison note](20260929-hunyuan-cloud-to-blender.md).
The decision standard is quality and total effort to an accepted playable result.
Documenting this correction does not count as executing it.
