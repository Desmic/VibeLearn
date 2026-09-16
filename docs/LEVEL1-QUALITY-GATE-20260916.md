# Level 1 quality gate — 16 September 2026

Status: **in development / needs review**. This record exists to prevent recurrence of
the sequencing mistake where later game chunks were refined while the actual player
entry still loaded an older game.

Candidate branch: `game/level1-quality-gate`.

## User-requested preview checkpoint

The user explicitly requested a Render preview before the internal Level 1 gate was
finished and said they would not judge the product from that state. The Render-facing
`deploy/render-supabase` branch was therefore fast-forwarded to
`987e4773a231a9172634d8aa58e47f0b0996cb75` and deploy
`dep-dalcfum5vjqs73et1ir0` reached `live`. Treat this as a **preview snapshot only**,
not internal readiness, acceptance, or permission to skip the remaining quality gate.
Development continues on `game/level1-quality-gate`; later commits do not change that
live preview until another explicit deploy.

## Blockers found before this branch

- `/` and hosted login still belonged to Relay Rescue/Echo Forge.
- successful login entered the old campaign shell instead of the current Level 1.
- the root loaded the retired DOM/SVG Rescue stack and PlayCanvas migration, allowing the
  old illustrated world to exist underneath the 3D migration path.
- `/word-machine` remained an active player route despite being a superseded prototype.
- CI spent active matrix time on historical opening/journey/Word Machine browser suites
  rather than treating entry + First Words as the ordered product gate.
- First Words' first rescue forced the wrong-output path before Moon inspection instead
  of permitting a meaningful inspect-first choice.
- the transfer notice literally named the Star answer.
- completion opened a text dialog automatically over the 3D payoff.

## Repairs completed or under exact-head regression

- Bellweather PlayCanvas entry/login shell at `/`; authenticated players route directly
  to `/first-words`.
- active server allowlist exposes only Bellweather/First Words and shared PlayCanvas
  runtime assets. Historical source remains in Git but is not a player fallback.
- `/word-machine` redirects to `/first-words`.
- explicit browser assertion: if PlayCanvas/required assets fail, show retry/error and
  never reveal SVG/Relay Rescue/2D gameplay.
- active CI order reduced to entry/foundation then full First Words Level 1.
- first rescue permits generate-first mistake or inspect-first success.
- transfer current clue maps a five-point lantern mark to an environmental mark on the
  exit gate instead of copying the Star answer from prose; accessible descriptions must
  preserve the same information boundary.
- world completion remains visible; optional epilogue opens only on player action.
- historical drafts are preserved but no longer block or skip First Words; Supabase and
  SQLite now enforce at most one draft per learner **per mission**.
- enlarged text is constrained so the objective/engine HUD cannot consume the whole
  phone viewport.
- the Bellweather score is being upgraded from a short oscillator loop to original
  procedural `bellweather-score-v2`: plucked motif, restrained hand percussion,
  wind/workshop ambience, danger thinning, reunion resolution, and distinct semantic
  effects. Technical lifecycle checks do not substitute for actual listening review.

## Gate still required

Run the branch through build, full application tests and active browser suites. Inspect
new screenshots/traces and repair any regression. Then play the whole experience from
`/` through completion and score every required `CRITIC-POLICY.md` criterion on the
exact frozen candidate. Any criterion below 9 or any blocker means `needs_revision`.
Sound-on/muted appeal still requires actual listening; automation can only prove audio
lifecycle and state behavior. Do not present the level as complete to the user until the
internal gate is satisfied.