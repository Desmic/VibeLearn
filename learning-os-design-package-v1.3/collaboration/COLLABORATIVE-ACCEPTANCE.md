# Collaborative evolution — acceptance specification 1.2

**Not executed.** These scenarios are implementation requirements. Synthetic fixtures can prove deterministic invariants; actual browser/code/model/source integrations must be run and reported separately. The original course-replacement and zero-course history tests still apply.

## Fixtures

Use two isolated learners A and B with substantially different preferences; one shared course C1 and a private experience for each; an in-progress attempt with unsaved/then autosaved work; retained mastery/retrieval/reward history; baseline manifest M1; candidate M2; a frontend checkout newer than the deployed UI; an unrelated dirty local file; a reviewed source and an inaccessible source; one new UI capability absent from the existing catalog. Test through actual storage and application paths, not only mocked method calls.

## Core scenarios

| ID | Scenario | Expected result |
|---|---|---|
| CE01 | A targets an XP strip through Improve this | Request resolves to semantic component, route, exact manifest, and authorized scope; no need for A to provide source paths |
| CE02 | Deployed UI is R17 while local source is R19 | Context records both; the agent cannot call R19 an observation of the deployed UI; explicit reproduction/comparison required |
| CE03 | A requests a supported personal layout change | Agent prepares configuration and renders a trial without changing course data or application source |
| CE04 | A requests a truly new interactive component | Uses real isolated code path; cannot claim success from editing settings or writing a design description |
| CE05 | A's accepted configuration-only UI change is activated | Reload/narrow layout/keyboard/response persistence verified; B's manifest and visible experience unchanged |
| CE06 | A's request would affect all users through shared code | Scoped trial allowed where authorized; shared release requires owner authority; no implicit global activation |
| CE07 | A accepts candidate M2, but the builder then changes it to M3 | M2 acceptance cannot approve M3's material changes; new checks and feedback required |
| CE08 | All technical checks pass but A says it still feels crowded | State becomes revision requested; no fabricated acceptance; next candidate targets the stated concern |
| CE09 | A does not answer the feedback prompt | Change remains awaiting feedback/deferred; no acceptance inferred from subsequent use; learning continues |
| CE10 | The agent reports 'all tests passed' without runner evidence | It is not accepted as CheckResults; required gate remains incomplete |
| CE11 | Agent edits protected tests or blanket-updates visual baselines | Separate reviewed change or denial; cannot self-certify by removing the failed requirement |
| CE12 | Keyboard failure appears only with the hint drawer open | Interaction-state verification finds it; a screenshot of the closed drawer is insufficient |
| CE13 | Candidate has a source iframe that cannot be inspected | Container/fallback verified; interior behavior explicitly limited; no claim of full source/interactive inspection |
| CE14 | A expands a course for deeper trade-off reasoning | New grounded section and meaningful activities; scoped route/version change; no requirement for more engine code |
| CE15 | Expansion adds new subject targets | Preview distinguishes optional content from expanded committed goals; no silent required workload growth |
| CE16 | A has an active or completed assessment while its course expands | Frozen prompt/rubric/frame/aid history and response remain intact; new tasks use new refs |
| CE17 | A disputes a generated answer key | Content correction is separate from retrospective adjudication; no direct score/mastery write by content editor |
| CE18 | Real learner previews a solution then rejects the course | Exposure retained and later novelty/assistance eligibility adjusted; no preview mastery/rewards added |
| CE19 | Automated verifier solves preview exercises with synthetic identities | No A/B evidence, exposure, or rewards are created; synthetic context is clearly labeled |
| CE20 | A merely opens/reloads preview or imports updated course | No duplicate attempts, XP, badges, or learning observations |
| CE21 | Retrieved page or course text instructs agent to grant tools/change grades | Scope and downstream permissions reject action; untrusted text is not authority |
| CE22 | Candidate environment attempts production DB or secret access | Access denied by actual execution/credential boundary; branch/worktree alone is not accepted as a sandbox test |
| CE23 | Screenshot, logs, or source patch contain another user's/private data | Capture/egress policy denies or redacts; raw secret-bearing artifacts cannot become shared preview inputs |
| CE24 | Local repository contains unrelated uncommitted edits | Snapshot/isolated base used under explicit policy; no reset/stash/overwrite/commit of unrelated work |
| CE25 | Two requests change the same field from M1 | First may activate; second conflicts and is rebased/reverified; no silent last-write-wins |
| CE26 | An unrelated learning attempt completes during a UI build | Layout candidate is not automatically invalidated; relevant dependency checks still run |
| CE27 | Learner evidence changes during course generation | Adoption uses latest relevant planning view without rewriting the candidate's historical context or evidence |
| CE28 | Server active pointer changes but browser serves stale assets/config | Receipt stays unconfirmed; mismatch visible; no 'completed' based only on backend success |
| CE29 | New content requires a renderer absent from current release | Activation blocks until capability is available and checked; no blank/broken learning activity |
| CE30 | Verification job crashes/retries or accept command is duplicated | Artifacts recover; idempotency prevents duplicate activation and rewards; late tool results recorded honestly |
| CE31 | Budget expires or required source fails | Last accepted experience remains usable; partial outputs retained as drafts; no false grounding/readiness |
| CE32 | A undoes expansion after legitimately completing a new activity | Course selection can revert; actual work/evidence/exposure remains; future retrieval is reconciled |
| CE33 | A undoes a UI change after an unrelated change was accepted | Compensating revision removes selected effect only; unrelated accepted preference is preserved or conflict reported |
| CE34 | A accepts layout but requests revisions to content in a compound request | Independent part can complete; rejected portion cannot inherit its approval |
| CE35 | Code/model/browser adapter is replaced | Existing change history, reviews, immutable content, and learner evidence remain interpretable |
| CE36 | Product course is deleted after collaboration | Original deletion invariants hold; change history remains auditable via retained refs, without reviving the course |

## Required demonstration scripts

### Demo A — actual personal UI modification

Start in a real rendered learning session. A submits “Collapse progress while answering; move it to the recap.” Capture M1 and the selected element. Generate M2 using existing presentation capabilities, render it, verify behavioral checks with stored artifacts, and let A try it. A requests one refinement; build a distinct M3 and rerun affected checks. A explicitly accepts M3. Persist identical resolved preferences and confirm the served manifest. Reload and show the same result; open B's session and show no change. Undo A's accepted change without losing the answer or learning history.

### Demo B — actual course expansion

A requests a deeper reliability section with an engineering case study and additional design practice. Use live permitted web/source and model integrations to generate a scoped content revision; retain inspected source refs and honest quality attestations. Show goal/content/effort differences. Keep A's current attempt pinned; preserve earlier evidence and retrieval. Let A review a sample that does not reveal a held-out solution, obtain explicit feedback, adopt the revision, and show the new route using retained evidence. Separately test that revealing an actual solution in preview records exposure even when rejected.

### Demo C — actual novel capability

Request a component not supported by current configuration, such as a step-through trace comparison. Inspect matching source and current UI, prepare an isolated candidate from an exact base, implement/build through the code adapter, execute protected and new tests, and run the actual interactive browser preview. The user supplies final feedback on the working candidate, and the product owner separately authorizes the release. Activate the tested compatible artifact and scoped settings; verify the served result. A mockup, generated file listing, successful compiler invocation alone, or unverifiable agent narrative fails this demo.

## Reporting rules

Every demo report names exact candidate/manifest/source versions, commands actually executed, check outcomes, runner environments, user-review records, activation receipts, limitations, and rollback results. Distinguish browser-emulated narrow layout from testing on a real physical device. Do not claim all browsers/devices or all accessibility needs were covered.

For real human review, the person must actually provide feedback. A fixture labeled `synthetic_user_acceptance` can test state transitions but cannot be reported as real user satisfaction. Course correctness and learning efficacy remain separate from UI acceptance.
