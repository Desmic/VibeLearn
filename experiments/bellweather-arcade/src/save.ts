// Tiny save file: the story checkpoint plus the learning record, kept in this
// browser. Private-mode or blocked storage just means no save (never an error).
export type Checkpoint = 'spark' | 'skiff' | 'land' | 'gate-open' | 'loom' | 'loom-done';
const KEY = 'bellweather.save.v1', LOG = 'bellweather.learning.v1', DECIDED = 'bellweather.decided.v1';
export const PLACE: Record<Checkpoint, string> = { spark: 'Catch the spark', skiff: 'Wake the skiff', land: 'Blossom Isle', 'gate-open': 'Blossom Isle, past the gate', loom: 'Loom Isle', 'loom-done': 'Loom Isle, Tavi freed' };

export const save = {
  load(): { at: Checkpoint; when: number } | null { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && PLACE[v.at as Checkpoint] ? v : null; } catch { return null; } },
  set(at: Checkpoint) { try { localStorage.setItem(KEY, JSON.stringify({ at, when: Date.now() })); } catch { /* no storage */ } },
  clear() { try { localStorage.removeItem(KEY); } catch { /* no storage */ } },
  // learning events survive reloads too (first tries stay first tries)
  logEvent(e: object) { try { const a = JSON.parse(localStorage.getItem(LOG) || '[]'); a.push(e); localStorage.setItem(LOG, JSON.stringify(a.slice(-2000))); } catch { /* no storage */ } },
  /** has this decision been answered before (ever, on this device)? Kept apart from the event log,
   *  which is trimmed, so an old decision can never count as a first try again */
  decidedBefore(activity: string, decision: string): boolean {
    const k = activity + '|' + decision;
    try { const d: string[] = JSON.parse(localStorage.getItem(DECIDED) || '[]'); if (d.includes(k)) return true; d.push(k); localStorage.setItem(DECIDED, JSON.stringify(d)); } catch { /* no storage */ }
    return false;
  },
  learning(): object[] { try { return JSON.parse(localStorage.getItem(LOG) || '[]'); } catch { return []; } },
};
