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

export const buffer: {
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

  buffer.s3[job.region] = buffer.s3[job.region] || new S3Client(options);

  buffer.job = job;

  if (!job.chunks) return;

  for (let i = 0; i < job.chunks; i++) {
    if (buffer.chunks[i]) continue;

    const input = { Bucket: job.bucket, Key: `${job.file}-${i}` };

    buffer.chunks[i] = (async () => {
      const output = await buffer.s3[job.region].send(new GetObjectCommand(input));

      if (!(output.Body instanceof Readable)) throw `Invalid S3 file, index ${i}`;

      return output.Body;
    })();
  }

  if (buffer.destination) return;

  const xz = spawn('xz', ['-d', '-c']);

  xz.on('error', (err) => console.log('xz err', err));

  buffer.destination = xz.stdin;

  engine(job, xz.stdout);

  reconstruct(0);
}

async function reconstruct(chunk: number) {
  if (buffer.job.status === Status.UPLOADED && chunk === buffer.chunks.length) {
    console.log('File is transferred, stream should end');

    buffer.destination.end();

    buffer.destination = null;

    buffer.chunks = [];

    buffer.job = null;

    return loader.emit('loaded', buffer.job);
  }

  if (!buffer.chunks[chunk]) return loader.once('incoming', () => reconstruct(chunk));

  const stream = await buffer.chunks[chunk];

  stream.pipe(buffer.destination, { end: false });

  await finished(stream);

  console.log('Chunk #%d is loaded!', chunk + 1);

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
