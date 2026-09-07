# vibeLearn

Read `docs/STATE.md` first. The authoritative scope is `CODEX-FIRST-SLICE.md`
and the v1.3 implementation plan. Stop at the Phase 1 human checkpoint.

Use one Python modular monolith, SQLite, and semantic HTML/CSS/JavaScript.
Runtime has no third-party dependencies. Keep the app loopback-only.
Run `python manage.py build`, `python manage.py test`, and
`python manage.py browser` at integrated gates. Start with `python manage.py serve`.
Browser tests use a separate temporary database, never the learner's real database.

Implement one behavior, verify it across storage and browser, then extend it.
Keep executable acceptance tests and observed evidence in `docs/`.
Do not replace tests with mocks to claim a live gate passed.

All learner commands require a resolved local session, a command ID and expected
revision. Content snapshots, checkpoints, assistance and evidence are immutable.
Evidence/review belong to learners and frames, not installed courses. XP and
self-reported experience never establish mastery. Missing evidence is not failure.
This development identity is not production authentication. No untrusted code runner,
provider integration, hosting, Phase 2+, or public activation in this slice.

Preserve supplied design files and unrelated work. Record migrations, exact checks,
known limitations and a recovery path. Machine checks are not human acceptance.
