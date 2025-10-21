import { RefObject } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Chunk, Job, Result, Status, Table } from 'shared/types';

export { Table, Status };

export type Row = { progress?: Chunk[]; result?: Result } & Job;

export type GridRef = RefObject<AgGridReact<Row> | null> | null;

export type State = {
  token: string;
  folder: string;
  rows: Record<string, Row>;
  add: (message: Row) => void;
  update: (payload: Partial<State>) => void;
};
