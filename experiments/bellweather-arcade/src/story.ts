import * as T from 'three';
import type { Guide } from './guide';
import { buildSkiffPuzzle, PILOT_STONE, type LearningEvent } from './speech-puzzle';
import { buildIsland } from './island';
import { loadKit, loadProp } from './kit/kit';
import { lambertize } from './painted';
import { createWorld } from './kit/world';
import { SKY_ROUTE } from './worlds/sky-route';
import { LOOM_ISLE } from './worlds/loom-isle';
import { BELLWEATHER_PROPS } from './worlds/bellweather-props';
import { sfx } from './sfx';
import { buildFlight } from './flight';
import { save, type Checkpoint } from './save';
import { createScriptRunner, validateScript } from './kit/story-script';
import { FIRST_WORDS_L1 } from './worlds/first-words-story';
import { station } from './worlds/first-words-stations';
import { STOP2_STORY, LOOM_STATION, LOOM_RULES } from './worlds/stop2-loom';
import { createStation } from './kit/station';
import { entityAt } from './kit/dress';
import { buildLoom } from './loom';
import { buildEcho } from './echo';
import { buildEngine } from './engine-holo';
import { createSwingers } from './kit/swing';
import { loadBodyKit, assembleLook } from './kit/body-kit';
import { clearSight } from './canopy';
import { tickHolo, beam as holoBeam, sparks as holoSparks, HOLO } from './kit/holo';
import { ECHO_SOURCES, ECHO_NEEDED, ECHO_SKIFF_RULES, ECHO_SKIFF_STATION } from './worlds/first-words-echo';

// Level 1 story controller. One goal at a time, always with a beacon; the
// player acts through one context button. What the story says (lines,
// thoughts, goals, checkpoints, stars) is data in `worlds/first-words-story.ts`;
// this file keeps what it does (cutscene, spark chase, flight).
//   meet Mira → hang the lantern → the attack (skippable) → find the spark
//   → wake the skiff (speech 1) → fly → Blossom Isle gate + relay (speech 2)
// `?beat=skiff|isle|to-loom` starts later for testing; `?story=0` is free walking.

interface Opts {
  guide: Guide; host: HTMLElement; zip: () => T.Vector3;
  teleport: (x: number, z: number, yaw: number) => void; dim: (k: number) => void; aspect: () => number;
  addBox: (a: number, b: number, c: number, d: number) => object; removeBox: (b: object) => void;
  solid: (x: number, z: number, r: number) => void; addWalk: (x: number, z: number, r: number) => void;
  onEvent?: (e: LearningEvent) => void; walkable: (x: number, z: number) => boolean;
  ride: (p: T.Vector3 | null, yaw: number) => void; input: () => { x: number; y: number };
  // Zip has left the town: hide it (and its costs) and add the island's camera blockers
  enterIsland: (cameraBlockers: T.Object3D[]) => void;
  adopt?: (root: T.Object3D, cameraBlockers: T.Object3D[]) => void; density?: number;
  setGround?: (y: number) => void;   // the height Zip stands at (islands can sit higher)
  camera: T.Camera;
  /** how far the camera can go from `from` toward `to` before something solid */
  cameraClear?: (from: T.Vector3, to: T.Vector3) => number;
}
type Beat = 'meet' | 'attack' | 'spark' | 'skiff' | 'puzzle' | 'fly' | 'isle' | 'to-loom' | 'loom' | 'loom-puzzle' | 'loom-done';

// Fixed staging at the outlook: Zip's mark facing Mira, and a camera that sees
// both of them against the open sky (the outlook sits under a canopy).
const ZIP_MARK = new T.Vector3(3.4, .13, -9.4), ZIP_FACE = -.886, CAM = new T.Vector3(3.3, 1.9, -5.4);
const SKIFF_ST = station('wake-skiff');
export const SPARK_AT = new T.Vector3(-2, .13, 1.5);   // in the bell garden, by the pink bed
// the bell frame stands over the garden's north entrance (the passage from the outlook)
const BELL_FRAME = new T.Vector3(1.25, .13, -2.1);

export function buildStory(scene: T.Scene, o: Opts) {
  const g = o.guide;
  const skiff = buildSkiffPuzzle(scene, { guide: g, host: o.host, solid: o.solid, onEvent: o.onEvent, aspect: o.aspect });
  const isle = buildIsland(scene, { guide: g, host: o.host, addBox: o.addBox, removeBox: o.removeBox, solid: o.solid, addWalk: o.addWalk, onEvent: o.onEvent, onOpen: () => save.set('gate-open'), onDone: () => toLoom(), setGoal: (t, b, a) => goal(t, b, a), adopt: o.adopt, density: o.density });
  // the next island on the route, dressed from its own world spec (seen from Blossom Isle)
  // the sky beyond Bellweather: the next island and generated scenery islands
  // along the flight, shown only once Zip is in the air or on the islands
  const world = createWorld(scene, loadKit('nature-meadow'), { density: o.density, props: BELLWEATHER_PROPS, adopt: o.adopt });
  world.show('next', false); world.show('route', false);
  world.add(LOOM_ISLE, 'next');
  for (const spec of SKY_ROUTE) world.add(spec, 'route');
  let skyShown = false;
  const flight = buildFlight(scene, { guide: g, input: o.input, ride: o.ride });
  g.setThinker(o.zip);
  // townsfolk (for Zip's NPC suspicions) and idle tracking
  const folk = (scene.getObjectByName('painted-life')?.children ?? []).filter(c => c.userData.fade && c.name !== 'Mira');
  let firstNpc: T.Object3D | null = null, npcAt = 0, idleT = 0; const lastZip = new T.Vector3();
  const mira = scene.getObjectByName('Mira'); if (mira) mira.userData.quiet = true;
  const miraAt = mira ? mira.position.clone() : new T.Vector3(5.3, .13, -10.95);

  // attack props: the Warden's ship, its beam, and Zip's spark
  const ship = new T.Group(); ship.visible = false; scene.add(ship);
  const hullMat = new T.MeshLambertMaterial({ color: '#2a1f40', emissive: '#4a2f7a', emissiveIntensity: .4 });
  const hull = new T.Mesh(new T.CapsuleGeometry(.9, 2.6, 6, 16), hullMat); hull.rotation.z = Math.PI / 2; hull.scale.set(1, 1, .7); ship.add(hull);
  let eye: T.Object3D = new T.Mesh(new T.SphereGeometry(.28, 16, 10), new T.MeshBasicMaterial({ color: '#c89bff' })); eye.position.set(0, -.55, .45); ship.add(eye);
  // the authored ship (authoring/props/build_warden_ship.py) replaces the capsule when it loads:
  // all ears, one eye and a hatch underneath; its origin is the hatch, where the beam starts
  loadProp('warden-ship').then(model => {
    lambertize(model);
    const glowMat = new T.MeshBasicMaterial({ color: '#c89bff', side: T.DoubleSide }), eyeMat = new T.MeshBasicMaterial({ color: '#f0e2ff' });
    model.traverse(c => { const m = c as T.Mesh; if (!m.isMesh) return; if (/^ShipHull/.test(m.name)) { const l = m.material as T.MeshLambertMaterial; l.emissive.set('#3a2266'); l.emissiveIntensity = .55; } else if (/^Ship(Glow|Hatch)/.test(m.name)) m.material = glowMat; else if (/^ShipEye/.test(m.name)) m.material = eyeMat; });
    const e = model.getObjectByName('ShipEye'); hull.visible = eye.visible = false; if (e) eye = e;
    model.rotation.x = .18; ship.add(model);   // nose dipped: the eye looks down at the outlook
  }).catch(err => console.warn('[prop] warden ship unavailable; keeping the stand-in', err));
  const beamMat = new T.MeshBasicMaterial({ color: '#b07bff', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  const beam = new T.Mesh(new T.CylinderGeometry(.5, 1, 1, 20, 1, true), beamMat); beam.visible = false; scene.add(beam);
  const bolt = new T.Mesh(new T.CylinderGeometry(.05, .05, 1, 6, 1, true), new T.MeshBasicMaterial({ color: '#e6d0ff', blending: T.AdditiveBlending, transparent: true })); bolt.visible = false; scene.add(bolt);
  const sparkMat = new T.MeshBasicMaterial({ color: '#fff0a8' });
  const spark = new T.Mesh(new T.IcosahedronGeometry(.13, 1), sparkMat); spark.visible = false; scene.add(spark);
  const sparkHalo = new T.Mesh(new T.SphereGeometry(.32, 16, 10), new T.MeshBasicMaterial({ color: '#ffd36b', transparent: true, opacity: .35, depthWrite: false, blending: T.AdditiveBlending })); spark.add(sparkHalo);
  const sparkFx = holoSparks(scene, 48);
  const sparkPillar = holoBeam({ color: HOLO.made, radius: .045, flow: true }); sparkPillar.mesh.visible = false; scene.add(sparkPillar.mesh);

  // the bell frame (authoring/props/build_festival_props.py): it gives the bell garden its name.
  // Its bells swing and ring when Zip walks under them, and all ring when the spark lands.
  let bells: ReturnType<typeof createSwingers> | null = null;
  for (const dx of [-1.5, 1.5]) o.solid(BELL_FRAME.x + dx, BELL_FRAME.z, .26);
  loadProp('bell-frame').then(model => {
    lambertize(model); model.position.copy(BELL_FRAME); model.name = 'bell-frame'; scene.add(model);
    model.traverse(c => { const m = c as T.Mesh; if (m.isMesh && /^(Frame|Pennants)/.test(m.name)) clearSight(m.material as T.Material, 'dither'); });
    const hung = [0, 1, 2, 3, 4].map(i => model.getObjectByName('Bell' + i)).filter((b): b is T.Object3D => !!b);
    bells = createSwingers(hung, { reach: 1.2, onRing: (i, v) => sfx.bell([0, 2, 4, 3, 1][i] ?? i, .4 + .6 * v) });
  }).catch(err => console.warn('[prop] bell frame unavailable', err));

  // The attack is the town's worst day: everyone stops and stares, the ground shakes, the
  // bells ring in the gust, and afterwards Bellweather talks of nothing else. Mira's sun hat
  // stays where she was taken (a mark on the world until Zip brings her home).
  const life = () => scene.getObjectByName('painted-life')?.userData as { alarm?: T.Vector3 | null; after?: boolean } | undefined;
  let shake = 0, hat: T.Object3D | null = null;
  loadBodyKit().then(kit => {
    const g = assembleLook(kit, { parts: [{ part: 'hat.wide', main: '#ead08f', accent: '#2fa79a' }] }, ['Head']);
    g.computeBoundingBox(); const b = g.boundingBox!, c = new T.Vector3(); b.getCenter(c); g.translate(-c.x, -b.min.y, -c.z);
    const m = new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true;
    m.position.copy(miraAt).add(new T.Vector3(.35, .015, .25)); m.rotation.set(.18, 1.1, -.12); m.visible = !!life()?.after; m.name = 'miras-hat';
    scene.add(m); hat = m;
  }).catch(() => { /* no kit: no hat */ });
  const afterAttack = () => { const l = life(); if (l) { l.after = true; l.alarm = null; } if (hat) hat.visible = true; };

  const fade = document.createElement('div'); fade.className = 'story-fade'; o.host.appendChild(fade);
  const skip = document.createElement('button'); skip.className = 'round story-skip'; skip.style.width = 'auto'; skip.style.padding = '0 16px'; skip.textContent = FIRST_WORDS_L1.labels.skip; skip.hidden = true; o.host.appendChild(skip);

  let talking = false, beat: Beat = 'meet', cut = -1, dimK = 0, dimTo = 0, placeName: string | null = null, t = 0;
  const goal = (text: string | null, at: T.Vector3 | null, arrowOnly = false) => { g.setGoal(text); g.setBeacon(at, arrowOnly); };
  const timers: { at: number; fn: () => void }[] = [];
  const later = (sec: number, fn: () => void) => timers.push({ at: t + sec, fn });
  // the script: anchors name places in the world, beats save their checkpoint and name their place
  const S = FIRST_WORDS_L1;
  const story = createScriptRunner(S, g, {
    anchors: { mira: () => miraAt, spark: () => sparkHome, pilotStone: () => PILOT_STONE },
    onBeat: b => { if (b.checkpoint) save.set(b.checkpoint as Checkpoint); if (b.place) placeName = b.place; },
    later,
  });
  for (const i of validateScript(S)) (i.level === 'error' ? console.error : console.warn)(`[story] ${i.where}: ${i.msg}`);
  const enter = (b: Beat) => { beat = b; story.enter(b); };

  // ── Echo & Engine (docs/GAME-REDESIGN-ECHO.md): Zip absorbs words from the world
  // and speaks through a holographic engine. `?mech=classic` keeps the old catch game.
  const ECHO = new URLSearchParams(location.search).get('mech') !== 'classic';
  const echoSt = createStation(ECHO_SKIFF_STATION, { onEvent: o.onEvent, stars: (title, rows, then) => g.stars(title, rows, then) }, ECHO_SKIFF_RULES);
  const needed = () => ECHO_NEEDED.filter(w => !echoSt.state['has' + w]);
  let gatherT = 0;
  const gatherGoal = () => {
    if (beat !== 'skiff' || !ECHO) return;
    const left = needed(), total = ECHO_NEEDED.length;
    if (left.length) goal(S.labels.gather.replace('{n}', String(total - left.length)).replace('{total}', String(total)), echo.nearest(o.zip(), left));
    else goal(S.labels.wakeSkiff, PILOT_STONE);
  };
  const echo = buildEcho(scene, {
    guide: g, camera: o.camera, zip: o.zip, sources: ECHO_SOURCES, follow: { skiff: () => skiff.at() },
    absorb: w => echoSt.act('absorb.' + w).ok,
    onAbsorbed: w => {
      story.thinkOnce('echo-first');
      if (!ECHO_NEEDED.includes(w)) later(1.2, () => story.thinkOnce('echo-decoy'));
      else if (!needed().length) later(1, () => story.thinkOnce('echo-ready'));
      gatherGoal();
    },
  });
  const engine = buildEngine(scene, {
    guide: g, host: o.host, camera: o.camera, station: echoSt, zip: o.zip,
    carried: () => echo.carried, carry: w => echo.carry(w), target: () => skiff.at(), hear: k => skiff.hear(k),
    onThought: id => story.thinkOnce(id),
    onComplete: () => { echo.showOrbit(true); later(.3, () => echoSt.finish(() => story.dialogue('awake-echo', { board: fly }))); },
  });
  const openEngine = () => {
    action(null); enter('puzzle'); o.teleport(PILOT_STONE.x, PILOT_STONE.z + 1.2, 0); echo.showOrbit(false);
    engine.open(new T.Vector3(PILOT_STONE.x - .55, 2.8, PILOT_STONE.z - .15), () => { echo.showOrbit(true); beat = 'skiff'; gatherGoal(); });
  };

  // ── Stop 2: Loom Isle. Its story, station and rules are data (worlds/stop2-loom.ts) ──
  const toXZ = (id: string) => { const [x, z] = entityAt(LOOM_ISLE, id); return new T.Vector3(x, (LOOM_ISLE.elevation ?? 0) + .13, z); };
  const MOOR = isle.landing.clone().add(new T.Vector3(-3.2, 0, .8)), LOOM_TALK = toXZ('loom-talk'), LOOM_LAND = toXZ('loom-landing'), LOOM_AT = toXZ('word-loom');
  const stop2 = createScriptRunner(STOP2_STORY, g, {
    anchors: { skiffMoor: () => MOOR, 'word-loom': () => LOOM_AT },
    onBeat: b => { if (b.checkpoint) save.set(b.checkpoint as Checkpoint); if (b.place) placeName = b.place; },
    later,
  });
  for (const i of validateScript(STOP2_STORY)) (i.level === 'error' ? console.error : console.warn)(`[story] ${i.where}: ${i.msg}`);
  const enter2 = (b: Beat) => { beat = b; stop2.enter(b); };
  const loomSt = createStation(LOOM_STATION, { onEvent: o.onEvent, stars: (title, rows, then) => g.stars(title, rows, then) }, LOOM_RULES);
  const loom = buildLoom({ guide: g, host: o.host, station: loomSt, onShake: () => later(.4, () => stop2.thinkOnce('loom-warden')), onDone: () => loomSt.finish(() => {
    freeTavi(); stop2.dialogue('thanks', { endStop: () => { enter2('loom-done'); later(.8, () => stop2.thinkOnce('loom-pieces')); } });
  }) });
  // Tavi, the weaver, is stuck behind the loom's cloth: a voice and a shadow until freed
  const tavi = new T.Group(); tavi.position.copy(LOOM_AT).add(new T.Vector3(0, -.13, -.75)); tavi.visible = false; scene.add(tavi);
  const taviBody = new T.Mesh(new T.CapsuleGeometry(.24, .62, 6, 12), new T.MeshLambertMaterial({ color: '#c46a4e' })); taviBody.position.y = .6; tavi.add(taviBody);
  const taviHead = new T.Mesh(new T.SphereGeometry(.2, 16, 12), new T.MeshLambertMaterial({ color: '#e8b48c' })); taviHead.position.y = 1.2; tavi.add(taviHead);
  const taviScarf = new T.Mesh(new T.TorusGeometry(.19, .06, 8, 18), new T.MeshLambertMaterial({ color: '#6fb8e8' })); taviScarf.rotation.x = Math.PI / 2; taviScarf.position.y = .98; tavi.add(taviScarf);
  const cloth = new T.Mesh(new T.PlaneGeometry(2.2, 1.5), new T.MeshLambertMaterial({ color: '#e3b47e', side: T.DoubleSide, transparent: true, opacity: .92 }));
  cloth.position.copy(LOOM_AT).add(new T.Vector3(0, .95, -.4)); cloth.visible = false; scene.add(cloth);
  let taviFree = -1;
  const freeTavi = () => { taviFree = 0; sfx.chime(); };
  let loomReady = false;
  // walking, solids and camera blockers on Loom Isle, once its dressing exists
  const readyLoom = (then: () => void) => {
    const built = world.islands.find(i => i.spec.id === LOOM_ISLE.id);
    if (!built) { setTimeout(() => readyLoom(then), 200); return; }
    if (!loomReady) {
      loomReady = true;
      o.addWalk(LOOM_ISLE.center[0], LOOM_ISLE.center[1], LOOM_ISLE.radius * .86);
      for (const sld of built.d.solids) o.solid(sld.x, sld.z, sld.r);
      o.solid(LOOM_AT.x, LOOM_AT.z, 1.35);
      o.enterIsland(built.d.cameraBlockers.filter(b => b.name !== 'island-rock'));
      tavi.visible = cloth.visible = true;
    }
    then();
  };
  const landOnLoom = () => {
    isle.leave(); o.setGround?.((LOOM_ISLE.elevation ?? 0)); enter2('loom'); o.teleport(LOOM_LAND.x, LOOM_LAND.z - 1.2, 0);
  };
  const toLoom = () => { enter2('to-loom'); };
  const board = () => { action(null); stop2.dialogue('hop', { board: () => readyLoom(landOnLoom) }); };
  const talkLoom = () => { action(null); enter2('loom-puzzle'); loomSt.state.phase === 'guided' ? stop2.dialogue('tavi', { openLoom: () => loom.open() }) : loom.open(); };
  const focusPt = new T.Vector3(), tmpLabel = new T.Vector3(), tmp2 = new T.Vector3(), tmp3 = new T.Vector3();
  const sparkFrom = new T.Vector3(), shotPos = new T.Vector3(), shotLook = new T.Vector3(), tmp = new T.Vector3();

  // The spark is playful: it hops away when Zip gets close, a few times, then
  // tires and can be caught by touching it. Cornering it also works.
  const sparkHome = new T.Vector3().copy(SPARK_AT), hopFrom = new T.Vector3(), hopTo = new T.Vector3();
  let hops = 0, hopT = -1, rest = 0;
  const toSpark = () => {
    cut = -1; skip.hidden = true; o.host.classList.remove('cutscene'); ship.visible = beam.visible = false; if (mira) mira.visible = false; afterAttack();
    spark.visible = true; sparkHome.copy(SPARK_AT); spark.position.copy(sparkHome).setY(.6); dimTo = .35; hops = 0; hopT = -1;
    enter('spark');
  };
  const hop = (z: T.Vector3) => {
    // pick a spot 2.5-4 m away, walkable, inside the garden, away from Zip
    let best: T.Vector3 | null = null, bestD = -1;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, r = 2.5 + (i % 3) * .75, x = sparkHome.x + Math.cos(a) * r, zz = sparkHome.z + Math.sin(a) * r;
      if (Math.hypot(x - SPARK_AT.x, zz - SPARK_AT.z) > 4.5 || !o.walkable(x, zz)) continue;
      const d = Math.hypot(x - z.x, zz - z.z); if (d > bestD) { bestD = d; best = new T.Vector3(x, .13, zz); }
    }
    if (!best || bestD < Math.hypot(sparkHome.x - z.x, sparkHome.z - z.z) + .5) { story.toast('sparkCornered', 1000); hops = 99; return; } // nowhere better to go
    hopFrom.copy(spark.position); hopTo.copy(best); hopT = 0; hops++; sfx.pop();
    if (hops === 1) { story.toast('sparkFlees', 1200); story.thinkOnce('chase'); } else if (hops === 3) story.toast('sparkTiring', 1200);
  };
  const catchSpark = () => {
    later(2.2, () => story.thinkOnce('beep'));
    // the catch: a burst of gold, and the spark streams into Zip's chest
    sparkFx.burst(spark.position, 28, 2.4, HOLO.made); later(.25, () => sparkFx.burst(o.zip().clone().setY(o.zip().y + 1), 18, 1.4, HOLO.made));
    beat = 'skiff'; spark.visible = false; sfx.chime(); sfx.speak(4); story.toast('sparkCaught', 1100);
    later(.7, () => story.dialogue(ECHO ? 'coil-echo' : 'coil', { afterCoil: toSkiff }));
  };
  const toSkiff = () => { afterAttack(); spark.visible = false; o.host.classList.remove('cutscene'); skiff.showLantern(); enter('skiff'); if (ECHO) { echo.enable(); gatherGoal(); } };
  const fly = () => {
    enter('fly'); echo.enable(false); o.teleport(o.zip().x, o.zip().z, 0);
    const boat = skiff.release();
    flight.start(boat, isle.landing, r => {
      enter('isle'); o.enterIsland(isle.cameraBlockers); o.teleport(isle.landing.x - 1.2, isle.landing.z - 1.4, 0); boat.position.set(isle.landing.x - 3.2, boat.position.y, isle.landing.z + .8); dimTo = 0;
      story.stars('flight', [true, r.rings >= r.total - 1, r.spotted === 0], { ...r }, () => {
        isle.greet(() => { isle.arrive(); later(.6, () => story.thinkOnce('gate')); });
      });
    });
  };
  // The Stream: Zip and the Warden are the only awake machines, and nobody
  // knows. Without its speech engine an ordinary bot goes dark; Zip keeps
  // thinking, and the Warden hears it. That's what the attack was: a test.
  const streamWakes = () => {
    if (story.thinkOnce('stream-warden')) story.think('stream-zip');
  };
  const endAttack = () => {
    streamWakes();
    toSpark();
    sfx.static(); story.dialogue('static', { catchSpark: () => story.thinkOnce('silent') });
  };
  skip.addEventListener('click', e => { e.stopPropagation(); endAttack(); });
  const far = miraAt.clone().add(new T.Vector3(4, 8, -18)), hover = miraAt.clone().add(new T.Vector3(1, 2.8, -2.7)), up = new T.Vector3(0, 1, 0);
  // Shield Mira: one brave, doomed button. Zip dashes in and is knocked back.
  let shielded = false, dash = -1; const dashFrom = new T.Vector3(), dashTo = new T.Vector3();
  const shield = () => { if (shielded) return; shielded = true; dash = 0; dashFrom.copy(o.zip()); dashTo.copy(miraAt).lerp(dashFrom, .45); sfx.whoosh(); action(null); };
  const startAttack = () => {
    g.close(); talking = false; enter('attack'); cut = 0; skip.hidden = false; dimTo = 1;
    o.host.classList.add('cutscene'); ship.visible = true; ship.position.copy(far);
  };
  // A fixed shot shouldn't open on a post or trunk filling the edge of the frame. Feel along
  // both frame edges; if something solid stands close to the lens, step sideways away from
  // it (near things slide out of frame), never through a wall.
  const fgDir = new T.Vector3(), fgEnd = new T.Vector3(), fgSide = new T.Vector3();
  const clearForeground = (pos: T.Vector3, look: T.Vector3, halfFov: number) => {
    if (!o.cameraClear) return;
    const ld = tmp2.copy(look).sub(pos).setY(0).normalize(), right = fgSide.crossVectors(ld, up).normalize();
    let shift = 0;
    for (const side of [1, -1]) {
      fgDir.copy(ld).applyAxisAngle(up, side * halfFov * .9); fgEnd.copy(pos).addScaledVector(fgDir, 3.6);
      const d = o.cameraClear(pos, fgEnd); if (d < 3.4) shift += side * (3.4 - d) * .75;
    }
    if (!shift) return;
    shift = T.MathUtils.clamp(shift, -1.3, 1.3);
    fgEnd.copy(pos).addScaledVector(right, shift);
    const room = o.cameraClear(pos, fgEnd) - .3; pos.addScaledVector(right, Math.sign(shift) * Math.max(0, Math.min(Math.abs(shift), room)));
  };
  const talk = () => {
    talking = true; goal(null, null); o.teleport(ZIP_MARK.x, ZIP_MARK.z, ZIP_FACE);
    story.dialogue('mira', { hangLantern: () => { skiff.showLantern(true); sfx.chime(); story.toast('lantern', 1600); }, lookUp: startAttack });
  };

  const speakSkiff = () => { action(null); enter('puzzle'); o.teleport(4.0, -11.5, Math.PI / 2); skiff.start(fly); };
  // one context action for whatever is in reach
  let shown = '', shownFn: (() => void) | undefined;
  const action = (label: string | null, fn?: () => void) => { if ((label ?? '') !== shown || fn !== shownFn) { shown = label ?? ''; shownFn = fn; g.setAction(label, fn); } };

  return {
    get placeName() { return placeName; },
    debugTap: (w: string) => skiff.debugTap(w), debugFeed: () => skiff.debugFeed(),
    get debug() { return { script: S.id, beat, mech: ECHO ? 'echo' : 'classic', echo: echoSt.state, carried: echo.carried, engine: engine.active, loom: loomSt.state, hops, spark: sparkHome.toArray(), stones: skiff.debugStones(), core: skiff.debugCore() }; },
    /** what the camera should keep clear sight of (foliage on the way steps aside); null = Zip */
    get focus(): T.Vector3 | null { return cut >= 0 ? focusPt.copy(miraAt).lerp(ship.position, .5) : engine.active ? focusPt.set(PILOT_STONE.x - .4, 2.6, PILOT_STONE.z) : null; },
    get frozen() { return g.cardOpen || cut >= 0 || skiff.active || isle.busy || loom.active || engine.active; },
    get shot() {
      const s = engine.shot ?? skiff.shot ?? flight.shot; if (s) return s;
      if (cut < 0 && !talking) return null;
      // Frame Zip and Mira together on any screen: aim between them and step back until
      // both fit (phones held upright need more distance). In the attack, frame the sky too.
      const zz = o.zip(), mid = tmp.set((zz.x + miraAt.x) / 2, 0, (zz.z + miraAt.z) / 2);
      const sep = Math.hypot(zz.x - miraAt.x, zz.z - miraAt.z), hf = Math.tan(26 * Math.PI / 180) * Math.max(.45, o.aspect());
      const want = Math.max(4.9, (sep + 1.4) / (2 * hf));
      const away = new T.Vector3(CAM.x - mid.x, 0, CAM.z - mid.z).normalize();   // the open-sky side the old shot used
      const from = tmp2.copy(mid).setY(1.7), to = tmp3.copy(mid).addScaledVector(away, want).setY(CAM.y);
      const d = Math.min(want, Math.max(4.9, (o.cameraClear?.(from, to) ?? want) - .35));   // never behind a wall
      shotPos.copy(mid).addScaledVector(away, d).setY(CAM.y);
      shotLook.set(mid.x, cut < 0 ? 1.2 : 2.3, mid.z);
      clearForeground(shotPos, shotLook, Math.atan(hf));
      return { pos: shotPos, look: shotLook, shake };
    },
    /** where "restart" from the pause menu should put Zip right now:
     *  a point, 'stay' (mid-flight: nothing to restart), or null (town entrance) */
    /** the pause menu's Restart: leave any open puzzle console first */
    interrupt() { if (loom.active) { loom.close(); if (beat === 'loom-puzzle') beat = 'loom'; } if (engine.active) engine.close(); },
    safeSpot(): [number, number, number] | 'stay' | null {
      if (beat === 'fly') return 'stay';
      if (beat === 'isle' || beat === 'to-loom') return [isle.landing.x - 1.2, isle.landing.z - 1.4, 0];
      if (beat.startsWith('loom')) return [LOOM_LAND.x, LOOM_LAND.z - 1.2, 0];
      return null;
    },
    start(from?: Checkpoint) {
      const b = from ?? new URLSearchParams(location.search).get('beat');
      if (b === 'gate-open') { if (mira) mira.visible = false; placeName = story.beat('isle').place ?? null; beat = 'isle'; o.enterIsland(isle.cameraBlockers); isle.restoreOpen(); setTimeout(() => o.teleport(0, 45.2, 0), 50); return; }
      if (b === 'attack') { talking = true; setTimeout(() => { o.teleport(ZIP_MARK.x, ZIP_MARK.z, ZIP_FACE); skiff.showLantern(); startAttack(); }, 50); return; }
      if (b === 'spark') { if (mira) mira.visible = false; skiff.showLantern(); toSpark(); return; }
      if (b === 'skiff') { if (mira) mira.visible = false; toSkiff(); dimTo = .35; return; }
      if (b === 'land') { if (mira) mira.visible = false; placeName = story.beat('isle').place ?? null; beat = 'isle'; o.enterIsland(isle.cameraBlockers); setTimeout(() => { o.teleport(isle.landing.x - 1.2, isle.landing.z - 1.4, 0); isle.greet(() => isle.arrive()); }, 50); return; }
      if (b === 'to-loom') { if (mira) mira.visible = false; placeName = story.beat('isle').place ?? null; beat = 'isle'; o.enterIsland(isle.cameraBlockers); isle.restoreOpen(); setTimeout(() => { o.teleport(isle.landing.x - 1.2, isle.landing.z - 1.4, 0); toLoom(); }, 50); return; }
      if (b === 'loom-done') { if (mira) mira.visible = false; beat = 'loom'; world.show('next', true); world.show('route', true); skyShown = true; readyLoom(() => { landOnLoom(); loomSt.restore(['lift', 'lift', 'lift', 'predict.pieces', 'choose.common']); freeTavi(); enter2('loom-done'); }); return; }
      if (b === 'loom') { if (mira) mira.visible = false; beat = 'loom'; world.show('next', true); world.show('route', true); skyShown = true; readyLoom(() => { landOnLoom(); }); return; }
      if (b === 'isle') { if (mira) mira.visible = false; skiff.showLantern(); setTimeout(fly, 50); return; }
      story.dialogue('intro', { play: () => { g.startControlHints(); enter('meet'); } });
    },
    tick(dt: number) {
      t += dt; tickHolo(dt); sparkFx.tick(dt); const z = o.zip();
      const sky = beat === 'fly' || beat === 'isle' || beat.startsWith('loom') || beat === 'to-loom';
      if (sky !== skyShown) { skyShown = sky; world.show('next', sky); world.show('route', sky); }
      if (sky) world.tick(z);
      for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= t) { const f = timers[i].fn; timers.splice(i, 1); f(); }
      skiff.tick(dt); flight.tick(dt); engine.tick(dt); bells?.tick(dt, beat === 'fly' ? null : o.zip(), t); if (echo.enabled) echo.tick(dt);
      if (beat === 'fly') { shown = '#'; return; }
      // Zip's commentary: suspicious townsfolk, and a nudge when the player idles
      const free = !g.cardOpen && cut < 0 && !skiff.active && !isle.busy && (beat === 'meet' || beat === 'spark' || beat === 'skiff' || beat === 'isle');
      idleT = free && z.distanceTo(lastZip) < .005 ? idleT + dt : 0; lastZip.copy(z);
      if (idleT > 22) { idleT = 0; if (!story.thinkOnce('idle1')) story.thinkOnce('idle2'); }
      if (free && beat !== 'isle') for (const f of folk) {
        if (Math.hypot(f.position.x - z.x, f.position.z - z.z) > 2.8) continue;
        if (!firstNpc) { firstNpc = f; npcAt = t; story.thinkOnce('npc'); }
        else if (f !== firstNpc && t - npcAt > 12) story.thinkOnce('npc2');
        break;
      }
      dimK += (dimTo - dimK) * Math.min(1, dt * 1.5); o.dim(dimK);
      if (spark.visible) { spark.rotation.y += dt * 3; sparkHalo.scale.setScalar(1 + .25 * Math.sin(t * 5)); }
      // a column of light over the spark while it's loose, so it can be found from across the garden
      g.label('bell-garden', beat === 'spark' && !g.cardOpen && Math.hypot(z.x - SPARK_AT.x, z.z - SPARK_AT.z) < 22 && Math.hypot(z.x - SPARK_AT.x, z.z - SPARK_AT.z) > 3 ? story.label('bellGarden') : null, tmpLabel.set(SPARK_AT.x, 2.4, SPARK_AT.z));
      sparkPillar.mesh.visible = spark.visible && beat === 'spark'; if (sparkPillar.mesh.visible) sparkPillar.set(spark.position, spark.position.clone().setY(spark.position.y + 7), .045);
      if (beat === 'spark' && spark.visible) {
        if (hopT >= 0) {
          hopT += dt / .75; const k = Math.min(1, hopT);
          spark.position.lerpVectors(hopFrom, hopTo, k).setY(.6 + Math.sin(k * Math.PI) * 1.6);
          if (k >= 1) { hopT = -1; sparkHome.copy(hopTo); rest = .35; g.setBeacon(sparkHome); }
        } else {
          rest = Math.max(0, rest - dt);
          const tired = hops >= 4, d = Math.hypot(z.x - sparkHome.x, z.z - sparkHome.z);
          spark.position.set(sparkHome.x, .6 + Math.sin(t * (tired ? 1.2 : 3)) * (tired ? .05 : .15), sparkHome.z);
          if (d < .9) catchSpark();
          else if (!tired && d < 2.1 && rest <= 0 && !g.cardOpen) hop(z);
        }
      }
      if (cut >= 0) {
        // the shield moment plays in slow motion, so there's time to decide to be brave
        const c0 = cut; cut += dt * (cut > 2.3 && cut < 3.7 && !shielded ? .35 : 1); const c = cut;
        if (c < 2.5) ship.position.lerpVectors(far, hover, T.MathUtils.smoothstep(c, 0, 2.5));
        else if (c > 7) ship.position.lerpVectors(hover, far, T.MathUtils.smoothstep(c, 7, 9)).y += (c - 7) * 2;
        ship.rotation.y = Math.atan2(o.camera.position.x - ship.position.x, o.camera.position.z - ship.position.z) * .85 + Math.sin(t * .8) * .15; ship.rotation.z = Math.sin(t * .8 + .6) * .07; ship.position.y += Math.sin(t * 1.7) * .25 * dt; eye.scale.setScalar(1 + .12 * Math.sin(t * 8));
        beam.visible = c > 2.4 && c < 5.2; beamMat.opacity = beam.visible ? .35 + .15 * Math.sin(t * 14) : 0;
        if (beam.visible) { const from = miraAt.clone().setY(.3); tmp.copy(ship.position).sub(from); beam.position.copy(from).addScaledVector(tmp, .5); beam.scale.set(.8, tmp.length(), .8); beam.quaternion.setFromUnitVectors(up, tmp.normalize()); }
        if (mira && c > 2.8 && c < 5) { const k = T.MathUtils.smoothstep(c, 2.8, 4.8); mira.position.lerpVectors(miraAt, hover.clone().setY(hover.y - .9), k); mira.scale.setScalar(1 - k * .7); mira.rotation.y += dt * 2; }
        if (mira && c0 < 5 && c >= 5) mira.visible = false;
        bolt.visible = c > 4.8 && c < 5.2;
        if (bolt.visible) { const from = z.clone().setY(1.1); tmp.copy(ship.position).sub(from); bolt.position.copy(from).addScaledVector(tmp, .5); bolt.scale.set(1, tmp.length(), 1); bolt.quaternion.setFromUnitVectors(up, tmp.normalize()); }
        if (c > 2.3 && c < 3.7 && !shielded) action(S.labels.shieldMira, shield); else action(null);
        if (dash >= 0) {
          dash += dt; const zz = o.zip();
          if (dash < .3) { tmp.lerpVectors(dashFrom, dashTo, dash / .3); o.teleport(tmp.x, tmp.z, ZIP_FACE); }
          else if (dash < .75) { if (dash - dt < .3) { sfx.zap(); sfx.thud(); story.toast('zap', 700); } tmp.lerpVectors(dashTo, dashFrom.clone().addScaledVector(dashFrom.clone().sub(miraAt).setY(0).normalize(), .6), T.MathUtils.smoothstep(dash, .3, .75)); o.teleport(tmp.x, tmp.z, ZIP_FACE); }
          else dash = -1;
          void zz;
        }
        if (c0 < 2.4 && c >= 2.4) { sfx.hum(2); shake = Math.max(shake, .12); }
        if (c0 < .4 && c >= .4) { sfx.rumble(.6); const l = life(); if (l) l.alarm = ship.position; }
        if (c0 < 2 && c >= 2) { bells?.nudge(.9); skiff.gust(1); shake = Math.max(shake, .18); sfx.rumble(.8); }
        if (c0 < 3.8 && c >= 3.8) story.line('warden', shielded ? 'shielded' : 'start');
        if (c0 < 5 && c >= 5) { sparkFrom.copy(z).setY(1.2); spark.visible = true; sfx.zap(); sfx.static(); sfx.rumble(1); shake = .55; bells?.nudge(1.3); skiff.gust(1.6); story.line('bolt'); }
        shake *= Math.exp(-dt * 2.6);
        if (c0 < 6.8 && c >= 6.8) bells?.nudge(.8);   // the spark lands in the bell garden: every bell rings
        if (c > 5 && c < 6.8) { const k = (c - 5) / 1.8; spark.position.lerpVectors(sparkFrom, SPARK_AT, k); spark.position.y = T.MathUtils.lerp(1.2, .6, k) + Math.sin(k * Math.PI) * 4; }
        if (c0 < 7.2 && c >= 7.2) { g.close(); streamWakes(); }
        if (c > 7.5 && c < 26 && (!g.thinking || c > 9.5)) cut = 26;   // no long empty shot; the thoughts carry on in play
        if (cut >= 26) endAttack();
        return;
      }
      if (beat === 'isle') { const a = isle.tick(dt, z); if (!g.cardOpen && a) action(a.label, a.use); else action(null); return; }
      if (beat === 'to-loom') { isle.tick(dt, z); if (!g.cardOpen && Math.hypot(z.x - MOOR.x, z.z - MOOR.z) < 2.2) action(stop2.label('board'), board); else action(null); return; }
      if (beat.startsWith('loom')) {
        if (taviFree >= 0 && taviFree < 1) { taviFree = Math.min(1, taviFree + dt / 1.2); cloth.position.y = LOOM_AT.y + .95 - taviFree * 1.2; (cloth.material as T.MeshLambertMaterial).opacity = .92 * (1 - taviFree); tavi.position.z = LOOM_AT.z - .75 + taviFree * 1.9; if (taviFree >= 1) cloth.visible = false; }
        taviHead.position.y = 1.2 + Math.sin(t * 2) * .02;
        if (beat === 'loom' && !g.cardOpen && !loom.active && Math.hypot(z.x - LOOM_TALK.x, z.z - LOOM_TALK.z) < LOOM_STATION.place.r) action(LOOM_STATION.action, talkLoom);
        else if (beat === 'loom-puzzle' && !g.cardOpen && !loom.active && Math.hypot(z.x - LOOM_TALK.x, z.z - LOOM_TALK.z) < LOOM_STATION.place.r) action(LOOM_STATION.action, talkLoom);
        else action(null);
        return;
      }
      if (skiff.active) { shown = '#'; return; }
      if (g.cardOpen) { action(null); return; }
      const near = (p: T.Vector3, r: number) => Math.hypot(z.x - p.x, z.z - p.z) < r;
      if (beat === 'meet' && near(miraAt, 2.4)) action(S.labels.talkMira, talk);
      else if (beat === 'skiff' && ECHO) {
        // words first (a source in reach wins), then the engine at the pilot stone
        const a = echo.action(z);
        if (a) action(a.label, a.use);
        else if (near(PILOT_STONE, ECHO_SKIFF_STATION.place.r)) action(ECHO_SKIFF_STATION.action, openEngine);
        else action(null);
        if ((gatherT -= dt) <= 0) { gatherT = .8; gatherGoal(); }
      }
      else if (beat === 'skiff' && near(PILOT_STONE, SKIFF_ST.place.r)) action(SKIFF_ST.action, speakSkiff);
      else action(null);
    },
  };
}
export type Story = ReturnType<typeof buildStory>;
