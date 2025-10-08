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
