// What Bellweather's townsfolk say to Zip as he passes, and in whose voice.
// Original lines. They sketch the world and hint at where to go; a course
// generator would write these with the rest of the story.
export const TOWN_LINES: Record<string, string[]> = {
  chatA: ['Morning, courier! The bell garden hums louder when you pass.', 'Mira asked after you. She\'s by the outlook.'],
  chatB: ['Mind the lilies. They close when a message goes astray.', 'Heard the old machine answered someone yesterday.'],
  view: ['You can see the Blossom Isle from here. Beautiful, isn\'t it?', 'The falls sing on still days. Listen.'],
  canopy: ['A courier! Deliveries are running early today.', 'Stay a while. The shade under the arch is the best in town.'],
  reader: ['Shh. I\'m reading about the first words ever sent.', 'Every message here starts small. One word, then the next.'],
  stroll1: ['Lovely day for a walk.', 'Lovely day for a walk, courier.'],
  stroll2: ['Oh! Hello there, little courier.', 'Busy day? Me too.'],
  stroll3: ['Up early, Zip?', 'The outlook\'s breezy today.'],
  mira: ['There you are, Zip! The garden bell has been waiting for you.', 'Come look: the Blossom Isle is clear today.'],
};
/** After the Warden's attack the town talks about nothing else (anyone may say any of these). */
export const TOWN_AFTER = [
  'That ship took Mira! Right off the outlook.', 'The bells rang on their own. Never seen that.',
  'It flew off past the Blossom Isle.', 'Stay safe, courier. Something is wrong today.',
  'A ship that listens. What was it listening for?', 'Did you see it? All ears, that thing.',
  'Go after her, Zip. We\'ll keep the lanterns lit.', 'My lilies closed the moment it came.',
];
/** each greeter's voice (a speaker in worlds/first-words-voice.ts) */
export const TOWN_VOICES: Record<string, string> = {
  chatA: 'folk0', chatB: 'Gardener', view: 'Neighbour', canopy: 'folk3', reader: 'folk2',
  stroll1: 'folk1', stroll2: 'folk3', stroll3: 'folk0', mira: 'Mira',
};
