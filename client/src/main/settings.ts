import { join } from 'path';
import fs from 'fs/promises';
import { crypto } from 'shared';
import { app, BrowserWindowConstructorOptions } from 'electron';

import icon from '../../resources/icon.png?asset';

export const store = {
  async set(key: string, value: string) {
    const file = join(app.getPath('userData'), `${key}.txt`);

    return fs.writeFile(file, value, 'utf-8');
  },
  async get(key: string) {
    const file = join(app.getPath('userData'), `${key}.txt`);

    return fs.readFile(file, 'utf-8');
  }
};

export const rendererUrl = process.env['ELECTRON_RENDERER_URL']; // dev

export const windowOptions: BrowserWindowConstructorOptions = {
  width: 900,
  height: 500,
  show: false,
  frame: false,
  autoHideMenuBar: true,
  ...(process.platform === 'linux' ? { icon } : {}),
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false
  }
};

export const minChunkSize = 30 * 1024 * 1024; // 30MB

export const { publicKey, privateKey } = crypto.generate();
