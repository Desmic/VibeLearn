# Game-experience critic brief — available tools now, independent critic when available

Updated 9 September 2026. The user explicitly permits review with available tools while Codex is blocked. **Do not require a Codex environment before continuing current Phase 1 review.** Read GAME-AS-COURSE.md, GAME-ACCEPTANCE-9.md, GAME-UX-REVIEW.md and the latest STATE/review report.

## Method and honesty

Freeze the candidate and the eight rubric weights. Use real rendered interaction evidence, browser action/response traces, screenshots, failure cases, storage tests and source inspection. For a builder-operated review, label the method `internal_tool_assisted`; it is not a separate agent/model or a human/youth playtest. Clearly distinguish direct interactive exploration, scripted browser probes and screenshot/trace inspection. State unobserved conditions. A source-only pass cannot rate the full experience.

An independent critic remains useful when available, but the current review is no longer blocked on it. The original GitHub bot reply is historical setup information, not the active work prerequisite. An independent later reviewer must judge the current frozen candidate, not reuse historical scores.

## What to judge

Would a curious kid/younger non-specialist and an older teen/young adult voluntarily continue? Evaluate the two lenses separately with reading/prior-knowledge assumptions. Hide XP. Identify real hooks, useful discoveries, consequential alternatives, informative setbacks, reasons to retry, an earned ending and whether another run is worth choosing. Educational intentions and implementation effort are not substitutes for fun.

Inspect the actual first minute, not just the most polished screenshot. In the expedition, deliberately create a duplicate after a courier restart, recover with the journal/rewind, try an expired ticket, reconcile the order, test an unsafe boss policy, revise it and experience the ending and missing-request detour. Check whether payload binding and unavailable records were actually taught before the boss.

For the optional Three.js path, judge target discoverability, direct manipulation, causal feedback, fixed-camera readability, whole-screen hierarchy and whether the scene improves the action rather than simply adding 3D behind a form. Check keyboard equivalents, pointer/touch, motion reduction, resize, lifecycle and renderer failure. Do not infer real-device frame rates from a headless CI run.

## Learning outcomes

The product promise is a game that delivers the useful capabilities of its declared course. Use the outcome-to-mechanic-to-assessment ledger in GAME-AS-COURSE.md. The current guided reference does not establish a whole course's outcomes. Fresh transfer, delayed retrieval and authentic implementation/design assessments remain necessary where claimed. Do not rate participation, memorized button sequences or revealed feedback as mastery.

## Required output

Record exact commit/build, reviewer method and independence status, environment, routes/actions, artifacts and limitations. Give each raw /10 score with evidence: identity 15%, HUD 15%, core loop 15%, progression 15%, feel 12%, cohesion 10%, integrity 10%, accessibility 8%. Calculate the unrounded weighted sum.

For each audience lens record compelling moments, boring/confusing moments, likely first abandonment point, a concrete reason to continue without XP and whether replay is earned. List blockers and prioritized interaction changes. Use `needs_revision` below9 or with any critical blocker. Use `ready_for_user_review` only for unrounded>=9.0, both lenses passing and no blocker. The user remains final reviewer and may reject any agent pass.

A score is a reviewer judgment with stated confidence, not scientific proof of enjoyment or learning efficacy. Do not inflate it to reach the target or pretend that a different tool creates independent criticism.

## Environment boundaries

Use disposable checkout/database and the normal project verification setup. `python manage.py vendor` verifies the pinned Three.js files; `build`, `test` and `browser` provide executable gates. `serve --db <temporary-path> --port 8000` runs local play. Existing hosted/PostgreSQL tests need their declared prerequisites. Never use production credentials/learner data, bypass administrator policy, deploy, change Auth/RLS/allowlists, provision paid resources or recruit external testers merely to run the review.
