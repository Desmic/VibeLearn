# Level 1 quality gate — 16 September 2026

Status: **in development / needs review**. This record exists to prevent recurrence of
the sequencing mistake where later game chunks were refined while the actual player
entry still loaded an older game.

Candidate branch: `game/level1-quality-gate`, based on deployed `bdff961`.

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

## Repairs in progress

- Bellweather PlayCanvas entry/login shell at `/`; authenticated players route directly
  to `/first-words`.
- active server allowlist exposes only Bellweather/First Words and shared PlayCanvas
  runtime assets. Historical source remains in Git but is not a player fallback.
- `/word-machine` redirects to `/first-words`.
- explicit browser assertion: if PlayCanvas/required assets fail, show retry/error and
  never reveal SVG/Relay Rescue/2D gameplay.
- active CI order reduced to entry/foundation then full First Words Level 1.
- first rescue permits generate-first mistake or inspect-first success.
- transfer current clue requires mapping a five-point lantern mark to the world Star
  marker instead of copying the answer from prose.
- world completion remains visible; optional epilogue opens only on player action.

## Gate still required

Run the branch through build, full application tests and active browser suites. Inspect
new screenshots/traces and repair any regression. Then play the whole experience from
`/` through completion and score every required `CRITIC-POLICY.md` criterion on the
exact frozen candidate. Any criterion below 9 or any blocker means `needs_revision`.
Do not present the level as complete to the user until the internal gate is satisfied.
