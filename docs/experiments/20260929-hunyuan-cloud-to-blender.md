# Hunyuan3D-2.1 cloud-to-Blender reassessment

Checked 29 September 2026 after the user proposed free Hugging Face/Kaggle
compute for generated assets, followed by Blender editing and optimization.
This is source/code feasibility research, not a completed generation trial.
No images uploaded, inference run, cloud workspace created or paid compute used.

## Correction to our workflow

The earlier specialist-model research identified Hunyuan and recommended a
single generated-asset comparison. We never executed that comparison. Continuing
primitive-heavy custom authoring did not prove it was more efficient or better.
The cloud-to-Blender route should be the next bounded asset-method experiment,
before another broad hand-modeling pass. A licensing limitation on worldwide
distribution is not evidence that the generation method has poor visual quality.

This fits v3 sections 5–6: reuse validated/style-compatible commodity assets;
generate a genuinely missing distinctive asset; use Blender for transformations
that it needs; retain semantic meaning and gameplay boundaries in VibeLearn.

## What the sources establish

- [Official repository](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1):
  image-to-shape and PBR painting are separate stages. Published VRAM figures
  are 10GB shape, 21GB texture, 29GB combined. These are upstream figures, not
  measured peak memory on a free account. Setup includes compiled rasterizer/
  mesh-painter extensions; a generic notebook is not automatically compatible.
- [Paint implementation](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/blob/main/hy3dpaint/textureGenPipeline.py):
  accepts an existing mesh path and reference image, with optional remeshing,
  UV preparation, multiview albedo/metallic-roughness generation and baking.
  Thus an existing authored shape can be retained while testing painting; we
  need not discard accurate architecture to evaluate the material stage.
- [Official Hugging Face Space](https://huggingface.co/spaces/tencent/Hunyuan3D-2.1)
  and its file listing reported Running on Zero when read. This is availability
  metadata, not successful inference or confirmed account quota. Prefer trying
  this existing implementation before setting up our own GPU environment.
- [Current ZeroGPU docs](https://huggingface.co/docs/hub/spaces-zerogpu):
  large offers 48GB, xlarge 96GB; free-account daily quota is 5 minutes, subject
  to queueing and declared-duration admission. Hardware capacity is plausible
  for full inference; quota/extension/runtime compatibility remain separate.
  Free personal hosting is documented for qualifying accounts, up to two Spaces.
  The current PyTorch compatibility list starts at 2.8; upstream Hunyuan's
  tested environment is 2.5.1. Use an adapted/pinned Space implementation, not
  an untested copy of the README install commands.
- [Kaggle's September announcement](https://www.kaggle.com/discussions/product-announcements/735239)
  retires P100 on September 15 and retains two 16GB T4 GPUs. Older general docs
  still mention P100. Two devices do not automatically pool memory: based on
  published requirements, shape-only is plausible; full 21GB painting needs
  verified offload/sharding/other memory changes. It is not a plug-and-play
  32GB device. [Quota guidance](https://www.kaggle.com/docs/efficient-gpu-usage)
  says normally 30 GPU hours weekly, sometimes higher; actual account allocation
  and availability must be checked at execution.

The repository README advertises `--low_vram_mode`; the current GitHub
`gradio_app.py` fetched in this review did not contain that flag, while an older
official HF Space source did. Pin and inspect the actual implementation before
claiming a low-memory route works. Do not infer T4 texture support from the flag.

## License boundary

[Community license](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/blob/main/LICENSE)
section 1(l) excludes EU/UK/South Korea from its Territory, and section 5(c)
explicitly includes outputs in the outside-Territory restriction. Section 6(d)
says Tencent claims no rights in outputs; that is not the same as removing the
use restriction. Keep controlled experiments and worldwide shipping separate.
Hosting on HF/Kaggle and later Blender edits do not establish a different license.
Some source headers/third-party summaries use inconsistent non-commercial labels;
do not substitute those labels for the exact model, dependency and hosted terms.

## Bounded comparison, not another integration project

1. Choose one original static, prominent ceramic/brass entrance fixture with a
   clean approved single-object image. No entire-world image as one mesh; avoid
   a rigged character or transparent leafy tree as the first pipeline benchmark.
2. First try the official HF demo's complete shape/PBR path within free quota.
   If unavailable, evaluate a compatible Space or Kaggle shape-only plus Blender
   materials; name the fallback accurately rather than calling it full PBR.
3. Preserve raw output and condition a copy in Blender: silhouette/backside
   repairs, dimensions/pivot, mesh simplification or retopology as needed, UV and
   material correction, bake detail, simple collision and optional LODs.
4. Put the optimized asset in the same existing scene and camera positions.
   Compare visual quality, style adherence, editing/retry time, triangle/material/
   texture cost and frame pacing. A successful download is not a visual win.
5. Keep approved input, model/code revision, seed/settings, raw and optimized
   hashes, source terms and measured evidence in the existing asset manifest
   workflow. Use model-independent asset contracts; avoid a Hunyuan-specific
   world/runtime or premature cloud orchestration service.

Recommendation: test this route now for distinctive static assets. Continue
exact authored/procedural structure where openings, modular joins or collisions
need precision. The unmeasured claim is whether it beats our current production
method on total effort and in-game quality; the next asset comparison must answer it.

## Subscription follow-up

The user asked about a $20 HF subscription. [Current pricing](https://huggingface.co/pricing)
lists personal PRO at $9/month and Team at $20/month. Current ZeroGPU docs give
both PRO and Team members 40 minutes/day with highest queue priority, versus
5 minutes for free accounts. PRO is the appropriate trial tier for one operator;
Team does not add per-person ZeroGPU quota. This is shared, burst GPU capacity,
not an included always-on dedicated GPU. A 96GB xlarge allocation consumes
twice the quota. At a hypothetical 2-minute metered cost per complete asset, the
40-minute allowance would support about 20 attempts/day; actual request accounting,
failures and latency must be measured, and accepted assets will be fewer.
Recommendation: first verify one complete asset/export through the official
Space, then use one month of PRO if the extra iteration quota is useful. No
subscription, credits or paid hardware have been purchased or activated here.
