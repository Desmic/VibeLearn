import type { IslandSpec } from '../kit/dress';

// Chime Isle (Stop 3: sampling and warmth) as data, the third island from the same kit and
// builders. A festival isle of bells gone silent: the chime tower in the middle (its vault locked
// by the Warden), the bard's square in front of it, lilac and blossom round the edge. Its puzzle is
// station `chime-warmth` (stop3-chime.ts), following design/stop3-warmth-learning-design.json.
//
// Placed past Loom Isle on the way to the Warden's engine, and higher again.

export const CHIME_DUSK = {
  ground: {
    grass: '#9fb98a', grassLight: '#cfe0a8', grassDark: '#62806a',
    dirt: '#d8b28e', dirtLight: '#f0d8b4', dirtEdge: '#9a7258',
    specks: ['#f29ac0', '#ffd36b', '#9fd8ff', '#c9a6ff'], shade: '#5e5a96',
  },
  strata: { top: '#86705e', bands: ['#e2a77c', '#c98a8a', '#ecc596', '#b48ab4', '#f0d0a0'], under: '#665aa4', root: '#6b5040', cap: '#9fb98a' },
};

export const CHIME_ISLE: IslandSpec = {
  id: 'chime-isle', seed: 9113, center: [-58, 150], radius: 13, depth: 12, topY: .13, elevation: 9, satellites: 8,
  palette: CHIME_DUSK,
  anchors: [],
  entities: [
    { id: 'chime-landing', kind: 'landing-pad', at: [0, 11], r: 1.6 },
    { id: 'chime-tower', kind: 'chime-tower', at: [0, -2.5], r: 2.8, station: 'chime-warmth' },
    { id: 'chime-talk', kind: 'talk-spot', at: [0, 1.2], r: .8, station: 'chime-warmth' },
    { id: 'bard-oriel', kind: 'character-spot', at: [2.4, .6], r: 1.2 },
    { id: 'crowd', kind: 'character-spot', at: [-3.2, 2.8], r: 2.4 },
  ],
  paths: [
    { pts: [[0, 12.4], [.4, 9.2], [-.3, 6.0], [0, 2.8]], width: 1.5, stones: { role: 'path.slab', spacing: 1.0, scale: [.42, .52] } },
    // the festival square in front of the tower
    { pts: [[0, 2.8], [3.4, 2.0], [4.2, -1.0], [3.0, -5.0], [0, -6.0], [-3.0, -5.0], [-4.2, -1.0], [-3.4, 2.0], [0, 2.8]], width: 1.3 },
    { pts: [[-3.4, 2.0], [-6.2, 3.4], [-8.0, 5.2]], width: .8 },
    { pts: [[4.2, -1.0], [7.2, -1.8], [9.0, -3.6]], width: .8 },
  ],
  hedges: [],
  props: [
    { prop: 'chimeTower', at: [0, -2.5], rot: 0, params: { tiers: 3 }, solid: 1.4 },
    { prop: 'lanternPost', at: [1.7, 10.0], params: {} },
    { prop: 'lanternPost', at: [-1.7, 10.0], rot: Math.PI, params: {} },
    { prop: 'lanternPost', at: [4.4, 2.4], params: {} },
    { prop: 'lanternPost', at: [-4.4, 2.4], rot: Math.PI, params: {} },
    // festival lights strung from the tower to the posts round the square (lit at dusk)
    { prop: 'lanternPost', at: [3.4, -5.4], params: {} },
    { prop: 'lanternPost', at: [-3.4, -5.4], rot: Math.PI, params: {} },
    { prop: 'festoon', at: [.5, -2.2], params: { to: [4.1, 4.5], h0: 4.6, h1: 1.62, sag: .45, n: 10, seed: 0 } },
    { prop: 'festoon', at: [-.5, -2.2], params: { to: [-4.1, 4.5], h0: 4.6, h1: 1.62, sag: .45, n: 10, seed: 1 } },
    { prop: 'festoon', at: [.6, -2.8], params: { to: [3.1, -2.6], h0: 4.4, h1: 1.62, sag: .4, n: 8, seed: 2 } },
    { prop: 'festoon', at: [-.6, -2.8], params: { to: [-3.1, -2.6], h0: 4.4, h1: 1.62, sag: .4, n: 8, seed: 3 } },
    { prop: 'festoon', at: [3.6, -5.4], params: { to: [-7.2, 0], h0: 1.62, h1: 1.62, sag: .5, n: 13, seed: 1 } },
    { prop: 'clothLine', at: [6.6, 4.4], rot: -.9, params: { len: 3.4, seed: 5 } },
    { prop: 'clothLine', at: [-6.8, -3.6], rot: .7, params: { len: 3.0, seed: 13 } },
  ],
  landmarks: [
    { role: 'tree.lilac', at: [-8.2, -6.4], scale: .42 },
    { role: 'tree.blossom', variant: 0, at: [8.4, -5.2], scale: .46 },
    { role: 'tree.blossom', variant: 1, at: [-9.2, 1.4], scale: .4 },
    { role: 'tree.blossom', variant: 2, at: [7.6, 6.8], scale: .42 },
    { role: 'tree.twisted', at: [-6.0, 8.6], scale: .34 },
    { role: 'tree.broadleaf', at: [10.2, 1.4], scale: .38 },
    { role: 'rock.boulder', variant: 1, at: [-4.0, 9.4], scale: .3, fade: false, blockCamera: true },
    { role: 'rock.boulder', variant: 0, at: [10.6, -6.2], scale: .26, fade: false, blockCamera: true },
    { role: 'shrub.flowering', at: [3.8, 5.4], scale: .44, fade: false },
    { role: 'shrub.flowering', at: [-4.6, 5.0], scale: .4, fade: false },
    { role: 'shrub.round', at: [5.6, -6.8], scale: .4, fade: false },
    { role: 'shrub.flowering', at: [-6.4, -7.4], scale: .38, fade: false },
  ],
  scatter: [
    { role: 'grass.tuft', density: .55, scale: [.22, .38], spacing: .34, variants: [1, 2, 3] },
    { role: 'flower.cluster', density: .08, scale: [.2, .28], spacing: .9 },
    { role: 'flower.single', density: .1, scale: [.2, .27], spacing: .5 },
    { role: 'petal.scatter', density: .1, scale: [.3, .5], spacing: .7 },
    { role: 'plant.fern', density: .1, scale: [.3, .44], spacing: .8, region: { kind: 'disc', r: 12.4, r0: 9.2 } },
    { role: 'mushroom', density: .1, scale: [.24, .36], spacing: .5, region: { kind: 'around', placements: 'landmarks', r: 1.8 } },
    { role: 'pebble', density: .35, scale: [.6, 1.0], spacing: .3, onPathEdge: true },
  ],
};
