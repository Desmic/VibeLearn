# vibeLearn

Read `docs/STATE.md` first. The authoritative current scope is `CODEX-FIRST-SLICE.md`,
the root v1.3 implementation plan, and active repo amendments referenced by `STATE.md`.
For future course-generation work, `docs/COURSE-GENERATION-GAME-SYSTEM.md` is an
authoritative amendment to the Phase 3/4 generation expectations. The checksummed
`learning-os-design-package-v1.3/` directory is preserved as historical design input.
Stop at the current Phase 1 human/product checkpoint unless the user explicitly opens
the next phase.

The user authorized a private Render Free + Supabase Free pilot after Phase 1.
Keep historical Phase 1 evidence and learning contracts immutable; do not silently
advance into Phase 2+. The current retry material may be refined/scaffolded as a
reference game experience while acceptance is active.

Use one Python modular monolith and semantic HTML/CSS/JavaScript. Local mode keeps
SQLite and loopback binding. Hosted mode uses Flask/Gunicorn, PostgreSQL, and
Supabase Auth. Read `docs/HOSTING.md` for current setup and verification limits.
Install hosted/test dependencies from `requirements.lock` and `requirements-dev.txt`.
Run `python manage.py build`, `python manage.py test`, and
`python manage.py browser` at integrated gates. Start with `python manage.py serve`.
Browser tests use a separate temporary database, never the learner's real database.

Implement one behavior, verify it across storage and browser, then extend it.
Keep executable acceptance tests and observed evidence in `docs/`.
Do not replace tests with mocks to claim a live gate passed.

## Game-first product invariant

Read `docs/GAME-UX-SYSTEM.md` and `docs/GAME-UX-REVIEW.md` before substantial learning
UI, progression, mission or course-generation work. VibeLearn is a game-first learning
system, not a generic course website with XP labels.

The current HUD/campaign implementation is a reference pattern, not a requirement that
every subject copy its exact colors, four-node chapter or binary decision mechanic.
Preserve the principles: HUD-first hierarchy, direct play where possible, progressive
interface disclosure, teach -> easy success -> variation -> combine -> boss/release,
meaningful feedback/motion, and strict separation of game progression from learning
evidence.

When course generation is eventually implemented, it must generate the learning
contract **and** the playable campaign/mission/HUD/tool/progression/feedback contracts
specified in `docs/COURSE-GENERATION-GAME-SYSTEM.md`. Generated courses must pass
structural/learning, grounding/content and accessibility gates plus the separately run
game-UX critic. A playable/validated candidate requires a game-UX score >= 8.0/10 with
no critical blocker. Do not weaken the rubric to make a generated candidate pass.

All learner commands require a resolved local session, a command ID and expected
revision. Content snapshots, checkpoints, assistance and evidence are immutable.
Evidence/review belong to learners and frames, not installed courses. XP and
self-reported experience never establish mastery. Missing evidence is not failure.
The local development identity is not production authentication. Hosted mode must
fail closed without verified Supabase identity, an email allowlist, HTTPS, and a
scoped PostgreSQL connection. No untrusted code runner, learning-model integration,
Phase 2+, paid resource provisioning, or broad public rollout in this increment.

Preserve supplied design files and unrelated work. Record migrations, exact checks,
known limitations and a recovery path. Machine checks are not human acceptance.
