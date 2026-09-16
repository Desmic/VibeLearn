# The First Words — final internal Level 1 critic pass

**Reviewed game candidate:** `6fea8287aa5f078a5836902478320699e54571a9`  
**Exact CI run:** `35138788244` (`Verify hosted pilot`, run 804, success)  
**Method:** internal tool-assisted review of exact-head browser artifacts, source contracts and automated interaction traces.  
**User acceptance:** not determined here; the current user remains the final product critic.

## What was actually inspected

Exact-head artifacts from run 804 were downloaded and inspected rather than relying only on green CI:

- foundation: `game-review-evidence-6fea8287aa5f078a5836902478320699e54571a9-foundation`, artifact `10464805042`, including Bellweather login, Level 1 entry and fail-closed/no-2D-fallback states;
- opening: `...-first-words-opening`, artifact `10464561319`, including 390px normal-motion friendship/capture/trapped-Zip frames plus 360/430/desktop reduced-motion runs;
- controls: `...-first-words-controls`, artifact `10463659939`, including post-save/reload movement/camera evidence;
- readability: `...-first-words-readability`, artifact `10463943206`, including 200% text at 360/390/430;
- lifecycle: `...-first-words-lifecycle`, artifact `10463803238`, including reset-to-opening and logout-to-auth states;
- chapter: `...-first-words-chapter`, artifact `10464950509`, including first success, stale-context failure, recovery, completion and fresh 360/430 reduced-motion completions.

The exact game build also passed the full 152-test application suite in the foundation job. The chapter report recorded no page errors.

## Failures / likely abandonment points considered before ratings

The prior preview had real abandonment risks: old login/world routing, missing reset/logout, too many required quiz steps, a possible failure before the player knew the loop, camera-hunting for route context, a text-heavy completion overlay and a large 200% objective HUD. Those specific issues were retested on the exact candidate.

On `6fea828...` I did **not** find a remaining equivalent blocker in the inspected states. The opening now names Zip and the Warden on the characters instead of adding exposition. The tutorial presents one obvious action at a time and guarantees the first rescue. The tower challenge is the first normal failure/recovery. The route-sign list is the guaranteed path while physical boards remain optional world shortcuts. Completion stays in the 3D world. Reset/logout are first-class menu actions again.

## Criterion judgments and strongest counterexamples

### `world_role_stakes` — 9
Bellweather is named immediately, the player is placed beside Zip, Zip is explicitly labeled, the Warden is explicitly labeled on arrival, speech theft is shown, and the final opening beat leaves Zip trapped with `Help Zip ->` as the only primary continuation.

Counterexample attempted: inspect the phone opening as if character names were unknown and rely only on what is visible. The new ZIP/WARDEN world labels close the prior identity ambiguity without another instruction card.

### `visible_causality` — 9
The opening has visible relationship action -> Warden arrival/voice theft -> Zip trapped, while gameplay has power connection -> lit socket, generated sentence -> gate response, wrong route -> visible wrong state, corrected context -> Star route opens and Zip moves to the route.

Counterexample attempted: pause the capture mid-scene and run reduced-motion phone variants. Both preserve understandable before/after causal states rather than requiring fast animation to communicate the result.

### `attachment_pull` — 9
The level establishes a concrete companion relationship before the task: shared lantern, hand tap, Zip's `Best team in Bellweather!`, Zip pushing the player clear, then a rescue that visibly reunites Zip with the player.

Counterexample attempted: inspect whether the premise collapses into a generic errand if the captions are skimmed. The hand-tap interaction, shared-lantern staging, Zip saving the player and the reunion remain a visible relationship arc. Audience attachment strength is still a human-review judgment, so this is not scored 10.

### `orientation_action` — 9
Entry/login, opening handoff and each tutorial stage have a single dominant action. The tutorial is explicit but short: connect power -> scan Moon plaque -> build sentence -> speak. Optional engine inspection is hidden until after the first win.

Counterexample attempted: look for two competing primary actions in the fresh tutorial. None remain; movement/camera exist but are not prerequisites for the learning loop.

### `hud_readability` — 9
Default phone play preserves a large world view, one short current goal and a bounded bottom engine console. At 200% text on 360/390/430, the objective/console become bounded while a meaningful 3D band remains visible and there is no horizontal page overflow.

Counterexample attempted: inspect the 390px 200% screenshot that previously turned into a reading surface. It is dense, as expected for 200%, but the world, Zip and primary action remain visible and operable. This is accessibility evidence, not an aesthetic 10.

### `controls` — 9
Keyboard movement, accessible directional movement, real Chromium touch-stick movement, touch camera drag, zoom and recenter were exercised after a persisted action and reload. Pause/reduced-motion and audio mute controls also retain state behavior.

Counterexample attempted: repeat the historically broken sequence—save, reload, then use movement/camera controls. The exact controls gate passes without a workaround.

### `meaningful_agency` — 9
The tutorial is intentionally guided, but the tower challenge requires an actual context choice and prediction. Choosing the old route produces the wrong result; choosing today's context changes the generated route and the world consequence. Wrong history is preserved rather than rewritten.

Counterexample attempted: choose stale context on purpose and attempt to progress. The level produces a visible wrong-route state and a simple recovery path; the choice is not cosmetic.

### `progression_recovery` — 9
The level follows the requested easy-to-play progression: guided success first, then changed context, then a normal recoverable mistake, then transfer/completion. It no longer front-loads failure or stacks a second mandatory input-growth quiz.

Counterexample attempted: deliberately fail the first unguided tower challenge. Recovery requires selecting better context and rerunning the learned word loop; it does not erase the first attempt or require a restart.

### `world_continuity` — 9
The same Bellweather world persists from opening through tutorial, reunion, route challenge and completion. Gate/Zip/world state changes match the engine state. Completion leaves the Star route open with Zip present; the optional ending does not automatically cover the payoff. Reset visibly returns to the opening and logout returns to the same Bellweather auth surface.

Counterexample attempted: inspect first-success, wrong-route and completion screenshots for a transition into a detached quiz/page. The engine UI is a HUD over the same world; the world remains visible and stateful throughout.

### `concept_fidelity` — 9
The declared Level 1 idea—context-conditioned next-word generation—is embodied by the mechanic: context is scanned into the engine, output is generated one word at a time, the growing input is visible, and changing context changes the resulting gate command. Optional post-success inspection exposes authored illustrative candidate scores without pretending this toy is a trained LLM.

Counterexample attempted: use stale context in the changed route case. It reliably produces the stale Moon route; current context produces the Star route. The concept is causal rather than merely described in prose.

### `fresh_transfer` — 9
After the guided Moon rescue, the tower case changes the context-selection problem. The useful notice does not state `Star`; it says the Moon route is closed and the tower bell answers the five-point lantern mark, while the world provides the five-point gate mark. The player predicts a gate before generation and can first choose the stale context incorrectly.

Counterexample attempted: try to reuse the tutorial's Moon answer. That produces the wrong-route state. The current solution requires identifying current context and mapping the five-point environmental clue to the new route. This remains immediate transfer, not delayed retention evidence, so it is not scored 10.

## Required coverage

Observed on the exact candidate through the active browser matrix and exact artifacts: fresh entry, first action, deliberate mistake, recovery, later challenge, payoff, transfer, replay, save/resume, controls after save, desktop, 360px phone, 390px phone, 430px phone, touch, keyboard, 200% text and reduced motion.

## Known limits reserved for the user's final review

- I can verify the WebAudio lifecycle, `bellweather-score-v2` scheduling, phase changes, pause/mute state and semantic cues, but I cannot literally listen to the mix in this environment. Musical taste/mix quality must be judged by the user.
- Chromium phone/touch emulation is not a physical Android device performance or ergonomics test.
- This is not a blind novice/young-player study; the reviewer knew the design and source context.
- This level demonstrates opportunity for immediate transfer, not delayed retention or mastery.

These are explicit limits, not observed product failures. The candidate should be handed to the user specifically to judge those human/perceptual questions and provide the final product verdict.
