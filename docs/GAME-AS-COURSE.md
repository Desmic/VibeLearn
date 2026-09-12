# The game is the course

**Active user amendment · updated 12 September 2026.** The current user is the sole real product reviewer during private refinement; their explicit verdict overrides critic/agent/automation scores.

VibeLearn is a game whose meaningful play is intended to deliver useful course outcomes, ideally better than an ordinary course. Experience is part of the product, not optional polish.

## General system, not one reference game

Relay Rescue is the current authored reference slice. The system target is reusable across subjects/courses through:

`LearningSpec -> StoryWorldSpec -> GameExperienceSpec -> AssessmentEvidenceSpec`

Learning/evidence identity remains independent of Pip, gears, fantasy names, renderer, world-package version or Play Canvas implementation.

## Story before gameplay realization

For every course/subject, first create a **good story/fantasy/world premise** capable of carrying the learning experience. Story is a first-class artifact with its own >=9 critic gate; see `STORY-GENERATION-AND-CRITIC.md`.

The predecessor Relay Rescue first touch was rejected by the user at **3/10**. The failure was not merely timing: storytelling was lazy/unclear and slide-like, Back navigation was missing, progression was too fast, and the opening failed to create enough attachment/curiosity/beauty for kids or young adults.

Current story generation is topic/outcome-driven. Future explicit learner story preferences may shape genre/tone/world/visual direction without altering learning integrity.

## Earn attention before demanding cognition

A VibeLearn opening should behave like a good game: capture attention through story, beauty, character, mystery, atmosphere, movement, interaction or another subject-appropriate hook **before** raising cognitive load.

Default curve:

`hook / wonder -> character + world desire -> concrete need -> one obvious action -> visible consequence -> easy recovery/success -> name concept -> variation -> combination -> transfer`

By the end of Chapter 1 even a child/novice should be able to explain who/what matters, the important objects/functions, what happened, what changed, why it matters, what remains uncertain, what the player did and what success means.

Formal terminology comes after the concrete mental model when faithful.

## First-touch control is part of game quality

First-run narrative progression is user-paced by default. Back/previous is mandatory. Continue, Skip, Replay and visible progress are required where applicable; Pause/Resume while motion runs. Reduced motion keeps equivalent causality/navigation.

Do not “fix” weak storytelling by only extending timers. Story should be dramatized through action, scene change, dialogue, discovery, conflict, consequence and character/world reaction.

## Play Canvas keeps the game continuous

The **Play Canvas** is the persistent game surface/orchestrator. Story, exploration, missions, consequences, progression, construction and transfer should feel like states of one game rather than course pages.

For compatible story/mission states, preserve the same stage/world/runtime and change camera/state/HUD instead of remounting merely because a lesson changed.

Accessible semantic DOM actions/fallback remain required but support the game surface and server-authoritative commands.

## Reusable Three.js framework supports many worlds

Three.js is one optional renderer backend inside Play Canvas. When chosen, use the reusable Story3D framework rather than a course-specific renderer.

The user's explicit direction is that future stories/fantasy settings should be **easy to integrate**. Long term, generated Three.js worlds should primarily be versioned data-first world packages containing scene/entity data, visual states, camera compositions, interaction anchors, approved assets and semantic fallback.

A custom adapter is an exceptional reviewed extension, not the default generated output. New stories should not require story-specific edits to Play Canvas/runtime/host core; genuinely new reusable capabilities are generalized/versioned first.

This infrastructure earns no automatic game-quality points. It exists so many different worlds can be generated safely without coupling them to learning/evidence identity.

## Independent product gates

1. **Story/world:** audience cares, understands the causal situation and wants to continue.
2. **First-touch game:** fresh first 60–90 seconds independently score >=9/no blocker.
3. **Whole-chapter game:** complete chapter independently scores >=9/no blocker.
4. **Learning outcomes:** intended capabilities have purposeful practice and defensible assessment/transfer evidence, scoring >=9 where applicable.
5. **Current user:** explicitly accepts the candidate.

Do not average gates. A great story with weak play fails. Delightful play with shallow learning fails. Rigorous learning nobody wants to continue also fails.

## Course-to-game coverage contract

Each versioned course package includes:

`outcome -> prerequisite -> mechanic -> player decision -> causal feedback -> varied practice -> transfer assessment -> delayed retrieval -> evidence limits`

For every row specify what the learner should actually predict, explain, diagnose, construct, implement or decide, and which game action demands that operation. State where scaffolding fades and which rule combinations are new.

## Current retry reference: required capabilities

| Intended capability | Suitable play | Required assessment beyond rehearsal |
|---|---|---|
| Distinguish unknown acknowledgement from failed effect | Observe courier/Forge separately; investigate missing reply | Fresh case without revealed answer; explain uncertainty |
| Preserve intent through restarts | Recover/reuse an order identity across courier changes | Diagnose a different identity failure and construct durable intent handling |
| Respect finite deduplication retention | Manipulate/observe time; see expired identity behave differently | Boundary/late-arrival cases with unfamiliar timing |
| Bind identity to request meaning | Alter request and observe conflict | Changed-parameters case before worked result is revealed |
| Reconcile outcomes and preserve unknown | Inspect authoritative record; distinguish committed/absent/unavailable | Novel known-absent and uncertain cases |
| Build a defensible retry contract | Construct route/policy, run disruptions, revise | Fresh counterexamples and authentic implementation/design artifact where promised |
| Retain and transfer idea | Return later to unfamiliar context with less scaffolding | Delayed retrieval + non-gear context, not memorized replay |

## Experience assurance

Freeze/review story before expensive realization. Then inspect one exact playable candidate: fresh entry, first action, error, recovery, harder encounter, payoff, transfer and replay.

Phone-first evidence uses mainstream Android/iPhone portrait around 360–430 CSS px with touch, safe areas, text enlargement and reduced motion.

Human final review remains essential. Do not substitute reward pressure, streak loss, shame, fake urgency or grinding for curiosity, attachment and earned competence.

## Learning/evidence integrity

XP is practice/game progression only and never determines mastery. Assistance, prior exposure and independence remain distinct. Missing evidence is not failure. Submitted evidence remains immutable except explicit learner-scoped reset.

World/rendering state is presentation, not learning evidence merely because an animation or visual state change occurred.

## Scope

Current work remains private Phase 1 reference refinement. The general generator/world-package direction describes future phases but does not authorize broad Phase 2+, arbitrary generated code loading, new model integrations, external testers, paid resources or public rollout.
