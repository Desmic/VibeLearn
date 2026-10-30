import type { Mood, MoodAnchor } from '../kit/sky-mood';

// The First Words is one day: morning in the garden and on Blossom Isle, a long golden afternoon
// at the Loom, dusk and lanterns at the Chime festival. The Warden's engine glows brighter as the
// light goes, so by dusk it is the brightest thing on the horizon (where Mira was taken).
// `morning` is the painted daylight look the game had before moods (30 Sep look-dev), kept.
export const FIRST_WORDS_MOODS: Record<string, Mood> = {
  morning: {
    zenith: '#1f6fc4', mid: '#86bdea', horizon: '#f4e6d2', below: '#c9c3dc',
    sunDir: [-16, 18, 7], sunColor: '#ffe0b0', sunIntensity: 3.3,
    glow: '#fff1d6', glowStrength: .5,
    hemiSky: '#c9d6ff', hemiGround: '#8a7aa8', hemiIntensity: .34,
    fog: '#b9cbeb', fogDensity: .0046, exposure: 1.02,
    clouds: '#ffffff', stars: 0, lamps: 0, farGlow: 1, farHaze: .3,
    moon: .38, aurora: 0, air: '#fff3dc', fireflies: 0, streams: 0,
  },
  afternoon: {
    zenith: '#2a62b0', mid: '#a3bfdc', horizon: '#ffcf96', below: '#dcb8b8',
    sunDir: [-17, 9, 9], sunColor: '#ffbd78', sunIntensity: 3.4,
    glow: '#ffd59a', glowStrength: .9,
    hemiSky: '#d4cdf6', hemiGround: '#9a7c86', hemiIntensity: .36,
    fog: '#e0c6b4', fogDensity: .0048, exposure: 1.03,
    clouds: '#fff0dd', stars: 0, lamps: .15, farGlow: 1.25, farHaze: .28,
    moon: .5, aurora: 0, air: '#ffe2b0', fireflies: .1, streams: .2,
  },
  dusk: {
    zenith: '#17184a', mid: '#6b4f98', horizon: '#ff9b5e', below: '#8a5a86',
    // low in the west, a little left of the engine as seen from the festival
    sunDir: [-11, 3.4, 15], sunColor: '#ff9a5e', sunIntensity: 1.95,
    glow: '#ffa060', glowStrength: 1.6,
    hemiSky: '#8a80d8', hemiGround: '#4f3758', hemiIntensity: .55,
    fog: '#a98ab0', fogDensity: .005, exposure: .93,
    clouds: '#e9a6b8', stars: .9, lamps: .85, farGlow: 2.4, farHaze: .12,
    moon: 1, aurora: .9, air: '#ffd27a', fireflies: 1, streams: 1,
  },
};

// Where each mood holds (island centres from the island specs; r: how far it holds fully).
// The dream's moon: high over the isles on the far side from the Warden's engine, ringed, in
// the sky all day (pale by day, bright at dusk).
export const FIRST_WORDS_MOON = { dir: [.22, .34, -.91] as [number, number, number], size: .09, color: '#fff1df', ring: true, tilt: .38 };

export const FIRST_WORDS_MOOD_ANCHORS: MoodAnchor[] = [
  { at: [0, 0], mood: 'morning', r: 30 },       // the garden
  { at: [0, 48], mood: 'morning', r: 16 },      // Blossom Isle
  { at: [-34, 96], mood: 'afternoon', r: 16 },  // Loom Isle
  { at: [-58, 150], mood: 'dusk', r: 18 },      // Chime Isle
];
