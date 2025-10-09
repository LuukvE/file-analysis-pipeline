import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DbModule } from './db/db.module';
import { AppGateway } from './app.gateway';
import { AuthModule } from './auth/auth.module';
import { SecretsModule } from './secrets/secrets.module';

@Module({
  imports: [EventEmitterModule.forRoot({ global: true }), DbModule, SecretsModule, AuthModule],
  controllers: [],
  providers: [AppGateway]
})
export class AppModule {}
