import * as T from 'three';
import type { Guide } from './guide';
import type { Station } from './kit/station';
import { sfx } from './sfx';
import { HOLO, glyph, holoMaterial, setHolo, sparks } from './kit/holo';
import { buildNeuralNet } from './kit/neural-net';
import type { EchoContent } from './worlds/first-words-echo';

// Zip's speech engine, projected as a hologram from his chest coil.
//   ring  = the context: the words the engine reads, in order
//   net   = the engine itself, a small neural network: each word in the ring sends light up
//           through its layers, and the streams meet in the guesses (kit/neural-net). Around it
//           the dormant web, mostly dark: the rest of Zip's voice, lit coil by coil
//   fan   = its guesses for the next word, brighter = more confident
//   loop  = the spoken word flowing back into the ring
// The station's rules decide what the engine says; the hologram shows it and
// the knowledge table (station content) supplies the guesses it weighed.

export type Hear = 'wobble' | 'sink' | 'lift' | 'petals' | 'stall' | 'wake';
interface Opts {
  guide: Guide; host: HTMLElement; camera: T.Camera; station: Station;
  zip: () => T.Vector3;
  /** the words Zip carries (absorbed or made), in order */
  carried: () => string[];
  carry: (word: string) => void;
  /** where spoken words fly to (the machine that listens) */
  target: () => T.Vector3;
  /** the machine reacts to what it heard */
  hear: (kind: Hear) => void;
  onThought?: (id: string) => void;
  onComplete: () => void;
}

export function buildEngine(scene: T.Scene, o: Opts) {
  const g = o.guide, st = o.station, c = o.station.spec.content as unknown as EchoContent, L = c.lines;
  const N = c.slots;
  const holo = new T.Group(); holo.name = 'engine-hologram'; holo.visible = false; scene.add(holo);
  const world = new T.Group(); scene.add(world);        // things that leave the hologram (spoken words)
  const fx = sparks(world, 48);

  // ── layout (local: x right, y up, the group faces the camera) ──
  const slotAt = (i: number) => slotAtN(N, i);
  const CORE = new T.Vector3(0, .78, 0);
  const frames = Array.from({ length: N }, (_, i) => { const m = glyph('', { height: .34, color: HOLO.dim, frame: true, intensity: 1.1 }); m.scale.x = .5 / (m.geometry as T.PlaneGeometry).parameters.width; m.position.copy(slotAt(i)); holo.add(m); return m; });
  const slotWords: (T.Mesh | null)[] = Array(N).fill(null);
  // a field of dark glass behind the hologram: light reads against it even under a bright sky
  const fieldTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d')!; const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, 'rgba(3,14,26,.86)'); gr.addColorStop(.72, 'rgba(5,24,40,.7)'); gr.addColorStop(.93, 'rgba(111,224,201,.35)'); gr.addColorStop(1, 'rgba(111,224,201,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256); const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; return tx; })();
  const field = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ map: fieldTex, transparent: true, depthWrite: false, toneMapped: false }));
  field.scale.set(1.86, 1.42, 1); field.position.set(0, .6, -.4); field.renderOrder = 8; holo.add(field);
  const halo = new T.Mesh(new T.TorusGeometry(1.62, .009, 6, 96), holoMaterial({ color: HOLO.found, opacity: .45, scan: 0 })); halo.scale.set(1, .32, 1); halo.position.set(0, -.12, -.12); holo.add(halo);
  const halo2 = halo.clone(); halo2.scale.set(1.08, .36, 1); halo2.position.y = -.2; holo.add(halo2);
  // the engine: a neural net from the ring (inputs) to the guess fan (outputs). Desmic, 25 Oct: the
  // voice coming back "coil by coil" went unseen in five runs as words; asked for "an actual
  // representation of neural net, showing some activations … a sense of beauty and awe"
  const net = zipNet(N);
  holo.add(net.group);
  (window as unknown as { __vlNet?: typeof net }).__vlNet = net;   // tests: which nodes a ring lights, how much is awake
  let woken = false;   // the dormant web wakes a little at a time, and stays woken
  const coreGrp = new T.Group(); coreGrp.position.copy(CORE); holo.add(coreGrp);
  const coreHit = new T.Mesh(new T.SphereGeometry(.32, 8, 6), new T.MeshBasicMaterial({ visible: false })); coreGrp.add(coreHit);
  // the projection cone from Zip's chest to the ring
  const coneGeo = new T.CylinderGeometry(1, .05, 1, 28, 1, true); coneGeo.translate(0, .5, 0);
  const cone = new T.Mesh(coneGeo, holoMaterial({ color: HOLO.found, opacity: .1, edge: 1.4, intensity: 1.2 })); cone.frustumCulled = false; world.add(cone);
  // the loop conduit: from the core around to the next empty slot
  const loopMat = holoMaterial({ color: HOLO.found, opacity: .9, intensity: 2.2, scan: 0, flow: 1 });
  let loopMesh: T.Mesh | null = null, loopCurve: T.CatmullRomCurve3 | null = null;
  const buildLoop = (to: number, part = 1) => {
    if (loopMesh) { holo.remove(loopMesh); loopMesh.geometry.dispose(); }
    const end = slotAt(to).add(new T.Vector3(0, -.24, .02));
    loopCurve = new T.CatmullRomCurve3([CORE.clone().add(new T.Vector3(.22, 0, 0)), new T.Vector3(1.2, .95, .05), new T.Vector3(1.5, .15, .06), new T.Vector3(end.x + .4, end.y - .26, .05), end]);
    const pts = loopCurve.getSpacedPoints(48).slice(0, Math.max(2, Math.round(48 * part)));
    loopMesh = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, .026, 6, false), loopMat); holo.add(loopMesh);
    return loopCurve;
  };
  // guesses
  let fan: { m: T.Mesh; pct: T.Mesh; w: number; word: string; at: T.Vector3 }[] = [];
  const clearFan = () => { for (const f of fan) { holo.remove(f.m, f.pct); } fan = []; };
  const guesses = (key: string) => { const k = c.knowledge; return [...(k.known[key] ?? k.unsure)].sort((a, b) => b[1] - a[1]).slice(0, 3); };
  /** what each input of the net carries: the word in that slot, or nothing */
  const inputs = () => Array.from({ length: N }, (_, i) => { const w = st.state['s' + i] as string; return w && w !== 'none' ? w : null; });

  // ── HUD: a prompt and a tray of carried words (easy to tap on a phone) ──
  const tray = document.createElement('div'); tray.className = 'engine-tray'; tray.hidden = true; o.host.appendChild(tray);
  const promptEl = document.createElement('div'); promptEl.className = 'engine-prompt'; promptEl.hidden = true; o.host.appendChild(promptEl);
  const say = (html: string) => { promptEl.innerHTML = html; promptEl.hidden = false; };

  let open = false, busy = false, t = 0, wrongLoads = 0;
  const timers: { at: number; fn: () => void }[] = [];
  const later = (s: number, fn: () => void) => timers.push({ at: t + s, fn });
  const ring = () => Array.from({ length: N }, (_, i) => st.state['s' + i] as string).filter(w => w !== 'none');
  const tmp = new T.Vector3(), tmp2 = new T.Vector3();
  const toWorld = (v: T.Vector3) => holo.localToWorld(v.clone());

  const renderRing = (pop = -1) => {
    const r = ring();
    for (let i = 0; i < N; i++) {
      const w = r[i];
      if (slotWords[i] && slotWords[i]!.userData.word !== w) { holo.remove(slotWords[i]!); slotWords[i] = null; }
      if (w && !slotWords[i]) {
        const m = glyph(w, { height: .28, color: MADE.has(w) ? HOLO.made : HOLO.found, intensity: 2 }); const mw = (m.geometry as T.PlaneGeometry).parameters.width; if (mw > .49) m.scale.x = .49 / mw; m.userData.sx = m.scale.x; m.position.copy(slotAt(i)).add(new T.Vector3(0, 0, .01)); m.userData.slot = i; holo.add(m); slotWords[i] = m;
        if (i === pop) { m.scale.set(.2, .2, 1); fx.burst(toWorld(slotAt(i)), 8, 1, MADE.has(w) ? HOLO.made : HOLO.found); }
      }
      setHolo(frames[i].material as T.Material, { color: w ? HOLO.found : HOLO.dim, intensity: w ? 1.3 : .9 });
    }
  };
  const renderTray = () => {
    const inRing = new Set(ring()), words = o.carried().filter(w => !inRing.has(w));
    tray.innerHTML = `<div class="engine-words">${words.length ? words.map(w => `<button class="holo-chip${MADE.has(w) ? ' made' : ''}" data-w="${w}" data-action="load.${w}" ${busy ? 'disabled' : ''}>${w}</button>`).join('') : '<span class="holo-none">No more words. Absorb some from the world!</span>'}</div>
      <div class="engine-buttons"><button class="holo-cast" data-act="cast" data-action="cast" ${ring().length && !busy ? '' : 'disabled'}>Cast ✦</button>${ring().length ? `<button class="holo-quiet" data-act="clear" ${busy ? 'disabled' : ''} aria-label="Clear the ring">↺ Clear</button>` : ''}<button class="holo-quiet" data-act="close" ${busy ? 'disabled' : ''}>Step away</button></div>`;
  };
  // while the ring is being edited, the engine's guess for what's in it now, dim, so a word in or
  // out visibly changes what it would say (run 14: "make the guess change when the ring changes")
  const preview = () => { if (!open || busy) return; const key = ring().join(' '); if (!key) { clearFan(); net.rest(); return; } showFan(key, null); net.preview(inputs(), guesses(key).map(g => g[1])); };
  const refresh = (pop = -1) => { renderRing(pop); renderTray(); preview(); };

  const load = (w: string) => { if (busy) return; const r = st.act('load.' + w); if (!r.ok) { sfx.boing(); g.toast('The ring is full. Tap a word in it to take it out.', 1500); return; } sfx.place(); refresh(ring().length - 1); };
  const unload = (i: number) => { if (busy) return; const r = st.act('unload.' + i); if (r.ok) { sfx.tap(); fx.burst(toWorld(slotAt(i)), 6, .8); refresh(); } };

  // ── casting: read → guess → speak → the machine reacts ──
  const cast = () => {
    if (busy || !open) return;
    const words = ring(); if (!words.length) { say(L.empty); sfx.boing(); return; }
    const res = st.act('cast'); if (!res.ok) return;
    if (res.events.includes('nothing-loaded')) { say(L.empty); return; }
    busy = true; renderTray(); say(L.reading); promptEl.classList.add('quiet');
    const said = res.events.find(e => e.startsWith('engine-says:'))!.slice(12);
    think(words, said, () => react(res.events, said));
  };
  /** the reading animation, the guess fan, and the spoken word flying to the machine */
  const think = (words: string[], said: string, then: () => void) => {
    // every word in the ring sends its light up through the net at once (it reads them all), and the
    // streams meet in the guesses; a different ring lights a different pattern
    clearFan();
    words.forEach((_, i) => later(i * .05, () => { sfx.tick(); const sw = slotWords[i]; if (sw) sw.scale.set((sw.userData.sx ?? 1) * 1.18, 1.18, 1); }));
    const gs = guesses(words.join(' ')), up = net.fire(inputs(), gs.map(g => g[1]), gs.findIndex(g => g[0] === said), .26);
    sfx.hum(1.2);
    later(up, () => showFan(words.join(' '), said));
    later(up + .9, () => speak(said, then));
  };
  const showFan = (key: string, said: string | null) => {
    clearFan(); const dim = said === null;   // a preview: what it would say, before casting
    const gs = guesses(key);
    gs.forEach(([w, p], i) => {
      const top = dim ? false : w === said, at = FAN[i].clone();
      const m = glyph(w === '.' ? 'END' : dim && i === 0 ? w + '?' : w, { height: .16 + .2 * p, color: top ? HOLO.made : HOLO.found, intensity: (.6 + 2.2 * p) * (dim ? .6 : 1) }); m.position.copy(at); holo.add(m);
      const pct = glyph(`${Math.round(p * 100)}%`, { height: .11, color: top ? HOLO.made : HOLO.found, intensity: 1.2 }); pct.position.copy(at).add(new T.Vector3(0, -.2 - .08 * p, 0)); holo.add(pct);
      m.scale.setScalar(.1); fan.push({ m, pct, w: p, word: w, at });
    });
    if (!dim) sfx.speak(2);
  };
  let flyer: { m: T.Mesh; from: T.Vector3; to: () => T.Vector3; t: number; dur: number; done: () => void; arc: number } | null = null;
  const speak = (said: string, then: () => void) => {
    const f = fan.find(x => x.word === said);
    const m = glyph(said === '.' ? '·' : said, { height: .32, color: HOLO.made, intensity: 2.6 });
    m.position.copy(toWorld(f ? f.at : CORE)); world.add(m);
    clearFan(); net.rest(); sfx.speak(4); sfx.whoosh();
    flyer = { m, from: m.position.clone(), to: o.target, t: 0, dur: .8, arc: 1.2, done: () => { world.remove(m); fx.burst(o.target(), 14, 2, HOLO.made); then(); } };
  };
  const back = (html: string, wait = 2.8) => { say(html); promptEl.classList.remove('quiet'); later(wait, () => { busy = false; renderTray(); preview(); }); };
  const react = (events: string[], said: string) => {
    if (events.includes('skiff-hears:sink')) { o.hear('sink'); wrongLoads++; back(L.sink, 3.2); o.onThought?.('engine-sink'); return; }
    if (events.includes('loop-breaks')) { o.hear('lift'); breakLoop(); return; }
    if (events.includes('loop-repaired')) { o.hear('lift'); repairLoop(); return; }
    const kind = events.find(e => e.startsWith('decide:'))?.split(':')[3];
    if (kind === 'original-only') { o.hear('stall'); back(L.again, 3); return; }
    if (kind === 'newest-only') { o.hear('petals'); back(L.petals, 3); return; }
    if (kind === 'partial') { o.hear('wobble'); back(L.partial, 2.6); return; }
    o.hear('wobble'); wrongLoads++; back(wrongLoads >= 2 ? `${L.um} ${L.umHint}` : L.um, 3);
    void said;
  };
  const breakLoop = () => {
    // the new word tries to flow back into the ring, but the Warden's bolt cracked the loop
    const curve = buildLoop(ring().length, .58); setHolo(loopMat, { color: HOLO.foe, intensity: 2.2 });
    const m = glyph('Blossom', { height: .27, color: HOLO.made, intensity: 2.4 }); holo.add(m);
    let k = 0; const step = () => { k += .05; m.position.copy(curve.getPointAt(Math.min(.58, k))); if (k < .58) later(.03, step); else { sfx.zap(); sfx.glitch(); fx.burst(toWorld(m.position), 22, 2.2, HOLO.foe); holo.remove(m); o.carry('Blossom'); o.onThought?.('loop-broken'); back(L.loopBroken, .4); } };
    later(.5, step);
  };
  const repairLoop = () => {
    say(L.repaired); sfx.chime(); net.wakeTo(ZIP_AWAKE.loop, 1.2);
    const curve = buildLoop(ring().length, 1); setHolo(loopMat, { color: HOLO.found, intensity: 2 });
    fx.burst(toWorld(curve.getPointAt(.58)), 26, 2.4, HOLO.found);
    const m = glyph('Isle', { height: .27, color: HOLO.made, intensity: 2.4 }); holo.add(m);
    let k = 0; const step = () => { k += .035; m.position.copy(curve.getPointAt(Math.min(1, k))); if (k < 1) later(.03, step); else {
      holo.remove(m); st.act('loop-run'); sfx.place(); refresh(N - 1); o.carry('Isle');
      // the engine runs once more by itself: the sentence is done
      later(.5, () => think(ring(), '.', finale));
    } };
    later(.7, step);
  };
  const finale = () => {
    say(L.done);
    // the sentence is whole: the net blooms and a little more of the dark web wakes (his voice, coming back)
    net.bloom(); net.wakeTo(ZIP_AWAKE.skiff, 2.6); sfx.chime(); o.onThought?.('engine-wake');
    const words = ring(); let i = 0;
    const next = () => {
      if (i >= words.length) {
        // the payoff: the whole sentence shines over the skiff as it wakes, before any score
        o.hear('wake'); say(L.launch ?? L.done); promptEl.classList.remove('quiet');
        const banner = glyph(words.join(' '), { height: .46, color: HOLO.made, intensity: 2.8 }); banner.position.copy(o.target()).add(new T.Vector3(0, 2.1, 0)); tray.hidden = true; banner.lookAt(o.camera.position); world.add(banner);
        fx.burst(o.target(), 40, 3, HOLO.made); holo.visible = false; cone.visible = false;
        shotLook.copy(o.target()).add(new T.Vector3(0, .5, 0)); shotPos.y += .8;   // look up at the skiff
        later(.8, () => fx.burst(o.target(), 30, 2.6, HOLO.found));
        later(3.2, () => { world.remove(banner); close(); o.onComplete(); });
        return;
      }
      const sw = slotWords[i]!, m = glyph(words[i], { height: .24, color: HOLO.made, intensity: 2.6 }); m.position.copy(toWorld(sw.position)); world.add(m); sw.visible = false; i++;
      sfx.speak(2); flyer = { m, from: m.position.clone(), to: o.target, t: 0, dur: .5, arc: .6, done: () => { world.remove(m); fx.burst(o.target(), 8, 1.6, HOLO.made); next(); } };
    };
    later(.4, next);
  };

  tray.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button'); if (!b || b.disabled) return; e.stopPropagation();
    if (b.dataset.w) load(b.dataset.w);
    else if (b.dataset.act === 'cast') cast();
    else if (b.dataset.act === 'close') close(true);
    else if (b.dataset.act === 'clear' && !busy) { while (ring().length && st.act('unload.0').ok); sfx.whoosh(); fx.burst(toWorld(CORE), 10, 1); refresh(); }
  });
  const untap = g.onTap(ray => {
    if (!open) return false;
    if (ray.intersectObject(coreHit, false).length) { cast(); return true; }
    const hits = ray.intersectObjects(slotWords.filter(Boolean) as T.Mesh[], false); const s = hits[0]?.object.userData.slot;
    if (s !== undefined) { unload(s); return true; }
    return true;   // the engine is open: taps don't walk Zip away
  });

  const shotPos = new T.Vector3(), shotLook = new T.Vector3();
  let onClose: (() => void) | null = null;
  /** byUser: the player stepped away (the story takes back control) */
  const close = (byUser = false) => {
    open = false; holo.visible = false; cone.visible = false; tray.hidden = true; promptEl.hidden = true; o.host.classList.remove('puzzle-mode', 'engine-mode'); clearFan();
    for (const sw of slotWords) if (sw) sw.visible = true;
    if (byUser) { const f = onClose; onClose = null; f?.(); }
  };
  return {
    get active() { return open; },
    get shot() { return open ? { pos: shotPos, look: shotLook } : null; },
    /** open in front of Zip; the camera frames Zip from behind with the hologram and the machine beyond */
    open(center: T.Vector3, closed?: () => void) {
      onClose = closed ?? null;
      holo.position.copy(center); holo.visible = cone.visible = true; open = true; busy = false;
      const aspect = innerWidth / innerHeight, d = Math.max(4.2, 2.75 / (2 * Math.tan(26 * Math.PI / 180) * aspect));
      // frame the hologram left of centre so the listening machine stays in view on the right
      shotPos.set(center.x - .2, center.y - .45, center.z + d); shotLook.set(center.x + .1, center.y + .1, center.z - 1);
      holo.rotation.y = 0;
      o.host.classList.add('puzzle-mode', 'engine-mode'); tray.hidden = false;
      if (st.state.phase === 'loop') say(L.loopBroken); else say(L.open);
      promptEl.classList.remove('quiet');
      if (st.state.phase === 'loop') buildLoop(ring().length, .58);
      if (!woken) { woken = true; net.setAwake(ZIP_AWAKE.start); later(2.6, () => o.onThought?.('engine-open')); }
      refresh(); sfx.hum(1.5); fx.burst(toWorld(CORE), 20, 1.6);
      holo.scale.setScalar(.05);
    },
    close() { close(true); },
    tick(dt: number) {
      t += dt;
      for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= t) { const f = timers[i].fn; timers.splice(i, 1); f(); }
      fx.tick(dt);
      if (holo.visible) { net.tick(dt); net.group.rotation.y = Math.sin(t * .35) * .06; }   // a slow sway: the sheets part in depth
      if (flyer) {
        flyer.t = Math.min(1, flyer.t + dt / flyer.dur); const k = flyer.t * flyer.t * (3 - 2 * flyer.t), to = flyer.to();
        flyer.m.position.lerpVectors(flyer.from, to, k); flyer.m.position.y += Math.sin(k * Math.PI) * flyer.arc;
        flyer.m.lookAt(o.camera.position); flyer.m.scale.setScalar(1 + Math.sin(k * Math.PI) * .4);
        if (flyer.t >= 1) { const d = flyer.done; flyer = null; d(); }
      }
      if (!open) return;
      holo.scale.setScalar(Math.min(1, holo.scale.x + dt * 3.5));
      halo.rotation.z = t * .15; halo2.rotation.z = -t * .1;
      for (const sw of slotWords) if (sw) { sw.scale.lerp(tmp.set(sw.userData.sx ?? 1, 1, 1), Math.min(1, dt * 8)); }
      for (const f of fan) f.m.scale.lerp(tmp.setScalar(1), Math.min(1, dt * 9));
      // the projection cone from Zip's chest to the bottom of the ring
      const z = o.zip(); tmp.copy(z).setY(z.y + 1.0); tmp2.copy(holo.position).setY(holo.position.y - .45);
      cone.position.copy(tmp); const dir = tmp2.clone().sub(tmp), len = dir.length();
      cone.scale.set(1.25 * holo.scale.x, len, .5 * holo.scale.x); cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    },
    dispose() { untap(); },
  };
}
const MADE = new Set(['Blossom', 'Isle']);
const SP = .53, slotAtN = (N: number, i: number) => new T.Vector3((i - (N - 1) / 2) * SP, -.07 * (i - (N - 1) / 2) ** 2, -.08 * (i - (N - 1) / 2) ** 2);
const FAN = [new T.Vector3(0, 1.52, 0), new T.Vector3(-.78, 1.36, 0), new T.Vector3(.78, 1.36, 0)];
/** Zip's speech engine as a neural net: the ring is its input, the guess fan its output, and behind
 *  it the dormant rest of his voice. The same net shows wherever his voice comes back (voice-moment). */
export const zipNet = (N = 5) => buildNeuralNet({
  inputs: Array.from({ length: N }, (_, i) => slotAtN(N, i).add(new T.Vector3(0, .24, -.02))),
  outputs: FAN.map(p => p.clone().add(new T.Vector3(0, -.42, -.02))),
  hidden: [6, 8, 6], width: 2.3, bow: .12, seed: 11,
  dormant: { rows: [6, 9, 11, 12, 11, 9, 6], width: 3.3, z: -.5, y: [-.3, 1.7] },
  colors: { lit: HOLO.found, hot: HOLO.made, crack: HOLO.foe },
  onWake: i => { if (i % 2 === 0) sfx.bell(i / 2, .5); },   // a rising bell scale as his voice lights
});
/** how much of Zip's voice is awake after each stop: the net wakes coil by coil */
export const ZIP_AWAKE = { start: .14, loop: .24, skiff: .5, loom: .7 } as const;
