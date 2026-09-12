# Current story candidate — Relay Rescue: The Echo Forge

**Candidate:** story-v2 / 10 September 2026  
**Story status:** frozen story treatment; story-only critic previously passed.  
**Runtime direction updated:** 12 September 2026 for Play Canvas + reusable world-package architecture.  
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

## Realization direction — Play Canvas first

The story treatment remains renderer-neutral, but the current reference realization uses **Play Canvas** as the persistent game surface and the shared Story3D subsystem when Three.js is active.

The target is not “six separate slides” and not even “six separate Three.js scenes.” It is a continuous world whose state/camera/composition changes as the player navigates the six beats.

For the current compatible Echo Forge path:

1. Play Canvas owns one stable stage.
2. Echo Forge world package/runtime mounts once where practical.
3. Back/Continue selects coherent story states/camera compositions.
4. The final story state transitions into Signal 1 on the same Play Canvas/world/runtime instance.
5. Signal 1 updates authoritative mission visuals instead of opening a different lesson page.
6. Later compatible signals should continue the same lifecycle as migration progresses.

Ambient/scene motion can be paused/replayed. Reduced-motion mode preserves the same reversible causal states without requiring camera/object animation.

## World-package/framework direction

Echo Forge is a **reference world**, not a hard-coded engine template.

Current authored implementation may use `rescue-story3d.js`, but reusable renderer/camera/device/lifecycle logic belongs in `story3d-runtime.js` / `story3d-world-host.js` under Play Canvas.

Future generated stories should increasingly express their world as versioned data-first packages: scene/entities, visual states, camera compositions, semantic interaction anchors, approved assets and fallback metadata. A custom adapter should be exceptional rather than the default generated output.

Nothing about Pip, Echo Forge, `order-01`, gears, embers or floating islands may leak into generic Play Canvas/runtime/host contracts.

Replacing this world later must not change canonical competency IDs or legitimate learner evidence/history.
