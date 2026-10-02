// Asset budget check: reads every GLB the game ships and reports what it costs a
// phone: triangles, draw calls (one per mesh primitive), materials, textures and
// bytes. Each folder has a budget (tools/asset-budgets.json); going over fails the
// check, so a heavy model is caught before it reaches a Galaxy F15.
// No dependencies: it reads the GLB's JSON chunk directly (Draco-compressed
// meshes still list their counts there). Game-agnostic.
//   node tools/assetcheck.mjs [--root public] [--json]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = arg('root', 'public');
const here = dirname(fileURLToPath(import.meta.url));
const budgets = JSON.parse(readFileSync(join(here, 'asset-budgets.json'), 'utf8'));

export function inspectGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw Error('not a GLB');
  const len = buf.readUInt32LE(12), json = JSON.parse(buf.subarray(20, 20 + len).toString('utf8'));
  const acc = json.accessors ?? [];
  let tris = 0, prims = 0, instanced = 0;
  const meshUse = new Map();
  for (const n of json.nodes ?? []) if (n.mesh !== undefined) meshUse.set(n.mesh, (meshUse.get(n.mesh) ?? 0) + 1);
  (json.meshes ?? []).forEach((m, mi) => {
    const uses = meshUse.get(mi) ?? 0; if (!uses) return;
    for (const p of m.primitives) {
      const mode = p.mode ?? 4; if (mode !== 4) continue;
      const count = p.indices !== undefined ? acc[p.indices].count : acc[p.attributes.POSITION].count;
      tris += (count / 3) * uses; prims += uses; if (uses > 1) instanced += uses - 1;
    }
  });
  return {
    tris: Math.round(tris), draws: prims, materials: (json.materials ?? []).length, textures: (json.images ?? []).length,
    nodes: (json.nodes ?? []).length, draco: (json.extensionsUsed ?? []).includes('KHR_draco_mesh_compression'), bytes: buf.length,
  };
}

function* glbs(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f), s = statSync(p);
    if (s.isDirectory()) yield* glbs(p); else if (f.endsWith('.glb')) yield p;
  }
}

const budgetFor = rel => {
  const hit = Object.keys(budgets.folders).filter(k => rel.startsWith(k)).sort((a, b) => b.length - a.length)[0];
  return { ...budgets.default, ...(hit ? budgets.folders[hit] : {}), ...(budgets.files?.[rel] ?? {}) };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(ROOT)) { console.error('no folder', ROOT); process.exit(2); }
  const rows = []; let fails = 0;
  for (const p of glbs(ROOT)) {
    const rel = relative(ROOT, p).replace(/\\/g, '/'), r = inspectGlb(readFileSync(p)), b = budgetFor(rel);
    const over = ['tris', 'draws', 'materials', 'textures', 'bytes'].filter(k => b[k] !== undefined && r[k] > b[k]);
    if (over.length) fails++;
    rows.push({ file: rel, ...r, over });
  }
  if (process.argv.includes('--json')) { console.log(JSON.stringify(rows, null, 1)); process.exit(fails ? 1 : 0); }
  const kb = n => (n / 1024).toFixed(0) + ' KB';
  console.log('file'.padEnd(50), 'tris'.padStart(7), 'draws'.padStart(6), 'mats'.padStart(5), 'tex'.padStart(4), 'size'.padStart(8));
  for (const r of rows) console.log((r.over.length ? '✗ ' : '✓ ') + r.file.padEnd(48), String(r.tris).padStart(7), String(r.draws).padStart(6), String(r.materials).padStart(5), String(r.textures).padStart(4), kb(r.bytes).padStart(8), r.over.length ? '  over: ' + r.over.join(', ') : '');
  console.log(`\n${rows.length} models, ${fails} over budget.`);
  process.exit(fails ? 1 : 0);
}
