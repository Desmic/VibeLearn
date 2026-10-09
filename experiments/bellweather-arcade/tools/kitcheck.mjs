// Kit check: keeps the system apart from the game, so the next game reuses it instead of
// copying it (copies fork and rot). Fails when:
//   - a kit module (src/kit) imports anything but other kit modules, shared vendor code or three;
//   - system code (src/kit, tools/lib, and tools whose scope is "system" in tools/checks.json)
//     names something from the game's world (manifest `nouns`) or uses its storage keys,
//     outside comments;
//   - a tool in tools/ is not listed in tools/checks.json (every tool declares its scope).
// Game-specific tools (scope "game" or "mixed") may name the game; they are listed so the
// gaps stay visible.
//   bash tools/build.sh && node tools/kitcheck.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { loadGame } from './lib/game.mjs';
import { createReport } from './lib/report.mjs';

const { GAME } = await loadGame('out');
const R = createReport({ tool: 'kitcheck', lane: 'system', game: GAME.id });
const reg = JSON.parse(readFileSync('tools/checks.json', 'utf8'));
const scopeOf = id => reg.checks.find(c => c.id === id)?.scope;

/** code without comments (line and block), strings kept */
export function stripComments(src) {
  let out = '', i = 0, q = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) { out += c; if (c === '\\') { out += n ?? ''; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

let fails = 0;
const fail = (claim, detail) => { fails++; console.log(`✗ ${claim}${detail ? ' — ' + detail : ''}`); R.add('fail', claim, { detail }); };
const pass = claim => { console.log(`✓ ${claim}`); R.add('pass', claim); };

// 1. kit imports
const kit = readdirSync('src/kit').filter(f => f.endsWith('.ts')).map(f => join('src/kit', f));
const badImports = [];
for (const f of kit) for (const m of readFileSync(f, 'utf8').matchAll(/(?:^|\n)\s*(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
  const p = m[1] ?? m[2];
  if (!(p.startsWith('./') || p.startsWith('../vendor/') || p === 'three' || p.startsWith('three/'))) badImports.push(`${basename(f)} imports ${p}`);
}
badImports.length ? fail('the kit imports only kit modules, vendor code and three', badImports.join('; ')) : pass(`the kit (${kit.length} modules) imports only kit modules, vendor code and three`);

// 2. game names in system code
const words = [...GAME.nouns, GAME.storage.save, GAME.storage.learning, GAME.storage.decided, ...(GAME.storage.prefs ?? []).filter(k => !k.startsWith('vibelearn.'))];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = new RegExp(`(?<![A-Za-z0-9_-])(${words.map(esc).join('|')})(?![A-Za-z0-9_])`, 'g');
const toolFiles = readdirSync('tools').filter(f => ['.mjs', '.js', '.py'].includes(extname(f)));
const system = [...kit, ...readdirSync('tools/lib').map(f => join('tools/lib', f)), ...toolFiles.filter(f => scopeOf(basename(f, extname(f))) === 'system').map(f => join('tools', f))];
for (const f of system) {
  const lines = stripComments(readFileSync(f, 'utf8')).split('\n'), hits = [];
  lines.forEach((l, i) => { for (const m of l.matchAll(re)) hits.push(`${i + 1}: ${m[1]}`); });
  hits.length ? fail(`${f} names nothing from the game`, hits.slice(0, 8).join(', ') + (hits.length > 8 ? ` (+${hits.length - 8})` : '')) : R.add('pass', `${f} names nothing from the game`);
}
if (!fails) pass(`${system.length} system files name nothing from the game (${words.length} names and keys checked)`);

// 3. every tool declares its scope
const unlisted = toolFiles.filter(f => !scopeOf(basename(f, extname(f))));
unlisted.length ? fail('every tool is listed in tools/checks.json with its scope', unlisted.join(', ')) : pass('every tool is listed in tools/checks.json with its scope');
const gameTools = reg.checks.filter(c => c.scope !== 'system' && existsSync(`tools/${c.id}.mjs`)).map(c => `${c.id} (${c.scope})`);
console.log(`  game-specific tools (gaps to close): ${gameTools.join(', ')}`);

// 4. the escapes log (quality/escapes.json): every escape generalized and caught by something
if (existsSync('quality/escapes.json')) {
  const E = JSON.parse(readFileSync('quality/escapes.json', 'utf8')), ids = new Set(), bad = [];
  for (const e of E.escapes ?? []) {
    if (!/^qe-[a-z0-9-]+$/.test(e.id ?? '') || ids.has(e.id)) bad.push(`bad or repeated id ${e.id}`); ids.add(e.id);
    for (const k of ['symptom', 'why_missed', 'generalized_failure', 'invariant']) if (!e[k]?.trim?.()) bad.push(`${e.id}: no ${k}`);
    for (const k of ['generalized_failure', 'invariant']) for (const m of (e[k] ?? '').matchAll(re)) bad.push(`${e.id}: ${k} names "${m[1]}" (say it so any game can use it)`);
    const layers = (e.prevention ?? []).map(p => p.layer);
    if (!layers.length || layers.every(l => l === 'process')) bad.push(`${e.id}: prevention is process only (add a kit, data, contract, runtime or check change)`);
    for (const c of e.caught_by ?? []) if (!scopeOf(c)) bad.push(`${e.id}: caught_by "${c}" is not in tools/checks.json`);
    if (!(e.caught_by ?? []).length && !String(e.status).startsWith('open')) bad.push(`${e.id}: nothing catches it, so its status must start with "open"`);
  }
  bad.length ? fail('every escape is generalized and caught by a listed check', bad.join('; ')) : pass(`${ids.size} escapes generalized, each caught by a listed check`);
}

// self-test: a name in code is caught, the same name in a comment is not
const sample = stripComments(`const who = '${GAME.nouns[0]}'; // ${GAME.nouns[1]}\n/* ${GAME.nouns[1]} */ x();`);
const got = [...sample.matchAll(re)].map(m => m[1]);
got.length === 1 && got[0] === GAME.nouns[0] ? R.add('pass', 'self-test: catches a game name in code, ignores one in a comment') : fail('self-test: catches a game name in code, ignores one in a comment', JSON.stringify(got));

// tests play what players get: the test entry carries every setting of the hosted default (until
// 9 Oct it left out the atelier and the crafted portal, so tests and blind testers saw another town)
{
  const { readFileSync, existsSync } = await import('node:fs');
  const f = 'tools/hosted/index.html';
  if (existsSync(f)) {
    const html = readFileSync(f, 'utf8'), base = html.match(/var base='([^']+)'/)?.[1] ?? '', extra = html.match(/painted:'([^']*)'/)?.[1] ?? '';
    const want = (base + extra).split('&').filter(Boolean), have = new Set(GAME.testEntry.split('&'));
    const missing = want.filter(p => !have.has(p));
    missing.length ? fail('the test entry plays the hosted game', `missing: ${missing.join(', ')}`) : R.add('pass', 'the test entry plays the hosted game (every hosted setting is in it)');
  }
}
R.write(null);
console.log(`\n${fails} failures`);
process.exit(fails ? 1 : 0);
