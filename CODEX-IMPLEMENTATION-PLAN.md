# Learning OS — incremental implementation plan 1.3

**6 September 2026 · Design handoff, amended 8 September 2026**

This is the authoritative build order for the next coding agent. It replaces milestone order and first-release definitions in the 1.0 architecture, 1.1 amendment, and 1.2 collaboration amendment. Their applicable domain invariants and acceptance requirements remain in force.

**Active amendment:** future course-generation work must also satisfy `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/COURSE-GENERATION-GAME-SYSTEM.md`, `docs/GAME-UX-SYSTEM.md`, and `docs/GAME-UX-REVIEW.md`. Where this original plan says “generate a module,” it now means generate and validate a **playable, source-grounded learning game experience**. The order is now explicit: course topic/outcomes -> story/fantasy candidate -> story-only critic >=9 -> gameplay/world realization -> game critic >=9 -> learning/transfer gate -> user review. **Current story generation is topic-driven only**; learner creative preferences are a future explicit input and must not be inferred or fabricated today. The checksummed `learning-os-design-package-v1.3/` copy remains historical and is not rewritten in place.

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

Treat layout, wording, reward prominence, onboarding questions, initial route choices, heuristics, story/theme choices and component styling as revisable hypotheses. Use ordinary components and small typed configuration objects, not a universal page-builder language. Keep a modular monolith, one transactional database, and a simple artifact store. Reuse an existing sound stack rather than rewriting it to match example folder names.

One external model/provider and one generic permitted web-source path are enough initially. Provider-specific websites are source data, not branches in the learning engine. Leave richer integrations unsupported explicitly rather than constructing speculative adapters.

Evidence semantics are not cosmetic. Keep `unknown`, `declared_independent`, current-attempt `assisted`, and `previously_exposed` distinct. Not declaring outside help is not evidence that help was used; prior family/result exposure is not the same event as using a hint/source in the current attempt.

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

**Verification:** unit and real-database tests; duplicate submit; restart and reload; missing/invalid answer; pre-hint versus assisted checkpoints; source-panel aid restrictions; unknown versus failed assessment; no reward-to-mastery dependency; keyboard and narrow-layout browser interaction; preserved answer on failure. Verify the actual learner identity used by commands, not a global singleton. Verify that unknown outside-help declaration, observed current assistance and prior exposure are not collapsed into one label.

**Human checkpoint:** try the first episode. Ask whether the task, feedback, workspace and game experience are useful, clear and appealing. Repair the core interaction and teaching presentation before building more screens.

**Do not build:** hundreds of lessons, a graph dashboard, universal activity types, a trained mastery model, or untrusted code execution.

### Phase 2 — prove reuse before generating at scale

**Demonstration:** acquire evidence in Course A, replace A with Course B, and observe B use retained evidence; then delete all installed courses and still inspect Knowledge, Evidence, and Review.

Use actual persistence and application paths. A and B must differ in route and activity identities while sharing some canonical frames. Retain minimal historical assessment context rather than secretly keeping A installed. Fix the clock and policy versions when comparing projections. Due retrieval targets frames, not vanished exercise IDs; unavailable activities produce a visible content gap rather than lost review debt.

Add a second learner with a different declared background and preferences, plus a small non-software course using the existing text modality. Verify private experiences and state are separate. Self-report can affect scaffolding; it cannot silently become measured mastery. A local fixture identity selector tests scope, not production authentication.

Suggested increments: (1) replacement/deletion plus contradictory/regraded evidence; (2) second learner and supported non-software domain; (3) export and restore into a clean database, with no installed courses or live model required for replay.

**Verification:** A/B replacement; physical curriculum deletion; zero-course restart; private attempt/brief/reward/context isolation; deduplication and judgment replacement; consistent course-independent projections; import reference/version conflicts; old-schema fixture migration; export includes sufficient definitions and assessment context; restore preserves evidence semantics and review obligations. Changing a URL or platform difficulty label cannot change mastery.

**Exit:** permanent boundary tests run in the ordinary regression suite. Show the actual retained evidence and B's changed planning decision. Tests that only assert `mastery_table` still exists do not pass.

**Do not build:** all ontology migration types. Unsupported splits/merges return explicit diagnostic/review requirements.

### Phase 3 — source-guided onboarding and one genuinely generated playable module

**Demonstration:** a learner describes a goal and suggested sources, or selects Surprise me; the system prepares one coherent, source-grounded **learning-game chapter** and starts a useful playable activity.

Add the small `SourceSelectionPolicy` value object specified in `SOURCE-STEERING.md` to the private course brief. Support named sites/URLs, preferred versus required/excluded sources, an explicit only-listed boundary, and role-specific choices. Show the interpreted constraints without requiring a form. A suggestion is not exclusive by default and does not become a permanent profile preference without an explicit save request.

Use one model integration and one permitted web research path. Perform actual source inspection where allowed and record inaccessible/link-only sources. Then generate the scoped learning map and **a versioned story/fantasy/world treatment before gameplay/UI or mission text**. In the current implementation, derive that story from the course topic/outcomes and causal learning structure, with a broad kid + teen/young-adult quality target. Do not use or infer personal story preferences yet. A future learner-controlled story-preference profile may influence genre/tone/world/visual style once that subsystem is explicitly implemented and authorized.

Run the story-only critic in `docs/STORY-GENERATION-AND-CRITIC.md` on exactly one frozen story candidate. It judges hook, clarity/causality, character attachment, world appeal, storytelling, pacing/progression, stakes, payoff/forward pull and cross-age engagement. It ignores code, renderer sophistication and curriculum value. The unrounded story score must be **>=9.0/10 with no story blocker** before gameplay realization proceeds. A failed story is revised as story, not hidden under UI polish or Three.js.

Before specialist jargon, the generated experience should make four things clear: who/what wants something, what success means, what went wrong/changed, and what action/decision the learner must make. Emit both plain-language objectives and formal competency/frame objectives. Aim for an intuitive presentation a motivated middle/high-school learner could follow when faithful to the domain; this simplifies presentation, **not the eventual rigor**. Bridge the intuitive model explicitly into the real terminology rather than leaving the learner inside a metaphor.

Generate a campaign/progression graph, not merely a lesson order. The default confidence curve is **teach -> easy success -> variation -> combine -> boss -> release -> new mechanic**. Early missions normally introduce one new rule/action at a time. Difficulty rises through actual reasoning complexity, transfer, uncertainty, trade-offs or reduced scaffolding—not by making prompts longer. Experienced learners may receive explicit bounded diagnostics/test-out routes; self-report alone cannot create mastery.

Generate mission mechanics that embody the thinking where feasible: choosing, arranging, simulating, comparing, manipulating, debugging, constructing, tracing, classifying, sequencing or making trade-offs. Written responses are appropriate when explanation/design is itself the capability, not as the universal generated UI.

Generate the HUD/tool exposure schedule and progression focus. The HUD should expose the plain immediate objective, level/chapter progress, game progression and persistence state. Hints/Intel/play-style/advanced vocabulary should be progressively introduced. After a successful clear, the intended newly unlocked/recommended mission should become the predictable default focus; after failure, the current mission should normally stay selected for retry unless an explicit branch says otherwise.

Generate a causal feedback plan. Animation/story scenes should dramatize state changes and cause/effect—e.g. actor -> action -> lost message -> retry -> consequence—rather than merely decorate a page. First-run story progression is user-paced by default with Back/previous, Continue, Skip, replay, visible progress, and pause/resume when motion is active. Do not use rapid forced autoplay or a sequence of explanatory slides as the primary story form. The same meaning and navigation must remain available under reduced motion.

For each important story candidate, explicitly compare authored 2D, 2.5D/parallax and interactive Three.js 3D. Choose the medium for world presence, attention, story causality and device/accessibility constraints; 3D is a serious option for the target kid/teen/young-adult audience but earns no automatic critic points. Generate sound/haptic intent only as optional reinforcement where supported.

Preserve learning/evidence semantics through the generated game layer. XP/rewards never establish mastery or unlock competency progression solely through participation. `unknown`, `declared_independent`, current-attempt `assisted`, and `previously_exposed` remain distinct. Asking for help is not failure; prior exposure is not falsely described as help used on the current attempt.

Validate task/rubric/source meaning and publish immutable candidate artifacts with honest readiness labels. Reuse the Phase 1 persistence/evidence loop. Build bounded cancellation/retry and useful partial results into this first external workflow; do not add a distributed workflow platform.

The generator **cannot self-certify**. The story critic runs first and must pass >=9.0 with no story blocker. After gameplay realization, run structural/learning, grounding/content, accessibility/interaction, and a separately executed game-UX critic using `docs/GAME-UX-REVIEW.md`. Prefer genuinely distinct critic agents/model configurations when the harness supports them; otherwise record an `internal_tool_assisted` frozen-rubric pass without pretending independence. The game-UX score must be **>=9.0/10** with no critical blocker, and the applicable learning/transfer gate must independently reach >=9.0 before user review. Use a bounded repair budget; a still-failing candidate becomes `draft_needs_review` instead of weakening a rubric or looping forever.

Suggested increments: (1) conversational brief and editable source constraints; (2) actual source discovery/inspection with an explainable source report; (3) topic-derived story/fantasy treatment + story-only critic/repair loop; (4) campaign graph + mission/mechanic/visibility contract and 2D/2.5D/3D realization choice; (5) render one playable mission with persistence/evidence; (6) execute generated fixtures, game/learning critic loops and learner preview. Do not widen curriculum before this path works with real tools.

**Verification:** actual provider and permitted source smoke/integration checks, separately from recorded fixtures; malformed structured output; timeout/rate-limit/cancel; missing required source; only-listed boundary; prompt injection; forbidden/private URL and redirect handling; no private profile in public queries; no source-snippet-as-full-reading claim; broken embed/link fallback; snapshot policy revision; cold-start Surprise me; provisional versus validated assessment status; goals/evidence unchanged by generation alone; plain objective/story-to-mechanic mapping; boss prerequisites taught before boss; server-enforced mission locks; wrong-answer XP does not unlock; correct clear focuses intended next mission; save/reload/process restart; assistance labels distinguish unknown/current help/prior exposure; narrow viewport/text enlargement/reduced motion; story critic >=9, game critic >=9 with no blocker. Use `SS01`–`SS14` in `SOURCE-STEERING.md` for source steering plus the generated-course verification contract in `docs/COURSE-GENERATION-GAME-SYSTEM.md`.

**Human checkpoint:** play the first generated chapter, not just inspect its outline. Does the learner understand the objective and scenario before the jargon? Is the story/intuitive model compelling and faithful? Does difficulty build confidence? Are interactions fun enough to keep going? Does the source selection/depth match the request? Record actual revisions/acceptance. Automated checks alone do not establish course fit, comprehension, factual correctness or fun.

**Exit:** first useful personalized **playable learning-game** release for local trials, not merely model-generated lesson text. A real browser, real grounded-generation path, executed persistence/evidence path, passing validators, story critic >=9, game-UX critic >=9, applicable learning/transfer gate, and actual learner feedback are required for this claim. Mocks-only or text-only delivery is a narrower architecture demo.

### Phase 4 — collaborate on the experience, in two independently verified slices

**4A: supported personal UI change.** Capture feedback with the actual manifest and selected component; create a small configuration candidate; run browser checks; let the user try and revise it; receive explicit acceptance; activate the same artifact; confirm after reload; demonstrate another learner is unchanged; support undo.

**4B: source-guided course expansion.** Reuse Phase 3 authoring with a revised brief and source policy. Show coverage, source, workload, narrative/intuitive-model and progression changes. Add one useful section/chapter/mission, not arbitrary word count. Preserve active and historical assessments. Get feedback and activate a new experience revision. Source changes arriving during generation cannot silently approve an outdated candidate.

Implement the minimum durable change/review/check/activation records from revision 1.2. Share them between these two paths rather than building separate UI and content approval frameworks. Verification, user response, and activation status remain distinct.

**Verification:** resume interrupted change; reject/adjust/defer; duplicate accept; stale dependency; learner isolation; actual served-manifest match; broken change preserves last accepted experience; rollback preserves subsequent learning; real solution exposure during preview is retained; synthetic verifier attempts do not contaminate learner evidence or XP. Expand the permanent suite as each path appears; do not defer failures until both are finished.

**Human checkpoint:** one real revision cycle for the UI and one for content/game experience. A scripted `synthetic_user_acceptance` tests state transitions only.

**Exit:** useful course and presentation co-creation, without claiming arbitrary feature generation.

### Phase 5 — one genuinely new component through the code path

**Demonstration:** request an interaction absent from the current component catalog, build it in an isolated candidate environment, verify the running UI, receive user feedback and release authority, activate, and verify the served result.

Start with a bounded frontend capability, such as a trace-comparison interaction, that does not require changing assessment, authentication, runner permissions, or database schemas. Read the actual relevant code and rendered UI; record exact base/runtime versions; preserve dirty user work. One builder and an independently authorized verification/release path are sufficient.

Suggested increments: (1) reproduce pinned source/UI and test isolated candidate setup; (2) build and exercise the component in a preview with protected gates; (3) accept, release with scoped adoption, confirm, and undo safely. No autonomous broad repository rewrite.

**Verification:** actual code-agent invocation, built artifact, browser behavior, unchanged critical contracts, permission denial for secrets/production data/protected gates, fresh dependency checks, rejection and repair, release authority, candidate-to-deployed digest match, and a real rollback drill. A Git branch or worktree is not the isolation boundary. Model-authored test prose is not a runner result. New or modified visual baselines require review; the builder cannot make itself pass by deleting a requirement.

**Human checkpoint:** the learner evaluates the running feature; the product owner approves shared code release. Personal preference acceptance alone cannot authorize global code changes. These roles may be the same person in the initial local installation.

**Exit:** only now claim that the product supports genuine conversational feature generation. Missing isolation or release capabilities keep this gate blocked; do not disguise that limitation with a settings-only demonstration.

### Phase 6 — pilot and consolidate, not a delayed testing phase

Use the already working loop with a small number of consenting users in the chosen permitted deployment. Review task quality, comprehension, frustration, voluntary return, cost, change usefulness, hint dependence, progression pacing and delayed/transfer outcomes separately. Revise the highest-impact weakness rather than widening subjects automatically.

Run clean-checkout/start, migration from previous pilot data, backup/restore, restart/cancellation, accepted-manifest checks, and critical end-to-end journeys again on the candidate release. Keep earlier regression gates active. First validate new contracts on realistic prior data before creating broad consumers.

Before any hosted or externally accessible multi-user trial, implement and verify real authentication, ownership authorization, account/privacy lifecycle, secret handling, tenant-safe caches/storage, and execution/egress policy. These prerequisites apply before exposure, even if hosting is requested earlier than this phase. Development profile switching is not production identity enforcement.

**Exit:** a documented tested release, explicit known limitations, rollback/restore evidence, real user feedback, and a ranked next experiment. Do not infer educational efficacy from a green suite or course completion.

## 4. Verification matrix: checks begin when their risks first exist

| Risk | First gate | Keep checking thereafter |
|---|---|---|
| Wrong repository/build/tool assumptions | Phase 0 | Startup/resume and integration changes |
| Lost answers, duplicate submissions, hint misattribution | Phase 1 | Every learning-path increment |
| Unknown/prior-exposure/current-help label confusion | Phase 1 | Every assessment/evidence/UI change |
| UI usability, focus, narrow layouts, resume | Phase 1 | Every affected UI candidate |
| Course-dependent history or review debt | Phase 2 | Persistence, authoring, planner, and course changes |
| Cross-learner leakage | Phase 1 scoped command tests; full Phase 2 fixture matrix | Every scoped command/cache/artifact path |
| Migration/export/restore regressions | Phase 2, then every schema change | Every persistence release |
| Invented grounding, ignored source constraints | First source probe in Phase 0; full Phase 3 | Every authoring/source change |
| Confusing jargon-first generation / decorative story | Phase 3 | Every generated/expanded course candidate |
| Broken difficulty or unexpected next-mission focus | Phase 1 reference campaign; full Phase 3 generation | Every campaign/progression change |
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

The original 6 September revision was design-only. The active repository may now contain implemented Phase 1/pilot behavior and later amendments; `docs/STATE.md` is the current factual checkpoint. Phase descriptions remain requirements for capabilities not yet implemented. Existing design schemas should be extended in the phase that first consumes a new contract; do not attempt to encode all future records prematurely.

[R1] OpenAI, Custom instructions with AGENTS.md. https://developers.openai.com/codex/agent-configuration/agents-md — consulted 6 September 2026.

[R2] OpenAI, Codex best practices. https://developers.openai.com/codex/learn/best-practices — consulted 6 September 2026.
