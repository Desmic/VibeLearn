# VibeLearn · game-first learning system

VibeLearn is a **general system for turning subjects/courses into source-grounded learning games**, not a course website decorated with XP. The current private Phase 1 reference is **Relay Rescue: The Echo Forge**, a seven-signal reliability adventure.

Start with [`CODEX-IMPLEMENTATION-PLAN.md`](CODEX-IMPLEMENTATION-PLAN.md) and [`docs/STATE.md`](docs/STATE.md). Current product/runtime authority also includes [`docs/STORY-GENERATION-AND-CRITIC.md`](docs/STORY-GENERATION-AND-CRITIC.md), [`docs/GAME-AS-COURSE.md`](docs/GAME-AS-COURSE.md), [`docs/GAME-UX-SYSTEM.md`](docs/GAME-UX-SYSTEM.md), [`docs/COURSE-GENERATION-GAME-SYSTEM.md`](docs/COURSE-GENERATION-GAME-SYSTEM.md), [`docs/PLAY-CANVAS.md`](docs/PLAY-CANVAS.md), and [`docs/THREE-STORY-FRAMEWORK.md`](docs/THREE-STORY-FRAMEWORK.md).

The checksummed `learning-os-design-package-v1.3/` remains historical and is not rewritten.

## Current product state

The current user is the sole real product reviewer during private refinement. Their latest predecessor first-touch/story verdict is **3/10** and supersedes older critic passes.

Current gate sequence:

`LearningSpec -> StoryWorldSpec -> story critic >=9 -> GameExperienceSpec/Play Canvas realization -> first-touch magic >=9 -> whole-chapter game >=9 -> learning/transfer >=9 -> user review`

Critic/machine success never overrides the user.

**Today**, story generation is topic/outcome/source-structure driven. **Future** explicit `StoryPreferenceProfile` support may let a learner influence genre, tone, fantasy/realism, character/visual style, humor/darkness, pace, exploration/action balance and narrative density without changing the learning/evidence contract.

## Architecture: generated learning package

The durable product boundary is:

`LearningSpec -> StoryWorldSpec -> GameExperienceSpec -> AssessmentEvidenceSpec`

Learning/evidence identity remains independent of story names, characters, renderer, world package and Play Canvas implementation. A future learner can experience the same learning requirements through a different world without erasing/counterfeiting legitimate history.

## Play Canvas

VibeLearn has converged on a persistent **Play Canvas** as the game surface.

Story, exploration, missions, visible consequence/recovery, progression, building and transfer are modes inside the game rather than separate lesson pages.

For compatible modes, Play Canvas should keep the same stage/world/runtime and change state/camera/HUD rather than spawning a new course-specific renderer.

Three.js, 2D and 2.5D are rendering backends inside Play Canvas.

## Reusable Three.js world framework

The user explicitly requires a **Three.js framework that makes future stories/fantasy settings easy to integrate**.

Current hierarchy:

`Play Canvas -> renderer backend -> story3d-runtime/world-host -> replaceable world package`

Shared infrastructure owns renderer lifecycle, DPR, resize, frame scheduling, pause/reduced motion, context recovery, cleanup, camera orchestration and package capability validation.

World-specific packages own scene/entities/assets, art direction, story/game visual states, camera compositions, interaction anchors and fallback metadata.

### Data-first world-package direction

The long-term generator should normally emit a validated/versioned declarative package rather than arbitrary renderer JavaScript:

```text
world-package/
  manifest.json
  world.json
  states.json
  cameras.json
  interactions.json
  assets/...
  fallback/...
  adapter.js?   # exceptional reviewed extension only
```

Current Phase 1 does **not** implement the arbitrary generated-package loader. It proves the Play Canvas + reusable world-authoring seam first, while strict CSP/static allowlists stay intact.

A new fantasy should usually integrate by changing package data/assets, not by editing Play Canvas/runtime/host. If it needs a genuinely new engine capability, generalize/version/test that capability first.

## Relay Rescue arc

The current reference develops retry-safety reasoning through seven signals:

1. **The Echo Forge went silent** — distinguish a lost reply from a failed effect.
2. **A new body, the same promise** — preserve intent identity across a restart.
3. **The parcel changed under the same seal** — bind identity to request meaning.
4. **The Echo Forge forgot the old seal** — respect finite retention.
5. **The valley ledger goes dark** — preserve unknown vs known absence and reconcile safely.
6. **Weave the storm route** — construct a bounded multi-rule recovery policy.
7. **Beyond the valley** — transfer reasoning to a fresh export-worker incident.

Signal 1 is the world-model/tutorial chapter. Formal terminology such as `idempotent retry` appears after the player understands the concrete one-order/one-gear/lost-reply model.

## Story-first first touch

First-run narrative progression is user-paced. Back/previous and Continue are mandatory where applicable; motion can be paused/resumed; Skip/Replay/progress are available; reduced motion preserves causal meaning/navigation.

The opening should be dramatized through world events, character behavior, dialogue, discovery, conflict and consequence—not exposition slides.

## Phone-first quality target

Current first touch/Chapter 1 refinement targets mainstream modern Android/iPhone portrait use, roughly **360–430 CSS px** wide with tall aspect ratios, touch, safe areas, text enlargement and reduced motion. Desktop polish follows after phone quality is strong.

## Private hosted pilot

Live private environment: `https://vibelearn-4xws.onrender.com`

Render serves branch **`deploy/render-supabase`**. Auto-deploy is disabled, so only the exact verified review candidate should be manually deployed.

Hosted mode uses Flask/Gunicorn on Render, PostgreSQL in Supabase, Supabase Auth plus the private test-identity path, secure revocable sessions, learner-scoped PostgreSQL/RLS boundaries and server-authoritative progression/evidence.

This is a private refinement environment; CI/critic passes do not authorize public rollout or external testing.

## Verification

```powershell
python manage.py vendor
python manage.py build
python manage.py test
python manage.py browser
```

GitHub Actions is the integrated hosted gate. Preserve exact commit, failures, screenshots/traces, persistence/restart evidence and phone/fallback behavior. Machine success is not proof that the game is loved or that learning is durable.

## Run locally

```powershell
python manage.py vendor
python manage.py serve
```

Open `http://127.0.0.1:8000`. Local mode uses SQLite/browser-scoped development identity and is intentionally separate from hosted learner data.

## Code map

- `app/rescue.py` — Relay Rescue rules and deterministic simulation
- `app/service.py` — learner-scoped commands, progression, assistance, evidence/reward
- `app/storage.py` / `app/postgres.py` — local/hosted persistence
- `app/hosted.py` / `app/auth.py` / `app/pilot_auth.py` — hosted transport/identity
- `web/play-canvas.js` / `web/play-canvas.css` — persistent game surface/stage lifecycle
- `web/story3d-runtime.js` — reusable Three.js renderer/device/camera/lifecycle infrastructure
- `web/story3d-world-host.js` — world adapter/package capability boundary
- `web/rescue-story3d.js` — Echo Forge-specific current world implementation
- `web/rescue-intro.js` — first-touch story state/player controls
- `web/rescue-game.js` / `web/rescue-chapter1.js` — seven-signal game and Chapter 1 tutorial focus
- `tests/` — deterministic, PostgreSQL, hosted, browser, Play Canvas and Story3D verification
- `docs/` — current architecture/product contracts plus historical records

## Scope

Current work remains private Phase 1. Phase 2+, broad generator implementation, arbitrary generated client code loading, new model/provider integrations, untrusted execution, external testers, paid expansion and public rollout remain gated.
