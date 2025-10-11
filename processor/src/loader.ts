import { EventEmitter } from 'events';
import { IncomingMessage, request } from 'http';
import { Job, Status } from 'shared';
import { Readable, Writable } from 'stream';
import { spawn } from 'child_process';
import { finished } from 'stream/promises';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const REGION = process.env['AWS_REGION'];
const BUCKET = process.env['AWS_BUCKET'];

const loader = new EventEmitter<{
  incoming: [job: Job];
  loaded: [job: Job];
  processed: [job: Job, result: string];
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
  memory.job = job;

  memory.s3[REGION] = memory.s3[REGION] || new S3Client({ forcePathStyle: true });

  if (!job.chunks) return;
  for (let i = 0; i < job.chunks; i++) {
    if (memory.chunks[i]) continue;

    const input = { Bucket: BUCKET, Key: `${job.id}-${i}` };

    memory.chunks[i] = (async () => {
      const output = await memory.s3[REGION].send(new GetObjectCommand(input));

      if (!(output.Body instanceof Readable)) throw `Invalid S3 file, index ${i}`;

      return output.Body;
    })();
  }

  if (memory.destination) return;

  const xz = spawn('xz', ['-d', '-c']);

  xz.on('error', (err) => {});

  memory.destination = xz.stdin;

  engine(job, xz.stdout);

  reconstruct(0);
}

async function reconstruct(chunk: number) {
  if (memory.job.status === Status.UPLOADED && chunk === memory.chunks.length) {
    return finish();
  }

  if (!memory.chunks[chunk]) return loader.once('incoming', () => reconstruct(chunk));

  const stream = await memory.chunks[chunk];

  stream.pipe(memory.destination, { end: false });

  await finished(stream);

  reconstruct(chunk + 1);
}

function finish() {
  memory.destination.end();

  memory.destination = null;

  memory.chunks = [];

  memory.job = null;
}

function engine(job: Job, stream: Readable) {
  const options = {
    hostname: 'engine',
    port: 8000,
    path: '/',
    method: 'POST',
    headers: { 'Content-Type': job.mime }
  };

  const req = request(options, (res) => engineHandler(job, res));

  req.on('error', (e) => console.error(`Problem with request: ${e.message}`));

  stream.pipe(req);
}

function engineHandler(job: Job, res: IncomingMessage) {
  let body = '';

  res.setEncoding('utf8');

  res.on('data', (chunk) => (body += chunk));

  res.on('end', () => loader.emit('processed', job, `${body}`));
}
