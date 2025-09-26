import chokidar, { ChokidarOptions, FSWatcher } from 'chokidar';
import { app, BrowserWindow, dialog, IpcMainInvokeEvent } from 'electron';
import { incomingFile } from './uploader';

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
    ignoreInitial: true
  };

  watcher = chokidar.watch(path, opts);

  watcher.on('add', incomingFile);
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
