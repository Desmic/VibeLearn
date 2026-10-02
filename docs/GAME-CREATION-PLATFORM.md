# VibeLearn game-creation platform — product direction

> **Partly historical (3 Oct 2026).** The principles still apply to the current game (`experiments/bellweather-arcade`, see "Current direction" in `AGENTS.md`); the tools, gates, engine and story details named here are from the earlier PlayCanvas game.


**System-first correction — 21 September 2026:** The user rejects the current
learning progression and detached gameplay HUD/guidance. Repair the learning and
interaction design boundary before game implementation. Follow `LEARNING-DESIGN-GATE.md`: exact-design
review before prototyping, native GUI alignment before release. The current runtime
is not compliant; screenshots, test passes and deployment do not imply acceptance.
Motion/audio remain deferred; no Level 2 or automatic deployment.

**Design reference — 20 September 2026:** Apply `LIVING-WORLD-DESIGN.md`: curiosity,
embodiment, visible purpose, attachment, agency, coherent beauty and payoff. These
are general design/review principles, not a requirement for high-end graphics or
a particular genre. Motion/audio review remains deferred under `STATE.md`.

**Current platform checkpoint — 19 September 2026:** The current proof candidate is `471de882a01690fa50ac39455ad603fffd39cfdc` with exact run `35440122451`. Phase 0 of the thin Terminal PM adapter is **implemented and merged**, not merely a future target; live Phase 1 integration remains blocked by Terminal PM's own `live_run_authorized=false` policy. The next proof obligation is independent critic execution + human review, not broader generator/orchestrator expansion.

**Active product direction — 17 September 2026.** The primary product is learner-facing: a learner requests a goal and VibeLearn creates a personalized game on demand. This supersedes a creator-operated studio as the first customer experience. Read with `LEARNER-ON-DEMAND-AND-REPAIR.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `GAME-RUNTIME-ARCHITECTURE.md`, `GAME-AS-COURSE.md`, `GAME-OPENING-PROGRESSION.md`, `ART-WORLD-DIRECTION-CRITIC.md`, `CRITIC-POLICY.md` and `STATE.md`.

## North star

VibeLearn is a **learner-facing platform for creating personalized, high-quality learning games on demand**, not a single game or an authoring tool the learner must operate.

An internal creator/review workbench supports production and diagnosis. The learner should be able to describe what they want to learn, shape the experience conversationally, play, resume and request improvements without configuring scenes, repositories or deployments.

The current How-LLMs-Work track is the proof case. Its purpose is to prove that the product can combine:

- compelling game feel and story;
- rigorous learning mechanics;
- reusable world/runtime primitives;
- reusable assets and archetypes;
- fast iteration and deployment;
- evidence-aware assessment;
- critic/review loops that catch product failures before a learner sees them.

Do not broaden into a universal generation product before the current proof track is genuinely good. Build its useful boundaries now and verify reuse with small different fixtures. One excellent authored game alone does not establish on-demand personalization: a later bounded learner-facing slice must prove request -> personalized design -> verified playable release. Avoid both premature universal-engine work and hard-coding the proof track as the platform.

## Learner journey and personalization

The primary journey is `learning request -> relevant learner context and explicit preferences -> personalized brief -> assembly and verification -> play -> resume/adapt`.

Personalization includes practice depth, prerequisites, scaffolding, pacing, mechanic fit and creative direction, not just names or colors. Keep confirmed preferences, inferred assumptions and unknowns distinct. Ask only useful clarifying questions and support a bounded 'surprise me' route. Preserve durable learner evidence independently of story or package replacement.

Recommended delivery is a coherent verified first playable segment, with further generation at safe boundaries; this is not a promise of instant generation or permission to expose unfinished scenes. Exact generation budgets and first-playable size remain open. See `LEARNER-ON-DEMAND-AND-REPAIR.md` for the owning contract.

## What should be reusable

A future game should be assembled mostly from versioned specs, assets and mechanics rather than fresh renderer/application code.

Reusable layers should include:

- world/environment kits and configurable layout templates;
- character rigs, animation sets and control profiles;
- player-embodiment modes: direct protagonist control, separate avatar, external guide, cursor/strategy control, etc.;
- cinematic/story beats such as reveal, arrival, interruption, teleport, threat, rescue, reunion and payoff;
- lighting/weather/atmosphere state transitions;
- cameras, transitions and focus rules;
- doors, gates, rooms, bridges, lifts, routes and traversal primitives;
- interaction, collection, scanning, repairing, building, choosing, sequencing, prediction and inspection mechanics;
- tutorial/scaffolding patterns;
- progression/recovery/replay/save semantics;
- HUD/input/accessibility patterns;
- sound/music cue lifecycle;
- assessment/evidence adapters independent of the fiction;
- CI/browser/critic evidence templates.

Reusable does **not** mean visually identical. A world kit must expose composition, spacing, scale, density, material, lighting and dressing parameters so multiple games can feel materially different.

The September 28 graphics experiment adds optional WorldSpec `geometries` and
`textures` dictionaries, material references and bounded shadow controls. The
PlayCanvas adapter uses native geometry and StandardMaterial; it shares geometry
buffers and creates deterministic surface textures once, rather than adding a
per-frame painting effect. Asset `materialOverrides` maps source material names
to world material IDs without changing the original model or animation. Existing
primitive/asset authoring remains valid. Geometry sharing is **not** draw-call
batching or proof of lower GPU cost.

`garden-world-kit.js` holds configurable forms; `bellweather-garden.js` supplies
this game's composition/palette. An alternate observatory composition exercises
the contract in `tests/test_render_style_contract.py`. This proves an authoring
boundary, not a second independently reviewed game. Texture count/size, mesh
subdivisions and shadow resolution are bounded; real frame/CPU/GPU cost and phone
readability remain candidate gates. See the [creator study and implementation
record](experiments/20260928-graphics-social-study.md).

## Player embodiment must be explicit

Never infer a literal player avatar because the story says “you help X.” `GameDesignSpec` / `RuntimeExperienceSpec` must explicitly declare who the player controls and how the player exists in the fiction.

For the current LLM rescue proof track, the revised direction is **direct protagonist control**: the player controls the robot protagonist itself. There is no separate literal helper character unless a later design explicitly requires one.

This distinction must be visible in story, camera, controls, dialogue and tutorial design.

## Spatial-composition contract

The September 17 review found the current play area congested: the same content would feel substantially better if distributed over a larger footprint.

Future world generation therefore needs explicit spatial parameters and review:

- playable-area scale;
- prop/character density;
- minimum negative-space budget around focal interactions;
- landmark spacing;
- path width and traversal breathing room;
- camera collision/occlusion margin;
- phone and desktop composition budgets;
- maximum concurrent focal objects;
- alternate-camera intersection/occlusion checks.

Do not respond to visual weakness by adding more props. Larger, calmer space is often the higher-quality choice.

## Story and cultural inspiration

Story ideation should actively learn from games, films, animation, literature, mythology and contemporary culture. Extract techniques—character hooks, reversals, silhouettes, pacing, humor, naming rhythm, visual motifs—not copies.

Pop-culture-informed naming and jokes may be explored during ideation. For example, a playful robot name with the recognizability of a “Wall-G”-style homage can be considered as a creative direction, but shipping characters, names, designs, dialogue, music and assets should remain original and should not depend on confusing similarity to an existing property.

References are optional reward layers. A learner who recognizes none of them must still understand the story and play.

## Art/world direction is a separate product discipline

A technically correct WorldSpec can still produce a bad place. Every serious candidate requires an **art/world-direction critic** in addition to story, gameplay and learning critics.

That critic owns spatial composition, scale, negative space, silhouettes, visual hierarchy, palette/material cohesion, landmark readability, world density, prop placement, clipping/intersection, camera framing, environmental storytelling, atmosphere and whether reusable assets look intentionally composed rather than procedurally dumped.

See `ART-WORLD-DIRECTION-CRITIC.md`.

## Conversational improvement — future capability

A learner can flag an issue or request a change through chat from the experience itself. The agent must inspect the reported version and context, investigate, decide whether a change is appropriate, make an isolated change when justified, verify the original problem and regressions, then apply it safely and report the result.

This is a full repair loop, not merely a feedback inbox and not blind obedience to a requested patch. Personal preferences, accessibility problems, actual defects, intentional challenge and uncertain reports need different responses. A subjective complaint is still real feedback; a missing reproduction is not grounds to dismiss it.

Scope personal changes separately from shared assets/mechanics/runtime. Protect active saves and assessment history; report chat is not permission to reset progress or change everyone else's game. Autonomy thresholds are a proposed policy to agree, not blanket deployment permission. `LEARNER-ON-DEMAND-AND-REPAIR.md` owns detailed context, judgment, verification and rollout requirements.

## Automated agent system — approved bounded integration

The platform should eventually support coordinated agents for:

- research/source gathering;
- game/story ideation;
- narrative design;
- art/world direction;
- game/mechanic design;
- learning design;
- implementation/world compilation;
- asset selection/generation;
- story critic;
- art/world critic;
- gameplay critic;
- learning/transfer critic;
- test generation;
- CI/CD/release orchestration;
- learner-facing issue triage and verified repair.

Agents must communicate through versioned artifacts/specs and evidence, not hidden assumptions. A creator agent must not self-certify its own work. Critic agents are internal tools, not substitutes for the user's product judgment. One learner-facing conversation may route to specialists without forcing the learner to choose a developer or critic agent.

The orchestration foundation is now an **approved contract-integration target** with the existing Terminal PM Agent, which remains under active development as a separate external orchestrator. See `AUTOMATED-DEVELOPMENT-SYSTEM.md`. Do not implement the role list above as a fleet of permanent agent types: ordinary work should default to one economical worker and one independent reviewer, with reviewer claims implicitly requiring attempted proof/reproduction. Story, art/world, gameplay and learning remain separate evaluation disciplines over shared evidence semantics. VibeLearn should define a thin versioned adapter and outcome/evaluation boundary, not copy Terminal PM Agent's moving execution/session/verifier/recovery internals. Deeper code-level reuse is deferred until the relevant orchestrator boundary is stable or real integration evidence shows the external contract is insufficient. Internal automation remains subordinate to the learner-facing product and does not authorize autonomous production deployment.

## Current proof-track gate

The current track should prove this sequence:

`learning goal -> researched story/world ideation -> art/world direction -> game design -> reusable spec/world assembly -> playable prologue -> separate tutorial -> Level 1 -> technical CI -> story critic -> art/world critic -> game critic -> learning critic -> user review`

A failure in one discipline is not averaged away by strength in another. The private proof's explicit user review remains required. How routine personalized releases will be approved at scale is a later release-policy decision, not a requirement that every learner operate a studio.

## Extraction rule

After each accepted chunk, ask:

1. What was story-specific and should remain data?
2. What mechanic/runtime capability is reusable?
3. What asset/archetype can be parameterized?
4. What critic/test should become a platform invariant?
5. Can the same reusable piece create a materially different game/world without copying this track's nouns or layout?

Extract only capabilities proven useful by real game needs. Avoid speculative framework growth.


## Narration capability

The game-creation platform should support narration as a replaceable presentation
capability, not as a mandatory global style.

A generated game's design/runtime spec should be able to declare whether it uses:
- no narrator;
- text narration;
- narrator voice with synchronized text/subtitles.

Narrator voice is especially appropriate to consider for opening scenes,
transitions and major events, but the creative/story agent must choose it based
on the game's tone, audience and pacing rather than applying it mechanically.

The current LLM proof track stays on text narration during this review. Future
voice support should preserve:
- accessibility/subtitle parity;
- muted-play comprehension;
- provider/model/TTS independence;
- separate preferences/volume where needed;
- deterministic canonical story text independent of synthesized performance.

Voice narration does not relax the visual-storytelling contract. Generated worlds
must still communicate setting, activity, action and consequence through their
own visuals and motion.

## Evidence-first quality system

### Rendering cost and asset reuse checkpoint — 28 September

WorldSpec can opt immutable primitive/geometry leaves into named native static
`batchGroups`; the package, not the renderer's guess about appearance, owns that
decision. Animated entities and imported containers remain separate. Parent
visibility/transform changes invalidate affected groups; unrelated moving actors
must not force all scenery to rebuild. Shared draw scheduling skips hidden and
paused steady redraw, with explicit invalidation on observable changes. Preserve
input, animation, resize, asset completion and context recovery in real play.

Measure the actual intended runtime state. A raw world definition can include
normally hidden levels and is not equivalent to the player's opening. Draw calls,
frame submission, CPU utilization and GPU utilization are different evidence;
do not turn one into an unsupported claim about the others.

Prefer small selected licensed assets, pinned by provenance and content hashes,
over new commodity generators. The three selected Kenney foliage models are an
example, not a required global art style. Material remapping and world composition
remain per-package choices. See the bounded
[art/cost experiment](experiments/20260928-opening-art-and-cost.md).

### Access regressions and candidate assets — 28 September

Replacing a world action must preserve keyboard focus on a stable, usable owner,
including when the next action is temporarily unavailable during a world response.
Test keyboard-only continuation and escape, pending actions through pause/resize,
and replay exits against authoritative saved state. A second, unrelated world
fixture proves the contract independently of the current story.

Marker placement must use a footprint that does not change merely because its
position changes. Observe real text-size changes to invalidate cached fitting;
do not add per-frame geometry reads to fix an accessibility defect. At enlarged
text, check the full visible meaning and action reachability in each relevant
presentation phase. Do not lower font size, clip meaning or clear a held sentence
just to pass an area budget. Concise authored wording must still preserve cause,
choice and character intent; it cannot substitute for a shared layout repair.

Candidate identity includes delivered model/texture/license bytes and the pinned
vendor recipe, not just the URL in WorldSpec. Tests establish integrity and routes;
actual play establishes visual suitability. See the
[composition/access checkpoint](experiments/20260928-world-composition.md).

### Optional companion form and pose kit — 29 September

`companionRobot` accepts an opt-in material `shell` and `solid` torso. The old
default remains available. Shape proportions, palette, location and solidity are
package decisions; a character role does not impose a global theme or body.
`companionPose` composes connected shoulder/elbow/hand segments as ordinary
WorldSpec transforms. Static route poses therefore use existing replay/state
handling without a new animation solver or controller. Stable head/hand anchors
remain usable by labels, speech and authored interactions.

An unrelated observatory fixture checks hierarchy, distinct proportions and
rotated segment endpoints using the engine's own rotation math. This demonstrates
bounded kit reuse, not a universal character generator. Native play must still
check form, contact, camera readability and the cost of added parts. Existing
licensed characters are preferred when their silhouette, style and rig fit;
duplicating a protagonist or adopting an unsuitable costume is not useful reuse.
See the [companion checkpoint](experiments/20260928-companion-art.md).

### Existing experience evidence requirements

The opening controller now supports optional, package-authored
`choice.inspection`: a named world target/anchor, camera/world patch, short result
and optional marker replacement. A committed response holds until that target is
inspected; generic progression cannot consume it. Previous retains the inspection,
while replay clears it. Games that need no inspection retain their existing flow.
Required projected actions use shared safe-area placement and directional cues
through camera movement, including a distinct behind-camera cue. Neither feature
contains Bellweather route names or geometry. A separate Harbor fixture exercises
the contract; current verification is recorded in the
[receiver-discovery experiment](experiments/20260928-receiver-discovery.md).

This is a bounded interaction capability, not a general discovery generator.
Content must still make the revealed place meaningful, and critics must verify
that an unfamiliar player notices and understands it. A persistent button or an
extra Look step alone cannot establish that outcome.

`EXPERIENCE-QUALITY-SYSTEM.md` is a first-class platform contract.

The [offline asset-corpus pilot](experiments/20260929-asset-corpus-pilot.md)
implements role/style/importance/budget selection of pinned local candidates.
License and integrity checks do not establish art suitability. External mesh
buffers and textures are part of the selected package and its byte budget.
Unmet requests fail explicitly; no implicit generation or style substitution.
The current native comparison rejected a cheap stock kit for Bellweather's
foreground, illustrating why source approval and art approval remain separate.

Future game creation should produce reviewable artifacts/specs for:
- cold-start comprehension;
- major-event causality;
- semantic-object readability;
- animation direction;
- physicality/collision;
- mode transitions/handoffs;
- tutorial steps;
- learning/transfer.

The platform should prevent structurally invalid experiences where feasible
(schema/runtime constraints), then use independent critics for judgment/taste.
Do not encode every current-game failure as a special case; extract the reusable
contract and prove it in this game plus later materially different games.

### Source-based art production evidence — 29 September

The [isolated source-based trial](experiments/20260929-bellweather-source-trial.md)
reproduced and reused a licensed rendering baseline, but failed its original-world
art target after two substantial revisions. It is frozen, not a reusable approved
world kit. Shader reuse proved useful; a production engine migration did not.

For subsequent style-family work, assess geometry, shader palette behavior,
lighting, camera framing and placement together. Require the affected world
object to be visible in the supported interaction views; an unclipped prompt is
insufficient. Keep guided arrival separate from meaningful player activation,
and verify that reachable destinations and companion responses match the design.
These requirements are game agnostic; the trial's palette, characters and
promenade are not platform defaults. Record device-specific render cost alongside
visual evidence, without treating desktop frame rate as phone support or CPU
utilization. Change the production method when the art gate fails; do not extract
a general generator or extend content to disguise an unsuccessful composition.

### Authoring-to-runtime checks — 29 September

Conditioning must declare what may change. A UV/occlusion-only operation should
preserve exported geometry/normals; matching bounds can conceal lost triangles.
The [conditioning comparison](experiments/20260929-existing-asset-lighting.md)
uses a separate bake proxy and transfers UVs back to originals after welding
failed that invariant. Existing textured assets need preserved UVs or deliberate
reprojection. Do not route them through an untextured-asset conditioner silently.
Intentional decimation/retopology requires different, explicitly scoped checks.

The [live Blender experiment](experiments/20260929-live-blender-atelier.md)
found inward normals that appeared acceptable in a modeling viewport but caused
faulty shading in the game. Retain editable source, transformation/export steps,
asset hashes, provenance and collision dimensions together. For authored closed
solids check finite geometry and consistent outward orientation after modifiers;
open/two-sided surfaces require their own intended-sidedness check. Inspect
exported materials under target-engine lighting before tuning lights to conceal
geometry errors. Validate collision bounds against the visible low geometry.

A camera that frames an architectural landmark can still hide the protagonist
after turning back. Check arrival, approach, reverse and narrow-screen views with
the actual character body and foreground obstacles. Head/pivot clearance alone
does not establish full-body readability. Keep matched comparisons, preserve
failed views, and separate engineering passes from art acceptance. Blender/MCP
is an optional authoring route, not a mandatory platform dependency or permission
for paid generation. Only extract reusable runtime machinery when repeated use
justifies it; current work supplies a concrete source/export/verification packet.

Render batching and spatial-query organization are different concerns. The live
Blender facade reduced render submissions while worsening camera-raycast frame
time near walls. Retain bounded camera/collision proxies or an appropriate
spatial acceleration structure when merging visible geometry. Measure both
ordinary traversal and obstruction recovery; unchanged rendered geometry helps
distinguish a camera-query repair from reducing visual quality. Frame pacing
alone still cannot establish CPU/GPU utilization or actual-device coverage.

The subsequent [depth refinement](experiments/20260929-atelier-depth.md) adds two
further checks. Validate the serialized asset as well as editable source: joined
or triangulated exports can introduce collapsed triangles or merge coincident
vertices from separate parts. Record numerical tolerances and distinguish an
intentional intersection from a broken closed surface. Keep cleanup on temporary
export copies and recheck the exported result rather than trusting source QA.

For static camera obstacles, conservative world bounds can reject irrelevant
objects before an exact raycast. Compare retained hits against full queries on
actual asset geometry, then check live camera recovery. This optimization needs
bounds invalidation if objects later move; it is not a dynamic-world guarantee.
When a window should reveal depth, inspect real parallax at play distance and
oblique angles. A low-cost alpha pane with modeled contents is a valid visual
choice; record its optical and shadow limitations instead of claiming refraction.

Before replacing an asset for looking too dark or flat, inspect its material-role
balance under the intended light rig. Preserve a switchable control and changed
camera views. The [ceramic comparison](experiments/20260929-ceramic-material.md)
improves legibility using existing geometry but does not establish the target art
quality. Palette/light profiles are world-specific data; they must not become
hard-coded learning semantics or a universal style for generated games.

For a silhouette edit, declare invariant gameplay geometry separately from the
parts allowed to change. The [swept-portal study](experiments/20260929-swept-portal.md)
preserves low contact geometry while updating the visible upper shape, camera
mesh and local shading. Reuse is conditional on exported checks and the asset's
fit with neighbouring forms; unchanged triangle count alone is insufficient.

Check triangulation after export even when the editable source is manifold.
The [portal repair](experiments/20260929-portal-repair.md) found that closed n-gons
generated collapsed triangles. Bound cleanup by an explicit spatial tolerance,
preserve UVs and validate the exported shells. A displacement bound is not a
complete surface-quality proof; combine it with in-engine comparison/contact.

When optimizing camera collision, measure camera/query CPU time separately from
frame pacing. Static orbit results may be cached only with all solver inputs and
an explicit obstacle revision; retain any safety query that depends on the
interpolating camera position. Require cached/uncached pose agreement and
invalidation checks. The portal trial reduces repeated CPU raycasts but does not
establish a frame-rate or GPU-utilization improvement.

Character asset reviews must include normal player-camera scale and rear/side
views under the target lighting, not only a frontal model showcase. Check the
visible body against grounding/collision dimensions and measure runtime cost.
The [courier study](experiments/20260929-courier-character.md) batches a static
pose by material; articulated assets must retain joint/rig boundaries instead.
Keep style choices in the asset profile, independent of learning semantics.
