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

## Latest user correction

The preview exposed two product regressions that must be treated as Level-1 blockers:

- **game lifecycle regressed:** logout and game reset disappeared from the Bellweather
  game UI even though hosted backend endpoints still existed;
- **the game is too convoluted:** a first-time player is being asked to understand too
  many choices/quiz steps before they have learned how to play or enjoyed a success.

The binding direction is the existing progression contract: **easy to play, hard to
master**. The tutorial shows the player exactly how the loop works, lets them succeed,
then fades scaffolding. Difficulty across this and future How-LLMs-Work episodes comes
from deeper concepts, competing context, transfer and reduced help—not extra UI friction.
See `GAME-OPENING-PROGRESSION.md`, `COURSE-GENERATION-GAME-SYSTEM.md` and
`FIRST-WORDS-BUILD.md`.

## Blockers found before this branch

- `/` and hosted login still belonged to Relay Rescue/Echo Forge.
- successful login entered the old campaign shell instead of the current Level 1.
- the root loaded the retired DOM/SVG Rescue stack and PlayCanvas migration, allowing the
  old illustrated world to exist underneath the 3D migration path.
- `/word-machine` remained an active player route despite being a superseded prototype.
- CI spent active matrix time on historical opening/journey/Word Machine browser suites
  rather than treating entry + First Words as the ordered product gate.
- First Words initially front-loaded a plausible failure before the learner had a clean
  success and then stacked a second input-growth prediction onto the tower challenge.
- the transfer notice literally named the Star answer.
- completion opened a text dialog automatically over the 3D payoff.
- reset/logout existed server-side but were missing from the active game menu.

## Repairs completed or under exact-head regression

- Bellweather PlayCanvas entry/login shell at `/`; authenticated players route directly
  to `/first-words`.
- active server allowlist exposes only Bellweather/First Words and shared PlayCanvas
  runtime assets. Historical source remains in Git but is not a player fallback.
- `/word-machine` redirects to `/first-words`.
- explicit browser assertion: if PlayCanvas/required assets fail, show retry/error and
  never reveal SVG/Relay Rescue/2D gameplay.
- active CI is split into entry/foundation, opening, controls, chapter, readability and
  hosted lifecycle gates so a regression is localized quickly.
- the first rescue is now a three-step tutorial: power -> scan the obvious Moon clue ->
  generate word by word. New runs cannot intentionally fail before freeing Zip.
- the former required `Predict the next input` quiz is removed from new runs. The growing
  input is shown through the word-by-word mechanic. Legacy saved drafts remain resumable.
- the first normal wrong route now appears only after the player has succeeded and moved
  into the changed-context tower challenge.
- transfer current clue maps a five-point lantern mark to an environmental mark on the
  exit gate instead of copying the Star answer from prose; accessible descriptions must
  preserve the same information boundary.
- world completion remains visible; optional epilogue opens only on player action.
- historical drafts are preserved but no longer block or skip First Words; Supabase and
  SQLite enforce at most one draft per learner **per mission**.
- **Reset game progress** and **Sign out** are restored to the active game menu. Reset is
  explicitly confirmed and returns the learner to the Level-1 opening; sign out revokes
  the hosted session and returns to account entry. A dedicated hosted browser gate now
  protects both behaviors.
- phone HUD is being compressed into a small objective card plus bottom engine console;
  200% text must preserve a large usable world band rather than merely avoid overflow.
- the Bellweather score is upgraded toward original procedural `bellweather-score-v2`:
  plucked motif, restrained hand percussion, wind/workshop ambience, danger thinning,
  reunion resolution, and distinct semantic effects. Technical lifecycle checks do not
  substitute for actual listening review.

## Gate still required

Run the current exact head through build, full application tests and every active browser
suite. Inspect new screenshots/traces and repair any regression. In particular verify
that the simplified tutorial is immediately understandable, the first rescue feels like
a win rather than a test, reset/logout work on hosted auth, and the compact phone HUD is
actually readable at normal and enlarged text.

Then play the whole experience from `/` through completion and score every required
`CRITIC-POLICY.md` criterion on the exact frozen candidate. Any criterion below 9 or any
blocker means `needs_revision`. Sound-on/muted appeal still requires actual listening;
automation can only prove audio lifecycle and state behavior. Do not present the level
as complete to the user until the internal gate is satisfied.
