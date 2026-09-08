# vibeLearn · first slice

VibeLearn is a **game-first learning system** with a live private Render + Supabase
pilot. Phase 1 now includes a reviewed HUD-first campaign and a story-first teaching
revision driven by real learner feedback. Phase 2+ remains deliberately gated.

Current checkpoint: [`docs/STATE.md`](docs/STATE.md)  
Phase 1 evidence: [`docs/PHASE-1.md`](docs/PHASE-1.md)  
Game UX system: [`docs/GAME-UX-SYSTEM.md`](docs/GAME-UX-SYSTEM.md)  
Course-generation contract: [`docs/COURSE-GENERATION-GAME-SYSTEM.md`](docs/COURSE-GENERATION-GAME-SYSTEM.md)

## Live private pilot

`https://vibelearn-4xws.onrender.com`

Hosted mode uses Flask/Gunicorn on Render, PostgreSQL in Supabase, Supabase Auth, an
email allowlist, secure revocable app sessions, and the private `vibelearn` schema with
learner-scoped RLS.

Password recovery, real login, submission/evidence/review/XP, Render restart survival,
and real logout have been observed. The remaining live Phase 1 acceptance items are an
unfinished Save -> reload resume on the hosted site and a second real authorized-account
isolation check before broader multi-user use.

## Current learning experience

The reliable-retry chapter is a four-level game campaign:

1. **Tutorial — The missing receipt**
2. **Easy — A new ticket, a second charge**
3. **Medium — The store forgot**
4. **Boss — Shopping Agent incident**

The chapter uses a concrete story first: the learner asks an agent to buy one 5 kg
dumbbell, the purchase succeeds, the receipt/acknowledgement disappears, and the agent
may retry. Causal story beats make the situation understandable before the technical
request-ID/retention vocabulary appears.

The product rule is **narrative/intuitive model -> direct play -> formal vocabulary ->
harder reasoning**. The story must faithfully map to the assessed mechanism; it cannot
be decorative or replace technical rigor.

The UI is HUD-first: level/objective/progress/XP/sync at the top, contextual Hint/Intel/
Play-style/Save controls in a bottom dock, direct outcome decisions in the playfield,
and server-enforced sequential progression.

After a correct clear the campaign focuses the highest newly unlocked mission. A failed
attempt keeps the current retry target. XP is motivational only and never establishes
mastery or unlocks learning content by itself.

Help/evidence semantics distinguish:

- `unknown` — no declaration and no current observed aid;
- `declared_independent` — explicit no-external-help declaration and no current aid;
- `assisted` — current hint/source/worked-example use or declared external help;
- `previously_exposed` — prior family feedback without falsely claiming current help.

## Verification

```powershell
python manage.py build
python manage.py test
python manage.py browser
```

The current story-first candidate passed GitHub Actions `Verify hosted pilot` run 148:
**59 Python/hosted/PostgreSQL tests plus the full Chromium campaign journey**. Coverage
includes story/objective clarity, server mission locks, save/reload, actual process
restart, assistance semantics, next-level focus, lost-acknowledgement retry, mobile,
200% text, learner isolation, and reduced motion.

`docs/GAME-UX-REVIEW.md` has a frozen critic gate. The previous HUD-shell candidate
scored 8.8/10 but learner testing exposed comprehension/progression defects, so that
score is historical only. The fresh story-first candidate scored **9.1/10** with no
critical blocker; >=8.0 is required before a candidate can pass the game-UX gate.

## Run locally

```powershell
python manage.py serve
```

Open `http://127.0.0.1:8000`. Local mode uses SQLite and a browser-scoped development
identity. It is intentionally separate from hosted account data.

## Course generation direction

Future Phase 3 course generation is not “LLM writes lessons.” The active root
`CODEX-IMPLEMENTATION-PLAN.md` and `docs/COURSE-GENERATION-GAME-SYSTEM.md` require the
generator to produce the learning/assessment contract **and** a playable teaching
system: story/world premise where useful, plain objective, campaign/difficulty curve,
mission mechanics, HUD/tool progression, assistance rules, feedback/motion,
accessibility, persistence/isolation invariants, generated tests and critic reports.

Generated playable candidates must pass structural/learning, grounding/content and
accessibility validators plus a separate game-UX/comprehension score of **>=8.0/10**
with no critical blocker.

The checksummed `learning-os-design-package-v1.3/` remains preserved as historical
design input. Active repo amendments extend it rather than rewriting that archive.

## Code map

- `app/content.py` — immutable historical content + current campaign activity revisions
- `app/assessment.py` — deterministic trace assessment and evidence interpretation
- `app/service.py` — learner-scoped commands, progression, assistance, evidence/reward
- `app/storage.py` / `app/postgres.py` — SQLite/PostgreSQL persistence boundaries
- `app/hosted.py` / `app/auth.py` — hosted transport, Supabase Auth and recovery
- `web/` — HUD-first responsive game UI
- `tests/` — unit, PostgreSQL, hosted and real-browser verification
- `docs/` — current state, Phase 1 evidence, game UX and course-generation contracts

PR #1 remains draft until the story-first live experience is accepted and the second
real-account isolation check is closed.
