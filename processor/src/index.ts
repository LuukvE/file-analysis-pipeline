import { Job } from './types';
import { database } from './db';
import loader, { buffer } from './loader';

const processor = `processor-${crypto.randomUUID()}`;

console.log('Processor ID:', processor);

const memory: {
  available: Record<string, Job>;
  loading: Job | null;
  processing: Job | null;
} = {
  available: {},
  loading: null,
  processing: null
};

database.on('change', onChange);

loader.on('loaded', onLoaded);

function onChange(job: Job) {
  if (!job.processor) return take(job);

  delete memory.available[job.id];

  if (job.processor !== processor) return;

  memory.loading = job;

  loader.emit('incoming', job);
}

function take(job: Job) {
  memory.available[job.id] = job;

  if (!job.chunks) return;

  if (memory.loading) return;

  database.emit('take', job, processor);
}

async function onLoaded(job: Job) {
  await buffer.request;

  memory.processing = job;

  memory.loading = null;

  const newJob = Object.values(memory.available)[0];

  if (newJob) database.emit('take', newJob, processor);
}
