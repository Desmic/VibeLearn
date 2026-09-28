# Sky Reach: direct play and the two product promises

28 September 2026. Reference: [Sky Reach on Tesana](https://tesana.com/game/sky-reach),
by jonesiller. This is root Astra's reference study, not a VibeLearn critic verdict.
The user requests both an excellent game and an excellent learning experience,
and specifically asks us to examine travel beyond the starting world.

## What was actually observed

I opened the public game without signing in, read its visible controls, and played
through the connected Playwright browser using clicks and keyboard presses/holds.
No game source, hidden state, gameplay APIs, teleports or save edits were used.
No cloud session was provisioned; the browser tool exported captures into this
workspace. The site description was read before play, so this is informed reference
exploration, not a cold study. Captures span roughly 23:12–23:28 UTC on 27 September
(28 September locally). Tool-call time is not continuous successful playing time.

Observed sequence:

- The menu opens over a rendered landscape: green terrain, sandstone arches and
  spires, atmospheric depth, a white/orange ship and a huge ringed body overhead.
- Launching gives a named destination and light beacon. Throttle/climb/boost and
  steering change the ship's view, speed, altitude and distance to the destination.
- Landing attempts yielded useful speed and altitude constraints. I did not
  successfully land, collect a core, mine or play on foot. Steering/ascent took
  experimentation; do not describe this session as uniformly effortless control.
- The system map exposes Elysia, Sahra, Nivalis, Vesper and Cinder with different
  environment descriptions. The first attempted mouse selection of Sahra failed
  with an intercepted-pointer timeout. A later keyboard target cycle succeeded.
- Sustained ordinary flight took me from Elysia's surface region through a darkening
  sky into **Open space**. The HUD changed from the local spire to distant world
  markers and a pulse-drive prompt; one observation showed about 20 km altitude.
- Cycling the target selected Sahra. Activating the pulse drive produced a visible
  flight effect and a later capture showed 32.0 km/s, 94.6 km altitude, fuel 64%.
  I did not arrive at Sahra; its distance was increasing because I had not aligned
  the ship. Activation is observed, interplanetary arrival is not.
- The in-game credits identify Three.js/WebGL. They did not establish asset origins,
  prompts, generation effort, cost, code quality or how much a human authored.

Screenshots were captured during live play and visually inspected:

| Capture | Observation |
| --- | --- |
| `artifacts/reference-sky-reach-20260928/01-surface-flight.png` | Flight near arches and beacon, 66 m/s, 141 m altitude |
| `artifacts/reference-sky-reach-20260928/02-system-map.png` | Five selectable world destinations and the central gas giant |
| `artifacts/reference-sky-reach-20260928/03-open-space.png` | Open-space HUD, distant worlds, pulse prompt, 22.1 km altitude |
| `artifacts/reference-sky-reach-20260928/04-pulse-flight.png` | Pulse effect and 32.0 km/s flight |

Original tool screenshots remain in `.playwright-mcp`; copied-file hashes are in
the artifact folder. One run-code result string prematurely said another world had
been selected after the failed map click; the actual tool failure and later HUD
override that string. Only the later T-key change establishes Sahra selection.
My game tab was closed after capture. No video, audio-quality review, mobile play,
completion, educational assessment or performance benchmark is claimed.

## What transfers to VibeLearn

### Procedural generation is a material part of the reference

The user explicitly highlights that Sky Reach is procedural. Its public game
page also lists **Procedural Generation**, preserved in the initial accessibility
snapshot `.playwright-mcp/page-2026-09-27T23-12-19-320Z.yml`. This should have been
called out in the original study. The play session proves the observed experience;
it does not identify which terrain, placement, encounters or assets are generated,
whether new runs vary, or the algorithm/seed and authoring effort. No implementation
audit was performed. Do not infer repeated live model calls from the procedural tag.

For VibeLearn, this makes reusable procedural rules an explicit candidate for world
realization, alongside authored modular assembly and optional external generators.
Consider a small generator that arranges validated terrain/rooms/landmarks and
assets under a reviewed topology/style specification. It can reuse existing engine
facilities and libraries; it need not become a universal generator or a prerequisite
for repairing the current game. Assess the actual authoring/integration/review cost,
not just generated acreage or number of seeds.

The next integrated brief should distinguish deliberately designed decisions,
relationships and reveals from safe variation in layout, dressing or task context.
Learning outcomes, semantic IDs, feedback truth and assessment authority stay in
the canonical specs. Variation must preserve reachable goals, readable evidence,
collision/navigation and recovery; it must not silently change difficulty or reveal
an answer. A changed layout alone is not evidence of conceptual transfer.

When a procedural prototype is warranted, pin the seed, generator version,
parameters, assets and resulting package identity for replay/review/save stability.
Use a small bounded set of contrasting seeds/layouts, including cases not used to
tune the generator. Apply cheap invariant checks before active play; test whether
the variation produces worthwhile choices and coherent beauty rather than repeated
filler. Existing world/spec and artifact boundaries should carry this information;
do not add a provider framework just to demonstrate a generator.

The important achievement is a connected playable promise. A destination attracts
attention, the player can move toward it, controls change the experience, and the
world opens into a new scale with new actions. Leaving the surface made an apparent
backdrop part of the playable space. Consistent ship/world/interface identity,
landmark silhouettes, lighting and distance help make that promise legible.

This is stronger evidence of ambition than a promotional image, but not proof that
Sky Reach has sustained depth or excellent learning. Its controls and landing
friction should also inform our onboarding. Its screen-corner HUD is not a reason
to copy that presentation into VibeLearn or reverse the user's situated-information
requirement. The transferable point is that the world remains the main activity.

Our proof currently has stronger explicit learning/evidence boundaries than game
appeal has been demonstrated to have. The successive reviews document a procedural
lesson over a world, thin relationships and an unresolved larger interaction
treatment. Repairing inspection and labels is necessary but cannot establish the
target experience. Matching Sky Reach's planet count, engine or genre would not
resolve that gap. A compact place can still offer desire, discovery, agency and payoff.

## Apply both promises inside the existing design/review loop

Before the next gameplay expansion, the encounter brief must answer both:

1. **Game promise:** What would make the player want to act, experiment or return
   without XP or a lesson-completion obligation? Name the interesting verb, choice,
   visible response, uncertainty/discovery and payoff. Assess in actual play.
2. **Learning promise:** What target understanding improves that decision? Show
   the causal link, the likely misconception, meaningful feedback and a changed
   problem where the learner must use the understanding with less help. Preserve
   first attempts; controls, reading skill and motor difficulty must not masquerade
   as conceptual mastery. Novice learning/retention require learner evidence.

The same activity must connect these promises. A knowledge question that merely
unlocks unrelated fun, or spectacle with educational narration, does not by itself
demonstrate the intended integration. Orientation, breathing room and narrative
beats need not assess knowledge; judge the coherent experience, not every click.

Keep the existing separate gameplay/art/story/learning critic judgments. Add these
questions to their existing evidence, not a new agent fleet, average score or schema.
One strong side cannot compensate for an unproven other side. Reviewer enjoyment is
not a proxy for novice outcomes, and test passes are not a proxy for either promise.

## Bounded next action

Sol finishes the current coherent repair checkpoint and records remaining gates.
Then reopen the original experience treatment with one small integrated brief,
starting at the opening/prologue as required by the current journey. Preserve the
learning outcomes; propose how shared action/relationship, a visible invitation,
world discovery and the learning decision form a motivating loop. Use existing
world/runtime components and suitable pinned assets. Obtain exact-design review
before implementing a changed mechanic/sequence. Prototype and play the smallest
coherent slice before expanding the tutorial or Level 1 treatment. No Level 2,
new engine, broad generator rewrite or deployment is implied.

If model capabilities improve and generation becomes cheaper, producing executable
content alone is an increasingly weak product proposition. Our working strategy is
to improve selection, learning design, art direction, playtesting and adaptation
around the learner, measuring total effort to an accepted experience. This is a
strategic inference, not a forecast of specific model prices or dates.
