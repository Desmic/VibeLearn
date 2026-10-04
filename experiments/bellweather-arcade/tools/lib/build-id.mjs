// The build's identity: a short hash of its code and data (every file's path and size, plus
// the content of the code and data files). Reports and verdicts are bound to it, so a result
// never carries over to a changed build (a lesson from the old critic system).
//   node tools/lib/build-id.mjs [--root out] [--write]   (build.sh writes out/build.json)
import { createHash } from 'node:crypto';
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT = /\.(js|mjs|json|html|css|txt)$/;
export function computeBuildId(root = 'out') {
  const h = createHash('sha256'), files = [];
  const walk = d => { for (const n of readdirSync(d).sort()) { const p = join(d, n), s = statSync(p); if (s.isDirectory()) { if (!['tools', 'three'].includes(n) || d !== root) walk(p); } else files.push([relative(root, p), s.size, p]); } };
  walk(root);
  for (const [rel, size, p] of files) { if (rel === 'build.json' || rel === 'src/build-info.js') continue; h.update(rel + '\0' + size + '\0'); if (CONTENT.test(rel)) h.update(readFileSync(p)); }
  return 'b-' + h.digest('hex').slice(0, 12);
}
/** the id written by the build (out/build.json), or computed now */
export function buildId(root = 'out') {
  const f = join(root, 'build.json');
  if (existsSync(f)) try { return JSON.parse(readFileSync(f, 'utf8')).id; } catch { /* rewrite below */ }
  return computeBuildId(root);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--root'), root = i > 0 ? process.argv[i + 1] : 'out';
  const id = computeBuildId(root);
  if (process.argv.includes('--write')) {
    writeFileSync(join(root, 'build.json'), JSON.stringify({ id, when: new Date().toISOString() }) + '\n');
    if (existsSync(join(root, 'src'))) writeFileSync(join(root, 'src/build-info.js'), `export const BUILD = '${id}';\n`);
  }
  console.log(id);
}
