# District silhouettes — 29 September 2026

One coordinated pass on the existing city composition. Optional
`&districts=terraces` replaces the repeated tapering houses with a deterministic
family of stepped garden buildings, low galleries and slim towers. It reuses the
existing volume/material kit, using un-beveled low-subdivision masses at distance.
The existing orbital sky is smaller and shifted away from the central landmark.
Local architecture reuses its existing pigment shader at restrained material-specific
strengths; no new textures, postprocessing, light passes, dependencies or providers.
Playable layout, colliders, camera, character and learning remain unchanged.

One visual repair gives the low-gallery family a broad curved roof (36 surface
triangles plus trim), rather than stopping at stacked boxes. Final frozen build
`index-DXmeqNSe.js`, SHA-256
`564076EC17C204D973CD3651A0889CE8509D4C14C59297CD8337A11F692C0014`.
Build/typecheck pass; existing large-bundle warning remains. This is an isolated
art comparison, not a production or learning-readiness claim.

## Native observation

Initial-build native visible approach walking, guided courtyard travel and reverse
orbit inspected. Different building heights/masses read more clearly; planet
offset frees the central landmark. Local pigment change is subtle at play scale,
so no large surface-quality improvement is claimed. After the roof repair, root
repeated guided courtyard travel and reverse orbit on the frozen build. Final
captures: `district-final-vista-native.png` and `district-final-reverse-native.png`
under `artifacts/bellweather-arcade/`. The earlier `district-vista-native.png`
is the pre-roof comparison. Route/character remain visible in sampled views;
the skyline is more varied, but facades still read simply. Art target remains open.

Reuse lesson: vary building mass and roof profile rather than only tower height;
judge the result at actual screen size. Surface noise that is barely visible
should not be counted as a major quality gain. No universal generator/profile
framework is added for this one scene.

## Engineering

The final checked bundle `index-DXmeqNSe.js` has SHA-256 `564076EC17C204D973CD3651A0889CE8509D4C14C59297CD8337A11F692C0014`. One owned Chrome process visited the sunlit city control and the same URL with `&districts=terraces` sequentially, then closed. Both [control arrival](../../artifacts/bellweather-arcade/districts-engineering-control-arrival.png) and [terraces arrival](../../artifacts/bellweather-arcade/districts-engineering-terraces-arrival.png) screenshots visibly rendered the full scene. Held W, drag orbit, pause, restart and 390×844 portrait bounds passed. Required local material, atelier and clean-portal resources loaded with HTTP 200; there were no page, resource or shader errors. The control emitted one ANGLE `X4122` precision warning and the candidate none. [Full snapshots and captures](../../artifacts/bellweather-arcade/districts-engineering-engineering.json) preserve the device identity and checks.

At arrival the control reported 125 calls / 194,644 triangles; terraces reported 126 calls / 175,816 triangles. One 750 ms ordinary-view sample had median intervals of 34.7 ms control and 27.9 ms terraces; the sampled near-wall view had 21.2 and 27.7 ms. The reached camera positions and scene content differed, and these brief samples cannot establish sustained frame-rate or CPU/GPU utilization. The character geometry and standing height were unchanged in the focused static check. This engineering pass does not certify all skyline angles, animation or art readiness.
