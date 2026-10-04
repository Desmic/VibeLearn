// The sound of "The First Words": music moods per story beat and ambience per place, as data
// for kit/soundscape.ts. Sparse on purpose: a few notes, then the wind and the birds.
import type { SoundscapeSpec } from '../kit/soundscape';

export const FIRST_WORDS_SOUND: SoundscapeSpec = {
  moods: {
    // the festival town before the attack: bright, unhurried (C major pentatonic)
    town: { scale: [0, 2, 4, 7, 9], root: 261.6, rest: [7, 16], notes: [3, 5], level: .8 },
    // after the attack: a minor colour, sparser, a low drone underneath (A)
    tension: { scale: [0, 2, 3, 7, 8], root: 220, rest: [9, 18], notes: [2, 4], level: .7, drone: .6 },
    // thinking at a puzzle: very sparse, open chords, nothing to hurry you (F maj7)
    puzzle: { scale: [0, 4, 7, 11], root: 174.6, rest: [12, 22], notes: [2, 3], level: .5 },
    // flying the skiff: lydian lift, more notes, a soft drone (D)
    flight: { scale: [0, 2, 4, 6, 7, 9, 11], root: 293.7, rest: [4, 9], notes: [4, 7], level: .9, drone: .4, span: 2 },
    // Blossom Isle: warm and open (G major pentatonic)
    isle: { scale: [0, 2, 4, 7, 9], root: 196, rest: [8, 15], notes: [3, 5], level: .8 },
    // Loom Isle: a weaver's dorian (E)
    loom: { scale: [0, 2, 3, 5, 7, 9, 10], root: 164.8, rest: [8, 16], notes: [3, 5], level: .75 },
  },
  places: {
    town: { wind: .5, birds: .8, water: .4, chimes: .6 },
    // the town after the ship: the birds have gone quiet, the bells still stir
    'town-after': { wind: .7, birds: .15, water: .4, chimes: .3 },
    sky: { wind: 1 },
    isle: { wind: .4, birds: 1, chimes: .2 },
    loom: { wind: .5, birds: .5, water: .2 },
  },
};

/** which mood and place each story beat sounds like (null mood: the music rests) */
export const FIRST_WORDS_BEAT_SOUND: Record<string, { mood: string | null; place: string }> = {
  meet: { mood: 'town', place: 'town' },
  attack: { mood: null, place: 'town' },
  spark: { mood: 'tension', place: 'town-after' },
  skiff: { mood: 'tension', place: 'town-after' },
  puzzle: { mood: 'puzzle', place: 'town-after' },
  fly: { mood: 'flight', place: 'sky' },
  isle: { mood: 'isle', place: 'isle' },
  'to-loom': { mood: 'isle', place: 'isle' },
  loom: { mood: 'loom', place: 'loom' },
  'loom-puzzle': { mood: 'puzzle', place: 'loom' },
  'loom-done': { mood: 'loom', place: 'loom' },
};
