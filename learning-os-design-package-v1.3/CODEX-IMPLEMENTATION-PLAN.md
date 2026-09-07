# Learning OS — incremental implementation plan 1.3

**6 September 2026 · Design handoff, not implemented software**

This is the authoritative build order for the next coding agent. It replaces milestone order and first-release definitions in the 1.0 architecture, 1.1 amendment, and 1.2 collaboration amendment. Their applicable domain invariants and acceptance requirements remain in force. This document does not authorize application implementation in the current design conversation.

## 1. Execution contract

Build one small, working, reviewable behavior at a time. Integrate and verify it before accumulating dependent work. A phase is a product checkpoint, not permission to implement its entire subsystem in one large patch.

For each increment, state the user-visible outcome, affected contracts, roughly three to five concrete acceptance scenarios, deliberately excluded work, and a recovery path. Split the increment when it contains independently shippable behaviors or several unrelated risky contract changes. Patch size is a review aid, not a correctness metric.

Use this loop:

```text
inspect actual baseline -> choose one behavior -> make criteria executable
-> implement the smallest complete path -> run focused tests
-> run persistent cross-boundary checks -> exercise the actual interface
-> inspect failures and repair -> retain evidence -> request relevant feedback
-> checkpoint and choose the next bounded increment
```

Do not build an entire backend before connecting a browser. Do not polish many screens before testing one learning episode. Do not write all provider/research/code-agent consumers against an untested integration assumption. Do not postpone course replacement, learner isolation, migrations, or restart behavior until a final hardening sprint.

Continue reversible engineering work without asking permission for every implementation detail. Obtain actual human feedback at the named product checkpoints, and do not call an unreviewed experience accepted. Independent low-risk work may proceed while feedback is pending; changes depending on the disputed decision must not accumulate. No response from the user is not approval.

## 2. What remains stable; what can be revised cheaply

Protect evidence identity, pinned assessment meaning, learner isolation, explicit assistance, immutable published content, provenance, source constraints, permission boundaries, and the difference between verification, user acceptance, and activation.

Treat layout, wording, reward prominence, onboarding questions, initial route choices, heuristics, and component styling as revisable hypotheses. Use ordinary components and small typed configuration objects, not a universal page-builder language. Keep a modular monolith, one transactional database, and a simple artifact store. Reuse an existing sound stack rather than rewriting it to match example folder names.

One external model/provider and one generic permitted web-source path are enough initially. Provider-specific websites are source data, not branches in the learning engine. Leave richer integrations unsupported explicitly rather than constructing speculative adapters.

## 3. The seven phases

### Phase 0 — establish the baseline and probe expensive assumptions

**Purpose:** discover what is real before designing consumers around it.

Inspect the actual repository and applicable instructions. Record entry points, current stack, working-tree state, storage, migrations, test commands, UI entry point, and available execution credentials. Preserve unrelated work. Reconcile the specification with existing useful code. Merge relevant handoff guidance into an existing `AGENTS.md`; do not replace it blindly.

Create the smallest reproducible build/test path using the chosen real database and a real browser. Probe available external capabilities with bounded, non-sensitive examples: a structured model response, a permitted source inspection, and browser observation. Check whether a code-agent adapter and an actual isolation boundary will be available for the later code-change phase. A harmless connectivity probe is not sandbox certification and must not execute untrusted code.

**Verification:** baseline commands and failures are recorded honestly; a database write/read and browser visit run in the actual environment; each capability is marked `observed_working`, `blocked`, or `unavailable`, with evidence and limits. A mocked response does not count as a live probe.

**Exit:** a short repository assessment, executable test entry points, a capability-risk register, and the first increment selected. Missing credentials block the relevant live gate, not unrelated deterministic work. Do not call a blocked integration operational.

**Do not build:** the complete registry, agent framework, all screens, or a production authoring pipeline.

### Phase 1 — one usable, persisted learning episode

**Demonstration:** open one small static course, attempt a meaningful problem, request a hint if needed, submit, see justified feedback and a future review need, reload, and continue.

Use a handful of competencies/frames, one supported response modality, reviewed static content, learner-scoped commands, and the real database. Pin the presented activity, rubric, frame bindings, allowed aids, answer, and assistance. Use a narrow deterministic or explicit human assessment path where valid; do not fabricate a canned pass or claim synthetic grading establishes real learning.

Build the small hybrid UI immediately: journey entry, focused task workspace, source card/link, contextual hints, save/resume, a recap, and bounded practice recognition. Show unknown/provisional status honestly. Record enough build/config/component identity to support later UI feedback without building the collaboration subsystem now. Expose LEARN/PAIR/BUILD mode and respect its assistance contract; advanced adaptive dialogue can follow later.

Suggested increments: (1) persist and resume an attempt in a real screen; (2) evaluate one valid criterion path and show evidence/review; (3) handle assistance, error/reload states, and the first reward without duplication. Each is integrated before the next.

**Verification:** unit and real-database tests; duplicate submit; restart and reload; missing/invalid answer; pre-hint versus assisted checkpoints; source-panel aid restrictions; unknown versus failed assessment; no reward-to-mastery dependency; keyboard and narrow-layout browser interaction; preserved answer on failure. Verify the actual learner identity used by commands, not a global singleton.

**Human checkpoint:** try the first episode. Ask whether the task, feedback, workspace, and light game elements are useful and appealing. Repair the core interaction before building more screens.

**Do not build:** hundreds of lessons, a graph dashboard, universal activity types, a trained mastery model, or untrusted code execution.

### Phase 2 — prove reuse before generating at scale

**Demonstration:** acquire evidence in Course A, replace A with Course B, and observe B use retained evidence; then delete all installed courses and still inspect Knowledge, Evidence, and Review.

Use actual persistence and application paths. A and B must differ in route and activity identities while sharing some canonical frames. Retain minimal historical assessment context rather than secretly keeping A installed. Fix the clock and policy versions when comparing projections. Due retrieval targets frames, not vanished exercise IDs; unavailable activities produce a visible content gap rather than lost review debt.

Add a second learner with a different declared background and preferences, plus a small non-software course using the existing text modality. Verify private experiences and state are separate. Self-report can affect scaffolding; it cannot silently become measured mastery. A local fixture identity selector tests scope, not production authentication.

Suggested increments: (1) replacement/deletion plus contradictory/regraded evidence; (2) second learner and supported non-software domain; (3) export and restore into a clean database, with no installed courses or live model required for replay.

**Verification:** A/B replacement; physical curriculum deletion; zero-course restart; private attempt/brief/reward/context isolation; deduplication and judgment replacement; consistent course-independent projections; import reference/version conflicts; old-schema fixture migration; export includes sufficient definitions and assessment context; restore preserves evidence semantics and review obligations. Changing a URL or platform difficulty label cannot change mastery.

**Exit:** permanent boundary tests run in the ordinary regression suite. Show the actual retained evidence and B's changed planning decision. Tests that only assert `mastery_table` still exists do not pass.

**Do not build:** all ontology migration types. Unsupported splits/merges return explicit diagnostic/review requirements.

### Phase 3 — source-guided onboarding and one genuinely generated module

**Demonstration:** a learner describes a goal and suggested sources, or selects Surprise me; the system prepares one coherent, source-grounded module and starts a useful activity.

Add the small `SourceSelectionPolicy` value object specified in `SOURCE-STEERING.md` to the private course brief. Support named sites/URLs, preferred versus required/excluded sources, an explicit only-listed boundary, and role-specific choices. Show the interpreted constraints without requiring a form. A suggestion is not exclusive by default and does not become a permanent profile preference without an explicit save request.

Use one model integration and one permitted web research path. Perform actual source inspection where allowed, record inaccessible/link-only sources, generate a scoped outline and first module, validate its tasks and grading basis, and publish immutable artifacts with honest readiness labels. Reuse the Phase 1 loop. Build bounded cancellation/retry and useful partial results into this first external workflow; do not add a distributed workflow platform.

Suggested increments: (1) conversational brief and editable source constraints; (2) actual source discovery/inspection with an explainable source report; (3) generate, validate, publish, and experience one module. Do not widen curriculum before this path works with real tools.

**Verification:** actual provider and permitted source smoke/integration checks, separately from recorded fixtures; malformed structured output; timeout/rate-limit/cancel; missing required source; only-listed boundary; prompt injection; forbidden/private URL and redirect handling; no private profile in public queries; no source-snippet-as-full-reading claim; broken embed/link fallback; snapshot policy revision; cold-start Surprise me; provisional versus validated assessment status; goals/evidence unchanged by generation alone. Use `SS01`–`SS14` in `SOURCE-STEERING.md`.

**Human checkpoint:** inspect the first module and source-selection explanation. Does it reflect the requested goal, depth, and source guidance? Record actual revisions/acceptance. Automated checks alone do not establish course fit or correctness.

**Exit:** first useful personalized learning release for local trials, not full collaborative product generation. A real browser and real grounded-generation path are required for this claim. Mocks-only delivery is a narrower architecture demo.

### Phase 4 — collaborate on the experience, in two independently verified slices

**4A: supported personal UI change.** Capture feedback with the actual manifest and selected component; create a small configuration candidate; run browser checks; let the user try and revise it; receive explicit acceptance; activate the same artifact; confirm after reload; demonstrate another learner is unchanged; support undo.

**4B: source-guided course expansion.** Reuse Phase 3 authoring with a revised brief and source policy. Show coverage, source, and workload changes. Add one useful section and task, not arbitrary word count. Preserve active and historical assessments. Get feedback and activate a new experience revision. Source changes arriving during generation cannot silently approve an outdated candidate.

Implement the minimum durable change/review/check/activation records from revision 1.2. Share them between these two paths rather than building separate UI and content approval frameworks. Verification, user response, and activation status remain distinct.

**Verification:** resume interrupted change; reject/adjust/defer; duplicate accept; stale dependency; learner isolation; actual served-manifest match; broken change preserves last accepted experience; rollback preserves subsequent learning; real solution exposure during preview is retained; synthetic verifier attempts do not contaminate learner evidence or XP. Expand the permanent suite as each path appears; do not defer failures until both are finished.

**Human checkpoint:** one real revision cycle for the UI and one for content. A scripted `synthetic_user_acceptance` tests state transitions only.

**Exit:** useful course and presentation co-creation, without claiming arbitrary feature generation.

### Phase 5 — one genuinely new component through the code path

**Demonstration:** request an interaction absent from the current component catalog, build it in an isolated candidate environment, verify the running UI, receive user feedback and release authority, activate, and verify the served result.

Start with a bounded frontend capability, such as a trace-comparison interaction, that does not require changing assessment, authentication, runner permissions, or database schemas. Read the actual relevant code and rendered UI; record exact base/runtime versions; preserve dirty user work. One builder and an independently authorized verification/release path are sufficient.

Suggested increments: (1) reproduce pinned source/UI and test isolated candidate setup; (2) build and exercise the component in a preview with protected gates; (3) accept, release with scoped adoption, confirm, and undo safely. No autonomous broad repository rewrite.

**Verification:** actual code-agent invocation, built artifact, browser behavior, unchanged critical contracts, permission denial for secrets/production data/protected gates, fresh dependency checks, rejection and repair, release authority, candidate-to-deployed digest match, and a real rollback drill. A Git branch or worktree is not the isolation boundary. Model-authored test prose is not a runner result. New or modified visual baselines require review; the builder cannot make itself pass by deleting a requirement.

**Human checkpoint:** the learner evaluates the running feature; the product owner approves shared code release. Personal preference acceptance alone cannot authorize global code changes. These roles may be the same person in the initial local installation.

**Exit:** only now claim that the product supports genuine conversational feature generation. Missing isolation or release capabilities keep this gate blocked; do not disguise that limitation with a settings-only demonstration.

### Phase 6 — pilot and consolidate, not a delayed testing phase

Use the already working loop with a small number of consenting users in the chosen permitted deployment. Review task quality, frustration, voluntary return, cost, change usefulness, hint dependence, and delayed/transfer outcomes separately. Revise the highest-impact weakness rather than widening subjects automatically.

Run clean-checkout/start, migration from previous pilot data, backup/restore, restart/cancellation, accepted-manifest checks, and critical end-to-end journeys again on the candidate release. Keep earlier regression gates active. First validate new contracts on realistic prior data before creating broad consumers.

Before any hosted or externally accessible multi-user trial, implement and verify real authentication, ownership authorization, account/privacy lifecycle, secret handling, tenant-safe caches/storage, and execution/egress policy. These prerequisites apply before exposure, even if hosting is requested earlier than this phase. Development profile switching is not production identity enforcement.

**Exit:** a documented tested release, explicit known limitations, rollback/restore evidence, real user feedback, and a ranked next experiment. Do not infer educational efficacy from a green suite or course completion.

## 4. Verification matrix: checks begin when their risks first exist

| Risk | First gate | Keep checking thereafter |
|---|---|---|
| Wrong repository/build/tool assumptions | Phase 0 | Startup/resume and integration changes |
| Lost answers, duplicate submissions, hint misattribution | Phase 1 | Every learning-path increment |
| UI usability, focus, narrow layouts, resume | Phase 1 | Every affected UI candidate |
| Course-dependent history or review debt | Phase 2 | Persistence, authoring, planner, and course changes |
| Cross-learner leakage | Phase 1 scoped command tests; full Phase 2 fixture matrix | Every scoped command/cache/artifact path |
| Migration/export/restore regressions | Phase 2, then every schema change | Every persistence release |
| Invented grounding, ignored source constraints | First source probe in Phase 0; full Phase 3 | Every authoring/source change |
| Fake acceptance, stale candidate, wrong activation | Phase 4 | Every collaborative change |
| Arbitrary code/privilege leakage, false verifier reports | Before the first Phase 5 execution | Every runner/capability release |
| Hosted identity and private data exposure | Before any external access | Every hosted deployment |

Keep ordinary CI deterministic with local fixtures or permitted stored responses. Separately run live provider/source checks at initial integration, affected integration changes, and release checkpoints. Live failures must remain visible: do not poll public sites for every unit test, and do not relabel an unavailable service a successful integration. Store only responses you are authorized to retain.

Focused unit/contract checks run while editing. A small persistent critical-boundary suite runs for each integrated increment. Run the full implemented suite at phase/release gates and immediately when changing shared storage, identity, permission, or versioning contracts. Maintain a stable browser smoke journey; use targeted interaction/visual tests for affected components rather than brittle screenshots of everything.

A newly required unavailable check blocks the associated claim/adoption. Existing unrelated baseline failures may be recorded with their impact and owner, but cannot excuse a new failure or compromise the active gate. Never silently delete, skip, loosen, or fabricate a gate to advance.

## 5. Rework protocol

When a core assumption fails, stop dependent expansion. Save the failing case as a regression test, inspect which existing consumers actually depend on it, write a brief decision update, and make the smallest compatible correction. Re-run the boundary suite before resuming feature work. Do not bury the failing abstraction under successive adapters and fallback branches.

Contract changes require a compatibility decision: supported addition, explicit new revision, or migration. Use a representative database from the previous phase in migration tests. Prefer additive, backward-compatible rollout initially. Restoring a UI/course selection must not erase learner work; restoring application code is not automatically a database rollback.

Allow parallel work only across genuinely independent verified interfaces. One owner coordinates shared schema, identity, and API changes. Do not let several agents invent incompatible versions of the same contract and merge them at the end.

Small code checkpoints should preserve a runnable baseline, completed test evidence, and a clear recovery route. A feature flag limits rollout but does not substitute for authorization or isolation. Do not commit secrets or unrelated user files to create a checkpoint.

## 6. Durable handoff and completion report

Keep a short repository-local guidance file plus the current increment and test evidence. The main agent context should point to exact files, commits, manifests, sources, and logs; do not reload every design document or rely on an old chat summary as current code state.

Use `handoff/AGENTS.template.md` as guidance to merge into existing instructions. OpenAI's official documentation describes `AGENTS.md` discovery, and recommends practical project/test guidance rather than a sprawling generic rulebook [R1, R2]. The template does not override the repository's actual commands or the user's authorization.

After each increment, report: what changed; exact base/candidate/served versions where applicable; commands and checks actually run; failures/blocked/skipped checks; actual user feedback or pending state; persisted-state/migration implications; rollback path; and the single next increment. Separate machine verification, product acceptance, and activation.

Do not write “all phases complete” after scaffolding. Do not claim the schemas/tests in this design package are application behavior. Do not infer one feature works merely because its mocked port compiles.

## 7. Scope and sources

No application code, database, browser, provider integration, sandbox, or runtime tests were created or executed for revision 1.3. The phase descriptions are requirements. Existing design schemas must be extended in the phase that first consumes a new contract; do not attempt to encode all future records before Phase 1.

[R1] OpenAI, Custom instructions with AGENTS.md. https://developers.openai.com/codex/agent-configuration/agents-md — consulted 6 September 2026.

[R2] OpenAI, Codex best practices. https://developers.openai.com/codex/learn/best-practices — consulted 6 September 2026.
