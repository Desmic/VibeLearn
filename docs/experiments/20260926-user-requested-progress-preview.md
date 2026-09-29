# User-requested progress preview attempt

26 September 2026. The user requested the current bounded interaction repair be
published through GitHub and Render for assessment. This is an **unreviewed
progress preview** request, not design alignment, critic readiness, product
acceptance, Level 2 authorization, or a general change to release policy.

The exact runtime snapshot is `bcf6c4f` on `docs-readthrough-20260921`.
That branch was pushed to GitHub. The existing Render service is
`srv-daf7dhuq1p3s73c122cg` in Kumar's workspace
`tea-daf75lad0e5s73b4cgvg`, at `https://vibelearn-4xws.onrender.com`.
Read-only service inspection found auto-deploy off, the source branch
`deploy/render-supabase`, the existing free plan and unchanged build/start
settings. The remote deployment branch was still at `74455fd7`; it was an
ancestor of the snapshot.

The separate fast-forward push to `deploy/render-supabase` was rejected by
automatic approval review as unacceptable risk. The stated reason was that the
trusted project instructions prohibit deployment promotion before existing
review gates are satisfied, even though the user requested a Render progress
deployment. The review explicitly prohibited bypass through a workaround or
indirect execution. No Render deploy was triggered; the current hosted version
was not changed by this attempt. The earlier user-directed private deployment
precedent is `20260920-user-requested-deployment.md`, but it did not override
this automatic rejection.

The user then explicitly answered "ok, continue" to the question authorizing
an update of `deploy/render-supabase` and deployment of this checkpoint for
progress assessment despite the incomplete gates. A retry of the **same exact
fast-forward push** was rejected again by automatic approval review. It said
the user's OK was visible to the delegated implementation task only through an
assistant/tool handoff, not as a direct user message in that task's trusted
context. It again prohibited any workaround or indirect execution. The retry
stopped there; no branch update or Render trigger occurred. Read-only checks
before that retry confirmed remote deployment tip `74455fd7`, development tip
`bcf6c4f`, an ancestor-only fast-forward, and unchanged Render service settings.

The root task, where the user's direct authorization was visible, then submitted
the identical fast-forward push for automatic approval. It was approved and
GitHub `deploy/render-supabase` advanced from `74455fd7` to exact snapshot
`bcf6c4fa928f6b157fe5f04123196954a99c97ff`. A read-only recheck confirmed
that branch tip and that the Render service still had auto-deploy off with its
prior configuration. The delegated task then called Render's explicit deploy
tool for service `srv-daf7dhuq1p3s73c122cg`; automatic approval review rejected
that trigger because the snapshot remains unreviewed under the trusted project
gate, again prohibiting a workaround. At this checkpoint no new Render deploy
has started: its latest live deploy remains `dep-dao21bn40ujc73djt40g` at
`74455fd7`. The root task retried the identical Render trigger with the user's
direct approval visible. Automatic approval review also rejected that call,
explicitly saying the standing project instructions prohibit deployment
promotion before the required gates despite the user's approval. All Render
attempts stopped. The GitHub deployment branch points to `bcf6c4f`, while the
hosted service continues serving its prior live `74455fd7` deployment.

Local verification for `bcf6c4f`: `python manage.py build` passed; `python
manage.py test` passed 441 tests with seven PostgreSQL skips; the Level 1 browser
module passed before the phone handoff correction, and a post-correction run
passed the source/recovery path but timed out waiting for a later relay response
in an extra transfer trial. Diagnostic 390x844 live play inspected one sign,
staged it, changed to another before commitment, inserted that sign, changed
camera, and reloaded the committed source. Focused presentation checks passed
10 desktop-prefix and five phone states with no violations, including 200% text.
Trace and captures are under `artifacts/repair-source-play` and
`artifacts/repair-source-recheck`; focused reports are
`artifacts/repair-source-budget-result.json` and
`artifacts/repair-source-phone-budget-result.json`.

The independent fresh-context Astra review, complete presentation report,
runtime alignment and user acceptance remain open. The supported reviewed
promotion path is `.github/workflows/promote-preview.yml` after exact-candidate
technical and critic evidence. A separate unreviewed deployment requires the
deployment block to be resolved explicitly; no alternate path was used.

After the Render rejection, the prior ambient server on loopback port 8046 was
no longer listening. A disposable local preview was started at
`http://127.0.0.1:8046/first-words` with SQLite at
`artifacts/progress-preview-bcf6c4f.sqlite3`. The route and `/api/health`
returned HTTP 200. The served `first-words.html`, `first-words.js`, and
`first-words-world.js` match Git snapshot
`bcf6c4fa928f6b157fe5f04123196954a99c97ff` after normalizing Windows
line endings. This confirms those served source files, not a full replay of
the experience or the independent review. The loopback URL is available only
while this local server process runs and cannot be accessed as a public Render
preview. Existing learner data was not used.
