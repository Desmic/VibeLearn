import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from './vendor/rng';
import { proceduralClips } from './zip-rig';
import { assembleLook, townsfolkLook, type BodyKit, type Look } from './kit/body-kit';

// Townsfolk on the same humanoid skeleton (bone names) as Zip, so one library
// of baked clips animates every inhabitant. Long coats are skinned to the hips
// with the hem following the legs, so walking reads under the robe.

type Bn = 'Hips' | 'Spine' | 'Chest' | 'Neck' | 'Head' | 'UpperArmL' | 'LowerArmL' | 'HandL' | 'UpperArmR' | 'LowerArmR' | 'HandR'
  | 'UpperLegL' | 'LowerLegL' | 'FootL' | 'UpperLegR' | 'LowerLegR' | 'FootR';
const J: Record<Bn, [number, number, number, Bn | null]> = {
  Hips: [0, .95, 0, null], Spine: [0, 1.08, 0, 'Hips'], Chest: [0, 1.25, 0, 'Spine'], Neck: [0, 1.45, 0, 'Chest'], Head: [0, 1.53, 0, 'Neck'],
  UpperArmL: [-.2, 1.42, 0, 'Chest'], LowerArmL: [-.25, 1.15, .01, 'UpperArmL'], HandL: [-.27, .9, 0, 'LowerArmL'],
  UpperArmR: [.2, 1.42, 0, 'Chest'], LowerArmR: [.25, 1.15, .01, 'UpperArmR'], HandR: [.27, .9, 0, 'LowerArmR'],
  UpperLegL: [-.1, .9, 0, 'Hips'], LowerLegL: [-.11, .5, .01, 'UpperLegL'], FootL: [-.12, .1, 0, 'LowerLegL'],
  UpperLegR: [.1, .9, 0, 'Hips'], LowerLegR: [.11, .5, .01, 'UpperLegR'], FootR: [.12, .1, 0, 'LowerLegR'],
};
const ORDER = Object.keys(J) as Bn[];
const ZIP_HIP = .74;

const skinTones = ['#8a5a44', '#c99576', '#5e3b2e', '#e0b08c'];
const coats = ['#2d4f7a', '#c8733f', '#6b4f8a', '#e6d7b8', '#3f6d6a', '#9b4a52'];
// One vertex-coloured material for every inhabitant: one draw call per person
// and a single shader program, instead of five materials each.
const cloth = new T.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .95 });
// Faces must read even with the sun behind someone (dialogue shots often face into
// the light): a soft self-light lifts the shadow side, like a fill light on a set.
cloth.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * .26;'); };
cloth.customProgramCacheKey = () => 'vl-people-fill';
const straw = new T.Color('#dcb978'), shoe = new T.Color('#22324a');

export interface Townsperson {
  root: T.Group; head: T.Bone; headTop: T.Object3D;
  update(dt: number, moving: number, reduced: boolean): void;
  setBase(name: 'Idle' | 'Talk' | 'Stroll'): void;
  wave(): void;
  lookAt(p: T.Vector3 | null): void;
}

// Hips translation in library clips is authored for Zip's hip height; rescale per body.
function adapt(clips: T.AnimationClip[], hip: number) {
  const k = hip / ZIP_HIP;
  return clips.map(c => {
    const cl = c.clone();
    for (const t of cl.tracks) if (t.name === 'Hips.position') {
      const v = t.values as Float32Array; for (let i = 0; i < v.length; i += 3) { v[i] *= k; v[i + 1] = hip + (v[i + 1] - ZIP_HIP) * k; v[i + 2] *= k; }
    }
    return cl;
  });
}

/** `kit`: build the body from the Blender body kit (a seeded look, or the one given);
 *  without it, the code-built body below is the fallback. */
export function buildTownsperson(seed: number, library: T.AnimationClip[], kit?: BodyKit | null, given?: Look): Townsperson {
  const r = mulberry32(seed), bodyLook = kit ? (given ?? townsfolkLook(seed)) : null, tall0 = .92 + r() * .14, tall = bodyLook?.height ?? tall0;
  const root = new T.Group(); root.name = 'Townsperson'; root.userData.fade = { halfW: .38, y0: 0, y1: 1.9, dither: true };
  const body = new T.Group(); body.scale.setScalar(tall); root.add(body);
  const bones = {} as Record<Bn, T.Bone>;
  for (const n of ORDER) { const b = new T.Bone(); b.name = n; bones[n] = b; }
  for (const n of ORDER) { const [x, y, z, p] = J[n]; if (p) { const [px, py, pz] = J[p]; bones[n].position.set(x - px, y - py, z - pz); bones[p].add(bones[n]); } else { bones[n].position.set(x, y, z); body.add(bones[n]); } }
  body.updateMatrixWorld(true);
  const skeleton = new T.Skeleton(ORDER.map(n => bones[n]));
  const idx = (n: Bn) => ORDER.indexOf(n);

  const parts: T.BufferGeometry[] = [];
  if (kit && bodyLook) parts.push(assembleLook(kit, bodyLook, ORDER));
  else {
  const coat = new T.Color(coats[Math.floor(r() * coats.length)]);
  const shawl = new T.Color(coats[Math.floor(r() * coats.length)]);
  const face = new T.Color(skinTones[Math.floor(r() * skinTones.length)]);
  const add = (g: T.BufferGeometry, m: T.Color, weigh: (p: T.Vector3) => [Bn, Bn?, number?]) => {
    const flat = g.index ? g.toNonIndexed() : g; if (flat !== g) g.dispose();
    for (const n of Object.keys(flat.attributes)) if (!['position', 'normal'].includes(n)) flat.deleteAttribute(n);
    const P = flat.getAttribute('position'), si = new Uint16Array(P.count * 4), sw = new Float32Array(P.count * 4), v = new T.Vector3();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const [a, b, w = 0] = weigh(v); si[i * 4] = idx(a); sw[i * 4] = 1 - w; if (b) { si[i * 4 + 1] = idx(b); sw[i * 4 + 1] = w; } }
    flat.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); flat.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
    const col = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) m.toArray(col, i * 3);
    flat.setAttribute('color', new T.Float32BufferAttribute(col, 3)); parts.push(flat);
  };
  const at = (g: T.BufferGeometry, x: number, y: number, z: number, rx = 0, rz = 0) => g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, 0, rz)), new T.Vector3(1, 1, 1)));
  // long coat: hem follows the legs
  add(at(new T.CylinderGeometry(.19, .34, 1.02, 14, 6, true), 0, .6, 0), coat, p => {
    if (p.y > .82) return ['Hips'];
    const w = T.MathUtils.clamp((.82 - p.y) / .75, 0, 1) * .75;
    return ['Hips', p.x < 0 ? 'UpperLegL' : 'UpperLegR', w];
  });
  add(at(new T.CylinderGeometry(.2, .27, .46, 14, 2), 0, 1.24, 0), shawl, p => [p.y > 1.2 ? 'Chest' : 'Spine']);
  add(at(new T.SphereGeometry(.12, 14, 10), 0, 1.62, -.01), face, () => ['Head']);
  const hatG = at(new T.ConeGeometry(.42, .15, 18, 1), 0, 1.75, 0); add(hatG, straw, () => ['Head']);
  for (const side of [-1, 1] as const) {
    const S = side < 0 ? 'L' : 'R';
    add(at(new T.CapsuleGeometry(.058, .2, 4, 8), side * .225, 1.29, 0, 0, side * .18), shawl, () => [`UpperArm${S}` as Bn]);
    add(at(new T.CapsuleGeometry(.05, .19, 4, 8), side * .262, 1.03, .005, 0, side * .08), shawl, () => [`LowerArm${S}` as Bn]);
    add(at(new T.SphereGeometry(.05, 10, 8), side * .272, .86, 0), face, () => [`Hand${S}` as Bn]);
    add(at(new T.BoxGeometry(.11, .07, .22), side * .12, .04, -.05), shoe, () => [`Foot${S}` as Bn]);
  }
  }
  {
    const g = parts.length === 1 ? parts[0] : mergeGeometries(parts, false)!; if (!(kit && bodyLook)) g.computeVertexNormals();
    const mesh = new T.SkinnedMesh(g, cloth); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    body.add(mesh); mesh.bind(skeleton, new T.Matrix4()); parts.forEach(p => { if (p !== g) p.dispose(); });
  }
  const headTop = new T.Object3D(); headTop.position.set(0, .45, 0); bones.Head.add(headTop);

  const mixer = new T.AnimationMixer(body);
  const clips = [...adapt(library.filter(c => ['Idle', 'Talk', 'Stroll', 'Interact'].includes(c.name)), J.Hips[1]), ...proceduralClips(bones).filter(c => c.name === 'Wave')];
  const actions: Record<string, T.AnimationAction> = {};
  for (const c of clips) { const a = mixer.clipAction(c); actions[c.name] = a; if (c.name === 'Wave') { a.setLoop(T.LoopOnce, 1); } else { a.play(); a.setEffectiveWeight(0); a.time = r() * c.duration; } }
  let base: 'Idle' | 'Talk' | 'Stroll' = 'Idle'; const weights: Record<string, number> = { Idle: 1, Talk: 0, Stroll: 0 };
  let looking = false; const look = new T.Vector3(), lp = new T.Vector3(), np = new T.Vector3(); const hl = new T.Euler(); const q = new T.Quaternion(), e = new T.Euler(), tmp = new T.Vector3();
  let waving: T.AnimationAction | null = null;
  return {
    root, head: bones.Head, headTop,
    setBase(n) { base = n; },
    wave() { const a = actions.Wave; if (!a) return; a.reset(); a.fadeIn(.2); a.play(); waving = a; },
    lookAt(p) { looking = !!p; if (p) look.copy(p); },
    update(dt, moving, reduced) {
      for (const k of ['Idle', 'Talk', 'Stroll']) {
        const target = (k === base ? 1 : 0) * (waving && waving.isRunning() ? .35 : 1);
        weights[k] += (target - weights[k]) * Math.min(1, dt * 5);
        actions[k]?.setEffectiveWeight(weights[k]);
      }
      if (actions.Stroll) actions.Stroll.timeScale = T.MathUtils.clamp(moving / .9, .4, 1.3);
      if (waving && !waving.isRunning()) waving = null;
      mixer.update(reduced ? 0 : dt);
      if (looking && !reduced) {
        root.updateMatrixWorld(true); bones.Neck.getWorldPosition(tmp);
        root.worldToLocal(lp.copy(look)); root.worldToLocal(np.copy(tmp));
        const d = lp.sub(np), yaw = T.MathUtils.clamp(Math.atan2(-d.x, -d.z), -1.1, 1.1), pitch = T.MathUtils.clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -.4, .3);
        hl.x += (pitch - hl.x) * Math.min(1, dt * 4); hl.y += (yaw - hl.y) * Math.min(1, dt * 4);
      } else { hl.x *= 1 - Math.min(1, dt * 2.5); hl.y *= 1 - Math.min(1, dt * 2.5); }
      bones.Head.quaternion.multiply(q.setFromEuler(e.set(hl.x, hl.y * .65, 0)));
      bones.Neck.quaternion.multiply(q.setFromEuler(e.set(0, hl.y * .35, 0)));
    },
  };
}
