# Graphics stack reassessment — 29 September 2026

The user challenges our visual output and iteration speed against Sky Reach,
reportedly built in about 2.5 hours with parallel agents. That duration is user
reported, not independently established here. Revisited the public listing and
live menu/credits: Three.js / WebGL is explicitly named, and the listing identifies
procedural generation. The earlier active surface-to-space play observations
remain in `20260928-sky-reach-play-study.md`; no new completion/performance claim.
Current credit capture: `artifacts/graphics-stack-20260929/sky-reach-credits.png`.
The reference tab was closed immediately after inspection.

## Judgment

Keep PlayCanvas as the current active backend, conditionally. Its documented
capabilities do not explain our current visual shortfall. Do not treat the
primitive-heavy authoring method or restrictive adapter surface as the product's
long-term graphics pipeline. Sky Reach is a quality/production-speed challenge,
not evidence that a library name alone causes its result. A migration decision
must compare visual quality, device cost and agent authoring/integration effort.
The product's learning/evidence/saves and review contracts remain independent.

## Current repository evidence

- `web/playcanvas-backend.js` pins PlayCanvas 2.22.1 and constructs `pc.Application`
  on its WebGL path. WebGPU is not currently enabled. Modern engine documentation
  describes explicit graphics-device/AppBase initialization for that path.
- The authored material path exposes simple colors, metalness/gloss and limited
  procedural textures. It does not wire environment-map illumination, lightmaps,
  instancing or an advanced post pipeline. Imported GLBs can retain their original
  materials unless named overrides replace them; that existing path should be
  used before adding a general material framework.
- Every primitive becomes a render component. It casts shadows by default unless
  opted out. The scene uses a 2048 shadow map with two cascades. Tiny robot parts
  are independent drawable objects; semantic anchors need not be drawable meshes.
- Static batching and demand-driven redraw already exist. They do not make active
  frame cost disappear or establish acceptable device performance.
- Frozen v18 report samples 543 draw calls / 50 batches. The earlier 363-call
  sample is not a controlled same-scene baseline. Neither establishes CPU/GPU
  utilization, frame latency, sustained heat or Sky Reach's relative efficiency.

## Capability and practical ceiling

PlayCanvas documents PBR, environment lighting, lightmaps, custom shaders,
post-processing, skinning, instancing and batching. These support a substantially
richer stylized world than our current scene. It is reasonable to target the
category of visual appeal demonstrated by Sky Reach; matching its implementation
or timing remains unproven. A beautiful district with coherent assets, depth,
grounded characters and believable lighting is an appropriate near-term target.

The practical ceiling is the weakest supported device's frame-time, memory,
download and thermal budget plus our content workflow. Large dynamic simulations,
heavy transparency/reflections and unrestricted high-end effects cannot all be
assumed affordable on ordinary mobile hardware. Procedural scale and GPU cost
are separate: what is generated, loaded and actually drawn must be budgeted.

Both engines offer a WebGPU path. It can reduce particular overheads and enable
compute work, but does not improve art direction, eliminate fill/shadow cost or
promise lower power. PlayCanvas currently labels WebGPU beta; Three.js describes
its newer renderer as experimental, with material/post-processing migration work
and cases where the WebGL renderer still performs better.

## Recommended next decision, not a migration authorization

1. Make one representative playable visual benchmark against the accepted graphic
   utopia reference, with an explicit art brief and named target device/resolution.
   Favor coherent textured/rigged meshes, selective shadows, environment/baked
   light and instanced repeated scenery over another round of small primitives.
   Preserve characters, interaction meaning and readable negative space.
2. Measure matched views/routes: median and slow-frame CPU/GPU timings where
   available, frame pacing, draw passes, triangles, texture memory, load time,
   sustained utilization and paused/background behavior. Record instrumentation
   limits. 60 fps is a 16.7 ms frame budget; 30 fps is 33.3 ms. These are proposed
   device-class targets, not measured guarantees or a universal draw-call quota.
3. Include agent development time and integration complexity. If native PlayCanvas
   capabilities cannot deliver a competitive result within the agreed effort,
   use a small isolated Three.js comparison with matched content/quality/device.
   Do not port the whole game or add simultaneous production backends to answer it.
4. Keep semantic object/learning IDs separate from rendered mesh count. Permit
   suitable engine-native assets/features behind small reviewed boundaries;
   extract reusable support after visual proof rather than letting today's schema
   force every generated game into the same toy geometry.

This recommendation preserves the architecture document's replaceable rendering
boundary. It supersedes the idea that adding more primitive detail is sufficient
progress toward the reference. User acceptance, cold art/world review and device
performance are still required; application tests prove none of those alone.

## Primary sources checked

- [Sky Reach listing](https://tesana.com/game/sky-reach), plus live credits.
- [PlayCanvas graphics](https://developer.playcanvas.com/user-manual/graphics/).
- [PlayCanvas optimization guidance](https://developer.playcanvas.com/user-manual/optimization/guidelines/): draw submission CPU overhead, shadow/pixel cost,
  batching, low-end-mobile rough 100–200-call guidance (not a hard limit).
- [Image-based lighting](https://developer.playcanvas.com/user-manual/graphics/physical-rendering/image-based-lighting/).
- [Runtime lightmaps](https://developer.playcanvas.com/user-manual/graphics/lighting/runtime-lightmaps/): static-light tradeoff; this baker does not provide full
  global-illumination baking.
- [Hardware instancing](https://developer.playcanvas.com/user-manual/graphics/advanced-rendering/hardware-instancing/).
- [Standalone initialization](https://developer.playcanvas.com/user-manual/engine/standalone/).
- [Three.js WebGPU renderer](https://threejs.org/manual/pages/webgpurenderer).

No runtime edit, engine switch, new test workload, deployment or new critic record
was made for this research/advice request.
