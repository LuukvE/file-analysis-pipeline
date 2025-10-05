import { Result } from 'shared/types';
import { DynamoDB } from 'shared/dynamodb';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { DB_PROVIDER } from './db.provider';

type ResultUpdate = Partial<Result> & { id: string };

export const RESULT_CHANGED_EVENT = 'db.result.changed';

@Injectable()
export class ResultsService implements OnModuleInit {
  private readonly table = 'results';

  constructor(
    @Inject(DB_PROVIDER) private readonly db: DynamoDB,
    private readonly events: EventEmitter2
  ) {}

  onModuleInit() {
    this.db.on('change:results', (result: Result) => {
      this.events.emit(RESULT_CHANGED_EVENT, result);
    });
  }

  async create(result: Result) {
    return this.db.create<Result>(result, this.table);
  }

  async update(result: ResultUpdate, condition?: string) {
    return this.db.update<ResultUpdate>(result, this.table, condition);
  }
}
