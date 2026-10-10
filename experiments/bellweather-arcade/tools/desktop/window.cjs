// The game window (see play.mjs). One window, no menu, titled so computer use can find it.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs'), path = require('node:path');
const url = process.env.VL_URL, [w, h] = (process.env.VL_SIZE || '540x960').split('x');
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: +w || 540, height: +h || 960, title: 'Bellweather', autoHideMenuBar: true, backgroundColor: '#000000' });
  win.on('page-title-updated', e => e.preventDefault());
  // stay on this game: anything else opens nowhere
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, to) => { if (!to.startsWith(url.split('?')[0])) e.preventDefault(); });
  // the page's console goes to this process's output (play.log), so a session can read it
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 1 || msg.startsWith('[flick]')) console.log('[page]', msg); });
  win.webContents.on('render-process-gone', (_e, d) => console.log('[window] renderer gone', d.reason));
  // --shots N: every N seconds, a burst of 30 frames (about 10 a second) into tools/desktop/shots,
  // to catch something that flickers faster than a person can describe it
  const every = +(process.env.VL_SHOTS || 0);
  if (every > 0) {
    const dir = path.join(__dirname, 'shots'); fs.mkdirSync(dir, { recursive: true });
    let n = 0;
    const burst = async () => { const b = n++; for (let i = 0; i < 30; i++) { try { const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(dir, `b${String(b).padStart(3, '0')}-${String(i).padStart(2, '0')}.jpg`), img.toJPEG(85)); } catch (e) { console.log('[window] capture failed', e.message); } await new Promise(r => setTimeout(r, 100)); } console.log('[window] burst', b, 'saved at', new Date().toISOString()); };
    setInterval(burst, every * 1000);
  }
  win.loadURL(url);
});
app.on('window-all-closed', () => app.quit());
