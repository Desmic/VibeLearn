# VibeLearn · game-first learning system

VibeLearn is a **game whose meaningful play is intended to deliver course outcomes**, not a course website decorated with XP. The current private Phase 1 reference is **Relay Rescue**, a seven-signal reliability adventure running on Render + Supabase.

Start with [`docs/STATE.md`](docs/STATE.md). Product/story authority lives in [`docs/STORY-GENERATION-AND-CRITIC.md`](docs/STORY-GENERATION-AND-CRITIC.md), [`docs/GAME-AS-COURSE.md`](docs/GAME-AS-COURSE.md), [`docs/GAME-UX-SYSTEM.md`](docs/GAME-UX-SYSTEM.md), and [`docs/COURSE-GENERATION-GAME-SYSTEM.md`](docs/COURSE-GENERATION-GAME-SYSTEM.md). The root [`CODEX-IMPLEMENTATION-PLAN.md`](CODEX-IMPLEMENTATION-PLAN.md) carries the active implementation order; the checksummed `learning-os-design-package-v1.3/` remains historical and is not rewritten.

## Current product state

The current user is the sole real product reviewer during private refinement. Their latest first-touch/story verdict is **3/10**. It supersedes older critic passes. The rejected opening moved too quickly, had no Back control, explained rather than dramatized, and did not create enough clarity, attachment, or forward pull for kids/young adults.

The replacement candidate is **Relay Rescue: The Echo Forge**. It is a new story treatment rather than a timer adjustment to the old slides. Its story-only critic is a separate gate from game and learning review; a critic pass never overrides the user's judgment.

Current conceptual pipeline:

`course topic/outcomes -> story/fantasy -> story critic >=9 -> gameplay/world realization -> game critic >=9 -> learning/transfer gate -> user review`

**Today, story choice is topic-driven only.** Learner creative preferences are not an input. Future explicit `StoryPreferenceProfile` support may let a learner influence genre, tone, world type, realism/fantasy balance, character style, visual style, humor/darkness, pace, exploration/action, and narrative density without changing the learning contract.

## Live private pilot

`https://vibelearn-4xws.onrender.com`

Hosted mode uses Flask/Gunicorn on Render, PostgreSQL in Supabase, Supabase Auth plus the private pilot test-identity path, secure revocable application sessions, learner-scoped PostgreSQL/RLS boundaries, and server-authoritative progression/evidence. Render serves `deploy/render-supabase`; auto-deploy is disabled, so verified candidate changes are manually deployed.

This remains a private refinement environment. Passing CI/critics does not authorize public rollout or external testing.

## Relay Rescue learning/game arc

Relay Rescue currently develops retry-safety reasoning through seven signals:

1. **The Echo Forge went silent** — distinguish a lost reply from a failed effect.
2. **A new body, the same promise** — preserve intent identity across a restart.
3. **The parcel changed under the same seal** — bind identity to request meaning.
4. **The Echo Forge forgot the old seal** — respect finite retention.
5. **The valley ledger goes dark** — keep unknown distinct from known absence and reconcile safely.
6. **Weave the storm route** — construct a bounded multi-rule recovery policy.
7. **Beyond the valley** — transfer the reasoning to a fresh export-worker incident.

Signal 1 is deliberately a world-model/tutorial chapter. The player should understand Pip, the broken crossing, the Echo Forge, one replacement gear, `order-01`, the missing reply, why a duplicate costs something, why Pip needs help, and why inspecting before resending is useful **before** formal terminology such as `idempotent retry` is introduced.

## Story-first first-touch contract

A VibeLearn opening is not allowed to be a rushed slideshow. For first-run narrative sequences:

- progression is user-paced by default;
- Back/previous and Continue are required;
- active motion can be paused/resumed;
- Skip, replay, and visible story position are available;
- reduced-motion preserves the same causal story and navigation;
- going backward/forward reconstructs the correct world state;
- story is told through events, characters, environment, dialogue, discovery, conflict, and consequence rather than caption dumps.

For important stories the realization step explicitly considers **2D illustration, 2.5D/parallax, and interactive Three.js 3D**. Three.js may be chosen for immersion, character/world presence, atmosphere, environmental storytelling, and direct interaction, but earns no score merely for being 3D and never controls assessment/evidence. Phase 1 now establishes a reusable Three.js story runtime + world-adapter seam so future fantasies can swap story-specific worlds without copying renderer lifecycle code; see [`docs/THREE-STORY-FRAMEWORK.md`](docs/THREE-STORY-FRAMEWORK.md).

## Quality gates

Story, game experience, and learning/real-world transfer are separate gates. Each applicable critic target is unrounded **>=9.0/10 with no blocker**, followed by the user's own review. The story critic evaluates exactly one frozen story at a time and ignores code quality, renderer sophistication, test count, and curriculum usefulness when scoring the story itself.

Machine verification remains separate again: build, deterministic tests, real-browser journeys, persistence, learner isolation, mobile/narrow layouts, enlarged text, reduced motion, renderer fallback, and failure/recovery paths must stay green. Machine success is not evidence that a story is loved or a game is fun.

## Verification

```powershell
python manage.py vendor
python manage.py build
python manage.py test
python manage.py browser
```

GitHub Actions is the integrated hosted gate because it installs the pinned hosted/PostgreSQL/browser dependencies. Local environments without `psycopg`/`supabase-auth` cannot execute the complete hosted suite and must not be described as a full pass.

## Run locally

```powershell
python manage.py vendor
python manage.py serve
```

Open `http://127.0.0.1:8000`. Local mode uses SQLite and a browser-scoped development identity; it is intentionally separate from hosted learner data.

## Course-generation direction

Future Phase 3 generation is not “LLM writes lessons.” The generator must produce a versioned, source-grounded teaching system with a story package and story critic first, then a campaign/gameplay realization, progression and UI disclosure plan, outcome-to-mechanic/assessment coverage, provenance, accessibility/fallback behavior, persistence/evidence contracts, generated fixtures, rendered game criticism, and learning/transfer validation.

Current story generation uses the **course topic/outcomes and causal learning structure only**. Future learner-controlled story preferences are an explicit later capability, not something the system should infer today.

See [`docs/COURSE-GENERATION-GAME-SYSTEM.md`](docs/COURSE-GENERATION-GAME-SYSTEM.md) and [`docs/STORY-GENERATION-AND-CRITIC.md`](docs/STORY-GENERATION-AND-CRITIC.md).

## Code map

- `app/rescue.py` — Relay Rescue world/rules and deterministic bounded simulation
- `app/service.py` — learner-scoped commands, progression, assistance, evidence/reward
- `app/storage.py` / `app/postgres.py` — local/hosted persistence boundaries
- `app/hosted.py` / `app/auth.py` / `app/pilot_auth.py` — hosted transport and identity
- `web/story3d-runtime.js` / `web/rescue-story3d.js` — reusable Three.js story runtime and the Echo Forge world adapter
- `web/rescue-intro.js` — first-touch story player consuming the current world adapter
- `web/rescue.js` / `web/rescue-chapter1.js` — seven-signal playfield and tutorial focus mode
- `tests/` — deterministic, PostgreSQL, hosted, and real-browser verification
- `docs/` — current state, story/game/learning contracts, critic records, and Phase 1 history

PR #1 remains draft until the current user accepts the experience and the remaining private-pilot release gates are intentionally closed. Phase 2+ remains gated.
