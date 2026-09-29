# Review of the proposed operational architecture v3

26 September 2026. Review, not adoption or execution authorization.

Reviewed the user-supplied root document against local HEAD
`9111d066a2909de12a30fc7ecc39b2afeed37fbc`, current source, owning documentation,
and selected primary upstream sources. Local `main` is `aabb762725007fb4760420745cf81e1869305a14`;
the working branch is 39 commits ahead, zero behind. Those proposal claims are
correct against local refs; this review did not fetch or certify remote freshness.

**Verdict: adopt the direction after targeted corrections.** Its strongest ideas
are semantic ownership, coherent asset reuse, conditional conditioning, and
measuring time to an acceptable game. It is not yet a reliable standalone
execution document: it mixes available mechanisms, proposed boundaries and
experiments, and omits some current execution constraints.

## What exists versus what is proposed

| Capability | Repository evidence | Assessment |
| --- | --- | --- |
| PlayCanvas runtime, semantic world entities, deterministic rules | `web/world-spec.js`, `web/playcanvas-backend.js`, `app/game_rules.py` | Implemented within a bounded supported feature set. |
| Full engine-neutral specification/compiler chain | `docs/GAME-RUNTIME-ARCHITECTURE.md`, especially its conceptual compiler contract | Architecture direction; not proof of a complete automatic compiler from learner request to game. |
| Reviewed learning design before implementation | `tools/check_learning_design.py`, `design/review.json`, `.github/workflows/verify.yml` | Executable. Current full design passes implementation approval; runtime alignment is unassessed. |
| Pinned asset ingestion/provenance | `tools/vendor_game_assets.py`, `tools/vendor_playcanvas.py` | Implemented for a small fixed set; not semantic asset discovery/resolution. |
| World-source adapter, semantic resolver, executable style-family policy | Searches of `app`, `web`, `tools`, `design`; `docs/REUSABLE-ASSETS.md` | Proposed extensions. Existing reuse/provenance mechanisms are starting points. |
| Splat rendering and voxel/mesh collision ingestion | WorldSpec allows `container` assets and box colliders; backend loads containers and derives box bounds | Not exposed by this runtime. Upstream engine support does not supply this integration. |
| World markers, safe regions, contextual presentation | `web/world-marker-layout.js`, `web/surface-fit.js`, presentation-budget checker | Existing mechanisms. Actual attention/agency still failed the latest cold review. |
| Harbor Relay generality proof | `tests/test_platform_generalization.py` | Materially different synthetic contract fixture, not a second accepted playable game or asset benchmark. |
| Native GUI criticism | `docs/ASTRA-REVIEW-WORKFLOW.md`, `docs/STATE.md` | One fresh-context Astra across lanes; latest experience remains `needs_revision`. |
| Learner-facing on-demand production and Terminal PM dispatch | `docs/LEARNER-ON-DEMAND-AND-REPAIR.md`, `docs/AUTOMATED-DEVELOPMENT-SYSTEM.md` | Product direction and completed Phase 0 adapter respectively; live dispatch remains unauthorized. |

## Corrections before agents should follow it

### 1. Split current, next and experimental capabilities

Proposal sections 2 and 10 label WorldSourceAdapter, AssetResolver, a validated
corpus and Blender pipeline as today's required/current path. Section 13 is more
careful, putting current quality repairs first. Resolve that contradiction:

- **Current:** supported runtime, reviewed design, pinned ingestion, presentation,
  tests, actual play and independent lane judgments.
- **Next, when a concrete repair needs it:** small semantic asset catalog/style
  metadata and an artifact-level provider request/result.
- **Experimental:** HY generation, splat ingestion, automated conditioning and
  perception. Each needs a bounded experiment and evidence before promotion.

Do not make those experiments prerequisites for the current repair. The current
failure is that meaningful decisions can still live in a stationary panel, with
weak transfer and payoff. A more attractive background cannot resolve that.
`docs/STATE.md` owns the next gate.

### 2. Review learning and game design together, before their implementation

Stage 2 currently approves learning design before Stage 3 defines verbs, rules,
failure/recovery and embodiment. Our learning gate already reviews concrete
player decisions, world attention, worked examples and counterexamples; it
cannot meaningfully approve those without the game mechanics.

Make stages 2–4 an iterative design package: outcomes, playable decisions,
feedback, world arrangement and early art direction, followed by exact-design
approval. Later mechanical changes reopen that approval. Greybox validates the
approved hypothesis; it does not make a changed mechanic implicitly approved.
Begin silhouette, composition and attention planning here; finished asset
sourcing can still wait for greybox evidence.

### 3. Make the provider boundary preserve releases and failed results

`generate(request) -> VisualWorldCandidate` is a useful small boundary, but an
operational result needs more than a successful visual payload. Record request
and design identity, provider/version, immutable output hashes, units/axes,
bounds, supported formats, semantic-anchor mapping, license provenance,
validation findings and unresolved constraints. A provider must be able to
return unsupported/failed/partial, rather than inventing success.

Reference the existing execution contract for budget, timeout, cancellation,
retry and effect reconciliation; do not invent a second orchestrator. Bind
selected asset versions and transformations into the candidate's release
identity. A later resolver result must not silently change an existing saved
game or assessed task. These requirements follow the existing learner repair
and immutable evidence policies, but the proposed operational workflow does
not carry them through to its new boundaries.

### 4. Keep upstream splat capability separate from local readiness

The upstream capability claims are supported: PlayCanvas documents
[SOG](https://developer.playcanvas.com/user-manual/gaussian-splatting/formats/sog/),
[Streamed SOG](https://developer.playcanvas.com/tutorials/gaussian-splat-streaming-lod/)
and separate [collision generation](https://developer.playcanvas.com/user-manual/splat-transform/collision/).
Collision generation produces voxel data or a collision mesh; it does not define
quest roles, learner actions or our traversal rules.

The repo pins PlayCanvas 2.22.1. Our schema/backend currently support container
assets and box collision bounds, not the proposed splat/voxel route. Require a
small compatibility/load/dispose/traversal experiment on the pinned engine
before treating that path as usable. Do not infer availability from current
upstream documentation or a file ending in GLB.

Performance comparison must include CPU **and** GPU, frame-time stability,
memory, startup/download cost, idle/hidden behavior and cleanup at fixed device,
viewport and quality settings. The recent CPU/GPU investigation makes this a
demonstrated need. `mobile_budget: hero` is a category, not a measurable budget;
set acceptance limits from a recorded baseline before the experiment.

### 5. Keep HY experimental and make asset rights specific to their use

The proposal correctly mentions territorial restrictions. Their operational
consequence deserves stronger wording: HY-World 2.0 license section 5(c)
explicitly includes outputs in its restrictions outside the allowed territory.
Local use in India is not clearance for worldwide output delivery. Use a
bounded, permitted experiment; global production remains unresolved under
these terms. Pin the exact open model or hosted provider and its applicable
terms instead of referring generically to “2.x.”
See [Tencent's license](https://huggingface.co/tencent/HY-World-2.0/blob/main/License.txt).

The free-source shortlist is broadly supported by official sources:
[Kenney](https://kenney.nl/support),
[a KayKit package license](https://github.com/KayKit-Game-Assets/KayKit-Prototype-Bits-1.0/blob/main/LICENSE.txt),
[Poly Haven](https://polyhaven.com/license),
[ambientCG](https://docs.ambientcg.com/license/),
[Mixamo](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html),
and [Sonniss GDC](https://sonniss.com/gdc-bundle-license/).
These are not identical grants. Asset use, acquisition/API access, internal
storage, redistribution as a library and inclusion in a finished game are
different operations. Track the permitted operations per acquired package.
Mixamo also targets bipedal humanoids, not every protagonist profile.

[Current Quaternius QAL](https://quaternius.com/license.html) permits commercial
products but restricts standalone asset redistribution. Our existing two
pinned binaries have recorded CC0 provenance; keep their original acquisition
evidence distinct from newly acquired packages rather than applying one
vendor-wide license label. This review verifies selected published terms, not
the rights of every possible future asset.

### 6. Restore execution constraints and remove unavailable dependencies

Link and summarize `ASTRA-REVIEW-WORKFLOW.md`: one fresh-context Astra, cold
report preserved before intent/reference calibration, all critic lanes in that
review, exact-candidate schema-v2 readiness evidence, required presentation
budget report, motion/audio quality deferred and unassessed. Audio-state tests
do not certify audio quality. These omissions matter in a document intended to
be handed to an agent without prior conversation.

Also preserve current Codex-based execution, completed Terminal PM Phase 0 and
`live_run_authorized=false`. Stage 0 should inspect fresher relevant work without
turning the temporary branch into a new canonical development policy: `main`
remains the destination.

The referenced v2 architecture and “God's Eye research” were not found in the
tracked checkout. Supply explicit accessible sources or make v3 self-contained.
Its verification snapshot should include source URLs/revisions and distinguish
documented support, code inspection and executed evidence. The title VERIFIED
must not imply that provider integration or game quality was tested.

## Recommended adoption sequence

1. Apply the above documentation corrections before granting v3 operational
   authority; preserve the user's original proposal as submitted.
2. Complete one coherent world-centered interaction repair under the already
   approved nine-step design. Include the source inspection/staging/commit
   distinction and concept-bearing visible consequences. Reuse shared behavior
   and keep story-specific content in data.
3. If that repair exposes an asset bottleneck, extend pinned ingestion with a
   small semantic/style catalog. Demonstrate replacement on a different fixture
   without changing learning IDs, rules or assessment history. Do not call a
   synthetic fixture a full second-game quality proof.
4. Run a bounded authored-versus-generated world experiment only when useful,
   with an explicit time/compute budget, supported distribution scope and
   measured total cleanup, integration, review and repair cost. A promising first
   comparison supports further investigation, not broad reliability claims.
5. Re-freeze the revised game and run technical checks plus cold GUI review of
   the entire required journey. Extract reusable capabilities from that evidence.
   No Level 2 or deployment promotion follows from this architecture review.

Validation performed here: source/document inspection, local Git identity/count
checks, selected upstream checks and the implementation-stage design gate,
which returned allowed with runtime alignment unassessed. No runtime code was
changed, no game/browser benchmark was rerun, and no new provider was installed
or dispatched.
