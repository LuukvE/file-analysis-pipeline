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

export enum MessageEvent {
  CREATE = 'create',
  UPDATE = 'update',
  RECEIVE = 'receive'
}

export enum Table {
  JOBS = 'jobs',
  RESULTS = 'results'
}

export type Message = {
  table: Table;
  event: MessageEvent;
  payload: Job | Result;
};
