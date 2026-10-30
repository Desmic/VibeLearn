import * as T from 'three';

// Rivers of light: streams of glowing letters flowing along arcs across the sky, from places in
// the world to a far set piece (here: the words of the isles drawn up into the Warden's engine).
// One Points draw; each particle's place on its arc is computed in the vertex shader from a
// handful of uniforms, so the streams cost nothing per frame but a time value.

export interface Stream { from: T.Vector3; to: T.Vector3; /** height the arc rises above the straight line (m) */ lift?: number; /** particles */ n?: number; /** width of the river (m) */ width?: number }
export interface LightStreamOpts { streams: Stream[]; atlas: T.Texture; color?: string; /** seconds for one particle to cross */ period?: number }

const MAX = 8;
const vert = /* glsl */`
  uniform float uT, uScale, uPeriod; uniform vec3 uP0[${MAX}], uP1[${MAX}], uP2[${MAX}]; uniform float uW[${MAX}];
  attribute vec4 aSeed; attribute float aStream;
  varying float vA; varying vec2 vCell;
  void main() {
    int i = int(aStream + .5);
    vec3 p0 = uP0[i], p1 = uP1[i], p2 = uP2[i];
    float u = fract(aSeed.x + uT / (uPeriod * (.8 + aSeed.w * .4)));
    vec3 p = mix(mix(p0, p1, u), mix(p1, p2, u), u);
    vec3 tng = normalize(mix(p1 - p0, p2 - p1, u)), side = normalize(cross(tng, vec3(0., 1., 0.))), up = cross(side, tng);
    float wob = sin(u * 18. + aSeed.y * 40. + uT * .7);
    p += (side * (aSeed.y - .5) + up * (aSeed.z - .5) * .6) * uW[i] * (1. + .4 * wob) * (.4 + 1.2 * sin(u * 3.14159));
    vA = smoothstep(0., .08, u) * smoothstep(1., .85, u);
    vCell = vec2(mod(2. + floor(aSeed.z * 13.99), 4.), floor((2. + floor(aSeed.z * 13.99)) / 4.));
    vec4 mv = viewMatrix * vec4(p, 1.);
    float dist = max(-mv.z, .1);
    gl_PointSize = clamp(1.4 * (.7 + aSeed.w * .6) * uScale / dist, 1.6, 26.);
    gl_Position = projectionMatrix * mv;
  }`;
const frag = /* glsl */`
  uniform sampler2D uMap; uniform vec3 uCol; uniform float uAlpha;
  varying float vA; varying vec2 vCell;
  void main() {
    vec4 t = texture2D(uMap, (vCell + vec2(gl_PointCoord.x, 1. - gl_PointCoord.y)) / 4.);
    // far away a letter is a dot of light; near, it can be read
    float a = max(t.a, .35 * smoothstep(.5, .1, length(gl_PointCoord - .5))) * vA * uAlpha;
    gl_FragColor = vec4(uCol * a, a);
  }`;

export function buildLightStreams(scene: T.Scene, o: LightStreamOpts) {
  const ss = o.streams.slice(0, MAX);
  const P0 = Array.from({ length: MAX }, () => new T.Vector3()), P1 = P0.map(() => new T.Vector3()), P2 = P0.map(() => new T.Vector3()), W = new Array(MAX).fill(0);
  ss.forEach((st, i) => { P0[i].copy(st.from); P2[i].copy(st.to); P1[i].copy(st.from).lerp(st.to, .45).add(new T.Vector3(0, st.lift ?? 80, 0)); W[i] = st.width ?? 4; });
  const total = ss.reduce((a, st) => a + (st.n ?? 220), 0);
  const seed = new Float32Array(total * 4), sid = new Float32Array(total);
  let s = 777, k = 0; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ss.forEach((st, i) => { for (let j = 0; j < (st.n ?? 220); j++, k++) { seed.set([rnd(), rnd(), rnd(), rnd()], k * 4); sid[k] = i; } });
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(total * 3), 3));
  geo.setAttribute('aSeed', new T.BufferAttribute(seed, 4)); geo.setAttribute('aStream', new T.BufferAttribute(sid, 1));
  const U = { uT: { value: 0 }, uScale: { value: 400 }, uPeriod: { value: o.period ?? 70 }, uP0: { value: P0 }, uP1: { value: P1 }, uP2: { value: P2 }, uW: { value: W },
    uMap: { value: o.atlas }, uCol: { value: new T.Color(o.color ?? '#ffd9a0') }, uAlpha: { value: 0 } };
  const mat = new T.ShaderMaterial({ uniforms: U, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor, fog: false });
  const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.name = 'light-streams'; pts.renderOrder = 7; scene.add(pts);
  return {
    points: pts,
    view(heightPx: number, fovDeg: number) { U.uScale.value = heightPx / (2 * Math.tan(fovDeg * Math.PI / 360)); },
    /** 0 hides them */
    strength(a: number) { U.uAlpha.value = a; pts.visible = a > .01; },
    tick(t: number) { U.uT.value = t; },
    dispose() { scene.remove(pts); geo.dispose(); mat.dispose(); },
  };
}
