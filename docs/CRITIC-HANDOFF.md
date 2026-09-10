# Critic handoff — story first, then game, then learning

Updated 10 September 2026. Read STORY-GENERATION-AND-CRITIC.md, GAME-AS-COURSE.md, GAME-ACCEPTANCE-9.md, GAME-UX-REVIEW.md, and the latest STATE.md.

The current user permits review with available tools while a genuinely separate critic is unavailable. A builder-operated fallback must be labeled `internal_tool_assisted`; it is not an independent agent/model or a human/youth playtest. Never let review tooling block useful private Phase 1 refinement, and never let a critic score override the user's verdict.

## Current product state

The current Relay Rescue opening is user rejected at **3/10 for first-touch/story quality**. No reviewer should use the historical 9.196 game / 9.35 bounded-learning critic result as acceptance evidence. The next review sequence starts with a new story candidate.

## Critic 1 — story only

Freeze **one story/fantasy/world candidate**. Do not review multiple story options in one averaged score.

Judge only the story and how it is told:

- hook / immediate curiosity;
- clarity and causality;
- character attachment;
- world/fantasy appeal;
- storytelling through events/action/dialogue/discovery rather than exposition slides;
- pacing and progression/escalation;
- stakes/tension and anticipated consequences;
- payoff and forward pull;
- ability to capture a bright child while remaining credible to teens/young adults.

Use STORY-GENERATION-AND-CRITIC.md for the weights and blockers. Target is unrounded >=9.0, no story blocker. Do not award story points for course usefulness, source quality, code/tests, Three.js, browser reliability, learning evidence, or implementation effort.

Record the exact StoryPackage/story version, preference assumptions, rubric scores, likely abandonment point, strongest hook, weakest beat, and prioritized revisions.

The story critic must explicitly inspect first-touch temporal UX in the planned/rendered treatment: Back/previous, user-paced next/continue, pause/resume when animation runs, skip, replay, progress position, optional autoplay behavior, coherent back/forward state, and reduced-motion equivalent.

## Critic 2 — rendered game experience

Only after the story gate, freeze the exact rendered build and use GAME-UX-REVIEW.md.

Would a curious kid/younger non-specialist and an older teen/young adult voluntarily continue? Hide XP. Inspect the actual opening, first meaningful action, discovery, consequential alternatives, mistake/recovery, progression, boss/transfer, ending, and replay.

Verify that the approved story survives implementation instead of collapsing into cards/forms/captions. A technically faithful implementation can still fail if it loses character/world appeal or turns the story into an exposition UI.

For Three.js/3D, judge whether it materially improves immersion, character/world presence, environmental storytelling, exploration, atmosphere, or direct interaction. Do not give points for 3D itself. Check keyboard/touch, hit testing, camera readability, resize/lifecycle, reduced motion, fallback, same-origin assets, and realistic mobile-performance evidence.

Record exact commit/build, reviewer method, environment, routes/actions, artifacts, limitations, raw rubric scores, both audience-lens verdicts, blockers, likely quit point, reason to continue without XP, and replay value. `ready_for_user_review` requires unrounded >=9.0 and no blocker, but still does not mean accepted.

## Critic 3 — learning / real-world transfer

Separately evaluate the declared course outcomes. Use the outcome-to-mechanic-to-assessment ledger in GAME-AS-COURSE.md. Fresh transfer, delayed retrieval, authentic implementation/design work, assistance/exposure accounting, and evidence limits remain necessary where claimed.

Do not rate story completion, participation, XP, memorized sequences, or revealed practice feedback as mastery. Do not let a strong story/game score compensate for missing learning evidence.

## Rendering-medium decision

For important candidates, explicitly consider 2D/illustrated animation, 2.5D/parallax, and interactive Three.js 3D before expensive realization. The target audience gives 3D a serious opportunity to improve attention, but the story critic should first ensure the underlying writing/world is worth realizing.

## Method and honesty

Use real rendered interaction evidence, browser traces, screenshots, adverse paths, storage tests, and source inspection as appropriate to the gate. State what was directly observed versus inferred. A source-only review cannot certify story performance or gameplay.

A score is reviewer judgment with stated confidence, not scientific proof of enjoyment or learning efficacy. Do not inflate scores to reach the threshold.

## Environment boundaries

Use disposable checkout/database and normal verification setup. Never use production credentials/learner data, bypass administrator policy, change Auth/RLS/allowlists, provision paid resources, recruit external testers, or open later phases merely to run a critic pass.
