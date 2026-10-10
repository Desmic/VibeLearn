import type * as T from 'three';

// Layering hand-made motion (a head turning to look, ears, a scarf) on top of animation clips.
//
// three.js's AnimationMixer writes a bone only when the value it works out differs from the one
// it wrote last time. A rig that puts its bones back to the rest pose before each mixer update (so
// the extra motion it multiplies in afterwards doesn't pile up) is therefore left AT REST for any
// frame where a clip holds still: two equal keys, a loop's seam. On 11 Oct that read as Zip and
// the townsfolk flickering while idle, about every second (a 14-48° pop for one frame, then back).
//
// So: before the mixer, put each bone back to what the mixer last left it at (not to rest); after
// the mixer, keep that pose; then layer the extra motion on. A bone no clip animates keeps its
// first pose (the rest pose), as before.
export function poseBase(bones: T.Object3D[]) {
  const held = bones.map(b => b.quaternion.clone());
  return {
    /** before mixer.update: each bone as the mixer last left it */
    restore() { for (let i = 0; i < bones.length; i++) bones[i].quaternion.copy(held[i]); },
    /** right after mixer.update, before any layered motion */
    keep() { for (let i = 0; i < bones.length; i++) held[i].copy(bones[i].quaternion); },
  };
}
