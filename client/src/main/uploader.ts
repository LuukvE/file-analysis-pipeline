import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs';

import { app } from 'electron';
import { createJob, updateJob } from './db';
import { awsBuckets, minChunkSize, publicKey } from './settings';
import { Job, Status } from './types';

export async function upload(path: string): Promise<void> {
  const id = `job-${crypto.randomUUID()}`;
  const source = fs.createReadStream(path);
  const { bucket, region } = awsBuckets[0];
  const xz = spawn('xz', `-c -z -9e`.split(' '));
  const file = `file-${crypto.randomUUID()}`;
  const baseUrl = `s3://${bucket}/${file}`;

  return new Promise((resolve, reject) => {
    let size = 0;
    let aws: ChildProcessWithoutNullStreams;
    const uploads: Promise<string>[] = [];

    reset();

    xz.on('close', onDone);
    xz.on('error', (err) => kill(`xz Error: ${err.message}`));

    xz.stderr.on('data', (data: Buffer) => console.error(`[xz stderr]: ${data.toString()}`));
    xz.stdout.on('data', onChunk);

    source.on('error', (err) => kill(`Read Error: ${err.message}`));
    source.pipe(xz.stdin);

    function onChunk(chunk: any) {
      const busy = !aws.stdin.write(chunk);

      size += chunk.length;

      if (!busy) return reset();

      xz.stdout.pause();

      aws.stdin.once('drain', () => {
        reset();

        xz.stdout.resume();
      });
    }

    async function onDone(code: number) {
      aws.stdin.end(); // finalize final upload

      if (code !== 0) return reject(`xz exit code ${code}`);

      const errors = await Promise.all(uploads);

      if (errors.find((err) => !!err)) return reject(`AWS errors: ${JSON.stringify(errors)}`);

      await updateJob(id, uploads.length);

      resolve();
    }

    async function reset() {
      if (size < minChunkSize) return;

      const awsArgs = `s3 cp - ${baseUrl}-${uploads.length} --region ${region}`;

      if (aws) aws.stdin.end(); // finalize previous upload

      size = 0;

      aws = spawn('aws', awsArgs.split(' '));

      aws.stderr.on('data', (data: Buffer) => console.error(`[aws stderr]: ${data.toString()}`));

      uploads.push(
        new Promise((resolve, reject) => {
          aws!.on('error', (err) => reject(`AWS Error: ${err.message}`));
          aws!.on('close', (c) => (c === 0 ? resolve('') : reject(`AWS exit code ${c}`)));
        })
      );

      if (uploads.length !== 1) return;

      const job: Job = {
        id,
        status: Status.UPLOADING,
        version: app.getVersion(),
        created: new Date().toJSON(),
        bucket,
        region,
        file,
        client: `client-${publicKey}`
      };

      await uploads[0];

      await createJob(job);
    }

    function kill(err: string) {
      xz?.kill();
      aws?.kill();
      source?.destroy();

      reject(new Error(err));
    }
  });
}
