# File Analysis Pipeline

A secure, scalable pipeline for your existing analysis container.

This is a prototype aimed at importing files from desktop computers, delivering them to a scalable network of _(GPU-enabled)_ Docker containers for analysis and sending back the results.

## Features

- Built on AWS services DynamoDB and S3
- Optimises file transfers with chunking and compression
- Handles file and message routing, including load balancing
- Results can only be read by the client that uploaded the file
- All file data is deleted after results are returned to the client
- All custom software components are isolated from inbound network traffic
- Allows clients to only update themselves to newer versions when they wish to

## Data Structure

```TypeScript
type Job = {
  status: 'COMPLETED', // 'QUEUED', 'PROCESSING', 'COMPLETED', 'ERROR'
  version: '2.5.21', // processors use version to decide whether to take the job
  created: '2025-09-25T11:21:51.690Z',
  bucket: 'file-processing-wrapper-production',
  file: 'file-1a026c06-e99c-4f2f-842c-cb01c51849af',
  chunks: 20, // number of chunks belonging to this file, chunks are uploaded with S3 key: <client>/<file>/<n>
  client: 'client-049aff50ff4d086b98c77aee0fffba31fd5ff1456db3ab173b515476b39daac602f61a8e69b9adab188f63dd93b89e8a33dc2e761e8c089a0c29cc86f0ae6769db', // secp256r1 public key

  // signed using client private key: JSON.stringify(<object with all properties above this line>)
  signature: '3045022100f693dcfc2931141219f861df40f36359948295c2018185fdff09d3d7f901b87202204bc66d70c8051276bc81167fd1cf531d12210d9fe8eef5be4ce62e6b0e377eac', 

  // Only one processor grabs this at any time because of ConditionExpression: "attribute_not_exists(processor)"
  processor: 'processor-0eeb217a-266f-4563-a582-60894057dc28',
  assigned: '2025-09-25T11:21:52.342Z',
  downloaded: '2025-09-25T11:22:08.620Z',

  // encrypted using client public key (client ID), can only be decrypted using client private key
  results: '0454d24adc888399517adb5930e9bc1c96cc1169ece00baf7a4809a15fcfe917bb7a00d3021f754924191532a1254a782ee4084d5545e2f53d3777ac59a971d80d:cb34b6d76357777dbc46b864:92688d043b45540fb831f7ccb2c88c2a:3095126d7998ac807d4878a2f38552b5e1b27f33f636ec9b96',
  error: '', // only contains text if status = 'ERROR'
  processed: '2025-09-25T11:22:19.915Z',
}
```

## Architecture

**Client:** Electron

1. Watch a disk folder for new files
2. Split file into chunks
3. Compress chunks _(zstd)_
4. Upload chunks _(S3)_
5. Create Job _(this happens right after the first chunk is uploaded, client only has create access)_
6. Receive Job updates _(wait for status == COMPLETED | ERROR)_
7. Delete chunks

**File Transporter:** S3 Multipart upload + Transfer Acceleration

**Database & Messaging Service:** DynamoDB with Streams

**Processor:** Container

1. Receive Job _(new requests)_
2. Update Job _(acknowledgement)_
3. Receive Job _(chunks available)_
4. Download chunks _(for each chunk)_
5. Decompress chunks _(zstd)_
6. Merge chunks
7. Send image to Analyzer
8. Receive results from Analyzer
9. Update Job _(analysis complete)_
10. Delete local image

**Analyzer:** Container

1. Receive image
2. __Run your analysis software__
3. Send results back

