import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DbModule } from './db/db.module';
import { AppGateway } from './app.gateway';

@Module({
  imports: [EventEmitterModule.forRoot(), DbModule],
  controllers: [],
  providers: [AppGateway]
})
export class AppModule {}
