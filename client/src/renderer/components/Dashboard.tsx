import { GridRef } from '../types';
import useIpc from '../hooks/useIpc';
import useStore from '../hooks/useStore';

import Button from './Button';
import Grid from './Grid';

export default ({ grid }: { grid: GridRef }) => {
  const { folder } = useStore((s) => s);
  const { selectFolder, signout } = useIpc({ grid });

  return (
    <>
      <div className="mx-2.5 py-4 mt-auto flex items-center">
        <h2 className="text-2xl font-bold text-center bg-[linear-gradient(90deg,#E76F51_0%,#F4A261_100%)] bg-clip-text text-transparent">
          {folder ? 'Watching' : 'Ready to watch a folder'}
        </h2>
        {!!folder && (
          <code className="font-mono text-[#333] bg-[#264653]/20 ml-3 rounded-xs text-sm px-2 py-0.5 font-bold">
            {folder}
          </code>
        )}
        <Button
          className="ml-3"
          onClick={async (e) => {
            e.preventDefault();

            selectFolder();
          }}
        >
          {folder ? 'Change' : 'Select'}
        </Button>
      </div>

      <Grid grid={grid} />

      <Button
        className="mb-1 mr-1 ml-auto py-1 px-1.5 h-5 rounded opacity-50 hover:opacity-100 hover:bg-[#E76F51] text-[10px]"
        onClick={(e) => {
          e.preventDefault();

          signout();
        }}
      >
        Sign out
      </Button>
    </>
  );
};
