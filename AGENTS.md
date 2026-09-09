# vibeLearn

Read `docs/STATE.md`, then `docs/GAME-AS-COURSE.md`, `docs/GAME-UX-SYSTEM.md`, and `docs/COURSE-GENERATION-GAME-SYSTEM.md` before substantial product work. The product is a game whose meaningful play delivers the intended course outcomes, not a course website with game decoration. Experience is essential.

The user currently permits available-tool/internal review while Codex is unavailable. Do not block this Phase 1 refinement on Codex setup. Use actual rendered journeys, screenshots/traces, adverse-path tests and a frozen-rubric critic pass; label the reviewer `internal_tool_assisted`, never an independent agent or human playtest. The unrounded >=9.0/10 target, younger-player and young-adult lenses, no-critical-blocker rule and the user's final acceptance remain. A lower score means `needs_revision`. An attractive screenshot, a new renderer and passing tests do not prove fun or course-equivalent learning.

## User feedback is product state, not chat-only context

The current user is the sole real product reviewer during this private refinement. Their explicit product verdict overrides agent/critic/automation scores. Do not average it with another score and do not treat a critic pass as acceptance.

When user feedback changes a product principle, onboarding approach, progression model, UI/UX direction, acceptance rule, course-generation rule, testing expectation, or rollout boundary, **update the relevant repository docs in the same implementation unit**. A behavior change is incomplete if the code changes but the design contract remains stale. At minimum inspect `docs/STATE.md`, `docs/GAME-UX-SYSTEM.md`, `docs/GAME-AS-COURSE.md`, and `docs/COURSE-GENERATION-GAME-SYSTEM.md`; update only the ones materially affected.

Current user direction is authoritative: **capture attention with creativity and beauty first, then raise cognitive load progressively**. The first/tutorial chapter must make the world obvious to a child or novice before asking for technical reasoning. Use visual causality and simple interaction to establish the character, goal, important objects, what each object does, what went wrong, why it matters, what help is needed, and the first action. Only then introduce formal terminology or multi-step system reasoning.

The default early-load ladder is:

`beauty/curiosity -> character + concrete problem -> one obvious action -> visible consequence -> easy recovery/success -> name the concept -> variation -> combination -> transfer`

Animation is useful when it communicates causality or object function. It is not satisfied by decorative motion, Three.js, particles, XP or a cinematic that leaves the player confused. Essential meaning must remain available with reduced motion.

## Scope and verification

Stay within private Phase 1 product refinement. Do not silently open Phase 2 reuse, Phase 3 generation, model integration, untrusted code execution, external testers, paid resources or public rollout. Preserve historical snapshots and evidence. The current Render deployment branch is `deploy/render-supabase`; verify the exact branch/service before claiming something is live.

Use one Python modular monolith with semantic HTML/CSS/JavaScript. SQLite/loopback remain local; Flask/Gunicorn, PostgreSQL and Supabase Auth remain hosted. Read HOSTING.md before infrastructure work. No renderer may decide assessment, evidence or unlocks.

The optional Three.js work is presentation/input only. Use locally served, verified pinned assets; no runtime CDN or relaxed CSP. Keep equivalent keyboard/touch controls and a playable fallback. Promote 3D only when it improves the learning action and the game experience.

Install hosted/test dependencies from requirements.lock and requirements-dev.txt. Run `python manage.py build`, `python manage.py test`, and `python manage.py browser` at integrated gates. Use only disposable browser databases. Preserve screenshots, traces, exact commits and failures. No successful API mocks to claim live verification.

Implement a small complete behavior, verify it, inspect it, then extend it. Machine checks are not human acceptance, and a source-only code review is not a game review.

## Game-first and course-outcome invariants

Judge the game as something a curious kid or young adult would voluntarily continue playing with XP hidden. Narrative precedes jargon where faithful: who wants what, what changed, why it matters, and what action the player can take. Play must reveal causality. Do not add story as another reading burden.

Teach -> easy success -> variation -> combine -> boss/transfer -> resolution -> new possibility. Increase reasoning and agency, not form length. Teach every required boss rule before graded use. A useful new tool expands what the player can do; a cosmetic badge is not a mechanic.

The first chapter has an explicit **world-model comprehension gate**. Before it ends, a fresh player should be able to answer in plain language: Who needs help? What do they want? What are the important things in the scene? What does each one do? What already happened? What is uncertain? Why is the wrong action harmful? What should I inspect or try first? If the UI cannot answer those questions through play/visuals with modest reading, the tutorial is not done.

Experience and learning outcomes are separate gates; neither compensates for failure of the other. Map each outcome through mechanic, decision, feedback, varied practice, fresh transfer, delayed retrieval and evidence limits. Do not claim a full course's outcomes from a short guided slice.

## Evidence, privacy and persistence

Every command resolves a learner session, command ID and expected revision. Server validation owns progression and replays pinned game rules. Submitted evidence remains immutable; resets must be explicit, learner-scoped product operations rather than silent history rewriting. XP/self-report never establishes mastery, evidence strength or correctness-based unlocks.

`unknown` is not `assisted`; observed/declared current help is `assisted`; earlier family exposure is `previously_exposed`, not help used now. Interactive feedback is guided practice, not a fresh independent prediction. Missing evidence is not failure.

Hosted mode fails closed without verified identity/authorized pilot access, HTTPS and scoped PostgreSQL access. Keep auth, RLS, secrets and learner data boundaries intact. Preserve unrelated work and supplied files, and record recovery paths and limitations.
