# vibeLearn

Read `docs/STATE.md`, then `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/GAME-AS-COURSE.md`, `docs/GAME-UX-SYSTEM.md`, and `docs/COURSE-GENERATION-GAME-SYSTEM.md` before substantial product work. The product is a game whose meaningful play delivers intended course outcomes, not a course website with game decoration. Experience is essential.

The user currently permits available-tool/internal review while a genuinely separate critic is unavailable. Do not block current private Phase 1 refinement on critic tooling. Label any fallback `internal_tool_assisted`; never call it an independent agent or human playtest. Story, game, and learning/transfer reviews are separate gates. Each applicable critic target is unrounded >=9.0/10 with no blocker, but the user's final verdict overrides every critic.

## Current user verdict is authoritative

The current Relay Rescue opening is **user rejected**. The newest first-touch/story rating is **3/10**. The user specifically reported: no back navigation in the animation/slides, beats move too quickly, the story is lazily told, causality/context is unclear, and it does not yet capture kids/young adults strongly enough.

The previous internal 9.196 game / 9.35 bounded-learning critic result is historical only. Never cite it as evidence that the current experience is acceptable after the user's rejection. Current status is `needs_revision`.

The current user is the sole real product reviewer during private refinement. Do not average their verdict with agent/critic/automation scores.

## User feedback is product state, not chat-only context

When user feedback changes story direction, onboarding, progression, rendering strategy, UI/UX, acceptance, course generation, testing, or rollout boundaries, **update the relevant repository docs in the same implementation unit**. A behavior change is incomplete if design contracts remain stale.

At minimum inspect `docs/STATE.md`, `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/GAME-AS-COURSE.md`, `docs/GAME-UX-SYSTEM.md`, and `docs/COURSE-GENERATION-GAME-SYSTEM.md`; update only the ones materially affected.

## Story-first product workflow

For any course/subject, **generate the story/fantasy/world premise before gameplay realization**. Do not start with lesson cards/mechanics and add narrative afterward.

Required conceptual pipeline **today**:

`course topic/outcomes -> story/fantasy candidate -> story critic >=9 -> gameplay/world realization -> game critic >=9 -> learning/transfer gate -> user review`

There is no learner creative-preference input in the current implementation. Do not infer one from unrelated profile data. Future explicit `StoryPreferenceProfile` support may insert learner-chosen genre/tone/world constraints between topic/outcomes and story generation.

The story critic evaluates **one frozen story at a time**, solely on story quality: hook, clarity/causality, character attachment, world/fantasy appeal, storytelling quality, pacing/progression, stakes, payoff/forward pull, and cross-age engagement. It must not award story points for code, tests, curriculum value, Three.js, asset count, or engineering effort.

Long term, story generation should support explicit learner preferences such as genre, tone, world type, realism/fantasy balance, character/relationship style, visual style, pace, humor/darkness, exploration/action preference, and narrative density. **Today those inputs do not exist:** story choice is driven by the topic/outcomes plus a fixed broad-audience quality target. Do not equate “kid-accessible” with childish writing.

## First-touch story UX is a hard requirement

A story/cinematic must not behave like a rushed slide deck.

- **Back / previous beat is mandatory.**
- First-run story progression is **user-paced by default**.
- Provide next/continue, pause/resume while animation is active, skip, replay, and visible progress/chapter position.
- Optional autoplay must be slow enough for the beat to land and pause on inspection/interaction.
- Back/forward restores coherent story/world state.
- Reduced motion preserves the same causal meaning and navigation.
- Do not make the player rewatch long exposition after ordinary failure/resume.

Do not “fix” a weak story by only increasing timers. Story should be dramatized through action, scene change, character behavior, discovery, dialogue, conflict, consequence, or direct interaction rather than explanatory captions.

## Attention first, cognition second

The early-load ladder is:

`story hook / beauty / curiosity -> character + world desire -> concrete need -> one obvious action -> visible consequence -> easy recovery/success -> name the concept -> variation -> combination -> transfer`

The first/tutorial chapter must make the world obvious to a child/novice before demanding technical reasoning while remaining stylish enough for teens/young adults. Formal terminology comes after a concrete model when faithful.

Use tutorial focus mode: playfield/world first; nonessential evidence panels, journals, analytics, helper drawers, repeated briefings, settings, and long tool rails are deferred until useful. Underlying save/evidence semantics stay active.

## Three.js / 3D direction

Three.js is now a **serious option for attention and immersion**, not merely an optional renderer for inherently spatial learning mechanics. Explicitly consider authored 2D animation, 2.5D/parallax, and interactive Three.js 3D for important story/game candidates.

3D can be valuable for character/world presence, spatial storytelling, atmosphere, exploration, discovery, and direct interaction with the kid/teen/young-adult audience. But 3D never rescues weak writing or weak gameplay and earns no automatic critic points.

Use locally served verified/pinned assets; no runtime CDN or relaxed CSP. Preserve keyboard/touch semantics, reduced motion, fallback, same-origin behavior, and realistic mobile performance. Renderer state never determines assessment/evidence/unlocks.

## Game-first and course-outcome invariants

After the story gate, judge the game as something a curious kid or young adult would voluntarily continue with XP hidden. The approved story must survive implementation as an actual world, not collapse into cards/forms/exposition.

Teach -> easy success -> variation -> combine -> boss/transfer -> resolution -> new possibility. Increase reasoning and agency, not form length. Teach every required boss rule before graded use. New tools expand what the player can do.

Story, game experience, and learning outcomes are separate gates. A great story with boring play fails. Great play with shallow learning fails. Strong learning with no voluntary engagement fails the product.

The first chapter has an explicit world-model gate. A fresh player should be able to explain: who/what matters; what they want; why they care; important objects/resources and functions; what already happened; what changed; why it matters; what the player can do; why the first action is useful; and what makes them want the next beat.

Map each learning outcome through mechanic, decision, feedback, varied practice, fresh transfer, delayed retrieval where claimed, and evidence limits. Do not claim a full course's outcomes from a short guided slice.

## Scope and verification

Stay within private Phase 1 product refinement. Do not silently open Phase 2 reuse, Phase 3 generation implementation, model integration, untrusted code execution, external testers, paid resources, or public rollout. Preserve historical snapshots and evidence. The current Render branch is `deploy/render-supabase`; verify branch/service before claiming something is live.

Use one Python modular monolith with semantic HTML/CSS/JavaScript. SQLite/loopback remain local; Flask/Gunicorn, PostgreSQL, and Supabase Auth remain hosted. Read HOSTING.md before infrastructure work.

Install hosted/test dependencies from requirements.lock and requirements-dev.txt. Run `python manage.py build`, `python manage.py test`, and `python manage.py browser` at integrated gates. Use disposable browser databases. Preserve screenshots, traces, exact commits, and failures. No successful API mocks to claim live verification.

Implement a small complete behavior, verify it, inspect it, then extend it. Machine checks are not human acceptance and source-only review is not story/game review.

## Evidence, privacy and persistence

Every command resolves learner session, command ID, and expected revision. Server validation owns progression and replays pinned game rules. Submitted evidence remains immutable; resets must be explicit learner-scoped operations. XP/self-report never establishes mastery, evidence strength, or correctness-based unlocks.

`unknown` is not `assisted`; observed/declared current help is `assisted`; earlier family exposure is `previously_exposed`, not current help. Interactive feedback is guided practice, not fresh independent prediction. Missing evidence is not failure.

Hosted mode fails closed without verified identity/authorized pilot access, HTTPS, and scoped PostgreSQL access. Keep auth, RLS, secrets, and learner-data boundaries intact. Preserve unrelated work and supplied files, and record recovery paths/limitations.
