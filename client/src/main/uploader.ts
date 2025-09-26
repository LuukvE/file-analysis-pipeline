import { awsBuckets } from './settings';

console.log(awsBuckets);

export function incomingFile(path: string) {
  console.log('we should upload', path);
}

// Multipart Upload
// Amazon S3 Transfer Acceleration
// Compress Data Before Uploading
// Parallelizing at the destination level
