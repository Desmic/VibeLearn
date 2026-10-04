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
  return { json: j, md };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--root'), { GAME } = await loadGame(i > 0 ? process.argv[i + 1] : 'out');
  const it = buildIntent(GAME);
  console.log(process.argv.includes('--json') ? JSON.stringify(it.json, null, 1) : it.md);
}
