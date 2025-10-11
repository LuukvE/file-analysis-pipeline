import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsMiddleware } from './metrics.middleware';

@Module({
  controllers: [MetricsController],
  providers: [MetricsMiddleware],
  exports: [MetricsMiddleware]
})
export class MetricsModule {}
