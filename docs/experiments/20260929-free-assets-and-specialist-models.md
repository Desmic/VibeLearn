# Free assets and specialist models — checked 29 September 2026

## Decision in the context of v3

Read against `VibeLearn_3D_Game_Generation_Operational_Architecture_v3_VERIFIED_2026-09-26.md`,
especially sections 3–7, R1–R7, promotion criteria and immediate priorities.
This is a source/feasibility review, not an inference benchmark or asset approval.
No model was installed/run, paid provider invoked or reference uploaded.

**Follow-up:** [Cloud-to-Blender reassessment](20260929-hunyuan-cloud-to-blender.md)
checks Hunyuan's official HF Space, current free GPU limits, Kaggle's P100
retirement, separate shape/paint memory requirements and code/runtime mismatch.
The recommended generation comparison was not performed during subsequent
hand-authoring passes; that missing experiment should precede another broad pass.

Our highest-return immediate move is a small coherent asset corpus with semantic
roles and a visible composition test, followed by ONE specialist generation trial
for a genuinely missing hero object. Models supply visual candidates; canonical
specs continue to own topology intent, interaction IDs, collision/navigation
meaning, learning, saves and evidence. Keep PlayCanvas and the existing artifact
boundaries. Do not start seven integrations or a universal asset service.

The failed [visual benchmark](20260929-visual-benchmark.md) reinforces v3's
style-family requirement: individually useful assets and better light do not
make a coherent inhabited world. Root's primitive-heavy production approach
underused these existing recommendations. Commodity reuse is not a reason to
accept a generic low-poly aesthetic below the chosen reference.

## Freely obtainable content: practical shortlist

| Source | Useful to us | Current source terms / acquisition limits |
|---|---|---|
| [Poly Haven](https://polyhaven.com/license) | HDR environments, physically based surfaces, selected models | CC0. Already used one HDR and surface set in the isolated lab; visual fit still requires judgment. |
| [ambientCG](https://docs.ambientcg.com/license/) | Stone, ceramic, metal and ground materials | CC0; official terms permit raw files in games. Start at modest resolutions. |
| [Kenney](https://kenney.nl/support) | Commodity props, modular kits and readable input icons | Asset pages are CC0; do not confuse asset licensing with the studio logo. |
| [KayKit Forest](https://kaylousberg.itch.io/kaykit-forest) | Consistent trees, rocks, shrubs, grass | Free tier has 100+ models, glTF and shared gradient atlas, CC0. Extra variants/source files are paid. Candidate dressing, not automatic art acceptance. |
| [Quaternius](https://quaternius.com/license.html) | Modular architecture, foliage, rigs/animation | Current QAL permits commercial products without attribution but forbids standalone asset redistribution. Some older pack/FAQ pages still say CC0. Preserve the exact downloaded package's license and acquisition provenance; never mark the whole site CC0. |
| [Mixamo](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) | Existing humanoid animations and auto-rigging | Free with Adobe ID, royalty-free commercial game use. Bipedal humanoid constraints; not a reliable automatic fit for every stylized robot. |
| [Sonniss GameAudioGDC](https://sonniss.com/gameaudiogdc/) | Later commodity SFX | Commercial use without attribution; current page explicitly prohibits AI/ML training. Audio review remains deferred. |
| [Fab](https://www.fab.com/eula) / [Sketchfab](https://sketchfab.com/licenses) | Select stronger hero/architecture candidates | Individual license matters. Fab Standard supports compatible engines but not standalone redistribution. Skip editorial/non-commercial items for the normal product corpus. |

The [Quaternius Modular Sci-Fi Megakit](https://quaternius.com/packs/modularscifimegakit.html)
has a free subset and glTF modules. It can supply commodity structure/props, but
its corridor vocabulary is not itself our airy utopian city. Do not replace one
generic look with another. The current QAL/older CC0 page conflict is a reason to
check the actual package, not to retroactively relabel already pinned licenses.

For a learner-facing generator, distinguish incorporating assets in completed
games from distributing an asset pack, template library or user-downloadable
source kit. Prefer CC0 where those future use cases are intended. Keep licensed
internal corpus access separate from any public raw-asset catalog.

## Specialist AI: what is available and what it would buy us

| Candidate | Specific opportunity | Constraints / disposition |
|---|---|---|
| [TRELLIS.2](https://github.com/microsoft/TRELLIS.2) | Image-to-3D with PBR attributes; also textures a supplied shape. Candidate for a distinctive static signal device or architectural ornament. | Model/code MIT; official setup Linux, NVIDIA 24 GB+. Upstream speed examples use H100, not this laptop. Audit dependencies before commercial use. First open-model comparison candidate, not approved production dependency. |
| [Pixal3D](https://github.com/TencentARC/Pixal3D) | Pixel-aligned reconstruction/generation; September 2026 multi-view inference could help preserve an approved object's design from several views. | MIT project, built on TRELLIS.2; [NOTICE](https://github.com/TencentARC/Pixal3D/blob/master/NOTICE) lists separate dependency licenses. No measured local quality/speed or cleared complete stack. Alternate R4 candidate if reference adherence is the bottleneck. |
| [Hunyuan3D 2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1) | Separate geometry and PBR painting stages. | Official figures: 10 GB shape, 21 GB texture, 29 GB combined. [Community terms](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/blob/main/LICENSE) restrict territory including output use/display outside it. Not the default global-product route. |
| [SAM 3D Objects](https://github.com/facebookresearch/sam-3d-objects) | Reconstruct individual objects and layout from an image, useful for acquisition/scene decomposition. | [Setup](https://github.com/facebookresearch/sam-3d-objects/blob/main/doc/setup.md) asks for Linux and NVIDIA 32 GB+. Custom [SAM license](https://github.com/facebookresearch/sam-3d-objects/blob/main/LICENSE), not MIT. Keep in R4; inferred shape/layout does not establish gameplay semantics. |
| [TripoSG](https://github.com/VAST-AI-Research/TripoSG) | Image-to-shape, including explicit face-count control; lower hardware entry than larger PBR pipelines. | Official CUDA requirement 8 GB; shape is not a complete textured/rigged asset. Default example downloads [BRIA RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4), whose free weights are non-commercial. Resolve/replace that stage before product use. |
| [HY-World 2.0](https://github.com/Tencent-Hunyuan/HY-World-2.0) | Persistent visual environment generation/reconstruction; appropriate to v3's replaceable world-source experiment. | [Full worldgen instructions](https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/hyworld2/worldgen/README.md) recommend at least four GPUs, tested on eight H20s, plus VLM service. [Terms](https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/License.txt) exclude EU/UK/South Korea, including output use/display. Controlled India experiment may fit; worldwide default does not. July 2.1 product announcement is not evidence of equivalent open weights. |
| [Marble](https://marble.worldlabs.ai/pricing) | Fast world previsualization; splat/mesh background candidates. | Free generation is limited. Current plans put splat exports in Standard and high-resolution textured mesh export/commercial rights in Pro. Not a free production export path. |
| [Meshy](https://www.meshy.ai/pricing) / [Tripo hosted](https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially) | Avoid local model setup; useful paid asset-trial comparators. | Meshy advertises free credits/CC BY output rights, but its [download guide](https://help.meshy.ai/en/articles/10421033-why-can-t-i-download-my-model) says Meshy 6/7 downloads require a paid plan. Tripo's free tier is not its commercial-use tier. Check account/model/export entitlement before spending trial time. |

Crucial dependency finding: the current upstream [nvdiffrast license](https://github.com/NVlabs/nvdiffrast/blob/main/LICENSE.txt)
and [nvdiffrec license](https://github.com/NVlabs/nvdiffrec/blob/main/LICENSE.txt)
contain non-commercial use limits. TRELLIS.2 explicitly references these separate
terms. MIT on the top-level repo is not blanket clearance for the installed
pipeline. Trace the actual execution path and pinned versions; use a cleared
provider or replace/omit constrained components where technically valid. This
review does not assert that every generated mesh inherits a code license.

## Compute, runtime cost and useful non-AI tools

Local read-only `nvidia-smi` reports **RTX 3060 Laptop GPU, 6144 MiB**. This is below
the official requirements above. Community low-memory/offload forks exist, but
were not verified here; spending hours making a large model limp on 6 GB is not
our default efficiency plan. A free hosted demo may establish feasibility, but
queue availability is not a production SLA and hosted terms require separate
checking. We have not purchased compute or installed model weights.

Generation should be offline and cached by source/model/version/settings/input
hash. Runtime players download optimized mesh/material data and use the engine;
they should not run these generation models. Count the full cost: failed trials,
preprocessing, cleanup, texture baking, rigging, review, storage and runtime
memory—not only inference seconds. An impressive generated mesh may still be too
dense, lack useful topology, have baked-in shadows or incorrect unseen surfaces.
Those are evaluation risks, not findings from an unperformed model trial.

[Blender](https://www.blender.org/features/) is a free existing tool for modeling,
rigging and asset conditioning; use it only where transformation is needed, as v3
specifies. [glTF Transform](https://gltf-transform.dev/cli) already provides mesh
and texture optimization. Reuse these rather than inventing our own decimator,
UV unwrapper or compressor. Verify decoder support in the pinned runtime before
choosing compression, and preserve semantic nodes/rigs through optimization.
Reusable procedural kits remain valuable for topology-constrained variation;
AI does not need to replace all procedural authoring.

## Concrete next experiment and system contribution

1. Curate one small style-compatible set: terrace structure, foliage, seating,
   ground/water-edge materials, one inhabitant family. Reuse validated assets
   first. Save source/license/hash, dimensions/pivot, material/triangle/texture
   cost, semantic roles and style tags in existing manifest conventions.
2. Recompose the same safe opening with its two existing signal meanings and
   navigation constraints. Approve it from player camera height while moving,
   not a cinematic sky view. No new level or progression.
3. For ONE absent identity-bearing object, compare a library/kitbash baseline
   with one cleared image-to-3D route. Use an isolated original object reference,
   not the entire world concept as one undifferentiated mesh. Record total
   hands-on time, retries, bytes, cleanup, readability and in-engine cost.
4. If it wins, preserve it as a provider-cleared asset candidate under the
   resolver. Prove reuse on Bellweather and the existing Harbor Relay fixture
   before generalizing. A model never owns interaction IDs or learning meaning.
5. HY-World/Marble and semantic perception remain separate R1/R2 experiments;
   generated motion/audio remain deferred. Use one cold Astra critic at the
   integrated gate, not model-specific critic fleets.

Measure accepted-asset time and time-to-good-playable-scene. Stop trials that
improve a vendor preview but worsen integration, licensing, editing or runtime
cost. This is implementing v3's intended production economics, not replacing v3
with a collection of model integrations.
