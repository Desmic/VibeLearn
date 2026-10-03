import * as T from 'three';
import type { Guide } from './guide';
import { sfx } from './sfx';

// Steered skiff flight over a set distance: the reward between islands.
// The skiff flies itself forward; you steer (left/right) and climb or dive
// (up/down). Wind rings mark the lane and give a speed burst; Warden drones
// sweep searchlights you can dodge. Nothing here can be failed: with no input
// the wind gently carries the skiff along the lane, and straying too far
// brings a stronger push back. Skill shows in rings flown and drones avoided.

interface Opts {
  guide: Guide; input: () => { x: number; y: number };
  ride: (p: T.Vector3 | null, yaw: number) => void;
  /** a ring flown through (n so far) or missed: the story's commentary */
  onRing?: (n: number) => void; onMiss?: (n: number) => void;
}
export interface FlightResult { rings: number; total: number; spotted: number }

// the lane: out over the clouds, around the west side, and in to Blossom Isle
const LANE = [
  [2, 7, -35], [-12, 10, -52], [-33, 12, -42], [-42, 13, -16], [-38, 14, 10], [-26, 12, 30], [-12, 8, 44],
].map(p => new T.Vector3(...p));
const DRONES = [[-8, 13, -58, 0], [-44, 16, -2, 1.6], [-20, 14, 38, 3]].map(p => ({ at: new T.Vector3(p[0], p[1], p[2]), ph: p[3] }));

export function buildFlight(scene: T.Scene, o: Opts) {
  const g = o.guide;
  const root = new T.Group(); root.name = 'flight'; root.visible = false; scene.add(root);
  // wind rings
  const ringMat = new T.MeshBasicMaterial({ color: '#ffe3a1', transparent: true, opacity: .85, fog: false });
  const doneMat = new T.MeshBasicMaterial({ color: '#9fe0d0', transparent: true, opacity: .35, fog: false });
  const missMat = new T.MeshBasicMaterial({ color: '#b9b0c8', transparent: true, opacity: .25, fog: false });
  const rings = LANE.map((p, i) => {
    const m = new T.Mesh(new T.TorusGeometry(2.3, .14, 8, 36), ringMat); m.position.copy(p);
    const next = LANE[i + 1] ?? new T.Vector3(0, 4, 55), prev = LANE[i - 1] ?? new T.Vector3(2.6, 4, -15);
    const dir = next.clone().sub(prev).normalize(); m.lookAt(p.clone().add(dir)); root.add(m);
    return { m, p, dir, state: 'open' as 'open' | 'hit' | 'miss' };
  });
  // Warden drones with sweeping searchlights
  const drones = DRONES.map(d => {
    const grp = new T.Group(); grp.position.copy(d.at); root.add(grp);
    grp.add(new T.Mesh(new T.SphereGeometry(.55, 14, 10), new T.MeshLambertMaterial({ color: '#2a1f40', emissive: '#4a2f7a', emissiveIntensity: .5 })));
    const eye = new T.Mesh(new T.SphereGeometry(.22, 10, 8), new T.MeshBasicMaterial({ color: '#d0a8ff' })); eye.position.z = .45; grp.add(eye);
    const cone = new T.Mesh(new T.ConeGeometry(4.5, 12, 20, 1, true), new T.MeshBasicMaterial({ color: '#c89bff', transparent: true, opacity: .16, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, fog: false }));
    cone.geometry.translate(0, -6, 0); const pivot = new T.Group(); pivot.add(cone); grp.add(pivot);
    return { ...d, grp, pivot, axis: new T.Vector3() };
  });
  // speed streaks around the skiff
  const streaks = Array.from({ length: 18 }, () => { const m = new T.Mesh(new T.BoxGeometry(.03, .03, 1.6), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5, fog: false })); root.add(m); return { m, off: new T.Vector3((Math.random() - .5) * 8, (Math.random() - .5) * 5, Math.random() * 14) }; });

  let skiff: T.Object3D | null = null, active = false, heading = 0, speed = 9, boost = 0, spotCool = 0, shake = 0, t = 0, next = 0;
  let result: FlightResult = { rings: 0, total: LANE.length, spotted: 0 }, onDone: ((r: FlightResult) => void) | null = null, landing = new T.Vector3(), landT = -1;
  const pos = new T.Vector3(), fwd = new T.Vector3(), camPos = new T.Vector3(), camLook = new T.Vector3(), tmp = new T.Vector3(), seat = new T.Vector3();
  const lengthLeft = () => { let d = pos.distanceTo(LANE[Math.min(next, LANE.length - 1)]); for (let i = next; i < LANE.length - 1; i++) d += LANE[i].distanceTo(LANE[i + 1]); return d + LANE[LANE.length - 1].distanceTo(landing); };

  return {
    get active() { return active; },
    start(boat: T.Object3D, land: T.Vector3, done: (r: FlightResult) => void) {
      skiff = boat; scene.add(boat); root.visible = true; active = true; onDone = done; landing.copy(land); landT = -1; next = 0;
      result = { rings: 0, total: LANE.length, spotted: 0 }; rings.forEach(r => { r.state = 'open'; r.m.material = ringMat; });
      pos.copy(boat.position); heading = Math.atan2(-(LANE[0].z - pos.z), LANE[0].x - pos.x); speed = 7; sfx.whoosh();
      g.setBeacon(LANE[0].clone().setY(LANE[0].y - 1.2), true); g.toast('◀ ▶ steer   ▲ ▼ climb and dive', 3200);
    },
    get shot() {
      if (!active) return null;
      return { pos: camPos, look: camLook };
    },
    tick(dt: number) {
      t += dt; if (!active || !skiff) return;
      drones.forEach(d => { d.grp.position.y = d.at.y + Math.sin(t * 1.3 + d.ph) * .6; d.pivot.rotation.set(.55 + Math.sin(t * .9 + d.ph) * .35, t * .8 + d.ph, 0); d.grp.rotation.y = Math.sin(t * .5 + d.ph) * .6; });
      rings.forEach(r => { if (r.state === 'open') r.m.rotation.z += dt * .8; });
      if (landT >= 0) {
        // glide down onto the landing pad
        landT = Math.min(1, landT + dt / 2.2); pos.lerp(tmp.copy(landing).setY(landing.y + .9), Math.min(1, dt * 2.2));
        skiff.position.copy(pos); skiff.rotation.set(0, heading, 0);
        seat.copy(pos).setY(pos.y + .1); o.ride(seat, Math.atan2(-Math.cos(heading), Math.sin(heading)));
        camLook.copy(pos); camPos.copy(pos).add(tmp.set(-Math.cos(heading) * 6, 3, Math.sin(heading) * 6));
        if (landT >= 1) { active = false; root.visible = false; o.ride(null, 0); g.setBeacon(null); onDone?.(result); }
        return;
      }
      const inp = o.input();
      // assist: with no steering input, the wind turns the skiff toward the next ring
      const target = next < LANE.length ? LANE[next] : landing.clone().setY(6);
      const want = Math.atan2(-(target.z - pos.z), target.x - pos.x);
      let dh = ((want - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const off = Math.hypot(target.x - pos.x, target.z - pos.z) > 45 ? 1.2 : inp.x ? .15 : .55;
      heading += (-inp.x * 1.5 + T.MathUtils.clamp(dh, -1, 1) * off) * dt;
      const climb = inp.y ? inp.y * 4.5 : T.MathUtils.clamp(target.y - pos.y, -2, 2) * .6;
      boost = Math.max(0, boost - dt); spotCool = Math.max(0, spotCool - dt); shake = Math.max(0, shake - dt);
      speed += ((boost > 0 ? 14 : spotCool > 1 ? 6 : 9.5) - speed) * Math.min(1, dt * 2);
      fwd.set(Math.cos(heading), 0, -Math.sin(heading));
      pos.addScaledVector(fwd, speed * dt); pos.y = T.MathUtils.clamp(pos.y + climb * dt, 3, 28);
      skiff.position.copy(pos); if (shake > 0) skiff.position.x += Math.sin(t * 60) * .08 * shake;
      skiff.rotation.set(0, heading, 0); skiff.rotateX(T.MathUtils.clamp(inp.x * .45 - dh * .1, -.5, .5)); skiff.rotateZ(climb * .04);
      seat.copy(pos).setY(pos.y + .1); o.ride(seat, Math.atan2(-fwd.x, -fwd.z));
      // rings: hit, or passed by
      if (next < rings.length) {
        const r = rings[next], d = pos.distanceTo(r.p), ahead = tmp.copy(pos).sub(r.p).dot(r.dir);
        if (d < 2.6) { r.state = 'hit'; r.m.material = doneMat; result.rings++; boost = 1.6; sfx.catch(); g.toast(`Ring ${result.rings}!`, 900); o.onRing?.(result.rings); next++; }
        else if (ahead > 0 && d < 16) { r.state = 'miss'; r.m.material = missMat; next++; o.onMiss?.(next - result.rings); }
        if (next < rings.length) g.setBeacon(LANE[next].clone().setY(LANE[next].y - 1.2), true); else g.setBeacon(landing, true);
      } else if (Math.hypot(pos.x - landing.x, pos.z - landing.z) < 14) { landT = 0; sfx.chime(); g.toast('Blossom Isle!', 1400); }
      // drones: flying through a searchlight gets you spotted (a jolt, not a fail)
      for (const d of drones) {
        d.axis.set(0, -1, 0).applyQuaternion(d.pivot.getWorldQuaternion(new T.Quaternion()));
        tmp.copy(pos).sub(d.grp.position); const dist = tmp.length();
        if (spotCool <= 0 && dist < 12.5 && tmp.normalize().dot(d.axis) > Math.cos(.36)) { spotCool = 2; shake = .8; result.spotted++; sfx.zap(); g.toast('Spotted! Dodge the lights!', 1100); g.thinkOnce('rude', 'Rude.'); g.thinkOnce('warden-flight', 'I can hear you thinking up there, courier.', 'warden'); }
      }
      g.setGoal(`Fly to the Blossom Isle · ${Math.round(lengthLeft())} m`);
      // chase camera, a little wider when fast
      const back = 6.2 + (speed - 9) * .12;
      camPos.copy(pos).addScaledVector(fwd, -back).setY(pos.y + 2.3);
      camLook.copy(pos).addScaledVector(fwd, 6).setY(pos.y + .6);
      streaks.forEach(s => { s.off.z -= speed * dt * .6; if (s.off.z < -2) s.off.z += 16; s.m.position.copy(pos).addScaledVector(fwd, s.off.z).add(tmp.set(-fwd.z * s.off.x, s.off.y, fwd.x * s.off.x)); s.m.lookAt(s.m.position.clone().add(fwd)); (s.m.material as T.MeshBasicMaterial).opacity = boost > 0 ? .7 : .25; });
    },
  };
}
