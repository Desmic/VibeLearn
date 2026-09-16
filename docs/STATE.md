# Active worktree notice — 16 September 2026

**Current instruction:** continue locally; deploy the latest verified checkpoint
to the existing private Render service when the five-hour allowance reaches <=10%
remaining. See the active worktree state for the conditional deployment monitor. Work in
`E:/Projects/VibeLearn/artifacts/critic-evidence-reset` and read its `docs/STATE.md`.
The rescue opening and Level 1 now exist as uncommitted working code at
http://127.0.0.1:8002/first-words. The opening's dedicated verification passed;
manual review continues one chunk at a time, currently Moon repair/Zip reunion.
`AGENTS.md` and `CODEX.md` define the required build -> test -> play -> repair loop.
Finish Level 1 locally, then stop for the sole current user's review. The entries
below describe older checkpoints and do not authorize deployment or skipping gates.

**Latest user feedback:** the Word Machine interface improved but its story needs revision. The user requests a robot-friend rescue, progressively restored speech/LLM abilities, a beautiful captivating world, cultural references and music/sounds. Active worktree docs now include [the rescue treatment](../artifacts/critic-evidence-reset/docs/LLM-RESCUE-STORY.md), [atmosphere/audio brief](../artifacts/critic-evidence-reset/docs/WORLD-ATMOSPHERE-AND-AUDIO.md) and [story research](../artifacts/critic-evidence-reset/docs/STORY-INSPIRATION-20260915.md). This update is design/policy only; the preview still shows the workshop prototype and remains needs_revision.

The current user authorized a How LLMs Work series and asked to use the reusable framework after GitHub research. The active implementation is in **E:/Projects/VibeLearn/artifacts/critic-evidence-reset**, branch `codex/critic-evidence-reset`, final application commit `31025192a4c01dee04fcd621c1e4a52887b4efcb`. Read that worktree's `docs/STATE.md`, `docs/LLM-EPISODE-1-PLAYTEST.md`, `docs/LLM-EPISODE-1-VERIFICATION.md` and `docs/REUSABLE-ASSETS.md` before continuing. This original checkout is intentionally preserved.

Episode 1 is a local playable prototype at http://127.0.0.1:8001/word-machine while its loopback preview server runs. Build passed; 147 tests ran with six PostgreSQL skips; all 11 browser modules passed. The strict internal review says **needs_revision**, not accepted. The current user is the sole human critic and final authority. Stop at the Phase 1 human checkpoint; episodes 2–8 are planned, with no live model integration or Phase 2 work.

Live Render remains the previously verified `337db573d87c417aca42f55894a2c6e807df21ed`; the new code has not been pushed or deployed. Existing retry evidence and learner data were preserved. The older checkpoint below is historical.

---

# Current checkpoint — private hosted pilot preparation

The user selected Render Free + Supabase Free and authorized use of the existing
Supabase project. The `deploy/render-supabase` branch adds a PostgreSQL storage
boundary, private schema/RLS, Supabase sign-in, and a Render Free configuration.
See `HOSTING.md` for observed checks, blockers, account setup, and recovery.
Supabase schema migration `20260907073952_vibelearn_hosted_schema` is applied.
No Render deployment, live hosted sign-in, or user acceptance is claimed yet.

## Earlier local Phase 1 checkpoint

Phase 0, 1A, 1B and 1C are implemented and verified. Stop here for real user feedback.
The running app is local-only at http://127.0.0.1:8000 while its server stays alive.
Version 0.1.0; schema 5. Source digest: 77628637b100124f206bf8b8fe543041f37944f26306e7e44a5c6af36e99b430.

Read `PHASE-1.md` for observed gate evidence, limits and recovery. `README.md` has
exact run/build/test commands. Current result: 31 unit/integration tests and 10 real
browser scenarios pass; no page errors. Tests use disposable data. Real user feedback
and independent human content review remain pending. No public activation occurred.

This is a Python modular monolith with SQLite and a real HTML/CSS/JS workspace.
No external model or app-integrated retriever/runner is operational. Hints are prepared
static aids. Assessment checks three trace predictions only; written reasoning stays
ungraded. Evidence is partial/provisional and XP never feeds mastery. Future review
needs target frames, with fresh review content explicitly unavailable in this slice.

Single next increment: revise this same episode in response to the user's trial
(challenge, feedback, workspace, restrained game elements). Do not start Phase 2
or generate more content before that checkpoint. Full replacement/export/restore
and hosted identity are deferred according to the v1.3 build order.

Git follow-up: initialized the local repository on `main` at the user's request.
No commits or remotes yet; source files remain unstaged. Existing ignore rules
exclude learner databases, generated artifacts, caches and local environment files.

Branding follow-up: renamed the product to `vibeLearn` at the user's request,
including the wordmark, tab title, footer, startup output and current documentation.
Build, all 31 unit/integration tests and all 10 browser scenarios passed again.
No schema or learner-data changes. The Phase 1 report/archive retain their original
checkpoint identity; the current build/served manifests identify the renamed build.
