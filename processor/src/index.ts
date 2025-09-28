import { database } from './db';
import { downloader } from './s3';
import { Job } from './types';

const processor = `processor-${crypto.randomUUID()}`;

const memory: {
  available: Record<string, Job>;
  downloading: Job | null;
  processing: Job | null;
} = {
  available: {},
  downloading: null,
  processing: null
};

database.on('change', onChange);

downloader.on('downloaded', onDownloaded);

function onChange(job: Job) {
  if (!job.processor) return take(job);

  delete memory.available[job.id];

  if (job.processor !== processor) return;

  memory.downloading = job;

  downloader.emit('incoming', job);
}

function take(job: Job) {
  memory.available[job.id] = job;

  if (!job.chunks) return;

  if (memory.downloading) return;

  database.emit('take', job, processor);
}

async function onDownloaded(job: Job) {
  await engineAvailable();

  memory.processing = job;

  memory.downloading = null;

  const newJob = Object.values(memory.available)[0];

  if (newJob) database.emit('take', newJob, processor);
}

async function engineAvailable() {
  return true;
}
