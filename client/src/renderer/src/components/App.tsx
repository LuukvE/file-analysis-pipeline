import { useState } from 'react';

const { invoke } = window.electron.ipcRenderer;

const watchedFolder = localStorage.getItem('watchedFolder') || '';

if (watchedFolder) invoke('watch', watchedFolder);

export default () => {
  const [path, setPath] = useState(watchedFolder);

  return (
    <>
      <div className="text">{path ? <>Ready to upload</> : <>Select a folder to watch</>}</div>
      {path && (
        <p className="tip">
          System is watching <code>{path}</code>
        </p>
      )}
      <div className="actions">
        <div className="action">
          <a
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
