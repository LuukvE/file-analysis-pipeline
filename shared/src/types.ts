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
