import * as T from 'three';
import { leafAtlas, cellUv, LEAF_CELL } from './vendor/leafAtlas';
import { mulberry32, range } from './vendor/rng';

let blossom:T.CanvasTexture|undefined;
function blossomTexture(){
  if(blossom)return blossom;
  const cv=document.createElement('canvas');cv.width=cv.height=512;const c=cv.getContext('2d')!,r=mulberry32(591);
  // Rounded five-petal blossoms form small sprays; the crown is not pink leaves.
  for(let i=0;i<44;i++){
    const a=i*2.399,rad=Math.sqrt(r())*164,x=256+Math.cos(a)*rad,y=264+Math.sin(a)*rad*.8,size=range(r,12,25);
    const tone=Math.floor(range(r,171,255));
    for(let k=0;k<5;k++){
      const t=k*Math.PI*2/5+a;c.save();c.translate(x+Math.cos(t)*size*.50,y+Math.sin(t)*size*.50);c.rotate(t);
      c.fillStyle=`rgb(${tone},${tone},${tone})`;c.beginPath();c.ellipse(0,0,size*.60,size*.44,0,0,Math.PI*2);c.fill();c.restore();
    }
    c.fillStyle='rgb(150,150,150)';c.beginPath();c.arc(x,y,size*.15,0,Math.PI*2);c.fill();
  }
  blossom=new T.CanvasTexture(cv);blossom.colorSpace=T.NoColorSpace;blossom.anisotropy=4;return blossom;
}

export function canopyGeometry(pink:boolean,count:number){
  const g=new T.PlaneGeometry(1.15,1.15);g.translate(0,.45,0);
  if(!pink){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const q=cellUv(LEAF_CELL.small,uv.getX(i),uv.getY(i));uv.setXY(i,...q)}}
  g.setAttribute('canopyNormal',new T.InstancedBufferAttribute(new Float32Array(count*3),3));
  return g;
}

export function canopyMaterial(pink:boolean){
  const texture=pink?blossomTexture():leafAtlas();
  const material=new T.MeshStandardMaterial({map:texture,alphaTest:.43,roughness:1,side:T.DoubleSide});
  material.onBeforeCompile=shader=>{
    // Coherent outward normals remove the flashing black/white facets caused by
    // randomly oriented planes. Normals follow the crown, not the viewing camera.
    shader.vertexShader='attribute vec3 canopyNormal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <defaultnormal_vertex>',`#include <defaultnormal_vertex>
      transformedNormal = normalize(normalMatrix * canopyNormal);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec4 paintedLeaf = texture2D(map, vMapUv);
      diffuseColor.rgb *= mix(0.68, 1.0, paintedLeaf.r);
      diffuseColor.a *= paintedLeaf.a;
    `);
    // Both sides share the same crown normal; back-face flips recreate the
    // original card pattern. Shadow depth still uses the exact cutout silhouette.
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',T.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;',''));
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
      float clearance = smoothstep(1.3, 3.4, length(vViewPosition));
      float threshold = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715))));
      if (clearance < threshold) discard;
    `);
  };
  material.customProgramCacheKey=()=> 'painted-canopy-normal-v1';
  const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:texture,alphaTest:.43,side:T.DoubleSide});
  return {material,depth};
}
