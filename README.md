# File Processing Wrapper

A prototype aimed at importing files from a desktop computer, delivering it to a Docker container and broadcasting the results.

## Features

- Built on AWS services DynamoDB and S3
- Optimises file transfers with chunking and compression
- Handles file and message routing, including load balancing
- All custom software components are isolated from inbound network traffic

## Data Structure

```TypeScript
type Job {
  status: 'COMPLETED', // 'QUEUED', 'PROCESSING', 'COMPLETED', 'ERROR'
  version: '2.5.21', // set by client so outdated servers won't take the job
  assignee: 'processor-0eeb217a-266f-4563-a582-60894057dc28',
  account: 'account-a1b2c3d8-e5f6-1a7b-4c9d-0e1f9a3b4c5d',
  client: 'client-e7e66b1b-b00b-436a-940c-14309e571a51',
  bucket: 'file-processing-wrapper-production',
  created: '2025-09-25T11:21:51.690Z',
  results: { ... }
}
```

## Architecture

**File Transporter:** S3 Multipart upload + Transfer Acceleration

**Database & Messaging Service:** DynamoDB with streams

**Client:** Electron App

_Upgrades when user requests it, using @electron-forge/publisher-s3_

1. Watch a directory for new images
2. Create Job
3. Chunk image
4. Compress chunks _(zstd)_
5. Send chunks
6. Update Job _(for each file upload)_
7. Receive Job _(analysis complete)_

**Fetcher:** Container

1. Receive Job _(new requests)_
2. Update Job _(acknowledgement)_
3. Receive Job _(chunks available)_
4. Download chunks _(for each chunk)_
5. Decompress chunks _(zstd)_
6. Merge chunks
7. Send image to Processor
8. Receive results from Processor
9. Update Job _(analysis complete)_
10. Delete local image

**Processor:** Container

1. Receive image
2. Send results to Receiver

**Watcher:** Container

1. Receive updates on Jobs
2. Delete S3 chunks for completed Jobs
3. Periodically check stalled Jobs _(CRON)_
4. Restart stalled Jobs _(keep track of retries)_
5. Notify when queue length exceeds threshold _(autoscale?)_
