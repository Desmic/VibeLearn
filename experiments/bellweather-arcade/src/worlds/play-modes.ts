import type { PlayGroup } from '../kit/menu-tabs';

// Every way into Bellweather right now, for the menu's Play tab (Desmic, 11 Oct: "tabs for jumping
// between experimental gameplays"). Chapters start the story part-way (the save is only trusted as
// far as its learning record goes, so a jump never earns anything); experiments are off the story.
// Names give nothing away (run 19 read "The Warden takes Mira" in this list before it happened):
// places, not events, and no line on what an experiment teaches.
export const PLAY_MODES: PlayGroup[] = [
  {
    title: 'Story: The First Words',
    modes: [
      { id: 'story', label: 'Title screen', note: 'Start or continue', set: {} },
      { id: 'ch-attack', label: 'The outlook', set: { beat: 'attack' } },
      { id: 'ch-skiff', label: 'The skiff', set: { beat: 'skiff' } },
      { id: 'ch-flight', label: 'The flight', set: { beat: 'isle' } },
      { id: 'ch-gate', label: 'Blossom Isle', set: { beat: 'land' } },
      { id: 'ch-relay', label: 'Blossom Isle, past the Gate', set: { beat: 'gate-open' } },
      { id: 'ch-loom', label: 'Loom Isle', set: { beat: 'loom' } },
    ],
  },
  {
    title: 'Experiments',
    modes: [
      { id: 'lab-ngram', label: 'Lab: the lighthouse', note: 'Off the story', set: { lab: 'ngram' } },
      { id: 'lab-utter', label: 'Lab: the platforms A', note: 'Off the story', set: { lab: 'utter' } },
      { id: 'lab-utter-b', label: 'Lab: the platforms B', note: 'Another version of A', set: { lab: 'utter-b' } },
      { id: 'mech-classic', label: 'The skiff, older version', set: { beat: 'skiff', mech: 'classic' } },
      { id: 'free-walk', label: 'Free walk', note: 'Bellweather, nothing to do', set: { story: '0' } },
    ],
  },
];
