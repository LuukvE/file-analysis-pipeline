import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { pipeline, finished } from 'stream/promises';
import { Readable, Writable } from 'stream';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { Job, Status } from './types';

const buffer: {
  job: Job | null;
  s3: Record<string, S3Client>;
  chunks: Promise<Readable>[];
  destination: Writable | null;
} = {
  job: null,
  s3: {},
  chunks: [],
  destination: null
};

export const downloader = new EventEmitter<{
  incoming: [job: Job];
  downloaded: [job: Job];
}>();

downloader.on('incoming', onIncoming);

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

  buffer.destination = xz.stdin;

  const stream = createWriteStream(`../dist/${job.file}`);

  pipeline(xz.stdout, stream);

  reconstruct(0);
}

async function reconstruct(chunk: number) {
  if (buffer.job.status === Status.UPLOADED && chunk === buffer.chunks.length) {
    buffer.destination.end();

    buffer.destination = null;

    buffer.chunks = [];

    buffer.job = null;

    return downloader.emit('downloaded', buffer.job);
  }

  if (!buffer.chunks[chunk]) return downloader.once('incoming', () => reconstruct(chunk));

  const stream = await buffer.chunks[chunk];

  stream.pipe(buffer.destination, { end: false });

  await finished(stream);

  console.log('Chunk #%d is loaded!', chunk + 1);

  reconstruct(chunk + 1);
}
