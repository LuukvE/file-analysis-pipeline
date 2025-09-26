import { useState } from 'react';

const { invoke } = window.electron.ipcRenderer;

const watchedFolder = localStorage.getItem('watchedFolder') || '';

if (watchedFolder) invoke('watch', watchedFolder);

export default () => {
  const [path, setPath] = useState(watchedFolder);

  return (
    <>
      <div className="text-3xl font-bold text-center mx-2.5 py-4">
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

      <div className="flex pt-8 m-[-6px] flex-wrap justify-start">
        <div>
          <a
            className="cursor-pointer no-underline border border-transparent text-center font-bold"
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
        </div>
        <div className="action">
          <a
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
      </div>
      <ul className="versions">
        <li className="chrome-version">File Analyzer v0.1.0</li>
      </ul>
    </>
  );
};
