# Bellweather source-based world trial

Isolated research scene, 29 September 2026. **Not the active game, an accepted art
direction implementation, or a production engine migration.**

The scene tests one connected pre-rupture journey: arrival, a manually activated
garden lightwell, Mira travelling along the promenade, and a reachable overlook.
All state is disposable memory. It has no learner identity, save, assessment,
mastery, network-provider or deployment integration.

## Run locally

From this directory, with Node and pnpm 10.18.3:

```text
pnpm install --frozen-lockfile --ignore-scripts
pnpm run build
pnpm run preview
```

Open `http://127.0.0.1:8061/`. Stop the preview when finished. `pnpm run dev` is
available for source edits. The initial workspace uses a local node_modules
junction to the separately reproduced baseline to avoid a duplicate install;
the junction is ignored, is not part of the artifact and is not required elsewhere.

Walk with WASD/arrows, drag to look, scroll to change camera distance, and use E
or the nearby visible button to interact. Pause/options provides explicit guided
travel, reduced-motion station steps, lighter rendering and scene restart.
Guidance does not activate the garden. Returning preserves its state; Restart
resets the disposable scene. Phone-width layouts expose a movement stick.

## Source and boundaries

Rendering/material/geometry dependencies reuse MIT Summer Cycle at commit
`8b977baad061e797c2f6c19cfcf07c1e79b23a67`. See
[SOURCE-PROVENANCE.json](SOURCE-PROVENANCE.json) and the retained
[upstream license](src/vendor/summer-cycle/LICENSE). Vendor modules are unchanged.
The scene, characters, control/state code and derived palette/water materials
live outside vendor. No upstream reference images, promotional media or rider
character are shipped.

The separate [design](../../design/experiments/bellweather-world-trial.json) and
[design review](../../design/experiments/bellweather-world-trial-review.json)
permit this opening prototype only. Canonical v8 and the PlayCanvas game remain
unchanged. Design approval is not visual or experience acceptance.

The `?prof=1` query enables inherited GPU timers. The read-only
`window.__bellweather.snapshot()` supports diagnostics; it is not a gameplay
command interface or a substitute for native GUI play.

## Outcome

Two substantial visual revisions are exhausted. The connected interaction works
in worker GUI play, but art realization remains below the selected reference.
Do not integrate, enlarge the scene, or extract a general world generator from
this result. See the [art verdict](../../docs/experiments/20260929-bellweather-source-trial.md)
and [functional verification](../../docs/experiments/20260929-bellweather-source-trial-verification.md).
