// The game window (see play.mjs). One window, no menu, titled so computer use can find it.
const { app, BrowserWindow } = require('electron');
const url = process.env.VL_URL, [w, h] = (process.env.VL_SIZE || '540x960').split('x');
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: +w || 540, height: +h || 960, title: 'Bellweather', autoHideMenuBar: true, backgroundColor: '#000000' });
  win.on('page-title-updated', e => e.preventDefault());
  // stay on this game: anything else opens nowhere
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, to) => { if (!to.startsWith(url.split('?')[0])) e.preventDefault(); });
  win.loadURL(url);
});
app.on('window-all-closed', () => app.quit());
