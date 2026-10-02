import * as T from 'three';
import type { LearningEvent } from './speech-puzzle';

// Greybox of "Speech 2: open the Blossom Isle gate" and the relay changed case
// (Level 1, outcome `context`), from the Sky Islands Rescue storyboard.
// Stand-in: until the Blossom Isle is walkable, the arrival plaza plays the
// island and the conservatory arch plays its sealed gate.
//
// What it tests: the engine only knows what it is handed. The player gathers
// notes, commits up to two to the satchel, predicts where the command will send
// the gate and what Mira's page supports, then sees the world follow the input.
// Wrong input changes the world (decoy cage, fallen bridge, a blended command)
// and is recoverable. First choices are recorded apart from later attempts.

type NoteId = 'mira' | 'poster' | 'warden' | 'rumour';
interface Note { id: NoteId; title: string; text: string; pos: T.Vector3 }
interface Opts {
  host: HTMLElement;
  addBox: (minX: number, maxX: number, minZ: number, maxZ: number) => object;
  removeBox: (b: object) => void;
  solid: (x: number, z: number, r: number) => void;
  teleport: (x: number, z: number, yaw: number) => void;
  onEvent?: (e: LearningEvent) => void;
}

const NOTES: Note[] = [
  { id: 'mira', title: 'Torn map page', text: 'In Mira\'s hand: "Past the Lotus Terraces, then up to the bell gardens. Keep going. M."', pos: new T.Vector3(-6.2, .13, 4.6) },
  { id: 'poster', title: 'Festival poster, last year', text: '"Sky Festival! Cross the Old Bridge to the bell gardens." The Old Bridge fell in this morning\'s storm.', pos: new T.Vector3(7.2, .13, 3.3) },
  { id: 'warden', title: 'Sign with the Warden\'s mark', text: '"Your friends are held at the East Falls."', pos: new T.Vector3(4.9, .13, -1.2) },
  { id: 'rumour', title: 'Townsperson\'s scribble', text: '"Someone went somewhere this morning. Big hurry."', pos: new T.Vector3(-2.6, .13, 7.4) },
];
const PORTAL_X = 1.1, PORTAL_Z = -3.45, GATE_STONE = new T.Vector3(3.55, .13, -2.3), CLASP = new T.Vector3(-3.6, .13, 2.6);
const RELAY = new T.Vector3(-3.2, .13, -9.2);

export function buildGatePuzzle(scene: T.Scene, opts: Opts) {
  const root = new T.Group(); root.name = 'gate-puzzle'; root.visible = false; scene.add(root);
  const std = (color: string, emissive = '#000000', e = 0) => new T.MeshStandardMaterial({ color, emissive, emissiveIntensity: e, roughness: .7 });
  // the Warden's seal across the arch
  const sealMat = new T.MeshBasicMaterial({ color: '#7b4fd6', transparent: true, opacity: .55, side: T.DoubleSide, depthWrite: false });
  const seal = new T.Mesh(new T.PlaneGeometry(4.5, 5.6), sealMat); seal.position.set(PORTAL_X, 2.9, PORTAL_Z); root.add(seal);
  let sealBox: object | null = null;
  // gate stone, clasp pedestal, note posts, relay tower
  const stone = new T.Mesh(new T.CylinderGeometry(.3, .4, .95, 8), std('#8d9bb0')); stone.position.copy(GATE_STONE).setY(.6); root.add(stone);
  const stoneEye = new T.Mesh(new T.SphereGeometry(.15, 14, 10), std('#d9c8ff', '#9d7bff', .4)); stoneEye.position.copy(GATE_STONE).setY(1.18); root.add(stoneEye);
  const clasp = new T.Mesh(new T.TorusGeometry(.16, .05, 10, 24), std('#ffd98a', '#ffb347', .6)); clasp.position.copy(CLASP).setY(1.0); root.add(clasp);
  const pedestal = new T.Mesh(new T.CylinderGeometry(.22, .28, .8, 8), std('#c8b99a')); pedestal.position.copy(CLASP).setY(.53); root.add(pedestal);
  const posts = NOTES.map(n => {
    const g = new T.Group(); g.position.copy(n.pos); root.add(g);
    const post = new T.Mesh(new T.CylinderGeometry(.04, .05, 1.3, 6), std('#5b4636')); post.position.y = .65; g.add(post);
    const board = new T.Mesh(new T.BoxGeometry(.55, .38, .04), std(n.id === 'warden' ? '#4a2f7a' : '#efe3c4', n.id === 'warden' ? '#6a3fc0' : '#000000', .2)); board.position.y = 1.35; g.add(board);
    return g;
  });
  const tower = new T.Group(); tower.position.copy(RELAY); root.add(tower);
  const mast = new T.Mesh(new T.CylinderGeometry(.08, .16, 3.2, 8), std('#1c4972')); mast.position.y = 1.6; tower.add(mast);
  const dish = new T.Mesh(new T.SphereGeometry(.45, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), std('#e8dcc0', '#6fe0c9', .1)); dish.position.y = 3.3; dish.rotation.x = -.6; tower.add(dish);
  // consequence props
  const cage = new T.Mesh(new T.CylinderGeometry(.8, .8, 2.2, 10, 1, true), new T.MeshBasicMaterial({ color: '#4a2f7a', wireframe: true })); cage.visible = false; root.add(cage);
  const drones = [0, 1, 2].map(i => { const d = new T.Mesh(new T.SphereGeometry(.18, 12, 8), std('#2a1f40', '#b07bff', .8)); d.visible = false; root.add(d); return d; });
  const path = [0, 1, 2, 3, 4, 5].map(i => { const d = new T.Mesh(new T.CircleGeometry(.22, 16).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: '#9fe0d0' })); d.position.set(PORTAL_X, .16, PORTAL_Z - .8 - i * 1.1); d.visible = false; root.add(d); return d; });

  // UI: shared panel style with Speech 1, plus a satchel strip
  const panel = document.createElement('div'); panel.className = 'speech-panel'; panel.hidden = true; opts.host.appendChild(panel);
  const satchelBar = document.createElement('div'); satchelBar.className = 'satchel-bar'; satchelBar.hidden = true; opts.host.appendChild(satchelBar);
  const useBtn = document.createElement('button'); useBtn.className = 'route speech-use'; useBtn.hidden = true; opts.host.appendChild(useBtn);
  let busy = false;
  const show = (text: string, buttons: [string, () => void][] = []) => {
    panel.hidden = false; panel.innerHTML = ''; busy = true;
    const p = document.createElement('p'); p.textContent = text; panel.appendChild(p);
    const row = document.createElement('div'); row.className = 'speech-choices'; panel.appendChild(row);
    for (const [label, fn] of buttons) { const b = document.createElement('button'); b.textContent = label; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); row.appendChild(b); }
  };
  const close = () => { panel.hidden = true; busy = false; };

  // state
  let phase: 'idle' | 'arrived' | 'open' | 'done' = 'idle', hasClasp = false;
  const satchel: NoteId[] = [];
  const read = new Set<NoteId>();
  const firsts = new Set<string>();
  const log = (activity: string, decision: string, choice: string, correct: boolean) => {
    const e: LearningEvent = { activity, decision, choice, correct, first: !firsts.has(activity + decision), assisted: false, t: Date.now(), rules: 'gate-puzzle@legacy' };
    firsts.add(activity + decision); ((window as any).__vlLearning ??= []).push(e); opts.onEvent?.(e);
  };
  const renderSatchel = () => {
    satchelBar.hidden = !hasClasp || phase === 'done'; satchelBar.innerHTML = '<b>Satchel</b>';
    for (let i = 0; i < 2; i++) { const id = satchel[i]; const c = document.createElement('span'); c.className = 'chip ' + (id ? 'rail' : 'empty'); c.textContent = id ? NOTES.find(n => n.id === id)!.title : 'empty'; satchelBar.appendChild(c); }
  };

  const openNote = (n: Note) => {
    read.add(n.id);
    const inBag = satchel.includes(n.id);
    const buttons: [string, () => void][] = [];
    if (hasClasp && !inBag && satchel.length < 2) buttons.push(['Put it in the satchel', () => { satchel.push(n.id); renderSatchel(); close(); }]);
    if (inBag) buttons.push(['Take it out', () => { satchel.splice(satchel.indexOf(n.id), 1); renderSatchel(); close(); }]);
    if (hasClasp && !inBag && satchel.length >= 2) buttons.push(['Satchel is full', () => close()]);
    buttons.push(['Leave it', () => close()]);
    show(`${n.title}: ${n.text}`, buttons);
  };

  // --- gate
  const gateOutcome = (): 'open' | 'decoy' | 'stale' | 'blend' | 'vague' => {
    const has = (id: NoteId) => satchel.includes(id);
    if (has('mira') && has('warden')) return 'blend';
    if (has('warden')) return 'decoy';
    if (has('mira') && has('poster')) return 'stale';
    if (has('mira')) return 'open';
    if (has('poster')) return 'stale';
    return 'vague';
  };
  const gateSteps = {
    start() {
      if (!hasClasp) { show('The gate stone listens for a command, but the engine knows words, not this island. It needs notes, and something to carry them in.', [['OK', close]]); return; }
      if (!satchel.length) { show('The satchel is empty. The engine would only know the word "gate". Gather notes first.', [['OK', close]]); return; }
      show('Commit the satchel? Only what is inside reaches the engine.', [['Commit', () => gateSteps.predict()], ['Not yet', close]]);
    },
    predict() {
      show('Before it speaks: where will this command send the gate?', [
        ['The Lotus Terraces', () => gateSteps.support('lotus')],
        ['The East Falls', () => gateSteps.support('east')],
        ['The Old Bridge', () => gateSteps.support('bridge')],
        ['Nowhere clear', () => gateSteps.support('unclear')],
      ]);
    },
    support(pred: string) {
      const out = gateOutcome();
      const expected = { open: 'lotus', decoy: 'east', stale: 'bridge', blend: 'unclear', vague: 'unclear' }[out];
      log('blossom-gate', 'destination-prediction', pred, pred === expected);
      log('blossom-gate', 'context-selection', satchel.slice().sort().join('+'), out === 'open');
      if (!read.has('mira')) { gateSteps.run(); return; }
      show('And what does Mira\'s page actually support?', [
        ['She went past the Lotus Terraces toward the bell gardens', () => { log('blossom-gate', 'source-support', 'route', true); gateSteps.run(); }],
        ['She is safe', () => { log('blossom-gate', 'source-support', 'safe', false); gateSteps.run(); }],
        ['She is held at the East Falls', () => { log('blossom-gate', 'source-support', 'east', false); gateSteps.run(); }],
      ]);
    },
    run() {
      const out = gateOutcome(), heard = satchel.map(id => NOTES.find(n => n.id === id)!.title.toLowerCase()).join(' and ');
      if (out === 'open') {
        seal.visible = false; if (sealBox) opts.removeBox(sealBox); sealBox = null; path.forEach(d => (d.visible = true)); phase = 'open';
        show(`The engine heard ${heard}: "Open the way past the Lotus Terraces." The seal dissolves.`, [['Walk on', close]]);
      } else if (out === 'decoy') {
        trap = 3.2; show(`The engine heard ${heard}: "Open the way to the East Falls." It did exactly what its note said. Drones drop a cage…`);
        setTimeout(() => show('Zip slips out. The Warden\'s sign sent the gate to a trap. Change what the satchel carries, then try again.', [['OK', close]]), 3300);
      } else if (out === 'stale') {
        crumble = 2.4; show(`The engine heard ${heard}: "Open the way over the Old Bridge." The seal parts onto empty air. That bridge fell this morning.`);
        setTimeout(() => show('Last year\'s poster was true once, not now. The seal closes again.', [['OK', close]]), 2600);
      } else if (out === 'blend') {
        flicker = 2; show(`The engine heard ${heard}, two stories that disagree. It blends them: "Open the way to the Lotus… East… Falls." The seal sputters and holds.`, [['OK', close]]);
      } else {
        flicker = 1.2; show(`The engine heard ${heard || 'nothing useful'}. It says "Open the gate." The stone answers: to where?`, [['OK', close]]);
      }
      renderSatchel();
    },
  };

  // --- relay (changed case: new purpose, new notes, less help)
  const relaySteps = {
    start() {
      show('The relay can reach anyone listening, if it knows the channel. Three cards are pinned to it. Pick one to give the relay, or say you can\'t tell.', [
        ['Lantern tag: "Lantern channel 7. M."', () => relaySteps.pick('7')],
        ['Warden broadcast: "All channels jammed except 3."', () => relaySteps.pick('3')],
        ['Festival schedule: "Announcements on channel 5."', () => relaySteps.pick('5')],
        ['Can\'t tell from these', () => relaySteps.pick('unknown')],
      ]);
    },
    pick(ch: string) {
      log('relay-contact', 'context-selection', ch, ch === '7');
      if (ch === 'unknown') { show('Fair: then look again at who wrote each card, and when.', [['Look again', () => relaySteps.start()]]); return; }
      show(`The relay starts: "Channel ${ch}. Mira, it's" … Before the next word: what does it read?`, [
        ['Only "it\'s"', () => relaySteps.next(ch, 'newest')],
        ['"Mira, it\'s"', () => relaySteps.next(ch, 'request')],
        [`"Channel ${ch}. Mira, it's"`, () => relaySteps.next(ch, 'all')],
      ]);
    },
    next(ch: string, which: string) {
      log('relay-contact', 'next-input', which, which === 'all');
      if (which !== 'all') { show(which === 'newest' ? 'Reading only "it\'s", it says "it\'s it\'s…" and the call drops.' : 'Without the channel card it forgets where to send: the call goes nowhere.', [['Try again', () => relaySteps.pick(ch)]]); return; }
      if (ch === '3') { show('"Channel 3. Mira, it\'s Zip." A cold laugh answers. The Warden\'s channel. The call cuts off.', [['Try again', () => relaySteps.start()]]); return; }
      if (ch === '5') { show('"Channel 5. Mira, it\'s Zip." Only the festival jingle, looping. Nobody is listening there today.', [['Try again', () => relaySteps.start()]]); return; }
      phase = 'done'; ping = 3;
      show('"Channel 7. Mira, it\'s Zip." Static… then her voice: "Zip! I kept the lantern. Follow my marks. They\'re taking us past Loom Isle."', [['End of the greybox', close]]);
      renderSatchel();
    },
  };

  // interactables: the nearest one within reach offers one button
  const things: { pos: T.Vector3; r: number; label: () => string; use: () => void; when: () => boolean }[] = [
    { pos: CLASP, r: 1.6, label: () => 'Take the Satchel Clasp', when: () => !hasClasp, use: () => { hasClasp = true; clasp.visible = false; renderSatchel(); show('The Satchel Clasp clicks into the engine. Zip can carry two notes into it. Nothing reaches the engine until you commit at the gate.', [['OK', close]]); } },
    ...NOTES.map((n, i) => ({ pos: n.pos, r: 1.5, label: () => `Read: ${n.title}`, when: () => phase === 'arrived', use: () => openNote(n) })),
    { pos: GATE_STONE, r: 1.8, label: () => 'Speak at the gate stone', when: () => phase === 'arrived', use: () => gateSteps.start() },
    { pos: RELAY, r: 2.2, label: () => 'Use the relay', when: () => phase === 'open', use: () => relaySteps.start() },
  ];
  let current: typeof things[number] | null = null;
  useBtn.addEventListener('click', e => { e.stopPropagation(); current?.use(); });

  let trap = 0, crumble = 0, flicker = 0, ping = 0, t = 0;
  const trapAt = new T.Vector3();
  const tick = (dt: number, zipPos: T.Vector3) => {
    if (phase === 'idle') return;
    t += dt;
    // nearest interactable
    let best: typeof current = null, bd = 1e9;
    for (const th of things) { if (!th.when()) continue; const d = Math.hypot(zipPos.x - th.pos.x, zipPos.z - th.pos.z); if (d < th.r && d < bd) { bd = d; best = th; } }
    current = best; useBtn.hidden = !best || busy; if (best) useBtn.textContent = best.label();
    if (busy && best === null && !panel.hidden && trap <= 0 && crumble <= 0) { /* keep panel until dismissed */ }
    clasp.rotation.y += dt * 1.5;
    sealMat.opacity = .5 + .08 * Math.sin(t * 2) + (flicker > 0 ? .35 * Math.abs(Math.sin(t * 25)) : 0);
    flicker = Math.max(0, flicker - dt);
    // decoy trap: cage drops around Zip, drones circle, then lift
    if (trap > 0) {
      if (trap === 3.2) trapAt.copy(zipPos);
      trap = Math.max(0, trap - dt); const k = trap > 2.6 ? (3.2 - trap) / .6 : trap < .6 ? trap / .6 : 1;
      cage.visible = trap > 0; cage.position.set(trapAt.x, 1.1 + (1 - k) * 3, trapAt.z);
      drones.forEach((d, i) => { d.visible = trap > 0; const a = t * 2 + i * 2.1; d.position.set(trapAt.x + Math.cos(a) * 1.4, 2.4 + Math.sin(t * 3 + i) * .2, trapAt.z + Math.sin(a) * 1.4); });
    }
    // stale: the seal parts onto empty air, then closes
    if (crumble > 0) { crumble = Math.max(0, crumble - dt); seal.scale.x = crumble > 0 ? Math.max(.05, Math.abs(Math.cos((2.4 - crumble) / 2.4 * Math.PI))) : 1; }
    path.forEach((d, i) => { (d.material as T.MeshBasicMaterial).color.setHSL(.47, .5, .7 + .1 * Math.sin(t * 3 - i * .6)); });
    if (ping > 0) { ping = Math.max(0, ping - dt); (dish.material as T.MeshStandardMaterial).emissiveIntensity = .1 + 1.2 * Math.abs(Math.sin(t * 6)) * (ping / 3); }
  };
  return {
    tick,
    get active() { return busy; },
    arrive() {
      root.visible = true; phase = 'arrived';
      for (const n of NOTES) opts.solid(n.pos.x, n.pos.z, .25);
      opts.solid(RELAY.x, RELAY.z, .35); opts.solid(GATE_STONE.x, GATE_STONE.z, .45); opts.solid(CLASP.x, CLASP.z, .35);
      sealBox = opts.addBox(PORTAL_X - 2.4, PORTAL_X + 2.4, PORTAL_Z - .3, PORTAL_Z + .25);
      opts.teleport(1.2, 6.5, 0);
      show('Greybox: the arrival plaza stands in for the Blossom Isle, and the arch is its gate. The Warden has sealed it. Look around.', [['Explore', close]]);
    },
  };
}
