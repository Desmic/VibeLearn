import * as T from 'three';
import { HOLO, beam, holoMaterial } from './holo';

// The word ring: a hologram the protagonist projects to say something. It is the engine's
// context, made visible and touchable, in the world rather than on a card:
//   - slots   = the context window: a fixed number of glowing sockets in a shallow arc, with the
//               limit shown on the ring itself ("2 / 3"); a word that doesn't fit bounces off;
//   - words   = the words carried, floating in an arc below; tap one to send it into the next slot
//               (tap a slotted word to take it back out);
//   - core    = the prism above; tap it to speak. The ring then reads its slots in order (a beam
//               sweeps left to right) before the words leave for the world.
// The pieces are DOM elements pinned to points in the world (so they are big, crisp, tappable on
// a phone, keyboard-friendly, and carry data-action tags for tests); the light (field, halo,
// projection beams from the speaker's chest) is three.js. Game-agnostic: the game gives the
// words, the number of slots, where to stand it, and what speaking does. Sounds are cues the
// game plays (`cue`), so the kit imports nothing from a game.

export type RingCue = 'load' | 'unload' | 'full' | 'speak' | 'open' | 'close';
export interface WordRingOpts {
  scene: T.Scene; host: HTMLElement; camera: T.Camera;
  /** the ring's centre in the world (e.g. above and in front of the speaker) */
  anchor: () => T.Vector3;
  /** where the projection comes from (the speaker's chest) */
  source: () => T.Vector3;
  cue?: (c: RingCue) => void;
  /** speaking: the words in the slots, in order */
  onSpeak: (words: string[]) => void;
  onClose?: () => void;
  /** a line the ring says about itself, e.g. when full ("Full. My engine holds 3 words.") */
  say?: (text: string) => void;
}

export function createWordRing(o: WordRingOpts) {
  // ── light ──
  const holo = new T.Group(); holo.name = 'word-ring'; holo.visible = false; o.scene.add(holo);
  const field = new T.Mesh(new T.CircleGeometry(1, 48), holoMaterial({ color: '#0b3346', opacity: .35, intensity: .6, scan: .6, solid: true }));
  field.scale.set(1.25, .62, 1); holo.add(field);
  const halo = new T.Mesh(new T.TorusGeometry(1.25, .012, 6, 96), holoMaterial({ color: HOLO.found, opacity: .55, scan: 0 })); halo.scale.set(1, .5, 1); holo.add(halo);
  const cone = beam({ color: HOLO.found, radius: .06, flow: true }); cone.mesh.visible = false; o.scene.add(cone.mesh);
  let reads: ReturnType<typeof beam>[] = [];

  // ── pieces (DOM pinned to world points) ──
  const root = document.createElement('div'); root.className = 'word-ring'; root.hidden = true; o.host.appendChild(root);
  const count = document.createElement('div'); count.className = 'wr-count'; root.appendChild(count);
  const core = document.createElement('button'); core.className = 'wr-core'; core.dataset.action = 'speak'; core.setAttribute('aria-label', 'Speak'); core.innerHTML = '<span>✦</span><b>Speak</b>'; root.appendChild(core);
  const shut = document.createElement('button'); shut.className = 'wr-close'; shut.dataset.action = 'close-ring'; shut.setAttribute('aria-label', 'Step away'); shut.textContent = '×'; root.appendChild(shut);
  let N = 3, carried: string[] = [], slots: string[] = [], slotEls: HTMLButtonElement[] = [], chipEls = new Map<string, HTMLButtonElement>(), busy = false, t = 0, readT = -1, shake = 0;
  const v = new T.Vector3(), right = new T.Vector3(), up = new T.Vector3(), fwd = new T.Vector3();

  const build = () => {
    for (const e of slotEls) e.remove(); for (const e of chipEls.values()) e.remove(); chipEls.clear();
    slotEls = Array.from({ length: N }, (_, i) => { const b = document.createElement('button'); b.className = 'wr-slot'; b.dataset.slot = String(i); root.appendChild(b); return b; });
    carried.forEach((w, i) => { const b = document.createElement('button'); b.className = 'wr-chip'; b.dataset.w = w; b.dataset.action = 'say.' + w; b.innerHTML = `<kbd aria-hidden="true">${i + 1}</kbd>${w}`; root.appendChild(b); chipEls.set(w, b); });
    render();
  };
  const render = () => {
    slotEls.forEach((b, i) => { const w = slots[i]; b.textContent = w ?? ''; b.classList.toggle('filled', !!w); b.dataset.action = w ? 'unsay.' + i : ''; b.setAttribute('aria-label', w ? `Take “${w}” out` : `Empty slot ${i + 1}`); b.disabled = busy || !w; });
    for (const [w, b] of chipEls) { const used = slots.includes(w); b.classList.toggle('used', used); b.disabled = busy || used; }
    count.textContent = slots.length >= N ? `${N} / ${N} words · full` : `${slots.length} / ${N} words`; count.classList.toggle('full', slots.length >= N);
    core.disabled = busy || !slots.length; core.classList.toggle('ready', !!slots.length && !busy);
  };
  const load = (w: string) => {
    if (busy || slots.includes(w)) return;
    if (slots.length >= N) { shake = .45; count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump'); o.cue?.('full'); o.say?.(`Full. My engine holds ${N} words.`); return; }
    slots.push(w); o.cue?.('load'); render(); const b = slotEls[slots.length - 1]; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  };
  const unload = (i: number) => { if (busy || !slots[i]) return; slots.splice(i, 1); o.cue?.('unload'); render(); };
  const speak = () => { if (busy || !slots.length) return; busy = true; readT = 0; o.cue?.('speak'); render(); };

  const press = (b: HTMLButtonElement | null) => {
    if (!b || b.disabled) return;
    if (b.dataset.w) load(b.dataset.w);
    else if (b.dataset.slot !== undefined) unload(+b.dataset.slot);
    else if (b === core) speak();
    else if (b === shut) api.close();
  };
  // touch acts on pointerup: the pieces move with the camera every frame, and a phone's synthesized
  // click can land on the world behind them; a mouse or keyboard uses the click
  let touched = 0;
  root.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') return; touched = performance.now(); e.stopPropagation(); press((e.target as HTMLElement).closest('button')); });
  root.addEventListener('pointerdown', e => e.stopPropagation());
  root.addEventListener('click', e => { if (performance.now() - touched < 600) return; press((e.target as HTMLElement).closest('button')); });
  const onKey = (e: KeyboardEvent) => {
    if (root.hidden) return;
    const k = +e.key; if (k >= 1 && k <= carried.length) { load(carried[k - 1]); e.preventDefault(); e.stopImmediatePropagation(); }
    else if (e.key === 'Backspace') { unload(slots.length - 1); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') { speak(); e.preventDefault(); e.stopImmediatePropagation(); return; }
    else if (e.key === 'Escape') { api.close(); e.preventDefault(); e.stopImmediatePropagation(); }
  };
  addEventListener('keydown', onKey, true);

  // layout: anchored at the ring's point in the world, laid out in screen pixels so it reads the
  // same at any distance and always fits a phone screen (pieces are clamped inside the view)
  let W = 1, H = 1, cx = 0, cy = 0, cz = 0;
  const put = (el: HTMLElement, x: number, y: number) => {
    const hw = el.offsetWidth / 2 + 6, hh = el.offsetHeight / 2 + 6;
    x = Math.max(hw, Math.min(W - hw, x)); y = Math.max(hh + 50, Math.min(H - hh - 8, y));
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    return [x, y];
  };
  const toWorld = (x: number, y: number) => new T.Vector3(x / W * 2 - 1, -(y / H) * 2 + 1, cz).unproject(o.camera);
  const api = {
    get isOpen() { return !root.hidden; },
    get busy() { return busy; },
    get slots() { return [...slots]; },
    /** open with the words carried and the size of the context; `start` puts a phrase back in the
     *  slots (e.g. the last one said here), so fixing a phrase means editing it, as in a chat box */
    open(words: string[], n: number, start: string[] = []) {
      carried = [...words]; N = n; slots = start.filter((w, i) => carried.includes(w) && start.indexOf(w) === i).slice(0, n); busy = false; readT = -1; build();
      root.hidden = false; holo.visible = true; cone.mesh.visible = true; t = 0; o.cue?.('open');
    },
    close() {
      if (root.hidden) return;
      root.hidden = true; holo.visible = false; cone.mesh.visible = false; for (const r of reads) o.scene.remove(r.mesh); reads = [];
      o.cue?.('close'); o.onClose?.();
    },
    tick(dt: number) {
      if (root.hidden) return;
      t += dt; shake = Math.max(0, shake - dt);
      const C = o.anchor();
      o.camera.getWorldDirection(fwd); right.crossVectors(fwd, o.camera.up).normalize(); up.crossVectors(right, fwd).normalize();
      holo.position.copy(C).addScaledVector(fwd, .05); holo.quaternion.copy(o.camera.quaternion);
      const open = Math.min(1, t / .25); holo.scale.setScalar(open);
      halo.rotation.z = t * .4;
      const r = o.host.getBoundingClientRect(); W = r.width; H = r.height;
      v.copy(C).project(o.camera); cz = v.z; cx = (v.x * .5 + .5) * W; cy = (-v.y * .5 + .5) * H;
      cy = Math.max(170, Math.min(H * .5, cy));   // room for the speak orb above and the words below
      const SPX = Math.min(104, (W - 40) / N), sx = Math.sin(shake * 40) * 8 * (shake > 0 ? 1 : 0), grow = open;
      const slotXY = slotEls.map((b, i) => put(b, cx + (i - (N - 1) / 2) * SPX * grow + sx, cy + 6 * ((i - (N - 1) / 2) ** 2)));
      put(count, cx, cy + 40);
      put(core, cx, cy - 92);
      put(shut, cx + Math.min(W / 2 - 30, (N - 1) / 2 * SPX + 64), cy - 84);
      // the words carried: rows below the ring, four to a row
      const ws = [...chipEls.values()], perRow = W < 520 ? 4 : 6;
      ws.forEach((b, i) => {
        const row = Math.floor(i / perRow), k = i % perRow, nRow = Math.min(perRow, ws.length - row * perRow);
        put(b, cx + (k - (nRow - 1) / 2) * Math.min(96, (W - 24) / nRow) * grow, cy + 96 + row * 54 + 8 * Math.abs(k - (nRow - 1) / 2));
      });
      const slotAt = (i: number) => toWorld(slotXY[i][0], slotXY[i][1]);
      holo.position.copy(toWorld(cx, cy));   // the light sits behind the pieces wherever they settle
      // the projection: chest to ring; a beam to each filled slot; when speaking, the read sweeps in order
      cone.set(o.source(), C, .05);
      while (reads.length < slots.length) { const b = beam({ color: HOLO.made, radius: .012, flow: true }); o.scene.add(b.mesh); reads.push(b); }
      while (reads.length > slots.length) o.scene.remove(reads.pop()!.mesh);
      reads.forEach((b, i) => { b.set(o.source(), slotAt(i), .012); b.mesh.visible = readT < 0 || readT * 2.2 > i; });
      if (readT >= 0) {
        readT += dt;
        slotEls.forEach((b, i) => b.classList.toggle('reading', readT * 2.2 > i && readT * 2.2 < i + 1.2));
        if (readT > slots.length / 2.2 + .35) { const said = [...slots]; readT = -1; o.onSpeak(said); api.close(); }
      }
    },
    dispose() { removeEventListener('keydown', onKey, true); api.close(); root.remove(); o.scene.remove(holo); o.scene.remove(cone.mesh); },
  };
  return api;
}
