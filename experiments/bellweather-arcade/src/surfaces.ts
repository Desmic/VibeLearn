import * as T from 'three';
import { mulberry32 } from './vendor/rng';

// Object-space surface character, not a screen filter. Scale remains a property
// of each material; porcelain, masonry, water and vegetation stay distinct.
export function mineralSurface(seed=72){
  const cv=document.createElement('canvas');cv.width=cv.height=512;const c=cv.getContext('2d')!;
  const r=mulberry32(seed);c.fillStyle='#f6f1e7';c.fillRect(0,0,512,512);
  for(let i=0;i<120;i++){
    const x=r()*512,y=r()*512,w=8+r()*70,h=4+r()*19;
    c.fillStyle=i%3?'rgba(140,123,145,.045)':'rgba(255,255,255,.17)';
    c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y-h*.25);c.lineTo(x+w*.8,y+h);c.lineTo(x-w*.2,y+h*.8);c.fill();
  }
  for(let i=0;i<15000;i++){
    const a=r()*.11;c.fillStyle=`rgba(64,85,113,${a})`;c.fillRect(r()*512,r()*512,.6+r()*1.2,.6+r()*1.2);
  }
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return tex;
}

export function sandstoneDetail(){
  const loader=new T.TextureLoader();
  const normal=loader.load('/materials/sandstone_cracks_nor_gl_1k.jpg');
  const rough=loader.load('/materials/sandstone_cracks_rough_1k.jpg');
  for(const t of [normal,rough]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2.5,1.3);t.anisotropy=4}
  return {normalMap:normal,normalScale:new T.Vector2(.17,.17),roughnessMap:rough};
}

export function waterNormals(){
  const cv=document.createElement('canvas');cv.width=cv.height=256;const c=cv.getContext('2d')!,im=c.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const u=x/256*Math.PI*2,v=y/256*Math.PI*2,i=(y*256+x)*4;
    im.data[i]=128+22*Math.sin(u*6+Math.sin(v*3));im.data[i+1]=128+18*Math.cos(v*7+Math.cos(u*2));im.data[i+2]=250;im.data[i+3]=255;
  }
  c.putImageData(im,0,0);const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(.48,.48);return tex;
}

export function plantedGround(){
  const cv=document.createElement('canvas');cv.width=cv.height=512;const c=cv.getContext('2d')!,r=mulberry32(346);
  c.fillStyle='#aeb695';c.fillRect(0,0,512,512);
  for(let i=0;i<190;i++){
    const x=r()*512,y=r()*512,size=12+r()*49;
    const g=c.createRadialGradient(x,y,1,x,y,size);
    g.addColorStop(0,i%3?'rgba(58,98,78,.18)':'rgba(223,219,155,.28)');g.addColorStop(1,'rgba(160,174,130,0)');c.fillStyle=g;c.fillRect(x-size,y-size,size*2,size*2);
  }
  for(let i=0;i<12000;i++){const x=r()*512,y=r()*512;c.strokeStyle=i%3?'rgba(36,78,59,.10)':'rgba(224,225,180,.19)';c.lineWidth=.7;c.beginPath();c.moveTo(x,y);c.lineTo(x+2-r()*4,y-1-r()*4);c.stroke()}
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(.22,.22);tex.anisotropy=4;return tex;
}
