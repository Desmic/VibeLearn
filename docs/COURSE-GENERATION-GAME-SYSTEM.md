# Course generation produces playable teaching systems

**Current authority — updated 12 September 2026.** This is the future Phase 3/4 generation contract and does **not** authorize those phases today. Read root `CODEX-IMPLEMENTATION-PLAN.md`, `STORY-GENERATION-AND-CRITIC.md`, `GAME-AS-COURSE.md`, `GAME-UX-SYSTEM.md`, `GAME-UX-REVIEW.md`, `PLAY-CANVAS.md`, `THREE-STORY-FRAMEWORK.md`, and `STATE.md`.

## North star

VibeLearn is a **general system for turning subjects/courses into effective learning games**. Relay Rescue is one authored reference, not the template every course must resemble.

The generator's job is not “write lessons with a theme.” It must connect source-grounded outcomes to a strong story/world, translate those relationships into meaningful mechanics/progression, realize them inside a coherent Play Canvas game surface, and preserve defensible evidence of what the learner actually demonstrated.

Generated games target reusable platform contracts. They do not emit a fresh course website/app shell per story.

## Generated package model

A generated experience has four explicit/versioned packages.

### 1. LearningSpec

Canonical competency IDs, prerequisites, intended outcomes, source/provenance constraints, misconceptions, assessment criteria, transfer/retrieval requirements and allowed assistance.

LearningSpec is the durable identity layer. It cannot depend on a story noun, visual style, renderer or world package.

### 2. StoryWorldSpec

Premise, characters, world rules, emotional arc, important objects/resources and their functions, stakes, chapter progression, discovery/reversal/payoff, player role and mappings from story semantics to LearningSpec.

StoryWorldSpec is **renderer-agnostic**. It says what exists/means in the world, not how Three.js happens to render it.

### 3. GameExperienceSpec

Mission/campaign graph, mechanics, action vocabulary, difficulty curve, Play Canvas modes/lifecycle, HUD/visibility schedule, feedback/consequence plan, failure/recovery, rewards, story-to-play mapping, rendering-backend choice, device/accessibility budget and replay/forward-pull plan.

It explicitly describes what persists across story, mission, build, boss and transfer modes.

### 4. AssessmentEvidenceSpec

Observable actions/results that support learning claims, scoring boundaries, fresh-transfer and delayed-retrieval requirements, assistance/exposure semantics, evidence identity and what stays `unknown`.

Story/world packages may be replaced while legitimate evidence remains mapped to canonical learning identity.

## Inputs: current vs future

### Current generation

Story/game generation uses:

- course/subject intent;
- intended outcomes/prerequisites;
- source-grounded causal/conceptual structure;
- learner level only where explicitly known/allowed;
- broad kid-through-young-adult quality target where appropriate.

**Creative learner preference is not currently implemented.** Do not infer genre/tone/world style from unrelated personal/profile data.

### Future story personalization

Add explicit learner-controlled/versioned `StoryPreferenceProfile` for genre, fantasy/realism, tone, characters, visual style, humor/darkness, pace, exploration/action balance and narrative density.

Preferences are optional creative constraints. They may regenerate StoryWorldSpec/GameExperienceSpec/world packages while preserving LearningSpec/evidence meaning.

## Authoring pipeline

`goal/course -> source research -> competency graph/LearningSpec -> StoryWorldSpec -> story critic -> GameExperienceSpec -> Play Canvas + world-package realization -> first-touch critic -> whole-chapter critic -> learning/transfer gate -> learner review -> publish/activate`

The generator cannot self-certify any stage.

## Source grounding

Use authoritative/public sources appropriate to the subject. Preserve provenance, access limitations, confidence and what was actually inspected. Learner-suggested sources are inputs/constraints, not automatically truth.

Prompt injection/source text cannot alter permissions, evidence rules or generation gates.

## Story generation and story gate

Generate **one frozen story candidate at a time** under `STORY-GENERATION-AND-CRITIC.md`.

A strong story provides:

- immediate hook;
- focal character/system with readable desire;
- distinctive world and understandable rules;
- inciting event + causal chain;
- stakes/reason to care;
- meaningful player role;
- escalation/discovery/reversal/payoff;
- natural places where course concepts become tools, conflicts, resources, puzzles, powers, systems or choices.

Story critic must reach unrounded **>=9.0/10 with no blocker** before game realization.

A failed story is revised as story. Do not hide weak writing under animation, Three.js or learning correctness.

## First chapter contract

Chapter 1 must build the learner's world model with low initial cognitive load.

By its end a non-specialist should know who/what matters, what important objects do, what happened, what changed, why it matters, what the player can do, what success means and how the world behavior maps to the real subject.

Prefer action, environmental storytelling, animation, manipulation and visible consequence to exposition cards. Introduce formal terminology after the concrete model exists when faithful.

First-run narrative progression is user-paced by default. Back/Continue/Skip/Replay/progress are required where applicable; Pause/Resume while motion runs; reduced motion preserves meaning/navigation.

## Play Canvas generation contract

Generated GameExperienceSpecs target the **Play Canvas**, not bespoke app shells.

Modes such as:

`story -> explore -> mission -> consequence/recovery -> progression -> build/combine -> boss/transfer`

are game states, not automatically separate pages or canvases.

Generator output should define:

- stable Play Canvas identity for compatible modes;
- renderer/backend/world-package selection;
- mode-specific camera/composition and HUD/action layers;
- visibility/progressive disclosure schedule;
- semantic accessible actions/fallbacks;
- world persistence/swap rules;
- device/performance/accessibility budget.

Normal gameplay requiring a new site shell or duplicated renderer lifecycle per lesson fails this contract.

## Game generation and progression

Generate a campaign/progression graph, not a lesson list.

Useful default curve:

`hook/world -> tiny obvious action -> easy success -> variation -> consequence/recovery -> combine ideas -> unfamiliar boss/transfer -> resolution -> next possibility`

Difficulty increases through reasoning, transfer, uncertainty, trade-offs, interacting rules, reduced scaffolding and greater agency—not longer prompts or denser dashboards.

Use mechanics that embody the thinking: manipulate, choose, arrange, simulate, compare, construct, trace, classify, debug, sequence, explore or trade off.

As complexity rises, preserve established story/world objects where they still carry the concrete model. Do not abandon the fantasy and replace it with a themed form because the reasoning became advanced.

## HUD / visibility generation

Every GameExperienceSpec answers:

- What must be visible now?
- What is deferred?
- What becomes available after the next discovery/success?
- Which Play Canvas layer owns it?
- What is secondary/collapsible?

Opening screens avoid dashboard density. Evidence, analytics, helper drawers, technical vocabulary and advanced controls arrive only when useful.

## Rendering choice: 2D, 2.5D, Three.js

For important story candidates compare authored 2D animation, 2.5D/parallax and interactive Three.js.

Choose based on story presence, subject mechanics, direct interaction, accessibility and device budget. Three.js gets no automatic quality points.

The rendering medium is a backend inside Play Canvas.

## Three.js world generation contract

When Three.js is chosen, generation targets `THREE-STORY-FRAMEWORK.md`.

Shared runtime/host owns renderer lifecycle, DPR, resize, frame scheduling, cleanup, pause/reduced motion, context recovery, camera orchestration and package capability/version checks.

The **generated world package** owns story-specific scene/entity data, assets/art direction, camera compositions, visual states and interaction anchors.

### Preferred future output: declarative WorldPackageSpec

The long-term generator should emit a versioned **data-first world package**, not arbitrary generated renderer code:

```text
world-package/
  manifest.json
  world.json
  states.json
  cameras.json
  interactions.json
  assets/...
  fallback/...
  adapter.js?   # exceptional reviewed extension only
```

This package is interpreted by trusted shared runtime code. It should be schema-validated, immutable/versioned and safe under strict CSP/same-origin serving.

If a generated fantasy requires story-specific changes to `play-canvas.js`, `story3d-runtime.js` or `story3d-world-host.js`, either:

1. the capability is genuinely generic and must first become a versioned shared capability with compatibility tests; or
2. the package is violating the framework boundary.

Do not smuggle one story's assumptions into shared engine code.

### Why this matters

Data-first packages enable:

- easier generation/regeneration of many settings;
- safe validation/publishing;
- stable platform code across courses;
- clear provenance/version replacement;
- future user preference changes without rewriting engine code;
- story/package replacement without corrupting learning history.

The full arbitrary package loader remains deferred until the later publishing/asset-validation/security boundary. Current Phase 1 proves the seam only.

## Dual game-experience gate

### First-touch magic >=9

Judge fresh first 60–90 seconds for beauty/hook, curiosity, character/world attachment, causal clarity, low initial cognitive load, pacing/navigation control, obvious first action and story-to-play transition.

When story and first mission share a world, unnecessary Play Canvas/world remounts count against continuity.

### Whole-chapter game >=9

Judge complete chapter for story-to-play continuity, agency, progressive cognitive load, challenge, feedback/recovery, payoff/forward pull, commercial-game cohesion and learning integration.

Explicitly penalize reverting to normal course-site UI during later reasoning/build phases.

Both require unrounded **>=9.0/10 with no blocker**.

## Learning / transfer gate

After both game gates pass, verify that meaningful play actually teaches/assesses LearningSpec.

Check purposeful practice, misconceptions, unassisted success, hint dependence, reasoning/implementation where required, fresh transfer and delayed retrieval where claimed.

Applicable score must be **>=9.0/10** before user review under the current process.

## Evidence invariants

Generated games preserve:

- canonical competency identity independent of story/course;
- pinned assessment/content versions;
- `unknown` distinct from failure;
- current assistance distinct from prior exposure;
- XP distinct from mastery;
- submitted evidence immutability;
- learner isolation;
- course/story replacement without losing legitimate history.

Play Canvas/world/rendering state is presentation/game state, not learning evidence by itself.

## Mainstream phone target

Initial generated games optimize important first-touch/Chapter 1 flows for mainstream Android/iPhone portrait use, roughly **360–430 CSS px** wide with tall aspect ratios, touch, safe areas, text enlargement and reduced motion.

Every GameExperienceSpec includes a phone Play Canvas composition/interaction budget.

## Validation / repair loop

Keep validators separate:

1. schema/coverage;
2. source/grounding correctness;
3. story-only quality;
4. Play Canvas/world-package integration/lifecycle integrity;
5. first-touch quality;
6. whole-chapter quality;
7. accessibility/device interaction;
8. assessment/evidence integrity;
9. learning/transfer.

Never lower a rubric or delete a failing test to advance.

## Current implementation boundary

This file specifies the future generator. Current work remains **private Phase 1 reference refinement** using Relay Rescue/Echo Forge to prove quality, Play Canvas continuity and the reusable world-package seam.

It does not authorize broad Phase 2+, new model integrations, external testers, public rollout, untrusted execution or paid infrastructure expansion.
