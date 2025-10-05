# File Analysis Pipeline

**Currently under development.** A secure, scalable pipeline for your existing data analysis engine.

This is a system aimed at importing files from desktop computers, delivering them to a scalable network of processors for analysis and sending back results.

## Features

- ⚡️ **Optimized Transfers -** Files are optimized for maximum throughput
- 🚀 **Distributed Scaling -** Jobs are handled by a network of processors
- 🔒 **Private Results -** Results are encrypted so that only the uploader can decrypt them
- 🛡️ **Attack Mitigation -** Processors are shielded from attacks by having no open inbound ports
- 🔄 **Controlled Updates -** Users choose when to update, while devs can still introduce breaking changes

## Architecture

- 💻 **Client:** Watch directory, Stream files, Sign up / in, Show system state, Manage organisations and users
- 🌐 **Server:** Create Presigned Upload URLs, Database management, Role-based authorization, SSO authentication
- ⚙️ **Processor:** Receive file stream, Run as node in scalable network, Communicate with sandboxed Engine
- 🤖 **Engine:** Perform file analysis, my example just counts file size _- Replace this with your AI_

## Reasoning

- Compress large files using multiple CPUs. The speed increase from having less to send over the network will outweigh the speed decrease of heavy compression.
- Chunk up large files while compressing them to avoid intermediate disk I/O and to allow for the processor to download the chunks already uploaded.
- Upload directly to S3. Reducing the file transfer time to S3 involves cutting out systems from the pipeline, direct client to S3 uploads are ideal.
- Use pre-signed upload URLs. Presigning gives the server the ability to authorize clients on a per-upload basis. Clients can be restricted when the limit of their payment plan is reached.
- Use SSO for authentication. Businesses already have on- and off-boarding procedures in-place. By using Microsoft and Google SSO, this system tries to minimise operational requirements.
- Use S3 _(binary data)_ and a custom NestJS server _(JSON data)_. This enables the processor with attached engine to pull data instead of requiring open inbound ports.
- Leverage the increased throughput of file transfers within AWS networks, which could outperform a direct client to processor upload stream depending on the network connections and usage.
- Support continuous deployments of new versions of each part of the stack, including versions with breaking changes. By using multiple processors that could be written for different versions, it allows gradual upgrading.
- Give clients control over their upgrade. Since customers might wish to run their own internal tests before adoption. This feature is especially important for critical systems managed by external customers.
- Use Docker Compose with a bridge network between the engine and processor. This ensures the engine can still be open to requests from the processor, without being accessible from anywhere else.
- Emulate AWS services using LocalStack, enabling improved testing and development with easily configurable IAM policies, DynamoDB tables and S3 buckets. This approach also allows for developer-specific mock data.
- Use AWS Cloud Development Kit to make the AWS-related services _(S3, DynamoDB, IAM, ECS with Fargate)_ easily portable and deployable.

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
  status: 'UPLOADED', // 'UPLOADING' | 'UPLOADED'
  chunks: 20, // This is updated whenever a new chunk has been uploaded
  processor: 'processor-0eeb217a-266f-4563-a582-60894057dc28',
  uploaded: '2025-09-25T11:22:04.342Z',
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
