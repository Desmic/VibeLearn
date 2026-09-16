# Current state — rescue-story revision after user review

## Deployment checkpoint — 16 September 2026

The usage trigger reached 6% remaining. Freeze this working candidate for the
user-authorized private review deployment. Opening and rescue focused browser
checks passed, 153 application tests ran with six PostgreSQL skips, and the full
level was manually completed/reloaded. Enlarged-text probes pass at 360/390/430.
The full-level automated run reached completion but timed out in the final
missing-asset probe; both asset probes passed independently afterward. The full
14-module regression run is still in progress in
`artifacts/first-words-integrated-browser.log`. Do not claim it passed. This is a
requested review preview, not internal readiness or user acceptance. Audio mix,
physical devices and novice engagement remain unverified. No schema migration.
Rollback: prior live commit `337db573d87c417aca42f55894a2c6e807df21ed`.

## Earlier active checkpoint — 16 September 2026

Latest steering: **continue locally, then deploy the latest verified checkpoint
when the Codex five-hour allowance has 10% or less remaining**. A five-minute
thread heartbeat `deploy-vibelearn-at-low-allowance` checks this condition; do not
repeat a completed deployment. After the usage reset, 86% remained. Render access is now connected and the
existing Free service was rechecked with auto-deploy off. Existing service/auth/data must
be preserved. This supersedes the earlier blanket deployment pause.
`AGENTS.md` and `CODEX.md` now enforce one playable chunk at a time, immediate
automated checks and hands-on browser play, repairs before expansion, and the
opening as the first attention/understanding gate. No further audio/features for
future chunks. The user remains the sole final human critic.

Active checkout: `E:/Projects/VibeLearn/artifacts/critic-evidence-reset`, branch
`codex/critic-evidence-reset`. Current rescue changes are uncommitted; preview is
http://127.0.0.1:8002/first-words. The dedicated opening checkpoint passed as
recorded below. The saved full-level browser report also reports passing paths
(wrong choice, repair, replay, reload, completion); this is regression evidence,
not permission to skip chunk-by-chunk product review. The rescue chunk passed its focused checks and manual play. The tower challenge
and ending have now been manually completed, including mistake/recovery and
reload. Final marker/readability and integrated checks are in progress; see
[FIRST-WORDS-CHUNK-REVIEW.md](FIRST-WORDS-CHUNK-REVIEW.md). Render remains unchanged.

The earlier entries below are historical; their deployment instructions and
design-only implementation descriptions are superseded by this checkpoint.

## Latest user direction — 15 September 2026

**16 September execution correction:** the user authorized completing Level 1 and deploying for their review, then reiterated **opening completed and tested first, entire Level 1 second**. Rescue/level code is in progress, not verified complete. Freeze level extension/deployment until the dedicated opening gate is finished; see [FIRST-WORDS-BUILD.md](FIRST-WORDS-BUILD.md). Earlier design-only/no-deploy status below describes the prior checkpoint and is superseded for this authorized bounded build.

**Opening checkpoint completed:** [FIRST-WORDS-OPENING-VERIFICATION.md](FIRST-WORDS-OPENING-VERIFICATION.md) records the repaired sequence, passing dedicated browser gate and hands-on replay check. Full Level 1 verification resumes next; deployment remains pending that work. This is technical/observed evidence, not human acceptance.

**Story follow-up:** after reading the rescue synopsis, the user responded “yes much better now” and asked about progression. Record this as positive feedback on the story direction only. The revised game remains unimplemented and the workshop prototype remains needs_revision; no numeric score or playable-game acceptance was supplied.

The user reviewed the local Word Machine prototype: technically impressive and improved interface, but the story is weak and needs revision. They proposed an evil robot capturing our robot friend, repairing the friend's speech engine to open doors, gradually rescuing friends while learning how LLMs work. They additionally requested a beautiful, captivating atmosphere, pop-culture references, music/sounds, and updated docs. This is qualitative feedback, not acceptance or a numeric rating.

The next story is **Bring Back the Words**, documented in [LLM-RESCUE-STORY.md](LLM-RESCUE-STORY.md). [STORY-INSPIRATION-20260915.md](STORY-INSPIRATION-20260915.md) records source research and premise selection; [WORLD-ATMOSPHERE-AND-AUDIO.md](WORLD-ATMOSPHERE-AND-AUDIO.md) defines art, sound, humor, reuse and review requirements. This increment updates design and policy only. The rescue scene, richer world and audio are not yet implemented; the preview still shows the workshop prototype. No new playtest or quality score is claimed.

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

[REUSABLE-ASSETS.md](REUSABLE-ASSETS.md) identifies exactly which existing framework pieces were used and which procedural assets/adapter were added. [LLM-EPISODE-1-VERIFICATION.md](LLM-EPISODE-1-VERIFICATION.md) records checks, repairs and recovery. The integrated application suite passed 147 tests with six PostgreSQL skips; **all 11 browser modules passed**, with the final affected suite rerun on commit `31025192a4c01dee04fcd621c1e4a52887b4efcb`. The internal critique remains **needs_revision**, minima 5 / 7 / 6 / 5; see [LLM-EPISODE-1-PLAYTEST.md](LLM-EPISODE-1-PLAYTEST.md). No GitHub push or production deployment occurred.

## Human checkpoint

Review the bounded Episode 1 prototype under the new critic policy before extending the series. Use new versioned learning/content identities for AI concepts; never relabel existing retry evidence. Preserve the retry episode/history. Reuse the runtime and semantic server-authoritative boundaries; no live model integration or general generator is needed for the toy lesson.

Keep Phase 1 scope, Supabase auth/RLS/allowlists, immutable evidence, explicit assistance and XP/mastery separation. The series outline does not open Phase 2. Historical state is in [history/20260914-STATE.md](history/20260914-STATE.md). Verification of the policy checker is recorded in CRITIC-RESET-VERIFICATION.md.

Local preview entry: http://127.0.0.1:8001/word-machine (app must be running). Code commits are local only. Review evidence/docs after the code freeze remain in this worktree. The user's latest verdict is needs_revision as recorded above; preserve their preview progress.
