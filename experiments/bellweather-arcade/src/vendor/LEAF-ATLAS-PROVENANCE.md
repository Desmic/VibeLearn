# Painted leaf atlas reuse

`leafAtlas.ts` is copied from the already reviewed Summer Cycle source at
commit `8b977baad061e797c2f6c19cfcf07c1e79b23a67`, original path
`src/render/leafAtlas.ts`, via this repository's preserved
`experiments/bellweather-world/src/vendor/summer-cycle/render/leafAtlas.ts`.

Source: https://github.com/StarKnightt/summer-cycle
License: MIT; complete text retained in `SUMMER-CYCLE-LICENSE` beside this file.
Changes: local RNG import; renderer argument optional with anisotropy 4 fallback.
The red-channel painted tone and alpha are interpreted by `canopy.ts`; encoded
random green-channel data is not treated as RGB colour. The original atlas
is retained intact; new blossom silhouettes and canopy normals are VibeLearn work.
No upstream film/reference images or model attribution are imported by this reuse.
