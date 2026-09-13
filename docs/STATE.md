# Current state — user-rejected; 3D opening/progression revision

Updated 13 September 2026 (14 September IST). **Product status: `user_rejected` / `needs_revision`.** The user reviewed the deployed experience and rejected its world/story onboarding, HUD/game feel and progression. No new numeric rating was supplied. Historical critic scores and green CI do not override this verdict.

## Authoritative next work

Read GAME-OPENING-PROGRESSION.md, the root implementation plan, CURRENT-STORY-CANDIDATE.md and the active story/UX/acceptance contracts. Update docs first; then build the confirmed first-entry skippable 3D opening, tutorial/early success, gradual progression and optional replay. Level 2+ resumes without an automatic opening. Remove the 2D gameplay fallback; preserve accessible HUD and honest engine recovery.

The current review candidate must include the newly confirmed opening/progression/foundation requirements. The user still owns the next product review; see the review-checkpoint clarification below.

## Verified source and deployment

Development: `phase1/world-transfer` / PR #8. Last deployed source: `16a655e9c5f426a488cae9af0c17f062bae43dbd`.

CI run `34783724257` passed 129 unit/PostgreSQL/static tests and the complete browser journey. Exact Signal 7 desktop/390px before/after screenshots were inspected. The help selector overlap, stuck disabled state and HUD clipping were fixed; the 15-second Signal 6→7 transition verification stabilization was retained.

Render service `vibelearn` (`srv-daf7dhuq1p3s73c122cg`, workspace `tea-daf75lad0e5s73b4cgvg`) serves `deploy/render-supabase`, auto-deploy OFF. Manual deployment `dep-dajhlre7bikc73c4c40g` is live on the SHA above at https://vibelearn-4xws.onrender.com.

The first deployment omitted `python manage.py vendor`, causing PlayCanvas 404 and a silent 2D fallback. The user saved the corrected build command; the second deployment verified engine and both GLB URLs at HTTP 200 with matching verified bytes. Asset delivery success did not establish the intended game experience.

## Why another revision is required

Active docs contained stale 2D/Three.js choices despite the strategic PlayCanvas decision. First-touch tests used fresh local contexts and did not establish the real learner's authenticated/resumed entry. The intro used a browser-wide seen flag, and explicit replay could launch a mission. Missing renderer assets were allowed to become a playable old 2D game. Technical availability was reported too broadly as readiness.

## Current verification and limits

Documentation reconciliation was committed first at `2bfb776767916ce5f8aad0b896653e7e62b9282e`. Story-v3 passed the separate story-only review at 9.059; this is not a rendered or user pass.

The implementation checkpoint adds a reusable, spec-driven opening controller, separate Echo Forge content, a versioned world package, isolated replay runtime, saved-attempt entry/resume decisions, a world HUD for the first tutorial/success, and explicit 3D recovery in place of SVG gameplay. A materially different Seed Garden opening uses the same controller/backend without copied engine code. Context loss blocks actions; restoration reapplies completed opening actions. Late map mounting cannot steal the opening canvas.

Local opening/replay/hosted-login and recovery checks have passed during iteration. Full exact-candidate CI/PostgreSQL/browser verification is pending. Independent first-touch review progressed from 7.974 to 8.528/10 after bounded framing, marker and home-path repairs. The `203c72d` frames had no identified concrete first-touch blocker; this is not a full acceptance score. The later lifecycle patch fixes a fast reload/replay race found by the existing return-to-game assertion. Whole-game rendered and learning reviews remain outstanding. No new deployment or user acceptance is claimed. Preserve Supabase auth/RLS, authoritative progression, immutable evidence and assistance semantics. Phase 2 remains closed.

Earlier technical history is preserved in history/STATE-before-opening-review-20260913.md; its current-state labels and preview instructions are historical only.

## Foundation: games generated from learning needs and preferences

User reaffirmed the ultimate product goal on 13 September 2026: generate games on demand from what a user needs to learn and their explicit preferences. Echo Forge is the reference, not the framework. LearningSpec, explicit UserPreference/StoryPreference inputs, StoryWorldSpec, GameDesignSpec, GameRulesSpec, WorldSpec, RuntimeExperienceSpec and versioned AssetRefs must compose through shared validators/runtime. Canonical learning and evidence cannot depend on theme, assets or engine. Preferences may influence setting, tone, presentation, pace and interaction style without weakening outcomes or assessment. Never infer unstated preferences.

Implement the opening/tutorial/HUD/progression as reusable, spec-driven capabilities and assets; keep Echo Forge dialogue, beats, cameras and object IDs in the reference package. New games must not require copied opening controllers or new renderer lifecycles. Prove a materially different fixture through shared components. This foundations work does not claim that an on-demand generator/model integration is already implemented or authorize unrelated Phase 2 work.


## Current user review checkpoint

The user's execution instruction remains: fix clear blockers, verify the complete exact candidate and its rendered desktop/phone evidence, deploy the verified candidate manually, then let the user review it. Do not start another broad art/architecture pass merely to raise an internal score before that review. The later opening/progression/foundation feedback changes what this candidate must contain; it does not turn CI or a critic score into user acceptance.

For this expressly authorized review checkpoint, the exact candidate must be technically green, visually reviewable, and free of identified concrete interaction/causal blockers. Report internal critic scores honestly as diagnostics. The >=9 story/first-touch/whole-game/learning gates remain the full product acceptance target; they must not be claimed passed or used to imply Phase 2 authorization. A deployed review candidate is not an accepted product. This clarification supersedes statements that revoked the user's bounded review instruction solely because the opening requirements changed.


### Verification record location

This source checkpoint records what was known before its exact CI/deployment finished. The current run, exact deployed SHA and rendered evidence are recorded on [PR #8](https://github.com/Desmic/VibeLearn/pull/8); consult that record before claiming this source is live. Product status remains awaiting user review, not accepted. A green run alone does not change that status.
