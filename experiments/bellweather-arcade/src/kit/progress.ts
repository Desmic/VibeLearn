// Progress that has to be earned. A game lists its checkpoints in order and, for each, the
// learning stations a player must have answered to stand there. On resume the saved
// checkpoint is checked against the learning record; a save that claims more than the
// record shows (edited by hand, copied from another device, left by a test shortcut) resumes
// at the furthest checkpoint the record does support. This keeps a plain browser save from
// being a skip button for the learning; it is not tamper-proof (the record lives in the same
// browser), and signed progress on the server is the real answer once there is one.
// Game-agnostic: the spec is data (worlds/*-progress.ts); tools read the same spec.
export interface ProgressSpec {
  /** checkpoints in story order */
  order: string[];
  /** checkpoint -> station ids that must have at least one answered decision */
  requires: Record<string, string[]>;
}

/** stations with at least one answered decision, from keys like "activity|decision" */
export function stationsAnswered(decided: Iterable<string>): Set<string> {
  const s = new Set<string>(); for (const k of decided) s.add(k.split('|')[0]); return s;
}

/** the furthest checkpoint at or before `saved` whose requirements the record meets (null: none) */
export function verifiedCheckpoint(spec: ProgressSpec, saved: string, answered: Set<string>): string | null {
  const at = spec.order.indexOf(saved); if (at < 0) return null;
  for (let i = at; i >= 0; i--) if ((spec.requires[spec.order[i]] ?? []).every(s => answered.has(s))) return spec.order[i];
  return null;
}

/** problems in a spec (for the content checker): unknown checkpoints or stations, requirements that shrink */
export function validateProgress(spec: ProgressSpec, stationIds: string[]): string[] {
  const out: string[] = [];
  for (const [c, req] of Object.entries(spec.requires)) {
    if (!spec.order.includes(c)) out.push(`requires names unknown checkpoint "${c}"`);
    for (const s of req) if (!stationIds.includes(s)) out.push(`checkpoint "${c}" requires unknown station "${s}"`);
  }
  // a later checkpoint needs at least what an earlier one did (progress only adds learning)
  let prev: string[] = [];
  for (const c of spec.order) { const r = spec.requires[c] ?? []; for (const s of prev) if (!r.includes(s)) out.push(`checkpoint "${c}" drops "${s}", required earlier`); prev = r.length ? r : prev; }
  return out;
}
