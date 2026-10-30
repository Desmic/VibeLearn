import * as T from 'three';

// The air of a dream: glowing pollen, drifting petals and tiny letters (a world made of words)
// floating around the camera, with fireflies by dusk. One Points draw; every particle moves in the
// vertex shader inside a box that travels with the camera and wraps, so there is no CPU cost per
// particle and the air is always full wherever the player goes. Also: a glyph atlas other layers
// can share (rivers of light use it).

export interface DreamAirOpts {
  count?: number;
  /** side of the box of air round the camera (m) */
  box?: number;
  /** the letters drawn in the atlas (14 used) */
  letters?: string;
  /** steady breeze (m/s) */
  wind?: [number, number, number];
}

/** a 4×4 atlas: cell 0 a soft dot, 1 a petal, 2–15 letters */
export function glyphAtlas(letters = 'aeiouwrdsnltmh') {
  const N = 64, c = document.createElement('canvas'); c.width = c.height = N * 4;
  const g = c.getContext('2d')!;
  const cell = (i: number) => [(i % 4) * N, Math.floor(i / 4) * N] as const;
  { const [x, y] = cell(0), r = g.createRadialGradient(x + 32, y + 32, 0, x + 32, y + 32, 30);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(x, y, N, N); }
  { const [x, y] = cell(1); g.save(); g.translate(x + 32, y + 32); g.rotate(.6);
    const r = g.createRadialGradient(0, -4, 2, 0, 0, 24); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,.15)');
    g.fillStyle = r; g.beginPath(); g.moveTo(0, -22); g.bezierCurveTo(16, -12, 14, 12, 0, 22); g.bezierCurveTo(-14, 12, -16, -12, 0, -22); g.fill(); g.restore(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 14; i++) {
    const [x, y] = cell(i + 2), ch = letters[i % letters.length];
    g.shadowColor = 'rgba(255,255,255,.9)'; g.shadowBlur = 10; g.fillStyle = 'rgba(255,255,255,1)';
    g.font = 'italic 600 40px Georgia, "Times New Roman", serif'; g.fillText(ch, x + 32, y + 34);
  }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

const vert = /* glsl */`
  uniform float uT, uBox, uScale, uSize, uFire; uniform vec3 uCam, uWind;
  attribute vec4 aSeed; attribute float aKind;
  varying float vA, vRot, vFire; varying vec2 vCell; varying float vKind;
  void main() {
    float sp = .5 + aSeed.w;
    float rise = aKind > 1.5 ? .22 : aKind > .5 ? -.12 : .04;
    vec3 drift = uWind * uT * sp + vec3(sin(uT * .3 * sp + aSeed.w * 20.) * 1.4, rise * uT * sp + sin(uT * .5 + aSeed.x * 30.) * .5, cos(uT * .23 * sp + aSeed.y * 20.) * 1.4);
    vec3 p = mod(aSeed.xyz * uBox + drift - uCam + uBox * .5, uBox) - uBox * .5 + uCam;
    vec3 rel = (p - uCam) / uBox;
    float edge = 1. - smoothstep(.32, .5, max(max(abs(rel.x), abs(rel.y)), abs(rel.z)));
    vec4 mv = viewMatrix * vec4(p, 1.);
    float dist = max(-mv.z, .01);
    // letters fade out up close (a big glyph by the lens reads as a smudge); pollen near the lens
    // stays as soft out-of-focus discs, like light in a dream
    vA = edge * (aKind > 1.5 ? smoothstep(3., 6., dist) : aKind > .5 ? smoothstep(.7, 2.4, dist) : mix(.28, 1., smoothstep(.8, 3., dist)));
    vRot = aSeed.w * 6.28 + uT * (aKind > .5 && aKind < 1.5 ? 1.2 : .25) * (aSeed.x - .5);
    vKind = aKind;
    float cellI = aKind < .5 ? 0. : aKind < 1.5 ? 1. : 2. + floor(aSeed.z * 13.99);
    vCell = vec2(mod(cellI, 4.), floor(cellI / 4.));
    // dusk: the motes become fireflies, each on its own slow pulse
    vFire = aKind < .5 ? uFire * pow(.5 + .5 * sin(uT * (1.3 + aSeed.y * 2.) + aSeed.w * 50.), 3.) : 0.;
    float k = aKind > 1.5 ? 1.05 : aKind > .5 ? 1.25 : .8 + vFire * .6;
    gl_PointSize = clamp(uSize * k * (.6 + aSeed.w * .8) * uScale / dist, 0., 72.);
    gl_Position = projectionMatrix * mv;
  }`;
const frag = /* glsl */`
  uniform sampler2D uMap; uniform vec3 uAir, uPetal, uLetter, uFireCol; uniform float uAlpha;
  varying float vA, vRot, vFire; varying vec2 vCell; varying float vKind;
  void main() {
    vec2 c = gl_PointCoord - .5; float cs = cos(vRot), sn = sin(vRot);
    c = mat2(cs, -sn, sn, cs) * c * (vKind > 1.5 ? 1. : 1.15) + .5;
    if (c.x < 0. || c.y < 0. || c.x > 1. || c.y > 1.) discard;
    vec4 t = texture2D(uMap, (vCell + vec2(c.x, 1. - c.y)) / 4.);
    vec3 col = vKind < .5 ? mix(uAir, uFireCol, min(1., vFire * 1.4)) : vKind < 1.5 ? uPetal : uLetter;
    float a = t.a * vA * uAlpha * (vKind < .5 ? .55 + vFire * 1.6 : vKind < 1.5 ? .62 : .55);
    gl_FragColor = vec4(col * a, a);
  }`;

export function buildDreamAir(scene: T.Scene, o: DreamAirOpts = {}) {
  const n = o.count ?? 520, box = o.box ?? 28;
  const seed = new Float32Array(n * 4), kind = new Float32Array(n);
  let s = 12345; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) { seed.set([rnd(), rnd(), rnd(), rnd()], i * 4); const r = rnd(); kind[i] = r < .58 ? 0 : r < .84 ? 1 : 2; }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aSeed', new T.BufferAttribute(seed, 4)); geo.setAttribute('aKind', new T.BufferAttribute(kind, 1));
  const atlas = glyphAtlas(o.letters);
  const U = {
    uT: { value: 0 }, uBox: { value: box }, uScale: { value: 400 }, uSize: { value: .17 }, uFire: { value: 0 },
    uCam: { value: new T.Vector3() }, uWind: { value: new T.Vector3(...(o.wind ?? [.35, 0, .12])) }, uMap: { value: atlas },
    uAir: { value: new T.Color('#fff3dc') }, uPetal: { value: new T.Color('#ffb0cc') }, uLetter: { value: new T.Color('#ffe7b0') }, uFireCol: { value: new T.Color('#e8ff9a') },
    uAlpha: { value: 1 },
  };
  const mat = new T.ShaderMaterial({ uniforms: U, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor, fog: false });
  // (premultiplied: soft additive-ish light that still darkens nothing)
  const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.name = 'dream-air'; pts.renderOrder = 9; scene.add(pts);
  return {
    atlas, points: pts,
    /** the drawing-buffer height and fov, so sizes stay in metres */
    view(heightPx: number, fovDeg: number) { U.uScale.value = heightPx / (2 * Math.tan(fovDeg * Math.PI / 360)); },
    /** colour of the motes, fireflies 0 … 1, overall strength 0 … 1 */
    mood(air: T.Color, fire: number, alpha = 1) { U.uAir.value.copy(air); U.uFire.value = fire; U.uAlpha.value = alpha; },
    tick(t: number, camera: T.Camera) { U.uT.value = t; camera.getWorldPosition(U.uCam.value); },
    dispose() { scene.remove(pts); geo.dispose(); mat.dispose(); atlas.dispose(); },
  };
}
export type DreamAir = ReturnType<typeof buildDreamAir>;
