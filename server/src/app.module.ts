import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DbModule } from './db/db.module';
import { AppGateway } from './app.gateway';
import { StatusController } from './status.controller';
import { SecretsModule } from './secrets/secrets.module';

@Module({
  imports: [EventEmitterModule.forRoot({ global: true }), DbModule, SecretsModule],
  controllers: [StatusController],
  providers: [AppGateway]
})
export class AppModule {}
