import { EventEmitterModule } from '@nestjs/event-emitter';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { DbModule } from './db/db.module';
import { AppGateway } from './app.gateway';
import { AuthModule } from './auth/auth.module';
import { SecretsModule } from './secrets/secrets.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './metrics/metrics.middleware';

@Module({
  imports: [
    DbModule,
    AuthModule,
    MetricsModule,
    SecretsModule,
    EventEmitterModule.forRoot({ global: true })
  ],
  providers: [AppGateway]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
