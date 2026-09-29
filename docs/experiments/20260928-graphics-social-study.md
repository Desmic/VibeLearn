# Graphics study and bounded implementation

28 September 2026. Root Astra owns this graphics/art pass at the user's request;
Sol retains opening behavior, persistence and regression work. UF-07–11 remain
open. This is a source/worker study, not independent critic acceptance.

## Recent creator evidence

| Project / original source | What was actually checked | Useful technique / limit |
| --- | --- | --- |
| [Lagoon Tree Village, X, Sep 23](https://x.com/cryptomanavan/status/2102772685541347618), [live world](https://lagoon-tree-village.netlify.app/) | Read original post through browser; entered rendered world and attempted movement. Pointer-lock/pause interrupted traversal, so no completed play claim. | Layered foliage, architectural detail, shoreline and reflections make the setting inhabitable. Creator explicitly reports bugs/lag after seven hours; “AAA” is aspiration, not our finding. |
| [Summer Cycle, creator page](https://www.prasen.dev/projects), [live](https://starknightt.github.io/summer-cycle/), [source](https://github.com/StarKnightt/summer-cycle) | Entered ride, changed view, tapped steering, opened pause controls. Captured actual rendered road. September/Opus attribution is creator-reported. | Illustrated shapes/foliage coexist with cast shadows, reflective paddies and a continuous destination. Long initial load observed here; no full performance or gameplay review. |
| [Turbo Kart Rally, X, Sep 22](https://x.com/bridgemindai/status/2102451997395866021), [source](https://github.com/bridge-mind/turbo-kart-rally) | Read original X post and repository. Embedded X video unavailable; not played. | Source describes coordinated ownership and integration. Showcase model comparisons are claims, not measurements. Do not copy franchise characters. |
| [Dumpling Dell, Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wr4twl/opus_55_is_amazing_i_built_a_whole_cozy_pixel/), [play](https://dumpling-dell.pages.dev) | Read creator post and technical replies, not played. | Shared palette, common shading/outline rules and data-driven sprites enforce coherence; tactile collection and travel offer reasons to explore. First playable followed by iteration, not an independently verified one-shot result. |
| [Willowmere, Reddit, Sep 26](https://www.reddit.com/r/ClaudeAI/comments/1wqgl6b/opus_55_built_this_cozy_3d_pixel_art_game/) | Read creator discussion, not played. | Clear lighthouse/festival objective connects social activities and world repair. Depth/balance remain unverified; source not available in that post. |
| [Chainmate, Reddit, Sep 24](https://www.reddit.com/r/ClaudeAI/comments/1wp8uxb/i_gave_opus_55_four_reference_images_and_build/), [play](https://sneid1.itch.io/chainmate) | Read creator account, not played. | Four visual references followed by lighting feedback; meaningful visual upgrades and relic objects. Procedural geometry uses Godot; no engine migration is implied for us. |
| [Long Wind, source](https://github.com/jbang2004/long-wind) | Read build account, not played. | Art direction, generated environments and externally generated characters coexist; extended iteration and play repair matter. Code licensing does not automatically license all models. |

Discovery lists were navigation aids, not quality rankings. X posts failed in the
web reader but were readable through the in-app browser; media there was not
playable. No social posting, account access, downloads or external code execution.
Captures and X text observations: `artifacts/graphics-study-20260928/`.

## What changes now

Current local prologue capture still reads as a primitive blockout. Engine choice
does not explain that gap. Reuse PlayCanvas 2.22.1's existing geometry/material/
shadow facilities before inventing a renderer. Its StandardMaterial requires
`useMetalness` to activate authored metalness; our adapter did not set it. The
light adapter also discarded shadow tuning. See [engine lighting](https://developer.playcanvas.com/user-manual/graphics/lighting/)
and [light API](https://api.playcanvas.com/engine/classes/LightComponent.html);
implementation must be checked against the vendored version, not only latest docs.

Bounded first pass, within the approved opening design:

1. Shared validated, reusable geometry definitions for engine-generated forms;
   reuse mesh buffers across matching objects. Shared explicit material/shadow
   controls, with finite bounds and existing defaults preserved where unauthored.
2. Bellweather uses curved structural ribs, stepped ceramic surfaces, clustered
   foliage, purposeful inlays, a distant inhabited skyline and open sky. Preserve
   both interaction anchors, safe terrace footprint and future-destination meaning.
3. Warm key/cool fill, stable contact shadows and distinct matte/metal/water
   responses. No full-screen “comic” filter, extra simulated crowds or perpetual
   effects. Do not claim realistic physics from a prettier frame.
4. Verify current desktop/portrait views and both choices, collision/actor
   continuity, render lifecycle and cost. Then record limitations and hand the
   combined candidate to the existing single-reviewer gate. No Level 2 or promotion.

Observable success: the two choices and friends remain legible; receiver is a
distinct destination; the playable terrace has breathing room; lighting grounds
objects without stripes; shared rendering features work outside Bellweather.
Image-reference fidelity, overall quality and acceptable measured CPU/GPU cost
remain open until observed. More geometry or higher shadow resolution alone is
not success.

## Worker observations so far

- Implemented native shared mesh definitions, bounded deterministic 256px surface
  textures, explicit metalness, optional model material remapping, tunable shadow
  bias/distance/filter/cascades, and renderer draw/frame counters. Mesh sharing
  saves duplicate buffers; no batching or performance improvement is claimed.
- New garden composition uses the shared kit. Existing Quaternius character mesh
  and animation are reused with a ceramic/navy material palette; no model generator
  or new paid service. The original model asset and attribution remain intact.
- Root CUA: entered local disposable preview, inspected desktop, chose garden and
  observed its response, rewound/replayed, resized/reloaded at 390x844, then chose
  relay on desktop and observed its different response. Supporting captures are
  in `artifacts/graphics-study-20260928/`. This was an informed implementation
  check, not a cold critic or a complete journey review.
- Found phone choices cropped out, both after resizing and on fresh load. Sol
  repaired authored exploration framing, including paused resize. Root's fresh
  390x844 CUA recheck saw both choices and played the garden choice successfully;
  `bellweather-phone-after.png` records the response. Character crowding remains
  unresolved, and the response text covers the lower action on phone. These are
  open presentation/art defects, not excused by the framing repair.
- Build passed; 462 application tests passed with seven configured database
  skips. Focused render-style tests exercise invalid/unbounded input and an
  alternate observatory with different proportions and palette.
- Sol's full opening browser group passed, including garden branch, Warden cause,
  rupture, capability theft, tutorial handoff and replay preserving the draft.
  An unrelated orchard lifecycle test passed with two objects sharing one authored
  mesh/brush texture, active metalness, dispose/remount and no WebGL errors. These
  are bounded worker checks; recorded frame counters are not a CPU/GPU benchmark.
  The unrelated Harbor opening also passed preserved branch-overlay plus following
  timeline cues and paused desktop/portrait camera checks. Reports:
  `artifacts/first-words-opening-report.json`,
  `artifacts/opening-renderer-contract.json`, `artifacts/renderer-lifecycle.json`.
- The visual result is a first improvement, **not the reference realized**.
  Character design, organic detail, architectural variety and richer spatial
  lighting remain material gaps. Reflections are simple surface responses, not
  implemented scene reflection probes. No new physics capability is claimed.
  CPU/GPU cost, full journey browser groups, exact-candidate presentation checks
  and independent review remain pending; keep screenshots distinct from those
  claims. Root research/review tabs and disposable port-8051 preview are closed.

## Reuse audit and next art priorities

The bottleneck after this pass is authored visual content and composition, not
missing engine primitives. Do not keep adding cylinder towers and sphere crowns
and call it reference fidelity. The selected image has asymmetric architecture,
layered vegetation, strong graphic shadow masses, recognizable people/character
silhouettes and a large destination tree. Our draft does not yet supply that.

For the next asset pass, inspect a small selection from the creator's
[Quaternius Ultimate Stylized Nature pack](https://quaternius.com/packs/ultimatestylizednature.html)
(CC0; glTF and textured models) and [Kenney Nature Kit](https://kenney.nl/assets/nature-kit)
(CC0). Those licenses/formats were verified at their source pages; assets have
**not** been downloaded, budgeted or accepted for this game. Reuse suitable
foliage with deliberate palette/material treatment instead of building a larger
commodity tree generator. Pin selected assets through the existing vendor and
provenance flow; do not add the entire catalog to learner downloads.

Keep signature receiver architecture and composition original. Native PlayCanvas
materials, geometry and shadows were reused here; no custom engine, full-screen
filter, Blender installation or paid asset generation was introduced. The tiny
surface-pigment generator is bounded art data support, not a replacement for good
assets. Real reflection/bounce-light work must be chosen against measured cost,
not pursued merely because an engine API exists.

**Open renderer efficiency finding:** Source audit shows the adapter leaves
PlayCanvas automatic rendering enabled. Pausing its update/time does not itself
stop GPU redraw; sharing meshes does not solve this. The stronger shadow settings
also have a real rendering cost. A subsequent bounded renderer pass should verify
idle/paused draw counts and use the engine's `autoRender`/`renderNextFrame` support
with explicit invalidation for input, camera, resize, asset completion, story
patches, visible motion and animation transitions. Do not freeze legitimate motion
to improve a benchmark. This is a source finding/next experiment, not a measured
CPU reduction or a completed fix in this candidate.

Sol's single Intel D3D11 snapshot reported 693 entities / six shared meshes,
approximately 667 draw calls and 6.9ms frame active; paused approximately 667 /
7.1ms, CSS-hidden host approximately 652 / 27.8ms. These counters are not GPU
duration, utilization, thermal or battery measurements. They establish neither a
performance baseline nor a regression delta, but expose a large draw workload and
continued paused/hidden rendering that the next pass must address. Before adding
more content, consider batching compatible static scenery and stopping unnecessary
redraw; preserve animation and visible world responses. Both CPU and GPU cost need
measurement so work is not merely shifted between processors.
