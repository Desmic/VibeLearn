# Game acceptance contract — story + first touch + whole chapter + learning + user

**Updated 12 September 2026.** Read `STORY-GENERATION-AND-CRITIC.md`, `GAME-AS-COURSE.md`, `GAME-UX-REVIEW.md`, `PLAY-CANVAS.md`, `THREE-STORY-FRAMEWORK.md`, and `STATE.md`.

## Current status

The current Relay Rescue predecessor remains **`user_rejected` / `needs_revision`**. The user's latest explicit first-touch/story rating is **3/10**. Historical internal scores cannot keep a changed/rejected candidate in `ready_for_user_review`.

## Acceptance pipeline

Required order:

`StoryWorldSpec -> story critic >=9 -> GameExperienceSpec/Play Canvas realization -> first-touch magic >=9 -> whole-chapter game >=9 -> learning/transfer >=9 where applicable -> ready_for_user_review -> explicit user acceptance -> user_accepted`

All critic thresholds are unrounded with no blocker. The current user's explicit verdict can reject a candidate at any point and overrides every critic/automation result.

## Story gate

For every course/subject, create a strong story/fantasy/world before gameplay realization. Evaluate one frozen StoryWorldSpec at a time using `STORY-GENERATION-AND-CRITIC.md`.

Story critic judges hook, causality, attachment, world appeal, storytelling, pacing/progression, stakes, payoff/forward pull and cross-age engagement. It does not award points for learning value, code/tests, Play Canvas, Three.js, framework reuse or implementation effort.

Pass: **>=9.0/no blocker**.

## First-touch game gate

The fresh first 60–90 seconds independently need **>=9.0/no blocker**.

Requirements include:

- beauty/creative hook;
- curiosity/wonder/tension;
- character/world attachment;
- causal clarity understandable to a bright child;
- low initial cognitive load;
- Back/Continue/Skip/Replay/progress and Pause/Resume while motion runs;
- obvious first meaningful world-owned action;
- continuous story-to-play transition.

A rushed slideshow, missing back navigation, clear-but-unengaging exposition, dense dashboard or needless story→mission surface break fails first touch.

## Whole-chapter game gate

The full chapter independently needs **>=9.0/no blocker**.

Judge story/world continuity, agency, progressive cognitive load, reasoning quality, feedback/recovery, payoff, forward pull, game identity, learning integration and phone/accessibility quality.

A later build/policy phase that turns into a conventional themed web workbench is a failure even if the opening is beautiful.

## Learning/real-world-transfer gate

The intended game should deliver the useful outcomes of its declared LearningSpec. Require explicit outcome->mechanic->assessment coverage, varied practice, fresh transfer and delayed retrieval where claimed.

No course-equivalence/mastery claim from story completion, XP, participation or immediately repeated guided practice.

Pass applicable learning/transfer review at **>=9.0/no blocker** before user review under the current process.

## Play Canvas engineering gate

Game quality scoring does not replace runtime integrity.

For exact candidates using Play Canvas, machine evidence must separately verify:

- compatible story/mission modes retain intended stage/world identity;
- direct actions still issue server-authoritative commands;
- save/reload/history/reset/isolation/evidence semantics remain intact;
- phone/touch/text enlargement/reduced motion/fallback are operable;
- no duplicate course-specific renderer lifecycle is introduced.

A framework failure can block release even when screenshots look good. Passing this gate earns no automatic game-quality points.

## Reusable Three.js framework gate

When Three.js is used, the implementation must consume the shared Story3D runtime/host/world-package boundary.

The user explicitly requires future story/fantasy settings to be easy to integrate. Therefore:

- runtime/host/Play Canvas remain story-neutral;
- world-specific scene/assets/states/cameras/anchors live in replaceable packages;
- new stories normally do not modify core infrastructure;
- synthetic unrelated-world tests prove mechanical genericity;
- future generator maturity requires a materially different real world to integrate without story-specific core edits;
- long-term generated worlds should prefer validated declarative WorldPackageSpec data over arbitrary generated JavaScript.

The full arbitrary package loader is not a Phase 1 acceptance requirement and must not be built by weakening CSP/security.

## Three.js/rendering direction

For important candidates compare 2D, 2.5D and interactive Three.js. Choose the medium that serves the story/audience/device budget.

3D itself never earns acceptance. If used, preserve pinned local assets, same-origin runtime, touch/keyboard, reduced motion, fallback and realistic phone performance.

## Review record

Every gate record includes exact story/build/package version, reviewer method, raw scores, evidence, blockers, limitations, likely abandonment points, changes since prior candidate and status.

Never reuse a historical score for a changed build/world/package.

Allowed statuses include `story_needs_revision`, `needs_revision`, `review_pending`, `ready_for_user_review`, `user_rejected`, and `user_accepted`.

## Scope and rollout

This remains private Phase 1 refinement. The architecture also guides future generation, but does not authorize Phase 2/3 implementation, external testers, paid resources, public rollout, untrusted execution, arbitrary generated client code or new model integrations.
