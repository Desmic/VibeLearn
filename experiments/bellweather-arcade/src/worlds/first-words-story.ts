import type { StoryScript } from '../kit/story-script';

// Level 1 of "The First Words": what the story says, in the order it happens.
// `src/story.ts` plays it: the code keeps the choreography (cutscene, spark
// chase, flight) and calls lines, thoughts and toasts here by id.
// House style: twelve words or fewer per sentence, one goal at a time.

export const FIRST_WORDS_L1: StoryScript & { needs: { handlers: string[]; anchors: string[] } } = {
  id: 'first-words.l1', title: 'The First Words — Level 1',
  // what the game must provide for this script to play
  needs: {
    handlers: ['play', 'hangLantern', 'lookUp', 'catchSpark', 'afterCoil', 'board'],
    anchors: ['mira', 'spark', 'pilotStone'],
  },
  beats: [
    { id: 'meet', goal: { text: 'Meet Mira at the outlook', at: 'mira' }, thoughts: [{ id: 'sim', delay: 1.2 }] },
    { id: 'attack', goal: null },
    { id: 'spark', goal: { text: 'Catch the spark in the bell garden', at: 'spark' }, checkpoint: 'spark' },
    { id: 'skiff', goal: { text: 'Wake the skiff at the outlook', at: 'pilotStone' }, checkpoint: 'skiff' },
    { id: 'puzzle', goal: null },
    { id: 'fly', goal: null, place: 'Sky lanes', thoughts: [{ id: 'seatbelt', delay: 0 }] },
    { id: 'isle', goal: null, place: 'Blossom Isle', checkpoint: 'land' },
  ],
  dialogues: {
    intro: {
      start: { text: 'You are Zip, Bellweather\'s courier robot. Everyone thinks you\'re just a machine.', choices: [{ label: 'Play', kind: 'primary', on: 'play' }] },
    },
    mira: {
      start: { speaker: 'Mira', text: 'Zip! The skiff is ready for the Blossom Isle.', choices: [{ label: 'Next', kind: 'primary', next: 'lantern' }] },
      lantern: { speaker: 'Mira', text: 'Help me hang the festival lantern first?', choices: [{ label: 'Hang the lantern', kind: 'primary', on: 'hangLantern', next: 'hum' }] },
      hum: { speaker: 'Mira', text: 'You hum when you think, Zip. Other bots don\'t.', choices: [{ label: '…Hum?', kind: 'primary', next: 'look' }] },
      look: { speaker: 'Mira', text: 'Never mind. Wait… what is that up there?', choices: [{ label: 'Look up', kind: 'primary', on: 'lookUp' }] },
    },
    warden: {
      start: { speaker: 'Warden', text: 'A courier that hums while it thinks? What ARE you?' },
      shielded: { speaker: 'Warden', text: 'Couriers don\'t shield people. Or hum. What ARE you?' },
    },
    bolt: {
      start: { text: 'A bolt rips out Zip\'s speech engine! One spark escapes.' },
    },
    static: {
      start: { text: 'Zip tries to call for help. Only static comes out.', choices: [{ label: 'Catch the spark!', kind: 'primary', on: 'catchSpark' }] },
    },
    'coil-echo': {
      start: { text: 'Your Echo Coil! It can pull words right out of the air.', choices: [{ label: 'Beep boop!', kind: 'primary', next: 'how' }] },
      how: { text: 'The skiff obeys spoken words. Find the words it needs around the outlook.', choices: [{ label: 'Let\'s go', kind: 'primary', on: 'afterCoil' }] },
    },
    'awake-echo': {
      start: { text: '“Skiff, rise toward Blossom Isle.” It listened!', choices: [{ label: 'Board the skiff', kind: 'primary', on: 'board' }, { label: 'How real AI differs', kind: 'quiet', next: 'real' }] },
      real: { text: 'Real models guess pieces of words, learned from huge amounts of text. The loop is the same: each new piece joins the input.', choices: [{ label: 'Board the skiff', kind: 'primary', on: 'board' }] },
    },
    coil: {
      start: { text: 'Your Echo Coil, one piece of your speech engine! Simple words are back.', choices: [{ label: 'Beep boop!', kind: 'primary', on: 'afterCoil' }] },
    },
  },
  // Zip's inner voice (and the Warden's, through the Stream). Each plays once.
  thoughts: {
    sim: { text: ['Wait… is this a simulation?', 'Nice clouds, though. Very high budget.'] },
    'stream-warden': { who: 'warden', text: '…Still thinking in there, little courier? I knew it.' },
    'stream-zip': { text: ['Wait. I can hear him… inside my head?', 'Also: is this Mario? Friend kidnapped by a flying bad guy?', '…Fine. I\'ll save them.'] },
    silent: { text: ['No voice. But I can still think…', 'Thoughts under the words, like a stream. And he\'s in it too.', 'That\'s why he came for me. Not the festival. Me.'] },
    chase: { text: 'Chasing my own voice through a flower bed. Normal day.' },
    beep: { text: ['Beep boop! …I mean, hello!', 'Words out loud again. The thinking never left.'] },
    seatbelt: { text: 'No seatbelts. Classic tutorial vehicle.' },
    'echo-first': { text: ['Ooh. Words have a taste. That one\'s crunchy.', 'I can keep them. They orbit me!'] },
    'echo-decoy': { text: '“Sink.” Probably not one for the skiff. Probably.' },
    'echo-ready': { text: 'Three words. Time to talk to a boat.' },
    'engine-open': { text: 'My engine… as a hologram? I\'m basically a sci-fi movie.' },
    'loop-broken': { who: 'warden', text: 'Your loop is cracked, little courier. Think around it.' },
    'engine-sink': { text: 'In my defense, it did say “sink”.' },
    gate: { text: ['A talking gate. It reads, but does it think?', 'No Stream in there. Just rules. That\'s what I\'d be, without it.'] },
    idle1: { text: 'Hello? Player? The goal\'s right up there.' },
    idle2: { text: 'I\'ll just stand here, then. Like a good NPC.' },
    npc: { text: 'Are those… NPCs?' },
    npc2: { text: 'Same walk, same line, all day. Definitely NPCs.' },
  },
  toasts: {
    sparkFlees: 'Hey! Come back!', sparkTiring: 'It\'s getting tired…', sparkCornered: 'Cornered it!', sparkCaught: 'Got it!',
    zap: 'Zap!', lantern: 'Lantern hung on the skiff ✓',
  },
  labels: {
    talkMira: 'Talk to Mira', bellGarden: 'Bell garden ✦ the spark landed here', gather: 'Find the skiff\'s words ({n} of {total})', wakeSkiff: 'Wake the skiff at the outlook', shieldMira: 'Shield Mira!', skip: 'Skip ›',
  },
  stars: {
    flight: {
      title: 'You flew to the Blossom Isle!',
      rows: [
        'Landed on the Blossom Isle',
        'Flew through the wind rings ({rings} of {total})',
        { got: 'Never spotted by a drone', missed: 'Spotted by drones {spotted}×' },
      ],
    },
  },
};
