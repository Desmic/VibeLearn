import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mineralSurface } from './surfaces';

// Authored civic architecture: layered curved terraces, sheltered ground-floor
// rooms, structural fins and integrated botanical wayfinding. Not a city generator.
export function buildCivic(parent:T.Group, solids:T.Object3D[]){
  const root=new T.Group();parent.add(root);
  const stone=new T.MeshStandardMaterial({color:'#e9d9ba',roughness:.87});
  const white=new T.MeshStandardMaterial({color:'#fff0ce',roughness:.77});
  stone.map=mineralSurface(21);white.map=mineralSurface(57);
  const blue=new T.MeshStandardMaterial({color:'#23465c',roughness:.88});
  const glass=new T.MeshPhysicalMaterial({color:'#183f54',roughness:.24,metalness:.24,clearcoat:.65});
  const copper=new T.MeshStandardMaterial({color:'#b59560',roughness:.46,metalness:.38});
  const leaf=new T.MeshStandardMaterial({color:'#346950',roughness:1,side:T.DoubleSide});
  const flower=new T.MeshStandardMaterial({color:'#d55f80',roughness:1});
  const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
  const frontage=(z:number)=>-5.65+1.22*Math.cos((z+2)*.17);
  function mesh(g:T.BufferGeometry,m:T.Material,p:T.Vector3,solid=false){
    const o=new T.Mesh(g,m);o.position.copy(p);o.castShadow=true;o.receiveShadow=true;root.add(o);if(solid)solids.push(o);return o;
  }
  function box(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,solid=false){return mesh(new T.BoxGeometry(w,h,d),m,v(x,y,z),solid)}
  function tube(points:T.Vector3[],r:number,m:T.Material){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(8,points.length*3),r,6),m,v(0,0,0))}
  function deck(y:number,z0:number,z1:number,overhang:number){
    const s=new T.Shape();s.moveTo(-14,z0);s.lineTo(frontage(z0)+overhang,z0);
    for(let z=z0+.5;z<=z1;z+=.5)s.lineTo(frontage(z)+overhang,z);
    s.lineTo(-14,z1);s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth:.38,bevelEnabled:true,bevelThickness:.08,bevelSize:.12,bevelSegments:2});g.rotateX(Math.PI/2);
    const o=mesh(g,white,v(0,y,0),true);
    const edge=Array.from({length:57},(_,i)=>{const z=z0+(z1-z0)*i/56;return v(frontage(z)+overhang,y-.03,-z)});
    tube(edge,.07,copper);tube(edge.map(p=>p.clone().add(v(-.05,-.31,0))),.09,blue);return o;
  }
  deck(4.75,-13,15,.6);deck(8.6,-10,14,.25);deck(11.9,-7,11,-.4);
  box(-13.7,5.7,0,.7,11.5,29,blue,true);
  // Tall swept supports have a load-bearing foot and a broad shoulder under the balcony.
  for(const z of [-10.7,-3.2,4.3,11.8]){
    const x=frontage(z)-.45;
    const shape=new T.Shape([new T.Vector2(0,0),new T.Vector2(.72,0),new T.Vector2(.67,2.1),new T.Vector2(.88,3.2),new T.Vector2(1.65,4.42),new T.Vector2(.42,4.42),new T.Vector2(-.10,2.8)]);
    mesh(new T.ExtrudeGeometry(shape,{depth:.68,bevelEnabled:true,bevelSize:.06,bevelThickness:.07,bevelSegments:2}),stone,v(x,.12,z-.34),true);
    box(x+.4,.27,z,1.2,.28,1.05,blue,true);
    box(-11.7,2.25,z-3.2,.1,3.65,5.1,glass);
    for(let j=0;j<4;j++)box(-11.61,2.25,z-5.3+j*1.35,.06,3.7,.05,copper);
    // Real interior depth: floor, seat and a wall luminaire behind the columns.
    box(-9.0,.07,z-3,5.8,.12,6.6,stone);
    box(-10.6,.63,z-3,1.1,.32,2.9,blue);
    box(-10.6,.86,z-3,1.2,.13,3,white);
    mesh(new T.SphereGeometry(.18,12,8),new T.MeshBasicMaterial({color:'#ffe6ac'}),v(-11.4,3.5,z-3));
  }
  for(const y of [4.8,8.65]){
    const z0=y<6?-12:-9,z1=y<6?13:11;
    for(let z=z0;z<=z1;z+=1.15){const x=frontage(-z)+.32;box(x,y+.5,z,.055,1,.055,copper)}
    tube(Array.from({length:40},(_,i)=>{const z=z0+(z1-z0)*i/39;return v(frontage(-z)+.32,y+1.02,z)}),.045,copper);
    for(let z=z0+2;z<z1-1;z+=5.8){
      const x=frontage(-z)-.1;box(x,y+.23,z,.6,.38,2.4,blue);
      for(let j=0;j<8;j++){
        const zz=z-1.05+j*.3;
        tube([v(x,y+.4,zz),v(x+.38,y+.34,zz+.12),v(x+.65,y-.35-(j%3)*.26,zz+.18)],.025,leaf);
        for(let k=0;k<3;k++){
          const l=mesh(new T.SphereGeometry(.12,5,3),leaf,v(x+.25+k*.17,y+.28-k*.22,zz));l.scale.set(.5,1.1,1.7);
          if((j+k)%3===0)mesh(new T.IcosahedronGeometry(.11,0),flower,v(x+.44+k*.1,y+.18-k*.2,zz+.13));
        }
      }
    }
  }
  // Rooftop light collectors: tapered, curved blades rather than box towers.
  for(const z of [-6,0,6]){
    const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(2,2.4,1.35,5.4,.6,7.7);s.bezierCurveTo(.25,4.4,-.1,2.6,-.65,0);s.closePath();
    mesh(new T.ExtrudeGeometry(s,{depth:.25,bevelEnabled:true,bevelSize:.05,bevelThickness:.05}),white,v(-9.2,11.8,z));
  }
  // Art and directions live on banners belonging to the building.
  const cv=document.createElement('canvas');cv.width=256;cv.height=768;const c=cv.getContext('2d')!;
  c.fillStyle='#23465c';c.fillRect(0,0,256,768);c.strokeStyle='#dec996';c.lineWidth=3;c.strokeRect(14,14,228,740);
  c.strokeStyle='#f3e9ce';c.lineWidth=7;c.beginPath();c.moveTo(128,330);c.bezierCurveTo(105,250,164,170,132,76);c.stroke();
  for(let i=0;i<6;i++){const y=110+i*31,side=i%2?-1:1;c.beginPath();c.moveTo(130,y+35);c.quadraticCurveTo(130+side*60,y+14,130+side*47,y-17);c.quadraticCurveTo(125,y,130,y+35);c.fillStyle='#f3e9ce';c.fill()}
  c.textAlign='center';c.fillStyle='#f6e9c9';c.font='18px sans-serif';for(const [i,s] of ['THE','LIGHTWELL','GARDENS'].entries())c.fillText(s,128,450+i*33);c.font='42px sans-serif';c.fillText('↑',128,636);
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
  const bannerMat=new T.MeshStandardMaterial({map:tex,roughness:1,side:T.DoubleSide});
  for(const z of [10.1,-3.7]){const x=frontage(z)+.82;const b=mesh(new T.PlaneGeometry(.85,2.55),bannerMat,v(x,3.7,z));b.rotation.y=Math.PI/2;tube([v(x-.2,5.05,z-.2),v(x+.15,5.05,z+.2)],.025,copper)}
  // Batch only meshes whose index and vertex layouts are compatible. The civic
  // kit mixes indexed tubes/boxes with nonindexed extrusions under one material.
  root.updateMatrixWorld(true);
  const set=new Set(solids);
  const groups=new Map<T.Material,Map<string,T.Mesh[]>>();
  root.traverse(o=>{
    if(!(o instanceof T.Mesh)||set.has(o)||Array.isArray(o.material))return;
    const attributes=Object.entries(o.geometry.attributes as Record<string,T.BufferAttribute>)
      .map(([name,attribute])=>`${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`)
      .sort().join(',');
    const signature=`${o.geometry.index!==null?'indexed':'plain'}|${attributes}|${o.castShadow}|${o.receiveShadow}`;
    let layouts=groups.get(o.material);
    if(!layouts){layouts=new Map();groups.set(o.material,layouts)}
    const items=layouts.get(signature)||[];items.push(o);layouts.set(signature,items);
  });
  for(const [material,layouts] of groups)for(const items of layouts.values()){
    if(items.length<2)continue;
    const geometries=items.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));
    const geometry=mergeGeometries(geometries,false);
    geometries.forEach(g=>g.dispose());
    if(!geometry)throw new Error('Incompatible civic geometry batch');
    const merged=new T.Mesh(geometry,material);
    merged.castShadow=items[0].castShadow;merged.receiveShadow=items[0].receiveShadow;
    for(const item of items)item.removeFromParent();
    root.add(merged);
  }
  return root;
}
