import chokidar, { ChokidarOptions, FSWatcher } from 'chokidar';
import { app, BrowserWindow, dialog, IpcMainInvokeEvent } from 'electron';

export async function onDialog(_e: IpcMainInvokeEvent) {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] });

  if (canceled || !filePaths.length) return;

  return filePaths[0];
}

let watcher: FSWatcher | null = null;

export function onWatch(_e: IpcMainInvokeEvent, path: string) {
  watcher?.close();

  if (!path) return;

  const opts: ChokidarOptions = {
    ignored: (file) => !file.endsWith('.dcm'),
    ignoreInitial: true
  };

  watcher = chokidar.watch(path, opts);

  console.log('watching', path, watcher);

  watcher.on('add', (path) => {
    console.log('added', path);
  });
}

export function onFrame(e: IpcMainInvokeEvent, action: 'close' | 'toggle' | 'minimize') {
  if (action === 'close') return app.quit();

  const win = BrowserWindow.fromWebContents(e.sender);

  if (!win) return;

  if (action === 'minimize') return win.minimize();

  if (win.isMaximized()) return win.unmaximize();

  win.maximize();

  return true;
}
