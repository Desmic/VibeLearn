# Current state — LLM learning-game proof track

**29 September 2026.** This file is the current status. Older narratives live in
`docs/history/STATE-20260921-24.md` and `docs/history/STATE-20260918-20.md`.
Automated checks, critic judgment and user acceptance are separate claims.

## Current repair and gate

- **29 September district silhouettes:** Optional `districts=terraces` on the
  sunlit city replaces repeated houses with stepped garden buildings, low curved-
  roof galleries and slender towers. Existing orbital sky is smaller/off-axis;
  material pigment reuses the existing shader. Local contact/camera/learning
  unchanged. Final `index-DXmeqNSe.js`; build/typecheck, native approach/courtyard/
  reverse review and focused Sol browser checks pass. Arrival 126 calls / 175,816
  triangles vs city control 125 / 194,644. Short frame timings mixed; no sustained
  performance claim. Better mass variation, subtle surface gain, art gate open.
  [Single pass/evidence record](experiments/20260929-district-silhouettes.md).
  Working preview paused; no production promotion.

- **29 September surrounding composition:** User requests larger, efficient
  visual strides. Optional `setting=city` reuses the existing orbital sky and
  floating-city kit around the same courtyard, with raised rear-wall frames and
  sun-screens. No playable-area expansion or learning change. First version cost
  too much; lower-detail distant houses and simple camera proxies reduce it.
  Final `index-Bx8KJmVA.js`: build/typecheck, native courtyard/reverse review and
  focused control/resource/portrait/camera checks pass. Arrival 125 calls /
  194,644 triangles (initial city 143 / 215,284; sunlit control 112 / 167,084).
  Added visual scope still has a cost; no speedup or art-readiness claim.
  In-app tab 2 became unresponsive; fresh tab 3 recovered rendering after reload,
  remains paused for review. Original tab close attempts timed out; cause unknown.
  [Composition](experiments/20260929-city-composition.md) and
  [verification](experiments/20260929-city-composition-verification.md).
  Repeated tower shapes/simple surfaces remain below reference; no promotion.

- **29 September coordinated scene pass:** User approves faster coherent visual
  passes. Optional `look=sunlit` combines stronger directional light/material
  contrast with broader, spatially shaded foliage clusters; layout, character,
  colliders and source assets stay fixed. Bundle `index-CvVWYDBh.js`.
  Build/typecheck, native approach/courtyard/reverse inspection and bounded Sol
  movement/camera/pause/reset/portrait/resource checks pass. Arrival: 112 calls,
  167,084 triangles vs 112 / 176,164 control. Short frame samples unchanged;
  no sustained performance or GPU-utilization claim. Plain back walls and sparse
  horizon remain; art gate open. Preview paused at entrance. One shared
  [pass record](experiments/20260929-sunlit-scene.md); no production promotion.

- **29 September character silhouette comparison:** Root adds optional
  `character=courier` to the cleaned swept/ceramic facade: longer legs, compact
  curved helmet, shaped armor and scarf, with static parts batched by material.
  Original character remains the default. Bundle `index-BvtasEde.js`;
  build/typecheck pass. Root native approach walking, guided courtyard traversal
  and front/side/reverse views inspected. Proportions improve, but torso/pose
  remain plain/stiff; art acceptance, motion and physics claims stay open.
  [Art record](experiments/20260929-courier-character.md).
  Geometry cleanup leaves 12,128 triangles and no near-zero faces; grounding,
  controls, pause/reset, portrait and resource checks pass. Arrival rendering is
  112 calls / 176,164 triangles versus 146 / 167,312 with the old character;
  fewer submissions, more geometry, no measured frame-rate claim.
  [Verification](experiments/20260929-courier-verification.md).
  No production promotion.

- **29 September portal export/camera repair:** Blender source was
  closed, but export triangulation produced collapsed triangles. A copied
  conditioned export now passes strict QA: 31,658 triangles, zero degenerates,
  15 outward closed shells; measured vertex displacement under 0.01mm. Optional
  `form=swept-clean` preserves the earlier versions. [Repair record](experiments/20260929-portal-repair.md).
  Final bundle `index-BtbqVomh.js`; build/typecheck and focused cache parity,
  invalidation, interaction/pause/reset checks pass. Root native direct walking,
  wall contact/orbit and courtyard/reverse views inspected. Camera CPU work drops
  to about 2.0–2.35ms/update at sampled stationary walls, but overall frame pacing
  remains unresolved. [Engineering evidence](experiments/20260929-portal-repair-verification.md).
  No art acceptance or production promotion.

- **29 September swept-portal comparison:** Root reuses the editable original
  portal in a separate Blender study, changing only its upper silhouette and
  rebaking local AO. Optional `&form=swept` on the ceramic/daylight URL. Final
  bundle `index-lyZdIzAB.js`; build/typecheck pass, native through/return and
  side/reverse views inspected; preview paused. [Scope and judgment](experiments/20260929-swept-portal.md).
  Exported lower geometry/colliders match the control; focused browser checks
  pass. Strict closed-shell QA fails on both original and derivative, so neither
  gets a clean geometry certification. Short near-wall samples are 48.6ms control
  and 55.5ms swept; possible cost regression remains unresolved. [Verification](experiments/20260929-swept-portal-verification.md).
  This adds local
  architectural identity but does not resolve overall composition or the art
  gate. Same footprint; no learning expansion or production integration.

- **29 September ceramic/material comparison:** User requests further bounded
  iterations with prior research/feedback retained. Root tests luminous material
  masses, quieter paving and more frontal existing sunlight on the same assets
  and footprint, via `&palette=ceramic` on the daylight URL. Final bundle
  `index-B6gI-lo7.js`; build/typecheck pass. Native through/return and reverse orbit
  inspected; preview paused. [Scope and observations](experiments/20260929-ceramic-material.md).
  The facade is more legible, but plain reverse walls, simple character and sparse
  distant forms keep the art gate open. Focused movement/collision/camera,
  pause/reset, portrait and resource checks pass. Draw counts are unchanged;
  near-wall median remains 48.6ms in both short samples. [Verification](experiments/20260929-ceramic-material-verification.md).
  No production integration, new map, learning expansion or acceptance.

- **29 September available-tools comparison:** User defers Hugging Face work until
  they announce subscription access and asks us to continue now. Root conditioned
  a copy of the existing static architecture with Blender local-occlusion baking,
  revised the existing lighting and reused reduced-detail distant scenery on the
  same footprint. Native through/return and reverse orbit inspected on
  final `index-Dow4yO3h.js`; preview paused. [Scope and evidence](experiments/20260929-existing-asset-lighting.md).
  Build/typecheck, exact exported geometry/normal parity and focused browser
  movement/collision/camera/portrait checks pass. [Engineering evidence](experiments/20260929-existing-asset-lighting-verification.md).
  Short matched samples show essentially unchanged frame timing; near-wall
  movement remains slow (~49ms). No CPU/GPU utilization claim is established.
  A separate portal concept and prompt are saved for the later asset trial.
  This is a bounded local improvement, still below reference; no new map, learning work,
  provider dispatch, production integration or acceptance.

- **29 September follow-through audit:** The user asks what was missed despite
  their supplied direction and research. [Existing retrospective updated](experiments/20260929-world-production-retrospective.md#follow-through-audit-after-the-cloud-asset-discussion):
  missing method comparison, weak transfer of reference composition, repeated
  local repairs, and incomplete asset/scene cost evidence. Root owning art does
  not mean hand-building every asset. Next unresolved proof remains one asset
  comparison followed by its effect on the same small scene; no inference or
  runtime change occurred in this audit, and the art/learning gates remain open.

- **29 September asset-method reassessment:** User proposes Hunyuan3D-2.1 on
  free cloud compute, then Blender conditioning. [Research and bounded comparison](experiments/20260929-hunyuan-cloud-to-blender.md)
  distinguish feasible HF capacity from quota/compatibility, Kaggle shape-only
  feasibility from the larger PBR memory requirement, and experiment licensing
  from worldwide shipping. The official Space reports Running on Zero, but no
  inference has been performed. Next visual-method experiment is one generated
  static asset against the current authored baseline, before broad hand-modeling.

- **29 September conservatory depth refinement:** On the same footprint, root
  replaced the opaque lower glazing with alpha panes and a modeled interior,
  and replaced foreground spear cards with curved leaves. Native guided
  through/return, oblique glass and full reverse views checked on
  `index-Bw0s9O-m.js`; build/typecheck pass. Sol's export cleanup removes the
  prior degenerates: final GLB has 22,968 valid triangles and 89 outward shells.
  Static camera bounds filtering matches full raycast hits across 2,592 sampled
  rays. Focused movement/collision/camera, pause/reset, portrait, assets and
  legacy-scene smoke checks pass. The final near-wall sample is 55.5ms median
  versus 48.6ms for the older facade; smooth-play performance remains unresolved.
  [Visual work and limits](experiments/20260929-atelier-depth.md). Art remains
  below reference; no production promotion, map or learning expansion.

- **29 September live Blender facade iteration:** User installed and authorized
  Blender MCP. Root authored original adjacent architecture in a separate live
  Blender scene, reusing the existing portal, court, plants and controls.
  `?study=facade&portal=crafted&architecture=atelier` is the optional candidate.
  Native game inspection found and repaired inward normals and a low-camera
  reverse-view obstruction. Facade variants now share a wider 56-degree view
  aimed slightly higher at the original physical camera height. Build/typecheck
  pass; final bundle `index-BCaFV6vI.js`. Focused route, collision, camera,
  pause/reset, asset and portrait checks pass; root rechecked guided traversal
  and reverse framing in the native browser. Separate invisible camera geometry
  reduced the near-wall sample from 145.8ms to 62.4ms median, still slower than
  the matched older facade's 34.8ms. Performance and art remain unresolved.
  [Engineering evidence](experiments/20260929-live-blender-atelier-verification.md).
  [Work and limits](experiments/20260929-live-blender-atelier.md). Art remains
  below reference; no map/learning expansion, integrated acceptance or deployment.

- **29 September one-asset authoring experiment:** User supports experimentation
  with reuse of earlier work and quality first. Root added an optional original
  Blender-authored portal to the same small conservatory at
  `?study=facade&portal=crafted`, preserving the baseline. Same lighting, controls,
  character and surrounding scene; new profile, conditioned edges, material
  layers and baked local occlusion. Native matched views show a local improvement,
  not reference-quality scene coherence. [Comparison and limits](experiments/20260929-crafted-portal-comparison.md).
  Bundle `index-CH0nleps.js`; focused A/B engineering checks pass, with about
  50% more reported scene triangles and no established performance equivalence.
  [Verification](experiments/20260929-crafted-portal-verification.md). No map
  expansion, integrated acceptance, realistic-physics claim or deployment.

- **29 September small architectural proof checked:** User explicitly accepts a
  small graphics/art/physicality commitment before any map expansion. Root built
  one 18x22m conservatory entrance at the existing isolated preview's
  `?study=facade`, preserving the previous arcade. Connected building masses,
  deep portal, curved canopy and selected material/light treatment replace a
  larger world attempt. Sol reproduced/repaired a near-wall camera defect and
  verified collision, route, grounding, recovery controls, pause/reset, portrait
  and default-arcade smoke; root rechecked the final build through native GUI.
  [Proof and limits](experiments/20260929-facade-proof.md),
  [engineering evidence](experiments/20260929-facade-verification.md).
  Final bundle `index-DpSyChpj.js`; preview paused. Art remains below the full
  selected reference; dynamic physics and character locomotion are not proved.
  No map expansion, integrated acceptance, learning change or deployment.

- **29 September canopy/surface checkpoint checked:** Astra directly replaced
  crumpled leaf-card treatment with painted leaves and rounded blossoms, added
  planted-ground variation and staggered stone paving, and simplified fine
  tube geometry. Build/typecheck and Sol's focused runtime/control checks pass
  for `index-C_cO_-VJ.js`; root played outward/return, orbited and checked portrait.
  [Checkpoint](experiments/20260929-canopy-surface.md) and
  [verification](experiments/20260929-canopy-surface-verification.md) preserve
  exact source/build hashes and captures. Arrival triangles fell about 39%, but
  short frame samples were slower; no overall performance improvement is proved.
  Art remains below reference: architecture/vista form and lighting depth still
  need work. Graphics stays first; encounters/story/learning expansion remains
  parked. Preview paused; no integrated acceptance or deployment.

- **29 September visual-only checkpoint checked:** Root directly revised civic
  architecture, overlook framing, skyline profiles, surfaces, sky and lighting.
  Sol fixed a geometry-batching compatibility defect and verified the final
  `index-dIIQPuh3.js` build. Root played/orbited that build and checked portrait
  framing. [Art checkpoint](experiments/20260929-art-focus.md) and
  [verification](experiments/20260929-art-focus-verification.md) record exact
  evidence. Art remains below the reference; canopy treatment, surface richness
  and scale transitions are unresolved. Draw calls fell but triangles rose and
  the Intel UHD arrival frame sample is slower: no overall performance-win claim.
  Graphics/art remains the active priority; encounter/story expansion is parked.
  No integration, learning change, acceptance or deployment.

- **29 September latest user steering — graphics/art only:** Root widened the
  next checkpoint toward a complete lightwell encounter; the user corrected the
  order before integration. New encounter/companion modules are parked and unused.
  Root continues only visual architecture, composition, materials and lighting
  on the existing walkable isolated scene. Improve and inspect the art first;
  do not use interactions or world detail as a substitute for visual quality.

- **29 September root visual repair 2 built and played; art remains below target:**
  Astra directly implemented the vista, protagonist, foliage and light/material
  revision. Sol completed bounded engineering checks, then reported foreground
  foliage blocking a portrait camera view. Root added camera-near foliage
  clearance and separated the portrait place label from controls. Build/typecheck
  pass for `index-DWK7qCVY.js`; root played the actual outward/return route and
  inspected portrait framing. Targeted clearance regression passed; the former
  foliage-blocked view now exposes Zip and the surrounding route. This does not
  establish every possible camera angle or real background-tab behavior.
  [Worker review](experiments/20260929-arcade-worker-review.md) and
  [engineering report](experiments/20260929-arcade-engineering.md) separate evidence.
  Distinctive architecture, graphic art language and a living world still fall
  short of the reference. No acceptance, integrated opening, or engine migration.
  Preview is paused; both substantial art repairs for this attempt are exhausted.

- **29 September user changes visual ownership:** Root Astra now directly edits
  composition, geometry, materials and lighting; Sol is restricted to bounded
  engineering/verification. Sol's visual assignment is stopped. Its first repair
  reduced measured arrival calls from 3,427 to 724 after batching; that is a draw
  count comparison, not CPU/GPU utilization. Root has implemented a new vista,
  leaf-spray material and camera/light revision and is checking it in native GUI.
  This is the second substantial visual repair of this arcade attempt, not a new
  experiment resetting the repair cap. No art acceptance or integration yet.

- **29 September arcade functional repair verified; visual repair 1 assigned:**
  Sol corrected sky clipping, destination reversal, material warnings and paused
  input/lifecycle handling. Root reloaded and completed guided travel to the
  pavilion and back through actual GUI controls, observing both arrival messages
  and the corrected sky. [Worker review](experiments/20260929-arcade-worker-review.md)
  separates native evidence from Sol's focused browser assertions. Pointer-click
  delivery in the parent browser remains uncertain; keyboard activation and
  camera drag work, and Sol's automated DOM clicks passed. Root's tab is visibly
  paused while Sol undertakes the first of at most two substantial visual repairs:
  landscape depth/vista, coherent canopy and material/light/form definition.
  No full opening, art acceptance, integration or deployment claim.

- **29 September Sol arcade checkpoint built; root inspection started:** Sol
  completed the isolated composition in about 11 minutes and stopped. Build and
  typecheck passed; [builder report](experiments/20260929-arcade-builder.md).
  Root opened the actual preview at `http://127.0.0.1:8062/` for the user. Initial
  GUI observation shows a black sky and sparse, rudimentary vegetation; route
  and Pause clicks produced no visible response in the first probe. Cause and
  full playability remain unverified. No visual acceptance or expansion.
  [Observed frame](../artifacts/bellweather-arcade/root-initial-observation.png).
  Sol is idle at the review boundary. User requests clearer visibility into
  delegated work: report assignment, concrete completion/blockers and review
  outcome explicitly, without constant worker polling.

- **29 September Opus unavailable; current-quota composition attempt:** User
  reports no Anthropic subscription. Opus is parked, with no purchase or provider
  run. [Available-builder checkpoint](experiments/20260929-available-builder-art-trial.md)
  uses root art direction and a fresh Sol implementation context for an isolated
  navigable arcade/garden composition. Review the actual forms in GUI before
  finishing its interaction loop. This changes the builder/form-production
  attempt, not the art target or production engine; the prior trial stays frozen.

- **29 September Opus art trial preparation authorized:** User agreed to the
  focused study's recommendation. The [builder brief](../design/experiments/opus-art-trial/BRIEF.md),
  [evaluation](../design/experiments/opus-art-trial/EVALUATION.md) and proposed
  [execution limits](../design/experiments/opus-art-trial/EXECUTION-POLICY.json)
  prepare one isolated opening build from the licensed baseline and accepted
  reference. Installed Claude Code is 1.0.117; its help lacks the current auth
  subcommand, and provider access remains unverified. No API key is configured
  in this process. Subscription versus API billing and the explicit budget are
  pending the user's selection; no inference run has started. The historical
  rejected Astra output is a comparator, not a controlled head-to-head result.

- **29 September focused Opus 5.5 follow-up:** [Last-week production study](experiments/20260929-opus-last-week-production-study.md)
  reads original creator prompts/source and uses native GUI observation of Sakura
  River Valley and Willowmere. Stronger procedural/code-produced visuals challenge
  an asset-only explanation for our misses. Next decision should change builder
  or form-production method in a bounded comparison; mandatory Blender and an
  engine migration are not supported conclusions. No provider dispatch, new art
  implementation, candidate promotion or deployment. The failed trial below stays
  frozen; current art feedback remains open.

- **29 September source-based trial — art frozen below target:** The separately
  reviewed opening prototype is built at `experiments/bellweather-world`.
  Root actively played the lightwell -> reachable overlook -> return sequence
  and checked phone-width reduced-motion guidance. Two substantial visual
  revisions are exhausted. [Art verdict](experiments/20260929-bellweather-source-trial.md):
  coherent material/light reuse, but weak place identity, rudimentary forms,
  insufficient lived-in detail and unresolved portrait composition. Do not
  promote or enlarge it. [Focused functional/cost verification](experiments/20260929-bellweather-source-trial-verification.md)
  records repaired pause/return/text-clipping defects and a bounded RTX 3060
  sample; hidden-tab behavior and early manual exploration remain unassessed.
  This is not an integrated acceptance pass. The proposed next method is one
  authored architectural composition, not another procedural dressing round.

- **29 September source-based world trial authorized:** User replied "ok, let's
  continue" to the retrospective recommendation. One isolated Three.js research
  trial and a bounded reachable pre-rupture world design are now authorized.
  Sol prepares the pinned MIT source baseline/build/cost evidence; root owns art
  realization and native play. The separate draft
  `design/experiments/bellweather-world-trial.json` uses the existing independent
  design gate before prototype work. Canonical v8, active PlayCanvas runtime,
  learning evidence and deployment remain unchanged. No production migration.

- **29 September world/art retrospective — decision proposal:** User challenges
  repeated misses across the accumulated work. [Retrospective](experiments/20260929-world-production-retrospective.md)
  compares the accepted reference with both recent outputs and records a short
  native Summer Cycle observation. Root identifies composition, identity,
  constrained authoring and unreachable discovery as failures of direction.
  A source-based isolated rendering/world trial and a reachable opening route
  were proposed for discussion. The subsequent user authorization above permits
  the isolated exception/design trial; migration and implementation acceptance
  remain unapproved.
  Earlier next-step recommendations below remain historical inputs to this decision.

- **29 September deeper showcase source study:** User asks how recent Opus demos
  actually achieve their visuals. [Source audit](experiments/20260929-opus-visual-source-study.md)
  inspects rendering/geometry code and separates Three.js WebGL from WebGPU and
  unverified model attribution. Next trial should combine richer procedural form
  with art-directed shading through a narrow native rendering boundary; asset
  shopping alone does not close the gap. No renderer migration or art acceptance.

- **29 September asset-corpus pilot:** Offline candidate selection and a small
  licensed KayKit subset are implemented; native asset inspection rejected the
  stock tree forms for Bellweather foreground/landmark use. No active game or
  visual acceptance change. See [pilot and production decision](experiments/20260929-asset-corpus-pilot.md).
  Blender is being installed by the user for later conditional asset work.

- **29 September reuse/model research:**
  [Current free assets and specialist-model review](experiments/20260929-free-assets-and-specialist-models.md)
  follows v3's reuse-first/style-family resolver, conditional Blender and optional
  world-source boundaries. Immediate next step is one curated coherent kit and
  at most one cleared hero-asset generation trial, not multiple model integrations.
  Local GPU is 6 GB; headline free weights do not establish runnable or
  commercially cleared pipelines. No new inference/provider dispatch occurred.

- **29 September visual/productivity experiment: not promoted.** The isolated
  `web/lab/visual-benchmark.html` exercises a larger terrace, shared controls,
  material-group architecture, reused foliage and licensed HDR/surface assets.
  Root played desktop and narrow-screen route responses/reset/orbit; the final
  art result still misses the accepted reference. Generic geometry, weak world
  identity and inadequate material/shape coherence remain blocking. More scale
  and lighting are not acceptance. The active game candidate below is unchanged.
  The bounded experiment stops here; see
  [result and next production decision](experiments/20260929-visual-benchmark.md).

- **Companion art iteration, 29 September (worker verification complete):**
  Mira/Tavi now have distinct shell/visor/joint treatment, grounded feet and
  connected authored gestures. Shared opt-in composition/pose helpers retain
  semantic anchors, use existing transforms/colliders and keep story/palette in
  package data; an unrelated cast exercises the reusable boundary. Root native
  desktop garden/inspection/replay and phone skybridge/inspection observations
  pass. Build, 469 application tests (seven configured skips), affected browser
  behavior/contact/lifecycle checks and all 19 presentation states pass. Actual
  opening sample: 543 draw calls/50 batches; no CPU/GPU-utilization measurement.
  Check character rendering cost before multiplying detail across inhabitants.
  All owned browsers/servers closed.
  Candidate `5d602e34b98ef6e9cb41c5f87b137afc081af3af434176d6163b0da7e08ec3a6`.
  No new cold acceptance or reference-quality/engagement claim. See
  [companion checkpoint](experiments/20260928-companion-art.md).


- **User sequencing clarification, 28 September (current priority):** Complete
  the world, art direction and engaging play experience first, then focus on
  learning progression. The core-learning research request was an important
  interruption, not a direction to abandon the visual/world work. Root's proposed
  priority switch was premature and is superseded. Keep the accepted graphic
  techno-fantasy utopia, credible lighting/contact and desire to inhabit/explore
  central; judge them through actual play and the existing art/world/story/gameplay
  lanes. Tests and attractive stills do not establish engagement. Root Astra owns
  art direction and demanding graphics work; Sol owns bounded implementation and
  verification. Preserve learning correctness, evidence and saves throughout.
  This sequencing does not authorize later levels or deployment promotion.

- **Core story/learning review, 28 September (retained for the following stage):**
  Root researched primary learning/game-design sources; Sol audited actual concept
  decisions and evidence. The [core review](experiments/20260928-story-learning-core-review.md)
  retains the draft chapter board, fidelity risks, source limits and proposed
  learning workflow. Current v8 approval remains opening-only, prototype-stage;
  broad AI-internals understanding and novice learning remain unproven. Resume
  the deeper learning-design work after the world/art/engagement checkpoint.

- **Composition and access checkpoint, 28 September (worker verification complete):**
  Revised district/transit composition, partner poses and one pinned licensed
  landmark tree. Shared repairs preserve keyboard focus, stabilize enlarged labels,
  invalidate placement on text changes and isolate speech from page quote styles.
  Build and affected shared/browser checks pass; application suite 468 tests with
  seven configured PostgreSQL skips preceded the final JS/CSS repairs. Behavior-only
  prologue run passes both routes, replay/save isolation, keyboard escape and handoff.
  Presentation: 18-state complete pass plus one fresh-reentry state pass cover the
  canonical 19 states; no single final 19-state or committed-candidate critic report.
  Root native desktop/phone art play is recorded; no new cold/learning acceptance.
  Final runtime fingerprint `5e25605df3996b6a1b632f9582b3ee3ccb85812fdfd9f3b2c84f52a410c25b68`.
  Owned browsers/servers closed. No commit/deployment or later-level expansion.
  See [checkpoint](experiments/20260928-world-composition.md). World/art and
  engagement work continues under the latest sequencing above.

- **Receiver-discovery iteration, 28 September:** User authorized continued work.
  Independent design v8 review passed prototype `opening` only at digest
  `beb7a90377e4be81221448199e7ff6b3a17594b28f772804d408c32353225810`.
  One object-linked receiver inspection now follows the route response before
  ambient story progression; it is not a second route confirmation or learning
  assessment. Root authored distinct shaded terrace/train balcony content. Sol
  owns shared camera-action persistence and the optional inspection controller.
  Worker verification complete: build, 465 application tests (seven skips), focused
  shared tests, renderer contract and full prologue browser pass. After final
  label/camera-only adjustments, targeted phone checks and the full 13-state
  presentation budget pass with zero violations. Native root play confirms both
  inspections; the separate Harbor fixture proves the shared behavior beyond this
  game. Runtime fingerprint `97d6816cdc3392463ec11cc4097ad206f5d054d54aa4021934daf355fef8fba5`.
  Owned browsers/servers are closed. Independent runtime alignment, cold discovery/
  attachment and reference-quality art remain unaccepted; old scores do not transfer.
  No commit, deployment or later-level expansion. See
  [iteration](experiments/20260928-receiver-discovery.md) for evidence boundaries.

- **Opening art/cost checkpoint, 28 September (supersedes intermediate status below):**
  Astra revised terrace architecture, landmark and character staging; Sol added
  shared opt-in static batching, demand-driven redraw and pinned reusable CC0
  foliage. Final nine-state presentation checks pass with zero violations.
  Actual opening observation: 363 draw calls / 44 static batches; no validated
  opening speedup or CPU/GPU-utilization claim. The frozen prototype fingerprint
  is `a26d73d4156c9ec67497c69049526582548985c6dac30651a21ee87e00270dd0`.
  A child reviewer was blocked before play; the user authorized fresh Astra chat
  `01a0e855-0326-7cd3-8b4a-f00dcfd4290e`: native desktop/phone play completed,
  cold account frozen, scoped diagnostic **needs revision**. Story 6, art/world 5,
  first-touch 5, presentation 5; learning/chapter unassessed. These are diagnostic
  judgments, not schema-v2 readiness scores. Phone recenter loses both choices;
  relationship/discovery payoff and reference alignment remain weak. Sol repaired
  recenter and chamber handoff; root confirmed those fixes by native phone play.
  New fingerprint `d73219dd8668164294028374a01c3418f00ab4326a1b8028e74073b6d7963c61`
  has passing build, focused controls/renderer and full opening browser checks.
  The 464-test application run (seven configured skips) and nine-state budget
  report precede this bounded repair. Arbitrary orbit can still hide choices until
  Recenter; edge-cue/action persistence remains open, alongside art/relationship
  improvements. The new fingerprint has not been independently rescored. All owned
  review/test browsers and preview servers are stopped. See
  [checkpoint evidence](experiments/20260928-opening-art-and-cost.md).
  Graphics feedback remains open; current changes are uncommitted, with no
  deployment promotion or later-level expansion.

- **Root graphics pass, 28 September:** At the user's explicit request, Astra
  owns graphics/art implementation while Sol continues shared gameplay/state
  repairs. [Reddit/X creator study](experiments/20260928-graphics-social-study.md)
  records source claims separately from direct browser observation. A local
  opening draft adds reusable geometry/surface/material/shadow authoring and a
  new Bellweather composition. Root played both opening choices through CUA on
  desktop; phone review exposed missing off-screen choices. Sol repaired authored
  portrait framing; root's fresh 390px CUA recheck saw both choices and played the
  garden response. The full opening browser group and unrelated shared-mesh/
  texture lifecycle passed. Build and 462 application tests passed (seven
  configured skips); this does not establish visual quality, performance or
  readiness. Garden-response character crowding and phone text covering the
  action remain visible art/presentation defects. Full journey browser groups,
  exact-candidate presentation evidence and independent runtime review remain due.
  Graphics remain short of the selected reference; no independent pass or user
  acceptance is inferred. Current changes are uncommitted.

- **Continuing user feedback, 28 September:** The user acknowledges improvement
  but explicitly has not performed a full review. Graphics still need to move
  closer to the selected art direction, with realism, great lighting and physics.
  Track this open priority and the accumulated active directions in
  `docs/USER-FEEDBACK.md`; no build identity or acceptance is inferred.
- **Work resumed:** The user authorized continued system/game work after choosing
  the reference. Sol reports independent opening-only approval for revised design
  `7c0ea00706d98ef6ef46da0c6c1a6ced6a972aaca38e619444405f55f5a4101d`
  and is implementing the bounded prologue. Review artifact:
  `artifacts/cold-review-7e82fcf/RESONANCE-DESIGN-REVIEW-04.json`.
  The prior visual-feedback hold below is historical; runtime alignment and
  experience acceptance remain open. Sol will record actual candidate evidence.
- **Visual direction accepted, 28 September:** The user retained the graphic
  techno-fantasy utopia reference and requests an alive, expansive, captivating
  world worth exploring, with realistic lighting/physics. See
  `docs/ART-DIRECTION-REFERENCE-20260928.md` and its preserved reference image.
  This settles the leading visual reference, not runtime quality or an exact
  level layout. Reconcile the prologue/world design with this feedback and recheck
  the exact design gate before runtime work; old medieval interpretations and
  rejected filter-like variants are not the implementation target.
- **Earlier prologue design boundary, 28 September:** The resonance-trail treatment in
  `artifacts/experience-brief-20260928-v2.md` has a passing independent,
  prototype-only design review for canonical digest
  `076cef174f9134a3eb01ffa99bb2e696c86ae88830eba48dacb2e220240c7456`.
  That review permitted only `opening`; runtime alignment remained
  unassessed, and the old v5 review is preserved in
  `artifacts/cold-review-7e82fcf/LEARNING-DESIGN-REVIEW-v5.json`. See
  `docs/PROLOGUE-RESONANCE-PLAN-20260928.md`. The direct Sky Reach study and
  adopted `docs/GAME-GENERATION-OPERATIONS.md` informed this experiment; neither
  approves its experience quality. Runtime/art implementation was initially held
  for visual feedback; that hold is superseded by the resumed-work entry above.
  Preserve earlier critic findings, runtime evidence and saved learning identities.
- Current runtime repair is `063e3c1a000a1399dd5317f848f9b159d89b9346` on
  the development branch. The same reviewer's informed `a6d609d` recheck
  closed the ordinary status-placement case but returned **needs_revision**:
  after commitment, visible route-sign controls and physical signs no longer
  opened for inspection. Its separate report is
  `artifacts/cold-review-7e82fcf/informed-recheck-a6d609d/RECHECK-REPORT.md`
  (SHA-256 `58b737e752f4a88ee45c0ee61e029532ff00eea61e2dd52ab6aa92e62046626f`).
  The `063e3c1` repair permits read-only inspection after commitment while
  keeping staging and first choices locked. A selected sign remains reachable;
  the existing inspection sheet offers the other signs on phone. Enlarged
  readout values are included in the shared presentation simulation, and the
  shared session ledger no longer revives a stopped browser claim when a PID
  and loopback port are reused. These are worker repairs, not critic acceptance.
- The `063e3c1` worker's focused route replay passed after one intermittent
  command-response timeout on an unchanged first run. Adaptive phone play from
  the actual opening through tutorial and route saw wrong history/Moon,
  Moon-gate failure, today's-notice recovery, postcommit read-only Today/Old
  inspection, paused-prefix reload and Star output; captures and action trace
  are under `artifacts/worker-source-access-repair/`. That disposable browser
  and server are stopped. Build passed, 460 application tests passed (seven
  configured PostgreSQL skips), the full active browser sequence passed, and
  the 35-state draft presentation report passed with zero violations at
  `artifacts/presentation-budget-source-access-draft.json`. The exact committed
  source/tree `3dc2309f05ecaa2e792e7b8b90b43d02c0bf35af` then passed the
  full 35-state presentation gate with zero violations at
  `artifacts/presentation-budget-3dc2309.json`; the later status-only record
  does not change runtime source. Independent informed repair recheck is still
  pending. The original broader game appeal, relationship and art/world
  findings remain open; motion/audio and hosted entry remain unassessed.
- The independent Astra cold/warm review of
  `7e82fcf581e0d0ea486f5dec283799c7a7bcea94` returned **needs_revision**.
  Preserve `artifacts/cold-review-7e82fcf/{COLD-REPORT.md,WARM-COMPARISON.md,PRIORITIZED-FINDINGS.md}`
  unchanged (SHA-256 prefixes `75d47a5da6fb`, `02f98fee0353`,
  `d5ae7bc3e6be`). Its authoritative disposable learner export is in that
  folder. The later informed recheck of `af49886babc974ea3a33ae0b2be2dfc08a5da05f`
  also returned **needs_revision**: the complete tutorial request, one device
  insertion, and stable prefix/recovery play were observed, but the source/gate
  relationship was thin and pending source staging disappeared on reload.
  Its separate report is
  `artifacts/cold-review-7e82fcf/informed-recheck-af49886/RECHECK-REPORT.md`
  (SHA-256 `75d97315a9f34b5186631dca2df47a2420e3905a3ccc390407f50cdc0a5458b9`).
  The subsequent informed recheck of
  `b48a8ac32bf5cc0f78ade0aa7483a5d00b38277a` also returned
  **needs_revision**: pending-source reload/cancel, first-path direct Make,
  and Moon failure/recovery improved, but today's board hid the Sun mark,
  retry Make opened a second identical action, and fitted controls drifted
  from the device. Its separate report is
  `artifacts/cold-review-7e82fcf/informed-recheck-b48a8ac/RECHECK-REPORT.md`
  (SHA-256 `d6e7dd508d7ecf28bc532bef695f19fa2fc68a491e9d70a752608d4cf61d5de3`).
  The disposable review learner export is in that folder; 23 stored commands
  preserve first choices through Star output, while assessment remains draft,
  evidence absent and mastery unknown. Original cold/warm reports were not rewritten.
  The same reviewer's informed recheck of `c744f12dc38625a6b6daeee8db1beeae6c183c0a`
  closed the ordinary phone/desktop Sun-mark occlusion and duplicate retry action,
  but returned **needs_revision** for a source-status marker drifting below Zip
  after phone prefix reload and closed completed output. See
  `artifacts/cold-review-7e82fcf/informed-recheck-c744f12/RECHECK-REPORT.md`
  (SHA-256 `f03ea9db2944fb0acb1fe0f26db934b3c7f22f28f894d5dfd821d68b9c78b6d5`).
  Its separate read-only learner export preserves the first wrong history and
  Moon inference through Star output; assessment remains draft/unknown with
  zero evidence. The reviewer browser and disposable server were stopped.
- Shared boundaries now protect whole required content groups while fitting,
  including a previously shed ancestor and explicit cannot-fit reporting;
  an unfamiliar Harbor fixture proves a missing member fails. Live WebGL
  loss/restoration preserves opening and attempt state and gives explicit
  recovery; a materially different WorldSpec passes the same opening path.
  The active foundation browser gate includes that probe. The reviewer
  workflow now preflights every input required by its assigned claims,
  including sustained movement when needed.
- The approved `first-words-5` design changes only context-contrast and
  context-practice. Inspecting/staging a sign is reversible; one machine
  insertion commits it. Equal route framing avoids giving away the gate before
  inference. After a separate input-history and source-inference commitment,
  one deliberate Run advances the toy while every complete saved prefix can be
  paused, reviewed and resumed; reload returns paused. Speak remains a separate
  world action. The old v1–v4 snapshots, learning IDs, first choices and
  assessment/output separation remain pinned. Canonical design SHA-256 is
  `6efa8322088bcd0208fde8d723a3373f588c6a1f92f4809f25d514e1b8647f6d`;
  the same independent reviewer approved its structure and implementation
  gate in `artifacts/cold-review-7e82fcf/LEARNING-DESIGN-REVIEW-v5.json`.
  Runtime alignment is still unassessed.
- The `b48a8ac` repair scopes reversible source staging to the attempt and pinned
  package in browser session storage, with no new command or assessed choice.
  Cancelling and reloading clear or restore only that pending source. The
  shared boundary passes an unrelated Harbor source fixture. The authored
  mission recomposes its existing Moon, Sun and Star gates so all three marks
  can be compared from the junction; phone sign inspection is a temporary
  player-opened sheet below the gates, with the selected world sign highlighted.
  Wrong Moon output is labelled at the Moon gate, and its finished readout
  yields to the recovery signs. A committed source exposes **Make first word**
  directly at the machine, removing an extra reopen step.
- Worker verification on `b48a8ac`: build passed, 457 application tests passed
  (seven configured PostgreSQL skips), focused phone route replay passed
  staging/reload/cancel, insertion, inference, pause/reload, wrong route and
  recovery; the full 34-state presentation scenario passed with zero
  violations, including sign inspection and enlarged text. The full active
  foundation, opening, control, chapter, relay, readability and lifecycle
  browser command passed sequentially. A disposable adaptive phone play
  inspected the rebuilt junction and signs, reloaded an uncommitted old sign,
  committed a wrong history and Moon inference, saw the failed Moon route in
  the world, then inserted today's notice for recovery
  (`artifacts/repair-route-worker-play-2/`). That is implementation evidence,
  not a critic verdict. The exact-commit 34-state presentation report passed
  with zero violations at `artifacts/presentation-budget-b48a8ac.json`, but
  the informed reviewer findings above keep the experience gate open.
- The `c744f12` repair moves existing notice boards away from the
  compared gate marks, fits the machine action back to the physical device,
  folds an empty generated-history readout, and makes the retry world action
  dispatch the first word once even during a visual transition. A shared
  `probeWorldFeature` checks whether a declared world mark is on screen and
  actually hit at its rendered point, including DOM/nearer-world occlusion;
  an unrelated Harbor fixture and a deliberate foreground-board regression
  prove failures. The required presentation scenario now checks three marks
  at the ordinary junction, on phone/desktop and during source inspection.
  The sign sheet keeps complete meaning and both actions visible at 200% text
  within the unchanged budget. Exact `c744f12` full 35-state presentation
  passed with zero violations at `artifacts/presentation-budget-c744f12.json`.
  This is worker repair, not critic acceptance.
- Current status-placement repair folds committed source/support into the
  complete next-input world carrier when that carrier fits, so it remains
  visible with the request and generated prefix instead of duplicating below
  Zip. Once inference is committed and generation is underway, source prompts
  that cannot stay at their physical sign yield; the signs remain inspectable
  in-world and source prompts return for failed-route recovery. The shared
  presentation checker now measures a declared status/action edge gap; an
  unrelated Harbor fixture fails when status is painted far from its device.
  Focused live phone replay passed the critic's prefix-reload and closed-final
  counterexamples, including a 200% text fallback to source status and the
  player-opened complete input. Screenshots are
  `artifacts/route-retry-prefix-phone-draft.png`,
  `artifacts/route-retry-prefix-phone-200text-draft.png`, and
  `artifacts/route-retry-complete-phone-draft.png`. This is worker verification,
  not a new reviewer verdict.
- Previous `a6d609d` repair checks: build passed; 458 application tests passed (seven
  configured PostgreSQL skips); the focused route browser and full 35-state
  `c744f12` presentation scenario passed with zero violations. The full active
  browser sequence now passes foundation, opening, controls, physicality,
  chapter, situated route, relay, readability and lifecycle sequentially.
  Three earlier attempts
  to start an additional adaptive shared-harness session crashed at viewport
  setup before any game input; no session/browser/server survived. The earlier
  `b48a8ac` adaptive worker play and independent reviewer play are preserved,
  but they do not verify this new status-placement repair. Exact-commit
  presentation evidence and an informed reviewer recheck remain required.
- The accepted operational architecture direction is now documented in
  `docs/GAME-GENERATION-OPERATIONS.md`, with current candidate authority kept
  here and the user's supplied proposal unchanged. No provider, Level 2,
  deployment promotion or `main` merge is authorized by this repair.
- Next: reopen the integrated opening-to-Level-1 experience design before more runtime
  expansion. An independent informed repair recheck of postcommit source
  access remains pending; the original cold/warm findings stay needs_revision.
  The broader game appeal, relationship, art/world and learning gates need
  actual play and criticism under the revised design, with hosted entry/auth
  and motion/audio still unassessed. The user retains the final experience
  verdict. No Level 2, deployment promotion or main merge follows from worker
  checks.

## Candidate

- **28 September route-source inspection repair (unreviewed):** Runtime source
  `063e3c1a000a1399dd5317f848f9b159d89b9346`, pinned `first-words-5`.
  The exact runtime candidate is separate from subsequent documentation-only
  commits. Worker checks and unresolved criticism are recorded above.

- **26 September changed-case receiver checkpoint (unreviewed draft):** New
  `first-words-4` starts have three physical, dated notes at the receiver:
  Mira at 18:00 in the Loft, Mira moved at 18:20 to the Yard, and Tavi at
  18:30 in the Sun Court. Each note can be inspected and carried without an
  assessed action; explicit insertion commits only that source. The learner
  separately infers whether it locates Mira, sees **Meet** and **at** generated
  one at a time, then chooses among original input, latest piece only, and
  complete generated history before the next input is revealed. An irrelevant
  Tavi note can produce fluent **Meet at Sun Court** without a Mira reply;
  her later note produces **Meet at Bell Yard** and a local reply/light at the
  receiver. First decisions survive retries; predictions do not alter toy
  output. Existing v1–v3 snapshots and learning IDs remain pinned. A live
  390×844 adaptive implementation play inspected Tavi's note, found and
  repaired a carry control clipped above the screen, committed a wrong
  latest-piece history choice, reloaded, saw the no-reply result, recovered
  with Mira's later note, and saved Level 1. Trace/screenshots:
  `artifacts/repair-relay-play/`. `python manage.py build` passed and 447
  application tests passed (7 PostgreSQL skips). The focused phone/desktop
  relay browser check passed, including reversible staging, no-Mira source
  inference, generated-history visibility, reload and recovery. The full
  Level 1 chapter browser module subsequently passed its tutorial, wrong
  route/recovery, relay, fixed-context comparisons and 360/430/1280 variants
  with no page errors; report: `artifacts/level1-chapter-report.json`. Opening,
  tutorial, controls/physicality, 200% readability and hosted lifecycle
  browser groups also passed. An exact-code-SHA 25-state presentation report
  passed with zero violations at `3975442aea8d74a3205e6eadf973a98a8ce18143`;
  report: `artifacts/presentation-budget-3975442-rerun.json`. An earlier
  full run exposed one tutorial desktop focal overlap and a later intermittent
  sheet opt-in witness failure; the focal defect was fixed, affected subsets
  passed, and the subsequent full run passed. The implementation design gate
  allows this nine-step design, while runtime alignment remains unassessed.
  Independent fresh-context Astra review, its motion/audio evidence and user
  acceptance are open. This is not critic approval.

- **26 September route-machine checkpoint (unreviewed):** A new pinned
  `first-words-3` snapshot keeps existing v1/v2 attempts replayable while new
  Level 1 runs generate **Open** from the committed sign, pause before showing
  the assembled next input, record a first input-history choice, then reveal
  that Open joined the request and sign. The next separate choice asks which
  gate the supplied sign supports, including **no gate** for the parade note;
  this inference cannot change the toy's authored continuation. In diagnostic
  390x844 GUI play, the wrong unchanged-input choice survived reload, the
  parade/no-gate inference was correct even while the toy wrote a fluent Moon
  command, the gate stayed shut, and replacing the source with today's notice
  produced and opened the Star route without erasing first choices. The four
  choices now fit as an opt-in phone sheet at ordinary and 200% text, and the
  desktop card sits clear of Zip. `python manage.py build` passed; `python
  manage.py test` passed 444 tests (7 PostgreSQL skips); the focused route
  browser check passed; and the three-state phone/200%-text/desktop
  presentation report passed with zero violations. Trace/screenshots:
  `artifacts/repair-inference-play-2`; budget report:
  `artifacts/repair-route-presentation-result.json`. The broad Level 1 chapter
  script reached the route/recovery/relay/ending path but stopped in an
  auxiliary hint assertion that still used a broad selector; that assertion
  was narrowed and rechecked by the focused browser run, not by a new full
  chapter rerun. At that checkpoint, changed-case relevance/recency and full
  generated-history alignment remained open; the receiver repair above now
  addresses them. Independent cold review, exact-candidate full presentation
  and user acceptance remain open. This checkpoint is not critic or release
  approval.

- **26 September implementation progress (unreviewed):** Level 1 route boards now
  open an object-local inspection with their full sign text. The player can stage
  one sign and change it before carrying it to the message machine; only the
  explicit insertion records the existing authoritative `scan-*` action. On a
  phone, insertion returns to the world readout so the complete supplied sign
  appears before the destination prediction. Existing saved game snapshots and
  learning IDs were not changed. This is one bounded interaction repair under
  the approved design, not full nine-step runtime alignment or readiness.
  Build and 15 episode tests passed. Live 390x844 diagnostic play inspected,
  restaged, inserted, changed camera and reloaded the committed source. Focused
  presentation checks passed with zero violations across 10 desktop-prefix and
  five phone states (including 200% text). The earlier full Level 1 module
  passed before the phone handoff repair; its post-repair rerun passed the new
  source/recovery path but timed out waiting for a later relay response in an
  extra transfer trial, so that later path is not reverified by the rerun.
  Full critic review, complete presentation report and user acceptance remain
  open. The user has explicitly requested an unreviewed GitHub/Render progress
  preview of this repair; deployment is a separate action and is not readiness.

- Development branch `docs-readthrough-20260921`; prior cold-reviewed repair
  commit `38e88f1`. `main` remains the canonical development destination.
  This newer implementation is not cold-reviewed or merged; the experience
  remains in `needs_revision`. GitHub `deploy/render-supabase` was separately
  advanced to the earlier `bcf6c4f` progress snapshot after explicit user
  authorization, but automatic approval review rejected the Render trigger.
  The live site remains on `74455fd7`; see
  `docs/experiments/20260926-user-requested-progress-preview.md`.
- The candidate repairs the cold critic's missing tutorial input/history with a
  carried, world-anchored readout; adds a reachable Level 1 speech station;
  makes its action visibly say OPEN ENGINE; and compacts phone markers without
  shortening the learning clues. The optional panel remains available.
- The system now enforces a visible learning carrier before the next action,
  checks its presence on narrow and desktop states, measures touch-control and
  informational coverage separately, and refuses a prose-only budget raise.
  The play harness re-applies and verifies viewport size on every step, persists
  resize, bounds its frame probe, records browser ownership and verifies cleanup.
- A fresh-context Astra completed an unprimed 390x844 GUI playthrough on frozen
  `38e88f1`, then a separate design-intent/Breath-of-the-Wild calibration report.
  It rated the candidate `needs_revision`; neither report is a readiness approval.
- Commit `d088c1b` changed the learning design without updating its prototype
  review. That stale record is archived at
  `design/reviews/20260926-stale-prototype.json`. The current nine-step design
  was revised against the cold/warm findings and independently approved for
  **implementation** at digest `9b1ba9a9d80c4be1c73a984b3a522181c366f6d21cbc0fa1a5d8171a8bd7d2b5`.
  `design/review.json` is current; `python manage.py design-gate --stage
  implementation --review design/review.json` passes. Runtime alignment remains
  unassessed. A new `implementation` design gate and independent CI job prevent a
  prototype-only or stale review from authorizing the full journey while
  technical tests remain runnable.

## Evidence on or leading to this candidate

| Claim | Status |
| --- | --- |
| Build and design structure | `python manage.py build` passed in a clean worktree at frozen `38e88f1`; learning-design quality and runtime alignment remain unassessed by that structural command. |
| Revised learning design | The full implementation-stage review passes for the current design digest, not the older game. It specifies world source acquisition, explicit inspect/stage/commit, a no-gate inference for irrelevant route text, and a changed case separating relevance/recency and complete generated history. The existing runtime has not been aligned or replayed against this design. |
| Application tests | 440 tests passed with 7 PostgreSQL skips in a clean worktree at frozen `38e88f1`; the skipped tests need a real disposable PostgreSQL URL. |
| Active browser groups | All six groups passed sequentially on the code that became `38e88f1`: opening, tutorial, controls/physicality, chapter, 200% readability and hosted lifecycle. A transient tutorial reload heading required a bounded 30-second wait; the saved LOOK step then appeared and passed. |
| Presentation budget | The required full 25-state `--candidate 38e88f1` report passed with zero violations in a clean worktree. Tutorial phone: 19.3% total, 13.6% informational; Level 1 first decision phone: 19.2% total, 13.6% informational, all 3 route carriers visible. Report: `artifacts/verify-96/artifacts/presentation-budget-38e88f1.json`. |
| CPU/GPU review | Direct3D 11 identified the Intel UHD GPU and measured about 2.2 CPU cores plus 36% GPU on a 390px active scene. Bounded SwiftShader comparison used about 8.3 CPU cores and 0% measured GPU; its WebGL renderer query did not complete, so these are workload samples rather than a same-frame benchmark. The GPU switch improves responsiveness but moves work to the GPU; the self-ending frame probe and reliable process cleanup remove avoidable work/leaks. |
| Browser harness integrity | A real `start` said 390x844 while a later `step` saw 484px wide. Reapply-on-step repair was verified across separate commands: 390x844, then 360x800 after resize, still 360x800 on the next connection. A direct Windows `start` sometimes stalls at CDP; an empty PowerShell pipeline has launched it, and failed starts are now cleaned up. This host-specific launch gap is not resolved. |
| Experience review | One prior fresh-context Astra pass rated pre-repair `96f7d81` needs revision. A prior focused repair replay and retry hit usage limits before judgment; the owned browser was stopped. The new fresh-context Astra completed tutorial and Level 1 on exact `38e88f1` through GUI clicks, movement and camera drag. Its immutable cold report (`artifacts/verify-96/artifacts/cold-gui-world-retry/COLD-REPORT.md`) and separate warm report (`WARM-COMPARISON.md`) find a clear but mostly stationary panel-driven game, weakly discriminating transfer, crowded phone focal hierarchy and muted ending. Scores: story 6, art/world 6, gameplay 6, observed controls 7, tutorial 7, chapter/agency 5, learning 5, phone presentation 4; physicality, continuous prologue motion and audio unassessed. This is a `needs_revision` review, not schema-v2 readiness. Native window attachment failed, so the reviewer used the documented live browser harness with inspected 390x844 PNGs and a preserved action trace; session stopped. |
| User acceptance | Not yet obtained; the user's earlier rejection remains the final human verdict. |

## Next gate

1. Have one fresh-context Astra reviewer play the exact new candidate cold
   before seeing design intent, then judge story, art/world, gameplay and
   learning separately against the observed opening, physicality, source
   choices, recovery, relay and local reply. Listen to audio and inspect motion
   where available; mark anything not observed unassessed.
2. Repair any blocking findings, repeat affected technical/presentation gates,
   then obtain a full critic record and
   user review. Merge reviewed development work into `main` when ready. No Level 2
   or deployment promotion before the existing review and user gates.
