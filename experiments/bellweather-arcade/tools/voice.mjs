// Acts the voiced lines with Gemini 3.8 Flash TTS: one clip per line in
// public/voice/lines.json, directed by the cast's style notes
// (src/worlds/first-words-voice.ts). Only new or changed lines are made, so
// re-running is cheap and safe to repeat if a daily quota stops it part-way.
//
//   node tools/voice.mjs            act what is missing, then encode
//   node tools/voice.mjs --dry      list what would be made; calls nothing
//   node tools/voice.mjs --force    act every line again
//   node tools/voice.mjs --only Mira   act one speaker's lines again
//   node tools/voice.mjs --encode   (no network) master WAVs → game MP3s + manifest
//
// Masters (WAV, as Gemini returns them) go to authoring/voice/ (not committed);
// the game gets small MP3s in public/voice/ plus manifest.json. Encoding needs
// ffmpeg; without it the masters are kept and `--encode` can run anywhere later.
// The API key is read from .env here or in a folder above (google_api_key = …),
// sent only to generativelanguage.googleapis.com in a header, never printed.
// Needs Node 18+ and network access to Google.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const DIR = 'public/voice', MASTERS = 'authoring/voice';
const MODEL = process.env.VOICE_MODEL || 'gemini-3.8-flash-tts';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const flag = f => process.argv.includes(f);

function findKey() {
  for (const k of ['GOOGLE_API_KEY', 'GEMINI_API_KEY']) if (process.env[k]) return process.env[k].trim();
  let d = process.cwd();
  for (let i = 0; i < 6; i++) {
    const f = path.join(d, '.env');
    if (existsSync(f)) for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?(?:google_api_key|gemini_api_key)\s*=\s*(.*?)\s*$/i);
      if (m) return m[1].replace(/^['"]|['"]$/g, '');
    }
    const up = path.dirname(d); if (up === d) break; d = up;
  }
  return null;
}
const KEY = findKey();
const hide = s => KEY ? String(s).split(KEY).join('<key>') : String(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function post(body) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body) });
    if (r.ok) return r.json();
    const text = await r.text();
    // per-minute limits clear quickly; a daily quota doesn't (stop, and run again tomorrow)
    if ((r.status === 429 && !/per ?day|PerDay/i.test(text) || r.status >= 500) && attempt < 6) { await sleep(Math.min(60000, 4000 * 2 ** attempt)); continue; }
    const err = new Error(hide(`HTTP ${r.status}: ${text.slice(0, 500)}`)); err.status = r.status; err.daily = /per ?day|PerDay/i.test(text); throw err;
  }
}

// The request: the transcript is the line; the direction rides as the turn's style.
// The documented 3.8 shape first; the older shape (style as a spoken-prompt prefix) if a field is refused.
async function act(l) {
  const body = (modern) => modern
    ? { contents: [{ role: 'user', parts: [{ text: l.text, ...(l.style ? { speech_metadata: { style: l.style } } : {}) }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { voice: l.voice } } } }
    : { contents: [{ role: 'user', parts: [{ text: l.style ? `Read the line exactly as written. Delivery: ${l.style}.\nLine: ${l.text}` : l.text }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: l.voice } } } } };
  let r;
  try { r = await post(body(true)); } catch (e) { if (e.status !== 400) throw e; r = await post(body(false)); }
  const part = r.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
  if (!part) throw new Error('no audio in the reply: ' + hide(JSON.stringify(r).slice(0, 300)));
  const raw = Buffer.from(part.inlineData.data, 'base64'), mime = part.inlineData.mimeType ?? '';
  if (raw.slice(0, 4).toString('latin1') === 'RIFF') return raw;
  const rate = +(mime.match(/rate=(\d+)/)?.[1] ?? 24000);   // headerless 16-bit PCM: give it a WAV header
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + raw.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(raw.length, 40);
  return Buffer.concat([h, raw]);
}

// MP3 length from its frame headers
function mp3Seconds(buf) {
  let i = 0, samples = 0, rate = 24000;
  if (buf.slice(0, 3).toString('latin1') === 'ID3') i = 10 + ((buf[6] & 127) << 21 | (buf[7] & 127) << 14 | (buf[8] & 127) << 7 | (buf[9] & 127));
  const BR = { 1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
  const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  while (i + 4 < buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const ver = (buf[i + 1] >> 3) & 3, layer = (buf[i + 1] >> 1) & 3, bri = buf[i + 2] >> 4, sri = (buf[i + 2] >> 2) & 3, pad = (buf[i + 2] >> 1) & 1;
    if (ver === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) { i++; continue; }
    const kbps = BR[ver === 3 ? 1 : 2][bri]; rate = SR[ver][sri];
    const spf = ver === 3 ? 1152 : 576, len = Math.floor((spf / 8) * kbps * 1000 / rate) + pad;
    if (len < 4) { i++; continue; }
    samples += spf; i += len;
  }
  return +(samples / rate).toFixed(2);
}

const hasFfmpeg = () => spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
// Game copy: trim silence at both ends, even out loudness, mono MP3 at 40 kbps (small for phones)
function encode(key) {
  const src = path.join(MASTERS, `${key}.wav`), out = path.join(DIR, `${key}.mp3`);
  const af = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.08,areverse,loudnorm=I=-18:TP=-2:LRA=11';
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-af', af, '-ac', '1', '-ar', '24000', '-b:a', '40k', out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('ffmpeg: ' + (r.stderr || '').slice(0, 300));
  return { file: `${key}.mp3`, dur: mp3Seconds(readFileSync(out)) };
}

const { lines } = JSON.parse(readFileSync(path.join(DIR, 'lines.json'), 'utf8'));
const manPath = path.join(DIR, 'manifest.json');
const old = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')).clips ?? {} : {};
mkdirSync(MASTERS, { recursive: true }); mkdirSync(DIR, { recursive: true });
const only = arg('--only');
const hasMaster = l => existsSync(path.join(MASTERS, `${l.key}.wav`));
const todo = flag('--encode') ? [] : lines.filter(l => flag('--force') || (only ? l.speaker === only : !hasMaster(l) && !(old[l.key] && existsSync(path.join(DIR, old[l.key].file)))));
console.log(`${lines.length} lines; ${todo.length} to act with ${MODEL} (${todo.reduce((n, l) => n + l.text.length, 0)} characters).`);
if (flag('--dry')) { for (const l of todo) console.log(`  ${l.key}  ${l.speaker.padEnd(9)} ${l.text}   [${l.style}]`); process.exit(0); }
if (todo.length && !KEY) { console.error('No API key: put google_api_key = ... in a .env file here or in a folder above.'); process.exit(1); }

let made = 0, failed = 0, stop = false;
for (const l of todo) {
  if (stop) break;
  try {
    const wav = await act(l); writeFileSync(path.join(MASTERS, `${l.key}.wav`), wav); made++;
    console.log(`  ✓ ${l.speaker.padEnd(9)} ${((wav.length - 44) / 48000).toFixed(1)}s  ${l.text}`);
  } catch (e) {
    failed++; console.error(`  ✗ ${l.speaker} "${l.text}": ${e.message}`);
    if (e.daily) { console.error('Daily quota reached: run this again later; finished lines are kept.'); stop = true; }
    if (e.status === 401 || e.status === 403) { console.error('Is the Gemini API enabled for this key?'); stop = true; }
  }
  await sleep(700);   // gentle on free-tier per-minute limits
}

// encode every master the game doesn't have yet (or all, after --force) and write the manifest
const clips = {};
const ff = hasFfmpeg();
for (const l of lines) {
  const fresh = todo.includes(l) || !old[l.key] || !existsSync(path.join(DIR, old[l.key]?.file ?? '-'));
  if (!fresh && old[l.key]) { clips[l.key] = old[l.key]; continue; }
  if (!hasMaster(l)) continue;
  if (!ff) continue;
  try { clips[l.key] = { ...encode(l.key), speaker: l.speaker }; } catch (e) { console.error(`  ✗ encode ${l.key}: ${e.message}`); }
}
writeFileSync(manPath, JSON.stringify({ _about: 'Voiced lines (tools/voice.mjs). key → clip file and seconds.', model: MODEL, made: new Date().toISOString(), clips }, null, 1) + '\n');
const waiting = lines.filter(l => hasMaster(l) && !clips[l.key]).length;
const bytes = Object.values(clips).reduce((n, c) => n + (existsSync(path.join(DIR, c.file)) ? statSync(path.join(DIR, c.file)).size : 0), 0);
const orphans = readdirSync(DIR).filter(f => f.endsWith('.mp3') && !Object.values(clips).some(c => c.file === f));
console.log(`\nActed ${made}, failed ${failed}. In the game: ${Object.keys(clips).length} of ${lines.length} lines, ${(bytes / 1024).toFixed(0)} KB.`);
if (waiting) console.log(`${waiting} masters are waiting to be encoded${ff ? '' : ' (ffmpeg not found here: run `node tools/voice.mjs --encode` where it is, or ask Claude to)'}.`);
if (orphans.length) console.log(`${orphans.length} clips no line uses any more (safe to delete): ${orphans.slice(0, 6).join(', ')}${orphans.length > 6 ? ' …' : ''}`);
if (failed) process.exitCode = 1;
