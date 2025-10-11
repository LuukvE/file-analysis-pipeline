import { randomUUID } from 'crypto';
import { type Chunk, dynamodb } from 'shared';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { DB_PROVIDER } from './db.provider';

const REGION = process.env['AWS_REGION'];
const BUCKET = process.env['AWS_BUCKET'];

export const CHUNK_CHANGED_EVENT = 'db.chunk.changed';

@Injectable()
export class ChunksService implements OnModuleInit {
  private readonly s3: S3Client;
  private readonly table = 'chunks';

  constructor(
    @Inject(DB_PROVIDER) private readonly db: dynamodb.DynamoDB,
    private readonly events: EventEmitter2
  ) {
    this.s3 = new S3Client({ region: REGION, forcePathStyle: true });
  }

  onModuleInit() {
    this.db.on('change:chunks', (chunk: Chunk) => {
      this.events.emit(CHUNK_CHANGED_EVENT, chunk);
    });
  }

  async create(chunk: Chunk) {
    const Key = `${chunk.job}-${chunk.index}`;
    const command = new PutObjectCommand({ Bucket: BUCKET, Key });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    chunk.id = `chunk-${randomUUID()}`;

    chunk.url = ['http://localhost:4566', ...url.split('/').slice(3)].join('/');

    return this.db.create<Chunk>(chunk, this.table);
  }
}
