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
