import * as T from 'three';

let pigmentAsset:Promise<T.Texture>|undefined;
export function loadMineralPigment(){
  if(new URLSearchParams(location.search).get('pigment')!=='painted')return Promise.resolve(undefined);
  return pigmentAsset??=new T.TextureLoader().loadAsync('/materials/ivory-pigment-v1.png').then(texture=>{
    texture.colorSpace=T.SRGBColorSpace;
    texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;
    return texture;
  });
}

// Local pigment and shade-family control on physically lit surfaces. Pattern is
// attached to world geometry and responds to real direct light/cast shadows;
// it is not an overlay applied to the whole image or to vegetation/skin/glass.
export function graphicMineral(material:T.MeshStandardMaterial,strength=.13,pigment?:T.Texture){
  material.onBeforeCompile=shader=>{
    if(pigment)shader.uniforms.mineralPigment={value:pigment};
    shader.vertexShader='varying vec3 pigmentPosition;\nvarying vec3 pigmentNormal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      pigmentPosition = (modelMatrix * vec4(position, 1.)).xyz;
      pigmentNormal = normalize(mat3(modelMatrix) * normal);
    `);
    shader.fragmentShader=`varying vec3 pigmentPosition;
      varying vec3 pigmentNormal;
      ${pigment?'uniform sampler2D mineralPigment;':''}
      float pigmentHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
      float pigmentNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(pigmentHash(i),pigmentHash(i+vec3(1,0,0)),f.x),mix(pigmentHash(i+vec3(0,1,0)),pigmentHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(pigmentHash(i+vec3(0,0,1)),pigmentHash(i+vec3(1,0,1)),f.x),mix(pigmentHash(i+vec3(0,1,1)),pigmentHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      \n`+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float wash=pigmentNoise(pigmentPosition*vec3(3.2,12.,3.2));
      float grain=pigmentNoise(pigmentPosition*48.);
      diffuseColor.rgb *= 1.0-${strength.toFixed(3)}*(.65*wash+.35*grain);
      ${pigment?`
      // Static world-space projection survives batched meshes and retains the
      // asset's original AO UVs. sRGB texture storage supplies linear samples.
      vec3 weight=pow(abs(normalize(pigmentNormal)),vec3(4.));
      weight/=max(dot(weight,vec3(1.)),.001);
      vec3 p=pigmentPosition*.42;
      vec3 paint=texture2D(mineralPigment,p.yz).rgb*weight.x
                +texture2D(mineralPigment,p.xz).rgb*weight.y
                +texture2D(mineralPigment,p.xy).rgb*weight.z;
      diffuseColor.rgb *= mix(vec3(1.),clamp(paint/vec3(.80,.75,.67),vec3(.35),vec3(1.3)),.78);
      `:''}
    `);
    shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',`
      vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
      float litRatio=length(reflectedLight.directDiffuse)/(length(totalDiffuse)+.001);
      vec3 shadeFamily=mix(vec3(.69,.82,1.20),vec3(1.035,1.,.93),smoothstep(.06,.54,litRatio));
      outgoingLight *= shadeFamily;
    `);
  };
  material.customProgramCacheKey=()=>`graphic-mineral-v2-${strength}-${pigment?'painted':'procedural'}`;
  return material;
}
