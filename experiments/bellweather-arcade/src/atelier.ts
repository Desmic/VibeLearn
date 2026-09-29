import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { graphicMineral } from './graphic-material';

export async function loadAtelier(parent:T.Object3D,cameraSolids:T.Object3D[]){
  const finish=new URLSearchParams(location.search).get('finish');
  const conditioned=finish==='occlusion'||finish==='daylight';
  const ceramic=new URLSearchParams(location.search).get('palette')==='ceramic';
  const sunlit=new URLSearchParams(location.search).get('look')==='sunlit';
  const districts=sunlit&&new URLSearchParams(location.search).get('districts')==='terraces';
  const response=await fetch('/atelier/atelier.json');
  if(!response.ok)throw Error(`Architecture dimensions unavailable (${response.status})`);
  const manifest=await response.json();
  if(!Array.isArray(manifest.colliders)||manifest.colliders.length!==2)throw Error('Architecture bounds unavailable');
  for(const b of manifest.colliders)if(![b.minX,b.maxX,b.minZ,b.maxZ].every(Number.isFinite)||b.minX>=b.maxX||b.minZ>=b.maxZ)throw Error('Architecture bounds invalid');
  if(manifest.cameraProxy?.file!=='sunward-atelier-camera.glb')throw Error('Architecture camera proxy unavailable');
  const loader=new GLTFLoader();
  const [model,proxy]=await Promise.all([
    loader.loadAsync(conditioned?'/atelier/sunward-atelier-occlusion-v4.glb':'/atelier/sunward-atelier.glb'),
    loader.loadAsync('/atelier/sunward-atelier-camera.glb')
  ]);
  model.scene.traverse(o=>{
    if(!(o instanceof T.Mesh))return;
    o.castShadow=true;o.receiveShadow=true;
    for(const m of Array.isArray(o.material)?o.material:[o.material]){
      if(!(m instanceof T.MeshStandardMaterial))continue;
      // Optional material-role study: keep the source asset/UVs and geometry
      // intact. Luminous mineral masses, selective blue shade, warm interiors.
      if(ceramic){
        const roles:[string,string,number,number][]=[
          ['Porcelain','#f5e8cd',.48,.02],['Indigo','#9aaeca',.72,.02],
          ['Glazing','#83b8bd',.29,.12],['Coral','#dfa67f',.72,0],
          ['Interior Clay','#cfaa81',.86,0],['Interior Mint','#8baf98',.82,0],
          ['Brass','#c7a36a',.4,.62]
        ];
        for(const [role,color,roughness,metalness] of roles)if(m.name.startsWith(`Atelier ${role}`)){
          m.color.set(color);m.roughness=roughness;m.metalness=metalness;
        }
      }
      if(sunlit){
        if(m.name.startsWith('Atelier Indigo')){m.color.set('#637eaa');m.roughness=.67;}
        if(m.name.startsWith('Atelier Porcelain')){m.color.set('#eee2c9');m.roughness=.38;}
        if(m.name.startsWith('Atelier Coral'))m.color.set('#d99072');
        if(m.name.startsWith('Atelier Glazing'))m.color.set('#5c949c');
        if(m.name.startsWith('Atelier Brass')){m.color.set('#b99860');m.roughness=.32;}
      }
      if(m.name.startsWith('Atelier Clear Glass')){
        // Geometry behind the panes provides actual parallax. Alpha glazing is
        // a deliberate low-cost approximation, not refractive transmission.
        m.transparent=true;m.opacity=.18;m.depthWrite=false;m.roughness=.10;
        m.metalness=.08;m.envMapIntensity=1.2;o.castShadow=false;
      }else{
        if(conditioned)m.aoMapIntensity=sunlit?.6:ceramic?.45:.7;
        if(!m.name.includes('Glazing')&&!m.name.includes('Brass')&&!m.name.includes('Botanical'))graphicMineral(m,districts?(m.name.includes('Porcelain')?.035:.11):conditioned?0:.10);
      }
    }
  });
  // Explicit raycasts include invisible objects. Keep small per-part bounds for
  // the camera while the material-grouped render meshes retain their appearance.
  proxy.scene.visible=false;
  proxy.scene.traverse(o=>{if(o instanceof T.Mesh)cameraSolids.push(o)});
  parent.add(model.scene,proxy.scene);
  model.scene.updateMatrixWorld(true);proxy.scene.updateMatrixWorld(true);
  return manifest.colliders as {minX:number,maxX:number,minZ:number,maxZ:number}[];
}
