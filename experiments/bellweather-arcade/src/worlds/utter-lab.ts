// The utterance test area (kit/utter.ts): three places Zip crosses or lights by saying a thing
// into existence from words he carries. A lab off the story path (`lab=utter`) to try the feel
// before the mechanic joins a stop. Each place has several right phrasings and funny wrong ones;
// tools/uttercheck.mjs proves it. Lines follow the house style (twelve words a sentence).
import type { UtterSpec } from '../kit/utter';
import type { WordSource } from './first-words-echo';
import type { LabVariant } from '../utter-lab';

export const UTTER_LAB: UtterSpec = {
  schema: 'vibelearn.utter.v1',
  id: 'first-words.utter-lab',
  lexicon: {
    bridge: { kind: 'thing', thing: 'bridge' },
    plank: { kind: 'thing', thing: 'plank', asMaterial: { material: 'wooden' } },
    rope: { kind: 'thing', thing: 'rope', asMaterial: { material: 'rope' } },   // "rope bridge": a bridge of rope
    lantern: { kind: 'thing', thing: 'lantern' },
    tiny: { kind: 'size', scale: .15 },
    long: { kind: 'size', scale: 2 },
    paper: { kind: 'material', material: 'paper', weak: true },   // a paper lantern glows fine
    jelly: { kind: 'material', material: 'jelly', glow: .8 },
    stone: { kind: 'thing', thing: 'stone', asMaterial: { material: 'stone', glow: .05 } },   // "stone bridge"; a stone lantern: solid, dark; alone, just a stone
    away: { kind: 'facing', away: true },
  },
  things: {
    bridge: { archetype: 'span', size: 4, look: 'bridge' },
    plank: { archetype: 'span', size: 2.5, look: 'plank' },
    rope: { archetype: 'prop', size: 1, look: 'rope' },
    lantern: { archetype: 'light', size: 1, look: 'lantern' },
    noodle: { archetype: 'span', size: 6, weak: true, look: 'noodle' },
    bean: { archetype: 'prop', size: 1, look: 'bean' },
    plane: { archetype: 'prop', size: 1, look: 'plane' },
    wall: { archetype: 'prop', size: 1, look: 'wall' },
    stone: { archetype: 'prop', size: 1, look: 'stone' },
  },
  // stop mid-phrase and the engine finishes it with its likeliest next word
  guesses: { long: 'noodle', jelly: 'bean', paper: 'plane', tiny: 'bridge' },
  sites: [
    // words carried by the time the player gets here (they come from the world: UTTER_LAB_SOURCES)
    { id: 'first-gap', asks: 'Cross the gap', need: { archetype: 'span', length: 3.9 }, words: ['bridge', 'plank', 'tiny', 'long', 'rope', 'away'], slots: 3 },
    { id: 'wide-gap', asks: 'Cross the wide gap', need: { archetype: 'span', length: 7.5 }, words: ['bridge', 'plank', 'tiny', 'long', 'rope', 'away', 'paper', 'jelly', 'stone'], slots: 3 },
    { id: 'dark-door', asks: 'Light the dark doorway', need: { archetype: 'light', brightness: 1 }, words: ['bridge', 'plank', 'tiny', 'long', 'rope', 'away', 'paper', 'jelly', 'stone', 'lantern'], slots: 3 },
  ],
  lines: {
    works: 'It worked. I said it, and there it is.',
    'works-long': 'A long one. Exactly as long as I said.',
    'works-jelly': 'A jelly bridge. It wobbles. It holds. I love it.',
    'works-stone': 'Stone. Solid. Boring. Perfect.',
    'works-rope': 'A rope bridge. Swaying, but mine.',
    'works-paper': 'A paper lantern. Of course paper glows.',
    'works-lantern': 'Light! The doorway was hiding something after all.',
    'wrong-kind-rope': 'A rope. Just a rope. The bridge part got lost.',
    'wrong-kind-stone': 'A stone. I asked for a stone. Fair.',
    'wrong-kind-jelly': 'A jelly {thing}. Delicious. Useless.',
    'too-short': 'The {thing} came up short. I never said how long.',
    'too-short-tiny': 'I said tiny. It listened. Very literally.',
    'too-short-sized': '“Long,” I said. Not long enough, it turns out.',
    'too-weak': 'It held for exactly one step. Note to self: material matters.',
    'too-weak-paper': 'Paper. The sign did warn me.',
    'too-weak-noodle': 'A long… noodle. Al dente, at best.',
    'wrong-way': 'Perfect {thing}. Pointing the wrong way.',
    'wrong-kind': 'A {thing}. Lovely. Not what this place needs.',
    'too-dim': 'A {material} lantern. Solid. Dark. Lovely.',
    'too-dim-tiny': 'Too dim to see by. I did ask for tiny.',
    nothing: 'The engine heard nothing it could make.',
    late: 'I said "{word}" after the {thing} was made. Too late.',
    guessed: 'I stopped mid-phrase. The engine finished it: {thing}.',
  },
};

/** where the words are: signs and things on each platform (Echo: walk close and absorb).
 *  Positions are in the lab's own space (src/utter-lab.ts: platforms at x 60, 69.4, 82.4; z -40). */
export const UTTER_LAB_SOURCES: WordSource[] = [
  { id: 'bridge-sign', word: 'bridge', line: '“BRIDGE OUT,” says the sign. Out where?', kind: 'sign', at: [58.3, -41.5], y: 2.0, reach: 2.6 },
  { id: 'plank-pile', word: 'plank', line: 'A pile of planks. One is labelled “plank”.', kind: 'object', at: [58.6, -38.3], y: 1.1, reach: 2.6 },
  { id: 'rope-coil', word: 'rope', line: 'A coil of rope. Very coiled.', kind: 'object', at: [60.4, -42.3], y: 1.0, reach: 2.6 },
  { id: 'away-sign', word: 'away', line: '“KEEP AWAY FROM THE EDGE.” Noted.', kind: 'sign', at: [61.3, -38.1], y: 2.0, reach: 2.6 },
  { id: 'long-sign', word: 'long', line: '“It\'s a long way down.” Encouraging.', kind: 'sign', at: [62.3, -42.3], y: 2.0, reach: 2.6 },
  { id: 'tiny-sign', word: 'tiny', line: 'A tiny sign. It just says “tiny”.', kind: 'sign', at: [59.4, -37.8], y: 1.2, reach: 2.6 },
  { id: 'paper-note', word: 'paper', line: '“Paper is not a building material.” Signed, the builders.', kind: 'sign', at: [68.4, -41.6], y: 1.7, reach: 2.6 },
  { id: 'jelly-jar', word: 'jelly', line: 'A jar of jelly. Wobbly. Pink. Suspicious.', kind: 'object', at: [69.0, -38.4], y: 1.1, reach: 2.6 },
  { id: 'stone', word: 'stone', line: 'A stone. Very stony.', kind: 'object', at: [70.4, -41.8], y: 1.3, reach: 2.6 },
  { id: 'lantern-hook', word: 'lantern', line: '“Lantern hook.” The lantern is missing.', kind: 'sign', at: [81.4, -41.8], y: 2.0, reach: 2.6 },
];

// ── Variant B (lab=utter-b, 5 Oct): built from the first blind play-test (docs/UTTER-DESIGN.md,
// run 5). Told nothing, a newcomer said the obvious phrase at every place, every one worked, and
// it never saw a failure, which is where most of the ideas live. So here the failures are on the
// main path, not a side quest:
//   - the likeliest bridge is a short one: "bridge" alone falls short of the first gap, and
//     "long" isn't lying around: the miss hands it over (SiteSpec.teaches);
//   - after a miss the ring opens with your phrase still in it, so the natural fix ("add long")
//     puts the word after the bridge, too late: order is met by doing, not told;
//   - the paper sign dares you; bigger platforms, fewer words lying around, each platform named.
// Variant A stays as Desmic reviews it; both are blind-tested the same way to compare.
// B's first version had "long" on a sign by the first gap: the blind tester (run 6) collected
// both words before speaking and said "long bridge" first time, so it never missed at all.
export const UTTER_LAB_B: UtterSpec = {
  ...UTTER_LAB,
  id: 'first-words.utter-lab-b',
  lexicon: { ...UTTER_LAB.lexicon, long: { kind: 'size', scale: 2.6 } },
  things: { ...UTTER_LAB.things, bridge: { archetype: 'span', size: 3, look: 'bridge' } },
  sites: [
    // "long" isn't lying around: the obvious "bridge" comes up short, and the miss hands over "long"
    { id: 'first-gap', asks: 'Cross the gap', need: { archetype: 'span', length: 3.9 }, words: ['bridge', 'tiny'], slots: 3, teaches: { reason: 'too-short', word: 'long' } },
    { id: 'wide-gap', asks: 'Cross the wide gap', need: { archetype: 'span', length: 7.5 }, words: ['long', 'bridge', 'tiny', 'rope', 'plank', 'paper', 'jelly', 'stone'], slots: 3 },
    { id: 'dark-door', asks: 'Light the dark doorway', need: { archetype: 'light', brightness: 1 }, words: ['long', 'bridge', 'tiny', 'rope', 'plank', 'paper', 'jelly', 'stone', 'lantern'], slots: 3 },
  ],
  lines: {
    ...UTTER_LAB.lines,
    'too-short': 'A {thing}. The likeliest one. Shorter than I needed.',
    'too-weak-paper': 'Paper. They did dare me.',
    'taught-long': 'I never said how long. “Long.” That’s the word I was missing.',
    'hint-late': 'The bridge was made the moment I said it. Say how long first.',
  },
};
/** platforms of radius 3.8 at x 60, 71 and 85.6 (src/utter-lab.ts lays them out from the radius) */
export const UTTER_LAB_B_SOURCES: WordSource[] = [
  { id: 'bridge-sign', word: 'bridge', line: '“BRIDGE OUT,” says the sign. Out where?', kind: 'sign', at: [60.5, -41.2], y: 2.0, reach: 2.6 },
  { id: 'tiny-sign', word: 'tiny', line: 'A tiny sign. It just says “tiny”.', kind: 'sign', at: [58.2, -36.9], y: 1.2, reach: 2.6 },
  { id: 'rope-coil', word: 'rope', line: 'A coil of rope. Very coiled.', kind: 'object', at: [68.4, -41.9], y: 1.0, reach: 2.6 },
  { id: 'plank-pile', word: 'plank', line: 'A pile of planks. One is labelled “plank”.', kind: 'object', at: [68.8, -38.1], y: 1.1, reach: 2.6 },
  { id: 'paper-note', word: 'paper', line: '“A paper bridge? Go on. We dare you.” Signed, the builders.', kind: 'sign', at: [70.6, -42.4], y: 1.7, reach: 2.6 },
  { id: 'jelly-jar', word: 'jelly', line: 'A jar of jelly. Wobbly. Pink. Suspicious.', kind: 'object', at: [72.2, -37.9], y: 1.1, reach: 2.6 },
  { id: 'stone', word: 'stone', line: 'A stone. Very stony.', kind: 'object', at: [73.0, -42.0], y: 1.3, reach: 2.6 },
  { id: 'lantern-hook', word: 'lantern', line: '“Lantern hook.” The lantern is missing.', kind: 'sign', at: [84.4, -41.9], y: 2.0, reach: 2.6 },
];
export const UTTER_LAB_B_VARIANT: LabVariant = {
  radius: 3.8, remember: true,
  places: ['The first gap', 'The wide gap', 'The dark doorway'],
  firstFail: 'Not what I meant. But I did say it. Wrong is free here.',
  summaryStays: true,
};
