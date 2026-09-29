# Opus 5.5 Bellweather art trial: portable input packet

29 September 2026. The local input packet is
[`artifacts/opus-art-trial-input/`](../../artifacts/opus-art-trial-input/), with a
per-file SHA-256 and source-path record in
[`MANIFEST.json`](../../artifacts/opus-art-trial-input/MANIFEST.json). It contains
51 payload files totaling 3,336,554 bytes (3.18 MiB), plus the manifest.
Every copied payload hash matches its original workspace file.

The packet contains the reviewed `BRIEF.md`, parked `EXECUTION-POLICY.json` and
`EVALUATION.md`; the accepted graphic-utopia image and art-direction note; the
Bellweather opening design and its review; and a standalone source subset of
the pinned Summer Cycle baseline. That subset is the unedited `src/` tree,
`index.html`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`
and `LICENSE`. The package preserves the original build and preview commands.
It intentionally excludes `node_modules`: before a run, the operator must
provide pinned dependencies from the reviewed baseline install, or review a
frozen-lockfile registry install under the selected budget policy. The builder
cannot independently fetch packages or assets. The packet is an input boundary,
not a filesystem permission mechanism or a ready-to-run dependency bundle.
It excludes the baseline's local measurement files, installed dependencies,
build output, preview logs, upstream screenshot/performance
scripts, promotional/reference imagery and repository metadata. The prior
failed Bellweather geometry is absent.

Upstream Summer Cycle provenance is
[`StarKnightt/summer-cycle` at `8b977baad061e797c2f6c19cfcf07c1e79b23a67`](https://github.com/StarKnightt/summer-cycle/tree/8b977baad061e797c2f6c19cfcf07c1e79b23a67).
The previously verified local baseline reports matching upstream Git blobs and
an MIT license; the included `LICENSE` retains upstream attribution. This code
license does not grant rights to third-party films or characters referenced in
the upstream project, so their images and promotional files are excluded. The
accepted Bellweather image is supplied as project art-direction guidance, not a
runtime texture or a public redistribution license.

This is an implementation-method trial. The old rejected Astra output is a
historical control, not a same-context, same-budget model comparison. No
provider run, dependency install, trial build, server, or active-game edit was
performed to prepare this packet. The user has no Anthropic subscription, so
the Opus run is parked; no provider run or purchase is authorized. The packet
is preserved for possible later use, subject to access, budget and execution
policy review.
The existing game and review gates remain in force before any integration or
promotion.
