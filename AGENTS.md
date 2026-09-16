# vibeLearn — agent instructions

Read `docs/STATE.md` first and work in the active checkout it identifies. Read
`CODEX.md` for the delivery loop and `CODEX-IMPLEMENTATION-PLAN.md` for scope.
Latest user direction supersedes historical plans. Current work is local Level 1;
deploy the latest verified checkpoint when the five-hour allowance reaches 10%
remaining or less. Stop at the user's review checkpoint before Level 2/Phase 2.

## Product and build order

- This is a consumer learning game. Clear story, attachment, atmosphere, readable
  controls and meaningful play are requirements, not polish after implementation.
- Choose chunk boundaries at your discretion around a coherent player experience;
  a chunk may combine story, animation, controls and sound when they belong together.
  Build one playable chunk at a time. The opening is the first and most
  important attention/understanding gate: finish, test and play it before tutorial
  or level expansion. Then verify each encounter before extending the level.
- Follow `CODEX.md`: define observable success, implement, test, play through
  computer/browser use, critique, repair, recheck, record. Do not advance with
  known blocking failures or unobserved required behavior. Tests alone are not done.
- Parallelize only independent work that cannot bypass the active gate, such as
  research or test preparation. Do not build future levels, audio or systems early.
  Add sound/assets needed by the current chunk and verify them within that chunk.
- Keep plans and evidence current and concise. Report uncertainty honestly; never
  promise guaranteed success or equate technical completion with product quality.
  The current user is the sole final human critic; see `docs/CRITIC-POLICY.md`.

## Architecture and safety

- Reuse versioned learning/story/rules/world/runtime specs and shared PlayCanvas
  components; keep story-specific data outside shared controllers. Three.js is
  legacy only. Build reusable assets from current needs, not speculative engines.
  See `docs/GAME-RUNTIME-ARCHITECTURE.md` and `docs/GAME-RULES-SPEC.md`.
- Keep one Python modular monolith and semantic HTML/CSS/JS. Local: SQLite and
  loopback. Hosted: Flask/Gunicorn, PostgreSQL and verified Supabase identity,
  allowlist, HTTPS and scoped/RLS-protected storage. See `docs/HOSTING.md`.
- Learner commands require session, command ID and expected revision. Preserve
  immutable snapshots/checkpoints/assistance/evidence and existing learning IDs.
  Rendering, XP, self-report and game completion do not establish mastery;
  missing evidence is unknown. Keep learning evidence independent of theme/engine.
- Preserve learner data, supplied designs and unrelated work. Test on disposable
  databases. No live-model integration, untrusted runner, paid resources or broad
  rollout. Record migrations, limits and recovery; never fake live verification.
- At integrated gates run `python manage.py build`, `python manage.py test` and
  `python manage.py browser`. Dependencies: `requirements.lock` and
  `requirements-dev.txt`; local preview: `python manage.py serve`.
