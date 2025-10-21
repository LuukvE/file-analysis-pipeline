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

## Installation

```bash
# Ubuntu 24.04 LTS with Docker Desktop

# Bun 1.3
curl -fsSL https://bun.com/install | bash

# Chromium-compatible browser is required for Electron
# Any external browser is required for SSO
wget -P /tmp https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
sudo apt install -y /tmp/google-chrome-stable_current_amd64.deb && \
rm /tmp/google-chrome-stable_current_amd64.deb

# Node is required to run electron-builder
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 22

# Within repo root
bun install
cd client
bun install
bun run setup # Configure protocol for Electron

# Tip: Run the default build task with `Ctrl-Shift-B` to launch everything

# Or run:
bun run aws # LocalStack emulator
bun run server
bun run processor
bun run engine
bun run client
bun run monitor # Grafana
```

## Reasoning

- When autoscaling the server, use the NodeJS event loop lag as a metric, in combination with request rate and latency. (TODO)
- Secrets are handled by AWS Secret Manager, but for local development I inject my secrets into that manager from json files in the root.
- Compress large files using multiple CPUs. The speed increase from having less to send over the network will outweigh the speed decrease of heavy compression.
- Chunk up large files while compressing them to avoid intermediate disk I/O and to allow for the processor to download the chunks already uploaded.
- Upload directly to S3. Reducing the file transfer time to S3 involves cutting out systems from the pipeline, direct client to S3 uploads are ideal.
- Use pre-signed upload URLs. Presigning gives the server the ability to authorize clients on a per-upload basis. Clients can be restricted when the limit of their payment plan is reached.
- Use SSO for authentication. Businesses already have on- and off-boarding procedures in-place. By using Microsoft and Google SSO, this system tries to minimise operational requirements.
- Use S3 _(binary data)_ and a custom NestJS server _(JSON data)_. This enables the processor with attached engine to pull data instead of requiring open inbound ports.
- Leverage the increased throughput of file transfers within AWS networks, which could outperform a direct client to processor upload stream depending on the network connections and usage.
- Use Docker Compose with a bridge network between the engine and processor. This ensures the engine can still be open to requests from the processor, without being accessible from anywhere else.
- Emulate AWS services using LocalStack, enabling improved testing and development with easily configurable IAM policies, DynamoDB tables, S3 buckets and secrets. This approach also allows for developer-specific mock data.
