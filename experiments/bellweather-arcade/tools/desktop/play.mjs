// Opens the game in its own desktop window (Electron), not a browser tab. Native computer use
// treats browsers as view-only (it can see them but not click or type), so to watch Claude play
// with held keys and clicks, the game needs a window of its own. This starts the Vite dev server
// (the same thing as npm run dev), then the window, and stops the server when the window closes.
//   npm install             (once, in experiments/bellweather-arcade)
//   node tools/desktop/play.mjs     (or double-click tools\desktop\play.cmd on Windows)
//   [--size 540x960] [--extra "&lab=ngram"]
import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
// the hosted build's default (#painted): tools/hosted/index.html
const base = 'study=facade&portal=crafted&architecture=atelier&finish=daylight&palette=ceramic&form=swept-clean&character=courier&look=sunlit&setting=city&districts=terraces&surface=illustrated&render=painted';

const server = await createServer({ root, logLevel: 'warn', server: { host: '127.0.0.1', port: 8062, strictPort: false } });
await server.listen();
const url = `${server.resolvedUrls.local[0]}?${base}${arg('extra', '')}`;
console.log('game at', url);
const [w, h] = arg('size', '540x960').split('x').map(Number);
// tools/desktop is the window's app folder (package.json names window.cjs). electron is fetched by npx on first run (about 100 MB, once)
// (the address goes by environment: on Windows the shell would split it at each &)
const app = spawn('npx', ['--yes', 'electron@33.2.1', `"${here}"`], { stdio: 'inherit', shell: true, env: { ...process.env, VL_URL: url, VL_SIZE: `${w}x${h}` } });
app.on('exit', async code => { await server.close(); process.exit(code ?? 0); });
