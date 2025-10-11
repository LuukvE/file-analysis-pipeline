import { randomUUID } from 'crypto';
import { dynamodb, type Message, type Result } from 'shared';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { DB_PROVIDER } from './db.provider';

type ResultUpdate = Partial<Result> & Message;

export const RESULT_CHANGED_EVENT = 'db.result.changed';

@Injectable()
export class ResultsService implements OnModuleInit {
  private readonly table = 'results';

  constructor(
    @Inject(DB_PROVIDER) private readonly db: dynamodb.DynamoDB,
    private readonly events: EventEmitter2
  ) {}

  onModuleInit() {
    this.db.on('change:results', (result: Result) => {
      this.events.emit(RESULT_CHANGED_EVENT, result);
    });
  }

  async create(result: Result) {
    result.id = `result-${randomUUID()}`;

    return this.db.create<Result>(result, this.table);
  }

  async update(result: ResultUpdate, condition?: string) {
    return this.db.update<ResultUpdate>(result, this.table, condition);
  }
}
