import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { prep, M, beam, merge } from './vendor/summer-cycle/world/geo';
import { uber } from './vendor/summer-cycle/render/materials';
import { onLayers, LAYER_SHADOW, LAYER_REFLECT } from './vendor/summer-cycle/render/lightpasses';

const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
function shell(w:number,h:number,d:number,c:string,r=.07,mat:number=M.plain){return prep(new RoundedBoxGeometry(w,h,d,2,r),c,mat)}
function mesh(g:T.BufferGeometry,parent:T.Object3D,x=0,y=0,z=0){const m=new T.Mesh(g,uber(13,.72));m.position.set(x,y,z);parent.add(m);return m}
function panel(points:number[][],depth:number,color:string){const s=new T.Shape();points.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,steps:1});g.translate(0,0,-depth/2);return prep(g,color,M.plain)}

/** Original articulated shapes. No imported character, rig or upstream rider. */
export class Citizen{
 root=new T.Group(); head=new T.Group(); arms:T.Group[]=[]; legs:T.Group[]=[]; shins:T.Group[]=[]; scarf=new T.Group();
 stride=0; walking=0;
 constructor(public identity:'zip'|'mira'|'resident',accent='#e9a45f'){
  const ivory=identity==='mira'?'#a5d7d0':'#f3eee0',dark='#253c52';
  mesh(shell(.38,.25,.27,dark),this.root,0,1.04,0);
  const chest=panel([[-.23,.12],[-.26,.53],[-.17,.69],[.17,.69],[.26,.53],[.23,.12]],.28,ivory);mesh(chest,this.root,0,1.06,0);
  mesh(shell(.13,.35,.018,accent,.02),this.root,-.105,1.48,-.155);
  mesh(shell(.07,.23,.028,dark,.015),this.root,.12,1.45,-.162);
  mesh(prep(new T.CylinderGeometry(.075,.085,.15,10),dark,M.metal),this.root,0,1.82,0);
  this.head.position.y=2.02;this.root.add(this.head);
  mesh(shell(.41,.42,.4,ivory,.10),this.head);
  mesh(shell(.345,.205,.085,dark,.075),this.head,0,.015,-.191);
  const eyes=identity==='mira'?'#ffdc9e':'#88e7e6';
  for(const x of [-.095,.095])mesh(prep(new T.SphereGeometry(.045,10,8),eyes,M.plain),this.head,x,.025,-.238);
  mesh(shell(.07,.018,.02,'#baf3e7',.006),this.head,0,-.061,-.239);
  // Folded asymmetric crest gives Zip a recognisable silhouette at normal play distance.
  if(identity==='zip'){
   mesh(panel([[-.19,.12],[-.3,.52],[-.09,.38],[-.045,.17]],.09,ivory),this.head);
   mesh(panel([[.14,.12],[.25,.37],[.06,.27],[.025,.13]],.07,dark),this.head);
  }else{
   mesh(shell(.48,.095,.43,accent,.04),this.head,0,.15,0);
   mesh(prep(new T.TorusGeometry(.24,.019,5,24,Math.PI),accent,M.metal),this.head,0,.10,.02).rotation.z=Math.PI/2;
  }
  for(const side of [-1,1]){
   const arm=new T.Group();arm.position.set(side*.305,1.68,0);this.root.add(arm);this.arms.push(arm);
   mesh(prep(new T.SphereGeometry(.105,10,8),dark,M.metal),arm);
   mesh(shell(.15,.35,.17,ivory,.045),arm,side*.028,-.22,0);
   mesh(prep(new T.SphereGeometry(.075,8,6),dark,M.metal),arm,side*.035,-.43,0);
   mesh(shell(.135,.36,.16,ivory,.04),arm,side*.035,-.64,-.005);
   mesh(shell(.13,.16,.10,dark,.04),arm,side*.035,-.88,-.015);
   const leg=new T.Group();leg.position.set(side*.13,1.01,0);this.root.add(leg);this.legs.push(leg);
   mesh(prep(new T.SphereGeometry(.095,10,8),dark,M.metal),leg);
   mesh(shell(.18,.39,.20,ivory,.055),leg,0,-.235,0);
   const shin=new T.Group();shin.position.y=-.48;leg.add(shin);this.shins.push(shin);
   mesh(prep(new T.SphereGeometry(.077,10,8),dark,M.metal),shin);
   mesh(shell(.145,.37,.155,ivory,.04),shin,0,-.20,.018);
   mesh(shell(.21,.125,.35,dark,.04),shin,0,-.458,-.065);
   mesh(shell(.20,.075,.24,ivory,.035),shin,0,-.43,-.10);
  }
  this.scarf.position.set(0,1.79,0);this.root.add(this.scarf);
  mesh(prep(new T.CylinderGeometry(.18,.19,.11,12),accent,M.cloth),this.scarf);
  const tail=panel([[-.17,0],[.12,0],[.13,-.38],[-.03,-.84],[-.17,-.65]],.013,accent);mesh(tail,this.scarf,0,-.03,.24).rotation.x=-.23;
  if(identity==='mira'){
   const coat=panel([[-.25,0],[.25,0],[.34,-.62],[.07,-.72],[-.26,-.57]],.025,'#376c7a');mesh(coat,this.root,0,1.24,.18);
  }
  onLayers(this.root,LAYER_SHADOW,LAYER_REFLECT);
 }
 update(dt:number,speed:number,time:number,reduced:boolean){
  this.walking=T.MathUtils.damp(this.walking,speed>.05?1:0,12,dt);this.stride+=dt*speed*2.4;
  const a=reduced?0:this.walking;
  for(let i=0;i<2;i++){
   const p=this.stride+i*Math.PI;this.legs[i].rotation.x=Math.sin(p)*.39*a;
   this.shins[i].rotation.x=-Math.max(0,Math.cos(p))*.34*a;
   this.arms[i].rotation.x=-Math.sin(p)*.25*a;
  }
  this.scarf.rotation.x=reduced?0:Math.sin(time*1.7)*.025+this.walking*.09;
  this.head.rotation.y=reduced?0:Math.sin(time*.42)*.045;
 }
}

/** Small distant silhouettes merge into one draw and never become near hero assets. */
export function distantPeople(points:{x:number;y:number;z:number;angle:number;color:string}[]){
 const geos:T.BufferGeometry[]=[];
 for(const p of points){
  const body=prep(new T.CylinderGeometry(.19,.32,1.12,5),p.color,M.cloth);body.translate(0,1.02,0);
  const head=prep(new T.SphereGeometry(.15,7,5),'#d3ccb7',M.plain);head.translate(0,1.75,0);
  const legs=[-.10,.10].map(x=>beam(V(x,0,0),V(x,.65,0),.055,'#334753',M.plain,5));
  const g=merge([body,head,...legs]);g.rotateY(p.angle);g.translate(p.x,p.y,p.z);geos.push(g);
 }
 const m=new T.Mesh(merge(geos),uber(13,.5));onLayers(m,LAYER_REFLECT);return m;
}
