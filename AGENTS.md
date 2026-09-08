# vibeLearn

Read `docs/STATE.md` first, then **`docs/GAME-AS-COURSE.md`** and
**`docs/STORMWORKS-CLARITY-TRANSFER.md`**. The user's latest clarification on
9 September 2026 requires high clarity and an endpoint that enables applying the
knowledge to real problems. The game is the course, not a course interrupted by
minigames or an educational page with a 3D background.

The user temporarily authorized **available-tool/internal review while Codex is
blocked**. Use a frozen-candidate critique informed by actual rendered journeys,
screenshots/traces and adverse-path tests. Label it `internal_tool_assisted`, never
an independent agent/model or youth playtest. Codex setup is not a work prerequisite.
The unrounded **>=9.0/10** target, two audience lenses, no-critical-blocker rule and
user's final judgment remain unchanged. Do not inflate a score or reuse historical
8.8/9.1 verdicts. Current Stormworks review is 8.574/10: needs_revision, not accepted.

## Preserve concurrent work

This branch's candidate is `game/stormworks-clarity-transfer`, draft PR #3, route
`/storm`. It was isolated when concurrent Relay Rescue work appeared on PR #2's
`game/expedition-nine-gate`. Do not overwrite that branch or blindly merge two game
engines. Inspect the current heads before writing. Our Stormworks review does not
certify the concurrent candidate. Keep review PRs draft and unmerged until the
relevant acceptance decisions are actually made; no live deployment was performed.

## Scope and source of truth

The authoritative scope remains `CODEX-FIRST-SLICE.md`, the root v1.3 implementation
plan and active amendments referenced by STATE.md. Stay at the private Phase 1
human/product checkpoint unless the user explicitly opens another phase. Do not
open Phase 2 reuse, Phase 3 generation, a learning-model integration, untrusted
server-side code runner, external testers, paid resources or public rollout.

Preserve the checksummed `learning-os-design-package-v1.3/` as historical input.
Preserve original activity/campaign snapshots and evidence. New assessment meaning
must receive new identities/revisions rather than rewriting earlier claims. A
bounded retry game is not a complete distributed-systems course.

## Runtime and verification

Use one Python modular monolith. Local mode uses SQLite and loopback identity;
hosted mode uses Flask/Gunicorn, PostgreSQL and Supabase Auth. Read HOSTING.md before
any deployment work. Install pinned requirements from requirements.lock and
requirements-dev.txt. Use `python manage.py build`, `python manage.py test` and
`python manage.py browser` at integrated gates. Tests use disposable databases,
never the learner's real data. Start with `python manage.py serve`.

Semantic HTML controls remain first-class. The renderer projects domain state; it
never awards evidence or bypasses legal commands. Stormworks currently uses HTML
and SVG. The earlier opt-in Three.js prototype is preserved, not silently promoted
as the accepted game. Its pinned dependency is installed by `python manage.py vendor`
and served from the app origin with license/provenance retained. No runtime CDN,
new API key or relaxed CSP is needed. Physical phone GPU performance is unvalidated.

Implement one behavior, verify storage and browser, then extend it. Record the exact
candidate and executed results. Do not use an older green run as current verification.
Successful API mocks cannot establish a live gate. Browser tests are not fun tests.
Report an administrator browser restriction rather than bypassing it.

The local Python repair lab is a read-only downloadable teaching artifact. Its demo
uses a temporary SQLite database and its starter intentionally fails tests. The app
must not execute learner-supplied code, infer competence from downloading the lab,
or claim production readiness from these bounded tests.

## Game-first teaching invariant

Read GAME-UX-SYSTEM.md, GAME-UX-REVIEW.md, GAME-ACCEPTANCE-9.md and the newer amendments
before modifying missions, UI, progression or future generation. Review as a game a
curious younger non-specialist and an older teen/young adult would voluntarily keep
playing. Do not equate childish decoration, XP, long forms or easy questions with fun.

The player must understand the goal, relevant facts, meaningful actions and last
consequence. Put action and feedback together. Teach through experimentation,
investigation, construction and recovery where faithful. Story carries causality,
not extra reading burden. Formal terms name the intuitive model. Difficulty rises
through recombination and fading support, not untaught demands or longer forms.

Use teach -> easy success -> variation -> combine -> unfamiliar challenge -> relief
and a real new possibility. After a clear, point to the newly intended route; after
failure, preserve predictable retry focus. Mistakes expose causes and invite a new
hypothesis. Test replay with XP hidden. No shame, fake urgency, coercive streaks or
excessive grinding. Themes, node counts and renderers are replaceable patterns.

**Two hard gates:** game experience and defensible learning outcomes. Neither may
compensate for failure of the other. Every course package must map outcomes through
mechanics, decisions, causal feedback, varied practice, transfer assessment,
authentic application and later retrieval, with missing evidence explicit. Future
unattended generation still needs separate validation; the temporary current-review
exception does not let every generator self-certify.

## Evidence, identity and safety

Commands resolve a verified learner, command ID and expected revision. The server
validates and replays pinned activity meaning. Saved moves/checkpoints, assistance
and submitted evidence are immutable; rehearsal rewinds do not erase history.
Progress/XP never strengthen evidence, establish mastery or substitute for correctness.
Unknown outside help, current assistance and prior exposure remain different labels.
Interactive simulation feedback is assistance, not a fresh independent prediction.
Unobserved earlier work is not a failure. Prose is not graded by keywords or counts.

Keep actual effects separate from what an actor knows. A missing reply is not a
failed effect. A retry key has finite retention; a durable authoritative record is a
separate capability. Final absence in these fixtures includes no in-flight request;
an ordinary not-found result does not automatically establish that. A local database
cannot make a remote provider side effect atomic. A lucky unsafe retry must not
certify a safe policy. Check liveness as well as duplicate prevention.

Hosted mode fails closed without verified Supabase identity, allowlist, HTTPS and
scoped PostgreSQL/RLS. Never expose credentials or mutate production learner data
for review. Record failures, migrations, limitations and recovery paths honestly.
Equivalent/superior course effectiveness, actual youth enjoyment, independent learner
implementation and delayed retention remain unvalidated until observed appropriately.
