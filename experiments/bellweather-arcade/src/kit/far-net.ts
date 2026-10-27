import * as T from 'three';
import { mulberry32 } from '../vendor/rng';

// A vast neural net standing on the horizon: layers of nodes stacked into a tower, links between
// neighbouring layers, and activations that climb it in slow waves. Seen from far off it reads as a
// lattice silhouette against the sky (normal blending, so it shows in daylight) lit by moving light
// (additive). All of the motion is in the shaders: per frame it costs one uniform, so the device's
// budget only decides how many nodes and links there are.
// Game-agnostic: the game gives where it stands, its size, its colours, and how dense it is.

export interface FarNetOpts {
  at: T.Vector3;            // the foot of the axis (may be below the clouds)
  height: number;
  /** radius of a layer at height fraction f (0 at the foot, 1 at the top) */
  radius?: (f: number) => number;
  layers?: number; perLayer?: number; links?: number;
  seed?: number;
  lattice?: string; glow?: string; spark?: string;
  /** how strongly the haze softens it (0 none … 1 nearly gone) */
  haze?: number; hazeColor?: string;
  /** node size in world units */
  size?: number;
  /** a soft glow over the crown and a faint light up the axis (0 for none) */
  crown?: number;
}

const vert = /* glsl */`
  attribute float layer; attribute float seed;
  uniform float uTime, uSize, uLayers, uSurge, uScale, uAdd;
  varying float vLit; varying float vSeed;
  float wave(float l, float t, float speed, float width) {
    float d = abs(fract(t * speed - l / uLayers) - .5) * 2.;   // a front climbing the tower
    return 1. - smoothstep(0., width, d);
  }
  void main() {
    float l = layer;
    float lit = wave(l, uTime + seed * .37, .055, .16) * .8 + wave(l, uTime * 1.3 + 7.1, .033, .1) * .5;
    lit += uSurge * smoothstep(.0, .2, 1. - abs(uSurge * uLayers * 1.2 - l) / 3.);   // a surge, foot to crown
    lit *= .55 + .45 * step(.62, fract(seed * 13.7));                                  // not every node fires
    vLit = lit; vSeed = seed;
    vec4 mv = modelViewMatrix * vec4(position, 1.);
    gl_PointSize = max(1.5, uSize * (uAdd > .5 ? 1. + lit * .9 : .8) * uScale / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const fragPts = /* glsl */`
  uniform vec3 uLattice, uGlow, uSpark; uniform float uHaze; uniform vec3 uHazeColor; uniform float uAdd;
  varying float vLit; varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - .5; float r = length(c); if (r > .5) discard;
    float core = smoothstep(.5, .0, r);
    vec3 hot = mix(uGlow, uSpark, step(.9, fract(vSeed * 7.3)));
    if (uAdd > .5) { gl_FragColor = vec4(hot * core * core * core * vLit * 1.2 * (1. - uHaze * .6), 1.); return; }
    vec3 col = mix(uLattice, uHazeColor, uHaze);
    gl_FragColor = vec4(col, smoothstep(.5, .25, r) * .8 * (1. - uHaze * .55));
  }`;
const lineVert = /* glsl */`
  attribute float layer; attribute float seed;
  uniform float uTime, uLayers, uSurge;
  varying float vLit;
  float wave(float l, float t, float speed, float width) {
    float d = abs(fract(t * speed - l / uLayers) - .5) * 2.;
    return 1. - smoothstep(0., width, d);
  }
  void main() {
    vLit = wave(layer, uTime + seed * .37, .055, .16) * .8 + wave(layer, uTime * 1.3 + 7.1, .033, .1) * .5
         + uSurge * smoothstep(.0, .2, 1. - abs(uSurge * uLayers * 1.2 - layer) / 3.);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }`;
const lineFrag = /* glsl */`
  uniform vec3 uLattice, uGlow; uniform float uHaze, uAdd, uLineA; uniform vec3 uHazeColor;
  varying float vLit;
  void main() {
    if (uAdd > .5) { gl_FragColor = vec4(uGlow * vLit * .35 * (1. - uHaze * .6), 1.); return; }
    gl_FragColor = vec4(mix(uLattice, uHazeColor, uHaze), uLineA * (1. - uHaze * .5));
  }`;

export function buildFarNet(scene: T.Scene, o: FarNetOpts) {
  const rnd = mulberry32(o.seed ?? 7);
  const layers = o.layers ?? 16, per = o.perLayer ?? 64, fan = o.links ?? 2, H = o.height;
  const radius = o.radius ?? (f => 40 * (1 - .55 * Math.sin(f * Math.PI * .9)) + 28 * Math.pow(f, 6));
  const pos: number[] = [], lay: number[] = [], sd: number[] = [], rings: T.Vector3[][] = [];
  for (let l = 0; l < layers; l++) {
    const f = l / (layers - 1), y = f * H, r = radius(f), ring: T.Vector3[] = [];
    // each layer a loose ring of nodes, slightly twisted from the last, a few strays inside it
    const twist = l * .37;
    for (let i = 0; i < per; i++) {
      const a = twist + (i / per) * Math.PI * 2 + (rnd() - .5) * .08, rr = r * (rnd() < .2 ? .35 + rnd() * .5 : .92 + rnd() * .16);
      const p = new T.Vector3(Math.cos(a) * rr, y + (rnd() - .5) * H / layers * .35, Math.sin(a) * rr);
      ring.push(p); pos.push(p.x, p.y, p.z); lay.push(l); sd.push(rnd());
    }
    rings.push(ring);
  }
  // links: each node to a few nodes in the layer above, near in angle (a net, not a hairball)
  const lp: number[] = [], ll: number[] = [], ls: number[] = [];
  for (let l = 0; l < layers - 1; l++) for (let i = 0; i < per; i++) for (let k = 0; k < fan; k++) {
    const a = rings[l][i], j = (i + Math.round((rnd() - .5) * per * .12) + per) % per, b = rings[l + 1][j], s = rnd();
    lp.push(a.x, a.y, a.z, b.x, b.y, b.z); ll.push(l, l + 1); ls.push(s, s);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('layer', new T.Float32BufferAttribute(lay, 1)); geo.setAttribute('seed', new T.Float32BufferAttribute(sd, 1));
  const lgeo = new T.BufferGeometry();
  lgeo.setAttribute('position', new T.Float32BufferAttribute(lp, 3)); lgeo.setAttribute('layer', new T.Float32BufferAttribute(ll, 1)); lgeo.setAttribute('seed', new T.Float32BufferAttribute(ls, 1));
  const shared = {
    uTime: { value: 0 }, uSurge: { value: 0 }, uLayers: { value: layers }, uSize: { value: o.size ?? 2.2 }, uScale: { value: 800 },
    // a denser net draws each link fainter, so the lattice keeps the same weight at every tier
    uLineA: { value: .2 * Math.min(1, Math.sqrt(48 / per)) },
    uLattice: { value: new T.Color(o.lattice ?? '#3d3566') }, uGlow: { value: new T.Color(o.glow ?? '#d9c4ff') }, uSpark: { value: new T.Color(o.spark ?? '#ffe3a1') },
    uHaze: { value: o.haze ?? .45 }, uHazeColor: { value: new T.Color(o.hazeColor ?? '#b9d4ea') },
  };
  const mat = (add: boolean, v: string, f: string) => new T.ShaderMaterial({ uniforms: { ...shared, uAdd: { value: add ? 1 : 0 } }, vertexShader: v, fragmentShader: f, transparent: true, depthWrite: false, fog: false, blending: add ? T.AdditiveBlending : T.NormalBlending });
  const group = new T.Group(); group.name = 'far-net'; group.position.copy(o.at);
  const objs = [new T.LineSegments(lgeo, mat(false, lineVert, lineFrag)), new T.Points(geo, mat(false, vert, fragPts)), new T.LineSegments(lgeo, mat(true, lineVert, lineFrag)), new T.Points(geo, mat(true, vert, fragPts))];
  objs.forEach((m, i) => { m.frustumCulled = false; m.renderOrder = -5 + i; group.add(m); });
  // the crown's glow and a column of light up the middle (billboards: they turn to the view)
  const glowTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d')!, g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.3, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t; })();
  const crownMat = new T.SpriteMaterial({ map: glowTex, color: shared.uGlow.value, transparent: true, opacity: .4, depthWrite: false, blending: T.AdditiveBlending, fog: false });
  const crown = new T.Sprite(crownMat); const CR = o.crown ?? radius(1) * 2.6; crown.scale.set(CR, CR * .7, 1); crown.position.y = H * .98; crown.visible = CR > 0; group.add(crown);
  const colCv = document.createElement('canvas'); colCv.width = 32; colCv.height = 4; { const c = colCv.getContext('2d')!, g = c.createLinearGradient(0, 0, 32, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 4); }
  const colTex = new T.CanvasTexture(colCv); colTex.colorSpace = T.SRGBColorSpace;
  const colMat = new T.MeshBasicMaterial({ map: colTex, color: shared.uGlow.value, transparent: true, opacity: .06, depthWrite: false, blending: T.AdditiveBlending, fog: false, side: T.DoubleSide });
  const column = new T.Mesh(new T.PlaneGeometry(radius(.4) * .9, H), colMat); column.position.y = H / 2; column.visible = CR > 0; group.add(column);
  scene.add(group);
  let surgeT = -1; const camW = new T.Vector3();
  return {
    group,
    nodes: layers * per, links: (layers - 1) * per * fan,
    tick(t: number, dt: number, camera?: T.Camera) {
      shared.uTime.value = t; group.rotation.y = t * .012;   // turning, very slowly
      if (surgeT >= 0) { surgeT += dt / 3.2; shared.uSurge.value = surgeT < 1 ? surgeT : 0; if (surgeT >= 1) surgeT = -1; }
      crownMat.opacity = .32 + .08 * Math.sin(t * .7) + (surgeT > .7 ? (1 - Math.abs(surgeT - .85) / .15) * .5 : 0);
      if (camera) { camera.getWorldPosition(camW); column.rotation.y = Math.atan2(camW.x - group.position.x, camW.z - group.position.z) - group.rotation.y; }
    },
    /** the view, so a node keeps its world size on screen: drawing-buffer height and vertical fov */
    view(heightPx: number, fovDeg: number) { shared.uScale.value = heightPx / (2 * Math.tan(fovDeg * Math.PI / 360)); },
    /** one bright wave from the foot to the crown (a few seconds) */
    surge() { surgeT = 0; },
    set haze(v: number) { shared.uHaze.value = v; },
    dispose() { scene.remove(group); geo.dispose(); lgeo.dispose(); objs.forEach(m => (m.material as T.Material).dispose()); crownMat.dispose(); colMat.dispose(); glowTex.dispose(); colTex.dispose(); column.geometry.dispose(); },
  };
}
