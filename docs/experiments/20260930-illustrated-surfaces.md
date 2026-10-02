# Surface and atmosphere comparison — 30 September 2026

Root Astra owns visual implementation and native inspection. Sol reuses one
existing engineering verifier after the candidate is frozen. This is an isolated
art experiment, with production PlayCanvas, learning, story and release gates
unchanged.

## Hypothesis and method

The selected graphic-utopia reference uses designed ground shapes and warm/cool
light masses to join the architecture and route into one composition. The current
study's gray rectangular grid and indistinct haze weaken that effect. Test the
same small court with broad curved limestone paving, longer warm cast shadows
and shaped cloud banks. No map growth, new encounter, provider or dependency.

Append `&surface=illustrated` to the existing sunlit/ceramic/terraces candidate.
Removing that option preserves the prior comparison. The original route-paving
kit now accepts optional row count, width function and warm slab colors, keeping
its original defaults. The conservatory reuses that kit rather than introducing
another paving implementation. Thin ceramic inlays are actual flush surfaces;
the decorative slab top is 2mm above the unchanged .13m walking plane. The same
sun, fill, shadow map and material shader supply light/shade separation.

The first cloud treatment failed native inspection: repainting the old cards
made large flat lobes conspicuous. One repair replaces those cards in this option
with one instanced family of 70 shaded cloud lobes at real world depths. Those
are simple authored scenery meshes, not a volumetric atmosphere, weather system,
reflection pass or new contact geometry. They add triangles while removing
transparent planes; neither draw count nor lower transparency alone establishes
lower GPU cost. The broad shapes remain simple and are not a reference-quality
cloud solution.

## Frozen visual candidate

Build/typecheck passed; existing large-bundle warning remains.
`index-xeTQvxmO.js`, SHA-256
`72ce3541fea8a07b4735de91459328ce7fc494a063a56ba5c6ba81f77cb23072`.

Root used visible movement controls on the approach, guided travel through the
entrance and camera drags to inspect the courtyard and reverse view. The paving
reads as a connected promenade and the sunlit entrance contrasts with the cooler
court. No route blockage was observed in that traversal. Cloud cutout edges are
gone after the repair, but the cloud forms are subdued from the main viewpoint;
do not count this as a major atmosphere-quality gain. Geometry, surface detail
and the static character remain below the selected reference. Art acceptance is
still open; this worker pass is not the fresh-context all-lane critic review.

Native captures in `artifacts/bellweather-arcade/`:
`illustrated-arrival-native.png`, `illustrated-courtyard-native.png`,
`illustrated-reverse-native.png`. Preview left paused at arrival.

## Reusable production lesson

Treat large surfaces and light masses as composition inputs before adding props.
Reuse an existing geometry kit with bounded parameters when it already solves
the problem. Judge atmosphere at player height and from another angle: a texture
can be technically valid while exposing its flat construction during play.
Reject that visible failure without relabeling the new technique as success.
Keep cost claims separate from appearance and preserve the prior comparison.
No general cloud generator, rendering framework or game-specific platform policy
was added for this study.

## Engineering

Sol's single sequential A/B check passed on the frozen bundle. The owned Chrome
browser closed after the run. Both variants passed held-W movement, camera drag,
pause/frame freeze, restart, 390x844 bounds, finite character geometry and sole
height .130m. Camera solids stayed at 126. All seven tracked local resources per
variant returned HTTP 200; no page, resource or shader errors. The control logged
one ANGLE X4122 precision warning; the candidate logged none.

Arrival control: 126 draw calls / 175,816 triangles. Candidate: 97 calls / 196,534
triangles. The 29 fewer calls come with 20,718 additional triangles. Brief 750ms
median frame samples were 27.8/27.9ms in the ordinary view and 27.8/27.6ms near a
wall (control/candidate). No sustained speedup, CPU reduction or GPU-cost claim.
Evidence: `artifacts/bellweather-arcade/illustrated-20260930-engineering.json`
and `illustrated-20260930-{control,candidate}-{arrival,wall,phone}.png`.

The existing `verify-courier.mjs` now accepts `--baseline=<URL>`,
`--candidate=<URL>` and `--prefix=<unique-name>` instead of requiring a new
script or overwriting earlier evidence. Both URLs in this run are the documented
terraces candidate; only the latter appends `surface=illustrated`. Prefix:
`illustrated-20260930`. Run with `node --experimental-strip-types` and an already
running loopback preview; the verifier uses installed Chrome and closes it.
Its existing Playwright import is now an explicit pinned dev dependency, removing
another implicit dependency on the local research junction. No new test harness
or broader product suite was needed for these isolated rendering changes.
