// A person's verdict on one exact build, as a report the quality gate reads (lane: feel, or any
// lane). The build id is shown in the game's pause menu, so a verdict given on a phone names the
// build it was given on. A person's verdict is the final word on feel; it overrides nothing
// else (a failing check still fails).
//   node tools/verdict.mjs --lane feel --status pass|fail|warn --by Desmic [--device "Galaxy F15"] [--build b-…] --note "…"
//   (several findings: repeat --claim "…" --status …; each pair is one result)
import { createReport } from './lib/report.mjs';
import { buildId } from './lib/build-id.mjs';

const argv = process.argv.slice(2), one = k => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : undefined; };
const lane = one('lane') ?? 'feel', by = one('by') ?? 'person', device = one('device') ?? null, build = one('build') ?? buildId('out');
const results = [];
for (let i = 0; i < argv.length; i++) if (argv[i] === '--claim') results.push({ claim: argv[i + 1], status: argv[argv.indexOf('--status', i)] ? argv[argv.indexOf('--status', i) + 1] : 'warn' });
if (!results.length) results.push({ claim: `${lane}: ${one('note') ?? 'verdict'}`, status: one('status') ?? 'unresolved' });
const R = createReport({ tool: `verdict-${lane}-${by.toLowerCase().replace(/\W+/g, '-')}`, lane, input: device, by: 'person', build });
for (const r of results) R.add(r.status, r.claim, { detail: one('note') });
R.write(null, { by: 'person', person: by, device, note: one('note') ?? null });
console.log(`Recorded ${by}'s ${lane} verdict for build ${build}: ${results.map(r => `${r.status} — ${r.claim}`).join('; ')}`);
