import { randomUUID } from 'crypto';
import { dynamodb, type Message, type Job } from 'shared';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { DB_PROVIDER } from './db.provider';

type JobUpdate = Partial<Job> & Message;

export const JOB_CHANGED_EVENT = 'db.job.changed';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly table = 'jobs';

  constructor(
    @Inject(DB_PROVIDER) private readonly db: dynamodb.DynamoDB,
    private readonly events: EventEmitter2
  ) {}

  onModuleInit() {
    this.db.on('change:jobs', (job: Job) => {
      this.events.emit(JOB_CHANGED_EVENT, job);
    });
  }

  async create(job: Job) {
    job.id = `job-${randomUUID()}`;
    job.chunks = job.chunks || 0;

    return this.db.create<Job>(job, this.table);
  }

  async update(job: JobUpdate, condition?: string) {
    return this.db.update<JobUpdate>(job, this.table, condition);
  }
}
