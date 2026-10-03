import { audio } from '../sfx';

// Voiced lines. Every spoken line is a small audio clip made ahead of time from
// the story's own text (tools/voice-lines.mjs lists the lines, tools/voice.mjs
// has Gemini TTS act each one, directed by the cast's notes; nothing calls a
// service while playing). A clip is found by its speaker's voice and its text, so editing a
// line simply leaves it unvoiced until the clips are made again; the bubble
// still shows it. Game-agnostic: a game supplies its cast; the effects give
// characters their sound (a robot whose voice is coming back, a villain, a
// radio, a voice inside your head).

export type VoiceFx = 'none' | 'robot' | 'warden' | 'stream' | 'radio';
/** `voice`: a TTS voice name; `style`: the actor's direction for every line ("cold, amused menace") */
export interface CastMember { voice: string; style?: string; fx?: VoiceFx; gain?: number }
export type VoiceCast = Record<string, CastMember>;
export interface PlayOpts {
  /** -1 left … 1 right (where the speaker is on screen) */
  pan?: number; gain?: number;
  /** robot only: 0 = barely a voice (static, dropouts) … 1 = clean */
  clarity?: number;
  fx?: VoiceFx;
  /** 'line': a new line stops the last one (dialogue); 'bark': overlaps freely */
  channel?: 'line' | 'bark';
}

/** the key a clip is stored under: voice name and spoken text (FNV-1a, 32 bit) */
export function voiceKey(voice: string, text: string) {
  let h = 0x811c9dc5; const s = voice + '|' + cleanText(text);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
/** the key of one line's clip: who acts it, how, and what is said (a new direction makes a new clip) */
export function clipKey(c: CastMember, spoken: string, direction = '') { return voiceKey(`${c.voice}|${c.style ?? ''}|${direction}`, spoken); }
/** the full direction for a line: the character's style plus the line's own note */
export function directionFor(c: CastMember, direction = '') { return [c.style, direction].filter(Boolean).join('; '); }
/** what is actually spoken: no markup, single spaces */
export function cleanText(t: string) { return t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

export function createVoice(cast: VoiceCast, opts: { base: string; spoken?: Record<string, string>; direction?: Record<string, string> }) {
  let clips: Record<string, { file: string; dur: number }> = {};
  const ready = fetch(opts.base + 'manifest.json').then(r => r.ok ? r.json() : { clips: {} }).then(m => { clips = m.clips ?? {}; }).catch(() => { /* no voices yet: bubbles only */ });
  const bytes = new Map<string, Promise<ArrayBuffer | null>>(), decoded = new Map<string, AudioBuffer>();
  const fetchClip = (key: string) => {
    if (!bytes.has(key)) bytes.set(key, fetch(opts.base + clips[key].file).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null));
    return bytes.get(key)!;
  };
  const decode = async (key: string) => {
    const hit = decoded.get(key); if (hit) return hit;
    const a = audio(), b = await fetchClip(key); if (!a || !b) return null;
    const buf = await a.ctx.decodeAudioData(b.slice(0)).catch(() => null); if (!buf) return null;
    decoded.set(key, buf); if (decoded.size > 24) decoded.delete(decoded.keys().next().value!);   // a small cache: phones have little memory
    return buf;
  };
  const keyOf = (speaker: string, text: string) => {
    const c = cast[speaker]; if (!c) return null;
    const shown = cleanText(text), k = clipKey(c, cleanText(opts.spoken?.[shown] ?? shown), opts.direction?.[shown]); return clips[k] ? k : null;
  };
  let line: { stop: () => void } | null = null, crushCurves = new Map<number, Float32Array<ArrayBuffer>>();

  const crush = (levels: number) => {
    const q = Math.round(levels); let c = crushCurves.get(q);
    if (!c) { c = new Float32Array(new ArrayBuffer(4096)); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; c[i] = Math.round(x * q) / q; } crushCurves.set(q, c); }
    return c;
  };

  async function play(speaker: string, text: string, o: PlayOpts = {}) {
    const key = keyOf(speaker, text); if (!key) return null;
    if ((o.channel ?? 'line') === 'line') { line?.stop(); line = null; }
    const a = audio(); if (!a) return null;
    const buf = await decode(key); if (!buf) return null;
    const { ctx, master } = a, c = cast[speaker], fx = o.fx ?? c.fx ?? 'none', t0 = ctx.currentTime + .02;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const out = ctx.createGain(); out.gain.value = (c.gain ?? 1) * (o.gain ?? 1) * 1.6;
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.max(-.7, Math.min(.7, o.pan ?? 0));
    out.connect(pan); pan.connect(master);
    const extra: AudioScheduledSourceNode[] = [];
    let head: AudioNode = out;   // the chain is built backwards: each stage feeds `head`
    const stage = (n: AudioNode) => { n.connect(head); head = n; return n; };
    if (fx === 'robot') {
      const clarity = Math.max(0, Math.min(1, o.clarity ?? 1));
      src.playbackRate.value = 1.04;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 220; stage(hp);
      const peak = ctx.createBiquadFilter(); peak.type = 'peaking'; peak.frequency.value = 1900; peak.gain.value = 5; stage(peak);
      // ring modulation: the metal in the voice, heavier while the engine is broken
      const ring = ctx.createGain(), depth = .3 + .45 * (1 - clarity); ring.gain.value = 1 - depth; stage(ring);
      const osc = ctx.createOscillator(); osc.frequency.value = 58 + 30 * clarity; const og = ctx.createGain(); og.gain.value = depth; osc.connect(og); og.connect(ring.gain); extra.push(osc);
      const ws = ctx.createWaveShaper(); ws.curve = crush(5 + 40 * clarity); stage(ws);
      // a broken engine drops syllables and hisses
      if (clarity < .65) {
        const gate = ctx.createGain(); stage(gate); const dur = buf.duration / 1.04;
        for (let t = .15; t < dur; t += .12 + Math.random() * .25) if (Math.random() < (1 - clarity) * .45) { gate.gain.setValueAtTime(1, t0 + t); gate.gain.linearRampToValueAtTime(.05, t0 + t + .015); gate.gain.setValueAtTime(.05, t0 + t + .05 + Math.random() * .07); gate.gain.linearRampToValueAtTime(1, t0 + t + .13); }
        const n = ctx.createBufferSource(), nb = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * (dur + .2)), ctx.sampleRate), d = nb.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < .02 ? 1 : .3);
        n.buffer = nb; const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2600; const ng = ctx.createGain(); ng.gain.value = .12 * (1 - clarity);
        n.connect(nf); nf.connect(ng); ng.connect(out); extra.push(n);
      }
    } else if (fx === 'warden' || fx === 'stream') {
      // deeper and slower, with a cold echo; inside Zip's head (the Stream) it is thinner and further away
      src.playbackRate.value = .88;
      const echo = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain();
      echo.delayTime.value = fx === 'stream' ? .19 : .11; fb.gain.value = fx === 'stream' ? .42 : .25; wet.gain.value = fx === 'stream' ? .5 : .28;
      echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(out);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = fx === 'stream' ? 2600 : 3800; stage(lp); lp.connect(echo);
      if (fx === 'stream') { const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 320; stage(hp); out.gain.value *= .75; }
      const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 220; low.gain.value = 6; stage(low);
    } else if (fx === 'radio') {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = .9; stage(bp);
      const ws = ctx.createWaveShaper(); ws.curve = crush(18); stage(ws);
    }
    src.connect(head);
    const stopAll = () => { try { src.stop(); } catch { /* already stopped */ } for (const x of extra) try { x.stop(); } catch { /* */ } };
    src.start(t0); for (const x of extra) x.start(t0);
    const handle = { stop: () => { out.gain.setTargetAtTime(0, ctx.currentTime, .03); setTimeout(stopAll, 120); }, duration: buf.duration / src.playbackRate.value };
    src.onended = () => { for (const x of extra) try { x.stop(); } catch { /* */ } if (line === handle) line = null; };
    if ((o.channel ?? 'line') === 'line') line = handle;
    return handle;
  }

  return {
    ready,
    /** a clip exists for this speaker and line */
    has: (speaker: string, text: string) => !!keyOf(speaker, text),
    /** seconds the clip lasts as played (0 if none) */
    duration(speaker: string, text: string) { const k = keyOf(speaker, text); if (!k) return 0; const f = cast[speaker].fx; return clips[k].dur / (f === 'warden' || f === 'stream' ? .88 : f === 'robot' ? 1.04 : 1); },
    /** start downloading every clip (small files); decoding waits until a line plays */
    preloadAll() { void ready.then(() => { let i = 0; for (const k of Object.keys(clips)) setTimeout(() => void fetchClip(k), 40 * i++); }); },
    play,
    stopLine() { line?.stop(); line = null; },
    get count() { return Object.keys(clips).length; },
  };
}
export type Voice = ReturnType<typeof createVoice>;
