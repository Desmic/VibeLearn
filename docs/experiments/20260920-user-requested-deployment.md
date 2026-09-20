# Explicit checkpoint deployment

20 September 2026. User instruction: "commit, push and deploy this version, then
continue". Requested runtime candidate:
`74455fd7f22d6a423eb93b070bd2c9a37d0953d7`.

This is a user-directed private review deployment of the current version with
known incomplete quality findings. It is not acceptance, Level 2 authorization,
or a claim that the normal reviewed-preview promotion workflow passed. That
workflow's override only admits incomplete, unblocked reviews; this candidate
still needs art/world revisions. The latest explicit deployment instruction
supersedes the earlier user-authored no-promotion checkpoint for this deployment
only. Existing promotion validators and future gates remain unchanged.

Target: existing Render service `srv-daf7dhuq1p3s73c122cg`, Kumar's workspace
`tea-daf75lad0e5s73b4cgvg`, `https://vibelearn-4xws.onrender.com`.
Fast-forward `deploy/render-supabase` to the exact requested commit; retain
auto-deploy off, free service, current build/start settings and existing identity
and database configuration. No schema migration or learner-data reset is required.
Prior deployed revision: `ad14c5aced6cf053c7617dfb03245506e1e9dad5`.

Local build, 369 application tests (seven skips), final opening browser regression
and scoped native recheck are recorded in the opening-composition experiment.
The prior checkpoint's GitHub run `35526982152` failed its physicality walk setup
and direct execution of the critic-assignment builder (package import error).
Exact-candidate run `35527895137` failed the same two jobs.
Do not describe CI or full readiness as passed without its completed results.

Deployment results and public smoke checks follow below. Continued work retains
all native-review findings and investigates the CI failures. Motion/audio remain deferred; broader release acceptance remains open.

## Deployment verification

Render deployment `dep-dao21bn40ujc73djt40g` became live at
2026-09-20T18:07:35Z on the exact requested SHA. Public `/api/health` returned 200
and status `ok`; `/` returned 200. The served first-words-world, tutorial-flow,
experience-mode, world-marker-layout and player-controls JavaScript bytes match
the Git commit blobs exactly (local Windows CRLF bytes differ). PlayCanvas and
both character GLBs returned 200. Render returned no error-level logs in the
post-trigger window through 18:11:59Z. Its configured health-check path is empty;
this verification used an explicit HTTP probe, not a claim that it is configured.

Native browser inspection showed the rendered 3D Bellweather account entry,
characters, lanterns and sign-in controls. No account credentials were supplied,
so authenticated hosted gameplay was not replayed. No learner data was reset.

## Continued system repair

Both CI workflows now execute package tools with `python -m tools.<name>`.
The regression check executes the actual workflow entrypoints with PYTHONPATH
removed, so an ambient development path cannot conceal the import failure.
The release-workflow assertions retain the same gates with updated invocation.

The physicality test passed locally, including contact, opened/closed traversal
and continuous camera evidence. CI failed twice near z=-35 while trying to walk
back to z=-31; local success does not establish a CI fix. Keep this failure open
and investigate captured geometry/input state before changing movement code or
relaxing the assertion. Runtime remains pinned to the user's requested checkpoint;
these subsequent CI/documentation changes are development work on main.

Validation of continued repair: 41 focused critic/release/entrypoint tests passed;
full application suite passed 370 tests with seven skips; build passed. Local logs:
artifacts/readiness-20260920/ci-entrypoint-repair-tests.log and
artifacts/readiness-20260920/deployed-followup-build.log. Remote verification of the
subsequent commit remains pending; the original deployed candidate's CI is failed.
