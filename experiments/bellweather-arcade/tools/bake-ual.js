// Offline retarget: Quaternius Universal Animation Library (CC0) -> Zip's rig.
// Runs in a browser page (see bake-ual.html); writes compact JSON clips so the
// game never downloads the 7.6 MB library. Method: world-space rotation deltas
// from each skeleton's reference pose, after aligning Zip's rest limb directions
// to the library's reference (bind) pose, so rest-pose differences cancel out.
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildZipRig } from '../src/zip-rig.js';

const MAP = { // Zip bone -> library bone
  Hips: 'pelvis', Spine: 'spine_01', Chest: 'spine_03', Neck: 'neck_01', Head: 'Head',
  UpperArmL: 'upperarm_l', LowerArmL: 'lowerarm_l', HandL: 'hand_l',
  UpperArmR: 'upperarm_r', LowerArmR: 'lowerarm_r', HandR: 'hand_r',
  UpperLegL: 'thigh_l', LowerLegL: 'calf_l', FootL: 'foot_l',
  UpperLegR: 'thigh_r', LowerLegR: 'calf_r', FootR: 'foot_r',
};
// child used to measure each bone's direction (library / Zip)
const DIR = {
  Hips: ['spine_01', 'Spine'], Spine: ['spine_03', 'Chest'], Chest: ['neck_01', 'Neck'], Neck: ['Head', 'Head'],
  UpperArmL: ['lowerarm_l', 'LowerArmL'], LowerArmL: ['hand_l', 'HandL'], HandL: ['middle_01_l', null],
  UpperArmR: ['lowerarm_r', 'LowerArmR'], LowerArmR: ['hand_r', 'HandR'], HandR: ['middle_01_r', null],
  UpperLegL: ['calf_l', 'LowerLegL'], LowerLegL: ['foot_l', 'FootL'], FootL: ['ball_l', null],
  UpperLegR: ['calf_r', 'LowerLegR'], LowerLegR: ['foot_r', 'FootR'], FootR: ['ball_r', null],
};
const WANT = {
  Idle_Loop: 'Idle', Walk_Loop: 'Walk', Jog_Fwd_Loop: 'Jog', Sprint_Loop: 'Sprint',
  Jump_Start: 'JumpStart', Jump_Loop: 'JumpLoop', Jump_Land: 'JumpLand', Interact: 'Interact',
  Idle_Talking_Loop: 'Talk', Dance_Loop: 'Dance', Walk_Formal_Loop: 'Stroll',
  Sitting_Idle_Loop: 'SitIdle', Sitting_Talking_Loop: 'SitTalk', PickUp_Table: 'PickUp', Roll: 'Roll',
};

export async function bake() {
  const gltf = await new GLTFLoader().loadAsync('./UAL1_Standard.glb');
  const src = gltf.scene; src.updateMatrixWorld(true);
  const sb = {}; src.traverse(o => { if (o.isBone) sb[o.name] = o; });
  const skinned = []; src.traverse(o => { if (o.isSkinnedMesh) skinned.push(o); });
  skinned[0].skeleton.pose(); src.updateMatrixWorld(true);
  const wp = (o) => o.getWorldPosition(new T.Vector3()), wq = (o) => o.getWorldQuaternion(new T.Quaternion());

  // facing fix: library toes -> Zip's forward (-Z); also report up
  const fwd = wp(sb.ball_l).sub(wp(sb.foot_l)).add(wp(sb.ball_r).sub(wp(sb.foot_r))); fwd.y = 0; fwd.normalize();
  const Rfix = new T.Quaternion().setFromUnitVectors(fwd, new T.Vector3(0, 0, -1));
  const up = wp(sb.Head).sub(wp(sb.pelvis)).normalize();

  const zip = buildZipRig(); zip.root.updateMatrixWorld(true); const zb = zip.bones;
  const order = Object.keys(MAP); // hierarchy order already (parents first)
  const srcRef = {}, tgtRef = {}; let lastAlign = new T.Quaternion();
  for (const b of order) {
    const s = sb[MAP[b]];
    srcRef[b] = Rfix.clone().multiply(wq(s));
    // Torso, neck and head are upright in both reference poses: transfer their
    // rotations directly. Only limbs need rest-direction alignment (arms-down vs T).
    if (!DIR[b] || ['Hips', 'Spine', 'Chest', 'Neck', 'Head'].includes(b)) { tgtRef[b] = wq(zb[b]); continue; }
    const [sc, tc] = DIR[b];
    const sdir = wp(sb[sc]).sub(wp(s)).applyQuaternion(Rfix).normalize();
    let tdir;
    if (tc) tdir = wp(zb[tc]).sub(wp(zb[b])).normalize();
    else tdir = b.startsWith('Foot') ? new T.Vector3(0, -.35, -1).normalize() : new T.Vector3(0, -1, -.05).normalize();
    const align = new T.Quaternion().setFromUnitVectors(tdir, sdir); if (b === 'Neck') lastAlign = align.clone();
    tgtRef[b] = align.multiply(wq(zb[b]));
  }
  const pelvisRef = wp(sb.pelvis).applyQuaternion(Rfix);
  const scale = zb.Hips.getWorldPosition(new T.Vector3()).y / Math.max(pelvisRef.y, 1e-3);

  const mixer = new T.AnimationMixer(src);
  const out = [];
  for (const clip of gltf.animations) {
    const name = WANT[clip.name]; if (!name) continue;
    const act = mixer.clipAction(clip); act.play();
    const fps = 30, n = Math.max(2, Math.round(clip.duration * fps) + 1);
    const tracks = {}; for (const b of order) tracks[b] = [];
    const hips = [];
    for (let i = 0; i < n; i++) {
      mixer.setTime(Math.min(clip.duration, i / fps)); src.updateMatrixWorld(true);
      const solvedWorld = {};
      for (const b of order) {
        const qs = Rfix.clone().multiply(wq(sb[MAP[b]]));
        const delta = qs.multiply(srcRef[b].clone().invert());
        const qt = delta.multiply(tgtRef[b]);
        solvedWorld[b] = qt.clone();
        const parent = zb[b].parent;
        const parentWorld = parent && parent.isBone && solvedWorld[parent.name] ? solvedWorld[parent.name] : new T.Quaternion();
        const local = parentWorld.clone().invert().multiply(qt);
        tracks[b].push(+local.x.toFixed(4), +local.y.toFixed(4), +local.z.toFixed(4), +local.w.toFixed(4));
      }
      const p = wp(sb.pelvis).applyQuaternion(Rfix).sub(pelvisRef).multiplyScalar(scale);
      const rest = zb.Hips.position;
      hips.push(+(rest.x + p.x).toFixed(4), +(rest.y + p.y).toFixed(4), +(rest.z + p.z).toFixed(4));
    }
    act.stop(); mixer.uncacheAction(clip);
    out.push({ name, source: clip.name, duration: +clip.duration.toFixed(4), fps, tracks, hips });
  }
  return { meta: { library: 'Quaternius Universal Animation Library (Standard), CC0 1.0', baked: new Date().toISOString(), up: up.toArray().map(v => +v.toFixed(3)), fwd: fwd.toArray().map(v => +v.toFixed(3)), scale: +scale.toFixed(4) }, clips: out };
}
