// A living soundscape, synthesized (no files, light enough for a low-end phone): an ambient
// bed for the place (wind that gusts, birds, a distant waterfall, bell chimes) and sparse
// music in the open-world style: a few soft "felt piano" notes, then long silence, phrased in
// the mood of the story beat (a scale, a register, how often it plays, a low drone). Music
// dips under spoken lines and stops for cutscenes; the ambience stays (the world keeps
// breathing). Both ride the shared master (Sound off mutes everything); Music has its own
// switch. Game-agnostic: a game gives its moods and places as data (worlds/*-sound.ts).

export interface Mood {
  /** scale degrees in semitones from the root, e.g. major pentatonic [0, 2, 4, 7, 9] */
  scale: number[];
  /** root note in Hz (e.g. 261.6 = C4) */
  root: number;
  /** seconds of silence between phrases [min, max] */
  rest: [number, number];
  /** notes per phrase [min, max] */
  notes: [number, number];
  /** 0..1 loudness */
  level: number;
  /** a soft low drone on the root (tension, flight) */
  drone?: number;
  /** spread of the melody in octaves above the root (default 1) */
  span?: number;
}
export interface Ambience { wind?: number; birds?: number; water?: number; chimes?: number }
export interface SoundscapeSpec { moods: Record<string, Mood>; places: Record<string, Ambience> }

/** gains of each layer, set by measurement (4 Oct): voices peak ~0.3 on the master; music phrases
 *  sit about 10 dB under them, the ambience about 20 dB under (heard on a phone, never in the way) */
export const LEVEL = { note: .1, bird: .05, chime: .04, drone: .05, wind: .16, water: .04 };

export function createSoundscape(audio: () => { ctx: AudioContext; master: GainNode } | null, spec: SoundscapeSpec, opts: { music?: boolean } = {}) {
  let ctx: AudioContext | null = null, out: GainNode, musicBus: GainNode, ambBus: GainNode, verb: GainNode;
  let windGain: GainNode, windFilter: BiquadFilterNode, waterGain: GainNode, droneOsc: OscillatorNode, droneGain: GainNode;
  let lastT = -1, mood: Mood | null = null, moodName: string | null = null, place: Ambience = {}, nextPhrase = 4, birdT = 3, chimeT = 9, gustT = 0, duckT = 0;
  let musicOn = opts.music ?? (() => { try { return localStorage.getItem('vibelearn.music') !== '0'; } catch { return true; } })();
  const now = () => ctx!.currentTime, rand = (a: number, b: number) => a + Math.random() * (b - a);

  const build = () => {
    const a = audio(); if (!a) return false;
    ctx = a.ctx; out = ctx.createGain(); out.gain.value = 1; out.connect(a.master);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 1 : 0; musicBus.connect(out);
    ambBus = ctx.createGain(); ambBus.gain.value = 1; ambBus.connect(out);
    // a cheap reverb: two feedback delays with a lowpass in the loop (no convolver: phones)
    verb = ctx.createGain(); verb.gain.value = .9;
    for (const [d, fb] of [[.137, .42], [.211, .38]] as const) {
      const dl = ctx.createDelay(1), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      dl.delayTime.value = d; g.gain.value = fb; lp.type = 'lowpass'; lp.frequency.value = 2200;
      verb.connect(dl); dl.connect(lp); lp.connect(g); g.connect(dl); lp.connect(musicBus);
    }
    // wind: looped noise through a moving bandpass
    const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = nb.getChannelData(0);
    let b0 = 0; for (let i = 0; i < d.length; i++) { b0 = .985 * b0 + .015 * (Math.random() * 2 - 1); d[i] = b0 * 6; }   // brown-ish
    const wind = ctx.createBufferSource(); wind.buffer = nb; wind.loop = true;
    windFilter = ctx.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 500; windFilter.Q.value = .7;
    windGain = ctx.createGain(); windGain.gain.value = 0; wind.connect(windFilter); windFilter.connect(windGain); windGain.connect(ambBus); wind.start();
    // water: the falls, far away (white noise, high band, very low)
    const wb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), w = wb.getChannelData(0);
    for (let i = 0; i < w.length; i++) w[i] = Math.random() * 2 - 1;
    const water = ctx.createBufferSource(); water.buffer = wb; water.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 1800; wf.Q.value = .4;
    waterGain = ctx.createGain(); waterGain.gain.value = 0; water.connect(wf); wf.connect(waterGain); waterGain.connect(ambBus); water.start();
    // drone (moods that want one)
    droneOsc = ctx.createOscillator(); droneOsc.type = 'sine'; droneGain = ctx.createGain(); droneGain.gain.value = 0;
    droneOsc.connect(droneGain); droneGain.connect(musicBus); droneOsc.start();
    return true;
  };

  /** a soft piano-like note: three partials, quick attack, long natural decay, through the reverb */
  const note = (f: number, t: number, v: number, len = 3.2) => {
    const g = ctx!.createGain(), lp = ctx!.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(5000, f * 6), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 1.5), t + len);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(v * .25, t + .4); g.gain.exponentialRampToValueAtTime(.0005, t + len);
    lp.connect(g); g.connect(musicBus); g.connect(verb);
    for (const [k, a] of [[1, 1], [2, .28], [3, .08]] as const) {
      const o = ctx!.createOscillator(), og = ctx!.createGain(); o.type = 'sine'; o.frequency.value = f * k * (1 + (k - 1) * .0015); og.gain.value = a;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + len + .05);
    }
  };
  const phrase = () => {
    if (!mood) return;
    const n = Math.round(rand(mood.notes[0], mood.notes[1])), span = mood.span ?? 1;
    let deg = Math.floor(Math.random() * mood.scale.length), oct = Math.random() < .5 ? 0 : 1, t = now() + .05;
    for (let i = 0; i < n; i++) {
      const f = mood.root * 2 ** ((mood.scale[deg] + 12 * oct) / 12);
      note(f, t, LEVEL.note * mood.level * (i === n - 1 ? .8 : 1), i === n - 1 ? 4.5 : 3);
      if (Math.random() < .3 && i === 0) note(f / 2, t, LEVEL.note * .55 * mood.level, 4);   // a low note under the first: a hand on the left
      t += [.42, .6, .84, 1.2][Math.floor(Math.random() * 4)];
      deg += [-2, -1, 1, 1, 2][Math.floor(Math.random() * 5)];   // stepwise, mostly
      if (deg < 0) { deg += mood.scale.length; oct = Math.max(0, oct - 1); } if (deg >= mood.scale.length) { deg -= mood.scale.length; oct = Math.min(span, oct + 1); }
    }
  };
  const bird = () => {
    const t = now(), base = rand(2400, 4200), o = ctx!.createOscillator(), g = ctx!.createGain(), pan = ctx!.createStereoPanner();
    pan.pan.value = rand(-.8, .8); o.type = 'sine';
    const chirps = 2 + Math.floor(Math.random() * 3);
    g.gain.setValueAtTime(0, t);
    for (let i = 0; i < chirps; i++) {
      const s = t + i * rand(.09, .16);
      o.frequency.setValueAtTime(base * rand(.9, 1.1), s); o.frequency.exponentialRampToValueAtTime(base * rand(1.2, 1.5), s + .06);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(LEVEL.bird * (place.birds ?? 0), s + .01); g.gain.exponentialRampToValueAtTime(.0005, s + .08);
    }
    o.connect(g); g.connect(pan); pan.connect(ambBus); o.start(t); o.stop(t + chirps * .17 + .1);
  };
  const chime = () => { const f = 1046.5 * 2 ** ([0, 4, 7, 9][Math.floor(Math.random() * 4)] / 12); note(f, now(), LEVEL.chime * (place.chimes ?? 0), 5); };

  return {
    /** the story beat's mood (null: music rests, e.g. in a cutscene) */
    setMood(name: string | null) {
      if (name === moodName) return; moodName = name; mood = name ? spec.moods[name] ?? null : null;
      nextPhrase = rand(1.5, 4);
      if (ctx) { const t = now(); droneGain.gain.setTargetAtTime(mood?.drone ? LEVEL.drone * mood.drone : 0, t, 1.2); if (mood) droneOsc.frequency.setTargetAtTime(mood.root / 2, t, .5); }
    },
    /** the place's ambience (wind, birds, water, chimes) */
    setPlace(name: string | null) { place = (name && spec.places[name]) || {}; },
    /** a line is being spoken: dip the music for this long */
    duck(sec: number) { duckT = Math.max(duckT, sec); },
    get music() { return musicOn; },
    set music(v: boolean) { musicOn = v; try { localStorage.setItem('vibelearn.music', v ? '1' : '0'); } catch { /* no storage */ } if (ctx) musicBus.gain.setTargetAtTime(v ? 1 : 0, now(), .3); },
    get mood() { return moodName; },
    /** for tests: play one phrase of the current mood now */
    testPhrase() { if (ctx && mood) phrase(); },
    tick(_frameDt: number) {
      if (!ctx && !build()) return;
      if (ctx!.state !== 'running') { lastT = -1; return; }
      // time from the audio clock, not frames: music keeps its pace at any frame rate
      const t = now(), dt = lastT < 0 ? 0 : Math.min(.5, t - lastT); lastT = t;
      // ambience follows the place smoothly; gusts come and go
      gustT -= dt; if (gustT <= 0) { gustT = rand(3, 9); windFilter.frequency.setTargetAtTime(rand(300, 900), t, 1.5); }
      windGain.gain.setTargetAtTime(LEVEL.wind * (place.wind ?? 0) * (1 + .5 * Math.sin(t * .31) * Math.sin(t * .17)), t, .8);
      waterGain.gain.setTargetAtTime(LEVEL.water * (place.water ?? 0), t, 1.5);
      if ((place.birds ?? 0) > 0 && (birdT -= dt) <= 0) { birdT = rand(2.5, 9) / Math.max(.3, place.birds!); bird(); }
      if ((place.chimes ?? 0) > 0 && (chimeT -= dt) <= 0) { chimeT = rand(10, 25); chime(); }
      // music: phrases separated by rests; ducked under speech
      duckT = Math.max(0, duckT - dt);
      if (musicOn) musicBus.gain.setTargetAtTime(duckT > 0 ? .35 : 1, t, .25);
      if (mood && (nextPhrase -= dt) <= 0) { if (duckT <= 0) phrase(); nextPhrase = rand(mood.rest[0], mood.rest[1]); }
    },
  };
}
export type Soundscape = ReturnType<typeof createSoundscape>;
