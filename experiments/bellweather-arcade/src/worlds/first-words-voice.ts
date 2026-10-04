import type { VoiceCast } from '../kit/voice';

// The cast of "The First Words": who voices each speaker, how they play every
// line (`style`, the actor's direction), and the sound that makes them who they
// are in the game (kit/voice.ts effects). Voices are Gemini 3.8 Flash TTS
// prebuilt voices (townsfolk on Gemini 3.8 Flash-Lite TTS: cheaper, its own quota);
// tools/voice.mjs acts each line in public/voice/lines.json
// (written by tools/voice-lines.mjs). Changing a style or a line's direction
// makes new clips for the lines it touches; nothing else is redone.
// Zip's own voice is the story: it was torn out, so it comes back robotic and
// broken, and clears as each piece of the speech engine returns.
const LITE = 'gemini-3.8-flash-lite-tts';
export const FIRST_WORDS_CAST: VoiceCast = {
  Mira:      { voice: 'Leda', style: 'a young woman at a sky-town festival: warm, curious, quick, a little teasing' },
  // tempo 1.15: the actor reads him at ~1.5 words/s, which stretched the attack film to 25 s (4 Oct timing run)
  Warden:    { voice: 'Algenib', style: 'a villain who hunts thinking machines: cold, unhurried, quietly amused; never shouts', fx: 'warden', tempo: 1.15 },
  Zip:       { voice: 'Puck', style: 'a small, brave courier robot: eager, bright, clipped', fx: 'robot' },
  Gate:      { voice: 'Fenrir', style: 'a pompous talking stone gate who loves rules: theatrical, smug, posh British accent' },
  Tavi:      { voice: 'Achird', style: 'a kind young weaver, friendly and a bit flustered' },
  Neighbour: { voice: 'Sadaltager', model: LITE, style: 'a cheerful older townsman' },
  Gardener:  { voice: 'Gacrux', model: LITE, style: 'a warm, motherly gardener' },
  // townsfolk greeting Zip as he passes (worlds/bellweather-lines.ts gives each one a voice)
  folk0:     { voice: 'Umbriel', model: LITE, style: 'a relaxed townsperson chatting in passing', gain: .85 },
  folk1:     { voice: 'Callirrhoe', model: LITE, style: 'an easy-going townsperson chatting in passing, light Irish accent', gain: .85 },
  folk2:     { voice: 'Rasalgethi', model: LITE, style: 'a thoughtful townsperson, light Indian English accent', gain: .85 },
  folk3:     { voice: 'Vindemiatrix', model: LITE, style: 'a gentle townsperson, light Australian accent', gain: .85 },
};

/** lines whose bubble text isn't what is said aloud */
export const FIRST_WORDS_SPOKEN: Record<string, string> = {
  'MIR— kkzzht… krrsh…': 'Mira! Mira!',
};

/** a line's own direction, on top of its speaker's style (keyed by the line as shown) */
export const FIRST_WORDS_DIRECTION: Record<string, string> = {
  'Zip! Up here! The skiff\'s ready!': 'calling across a courtyard, waving',
  'Zip!': 'screaming his name as she is pulled into the sky',
  'What is THAT?': 'shocked, shouting up at the sky',
  'Everyone inside!': 'urgent shout to the crowd',
  'MIR— kkzzht… krrsh…': 'a desperate shout after her',
  'Bellweather\'s courier. You beep. You blink. You think.': 'slow, savouring each word',
  'Thinking, I allow. Talking, I don\'t.': 'calm, final, as he strikes',
  'Want her back? Come and get her, thinker.': 'mocking, leaving',
  '…Still thinking in there, little courier? Good.': 'whispered inside someone\'s head',
  'Your loop is cracked, little courier. Think around it.': 'whispered inside someone\'s head',
  'I played that one too. Nobody finishes the rings.': 'whispered, dry, almost friendly',
  'Six slots, little courier. Spend them wisely.': 'whispered inside someone\'s head',
  'Who\'s there? The Warden jammed my loom. I\'m stuck behind the cloth!': 'muffled, calling from behind heavy cloth',
  '“Skiff, rise toward Blossom Isle.”': 'a command, careful and proud: his first words back',
};

/** how clear Zip's voice is (0 broken … 1 clean): right after the attack it is static only; each engine piece clears it */
export const ZIP_CLARITY = { skiff: .3, loom: .5 } as const;
