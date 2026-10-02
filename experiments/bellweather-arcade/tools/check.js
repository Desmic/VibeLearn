import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildZipRig, loadBakedClips } from '../src/zip-rig.js';
export async function check(){
  const gltf=await new GLTFLoader().loadAsync('./UAL1_Standard.glb');const src=gltf.scene;const sb={};src.traverse(o=>{if(o.isBone)sb[o.name]=o});
  const clips=await loadBakedClips('/characters/zip-ual-clips.json');
  const zip=buildZipRig();const idle=clips.find(c=>c.name==='Idle');
  const m=new T.AnimationMixer(zip.root);m.clipAction(idle).play();m.setTime(0);zip.root.updateMatrixWorld(true);
  const sm=new T.AnimationMixer(src);sm.clipAction(gltf.animations.find(a=>a.name==='Idle_Loop')).play();sm.setTime(0);src.updateMatrixWorld(true);
  const R=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI);
  const wp=o=>o.getWorldPosition(new T.Vector3());
  const pairs=[['Hips','Spine','pelvis','spine_01'],['Spine','Chest','spine_01','spine_03'],['Chest','Neck','spine_03','neck_01'],['Neck','Head','neck_01','Head'],['UpperArmL','LowerArmL','upperarm_l','lowerarm_l'],['UpperLegL','LowerLegL','thigh_l','calf_l']];
  const out={};
  for(const [a,b,sa,sbn] of pairs){const td=wp(zip.bones[b]).sub(wp(zip.bones[a])).normalize();const sd=wp(sb[sbn]).sub(wp(sb[sa])).applyQuaternion(R).normalize();out[a]={t:td.toArray().map(v=>+v.toFixed(2)),s:sd.toArray().map(v=>+v.toFixed(2)),deg:+(td.angleTo(sd)*57.3).toFixed(1)}}
  const hq=zip.bones.Head.getWorldQuaternion(new T.Quaternion());out.headFwd=new T.Vector3(0,0,-1).applyQuaternion(hq).toArray().map(v=>+v.toFixed(2));
  return out;
}
