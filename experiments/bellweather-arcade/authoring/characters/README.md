# Characters: the body kit

`build_body_kit.py` builds a library of character parts in Blender, all skinned to the shared
17-bone humanoid skeleton (the same names and rest joints as `src/townsfolk-rig.ts`), and
exports `public/characters/body-kit.glb` (Draco).

- **Parts** are named `<slot>.<variant>`: `head.round`, `face.eyes`, `hair.bob|bun|short|long`,
  `hat.wide|cone|beret`, `top.tunic|vest`, `shawl.wrap`, `arms.sleeve|puff`, `lower.coat|skirt|apron`,
  `legs.trousers|stockings`, `shoes.boot`, `bag.satchel|strap`, and more.
- **Colour**: each vertex carries a light detail colour; `uv.x` says how the game tints it:
  0 keep, 1 multiply by the part's main colour, 2 by its accent colour. One kit, any palette.
- **Weights**: hard parts follow one bone; coats and skirts blend from the hips to the legs,
  sleeves bend at the elbow.

In the game (`src/kit/body-kit.ts`) a **look** lists parts and colours. `assembleLook` merges
them into one geometry (one draw call per person), remaps joints by bone name, and the shared
clip library animates it. `townsfolkLook(seed)` varies hats, hair, clothes and colours;
`MIRA_LOOK` is Mira. `?bodies=code` keeps the old code-built people.

Run in Blender:

```python
import runpy
runpy.run_path(r"E:\...\bellweather-arcade\authoring\characters\build_body_kit.py",
               init_globals={"OUT": r"E:\...\bellweather-arcade\public\characters\body-kit.glb"})
```

Characters are original designs; none is modelled on a real person.
