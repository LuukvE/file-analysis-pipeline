import { join } from 'path';
import EventEmitter from 'events';
import { spawn } from 'child_process';
import { BrowserWindow, ipcMain } from 'electron';
import { is, optimizer } from '@electron-toolkit/utils';

import { onDialog, onFrame, onSignout, onWatch } from './ipc';
import { rendererUrl, store, windowOptions } from './settings';

export class Client {
  public win?: BrowserWindow;
  public emitter = new EventEmitter();

  constructor() {
    ipcMain.handle('frame', onFrame);
    ipcMain.handle('watch', onWatch);
    ipcMain.handle('dialog', onDialog);
    ipcMain.handle('signout', onSignout);

    // While browser isn't ready, loop signin
    this.emitter.on('signin', this.onNotReady);
  }

  async create() {
    this.win = new BrowserWindow(windowOptions);

    this.win.on('ready-to-show', () => this.win?.show());

    this.win.webContents.setWindowOpenHandler(({ url }) => {
      this.openSite(url);

      return { action: 'deny' };
    });

    this.win.webContents.on('did-finish-load', () => this.onLoad());

    optimizer.watchWindowShortcuts(this.win);

    if (is.dev && rendererUrl) return this.win.loadURL(rendererUrl).catch((_) => {});

    this.win.loadFile(join(__dirname, '../renderer/index.html')).catch((_) => {});
  }

  async onLoad() {
    const token = await store.get('token');

    if (token) this.win?.webContents.send('token', token);

    this.emitter.on('signin', async (token: string) => {
      store.set('token', token);

      this.win?.close();

      this.create();
    });

    this.emitter.off('signin', this.onNotReady);
  }

  async openSite(url: string) {
    try {
      const opts: Record<string, string[]> = {
        win32: ['cmd', '/c', 'start', '', url],
        darwin: ['open', url]
      };

      const args = opts[process.platform as string] || ['xdg-open', url];

      spawn(args[0], args.slice(1), { detached: true, stdio: 'ignore' }).unref();
    } catch (_) {}
  }

  onNotReady(token: string) {
    setTimeout(() => this.emitter.emit('signin', token), 500);
  }

  parseUrl(url?: string) {
    if (!url) return;

    const token = new URL(url).searchParams.get('token');

    this.emitter.emit('signin', token);
  }
}
