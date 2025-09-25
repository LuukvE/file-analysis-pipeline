# File Transporter

A prototype for transporting files across the internet, while they remain isolated from inbound network traffic. Built on AWS services.

## Data Structure

```TypeScript
type Job {
  version: '2.5.21',

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
