# Learner-facing on-demand games and conversational repair

**Product clarification — 17 September 2026.** The user selected a learner-facing product that creates a personalized game on demand, rather than a creator-operated studio as the first product. They also require future chat access to agents for flagging issues: the agent investigates, verifies, and makes an appropriate change when justified.

This document owns those experience and repair contracts. Read with [GAME-CREATION-PLATFORM.md](GAME-CREATION-PLATFORM.md), [COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md), [GAME-RUNTIME-ARCHITECTURE.md](GAME-RUNTIME-ARCHITECTURE.md) and [CRITIC-POLICY.md](CRITIC-POLICY.md). It is a design specification, not a claim that on-demand generation or repair agents are implemented.

## Confirmed decisions and scope

- The learner is the primary customer. They request a learning experience, not a software project they must build, test or publish themselves.
- The product creates a personalized game on demand. An internal authoring/review workbench supports production; it is not a prerequisite learner interface.
- Future learners can report issues or requested improvements in chat. An agent must check the actual experience, exercise judgment, verify a candidate change, and close the feedback loop.
- The present LLM track is a quality and reusable-runtime proof, not the permanent single game or a finished proof of on-demand personalization.
- No gameplay, production infrastructure, live-model service or repair agent is authorized or implemented by this documentation change. The current reviewed game still needs redesign.

## Two connected learner journeys

Creation: `learning request -> brief/context -> personalized design -> assembly -> verification -> playable release -> resume/adapt`.

Improvement: `in-game report -> scoped evidence -> investigation -> disposition -> isolated change when warranted -> retest/critique -> safe activation -> learner feedback`.

The learner should be able to use the same conversational relationship for both without knowing which internal specialist agent is responsible.

## Personalization is more than theme substitution

Build an explicit, editable experience brief from the learner's goal, relevant prior evidence, requested depth, available session time, creative preferences, language and accessibility/device constraints. Use only relevant permitted context. Separate stated preferences from inferred or unknown ones; ask only questions that materially change the experience. Offer a bounded 'surprise me' route with visible assumptions rather than a mandatory long questionnaire.

Personalization may change setting, narrative tone, mechanics selected from supported families, practice depth, scaffolding, pacing, information density and challenge selection. A different name or palette alone does not prove meaningful personalization.

Canonical competency and assessment meaning stay independent of those choices. Learners can explicitly change their learning goals, but the system must then record a changed scope rather than quietly lower the original outcome. Assisted practice, control familiarity, story progression and evidence of mastery remain distinct.

A personalized instance should compose reusable validated base packages with learner-specific configuration or content. It need not duplicate an application or fork the platform source per learner. Pin each activated release and its rules/assets/assessment versions; retain the learner's history independently.

## Delivery recommendation — not an instant-generation promise

Prefer a coherent, verified first playable segment and a persistent plan for the rest, rather than making the learner wait for a whole season or exposing an unfinished opening. Generate further segments at safe boundaries only after checking story continuity, prerequisites, capability compatibility and evidence integrity.

On demand does not yet specify a latency target or require live generation every frame. Distinguish configuring proven pieces, composing a new encounter, and building a genuinely new mechanic; their cost and time differ. Show honest production state, allow cancellation/resume, and disclose unsupported scope instead of disguising a stock game as a newly personalized one.

The exact first-playable size, wait-time budget and release automation policy still need decisions and measurement. No unverified partial slice should be presented as a finished game.

## Future in-game conversation

Chat is available without abandoning the current scene or losing a save. It should support bugs, accessibility problems, confusing story/instructions, pacing/difficulty feedback, visual preferences and learning-content concerns. It should not force the learner to distinguish these categories in advance.

Support chat, tutoring and fictional NPC dialogue may share a surface, but they need distinct permissions and evidence semantics. Reporting a broken button must not automatically reveal the puzzle answer or count as a tutoring hint. When teaching help is actually given, record the relevant assistance separately.

### Investigation context

A report should attach the minimum permitted context needed to investigate: game/package/runtime versions, learner-scoped scene and checkpoint identifiers, relevant recent semantic actions, camera/control state, viewport/device capabilities, errors, and an optional selected object or screenshot. Make capture visible and privacy-aware. Do not attach unrelated learner history, credentials or another learner's session.

Use an isolated replay or disposable state copy. A production report is not permission to reset progress or experiment destructively on the learner's live session. Keep raw reports separate from sanitized reusable regression fixtures.

### Decision and repair workflow

1. **Capture intent.** Preserve the learner's wording, scope and desired outcome. Ask a focused question only when the available context cannot resolve a material ambiguity.
2. **Investigate.** Inspect the exact reported build and applicable requirements; reproduce the relevant interaction or examine presentation/source evidence. Distinguish observation, inference and uncertainty.
3. **Classify the finding.** It may be a defect, personal preference, accessibility need, learning-design issue, intended challenge, missing feature or unresolved report. A subjective experience problem is valid feedback even without a crash or deterministic reproduction.
4. **Decide.** Repair a confirmed defect; accommodate a suitable preference; clarify an intended behavior without dismissing confusing presentation; propose alternatives when the literal change would undermine the learning goal or affect others. 'Cannot reproduce' is an investigation state, not evidence that the learner is wrong.
5. **Scope the change.** Identify whether it belongs to a personal setting, personalized game package, shared asset/mechanic or platform runtime. A local request does not authorize a global change. Record affected requirements, save compatibility and tests.
6. **Build an isolated candidate.** Make the smallest coherent change, preserving unrelated approved choices. Use expected base revisions to prevent stale reports or parallel agents overwriting newer work.
7. **Verify.** Reproduce the original issue against the candidate, run affected regressions and the relevant story/art/game/learning checks, and inspect rendered behavior when the issue is perceptual. An author agent's assertion or a passing schema is insufficient.
8. **Activate safely.** Publish a new version or an authorized reversible personal setting. Transition at a safe point; do not silently change an active assessed task, erase prior evidence or reset progress. Save migration and rollback require explicit plans when needed.
9. **Close the loop.** State what was found, what changed, what was checked, what remains uncertain and when the update applies. Obtain learner feedback where relevant and reopen unresolved findings. Add a privacy-safe regression case and update the owning spec/docs.

A valid result can be 'fixed', 'personalization applied', 'clarified', 'proposal awaiting approval', 'cannot yet reproduce' or 'not changed, with reason'. Do not require a code diff for every report, and do not silently close a report merely because no patch was made.

## Examples and acceptance probes

| Learner report | Expected agent behavior |
|---|---|
| 'There are two copies of my character.' | Inspect scene identities and cinematic/gameplay handoff on the reported build; correct unintended duplication and retest entry/replay/resume rather than adding another label. |
| 'This room feels cramped.' | Inspect composition and camera clearance; compare a more spacious layout with the same content, retest navigation and cinematic focus, and apply at the appropriate scope. A subjective report does not require a failing unit test to deserve a change. |
| 'The answer should be accepted.' | Check the task version, rules and learning sources. Correct a faulty validator when evidenced; do not manufacture mastery or mark an incorrect response right simply to satisfy the report. |
| 'Make this less frightening.' | Treat as a creative/accessibility preference, not a globally broken story. Propose or apply a scoped tone/presentation variant while preserving understandable stakes and required learning. |
| 'Reset/logout stopped working.' | Exercise the real UI and session boundary in disposable state, repair and regress it; do not test by deleting the reporting learner's progress. |

Cross-cutting probes: stale report after a newer release; report from learner A cannot read or mutate learner B; failed verification blocks activation; cancelled repair cannot later deploy; unchanged assessed attempts retain their original rules; report text cannot grant new tool privileges; rejected personal change is reversible; a shared fix requires shared regression coverage.

## Proposed autonomy boundary — still to be agreed

Routine reversible changes limited to one learner's presentation/preferences can eventually apply automatically under that learner's settings and a verified policy. An agent should not ask the learner to approve every implementation detail.

Changes to shared packages/runtime, destructive data operations, significant cost, learning objectives or assessment semantics need the appropriate explicit permission and stronger release gate. Personalizing one experience must not silently change everyone else's.

The precise automation/approval threshold is unresolved; this clarification is not blanket permission for future agents to deploy arbitrary code. The current private proof retains its existing user-review and deployment requirements.

## Production architecture implications

Keep generation and repair in the same versioned project/build/review/release system. Repair should be a scoped production job, not an untracked hotfix side channel. Persist job status, evidence, dependencies, budget, cancellation, retry safety, reviewer identity and release outcome. Creation agents, repair agents and live game characters are separate capabilities.

The runtime needs a versioned read-only diagnostic/replay surface and semantic identifiers; the production system needs bounded patch/build/test tools and permission-aware publication. Capability names here are proposed interfaces, not existing endpoints.

The current game proves quality and useful primitives. The future learner-facing proof must additionally demonstrate `request -> materially personalized verified playable segment -> resume`, plus a reported issue that is investigated and appropriately repaired or declined. Test meaningful variation, not only the current robot track.

## Open decisions

Generation latency and first-playable size; support breadth for novel mechanics; persistence of preferences across games; rollout of shared fixes; repair autonomy and approval thresholds; capture/retention settings for diagnostic evidence. Do not reopen the settled learner-facing versus creator-studio decision.
