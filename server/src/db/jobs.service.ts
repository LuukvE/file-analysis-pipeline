import { Job } from 'shared/types';
import { DynamoDB } from 'shared/dynamodb';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { DB_PROVIDER } from './db.provider';

type JobUpdate = Partial<Job> & { id: string };

export const JOB_CHANGED_EVENT = 'db.job.changed';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly table = 'jobs';

  constructor(
    @Inject(DB_PROVIDER) private readonly db: DynamoDB,
    private readonly events: EventEmitter2
  ) {}

  onModuleInit() {
    this.db.on('change:jobs', (job: Job) => {
      this.events.emit(JOB_CHANGED_EVENT, job);
    });
  }

  async create(job: Job) {
    return this.db.create<Job>(job, this.table);
  }

  async update(job: JobUpdate, condition?: string) {
    return this.db.update<JobUpdate>(job, this.table, condition);
  }
}
