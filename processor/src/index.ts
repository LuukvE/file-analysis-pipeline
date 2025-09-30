import { Job } from 'shared/types';
import loader, { memory } from './loader';
import { DynamoDB } from 'shared/dynamodb';

const db = new DynamoDB();
const available: Record<string, Job> = {};
const processor = `processor-${crypto.randomUUID()}`;

db.on('change:jobs', onChange);

loader.on('processed', onProcessed);

function onChange(job: Job) {
  console.log('changed', job);

  if (!job.processor) return take(job);

  delete available[job.id];

  if (job.processor !== processor) return;

  loader.emit('incoming', job);
}

async function onProcessed() {
  const newJob = Object.values(available)[0];

  if (newJob) take(newJob);
}

function take(job: Job) {
  available[job.id] = job;

  console.log('emitting take', job.id, job.chunks);

  if (!job.chunks) return;

  if (memory.job) return;

  db.update(job, 'jobs', 'attribute_not_exists(processor)');
}
