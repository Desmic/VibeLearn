# vibeLearn

**Read `CODEX-IMPLEMENTATION-PLAN.md` first**, then `docs/STATE.md`, `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/GAME-AS-COURSE.md`, `docs/GAME-UX-SYSTEM.md`, `docs/GAME-UX-REVIEW.md`, `docs/COURSE-GENERATION-GAME-SYSTEM.md`, `docs/PLAY-CANVAS.md`, and `docs/THREE-STORY-FRAMEWORK.md` before substantial product work.

The active implementation plan controls build order. User feedback that changes product direction, story/game quality, generation assumptions, platform priority, critic semantics, Play Canvas/framework boundaries or the meaning of done must update the plan and materially affected current docs before or in the same bounded implementation unit as code.

## Product north star

VibeLearn is a **general learning-game generation system**, not Relay Rescue and not a course website with game decoration. Relay Rescue/Echo Forge is the current authored Phase 1 reference used to prove reusable contracts.

The durable generated boundary is:

`LearningSpec -> StoryWorldSpec -> GameExperienceSpec -> AssessmentEvidenceSpec`

Canonical competency/evidence identity must not depend on Pip, a fantasy name, visual style, renderer, world package, Play Canvas implementation or course-specific object.

**Today:** story/world generation is driven by topic/course intent, source-grounded outcomes, causal concept structure and a broad kid-through-young-adult quality target.

**Future:** an explicit learner-controlled `StoryPreferenceProfile` may influence genre, fantasy/realism, tone, characters, visual style, humor/darkness, pace, exploration/action balance and narrative density. It is creative state, not mastery/evidence. Never infer it from unrelated personal data.

## Acceptance authority

The current user is the sole real product reviewer during private refinement. Their latest explicit predecessor first-touch/story verdict is **3/10** and remains authoritative until they review a materially changed verified/deployed candidate.

Historical critic scores never override direct user rejection.

Available-tool/internal criticism is allowed when a genuinely separate critic is unavailable, but label it `internal_tool_assisted`; never call it independent or human-tested.

Required gate order:

`story critic >=9 -> first-touch magic >=9 -> whole-chapter game >=9 -> learning/transfer >=9 -> user review`

All scores are unrounded and require no blocker. Critic pass only authorizes the next gate.

## Story-first workflow

For every course/subject, generate and freeze a compelling story/fantasy/world before gameplay realization. Do not begin with generic lesson prose/UI and reskin it later.

The story critic evaluates one frozen story only: hook, causality, character attachment, world appeal, storytelling quality, pacing/progression, stakes, payoff/forward pull and cross-age engagement. It gives zero credit for Three.js, code, tests, curriculum value or engineering effort.

The first chapter must build a clear world model before raising cognitive load. Default early-load ladder:

`beauty / curiosity / hook -> character + world desire -> concrete need -> one obvious action -> visible consequence -> easy recovery/success -> formal concept -> variation -> combination -> transfer`

First-run narrative UX is user-paced by default. Back/previous, Continue, Skip, Replay and visible progress are required where applicable; Pause/Resume is required while motion runs. Reduced motion preserves causal meaning and navigation. A slower slide deck is still a failure if the story is not dramatized.

## Play Canvas is the game architecture

The **Play Canvas** in `docs/PLAY-CANVAS.md` is the persistent game surface/orchestrator. Story, exploration, missions, consequences, progression, building and transfer should happen inside it.

Do not add new course-specific game shells, bespoke story/mission canvases or page/card experiences for gameplay phases. During migration, legacy DOM containers may remain temporarily, but new work must move toward one persistent Play Canvas lifecycle.

For compatible modes sharing a world package, prefer the same Play Canvas stage/world/runtime instance across transitions. Accessible semantic DOM actions/fallback remain required, but they support the game surface and never decide correctness/mastery/evidence.

## Three.js framework is a hard reusable subsystem requirement

The user explicitly requires a **Three.js framework that makes future story/fantasy settings easy to integrate**.

The hierarchy is:

`Play Canvas -> renderer backend -> Story3D runtime/host -> world package`

Three.js is optional per course; 2D and 2.5D remain valid. When Three.js is used, shared infrastructure owns renderer/canvas lifecycle, DPR, resize, frame scheduling, pause/reduced motion, context recovery, resource disposal, camera orchestration and adapter/package validation.

Story-specific world packages own art/assets, scene entities, beat states, game-state visual mappings, camera compositions, interaction anchors and fallback metadata.

### Data-first authoring target

Long term, generated 3D worlds should be **versioned declarative packages interpreted by trusted runtime code**, not arbitrary generated JavaScript. Prefer package data such as:

- manifest/backend/capabilities/assets;
- scene/entity graph;
- story/game visual states;
- camera compositions;
- semantic interaction anchors;
- approved same-origin assets;
- semantic/2D fallback.

A custom adapter module should be exceptional/reviewed, not the default generated output.

Current Phase 1 may keep authored `rescue-story3d.js`, but future-world integration should mostly change package data/assets rather than `play-canvas.js`, `story3d-runtime.js` or `story3d-world-host.js`.

If a new fantasy needs story-specific core edits, either generalize the capability as a versioned shared feature with tests or treat it as a framework-boundary failure.

Do not implement an unsafe arbitrary package loader during current Phase 1. CSP/static allowlists remain strict until a later immutable publishing/asset-validation boundary exists.

## Game-first learning invariants

Meaningful play must embody subject thinking: investigate, manipulate, compare, arrange, construct, diagnose, test, explore or control systems when those actions map to the capability.

Difficulty rises through reasoning, transfer, uncertainty, trade-offs, interacting rules and reduced scaffolding—not longer prompts or denser dashboards.

Keep the story/world alive as complexity rises where it still carries meaning. Do not collapse into a themed form/workbench exactly when reasoning becomes harder.

Every intended outcome maps through prerequisite -> mechanic -> player decision -> causal feedback -> varied practice -> fresh transfer -> delayed retrieval where claimed -> evidence limits.

## Primary device target

Current refinement is phone-first for mainstream modern Android/iPhone portrait use, roughly **360–430 CSS px** wide with common tall aspect ratios, touch, safe areas, text enlargement and reduced motion. Desktop polish follows after phone quality is strong.

## Engineering and verification

Stay inside private Phase 1 unless explicitly authorized otherwise.

Use the Python modular monolith and preserve hosted auth, PostgreSQL/RLS, learner isolation, server-authoritative progression/evidence, submitted-evidence immutability, reset confirmation and historical-review boundaries.

Run integrated gates with:

```text
python manage.py vendor
python manage.py build
python manage.py test
python manage.py browser
```

Browser ES modules must be syntax-checked with module semantics. Preserve exact commits, failures, screenshots/traces and real persistence/restart paths. Do not claim human delight from machine checks.

For Play Canvas/Story3D migration, executable tests should verify **instance continuity and genericity**, not just similar pixels:

- same compatible Play Canvas/world/WebGL instance across story -> mission;
- no duplicate renderer lifecycle;
- synthetic unrelated world mounts through shared infrastructure;
- shared runtime/host has no Pip/Echo Forge/rescue assumptions;
- phone/reduced-motion/fallback/context-loss behavior remains green.

## Evidence semantics

Every command resolves learner, command ID and expected revision. Server validation owns progression and replays pinned rules.

`unknown` is not `assisted`; current observed/declared help is `assisted`; earlier family exposure is `previously_exposed`; explicit no-help may be `declared_independent`. XP never establishes mastery or correctness. Rendering/world state never becomes evidence merely because animation played.

## Scope

No Phase 2+ implementation, new model/provider integration, untrusted runner, external testers, paid provisioning or public rollout without explicit authorization.

Render serves `deploy/render-supabase`; auto-deploy is disabled. Verify branch/service and exact revision before saying something is live.
