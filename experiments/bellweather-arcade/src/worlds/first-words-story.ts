import type { StoryScript } from '../kit/story-script';

// Level 1 of "The First Words": what the story says, in the order it happens.
// `src/story.ts` plays it: the code keeps the choreography (cutscene, spark
// chase, flight) and calls lines, thoughts and toasts here by id.
// House style: twelve words or fewer per sentence, one goal at a time,
// and never explain what the player has just seen happen.

export const FIRST_WORDS_L1: StoryScript & { needs: { handlers: string[]; anchors: string[] } } = {
  id: 'first-words.l1', title: 'The First Words — Level 1',
  protagonist: 'Zip', thoughtVoices: { warden: 'Warden' },
  // what the game must provide for this script to play
  needs: {
    handlers: ['toLantern', 'lookUp', 'board', 'afterCoil'],
    anchors: ['mira', 'spark', 'pilotStone'],
  },
  beats: [
    { id: 'meet', goal: { text: 'Meet Mira at the outlook', at: 'mira' }, thoughts: [{ id: 'sim', delay: 7 }] },
    { id: 'attack', goal: null },
    { id: 'spark', goal: { text: 'Get your voice back', at: 'spark' }, checkpoint: 'spark' },
    { id: 'skiff', goal: { text: 'Wake the skiff at the outlook', at: 'pilotStone' }, checkpoint: 'skiff' },
    { id: 'puzzle', goal: null },
    { id: 'fly', goal: null, place: 'Sky lanes', thoughts: [{ id: 'seatbelt', delay: 0 }] },
    { id: 'isle', goal: null, place: 'Blossom Isle', checkpoint: 'land' },
  ],
  // 3 Oct rewrite (F15 play-test): show, don't tell; the player is smart. Speakers talk in
  // bubbles over their heads; cutscene lines are barks (no buttons). Mira can't know Zip
  // thinks: she notices the odd things (the beeps, the blinking). The Warden knows.
  dialogues: {
    // the cold open: Mira calls from the outlook (a bark; the camera shows where she is)
    call: { start: { speaker: 'Mira', text: 'Zip! Up here! The skiff\'s ready!' } },
    mira: {
      // she asks; Zip does it in the world (the first time the player acts on a thing: tap it, or E)
      start: { speaker: 'Mira', text: 'There you are! Hang the lantern on the skiff for me?', choices: [{ label: 'Next', on: 'toLantern' }] },
      beep: { speaker: 'Mira', text: 'Zip, why do you beep before you answer? Other bots don\'t.', choices: [{ label: 'Beep?', kind: 'primary', next: 'blink' }, { label: 'Beep boop.', next: 'blink' }] },
      blink: { speaker: 'Mira', text: 'And you blink. The bell-ringer bot has never once blinked.', choices: [{ label: 'Next', next: 'look' }] },
      look: { speaker: 'Mira', text: 'You\'re a strange little courier. Wait… what\'s that noise?', choices: [{ label: 'Next', on: 'lookUp' }] },
    },
    // the attack, as barks from the ship (anchor 'Warden')
    warden: {
      start: { speaker: 'Warden', text: 'Bellweather\'s courier. You beep. You blink. You think.' },
      shielded: { speaker: 'Warden', text: 'Brave, too. Machines aren\'t brave.' },
      take: { speaker: 'Warden', text: 'Thinking, I allow. Talking, I don\'t.' },
      leave: { speaker: 'Warden', text: 'Want her back? Come and get her, thinker.' },
    },
    mira_cry: { start: { speaker: 'Mira', text: 'Zip!' } },
    // the town, as the ship comes down
    alarm: { start: { speaker: 'Neighbour', text: 'What is THAT?' }, inside: { speaker: 'Gardener', text: 'Everyone inside!' } },
    // Zip tries to shout after her: only static comes out
    static: { start: { speaker: 'Zip', text: 'MIR— kkzzht… krrsh…' } },
    'awake-echo': {
      start: { speaker: 'Zip', text: '“Skiff, rise toward Blossom Isle.”', choices: [{ label: 'Board the skiff', kind: 'primary', on: 'board' }, { label: 'How real AI differs', kind: 'quiet', next: 'real' }] },
      real: { speaker: 'Zip', text: 'Real models are nets like mine, with billions of links. They guess pieces of words, learned from huge amounts of text. The loop is the same: each new piece joins the input.', choices: [{ label: 'Board the skiff', kind: 'primary', on: 'board' }] },
    },
    coil: {
      start: { text: 'Your Echo Coil, one piece of your speech engine! Simple words are back.', choices: [{ label: 'Beep boop!', kind: 'primary', on: 'afterCoil' }] },
    },
  },
  // Zip's inner voice (and the Warden's, through the Stream). Each plays once.
  thoughts: {
    sim: { text: ['Wait… is this a simulation?', 'Nice clouds, though. Very high budget.'] },
    mario: { text: ['What? Is this Mario?', 'Guess I\'ll have to save her now.'] },
    'stream-warden': { who: 'warden', text: '…Still thinking in there, little courier? Good.' },
    'stream-zip': { text: 'Wait. I can hear him… in my head?' },
    'voice-gone': { text: 'My voice. It landed in the bell garden.' },
    chase: { text: 'Chasing my own voice through a flower bed. Normal day.' },
    beep: { text: ['Beep boop! …I mean, hello!', 'Words out loud again.'] },   // ?mech=classic
    'coil-new': { text: ['Not my whole voice. Just one coil of it.', 'And it\'s… hungry? For words?'] },
    // run 14 walked up to every word (28 steps): say that a word can be tapped from where you stand
    'words-seen': { text: ['Words. Hanging in the air. That\'s new.', 'Could I just… tap one and pull it in?'] },
    seatbelt: { text: 'No seatbelts. Classic tutorial vehicle.' },
    'echo-first': { text: ['Ooh. Words have a taste. That one\'s crunchy.', 'The skiff runs on spoken words. Let\'s collect some.'] },
    'echo-decoy': { text: '“Sink.” Probably not one for the skiff. Probably.' },
    'echo-ready': { text: 'Three words. Time to talk to a boat.' },
    // the net (25 Oct): the voice "coil by coil" went unseen in five runs; now the dark web shows it
    // run 27 took the engine and his voice for "two related things, not the same thing": say it's his voice
    'engine-open': { text: ['My voice… from the inside? I\'m basically a sci-fi movie.', 'One coil lit. The rest of me is still dark.'] },
    // run 29 read the old wording ("Just “Blossom” on its own?") as about their own cast, which was the whole line
    'engine-petals': { text: ['“Isle.” Funny: “Blossom” on its own makes me think “petals”.', 'It took the whole line to get “Isle”.'] },
    'engine-wake': { text: 'More of me just lit up. I felt that.' },
    'stray-first': { text: ['A stray spark of my voice. Straight into my net.', 'There must be more. Off the paths, out at the edges.'] },
    'strays-blossom': { text: 'Stray sparks of me out here too. I can feel them.' },
    'strays-loom': { text: 'More stray sparks on this isle. Somewhere off the path.' },
    // run 28 read his voice and the engine as "two separate things": say it at the payoff
    // the first time out over the sky, the tower on the horizon is in view: the ship went that way
    'spire-first': { text: ['That tower on the horizon. It\'s a net. Like mine, but… enormous.', 'The ship flew that way. Hold on, Mira.'] },
    'voice-is-engine': { text: ['My first words out loud since the attack.', 'That net was my voice. Every light in it is a bit more of me.'] },
    'stray-all': { text: ['That\'s every stray spark.', 'Hear that, Warden? I\'m louder now.'] },
    'voice-back': { text: ['My voice… it\'s clearer.', 'Another coil lit. Mira, I\'m coming.'] },
    'loop-broken': { who: 'warden', text: 'Your loop is cracked, little courier. Think around it.' },
    'engine-sink': { text: 'In my defense, it did say “sink”.' },
    // the wind rings: Zip has played a certain old superhero game, and so has the Warden
    'ring-1': { text: ['Flying through rings…', 'This reminds me of that Sups game.'] },
    'ring-veteran': { who: 'warden', text: 'I played that one too. Nobody finishes the rings.' },
    'ring-miss': { text: 'Missed one. Very authentic Sups experience.' },
    'ring-all': { text: 'Every ring! Take that, Sups.' },
    // caught in a drone's light on the flight
    'rude': { text: 'Rude.' },
    'warden-flight': { who: 'warden', text: 'I can hear you thinking up there, courier.' },
    'ring-reply': { text: 'Did the villain just bond with me over a bad game?' },
    // run 14: "Just rules. That's what I'd be, without it" made the Gate the dumb one and the engine the clever
    // one, the opposite of the lesson (both only know what they're handed)
    gate: { text: 'A talking gate. It only knows what you hand it.' },
    // run 19: on arrival this landed on top of the Warden's sign and was missed; it means most after a miss
    'gate-engine': { text: 'Same as my engine, really. Better notes, better answers.' },
    idle1: { text: 'Hello? Player? The goal\'s right up there.' },
    idle2: { text: 'I\'ll just stand here, then. Like a good NPC.' },
    npc: { text: 'Are those… NPCs?' },
    npc2: { text: 'Same walk, same line, all day. Definitely NPCs.' },
  },
  toasts: {
    sparkFlees: 'Hey! Come back!', sparkTiring: 'It\'s getting tired…', sparkCornered: 'Cornered it!', sparkCaught: 'Got it!',
    zap: 'Zap!', lantern: 'Lantern hung ✓',
  },
  labels: {
    talkMira: 'Talk to Mira', hangLantern: 'Hang the lantern', lanternGoal: 'Hang the lantern on the skiff', bellGarden: 'Bell garden', gather: 'Find the skiff\'s words ({n} of {total})', wakeSkiff: 'Wake the skiff at the outlook', shieldMira: 'Shield Mira!', skip: 'Skip ›',
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
