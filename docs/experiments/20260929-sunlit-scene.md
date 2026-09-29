# Coordinated scene pass — 29 September 2026

User asks for faster progress without sacrificing quality. Root owns a single
lighting/material/foliage pass; Sol checks the frozen result once. Character,
layout, collision rules, playable footprint, source GLBs and learning remain fixed.
The control is the previous ceramic/daylight/courier scene; add `&look=sunlit`.

## Art hypothesis and implementation

Too-similar brightness flattens architecture while tiny alternating foliage tones
compete with it. Strengthen directional form with the existing sun, cool fill and
reflection source; quiet paving; deepen structural blue and warm portal accents.
The existing tree generator has an optional profile with fewer structural arms,
broader clustered sprays and spatially coherent tones instead of random bright
and dark cards. Existing atlas/flower texture and instancing are reused. No new
renderer, lights, shadow maps, postprocessing passes, asset provider or dependencies.

The first light balance was too heavy in shade. One adjustment lifts fill while
preserving directionality. Final bundle `index-CvVWYDBh.js`, SHA-256
`27B55674A279B554DF38110C0777A4711C64DA569ED9596D052F9B2F8D57ECFC`.
Build/typecheck pass; existing large-bundle warning remains.

Root arrival judgment: stronger architectural depth and more connected blossom
masses, with legible character/route. Distant scenery still looks simpler than
the foreground; card foliage and hard shadow edges remain apparent. This is a
worker art comparison, not fresh-context acceptance or a new physics/motion claim.

## Native review

Root used native visible controls for approach walking, then the guided route
through the entrance, and dragged the camera to inspect reverse courtyard views
on the frozen bundle at 1280×720. Character and route remain visible in the
sampled sun/shade transitions. Captures are `sunlit-arrival-native.png`,
`sunlit-courtyard-native.png` and `sunlit-reverse-native.png` under
`artifacts/bellweather-arcade/`. After engineering, root used menu recenter/return
to arrival; `sunlit-final-native.png` records the final view. Preview left paused
and the temporary viewport override reset.

Reverse inspection reinforces two remaining problems: large plain back walls and
an unfinished-looking horizon. Neither is solved by stronger color contrast.
Larger foliage cards reduce visual fragmentation but can increase alpha overdraw;
lower geometry counts alone must not be reported as GPU savings.

## Engineering verification

The frozen `index-CvVWYDBh.js` bundle has SHA-256 `27B55674A279B554DF38110C0777A4711C64DA569ED9596D052F9B2F8D57ECFC`. One owned Chrome process checked the courier control URL and the same URL with `&look=sunlit` sequentially at 1102×828, DPR 1, ANGLE Intel UHD Graphics / D3D11, then closed. Held W movement, drag orbit, pause, restart and 390×844 portrait control bounds passed for both. Local materials, atelier and clean-portal resources loaded with HTTP 200; no page, resource or shader errors were recorded. The control emitted one ANGLE `X4122` precision warning, the sunlit candidate none. [Full snapshots and captures](../../artifacts/bellweather-arcade/sunlit-engineering-engineering.json) retain the exact checks.

At arrival, both variants rendered 112 calls; the sunlit view reported 167,084 triangles versus 176,164 for control. The two short 750 ms ordinary-view samples each had a 27.6 ms median frame interval; the sampled near-wall views each had a 20.8 ms median. These are different content and camera views, not a sustained performance or CPU/GPU utilization comparison. No extra rendering passes or lights were introduced by this branch. The courier geometry and static grounding check matched both variants: seven merged material meshes, 12,128 triangles, finite position/normal components and a lowest vertex at y=.130 m. Source inspection found the default tree profile unchanged at 14 arms × 4 sprays × 19 leaves plus 120 inner leaves (1,184 instances), while sunlit uses 10 × 4 × 22 plus 120 (1,000 instances), both below the 1,260-instance capacity. Runtime foliage matrices were not enumerated in this bounded pass, so finite transforms are not independently certified.
