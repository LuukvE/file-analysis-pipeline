export enum Status {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED'
}

export type Job = {
  id: string;
  version: string;
  created: string;
  bucket: string;
  region: string;
  file: string;
  mime: string;
  client: string;
  signature?: string;
  status?: Status;
  chunks?: number;
  processor?: string;
  uploaded?: string;
};

export type Result = {
  id: string;
  client: string;
  payload: string;
};

export type Chunk = {
  url: string;
  chunk: number;
};

export enum MessageEvent {
  CREATE = 'create',
  UPDATE = 'update',
  RECEIVE = 'receive'
}

export enum Table {
  JOBS = 'jobs',
  CHUNKS = 'chunks',
  RESULTS = 'results'
}

type JobMessage = {
  cid: string;
  table: Table.JOBS;
  event: MessageEvent;
  payload: Partial<Job>;
};

type ChunkMessage = {
  cid: string;
  table: Table.CHUNKS;
  event: MessageEvent;
  payload: Partial<Chunk>;
};

type ResultMessage = {
  cid: string;
  table: Table.RESULTS;
  event: MessageEvent;
  payload: Partial<Result>;
};

export type Message = JobMessage | ResultMessage | ChunkMessage;
