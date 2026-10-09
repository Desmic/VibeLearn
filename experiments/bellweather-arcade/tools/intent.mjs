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
    ...(GAME.intent?.story ?? []).map(x => ({ id: x.id, text: x.text })),
    { id: 'teaches', text: j.teaches },
    ...j.outcomes.map(o => ({ id: o.id, text: `${o.player_can} (misconception: ${o.misconception})` }))];
  // what the player should feel: graded separately, never passed by an AI (the feel lane is people's)
  const experience = (GAME.intent?.experience ?? []).map(x => ({ id: x.id, text: x.text, draft: !!x.draft }));
  const md2 = md + (GAME.intent?.story?.length ? ['', '## The story a newcomer should be able to tell back', ...GAME.intent.story.map(x => `- ${x.text}`), ''].join('\n') : '')
    + (experience.length ? ['', '## What the player should feel' + (experience.some(x => x.draft) ? ' (drafts)' : ''), ...experience.map(x => `- ${x.text}`), ''].join('\n') : '');
  return { json: { ...j, items, experience }, md: md2, items, experience };
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
  const experience = (spec.experience ?? []).map(x => ({ id: x.id, text: x.text, draft: !!x.draft }));
  const md2 = md + (experience.length ? ['', '## What the player should feel' + (experience.some(x => x.draft) ? ' (drafts)' : ''), ...experience.map(x => `- ${x.text}`), ''].join('\n') : '');
  return { md: md2, items, experience, json: { sites: spec.sites.map(s => ({ asks: s.asks, slots: s.slots })), items, experience } };
}

/** the intent of the next-word lab (kit/ngram.ts, lab=ngram) */
export function buildNgramIntent(spec) {
  const md = ['# What this area means to communicate', '',
    'You are a small robot whose speech engine can say things into existence. It is a next-word engine, like a phone keyboard\'s suggestions or a tiny language model:', '',
    '- everything you absorb from the world (signs, things) is read into the engine;',
    '- you pick only the first word; after that the engine suggests what comes next, from what it has read, likeliest first, and shows how often it has read each;',
    `- it will only say its ${spec.top} likeliest words; words it has read too rarely are shown but it won't say them;`,
    '- reading more of a phrase makes the engine likelier to say it;',
    '- its likeliest word is not always the one you need ("let it finish" picks its favourite every time); you steer;',
    '- it learns from what it hears you say too: at the last place only its own finish counts, so you say the phrase yourself until it becomes its favourite.', '',
    'A phrase then makes a thing (a bridge across a gap, a lantern for a dark doorway). Wrong phrases make something silly, or nothing, in a readable way.', '',
    '## The places', ...spec.places.map((p, i) => `- **${spec.utter.sites[i].asks}**: ${p.lesson}`), ''].join('\n');
  const items = [
    { id: 'make', text: 'Saying a phrase makes a thing appear in the world, and the thing is what gets you through.' },
    { id: 'reads', text: 'The engine learns from what you absorb: reading a sign changes what it suggests.' },
    { id: 'next', text: 'You choose the first word; the engine offers the next words, the ones it has read after that word.' },
    { id: 'frequency', text: 'How often it has read a pair decides how likely it is to say it; it only says its likeliest few.' },
    { id: 'more', text: 'To get it to say something it rarely says, feed it more text where that phrase appears.' },
    { id: 'steer', text: 'Its favourite next word is not always what you need: letting it finish gives its favourite; you can pick another.' },
    { id: 'habit', text: 'It also learns from what it hears you say: saying a phrase makes it likelier, until the engine says it by itself.' },
    { id: 'model', text: 'This is how a language model works at heart: it predicts the next word from counts of the text it has read.' },
  ];
  const experience = (spec.utter.experience ?? []).map(x => ({ id: x.id, text: x.text, draft: !!x.draft }));
  const md2 = md + (experience.length ? ['', '## What the player should feel' + (experience.some(x => x.draft) ? ' (drafts)' : ''), ...experience.map(x => `- ${x.text}`), ''].join('\n') : '');
  return { md: md2, items, experience, json: { places: spec.places, items, experience } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--root'), { GAME } = await loadGame(i > 0 ? process.argv[i + 1] : 'out');
  const it = buildIntent(GAME);
  console.log(process.argv.includes('--json') ? JSON.stringify(it.json, null, 1) : it.md);
}
