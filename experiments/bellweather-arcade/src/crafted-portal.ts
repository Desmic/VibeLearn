import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { graphicMineral, loadMineralPigment } from './graphic-material';

export async function loadCraftedPortal(parent:T.Object3D,cameraSolids:T.Object3D[]){
  const pigment=await loadMineralPigment();
  const ceramic=new URLSearchParams(location.search).get('palette')==='ceramic';
  const sunlit=new URLSearchParams(location.search).get('look')==='sunlit';
  const form=new URLSearchParams(location.search).get('form');
  const swept=form==='swept'||form==='swept-clean';
  const suffix=form==='swept-clean'?'-swept-clean':swept?'-swept':'';
  const response=await fetch(`/crafted-portal/portal${suffix}.json`);
  if(!response.ok)throw Error(`Portal dimensions unavailable (${response.status})`);
  const manifest=await response.json();
  if(!Array.isArray(manifest.colliders)||manifest.colliders.length!==2)throw Error('Portal jamb dimensions invalid');
  const gltf=await new GLTFLoader().loadAsync(`/crafted-portal/sunward-portal${suffix}.glb`);
  const root=gltf.scene;root.position.set(manifest.placement.x,manifest.placement.y,manifest.placement.z);
  root.traverse(o=>{
    if(!(o instanceof T.Mesh))return;
    o.castShadow=true;o.receiveShadow=true;cameraSolids.push(o);
    for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial){
      if(ceramic){
        if(m.name.startsWith('Structural')){m.color.set('#536f99');m.metalness=.06;m.roughness=.62;}
        if(m.name.startsWith('Porcelain')){m.color.set(m.name.includes('edge')?'#fff0d5':'#eddbb5');m.roughness=.43;}
        if(m.name.startsWith('Coral'))m.color.set('#df947b');
      }
      if(sunlit){
        if(m.name.startsWith('Structural'))m.color.set('#425f84');
        if(m.name.startsWith('Porcelain'))m.color.set(m.name.includes('edge')?'#fff0d8':'#eadbc3');
        if(m.name.startsWith('Coral'))m.color.set('#d8896c');
      }
      m.aoMapIntensity=.8;graphicMineral(m,ceramic?.035:m.name.startsWith('Porcelain')?.16:.10,m.name.startsWith('Porcelain')||m.name.startsWith('Coral')?pigment:undefined);
    }
  });
  parent.add(root);root.updateMatrixWorld(true);
  return manifest.colliders.map((b:{minX:number,maxX:number,minZ:number,maxZ:number})=>({
    minX:b.minX+root.position.x,maxX:b.maxX+root.position.x,
    minZ:b.minZ+root.position.z,maxZ:b.maxZ+root.position.z
  }));
}
