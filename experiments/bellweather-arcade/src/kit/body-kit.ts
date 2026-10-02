import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../vendor/rng';
import { loaderFor } from './kit';

// Body kit: a library of character parts (authoring/characters/build_body_kit.py)
// skinned to the shared humanoid skeleton. A "look" picks parts and colours; the
// kit assembles them into ONE geometry (one draw call, one material per person)
// that binds to any skeleton with the same bone names, so the shared clip
// library animates every character. Game-agnostic: another game ships its own
// kit file and looks.
//
// Part colours: each vertex has a light detail colour and a code in uv.x:
// 0 keeps the colour, 1 multiplies it by the part's main colour, 2 by its accent.

export interface BodyKit { parts: Map<string, T.BufferGeometry>; names: string[] }
export interface LookPart { part: string; main?: string; accent?: string }
export interface Look { parts: LookPart[]; height?: number }

let pending: Promise<BodyKit> | null = null;
/** load a kit once (later calls share it) */
export function loadBodyKit(url = '/characters/body-kit.glb'): Promise<BodyKit> {
  if (pending) return pending;
  const loader = loaderFor();   // Draco-ready
  pending = loader.loadAsync(url).then(d => {
    const parts = new Map<string, T.BufferGeometry>();
    d.scene.traverse(o => {
      const m = o as T.SkinnedMesh; if (!m.isSkinnedMesh) return;
      const g = m.geometry, names = m.skeleton.bones.map(b => b.name);
      g.userData.boneNames = names; parts.set(String(m.userData.name ?? m.name).replace(/\.\d+$/, ''), g);   // the loader strips dots from .name
    });
    return { parts, names: [...parts.keys()].sort() };
  });
  return pending;
}

/** merge a look's parts into one geometry skinned to `boneOrder` (bone names in skeleton order) */
export function assembleLook(kit: BodyKit, look: Look, boneOrder: string[]): T.BufferGeometry {
  const out: T.BufferGeometry[] = [];
  const main = new T.Color(), accent = new T.Color(), c = new T.Color();
  for (const lp of look.parts) {
    const src = kit.parts.get(lp.part); if (!src) { console.warn('[body-kit] no part', lp.part); continue; }
    const g = new T.BufferGeometry();
    const P = src.getAttribute('position'), N = src.getAttribute('normal'), UV = src.getAttribute('uv'), C = src.getAttribute('color');
    const SI = src.getAttribute('skinIndex'), SW = src.getAttribute('skinWeight');
    g.setAttribute('position', P.clone()); g.setAttribute('normal', N.clone());
    main.set(lp.main ?? '#ffffff'); accent.set(lp.accent ?? lp.main ?? '#ffffff');
    const col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) {
      if (C) c.setRGB(C.getX(i), C.getY(i), C.getZ(i)); else c.setRGB(1, 1, 1);
      const code = UV ? Math.round(UV.getX(i)) : 1;
      if (code === 1) c.multiply(main); else if (code === 2) c.multiply(accent);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    // remap joints by bone name onto the target skeleton's order
    const names: string[] = src.userData.boneNames, map = names.map(n => Math.max(0, boneOrder.indexOf(n)));
    const si = new Uint16Array(P.count * 4), sw = new Float32Array(P.count * 4);
    for (let i = 0; i < P.count; i++) for (let k = 0; k < 4; k++) {
      const w = SW.getComponent(i, k); si[i * 4 + k] = w > 0 ? map[SI.getComponent(i, k)] : 0; sw[i * 4 + k] = w;
    }
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
    if (src.index) g.setIndex(src.index.clone());
    out.push(g);
  }
  if (!out.length) throw Error('[body-kit] none of the look\'s parts are in the kit');
  const merged = mergeGeometries(out, false)!; out.forEach(g => g.dispose());
  return merged;
}

// ---------------------------------------------------------------- looks
const SKIN = ['#8a5a44', '#c99576', '#5e3b2e', '#e0b08c', '#f1c9a5', '#a8714f'];
const HAIR = ['#2b2220', '#5a3a28', '#8a5a32', '#c9a26a', '#d8d2c8', '#3a2a4a', '#7a3424'];
const CLOTH = ['#2d4f7a', '#c8733f', '#6b4f8a', '#e6d7b8', '#3f6d6a', '#9b4a52', '#5d7a3a', '#d9b45a', '#41607a'];
const STRAW = ['#dcb978', '#e8cf95', '#c9a466'];

const face = (skin: string, hair: string): LookPart[] => [
  { part: 'head.round', main: skin }, { part: 'face.eyes' }, { part: 'face.glints' }, { part: 'face.brows', accent: hair },
  { part: 'face.nose-ears', main: skin }, { part: 'face.smile' }, { part: 'neck.skin', main: skin }, { part: 'hands.bare', main: skin },
];

/** an inhabitant, varied by seed: hats, hair, coats or skirts or trousers, colours */
export function townsfolkLook(seed: number): Look {
  const r = mulberry32(seed * 7919 + 11), pick = <V,>(a: V[]) => a[Math.floor(r() * a.length)];
  const skin = pick(SKIN), hair = pick(HAIR), top = pick(CLOTH), low = pick(CLOTH), trim = pick(CLOTH);
  const parts = face(skin, hair);
  const hat = r(); const hatKind = hat < .55 ? 'cone' : hat < .7 ? 'beret' : hat < .8 ? 'wide' : 'none';
  parts.push({ part: hatKind === 'none' ? pick(['hair.bun', 'hair.long', 'hair.short']) : pick(['hair.short', 'hair.bun', 'hair.bob']), main: hair });
  if (hatKind !== 'none') parts.push({ part: 'hat.' + hatKind, main: hatKind === 'cone' || hatKind === 'wide' ? pick(STRAW) : pick(CLOTH), accent: trim });
  const vest = r() < .4;
  parts.push({ part: vest ? 'top.vest' : 'top.tunic', main: vest ? '#efe4cf' : top, accent: top });
  parts.push({ part: 'arms.sleeve', main: vest ? '#efe4cf' : top, accent: trim });
  if (r() < .5) parts.push({ part: 'shawl.wrap', main: trim });
  const lower = r();
  if (lower < .5) parts.push({ part: 'lower.coat', main: low });
  else if (lower < .75) parts.push({ part: 'lower.skirt', main: low, accent: trim }, { part: 'legs.stockings', main: pick(['#3a3550', '#e6d7b8', '#5a4632']) });
  else parts.push({ part: 'legs.trousers', main: pick(['#3a3550', '#5a4632', '#2d4f7a', '#6b6255']) });
  if (lower >= .5 && r() < .35) parts.push({ part: 'lower.apron', main: '#efe4cf' });
  parts.push({ part: 'shoes.boot', main: pick(['#3a2a22', '#22324a', '#5a3a28']) });
  return { parts, height: .92 + r() * .14 };
}

/** Mira: Zip's friend, the courier's courier. A wide sun hat with a teal ribbon,
 *  an orange vest over a cream shirt, a teal skirt and a satchel full of map pages. */
export const MIRA_LOOK: Look = {
  height: .9,
  parts: [
    ...face('#d9a07a', '#2f3552'),
    { part: 'hair.bob', main: '#2f3552' },
    { part: 'hat.wide', main: '#ead08f', accent: '#2fa79a' },
    { part: 'top.vest', main: '#f4e8d2', accent: '#d9733a' },
    { part: 'arms.sleeve', main: '#f4e8d2', accent: '#2fa79a' },
    { part: 'arms.puff', main: '#f4e8d2' },
    { part: 'lower.skirt', main: '#2e6f6a', accent: '#ead08f' },
    { part: 'legs.stockings', main: '#3a3550' },
    { part: 'shoes.boot', main: '#6a4630' },
    { part: 'bag.satchel', main: '#8c5a34', accent: '#e2b45c' },
    { part: 'bag.strap', main: '#6e4428' },
  ],
};
