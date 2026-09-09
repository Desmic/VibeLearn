# The game is the course

Active user amendment — updated 9 September 2026. The current user is the sole real product reviewer during private refinement; their explicit verdict overrides critic/agent/automation scores. The product is a game whose meaningful play delivers intended course outcomes, ideally better than an ordinary course, with experience treated as essential rather than optional polish.

## Latest direction: earn attention before demanding cognition

The opening of a VibeLearn game should behave like a good commercial game: **capture attention with creativity, beauty, motion, character, mystery, or another subject-appropriate hook before raising cognitive load**. A player should want to look at the world before being asked to reason about it.

Then increase load deliberately:

`beauty / curiosity -> character + concrete need -> one obvious action -> visible consequence -> easy recovery/success -> name the concept -> variation -> combination -> transfer`

The first/tutorial chapter is a world-model chapter. By its end, even a child or novice should be able to explain who/what needs help, what they want, what the important things are, what each thing does, what already happened, what became uncertain, why the wrong action matters, and what the player should do first. Animation/direct manipulation should communicate cause and function where possible; a glossary or briefing wall is not an acceptable substitute. Essential meaning must remain available with reduced motion.

Formal terminology should arrive after the player has a concrete mental model when faithful. For the Relay Rescue reference: first understand Pip, bridge, gear, workshop, ticket, already-sent order, missing reply and duplicate risk; only then name the idea `idempotent retry`.

This is now a generation requirement as well as an authored-reference requirement. See [GAME-UX-SYSTEM.md](GAME-UX-SYSTEM.md) and [COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md).

## Review method

For the current private Phase 1 refinement, Codex availability is not a blocker to useful review or iteration. Use rendered browser journeys, screenshots, traces, adverse-path tests and a deliberately separated frozen-rubric critic pass. State what the reviewer could observe. Label internal fallback honestly; do not call it an independent agent or human playtest.

The target remains **>=9.0/10 before rounding** for both game experience and learning/real-world transfer, no critical blocker, then explicit user acceptance. A machine/critic 9+ only means ready for user review; it does not override the user's judgment.

## Product promise and honest limits

The intended product is a game that teaches through what the player does, not an ordinary course interrupted by minigames and not a lesson UI with a 3D background. Gameplay, world responses, puzzles, construction, investigation and decisions carry the target thinking. Explanations, dialogue and references support those experiences at the point of need.

The desired learning endpoint is the same useful knowledge and capabilities that a well-specified course promises. Matching syllabus words is not matching outcomes. A short retry rehearsal is a reference slice, not a replacement for a full reliability/distributed-systems course. Equivalent or superior learning effectiveness remains unvalidated until appropriately designed learner evaluation exists.

## Two independent product gates

1. **Game experience:** the player understands the goal, wants to act, explores meaningful choices, receives satisfying feedback, learns consistent rules, recovers from failure and earns a resolution. The reason to continue survives hiding XP.
2. **Learning outcomes:** intended capabilities have supported content, purposeful practice and defensible assessment. The player can apply ideas beyond the exact rehearsed sequence, with help/exposure accounted for, and demonstrate retention later where claimed.

Do not average these gates. A delightful but shallow game fails the learning promise; a correct but tedious lesson fails the product. Rewards/story completion are not mastery.

## Course-to-game coverage contract

Each versioned course package includes a coverage ledger:

`outcome -> prerequisite -> mechanic -> player decision -> causal feedback -> varied practice -> transfer assessment -> delayed retrieval -> evidence limits`

For every row, specify what the learner should actually be able to predict, explain, diagnose, construct or implement, and which game action demands that operation. State where scaffolding fades and which rule combinations are new. Track assistance separately from repetitions and prior family exposure. Identify unassessed outcomes explicitly.

Player-facing progression remains readable: discover one rule -> easy application -> meaningful variation -> combine rules -> unfamiliar challenge -> resolution. Underneath it, the course has an inspectable competency/assessment blueprint. For technical skills, authentic code/design work can be part of the game when relevant.

## Current retry reference: what must be taught and checked

| Intended capability | Suitable play | Required assessment beyond rehearsal |
|---|---|---|
| Distinguish an unknown acknowledgement from a failed effect | Observe courier and workshop separately; investigate missing message | Fresh case without revealed answer; explain uncertainty |
| Preserve business intent through restarts | Recover/reuse an order ticket across courier changes | Diagnose a different identity failure and construct durable intent handling |
| Respect finite deduplication retention | Manipulate time; see an expired ticket behave differently | Boundary/late-arrival cases with unfamiliar timing |
| Keep ticket identity bound to payload meaning | Alter the order and observe a conflict | Changed-parameters case before worked result is shown |
| Reconcile outcomes and preserve unknown state | Inspect a distinct authoritative record; distinguish committed/absent/unavailable | Safe and live behavior on novel known-absent and uncertain cases |
| Build a defensible retry contract | Construct rules, run disruptions and revise from feedback | Fresh policy counterexamples and authentic implementation/design artifact where promised |
| Retain and transfer the idea | Return later to a new situation with less scaffolding | Delayed retrieval and non-gear context, not memorized replay |

## Experience assurance in practice

Use one small playable slice as the acceptance unit. Freeze build/rubric, observe a fresh start, error, recovery, harder encounter, ending and genuine replay. Record likely abandonment points for younger non-specialists and young adults separately. Improve actual interaction before increasing art scope.

Design targets, not fabricated measurements: first meaningful action quickly; stable acknowledgement; no forced timer for untimed reasoning; no repeated confirmation forms between trivial actions; familiar rules recombined before new ones appear. Measure device performance separately from headless CI.

Human final review is essential. Do not substitute streak pressure, shame, fake urgency, grinding or compulsory rewards for curiosity and earned competence.

## Three.js decision

Use 2.5D/3D only when direct object manipulation, spatial relationships or visible system behavior improve the learning action. Three.js is a renderer/scene library, not a replacement for game rules, input design, progression or assessment. The renderer projects authoritative state and never awards learning evidence.

Keep equivalent keyboard/touch semantics and a usable fallback. Do not force all generated subjects into 3D or one fantasy template.

## Documentation feedback loop

User feedback that changes design direction, onboarding/progression, acceptance, generation or rollout boundaries must be written into the relevant repository docs in the same implementation unit. Code behavior and product documentation must not intentionally diverge.

## Scope

This amends current private Phase 1 product refinement and future course-generation requirements, not authorization to implement Phase 2/3. Preserve historical content/evidence and the checksummed design bundle. No external testers, paid resources, public rollout or relaxation of hosted security is authorized without explicit user approval.
