import fs from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Compare the camera's exact raycast with and without its conservative bounds
// prefilter on the actual exported atelier camera geometry. No browser needed.
const file=new URL('./public/atelier/sunward-atelier-camera.glb',import.meta.url);
const bytes=await fs.readFile(file);
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
gltf.scene.updateMatrixWorld(true);
const solids=[];gltf.scene.traverse(object=>{if(object instanceof T.Mesh)solids.push(object)});
if(solids.length!==89)throw Error(`Unexpected camera parts: ${solids.length}`);
const bounded=solids.map(object=>({object,bounds:new T.Box3().setFromObject(object)}));
const ray=new T.Raycaster(),boxHit=new T.Vector3();
const pivots=[
  [1,7], [1,2.8], [1,-1.5], [1,-4.5], [1,-7],
  [-1.4,2], [-1.4,-1.6], [4.4,-2], [6,-4]
];
const candidateCounts=[],rayCases=[];let rays=0,hits=0;
for(const [x,z] of pivots)for(const height of [1.5,2.15])for(let step=0;step<48;step++)for(const lateral of [-.48,0,.48]){
  const angle=step*Math.PI/24;
  const origin=new T.Vector3(x+lateral*Math.cos(angle),height,z-lateral*Math.sin(angle));
  const delta=new T.Vector3(Math.sin(angle)*6,1.0,Math.cos(angle)*6);
  const distance=delta.length();ray.set(origin,delta.normalize());ray.far=distance;
  rayCases.push({origin,direction:delta.clone(),distance});
  const full=ray.intersectObjects(solids,false).find(hit=>hit.distance>.15);
  const candidates=[];
  for(const {object,bounds} of bounded){
    const intersection=ray.ray.intersectBox(bounds,boxHit);
    if(bounds.containsPoint(origin)||(intersection&&boxHit.distanceToSquared(origin)<=distance*distance))candidates.push(object);
  }
  const filtered=ray.intersectObjects(candidates,false).find(hit=>hit.distance>.15);
  if(Boolean(full)!==Boolean(filtered)||full&&Math.abs(full.distance-filtered.distance)>1e-6){
    throw Error(`Ray mismatch at ${JSON.stringify({x,z,height,step,lateral,full:full?.distance,filtered:filtered?.distance})}`);
  }
  candidateCounts.push(candidates.length);rays++;if(full)hits++;
}
candidateCounts.sort((a,b)=>a-b);
function timedQueries(prefilter){
  const candidates=[];let checksum=0;
  for(const sample of rayCases){
    ray.set(sample.origin,sample.direction);ray.far=sample.distance;
    if(prefilter){
      candidates.length=0;
      for(const {object,bounds} of bounded){
        const intersection=ray.ray.intersectBox(bounds,boxHit);
        if(bounds.containsPoint(sample.origin)||(intersection&&boxHit.distanceToSquared(sample.origin)<=sample.distance*sample.distance))candidates.push(object);
      }
    }
    const hit=ray.intersectObjects(prefilter?candidates:solids,false).find(item=>item.distance>.15);
    checksum+=hit?.distance??0;
  }
  return checksum;
}
for(let i=0;i<2;i++){timedQueries(false);timedQueries(true)}
const timing={full:[],filtered:[]};
for(let round=0;round<6;round++)for(const mode of round%2?['filtered','full']:['full','filtered']){
  const start=performance.now(),checksum=timedQueries(mode==='filtered');
  timing[mode].push({ms:performance.now()-start,checksum});
}
const median=values=>{const sorted=values.map(v=>v.ms).sort((a,b)=>a-b),middle=sorted.length/2;return (sorted[middle-1]+sorted[middle])/2};
if(Math.abs(timing.full[0].checksum-timing.filtered[0].checksum)>1e-6)throw Error('Timed ray checksums differ');
console.log(JSON.stringify({passed:true,asset:String(file),solids:solids.length,rays,hits,
  candidates:{median:candidateCounts[Math.floor(rays/2)],p95:candidateCounts[Math.floor(rays*.95)],max:candidateCounts.at(-1)},
  nodeWallClock:{method:'2 warm-up pairs, then 6 alternating full/filtered repetitions over the same 2592 rays',
    fullMedianMs:median(timing.full),filteredMedianMs:median(timing.filtered),fullMs:timing.full.map(v=>v.ms),filteredMs:timing.filtered.map(v=>v.ms)}},null,2));
