# vibeLearn — agent instructions

**Current gate — 19 September 2026:** Frozen critic candidate `92a5ecbdc803362ee1554fca6ae811adb155bc26`; next product step is context-separated critic execution/ingestion, not another implementation chunk. Later docs-only `main` commits do not replace that candidate. Render remains on the rejected deployed runtime; no Level 2.

Read `docs/STATE.md` first. **`main` is the canonical development branch.** Do not create a new branch for routine iteration, review, research, or fixes. Use another branch only when isolation is materially necessary, and merge it back into `main` promptly. `deploy/render-supabase` is the pinned deployment branch and may intentionally lag `main`. Older `game/*` and `phase1/*` branches are historical unless the user explicitly revives one.

Read `CODEX.md` for the delivery loop and `CODEX-IMPLEMENTATION-PLAN.md` for scope. Latest user direction supersedes historical plans. Stop at the user's review checkpoint before Level 2/Phase 2.

## Product and build order

- VibeLearn is a **learner-facing product that creates personalized learning games on demand**. A creator-operated studio is not the first customer experience; authoring and review tools are internal support. Read `docs/LEARNER-ON-DEMAND-AND-REPAIR.md`. The current LLM track proves game quality and useful reusable boundaries, not the finished on-demand product. Do not build a universal generator prematurely or hard-code the track as the platform.
- The current track uses **direct protagonist control**. Do not invent a separate literal helper/avatar because story text says “you help X.” Player embodiment is an explicit game-design decision and must match the rendered world, camera and controls.
- The current journey is `entry -> prologue -> separate tutorial -> Level 1 -> later challenge/payoff`. Level 1 is not the tutorial. The tutorial teaches reusable play grammar and gives a clean success before the first mission.
- Clear story, attachment, atmosphere, readable controls, spatial composition and meaningful play are requirements, not polish after implementation.
- The world must have breathing room. Treat playable footprint, prop density, negative space, landmark spacing, camera occlusion and object intersections as design inputs. More props/detail are not automatic improvements.
- Choose chunk boundaries around a coherent player experience. Build one playable chunk at a time. The prologue is the first attention/understanding gate: finish, test and play it before tutorial or Level 1 expansion.
- Follow `CODEX.md`: define observable success, implement, test, play through computer/browser use, critique, repair, recheck, record. Agents with computer use should inspect the **actual running experience** when relevant rather than reasoning only from source or screenshots. Do not advance with known blocking failures or unobserved required behavior. Tests alone are not done.
- Run **story, art/world-direction, gameplay and learning** criticism as independent gates. Read `docs/EXPERIENCE-QUALITY-SYSTEM.md`, `docs/ART-WORLD-DIRECTION-CRITIC.md` and `docs/CRITIC-POLICY.md`.
- For player-experience criticism, independence includes **context separation**, not only a different prompt. Run a cold-observer pass on the actual experience before supplying story treatment/creator rationale. Then run a design-intent comparison pass using the cold observations as evidence. Do not let prior intent fill missing visual meaning.
- Critic evidence must match the claim: use live/browser interaction for physicality/tutorial/transition claims, motion over time for animation/cinematic claims, and actual listening for audio-quality claims when available. Screenshots/source alone cannot certify those dimensions.
- New readiness records use `tools/check_critic_review.py` **schema v2**. Historical schema-v1 records may be read but must not qualify a new candidate. If the required evidence modality is unavailable, record the criterion as unassessed; never substitute weaker evidence to manufacture a score. Read `docs/ART-WORLD-DIRECTION-CRITIC.md` and `docs/CRITIC-POLICY.md`.
- Parallelize only independent work that cannot bypass the active gate, such as research or test preparation. Do not build future levels/systems early.
- Keep plans and evidence current and concise. The current user is the sole final human critic of this private proof; internal/agent scores never override direct feedback.

## Platform and reuse

- Read `docs/GAME-CREATION-PLATFORM.md`. Reuse versioned learning/story/rules/world/runtime specs and shared PlayCanvas components; keep story-specific data outside shared controllers. Three.js is legacy only.
- Prefer reusable, parameterized world kits, character/control profiles, cinematic beats, interactions, tutorial patterns, audio/HUD components and critic/test templates. Reuse must support different layout, scale, art direction and story; avoid reskinned copies.
- Pop-culture, game, film, animation and literature research is encouraged for ideation. Extract techniques, archetypes, naming energy, pacing and motifs; ship original characters/assets/dialogue/music and never make comprehension depend on a reference.
- Future learners can chat with agents to flag issues. Investigate the exact build, distinguish defects/preferences/confusion, make appropriate scoped changes, verify the original issue and regressions, then activate safely and report. Do not blindly patch every complaint or discard subjective feedback because CI passes.
- Read `docs/AUTOMATED-DEVELOPMENT-SYSTEM.md`. VibeLearn has completed and merged **Phase 0** of the thin versioned adapter contract to the existing Terminal PM Agent. Terminal PM remains a separate evolving system and currently reports `live_run_authorized=false`, so no live Phase 1 orchestration run is authorized. Do not copy/extract its internal runtime, verifier, session or recovery modules into VibeLearn yet. Preserve the lean worker -> reviewer -> evidence model and treat reviewer criticism as implicitly requiring attempted proof/reproduction. Deeper coupling requires a stable relevant boundary or run evidence that the external contract is insufficient. This does not authorize a broad rewrite, autonomous production deployment or Level 2 work.

## Architecture and safety

- Keep one Python modular monolith and semantic HTML/CSS/JS. Local: SQLite and loopback. Hosted: Flask/Gunicorn, PostgreSQL and verified Supabase identity, allowlist, HTTPS and scoped/RLS-protected storage. See `docs/HOSTING.md`.
- Learner commands require session, command ID and expected revision. Preserve immutable snapshots/checkpoints/assistance/evidence and existing learning IDs. Rendering, XP, self-report and game completion do not establish mastery; missing evidence is unknown. Keep learning evidence independent of theme/engine.
- Personalization must not silently lower learning outcomes or rewrite old assessment evidence. Separate personal package changes from shared-runtime changes; preserve saves and use explicit migration/release policy. Support reports are not reset consent.
- Preserve learner data, supplied designs and unrelated work. Test on disposable databases. The automation architecture/code integration is now authorized, but actual paid/live-provider dispatch, untrusted runners, production mutation or broad rollout still requires an explicit configured execution/budget policy. Never fake live verification.
- At integrated gates run `python manage.py build`, `python manage.py test` and active browser groups. Dependencies: `requirements.lock` and `requirements-dev.txt`; local preview: `python manage.py serve`.
