# Learning OS — incremental implementation plan 1.6

**11 September 2026 · authoritative active plan**

This file is the current build order. The checksummed `learning-os-design-package-v1.3/` remains immutable historical design. Its detailed phase/security/evidence requirements still apply wherever this 1.6 plan does not supersede them. Read `docs/STATE.md`, `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/COURSE-GENERATION-GAME-SYSTEM.md`, `docs/GAME-UX-SYSTEM.md`, `docs/GAME-UX-REVIEW.md`, and `docs/THREE-STORY-FRAMEWORK.md` with this file.

## 1. Product north star

VibeLearn is **not Relay Rescue and not a single software-reliability course**. It is a general learning system that should be able to take a subject/course, build a source-grounded competency path, generate a compelling story/fantasy/world that fits the subject, realize the learning as an actual game, and preserve defensible learning evidence across story/game revisions.

Relay Rescue is the current authored reference slice used to prove those reusable contracts. Do not let Pip, gears, valleys, retry semantics, one visual style, or Three.js become engine assumptions.

A generated learning experience should be representable through four related but separable packages:

1. **LearningSpec** — canonical competencies, prerequisites, intended outcomes, source/provenance constraints, assessment/evidence rules, transfer/retrieval requirements.
2. **StoryWorldSpec** — premise, characters, world rules, emotional arc, important objects/resources and their functions, stakes, chapter progression, and explicit mappings back to LearningSpec.
3. **GameExperienceSpec** — mechanics, mission graph, HUD/visibility schedule, feedback, failure/recovery, progression, 2D/2.5D/3D realization choice, device/accessibility contract, and story-to-play mapping.
4. **AssessmentEvidenceSpec** — what observable behavior supports which learning claim, assistance/exposure semantics, delayed retrieval/transfer requirements, and what must remain `unknown`.

Story flavor and renderer identity must never become the identity of a competency or learner evidence. Replacing a fantasy/world later must not erase or counterfeit legitimate learning history.

## 2. Story inputs now vs later

**Current rule:** story creation is driven by the **course/topic, intended outcomes, source-grounded causal structure of the concepts, and a broad kid-through-young-adult quality target**. There is no creative learner-preference input in the current implementation. Do not infer or fabricate one.

**Future rule:** add an explicit learner-controlled, versioned `StoryPreferenceProfile` (or equivalent) for genre, fantasy/realism, tone, character style, visual style, humor/darkness, pace, exploration/action balance, narrative density and similar creative choices. It is optional, editable, separate from mastery/evidence, and the generator must still produce a strong experience when it is absent.

A preference may change the world and presentation. It must not silently change required learning outcomes, evidence meaning, source constraints, or mastery.

## 3. Authoring/generation order

For every generated course/chapter, use this order:

`course intent/outcomes -> source grounding -> LearningSpec -> StoryWorldSpec -> story critic -> GameExperienceSpec/realization -> first-touch critic -> whole-chapter game critic -> learning/transfer gate -> user review -> activation`

Do not start with generic lesson text and add a story afterward. Do not build a renderer first and ask the story to justify it later.

### Story gate

Run the story-only critic from `docs/STORY-GENERATION-AND-CRITIC.md` on **one frozen story candidate at a time**. It judges hook, clarity/causality, character attachment, world appeal, storytelling quality, pacing/progression, stakes, payoff/forward pull and cross-age engagement. It ignores renderer sophistication, code quality and curriculum correctness.

Unrounded story score must be **>=9.0/10 with no story blocker** before gameplay realization proceeds.

### Game gates — two scores, never one blended escape hatch

A weak opening must not be averaged into a passing chapter.

**First-touch magic** is a separate mandatory score for the fresh first 60–90 seconds. It evaluates beauty/creative hook, curiosity/wonder, character/world attachment, causal clarity, low initial cognitive load, player-owned pacing/navigation, an obvious first meaningful action and the transition from story into play. It must be **>=9.0/10 with no blocker**.

**Whole-chapter game experience** is a separate mandatory score for the complete chapter. It evaluates story-to-play continuity, progressive cognitive load, meaningful agency, challenge curve, feedback/recovery, payoff, replay/forward pull and commercial-game-level cohesion. It must independently be **>=9.0/10 with no blocker**.

A high chapter score cannot compensate for poor first touch. Visual magic cannot compensate for a weak chapter.

### Learning gate

After both game gates pass, independently evaluate whether the chapter actually teaches the intended outcomes and enables transfer/retrieval claims being made. The applicable learning/transfer score must be **>=9.0/10** before asking the user to accept the experience. A guided success is not proof of durable mastery.

Critics cannot self-certify their own artifacts. Prefer a genuinely separate critic agent/model configuration when the harness provides one. If it does not, record `internal_tool_assisted` and never label it independent or human-tested.

## 4. First chapter / first-touch contract

The first chapter is responsible for building the learner's world model before increasing cognitive load. By its end, the learner should understand:

- who/what matters and what the central character/system needs;
- the important objects/resources/entities and what each one does;
- what happened before the player arrived;
- what changed or failed;
- why the situation matters;
- what success/failure looks like;
- why the player's help is needed;
- the causal relation between the in-world model and the real subject concept.

Prefer dramatized action, environmental storytelling, simple animation, direct manipulation and visible consequences over glossaries or explanatory slides. Introduce formal jargon after the concrete model exists. Difficulty should rise through actual reasoning, transfer, uncertainty, trade-offs and reduced scaffolding—not by adding more text.

First-run story/cinematic progression is user-paced by default. Back/previous, Continue, Skip, Replay and visible progress are required where applicable; Pause/Resume is required when motion runs. Reduced-motion mode must preserve the same causal meaning and navigation.

## 5. Rendering and reusable 3D story framework

For important story/game candidates explicitly consider authored 2D, 2.5D/parallax and interactive Three.js 3D. Choose based on subject, story, attention/immersion value, mechanics, accessibility and device budget.

Three.js is a serious option for capturing attention and making worlds/characters feel present, especially for kids, teens and young adults. It receives no automatic critic points and cannot rescue weak writing or unclear gameplay. Keep pinned/self-hosted assets, same-origin runtime, touch/keyboard operation, reduced motion, usable fallback and realistic mobile performance.

**Phase 1 must establish a small reusable Three.js story-world framework, not merely a reusable renderer constructor.** Future story/fantasy settings should not copy renderer initialization, resize loops, pixel-ratio policy, frame scheduling, pause/reduced-motion handling, context-loss recovery, disposal, generic camera current/target vectors, portrait/landscape shot selection, or camera interpolation. Those concerns belong in story/domain-agnostic infrastructure.

Each generated world supplies a versioned adapter containing the things that are genuinely story-specific: scene/assets, art direction, landscape/portrait camera **compositions**, beat states, interaction anchors, and mapping from authoritative game state to visuals. The shared camera rig turns those compositions into responsive motion. `StoryWorldSpec` remains renderer-agnostic and 2D/2.5D stay first-class alternatives.

The runtime/adapter/package identity must never become competency/evidence identity. “Easy integration” also must not become arbitrary code serving: the current CSP/static allowlist stays strict, and a later generated-package publishing/validation boundary is required before Phase 3 can load arbitrary generated worlds. See `docs/THREE-STORY-FRAMEWORK.md`.

Do **not** implement the arbitrary generated-package loader during current Phase 1 merely to demonstrate generality. Prove the seam first: Echo Forge should consume shared rendering/camera infrastructure while remaining a replaceable adapter. Later Phase 3 can add immutable manifests/assets/package loading behind an explicit validation/security boundary.

## 6. Primary device target during current refinement

Optimize the first-touch and Chapter 1 experience first for the **mainstream modern Android/iPhone portrait range**, not individual phone models. Use a compact representative matrix around roughly 360–430 CSS px wide with common tall-phone aspect ratios, touch input, safe-area insets, text enlargement and reduced motion. Do not create a 320-vs-390 product fork unless evidence exposes an actual breakpoint failure.

Desktop polish follows after the phone experience is strong.

## 7. Current execution phase

Current work remains **private Phase 1 reference refinement**. We are not authorized to jump ahead and build the full Phase 3 generator yet. The job of the current Relay Rescue slice is to establish a reference-quality implementation that the later generator can target.

Current bounded sequence:

1. keep login/account/recovery consistent with the game shell;
2. make the Echo Forge story/world first-touch experience work reliably on mainstream phones while extracting renderer lifecycle **and generic camera orchestration** into the reusable Three.js story runtime/adapter boundary;
3. make Signal 1 continue inside the same world through that same reusable runtime, with one obvious action at a time and progressively increasing cognitive load;
4. preserve previous-chapter review, reset-progress, save/reload, learner isolation and evidence semantics;
5. run exact-build browser verification;
6. inspect exact rendered phone evidence, not just test output;
7. run **first-touch magic critic** and repair until >=9/no blocker;
8. run **whole-chapter game critic** and repair until >=9/no blocker;
9. run the bounded learning/transfer critic;
10. deploy the exact verified candidate to Render;
11. verify the served revision and ask the current user for the decisive review.

Do not mark `ready_for_user_review` before all three critic gates pass on the same verified build. Do not mark `user_accepted` until the user explicitly accepts it.

## 8. Phase map after the reference is accepted

The detailed 1.3 phase requirements remain applicable; this is the current interpretation:

- **Phase 0:** establish actual repo/tool/database/browser capabilities and failure boundaries.
- **Phase 1:** one high-quality persisted learning-game reference slice with honest evidence and real user review; prove the reusable Story3D runtime/adapter seam when 3D is used.
- **Phase 2:** prove course replacement, canonical competency/evidence reuse, learner isolation, export/restore and a second domain/user without binding history to one course/story.
- **Phase 3:** implement the first real source-grounded course generator using the StoryWorld/Game/Learning package pipeline and critic gates above. Current story generation is topic-driven only. When Three.js is chosen, generation emits a versioned world adapter/package against the Phase-1 story-runtime contract rather than generating a fresh renderer/camera lifecycle.
- **Phase 4:** collaborative course/game evolution; later introduce explicit StoryPreferenceProfile and user-controlled creative preferences without contaminating mastery/evidence.
- **Phase 5:** one genuinely new interaction/component through an isolated code-generation/release path.
- **Phase 6:** consenting pilot, reliability/restore hardening, real delayed/transfer observations and ranked product-learning improvements.

Do not widen curriculum or integrations merely to demonstrate breadth before the preceding boundary is proven.

## 9. Engineering/evidence invariants

Protect learner isolation, immutable published content, pinned assessment meaning, provenance, source constraints, explicit assistance, evidence identity, course-independent canonical competencies, restart/reload behavior and the difference between verification, acceptance and activation.

Keep `unknown`, `declared_independent`, current-attempt `assisted` and `previously_exposed` distinct. XP/rewards never establish mastery. Prior exposure is not current help. A critic pass is not user acceptance.

Build one small, working behavior at a time. For each increment: inspect the actual baseline -> define executable acceptance scenarios -> implement the smallest complete path -> run focused tests -> run persistent boundary checks -> exercise the actual interface -> inspect failures -> retain evidence -> update docs/state -> choose the next increment.

Do not weaken tests/rubrics to make a candidate pass. A newly discovered blocker becomes a regression test where practical.

## 10. Feedback changes the plan

When direct user feedback changes product direction, story/game quality bars, generation assumptions, platform priority, critic semantics, framework boundaries, or the meaning of done, update this plan and the affected authoritative docs **before or in the same bounded implementation unit as the code change**.

Historical/checksummed design packages remain immutable. Current docs should describe the product we are actually building, not preserve stale assumptions for neatness.

## 11. Acceptance authority and rollout

The current user is the sole real product reviewer during private refinement. Their explicit verdict overrides every story/game/learning critic, automated score and historical result. Critic >=9 means only that the candidate may proceed to the next gate/user review.

No external users/testers, public rollout, paid infrastructure expansion, untrusted execution or broad Phase 2+ implementation is authorized by this plan alone.

Render serves `deploy/render-supabase`; auto-deploy is disabled. Deploy only the exact verified candidate intended for user review, then verify the served revision.
