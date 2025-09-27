export enum Status {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR'
}

export type Job = {
  id: string;
  status: Status;
  version: string;
  created: string;
  bucket: string;
  region: string;
  file: string;
  client: string;
  signature?: string;
  chunks?: number;
  processor?: string;
  assigned?: string;
  uploaded?: string;
  downloaded?: string;
  results?: string;
  error?: string;
  processed?: string;
};
