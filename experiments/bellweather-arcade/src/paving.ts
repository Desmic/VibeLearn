import * as T from 'three';
import { mulberry32 } from './vendor/rng';

// Low-profile, staggered mineral slabs follow the existing walkable surface.
// Bevelled borders catch the same sun as the architecture; no fake shadow decal.
export function buildPaving(parent:T.Object3D,route:T.Curve<T.Vector3>,material:T.MeshStandardMaterial,options:{rows?:number;halfWidth?:(t:number)=>number;warm?:boolean}={}){
  const positions:number[]=[],colors:number[]=[],uvs:number[]=[],indices:number[]=[],r=mulberry32(661);
  const point=(t:number,side:number)=>{
    const p=route.getPoint(t),tangent=route.getTangent(t).normalize(),half=options.halfWidth?options.halfWidth(t):t>.87?3.55:3.2+Math.sin(t*Math.PI)*.18;
    return p.add(new T.Vector3(-tangent.z,0,tangent.x).multiplyScalar(side*(half-.6)));
  };
  const count=options.rows??36;
  for(let col=0;col<3;col++)for(let row=-1;row<count;row++){
    const offset=col%2?.5:0,t0=Math.max(0,(row+offset)/count),t1=Math.min(1,(row+1+offset)/count);
    if(t1<=t0)continue;
    const a=-1+col*2/3+.009,b=-1+(col+1)*2/3-.009;
    const outer=[point(t0+.00035,a),point(t0+.00035,b),point(t1-.00035,b),point(t1-.00035,a)];
    const centre=outer.reduce((a,p)=>a.add(p),new T.Vector3()).multiplyScalar(.25);
    const shade=options.warm?new T.Color(['#edcf9e','#f4dbb6','#e9c797','#efdab6'][Math.floor(r()*4)]):new T.Color().setHSL(.108+(r()-.5)*.014,.23+r()*.06,.64+r()*.20),start=positions.length/3;
    for(let layer=0;layer<2;layer++)for(const p of outer){
      const q=layer?p.clone().lerp(centre,.015):p;positions.push(q.x,layer?.132:.112,q.z);
      uvs.push(q.x*.35,q.z*.35);const c=shade.clone().multiplyScalar(layer?1:.89);colors.push(c.r,c.g,c.b);
    }
    indices.push(start+4,start+5,start+6,start+4,start+6,start+7);
    for(let i=0;i<4;i++){const j=(i+1)%4;indices.push(start+i,start+j,start+i+4,start+j,start+j+4,start+i+4)}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const m=material.clone();m.vertexColors=true;m.color.set(options.warm?'#ffffff':'#d8c2a0');
  const paving=new T.Mesh(geometry,m);paving.receiveShadow=true;parent.add(paving);return paving;
}
