# VibeLearn game-creation platform — product direction

**Current platform checkpoint — 19 September 2026:** The current proof candidate is `471de882a01690fa50ac39455ad603fffd39cfdc` with exact run `35440122451`. Phase 0 of the thin Terminal PM adapter is **implemented and merged**, not merely a future target; live Phase 1 integration remains blocked by Terminal PM's own `live_run_authorized=false` policy. The next proof obligation is independent critic execution + human review, not broader generator/orchestrator expansion.

**Active product direction — 17 September 2026.** The primary product is learner-facing: a learner requests a goal and VibeLearn creates a personalized game on demand. This supersedes a creator-operated studio as the first customer experience. Read with `LEARNER-ON-DEMAND-AND-REPAIR.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `GAME-RUNTIME-ARCHITECTURE.md`, `GAME-AS-COURSE.md`, `GAME-OPENING-PROGRESSION.md`, `ART-WORLD-DIRECTION-CRITIC.md`, `CRITIC-POLICY.md` and `STATE.md`.

## North star

VibeLearn is a **learner-facing platform for creating personalized, high-quality learning games on demand**, not a single game or an authoring tool the learner must operate.

An internal creator/review workbench supports production and diagnosis. The learner should be able to describe what they want to learn, shape the experience conversationally, play, resume and request improvements without configuring scenes, repositories or deployments.

The current How-LLMs-Work track is the proof case. Its purpose is to prove that the product can combine:

- compelling game feel and story;
- rigorous learning mechanics;
- reusable world/runtime primitives;
- reusable assets and archetypes;
- fast iteration and deployment;
- evidence-aware assessment;
- critic/review loops that catch product failures before a learner sees them.

Do not broaden into a universal generation product before the current proof track is genuinely good. Build its useful boundaries now and verify reuse with small different fixtures. One excellent authored game alone does not establish on-demand personalization: a later bounded learner-facing slice must prove request -> personalized design -> verified playable release. Avoid both premature universal-engine work and hard-coding the proof track as the platform.

## Learner journey and personalization

The primary journey is `learning request -> relevant learner context and explicit preferences -> personalized brief -> assembly and verification -> play -> resume/adapt`.

Personalization includes practice depth, prerequisites, scaffolding, pacing, mechanic fit and creative direction, not just names or colors. Keep confirmed preferences, inferred assumptions and unknowns distinct. Ask only useful clarifying questions and support a bounded 'surprise me' route. Preserve durable learner evidence independently of story or package replacement.

Recommended delivery is a coherent verified first playable segment, with further generation at safe boundaries; this is not a promise of instant generation or permission to expose unfinished scenes. Exact generation budgets and first-playable size remain open. See `LEARNER-ON-DEMAND-AND-REPAIR.md` for the owning contract.

## What should be reusable

A future game should be assembled mostly from versioned specs, assets and mechanics rather than fresh renderer/application code.

Reusable layers should include:

- world/environment kits and configurable layout templates;
- character rigs, animation sets and control profiles;
- player-embodiment modes: direct protagonist control, separate avatar, external guide, cursor/strategy control, etc.;
- cinematic/story beats such as reveal, arrival, interruption, teleport, threat, rescue, reunion and payoff;
- lighting/weather/atmosphere state transitions;
- cameras, transitions and focus rules;
- doors, gates, rooms, bridges, lifts, routes and traversal primitives;
- interaction, collection, scanning, repairing, building, choosing, sequencing, prediction and inspection mechanics;
- tutorial/scaffolding patterns;
- progression/recovery/replay/save semantics;
- HUD/input/accessibility patterns;
- sound/music cue lifecycle;
- assessment/evidence adapters independent of the fiction;
- CI/browser/critic evidence templates.

Reusable does **not** mean visually identical. A world kit must expose composition, spacing, scale, density, material, lighting and dressing parameters so multiple games can feel materially different.

## Player embodiment must be explicit

Never infer a literal player avatar because the story says “you help X.” `GameDesignSpec` / `RuntimeExperienceSpec` must explicitly declare who the player controls and how the player exists in the fiction.

For the current LLM rescue proof track, the revised direction is **direct protagonist control**: the player controls the robot protagonist itself. There is no separate literal helper character unless a later design explicitly requires one.

This distinction must be visible in story, camera, controls, dialogue and tutorial design.

## Spatial-composition contract

The September 17 review found the current play area congested: the same content would feel substantially better if distributed over a larger footprint.

Future world generation therefore needs explicit spatial parameters and review:

- playable-area scale;
- prop/character density;
- minimum negative-space budget around focal interactions;
- landmark spacing;
- path width and traversal breathing room;
- camera collision/occlusion margin;
- phone and desktop composition budgets;
- maximum concurrent focal objects;
- alternate-camera intersection/occlusion checks.

Do not respond to visual weakness by adding more props. Larger, calmer space is often the higher-quality choice.

## Story and cultural inspiration

Story ideation should actively learn from games, films, animation, literature, mythology and contemporary culture. Extract techniques—character hooks, reversals, silhouettes, pacing, humor, naming rhythm, visual motifs—not copies.

Pop-culture-informed naming and jokes may be explored during ideation. For example, a playful robot name with the recognizability of a “Wall-G”-style homage can be considered as a creative direction, but shipping characters, names, designs, dialogue, music and assets should remain original and should not depend on confusing similarity to an existing property.

References are optional reward layers. A learner who recognizes none of them must still understand the story and play.

## Art/world direction is a separate product discipline

A technically correct WorldSpec can still produce a bad place. Every serious candidate requires an **art/world-direction critic** in addition to story, gameplay and learning critics.

That critic owns spatial composition, scale, negative space, silhouettes, visual hierarchy, palette/material cohesion, landmark readability, world density, prop placement, clipping/intersection, camera framing, environmental storytelling, atmosphere and whether reusable assets look intentionally composed rather than procedurally dumped.

See `ART-WORLD-DIRECTION-CRITIC.md`.

## Conversational improvement — future capability

A learner can flag an issue or request a change through chat from the experience itself. The agent must inspect the reported version and context, investigate, decide whether a change is appropriate, make an isolated change when justified, verify the original problem and regressions, then apply it safely and report the result.

This is a full repair loop, not merely a feedback inbox and not blind obedience to a requested patch. Personal preferences, accessibility problems, actual defects, intentional challenge and uncertain reports need different responses. A subjective complaint is still real feedback; a missing reproduction is not grounds to dismiss it.

Scope personal changes separately from shared assets/mechanics/runtime. Protect active saves and assessment history; report chat is not permission to reset progress or change everyone else's game. Autonomy thresholds are a proposed policy to agree, not blanket deployment permission. `LEARNER-ON-DEMAND-AND-REPAIR.md` owns detailed context, judgment, verification and rollout requirements.

## Automated agent system — approved bounded integration

The platform should eventually support coordinated agents for:

- research/source gathering;
- game/story ideation;
- narrative design;
- art/world direction;
- game/mechanic design;
- learning design;
- implementation/world compilation;
- asset selection/generation;
- story critic;
- art/world critic;
- gameplay critic;
- learning/transfer critic;
- test generation;
- CI/CD/release orchestration;
- learner-facing issue triage and verified repair.

Agents must communicate through versioned artifacts/specs and evidence, not hidden assumptions. A creator agent must not self-certify its own work. Critic agents are internal tools, not substitutes for the user's product judgment. One learner-facing conversation may route to specialists without forcing the learner to choose a developer or critic agent.

The orchestration foundation is now an **approved contract-integration target** with the existing Terminal PM Agent, which remains under active development as a separate external orchestrator. See `AUTOMATED-DEVELOPMENT-SYSTEM.md`. Do not implement the role list above as a fleet of permanent agent types: ordinary work should default to one economical worker and one independent reviewer, with reviewer claims implicitly requiring attempted proof/reproduction. Story, art/world, gameplay and learning remain separate evaluation disciplines over shared evidence semantics. VibeLearn should define a thin versioned adapter and outcome/evaluation boundary, not copy Terminal PM Agent's moving execution/session/verifier/recovery internals. Deeper code-level reuse is deferred until the relevant orchestrator boundary is stable or real integration evidence shows the external contract is insufficient. Internal automation remains subordinate to the learner-facing product and does not authorize autonomous production deployment.

## Current proof-track gate

The current track should prove this sequence:

`learning goal -> researched story/world ideation -> art/world direction -> game design -> reusable spec/world assembly -> playable prologue -> separate tutorial -> Level 1 -> technical CI -> story critic -> art/world critic -> game critic -> learning critic -> user review`

A failure in one discipline is not averaged away by strength in another. The private proof's explicit user review remains required. How routine personalized releases will be approved at scale is a later release-policy decision, not a requirement that every learner operate a studio.

## Extraction rule

After each accepted chunk, ask:

1. What was story-specific and should remain data?
2. What mechanic/runtime capability is reusable?
3. What asset/archetype can be parameterized?
4. What critic/test should become a platform invariant?
5. Can the same reusable piece create a materially different game/world without copying this track's nouns or layout?

Extract only capabilities proven useful by real game needs. Avoid speculative framework growth.


## Narration capability

The game-creation platform should support narration as a replaceable presentation
capability, not as a mandatory global style.

A generated game's design/runtime spec should be able to declare whether it uses:
- no narrator;
- text narration;
- narrator voice with synchronized text/subtitles.

Narrator voice is especially appropriate to consider for opening scenes,
transitions and major events, but the creative/story agent must choose it based
on the game's tone, audience and pacing rather than applying it mechanically.

The current LLM proof track stays on text narration during this review. Future
voice support should preserve:
- accessibility/subtitle parity;
- muted-play comprehension;
- provider/model/TTS independence;
- separate preferences/volume where needed;
- deterministic canonical story text independent of synthesized performance.

Voice narration does not relax the visual-storytelling contract. Generated worlds
must still communicate setting, activity, action and consequence through their
own visuals and motion.

## Evidence-first quality system

`EXPERIENCE-QUALITY-SYSTEM.md` is a first-class platform contract.

Future game creation should produce reviewable artifacts/specs for:
- cold-start comprehension;
- major-event causality;
- semantic-object readability;
- animation direction;
- physicality/collision;
- mode transitions/handoffs;
- tutorial steps;
- learning/transfer.

The platform should prevent structurally invalid experiences where feasible
(schema/runtime constraints), then use independent critics for judgment/taste.
Do not encode every current-game failure as a special case; extract the reusable
contract and prove it in this game plus later materially different games.
