# Courtyard and surrounding city — 29 September 2026

User accepts the improved sunlit look but requests faster, more substantial
progress without losing efficiency or vision. Root groups remaining back-wall
and horizon work into one composition. Optional `&setting=city` on the sunlit
courier URL preserves the prior scene. Same playable 18×22m footprint, character,
learning scope and low blockers; no new destination or interaction promise.

Reused existing `vista.ts` island/building/transit/cloud kit and `sky-art.ts`
orbital sky. Three distant districts fill side/reverse views; no duplicated hero
trees, new asset provider or new dependencies. Rear elevations receive physically
raised frames, glazed panels and sun-screens above 2.2m, with camera-only bounds.
Glazing remains the existing opaque reflective approximation, not a new interior.

Initial build `index-BoIA-SSP.js` passed build/control checks but increased scene
cost. Root reduces only new distant-building subdivisions, batches visible relief
and uses simple conservative camera boxes instead of decorative bevel raycasts.
Native inspection also raises the three new distant tiers so roofs are visible
above the courtyard boundary, without adding geometry. Final bundle
`index-Bx8KJmVA.js`, SHA-256
`E9A22A65C281E808E7B9D94CA745B2D739299B42E14DEC535362241A5798D398`.
Build/typecheck pass; existing large-bundle warning remains.

In-app tab 2 stalled during navigation/debugger synchronization; fresh tab 3
initially displayed blue canvas despite functioning UI. Separate owned Chrome
rendered both scenes. Reloading tab 3 restored native rendering. Cause not proven;
do not attribute it conclusively to scene cost or claim a general browser fix.

## Native review and decision

Root used visible walking controls for approach on the cost-repaired build, then
guided travel and camera drag for courtyard/reverse review. After the final
scenery-height adjustment, repeated guided travel and reverse orbit on
`index-Bx8KJmVA.js`. `city-final-vista-native.png` and
`city-final-reverse-native.png` under `artifacts/bellweather-arcade/` show the
frozen result. Upper wall relief reads in actual shade, distant roofs are visible
beyond the courtyard boundary, and the existing orbital sky gives the forward
vista a stronger fantasy identity. No visible route obstruction at sampled views.

Worker judgment: a more complete surrounding composition, but the repeated tower
shapes, simple surfaces and rigid character still fall below the accepted concept.
The globe is deliberately graphic, not a realistic planetary simulation. This is
not the fresh-context integrated critic gate. Motion/audio/physics quality are
not newly certified. [Focused engineering evidence](20260929-city-composition-verification.md).

## Reusable lesson

Reuse existing scenery kits at the detail needed for their screen size. Distant
scenery and local traversal remain separate. Batch visible decoration while
retaining bounded, conservative camera proxies; camera cost and visual richness
must be checked together. A functioning DOM is not proof of a rendered scene:
inspect actual output when startup/rendering is in doubt.
