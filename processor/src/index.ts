import { Job, Result, Table } from 'shared/types';
import loader, { memory } from './loader';
import { DynamoDB } from 'shared/dynamodb';
import { encrypt } from 'shared/crypto';

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

async function onProcessed(job: Job, payload: string) {
  const result: Result = {
    id: `result-${crypto.randomUUID()}`,
    cid: crypto.randomUUID(),
    table: Table.RESULTS,
    client: job.client,
    payload: encrypt(job.client.substring(7), payload)
  };

  await db.create<Result>(result, 'results');

  const newJob = Object.values(available)[0];

  if (newJob) take(newJob);
}

function take(job: Job) {
  available[job.id] = job;

  console.log('emitting take', job.id, job.chunks, memory.job);

  if (!job.chunks) return;

  if (memory.job) return;

  console.log('update', { id: job.id, processor });

  db.update({ id: job.id, processor }, 'jobs', 'attribute_not_exists(processor)');
}
