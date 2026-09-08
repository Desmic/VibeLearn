# vibeLearn

Read `docs/STATE.md`, then **`docs/GAME-AS-COURSE.md`**, the latest user amendment
(9 September 2026). The product is a game whose meaningful play delivers the intended
course outcomes, not a course website with game decoration. Experience is essential.

The user temporarily authorized **available-tool/internal review while Codex is
unavailable**. Do not block this Phase 1 refinement on Codex setup. Use actual rendered
journeys, screenshots/traces, adverse-path tests and a frozen-rubric critic pass; label
the reviewer `internal_tool_assisted`, never an independent agent or human playtest.
The unrounded >=9.0/10 target, younger-player and young-adult lenses, no-critical-blocker
rule and the user's final acceptance remain. A lower score means `needs_revision`.
Do not inflate a score or reuse historical 8.8/9.1 reviews. An attractive screenshot,
a new renderer and passing tests do not prove fun or course-equivalent learning.

The authoritative build order remains `CODEX-FIRST-SLICE.md`, the root implementation
plan and active amendments in STATE.md. `docs/COURSE-GENERATION-GAME-SYSTEM.md`,
`docs/GAME-ACCEPTANCE-9.md` and `docs/GAME-AS-COURSE.md` amend future generation.
Older 8/10 references are superseded. The temporary internal-review exception applies
to this supervised refinement, not blanket self-certification by future generators.
The checksummed `learning-os-design-package-v1.3/` remains historical input, unchanged.

## Scope and verification

Stay within private Phase 1 product refinement. Do not silently open Phase 2 reuse,
Phase 3 generation, model integration, untrusted code execution, external testers,
paid resources or public rollout. Preserve historical snapshots and evidence. Keep
PR #2 draft until the current product gates and user acceptance actually close.

Use one Python modular monolith with semantic HTML/CSS/JavaScript. SQLite/loopback
remain local; Flask/Gunicorn, PostgreSQL and Supabase Auth remain hosted. Read HOSTING.md
before infrastructure work. No renderer may decide assessment, evidence or unlocks.

The optional Three.js spike uses `?world=3d` and locally served, verified pinned assets.
Read `docs/THREEJS-SPIKE.md`. Run `python manage.py vendor` to fetch/verify the declared
build dependencies before 3D testing; no runtime CDN or relaxed CSP. Default illustrated
play and equivalent keyboard/touch controls remain available. Keep the prototype opt-in
until actual interaction, accessibility and device performance justify promotion.

Install hosted/test dependencies from requirements.lock and requirements-dev.txt.
Run `python manage.py build`, `python manage.py test`, and `python manage.py browser`
at integrated gates. Use only disposable browser databases. Preserve screenshots,
traces, exact commits and failures. No successful API mocks to claim live verification.
Do not bypass administrator browser policy; identify which normal environment ran the
tests and distinguish automated evidence from personal interactive/human play.

Implement a small complete behavior, verify it, inspect it, then extend it. Machine
checks are not human acceptance, and a source-only code review is not a game review.

## Game-first and course-outcome invariants

Read GAME-UX-SYSTEM.md, GAME-UX-REVIEW.md and GAME-AS-COURSE.md before substantial
learning UI, mission, progression or generation work. Judge the game as something a
curious kid or young adult would voluntarily continue playing with XP hidden. State
reading/prior-knowledge assumptions; do not pretend an agent prediction is child testing.

Use narrative/intuitive context before jargon where faithful: who wants what, what
changed, and what action matters. Play must reveal causality. Do not add story as extra
reading burden or force every subject into one fantasy, delivery, combat or quiz template.
Prefer meaningful investigation, manipulation, construction and experimentation.

Teach -> easy success -> variation -> combine -> boss/transfer -> resolution -> new
possibility. Increase reasoning, not form length. Teach every required boss rule before
its graded use. A useful new tool expands agency; a cosmetic badge is not a new mechanic.
Successful sequential clears focus the intended next route. Failure keeps a predictable
retry target. Required actions remain accessible, stable and usable without sound/motion.

Experience and learning outcomes are separate gates; neither compensates for failure
of the other. Map each outcome through mechanic, decision, feedback, varied practice,
fresh transfer, delayed retrieval and evidence limits. Do not claim a full course's
outcomes from a short guided slice. Free prose cannot be graded by counts or keywords.

## Evidence, privacy and persistence

Every command resolves a learner session, command ID and expected revision. Server
validation owns progression and replays pinned game rules. Saved moves cannot be erased;
rehearsal rewind retains prior feedback/history. Submissions/checkpoints/evidence are
immutable. New assessment meaning requires explicit new identities/revisions.

`unknown` is not `assisted`; observed/declared current help is `assisted`; earlier family
exposure is `previously_exposed`, not help used now. Interactive feedback is not a fresh
independent prediction. Missing evidence is not failure. XP/self-report never establishes
mastery, evidence strength or correctness-based unlocks. Evidence/reviews belong to
learners/frames, not installed course packages.

Hosted mode fails closed without verified Supabase identity, an email allowlist, HTTPS
and a scoped PostgreSQL connection. Local identity is not production authentication.
Keep auth, RLS, secrets and learner data unchanged for renderer-only work. Preserve
unrelated work and supplied files, and record recovery paths and limitations.
