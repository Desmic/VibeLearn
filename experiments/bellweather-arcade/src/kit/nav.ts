// Finding the way on foot: a grid search over a game's own "can I stand here?" test, then the
// path pulled straight wherever there is a clear line. Game-agnostic: the game gives `walk(x, z)`.
//
// Used for tap-to-walk (blind runs 15-17: a straight line to the tapped spot ran into walls and
// "sent me to odd places") and for the goal arrow, which now faces the way to go rather than the
// goal itself through a wall (run 17: "Turn toward the goal pointed at a glass wall").

export type XZ = [number, number];
export type Walk = (x: number, z: number) => boolean;

/** a straight line is clear when every point along it, a little apart, can be stood on */
export function clearLine(walk: Walk, a: XZ, b: XZ, step = .2): boolean {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / step));
  for (let i = 1; i <= n; i++) { const k = i / n; if (!walk(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k)) return false; }
  return true;
}

/**
 * A way from `from` to `to`: the points to walk through, ending at `to` (or, when `to` can't be
 * stood on or reached, at the nearest spot to it that can). Null when `from` itself is stuck.
 * The search covers the box round both ends plus `margin`; cells grow on long trips so it stays
 * under `maxCells` (a tap costs a few milliseconds even on a low phone).
 */
export function findPath(walk: Walk, from: XZ, to: XZ, o: { cell?: number; margin?: number; maxCells?: number } = {}): XZ[] | null {
  let cell = o.cell ?? .4; const margin = o.margin ?? 6, maxCells = o.maxCells ?? 30000;
  if (clearLine(walk, from, to)) return [to];
  const x0 = Math.min(from[0], to[0]) - margin, z0 = Math.min(from[1], to[1]) - margin, w = Math.abs(to[0] - from[0]) + margin * 2, h = Math.abs(to[1] - from[1]) + margin * 2;
  while ((w / cell) * (h / cell) > maxCells) cell *= 1.25;
  const nx = Math.ceil(w / cell) + 1, nz = Math.ceil(h / cell) + 1, N = nx * nz;
  const at = (i: number): XZ => [x0 + (i % nx) * cell, z0 + Math.floor(i / nx) * cell];
  const ix = (p: XZ) => Math.max(0, Math.min(nx - 1, Math.round((p[0] - x0) / cell))) + Math.max(0, Math.min(nz - 1, Math.round((p[1] - z0) / cell))) * nx;
  const ok = new Int8Array(N).fill(-1);   // -1 unknown, 0 blocked, 1 walkable: asked lazily
  const can = (i: number) => { if (ok[i] < 0) { const p = at(i); ok[i] = walk(p[0], p[1]) ? 1 : 0; } return ok[i] === 1; };
  // the start: the nearest walkable cell to where we stand
  const nearest = (p: XZ, r: number) => { const c = ix(p), cx = c % nx, cz = Math.floor(c / nx), R = Math.ceil(r / cell); let best = -1, bd = 1e9;
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const x = cx + dx, z = cz + dz; if (x < 0 || z < 0 || x >= nx || z >= nz) continue; const i = x + z * nx; if (!can(i)) continue; const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } }
    return best; };
  const s = nearest(from, 1.2); if (s < 0) return null;
  const goal = ix(to), gp = at(goal);
  const hx = (i: number) => { const p = at(i), ax = Math.abs(p[0] - gp[0]), az = Math.abs(p[1] - gp[1]); return Math.max(ax, az) + .414 * Math.min(ax, az); };
  const g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const heap: [number, number][] = [];
  const push = (e: [number, number]) => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  g[s] = 0; push([hx(s), s]); let closest = s, closestH = hx(s);
  const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  while (heap.length) {
    const [, c] = pop(); if (done[c]) continue; done[c] = 1;
    const hc = hx(c); if (hc < closestH) { closestH = hc; closest = c; }
    if (c === goal) break;
    const cx = c % nx, cz = Math.floor(c / nx);
    for (const [dx, dz, k] of D) {
      const x = cx + dx, z = cz + dz; if (x < 0 || z < 0 || x >= nx || z >= nz) continue;
      const n = x + z * nx; if (done[n] || !can(n)) continue;
      if (dx && dz && (!can(cx + dx + cz * nx) || !can(cx + (cz + dz) * nx))) continue;   // no cutting a corner
      const ng = g[c] + k * cell; if (ng < g[n]) { g[n] = ng; came[n] = c; push([ng + hx(n), n]); }
    }
  }
  const end = done[goal] ? goal : closest;
  const cells: XZ[] = []; for (let c = end; c >= 0 && c !== s; c = came[c]) cells.unshift(at(c));
  if (end === goal && can(goal)) cells[cells.length - 1] = to;   // the exact spot, when it is walkable
  // pull the path straight: from each point, jump to the furthest one in clear sight
  const out: XZ[] = []; let cur: XZ = from, i = 0;
  while (i < cells.length) { let j = cells.length - 1; while (j > i && !clearLine(walk, cur, cells[j])) j--; out.push(cells[j]); cur = cells[j]; i = j + 1; }
  return out.length ? out : [at(end)];
}

/** where to face to head for `to` on foot: the first point of the way that is a few metres off */
export function wayPoint(walk: Walk, from: XZ, to: XZ, o: { min?: number } = {}): XZ {
  const p = findPath(walk, from, to);
  if (!p) return to;
  const min = o.min ?? 1.5;
  return p.find(q => Math.hypot(q[0] - from[0], q[1] - from[1]) > min) ?? p[p.length - 1];
}
