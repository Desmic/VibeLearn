import * as T from 'three';
import type { FlightText } from '../kit/lane-flight';

// The sky lanes of "The First Words": the flight out to Blossom Isle (kit/lane-flight.ts flies it),
// the Warden's drones along it, and what the flight says.

// out over the clouds, around the west side, and in to Blossom Isle
export const BLOSSOM_LANE = [
  [2, 7, -35], [-12, 10, -52], [-33, 12, -42], [-42, 13, -16], [-38, 14, 10], [-26, 12, 30], [-12, 8, 44],
].map(p => new T.Vector3(...p));
/** the Warden's drones: x, y, z, and a phase so their lights don't sweep in step */
export const BLOSSOM_DRONES: [number, number, number, number][] = [[-8, 13, -58, 0], [-44, 16, -2, 1.6], [-20, 14, 38, 3]];

export const FLIGHT_TEXT: FlightText = {
  steerTouch: 'Steer with the stick', steerKeys: 'A and D to steer · W to speed up',
  goal: 'Fly to the Blossom Isle', arrive: 'Blossom Isle!',
  ring: (n, streak) => streak >= 3 ? `Ring ${n}! · ${streak} in a row` : `Ring ${n}!`,
  spotted: 'Spotted! Dodge the lights!',
};
