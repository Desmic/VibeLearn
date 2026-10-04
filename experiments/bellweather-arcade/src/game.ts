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
  testEntry: 'study=facade&finish=daylight&render=painted&quality=low&auto=0',
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
  input: ['touch', 'keyboard', 'mouse'],
  devices: { low: 'Galaxy F15 (phone, 720p, Mali-G57)', laptop: 'Desmic\'s laptop (Chrome)' },
  tests: 'tools/games/first-words.mjs',
  nouns: ['Bellweather', 'First Words', 'first-words', 'Zip', 'Mira', 'Warden', 'Tavi', 'Blossom', 'Loom', 'skiff', 'Skiff', 'Echo & Engine'],
};
