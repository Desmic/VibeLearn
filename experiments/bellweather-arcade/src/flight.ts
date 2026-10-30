import * as T from 'three';
import type { Guide } from './guide';
import { sfx } from './sfx';
import { buildLaneFlight } from './kit/lane-flight';
import { BLOSSOM_LANE, BLOSSOM_DRONES, FLIGHT_TEXT } from './worlds/first-words-flight';

// The game's flight: the kit's lane flight (kit/lane-flight.ts) with this game's lane, drones, words
// and sounds, the guide as its HUD. Each ring flown in a row rings a note higher, so a clean line
// plays a little tune, with a chime for all of them.

export type { FlightResult } from './kit/lane-flight';

interface Opts {
  guide: Guide; input: () => { x: number; y: number };
  ride: (p: T.Vector3 | null, yaw: number) => void;
  onRing?: (n: number) => void; onMiss?: (n: number) => void; onLand?: () => void; onSpotted?: (n: number) => void;
}

export function buildFlight(scene: T.Scene, o: Opts) {
  const g = o.guide;
  return buildLaneFlight(scene, {
    host: { setBeacon: (p, a) => g.setBeacon(p, a), setGoal: t => g.setGoal(t), toast: (t, ms) => g.toast(t, ms), setPointOverride: fn => g.setPointOverride(fn) },
    text: FLIGHT_TEXT, lane: BLOSSOM_LANE, drones: BLOSSOM_DRONES,
    sound: { whoosh: () => sfx.whoosh(), ring: streak => { sfx.catch(); sfx.bell(Math.min(6, streak - 1), .9); }, allRings: () => sfx.chime(), arrive: () => sfx.chime(), spotted: () => sfx.zap() },
    input: o.input, ride: o.ride, onRing: o.onRing, onMiss: o.onMiss, onLand: o.onLand, onSpotted: o.onSpotted,
  });
}
