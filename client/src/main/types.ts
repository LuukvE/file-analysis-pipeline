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
  client: string;
  signature?: string;
  status?: Status;
  chunks?: number;
  processor?: string;
  assigned?: string;
  uploaded?: string;
  downloaded?: string;
  processed?: string;
};

export type Result = {
  id: string;
  client: string;
  payload: string;
};
