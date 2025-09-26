import { contextBridge } from 'electron';
import { ElectronAPI, electronAPI } from '@electron-toolkit/preload';

(() => {
  if (process.contextIsolated) return contextBridge.exposeInMainWorld('electron', electronAPI);

  type ElectronWindow = Window & { electron?: ElectronAPI };

  const win: ElectronWindow = window;

  win.electron = electronAPI;
})();
