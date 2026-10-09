// Blind check: an AI play-tester must not be told what to look for (Desmic, 5 Oct 2026: a
// language model is steered by its context, so a tester primed with the design finds the design).
// Fails when the tester's brief (tools/playtest/tester.md) or a persona (personas.json) carries a
// word from a game's design (its manifest nouns, its intent, every test area's intent) or a word
// that primes a judgement ("fun", "lesson", "confusing"…). Also self-tests the interview leak guard
// the play server uses (tools/lib/leak.mjs) on made-up cases.
//   bash tools/build.sh && node tools/blindcheck.mjs [--root out]
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadGame } from './lib/game.mjs';
import { createReport } from './lib/report.mjs';
import { buildIntent, buildUtterIntent } from './intent.mjs';
import { designVocabulary, briefLeaks, questionLeaks, metWords } from './lib/leak.mjs';

const ROOT = process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root') + 1] : 'out';
const { GAME } = await loadGame(ROOT);
const R = createReport({ tool: 'blindcheck', lane: 'system', game: GAME.id });
let fails = 0;
const ok = (claim, good, detail) => { if (!good) fails++; console.log(`${good ? '✓' : '✗'} ${claim}${!good && detail ? ' — ' + detail : ''}`); R.check(claim, good, { detail }); };

// every design the system knows: this game, its test areas, the second (fixture) game
const intents = [buildIntent(GAME)], nouns = [...(GAME.nouns ?? [])];
const utter = resolve(ROOT, 'src/worlds/utter-lab.js');
if (existsSync(utter)) { const { UTTER_LAB } = await import(pathToFileURL(utter).href); intents.push(buildUtterIntent(UTTER_LAB)); }
if (existsSync('fixtures/night-market/game.mjs')) { const { GAME: G2 } = await loadGame(ROOT, 'fixtures/night-market/game.mjs'); intents.push(buildIntent(G2)); nouns.push(...(G2.nouns ?? [])); }
const design = designVocabulary({ nouns, intents: intents.flatMap(i => [i.md, ...(i.items ?? []).map(x => x.text)]) });

for (const f of ['tester.md', 'tester-pixels.md']) {   // the brief, and its pixels-only twin (playserver --pixels 1)
  const brief = readFileSync('tools/playtest/' + f, 'utf8').replace(/`[^`]*`/g, ' ');   // API syntax in backticks is the phone, not the game
  const leaks = briefLeaks(brief, design);
  ok(`the tester brief (${f}) says nothing about any game or what to notice`, !leaks.length, leaks.join(', '));
}
const { personas } = JSON.parse(readFileSync('tools/playtest/personas.json', 'utf8'));
for (const [id, text] of Object.entries(personas)) { const l = briefLeaks(text, design); ok(`persona "${id}" is who they are, not what to look for`, !l.length, l.join(', ')); }

// the interview guard on made-up cases (no game words: a pretend design about a kite shop)
const d = designVocabulary({ nouns: ['Kestrel'], intents: ['A kite flies when the wind is behind it. Tension in the string matters.'] });
const met = metWords(['Fly the kite', 'string', 'I pulled the thing and it went up']);
const cases = [
  ['Tell me about what you just played.', []],
  ['You said you pulled the thing. What happened then?', []],
  ['What did the string do when you tapped Fly the kite?', []],
  ['How did the wind affect it?', ['wind']],
  ['Was it fun?', ['fun']],
  ['Did you notice the tension?', ['tension']],
  ['Was anything confusing?', ['confus']],
  ['Who is Kestrel?', ['kestrel']],
];
for (const [q, want] of cases) {
  const got = questionLeaks(q, d, met), good = want.length ? got.length > 0 : !got.length;
  ok(`leak guard: ${want.length ? 'refuses' : 'allows'} “${q}”`, good, `got [${got.join(', ')}]`);
}
R.write(null);
console.log(fails ? `\n${fails} problem(s)` : '\nblind: the tester is told nothing about the game');
process.exit(fails ? 1 : 0);
