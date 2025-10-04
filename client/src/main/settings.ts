import { join } from 'path';
import { generate } from 'shared/crypto';
import { BrowserWindowConstructorOptions } from 'electron';

import icon from '../../resources/icon.png?asset';

export const rendererUrl = process.env['ELECTRON_RENDERER_URL']; // Set in dev

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

export const { publicKey, privateKey } = generate();
