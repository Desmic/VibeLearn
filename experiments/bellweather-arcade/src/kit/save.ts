// The save: the story checkpoint plus the learning record, kept in this browser. Private
// mode or blocked storage just means no save (never an error). Game-agnostic: a game gives
// its storage keys and progress spec (its manifest, kit/manifest.ts).
//
// The learning record has two parts: an event log (trimmed, for review) and the set of
// decisions ever answered on this device (never trimmed), so an old decision can never
// count as a first try again. On resume the saved checkpoint is checked against that
// record (kit/progress.ts): a save claiming more than the record supports resumes where
// the record allows, and the move is kept.
import { verifiedCheckpoint, stationsAnswered, type ProgressSpec } from './progress';

export interface SaveKeys { save: string; learning: string; decided: string }

export function createSave<C extends string>(keys: SaveKeys, progress: ProgressSpec) {
  const known = (at: unknown): at is C => typeof at === 'string' && progress.order.includes(at);
  const read = <T>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
  const save = {
    load(): { at: C; when: number } | null { const v = read<{ at?: unknown; when: number } | null>(keys.save, null); return v && known(v.at) ? v as { at: C; when: number } : null; },
    set(at: C) { try { localStorage.setItem(keys.save, JSON.stringify({ at, when: Date.now() })); } catch { /* no storage */ } },
    clear() { try { localStorage.removeItem(keys.save); } catch { /* no storage */ } },
    /** learning events survive reloads too (first tries stay first tries) */
    logEvent(e: object) { try { const a = read<object[]>(keys.learning, []); a.push(e); localStorage.setItem(keys.learning, JSON.stringify(a.slice(-2000))); } catch { /* no storage */ } },
    /** has this decision been answered before (ever, on this device)? Records it if not. */
    decidedBefore(activity: string, decision: string): boolean {
      const k = activity + '|' + decision;
      try { const d = read<string[]>(keys.decided, []); if (d.includes(k)) return true; d.push(k); localStorage.setItem(keys.decided, JSON.stringify(d)); } catch { /* no storage */ }
      return false;
    },
    learning(): object[] { return read<object[]>(keys.learning, []); },
    /** every decision answered on this device ("activity|decision") */
    decided(): string[] { return read<string[]>(keys.decided, []); },
    /** the save, checked against the learning record */
    loadVerified(): { at: C; when: number; was?: C } | null {
      const s = save.load(); if (!s) return null;
      const v = verifiedCheckpoint(progress, s.at, stationsAnswered(save.decided())) as C | null;
      if (v === s.at) return s;
      console.info('[save]', JSON.stringify({ saved: s.at, resumed: v, reason: 'the learning record does not support the saved checkpoint' }));
      if (!v) { save.clear(); return null; }
      save.set(v); return { at: v, when: s.when, was: s.at };
    },
  };
  return save;
}
