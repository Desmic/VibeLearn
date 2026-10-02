import * as T from 'three';

// Things that hang and swing: bells, lanterns, signs, wind chimes. Each one is a
// pendulum around its own origin (author the pivot at the hanging point). When
// someone walks by close enough, it gets a push in the direction they're moving
// and can ring (once per push). Cheap: a couple of multiplies per object, no physics.
// Any game can reuse it.

export interface Swinger { obj: T.Object3D; ax: number; az: number; vx: number; vz: number; cool: number; i: number }
export interface SwingOpts {
  /** how close (metres, on the ground) a walker must pass to push it */
  reach?: number;
  /** stiffness and damping of the pendulum */
  k?: number; damp?: number;
  /** called when a push is strong enough to ring; i is the object's index */
  onRing?: (i: number, strength: number) => void;
}

export function createSwingers(objs: T.Object3D[], o: SwingOpts = {}) {
  const reach = o.reach ?? 1.1, k = o.k ?? 9, damp = o.damp ?? 1.2;
  const list: Swinger[] = objs.map((obj, i) => ({ obj, ax: 0, az: 0, vx: 0, vz: 0, cool: 0, i }));
  const p = new T.Vector3(), last = new T.Vector3(); let has = false;
  return {
    list,
    /** give every swinger a push (a gust, a bump, the spark landing) */
    nudge(strength = 1, ring = true) {
      for (const s of list) { s.vx += (Math.random() - .5) * 2 * strength; s.vz += (Math.random() - .5) * 2 * strength; if (ring && s.cool <= 0) { s.cool = .6; o.onRing?.(s.i, strength); } }
    },
    /** walker: world position of whoever moves past (pass null when nobody counts) */
    tick(dt: number, walker: T.Vector3 | null, t = 0) {
      if (dt <= 0) return;
      let mx = 0, mz = 0;
      if (walker && has) { mx = (walker.x - last.x) / dt; mz = (walker.z - last.z) / dt; }
      if (walker) { last.copy(walker); has = true; } else has = false;
      const speed = Math.hypot(mx, mz);
      for (const s of list) {
        s.cool = Math.max(0, s.cool - dt);
        if (walker && speed > .4) {
          s.obj.getWorldPosition(p);
          const d = Math.hypot(p.x - walker.x, p.z - walker.z);
          if (d < reach) {
            const push = (1 - d / reach) * Math.min(speed, 4) * dt * 1.2;
            // push along the walker's motion, in the swinger's parent space (approximately: world xz)
            s.vx += mx / speed * push; s.vz += mz / speed * push;
            if (s.cool <= 0 && push > .015) { s.cool = .9; o.onRing?.(s.i, Math.min(1, speed / 3)); }
          }
        }
        // a little breeze so nothing hangs dead still
        const breeze = Math.sin(t * .7 + s.i * 1.9) * .02;
        s.vx += (-k * s.ax - damp * s.vx + breeze) * dt; s.vz += (-k * s.az - damp * s.vz) * dt;
        s.ax = T.MathUtils.clamp(s.ax + s.vx * dt, -.6, .6); s.az = T.MathUtils.clamp(s.az + s.vz * dt, -.6, .6);
        // a push toward +x swings the bottom to +x (about +z); toward +z, about -x
        s.obj.rotation.set(-s.az, 0, s.ax);
      }
    },
  };
}
