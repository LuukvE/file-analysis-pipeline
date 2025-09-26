import fs from 'fs';
import { spawn } from 'child_process';
import { awsBuckets } from './settings';

export async function upload(path: string): Promise<{ url: string; region: string }> {
  const { bucket, region } = awsBuckets[0];
  const url = `s3://${bucket}/file-${crypto.randomUUID()}.xz`;
  const xzArgs = `-c -z -9e`.split(' ');
  const awsArgs = `s3 cp - ${url} --use-accelerate-endpoint --region ${region}`.split(' ');
  const source: fs.ReadStream = fs.createReadStream(path);
  const xz = spawn('xz', xzArgs);

  return new Promise((resolve, reject) => {
    source.on('error', (err) => kill(`Read Error: ${err.message}`));

    xz.on('error', (err) => kill(`xz Error: ${err.message}`));

    xz.stderr.on('data', (data: Buffer) => console.error(`[xz stderr]: ${data.toString()}`));

    source.pipe(xz.stdin);

    // xz.stdout.pipe(aws.stdin);

    // const aws = spawn('aws', awsArgs);
    // aws.on('error', (err) => kill(`AWS Error: ${err.message}`));

    // aws.stderr.on('data', (data: Buffer) => console.error(`[aws stderr]: ${data.toString()}`));

    // aws.on('close', (c) => (c === 0 ? resolve({ url, region }) : kill(`AWS exit code ${c}.`)));

    function kill(err: string) {
      source?.destroy();
      xz?.kill();
      // aws?.kill();

      reject(new Error(err));
    }
  });
}
