# Current story candidate — Relay Rescue: The Echo Forge

**Candidate:** story-v2 / 10 September 2026  
**Story status:** frozen story treatment; story-only critic previously passed, but the user's rejected first-touch verdict remains authoritative for realized experience.  
**Runtime direction updated:** 12 September 2026 for PlayCanvas Engine + engine-neutral generated-world architecture.  
**Current generation input:** retry-safety topic/outcomes plus a fixed broad-audience quality target. No personal story-preference profile is used yet.

## Story promise

A tiny courier named Pip is almost home across a chain of floating islands when the old bridge breaks. Pip sends one sealed order to the mysterious Echo Forge for exactly one replacement gear. The Forge may already have finished it, but lightning destroys the returning reply. Pip is tempted to send a fresh seal. The player awakens an old signal tower and must help Pip recover what really happened before a duplicate order burns another scarce emergency ember that another storm-damaged island may need.

This fantasy naturally carries the target reasoning: one intention, durable identity, uncertain acknowledgement, an effect that may already exist, duplicate risk, finite memory, authoritative records, safe pause/recovery, then a policy that survives a different real-world context. Story is not allowed to change those semantics.

## Tone and audience

Stylized luminous tech-fantasy: mysterious rather than grim, warm character humor rather than childish jokes, beautiful floating-island scale, and a small vulnerable protagonist whose confidence makes the first mistake tempting.

A bright child should follow the causal story while teens/young adults still encounter a coherent atmospheric world rather than a children's worksheet.

## Focal character

**Pip** is a small brass courier automaton with a red scarf, expressive light-eyes and a habit of saying “easy” just before something becomes difficult. Pip wants to finish the last crossing before dark and reconnect the valley. Pip is capable/brave but impulsive enough that “just send another order” feels emotionally believable.

The player is a **Signal Keeper**, not an invisible quiz-taker. The storm wakes an old signal tower that lets the player see traces Pip cannot. Pip asks for help and follows the player's investigations/decisions.

## World rules that matter

- Seven floating islands are connected by bridges and signal towers.
- The **Echo Forge** shapes physical repair parts from scarce emergency embers.
- Pip's bridge needs exactly **one** replacement gear.
- A stamped seal such as `order-01` identifies which single job a request belongs to.
- The Forge can complete a job even when the returning reply is lost.
- A fresh seal can look like a fresh job and therefore cause a second effect.
- The Forge remembers seals for a limited time; older uncertainty needs ledger/reconciliation.
- The storm damaged more than Pip's bridge, so wasting an ember has visible opportunity cost elsewhere.

These are fantasy-facing statements of the retry model, not mechanics that contradict it.

## Opening — six states in one continuous world

### 1. The valley of seven lights — hook

Camera glides across floating islands and seven beacon towers. Pip hurries toward the bridge while distant islands begin to glow for evening.

**Pip:** “One more crossing. Easy.”

The bridge gives a metallic scream.

**Audience feeling:** beauty/scale, affection/amusement for Pip, then surprise.

### 2. The break — concrete need

The center mechanism cracks; bridge halves sag apart. The broken gear is visible.

**Pip:** “…I may have spoken too soon.”

One fact is obvious before any system jargon: the bridge needs one replacement gear.

### 3. The Echo Forge — one promise

Pip stamps `order-01`. The seal travels across the valley. The distant Forge wakes, furnace light blooms, and one gear is shaped from an ember.

**Pip:** “Echo Forge: one bridge gear. Seal order-01.”

The seal is introduced by function: it means *this one job*.

### 4. The silence — mystery

The finished gear remains visibly inside the Forge. A bright reply starts home. Lightning cuts the signal; the reply vanishes halfway while the gear remains.

**Pip:** “Forge? …Did you make it?”

The audience should understand without technical vocabulary that silence changed Pip's knowledge, not necessarily the world.

### 5. The temptation — stakes

Pip reaches toward a red seal press. The scene previews a second ghost gear forming and another emergency ember dimming. Other damaged towers remain visible in the distance.

**Pip:** “I could just send another order…”

The danger is concrete: another seal could spend another scarce ember on a gear nobody needs while another island stays dark.

### 6. The first signal — player entry

The old tower beside Pip wakes and threads of light reveal the route lightning hid. Pip turns toward the player/camera.

**Pip:** “You can see the echoes, can’t you? Help me find out what happened.”

The first action is deliberately simple: inspect the Echo Forge before sending anything.

## Chapter progression

1. **The Echo Forge went silent** — missing reply is uncertainty; recover the same order safely.
2. **A new body, the same promise** — Pip restarts/repairs, but job identity survives the new worker body.
3. **The parcel changed under the same seal** — same identity cannot silently change meaning.
4. **The Echo Forge forgot the old seal** — memory is finite; simple retry does not apply forever.
5. **The valley ledger goes dark** — authoritative evidence can be unavailable; unknown is not absence and waiting can be correct.
6. **Weave the storm route** — combine discovered rules into a recovery route/policy and test several storms.
7. **Beyond the valley** — enter a novel export-worker incident and transfer the same reasoning without gear/Pip wording.

Progression changes the situation rather than repeating lost-reply captions: identity, meaning, memory, evidence availability, construction and transfer each add a new burden.

## Intended payoff

Restoring the route lights the seven towers in sequence and lets Pip cross. The Echo Forge's remaining embers are preserved for other islands. Pip's small first problem becomes evidence that the player can repair a larger class of uncertain systems.

The ending opens a new possibility: the valley route connects to an unfamiliar real system and asks the player to carry the learned rule beyond the fantasy.

## Realization direction — real PlayCanvas Engine, continuous playable world

The story treatment remains engine-neutral. The Phase 1 reference is now realized with the **actual PlayCanvas Engine** through the engine-neutral `WorldSpec -> PlayCanvas backend` path in `docs/GAME-RUNTIME-ARCHITECTURE.md`.

The target is emphatically not “six slides over a renderer.” It is one continuous playable world whose camera, entities, interactions, consequences and information layers change as the player advances. Narrative controls may pace the opening, but causal meaning should be dramatized in the world and the player should gain agency as early as clarity allows.

For the current Echo Forge path:

1. `GameRuntime` owns one stable stage while compatible story/mission states are active.
2. An engine-neutral Echo Forge `WorldSpec` is validated and compiled into PlayCanvas entities/materials/lights/cameras.
3. Back/Continue selects reversible world states/camera compositions; important consequences remain visually legible rather than living only in text.
4. The final story state transitions into Signal 1 using the same compatible PlayCanvas world/runtime instance where possible.
5. Signal 1 maps authoritative server state into visible world changes instead of opening a separate renderer or deciding correctness on the client.
6. Signals 2–7 should remain game-native as they become harder; later reasoning/build/transfer must not collapse into a normal themed website.
7. Touch, keyboard, reduced motion, pause/replay, failure fallback and phone composition are runtime contracts rather than story-specific hacks.

The currently checked-in opening UI remains migration material and is **not presumed to satisfy the first-touch gate** merely because the renderer is PlayCanvas. The user's prior 3/10 first-touch verdict remains the baseline until a materially changed verified build is reviewed.

## Generated world/framework direction

Echo Forge is a **reference world**, not an engine template.

Current authored Phase 1 code may contain a small Relay Rescue adapter that maps story/mission semantic state onto `WorldSpec` state/patches. That glue is migration scaffolding. The long-term generated output is validated, versioned data/specs + assets interpreted/compiled by trusted shared runtime code.

The reusable boundary is now approximately:

`StoryWorldSpec + GameDesignSpec + WorldSpec + RuntimeExperienceSpec -> EngineTargetSpec -> EngineCompiler -> PlayCanvas EngineRuntime`

Nothing about Pip, Echo Forge, `order-01`, gears, embers or floating islands may leak into the generic WorldSpec validator, GameRuntime or PlayCanvas backend.

An unrelated synthetic world must compile through the same backend without backend-core edits before the seam is considered proved. Later Unity/Unreal/other backends should be able to consume the same semantic specs without changing LearningSpec or AssessmentEvidenceSpec.

Replacing this world later must not change canonical competency IDs or legitimate learner evidence/history.
