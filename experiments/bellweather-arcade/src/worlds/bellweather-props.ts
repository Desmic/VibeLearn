import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mineralSurface } from '../surfaces';
import { mulberry32 } from '../vendor/rng';
import { mergeStatic } from '../kit/merge';
import { loadProp, propNow } from '../kit/kit';
import { lambertize } from '../painted';

// Bellweather's hand-made gameplay props (semantic hero pieces the kit cannot
// supply): notice boards, lantern posts, the satchel pedestal, the relay and
// the talking gate's stone arch. Each is a parameterised builder, so a later
// island can reuse them with other colours or sizes. Materials share the
// promenade's mineral grain so the island matches the town.

let grain: T.Texture | undefined;
const stoneTex = () => (grain ??= mineralSurface(91));
const cache = new Map<string, T.Material>();
export function stone(color = '#efe2c9') {
  const k = 'stone' + color; let m = cache.get(k);
  if (!m) { const t = stoneTex().clone(); t.repeat.set(1.4, 1.4); t.needsUpdate = true; m = new T.MeshLambertMaterial({ color, map: t }); cache.set(k, m); }
  return m;
}
export const flat = (color: string, emissive = '#000000', e = 0) => {
  const k = color + emissive + e; let m = cache.get(k);
  if (!m) { m = new T.MeshLambertMaterial({ color, emissive, emissiveIntensity: e }); cache.set(k, m); }
  return m;
};
const WOOD = '#7a5a45', WOOD_DARK = '#5b4334', BRASS = '#d9b36a';

/** A post with a hanging lantern that glows. */
export function lanternPost(h = 1.7, glow = '#ffd48a') {
  const g = new T.Group();
  const post = new T.Mesh(new T.CylinderGeometry(.045, .06, h, 7), flat(WOOD)); post.position.y = h / 2; g.add(post);
  const arm = new T.Mesh(new T.BoxGeometry(.36, .05, .05), flat(WOOD_DARK)); arm.position.set(.16, h - .08, 0); g.add(arm);
  const cage = new T.Mesh(new T.CylinderGeometry(.08, .1, .2, 6), flat('#2f3a4a')); cage.position.set(.3, h - .26, 0); g.add(cage);
  const light = new T.Mesh(new T.SphereGeometry(.07, 10, 8), new T.MeshBasicMaterial({ color: glow })); light.position.copy(cage.position); g.add(light);
  const cap = new T.Mesh(new T.ConeGeometry(.12, .1, 6), flat(WOOD_DARK)); cap.position.set(.3, h - .12, 0); g.add(cap);
  return g;
}

/** Notice board: two posts, a frame with a little gable roof, the note pinned
 *  on it. `board` is the note itself (it sways). The Warden's sign is a dark
 *  plaque with a violet glow instead of paper. */
export function noticeBoard(kind: 'paper' | 'warden', seed = 1) {
  const r = mulberry32(seed), g = new T.Group();
  const w = .9, top = 1.72;
  for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(.07, top, .07), flat(WOOD)); p.position.set(s * w / 2, top / 2, 0); p.rotation.z = (r() - .5) * .04; g.add(p); }
  const back = new T.Mesh(new T.BoxGeometry(w + .04, .66, .04), flat(WOOD_DARK)); back.position.set(0, 1.25, -.03); g.add(back);
  for (const s of [-1, 1]) { const roof = new T.Mesh(new T.BoxGeometry(.62, .04, .22), flat('#8a4f4a')); roof.position.set(s * .27, top + .08, 0); roof.rotation.z = -s * .32; g.add(roof); }
  let board: T.Mesh;
  if (kind === 'warden') {
    board = new T.Mesh(new RoundedBoxGeometry(.74, .5, .04, 2, .03), flat('#3b2766', '#7b4fd6', .35));
    const edge = new T.Mesh(new T.TorusGeometry(.33, .012, 4, 24), new T.MeshBasicMaterial({ color: '#b07bff' })); edge.scale.y = .66; edge.position.z = .025; board.add(edge);
  } else {
    board = new T.Mesh(new T.PlaneGeometry(.66, .48, 4, 3), flat('#fbf2dc', '#fff2c8', .12));
    const pos = board.geometry.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, (r() - .5) * .012 + Math.abs(pos.getX(i)) * .02);
    board.geometry.computeVertexNormals(); board.rotation.z = (r() - .5) * .08;
    for (const [x, y] of [[-.28, .19], [.28, .19]]) { const pin = new T.Mesh(new T.SphereGeometry(.022, 6, 4), flat('#d24a4a')); pin.position.set(x, y, .02); board.add(pin); }
    // pencil lines on the note
    const lines = new T.Mesh(new T.PlaneGeometry(.46, .2), new T.MeshBasicMaterial({ map: scribble(seed), transparent: true, depthWrite: false })); lines.position.z = .008; board.add(lines);
  }
  board.position.set(0, 1.25, .01); g.add(board);
  return { group: g, board };
}

function scribble(seed: number) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const c = cv.getContext('2d')!, r = mulberry32(seed + 7);
  c.strokeStyle = 'rgba(70,80,120,.4)'; c.lineWidth = 1.5; c.lineCap = 'round';
  for (let l = 0; l < 4; l++) { const y = 10 + l * 14; c.beginPath(); c.moveTo(6, y); let x = 6; while (x < 110 - r() * 30) { x += 4 + r() * 8; c.lineTo(x, y + (r() - .5) * 4); } c.stroke(); }
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t;
}

/** Stone pedestal with a leather satchel on it. `satchel` spins and hides. */
export function satchelPedestal() {
  const g = new T.Group();
  const prof = [[0, 0], [.34, 0], [.34, .08], [.24, .14], [.2, .62], [.3, .7], [.3, .78], [0, .78]].map(([x, y]) => new T.Vector2(x, y));
  const ped = new T.Mesh(new T.LatheGeometry(prof, 10), stone('#e8dcc4')); g.add(ped);
  const satchel = new T.Group(); satchel.position.y = 1.02; g.add(satchel);
  const body = new T.Mesh(new RoundedBoxGeometry(.48, .34, .18, 3, .06), flat('#a86e46', '#ffb347', .12)); satchel.add(body);
  const flap = new T.Mesh(new RoundedBoxGeometry(.5, .2, .04, 2, .02), flat('#8d5a38')); flap.position.set(0, .08, .1); flap.rotation.x = -.15; satchel.add(flap);
  const buckle = new T.Mesh(new T.BoxGeometry(.08, .06, .02), flat(BRASS, '#806020', .2)); buckle.position.set(0, .0, .125); satchel.add(buckle);
  const strap = new T.Mesh(new T.TorusGeometry(.2, .018, 5, 20, Math.PI), flat('#6b4630')); strap.position.y = .16; satchel.add(strap);
  return { group: g, satchel };
}

/** Landing pad: a ring of warm stones round a pale disc. */
export function landingPad(radius = 1.2, seed = 3) {
  const g = new T.Group(), r = mulberry32(seed);
  const disc = new T.Mesh(new T.CylinderGeometry(radius * .78, radius * .8, .06, 28), stone('#efe6d2')); disc.position.y = .02; g.add(disc);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, s = new T.Mesh(new RoundedBoxGeometry(radius * .42, .1, .3, 2, .04), stone(i % 2 ? '#d9c3a0' : '#e4cfab'));
    s.position.set(Math.cos(a) * radius * .95, .03 + r() * .02, Math.sin(a) * radius * .95); s.rotation.y = -a + Math.PI / 2 + (r() - .5) * .1; g.add(s);
  }
  // compass inlay pointing at the gate
  const inlay = new T.Mesh(new T.RingGeometry(radius * .3, radius * .36, 24).rotateX(-Math.PI / 2), flat('#6fb8a8')); inlay.position.y = .056; g.add(inlay);
  const arrow = new T.Mesh(new T.ConeGeometry(radius * .12, radius * .34, 3).rotateX(-Math.PI / 2), flat('#6fb8a8')); arrow.position.set(0, .06, -radius * .5); arrow.scale.y = .2; g.add(arrow);
  return g;
}

/** Relay: stone plinth, wooden mast with brass bands, a dish that pings and a lantern. */
export function relayTower() {
  const g = new T.Group();
  for (const [r0, h, y, c] of [[.62, .22, .11, '#d9c7a8'], [.48, .2, .32, '#e6d6ba'], [.34, .14, .49, '#efe2c9']] as const) {
    const b = new T.Mesh(new T.CylinderGeometry(r0 * .92, r0, h, 8), stone(c)); b.position.y = y; g.add(b);
  }
  const mast = new T.Mesh(new T.CylinderGeometry(.07, .12, 2.8, 8), flat(WOOD)); mast.position.y = 1.96; g.add(mast);
  for (const y of [.9, 1.8, 2.7]) { const band = new T.Mesh(new T.CylinderGeometry(.1, .1, .06, 8), flat(BRASS)); band.position.y = y; g.add(band); }
  const dishMat = flat('#e8dcc0', '#6fe0c9', .1);
  const dish = new T.Mesh(new T.SphereGeometry(.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.3), dishMat); dish.position.y = 3.25; dish.rotation.x = .7; dish.material.side = T.DoubleSide; g.add(dish);
  const rim = new T.Mesh(new T.TorusGeometry(.47, .03, 6, 28), flat(BRASS)); rim.position.copy(dish.position); rim.rotation.x = .7 - Math.PI / 2; rim.position.y += .2; rim.position.z += .17; g.add(rim);
  const feed = new T.Mesh(new T.CylinderGeometry(.015, .015, .5, 5), flat('#2f3a4a')); feed.position.set(0, 3.45, .16); feed.rotation.x = .7; g.add(feed);
  const tip = new T.Mesh(new T.SphereGeometry(.05, 8, 6), new T.MeshBasicMaterial({ color: '#9ff5e0' })); tip.position.set(0, 3.64, .36); g.add(tip);
  const lamp = lanternPost(1.2, '#9ff5e0'); lamp.position.set(-.55, 0, .2); g.add(lamp);
  return { group: g, dishMat };
}

/** The talking gate's arch: stone voussoirs over block pillars. Sizes match
 *  the old greybox (radius 1.7 at y 1.4) so the face and seal still fit. */
export function gateArch(radius = 1.7, springY = 1.4) {
  const g = new T.Group(), r = mulberry32(17);
  const n = 11, block = new RoundedBoxGeometry(.5, .36, .56, 2, .05);
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (i + .5) / n, b = new T.Mesh(block, stone(i === (n - 1) / 2 ? '#f4ead6' : i % 2 ? '#e9dbc0' : '#efe2c9'));
    b.position.set(Math.cos(a) * (radius + .08), springY + Math.sin(a) * (radius + .08), 0); b.rotation.z = a - Math.PI / 2; b.scale.x = .9 + r() * .1; g.add(b);
  }
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const b = new T.Mesh(new RoundedBoxGeometry(.56, .34, .6, 2, .05), stone(k % 2 ? '#e4d5b8' : '#ecdfc5'));
      b.position.set(s * (radius + .08), .17 + k * .35, 0); b.rotation.y = (r() - .5) * .08; g.add(b);
    }
    const base = new T.Mesh(new RoundedBoxGeometry(.74, .16, .76, 2, .04), stone('#d6c4a3')); base.position.set(s * (radius + .08), .08, 0); g.add(base);
    // a few ivy leaves climbing the pillar
    for (let k = 0; k < 7; k++) {
      const leaf = new T.Mesh(new T.CircleGeometry(.07 + r() * .04, 5), flat(k % 2 ? '#5f8a66' : '#7aa46e')); leaf.material.side = T.DoubleSide;
      leaf.position.set(s * (radius + .08) + (r() - .5) * .5, .2 + r() * 1.3, .31); g.add(leaf);
    }
  }
  return g;
}

// ---------------------------------------------------------------- Loom Isle
const THREADS = ['#e86f6f', '#f0c05a', '#6fb8e8', '#b07bff', '#7cc98a', '#f29ac0'];

/** A drying line: two posts, a rope, cloths hanging in the wind. */
export function clothLine(p: { len?: number; seed?: number }) {
  const len = (p.len as number) ?? 3.6, r = mulberry32((p.seed as number) ?? 5), g = new T.Group();
  for (const s of [-1, 1]) { const post = new T.Mesh(new T.CylinderGeometry(.05, .06, 2.1, 6), flat(WOOD)); post.position.set(s * len / 2, 1.05, 0); g.add(post); }
  const sag = (x: number) => 1.95 - .18 * (1 - (2 * x / len) ** 2);
  const rope = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([-1, -.5, 0, .5, 1].map(t => new T.Vector3(t * len / 2, sag(t * len / 2), 0))), 12, .012, 4), flat('#d8c8a8')); g.add(rope);
  const n = Math.max(2, Math.floor(len / .7));
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + .7) * len / (n + .4), w = .38 + r() * .2, h = .55 + r() * .4;
    const cloth = new T.Mesh(new T.PlaneGeometry(w, h, 2, 3), flat(THREADS[Math.floor(r() * THREADS.length)]));
    const cp = cloth.geometry.attributes.position; for (let k = 0; k < cp.count; k++) cp.setZ(k, Math.sin(cp.getY(k) * 4 + i) * .04);
    cloth.geometry.computeVertexNormals(); (cloth.material as T.Material).side = T.DoubleSide;
    cloth.position.set(x, sag(x) - h / 2, 0); cloth.rotation.y = (r() - .5) * .3; g.add(cloth);
  }
  return g;
}

/** A stack of thread spools. */
export function spoolStack(p: { n?: number; seed?: number }) {
  const n = (p.n as number) ?? 5, r = mulberry32((p.seed as number) ?? 9), g = new T.Group();
  for (let i = 0; i < n; i++) {
    const s = new T.Group(), c = THREADS[Math.floor(r() * THREADS.length)];
    const thread = new T.Mesh(new T.CylinderGeometry(.13, .13, .22, 12), flat(c)); s.add(thread);
    for (const y of [-.12, .12]) { const rim = new T.Mesh(new T.CylinderGeometry(.16, .16, .03, 12), flat(WOOD)); rim.position.y = y; s.add(rim); }
    const layer = i < 3 ? 0 : 1, k = layer ? i - 3 : i;
    s.position.set((k - (layer ? .5 : 1)) * .34, .14 + layer * .27, (r() - .5) * .06); if (r() < .3 && !layer) { s.rotation.x = Math.PI / 2; s.position.y = .16; }
    g.add(s);
  }
  return g;
}

/** The Word Loom (Stop 2's machine), a stand-in until its puzzle is designed:
 *  a big wooden frame, warp threads, a half-woven band of coloured pieces and
 *  empty slots along the top beam. */
export function wordLoom(p: { slots?: number }) {
  const slots = (p.slots as number) ?? 6, g = new T.Group(), W = 2.6, H = 2.3;
  for (const s of [-1, 1]) {
    const leg = new T.Mesh(new T.BoxGeometry(.16, H, .16), flat(WOOD)); leg.position.set(s * W / 2, H / 2, 0); g.add(leg);
    const foot = new T.Mesh(new T.BoxGeometry(.2, .12, 1.0), flat(WOOD_DARK)); foot.position.set(s * W / 2, .06, 0); g.add(foot);
  }
  for (const y of [.55, H - .1]) { const beam = new T.Mesh(new T.CylinderGeometry(.07, .07, W + .2, 10), flat(WOOD_DARK)); beam.rotation.z = Math.PI / 2; beam.position.y = y; g.add(beam); }
  const warp = 18;
  for (let i = 0; i < warp; i++) { const t = new T.Mesh(new T.CylinderGeometry(.006, .006, H - .65, 3), flat('#efe2c9')); t.position.set(-W / 2 + .2 + i * (W - .4) / (warp - 1), (H + .45) / 2, 0); g.add(t); }
  // woven band: coloured pieces of uneven width (pieces are not whole words)
  let x = -W / 2 + .2; const r = mulberry32(31);
  while (x < W / 2 - .3) { const w = .14 + r() * .32, piece = new T.Mesh(new T.BoxGeometry(Math.min(w, W / 2 - .2 - x), .26, .05), flat(THREADS[Math.floor(r() * THREADS.length)])); piece.position.set(x + w / 2, .85, 0); g.add(piece); x += w + .02; }
  // empty slots on a brass rail: the engine's limited room
  for (let i = 0; i < slots; i++) { const s = new T.Mesh(new T.BoxGeometry(.3, .2, .06), flat('#3b3550', '#b07bff', .15)); s.position.set(-W / 2 + .35 + i * (W - .7) / (slots - 1), H + .22, 0); g.add(s); }
  const rail = new T.Mesh(new T.BoxGeometry(W + .1, .05, .1), flat(BRASS)); rail.position.y = H + .08; g.add(rail);
  return g;
}

/** An authored model (public/props/<name>.glb, from authoring/props/) in place of a
 *  code-built stand-in. Preloaded props swap in at once; otherwise the stand-in shows
 *  until the file arrives (and stays if it never does). */
export function authored(standIn: T.Object3D, name: string, tune?: (m: T.Object3D) => void): T.Object3D {
  const prep = (m: T.Object3D) => { lambertize(m); tune?.(m); m.traverse(o => { (o as T.Mesh).castShadow = (o as T.Mesh).receiveShadow = true; }); return m; };
  const now = propNow(name); if (now) return prep(now);
  const g = new T.Group(); g.add(standIn);
  loadProp(name).then(m => { standIn.visible = false; g.add(prep(m)); }).catch(e => console.warn(`[prop] ${name} unavailable; keeping the stand-in`, e));
  return g;
}
const loomTune = (m: T.Object3D) => m.traverse(o => {
  const mesh = o as T.Mesh; if (!mesh.isMesh) return; const mat = mesh.material as T.MeshLambertMaterial;
  if (/^(Threads|Band)/.test(mesh.name)) mat.side = T.DoubleSide;
  if (/^Slots/.test(mesh.name)) { mat.emissive.set('#b07bff'); mat.emissiveIntensity = .35; }
});

/** Builders a world spec can name in `props` (each merged to few draw calls). */
const merged = (f: (p: Record<string, unknown>) => T.Object3D) => (p: Record<string, unknown>) => { const o = f(p); mergeStatic(o); return o; };
export const BELLWEATHER_PROPS = {
  wordLoom: (p: Record<string, unknown>) => { const o = wordLoom(p as { slots?: number }); mergeStatic(o); return authored(o, 'word-loom', loomTune); },
  clothLine: merged(p => clothLine(p as { len?: number; seed?: number })),
  spoolStack: merged(p => spoolStack(p as { n?: number; seed?: number })),
  lanternPost: merged(p => lanternPost((p.height as number) ?? 1.8)),
};
