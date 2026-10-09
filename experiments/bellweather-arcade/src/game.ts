// The First Words' manifest (kit/manifest.ts): what this game is made of, for the game itself
// (saves), its checks, AI play-testers and agents. Data only: everything it names is the
// same object the game plays with.
import type { GameManifest } from './kit/manifest';
import { ECHO_SKIFF_STATION, ECHO_SKIFF_RULES } from './worlds/first-words-echo';
import { FIRST_WORDS_L1_STATIONS } from './worlds/first-words-stations';
import { GATE_RULES, RELAY_RULES } from './worlds/first-words-rules';
import { LOOM_STATION, LOOM_RULES, STOP2_STORY } from './worlds/stop2-loom';
import { FIRST_WORDS_PROGRESS } from './worlds/first-words-progress';
import { FIRST_WORDS_L1 } from './worlds/first-words-story';
import { FIRST_WORDS_SOUND, FIRST_WORDS_BEAT_SOUND } from './worlds/first-words-sound';
import { FIRST_WORDS_CAST, FIRST_WORDS_SPOKEN, FIRST_WORDS_DIRECTION } from './worlds/first-words-voice';

const live = (id: string) => FIRST_WORDS_L1_STATIONS.find(s => s.id === id)!;

export const GAME: GameManifest = {
  schema: 'vibelearn.game.v1',
  id: 'first-words',
  title: 'Bellweather: The First Words',
  teaches: 'How a language model works: it makes text one word (then one piece) at a time, from everything in front of it.',
  audience: '18+',
  protagonist: 'Zip',
  // the game players get (tools/hosted/index.html, #painted) at low quality. Until 9 Oct tests and
  // blind testers ran without the atelier, the crafted portal and the rest, so a dead-end alley by
  // Mira's tree, only in the shipped town, went unseen (found by Claude playing on Desmic's PC)
  testEntry: 'study=facade&portal=crafted&architecture=atelier&finish=daylight&palette=ceramic&form=swept-clean&character=courier&look=sunlit&setting=city&districts=terraces&surface=illustrated&render=painted&quality=low&auto=0',
  storage: {
    save: 'bellweather.save.v1', learning: 'bellweather.learning.v1', decided: 'bellweather.decided.v1',
    prefs: ['bellweather.mute', 'bellweather.graphics', 'bellweather.stats', 'vibelearn.music'],
  },
  // Stop 1 wakes the skiff with Echo (the in-world version; the older panel version in
  // first-words-stations.ts is kept for `mech=` comparisons only), then the Gate and the relay
  stations: [ECHO_SKIFF_STATION, live('blossom-gate'), live('relay-contact'), LOOM_STATION],
  rules: [ECHO_SKIFF_RULES, GATE_RULES, RELAY_RULES, LOOM_RULES],
  progress: FIRST_WORDS_PROGRESS,
  stories: [FIRST_WORDS_L1, STOP2_STORY],
  sound: { spec: FIRST_WORDS_SOUND, beats: FIRST_WORDS_BEAT_SOUND },
  voice: { cast: FIRST_WORDS_CAST, spoken: FIRST_WORDS_SPOKEN, direction: FIRST_WORDS_DIRECTION },
  learningDesign: ['design/stop1-learning-design.json', 'design/stop2-loom-learning-design.json'],
  // drafts (6 Oct) for Desmic to correct: what a newcomer should be able to tell back, and feel
  intent: {
    story: [
      { id: 'story-mira', draft: true, text: 'Mira, a friend at the outlook, is taken by the Warden; Zip sets out to get her back.' },
      { id: 'story-voice', draft: true, text: 'The Warden\'s attack knocks out Zip\'s voice; getting it back, coil by coil, is what lets him speak (and wake the skiff).' },
      { id: 'story-journey', draft: true, text: 'The way to Mira is a journey isle to isle by skiff, and each isle mends a part of Zip\'s word engine.' },
    ],
    experience: [
      { id: 'feel-opening', draft: true, text: 'The first minute makes them curious: a strange, lovely world and a robot who is a bit self-aware.' },
      { id: 'feel-humour', draft: true, text: 'Zip\'s dry thoughts and the engine\'s mistakes make them smile or laugh.' },
      { id: 'feel-agency', draft: true, text: 'Fixing the engine feels like working it out themselves, not following instructions.' },
      { id: 'feel-flow', draft: true, text: 'They get from story to puzzle without long, lost wandering.' },
      { id: 'feel-reward', draft: true, text: 'Rewards (stars, new words, a waking skiff) feel earned and make them want the next part.' },
    ],
  },
  input: ['touch', 'keyboard', 'mouse'],
  devices: { low: 'Galaxy F15 (phone, 720p, Mali-G57)', laptop: 'Desmic\'s laptop (Chrome)' },
  tests: 'tools/games/first-words.mjs',
  nouns: ['Bellweather', 'First Words', 'first-words', 'Zip', 'Mira', 'Warden', 'Tavi', 'Blossom', 'Loom', 'skiff', 'Skiff', 'Echo & Engine'],
};
