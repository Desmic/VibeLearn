# Bellweather visual study

An isolated, disposable art experiment. This is **not the production game**,
an engine migration, a learning assessment, or an accepted art gate.
The production runtime remains PlayCanvas.

## Reproduce the current candidate

Use Node 22.12 or newer. From this directory:

```text
npm ci --ignore-scripts
npm run build
npm run preview
```

The preview listens only on loopback, port 8062. Reuse an existing preview on that
port; do not launch a second browser/server fleet. Pause the scene when inspecting
source or leaving the preview idle.

[Open the current visual candidate](http://127.0.0.1:8062/?study=facade&portal=crafted&architecture=atelier&finish=daylight&palette=ceramic&form=swept-clean&character=courier&look=sunlit&setting=city&districts=terraces).

The bare `/` URL is the earlier arcade control. It does **not** show the current
conservatory candidate. Query options deliberately preserve prior comparisons.
For the preceding city control, remove only `districts=terraces`.

The [30 September surface comparison](../../docs/experiments/20260930-illustrated-surfaces.md)
adds `&surface=illustrated` to that candidate. It changes paving, illumination and
cloud representation within the same court. This remains an optional experiment;
it does not silently replace the earlier comparison or pass the art gate.

Walk using WASD/arrows or the visible movement buttons; drag to turn the camera
and scroll to adjust its distance. The route button offers guided travel through
the same space. Escape/Pause opens resume, reset, camera and reduced-motion options.

## Source, evidence and limits

- [Provenance and authoring recipes](SOURCE-PROVENANCE.md) identify original work,
  reused code, licenses and Blender exports. Editable originals are in `authoring`.
- [Current pass and measurements](../../docs/experiments/20260929-district-silhouettes.md)
  record the checked build, native observations and bounded engineering checks.
- [Current project state](../../docs/STATE.md) governs integration and review gates.

The existing workstation's `node_modules` may be a junction to an ignored research
baseline. That is a local disk-saving convenience, not a dependency required by
the project. A clean checkout uses its own locked installation. Build outputs,
package caches, browser scratch and Blender backup files are intentionally ignored.
Selected final evidence is versioned; historical scratch evidence stays local.

On 29 September, a separate empty folder installed 25 packages with this lock
and built the copied source/assets successfully. It reproduced the existing
`index-DXmeqNSe.js` bundle (SHA-256
`564076ec17c204d973cd3651a0889ce8509d4c14c59297cd8337a11f692c0014`).
The existing large-bundle warning remains; no rendering or performance gain is
claimed by packaging the experiment reproducibly.

The character currently has a static pose. No gait/cloth, audio-quality, sustained
frame-rate, full physics, or final art-acceptance claim follows from this study.
Do not expand the map to compensate for unresolved visual quality.

## Focused verification

With the preview already running and the interactive preview paused, the existing
verifier can compare two facade candidates using installed Chrome:

```text
node --experimental-strip-types verify-courier.mjs --baseline="FULL_CONTROL_URL" --candidate="FULL_CANDIDATE_URL" --prefix=unique-pass-name
```

Supply complete loopback URLs on port 8062 with `study=facade`, including all
comparison options. The prefix prevents replacing historical evidence. Playwright
is pinned as a dev dependency; no dependency junction is needed. This engineering
check supports actual GUI review and does not replace it.
