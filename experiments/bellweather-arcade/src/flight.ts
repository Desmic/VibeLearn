import * as T from 'three';
import type { Guide } from './guide';
import { sfx } from './sfx';
import { inputMode } from './kit/input-mode';

// Steered skiff flight over a set distance: the reward between islands.
// The skiff flies itself forward and keeps the rings' height; you steer (left/right) and speed up or slow down
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
  // the rings read from far off: a bright band with a soft halo (run 23: "Didn't even know there were wind rings")
  const haloMat = new T.MeshBasicMaterial({ color: '#fff1c2', transparent: true, opacity: .22, fog: false, depthWrite: false, blending: T.AdditiveBlending });
  // the lane being flown: Blossom Isle's by default; a later hop passes its own (run 27: the hop to Loom
  // Isle was a cut, "a little disappointing after the first one")
  let LN = LANE;
  const ringGeo = new T.TorusGeometry(2.7, .2, 8, 40), haloGeo = new T.TorusGeometry(2.7, .55, 6, 40);
  const makeRings = (pts: T.Vector3[], from: T.Vector3, to: T.Vector3) => pts.map((p, i) => {
    const m = new T.Mesh(ringGeo, ringMat); m.position.copy(p);
    const halo = new T.Mesh(haloGeo, haloMat); m.add(halo);
    const next = pts[i + 1] ?? to, prev = pts[i - 1] ?? from;
    const dir = next.clone().sub(prev).normalize(); m.lookAt(p.clone().add(dir)); root.add(m);
    return { m, halo, p, dir, state: 'open' as 'open' | 'hit' | 'miss' };
  });
  let rings = makeRings(LANE, new T.Vector3(2.6, 4, -15), new T.Vector3(0, 4, 55)), dronesOn = true, landName = 'Blossom Isle!', goalText = 'Fly to the Blossom Isle';
  // the wind's lane: a ribbon of motes drifting from ring to ring, so the way reads before the first
  // ring is reached (and a skiff that strays sees where the lane went)
  const MOTES = 240, motePos = new Float32Array(MOTES * 3), moteGeo = new T.BufferGeometry(); moteGeo.setAttribute('position', new T.BufferAttribute(motePos, 3));
  const dot = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const c = cv.getContext('2d')!, gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(.4, 'rgba(255,236,180,.55)'); gr.addColorStop(1, 'rgba(255,236,180,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; return tx; })();
  const motes = new T.Points(moteGeo, new T.PointsMaterial({ map: dot, size: .55, transparent: true, opacity: .8, depthWrite: false, fog: false, blending: T.AdditiveBlending })); motes.frustumCulled = false; root.add(motes);
  let lane: T.CatmullRomCurve3 | null = null, laneT: number[] = [], laneU = 0;
  const moteSeed = Array.from({ length: MOTES }, (_, i) => [(i * .618) % 1, Math.sin(i * 12.9) * .5, Math.cos(i * 7.3) * .5]);
  // Warden drones with sweeping searchlights
  // (bigger, with a blinking eye and a brighter beam: run 22 was "spotted by drones" with no drone seen)
  const drones = DRONES.map(d => {
    const grp = new T.Group(); grp.position.copy(d.at); root.add(grp);
    grp.add(new T.Mesh(new T.SphereGeometry(.95, 16, 12), new T.MeshLambertMaterial({ color: '#2a1f40', emissive: '#4a2f7a', emissiveIntensity: .6 })));
    for (const s of [-1, 1]) { const fin = new T.Mesh(new T.BoxGeometry(.9, .08, .5), new T.MeshLambertMaterial({ color: '#3b2766', emissive: '#7b4fd6', emissiveIntensity: .4 })); fin.position.set(s * 1.1, .1, 0); fin.rotation.z = s * .3; grp.add(fin); }
    const eye = new T.Mesh(new T.SphereGeometry(.36, 12, 10), new T.MeshBasicMaterial({ color: '#e2c6ff' })); eye.position.z = .75; grp.add(eye);
    const cone = new T.Mesh(new T.ConeGeometry(4.5, 12, 20, 1, true), new T.MeshBasicMaterial({ color: '#c89bff', transparent: true, opacity: .26, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, fog: false }));
    cone.geometry.translate(0, -6, 0); const pivot = new T.Group(); pivot.add(cone); grp.add(pivot);
    return { ...d, grp, pivot, eye, axis: new T.Vector3() };
  });
  // speed streaks around the skiff
  const streaks = Array.from({ length: 18 }, () => { const m = new T.Mesh(new T.BoxGeometry(.03, .03, 1.6), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5, fog: false })); root.add(m); return { m, off: new T.Vector3((Math.random() - .5) * 8, (Math.random() - .5) * 5, Math.random() * 14) }; });

  let skiff: T.Object3D | null = null, active = false, heading = 0, speed = 9, boost = 0, spotCool = 0, shake = 0, t = 0, next = 0, aimT = 0, turnV = 0;
  let result: FlightResult = { rings: 0, total: LANE.length, spotted: 0 }, onDone: ((r: FlightResult) => void) | null = null, landing = new T.Vector3(), landT = -1;
  const leadV = new T.Vector3(), pos = new T.Vector3(), fwd = new T.Vector3(), camPos = new T.Vector3(), camLook = new T.Vector3(), tmp = new T.Vector3(), seat = new T.Vector3();
  const lengthLeft = () => { let d = pos.distanceTo(LN[Math.min(next, LN.length - 1)]); for (let i = next; i < LN.length - 1; i++) d += LN[i].distanceTo(LN[i + 1]); return d + LN[LN.length - 1].distanceTo(landing); };

  const api = {
    get active() { return active; },
    /** for probes: rings so far, the next ring, spotted count */
    get state() { return { ...result, next, landing: landT >= 0 }; },
    start(boat: T.Object3D, land: T.Vector3, done: (r: FlightResult) => void, opts: { lane?: T.Vector3[]; drones?: boolean; arrive?: string; goal?: string } = {}) {
      skiff = boat; scene.add(boat); root.visible = true; active = true; onDone = done; landing.copy(land); landT = -1; next = 0;
      if ((opts.lane ?? LANE) !== LN) { for (const r of rings) root.remove(r.m); LN = opts.lane ?? LANE; rings = makeRings(LN, boat.position.clone(), land.clone().setY(land.y + 3)); }
      dronesOn = opts.drones ?? true; landName = opts.arrive ?? 'Blossom Isle!'; goalText = opts.goal ?? 'Fly to the Blossom Isle'; drones.forEach(d => (d.grp.visible = dronesOn));
      result = { rings: 0, total: LN.length, spotted: 0 }; rings.forEach(r => { r.state = 'open'; r.m.material = ringMat; });
      pos.copy(boat.position); heading = Math.atan2(-(LN[0].z - pos.z), LN[0].x - pos.x); speed = 7; aimT = 0; turnV = 0; laneU = 0; leadV.set(Math.cos(heading), 0, -Math.sin(heading)); sfx.whoosh();
      lane = new T.CatmullRomCurve3([pos.clone(), ...LN, land.clone().setY(land.y + 3)]); const L = lane.getLength();
      laneT = LN.map(p => { let best = 0, bd = 1e9; for (let i = 0; i <= 200; i++) { const d = lane!.getPoint(i / 200).distanceTo(p); if (d < bd) { bd = d; best = i / 200; } } return best; }); void L;
      g.setBeacon(LN[0].clone().setY(LN[0].y - 1.2), true); g.toast(inputMode.touch ? 'Steer with the stick' : 'A and D to steer · W to speed up', 3200);
      // the goal arrow in the air turns the skiff onto the lane, not the camera (run 23: "the
      // turn-to-goal button never actually points me at the goal")
      g.setPointOverride(() => { aimT = 1.3; sfx.whoosh(); });
    },
    get shot() {
      if (!active) return null;
      return { pos: camPos, look: camLook };
    },
    tick(dt: number) {
      t += dt; if (!active || !skiff) return;
      drones.forEach(d => { d.eye.visible = Math.sin(t * 5 + d.ph) > -.6; d.grp.position.y = d.at.y + Math.sin(t * 1.3 + d.ph) * .6; d.pivot.rotation.set(.55 + Math.sin(t * .9 + d.ph) * .35, t * .8 + d.ph, 0); d.grp.rotation.y = Math.sin(t * .5 + d.ph) * .6; });
      rings.forEach((r, i) => { if (r.state === 'open') { r.m.rotation.z += dt * .8; r.halo.visible = i === next; r.halo.scale.setScalar(1 + Math.sin(t * 3) * .06); } else r.halo.visible = false; });
      // the motes drift along the lane from where the skiff is to the end
      if (lane) { let bu = laneU, bd = 1e9; for (let k = -10; k <= 10; k++) { const u = T.MathUtils.clamp(laneU + k * .005, 0, 1), d = lane.getPoint(u).distanceToSquared(pos); if (d < bd) { bd = d; bu = u; } } laneU = bu;
        const from = Math.min(1, laneU + .035), span = 1 - from;   // from a little ahead of the skiff (motes by the lens would be blots)
        for (let i = 0; i < MOTES; i++) { const sd = moteSeed[i], u = from + ((sd[0] + t * .025) % 1) * span, q = lane.getPoint(Math.min(1, u)); motePos[i * 3] = q.x + sd[1]; motePos[i * 3 + 1] = q.y - 1 + sd[2]; motePos[i * 3 + 2] = q.z + sd[1] * sd[2]; }
        moteGeo.attributes.position.needsUpdate = true; }
      if (landT >= 0) {
        // glide down onto the landing pad
        landT = Math.min(1, landT + dt / 2.2); pos.lerp(tmp.copy(landing).setY(landing.y + .9), Math.min(1, dt * 2.2));
        skiff.position.copy(pos); skiff.rotation.set(0, heading, 0);
        seat.copy(pos).setY(pos.y + .1); o.ride(seat, Math.atan2(-Math.cos(heading), Math.sin(heading)));
        camLook.copy(pos); camPos.copy(pos).add(tmp.set(-Math.cos(heading) * 6, 3, Math.sin(heading) * 6));
        if (landT >= 1) { active = false; root.visible = false; o.ride(null, 0); g.setBeacon(null); g.setPointOverride(null); onDone?.(result); }
        return;
      }
      const inp = o.input();
      // assist: with no steering input, the wind turns the skiff toward the next ring
      const target = next < LN.length ? LN[next] : landing.clone().setY(landing.y + 6);
      const want = Math.atan2(-(target.z - pos.z), target.x - pos.x);
      let dh = ((want - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      // steering eases in and turns at most ~55°/s (it was 86°/s at once: a two-second push swung the
      // skiff right round, and testers flying in pushes never got back to the lane: flightprobe);
      // the wind keeps helping while the push agrees with it
      turnV += (-inp.x * .95 - turnV) * Math.min(1, dt * 4);
      const agrees = Math.sign(-inp.x) === Math.sign(dh), far = Math.hypot(target.x - pos.x, target.z - pos.z) > 45;
      const off = aimT > 0 ? 2.6 : far ? 1.2 : !inp.x ? .45 : agrees ? .5 : .22;
      aimT = Math.max(0, aimT - dt);
      heading += ((aimT > 0 ? 0 : turnV) + T.MathUtils.clamp(dh, -1, 1) * off) * dt;
      // up on the stick is "go", not "climb": a blind tester held it forward and rose away from the
      // rings, watching the distance grow (5 Oct). The skiff keeps the rings' height by itself;
      // forward speeds up, back slows down
      const climb = T.MathUtils.clamp(target.y - pos.y, -2, 2) * .9;
      boost = Math.max(0, boost - dt); spotCool = Math.max(0, spotCool - dt); shake = Math.max(0, shake - dt);
      speed += ((boost > 0 ? 14 : spotCool > 1 ? 6 : 9.5 + inp.y * 3.5) - speed) * Math.min(1, dt * 2);
      fwd.set(Math.cos(heading), 0, -Math.sin(heading));
      pos.addScaledVector(fwd, speed * dt); pos.y = T.MathUtils.clamp(pos.y + climb * dt, 3, 28);
      skiff.position.copy(pos); if (shake > 0) skiff.position.x += Math.sin(t * 60) * .08 * shake;
      skiff.rotation.set(0, heading, 0); skiff.rotateX(T.MathUtils.clamp(inp.x * .45 - dh * .1, -.5, .5)); skiff.rotateZ(climb * .04);
      seat.copy(pos).setY(pos.y + .1); o.ride(seat, Math.atan2(-fwd.x, -fwd.z));
      // rings: close to one and still before it, the wind draws the skiff in (a generous catch, as a
      // wind ring should be); then hit, or passed by
      if (next < rings.length) {
        const r = rings[next], d = pos.distanceTo(r.p), ahead = tmp.copy(pos).sub(r.p).dot(r.dir);
        if (ahead < 0 && d < 7) { const side = tmp.copy(pos).sub(r.p).addScaledVector(r.dir, -tmp.dot(r.dir)); if (side.length() < 5) pos.addScaledVector(side, -Math.min(1, dt * 1.6)); }
        if (d < 3.1) { r.state = 'hit'; r.m.material = doneMat; result.rings++; boost = 1.6; sfx.catch(); g.toast(`Ring ${result.rings}!`, 900); o.onRing?.(result.rings); next++; }
        else if (ahead > 0 && d < 16) { r.state = 'miss'; r.m.material = missMat; next++; o.onMiss?.(next - result.rings); }
        if (next < rings.length) g.setBeacon(LN[next].clone().setY(LN[next].y - 1.2), true); else g.setBeacon(landing, true);
      } else if (Math.hypot(pos.x - landing.x, pos.z - landing.z) < 14) { landT = 0; sfx.chime(); g.toast(landName, 1400); }
      // drones: flying through a searchlight gets you spotted (a jolt, not a fail)
      for (const d of dronesOn ? drones : []) {
        d.axis.set(0, -1, 0).applyQuaternion(d.pivot.getWorldQuaternion(new T.Quaternion()));
        tmp.copy(pos).sub(d.grp.position); const dist = tmp.length();
        if (spotCool <= 0 && dist < 12.5 && tmp.normalize().dot(d.axis) > Math.cos(.36)) { spotCool = 2; shake = .8; result.spotted++; sfx.zap(); g.toast('Spotted! Dodge the lights!', 1100); g.thinkOnce('rude', 'Rude.'); g.thinkOnce('warden-flight', 'I can hear you thinking up there, courier.', 'warden'); }
      }
      g.setGoal(`${goalText} · ${Math.round(lengthLeft())} m`);
      // chase camera, a little wider when fast
      const back = 6.2 + (speed - 9) * .12;
      // and leaning toward the next ring, so the way on is in view before the skiff turns to it
      // (run 23 flew with the ring off screen, "the arrow is still off to the left")
      const lead = tmp.copy(target).sub(pos).setY(0); const ld = lead.length(); lead.normalize();
      const w = ld > 4 ? .38 : 0; leadV.lerp(tmp.set(fwd.x * (1 - w) + lead.x * w, 0, fwd.z * (1 - w) + lead.z * w), Math.min(1, dt * 2.5));   // eased, so a passed ring doesn't jerk the view
      const vl = Math.hypot(leadV.x, leadV.z) || 1, vx = leadV.x, vz = leadV.z;
      camPos.copy(pos).add(tmp.set(-vx / vl * back, 0, -vz / vl * back)).setY(pos.y + 2.3);
      camLook.copy(pos).add(tmp.set(vx / vl * 6, 0, vz / vl * 6)).setY(pos.y + .6);
      streaks.forEach(s => { s.off.z -= speed * dt * .6; if (s.off.z < -2) s.off.z += 16; s.m.position.copy(pos).addScaledVector(fwd, s.off.z).add(tmp.set(-fwd.z * s.off.x, s.off.y, fwd.x * s.off.x)); s.m.lookAt(s.m.position.clone().add(fwd)); (s.m.material as T.MeshBasicMaterial).opacity = boost > 0 ? .7 : .25; });
    },
  };
  (window as unknown as { __vlFlight?: typeof api }).__vlFlight = api;
  return api;
}
