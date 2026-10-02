# Character tools

`bake-ual.js` retargets clips from the Quaternius Universal Animation Library
(Standard, CC0 1.0) onto the study's shared humanoid skeleton (`src/zip-rig.ts`
bone names) and writes `public/characters/zip-ual-clips.json`. The game never
loads the 7.6 MB library itself.

1. Put `UAL1_Standard.glb` next to this file. The source is `assets/third-party/quaternius/ual/`, and the license is in the same folder.
2. Serve the built study (`out/` or `dist/`) with `tools/` copied into it, then open `tools/bake.html`.
3. `window.__baked` holds the JSON. Save it to `public/characters/zip-ual-clips.json`.
4. `tools/check.html` compares limb directions between the library and Zip for the Idle clip, as a quick retarget sanity check.

Method: the torso, neck and head take the library's world-space rotation changes
directly. The limbs are first aligned from Zip's arms-down rest pose to the
library's reference pose, then the same rotation changes are applied. Hips
movement is scaled to each character's hip height.
