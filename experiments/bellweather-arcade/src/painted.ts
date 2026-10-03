import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Optional `render=painted` look-development pass (30 Sep 2026).
// Illustrated lighting is authored in the material lighting model, not as a
// screen filter: the sun term is banded into lit/shade masses whose edges are
// broken by world-space brush strokes, shade receives a violet-blue bounce,
// surfaces carry world-anchored stroke grain, and distance takes aerial haze.
// A light post stack (bloom + grade) finishes the image. Default rendering is
// unchanged when the option is absent.

export const PAINT = {
  shadeTint: [0.40, 0.34, 0.74],   // violet-blue bounce added in shade
  litWarmth: [1.06, 1.0, 0.92],    // warm push on sunlit masses
  bandLow: 0.06, bandHigh: 0.20,   // N·L band edges (crisp terminator)
  flatten: 0.55,                   // 0 = physical falloff, 1 = flat poster planes
  strokeScale: 1.0,               // strokes per metre (lower = bigger strokes)
  grain: 0.16,                     // albedo stroke variation
  edgeBreak: 0.22,                 // how much strokes break shadow edges
};

const f = (n: number) => n.toFixed(4);
const v3 = (a: number[]) => `vec3(${a.map(f).join(',')})`;

const STROKE_GLSL = /* glsl */`
uniform sampler2D vlStrokeTex;
// Directional brush strokes from a small tiling texture, projected triplanar.
float vlStroke(vec3 p,vec3 n){
  vec3 w=pow(abs(n),vec3(4.0));w/=(w.x+w.y+w.z+1e-4);
  p*=${f(PAINT.strokeScale * 0.25)};
  return texture2D(vlStrokeTex,p.zy).r*w.x+texture2D(vlStrokeTex,p.xz).r*w.y+texture2D(vlStrokeTex,p.xy).r*w.z;
}
`;

// Tileable painted-stroke texture (original): many soft elongated dabs at a
// shared slant, wrapped across edges so the pattern repeats seamlessly.
function strokeTexture() {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, N, N);
  let seed = 9;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * N, y = rnd() * N, len = 10 + rnd() * 26, wid = 2 + rnd() * 4, v = Math.round(60 + rnd() * 140);
    g.fillStyle = `rgba(${v},${v},${v},${0.25 + rnd() * 0.35})`;
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) {
      g.save(); g.translate(x + dx, y + dy); g.rotate(-0.61 + (rnd() - 0.5) * 0.25);
      g.beginPath(); g.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.NoColorSpace;
  return t;
}

let installed = false;
export function installPaintedShading(withStrokes = true) {
  if (installed) return; installed = true;
  const C = T.ShaderChunk as unknown as Record<string, string>;
  const strokes = strokeTexture();
  const L = T.ShaderLib as unknown as Record<string, { uniforms: Record<string, T.IUniform> }>;
  for (const k of ['basic', 'lambert', 'phong', 'standard', 'physical', 'toon', 'matcap']) if (L[k]) L[k].uniforms.vlStrokeTex = { value: strokes };

  // World position for stroke placement, declared for every built-in shader.
  C.common = C.common + '\n#define VL_WORLD 1\nvarying vec3 vlWorldPos;\n' + STROKE_GLSL;
  C.project_vertex = C.project_vertex +
    '\n#ifdef VL_WORLD\nvlWorldPos = transpose(mat3(viewMatrix)) * (mvPosition.xyz - viewMatrix[3].xyz);\n#endif\n';

  // Albedo grain anchored to the world (moves with surfaces, not the screen).
  C.color_fragment = C.color_fragment + /* glsl */`
  float vlStrokeV = 0.5;
  #if defined( LAMBERT ) || defined( STANDARD ) || defined( PHONG )
  if (${withStrokes ? "true" : "false"} && distance(vlWorldPos, cameraPosition) < 90.0) {
    vlStrokeV = vlStroke(vlWorldPos, normalize(cross(dFdx(vlWorldPos), dFdy(vlWorldPos))));
    diffuseColor.rgb *= 1.0 - ${f(PAINT.grain)} + ${f(PAINT.grain * 2)} * vlStrokeV;
  }
  #endif`;

  // Sun banding with brush-broken terminator; record lit amount for shade tint.
  C.lights_fragment_begin = 'float vlLit = 1.0;\n' +
    C.lights_fragment_begin.replace(
      /(directLight\.color \*= \( directLight\.visible && receiveShadow \) \? getShadow\( directionalShadowMap\[ i \][^;]*;\s*#endif)/,
      `$1
      #if ( UNROLLED_LOOP_INDEX == 0 )
      {
        vec3 vlBase = directionalLights[ i ].color;
        float vlSh = length(directLight.color) / max(length(vlBase), 1e-4);
        float vlNL = saturate(dot(geometryNormal, directLight.direction));
        float vlJit = (vlStrokeV - 0.5) * ${f(PAINT.edgeBreak)};
        float vlLitN = smoothstep(${f(PAINT.bandLow)} + vlJit * 0.6, ${f(PAINT.bandHigh)} + vlJit * 0.6, vlNL);
        float vlLitS = smoothstep(0.30 + vlJit, 0.62 + vlJit, vlSh);
        vlLit = vlLitN * vlLitS;
        float vlFlat = mix(1.0, 0.72 / max(vlNL, 0.18), ${f(PAINT.flatten)});
        directLight.color = vlBase * vlLit * vlFlat * ${v3(PAINT.litWarmth)};
      }
      #endif`);
  if (!C.lights_fragment_begin.includes('vlLitN')) console.warn('painted: shadow hook not applied');

  // Violet-blue bounce in shade, modulated by strokes so shade reads painted.
  C.lights_fragment_end = /* glsl */`
  #if defined( RE_IndirectDiffuse )
    irradiance += ${v3(PAINT.shadeTint)} * (1.0 - vlLit) * (0.75 + 0.5 * vlStrokeV);
  #endif
  ` + C.lights_fragment_end;

  // Split-tone grade and gentle value grouping, applied per material after
  // colour-space conversion. Replaces the former full-screen post passes.
  C.colorspace_fragment = C.colorspace_fragment + /* glsl */`
  {
    vec3 vlc = gl_FragColor.rgb;
    float vll = dot(vlc, vec3(.2126,.7152,.0722));
    vlc += vec3(-.012,-.018,.035) * (1.0 - smoothstep(.0,.55,vll));
    vlc *= mix(vec3(1.0), vec3(1.035,1.0,.955), smoothstep(.45,1.0,vll));
    vlc = mix(vec3(vll), vlc, 1.14);
    vlc = clamp(vlc, 0.0, 1.0);
    gl_FragColor.rgb = mix(vlc, vlc*vlc*(3.0-2.0*vlc), .18);
  }`;

  // Aerial perspective: distance fades toward a luminous lavender-blue, with
  // extra lift near the horizon line.
  C.fog_fragment = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
    #else
      float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
    #endif
    fogFactor = pow(fogFactor, 0.85);
    vec3 vlHaze = mix(fogColor, fogColor * vec3(1.06, 1.02, 0.96), fogFactor);
    gl_FragColor.rgb = mix( gl_FragColor.rgb, vlHaze, fogFactor );
  #endif`;
}

// Painted sky: warm pale horizon rising to saturated blue, as a background texture.
export function paintedSky(): T.Texture {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const g = c.getContext('2d')!, grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, '#1f6fc4');
  grad.addColorStop(0.28, '#3f8fdc');
  grad.addColorStop(0.44, '#86bdea');
  grad.addColorStop(0.50, '#e9ecef');
  grad.addColorStop(0.53, '#f4e6d2');
  grad.addColorStop(1.00, '#c9c3dc');
  g.fillStyle = grad; g.fillRect(0, 0, 4, 512);
  const t = new T.CanvasTexture(c);
  t.mapping = T.EquirectangularReflectionMapping; t.colorSpace = T.SRGBColorSpace;
  return t;
}

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uRes: { value: new T.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: /* glsl */`
  uniform sampler2D tDiffuse;uniform vec2 uRes;varying vec2 vUv;
  vec3 sat(vec3 c,float s){float l=dot(c,vec3(.2126,.7152,.0722));return mix(vec3(l),c,s);}
  void main(){
    vec4 c=texture2D(tDiffuse,vUv);
    float l=dot(c.rgb,vec3(.2126,.7152,.0722));
    // split tone: cool violet shadows, warm highlights
    vec3 col=c.rgb;
    col+=vec3(-.012,-.018,.035)*(1.0-smoothstep(.0,.55,l));
    col*=mix(vec3(1.0),vec3(1.035,1.0,.955),smoothstep(.45,1.0,l));
    col=sat(col,1.14);
    // gentle S-curve for poster-like value grouping
    col=mix(col,col*col*(3.0-2.0*col),.18);
    // soft vignette
    vec2 d=vUv-.5;d.x*=uRes.x/uRes.y;col*=1.0-.16*smoothstep(.35,.95,length(d));
    gl_FragColor=vec4(col,c.a);
  }`,
};

export function createPaintedPost(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.Camera) {
  const size = renderer.getSize(new T.Vector2());
  const target = new T.WebGLRenderTarget(size.x * renderer.getPixelRatio(), size.y * renderer.getPixelRatio(), { type: T.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new T.Vector2(size.x, size.y), 0.32, 0.55, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.uRes.value.set(size.x, size.y);
  composer.addPass(grade);
  const resize = () => {
    const s = renderer.getSize(new T.Vector2());
    composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(s.x, s.y);
    grade.uniforms.uRes.value.set(s.x, s.y);
  };
  return { composer, resize, render: () => composer.render() };
}

// The painted look replaces physically based highlights with authored light
// masses, so the expensive PBR/clearcoat evaluation is wasted per pixel. Swap
// every Standard/Physical material for Lambert, keeping maps, vertex colours,
// alpha and any custom shader hooks (their injection points exist in Lambert).
export function lambertize(root: T.Object3D) {
  const cache = new Map<T.Material, T.Material>();
  const sheen = new T.Color('#8fb3d9');
  const convert = (m: T.Material): T.Material => {
    const s = m as T.MeshStandardMaterial;
    if (!s.isMeshStandardMaterial) return m;
    const hit = cache.get(m); if (hit) return hit;
    const l = new T.MeshLambertMaterial({
      color: s.color, map: s.map, vertexColors: s.vertexColors, flatShading: s.flatShading,
      transparent: s.transparent, opacity: s.opacity, alphaTest: s.alphaTest, alphaMap: s.alphaMap,
      side: s.side, depthWrite: s.depthWrite, aoMap: s.aoMap, aoMapIntensity: s.aoMapIntensity,
      emissive: s.emissive, emissiveMap: s.emissiveMap, emissiveIntensity: s.emissiveIntensity,
      normalMap: s.normalMap, normalScale: s.normalScale, fog: s.fog, name: s.name,
    });
    // glassy/metal surfaces keep a hint of sky instead of real reflections
    if ((s as T.MeshPhysicalMaterial).isMeshPhysicalMaterial || s.metalness > .2) l.emissive = s.emissive.clone().add(sheen.clone().multiplyScalar(.14));
    if (s.onBeforeCompile !== T.Material.prototype.onBeforeCompile) {
      l.onBeforeCompile = s.onBeforeCompile;
      l.customProgramCacheKey = () => 'vl-lambert:' + s.customProgramCacheKey();
    }
    l.defines = { ...(s.defines ?? {}) }; delete (l.defines as any).STANDARD; delete (l.defines as any).PHYSICAL;
    cache.set(m, l);
    return l;
  };
  root.traverse(o => {
    const mesh = o as T.Mesh;
    if (!mesh.material) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
  });
  return cache.size;
}

// Keeps frame time near a target by scaling render resolution (UI stays crisp).
// Resizing the canvas clears it, so every change is followed by an immediate
// redraw; otherwise the page background shows for a frame (a dark flash).
// Changes are rare: a band around the target, a cooldown, and a longer wait
// before scaling back up after scaling down, so the resolution cannot oscillate.
export function adaptiveResolution(renderer: T.WebGLRenderer, onResize: () => void, targetMs = 16.7, minRatio = .55, maxRatio = 1.5, redraw: () => void = () => {}) {
  // Frame times on phones snap to the display refresh (90 Hz: 11, 22, 33 ms),
  // so "headroom" can't be read from them. Drop quickly when frames run long;
  // probe upward after a quiet spell, and back off for longer if the probe fails.
  const max = Math.min(devicePixelRatio, maxRatio), min = Math.min(minRatio, max);
  // Start at the tier's full resolution (the player chose it); step down only if needed.
  let ratio = max, frames: number[] = [], last = performance.now(), changedAt = last, lastUp = -1e9, upDelay = 6000;
  renderer.setPixelRatio(ratio); onResize();
  const apply = (next: number, now: number) => { ratio = next; renderer.setPixelRatio(ratio); onResize(); redraw(); changedAt = now; frames = []; };
  const tick = Object.assign(function tick() {
    const now = performance.now(); const dt = now - last; last = now;
    if (dt > 250) { frames = []; return; }           // tab switch or hitch: not a steady-state sample
    if (now - changedAt < 700) return;               // let the new size settle before judging
    frames.push(dt);
    if (frames.length < 40) return;
    const sorted = [...frames].sort((a, b) => a - b), med = sorted[sorted.length >> 1]; frames = [];
    if (med > targetMs * 1.25 && ratio > min + .01) {
      if (now - lastUp < 5000) upDelay = Math.min(60000, upDelay * 2); // the last probe was too ambitious
      apply(Math.max(min, Math.min(ratio - .1, ratio * Math.sqrt(targetMs / med))), now);
    } else if (med <= targetMs * 1.08 && ratio < max - .01 && now - changedAt > upDelay) {
      lastUp = now; apply(Math.min(max, ratio + .1), now);
    }
  }, { ratio: () => ratio });
  return tick;
}
