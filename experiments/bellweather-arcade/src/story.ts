import * as T from 'three';
import type { Guide } from './guide';
import { buildSkiffPuzzle, PILOT_STONE, type LearningEvent } from './speech-puzzle';
import { buildIsland } from './island';
import { loadKit, loadProp } from './kit/kit';
import { lambertize } from './painted';
import { createWorld } from './kit/world';
import { SKY_ROUTE } from './worlds/sky-route';
import { LOOM_ISLE } from './worlds/loom-isle';
import { CHIME_ISLE } from './worlds/chime-isle';
import { STOP3_STORY, CHIME_STATION, CHIME_RULES } from './worlds/stop3-chime';
import { buildChime } from './chime';
import type { Townsperson } from './townsfolk-rig';
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
import { buildEngine, ZIP_AWAKE } from './engine-holo';
import { buildVoiceMoment } from './voice-moment';
import { buildFinds } from './kit/finds';
import { FIRST_WORDS_FINDS } from './worlds/first-words-finds';
import { GAME } from './game';
import { createSwingers } from './kit/swing';
import { loadBodyKit, assembleLook } from './kit/body-kit';
import { clearSight } from './canopy';
import { tickHolo, beam as holoBeam, sparks as holoSparks, HOLO } from './kit/holo';
import { ZIP_CLARITY } from './worlds/first-words-voice';
import { buildFarNet } from './kit/far-net';
import { DEMO_END } from './worlds/first-words-demo';
import { PROLOGUE } from './worlds/first-words-prologue';
import { SPIRE } from './worlds/first-words-spire';
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
  /** hold a time of day over the place's own (kit/sky-mood force): name, how much (0 … 1); null releases */
  moodForce?: (name: string | null, k?: number) => void;
  /** a person of the world (animated, seeded look), for isles with their own folk; null without the body kit */
  person?: (seed: number) => Townsperson | null;
  camera: T.Camera;
  /** how far the camera can go from `from` toward `to` before something solid */
  cameraClear?: (from: T.Vector3, to: T.Vector3) => number;
}
type Beat = 'meet' | 'attack' | 'spark' | 'skiff' | 'puzzle' | 'fly' | 'isle' | 'to-loom' | 'loom' | 'loom-puzzle' | 'loom-done' | 'to-chime' | 'chime' | 'chime-puzzle' | 'chime-done';

// Fixed staging at the outlook: Zip's mark facing Mira, and a camera that sees
// both of them against the open sky (the outlook sits under a canopy).
const ZIP_MARK = new T.Vector3(3.4, .13, -9.4), ZIP_FACE = -.886, CAM = new T.Vector3(3.3, 1.9, -5.4);
const SKIFF_ST = station('wake-skiff');
const aimV = new T.Vector3();   // the camera's look, for prompts that follow the player's aim (kit/target.ts)
export const SPARK_AT = new T.Vector3(-2, .13, 1.5);   // in the bell garden, by the pink bed
// the bell frame stands over the garden's north entrance (the passage from the outlook)
const BELL_FRAME = new T.Vector3(1.25, .13, -2.1);

export function buildStory(scene: T.Scene, o: Opts) {
  const g = o.guide;
  const skiff = buildSkiffPuzzle(scene, { guide: g, host: o.host, solid: o.solid, onEvent: o.onEvent, aspect: o.aspect });
  const isle = buildIsland(scene, { guide: g, host: o.host, camera: o.camera, addBox: o.addBox, removeBox: o.removeBox, solid: o.solid, addWalk: o.addWalk, onEvent: o.onEvent, onOpen: () => save.set('gate-open'), onMiss: () => story.thinkOnce('gate-engine'), onDone: () => toLoom(), setGoal: (t, b, a) => goal(t, b, a), adopt: o.adopt, density: o.density });
  // the next island on the route, dressed from its own world spec (seen from Blossom Isle)
  // the sky beyond Bellweather: the next island and generated scenery islands
  // along the flight, shown only once Zip is in the air or on the islands
  const world = createWorld(scene, loadKit('nature-meadow'), { density: o.density, props: BELLWEATHER_PROPS, adopt: o.adopt });
  world.show('next', false); world.show('route', false); world.show('next2', false);
  // the Warden's engine on the horizon, where the ship took Mira: a net like Zip's, but vast, its
  // activations climbing it day and night. Seen from the town from the start; nearer each isle.
  const FLIGHT_THOUGHTS = ['seatbelt', 'ring-1', 'ring-veteran', 'ring-miss', 'ring-reply', 'rude', 'warden-flight', 'spire-first', 'voice-is-engine'];
  const dn = o.density ?? .8, spire = buildFarNet(scene, { ...SPIRE, layers: dn >= 1 ? 24 : dn >= .8 ? 20 : 14, perLayer: dn >= 1 ? 120 : dn >= .8 ? 84 : 48 });
  (window as unknown as { __vlSpire?: typeof spire }).__vlSpire = spire;
  let spireAt = 0;   // it thinks, now and then: a wave of light from the foot to the crown
  world.add(LOOM_ISLE, 'next');
  world.add(CHIME_ISLE, 'next2');   // built once Zip is on Loom Isle (seen from there, the next isle on)
  for (const spec of SKY_ROUTE) world.add(spec, 'route');
  let skyShown = false;
  // the wind rings remind Zip of a certain old superhero game; the Warden has played it too
  const flight = buildFlight(scene, { guide: g, input: o.input, ride: o.ride,
    onRing: n => { if (n === 1) story.thinkOnce('ring-1'); if (n === 3 && story.thinkOnce('ring-veteran')) later(4.5, () => story.thinkOnce('ring-reply')); },
    onMiss: () => story.thinkOnce('ring-miss'), onLand: () => spire.surge(), onSpotted: () => { story.thinkOnce('rude'); story.thinkOnce('warden-flight'); } });
  g.setThinker(o.zip);
  // townsfolk (for Zip's NPC suspicions) and idle tracking
  const folk = (scene.getObjectByName('painted-life')?.children ?? []).filter(c => c.userData.fade && c.name !== 'Mira');
  let firstNpc: T.Object3D | null = null, npcAt = 0, idleT = 0; const lastZip = new T.Vector3();
  const mira = scene.getObjectByName('Mira'); if (mira) mira.userData.quiet = true;
  const miraAt = mira ? mira.position.clone() : new T.Vector3(5.3, .13, -10.95);
  // who can speak from where: speech bubbles and barks sit over these points (guide.anchor)
  const headOf = (o3: T.Object3D | null | undefined, y: number, out = new T.Vector3()) => () => o3 && o3.visible ? out.copy(o3.position).setY(o3.position.y + y * o3.scale.y) : null;
  g.anchor('Mira', headOf(mira, 2.0));
  // two neighbours near the outlook react out loud to the attack
  const byMira = [...folk].sort((a, b) => a.position.distanceToSquared(miraAt) - b.position.distanceToSquared(miraAt));
  g.anchor('Neighbour', headOf(byMira[0], 2.0)); g.anchor('Gardener', headOf(byMira[1], 2.0));

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
  const shipVoice = new T.Vector3(); g.anchor('Warden', () => ship.visible ? shipVoice.copy(ship.position).setY(ship.position.y + 1.4) : null);
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
  const letterbox = document.createElement('div'); letterbox.className = 'letterbox'; letterbox.innerHTML = '<i></i><i></i>'; o.host.appendChild(letterbox);
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
  const voiceMoment = buildVoiceMoment(scene, o.camera, o.zip);
  (window as unknown as { __vlVoice?: typeof voiceMoment }).__vlVoice = voiceMoment;   // tests
  // stray sparks of his voice, off the beaten path: each found lights a little more of his net, and a
  // glimpse of it shows over his head as it does
  const awakeBase = () => beat === 'chime-done' ? ZIP_AWAKE.chime : beat === 'loom-done' || beat === 'to-chime' || beat.startsWith('chime') ? ZIP_AWAKE.loom : (['meet', 'attack', 'spark', 'skiff', 'puzzle'] as Beat[]).includes(beat) ? ZIP_AWAKE.start : ZIP_AWAKE.skiff;
  const finds = buildFinds(scene, { specs: FIRST_WORDS_FINDS, key: GAME.storage.finds ?? 'vibelearn.finds', color: HOLO.made, camera: o.camera, onFind: (_s, n, total) => {
    const b = awakeBase() + (n - 1) * ZIP_AWAKE.find; voiceMoment.play(b, b + ZIP_AWAKE.find, undefined, true); sfx.chime();
    // the count first, over the glimpse of his net; his thought once it has gone
    g.toast(`✦ Stray spark ${n} of ${total}`, 4500);   // (run 28 took one and never knew)
    later(3.3, () => { if (n === 1) story.thinkOnce('stray-first'); else if (n === total) story.thinkOnce('stray-all'); });
  }, onNear: () => sfx.bell(4, .35) });   // a faint chime the first time one is near: findable by ear
  (window as unknown as { __vlFinds?: typeof finds }).__vlFinds = finds;   // tests
  // arriving on an isle with sparks still out there, Zip feels them (run 28: "nothing reminded me")
  const strayHint = (isle: 'blossom' | 'loom') => { if (finds.open.some(f => f.id.startsWith(isle))) story.thinkOnce('strays-' + isle); };
  const bonus = () => finds.count * ZIP_AWAKE.find;
  const engine = buildEngine(scene, {
    guide: g, host: o.host, camera: o.camera, station: echoSt, zip: o.zip,
    carried: () => echo.carried, carry: w => echo.carry(w), target: () => skiff.at(), hear: k => skiff.hear(k),
    onThought: id => story.thinkOnce(id), bonus,
    onComplete: () => { echo.showOrbit(true); later(.3, () => echoSt.finish(() => story.dialogue('awake-echo', { board: () => { fly(); later(1.5, () => story.thinkOnce('voice-is-engine')); later(13, () => { spire.surge(); story.thinkOnce('spire-first'); }); } }))); },
  });
  const openEngine = () => {
    action(null); enter('puzzle'); o.teleport(PILOT_STONE.x, PILOT_STONE.z + 1.2, 0); echo.showOrbit(false);
    engine.open(new T.Vector3(PILOT_STONE.x - .55, 2.8, PILOT_STONE.z - .15), () => { echo.showOrbit(true); beat = 'skiff'; gatherGoal(); });
  };

  // ── Stop 2: Loom Isle. Its story, station and rules are data (worlds/stop2-loom.ts) ──
  const toXZ = (id: string) => { const [x, z] = entityAt(LOOM_ISLE, id); return new T.Vector3(x, (LOOM_ISLE.elevation ?? 0) + .13, z); };
  const MOOR = isle.landing.clone().add(new T.Vector3(-3.2, 0, .8)), LOOM_LAND = toXZ('loom-landing'), LOOM_AT = toXZ('word-loom');
  const stop2 = createScriptRunner(STOP2_STORY, g, {
    anchors: { skiffMoor: () => MOOR, 'word-loom': () => LOOM_AT },
    onBeat: b => { if (b.checkpoint) save.set(b.checkpoint as Checkpoint); if (b.place) placeName = b.place; },
    later,
  });
  for (const i of validateScript(STOP2_STORY)) (i.level === 'error' ? console.error : console.warn)(`[story] ${i.where}: ${i.msg}`);
  const enter2 = (b: Beat) => { beat = b; stop2.enter(b); };
  const loomSt = createStation(LOOM_STATION, { onEvent: o.onEvent, stars: (title, rows, then) => g.stars(title, rows, then) }, LOOM_RULES);
  // the loom's own slots in the world light as the console's rail fills: gold for each piece that
  // lands, violet-red for a call that spills, all bright when it weaves (the console covers the lower
  // screen; the loom stands above it)
  const loomGlow = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; { const c = cv.getContext('2d')!, gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); }
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
    const mats = Array.from({ length: LOOM_STATION.content.slots }, () => new T.SpriteMaterial({ map: tex, color: '#ffd36b', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
    const sprites = mats.map((m, i, all) => { const sp = new T.Sprite(m); sp.scale.setScalar(.55); sp.position.set(-.95 + i * 1.9 / (all.length - 1), 2.52, .08); return sp; });
    let host: T.Object3D | null = null, t0 = -1, n = 0, ok = false, tt = 0;
    const gold = new T.Color('#ffd36b'), bad = new T.Color('#ff6a9a');
    return {
      weave(pieces: number, good: boolean) {
        if (!host) { scene.traverse(x => { if (!host && x.name === 'Prop_word_loom') host = x; }); if (host) sprites.forEach(sp => host!.add(sp)); }
        t0 = 0; n = pieces; ok = good;
      },
      tick(dt: number) {
        if (t0 < 0) return; t0 += dt; tt += dt;
        mats.forEach((m, i) => {
          const on = t0 > i * .11 + .08, spill = !ok && t0 > n * .11 + .3;
          m.color.copy(spill ? bad : gold);
          const done = ok && t0 > n * .11 + .5;
          m.opacity = !on ? 0 : spill ? .55 + .35 * Math.abs(Math.sin(tt * 9)) : done ? .9 + .1 * Math.sin(tt * 4 + i) : .75;
        });
        if (!ok && t0 > n * .11 + 2.6) { t0 = -1; mats.forEach(m => (m.opacity = 0)); }
      },
      clear() { t0 = -1; mats.forEach(m => (m.opacity = 0)); },
    };
  })();
  // at the loom, a shot that keeps the loom (its slots, its band) in the top half of a phone, above the console
  const loomShotV = { pos: new T.Vector3(), look: new T.Vector3() }; let loomObj: T.Object3D | null = null;
  const loomShot = () => {
    if (!loom.active) return null;
    if (!loomObj) scene.traverse(x => { if (!loomObj && x.name === 'Prop_word_loom') loomObj = x; }); if (!loomObj) return null;
    const p = (loomObj as T.Object3D).getWorldPosition(loomShotV.look), portrait = o.aspect() < .8;
    loomShotV.pos.set(p.x + 1.7, p.y + (portrait ? 2.4 : 2.0), p.z + (portrait ? 6.2 : 5.2)); loomShotV.look.set(p.x, p.y + (portrait ? .2 : 1.4), p.z);   // (a little to the side: Zip stands in front of the loom)
    return loomShotV;
  };
  const loom = buildLoom({ guide: g, host: o.host, station: loomSt, onWeave: (n, good) => loomGlow.weave(n, good), onShake: () => later(.4, () => stop2.thinkOnce('loom-warden')), onDone: () => loomSt.finish(() => {
    freeTavi(); stop2.dialogue('thanks', { endStop: () => {
      // another piece of his voice is back: his net shows above him and more of it lights
      // (his thought while it lights, not after: run 27 heard "Another coil lit" with nothing lit on screen)
      enter2('loom-done'); later(.4, () => voiceMoment.play(ZIP_AWAKE.skiff + bonus(), ZIP_AWAKE.loom + bonus(), () => later(4, () => { stop2.thinkOnce('loom-pieces'); later(5, () => enter3('to-chime')); })));
      later(2.2, () => story.thinkOnce('voice-back'));
    } });
  }) });
  // Tavi, the weaver, is stuck behind the loom's cloth: a voice and a shadow until freed
  const tavi = new T.Group(); tavi.position.copy(LOOM_AT).add(new T.Vector3(0, -.13, -.75)); tavi.visible = false; scene.add(tavi);
  const taviBody = new T.Mesh(new T.CapsuleGeometry(.24, .62, 6, 12), new T.MeshLambertMaterial({ color: '#c46a4e' })); taviBody.position.y = .6; tavi.add(taviBody);
  const taviHead = new T.Mesh(new T.SphereGeometry(.2, 16, 12), new T.MeshLambertMaterial({ color: '#e8b48c' })); taviHead.position.y = 1.2; tavi.add(taviHead);
  const taviAt = new T.Vector3(); g.anchor('Tavi', () => tavi.visible ? taviHead.getWorldPosition(taviAt).setY(taviAt.y + .45) : null);
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
    later(9, () => strayHint('loom'));
  };
  const toLoom = () => { enter2('to-loom'); };
  // the hop to Loom Isle is flown too, a short lane of four rings and no drones (run 27: it was a cut,
  // "a little disappointing after the first one")
  const flyLoom = () => {
    const boat = boatRef ?? (() => { const b = skiff.release(); b.position.set(MOOR.x, b.position.y, MOOR.z); return b; })(); boatRef = boat;
    enter('fly'); isle.leave(); o.teleport(o.zip().x, o.zip().z, 0);
    const a = boat.position.clone(), b = LOOM_LAND.clone(), side = new T.Vector3(-(b.z - a.z), 0, b.x - a.x).normalize(), up = LOOM_ISLE.elevation ?? 0;
    const lane = [.2, .4, .6, .8].map(k => a.clone().lerp(b, k).addScaledVector(side, Math.sin(k * Math.PI * 2) * 7).setY(8 + up * k + Math.sin(k * Math.PI) * 3));
    flight.start(boat, LOOM_LAND, () => { g.hush(FLIGHT_THOUGHTS); boat.position.set(LOOM_LAND.x - 1.6, boat.position.y, LOOM_LAND.z + .2); landOnLoom(); }, { reveal: LOOM_AT, lane, drones: false, arrive: 'Loom Isle!', goal: 'Fly to Loom Isle' });
  };
  const board = () => { action(null); stop2.dialogue('hop', { board: () => readyLoom(flyLoom) }); };
  const talkLoom = () => { action(null); enter2('loom-puzzle'); loomSt.state.phase === 'guided' ? stop2.dialogue('tavi', { openLoom: () => loom.open() }) : loom.open(); };

  // ── Stop 3: Chime Isle (sampling and warmth). Story, station, rules: worlds/stop3-chime.ts; the isle:
  // worlds/chime-isle.ts; the console: chime.ts ──
  const chimeXZ = (id: string) => { const [x, z] = entityAt(CHIME_ISLE, id); return new T.Vector3(x, (CHIME_ISLE.elevation ?? 0) + .13, z); };
  const MOOR2 = LOOM_LAND.clone().add(new T.Vector3(-1.6, 0, .2)),   // (by the landing, in reach from walkable ground: flowcheck)
    CHIME_LAND = chimeXZ('chime-landing'), CHIME_AT = chimeXZ('chime-tower'), ORIEL_AT = chimeXZ('bard-oriel'), CROWD_AT = chimeXZ('crowd');
  const stop3 = createScriptRunner(STOP3_STORY, g, {
    anchors: { chimeMoor: () => MOOR2, 'chime-tower': () => CHIME_AT },
    onBeat: b => { if (b.checkpoint) save.set(b.checkpoint as Checkpoint); if (b.place) placeName = b.place; },
    later,
  });
  for (const i of validateScript(STOP3_STORY)) (i.level === 'error' ? console.error : console.warn)(`[story] ${i.where}: ${i.msg}`);
  const enter3 = (b: Beat) => { beat = b; stop3.enter(b); };
  const chimeSt = createStation(CHIME_STATION, { onEvent: o.onEvent, stars: (title, rows, then) => g.stars(title, rows, then) }, CHIME_RULES);
  // the tower's moving parts (bells, lock wheel, vault door), found once the isle is dressed
  const tower = { root: null as T.Object3D | null, bells: [] as { p: T.Object3D; v: number; a: number }[], lock: null as T.Object3D | null, door: null as T.Object3D | null, spinT: 0, jamT: 0, doorK: 0, doorTo: 0 };
  const findTower = () => {
    if (tower.root) return true;
    scene.traverse(x => { if (!tower.root && x.name === 'chime-tower') tower.root = x; }); if (!tower.root) return false;
    (tower.root as T.Object3D).traverse(x => { if (/^chime-bell-/.test(x.name)) tower.bells.push({ p: x, v: 0, a: 0 }); if (x.name === 'chime-lock') tower.lock = x; if (x.name === 'chime-door') tower.door = x; });
    return true;
  };
  const ringBells = (k = 1, chord = false) => { if (!findTower()) return; tower.bells.forEach((b, i) => { b.v += (chord ? 2.4 : 1.2) * k * (i % 2 ? 1 : -1); if (chord) setTimeout(() => sfx.bell([0, 2, 4, 7, 9, 12][i % 6], .6), i * 140); }); };
  // Oriel the bard and a small crowd, from the game's people (main supplies them)
  const people: { p: Townsperson; face: number }[] = [];
  let oriel: (typeof people)[number] | null = null;
  const placePeople = () => {
    if (people.length || !o.person) return;
    const face = (x: number, z: number) => Math.atan2(CHIME_AT.x - x, CHIME_AT.z - z);
    const add = (seed: number, x: number, z: number) => { const p = o.person!(seed); if (!p) return null; p.root.position.set(x, CHIME_AT.y, z); p.root.rotation.y = face(x, z); scene.add(p.root); o.solid(x, z, .36); const e = { p, face: p.root.rotation.y }; people.push(e); return e; };
    oriel = add(211, ORIEL_AT.x, ORIEL_AT.z);
    for (const [dx, dz, seed] of [[-1.2, .4, 301], [0, 1.1, 302], [1.1, .5, 303], [-.4, -.7, 304]] as const) add(seed, CROWD_AT.x + dx, CROWD_AT.z + dz);
  };
  const orielAt = new T.Vector3(); g.anchor('Oriel', () => oriel ? oriel.p.headTop.getWorldPosition(orielAt) : null);
  const crowd = (what: 'cheer' | 'groan' | 'laugh') => people.forEach((e, i) => { if (e === oriel) return; if (what === 'cheer') setTimeout(() => e.p.wave(), i * 120); else e.p.setBase('Talk'); setTimeout(() => e.p.setBase('Idle'), 2600); });
  const chime = buildChime({ guide: g, host: o.host, station: chimeSt,
    onWorld: (what) => {
      if (what === 'cast') { ringBells(.5); tower.spinT = .8; }
      if (what === 'vault-opens') { tower.doorTo = 1; ringBells(1.2, true); spire.surge(); }
      if (what === 'lock-grinds') tower.jamT = .7;
      if (what === 'lock-jams') { tower.jamT = 1.4; later(.4, () => stop3.thinkOnce('chime-warden')); }
      if (what === 'crowd-cheers') { crowd('cheer'); ringBells(1.6, true); spire.surge(); }
      if (what === 'heard-it') crowd('groan');
      if (what === 'word-salad') crowd('laugh');
    },
    onDone: () => chimeSt.finish(() => stop3.dialogue('thanks', { endStop3: () => {
      enter3('chime-done'); later(.4, () => voiceMoment.play(ZIP_AWAKE.loom + bonus(), ZIP_AWAKE.chime + bonus(), () => { later(3, () => stop3.thinkOnce('chime-done')); later(3 + DEMO_END.delay, () => startEnding()); }));
      later(2.2, () => story.thinkOnce('voice-back'));
    } })) });
  // The demo's end: the camera rises behind Zip toward the Warden's engine at dusk, it surges, Zip
  // says what he sees, and a card closes the demo (keep exploring, or back to the title).
  let ending = -1; const endV = { pos: new T.Vector3(), look: new T.Vector3() }, endFrom = new T.Vector3();
  const endCard = document.createElement('div'); endCard.className = 'demo-end'; endCard.hidden = true; o.host.appendChild(endCard);
  const startEnding = () => {
    if (ending >= 0 || beat !== 'chime-done' || chime.active) return;
    // Zip steps to the landing, at the isle's edge facing the engine (from the tower the lens would be in it)
    const d = SPIRE_MID.clone().sub(CHIME_LAND).setY(0).normalize();
    o.teleport(CHIME_LAND.x, CHIME_LAND.z - 1.2, Math.atan2(-d.x, -d.z));
    ending = 0; endFrom.copy(o.zip()); o.host.classList.add('cutscene');
    later(1.6, () => spire.surge()); later(3.2, () => g.think(DEMO_END.thought.text as string[] | string)); later(5.5, () => spire.surge());
    later(8.5, () => {
      const f = finds.count, n = finds.total, C = DEMO_END.card;
      endCard.innerHTML = `<div class="demo-end-card"><h2></h2>${C.lines.map(() => '<p></p>').join('')}<p class="demo-end-sparks"></p><div class="demo-end-row"><button type="button" data-act="stay" class="primary"></button><button type="button" data-act="title"></button></div></div>`;
      endCard.querySelector('h2')!.textContent = C.title;
      endCard.querySelectorAll('p:not(.demo-end-sparks)').forEach((p, i) => { p.textContent = C.lines[i]; });
      const left = new Map<string, number>(); for (const sp of FIRST_WORDS_FINDS) if (!finds.has(sp.id)) { const pl = C.place(sp.id); left.set(pl, (left.get(pl) ?? 0) + 1); }
      endCard.querySelector('.demo-end-sparks')!.textContent = C.sparks(f, n, [...left]);
      (endCard.querySelector('[data-act=stay]') as HTMLButtonElement).textContent = C.stay;
      (endCard.querySelector('[data-act=title]') as HTMLButtonElement).textContent = C.title_;
      endCard.hidden = false; (endCard.querySelector('[data-act=stay]') as HTMLButtonElement).focus();
    });
  };
  endCard.addEventListener('click', e => {
    const act = (e.target as HTMLElement).closest('button')?.dataset.act; if (!act) return;
    if (act === 'title') { location.reload(); return; }
    endCard.hidden = true; ending = -1; o.host.classList.remove('cutscene');
  });
  const endShot = () => {
    if (ending < 0) return null;
    const k = T.MathUtils.smootherstep(Math.min(ending / 9, 1), 0, 1), dir = SPIRE_MID.clone().sub(endFrom).setY(0).normalize();
    endV.pos.copy(endFrom).addScaledVector(dir, -(3.4 + 4.2 * k)).setY(endFrom.y + 1.7 + 2.6 * k);
    endV.look.copy(endFrom).addScaledVector(dir, 12).setY(endFrom.y + 2.6).lerp(SPIRE_MID, .03 + .05 * k).y += 9 * k;
    return endV;
  };
  // at the tower, a shot that keeps the tower and its bells in the top half of a phone, above the console
  const chimeShotV = { pos: new T.Vector3(), look: new T.Vector3() };
  const chimeShot = () => {
    if (!chime.active) return null;
    const portrait = o.aspect() < .8, p = CHIME_AT;
    chimeShotV.pos.set(p.x + 2.4, p.y + (portrait ? 3.4 : 2.6), p.z + (portrait ? 10.5 : 8.5)); chimeShotV.look.set(p.x, p.y + (portrait ? 1.6 : 3.2), p.z);
    return chimeShotV;
  };
  let chimeReady = false;
  const readyChime = (then: () => void) => {
    world.show('next2', true);
    const built = world.islands.find(i => i.spec.id === CHIME_ISLE.id);
    if (!built) { setTimeout(() => readyChime(then), 200); return; }
    if (!chimeReady) {
      chimeReady = true;
      o.addWalk(CHIME_ISLE.center[0], CHIME_ISLE.center[1], CHIME_ISLE.radius * .86);
      for (const sld of built.d.solids) o.solid(sld.x, sld.z, sld.r);
      o.solid(CHIME_AT.x, CHIME_AT.z, 1.45);
      placePeople(); findTower();
    }
    o.enterIsland(built.d.cameraBlockers.filter(b => b.name !== 'island-rock'));
    then();
  };
  const landOnChime = () => {
    o.setGround?.((CHIME_ISLE.elevation ?? 0)); enter3('chime'); o.teleport(CHIME_LAND.x, CHIME_LAND.z - 1.2, 0);
  };
  // the hop to Chime Isle: flown, a lane of five rings, no drones yet
  const flyChime = () => {
    const boat = boatRef ?? (() => { const b = skiff.release(); b.position.set(MOOR2.x, b.position.y, MOOR2.z); return b; })(); boatRef = boat;
    boat.position.set(MOOR2.x, (LOOM_ISLE.elevation ?? 0) + .6, MOOR2.z);
    enter('fly'); o.teleport(o.zip().x, o.zip().z, 0);
    const a = boat.position.clone(), b = CHIME_LAND.clone(), side = new T.Vector3(-(b.z - a.z), 0, b.x - a.x).normalize(), up0 = LOOM_ISLE.elevation ?? 0, up1 = CHIME_ISLE.elevation ?? 0;
    const lane = [.17, .34, .5, .67, .84].map(k => a.clone().lerp(b, k).addScaledVector(side, Math.sin(k * Math.PI * 2) * 8).setY(9 + up0 + (up1 - up0) * k + Math.sin(k * Math.PI) * 4));
    flight.start(boat, CHIME_LAND, () => { g.hush(FLIGHT_THOUGHTS); boat.position.set(CHIME_LAND.x - 3, boat.position.y, CHIME_LAND.z + 1); landOnChime(); }, { reveal: CHIME_AT, lane, drones: false, arrive: 'Chime Isle!', goal: 'Fly to Chime Isle' });
  };
  const board3 = () => { action(null); stop3.dialogue('hop3', { board3: () => readyChime(flyChime) }); };
  const talkChime = () => { action(null); enter3('chime-puzzle'); chimeSt.state.phase === 'guided' ? stop3.dialogue('bard', { openChime: () => chime.open() }) : chime.open(); };
  const tickChime = (dt: number) => {
    for (const e of people) e.p.update(dt, 0, false);
    if (!tower.root) return;
    for (const b of tower.bells) { b.v += -b.a * 18 * dt - b.v * 2.2 * dt; b.a += b.v * dt; b.p.rotation.z = b.a * .35; }
    if (tower.lock) { if (tower.spinT > 0) { tower.spinT -= dt; tower.lock.rotation.z += dt * 9 * tower.spinT; } if (tower.jamT > 0) { tower.jamT -= dt; tower.lock.rotation.z += Math.sin(t * 60) * .04; } }
    if (tower.door) { tower.doorK += (tower.doorTo - tower.doorK) * Math.min(1, dt * 2); tower.door.position.y = .77 - tower.doorK * 1.2; tower.door.visible = tower.doorK < .98; }
  };
  const focusPt = new T.Vector3(), tmpLabel = new T.Vector3(), tmp2 = new T.Vector3(), tmp3 = new T.Vector3();
  const sparkFrom = new T.Vector3(), shotPos = new T.Vector3(), shotLook = new T.Vector3(), tmp = new T.Vector3();

  // The spark is playful: it hops away when Zip gets close, twice, then tires and
  // can be caught by touching it. Cornering it also works. It hops somewhere the
  // player can see (in front of the camera), so the chase is a game of tag, not a
  // search: three blind testers lost it behind them and circled the arch (5 Oct).
  const SPARK_HOPS = 2, CATCH_R = 1.3, camFwd = new T.Vector3();
  const sparkHome = new T.Vector3().copy(SPARK_AT), hopFrom = new T.Vector3(), hopTo = new T.Vector3();
  let hops = 0, hopT = -1, rest = 0;
  const toSpark = () => {
    cut = -1; skip.hidden = true; o.host.classList.remove('cutscene'); ship.visible = beam.visible = bolt.visible = false; if (mira) mira.visible = false; afterAttack();
    spark.visible = true; sparkHome.copy(SPARK_AT); spark.position.copy(sparkHome).setY(.6); dimTo = .35; hops = 0; hopT = -1;
    enter('spark');
  };
  const hop = (z: T.Vector3) => {
    // pick a spot 2.5-4 m away, walkable, inside the garden, away from Zip
    let best: T.Vector3 | null = null, bestD = -1;
    o.camera.getWorldDirection(camFwd); camFwd.y = 0; camFwd.normalize();
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, r = 2.5 + (i % 3) * .75, x = sparkHome.x + Math.cos(a) * r, zz = sparkHome.z + Math.sin(a) * r;
      if (Math.hypot(x - SPARK_AT.x, zz - SPARK_AT.z) > 4.5 || !o.walkable(x, zz)) continue;
      // in view: within about 45° of where the camera looks (spots behind it count for little)
      const cx = x - o.camera.position.x, cz = zz - o.camera.position.z, inView = (cx * camFwd.x + cz * camFwd.z) / Math.hypot(cx, cz) > .7;
      const d = Math.hypot(x - z.x, zz - z.z) * (inView ? 1 : .35); if (d > bestD) { bestD = d; best = new T.Vector3(x, .13, zz); }
    }
    if (!best || Math.hypot(best.x - z.x, best.z - z.z) < Math.hypot(sparkHome.x - z.x, sparkHome.z - z.z) + .5) { story.toast('sparkCornered', 1000); hops = 99; return; } // nowhere better to go
    hopFrom.copy(spark.position); hopTo.copy(best); hopT = 0; hops++; sfx.pop();
    if (hops === 1) { story.toast('sparkFlees', 1200); story.thinkOnce('chase'); } else if (hops === SPARK_HOPS) story.toast('sparkTiring', 1200);
  };
  const catchSpark = () => {
    // no card: the coil's discovery is Zip's own thought, and the first word shows how to take it
    later(1.2, () => story.thinkOnce(ECHO ? 'coil-new' : 'beep'));
    if (ECHO) later(5, () => streamWakes());
    // the catch: a burst of gold, and the spark streams into Zip's chest
    sparkFx.burst(spark.position, 28, 2.4, HOLO.made); later(.25, () => sparkFx.burst(o.zip().clone().setY(o.zip().y + 1), 18, 1.4, HOLO.made));
    beat = 'skiff'; spark.visible = false; sfx.chime(); sfx.speak(4); story.toast('sparkCaught', 1100);
    if (ECHO) later(.7, toSkiff); else later(.7, () => story.dialogue('coil', { afterCoil: toSkiff }));
  };
  const toSkiff = () => { afterAttack(); spark.visible = false; o.host.classList.remove('cutscene'); skiff.showLantern(); enter('skiff'); if (ECHO) { echo.enable(); gatherGoal(); } };
  let boatRef: T.Object3D | null = null;
  const fly = () => {
    enter('fly'); echo.enable(false); o.teleport(o.zip().x, o.zip().z, 0);
    const boat = skiff.release(); boatRef = boat;
    flight.start(boat, isle.landing, r => {
      // what was said about the flight stays in the flight (run 29: "Flying through rings…" and "Missed one" played after landing)
      g.hush(FLIGHT_THOUGHTS);
      if (r.rings === r.total) story.thinkOnce('ring-all');
      enter('isle'); o.enterIsland(isle.cameraBlockers); o.teleport(isle.landing.x - 1.2, isle.landing.z - 1.4, 0); boat.position.set(isle.landing.x - 3.2, boat.position.y, isle.landing.z + .8); dimTo = 0;
      story.stars('flight', [true, r.rings >= r.total - 1, r.spotted === 0], { ...r }, () => {
        isle.greet(() => { isle.arrive(); later(.6, () => story.thinkOnce('gate')); later(10, () => strayHint('blossom')); });
      });
    }, { reveal: isle.heart });
  };
  // The Stream: Zip and the Warden are the only awake machines, and nobody
  // knows. Without its speech engine an ordinary bot goes dark; Zip keeps
  // thinking, and the Warden hears it. That's what the attack was: a test.
  const streamWakes = () => {
    if (story.thinkOnce('stream-warden')) story.think('stream-zip');
  };
  const endAttack = () => {
    if (beat !== 'attack') return;
    shot = null; shake = 0; g.close();
    if (hat) { hat.position.copy(miraAt).add(new T.Vector3(.35, .015, .25)); hat.rotation.set(.18, 1.1, -.12); }
    if (mira) { mira.visible = false; mira.scale.setScalar(1); }
    toSpark();
    story.thinkOnce('mario'); story.thinkOnce('voice-gone');
  };
  skip.addEventListener('click', e => { e.stopPropagation(); if (opening >= 0) endOpening(); else endAttack(); });
  const far = miraAt.clone().add(new T.Vector3(4, 8, -18)), hover = miraAt.clone().add(new T.Vector3(1, 2.8, -2.7)), up = new T.Vector3(0, 1, 0);
  // it leaves over the town toward the Blossom Isle (where the player will follow)
  const away1 = new T.Vector3(2, 9, 3), away2 = new T.Vector3(-30, 40, 92);   // straight up out of the outlook, then away over the town, toward the Warden's engine on the horizon
  const hatFrom = new T.Vector3(), hatRest = new T.Vector3();
  // the directed sequence's current shot: a camera cut is a new `cut` number (main.ts snaps instead of gliding)
  let shot: { pos: T.Vector3; look: T.Vector3; shake?: number; cut?: number; rate?: number } | null = null;
  const sPos = new T.Vector3(), sLook = new T.Vector3(), zHead = new T.Vector3();
  // place a shot's camera: never behind a wall (slide toward the subject), and nothing close filling the frame edge
  // Place a shot's camera. Each shot offers a few camera spots (offsets from `base`); the first
  // with a clear line to the subject wins, chosen once per shot so the camera doesn't hop. A
  // shot never sits closer than `minD` to its subject (close things fade out of shots).
  const chosen = new Map<number, number>(), cand = new T.Vector3(), offV = new T.Vector3(), baseV = new T.Vector3();
  const subjV = new T.Vector3();
  // `subj`: what must be in clear sight (defaults to `look`; a sky shot looks up past a roof but must see Zip)
  const frame = (base: T.Vector3, offs: [number, number, number][], look: T.Vector3, id: number, rate = 4, minD = 3.7, subj?: T.Vector3) => {
    base = baseV.copy(base); const sub = subjV.copy(subj ?? look);
    let pick = chosen.get(id);
    if (pick === undefined) {
      let best = 0, bestScore = -1;
      offs.forEach((d, i) => {
        cand.copy(base).add(offV.set(d[0], 0, d[2])).setY(d[1]);
        const full = cand.distanceTo(sub), clear = o.cameraClear ? Math.min(full, o.cameraClear(sub, cand)) : full;
        const score = clear / full - i * .02;   // earlier spots are the director's preference
        if (clear >= full - .15 && bestScore < 1) { best = i; bestScore = 2; } else if (score > bestScore) { best = i; bestScore = score; }
      });
      pick = best; chosen.set(id, pick);
    }
    const d = offs[pick]; const pos = sPos.copy(base).add(offV.set(d[0], 0, d[2])).setY(d[1]);
    if (o.cameraClear) { const full = pos.distanceTo(sub), clear = o.cameraClear(sub, pos); if (clear < full - .2) pos.lerpVectors(sub, pos, Math.max(Math.min(1, minD / full), (clear - .3) / full)); }
    clearForeground(pos, look, Math.atan(Math.tan(26 * Math.PI / 180) * Math.max(.45, o.aspect())));
    shot = { pos, look: sLook.copy(look), shake, cut: id, rate }; return shot;
  };
  // Shield Mira: one brave, doomed button. Zip dashes in and is knocked back.
  let shielded = false, dash = -1; const dashFrom = new T.Vector3(), dashTo = new T.Vector3();
  const shield = () => { if (shielded) return; shielded = true; dash = 0; dashFrom.copy(o.zip()); dashTo.copy(miraAt).lerp(dashFrom, .45); sfx.whoosh(); action(null); };
  const startAttack = () => {
    chosen.clear(); cutHold = 0; shouted = false; marioAt = -1;
    g.close(); g.hush(['sim', 'npc', 'npc2', 'idle1', 'idle2']); talking = false; enter('attack'); cut = 0; skip.hidden = false; dimTo = 1; action(null);
    o.host.classList.add('cutscene'); ship.visible = true; ship.position.copy(far);
  };
  // The cold open: Mira calls from the outlook; the camera shows where she is, then hands over.
  let opening = -1, cutHold = 0, shouted = false, marioAt = -1;
  const SPIRE_MID = SPIRE.at.clone().add(new T.Vector3(0, SPIRE.height * .5, 0));
  const OPEN_CRANE = 4.2, CRANE_FROM = miraAt.clone().add(new T.Vector3(3, 24, -42)), CRANE_TO = miraAt.clone().add(new T.Vector3(1.2, 2.6, -4.6));
  const CRANE_LOOK_FROM = SPIRE.at.clone().add(new T.Vector3(0, SPIRE.height * .55, 0)).lerp(miraAt, .55), CRANE_LOOK_TO = miraAt.clone().add(new T.Vector3(-1, 2.2, 12));
  // beats the attack film may hold at while a voiced line finishes (beam, the Warden's lines, the bolt, the static, the end)
  const CUT_GATES = [4.45, 6.65, 7.35, 11.35, 13.35];
  const voiced = (sec: number) => { if (sec > 0) cutHold = Math.max(cutHold, t + sec - .25); };
  // the prologue (worlds/first-words-prologue.ts): a glimpse of dusk and the engine, the sim-lab's log, a rewind
  let prologue = -1, logShown = 0, released = -1;
  const simLog = document.createElement('div'); simLog.className = 'sim-log'; simLog.hidden = true; o.host.appendChild(simLog);
  // (the morning's beat, and its timed thoughts, start when the replay rewinds to it)
  const endPrologue = () => { if (prologue < 0) return; prologue = -1; simLog.hidden = true; simLog.innerHTML = ''; o.host.classList.remove('rewind'); released = 0; enter('meet'); };
  const startOpening = () => { chosen.clear(); cutHold = 0; opening = 0; o.host.classList.add('cutscene'); skip.hidden = false;
    if (o.moodForce) { prologue = 0; logShown = 0; simLog.innerHTML = ''; simLog.hidden = false; o.moodForce(PROLOGUE.mood, 1); } else enter('meet'); };
  const endOpening = () => { endPrologue(); o.moodForce?.(null); released = -1; if (opening < 0) return; opening = -1; g.quiet('Mira'); shot = null; o.host.classList.remove('cutscene'); skip.hidden = true; g.startControlHints(); };
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
    story.dialogue('mira', miraTalk);
  };
  // Mira asks; the player does it: walk to the skiff and hang the lantern (tap it, or E)
  let lanternTask = false;
  const miraTalk: Record<string, () => void> = {
    toLantern: () => { talking = false; lanternTask = true; goal(S.labels.lanternGoal, PILOT_STONE); },
    lookUp: () => { sfx.rumble(.4); later(.6, startAttack); },
  };
  const hangLantern = () => {
    lanternTask = false; action(null); goal(null, null); skiff.showLantern(true); sfx.chime(); story.toast('lantern', 1600);
    later(.9, () => { talking = true; o.teleport(ZIP_MARK.x, ZIP_MARK.z, ZIP_FACE); story.dialogue('mira', miraTalk, 'beep'); });
  };

  // things to use, for a tap on one to walk Zip there and use it (run 29: tapping a thing did nothing)
  g.addTapTargets(() => {
    if (g.cardOpen || cut >= 0 || opening >= 0) return [];
    if (beat === 'meet') return [lanternTask ? { at: PILOT_STONE, r: 2.8 } : { at: miraAt, r: 2.4 }];
    if (beat === 'skiff') return [{ at: PILOT_STONE, r: ECHO ? ECHO_SKIFF_STATION.place.r : SKIFF_ST.place.r }];
    if (beat === 'to-loom') return [{ at: MOOR, r: 2.2 }];
    if ((beat === 'loom' || beat === 'loom-puzzle') && !loom.active) return [{ at: LOOM_AT, r: LOOM_STATION.place.r }];
    if (beat === 'to-chime') return [{ at: MOOR2, r: 2.2 }];
    if ((beat === 'chime' || beat === 'chime-puzzle') && !chime.active) return [{ at: CHIME_AT, r: CHIME_STATION.place.r }];
    return [];
  });
  const speakSkiff = () => { action(null); enter('puzzle'); o.teleport(4.0, -11.5, Math.PI / 2); skiff.start(fly); };
  // one context action for whatever is in reach
  let shown = '', shownFn: (() => void) | undefined;
  // `at`: the thing it acts on (target brackets in the world; tapping them works like the button)
  // `ruleAction`: the rules action it sends, if any (tagged on the prompt for tests: docs/TEST-CONTRACT.md)
  const action = (label: string | null, fn?: () => void, at?: T.Vector3 | null, ruleAction?: string) => { if ((label ?? '') !== shown || fn !== shownFn) { shown = label ?? ''; shownFn = fn; g.setAction(label, fn, at, ruleAction); } else if (at) g.setActionAt(at); };
  const bracket = new T.Vector3(), promptAt = new T.Vector3(); const over = (p: T.Vector3, y = 1.0) => bracket.copy(p).setY(p.y + y);

  return {
    get placeName() { return placeName; },
    /** the story beat, and whether a cutscene (the cold open or the attack) is playing: for the soundscape */
    get beat() { return beat; },
    /** stray sparks found, of all (for the menu) */
    get finds() { return [finds.count, finds.total] as const; },
    get inCutscene() { return cut >= 0 || opening >= 0; },
    /** the time of day (sky-mood): how brightly the Warden's engine glows against it */
    mood(glow: number, haze: number, hazeColor: T.Color) { spire.mood(glow, haze, hazeColor); },
    debugTap: (w: string) => skiff.debugTap(w), debugFeed: () => skiff.debugFeed(),
    get debug() { return { script: S.id, beat, cut, opening, mech: ECHO ? 'echo' : 'classic', echo: echoSt.state, carried: echo.carried, engine: engine.active, loom: loomSt.state, chime: chimeSt.state, hops, spark: sparkHome.toArray(), stones: skiff.debugStones(), core: skiff.debugCore() }; },
    /** what the camera should keep clear sight of (foliage on the way steps aside); null = Zip */
    get focus(): T.Vector3 | null { return cut >= 0 ? focusPt.copy(miraAt).lerp(ship.position, .5) : engine.active ? focusPt.set(PILOT_STONE.x - .4, 2.6, PILOT_STONE.z) : null; },
    get frozen() { return g.cardOpen || ending >= 0 || cut >= 0 || opening >= 0 || skiff.active || isle.busy || loom.active || chime.active || engine.active || voiceMoment.active; },
    get shot() {
      const s = endShot() ?? voiceMoment.shot ?? engine.shot ?? skiff.shot ?? flight.shot ?? isle.shot ?? loomShot() ?? chimeShot(); if (s) return s;
      if ((cut >= 0 || opening >= 0) && shot) return shot;
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
    interrupt() { if (loom.active) { loom.close(); if (beat === 'loom-puzzle') beat = 'loom'; } if (chime.active) { chime.close(); if (beat === 'chime-puzzle') beat = 'chime'; } if (engine.active) engine.close(); },
    safeSpot(): [number, number, number] | 'stay' | null {
      if (beat === 'fly') return 'stay';
      if (beat === 'isle' || beat === 'to-loom') return [isle.landing.x - 1.2, isle.landing.z - 1.4, 0];
      if (beat.startsWith('loom') || beat === 'to-chime') return [LOOM_LAND.x, LOOM_LAND.z - 1.2, 0];
      if (beat.startsWith('chime')) return [CHIME_LAND.x, CHIME_LAND.z - 1.2, 0];
      return null;
    },
    start(from?: Checkpoint) {
      const b = from ?? new URLSearchParams(location.search).get('beat');
      if (!b) finds.clear();   // a new run: the sparks are out there again
      if (b === 'gate-open') { if (mira) mira.visible = false; placeName = story.beat('isle').place ?? null; beat = 'isle'; o.enterIsland(isle.cameraBlockers); isle.restoreOpen(); setTimeout(() => o.teleport(0, 45.2, 0), 50); return; }
      if (b === 'attack') { talking = true; setTimeout(() => { o.teleport(ZIP_MARK.x, ZIP_MARK.z, ZIP_FACE); skiff.showLantern(); startAttack(); }, 50); return; }
      if (b === 'spark') { if (mira) mira.visible = false; skiff.showLantern(); toSpark(); return; }
      if (b === 'skiff') { if (mira) mira.visible = false; toSkiff(); dimTo = .35; return; }
      if (b === 'land') { if (mira) mira.visible = false; placeName = story.beat('isle').place ?? null; beat = 'isle'; o.enterIsland(isle.cameraBlockers); setTimeout(() => { o.teleport(isle.landing.x - 1.2, isle.landing.z - 1.4, 0); isle.greet(() => isle.arrive()); }, 50); return; }
      if (b === 'to-loom') { if (mira) mira.visible = false; placeName = story.beat('isle').place ?? null; beat = 'isle'; o.enterIsland(isle.cameraBlockers); isle.restoreOpen(); setTimeout(() => { o.teleport(isle.landing.x - 1.2, isle.landing.z - 1.4, 0); toLoom(); }, 50); return; }
      if (b === 'loom-done') { if (mira) mira.visible = false; beat = 'loom'; world.show('next', true); world.show('route', true); skyShown = true; readyLoom(() => { landOnLoom(); loomSt.restore(['lift', 'lift', 'lift', 'predict.pieces', 'verb.free', 'who.tavi', 'from.loom', 'weave']); freeTavi(); enter2('loom-done'); }); return; }
      if (b === 'loom') { if (mira) mira.visible = false; beat = 'loom'; world.show('next', true); world.show('route', true); skyShown = true; readyLoom(() => { landOnLoom(); }); return; }
      // Stop 3: from Loom Isle's mooring (to-chime), or on Chime Isle (chime, chime-done)
      const loomRules = ['lift', 'lift', 'lift', 'predict.pieces', 'verb.free', 'who.tavi', 'from.loom', 'weave'];
      if (b === 'to-chime') { if (mira) mira.visible = false; beat = 'loom'; world.show('next', true); world.show('route', true); skyShown = true; readyLoom(() => { landOnLoom(); loomSt.restore(loomRules); taviFree = 1; enter3('to-chime'); }); return; }
      if (b === 'chime' || b === 'chime-done') { if (mira) mira.visible = false; beat = 'chime'; world.show('next', true); world.show('route', true); skyShown = true; loomSt.restore(loomRules);
        readyChime(() => { landOnChime(); if (b === 'chime-done') { chimeSt.restore(['cast', 'cast', 'predict.same', 'dial.cold', 'cast.lock', 'dial.warm', 'cast.bard']); tower.doorTo = 1; enter3('chime-done'); } }); return; }
      if (b === 'isle') { if (mira) mira.visible = false; skiff.showLantern(); setTimeout(fly, 50); return; }
      startOpening();
    },
    tick(dt: number) {
      t += dt; tickHolo(dt); sparkFx.tick(dt); const z = o.zip();
      g.zipClarity = beat === 'loom-done' || beat === 'to-chime' || beat.startsWith('chime') ? ZIP_CLARITY.loom : ZIP_CLARITY.skiff;   // his voice clears as engine pieces return
      const sky = beat === 'fly' || beat === 'isle' || beat.startsWith('loom') || beat === 'to-loom' || beat === 'to-chime' || beat.startsWith('chime');
      if (sky !== skyShown) { skyShown = sky; world.show('next', sky); world.show('route', sky); }
      if (beat.startsWith('loom') || beat === 'to-chime' || beat.startsWith('chime')) world.show('next2', true);
      if (sky) world.tick(z);
      for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= t) { const f = timers[i].fn; timers.splice(i, 1); f(); }
      if (ending >= 0) ending += dt; skiff.tick(dt); flight.tick(dt); engine.tick(dt); voiceMoment.tick(dt); loomGlow.tick(dt); tickChime(dt); spire.view(innerHeight * Math.min(2, devicePixelRatio), (o.camera as T.PerspectiveCamera).fov); spire.tick(t, dt, o.camera); if (t - spireAt > 19) { spireAt = t; spire.surge(); }
      finds.tick(dt, z, !(g.cardOpen || cut >= 0 || opening >= 0 || engine.active || flight.active || voiceMoment.active || isle.busy || loom.active || chime.active || beat === 'fly')); bells?.tick(dt, beat === 'fly' ? null : o.zip(), t); if (echo.enabled) echo.tick(dt);
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
          const tired = hops >= SPARK_HOPS, d = Math.hypot(z.x - sparkHome.x, z.z - sparkHome.z);
          spark.position.set(sparkHome.x, .6 + Math.sin(t * (tired ? 1.2 : 3)) * (tired ? .05 : .15), sparkHome.z);
          if (d < CATCH_R) catchSpark();
          else if (!tired && d < 2.1 && rest <= 0 && !g.cardOpen) hop(z);
        }
      }
      // the time of day eases back from the prologue's dusk to the morning over the crane
      if (released >= 0) { released += dt; const k = 1 - T.MathUtils.smoothstep(released, 0, 2.2); o.moodForce?.(k > 0 ? PROLOGUE.mood : null, k); if (k <= 0) released = -1; }
      if (prologue >= 0) {
        const p0 = prologue; prologue += dt; const p = prologue;
        for (const at of PROLOGUE.surges) if (p0 < at && p >= at) spire.surge();
        while (logShown < PROLOGUE.log.length && p >= PROLOGUE.log[logShown].at) { const line = document.createElement('p'); line.textContent = '> ' + PROLOGUE.log[logShown].text; simLog.appendChild(line); logShown++; }
        if (p0 < PROLOGUE.rewindAt && p >= PROLOGUE.rewindAt) o.host.classList.add('rewind');
        const k = T.MathUtils.smootherstep(Math.min(p / PROLOGUE.seconds, 1), 0, 1);
        sPos.lerpVectors(PROLOGUE.from, PROLOGUE.to, k); sLook.copy(SPIRE_MID).add(tmp2.set(0, 40 * k, 0));
        shot = { pos: sPos, look: sLook, shake: 0, cut: 98, rate: 40 };
        if (p >= PROLOGUE.seconds) endPrologue();
        return;
      }
      if (opening >= 0) {
        // cold open: Mira at the outlook, calling; then the camera swings back to Zip
        const c0 = opening; opening += dt; const c = opening;
        // first, the world: a slow crane from out over the cloud sea, past the outlook, the whole town
        // ahead and the Warden's engine on the horizon, a wave of light climbing it. Then, at the
        // outlook, Mira turns and calls (the cut to her).
        if (c < OPEN_CRANE) {
          if (c0 < .3 && c >= .3) spire.surge();
          const k = T.MathUtils.smootherstep(c, 0, OPEN_CRANE);
          sPos.lerpVectors(CRANE_FROM, CRANE_TO, k); sLook.lerpVectors(CRANE_LOOK_FROM, CRANE_LOOK_TO, T.MathUtils.smoothstep(c, OPEN_CRANE * .35, OPEN_CRANE));
          shot = { pos: sPos, look: sLook, shake: 0, cut: 99, rate: 40 };
          return;
        }
        const m = c - OPEN_CRANE, m0 = c0 - OPEN_CRANE;
        if (m0 < .5 && m >= .5) voiced(story.bark('call', 'start', 2.6));
        frame(miraAt, [[-1.3, 1.45, 3.3], [.8, 1.45, 3.4], [-2.6, 1.5, 2.2]], tmp3.copy(miraAt).add(tmp2.set(-.6, 1.55, -1.2)), 100, 4, 3.2);
        if (m >= 3.4 && t >= cutHold) endOpening();
        return;
      }
      if (cut >= 0) {
        // ── The attack, directed as a short film (3 Oct: "show a movie to players").
        // Shot list:  1 the town looks up  ·  2 the ship over Zip and Mira  ·  3 the beam takes Mira
        //  (slow motion: Shield her!)  ·  4 the bolt tears Zip's voice out  ·  5 the ship leaves over
        //  the town, toward the Blossom Isle  ·  6 Zip tries to shout; only static.
        const slow = !shielded && cut > 4.6 && cut < 6.0;
        // a voiced line holds the film at the next beat until it has been said
        const c0 = cut; let next = cut + dt * (slow ? .35 : 1);
        if (t < cutHold) for (const gate of CUT_GATES) if (c0 < gate && next >= gate) { next = gate - 1e-4; break; }
        cut = next; const c = cut;
        const zH = zHead.copy(z).setY(z.y + 1.1);
        // the ship: down out of the clouds, hover, then up and away over the town
        if (c < 3.2) ship.position.lerpVectors(far, hover, T.MathUtils.smoothstep(c, 0, 3.2));
        else if (c > 8.3) { const k = T.MathUtils.smoothstep(c, 8.3, 12.4); if (k < .45) ship.position.lerpVectors(hover, away1, k / .45); else ship.position.lerpVectors(away1, away2, (k - .45) / .55); }
        else ship.position.copy(hover);
        ship.position.y += Math.sin(t * 1.7) * .06;
        const faceTo = c > 8.3 ? tmp3.copy(away2) : o.camera.position;
        ship.rotation.y = Math.atan2(faceTo.x - ship.position.x, faceTo.z - ship.position.z) * (c > 8.3 ? 1 : .85) + Math.sin(t * .8) * .1; ship.rotation.z = Math.sin(t * .8 + .6) * .07; eye.scale.setScalar(1 + .12 * Math.sin(t * 8) + (c > 2.6 && c < 3.4 ? .5 : 0));
        // the beam takes Mira; her hat falls
        beam.visible = c > 4.5 && c < 6.9; beamMat.opacity = beam.visible ? .35 + .15 * Math.sin(t * 14) : 0;
        if (beam.visible) { const from = miraAt.clone().setY(.3); tmp.copy(ship.position).sub(from); beam.position.copy(from).addScaledVector(tmp, .5); beam.scale.set(.8, tmp.length(), .8); beam.quaternion.setFromUnitVectors(up, tmp.normalize()); }
        if (mira && c > .6 && c < 4.8) { const want = Math.atan2(-(ship.position.x - mira.position.x), -(ship.position.z - mira.position.z)); let d = ((want - mira.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; mira.rotation.y += d * Math.min(1, dt * 2.5); }
        if (mira && c > 4.8 && c < 6.9) {
          const k = T.MathUtils.smoothstep(c, 4.8, 6.8); mira.position.lerpVectors(miraAt, tmp.copy(hover).setY(hover.y - .9), k); mira.scale.setScalar(1 - k * .75);
          mira.rotation.y = Math.atan2(-(z.x - mira.position.x), -(z.z - mira.position.z)); mira.rotation.x = -.25 * k;   // reaching back toward Zip
        }
        if (mira && c0 < 6.9 && c >= 6.9) { mira.visible = false; mira.rotation.x = 0; }
        if (hat) {
          if (c0 < 5.1 && c >= 5.1) { hatFrom.copy(miraAt).setY(1.9); hatRest.copy(miraAt).add(tmp.set(.35, .015, .25)); hat.visible = true; }
          if (c > 5.1) { const k = Math.min(1, (c - 5.1) / 1.1); hat.position.lerpVectors(hatFrom, hatRest, k); hat.position.y = T.MathUtils.lerp(hatFrom.y, hatRest.y, k * k) + Math.sin(k * Math.PI) * .25; hat.rotation.set(.18 * k + Math.sin(c * 7) * (1 - k) * .5, 1.1 + c * (1 - k) * 2, -.12 * k); }
        }
        // the bolt: the Warden tears Zip's speech engine out; it streaks into the bell garden
        bolt.visible = c > 7.4 && c < 7.75;
        if (bolt.visible) { const from = zH.clone(); tmp.copy(ship.position).sub(from); bolt.position.copy(from).addScaledVector(tmp, .5); bolt.scale.set(1, tmp.length(), 1); bolt.quaternion.setFromUnitVectors(up, tmp.normalize()); }
        if (c > 4.6 && c < 6.0 && !shielded) action(S.labels.shieldMira, shield, miraAt.clone().setY(1.1)); else action(null);
        if (dash >= 0) {
          dash += dt;
          if (dash < .3) { tmp.lerpVectors(dashFrom, dashTo, dash / .3); o.teleport(tmp.x, tmp.z, ZIP_FACE); }
          else if (dash < .75) { if (dash - dt < .3) { sfx.zap(); sfx.thud(); story.toast('zap', 700); shake = Math.max(shake, .3); } tmp.lerpVectors(dashTo, dashFrom.clone().addScaledVector(dashFrom.clone().sub(miraAt).setY(0).normalize(), .6), T.MathUtils.smoothstep(dash, .3, .75)); o.teleport(tmp.x, tmp.z, ZIP_FACE); }
          else dash = -1;
        }
        // sound and the town's reaction
        if (c0 < .4 && c >= .4) { sfx.rumble(.6); const l = life(); if (l) l.alarm = ship.position; }
        if (c0 < 1.1 && c >= 1.1) story.bark('alarm', 'start', 2);
        if (c0 < 1.9 && c >= 1.9) { bells?.nudge(.9); skiff.gust(1); shake = Math.max(shake, .18); sfx.rumble(.8); story.bark('alarm', 'inside', 1.8); }
        if (c0 < 2.6 && c >= 2.6) { sfx.hum(2); shake = Math.max(shake, .12); voiced(story.bark('warden', 'start', 2.4, 'warden')); }
        if (c0 < 4.5 && c >= 4.5) { sfx.whoosh(); sfx.rumble(.7); }
        if (c0 < 5.0 && c >= 5.0) story.bark('mira_cry', 'start', 1.6);
        if (shielded && c0 < 6.1 && c >= 6.1) voiced(story.bark('warden', 'shielded', 1.8, 'warden'));
        if (c0 < 6.7 && c >= 6.7) voiced(story.bark('warden', 'take', 1.9, 'warden'));
        if (c0 < 7.4 && c >= 7.4) { sparkFrom.copy(zH); spark.visible = true; sfx.zap(); sfx.static(); sfx.rumble(1); shake = .55; bells?.nudge(1.3); skiff.gust(1.6); sparkFx.burst(zH, 26, 2.2, HOLO.made); }
        if (c > 7.4 && c < 9.4) { const k = (c - 7.4) / 2; spark.position.lerpVectors(sparkFrom, SPARK_AT, k); spark.position.y = T.MathUtils.lerp(1.2, .6, k) + Math.sin(k * Math.PI) * 4; }
        if (c0 < 9.4 && c >= 9.4) bells?.nudge(.8);   // the spark lands in the bell garden: every bell rings
        if (c0 < 8.5 && c >= 8.5) { voiced(story.bark('warden', 'leave', 2.6, 'warden')); spire.surge(); }
        // after the Warden's last word, not over it; and it gets a moment before Zip tries to shout
        // (the story order: she's gone → "Is this Mario?" → he shouts → no voice)
        if (c >= 9.6 && t >= cutHold && story.thinkOnce('mario')) { marioAt = t; voiced(2.8); }
        // he tries to shout her name 2.4 s into the joke (before the film's last gate opens, so the end waits for it)
        if (c >= 11.4 && marioAt >= 0 && t >= marioAt + 2.4 && !shouted) { shouted = true; sfx.static(); voiced(story.bark('static', 'start', 1.6, 'static') + .6); }
        shake *= Math.exp(-dt * 2.6);
        // the shots
        const mid = tmp.set((z.x + miraAt.x) / 2, 0, (z.z + miraAt.z) / 2);
        const sky = tmp3;
        const ground = tmp2.set(mid.x, 1.3, mid.z);
        if (c < 2.4) frame(mid, [[-4.5, 1.3, 5.5], [-3, 1.5, 4.2], [-6, 1.3, 2.2]], sky.lerpVectors(miraAt, ship.position, .5).setY(1.6 + (ship.position.y - 1.6) * .4), 1, 1.2, 4.5, ground);   // 1: wide, the town looks up
        else if (c < 4.5) frame(mid, [[-.6, .45, 3.9], [1.2, .5, 3.9], [-2.6, .5, 3.2]], sky.copy(ship.position).lerp(miraAt, .2), 2, 2.5, 3.6, ground);                                    // 2: low, under the ship
        else if (c < 7.0) frame(mid, [[-2.6, 1.5, 2.8], [-4.2, 1.4, 1.2], [.5, 1.2, 4.6]], sky.copy(mira?.position ?? miraAt).setY((mira?.position.y ?? 0) + 1.1), 3, 3, 3.6, ground);       // 3: over Zip's shoulder, the beam takes Mira
        else if (c < 8.3) frame(z, [[.7, 1.35, 2.7], [-1.4, 1.35, 2.4], [2.3, 1.3, -.4]], zH, 4, 5, 2.4);                                                                                  // 4: close on Zip
        else if (c < 11.2) frame(z, [[.6, 2.1, -6.2], [-1.4, 2.1, -5.8], [1.8, 1.8, -4.4], [1.6, .7, -1.7]], sky.lerpVectors(zH, SPIRE_MID, .05), 5, 1.6, 3, zH);   // 5: wide, behind Zip: the ship climbs away over the town and off toward the Warden's engine on the horizon
        else frame(z, [[2.1, 1.25, -1.5], [2.4, 1.3, .4], [-.4, 1.3, 2.6]], zH, 6, 4, 2.3);                                                                                                // 6: Zip tries to shout
        if (shot) shot.shake = shake;
        if (c >= 13.4) { cut = -1; endAttack(); }
        return;
      }
      if (beat === 'isle') { o.camera.getWorldDirection(aimV); const a = isle.tick(dt, z, aimV); if (!g.cardOpen && a) action(a.label, a.use, undefined, a.action); else action(null); return; }
      if (beat === 'to-loom') { isle.tick(dt, z, null); if (!g.cardOpen && Math.hypot(z.x - MOOR.x, z.z - MOOR.z) < 2.2) action(stop2.label('board'), board, over(MOOR, 1.2)); else action(null); return; }
      if (beat === 'to-chime') { if (!g.cardOpen && Math.hypot(z.x - MOOR2.x, z.z - MOOR2.z) < 2.2) action(stop3.label('board3'), board3, over(MOOR2, 1.2)); else action(null); return; }
      if (beat.startsWith('chime')) {
        if ((beat === 'chime' || beat === 'chime-puzzle') && !g.cardOpen && !chime.active && Math.hypot(z.x - CHIME_AT.x, z.z - CHIME_AT.z) < CHIME_STATION.place.r) action(CHIME_STATION.action, talkChime, over(CHIME_AT, 1.6));
        else action(null);
        return;
      }
      if (beat.startsWith('loom')) {
        if (taviFree >= 0 && taviFree < 1) { taviFree = Math.min(1, taviFree + dt / 1.2); cloth.position.y = LOOM_AT.y + .95 - taviFree * 1.2; (cloth.material as T.MeshLambertMaterial).opacity = .92 * (1 - taviFree); tavi.position.z = LOOM_AT.z - .75 + taviFree * 1.9; if (taviFree >= 1) cloth.visible = false; }
        taviHead.position.y = 1.2 + Math.sin(t * 2) * .02;
        if (beat === 'loom' && !g.cardOpen && !loom.active && Math.hypot(z.x - LOOM_AT.x, z.z - LOOM_AT.z) < LOOM_STATION.place.r) action(LOOM_STATION.action, talkLoom, over(LOOM_AT, 1.2));
        else if (beat === 'loom-puzzle' && !g.cardOpen && !loom.active && Math.hypot(z.x - LOOM_AT.x, z.z - LOOM_AT.z) < LOOM_STATION.place.r) action(LOOM_STATION.action, talkLoom);
        else action(null);
        return;
      }
      if (skiff.active) { shown = '#'; return; }
      if (g.cardOpen) { action(null); return; }
      const near = (p: T.Vector3, r: number) => Math.hypot(z.x - p.x, z.z - p.z) < r;
      if (beat === 'meet' && lanternTask) { if (near(PILOT_STONE, 2.8)) action(S.labels.hangLantern, hangLantern, skiff.at(bracket)); else action(null); }
      else if (beat === 'meet' && near(miraAt, 2.4)) action(S.labels.talkMira, talk, over(miraAt, 1.1));
      else if (beat === 'skiff' && ECHO) {
        // words first (a word in reach wins, picked by aim among the words: kit/target.ts via echo),
        // then the engine at the pilot stone. Letting aim choose between a word and the engine
        // hid the plaque's word from a newcomer (AI play-test, 4 Oct): collect first, then speak.
        const a = echo.action(z);
        if (a) action(a.label, a.use, a.at, a.action);
        else if (near(PILOT_STONE, ECHO_SKIFF_STATION.place.r)) action(ECHO_SKIFF_STATION.action, openEngine, over(PILOT_STONE, .5));
        else action(null);
        if ((gatherT -= dt) <= 0) { gatherT = .8; gatherGoal(); }
        // the tutorial is the world: the first word in sight wears a pulsing "Tap" until Zip takes one
        if (!echo.carried.length && !echo.flying) {
          const w = echo.nearest(z); const d = w ? Math.hypot(w.x - z.x, w.z - z.z) : 99;
          if (w && d < 13) { story.thinkOnce('words-seen'); promptAt.copy(w).setY(w.y + .6); g.prompt('absorb', () => promptAt, 'Tap'); } else g.prompt('absorb', null);
        } else g.prompt('absorb', null);
      }
      else if (beat === 'skiff' && near(PILOT_STONE, SKIFF_ST.place.r)) action(SKIFF_ST.action, speakSkiff, over(PILOT_STONE, .5));
      else action(null);
    },
  };
}
export type Story = ReturnType<typeof buildStory>;
