import { useCallback, useEffect, useRef } from 'react';

import { GridRef } from '../types';

import useStore from './useStore';

export default function useIpc({ grid }: { grid: GridRef }) {
  const once = useRef(false);
  const update = useStore((s) => s.update);
  const { invoke } = window.electron.ipcRenderer;

  const close = useCallback(() => invoke('frame', 'close'), [invoke]);

  const selectFolder = useCallback(async () => {
    const folder = await invoke('dialog');

    localStorage.setItem('folder', folder || '');

    await invoke('watch', folder);

    update({ folder });
  }, [invoke, update]);

  const signout = useCallback(() => {
    invoke('signout');

    window.auth.token = '';
  }, [invoke]);

  useEffect(() => {
    const { token } = window.auth;
    const folder = localStorage.getItem('folder');

    if (folder) invoke('watch', folder);

    if (token) update({ token });

    if (once.current) return;

    once.current = true;

    window.auth = new Proxy(window.auth, {
      set(auth, prop, token) {
        if (prop !== 'token') return false;

        auth.token = token;

        update({ token });

        return true;
      }
    });
  }, [invoke, update]);

  return {
    close,
    signout,
    selectFolder
  };
}
