// What the game means to communicate, generated from its own data (manifest, story beats,
// stations, learning designs). The AI play-tester reads this only AFTER it has written down
// what it understood cold (tools/playserver.mjs enforces the order), then compares: a gap
// between intent and what a newcomer perceived is a finding (lane: comprehension).
// The old critic system's rule, kept: observations before intent, so the design can't fill
// in what the game failed to show.
//   bash tools/build.sh && node tools/intent.mjs [--root out] [--json]
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame } from './lib/game.mjs';

export function buildIntent(GAME) {
  const designs = (GAME.learningDesign ?? []).filter(f => existsSync(resolve(f))).map(f => JSON.parse(readFileSync(resolve(f), 'utf8')));
  const j = {
    game: GAME.title, teaches: GAME.teaches, audience: GAME.audience, protagonist: GAME.protagonist,
    story: GAME.stories.map(s => ({ id: s.id, title: s.title, goals: s.beats.filter(b => b.goal?.text).map(b => ({ beat: b.id, goal: b.goal.text, place: b.place ?? null })) })),
    stations: GAME.stations.map(s => ({ id: s.id, name: s.name, teaches: s.teaches ?? [], asks: (s.decisions ?? []).map(d => d.asks) })),
    outcomes: designs.flatMap(d => (d.outcomes ?? []).map(o => ({ stop: d.stop, id: o.id, player_can: o.observable_capability, misconception: o.misconception }))),
    promises: designs.map(d => ({ stop: d.stop, place: d.place, promise: d.learning_promise })),
  };
  const md = [`# What ${j.game} means to communicate`, '', `**Teaches:** ${j.teaches}`, `**Audience:** ${j.audience} · **You play:** ${j.protagonist}`, '',
    '## The story, as goals in order', ...j.story.flatMap(s => [`### ${s.title}`, ...s.goals.map(g => `- ${g.goal}${g.place ? ` _(${g.place})_` : ''}`)]), '',
    '## Learning promises', ...j.promises.map(p => `- Stop ${p.stop} (${p.place}): ${p.promise}`), '',
    '## Stations and the decisions they ask', ...j.stations.map(s => `- **${s.name}** (${s.teaches.join(', ')}): ${s.asks.join(' / ')}`), '',
    '## What a player should be able to do after', ...j.outcomes.map(o => `- (${o.id}) ${o.player_can} — the misconception to catch: ${o.misconception}`), ''].join('\n');
  // the items a blind play-test interview must account for, one by one (tools/playtest/interviewer.md)
  const items = [{ id: 'premise', text: `Who you are (${j.protagonist}), where you are and what you are trying to do: ${j.story[0]?.goals.map(g => g.goal).join(' → ') ?? ''}` },
    { id: 'teaches', text: j.teaches },
    ...j.outcomes.map(o => ({ id: o.id, text: `${o.player_can} (misconception: ${o.misconception})` }))];
  return { json: { ...j, items }, md, items };
}

/** the intent of an utterance place set (kit/utter.ts), for play-testing a test area like lab=utter */
export function buildUtterIntent(spec) {
  const md = ['# What this area means to communicate', '',
    'You are a small robot whose speech engine can say things into existence. Words come from the world (absorb them from signs and things).',
    'You build a short phrase from them; the engine reads it in order, like a language model reads its context:', '',
    '- size and material words shape the thing named after them; words said after the thing come too late;',
    '- if you stop before naming a thing, the engine finishes the phrase with its own likeliest guess;',
    '- only the first few words are read (its context is small);',
    '- vague phrases get the most likely thing, not the one you meant; every word matters.', '',
    'Wrong phrases are meant to fail in funny, readable ways (too short, too weak, the wrong way, the wrong kind of thing, too dim).', '',
    '## The places', ...spec.sites.map(s => `- **${s.asks}**: up to ${s.slots} words`), ''].join('\n');
  const items = [
    { id: 'make', text: 'Saying a phrase makes a thing appear in the world, and the thing is what gets you through (across a gap, lighting a doorway).' },
    { id: 'source', text: 'The words come from the world: you collect them from signs and things before you can say them.' },
    { id: 'order', text: 'The phrase is read in order: describing words shape the thing named after them; words said after the thing come too late.' },
    { id: 'guess', text: 'Stop before naming a thing and the engine finishes the phrase with its own likeliest guess.' },
    { id: 'room', text: 'Only a few words fit: the engine reads a small, fixed number (its context is small).' },
    { id: 'vague', text: 'A vague phrase gets the most likely thing, not the one you meant; every word (size, material) matters.' },
    { id: 'why', text: 'When a phrase fails, you can see why (too short, too weak, the wrong way, the wrong kind, too dim) and fix the phrase.' },
    { id: 'model', text: 'This is how a language model works: it makes what is most likely from the words in front of it, in order.' },
  ];
  return { md, items, json: { sites: spec.sites.map(s => ({ asks: s.asks, slots: s.slots })), items } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--root'), { GAME } = await loadGame(i > 0 ? process.argv[i + 1] : 'out');
  const it = buildIntent(GAME);
  console.log(process.argv.includes('--json') ? JSON.stringify(it.json, null, 1) : it.md);
}
