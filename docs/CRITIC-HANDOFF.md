# Critic handoff — story first, then first touch, whole chapter, then learning

**Updated 12 September 2026.** Read `STORY-GENERATION-AND-CRITIC.md`, `GAME-AS-COURSE.md`, `GAME-ACCEPTANCE-9.md`, `GAME-UX-REVIEW.md`, `PLAY-CANVAS.md`, `THREE-STORY-FRAMEWORK.md`, and latest `STATE.md`.

The current user permits review with available tools while a genuinely separate critic is unavailable. A builder-operated fallback must be labeled `internal_tool_assisted`; it is not an independent agent/model or human/youth playtest. Never let a critic override the user's verdict.

## Current authority

The predecessor Relay Rescue first touch remains user-rejected at **3/10** until the user reviews a materially changed verified/deployed candidate.

VibeLearn is a general learning-game generation system. Relay Rescue/Echo Forge is the current reference, not the product schema.

Current story generation is topic/outcome-driven. Future explicit StoryPreferenceProfile input is planned but must not be inferred today.

## Critic 1 — story only

Freeze exactly one StoryWorldSpec/story candidate.

Judge:

- hook/immediate curiosity;
- clarity/causality;
- character attachment;
- world/fantasy appeal;
- storytelling through events/action/dialogue/discovery;
- pacing/progression;
- stakes/tension;
- payoff/forward pull;
- cross-age engagement.

Use `STORY-GENERATION-AND-CRITIC.md`. Target unrounded **>=9/no blocker**.

Do not award story points for course usefulness, source quality, code/tests, Play Canvas, Three.js, framework reuse, browser reliability or learning evidence.

Record exact StoryWorldSpec/version, current preference assumptions, scores, strongest hook, weakest beat, likely abandonment point and revisions.

Temporal UX belongs in story/first-touch review: Back, user-paced Continue, Pause/Resume while motion runs, Skip, Replay, progress, coherent back/forward state and reduced-motion equivalent.

## Engineering freeze before rendered game critics

Before game scoring, freeze an exact build/world-package revision and verify its required behavior.

When Play Canvas/Three.js applies, engineering evidence should cover:

- expected same-stage/world/runtime continuity across compatible modes;
- no accidental duplicate renderer lifecycle;
- phone/touch/reduced-motion/fallback/context-loss behavior;
- server-authoritative actions/save/reload/history/reset/isolation/evidence;
- unrelated synthetic-world Story3D seam where applicable.

This is a release/integrity gate, not a game-quality score.

## Critic 2A — first-touch magic

Use `GAME-UX-REVIEW.md` on fresh first 60–90 seconds.

Question: would a curious kid/non-specialist or teen/young adult voluntarily continue with XP hidden?

Inspect beauty/hook, curiosity, attachment, causality, cognitive-load control, narrative controls, first action and story-to-play transition.

Pay particular attention to whether Play Canvas feels continuous. If story and first mission share a world, a needless visible exit/remount is a deduction/blocker even when both screens individually look good.

Target unrounded **>=9/no blocker**.

## Critic 2B — whole-chapter game experience

Only after first touch passes, review the complete chapter.

Inspect:

- story/world continuity through actual mechanics;
- agency and consistent rules;
- progressive cognitive load;
- meaningful failure/consequence/recovery;
- reasoning/challenge quality;
- payoff/forward pull;
- learning integration;
- phone/accessibility quality.

Explicitly inspect later build/combination/transfer states. Penalize any regression into a themed website/workbench when the GameExperienceSpec intends in-world play.

Target unrounded **>=9/no blocker**.

## Three.js/world-package review inside game criticism

Three.js earns points only if the **rendered result** is more compelling/clear because of it.

Inspect camera framing, actor/object scale, character expression, environmental storytelling, cause/effect staging, touch anchors, performance and fallback.

Do not award game points because:

- runtime code is reusable;
- a declarative package schema exists;
- Star Orchard mounts;
- test coverage is large.

Those are engineering evidence only.

## Framework engineering review

Separately ask whether a future world can be integrated easily/safely:

- Does the world mostly change package data/assets/compositions rather than core runtime?
- Is Play Canvas/runtime/host free of current story nouns?
- Are generic capabilities versioned rather than smuggled from one story?
- Can incompatible versions fail closed?
- Is the long-term path data-first `WorldPackageSpec` rather than arbitrary generated JS?
- Can replacing a package leave competencies/evidence/history unchanged?

Framework failure may block release/Phase 3 readiness but does not change story/game scores upward.

## Critic 3 — learning / real-world transfer

Only after both game gates pass, evaluate declared LearningSpec outcomes.

Use outcome->mechanic->assessment coverage. Check purposeful practice, fresh transfer, delayed retrieval where claimed, authentic implementation/design work where promised, assistance/exposure semantics and evidence limits.

Do not rate story completion, participation, XP, memorized sequences or revealed practice feedback as mastery.

Target applicable unrounded **>=9/no blocker**.

## Evidence record

Every review record states:

- exact commit/build/world-package version;
- reviewer method;
- environment/viewports;
- routes/actions inspected;
- screenshots/traces/artifacts;
- directly observed vs inferred evidence;
- raw scores;
- blockers/likely quit point;
- reason to continue without XP;
- limitations/no human playtest.

A source-only review cannot certify story performance/gameplay. Machine success cannot prove delight or learning efficacy.

## Environment/scope boundaries

Use disposable test state. Never use production credentials/learner data, bypass Auth/RLS/allowlists, relax CSP, provision paid resources, recruit external testers, execute untrusted generated code or open later phases merely to run a critic.
