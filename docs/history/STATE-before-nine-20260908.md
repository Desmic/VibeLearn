# Current checkpoint — private hosted pilot + story-first game campaign

## Latest product decision — 8 September 2026

**Phase 1 is not accepted.** The user's current score is **6.5/10**: the
experience does not feel sufficiently like a game. The later agent review scored
**7.5/10**, also below 8. Earlier 8.8/9.1 reviews below are historical and do not
approve the current experience.

For this stage, the user is the product critic and Codex is the agent critic.
Refine privately before presenting to other testers. Acceptance requires both
critics to score at least 8/10, with no critical blocker; an agent score cannot
overrule user rejection.

The adopted direction and research are in the **Expedition adventure refinement**
section of `GAME-UX-SYSTEM.md`. It extracts useful principles from Expedition 33,
The Witcher 3 and Breath of the Wild: character investment, consequential
decisions, curiosity, consistent interactive rules and satisfying feedback.
The proposed missing-delivery expedition is a working reference concept, not an
implemented replacement or a mandatory theme for all subjects.

Latest instruction: **update required documentation and stop**. This amendment
does not implement, deploy or rescore a build, open Phase 2/3, or initiate testing
with other people.

VibeLearn is deployed as a private pilot on Render Free with Supabase Free. The active
Render service is `https://vibelearn-4xws.onrender.com`, built from
`deploy/render-supabase`. Hosted mode uses Flask/Gunicorn, PostgreSQL, Supabase Auth,
an explicit email allowlist, Secure/HttpOnly/SameSite=Strict cookies, and the private
`vibelearn` PostgreSQL schema.

Supabase migrations applied:

- `20260907073952_vibelearn_hosted_schema`
- `20260907102455_harden_hosted_schema_access`
- `20260907102517_cover_hosted_foreign_keys`

The runtime connects through restricted `vibelearn_login` -> `vibelearn_app`. Learner
tables have forced learner-scoped RLS. `schema_migrations` is RLS-protected with an
app-only read policy. `anon` and `authenticated` have no schema USAGE or application
table grants. No service-role key is used for learner authentication.

The pre-existing `public.rls_auto_enable()` SECURITY DEFINER helper still powers its
event trigger, but direct EXECUTE from `PUBLIC`, `anon`, and `authenticated` is
revoked. Supabase's remaining security-advisor warning is leaked-password protection;
that remains acceptable only for the current disposable private pilot.

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
- The consolidated hosted acceptance test covers login -> start -> save -> hosted app
  recreation -> resume -> hint/mode/source -> submit -> evidence/review/XP ->
  logout/replayed-cookie rejection.
- Automated two-authorized-learner plus PostgreSQL RLS tests verify learner isolation.

## Product direction — game-first and story-first

The earlier premium/slightly-gameful pass was rejected as still feeling like a website.
The first HUD campaign materially improved game identity but learner testing then found
that **course comprehension and progression behavior were still not good enough**.
The active direction is therefore:

**story/intuitive model -> direct play -> formal vocabulary -> harder reasoning**

The target is a learning game whose interface and story teach serious concepts, not a
website with game labels and not a shallow metaphor that replaces rigor.

The current Retry Control chapter now uses a concrete Shopping Agent story as its
reference teaching world: the learner asks an agent to buy one 5 kg dumbbell, the
purchase succeeds, the receipt/acknowledgement disappears, and the agent may retry.
Simple causal story beats establish what happened and what the learner must decide
before the technical request IDs, retention window, and retry contract are introduced.
The story is an activity revision; prior submitted snapshots/evidence remain immutable.

The four-mission confidence curve remains server-enforced:

1. **Tutorial — The missing receipt:** one purchase, one retry, one outcome choice.
2. **Easy — A new ticket, a second charge:** contrast business intent with a fresh
   worker/request identity while keeping the interaction simple.
3. **Medium — The store forgot:** introduce the retention boundary, two decisions,
   first short explanation, PAIR and Intel.
4. **Boss — Shopping Agent incident:** recombine identity, retention and contract
   design after those mechanics have already been taught.

Difficulty must rise through reasoning demand, not through unexplained jargon or larger
forms. The campaign map still uses real server-side locks; only a correct pinned result
clears the learning gate. XP is motivational feedback only and cannot establish mastery
or unlock a competency gate by itself.

## Learner-feedback defects fixed in the current candidate

### 1. Narrative and objective clarity

- Each mission exposes a plain-language objective in the campaign briefing/HUD.
- Mission content carries explicit causal `story` beats rather than relying only on a
  technical trace/table.
- The playfield renders those beats sequentially so motion communicates cause/effect.
- Reduced-motion preserves the same information without depending on animation.
- Formal retry/idempotency vocabulary is layered on after the intuitive situation is
  understandable.

The generator contract now treats this as **narrative before abstraction** when a
faithful scenario is feasible. Fantasy, real-life, simulation, investigation, repair,
adventure, or other worlds may be used; the specific dumbbell story is only a reference.

### 2. Assistance / independence semantics

`Not declared` no longer collapses into `assisted`.

Current evidence interpretation distinguishes:

- `unknown`: the learner did not declare external-help status and no current observed
  in-game aid was used;
- `declared_independent`: the learner explicitly declared no external help and no
  current observed aid was used;
- `assisted`: a current-attempt hint/source/worked example was observed or external
  help was explicitly declared;
- `previously_exposed`: the learner has prior family feedback/exposure, without falsely
  claiming that current-attempt help was used.

Prior exposure still prevents an independent/fresh-evidence claim where appropriate,
but it is no longer mislabeled as current assistance.

### 3. Progression focus

After a correct clear, returning to the campaign now automatically focuses/selects the
**highest newly unlocked mission**. After a failed attempt, the current mission remains
the expected retry target. When the chapter is fully cleared, the highest completed
node remains selected. This behavior is covered by the real browser journey.

## Verification, critic gate and deployment

The story-first candidate passed GitHub Actions `Verify hosted pilot` run 148
(`34222243777`):

- build passed;
- **59 Python/hosted/PostgreSQL tests** passed;
- full Chromium campaign journey passed with no page errors;
- browser coverage includes the shopping story/plain goal, story beats, server locks,
  unknown/declaration/assisted semantics, next-level auto-focus, save -> reload resume,
  actual process restart, source/help recording, boss lost-ack retry, 390px viewport,
  200% text enlargement, learner isolation, and reduced motion.

`docs/GAME-UX-REVIEW.md` now contains a narrative/comprehension pre-gate. The historical
8.8/10 HUD-shell review is explicitly not reusable for this candidate. An earlier critic
pass scored the story-first candidate **9.1/10**, with no critical blocker then observed.
That historical assessment is superseded for product acceptance by the later
7.5/10 agent review and 6.5/10 user assessment. Remaining debt includes residual card/table ancestry, limited
sound/haptic payoff, and the need for real learner judgment of whether the story actually
improves understanding.

The documentation head `4f65fc8e20d847a2db294854f9baf5528cd1fbe2` passed
`Verify hosted pilot` run 156 and was manually deployed to Render as
`dep-dag0t2ad0e5s73ecfet0`. Render reports that deploy **live**. This head contains the
same green story-first runtime plus the updated architecture/checkpoint documentation.

## Architectural decision — generated courses are playable teaching systems

`docs/COURSE-GENERATION-GAME-SYSTEM.md` is an authoritative amendment to the active
root implementation plan for future Phase 3+ course generation.

Course generation must produce one coherent versioned package containing:

- source-grounded competency/frame coverage and assessment bindings;
- a chapter/world premise and plain-language learner objective;
- a story/intuitive-model plan when a faithful scenario can improve comprehension;
- causal story/visual beats mapped to the assessed mechanism;
- a real confidence/difficulty curve: teach -> easy success -> variation -> combine ->
  boss -> release -> new mechanic;
- mission interactions chosen to embody the learning operation rather than defaulting
  to forms/textareas;
- HUD/tool exposure and progressive interface disclosure;
- assistance semantics that distinguish unknown, observed help and prior exposure;
- predictable progression focus after clear/failure;
- reward/unlock semantics separated from evidence/mastery;
- state-driven motion/feedback plus reduced-motion/accessibility requirements;
- persistence/resume and learner isolation;
- generated executable invariants/test fixtures;
- structural/learning, grounding/content, accessibility and game-UX critic reports.

A generated course cannot self-certify. The game-UX/comprehension critic must score
**>= 8.0/10 with no critical blocker**, in addition to the other pass/fail validators.
Prefer a genuinely separate critic agent/model configuration where the harness supports
it; otherwise use a separately prompted frozen-rubric pass and record that limitation.
Automatic repair is bounded; a candidate that still fails remains `draft_needs_review`.

The root `CODEX-IMPLEMENTATION-PLAN.md` Phase 3 section was amended so the original
course-generation milestone itself now requires these story/game/progression/evidence
properties. The checksummed `learning-os-design-package-v1.3/` remains historical input
and is intentionally not rewritten in place.

## Remaining product acceptance

- Resume implementation only on a subsequent instruction; this increment is docs only.
- Refine the Phase 1 experience using the implementation order in `GAME-UX-SYSTEM.md`.
- Review changed builds with the user and Codex using `GAME-UX-REVIEW.md`; record
  actual behavior, unresolved defects and separate scores.
- Keep external testing deferred until the user judges the experience ready.
- Before broader activation, retain the existing hosted isolation and operational
  acceptance requirements. No additional account or external test is requested now.

## Phase boundary

The current campaign remains Phase 1 product refinement/scaffolding of the reliable-
retry learning material. It is **not** implementation of Phase 2 knowledge reuse or
Phase 3 adaptive course generation. The generation requirements above are architecture
now and implementation later when that phase is explicitly opened. Historical Phase 1
evidence remains valid and immutable.

## Remaining cleanup before broader use

- Align the actual Render service health-check path with `/api/health` if it still uses
  the root path.
- Enable stronger Supabase password protections before moving beyond disposable pilot
  credentials.

Keep PR #1 draft until the story-first live experience has learner feedback and the
second real-account isolation acceptance is complete.
