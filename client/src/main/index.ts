import { join } from 'path';
import { electronApp } from '@electron-toolkit/utils';
import { app, BrowserWindow, protocol } from 'electron';

import { Client } from './client';

(async () => {
  const client = new Client();
  const scheme = 'file-analysis-pipeline';
  const lock = app.requestSingleInstanceLock();

  electronApp.setAppUserModelId('com.file-analysis-pipeline');

  app.on('window-all-closed', app.quit);

  app.on('activate', () => !BrowserWindow.getAllWindows().length && client.create());

  if (!lock) return app.quit();

  protocol.registerSchemesAsPrivileged([
    { scheme, privileges: { standard: true, secure: true } }
  ]);

  app.on('open-url', (event, url) => {
    event.preventDefault();

    client.parseUrl(url);
  });

  app.on('second-instance', (_, commandLine) => {
    client.parseUrl(commandLine.find((arg) => arg.startsWith(scheme)));
  });

  await app.whenReady();

  client.create();

  client.parseUrl(process.argv.find((arg) => arg.startsWith(scheme)));

  if (process.defaultApp) {
    if (process.argv.length < 2) return;

    return app.setAsDefaultProtocolClient(scheme, process.execPath, [
      join(process.argv[1])
    ]);
  }

  app.setAsDefaultProtocolClient(scheme);
})();
