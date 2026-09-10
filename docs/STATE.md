# Current checkpoint — user rejected first-touch story at 3/10

Updated 10 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit verdict is authoritative and supersedes every agent/critic/automation score for acceptance.

## Latest user review

The current live Relay Rescue candidate failed first-touch review. The user's newest rating for the opening/story experience is **3/10**.

Specific failures identified by the user:

- no way to move back to a previous animation/story beat;
- slides/animated beats advance too quickly;
- the story is lazily told rather than meaningfully dramatized;
- scenario, causal chain, context, and stakes are still not clear enough;
- the opening does not yet capture the attention/love of kids, teens, or young adults;
- the experience still does not feel like the quality of story/world introduction expected from a commercial game.

The earlier overall **5/10 game / 5/10 learning** verdict remains historical context for the prior candidate. The newest **3/10** specifically describes the first-touch/story layer and is the most recent product signal for the current opening. Do not average these numbers.

The prior internal-tool-assisted critic result (`9.196` game / `9.35` bounded learning slice) did **not** predict the user's actual experience and is therefore invalid as an acceptance signal for this candidate. Preserve it as historical evidence only. The current build is not `ready_for_user_review`; it is back to `needs_revision`.

## New authoritative product direction: story before game realization

For **every course/subject**, generation should first create a strong story/fantasy/world premise before building the playable learning experience. Story is not decoration added after mechanics. It is a first-class generated artifact with its own critic gate.

Read [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md). The intended future pipeline is:

`course intent/outcomes -> user/audience preferences -> story/fantasy candidate -> story critic >=9 -> gameplay/world realization -> game critic >=9 -> learning/transfer gate -> current user review -> user acceptance`

The story critic evaluates **one frozen story at a time** and rates only story quality: hook, clarity/causality, character attachment, world/fantasy appeal, how the story is told, pacing/progression, stakes, payoff/forward pull, and cross-age engagement. It must not award points for code, tests, graphics technology, curriculum correctness, or implementation effort.

The long-term generator should personalize story/fantasy to user preference: genre, tone, world type, visual style, pace, realism/fantasy balance, humor/darkness, exploration/action preference, and narrative density. Until preference infrastructure exists, use a strong broad-audience default.

## First-touch interaction requirements

Story/cinematic sequences must be player-controlled rather than rushed slide decks:

- Back/previous beat is mandatory.
- User-paced progression is the first-run default.
- Next/continue, pause/resume, skip, replay, and visible progress/chapter position are required where applicable.
- Optional autoplay must be slow enough for the beat to land and must pause when the player interacts.
- Reduced-motion mode preserves causal meaning and navigation.
- Back/forward navigation restores coherent story/world state.

Simply slowing the current six slides is not enough. The next opening needs substantially better writing, staging, emotional/visual progression, and causal clarity.

## Three.js / 3D direction

Three.js is now a **serious option to evaluate for attention and immersion**, especially for the kid/teen/young-adult audience. The previous policy that treated 3D mainly as useful when the learning mechanic itself required spatial interaction is too narrow.

For the next story realization, explicitly compare authored 2D/animation, 2.5D/parallax, and interactive Three.js 3D. 3D can be valuable for world attachment, spatial storytelling, character presence, discovery, atmosphere, and direct interaction even before the hard learning mechanic begins.

3D does not rescue weak writing. A beautiful but unclear Three.js scene still fails the story gate. Preserve mobile performance, keyboard/touch, reduced motion, fallback, same-origin/pinned assets, and evidence separation.

## Current implementation / deployment

Repository: `Desmic/VibeLearn`. Active hosted branch: **`deploy/render-supabase`**. Render serves this branch with manual deploys; auto-deploy is disabled.

The currently deployed runtime still contains the rejected six-beat onboarding + progressive Signal 1 implementation. Do not describe that runtime as accepted or 9/10-quality. It remains useful only as an implementation reference while the story/first-touch layer is redesigned.

Existing hosted capabilities remain: private login/recovery, password visibility controls, read-only previous-signal review, learner-scoped Reset all progress, server-authoritative progression/evidence, PostgreSQL/Supabase hosted state, and the private test-player path.

## Acceptance authority

The current user is the sole real product reviewer during private refinement. Their verdict overrides story critic, game critic, learning critic, automated review, and historical scores. Critic >=9 means only that a candidate may proceed to the next gate / user review. Only explicit user acceptance produces `user_accepted`.

No external users/testers or broader rollout are authorized before the current user's acceptance and later explicit authorization.

## Scope / safety boundaries

This remains private Phase 1 refinement. The new story-generation contract documents future course-generation behavior but does **not** authorize Phase 2/3 implementation, new model integration, untrusted runner work, external testers, paid provisioning, or public rollout. Hosted Auth, RLS, learner isolation and evidence-integrity boundaries remain in force.

## Historical verification

Runtime candidate `416a463b07015b98fd8915f2c890c56f9e74900b` passed GitHub Actions run `34376435686`; later docs heads also passed CI and were deployed. Those green checks establish implementation correctness, not story quality or user acceptance. The user's 3/10 first-touch verdict is the current product truth.
