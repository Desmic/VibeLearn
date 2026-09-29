# How recent model-built browser worlds achieve their visuals

29 September 2026. User requests deeper investigation of actual public code behind
Opus 5.5 showcases, especially Three.js/WebGL and Sky Reach. This extends and
corrects the earlier social/engine/asset studies; it is research, not a renderer
migration or a new visual acceptance record.

## Decision

**The next visual experiment should test richer procedural form and art-directed
rendering together. More asset acquisition alone is not an adequate response.**
The inspected projects contain substantial geometry, material, lighting and
visibility logic. Their result does not follow from importing Three.js, but our
restricted authoring surface also prevents us from trying much of that logic.
Do not defend the present adapter on the basis that its underlying engine could
theoretically do more. Give a bounded visual prototype access to the relevant
native rendering facilities, then extract only capabilities demonstrated useful.

This does not prove that model capability is irrelevant. These are not controlled
same-prompt, same-budget, same-starting-code model comparisons. Nor does it prove
that imported assets or Blender are necessary: several source examples construct
their principal visuals directly in code.

## Source coverage and attribution

| Project | Evidence inspected | Attribution and limitations |
| --- | --- | --- |
| [Voxel Musou](https://github.com/mike007jd/voxel-musou/tree/ed4e2d8b4817d2c42f03cd43d043e025ebd78045) | Actual geometry, crowd, terrain, lights and post-processing source; repository history and MIT license | [Creator's 24 September account](https://bubucn.com/en/ai-model-evals/voxel-musou) credits Opus 5.5, 13 implementation parts and four builder/critic rounds against game footage. Inspected current commit `ed4e2d8b4817d2c42f03cd43d043e025ebd78045`; history includes subsequent changes. Neither one-shot nor a timed controlled result. |
| [Tidewater](https://github.com/dgreenheck/tidewater/tree/4811ba48d795197de5621985f404e765c0b7c0ef) | Actual original Three.js vegetation source, current native WebGPU source, migration document, credits and commit history | Opus 5.5 co-author metadata and creator description. Original commit `fd6cae6fa57343d344e5c008e1abda974c824b86` uses **Three.js WebGPU/TSL**, not WebGL. Current `4811ba48d795197de5621985f404e765c0b7c0ef` uses a custom WebGPU/WGSL engine. Do not cite this as a cheap vanilla-WebGL benchmark. |
| [Sakura Crossing](https://github.com/Kenton-GMI/sakura-crossing/tree/de01898e89c7f6ab3fad93fa802f0f5ac66fbd81) | Actual canopy, toon, outline and post-processing code, README, license and commit metadata | Useful stylistic comparator, **not verified as a recent Opus 5.5 build**. Discovery sites made that association; inspected README lacks it, source uses WebGL, and public commit metadata is 29 July. Exclude it from model-performance evidence. |
| [Summer Cycle](https://github.com/StarKnightt/summer-cycle/tree/8b977baad061e797c2f6c19cfcf07c1e79b23a67) | [Sol's pinned source audit](20260929-summer-cycle-source-audit.md), with root inspection of material specialization | Three.js/WebGL. Repository describes AI builders/critics without naming the model; the [creator's project page](https://www.prasen.dev/projects) identifies Opus 5.5. Attribution is creator-reported, not a run transcript. Reported FPS is not our measurement. |
| [Sky Reach](https://tesana.com/game/sky-reach) | Earlier active surface-to-space play; current listing, player address and public script URL | No public source-repository link found in the listing or focused GitHub search. Located served bundle but could not read it through permitted tools. No source-level claim about its terrain or shaders. |

No downloaded repository was executed, dependency installed or renderer benchmark
run for this study. Source review cannot establish visual quality, thermal cost,
actual frame rate, full playability or novice learning. The existing Sky Reach
play study remains the source of our firsthand observations.

[Turbo Kart Rally](https://github.com/bridge-mind/turbo-kart-rally) is an additional
public-source lead whose README describes five agents with separate file ownership
and integration playtesting. It was not deeply audited in this pass and is not
counted as an additional source-verified rendering comparison.

## What the source actually does

### 1. Geometry is organized around recognizable form and rendering cost

Voxel Musou's [voxel builder](https://github.com/mike007jd/voxel-musou/blob/ed4e2d8b4817d2c42f03cd43d043e025ebd78045/src/core/voxel.js#L17)
constructs combined vertex-colored geometry and omits internal voxel faces.
The [crowd renderer](https://github.com/mike007jd/voxel-musou/blob/ed4e2d8b4817d2c42f03cd43d043e025ebd78045/src/crowd/view.js#L373)
groups repeated body parts into instanced draws, uses distance-dependent detail,
and shares instance transforms with much simpler shadow shapes. Decorative
detail does not require one scene entity and shadow caster per small block.

Tidewater's original [plant geometry](https://github.com/dgreenheck/tidewater/blob/fd6cae6fa57343d344e5c008e1abda974c824b86/src/world/vegetation/PlantGeometry.js#L74)
constructs curved fronds with droop, curl and side leaflets. Trunk and crown parts
can be combined into one plant geometry. This is procedural botanical structure,
not a generic sphere with a green material. Current
[vegetation detail selection](https://github.com/dgreenheck/tidewater/blob/4811ba48d795197de5621985f404e765c0b7c0ef/src/world/vegetation/InstanceLOD.js#L1)
queries nearby plants using a spatial grid, refreshes buffers after sufficient
camera movement and uses cheaper distant representations.

Sakura's [tree builder](https://github.com/Kenton-GMI/sakura-crossing/blob/de01898e89c7f6ab3fad93fa802f0f5ac66fbd81/src/world/trees.js#L69)
is especially relevant to our canopy: limbs and forks establish growth, many
smaller clusters form the crown, and three height-biased tones establish internal
shape. Wood is merged; blossom clusters are instanced by tone. Species change
branching and hanging structure, not just color. It is an example of how simple
geometry can work when its organization and shading are designed together—not
an endorsement of copying this exact tree into Bellweather.

### 2. The material model carries much of the style

Sakura's [toon materials](https://github.com/Kenton-GMI/sakura-crossing/blob/de01898e89c7f6ab3fad93fa802f0f5ac66fbd81/src/core/toon.js#L15)
use discrete lighting ramps and hue-shifted shade. Blossom has a brighter ramp;
the canopy casts ground shadows but deliberately does not receive self-shadows.
That is an art choice with a realism tradeoff, not physically correct illumination
or a recipe we should apply indiscriminately. Its
[depth-based line pass](https://github.com/Kenton-GMI/sakura-crossing/blob/de01898e89c7f6ab3fad93fa802f0f5ac66fbd81/src/core/post.js#L68)
fades distant contours so the background stays quieter. Selected hero props also
use expanded back-facing shells for stronger contours. Surface shading and
object form precede the final color treatment; a halftone overlay is not equivalent.

For the more realistic end, Tidewater's original
[vegetation material](https://github.com/dgreenheck/tidewater/blob/fd6cae6fa57343d344e5c008e1abda974c824b86/src/world/vegetation/VegMaterials.js#L29)
has a leaf-transmission response to backlighting and part-specific bark/leaf
logic. Current [ground-bounce lighting](https://github.com/dgreenheck/tidewater/blob/4811ba48d795197de5621985f404e765c0b7c0ef/src/materials/GroundBounce.js)
derives a coarse light contribution from the surrounding terrain. These explain
specific visual mechanisms; they do not establish that we should copy its custom
engine or run its full effects stack on phones.

### 3. Atmosphere and post-processing are selective, budgeted tools

Summer Cycle is the closest **verified WebGL source** comparator for our
illustrated style. Its [material specialization](https://github.com/StarKnightt/summer-cycle/blob/8b977baad061e797c2f6c19cfcf07c1e79b23a67/src/render/materials.ts#L703)
scans geometry's material IDs and compiles only the relevant surface branches.
The implementation combines surface-specific brush patterns, cel lighting and
rim control, rather than making every object run one enormous all-purpose shader.
Its [lighting passes](https://github.com/StarKnightt/summer-cycle/blob/8b977baad061e797c2f6c19cfcf07c1e79b23a67/src/render/lightpasses.ts#L75)
include selective reflected scenery for flooded paddies. Seeded chunks follow
authored road/village composition; repeated foliage is instanced, static
structures merged and distant trees simplified. See Sol's audit for per-file
evidence and the important absence of a mobile quality mode. This strengthens
the case for a small material-specific rendering trial now, rather than another
generic-material pass followed by a cosmetic image filter.

Voxel Musou's [lighting](https://github.com/mike007jd/voxel-musou/blob/ed4e2d8b4817d2c42f03cd43d043e025ebd78045/src/world/world.js#L41)
combines warm key/rim light and a different sky/ground fill. Its shadow camera
follows the relevant area and snaps to shadow texels. Its
[post pipeline](https://github.com/mike007jd/voxel-musou/blob/ed4e2d8b4817d2c42f03cd43d043e025ebd78045/src/post/post.js#L205)
uses HDR targets, depth-aware atmosphere, selective bloom and cheaper half-size
targets for some effects. It skips sun rays when the sun is out of view and
reduces multisample quality under sustained slow frames. The implementation
counts slow frames; a comment's “2 seconds” is not a precise time guarantee.

We should learn selective passes, compilation warm-up and quality tiers. Heavy
depth of field is not automatically appropriate for a learning game where objects
and evidence must remain legible. Likewise, turning up every shadow or adding
full-screen effects without measuring cost is not the lesson.

### 4. Authoring and criticism are iterative, even when the initial prompt is short

The Voxel Musou creator reports structured implementation plus repeated criticism.
Tidewater history records a Three.js-to-native-WebGPU port and many later
rendering/antialiasing fixes. Public release timestamps do not reveal the total
private development time or token budget. “One prompt” describes user input;
it does not establish one model pass, no tools, no subagents or no revisions.

Sky Reach's [linked creator post](https://www.reddit.com/r/aigamedev/comments/1wrstzo/i_remade_no_mans_sky_with_opus_55_threejs_on/)
claims a first-output result in roughly 40 minutes and says the character is an
imported 3D model. This differs from the earlier user-reported 2.5-hour duration.
Neither duration was independently verified, and post/build identity may differ.
The current public player is
`play.tesana.ai/game-20260927-b815915b/1c5be615d958/`, with module
`_app/index-C9mwO3FQ.js`. Direct HTTP retrieval returned 403; browser navigation to
the script was blocked. We stopped there and closed the rendering tab. Public
delivery alone would not establish a reuse license even if the code were readable.

## What this changes for VibeLearn

Current `web/playcanvas-backend.js` exposes standard material parameters, a small
surface-texture generator and cone/cylinder/sphere/torus geometry definitions.
It does support imported models and static batching; those gains should remain.
But shared mesh buffers are not hardware instancing, and generic gloss/color is
not a designed foliage/ceramic/water shading system. `garden-world-kit.js` still
constructs its small canopy from five broad sphere-derived crowns. These are
specific limitations of our implementation, not proven PlayCanvas limitations.

Revised bounded next step:

1. **One composition, three views.** Use the accepted utopia reference to define
   arrival, near-canopy and reverse views, including paths, characters and the
   visible destination. Prove beauty and readability across those views before
   adding a larger district.
2. **Design form and shading together.** Trial richer branching/cluster placement,
   graphic hue/value control with credible contact and light response, and
   architecture with meaningful surface variation. Reuse licensed geometry or
   procedural techniques where they fit. Blender is conditional, not a gate.
3. **Allow a narrow engine-native experiment outside today's restrictive schema.**
   Keep gameplay/learning IDs stable. Do not first create a universal shader graph
   or expand every canonical spec field. Once the scene proves useful, expose
   the smallest versioned material/mesh/instance boundary needed for another style.
4. **Measure what we actually draw.** Include repeated geometry, shadow cost,
   transparency and warm-up, plus frame pacing and sustained device behavior.
   Use real instancing/merged geometry and distance tiers when repetition warrants
   them; do not infer savings from lower triangle count alone.
5. **Keep engine choice falsifiable.** If achieving the same bounded appearance
   through PlayCanvas takes materially more work or device cost, compare a
   separate Three.js scene with matched content and settings. The learning,
   persistence and critic contracts remain reusable either way. No production
   migration is authorized by this research.

The system improvement is a better **world-realization workflow**: an art brief
can select a procedural builder, curated asset, material profile and engine-native
feature rather than being flattened into basic primitives. Pin seeds and source
versions, preserve provenance and independently judge the resulting experience.
This is consistent with v3's style-family, reuse-first and replaceable-renderer
boundaries. Reuse first must include useful code and techniques, not only mesh packs.

The preceding corpus pilot remains useful (11 focused tests passed), but its stock
tree rejection is not a reason to keep searching libraries indefinitely. Resolve
the visible scene first; then integrate, run the existing play/critic gates and
extract proven reusable support.
