# VibeLearn game critic — active 9/10 gate

Latest authority: [GAME-AS-COURSE.md](GAME-AS-COURSE.md), [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md), and [STATE.md](STATE.md), updated 10 September 2026.

The current user permits available-tool/internal criticism while a genuinely separate agent is unavailable. Record `internal_tool_assisted`; never misrepresent it as an independent model/agent or human playtest.

## Story critic is a prerequisite, not part of this score

Before running the game critic, the exact story/fantasy candidate should have its own **single-story critic** result under [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md). Story quality cannot be hidden inside the game average.

The current Relay Rescue opening is user-rated **3/10** for first-touch/story quality and therefore fails before game acceptance regardless of the previous internal game score. The old `9.196` game critic result is historical only; it did not survive actual user review.

The story critic judges hook, clarity/causality, attachment, world appeal, telling quality, pacing/progression, stakes, payoff, and cross-age engagement. The game critic below judges whether the approved story/world was successfully realized as an engaging playable game.

## Review question

Would a curious younger non-specialist or an older teen/young adult choose to keep playing this exact rendered build voluntarily? Does the implementation preserve the story's attraction while turning it into meaningful agency, consequences, progression, and learning-relevant play?

Inspect a frozen rendered candidate: fresh entry, first story interaction, temporal/navigation controls, first meaningful action, discovery, consequential choice, mistake/recovery, progression, boss, ending, and replay. Hide XP. Collect browser actions, screenshots/traces, and adverse-path results. State automation/environment limits.

## Pass rule

Unrounded weighted **>=9.0/10**, both audience lenses passing, no critical blocker, exact-build executable/rendered evidence, **and a non-rejected story gate**, followed by the user's final review. No rounded-up sub-9 passes, score inflation, hidden failures, or recycled historical numbers.

If the current user rejects the story/game after a critic pass, status immediately returns to `user_rejected` / `needs_revision` and the critic pass becomes historical evidence only.

## Frozen weighted game rubric

| Area | Weight | 10/10 means |
|---|---:|---|
| Game identity vs website residue | 15% | Primary interaction feels like a coherent commercial game/world, not ordinary cards/forms/slides with game labels or graphics behind them. |
| HUD and information at a glance | 15% | Objective/state/controls are legible and contextual; the UI supports the world without fighting it for attention. |
| Core loop clarity and immediacy | 15% | Players quickly understand what they can do, act, explore alternatives, and see causally clear consequences. |
| Progression and difficulty curve | 15% | Early confidence leads to variation, recombination, greater agency, challenge, and meaningful new possibilities. |
| Feedback and game feel | 12% | Inputs, motion, cause/effect, setbacks, recovery, and success feel responsive and satisfying rather than like form submission. |
| Story/world realization and visual cohesion | 10% | The approved story survives implementation: characters/world/events feel alive, coherent, attractive, and integrated with play rather than reduced to exposition panels. |
| Learning integrity | 10% | Rules/assessment remain faithful and bounded; assistance/exposure/evidence semantics remain honest; rewards never substitute for learning. |
| Accessibility and responsiveness | 8% | Keyboard/touch, narrow screens, text enlargement, contrast, reduced motion, story navigation, and fallback preserve required operations/meaning. |

Calculate `sum(area_score * weight)/100`. Give concrete evidence and criticism for every score. Three.js, test counts, code volume, or implementation effort earn no automatic points.

## First-touch hard gate

A fresh-start review must explicitly check:

1. Is the opening story/world immediately interesting rather than merely informative?
2. Can the player go **back** to the previous story beat?
3. Is first-run story pacing user-controlled, with next/continue and pause/resume where animation runs?
4. If autoplay exists, is it optional and slow enough for each beat to land?
5. Can the player skip and replay without losing essential context?
6. Does back/forward restore coherent visual/narrative state?
7. Can a bright child explain who matters, what they want, what happened, what changed, and why it matters?
8. Can a teen/young adult find the presentation credible rather than childish or generic?
9. Does the story create an emotional/curiosity reason to perform the first gameplay action?
10. Does the first action feel like something done **inside the world**, not “continue the lesson”? 

Failure of back navigation, rushed forced autoplay, unclear causality, or slide-deck storytelling is a blocker even if browser tests pass.

## Critical blockers

Any of these blocks acceptance regardless of weighted average:

- Story gate missing, below threshold, or explicitly rejected by the current user.
- First-touch sequence has no previous/back control or forces rapid timed progression.
- Core premise/character/stakes/causality remain unclear after the opening.
- Story is primarily explanatory slides/cards/captions when dramatized storytelling is feasible.
- Mostly read-card/answer-form loop when direct subject-relevant play is feasible; no reason to continue with XP hidden.
- No meaningful failure/recovery, earned resolution, or reasoning-changing replay variation.
- Challenge rises mainly through reading or arbitrary UI complexity rather than agency/reasoning.
- Unsafe constructed policies clear because unrelated answers happen to be correct.
- Saved work is lost through navigation/reload, progression can be forged, learners can cross-access state, or submitted evidence can mutate.
- XP/self-report changes mastery, evidence strength, or correctness-based unlocks.
- Unknown declaration is mislabeled assisted, prior exposure is mislabeled current help, or revealed feedback is called fresh independent work.
- Required actions/story meaning are inaccessible on keyboard/touch/narrow display or depend only on audio/color/motion.
- Raw implementation/network errors replace understandable recovery.

## Three.js / rendering review

Three.js 3D is a serious candidate for kid/teen/young-adult attention and may earn quality through world presence, spatial storytelling, character/world attachment, exploration, atmosphere, and direct interaction. The critic should compare the actual result against what a strong 2D/2.5D treatment could have achieved.

Do not award points simply because 3D exists. Inspect mobile performance, input/hit testing, camera legibility, resize/lifecycle, reduced motion, fallback, and whether the 3D world makes the story/play meaningfully more compelling.

## Minimum evidence

Inspect signed-out behavior, story opening and controls, first action, map/locks, causal feedback, error/recovery, save/reload/process resume, assistance/exposure semantics, sequential progression, unsafe/safe boss policies, ending/replay, XP-hidden play, keyboard/touch, narrow screens, text enlargement, reduced motion, and evidence scope.

For each audience lens record compelling and boring/confusing moments, likely first abandonment point, reason to continue, and whether another run is earned. These are critic hypotheses without authorized human playtesting.

## Learning and experience remain separate

Every promised course capability needs purposeful practice and defensible evidence, including fresh transfer and delayed retrieval where claimed. A guided retry slice does not prove a full course. Do not compensate for poor story/game appeal by scoring engineering integrity highly, or compensate for missing learning with graphics.

## Current and historical reviews

Consult STATE.md for the newest user verdict. `CURRENT-GAME-CRITIC.md` preserves the previous internal 9.196/9.35 pass as a superseded historical critic result because the current user subsequently rated the first-touch story 3/10. Historical critic success is never reusable for a materially changed or user-rejected experience.

Future generated courses require separate story, structural/learning, content/grounding, accessibility, game, and learning/transfer gates. A manifest cannot self-certify its rendered experience.
