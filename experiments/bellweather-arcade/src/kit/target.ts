// What the action prompt is about: of the things in reach, the one the player is looking at
// wins (the smallest angle within a cone of the camera's look direction), then the nearest.
// Things that line up with it (within `tie`) defer to the higher `priority`.
// As in BotW: turn the camera to pick. "Nearest wins" made a decoy one step closer the only
// thing the action button could take (quality/escapes.json: qe-nearest-not-aimed).
// Game-agnostic and pure: every prompt (words, notes, people, stations) uses it.

export interface Candidate<T> { item: T; x: number; z: number; /** reach in metres */ r: number;
  /** when two aimed things line up (angles within `tie`), the higher priority wins, then the nearer
   *  (e.g. a word on a hull just behind the stone that opens the engine) */
  priority?: number }

/** the picked candidate, or null when nothing is in reach.
 *  `from`: the player's position; `look`: the camera's look direction on the ground (x, z;
 *  need not be normalised); `cone`: half-angle in radians that counts as "aimed at" (default .6, ~35°). */
export function pickTarget<T>(cands: Iterable<Candidate<T>>, from: { x: number; z: number }, look: { x: number; z: number } | null, cone = .6, tie = .15): { item: T; d: number; aimed: boolean } | null {
  const ll = look ? Math.hypot(look.x, look.z) : 0, lx = ll ? look!.x / ll : 0, lz = ll ? look!.z / ll : 0;
  const inReach: { c: Candidate<T>; d: number; ang: number; aimed: boolean }[] = [];
  for (const c of cands) {
    const dx = c.x - from.x, dz = c.z - from.z, d = Math.hypot(dx, dz); if (d >= c.r) continue;
    const ang = ll && d > .01 ? Math.acos(Math.max(-1, Math.min(1, (dx * lx + dz * lz) / d))) : 0;
    inReach.push({ c, d, ang, aimed: !!ll && (d <= .01 || ang < cone) });
  }
  if (!inReach.length) return null;
  const aimed = inReach.filter(x => x.aimed);
  let best;
  if (aimed.length) {
    // any aimed thing beats any merely near one; among aimed, the most centred, unless others line up with it
    const top = Math.min(...aimed.map(x => x.ang));
    best = aimed.filter(x => x.ang <= top + tie).sort((a, b) => (b.c.priority ?? 0) - (a.c.priority ?? 0) || a.ang - b.ang)[0];
  } else best = inReach.reduce((p, x) => x.d < p.d ? x : p);
  return { item: best.c.item, d: best.d, aimed: best.aimed };
}
