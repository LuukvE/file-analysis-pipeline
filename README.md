# File Analysis Pipeline

A secure, scalable pipeline for your existing data analysis engine.

This is a prototype aimed at importing files from desktop computers, delivering them to a scalable network of processors for analysis and sending back the results. Supports both cloud- and on-premise Docker containers. All authentication and communication is provided by AWS IAM, S3 and DynamoDB services.

## Features

- ⚡️ **Optimized Transfers -** Files are optimized for maximum throughput
- 🚀 **Distributed Scaling -** Jobs are handled by a network of processors
- 🔒 **Private Results -** Results are encrypted so that only the uploader can decrypt them
- 🛡️ **Attack Mitigation -** Processors are shielded from attacks by having no open inbound ports
- ⚙️ **Controlled Updates -** Users choose when to update, while devs can still introduce breaking changes

## Architecture

### Client: _Electron_

1. Watch a folder for new files
2. Convert file into stream of compressed chunks _- xz_
3. Upload chunks _- S3_
4. Create job _- DynamoDB_
5. Get result

### Processor: _Docker Container_

1. Listen for new jobs
2. Validate signature
3. Take job
4. Download chunks then delete from S3
5. Recreate file _- xz_
6. Send file to Engine
7. Receive payload from Engine
8. Encrypt payload
9. Create result
10. Delete local file

### Engine: _Docker Container_

1. Receive file
2. **Run your analysis software**
3. Send back JSON payload

## Data Structure

```TypeScript
const Job = {
  id: 'job-9dfbe20e-2efd-4f62-b51e-9b230f60429b',
  version: '2.5.21', // processors use version to decide whether to take the job
  created: '2025-09-25T11:21:51.690Z',
  bucket: 'dublin-file-analysis-pipeline-bucket',
  region: 'eu-west-1',
  file: 'file-1a026c06-e99c-4f2f-842c-cb01c51849af',
  client: 'client-049aff50ff4d086b98c77aee0fffba31fd5ff1456db3ab173b515476b39daac602f61a8e69b9adab188f63dd93b89e8a33dc2e761e8c089a0c29cc86f0ae6769db', // secp256r1 public key
  // signed using client private key: JSON.stringify(<object with all properties above this line>)
  signature: '3045022100f693dcfc2931141219f861df40f36359948295c2018185fdff09d3d7f901b87202204bc66d70c8051276bc81167fd1cf531d12210d9fe8eef5be4ce62e6b0e377eac',
  status: 'PROCESSED', // 'UPLOADING', 'UPLOADED', 'PROCESSING', 'PROCESSED', 'ERROR'
  chunks: 20, // This is updated whenever a new chunk has been uploaded
  processor: 'processor-0eeb217a-266f-4563-a582-60894057dc28',
  assigned: '2025-09-25T11:21:52.342Z',
  uploaded: '2025-09-25T11:22:04.342Z',
  downloaded: '2025-09-25T11:22:08.620Z'
}
```

```TypeScript
const Result = {
  id: 'result-c1e0af22-a56e-41fd-9118-fe86ee14b13b',
  client: 'client-049aff50ff4d086b98c77aee0fffba31fd5ff1456db3ab173b515476b39daac602f61a8e69b9adab188f63dd93b89e8a33dc2e761e8c089a0c29cc86f0ae6769db', // secp256r1 public key
  // encrypted using client public key (client ID), can only be decrypted using client private key
  payload: '0454d24adc888399517adb5930e9bc1c96cc1169ece00baf7a4809a15fcfe917bb7a00d3021f754924191532a1254a782ee4084d5545e2f53d3777ac59a971d80d:cb34b6d76357777dbc46b864:92688d043b45540fb831f7ccb2c88c2a:3095126d7998ac807d4878a2f38552b5e1b27f33f636ec9b96'
}
```
