export enum Status {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED'
}

export enum Table {
  JOBS = 'jobs',
  CHUNKS = 'chunks',
  RESULTS = 'results'
}

export interface Message {
  id: string;
  cid: string;
  table: Table;
}

export interface Job extends Message {
  version: string;
  created: string;
  mime: string;
  client: string;
  signature?: string;
  status?: Status;
  chunks?: number;
  processor?: string;
  uploaded?: string;
}

export interface Result extends Message {
  job: string;
  client: string;
  payload: string;
}

export interface Chunk extends Message {
  job: string;
  index: number;
  url: string;
}
