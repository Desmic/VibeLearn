import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Mira has a distinct silhouette, colour and role. This small rig reuses the
// articulated-body relationships proven in the earlier scene, not its renderer.
export function buildMira(){
  const root=new T.Group(),head=new T.Group(),arms:T.Group[]=[],legs:T.Group[]=[];
  const shell=new T.MeshStandardMaterial({color:'#9dc6c1',roughness:.63,metalness:.1});
  const dark=new T.MeshStandardMaterial({color:'#173c50',roughness:.78});
  const cloth=new T.MeshStandardMaterial({color:'#d59548',roughness:.9,side:T.DoubleSide});
  const face=new T.MeshPhysicalMaterial({color:'#102b3a',roughness:.24,clearcoat:1});
  const light=new T.MeshBasicMaterial({color:'#ffe0a1'});
  function box(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material){const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.16),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
  box(root,0,1.03,0,.43,.63,.30,shell);box(root,0,.70,0,.31,.19,.25,dark);
  const coat=new T.Mesh(new T.CylinderGeometry(.24,.39,.58,7,1,true),dark);coat.position.y=.82;coat.scale.z=.7;coat.castShadow=true;root.add(coat);
  head.position.y=1.54;root.add(head);box(head,0,0,0,.43,.39,.35,shell);box(head,0,0,-.18,.35,.19,.05,face);
  for(const side of [-1,1])box(head,side*.087,.01,-.219,.036,.035,.02,light);
  const brim=new T.Mesh(new T.CylinderGeometry(.38,.37,.045,32),cloth);brim.position.y=.21;head.add(brim);
  const cap=new T.Mesh(new T.SphereGeometry(.24,20,10,0,Math.PI*2,0,Math.PI/2),cloth);cap.position.y=.22;cap.scale.y=.65;head.add(cap);
  box(root,0,1.35,0,.34,.09,.34,cloth);
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.29,1.26,0);root.add(arm);arms.push(arm);
    box(arm,0,-.18,0,.12,.35,.14,shell);box(arm,0,-.42,-.025,.13,.16,.14,dark);
    const leg=new T.Group();leg.position.set(side*.12,.68,0);root.add(leg);legs.push(leg);
    box(leg,0,-.27,0,.14,.5,.17,shell);box(leg,0,-.57,-.075,.19,.13,.31,dark);
  }
  function animate(t:number,speed:number,reduced:boolean){
    for(let i=0;i<2;i++){legs[i].rotation.x=reduced?0:Math.sin(t*9+i*Math.PI)*.32*speed;arms[i].rotation.x=reduced?0:-Math.sin(t*9+i*Math.PI)*.25*speed}
    head.rotation.y=reduced?0:Math.sin(t*.55)*.045;
  }
  return {root,animate};
}
