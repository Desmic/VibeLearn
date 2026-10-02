# Authored props

Each prop is a Blender script that builds the model from parameters and exports one GLB
to `public/props/`. A script, not a .blend file, so a prop can be rebuilt, restyled or
reused by another island (pass `PARAMS`) and its history reads as text.

| Script | Output | What the game drives |
| --- | --- | --- |
| `build_skiff.py` | `skiff.glb` | `Sail`, `Core`, `FinGlow*` glow when the skiff wakes; `LanternMount`, `Seat` empties |
| `build_warden_ship.py` | `warden-ship.glb` | `ShipGlow`/`ShipHatch` become violet light, `ShipEye` pulses; origin is the hatch (where the beam starts); nose toward +Z |
| `build_island_props.py` | `gate-arch.glb`, `word-loom.glb` | Gate: carved arch with a crown panel the game's face sits on (`Ivy`, `Flowers` double-sided). Loom: `Slots` glow violet; `Threads`, `Band` double-sided |
| `build_festival_props.py` | `festival-lantern.glb`, `bell-frame.glb` | Lantern: `Paper` glows, origin is the hook (it swings). Bell frame: `Bell0`..`Bell4` swing from their own origins (`kit/swing.ts`) and ring |

## Running one

In Blender's Python console, or through the Blender MCP:

```python
import runpy
runpy.run_path(r"E:\...\bellweather-arcade\authoring\props\build_warden_ship.py",
               init_globals={"OUT": r"E:\...\bellweather-arcade\public\props\warden-ship.glb"})
# build_festival_props.py takes OUT_DIR (it writes two files)
```

Each script prints its triangle count. Then run `node tools/assetcheck.mjs`: props must stay
within the phone budget in `tools/asset-budgets.json` (4,000 triangles, 16 draw calls,
250 KB each).

## House rules

- Vertex colours, not textures: one material per surface kind, no UVs to unwrap, tiny files.
- Name every part the game touches; the game finds them by name and keeps a simple
  stand-in if the file fails to load.
- Put the pivot where the part moves from (a hook, a hinge, a hatch).
- Glowing parts get their own material; the game swaps it for an unlit one so it blooms.
- Export with Draco compression (the game's loader decodes it): files shrink 5–10×.
- In the game, `authored(standIn, name, tune)` (`src/worlds/bellweather-props.ts`) puts a model in
  place of its code-built stand-in; props listed in `main.ts` are preloaded so they never pop in.
- Shapes tell the story: the Warden's ship is all ears because the Warden listens for
  machines that think.
