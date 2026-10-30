import * as T from 'three';
import { inputMode } from './input-mode';

// A steered flight along a lane between two places: the reward between islands.
// The wind carries the craft along a lane (it can't be lost or flown away from); the stick slides it
// across the lane, left and right, up to nine metres either side, and forward/back speeds up or slows
// down. Wind rings sit off to one side or the other of the lane and give a speed burst; drones sweep
// searchlights you can dodge. Nothing here can be failed: hands off, the craft drifts back to the
// middle of the lane and lands. Skill shows in rings flown and drones avoided. On landing the camera
// rises and draws back to show the place before the rider steps off.
// Game-agnostic: the game gives the lanes, the drones, the words shown, the sounds, and a host for
// the goal line, beacon and toasts (kit/README: the guide implements it).
// (It steered by heading before, with the wind turning it back: flown in pushes, as blind testers
// fly, a two-second push swung it round in 30 m loops and it took 77 s to land, 2 rings of 7:
// flightprobe. And hands off, the wind's pull caught most rings anyway: nothing to do.)

/** what the flight needs from the game's HUD */
export interface FlightHost {
  setBeacon(p: T.Vector3 | null, arrowOnly?: boolean): void;
  setGoal(text: string): void;
  toast(text: string, ms: number): void;
  /** the goal arrow's tap does this instead of turning the view (null: back to normal) */
  setPointOverride(fn: (() => void) | null): void;
}
export interface FlightText {
  steerTouch: string; steerKeys: string;
  /** the goal line while flying (the distance left is added) and the toast on arrival, unless start() names them */
  goal: string; arrive: string;
  ring: (n: number, streak: number) => string;
  spotted: string;
}
export interface FlightSound { whoosh?(): void; ring?(streak: number): void; allRings?(): void; arrive?(): void; spotted?(): void }
interface Opts {
  host: FlightHost; text: FlightText; sound?: FlightSound;
  /** the default lane and its drones: [x, y, z, phase] */
  lane: T.Vector3[]; drones?: [number, number, number, number][];
  input: () => { x: number; y: number };
  ride: (p: T.Vector3 | null, yaw: number) => void;
  /** a ring flown through (n so far) or missed: the story's commentary */
  onRing?: (n: number) => void; onMiss?: (n: number) => void;
  /** the craft starts down onto the landing (the arrival shot begins) */
  onLand?: () => void;
  /** caught in a searchlight (n times so far) */
  onSpotted?: (n: number) => void;
}
export interface FlightResult { rings: number; total: number; spotted: number }

export function buildLaneFlight(scene: T.Scene, o: Opts) {
  const g = o.host, sfx = o.sound ?? {}, LANE = o.lane;
  const DRONES = (o.drones ?? []).map(p => ({ at: new T.Vector3(p[0], p[1], p[2]), ph: p[3] }));
  const root = new T.Group(); root.name = 'flight'; root.visible = false; scene.add(root);
  // wind rings
  const ringMat = new T.MeshBasicMaterial({ color: '#ffe3a1', transparent: true, opacity: .85, fog: false });
  const doneMat = new T.MeshBasicMaterial({ color: '#9fe0d0', transparent: true, opacity: .35, fog: false });
  const missMat = new T.MeshBasicMaterial({ color: '#b9b0c8', transparent: true, opacity: .25, fog: false });
  // the rings read from far off: a bright band with a soft halo (run 23: "Didn't even know there were wind rings")
  const haloMat = new T.MeshBasicMaterial({ color: '#fff1c2', transparent: true, opacity: .22, fog: false, depthWrite: false, blending: T.AdditiveBlending });
  // the lane being flown: the default one, or the one start() passes (run 27: a later hop was a cut,
  // "a little disappointing after the first one")
  let LN: T.Vector3[] | null = null;
  const ringGeo = new T.TorusGeometry(2.7, .2, 8, 40), haloGeo = new T.TorusGeometry(2.7, .55, 6, 40);
  // where each ring sits across the lane (metres to the right): the first and last on the line, the
  // rest swinging side to side, so a ring is something to steer for
  const ringSide = (i: number, n: number) => i === 0 || i === n - 1 ? 0 : (i % 2 ? 1 : -1) * (3.2 + (i * 1.37 % 1.6));
  const makeRings = (pts: T.Vector3[], from: T.Vector3, to: T.Vector3) => pts.map((p, i) => {
    const next = pts[i + 1] ?? to, prev = pts[i - 1] ?? from;
    const dir = next.clone().sub(prev).normalize(), side = ringSide(i, pts.length);
    const at = p.clone().add(new T.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(side));
    const m = new T.Mesh(ringGeo, ringMat); m.position.copy(at);
    const halo = new T.Mesh(haloGeo, haloMat); m.add(halo);
    m.lookAt(at.clone().add(dir)); root.add(m);
    return { m, halo, p: at, dir, side, u: 0, state: 'open' as 'open' | 'hit' | 'miss', burst: -1, bmat: null as T.MeshBasicMaterial | null };
  });
  let rings: ReturnType<typeof makeRings> = [], dronesOn = true, landName = o.text.arrive, goalText = o.text.goal;
  // the wind's lane: a ribbon of motes drifting from ring to ring, so the way reads before the first
  // ring is reached (and a craft that strays sees where the lane went)
  const MOTES = 240, motePos = new Float32Array(MOTES * 3), moteGeo = new T.BufferGeometry(); moteGeo.setAttribute('position', new T.BufferAttribute(motePos, 3));
  const dot = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const c = cv.getContext('2d')!, gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(.4, 'rgba(255,236,180,.55)'); gr.addColorStop(1, 'rgba(255,236,180,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; return tx; })();
  const motes = new T.Points(moteGeo, new T.PointsMaterial({ map: dot, size: .55, transparent: true, opacity: .8, depthWrite: false, fog: false, blending: T.AdditiveBlending })); motes.frustumCulled = false; root.add(motes);
  let lane: T.CatmullRomCurve3 | null = null, laneU = 0;
  const moteSeed = Array.from({ length: MOTES }, (_, i) => [(i * .618) % 1, Math.sin(i * 12.9) * .5, Math.cos(i * 7.3) * .5]);
  // drones with sweeping searchlights
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
  // speed streaks around the craft
  const streaks = Array.from({ length: 18 }, () => { const m = new T.Mesh(new T.BoxGeometry(.03, .03, 1.6), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5, fog: false })); root.add(m); return { m, off: new T.Vector3((Math.random() - .5) * 8, (Math.random() - .5) * 5, Math.random() * 14) }; });

  let streak = 0, reveal: T.Vector3 | null = null;   // rings flown in a row: each rings a note higher, so a clean line plays a little tune
  let craft: T.Object3D | null = null, active = false, heading = 0, speed = 9, boost = 0, spotCool = 0, shake = 0, t = 0, next = 0, aimT = 0;
  let u = 0, laneL = 1, side = 0, sideV = 0;   // how far along the lane (0..1), its length, and where across it
  let result: FlightResult = { rings: 0, total: LANE.length, spotted: 0 }, onDone: ((r: FlightResult) => void) | null = null, landing = new T.Vector3(), landT = -1;
  const tmp2 = new T.Vector3(), tmp3 = new T.Vector3(), leadV = new T.Vector3(), pos = new T.Vector3(), fwd = new T.Vector3(), camPos = new T.Vector3(), camLook = new T.Vector3(), tmp = new T.Vector3(), seat = new T.Vector3();
  const lengthLeft = () => (1 - u) * laneL + 3;
  const tg = new T.Vector3(), right = new T.Vector3();

  const api = {
    get active() { return active; },
    /** for probes: rings so far, the next ring, spotted count */
    get state() { return { ...result, next, landing: landT >= 0, side: +side.toFixed(2), ringSide: rings[next]?.side ?? 0 }; },
    start(boat: T.Object3D, land: T.Vector3, done: (r: FlightResult) => void, opts: { lane?: T.Vector3[]; drones?: boolean; arrive?: string; goal?: string; reveal?: T.Vector3 } = {}) {
      craft = boat; scene.add(boat); root.visible = true; active = true; onDone = done; landing.copy(land); landT = -1; next = 0;
      if ((opts.lane ?? LANE) !== LN) { for (const r of rings) root.remove(r.m); LN = opts.lane ?? LANE; rings = makeRings(LN, boat.position.clone(), land.clone().setY(land.y + 3)); }
      const LNs = LN!;
      dronesOn = opts.drones ?? true; reveal = opts.reveal ?? null; landName = opts.arrive ?? o.text.arrive; goalText = opts.goal ?? o.text.goal; drones.forEach(d => (d.grp.visible = dronesOn));
      result = { rings: 0, total: LNs.length, spotted: 0 }; rings.forEach(r => { r.state = 'open'; r.m.material = ringMat; r.burst = -1; r.m.scale.setScalar(1); }); streak = 0;
      pos.copy(boat.position); heading = Math.atan2(-(LNs[0].z - pos.z), LNs[0].x - pos.x); speed = 7; aimT = 0; u = 0; side = 0; sideV = 0; laneU = 0; leadV.set(Math.cos(heading), 0, -Math.sin(heading)); sfx.whoosh?.();
      lane = new T.CatmullRomCurve3([pos.clone(), ...LNs, land.clone().setY(land.y + 3)]); laneL = lane.getLength();
      // each ring's place along the lane (by distance flown)
      rings.forEach((r, i) => { let best = 0, bd = 1e9; for (let k = 0; k <= 400; k++) { const d = lane!.getPointAt(k / 400).distanceToSquared(LNs[i]); if (d < bd) { bd = d; best = k / 400; } } r.u = best; });
      g.setBeacon(rings[0].p.clone().setY(rings[0].p.y - 1.2), true); g.toast(inputMode.touch ? o.text.steerTouch : o.text.steerKeys, 3200);
      // the goal arrow in the air slides the craft across to the next ring, not the camera (run 23: "the
      // turn-to-goal button never actually points me at the goal")
      g.setPointOverride(() => { aimT = 1; sfx.whoosh?.(); });   // held until that ring is flown or passed
    },
    get shot() {
      if (!active) return null;
      return { pos: camPos, look: camLook };
    },
    tick(dt: number) {
      t += dt; if (!active || !craft) return;
      drones.forEach(d => { d.eye.visible = Math.sin(t * 5 + d.ph) > -.6; d.grp.position.y = d.at.y + Math.sin(t * 1.3 + d.ph) * .6; d.pivot.rotation.set(.55 + Math.sin(t * .9 + d.ph) * .35, t * .8 + d.ph, 0); d.grp.rotation.y = Math.sin(t * .5 + d.ph) * .6; });
      rings.forEach((r, i) => {
        // a ring flown through blooms outward and fades (it only went grey before: nothing to see)
        if (r.burst >= 0) { r.burst += dt; const k = Math.min(1, r.burst / .55); r.m.scale.setScalar(1 + k * .8); r.bmat!.opacity = .9 * (1 - k);
          if (k >= 1) { r.burst = -1; r.m.scale.setScalar(1); r.m.material = doneMat; r.bmat!.dispose(); r.bmat = null; } }
        if (r.state === 'open') { r.m.rotation.z += dt * .8; r.halo.visible = i === next; r.halo.scale.setScalar(1 + Math.sin(t * 3) * .06); } else r.halo.visible = false; });
      // the motes drift along the lane from where the craft is to the end
      if (lane) { let bu = laneU, bd = 1e9; for (let k = -10; k <= 10; k++) { const u = T.MathUtils.clamp(laneU + k * .005, 0, 1), d = lane.getPoint(u).distanceToSquared(pos); if (d < bd) { bd = d; bu = u; } } laneU = bu;
        const from = Math.min(1, laneU + .035), span = 1 - from;   // from a little ahead of the craft (motes by the lens would be blots)
        for (let i = 0; i < MOTES; i++) { const sd = moteSeed[i], u = from + ((sd[0] + t * .025) % 1) * span, q = lane.getPoint(Math.min(1, u)); motePos[i * 3] = q.x + sd[1]; motePos[i * 3 + 1] = q.y - 1 + sd[2]; motePos[i * 3 + 2] = q.z + sd[1] * sd[2]; }
        moteGeo.attributes.position.needsUpdate = true; }
      if (landT >= 0) {
        // glide down onto the landing pad
        streaks.forEach(s => (s.m.visible = false));   // (left where the flight ended, they'd hang by the lens as it swings round)
        landT = Math.min(1, landT + dt / 3.4); pos.lerp(tmp.copy(landing).setY(landing.y + .9), Math.min(1, dt * 1.8));
        craft.position.copy(pos); craft.rotation.set(0, heading, 0);
        seat.copy(pos).setY(pos.y + .1); o.ride(seat, Math.atan2(-Math.cos(heading), Math.sin(heading)));
        // the arrival: the chase camera rises and draws back to show the whole place, the way on
        // beyond it, before the rider steps off (a place should arrive like a place, not a cut)
        // (toward what the place is about, when the game says; else on the way the craft was going)
        const a = reveal ? tmp2.copy(reveal).sub(landing).setY(0).normalize() : tmp2.set(Math.cos(heading), 0, -Math.sin(heading)), k = T.MathUtils.smootherstep(landT, .08, .75);
        const far = reveal ? Math.min(14, Math.hypot(reveal.x - landing.x, reveal.z - landing.z)) : 10;
        camLook.copy(pos).lerp(tmp.copy(landing).addScaledVector(a, far * .7).setY(landing.y + 2.4), k);
        camPos.copy(pos).add(tmp.set(-Math.cos(heading) * 6, 3, Math.sin(heading) * 6)).lerp(tmp.copy(landing).addScaledVector(a, -8).add(tmp3.set(-a.z * 3.5, 6.5, a.x * 3.5)), k);
        if (landT >= 1) { active = false; root.visible = false; o.ride(null, 0); g.setBeacon(null); g.setPointOverride(null); onDone?.(result); }
        return;
      }
      const inp = o.input();
      // across the lane: the stick slides the craft (eased, so a tap is a nudge and a hold a sweep);
      // hands off it drifts back to the middle; the goal arrow slides it to the next ring
      const ring = next < rings.length ? rings[next] : null;
      if (inp.x) aimT = 0;   // the stick takes over from the arrow
      const wantV = aimT > 0 && ring ? T.MathUtils.clamp((ring.side - side) * 3, -8, 8) : inp.x ? inp.x * 7 : -side * .35;
      sideV += (wantV - sideV) * Math.min(1, dt * 5);
      side = T.MathUtils.clamp(side + sideV * dt, -9, 9); if (Math.abs(side) >= 9) sideV = 0;
      boost = Math.max(0, boost - dt); spotCool = Math.max(0, spotCool - dt); shake = Math.max(0, shake - dt);
      speed += ((boost > 0 ? 14 : spotCool > 1 ? 6 : 9.5 + inp.y * 3.5) - speed) * Math.min(1, dt * 2);
      // a ring just ahead and nearly lined up draws the craft in the last little way (a generous catch,
      // as a wind ring should be; a miss by a craft's width is a catch, a miss by a lane's half is not)
      if (ring) { const ahead = (ring.u - u) * laneL; if (ahead > 0 && ahead < 8 && Math.abs(ring.side - side) < 2.4) side += (ring.side - side) * Math.min(1, dt * 3); }
      u = Math.min(1, u + speed * dt / laneL);
      lane!.getPointAt(u, pos); lane!.getTangentAt(u, tg); right.set(-tg.z, 0, tg.x).normalize(); pos.addScaledVector(right, side);
      fwd.set(tg.x, 0, tg.z).normalize().multiplyScalar(speed).addScaledVector(right, sideV).normalize();
      heading = Math.atan2(-fwd.z, fwd.x);
      craft.position.copy(pos); if (shake > 0) craft.position.x += Math.sin(t * 60) * .08 * shake;
      craft.rotation.set(0, heading, 0); craft.rotateX(T.MathUtils.clamp(sideV * .065, -.5, .5)); craft.rotateZ(T.MathUtils.clamp(tg.y * .8, -.3, .3));
      seat.copy(pos).setY(pos.y + .1); o.ride(seat, Math.atan2(-fwd.x, -fwd.z));
      // rings: flown through as the craft passes it, or passed by
      if (ring) {
        const along = (u - ring.u) * laneL;
        if (along > -1.5 && pos.distanceTo(ring.p) < 3.1) { ring.state = 'hit'; ring.bmat = ringMat.clone(); ring.m.material = ring.bmat; ring.burst = 0; result.rings++; streak++; boost = 1.6; sfx.ring?.(streak);
          if (streak === rings.length) setTimeout(() => sfx.allRings?.(), 350);
          g.toast(o.text.ring(result.rings, streak), 900); o.onRing?.(result.rings); next++; aimT = 0; }
        else if (along > 1.5) { ring.state = 'miss'; streak = 0; ring.m.material = missMat; next++; o.onMiss?.(next - result.rings); aimT = 0; }
        if (next < rings.length) g.setBeacon(rings[next].p.clone().setY(rings[next].p.y - 1.2), true); else g.setBeacon(landing, true);
      } else if ((1 - u) * laneL < 10) { landT = 0; sfx.arrive?.(); g.toast(landName, 1400); o.onLand?.(); }
      // drones: flying through a searchlight gets you spotted (a jolt, not a fail)
      for (const d of dronesOn ? drones : []) {
        d.axis.set(0, -1, 0).applyQuaternion(d.pivot.getWorldQuaternion(new T.Quaternion()));
        tmp.copy(pos).sub(d.grp.position); const dist = tmp.length();
        if (spotCool <= 0 && dist < 12.5 && tmp.normalize().dot(d.axis) > Math.cos(.36)) { spotCool = 2; shake = .8; result.spotted++; sfx.spotted?.(); g.toast(o.text.spotted, 1100); o.onSpotted?.(result.spotted); }
      }
      g.setGoal(`${goalText} · ${Math.round(lengthLeft())} m`);
      // chase camera behind the craft, along the lane (so a slide across reads as a slide), a little
      // wider when fast; looking down the lane ahead, so the next ring and the bend are in view
      const back = 6.2 + (speed - 9) * .12;
      leadV.lerp(tmp.set(tg.x, 0, tg.z).normalize(), Math.min(1, dt * 2.5));
      const vl = Math.hypot(leadV.x, leadV.z) || 1, vx = leadV.x / vl, vz = leadV.z / vl;
      camPos.copy(pos).add(tmp.set(-vx * back, 0, -vz * back)).addScaledVector(right, -side * .25).setY(pos.y + 2.3);
      lane!.getPointAt(Math.min(1, u + 10 / laneL), camLook).addScaledVector(right, side * .6); camLook.y = Math.min(camLook.y, pos.y + 1) + .2;
      streaks.forEach(s => { s.m.visible = true; s.off.z -= speed * dt * .6; if (s.off.z < -2) s.off.z += 16; s.m.position.copy(pos).addScaledVector(fwd, s.off.z).add(tmp.set(-fwd.z * s.off.x, s.off.y, fwd.x * s.off.x)); s.m.lookAt(s.m.position.clone().add(fwd)); (s.m.material as T.MeshBasicMaterial).opacity = boost > 0 ? .7 : .25; });
    },
  };
  (window as unknown as { __vlFlight?: typeof api }).__vlFlight = api;   // test hook (flightprobe, flowcheck)
  return api;
}
