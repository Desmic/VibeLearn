import type * as T from 'three';

// Story as data. A script holds what a story *says* and in what order its
// beats come: lines, choices, thoughts, toasts, goals, places, checkpoints and
// stars. The game's code keeps what a story *does* (cutscene choreography,
// chases, puzzles) and calls into the script by id. A course generator writes
// scripts like this; the validator below checks one before it ships.

export type Speaker = string | undefined;
export interface Line {
  speaker?: Speaker; text: string;
  /** buttons; `on` names a handler the game provides, `next` continues the dialogue */
  /** `advance`: a plain 'go on' rather than a decision (no button; tap anywhere). A lone 'Next' counts as one. */
  choices?: { label: string; kind?: 'primary' | 'quiet'; on?: string; next?: string; advance?: boolean }[];
}
export interface Thought { who?: 'zip' | 'warden'; text: string | string[] }
export interface BeatSpec {
  id: string;
  goal?: { text: string; at?: string; arrowOnly?: boolean } | null;   // `at` names an anchor the game provides
  place?: string;                 // the place name shown on screen
  checkpoint?: string;            // saved when the beat starts
  thoughts?: { id: string; delay: number }[];   // inner thoughts when the beat starts
}
/** rows may use {name} slots; a row can have different text when missed */
export interface StarsSpec { title: string; rows: (string | { got: string; missed: string })[] }
export interface StoryScript {
  id: string; title: string;
  beats: BeatSpec[];
  /** each dialogue is a chain of lines; a line's choice may jump to another line id */
  dialogues: Record<string, Record<string, Line> & { start: Line }>;
  thoughts: Record<string, Thought>;
  toasts: Record<string, string>;
  labels: Record<string, string>;   // context-button labels
  stars: Record<string, StarsSpec>;
  /** the contract: handlers and anchors the game must provide for this script */
  needs?: { handlers: string[]; anchors: string[] };
}

export interface ScriptGuide {
  say(text: string, choices: { label: string; kind?: 'primary' | 'quiet'; act: () => void }[], opts?: { speaker?: string }): void;
  close(): void;
  think(text: string | string[], who?: 'zip' | 'warden'): void;
  thinkOnce(id: string, text: string | string[], who?: 'zip' | 'warden'): boolean;
  toast(text: string, ms?: number): void;
  setGoal(text: string | null): void;
  setBeacon(at: T.Vector3 | null, arrowOnly?: boolean): void;
  stars(title: string, rows: [boolean, string][], then: () => void): void;
}

const fill = (s: string, v: Record<string, string | number> = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? `{${k}}`));

export function createScriptRunner(script: StoryScript, g: ScriptGuide, o: {
  anchors: Record<string, () => T.Vector3 | null>;
  onBeat?: (beat: BeatSpec) => void;          // place name, checkpoint save
  later: (sec: number, fn: () => void) => void;
}) {
  const beats = new Map(script.beats.map(b => [b.id, b]));
  const run = {
    script,
    beat(id: string): BeatSpec { const b = beats.get(id); if (!b) throw Error(`story ${script.id}: no beat ${id}`); return b; },
    /** say one line of a dialogue with no buttons (cutscene captions) */
    line(id: string, at = 'start') { const l = script.dialogues[id]?.[at]; if (!l) throw Error(`story ${script.id}: no line ${id}.${at}`); g.say(l.text, [], { speaker: l.speaker }); },
    /** start a beat: goal and beacon, place, checkpoint, its thoughts */
    enter(id: string) {
      const b = run.beat(id);
      if (b.goal !== undefined) run.goal(b.goal);
      o.onBeat?.(b);
      for (const t of b.thoughts ?? []) t.delay > 0 ? o.later(t.delay, () => run.thinkOnce(t.id)) : run.thinkOnce(t.id);
      return b;
    },
    goal(spec: BeatSpec['goal']) {
      if (!spec) { g.setGoal(null); g.setBeacon(null); return; }
      g.setGoal(spec.text); g.setBeacon(spec.at ? o.anchors[spec.at]?.() ?? null : null, spec.arrowOnly);
    },
    /** play a dialogue from its `start` line; handlers answer each choice's `on`.
     *  A choice without `next` closes the card before its handler runs. */
    dialogue(id: string, handlers: Record<string, () => void> = {}, from = 'start') {
      const d = script.dialogues[id]; if (!d) throw Error(`story ${script.id}: no dialogue ${id}`);
      const line = d[from]; if (!line) throw Error(`story ${script.id}: dialogue ${id} has no line ${from}`);
      g.say(line.text, (line.choices ?? []).map(c => ({ label: c.label, kind: c.kind, advance: c.advance ?? ((line.choices ?? []).length === 1 && c.label === 'Next'), act: () => { if (!c.next) g.close(); if (c.on) handlers[c.on]?.(); if (c.next) run.dialogue(id, handlers, c.next); } })), { speaker: line.speaker });
    },
    thought(id: string) { const t = script.thoughts[id]; if (!t) throw Error(`story ${script.id}: no thought ${id}`); return t; },
    think(id: string) { const t = run.thought(id); g.think(t.text, t.who); },
    thinkOnce(id: string) { const t = run.thought(id); return g.thinkOnce(id, t.text, t.who); },
    toast(id: string, ms?: number, v?: Record<string, string | number>) { g.toast(fill(script.toasts[id] ?? id, v), ms); },
    label(id: string) { return script.labels[id] ?? id; },
    stars(id: string, got: boolean[], v: Record<string, string | number>, then: () => void) {
      const s = script.stars[id]; g.stars(fill(s.title, v), s.rows.map((r, i) => [!!got[i], fill(typeof r === 'string' ? r : got[i] ? r.got : r.missed, v)] as [boolean, string]), then);
    },
  };
  return run;
}

/** Checks a script before it ships: missing handlers, anchors and ids, broken
 *  dialogue jumps, and the house style (twelve words or fewer per line). */
export function validateScript(s: StoryScript, known: { handlers: string[]; anchors: string[]; maxWords?: number } = { ...(s.needs ?? { handlers: [], anchors: [] }) }) {
  const issues: { level: 'error' | 'warn'; where: string; msg: string }[] = [];
  const ids = new Set<string>(), max = known.maxWords ?? 12;
  const words = (t: string) => t.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const longestSentence = (t: string) => Math.max(...t.split(/(?<=[.!?…])\s+/).map(words));
  for (const b of s.beats) {
    if (ids.has(b.id)) issues.push({ level: 'error', where: 'beat ' + b.id, msg: 'duplicate beat id' }); ids.add(b.id);
    if (b.goal?.at && !known.anchors.includes(b.goal.at)) issues.push({ level: 'error', where: 'beat ' + b.id, msg: `unknown anchor "${b.goal.at}"` });
    for (const t of b.thoughts ?? []) if (!s.thoughts[t.id]) issues.push({ level: 'error', where: 'beat ' + b.id, msg: `unknown thought "${t.id}"` });
    if (b.goal && words(b.goal.text) > max) issues.push({ level: 'warn', where: 'beat ' + b.id, msg: `goal longer than ${max} words` });
  }
  for (const [id, d] of Object.entries(s.dialogues)) {
    if (!d.start) issues.push({ level: 'error', where: 'dialogue ' + id, msg: 'no start line' });
    for (const [lid, l] of Object.entries(d)) {
      // a line may be two short sentences; the house rule is per sentence
      const longest = longestSentence(l.text);
      if (longest > max) issues.push({ level: 'warn', where: `dialogue ${id}.${lid}`, msg: `a sentence has ${longest} words (house style: ${max} or fewer)` });
      for (const c of l.choices ?? []) {
        if (c.on && !known.handlers.includes(c.on)) issues.push({ level: 'error', where: `dialogue ${id}.${lid}`, msg: `no handler "${c.on}"` });
        if (c.next && !d[c.next]) issues.push({ level: 'error', where: `dialogue ${id}.${lid}`, msg: `jumps to missing line "${c.next}"` });
      }
    }
  }
  for (const [id, t] of Object.entries(s.thoughts)) for (const x of [t.text].flat()) if (longestSentence(x) > max) issues.push({ level: 'warn', where: 'thought ' + id, msg: `a sentence is longer than ${max} words` });
  for (const [id, st] of Object.entries(s.stars)) if (!st.rows.length) issues.push({ level: 'error', where: 'stars ' + id, msg: 'no rows' });
  return issues;
}
