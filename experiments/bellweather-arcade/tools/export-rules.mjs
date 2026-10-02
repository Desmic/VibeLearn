// Writes every GameRulesSpec in the build as JSON (rules/<id>.json), the form the
// server's app/game_rules.py loads. Run after build.sh: node tools/export-rules.mjs
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve('out'), dest = resolve('rules'); mkdirSync(dest, { recursive: true });
const seen = new Set();
for (const f of readdirSync(join(root, 'src/worlds')).filter(f => f.endsWith('.js'))) {
  const m = await import(pathToFileURL(join(root, 'src/worlds', f)).href);
  for (const v of Object.values(m)) if (v && typeof v === 'object' && v.schemaVersion === '1' && v.actions && !seen.has(v.id)) {
    seen.add(v.id); writeFileSync(join(dest, v.id + '.json'), JSON.stringify(v, null, 2) + '\n'); console.log('rules/' + v.id + '.json');
  }
}
