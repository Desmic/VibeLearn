import { generateIslandSpec, type IslandTheme } from '../kit/generate';
import { BELLWEATHER_MEADOW } from './blossom-isle';
import { LOOM_HARVEST } from './loom-isle';

// Scenery islands along the skiff's flight, generated from two themes. They sit
// clear of the wind rings (the lane in flight.ts) and are only shown in the sky.

export const MEADOW_THEME: IslandTheme = {
  id: 'meadow', palette: BELLWEATHER_MEADOW,
  trees: [{ role: 'tree.blossom', scale: [.36, .5] }, { role: 'tree.lilac', variants: [0], scale: [.32, .4] }, { role: 'tree.broadleaf', scale: [.34, .44] }],
  shrubs: [{ role: 'shrub.flowering', scale: [.34, .44] }, { role: 'shrub.round', scale: [.4, .5] }],
  rocks: [{ role: 'rock.boulder', scale: [.22, .32] }],
  scatter: [
    { role: 'grass.tuft', density: .45, scale: [.22, .34], spacing: .4, variants: [0, 1, 2] },
    { role: 'flower.cluster', density: .06, scale: [.2, .28], spacing: .9 },
    { role: 'petal.scatter', density: .2, scale: [.32, .46], spacing: .4, pathClear: -1, region: { kind: 'around', placements: 'landmarks', r: 1.8 } },
  ],
};

export const HARVEST_THEME: IslandTheme = {
  id: 'harvest', palette: LOOM_HARVEST,
  trees: [{ role: 'tree.autumn', scale: [.36, .48] }, { role: 'tree.pine', variants: [0, 1, 2], scale: [.3, .38] }],
  shrubs: [{ role: 'shrub.ember', scale: [.34, .44] }],
  rocks: [{ role: 'rock.boulder', scale: [.22, .3] }],
  scatter: [
    { role: 'grass.tuft', density: .45, scale: [.24, .36], spacing: .4, variants: [1, 2, 3] },
    { role: 'plant.fern', density: .08, scale: [.3, .4], spacing: .9 },
    { role: 'mushroom', density: .1, scale: [.24, .34], spacing: .5, region: { kind: 'around', placements: 'landmarks', r: 1.6 } },
  ],
};

export const SKY_ROUTE = [
  generateIslandSpec({ seed: 101, center: [-22, -64], radius: 5, elevation: 2, theme: MEADOW_THEME, busyness: .6 }),
  generateIslandSpec({ seed: 202, center: [-50, -40], radius: 4, elevation: 7, theme: HARVEST_THEME, busyness: .5 }),
  generateIslandSpec({ seed: 303, center: [-57, -6], radius: 6, elevation: 9, theme: MEADOW_THEME, busyness: .4 }),
  generateIslandSpec({ seed: 404, center: [-52, 24], radius: 4, elevation: 5, theme: HARVEST_THEME, busyness: .6 }),
  generateIslandSpec({ seed: 505, center: [-30, 52], radius: 5, elevation: -3, theme: MEADOW_THEME, busyness: .5 }),
];
