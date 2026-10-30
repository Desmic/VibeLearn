import * as T from 'three';

// Time of day as data. A mood is a full lighting state: sky gradient, sun (its
// direction, colour, glow in the sky), hemisphere fill, haze, exposure, how the
// painted cloud banks are tinted, stars, lit lamps, and how brightly a far
// glowing set piece reads. Places name the mood they sit in ("anchors"); as
// the player moves between places the moods blend by distance, so a journey
// across the world is also a journey through the day. Costs one sky draw call
// and one draw for all lamp halos; nothing scales with the tier.

export interface Mood {
  zenith: string; mid: string; horizon: string; below: string;
  /** direction toward the sun (need not be normalised) */
  sunDir: [number, number, number];
  sunColor: string; sunIntensity: number;
  /** the sun's glow in the sky: colour and strength (0 none) */
  glow: string; glowStrength: number;
  hemiSky: string; hemiGround: string; hemiIntensity: number;
  fog: string; fogDensity: number;
  exposure: number;
  /** multiplies the painted far cloud banks (unlit materials) */
  clouds: string;
  /** 0 … 1 */
  stars: number; lamps: number;
  /** how strongly a far glowing set piece reads (1 = as designed for daylight) */
  farGlow: number; farHaze: number;
  /** the dream layer: how bright the moon reads (0 none), aurora ribbons (0 none) */
  moon?: number; aurora?: number;
  /** drifting motes in the air (kit/dream-air): colour, how many glow like fireflies (0 … 1), rivers of light (0 … 1) */
  air?: string; fireflies?: number; streams?: number;
}

/** a moon (with a ring) fixed in the sky; its lit side follows the sun */
export interface MoonOpts { dir: [number, number, number]; /** angular radius, radians */ size?: number; color?: string; ring?: boolean; tilt?: number }

export interface MoodAnchor { at: [number, number]; mood: string; /** metres over which this place fully owns the mood */ r?: number }

export interface SkyMoodOpts {
  moods: Record<string, Mood>;
  anchors: MoodAnchor[];
  sun: T.DirectionalLight; hemi: T.HemisphereLight;
  renderer: T.WebGLRenderer; scene: T.Scene;
  /** unlit materials to tint with `clouds` (their colour is multiplied) */
  tint?: T.Material[];
  /** world positions of lamps for the halo layer */
  lamps?: T.Vector3[];
  /** distance from the light target to the light (keeps the shadow frustum) */
  sunDistance?: number;
  moon?: MoonOpts;
}

const C = (s: string) => new T.Color(s);
const skyVert = /* glsl */`
  varying vec3 vDir;
  void main() { vDir = normalize((modelMatrix * vec4(position, 0.)).xyz); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`;
const skyFrag = /* glsl */`
  uniform vec3 uZenith, uMid, uHorizon, uBelow, uSunDir, uGlow; uniform float uGlowK, uStars, uTime;
  uniform vec3 uMoonDir, uMoonCol; uniform float uMoon, uMoonR, uRing, uTilt, uAurora;
  uniform float uUnTone, uExposure; uniform mat3 uInvIn, uInvOut;
  varying vec3 vDir;
  // the sky's colours are authored as seen; when a post pass tone-maps the whole frame (ACES filmic),
  // the sky is sent through the inverse first so it still reads as authored
  vec3 untone(vec3 y) {
    vec3 o = clamp(uInvOut * clamp(y, 0., .9), 0., .9);
    vec3 A = 1. - .983729 * o, B = .0245786 - .432951 * o, C = -(.000090537 + .238081 * o);
    vec3 v = (-B + sqrt(max(B * B - 4. * A * C, 0.))) / (2. * A);
    return max(uInvIn * v, 0.) * .6 / uExposure;
  }
  float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  void main() {
    vec3 d = normalize(vDir); float h = d.y;
    vec3 col = h < 0. ? mix(uHorizon, uBelow, smoothstep(0., -.25, h))
                      : mix(mix(uHorizon, uMid, smoothstep(0., .2, h)), uZenith, smoothstep(.18, .75, h));
    float s = max(dot(d, normalize(uSunDir)), 0.);
    // a broad warm wash along the horizon on the sun's side, a softer halo, a bright core
    col += uGlow * uGlowK * (pow(s, 3.) * .35 * exp(-abs(h) * 5.) + pow(s, 24.) * .55 + pow(s, 900.) * 2.2);
    if (uStars > 0.) {
      vec2 g = vec2(atan(d.z, d.x) * 120., asin(clamp(h, -1., 1.)) * 120.);
      vec2 c = floor(g), f = fract(g) - .5; float r = h21(c);
      float star = step(.985, r) * smoothstep(.22, .0, length(f + (vec2(h21(c + 3.1), h21(c + 7.7)) - .5) * .5));
      star *= .55 + .45 * sin(uTime * (1. + r * 3.) + r * 40.);
      col += vec3(1., .96, .9) * star * uStars * smoothstep(.04, .35, h);
    }
    // aurora: slow curtains of light high in the dusk sky
    if (uAurora > 0. && h > .08) {
      float az = atan(d.z, d.x);
      float bend = sin(az * 2.3 + uTime * .04) * .1 + sin(az * 5.1 - uTime * .07) * .05;
      float y = h - .22 - bend;
      float band = smoothstep(-.02, .06, y) * exp(-max(y, 0.) * 7.);          // a lit lower hem, fading upward
      float rays = .5 + .5 * sin(az * 23. + sin(az * 6. + uTime * .15) * 3. + uTime * .1);
      float fold = .5 + .5 * sin(az * 4. - uTime * .06);
      vec3 ac = mix(vec3(.3, 1., .72), vec3(.75, .45, 1.), smoothstep(.0, .25, y));
      col += ac * band * (.45 + .35 * rays) * (.5 + .5 * fold) * uAurora * .8;
    }
    // the moon: a pale disc lit from the sun's side, a little mottled, with a tilted ring
    if (uMoon > 0.) {
      vec3 md = normalize(uMoonDir), U = normalize(cross(md, vec3(0., 1., 0.))), V = cross(U, md);
      float m = dot(d, md);
      vec2 q = vec2(dot(d, U), dot(d, V)) / uMoonR;
      float r2 = dot(q, q);
      col += uMoonCol * pow(max(m, 0.), 600.) * .25 * uMoon;   // halo
      vec2 rq = mat2(cos(uTilt), -sin(uTilt), sin(uTilt), cos(uTilt)) * q; float e = length(rq * vec2(1., 3.6));
      float ring = uRing * smoothstep(1.55, 1.7, e) * smoothstep(2.45, 2.3, e) * (.55 + .45 * sin(e * 22.)) * step(0., m);
      bool front = rq.y < 0.;
      if (r2 < 1. && m > 0.) {
        vec3 n = q.x * U + q.y * V - sqrt(1. - r2) * md;
        float lit = smoothstep(-.15, .35, dot(n, normalize(uSunDir)));
        float mott = .9 + .07 * sin(q.x * 5. + 1.) * sin(q.y * 4.3 - .5) + .05 * sin((q.x + q.y) * 11.) - .08 * smoothstep(.35, .1, length(q - vec2(.3, .2))) - .06 * smoothstep(.25, .05, length(q + vec2(.35, .1)));
        vec3 mc = mix(col * 1.08 + uMoonCol * .06, uMoonCol * mott, lit);
        col = mix(col, mc, smoothstep(1., .96, r2) * uMoon);
        if (front) col += uMoonCol * ring * .35 * uMoon;
      } else col += uMoonCol * ring * .35 * uMoon;
    }
    if (uUnTone > .5) col = untone(col);
    gl_FragColor = vec4(col, 1.);
    #include <colorspace_fragment>
  }`;

function haloTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!, r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,240,210,.75)'); r.addColorStop(.5, 'rgba(255,200,140,.18)'); r.addColorStop(1, 'rgba(255,180,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

type Live = { [K in keyof Mood]-?: NonNullable<Mood[K]> extends string ? T.Color : NonNullable<Mood[K]> extends number ? number : T.Vector3 };
const live = (m: Mood): Live => {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m)) o[k] = typeof v === 'string' ? C(v) : typeof v === 'number' ? v : new T.Vector3(...(v as [number, number, number])).normalize();
  return o as Live;
};

export function buildSkyMood(o: SkyMoodOpts) {
  const moods = Object.fromEntries(Object.entries(o.moods).map(([k, m]) => [k, live(m)])) as Record<string, Live>;
  const first = moods[o.anchors[0]?.mood] ?? Object.values(moods)[0];
  const cur = live(o.moods[o.anchors[0]?.mood] ?? Object.values(o.moods)[0]);
  const U = {
    uZenith: { value: cur.zenith }, uMid: { value: cur.mid }, uHorizon: { value: cur.horizon }, uBelow: { value: cur.below },
    uSunDir: { value: cur.sunDir }, uGlow: { value: cur.glow }, uGlowK: { value: cur.glowStrength }, uStars: { value: 0 }, uTime: { value: 0 },
    uMoonDir: { value: new T.Vector3(...(o.moon?.dir ?? [0, 1, 0])).normalize() }, uMoonCol: { value: C(o.moon?.color ?? '#fff4e6') }, uMoon: { value: 0 },
    uMoonR: { value: o.moon?.size ?? .09 }, uRing: { value: o.moon?.ring === false ? 0 : 1 }, uTilt: { value: o.moon?.tilt ?? .35 }, uAurora: { value: 0 },
    uUnTone: { value: 0 }, uExposure: { value: 1 },
    // three's ACES filmic matrices (columns as in tonemapping_pars_fragment), inverted
    uInvIn: { value: new T.Matrix3().set(.59719, .35458, .04823, .07600, .90834, .01566, .02840, .13383, .83777).invert() },
    uInvOut: { value: new T.Matrix3().set(1.60475, -.53108, -.07367, -.10208, 1.10813, -.00605, -.00327, -.07276, 1.07602).invert() },
  };
  const sky = new T.Mesh(new T.SphereGeometry(500, 32, 16), new T.ShaderMaterial({ uniforms: U, vertexShader: skyVert, fragmentShader: skyFrag, side: T.BackSide, depthWrite: false, depthTest: true, fog: false }));
  sky.name = 'sky-mood'; sky.frustumCulled = false; sky.renderOrder = -10;
  o.scene.add(sky); o.scene.background = null;
  const baseTint = (o.tint ?? []).map(m => ((m as T.MeshBasicMaterial).color ?? C('#fff')).clone());

  // lamp halos: one Points draw for every lamp in the world
  let halos: T.Points | null = null; const haloMat = new T.PointsMaterial({ map: haloTexture(), size: 1.35, sizeAttenuation: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: '#ffc983', opacity: 0, fog: false });
  const setLamps = (ps: T.Vector3[]) => {
    if (halos) { o.scene.remove(halos); halos.geometry.dispose(); }
    if (!ps.length) { halos = null; return; }
    halos = new T.Points(new T.BufferGeometry().setFromPoints(ps), haloMat); halos.name = 'lamp-halos'; halos.renderOrder = 8; o.scene.add(halos);
  };
  if (o.lamps) setLamps(o.lamps);

  const sunDist = o.sunDistance ?? o.sun.position.distanceTo(o.sun.target.position);
  const w: number[] = [], tmpC = new T.Color(), tmpV = new T.Vector3();
  let forced: { name: string; k: number } | null = null;
  const blend = (at: T.Vector3) => {
    // inverse-distance weights with a plateau inside each place (r), sharp enough that a place owns its mood
    let sum = 0;
    o.anchors.forEach((a, i) => { const d = Math.max(0, Math.hypot(at.x - a.at[0], at.z - a.at[1]) - (a.r ?? 14)); w[i] = 1 / Math.pow(d + 1, 4); sum += w[i]; });
    for (const key of Object.keys(first) as (keyof Live)[]) {
      const v0 = first[key];
      if (typeof v0 === 'number') { let n = 0; o.anchors.forEach((a, i) => { n += (moods[a.mood][key] as number) * w[i] / sum; }); (cur as Record<string, unknown>)[key] = n; }
      else if ((v0 as T.Color).isColor) { const c = cur[key] as T.Color; c.setRGB(0, 0, 0); o.anchors.forEach((a, i) => { tmpC.copy(moods[a.mood][key] as T.Color).multiplyScalar(w[i] / sum); c.r += tmpC.r; c.g += tmpC.g; c.b += tmpC.b; }); }
      else { const v = cur[key] as T.Vector3; v.set(0, 0, 0); o.anchors.forEach((a, i) => v.addScaledVector(moods[a.mood][key] as T.Vector3, w[i] / sum)); v.normalize(); }
    }
    if (forced) {
      const m = moods[forced.name], k = forced.k;
      for (const key of Object.keys(m) as (keyof Live)[]) {
        const a = cur[key], b = m[key];
        if (typeof a === 'number') (cur as Record<string, unknown>)[key] = a + ((b as number) - a) * k;
        else if ((a as T.Color).isColor) (a as T.Color).lerp(b as T.Color, k); else (a as T.Vector3).lerp(b as T.Vector3, k).normalize();
      }
    }
  };
  const apply = () => {
    o.sun.color.copy(cur.sunColor); o.sun.intensity = cur.sunIntensity;
    o.sun.position.copy(o.sun.target.position).addScaledVector(cur.sunDir, sunDist);
    o.hemi.color.copy(cur.hemiSky); o.hemi.groundColor.copy(cur.hemiGround); o.hemi.intensity = cur.hemiIntensity;
    const fog = o.scene.fog as T.FogExp2 | null; if (fog) { fog.color.copy(cur.fog); fog.density = cur.fogDensity; }
    o.renderer.toneMappingExposure = cur.exposure; U.uExposure.value = cur.exposure;
    U.uStars.value = cur.stars; U.uGlowK.value = cur.glowStrength; U.uMoon.value = o.moon ? cur.moon ?? 0 : 0; U.uAurora.value = cur.aurora ?? 0;
    (o.tint ?? []).forEach((m, i) => { const c = (m as T.MeshBasicMaterial).color; if (c) c.copy(baseTint[i]).multiply(cur.clouds); });
    haloMat.opacity = cur.lamps; if (halos) halos.visible = cur.lamps > .02;
  };
  let lastSunKey = '';
  return {
    sky, state: cur,
    /** move the sun's shadow frustum to a new centre; true when the shadow map needs a redraw */
    centre(p: T.Vector3) { o.sun.target.position.set(p.x, 0, p.z); o.sun.target.updateMatrixWorld(); },
    setLamps,
    /** the frame is tone-mapped by a post pass: draw the sky through the inverse so it reads as authored */
    untone(on: boolean) { U.uUnTone.value = on ? 1 : 0; },
    /** hold a named mood over the place's own by k (0 … 1), e.g. for a cutscene; null releases */
    force(name: string | null, k = 1) { forced = name && moods[name] ? { name, k } : null; },
    tick(t: number, at: T.Vector3, camera: T.Camera) {
      U.uTime.value = t; sky.position.copy(camera.position);
      blend(at); apply();
      // the shadow map is static; it needs a redraw when the sun turns noticeably
      const key = cur.sunDir.toArray().map(n => n.toFixed(2)).join(',');
      const turned = key !== lastSunKey; lastSunKey = key; tmpV.copy(cur.sunDir);
      return turned;
    },
  };
}
export type SkyMood = ReturnType<typeof buildSkyMood>;
