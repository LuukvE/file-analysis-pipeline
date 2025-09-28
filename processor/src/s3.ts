import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable, Writable } from 'stream';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { Job, Status } from './types';

const buffer: {
  s3: Record<string, S3Client>;
  chunks: Promise<Readable>[];
  destination: Writable | null;
} = {
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

  console.log('receiving', job);

  await setDestination(job);

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

  if (job.status !== Status.UPLOADED) return;

  for (let i = 0; i < job.chunks; i++) {
    const stream = await buffer.chunks[i];

    await pipeline(stream, buffer.destination, { end: i === buffer.chunks.length - 1 });
  }

  buffer.destination = null;

  buffer.chunks = [];

  downloader.emit('downloaded', job);
}

async function setDestination(job: Job) {
  if (buffer.destination) return;

  const xz = spawn('xz', ['-d', '-c']);

  const stream = createWriteStream(`../dist/${job.file}`);

  pipeline(xz.stdout, stream);

  buffer.destination = xz.stdin;
}
