# VibeLearn game UX system — the game is the course

Active user direction, updated 10 September 2026. Read with [GAME-AS-COURSE.md](GAME-AS-COURSE.md), [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md), [STATE.md](STATE.md), [GAME-UX-REVIEW.md](GAME-UX-REVIEW.md), and [COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md).

## Product and review standard

Build a game whose subject-relevant actions develop the intended course capabilities. The experience must earn voluntary play from a curious younger non-specialist and an older teen/young adult. Do not mistake a game-themed website, a beautiful scene, easy quizzes, XP accumulation, or a 3D renderer for that product.

The current user is the sole real product reviewer during private refinement. Their explicit verdict overrides critic/agent/automation scores. The current Relay Rescue first-touch/story verdict is **3/10**. The target remains unrounded **>=9.0/10** for each applicable story, game, and learning/transfer critic gate, no critical blocker, followed by explicit user acceptance.

## Story comes before interface

For every course/subject, generate a compelling **story/fantasy/world premise before gameplay/UI realization**. The UI should emerge from the world and player role, not from a generic lesson shell that is later reskinned.

A story candidate must first survive its own story critic. The story critic evaluates one frozen story at a time and does not award points for implementation, curriculum correctness, tests, rendering technology, or learning evidence. See [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md).

Current story/world selection is driven by the topic/outcomes plus broad cross-age quality constraints. Learner creative preferences are **not** an input yet. Long term, an explicit preference profile may influence genre, tone, realism/fantasy balance, character style, visual style, pace, humor/darkness, exploration/action, and narrative density.

## Attention first, cognition second

Great games capture attention before demanding hard reasoning. Early visual/emotional appeal is not decoration; it earns enough interest for the player to learn the world.

Default early-load ladder:

`story hook / beauty / curiosity -> character + world desire -> concrete need -> one obvious action -> visible consequence -> easy recovery/success -> formal concept -> variation -> combination -> boss/transfer`

For the first/tutorial chapter:

- establish a memorable character/world hook before terminology;
- show important objects and what they do through action, animation, interaction, dialogue, or consequence;
- dramatize the inciting event: what happened first, what changed, what information was lost, and what remains true;
- make the player's role emotionally and causally meaningful rather than merely observational;
- give the player one obvious action at a time until the interaction grammar is understood;
- use tutorial focus mode so the playfield dominates and nonessential system/UI surfaces are deferred;
- use informative failure to reveal why a wrong action matters, followed by easy recovery;
- attach formal terms only after the concrete model exists when faithful;
- preserve essential meaning with reduced motion and sound off.

The first chapter fails if a fresh novice cannot explain who/what matters, what they want, what happened, what changed, why it matters, what the player can do, and why the next beat/action is interesting.

## First-touch story UX

The current opening failed because it behaved too much like a rushed slide sequence. Future story/cinematic UX must satisfy all of the following:

- **Back / previous beat is mandatory.**
- First-run progression is **user-paced by default**; do not force fast automatic advancement.
- Provide clear next/continue, pause/resume while animation is running, skip, replay, and progress/chapter position.
- Optional autoplay is secondary, slow enough for the beat to land, and pauses immediately when the player interacts.
- Back/forward restores coherent story state; objects, dialogue, effects, and consequences cannot contradict the selected beat.
- Reduced-motion keeps the same navigation and causal meaning.
- Story checkpoints prevent needless rewatching after failure or resume.
- The player should never need to race the UI to read, inspect, or understand a story beat.

Do not treat longer timers as a sufficient fix. A weak sequence of captions remains weak even if each caption stays on screen longer.

## Storytelling quality

Use scenes, character behavior, discovery, conflict, environmental change, dialogue, physical action, interaction, and consequence to tell the story. Avoid exposition walls and slide decks disguised as cinematics.

A strong opening should create at least one of: attachment, curiosity, wonder, tension, humor, surprise, mystery, aspiration, or a desire to explore. Story progression should change the situation rather than merely add facts. Each chapter/mission should deepen the world, relationship, conflict, capability, or mystery.

## Experience and learning are separate gates

Story, game experience, and learning are separate quality dimensions. Do not average them into a pass.

A great story with boring play fails. Fun play with shallow learning fails. Strong learning with no voluntary engagement fails the product. For each learning outcome, design the prerequisite, mechanic, meaningful decision, causal feedback, varied practice, fresh transfer, delayed retrieval where claimed, and evidence limits.

## Game design invariants

**Narrative before jargon, where faithful.** Establish desire, conflict, causality, and player role first. Story carries motivation and clues instead of decorating a reading panel.

**Subject thinking inside play.** Investigate, manipulate, compare, arrange, construct, diagnose, test, negotiate, explore, or control systems when those actions embody the target skill. Decisions produce distinct and legible world consequences.

**Confidence before complexity.** Teach -> easy success -> variation -> combine -> boss/transfer -> earned resolution -> new possibility. New tools expand agency rather than just adding menu options.

**Curiosity without coercion.** The reason to continue must survive hiding XP. Do not substitute shame, streak pressure, fake urgency, grinding, or reward spam for story/world pull and satisfying play.

## Current Relay Rescue implication

Do not repair the current Relay Rescue opening by only slowing the existing six beats. Its story treatment is rejected at 3/10. The next candidate needs a stronger hook, clearer causal staging, more expressive character/world storytelling, better escalation, and explicit player control over time/navigation.

The existing Signal 1 progressive interaction can remain a useful mechanic reference, but it must be re-evaluated after the new story/world establishes a stronger reason to care and act.

## HUD and visible-complexity budget

Keep the main action and consequence together. Treat visible UI complexity as a budget: onboarding exposes only what matters for the current mental model. Evidence capture, telemetry, save integrity, assistance tracking, and learning metadata can remain fully active underneath without occupying the play surface.

Progressively introduce the smallest useful HUD/action dock as the player gains context. Do not dump journals, evidence panels, analytics, settings, helper drawers, long tool rails, and repeated briefings into mission one.

Every input receives acknowledgement. Pending saves prevent accidental duplicate actions. Precise tap targets remain stable while selected. Keyboard focus survives redraws. Navigation must not silently discard work.

## 2D / 2.5D / Three.js 3D

Three.js is now a serious option for **capturing attention and building attachment**, especially for kids, teens, and young adults. Evaluate it not only for spatial learning mechanics but also for immersive story openings, explorable environments, character presence, environmental storytelling, discovery, atmosphere, and direct interaction.

For important story/game candidates, explicitly compare:

1. authored 2D/illustrated animation;
2. 2.5D/parallax or layered interactive scenes;
3. interactive Three.js 3D.

Today choose based on the topic, story, broad target audience, device budget, and whether the medium meaningfully increases world presence and voluntary engagement. Once an explicit StoryPreferenceProfile exists, learner preference may also influence the medium; do not infer it today. A technically impressive 3D scene with weak story still fails. Keep pinned local assets, same-origin runtime, keyboard/touch semantics, reduced-motion behavior, readable fallback, and realistic mobile performance targets. Renderer state never decides assessment/evidence.

## Learning integrity and continuity

World truth and player knowledge remain distinct. Missing acknowledgement is uncertainty, not proof of failure. Retained identity has a finite window. Committed, authoritatively absent with no in-flight request, and unavailable states require different behaviors. Rehearsal rewind does not imply real-world rollback.

Commands resolve learner, command ID, and expected revision. The server replays pinned rules and validates progression. Submitted evidence remains immutable except for explicit learner-scoped reset operations. XP never decides correctness, mastery, or evidence strength.

Observed simulation feedback is guided assistance, not fresh independent prediction. Unknown declaration, current help, and prior exposure stay separate; missing evidence is not failure.

## Documentation continuity

User feedback that changes story, onboarding, progression, interaction grammar, rendering strategy, visual hierarchy, acceptance, or course generation must be reflected in relevant docs in the same implementation unit. A code-only change with stale design docs is incomplete.

## Generation and scope

[COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md) carries the future generation contract. Generated content must include story generation/critique, coherent gameplay, outcome coverage, progression, provenance, assistance, persistence, accessibility, and rendered critic evidence.

This remains private Phase 1 refinement. No new model integration, untrusted runner, external testers, paid provisioning, or public rollout is authorized without explicit user approval.
