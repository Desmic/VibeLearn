# Painted rendering look — 30 September 2026

Look-development sprint (step 1 and step 2 of the plan agreed with the user). It
changes **how** the scene is rendered, not its layout. It's an optional flag, so the
existing comparisons stay as they were.

## How to view

Append `&render=painted` to the current candidate URL:

`http://127.0.0.1:8062/?study=facade&portal=crafted&architecture=atelier&finish=daylight&palette=ceramic&form=swept-clean&character=courier&look=sunlit&setting=city&districts=terraces&surface=illustrated&render=painted`

Toggles for A/B testing: `&paintpost=0` turns off bloom and grading; `&backdrop=0` turns off the painted distant layers.
`&capture=1` stops the render loop so the fixed views can be captured.

## What changed

- `src/painted.ts`: patches three.js's built-in lighting shaders when the flag is on.
  - The sun term is split into lit and shade areas, and world-space brush strokes break up the edge between them.
  - Shade gets a violet-blue fill instead of grey.
  - Surfaces get a brush-grain texture fixed to the world, not the screen.
  - Haze builds up with distance.
  - The sky is a painted gradient.
  - A light bloom and colour-grade pass finishes the image.
- `src/painted-backdrop.ts`: canvas-painted original artwork placed at real distances, so it shifts slightly as the player moves.
  - Three layers of cloud banks below the terrace horizon.
  - Seven distant floating islands with waterfalls.
- `src/main.ts`: flag wiring and a warmer, more side-on sun. The study's old sky dome is hidden when the flag is on.
  - Also adds a `__arcade.pose()` hook that sets an exact camera position for captures.
- `capture-views.mjs`: captures the fixed judgment views.
  - V1 hero vista: looking out from the courtyard end.
  - Arrival.
  - V2: close to the atelier wall.
  - V3: looking back.
  - V4: phone, 390×844.

## Evidence and limits

- Before/after sheet: `artifacts/bellweather-arcade/painted-20260930-before-after.png`.
- Captured with software rendering (SwiftShader) in the cloud workspace. These show the look only, not performance.
- Typecheck passes. Walking and pause were checked; with the flag on, software rendering was too slow to show walking there, so that needs a GPU check.
- **Frame cost not yet measured on a real GPU.** In software rendering the painted mode was far slower than the control. The three full-screen, see-through cloud rings were the main cost there. Measure on the Intel UHD before treating this as viable.
- Art remains well short of the reference.
  - The architecture is still simple.
  - There are no people, no water and no hero landmark at scale.
  - The painted islands still look like clip art.
  - The phone view (V4) is cramped.


## Pass 2: world and performance (same day)

User feedback on the hosted build: "does look better, but the performance has taken a hit."
Frame times were measured on the user's laptop GPU (Intel UHD, Direct3D 11) at 1280x720.
The display refreshes at 144 Hz, so frame times cluster at steps of about 7 ms.

What was actually slow:

- It was fill-bound. Rendering at half resolution cut the frame time from 76 ms to 28 ms.
- The biggest single cost was the leaf cards on the landmark trees: 16 meshes of 1,000 see-through cards each. They cost about 27 ms.
- The full-screen bloom and grade passes, the per-pixel stroke noise and the three cloud-ring layers were smaller costs.

Changes:

- **Performance**
  - The bloom and grade passes are gone. The grade now runs inside each material, and the vignette is a CSS overlay.
  - Brush strokes come from a small tiling texture and are skipped beyond 90 m.
  - Surfaces use a cheaper lighting model (Lambert instead of PBR); the painted look doesn't need PBR highlights.
  - The cloud rings are drawn solid instead of see-through.
  - Render resolution now adapts to hold about 30 ms per frame, and the on-screen UI stays sharp.
  - The world's shadows are drawn once. The walking character uses its soft contact shadow instead of redrawing the shadow map every step.
- **World**
  - Painted image cards are replaced by 3D floating islands: a hero island with a great blossom tree, ceramic arches and waterfalls, plus 9 satellite islands.
  - Far trees are solid canopy puffs sharing a few draw calls, and cumulus cloud masses are built from repeated shapes.
  - Life: five townsfolk in long coats and woven hats, and Mira waiting at the outlook. They take up floor space through a new `addSolidCircle` helper in `facade.ts`, so the player can't walk through them.
  - A flock of birds circles the landmark island.

Measured median frame time on the user's laptop GPU:

| View | Previous build | Painted, pass 2 |
| --- | --- | --- |
| Arrival | 42 ms | 28 ms |
| Walking | 62 ms | 28 ms |
| Vista | 28 ms | 28 ms |

The painted numbers were taken at an adapted render scale of about 0.7. The image is softer than full resolution, and slow frames (the slowest 10%) still reach 48–62 ms.
The first painted pass measured 76–90 ms.
New toggles: `&pbr=1`, `&adaptive=0`, `&aa=0`, `&life=0`.
Art remains below the reference:

- The architecture is still simple.
- There is no water yet.
- The inhabitants are static and have no interactions.
- The hero tree's canopy is a stylised mass rather than a painted crown.

## Pass 3: phone budget and graphics settings

Target device (from the user): Galaxy F15, a low-end phone (Dimensity 6100+, Mali-G57 MC2 GPU). If the Low tier runs there, it will run on most phones.

- **Quality tiers.** `src/quality.ts` defines Auto, Low, Medium and High.
  - The player picks one in the pause menu. The choice is saved in that browser and applied by reloading. `&quality=` sets it from the URL.
  - Auto picks Low on touch phones and Medium otherwise.
  - Settings that change by tier: render-resolution range and target frame time, anti-aliasing, shadow-map size, near-tree leaf density, horizon cloud layers, number of islands, cloud and canopy detail, birds and brush grain.
  - On Low, every tree uses solid canopy puffs instead of see-through leaf cards. On Medium, only distant trees do. On High, all trees keep leaf cards.
- **Frame-rate readout.** A "Show frame rate" toggle in the pause menu, or `&stats=1`, shows fps, frame time, the slowest frames, the tier and the render resolution.
- **Measured GPU draw time** (WebGL timer queries on the laptop's Intel UHD, with the scene paused):

| Setting | Arrival | Vista | Draw calls | Triangles |
| --- | --- | --- | --- | --- |
| Low, phone-shaped screen (412x915 at 2.6x, 90% resolution) | 5.2 ms | 3.5 ms | 96 | 208k |
| Medium, 1280x720 | 27 ms | 8.9 ms | 138 | 258k |
| High, 1280x720 | 34 ms | 20 ms | 139 | 297k |

- On a phone-shaped screen, dense see-through leaf cards were the largest remaining cost. Hiding them saved about 10 ms of GPU time at 1280x720.
- **Not yet verified on the F15.** A Mali-G57 MC2 is several times slower than this Intel GPU, so these numbers are only an estimate. The on-screen readout on the phone is the real check.
- Triangle count on Low (208k) is still above the 150k phone goal.

## Galaxy F15 results and the flicker fix

The user measured the study on the Galaxy F15 with the on-screen frame-rate readout:

| Setting | Frame rate | Frame time (slowest) | Resolution | Notes |
| --- | --- | --- | --- | --- |
| Low | 90 fps | 11 ms (22 ms) | 90% | |
| Medium | 89 fps | 11 ms (22 ms) | 124% | |
| High | 45 fps | 22 ms (44 ms) | 116% | brief whole-scene "lights off" flicker |

What changed as a result:

- Auto now starts at Medium on every device.
- Flicker cause: whenever the automatic resolution changed, it resized the canvas right after a frame was drawn. Resizing clears the canvas, so the dark page background showed for a frame. On High the frame time sat right at the 22 ms target, so the resolution kept changing back and forth.
- Fix: redraw immediately after every resize. Only change resolution outside a wider band around the target, with a settle period, and wait 8 s after scaling down before scaling back up.
- In a 24 s walk on High, the laptop's phone-shaped test made no resolution changes.
- Still to do: the user rechecks High on the F15 for flicker.
- Layout: the BELLWEATHER title now sits on a light pill; on phones the frame-rate readout sits top-left and the Painted/Before switch sits top-right.

## Pass 4: the world (promenade, life, phone framing)

The user confirmed that all three settings run on the F15, High included, and asked for more graphical fidelity and more world.

- `src/painted-promenade.ts`
  - A raised lily pool on the arrival plaza, with a ceramic rim. Its water is custom painted: sky tint that strengthens at glancing angles, drifting ripple bands, sun glints and lighter shallows at the edges. On High, the pool also shows a live reflection of the scene.
  - Lily pads, lotus flowers, and about 400 fallen blossom petals.
  - Four swaying banners with an original emblem.
  - Flowering shrubs along the balustrade.
  - The pool, banners and shrubs take up floor space through the new `addSolidBox` helper, so the player walks around them.
- `src/painted-life.ts`: three townsfolk now walk back and forth, easing and looking around at each turn, while others idle. Walkers do not block the player.
- Phone framing (painted study only): on portrait screens the lens is wider (66°), the camera starts about 20% further back, and it aims higher, so Zip sits in the lower third and the vista fills the view.
- GPU draw time on the laptop, phone-shaped screen:
  - Medium at 125% resolution: 9–16 ms.
  - High at 200% resolution, including the reflection pass: 32–55 ms.
  - High relies on automatic resolution to settle on phones.
- New toggle: `&promenade=0`.

## Pass 5: Blender hero island

The hero landmark was built in Blender 5.2.2 through Blender MCP. All of it is original procedural modelling; no outside assets were used.

- Editable source: `experiments/bellweather-arcade/authoring/hero-island/hero-island.blend`, in the `HeroIsland` collection.
- Game asset: `public/landmarks/hero-island.glb`, about 21.4k triangles after decimation (34.6k in the source file), 1.6 MB.
- Contents:
  - A craggy, stratified rock underside: vertical crags, ledge bands and hanging chunks. Vertex-coloured from warm sandstone at the top to violet shade underneath.
  - An overhanging grass cap with moss drips.
  - A thick branching trunk with flared roots.
  - A volumetric blossom crown, 54 m across, with a pink gradient and cream highlights.
  - Five tapered ceramic ribs curling over the crown.
  - Four waterfall ribbons.
- In game:
  - The island loads into `painted-landmarks.ts`, at 1.3x scale and about 150 m away, so it dominates the view from the courtyard.
  - The waterfalls get an animated streak material.
  - If the file fails to load, the earlier code-built island appears instead.
- GPU cost on the laptop, phone-shaped screen, Medium: 9.6 ms at arrival and 17.4 ms at the vista, about the same as before. Draw calls fell from 115 to 101.

## Pass 6: Zip rig, library animation, townsfolk who react

- **Shared humanoid skeleton.** `src/zip-rig.ts` defines 17 body bones with standard names, plus ears and a scarf chain.
  - Zip's hard-surface parts are each attached to a single bone, so no weight painting is needed. They merge into one skinned mesh per material: 7 draw calls.
  - Secondary motion on top of the clips: ears spring with speed and turns, the scarf trails and flutters, the head looks at targets and keeps the visor level, and the eyes blink.
  - Locomotion blends between Idle, Walk and Jog by speed, and playback speed follows walking speed so the feet don't slide.
- **Library animation.** Quaternius Universal Animation Library, Standard tier, CC0 1.0. The user downloaded it into `assets/third-party/quaternius/`.
  - `tools/bake-ual.js` retargets 15 of its 43 clips onto the shared skeleton: Idle, Walk, Jog, Sprint, Jump start/loop/land, Interact, Talk, Dance, Stroll, Sit idle/talk, Pick up, Roll.
  - Output: `public/characters/zip-ual-clips.json`, 383 KB before compression. The 7.6 MB library itself is never shipped.
  - The Standard tier has no wave, so Wave and Cheer are code-generated clips on the same skeleton.
  - A direction check (`tools/check.html`) shows the limb directions match the source to 0°.
- **Townsfolk on the same skeleton.** `src/townsfolk-rig.ts`: long coats whose hems follow the legs, shawls, woven hats, and arms that animate.
  - Clips: Talk for the chatting pair, Stroll for walkers, Idle for the rest, plus Wave.
  - Library hip movement is rescaled per body height.
- **Reactions.** In `painted-life.ts`, when Zip comes within about 3 m, a townsperson:
  - turns their head and body toward Zip,
  - waves the first time they meet,
  - says an original line in a speech bubble placed above their head (plain text, so it stays sharp at any render resolution),
  - then waits 22 s before greeting again.
- Walkers stop to greet. Mira greets from the outlook. Zip looks back at whoever spoke and waves back if standing still.
- Lines live in a `LINES` table for now; the plan is to source them from the course's StoryWorldSpec.
- **Cost** (laptop, phone-shaped screen, Medium):
  - GPU draw time: 10.5 ms at arrival, 6.4 ms at the vista.
  - Draw calls: 141, up from 101.
  - Zip's per-frame update: 0.014 ms.
  - Median frame: 13.9 ms.
- **Still to do:**
  - Townsfolk faces are plain.
  - The coat does not bend around sitting poses; the sit clips are not used yet.
  - The UAL Pro tier (paid) includes gestures such as a real wave, if wanted later.

## Pass 7: dense spots on the phone (30 Sep)

F15 report: 90 fps in open views, 45 fps in the inner courtyard, 30 fps (brief dips to 15) under the planter blossom tree with townsfolk around.

Measured (laptop, phone viewport, Medium, 120% res, GPU timer): 6.6 ms in open views, 21-30 ms at the worst poses. Hiding leaf cards saved 8-12 ms there; hiding townsfolk saved ~0-1 ms. The three planter trees (~820 alpha-tested cards each) were the cost.

Fixes:
- Adaptive resolution targeted 30 ms on Medium, so it never reacted to 30 fps. Now aims for 60 fps (Low/Medium 16.7 ms, High 20 ms), judges every 40 frames, and probes upward after 6 s of headroom with exponential back-off if the probe fails (vsync-snapped frame times hide headroom).
- Medium crowns keep the outermost 60% of cards (ranked by distance from the crown centre) instead of a random 70%; interior cards were mostly hidden. Crown cards render after opaque geometry and only receive shadows on High. Card cost at worst poses: 8-12 ms -> 4-9 ms.
- Leaves on the camera-to-Zip sight line fade out (view-space capsule), so a crown never hides the player.
- Townsfolk: one vertex-coloured material per person (5 draws -> 1). Walkers no longer cast into the static shadow map (their shadow stayed behind); they get a contact shade.
- All shaders compile at boot (compileAsync), so a new area cannot stall on a program link.
- Greeting loop and look-at no longer allocate per frame.

Worst poses now 15-24 ms GPU at 120% on the laptop (was 21-30), draw calls 108-122 -> 72-86. On the phone, adaptive resolution now absorbs the rest.
Tried and rejected: opaque "core puffs" inside hybrid crowns; they read as big faceted blobs up close.

### Pass 7b: camera inside a crown (F15: 8 fps, 122 ms at 60% res by the entrance tree)

Cause: the follow camera could sit inside the pink planter tree. Leaves within 3.4 m were thinned by a per-pixel dither, so dozens of screen-filling cards were still shaded and then mostly discarded; tile GPUs pay for every one of those layers (the laptop GPU barely noticed, ~10 ms).
- Near-camera and camera-to-Zip leaf clearing moved to the vertex shader: each card shrinks to nothing from 3.6 m to 2 m (and off the sight line), so cleared cards cost no pixels at all. This also removes the dotted stipple over the view.
- Planter trees now have invisible camera blockers for the trunk and branch fork, so the camera slides in front of the tree instead of into its limbs.

## Pass 8: automated play-testing and camera fixes (30 Sep)

Tested on the laptop two ways: Claude's built-in browser playing the published artifact at phone size (guided walk, camera orbits), and a scripted sweep in a phone-sized browser: every walkable spot on a 1.4 x 1.3 m grid x 8 camera headings (824 views), measuring how much of Zip is visible in each (render with and without Zip, diff the pixels in his screen box).

Found: 29 of 824 views hid Zip, plus several where the camera sat inside geometry: behind the planter-tree limbs, inside the entrance arch wall, behind agave beds, behind banner cloths, and townsfolk or Mira standing between camera and Zip.

Fixes:
- `camera-grid.ts`: at load, all static opaque geometry is rasterised into a 0.2 m voxel grid (dilated one cell); camera rays march it (3D DDA). Collision now covers everything, not only hand-placed proxies. ~70 ms to build on the laptop, ~0.05 ms per camera update. Reusable for any generated world.
- `occluders.ts`: anything tagged `userData.fade` (townsfolk, Mira, banner cloths) fades when it is nearer the camera than Zip and overlaps him on screen (screen-space test), or is within 1.4 m of the camera. Materials cloned per figure; opaque again when clear.
Result: 29 -> 2 occluded views; both remaining are a person standing beside Zip (not in front), which is fine.

### Pass 8b: High in the claude.ai frame
- Choosing High didn't survive the reload inside the claude.ai artifact frame (storage there doesn't persist reliably), so the study came back on Auto/Medium. The graphics choice now also rides in the URL hash (`#painted&quality=high`), which survives the reload.
- High targeted 20 ms (~50 fps) and couldn't drop resolution below 75%, so on the laptop's integrated GPU at desktop size it sat at 48 fps. High now targets 60 fps like the other tiers, with a 60% floor. Measured there: settles at ~72 fps, 68% resolution.
- Pool reflection (High only, a second full scene render, ~5 ms) now renders only when the pool is on screen, at half rate. MSAA costs ~5 ms at that size and stays on High.
- Profiling overrides: `refl=0|1`, `trees=all|distant|none`.

### Pass 8c: Auto measures the device
- Clean test: only one copy of the game running (the built-in browser); earlier runs overlapped with the scripted browser, which shared the GPU.
- The built-in browser on this laptop runs on Intel UHD Graphics (not the discrete GPU). Stats readout now shows the GPU name and Auto's measurement.
- Auto used to be Medium everywhere. It now measures once behind the loading screen: renders the Medium scene at High's resolution, median GPU time via timer queries (readPixels fallback). High is chosen when 1.5 x that <= 11 ms, then the page reloads straight into High (result kept in the URL hash and storage). Clicking Auto in the menu re-measures.
- Intel UHD, 800x907 window: 20.3 ms -> Auto keeps Medium (72 fps at 100%). High there needs ~70% resolution to hold 72 fps, so Medium is the right Auto pick for that GPU.
