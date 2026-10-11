import type { PlayGroup } from '../kit/menu-tabs';

// Every way into Bellweather right now, for the menu's Play tab (Desmic, 11 Oct: "tabs for jumping
// between experimental gameplays"). Chapters start the story part-way (the save is only trusted as
// far as its learning record goes, so a jump never earns anything); experiments are off the story.
export const PLAY_MODES: PlayGroup[] = [
  {
    title: 'Story: The First Words',
    modes: [
      { id: 'story', label: 'Title screen', note: 'Start or continue the story', set: {} },
      { id: 'ch-attack', label: 'The attack', note: 'The Warden takes Mira', set: { beat: 'attack' } },
      { id: 'ch-skiff', label: 'Wake the skiff', note: 'Words in the air, the speech engine', set: { beat: 'skiff' } },
      { id: 'ch-flight', label: 'The flight', note: 'Rings on the way to Blossom Isle', set: { beat: 'isle' } },
      { id: 'ch-gate', label: 'Blossom Isle: the Gate', note: 'Notes, the satchel, the Gate', set: { beat: 'land' } },
      { id: 'ch-relay', label: 'Blossom Isle: the relay', note: 'Call Mira', set: { beat: 'gate-open' } },
      { id: 'ch-loom', label: 'Loom Isle', note: 'Stop 2: the Word Loom', set: { beat: 'loom' } },
    ],
  },
  {
    title: 'Experiments',
    modes: [
      { id: 'lab-ngram', label: 'Next-word engine lab', note: 'How a model picks the next word', set: { lab: 'ngram' } },
      { id: 'lab-utter', label: 'Utterance lab A', note: 'Say things into existence', set: { lab: 'utter' } },
      { id: 'lab-utter-b', label: 'Utterance lab B', note: 'The same, another design to compare', set: { lab: 'utter-b' } },
      { id: 'mech-classic', label: 'Old skiff puzzle', note: 'The skiff before Echo & Engine', set: { beat: 'skiff', mech: 'classic' } },
      { id: 'free-walk', label: 'Free walk', note: 'Bellweather with no story', set: { story: '0' } },
    ],
  },
];
