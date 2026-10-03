import * as T from 'three';
import type { Guide } from './guide';
import type { LearningEvent } from './speech-puzzle';
import { createStation } from './kit/station';
import { station, rulesFor } from './worlds/first-words-stations';
import { sfx } from './sfx';
import { buildRelay } from './relay';
import { loadKit } from './kit/kit';
import { dressIsland, entityAt } from './kit/dress';
import { budget } from './kit/budget';
import { BLOSSOM_ISLE } from './worlds/blossom-isle';
import { mergeStatic } from './kit/merge';
import { authored, gateArch, landingPad, lanternPost, noticeBoard, relayTower, satchelPedestal, stone } from './worlds/bellweather-props';

// Greybox Blossom Isle (Level 1, outcome `context`): its own small island,
// reached by the skiff. The gate only opens where the notes Zip carries point.
// Plain shapes on purpose; art comes after the reasoning is proven.
//
// Flow the player sees: find the satchel next to the landing, read notes and
// take up to two, speak at the gate, say where it will open, watch it follow
// the notes. Then call Mira from the relay (the changed case: new purpose,
// new cards, less help). First choices are kept apart from later attempts.

export const ISLE = new T.Vector3(BLOSSOM_ISLE.center[0], 0, BLOSSOM_ISLE.center[1]);
type NoteId = 'mira' | 'poster' | 'warden' | 'rumour';
interface Note { id: NoteId; short: string; text: string; at: T.Vector3 }
// where things stand comes from the island spec's entities; what the notes say
// comes from the Gate station's content
const at = (id: string) => { const [x, z] = entityAt(BLOSSOM_ISLE, id); return new T.Vector3(x, .13, z); };
const NOTES: Note[] = (station('blossom-gate').content!.notes as Omit<Note, 'at'>[]).map(n => ({ ...n, at: at('note-' + n.id) }));
const LANDING = at('landing'), CLASP = at('satchel'), GATE = at('gate'), GATE_STONE = at('gate-stone'), RELAY = at('relay');

interface Opts {
  guide: Guide; host: HTMLElement;
  addBox: (a: number, b: number, c: number, d: number) => object; removeBox: (b: object) => void;
  solid: (x: number, z: number, r: number) => void; addWalk: (x: number, z: number, r: number) => void;
  onEvent?: (e: LearningEvent) => void; onOpen?: () => void; onDone?: () => void; setGoal: (goal: string | null, beacon: T.Vector3 | null, arrowOnly?: boolean) => void;
  /** the game's look for loaded art (painted shading, faders, camera solids) */
  adopt?: (root: T.Object3D, cameraBlockers: T.Object3D[]) => void;
  density?: number;
}

export function buildIsland(scene: T.Scene, opts: Opts) {
  const g = opts.guide;
  const root = new T.Group(); root.name = 'blossom-isle-greybox'; scene.add(root);
  const std = (color: string, emissive = '#000000', e = 0) => new T.MeshLambertMaterial({ color, emissive, emissiveIntensity: e });
  // ground: a grassy disc on a rock cone
  const top = new T.Mesh(new T.CylinderGeometry(10, 9.4, .6, 48), std('#8fb87a')); top.position.set(ISLE.x, -.17, ISLE.z); root.add(top);
  const rock = new T.Mesh(new T.ConeGeometry(9.4, 9, 12), std('#8a7f9e')); rock.rotation.x = Math.PI; rock.position.set(ISLE.x, -4.9, ISLE.z); root.add(rock);
  const pad = landingPad(1.25); mergeStatic(pad); pad.position.copy(LANDING).setY(.1); pad.userData.noCameraBlock = true; root.add(pad);
  for (const s of [-1, 1]) { const l = lanternPost(1.8); mergeStatic(l); l.position.set(LANDING.x + s * 1.75, .1, LANDING.z - 1.1); l.rotation.y = s < 0 ? Math.PI : 0; root.add(l); opts.solid(l.position.x, l.position.z, .15); }
  const greyTrees: T.Object3D[] = [];
  for (const [x, z, s] of [[-6.5, 5.5, 1.1], [6.8, -3.5, 1.3], [-7, -4, 1]] as const) {
    const tree = new T.Group(); tree.position.set(ISLE.x + x, 0, ISLE.z + z); tree.userData.fade = { halfW: 1.3 * s, y0: 0, y1: 3.2 }; tree.userData.noCameraBlock = true; root.add(tree);
    const trunk = new T.Mesh(new T.CylinderGeometry(.12, .18, 1.6, 8), std('#6b4a52')); trunk.position.set(0, .9, 0); tree.add(trunk);
    for (let i = 0; i < 5; i++) { const b = new T.Mesh(new T.IcosahedronGeometry(.7 * s, 1), std(i % 2 ? '#f0a0b8' : '#e58aa8')); b.position.set(Math.cos(i * 1.3) * .6 * s, 2.1 + (i % 3) * .25, Math.sin(i * 1.3) * .6 * s); tree.add(b); }
    greyTrees.push(tree);
  }
  // hedge wall with an arch; the Warden's seal fills the arch
  const hedgeMat = std('#4f7a52');
  const hedges: T.Mesh[] = [];
  for (const side of [-1, 1]) { const h = new T.Mesh(new T.BoxGeometry(8, 1.0, .6), hedgeMat); h.position.set(ISLE.x + side * 5.7, .6, GATE.z); root.add(h); hedges.push(h); opts.addBox(ISLE.x + side * 1.7 - (side < 0 ? 8 : 0), ISLE.x + side * 1.7 + (side > 0 ? 8 : 0), GATE.z - .3, GATE.z + .3); }
  const gateGrp = new T.Group(); gateGrp.position.set(GATE.x, 0, GATE.z); gateGrp.userData.fade = { halfW: 1.9, y0: 0, y1: 3.5 }; gateGrp.userData.noCameraBlock = true; root.add(gateGrp);
  const archArt = gateArch(1.7, 1.4); mergeStatic(archArt);
  gateGrp.add(authored(archArt, 'gate-arch', m => m.traverse(o => { const g = o as T.Mesh; if (g.isMesh && /^(Ivy|Flowers)/.test(g.name)) (g.material as T.Material).side = T.DoubleSide; })));
  const sealMat = new T.MeshBasicMaterial({ color: '#7b4fd6', transparent: true, opacity: .6, side: T.DoubleSide, depthWrite: false });
  const seal = new T.Mesh(new T.CircleGeometry(1.62, 32, 0, Math.PI), sealMat); seal.position.set(GATE.x, 1.4, GATE.z); root.add(seal);
  const sealLow = new T.Mesh(new T.PlaneGeometry(3.24, 1.4), sealMat); sealLow.position.set(GATE.x, .7, GATE.z); root.add(sealLow);
  let sealBox: object | null = null;
  // The Gate is a character: a literal-minded doorman with a face on its
  // keystone. It opens exactly where the notes in your satchel say. Rules are rules.
  const face = new T.Group(); face.position.set(0, 3.05, .32); gateGrp.add(face);
  // the Gate talks in a bubble over its carved face; Mira's voice comes out of the relay
  const faceAt = new T.Vector3(); g.anchor('Gate', () => root.visible ? face.getWorldPosition(faceAt).setY(faceAt.y + .55) : null);
  const relayAt = new T.Vector3(); g.anchor('Relay', () => root.visible ? relayAt.copy(RELAY).setY(RELAY.y + 3.6) : null);
  face.add(new T.Mesh(new T.BoxGeometry(1.5, .82, .18), stone('#f4ead6')));
  const eyes = [-1, 1].map(side => {
    const white = new T.Mesh(new T.SphereGeometry(.2, 16, 12), new T.MeshBasicMaterial({ color: '#ffffff' })); white.scale.z = .5; white.position.set(side * .33, .08, .1); face.add(white);
    const pupil = new T.Mesh(new T.SphereGeometry(.09, 12, 8), new T.MeshBasicMaterial({ color: '#1c2440' })); pupil.position.set(side * .33, .08, .2); face.add(pupil);
    const brow = new T.Mesh(new T.BoxGeometry(.32, .06, .06), new T.MeshBasicMaterial({ color: '#4a3a2a' })); brow.position.set(side * .33, .34, .14); face.add(brow);
    return { white, pupil, brow, side };
  });
  const mouth = new T.Mesh(new T.TorusGeometry(.2, .035, 6, 20, Math.PI), new T.MeshBasicMaterial({ color: '#4a3a2a' })); mouth.rotation.z = Math.PI; mouth.position.set(0, -.2, .12); face.add(mouth);
  let mood: 'idle' | 'talk' | 'smug' | 'dizzy' | 'oops' | 'happy' = 'idle', talkT = 0, blink = 2;
  const gateSays = (text: string, choices: { label: string; kind?: 'primary' | 'quiet'; act: () => void }[] = [], m: typeof mood = 'talk') => { mood = m; talkT = Math.min(2.2, text.length * .045); sfx.speak(Math.min(6, 2 + Math.floor(text.length / 14))); g.say(text, choices, { speaker: 'Gate' }); };
  // satchel on a pedestal by the landing
  const ped = satchelPedestal(); mergeStatic(ped.group, [ped.satchel]); ped.group.position.copy(CLASP).setY(.1); root.add(ped.group);
  const satchelObj = ped.satchel;
  // note boards: bright paper, except the Warden's dark sign
  const boards = NOTES.map(n => {
    const grp = new T.Group(); grp.position.copy(n.at); grp.userData.fade = { halfW: .5, y0: 0, y1: 1.7 }; grp.userData.noCameraBlock = true; root.add(grp);
    const nb = noticeBoard(n.id === 'warden' ? 'warden' : 'paper', n.at.x * 7 + n.at.z); mergeStatic(nb.group, [nb.board]); grp.add(nb.group);
    grp.rotation.y = Math.atan2(ISLE.x - n.at.x, ISLE.z + 3 - n.at.z) * .6; // turn toward the path
    return { n, grp, board: nb.board };
  });
  // relay terrace beyond the gate
  const tower = new T.Group(); tower.position.copy(RELAY); tower.userData.fade = { halfW: .6, y0: 0, y1: 3.7 }; tower.userData.noCameraBlock = true; root.add(tower);
  const relayArt = relayTower(); mergeStatic(relayArt.group); relayArt.group.position.y = .1; tower.add(relayArt.group);
  const dishMat = relayArt.dishMat as T.MeshLambertMaterial;
  const path = [0, 1, 2, 3].map(i => { const d = new T.Mesh(new T.CircleGeometry(.24, 16).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: '#9fe0d0' })); d.position.set(GATE.x, .16, GATE.z - .9 - i * 1.1); d.visible = false; root.add(d); return d; });
  // consequence props
  const cage = new T.Mesh(new T.CylinderGeometry(.8, .8, 2.2, 10, 1, true), new T.MeshBasicMaterial({ color: '#4a2f7a', wireframe: true })); cage.visible = false; root.add(cage);
  const drones = [0, 1, 2].map(() => { const d = new T.Mesh(new T.SphereGeometry(.18, 12, 8), std('#2a1f40', '#b07bff', .9)); d.visible = false; root.add(d); return d; });

  // the follow camera should not pass through the island's solid things
  const cameraBlockers: T.Object3D[] = []; root.updateMatrixWorld(true);
  root.traverse(o => { const m = o as T.Mesh; if (!m.isMesh || m === top || m === rock || m === cage || (drones as T.Object3D[]).includes(m) || (path as T.Object3D[]).includes(m) || m === seal || m === sealLow) return;
    for (let q: T.Object3D | null = m; q; q = q.parent) if (q.userData.noCameraBlock) return;
    // thin poles (mast, posts, trunks, pillars) would make the camera pop in; let it pass them
    const b = new T.Box3().setFromObject(m), sz = b.getSize(new T.Vector3()); if (Math.max(sz.x, sz.z) < .5) return;
    cameraBlockers.push(m); });
  // walking: the disc, minus trees, pedestal, stone, posts, tower
  opts.addWalk(ISLE.x, ISLE.z, 9.4);
  for (const n of NOTES) opts.solid(n.at.x, n.at.z, .25);
  opts.solid(CLASP.x, CLASP.z, .35); opts.solid(RELAY.x, RELAY.z, .35);

  // Art: the island is dressed from its world spec with the meadow kit. The
  // greybox stays until the kit arrives (and remains the fallback). Hedge
  // boxes stay as invisible camera walls behind the shrub rows.
  let detail: T.Object3D | null = null, shedAt = 0;
  loadKit('nature-meadow').then(kit => {
    const d = dressIsland(BLOSSOM_ISLE, kit, { density: opts.density ?? 1 });
    scene.add(d.root); detail = d.detail; d.detail.visible = false;
    for (const s of d.solids) opts.solid(s.x, s.z, s.r);
    top.visible = rock.visible = false; for (const t of greyTrees) t.visible = false; for (const h of hedges) h.material = new T.MeshBasicMaterial({ visible: false });
    const blockers = d.cameraBlockers.filter(o => o.name !== 'island-rock'); cameraBlockers.push(...blockers);
    opts.adopt?.(d.root, blockers);
    console.info('[kit] blossom isle dressed', JSON.stringify(d.stats));
  }).catch(e => {
    console.warn('[kit] meadow kit unavailable; keeping the greybox', e);
    for (const t of greyTrees) opts.solid(t.position.x, t.position.z, .4);
  });

  // satchel strip on screen once Zip has it
  const strip = document.createElement('div'); strip.className = 'satchel-bar'; strip.hidden = true; opts.host.appendChild(strip);
  // what the satchel holds is the Gate's rules state (slotA, slotB)
  const bag = () => [gateSt.state.slotA, gateSt.state.slotB].filter(x => x !== 'none') as NoteId[];
  const hasBag = () => phase !== 'off' && gateSt.state.phase !== 'arrived';
  const renderBag = () => { strip.hidden = !hasBag() || phase === 'done'; strip.innerHTML = '<b>Satchel</b>'; for (let i = 0; i < 2; i++) { const s = document.createElement('span'); const id = bag()[i]; s.className = 'chip ' + (id ? 'rail' : 'empty'); s.textContent = id ? NOTES.find(n => n.id === id)!.short : 'empty'; strip.appendChild(s); } };
  // the island's two stations (data in worlds/first-words-stations.ts)
  const stationHost = { onEvent: opts.onEvent, stars: (title: string, rows: [boolean, string][], then: () => void) => g.stars(title, rows, then) };
  const gateSpec = station('blossom-gate'), relaySpec = station('relay-contact');
  const gateSt = createStation(gateSpec, stationHost, rulesFor(gateSpec)), relaySt = createStation(relaySpec, stationHost, rulesFor(relaySpec));
  const anchors: Record<string, T.Vector3> = { 'gate-stone': GATE_STONE, relay: RELAY };

  let phase: 'off' | 'arrived' | 'bag' | 'open' | 'done' = 'off';
  const goalNow = () => {
    if (phase === 'arrived') opts.setGoal('Take the satchel by the landing', CLASP);
    else if (phase === 'bag') { const failed = gateSt.state.failed as boolean; opts.setGoal(failed ? 'Change your notes, then speak again' : bag().length ? 'Take your notes to the gate' : 'Read the notes. Take up to two.', bag().length && !failed ? GATE_STONE : null, true); }
    else if (phase === 'open') opts.setGoal('Call Mira from the relay', RELAY);
    else if (phase === 'done') opts.setGoal('Back to the skiff. Mira needs you!', null);
  };

  // notes read themselves when Zip walks up (a floating label); the one button takes or returns it
  const noteAction = (n: Note) => {
    if (!hasBag()) return null;
    const b = bag();
    if (b.includes(n.id)) return { label: 'Put it back', use: () => { if (gateSt.act('put.' + n.id).ok) { sfx.place(); changed(); } } };
    if (b.length < 2) return { label: 'Take the note', use: () => { if (gateSt.act('take.' + n.id).ok) { sfx.catch(); g.toast(n.short + ' in the satchel', 1000); changed(); } } };
    const old = NOTES.find(x => x.id === b[0])!;
    return { label: `Swap for ${old.short}`, use: () => { if (gateSt.act('take.' + n.id).ok) { sfx.catch(); changed(); } } };
  };
  const changed = () => { renderBag(); goalNow(); };

  const retry = () => { mood = 'idle'; g.close(); goalNow(); };
  // gate: the command follows exactly what the satchel holds
  const gate = {
    speak() {
      const r = gateSt.act('speak'); if (!r.ok) return;
      if (r.events.includes('gate-needs-notes')) { gateSays('An empty satchel? I need notes, pal. Rules are rules!', [{ label: 'OK', act: () => { mood = 'idle'; g.close(); } }], 'smug'); return; }
      const read = bag().map(b => NOTES.find(n => n.id === b)!.text.replace(/ \(.*\)$/, '')).join(' … ');
      gateSays(`Let me read your notes: ${read} Now guess: where will I open?`, [
        { label: 'Lotus Terraces', act: () => gate.predict('lotus') }, { label: 'East Falls', act: () => gate.predict('east') },
        { label: 'Old Bridge', act: () => gate.predict('bridge') }, { label: 'Can\'t tell', act: () => gate.predict('unclear') },
      ]);
    },
    predict(p: string) {
      const r = gateSt.act('predict.' + p); if (!r.ok) return;
      const right = r.judged.find(j => j.decision === 'destination-prediction')?.correct;
      g.toast(right ? 'Good call!' : 'Let\'s see…', 900);
      if (r.events.includes('ask-support')) { g.say('What does Mira\'s page tell you?', [
        { label: 'Her route: Lotus Terraces, then bell gardens', act: () => { gateSt.act('support.route'); gate.run(); } },
        { label: 'That she is safe', act: () => { gateSt.act('support.safe'); gate.run(); } },
        { label: 'Where she is held', act: () => { gateSt.act('support.held'); gate.run(); } },
      ]); }
      else gate.run();
    },
    run() {
      const r = gateSt.act('run'); if (!r.ok) return;
      const o = r.events.find(e => e.startsWith('gate-'))?.slice(5);
      if (o === 'open') {
        opts.onOpen?.(); melt = 1.2; if (sealBox) opts.removeBox(sealBox); sealBox = null; path.forEach(d => (d.visible = true)); phase = 'open'; sfx.chime();
        gateSays('Past the Lotus Terraces it is! Mind the step.', [{ label: 'Yes!', kind: 'primary', act: () => gateSt.finish(() => { mood = 'idle'; goalNow(); }) }], 'happy');
      } else if (o === 'decoy') {
        g.close(); gateSays('East Falls! The sign said so. Rules are rules!', [], 'smug');
        setTimeout(() => { trap = 3.2; sfx.zap(); g.close(); }, 1600);
        setTimeout(() => gateSays('Oops. I can\'t tell a real clue from a planted order. I just do what notes say.', [{ label: 'Swap my notes', kind: 'primary', act: () => { retry(); g.thinkOnce('warden-sign', 'In hindsight, a sign signed ‘Warden’ was a clue.'); } }], 'oops'), 4600);
      } else if (o === 'stale') {
        gateSays('Old Bridge, coming right up!', [], 'smug'); crumble = 2.4; sfx.whoosh();
        setTimeout(() => { sfx.boing(); gateSays('Huh. Nobody told me the bridge fell. That poster is old news!', [{ label: 'Swap my notes', kind: 'primary', act: () => { retry(); g.thinkOnce('old-news', 'Old news is bad news. Write that down.'); } }], 'oops'); }, 2600);
      } else if (o === 'blend') {
        flicker = 2; sfx.boing(); gateSays('Lotus? East? Falls? Two notes that disagree! My hinges hurt.', [{ label: 'Carry only one', kind: 'primary', act: () => { retry(); g.thinkOnce('dizzy-door', 'I made a door dizzy. New personal best.'); } }], 'dizzy');
      } else { flicker = 1.2; sfx.boing(); gateSays('Open to… somewhere? I need a place, pal.', [{ label: 'Find a better note', kind: 'primary', act: retry }], 'dizzy'); }
    },
  };

  // relay: new purpose (reach Mira), new cards, less help (see relay.ts)
  const relay = buildRelay({ guide: g, host: opts.host, station: relaySt, ping: () => { ping = 3; }, onDone: () => {
    phase = 'done'; renderBag(); goalNow(); g.thinkOnce('loom', 'Plot twist: there\'s a Loom Isle. Of course there is.'); g.thinkOnce('warden-loom', 'Loom Isle, then. Come find me, awake one.', 'warden'); opts.onDone?.();
  } });

  const things = [
    { at: CLASP, r: 1.7, label: 'Take the satchel', when: () => !hasBag() && phase !== 'off', use: () => { if (!gateSt.act('take-satchel').ok) return; satchelObj.visible = false; phase = 'bag'; renderBag(); sfx.catch(); g.say('A satchel for notes. The Gate reads only what\'s inside.', [{ label: 'Got it', kind: 'primary', act: () => { g.close(); goalNow(); } }]); } },
    gateSt.zone(anchors[gateSt.spec.place.anchor], () => phase === 'bag', () => gate.speak()),
    relaySt.zone(anchors[relaySt.spec.place.anchor], () => phase === 'open' && !relay.active, () => relay.open()),
  ];

  let trap = 0, crumble = 0, flicker = 0, ping = 0, melt = 0, t = 0; const trapAt = new T.Vector3(), look = new T.Vector3();
  return {
    landing: LANDING, cameraBlockers,
    get busy() { return relay.active; },
    get onIsland() { return phase !== 'off'; },
    /** Zip has left for the next island: the satchel strip and labels go */
    leave() { phase = 'done'; renderBag(); for (const n of NOTES) g.label('note-' + n.id, null, n.at); g.label('relay-notes', null, RELAY); },
    arrive() { phase = 'arrived'; sealBox = opts.addBox(GATE.x - 1.7, GATE.x + 1.7, GATE.z - .3, GATE.z + .3); goalNow(); },
    // resume past the gate (from a save): satchel taken, Mira's page carried, seal gone
    restoreOpen() { gateSt.restore(['take-satchel', 'take.mira', 'speak', 'predict.lotus', 'support.route', 'run']); phase = 'open'; satchelObj.visible = false; seal.visible = sealLow.visible = false; path.forEach(d => (d.visible = true)); renderBag(); goalNow(); },
    greet(then: () => void) { gateSays('Halt! I\'m the Gate. I open only where notes tell me. Rules are rules!', [{ label: 'OK', kind: 'primary', act: () => { mood = 'idle'; g.close(); then(); } }], 'smug'); },
    tick(dt: number, zip: T.Vector3) {
      if (detail) {
        detail.visible = Math.hypot(zip.x - ISLE.x, zip.z - ISLE.z) < budget.radius && budget.level < 2;
        if (shedAt !== budget.level) { shedAt = budget.level; const keep = budget.level ? .5 : 1.01; detail.children.forEach(c => { c.visible = (c.userData.rank ?? 0) < keep; }); }
      }
      if (phase === 'off') return null;
      t += dt;
      let best: { label: string; use: () => void } | null = null, bd = 1e9;
      for (const th of things) { if (!th.when()) continue; const d = Math.hypot(zip.x - th.at.x, zip.z - th.at.z); if (d < th.r && d < bd) { bd = d; best = th; } }
      // notes: the nearest one within reach shows its text and offers its action
      let nearNote: Note | null = null, nd = 1.8;
      if (phase === 'arrived' || phase === 'bag') for (const n of NOTES) { const d = Math.hypot(zip.x - n.at.x, zip.z - n.at.z); if (d < nd) { nd = d; nearNote = n; } }
      for (const n of NOTES) g.label('note-' + n.id, n === nearNote && !g.cardOpen ? `${n.short}: ${n.text}` : null, n.at.clone().setY(1.75));
      if (nearNote && nd < bd) { const a = noteAction(nearNote); best = a ?? best; }
      g.label('relay-notes', phase === 'open' && !relay.active && !g.cardOpen && Math.hypot(zip.x - RELAY.x, zip.z - RELAY.z) < 3.2 ? 'Notes pinned to the relay: ' + relay.pinned : null, RELAY.clone().setY(2.3));
      // the Gate's face: eyes follow Zip, blinks, and moods
      talkT = Math.max(0, talkT - dt); blink -= dt; if (blink < -.12) blink = 2 + Math.random() * 3;
      look.set(zip.x - GATE.x, 1.4 - 3.05, zip.z - GATE.z).normalize();
      for (const e of eyes) {
        const dizzy = mood === 'dizzy', a = t * 9 * e.side;
        e.pupil.position.set(e.side * .33 + (dizzy ? Math.cos(a) * .07 : look.x * .08), .08 + (dizzy ? Math.sin(a) * .07 : look.y * .06), .2);
        e.white.scale.y = blink < 0 ? .1 : mood === 'happy' ? .6 : 1; e.pupil.visible = blink >= 0;
        e.brow.position.y = mood === 'smug' ? .4 : mood === 'oops' ? .3 : .34;
        e.brow.rotation.z = mood === 'smug' ? -e.side * .25 : mood === 'oops' ? e.side * .35 : mood === 'dizzy' ? Math.sin(t * 6) * .3 : 0;
      }
      mouth.scale.set(1, talkT > 0 ? .5 + Math.abs(Math.sin(t * 16)) * 1.2 : mood === 'oops' ? -.6 : mood === 'happy' ? 1.3 : .8, 1);
      face.rotation.z = mood === 'dizzy' ? Math.sin(t * 5) * .06 : 0;
      if (melt > 0) { melt = Math.max(0, melt - dt); seal.scale.setScalar(melt / 1.2 + .001); sealLow.scale.y = melt / 1.2 + .001; if (melt === 0) seal.visible = sealLow.visible = false; }
      satchelObj.rotation.y += dt; boards.forEach(b => { b.board.rotation.y = Math.sin(t + b.n.at.x) * .05; });
      sealMat.opacity = .55 + .08 * Math.sin(t * 2) + (flicker > 0 ? .3 * Math.abs(Math.sin(t * 25)) : 0); flicker = Math.max(0, flicker - dt);
      if (trap > 0) {
        if (trap === 3.2) trapAt.copy(zip);
        trap = Math.max(0, trap - dt); const k = trap > 2.6 ? (3.2 - trap) / .6 : trap < .6 ? trap / .6 : 1;
        cage.visible = trap > 0; cage.position.set(trapAt.x, 1.1 + (1 - k) * 3, trapAt.z);
        drones.forEach((d, i) => { d.visible = trap > 0; const a = t * 2 + i * 2.1; d.position.set(trapAt.x + Math.cos(a) * 1.4, 2.4, trapAt.z + Math.sin(a) * 1.4); });
      }
      if (crumble > 0) { crumble = Math.max(0, crumble - dt); const s = crumble > 0 ? Math.max(.05, Math.abs(Math.cos((2.4 - crumble) / 2.4 * Math.PI))) : 1; seal.scale.x = sealLow.scale.x = s; }
      if (ping > 0) { ping = Math.max(0, ping - dt); dishMat.emissiveIntensity = .1 + 1.2 * Math.abs(Math.sin(t * 6)) * (ping / 3); }
      path.forEach((d, i) => (d.material as T.MeshBasicMaterial).color.setHSL(.47, .5, .7 + .1 * Math.sin(t * 3 - i * .6)));
      return best ? { label: best.label, use: best.use } : null;
    },
  };
}
