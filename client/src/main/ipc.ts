import { lookup } from 'mime-types';
import { Job, Table } from 'shared/types';
import chokidar, { ChokidarOptions, FSWatcher } from 'chokidar';
import { app, BrowserWindow, dialog, IpcMainInvokeEvent } from 'electron';

import upload from './upload';
import { Socket } from './socket';
import { publicKey } from './settings';

export async function onDialog(_e: IpcMainInvokeEvent) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (canceled || !filePaths.length) return;

  return filePaths[0];
}

const watcher: { current?: FSWatcher } = {};

export function onWatch(_e: IpcMainInvokeEvent, path: string) {
  watcher.current?.close();

  if (!path) return;

  const opts: ChokidarOptions = {
    ignoreInitial: true
  };

  watcher.current = chokidar.watch(path, opts);

  watcher.current.on('add', async (path) => {
    const socket = new Socket();
    const mime = lookup(path) || 'application/octet-stream';

    const job = await socket.send<Job>({
      id: '',
      cid: crypto.randomUUID(),
      table: Table.JOBS,
      version: app.getVersion(),
      mime,
      client: `client-${publicKey}`,
      created: new Date().toJSON()
    });

    await upload(path, job, socket);

    socket.destroy();
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
