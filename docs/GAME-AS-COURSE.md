# The game is the course

Active user amendment — updated 10 September 2026. The current user is the sole real product reviewer during private refinement; their explicit verdict overrides critic/agent/automation scores. The product is a game whose meaningful play delivers intended course outcomes, ideally better than an ordinary course, with experience treated as essential rather than optional polish.

## Story before gameplay realization

VibeLearn should not begin with lesson mechanics and attach a thin narrative afterward. For every course/subject, first create a **good story/fantasy/world premise** capable of carrying the learning experience. Story is a first-class artifact with its own quality gate; see [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md).

The current Relay Rescue opening was explicitly rejected by the user at **3/10 for first-touch/story quality**. The failure was not merely animation speed: the story was lazily told, unclear, too slide-like, lacked back navigation, moved too quickly, and failed to create enough attachment/curiosity for kids or young adults. Previous critic scores do not override that verdict.

The target pipeline is:

`course topic/outcomes -> story/fantasy -> story critic >=9 -> gameplay/world realization -> game critic >=9 -> learning/transfer gate -> user review`

The story critic evaluates exactly one frozen story at a time and judges the story itself: hook, causality, character attachment, world appeal, storytelling quality, pacing/progression, stakes, payoff, and cross-age engagement. It does not get to compensate with code quality, curriculum value, Three.js, tests, or implementation effort.

**Current story generation is topic-driven.** The story/fantasy is chosen from the course topic/outcomes and their natural causal structure; learner creative preferences are not an input yet. Long term, an explicit learner-controlled preference profile should be able to influence genre, tone, realism/fantasy balance, world type, character style, visual style, pace, humor/darkness, exploration/action preference, and narrative density without changing learning integrity.

## Earn attention before demanding cognition

The opening of a VibeLearn game should behave like a good commercial game: **capture attention with creativity, beauty, character, mystery, atmosphere, movement, interaction, or another subject-appropriate hook before raising cognitive load**. A player should want to inhabit the world before being asked to reason deeply about it.

Then increase load deliberately:

`story hook / wonder -> character + world desire -> concrete need -> one obvious action -> visible consequence -> easy recovery/success -> name the concept -> variation -> combination -> transfer`

The first/tutorial chapter is both a story/world-model chapter and an interaction-grammar chapter. By its end, even a child or novice should be able to explain who/what matters, what they want, the important objects and their functions, what happened before the player arrived, what changed, what remains uncertain, why the wrong action matters, and what the player can do first. A glossary or briefing wall is not an acceptable substitute.

Formal terminology should arrive after the player has a concrete mental model when faithful. For Relay Rescue, understand the story and causal world first; only then name `idempotent retry`.

## First-touch story control is part of game quality

A cinematic/story sequence is still interactive product UX. The player must not be trapped inside a rushed slideshow.

For first-run openings, **Back/previous is mandatory**. User-paced next/continue is the default. Provide pause/resume when animation is active, skip, replay, and visible progress/chapter position. If autoplay exists, it is optional, slow enough for the beat to land, and pauses when the player interacts. Back/forward navigation must reconstruct coherent world/story state. Reduced-motion mode preserves both causal meaning and navigation.

Do not repair weak storytelling by merely increasing display duration. The story must be dramatized through action, scene change, dialogue, discovery, conflict, consequence, character behavior, or direct interaction rather than being a sequence of explanatory captions.

## Review method

For current private Phase 1 refinement, available-tool/internal criticism may be used while a genuinely separate reviewer is unavailable, but it must be labeled honestly. The story critic, game critic, and learning/transfer review are **separate gates** and must not borrow points from each other.

The current target remains **>=9.0/10 before rounding** for each applicable critic gate, no critical blocker, followed by explicit user acceptance. A machine/critic 9+ means only that the candidate can move to the next gate or user review; it never overrides the user's judgment.

## Product promise and honest limits

The intended product is a game that teaches through what the player does, not an ordinary course interrupted by minigames and not a lesson UI with graphics behind it. Gameplay, world responses, puzzles, construction, investigation and decisions carry the target thinking. Explanations, dialogue and references support those experiences at the point of need.

The desired learning endpoint is the same useful knowledge and capabilities that a well-specified course promises. Matching syllabus words is not matching outcomes. A short retry rehearsal is a reference slice, not a replacement for a full reliability/distributed-systems course. Equivalent or superior learning effectiveness remains unvalidated until appropriately designed learner evaluation exists.

## Independent product gates

1. **Story/world:** the audience cares, understands the causal situation, wants to see what happens next, and can imagine inhabiting the world.
2. **Game experience:** the player wants to act, explores meaningful choices, receives satisfying feedback, learns consistent rules, recovers from failure, progresses, and earns a resolution.
3. **Learning outcomes:** intended capabilities have supported content, purposeful practice and defensible assessment, including fresh transfer and delayed retrieval where claimed.

Do not average these gates. A great story with weak play fails. A delightful game with shallow learning fails. A rigorous lesson with no desire to continue also fails.

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

Freeze and review the story before expensive gameplay realization. After story pass, freeze one playable slice and inspect fresh entry, first action, error, recovery, harder encounter, ending, and genuine replay. Record likely abandonment points for younger non-specialists and young adults separately.

Human final review remains essential. Do not substitute streak pressure, shame, fake urgency, grinding, or compulsory rewards for curiosity, attachment, and earned competence.

## Three.js / 3D decision

Three.js is a serious design option for **attention, immersion, world attachment, spatial storytelling, character presence, atmosphere, discovery, and direct play**, not only for subjects whose learning mechanic mathematically requires 3D.

For story realization, actively compare authored 2D animation, 2.5D/parallax, and interactive Three.js 3D. A 3D world can be worthwhile if it gives the intended kid/teen/young-adult audience a stronger desire to explore and care about the story.

But 3D cannot rescue weak writing or weak game rules. A technically impressive scene with an unclear story still fails the story gate. Keep locally served verified assets, same-origin runtime, realistic mobile performance targets, keyboard/touch equivalence, reduced-motion behavior, and a usable fallback. The renderer never awards learning evidence.

## Documentation feedback loop

User feedback that changes story direction, onboarding/progression, acceptance, generation, UI/UX, or rollout boundaries must be written into the relevant repository docs in the same implementation unit. Code behavior and product documentation must not intentionally diverge.

## Scope

This amends current private Phase 1 product refinement and future course-generation requirements; it does not authorize Phase 2/3 implementation. Preserve historical content/evidence and the checksummed design bundle. No external testers, paid resources, public rollout, or relaxation of hosted security is authorized without explicit user approval.
