import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Zip, rigged. A reusable pattern for every generated character:
//   1. a small humanoid skeleton with canonical bone names (retarget-friendly),
//   2. hard-surface parts rigidly skinned to one bone each (robots need no
//      weight painting), merged per material into a few SkinnedMeshes,
//   3. an animation set: procedural fallback clips (idle / walk / jog / wave /
//      cheer) that library clips (e.g. Quaternius UAL, CC0) can replace by name,
//   4. procedural secondary motion (ears, scarf, blink, look-at) layered on top.
// Front is -Z, up is +Y, feet on y = 0, arms down in the rest pose.

export type BoneName =
  | 'Hips' | 'Spine' | 'Chest' | 'Neck' | 'Head' | 'EarL' | 'EarR'
  | 'UpperArmL' | 'LowerArmL' | 'HandL' | 'UpperArmR' | 'LowerArmR' | 'HandR'
  | 'UpperLegL' | 'LowerLegL' | 'FootL' | 'UpperLegR' | 'LowerLegR' | 'FootR'
  | 'Scarf1' | 'Scarf2' | 'Scarf3';

// Rest positions in model space. Zip faces -Z, so its left side is -X.
const JOINTS: Record<BoneName, [number, number, number, BoneName | null]> = {
  Hips: [0, .74, 0, null], Spine: [0, .88, 0, 'Hips'], Chest: [0, 1.04, 0, 'Spine'],
  Neck: [0, 1.24, 0, 'Chest'], Head: [0, 1.36, 0, 'Neck'],
  EarL: [-.18, 1.70, .02, 'Head'], EarR: [.18, 1.70, .02, 'Head'],
  UpperArmL: [-.235, 1.16, 0, 'Chest'], LowerArmL: [-.29, .90, .015, 'UpperArmL'], HandL: [-.28, .70, -.005, 'LowerArmL'],
  UpperArmR: [.235, 1.16, 0, 'Chest'], LowerArmR: [.29, .90, .015, 'UpperArmR'], HandR: [.28, .70, -.005, 'LowerArmR'],
  UpperLegL: [-.10, .68, 0, 'Hips'], LowerLegL: [-.12, .40, .005, 'UpperLegL'], FootL: [-.14, .11, 0, 'LowerLegL'],
  UpperLegR: [.10, .68, 0, 'Hips'], LowerLegR: [.12, .40, .005, 'UpperLegR'], FootR: [.14, .11, 0, 'LowerLegR'],
  Scarf1: [-.14, 1.24, .12, 'Chest'], Scarf2: [-.24, 1.08, .24, 'Scarf1'], Scarf3: [-.33, .86, .30, 'Scarf2'],
};
const ORDER = Object.keys(JOINTS) as BoneName[];

export interface ZipRig {
  root: T.Group;
  skeleton: T.Skeleton;
  bones: Record<BoneName, T.Bone>;
  mixer: T.AnimationMixer;
  actions: Record<string, T.AnimationAction>;
  update(dt: number, speed: number, reduced: boolean): void;
  wave(): void;
  cheer(): void;
  lookAt(world: T.Vector3 | null): void;
  useClips(clips: T.AnimationClip[]): void;
}

export function buildZipRig(): ZipRig {
  const root = new T.Group(); root.name = 'Zip';
  // ---------------------------------------------------------------- skeleton
  const bones = {} as Record<BoneName, T.Bone>;
  for (const n of ORDER) { const b = new T.Bone(); b.name = n; bones[n] = b; }
  for (const n of ORDER) {
    const [x, y, z, parent] = JOINTS[n];
    const b = bones[n];
    if (parent) { const [px, py, pz] = JOINTS[parent]; b.position.set(x - px, y - py, z - pz); bones[parent].add(b); }
    else { b.position.set(x, y, z); root.add(b); }
  }
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton(ORDER.map(n => bones[n]));
  const index = (n: BoneName) => ORDER.indexOf(n);

  // ---------------------------------------------------------------- materials (Zip's palette)
  const ivory = new T.MeshStandardMaterial({ color: '#eee6ce', roughness: .38, metalness: .12 });
  const mineral = new T.MeshStandardMaterial({ color: '#8daead', roughness: .48, metalness: .25 });
  const dark = new T.MeshStandardMaterial({ color: '#192f46', roughness: .42, metalness: .45 });
  const gold = new T.MeshStandardMaterial({ color: '#c29660', roughness: .37, metalness: .65 });
  const glass = new T.MeshStandardMaterial({ color: '#0f3a4a', roughness: .2, metalness: .3 });
  const light = new T.MeshStandardMaterial({ color: '#b5ece2', emissive: '#68d4ca', emissiveIntensity: .8, roughness: .3 });
  const cloth = new T.MeshStandardMaterial({ color: '#df742e', roughness: .95, side: T.DoubleSide });
  const buckets = new Map<T.Material, T.BufferGeometry[]>();
  const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);

  // Rigid skinning: every vertex of a part follows exactly one bone. Optional
  // `blend` spreads a strip (the scarf) across a bone chain by a coordinate.
  function part(g: T.BufferGeometry, m: T.Material, bone: BoneName, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
    g.applyMatrix4(new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), v(1, 1, 1)));
    const flat = g.index ? g.toNonIndexed() : g; if (flat !== g) g.dispose();
    for (const name of Object.keys(flat.attributes)) if (!['position', 'normal', 'uv'].includes(name)) flat.deleteAttribute(name);
    if (!flat.getAttribute('uv')) flat.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(flat.getAttribute('position').count * 2), 2));
    const count = flat.getAttribute('position').count;
    const si = new Uint16Array(count * 4), sw = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) { si[i * 4] = index(bone); sw[i * 4] = 1; }
    flat.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4));
    flat.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
    flat.clearGroups();
    const list = buckets.get(m) ?? []; list.push(flat); buckets.set(m, list);
    return flat;
  }
  const box = (w: number, h: number, d: number, r: number, m: T.Material, bone: BoneName, x: number, y: number, z: number, rz = 0) =>
    part(new RoundedBoxGeometry(w, h, d, 2, r), m, bone, x, y, z, 0, 0, rz);
  function plate(pts: [number, number][], depth: number, bevel: number, m: T.Material, bone: BoneName, x: number, y: number, z: number, rz = 0) {
    const g = new T.ExtrudeGeometry(new T.Shape(pts.map(([a, b]) => new T.Vector2(a, b))), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3 });
    g.translate(0, 0, -depth / 2); return part(g, m, bone, x, y, z, 0, 0, rz);
  }
  function rod(a: T.Vector3, b: T.Vector3, r: number, m: T.Material, bone: BoneName) {
    const d = b.clone().sub(a), mid = a.clone().lerp(b, .5);
    const g = new T.CylinderGeometry(r, r * .88, d.length(), 12);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(v(0, 1, 0), d.normalize()));
    return part(g, m, bone, mid.x, mid.y, mid.z);
  }
  function axle(bone: BoneName, x: number, y: number, z: number, r: number) {
    part(new T.CylinderGeometry(r, r, .115, 16), dark, bone, x, y, z, 0, 0, Math.PI / 2);
    part(new T.CylinderGeometry(r * .68, r * .68, .122, 16), gold, bone, x, y, z, 0, 0, Math.PI / 2);
  }

  // ---------------------------------------------------------------- body (Zip's established design)
  box(.29, .15, .235, .035, dark, 'Hips', 0, .72, 0);
  rod(v(0, .77, 0), v(0, .95, 0), .095, gold, 'Spine');
  plate([[-.16, -.18], [.13, -.18], [.205, .08], [.13, .22], [-.16, .20], [-.21, .06]], .255, .04, ivory, 'Chest', 0, 1.06, 0);
  box(.21, .25, .065, .025, dark, 'Chest', 0, 1.055, .162);
  box(.11, .18, .032, .015, mineral, 'Chest', 0, 1.065, .205);
  for (const y of [1.025, 1.08, 1.135]) box(.075, .012, .014, .004, gold, 'Chest', 0, y, .226);
  box(.09, .09, .025, .022, dark, 'Chest', -.085, 1.13, -.166);
  box(.045, .045, .012, .014, light, 'Chest', -.085, 1.13, -.182);
  rod(v(0, 1.22, 0), v(0, 1.34, 0), .066, dark, 'Neck');
  // head
  box(.49, .42, .375, .10, ivory, 'Head', 0, 1.52, 0);
  box(.425, .31, .038, .07, dark, 'Head', 0, 1.51, -.185);
  box(.382, .265, .024, .065, glass, 'Head', 0, 1.517, -.210);
  box(.32, .17, .035, .035, mineral, 'Head', 0, 1.52, .188);
  box(.19, .022, .012, .006, dark, 'Head', 0, 1.48, .209);
  const eyes: T.BufferGeometry[] = [];
  for (const side of [-1, 1] as const) {
    const S = side > 0 ? 'R' : 'L';
    const ear = `Ear${S}` as BoneName;
    plate([[-.035, -.07], [.045, -.04], [.065, .25], [-.035, .21]], .085, .012, ivory, ear, side * .18, 1.73, .025, -side * .28);
    plate([[-.015, 0], [.022, 0], [.026, .15], [-.012, .13]], .012, .004, mineral, ear, side * .18, 1.76, -.033, -side * .28);
    part(new T.CylinderGeometry(.088, .088, .042, 24), dark, 'Head', side * .252, 1.51, 0, 0, 0, Math.PI / 2);
    part(new T.CylinderGeometry(.061, .061, .046, 24), light, 'Head', side * .259, 1.51, 0, 0, 0, Math.PI / 2);
    part(new T.TorusGeometry(.070, .010, 6, 24), gold, 'Head', side * .279, 1.51, 0, 0, Math.PI / 2);
    eyes.push(box(.023, .065, .012, .011, light, 'Head', side * .085, 1.53, -.227, -side * .12));
    // arm
    const UA = `UpperArm${S}` as BoneName, LA = `LowerArm${S}` as BoneName, H = `Hand${S}` as BoneName;
    axle('Chest', side * .229, 1.17, 0, .065);
    rod(v(side * .255, 1.13, 0), v(side * .292, .93, .015), .039, dark, UA);
    box(.095, .15, .14, .035, mineral, UA, side * .258, 1.08, 0, side * .16);
    axle(LA, side * .29, .9, .015, .05);
    box(.095, .19, .12, .035, ivory, LA, side * .285, .795, -.007, -side * .09);
    box(.09, .105, .105, .025, dark, H, side * .275, .655, -.017);
    // leg
    const UL = `UpperLeg${S}` as BoneName, LL = `LowerLeg${S}` as BoneName, F = `Foot${S}` as BoneName;
    rod(v(side * .097, .67, 0), v(side * .12, .405, .01), .044, dark, UL);
    box(.105, .20, .12, .028, mineral, UL, side * .11, .56, .01, -side * .06);
    axle(LL, side * .12, .395, .005, .055);
    box(.103, .22, .115, .027, ivory, LL, side * .132, .245, .01, -side * .04);
    rod(v(side * .135, .2, 0), v(side * .14, .085, 0), .035, dark, LL);
    box(.146, .10, .26, .025, dark, F, side * .14, .065, -.057);
    box(.14, .028, .25, .01, gold, F, side * .14, .024, -.06);
    box(.12, .032, .115, .013, ivory, F, side * .14, .118, -.098);
  }
  // collar + ribbon scarf (spread across the scarf chain so it can flutter)
  part(new T.TorusGeometry(.12, .041, 8, 24), cloth, 'Neck', 0, 1.285, 0, Math.PI / 2);
  box(.115, .09, .12, .028, cloth, 'Scarf1', -.13, 1.27, .09, -.22);
  {
    const centers = [v(-.13, 1.29, .11), v(-.20, 1.18, .22), v(-.27, 1.01, .28), v(-.32, .82, .30), v(-.43, .66, .29), v(-.47, .62, .265)];
    const widths = [.075, .09, .085, .078, .063, .01];
    const chain: BoneName[] = ['Scarf1', 'Scarf1', 'Scarf2', 'Scarf2', 'Scarf3', 'Scarf3'];
    const pos: number[] = [], uvs: number[] = [], idx: number[] = [], si: number[] = [], sw: number[] = [];
    centers.forEach((p, i) => {
      for (const [j, t] of [-1, 0, 1].entries()) {
        pos.push(p.x + t * widths[i], p.y - t * .015, p.z + (t === 0 ? .02 : 0)); uvs.push(j / 2, i / (centers.length - 1));
        si.push(index(chain[i]), 0, 0, 0); sw.push(1, 0, 0, 0);
      }
      if (i < centers.length - 1) for (let j = 0; j < 2; j++) { const a = i * 3 + j; idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4); }
    });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const flat = g.toNonIndexed(); g.dispose();
    flat.setAttribute('skinIndex', new T.Uint16BufferAttribute(new Uint16Array(flat.getAttribute('position').count * 4), 4));
    flat.setAttribute('skinWeight', new T.Float32BufferAttribute(new Float32Array(flat.getAttribute('position').count * 4), 4));
    // re-derive per-vertex chain bone from height after de-indexing
    const P = flat.getAttribute('position'), SI = flat.getAttribute('skinIndex'), SW = flat.getAttribute('skinWeight');
    for (let i = 0; i < P.count; i++) { const y = P.getY(i); const b = y > 1.1 ? 'Scarf1' : y > .9 ? 'Scarf2' : 'Scarf3'; SI.setX(i, index(b)); SW.setX(i, 1); }
    const list = buckets.get(cloth) ?? []; list.push(flat); buckets.set(cloth, list);
  }

  // ---------------------------------------------------------------- merge into skinned meshes
  const eyeMeshes: T.SkinnedMesh[] = [];
  for (const [material, parts] of buckets) {
    const geometry = mergeGeometries(parts, false); if (!geometry) throw new Error('Zip part attributes do not match');
    const mesh = new T.SkinnedMesh(geometry, material);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    root.add(mesh); mesh.bind(skeleton, new T.Matrix4());
    if (material === light) eyeMeshes.push(mesh);
    for (const g of parts) g.dispose();
  }
  // blink: collapse the two eye slits vertically (they share the light material
  // with the ear discs, so we scale a dedicated eye bone-free trick: a tiny morph)
  const eyeMesh = eyeMeshes[0];
  if (eyeMesh) {
    const P = eyeMesh.geometry.getAttribute('position') as T.BufferAttribute;
    const closed = new Float32Array(P.array as Float32Array);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      if (z < -.2 && Math.abs(Math.abs(x) - .085) < .03 && Math.abs(y - 1.53) < .05) closed[i * 3 + 1] = 1.515 + (y - 1.53) * .12;
    }
    eyeMesh.geometry.morphAttributes.position = [new T.Float32BufferAttribute(closed, 3)];
    eyeMesh.geometry.morphTargetsRelative = false;
    eyeMesh.updateMorphTargets(); eyeMesh.morphTargetInfluences = [0];
  }

  // ---------------------------------------------------------------- procedural clips
  const mixer = new T.AnimationMixer(root);
  const clips = proceduralClips(bones);
  const actions: Record<string, T.AnimationAction> = {};
  const install = (list: T.AnimationClip[]) => {
    for (const c of list) {
      const a = mixer.clipAction(c); actions[c.name] = a;
      if (['Wave', 'Cheer'].includes(c.name)) { a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = false; }
      else { a.play(); a.setEffectiveWeight(c.name === 'Idle' ? 1 : 0); }
    }
  };
  install(clips);

  // ---------------------------------------------------------------- runtime state
  let t = 0, blinkAt = 2 + Math.random() * 3, blink = 0, gesture: T.AnimationAction | null = null;
  let lookTarget: T.Vector3 | null = null; const headLook = new T.Euler();
  const earVel = [0, 0], earAng = [0, 0], scarfLag = new T.Vector3(); let lastYaw = 0, smoothSpeed = 0;
  const q = new T.Quaternion(), e = new T.Euler(), tmp = new T.Vector3();

  function update(dt: number, speed: number, reduced: boolean) {
    t += dt;
    smoothSpeed += (speed - smoothSpeed) * Math.min(1, dt * 8);
    // locomotion blend: idle -> walk (<=1.6 m/s) -> jog (3.15 m/s)
    const s = reduced ? 0 : smoothSpeed;
    const wWalk = T.MathUtils.clamp(s / 1.6, 0, 1) * (1 - T.MathUtils.clamp((s - 1.6) / 1.4, 0, 1));
    const wJog = T.MathUtils.clamp((s - 1.6) / 1.4, 0, 1);
    const wIdle = 1 - Math.max(wWalk, wJog);
    actions.Idle?.setEffectiveWeight(wIdle);
    actions.Walk?.setEffectiveWeight(wWalk);
    actions.Jog?.setEffectiveWeight(wJog);
    // keep feet from sliding: playback rate follows speed
    if (actions.Walk) actions.Walk.timeScale = Math.max(.6, s / 1.2);
    if (actions.Jog) actions.Jog.timeScale = Math.max(.7, s / 2.9);
    if (gesture && !gesture.isRunning()) gesture = null;
    if (gesture) { actions.Idle?.setEffectiveWeight(wIdle * .3); }
    mixer.update(reduced ? 0 : dt);

    // secondary motion after the clips: head look-at (yaw/pitch limited)
    if (lookTarget && !reduced) {
      root.updateMatrixWorld(true);
      bones.Neck.getWorldPosition(tmp);
      const local = root.worldToLocal(lookTarget.clone()).sub(root.worldToLocal(tmp.clone()));
      const yaw = T.MathUtils.clamp(Math.atan2(-local.x, -local.z), -1.0, 1.0);
      const pitch = T.MathUtils.clamp(Math.atan2(local.y, Math.hypot(local.x, local.z)), -.35, .45);
      headLook.x += (pitch * .8 - headLook.x) * Math.min(1, dt * 5);
      headLook.y += (yaw - headLook.y) * Math.min(1, dt * 5);
    } else { headLook.x *= 1 - Math.min(1, dt * 3); headLook.y *= 1 - Math.min(1, dt * 3); }
    // gaze stabilisation: keep the visor near level even when a clip leans the torso
    root.updateMatrixWorld(true);
    const hf = new T.Vector3(0, 0, -1).applyQuaternion(bones.Head.getWorldQuaternion(q));
    const pitchFix = -Math.asin(T.MathUtils.clamp(hf.y, -1, 1)) * .65;
    q.setFromEuler(e.set(headLook.x + pitchFix, headLook.y * .7, 0)); bones.Head.quaternion.multiply(q);
    q.setFromEuler(e.set(0, headLook.y * .3, 0)); bones.Neck.quaternion.multiply(q);

    // ears: damped springs driven by turning and speed, with an occasional twitch
    const yawNow = root.rotation.y, turn = T.MathUtils.clamp((yawNow - lastYaw) / Math.max(dt, 1e-3), -6, 6); lastYaw = yawNow;
    for (let i = 0; i < 2; i++) {
      const target = -s * .025 + (i ? -1 : 1) * turn * .035 + (Math.sin(t * 1.3 + i) > .985 ? .25 : 0);
      earVel[i] += ((target - earAng[i]) * 90 - earVel[i] * 9) * dt; earAng[i] += earVel[i] * dt;
    }
    if (!reduced) {
      bones.EarR.quaternion.multiply(q.setFromEuler(e.set(earAng[0], 0, -earAng[0] * .3)));
      bones.EarL.quaternion.multiply(q.setFromEuler(e.set(earAng[1], 0, earAng[1] * .3)));
      // scarf trails behind with speed and flutters
      scarfLag.x += ((s * .09) - scarfLag.x) * Math.min(1, dt * 4);
      const flutter = Math.sin(t * (4 + s * 2)) * (.05 + s * .03);
      bones.Scarf1.quaternion.multiply(q.setFromEuler(e.set(scarfLag.x * .5 + flutter * .3, 0, turn * .02)));
      bones.Scarf2.quaternion.multiply(q.setFromEuler(e.set(scarfLag.x * .7 + flutter, 0, 0)));
      bones.Scarf3.quaternion.multiply(q.setFromEuler(e.set(scarfLag.x * .8 + flutter * 1.4, 0, 0)));
    }
    // blink
    if (t > blinkAt) { blink = 1; blinkAt = t + 2.2 + Math.random() * 3.5; }
    blink = Math.max(0, blink - dt * 9);
    if (eyeMesh?.morphTargetInfluences) eyeMesh.morphTargetInfluences[0] = blink > 0 ? Math.sin(blink * Math.PI) : 0;
  }
  function play(name: string) {
    const a = actions[name]; if (!a) return;
    a.reset(); a.setEffectiveWeight(1); a.fadeIn(.2); a.play(); gesture = a;
  }
  return {
    root, skeleton, bones, mixer, actions, update,
    wave: () => play('Wave'), cheer: () => play('Cheer'),
    lookAt: (w) => { lookTarget = w ? w.clone() : null; },
    useClips(list) {
      // Library clips replace procedural ones with the same name.
      for (const c of list) { const old = actions[c.name]; if (old) { old.stop(); mixer.uncacheAction(old.getClip()); } }
      install(list);
    },
  };
}

// ---------------------------------------------------------------- procedural clips
// Rotations are local Euler offsets from the arms-down rest pose, sampled into
// quaternion tracks. Forward is -Z: +X rotation swings a hanging limb forward.
export function proceduralClips(bones: Record<string, T.Bone>): T.AnimationClip[] {
  const tracks = (dur: number, fps: number, pose: (p: number) => Partial<Record<BoneName, [number, number, number]>>, hipsY?: (p: number) => number) => {
    const n = Math.round(dur * fps) + 1, times = new Float32Array(n);
    const per = new Map<string, number[]>(); const hy: number[] = [];
    for (let i = 0; i < n; i++) {
      const tt = i / (n - 1); times[i] = tt * dur;
      const p = pose(tt);
      for (const [b, r] of Object.entries(p) as [BoneName, [number, number, number]][]) {
        const qq = new T.Quaternion().setFromEuler(new T.Euler(r[0], r[1], r[2]));
        const arr = per.get(b) ?? []; arr.push(qq.x, qq.y, qq.z, qq.w); per.set(b, arr);
      }
      if (hipsY) hy.push(bones.Hips.position.x, bones.Hips.position.y + hipsY(tt), bones.Hips.position.z);
    }
    const out: T.KeyframeTrack[] = [...per].map(([b, v]) => new T.QuaternionKeyframeTrack(`${b}.quaternion`, times, v));
    if (hipsY) out.push(new T.VectorKeyframeTrack('Hips.position', times, hy));
    return out;
  };
  const TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, max = Math.max;
  const armsDown = .06; // arms hang slightly out from the body
  const idle = new T.AnimationClip('Idle', 4, tracks(4, 30, p => {
    const b = sin(p * TAU), b2 = sin(p * TAU * 2);
    return {
      Spine: [b * .015, 0, 0], Chest: [b * .02, b2 * .01, 0], Neck: [-b * .015, 0, 0], Head: [0, sin(p * TAU + 1) * .05, b2 * .015],
      UpperArmR: [.03 + b * .02, 0, armsDown], UpperArmL: [.03 - b * .02, 0, -armsDown],
      LowerArmR: [-.12, 0, 0], LowerArmL: [-.12, 0, 0],
      Hips: [0, 0, sin(p * TAU) * .012],
    };
  }, p => sin(p * TAU * 2) * .006));
  const gait = (name: string, dur: number, amp: number, knee: number, lean: number, bob: number, arm: number, elbow: number) =>
    new T.AnimationClip(name, dur, tracks(dur, 60, p => {
      const a = p * TAU, L = sin(a), R = -L;
      const kneeL = -max(0, sin(a + 1.4)) * knee - .05, kneeR = -max(0, sin(a + Math.PI + 1.4)) * knee - .05;
      return {
        Hips: [0, sin(a) * .08, 0], Spine: [lean * .5, -sin(a) * .06, 0], Chest: [lean * .5, -sin(a) * .1, 0],
        Neck: [-lean * .6, sin(a) * .05, 0], Head: [-lean * .3, sin(a) * .06, 0],
        UpperLegR: [L * amp, 0, 0], UpperLegL: [R * amp, 0, 0],
        LowerLegR: [kneeL, 0, 0], LowerLegL: [kneeR, 0, 0],
        FootR: [-L * amp * .35 - kneeL * .35, 0, 0], FootL: [-R * amp * .35 - kneeR * .35, 0, 0],
        UpperArmR: [R * arm, 0, armsDown + .04], UpperArmL: [L * arm, 0, -armsDown - .04],
        LowerArmR: [elbow + max(0, R) * elbow * .6, 0, 0], LowerArmL: [elbow + max(0, L) * elbow * .6, 0, 0],
      };
    }, p => -Math.abs(cos(p * TAU)) * bob + bob * .5));
  const walk = gait('Walk', 1.0, .42, .75, .06, .03, .38, .25);
  const jog = gait('Jog', .72, .66, 1.25, .2, .06, .7, 1.05);
  const wave = new T.AnimationClip('Wave', 1.9, tracks(1.9, 30, p => {
    const up = p < .15 ? p / .15 : p > .85 ? (1 - p) / .15 : 1, e = up * up * (3 - 2 * up);
    const w = sin(p * TAU * 3) * .45 * e;
    return {
      UpperArmR: [.05 * e, 0, armsDown + e * 2.45], LowerArmR: [0, 0, w + e * .25], HandR: [0, 0, w * .4],
      Chest: [0, e * .08, -e * .04], Head: [0, e * .12, e * .1],
    };
  }));
  const cheer = new T.AnimationClip('Cheer', 1.4, tracks(1.4, 30, p => {
    const up = p < .2 ? p / .2 : p > .8 ? (1 - p) / .2 : 1, e = up * up * (3 - 2 * up), hop = sin(p * TAU * 2);
    return {
      UpperArmR: [0, 0, armsDown + e * 2.7], UpperArmL: [0, 0, -armsDown - e * 2.7],
      LowerArmR: [0, 0, e * .3], LowerArmL: [0, 0, -e * .3], Chest: [-e * .12, 0, 0], Head: [-e * .15, 0, 0],
      UpperLegR: [max(0, hop) * .2 * e, 0, 0], UpperLegL: [max(0, hop) * .2 * e, 0, 0],
      LowerLegR: [-max(0, hop) * .4 * e, 0, 0], LowerLegL: [-max(0, hop) * .4 * e, 0, 0],
    };
  }, p => Math.max(0, sin(p * Math.PI * 4)) * .07 * (p > .15 && p < .85 ? 1 : 0)));
  return [idle, walk, jog, wave, cheer];
}

// Library clips baked for Zip's skeleton by tools/bake-ual.js (Quaternius UAL, CC0).
export async function loadBakedClips(url: string): Promise<T.AnimationClip[]> {
  const res = await fetch(url); if (!res.ok) throw Error(`clips unavailable (${res.status})`);
  const data = await res.json() as { clips: { name: string, duration: number, fps: number, tracks: Record<string, number[]>, hips: number[] }[] };
  return data.clips.map(c => {
    const n = c.hips.length / 3, times = new Float32Array(n);
    for (let i = 0; i < n; i++) times[i] = Math.min(c.duration, i / c.fps);
    const tracks: T.KeyframeTrack[] = Object.entries(c.tracks).map(([bone, q]) => new T.QuaternionKeyframeTrack(`${bone}.quaternion`, times, q));
    tracks.push(new T.VectorKeyframeTrack('Hips.position', times, c.hips));
    return new T.AnimationClip(c.name, c.duration, tracks);
  });
}
