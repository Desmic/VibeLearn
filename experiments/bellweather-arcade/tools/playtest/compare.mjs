// Compare blind play-tests side by side: how each intent item came out in each run, what the
// tester would rate it, how many failures it met. For A/B variants of an area, or trends
// across builds. Reads each run's report.json (tools/playserver.mjs, blind protocol).
//   node tools/playtest/compare.mjs <run dir> [<run dir> …] [--names A,B,C] [--md out.md]
//        [--count 'Funny failures found: (\d+) of (\d+)' --count-name 'failures met']   a game's own tally, read off the screen
// One run per variant is an anecdote: read differences as leads to test again, not verdicts.
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf('--' + k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const names = opt('names')?.split(','), out = opt('md'), countRe = opt('count'), countName = opt('count-name') ?? 'tally on screen';
const runs = argv.map((d, i) => { const j = JSON.parse(readFileSync(join(d, 'report.json'), 'utf8')); let log = ''; try { log = readFileSync(join(d, 'playlog.jsonl'), 'utf8'); } catch {} return { name: names?.[i] ?? basename(d), j, f: j.findings ?? {}, log }; });
const rank = { unprompted: 5, probed: 4, moment: 3, reveal: 2, misread: 1, missed: 0 };
const mark = { unprompted: '●●● unprompted', probed: '●●○ probed', moment: '●○○ when pointed at', reveal: '○○○ after the reveal', misread: '✗ misread', missed: '✗ missed' };
const ids = [...new Set(runs.flatMap(r => (r.f.items ?? []).map(x => x.id)))];
// a game's own tally, if asked for (the last time it was on screen, from the play log)
const tally = r => { if (!countRe) return ''; const m = [...r.log.matchAll(new RegExp(countRe, 'g'))].pop(); return m ? m.slice(1).join(' of ') : '—'; };
const L = [`| | ${runs.map(r => r.name).join(' | ')} |`, `| --- | ${runs.map(() => '---').join(' | ')} |`,
  ...ids.map(id => `| ${id} | ${runs.map(r => { const x = (r.f.items ?? []).find(y => y.id === id); return x ? mark[x.level] : '—'; }).join(' | ')} |`),
  `| understood on their own (score) | ${runs.map(r => (r.f.items ?? []).reduce((a, x) => a + (rank[x.level] ?? 0), 0) + ' / ' + ids.length * 5).join(' | ')} |`,
  `| keep playing (0–10) | ${runs.map(r => r.f.keepPlaying?.score ?? '—').join(' | ')} |`,
  `| next part | ${runs.map(r => r.f.keepPlaying?.next ?? '—').join(' | ')} |`,
  `| steps, stopped by choice | ${runs.map(r => `${r.j.steps}${r.j.stoppedAt ? ', yes' : ', no'}`).join(' | ')} |`,
  ...(countRe ? [`| ${countName} | ${runs.map(tally).join(' | ')} |`] : []),
  `| build | ${runs.map(r => r.j.build).join(' | ')} |`];
const md = L.join('\n') + '\n';
console.log(md); if (out) writeFileSync(out, md);
