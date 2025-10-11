import { join } from 'path';
import EventEmitter from 'events';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, protocol, shell } from 'electron';

import { onDialog, onFrame, onWatch } from './ipc';
import { rendererUrl, store, windowOptions } from './settings';

const emitter = new EventEmitter();

emitter.on('signin', onNotReady);

ipcMain.handle('frame', onFrame);

ipcMain.handle('watch', onWatch);

ipcMain.handle('dialog', onDialog);

electronApp.setAppUserModelId('com.file-analysis-pipeline');

initScheme();

app.whenReady().then(onReady);

app.on('window-all-closed', app.quit);

app.on('activate', () => !BrowserWindow.getAllWindows().length && onReady());

app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w));

function onNotReady(token: string) {
  setTimeout(emitter.emit, 1000, 'signin', token);
}

async function onReady() {
  const win = new BrowserWindow(windowOptions);

  emitter.on('signin', (token: string) => {
    win.focus();

    store.set('token', token);

    win.webContents.send('token', token);
  });

  emitter.off('signin', onNotReady);

  win.on('ready-to-show', win.show);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);

    return { action: 'deny' };
  });

  win.webContents.on('did-finish-load', async () => {
    const token = await store.get('token');

    if (token) win.webContents.send('token', token);
  });

  if (is.dev && rendererUrl) return win.loadURL(rendererUrl);

  win.loadFile(join(__dirname, '../renderer/index.html'));
}

function initScheme() {
  const scheme = 'file-analysis-pipeline';
  const lock = app.requestSingleInstanceLock();

  if (!lock) return app.quit();

  protocol.registerSchemesAsPrivileged([
    { scheme, privileges: { standard: true, secure: true } }
  ]);

  app.on('open-url', (event, url) => {
    event.preventDefault();

    parseUrl(url);
  });

  app.on('second-instance', (_, commandLine) => {
    parseUrl(commandLine.find((arg) => arg.startsWith(scheme)));
  });

  parseUrl(process.argv.find((arg) => arg.startsWith(scheme)));

  if (process.defaultApp) {
    if (process.argv.length < 2) return;

    return app.setAsDefaultProtocolClient(scheme, process.execPath, [
      join(process.argv[1])
    ]);
  }

  app.setAsDefaultProtocolClient(scheme); // prod
}

function parseUrl(url?: string) {
  if (!url) return;

  const token = new URL(url).searchParams.get('token');

  emitter.emit('signin', token);
}
