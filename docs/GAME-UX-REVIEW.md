# VibeLearn game critic — active dual 9/10 gate

Latest authority: root `CODEX-IMPLEMENTATION-PLAN.md`, [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md), [GAME-AS-COURSE.md](GAME-AS-COURSE.md), and [STATE.md](STATE.md), updated 10 September 2026.

The current user permits available-tool/internal criticism while a genuinely separate critic agent is unavailable. Record `internal_tool_assisted`; never misrepresent it as an independent model/agent or human/youth playtest.

## Product context

VibeLearn is a **general learning-game generation system**, not Relay Rescue. Relay Rescue is the current authored reference slice. A future generated course may have a completely different story, cast, visual style and mechanic set while preserving canonical learning/evidence identity.

Current story creation is topic/outcome-driven. Future explicit learner-controlled story preferences are planned, but they must not be inferred today.

## Story critic is a prerequisite

Before game review, the exact frozen story/world candidate must pass the separate story-only critic in [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md) with an unrounded **>=9.0/10** and no story blocker.

Story quality cannot be hidden inside game UX scoring. A failed/rejected story goes back to story revision.

## Review question

Would a curious younger non-specialist or an older teen/young adult choose to keep playing this exact rendered build voluntarily? Does the implementation preserve the story's attraction while turning it into meaningful agency, consequences, progression and learning-relevant play?

Inspect a frozen rendered candidate with XP hidden: fresh entry, first 60–90 seconds, story navigation, first meaningful action, discovery, consequential choice, mistake/recovery, progression, chapter resolution, replay/forward pull and the bridge to the real subject.

## Pass rule — two required experience scores

Do **not** produce one blended game score that can average away a bad opening.

A candidate needs both:

1. **First-touch magic >=9.0/10**, no first-touch blocker.
2. **Whole-chapter game experience >=9.0/10**, no whole-chapter blocker.

Both audience lenses must pass. Evidence must come from the exact rendered build. Only after both pass does the separate learning/transfer gate run. Passing critics only produces `ready_for_user_review`; the current user's explicit verdict remains final.

No rounded-up sub-9 passes, score inflation, hidden failures, or recycled historical scores.

## First-touch magic rubric

Score the fresh first 60–90 seconds separately.

| Area | Weight | 10/10 means |
|---|---:|---|
| Beauty / creative hook | 18% | The opening immediately creates visual/aesthetic interest and feels intentionally authored, not like an app loading a lesson. |
| Curiosity / wonder / tension | 16% | Within moments the player wants to know what happened or what happens next. |
| Character/world attachment | 14% | The focal character and world have readable personality, need and charm/interest worth caring about. |
| Causal clarity | 16% | A bright child can explain who matters, what they want, what happened, what changed and why it matters. |
| Initial cognitive-load control | 12% | The opening starts concrete/simple and does not front-load jargon, dashboards, rules or explanations. |
| Player pacing/navigation control | 10% | Back/previous, Continue, Skip, Replay, visible progress and Pause/Resume when motion runs are clear and usable. |
| First meaningful action | 8% | The first action is obvious, world-owned and causally connected to the story rather than “continue the lesson.” |
| Story-to-play transition | 6% | The cinematic/world flows directly into play without collapsing into an unrelated course website. |

Calculate the unrounded weighted result. Record strongest moment, most boring/confusing moment, likely abandonment point and reason to continue.

### First-touch blockers

Any of these fails first touch regardless of average:

- story gate missing/below threshold/rejected;
- no usable Back/previous control;
- rapid forced autoplay or player loses control while reading/inspecting;
- core actor/need/inciting event/causal chain is unclear;
- opening is mostly explanatory slides/cards/captions when action/environment can tell it;
- required meaning depends on audio, color or motion alone;
- first screen presents a dense lesson/dashboard before establishing the world;
- first action feels like website navigation rather than an action inside the world;
- the critic's only defense is “the required information exists,” Three.js exists, or tests pass.

## Whole-chapter game-experience rubric

Score the complete chapter separately.

| Area | Weight | 10/10 means |
|---|---:|---|
| Game identity vs website residue | 13% | Primary interaction remains a coherent game/world through the chapter, not cards/forms/slides after the opening. |
| Story-to-play continuity | 13% | Character/world/conflict established in first touch keeps mattering to actions, consequences and resolution. |
| Core loop clarity and agency | 14% | Players understand what they can do, choose meaningfully, explore alternatives and see causal consequences. |
| Progression / cognitive-load curve | 14% | Concrete easy success grows into variation, combination, uncertainty and greater independence without text bloat. |
| Feedback, consequence and recovery | 12% | Inputs and outcomes feel responsive; mistakes are visible/understandable; recovery teaches rather than punishes arbitrarily. |
| Challenge / reasoning quality | 10% | Difficulty rises through reasoning, transfer, trade-offs and reduced scaffolding rather than longer instructions. |
| Payoff / forward pull | 8% | Chapter resolution feels earned and creates a strong reason to continue. |
| Learning integration | 10% | Subject concepts are embodied in play and then bridged accurately to real terminology/transfer. |
| Accessibility / phone readiness | 6% | Required operations and meaning survive touch, mainstream phone portrait, text enlargement, reduced motion and fallback. |

Calculate the unrounded weighted result. Record strongest/weakest chapter segment, where cognitive load jumps, whether the fantasy survives the mechanics, and whether another chapter feels earned.

### Whole-chapter blockers

Any of these fails regardless of average:

- game reverts to a normal course website after the cinematic;
- chapter progression is mostly more reading/forms with little new agency;
- no meaningful failure/recovery or consequence;
- story objects/characters stop mattering once “the lesson” starts;
- jargon appears before the learner has a concrete model;
- unsafe/incorrect actions can clear through unrelated answers;
- save/reload/navigation loses work or progression can be forged;
- learner/evidence boundaries are violated;
- XP/self-report changes mastery/correctness;
- `unknown`, current assistance and prior exposure are collapsed;
- required action/meaning is inaccessible on touch/narrow display/reduced motion;
- a guided exercise is claimed as durable transfer/mastery without evidence.

## First-chapter comprehension check

By the end of Chapter 1, the critic should be able to ask a bright child/non-specialist to explain, in plain language:

1. Who is the central character/system and what help do they need?
2. What are the important objects/resources/entities?
3. What does each one actually do in the world?
4. What happened before the player arrived?
5. What changed/failed and why is that dangerous/important?
6. What did the player do to help?
7. What does success mean?
8. What real subject idea does this world behavior represent?

If these require memorizing a glossary rather than understanding observed cause/effect, Chapter 1 is not ready.

## Mainstream phone target

During current refinement, review primarily on the mainstream modern Android/iPhone portrait range: representative viewports around **360–430 CSS px wide** with common tall-phone aspect ratios, touch input and safe-area considerations. Use a compact matrix rather than tuning named devices. Desktop polish follows after phone quality is strong.

Check that the 3D/story world remains visually dominant, story copy is readable without covering the important action, primary controls are comfortable touch targets, no essential control is pushed below an inaccessible fold, and there is no horizontal overflow.

## Three.js / rendering review

Three.js 3D is a serious option for attention, atmosphere, spatial storytelling, character/world presence and direct interaction. It earns points only when the actual rendered result is more compelling/clear because of it.

Inspect mobile performance, camera framing, input/hit testing, resize/lifecycle, context loss/fallback, reduced motion and whether 3D improves story/play rather than acting as decorative wallpaper.

## Minimum executable evidence

For an exact candidate, retain evidence for:

- signed-out/login behavior where hosted;
- fresh first-touch at representative phone sizes;
- Back/Continue/Skip/Replay/Pause semantics;
- no forced autoplay after player interaction;
- story-world state coherence when moving backward/forward;
- first meaningful action and first consequential choice;
- visible mistake + recovery;
- Chapter 1 clear and story/real-concept bridge;
- save/reload/process resume;
- previous-chapter review without corrupting active progress;
- reset-progress confirmation;
- touch/narrow screens/text enlargement/reduced motion;
- 3D fallback/context-loss behavior when applicable;
- learner isolation and evidence semantics;
- later chapter/boss/transfer checks applicable to the current reference.

Machine checks prove behavior, not delight. Critic scores remain hypotheses until the current user plays the candidate.

## Learning remains a separate gate

Do not compensate for a weak game by scoring engineering integrity highly, and do not compensate for weak learning with graphics. Every promised course capability needs purposeful practice and defensible evidence, including fresh transfer and delayed retrieval where claimed.

A chapter can be a 9+ game experience and still fail the learning gate.

## Current acceptance authority

Consult `docs/STATE.md` for the newest user verdict. The user's current first-touch/story rating is **3/10** until they review a materially changed verified/deployed candidate. Any previous internal 9+ game result is historical only because it failed to predict the user's actual experience.