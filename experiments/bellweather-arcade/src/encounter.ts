export type EncounterPhase = 'waiting' | 'awakened' | 'reunited';
export type EncounterAction = 'wake' | 'join';
export type Point2 = readonly [number, number];

export interface Encounter {
  readonly phase: EncounterPhase;
  available(position: Point2): EncounterAction | null;
  act(position: Point2): EncounterAction | null;
  reset(): void;
}

function point(value: Point2, name: string): Point2 {
  if (!Array.isArray(value) || value.length !== 2 ||
      !value.every(coordinate => typeof coordinate === 'number' && Number.isFinite(coordinate))) {
    throw new TypeError(`${name} must be a finite [x, z] position`);
  }
  return [value[0], value[1]];
}

/** The encounter changes only when the caller explicitly invokes `act` in range. */
export function createEncounter(config: {
  activation: Point2;
  reunion: Point2;
  radius: number;
}): Encounter {
  if (config === null || typeof config !== 'object') {
    throw new TypeError('encounter config is required');
  }
  const activation = point(config.activation, 'activation');
  const reunion = point(config.reunion, 'reunion');
  const radius = config.radius;
  if (typeof radius !== 'number' || !Number.isFinite(radius) || radius <= 0) {
    throw new RangeError('radius must be a positive finite number');
  }

  let phase: EncounterPhase = 'waiting';
  const near = (position: Point2, target: Point2) =>
    Math.hypot(position[0] - target[0], position[1] - target[1]) <= radius;

  const available = (position: Point2): EncounterAction | null => {
    const current = point(position, 'position');
    if (phase === 'waiting' && near(current, activation)) return 'wake';
    if (phase === 'awakened' && near(current, reunion)) return 'join';
    return null;
  };

  return Object.freeze({
    get phase(): EncounterPhase { return phase; },
    available,
    act(position: Point2): EncounterAction | null {
      const action = available(position);
      if (action === 'wake') phase = 'awakened';
      else if (action === 'join') phase = 'reunited';
      return action;
    },
    reset(): void { phase = 'waiting'; },
  });
}
