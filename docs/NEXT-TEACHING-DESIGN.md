# How LLMs Work — current proof learning track

**Authoritative current gate — 19 September 2026:** The design below has been realized far enough to freeze candidate `92a5ecbdc803362ee1554fca6ae811adb155bc26` (run `35434565005`). The next step is independent post-CI criticism, not another speculative design/build pass. Do not churn Zip/naming, prologue, tutorial or Level 1 unless a critic or the user proves a real blocker. Render still serves rejected `ad14c5aced6cf053c7617dfb03245506e1e9dad5`; do not start Level 2. Terminal PM Phase 0 is merged; live orchestration is still externally blocked.

**Active direction — 17 September 2026.** Read `GAME-CREATION-PLATFORM.md`, `LLM-RESCUE-STORY.md`, `GAME-OPENING-PROGRESSION.md`, `ART-WORLD-DIRECTION-CRITIC.md`, `COURSE-GENERATION-GAME-SYSTEM.md` and `STATE.md` first.

This track is the **proof case for the VibeLearn game-creation platform**. The immediate goal is not to mass-produce episodes or build the future multi-agent generator. It is to prove that one learning track can be genuinely appealing, teach real concepts through play, and leave behind reusable worlds/assets/mechanics/critic infrastructure.

## Current player/story model

The player directly controls the robot protagonist. There is no separate literal helper avatar in this track.

`Zip` is a provisional working name. Before the next build, run a stronger naming/character ideation pass informed by memorable robots and characters from film, games, animation, literature and mythology. Extract naming energy, silhouette ideas, humor and archetypes without copying protected characters, designs, dialogue, music or assets. The user's `Wall-G` example is a signal toward recognizable playful energy, not a shipping-name requirement.

## Current opening/progression direction

The next design pass begins from this causal chain:

`happy Bellweather -> dramatic disruption/thunder/teleport -> protagonist and friends displaced -> protagonist alone in dark limbo -> lights reveal an unknown prison/large blocked door -> evil robot visibly removes protagonist speech engine -> player takes direct control -> separate Tutorial/Prologue -> clean success -> Level 1`

The exact fiction can improve during ideation, but the required **before/after contrast, visible antagonist-caused loss, direct protagonist control, separate tutorial, and Level-1 boundary** remain binding unless a clearly stronger reviewed alternative replaces them.

Text/dialogue, camera, animation, lighting, sound/effects and player action must tell the same story beat. The rendered experience—not this document—must communicate the story/stakes.

## Prologue and tutorial are not Level 1

The player should enter the first actual mission already understanding the basic reusable play grammar.

Recommended boundary:

1. **Prologue/story orientation** — show the world worth caring about, disruption, confinement and speech-engine loss.
2. **Tutorial/Prologue play** — teach movement/look/interact/menu and the minimum speech-repair/generation interaction with one obvious action at a time.
3. **Guaranteed practice success** — restore enough capability to open the first way forward.
4. **Level 1** — introduce the first real learning mission/problem, where a normal recoverable mistake may happen.
5. **Payoff/forward pull** — visibly change the world and reveal why the next problem matters.

Later episodes become harder through deeper reasoning, ambiguity, interacting mechanisms, uncertainty and fading scaffolding—not extra UI friction.

## First-season learning arc

The long-term LLM curriculum remains useful, but later episodes are **planning only** until the proof-track opening/tutorial/Level 1 are accepted.

| Episode | Core playable idea | Learning target | Evidence boundary |
|---|---|---|---|
| 1. First Words | Restore/generate short speech commands from visible context | Autoregressive next-token generation depends on available context; plausible output is not automatically correct | Changed-context prediction before feedback; tutorial completion alone is assisted practice |
| 2. Broken Name | Reassemble fragmented messages/labels | Tokenization: tokens can be words, fragments and punctuation; token IDs are representations, not meanings themselves | Reconstruct a new string using the specified tokenizer |
| 3. Bad Lessons | Repair behavior by changing examples/training data | Training updates parameters from examples; memorization differs from generalization | Improve held-out behavior without leaking validation answers |
| 4. Strange Neighbors | Inspect relationships in a representation map | Learned representations encode task-relevant relations; a displayed projection is not literal semantic space | Explain/test an unseen relation without overclaiming human-like understanding |
| 5. Listen Across the Noise | Trace relevant information through a longer message | Attention/contextual representations combine information from positions | Solve a new dependency; explain what attention alone does not prove |
| 6. More Than One Way | Explore multiple continuations and sampling settings | Model outputs are distributions; decoding affects variation; confidence is not truth | Choose strategy for a new creative vs exact task |
| 7. What Did You Ask For? | Compare base completion and instruction-following behavior | Post-training/preferences can change behavior; prompting/context is not ordinary weight training | Find a held-out instruction counterexample |
| 8. Beyond the Machine | Use retrieved facts/tools and verify results | Retrieval/tools provide external information/computation; provenance/evaluation still matter | Solve a fresh source-backed task and identify stale/wrong evidence |

Further topics may include evaluation, bias/data quality, multimodal models, efficiency and agents. None are authorized for implementation before the proof track is strong.

## Level 1 conceptual target

Level 1 should make the following loop concrete through play:

`visible/selected context -> model scores candidate next pieces -> one piece chosen -> piece joins context -> repeat -> world independently validates the resulting command`

The world must not imply that the model sees information that was never provided to it.

A first learning mission should therefore require the player to notice what information the speech engine actually has, make or observe a prediction, and see how changing context changes the continuation/world consequence.

### Honest toy-model boundary

The proof track may use a small deterministic/seeded authored toy model with inspectable distributions. It is not presented as a trained miniature transformer.

- authored scores are illustrative;
- whole-word pieces can be used for readability, with their limitation stated;
- door/world validation is separate from language generation;
- generated fluency is not presented as truth verification;
- physical machinery is an explanatory game metaphor, not a literal transformer diagram.

Canonical concept/evidence rules stay source-grounded and story-independent.

## World and interaction direction

The current review showed that a beautiful scene can still be unpleasant to play when the footprint is cramped. The next proof world should be **larger and calmer**, with deliberate negative space and clear landmarks.

Learning interactions should occupy distinct spatial moments/areas rather than being stacked in a tiny diorama. The platform should parameterize footprint, density, landmark spacing and camera clearance so future tracks can reuse world kits without producing identical cramped compositions.

Use direct manipulation and world consequences wherever faithful. Technical inspection (candidate scores, context contents, terminology) is optional/secondary after the concrete interaction is understood.

## Reusable proof-track extraction

Each accepted chunk should produce reusable capabilities when justified, such as:

- protagonist/control profiles;
- spacious environment/room/zone templates;
- teleport/reveal/cinematic interruption beats;
- lighting/weather/emotional state transitions;
- doors/gates/blocked-route archetypes;
- repair/scanning/context-selection mechanics;
- step-by-step generation visualization;
- tutorial/scaffolding sequences;
- contextual HUD patterns;
- audio/event cue patterns;
- assessment/evidence adapters;
- browser/critic regression fixtures.

Do not generalize a one-off until the current game proves it useful. Reusable pieces must support materially different layouts/themes rather than reskins.

## Critic requirements for this track

Every exact candidate must pass separate disciplines:

- **story/rendered-story critic:** does the experience communicate the written causal story/stakes?
- **art/world-direction critic:** is the world spacious, coherent, unclipped, readable and pleasant to inhabit?
- **gameplay critic:** is the next action obvious, interaction rewarding, progression meaningful and recovery understandable?
- **learning critic:** does the mechanic faithfully require the intended LLM reasoning and support fresh transfer?
- **technical/CI gates:** runtime, persistence, auth, accessibility, device layouts and regressions.
- **user review:** final product authority.

Explicitly distinguish `would stop and look` from `would understand what to do and keep playing`. Visual attraction alone is not a game-quality pass.

## Future agent creation system

VibeLearn should eventually support agents for research, ideation, narrative design, art/world direction, mechanic/game design, learning design, asset selection/generation, implementation/world compilation, independent critics, tests, regression triage and CI/CD/release orchestration.

Do **not** build that system now. Preserve agent-friendly boundaries today through versioned specs, deterministic artifacts, explicit critic roles and reproducible evidence. First prove the manual/tool-assisted workflow on this track.

## Source-grounding boundary

Later episode mechanics need precise authoritative sources and bounded toy implementations before production. The curriculum outline is not evidence that those game mechanics already teach the topic.

Primary background for the current series includes transformer/next-token literature and tokenizer/training references already recorded in the repository. Each episode adds its own source/provenance package before implementation.

## Current implementation status

The deployed September 17 review candidate is **rejected / needs redesign** under `USER-REVIEW-20260917.md`.

Its technical regression infrastructure remains useful, but its opening/player embodiment/world scale/tutorial boundary are not the design to extend.

Next implementation work is only after the current user review is consolidated: redesign the prologue + separate tutorial + Level 1 boundary, then build the prologue as the first coherent chunk. **Do not start Episode/Level 2.**
