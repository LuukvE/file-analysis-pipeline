import { BrowserWindowConstructorOptions } from 'electron';
import { join } from 'path';

import icon from '../../resources/icon.png?asset';

export const rendererUrl = process.env['ELECTRON_RENDERER_URL'];

export const windowOptions: BrowserWindowConstructorOptions = {
  width: 900,
  height: 670,
  show: false,
  frame: false,
  autoHideMenuBar: true,
  ...(process.platform === 'linux' ? { icon } : {}),
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false
  }
};
