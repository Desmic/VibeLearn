# vibeLearn

Read `docs/STATE.md`, then **`docs/COMMERCIAL-GAME-BAR.md`** and
`docs/GAME-AS-COURSE.md`. The product is a game whose meaningful play delivers the
intended course outcomes, not a course website with game decoration. Experience is
essential.

## Product authority

The user is currently the only real product user/reviewer. **Their latest explicit
judgment overrides every agent, critic, automated score and historical review for
product acceptance.** Never average the user's score with a critic score, use a higher
critic score to overrule a rejection, or call a candidate accepted because tests pass.

The critic gate remains useful but is only a pre-gate:

- unrounded <9.0/10 or any critical blocker => `needs_revision`;
- >=9.0 with both audience lenses passing and no blocker => at most
  `ready_for_user_review`;
- explicit user rejection => `user_rejected` / `needs_revision` regardless of critic;
- only explicit user acceptance => `user_accepted`.

No silence, lack of response, deployment, screenshot, test pass or historical review
counts as acceptance. Do not open the experience to other users until the current user
explicitly accepts it and separately authorizes broader testing.

The user temporarily authorized available-tool/internal review while a genuinely
separate critic agent is unavailable. Use actual rendered journeys, screenshots/traces,
adverse-path tests and the frozen rubric; label that reviewer `internal_tool_assisted`,
never an independent agent or human playtest. This exception changes reviewer method,
not the >=9 standard or user authority.

## Commercial game bar

The learner-facing experience must feel like **a real game someone could credibly
expect from the Play Store or Steam**, not a gamified website, dashboard, card stack,
course page or quiz. This is a bar for onboarding, interaction, pacing, feedback,
cohesion and polish; it does not require AAA scope, combat, free-roaming 3D or one
genre.

Read `docs/COMMERCIAL-GAME-BAR.md` before substantial product work. A renderer,
animated background, campaign map, XP or badges cannot by themselves satisfy the bar.
The primary surface should be playfield-first, actions should visibly change state and
create consequences, controls should feel responsive, progression should increase
agency, failure should be recoverable, success should feel earned, and menus/save/pause/
settings should feel like parts of the game rather than admin forms.

## First-minute invariant

Before specialist jargon where faithful, the player must understand the setting/context,
who or what they are, what changed/went wrong, what success means, why it matters and
what first action they can take.

For the current Missing Delivery reference, the user requires an approximately 15–20
second skippable/replayable story sequence establishing Pip, the valley/workshop,
the already-sent bridge-gear order, the storm-lost reply, duplicate-delivery risk and
the player's role in discovering the truth/restoring signals. Reduced motion and skip
must preserve the same essential causal meaning. After that sequence, move quickly into
meaningful play instead of another exposition wall.

Future generated courses inherit the **opening comprehension contract**, not the exact
Pip/storm theme or duration. Choose an appropriate cold-open, playable incident,
dialogue, simulation, mystery, construction/scientific failure or other game-quality
onboarding form.

## Scope and verification

The authoritative build order remains `CODEX-FIRST-SLICE.md`, the root implementation
plan and active amendments in STATE.md. `docs/COURSE-GENERATION-GAME-SYSTEM.md`,
`docs/GAME-ACCEPTANCE-9.md`, `docs/GAME-AS-COURSE.md` and
`docs/COMMERCIAL-GAME-BAR.md` amend future generation. Where older plan text says an
8/10 game critic can pass, the active **>=9.0 pre-gate + explicit user acceptance** rule
supersedes it.

Stay within private Phase 1 product refinement. Do not silently open Phase 2 reuse,
Phase 3 generation, model integration, untrusted code execution, external testers,
paid resources or public rollout. Preserve historical snapshots and evidence. Keep
PR #2 draft until the current product gates and user acceptance actually close.

Use one Python modular monolith with semantic HTML/CSS/JavaScript. SQLite/loopback
remain local; Flask/Gunicorn, PostgreSQL and Supabase Auth remain hosted. Read HOSTING.md
before infrastructure work. No renderer may decide assessment, evidence or unlocks.

The optional Three.js spike uses `?world=3d` and locally served, verified pinned assets.
Read `docs/THREEJS-SPIKE.md`. Run `python manage.py vendor` to fetch/verify the declared
build dependencies before 3D testing; no runtime CDN or relaxed CSP. Default illustrated
play and equivalent keyboard/touch controls remain available. Keep the prototype opt-in
until actual interaction, accessibility and device performance justify promotion.

Install hosted/test dependencies from requirements.lock and requirements-dev.txt.
Run `python manage.py build`, `python manage.py test`, and `python manage.py browser`
at integrated gates. Use only disposable browser databases. Preserve screenshots,
traces, exact commits and failures. No successful API mocks to claim live verification.
Do not bypass administrator browser policy; identify which normal environment ran the
tests and distinguish automated evidence from personal interactive/human play.

Implement a small complete behavior, verify it, inspect it, then extend it. Machine
checks are not human acceptance, and a source-only code review is not a game review.

## Game-first and course-outcome invariants

Read GAME-UX-SYSTEM.md, GAME-UX-REVIEW.md, GAME-AS-COURSE.md and
COMMERCIAL-GAME-BAR.md before substantial learning UI, mission, progression or
generation work. Judge the game as something a curious kid or young adult would
voluntarily continue playing with XP hidden. State reading/prior-knowledge assumptions;
do not pretend an agent prediction is child testing.

Use narrative/intuitive context before jargon where faithful: who wants what, what
changed, and what action matters. Play must reveal causality. Do not add story as extra
reading burden or force every subject into one fantasy, delivery, combat or quiz template.
Prefer meaningful investigation, manipulation, construction and experimentation.

Teach -> easy success -> variation -> combine -> boss/transfer -> resolution -> new
possibility. Increase reasoning, not form length. Teach every required boss rule before
its graded use. A useful new tool expands agency; a cosmetic badge is not a new mechanic.
Successful sequential clears focus the intended next route. Failure keeps a predictable
retry target. Required actions remain accessible, stable and usable without sound/motion.

Experience and learning outcomes are separate gates; neither compensates for failure
of the other. Map each outcome through mechanic, decision, feedback, varied practice,
fresh transfer, delayed retrieval and evidence limits. Do not claim a full course's
outcomes from a short guided slice. Free prose cannot be graded by counts or keywords.

## Evidence, privacy and persistence

Every command resolves a learner session, command ID and expected revision. Server
validation owns progression and replays pinned game rules. Saved moves cannot be erased;
rehearsal rewind retains prior feedback/history. Submissions/checkpoints/evidence are
immutable. New assessment meaning requires explicit new identities/revisions.

`unknown` is not `assisted`; observed/declared current help is `assisted`; earlier family
exposure is `previously_exposed`, not help used now. Interactive feedback is not a fresh
independent prediction. Missing evidence is not failure. XP/self-report never establishes
mastery, evidence strength or correctness-based unlocks. Evidence/reviews belong to
learners/frames, not installed course packages.

Hosted mode fails closed without verified Supabase identity, an email allowlist, HTTPS
and a scoped PostgreSQL connection. Local identity is not production authentication.
Keep auth, RLS, secrets and learner data unchanged for renderer-only work. Preserve
unrelated work and supplied files, and record recovery paths and limitations.