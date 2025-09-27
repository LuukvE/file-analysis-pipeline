export enum JobStatus {
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
  status?: JobStatus;
  chunks?: number;
  processor?: string;
  assigned?: string;
  uploaded?: string;
  downloaded?: string;
  results?: string;
  error?: string;
  processed?: string;
};

export enum ResultStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type Result = {
  id: string;
  created: string;
  file: string;
  client: string;
  status: ResultStatus;
  processor: string;
  results: string;
  error: string;
};
