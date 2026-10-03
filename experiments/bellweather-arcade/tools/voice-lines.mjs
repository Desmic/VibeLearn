// Lists every line that should be spoken aloud, with its speaker's voice, into
// public/voice/lines.json. tools/voice.mjs then makes one clip per line.
//   ./build.sh && node tools/voice-lines.mjs
// Sources: the story scripts (lines with a speaker; the Warden's thoughts, heard
// through the Stream), the townsfolk's lines, and lines still written in code
// (the Gate's, Mira's call over the relay), found by pattern. Narration and
// Zip's inner thoughts stay silent text. Reads the compiled game in out/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const OUT = path.resolve('out/src'), SRC = path.resolve('src');
const load = p => import(pathToFileURL(path.join(OUT, p)).href);
const { FIRST_WORDS_L1 } = await load('worlds/first-words-story.js');
const { STOP2_STORY } = await load('worlds/stop2-loom.js');
const { FIRST_WORDS_CAST: CAST, FIRST_WORDS_SPOKEN: SPOKEN, FIRST_WORDS_DIRECTION: DIRECTION } = await load('worlds/first-words-voice.js');
const { TOWN_LINES, TOWN_AFTER, TOWN_VOICES } = await load('worlds/bellweather-lines.js');
const { clipKey, directionFor, cleanText } = await load('kit/voice.js');

const lines = new Map(), missingCast = new Set();
const add = (speaker, text, from) => {
  const c = CAST[speaker]; if (!c) { missingCast.add(speaker); return; }
  const shown = cleanText(text), spoken = cleanText(SPOKEN[shown] ?? shown), note = DIRECTION[shown] ?? '';
  const key = clipKey(c, spoken, note);
  if (!lines.has(key)) lines.set(key, { key, speaker, voice: c.voice, style: directionFor(c, note), text: spoken, shown, from });
};
for (const s of [FIRST_WORDS_L1, STOP2_STORY]) {
  for (const [id, d] of Object.entries(s.dialogues)) for (const [lid, l] of Object.entries(d)) if (l.speaker) add(l.speaker, l.text, `${s.id}:${id}.${lid}`);
  for (const [id, t] of Object.entries(s.thoughts)) if (t.who === 'warden') for (const x of [t.text].flat()) add('Warden', x, `${s.id}:thought.${id}`);
}
for (const [k, ls] of Object.entries(TOWN_LINES)) for (const l of ls) add(TOWN_VOICES[k] ?? 'folk0', l, `town:${k}`);
// after the attack, any townsperson may say any of these: one clip per townsfolk voice
const townVoices = [...new Set(Object.entries(TOWN_VOICES).filter(([k]) => k !== 'mira').map(([, v]) => v))];
for (const l of TOWN_AFTER) for (const v of townVoices) add(v, l, 'town:after');
// lines still in code: literal strings only (lines built from variables stay unvoiced)
const lit = String.raw`'((?:[^'\\]|\\.)*)'`, unq = s => s.replace(/\\'/g, "'");
for (const m of readFileSync(path.join(SRC, 'island.ts'), 'utf8').matchAll(new RegExp(String.raw`gateSays\(` + lit, 'g'))) add('Gate', unq(m[1]), 'island.ts');
for (const m of readFileSync(path.join(SRC, 'relay.ts'), 'utf8').matchAll(new RegExp(String.raw`g\.say\(` + lit + String.raw`[\s\S]{0,300}?speaker: '(\w+)'`, 'g'))) add(m[2], unq(m[1]), 'relay.ts');

const list = [...lines.values()].sort((a, b) => a.speaker.localeCompare(b.speaker) || a.text.localeCompare(b.text));
mkdirSync('public/voice', { recursive: true });
writeFileSync('public/voice/lines.json', JSON.stringify({
  _about: 'Lines to speak (written by tools/voice-lines.mjs; clips made by tools/voice.mjs). key = clipKey(cast member, text, direction) in src/kit/voice.ts.',
  lines: list,
}, null, 1) + '\n');
const chars = list.reduce((n, l) => n + l.text.length, 0), by = {};
for (const l of list) by[l.speaker] = (by[l.speaker] ?? 0) + 1;
console.log(`${list.length} lines, ${chars} characters → public/voice/lines.json`);
console.log(Object.entries(by).map(([k, n]) => `${k} ${n}`).join(' · '));
if (missingCast.size) console.log('Speakers with no voice in the cast (left silent):', [...missingCast].join(', '));
