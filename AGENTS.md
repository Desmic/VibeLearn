# vibeLearn

Read `docs/STATE.md` first, then **`docs/GAME-ACCEPTANCE-9.md`**. The latter is the
latest user amendment (8 September 2026): implementation/research of the Phase 1
game experience is resumed; a genuinely separate critic must score the actual
playable game >=9.0/10 before the user's final review. Judge it as a game that even
a kid or young adult would voluntarily engage with, not an educational website.
The amendment supersedes older 8/10 thresholds, same-agent fallback acceptance and
the previous stop-after-documentation instruction. Historical scores are not current
acceptance. A missing independent reviewer means `independent_critic_pending`, not
an invented score. Do not weaken the rubric to hit the target.

The authoritative scope remains `CODEX-FIRST-SLICE.md`, the root v1.3 implementation
plan and active repo amendments referenced by `STATE.md`. For future course generation,
`docs/COURSE-GENERATION-GAME-SYSTEM.md` and the newer `docs/GAME-ACCEPTANCE-9.md` amend
the Phase 3/4 expectations. The checksummed `learning-os-design-package-v1.3/` directory
is preserved as historical design input. Stay at the Phase 1 human/product checkpoint
unless the user explicitly opens the next phase.

The user authorized a private Render Free + Supabase Free pilot after Phase 1.
Keep historical Phase 1 evidence and learning contracts immutable; do not silently
advance into Phase 2+. The current retry material may be refined/scaffolded as a
reference game experience while acceptance is active. No external testers until the
user judges the experience ready.

Use one Python modular monolith and semantic HTML/CSS/JavaScript. Local mode keeps
SQLite and loopback binding. Hosted mode uses Flask/Gunicorn, PostgreSQL and
Supabase Auth. Read `docs/HOSTING.md` for setup and verification limits. Install
hosted/test dependencies from `requirements.lock` and `requirements-dev.txt`.
Run `python manage.py build`, `python manage.py test` and
`python manage.py browser` at integrated gates. Start with `python manage.py serve`.
Browser tests use a separate temporary database, never the learner's real database.

Implement one behavior, verify it across storage and browser, then extend it.
Keep executable acceptance tests and observed evidence in `docs/`.
Do not replace tests with mocks to claim a live gate passed. Record missing test
prerequisites honestly; engineering checks alone do not establish enjoyable play.

## Game-first teaching invariant

Read `docs/GAME-UX-SYSTEM.md`, `docs/GAME-UX-REVIEW.md` and the superseding
`docs/GAME-ACCEPTANCE-9.md` before learning UI, progression, mission or generation work.
VibeLearn is a game-first learning system, not a generic course website with XP labels.

The shopping-agent campaign and proposed missing-delivery expedition are reference
patterns, not mandatory stories, colors, four-node chapters or binary mechanics for
all subjects. Preserve the principles: HUD-first hierarchy, direct play, progressive
interface/vocabulary disclosure, teach -> easy success -> variation -> combine ->
boss/release, consequential feedback and strict separation of progression from evidence.

**Voluntary youth engagement:** assess a younger non-specialist and an older teen/young
adult lens separately. Require a compelling goal, early meaningful action, curiosity,
experimentation, understandable consequences, recoverable setbacks, an earned ending
and a working replay variation. Hide XP and ask why the player would continue. Do not
substitute cute decoration, childish copy, coercive retention or easy quizzes for fun.
Preserve eventual rigor; actual child engagement remains unvalidated until authorized
human testing. The user's final product judgment cannot be overruled by agent scores.

**Narrative before abstraction:** where faithful, establish a concrete scenario and
plain objective before specialist jargon. The player should understand who wants what,
what changed and what decision/action matters. Motion teaches causality, then formal
terms name the intuitive model. Story must not merely add decorative reading burden.

Progression focus is part of the contract. After a successful sequential clear, focus
the newly unlocked/recommended mission rather than silently returning to an earlier node.
After failure, keep retry focus predictable unless a deliberate branch is declared.

Assistance labels are evidence semantics: `unknown` is not `assisted`; observed/declared
current help is `assisted`; prior family/result exposure is `previously_exposed`, not
current help. Sandbox feedback and revealed solutions cannot masquerade as fresh
independent assessment. Free prose cannot receive a correctness claim from a counts-only
grader. Constructed policies must be tested against explicit pinned counterexamples.

When course generation is implemented in its authorized phase, it must generate the
learning contract and narrative/intuitive model plus playable campaign/mission/HUD/tool/
progression/feedback and youth-engagement contracts. Structural/learning, grounding and
accessibility gates must pass alongside the genuinely separate game critic's unrounded
score >=9.0/10, both audience-lens verdicts and no critical blocker. A generator cannot
self-certify. Failed automatic repairs leave a draft; never weaken the threshold.

All learner commands require a resolved session, a command ID and expected revision.
Content snapshots, checkpoints, assistance and evidence are immutable. Evidence/review
belong to learners and frames, not installed courses. XP and self-reported experience
never establish mastery. Missing evidence is not failure. Local identity is not production
authentication. Hosted mode fails closed without verified Supabase identity, an email
allowlist, HTTPS and a scoped PostgreSQL connection. No untrusted code runner, learning-
model integration, Phase 2+, paid provisioning or broad public rollout in this increment.

Preserve supplied design files and unrelated work. Record migrations, exact checks,
known limitations and a recovery path. Machine checks are not human acceptance.
