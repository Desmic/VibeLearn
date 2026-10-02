import { clearSight } from './canopy';
import { quality } from './quality';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildVista } from './vista';
import { buildCivic } from './civic';
import { mineralSurface, sandstoneDetail, waterNormals, plantedGround } from './surfaces';
import { buildOrbitalSky } from './sky-art';
import { canopyGeometry, canopyMaterial } from './canopy';
import { buildPaving } from './paving';
import { mulberry32, range } from './vendor/rng';

export const pathPoints = [new T.Vector3(0,0,13),new T.Vector3(-.2,0,7),new T.Vector3(.7,0,1),new T.Vector3(2.4,0,-6),new T.Vector3(2.6,0,-13),new T.Vector3(4.3,0,-22),new T.Vector3(4.3,0,-26)];
export const route = new T.CatmullRomCurve3(pathPoints,false,'centripetal');
export const arrival = route.getPoint(0);
export const overlook = route.getPoint(.94);
const r = mulberry32(71236);
const col = (s:string)=>new T.Color(s);
export const cameraSolids:T.Object3D[]=[];

function pigment(hex:string, rough=.84, metal=0){return new T.MeshStandardMaterial({color:hex,roughness:rough,metalness:metal});}
const mat = {
  stone:pigment('#f4ddaf'), ivory:pigment('#ffebc8'), shadow:pigment('#617a94'), dark:pigment('#143957'), navy:pigment('#244b6e'), trim:pigment('#daaa69',.54,.36), trimDark:pigment('#805f53',.64,.15), floor:pigment('#e9c899'), floorAlt:pigment('#d9b17d'), grass:pigment('#57825d'), moss:pigment('#7b9b5f'), water:new T.MeshPhysicalMaterial({color:'#155d78',roughness:.27,metalness:.04,envMapIntensity:.14,transparent:true,opacity:.94,clearcoat:.45,clearcoatRoughness:.16}), waterLight:pigment('#a2d8d4',.28,.1), branch:pigment('#5c4c5a'), branchLight:pigment('#a46d77'), leaf:pigment('#9cba70',.95), leafDark:pigment('#315d58'), pink:pigment('#ec8fa5'), pinkLight:pigment('#ffd1b5'), flower:pigment('#f06390'), glass:new T.MeshPhysicalMaterial({color:'#418caa',roughness:.16,metalness:.25,transparent:true,opacity:.72,side:T.DoubleSide}), glow:new T.MeshBasicMaterial({color:'#87fbeb'})
};
for(const m of [mat.leaf,mat.leafDark,mat.moss,mat.pink,mat.pinkLight,mat.flower])m.side=T.DoubleSide;
function surfaceGrain(seed:number,repeat:number){
  const cv=document.createElement('canvas');cv.width=cv.height=256;const ctx=cv.getContext('2d')!;
  ctx.fillStyle='#f4f0e9';ctx.fillRect(0,0,256,256);
  const random=mulberry32(seed);
  for(let i=0;i<1850;i++){
    const x=random()*256,y=random()*256,l=1+random()*14;
    ctx.strokeStyle=random()>.45?'rgba(87,78,88,.06)':'rgba(255,250,226,.15)';
    ctx.lineWidth=.5+random()*1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+l,y+random()*2-1);ctx.stroke();
  }
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(repeat,repeat);tex.anisotropy=4;return tex;
}
mat.stone.map=surfaceGrain(42,4);mat.stone.needsUpdate=true;
mat.ivory.map=surfaceGrain(91,3);mat.ivory.needsUpdate=true;
mat.floor.map=mineralSurface(117);mat.floor.map.repeat.set(3,1);
Object.assign(mat.floor,sandstoneDetail());mat.floor.color.set('#e5c89b');mat.floor.needsUpdate=true;
mat.water.normalMap=waterNormals();mat.water.normalScale.set(.27,.27);
mat.water.color.set('#197a8b');mat.water.roughness=.16;mat.water.envMapIntensity=.4;
mat.grass.map=plantedGround();mat.grass.color.set('#73916e');
const boxG=new T.BoxGeometry(1,1,1);
function box(parent:T.Object3D,m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,rot=0){const o=new T.Mesh(boxG,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.rotation.y=rot;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function shape(parent:T.Object3D, pts:[number,number][], depth:number,m:T.Material,x=0,y=0,z=0,rotX=-Math.PI/2){const s=new T.Shape();s.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)s.lineTo(...pts[i]);s.closePath();const mesh=new T.Mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false}),m);mesh.position.set(x,y,z);mesh.rotation.x=rotX;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function rod(parent:T.Object3D,a:T.Vector3,b:T.Vector3,ra:number,rb:number,m:T.Material,seg=7){const d=b.clone().sub(a);const mesh=new T.Mesh(new T.CylinderGeometry(rb,ra,d.length(),seg),m);mesh.position.copy(a).addScaledVector(d,.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function tube(parent:T.Object3D,points:T.Vector3[],rad:number,m:T.Material){const curve=new T.CatmullRomCurve3(points);const mesh=new T.Mesh(new T.TubeGeometry(curve,(rad<.035?Math.max(6,points.length*2):Math.max(12,points.length*5)),rad,(rad<.035?5:7),false),m);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function poly(parent:T.Object3D,verts:T.Vector3[],m:T.Material){const p:number[]=[];for(let i=1;i<verts.length-1;i++)p.push(...verts[0].toArray(),...verts[i].toArray(),...verts[i+1].toArray());const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();const mesh=new T.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}

function pathMesh(parent:T.Object3D){const n=110,p:number[]=[],uv:number[]=[],idx:number[]=[];for(let i=0;i<=n;i++){const t=i/n;const c=route.getPoint(t),v=route.getTangent(t).normalize(),s=new T.Vector3(-v.z,0,v.x);const half=t>.87?3.55:3.2+Math.sin(t*Math.PI)*.18;for(const k of [-1,1]){const q=c.clone().addScaledVector(s,k*half);p.push(q.x,.11,q.z);uv.push(t*12,k*.5+.5)}}for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const mesh=new T.Mesh(g,mat.floor);mesh.receiveShadow=true;parent.add(mesh);
  for(const side of [-1,1]){const edge:T.Vector3[]=[],inlay:T.Vector3[]=[];for(let i=0;i<=n;i+=3){const t=i/n,c=route.getPoint(t),v=route.getTangent(t).normalize(),s=new T.Vector3(-v.z,0,v.x),half=t>.87?3.55:3.2+Math.sin(t*Math.PI)*.18;edge.push(c.clone().addScaledVector(s,side*(half-.22)).setY(.145));inlay.push(c.clone().addScaledVector(s,side*(half-.52)).setY(.145))}tube(parent,edge,.043,mat.trim);tube(parent,inlay,.019,mat.ivory)}
  buildPaving(parent,route,mat.floor);
}

function basin(parent:T.Object3D,x:number,z:number,sx:number,sz:number){const pts:[number,number][]=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2,q=1+.08*Math.sin(a*3+z);pts.push([Math.cos(a)*sx*q,Math.sin(a)*sz*q])}shape(parent,pts,.24,mat.stone,x,.07,z);shape(parent,pts.map(([a,b])=>[a*.94,b*.94]),.028,mat.water,x,.32,z);const rim:T.Vector3[]=[];for(let i=0;i<=32;i++){const [a,b]=pts[i%32];rim.push(new T.Vector3(x+a,.34,z+b))}tube(parent,rim,.105,mat.ivory);for(let j=0;j<8;j++){const a=j*2.41,d=.28+.45*r(),xx=x+Math.cos(a)*sx*d,zz=z+Math.sin(a)*sz*d;const leaf=new T.Mesh(new T.ShapeGeometry(new T.Shape().absellipse(0,0,.2+.1*r(),.09+.04*r(),0,Math.PI*2,false,0),12),mat.moss);leaf.rotation.x=-Math.PI/2;leaf.rotation.z=a;leaf.position.set(xx,.36,zz);parent.add(leaf);if(j%3===0){rod(parent,new T.Vector3(xx,.36,zz),new T.Vector3(xx,.53,zz),.018,.014,mat.trim);for(let q=0;q<5;q++){const an=q*Math.PI*2/5;poly(parent,[new T.Vector3(xx,.52,zz),new T.Vector3(xx+Math.cos(an)*.15,.45,zz+Math.sin(an)*.15),new T.Vector3(xx+Math.cos(an+.5)*.13,.47,zz+Math.sin(an+.5)*.13)],mat.pinkLight)}}}}

function curvedRoof(parent:T.Object3D,z0:number,z1:number,x0:number,x1:number,y:number,depth=.45,m=mat.ivory){const p:number[]=[],ids:number[]=[];const nx=16,nz=26;for(let j=0;j<=nz;j++){const z=z0+(z1-z0)*j/nz;for(let i=0;i<=nx;i++){const u=i/nx,x=x0+(x1-x0)*u;const rise=.6*Math.sin(u*Math.PI)+.22*Math.sin(j/nz*Math.PI*2);p.push(x,y+rise,z)}}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;ids.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();const roof=new T.Mesh(g,new T.MeshStandardMaterial({color:(m as T.MeshStandardMaterial).color,side:T.DoubleSide,roughness:.76}));roof.castShadow=true;roof.receiveShadow=true;parent.add(roof);for(const x of [x0,x1]){box(parent,mat.navy,x,y-.28,(z0+z1)/2,.24,depth,z1-z0+.4);tube(parent,[new T.Vector3(x,y,z0),new T.Vector3(x,y+.22,(z0+z1)/2),new T.Vector3(x,y,z1)],.10,mat.trim)}return roof}

function leafBlade(parent:T.Object3D,base:T.Vector3,tip:T.Vector3,w:number,m:T.Material){const along=tip.clone().sub(base),side=new T.Vector3(-along.z,.08,along.x).normalize().multiplyScalar(w),mid=base.clone().lerp(tip,.52);poly(parent,[base,mid.clone().add(side),tip,mid.clone().sub(side)],m);poly(parent,[base.clone().add(new T.Vector3(0,.012,0)),mid.clone().add(side.clone().multiplyScalar(.25)).add(new T.Vector3(0,.12,0)),tip.clone().add(new T.Vector3(0,.01,0)),mid.clone().sub(side).add(new T.Vector3(0,.04,0))],m)}
function plant(parent:T.Object3D,x:number,y:number,z:number,s:number,m:T.Material){rod(parent,new T.Vector3(x,y,z),new T.Vector3(x,y+s*.84,z),.045*s,.023*s,mat.branch,5);for(let k=0;k<7;k++){const a=k*2.4,level=.28+(k%3)*.19,p=new T.Vector3(x,y+s*level,z),tip=p.clone().add(new T.Vector3(Math.cos(a)*s*.53,s*.19,Math.sin(a)*s*.53));leafBlade(parent,p,tip,s*.15,m)}}


const sunlitBark=clearSight(pigment('#685c66'),'dither'),sunlitBlossomBark=clearSight(pigment('#806069'),'dither');
// trunks and branches step aside when they come between the camera and Zip
clearSight(mat.branch,'dither');clearSight(mat.branchLight,'dither');
let sharedLobe:T.BufferGeometry|undefined,sharedLobeMat:T.Material|undefined;
const lobeGeometry=()=>sharedLobe??=new T.IcosahedronGeometry(1,1);
const lobeMaterial=()=>sharedLobeMat??=clearSight(new T.MeshStandardMaterial({color:'#ffffff',roughness:1}),'shrink');
export function tree(parent:T.Object3D,x:number,z:number,scale:number,pink=false,distant=false,coherent=false){
  const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
  const tr=mulberry32(Math.round((x+70)*311+(z+90)*79));
  const bark=coherent?(pink?sunlitBlossomBark:sunlitBark):pink?mat.branchLight:mat.branch;
  tube(g,[new T.Vector3(0,.05,0),new T.Vector3(-.19,1.04,.08),new T.Vector3(.12,2.18,0),new T.Vector3(.1,3.35,-.08)],.18,bark);
  const q=quality(),lobes=q.lobeTrees==='all'||(q.lobeTrees==='distant'&&distant),lobePts:[T.Vector3,T.Color][]=[],keep=lobes?1:q.leafFraction,thin=mulberry32(Math.round((x+13)*97+(z+29)*53)),grow=1/Math.sqrt(Math.max(keep,.2));
  // Shell crown (keep<1): keep the outermost cards, which carry the silhouette
  // and the lit side; interior cards are mostly hidden but still cost fill rate.
  const hybrid=!lobes&&keep<1,shellCards:{base:T.Vector3,dir:T.Vector3,len:number,width:number,c:T.Color}[]=[];
  const count=Math.ceil(1260*keep)+8,leafGeo=canopyGeometry(pink,count),appearance=canopyMaterial(pink);
  const leaves=new T.InstancedMesh(leafGeo,appearance.material,count);
  leaves.castShadow=true;leaves.receiveShadow=true;leaves.frustumCulled=false;
  leaves.customDepthMaterial=appearance.depth;
  const dummy=new T.Object3D(),up=new T.Vector3(0,1,0),spread=new T.Vector3();
  let next=0;
  const shade=coherent?(pink?['#905b77','#b77790','#d494a7','#e6b0bc','#f2c7c4']:['#345f5d','#447363','#628969','#82a078','#aec08c']):pink?['#98526e','#b2627c','#d28197','#e69aaa','#efb2b6']:['#365944','#527447','#6b8750','#879957','#a9b365'];
  function addLeaf(base:T.Vector3,dir:T.Vector3,len:number,width:number,c:T.Color){
    if(next>=count)return;
    if(lobes){if(thin()<.13)lobePts.push([base.clone(),c]);next++;return;}
    if(hybrid){shellCards.push({base:base.clone(),dir:dir.clone(),len,width,c});return;}
    addCard(base,dir,len,width,c);
  }
  function addCard(base:T.Vector3,dir:T.Vector3,len:number,width:number,c:T.Color){
    if(next>=count)return;
    dummy.position.copy(base);dummy.quaternion.setFromUnitVectors(up,dir.normalize());
    dummy.quaternion.multiply(new T.Quaternion().setFromAxisAngle(up,tr()*Math.PI*2));
    dummy.scale.set(width,len,width);dummy.updateMatrix();
        leaves.setMatrixAt(next,dummy.matrix);leaves.setColorAt(next,c);
    const normal=base.clone().sub(new T.Vector3(0,2.85,0));normal.y=normal.y*1.8+.55;normal.normalize();
    (leafGeo.getAttribute('canopyNormal') as T.InstancedBufferAttribute).setXYZ(next,normal.x,normal.y,normal.z);next++;
  }
  const colors=shade.map(s=>new T.Color(s));
  // Structural arms fork into small sprays. Their exposed inner halves remain readable.
  for(let b=0;b<(coherent?10:14);b++){
    const a=b*2.399+tr()*.14,level=2.18+(b%5)*.28,len=1.65+tr()*1.22;
    const inner=new T.Vector3(.08,level,.02);
    const elbow=new T.Vector3(Math.cos(a)*len*.48,level+.34,Math.sin(a)*len*.48);
    const outer=new T.Vector3(Math.cos(a)*len,level+.48+tr()*.42,Math.sin(a)*len);
    const branchRadius=.055+tr()*.025;
    if(!distant)tube(g,[inner,elbow,outer],branchRadius,bark);
    for(let q=0;q<4;q++){
      const az=a+(q-1.5)*.42+range(tr,-.16,.16);
      const from=inner.clone().lerp(outer,.58+q*.10);
      const tip=outer.clone().add(new T.Vector3(Math.cos(az)*(.35+tr()*.42),range(tr,-.24,.53),Math.sin(az)*(.35+tr()*.42)));
      if(!distant)tube(g,[from,from.clone().lerp(tip,.5).add(new T.Vector3(0,.08,0)),tip],.025,bark);
      for(let k=0;k<(coherent?22:19);k++){
        const theta=k*2.399+tr()*.18,rad=Math.sqrt(tr())*(coherent?.68+.12*q:.75+.2*q),height=range(tr,coherent?-.35:-.52,coherent?.52:.7);
        spread.set(Math.cos(theta)*rad,height,Math.sin(theta)*rad);
        const base=tip.clone().add(spread);
        const outward=base.clone().sub(new T.Vector3(0,3.05,0)).normalize();
        const dir=outward.multiplyScalar(.58).add(new T.Vector3(range(tr,-.55,.55),range(tr,.10,.66),range(tr,-.55,.55))).normalize();
        const lightness=coherent?T.MathUtils.clamp(Math.floor(2+(base.y-3.25)*1.4-base.x*.28+base.z*.20),0,4):base.y>3.35||rad>.63?2+Math.floor(tr()*3):Math.floor(tr()*3);
        addLeaf(base,dir,range(tr,coherent?.60:.42,coherent?1.02:.82),range(tr,coherent?.72:.55,coherent?1.08:.9),colors[lightness]);
      }
    }
  }
  // A few dark inner leaves bind the forks into one crown without hiding the trunk.
  for(let k=0;k<120;k++){
    const a=tr()*Math.PI*2,rad=Math.sqrt(tr())*1.25,y=range(tr,2.58,3.92);
    const base=new T.Vector3(Math.cos(a)*rad,y,Math.sin(a)*rad);
    addLeaf(base,new T.Vector3(Math.cos(a)*.35,range(tr,.2,.8),Math.sin(a)*.35),range(tr,.38,.7),range(tr,.55,.78),colors[Math.floor(tr()*2)]);
  }
  let core:[T.Vector3,T.Color,number][]=[];
  if(hybrid){
    // rank cards by how far out they sit from the crown's centre, per direction
    const centre=new T.Vector3(0,3.05,0),rel=(v:T.Vector3)=>{const d=v.clone().sub(centre);d.y*=.9;return d.length()};
    // keep the outermost share of cards (exact fraction), thin the inner ones
    const ranked=shellCards.map(l=>({l,r:rel(l.base)})).sort((a,b)=>b.r-a.r);
    const keepN=Math.round(ranked.length*keep);
    ranked.forEach(({l},i)=>{
      if(i<keepN)addCard(l.base,l.dir,l.len*1.12,l.width*1.12,l.c);
    });
  }
  if(lobes||core.length){
    const pts:[T.Vector3,T.Color,number][]=lobes?lobePts.map(([p,c])=>[p,c,.34+thin()*.2]):core;
    const puff=new T.InstancedMesh(lobeGeometry(),lobeMaterial(),pts.length);const d=new T.Object3D();
    pts.forEach(([p,c,s],i)=>{d.position.copy(p);d.scale.set(s,s*.82,s);d.rotation.set(thin()*3,thin()*3,0);d.updateMatrix();puff.setMatrixAt(i,d.matrix);puff.setColorAt(i,c)});
    puff.castShadow=true;puff.receiveShadow=true;puff.renderOrder=-1;g.add(puff);
  }
  if(lobes){
    leafGeo.dispose();
  } else {
  leaves.renderOrder=1;leaves.receiveShadow=q.tier==='high';
  leaves.count=next;leaves.instanceMatrix.needsUpdate=true;if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;g.add(leaves);
  }
  // A buttressed root ties the canopy to the terrace.
  for(let q=0;q<4;q++){const a=q*Math.PI/2+.3;rod(g,new T.Vector3(Math.cos(a)*.52,.05,Math.sin(a)*.52),new T.Vector3(0,1.36,0),.095,.045,bark,6)}
}

function pavilion(parent:T.Object3D){
  const p=new T.Group();p.position.set(4.3,-.48,-24);parent.add(p);
  shape(p,[[-5,-4],[4.5,-4],[5.1,3.3],[-4.4,4]],.5,mat.stone,0,.04,0);
  shape(p,[[-4.6,-3.6],[4.1,-3.6],[4.7,3],[-4,3.6]],.06,mat.floor,0,.56,0);
  // The payoff is a clear vista. Keep all foreground framing below eye height.
  for(const z of [-3.85,3.85]){
    for(let j=0;j<11;j++){const x=-4.1+j*.82;if(z>0&&Math.abs(x)<1.4)continue;rod(p,new T.Vector3(x,.58,z),new T.Vector3(x,1.23,z),.035,.026,mat.trim,6)}
    if(z<0)box(p,mat.trim,0,1.26,z,8.5,.09,.09);
    else for(const x of [-3.05,3.05])box(p,mat.trim,x,1.26,z,2.4,.09,.09);
  }
  for(const x of [-4.75,4.75]){
    for(let j=0;j<9;j++){const z=-3.4+j*.84;rod(p,new T.Vector3(x,.58,z),new T.Vector3(x,1.23,z),.035,.026,mat.trim,6)}
    box(p,mat.trim,x,1.26,0,.09,.09,7.3);
  }
  for(const x of [-3.2,3.2]){box(p,mat.navy,x,.85,1.0,.6,.5,2.1);box(p,mat.stone,x,1.13,1.0,.8,.12,2.3)}
  // One curved civic sail gives the destination identity without closing the view.
  const sail:T.Vector3[]=[];
  for(let i=0;i<=24;i++){const t=i/24*Math.PI;sail.push(new T.Vector3(-5.4+Math.sin(t)*1.9,.55+Math.sin(t)*7.2,-3.4+6.8*i/24))}
  tube(p,sail,.20,mat.ivory);tube(p,sail.map(v=>v.clone().add(new T.Vector3(.1,0,0))),.045,mat.trim);
  p.traverse(o=>{if(o instanceof T.Mesh&&o.geometry===boxG)cameraSolids.push(o)});
}
function terrace(parent:T.Object3D){
  const rim:[number,number][]=[[-16,27],[11,27],[17,16],[19,8],[18,-2],[16,-13],[12,-29],[7,-30],[-2,-30],[-9,-27],[-15,-15],[-17,0]];
  // The local garden is a thick, finite civic terrace above the lower district.
  const section=rim.map(([x,z])=>[x,-z] as [number,number]);
  shape(parent,section,3.2,mat.shadow,0,-3.2,0);
  shape(parent,section,.07,mat.grass,0,.005,0);
  const edge=rim.map(([x,z])=>new T.Vector3(x,.08,z));edge.push(edge[0].clone());tube(parent,edge,.15,mat.ivory);
  const copper=rim.map(([x,z])=>new T.Vector3(x,-1.65,z));copper.push(copper[0].clone());tube(parent,copper,.075,mat.trim);
  // Shaded retaining face and cantilever ribs reveal thickness from the overlook.
  for(let i=0;i<12;i++){
    const x=-9+i*1.85,z=-29.5-2.0*Math.sin(i/11*Math.PI);
    const foot=new T.Vector3(x,-5.7,z-1.8),head=new T.Vector3(x,-.15,z+.1);
    rod(parent,foot,head,.2,.13,mat.navy,6);
    box(parent,mat.stone,x,-3.6,z-.8,.48,.25,1.5);
  }
  for(const [x,z] of [[-15,-10],[16,5],[13,-17]]){
    box(parent,mat.stone,x,.28,z,.72,.54,5.5);
    box(parent,mat.trim,x,.59,z,.8,.10,5.7);
  }
  box(parent,mat.floor,0,.09,20,6.5,.10,14);
  for(let z=14;z<=26;z+=1.15)tube(parent,[new T.Vector3(-3.24,.15,z),new T.Vector3(3.24,.15,z)],.012,z%3<1?mat.trim:mat.floorAlt);
  for(const x of [-3.22,3.22])tube(parent,[new T.Vector3(x,.16,13),new T.Vector3(x,.16,27)],.07,mat.trim);
}
function skyline(parent:T.Object3D){const sky=new T.Mesh(new T.SphereGeometry(420,32,20),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:col('#117bd1')},bottom:{value:col('#a5d1e1')}},vertexShader:'varying vec3 p; void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 p; uniform vec3 top; uniform vec3 bottom; void main(){float t=smoothstep(-.06,.52,normalize(p).y);gl_FragColor=vec4(mix(bottom,top,t),1.);\n#include <colorspace_fragment>\n}' }));sky.position.y=-20;sky.renderOrder=-10;parent.add(sky);buildOrbitalSky(parent);}

function batchDecor(root:T.Group){
  root.updateMatrixWorld(true);
  const eligible=new Set<T.Material>();
  root.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)&&o.material instanceof T.MeshStandardMaterial&&!o.material.transparent)eligible.add(o.material)});
  const solids=new Set(cameraSolids),groups=new Map<string,{material:T.Material,meshes:T.Mesh[]} >();
  const ids=new Map<T.Material,number>();let id=0;
  root.traverse(o=>{
    if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||solids.has(o)||Array.isArray(o.material)||!eligible.has(o.material))return;
    const material=o.material as T.Material,g=o.geometry;
    if(!ids.has(material))ids.set(material,id++);
    const attrs=Object.entries(g.attributes as Record<string,T.BufferAttribute>).map(([k,v])=>`${k}:${v.itemSize}:${v.normalized}`).sort().join(',');
    const key=`${ids.get(material)}|${g.index?'indexed':'plain'}|${attrs}`;
    let group=groups.get(key);if(!group){group={material,meshes:[]};groups.set(key,group)}group.meshes.push(o);
  });
  for(const {material,meshes} of groups.values()){
    if(meshes.length<2)continue;
    const geometries=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));
    const merged=mergeGeometries(geometries,false);
    geometries.forEach(g=>g.dispose());
    if(!merged)throw Error('Static decorative geometry could not be batched');
    merged.computeBoundingSphere();
    const mesh=new T.Mesh(merged,material);mesh.castShadow=meshes.some(m=>m.castShadow);mesh.receiveShadow=meshes.some(m=>m.receiveShadow);
    for(const m of meshes)m.parent?.remove(m);
    root.add(mesh);
  }
}

export function buildWorld(scene:T.Scene){const root=new T.Group();scene.add(root);skyline(root);terrace(root);pathMesh(root);buildCivic(root,cameraSolids);basin(root,6.3,3.7,2.6,5.5);basin(root,7.7,-7.9,3.5,5.8);basin(root,-1.4,-11.7,2,3.4);pavilion(root);tree(root,-5.5,-15.5,1.35,false);tree(root,13.5,-22.5,1.8,true);tree(root,12.8,-5.5,1.05,false);tree(root,-12.3,3,1.2,true);for(let j=0;j<35;j++){const t=r()*.88,c=route.getPoint(t),v=route.getTangent(t),s=new T.Vector3(-v.z,0,v.x),side=j%2?1:-1,p=c.addScaledVector(s,side*range(r,4.5,7.6));if(p.x < -4.5&&p.z>-10)continue;plant(root,p.x,.08,p.z,range(r,.55,1.25),j%4===0?mat.flower:j%3===0?mat.leafDark:mat.leaf)}buildVista(root,mat,tree);for(let j=0;j<8;j++){const t=(j+.5)/9,c=route.getPoint(t),v=route.getTangent(t),s=new T.Vector3(-v.z,0,v.x),p=c.clone().addScaledVector(s,j%2?3.8:-3.8);if(p.x<-4.5&&p.z>-10)continue;box(root,mat.navy,p.x,.44,p.z,.24,.8,.28);box(root,mat.trim,p.x,.89,p.z,.3,.12,.34);box(root,mat.glow,p.x,.96,p.z,.19,.1,.19)}batchDecor(root);return root}

export function nearestRoute(p:T.Vector3){let best=0,dist=Infinity;for(let i=0;i<=150;i++){const t=i/150,q=route.getPoint(t),d=(p.x-q.x)**2+(p.z-q.z)**2;if(d<dist){dist=d;best=t}}return {t:best,d:Math.sqrt(dist)}}
export function walkable(p:T.Vector3){const n=nearestRoute(p);return n.d<3.0 || (p.z>=13&&p.z<26&&Math.abs(p.x)<3) || (p.distanceTo(overlook)<4.1)}
