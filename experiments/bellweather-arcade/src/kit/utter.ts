// Utterance: the protagonist says a thing into existence. A short phrase built from words
// the player carries ("long jelly bridge") is read in order, like a language model reads its
// context, and becomes an object with a job (span a gap, light the dark…). Whether it works is
// judged by function, not by an answer key, so several phrasings can solve a place, and a
// wrong one fails in a way that shows why (too short, wrong way, too weak, made too soon).
//
// Pure and game-agnostic: a game gives its lexicon, things and sites as data
// (worlds/*-utter.ts, schema vibelearn.utter.v1); tools/uttercheck.mjs proves every site
// solvable from the words it offers, and lists the funny ways to fail. A future open-vocabulary
// version (a model making the look of an unknown thing) keeps this contract: the archetype
// gives behaviour, the generator only the look.

export type Archetype = 'span' | 'light' | 'prop';
export interface ThingSpec {
  archetype: Archetype;
  /** span: length in metres; light: brightness 0..2 */
  size: number;
  /** a span this weak gives way under the protagonist (paper, noodle) */
  weak?: boolean;
  /** how it looks (the game's builder picks a model or a procedural shape) */
  look: string;
}
export type WordSpec =
  | { kind: 'thing'; thing: string }
  | { kind: 'size'; scale: number }
  | { kind: 'material'; material: string; weak?: boolean }
  | { kind: 'facing'; away: boolean };
export interface SiteSpec {
  id: string;
  /** what the place needs, in the player's words (shown on a sign) */
  asks: string;
  need: { archetype: 'span'; length: number } | { archetype: 'light'; brightness: number };
  /** words the player carries here (cumulative with earlier sites is up to the game) */
  words: string[];
  /** how many words the engine reads at once (its context) */
  slots: number;
}
export interface UtterSpec {
  schema: 'vibelearn.utter.v1';
  id: string;
  lexicon: Record<string, WordSpec>;
  things: Record<string, ThingSpec>;
  /** when no thing is named, the engine finishes the phrase itself: modifier -> the thing it guesses */
  guesses: Record<string, string>;
  sites: SiteSpec[];
  /** what the world says for each outcome (keys: Reason), {thing} and {word} are filled in */
  lines: Record<string, string>;
}

export type Reason = 'works' | 'too-short' | 'too-weak' | 'wrong-way' | 'wrong-kind' | 'too-dim' | 'nothing';
export interface Made {
  /** the thing made (after a guess, if the phrase named none) */
  thing: string | null;
  guessed: boolean;
  /** span length or light brightness, after size words */
  size: number;
  material: string | null;
  weak: boolean;
  away: boolean;
  /** words read after the thing was already made: too late to change it */
  late: string[];
  works: boolean;
  reason: Reason;
}

/** Read the phrase in order, as the engine does: modifiers wait for a thing; the first thing
 *  named is made at once, with the modifiers read so far; words after it are too late. With no
 *  thing named, the engine finishes the phrase with its own guess for the last modifier. */
export function speak(spec: UtterSpec, words: string[], site: SiteSpec): Made {
  let scale = 1, material: string | null = null, weak = false, away = false, thing: string | null = null, guessed = false;
  const late: string[] = [];
  const apply = (w: WordSpec) => {
    if (w.kind === 'size') scale *= w.scale;
    else if (w.kind === 'material') { material = w.material; weak = weak || !!w.weak; }
    else if (w.kind === 'facing') away = w.away;
  };
  for (const word of words.slice(0, site.slots)) {
    const w = spec.lexicon[word]; if (!w) continue;
    if (thing) { late.push(word); continue; }
    if (w.kind === 'thing') thing = w.thing; else apply(w);
  }
  if (!thing) {
    const last = [...words.slice(0, site.slots)].reverse().find(x => spec.guesses[x]);
    if (last) { thing = spec.guesses[last]; guessed = true; }
  }
  const t = thing ? spec.things[thing] : null;
  const made = { thing, guessed, size: t ? +(t.size * scale).toFixed(2) : 0, material, weak: weak || !!t?.weak, away, late, works: false, reason: 'nothing' as Reason };
  if (!t) return made;
  const n = site.need;
  if (t.archetype !== n.archetype) made.reason = 'wrong-kind';
  else if (n.archetype === 'span') made.reason = made.away ? 'wrong-way' : made.size < n.length ? 'too-short' : made.weak ? 'too-weak' : 'works';
  else made.reason = made.size < n.brightness ? 'too-dim' : 'works';
  made.works = made.reason === 'works';
  return made;
}

/** every phrase of 1..slots distinct words from the site's words, in order (for proofs and hints) */
export function phrases(site: SiteSpec): string[][] {
  const out: string[][] = [], w = site.words;
  const go = (cur: string[]) => { if (cur.length) out.push(cur); if (cur.length === site.slots) return; for (const x of w) if (!cur.includes(x)) go([...cur, x]); };
  go([]); return out;
}

/** problems in a spec (empty: fine) */
export function validateUtter(spec: UtterSpec): string[] {
  const out: string[] = [];
  for (const [word, w] of Object.entries(spec.lexicon)) if (w.kind === 'thing' && !spec.things[w.thing]) out.push(`word "${word}" names unknown thing "${w.thing}"`);
  for (const [m, t] of Object.entries(spec.guesses)) { if (!spec.lexicon[m]) out.push(`guess for unknown word "${m}"`); if (!spec.things[t]) out.push(`guess "${m}" -> unknown thing "${t}"`); }
  const ids = new Set<string>();
  for (const s of spec.sites) {
    if (ids.has(s.id)) out.push(`site "${s.id}" twice`); ids.add(s.id);
    for (const w of s.words) if (!spec.lexicon[w]) out.push(`site "${s.id}" offers unknown word "${w}"`);
    if (s.slots < 1) out.push(`site "${s.id}" reads no words`);
  }
  for (const r of ['works', 'too-short', 'too-weak', 'wrong-way', 'wrong-kind', 'too-dim', 'nothing'] as Reason[]) if (!spec.lines[r]) out.push(`no line for outcome "${r}"`);
  return out;
}
