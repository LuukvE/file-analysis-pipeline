import { request } from 'http';
import { randomUUID } from 'crypto';
import { PassThrough } from 'stream';
import { createReadStream } from 'fs';
import { spawn } from 'child_process';
import { Chunk, Job, Status, Table } from 'shared';

import { Socket } from './socket';
import { minChunkSize } from './settings';

type Update = { index: number; done: boolean };

export default async function (path: string, job: Job, socket: Socket) {
  const queues: {
    chunks: Promise<Chunk | void>[];
    updates: Update[];
  } = {
    chunks: [],
    updates: []
  };

  const tracker: {
    size: number;
    index: number;
    destination: PassThrough;
    uploaded?: (v: null) => void;
  } = {
    size: 0,
    index: 0,
    destination: new PassThrough()
  };

  const source = createReadStream(path);
  const xz = spawn('xz', ['-c', '-z', '-9e']);

  xz.on('close', finish);
  xz.on('error', (err) => kill(`xz Error: ${err.message}`));

  xz.stdout.on('data', onData);
  xz.stderr.on('data', (data: Buffer) => console.error('xz err', data.toString()));

  source.on('error', (err) => kill(`Read Error: ${err.message}`));

  queues.chunks.push(getFirstChunk());

  return new Promise<null>((uploaded) => (tracker.uploaded = uploaded));

  async function getFirstChunk() {
    source.pipe(xz.stdin);

    const chunk: Chunk = {
      id: '',
      cid: randomUUID(),
      table: Table.CHUNKS,
      job: job.id,
      index: 0,
      url: ''
    };

    return socket.send<Chunk>(chunk);
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
      socket.send<Chunk>({
        id: '',
        cid: randomUUID(),
        table: Table.CHUNKS,
        index: tracker.index,
        job: job.id,
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

    if (!chunk) return kill('Chunk not found');

    console.log('chunk #', chunk.index);

    const options = {
      method: 'PUT',
      headers: { 'Content-Type': job.mime }
    };

    const req = request(chunk.url, options, () => addUpdate({ done, index }));

    req.on('error', (e) => console.error('Upload error', e));

    destination.pipe(req);
  }

  async function addUpdate({ done, index }: { done: boolean; index: number }) {
    const looping = !!queues.updates.length;

    queues.updates.push({ done, index });

    if (looping) return;

    return (async function loop({ done, index }) {
      await socket.send<Job>({
        id: job.id,
        cid: randomUUID(),
        table: Table.JOBS,
        chunks: index + 1,
        status: done ? Status.UPLOADED : Status.UPLOADING
      });

      queues.updates.shift();

      if (queues.updates.length) return loop(queues.updates[0]);

      if (done) tracker.uploaded?.(null);
    })({ done, index });
  }
}
