import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = process.hrtime();

    res.on('finish', () => {
      const route = req.route ? req.route.path : req.originalUrl;
      
      if (route === '/metrics') return;

      const diff = process.hrtime(startTime);
      const durationInSeconds = diff[0] + diff[1] / 1e9;
      const method = req.method;
      const statusCode = res.statusCode;

      this.metricsService.incrementHttpRequestsTotal(method, route, statusCode);

      this.metricsService.observeHttpRequestDuration(
        method,
        route,
        statusCode,
        durationInSeconds
      );
    });

    next();
  }
}
