import Button from './Button';
import useIpc from '../hooks/useIpc';
import useStore from '../hooks/useStore';
import Login from './Login';
import Dashboard from './Dashboard';
import { GridRef } from '../types';
import { useRef } from 'react';

export default () => {
  const grid: GridRef = useRef(null);
  const { close } = useIpc({ grid });
  const token = useStore((s) => s.token);

  return (
    <div className="bg-white/70 w-full h-full flex flex-col items-center">
      <div className="w-full h-8 fixed top-0 left-0 w-full flex">
        <div className="draggable grow h-4" />
        <Button
          className="mt-1 mr-1 p-1 h-5 rounded hover:bg-[#E76F51]"
          onClick={(e) => {
            e.preventDefault();

            close();
          }}
        >
          ✕
        </Button>
      </div>

      {!token && <Login />}

      {!!token && <Dashboard grid={grid} />}
    </div>
  );
};
