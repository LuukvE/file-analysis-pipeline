import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community';

import { GridRef, Row, Status, Table } from '../types';

ModuleRegistry.registerModules([AllCommunityModule]);

const columnDefs: ColDef<Row>[] = [
  { field: 'id' },
  { field: 'file' },
  { field: 'size' },
  { field: 'mime' }
];

const rowData: Row[] = [
  {
    file: 'test',
    size: '100 MB',
    mime: 'text/plain',
    id: '1',
    chunks: 2,
    version: '1',
    created: '2025-10-21T11:35:00.000Z',
    client: 'test',
    signature: 'test',
    status: Status.UPLOADED,
    progress: [],
    cid: '1',
    table: Table.JOBS
  }
];

export default ({ grid }: { grid: GridRef }) => {
  return (
    <div className="flex flex-grow w-full pb-2 px-2">
      <div className="w-full h-full block">
        <AgGridReact ref={grid} columnDefs={columnDefs} rowData={rowData} />
      </div>
    </div>
  );
};
