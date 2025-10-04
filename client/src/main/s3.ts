import { app } from 'electron';
import { lookup } from 'mime-types';
import { PassThrough } from 'stream';
import { createReadStream } from 'fs';
import { spawn } from 'child_process';
import { decrypt } from 'shared/crypto';
import { DynamoDB } from 'shared/dynamodb';
import { Upload } from '@aws-sdk/lib-storage';
import { Job, Result, Status } from 'shared/types';
import { CompleteMultipartUploadCommandOutput, S3Client } from '@aws-sdk/client-s3';

import { minChunkSize, privateKey, publicKey } from './settings';

const db = new DynamoDB();

db.on('change:results', (result: Result) => {
  console.log('Engine Result:', decrypt(privateKey, result.payload));
});

export async function upload(path: string): Promise<void> {
  const source = createReadStream(path);
  const id = `job-${crypto.randomUUID()}`;
  const file = `file-${crypto.randomUUID()}`;
  const xz = spawn('xz', ['-c', '-z', '-9e']);
  const mime = lookup(path) || 'application/octet-stream';
  const s3 = new S3Client({ forcePathStyle: true });

  console.log('Incoming', path);

  return new Promise((resolve, reject) => {
    const uploads: Promise<CompleteMultipartUploadCommandOutput>[] = [];

    const payload: {
      size: number;
      chunks: number;
      destination?: PassThrough;
    } = {
      size: 0,
      chunks: 0
    };

    reset();

    xz.on('close', onDone);
    xz.stdout.on('data', onData);
    xz.on('error', (err) => kill(`xz Error: ${err.message}`));
    xz.stderr.on('data', (data: Buffer) => console.error(`[xz stderr]: ${data.toString()}`));

    source.on('error', (err) => kill(`Read Error: ${err.message}`));
    source.pipe(xz.stdin);

    function onData(data: Buffer) {
      payload.destination!.write(data);

      payload.size += data.length;

      if (payload.size >= minChunkSize) reset();
    }

    async function onDone(code: number) {
      payload.destination!.end();

      if (code !== 0) return reject(new Error(`xz exited with code ${code}`));

      await Promise.all(uploads);

      await db.update({ id, chunks: payload.chunks, status: Status.UPLOADED }, 'jobs');

      resolve();
    }

    async function reset() {
      const index = uploads.length;
      const key = `${file}-${index}`;

      payload.destination?.end();

      payload.size = 0;

      payload.chunks += 1;

      payload.destination = new PassThrough();

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: 'bucket-file-analysis-pipeline',
          Key: key,
          Body: payload.destination
        }
      });

      uploads.push(upload.done());

      await uploads[index];

      if (index > 0) return db.update({ id, chunks: index + 1 }, 'jobs', '#chunks < :chunks');

      const job: Job = {
        id,
        version: app.getVersion(),
        created: new Date().toJSON(),
        bucket: 'bucket-file-analysis-pipeline',
        region: 'eu-west-1',
        file,
        mime,
        client: `client-${publicKey}`
      };

      return db.create<Job>(job, 'jobs');
    }

    function kill(err: string) {
      xz?.kill();
      source?.destroy();
      payload.destination?.end();

      reject(new Error(err));
    }
  });
}
