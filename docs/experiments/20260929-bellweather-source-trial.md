# Bellweather source-based world trial — frozen art verdict

29 September 2026. Worker art judgment after active native browser interaction;
not a cold critic record, integrated readiness result or human acceptance.

## Decision

**Do not promote this trial into the game.** The source reuse successfully proves
a locally working material/light baseline and a small connected interaction, but
the original world still misses the accepted reference. The initial pass plus
two substantial visual revisions have been used. The art experiment is frozen;
focused verification and functional repairs are recorded separately.

This trial was authorized by the user's “ok, let's continue” following the
[retrospective](20260929-world-production-retrospective.md). It is isolated under
`experiments/bellweather-world`; canonical v8, active PlayCanvas game, learner
evidence, saves and deployment are unaffected.

## What was actually produced

- Reproduced the MIT Summer Cycle baseline at
  `8b977baad061e797c2f6c19cfcf07c1e79b23a67`, preserving source provenance and lockfile.
  See [baseline verification](20260929-source-baseline-verification.md).
- Passed the separate opening-only prototype design gate after two review
  corrections removed stale requirements. Reviewed canonical design digest:
  `0f1b1488ed5ed941b082b045ea9c61ccb8e9d968ae376f3759803bcfb40fd614`.
  This does not approve the visual output or later learning sequence.
- Built an original curved promenade, lightwell, reachable overlook, characters,
  white civic forms, pink canopy, turquoise water and background transit.
  Rendering/material helpers are reused with the MIT license; vendor files are
  unchanged. Palette adaptations live outside vendor.
- Implemented direct movement, camera orbit, contextual interaction, optional
  guided travel, reduced-motion station steps, pause, restart and a lighter
  rendering configuration. The scene writes no learning or save state.

## Native worker observations

Root used the actual GUI at `127.0.0.1:8061`, observed the arrival, followed the
path to Mira, explicitly activated the lightwell, observed its opening response,
travelled to the overlook, joined Mira and returned. Guided travel did not activate
the garden automatically. Return travel exposed an incorrect destination status
message; it was handed to Sol for reproduction and repair. At 390×844, the options
fit, Restart preserved the selected reduced-motion setting, and a deliberate
station step landed beside Mira with a separate Wake action.

Sol's [verification](20260929-bellweather-source-trial-verification.md) reproduced
and repaired paused background activation, the return announcement and clipped
contextual text at 200% size. Root then resumed native play on the repaired build:
Pause hid the action, pressing E left the garden unchanged, Resume still offered
Wake, and explicit activation followed by Join worked. This final recheck also
caught a related reduced-motion return announcement asking the player to wake an
already awake garden. Sol repaired the copy, rebuilt and refreshed the manifest;
root reloaded and completed the reduced-motion chain again, observing the correct
awake-garden return message. The owned browser and preview server are closed.

These observations do not certify motion quality, audio, physical-phone cost,
cold-player comprehension or every collision. The root play used guided travel
for the complete journey; Sol's functional checks must establish direct-input
behavior separately. No critic scores are manufactured from this worker pass.

![Current lightwell view](../../artifacts/bellweather-source-trial/revision2-wake.png)

![Reachable overlook](../../artifacts/bellweather-source-trial/revision2-overlook.png)

The two revision captures precede the small functional repairs. The following
capture is from root's repaired-candidate recheck, before the final return-copy
change; it shows the reduced-motion settled garden with Mira at the overlook.

![Worker recheck](../../artifacts/bellweather-source-trial/final-worker-garden.png)

## Why it still misses

The palette, shadows, reflections and slender protagonist are more coherent than
the first trial. However, visual coherence alone is not the requested world.

1. **Place identity is weak.** Repeated blades on floating discs and simple civic
   cylinders communicate a procedural set more than a specific inhabited city.
   There are too few credible entrances, destinations and signs of use.
2. **The composition spends too much on empty floor.** The route is physically
   continuous, but its camera views do not consistently arrange foreground,
   companion, interaction and distant destination into a compelling invitation.
3. **Character and architectural form remain rudimentary.** An orange scarf and
   pink canopy repeat reference motifs without matching its crafted silhouettes,
   expressive shape language, material variation or environmental storytelling.
4. **Life is mostly background suggestion.** Transit and silhouettes are not
   enough to establish local routines or a place worth returning to. Adding more
   stationary figures would not solve that.
5. **Portrait composition is not solved.** At the lightwell station, Zip and Mira
   fill the narrow view while the interaction object falls outside it. A readable
   button cannot substitute for seeing what the player affects.

The stronger inherited rendering demonstrates why rebuilding every shader from
scratch was wasteful. It does not demonstrate a Three.js advantage over a matched
PlayCanvas implementation: the content and render paths differ. It also does not
prove that more shader features would fix the remaining failures.

## Consequences for the general system

These are observed production constraints, not a newly implemented universal kit:

- A reusable style family must bind **form, palette/material behavior, lighting,
  proportions, camera composition and placement rules**. Merely passing vertex
  colors did not control the source foliage palette: its shader imposed green.
- Render reuse needs visible validation. The first water failure was original
  scene geometry covering the water, not a shader capability gap. Source checks
  and screenshots must be interpreted together with live inspection.
- Interaction design must distinguish **arrival, player action, world response
  and companion arrival**. Guidance can move the player without resolving the
  meaningful interaction for them. Early exploration must not fabricate payoff.
- Reachable destinations and camera-visible interaction objects are requirements
  for every supported layout. Passing a text overflow check is insufficient.
- Measure a reproduced baseline before adaptation, retain license/provenance and
  freeze weak art attempts. Automated success and added code are not evidence of
  a desirable world. Extract reusable production rules only from a successful
  place, then exercise them on meaningfully different content.

## Next production decision

Change the production method before another world-building round. The concrete
next candidate is **one authored architectural/landscape composition**, built in
Blender or with a suitably licensed modular asset set, preserving the useful
renderer and control baseline. Start with the actual arrival-to-lightwell view:
a distinctive traversable building edge, deliberate canopy framing, visible water
and a clearly readable companion/interaction. Inspect its graybox at desktop and
portrait camera positions before material/detail work. Do not spend another round
on generic procedural city dressing or extend the district.

This is a proposed next method, not a claim that Blender guarantees quality or
authorization for paid assets/providers. Its purpose is to give geometry and
composition direct control rather than making all forms out of code primitives.
A different builder can be compared later only with available access and an
explicit execution/budget policy. Existing learning, save and interaction work
should be retained; no broad rewrite is justified.

The verification report records exact tested files, functional repairs, cost
measurements and their limits. Any future integration still requires application
tests, actual play-state presentation checks and one fresh-context Astra critic
across all lanes, followed by the user's judgment.
