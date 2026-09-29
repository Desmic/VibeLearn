import * as T from 'three';

// Local pigment and shade-family control on physically lit surfaces. Pattern is
// attached to world geometry and responds to real direct light/cast shadows;
// it is not an overlay applied to the whole image or to vegetation/skin/glass.
export function graphicMineral(material:T.MeshStandardMaterial,strength=.13){
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 pigmentPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      pigmentPosition = (modelMatrix * vec4(position, 1.)).xyz;
    `);
    shader.fragmentShader=`varying vec3 pigmentPosition;
      float pigmentHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
      float pigmentNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(pigmentHash(i),pigmentHash(i+vec3(1,0,0)),f.x),mix(pigmentHash(i+vec3(0,1,0)),pigmentHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(pigmentHash(i+vec3(0,0,1)),pigmentHash(i+vec3(1,0,1)),f.x),mix(pigmentHash(i+vec3(0,1,1)),pigmentHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      \n`+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float wash=pigmentNoise(pigmentPosition*vec3(3.2,12.,3.2));
      float grain=pigmentNoise(pigmentPosition*48.);
      diffuseColor.rgb *= 1.0-${strength.toFixed(3)}*(.65*wash+.35*grain);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',`
      vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
      float litRatio=length(reflectedLight.directDiffuse)/(length(totalDiffuse)+.001);
      vec3 shadeFamily=mix(vec3(.69,.82,1.20),vec3(1.035,1.,.93),smoothstep(.06,.54,litRatio));
      outgoingLight *= shadeFamily;
    `);
  };
  material.customProgramCacheKey=()=>`graphic-mineral-v1-${strength}`;
  return material;
}
