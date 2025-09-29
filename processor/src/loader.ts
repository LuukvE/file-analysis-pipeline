import { IncomingMessage, request } from 'http';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { finished } from 'stream/promises';
import { Readable, Writable } from 'stream';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { Job, Status } from './types';
import { database } from './db';

const loader = new EventEmitter<{
  incoming: [job: Job];
  loaded: [job: Job];
}>();

export default loader;

export const memory: {
  job: Job | null;
  s3: Record<string, S3Client>;
  chunks: Promise<Readable>[];
  request: Promise<Response> | null;
  destination: Writable | null;
} = {
  job: null,
  s3: {},
  chunks: [],
  request: null,
  destination: null
};

loader.on('incoming', onIncoming);

async function onIncoming(job: Job) {
  const options = { region: job.region, useAccelerateEndpoint: true };

  memory.s3[job.region] = memory.s3[job.region] || new S3Client(options);

  memory.job = job;

  if (!job.chunks) return;

  for (let i = 0; i < job.chunks; i++) {
    if (memory.chunks[i]) continue;

    const input = { Bucket: job.bucket, Key: `${job.file}-${i}` };

    memory.chunks[i] = (async () => {
      const output = await memory.s3[job.region].send(new GetObjectCommand(input));

      if (!(output.Body instanceof Readable)) throw `Invalid S3 file, index ${i}`;

      return output.Body;
    })();
  }

  if (memory.destination) return;

  const xz = spawn('xz', ['-d', '-c']);

  xz.on('error', (err) => console.log('xz err', err));

  memory.destination = xz.stdin;

  engine(job, xz.stdout);

  reconstruct(0);
}

async function reconstruct(chunk: number) {
  console.log(
    'reconstruct',
    memory.job.status,
    chunk === memory.chunks.length ? 'DONE' : 'STILL PROCESSING'
  );

  if (memory.job.status === Status.UPLOADED && chunk === memory.chunks.length) {
    console.log('File is transferred, stream should end');

    memory.destination.end();

    memory.destination = null;

    memory.chunks = [];

    memory.job = null;

    return;
  }

  if (!memory.chunks[chunk]) return loader.once('incoming', () => reconstruct(chunk));

  const stream = await memory.chunks[chunk];

  stream.pipe(memory.destination, { end: false });

  await finished(stream);

  reconstruct(chunk + 1);
}

function engine(job: Job, stream: Readable) {
  const options = {
    hostname: 'engine',
    port: 8000,
    path: '/',
    method: 'POST',
    headers: { 'Content-Type': job.mime }
  };

  console.log(options);

  const req = request(options, callback);

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  stream.pipe(req);

  function callback(res: IncomingMessage) {
    let body = '';

    res.setEncoding('utf8');

    res.on('data', (chunk) => (body += chunk));

    res.on('end', () => database.emit('result', job, `${body}`));
  }
}
