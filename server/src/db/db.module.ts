import { Module } from '@nestjs/common';
import { dbProvider } from './db.provider';
import { JobsService } from './jobs.service';
import { ChunksService } from './chunks.service';
import { ResultsService } from './results.service';

@Module({
  providers: [dbProvider, JobsService, ResultsService, ChunksService],
  exports: [JobsService, ResultsService, ChunksService]
})
export class DbModule {}
