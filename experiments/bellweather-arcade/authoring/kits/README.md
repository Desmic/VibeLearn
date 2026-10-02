# World kits: reusable art by meaning, layout as data

This folder turns asset libraries into **kits** the game asks for by semantic role
("tree.blossom", "grass.tuft", "rock.boulder"), never by source file. It is the first
working piece of the Asset Resolver idea in the architecture doc: the game requests
meaning, a manifest decides the source.

## The three layers

| Layer | File(s) | Knows about |
| --- | --- | --- |
| **Kit** (assets) | `authoring/kits/<kit>.kit.json` → `build_kit.py` (Blender) → `public/kits/<kit>.glb` + `.json` | source library, roles, colour variants, texture budget |
| **World spec** (layout) | `src/worlds/<island>.ts` (data only) | where paths, hedges, landmarks and scatter go; which spots stay clear for gameplay |
| **Builders** (code, game-agnostic) | `src/kit/kit.ts`, `dress.ts`, `terrain.ts`, `merge.ts` | how to load a kit, instance it, paint ground, make an island base |

Gameplay objects (gates, notes, machines) are not in a world spec. They only reserve space
through `anchors`, so the dressing can change without touching learning or story code.

## Change things without rewriting code

- **Calmer or busier island**: edit densities/spacing in the world spec; the game also
  scales scatter by graphics tier (`density` option: low .5, medium .8, high 1).
- **Different look** (another style family): new variants and `grade` in the kit manifest
  (hue target, saturation, lift), or a different ground/strata palette in the world spec.
- **Different library**: point a role at other files in the manifest and rebuild. Game code
  keeps asking for the same roles.
- **New island**: copy a world spec, change centre/radius/anchors/paths, call
  `dressIsland(spec, kit)`.

## Building a kit

In Blender 5.x (the Blender MCP can run this):

```python
import runpy
runpy.run_path(r"E:/Projects/VibeLearn/experiments/bellweather-arcade/authoring/kits/build_kit.py",
  init_globals={"KIT": r".../authoring/kits/nature-meadow.kit.json", "REPO": r"E:/Projects/VibeLearn"})
```

It imports the source glTFs, joins each model, puts the origin at the base centre, grades
all textures toward the style family, bakes colour variants (e.g. green canopy → pastel
blossom), drops normal maps, resizes textures to the budget, Draco-compresses meshes
and writes `public/kits/<kit>.glb` plus a runtime index (roles, heights, radii, triangle
counts, provenance).

## Distance versions (LOD)

The manifest's `lod` block makes a light copy of every big foliage model: the trunk and
branches are decimated, and only about 38% of the leaf cards are kept (grown a little so the
crown keeps its mass). Trees drop about 75% of their triangles beyond `distance` metres;
`kit.clone(role, i, { lod: true })` returns a `THREE.LOD`. Any card-foliage library works.

## Detail budget

`src/kit/budget.ts` is a frame governor that runs after adaptive resolution. If frames stay
slow, it sheds world detail step by step: first the later scatter rules in a spec (petals,
mushrooms…), then all small scatter. It restores detail when there is headroom.

## Props named in a spec

A world spec can list `props: [{ prop: 'wordLoom', at, rot, params, solid }]`. The game passes
builders (`BELLWEATHER_PROPS`) to `dressIsland`, so the spec stays data and the prop designs
stay with the game.

## Current kits

- `nature-meadow`: 24 roles (now with autumn, ember and twisted-ember variants for Loom
  Isle), 62 models plus 17 distance versions, about 3.4 MB. Source: Quaternius *Stylized Nature
  MegaKit* (Standard), **CC0**, downloaded from OpenGameArt into
  `assets/third-party/quaternius/stylized-nature-megakit/` (licence file kept there).

## Hand-authored hero props

`authoring/props/build_skiff.py` builds the sky skiff from parameters (length, beam,
depth, colours, mast height) and exports `public/props/skiff.glb` with named parts the
game drives (`Sail`, `Core`, `FinGlow*` glow when the skiff wakes; `LanternMount`,
`Seat` markers). Other islands or games can call it with other parameters.

Bellweather's small gameplay props (notice boards, lantern posts, satchel pedestal, relay,
gate arch) are parameterised builders in `src/worlds/bellweather-props.ts`; `mergeStatic`
merges each into one draw call per material.

## Generated islands and the world

- `src/kit/generate.ts`: `generateIslandSpec({ seed, center, radius, theme, busyness })`
  writes a spec from a theme (palette, trees, shrubs, rocks, scatter). It's deterministic
  for a seed and keeps clear space around anchors.
- `src/kit/world.ts`: `createWorld(scene, kit)` holds islands in groups (`route`, `next`…),
  builds each group lazily the first time it's shown (one island per short pause, with a
  ground texture sized to the island), and hides far scatter.

## Islands built with it

- Blossom Isle (`src/worlds/blossom-isle.ts`), Level 1.
- Loom Isle (`src/worlds/loom-isle.ts`), Stop 2's island. Built from data only, as the
  second fixture; its Word Loom is a stand-in until the learning design is approved.
- Five scenery islands along the flight (`src/worlds/sky-route.ts`), generated from the
  meadow and harvest themes.

## Budgets (Blossom Isle, medium tier)

About 400 instances in about 50 instanced draws. The whole view is about 280k triangles
with 110–150 draws, counting the shadow pass. Small scatter is hidden when the player is
more than 32 m away.
