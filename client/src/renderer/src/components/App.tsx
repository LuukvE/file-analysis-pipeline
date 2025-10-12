import { useEffect, useState } from 'react';

import Button from './Button';

const { invoke } = window.electron.ipcRenderer;

// blue - #264653
// green - #58BC82
// yellow - #E9C46A
// orange - #F4A261
// red - #E76F51

export default () => {
  const [token, setToken] = useState('');
  const [path, setPath] = useState('');

  useEffect(() => {
    const watchedFolder = localStorage.getItem('watchedFolder') || '';

    if (watchedFolder) invoke('watch', watchedFolder);

    setPath(watchedFolder);

    const interval = setInterval(() => {
      const stored = sessionStorage.getItem('token') || '';

      setToken((prev) => (stored !== prev ? stored : prev));
    }, 500);

    return () => clearInterval(interval);
  }, [setToken]);

  return (
    <div className="bg-white/70 w-full h-full flex flex-col items-center">
      <div className="w-full h-8 fixed top-0 left-0 w-full flex">
        <div className="draggable grow h-full" />
        <Button
          className="mt-1 mr-1 p-1 h-5 rounded hover:bg-[#E76F51]"
          onClick={(e) => {
            e.preventDefault();

            invoke('frame', 'close');
          }}
        >
          ✕
        </Button>
      </div>

      {!!token && (
        <>
          <div className="text-3xl font-bold text-center mx-2.5 py-4 mt-auto bg-[linear-gradient(90deg,#E76F51_0%,#F4A261_100%)] bg-clip-text text-transparent">
            {path ? <>Ready to upload</> : <>Select a folder to watch</>}
          </div>
          {path && (
            <p className="text-[#444] text-sm font-bold">
              System is watching{' '}
              <code className="font-mono bg-[#264653]/20 rounded-xs text-sm px-1.5 py-1 font-bold">
                {path}
              </code>
            </p>
          )}
          <div className="flex pt-8 flex-wrap justify-start mb-auto pb-8 gap-x-4">
            <Button
              onClick={async (e) => {
                e.preventDefault();

                const path = await invoke('dialog');

                localStorage.setItem('watchedFolder', path || '');

                await invoke('watch', path);

                setPath(path);
              }}
            >
              Select Folder
            </Button>
          </div>
          <Button
            className="mb-1 mr-1 ml-auto py-1 px-1.5 h-5 rounded opacity-50 hover:opacity-100 hover:bg-[#E76F51] text-[10px]"
            onClick={(e) => {
              e.preventDefault();

              invoke('signout');

              sessionStorage.removeItem('token');

              setToken('');
            }}
          >
            Sign out
          </Button>
        </>
      )}

      {!token && (
        <>
          <div className="flex pt-8 flex-wrap justify-start pb-8 gap-x-4 items-center grow">
            <Button href="http://localhost:8080/v1/google/init">Sign in</Button>
          </div>
        </>
      )}
    </div>
  );
};
