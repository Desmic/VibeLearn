# Course generation produces playable teaching systems

Current authority — updated 12 September 2026. This is the future Phase 3/4 generation contract and does **not** authorize those phases today. Read the root `CODEX-IMPLEMENTATION-PLAN.md`, [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md), [GAME-AS-COURSE.md](GAME-AS-COURSE.md), [GAME-UX-SYSTEM.md](GAME-UX-SYSTEM.md), [GAME-UX-REVIEW.md](GAME-UX-REVIEW.md), [PLAY-CANVAS.md](PLAY-CANVAS.md), [THREE-STORY-FRAMEWORK.md](THREE-STORY-FRAMEWORK.md), and [STATE.md](STATE.md).

## North star

VibeLearn is a **general system for turning subjects/courses into effective learning games**. Relay Rescue is one authored reference, not a template every course must resemble.

The generator's job is not “write lessons with a theme.” It must connect source-grounded learning outcomes to a story/world, translate those relationships into meaningful game mechanics and progression, realize them inside a coherent game surface, and preserve defensible evidence of what the learner actually demonstrated.

Generated games target the reusable **Play Canvas** game-surface contract. The generator should not emit a fresh course website/app shell for every story.

## Generated package model

A generated experience should have four explicit, versioned packages.

### 1. LearningSpec

Contains canonical competency IDs, prerequisites, intended outcomes, source/provenance constraints, misconceptions, assessment criteria, transfer/retrieval requirements and allowed assistance.

LearningSpec is the durable identity layer. It cannot depend on Pip, a fantasy name, a particular renderer, Play Canvas implementation detail, or an exercise URL.

### 2. StoryWorldSpec

Contains premise, characters, world rules, emotional arc, important objects/resources and their functions, stakes, chapter progression, discoveries/reversals/payoffs, player role and explicit mappings from story elements to LearningSpec concepts/relationships.

A story object must have an understandable in-world function before it becomes a metaphor for a subject concept. Metaphor never replaces the real definition.

### 3. GameExperienceSpec

Contains mission/campaign graph, mechanics, action vocabulary, difficulty/progression curve, **Play Canvas mode/surface lifecycle**, HUD and visibility schedule, feedback/consequence plan, failure/recovery, rewards, story-to-play mapping, 2D/2.5D/3D realization choice, phone/accessibility contract and replay/forward-pull plan.

The GameExperienceSpec should say what remains persistent as the player moves between story, exploration, mission, build, boss and transfer modes. It should not assume those modes need separate pages or separate renderer instances.

### 4. AssessmentEvidenceSpec

Contains what observable actions/results justify which learning claim, scoring/evaluation boundaries, fresh-transfer and delayed-retrieval requirements, assistance/exposure semantics, evidence identity and what stays `unknown`.

Story/game packages may be replaced while legitimate evidence remains attached to canonical learning identity. Story changes must never fabricate learning progress.

## Inputs: current vs future

### Current generation

Story and game generation currently use:

- course/subject intent;
- intended learning outcomes and prerequisites;
- source-grounded causal/conceptual structure;
- learner level only where explicitly known and allowed;
- a broad quality target that should remain understandable/appealing from bright children through teens/young adults when the subject permits it.

**Creative learner preference is not currently implemented.** Do not infer genre, tone, fantasy type, visual style or narrative preference from unrelated personal/profile data.

### Future story personalization

Add an explicit, learner-controlled, versioned `StoryPreferenceProfile` (or equivalent) that may include genre, fantasy/realism, tone, character style, visual style, humor/darkness, pace, exploration/action balance and narrative density.

Preferences are optional creative constraints. They are editable, separate from mastery/evidence, and the generator must still work well with no preference profile. Preference changes may regenerate/re-skin StoryWorldSpec/GameExperienceSpec while preserving learning requirements and legitimate learner history.

Preferences may also influence whether a story is best realized in 2D, 2.5D or 3D, but they do not override accessibility/device budgets or the requirement that the chosen medium genuinely improves the game.

## Authoring pipeline

Use this order:

`goal/course -> source research -> competency graph/LearningSpec -> StoryWorldSpec -> story critic -> GameExperienceSpec -> Play Canvas realization -> first-touch critic -> whole-chapter game critic -> learning/transfer gate -> learner preview/review -> publish/activate`

The generator cannot self-certify any stage.

### Source grounding

Use authoritative/public sources appropriate to the subject. Preserve URLs/provenance, access limitations, confidence and what was actually inspected. Learner-suggested sources are constraints/input, not automatically truth. Required/excluded/only-listed boundaries must be explicit.

Do not expose private learner profile data in public research queries unless necessary and authorized. Prompt injection/source text cannot change system permissions, evidence rules or generation gates.

### Competency graph before fantasy

Define what the learner should be able to understand/do before inventing story details. Story can creatively embody the relationships but cannot silently change them.

Map prerequisites and decide where transfer, retrieval, diagnosis, construction, prediction, comparison, debugging or explanation are required.

## Story generation and story gate

Generate **one frozen story candidate at a time** following [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md).

A story should provide:

- an immediate hook;
- a focal character/system with a readable desire/need;
- a distinctive world and understandable rules;
- an inciting event and causal chain;
- stakes/reason to care;
- a meaningful player role;
- chapter escalation/discovery/reversal/payoff;
- natural places where course concepts become tools, conflicts, resources, puzzles, powers, systems or choices.

Story-only critic score must be unrounded **>=9.0/10 with no story blocker** before gameplay realization.

A failed story is revised as story. Do not hide weak writing under animation, Three.js, XP or lesson correctness.

## First chapter contract

The first chapter must build the learner's world model while keeping cognitive load low.

By its end, a non-specialist should know:

- who/what matters and who needs help;
- what the important objects/resources/entities are;
- what each one does;
- what happened before the player arrived;
- what changed/went wrong;
- why it matters;
- what the player can do about it;
- what success looks like;
- how the in-world behavior maps to the real subject concept.

Prefer action, simple animation, environmental storytelling, direct manipulation and visible consequence to glossaries/exposition cards. Introduce formal terminology only after the concrete model exists.

First-run story progression is user-paced by default. Back/previous, Continue, Skip, Replay and visible progress are required where applicable; Pause/Resume is required while motion runs. Reduced-motion mode preserves meaning and navigation.

## Play Canvas generation contract

Generated GameExperienceSpecs target the **Play Canvas** from [PLAY-CANVAS.md](PLAY-CANVAS.md), not bespoke application shells.

The generator should describe a coherent game-surface lifecycle such as:

`story -> exploration -> mission -> consequence/recovery -> progression -> build/combine -> boss/transfer`

Those are **modes/states of play**, not automatically separate pages or separate canvases.

A generated game should normally provide:

- a stable Play Canvas world/stage identity for compatible modes;
- world-package/backend selection;
- mode-specific camera/composition and HUD/action layers;
- progressive visibility rules;
- semantic accessible actions/fallbacks;
- transition rules for when the current world persists, changes location, swaps renderer/backend, or deliberately exits to a new transfer context;
- device/performance/accessibility budgets.

A generator output fails this contract if normal gameplay requires creating a new site shell or duplicating renderer lifecycle per lesson/chapter.

The Play Canvas itself remains generic. It must not know topic-specific correctness, mastery, evidence, Pip, gears or any generated story noun.

## Game generation and progression

Generate a **campaign/progression graph**, not just a lesson order.

A useful default curve is:

`hook/world -> tiny obvious action -> easy success -> one variation -> meaningful consequence/recovery -> combine ideas -> harder transfer/boss -> resolution -> next possibility`

Difficulty increases through reasoning complexity, transfer, uncertainty, trade-offs, interacting rules, reduced scaffolding and greater agency—not longer prompts or denser dashboards.

Early missions should normally teach one new rule/action at a time. Later missions recombine them. Experienced learners may earn bounded diagnostics/test-out routes, but self-report cannot create mastery.

When possible generate mechanics that embody the thinking: manipulate, choose, arrange, simulate, compare, construct, trace, classify, debug, sequence or trade off. Written answers are appropriate when explanation/design itself is the capability, not as the universal mechanic.

As complexity rises, preserve the world/objects that carry the learner's concrete model where they are still semantically useful. Do not discard the fantasy/game surface and replace it with a themed form merely because the task becomes compositional.

## HUD / visibility generation

Every GameExperienceSpec needs a visibility schedule answering:

- What must the learner see now?
- What is intentionally hidden/deferred?
- What becomes available after the next success/discovery?
- Which Play Canvas overlay/layer owns it?
- When is a detail secondary/collapsible rather than always visible?

The opening should avoid course-site/dashboard density. Show the immediate objective and relevant action first. Introduce hints, Intel, formal vocabulary, evidence details and advanced controls progressively.

HUD/actions should visually belong to the world/game mode. The generator should not default to generic cards/forms simply because the underlying action is structured data.

## Rendering choice: 2D, 2.5D, Three.js

For important story candidates compare authored 2D animation, 2.5D/parallax and interactive Three.js 3D.

Choose the medium based on story/world presence, attention, subject mechanics, direct interaction, accessibility and device budget. Three.js is a serious option for the kid/teen/young-adult audience, but gets no automatic quality points.

**The rendering medium is a backend inside Play Canvas.** Story/mission/build progression should not require a different outer app shell for each backend.

If 3D is used: self-host/pin runtime assets, keep same-origin behavior, preserve touch/keyboard/reduced-motion/fallback, and make camera/hit targets work on mainstream phones.

Generated 3D worlds target the reusable contract in [THREE-STORY-FRAMEWORK.md](THREE-STORY-FRAMEWORK.md): a shared story/domain-agnostic Three.js runtime owns renderer lifecycle, resize/frame scheduling, resource cleanup, mobile DPR, pause/reduced motion and context loss; a versioned world adapter/package owns story-specific geometry/assets, art direction, camera compositions, beat states and game-state-to-visual mappings. **Play Canvas owns the persistent game-surface/world lifecycle above that subsystem.**

The generator should replace/adapt the world package, not regenerate renderer boilerplate or a fresh game shell for every course.

`StoryWorldSpec` stays renderer-agnostic. World-package/renderer IDs are provenance, never canonical competency or evidence IDs. Later arbitrary generated-package loading requires an explicit immutable publishing/asset-validation boundary; current explicit static allowlists/CSP must not be weakened for convenience.

### Future generated world package

When Three.js is selected, a future generator should emit a versioned world package (manifest + adapter + approved assets + fallback data) that mounts through Story3D and Play Canvas. If a new fantasy requires story-specific changes to `play-canvas.js`, `story3d-runtime.js`, or `story3d-world-host.js`, either:

1. the capability is genuinely generic and should first become a versioned shared capability with tests; or
2. the world package is violating the boundary.

Do not hide story-specific assumptions in shared engine code merely to make one generated experience work.

## Dual game-experience gate

Do not blend the opening and full chapter into one score.

### First-touch magic >=9

Judge the fresh first 60–90 seconds for beauty/creative hook, curiosity/wonder, character/world attachment, causal clarity, low initial cognitive load, pacing/navigation control, obvious first action and story-to-play transition.

The transition itself should feel continuous: when the story and first mission share a world, the player should not perceive a needless exit from one product surface into another.

### Whole-chapter game experience >=9

Judge the complete chapter for story-to-play continuity, agency, progressive cognitive load, challenge curve, feedback/consequence/recovery, payoff, replay/forward pull, commercial-game cohesion and continued learning relevance.

Whole-chapter review should explicitly penalize a game that abandons Play Canvas/world identity in later reasoning/build phases and reverts to normal course-site UI.

Both must independently reach an unrounded **>=9.0/10 with no blocker**. A high chapter score cannot average away a bad first touch, and beautiful first touch cannot excuse a weak chapter.

Use [GAME-UX-REVIEW.md](GAME-UX-REVIEW.md). Prefer a truly separate critic when the harness supports one. Otherwise record `internal_tool_assisted`; do not fake independence.

## Learning / transfer gate

After game gates pass, independently ask whether meaningful play actually teaches/assesses the intended LearningSpec.

Check purposeful practice coverage, misconceptions, unassisted success, hint dependence, explanation/reasoning when required, implementation/decision quality, fresh transfer and delayed retrieval where claimed.

Do not infer full-course effectiveness from one guided mission. Do not call an immediately repeated problem durable retention.

Applicable learning/transfer score must be **>=9.0/10** before learner review when using the current 9/10 acceptance process.

## Evidence invariants

Generated games must preserve:

- canonical competency identity independent of course/story;
- pinned assessment meaning and content versions;
- `unknown` distinct from failed;
- `declared_independent` distinct from observed assistance;
- current-attempt help distinct from `previously_exposed`;
- rewards/XP distinct from mastery;
- submitted evidence immutability;
- learner isolation;
- course replacement without losing legitimate history.

A game's fiction may say “signal restored”; the evidence layer must still state exactly what was observed and what was not.

Play Canvas/world/rendering state is presentation/game state. It does not become learning evidence merely because an animation played or a 3D object changed.

## Mainstream phone target

For the current reference and initial generated games, first optimize important first-touch/Chapter 1 flows for mainstream modern Android/iPhone portrait use: representative viewports around **360–430 CSS px**, tall-phone aspect ratios, touch input, safe areas, text enlargement and reduced motion.

Do not produce device-specific experiences unless actual evidence requires it. Desktop polish can follow after the phone path is strong.

Every generated GameExperienceSpec should include a phone Play Canvas composition/interaction budget, not rely on desktop shrinking after generation.

## Validation / repair loop

Keep validators separate:

1. schema/structural coverage;
2. source/grounding/content correctness;
3. story-only quality;
4. Play Canvas/world-package integration and lifecycle integrity;
5. first-touch game quality;
6. whole-chapter game quality;
7. accessibility/device interaction;
8. assessment/evidence integrity;
9. learning/transfer.

Use bounded repair budgets. Failed candidates remain explicit (`story_needs_revision`, `game_needs_revision`, `draft_needs_review`). Never lower a rubric or delete a failing test to advance.

## Documentation feedback loop

If direct user feedback changes story, onboarding, progression, rendering strategy, Play Canvas architecture, UI direction, device priority, critic semantics, acceptance or generation requirements, update the root implementation plan and affected docs **before or in the same bounded implementation unit as the code**.

The current user is the sole real product reviewer during private refinement. Their explicit verdict overrides every critic/automation result.

## Current implementation boundary

This file specifies the future general generator. Current work remains **private Phase 1 reference refinement** using Relay Rescue/Echo Forge to prove what a high-quality generated target should look like.

Phase 1 currently proves the Play Canvas lifecycle and reusable renderer/world-package seam with authored/test worlds. It does **not** authorize implementing the broad arbitrary generated-package loader yet.

It does **not** authorize Phase 2+, new model/provider integrations, external testers, public rollout, untrusted execution or paid infrastructure expansion.
