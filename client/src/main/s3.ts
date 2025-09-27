import { PassThrough } from 'stream';
import { createReadStream } from 'fs';
import { spawn } from 'child_process';
import { Upload } from '@aws-sdk/lib-storage';
import { CompleteMultipartUploadCommandOutput, S3Client } from '@aws-sdk/client-s3';

import { Status } from './types';
import { createJob, updateJob } from './db';
import { awsBuckets, minChunkSize } from './settings';

export async function upload(path: string): Promise<void> {
  const source = createReadStream(path);
  const id = `job-${crypto.randomUUID()}`;
  const { bucket, region } = awsBuckets[0];
  const file = `file-${crypto.randomUUID()}`;
  const xz = spawn('xz', ['-c', '-z', '-9e']);
  const s3 = new S3Client({ region, useAccelerateEndpoint: true });

  return new Promise((resolve, reject) => {
    let size = 0;
    let aws: PassThrough;
    const uploads: Promise<CompleteMultipartUploadCommandOutput>[] = [];

    reset();

    xz.on('close', onDone);
    xz.stdout.on('data', onChunk);
    xz.on('error', (err) => kill(`xz Error: ${err.message}`));
    xz.stderr.on('data', (data: Buffer) => console.error(`[xz stderr]: ${data.toString()}`));

    source.on('error', (err) => kill(`Read Error: ${err.message}`));
    source.pipe(xz.stdin);

    function onChunk(chunk: Buffer) {
      aws.write(chunk);

      size += chunk.length;

      if (size >= minChunkSize) reset();
    }

    async function onDone(code: number) {
      aws.end();

      if (code !== 0) return reject(new Error(`xz exited with code ${code}`));

      await Promise.all(uploads);

      await updateJob(id, uploads.length, Status.UPLOADED);

      resolve();
    }

    async function reset() {
      const index = uploads.length;
      const key = `${file}-${index}`;

      aws?.end();

      size = 0;
      aws = new PassThrough();

      const { done } = new Upload({
        client: s3,
        params: {
          Bucket: bucket,
          Key: key,
          Body: aws
        }
      });

      uploads.push(done());

      await uploads[index];

      if (index === 0) return createJob(id, file, bucket, region);

      updateJob(id, uploads.length, Status.UPLOADING);
    }

    function kill(err: string) {
      xz?.kill();
      aws?.end();
      source?.destroy();

      reject(new Error(err));
    }
  });
}
