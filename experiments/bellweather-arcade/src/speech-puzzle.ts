import * as T from 'three';
import type { Guide } from './guide';
import { sfx } from './sfx';
import { loadProp } from './kit/kit';
import { lambertize } from './painted';
import { createStation, type LearningEvent } from './kit/station';
import { station, rulesFor } from './worlds/first-words-stations';
export type { LearningEvent };

// Speech 1: wake the skiff (tutorial, outcome `sequence`). A catch game.
// The broken core makes ONE word at a time and spits it out as a glowing
// stone; you catch it and it joins the sentence rail. Then the real question,
// asked with your hands: which stones do you feed the core so it can make the
// next word? Feed it only the newest word and it proudly says "the sea", and
// the skiff zooms off without you. Nothing here can be failed; wrong feeds are
// the funny part. First feeds are recorded apart from later ones, and
// finishing is not recorded as mastery (rules from app/first_words.py).

interface Opts { guide: Guide; host: HTMLElement; solid: (x: number, z: number, r: number) => void; onEvent?: (e: LearningEvent) => void; aspect: () => number }

const COMMAND = ['Skiff', 'rise', 'toward', 'Blossom', 'Isle'];
export const PILOT_STONE = new T.Vector3(2.4, .13, -11.25);          // at the outlook
export const SKIFF_AT = new T.Vector3(2.6, 3.6, -15.2);               // moored in the air past the balustrade
const SLOT = .42, RAIL_Y = 1.5, RAIL_Z = -10.95, RAIL_X0 = PILOT_STONE.x - 2 * SLOT;
const CORE = new T.Vector3(PILOT_STONE.x, 2.3, -11.05);
const HELD = new T.Vector3(PILOT_STONE.x - .95, 2.25, -10.85);

type Tone = 'plain' | 'read' | 'new';
function wordTexture(text: string, tone: Tone) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 112; const g = c.getContext('2d')!;
  g.fillStyle = { plain: '#f4ead2', read: '#9fe0d0', new: '#ffd98a' }[tone]; g.fillRect(0, 0, 256, 112);
  g.strokeStyle = '#1c4972'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 102);
  g.fillStyle = '#16324f'; g.font = `700 ${text.length > 6 ? 46 : 54}px Trebuchet MS, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 60);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
}

interface Stone {
  text: string; obj: T.Group; face: T.MeshBasicMaterial; hit: T.Mesh; vel: T.Vector3; g: number;
  mode: 'held' | 'fly' | 'fall' | 'slot' | 'gone'; target: T.Vector3; slot: number; picked: boolean; tone: Tone; onArrive?: () => void;
}

export function buildSkiffPuzzle(scene: T.Scene, opts: Opts) {
  const g = opts.guide;
  const root = new T.Group(); root.name = 'speech-puzzle'; scene.add(root);
  const std = (color: string, emissive = '#000000', e = 0) => new T.MeshLambertMaterial({ color, emissive, emissiveIntensity: e });
  const glowMat = std('#b8f2e6', '#6fe0c9', .2);
  const stoneMesh = new T.Mesh(new T.CylinderGeometry(.34, .44, 1.0, 8), std('#8d9bb0')); stoneMesh.position.copy(PILOT_STONE).setY(.63); root.add(stoneMesh);
  const eye = new T.Mesh(new T.SphereGeometry(.16, 16, 12), glowMat); eye.position.copy(PILOT_STONE).setY(1.24); root.add(eye);
  opts.solid(PILOT_STONE.x, PILOT_STONE.z, .5);
  // the rail and the core appear only while in use, so the outlook stays clear
  const railG = new T.Group(); railG.visible = false; root.add(railG);
  const bar = new T.Mesh(new T.BoxGeometry(5 * SLOT + .1, .05, .05), std('#1c4972')); bar.position.set(PILOT_STONE.x, RAIL_Y - .13, RAIL_Z - .03); railG.add(bar);
  const runes = COMMAND.map((_, i) => { const m = new T.Mesh(new T.CircleGeometry(.05, 16), new T.MeshBasicMaterial({ color: '#35577a' })); m.position.set(RAIL_X0 + i * SLOT, RAIL_Y - .2, RAIL_Z); railG.add(m); return m; });
  const core = new T.Mesh(new T.TorusGeometry(.22, .05, 10, 28), glowMat); core.position.copy(CORE); railG.add(core);
  const coreHeart = new T.Mesh(new T.SphereGeometry(.1, 14, 10), new T.MeshBasicMaterial({ color: '#dffaf2' })); coreHeart.position.copy(CORE); railG.add(coreHeart);
  const coreHit = new T.Mesh(new T.SphereGeometry(.42, 8, 6), new T.MeshBasicMaterial({ visible: false })); coreHit.position.copy(CORE); railG.add(coreHit);
  const loop = new T.Mesh(new T.TorusGeometry(1, .02, 6, 40, Math.PI), new T.MeshBasicMaterial({ color: '#9fe0d0' })); loop.position.set(PILOT_STONE.x, (RAIL_Y + CORE.y) / 2, RAIL_Z - .02); loop.scale.set(.42, 1.05, 1); loop.visible = false; railG.add(loop);
  const slotPos = (i: number) => new T.Vector3(RAIL_X0 + i * SLOT, RAIL_Y, RAIL_Z);
  // skiff: hull, mast, sail, festival lantern (hidden until Mira and Zip hang it)
  const skiff = new T.Group(); skiff.name = 'skiff'; skiff.position.copy(SKIFF_AT); root.add(skiff);
  const hull = new T.Mesh(new T.CapsuleGeometry(.42, 1.6, 6, 12), std('#b07a4f')); hull.rotation.z = Math.PI / 2; hull.scale.set(1, 1, .75); skiff.add(hull);
  const mast = new T.Mesh(new T.CylinderGeometry(.035, .045, 1.7, 8), std('#f3ead6')); mast.position.y = .9; skiff.add(mast);
  const sailMat = new T.MeshLambertMaterial({ color: '#f3ead6', emissive: '#9fe0d0', emissiveIntensity: 0, side: T.DoubleSide });
  const sail = new T.Mesh(new T.PlaneGeometry(.9, 1.1), sailMat); sail.position.set(.48, 1.1, 0); skiff.add(sail);
  const lanternMat = std('#ffcf7a', '#ffb347', .9);
  // the lantern hangs from a pivot at its hook, so it can swing (the authored paper lantern,
  // authoring/props/build_festival_props.py, replaces the ball when it loads)
  const lantern = new T.Group(); lantern.position.set(-1.05, .64, 0); lantern.visible = false; skiff.add(lantern);
  const lanternBall = new T.Mesh(new T.SphereGeometry(.14, 12, 10), lanternMat); lanternBall.position.y = -.14; lantern.add(lanternBall);
  const paperMat = new T.MeshLambertMaterial({ vertexColors: true, emissive: '#ff8a3a', emissiveIntensity: .5 });
  let swing = 0, swingV = 0, hungAt = -1;
  loadProp('festival-lantern').then(model => {
    lambertize(model);
    model.traverse(o => { const m = o as T.Mesh; if (m.isMesh && /^Paper/.test(m.name)) m.material = paperMat; });
    lanternBall.visible = false; model.scale.setScalar(1.1); lantern.add(model);
  }).catch(e => console.warn('[prop] lantern unavailable; keeping the ball', e));
  // the authored skiff (authoring/props/build_skiff.py) replaces the capsule stand-in when it loads
  const skiffGlow = new T.MeshLambertMaterial({ color: "#8ff0da", emissive: '#6fe0c9', emissiveIntensity: .25 });
  loadProp('skiff').then(model => {
    lambertize(model);
    model.traverse(o => {
      const m = o as T.Mesh; if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true;
      if (m.name === 'Sail') { sailMat.vertexColors = true; sailMat.color.set('#ffffff'); sailMat.needsUpdate = true; m.material = sailMat; }
      else if (/^(Core|FinGlow)/.test(m.name)) m.material = skiffGlow;
    });
    const mount = model.getObjectByName('LanternMount'); if (mount) lantern.position.copy(mount.position);
    hull.visible = mast.visible = sail.visible = false; skiff.add(model);
  }).catch(e => console.warn('[prop] skiff unavailable; keeping the stand-in', e));
  // splash droplets for the funny detours
  const drops = Array.from({ length: 16 }, () => { const m = new T.Mesh(new T.SphereGeometry(.07, 6, 4), new T.MeshBasicMaterial({ color: '#8fd3ff' })); m.visible = false; root.add(m); return { m, v: new T.Vector3(), life: 0 }; });
  const splash = (at: T.Vector3, color: string) => { for (const d of drops) { d.m.position.copy(at); (d.m.material as T.MeshBasicMaterial).color.set(color); d.v.set((Math.random() - .5) * 3, 2 + Math.random() * 2.5, (Math.random() - .5) * 3); d.life = 1.3; d.m.visible = true; } };

  // HUD: the sentence strip mirrors the rail (readable on any phone) and a
  // one-line prompt says what to do with your hands right now.
  const strip = document.createElement('div'); strip.className = 'sentence-strip'; strip.hidden = true; opts.host.appendChild(strip);
  const prompt = document.createElement('div'); prompt.className = 'hud-prompt'; prompt.hidden = true; opts.host.appendChild(prompt);
  const say = (html: string) => { prompt.innerHTML = html; prompt.hidden = false; };

  const stones: Stone[] = [];
  const rail = () => stones.filter(s => s.slot >= 0 && s.mode !== 'gone').sort((a, b) => a.slot - b.slot);
  const makeStone = (text: string, at: T.Vector3, tone: Tone = 'new') => {
    const obj = new T.Group(); obj.position.copy(at);
    const face = new T.MeshBasicMaterial({ map: wordTexture(text, tone) });
    const side = new T.MeshBasicMaterial({ color: '#1c4972' });
    obj.add(new T.Mesh(new T.BoxGeometry(.38, .17, .05), [side, side, side, side, face, side]));
    const hit = new T.Mesh(new T.PlaneGeometry(.9, .7), new T.MeshBasicMaterial({ visible: false })); obj.add(hit);
    railG.add(obj);
    const s: Stone = { text, obj, face, hit, vel: new T.Vector3(), g: 2.1, mode: 'held', target: at.clone(), slot: -1, picked: false, tone };
    hit.userData.stone = s; stones.push(s); return s;
  };
  const tone = (s: Stone, t: Tone) => { if (s.tone === t) return; s.tone = t; s.face.map?.dispose(); s.face.map = wordTexture(s.text, t); s.face.needsUpdate = true; };
  const fly = (s: Stone, to: T.Vector3, then?: () => void) => { s.mode = 'fly'; s.target.copy(to); s.onArrive = then; };
  const launch = (s: Stone, fast: boolean) => { s.obj.position.copy(CORE); s.mode = 'fall'; s.g = Math.max(.7, (fast ? 2.4 : 1.8) - misses * .45); s.vel.set((Math.random() < .5 ? -1 : 1) * (.25 + Math.random() * .2), 2.1, .25); sfx.pop(); };
  const renderStrip = () => {
    strip.innerHTML = ''; const r = rail();
    for (let i = 0; i < COMMAND.length; i++) {
      const s = r.find(x => x.slot === i), el = document.createElement('span');
      el.className = s ? (s.picked || s.tone === 'read' ? 'read' : '') : 'empty'; el.textContent = s ? s.text : '·';
      if (s && mode === 'feed') { el.style.cursor = 'pointer'; el.addEventListener('click', e => { e.stopPropagation(); toggle(s); }); }
      strip.appendChild(el);
    }
  };

  // tiny scheduler on game time (pauses with the game)
  const timers: { at: number; fn: () => void }[] = [];
  const later = (sec: number, fn: () => void) => timers.push({ at: t + sec, fn });

  let t = 0, active = false, done = false, mode: 'idle' | 'place' | 'catch' | 'feed' | 'busy' = 'idle';
  let misses = 0, lift = 0, liftTo = 0, pulse = 0, react = '', reactT = 0, wake = 0, onDone: (() => void) | null = null, untap: (() => void) | null = null;
  // the station: its decisions are logged as learning evidence, its stars come from data
  // (the rules in worlds/first-words-rules.ts judge the feed; this file only renders and sends actions)
  const stSpec = station('wake-skiff');
  const st = createStation(stSpec, { onEvent: opts.onEvent, stars: (title, rows, then) => g.stars(title, rows, then) }, rulesFor(stSpec));
  const addLift = () => { liftTo += .14; const r = runes[rail().length - 1]; if (r) (r.material as T.MeshBasicMaterial).color.set('#9fe0d0'); };

  // the core thinks, then spits a stone that arcs up and falls: catch it
  const spit = (word: string, then: () => void, fast = false) => {
    mode = 'busy'; pulse = .9; sfx.hum(1);
    later(.9, () => { const s = makeStone(word, CORE); s.onArrive = then; launch(s, fast); mode = 'catch'; say('Catch the new word! <b>Tap it.</b>'); });
  };
  const caught = (s: Stone) => {
    st.act('catch'); sfx.catch(); g.toast(['Caught!', 'Nice catch!', 'Great!'][rail().length % 3], 900);
    const i = rail().length; s.slot = i; tone(s, 'plain'); mode = 'busy'; prompt.hidden = true;
    const next = s.onArrive; fly(s, slotPos(i), () => { sfx.place(); addLift(); renderStrip(); later(.45, () => next?.()); });
  };
  const toggle = (s: Stone) => {
    if (mode !== 'feed' || !st.act('pick.' + s.slot).ok) return; s.picked = !!st.state['pick' + s.slot]; tone(s, s.picked ? 'read' : 'plain'); sfx.tap(); renderStrip();
    g.setAction(rail().some(x => x.picked) ? 'Feed the core' : null, feed);
  };
  const askFeed = (again = false) => {
    mode = 'feed'; rail().forEach(s => { s.picked = false; tone(s, 'plain'); }); renderStrip(); g.setAction(null);
    say(again ? 'Try again: which words should the core read? <b>Tap them</b>, then <b>tap the core</b>.' : 'To make the next word, the core reads words. <b>Tap the words</b> it should read, then <b>tap the core</b>.');
  };
  const feed = () => {
    if (mode !== 'feed') return;
    const sel = rail().filter(s => s.picked);
    const res = st.act('feed'); if (!res.ok) return;
    if (res.events.includes('nothing-picked')) { g.toast('Tap a word first', 1200); sfx.boing(); return; }
    g.setAction(null); mode = 'busy'; prompt.hidden = true;
    const verdict = res.judged[0], all = !!verdict?.correct, kind = verdict?.choice ?? 'partial';
    // the chosen stones hop into the core and back
    sel.forEach((s, i) => later(i * .12, () => { sfx.tap(); fly(s, CORE.clone().add(new T.Vector3(0, -.05, .1)), () => { fly(s, slotPos(s.slot)); }); }));
    later(.9, () => {
      if (all) { spit('Blossom', () => loopRuns(), true); return; }
      const out = kind === 'newest-only' ? 'the sea' : kind === 'first-only' ? 'sink' : 'um';
      pulse = .9; sfx.hum(1);
      later(.9, () => {
        const w = makeStone(out, CORE); sfx.pop();
        fly(w, skiff.position.clone(), () => { w.mode = 'gone'; w.obj.visible = false; react = kind; reactT = 0; if (kind === 'newest-only') sfx.whoosh(); else sfx.boing(); g.thinkOnce('feed-' + kind, kind === 'newest-only' ? 'In my defense, it only read one word.' : kind === 'first-only' ? 'Sinking is not flying. Noted.' : 'Um, indeed.'); });
        const heard = sel.map(s => s.text).join(' ');
        say(kind === 'newest-only' ? 'It only read “toward”… so it said <b>“the sea”</b>!' : kind === 'first-only' ? 'It only read “Skiff”… so it said <b>“sink”</b>!' : `It read “${heard}”, a word missing… so it said <b>“um”</b>.`);
        later(3.8, () => askFeed(true));
      });
    });
  };
  const loopRuns = () => {
    mode = 'busy'; loop.visible = true; rail().forEach(s => tone(s, 'read')); renderStrip();
    say('You\'ve got it! Now the loop feeds it <b>by itself</b>…'); sfx.hum(1.5);
    later(1.2, () => { pulse = .9; later(.9, () => { const s = makeStone('Isle', CORE); s.slot = 4; tone(s, 'read'); sfx.pop(); fly(s, slotPos(4), () => { sfx.place(); addLift(); renderStrip(); wakeUp(); }); }); });
  };
  const wakeUp = () => {
    done = true; wake = .001; liftTo += .6; sfx.chime(); prompt.hidden = true; g.toast('The skiff wakes up!', 1500);
    st.act('loop-done');
    later(1.8, () => st.finish(() => {
      if (st.earned().every(([got]) => got)) g.thinkOnce('genius', 'Three stars? I\'m basically a genius toaster.');
      const board = { label: 'Board the skiff', kind: 'primary' as const, act: () => { end(); onDone?.(); } };
      g.say('“Skiff, rise toward Blossom Isle.” It listened!', [board,
        { label: 'How real AI differs', kind: 'quiet', act: () => g.say('Real models use word pieces called tokens, learned from huge amounts of text. The loop is the same: each new piece joins the input. Whether anything like a Stream sits behind the words is still an open question.', [board]) },
      ]);
    }));
  };
  const end = () => { active = false; railG.visible = false; strip.hidden = true; prompt.hidden = true; untap?.(); untap = null; opts.host.classList.remove('puzzle-mode'); g.close(); g.setAction(null); };
  const begin = () => {
    active = true; railG.visible = true; strip.hidden = false; opts.host.classList.add('puzzle-mode'); mode = 'place';
    makeStone('Skiff', HELD, 'new');
    renderStrip(); say('The skiff obeys spoken words. <b>Tap “Skiff”</b> to start the sentence.');
    untap = g.onTap(ray => {
      if (mode === 'feed' && ray.intersectObject(coreHit, false).length) { feed(); return true; }
      const hits = ray.intersectObjects(stones.filter(s => s.mode !== 'gone').map(s => s.hit), false);
      const s = hits[0]?.object.userData.stone as Stone | undefined; if (!s) return false;
      return tapStone(s);
    });
  };
  const tapStone = (s: Stone) => {
      if (mode === 'place' && s.mode === 'held') { st.act('place'); mode = 'busy'; prompt.hidden = true; sfx.catch(); s.slot = 0; tone(s, 'plain'); fly(s, slotPos(0), () => { sfx.place(); addLift(); renderStrip(); later(.5, () => spit('rise', () => spit('toward', () => askFeed()))); }); return true; }
      if (mode === 'catch' && s.mode === 'fall') { caught(s); return true; }
      if (mode === 'feed' && s.mode === 'slot') { toggle(s); return true; }
      return false;
  };

  const shotPos = new T.Vector3(2.4, 2.0, -6.9), shotLook = new T.Vector3(2.4, 1.95, -11.8);
  return {
    stone: PILOT_STONE, skiff,
    get active() { return active; },
    get done() { return done; },
    /** hang the lantern; `fresh` plays the moment (it pops in and swings) */
    /** a gust of wind (the Warden's ship passing): the lantern swings */
    gust(k = 1) { swingV += (Math.random() < .5 ? -1 : 1) * 2.2 * k; },
    showLantern(fresh = false) { if (!lantern.visible && fresh) { hungAt = t; swingV = 2.4; } lantern.visible = true; },
    start(finished: () => void) { onDone = finished; begin(); },
    get shot() { return active ? { pos: shotPos, look: shotLook } : null; },
    // for automated checks: where a stone is, so a test can tap it
    debugStones: () => stones.filter(s => s.mode !== 'gone').map(s => ({ text: s.text, mode: s.mode, pos: s.obj.getWorldPosition(new T.Vector3()).toArray() })),
    debugCore: () => CORE.toArray(),
    debugTap: (text: string) => { const s = stones.find(x => x.text === text && x.mode !== 'gone'); return s ? tapStone(s) : false; },
    debugFeed: () => feed(),
    // hand the skiff to the flight
    release() { root.remove(skiff); return skiff; },
    /** where the skiff is right now (spoken words fly here) */
    at: (v = new T.Vector3()) => skiff.getWorldPosition(v).add(new T.Vector3(0, .6, 0)),
    /** the skiff obeys what it hears (the Echo & Engine mechanics drive it from outside) */
    hear(kind: 'wobble' | 'sink' | 'lift' | 'petals' | 'stall' | 'wake') {
      if (kind === 'lift') { liftTo += .22; pulse = .6; return; }
      if (kind === 'wake') { done = true; wake = .001; liftTo += .6; sfx.chime(); return; }
      if (kind === 'sink') { react = 'first-only'; reactT = 0; sfx.boing(); return; }
      if (kind === 'petals') { react = 'wobble'; reactT = 0; splash(skiff.position.clone().setY(skiff.position.y + .6), '#f6a9c0'); sfx.pop(); return; }
      if (kind === 'stall') { react = 'wobble'; reactT = 1.6; liftTo += .04; sfx.hum(.6); return; }
      react = 'wobble'; reactT = 0; sfx.boing();
    },
    tick(dt: number) {
      t += dt;
      for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= t) { const f = timers[i].fn; timers.splice(i, 1); f(); }
      for (const s of stones) {
        if (s.mode === 'fall') {
          s.vel.y -= s.g * dt; s.obj.position.addScaledVector(s.vel, dt); s.obj.rotation.z = Math.sin(t * 6) * .15;
          if (s.obj.position.y < .5) { st.act('drop'); misses++; sfx.boing(); g.toast('Oops! It bounces back…', 1100); g.thinkOnce('butter', 'Butterfingers. I don\'t even have fingers.'); s.obj.rotation.z = 0; const again = s.onArrive; fly(s, CORE, () => { s.onArrive = again; launch(s, false); }); }
        } else if (s.mode === 'fly') {
          s.obj.position.lerp(s.target, Math.min(1, dt * 9)); s.obj.rotation.z *= .8;
          if (s.obj.position.distanceTo(s.target) < .03) { s.obj.position.copy(s.target); s.mode = s.slot >= 0 ? 'slot' : 'held'; const f = s.onArrive; s.onArrive = undefined; f?.(); }
        } else if (s.mode === 'slot') { const want = slotPos(s.slot); if (s.picked) want.y += .1; s.obj.position.lerp(want, Math.min(1, dt * 10)); }
        else if (s.mode === 'held') { s.obj.position.y = HELD.y + Math.sin(t * 3) * .05; s.obj.rotation.y = Math.sin(t * 1.5) * .25; }
      }
      for (const d of drops) if (d.life > 0) { d.life -= dt; d.v.y -= 6 * dt; d.m.position.addScaledVector(d.v, dt); if (d.life <= 0) d.m.visible = false; }
      pulse = Math.max(0, pulse - dt);
      const feedGlow = mode === 'feed' && rail().some(s => s.picked) ? .6 + .4 * Math.sin(t * 8) : 0;
      glowMat.emissiveIntensity = .2 + (pulse > 0 ? .8 * Math.abs(Math.sin(t * 9)) : 0) + feedGlow + (done ? .6 : 0);
      core.rotation.z += dt * (pulse > 0 ? 7 : .5); core.scale.setScalar(1 + (pulse > 0 ? .12 * Math.sin(t * 14) : 0) + feedGlow * .12);
      eye.scale.setScalar(1 + (pulse > 0 ? .15 * Math.sin(t * 12) : 0));
      lift += (liftTo - lift) * Math.min(1, dt * 2);
      // skiff: bob, the funny detours, and waking
      let ox = 0, oy = 0, oz = 0, ry = 0, rz = Math.sin(t * 1.1) * .03;
      if (react) {
        reactT += dt; const u = Math.sin(Math.min(reactT / 3.2, 1) * Math.PI);
        if (react === 'newest-only') { ox = u * 7; oy = -u * 1.4; oz = -u * 6; ry = u * 1.3; if (reactT > 1.5 && reactT - dt <= 1.5) splash(skiff.position, '#8fd3ff'); }
        else if (react === 'first-only') { oy = -u * 2.6; rz += u * .5; if (reactT > 1.6 && reactT - dt <= 1.6) splash(skiff.position.clone().setY(skiff.position.y + .4), '#bfe8ff'); }
        else { oy = Math.abs(Math.sin(reactT * 9)) * .35 * (1 - reactT / 3.2); rz += Math.sin(reactT * 22) * .2 * (1 - reactT / 3.2); }
        if (reactT > 3.2) react = '';
      }
      if (wake > 0) wake = Math.min(1, wake + dt * .5);
      if (skiff.parent === root) { skiff.position.set(SKIFF_AT.x + ox, SKIFF_AT.y + Math.sin(t * 1.3) * .06 + lift + oy, SKIFF_AT.z + oz); skiff.rotation.set(0, ry, rz); }
      sailMat.emissiveIntensity = wake * .5; skiffGlow.emissiveIntensity = .25 + wake * 1.4; lanternMat.emissiveIntensity = .9 + wake * .8 + (wake > 0 ? .3 * Math.sin(t * 4) : 0);
      // the lantern swings on its hook: a damped pendulum, nudged by the skiff's sway and the breeze
      swingV += (-14 * swing - 1.6 * swingV - rz * 6 + Math.sin(t * .9) * .4) * dt; swing += swingV * dt; lantern.rotation.set(swing * .35, 0, swing);
      const pop = hungAt >= 0 ? Math.min(1, (t - hungAt) / .35) : 1; lantern.scale.setScalar(pop < 1 ? 1 + 2.70158 * (pop - 1) ** 3 + 1.70158 * (pop - 1) ** 2 : 1);   // pops in with a little overshoot
      paperMat.emissiveIntensity = .55 + wake * .7 + (hungAt >= 0 && t - hungAt < 1.2 ? (1.2 - (t - hungAt)) * 1.2 : 0) + .08 * Math.sin(t * 3.1);
    },
  };
}
