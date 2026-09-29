import * as T from 'three';
import { route } from './world';

export const WELL_T=.49;
export const WELL=route.getPoint(WELL_T);
export const MEETING=route.getPoint(.95);

/** Scene-specific staging. Encounter facts and explicit actions live outside it. */
export function buildLightwell(scene:T.Scene){
  const root=new T.Group();scene.add(root);
  const stone=new T.MeshStandardMaterial({color:'#e8d7b0',roughness:.79});
  const blue=new T.MeshStandardMaterial({color:'#17485e',roughness:.53,metalness:.16});
  const metal=new T.MeshStandardMaterial({color:'#cf9e4c',roughness:.35,metalness:.6});
  const light=new T.MeshStandardMaterial({color:'#428f9b',emissive:'#46ddd6',emissiveIntensity:0,roughness:.38});
  const water=new T.MeshPhysicalMaterial({color:'#279caa',roughness:.21,metalness:.08,clearcoat:.8,envMapIntensity:.18,transparent:true,opacity:.82,side:T.DoubleSide});
  const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
  function add(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,p:T.Object3D=root){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
  function pipe(points:T.Vector3[],r:number,m:T.Material){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points),60,r,7),m,0,0,0)}
  const centre=v(WELL.x+2.1,0,WELL.z-.15);
  const machine=new T.Group();machine.position.copy(centre);root.add(machine);
  add(new T.CylinderGeometry(.94,1.12,.19,36),stone,0,.2,0,machine);
  add(new T.CylinderGeometry(.63,.89,.85,8),blue,0,.68,0,machine);
  add(new T.CylinderGeometry(.89,.7,.18,36),metal,0,1.16,0,machine);
  const core=add(new T.IcosahedronGeometry(.36,1),light,0,1.60,0,machine);
  const petals:T.Group[]=[];
  for(let i=0;i<6;i++){
    const pivot=new T.Group();pivot.rotation.y=i*Math.PI/3;machine.add(pivot);
    const hinge=new T.Group();hinge.position.set(0,1.16,.45);pivot.add(hinge);petals.push(hinge);
    const s=new T.Shape();s.moveTo(-.24,0);s.quadraticCurveTo(-.36,.7,0,1.16);s.quadraticCurveTo(.36,.7,.24,0);s.closePath();
    const blade=add(new T.ExtrudeGeometry(s,{depth:.065,bevelEnabled:true,bevelSize:.018,bevelThickness:.018}),stone,0,0,0,hinge);blade.rotation.x=-.13;
    add(new T.BoxGeometry(.05,.53,.06),metal,0,.33,-.018,hinge);
  }
  // The channel physically connects the lightwell and the belvedere, so the
  // response can be followed in space without a detached objective panel.
  const channelPoints=Array.from({length:71},(_,i)=>{
    const t=WELL_T+(.96-WELL_T)*i/70,c=route.getPoint(t),d=route.getTangent(t);
    return c.add(new T.Vector3(d.z,0,-d.x).normalize().multiplyScalar(-2.63)).setY(.20);
  });
  pipe(channelPoints,.14,blue);const flow=pipe(channelPoints.map(p=>p.clone().setY(.27)),.085,light);
  const streams=new T.Group();machine.add(streams);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,points=Array.from({length:19},(_,j)=>{const t=j/18;return v(Math.sin(a)*(.14+t*.66),1.55+Math.sin(t*Math.PI)*.6-t*1.35,Math.cos(a)*(.14+t*.66))});
    const jet=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.022,4),water);streams.add(jet);
  }
  const ripples:T.Mesh[]=[];for(let i=0;i<3;i++){const r=add(new T.TorusGeometry(.56+i*.12,.012,4,40),light,0,.31,0,machine);r.rotation.x=Math.PI/2;ripples.push(r)}
  // A grounded receiver at the destination repeats the lightwell's material cue.
  const receiver=new T.Group();receiver.position.set(MEETING.x-1.9,.13,MEETING.z-.25);root.add(receiver);
  add(new T.CylinderGeometry(.29,.39,.95,8),blue,0,.5,0,receiver);
  const ring=add(new T.TorusGeometry(.3,.045,6,36),light,0,1.12,0,receiver);ring.rotation.x=Math.PI/2;
  add(new T.SphereGeometry(.16,12,8),light,0,1.22,0,receiver);
  const warm=new T.PointLight('#80ede5',0,5,2);warm.position.copy(centre).add(v(0,1.8,0));root.add(warm);
  const promptAnchor=centre.clone().add(v(0,2.25,0));
  let blend=0;
  function update(dt:number,awake:boolean,time:number,reduced:boolean){
    blend=reduced?(awake?1:0):T.MathUtils.damp(blend,awake?1:0,2.2,dt);
    for(const p of petals)p.rotation.x=-blend*1.1;
    light.emissiveIntensity=blend*1.9;warm.intensity=blend*2.5;
    core.rotation.y=reduced?0:time*.3;core.position.y=1.6+blend*.18;
    streams.visible=blend>.12;streams.scale.y=Math.max(.01,blend);
    flow.visible=blend>.15;
    for(let i=0;i<ripples.length;i++){const s=reduced?1:1+Math.sin(time*1.7+i)*.065;ripples[i].scale.setScalar(s);ripples[i].visible=awake}
  }
  return {root,promptAnchor,centre,update};
}
