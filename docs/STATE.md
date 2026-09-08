# Current checkpoint — private hosted pilot + game-first campaign

VibeLearn is deployed as a private pilot on Render Free with Supabase Free. The active
Render service is `https://vibelearn-4xws.onrender.com`, built from
`deploy/render-supabase`. The hosted app uses Flask/Gunicorn, PostgreSQL, Supabase
Auth, an explicit email allowlist, Secure/HttpOnly/SameSite=Strict cookies, and the
private `vibelearn` PostgreSQL schema.

Supabase migrations applied:

- `20260907073952_vibelearn_hosted_schema`
- `20260907102455_harden_hosted_schema_access`
- `20260907102517_cover_hosted_foreign_keys`

The runtime connects through the restricted `vibelearn_login` -> `vibelearn_app`
role. Learner tables have forced learner-scoped RLS. `schema_migrations` is also
RLS-protected with an app-only read policy. `anon` and `authenticated` have no schema
USAGE or table grants for `vibelearn`; the application does not use a service-role
key for learner authentication.

The pre-existing `public.rls_auto_enable()` SECURITY DEFINER helper still powers its
event trigger, but direct EXECUTE access from `PUBLIC`, `anon`, and `authenticated`
has been revoked. Supabase's security advisor reports leaked-password protection being
disabled; that remains acceptable only for the current disposable private pilot.

The advisor-reported uncovered foreign keys are fixed with covering indexes on
`assistance(attempt_id, learner_id)`, `checkpoints(attempt_id, learner_id)`, and
`evidence(attempt_id, learner_id)`.

## Verified hosted infrastructure and live evidence

- Render serves `/`, static assets, `/api/config`, and `/api/health` successfully.
- PostgreSQL boundary checks pass learner isolation, composite ownership references,
  immutable submissions/history, reward deduplication, JSON lookup, and denial of
  unscoped reads.
- Password recovery and real hosted password login succeeded.
- Real hosted attempts/submissions exist with evidence, a future review need, and the
  bounded one-time Phase 1 practice reward.
- A real Render process replacement was followed by HTTP 200 from `/api/session` in
  the same learner browser, establishing hosted state/session survival across deploy.
- Real hosted sign-out returned HTTP 200 and the learner observed the UI returning to
  signed-out state. Automated replayed-cookie rejection independently verifies that a
  revoked application session cannot be reused.
- The consolidated automated hosted acceptance contract covers login -> start -> save
  -> hosted app recreation -> resume -> hint/mode/source -> submit ->
  evidence/review/XP -> logout/replayed-cookie rejection.
- Automated two-authorized-learner plus PostgreSQL RLS tests verify learner isolation.

## Game-first direction — reviewed candidate

The earlier premium/slightly-gameful pass was rejected as still feeling like a website.
The active product direction is now documented in `docs/GAME-UX-SYSTEM.md`: **HUD-first,
game-first technical learning**. `docs/UI-UX-DIRECTION.md` is historical context where
it conflicts with the newer game UX docs.

The retry topic is scaffolded into a four-mission chapter while preserving the original
Phase 1 activity/evidence as immutable historical data:

1. **Tutorial — Replay, don't repay:** one retained-key trace and one direct outcome
   choice; LEARN only.
2. **Easy — The key changed:** one changed-key trace and one direct outcome choice;
   LEARN only.
3. **Medium — The record expired:** two outcome choices plus a short explanation;
   PAIR and Intel/source interaction are introduced here.
4. **Boss — The retry that charged twice:** three traces plus the full retry-contract
   diagnosis; all learned mechanics are recombined and BUILD becomes available.

Progression is real and server-enforced. Only a correct pinned mission result clears a
mission and unlocks the next one. XP is game/progression feedback only and cannot
unlock missions or affect evidence/mastery. Campaign missions use new activity/family
IDs so old evidence meaning is never rewritten.

Gameplay chrome is HUD-first rather than website-first:

- persistent top HUD for level/boss state, objective, chapter progress, XP and sync;
- bottom dock for Hint, Intel, Play style and Save;
- secondary tools open HUD drawers instead of living in permanent side rails;
- direct `1 charge` / `2 charges` decisions replace comma-separated form entry for the
  core trace mechanic;
- diagnosis is introduced only when a mission needs it;
- selection, trace causality, save sync, unlock/clear, result and reward transitions
  provide state-driven game feedback; reduced-motion disables those effects.

Candidate implementation commit `3bbdfe18d2a8f38ad531ecbe585d993ba6ef4eb9`
passed `Verify hosted pilot` run 102: 57 Python/hosted/PostgreSQL tests and the complete
real Chromium campaign journey passed with no page errors. Browser verification covers
server-side mission locks, sequential difficulty/unlocks, HUD save -> reload resume,
actual process restart persistence, help/source aid semantics, boss lost-ack retry,
390px layout, 200% text enlargement, separate-browser learner isolation and reduced
motion.

`docs/GAME-UX-REVIEW.md` contains the locked critic rubric and recorded review. The
candidate scored **8.8/10**, above the required 8.0 threshold, with no critical blocker.
The pass means it is ready for a new learner trial; it is not treated as final game UX.

## Architectural decision — generated courses are game systems

The learner explicitly required the lessons from the current redesign to become part of
the product itself rather than remain hand-authored UI knowledge. That requirement is
now formalized in `docs/COURSE-GENERATION-GAME-SYSTEM.md`.

When Phase 3 course generation is opened, “course generation” means generating a
coherent playable system, not only lesson prose/questions. A generated course candidate
must include, as one versioned package:

- source-grounded competency/frame coverage and assessment bindings;
- a real campaign/difficulty curve with early confidence-building missions, variation,
  combination/boss work and appropriate test-out paths for experienced learners;
- mission interaction mechanics chosen to embody the learning operation rather than
  defaulting everything to forms/textareas;
- HUD and contextual-tool exposure rules, including progressive disclosure of Hint,
  Intel/source, play styles and other assistance;
- game reward/unlock semantics that stay separate from evidence/mastery;
- state-driven feedback/motion intent plus reduced-motion/accessibility requirements;
- persistence/resume and learner-isolation behavior;
- generated test fixtures/invariants that run through the real application harness;
- immutable critic/validator reports and release readiness.

The authoring pipeline is now defined as:

**brief -> research/source inspection -> learning map -> campaign design -> mission and
assessment design -> validation -> separate critic passes -> preview -> real learner
feedback -> immutable release**.

A generated candidate cannot self-certify. Structural/learning, grounding/content and
accessibility checks are pass/fail. The game-UX critic uses the frozen rubric in
`docs/GAME-UX-REVIEW.md`; a playable/validated candidate requires **>= 8.0/10** and no
critical blocker. Prefer a genuinely separate critic agent/model configuration when the
harness supports it; otherwise use a separately prompted critic pass and record that
limitation. Automatic repair is bounded (initial target: three revisions), after which
a failing course stays `draft_needs_review` rather than lowering the bar or looping
forever.

The current Reliable Agents retry chapter is the first reference implementation of this
contract. Future courses reuse the principles, not its exact four-node structure, dark
visual theme, or binary interaction.

The checksummed `learning-os-design-package-v1.3/` bundle remains historical and is not
rewritten in place. Active implementation guidance is the root plan plus the amendments
referenced by `AGENTS.md` and this checkpoint.

## Remaining acceptance

Remaining product acceptance for the current Phase 1/game-refinement track is:

1. Play the new live campaign and judge whether it actually feels like a game rather
   than merely a themed web app. The previous build's learner feedback was explicitly
   negative on this point and drove the overhaul.
2. On the live hosted campaign, save progress during an unfinished mission, reload,
   and confirm the exact unfinished decision/explanation resumes. The equivalent real
   browser/database/process tests already pass automatically.
3. Before broader multi-user activation, authorize a second real Supabase account and
   verify it cannot access the first learner's state. Automated two-user and RLS
   coverage already pass.
4. Record learner feedback on difficulty pacing, clarity, game feel, reward feedback
   and whether the Tutorial -> Easy -> Medium -> Boss curve builds confidence before
   the combined challenge.

## Phase boundary

The campaign is a refinement/scaffolding of the same reliable-retry learning material,
not implementation of the planned Phase 2 knowledge-map, scheduler, adaptive course
generation, or broader learning-OS subsystems. The course-generation contract above is
**design/architecture now, implementation later** when its phase is explicitly opened.
Historical Phase 1 evidence remains valid and immutable.

## Remaining cleanup before broader use

- Align the actual Render service health-check path with `/api/health` from
  `render.yaml` if the service still uses the root path.
- Enable stronger Supabase password protections before moving beyond disposable pilot
  credentials.

Keep PR #1 draft until the new live game experience has learner feedback and the second
real-account isolation acceptance is complete.
