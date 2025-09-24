# File Transporter

A prototype architecture for transporting files between two Docker containers across the internet, while they remain isolated from inbound network traffic. Built on AWS services. Fault-tollerant.

**Message Transporter:** DynamoDB with streams

**File Transporter:** S3 Multipart upload + Transfer Acceleration

**Sender:** Container
  1. Create Job
  1. Chunk image
  2. Compress chunks _(zstd)_
  3. Send chunks
  4. Update Job _(for each file upload)_
  5. Receive Job _(analysis complete)_

**Receiver:** Container
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
