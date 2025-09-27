import { BrowserWindowConstructorOptions } from 'electron';
import { join } from 'path';

import icon from '../../resources/icon.png?asset';
import { generate } from './crypto';

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

// Test nearby regions with: https://s3-accelerate-speedtest.s3-accelerate.amazonaws.com/en/accelerate-speed-comparsion.html?region=
export const awsBuckets = [
  'eu-west-1/dublin-file-analysis-pipeline-bucket--euw1-az3--x-s3',
  'eu-central-1/my-frankfurt-bucket',
  'eu-west-2/my-london-bucket',
  'eu-west-3/my-paris-bucket'
].map((dest) => {
  const [region, bucket] = dest.split('/');

  return { region, bucket };
});

export const minChunkSize = 30 * 1024 * 1024; // 30MB

export const { publicKey, privateKey } = generate();
