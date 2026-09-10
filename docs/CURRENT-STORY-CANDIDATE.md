# Current story candidate — Relay Rescue: The Echo Forge

**Candidate:** story-v2 / 10 September 2026  
**Status:** story-critic candidate; runtime realization follows only after the story gate.  
**Current generation input:** the retry-safety topic/outcomes plus a fixed broad-audience quality target. No personal story-preference profile is used yet.

## Story promise

A tiny courier named Pip is almost home across a chain of floating islands when the old bridge breaks. Pip sends one sealed order to the mysterious Echo Forge for exactly one replacement gear. The Forge may already have finished it, but lightning destroys the returning reply. Pip is tempted to send a fresh seal. The player awakens an old signal tower and must help Pip recover what really happened before a duplicate order burns another scarce emergency ember that another storm-damaged island may need.

This fantasy exists because it naturally carries the target reasoning: one intention, a durable identity, an uncertain acknowledgement, a real effect that may already exist, duplicate risk, finite memory, authoritative records, safe pause/recovery, and finally a policy that survives a different real-world context. The story is not allowed to change those semantics.

## Tone and audience

Stylized luminous tech-fantasy: mysterious rather than grim, warm character humor rather than childish jokes, visually beautiful floating-island scale, and a small vulnerable protagonist whose confidence makes the first mistake tempting. A bright child should be able to follow the causal story, while teens/young adults should still see a coherent atmospheric world rather than a children’s worksheet.

## Focal character

**Pip** is a small brass courier automaton with a red scarf, expressive light-eyes and a habit of saying “easy” just before something becomes difficult. Pip wants to finish the last crossing before dark and reconnect the valley. Pip is capable and brave but impulsive enough that “just send another order” feels emotionally believable.

The player is not a spectator or invisible quiz-taker. The storm wakes an old signal tower for the player: a **Signal Keeper** who can see traces Pip cannot. Pip asks the player for help and then follows the player’s investigations/decisions.

## World rules that matter

- Seven floating islands are connected by bridges and signal towers.
- The **Echo Forge** shapes physical repair parts from scarce emergency embers.
- A bridge needs exactly **one** replacement gear.
- A stamped seal such as `order-01` tells the Forge which single job a request belongs to.
- The Forge can complete a job even when the returning reply is lost.
- A fresh seal can look like a fresh job and therefore cause a second effect.
- The Forge remembers seals for a limited time; older uncertainty needs a separate ledger/reconciliation path.
- The storm has damaged more than Pip’s bridge, so wasting an ember has visible opportunity cost elsewhere in the valley.

These are fantasy-facing statements of the underlying retry model, not invented mechanics that contradict it.

## Opening — six scenes in one continuous world

### 1. The valley of seven lights — hook

A camera glides across floating islands and seven beacon towers. Pip hurries toward the bridge while the far islands begin to glow for evening.

**Pip:** “One more crossing. Easy.”

The bridge gives a metallic scream.

**What the audience should feel:** beauty, scale, immediate affection/amusement for Pip, then surprise.

### 2. The break — concrete need

The center mechanism cracks; the bridge halves sag apart. The broken gear is visible in the mechanism.

**Pip:** “…I may have spoken too soon.”

The scene makes one fact obvious before naming any system concept: the bridge needs one replacement gear.

### 3. The Echo Forge — one promise

Pip stamps `order-01`. The seal flies across the valley. The distant Forge wakes, furnace light blooms, and one gear is shaped from an ember.

**Pip:** “Echo Forge: one bridge gear. Seal order-01.”

The seal is introduced by function: it means *this one job*.

### 4. The silence — mystery

The finished gear remains visibly inside the Forge. A bright reply starts home. Lightning cuts the signal; the reply vanishes halfway across while the gear remains.

**Pip:** “Forge? …Did you make it?”

The audience should understand without technical vocabulary that silence changed Pip’s knowledge, not necessarily the world.

### 5. The temptation — stakes

Pip reaches toward a red seal press. The scene previews a second ghost gear forming and one more emergency ember dimming. Other damaged signal towers are visible in the distance.

**Pip:** “I could just send another order…”

The point is not abstract duplication. Another seal could spend another scarce ember on a gear nobody needs while another island remains dark.

### 6. The first signal — player entry

The old tower beside Pip wakes and threads of light reveal the route that lightning hid. Pip turns toward the player/camera.

**Pip:** “You can see the echoes, can’t you? Help me find out what happened.”

The first action is deliberately simple: inspect the Echo Forge before sending anything.

## Chapter progression

1. **The Echo Forge went silent** — learn that a missing reply is uncertainty and safely recover the same order.
2. **A new body, the same promise** — Pip restarts/repairs, but the job identity must survive the new worker body.
3. **The parcel changed under the same seal** — the same identity cannot silently change meaning.
4. **The Echo Forge forgot the old seal** — memory is finite; the earlier simple retry rule no longer applies forever.
5. **The valley ledger goes dark** — authoritative evidence can itself be unavailable; unknown is not absence and safe waiting becomes meaningful.
6. **Weave the storm route** — the player combines the discovered rules into a route/policy and tests it against several storms.
7. **Beyond the valley** — the fantasy falls away enough to expose a novel export-worker incident. The player must transfer the same reasoning without relying on Pip/gear wording.

The progression changes the situation rather than repeating “lost reply” with new captions: identity, meaning, memory, evidence availability, construction, then transfer each add one new burden.

## Intended payoff

Restoring the route lights the seven towers in sequence and lets Pip cross. The Echo Forge’s remaining embers are visibly preserved for the other islands. Pip’s small first problem becomes evidence that the player can repair a larger class of uncertain systems.

The ending should open a new possibility rather than close on a report: the valley route connects to an unfamiliar real system and asks the player to carry the learned rule beyond the fantasy.

## Realization direction

The preferred current realization is a single continuous **Three.js story world**, not six independent slides. Back/Continue changes camera, object state and the dramatized event in the same world. The player controls pacing. Ambient/scene animation can be paused/replayed, and reduced-motion mode keeps the same reversible story states without camera/object motion.

A CSS/semantic fallback preserves every causal fact if WebGL is unavailable. 3D is being used to improve world presence, spatial causality and attachment; it does not earn story or learning credit by itself.
