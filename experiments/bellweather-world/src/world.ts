import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, prep, merge, beam, box, cyl, xf, blob } from './vendor/summer-cycle/world/geo';
import { tree } from './vendor/summer-cycle/world/props';
import { leafPlant, flower } from './vendor/summer-cycle/world/vegetation';
import { G, uber, waterMaterial } from './vendor/summer-cycle/render/materials';
import { Sky } from './vendor/summer-cycle/world/sky';
import { onLayers, LAYER_REFLECT, LAYER_SHADOW } from './vendor/summer-cycle/render/lightpasses';
import { mulberry32 } from './vendor/summer-cycle/core/rng';
import { Citizen, distantPeople } from './actors';
import { canopyMaterial } from './materials';

const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const C={cream:'#f0e5ce',edge:'#fff4de',shade:'#547783',glass:'#386776',gold:'#b99563',ink:'#284957',green:'#376653'};
export const route=(t:number)=>V(Math.sin(t*Math.PI*1.55)*10+12*t,0,14-t*54);
export function point(t:number,offset=0,y=0){const c=route(t),tangent=V(Math.cos(t*Math.PI*1.55)*10*Math.PI*1.55+12,0,-54).normalize();return c.addScaledVector(V(-tangent.z,0,tangent.x),offset).setY(y)}
export function nearest(p:T.Vector3){let at=0,best=Infinity;for(let i=0;i<=180;i++){const t=i/180,d=route(t).distanceToSquared(V(p.x,0,p.z));if(d<best){best=d;at=t}}const c=route(at);const normal=point(at,1).sub(c);return{t:at,offset:p.clone().sub(c).dot(normal),distance:Math.sqrt(best)}}
export const START=point(.045,-.7), WELL=point(.43,-2.6), LOOK=point(.94,.1);

function extrude(points:T.Vector3[],bottom:number,height:number,color:string,mat:number=M.plaster){
 const s=new T.Shape();points.forEach((p,i)=>i?s.lineTo(p.x,-p.z):s.moveTo(p.x,-p.z));s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);g.translate(0,bottom,0);return prep(g,color,mat);
}
function ribbon(a:number,b:number,left:number,right:number,bottom:number,height:number,color:string,mat:number=M.plaster){
 const points:T.Vector3[]=[];for(let i=0;i<=48;i++)points.push(point(a+(b-a)*i/48,left));for(let i=48;i>=0;i--)points.push(point(a+(b-a)*i/48,right));return extrude(points,bottom,height,color,mat);
}
function ring(cx:number,cz:number,r:number,width:number,bottom:number,height:number,color:string,a=0,b=Math.PI*2,mat:number=M.plaster){
 const pts:T.Vector3[]=[];for(let i=0;i<=64;i++){const t=a+(b-a)*i/64;pts.push(V(cx+Math.sin(t)*r,0,cz+Math.cos(t)*r))}for(let i=64;i>=0;i--){const t=a+(b-a)*i/64;pts.push(V(cx+Math.sin(t)*(r-width),0,cz+Math.cos(t)*(r-width)))}return extrude(pts,bottom,height,color,mat);
}
function rounded(w:number,h:number,d:number,c:string,mat:number=M.plain){return prep(new RoundedBoxGeometry(w,h,d,2,Math.min(.12,h/4,w/4,d/4)),c,mat)}
const shift=(g:T.BufferGeometry,p:T.Vector3)=>g.translate(p.x,p.y,p.z);

export class GardenWorld{
 root=new T.Group(); solid:T.Mesh[]=[]; blockers:{x:number;z:number;r:number}[]=[]; petals:T.Group[]=[]; light=new T.Group(); signal:T.Mesh[]=[]; train=new T.Group(); sky=new Sky();
 mira=new Citizen('mira','#e5b977'); residents=[new Citizen('resident','#9e6474'),new Citizen('resident','#e2b068')];
 awake=0; miraT=.43; tide=0; private statics:T.BufferGeometry[]=[];
 constructor(){
  // Keep the source's sky/cloud rendering; exclude its terrestrial ground/ridges.
  for(const child of [...this.sky.group.children]){
   const m=child as T.Mesh;const data=(m.material as T.Material)?.userData?.uber;
   if(data?.id===15||data?.id===1)this.sky.group.remove(child);
   else if(m.geometry?.getAttribute('aH'))m.position.y-=340;
  }
  this.root.add(this.sky.group);
  this.statics.push(ribbon(0,1,-6,8,-1.1,1.1,C.cream));
  // Designed margins and slender inlaid joints preserve broad quiet walking surfaces.
  this.statics.push(ribbon(0,1,-6,-5.8,0,.055,C.edge),ribbon(0,1,7.8,8,0,.055,C.edge));
  for(const t of [.02,.16,.30,.44,.58,.72,.86,.99])this.statics.push(beam(point(t,-5.6,.007),point(t,7.6,.007),.012,'#c6b99e',M.plain,4));
  this.statics.push(ribbon(.08,.82,4.0,4.16,.005,.11,C.edge),ribbon(.08,.82,7.19,7.35,.005,.11,C.edge));
  this.statics.push(ribbon(.08,.085,4.0,7.35,.005,.11,C.edge),ribbon(.815,.82,4.0,7.35,.005,.11,C.edge));
  const waterGeo=ribbon(.085,.815,4.15,7.2,.045,.01,'#579caa');
  // Pinned upstream planar-water shader, with agricultural tuft drawing omitted.
  const water=waterMaterial();const start=water.fragmentShader.indexOf('        // Young rice on a 0.6');const end=water.fragmentShader.indexOf('        col = applyFog',start);
  if(start<0||end<0)throw new Error('Pinned water shader contract changed');
  water.fragmentShader=water.fragmentShader.slice(0,start)+water.fragmentShader.slice(end);
  water.fragmentShader=water.fragmentShader.replace('vec3 mud = vec3(0.05, 0.065, 0.04);','vec3 mud = vec3(0.025, 0.19, 0.21);');
  water.fragmentShader=water.fragmentShader.replace('float fres = 0.3 + 0.7','float fres = 0.13 + 0.48').replace('refl * 0.9','refl * 0.65');
  waterGeo.setAttribute('aP',new T.Float32BufferAttribute(new Float32Array(waterGeo.attributes.position.count),1));
  this.root.add(new T.Mesh(waterGeo,water));
  // The water is shallow-looking but outside the traversable strip, visibly bounded by coping.
  for(const side of [-5.65,7.72])for(let i=0;i<30;i++){
   const t=.02+i*.032;this.statics.push(beam(point(t,side,.10),point(t,side,.86),.033,C.gold,M.metal,5));
   if(i<29)this.statics.push(beam(point(t,side,.87),point(t+.032,side,.87),.038,C.gold,M.metal,6));
  }
  this.buildRotunda(-11,7,10,3);
  this.buildRotunda(-9,-29,9,2);
  // Arrival canopy is supported by two swept ribs, leaving the onward route open.
  for(const z of [11,17]){
   const curve=new T.CubicBezierCurve3(V(-5.5,0,z),V(-6,7,z),V(-.5,8,z),V(3.8,5.9,z));
   this.statics.push(prep(new T.TubeGeometry(curve,30,.17,7,false),C.cream,M.plaster));
  }
  const canopyPts=[V(-6,0,10),V(-1,0,10),V(4,0,12),V(4,0,17),V(-5,0,19)];
  this.statics.push(extrude(canopyPts,6.55,.16,C.edge));
  // Grounded benches have a purpose and scale; no middle-of-path furniture.
  for(const t of [.20,.68,.94]){
   const p=point(t,-4.6);this.bench(p,Math.atan2(point(t+.01).x-point(t).x,point(t+.01).z-point(t).z));
   this.blockers.push({x:p.x,z:p.z,r:.85});
  }
  this.buildLightwell();
  this.buildVegetation();
  this.buildCity();
  const staticMesh=new T.Mesh(merge(this.statics),uber(7,.35));onLayers(staticMesh,LAYER_SHADOW,LAYER_REFLECT);this.root.add(staticMesh);this.solid.push(staticMesh);
  this.mira.root.position.copy(point(.43,.15));this.mira.root.rotation.y=.5;this.root.add(this.mira.root);
  for(let i=0;i<this.residents.length;i++){this.residents[i].root.scale.setScalar(.96+i*.04);this.root.add(this.residents[i].root)}
 }
 private buildRotunda(x:number,z:number,r:number,floors:number){
  this.blockers.push({x,z,r:r-.15});
  this.statics.push(shift(cyl(r,r,.5,C.shade,M.plaster,48),V(x,-.28,z)));
  for(let f=0;f<floors;f++){
   const y=f*3.6;
   this.statics.push(ring(x,z,r,.32,y+.60,2.35,C.glass));
   this.statics.push(ring(x,z,r+.03,.38,y,.60,C.cream),ring(x,z,r+.03,.38,y+2.8,.65,C.cream));
   this.statics.push(ring(x,z,r+1.05,2.0,y+3.3,.28,C.edge));
   for(let j=0;j<18;j++){
    const a=j*Math.PI*2/18;const p=V(x+Math.sin(a)*(r+.06),y+1.6,z+Math.cos(a)*(r+.06));
    this.statics.push(shift(box(.56,3.3,.34,C.cream,M.plaster).rotateY(a),p));
   }
   // Balcony rail, kept fine enough that the open floor still reads as open.
   this.statics.push(ring(x,z,r+.86,.07,y+4.10,.06,C.gold));
   for(let j=0;j<30;j++){const a=j*Math.PI*2/30;const p=V(x+Math.sin(a)*(r+.88),y+3.64,z+Math.cos(a)*(r+.88));this.statics.push(shift(cyl(.025,.025,.82,C.gold,M.metal,5),p))}
  }
  this.statics.push(shift(cyl(r+1.1,r+1.1,.26,C.edge,M.plaster,64),V(x,floors*3.6,z)));
  // Repeated planted balcony pockets rather than random façade scatter.
  for(let f=1;f<=floors;f++)for(const a of [.30,.90,1.65,2.6]){
   const p=V(x+Math.sin(a)*(r+.2),f*3.6+.16,z+Math.cos(a)*(r+.2));
   this.statics.push(shift(rounded(1.7,.28,.65,C.cream),p));this.addPlant(p.clone().add(V(0,.12,0)),.8,f+Math.round(a*10));
  }
 }
 private bench(p:T.Vector3,a:number){
  const pieces=[xf(rounded(1.8,.12,.6,'#bb8c60',M.planks),0,.47,0),xf(rounded(1.8,.40,.09,C.cream),0,.81,.30)];
  for(const x of [-.62,.62])pieces.push(xf(rounded(.13,.45,.44,C.shade),x,.22,0));
  const g=merge(pieces);g.rotateY(a);g.translate(p.x,p.y,p.z);this.statics.push(g);
 }
 private addPlant(p:T.Vector3,s:number,seed:number){const g=leafPlant(seed,'broad');g.scale(s,s,s);g.translate(p.x,p.y,p.z);const m=new T.Mesh(g,uber(6,-1,T.DoubleSide));onLayers(m,LAYER_SHADOW,LAYER_REFLECT);this.root.add(m)}
 private addTree(p:T.Vector3,scale:number,pink:boolean,seed:number,lod=0){
  const g=tree('round',seed,lod);const colors=g.attributes.color as T.BufferAttribute;const mats=g.attributes.aMat;
  if(pink){const lo=new T.Color('#ac486f'),hi=new T.Color('#f7aab7');const pos=g.attributes.position;for(let i=0;i<colors.count;i++)if([1,17,21].includes(mats.getX(i))){const c=lo.clone().lerp(hi,T.MathUtils.clamp((pos.getY(i)-3)/5,0,1));colors.setXYZ(i,c.r,c.g,c.b)}}
  g.scale(scale,scale,scale);g.translate(p.x,p.y,p.z);const m=new T.Mesh(g,canopyMaterial(g,pink));onLayers(m,LAYER_SHADOW,LAYER_REFLECT);this.root.add(m);
  if(lod===0&&p.y===0)this.blockers.push({x:p.x,z:p.z,r:.45*scale});
 }
 private buildVegetation(){
  // Deliberately placed canopies frame turns; they do not occupy the walking centre.
  for(const [t,off,s,seed] of [[.14,-4.6,.43,71],[.59,-4.7,.58,95],[.82,6.7,.46,125]] as number[][]){
   const p=point(t,off);this.statics.push(shift(cyl(.95,1.02,.32,C.edge,M.plaster,24),p.clone().setY(.15)));this.addTree(p,s,t>.5,seed);this.blockers.push({x:p.x,z:p.z,r:1.1});
  }
  const rng=mulberry32(662);const flowers:T.BufferGeometry[]=[];
  for(let i=0;i<65;i++){
   const t=.1+rng()*.7,off=i%2===0?-5.10:7.49;const p=point(t,off,.13);
   if(i%5===0)this.addPlant(p,.5+rng()*.2,i+91);
   const g=flower();g.scale(1.2,1.2,1.2);g.translate(p.x,p.y+.26,p.z);flowers.push(g);
  }
  const blooms=new T.Mesh(merge(flowers),uber(16,-1,T.DoubleSide));onLayers(blooms,LAYER_REFLECT);this.root.add(blooms);
  // Water lilies float on the actual planar water surface.
  for(let i=0;i<26;i++){
   const p=point(.12+rng()*.65,4.4+rng()*2.4,.067);
   const pad=prep(new T.CircleGeometry(.19+rng()*.15,13,0,Math.PI*1.87).rotateX(-Math.PI/2),'#58856d',M.plain);pad.translate(p.x,p.y,p.z);this.statics.push(pad);
   if(i%3===0){const g=flower();g.scale(2,1.3,2);g.translate(p.x,p.y+.035,p.z);const m=new T.Mesh(g,uber(16,-1,T.DoubleSide));this.root.add(m)}
  }
 }
 private buildLightwell(){
  this.light.position.copy(WELL);this.root.add(this.light);this.blockers.push({x:WELL.x,z:WELL.z,r:.92});
  const g=merge([xf(cyl(.65,.80,.25,C.cream,M.plaster,24),0,.125,0),xf(cyl(.20,.34,.95,C.shade,M.metal,12),0,.68,0),xf(cyl(.60,.20,.25,C.gold,M.metal,24),0,1.23,0)]);
  this.light.add(new T.Mesh(g,uber(11,.65)));
  for(let i=0;i<7;i++){
   const petal=new T.Group();petal.rotation.y=i*Math.PI*2/7;petal.position.y=1.34;
   const sh=new T.Shape();sh.moveTo(-.08,0);sh.bezierCurveTo(-.38,.28,-.34,.72,0,.96);sh.bezierCurveTo(.34,.72,.38,.28,.08,0);sh.closePath();
   const geom=prep(new T.ExtrudeGeometry(sh,{depth:.055,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2}),i%2?C.edge:'#aadbcf',M.plain);
   const leaf=new T.Mesh(geom,uber(11,.45));leaf.rotation.x=.2;petal.add(leaf);this.petals.push(petal);this.light.add(petal);
  }
  const core=new T.Mesh(prep(new T.SphereGeometry(.22,16,12),'#ffcf87',M.plain),uber(11,.2));core.position.y=1.52;this.light.add(core);
  onLayers(this.light,LAYER_SHADOW,LAYER_REFLECT);
  for(let i=0;i<7;i++){const m=new T.Mesh(prep(new T.SphereGeometry(.075,8,6),'#ffe4a5',M.plain),uber(11,-1));m.visible=false;this.signal.push(m);this.root.add(m)}
 }
 private buildCity(){
  // Floating civic islands at three scales. Every architectural band has structure below it.
  const islands=[{x:44,z:-107,y:-8,r:24,h:35},{x:-72,z:-130,y:-16,r:19,h:40},{x:10,z:-220,y:-4,r:35,h:70},{x:124,z:-240,y:12,r:28,h:46},{x:-165,z:-310,y:15,r:38,h:83}];
  for(let i=0;i<islands.length;i++){
   const p=islands[i];this.statics.push(shift(cyl(p.r,p.r*.9,2.8,C.edge,M.plaster,40),V(p.x,p.y,p.z)));
   const cliff=prep(new T.CylinderGeometry(p.r*.94,2,p.r*.82,21,4),'#658f94',M.stone);const vertices=cliff.attributes.position;
   for(let k=0;k<vertices.count;k++){const y=vertices.getY(k),theta=Math.atan2(vertices.getZ(k),vertices.getX(k));const uneven=1+.065*Math.sin(theta*7+y*.7)+.035*Math.sin(theta*13);vertices.setX(k,vertices.getX(k)*uneven);vertices.setZ(k,vertices.getZ(k)*uneven)}cliff.computeVertexNormals();cliff.translate(p.x,p.y-p.r*.46,p.z);this.statics.push(cliff);
   this.statics.push(ring(p.x,p.z,p.r*.93,1.3,p.y+1.42,.07,'#678c72'));
   for(let j=0;j<3;j++){
    const a=j*2.1+.5,rr=p.r*.64,cx=p.x+Math.cos(a)*rr,cz=p.z+Math.sin(a)*rr,h=p.h*(.6+j*.13);
    const fin=new T.Shape();fin.moveTo(-2,0);fin.bezierCurveTo(-5,h*.35,-6,h*.7,1,h);fin.bezierCurveTo(2,h*.93,5,h*.77,3,h*.65);fin.bezierCurveTo(0,h*.45,0,h*.18,2,0);fin.closePath();
    const geom=prep(new T.ExtrudeGeometry(fin,{depth:2.4,bevelEnabled:true,bevelSegments:2,bevelSize:.3,bevelThickness:.3}),C.cream,M.plaster);geom.rotateY(a);geom.translate(cx,p.y+1.2,cz);this.statics.push(geom);
   }
   this.addTree(V(p.x,p.y+1.5,p.z),p.r*.10,true,53+i*17,1);
   // Several thin waterfall ribbons descend into the cloud layer.
   for(let j=0;j<3;j++){const a=.2+j*.4;const wp=V(p.x+Math.cos(a)*p.r*.93,p.y-18,p.z+Math.sin(a)*p.r*.93);this.statics.push(shift(box(.25+j*.16,36,.12,'#b4e0df',M.plain),wp));}
  }
  // A continuous transit span gives the sky traffic an origin and a destination.
  const rail=new T.CatmullRomCurve3([V(-110,24,-64),V(-36,20,-47),V(38,20,-92),V(110,30,-163)]);
  this.statics.push(prep(new T.TubeGeometry(rail,90,.28,7,false),C.shade,M.metal));
  const rail2=new T.CatmullRomCurve3(rail.points.map(p=>p.clone().add(V(0,.12,.7))));this.statics.push(prep(new T.TubeGeometry(rail2,90,.11,5,false),C.edge,M.metal));
  const trainGeos:T.BufferGeometry[]=[];for(let i=0;i<3;i++){trainGeos.push(xf(rounded(2,1.8,5.8,C.edge),0,0,i*6.2),xf(rounded(2.03,.65,4.7,C.glass,M.glass),0,.15,i*6.2))}
  this.train.add(new T.Mesh(merge(trainGeos),uber(7,.25)));this.train.userData.rail=rail;onLayers(this.train,LAYER_REFLECT);this.root.add(this.train);
  const people=[];for(const [x,y,z,a] of [[-1.9,3.58,9,.9],[-4.5,7.18,14,1.8],[-2,3.58,-23,2.2]])people.push({x,y,z,angle:a,color:'#456571'});this.root.add(distantPeople(people));
  // Monumental planet stays subordinate to the actual reachable route.
  const planet=prep(new T.SphereGeometry(330,40,24),'#d7dcdd',M.plaster);planet.translate(580,570,-1450);const pm=new T.Mesh(planet,uber(15,0));this.root.add(pm);
 }
 walkable(p:T.Vector3){
  const n=nearest(p);if(n.t<=0&&p.z>14||n.t>=1&&p.z<-40)return false;
  if(n.offset< -5.20||n.offset>3.62||n.distance>6)return false;
  for(const b of this.blockers)if(Math.hypot(p.x-b.x,p.z-b.z)<b.r+.25)return false;
  for(const actor of [this.mira,...this.residents])if(Math.hypot(p.x-actor.root.position.x,p.z-actor.root.position.z)<.52)return false;
  return true;
 }
 update(dt:number,time:number,activated:boolean,reduced:boolean){
  this.awake=reduced?Number(activated):T.MathUtils.damp(this.awake,Number(activated),2.2,dt);
  for(const p of this.petals)(p.children[0] as T.Mesh).rotation.x=.2+this.awake*1.02;
  for(let i=0;i<this.signal.length;i++){const m=this.signal[i];m.visible=activated;const t=reduced?.65:.44+((time*.045+i*.06)%.34);m.position.copy(point(t,5.4,.14));}
  const old=this.miraT;if(activated)this.miraT=reduced?.935:Math.min(.935,this.miraT+dt*.037);
  const p=point(this.miraT,.20);this.mira.root.position.copy(p);const ahead=point(Math.min(.99,this.miraT+.02),.20).sub(p);
  this.mira.root.rotation.y=this.miraT<.932?Math.atan2(-ahead.x,-ahead.z):Math.PI*.7;
  this.mira.update(dt,(this.miraT-old)*54/Math.max(dt,.001),time,reduced);
  for(let i=0;i<this.residents.length;i++){
   const u=reduced?.5:(Math.sin(time*.12+i*3)+1)/2;const t=.13+i*.43+u*.09;const rp=point(t,-3.7);
   this.residents[i].root.position.copy(rp);this.residents[i].root.rotation.y=Math.cos(time*.12+i*3)>0?0:Math.PI;
   this.residents[i].update(dt,reduced?0:.6,time+i,reduced);
  }
  const rail=this.train.userData.rail as T.CatmullRomCurve3;const t=reduced?.5:(time*.009)%1;this.train.position.copy(rail.getPoint(t));const tangent=rail.getTangent(t);this.train.rotation.y=Math.atan2(tangent.x,tangent.z);
 }
 reset(){this.awake=0;this.miraT=.43;this.update(0,0,false,true)}
}
