import * as T from 'three';

// Original articulated silhouette for this proof scene. The movement controller
// owns the returned root; visual construction has no gameplay or learning state.
export function buildZip(){
  const root=new T.Group();
  const shell=new T.MeshStandardMaterial({color:'#f5e9d4',roughness:.52,metalness:.13});
  const ceramic=new T.MeshStandardMaterial({color:'#d1d9d5',roughness:.6,metalness:.08});
  const frame=new T.MeshStandardMaterial({color:'#182e40',roughness:.44,metalness:.4});
  const brass=new T.MeshStandardMaterial({color:'#bd8a53',roughness:.4,metalness:.55});
  const glass=new T.MeshPhysicalMaterial({color:'#0e2938',roughness:.2,metalness:.2,clearcoat:1});
  const cyan=new T.MeshBasicMaterial({color:'#8ee3df'});
  const scarf=new T.MeshStandardMaterial({color:'#e79837',roughness:.92,side:T.DoubleSide});
  const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
  function solid(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number){
    const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
  function plate(points:[number,number][],depth:number,m:T.Material,x:number,y:number,z:number,bevel=.02){
    const shape=new T.Shape(points.map(([a,b])=>new T.Vector2(a,b)));
    const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});
    g.translate(0,0,-depth/2);return solid(g,m,x,y,z);
  }
  function strut(a:T.Vector3,b:T.Vector3,radius:number,m:T.Material){
    const d=b.clone().sub(a),mid=a.clone().lerp(b,.5);
    const part=solid(new T.CylinderGeometry(radius,radius*.83,d.length(),10),m,mid.x,mid.y,mid.z);
    part.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());return part;
  }
  function joint(x:number,y:number,z:number,r=.07){return solid(new T.SphereGeometry(r,12,8),brass,x,y,z)}
  plate([[-.20,-.23],[.19,-.23],[.24,.13],[.15,.24],[-.15,.24],[-.25,.11]],.29,shell,0,.88,0);
  plate([[-.12,-.16],[.12,-.16],[.15,.16],[-.15,.16]],.015,frame,0,.89,.16,.007);
  for(const y of [.82,.89,.96])solid(new T.BoxGeometry(.19,.021,.023),brass,0,y,.184);
  plate([[-.17,-.07],[.17,-.07],[.12,.08],[-.12,.08]],.25,frame,0,.57,0);
  strut(v(0,1.08,0),v(0,1.22,0),.07,brass);

  // Chisel-cut helmet, two integrated receiver fins and a recessed face plate.
  plate([[-.25,-.15],[.16,-.21],[.30,-.02],[.27,.22],[.04,.32],[-.24,.22],[-.32,.03]],.39,shell,0,1.40,0,.035);
  plate([[-.23,-.09],[.14,-.15],[.24,-.01],[.19,.16],[-.15,.20],[-.26,.06]],.018,glass,0,1.40,-.235,.012);
  for(const side of [-1,1]){
    const fin=plate([[0,-.02],[side*.13,.07],[side*.25,.43],[side*.03,.31]],.115,shell,side*.13,1.57,.09,.013);
    fin.rotation.z=-side*.13;
    const core=solid(new T.CylinderGeometry(.111,.111,.05,24),frame,side*.30,1.43,.03);core.rotation.z=Math.PI/2;
    const ring=solid(new T.TorusGeometry(.077,.011,5,24),cyan,side*.332,1.43,.03);ring.rotation.y=Math.PI/2;
    const eye=solid(new T.CapsuleGeometry(.022,.05,4,8),cyan,side*.103,1.44,-.266);eye.rotation.z=side*.16;
  }
  for(const side of [-1,1]){
    joint(side*.255,1.04,0);
    strut(v(side*.27,1.02,0),v(side*.32,.78,.01),.055,frame);
    plate([[-.048,-.12],[.055,-.1],[.055,.11],[-.065,.12]],.12,ceramic,side*.29,.91,.015,.013);
    joint(side*.32,.74,.015,.06);
    strut(v(side*.32,.72,.015),v(side*.30,.55,-.025),.06,shell);
    plate([[-.06,-.075],[.05,-.075],[.07,.06],[-.05,.07]],.11,frame,side*.30,.49,-.025,.016);
    strut(v(side*.105,.53,0),v(side*.13,.32,.015),.06,frame);
    joint(side*.13,.30,.01,.065);
    plate([[-.055,-.1],[.06,-.1],[.065,.1],[-.055,.1]],.12,shell,side*.14,.205,.01,.014);
    plate([[-.08,-.045],[.085,-.045],[.09,.035],[-.065,.07]],.32,frame,side*.14,.065,-.064,.017);
    solid(new T.BoxGeometry(.15,.025,.23),brass,side*.14,.033,-.07);
  }
  const collar=solid(new T.TorusGeometry(.145,.045,6,18),scarf,0,1.13,0);collar.rotation.x=Math.PI/2;
  // A shaped resting ribbon follows the body instead of a flat triangular flag.
  const points=[v(.04,1.15,.1),v(.18,1.08,.28),v(.36,.91,.42),v(.47,.64,.55),v(.58,.52,.60)];
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let i=0;i<points.length;i++){
    const width=i===4?.07:.11;
    vertices.push(points[i].x-width,points[i].y,points[i].z,points[i].x+width,points[i].y-.02,points[i].z);
    uv.push(0,i/4,1,i/4);if(i<4){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}
  }
  const ribbon=new T.BufferGeometry();ribbon.setAttribute('position',new T.Float32BufferAttribute(vertices,3));ribbon.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ribbon.setIndex(indices);ribbon.computeVertexNormals();solid(ribbon,scarf,0,0,0);
  return root;
}
