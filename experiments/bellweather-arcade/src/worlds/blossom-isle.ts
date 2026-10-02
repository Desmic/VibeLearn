import type { IslandSpec } from '../kit/dress';

// Blossom Isle (Level 1, outcome `context`) as data. Island-local metres,
// +z toward the landing, -z toward the gate and the relay. Gameplay objects
// (landing, satchel, notes, gate, relay) are placed here as entities; island.ts
// builds and runs them. To make the island calmer or busier, edit this file.

export const BELLWEATHER_MEADOW = {
  ground: {
    grass: '#93b97c', grassLight: '#bcd394', grassDark: '#5f8a66',
    dirt: '#cfae86', dirtLight: '#e8d4ae', dirtEdge: '#8d6e5a',
    specks: ['#fff6ef', '#f6a9c0', '#ffe08a', '#cdb8ff'], shade: '#56679a',
  },
  strata: { top: '#8a7a5e', bands: ['#e7bd94', '#cf9f86', '#bb8779', '#a184a3', '#d2ae90'], under: '#6d68a3', root: '#6b5647' },
};

export const BLOSSOM_ISLE: IslandSpec = {
  id: 'blossom-isle', seed: 4807, center: [0, 48], radius: 10, depth: 9, topY: .13,
  palette: BELLWEATHER_MEADOW,
  anchors: [],
  // gameplay objects: island.ts builds them where this list says; what the notes
  // say is the Gate station's content (first-words-stations.ts)
  entities: [
    { id: 'landing', kind: 'landing-pad', at: [0, 7.2], r: 1.5 },
    { id: 'satchel', kind: 'satchel-pedestal', at: [2.3, 5.4], r: .8, station: 'blossom-gate' },
    { id: 'note-mira', kind: 'note-board', at: [-4.5, 3], r: .6, station: 'blossom-gate', params: { note: 'mira' } },
    { id: 'note-poster', kind: 'note-board', at: [-2.4, 1.2], r: .6, station: 'blossom-gate', params: { note: 'poster' } },
    { id: 'note-warden', kind: 'note-board', at: [4.6, 1.6], r: .6, station: 'blossom-gate', params: { note: 'warden' } },
    { id: 'note-rumour', kind: 'note-board', at: [5.4, 4.2], r: .6, station: 'blossom-gate', params: { note: 'rumour' } },
    { id: 'gate', kind: 'gate-arch', at: [0, -2], r: 1.9, station: 'blossom-gate' },
    { id: 'gate-stone', kind: 'talk-spot', at: [0, -.3], r: 1.1, station: 'blossom-gate' },
    { id: 'relay', kind: 'relay-tower', at: [0, -6.6], r: 1.4, station: 'relay-contact' },
  ],
  paths: [
    { pts: [[0, 8.8], [.2, 6.8], [-.1, 4.4], [.15, 1.8], [0, -.2], [0, -2.6], [-.1, -4.4], [0, -5.8]], width: 1.3, stones: { role: 'path.stone', spacing: 1.05, scale: [.42, .56] } },
    { pts: [[.1, 5.9], [1.3, 5.6], [2.0, 5.4]], width: .8 },
    { pts: [[0, 2.5], [-1.5, 1.8], [-3.2, 2.3], [-4.2, 2.8]], width: .8 },
    { pts: [[.1, 1.6], [2.3, 1.3], [4.1, 1.6], [5.1, 3.5]], width: .75 },
  ],
  hedges: [
    { from: [-9.3, -2], to: [-1.95, -2], role: 'shrub.round', scale: [.46, .56], spacing: .78 },
    { from: [1.95, -2], to: [9.3, -2], role: 'shrub.round', scale: [.46, .56], spacing: .78 },
  ],
  landmarks: [
    { role: 'tree.twisted', variant: 0, at: [-5.2, -7.0], scale: .3 },
    { role: 'tree.blossom', variant: 0, at: [-6.8, 5.6], scale: .5 },
    { role: 'tree.blossom', variant: 1, at: [7.0, -4.3], scale: .47 },
    { role: 'tree.blossom', variant: 2, at: [-7.4, -3.7], scale: .45 },
    { role: 'tree.blossom', variant: 1, at: [7.2, 6.1], scale: .43 },
    { role: 'tree.lilac', variant: 0, at: [-8.3, 1.4], scale: .36 },
    { role: 'tree.broadleaf', variant: 4, at: [4.8, -7.4], scale: .4 },
    { role: 'rock.boulder', variant: 0, at: [8.3, 1.0], scale: .32, fade: false, blockCamera: true },
    { role: 'rock.boulder', variant: 2, at: [-3.9, -8.2], scale: .28, fade: false, blockCamera: true },
    { role: 'shrub.flowering', at: [-5.7, 4.0], scale: .42, fade: false },
    { role: 'shrub.flowering', at: [6.0, 2.7], scale: .4, fade: false },
    { role: 'shrub.flowering', at: [3.1, 6.7], scale: .38, fade: false },
    { role: 'shrub.flowering', at: [-2.9, 6.6], scale: .4, fade: false },
    { role: 'shrub.flowering', at: [2.0, -7.7], scale: .36, fade: false },
    { role: 'shrub.flowering', at: [-2.0, -7.7], scale: .36, fade: false },
  ],
  scatter: [
    { role: 'grass.tuft', density: .7, scale: [.2, .34], spacing: .32, variants: [0, 0, 1, 2] },
    { role: 'plant.clover', density: .12, scale: [.26, .38], spacing: .5 },
    { role: 'flower.single', density: .1, scale: [.18, .26], spacing: .5 },
    { role: 'flower.cluster', density: .07, scale: [.18, .26], spacing: .9 },
    { role: 'plant.ground', density: .05, scale: [.35, .5], spacing: .8 },
    { role: 'plant.fern', density: .09, scale: [.28, .4], spacing: .9, region: { kind: 'disc', r: 9.5, r0: 7.3 } },
    { role: 'pebble', density: .4, scale: [.55, 1.0], spacing: .28, onPathEdge: true },
    { role: 'petal.scatter', density: .3, scale: [.32, .48], spacing: .3, pathClear: -1, region: { kind: 'around', placements: 'landmarks', r: 2.2 } },
    { role: 'mushroom', density: .05, scale: [.22, .32], spacing: .6, region: { kind: 'around', placements: 'landmarks', r: 1.6 } },
  ],
};
