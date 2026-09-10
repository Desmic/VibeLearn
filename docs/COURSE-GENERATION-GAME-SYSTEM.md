# Course generation produces playable teaching systems

Current authority — updated 10 September 2026. This amends the root implementation plan for future Phase 3/4; it does not open those phases. Read [GAME-AS-COURSE.md](GAME-AS-COURSE.md), [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md), [GAME-UX-SYSTEM.md](GAME-UX-SYSTEM.md), [GAME-ACCEPTANCE-9.md](GAME-ACCEPTANCE-9.md), and [STATE.md](STATE.md).

## Contract continuity and precedence

The detailed pre-existing generation specification remains preserved at [history/COURSE-GENERATION-before-game-as-course.md](history/COURSE-GENERATION-before-game-as-course.md). Its brief, package, schema, versioning, assistance, validation, and repair requirements remain normative except where explicitly superseded here.

Current quality target: unrounded **>=9.0/10** for each applicable story, game-experience, and learning/real-world-transfer critic gate, no critical blocker, then explicit user acceptance. The current user's verdict overrides machine/critic scores.

## Generation order is now story-first

Do **not** generate a lesson/game mechanic first and attach generic narrative afterward. For every course/subject, the generation pipeline begins by creating a compelling story/fantasy/world premise that can naturally carry the target learning.

Required order:

`course intent/outcomes -> learner/audience preferences -> story/fantasy candidate -> story critic -> gameplay/world realization -> game critic -> learning/transfer validation -> release candidate -> current user review`

The story critic must pass before expensive gameplay realization is treated as the current candidate. A game critic cannot retroactively rescue a weak story.

## Learner-preference input for story generation

The eventual generator should use available learner preferences to shape the narrative world. Story preferences may include:

- genre and world type;
- realism vs fantasy/sci-fi;
- emotional tone;
- character style and relationship focus;
- visual style;
- humor/darkness;
- exploration vs action vs mystery vs construction;
- pace and narrative density;
- preferred degree of choice/branching;
- disliked themes or presentation styles.

If preferences are unknown, generate a strong broad-audience default suitable for a bright child and still credible to a teen/young adult. Do not make “young audience” synonymous with childish writing.

Preference data changes presentation/story choices; it must not weaken competency definitions, source grounding, assessment semantics, evidence boundaries, or safety/accessibility requirements.

## Required StoryPackage artifact

Before generating the playable course package, produce and version a `StoryPackage` (name illustrative; exact schema may evolve) containing at minimum:

- story ID/version and course/version binding;
- audience assumptions and preference inputs actually used;
- genre/tone/world premise;
- protagonist/focal actor and readable desire;
- player role and why the player belongs in the story;
- world rules important to the opening;
- inciting incident;
- causal chain of pre-player events;
- stakes and central question/mystery/conflict;
- chapter/mission story progression and escalation;
- planned discoveries, reversals, consequences, recovery beats, and payoff;
- how target concepts become world rules, tools, puzzles, powers, conflicts, systems, or decisions rather than renamed vocabulary;
- first-touch realization options (2D / 2.5D / Three.js 3D) and rationale;
- accessibility/reduced-motion storytelling equivalent;
- story critic result and unresolved weaknesses.

The story artifact must be inspectable independently from gameplay code.

## Separate story critic gate

A story critic evaluates **exactly one frozen story candidate at a time**. It rates the story itself, not the implementation around it. Use [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md) as the authoritative rubric.

The critic must judge at least: hook, clarity/causality, character attachment, world/fantasy appeal, storytelling quality, pacing/progression, stakes, payoff/forward pull, and cross-age engagement.

The critic does **not** award points for:

- course usefulness;
- learning evidence or assessment correctness;
- code/test quality;
- browser reliability;
- Three.js or rendering sophistication;
- number of animations/assets;
- implementation effort.

A story below 9.0 or with a story blocker remains `story_needs_revision`. Iterate the same single story or intentionally replace it with a new version; preserve which candidate was scored. Do not average multiple stories into one rating.

The current user's explicit story verdict overrides the critic. The present Relay Rescue opening is user-rated **3/10** and therefore fails regardless of prior game-critic results.

## The game is the course

After story approval, generate an experience in which meaningful investigation, manipulation, construction, decisions, and consequences exercise the intended capability. Do not generate an ordinary lesson page, add XP, and call it a game.

The generated gameplay must integrate with the story rather than interrupt it with unrelated lesson screens. Explanations and coding tasks are legitimate when they develop/demonstrate the promised skill, but should enter through the player's role/world whenever feasible.

## Attention-first onboarding contract

Generated courses inherit this early progression:

`story hook / wonder -> character + world desire -> immediate need -> one obvious action -> visible consequence -> easy success/recovery -> formal concept -> variation -> combination -> transfer`

The first playable minute should create interest with a well-told story/world and minimize unnecessary terminology. Core context should be dramatized, not dumped as exposition slides.

Suitable opening forms include interactive cinematic, explorable 3D/2.5D scene, character encounter, playable incident, mystery, simulation failure, visual construction, scientific event, professional scenario, or another form faithful to the topic and chosen story.

## First-touch story-player contract

Generated openings must not behave like rushed slide decks.

- Back/previous beat is mandatory.
- First-run progression is user-paced by default.
- Next/continue, pause/resume when animation runs, skip, replay, and visible progress/chapter position are required where applicable.
- Autoplay, if offered, is optional and must give each beat enough time to land; any inspection/interaction pauses it.
- Back/forward restores coherent visual/narrative state.
- Reduced-motion preserves the complete causal story and the same navigation controls.
- Resume/checkpoints avoid forcing long rewatching.

A generated opening fails first-touch validation if the player must race the interface to read or understand it.

## Tutorial focus-mode contract

Generated first chapters treat visible UI complexity as a limited budget. The generator explicitly labels surfaces as **visible now**, **deferred**, and **introduced later**.

Default behavior:

- the first meaningful interaction lives in the playfield/world;
- evidence panels, analytics, learning metadata, journals, settings, helper drawers, long tool rails, and postmortems remain deferred unless needed for the current decision;
- introduce the smallest useful HUD/action dock as context grows;
- underlying save/evidence/accessibility semantics remain active even when explanatory surfaces are hidden;
- focused presentation reuses real controls/state behavior rather than decorative clones.

Mission one fails if it visually resembles a dense dashboard/course page even when the mechanic is correct.

## First-chapter world-model gate

Before the tutorial chapter completes, a fresh novice should be able to answer in plain language:

1. Who/what matters and why should I care?
2. What do they want to happen?
3. What are the important actors/objects/resources and what do they do?
4. What happened before I arrived?
5. What changed or became uncertain?
6. Why does it matter?
7. What can I do in this world?
8. Why is my first action useful?
9. What makes me want to discover the next beat/mission?

The StoryPackage and rendered game must demonstrate these answers through story/play with modest reading demand. A glossary, long briefing, or repository documentation does not satisfy the gate.

## Progressive cognitive-load contract

Difficulty growth increases reasoning and agency, not merely text length:

- **Orient:** strong story/world hook, one obvious action, low vocabulary, highly legible consequence.
- **Confirm:** easy success or recoverable error that teaches the local rule.
- **Vary:** change one meaningful dimension while preserving interaction grammar.
- **Combine:** require previously learned rules together and expand available agency.
- **Transfer:** move to a meaningfully different context with reduced scaffolding.
- **Retrieve later:** revisit the capability after delay where retention is claimed.

Every boss rule and UI operation must be taught or intentionally reserved for a justified transfer challenge. Do not introduce new controls, vocabulary, and domain rules simultaneously without reason.

## 2D / 2.5D / Three.js decision

For each StoryPackage, explicitly evaluate three realization families:

1. authored 2D/illustrated animation;
2. 2.5D/parallax/layered interactive scenes;
3. interactive Three.js 3D.

Three.js should be seriously considered for the kid/teen/young-adult audience because immersion, character presence, spatial storytelling, atmosphere, world exploration, and direct interaction can materially increase attention even when the underlying learning concept is not inherently 3D.

Do not default every course to 3D. Choose based on learner preference, story needs, subject, mobile/device budget, and the quality advantage demonstrated by the prototype. A beautiful renderer never compensates for weak story or gameplay.

If 3D is chosen, require pinned/local assets, same-origin runtime, keyboard/touch equivalence, reduced-motion behavior, usable fallback, and realistic mobile performance checks. Renderer output never establishes learning evidence.

## Additional required generated contracts

The original CourseBrief/full-package contracts remain. Extend them with:

- learner/audience story preferences and assumptions;
- versioned StoryPackage + story critic record;
- opening hook and reason to continue with XP hidden;
- first-touch navigation/timing policy;
- first-chapter world model;
- first-minute visibility budget;
- cognitive-load stages and vocabulary/tool disclosure points;
- outcome coverage ledger mapping `outcome -> prerequisite -> mechanic -> decision -> feedback -> varied practice -> fresh transfer -> delayed retrieval -> evidence limits`;
- meaningful alternatives, failure/recovery, earned ending, and reasoning-changing replay variation;
- renderer/fallback behavior;
- exact candidate/version, executable fixtures, rendered evidence, raw critic scores, method, limitations, and open blockers.

The original provenance, learning/assessment bindings, competency identity/migration, course-independent evidence, assistance distinctions, reward separation, immutable release, persistence/resume, and learner-isolation requirements remain intact.

## Validation and repair

Story validation occurs before game validation. Structural/learning, grounding/content, assessment-integrity, accessibility, game-experience, and learning/transfer validators remain separate.

The rendered game critic must verify the story survives realization; it cannot simply trust the StoryPackage. It should also inspect first-touch navigation, pacing, visible UI complexity, actual first action, consequences, progression, and whether the result feels like a credible commercial game rather than a gamified website.

Keep bounded repair budgets. Failed candidates remain explicit failures (`story_needs_revision`, `draft_needs_review`, etc.); never lower thresholds or relabel schema-valid output as validated.

## Documentation feedback loop

If user feedback changes story, onboarding, progression, rendering strategy, UI direction, acceptance, or generation requirements, update affected repository docs in the same implementation unit. Future generation must inherit current product direction rather than stale assumptions.

## Current implementation boundary

This documents the future adaptive course-generation system; it does **not** authorize Phase 2+, new model integration, public rollout, external testers, untrusted execution, or paid infrastructure. Current work remains private Phase 1 product refinement.
