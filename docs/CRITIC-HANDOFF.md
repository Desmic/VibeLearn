# Independent GAME critic handoff

This brief is ready; **no independent review has run**. GitHub's Codex bot requires a cloud environment for `Desmic/VibeLearn`. Its earlier PR #2 request referenced the old baseline, so use this current brief when that environment is available.

## Candidate and role

Frozen runtime: `016f5252a9e050a6af53aa42472f62cbcd8e3a99`, branch `game/expedition-nine-gate`, draft PR #2. Read GAME-ACCEPTANCE-9.md, GAME-UX-REVIEW.md and EXPEDITION-VERIFICATION.md. Review read-only as a genuinely separate agent, not the builder and not a source-only code reviewer.

Judge the actual experience as a **game a curious younger non-specialist and an older teen/young adult would voluntarily continue playing**. State audience assumptions. Do not give points merely for educational intent, engineering effort or passing tests. The threshold is >=9.0, but your job is to report your own honest score, not reach it. Preserve the frozen eight weights and all blocking gates. The user is the final reviewer after this gate.

## Safe environment

Use a disposable checkout and database, never production learner data or credentials. Install the pinned requirements and Chromium using the existing project CI setup. `python manage.py build`, `python manage.py test`, and `python manage.py browser` reproduce the gates when PostgreSQL test prerequisites are supplied. For exploration, `python manage.py serve --db <temporary-path> --port 8000` runs the local game. Local loopback identity is not production authentication.

Do not write source, deploy, change Supabase/Auth/allowlists, provision paid resources or recruit external testers. Do not bypass an administrator browser policy; report inability to play rather than certify from source.

## Required playthrough

Use fresh learner state. Inspect the map and first meaningful action. Play the retained-ticket tutorial; deliberately make a duplicate after restarting Pip; recover through the journal and rehearsal rewind. Test a late blind retry and reconciliation. Construct an unsafe retry-forever boss policy before trying a safe one. Experience the bridge ending and the actual missing-request/two-hour detour.

Explore outside the automated happy path. Hide XP. Inspect save/reload/resume, locks, missing-versus-assisted evidence, keyboard, touch, narrow screens, enlarged text and reduced motion. Collect screenshots/video/trace references and concrete action sequences. The test screenshots are useful inputs but not a substitute for experiencing the interaction loop.

Pay particular attention to the open design observations in EXPEDITION-VERIFICATION.md: rule-panel/quiz residue, serialized boss field order, ending pacing, preparation for changed details/unknown register, and whether constrained exploration earns replay.

## Return format

Record exact candidate, your agent identity/configuration and independence, play environment and limitations. Return the eight raw /10 scores and unrounded weighted sum: identity 15%, HUD 15%, core loop 15%, progression 15%, feel 12%, cohesion 10%, integrity 10%, accessibility 8%.

For each audience lens, state compelling moments, boring/confusing moments, likely first quit point, why they would continue without XP, and whether another run is earned. List critical blockers and prioritized concrete fixes with evidence. Use `needs_revision` when the score or any blocking gate fails. Use `ready_for_user_review` only for unrounded >=9.0, both audience lenses passing and no critical blockers.

If you cannot inspect actual rendered interaction, leave the game score null and report `independent_critic_pending`. Do not reuse the historical 8.8/9.1 scores or treat an agent's audience hypothesis as actual youth testing.
