import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tree } from './world';
import { mineralSurface, sandstoneDetail, plantedGround } from './surfaces';
import { mulberry32 } from './vendor/rng';
import { graphicMineral } from './graphic-material';
import { loadCraftedPortal } from './crafted-portal';
import { loadAtelier } from './atelier';
import { buildVista } from './vista';
import { buildOrbitalSky } from './sky-art';

// One designed entrance and court. The dimensions below are also the collision
// authority: a visual change cannot silently leave an unrelated walking corridor.
export const cameraSolids:T.Object3D[]=[];
export const route=new T.CatmullRomCurve3([
  new T.Vector3(1,0,7),new T.Vector3(.9,0,2),new T.Vector3(1.15,0,-3),
  new T.Vector3(1.2,0,-7),new T.Vector3(.3,0,-10.5)
]);
export const arrival=route.getPoint(0);
const blockers:{minX:number,maxX:number,minZ:number,maxZ:number}[]=[];
const circles:{x:number,z:number,r:number}[]=[];
export function nearestRoute(p:T.Vector3){let best=0,dist=Infinity;for(let i=0;i<=120;i++){const t=i/120,q=route.getPoint(t),d=(p.x-q.x)**2+(p.z-q.z)**2;if(d<dist){dist=d;best=t}}return {t:best,d:Math.sqrt(dist)}}
export function walkable(p:T.Vector3){
  const r=.34;
  if(p.x<-9+r||p.x>9-r||p.z<-12+r||p.z>10-r)return false;
  for(const b of blockers)if(p.x>b.minX-r&&p.x<b.maxX+r&&p.z>b.minZ-r&&p.z<b.maxZ+r)return false;
  return circles.every(c=>Math.hypot(p.x-c.x,p.z-c.z)>c.r+r);
}

function roundShape(w:number,h:number,r:number){
  const s=new T.Shape();s.moveTo(-w/2+r,0);s.lineTo(w/2-r,0);s.quadraticCurveTo(w/2,0,w/2,r);
  s.lineTo(w/2,h-r);s.quadraticCurveTo(w/2,h,w/2-r,h);s.lineTo(-w/2+r,h);
  s.quadraticCurveTo(-w/2,h,-w/2,h-r);s.lineTo(-w/2,r);s.quadraticCurveTo(-w/2,0,-w/2+r,0);return s;
}

export async function buildWorld(scene:T.Scene){
  const atelier=new URLSearchParams(location.search).get('architecture')==='atelier';
  const daylight=new URLSearchParams(location.search).get('finish')==='daylight';
  const ceramic=new URLSearchParams(location.search).get('palette')==='ceramic';
  const sunlit=daylight&&new URLSearchParams(location.search).get('look')==='sunlit';
  const city=sunlit&&new URLSearchParams(location.search).get('setting')==='city';
  const districts=city&&new URLSearchParams(location.search).get('districts')==='terraces';
  blockers.length=0;circles.length=0;cameraSolids.length=0;
  const root=new T.Group();scene.add(root);const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
  const cream=new T.MeshStandardMaterial({color:'#eedcc0',roughness:.79,map:mineralSurface(84)});
  const porcelain=new T.MeshStandardMaterial({color:'#f7ead4',roughness:.4,metalness:.08});
  const navy=new T.MeshStandardMaterial({color:'#203448',roughness:.72});
  const blue=new T.MeshStandardMaterial({color:'#376078',roughness:.75});
  const coral=new T.MeshStandardMaterial({color:'#c86c53',roughness:.8});
  const brass=new T.MeshStandardMaterial({color:'#ac8954',roughness:.38,metalness:.65});
  const glass=new T.MeshPhysicalMaterial({color:'#164e59',roughness:.2,metalness:.32,clearcoat:.85});
  const green=new T.MeshStandardMaterial({color:'#466d58',roughness:.96,map:plantedGround()});
  const floor=new T.MeshStandardMaterial({color:'#cbbfa4',roughness:.83,map:mineralSurface(129),...sandstoneDetail()});
  for(const m of [cream,porcelain,coral,blue,navy])graphicMineral(m,m===cream?.22:.12);
  graphicMineral(floor,ceramic?.045:.16);
  floor.normalScale.setScalar(ceramic?.055:.10);
  const glow=new T.MeshBasicMaterial({color:'#e6e5b4'});
  function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,camera=false){
    const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);if(camera)cameraSolids.push(o);return o;
  }
  function box(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,solid=false,r=0){
    const o=mesh(r?new RoundedBoxGeometry(w,h,d,2,r):new T.BoxGeometry(w,h,d),m,x,y,z,solid);
    if(solid&&y-h/2<1.9&&y+h/2>.2)blockers.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});return o;
  }
  function tube(points:T.Vector3[],radius:number,m:T.Material){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(12,points.length*3),radius,7),m,0,0,0)}
  function inset(x:number,y:number,z:number,w:number,h:number,m:T.Material){
    return mesh(new T.ExtrudeGeometry(roundShape(w,h,.28),{depth:.12,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:10}),m,x,y,z);
  }

  // Finite paved court. Large slabs and fine seams support scale without
  // turning the whole ground into a high-frequency texture.
  box(0,-.35,-1,18,.94,22,navy);
  box(0,.095,-1,18,.05,22,floor);
  const random=mulberry32(472);
  const tileColors=sunlit?['#c5c3b4','#cbc7b7','#c8c4b3','#c1c2b7','#cec9b8']:ceramic?['#ded1b9','#e2d6c0','#ddd0b7','#dbd0bd','#e1d3bb']:['#c7b49c','#dbcaaf','#dfcfb4','#c1b7a8','#d1bca0'];
  const tileMats=Array.from({length:5},(_,i)=>{const m=floor.clone();m.color.set(tileColors[i]);return graphicMineral(m,ceramic?.045:.16)});
  for(let row=0;row<13;row++)for(let col=0;col<11;col++){
    const x=-8.1+col*1.62,z=9.06-row*1.67;
    box(x,.124,z,1.606,.012,1.656,tileMats[Math.floor(random()*5)]);
  }
  for(const x of [-8.86,8.86])box(x,.54,-1,.28,.85,22,cream,true,.06);
  box(0,.54,-11.86,18,.85,.28,cream,true,.06);
  box(0,.29,9.85,18,.32,.30,cream,true,.05);

  // A substantial asymmetric building, not separate ornamental pillars.
  // The left volume contains two deep, glazed bays and an upper gallery.
  if(atelier){blockers.push(...await loadAtelier(root,cameraSolids));}
  else {
  box(-5.65,4.15,-3.95,7.2,8.1,4.3,cream,true,.48);
  box(-5.65,.35,-1.74,7.1,.46,.4,navy,true,.08);
  for(const x of [-7.45,-4.55]){
    inset(x,1.15,-1.765,2.42,4.12,navy);
    inset(x,1.35,-1.61,1.94,3.58,glass);
    box(x,1.08,-1.44,2.5,.18,.66,porcelain,true,.055);
    for(const dx of [-.63,.63])box(x+dx,3.1,-1.36,.035,3.46,.09,brass);
    box(x,3.05,-1.33,1.99,.035,.09,brass);
    box(x,5.44,-1.30,2.64,.18,1.15,cream,false,.06);
    // A broad shadow reveal makes the overhang legible from ordinary play view.
    box(x,5.27,-1.46,2.48,.10,.82,navy);
  }
  // Quiet vertical joints, an upper shadow slot and inset coloured panels give
  // the tall wall deliberate proportion without assembling a noisy prop pile.
  for(const x of [-8.55,-6.0,-2.80])box(x,6.48,-1.79,.022,2.65,.018,blue);
  box(-5.6,7.41,-1.58,6.8,.16,.48,navy);
  box(-5.6,7.75,-1.21,7.5,.35,1.3,porcelain,false,.14);
  box(-5.6,8.58,-3.7,6.4,1.24,3.7,navy,false,.28);
  for(const x of [-7.4,-5.6,-3.8]){
    inset(x,8.2,-1.78,1.55,.77,glass);
    box(x,9.2,-1.43,1.69,.12,.7,brass,false,.04);
  }

  // An off-centre rounded rectangular portal has deep jambs and a continuous
  }
  // lintel. Open aperture and walking clearance are derived from the same widths.
  const crafted=new URLSearchParams(location.search).get('portal')==='crafted';
  if(crafted){blockers.push(...await loadCraftedPortal(root,cameraSolids));}
  else {
  const portalX=1.10,frontZ=-3.6,openingWidth=4.65,openingHeight=5.75;
  const outer=roundShape(6.8,7.18,1.6),hole=roundShape(openingWidth,openingHeight,1.3);
  outer.holes.push(new T.Path(hole.getPoints(28)));
  const portal=mesh(new T.ExtrudeGeometry(outer,{depth:1.6,bevelEnabled:true,bevelSize:.1,bevelThickness:.08,bevelSegments:3,curveSegments:24}),cream,portalX,.12,frontZ-1.6,true);
  // These jambs stop a shoulder before it penetrates the visual ceramic frame.
  for(const side of [-1,1])blockers.push({minX:portalX+side*2.325+(side<0?-1.075:0),maxX:portalX+side*2.325+(side<0?0:1.075),minZ:frontZ-1.68,maxZ:frontZ+.08});
  // Recessed dark lining and thin warm rim preserve depth inside the aperture.
  const lining=roundShape(4.92,5.98,1.40);lining.holes.push(new T.Path(roundShape(4.65,5.75,1.3).getPoints(28)));
  mesh(new T.ExtrudeGeometry(lining,{depth:.12,bevelEnabled:false,curveSegments:24}),navy,portalX,.12,frontZ+.04);
  const arch:T.Vector3[]=[v(portalX-2.52,.2,frontZ+.19),v(portalX-2.52,4.43,frontZ+.19)];
  for(let i=0;i<=18;i++){const a=Math.PI-i/18*Math.PI;arch.push(v(portalX+Math.cos(a)*2.52,4.43+Math.sin(a)*1.6,frontZ+.19))}
  arch.push(v(portalX+2.52,.2,frontZ+.19));tube(arch,.024,brass);
  box(portalX,6.92,-4.17,7.28,.30,2.45,porcelain,false,.12);
  }

  // Right cheek, canopy and ceramic sun-screen anchor the portal to a room.
  if(!atelier){
  box(6.22,3.65,-4.5,3.25,7.05,3.25,coral,true,.55);
  inset(6.22,1.22,-2.84,2.22,4.6,navy);
  inset(6.22,1.40,-2.69,1.83,4.10,glass);
  box(6.22,.54,-2.55,3.25,.4,.9,cream,true,.09);
  for(let i=0;i<7;i++){
    const x=4.88+i*.45;box(x,4.28,-2.26,.09,4.5,.56,porcelain,false,.035);
  }
  box(6.22,6.73,-2.34,3.6,.23,1.3,cream,false,.10);
  }
  // A slender suspended roof shades the passage; open sides retain sightlines.
  box(1.08,6.1,-6.80,4.55,.20,3.5,blue,false,.10);
  for(let i=0;i<8;i++)box(-.98+i*.59,6.27,-6.8,.14,.09,3.65,brass);
  for(const x of [-1.03,3.20])box(x,3.13,-8.14,.16,6.0,.16,navy,true,.045);
  box(1.1,5.94,-8.05,4.55,.035,.11,glow);

  // Broad curved canopy over the left entrance. Both fascia and underside are
  // actual surfaces, so grazing light and the shadow have a shared geometry.
  if(!atelier){
  const canopyShape=new T.Shape();canopyShape.moveTo(-9,-2.3);canopyShape.lineTo(-1.9,-2.3);canopyShape.lineTo(-1.9,.12);canopyShape.bezierCurveTo(-3.3,1.2,-7.4,.95,-9,.22);canopyShape.closePath();
  const canopyG=new T.ExtrudeGeometry(canopyShape,{depth:.24,bevelEnabled:true,bevelSize:.07,bevelThickness:.045,bevelSegments:2,curveSegments:18});canopyG.rotateX(Math.PI/2);
  mesh(canopyG,cream,0,6.04,0,true);
  const lip=[v(-8.95,5.86,-.18),v(-7.6,5.86,-.70),v(-5.4,5.86,-.82),v(-3.2,5.86,-.65),v(-1.95,5.86,-.12)];tube(lip,.062,brass);
  for(const x of [-8.5,-2.35]){
    const support=mesh(new T.CylinderGeometry(.11,.18,5.7,12),navy,x,2.97,-.10,true);circles.push({x,z:-.10,r:.18});
    box(x,.28,-.10,.51,.30,.51,porcelain,true,.09);
  }

  // Deliberately placed vegetation: one hero blossom crown and one quieter
  }
  // green companion. Beds supply physical roots and a legible walking edge.
  function bed(x:number,z:number,radius:number,pink:boolean,scale:number){
    mesh(new T.CylinderGeometry(radius,radius,.51,44),cream,x,.37,z,true);
    mesh(new T.CylinderGeometry(radius-.13,radius-.13,.04,44),green,x,.64,z);
    const rim=mesh(new T.TorusGeometry(radius-.06,.08,7,48),porcelain,x,.66,z);rim.rotation.x=Math.PI/2;
    circles.push({x,z,r:radius});const plants=new T.Group();plants.position.y=.62;root.add(plants);tree(plants,x,z,scale,pink,false,sunlit);
  }
  bed(6.13,3.55,1.65,true,1.27);
  bed(-5.8,-9.2,1.65,false,1.0);
  bed(6.17,-9.1,1.45,false,.86);

  // A planted bench makes the near corner architectural, with seating anchored
  // to the same low retaining volume. There is no detached explanatory panel.
  box(-6.45,.65,4.82,4.9,1.04,1.3,cream,true,.16);
  box(-6.45,1.17,4.82,4.55,.09,1.02,green);
  box(-6.45,.69,5.67,4.85,.16,.68,porcelain,true,.055);
  box(-6.45,.39,5.40,4.5,.54,.22,navy,true);
  const leafMat=new T.MeshStandardMaterial({color:'#2a766b',roughness:.86,side:T.DoubleSide});
  const goldLeaf=new T.MeshStandardMaterial({color:'#a6a558',roughness:.93,side:T.DoubleSide});
  if(atelier){
    // Curved broad leaves, with a raised central fold and a drooping tip. Their
    // geometry supplies highlight/shadow variation instead of flat spear cards.
    for(let plant=0;plant<6;plant++)for(let i=0;i<7;i++){
      const angle=i*2.399+plant*.8,x=-8.17+plant*.67,z=4.77+(plant%2)*.12;
      const h=.60+random()*.39,reach=.33+random()*.24,width=.15+random()*.09;
      const p:number[]=[],indices:number[]=[],steps=10;
      for(let k=0;k<=steps;k++){
        const t=k/steps,r=reach*t,y=1.23+h*(1.65*t-.89*t*t);
        const w=width*Math.pow(Math.sin(Math.PI*t),.68)+.002;
        for(const s of [-1,0,1])p.push(x+Math.cos(angle)*r-Math.sin(angle)*w*s,y+(s===0?.065*Math.sin(Math.PI*t):0),z+Math.sin(angle)*r+Math.cos(angle)*w*s);
      }
      for(let k=0;k<steps;k++)for(let s=0;s<2;s++){const a=k*3+s;indices.push(a,a+3,a+1,a+1,a+3,a+4)}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();
      mesh(g,i%4?leafMat:goldLeaf,0,0,0);
    }
  }else for(let plant=0;plant<8;plant++)for(let i=0;i<6;i++){
    const angle=i*2.4+plant,x=-8.25+plant*.52,z=4.7+(plant%2)*.25,h=.6+random()*.7;
    const a=v(x,1.23,z),b=v(x+Math.cos(angle)*.31,1.23+h*.68,z+Math.sin(angle)*.31),tip=v(x+Math.cos(angle)*.64,1.23+h,z+Math.sin(angle)*.64),side=v(-Math.sin(angle)*.10,0,Math.cos(angle)*.10);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...a.toArray(),...b.clone().add(side).toArray(),...tip.toArray(),...b.clone().sub(side).toArray()],3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();mesh(g,i%3?leafMat:goldLeaf,0,0,0);
  }

  // World typography is part of the entrance, modest and readable close up.
  const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const c=cv.getContext('2d')!;
  c.fillStyle='#233e53';c.fillRect(0,0,1024,256);c.fillStyle='#e6d4af';c.textAlign='center';c.font='500 48px sans-serif';c.fillText('SUNWARD',512,112);c.font='22px sans-serif';c.fillText('C O N S E R V A T O R Y',512,162);
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
  mesh(new T.PlaneGeometry(2.5,.625),new T.MeshStandardMaterial({map:tex,roughness:.8}),-5.6,atelier?5.65:6.58,atelier?-1.91:-1.77);
  // A ceramic orbital emblem gives the wall a graphic identity without a filter.
  const emblem=mesh(new T.TorusGeometry(.42,.037,8,48),brass,-2.69,3.35,-1.57);emblem.rotation.z=.4;emblem.scale.x=.65;
  mesh(new T.SphereGeometry(.11,14,8),porcelain,-2.69,3.35,-1.50);

  if(city&&atelier){
    function relief(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,camera=false,r=0){
      const visual=mesh(r?new RoundedBoxGeometry(w,h,d,1,r):new T.BoxGeometry(w,h,d),m,x,y,z);
      if(camera){
        // Conservative six-face proxy keeps decorative bevels out of raycasts
        // and lets the visible members join the existing material batches.
        const proxy=new T.Mesh(new T.BoxGeometry(w,h,d));proxy.position.copy(visual.position);
        proxy.visible=false;root.add(proxy);cameraSolids.push(proxy);
      }
    }
    // Rear elevation: real projecting frames and sun-screens above player
    // height. Existing low contact geometry stays authoritative; added upper
    // relief participates in the camera query like the original architecture.
    for(const x of [-7.9,-5.65,-3.4]){
      relief(x,3.63,-6.12,1.86,2.60,.18,navy,false,.08);
      relief(x,3.66,-6.23,1.58,2.30,.055,glass,false,.04);
      for(const dx of [-.94,.94])relief(x+dx,3.65,-6.24,.14,2.78,.32,porcelain,true,.025);
      relief(x,2.29,-6.27,2.04,.15,.48,porcelain,true,.03);
      relief(x,5.08,-6.31,2.10,.18,.65,cream,true,.045);
      for(const dx of [-.48,0,.48])relief(x+dx,3.68,-6.285,.035,2.28,.045,brass);
    }
    // The smaller coral wing has a shaded fluted panel rather than a blank
    // single-color wall. Thin members earn their place by casting real shadows.
    relief(6.22,3.60,-6.13,2.50,2.60,.17,navy,false,.09);
    relief(6.22,3.65,-6.24,2.23,2.30,.06,glass,false,.07);
    for(let i=0;i<6;i++)relief(5.22+i*.4,3.66,-6.33,.09,2.55,.30,porcelain,true,.025);
    for(const y of [2.29,5.03])relief(6.22,y,-6.29,2.68,.18,.57,cream,true,.04);
  }

  if(daylight){
    // Reuse the existing scenery kit at reduced detail. This frames the local
    // entrance; it adds no walkable area, destination, collider or quest promise.
    const distant=new T.Group();root.add(distant);distant.position.set(-18,-2,-12);
    const pale=cream.clone();pale.color.set('#d6dace');
    const distantBlue=navy.clone();distantBlue.color.set('#466880');
    buildVista(distant,{stone:pale,ivory:porcelain,navy:distantBlue,trim:brass,grass:green},(parent,x,z,scale,pink)=>tree(parent,x,z,scale,pink,true,sunlit), {background:true,surround:city,districts});
    if(city){
      const orbital=new T.Group();root.add(orbital);buildOrbitalSky(orbital);
      if(districts){orbital.scale.setScalar(.78);orbital.position.set(62,15,-35);}
    }
  }
  const sky=new T.Mesh(new T.SphereGeometry(daylight?580:130,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){float t=smoothstep(-.08,.6,normalize(p).y);gl_FragColor=vec4(mix(vec3(.68,.81,.83),vec3(.10,.39,.63),t),1.);\n#include <colorspace_fragment>\n}'}));root.add(sky);
  // Merge only non-colliding compatible opaque geometry. Preserve material,
  // shadow flags and instance attributes; do not batch distant scenes together.
  root.updateMatrixWorld(true);const solids=new Set(cameraSolids),groups=new Map<string,{m:T.Material,items:T.Mesh[]}>(),ids=new Map<T.Material,number>();
  root.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||solids.has(o)||Array.isArray(o.material)||!(o.material instanceof T.MeshStandardMaterial)||o.material.transparent)return;
    const m=o.material;if(!ids.has(m))ids.set(m,ids.size);const attrs=Object.entries(o.geometry.attributes as Record<string,T.BufferAttribute>).map(([n,a])=>`${n}:${a.itemSize}`).sort().join('|');const key=`${ids.get(m)}:${!!o.geometry.index}:${attrs}:${o.castShadow}:${o.receiveShadow}`;let g=groups.get(key);if(!g){g={m,items:[]};groups.set(key,g)}g.items.push(o);
  });
  for(const {m,items} of groups.values())if(items.length>1){const copies=items.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));const g=mergeGeometries(copies);copies.forEach(g=>g.dispose());if(!g)throw Error('Facade batch mismatch');const o=new T.Mesh(g,m);o.castShadow=items[0].castShadow;o.receiveShadow=items[0].receiveShadow;items.forEach(o=>o.removeFromParent());root.add(o)}
  return root;
}

