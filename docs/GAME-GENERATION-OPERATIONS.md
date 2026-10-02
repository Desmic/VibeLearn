# VibeLearn game-generation operations

> **Historical (3 Oct 2026).** Written for the earlier PlayCanvas game and its review process. The current game is `experiments/bellweather-arcade`; see "Current direction" in `AGENTS.md`. Ideas here may still help; instructions here are not binding.


**Adopted direction, 27 September 2026.** This is an operational interpretation
for the user-supplied *VibeLearn 3D Game Generation — Operational Architecture
v3*, incorporating the accepted review in
`docs/REVIEW-20260926-OPERATIONAL-ARCHITECTURE-V3.md`. The submitted proposal
remains unchanged. This document does not authorize a provider,
live dispatch, deployment, Level 2, or a change to any existing gate.

`AGENTS.md`, `CODEX.md`, `docs/STATE.md`, the approved learning design and
existing critic/release policies remain authoritative. In particular,
`docs/STATE.md` owns the **current candidate, exact SHA, unresolved findings and
next gate**; no SHA or verdict in this architecture document overrides it.
`main` remains the canonical development destination. The pinned
`deploy/render-supabase` branch has a separate promotion policy.
The referenced v2 architecture and “God's Eye” research are not available in
the tracked checkout; this document is self-contained and does not make either
an execution dependency.

## 1. Product and authority

VibeLearn aims to create personalized learner-facing games on demand. The
current LLM adventure is a proof of both game quality and reusable boundaries,
not a template every future game must resemble. Canonical versioned learning,
story, rules, world and runtime specifications own meaning, behavior,
progression and stable semantic IDs. Assessment evidence has its own authority:
rendering, reward, self-report or completion does not establish mastery. The
active gameplay renderer is PlayCanvas; Three.js is legacy.

External assets and model outputs may propose appearance or geometry. They do
not assign quest roles, decide learner outcomes, replace rules or rewrite a
saved assessment. A candidate release binds the selected source assets,
transformations, specs and runtime. New source or resolver results create a new
release candidate; they never silently mutate an existing save or its evidence.

## 2. What exists, what is conditional, what is research

| Status | Capability and permitted use |
| --- | --- |
| **Implemented now** | Bounded PlayCanvas runtime and semantic world entities; deterministic learning rules; reviewed design gate; a small pinned asset-ingestion/provenance path; shared world-marker and contextual-presentation mechanics; real-play/browser checks; immutable attempts/evidence; Phase 0 versioned adapter to the separate Terminal PM Agent. These are working mechanisms, not proof of automatic game generation or an accepted game. |
| **Add when a concrete repair needs it** | A small semantic/style asset catalog, only large enough for the observed asset gap; an artifact-level world-source request/result boundary with authored world as its first source; conditional Blender transformation when a particular candidate requires it. Prove replacement on a materially different fixture without calling that fixture a second accepted game. |
| **Experimental, outside the critical path** | HY-World or another world generator, splat/SOG plus voxel/collision ingestion, automated semantic perception, generated motion/audio, and visual pre-screening. Each needs a scoped rights/performance/quality experiment and an explicit promotion decision. No model is mandatory. |

The repository's conceptual `EngineCompiler` chain and a future on-demand
authoring system are architecture direction, not currently complete automation.
Upstream PlayCanvas features do not imply that our pinned runtime supports
them. In particular, the current runtime supports container assets and box
collision bounds; splat rendering and generated collision require a separate
compatibility, load/dispose and traversal trial on the pinned engine.

## 3. Design and build one playable experience at a time

Start with the learner's goal, audience and device constraints. Develop the
learning outcomes **together with** player verbs, causal rules, decisions,
feedback, failure/recovery, tutorial boundary, progression, embodiment, world
topology and early art direction. Approve that exact integrated design before
implementation. A mechanic or teaching-sequence change reopens design review;
greybox success cannot approve a different design implicitly.

Use direct protagonist control for the present track. The journey is entry →
prologue → separate tutorial → Level 1 → later challenge/payoff. The prologue
earns the first attention/understanding gate, while the tutorial teaches reusable
play grammar and gives a clean success before Level 1. Define playable footprint,
negative space, prop density, sightlines, occlusion, landmarks and camera
clearance before increasing visual detail. Plan silhouettes and focal hierarchy
early; source or build finished assets only after the mechanic and world layout
show what is needed.

Primary information should arrive through world events, objects, spatial
markers and contextual prompts, with player-opened inspection when useful.
Accessible semantic controls may be world-anchored. Persistent detached work
panels cannot carry the main decision. Follow `docs/GAME-PRESENTATION-GUIDE.md`
and measure the exact candidate with `tools/check_presentation_budget.py` in
real play states.

## 4. Lean execution loop and ownership

The default loop is **one implementation worker → one independent reviewer →
evidence → accept or repair**. The worker owns a coherent player-facing slice
end to end: define observable success, implement shared mechanics with
story-specific data kept separate, run focused and required integrated checks,
actively play the affected journey, repair routine failures, preserve evidence,
and prepare an exact candidate. The worker escalates only a true blocker, a
major design or policy choice, or a gate that cannot be met. A failed test or
ordinary GUI defect stays with the worker through recheck.
For the present work, GPT-6 Sol owns implementation, routine verification and
bounded GUI replay. Reserve GPT-6 Astra for genuinely hard implementation
ambiguities and the separate fresh-context experience criticism; do not pass
routine defects upward merely because they take several iterations.

The reviewer independently challenges the candidate and attempts to reproduce
or disprove findings. A deterministic check may settle a dispute; do not add a
second agent just to vote. For the current game, **one fresh-context GPT-6 Astra
reviewer plays once across all critic lanes**. Story, art/world direction,
gameplay and learning remain separate judgments, each able to block; art/world
direction is mandatory. The cold observer records what the experience actually
communicated before receiving creator rationale or design intent. The later
intent comparison uses those cold observations, never retroactively fills gaps.
On return, the implementation worker attempts to reproduce or prove each
actionable reviewer finding before a repair or reasoned dispute, then replays
the affected behavior on the changed candidate. Screenshots, video recordings,
action traces and tests complement live play; they do not replace it. Distinguish
media **captured** from media actually **inspected** when making a claim.
Physicality requires interaction, motion requires observation over time, and
audio quality requires listening. If a modality is not assessed, record
**unassessed**, not passed. The present motion/audio deferral remains an
unassessed scope limit; it cannot turn into a pass without an explicit scope
change and the required observation/listening.

Use the existing Codex session for current execution. Terminal PM Agent is a
future separate orchestrator reached through the implemented Phase 0 adapter;
its recorded `live_run_authorized=false` forbids live dispatch. Do not copy its
internals, add a permanent agent fleet, or introduce a new provider pipeline for
this game. More machinery must be justified by a safety/correctness invariant or
observed recurring run failure.

## 5. Asset and optional source boundaries

The Sky Reach play study (`experiments/20260928-sky-reach-play-study.md`) also
motivates a bounded procedural source option: validated modules/assets arranged
by deterministic rules under the approved topology and style. Compare this with
authored assembly before assuming an external world model is needed. Reuse engine
features/libraries where suitable. Pin seed, generator version, parameters and
output identity; preserve learning semantics and saves across regeneration.
Validate reachability/readability and play contrasting layouts before treating
variation as a reusable capability. This is a next-design option, not an implemented
generator or authorization for an additional platform-building workstream.

Resolve commodity assets from pinned, validated packages when possible; reserve
bespoke work for learning-critical objects, distinctive characters and
landmarks. A style family should constrain silhouette, materials, palette,
lighting, animation, HUD and audio without forcing different stories into one
reskin. Keep provenance per exact acquired package: permitted acquisition,
internal storage, transformation, redistribution and finished-game use are
different rights. Existing pinned Quaternius binaries retain their recorded
CC0 provenance; newly acquired Quaternius packages need their own terms. Mixamo
animation suitability depends on the rig. Blender is a conditional transformer,
not a semantic authority or mandatory step.

If a world-source boundary becomes necessary, start with one small artifact
request/result, not a provider framework. The result records design/request
identity, provider and version, immutable output hashes, units/axes and bounds,
supported formats, semantic-anchor mapping, license/provenance,
transformations, validation findings and unresolved constraints. It can return
**unsupported, failed or partial** as well as successful. Budget, timeout,
cancellation, retry and effect reconciliation belong to the existing execution
contract; this document does not create another orchestrator.

Generated worlds and splats are controlled experiments until our pinned runtime
can load, dispose, collide and traverse them. Compare CPU and GPU load, frame
times, memory, download/startup cost, idle/hidden behavior and cleanup on fixed
devices and viewport/quality settings. Derive numeric limits from a recorded
baseline. Compare **total time to an acceptable playable game**, including
conditioning, semanticization, integration, criticism and repair, not visual
novelty alone. HY-World 2.0's applicable license also restricts outputs outside
its defined territory; an experiment in India does not clear worldwide delivery.
Pin exact model/provider terms before any such trial.

## 6. Current decision and next action

`docs/STATE.md` owns the exact candidate, technical evidence, current findings
and next gate. The approved nine-step learning design has implementation-stage
approval, but runtime alignment and user acceptance remain separate. Repair
concrete blocking reviewer findings within that design, or reopen it when a
teaching sequence or mechanic must change. Repeat affected checks and the
exact-candidate presentation report, preserve the first cold account, and
obtain the required schema-v2 criticism, alignment judgment and user's final
experience verdict. Local `/` may redirect into the game; hosted entry and
authentication require their own exact-candidate evidence. Motion and audio
remain unassessed until the required observation and listening occur or review
scope explicitly changes. No Level 2, merge to `main`, or deployment promotion
follows from this architecture adoption or from technical passes.

After the experience gate, add a small asset/style catalog or source adapter
only when a demonstrated bottleneck warrants it. Research outputs remain beside
the production path until their measured benefit, rights and runtime behavior
justify promotion.
