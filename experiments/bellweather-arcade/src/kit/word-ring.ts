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
  /** speaking: the words in the slots, in order, and (working memory) the words that were pushed
   *  out by newer ones, oldest first: the engine heard them, then forgot them */
  onSpeak: (words: string[], forgotten: string[], how: { byEngine: boolean }) => void;
  onClose?: () => void;
  /** a line the ring says about itself, e.g. when full ("Full. My engine holds 3 words.") */
  say?: (text: string) => void;
  /** predictive mode (a next-word engine, kit/ngram.ts): the speaker picks only the first word;
   *  after that the chips are what the engine suggests next, likeliest first, with how often it
   *  has read each one (`ok`: it will say it; the rest it has read too rarely) */
  suggest?: (said: string[]) => { word: string; count: number; ok: boolean; grew?: number }[];
  /** predictive mode: "let it finish", the phrase the engine would make from these words */
  finish?: (said: string[]) => string[];
  /** predictive mode: a word was tapped that the engine won't say here */
  onRare?: (word: string, said: string[]) => void;
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
  // predictive mode: a line between the words it will say and the ones it has read too rarely
  const rareLine = document.createElement('div'); rareLine.className = 'wr-rare-line'; rareLine.textContent = 'too rare to say'; rareLine.hidden = true; root.appendChild(rareLine);
  const shut = document.createElement('button'); shut.className = 'wr-close'; shut.dataset.action = 'close-ring'; shut.setAttribute('aria-label', 'Step away'); shut.textContent = '×'; root.appendChild(shut);
  let N = 3, carried: string[] = [], slots: string[] = [], slotEls: HTMLButtonElement[] = [], chipEls = new Map<string, HTMLButtonElement>(), busy = false, t = 0, readT = -1, shake = 0;
  // working memory (open(..., { forget: true })): a full ring takes a new word by letting the oldest go
  let forget = false, forgotten: string[] = [], toldForget = false;
  const drops: { el: HTMLElement; t: number; x: number; y: number }[] = [];
  const v = new T.Vector3(), right = new T.Vector3(), up = new T.Vector3(), fwd = new T.Vector3();

  // the chips on offer: the words carried, or (predictive mode, after the first word) what the engine suggests next
  type Chip = { w: string; count?: number; ok: boolean; grew?: number; finish?: boolean };
  let offer: Chip[] = [], offerKey = '';
  const predictive = () => !!o.suggest && slots.length > 0;
  const offered = (): Chip[] => {
    if (!predictive()) return carried.map(w => ({ w, ok: true }));
    if (slots.length >= N) return [];
    const next = o.suggest!(slots).filter(s => !slots.includes(s.word)).map(s => ({ w: s.word, count: s.count, ok: s.ok, grew: s.grew }));
    return next.some(s => s.ok) && o.finish && o.finish([...slots]).length > slots.length ? [...next, { w: 'finish', ok: true, finish: true }] : next;   // offered only when it would add something
  };
  const chips = () => {
    const list = offered(), key = list.map(c => `${c.w}:${c.count ?? ''}:${c.ok}`).join('|');
    if (key === offerKey) return; offerKey = key; offer = list;
    for (const e of chipEls.values()) e.remove(); chipEls.clear();
    const max = Math.max(1, ...list.map(c => c.count ?? 0));
    list.forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'wr-chip';
      if (c.finish) { b.classList.add('wr-finish'); b.dataset.finish = '1'; b.dataset.action = 'finish'; b.innerHTML = `<kbd aria-hidden="true">${i + 1}</kbd>let it finish…`; }
      else if (c.count !== undefined) {
        b.classList.add('next'); b.classList.toggle('rare', !c.ok); b.dataset.w = c.w; b.dataset.action = 'say.' + c.w;
        // the bar: what it came knowing, then (gold) what it has read since
        const was = c.count - (c.grew ?? 0);
        b.innerHTML = `<kbd aria-hidden="true">${i + 1}</kbd>${c.w}<span class="wr-bar" aria-hidden="true"><i style="width:${Math.round(100 * was / max)}%"></i><b style="width:${Math.round(100 * (c.grew ?? 0) / max)}%"></b></span><small>×${c.count}${c.grew ? ` <em>+${c.grew}</em>` : ''}</small>`;
        if (!c.ok && list[i - 1]?.ok) b.classList.add('first-rare');
        b.setAttribute('aria-label', `${c.w}, read ${c.count} time${c.count === 1 ? '' : 's'} after “${slots[slots.length - 1]}”${c.ok ? '' : ', too rarely to say'}`);
      } else { b.dataset.w = c.w; b.dataset.action = 'say.' + c.w; b.innerHTML = `<kbd aria-hidden="true">${i + 1}</kbd>${c.w}`; }
      root.appendChild(b); chipEls.set(c.finish ? '\u0000finish' : c.w, b);
    });
  };
  const build = () => {
    for (const e of slotEls) e.remove(); for (const e of chipEls.values()) e.remove(); chipEls.clear(); offerKey = '\u0000';
    slotEls = Array.from({ length: N }, (_, i) => { const b = document.createElement('button'); b.className = 'wr-slot'; b.dataset.slot = String(i); root.appendChild(b); return b; });
    render();
  };
  const render = () => {
    chips();
    slotEls.forEach((b, i) => { const w = slots[i]; b.textContent = w ?? ''; b.classList.toggle('filled', !!w); b.dataset.action = w ? 'unsay.' + i : ''; b.setAttribute('aria-label', w ? `Take “${w}” out` : `Empty slot ${i + 1}`); b.disabled = busy || !w; });
    for (const [w, b] of chipEls) { const used = slots.includes(w); b.classList.toggle('used', used); b.disabled = busy || used; }
    const full = slots.length >= N, last = slots[slots.length - 1];
    count.textContent = full ? (forget ? `${N} / ${N} words · the next one pushes out “${slots[0]}”` : `${N} / ${N} words · full`)
      : o.suggest && !slots.length ? `0 / ${N} words · pick a first word`
      // a part-filled ring can be spoken: say so, rather than "2 / 3 words", which read as "not ready"
      // (run 16: "Speak looks disabled with fewer than three words")
      : predictive() && !offer.length ? `Ready to speak · nothing I’ve read comes after “${last}”`
      : predictive() ? `Ready to speak · or add what comes after “${last}”` : slots.length ? `${slots.length} of ${N} words · ready to speak` : `0 / ${N} words`;
    count.classList.toggle('full', full);
    slotEls.forEach((b, i) => b.classList.toggle('fading', forget && full && i === 0));   // the word that goes next, dimmer
    core.disabled = busy || !slots.length; core.classList.toggle('ready', !!slots.length && !busy);
  };
  const load = (w: string) => {
    if (busy || slots.includes(w)) return;
    if (predictive()) {   // the engine says only what it has read after the last word, and only its likeliest
      const c = offer.find(x => x.w === w && !x.finish);
      if (!c) return;
      if (!c.ok) { shake = .3; o.cue?.('full'); o.onRare?.(w, [...slots]); return; }
    }
    if (slots.length >= N && !forget) { shake = .45; count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump'); o.cue?.('full'); o.say?.(`Full. My engine holds ${N} words.`); return; }
    if (slots.length >= N) {   // working memory: the oldest word slips out of the ring and falls away
      const old = slots.shift()!, at = slotEls[0].getBoundingClientRect(), host = o.host.getBoundingClientRect();
      const el = document.createElement('div'); el.className = 'wr-forgot'; el.textContent = old; root.appendChild(el);
      drops.push({ el, t: 0, x: at.left - host.left + at.width / 2, y: at.top - host.top + at.height / 2 });
      forgotten = [...forgotten.filter(x => x !== old), old]; o.cue?.('full');
      if (!toldForget) { toldForget = true; o.say?.(`“${old}” slipped out. My memory holds ${N} words.`); }
    }
    forgotten = forgotten.filter(x => x !== w);   // said again: back in memory
    slots.push(w); if (slots.length > 1) picked = true; o.cue?.('load'); render(); const b = slotEls[slots.length - 1]; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  };
  // predictive mode: taking a word out takes out what the engine said after it too
  const unload = (i: number) => { if (busy || !slots[i]) return; if (o.suggest) slots.length = i; else slots.splice(i, 1); if (slots.length <= 1) picked = false; o.cue?.('unload'); render(); };
  // let it finish: the engine adds its likeliest words, one at a time, so it reads like it's thinking
  let finishing: string[] = [], finishT = 0;
  // whether any word after the first was picked by hand (predictive mode: else the engine finished it)
  let picked = false;
  const finish = () => { if (busy || !o.finish || finishing.length) return; finishing = o.finish([...slots]).slice(slots.length); finishT = 0; if (!finishing.length) o.cue?.('full'); };
  const speak = () => { if (busy || !slots.length) return; busy = true; readT = 0; o.cue?.('speak'); render(); };

  // the tap that opened the ring can arrive again as a click on whatever piece now sits under the
  // finger (a phone's synthesized click): ignore presses in the first moment after opening
  let openedAt = 0, locked = false, lockW = 0, lockH = 0;
  const press = (b: HTMLButtonElement | null) => {
    if (!b || b.disabled || performance.now() - openedAt < 450) return;
    if (b.dataset.finish) finish();
    else if (b.dataset.w) load(b.dataset.w);
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
    const k = +e.key; if (k >= 1 && k <= offer.length) { const c = offer[k - 1]; if (c.finish) finish(); else load(c.w); e.preventDefault(); e.stopImmediatePropagation(); }
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
    open(words: string[], n: number, start: string[] = [], opts: { forget?: boolean; keepStart?: boolean } = {}) {
      // keepStart: the start words stay even if the speaker doesn't carry them (words someone else left in the engine)
      carried = [...new Set(words)]; N = n; slots = start.filter((w, i) => (opts.keepStart || carried.includes(w)) && start.indexOf(w) === i).slice(-n); busy = false; readT = -1;
      forget = !!opts.forget; forgotten = []; finishing = []; picked = false; build();
      root.hidden = false; holo.visible = true; cone.mesh.visible = true; t = 0; openedAt = performance.now(); locked = false; o.cue?.('open');
    },
    close() {
      if (root.hidden) return;
      root.hidden = true; holo.visible = false; cone.mesh.visible = false; for (const r of reads) o.scene.remove(r.mesh); reads = [];
      for (const d of drops) d.el.remove(); drops.length = 0;
      o.cue?.('close'); o.onClose?.();
    },
    tick(dt: number) {
      if (root.hidden) return;
      t += dt; shake = Math.max(0, shake - dt);
      if (finishing.length) { finishT += dt; if (finishT > .38) { finishT = 0; const w = finishing.shift()!; if (slots.length < N && !slots.includes(w)) { slots.push(w); o.cue?.('load'); render(); const b = slotEls[slots.length - 1]; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } } }
      for (const d of [...drops]) {   // a forgotten word falls away and fades
        d.t += dt; d.el.style.transform = `translate(${(d.x - 14 * d.t).toFixed(1)}px, ${(d.y + 90 * d.t * d.t).toFixed(1)}px) translate(-50%, -50%) rotate(${(-20 * d.t).toFixed(1)}deg)`; d.el.style.opacity = String(Math.max(0, 1 - d.t / 1.2));
        if (d.t > 1.2) { d.el.remove(); drops.splice(drops.indexOf(d), 1); }
      }
      const C = o.anchor();
      o.camera.getWorldDirection(fwd); right.crossVectors(fwd, o.camera.up).normalize(); up.crossVectors(right, fwd).normalize();
      holo.position.copy(C).addScaledVector(fwd, .05); holo.quaternion.copy(o.camera.quaternion);
      const open = Math.min(1, t / .25); holo.scale.setScalar(open);
      halo.rotation.z = t * .4;
      const r = o.host.getBoundingClientRect(); W = r.width; H = r.height;
      v.copy(C).project(o.camera); cz = v.z;
      // the buttons hold still once the ring is open: following the anchor while the camera settled
      // slid the words under a finger ("tapped paper, got long", run 16). It re-anchors only if the
      // view moves a lot (over 80 px) or the screen changes size.
      const ax = (v.x * .5 + .5) * W, ay = Math.max(170, Math.min(H * .5, (-v.y * .5 + .5) * H));   // room for the speak orb above and the words below
      if (!locked || Math.hypot(ax - cx, ay - cy) > 80 || W !== lockW || H !== lockH) { cx = ax; cy = ay; locked = true; lockW = W; lockH = H; }
      const SPX = Math.min(104, (W - 40) / N), sx = Math.sin(shake * 40) * 8 * (shake > 0 ? 1 : 0), grow = open;
      const slotXY = slotEls.map((b, i) => put(b, cx + (i - (N - 1) / 2) * SPX * grow + sx, cy + 6 * ((i - (N - 1) / 2) ** 2)));
      put(count, cx, cy + 40);
      put(core, cx, cy - 92);
      put(shut, cx + Math.min(W / 2 - 30, (N - 1) / 2 * SPX + 64), cy - 84);
      // the words carried: rows below the ring, four to a row
      const ws = [...chipEls.values()], perRow = W < 520 ? 4 : 6;
      // predictive mode: the engine's suggestions in one column, likeliest at the top, like a ranking
      rareLine.hidden = true;
      // Words read equally often share a row: a tie is seen, not explained (run 16 read four words
      // above the line as "seen once means locked"; run 13 read a tie left out as an arbitrary cut)
      if (predictive()) {
        const rows: HTMLElement[][] = [];
        ws.forEach((b, i) => { const c = offer[i], p = offer[i - 1], last = rows[rows.length - 1];
          if (last && c && p && c.count !== undefined && c.count === p.count && c.ok === p.ok && last.length < 3) last.push(b); else rows.push([b]); });
        let gap = 0;
        rows.forEach((row, r) => {
          if (row[0].classList.contains('first-rare')) { gap = 22; rareLine.hidden = false; put(rareLine, cx, cy + 88 + (r * 46 + 1) * grow); }
          for (const b of row) b.classList.toggle('tied', row.length > 1);   // compact, side by side
          // the row stays whole on screen: shifted in from the edge as one, never squeezed into overlap
          const span = Math.min(row[0].offsetWidth + 6, (W - 24) / row.length), total = span * (row.length - 1) * grow;
          const x0 = Math.max(12 + row[0].offsetWidth / 2, Math.min(W - 12 - row[0].offsetWidth / 2 - total, cx - total / 2));
          row.forEach((b, k) => put(b, x0 + k * span * grow, cy + 88 + (r * 46 + gap) * grow));
        });
      }
      else ws.forEach((b, i) => {
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
        if (readT > slots.length / 2.2 + .35) { const said = [...slots], lost = [...forgotten]; readT = -1; o.onSpeak(said, lost, { byEngine: !!o.suggest && said.length > 1 && !picked }); api.close(); }
      }
    },
    dispose() { removeEventListener('keydown', onKey, true); api.close(); root.remove(); o.scene.remove(holo); o.scene.remove(cone.mesh); },
  };
  return api;
}
