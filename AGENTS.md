# vibeLearn

Read `docs/STATE.md` first. The authoritative scope is `CODEX-FIRST-SLICE.md`
and the v1.3 implementation plan. Stop at the Phase 1 human checkpoint.

The user authorized a private Render Free + Supabase Free pilot after Phase 1.
Keep the existing episode and its learning contracts; do not advance into Phase 2.
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
