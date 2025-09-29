import { Job } from './types';
import { database } from './db';
import loader, { memory } from './loader';

const processor = `processor-${crypto.randomUUID()}`;
const available: Record<string, Job> = {};

database.on('change', onChange);

database.on('result', onResult);

function onChange(job: Job) {
  console.log('changed', job);

  if (!job.processor) return take(job);

  delete available[job.id];

  if (job.processor !== processor) return;

  loader.emit('incoming', job);
}

function take(job: Job) {
  available[job.id] = job;

  console.log('emitting take', job.id, job.chunks);

  if (!job.chunks) return;

  if (memory.job) return;

  database.emit('take', job, processor);
}

async function onResult() {
  const newJob = Object.values(available)[0];

  if (newJob) take(newJob);
}
