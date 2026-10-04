// Loads the game's manifest (src/game.ts → out/src/game.js, kit/manifest.ts) and its own
// test pieces (manifest.tests, e.g. tools/games/first-words.mjs). Every system tool gets
// game names, storage keys and data from here, never from one game's source.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const cache = new Map();
/** `--game <file>` (or VL_GAME) loads another game's manifest against this build's kit: the
 *  fixture games (fixtures/*) prove the system's checks aren't one game's */
export const gameArg = () => { const i = process.argv.indexOf('--game'); return i > 0 ? process.argv[i + 1] : process.env.VL_GAME || null; };
export async function loadGame(root = 'out', gameFile = gameArg()) {
  const key = resolve(root) + '|' + (gameFile ?? ''); if (cache.has(key)) return cache.get(key);
  const f = gameFile ? resolve(gameFile) : resolve(root, 'src/game.js');
  if (!existsSync(f)) throw Error(`no game manifest at ${f}: build first (bash tools/build.sh); a game exports GAME from src/game.ts`);
  const { GAME } = await import(pathToFileURL(f).href);
  const { validateManifest } = await import(pathToFileURL(resolve(root, 'src/kit/manifest.js')).href);
  const issues = validateManifest(GAME);
  if (issues.length) throw Error('game manifest: ' + issues.join('; '));
  const tests = GAME.tests && existsSync(resolve(GAME.tests)) ? await import(pathToFileURL(resolve(GAME.tests)).href) : {};
  const g = { GAME, tests }; cache.set(key, g); return g;
}
