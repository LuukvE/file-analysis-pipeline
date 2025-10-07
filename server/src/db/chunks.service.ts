import { type Chunk } from 'shared/types';
import { DynamoDB } from 'shared/dynamodb';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { DB_PROVIDER } from './db.provider';

@Injectable()
export class ChunksService implements OnModuleInit {
  private readonly table = 'chunks';

  constructor(
    @Inject(DB_PROVIDER) private readonly db: DynamoDB,
    private readonly events: EventEmitter2
  ) {}

  onModuleInit() {}

  async create(chunk: Chunk) {
    // TODO: Make this real
    chunk.url = `http://myamazingbucket.com/job/${chunk.job}-${chunk.index}`;

    return this.db.create<Chunk>(chunk, this.table);
  }
}
