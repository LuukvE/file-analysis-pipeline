import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  ColDef,
  themeAlpine,
  GetRowIdFunc,
  ModuleRegistry,
  AllCommunityModule,
  SizeColumnsToFitGridStrategy
} from 'ag-grid-community';

import { GridRef, Row } from '../types';
import useStore from '../hooks/useStore';

import Size from './Size';
import Time from './Time';
import Status from './Status';
import Progress from './Progress';

ModuleRegistry.registerModules([AllCommunityModule]);

const columnDefs: ColDef<Row>[] = [
  { field: 'status', headerName: '', cellRenderer: Status, minWidth: 60, maxWidth: 60 },
  { field: 'file', minWidth: 250 },
  {
    field: 'chunks',
    minWidth: 250,
    maxWidth: 250,
    cellRenderer: Progress,
    headerName: 'Progress'
  },
  { field: 'size', maxWidth: 130, cellRenderer: Size },
  { field: 'mime', maxWidth: 130 },
  { field: 'created', maxWidth: 250, cellRenderer: Time },
  { field: 'processor', maxWidth: 130 },
  { field: 'result' }
];

const autoSizeStrategy: SizeColumnsToFitGridStrategy = { type: 'fitGridWidth' };

export default ({ grid }: { grid: GridRef }) => {
  const { add, rows } = useStore();
  const theme = themeAlpine.withParams({ accentColor: '#F4A261' });

  const getRowId = useCallback<GetRowIdFunc<Row>>((row) => row.data.id, []);

  const rowData = useMemo(() => Object.values(rows), [rows]);

  useEffect(() => {
    window.electron.ipcRenderer.on('row', (_, row: Row) => add(row));

    return () => {
      window.electron.ipcRenderer.removeAllListeners('row');
    };
  }, []);

  useLayoutEffect(() => {
    let timeout = 0;

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);

      clearTimeout(timeout);
    };

    function resize() {
      if (timeout) clearTimeout(timeout);

      timeout = window.setTimeout(() => grid?.current?.api?.sizeColumnsToFit(), 50);
    }
  }, []);

  return (
    <div className="flex flex-grow w-full pb-1 px-1">
      <div className="w-full h-full block">
        <AgGridReact
          ref={grid}
          theme={theme}
          rowData={rowData}
          getRowId={getRowId}
          columnDefs={columnDefs}
          autoSizeStrategy={autoSizeStrategy}
        />
      </div>
    </div>
  );
};
