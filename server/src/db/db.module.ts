import { Module } from '@nestjs/common';
import { dbProvider } from './db.provider';
import { JobsService } from './jobs.service';
import { ResultsService } from './results.service';

@Module({
  providers: [dbProvider, JobsService, ResultsService],
  exports: [JobsService, ResultsService]
})
export class DbModule {}
