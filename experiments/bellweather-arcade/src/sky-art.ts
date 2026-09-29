import * as T from 'three';
import { mulberry32 } from './vendor/rng';

export function buildOrbitalSky(parent:T.Object3D){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const c=canvas.getContext('2d')!,data=c.createImageData(1024,512),r=mulberry32(493);
  const offsets=Array.from({length:6},()=>r()*20);
  for(let y=0;y<512;y++)for(let x=0;x<1024;x++){
    const u=x/1024*Math.PI*2,v=y/512*Math.PI;
    let n=0;for(let k=0;k<6;k++){const f=2**k;n+=Math.sin(u*f+Math.sin(v*f*1.8+offsets[k])*1.7+offsets[k])*Math.cos(v*f*1.3+offsets[k])/(f**.65)}
    const land=T.MathUtils.smoothstep(n,-.06,.13),cloud=T.MathUtils.smoothstep(Math.sin(v*14+Math.sin(u*4)*1.2+n),.68,.98)*.45;
    const index=(y*1024+x)*4;
    for(let j=0;j<3;j++){const a=[91,136,181][j],b=[234,209,175][j];data.data[index+j]=(a+(b-a)*land)*(1-cloud)+[244,230,216][j]*cloud}
    data.data[index+3]=255;
  }
  c.putImageData(data,0,0);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const planet=new T.Mesh(new T.SphereGeometry(58,64,40),new T.MeshBasicMaterial({map:texture,color:'#d9e5ec',transparent:true,opacity:.48,depthWrite:false,fog:false}));
  planet.position.set(46,90,-246);planet.rotation.z=-.3;planet.rotation.y=1.8;parent.add(planet);
  for(let i=0;i<4;i++){
    const ring=new T.Mesh(new T.TorusGeometry(72+i*2.1,.17+(i===1?.17:0),4,144),new T.MeshBasicMaterial({color:'#fae5c2',transparent:true,opacity:i===1?.34:.19,depthWrite:false,fog:false}));
    ring.position.copy(planet.position);ring.rotation.set(1.0,.35,-.48);parent.add(ring);
  }
}
