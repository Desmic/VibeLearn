import * as T from 'three';

// Hologram look for any game: additive light with scan lines, a soft edge
// glow and a little flicker, plus text glyphs, beams and sparks drawn with it.
// One shared clock drives every hologram; call tickHolo(dt) once a frame.
// Bright parts go above the bloom threshold, so they glow in the painted look.

export const holoClock = { value: 0 };
export const tickHolo = (dt: number) => { holoClock.value += dt; };

export const HOLO = { found: '#6fe0c9', made: '#ffd36b', warden: '#b07bff', warn: '#ff7a8a', dim: '#3c8f9c' };

const VERT = /* glsl */`
varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vY;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y;
  vec4 mv = viewMatrix * w; vV = -mv.xyz; vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */`
uniform vec3 uColor; uniform float uOpacity; uniform float uTime; uniform float uIntensity;
uniform float uScan; uniform float uEdge; uniform float uFlow; uniform float uSeed; uniform float uHasMap;
uniform sampler2D uMap;
varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vY;
void main() {
  float a = uOpacity;
  vec3 base = uColor;
  if (uHasMap > .5) { vec4 tx = texture2D(uMap, vUv); a *= tx.a; base *= tx.rgb; }
  float facing = abs(dot(normalize(vN), normalize(vV)));
  float edge = pow(1.0 - facing, 2.0) * uEdge;
  float scan = mix(1.0, .72 + .28 * sin(vY * 90.0 - uTime * 5.0), uScan);
  float flick = .93 + .07 * sin(uTime * 31.0 + uSeed * 17.0) * sin(uTime * 7.3 + uSeed);
  float flow = mix(1.0, .35 + .65 * smoothstep(.35, .5, fract(vUv.y * 6.0 - uTime * 2.2)), uFlow);
  float k = (a * scan * flow + edge * uOpacity) * flick;
  if (k < .004) discard;
  #ifdef HOLO_NORMAL
  gl_FragColor = vec4(base * uIntensity, clamp(k, 0.0, 1.0));
  #else
  gl_FragColor = vec4(base * uIntensity * k, k);
  #endif
}`;

export interface HoloOpts { color?: string; opacity?: number; intensity?: number; map?: T.Texture | null; scan?: number; edge?: number; flow?: number; side?: T.Side;
  /** normal blending: readable over a bright daytime sky (text panels); additive is for light (beams, halos) */
  solid?: boolean }
export function holoMaterial(o: HoloOpts = {}) {
  return new T.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: o.solid ? T.NormalBlending : T.AdditiveBlending, side: o.side ?? T.DoubleSide,
    defines: o.solid ? { HOLO_NORMAL: '' } : {},
    uniforms: {
      uColor: { value: new T.Color(o.color ?? HOLO.found) }, uOpacity: { value: o.opacity ?? .8 }, uTime: holoClock,
      uIntensity: { value: o.intensity ?? 1.4 }, uScan: { value: o.scan ?? 1 }, uEdge: { value: o.edge ?? 0 },
      uFlow: { value: o.flow ?? 0 }, uSeed: { value: Math.random() * 10 }, uHasMap: { value: o.map ? 1 : 0 }, uMap: { value: o.map ?? null },
    },
  });
}
export const setHolo = (m: T.Material, p: { color?: string; opacity?: number; intensity?: number }) => {
  const u = (m as T.ShaderMaterial).uniforms; if (!u) return;
  if (p.color) u.uColor.value.set(p.color); if (p.opacity !== undefined) u.uOpacity.value = p.opacity; if (p.intensity !== undefined) u.uIntensity.value = p.intensity;
};

/** white text with a soft glow on a transparent canvas; the hologram tints it */
const glyphCache = new Map<string, { tex: T.CanvasTexture; w: number }>();
export function glyphTexture(text: string, frame = false, backing = true) {
  const key = text + (frame ? '#f' : '') + (backing ? '#b' : ''); const hit = glyphCache.get(key); if (hit) return hit;
  const c = document.createElement('canvas'), g = c.getContext('2d')!;
  const font = '700 64px Trebuchet MS, Arial, sans-serif'; g.font = font;
  const w = Math.max(160, Math.ceil(g.measureText(text).width) + 56); c.width = Math.min(1024, w); c.height = 112;
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  // dark glass behind the light (the shader tints white to the hologram colour and keeps the glass dark)
  if (backing) { roundRect(g, 6, 8, c.width - 12, c.height - 16, 26); g.fillStyle = 'rgba(6,26,40,.62)'; g.fill(); }
  if (frame) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 5; roundRect(g, 6, 8, c.width - 12, c.height - 16, 26); g.stroke(); }
  g.shadowColor = '#fff'; g.shadowBlur = 14; g.fillStyle = '#fff'; g.fillText(text, c.width / 2, c.height / 2 + 3);
  g.shadowBlur = 0; g.fillText(text, c.width / 2, c.height / 2 + 3);
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
  const out = { tex, w: c.width / c.height }; glyphCache.set(key, out); return out;
}
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** a word drawn in hologram light, `height` metres tall */
export function glyph(text: string, o: { height?: number; color?: string; frame?: boolean; intensity?: number; backing?: boolean } = {}) {
  const { tex, w } = glyphTexture(text, o.frame, o.backing ?? true), h = o.height ?? .2;
  const m = new T.Mesh(new T.PlaneGeometry(h * w, h), holoMaterial({ map: tex, color: o.color, intensity: o.intensity ?? 1.6, opacity: 1, scan: .35, solid: true }));
  m.userData.word = text; m.renderOrder = 10; return m;
}

/** a beam of light between two points; call set(a, b) to move it */
export function beam(o: { color?: string; radius?: number; flow?: boolean } = {}) {
  const geo = new T.CylinderGeometry(1, 1, 1, 8, 1, true); geo.translate(0, .5, 0);
  const mesh = new T.Mesh(geo, holoMaterial({ color: o.color, opacity: .55, intensity: 1.5, scan: 0, edge: 1.2, flow: o.flow ? 1 : 0 }));
  const r = o.radius ?? .02, up = new T.Vector3(0, 1, 0), d = new T.Vector3();
  mesh.renderOrder = 9; mesh.frustumCulled = false;
  const set = (a: T.Vector3, b: T.Vector3, radius = r) => {
    mesh.position.copy(a); d.subVectors(b, a); const len = Math.max(.001, d.length());
    mesh.scale.set(radius, len, radius); mesh.quaternion.setFromUnitVectors(up, d.normalize());
  };
  return { mesh, set };
}

/** a little burst of light motes: one instanced draw however many are flying (phones count draws) */
export function sparks(parent: T.Object3D, n = 24, color: string = HOLO.found) {
  const mat = holoMaterial({ color, opacity: 1, intensity: 2.2, scan: 0 });
  const mesh = new T.InstancedMesh(new T.OctahedronGeometry(.03, 0), mat, n); mesh.frustumCulled = false; mesh.renderOrder = 11; parent.add(mesh);
  const ps = Array.from({ length: n }, () => ({ p: new T.Vector3(), v: new T.Vector3(), life: 0 }));
  const m = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3();
  let i = 0, live = 0;
  const write = () => { for (let k = 0; k < n; k++) { const p = ps[k]; sc.setScalar(p.life > 0 ? Math.max(.01, p.life * 1.4) : 0); m.compose(p.p, q, sc); mesh.setMatrixAt(k, m); } mesh.instanceMatrix.needsUpdate = true; };
  write(); mesh.visible = false;
  return {
    burst(at: T.Vector3, count = 10, speed = 1.6, col?: string) {
      if (col) setHolo(mat, { color: col });
      for (let k = 0; k < count; k++) { const p = ps[i++ % n]; p.p.copy(at); p.v.set(Math.random() - .5, Math.random() * .8 + .2, Math.random() - .5).normalize().multiplyScalar(speed * (.4 + Math.random())); p.life = .6 + Math.random() * .5; }
      live = 1; mesh.visible = true;
    },
    tick(dt: number) {
      if (!live) return;
      let any = 0; for (const p of ps) if (p.life > 0) { p.life -= dt; p.v.y -= 2.2 * dt; p.p.addScaledVector(p.v, dt); any++; }
      write(); if (!any) { live = 0; mesh.visible = false; }
    },
  };
}

/** turn an object to face the camera around its vertical axis */
export const faceCamera = (o: T.Object3D, cam: T.Camera) => { o.rotation.y = Math.atan2(cam.position.x - o.position.x, cam.position.z - o.position.z); };
