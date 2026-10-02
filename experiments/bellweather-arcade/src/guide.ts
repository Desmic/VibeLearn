import * as T from 'three';
import { sfx } from './sfx';

// Player guidance shared by every beat and every future subject's game:
// one goal line, one beacon in the world (with an edge arrow when it is off
// screen), first-time control hints, one context button, and one card for
// short lines and choices. Rule of thumb: never more than one thing to read.

export type TapHandler = (ray: T.Raycaster) => boolean;
export interface Choice { label: string; act: () => void; kind?: 'primary' | 'quiet';
  /** a plain 'go on' (not a real choice): no button; the line advances with a tap anywhere, Space or Enter, like a top game's dialogue box */
  advance?: boolean }
export interface ChipOpt { words: string[]; selectable?: boolean; tones?: ('rail' | 'tray' | 'read' | 'empty')[] }

export function buildGuide(scene: T.Scene, host: HTMLElement, camera: T.Camera, canvas: HTMLElement) {
  // goal line
  const goal = document.createElement('div'); goal.className = 'goal-line'; goal.hidden = true; goal.setAttribute('aria-live', 'polite'); host.appendChild(goal);
  // beacon: a soft light column plus a floating marker
  const beacon = new T.Group(); beacon.visible = false; scene.add(beacon);
  const beam = new T.Mesh(new T.CylinderGeometry(.18, .32, 7, 16, 1, true), new T.MeshBasicMaterial({ color: '#ffe3a1', transparent: true, opacity: .28, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, fog: false }));
  beam.position.y = 3.5; beacon.add(beam);
  const gem = new T.Mesh(new T.OctahedronGeometry(.2), new T.MeshBasicMaterial({ color: '#ffd36b', fog: false })); gem.position.y = 2.4; beacon.add(gem);
  const edge = document.createElement('div'); edge.className = 'beacon-edge'; edge.hidden = true; edge.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" style="display:block;margin:8px"><path d="M5 3 L17 10 L5 17 L8 10 Z" fill="#1c4972"/></svg>';  // drawn, so it points the same way in every font host.appendChild(edge);
  // control hints
  const hint = document.createElement('div'); hint.className = 'control-hint'; hint.hidden = true; host.appendChild(hint);
  // context button
  const act = document.createElement('button'); act.className = 'context-act'; act.hidden = true; host.appendChild(act);
  // card
  const card = document.createElement('div'); card.className = 'story-card'; card.hidden = true; card.setAttribute('role', 'dialog'); host.appendChild(card);

  let looked = false, moved = false, hintT = 0, hintStage: 'off' | 'on' = 'off';
  let down: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointermove', e => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 30) looked = true; });
  canvas.addEventListener('pointerup', () => { down = null; });

  // taps on things in the world: a short press that did not turn the camera
  const taps: TapHandler[] = [], ray = new T.Raycaster(), ndc = new T.Vector2();
  let tapFrom: { x: number; y: number; t: number } | null = null;
  canvas.addEventListener('pointerdown', e => { tapFrom = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', e => {
    if (!tapFrom || Math.hypot(e.clientX - tapFrom.x, e.clientY - tapFrom.y) > 14 || performance.now() - tapFrom.t > 600) return;
    const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera as T.PerspectiveCamera);
    for (let i = taps.length - 1; i >= 0; i--) if (taps[i](ray)) break;
  });
  // The Stream: thoughts beneath words. Zip's float over his head; another
  // awake mind (the Warden) is heard at the top of the screen, in purple.
  // Thought bubbles never block play.
  // Queued, one at a time, and held while a card is open.
  const thought = document.createElement('div'); thought.className = 'thought'; thought.hidden = true; host.appendChild(thought);
  const thoughts: { text: string; who: 'zip' | 'warden' }[] = [], thoughtSeen = new Set<string>(); let thoughtWho: 'zip' | 'warden' = 'zip', thoughtT = 0, thoughtGap = 0, thinker: (() => T.Vector3) | null = null;
  // toasts and star results
  const toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.hidden = true; host.appendChild(toastEl);
  let toastTimer = 0;
  // floating labels pinned to world points (note text, "tap me" prompts)
  const labels = new Map<string, { el: HTMLDivElement; at: T.Vector3 }>();

  let actFn: (() => void) | null = null;
  act.addEventListener('click', e => { e.stopPropagation(); sfx.tap(); actFn?.(); });
  let cardOpen = false, beaconArrowOnly = false, advanceOff: (() => void) | null = null;
  const chipRow = (o: ChipOpt, picked: Set<number>, onToggle?: () => void) => {
    const row = document.createElement('div'); row.className = 'rail-chips';
    o.words.forEach((w, i) => {
      const tone = o.tones?.[i] ?? 'rail';
      const el = document.createElement(o.selectable && tone !== 'empty' ? 'button' : 'span');
      el.className = 'chip ' + tone + (picked.has(i) ? ' picked' : ''); el.textContent = w;
      if (o.selectable && tone !== 'empty') { el.setAttribute('aria-pressed', String(picked.has(i))); el.addEventListener('click', ev => { ev.stopPropagation(); picked.has(i) ? picked.delete(i) : picked.add(i); el.classList.toggle('picked'); el.setAttribute('aria-pressed', String(picked.has(i))); onToggle?.(); }); }
      row.appendChild(el);
    });
    return row;
  };

  const api = {
    get cardOpen() { return cardOpen; },
    setGoal(text: string | null) { goal.hidden = !text; goal.textContent = text ?? ''; },
    // arrowOnly: no light column (the target is its own marker, e.g. a wind ring)
    setBeacon(p: T.Vector3 | null, arrowOnly = false) { beacon.visible = !!p; beaconArrowOnly = arrowOnly; if (p) beacon.position.copy(p); },
    /** where the goal beacon is (null when none): the camera can glance at a new goal */
    get goalText() { return goal.hidden ? '' : goal.textContent ?? ''; },
    get beaconAt(): T.Vector3 | null { return beacon.visible ? beacon.position : null; },
    startControlHints() { hintStage = 'on'; hintT = 0; },
    setAction(label: string | null, fn?: () => void) { act.hidden = !label || cardOpen; act.textContent = label ?? ''; actFn = fn ?? null; },
    // One short line (speaker optional), optional chips, and 1-4 choices.
    say(text: string, choices: Choice[] = [], opts: { speaker?: string; chips?: ChipOpt; picked?: Set<number>; pictures?: boolean } = {}) {
      cardOpen = true; host.classList.add('card-open'); act.hidden = true; card.hidden = false; card.innerHTML = '';
      if (opts.chips) card.appendChild(chipRow(opts.chips, opts.picked ?? new Set()));
      const p = document.createElement('p');
      if (opts.speaker) { const b = document.createElement('b'); b.textContent = opts.speaker + ': '; p.appendChild(b); }
      p.appendChild(document.createTextNode(text)); card.appendChild(p);
      const row = document.createElement('div'); row.className = 'story-choices' + (opts.pictures ? ' pictures' : ''); card.appendChild(row);
      advanceOff?.(); advanceOff = null;
      if (choices.length === 1 && choices[0].advance) {
        // a line to read, not a decision: a small bobbing arrow, and the whole screen advances it
        const c = choices[0], opened = performance.now(); let done = false;
        const go = (e?: Event) => { if (done) return; if (e?.type === 'pointerup' && (performance.now() - opened < 280 || (e.target as Element)?.closest?.('button,input,label,.menu'))) return; /* a stray world tap from the moment the card opened doesn't skip it */ e?.stopPropagation(); done = true; advanceOff?.(); advanceOff = null; sfx.tap(); c.act(); };
        const b = document.createElement('button'); b.className = 'advance'; b.setAttribute('aria-label', c.label);
        b.innerHTML = `<span class="sr">${c.label}</span><span aria-hidden="true">▾</span>`; b.addEventListener('click', go); row.appendChild(b); row.classList.add('advance-row');
        const onKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go(e); } };
        host.addEventListener('pointerup', go); window.addEventListener('keydown', onKey);
        advanceOff = () => { host.removeEventListener('pointerup', go); window.removeEventListener('keydown', onKey); };
        b.focus({ preventScroll: true });
        return;
      }
      for (const c of choices) { const b = document.createElement('button'); b.textContent = c.label; if (c.kind) b.className = c.kind; b.addEventListener('click', e => { e.stopPropagation(); sfx.tap(); c.act(); }); row.appendChild(b); }
      if (choices[0]) (row.firstChild as HTMLButtonElement).focus({ preventScroll: true });
    },
    setThinker(fn: () => T.Vector3) { thinker = fn; },
    think(text: string | string[], who: 'zip' | 'warden' = 'zip') { for (const x of Array.isArray(text) ? text : [text]) thoughts.push({ text: x, who }); },
    thinkOnce(id: string, text: string | string[], who: 'zip' | 'warden' = 'zip') { if (thoughtSeen.has(id)) return false; thoughtSeen.add(id); api.think(text, who); return true; },
    get thinking() { return thoughtT > 0 || thoughts.length > 0; },
    onTap(fn: TapHandler) { taps.push(fn); return () => { const i = taps.indexOf(fn); if (i >= 0) taps.splice(i, 1); }; },
    toast(text: string, ms = 1800) { toastEl.textContent = text; toastEl.hidden = false; toastEl.classList.remove('stars'); clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { toastEl.hidden = true; }, ms); },
    // 1-3 stars with the reason for each one earned or missed
    stars(title: string, rows: [boolean, string][], then?: () => void) {
      const n = rows.filter(r => r[0]).length;
      cardOpen = true; host.classList.add('card-open'); act.hidden = true; card.hidden = false; card.innerHTML = '';
      const h = document.createElement('div'); h.className = 'star-row'; card.appendChild(h);
      rows.forEach((r, i) => { const s = document.createElement('span'); s.textContent = '★'; s.className = r[0] ? 'on' : ''; s.style.animationDelay = `${i * .25}s`; h.appendChild(s); if (r[0]) setTimeout(() => sfx.star(i), 250 * i + 120); });
      const p = document.createElement('p'); p.className = 'star-title'; p.textContent = title; card.appendChild(p);
      const ul = document.createElement('ul'); ul.className = 'star-list';
      for (const [ok, why] of rows) { const li = document.createElement('li'); li.textContent = (ok ? '★ ' : '☆ ') + why; li.className = ok ? 'on' : ''; ul.appendChild(li); }
      card.appendChild(ul);
      const row = document.createElement('div'); row.className = 'story-choices'; card.appendChild(row);
      const b = document.createElement('button'); b.className = 'primary'; b.textContent = n === 3 ? 'Brilliant!' : 'Continue'; b.addEventListener('click', e => { e.stopPropagation(); sfx.tap(); api.close(); then?.(); }); row.appendChild(b);
    },
    label(id: string, text: string | null, at?: T.Vector3) {
      let l = labels.get(id);
      if (!text) { if (l) { l.el.remove(); labels.delete(id); } return; }
      if (!l) { const el = document.createElement('div'); el.className = 'world-label'; host.appendChild(el); l = { el, at: new T.Vector3() }; labels.set(id, l); }
      if (l.el.textContent !== text) l.el.textContent = text; if (at) l.at.copy(at);
    },
    close() { advanceOff?.(); advanceOff = null; cardOpen = false; host.classList.remove('card-open'); card.hidden = true; if (actFn && act.textContent) act.hidden = false; },
    tick(dt: number, zipSpeed: number, t: number) {
      if (zipSpeed > .2) moved = true;
      // hints: walking first, then looking; each goes once done, all after 30 s
      if (hintStage !== 'off') { hintT += dt; if ((looked && moved) || hintT > 14) hintStage = 'off'; }
      hint.hidden = hintStage === 'off' || cardOpen;
      hint.textContent = !moved ? 'Use the arrows, or tap the ground, to walk' : 'Drag the screen to look around';
      // beacon pulse and the edge arrow when the target is off screen
      gem.rotation.y += dt * 2; gem.position.y = 2.4 + Math.sin(t * 2.4) * .12;
      // close up, the column would fill the screen: fade it and keep the gem small
      const near = T.MathUtils.smoothstep(Math.hypot(camera.position.x - beacon.position.x, camera.position.z - beacon.position.z), 4.5, 10);
      (beam.material as T.MeshBasicMaterial).opacity = (.2 + .1 * Math.sin(t * 2)) * near; beam.visible = near > .02 && !beaconArrowOnly; gem.visible = !beaconArrowOnly; gem.scale.setScalar(.6 + .4 * near);
      if (beacon.visible) {
        const v = beacon.position.clone(); if (!beaconArrowOnly) v.y = 1.2; v.project(camera);
        const off = v.z > 1 || Math.abs(v.x) > .92 || Math.abs(v.y) > .9;
        edge.hidden = !off || cardOpen;
        if (off) {
          // direction in the camera's own space: steady even when the target swings behind
          // (behind = the arrow points down, toward "turn around", on the target's side)
          const tv = beacon.position.clone(); if (!beaconArrowOnly) tv.y = 1.2; tv.applyMatrix4(camera.matrixWorldInverse);
          let x = tv.x, y = tv.y; if (tv.z > -.5) y = Math.min(y, 0) - (tv.z + .5) - Math.abs(x) * .2;
          const a = Math.atan2(y, x), r = .86, ex = Math.cos(a) * r, ey = Math.sin(a) * r;
          edge.style.left = `${(ex * .5 + .5) * 100}%`; edge.style.top = `${(-ey * .5 + .5) * 100}%`;
          edge.style.transform = `translate(-50%,-50%) rotate(${-a}rad)`;
        }
      } else edge.hidden = true;
      // thought bubble
      if (thoughtT > 0) { if (!cardOpen) thoughtT -= dt; if (thoughtT <= 0) { thought.hidden = true; thoughtGap = .35; } }
      else { thoughtGap -= dt; if (thoughts.length && !cardOpen && thoughtGap <= 0 && thinker && (thoughts[0].who === 'warden' || !host.matches('.engine-mode,.cutscene'))) { const s = thoughts.shift()!; thoughtWho = s.who; thought.className = 'thought' + (s.who === 'warden' ? ' warden' : ''); thought.textContent = s.text; thoughtT = 2.4 + s.text.length * .05; if (s.who === 'warden') sfx.whisper(); else sfx.hmm(); } }
      if (thoughtT > 0 && thinker) {
        const v = thinker().clone(); v.y += 1.9; v.project(camera); const onScreen = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
        thought.hidden = cardOpen;
        if (!onScreen || thoughtWho === 'warden') thought.style.transform = `translate(${host.clientWidth / 2}px, ${Math.max(thoughtWho === 'warden' ? 190 : 150, 120 + thought.offsetHeight)}px) translate(-50%, -100%)`; // Zip off screen: think at the top
        else { const x = T.MathUtils.clamp((v.x * .5 + .5) * host.clientWidth, 120, host.clientWidth - 120), y = Math.max(120 + thought.offsetHeight, (-v.y * .5 + .5) * host.clientHeight); thought.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`; }
      }
      for (const l of labels.values()) {
        const v = l.at.clone().project(camera), vis = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
        l.el.hidden = !vis;
        if (vis) { const hw = l.el.offsetWidth / 2 + 8; l.el.style.transform = `translate(${T.MathUtils.clamp((v.x * .5 + .5) * host.clientWidth, hw, host.clientWidth - hw)}px, ${Math.max(120 + l.el.offsetHeight, (-v.y * .5 + .5) * host.clientHeight)}px) translate(-50%, -100%)`; }  // kept on screen, below the goal line
      }
    },
  };
  return api;
}
export type Guide = ReturnType<typeof buildGuide>;
