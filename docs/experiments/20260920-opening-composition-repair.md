# Opening composition repair

20 September 2026. Follows the ten-game research checkpoint `5ceef14`, pushed to
`origin/main` at the user's request. This is a bounded application of research to
the existing opening, not an expansion into later content.

## Authored decision

Intended first impression: three distinct people participating in one shared
lantern ritual. The group and its object are primary; the tower establishes place
in the background. Keep room between silhouettes and a clear view of the released
object beneath the captions on narrow screens. Background delivery remains a
secondary sign of ordinary life, not the main story explanation.

Reference mechanism: purposeful participation supports attachment (RDR2), and
spatial staging must make the action understandable (Ocarina/Portal). These are
adaptation hypotheses from `../GAME-REFERENCE-STUDY.md`, not claims that reference
games validate our scene. No added props or new shared-runtime rules are needed.

## Implementation boundary

All changes are content-package data in `web/first-words-world.js`: world version 9,
opening version 8. Closer/lower desktop and portrait home cameras, a tighter social
triangle, lantern handoff beside the protagonist rather than across the face,
and a lower release endpoint that clears wrapped phone captions. Background
delivery positions move inward to remain visible in the closer framing. Updated
action and rupture start positions retain the package's spatial consistency.

The shared renderer, controls, learning rules and stored learner evidence are
unchanged. This proves reuse through authored camera/transform/timeline parameters;
it does not introduce Bellweather-specific conditions into the general system.

## Observations and repair loop

Parent native GUI reproduction used menu -> Replay the prologue at disposable
port 8068, preserving the existing Level 1 save. At 390x844 the old tower dominated
the upper frame and the friends occupied opposite edges. In the closer framing,
the three figures read together and the lantern release remained visible. An
intermediate handoff obscured Zip's face; the object was moved beside Zip. The
updated initial frame was also inspected at 360x800 through native browser use.
These are informed implementation observations, not independent cold findings.

The unchanged opening regression caught two real composition regressions during
iteration: the background recipient's parcel left the phone frame; then the
released lantern intersected wrapped captions at 360px. Staging and endpoint were
repaired rather than relaxing assertions. Automated capture is supporting evidence,
not proof that relationships or aesthetics succeed.

## Verification status

- Build passed on the final package edits.
- Full application suite: 369 tests passed, seven skipped. This completed before
  the final background-position/release-height adjustments; the final opening
  browser run specifically covers those presentation changes.
- Opening browser regression passed: full eight-beat journey, replay preservation,
  reduced-motion 360/430/1280 checks and normal 390 capture. Logs:
  `artifacts/readiness-20260920/opening-composition-browser.log`
  and `opening-composition-build.log` in that directory.
- Native recheck uses the existing separate Astra task, candidate file SHA256
  `529a61fed9eb2a2aba5f1daf9163c9e4c30891e6ebfe3d5f51746b32ebfda0b4`.
  Scope: scenes 1–3, 360x800, 430x932 and 1280x720. It is an informed recheck,
  not a new cold-observer pass.

The separate reviewer completed six GUI inputs, inspecting scenes 1–3 at all
three requested sizes, then visibly returned to the saved Level 1 state. Its
unaltered final report is `artifacts/readiness-20260920/opening-composition-native-recheck.md`,
source turn `01a0bff5-c6bc-7830-a614-ed3234f4b909`. It found the main group and shared
object clearer, all three friends fitting both phones, and the red friend no
longer pushed against the edge. It still found partial green-character/control
overlap at 360px, decorative lantern/caption competition, the scene-3 crack behind
phone captions, a tower dominating the Warden, and ambiguous background activity.
Names and who made the lantern remain conveyed by text. No art-ready verdict.

Relationship comprehension remains a judgment to verify, not a property proved
by a camera coordinate. Motion/audio quality remain deferred. Route-board
discoverability, mission doorway occlusion and the other full-journey gates remain
open. No Level 2 or deployment promotion.
