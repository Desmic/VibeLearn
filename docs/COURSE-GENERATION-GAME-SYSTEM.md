# VibeLearn course-generation game system

Status: active product/architecture requirement adopted after the 8 September 2026 game-first review.

This document amends the active root `CODEX-IMPLEMENTATION-PLAN.md` and extends `docs/GAME-UX-SYSTEM.md`. The checksummed `learning-os-design-package-v1.3/` bundle remains historical input and is not rewritten in place.

## 1. Core requirement

Course generation is not allowed to mean “generate lessons, questions, and a route, then pour them into a generic website.”

A generated VibeLearn course must be a **playable learning game** whose learning model, campaign progression, mission mechanics, HUD/tool exposure, assessment semantics, feedback, accessibility, provenance, and verification are generated as one coherent package.

The retry campaign is the first reference implementation, not a hard-coded template every subject must visually copy.

The generation system must preserve two separate truths:

- **game progression:** missions, clears, XP, rank, unlocks, campaign path, presentation and cosmetic feedback;
- **learning evidence:** pinned activity meaning, answer, assistance/exposure, criterion result, checkpoints, evidence observations, mastery/review inputs.

Game rewards may motivate. They must never silently establish mastery, strengthen evidence, change assessment truth, or unlock learning content solely because XP was awarded.

## 2. Generation inputs

The generator consumes an explicit `CourseBrief` rather than a hidden giant prompt. At minimum it contains:

- learner goal / target outcome;
- target competencies and assessment frames, or proposals to review;
- intended depth and time horizon;
- learner-declared prior experience and preferences where consented;
- source-selection policy: preferred, required, excluded and only-listed sources;
- permitted modalities and runtime capabilities;
- accessibility / motion preferences when known;
- desired tone/theme constraints;
- current reusable component/game-mechanic catalog;
- versioned learning, assessment, progression and game-UX policies.

Self-reported experience affects starting route/scaffolding, not measured mastery. A generated reusable activity must not embed a learner ID or mutable mastery state.

## 3. Generated course bundle

A course candidate is incomplete unless it produces all of these artifacts together.

### 3.1 Knowledge and learning contract

- competency/frame targets and coverage;
- prerequisite/advisory relationships;
- source claims and provenance;
- assessment blueprint;
- rubric criteria and criterion-to-frame bindings;
- assistance rules and what each tool exposure means;
- review/retrieval targets;
- explicit unsupported or provisional claims.

### 3.2 Campaign / progression graph

Each chapter declares:

- the mechanic/concept being taught;
- ordered mission nodes;
- difficulty band and cognitive-load budget;
- unlock prerequisites;
- optional diagnostic/test-out routes;
- boss/combine mission;
- release/recovery beat before introducing the next major mechanic;
- later recall/side-quest hooks where useful.

The default confidence curve is:

**teach -> easy success -> variation -> combine -> boss -> release -> new mechanic**.

Early missions should normally expose one new rule and one obvious action at a time. Later difficulty should increase through genuine reasoning demand—interacting rules, incomplete information, trade-offs, uncertainty, transfer, reduced scaffolding—not merely longer text or more fields.

A new learner should get an early win. An experienced learner may receive a bounded diagnostic/test-out route so the system does not force trivial repetition; bypass decisions must be explicit and must not fabricate mastery evidence.

### 3.3 Mission contract

Every mission defines:

- player-facing objective and stakes;
- what the player can do immediately;
- core learning mechanic;
- expected interaction type;
- what is visible in the playfield;
- which tools are available now versus introduced later;
- hint/intel/worked-example policy;
- assessment basis;
- success/retry feedback;
- persistence/resume behavior;
- accessibility requirements;
- motion/sound/haptic intent where supported;
- immutable activity/rubric/binding references.

Prefer **direct play** over generic form entry when the competency permits it: choose, arrange, simulate, compare, manipulate, debug, construct, trace, classify, sequence, explore or make a trade-off. Written answers appear when explaining/defending/designing is itself part of the competency, not because textareas are the easiest UI to generate.

## 4. HUD-first presentation contract

Generated courses inherit the principles in `docs/GAME-UX-SYSTEM.md`.

The generator must decide which important state deserves HUD treatment rather than long body text. At minimum the runtime must make the following glanceable when relevant:

- current level / boss / chapter location;
- immediate mission objective;
- campaign progress;
- game progression (XP/rank or the course equivalent);
- persistence/sync state;
- available contextual tools;
- route back to the campaign map.

Secondary content should be one action away in contextual drawers/overlays rather than permanent website rails. The central area is the playfield.

The exact HUD vocabulary can vary by course/theme. A biology course, interview-prep course and distributed-systems course do not need identical skins. They do need one coherent interaction language and clear hierarchy.

## 5. Progressive disclosure of interface mechanics

The course generator teaches the interface as it teaches the subject.

Do not expose every mode, source, hint type, evidence inspector and advanced control in Level 1. Generated progression should schedule UI/tool introduction deliberately, for example:

- tutorial: core action + save + minimal hint;
- early variation: same interface, different concept;
- intermediate: introduce one new assistance/tool affordance;
- advanced: combine earlier controls;
- boss: full relevant toolset, but no new unexplained core mechanic.

If a control is hidden or locked, the campaign/mission spec must state when and why it appears.

## 6. Feedback and game feel

Every meaningful player input receives perceptible feedback.

The generator should include a feedback plan for:

1. input acknowledgement;
2. choice/action selected;
3. save/sync completed or failed;
4. hint/intel/tool reveal;
5. answer/action lock-in;
6. clear/retry result;
7. reward / next-node unlock;
8. later recall quest.

Motion communicates causality and state change. It should be used for mission launch, staged causal reveals, selection confirmation, progress changes, unlocks, clear/retry, rewards and boss reveals when useful.

Do not move precise click targets while the player is selecting them. Respect `prefers-reduced-motion`; if animation density becomes substantial, add an explicit motion setting. Sound/haptics may be added when the platform supports them, but they must complement rather than replace visible/accessible feedback.

## 7. Learning integrity rules

Generated game systems must obey these invariants:

- XP/reward never changes mastery or evidence strength.
- Mission unlocks that represent learning progression depend on an explicit valid success condition, not mere participation XP.
- Asking for help is not failure; assistance is recorded and changes independence claims honestly.
- A wrong answer can still receive practice recognition without unlocking the next competency gate.
- Source exposure, worked examples and mode changes remain attached to the evidence history.
- Unknown is not beginner and missing evidence is not failure.
- Generated novelty/transfer claims remain provisional until validated.
- A boss mission cannot demand mechanics the campaign has not taught or intentionally diagnosed.

## 8. Source-grounded generation

Source selection follows `SOURCE-STEERING.md` and the active implementation plan.

The authoring pipeline is:

**brief -> research/source inspection -> competency/frame proposal -> campaign design -> mission/task/rubric design -> source/claim mapping -> validation -> critic passes -> preview -> human feedback -> immutable release**.

Inaccessible or link-only sources are recorded honestly. A snippet is not represented as a fully read source. Prompt injection, private URLs, redirect handling, source rights and provenance remain hard validation concerns.

Generation alone must not modify learner goals, evidence or mastery.

## 9. Independent critic/revision loop

The generator cannot approve its own course merely because it produced valid JSON.

Use logically separate review roles/passes. When the execution harness supports separate agents/models, prefer a distinct critic agent/configuration. When it does not, run a separately prompted critic pass with a frozen rubric and independently recorded result. Do not weaken criteria to rescue a candidate.

Required review layers:

### 9.1 Structural / learning validator — pass/fail

Checks identifiers, immutable refs, source constraints, assessment bindings, unlock graph, persistence semantics and game/evidence separation. Any critical integrity failure blocks release regardless of UX score.

### 9.2 Grounding / content critic — pass/fail plus findings

Checks factual/source support, depth/coverage, misleading simplification, rubric validity, plausible alternate answers and whether the task actually measures the claimed frame. Unsupported factual or assessment-critical claims block validated release.

### 9.3 Game UX critic — numeric gate

Use `docs/GAME-UX-REVIEW.md` or a versioned successor. The candidate must score **>= 8.0 / 10** and have no critical blocker.

The rubric covers at least:

- game identity versus website residue;
- HUD / information at a glance;
- core loop clarity;
- progression and difficulty curve;
- feedback / game feel / juice;
- theme / visual cohesion;
- learning integrity;
- accessibility / responsiveness.

### 9.4 Accessibility / interaction validator — pass/fail

Checks keyboard/touch reachability, narrow layouts, text enlargement, contrast/non-colour cues, reduced motion and required semantic labels.

### 9.5 Revision policy

A failing candidate returns structured findings to the authoring/generation step and produces a new immutable candidate revision.

Do not loop forever. After a bounded number of automatic repair cycles (initial target: 3), leave the course as `draft_needs_review` with the critic reports attached. Human review can choose to revise, narrow scope or reject it. It cannot silently relabel a failing automated gate as passed.

## 10. Generated verification contract

Course generation should emit testable invariants with the course manifest. The runtime owns reusable test harnesses; the generator supplies course-specific fixtures/expectations.

At minimum verify where applicable:

- fresh player sees only intended starting missions;
- locked missions reject forged server requests;
- wrong-answer participation XP does not unlock the next mission;
- correct success unlocks only intended nodes;
- save -> reload -> resume restores exact active progress;
- process restart preserves progress;
- hint/source/mode exposure follows the generated schedule;
- assistance semantics survive mode changes;
- submission/evidence/review/reward are idempotent;
- lost acknowledgement retry does not duplicate evidence or XP;
- second learner cannot read/write the first learner's progression;
- narrow viewport and text enlargement remain usable;
- reduced motion disables nonessential transitions;
- boss prerequisites are taught/diagnosed before the boss starts;
- the course's generated source and assessment references remain pinned.

A generated test cannot simply assert the generator's own output is correct. Critical behavior must execute through the real application/storage/browser boundary when that phase supports it.

## 11. Course evolution and learner feedback

Generated courses are versioned experiences, not mutable blobs.

Learner feedback may request changes to:

- challenge/difficulty pacing;
- clarity;
- game feel/animation;
- HUD hierarchy;
- hints/intel;
- source mix;
- depth/coverage;
- mission mechanics;
- workload;
- theme/presentation.

The evolution agent/workflow must inspect the current course revision, current UI/component manifest, rendered behavior, source constraints and relevant learner feedback before proposing a change. It creates a candidate revision, runs the same validation/critic gates, previews it, receives actual feedback, and only then activates it.

Historical attempts/evidence keep the exact old activity/rubric/frame meaning. Course revision or deletion cannot rewrite what prior evidence meant.

## 12. Reference implementation: Reliable Agents — Retry Control

The September 2026 retry campaign demonstrates the first concrete pattern:

- Level 1 Tutorial: one retained-key decision;
- Level 2 Easy: changed-key contrast;
- Level 3 Medium: retention boundary + first short explanation + PAIR/Intel introduction;
- Level 4 Boss: three interacting traces + full contract diagnosis;
- persistent top HUD;
- contextual bottom tool dock;
- direct outcome controls instead of comma-separated form input;
- server-enforced sequential unlocks;
- XP separated from success/evidence;
- causal selection/save/unlock/result feedback;
- critic score gate >= 8.

Future generated courses should reuse the principles and contracts, not mechanically clone the retry theme, four-node count, exact colors or exact interaction components.

## 13. Phase-3 generation exit condition

Phase 3 is not complete merely when a model can emit lesson text.

The first generated module must demonstrate, in a real browser:

- source-grounded content and visible provenance;
- a coherent campaign/difficulty curve;
- at least one genuinely playable learning interaction;
- generated HUD/tool exposure appropriate to the course;
- persistence and evidence semantics inherited from the learning core;
- generated verification fixtures executed by the real harness;
- grounding/assessment validators passing;
- game-UX critic score >= 8.0 with no critical blockers;
- learner inspection and actual feedback before calling the experience accepted.

This is the minimum claim for **course generation** in VibeLearn.