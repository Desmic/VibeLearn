import * as T from 'three';
import type { FarNetOpts } from '../kit/far-net';

// The Warden's engine: where the ship took Mira, standing on the horizon beyond the isles (the way
// the route goes, a little off it). Zip's own net is a few dozen lights; this one is thousands.
// Its foot is down in the cloud sea, its crown above the highest isle.
export const SPIRE: FarNetOpts = {
  at: new T.Vector3(-190, -140, 560),
  height: 470,
  // a waist low down, a long slow swell, and a crown that opens like a flower
  radius: f => 11 + 9 * Math.sin(f * Math.PI * .85) * (1 - f * .7) + 52 * Math.pow(f, 6),
  seed: 11,
  size: 1.9,
  lattice: '#2b2757', glow: '#e4d4ff', spark: '#ffe2a0',
  haze: .3, hazeColor: '#a7c0dc',
};
