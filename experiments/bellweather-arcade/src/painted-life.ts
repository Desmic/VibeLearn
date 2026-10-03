import * as T from 'three';
import { mulberry32 } from './vendor/rng';
import { buildMira } from './companions';
import { buildTownsperson, type Townsperson } from './townsfolk-rig';
import { MIRA_LOOK, type BodyKit } from './kit/body-kit';
import { TOWN_LINES, TOWN_AFTER, TOWN_VOICES } from './worlds/bellweather-lines';

// Signs of life for `render=painted`: a few townsfolk in long coats and woven
// hats (original designs, echoing the reference's inhabitants), Mira waiting at
// the courtyard's outlook, and birds wheeling around the landmark island.
// Everything idles gently; nothing here changes learning, routes or saves.

type Solid = (x: number, z: number, r: number) => void;

function birds(root: T.Object3D, center: T.Vector3, n: number) {
  const geo = new T.BufferGeometry();
  // a simple gull silhouette: two swept wing triangles
  geo.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, -1, .25, .35, -.2, 0, -.1, 0, 0, 0, .2, 0, -.1, 1, .25, .35], 3));
  geo.computeVertexNormals();
  const mat = new T.MeshBasicMaterial({ color: '#fbf6ef', side: T.DoubleSide, fog: false });
  const flock: { m: T.Mesh, rad: number, h: number, sp: number, ph: number }[] = [];
  const r = mulberry32(31);
  for (let i = 0; i < n; i++) {
    const m = new T.Mesh(geo, mat); m.scale.setScalar(3 + r() * 2); root.add(m);
    flock.push({ m, rad: 30 + r() * 25, h: 40 + r() * 22, sp: .12 + r() * .06, ph: r() * Math.PI * 2 });
  }
  return (t: number) => {
    for (const b of flock) {
      const a = b.ph + t * b.sp;
      b.m.position.set(center.x + Math.cos(a) * b.rad, center.y + b.h + Math.sin(t * .7 + b.ph) * 2, center.z + Math.sin(a) * b.rad * .6);
      b.m.rotation.set(0, -a, 0);
      b.m.scale.y = .6 + Math.abs(Math.sin(t * 5 + b.ph)) * .9;
    }
  };
}

interface LifeOptions { clips: T.AnimationClip[]; kit?: BodyKit | null; camera: T.Camera; host: HTMLElement; onGreet?: (from: T.Vector3) => void;
  /** say a line aloud (voiced lines): returns how long it lasts, 0 if unvoiced */
  speak?: (voice: string, text: string, at: T.Vector3) => number; }
interface Greeter { who: Townsperson | null; pos: () => T.Vector3; lines: string[]; voice: string; cool: number; timer: number; spoken: number; wave: boolean; turn?: (target: T.Vector3, dt: number) => void; }

// What the townsfolk say, and in whose voice, is data (worlds/bellweather-lines.ts).
const LINES = TOWN_LINES, AFTER = TOWN_AFTER;
// ...and they keep glancing at the sky where the ship went (over the town, toward the Blossom Isle).
const GONE = new T.Vector3(0, 30, 46);

export function buildPaintedLife(scene: T.Scene, solid: Solid, withBirds = true, opts: LifeOptions) {
  const root = new T.Group(); root.name = 'painted-life'; scene.add(root);
  const greeters: Greeter[] = [];
  const folk: Townsperson[] = [];
  const place = (seed: number, x: number, z: number, faceY: number, base: 'Idle' | 'Talk', key: string) => {
    const lines = LINES[key];
    const p = buildTownsperson(seed, opts.clips, opts.kit); p.root.position.set(x, .13, z); p.root.rotation.y = faceY; p.setBase(base);
    root.add(p.root); solid(x, z, .36); folk.push(p);
    const home = faceY;
    greeters.push({ who: p, pos: () => p.root.position, lines, voice: TOWN_VOICES[key] ?? 'folk0', cool: 0, timer: -1, spoken: 0, wave: true,
      turn: (target, dt) => { const want = Math.atan2(-(target.x - p.root.position.x), -(target.z - p.root.position.z)); rotateToward(p.root, want, dt * 2.5, home, 1.3); } });
  };
  // two neighbours talking by the outlook; one taking in the view
  place(3, -5.4, -11.1, -Math.PI / 2 + .3, 'Talk', 'chatA');
  place(8, -4.3, -11.0, Math.PI / 2 - .2, 'Talk', 'chatB');
  place(14, 6.6, -11.0, 0, 'Idle', 'view');
  // someone waiting under the arrival canopy, and a figure reading near the bench
  place(21, -6.8, 6.4, .9, 'Idle', 'canopy');
  place(27, 6.9, 1.2, -1.9, 'Idle', 'reader');
  // Strollers keep to open ground away from the route; they pause to greet.
  const strollers: { p: Townsperson, a: T.Vector3, b: T.Vector3, speed: number, u: number, g: Greeter }[] = [];
  const stroll = (seed: number, a: [number, number], b: [number, number], speed: number, u: number, key: string) => {
    const lines = LINES[key];
    const p = buildTownsperson(seed, opts.clips, opts.kit); p.setBase('Stroll'); root.add(p.root); folk.push(p);
    // the shadow map is baked once, so a walker's shadow would stay behind; walkers get a soft contact shade instead
    p.root.traverse(o => { o.castShadow = false; }); p.root.add(contactShade());
    const g: Greeter = { who: p, pos: () => p.root.position, lines, voice: TOWN_VOICES[key] ?? 'folk0', cool: 0, timer: -1, spoken: 0, wave: true };
    greeters.push(g);
    strollers.push({ p, a: new T.Vector3(a[0], .13, a[1]), b: new T.Vector3(b[0], .13, b[1]), speed, u, g });
  };
  stroll(33, [-7.6, 0.4], [-2.4, 0.9], .55, .1, 'stroll1');
  stroll(38, [3.4, -0.6], [7.6, 0.6], .48, .62, 'stroll2');
  stroll(41, [-7.6, -6.8], [-1.6, -6.9], .5, .35, 'stroll3');
  // Mira waits at the outlook, turned toward the arriving player
  // Mira is built from the body kit (a person, with the shared clips) when it loaded; the old rig otherwise
  const miraP = opts.kit ? buildTownsperson(97, opts.clips, opts.kit, MIRA_LOOK) : null;
  const mira = miraP ? { root: miraP.root, animate: (_t: number, _s: number, _r: boolean) => {} } : buildMira(); mira.root.name = 'Mira'; mira.root.userData.fade = { halfW: .4, y0: 0, y1: 1.9, dither: !!miraP }; mira.root.position.set(5.3, .13, -10.95); mira.root.rotation.y = Math.PI - .5; root.add(mira.root); solid(5.3, -10.95, .38);
  const miraHome = mira.root.rotation.y;
  const miraTop = new T.Object3D(); miraTop.position.set(0, 2.05, 0); mira.root.add(miraTop);
  const miraG: Greeter = { who: miraP, pos: () => mira.root.position, lines: LINES.mira, voice: 'Mira', cool: 0, timer: -1, spoken: 0, wave: false,
    turn: (target, dt) => rotateToward(mira.root, Math.atan2(-(target.x - mira.root.position.x), -(target.z - mira.root.position.z)), dt * 2, miraHome, 1.6) };
  greeters.push(miraG);
  const still = folk.filter(p => !strollers.some(s => s.p === p));
  const flock = withBirds ? birds(root, new T.Vector3(-26, 34, -150), 9) : () => {};

  // Speech bubbles are DOM (crisp text at any render scale), anchored above heads.
  const bubble = document.createElement('div'); bubble.className = 'speech'; bubble.hidden = true; bubble.setAttribute('aria-live', 'polite'); opts.host.appendChild(bubble);
  let bubbleFor: Greeter | null = null, bubbleT = 0;
  const voiceAt = new T.Vector3();
  const say = (g: Greeter, text: string) => { bubble.textContent = text; bubble.hidden = false; bubbleFor = g; const dur = opts.speak?.(g.voice, text, voiceAt.copy(g.pos()).setY(g.pos().y + 1.7)) ?? 0; bubbleT = Math.max(3.6, dur + .8); };

  let t = 0, wasAlarm = false; const zipHead = new T.Vector3(), tmp = new T.Vector3(), greetFrom = new T.Vector3();
  const tick = (dt: number, reduced: boolean, zip?: { pos: T.Vector3, speed: number }) => {
    t += dt;
    if (zip) zipHead.copy(zip.pos).setY(zip.pos.y + 1.5);
    // alarm (the Warden's ship overhead): everyone stops, turns and stares up at it
    const alarm = root.userData.alarm as T.Vector3 | null | undefined;
    // afterwards nobody strolls: people stand where they were, still watching the sky the ship left by
    const after = !!root.userData.after && !alarm;
    if (alarm) {
      // the first moment: the two nearest point up at it (an arm raised), the rest just stare
      if (!wasAlarm) [...folk].sort((a, b) => a.root.position.distanceToSquared(alarm) - b.root.position.distanceToSquared(alarm)).slice(0, 2).forEach((p, i) => setTimeout(() => p.wave(), 300 + i * 700));
      for (const p of folk) { p.lookAt(alarm); rotateToward(p.root, Math.atan2(-(alarm.x - p.root.position.x), -(alarm.z - p.root.position.z)), dt * 2.2); }
      miraP?.lookAt(alarm);
      wasAlarm = true;
    } else if (wasAlarm) { wasAlarm = false; for (const p of folk) p.lookAt(null); }
    // strollers advance unless greeting
    for (const s of strollers) {
      const greeting = s.g.timer >= 0 || !!alarm || after;
      if (!greeting && !reduced) s.u += dt * s.speed / s.a.distanceTo(s.b);
      const cyc = s.u % 2, f = cyc < 1 ? cyc : 2 - cyc, e = f * f * (3 - 2 * f);
      s.p.root.position.lerpVectors(s.a, s.b, e);
      const moving = greeting ? 0 : Math.min(1, Math.min(f, 1 - f) * 6) * s.speed;
      s.p.setBase(moving > .05 ? 'Stroll' : 'Idle');
      if (after && s.g.timer < 0) { rotateToward(s.p.root, Math.atan2(-(GONE.x - s.p.root.position.x), -(GONE.z - s.p.root.position.z)), dt * 1.5); s.p.lookAt(GONE); }
      else if (greeting && zip) rotateToward(s.p.root, Math.atan2(-(zip.pos.x - s.p.root.position.x), -(zip.pos.z - s.p.root.position.z)), dt * 3);
      else { const dir = cyc < 1 ? 1 : -1; rotateToward(s.p.root, Math.atan2(-(s.b.x - s.a.x) * dir, -(s.b.z - s.a.z) * dir), dt * 4); }
      s.p.update(dt, moving, reduced);
    }
    for (const p of still) { if (after && !greeters.some(g => g.who === p && g.timer >= 0)) p.lookAt(GONE); p.update(dt, 0, reduced); }
    // greetings: notice Zip nearby, look, wave, say a line; Zip answers
    for (const g of greeters) {
      g.cool -= dt;
      const gp = g.pos(), d = zip ? Math.hypot(gp.x - zip.pos.x, gp.z - zip.pos.z) : 99;
      if (g === miraG && mira.root.userData.quiet) continue; // the story speaks for her
      if (alarm) continue;
      if (g.timer < 0 && zip && d < (g.who ? 3.0 : 3.6) && g.cool <= 0 && !opts.host.matches('.card-open,.cutscene,.puzzle-mode')) {
        g.timer = 0; g.cool = 22;
        g.who?.lookAt(zipHead);
        if (g.wave && g.spoken === 0 && !root.userData.after) g.who?.wave();
        say(g, root.userData.after && g !== miraG ? AFTER[(greeters.indexOf(g) + g.spoken) % AFTER.length] : g.lines[Math.min(g.spoken, g.lines.length - 1)]); g.spoken++;
        opts.onGreet?.(g.who ? g.who.head.getWorldPosition(greetFrom) : greetFrom.copy(g.pos()).setY(1.6));
      }
      if (g.timer >= 0) {
        g.timer += dt; if (zip) { g.who?.lookAt(zipHead); g.turn?.(zip.pos, dt); }
        if (g.timer > 4.2 || d > 5.5) { g.timer = -1; g.who?.lookAt(null); }
      }
    }
    // bubble follows its speaker
    if (bubbleFor) {
      bubbleT -= dt;
      const anchor = bubbleFor.who ? bubbleFor.who.headTop : miraTop;
      anchor.getWorldPosition(tmp).project(opts.camera);
      const visible = bubbleT > 0 && !opts.host.matches('.card-open,.cutscene,.puzzle-mode') && tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
      bubble.hidden = !visible;
      if (visible) { const w = opts.host.clientWidth, h = opts.host.clientHeight, bw = bubble.offsetWidth / 2 + 8, bh = bubble.offsetHeight; bubble.style.transform = `translate(${Math.min(w - bw, Math.max(bw, (tmp.x * .5 + .5) * w))}px, ${Math.max(118 + bh, (-tmp.y * .5 + .5) * h)}px) translate(-50%, -100%)`; }  // kept on screen, below the goal line
      if (bubbleT <= 0) bubbleFor = null;
    }
    if (miraP) {
      // in conversation (a story card is open nearby) she talks and looks at Zip
      const chatting = mira.root.visible && opts.host.matches('.card-open') && !!zip && Math.hypot(zip.pos.x - mira.root.position.x, zip.pos.z - mira.root.position.z) < 6;
      miraP.setBase(chatting ? 'Talk' : 'Idle'); if (chatting) miraP.lookAt(zipHead); else if (miraG.timer < 0) miraP.lookAt((root.userData.alarm as T.Vector3 | null) ?? null);
      if (mira.root.visible) miraP.update(dt, 0, reduced);
    } else if (!reduced && mira.root.visible) mira.animate(t, 0, false);
    flock(t);
  };
  tick(0, false);
  return tick;
}

let shadeGeo: T.CircleGeometry | undefined, shadeMat: T.MeshBasicMaterial | undefined;
function contactShade() {
  shadeGeo ??= new T.CircleGeometry(.34, 18).rotateX(-Math.PI / 2);
  shadeMat ??= new T.MeshBasicMaterial({ color: '#3a3358', transparent: true, opacity: .28, depthWrite: false });
  const m = new T.Mesh(shadeGeo, shadeMat); m.position.y = .015; m.renderOrder = 2; return m;
}

// Turn toward a heading, optionally never further than `limit` from home.
function rotateToward(o: T.Object3D, want: number, step: number, home?: number, limit?: number) {
  if (home !== undefined && limit !== undefined) { let off = ((want - home + Math.PI * 3) % (Math.PI * 2)) - Math.PI; off = T.MathUtils.clamp(off, -limit, limit); want = home + off; }
  let diff = ((want - o.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  o.rotation.y += T.MathUtils.clamp(diff, -step, step);
}
