import * as T from 'three';

// Motes of a nanite body in flight: when a character comes apart or re-forms, a stream of glowing
// specks leaves one place and swirls to another (both can move: a hand, a wing, a word). A small pool,
// one Points draw, positions set on the CPU only while motes are flying (a few hundred at most).

export interface SwarmOpts { max?: number; color?: string; size?: number }
type Pt = T.Vector3 | (() => T.Vector3);

export function buildNaniteSwarm(scene: T.Scene, o: SwarmOpts = {}) {
  const N = o.max ?? 320;
  const pos = new Float32Array(N * 3), alpha = new Float32Array(N);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage));
  geo.setAttribute('aA', new T.BufferAttribute(alpha, 1).setUsage(T.DynamicDrawUsage));
  const U = { uCol: { value: new T.Color(o.color ?? '#9ff5ea') }, uSize: { value: o.size ?? .028 }, uScale: { value: 400 } };
  const mat = new T.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: `attribute float aA; uniform float uSize, uScale; varying float vA;
      void main() { vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = aA > 0. ? clamp(uSize * uScale / max(-mv.z, .05), 1.5, 24.) : 0.; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; varying float vA;
      void main() { float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .1, d) * vA; if (a < .01) discard; gl_FragColor = vec4(uCol * a * 1.6, a); }`,
  });
  const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.name = 'nanite-swarm'; pts.renderOrder = 8; scene.add(pts);
  const motes: { from: Pt; to: Pt; off: T.Vector3; swirl: T.Vector3; t: number; dur: number; delay: number; on: boolean }[] =
    Array.from({ length: N }, () => ({ from: new T.Vector3(), to: new T.Vector3(), off: new T.Vector3(), swirl: new T.Vector3(), t: 0, dur: 1, delay: 0, on: false }));
  const at = (p: Pt) => typeof p === 'function' ? p() : p;
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  let next = 0, live = 0;
  return {
    points: pts,
    /** sizes stay in metres on any screen */
    view(heightPx: number, fovDeg: number) { U.uScale.value = heightPx / (2 * Math.tan(fovDeg * Math.PI / 360)); },
    /** `n` motes from around `from` (within `spread` m) to `to`, over `dur` s, staggered over `stagger` s, curling by `curl` m */
    stream(from: Pt, to: Pt, n = 40, dur = .7, o2: { spread?: number; stagger?: number; curl?: number } = {}) {
      for (let i = 0; i < n; i++) {
        const m = motes[next]; next = (next + 1) % N;
        m.from = from; m.to = to; m.t = 0; m.dur = dur * (.75 + Math.random() * .5); m.delay = Math.random() * (o2.stagger ?? .3); m.on = true;
        m.off.set(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(2 * (o2.spread ?? .08));
        m.swirl.set(Math.random() - .5, Math.random() * .8, Math.random() - .5).normalize().multiplyScalar((o2.curl ?? .25) * (.5 + Math.random()));
      }
      live = 1;
    },
    tick(dt: number) {
      if (!live) return;
      let any = 0;
      for (let i = 0; i < N; i++) {
        const m = motes[i];
        if (!m.on) { alpha[i] = 0; continue; }
        if (m.delay > 0) { m.delay -= dt; alpha[i] = 0; any++; continue; }
        m.t += dt / m.dur; if (m.t >= 1) { m.on = false; alpha[i] = 0; continue; }
        const k = m.t * m.t * (3 - 2 * m.t);
        a.copy(at(m.from)).add(m.off); b.copy(at(m.to));
        // an arc: out along the curl, then in to the target
        c.copy(a).lerp(b, .5).add(m.swirl);
        const u = 1 - k; pos[i * 3] = u * u * a.x + 2 * u * k * c.x + k * k * b.x; pos[i * 3 + 1] = u * u * a.y + 2 * u * k * c.y + k * k * b.y; pos[i * 3 + 2] = u * u * a.z + 2 * u * k * c.z + k * k * b.z;
        alpha[i] = Math.sin(m.t * Math.PI) * .9; any++;
      }
      geo.attributes.position.needsUpdate = true; (geo.attributes.aA as T.BufferAttribute).needsUpdate = true;
      if (!any) live = 0;
    },
  };
}
export type NaniteSwarm = ReturnType<typeof buildNaniteSwarm>;
