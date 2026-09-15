# Current state — local LLM episode prototype and stricter review

**Updated 15 September 2026. User verdict: changes requested / needs_revision.** The user reports an unclear opening/world, confusing HUD/markers and intrusive text. They ask for stricter critics and an appealing ongoing series teaching how LLMs work. The current user is the sole human product critic and final authority. No new numeric user score or acceptance was given.

## Verified baseline

Render's latest observed live deployment is `337db573d87c417aca42f55894a2c6e807df21ed`, service `srv-daf7dhuq1p3s73c122cg`, deploy `dep-dajucbvqj5pc73f4ftig`. GitHub PR #8 has that exact head; auto-deploy remains off. Source hashes match the local export after Windows newline normalization; repair-ZIP members match. Supabase project is healthy; no production data/config was changed.

The exact baseline runs locally at http://127.0.0.1:8000/ using a disposable SQLite review database. The hands-on review completed all seven signals. `manage.py build` passed with PYTHONUTF8=1; baseline tests ran 130 (124 passed, 6 local PostgreSQL skips); all ten automated browser modules subsequently passed. These checks did not catch the manually reproduced disabled camera/movement buttons after saved inspection. Hosted sign-in and local live PostgreSQL were not retested.

## Current work and authority

- [CRITIC-POLICY.md](CRITIC-POLICY.md) replaces weighted/optimistic ratings and the ambiguous review-deployment exception. Review actual play; use anchored integers and hard blockers; missing evidence stays unknown. No tool can accept the game for the user.
- [PLAYTEST-20260915.md](PLAYTEST-20260915.md) preserves exact actions, failures, screenshots and limits. The machine-readable criterion record is in docs/reviews/.
- [NEXT-TEACHING-DESIGN.md](NEXT-TEACHING-DESIGN.md) selects an ongoing **How LLMs Work** series. The first episode teaches context-conditioned next-token generation through a small inspectable language machine. Episode 1 is now a local playable prototype; the remaining seven episodes are planned. It has no user acceptance or internal 9+ recommendation.
- Work is isolated on `codex/critic-evidence-reset`, based on the deployed SHA. The original checkout and learner data remain intact. No changes were pushed or deployed.

## Local implementation — 15 September 2026

The user's “let’s go” authorized implementation after repository research. Six public repositories were inspected before building; see [REUSE-RESEARCH-20260915.md](REUSE-RESEARCH-20260915.md).

`/word-machine` now presents a shared-controller 3D arrival/wake scene, generated message pieces, wrong delivery, context repair, a second changed-context delivery, optional scores, replay, pause and saved completion. The new AI content has distinct identities; the existing retry episode and evidence remain. The toy uses authored whole-word scores, not a trained LLM. Guided completion leaves mastery unknown.

[REUSABLE-ASSETS.md](REUSABLE-ASSETS.md) identifies exactly which existing framework pieces were used and which procedural assets/adapter were added. [LLM-EPISODE-1-VERIFICATION.md](LLM-EPISODE-1-VERIFICATION.md) records checks, repairs and recovery. The integrated application suite passed 147 tests with six PostgreSQL skips; final browser results and play critique are recorded in that verification report and the episode playtest report. No GitHub push or production deployment occurred.

## Human checkpoint

Review the bounded Episode 1 prototype under the new critic policy before extending the series. Use new versioned learning/content identities for AI concepts; never relabel existing retry evidence. Preserve the retry episode/history. Reuse the runtime and semantic server-authoritative boundaries; no live model integration or general generator is needed for the toy lesson.

Keep Phase 1 scope, Supabase auth/RLS/allowlists, immutable evidence, explicit assistance and XP/mastery separation. The series outline does not open Phase 2. Historical state is in [history/20260914-STATE.md](history/20260914-STATE.md). Verification of the policy checker is recorded in CRITIC-RESET-VERIFICATION.md.
