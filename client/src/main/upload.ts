import { PassThrough } from 'stream';
import { Chunk, Job, Status, Table } from 'shared/types';
import { spawn } from 'child_process';
import { createReadStream } from 'fs';

import { createJob, send } from './ws';
import { minChunkSize } from './settings';

type Update = { index: number; done: boolean };

export default async function (path: string): Promise<void> {
  const queues: {
    chunks: Promise<Chunk>[];
    updates: Update[];
  } = {
    chunks: [],
    updates: []
  };

  const tracker: {
    job: string;
    size: number;
    index: number;
    destination: PassThrough;
  } = {
    job: '',
    size: 0,
    index: 0,
    destination: new PassThrough()
  };

  const source = createReadStream(path);
  const xz = spawn('xz', ['-c', '-z', '-9e']);

  console.log(1, 'creating job');

  createJob(path).then(getFirstChunk);

  console.log('incoming', path);

  xz.on('close', finish);
  xz.stdout.on('data', onData);
  xz.on('error', (err) => kill(`xz Error: ${err.message}`));
  xz.stderr.on('data', (data: Buffer) => console.error(`[xz stderr]: ${data.toString()}`));

  source.on('error', (err) => kill(`Read Error: ${err.message}`));
  source.pipe(xz.stdin);

  function getFirstChunk(job: Job) {
    console.log(2, 'job created', job);

    tracker.job = job.id;

    const chunk: Chunk = {
      id: '',
      cid: crypto.randomUUID(),
      table: Table.CHUNKS,
      job: job.id,
      index: 0,
      url: ''
    };

    console.log(3, 'creating chunk', job);

    queues.chunks.push(send<Chunk>(chunk));
  }

  function kill(err: string) {
    console.error(err);

    xz?.kill();
    source?.destroy();
    tracker.destination.end();
  }

  function onData(data: Buffer) {
    tracker.destination.write(data);

    tracker.size += data.length;

    if (tracker.size >= minChunkSize) reset();
  }

  async function reset() {
    upload({ done: false, index: tracker.index });

    tracker.size = 0;

    tracker.index += 1;

    tracker.destination = new PassThrough();

    queues.chunks.push(
      send<Chunk>({
        id: '',
        cid: crypto.randomUUID(),
        table: Table.CHUNKS,
        index: tracker.index,
        job: tracker.job,
        url: ''
      })
    );
  }

  async function finish(code: number) {
    upload({ done: true, index: tracker.index });

    if (code !== 0) console.error(`xz exited with code ${code}`);
  }

  async function upload({ done, index }: Update) {
    const destination = tracker.destination;

    destination.end();

    const chunk = await queues.chunks[index];

    console.log('uploading', index, 'to', chunk.url, 'final?', done);

    // TODO
    await new Promise((cb) => setTimeout(cb, 5000));

    addUpdate({ done, index });
  }

  async function addUpdate({ done, index }: { done: boolean; index: number }) {
    const looping = !!queues.updates.length;

    queues.updates.push({ done, index });

    if (looping) return;

    return (async function loop({ done, index }) {
      send<Job>({
        id: tracker.job,
        cid: crypto.randomUUID(),
        table: Table.JOBS,
        chunks: index + 1,
        status: done ? Status.UPLOADED : Status.UPLOADING
      });

      queues.updates.shift();

      if (queues.updates.length) loop(queues.updates[0]);
    })({ done, index });
  }
}
