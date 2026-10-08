// A tiny next-word engine (an n-gram model), the honest little ancestor of a language model.
// It learns by reading: every pair of neighbouring words it reads ("long bridge") is counted.
// Asked what comes after a word, it offers the words it has most often read there, likeliest
// first. It says nothing it hasn't read, and it can only say what is likely enough (its top few),
// so what the player lets it read changes what it can say. That is the lesson: a language model
// is a predictor of the next word, built from counts of text.
//
// Pure and game-agnostic. n = 2 reads one word back (a bigram); a bigger n reads more and falls
// back to fewer words when it has never seen the longer context (the upgrade path). A game gives
// the text (signs, overheard lines) and decides what saying a phrase does (kit/utter.ts).
// tools/ngramcheck.mjs proves a game's places solvable from what can be read there.

import type { UtterSpec } from './utter';

export interface Suggestion {
  word: string;
  /** times read right after this context */
  count: number;
  /** among the likeliest few: the engine will say it */
  ok: boolean;
}

/** words of a text, lower case, split into clauses: no pair is counted across . , ! ? ; : */
export function clauses(text: string): string[][] {
  return text.toLowerCase().replace(/[“”"()]/g, ' ').replace(/[’']/g, '’')
    .split(/[.,!?;:—–]+/).map(c => c.split(/\s+/).map(w => w.replace(/^[’-]+|[’-]+$/g, '')).filter(Boolean)).filter(c => c.length);
}

export function createNgram(n = 2) {
  // context (the last n-1 words, space-joined; shorter ones too, for falling back) -> next word -> count
  const table = new Map<string, Map<string, number>>();
  let order = 0;
  const first = new Map<string, number>();   // when a pair was first read: ties go to the older one
  const add = (ctx: string, next: string, k: number) => {
    let row = table.get(ctx); if (!row) table.set(ctx, (row = new Map()));
    row.set(next, (row.get(next) ?? 0) + k);
    const key = ctx + '\u0000' + next; if (!first.has(key)) first.set(key, order++);
  };
  const api = {
    n,
    /** read a text (weight: as if read that many times). Returns the pairs it learned, most first. */
    read(text: string, weight = 1): { pair: [string, string]; count: number }[] {
      const learned = new Map<string, number>();
      for (const c of clauses(text)) for (let i = 1; i < c.length; i++) {
        for (let back = 1; back < n && back <= i; back++) add(c.slice(i - back, i).join(' '), c[i], weight);
        const k = c[i - 1] + ' ' + c[i]; learned.set(k, (learned.get(k) ?? 0) + weight);
      }
      return [...learned].sort((a, b) => b[1] - a[1]).map(([k, count]) => ({ pair: k.split(' ') as [string, string], count }));
    },
    /** how often `next` was read right after `ctx` (one word back) */
    count(ctx: string, next: string) { return table.get(ctx.toLowerCase())?.get(next.toLowerCase()) ?? 0; },
    /** what may come after these words: the longest context it has read, likeliest first; the
     *  first `top` (and any tied with the last of them) are ones it will say, the rest (up to
     *  `show`) it has read but too rarely */
    suggest(said: string[], top = 3, show = 5): Suggestion[] {
      const w = said.map(x => x.toLowerCase());
      for (let back = Math.min(n - 1, w.length); back >= 1; back--) {
        const ctx = w.slice(-back).join(' '), row = table.get(ctx);
        if (!row?.size) continue;
        const ranked = [...row].sort((a, b) => b[1] - a[1] || first.get(ctx + '\u0000' + a[0])! - first.get(ctx + '\u0000' + b[0])!);
        // its likeliest few, and any word tied with the last of them (a tied word left out read as an
        // arbitrary cut, run 13: "noodle ×2 greyed while ago ×2 could be said")
        const cut = ranked[Math.min(top, ranked.length) - 1]?.[1] ?? 0;
        return ranked.slice(0, Math.max(show, ranked.filter(r => r[1] >= cut).length)).map(([word, count]) => ({ word, count, ok: count >= cut }));
      }
      return [];
    },
    /** let it finish: from these words, keep taking its likeliest next word until `stop` says so,
     *  `max` words in all, or it has nothing to add (it never repeats a word in one phrase) */
    complete(said: string[], max: number, stop: (words: string[]) => boolean = () => false, top = 3): string[] {
      const out = [...said];
      while (out.length < max && !stop(out)) {
        const next = api.suggest(out, top, top).find(s => s.ok && !out.includes(s.word));
        if (!next) break;
        out.push(next.word);
      }
      return out;
    },
    /** every phrase it will say from these first words, up to `max` words (for proofs and hints) */
    sayable(starts: string[], max: number, top = 3): string[][] {
      const out: string[][] = [];
      const go = (cur: string[]) => { out.push(cur); if (cur.length >= max) return; for (const s of api.suggest(cur, top, top)) if (s.ok && !cur.includes(s.word)) go([...cur, s.word]); };
      for (const s of new Set(starts.map(x => x.toLowerCase()))) go([s]);
      return out;
    },
  };
  return api;
}
export type Ngram = ReturnType<typeof createNgram>;

/** A place-by-place lesson in the engine (schema vibelearn.ngram.v1). What a phrase makes is
 *  kit/utter.ts's call (`utter`); this says what the engine reads and what the player may start with. */
export interface NgramLabSpec {
  schema: 'vibelearn.ngram.v1';
  id: string;
  /** 2: the engine reads one word back */
  n: number;
  /** how many of its likeliest words it will say after a word, and how many it shows */
  top: number; show: number;
  /** text the engine already holds on arrival (it came with some reading) */
  pretrain: string[];
  /** what saying a phrase makes; its sites are the places, in order. Its `words` per site are
   *  ignored here: what can be said comes from reading. */
  utter: UtterSpec;
  /** per place, in order: the word sources reachable by then (ids), and the one whose reading
   *  the place's lesson depends on (ngramcheck proves the place can't be solved without it) */
  places: { site: string; reads: string[]; key?: string; lesson: string }[];
}

export function validateNgram(spec: NgramLabSpec, sourceIds: string[]): string[] {
  const out: string[] = [], sites = spec.utter.sites.map(s => s.id);
  if (spec.top < 1 || spec.show < spec.top) out.push('top must be 1 or more and show at least top');
  spec.places.forEach((p, i) => {
    if (sites[i] !== p.site) out.push(`place ${i + 1} is "${p.site}" but the site there is "${sites[i]}"`);
    for (const r of p.reads) if (!sourceIds.includes(r)) out.push(`place "${p.site}" reads unknown source "${r}"`);
    if (p.key && !p.reads.includes(p.key)) out.push(`place "${p.site}" depends on "${p.key}", which it can't read`);
  });
  return out;
}
