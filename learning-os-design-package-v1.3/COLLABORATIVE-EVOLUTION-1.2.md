# Learning OS — collaborative evolution design 1.2

**6 September 2026 · Architecture and product design only · No application implementation**

## Authority and reading order

This amendment adds collaborative, agent-mediated product and course evolution to revision 1.1. It also records the user's chosen visual starting point: a balanced hybrid between a polished workspace and a game-like journey, refined through user feedback. Read this amendment and its companion contracts/acceptance specification before the earlier product amendment and baseline architecture. Where there is a conflict, 1.2 takes precedence, then 1.1, then 1.0.

Preserve the earlier commitments: reuse across learners and courses, conversational onboarding and Surprise me, web-grounded generated material, meaningful gamification, immutable assessment context, course-independent evidence, inspectable models, privacy, and a modular monolith. The user's profile is one profile, not a hard-coded default. The application is still not authorized for implementation in this conversation.

Only design artifacts were available for this amendment. No actual application source, live UI, deployed build, CI runner, or production environment was inspected. The inspection and execution abilities below are requirements for the future product, not claims about capabilities already implemented. The old JSON Schemas and old validation report do not validate these new contracts.

## 1. Product definition: co-create, try, verify, accept

A learner can point at a UI element or discuss a course and ask for a change. The agent interprets the desired outcome, inspects the relevant current state, produces the smallest suitable change, verifies it, lets the learner try it, and records explicit acceptance or further feedback.

The agent must genuinely be able to create new components and modify application code when existing configuration is insufficient. This is not merely a settings chatbot. Conversely, changing a preference or adding course material should not require recompiling the product.

The experience is one conversational relationship with distinct capabilities behind it:

- **Learning capability:** teach, assess, plan, and retrieve through existing learning contracts.
- **Experience-editing capability:** revise authorized presentation, personal routes, and course content.
- **Product-development capability:** inspect source, propose code, test a candidate, and request an authorized release.

These are permission and module boundaries, not a requirement for three chat windows, three vendors, or a multi-agent swarm. The learner's LEARN/PAIR/BUILD mode does not force an unwanted tutoring exercise while discussing the product itself. Preserve any active attempt before a change workflow interrupts its screen.

**Completion means verified change + explicit user acceptance + matching successful activation.** An agent's final narrative, a green build alone, or user silence cannot establish all three.

## 2. Change scope and implementation mechanism are separate

Every request has an audience/scope and a mechanism. A personal request may require shared component code, but that does not grant permission to change everyone else's experience.

| Mechanism | Example | Implementation | Default audience and authority |
|---|---|---|---|
| Supported presentation change | Hide the XP strip while answering; make hints a drawer | Versioned, schema-validated configuration | Requesting learner or selected experience; learner can accept |
| Content/route change | Expand a system-design section with deeper examples | New immutable content/course references plus private experience revision | Private experience; shared source package unchanged unless authorized |
| New reusable interaction | Add an interactive trace explorer or resizable evidence panel | Tested component/API capability plus scoped configuration | Isolated preview first; product owner controls code release; learner controls personal adoption |
| Core policy/infrastructure change | Alter grading, identity mappings, auth, persistence, or runner permissions | Explicit engineering change with stronger gates | Product-owner/security/data authority; never authorized by ordinary learner feedback |

Use the first mechanism that satisfies the request properly, not the smallest superficial visual patch. Do not replace “expand this course” with a larger font or more repeated prose. Do not replace “this interface is confusing” with hiding a functional defect.

### Defaults

Personal presentation requests apply to the current learner and named surface. Content requests apply to the current course experience. Clarify current-course versus all-courses scope only when the user's wording and captured context cannot resolve it. An ordinary learner cannot approve a shared release. In a single-owner installation the learner and product owner can be the same person, but the authorization record still distinguishes their roles.

Deployment remains an open decision from revision 1.1. Until resolved, retain local single-owner development and isolated learner fixtures. Nothing here authorizes public hosting. A later hosted version needs real authentication, account lifecycle, and scoped permissions before multiple users can access it.

### Avoid permanent per-user source forks

Use shared components and a limited, typed composition model for different experiences. A newly generated reusable component can become an installed capability, enabled only where adopted. Each such component still requires code-release verification, even when its feature flag is off for most learners; disabled code is not a security boundary.

Do not introduce `if learner_id == ...` branches in shared UI source, database-stored executable JavaScript, unrestricted custom CSS, arbitrary course HTML, or a forked frontend deployment for every person. A genuinely isolated, independently versioned tenant application is a separate later product decision, not the default personalization mechanism.

Configuration is deliberately bounded. A request beyond supported composition must take the real code-change path rather than being refused merely because no setting exists. Maintain a small component catalog and prune obsolete variants after compatibility review; do not build a plugin marketplace.

## 3. User experience: direct feedback without a ticketing-system feel

Provide a persistent **Improve this** action in the learning workspace and course journey. It opens the same assistant conversation with an optional element selector. A user can also simply describe a change in ordinary chat.

For an element-targeted request, capture a stable component key, semantic subtarget/action, route, active experience, and the exact build/config versions. Offer a cropped screenshot with visible consent controls. A screenshot is helpful context, not a substitute for a semantic target. On touch devices, selecting a target must have an accessible alternative to precision pointing.

The agent responds with an outcome-oriented interpretation, such as:

> “I'll move the hints into a collapsible drawer for this course, keep the answer area full width, and preserve your current response. I'll check both keyboard and narrow-screen behavior.”

A clear, reversible request authorizes making a candidate within the existing permission and budget envelope. It should not require repeated proposal approvals. Ask a targeted question when the unresolved choice changes meaning, cost, disclosure, destructive effects, or the population affected.

The change card shows the proposed effect, scope, real progress, a working preview, an honest check summary, and three core responses: **Keep this**, **Needs adjustment**, **Discard/Revert**. Allow short free-text feedback with any choice. Development details and source/code diffs are expandable rather than mandatory reading.

For compound requests, create separately reviewable parts where practical. A learner can accept a better panel layout but ask for a different course expansion. Do not force an unrelated accepted change through every revision of another part. One atomic candidate should represent changes that must actually move together.

### Feedback interpretation

Record the user's feedback on the exact candidate and environment they experienced. “This still feels crowded” should become a scoped UI preference proposal and a revision request, not a permanent claim about the learner's personality or competence. “This topic is too shallow” is evidence about fit, not proof of mastery. “The answer key is wrong” opens an assessment/content dispute, not permission to increase a score.

A low rating does not authorize browsing unrelated accounts or changing other users' settings. Aggregating feedback into a shared product roadmap is separate from sharing the underlying private conversation, screenshots, or course material.

## 4. Effective experience state: what the user actually sees

Repository HEAD, the deployed frontend, backend release, component configuration, course version, and browser-local state may differ. Treat this as normal state to observe, not a discrepancy to paper over.

Introduce a resolved **ExperienceManifest** containing exact references to:

- application frontend/backend release artifacts and API/schema compatibility;
- installed component catalog and presentation schema;
- product/workspace defaults, learner presentation settings, and current-experience overrides;
- resolved course/content references and active learning-policy references;
- capability/feature configuration and its revision;
- privacy scope and a server-computed digest of the effective configuration.

Keep the manifest private where it includes personal configuration. It is not a copy of the learner's entire record. Use opaque identifiers and references rather than embedding secrets, answers, or raw personal project material.

Define the default presentation merge order: product defaults, authorized workspace defaults, learner settings, then explicit current-experience overrides. Runtime security, assistance, accessibility constraints, and supported-capability limits are enforced after composition and cannot be weakened by presentation overrides. Show inherited values and a reset-to-inherited action. System motion preferences are respected unless the product explicitly provides a safe, user-selected override consistent with its policy.

This is not a requirement for a universal page-description language. Initially support layout regions, approved component variants, density/typography tokens, motion/reward prominence, and resource-panel placement.

An active assessment independently pins its stimulus/rubric/aid contract even if the surrounding experience advances. A new manifest is used for subsequent navigation; it must not replace the question or discard the answer under an active learner.

## 5. Make the agent state-aware through a context harness

The context builder is an application module, not a giant prompt. It acquires scoped evidence, exposes uncertainty, and lets the agent fetch more detail on demand.

| Context layer | Required information | Trust/freshness rule |
|---|---|---|
| Desired outcome | Request, selected target, acceptance criteria, latest user corrections | Current request revision is authoritative for intent |
| Effective runtime | Experience manifest, route, viewport, relevant UI state, frontend/backend version | Captured from running application; do not infer from Git |
| Rendered UI | Cropped screenshot, relevant DOM/accessibility structure, selected computed styles, bounded error metadata | Timestamped, consented, redacted; inaccessible portions marked unavailable |
| Code | Exact commit, dirty-state digest where applicable, relevant modules, dependency locks, tests, architecture constraints | Index summaries must match revision; fetch source before editing |
| Content | Exact course/activity/rubric refs, source basis, capability needs, coverage and gaps | Published records immutable; quality labels remain explicit |
| Learner context | Only relevant preferences, goal constraints, active attempt and progress pointers | Read-only to editor; no full-history dump by default |
| Change history | Earlier candidates, failures, user decisions, known defects | Structured records, not reliance on a provider thread |
| Permissions and limits | Allowed scope/actions, egress, execution, cost, protected paths | Server-enforced; cannot be granted by retrieved content |

### Component-to-code mapping

Maintain a build-versioned internal catalog mapping a semantic component key to its source module(s), supported properties, owning module, behavioral contract, and relevant tests. The browser may expose a stable key and semantic target, but should not publicly expose internal source paths, secrets, or privileged diagnostics.

A selected “source panel” can then resolve to its component and tests instead of making the agent search the whole repository by visible wording. The mapping is a navigation aid, not proof that all dependencies are captured; shared hooks, state stores, server routes, and side effects still need inspection.

### Runtime observation

Use a browser adapter for DOM/accessibility snapshots, screenshots, interactions, console errors, and bounded request metadata. Playwright's trace facilities provide a practical implementation path for action-level snapshots, screenshots, and network/console inspection [S1]. Do not capture every user's entire session continuously. Capture an explicit report or a bounded reproduction and retain it under a defined policy.

Allowlist metadata rather than collecting raw headers and request bodies by default. Mask passwords, tokens, personal identifiers, sensitive course content, and repository excerpts before external model processing. Synthetic fixtures are the default for development previews. A real user's state may be copied only through a specific authorized, minimized snapshot; production credentials must never be copied into candidate environments.

Third-party embedded frames may not be inspectable. The agent can verify the containing component, integration response, and fallback but must label interior behavior unverified when it cannot observe it.

### Freshness and contradictions

A ContextSnapshot has exact references, timestamps, digests, captured/omitted fields, and a distinction between observation, inference, and unavailable data. If the screenshot says frontend R17 and the source checkout is R19, record both. Reproduce the deployed behavior on the matching revision or establish an explicit comparison; do not claim R19 describes what the user saw.

Before editing and before adoption, validate the candidate's read set. Rebase and rerun affected checks when those dependencies change. Do not invalidate a color/layout change because the learner completed an unrelated exercise; use typed, relevant dependencies rather than a global timestamp.

On resume after interruption, reload the durable change state and refresh stale dependencies. A token-compressed summary is a pointer to evidence, never the sole record of the current code/UI.

## 6. Workflow and verification lifecycle

Use a durable change record and a job worker. The application should support resumable work, cancellation, bounded cost/repair cycles, and real progress reporting when implemented. This document does not start any background job.

```text
Capture request and affected target
    -> inspect relevant current state
    -> define scoped acceptance criteria and impact
    -> build a new candidate in isolation
    -> execute the verification plan
    -> expose a verified trial/preview
    -> explicit user feedback: keep / revise / reject / defer
    -> authorize activation for the requested audience
    -> activate exact compatible artifacts
    -> check the actually served experience
    -> close as accepted and activated, or retain a precise blocked/failed state
```

Requests already express authorization for low-risk candidate creation. High-impact permissions and release approvals are separate. A technical failure repairs the candidate; a subjective rejection revises the design. Neither is hidden by restarting the conversation.

### Separate status dimensions

Do not use a single `done` or `verified` boolean. Track workflow phase, per-check outcomes, user-review status, release authority, and activation status independently. A learner can like a candidate that is blocked from release. A safe release can remain unaccepted by the user. Both facts should remain visible.

Examples of valid UI labels: “checks passed; ready to try,” “accepted; awaiting product-owner release,” “applied; checking served version,” “verification incomplete,” and “awaiting your feedback.” Do not claim feedback was obtained when only a notification was shown.

### One final feedback step for ordinary changes

For a personal reversible setting or content revision, expose the candidate as a scoped trial using the same renderers and APIs it will use after adoption. After the checks, the learner tries it and chooses Keep this / Needs adjustment / Discard. Keep this is explicit final feedback on that exact experienced candidate; the server then persists the identical configuration/content pointers and confirms that the active manifest matches. There is no need for a second compulsory “are you sure?” modal.

If activation changes the material behavior, content, capabilities, or effective build, the previous feedback does not certify the changed result: rerun affected checks and request renewed feedback. Feedback on a static mockup is not acceptance of a working interactive feature.

For higher-risk/shared code changes, product-owner release approval is additional to learner feedback. If the learner did not experience the final equivalent build, the change remains awaiting final user feedback even after release. Optional later feedback about learning usefulness is distinct from immediate change acceptance and does not rewrite it.

If the learner leaves or defers, preserve a draft and the reason. Do not treat silence as acceptance, repeatedly nag, or force them to stop learning. A later session can show one contextual outstanding-change card. An unaccepted trial expires to the last accepted experience while preserving any required exposure records.

## 7. Verification must test the claim, not just the build

Define acceptance criteria before construction, with separate machine-checkable, expert/reviewer, and user-judgment items. New evidence can refine the plan, but do not quietly weaken a failing criterion to obtain a pass.

| Area | Required evidence |
|---|---|
| Build/contracts | Actual type/schema/build results for changed artifacts, with exact commands, versions, exit statuses, and logs |
| Functional behavior | Reproduction and expected-change tests; persistence/reload/resume; affected error/empty/loading states |
| Rendered experience | Working preview, screenshot comparisons, DOM/accessibility checks, keyboard and narrow-screen interaction |
| Content | Exact mappings, source inspection, unsupported-claim labels, coherent examples, coverage diff, prepared rubrics where assessed |
| Learning invariants | No implicit mastery/assistance changes; frozen attempts remain interpretable; retrieval/rewards remain correct |
| Isolation | Second-learner experience unchanged; authorization denial paths; private artifacts inaccessible across scope |
| Activation | Served frontend/backend/config/content references match the accepted candidate; rollback is viable |
| User fit | Explicit feedback after the user experiences the candidate; not a model-predicted rating |

Screenshot comparison is useful but not a taste oracle. Playwright documents visual comparisons and cautions that rendering depends on environment [S2]. Pin browser/runtime/fonts/viewport for comparisons; include the normal learning and responsive states, not just a pristine empty screen. Expected intentional differences require review. The agent cannot make a broken design “pass” by replacing every baseline image or masking the changed element.

Automated accessibility scans are necessary but incomplete; the official guidance explicitly warns that not all accessibility problems can be detected automatically [S3]. Include keyboard/focus interactions and direct user testing appropriate to the changed surface. Do not promise full accessibility conformance from one scanner result.

A code-building agent may propose tests, but critical invariant checks and acceptance-policy definitions must be held by a protected verifier. Test results are produced by the runner and tied to the candidate digest, not supplied as trusted strings by the editing agent. Editing a protected test, changing a baseline, or disabling a gate is a separate reviewed change. Use a second model for critique where useful, but model agreement is not independent proof.

Keep baseline failures, candidate failures, skips, unavailable tools, and nondeterminism visible. A skipped required check is not a pass. Run a baseline when practical so an existing unrelated defect is not attributed to the patch; block on required safety/integrity failures regardless of who introduced them. Do not count a mock provider call as a real provider integration test.

For course quality, structural and link checks cannot prove educational accuracy. Semantic review can remain provisional, and high-stakes/ambiguous assessment must abstain or escalate. Verification labels should name what was checked rather than claim universal correctness.

## 8. Code changes without self-modifying production

The conversational agent gets a scoped development task, not permanent production authority. A code adapter prepares an isolated checkout from the pinned base, applies a patch, builds immutable candidate artifacts, and runs approved commands with resource and network limits.

Git worktrees can help maintain separate working trees for candidates [S4]. They are not a security sandbox. Where agents execute arbitrary code, use a verified execution isolation boundary with restricted filesystem/network access and no production secrets. Merely creating a directory, branch, worktree, or ordinary container does not establish adequate isolation.

Protect uncommitted user work. Record a dirty-state digest; use an explicitly captured patch snapshot when authorized or start a clean candidate from the matching release. Never reset, stash, overwrite, or commit a user's unrelated edits automatically. A development worktree is not the same object as a learner's project repository.

The candidate cannot grant itself permissions, choose its own approving identity, write CI attestations, alter protected verification policies, or deploy itself. The release controller checks the exact artifact, permissions, verification, compatibility, scope, and active base. Restricting tools and permissions, with human authorization for higher-impact actions, follows the least-agency approach described by OWASP [S5].

The user’s orchestrator can eventually implement the CodeAgentPort for Claude Code, Codex, OpenCode, or another executor. The learning engine must still operate when that adapter is absent. Ordinary content/presentation editing remains available. Do not hard-code those provider names into course packages, canonical learner state, or the learning core.

Reject unbounded build/research loops. Start with one candidate branch per change, one verifier lane, an explicit cost/time/tool budget, and at most two automatic repair attempts before reporting a blocked state with useful artifacts. This is an adjustable starting policy, not a capability guarantee.

## 9. Course expansion without corrupting learning state

“Make this course more expanded” is ambiguous in educationally important ways: more breadth, deeper theory, more worked examples, more implementation practice, or more transfer assessment. Use the conversation and brief to infer an initial direction; ask one scoped question when needed. Do not equate “expanded” with word count.

For a current system-design course, a reasonable interpretation might be deeper trade-offs and failure analysis in an existing reliability module, not adding every distributed-systems topic. State the assumption and show an editable depth/breadth/practice plan with estimated added effort, scope, and quality labels. Estimates are provisional, not guarantees.

The content editor performs a coverage diff, researches and inspects sources, prepares new teaching and activities, maps existing canonical frames where valid, and produces a new immutable release or private experience-specific content variant. Reuse unchanged content by reference. Never fork the learner's evidence along with the course.

Keep two changes distinct: adding material that supports an existing goal, and expanding the learner's committed target set. New optional material does not silently become required study. The preview should show both proposed content changes and goal/commitment changes. Explicitly accepting a clearly described expanded scope can authorize a new goal revision; otherwise keep additional targets optional.

Before adoption, compare current history and active attempts. Do not rewrite attempted prompts, answer keys, assistance records, frame identities, or completed work. Reconcile future planning from retained evidence. Preserve retrieval needs for existing targets even if their course location changed. A progress percentage may change with an enlarged denominator; show the reason without claiming that the learner lost knowledge.

Reviewing a faulty question can generate a corrected future activity. Retrospective regrading is a separate adjudication process that preserves the original judgment and evidence-root identity. A satisfaction-oriented content editor has no direct write authority to grades, mastery, rewards, or competency equivalence.

### Preview exposure is real even when preview scores are not

Automated verification and synthetic preview attempts never write real learner evidence or rewards. But when a real learner sees a real problem or its solution in a preview, that is an actual exposure. Record the appropriate exposure/assistance event through the existing learning contract, with purpose `change_preview` and exact family/content references.

Discarding the preview does not make the learner “unsee” the solution. Preserve novelty contamination across course versions and rollbacks. Use sample variants or instructor-style previews that withhold held-out answers. The final assessor cannot call a previously revealed problem independent/novel just because its course was not adopted.

Never request final course feedback by displaying hidden assessment answers beside an active diagnostic. Server-side content eligibility/assistance rules apply to every renderer, including custom components and preview routes; CSS hiding is not the security or pedagogy boundary.

## 10. Activation, drift, and undo

Stage immutable output artifacts first. Adopt them by changing a scoped active pointer under optimistic concurrency, not by updating content and preference rows piecemeal while the learner is interacting.

For a personal data/content change, persist the expected prior experience revision, accepted candidate, revised configuration/course refs, audit event, and outbox receipt in a single local transaction. A retry returns the same outcome. The actual browser then reports its served manifest; a mismatch remains activation-incomplete until resolved. Browser/CDN/service-worker staleness is not success merely because the server pointer changed.

For code releases, retain backward-compatible APIs and deploy tested build artifacts, then check readiness, then enable the candidate's scoped configuration/content pointers. Publish the entire required capability/content relationship as one checked activation bundle. If new content requires a new renderer, do not expose that content before the renderer is available.

Database and multi-environment deployment cannot be made atomically reversible by a Git revert. Treat code deployment as a recorded workflow with explicit compensating actions. Changes requiring schema migration need a separate expand/contract and recovery plan. Destructive data migrations are out of scope for the first collaborative slice.

Undo restores the previous accepted configuration/content selection or a compatible release. It does not delete attempts, exposures, or legitimate learning performed since adoption. Check compatibility with newly generated data before rolling code back; use a forward repair when a backward rollback would lose data. A rollback of one personal change must not remove an unrelated change accepted later—calculate a new revision that removes only the selected effect and check conflicts.

If two requests change the same field or dependent content, reject a stale activation with `CONFLICT` and build/review a compatible candidate. Do not silently use last-write-wins. Disjoint changes can compose only after checking the resulting effective manifest and affected tests; merging a branch alone is not proof of behavioral independence.

## 11. Architecture and minimum implementation shape

Add a **Collaborative Change** module next to authoring/application orchestration, not inside the learning estimator or course schema.

```text
Feedback UI / conversation
    -> ChangeCoordinator
         -> ContextBuilder (scoped read ports)
         -> planner/model task contracts
         -> ExperienceEditor -> supported configuration candidates
         -> CourseEditor -> existing authoring/publication candidates
         -> CodeAgentPort -> isolated source/build candidates
         -> VerificationRunner -> artifact-bound check results
         -> ReviewPresenter -> working candidate + explicit user decision
         -> ActivationController -> authorized exact-pointer/release change

Learning core, content registry, and assessment retain existing ownership.
```

This remains a modular monolith with one relational database and an ordinary jobs/outbox mechanism. The untrusted execution sandbox is an isolation requirement, not a reason to split the product into many services. The verifier/release identity can be a separate process or CI principal while using the same repository; its gates/credentials must not be editable by the candidate agent.

Minimal new durable records: ChangeRequest, ContextSnapshot, ChangePlan, CandidateBundle, CheckResult, UserReview, ActivationReceipt. Reuse existing artifact references, job records, audit events, authorization, and versioned experience/content objects. A resolved manifest can be stored as an artifact rather than a separate complex database subsystem.

Context retrieval begins with a versioned repository map, relevant source reads, component catalog, and browser observation. A semantic index is optional later; freshness and authorization are required now. One builder and one deterministic verifier are sufficient initially. Do not start with autonomous agents debating designs indefinitely.

## 12. Vertical slice and release gates

Build only after implementation is authorized. Sequence each capability so it can be demonstrated rather than inferred from code review:

| Gate | Deliverable | Required demonstration |
|---|---|---|
| G1 | Feedback capture + exact manifest + component target + durable change record | The report points to the build, UI state, course, and component the learner actually saw |
| G2 | Personal configuration editing, working trial, browser checks, explicit acceptance and undo | Move/collapse a panel, verify reload/keyboard/narrow layout, accept it for user A, show user B unchanged |
| G3 | Source-grounded course expansion through existing authoring boundary | Add one deeper section with useful practice; show sources, preserve old attempts/retrieval, adopt a new route and obtain feedback |
| G4 | Real reusable component change through isolated code adapter and verifier | Add a capability absent from current settings, run the built UI, get user feedback and owner authorization, activate and verify exact artifact |
| G5 | Failure/recovery and cross-boundary adversarial tests | Stale revision, worker crash, rejected preview, failed source, duplicate command, attempted global change, preview leakage, rollback with retained learning |

G2/G3 establish useful collaboration, but a settings-only demo cannot claim full conversational product generation. G4 is required before claiming the product can implement a novel UI feature from feedback. A code agent that only writes files without rendering/testing the result also fails that claim.

Example G2 request: “The progress/XP strip distracts me while answering. Collapse it into the recap and widen the answer area.” Example G3 request: “Expand the reliability section with deeper failure analysis and two meaningful design tasks.” Example G4 request: “Give me a side-by-side trace comparison that I can step through,” when the existing renderer cannot do so.

Metrics for this change loop: explicit acceptance/revision/rejection rates, requests solved without unnecessary clarification, rework after reported success, verification coverage, rollback incidence, cost per accepted change, and cross-user regressions. Track perceived usability and actual task success separately. Do not optimize solely for acceptance rate by flattering the user, weakening assessment, hiding defects, or suppressing negative feedback.

## 13. Additional invariants

C1. No personal change can modify another learner's active experience without separate authorized scope.

C2. Every user review identifies the candidate and observed manifest; substantive edits invalidate its authority for the new candidate.

C3. Required verification results are produced by an authorized runner, tied to exact artifacts and policy, and are not asserted by the builder.

C4. Product/course feedback is never direct mastery evidence, and the editor cannot write grades.

C5. Real preview exposures survive rejection and rollback; synthetic test attempts never become learner evidence.

C6. Published content and frozen assessment context are not mutated by collaboration.

C7. Actual served state, not repository HEAD or an agent narrative, establishes what was activated.

C8. Scope, authority, and tool budgets are enforced outside the model and cannot be widened by source pages or course content.

C9. Replacing the code/model/browser adapter does not erase change history or make courses depend on that provider.

C10. An unsupported interaction can trigger a real capability proposal but cannot smuggle executable code through a content package.

C11. A change remains awaiting feedback when no explicit user decision exists. Continued usage is not acceptance.

C12. The last accepted experience remains available during candidate generation; failures must not strand the learner in an unfinished product.

## 14. Sources and status of evidence

The design choices are proposals, not empirically validated claims that the product will be safe, effective, or enjoyable. External sources below support specific implementation facilities/constraints, not the entire architecture. Consulted 6 September 2026.

[S1] Playwright, Trace viewer: https://playwright.dev/docs/trace-viewer — action snapshots, screenshots, errors, console/network metadata and trace inspection.

[S2] Playwright, Visual comparisons: https://playwright.dev/docs/test-snapshots — screenshot comparisons, baseline review, environment dependence.

[S3] Playwright, Accessibility testing: https://playwright.dev/docs/accessibility-testing — automation and its limits, including manual assessment.

[S4] Git, git-worktree: https://git-scm.com/docs/git-worktree — multiple working trees associated with a repository. The security boundary in this proposal is additional to that functionality.

[S5] OWASP GenAI, Excessive Agency: https://genai.owasp.org/llmrisk/llm062025-excessive-agency/ — constrained functionality/permissions, least privilege, approval for consequential actions.
