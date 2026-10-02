import * as T from 'three';
import { holoClock, holoMaterial } from './holo';

// Feedback for walking into something you can't see: an island edge, a railing gap,
// a collider wider than its art. When the walker keeps pushing but barely moves, a
// soft ripple of light shows where the edge is (and a tiny sound/haptic, via
// onBump). Without it, invisible walls feel like the controls broke. Game-agnostic.

export function createBumpFeedback(scene: T.Scene, o: { color?: string; onBump?: () => void } = {}) {
  const n = 3, mat = holoMaterial({ color: o.color ?? '#7fe6ff', opacity: .9, intensity: 1.25, scan: .3, edge: 0, solid: true });
  const geo = new T.RingGeometry(.25, .29, 32);
  const rings = Array.from({ length: n }, () => { const mm = mat.clone(); mm.uniforms.uTime = holoClock; const m = new T.Mesh(geo, mm); m.visible = false; m.renderOrder = 12; scene.add(m); return { m, life: 0 }; });
  let stuck = 0, cool = 0, next = 0;
  const at = new T.Vector3();
  return {
    /** call while the walker is trying to move: (dx, dz) the wanted direction (unit), k = moved / wanted this frame */
    push(dt: number, pos: T.Vector3, dx: number, dz: number, k: number) {
      stuck = k < .3 ? stuck + dt : Math.max(0, stuck - dt * 2);
      if (stuck < .16 || cool > 0) return;
      cool = .75; stuck = 0;
      const r = rings[next++ % n]; r.life = 1; r.m.visible = true;
      at.set(pos.x + dx * .42, pos.y + .75, pos.z + dz * .42); r.m.position.copy(at);
      r.m.lookAt(at.x + dx, at.y, at.z + dz);
      o.onBump?.();
    },
    tick(dt: number) {
      cool = Math.max(0, cool - dt);
      for (const r of rings) {
        if (r.life <= 0) continue;
        r.life = Math.max(0, r.life - dt * 1.8); const k = 1 - r.life;
        r.m.scale.setScalar(.7 + k * .9);
        ((r.m.material as T.ShaderMaterial).uniforms.uOpacity.value = .9 * r.life);
        if (r.life <= 0) r.m.visible = false;
      }
    },
  };
}
