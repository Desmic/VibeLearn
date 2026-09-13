# Signal 7 HUD blocker fix — candidate verification

The active target is `phase1/world-transfer` / PR #8, following candidate `44ea1ab0a5a2b8d5a07b2d9260ff2b71b27247f8`.
The `66340850e5097ef44d420529675d09e811a52109` transition assertion stabilization is retained (15 seconds; no product behavior change).

The Signal 7 help declaration and Clear route now share a responsive HUD row; the incident readout sits below it. The browser journey checks their separate rectangles and pointer targets, and clears/rebuilds the route on a 390px viewport before sealing the transfer. The first full run also exposed a sticky disabled help selector after command completion: button controls were re-enabled centrally, while the select was only ever disabled by sync. The selector now derives its enabled state from the same busy/pending/draft conditions on every sync. Existing progression, evidence, lost-acknowledgement and persistence checks remain required.

Per the current user instruction, the release gate for this bounded fix is full CI/browser verification and inspection of the exact candidate's desktop and 390px Signal 7 screenshots. Once green and visually reviewable, fast-forward `deploy/render-supabase` to that candidate, deploy manually (auto-deploy remains off), and verify Render's live revision. Only clear blockers belong in this iteration; no broad art/architecture or critic-scoring pass precedes this requested user review.

The next full CI run passed at `dcb8082`, but exact desktop/390px screenshot inspection exposed an unintended full-surface backdrop blur and phone clipping of incident facts. The transparent workbench no longer blurs its backdrop; the compact incident readout now fits all three facts between the controls and route. Browser checks protect this placement and visibility.

**Verification is pending at this source checkpoint. This is not product acceptance. The user's review is the next product gate.** The prior live checkpoint below remains historical context until the new deployment is verified.

---

# Current checkpoint — PlayCanvas preview deployed, Signal 6 continuation under verification

Updated 13 September 2026. **Status: `user_rejected` / `needs_revision` / preview available.** The user's predecessor 3/10 verdict remains authoritative until they explicitly review a materially changed candidate. A deployed preview is not an acceptance pass.

## Product direction

VibeLearn's objective is to generate **effective learning games/worlds for arbitrary concepts and subjects**, not course pages decorated with game UI.

The durable architecture is engine-neutral and spec-driven:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec + WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` stays separate from game-success truth and renderer truth.

PlayCanvas Engine is the first strategic backend. Three.js remains migration/reference infrastructure only.

Architecture authority:

- `CODEX-IMPLEMENTATION-PLAN.md`
- `docs/GAME-RUNTIME-ARCHITECTURE.md`
- `docs/GAME-RULES-SPEC.md`

## Live preview checkpoint

The user explicitly asked to inspect the current work before the >=9 quality gates are complete.

The Render service is currently serving exact source revision:

**`912f7a360dc67a277f0af222cdc6544e2afe29af`**

URL: `https://vibelearn-4xws.onrender.com/`

Render deploy id: `dep-daj8kiuk1f9s73cmcbt0`  
Render status at deployment verification: `live`  
Render service branch: `deploy/render-supabase`  
Auto-deploy: disabled.

`deploy/render-supabase` was fast-forwarded to the exact preview revision without force. That fast-forward caused draft PR #5 to be recorded by GitHub as merged at the same exact revision. This was done to make the user-requested preview available; it must **not** be interpreted as product acceptance.

The preview stays pinned while development continues on `phase1/playcanvas-engine`.

## Current development branch

Branch: **`phase1/playcanvas-engine`**  
Current continuation PR: **#6 — `Phase 1 continuation: world-owned Signal 6`**  
Base: deployed preview branch `deploy/render-supabase` at `912f7a3...`.

At the time of this checkpoint, the current development slice advances beyond the preview with:

- adapter package `pc-phase1-10` over the same `pc-phase1-9` authored WorldSpec;
- Signal 6 wide-valley camera instead of Forge-closeup framing;
- failed/counterexample route tests driving visible PlayCanvas storm bolts and Pip reaction;
- the exact four semantic route slots spatialized over the bridge path;
- six unchanged semantic blocks presented as a compact horizontal toolbelt;
- `Run the storm` separated as the primary game action;
- route-test results staged as a compact world HUD rather than a page-sized workbench result panel;
- server/game/evidence semantics unchanged.

Exact rendered verification of this continuation slice is still required before any critic rescore.

## Verified technical checkpoints

### Animated Pip / character composition

`d6e5f5ee53c10f9cf18b2bd8ce7f27fe05c4b4d8` passed its complete verification run.

Evidence established:

- pinned CC0 Quaternius robot loads through generic `WorldSpec.assets` / PlayCanvas container realization;
- semantic animation aliases work (`idle`, `wave`, `yes`, `no`, `thumbsUp`, etc.);
- fallback remains available on asset failure;
- imported child picking resolves to the semantic `pip` entity;
- Pip's measured normalization and left/right stage anchors keep the full animated silhouette inside the 390px portrait composition;
- scarf / antenna / beacon stay composable semantic children rather than backend-specific character code.

### Blacksmith / Forge asset path

The pinned CC0 Quaternius Blacksmith was measured in real PlayCanvas before world integration.

Measured AABB:

- min `[-2.5662, -0.0039, -1.6579]`
- max `[1.3238, 2.9995, 1.6256]`
- size `[3.89, 3.0034, 3.2835]`

The authored Forge AssetRef uses scale `1.30`, producing roughly `5.06w x 3.90h x 4.27d`, with an explicit local recenter/base offset derived from those bounds.

The imported Blacksmith replaces only Forge structural blockout geometry. Dynamic semantic overlays remain independent:

- furnace glow;
- sign;
- spinning gears;
- door glow;
- smoke;
- duplicate/new gear consequences.

If the imported model fails, structural primitives remain the fallback without changing game truth.

### Generic AssetRef/runtime contracts

The PlayCanvas backend now generically supports:

1. same-origin validated container AssetRefs;
2. portable normalization transforms;
3. semantic animation aliases;
4. async load with requested-state preservation;
5. semantic parent identity for imported child picking;
6. declared primitive fallback;
7. imported render-bounds diagnostics;
8. asset load/error accounting;
9. engine-neutral atmosphere/camera intent;
10. cleanup/replay/pause/reduced-motion behavior.

The unrelated Star Orchard browser proof continues to protect the backend from becoming an Echo Forge/Pip renderer.

## GameRulesSpec

The renderer-independent deterministic rules interpreter exists and remains intentionally isolated from Relay Rescue evidence writes.

Proven behavior includes:

- allowlisted typed state;
- structured expressions instead of `eval`;
- deterministic branches/effects;
- bounds and invariants;
- semantic events/objectives;
- deterministic replay/serialization;
- fail-closed invalid actions/specs;
- unrelated bounded-resource mechanics using the same interpreter.

Mature Relay Rescue server/evidence semantics remain authoritative. Integration is incremental; do not rewrite the server model merely for architectural purity.

## First-touch / story progress

Several blockers from the old `pc-phase1-5` critic are now materially stale and must not be copied forward without rerendering:

- the opening is **not** six consecutive passive Continue presses anymore;
- after the establishing beat the player directly manipulates rendered PlayCanvas geometry to inspect the broken gear, send `order-01` to the Forge, and trace the lost reply;
- direct world picking is browser-proven while the primary button remains the keyboard/screen-reader fallback;
- Pip is now a real animated asset rather than the old assembled primitive mannequin;
- the Forge now has a real authored Blacksmith structural asset rather than only boxes/cones.

These are implementation improvements, **not automatic critic score increases**. The exact rendered candidate must earn new scores.

## Current product-quality diagnosis

Known remaining risks/blockers:

- confirm the integrated Blacksmith orientation, framing and semantic overlays are visually coherent across opening and mission phone shots;
- continue improving environment art direction/depth so the islands/bridge do not make the authored character/building feel pasted into prototype scenery;
- confirm Pip accessories read as intentional courier identity during animation rather than detached primitives;
- Signal 6 must keep harder reasoning inside the game world rather than allowing HUD/workbench UI to dominate;
- later payoff and whole-chapter world identity still need fresh rendered review;
- learning/transfer acceptance has not yet been formally rerun as a >=9 gate on the current realization;
- no child/teen/young-adult human playtest has been performed; automated browser checks are behavior evidence, not enjoyment evidence.

## Acceptance protocol

Do not equate engineering success, deployment or architecture with game/learning quality.

The **same exact rendered build** must pass:

1. story/world >=9.0, no blocker;
2. first-touch gameplay >=9.0, no blocker;
3. whole-game gameplay >=9.0, no blocker;
4. learning/transfer >=9.0, no blocker;
5. architecture/runtime/security/persistence hard gate.

Architecture contributes zero automatic score to story/gameplay/learning.

Use a genuinely separate critic/agent where available. If only builder/tool-assisted review is available, label it `internal_tool_assisted`, never independent/human/youth testing. The user's verdict remains final.

## Immediate implementation order

1. keep deployed preview `912f7a3...` stable while the user inspects it;
2. complete exact CI/browser verification and rendered screenshot review for PR #6 Signal 6 spatialization/storm feedback;
3. repair any Signal 6 composition/interaction regression without changing its tested server semantics;
4. inspect current `pc-phase1-9` Blacksmith/Pip opening and Signal 1 evidence for orientation/overlay/art-direction issues;
5. improve reusable environment/archetype composition where the rendered evidence still looks prototype-grade;
6. run a fresh story/world + first-touch `internal_tool_assisted` critic only on one exact green rendered candidate;
7. continue whole-chapter game-world integration until the harder reasoning no longer regresses into a website/workbench experience;
8. run whole-game and learning/transfer gates on that same exact candidate;
9. run final architecture/security/persistence verification;
10. only then deploy an acceptance candidate, verify the served revision, and ask the user for the decisive review.

## Deployment state

Render service: `vibelearn`  
URL: `https://vibelearn-4xws.onrender.com/`  
Region: Singapore  
Plan: free  
Auto-deploy: disabled.

The currently live preview is intentionally behind the continuing feature branch. New commits on `phase1/playcanvas-engine` must not change the live preview unless another explicit deployment is requested or the acceptance protocol is satisfied.

Hosted auth, learner isolation, server-authoritative progression/evidence, immutable submitted evidence, assistance/exposure semantics, reset confirmation and historical review remain in force.
