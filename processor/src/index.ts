import { randomUUID } from 'crypto';
import { Job, Result, Table, dynamodb, crypto } from 'shared';

import loader, { memory } from './loader';

const db = new dynamodb.DynamoDB();
const available: Record<string, Job> = {};
const processor = `processor-${randomUUID()}`;

db.on('change:jobs', onChange);

loader.on('processed', onProcessed);

function onChange(job: Job) {
  if (!job.processor) return take(job);

  delete available[job.id];

  if (job.processor !== processor) return;

  loader.emit('incoming', job);
}

async function onProcessed(job: Job, payload: string) {
  const result: Result = {
    id: `result-${randomUUID()}`,
    cid: randomUUID(),
    table: Table.RESULTS,
    client: job.client,
    payload: crypto.encrypt(job.client.substring(7), payload)
  };

  await db.create<Result>(result, 'results');

  const newJob = Object.values(available)[0];

  if (newJob) take(newJob);
}

function take(job: Job) {
  available[job.id] = job;

  if (!job.chunks) return;

  if (memory.job) return;

  db.update({ id: job.id, processor }, 'jobs', 'attribute_not_exists(processor)');
}
