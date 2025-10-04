// TODO: Presigned URLs and NestJS server instead of direct AWS SDK
process.env['AWS_REGION'] = 'eu-west-1';
process.env['AWS_ENDPOINT_URL'] = 'http://127.0.0.1:4566';

// These values are fake - for localstack emulator
process.env['AWS_ACCESS_KEY_ID'] = 'LKIAQAAAAAAAN3S73MPM';
process.env['AWS_SECRET_ACCESS_KEY'] = 'l4hJ5Uvcf0UaFOJtrFp2Bj8OAAhq444LPeLt6Dyi';

import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';

import { onDialog, onFrame, onWatch } from './ipc';
import { rendererUrl, windowOptions } from './settings';

electronApp.setAppUserModelId('com.electron');

ipcMain.handle('frame', onFrame);

ipcMain.handle('watch', onWatch);

ipcMain.handle('dialog', onDialog);

app.whenReady().then(onReady);

app.on('window-all-closed', app.quit);

app.on('activate', () => !BrowserWindow.getAllWindows().length && onReady());

app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w));

function onReady() {
  const win = new BrowserWindow(windowOptions);

  win.on('ready-to-show', win.show);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);

    return { action: 'deny' };
  });

  if (is.dev && rendererUrl) win.loadURL(rendererUrl);
  else win.loadFile(join(__dirname, '../renderer/index.html'));

  return win;
}
