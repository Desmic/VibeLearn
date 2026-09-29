# VibeLearn 3D Game Generation — Operational Architecture v3

**Purpose:** Give implementation agents one clear production path for VibeLearn today, while keeping promising world-model/ML work in explicit research lanes that cannot silently become production dependencies.

**Status:** Agent-facing execution architecture. This refines, rather than replaces, `VibeLearn_3D_World_Game_Generation_Architecture_v2.md` and the repository's existing architecture. The v2 document remains the deeper rationale/reference; this document is the operational version agents should follow.

**Repository basis (re-verified 26 Sep 2026):** `Desmic/VibeLearn`, with `main` at `aabb762725007fb4760420745cf81e1869305a14` (21 Sep 2026) and the fresher `docs-readthrough-20260921` branch at `9111d066a2909de12a30fc7ecc39b2afeed37fbc` (26 Sep 2026, 39 commits ahead of `main`, 0 behind, when re-verified). The newer branch contains the latest learning-design, presentation/HUD, browser-harness, and critic-gate work. Its current candidate remains explicitly `needs_revision`; branch freshness is not product acceptance.


**Verification snapshot — 26 Sep 2026:** Before regenerating this file, the operational assumptions below were rechecked against the current repository and authoritative upstream documentation. The repo still defines PlayCanvas as the active backend, engine-neutral canonical specs above it, learning design before implementation, world-first/contextual presentation, exact-candidate evidence, and no Level 2 before the existing review/user gates. PlayCanvas documentation currently confirms native Gaussian-splat support plus SOG/Streamed-SOG tooling and splat-to-voxel/collision generation; these capabilities remain optional implementation details rather than new canonical game semantics. Tencent's current HY-WORLD 2.0 community license defines the Territory as worldwide except the EU, UK, and South Korea, so India is inside the Territory, while use/display of HY-WORLD outputs outside that Territory is restricted. Free-asset source assumptions were also rechecked: Kenney and KayKit remain CC0; Poly Haven and ambientCG remain CC0; Quaternius' current QAL permits commercial product use without attribution while forbidding standalone asset redistribution; Mixamo remains free/royalty-free for commercial game use with an Adobe ID; and the Sonniss GDC bundle remains royalty-free/commercially usable with no attribution. Provider-specific terms must still be snapshotted at ingestion time.

---

## 0. Read this first: binding production path vs research lanes

Agents must distinguish two categories.

### A. Production path — implement/use now

These are current architectural choices:

- canonical VibeLearn specs remain the source of game/learning truth;
- PlayCanvas remains the active browser/mobile runtime;
- reusable game capabilities are extracted from real game needs;
- asset sourcing is semantic and reuse-first;
- trusted free libraries are preferred for commodity assets;
- Blender is a conditional transformation/validation tool, not a required hop;
- world-generation providers sit behind a replaceable `WorldSourceAdapter`;
- HY-World may be used for controlled world-generation experiments and builds where its applicable terms permit it, but must not become a mandatory dependency;
- presentation remains world-first with minimal HUD and contextual interaction;
- all serious candidates pass actual play, evidence, critics, and user review.

### B. Research lanes — do not implement into the shipping path by default

Promising technologies such as semantic perception stacks, alternative world models, pixel-interactive world models, generated human motion, and new 3D reconstruction systems belong here until an experiment demonstrates that they improve a current bottleneck.

**Rule:** Research may produce evidence, prototypes, benchmarks, or adapters. It may not mutate canonical learning/game rules, become a required runtime dependency, or expand the permanent agent topology without a promotion decision.

---

# 1. Product and repository truths

VibeLearn is a **learner-facing platform that creates personalized learning games on demand**, not a single campaign and not an engine demo.

The current LLM game is the proof case. It must prove both:

1. a genuinely engaging game/learning experience; and
2. reusable production/runtime capabilities that reduce the cost of later games.

The repo already defines the durable engine-neutral chain:

```text
LearningSpec
  -> StoryWorldSpec
  -> GameDesignSpec
  -> GameRulesSpec
  -> WorldSpec
  -> RuntimeExperienceSpec
  -> EngineTargetSpec
  -> EngineCompiler
  -> EngineRuntime
```

`AssessmentEvidenceSpec` remains a separate authority. Game completion does not equal learning mastery.

The current design process also already requires:

- learning design before implementation;
- world-anchored/contextual primary interaction;
- world-first presentation rather than detached game-as-website panels;
- PlayCanvas-only active gameplay (no Three.js or playable 2D fallback);
- separate cold-observer and intent-aware criticism;
- story, art/world, gameplay, learning, technical and accessibility evidence;
- exact-candidate verification;
- no Level 2 before the complete Level 1 path is accepted.

Do not create a parallel architecture that ignores these contracts.

---

# 2. The production architecture to use today

The simplest useful architecture is:

```text
Learner / learning goal
        |
        v
Learning + game design specs
        |
        v
World topology + art direction
        |
        +-------------------------------+
        |                               |
        v                               v
WorldSourceAdapter                 AssetResolver
        |                               |
  visual world candidate          reusable assets
        |                               |
        +---------------+---------------+
                        |
                        v
                 WorldSpec + AssetManifest
                        |
                        v
               Reusable game runtime
                        |
                        v
                    PlayCanvas
                        |
                        v
                 actual play + evidence
                        |
                        v
              critics -> repair -> reuse
```

The important boundary is:

> **Models/providers may propose appearance, geometry, media, or candidates. VibeLearn specs own meaning, behavior, progression, learning, evidence, and semantic identity.**

This keeps PlayCanvas replaceable later and prevents a world generator from becoming the product architecture.

---

# 3. Design the game before generating the world

World generation must not begin from a vague prompt such as "make a beautiful fantasy valley."

The design sequence is:

```text
learning outcomes
    -> player verbs
    -> game systems / interactions
    -> encounter and progression structure
    -> world topology / curiosity graph
    -> art direction
    -> visual world realization
```

## 3.1 BOTW/Zelda is a gameplay/world-design reference, not a template

Borrow these principles:

- systems should create multiple meaningful ways to act;
- teach core capabilities early, then deepen mastery through combinations;
- the world should guide curiosity with landmarks, sightlines, occlusion, routes and reveals;
- progression should increasingly reflect player mastery, not only stat growth;
- use small, dense, purposeful spaces rather than copying BOTW's map scale;
- the world should usually communicate direction before the HUD does;
- important places need visible purpose, consequence and human/story stakes.

For generated Level 1, think **compact Great Plateau**, not enormous open world:

```text
opening / motivation
    -> bounded discovery zone
    -> movement + interaction + core mechanics
    -> first systemic problem
    -> meaningful route/choice
    -> changed-case application
    -> world payoff / transfer
```

World topology comes before terrain generation.

---

# 4. World sourcing: one production abstraction

Use one interface conceptually:

```text
WorldSourceAdapter.generate(WorldSourceRequest)
    -> VisualWorldCandidate
```

A request contains, at minimum:

- topology/zone constraints;
- landmarks and visibility relationships;
- traversable/non-traversable intent;
- important semantic anchors;
- scale and negative-space budgets;
- art direction/style family;
- target device/performance class;
- output format requirements;
- provenance/license policy.

Possible providers may include:

- current authored/modular PlayCanvas worlds;
- curated modular environment kits;
- HY-World;
- future persistent 3D generators;
- authored Blender output.

The provider is not referenced by gameplay code.

## 4.1 HY-World: use now, but behind the adapter

HY-World is useful for **visual environment generation**: landscapes, architecture, atmosphere and static world structure.

Use it today for controlled experiments/builds when its applicable terms allow the intended use. In India, the open HY-World 2.x territory restriction discussed in the current license does not exclude local use, but worldwide distribution constraints and hosted-product terms must be checked for the exact provider/version before shipping its outputs globally.

HY-World must not own:

- quests;
- learning semantics;
- player progression;
- interaction IDs;
- save/evidence state;
- authoritative collision/navigation meaning;
- assessment.

Preferred representation:

```text
visual background / static environment -> splat or mesh
interactive game objects              -> normal semantic mesh entities
```

For PlayCanvas:

```text
HY-World splat -> SuperSplat/SOG -> PlayCanvas GSplat
HY-World mesh  -> condition if needed -> GLB -> PlayCanvas
```

Do not force generated static scenery to become precise gameplay geometry when a semantic mesh layer is cleaner.

---

# 5. Asset Resolver: reuse first, generation second

Game/world design should request **meaning**, not a vendor/model.

Example:

```yaml
semantic_role: ancient_signal_device
importance: learning_critical
style_family: bellweather_stylized_adventure
animated: true
interaction_points: [scan, repair]
collision: precise
mobile_budget: hero
```

The `AssetResolver` chooses the source.

## 5.1 Resolution order

Use this order unless evidence shows a better one:

1. already validated VibeLearn asset;
2. approved asset from the current style family;
3. trusted free library;
4. free/local generation if the asset is genuinely missing or must be unique;
5. hosted/manual source if permitted and worth the cost;
6. Blender conditioning only when transformation is needed.

This avoids generating commodity assets repeatedly.

## 5.2 Fidelity follows semantic importance

Use four rough classes.

### Learning-critical / semantic hero

Examples: an object embodying token generation, a machine whose visible state carries the concept, a key causal story artifact.

Requirements:

- bespoke visual identity where needed;
- semantic-readability review;
- reliable collision/interaction points;
- strong mobile readability;
- more art/animation effort justified.

### Narrative hero

Important character, antagonist, landmark, emotional prop.

Requires distinctive silhouette/composition and stronger animation/art review.

### Gameplay archetype

Doors, pickups, common enemies, crates, switches, bridges.

Prefer reusable validated archetypes with skin/style variation.

### Environmental dressing

Rocks, barrels, generic foliage, distant buildings, clutter.

Aggressively reuse; do not spend generation/review budget unnecessarily.

## 5.3 Free sources worth curating today

Build an internal licensed/validated corpus from sources such as:

- Kenney;
- KayKit;
- approved Quaternius packages under their applicable license;
- Poly Haven;
- ambientCG;
- Mixamo for suitable humanoid rigs/animations;
- Sonniss GDC bundles for SFX;
- carefully filtered CC0/compatible assets from broader libraries when needed.

Do not let source/library names leak into game logic. Normalize them into VibeLearn semantic roles and style families.

## 5.4 Generated asset providers are optional gap-fillers

Do not make a specific image-to-3D/audio/music model part of the canonical architecture.

The production interface should support a **provider-cleared generated asset** when a validated library asset does not satisfy the requirement. The exact generator can change.

This protects us from rapid model/licensing churn.

---

# 6. Blender: conditional production tool

Blender is valuable, but **not every asset should pass through it**.

Use Blender when we need meaningful transformation:

- rigging/retargeting;
- animation cleanup;
- hero-asset modeling or kitbashing;
- LOD/decimation;
- collision proxies;
- pivot/scale/coordinate normalization;
- UV/material cleanup;
- texture baking;
- procedural asset families through Geometry Nodes;
- mesh cleanup after generation/reconstruction.

Skip Blender when a validated GLB is already correct for PlayCanvas.

Preferred rule:

> **Blender transforms candidates into runtime-ready assets; it does not own gameplay semantics.**

All derived assets retain provenance back to their source and transformations.

---

# 7. Style families are mandatory for coherent generated games

Do not assemble a game from arbitrary individually-good assets.

A style family should define compatible choices for:

- character language;
- environment/architecture;
- prop shape language;
- materials/textures;
- palette;
- lighting/atmosphere;
- VFX;
- animation tone;
- UI/HUD treatment;
- audio identity.

Example conceptually:

```text
StyleFamily: stylized-adventure-A
  characters: validated family A
  architecture: modular family A
  vegetation: compatible family A
  hero assets: bespoke/generated then art-reviewed
  animations: normalized semantic library
  materials: controlled palette/material rules
  lighting: VibeLearn preset A
```

The Asset Resolver searches inside the active style family first.

---

# 8. Presentation/HUD: use the repository's current rules

The newest VibeLearn presentation work is stronger and more specific than a generic HUD framework. Follow it.

Primary gameplay information should prefer the lowest usable rung:

1. world event;
2. world object;
3. ephemeral spatial marker;
4. contextual prompt;
5. transient status line;
6. player-opened focused panel;
7. blocking overlay only when actually necessary.

Use the God’s Eye research as **mechanism inspiration underneath these rules**, particularly for:

- stateful reticle/crosshair;
- shared world-overlay host;
- world-to-screen projection;
- target brackets;
- sticky label placement;
- priority/declutter;
- safe/reserved UI regions;
- dark under-strokes/backing for readability;
- screen-edge cues.

Do not copy its dense intelligence UI aesthetic into every game.

The game declares semantic meaning; the HUD runtime decides presentation.

Example:

```text
mark(target, role=objective, importance=80)
focus(machine, role=interactable)
reticle(state=available_action)
```

not:

```text
drawCyanBracketAt(x,y)
```

---

# 9. Production workflow agents should follow

## Stage 0 — resolve repository authority

- inspect `main` plus fresher relevant branches;
- read current `STATE`, architecture, learning-design, presentation and critic docs;
- do not resurrect superseded 2D/Three.js paths;
- record exact candidate/branch/SHA.

## Stage 1 — learner/experience brief

Define:

- learning goal;
- audience/prerequisites;
- device/session constraints;
- creative preferences;
- intended emotion/fantasy;
- unsupported assumptions.

## Stage 2 — learning design gate

Before building gameplay, establish:

- observable outcomes;
- misconceptions;
- worked examples;
- player decisions;
- feedback;
- transfer/change case;
- assistance/evidence boundaries;
- attention/presentation surfaces.

Review the exact design before implementation.

## Stage 3 — game design

Define:

- core fantasy;
- verbs;
- systemic rules/"chemistry";
- progression;
- encounter graph;
- failure/recovery;
- tutorial boundary;
- Level 1 payoff;
- player embodiment.

## Stage 4 — world topology / curiosity graph

Before art/world generation, define:

- zones;
- landmarks;
- sightlines;
- reveals/occlusion;
- routes/choices;
- purpose of each important place;
- semantic anchors;
- traversal/negative-space budgets.

## Stage 5 — greybox the critical gameplay

Use PlayCanvas primitives/reusable systems to prove:

- movement/camera;
- physicality;
- key interactions;
- learning mechanic;
- systemic challenge;
- handoffs/progression.

Do not wait for finished art to learn whether the game works.

## Stage 6 — art direction and sourcing

In parallel after topology stabilizes:

- choose style family;
- resolve commodity assets from the corpus;
- generate/source only missing/unique assets;
- optionally generate a HY-World visual environment;
- condition assets with Blender only when needed.

## Stage 7 — compile semantics into the world

The running world must explicitly know:

- semantic IDs;
- colliders;
- navigation/traversal intent;
- interactables;
- triggers;
- cameras;
- animation roles;
- gameplay state mappings;
- learning/evidence hooks.

Never infer critical game meaning at runtime solely from generated pixels/geometry.

## Stage 8 — presentation integration

Apply:

- contextual world-first interaction;
- minimal HUD;
- stateful reticle where useful;
- shared world-marker arbitration;
- mobile/desktop presentation budgets;
- 200% text/accessibility behavior;
- reduced-motion/muted-play equivalence where required.

## Stage 9 — cheapest verification first

Run narrow tests for the changed capability before broad suites.

Then verify:

- mechanics/rules;
- collision/physicality;
- save/reload;
- UI/presentation budgets;
- 360/390/430 phone behavior + desktop;
- 200% text;
- audio state if touched;
- asset/performance budgets;
- exact-candidate identity.

## Stage 10 — actual play and criticism

Cold reviewer first:

```text
What is this place?
Who/what matters?
What happened?
What should I do?
What can I do?
What did my action cause?
What did I learn?
```

Then compare observed experience with intended design.

Keep story, art/world, gameplay, learning, technical/accessibility judgments separate. Do not average away a blocker.

## Stage 11 — extract reuse only after evidence

After a capability works in the actual game:

- separate game-specific data from reusable behavior;
- define a semantic/configurable API;
- add tests and evidence hooks;
- prove it does not depend on current story nouns/layout;
- promote it to the reusable runtime/corpus.

---

# 10. What we should implement/use now

Keep the production capability set intentionally small.

## Required/current

1. **PlayCanvas runtime and reusable primitives**
2. **Canonical VibeLearn specs and learning/evidence gates**
3. **World topology/curiosity design before visual generation**
4. **WorldSourceAdapter boundary**
5. **AssetResolver + style-family metadata**
6. **Validated free asset/audio/animation corpus**
7. **Conditional Blender conditioning pipeline**
8. **Optional HY-World world-source experiment behind the adapter**
9. **World-first presentation + contextual HUD/reticle/marker runtime**
10. **Actual play + critic/evidence/repair loop**

That is enough to materially accelerate the product without building a research platform.

---

# 11. Research lanes — separate and non-blocking

These are **not production requirements**. Each lane exists because it may remove a specific bottleneck later.

## R1 — Generated-world semanticization

**Question:** Can ML reliably turn a generated visual world into useful semantic candidates and reduce manual world setup?

Potential tools to benchmark:

- open-vocabulary detection/segmentation stacks such as Grounding DINO + SAM-class models;
- depth/spatial reconstruction models such as Depth Anything/VGGT-class systems;
- open VLMs for structured scene inspection.

Research output only:

```text
SemanticCandidate {
  proposed_role,
  bounds/position,
  confidence,
  evidence
}
```

It must never automatically become authoritative quest/game meaning.

**Promotion gate:** demonstrate a significant reduction in semanticization/setup time on at least two materially different worlds with low harmful false positives and deterministic validation.

## R2 — Alternative persistent world generators

**Question:** Is another open/free world source faster, easier to license, easier to edit, or better for mobile than HY-World/modular authoring?

Candidates can include WorldGen-class systems and future persistent 3D world models.

**Promotion gate:** same `WorldSourceRequest`, materially better time-to-good-game or licensing/operational profile, clean adapter integration, and acceptable runtime performance.

## R3 — Interactive/video world models as previsualization

Examples include Matrix-Game/Oasis/Cosmos-like systems.

Possible role:

```text
GameDesignSpec
  -> interactive visual sketch
  -> design/critic observation
  -> decide whether to implement
```

They must not own canonical game rules, saves, learner evidence or final runtime state.

**Promotion gate:** show that previsualization avoids meaningful implementation waste or improves a difficult creative decision often enough to justify its cost.

## R4 — Advanced 3D asset generation/reconstruction

Candidates include TRELLIS/SAM-3D-class systems and future permissively licensed equivalents.

Use case: unique learning-critical/narrative objects when the corpus cannot satisfy the requirement.

**Promotion gate:** clear licensing for the exact stack, reliable GLB/PBR output, lower end-to-end asset cost than manual alternatives, and acceptable semantic/art quality after conditioning.

## R5 — Generated motion

Text-to-motion models may fill rare animation gaps.

Keep library/retargeted animation as the default.

**Promotion gate:** better total result than composing/retargeting existing clips, with acceptable skeleton/retarget/license behavior and motion-critic approval.

## R6 — Generated audio/music/voice

Research/local models can fill unique SFX, score and narration gaps.

Today, libraries remain the preferred default for commodity SFX and common needs.

**Promotion gate:** clear commercial terms, predictable latency/cost, quality above library alternatives for the targeted gap, and deterministic retention of canonical text/cue intent.

## R7 — Open VLMs as cheap visual workers

Potential use:

- pre-screen captures for clipping/overlap/obvious visibility failures;
- structured scene inventory;
- cheap evidence gathering before expensive creative review.

They do **not** replace deterministic tests or the final experience critic.

**Promotion gate:** measured reduction in reviewer cost/time without increasing missed blockers.

---

# 12. How research gets promoted into production

No research tool enters the normal path because it looks impressive.

A promotion record must answer:

1. **Which current bottleneck does this solve?**
2. **What baseline was it compared against?**
3. **What measurable improvement occurred?** Time, quality, cost, editability, performance, failure rate, or reviewer burden.
4. **What new failure modes/complexity does it add?**
5. **Are licensing/data/output terms acceptable for our intended distribution?**
6. **Can it sit behind an existing adapter instead of changing canonical architecture?**
7. **Does it work on more than the current Bellweather/LLM proof case?**
8. **What deterministic validation surrounds it?**
9. **Can we remove/replace it later without breaking learner history/game semantics?**

Default decision when evidence is weak: **keep researching; do not promote.**

---

# 13. Immediate implementation priorities

Agents should not start seven AI-model integrations.

The next system work should focus on the smallest capabilities that compound immediately:

### Priority 1 — stabilize current product gates

Continue the current learning/presentation/gameplay corrections on the freshest relevant branch. Do not use architecture work to avoid the current proof-game quality gate.

### Priority 2 — asset corpus + resolver pilot

Create a small curated corpus, not a giant scraper:

- one coherent environment/style family;
- common gameplay props;
- normalized animation vocabulary;
- core SFX categories;
- provenance/license metadata;
- performance metadata;
- semantic tags.

Prove retrieval/reuse on the current game and Harbor Relay/another different fixture.

### Priority 3 — define `WorldSourceAdapter` at the artifact level

Start with a minimal request/candidate record. Avoid provider-specific fields in canonical specs.

Use the existing authored/modular world as provider A.

Use HY-World as provider B for one controlled comparison if practical.

### Priority 4 — measure the HY-World experiment

Hold fixed:

- learning design;
- game rules;
- semantic anchors;
- topology intent;
- interactions;
- critic standards.

Compare:

- time to candidate;
- cleanup/conditioning time;
- semanticization effort;
- visual/world quality;
- mobile performance;
- collision/navigation setup;
- editability;
- critic findings;
- total time to acceptable playable result.

The winning metric is **time-to-good-game**, not visual novelty.

### Priority 5 — improve HUD/runtime only from observed needs

Implement/refine:

- stateful reticle;
- shared marker/world-overlay host;
- priority/declutter;
- safe-area/focal avoidance;
- screen-edge recovery;

only where current play shows a need. Do not import the full God’s Eye complexity upfront.

---

# 14. Do not build now

Unless new evidence changes the decision, do **not**:

- replace PlayCanvas;
- build an Unreal backend now;
- make HY-World mandatory;
- build a universal semantic-perception service;
- integrate multiple world models at once;
- build a permanent fleet of specialized AI agents;
- generate every asset from scratch;
- route every asset through Blender;
- let a VLM decide canonical game semantics;
- use pixel/world-model simulation as final learner runtime;
- make Level 2;
- weaken current critic/presentation tests to accommodate new tooling.

---

# 15. Hard invariants

1. **Learning truth stays engine/model independent.**
2. **Game rules and semantic identity stay in VibeLearn canonical specs.**
3. **PlayCanvas remains the active runtime until evidence justifies another backend.**
4. **World generators produce candidates, not authority.**
5. **Asset sourcing is reuse-first and style-constrained.**
6. **Learning-critical objects receive more fidelity/readability scrutiny than commodity scenery.**
7. **Blender is conditional.**
8. **Primary interaction is world-first/contextual, not detached dashboard UI.**
9. **No model or worker self-certifies its own output.**
10. **Actual play outranks source-level confidence.**
11. **Research cannot silently become a production dependency.**
12. **A new capability must earn complexity through architectural necessity or run evidence.**
13. **No user acceptance is inferred from tests, critic scores, or branch state.**

---

# 16. Compact architecture summary for agents

```text
                         LEARNER GOAL
                              |
                              v
                    LEARNING DESIGN GATE
                              |
                              v
                       GAME DESIGN
                 verbs / systems / progression
                              |
                              v
                WORLD TOPOLOGY + ART DIRECTION
                              |
                 +------------+-------------+
                 |                          |
                 v                          v
          WorldSourceAdapter            AssetResolver
       authored / kits / HY-World   validated reuse first
                 |                          |
                 |                   generator only for gaps
                 |                          |
                 +------------+-------------+
                              |
                        condition if needed
                       Blender / SuperSplat
                              |
                              v
                   WorldSpec + AssetManifest
                              |
                              v
                   REUSABLE PLAYCANVAS RUNTIME
                              |
                  world-first presentation/HUD
                              |
                              v
                         ACTUAL PLAY
                              |
                              v
                   EVIDENCE + COLD CRITIC
                              |
                              v
                  INTENT / DISCIPLINE GATES
                              |
                    +---------+---------+
                    |                   |
                  repair             accepted
                    |                   |
                    +----> reusable capability/corpus
```

Research lanes sit **beside** this diagram, never inside the critical path until promoted.

---

# 17. Decision summary

For the current phase, keep the system boring where boring is useful:

- PlayCanvas for the game;
- VibeLearn specs for meaning;
- BOTW/Zelda for systemic/world-design lessons;
- repository presentation rules + selected God’s Eye mechanisms for HUD;
- trusted asset libraries for commodity content;
- Blender only for real asset-processing needs;
- HY-World as an optional replaceable world source worth benchmarking now;
- actual play and evidence for truth.

Keep the fast-moving AI landscape in separate research lanes. Promote a model only when it demonstrably makes VibeLearn faster, better, cheaper, or easier to operate **without weakening portability, evidence integrity, licensing safety, or game quality**.

The operational principle is:

> **Use AI aggressively to propose and produce. Keep VibeLearn conservative about meaning, authority, and promotion.**

