import type { IslandSpec } from '../kit/dress';

// Loom Isle (Stop 2: tokens) as data: the second island built by the same kit
// and builders as Blossom Isle, with a different palette, size, layout and
// props. It proves the world system works for a new place without new code.
// Its puzzle, the Word Loom (station `loom-fit`), is data in stop2-*.ts and
// follows design/stop2-loom-learning-design.json.
//
// Placed beyond Blossom Isle, higher up, so it reads as "the next island".

export const LOOM_HARVEST = {
  ground: {
    grass: '#a9b874', grassLight: '#d6d395', grassDark: '#6f7f50',
    dirt: '#cf9f78', dirtLight: '#ecd0a8', dirtEdge: '#8e6450',
    specks: ['#e86f6f', '#f0c05a', '#6fb8e8', '#b07bff'], shade: '#5a5f8c',
  },
  strata: { top: '#8a6e52', bands: ['#dd9a66', '#c4745c', '#e3b47e', '#ad6c6c', '#ebc490'], under: '#6a5a9c', root: '#6b5040', cap: '#a9b874' },
};

export const LOOM_ISLE: IslandSpec = {
  id: 'loom-isle', seed: 7331, center: [-34, 96], radius: 12, depth: 11, topY: .13, elevation: 5, satellites: 7,
  palette: LOOM_HARVEST,
  anchors: [],
  entities: [
    { id: 'loom-landing', kind: 'landing-pad', at: [0, 10], r: 1.6 },
    { id: 'word-loom', kind: 'word-loom', at: [0, -1.5], r: 2.6, station: 'loom-fit' },
    { id: 'loom-talk', kind: 'talk-spot', at: [0, 1.4], r: .8, station: 'loom-fit' },
    { id: 'weaver-tavi', kind: 'character-spot', at: [-5.5, -5], r: 1.4 },
  ],
  paths: [
    { pts: [[0, 11.4], [.3, 8.4], [-.2, 5.2], [0, 2.2]], width: 1.4, stones: { role: 'path.slab', spacing: 1.0, scale: [.42, .52] } },
    // a ring round the loom plaza
    { pts: [[0, 2.2], [2.9, 1.2], [3.6, -1.6], [2.3, -4.2], [0, -5], [-2.4, -4.1], [-3.6, -1.4], [-2.8, 1.3], [0, 2.2]], width: 1.1 },
    { pts: [[-2.4, -4.1], [-4.4, -5.2], [-5.6, -5.3]], width: .8 },
    { pts: [[3.6, -1.6], [6.2, -2.6], [7.8, -4.4]], width: .8 },
  ],
  hedges: [],
  props: [
    { prop: 'wordLoom', at: [0, -1.5], rot: 0, params: { slots: 6 }, solid: 1.3 },
    { prop: 'clothLine', at: [6.4, -5.6], rot: -.6, params: { len: 3.6, seed: 2 } },
    { prop: 'clothLine', at: [-6.4, 3.6], rot: .4, params: { len: 3.2, seed: 7 } },
    { prop: 'clothLine', at: [5.8, 3.8], rot: 1.2, params: { len: 2.8, seed: 11 } },
    { prop: 'spoolStack', at: [2.2, -.2], rot: .3, params: { n: 5, seed: 3 }, solid: .4 },
    { prop: 'spoolStack', at: [-2.0, -3.0], rot: -.8, params: { n: 4, seed: 8 }, solid: .4 },
    { prop: 'lanternPost', at: [1.6, 9.0], params: {} },
    { prop: 'lanternPost', at: [-1.6, 9.0], rot: Math.PI, params: {} },
  ],
  landmarks: [
    { role: 'tree.twisted-ember', at: [-7.4, -7.8], scale: .3 },
    { role: 'tree.autumn', variant: 0, at: [7.8, 1.0], scale: .48 },
    { role: 'tree.autumn', variant: 1, at: [-8.4, -1.6], scale: .4 },
    { role: 'tree.autumn', variant: 2, at: [4.8, -8.6], scale: .46 },
    { role: 'tree.autumn', variant: 0, at: [-6.6, 7.4], scale: .44 },
    { role: 'tree.pine', variant: 0, at: [9.4, -3.6], scale: .36 },
    { role: 'tree.pine', variant: 2, at: [-10.0, 3.2], scale: .34 },
    { role: 'tree.blossom', variant: 2, at: [8.2, 7.0], scale: .4 },
    { role: 'rock.boulder', variant: 1, at: [-3.6, 8.6], scale: .3, fade: false, blockCamera: true },
    { role: 'rock.boulder', variant: 0, at: [10.0, 4.4], scale: .26, fade: false, blockCamera: true },
    { role: 'shrub.ember', at: [3.4, 4.8], scale: .44, fade: false },
    { role: 'shrub.ember', at: [-4.2, 4.2], scale: .4, fade: false },
    { role: 'shrub.flowering', at: [-4.8, -7.6], scale: .4, fade: false },
    { role: 'shrub.ember', at: [6.4, -6.4], scale: .38, fade: false },
  ],
  scatter: [
    { role: 'grass.tuft', density: .6, scale: [.22, .38], spacing: .34, variants: [1, 2, 3] },
    { role: 'flower.cluster', density: .06, scale: [.2, .28], spacing: .9 },
    { role: 'flower.single', density: .08, scale: [.2, .27], spacing: .5 },
    { role: 'plant.fern', density: .12, scale: [.3, .44], spacing: .8, region: { kind: 'disc', r: 11.4, r0: 8.4 } },
    { role: 'plant.broad', density: .04, scale: [.3, .42], spacing: 1 },
    { role: 'mushroom', density: .12, scale: [.24, .36], spacing: .5, region: { kind: 'around', placements: 'landmarks', r: 1.8 } },
    { role: 'pebble', density: .35, scale: [.6, 1.0], spacing: .3, onPathEdge: true },
  ],
};
