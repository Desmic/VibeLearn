import * as T from 'three';
import { uber, surfaceBits } from './vendor/summer-cycle/render/materials';

/** Palette specialization of the pinned source's foliage lighting, without changing vendor. */
export function canopyMaterial(geometry:T.BufferGeometry,pink:boolean){
 const base=uber(6,0,T.DoubleSide,surfaceBits(geometry));if(!pink)return base;
 const result=base.clone();result.uniforms=base.uniforms;delete result.userData.uber;
 const replacements=[
  ['vec3 cCore = vec3(0.0103, 0.0423, 0.0232);','vec3 cCore = vec3(0.48, 0.105, 0.225);'],
  ['vec3 tintK = mix(vec3(1.0), clamp(vCol / cCore, 0.5, 1.8), 0.6);','vec3 tintK = vec3(1.0);'],
  ['vec3 band = vec3(0.0056, 0.0152, 0.0122) * tintK;','vec3 band = vec3(0.16, 0.045, 0.14) * tintK;'],
  ['vec3 sunC = vec3(0.078, 0.205, 0.042) * tintK','vec3 sunC = vec3(0.98, 0.46, 0.49) * tintK'],
  ['vec3(0.12, 0.25, 0.055), leafHi','vec3(1.0, 0.68, 0.59), leafHi'],
  ['vec3(0.012, 0.02, 0.008) * under','vec3(0.025, 0.012, 0.016) * under'],
  ['vec3(1.05, 1.1, 0.72), (leafVar','vec3(1.05, 0.94, 1.03), (leafVar'],
 ];
 for(const [from,to] of replacements){if(!result.fragmentShader.includes(from))throw new Error('Pinned canopy shader contract changed');result.fragmentShader=result.fragmentShader.replace(from,to)}
 return result;
}
