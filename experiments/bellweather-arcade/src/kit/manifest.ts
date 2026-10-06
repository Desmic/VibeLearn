// The game manifest: one data object that says what a VibeLearn game is made of, so that
// tools, AI play-testers and agents (a co-creating agent, an orchestrator, a chat that
// builds games with a player) work from it instead of from one game's names.
//
// A game exports it from `src/game.ts` as `GAME`. Tools load it from the build
// (`out/src/game.js`); an agent can read the source. Everything here is data or a
// reference to data the game already uses at runtime, so it cannot drift from the game.
// See docs/TEST-CONTRACT.md and docs/QUALITY-SYSTEM.md.
import type { GameRulesSpec } from './game-rules';
import type { StationSpec } from './station';
import type { ProgressSpec } from './progress';
import type { StoryScript } from './story-script';
import type { SoundscapeSpec } from './soundscape';
import type { VoiceCast } from './voice';

export interface IntentItem { id: string; text: string; /** a draft until the designer confirms it */ draft?: boolean }
export interface GameManifest {
  schema: 'vibelearn.game.v1';
  /** stable id, used in reports and file names (e.g. "first-words") */
  id: string;
  title: string;
  /** one sentence: what a player understands at the end */
  teaches: string;
  /** who it is for (e.g. "18+") */
  audience: string;
  /** cast name of the character the player controls */
  protagonist: string;
  /** URL query the tools open the game with (e.g. lowest quality, no auto-tuning, so software rendering keeps up) */
  testEntry: string;
  /** browser storage keys the game owns; tools seed, read and tamper with these */
  storage: { save: string; learning: string; decided: string; /** settings only (mute, graphics…) */ prefs?: string[] };
  /** learning stations that are live in the game, and the rules that judge them */
  stations: StationSpec[];
  rules: GameRulesSpec[];
  /** checkpoints and the learning each one needs (kit/progress.ts) */
  progress: ProgressSpec;
  /** story scripts, in play order */
  stories: StoryScript[];
  sound?: { spec: SoundscapeSpec; beats: Record<string, { mood: string | null; place: string | null }> };
  voice?: { cast: VoiceCast; spoken?: Record<string, string>; direction?: Record<string, string> };
  /** learning-design files (design/*.json, vibelearn.learning-design.v1): the intent the AI play-tester compares against */
  learningDesign?: string[];
  /** what else the game means a newcomer to take away and to feel, beyond the learning: the story they
   *  should be able to tell back, and the experience (moments of feeling) the designer is aiming for.
   *  Blind play-test interviews grade both (tools/playtest/interviewer.md); experience is never
   *  passed by an AI, only noted for a person to confirm (the feel lane is people's). */
  intent?: { story?: IntentItem[]; experience?: IntentItem[] };
  /** input modes the game supports; every one is play-tested */
  input: ('touch' | 'keyboard' | 'mouse')[];
  /** target devices; `low` is the frame-rate bar */
  devices: { low: string; [k: string]: string };
  /** the game's own test pieces (tools/games/<id>.mjs): the story route between stations, helpers */
  tests: string;
  /** names from this game's world (characters, places, objects). System code (src/kit, system
   *  tools) must not use them: tools/kitcheck.mjs fails if it does. */
  nouns: string[];
}

/** problems in a manifest (empty: fine). Checks references between its parts. */
export function validateManifest(m: GameManifest): string[] {
  const out: string[] = [];
  if (m.schema !== 'vibelearn.game.v1') out.push(`schema is "${m.schema}", expected vibelearn.game.v1`);
  if (!/^[a-z0-9-]+$/.test(m.id ?? '')) out.push('id must be lowercase letters, digits and dashes');
  for (const k of ['save', 'learning', 'decided'] as const) if (!m.storage?.[k]) out.push(`storage.${k} missing`);
  const keys = [m.storage.save, m.storage.learning, m.storage.decided, ...(m.storage.prefs ?? [])];
  if (new Set(keys).size !== keys.length) out.push('storage keys must differ');
  const ruleIds = new Set(m.rules.map(r => r.id)), stIds = new Set<string>();
  for (const s of m.stations) {
    if (stIds.has(s.id)) out.push(`station "${s.id}" listed twice`); stIds.add(s.id);
    if (!ruleIds.has(s.rules)) out.push(`station "${s.id}" is judged by rules "${s.rules}", which the manifest doesn't list`);
  }
  for (const r of m.rules) if (!m.stations.some(s => s.rules === r.id)) out.push(`rules "${r.id}" judge no listed station`);
  for (const [c, req] of Object.entries(m.progress.requires)) for (const s of req) if (!stIds.has(s)) out.push(`checkpoint "${c}" needs station "${s}", which the manifest doesn't list`);
  if (m.voice && !m.voice.cast[m.protagonist]) out.push(`protagonist "${m.protagonist}" is not in the voice cast`);
  for (const st of m.stories) if (st.protagonist && st.protagonist !== m.protagonist) out.push(`story "${st.id}" names protagonist "${st.protagonist}", the manifest "${m.protagonist}"`);
  if (!m.input.length) out.push('no input modes');
  if (!m.nouns.length) out.push('no nouns: list the names of this world so system code can be kept free of them');
  return out;
}
