// One report format for every check, AI play-test and person's verdict (vibelearn.report.v1),
// so a quality gate, an agent or an orchestrator can read them all the same way.
//
// Kept from the old critic system (docs/QUALITY-SYSTEM.md):
//   - every result is a claim with a status: pass | fail | warn | unresolved. Unresolved is
//     not a pass: it means the evidence wasn't there (a step couldn't run, a person hasn't looked);
//   - every result names its lane (learning, flow, world, …: tools/checks.json); lanes are
//     never averaged, and a fail in one blocks whatever the others say;
//   - every report is bound to one build (out/build.json): it never carries over to a changed build;
//   - evidence is named (screenshots, logs) and a result says how to reproduce it.
// Dropped: scores, sealed capsules and receipts. A result is judged by what the game did.
//
// Reports are written next to the tool's own output AND under quality/<build>/, where
// tools/quality.mjs reads them.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { buildId } from './build-id.mjs';

export const STATUSES = ['pass', 'fail', 'warn', 'unresolved'];

/** a report for one run of one tool. `lane` is the default lane for its results. */
export function createReport({ tool, lane, input = null, root = 'out', game = null, by = 'tool', build: forBuild = null }) {
  const started = new Date(), results = [];
  const r = {
    results,
    /** add a result: status pass|fail|warn|unresolved; claim in plain words */
    add(status, claim, o = {}) {
      if (!STATUSES.includes(status)) throw Error('status ' + status);
      results.push({ lane: o.lane ?? lane, status, claim, ...(o.detail ? { detail: String(o.detail).slice(0, 600) } : {}), ...(o.segment ? { segment: o.segment } : {}),
        ...(o.evidence?.length ? { evidence: o.evidence.map(e => basename(e)) } : {}), ...(o.repro ? { repro: o.repro } : {}), ...(o.expected ? { expected: o.expected } : {}) });
      return status === 'pass';
    },
    /** pass when ok, else fail (or warn) */
    check(claim, ok, o = {}) { return r.add(ok ? 'pass' : (o.severity === 'warn' ? 'warn' : 'fail'), claim, o); },
    summary() { const s = Object.fromEntries(STATUSES.map(k => [k, 0])); for (const x of results) s[x.status]++; return s; },
    /** write <dir>/report.json (with `extra` fields merged in) and the copy under quality/<build>/ */
    write(dir, extra = {}) {
      const build = forBuild ?? buildId(root), s = r.summary();
      const j = { schema: 'vibelearn.report.v1', tool, by, game, build, input, started: started.toISOString(), finished: new Date().toISOString(),
        seconds: Math.round((Date.now() - started) / 1000), summary: s, results, ...extra };
      if (dir) { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'report.json'), JSON.stringify(j, null, 1)); }
      const q = join('quality', build); mkdirSync(q, { recursive: true });
      // a partial run (only some segments) is kept beside the full one; the gate lets it supersede those segments
      const part = j.segments?.length ? '--' + j.segments.join('+') : '';
      writeFileSync(join(q, `${tool}${input ? '-' + input : ''}${part}.json`), JSON.stringify({ ...j, dir: dir ?? null }, null, 1));
      return j;
    },
  };
  return r;
}
