// The next-word lab (`lab=ngram`, 6 Oct): the utterance test area rebuilt around a next-word
// engine (kit/ngram.ts), the first step of the learning track Desmic sketched (6 Oct): "we are
// essentially starting with a 2 or 3 gram model; teach the basics through levels, like how word
// frequency affects the words produced; then producing a useful word makes an object".
//
// Zip picks only the first word. After that his engine suggests what comes next, from what it has
// read: every sign he absorbs is read into it. It says only its likeliest few, and shows how often
// it has read each. Three places, one idea each:
//   1. the first gap: the engine offers what it has read after a word ("stone" -> bridge, steps);
//   2. the wide gap: "bridge" has been read after "long" once, and "way" three times, so the engine
//      won't say "long bridge". Reading the builders' song (three more "long bridge"s) lifts it to
//      the top. More of a thing in what it reads, likelier it is said;
//   3. the dark doorway: after "paper" its favourite is "plane". Left to finish on its own it says
//      "paper plane". The likeliest word isn't always the one you need: you steer. And "lantern"
//      only becomes sayable once the lantern hook is read too, so the last place needs what the
//      first two taught (run 9's tester asked for that; run 12's never met the top-three cutoff).
// Every wrong phrase still makes something, or nothing, in its own funny way (kit/utter.ts).
// tools/ngramcheck.mjs proves each place solvable in any reading order, and the wide gap not
// solvable without the song.
import type { NgramLabSpec } from '../kit/ngram';
import type { WordSource } from './first-words-echo';
import type { LabVariant } from '../utter-lab';
import { UTTER_LAB } from './utter-lab';

export const NGRAM_LAB: NgramLabSpec = {
  schema: 'vibelearn.ngram.v1',
  id: 'first-words.ngram-lab',
  n: 2, top: 3, show: 5,
  // what Zip's engine had read before he got here (a phrasebook from the workshop): it is why
  // "long" leans to "way", and "paper" to "plane"
  pretrain: [
    'It’s a long way down.', 'A long way from home.', 'The long way round.',
    'Long ago.', 'So long ago.',
    'A long noodle.', 'Long noodle soup.',
    'One long bridge.',
    'Throw the paper plane.', 'Fold a paper plane.', 'A paper plane.',
    'A paper cut.', 'Ow, a paper cut.',
    'A paper hat.', 'Fold a paper hat.',
  ],
  utter: {
    ...UTTER_LAB,
    id: 'first-words.ngram-lab.utter',
    lexicon: {
      bridge: { kind: 'thing', thing: 'bridge' },
      rope: { kind: 'thing', thing: 'rope', asMaterial: { material: 'rope' } },
      stone: { kind: 'thing', thing: 'stone', asMaterial: { material: 'stone', glow: .05 } },
      noodle: { kind: 'thing', thing: 'noodle' },
      plane: { kind: 'thing', thing: 'plane' },
      lantern: { kind: 'thing', thing: 'lantern' },
      long: { kind: 'size', scale: 2 },
      paper: { kind: 'material', material: 'paper', weak: true },
    },
    // the engine finishes phrases itself now (let it finish), so no designer guesses
    guesses: {},
    experience: [
      { id: 'feel-reading', draft: true, text: 'Reading a sign and seeing the engine’s suggestions change feels like teaching it.' },
      { id: 'feel-funny', draft: true, text: 'The engine’s favourite words lead somewhere silly, and that makes them laugh.' },
      { id: 'feel-clever', draft: true, text: 'Getting the engine to say what they need feels clever, not lucky.' },
    ],
    // `words` is unused here: what can be said comes from reading (NGRAM_LAB.places)
    sites: [
      { id: 'first-gap', asks: 'Cross the gap', need: { archetype: 'span', length: 3.9 }, words: [], slots: 3 },
      { id: 'wide-gap', asks: 'Cross the wide gap', need: { archetype: 'span', length: 7.5 }, words: [], slots: 3 },
      { id: 'dark-door', asks: 'Light the dark doorway', need: { archetype: 'light', brightness: 1 }, words: [], slots: 3 },
    ],
    lines: {
      ...UTTER_LAB.lines,
      nothing: 'Just “{word}”. The engine waited for a thing to make.',
      'too-short': 'A {thing}. Shorter than this gap. I never said how long.',
      // phrases the engine likes that make nothing useful (the first two words or more decide)
      'say:long way': 'A long way. Down. Thank you, engine.',
      'say:long ago': 'It made… the past. Long ago. No use to anyone now.',
      'say:stone steps': 'Stone steps? I got one stone. Steps sold separately.',
      'say:rope burns': 'Rope burns. Ow. And a rope. No bridge.',
      'say:paper cut': 'A paper cut. In mid-air. Somehow, ow.',
      'say:paper plane': 'A paper plane. Its favourite. Not a light, though.',
      'say:paper hat': 'A paper hat. Very fetching. Very dark.',
      // tapping a word it has read too rarely to say
      rare: '“{word}” after “{after}”? Read it {n}. “{top}”, {m}. It says the likely ones.',
      // reading: what it learned
      read: 'Read it. My engine learned {pairs}.',
      favourite: 'Now “{word}” beats “{was}” after “{after}”.',
      'goal-words': 'Absorb a word from a sign',
      done: 'Across the sky on a phrasebook, a song and a paper note.',
    },
  },
  places: [
    { site: 'first-gap', reads: ['stone-sign', 'rope-coil'], lesson: 'after a word, the engine offers what it has read after it' },
    { site: 'wide-gap', reads: ['stone-sign', 'rope-coil', 'drop-sign', 'song-board'], key: 'song-board', lesson: 'the more often it has read a pair, the likelier it says it' },
    { site: 'dark-door', reads: ['stone-sign', 'rope-coil', 'drop-sign', 'song-board', 'paper-note', 'hook-sign'], key: 'hook-sign', lesson: 'what the first two taught, together: read more to make the word you need sayable, then steer past its favourite' },
  ],
};

/** platforms of radius 3.8 at x 60, 71 and 85.6 (src/utter-lab.ts); words sit well away from where Zip speaks.
 *  Each source's line is what the engine reads when Zip absorbs it; its word is one he can start with. */
export const NGRAM_LAB_SOURCES: WordSource[] = [
  { id: 'stone-sign', word: 'stone', line: 'Stone bridge ahead. Mind the stone steps.', kind: 'sign', at: [58.2, -42.6], y: 2.0, reach: 2.6 },
  { id: 'rope-coil', word: 'rope', line: 'Rope bridge closed. Rope burns, open.', kind: 'object', at: [58.0, -37.5], y: 1.0, reach: 2.6 },
  { id: 'drop-sign', word: 'long', line: 'Long drop. Do not look down.', kind: 'sign', at: [68.6, -42.7], y: 2.0, reach: 2.6 },
  { id: 'song-board', word: 'bridge', line: 'The builders’ song: long bridge, long bridge, build a long bridge!', kind: 'sign', at: [68.8, -37.3], y: 2.2, reach: 2.6 },
  { id: 'paper-note', word: 'paper', line: 'Paper plane, free. Paper lantern, one coin.', kind: 'sign', at: [83.2, -42.7], y: 1.7, reach: 2.6 },
  // read only the note, and "lantern" is too rare to say after "paper"; the hook makes it sayable
  { id: 'hook-sign', word: 'paper', line: 'Lantern hook. Hang a paper lantern here. Paper lantern only!', kind: 'sign', at: [83.4, -37.2], y: 2.0, reach: 2.6 },
];

export const NGRAM_LAB_VARIANT: LabVariant = {
  radius: 3.8, speakReach: 3, reachTap: 5, ringShot: false,
  places: ['The first gap', 'The wide gap', 'The dark doorway'],
  firstFail: 'Not what I meant. But it’s what my engine likes. Wrong is free here.',
  summaryStays: true,
  intro: ['Words everywhere. Everything I absorb, my engine reads.', 'I pick a first word. It suggests what comes next.'],
};
