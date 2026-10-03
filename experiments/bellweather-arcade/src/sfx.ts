// Tiny synthesized sound kit (no files to download) plus phone haptics.
// Every game in VibeLearn can reuse it: pop for taps, catch for success in the
// small, chime for a solved puzzle, boing for a funny mistake, whoosh, zap.
// Audio starts on the first user gesture (browser rule); muting is remembered.

let ctx: AudioContext | null = null, master: GainNode | null = null;
let muted = (() => { try { return localStorage.getItem('bellweather.mute') === '1'; } catch { return false; } })();
const ensure = () => {
  if (!ctx) { try { ctx = new AudioContext(); master = ctx.createGain(); master.gain.value = muted ? 0 : .5; master.connect(ctx.destination); } catch { return null; } }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};
if (typeof window !== 'undefined') for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, () => ensure(), { once: false, passive: true });

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = .3, slide = 0, delay = 0) {
  const c = ensure(); if (!c || !master || muted) return;
  const t0 = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .012); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .02);
}
function noise(dur: number, vol = .2, from = 1800, to = 300, delay = 0) {
  const c = ensure(); if (!c || !master || muted) return;
  const t0 = c.currentTime + delay, b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.setValueAtTime(from, t0); f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t0);
}
/** the shared audio graph (voices play through the same master, so Sound off mutes them too) */
export function audio(): { ctx: AudioContext; master: GainNode } | null { const c = ensure(); return c && master ? { ctx: c, master } : null; }
const buzz = (ms: number | number[]) => { try { navigator.vibrate?.(ms); } catch { /* not on this device */ } };

export const sfx = {
  get muted() { return muted; },
  setMuted(v: boolean) { muted = v; if (master) master.gain.value = v ? 0 : .5; try { localStorage.setItem('bellweather.mute', v ? '1' : '0'); } catch { /* private mode */ } },
  tap() { tone(660, .08, 'triangle', .18); },
  pop() { tone(420, .12, 'sine', .28, 380); },
  catch() { tone(520, .09, 'triangle', .25); tone(780, .14, 'triangle', .25, 0, .07); buzz(15); },
  place() { tone(300, .1, 'square', .08); tone(600, .12, 'sine', .2, 0, .04); },
  /** a hand bell: note is a step on a pentatonic scale (0 = C5); bells ring with inharmonic partials */
  bell(note = 0, v = 1) { const f = 523.25 * 2 ** ([0, 2, 4, 7, 9, 12, 14][((note % 7) + 7) % 7] / 12); tone(f, 1.3, 'sine', .12 * v); tone(f * 2.76, .55, 'sine', .04 * v); tone(f * 5.4, .22, 'sine', .02 * v); },
  chime() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .35, 'sine', .22, 0, i * .09)); buzz([20, 40, 20]); },
  star(i: number) { tone(880 + i * 220, .25, 'sine', .25); tone(1320 + i * 330, .2, 'triangle', .1, 0, .05); buzz(12); },
  boing() { tone(220, .45, 'sine', .35, -120); tone(330, .3, 'triangle', .12, -160, .05); buzz(40); },
  whoosh() { noise(.6, .25, 2500, 300); },
  zap() { noise(.3, .3, 4000, 900); tone(1200, .25, 'sawtooth', .08, -1000); buzz([30, 20, 60]); },
  static() { noise(.9, .12, 3000, 2800); noise(.5, .08, 1200, 1100, .3); },
  hum(k = 1) { tone(110 + 40 * k, .5, 'sine', .08 * k); },
  whisper() { tone(147, .9, 'sine', .1, -40); tone(220, .7, 'triangle', .04, -60, .1); noise(.7, .05, 900, 500); },
  tick() { tone(1800 + Math.random() * 400, .025, 'square', .025); },
  glitch() { noise(.18, .12, 5000, 1500); tone(90, .15, 'sawtooth', .05); },
  hmm() { tone(330, .12, 'sine', .07); tone(262, .16, 'sine', .07, 0, .1); },
  /** walking into an edge: a soft, low knock */
  bump() { tone(170, .09, 'sine', .14, -50); buzz(8); },
  /** distant thunder / an engine's rumble: low and long */
  rumble(k = 1) { noise(1.8, .32 * k, 260, 50); tone(48, 1.4, 'sine', .22 * k, -10); buzz([40, 60, 80]); },
  thud() { tone(90, .25, 'sine', .4, -40); buzz(60); },
  speak(n = 3) { for (let i = 0; i < n; i++) tone(500 + Math.random() * 400, .07, 'square', .06, 0, i * .09); },
};
