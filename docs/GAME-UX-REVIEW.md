# VibeLearn game critic — active dual 9/10 gate

**Latest authority · updated 12 September 2026.** Read root `CODEX-IMPLEMENTATION-PLAN.md`, `STORY-GENERATION-AND-CRITIC.md`, `GAME-AS-COURSE.md`, `PLAY-CANVAS.md`, `THREE-STORY-FRAMEWORK.md`, and `STATE.md`.

The current user permits available-tool/internal criticism while a genuinely separate critic is unavailable. Record `internal_tool_assisted`; never misrepresent it as an independent model/agent or human/youth playtest.

## Product context

VibeLearn is a **general learning-game generation system**, not Relay Rescue. Relay Rescue is the current authored reference slice. A future generated course may have a completely different story, cast, visual style, world package and mechanic set while preserving canonical learning/evidence identity.

Current story creation is topic/outcome-driven. Future explicit learner-controlled story preferences are planned but must not be inferred today.

## Preconditions before game scoring

Before first-touch/whole-chapter scoring:

1. exact frozen story candidate has passed the separate story-only gate >=9/no blocker;
2. exact rendered build has passed its required machine/integrity checks;
3. if the game uses Play Canvas/Three.js, lifecycle/fallback/accessibility behavior is verified on that exact build;
4. evidence comes from the rendered candidate, not source-only review.

Engineering/framework checks are prerequisites, **not score bonuses**. A reusable Three.js framework earns zero delight points by existing.

## Review question

Would a curious younger non-specialist and an older teen/young adult voluntarily keep playing this exact rendered build with XP hidden? Does implementation preserve the story's attraction while turning it into meaningful agency, consequences, progression and learning-relevant play?

Inspect fresh entry, first 60–90 seconds, narrative navigation, first meaningful action, discovery, consequential choice, mistake/recovery, progression, chapter resolution, replay/forward pull and bridge to the real subject.

## Pass rule — two independent game scores

A candidate requires:

1. **First-touch magic >=9.0/10**, no first-touch blocker.
2. **Whole-chapter game experience >=9.0/10**, no whole-chapter blocker.

Do not blend them. Only after both pass does the learning/transfer gate run. Passing critics produce at most `ready_for_user_review`; user verdict remains final.

## First-touch magic rubric

| Area | Weight | 10/10 means |
|---|---:|---|
| Beauty / creative hook | 18% | Opening immediately creates visual/aesthetic interest and feels authored like a game, not an app loading a lesson. |
| Curiosity / wonder / tension | 16% | Player quickly wants to know what happened/what happens next. |
| Character/world attachment | 14% | Focal character/world has readable personality, need and charm/interest worth caring about. |
| Causal clarity | 16% | Bright child can explain who matters, what they want, what happened, what changed and why it matters. |
| Initial cognitive-load control | 12% | Opening is concrete/simple and does not front-load jargon/dashboard/rules. |
| Player pacing/navigation control | 10% | Back, Continue, Skip, Replay, visible progress and Pause/Resume when motion runs are clear/usable. |
| First meaningful action | 8% | First action is obvious, world-owned and causally connected to the story. |
| Story-to-play transition | 6% | Story flows directly into play without collapsing into an unrelated course surface. |

Record weighted score, strongest moment, weakest/confusing moment, likely abandonment point and reason to continue.

### First-touch blockers

Any of these fails regardless of average:

- story gate missing/below threshold/rejected;
- no usable Back/previous control;
- forced rapid autoplay or loss of reading/inspection control;
- actor/need/inciting event/causal chain unclear;
- opening mostly explanatory slides/cards when action/environment can tell it;
- required meaning depends on audio/color/motion alone;
- first screen presents dense lesson/dashboard before world establishment;
- first action feels like website navigation rather than world action;
- Play Canvas/world continuity breaks needlessly at story -> first mission when same world is meant to persist;
- critic defense is only “required information exists,” “Three.js exists,” “framework is reusable,” or “tests pass.”

## Whole-chapter game-experience rubric

| Area | Weight | 10/10 means |
|---|---:|---|
| Game identity vs website residue | 13% | Primary interaction remains a coherent game/world, not cards/forms/workbench pages after the opening. |
| Story-to-play continuity | 13% | Character/world/conflict established in first touch keeps mattering to actions/consequences/resolution. |
| Core loop clarity and agency | 14% | Player understands actions, chooses meaningfully, explores alternatives and sees causal consequences. |
| Progression / cognitive-load curve | 14% | Easy concrete success grows into variation/combination/uncertainty/independence without text bloat. |
| Feedback, consequence and recovery | 12% | Outcomes are responsive; mistakes visible/understandable; recovery teaches. |
| Challenge / reasoning quality | 10% | Difficulty rises through reasoning/transfer/trade-offs/reduced scaffolding. |
| Payoff / forward pull | 8% | Resolution feels earned and creates strong reason to continue. |
| Learning integration | 10% | Concepts are embodied in play then bridged accurately to real terminology/transfer. |
| Accessibility / phone readiness | 6% | Required actions/meaning survive touch, mainstream phone portrait, text enlargement, reduced motion and fallback. |

Record strongest/weakest segment, cognitive-load jumps, whether fantasy survives mechanics and whether next chapter feels earned.

### Whole-chapter blockers

- game reverts to a normal course website after cinematic;
- later build/reasoning mode abandons Play Canvas/world identity for a generic form/workbench without deliberate reason;
- chapter is mostly reading/forms with little new agency;
- no meaningful failure/recovery/consequence;
- story objects/characters stop mattering once “lesson” begins;
- jargon appears before concrete model;
- incorrect/unsafe actions clear through unrelated answers;
- save/reload/navigation loses work or progression can be forged;
- learner/evidence boundaries violated;
- XP/self-report changes learning truth;
- `unknown`, assistance and prior exposure collapse;
- required action/meaning inaccessible on touch/narrow/reduced-motion/fallback;
- guided exercise claimed as durable mastery without evidence.

## First-chapter comprehension check

By Chapter 1 end, a bright child/non-specialist should explain in plain language:

1. central character/system and needed help;
2. important objects/resources/entities;
3. what each does;
4. what happened before player arrival;
5. what changed/failed and why important;
6. what player did;
7. what success means;
8. what real subject idea the behavior represents.

If answers require glossary memorization rather than observed cause/effect, Chapter 1 is not ready.

## Play Canvas continuity review

When GameExperienceSpec says the same world persists, inspect actual lifecycle as part of game cohesion:

- same Play Canvas/world identity survives compatible mode transitions;
- transition is visually intentional rather than page-like;
- HUD/action layers change progressively instead of replacing the world;
- construction/harder reasoning remains game-native;
- transfer context may change deliberately but still feels inside the game shell.

Unnecessary remounting is a UX deduction when visible to the player. A hidden remount may be an engineering defect even if it does not affect the numeric game score.

## Three.js / world-package review

Three.js receives points only when the rendered result is more compelling/clear because of it.

Inspect:

- character/object scale and composition;
- camera readability on phone;
- environmental storytelling and visible cause/effect;
- touch/hit testing;
- performance/resize/context loss/fallback/reduced motion;
- whether 3D is active game storytelling rather than wallpaper.

The reusable Story3D/world-package framework is reviewed separately for engineering quality. Do not inflate game scores because a second adapter can mount or package schemas are elegant.

## Minimum executable evidence

Retain exact-build evidence for:

- signed-out/login behavior where hosted;
- fresh first touch across representative 360/390/430 portrait sizes;
- Back/Continue/Skip/Replay/Pause semantics;
- no forced autoplay after interaction;
- coherent backward/forward story state;
- Play Canvas/world instance continuity where required;
- first action and consequential choice;
- visible mistake + recovery;
- Chapter 1 clear and concept bridge;
- later construction/build mode and payoff;
- save/reload/process resume;
- previous-chapter review without corrupting active progress;
- reset confirmation;
- text enlargement/reduced motion;
- 3D fallback/context loss;
- learner isolation/evidence semantics;
- transfer/boss applicable to reference.

Machine checks prove behavior, not delight. Critic scores remain hypotheses until the current user plays the candidate.

## Learning remains separate

A chapter can be a 9+ game and still fail learning. Every promised capability needs purposeful practice and defensible transfer/retrieval evidence where claimed.

## Current acceptance authority

Consult `STATE.md` for newest user verdict. The current user rating remains **3/10** for the rejected predecessor until they review a materially changed verified/deployed candidate. Historical critic results never carry forward automatically.
