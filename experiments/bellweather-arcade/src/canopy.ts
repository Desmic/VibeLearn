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

// View-space position of the player's chest, updated by the game each frame.
export const CANOPY_FOCUS={value:new T.Vector3(0,0,-.001)};
/** 1 while a fixed shot (cutscene, puzzle view) is on: posts and trunks within ~3 m of the lens step aside entirely */
export const SIGHT_SHOT={value:0};
export function canopyMaterial(pink:boolean){
  const texture=pink?blossomTexture():leafAtlas();
  const material=new T.MeshStandardMaterial({map:texture,alphaTest:.43,roughness:1,side:T.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.uniforms.vlFocusView=CANOPY_FOCUS;
    // Leaves near the camera, or on the sight line to Zip, shrink to nothing in
    // the vertex shader. Culling per card (not per pixel) matters on phones: a
    // camera inside a crown otherwise shades dozens of full-screen cards that a
    // fragment dither would mostly discard, which cost ~120 ms a frame on the F15.
    shader.vertexShader='uniform vec3 vlFocusView;\n'+shader.vertexShader.replace('#include <project_vertex>',`
      #ifdef USE_INSTANCING
        vec3 cardCentre = (modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      #else
        vec3 cardCentre = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      #endif
      float cardAlong = clamp(dot(cardCentre, vlFocusView) / max(dot(vlFocusView, vlFocusView), 1e-4), 0.0, 1.0);
      float cardSight = length(cardCentre - vlFocusView * cardAlong);
      float cardKeep = smoothstep(2.0, 3.6, length(cardCentre)) * mix(1.0, smoothstep(0.6, 1.5, cardSight), step(cardAlong, 0.97));
      transformed *= cardKeep;
      #include <project_vertex>
    `);
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
  };
  material.customProgramCacheKey=()=> 'painted-canopy-normal-v3';
  const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:texture,alphaTest:.43,side:T.DoubleSide});
  return {material,depth};
}

// Clear sight to Zip for any material (lobed crowns, shrubs, trunks, posts):
// things right by the lens, or on the line from the camera to Zip, get out of
// the way. 'shrink' collapses each instance around its own centre in the vertex
// shader (cheapest; for instanced lobes). 'dither' screen-door fades pixels (for
// single meshes like merged trunks). Both read CANOPY_FOCUS, like the leaf cards.
export function clearSight<M extends T.Material>(material: M, mode: 'shrink' | 'dither', o: { near?: [number, number]; side?: [number, number] } = {}) {
  const [n0, n1] = o.near ?? (mode === 'shrink' ? [1.4, 3.0] : [.5, 1.5]), [s0, s1] = o.side ?? (mode === 'shrink' ? [.7, 1.7] : [.25, .8]);
  const f = (x: number) => x.toFixed(3);
  const prev = material.onBeforeCompile.bind(material), hadOwn = material.onBeforeCompile !== T.Material.prototype.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    if (hadOwn) prev(shader, renderer);
    shader.uniforms.vlFocusView = CANOPY_FOCUS; shader.uniforms.vlShot = SIGHT_SHOT;
    if (mode === 'shrink') {
      shader.vertexShader = 'uniform vec3 vlFocusView;\n' + shader.vertexShader.replace('#include <project_vertex>', `
        #ifdef USE_INSTANCING
          vec3 vlC = (modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #else
          vec3 vlC = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif
        float vlA = clamp(dot(vlC, vlFocusView) / max(dot(vlFocusView, vlFocusView), 1e-4), 0.0, 1.0);
        float vlS = length(vlC - vlFocusView * vlA);
        transformed *= smoothstep(${f(n0)}, ${f(n1)}, length(vlC)) * mix(1.0, smoothstep(${f(s0)}, ${f(s1)}, vlS), step(vlA, 0.97));
        #include <project_vertex>`);
    } else {
      shader.vertexShader = 'varying vec3 vlView;\n' + shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vlView = mvPosition.xyz;');
      shader.fragmentShader = 'uniform vec3 vlFocusView;\nuniform float vlShot;\nvarying vec3 vlView;\n' + shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        float vlA = clamp(dot(vlView, vlFocusView) / max(dot(vlFocusView, vlFocusView), 1e-4), 0.0, 1.0);
        float vlS = length(vlView - vlFocusView * vlA);
        float vlKeep = smoothstep(${f(n0)}, ${f(n1)}, length(vlView)) * mix(1.0, smoothstep(${f(s0)}, ${f(s1)}, vlS), step(vlA, 0.95));
        vlKeep *= mix(1.0, smoothstep(3.0, 3.5, -vlView.z), vlShot);
        vec2 vlP = mod(floor(gl_FragCoord.xy), 4.0);
        float vlB = mod(vlP.x * 4.0 + vlP.y * 9.0 + vlP.x * vlP.y * 3.0, 16.0) / 16.0 + 0.03;
        if (vlKeep < vlB) discard;`);
    }
  };
  const key = material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey = () => key() + '|vl-sight-' + mode + n0 + s0;
  return material;
}
