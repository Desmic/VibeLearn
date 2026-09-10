# Codex task: implement and present the first Learning OS slice

## Current product amendment — story is a gated subsystem

This file preserves the original Phase 0/1 implementation handoff, but later user feedback materially changes how any current/future learner-facing course is realized. Read `docs/STATE.md` and `docs/STORY-GENERATION-AND-CRITIC.md` before using the older presentation guidance below.

For any course/subject, current story generation is driven by the **topic/outcomes**, not by learner creative preferences. Generate a versioned story/fantasy/world treatment first, run the story-only critic on that one story, and require unrounded **>=9.0/10 with no story blocker** before gameplay realization. Future explicit story-preference support may personalize genre/tone/world/visual style; do not infer or claim that capability today.

First-touch story UX is user-paced by default with Back/previous, Continue, Skip, replay, visible progress, and pause/resume when motion is active. A rushed explanatory slide sequence is a failure even if its facts are correct. Consider 2D, 2.5D, and Three.js 3D as realization options after the story passes, with 3D allowed to improve attention, immersion, character/world attachment, and spatial causality while never deciding assessment/evidence.

Story critic, game critic, learning/transfer gate, and user acceptance are distinct. The current user remains the authoritative reviewer.

## Authorization and stopping point

The user now authorizes implementation of Phase 0 and Phase 1 ONLY. This task supersedes earlier design-only wording for this bounded scope. Implement, run, verify, and present a usable first learning episode; do not stop after planning or scaffolding. Do not advance into Phase 2 or later before the user tries the first episode and provides feedback. Preserve the architectural invariants required for those later phases without implementing their full subsystems.

## Workspace and instructions

Work in the project directory selected by the user. Inspect its actual files, Git state, applicable AGENTS.md instructions, existing application, dependencies, and tests before editing. Preserve unrelated work. A selected empty directory is sufficient to start a greenfield project; no pre-existing repository is required. Do not select an unrelated repository or publish to a remote service.

Read START-HERE.md and CODEX-IMPLEMENTATION-PLAN.md from the supplied learning-os-design-package-v1.3.zip (or its extracted directory). Version 1.3 is authoritative for build order. Follow its references to the relevant architecture/contracts/fixtures as needed rather than implementing the whole design at once. Merge useful instructions from handoff/AGENTS.template.md; never overwrite existing project guidance blindly. The earlier design validation report is not evidence that application code works.

Use the existing sound stack. In a greenfield workspace, prefer the design's modular monolith, one relational database, and a small real web UI. Choose ordinary tooling and record reversible decisions. No microservices, universal page builder, or speculative agent framework.

## Runtime effort and permissions

Recommended starting configuration: High reasoning effort, one primary implementation agent. Reasoning effort is a runtime setting, not something this prompt can assert it has changed. Report the actual model/effort only when observable; otherwise leave it unspecified. A separately scoped review may help after the interfaces work; do not start parallel builders inventing shared schemas.

Use the granted workspace permissions. Do not bypass sandbox or approval controls, expose secrets, deploy publicly, push commits, or perform destructive changes without the appropriate authorization. A branch/worktree is not a security sandbox.

## Outcome to demonstrate

A learner can open one small static course, attempt a meaningful problem about reliable agent execution, save and resume their answer, request progressive hints, submit, inspect justified feedback and its evidence, see a future review need and bounded practice recognition, reload/restart, and continue.

Build a focused, appealing web experience: a small course journey, task workspace, contextual hints, source card/link, save/resume behavior, and a satisfying recap. Use a balanced polished-workspace/gameful direction. It must be usable by keyboard and at narrow widths. This is not a CLI-only delivery or a dashboard mockup.

Use the corrected learner context: 6+ years of engineering experience, including roughly two years of independent work and agent development. Prefer challenging practical diagnostics; background is self-report, not proof of mastery. Keep that context in learner data, not domain-specific engine branches.

## Build in verified increments

1. Phase 0: inspect the baseline, establish reproducible build/test/start commands, run an actual database write/read and browser visit, and record bounded capability probes. Mark external model, permitted source inspection, browser observation, and later isolation capabilities as observed-working, blocked, or unavailable. Missing provider credentials must not block unrelated static-course work; missing actual database/browser verification blocks a complete Phase 1 claim.
2. Phase 1A: render one meaningful task and persist/resume a learner-scoped attempt through the real UI and database.
3. Phase 1B: implement one valid assessment criterion path, show its evidence honestly, and create a future retrieval need targeting a competency/frame rather than a course lesson.
4. Phase 1C: add assistance checkpoints, LEARN/PAIR/BUILD contracts, source-aid restrictions, failure/reload states, and a first idempotent practice reward separate from mastery.

For every increment: define a few executable acceptance scenarios, implement the smallest complete path, run focused tests and the accumulated critical checks, exercise the browser, inspect failures, repair, and retain a checkpoint. Do not accumulate dependent work on an unverified boundary. Ask only for consequential unresolved authorization or requirements; make ordinary reversible engineering choices independently.

## Assessment and ownership boundaries

Use reviewed static content with a prepared rubric and exact activity/frame/binding revisions. Generated design fixtures are drafts, not validated assessments. Use deterministic assessment only where it genuinely checks the criterion. Open-ended reasoning may use an explicit human/self-assessment path with visible provisional status; it must not be a canned pass or a keyword test presented as understanding.

Pin the presented task, response, allowed aids, rubric, competency/frame bindings, and assistance. Preserve a pre-hint checkpoint. Distinguish unknown, failed, invalid, provisional, and assisted outcomes. Expose LEARN/PAIR/BUILD without claiming advanced adaptive dialogue is already implemented.

Learner evidence and retrieval must live outside courses. Keep actual learner-scoped commands rather than a global current-user singleton. Practice XP is not mastery evidence. Private learner context must not leak into reusable course content or public source queries. Preserve the minimum historical assessment context needed for interpretation.

## Required verification

Run actual unit, integration, and browser checks. Include real persistence; duplicate submit and reward deduplication; reload and process restart; missing/invalid answers; answer preservation after a failed request; pre-hint versus assisted evidence; source-panel aid restrictions; unknown versus failed assessment; learner-scoped command isolation; and keyboard/narrow-screen interaction. Exercise the full implemented suite at the Phase 1 gate. Do not weaken tests or silently substitute mocks to claim a required check passed.

No broad generator, conversational product-change subsystem, repository integration, untrusted code runner, trained mastery model, or full knowledge-map dashboard in this task. Full A/B replacement and export/restore demonstrations are Phase 2; keep the boundaries ready and add cheap relevant integrity tests without expanding the milestone.

## Presentation and completion report

Present the running experience through the environment's supported preview mechanism, or provide exact tested local startup commands when the user runs it locally. Do not invent a reachable URL or claim a stopped process is live. Include actual browser screenshots or a short recorded walkthrough where supported.

Report implemented behavior; repository/base/candidate identity where available; exact commands and observed results; failures, blocked/skipped checks and limits; assessment limitations; persistence/migration notes; restart/restore steps; and the recovery route. Clearly separate machine verification, user acceptance, and activation. Never call synthetic feedback real acceptance.

End at the Phase 1 human checkpoint: invite the user to try the episode and ask whether the challenge, feedback, workspace, and restrained game elements work for them. State the single next recommended increment, but do not implement it yet. If a genuine execution constraint prevents completion, preserve and demonstrate the verified partial result and identify the specific missing gate; do not label the whole slice complete.
