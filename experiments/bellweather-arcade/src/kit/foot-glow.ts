import * as T from 'three';

// The world answers the player: walking leaves a few motes of light that rise from the footsteps
// and fade. A pool of points updated on the CPU (a few dozen), one draw.

const vert = /* glsl */`
  uniform float uScale; attribute float aAge; varying float vA;
  void main() {
    vA = aAge < 0. ? 0. : smoothstep(0., .15, aAge) * (1. - smoothstep(.4, 1., aAge));
    vec4 mv = modelViewMatrix * vec4(position, 1.);
    gl_PointSize = clamp(.07 * (1. + aAge) * uScale / max(-mv.z, .1), 0., 40.);
    gl_Position = projectionMatrix * mv;
  }`;
const frag = /* glsl */`
  uniform vec3 uCol; uniform float uAlpha; varying float vA;
  void main() { float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d) * vA * uAlpha; a *= a; gl_FragColor = vec4(uCol * a, a); }`;

export function buildFootGlow(scene: T.Scene, n = 48) {
  const pos = new Float32Array(n * 3), age = new Float32Array(n).fill(-1), vel = new Float32Array(n * 3);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('aAge', new T.BufferAttribute(age, 1));
  const U = { uScale: { value: 400 }, uCol: { value: new T.Color('#fff0c8') }, uAlpha: { value: 1 } };
  const mat = new T.ShaderMaterial({ uniforms: U, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor });
  const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.name = 'foot-glow'; pts.renderOrder = 9; scene.add(pts);
  let next = 0, spawnT = 0;
  const LIFE = 1.8;
  return {
    view(heightPx: number, fovDeg: number) { U.uScale.value = heightPx / (2 * Math.tan(fovDeg * Math.PI / 360)); },
    colour(c: T.Color, alpha = 1) { U.uCol.value.copy(c); U.uAlpha.value = alpha; },
    tick(dt: number, feet: T.Vector3, speed: number) {
      spawnT -= dt;
      if (speed > .6 && spawnT <= 0) {
        spawnT = .09;
        for (let k = 0; k < 2; k++) {
          const i = next; next = (next + 1) % n;
          pos[i * 3] = feet.x + (Math.random() - .5) * .5; pos[i * 3 + 1] = feet.y + .05; pos[i * 3 + 2] = feet.z + (Math.random() - .5) * .5;
          vel[i * 3] = (Math.random() - .5) * .15; vel[i * 3 + 1] = .25 + Math.random() * .35; vel[i * 3 + 2] = (Math.random() - .5) * .15; age[i] = 0;
        }
      }
      for (let i = 0; i < n; i++) {
        if (age[i] < 0) continue;
        age[i] += dt / LIFE; if (age[i] >= 1) { age[i] = -1; continue; }
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      }
      geo.attributes.position.needsUpdate = true; (geo.attributes.aAge as T.BufferAttribute).needsUpdate = true;
    },
  };
}
