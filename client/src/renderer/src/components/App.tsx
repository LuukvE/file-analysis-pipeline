import { useEffect, useState } from 'react';

const { invoke } = window.electron.ipcRenderer;

export default () => {
  const [token, setToken] = useState('');
  const [path, setPath] = useState('');

  useEffect(() => {
    const watchedFolder = localStorage.getItem('watchedFolder') || '';

    if (watchedFolder) invoke('watch', watchedFolder);

    setPath(watchedFolder);

    const interval = setInterval(() => {
      const stored = localStorage.getItem('token') || '';

      setToken((prev) => (stored !== prev ? stored : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, [setToken]);

  return (
    <>
      <div className="draggable w-full h-8 bg-black/15" />
      <div className="text-3xl font-bold text-center mx-2.5 py-4 mt-auto">
        {path ? <>Ready to upload</> : <>Select a folder to watch</>}
      </div>
      {path && (
        <p className="text-[#ebebf599] text-sm font-bold">
          System is watching{' '}
          <code className="font-mono bg-[#282828] rounded-xs text-sm px-1.5 py-1 font-bold">
            {path}
          </code>
        </p>
      )}

      <div className="flex pt-8 flex-wrap justify-start mb-auto pb-8 gap-x-4">
        {!!token && (
          <a
            className="cursor-pointer no-underline border border-transparent text-center font-bold bg-[#32363f] flex items-center justify-center h-10 px-5 rounded-3xl text-sm hover:text-[rgba(255,255,245,0.86)] hover:bg-[#414853]"
            target="_blank"
            rel="noreferrer"
            onClick={async (e) => {
              e.preventDefault();

              const path = await invoke('dialog');

              localStorage.setItem('watchedFolder', path || '');

              await invoke('watch', path);

              setPath(path);
            }}
          >
            Select Folder
          </a>
        )}

        {!token && (
          <a
            className="cursor-pointer no-underline border border-transparent text-center font-bold bg-[#32363f] flex items-center justify-center h-10 px-5 rounded-3xl text-sm hover:text-[rgba(255,255,245,0.86)] hover:bg-[#414853]"
            target="_blank"
            rel="noreferrer"
            href="http://localhost:8080/v1/google/init"
          >
            Sign in
          </a>
        )}

        <a
          className="cursor-pointer no-underline border border-transparent text-center font-bold bg-[#32363f] flex items-center justify-center h-10 px-5 rounded-3xl text-sm hover:text-[rgba(255,255,245,0.86)] hover:bg-[#414853]"
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            e.preventDefault();

            invoke('frame', 'close');
          }}
        >
          Close App
        </a>
      </div>
    </>
  );
};
