import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Original proportion/material study. Static pose, not a rig or a gait system.
// Parts remain authored separately here; merge only for this static runtime.
export function buildCourierZip(){
  const root=new T.Group();root.name='Zip — courier silhouette study';
  const ivory=new T.MeshStandardMaterial({color:'#eee6ce',roughness:.38,metalness:.12});
  const mineral=new T.MeshStandardMaterial({color:'#8daead',roughness:.48,metalness:.25});
  const dark=new T.MeshStandardMaterial({color:'#192f46',roughness:.42,metalness:.45});
  const gold=new T.MeshStandardMaterial({color:'#c29660',roughness:.37,metalness:.65});
  const glass=new T.MeshPhysicalMaterial({color:'#103a49',roughness:.22,metalness:.18,clearcoat:.8});
  const light=new T.MeshStandardMaterial({color:'#b5ece2',emissive:'#68d4ca',emissiveIntensity:.6,roughness:.3});
  const cloth=new T.MeshStandardMaterial({color:'#df742e',roughness:.95,side:T.DoubleSide});
  const buckets=new Map<T.Material,T.BufferGeometry[]>();
  const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
  function part(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,rx=0,ry=0,rz=0){
    g.applyMatrix4(new T.Matrix4().compose(v(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),v(1,1,1)));
    const flat=g.index?g.toNonIndexed():g;
    if(flat!==g)g.dispose();
    // Normalize attributes before merging different primitive families.
    for(const name of Object.keys(flat.attributes))if(!['position','normal','uv'].includes(name))flat.deleteAttribute(name);
    flat.clearGroups();const list=buckets.get(m)??[];list.push(flat);buckets.set(m,list);
  }
  function box(w:number,h:number,d:number,r:number,m:T.Material,x:number,y:number,z:number,rz=0){
    part(new RoundedBoxGeometry(w,h,d,2,r),m,x,y,z,0,0,rz);
  }
  function plate(points:[number,number][],depth:number,bevel:number,m:T.Material,x:number,y:number,z:number,rz=0){
    const shape=new T.Shape(points.map(([a,b])=>new T.Vector2(a,b)));
    const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3});
    g.translate(0,0,-depth/2);part(g,m,x,y,z,0,0,rz);
  }
  function bone(a:T.Vector3,b:T.Vector3,r:number,m:T.Material){
    const direction=b.clone().sub(a),mid=a.clone().lerp(b,.5);
    const g=new T.CylinderGeometry(r,r*.88,direction.length(),12);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(v(0,1,0),direction.normalize()));
    part(g,m,mid.x,mid.y,mid.z);
  }
  function axle(x:number,y:number,z:number,r:number){
    part(new T.CylinderGeometry(r,r,.115,16),dark,x,y,z,0,0,Math.PI/2);
    part(new T.CylinderGeometry(r*.68,r*.68,.122,16),gold,x,y,z,0,0,Math.PI/2);
  }
  // A longer leg/compact chest relationship keeps the figure nimble at play scale.
  box(.29,.15,.235,.035,dark,0,.72,0);
  bone(v(0,.77,0),v(0,.95,0),.095,gold);
  plate([[-.16,-.18],[.13,-.18],[.205,.08],[.13,.22],[-.16,.20],[-.21,.06]],.255,.04,ivory,0,1.06,0);
  box(.21,.25,.065,.025,dark,0,1.055,.162);
  box(.11,.18,.032,.015,mineral,0,1.065,.205);
  for(const y of [1.025,1.08,1.135])box(.075,.012,.014,.004,gold,0,y,.226);
  // Small offset chest inset: a focal accent, not an unexplained giant glowing core.
  box(.09,.09,.025,.022,dark,-.085,1.13,-.166);
  box(.045,.045,.012,.014,light,-.085,1.13,-.182);
  bone(v(0,1.22,0),v(0,1.34,0),.066,dark);
  // Rounded continuous helmet with a narrower face and a real wraparound seam.
  box(.49,.42,.375,.10,ivory,0,1.52,0);
  box(.425,.31,.038,.07,dark,0,1.51,-.185);
  box(.382,.265,.024,.065,glass,0,1.517,-.210);
  box(.32,.17,.035,.035,mineral,0,1.52,.188);
  box(.19,.022,.012,.006,dark,0,1.48,.209);
  for(const side of [-1,1]){
    // Receiver blades have a broad root and swept tip, with dark inlay.
    plate([[-.035,-.07],[.045,-.04],[.065,.25],[-.035,.21]],.085,.012,ivory,side*.18,1.73,.025,-side*.28);
    plate([[-.015,0],[.022,0],[.026,.15],[-.012,.13]],.012,.004,mineral,side*.18,1.76,-.033,-side*.28);
    part(new T.CylinderGeometry(.088,.088,.042,24),dark,side*.252,1.51,0,0,0,Math.PI/2);
    part(new T.CylinderGeometry(.061,.061,.046,24),light,side*.259,1.51,0,0,0,Math.PI/2);
    part(new T.TorusGeometry(.070,.010,6,24),gold,side*.279,1.51,0,0,Math.PI/2);
    box(.023,.065,.012,.011,light,side*.085,1.53,-.227,-side*.12);
    axle(side*.229,1.17,0,.065);
    bone(v(side*.255,1.13,0),v(side*.292,.93,.015),.039,dark);
    box(.095,.15,.14,.035,mineral,side*.258,1.08,0,side*.16);
    axle(side*.29,.9,.015,.05);
    box(.095,.19,.12,.035,ivory,side*.285,.795,-.007,-side*.09);
    box(.09,.105,.105,.025,dark,side*.275,.655,-.017);
    bone(v(side*.097,.67,0),v(side*.12,.405,.01),.044,dark);
    box(.105,.20,.12,.028,mineral,side*.11,.56,.01,-side*.06);
    axle(side*.12,.395,.005,.055);
    box(.103,.22,.115,.027,ivory,side*.132,.245,.01,-side*.04);
    bone(v(side*.135,.2,0),v(side*.14,.085,0),.035,dark);
    box(.146,.10,.26,.025,dark,side*.14,.065,-.057);
    box(.14,.028,.25,.01,gold,side*.14,.024,-.06);
    box(.12,.032,.115,.013,ivory,side*.14,.118,-.098);
  }
  // Collar folds and a draped ribbon give the silhouette a warm asymmetric mass.
  part(new T.TorusGeometry(.12,.041,8,24),cloth,0,1.285,0,Math.PI/2);
  box(.115,.09,.12,.028,cloth,-.13,1.27,.09,-.22);
  const centers=[v(-.13,1.29,.11),v(-.20,1.18,.22),v(-.27,1.01,.28),v(-.32,.82,.30),v(-.43,.66,.29),v(-.47,.62,.265)];
  const widths=[.075,.09,.085,.078,.063,.01];
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  centers.forEach((p,i)=>{
    for(const [j,t] of [-1,0,1].entries()){
      positions.push(p.x+t*widths[i],p.y-t*.015,p.z+(t===0?.02:0));uvs.push(j/2,i/(centers.length-1));
    }
    if(i<centers.length-1)for(let j=0;j<2;j++){const a=i*3+j;indices.push(a,a+3,a+1,a+1,a+3,a+4)}
  });
  const ribbon=new T.BufferGeometry();ribbon.setAttribute('position',new T.Float32BufferAttribute(positions,3));ribbon.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));ribbon.setIndex(indices);ribbon.computeVertexNormals();part(ribbon,cloth,0,0,0);
  for(const [material,parts] of buckets){
    const geometry=mergeGeometries(parts,false);
    if(!geometry)throw new Error('Courier geometry attributes do not match');
    // Rounded primitives can collapse triangles at their seams. Drop only those
    // faces, preserving every retained position, UV and normal unchanged.
    const positions=geometry.getAttribute('position'),faces:number[]=[];
    const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
    for(let i=0;i<positions.count;i+=3){
      a.fromBufferAttribute(positions,i);b.fromBufferAttribute(positions,i+1);c.fromBufferAttribute(positions,i+2);
      if(b.sub(a).cross(c.sub(a)).lengthSq()>1e-18)faces.push(i,i+1,i+2);
    }
    geometry.setIndex(faces);
    const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
    for(const g of parts)g.dispose();
  }
  return root;
}
